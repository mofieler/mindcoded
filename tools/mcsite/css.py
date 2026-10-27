"""CSS: Module bündeln, Breakpoints einsetzen, Design-Tokens lesen, für den Release verkleinern.

assets/css/main.css legt die Reihenfolge fest (Cascade Layers + @import). Der Build fügt die
Module zu einer Datei zusammen – ausgeliefert wird nur assets/style.css (eine Anfrage, keine
@import-Kette im Browser).

- Breakpoints stehen einmal als `@custom-media --name (query);` (settings/media.css) und werden
  in `@media (--name)` verwendet. Der Build setzt die Abfragen ein (Browser kennen die Syntax
  noch nicht) und gibt dieselben Abfragen an JavaScript weiter.
- Farben stehen als Custom Properties in settings/tokens.css (Palette → Rollen). Build
  (Manifest, theme-color), Icon-Werkzeuge und Tests lesen sie über load_tokens(); JavaScript
  liest sie zur Laufzeit per getComputedStyle.
"""
from __future__ import annotations

import re
from pathlib import Path

from .common import ASSETS, BuildError

CSS_DIR = ASSETS / "css"
ENTRY = CSS_DIR / "main.css"

CUSTOM_MEDIA_RE = re.compile(r"@custom-media\s+(--[\w-]+)\s+([^;]+);\s*")
MEDIA_PRELUDE_RE = re.compile(r"(@media\s+)([^{]+)\{")
MEDIA_REF_RE = re.compile(r"\((--[\w-]+)\)")
IMPORT_RE = re.compile(r"""@import\s+(?:url\(\s*)?(["'])([^"']+)\1\s*\)?\s*(?:layer\(\s*([\w.-]+)\s*\))?\s*;""")
LAYER_STATEMENT_RE = re.compile(r"@layer\s+([\w.\-\s,]+);")
URL_RE = re.compile(r"""url\(\s*(["']?)([^"')]+)\1\s*\)""")
COMMENT_OR_STRING_RE = re.compile(r"""/\*.*?\*/|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'""", re.S)
STRING_RE = re.compile(r""""(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'""")
TOKEN_RE = re.compile(r"--([\w-]+)\s*:\s*([^;]+);")
VAR_RE = re.compile(r"var\(\s*--([\w-]+)\s*\)")
HEX_RE = re.compile(r"#[0-9A-Fa-f]{6}")


# ---------------------------------------------------------------------- Bündeln

def modules() -> list[tuple[Path, str | None]]:
    """(Datei, Layer) in der Reihenfolge von main.css – prüft Vollständigkeit und Layer-Namen."""
    text = strip_comments(ENTRY.read_text(encoding="utf-8"))
    declared = LAYER_STATEMENT_RE.search(text)
    layers = [name.strip() for name in declared.group(1).split(",")] if declared else []
    problems, found = [], []
    for _, rel, layer in IMPORT_RE.findall(text):
        path = (CSS_DIR / rel).resolve()
        if not path.is_file():
            problems.append(f"assets/css/main.css: Modul {rel} fehlt")
        elif layer and layer not in layers:
            problems.append(f"assets/css/main.css: Layer »{layer}« für {rel} nicht in @layer deklariert")
        found.append((path, layer or None))
    paths = [p for p, _ in found]
    for path in sorted(CSS_DIR.rglob("*.css")):
        if path.resolve() != ENTRY.resolve() and path.resolve() not in paths:
            problems.append(f"assets/css/{path.relative_to(CSS_DIR).as_posix()}: nicht in main.css eingebunden")
    if len(set(paths)) != len(paths):
        problems.append("assets/css/main.css: ein Modul ist mehrfach eingebunden")
    if problems:
        raise BuildError(problems)
    return found


def _rewrite_urls(css: str, module: Path) -> str:
    """Relative url() eines Moduls auf assets/style.css umstellen und prüfen, dass die Datei existiert."""
    def repl(match):
        target = match.group(2).strip()
        if re.match(r"^(data:|https?:|/|#)", target):
            return match.group(0)
        path = (module.parent / target).resolve()
        if not path.is_file():
            raise BuildError([f"assets/css/{module.relative_to(CSS_DIR).as_posix()}: Datei {target} fehlt"])
        return f'url("{path.relative_to(ASSETS.resolve()).as_posix()}")'
    return URL_RE.sub(repl, css)


