import json
import os
import re
import sys
import zipfile
import xml.etree.ElementTree as ET
from email import policy
from email.parser import BytesParser
from html.parser import HTMLParser
from posixpath import dirname, join, normpath

from langchain_community.document_loaders import PyPDFLoader
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter

# ---------------------------------------------------------------- file types

TEXT_EXT = {".txt", ".md", ".markdown", ".rst", ".log"}
CODE_EXT = {
    ".py", ".js", ".jsx", ".ts", ".tsx", ".java", ".c", ".h", ".cpp", ".hpp", ".cs", ".go", ".rs",
    ".rb", ".php", ".swift", ".kt", ".sql", ".sh", ".bat", ".ps1", ".css", ".scss", ".yml", ".yaml",
    ".toml", ".ini", ".cfg", ".r", ".m", ".lua", ".dart",
}
SUBTITLE_EXT = {".srt", ".vtt"}
HTML_EXT = {".html", ".htm"}
OFFICE_EXT = {".docx", ".odt", ".rtf", ".pptx", ".epub", ".eml"}
DATA_EXT = {".json", ".xml"}
SUPPORTED = {".pdf"} | TEXT_EXT | CODE_EXT | SUBTITLE_EXT | HTML_EXT | OFFICE_EXT | DATA_EXT

PART_CHARS = 3000  # one "part" is about a page of text
MAX_UNZIPPED = 60 * 1024 * 1024  # stop zip bombs


def ext_of(name):
    return os.path.splitext(str(name).lower())[1]


def is_supported(name):
    return ext_of(name) in SUPPORTED


def kind_of(name):
    """The word used in citations: p. for PDF, Slide for PowerPoint, Part for the rest."""
    e = ext_of(name)
    return "page" if e == ".pdf" else "slide" if e == ".pptx" else "part"


# ---------------------------------------------------------------- helpers

def _text(raw):
    if isinstance(raw, str):
        return raw
    if raw[:2] in (b"\xff\xfe", b"\xfe\xff"):
        return raw.decode("utf-16", errors="replace")
    try:
        return raw.decode("utf-8-sig")
    except UnicodeError:
        return raw.decode("cp1252", errors="replace")


def _read_member(z, name):
    info = z.getinfo(name)
    if info.file_size > MAX_UNZIPPED:
        raise ValueError("file is too large inside")
    return z.read(name)


def _open_zip(path):
    z = zipfile.ZipFile(path)
    if sum(i.file_size for i in z.infolist()) > MAX_UNZIPPED:
        raise ValueError("file is too large inside")
    return z


def _xml(data):
    """Parse XML, refusing entity tricks (billion laughs)."""
    if b"<!ENTITY" in data or b"<!entity" in data:
        raise ValueError("unsafe xml")
    return ET.fromstring(data)


def _local(tag):
    return tag.rsplit("}", 1)[-1]


def _parts(text, name, size=PART_CHARS):
    """Cut plain text into parts of about one page, at line breaks where possible."""
    text = re.sub(r"\r\n?", "\n", text)
    text = re.sub(r"[ \t]+\n", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text).strip()
    if not text:
        return []
    out, cur = [], ""
    for line in text.split("\n"):
        while len(line) > size:  # one huge line: cut it
            if cur:
                out.append(cur)
                cur = ""
            out.append(line[:size])
            line = line[size:]
        if cur and len(cur) + len(line) + 1 > size:
            out.append(cur)
            cur = line
        else:
            cur = cur + "\n" + line if cur else line
    if cur.strip():
        out.append(cur)
    return [
        Document(page_content=t.strip(), metadata={"source": name, "page": i, "page_label": str(i + 1)})
        for i, t in enumerate(out)
        if t.strip()
    ]


# ---------------------------------------------------------------- readers

class _HTMLText(HTMLParser):
    BLOCK = {"p", "div", "br", "li", "tr", "h1", "h2", "h3", "h4", "h5", "h6", "section", "article",
             "table", "ul", "ol", "blockquote", "pre", "header", "footer", "title"}
    SKIP = {"script", "style", "noscript", "svg", "template"}

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.out, self.skip = [], 0

    def handle_starttag(self, tag, attrs):
        if tag in self.SKIP:
            self.skip += 1
        elif tag in self.BLOCK:
            self.out.append("\n")
        elif tag in ("td", "th"):
            self.out.append(" | ")

    def handle_endtag(self, tag):
        if tag in self.SKIP:
            self.skip = max(0, self.skip - 1)
        elif tag in self.BLOCK:
            self.out.append("\n")

    def handle_data(self, data):
        if not self.skip:
            self.out.append(data)


def html_to_text(html):
    p = _HTMLText()
    p.feed(html)
    p.close()
    text = "".join(p.out)
    text = re.sub(r"[ \t\xa0]+", " ", text)
    text = re.sub(r" ?\n ?", "\n", text)
    return re.sub(r"\n{3,}", "\n\n", text).strip()


