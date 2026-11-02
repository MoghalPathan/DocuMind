"""Delete an account and everything linked to it, and clean up old demo (guest) accounts."""
import glob
import json
import os
import shutil
import threading
import time

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from qdrant_client import QdrantClient, models

import auth

router = APIRouter()

COLLECTION = "documind"
GUEST_KEEP_HOURS = auth.GUEST_HOURS * 2  # a demo login lasts 24 hours; its data is removed after 48
_client_cache = None


def _client():
    global _client_cache
    if _client_cache is None:
        _client_cache = QdrantClient(url=os.getenv("QDRANT_URL", "http://localhost:6333"))
    return _client_cache


def purge_user(uid):
    """Remove one user's search chunks, files, share links, reset links and the account row."""
    c = _client()
    if c.collection_exists(COLLECTION):
        c.delete(
            collection_name=COLLECTION,
            points_selector=models.FilterSelector(
                filter=models.Filter(
                    must=[models.FieldCondition(key="metadata.owner", match=models.MatchValue(value=uid))]
                )
            ),
        )
    shutil.rmtree(os.path.join(auth.DATA, uid), ignore_errors=True)
    for path in glob.glob(os.path.join(auth.DATA, "shares", "*.json")):
        try:
            with open(path, encoding="utf-8") as f:
                if json.load(f).get("owner") == uid:
                    os.remove(path)
        except Exception:  # noqa: BLE001
            continue
    con = auth._db()
    con.execute("create table if not exists resets (token_hash text primary key, uid text, expires real, used integer)")
    con.execute("delete from resets where uid=?", (uid,))
    con.execute("delete from users where id=?", (uid,))
    con.commit()
    con.close()


class DeleteBody(BaseModel):
    password: str | None = None


@router.post("/account/delete")
def delete_account(body: DeleteBody, request: Request, user=Depends(auth.current_user)):
    auth.hit(("del", auth.client_ip(request)), 5, 3600, "Too many attempts. Please try again later.")
    if not user["guest"]:
        con = auth._db()
        row = con.execute("select pw from users where id=?", (user["id"],)).fetchone()
        con.close()
        if not row or not body.password or not auth.check_pw(body.password, row[0]):
            raise HTTPException(status_code=403, detail="Wrong password.")
    purge_user(user["id"])
    return {"deleted": True}


def clean_guests():
    """Delete demo accounts (and their files) older than GUEST_KEEP_HOURS. Returns how many were removed."""
    cutoff = time.time() - GUEST_KEEP_HOURS * 3600
    con = auth._db()
    old = [r[0] for r in con.execute("select id from users where guest=1 and created<?", (cutoff,)).fetchall()]
    con.close()
    for uid in old:
        try:
            purge_user(uid)
        except Exception as e:  # noqa: BLE001
            print("guest cleanup failed for", uid, type(e).__name__, e)
    return len(old)


def _loop():
    time.sleep(120)  # let the server finish starting first
    while True:
        try:
            n = clean_guests()
            if n:
                print(f"removed {n} old demo accounts")
        except Exception as e:  # noqa: BLE001
            print("guest cleanup error:", type(e).__name__, e)
        time.sleep(3600)


threading.Thread(target=_loop, daemon=True).start()
