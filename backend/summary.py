"""One-click summary of a whole PDF.

The PDF is already split into chunks. For a summary we take chunks spread evenly across the whole
document (so the start, middle and end are all covered), keep them in page order, and ask the AI to
summarise only those excerpts. Results are cached so a repeat click costs nothing.
"""
import json
import os
import re
import time

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from qdrant_client import QdrantClient

import auth
from answer import BUSY_TEXT, DEFAULT_MODEL, Busy, ask_llm
from scope import SHARED, visible_filter

router = APIRouter()

COLLECTION = "documind"
MAX_EXCERPTS = 14  # about 3,500 tokens: fits the free per-minute limit
EXCERPT_CHARS = 800
CACHE_FILE = os.path.join(auth.DATA, "summary_cache.json")
CACHE_MAX = 300

PROMPT = """You summarise a document using ONLY the excerpts below.
The excerpts are taken from across the whole document, in page order. Each starts with its page number.

Write the summary in this format:
1. One sentence saying what the document is.
2. Then 4 to 6 short bullet points covering the main topics or contents.
Put the page number in brackets after each bullet, like (p.5) or (p.5, p.9).
Use only facts that appear in the excerpts. Do not guess or add outside knowledge.
Do not use emoji.

Excerpts:
{context}

Summary:"""

_client_cache = None


def _client():
    global _client_cache
    if _client_cache is None:
        _client_cache = QdrantClient(url=os.getenv("QDRANT_URL", "http://localhost:6333"))
    return _client_cache


class SummaryBody(BaseModel):
    question: str | None = None
    model: str | None = None
    doc: str | None = None
    regen: str | None = None
    history: list[dict] | None = None


def _page_label(meta):
    return str(meta.get("page_label") or int(meta.get("page", 0)) + 1)


def _load_cache():
    try:
        with open(CACHE_FILE, encoding="utf-8") as f:
            return json.load(f)
    except Exception:  # noqa: BLE001
        return {}


def _save_cache(cache):
    os.makedirs(auth.DATA, exist_ok=True)
    if len(cache) > CACHE_MAX:
        for k in list(cache)[: len(cache) - CACHE_MAX]:
            cache.pop(k, None)
    tmp = CACHE_FILE + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(cache, f)
    os.replace(tmp, CACHE_FILE)


def pick_evenly(items, n):
    if len(items) <= n:
        return list(items)
    return [items[round(i * (len(items) - 1) / (n - 1))] for i in range(n)]


def chunks_of(doc, owner):
    """All chunks of one document that this user may see, in reading order."""
    c = _client()
    if not c.collection_exists(COLLECTION):
        return []
    flt = visible_filter(owner, doc=doc)
    out, offset = [], None
    while True:
        points, offset = c.scroll(
            COLLECTION, limit=500, offset=offset, scroll_filter=flt, with_payload=True, with_vectors=False
        )
        out.extend(points)
        if offset is None:
            break
    rows = []
    for p in out:
        pl = p.payload or {}
        meta = pl.get("metadata", {})
        rows.append((int(meta.get("page", 0)), int(meta.get("chunk_id", 0)), meta, pl.get("page_content", "")))
    rows.sort(key=lambda r: (r[0], r[1]))
    return rows


@router.post("/summarise")
def summarise(body: SummaryBody, user=Depends(auth.current_user)):
    doc = os.path.basename(body.doc or "")
    if not doc:
        raise HTTPException(status_code=400, detail="Choose one PDF to summarise.")
    rows = chunks_of(doc, user["id"])
    if not rows:
        raise HTTPException(status_code=404, detail="Document not found.")
    shared = rows[0][2].get("owner") == SHARED
    key = f"{'shared' if shared else user['id']}|{doc}|{len(rows)}"
    cache = _load_cache()
    fresh = bool(body.regen)
    if key in cache and not fresh:
        hit = cache[key]
        return {**hit, "cached": True}

    auth.limit_question(user)
    picked = pick_evenly(rows, MAX_EXCERPTS)
    context = "\n\n".join(f"[page {_page_label(m)}]\n{t.strip()[:EXCERPT_CHARS]}" for _, _, m, t in picked)
    prompt = PROMPT.format(context=context)
    try:
        reply = ask_llm(prompt, body.model or DEFAULT_MODEL, temperature=0.4 if fresh else 0)
    except Busy:
        return {"answer": BUSY_TEXT, "sources": [], "pages": [], "kind": "busy", "asked": body.question, "model_used": None}
    text = reply.content.strip()

    wanted = set(re.findall(r"p\.?\s*(\d+)", text))
    cites, seen = [], set()
    for page, _, m, _t in picked:
        label = _page_label(m)
        if label in wanted and label not in seen:
            seen.add(label)
            cites.append({"doc": doc, "page": label, "pdf_page": page + 1})
    cites.sort(key=lambda c: int(c["page"]) if c["page"].isdigit() else 0)
    result = {
        "answer": text,
        "sources": cites,
        "pages": [c["page"] for c in cites],
        "kind": "answer",
        "asked": body.question,
        "model_used": reply.model,
    }
    if not fresh:
        cache[key] = result
        _save_cache(cache)
    return result
