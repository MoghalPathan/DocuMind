"""Sign up, log in, guest demo, signed tokens and simple limits. Uses only the standard library."""
import base64
import hashlib
import hmac
import json
import os
import re
import secrets
import sqlite3
import time
from collections import defaultdict, deque

from fastapi import Header, HTTPException, Query, Request
from pydantic import BaseModel

DATA = "data"
DB_PATH = os.path.join(DATA, "users.db")
TOKEN_HOURS = 24 * 7
GUEST_HOURS = 24


def _int(name, default):
    return int(os.getenv(name, default))


QUESTIONS_PER_HOUR = _int("QUESTIONS_PER_HOUR", 40)
GUEST_QUESTIONS_PER_HOUR = _int("GUEST_QUESTIONS_PER_HOUR", 15)
UPLOADS_PER_DAY = _int("UPLOADS_PER_DAY", 10)
GUEST_UPLOADS_PER_DAY = _int("GUEST_UPLOADS_PER_DAY", 3)
MAX_DOCS = _int("MAX_DOCS", 10)
GUEST_MAX_DOCS = _int("GUEST_MAX_DOCS", 2)
MAX_PDF_MB = _int("MAX_PDF_MB", 15)
MAX_PAGES = _int("MAX_PAGES", 300)
AUTH_PER_MINUTE = _int("AUTH_PER_MINUTE", 10)

_secret = None


class Credentials(BaseModel):
    email: str
    password: str


def secret():
    global _secret
    if _secret:
        return _secret
    env = os.getenv("DOCUMIND_SECRET")
    if env:
        _secret = env.encode()
        return _secret
    os.makedirs(DATA, exist_ok=True)
    path = os.path.join(DATA, "secret.key")
    if not os.path.isfile(path):
        with open(path, "w") as f:
            f.write(secrets.token_hex(32))
    _secret = open(path).read().strip().encode()
    return _secret


def _db():
    os.makedirs(DATA, exist_ok=True)
    con = sqlite3.connect(DB_PATH)
    con.execute(
        "create table if not exists users "
        "(id text primary key, email text unique, pw text, guest integer, created real)"
    )
    # "ver" is the login version: raising it logs the user out of every device
    if "ver" not in [r[1] for r in con.execute("pragma table_info(users)")]:
        con.execute("alter table users add column ver integer not null default 0")
        con.commit()
    return con


def hash_pw(password, salt=None):
    salt = salt or os.urandom(16)
    h = hashlib.scrypt(password.encode(), salt=salt, n=2**14, r=8, p=1, dklen=32)
    return salt.hex() + "$" + h.hex()


def check_pw(password, stored):
    try:
        salt_hex, h_hex = stored.split("$")
        again = hash_pw(password, bytes.fromhex(salt_hex)).split("$")[1]
        return hmac.compare_digest(again, h_hex)
    except Exception:
        return False


def _b64(raw):
    return base64.urlsafe_b64encode(raw).decode().rstrip("=")


def _unb64(text):
    return base64.urlsafe_b64decode(text + "=" * (-len(text) % 4))


def make_token(uid, hours=TOKEN_HOURS, ver=0):
    body = _b64(json.dumps({"u": uid, "e": int(time.time() + hours * 3600), "v": ver}).encode())
    sig = _b64(hmac.new(secret(), body.encode(), hashlib.sha256).digest())
    return body + "." + sig


def token_data(token):
    """The checked contents of a token, or None when it is wrong or expired."""
    try:
        body, sig = token.split(".")
        good = _b64(hmac.new(secret(), body.encode(), hashlib.sha256).digest())
        if not hmac.compare_digest(sig, good):
            return None
        data = json.loads(_unb64(body))
        return data if data["e"] > time.time() else None
    except Exception:
        return None


def read_token(token):
    data = token_data(token)
    return data["u"] if data else None


# ---- simple in-memory limits (they reset when the server restarts)
_hits = defaultdict(deque)


def hit(key, limit, seconds, message):
    now = time.time()
    q = _hits[key]
    while q and q[0] <= now - seconds:
        q.popleft()
    if len(q) >= limit:
        raise HTTPException(status_code=429, detail=message)
    q.append(now)


def client_ip(request):
    if os.getenv("TRUST_PROXY") == "1":
        fwd = request.headers.get("x-forwarded-for")
        if fwd:
            return fwd.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def user_limits(user):
    g = user["guest"]
    return {
        "questions": GUEST_QUESTIONS_PER_HOUR if g else QUESTIONS_PER_HOUR,
        "uploads": GUEST_UPLOADS_PER_DAY if g else UPLOADS_PER_DAY,
        "docs": GUEST_MAX_DOCS if g else MAX_DOCS,
    }


def limit_question(user):
    n = user_limits(user)["questions"]
    hit(("q", user["id"]), n, 3600, f"Question limit reached ({n} per hour). Please try again later.")


