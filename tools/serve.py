#!/usr/bin/env python3
"""Lokaler Entwicklungsserver für mindcoded.studio – nur Python, kein Node.js.

  python tools/serve.py                 baut (Entwicklung) und startet http://127.0.0.1:8000
  python tools/serve.py --watch         baut bei Änderungen an content/, assets/, api/, static/ neu
  python tools/serve.py --api fail      Formular-Mock antwortet mit Serverfehler (Fehlerzustand testen)
  python tools/serve.py --api ratelimit Formular-Mock antwortet mit 429
  python tools/serve.py --api slow      Formular-Mock antwortet nach 3 Sekunden (Ladezustand testen)
  python tools/serve.py --no-build      nur ausliefern, was in dist/ liegt
  python tools/serve.py --lan           auch im WLAN erreichbar – zum Testen auf echten Handys/Tablets
                                        (Windows fragt beim ersten Mal nach der Firewall-Freigabe)

Liefert dist/ mit denselben Sicherheits-Headern aus wie die .htaccess (CSP-Fehler fallen
also schon lokal auf). POST /api/contact.php beantwortet ein MOCK mit demselben Vertrag
wie api/contact.php – es wird nichts versendet; angenommene Nachrichten landen nur als
Zählerstand in der Konsole. Den echten PHP-Endpunkt testet man mit »php -S« (siehe README).
"""
from __future__ import annotations

import argparse
import base64
import contextlib
import hashlib
import hmac
import importlib
import json
import re
import secrets
import sys
import threading
import time
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

sys.path.insert(0, str(Path(__file__).resolve().parent))
import build as site_build  # noqa: E402

import mcsite  # noqa: E402
from mcsite.common import SPECULATION_RULES_FILE, SPECULATION_RULES_HEADER, SPECULATION_RULES_TYPE  # noqa: E402

ROOT = site_build.ROOT
# Gleiche Regel wie MC_EMAIL_RE in api/contact.php
EMAIL_RE = re.compile(r"^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$")
CONTROL_RE = re.compile(r"[\x00-\x1F\x7F]+")


def load_settings(content_dir: Path = site_build.CONTENT) -> dict:
    site = site_build.load_json("site.json", content_dir)
    langs = {lang: site_build.load_json(f"{lang}.json", content_dir) for lang in site_build.LANGS}
    return site_build.contact_settings(site, langs)


def validate(form: dict, settings: dict) -> tuple[dict, dict]:
    """Spiegelt mc_validate() aus api/contact.php."""
    limits = settings["limits"]
    errors = {}
    first = lambda key: (form.get(key) or [""])[0]  # noqa: E731
    name = re.sub(r"\s{2,}", " ", CONTROL_RE.sub(" ", first("name"))).strip()
    if not name:
        errors["name"] = "required"
    elif len(name) > limits["nameMax"]:
        errors["name"] = "too_long"
    email = CONTROL_RE.sub(" ", first("email")).strip()
    if not email:
        errors["email"] = "required"
    elif len(email.encode()) > limits["emailMax"]:
        errors["email"] = "too_long"
    elif not EMAIL_RE.match(email):
        errors["email"] = "invalid"
    message = re.sub(r"[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]", "", first("message").replace("\r\n", "\n").replace("\r", "\n")).strip()
    if not message:
        errors["message"] = "required"
    elif len(message) < limits["messageMin"]:
        errors["message"] = "too_short"
    elif len(message) > limits["messageMax"]:
        errors["message"] = "too_long"
    topics = [t for t in dict.fromkeys(form.get("topics[]", []) + form.get("topics", [])) if t]
    if set(topics) - set(settings["topics"]):
        errors["topics"] = "invalid"
    timeline = first("timeline")
    if timeline and timeline not in settings["timelines"]:
        errors["timeline"] = "invalid"
    if settings["require_consent"] and not first("consent"):
        errors["consent"] = "required"
    lang = "en" if first("lang") == "en" else "de"
    return {"name": name, "email": email, "message": message, "topics": topics, "timeline": timeline, "lang": lang}, errors


