# CSS-Architektur

Stand: 19.10.2026. Wie das Stylesheet aufgebaut ist, wohin neue Regeln gehören und wie man es
gefahrlos umbaut. Die Begründung der Entscheidung steht in
[adr/0005-css-module-und-cascade-layers.md](adr/0005-css-module-und-cascade-layers.md).

## Auf einen Blick

- **Quelle:** rund 30 kleine Module unter `assets/css/`, jedes mit einer Aufgabe und einem
  erklärenden Kopfkommentar, keines länger als 300 Zeilen.
- **Reihenfolge:** `assets/css/main.css` – die einzige Liste aller Module, mit
  [Cascade Layers](https://developer.mozilla.org/en-US/docs/Web/CSS/@layer).
- **Ausgeliefert:** eine Datei `assets/style.css`. Der Build fügt die Module zusammen, setzt die
  Breakpoints ein und verkleinert im Release (Kommentare und Leerraum entfernt). Es gibt nur eine
  Anfrage und keine `@import`-Kette im Browser.
- **Werte:** Farben, Maße, Ebenen und Bewegung stehen nur in `settings/tokens.css`, Breakpoints
  nur in `settings/media.css`.
- **Prüfung:** `tests/test_build.py › TestCssArchitecture` erzwingt die Regeln unten (ein kleiner
  Stylelint ohne Node.js). `python tools/css_diff.py` beweist bei Umbauten, dass sich nichts
  ungewollt verändert.

## Ebenen (Cascade Layers)

Später genannte Ebenen gewinnen, **unabhängig von der Spezifität**. Ein Baustein überschreibt die
Basis also immer, ohne längere Selektoren oder `!important`.

| Ebene | Ordner | Inhalt |
|---|---|---|
| `reset` | `base/reset.css` | Browser-Vorgaben angleichen |
| `tokens` | `settings/tokens.css` | Palette → Rollen, Maße, Ebenen, Bewegung; dunkles Schema, »Mehr Kontrast« |
| `base` | `base/` | Dokument, Links, Fokus, Skip-Link, Typo-Rollen |
| `layout` | `layout/` | Header, Mobilmenü, Abschnittsrahmen, Footer |
| `components` | `components/` | Bausteine, die an mehreren Stellen vorkommen |
| `sections` | `sections/` | Abschnitte der Startseite |
| `pages` | `pages/` | Unterseiten (Case Study, Leistungsseite, Textseiten) |
| `utilities` | `utilities/` | Hilfsklassen, die immer gelten (`.visually-hidden`, Scroll-Reveal) |
| `overrides` | `overrides/` | Windows-Kontrastmodus, reduzierte Bewegung, Druck |
| *ohne* | `settings/media.css`, `settings/fonts.css`, `overrides/view-transitions.css` | At-Regeln ohne Konkurrenz |

## Wohin gehört eine Regel?

1. **Ein Wert** (Farbe, Abstand, Radius, Ebene, Kurve) → `settings/tokens.css`, im Modul
   `var(--…)`. Neue Farbe: erst in die Palette, dann eine Rolle, die auf sie zeigt.
2. **Ein Breakpoint** → `settings/media.css` als `@custom-media --name (…)`, im Modul
   `@media (--name)`. JavaScript bekommt ihn automatisch (`tokens.js › createMedia`).
3. **Gleiche Gestaltung an mehreren Stellen** → `components/`, z. B. Buttons, Akkordeon,
   Formular.
4. **Gehört zu genau einem Abschnitt oder einer Seite** → `sections/` bzw. `pages/`.
5. **Responsiv, Touch, Kontrastmodus eines Bausteins** → am Ende *seiner* Datei, nicht in
   einer Sammeldatei. Beim Ändern oder Entfernen eines Bausteins ist so alles an einem Ort.
6. **Neues Modul** → Datei anlegen, mit `/** Zweck … */` beginnen, in `main.css` in die
   passende Ebene eintragen. Der Build bricht ab, wenn eine Datei fehlt oder nicht eingebunden ist.

## Schreibweisen

| Was | Muster | Beispiel |
|---|---|---|
| Baustein | Name mit Bindestrich, Teile mit Präfix | `.service-toggle-btn`, `.service-num` |
| Variante | `--` am Baustein | `.section-eyebrow--navy`, `.draft-badge--inline` |
| Zustand (setzt JavaScript) | `.is-…` | `.is-open`, `.is-active`, `.is-visible`, `.is-revealed`, `.is-current` |
| Zustand per ARIA | Attribut statt Klasse, wo es eines gibt | `[aria-pressed="true"]`, `[aria-invalid="true"]`, `[aria-current="page"]` |
| Dokument-Zustand am `<html>` | eigener Name | `.js`/`.no-js`, `.menu-open`, `.motion-paused`, `.intro-pending`, `.header-shown` |
| Typo-Rolle (im HTML vergeben) | `.type-…` | `.type-label`, `.type-mono`, `.type-display` |
| Komposition | Rahmen ohne Aussehen des Inhalts | `.section` + `.section-container`, `.accordion-item`, `.col-block` |
| JavaScript-Anker | `id` oder `data-…`, nie zur Gestaltung | `#hero-canvas`, `[data-motion-toggle]` |

**Typo-Rollen** setzen Schrift, Größe, Laufweite und Großschreibung. Bausteine ergänzen nur
Größe, Farbe und Abstände; weil die Rollen in `base` liegen, gewinnt die Angabe des Bausteins.

**Dunkle Bereiche** (Kontakt, Footer, Abschluss-Karte) setzen lokal `--color-focus` auf eine
helle Variante. Der Fokusrahmen passt sich damit ohne eigene Regeln an.

## Skalen (settings/tokens.css)

| Art | Tokens | Verwendung |
|---|---|---|
| Schrift, fest | `--text-2xs` 11 · `xs` 12 · `sm` 13 · `md` 14 · `base` 15 · `lg` 16 · `xl` 18 · `2xl` 20 · `3xl` 24 px | Bedienung, Beschriftung, Fließtext |
| Schrift, fließend | `--text-lead-sm`, `lead`, `title-xs`, `title-sm`, `title`, `title-lg`, `title-xl`, `display`, `display-xl` | Einleitungen und Überschriften nach Rolle |
| Abstand, fest | `--space-1` 4 · `1-5` 6 · `2` 8 · `2-5` 10 · `3` 12 · `3-5` 14 · `4` 16 · `5` 20 · `6` 24 · `7` 28 · `8` 32 · `10` 40 · `12` 48 · `16` 64 · `24` 96 px | Innen- und Zwischenabstände |
| Abstand, fließend | `--space-fluid-xs` … `fluid-3xl`, `--space-section`, `--space-vh-…` | Abschnitte, Raster, Hero |

Neue Stufe nötig? In `tokens.css` ergänzen, dann `python tools/export_tokens.py` (Figma-Export).

## Regeln, die Tests erzwingen

| Regel | Warum |
|---|---|
| Farbwerte (`#…`, `rgb()`, `hsl()`) nur in `settings/tokens.css` | eine Stelle für das Farbschema, Kontraste werden gemessen |
| `@media` nur mit `(--name)` aus `settings/media.css` | Breakpoints einmal, gleich in CSS und JavaScript |
| Schriftgrößen nur `var(--text-…)`, Abstände (`padding`, `margin`, `gap`) nur `var(--space-…)` – Feinheiten unter 4 px erlaubt | Typografie und Rhythmus an einer Stelle; eine neue Marke ändert nur `settings/tokens.css` |
| `@container` statt `@media`, wenn ein Baustein auf seinen Platz reagieren soll (Container `case` im Kapitel und auf der Komponenten-Seite); Schwellen stehen am Baustein, weil Container-Bedingungen keine Variablen erlauben | Bausteine sind portabel – gleiche Darstellung in jeder Spalte, jedem Projekt |
| `z-index` nur `var(--z-…)` oder 0–9 innerhalb eines Bausteins | Ebenen seitenweit nachvollziehbar |
| `!important` nur in Reset, Hilfsklassen, reduzierter Bewegung und Druck | Vorrang regeln die Ebenen |
| keine ID-Selektoren | IDs sind JavaScript-Anker; Gestaltung über Klassen |
| jede `var(--x)` ohne Ersatzwert ist definiert, jedes Token wird verwendet | keine toten oder fehlenden Werte |
| jedes Modul dokumentiert und ≤ 300 Zeilen | lesbar, eine Aufgabe je Datei |
| Verkleinern ändert keine Regel | Release = Entwicklungs-Build ohne Kommentare und Leerraum |
| Kontraste der Rollen (WCAG 2.2 AA) in hell und dunkel | Barrierefreiheit bleibt messbar |

## Bewusst nicht verwendet

- **CSS-Nesting:** seit Februar 2026 breit verfügbar, aber in Safari bis 16.4 unbekannt; dort
  fiele ein Großteil der Gestaltung weg. Kleine Module mit flachen Selektoren sind ebenso
  übersichtlich und bleiben mit der Suche auffindbar.
- **Präprozessor (Sass, PostCSS):** bräuchte Node.js. Breakpoints (`@custom-media`), Bündeln und
  Verkleinern übernimmt der Python-Build mit wenigen, getesteten Zeilen.
- **Container Queries:** Die Bausteine sitzen heute immer in derselben Spaltenbreite. Sobald ein
  Baustein in unterschiedlich breiten Spalten vorkommt, ist das der richtige Weg.
- **`color-mix()` für Transparenzen:** Die wenigen halbtransparenten Rollen stehen als `rgba()` in
  den Tokens; das ist eindeutig und überall gleich dargestellt.

## Browser

Cascade Layers gibt es in allen aktuellen Browsern seit 2022 (Chrome/Edge 99, Firefox 97,
Safari 15.4). Ältere Browser ignorieren Regeln in Ebenen vollständig; ihr Anteil ist 2026
vernachlässigbar. Die Seite bleibt dort lesbar (HTML ohne Gestaltung), aber nicht gestaltet.

## Gefahrlos umbauen

```powershell
python tools/css_diff.py baseline          # vor dem Umbau: Stand als Vergleichsbasis
# … umbauen …
python tools/css_diff.py compare --quick   # schnell: 390 und 1280 px
python tools/css_diff.py compare           # vollständig: 8 Breiten × 16 Zustände
```

Das Werkzeug lädt jede Seite aus beiden Ständen in Edge ohne JavaScript und versetzt beide in
denselben Zustand. Dann vergleicht es die berechneten Stile jedes Elements samt `::before` und
`::after`:
- **Zustände:** ohne/mit JavaScript, aufgeklappt, Header fixiert, Intro, dunkel, Hover, Fokus
- **Systemeinstellungen:** reduzierte Bewegung, Touch, mehr Kontrast, Windows-Kontrastmodus
- **Druck**

Keine Meldung bedeutet: Der Umbau ist verlustfrei. Zusätzliche Klassen im HTML sind erlaubt,
solange die Elementstruktur gleich bleibt.

## Rezepte

- **Markenfarbe ändern:** Palettenwert in `settings/tokens.css` ändern. Danach
  `python -m unittest tests.test_build.TestDesignTokens` (Kontraste) sowie
  `python tools/make_icons.py` und `python tools/make_social.py`.
- **Abstand der Abschnitte:** `--space-section` / `--space-section-top`.
- **Inhaltsbreite:** `--content-max`.
- **Neuer Abschnitt auf der Startseite:** `<section class="section mein-abschnitt">` mit
  `<div class="section-container">` und `section_head()` in `tools/mcsite/sections.py`; eigene
  Regeln in `sections/mein-abschnitt.css`, in `main.css` unter `sections` eintragen.
- **Neuer Zustand:** Klasse `.is-…` in JavaScript setzen, Regel beim Baustein; für
  `tools/css_diff.js` den Zustand in `openAll()` ergänzen.

## Quellen

- MDN: [Cascade layers](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics/Cascade_layers),
  [@layer](https://developer.mozilla.org/en-US/docs/Web/CSS/@layer),
  [CSS nesting](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_nesting/Using_CSS_nesting)
- web.dev: [Baseline-Status](https://web.dev/blog/new-in-the-web-io2024) (Nesting breit verfügbar seit Februar 2026)
- Harry Roberts: [CSS and Network Performance](https://csswizardry.com/2018/11/css-and-network-performance/) (warum bündeln statt `@import`)
- Andy Bell: [CUBE CSS](https://cube.fyi/) (Komposition, Hilfsklassen, Bausteine, Ausnahmen über Attribute)
- W3C Design Tokens Community Group: Palette und Rollen als zwei Stufen