def bundle_css() -> str:
    """Alle Module in einer Datei, jedes in seinem Layer – mit Kommentaren (lesbar, für den Entwicklungs-Build)."""
    head = ENTRY.read_text(encoding="utf-8")
    head = head[:IMPORT_RE.search(head).start()].rstrip() + "\n"
    parts = [head]
    for path, layer in modules():
        text = _rewrite_urls(path.read_text(encoding="utf-8"), path).strip()
        if IMPORT_RE.search(strip_comments(text)) or re.search(r"@layer\b", strip_comments(text)):
            raise BuildError([f"assets/css/{path.relative_to(CSS_DIR).as_posix()}: @import/@layer nur in main.css"])
        name = path.relative_to(CSS_DIR).as_posix()
        if layer:
            parts.append(f"\n/* ── {name} ── */\n@layer {layer} {{\n{text}\n}}\n")
        else:
            parts.append(f"\n/* ── {name} ── */\n{text}\n")
    return "".join(parts)


# ---------------------------------------------------------------------- Verkleinern

def strip_comments(css: str) -> str:
    return COMMENT_OR_STRING_RE.sub(lambda m: "" if m.group(0).startswith("/*") else m.group(0), css)


def minify_css(css: str) -> str:
    """Entfernt Kommentare und überflüssige Leerzeichen – Zeichenketten bleiben unverändert.
    Leerzeichen zwischen Selektoren bleiben (Nachfahren-Kombinator), ebenso in calc()."""
    css = strip_comments(css)
    out, pos = [], 0
    for match in STRING_RE.finditer(css):
        out.append(_squeeze(css[pos:match.start()]))
        out.append(match.group(0))
        pos = match.end()
    out.append(_squeeze(css[pos:]))
    return "".join(out).strip() + "\n"


def _squeeze(chunk: str) -> str:
    chunk = re.sub(r"\s+", " ", chunk)
    return re.sub(r"\s*([{};,])\s*", r"\1", chunk)


# ---------------------------------------------------------------------- Breakpoints

def process_css(css: str) -> tuple[str, dict[str, str]]:
    """Löst @custom-media auf. Liefert (CSS, {name: abfrage}) – Name ohne »--«."""
    media = {name: query.strip() for name, query in CUSTOM_MEDIA_RE.findall(css)}
    css = CUSTOM_MEDIA_RE.sub("", css)
    missing = set()

    def prelude(match):
        def ref(m):
            name = m.group(1)
            if name not in media:
                missing.add(name)
                return m.group(0)
            return media[name]
        return match.group(1) + MEDIA_REF_RE.sub(ref, match.group(2)) + "{"

    css = MEDIA_PRELUDE_RE.sub(prelude, css)
    if missing:
        raise BuildError([f"CSS: unbekannter Breakpoint {name} in @media" for name in sorted(missing)])
    return css, {name[2:]: query for name, query in media.items()}


# ---------------------------------------------------------------------- Tokens

def _block(css: str, selector: str) -> str:
    """Inhalt des ersten Blocks »selector { … }« (Klammern gezählt, Kommentare entfernt)."""
    css = strip_comments(css)
    match = re.search(r"(?:^|[\s;{}])" + re.escape(selector) + r"\s*\{", css)
    if not match:
        raise BuildError([f"CSS: Block {selector} fehlt"])
    depth, start = 1, match.end()
    for i in range(start, len(css)):
        depth += {"{": 1, "}": -1}.get(css[i], 0)
        if depth == 0:
            return css[start:i]
    raise BuildError([f"CSS: Block {selector} nicht geschlossen"])


def parse_tokens(css: str) -> dict[str, dict[str, str]]:
    """Farb-Tokens je Schema als Hex-Wert: {"light": {...}, "dark": {...}} – Namen ohne »--«.
    Verweise (var(--navy-800)) werden über die Palette aufgelöst."""
    light_raw = dict((k, v.strip()) for k, v in TOKEN_RE.findall(_block(css, ":root")))
    dark_raw = {**light_raw, **dict((k, v.strip()) for k, v in TOKEN_RE.findall(_block(css, '[data-theme="dark"]')))}

    def resolve(raw: dict) -> dict:
        out = {}
        for name in raw:
            value, seen = raw[name], set()
            while (m := VAR_RE.fullmatch(value)) and m.group(1) in raw and m.group(1) not in seen:
                seen.add(m.group(1))
                value = raw[m.group(1)]
            if HEX_RE.fullmatch(value):
                out[name] = value
        return out

    return {"light": resolve(light_raw), "dark": resolve(dark_raw)}


def load_tokens() -> dict[str, dict[str, str]]:
    return parse_tokens(bundle_css())
