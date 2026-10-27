"""Gemeinsame Helfer für die Tests (nur Standardbibliothek)."""
from __future__ import annotations

import json
import shutil
import tempfile
import threading
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FIXTURES = ROOT / "tests" / "fixtures"

import sys  # noqa: E402

sys.path.insert(0, str(ROOT / "tools"))
import build as site_build  # noqa: E402
import export_tokens  # noqa: E402, F401 – von den Tests über dieses Modul genutzt
import new_project  # noqa: E402, F401 – von den Tests über dieses Modul genutzt
import serve as site_serve  # noqa: E402


class Node:
    __slots__ = ("tag", "attrs", "parent", "children", "text")

    def __init__(self, tag, attrs, parent):
        self.tag, self.attrs, self.parent = tag, dict(attrs), parent
        self.children, self.text = [], []

    def all_text(self) -> str:
        parts = list(self.text)
        for child in self.children:
            parts.append(child.all_text())
        return " ".join(p for p in parts if p).strip()

    def iter(self):
        yield self
        for child in self.children:
            yield from child.iter()


class Doc(HTMLParser):
    """Kleiner DOM-Baum – reicht für strukturelle Prüfungen."""
    VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"}

    def __init__(self, html: str):
        super().__init__(convert_charrefs=True)
        self.root = Node("#root", [], None)
        self.cur = self.root
        self.doctype = None
        self.raw = html
        self.feed(html)

    def handle_decl(self, decl):
        self.doctype = decl

    def handle_starttag(self, tag, attrs):
        node = Node(tag, attrs, self.cur)
        self.cur.children.append(node)
        if tag not in self.VOID:
            self.cur = node

    def handle_startendtag(self, tag, attrs):
        self.cur.children.append(Node(tag, attrs, self.cur))

    def handle_endtag(self, tag):
        node = self.cur
        while node is not self.root and node.tag != tag:
            node = node.parent
        if node is not self.root:
            self.cur = node.parent

    def handle_data(self, data):
        if data.strip():
            self.cur.text.append(" ".join(data.split()))

    def all(self, tag=None):
        return [n for n in self.root.iter() if n.tag != "#root" and (tag is None or n.tag == tag)]

    def by_id(self, id_):
        return next((n for n in self.root.iter() if n.attrs.get("id") == id_), None)


def make_release_content(tmp: Path, mail_server: str = "own") -> Path:
    """Kopiert content/ und ersetzt alle Betreiber-TODOs durch synthetische Werte."""
    content = tmp / "content"
    shutil.copytree(ROOT / "content", content)
    fx = json.loads((FIXTURES / "synthetic" / "operator.json").read_text(encoding="utf-8"))
    site = json.loads((content / "site.json").read_text(encoding="utf-8"))
    site["url"] = fx["url"]
    site["operator"].update(fx["operator"])
    site["about"].update(fx["about"])
    site["hosting"].update(fx["hosting"])
    site["privacy"].update(fx["privacy"])
    site["contact"]["mailServer"] = mail_server
    (content / "site.json").write_text(json.dumps(site, ensure_ascii=False, indent=2), encoding="utf-8")
    for lang in ("de", "en"):
        data = json.loads((content / f"{lang}.json").read_text(encoding="utf-8"))
        for key, values in fx["lang"].items():
            data["about"][key] = values[lang]
        (content / f"{lang}.json").write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    return content


class Server:
    """Startet den Entwicklungsserver (inkl. Formular-Mock) in einem Thread."""

    def __init__(self, out: Path, api_mode: str = "ok", rate_max: int | None = 1000, content_dir: Path | None = None,
                 frameable: bool = False):
        self.httpd = site_serve.create_server(out, 0, api_mode, content_dir or site_build.CONTENT, rate_max=rate_max,
                                              frameable=frameable)
        self.httpd.quiet = True
        if self.httpd.api:
            self.httpd.api.quiet = True
        self.thread = threading.Thread(target=self.httpd.serve_forever, daemon=True)

    @property
    def url(self) -> str:
        return f"http://127.0.0.1:{self.httpd.server_address[1]}/"

    def __enter__(self):
        self.thread.start()
        return self

    def __exit__(self, *exc):
        self.httpd.shutdown()
        self.httpd.server_close()


def temp_dir(prefix: str) -> Path:
    return Path(tempfile.mkdtemp(prefix=prefix))
