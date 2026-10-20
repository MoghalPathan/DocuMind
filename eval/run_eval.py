import json
import sys
import time 
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT/ "backend"))

from answer import answer  #noqa: E402
from search import search  #noqa: E402

name = sys.argv[1] if len(sys.argv) > 1 else "baseline"
data = json.loads((ROOT / "eval" / "questions.json").read_text(encoding="utf-8"))
results = []

for item in data["questions"]:
    q = item["question"]
    text = "ERROR"
    for attempt in range(3):
        try:
            text, _ = answer(q)
            break
        except Exception as e:
            print("retry", item["id"], ascii(e)[:100])
            time.sleep(10)
    docs = search(q, k=5)
    retrieved = sorted({int(d.metadata["page_label"]) for d in docs})
    refused = "i don't know" in text.lower()
    hit = any(p in retrieved for p in item["expected_pages"])
    results.append({
        **item,
        "answer": text,
        "contexts": [d.page_content for d in docs],
        "retrieved_pages": retrieved,
        "retrieval_hit": hit,
        "refused": refused,
    })  
    print("done", item["id"])
    time.sleep(1.5)    

out = ROOT / "eval" / f"results_{name}.json"
out.write_text(json.dumps(results, indent=2, ensure_ascii=False), encoding="utf-8")

ans = [r for r in results if r["answerable"]]
un = [r for r in results if not r["answerable"]]
print()
print(f"Retrieval hit tate: {sum(r['retrieval_hit'] for r in ans)}/{len(ans)}")
print(f"Correct 'I din't know': {sum(r['refused'] for r in un)}/{len(un)}")
for r in ans:
    if not r["retrieval_hit"]:
        print("MISSED", r["id"], "expected", r["expected_pages"], "got", r["retrieved_pages"])
print("saved:", out)
