# 0005 – CSS in Modulen mit Cascade Layers, gebündelt vom Build

- **Status:** angenommen
- **Datum:** 2026-10-19
- **Beteiligte:** Betreiber (Auftrag »lesbar, wartbar, modular nach Best Practice«), Entwicklung

## Kontext

`assets/style.css` umfasste rund 3.300 Zeilen in 17 Abschnitten. Der Vorrang einzelner Regeln
hing an Reihenfolge und Spezifität (`#main`, lange Selektoren, `!important`). Typo-Rollen und
Container waren als lange Selektorlisten über alle Bausteine verteilt. Touch-, Kontrast- und
Druckregeln standen in Sammelabschnitten weit weg von ihrem Baustein. Farbwerte standen
mehrfach, zum Teil außerhalb der Tokens. Nach ADR 0004 waren Farben und Breakpoints bereits an
einer Stelle, die Datei selbst aber kaum noch überschaubar.

## Entscheidungstreiber

- Jede Regel an genau einer, vorhersehbaren Stelle; Vorrang ohne Spezifitäts-Tricks
- Kein Node.js, keine Fremdbibliothek
- Weiterhin eine einzige CSS-Anfrage, im Release verkleinert
- Aussehen unverändert, nachweisbar über alle Breiten und Zustände
- Breite Browser-Unterstützung

## Optionen

1. **Nichts tun** – eine Datei, Abschnitte mit Kommentaren.
2. **Module, nativ im Browser per `@import` geladen** – keine Build-Logik, aber eine
   Anfragekette (jede Datei erst nach der vorherigen entdeckt) und ~30 Anfragen.
3. **Module + Cascade Layers, vom Python-Build zu einer Datei gebündelt** – `main.css` legt
   Ebenen und Reihenfolge fest; der Build löst die Importe auf, schreibt Pfade um und verkleinert.
4. **Präprozessor (Sass/PostCSS)** – Nesting, Mixins, Bündeln; braucht Node.js.

## Entscheidung

Gewählt: Option 3.
- **Ebenen:** Cascade Layers regeln den Vorrang nach Zuständigkeit (Reset → Tokens → Basis →
  Layout → Bausteine → Abschnitte → Seiten → Hilfsklassen → Nutzereinstellungen) statt nach
  Spezifität.
- **Ohne Node.js:** Der Python-Build bündelt mit wenigen, getesteten Zeilen. Die Seite lädt
  weiterhin genau eine Datei.
- **Breite Unterstützung:** Cascade Layers laufen in allen Browsern seit 2022.

Dazu gehören:
- **Tokens:** zweistufig, als Palette und Rollen.
- **Typo-Rollen:** als Klassen im HTML (`.type-label` …) statt Selektorlisten.
- **Gemeinsame Rahmen:** Kompositionsklassen (`.section`, `.accordion-item`, `.col-block`).
- **Zustände:** einheitlich `.is-…`.
- **Nutzereinstellungen:** Anpassungen für Touch, Kontrast und reduzierte Bewegung stehen im
  jeweiligen Baustein.
- **Prüfung:** Tests erzwingen die Regeln (`TestCssArchitecture`). `tools/css_diff.py` hat den
  Umbau als verlustfrei bestätigt.

CSS-Nesting wird bewusst nicht verwendet: In Safari bis 16.4 entfiele sonst ein Großteil der
Gestaltung, und kleine Module brauchen es nicht.

## Konsequenzen

- **Gut:** Jede Datei hat eine Aufgabe und unter 300 Zeilen. Wo eine Regel hingehört, beantwortet
  [docs/CSS.md](../CSS.md).
- **Gut:** Bausteine überschreiben die Basis immer. `!important` bleibt auf Reset, Hilfsklassen,
  reduzierte Bewegung und Druck beschränkt.
- **Gut:** Das Release-CSS ist kleiner (≈ 56 KB statt 69 KB, vor gzip), weiterhin eine Anfrage.
- **Gut:** `tools/css_diff.py` macht künftige Umbauten überprüfbar.
- **Schlecht:** Die Quelle ist nicht mehr eine Datei. Direkt im Browser öffnen geht nicht (ging
  wegen `@custom-media` schon vorher nicht).
- **Schlecht:** Mehr Klassen im HTML (Typo-Rollen, Komposition).
- **Restrisiko:** Browser ohne Cascade Layers (vor 2022) zeigen die Seite ungestaltet.
- **Restrisiko:** Durch die Ebenen gewinnt ein Baustein jetzt auch dort, wo vorher eine
  spezifischere Basisregel gewann. Betroffen waren Linkfarben beim Überfahren. Sie sind jetzt
  ausdrücklich am Baustein festgelegt und mit `css_diff` geprüft.