def read_docx(path):
    with _open_zip(path) as z:
        root = _xml(_read_member(z, "word/document.xml"))
    lines = []
    for p in root.iter():
        if _local(p.tag) != "p":
            continue
        buf = []
        for el in p.iter():
            n = _local(el.tag)
            if n == "t" and el.text:
                buf.append(el.text)
            elif n == "tab":
                buf.append("\t")
            elif n in ("br", "cr"):
                buf.append("\n")
        lines.append("".join(buf))
    return "\n".join(lines)


def read_odt(path):
    with _open_zip(path) as z:
        root = _xml(_read_member(z, "content.xml"))

    def walk(el, buf):
        n = _local(el.tag)
        if n == "s":
            buf.append(" " * int(el.attrib.get("{urn:oasis:names:tc:opendocument:xmlns:text:1.0}c", "1") or 1))
        elif n == "tab":
            buf.append("\t")
        elif n == "line-break":
            buf.append("\n")
        if el.text and n not in ("s", "tab", "line-break"):
            buf.append(el.text)
        for ch in el:
            walk(ch, buf)
            if ch.tail:
                buf.append(ch.tail)

    lines = []
    for el in root.iter():
        if _local(el.tag) in ("p", "h"):
            buf = []
            walk(el, buf)
            lines.append("".join(buf))
    return "\n".join(lines)


def read_rtf(path):
    data = open(path, "rb").read().decode("latin-1")
    skip_words = {"fonttbl", "colortbl", "stylesheet", "info", "pict", "header", "footer", "footnote",
                  "themedata", "colorschememapping", "latentstyles", "datastore", "generator", "fldinst",
                  "listtable", "listoverridetable", "rsidtbl", "xmlnstbl", "mmathPr"}
    out, stack, skip, uc, i, n = [], [], False, 1, 0, len(data)
    word_re = re.compile(r"([a-zA-Z]+)(-?\d+)? ?")
    while i < n:
        c = data[i]
        if c == "{":
            stack.append(skip)
            i += 1
            if data.startswith("\\*", i):  # optional destination: ignore the whole group
                skip = True
        elif c == "}":
            skip = stack.pop() if stack else False
            i += 1
        elif c == "\\":
            i += 1
            if i >= n:
                break
            ch = data[i]
            if ch in "\\{}":
                if not skip:
                    out.append(ch)
                i += 1
            elif ch == "'":
                hexv = data[i + 1:i + 3]
                i += 3
                if not skip:
                    try:
                        out.append(bytes([int(hexv, 16)]).decode("cp1252", errors="replace"))
                    except ValueError:
                        pass
            elif ch == "~":
                if not skip:
                    out.append(" ")
                i += 1
            elif ch.isalpha():
                m = word_re.match(data, i)
                word, num = m.group(1), m.group(2)
                i = m.end()
                if word in skip_words:
                    skip = True
                elif word == "uc" and num:
                    uc = int(num)
                elif word == "u" and num:
                    if not skip:
                        code = int(num)
                        out.append(chr(code + 65536 if code < 0 else code))
                    i += uc  # skip the plain fallback character
                elif not skip:
                    if word in ("par", "line", "row", "sect", "page"):
                        out.append("\n")
                    elif word == "tab":
                        out.append("\t")
                    elif word == "cell":
                        out.append(" | ")
            else:
                i += 1
        else:
            if not skip and c not in "\r\n":
                out.append(c)
            i += 1
    return "".join(out)


def read_epub(path):
    with _open_zip(path) as z:
        names = z.namelist()
        order = []
        try:
            container = _xml(_read_member(z, "META-INF/container.xml"))
            opf_path = next(el.attrib["full-path"] for el in container.iter() if _local(el.tag) == "rootfile")
            opf = _xml(_read_member(z, opf_path))
            manifest = {el.attrib["id"]: el.attrib["href"] for el in opf.iter() if _local(el.tag) == "item"}
            base = dirname(opf_path)
            for el in opf.iter():
                if _local(el.tag) == "itemref" and el.attrib.get("idref") in manifest:
                    order.append(normpath(join(base, manifest[el.attrib["idref"]])))
        except Exception:
            order = []
        order = [p for p in order if p in names and ext_of(p) in (".xhtml", ".html", ".htm", ".xml")]
        if not order:
            order = sorted(p for p in names if ext_of(p) in (".xhtml", ".html", ".htm"))
        pieces = [html_to_text(_text(_read_member(z, p))) for p in order]
    return "\n\n".join(x for x in pieces if x)


def read_eml(path):
    with open(path, "rb") as f:
        msg = BytesParser(policy=policy.default).parse(f)
    head = [f"{k}: {msg[k]}" for k in ("Subject", "From", "To", "Cc", "Date") if msg[k]]
    body = msg.get_body(preferencelist=("plain", "html"))
    text = ""
    if body is not None:
        text = body.get_content()
        if body.get_content_type() == "text/html":
            text = html_to_text(text)
    return "\n".join(head) + "\n\n" + text


