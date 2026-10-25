import sys 
import time
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from search import search_wide
from groq import RateLimitError


load_dotenv()

PROMPT = """You answer questions ONLY  the context below.

Rules:
- If the context fully or partly answers the question, answer with what the context says. If only part is covered, say what the context does tell and what is missing.
- Only if the context has nothing relevant, reply exactly: I don't know.
- Never use outside knowledge. Never guess numbers, names or dates.
- Different wording can mean the same thing (for example RAM and memory).


Context:{context}

Question:{question}
Answer:"""



def ask_llm(prompt):
    llm = ChatGroq(model="openai/gpt-oss-20b", temperature=0, max_retries=0)
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
    

def answer(question):
    docs = search_wide(question)
    context ="\n\n".join(d.page_content for d in docs)
    reply = ask_llm(PROMPT.format(context=context, question=question))
    text = reply.content.strip()
    pages = sorted({page_of(d) for d in docs[:4]}, key=page_key)
    if text.lower().replace("\u2019", "'").startswith("i don't know"):
        pages = []
    return text, pages


if __name__ == "__main__":
    text, pages = answer(sys.argv[1])
    print("\nANSWER:", text)
    print("SOURCES:", ", ".join(pages) if pages else "none")



"""
finds the top 5 chunks, gives them to Groq’s Llama model with a strict instruction to answer 
only from them (or say “I don’t know”), and prints the answer with the page numbers it used.
"""    