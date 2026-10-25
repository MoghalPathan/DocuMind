import json, re, sys
sys.path.insert(0, "backend")
from search import search_wide

def norm(s):
    return re.sub(r"\s+", "", s).lower()

qs = json.load(open("eval/questions.json", encoding="utf-8"))["questions"]
hits, misses, total = 0, [], 0
for q in qs:
    if not q["answerable"]:
        continue
    total += 1
    docs = search_wide(q["question"])
    joined = norm(" ".join(d.page_content for d in docs))
    if all(norm(e) in joined for e in q["evidence"]):
        hits += 1
    else:
        misses.append(q["id"])
print(f"Evidence found: {hits}/{total}  (uses no Groq tokens)")
print("Missed:", misses)

    