def solve_challenge(task: dict) -> str:
    """Löst eine Rechenaufgabe wie assets/pow-worker.js – für Tests und Werkzeuge."""
    for number in range(task["maxnumber"] + 1):
        if hashlib.sha256(f"{task['salt']}{number}".encode()).hexdigest() == task["challenge"]:
            solution = {key: task[key] for key in ("algorithm", "challenge", "salt", "signature")}
            return base64.b64encode(json.dumps({**solution, "number": number}).encode()).decode()
    raise ValueError("Rechenaufgabe ohne Lösung")


class MockApi:
    """Vertragsgleicher Ersatz für api/contact.php (ohne Versand)."""

    def __init__(self, mode: str, settings: dict):
        self.mode = mode
        self.settings = settings
        self.hits: dict[str, list[float]] = {}
        self.accepted = 0
        self.quiet = False
        self.lock = threading.Lock()
        self.key = secrets.token_hex(32)
        self.used: dict[str, float] = {}

    def issue_challenge(self) -> dict:
        """Spiegelt mc_challenge_issue() aus api/lib/challenge.php."""
        cfg = self.settings["challenge"]
        salt = f"{secrets.token_hex(12)}?expires={int(time.time()) + cfg['ttl']}"
        challenge = hashlib.sha256(f"{salt}{secrets.randbelow(cfg['max_number'] + 1)}".encode()).hexdigest()
        return {"algorithm": "SHA-256", "challenge": challenge, "maxnumber": cfg["max_number"], "salt": salt,
                "signature": hmac.new(self.key.encode(), challenge.encode(), hashlib.sha256).hexdigest()}

    def verify_challenge(self, payload: str) -> bool:
        """Spiegelt mc_challenge_verify(): Signatur, Ablauf, Lösung, nur einmal gültig."""
        if not payload or len(payload) > 1000:
            return False
        try:
            data = json.loads(base64.b64decode(payload, validate=True))
        except ValueError:
            return False
        if not isinstance(data, dict):
            return False
        cfg = self.settings["challenge"]
        challenge, salt, number = str(data.get("challenge", "")), str(data.get("salt", "")), data.get("number")
        expires = re.search(r"\?expires=(\d{1,12})$", salt)
        now = time.time()
        if (data.get("algorithm") != "SHA-256" or not isinstance(number, int) or isinstance(number, bool)
                or not 0 <= number <= cfg["max_number"] or not re.fullmatch(r"[0-9a-f]{64}", challenge)
                or not expires or not now <= int(expires.group(1)) <= now + cfg["ttl"]):
            return False
        expected = hmac.new(self.key.encode(), challenge.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(expected, str(data.get("signature", ""))):
            return False
        if hashlib.sha256(f"{salt}{number}".encode()).hexdigest() != challenge:
            return False
        with self.lock:
            if challenge in self.used:
                return False
            self.used[challenge] = now
        return True

    def handle(self, client: str, headers, body: bytes, host: str) -> tuple[int, dict, str]:
        if len(body) > 20000:
            return 413, {"ok": False, "error": "too_large"}, "de"
        if headers.get("Sec-Fetch-Site", "").lower() in ("cross-site", "same-site"):
            return 403, {"ok": False, "error": "forbidden"}, "de"
        origin = headers.get("Origin")
        if origin is not None and (origin.lower() in ("", "null") or urlparse(origin).hostname != host.split(":")[0]):
            return 403, {"ok": False, "error": "forbidden"}, "de"
        ctype = headers.get("Content-Type", "")
        if "application/json" in ctype:
            try:
                raw = json.loads(body or b"{}")
            except ValueError:
                raw = {}
            raw = raw if isinstance(raw, dict) else {}
            form = {k: (v if isinstance(v, list) else [str(v)]) for k, v in raw.items()}
        else:
            form = parse_qs(body.decode("utf-8", "replace"), keep_blank_values=True)
        lang = "en" if (form.get("lang") or [""])[0] == "en" else "de"

        now = time.time()
        window = self.settings["rate_limit"]["window"]
        with self.lock:
            hits = [t for t in self.hits.get(client, []) if t > now - window]
            limited = len(hits) >= self.settings["rate_limit"]["max"] or self.mode == "ratelimit"
            if not limited:
                hits.append(now)
            self.hits[client] = hits
        if limited:
            return 429, {"ok": False, "error": "rate_limited"}, lang

        if not self.verify_challenge((form.get("altcha") or [""])[0]):
            return 422, {"ok": False, "error": "challenge"}, lang

        if (form.get("website") or [""])[0].strip():
            return 200, {"ok": True}, lang
        elapsed = (form.get("elapsed") or [""])[0]
        if elapsed.isdigit() and int(elapsed) < self.settings["limits"]["minFillSeconds"] * 1000:
            return 200, {"ok": True}, lang

        _, errors = validate(form, self.settings)
        if errors:
            return 422, {"ok": False, "error": "validation", "fields": errors}, lang
        if self.mode == "slow":
            time.sleep(3)
        if self.mode == "fail":
            return 502, {"ok": False, "error": "send_failed"}, lang
        with self.lock:
            self.accepted += 1
        if not self.quiet:
            print(f"  [Mock] Anfrage angenommen (#{self.accepted}) – nichts versendet", flush=True)
        return 200, {"ok": True}, lang


def make_handler(out: Path, api: MockApi | None, frameable: bool = False):
    headers = dict(site_build.SECURITY_HEADERS)
    headers[SPECULATION_RULES_HEADER[0]] = SPECULATION_RULES_HEADER[1]
    if frameable:
        # Nur für automatisierte Layout-Tests (iframes gleicher Herkunft) – nie für Vorschau oder Betrieb.
        headers.pop("X-Frame-Options", None)
        headers["Content-Security-Policy"] = headers["Content-Security-Policy"].replace("frame-ancestors 'none'", "frame-ancestors 'self'")

    class Handler(SimpleHTTPRequestHandler):
        extensions_map = {**SimpleHTTPRequestHandler.extensions_map, ".js": "text/javascript",
                          ".webmanifest": "application/manifest+json", ".woff2": "font/woff2", ".svg": "image/svg+xml"}

        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=str(out), **kwargs)

        def guess_type(self, path):
            return SPECULATION_RULES_TYPE if str(path).endswith(SPECULATION_RULES_FILE) else super().guess_type(path)

        def log_message(self, fmt, *args):  # ruhiger als der Standard
            if not getattr(self.server, "quiet", False) and args and str(args[1]).startswith(("4", "5")):
                super().log_message(fmt, *args)

        def end_headers(self):
            for key, value in headers.items():
                self.send_header(key, value)
            self.send_header("Cache-Control", "no-cache")
            super().end_headers()

        def blocked(self) -> bool:
            path = urlparse(self.path).path
            if path.startswith("/.well-known/"):
                return False
            return path.endswith((".php",)) and not path.endswith("/api/contact.php") or "/." in path

        def do_GET(self):
            path = urlparse(self.path).path
            if path.endswith("/api/contact.php"):
                if api is not None and urlparse(self.path).query == "challenge":
                    return self.json(200, api.issue_challenge())
                return self.json(405, {"ok": False, "error": "method_not_allowed"}, extra={"Allow": "POST"})
            if self.blocked():
                return self.not_found()
            target = Path(self.translate_path(self.path))
            if not target.exists() or (target.is_dir() and not (target / "index.html").exists()):
                return self.not_found()
            return super().do_GET()

        def do_HEAD(self):
            return self.do_GET()

        def do_POST(self):
            if not urlparse(self.path).path.endswith("/api/contact.php") or api is None:
                return self.json(404, {"ok": False, "error": "not_found"})
            length = int(self.headers.get("Content-Length") or 0)
            body = self.rfile.read(min(length, 20001))
            status, payload, lang = api.handle(self.client_address[0], self.headers, body, self.headers.get("Host", ""))
            if "application/json" in self.headers.get("Accept", ""):
                return self.json(status, payload)
            page = api.settings["redirects"][lang]["success" if payload.get("ok") else "error"]
            self.send_response(HTTPStatus.SEE_OTHER)
            self.send_header("Location", "/" + page)
            self.send_header("Content-Length", "0")
            self.end_headers()

        def json(self, status: int, payload: dict, extra: dict | None = None):
            data = json.dumps(payload).encode()
            self.send_response(status)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(data)))
            for key, value in (extra or {}).items():
                self.send_header(key, value)
            self.end_headers()
            self.wfile.write(data)

        def not_found(self):
            page = out / "404.html"
            data = page.read_bytes() if page.exists() else b"Not found"
            self.send_response(404)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            if self.command != "HEAD":
                self.wfile.write(data)

    return Handler


