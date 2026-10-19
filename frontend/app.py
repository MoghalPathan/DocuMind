import requests
import streamlit as st

API = "http://127.0.0.1:8000"

st.title("Documind")
st.caption("Ask question about your PDF. Answers come with sources.")

with st.sidebar:
    st.header("Upload a PDF")
    file = st.file_uploader("Choose a PDF", type="pdf")
    if file and st.button("Ingest"):
        with st.spinner("Processing..."):
            r = requests.post(
                f"{API}/ingest",
                files={"file": (file.name, file.getvalue(), "application/pdf")},
            )
        if r.ok:
            st.success(f"Stored {r.json()['chunks']} chunks")
        else:
            st.error(r.text)


if "messages"  not in st.session_state:
    st.session_state.messages = []


for m in st.session_state.messages:
    with st.chat_message(m["role"]):
        st.write(m["content"])
        if m.get("sources"):
            st.caption("Sources: pages " + ", ".join(m["sources"]))

q = st.chat_input("Ask a question about your document")
if q:
    st.session_state.messages.append({"role": "user", "content": q})
    with st.chat_message("user"):
        st.write(q)
    with st.chat_message("assistant"):
        with st.spinner("Thinking..."):
            r = requests.post(f"{API}/query", json={"question": q})
        if r.ok:
            data = r.json()
            st.write(data["answer"])
            if data["sources"]:
                st.caption("Sources: pages " + ", ".join(data["sources"])) 
            st.session_state.messages.append(
                {"role": "aiistant", "content": data["answer"], "sources": data["sources"]}
            )
        else:
            st.error(r.text)           