def read_srt(path):
    text = _text(open(path, "rb").read())
    text = re.sub(r"^WEBVTT.*\n", "", text.replace("\r", ""), flags=re.I)
    out = []
    for block in re.split(r"\n\s*\n", text):
        lines = [l for l in block.split("\n") if l.strip()]
        if lines and re.fullmatch(r"\d+", lines[0].strip()):
            lines = lines[1:]
        if not lines:
            continue
        m = re.match(r"(\d{1,2}:)?(\d{2}:\d{2})[.,]\d+\s*-->", lines[0])
        if m:
            stamp = (m.group(1) or "") + m.group(2)
            body = " ".join(lines[1:])
            out.append(f"[{stamp}] {re.sub(r'<[^>]+>', '', body)}")
        else:
            out.append(" ".join(lines))
    return "\n".join(out)


def read_json(path):
    obj = json.loads(_text(open(path, "rb").read()))
    return json.dumps(obj, indent=2, ensure_ascii=False)


def read_xml(path):
    root = _xml(open(path, "rb").read())
    lines = []

    def walk(el, trail):
        here = trail + "/" + _local(el.tag)
        attrs = " ".join(f'{k.rsplit("}", 1)[-1]}="{v}"' for k, v in el.attrib.items())
        txt = (el.text or "").strip()
        if txt or attrs:
            lines.append(f"{here}{' [' + attrs + ']' if attrs else ''}: {txt}".rstrip(": ").rstrip())
        for ch in el:
            walk(ch, here)
            if (ch.tail or "").strip():
                lines.append(f"{here}: {ch.tail.strip()}")

    walk(root, "")
    return "\n".join(lines)


def read_pptx_slides(path):
    """One entry per slide, in the order of the deck."""
    with _open_zip(path) as z:
        names = set(z.namelist())
        slides = []
        try:
            pres = _xml(_read_member(z, "ppt/presentation.xml"))
            rels = _xml(_read_member(z, "ppt/_rels/presentation.xml.rels"))
            target = {r.attrib["Id"]: r.attrib["Target"] for r in rels}
            rid = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"
            for el in pres.iter():
                if _local(el.tag) == "sldId" and el.attrib.get(rid) in target:
                    slides.append(normpath(join("ppt", target[el.attrib[rid]])))
        except Exception:
            slides = []
        slides = [s for s in slides if s in names]
        if not slides:
            found = [n for n in names if re.fullmatch(r"ppt/slides/slide\d+\.xml", n)]
            slides = sorted(found, key=lambda n: int(re.findall(r"\d+", n)[-1]))
        out = []
        for s in slides:
            root = _xml(_read_member(z, s))
            paras = []
            for p in root.iter():
                if _local(p.tag) == "p":
                    t = "".join(el.text or "" for el in p.iter() if _local(el.tag) == "t")
                    if t.strip():
                        paras.append(t)
            out.append("\n".join(paras))
    return out


# ---------------------------------------------------------------- main entry

def load_pdf(path):
    return PyPDFLoader(path).load()


def load_file(path, name=None):
    """Read any supported file and return Documents shaped like PDF pages (page, page_label, source)."""
    name = name or path
    e = ext_of(name)
    if e == ".pdf":
        return load_pdf(path)
    if e == ".pptx":
        return [
            Document(page_content=t, metadata={"source": name, "page": i, "page_label": str(i + 1)})
            for i, t in enumerate(read_pptx_slides(path))
            if t.strip()
        ]
    if e == ".docx":
        text = read_docx(path)
    elif e == ".odt":
        text = read_odt(path)
    elif e == ".rtf":
        text = read_rtf(path)
    elif e == ".epub":
        text = read_epub(path)
    elif e == ".eml":
        text = read_eml(path)
    elif e in SUBTITLE_EXT:
        text = read_srt(path)
    elif e in HTML_EXT:
        text = html_to_text(_text(open(path, "rb").read()))
    elif e == ".json":
        text = read_json(path)
    elif e == ".xml":
        text = read_xml(path)
    elif e in TEXT_EXT or e in CODE_EXT:
        text = _text(open(path, "rb").read())
    else:
        raise ValueError("unsupported file type")
    return _parts(text, name)


def split_docs(docs, chunk_size=None, chunk_overlap=None):
    chunk_size = chunk_size or int(os.getenv("CHUNK_SIZE", 1000))
    chunk_overlap = chunk_overlap or int(os.getenv("CHUNK_OVERLAP", 150))
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size, chunk_overlap=chunk_overlap
    )
    chunks = splitter.split_documents(docs)
    for i, c in enumerate(chunks):
        c.metadata["chunk_id"] = i
    return chunks


if __name__ == "__main__":
    path = sys.argv[1]
    pages = load_file(path)
    chunks = split_docs(pages)
    print("pages", len(pages))
    print("chunks:", len(chunks))
    print("--- first chunk ---")
    print(chunks[0].page_content)
    print("metadata:", chunks[0].metadata)
