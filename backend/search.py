import sys 
from functools import lru_cache

from langchain_qdrant import QdrantVectorStore
from sentence_transformers import CrossEncoder

from store import get_embeddings, COLLECTION


@lru_cache(maxsize=1)
def get_store():
    return QdrantVectorStore.from_existing_collection(
        embedding=get_embeddings(),
        url="http://localhost:6333",
        collection_name=COLLECTION,
    )


@lru_cache(maxsize=1)
def get_reranker():
    return CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")


def search(question, k=5, fetch_k=20, rerank=True):
    docs = get_store().similarity_search(question, k=fetch_k if rerank else k) 
    if not rerank:
        return docs
    scores = get_reranker().predict([(question, d.page_content) for d in docs])
    ranked = sorted(zip(scores, docs), key=lambda x: x[0], reverse=True)
    return [d for _, d in ranked[:k]]



if __name__ == "__main__":
    question = sys.argv[1]
    for i, doc in enumerate(search(question), 1):
        print(f"\n--- result {i} (page {doc.metadata['page_label']}) ---")
        print(doc.page_content[:300])




"""
turns your question into an embedding, then asks Qdrant for the 5 chunks with the closest meaning.
"""        