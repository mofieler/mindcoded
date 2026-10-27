"""mcsite – statischer Seitengenerator für mindcoded.studio (nur Python-Standardbibliothek).

Aufbau (ein Modul je Aufgabe):
  common.py    Pfade, Konstanten, Sicherheits-Header, Hilfsfunktionen
  components.py  UI-Komponenten (Buttons, Links, Rubrik) – wiederkehrendes Markup genau einmal
  css.py       CSS-Module bündeln (assets/css), Breakpoints, Farb-Tokens, Verkleinern
  content.py   Inhalte laden und prüfen, Formular-Regeln
  text.py      Platzhalter, sichere HTML-Ausgabe, Pfade
  layout.py    Seitenrahmen, Header, Menü, Footer, strukturierte Daten, Bilder
  sections.py  Abschnitte der Startseite
  pages.py     Case Study, Leistungsseite, Rechtsseiten, Meldungen, 404
  blocks.py    Case Study: Kurzüberblick, Kapitel, Bausteine (Diagramme), Bildstreifen
  catalog.py   Komponenten-Seite (Design System, nur Entwicklungs-Build)
  output.py    Assets, .htaccess, robots, Sitemap, Gesamtablauf
  server.py    Konfiguration für den VPS: Caddy, nginx, Apache, PHP-FPM, Wartungs-Timer, DNS
  builder.py   Zusammenbau
"""
from __future__ import annotations

import importlib
import sys

from .builder import Builder, build, default_out
from .common import API, ASSETS, CONTENT, CSP, LANGS, ROOT, SECURITY_HEADERS, STATIC, BuildError, load_json
from .content import contact_settings
from .css import CSS_DIR, bundle_css, load_tokens, minify_css, parse_tokens, process_css, strip_comments

MODULES = ("common", "components", "css", "blocks", "content", "text", "layout", "sections", "pages", "catalog", "output", "server", "builder")


def reload_all():
    """Lädt alle Module neu (für den Watch-Modus von tools/serve.py)."""
    for name in MODULES:
        importlib.reload(sys.modules[f"{__name__}.{name}"])
    return importlib.reload(sys.modules[__name__])


__all__ = ["API", "ASSETS", "CONTENT", "CSP", "CSS_DIR", "LANGS", "ROOT", "SECURITY_HEADERS", "STATIC", "BuildError",
           "Builder", "build", "bundle_css", "contact_settings", "default_out", "load_json", "load_tokens", "minify_css",
           "parse_tokens", "process_css", "reload_all", "strip_comments"]
