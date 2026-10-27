# mindcoded.studio – Arbeitsregeln für dieses Projekt

Statische Website: Python-Generator (`tools/mcsite/`), Vanilla-JS (`assets/*.js`), CSS-Module mit
Cascade Layers (`assets/css/`), PHP-Kontaktformular (`api/`). Kein Node-Build. Einstieg: `README.md`.
Prüfen: `python tools/check.py` (alles) bzw. `--fast`. Browser-Tests lokal mit aktuellem Chromium:
`MC_BROWSER=%LOCALAPPDATA%\ms-playwright\chromium-1140\chrome-win\chrome.exe` (System-Edge ist veraltet).

## Design System – immer einhalten (docs/adr/0008)

- **Wiederkehrendes Markup → Komponente.** Kommt ein Stück HTML im Generator ein drittes Mal vor, wird
  es eine Funktion in `tools/mcsite/components.py` (Buttons, Links, Rubrik …). Seiten rufen nur diese
  Funktionen auf. Neue Komponente auch auf der Komponenten-Seite zeigen (`tools/mcsite/catalog.py`).
- **Keine festen Gestaltungswerte in Modulen.** Farben, Schriftgrößen (`var(--text-…)`) und Abstände
  (`var(--space-…)`) nur aus `assets/css/settings/tokens.css`. Fehlt eine Stufe: im Token-File ergänzen,
  nicht lokal hacken. Danach `python tools/export_tokens.py` (sonst schlägt ein Test fehl).
- **Bausteine reagieren auf ihren Platz:** `@container case (…)` statt `@media`, wenn es um die Breite
  des Bausteins geht; `@media (--name)` nur für seitenweite Breakpoints aus `settings/media.css`.
- **Case-Study-Bausteine:** neue Art = Funktion in `tools/mcsite/blocks.py` + Prüfung in `content.py`
  + Eintrag in `content/schema/projects.schema.json` + Beispiel in `content/templates/case-study.json`
  + CSS-Modul. Tests prüfen, dass Generator, Schema und Vorlage übereinstimmen.
- **Inhalte statt Code:** Texte nur in `content/*.json`, keine Texte im Python-/JS-Code.
- **Kein UI-Framework** (Tailwind, Kits, Animationsbibliotheken) ohne neue ADR.

## Texte: für Entscheider schreiben, nicht für Forscher

Leser sind Inhaberinnen, Geschäftsführer, Marketing – keine UX-Fachleute. Sie wollen in Sekunden wissen:
Hat es funktioniert? Was habe ich davon?
- Nutzen zuerst: jede Case Study endet mit `takeaway` (»Was Sie davon haben«, ein Satz).
- Fachbegriffe übersetzen: »verständlich und einfach« statt »pragmatische Qualität«; Skalen in Worten
  (`axis`, `valueLabel`); Methode und Stichprobe nur klein als Beleg (`note`: »15 Testpersonen«, nicht »n = 15«).
- Kurzübersicht immer Aufgabe · Lösung · Ergebnis. Details für Interessierte hinter »Mehr dazu«.
- Zahlen nur mit Beleg – aber als Aussage formuliert, nicht als Messprotokoll.

## Barrierefreiheit (WCAG 2.2 AA)

- `tests/test_browser.py › test_accessibility_wcag_aa` (axe-core) muss grün sein; neue Seitenarten in
  `tests/browser/a11y.js` aufnehmen.
- Jede Bewegung: bei »Bewegung reduzieren« aus, über »Animationen anhalten« anhaltbar (WCAG 2.2.2),
  ohne JavaScript Inhalt vollständig sichtbar. Fokus nie unter mitlaufenden Leisten (scroll-padding).
- Diagramme: Werte immer auch als Text; Grafik `aria-hidden`.

## JavaScript

- Alle Module sind typgeprüft (`jsconfig.json › checkJs: true`, strict) und bleiben ohne Meldungen (`tsc -p jsconfig.json`). Typen per JSDoc; `// @ts-check` oben schadet nicht.
- Noch ohne Typprüfung (Ratsche – beim Anfassen nachziehen, nie neue hinzufügen):
  `contact-form.js`, `dotfield.js`, `hero-canvas.js`, `hero-ui.js`, `logo-egg.js`, `shapes.js`, `smooth-scroll.js`.
- Reine Logik in eigene Module ohne DOM, Tests in `tests/browser/unit.js`.

## Nicht tun

- Nichts von Hand in `design-tokens.json`, `dist*/`, `.css-diff/` ändern (erzeugt).
- Quellfotos nie unter `assets/` (dort wird alles ausgeliefert) – `bildquellen/`.
- Nicht auf `main` des alten GitHub-Repos `mindcoded` pushen (Coolify baut dort die alte Nuxt-App, docs/MIGRATION.md).
