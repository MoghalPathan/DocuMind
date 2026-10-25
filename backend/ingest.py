import os
import sys
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter


def load_pdf(path):
    return PyPDFLoader(path).load()


def split_docs(docs, chunk_size=None, chunk_overlap=None):
    chunk_size = chunk_size or int(os.getenv("CHUNK_SIZE", 1000))
    chunk_overlap = chunk_overlap or int(os.getenv("CHUNK_OVERLAP", 150))
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size, chunk_overlap=chunk_overlap
    )
    chunks = splitter.split_documents(docs)
    for i, c in enumerate(chunks):
        c.metadata["chunk_id"] = i
    return chunks    

if __name__ == "__main__":
    path = sys.argv[1]
    pages = load_pdf(path)
    chunks = split_docs(pages)
    print("pages", len(pages))
    print("chunks:", len(chunks))
    print("--- first chunk ---")
    print(chunks[0].page_content)
    print("metadata:", chunks[0].metadata)

"""
What it does: reads your PDF page by page, then cuts the text into small chunks of about 512 characters.
Each chunk overlaps the previous one by 64 characters so no idea gets cut in half. The file name and 
page number are kept with every chunk, which we need later for citations.
"""