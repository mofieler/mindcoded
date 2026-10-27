#!/usr/bin/env python3
"""Design Tokens im W3C-Format (Design Tokens Community Group, Stand 2025.10) exportieren.

  python tools/export_tokens.py            schreibt design-tokens.json (für Figma / Tokens Studio)
  python tools/export_tokens.py --check    prüft nur, ob design-tokens.json aktuell ist

Einzige Quelle bleibt assets/css/settings/tokens.css (docs/adr/0004). Der Export macht die Werte für
Gestaltungswerkzeuge lesbar: Palette als Farben, Rollen als Verweise auf die Palette (hell und dunkel),
Schriftgrößen, Abstände, Radien und Schriftfamilien. Fließende Werte (clamp) stehen mit ihrem
Mindestwert im Feld $value und vollständig unter $extensions › studio.mindcoded.css.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TOKENS = ROOT / "assets" / "css" / "settings" / "tokens.css"
OUT = ROOT / "design-tokens.json"
EXT = "studio.mindcoded"

DECL = re.compile(r"--([\w-]+)\s*:\s*([^;]+);")
PALETTE = re.compile(r"(sand|navy|slate|blue|coral|amber|white)(-\d+)?$")


def block(css: str, selector: str) -> str:
    start = css.index(selector + " {")
    depth, i = 0, css.index("{", start)
    for j in range(i, len(css)):
        depth += {"{": 1, "}": -1}.get(css[j], 0)
        if depth == 0:
            return css[i + 1:j]
    raise ValueError(selector)


def declarations(css: str) -> dict[str, str]:
    css = re.sub(r"/\*.*?\*/", "", css, flags=re.S)
    return {name: value.strip() for name, value in DECL.findall(css)}


def color(value: str) -> dict:
    if value.startswith("#"):
        hexv = value.lower()
        comps = [round(int(hexv[k:k + 2], 16) / 255, 4) for k in (1, 3, 5)]
        return {"colorSpace": "srgb", "components": comps, "hex": hexv}
    m = re.fullmatch(r"rgba\(\s*(\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\s*\)", value)
    if not m:
        raise ValueError(f"Farbe nicht lesbar: {value}")
    comps = [round(c / 255, 4) for c in (int(m.group(1)), int(m.group(2)), int(m.group(3)))]
    hexv = "#" + "".join(f"{int(m.group(k)):02x}" for k in (1, 2, 3))
    return {"colorSpace": "srgb", "components": comps, "alpha": float(m.group(4)), "hex": hexv}


def dimension(value: str, scope: dict) -> dict:
    """px-Wert oder clamp(): $value als Mindestwert, CSS vollständig in $extensions."""
    resolved = value
    while (m := re.fullmatch(r"var\(--([\w-]+)\)", resolved)) and m.group(1) in scope:
        resolved = scope[m.group(1)]
    if m := re.fullmatch(r"(-?[\d.]+)px", resolved):
        return {"$type": "dimension", "$value": {"value": float(m.group(1)) if "." in m.group(1) else int(m.group(1)), "unit": "px"}}
    first = re.search(r"(-?[\d.]+)px", resolved)
    token = {"$type": "dimension", "$extensions": {EXT: {"css": resolved}}}
    if first:
        token["$value"] = {"value": int(float(first.group(1))), "unit": "px"}
    return token


def role(value: str, palette: dict) -> dict:
    if (m := re.fullmatch(r"var\(--([\w-]+)\)", value)) and m.group(1) in palette:
        return {"$type": "color", "$value": "{color.palette." + m.group(1) + "}"}
    return {"$type": "color", "$value": color(value)}


def build() -> dict:
    css = TOKENS.read_text(encoding="utf-8")
    light = declarations(block(css, ":root"))
    dark = declarations(block(css, '[data-theme="dark"]'))
    palette = {k: v for k, v in light.items() if PALETTE.fullmatch(k)}
    out = {
        "$description": "Design Tokens von mindcoded.studio – erzeugt aus assets/css/settings/tokens.css (python tools/export_tokens.py). Nicht von Hand ändern.",
        "color": {
            "palette": {k: {"$type": "color", "$value": color(v)} for k, v in palette.items()},
            "light": {k[len("color-"):]: role(v, palette) for k, v in light.items() if k.startswith("color-")},
            "dark": {k[len("color-"):]: role(v, palette) for k, v in dark.items() if k.startswith("color-")},
        },
        "font": {
            "family": {k[len("font-"):]: {"$type": "fontFamily", "$value": [f.strip().strip("'\"") for f in v.split(",")]}
                       for k, v in light.items() if k.startswith("font-")},
            "size": {k[len("text-"):]: dimension(v, light) for k, v in light.items() if k.startswith("text-")},
        },
        "space": {k[len("space-"):]: dimension(v, light) for k, v in light.items() if k.startswith("space-")},
        "radius": {k[len("radius-"):]: dimension(v, light) for k, v in light.items() if k.startswith("radius-")},
    }
    return out


def render() -> str:
    return json.dumps(build(), ensure_ascii=False, indent=2) + "\n"


def main() -> int:
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8")
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--check", action="store_true", help="nur prüfen, ob design-tokens.json aktuell ist")
    args = parser.parse_args()
    text = render()
    if args.check:
        current = OUT.read_text(encoding="utf-8") if OUT.exists() else ""
        if current != text:
            print("design-tokens.json ist veraltet – python tools/export_tokens.py ausführen.")
            return 1
        print("design-tokens.json ist aktuell.")
        return 0
    OUT.write_text(text, encoding="utf-8", newline="\n")
    print(f"Geschrieben: {OUT.name}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
