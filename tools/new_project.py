#!/usr/bin/env python3
"""Neues Projekt aus der Vorlage anlegen – als Entwurf mit allen Bausteinen als Beispiel.

  python tools/new_project.py <slug> --name "Projektname" [--kind client|own|concept|study]

Ergebnis: neuer Eintrag am Ende von content/projects.json (draft: true, nur im Entwicklungs-Build
sichtbar). Danach Texte ersetzen, nicht benötigte Bausteine löschen und Bilder ergänzen:
python tools/make_images.py <slug> bildquellen/… --write. Alle Bausteine mit Beispiel und JSON zum
Kopieren zeigt /komponenten/ im Entwicklungs-Build (python tools/serve.py).

Vorlage: content/templates/case-study.json. Hinweis: formatiert projects.json einheitlich neu.
"""
from __future__ import annotations

import argparse
import copy
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from mcsite import CONTENT  # noqa: E402
from mcsite.common import SLUG_RE  # noqa: E402

KINDS = ("client", "own", "concept", "study")


def add_project(slug: str, name: str, kind: str = "client", content_dir: Path = CONTENT) -> dict:
    if not SLUG_RE.match(slug):
        raise SystemExit("slug nur aus a–z, 0–9 und Bindestrichen.")
    if kind not in KINDS:
        raise SystemExit(f"kind muss eines von {', '.join(KINDS)} sein.")
    projects_file = content_dir / "projects.json"
    data = json.loads(projects_file.read_text(encoding="utf-8"))
    if any(p.get("slug") == slug for p in data["items"]):
        raise SystemExit(f"Projekt »{slug}« gibt es schon.")
    template = json.loads((content_dir / "templates" / "case-study.json").read_text(encoding="utf-8"))
    project = {key: copy.deepcopy(value) for key, value in template.items() if not key.startswith("_")}
    project.update(slug=slug, kind=kind, draft=True)
    project["de"]["name"] = project["en"]["name"] = name
    data["items"].append(project)
    projects_file.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return project


def main() -> int:
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8")
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("slug", help="Adresse des Projekts, z. B. studio-beispiel")
    parser.add_argument("--name", required=True, help="Projektname (beide Sprachen)")
    parser.add_argument("--kind", default="client", choices=KINDS)
    args = parser.parse_args()
    add_project(args.slug, args.name, args.kind)
    print(f"Angelegt: {args.slug} (Entwurf) in content/projects.json – jetzt Texte ersetzen und Bilder ergänzen.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
