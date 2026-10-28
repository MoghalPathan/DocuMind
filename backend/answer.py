import os
import re
import sys
import time

from dotenv import load_dotenv
import httpx
from groq import RateLimitError
from langchain_groq import ChatGroq

from chitchat import small_talk
from search import search_wide

load_dotenv()

DEFAULT_MODEL = "openai/gpt-oss-20b"
ALLOWED_MODELS = {DEFAULT_MODEL}

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


REWRITE_PROMPT = """Rewrite the last question so it can be understood without the conversation.
Use the conversation only to fill in words like it, that, they, or a missing subject.
Keep the meaning. If the question is already complete, return it unchanged.
Reply with the question only.

Conversation:
{history}

Last question: {question}
Standalone question:"""

FOLLOW_WORDS = {
    "it", "its", "that", "this", "they", "them", "their", "those", "these",
    "he", "she", "also", "more", "another", "else", "same", "there", "then",
}

REGEN_HINTS = {
    "detailed": "Give a more detailed answer. Include every relevant detail from the context.",
    "shorter": "Give a shorter answer: one or two sentences only.",
    "different": "Answer again in different words and a different structure than before.",
}


GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite")
COOLDOWN_SECONDS = 60
_busy_until = {}  # model -> time when we may try it again


class Busy(Exception):
    """Every model is out of allowance right now."""


class Reply:
    def __init__(self, content, model):
        self.content = content
        self.model = model


def _call_groq(prompt, model, temperature):
    llm = ChatGroq(model=model, temperature=temperature, max_retries=0)
    return llm.invoke(prompt).content


def _call_gemini(prompt, temperature):
    key = os.getenv("GEMINI_API_KEY")
    if not key:
        raise RuntimeError("no Gemini key")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"
    body = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": temperature},
    }
    r = httpx.post(url, json=body, headers={"x-goog-api-key": key}, timeout=60)
    r.raise_for_status()
    return r.json()["candidates"][0]["content"]["parts"][0]["text"]


def _models_to_try(model):
    """model is the user's choice: "gemini", or anything else for Groq. The other one is the backup."""
    gemini_ok = bool(os.getenv("GEMINI_API_KEY"))
    if model == "gemini" and gemini_ok:
        order = [GEMINI_MODEL, DEFAULT_MODEL]
    else:
        order = [DEFAULT_MODEL] + ([GEMINI_MODEL] if gemini_ok else [])
    now = time.time()
    return [m for m in order if _busy_until.get(m, 0) <= now]


def ask_llm(prompt, model=DEFAULT_MODEL, temperature=0, fallback=True):
    """Ask the chosen model. With fallback, move to the next model when one is out of allowance."""
    if not fallback:
        # evaluation mode: one fixed model, wait and retry on rate limits
        if model not in ALLOWED_MODELS:
            model = DEFAULT_MODEL
        for wait in (15, 30, 60, 60, 60):
            try:
                return Reply(_call_groq(prompt, model, temperature), model)
            except RateLimitError:
                time.sleep(wait)
        return Reply(_call_groq(prompt, model, temperature), model)
    for m in _models_to_try(model):
        try:
            text = _call_gemini(prompt, temperature) if m == GEMINI_MODEL else _call_groq(prompt, m, temperature)
            return Reply(text, m)
        except Exception:
            _busy_until[m] = time.time() + COOLDOWN_SECONDS
    raise Busy("all models are busy")


def page_of(d):
    return str(d.metadata.get("page_label") or d.metadata.get("page", 0) + 1)


def page_key(p):
    return (0, int(p), "") if p.isdigit() else (1, 0, p)


def doc_name(d):
    return os.path.basename(str(d.metadata.get("source", "unknown")).replace("\\", "/"))


def used_chunks(text, docs, limit=4):
    """Pick the chunks the answer really came from: the ones whose words match the answer."""
    words = set(re.findall(r"[a-z0-9]{3,}", text.lower()))
    if not words:
        return docs[:2]
    scored = []
    for d in docs:
        have = set(re.findall(r"[a-z0-9]{3,}", d.page_content.lower()))
        scored.append((len(words & have) / len(words), d))
    scored.sort(key=lambda x: -x[0])
    best = scored[0][0]
    keep = [d for sc, d in scored if sc >= 0.35 and sc >= best * 0.6][:limit]
    return keep or [scored[0][1]]


def needs_rewrite(question, history):
    # only spend an LLM call when the question looks like a follow-up
    if not history:
        return False
    words = [w.strip("?.,!").lower() for w in question.split()]
    return len(words) <= 7 or any(w in FOLLOW_WORDS for w in words)


def rewrite_question(question, history, model=None, fallback=True):
    """Turn a follow-up like 'what about RAM?' into a full question. Falls back to the original."""
    if not needs_rewrite(question, history):
        return question
    lines = []
    for m in history[-4:]:
        who = "User" if m.get("role") == "user" else "Assistant"
        lines.append(f"{who}: {str(m.get('text', ''))[:300]}")
    prompt = REWRITE_PROMPT.format(history="\n".join(lines), question=question)
    try:
        out = ask_llm(prompt, model or DEFAULT_MODEL, fallback=fallback).content.strip().strip('"')
    except Exception:
        return question
    out = out.splitlines()[0].strip() if out else ""
    return out if 3 <= len(out) <= 300 else question


BUSY_TEXT = "DocuMind is busy right now (the free model limits are used up). Please try again in a minute."


def answer_full(question, model=None, doc=None, history=None, regen=None, fallback=True, owner=None):
    """Returns (text, citations, kind, asked, model_used). kind is "chat", "answer", "no_answer" or "busy"."""
    chat = small_talk(question)
    if chat:
        return chat, [], "chat", question, None
    asked = rewrite_question(question, history or [], model, fallback)
    docs = search_wide(asked, doc=doc, owner=owner)
    context = "\n\n".join(d.page_content for d in docs)
    prompt = PROMPT.format(context=context, question=asked)
    hint = REGEN_HINTS.get(regen or "")
    if hint:
        prompt = prompt.rsplit("Answer:", 1)[0] + hint + "\nAnswer:"
    temp = 0.5 if regen else 0
    try:
        reply = ask_llm(prompt, model or DEFAULT_MODEL, temperature=temp, fallback=fallback)
    except Busy:
        return BUSY_TEXT, [], "busy", asked, None
    text = reply.content.strip()
    cites, seen = [], set()
    for d in used_chunks(text, docs):
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
    return text, cites, kind, asked, reply.model


def answer(question):
    # old shape kept for the evaluation scripts: (text, list of page labels)
    text, cites, _, _, _ = answer_full(question, fallback=False)
    pages = sorted({c["page"] for c in cites}, key=page_key)
    return text, pages


if __name__ == "__main__":
    text, pages = answer(sys.argv[1])
    print("\nANSWER:", text)
    print("SOURCES:", ", ".join(pages) if pages else "none")
