"""Read a web page from a link, safely: only public websites, small pages, no private addresses."""
import ipaddress
import re
import socket
from urllib.parse import urljoin, urlsplit, urlunsplit

import httpx

import ingest

MAX_BYTES = 5 * 1024 * 1024
MAX_REDIRECTS = 3
TIMEOUT = 10
ALLOWED_PORTS = {80, 443}
VERIFY = True  # tests point this at their own certificate
PAGE_TYPES = ("text/html", "application/xhtml+xml", "text/plain")


class LinkError(Exception):
    """A problem the user can read and fix."""


def _public_ips(host, port):
    """All addresses of the host, and an error if any of them is not a public one."""
    try:
        infos = socket.getaddrinfo(host, port, type=socket.SOCK_STREAM)
    except OSError:
        raise LinkError("Could not find that website.")
    ips = []
    for info in infos:
        ip = ipaddress.ip_address(info[4][0])
        if ip.version == 6 and ip.ipv4_mapped:
            ip = ip.ipv4_mapped
        if not ip.is_global:
            raise LinkError("That address is not allowed. Use a public web page.")
        ips.append(ip)
    if not ips:
        raise LinkError("Could not find that website.")
    ips.sort(key=lambda i: i.version)  # prefer IPv4
    return ips


def check_url(url):
    url = (url or "").strip()
    if not url or len(url) > 2000:
        raise LinkError("Enter a web page link.")
    if "://" not in url:
        url = "https://" + url
    p = urlsplit(url)
    if p.scheme not in ("http", "https") or not p.hostname:
        raise LinkError("Only http and https links are supported.")
    if p.username or p.password:
        raise LinkError("Links with a user name or password are not allowed.")
    port = p.port or (443 if p.scheme == "https" else 80)
    if port not in ALLOWED_PORTS:
        raise LinkError("That port is not allowed.")
    return url, p, port


def _charset(content_type, head):
    m = re.search(r"charset=([\w-]+)", content_type or "", re.I) or re.search(rb"charset=[\"']?([\w-]+)", head, re.I)
    if not m:
        return None
    return m.group(1).decode("ascii", "ignore") if isinstance(m.group(1), bytes) else m.group(1)


def _fetch_once(url):
    """One request. The connection goes to the address we checked, so the address cannot change underneath us."""
    url, p, port = check_url(url)
    ip = _public_ips(p.hostname, port)[0]
    host_ip = f"[{ip}]" if ip.version == 6 else str(ip)
    if p.port:
        host_ip += f":{p.port}"
    pinned = urlunsplit((p.scheme, host_ip, p.path or "/", p.query, ""))
    headers = {
        "Host": p.hostname + (f":{p.port}" if p.port else ""),
        "User-Agent": "DocuMindBot/1.0 (reads one page when a user adds its link)",
        "Accept": "text/html,text/plain;q=0.9",
        "Accept-Encoding": "identity",
    }
    ext = {"sni_hostname": p.hostname} if p.scheme == "https" else {}
    try:
        with httpx.Client(timeout=TIMEOUT, follow_redirects=False, verify=VERIFY, trust_env=False) as c:
            with c.stream("GET", pinned, headers=headers, extensions=ext) as r:
                if r.status_code in (301, 302, 303, 307, 308):
                    return url, r.headers.get("location"), None, None
                if r.status_code != 200:
                    raise LinkError(f"The website answered with status {r.status_code}.")
                ctype = r.headers.get("content-type", "").split(";")[0].strip().lower()
                if ctype not in PAGE_TYPES:
                    raise LinkError("That link is not a web page. For a PDF or other file, download it and attach it.")
                body = bytearray()
                for chunk in r.iter_bytes():
                    body.extend(chunk)
                    if len(body) > MAX_BYTES:
                        raise LinkError("That page is too large (max 5 MB).")
                return url, None, bytes(body), r.headers.get("content-type", "")
    except LinkError:
        raise
    except httpx.TimeoutException:
        raise LinkError("The website took too long to answer.")
    except httpx.HTTPError:
        raise LinkError("Could not open that link.")


def read_link(url):
    """Returns (file name, pages). Raises LinkError with a message the user can read."""
    current = url
    for _ in range(MAX_REDIRECTS + 1):
        final, location, body, ctype = _fetch_once(current)
        if location is None:
            break
        current = urljoin(final, location)
    else:
        raise LinkError("That link redirects too many times.")
    enc = _charset(ctype, body[:2048])
    try:
        html = body.decode(enc) if enc else ingest._text(body)
    except (LookupError, UnicodeError):
        html = ingest._text(body)
    plain = (ctype or "").split(";")[0].strip().lower() == "text/plain"
    text = html if plain else ingest.html_to_text(html)
    p = urlsplit(final)
    slug = re.sub(r"[^a-z0-9]+", "-", (p.hostname + p.path).lower()).strip("-")[:60] or "page"
    name = slug + ".html"
    return name, ingest._parts(text, name)
