import json
import os
import shutil
import time
from collections import Counter
from fastapi import Depends, FastAPI, File, HTTPException, Request, UploadFile
from pydantic import BaseModel
from qdrant_client import QdrantClient, models
import auth
import shares
from answer import answer_full, page_key
from chitchat import small_talk
from sections import tag_chunks
from ingest import load_pdf, split_docs
from scope import SHARED, visible_filter
from store import store_chunks, COLLECTION

from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse


app = FastAPI(title="DocuMind")
client = QdrantClient(url=os.getenv("QDRANT_URL", "http://localhost:6333"))



class Question(BaseModel):
    question: str
    model: str | None = None
    doc: str | None = None
    history: list[dict] | None = None  # earlier messages: {"role", "text"}
    regen: str | None = None  # "detailed", "shorter" or "different"


class ShareBody(BaseModel):
    id: str | None = None
    title: str = ""
    messages: list[dict]

class Feedback(BaseModel):
    question: str
    answer: str
    rating: str  # "up" or "down"
    doc: str | None = None
    model: str | None = None


def remove_old(source):
    #delete chunks of this file if it was uploaded before
    if client.collection_exists(COLLECTION):
        client.delete(
            collection_name=COLLECTION,
            points_selector=models.FilterSelector(
                filter=models.Filter(
                    must=[
                        models.FieldCondition(
                            key="metadata.source",
                            match=models.MatchValue(value=source),
                        )
                    ]
                )
            )
        )    


def has_chunks(owner):
    if not client.collection_exists(COLLECTION):
        return False
    return client.count(COLLECTION, count_filter=visible_filter(owner), exact=True).count > 0


def own_sources(uid):
    """Distinct file paths this user uploaded (shared sample documents are not included)."""
    seen, offset = set(), None
    if not client.collection_exists(COLLECTION):
        return seen
    flt = models.Filter(
        must=[models.FieldCondition(key="metadata.owner", match=models.MatchValue(value=uid))]
    )
    while True:
        points, offset = client.scroll(
            COLLECTION, limit=500, offset=offset, scroll_filter=flt, with_payload=True, with_vectors=False
        )
        for p in points:
            seen.add((p.payload or {}).get("metadata", {}).get("source"))
        if offset is None:
            break
    return seen


@app.post("/auth/signup")
def signup(body: auth.Credentials, request: Request):
    return auth.signup(body, request)


@app.post("/auth/login")
def login(body: auth.Credentials, request: Request):
    return auth.login(body, request)


@app.post("/auth/demo")
def demo(request: Request):
    return auth.demo(request)


@app.get("/auth/me")
def me(user=Depends(auth.current_user)):
    return {"id": user["id"], "email": user["email"], "guest": user["guest"], "limits": auth.user_limits(user)}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/ingest")
def ingest(file: UploadFile = File(...), user=Depends(auth.current_user)):
    uid = user["id"]
    name = os.path.basename(file.filename or "")
    if not name.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    path = f"data/{uid}/{name}"
    mine = own_sources(uid)
    if path not in mine and len(mine) >= auth.user_limits(user)["docs"]:
        raise HTTPException(
            status_code=403,
            detail=f"Document limit reached ({auth.user_limits(user)['docs']}). Delete one first.",
        )
    auth.limit_upload(user)
    os.makedirs(f"data/{uid}", exist_ok=True)
    part = path + ".part"  # read from a temporary copy so a bad upload never replaces a good file
    with open(part, "wb") as f:
        shutil.copyfileobj(file.file, f)
    if os.path.getsize(part) > auth.MAX_PDF_MB * 1024 * 1024:
        os.remove(part)
        raise HTTPException(status_code=413, detail=f"PDF is too large (max {auth.MAX_PDF_MB} MB).")
    try:
        pages = load_pdf(part)
    except Exception:
        os.remove(part)
        raise HTTPException(status_code=400, detail="This file could not be read. Is it a valid PDF?")
    if len(pages) > auth.MAX_PAGES:
        os.remove(part)
        raise HTTPException(status_code=413, detail=f"PDF has too many pages (max {auth.MAX_PAGES}).")
    if sum(len(p.page_content.strip()) for p in pages) < 50:
        os.remove(part)
        raise HTTPException(
            status_code=422,
            detail="No readable text found. This PDF looks like scanned images. Please upload a PDF with selectable text.",
        )
    for p in pages:
        p.metadata["source"] = path
        p.metadata["owner"] = uid
    os.replace(part, path)
    chunks = tag_chunks(split_docs(pages))
    remove_old(path)
    store_chunks(chunks)
    return {"file": name, "chunks": len(chunks)}


CACHE_FILE = "data/answer_cache.json"
_cache = None


def _load_cache():
    global _cache
    if _cache is None:
        try:
            with open(CACHE_FILE, encoding="utf-8") as f:
                _cache = json.load(f)
        except Exception:
            _cache = {}
    return _cache


def _save_cache():
    try:
        os.makedirs("data", exist_ok=True)
        with open(CACHE_FILE, "w", encoding="utf-8") as f:
            json.dump(_cache, f)
    except Exception:
        pass


