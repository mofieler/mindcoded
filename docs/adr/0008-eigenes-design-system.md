# 0008 – Eigenes kleines Design System statt UI-Framework

- **Status:** angenommen
- **Datum:** 2026-10-26
- **Beteiligte:** Betreiber, Entwicklung

## Kontext

Projektseiten und künftige Kundenprojekte sollen aus wiederverwendbaren Bausteinen entstehen:
Inhalte kopieren, Gestaltung anpassen, ohne Code an vielen Stellen zu ändern. Bisher waren nur Farben
Tokens; Schriftgrößen und Abstände standen als feste Werte in rund 30 Modulen, Buttons und
Rubriken waren im Generator mehrfach von Hand ausgeschrieben.

## Entscheidungstreiber

- Eine Stelle je Gestaltungswert (Marke austauschbar)
- Bausteine, die in jeder Spalte und jedem Projekt gleich funktionieren
- Kein Node-Build, keine zweite Quelle neben `tokens.css` (ADR 0001, 0004), strenge CSP
- Barrierefreiheit messbar statt behauptet

## Optionen

1. **UI-Framework / Kit** (Tailwind Plus, Flowbite, shadcn/ui) – fertige Komponenten, aber React bzw.
   Tailwind und Node-Build; doppelte Gestaltungswerte; Inline-Styles/Klassenflut gegen die CSP-Regeln.
2. **Tokens als JSON-Quelle (DTCG), CSS daraus erzeugen** – Figma-tauglich, aber zweite Quelle,
   Umbau von Kontrast-Test, Icons und `tokens.js`.
3. **Eigenes kleines Design System auf der bestehenden Architektur** – Tokens bleiben in CSS,
   werden vollständig (Schrift, Abstand) und für Werkzeuge exportiert.

## Entscheidung

Gewählt: Option 3.

- **Tokens:** Farben, Schriftgrößen (`--text-…`, feste Stufen und fließende Rollen) und Abstände
  (`--space-…`, 4-px-Raster und fließend) nur in `settings/tokens.css`. Tests verbieten feste Werte.
- **Export:** `tools/export_tokens.py` erzeugt `design-tokens.json` im DTCG-Format (Figma/Tokens Studio);
  ein Test hält ihn aktuell.
- **Komponenten im Generator:** `tools/mcsite/components.py` – wiederkehrendes Markup genau einmal.
- **Portable Bausteine:** `@container` (Container `case`) statt Bildschirm-Breakpoints, wo ein Baustein
  auf seinen Platz reagiert.
- **Sichtbar und kopierbar:** Komponenten-Seite `/komponenten/` (Entwicklungs-Build), Vorlage
  `content/templates/case-study.json`, `tools/new_project.py`, JSON-Schema für den Editor.
- **Geprüft:** axe-core (WCAG 2.2 AA) auf jeder Seitenart, JavaScript-Typprüfung (`// @ts-check`), CI.

## Konsequenzen

- Gut: Eine neue Marke ändert nur `tokens.css`; Bausteine wandern ohne Anpassung zwischen Projekten.
- Gut: Beispiel (Komponenten-Seite) und Website nutzen dieselben Funktionen – sie können nicht auseinanderlaufen.
- Schlecht: Beim Umstieg haben sich einzelne Größen auf dem Handy um wenige Pixel angeglichen
  (geprüft mit `tools/css_diff.py`).
- Restrisiko: Container-Schwellen stehen am Baustein (CSS erlaubt dort keine Variablen).
  Die Typprüfung umfasst die großen Animationsmodule noch nicht (Liste in `CLAUDE.md`).
