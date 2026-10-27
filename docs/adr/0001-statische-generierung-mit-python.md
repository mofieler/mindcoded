# 0001 – Statische Generierung mit Python statt clientseitigem Rendern

- **Status:** angenommen
- **Datum:** 2026-10-19
- **Beteiligte:** Betreiber (Entscheidung), Entwicklung

## Kontext

Die Seite wurde bisher vollständig per JavaScript aus `config.js` gerendert. Ohne JavaScript blieben Leistungen, Projekte und Formular leer bzw. unsichtbar; die englische Fassung hatte keine eigene URL, Canonical und `hreflang` waren nicht möglich (Arbeitsauftrag Punkte 3–5). Node.js steht auf dem Arbeitsrechner nicht zur Verfügung, Python 3 schon.

## Entscheidungstreiber

- Kerninhalt und Metadaten im ausgelieferten HTML (SEO, Barrierefreiheit, Ausfallsicherheit)
- Eigene URLs je Sprache (`/` und `/en/`) mit korrektem `lang`, Canonical, `hreflang`
- Keine Node.js-Abhängigkeit, keine Paketinstallation
- Inhalte weiterhin an einer Stelle pflegbar
- Visuelle Identität und vorhandene Canvas-Effekte unverändert nutzbar

## Optionen

1. **Python-Generator (`tools/build.py`, nur Standardbibliothek)** – Inhalte als JSON, Seiten vorgerendert, JavaScript nur noch zur Anreicherung.
2. **Migration auf Nuxt/Astro** – etabliert, aber Node.js nötig, große Umstellung.
3. **Kein Build, deutsche Inhalte von Hand in `index.html`** – kein Werkzeug nötig, aber Inhalte doppelt (HTML und `config.js`), EN ohne eigene URL.
4. **Nichts tun** – Seite bleibt ohne JavaScript leer.

## Entscheidung

Gewählt: Option 1, weil sie alle Treiber erfüllt, ohne Node.js auskommt und die bestehende Gestaltung, das CSS und die Canvas-Module weiterverwendet. Option 2 scheitert an der Node-Vorgabe und am Umfang, Option 3 an doppelter Pflege und fehlender EN-URL.

## Konsequenzen

- Gut: Alle Seiten funktionieren ohne JavaScript; EN ist indexierbar; ein Release-Build verweigert die Veröffentlichung, solange Pflichtangaben fehlen oder Entwürfe enthalten wären.
- Gut: Tests laufen mit Python und Edge headless, ohne zusätzliche Pakete.
- Schlecht: Vor jedem Upload ist `python tools/build.py --release` nötig; ausgeliefert wird nur `dist/`.
- Schlecht: Markup-Änderungen erfolgen in Python-Vorlagen (`tools/build.py`) statt in einer HTML-Datei.
- Restrisiko: Der Sprachumschalter springt auf die Startseite der anderen Sprache, wenn eine Unterseite (Impressum, Datenschutz) nur deutsch existiert.
