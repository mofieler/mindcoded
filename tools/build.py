#!/usr/bin/env python3
"""mindcoded.studio – statischer Seitengenerator (nur Python-Standardbibliothek).

Aufrufe (aus dem Projektordner):
  python tools/build.py              Entwicklungs-Build nach dist-dev/
                                     (mit Entwürfen, sichtbaren TODO-Markierungen, noindex)
  python tools/build.py --release    Veröffentlichungs-Build nach dist/; bricht ab, solange
                                     Betreiberangaben fehlen oder Prüfungen scheitern
  python tools/build.py --out PFAD   anderes Zielverzeichnis

Quellen: content/*.json (Inhalte), assets/ (CSS, JS, Schriften), static/ (Icons),
api/contact.php (Formular-Endpunkt). Der Generator selbst liegt in tools/mcsite/.
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from mcsite import (  # noqa: E402,F401
    API,
    ASSETS,
    CONTENT,
    CSP,
    CSS_DIR,
    LANGS,
    ROOT,
    SECURITY_HEADERS,
    STATIC,
    Builder,
    BuildError,
    build,
    bundle_css,
    contact_settings,
    default_out,
    load_json,
    load_tokens,
    minify_css,
    parse_tokens,
    process_css,
    strip_comments,
)


def main(argv: list[str] | None = None) -> int:
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8")
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--release", action="store_true", help="Veröffentlichungs-Build mit allen Prüfungen")
    parser.add_argument("--out", type=Path, help="Zielverzeichnis (Standard: dist/ bei --release, sonst dist-dev/)")
    args = parser.parse_args(argv)
    try:
        result = build(release=args.release, out=args.out)
    except BuildError as err:
        print("Build abgebrochen:" if args.release else "Build mit Fehlern:", file=sys.stderr)
        for problem in err.problems:
            print(f"  {problem}", file=sys.stderr)
        return 1
    mode = "Release" if args.release else "Entwicklungs"
    print(f"{mode}-Build fertig: {result['pages']} HTML-Seiten in {result['out']}")
    if not args.release:
        print(f"  {result['todos']} offene Betreiberangaben (siehe BETREIBER-TODO.html), {result['drafts']} Entwürfe sichtbar")
        print("  Entwicklungs-Build – nicht hochladen. Zum Veröffentlichen: python tools/build.py --release")
    return 0


if __name__ == "__main__":
    sys.exit(main())
