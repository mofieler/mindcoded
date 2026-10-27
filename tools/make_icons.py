#!/usr/bin/env python3
"""Erzeugt Favicon und App-Icons aus den Farb-Tokens in assets/css/settings/tokens.css (über Edge/Chrome
headless, ohne Node.js).

Aufruf: python tools/make_icons.py
Ergebnis in static/: favicon.svg, favicon.ico, favicon-32.png, apple-touch-icon.png (180),
icon-192.png, icon-512.png. Nur nötig, wenn sich Markenfarben ändern.
"""
from __future__ import annotations

import struct
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from edge import screenshot  # noqa: E402

from mcsite import STATIC, load_tokens  # noqa: E402

SIZES = {"favicon-32.png": (32, True, True), "apple-touch-icon.png": (180, False, False),
         "icon-192.png": (192, True, False), "icon-512.png": (512, True, False)}


def favicon_svg(tokens: dict, title: str) -> str:
    """Markenzeichen: drei Punkte (hell – Akzent – hell) auf dunklem Grund, wie im Übergangsvorhang."""
    t = tokens["light"]
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <title>{title}</title>
  <rect width="64" height="64" rx="14" fill="{t['color-ink']}"/>
  <circle cx="17" cy="32" r="7" fill="{t['color-navy-fg']}"/>
  <circle cx="32" cy="32" r="7" fill="{t['color-accent']}"/>
  <circle cx="47" cy="32" r="7" fill="{t['color-navy-fg']}"/>
</svg>
"""


def write_ico(png: Path, ico: Path) -> None:
    """ICO-Container mit eingebettetem PNG (von allen aktuellen Browsern unterstützt)."""
    data = png.read_bytes()
    width, height = struct.unpack(">II", data[16:24])
    header = struct.pack("<HHH", 0, 1, 1)
    entry = struct.pack("<BBBBHHII", width % 256, height % 256, 0, 0, 1, 32, len(data), 6 + 16)
    ico.write_bytes(header + entry + data)


def main() -> int:
    tokens = load_tokens()
    svg = favicon_svg(tokens, "mindcoded.studio")
    (STATIC / "favicon.svg").write_text(svg, encoding="utf-8")
    print("  favicon.svg")
    with tempfile.TemporaryDirectory(prefix="mc-icons-") as tmp:
        for name, (size, rounded, transparent) in SIZES.items():
            # Apple-Icon ohne Rundung und Transparenz (iOS maskiert selbst).
            icon = svg if rounded else svg.replace('rx="14"', 'rx="0"')
            page = Path(tmp) / f"{size}.html"
            page.write_text(
                "<!DOCTYPE html><html><head><style>html,body{margin:0;padding:0;background:transparent}"
                f"svg{{display:block;width:{size}px;height:{size}px}}</style></head><body>{icon}</body></html>",
                encoding="utf-8",
            )
            screenshot(page.as_uri(), STATIC / name, width=size, height=size, wait_ms=500, transparent=transparent)
            print(f"  {name} ({size}×{size})")
    write_ico(STATIC / "favicon-32.png", STATIC / "favicon.ico")
    print("  favicon.ico")
    return 0


if __name__ == "__main__":
    sys.exit(main())
