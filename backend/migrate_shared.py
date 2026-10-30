"""One time: choose which existing documents become shared samples that every user can ask about.

Usage (inside the api container):
    python migrate_shared.py "Lab Manual.pdf"        share only this file
    python migrate_shared.py                          just list what is there

Documents that are not shared stay hidden from everyone until you re-upload them from your own account.
"""
import os
import sys
from collections import Counter

from qdrant_client import QdrantClient, models

COLLECTION = "documind"


def run(client, names):
    no_owner = models.Filter(
        must=[models.IsEmptyCondition(is_empty=models.PayloadField(key="metadata.owner"))]
    )
    for name in names:
        flt = models.Filter(
            must=[
                models.IsEmptyCondition(is_empty=models.PayloadField(key="metadata.owner")),
                models.FieldCondition(key="metadata.source", match=models.MatchValue(value="data/" + name)),
            ]
        )
        n = client.count(COLLECTION, count_filter=flt, exact=True).count
        client.set_payload(COLLECTION, payload={"owner": "shared"}, key="metadata", points=flt)
        print(f"Shared '{name}': {n} chunks")
    left = Counter()
    offset = None
    while True:
        points, offset = client.scroll(
            COLLECTION, scroll_filter=no_owner, limit=500, offset=offset, with_payload=True
        )
        for p in points:
            left[p.payload["metadata"].get("source", "?")] += 1
        if offset is None:
            break
    if left:
        print("Still hidden (no owner):")
        for src, n in left.items():
            print(f"  {src}: {n} chunks")
    else:
        print("Nothing is left without an owner.")
    return left


if __name__ == "__main__":
    run(QdrantClient(url=os.getenv("QDRANT_URL", "http://localhost:6333")), sys.argv[1:])
