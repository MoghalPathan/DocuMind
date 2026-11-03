"""Streaming answers: the same steps as answer_full, but the text is sent while it is written."""
import json
import os
import time

import httpx
from langchain_groq import ChatGroq

import answer as base
from chitchat import small_talk
from search import search_wide


def _stream_groq(prompt, model, temperature):
    llm = ChatGroq(model=model, temperature=temperature, max_retries=0)
    for chunk in llm.stream(prompt):
        if chunk.content:
            yield chunk.content


def _stream_gemini(prompt, temperature):
    key = os.getenv("GEMINI_API_KEY")
    if not key:
        raise RuntimeError("no Gemini key")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{base.GEMINI_MODEL}:streamGenerateContent?alt=sse"
    body = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": temperature},
    }
    with httpx.stream("POST", url, json=body, headers={"x-goog-api-key": key}, timeout=60) as r:
        r.raise_for_status()
        for line in r.iter_lines():
            if not line.startswith("data:"):
                continue
            try:
                data = json.loads(line[5:])
                parts = data["candidates"][0]["content"]["parts"]
            except (KeyError, IndexError, ValueError):
                continue
            text = "".join(p.get("text", "") for p in parts)
            if text:
                yield text


def stream_text(prompt, model, temperature):
    """Yields ("delta", text) pieces, then ("model", name). Moves to the backup model if one fails before any text."""
    for m in base._models_to_try(model):
        got = False
        try:
            pieces = _stream_gemini(prompt, temperature) if m == base.GEMINI_MODEL else _stream_groq(prompt, m, temperature)
            for piece in pieces:
                got = True
                yield ("delta", piece)
            if not got:
                raise RuntimeError("empty answer")
            yield ("model", m)
            return
        except Exception:
            base._busy_until[m] = time.time() + base.COOLDOWN_SECONDS
            if got:  # failed half way: keep the part we already sent
                yield ("model", m)
                return
    raise base.Busy("all models are busy")


def _cites(text, docs):
    cites, seen = [], set()
    for d in base.used_chunks(text, docs):
        key = (base.doc_name(d), base.page_of(d))
        if key in seen:
            continue
        seen.add(key)
        cites.append({"doc": key[0], "page": key[1], "pdf_page": int(d.metadata.get("page", 0)) + 1, "text": base.snippet(d)})
    cites.sort(key=lambda c: (c["doc"], base.page_key(c["page"])))
    return cites


def answer_stream(question, model=None, doc=None, history=None, regen=None, owner=None):
    """Yields {"t": "delta", "text"} pieces and finally one {"t": "done", ...} with the full result."""
    chat = small_talk(question)
    if chat:
        yield {"t": "done", "answer": chat, "sources": [], "pages": [], "kind": "chat", "asked": question, "model_used": None}
        return
    asked = base.rewrite_question(question, history or [], model, True)
    docs = search_wide(asked, doc=doc, owner=owner)
    context = "\n\n".join(d.page_content for d in docs)
    prompt = base.PROMPT.format(context=context, question=asked)
    hint = base.REGEN_HINTS.get(regen or "")
    if hint:
        prompt = prompt.rsplit("Answer:", 1)[0] + hint + "\nAnswer:"
    temp = 0.5 if regen else 0
    parts, used = [], None
    try:
        for what, value in stream_text(prompt, model or base.DEFAULT_MODEL, temp):
            if what == "delta":
                parts.append(value)
                yield {"t": "delta", "text": value}
            else:
                used = value
    except base.Busy:
        yield {"t": "done", "answer": base.BUSY_TEXT, "sources": [], "pages": [], "kind": "busy", "asked": asked, "model_used": None}
        return
    text = "".join(parts).strip()
    cites = _cites(text, docs)
    kind = "answer"
    if text.lower().replace("’", "'").startswith("i don't know"):
        cites, kind = [], "no_answer"
    pages = sorted({c["page"] for c in cites}, key=base.page_key)
    yield {"t": "done", "answer": text, "sources": cites, "pages": pages, "kind": kind, "asked": asked, "model_used": used}
