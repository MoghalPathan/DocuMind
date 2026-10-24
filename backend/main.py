import os 
import shutil
from collections import Counter
from fastapi import FastAPI, File, UploadFile
from pydantic import BaseModel
from qdrant_client import QdrantClient, models
from answer import answer
from ingest import load_pdf, split_docs
from store import store_chunks, COLLECTION

from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse


app = FastAPI(title="DocuMind")
client = QdrantClient(url=os.getenv("QDRANT_URL", "http://localhost:6333"))



class Question(BaseModel):
    question: str


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


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/ingest")
def ingest(file: UploadFile = File(...)):
    os.makedirs("data", exist_ok=True)
    path = os.path.join("data", os.path.basename(file.filename))
    with open(path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    chunks = split_docs(load_pdf(path))
    remove_old(path)
    store_chunks(chunks)
    return {"file": file.filename, "chunks": len(chunks)}


@app.post("/query")
def query(body: Question):
    text, pages = answer(body.question)
    return {"answer": text, "sources": pages}


@app.get("/documents")
def documents():
    client =QdrantClient(url=os.getenv("QDRANT_URL", "http://localhost:6333"))
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
    return [{"name": n, "chunks": c} for n, c in counts.items() ]    


DIST = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "web", "dist")

if os.path.isdir(DIST):
    app.mount("/assets", StaticFiles(directory=os.path.join(DIST, "assets")), name="assets")

    @app.get("/")
    def index():
        return FileResponse(os.path.join(DIST, "index.html"))
    