def create_server(out: Path, port: int = 0, api_mode: str | None = "ok", content_dir: Path = site_build.CONTENT,
                  rate_max: int | None = None, frameable: bool = False, host: str = "127.0.0.1") -> ThreadingHTTPServer:
    settings = load_settings(content_dir)
    if rate_max:
        settings["rate_limit"]["max"] = rate_max
    api = MockApi(api_mode, settings) if api_mode else None
    server = ThreadingHTTPServer((host, port), make_handler(out, api, frameable))
    server.api = api
    return server


def lan_address() -> str:
    """IP-Adresse dieses Rechners im lokalen Netz (es wird nichts gesendet)."""
    import socket
    with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as sock:
        try:
            sock.connect(("192.0.2.1", 9))  # Dokumentationsadresse – nur zur Auswahl der Schnittstelle
            return sock.getsockname()[0]
        except OSError:
            return "IP-des-Rechners"


def snapshot() -> dict:
    files = {}
    for folder in ("content", "assets", "api", "static", "tools"):
        for path in (ROOT / folder).rglob("*"):
            if path.is_file():
                files[str(path)] = path.stat().st_mtime
    return files


def watch(release: bool, out: Path | None) -> None:
    state = snapshot()
    while True:
        time.sleep(1)
        current = snapshot()
        if current != state:
            state = current
            # Build-Code frisch laden – sonst wirken Änderungen an tools/mcsite/ erst nach Neustart.
            try:
                mcsite.reload_all()
                builder = importlib.reload(site_build)
            except Exception as err:  # Syntaxfehler o. ä. im Generator – Server läuft weiter
                print(f"  Generator nicht ladbar: {err!r}", flush=True)
                continue
            try:
                builder.build(release=release, out=out)
                print("  Neu gebaut.", flush=True)
            except builder.BuildError as err:
                print("  Build-Fehler:\n    " + "\n    ".join(err.problems), flush=True)
            except Exception as err:  # Syntaxfehler o. ä. in build.py – Server läuft weiter
                print(f"  Build abgestürzt: {err!r}", flush=True)


