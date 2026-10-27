#!/usr/bin/env python3
"""Sicherheitsnetz für CSS-Umbauten: vergleicht die berechneten Stile zweier Stände.

  python tools/css_diff.py baseline          aktuellen Stand als Vergleichsbasis bauen (.css-diff/baseline)
  python tools/css_diff.py compare           aktuellen Stand bauen und mit der Basis vergleichen
  python tools/css_diff.py compare --quick   nur 390 und 1280 px (schneller)

Verglichen wird jedes Element jeder Seite in 8 Breiten von 360 bis 1920 px und 16 Zuständen
(ohne/mit JavaScript, aufgeklappt, Header fixiert, Intro, dunkel, Hover, Fokus, reduzierte
Bewegung, Touch, mehr Kontrast, Windows-Kontrastmodus, Druck …). Ein Umbau ist verlustfrei, wenn
keine Abweichung gemeldet wird. Änderungen am HTML sind erlaubt, solange die Elementstruktur
gleich bleibt (z. B. zusätzliche Klassen). Details: tools/css_diff.js.
"""
from __future__ import annotations

import argparse
import html
import json
import re
import shutil
import sys
import threading
from collections import defaultdict
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import edge  # noqa: E402

from mcsite import ROOT, build  # noqa: E402

WORK = ROOT / ".css-diff"
# 404.html fehlt bewusst: Sie nutzt absolute Pfade und hat denselben Aufbau wie die Meldungsseiten.
PAGES = ["", "en/", "leistungen/websites/", "projekte/paquita-pilates/", "impressum/", "datenschutz/",
         "kontakt/danke/", "BETREIBER-TODO.html"]
HARNESS = """<!doctype html><meta charset="utf-8"><title>CSS-Vergleich</title>
<pre id="result"></pre><div id="frames"></div><script type="module" src="css_diff.js"></script>"""


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


def build_into(name: str) -> Path:
    out = WORK / name
    build(release=False, out=out)
    return out


def run_compare(quick: bool) -> dict:
    harness = WORK / "harness"
    harness.mkdir(parents=True, exist_ok=True)
    (harness / "index.html").write_text(HARNESS, encoding="utf-8")
    shutil.copy2(Path(__file__).with_suffix(".js"), harness / "css_diff.js")
    server = ThreadingHTTPServer(("127.0.0.1", 0), partial(QuietHandler, directory=str(WORK)))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    try:
        pages = ",".join(p or "-" for p in PAGES)
        url = f"http://127.0.0.1:{server.server_address[1]}/harness/index.html?pages={pages}&quick={int(quick)}"
        dom = edge.dump_dom(url, wait_ms=3_600_000, timeout=3600)
    finally:
        server.shutdown()
        server.server_close()
    match = re.search(r'<pre id="result">(.*?)</pre>', dom, re.S)
    if not match or not match.group(1).strip():
        raise SystemExit("Kein Ergebnis vom Browser erhalten.")
    return json.loads(html.unescape(match.group(1)))


def report(result: dict) -> int:
    if "error" in result:
        print(result["error"])
        return 2
    print(f"{result['checked']} Kombinationen aus Seite, Breite und Zustand verglichen.")
    for item in result["structure"]:
        print(f"  ! {item['page']} {item['width']}px {item['state']}: {item['problem']}")
    if not result["total"] and not result["structure"]:
        print("Keine Abweichung – berechnete Stile identisch.")
        return 0
    groups: dict[tuple, dict] = {}
    for d in result["diffs"]:
        key = (d["el"], d["pseudo"], d["prop"], d["a"], d["b"])
        g = groups.setdefault(key, defaultdict(set))
        g["states"].add(d["state"])
        g["widths"].add(d["width"])
        g["pages"].add(d["page"])
    per_state = defaultdict(int)
    for d in result["diffs"]:
        per_state[d["state"]] += 1
    print(f"{result['total']} Abweichungen ({len(groups)} verschiedene"
          f"{', gekürzt' if result['total'] > len(result['diffs']) else ''}) – je Zustand: "
          + ", ".join(f"{k} {v}" for k, v in sorted(per_state.items(), key=lambda kv: -kv[1])))
    for (el, pseudo, prop, a, b), g in list(groups.items())[:80]:
        print(f"  {el}{pseudo}  {prop}: {a!r} → {b!r}")
        print(f"      {', '.join(sorted(g['states']))} · {', '.join(map(str, sorted(g['widths'])))} px · "
              f"{', '.join(sorted(g['pages']))}")
    if len(groups) > 80:
        print(f"  … {len(groups) - 80} weitere")
    return 1


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("mode", choices=["baseline", "compare"])
    parser.add_argument("--quick", action="store_true", help="nur 390 und 1280 px")
    parser.add_argument("--json", metavar="DATEI", help="vollständiges Ergebnis zusätzlich als JSON speichern")
    args = parser.parse_args()
    if sys.stdout.encoding.lower() != "utf-8":
        sys.stdout.reconfigure(encoding="utf-8")
    if not edge.find_browser():
        print("Kein Edge/Chrome gefunden (Pfad über MC_BROWSER setzen).")
        return 2
    if args.mode == "baseline":
        build_into("baseline")
        print(f"Vergleichsbasis gespeichert: {WORK / 'baseline'}")
        return 0
    if not (WORK / "baseline").is_dir():
        print("Zuerst die Vergleichsbasis bauen: python tools/css_diff.py baseline")
        return 2
    build_into("current")
    result = run_compare(args.quick)
    if args.json:
        Path(args.json).write_text(json.dumps(result, ensure_ascii=False, indent=1), encoding="utf-8")
    return report(result)


if __name__ == "__main__":
    sys.exit(main())
