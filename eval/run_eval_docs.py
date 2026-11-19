r"""Real evaluation runner: one document at a time, search limited to that document.

Step 1, see what your local Qdrant holds:
    python eval\run_eval_docs.py --list

Step 2, run one question file. The document is found from the "document" field of the question file:
    python eval\run_eval_docs.py yolo_groq --questions eval\questions_yolo.json

The model comes from the EVAL_MODEL variable: Groq by default, Gemini when EVAL_MODEL=gemini.
There is no fallback to another model. Results are saved after EVERY question.
Add --resume to continue a stopped run (questions that ended in an error are asked again).
Only if the document is not found by name: add --doc "<source name from --list>" and, if needed, --owner "<owner>".
"""
import argparse
import json
import os
import re
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "backend"))

URL = os.getenv("QDRANT_URL", "http://localhost:6333")
COLLECTION = "documind"  # same name as backend/store.py
MAX_ERRORS_IN_A_ROW = 3


def norm(s):
    return re.sub(r"\s+", "", s).lower()


def base_of(path):
    return re.split(r"[\\/]", str(path))[-1]


def loose(name):
    """File names compared loosely: no folders, no spaces, underscores or capitals."""
    return re.sub(r"[^a-z0-9]", "", base_of(name).lower())


def page_int(d):
    try:
        return int(d.metadata["page_label"])
    except (KeyError, ValueError, TypeError):
        return None


def stored_sources():
    """Returns ({(source, owner): chunks}, {(source, owner): chunks stored twice})."""
    from qdrant_client import QdrantClient

    client = QdrantClient(url=URL)
    counts, twice, ids, offset = {}, {}, set(), None
    while True:
        points, offset = client.scroll(
            COLLECTION, limit=500, offset=offset, with_payload=True, with_vectors=False
        )
        for p in points:
            m = (p.payload or {}).get("metadata", {})
            key = (str(m.get("source")), str(m.get("owner")))
            counts[key] = counts.get(key, 0) + 1
            if m.get("chunk_id") is not None:
                uid = key + (m["chunk_id"],)
                if uid in ids:
                    twice[key] = twice.get(key, 0) + 1
                ids.add(uid)
        if offset is None:
            break
    return counts, twice


def show_sources(counts, twice):
    if not counts:
        print("The collection is empty.")
    for (src, owner), n in sorted(counts.items()):
        extra = f"   WARNING: {twice[(src, owner)]} chunks are stored twice" if (src, owner) in twice else ""
        print(f"{n:5d} chunks   source={ascii(src)}   owner={ascii(owner)}{extra}")


def other_document_chunks(docs, src):
    return sum(1 for d in docs if loose(d.metadata.get("source", "")) != loose(src))


