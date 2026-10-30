"""Rename a shared sample document and drop the old document that already has the new name.

Usage (inside the api container):
    python backend/rename_shared.py "<current file name>" "<new file name>"
"""
import os
import sys

from qdrant_client import QdrantClient, models

from store import COLLECTION

if len(sys.argv) != 3:
    sys.exit('Usage: python backend/rename_shared.py "<current name>" "<new name>"')

old, new = sys.argv[1], sys.argv[2]
client = QdrantClient(url=os.getenv("QDRANT_URL", "http://localhost:6333"))


def flt(name):
    return models.Filter(
        must=[models.FieldCondition(key="metadata.source", match=models.MatchValue(value="data/" + name))]
    )


def count(name):
    return client.count(COLLECTION, count_filter=flt(name), exact=True).count


print(f"Before: '{old}' has {count(old)} chunks, '{new}' has {count(new)} chunks")
if count(old) == 0:
    sys.exit("Nothing to rename: no chunks found for the current name. Check the spelling.")
if os.path.exists("data/" + new):
    sys.exit(f"A file named data/{new} already exists. Move it away first.")

client.delete(COLLECTION, points_selector=models.FilterSelector(filter=flt(new)))
client.set_payload(
    COLLECTION,
    payload={"source": "data/" + new},
    key="metadata",
    points=models.FilterSelector(filter=flt(old)),
)
if os.path.isfile("data/" + old):
    os.rename("data/" + old, "data/" + new)
else:
    print(f"Warning: data/{old} was not found, so no PDF file was renamed.")
if os.path.isfile("data/answer_cache.json"):
    os.remove("data/answer_cache.json")  # cached answers still carry the old name

print(f"After: '{old}' has {count(old)} chunks, '{new}' has {count(new)} chunks")
