"""Forgot-password by email. Uses only the standard library.

Needs these settings in .env (all optional; without them the feature says it is unavailable):
  SMTP_USER   the sender address, for example a Gmail address
  SMTP_PASS   the app password for that address (never your normal password)
  SMTP_HOST   default smtp.gmail.com
  SMTP_PORT   default 465 (SSL)
  SITE_URL    default https://documindai.duckdns.org
"""
import hashlib
import os
import secrets
import smtplib
import time
from email.message import EmailMessage

from fastapi import APIRouter, BackgroundTasks, HTTPException, Request
from pydantic import BaseModel

import auth

router = APIRouter()

RESET_MINUTES = 30
SITE_URL = os.getenv("SITE_URL", "https://documindai.duckdns.org").rstrip("/")


class ForgotBody(BaseModel):
    email: str


class ResetBody(BaseModel):
    token: str
    password: str


def _hash(token):
    return hashlib.sha256(token.encode()).hexdigest()


def _table():
    con = auth._db()
    con.execute(
        "create table if not exists resets "
        "(token_hash text primary key, uid text, expires real, used integer)"
    )
    return con


def configured():
    return bool(os.getenv("SMTP_USER") and os.getenv("SMTP_PASS"))


def send_mail(to, subject, text):
    """Send one plain-text email. Failures are printed to the server log, never shown to the visitor."""
    try:
        msg = EmailMessage()
        msg["From"] = f"DocuMind <{os.getenv('SMTP_USER')}>"
        msg["To"] = to
        msg["Subject"] = subject
        msg.set_content(text)
        host = os.getenv("SMTP_HOST", "smtp.gmail.com")
        port = int(os.getenv("SMTP_PORT", "465"))
        with smtplib.SMTP_SSL(host, port, timeout=20) as s:
            s.login(os.getenv("SMTP_USER"), os.getenv("SMTP_PASS"))
            s.send_message(msg)
    except Exception as e:  # noqa: BLE001
        print("reset email failed:", type(e).__name__, e)


@router.post("/auth/forgot")
def forgot(body: ForgotBody, request: Request, tasks: BackgroundTasks):
    ip = auth.client_ip(request)
    auth.hit(("fp-ip", ip), 5, 3600, "Too many reset requests. Please try again later.")
    if not configured():
        raise HTTPException(
            status_code=503,
            detail="Password reset by email is not available right now. Use Try the demo, or email the owner.",
        )
    email = body.email.strip().lower()
    auth.hit(("fp-mail", email), 3, 3600, "Too many reset requests. Please try again later.")
    con = _table()
    row = con.execute("select id, guest from users where email=?", (email,)).fetchone()
    if row and not row[1]:
        token = secrets.token_urlsafe(32)
        con.execute(
            "insert into resets values (?,?,?,0)", (_hash(token), row[0], time.time() + RESET_MINUTES * 60)
        )
        con.commit()
        link = f"{SITE_URL}/reset?token={token}"
        text = (
            "Hello,\n\n"
            "Someone asked to reset the password for your DocuMind account.\n"
            f"Open this link within {RESET_MINUTES} minutes to choose a new password:\n\n"
            f"{link}\n\n"
            "If you did not ask for this, you can ignore this email. Your password stays the same.\n\n"
            "DocuMind"
        )
        tasks.add_task(send_mail, email, "Reset your DocuMind password", text)
    con.close()
    # same answer whether or not the email exists, so nobody can test which emails are registered
    return {"ok": True, "message": "If that email has an account, a reset link is on its way. It lasts 30 minutes."}


@router.post("/auth/reset")
def reset(body: ResetBody, request: Request):
    auth.hit(("rs-ip", auth.client_ip(request)), 10, 3600, "Too many attempts. Please try again later.")
    if not 8 <= len(body.password) <= 128:
        raise HTTPException(status_code=400, detail="Password must be 8 to 128 characters.")
    con = _table()
    row = con.execute(
        "select uid, expires, used from resets where token_hash=?", (_hash(body.token.strip()),)
    ).fetchone()
    if not row or row[2] or row[1] < time.time():
        con.close()
        raise HTTPException(status_code=400, detail="This reset link is invalid or has expired. Please ask for a new one.")
    con.execute("update users set pw=? where id=?", (auth.hash_pw(body.password), row[0]))
    con.execute("delete from resets where uid=?", (row[0],))  # all links for this user are now dead
    con.commit()
    con.close()
    return {"ok": True, "message": "Password changed. You can log in now."}
