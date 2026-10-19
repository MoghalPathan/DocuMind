import sys 
from langchain_qdrant import QdrantVectorStore
from store import get_embeddings, COLLECTION


def get_store():
    return QdrantVectorStore.from_existing_collection(
        embedding=get_embeddings(),
        url="http://localhost:6333",
        collection_name=COLLECTION,
    )



def search(question, k=5):
    return get_store().similarity_search(question, k=k)



if __name__ == "__main__":
    question = sys.argv[1]
    for i, doc in enumerate(search(question), 1):
        print(f"\n--- result {i} (page {doc.metadata['page_label']}) ---")
        print(doc.page_content[:300])




"""
turns your question into an embedding, then asks Qdrant for the 5 chunks with the closest meaning.
"""        