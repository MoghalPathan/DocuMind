import os
import sys
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_qdrant import QdrantVectorStore
from ingest import load_pdf, split_docs

COLLECTION = "documind"

def get_embeddings():
    return HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")



def store_chunks(chunks):
    return QdrantVectorStore.from_documents(
        chunks, 
        get_embeddings(),
        url=os.getenv("QDRANT_URL", "http://localhost:6333"),
        collection_name=COLLECTION
    )



if __name__ == "__main__":
    path = sys.argv[1]
    chunks = split_docs(load_pdf(path))
    store_chunks(chunks)
    print("stored chunks:", len(chunks))



"""
turns each chunk into a list of numbers (an embedding) using MiniLM, 
then saves them in Qdrant under a collection called documind. Similar meaning gives similar numbers,
 which is how search works later.
"""