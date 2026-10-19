from fastapi import FastAPI
from pydantic import BaseModel
from answer import answer

app = FastAPI(title="DocuMind")


class Question(BaseModel):
    question: str



@app.get("/health")
def health():
    return {"status:", "ok"}



@app.post("/query")
def query(body: Question):
    text, pages = answer(body.question)
    return {"answer": text, "sources": pages}



"""
/health says the server is alive. /query takes a question, runs your answer() function,
and returns the answer and source pages as JSON.
"""