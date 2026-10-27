import os
import sys
import time

from dotenv import load_dotenv
from groq import RateLimitError
from langchain_groq import ChatGroq

from chitchat import small_talk
from search import search_wide

load_dotenv()

DEFAULT_MODEL = "openai/gpt-oss-20b"
ALLOWED_MODELS = {"openai/gpt-oss-20b", "llama-3.3-70b-versatile", "llama-3.1-8b-instant"}

PROMPT = """You answer questions using ONLY the context below.

Rules:
- If the context fully or partly answers the question, answer with what the context says. If only part is covered, say what the context does tell and what is missing.
- Only if the context has nothing relevant, reply exactly: I don't know.
- Never use outside knowledge. Never guess numbers, names or dates.
- Different wording can mean the same thing (for example RAM and memory).

Context:
{context}

Question: {question}
Answer:"""


def ask_llm(prompt, model=DEFAULT_MODEL):
    if model not in ALLOWED_MODELS:
        model = DEFAULT_MODEL
    llm = ChatGroq(model=model, temperature=0, max_retries=0)
    for wait in (15, 30, 60, 60, 60):
        try:
            return llm.invoke(prompt)
        except RateLimitError:
            time.sleep(wait)
    return llm.invoke(prompt)


def page_of(d):
    return str(d.metadata.get("page_label") or d.metadata.get("page", 0) + 1)


def page_key(p):
    return (0, int(p), "") if p.isdigit() else (1, 0, p)


def doc_name(d):
    return os.path.basename(str(d.metadata.get("source", "unknown")).replace("\\", "/"))


def answer_full(question, model=None, doc=None):
    """Returns (text, citations, kind). kind is "chat", "answer" or "no_answer"."""
    chat = small_talk(question)
    if chat:
        return chat, [], "chat"
    docs = search_wide(question, doc=doc)
    context = "\n\n".join(d.page_content for d in docs)
    reply = ask_llm(PROMPT.format(context=context, question=question), model or DEFAULT_MODEL)
    text = reply.content.strip()
    cites, seen = [], set()
    for d in docs[:4]:
        key = (doc_name(d), page_of(d))
        if key in seen:
            continue
        seen.add(key)
        cites.append(
            {"doc": key[0], "page": key[1], "pdf_page": int(d.metadata.get("page", 0)) + 1}
        )
    cites.sort(key=lambda c: (c["doc"], page_key(c["page"])))
    kind = "answer"
    if text.lower().replace("\u2019", "'").startswith("i don't know"):
        cites, kind = [], "no_answer"
    return text, cites, kind


def answer(question):
    # old shape kept for the evaluation scripts: (text, list of page labels)
    text, cites, _ = answer_full(question)
    pages = sorted({c["page"] for c in cites}, key=page_key)
    return text, pages


if __name__ == "__main__":
    text, pages = answer(sys.argv[1])
    print("\nANSWER:", text)
    print("SOURCES:", ", ".join(pages) if pages else "none")
