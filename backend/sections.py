"""Label every chunk with the section it belongs to (Week-4, Chapter-2, ...) and read the section a question asks about."""
import re

KINDS = "week|program|experiment|exp|lab|chapter|unit|section|module|lesson"
HEAD = re.compile(rf"(?im)^[ \t]*({KINDS})[ \t]*[-–—:.]?[ \t]*(\d{{1,3}})\b")
ASK = re.compile(rf"(?i)\b({KINDS})[ \t]*[-–—:.]?[ \t]*(\d{{1,3}})\b")


def _norm(kind, num):
    kind = {"exp": "experiment"}.get(kind.lower(), kind.lower())
    return f"{kind}-{int(num)}"


def headings(text):
    """Headings that start a line, for example 'Week-4'."""
    return [_norm(k, n) for k, n in HEAD.findall(text)]


def tag_chunks(chunks):
    """chunks must be in reading order. A chunk belongs to the heading before it and to any heading inside it."""
    current = {}
    for c in chunks:
        src = c.metadata.get("source")
        before = current.get(src)
        found = headings(c.page_content)
        first = HEAD.search(c.page_content)
        if first and not c.page_content[: first.start()].strip():
            before = None  # the chunk starts with a new heading, so it no longer belongs to the previous section
        secs = ([before] if before else []) + found
        c.metadata["sections"] = list(dict.fromkeys(secs))
        if found:
            current[src] = found[-1]
    return chunks


def question_sections(question):
    """Sections a question mentions, for example 'Week-12 VGG16' -> ['week-12']."""
    return list(dict.fromkeys(_norm(k, n) for k, n in ASK.findall(question)))