def _cache_key(question, doc):
    q = " ".join(question.lower().split()).rstrip("?. ")
    return q + "|" + (os.path.basename(doc) if doc else "")



@app.post("/query")
def query(body: Question, user=Depends(auth.current_user)):
    uid = user["id"]
    auth.limit_question(user)
    if not small_talk(body.question) and not has_chunks(uid):
        return {
            "answer": "No documents yet. Use Attach PDF to upload one, then ask your question.",
            "sources": [],
            "pages": [],
            "kind": "chat",
        }
    # cache only plain questions from users who have no uploads (they only see the shared documents)
    plain = not body.history and not body.regen and not small_talk(body.question) and not own_sources(uid)
    key = _cache_key(body.question, body.doc)
    if plain:
        saved = _load_cache().get(key)
        if saved:
            return {**saved, "cached": True}
    auth.hit(
        ("global",),
        int(os.getenv("DAILY_CAP", "120")),
        86400,
        "DocuMind has reached its free daily limit. Please try again tomorrow. The example questions still work.",
    )
    text, cites, kind, asked, used = answer_full(
        body.question,
        model=body.model,
        doc=body.doc,
        history=(body.history or [])[-6:],
        regen=body.regen,
        owner=uid,
    )
    pages = sorted({c["page"] for c in cites}, key=page_key)
    result = {
        "answer": text,
        "sources": cites,
        "pages": pages,
        "kind": kind,
        "asked": asked,
        "model_used": used,
    }
    if plain and kind in ("answer", "no_answer") and len(_load_cache()) < 500:
        _cache[key] = result
        _save_cache()
    return result


@app.post("/feedback")
def feedback(body: Feedback, user=Depends(auth.current_user)):
    os.makedirs("data", exist_ok=True)
    row = body.model_dump()
    row["user"] = user["id"]
    row["time"] = time.strftime("%Y-%m-%d %H:%M:%S")
    with open(os.path.join("data", "feedback.jsonl"), "a", encoding="utf-8") as f:
        f.write(json.dumps(row, ensure_ascii=False) + "\n")
    return {"saved": True}


@app.post("/share")
def share_create(body: ShareBody, user=Depends(auth.current_user)):
    return shares.create(user, body.id, body.title, body.messages)


@app.get("/share/{sid}")
def share_get(sid: str, request: Request):
    auth.hit(("sv", auth.client_ip(request)), 60, 60, "Too many requests. Please wait a minute.")
    return shares.read(sid)


@app.delete("/share/{sid}")
def share_delete(sid: str, user=Depends(auth.current_user)):
    return shares.remove(user, sid)



@app.get("/files/{name}")
def get_file(name: str, user=Depends(auth.file_user)):
    safe = os.path.basename(name)
    if not safe.lower().endswith(".pdf"):
        raise HTTPException(status_code=404, detail="File not found")
    for path in (f"data/{user['id']}/{safe}", f"data/{safe}"):  # own file first, then shared samples
        if os.path.isfile(path):
            return FileResponse(path, media_type="application/pdf")
    raise HTTPException(status_code=404, detail="File not found")


@app.delete("/documents/{name}")
def delete_document(name: str, user=Depends(auth.current_user)):
    safe = os.path.basename(name)
    path = f"data/{user['id']}/{safe}"
    if path not in own_sources(user["id"]):
        raise HTTPException(status_code=403, detail="Sample documents cannot be deleted.")
    remove_old(path)
    if os.path.isfile(path):
        os.remove(path)
    return {"deleted": safe}


@app.get("/documents")
def documents(user=Depends(auth.current_user)):
    if not client.collection_exists(COLLECTION):
        return []
    counts, shared = Counter(), {}
    offset = None
    while True:
        points, offset = client.scroll(
            COLLECTION,
            limit=500,
            offset=offset,
            scroll_filter=visible_filter(user["id"]),
            with_payload=True,
            with_vectors=False,
        )
        for p in points:
            meta = (p.payload or {}).get("metadata", {})
            n = meta.get("source", "unknown").replace("\\", "/").split("/")[-1]
            counts[n] += 1
            shared[n] = meta.get("owner") == SHARED
        if offset is None:
            break
    return [
        {"name": n, "chunks": c, "status": "ready", "shared": shared[n]} for n, c in counts.items()
    ]


DIST = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "web", "dist")

if os.path.isdir(DIST):
    app.mount("/assets", StaticFiles(directory=os.path.join(DIST, "assets")), name="assets")

    @app.get("/")
    def index():
        return FileResponse(os.path.join(DIST, "index.html"))

    
    @app.get("/s/{sid}")
    def shared_page(sid: str):
        return FileResponse(os.path.join(DIST, "index.html"))

    
    def _spa():
        return FileResponse(os.path.join(DIST, "index.html"))

    for _p in ("features", "how-it-works", "results", "pricing", "about", "contact", "login"):
        app.add_api_route("/" + _p, _spa, methods=["GET"], include_in_schema=False)