def limit_upload(user):
    n = user_limits(user)["uploads"]
    hit(("u", user["id"]), n, 86400, f"Upload limit reached ({n} per day). Please try again tomorrow.")


# ---- accounts
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def _user_row(row):
    return {"id": row[0], "email": row[1], "guest": bool(row[3]), "ver": row[5] if len(row) > 5 else 0}


def signup(creds, request):
    hit(("a", client_ip(request)), AUTH_PER_MINUTE, 60, "Too many attempts. Please wait a minute.")
    email = creds.email.strip().lower()
    if not EMAIL_RE.match(email) or len(email) > 120:
        raise HTTPException(status_code=400, detail="Please enter a valid email address.")
    if not 8 <= len(creds.password) <= 128:
        raise HTTPException(status_code=400, detail="Password must be 8 to 128 characters.")
    uid = "u" + secrets.token_hex(8)
    con = _db()
    try:
        con.execute(
            "insert into users (id, email, pw, guest, created) values (?,?,?,?,?)",
            (uid, email, hash_pw(creds.password), 0, time.time()),
        )
        con.commit()
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=409, detail="That email is already registered. Try logging in.")
    finally:
        con.close()
    return {"token": make_token(uid), "user": {"id": uid, "email": email, "guest": False}}


def login(creds, request):
    hit(("a", client_ip(request)), AUTH_PER_MINUTE, 60, "Too many attempts. Please wait a minute.")
    email = creds.email.strip().lower()
    con = _db()
    row = con.execute("select * from users where email=?", (email,)).fetchone()
    con.close()
    ok = check_pw(creds.password, row[2]) if row else check_pw(creds.password, hash_pw("x"))
    if not row or not ok or row[3]:
        raise HTTPException(status_code=401, detail="Wrong email or password.")
    return {"token": make_token(row[0], ver=_user_row(row)["ver"]), "user": {"id": row[0], "email": row[1], "guest": False}}


def _raise_version(uid):
    con = _db()
    con.execute("update users set ver = ver + 1 where id=?", (uid,))
    con.commit()
    ver = con.execute("select ver from users where id=?", (uid,)).fetchone()[0]
    con.close()
    return ver


def change_password(user, current, new):
    """Check the current password, save the new one, and log out every other device. Returns a fresh token."""
    if user["guest"]:
        raise HTTPException(status_code=400, detail="Demo sessions have no password.")
    hit(("pw", user["id"]), 5, 3600, "Too many attempts. Please try again later.")
    if not 8 <= len(new) <= 128:
        raise HTTPException(status_code=400, detail="New password must be 8 to 128 characters.")
    con = _db()
    row = con.execute("select pw from users where id=?", (user["id"],)).fetchone()
    if not row or not check_pw(current, row[0]):
        con.close()
        raise HTTPException(status_code=403, detail="Current password is wrong.")
    if hmac.compare_digest(current, new):
        con.close()
        raise HTTPException(status_code=400, detail="New password must be different.")
    con.execute("update users set pw=? where id=?", (hash_pw(new), user["id"]))
    con.commit()
    con.close()
    return {"token": make_token(user["id"], ver=_raise_version(user["id"]))}


def logout_everywhere(user):
    """Every saved login for this account stops working, on every device."""
    if user["guest"]:
        raise HTTPException(status_code=400, detail="Demo sessions cannot do this.")
    _raise_version(user["id"])
    return {"ok": True}


def demo(request):
    hit(("a", client_ip(request)), AUTH_PER_MINUTE, 60, "Too many attempts. Please wait a minute.")
    uid = "g" + secrets.token_hex(6)
    con = _db()
    con.execute(
        "insert into users (id, email, pw, guest, created) values (?,?,?,?,?)", (uid, f"{uid}@guest", "", 1, time.time())
    )
    con.commit()
    con.close()
    return {"token": make_token(uid, GUEST_HOURS), "user": {"id": uid, "email": "Guest", "guest": True}}


def _lookup(token):
    data = token_data(token) if token else None
    if not data:
        return None
    con = _db()
    row = con.execute("select * from users where id=?", (data["u"],)).fetchone()
    con.close()
    if not row:
        return None
    user = _user_row(row)
    if data.get("v", 0) != user["ver"]:  # the user logged out of all devices
        return None
    return user


def current_user(authorization: str | None = Header(None)):
    token = authorization[7:] if authorization and authorization.lower().startswith("bearer ") else None
    user = _lookup(token)
    if not user:
        raise HTTPException(status_code=401, detail="Please log in.")
    return user


def file_user(authorization: str | None = Header(None), token: str | None = Query(None)):
    # PDF links open in a new tab and cannot send headers, so this one also accepts ?token=
    raw = authorization[7:] if authorization and authorization.lower().startswith("bearer ") else token
    user = _lookup(raw)
    if not user:
        raise HTTPException(status_code=401, detail="Please log in.")
    return user
