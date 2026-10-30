"""Share links: a saved read-only copy of a conversation that anyone with the link can open."""
import json
import os
import re
import secrets
import time

from fastapi import HTTPException

import auth

DIR = os.path.join(auth.DATA, "shares")
ID_RE = re.compile(r"^[A-Za-z0-9_-]{8,32}$")


def _path(sid):
    if not ID_RE.match(sid or ""):
        raise HTTPException(status_code=404, detail="This shared link does not exist.")
    return os.path.join(DIR, sid + ".json")


def _clean(messages):
    out = []
    for m in (messages or [])[:120]:
        if not isinstance(m, dict):
            continue
        text = str(m.get("text") or "")[:8000]
        if not text:
            continue
        cites = []
        for c in (m.get("cites") or [])[:8]:
            if isinstance(c, dict):
                cites.append({"doc": str(c.get("doc") or "")[:120], "page": str(c.get("page") or "")[:12]})
        out.append(
            {
                "role": "user" if m.get("role") == "user" else "ai",
                "text": text,
                "cites": cites,
                "noAnswer": bool(m.get("noAnswer")),
            }
        )
    return out


def _load(sid):
    try:
        with open(_path(sid), encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="This shared link does not exist or was removed.")


def create(user, share_id, title, messages):
    msgs = _clean(messages)
    if not msgs:
        raise HTTPException(status_code=400, detail="Nothing to share yet.")
    auth.hit(("share", user["id"]), 20, 3600, "Too many shares. Please try again later.")
    sid = None
    if share_id and ID_RE.match(share_id) and os.path.exists(_path(share_id)):
        if _load(share_id).get("owner") == user["id"]:
            sid = share_id  # same owner: update the existing link
    if not sid:
        sid = secrets.token_urlsafe(9)
    os.makedirs(DIR, exist_ok=True)
    with open(_path(sid), "w", encoding="utf-8") as f:
        json.dump(
            {"title": str(title or "Conversation")[:80], "messages": msgs, "owner": user["id"], "created": int(time.time())},
            f,
        )
    return {"id": sid}


def read(sid):
    d = _load(sid)
    return {"title": d.get("title", ""), "messages": d.get("messages", []), "created": d.get("created")}


def remove(user, sid):
    d = _load(sid)
    if d.get("owner") != user["id"]:
        raise HTTPException(status_code=403, detail="Only the owner can remove this link.")
    os.remove(_path(sid))
    return {"ok": True}
