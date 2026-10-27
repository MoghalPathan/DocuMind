import json
import os
import shutil
import time
from collections import Counter
from fastapi import FastAPI, File, HTTPException, UploadFile
from pydantic import BaseModel
from qdrant_client import QdrantClient, models
from answer import answer_full, page_key
from chitchat import small_talk
from ingest import load_pdf, split_docs
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


def has_chunks():
    return client.collection_exists(COLLECTION) and client.count(COLLECTION).count > 0


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/ingest")
def ingest(file: UploadFile = File(...)):
    name = os.path.basename(file.filename or "")
    if not name.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    os.makedirs("data", exist_ok=True)
    path = os.path.join("data", name)
    part = path + ".part"  # read from a temporary copy so a bad upload never replaces a good file
    with open(part, "wb") as f:
        shutil.copyfileobj(file.file, f)
    try:
        pages = load_pdf(part)
    except Exception:
        os.remove(part)
        raise HTTPException(status_code=400, detail="This file could not be read. Is it a valid PDF?")
    if sum(len(p.page_content.strip()) for p in pages) < 50:
        os.remove(part)
        raise HTTPException(
            status_code=422,
            detail="No readable text found. This PDF looks like scanned images. Please upload a PDF with selectable text.",
        )
    for p in pages:
        p.metadata["source"] = path
    os.replace(part, path)
    chunks = split_docs(pages)
    remove_old(path)
    store_chunks(chunks)
    return {"file": name, "chunks": len(chunks)}


@app.post("/query")
def query(body: Question):
    if not small_talk(body.question) and not has_chunks():
        return {
            "answer": "No documents yet. Use Attach PDF to upload one, then ask your question.",
            "sources": [],
            "pages": [],
            "kind": "chat",
        }
    text, cites, kind, asked = answer_full(
        body.question,
        model=body.model,
        doc=body.doc,
        history=(body.history or [])[-6:],
        regen=body.regen,
    )
    pages = sorted({c["page"] for c in cites}, key=page_key)
    return {"answer": text, "sources": cites, "pages": pages, "kind": kind, "asked": asked}


@app.post("/feedback")
def feedback(body: Feedback):
    os.makedirs("data", exist_ok=True)
    row = body.model_dump()
    row["time"] = time.strftime("%Y-%m-%d %H:%M:%S")
    with open(os.path.join("data", "feedback.jsonl"), "a", encoding="utf-8") as f:
        f.write(json.dumps(row, ensure_ascii=False) + "\n")
    return {"saved": True}


@app.get("/files/{name}")
def get_file(name: str):
    path = os.path.join("data", os.path.basename(name))
    if not name.lower().endswith(".pdf") or not os.path.isfile(path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(path, media_type="application/pdf")


@app.delete("/documents/{name}")
def delete_document(name: str):
    safe = os.path.basename(name)
    remove_old("data/" + safe)
    path = os.path.join("data", safe)
    if os.path.isfile(path):
        os.remove(path)
    return {"deleted": safe}


@app.get("/documents")
def documents():
    if not client.collection_exists(COLLECTION):
        return []
    counts = Counter()
    offset = None
    while True:
        points, offset = client.scroll(
            COLLECTION, limit=500, offset=offset, with_payload=True, with_vectors=False
        )
        for p in points:
            src = (p.payload or {}).get("metadata", {}).get("source", "unknown")
            counts[src.replace("\\", "/").split("/")[-1]] += 1
        if offset is None:
            break
    return [{"name": n, "chunks": c, "status": "ready"} for n, c in counts.items()]


DIST = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "web", "dist")

if os.path.isdir(DIST):
    app.mount("/assets", StaticFiles(directory=os.path.join(DIST, "assets")), name="assets")

    @app.get("/")
    def index():
        return FileResponse(os.path.join(DIST, "index.html"))