def run(args):
    data = json.loads(Path(args.questions).read_text(encoding="utf-8"))
    wanted = args.doc or data["document"]
    if args.doc and loose(args.doc) != loose(data["document"]) and not args.force:
        print(f"These questions are for {data['document']} but you asked for {args.doc}.")
        print("Wrong pairing? If you really want it, add --force.")
        sys.exit(1)

    try:
        counts, twice = stored_sources()
    except Exception as e:
        print("Cannot read Qdrant at", URL, "->", ascii(e)[:150])
        print("Start Qdrant first, then run again.")
        sys.exit(1)

    found = [k for k in counts if loose(k[0]) == loose(wanted)]
    if args.owner:
        found = [k for k in found if k[1] == args.owner]
    if len(found) != 1:
        print("Looked for:", wanted)
        print("Found", len(found), "matching sources. The index holds:")
        show_sources(counts, twice)
        print("Ingest the document first, or run again with --doc and --owner copied from the list above.")
        sys.exit(1)
    src, src_owner = found[0]
    if found[0] in twice:
        print(f"{src} is stored twice in the index ({twice[found[0]]} repeated chunks). This would change the results.")
        print("Fix the index first (start from a clean collection), then run again.")
        sys.exit(1)
    owner = args.owner or None

    import answer as A  # imported late: it loads the models

    real_search = A.search_wide
    seen = {}

    def spy(question, doc=None, owner=None):
        # keep the exact chunks the model is given, so the contexts we save are what it really read
        docs = real_search(question, doc=doc, owner=owner)
        seen["docs"] = docs
        return docs

    A.search_wide = spy

    try:
        probe = real_search("introduction", doc=src, owner=owner)
    except Exception as e:
        probe = []
        print("probe error:", ascii(e)[:200])
    if not probe:
        print(f"The index has {src} but the app's document filter finds nothing for it.")
        print("The filter looks for the source 'data/<file name>' (with a forward slash).")
        print("Send this list to Claude:")
        show_sources(counts, twice)
        sys.exit(1)
    if other_document_chunks(probe, src):
        print("The probe returned chunks from another document. The scope is not working. Stopping.")
        sys.exit(1)

    model = os.getenv("EVAL_MODEL") or None
    print("document:", ascii(src), "| owner filter:", owner, "| model:", model or "groq (default)")

    out = ROOT / "eval" / f"results_{args.name}.json"
    done = {}
    if args.resume and out.exists():
        rows = json.loads(out.read_text(encoding="utf-8"))
        done = {r["id"]: r for r in rows if r.get("kind") != "error"}

    results, errors_in_a_row, leaked = [], 0, 0
    for item in data["questions"]:
        if item["id"] in done:
            results.append(done[item["id"]])
            print("skip", item["id"])
            continue
        q = item["question"]
        text, cites, kind, model_used = "ERROR", [], "error", None
        seen.pop("docs", None)
        for attempt in range(3):
            try:
                text, cites, kind, _, model_used = A.answer_full(
                    q, model=model, doc=src, owner=owner, fallback=False
                )
                break
            except Exception as e:
                print("retry", item["id"], ascii(e)[:100])
                time.sleep(10)
        docs = seen.get("docs")
        if docs is None:  # small talk, or the failure came before the search
            try:
                docs = real_search(q, doc=src, owner=owner)
            except Exception as e:
                docs = []
                print("search error", item["id"], ascii(e)[:100])
        bad = other_document_chunks(docs, src)
        if bad:
            leaked += bad
            print("WARNING", item["id"], bad, "chunks came from another document")
        contexts = [d.page_content for d in docs]
        retrieved = sorted({p for p in (page_int(d) for d in docs) if p is not None})
        joined = norm("".join(contexts))
        results.append({
            **item,
            "answer": text,
            "contexts": contexts,
            "retrieved_pages": retrieved,
            "retrieval_hit": any(p in retrieved for p in item["expected_pages"]),
            "evidence_hit": all(norm(e) in joined for e in item.get("evidence", [])),
            "refused": "i don't know" in text.lower(),
            "cited_pages": sorted({str(c["page"]) for c in cites}),
            "kind": kind,
            "model_used": model_used,
        })
        out.write_text(json.dumps(results, indent=2, ensure_ascii=False), encoding="utf-8")
        print("done", item["id"], "|", kind)
        errors_in_a_row = errors_in_a_row + 1 if kind == "error" else 0
        if errors_in_a_row >= MAX_ERRORS_IN_A_ROW:
            print(f"{MAX_ERRORS_IN_A_ROW} errors in a row (key, limit or network?). Stopping. Use --resume later.")
            sys.exit(1)
        time.sleep(1.5)

    ans = [r for r in results if r["answerable"]]
    un = [r for r in results if not r["answerable"]]
    print()
    print(f"Answer evidence in retrieved chunks: {sum(r['evidence_hit'] for r in ans)}/{len(ans)}")
    print(f"Right page retrieved: {sum(r['retrieval_hit'] for r in ans)}/{len(ans)}")
    print(f"Wrongly said I don't know: {sum(r['refused'] for r in ans)}/{len(ans)}")
    print(f"Correct I don't know: {sum(r['refused'] for r in un)}/{len(un)}")
    print("errors:", sum(r["kind"] == "error" for r in results))
    print("small-talk replies:", sum(r["kind"] == "chat" for r in results))
    print("chunks from another document:", leaked)
    print("models used:", sorted({str(r["model_used"]) for r in results}))
    print("saved:", out)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("name", nargs="?", help="name for the results file, for example yolo_groq")
    ap.add_argument("--list", action="store_true", help="show what the index holds")
    ap.add_argument("--questions", help="question file, for example eval\\questions_yolo.json")
    ap.add_argument("--doc", help="source name from --list (only if the document is not found by name)")
    ap.add_argument("--owner", help="owner from --list (only if needed)")
    ap.add_argument("--resume", action="store_true")
    ap.add_argument("--force", action="store_true", help="allow --doc to differ from the question file")
    a = ap.parse_args()
    if a.list:
        try:
            show_sources(*stored_sources())
        except Exception as e:
            print("Cannot read Qdrant at", URL, "->", ascii(e)[:150])
            print("Start Qdrant first, then run again.")
            sys.exit(1)
    elif a.name and a.questions:
        run(a)
    else:
        ap.error("use --list, or give: NAME --questions FILE")
