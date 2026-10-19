import sys 
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from search import search

load_dotenv()

PROMPT = """Answer only based on the context below." \
If the context does not contain the answer, say "I don't know."


Context:{context}

Question:{question}
Answer:"""



def answer(question):
    docs = search(question, k=5)
    context ="\n\n".join(d.page_content for d in docs)
    llm = ChatGroq(model="openai/gpt-oss-20b", temperature=0)
    reply = llm.invoke(PROMPT.format(context=context, question=question))
    pages = sorted({d.metadata["page_label"] for d in docs}, key=int)
    if "i don't know" in reply.content.lower():
        pages = []
    return reply.content, pages


if __name__ == "__main__":
    text, pages = answer(sys.argv[1])
    print("\nANSWER:", text)
    print("SOURCES:", ", ".join(pages) if pages else "none")



"""
finds the top 5 chunks, gives them to Groq’s Llama model with a strict instruction to answer 
only from them (or say “I don’t know”), and prints the answer with the page numbers it used.
"""    