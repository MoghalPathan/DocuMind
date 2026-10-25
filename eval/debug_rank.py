import json, re, sys
sys.path.insert(0, "backend")
from search import search

def norm(s):
    return re.sub(r"\s+", "", s).lower()

qs = {q["id"]: q for q in json.load(open("eval/questions.json", encoding="utf-8"))["questions"]}

def rank_of(docs, pieces):
    for i, d in enumerate(docs):
        if all(norm(e) in norm(d.page_content) for e in pieces):
            return i + 1
    return "NOT FOUND"

for qid in sys.argv[1:]:
    q = qs[qid]
    print("\n", qid, q["question"])
    vec = search(q["question"], k=100, fetch_k=100, rerank=False)
    rr = search(q["question"], k=100, fetch_k=100, rerank=True)
    print("  all evidence in one chunk -> vector rank:", rank_of(vec, q["evidence"]),
          "| re-ranked rank:", rank_of(rr, q["evidence"]))
    for e in q["evidence"]:
        print("   piece", repr(e[:35]), "-> vector rank:", rank_of(vec, [e]),
              "| re-ranked rank:", rank_of(rr, [e]))