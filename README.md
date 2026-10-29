# DocuMind

Ask questions about your PDFs and get answers with page citations. If the answer is not in the document, DocuMind says "I don't know" instead of guessing.

**Live demo:** _coming soon (link here)_

![Home](docs/home.png)

## Features
- Upload PDFs and chat with them (answers cite the document and page)
- Strict answers: only from your documents, otherwise "I don't know"
- Follow-up questions work (chat memory) and answers can be regenerated
- Login, "Try demo" accounts, per-user documents, upload and rate limits
- Two LLMs to choose from (Groq or Gemini), with automatic backup if one is busy
- Light and dark theme, works on mobile, voice input on https
- Scanned (image-only) PDFs are detected and rejected with a clear message

![Answer with citations](docs/answer.png)
![I don't know](docs/idk.png)

## How it works
```
PDF -> split into chunks (1000 chars, 150 overlap) -> embeddings (all-MiniLM-L6-v2)
    -> Qdrant vector database
Question -> vector search + cross-encoder re-ranking + neighbour chunks
         -> strict prompt -> LLM (Groq gpt-oss-20b / Gemini) -> answer + citations
```
Stack: Python, FastAPI, LangChain loaders, Qdrant, sentence-transformers, React (Vite), Docker Compose, AWS.

## Evaluation
Tested on one real document (a 16-week Deep Learning lab manual) with 25 answerable and 5 unanswerable questions. Answers were graded by hand.

| Result | Groq (gpt-oss-20b) | Gemini (flash-lite) |
|---|---|---|
| Fully correct | 19 / 25 (76%) | 20 / 25 (80%) |
| Correct or partly correct | 22 / 25 (88%) | 23 / 25 (92%) |
| Right page retrieved | 25 / 25 | 25 / 25 |
| Correct "I don't know" (unanswerable) | 5 / 5 | 5 / 5 |

Retrieval is strong (right page found every time). The remaining mistakes are in the answer step: counting long lists (e.g. "how many programs are in the index?") and picking exact values from long code sections. Small sample, one document: treat these as a rough guide, not a benchmark.

Run it yourself: `python eval/run_eval.py <tag>`

## Run locally
```
docker compose up --build -d      # Qdrant + API + web on http://localhost:8000
```
Create a `.env` file (never commit it):
```
GROQ_API_KEY=your_key
GEMINI_API_KEY=your_key
```

## Privacy note
Questions and retrieved text are sent to the chosen LLM provider. Gemini's free tier may use content to improve Google products, so do not upload private documents when using it.

## Known limits
- Text PDFs only (no OCR for scans)
- Free-tier LLM limits mean very busy days may show a "busy" message
- Long lists and counting questions can be incomplete

## Author
Korabu Naved Arif — [LinkedIn](https://www.linkedin.com/in/naved-korabu-2b8221434/) · [GitHub](https://github.com/MoghalPathan)
