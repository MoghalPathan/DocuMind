import os
import re
import sys
from functools import lru_cache

from langchain_core.documents import Document
from langchain_qdrant import QdrantVectorStore
from qdrant_client import QdrantClient, models
from rank_bm25 import BM25Okapi
from sentence_transformers import CrossEncoder

from store import get_embeddings, COLLECTION

URL = os.getenv("QDRANT_URL", "http://localhost:6333")


def tokenize(text):
    return re.findall(r"\w+", text.lower())


@lru_cache(maxsize=1)
def get_store():
    return QdrantVectorStore.from_existing_collection(
        embedding=get_embeddings(), url=URL, collection_name=COLLECTION
    )


@lru_cache(maxsize=1)
def get_reranker():
    return CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")


@lru_cache(maxsize=1)
def get_bm25():
    client = QdrantClient(url=URL)
    points, _ = client.scroll(COLLECTION, limit=10000, with_payload=True)
    docs = [
        Document(page_content=p.payload["page_content"], metadata=p.payload["metadata"])
        for p in points
    ]
    return BM25Okapi([tokenize(d.page_content) for d in docs]), docs


def search(question, k=8, fetch_k=50, rerank=True, hybrid=False):
    vec_docs = get_store().similarity_search(question, k=fetch_k)

    if hybrid:
        bm25, all_docs = get_bm25()
        scores = bm25.get_scores(tokenize(question))
        top = sorted(range(len(all_docs)), key=lambda i: scores[i], reverse=True)[:fetch_k]
        kw_docs = [all_docs[i] for i in top]

        # merge both lists: a chunk ranked high in either list scores high
        fused = {}
        for lst in (vec_docs, kw_docs):
            for rank, d in enumerate(lst):
                old_score, _ = fused.get(d.page_content, (0, d))
                fused[d.page_content] = (old_score + 1 / (60 + rank), d)
        ordered = sorted(fused.values(), key=lambda x: x[0], reverse=True)
        candidates = [d for _, d in ordered][:30]
    else:
        candidates = vec_docs

    if not rerank:
        return candidates[:k]

    scores = get_reranker().predict([(question, d.page_content) for d in candidates])
    ranked = sorted(zip(scores, candidates), key=lambda x: x[0], reverse=True)
    return [d for _, d in ranked[:k]]


def next_chunks(docs, seen):
    client = QdrantClient(url=os.getenv("QDRANT_URL", "http://localhost:6333"))
    extra = []
    for d in docs:
        src = d.metadata.get("source")
        cid = d.metadata.get("chunk_id")
        if cid is None:
            continue
        points, _ = client.scroll(
            COLLECTION, limit=1, with_payload=True, with_vectors=False,
            scroll_filter=models.Filter(must=[
                models.FieldCondition(key="metadata.source", match=models.MatchValue(value=src)),
                models.FieldCondition(key="metadata.chunk_id", match=models.MatchValue(value=cid + 1)),
            ]),
        )
        for p in points:
            text = p.payload["page_content"]
            if text not in seen:
                seen.add(text)
                extra.append(Document(page_content=text, metadata=p.payload["metadata"]))
    return extra



def search_wide(question):
    reranked = search(question, k=12, fetch_k=50, rerank=True)
    vector = search(question, k=6, fetch_k=6, rerank=False)
    seen, docs = set(), []
    for d in reranked + vector:
        if d.page_content not in seen:
            seen.add(d.page_content)
            docs.append(d)
    return docs + next_chunks(reranked[:3], seen)        


if __name__ == "__main__":

    q = " ".join(sys.argv[1:])
    for d in search(q):
        print(f"[page {d.metadata.get('page_label')}] {d.page_content[:200]!r}\n")
      




"""
turns your question into an embedding, then asks Qdrant for the 5 chunks with the closest meaning.
"""        