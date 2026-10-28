"""Gemeinsame Konstanten, Hilfsfunktionen und Datentypen des Seitengenerators."""
from __future__ import annotations

import hashlib
import html
import json
import re
from dataclasses import dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CONTENT = ROOT / "content"
ASSETS = ROOT / "assets"
STATIC = ROOT / "static"
API = ROOT / "api"

LANGS = ("de", "en")
TODO_RE = re.compile(r"\bTODO\b")
STEP_NUMBER_RE = re.compile(r"^[0-9]+[.)]\s*")  # »1. Zuhören« → Nummer kommt aus der Liste
PLACEHOLDER_RE = re.compile(r"\{([a-zA-Z][\w.]*)\}")
LINK_RE = re.compile(r"\[([^\]]+)\]\(([^)\s]+)\)")
SAFE_HREF_RE = re.compile(r"^(https://|mailto:|#|\./|\.\./|[a-z0-9-]+/)(?!/|\\)")
SLUG_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
PATH_SLUG_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*(?:/[a-z0-9]+(?:-[a-z0-9]+)*)*$")
IMAGE_PATH_RE = re.compile(r"[A-Za-z0-9_-]+(?:/[A-Za-z0-9_.-]+)*\.(?:webp|avif|jpg|jpeg|png)")
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[A-Za-z]{2,}$")
BUILD_MARKER = ".mindcoded-build"
TODO_OPEN, TODO_CLOSE = "\x02", "\x03"

# Sicherheits-Header: eine Quelle für .htaccess (Apache) und tools/serve.py (lokal).
CSP = "; ".join([
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self'",
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'self'",
    # Nur der Video-Player, und erst nach Klick (assets/video.js, Zwei-Klick-Lösung)
    "frame-src https://www.youtube-nocookie.com",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "object-src 'none'",
    "manifest-src 'self'",
])
SECURITY_HEADERS = {
    "Content-Security-Policy": CSP,
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-Frame-Options": "DENY",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
    "Cross-Origin-Opener-Policy": "same-origin",
}

# Vorladen beim Projektwechsel (Speculation Rules): Der Browser lädt die Case Study vor, sobald der
# Zeiger auf einem Projektlink verweilt – während der Vorhang fährt, ist sie meist schon da.
# Nur »prefetch« (laden), kein »prerender«: Eine vorab gezeichnete Seite hätte ihren Vorhang beim
# Öffnen schon halb gehoben. Als Header statt Inline-Skript, damit die CSP streng bleibt.
SPECULATION_RULES_FILE = "speculation-rules.json"
SPECULATION_RULES_TYPE = "application/speculationrules+json"
SPECULATION_RULES_HEADER = ("Speculation-Rules", f'"/{SPECULATION_RULES_FILE}"')
SPECULATION_RULES = {"prefetch": [{"source": "document", "where": {"selector_matches": "a[data-curtain-link]"},
                                   "eagerness": "moderate"}]}

# Bekannte Crawler für KI-Training (für content/site.json › seo.blockAiTraining).
AI_TRAINING_BOTS = ("GPTBot", "ClaudeBot", "CCBot", "Google-Extended", "Applebot-Extended", "Meta-ExternalAgent", "Bytespider")


class BuildError(Exception):
    def __init__(self, problems: list[str]):
        super().__init__("\n".join(problems))
        self.problems = problems


def esc(value) -> str:
    return html.escape(str(value), quote=True)


def script_json(data) -> str:
    """JSON für <script>-Datenblöcke: <, > und & maskiert, damit der HTML-Parser nie
    aus dem Block ausbrechen kann."""
    text = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    return text.replace("<", "\\u003c").replace(">", "\\u003e").replace("&", "\\u0026")


def load_json(name: str, content_dir: Path = CONTENT) -> dict:
    with (content_dir / name).open(encoding="utf-8") as fh:
        return json.load(fh)


def dig(data, path: str):
    cur = data
    for part in path.split("."):
        if isinstance(cur, dict) and part in cur:
            cur = cur[part]
        else:
            raise KeyError(path)
    return cur


def is_todo(value) -> bool:
    return isinstance(value, str) and bool(TODO_RE.search(value))


def file_hash(data: bytes | str) -> str:
    if isinstance(data, str):
        data = data.encode("utf-8")
    return hashlib.sha256(data).hexdigest()[:10]


def truncate(text: str, limit: int = 155) -> str:
    """Kürzt an einer Wortgrenze (für Meta-Beschreibungen)."""
    text = " ".join(str(text).split())
    if len(text) <= limit:
        return text
    cut = text[: limit - 1].rsplit(" ", 1)[0].rstrip(" ,;:–-")
    return cut + "…"


def php_export(value, indent: int = 0) -> str:
    pad = "    " * indent
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, (int, float)):
        return repr(value)
    if isinstance(value, str):
        return "'" + value.replace("\\", "\\\\").replace("'", "\\'") + "'"
    if isinstance(value, list):
        inner = ", ".join(php_export(v, indent + 1) for v in value)
        return f"[{inner}]"
    if isinstance(value, dict):
        rows = [f"{pad}    {php_export(str(k))} => {php_export(v, indent + 1)}," for k, v in value.items()]
        return "[\n" + "\n".join(rows) + f"\n{pad}]"
    raise TypeError(type(value))


@dataclass
class Page:
    path: str          # Ausgabepfad als Verzeichnis, z. B. "" oder "en/" oder "impressum/"
    lang: str
    kind: str          # home | case | service | legal | message | notfound
    absolute: bool = False  # 404: Pfade ab Domain-Wurzel

    @property
    def base(self) -> str:
        if self.absolute:
            return "/"
        return "../" * self.path.count("/")

    def to(self, target: str) -> str:
        """Relativer Link von dieser Seite zu einem Zielpfad im Ausgabeordner."""
        return (self.base + target) or "./"
