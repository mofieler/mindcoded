# 0004 – Gestaltungswerte nur in style.css, Generator in Module aufgeteilt

- **Status:** angenommen, ergänzt durch [0005](0005-css-module-und-cascade-layers.md) – die
  Werte stehen seitdem in `assets/css/settings/tokens.css` und `media.css`
- **Datum:** 2026-10-19
- **Beteiligte:** Betreiber (Auftrag »nichts mehrfach warten«), Entwicklung

## Kontext

Markenfarben standen in CSS und zusätzlich 25-mal in JavaScript, im Build, in `site.json` und im
Favicon. Die Breakpoints 820/1100 px standen 12-mal im CSS und 4-mal im JavaScript, der Markenname
23-mal in Inhalten und Build. Typo-Stile waren je Baustein ausgeschrieben, und `build.py` umfasste
rund 1.300 Zeilen. Jede Gestaltungsänderung bedeutete Suchen an vielen Stellen.

## Entscheidungstreiber

- Jeder Wert an genau einer Stelle
- Kein zusätzliches Werkzeug (kein Node.js, kein Präprozessor)
- Aussehen unverändert, durch Tests abgesichert

## Optionen

1. **style.css als einzige Quelle**: Custom Properties für Farben, `@custom-media` für Breakpoints
   (vom Python-Build aufgelöst und an JavaScript übergeben), Typo-Rollen als gebündelte Selektoren.
   JavaScript liest Farben zur Laufzeit per `getComputedStyle`.
2. **Tokens als JSON**, daraus CSS und JS erzeugen: eine weitere Datei, und CSS wird nur noch erzeugt.
3. **Nichts tun.**

## Entscheidung

Gewählt: Option 1, weil CSS ohnehin die natürliche Quelle für Gestaltung ist, `@custom-media` ein
Standardvorschlag ist (CSS Media Queries Level 5) und der vorhandene Build die Auflösung mit wenigen
Zeilen übernimmt. Zusätzlich ist der Generator in `tools/mcsite/` mit einem Modul je Aufgabe
aufgeteilt; der Markenname steht als Platzhalter `{brand.full}` in den Inhalten, und Seitentitel
entstehen nach dem Muster »Seite – Marke«.

## Konsequenzen

- Gut: Eine Farbe oder einen Breakpoint ändert man an einer Stelle. Punktwolken, Manifest,
  `theme-color`, Favicon (`python tools/make_icons.py`) und Vorschaubild
  (`python tools/make_social.py`) folgen.
- Gut: Tests verhindern Rückfälle (keine Markenfarben und keine Breakpoint-Zahlen im JavaScript).
- Schlecht: `@custom-media` wirkt nur über den Build – `assets/style.css` direkt im Browser zu
  öffnen, funktioniert nicht (das war mit dem Build ohnehin nicht vorgesehen).
- Restrisiko: Favicon und Vorschaubild sind Bilddateien und müssen nach einer Farbänderung neu
  erzeugt werden.
