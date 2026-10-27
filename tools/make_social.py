#!/usr/bin/env python3
"""Erzeugt das Vorschaubild für geteilte Links (Open Graph, 1200 × 630) aus Marke, Farben
und Schriften der Website – über Edge/Chrome headless, ohne Node.js.

Aufruf: python tools/make_social.py
Ergebnis: assets/social/og-default.png (eingebunden über content/site.json › socialImage)
Das Bild zeigt Wortmarke, Claim aus content/de.json › hero.eyebrow und das Punkt-Motiv.
"""
from __future__ import annotations

import html
import random
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from edge import screenshot  # noqa: E402

from mcsite import ASSETS, load_json, load_tokens  # noqa: E402

WIDTH, HEIGHT = 1200, 630


def dots(tokens: dict) -> str:
    """Dezente Punktwolke rechts – das wiedererkennbare Motiv der Website."""
    rnd = random.Random(7)  # fester Startwert: bei jedem Lauf dasselbe Bild
    t = tokens["light"]
    circles = []
    for _ in range(900):
        x = 640 + rnd.random() ** 0.7 * 540
        y = rnd.random() * HEIGHT
        accent = rnd.random() < 0.09
        color = t["color-accent"] if accent else t["color-navy-fg"]
        circles.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{1.6 if accent else 1.2}" fill="{color}" fill-opacity="{0.9 if accent else 0.32}"/>')
    return f'<svg class="dots" viewBox="0 0 {WIDTH} {HEIGHT}" width="{WIDTH}" height="{HEIGHT}">{"".join(circles)}</svg>'


def main() -> int:
    tokens = load_tokens()
    site = load_json("site.json")
    de = load_json("de.json")
    brand = site["brand"]
    t = tokens["light"]
    fonts = (ASSETS / "fonts").as_uri()
    page_html = f"""<!DOCTYPE html><html><head><meta charset="utf-8"><style>
@font-face {{ font-family: 'Bricolage Grotesque'; font-weight: 400 800; font-stretch: 75% 100%; src: url('{fonts}/5207f422-2f16-4134-8456-9aa93e768902.woff2'); }}
@font-face {{ font-family: 'Manrope'; font-weight: 400 600; src: url('{fonts}/ee2a2dca-fbf1-446d-bf7c-2877d9469c8a.woff2'); }}
@font-face {{ font-family: 'Space Mono'; src: url('{fonts}/a9349437-0b0a-40a3-81f1-d2e12af809ef.woff2'); }}
html, body {{ margin: 0; width: {WIDTH}px; height: {HEIGHT}px; overflow: hidden; background: {t['color-navy']}; }}
.dots {{ position: absolute; inset: 0; }}
.card {{ position: absolute; left: 88px; top: 0; bottom: 0; display: flex; flex-direction: column; justify-content: center; gap: 34px; }}
.mark {{ font-family: 'Manrope'; font-weight: 600; font-size: 88px; letter-spacing: -0.02em; color: {t['color-navy-fg']}; }}
.mark span {{ font-family: 'Space Mono'; font-weight: 400; font-size: 74px; color: {t['color-accent-light']}; }}
.claim {{ font-family: 'Space Mono'; font-size: 26px; letter-spacing: 0.08em; text-transform: uppercase; color: {t['color-navy-muted']}; }}
.line {{ display: flex; gap: 12px; }}
.line i {{ width: 16px; height: 16px; border-radius: 50%; background: {t['color-navy-fg']}; display: block; }}
.line i:nth-child(2) {{ background: {t['color-accent']}; }}
</style></head><body>
{dots(tokens)}
<div class="card">
  <div class="line"><i></i><i></i><i></i></div>
  <div class="mark">{html.escape(brand['name'])}<span>{html.escape(brand['tld'])}</span></div>
  <div class="claim">{html.escape(de['hero']['eyebrow'])}</div>
</div>
</body></html>"""
    out = ASSETS / "social" / "og-default.png"
    with tempfile.TemporaryDirectory(prefix="mc-social-") as tmp:
        page = Path(tmp) / "social.html"
        page.write_text(page_html, encoding="utf-8")
        screenshot(page.as_uri(), out, width=WIDTH, height=HEIGHT, wait_ms=1500)
    print(f"  {out.relative_to(ASSETS.parent)} ({WIDTH}×{HEIGHT})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