def main() -> int:
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8")
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--port", type=int, default=8000)
    parser.add_argument("--api", choices=["ok", "fail", "ratelimit", "slow", "off"], default="ok")
    parser.add_argument("--release", action="store_true", help="Release-Build ausliefern")
    parser.add_argument("--no-build", action="store_true")
    parser.add_argument("--watch", action="store_true")
    parser.add_argument("--out", type=Path, help="Standard: dist-dev/ bzw. dist/ mit --release")
    parser.add_argument("--lan", action="store_true", help="auch im lokalen Netz erreichbar (echte Geräte)")
    args = parser.parse_args()
    args.out = args.out or site_build.default_out(args.release)

    if not args.no_build:
        try:
            site_build.build(release=args.release, out=args.out)
        except site_build.BuildError as err:
            print("Build fehlgeschlagen:\n  " + "\n  ".join(err.problems), file=sys.stderr)
            return 1
    server = create_server(args.out, args.port, None if args.api == "off" else args.api,
                           host="0.0.0.0" if args.lan else "127.0.0.1")
    port = server.server_address[1]
    print(f"mindcoded.studio läuft auf http://127.0.0.1:{port}/  (Strg+C beendet)")
    if args.lan:
        print(f"  Im WLAN: http://{lan_address()}:{port}/ – nur in vertrauenswürdigen Netzen verwenden.")
    if args.api != "off":
        print(f"  Formular: MOCK-Modus »{args.api}« – es wird nichts versendet.")
    if args.watch:
        threading.Thread(target=watch, args=(args.release, args.out), daemon=True).start()
    with contextlib.suppress(KeyboardInterrupt):
        server.serve_forever()
    return 0


if __name__ == "__main__":
    sys.exit(main())
