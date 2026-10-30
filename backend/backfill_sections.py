"""One time: add section labels (Week-4 ...) to the chunks that are already stored. No re-embedding needed.

Run inside the api container:  python backend/backfill_sections.py
"""
import os
from collections import defaultdict
from types import SimpleNamespace

from qdrant_client import QdrantClient

from sections import tag_chunks

COLLECTION = "documind"


def run(client):
    by_source = defaultdict(list)
    offset = None
    while True:
        points, offset = client.scroll(COLLECTION, limit=500, offset=offset, with_payload=True)
        for p in points:
            meta = p.payload.get("metadata", {})
            by_source[meta.get("source", "?")].append((meta.get("chunk_id", 0), p))
        if offset is None:
            break
    for src, items in by_source.items():
        items.sort(key=lambda t: t[0])
        fake = [SimpleNamespace(page_content=p.payload["page_content"], metadata={"source": src}) for _, p in items]
        tag_chunks(fake)
        labelled = 0
        for (_, p), f in zip(items, fake):
            client.set_payload(COLLECTION, payload={"sections": f.metadata["sections"]}, key="metadata", points=[p.id])
            labelled += bool(f.metadata["sections"])
        print(f"{src}: {len(items)} chunks, {labelled} with a section label")


if __name__ == "__main__":
    run(QdrantClient(url=os.getenv("QDRANT_URL", "http://localhost:6333")))
