# Case Studies: Konzept und Bausteine

Stand: 26.10.2026. Wie die Projektseiten aufgebaut sind, warum, und welche Bausteine es gibt.
Erzeugung: `tools/mcsite/blocks.py`, Gestaltung: `assets/css/pages/case-*.css`, Verhalten:
`assets/projects.js` (Kapitelanzeige, Bildstreifen, Zahlen), Einblenden: `assets/effects.js`.

## Für wen wir schreiben

Für Entscheider ohne Fachwissen: Inhaberinnen, Geschäftsführer, Marketing. Jede Case Study muss in
10 Sekunden beantworten: *Hat es funktioniert? Was hätte ich davon?* Deshalb Klartext statt Fachbegriffe
(»verständlich und einfach« statt »pragmatische Qualität«), Skalen in Worten, Stichprobe als Beleg in
Worten (»15 Testpersonen«) und am Ende der Nutzen für den Leser (`takeaway`, »Was Sie davon haben«).

## Leitgedanke

Eine Case Study ist eine ruhige Erzählung in Kapiteln, keine Textwand und kein Dashboard.

- **Erst das Wesentliche:** Kernsatz, Steckbrief, Hauptbild und drei Boxen »Auf einen Blick«.
  Wer nur 30 Sekunden hat, hat danach das Projekt verstanden.
- **Ein Gedanke je Kapitel:** Überschrift, ein Kernsatz, **ein** visueller Baustein. Alles Weitere
  steckt hinter »Mehr dazu« (natives `<details>`, ohne JavaScript bedienbar).
- **Diagramme nur mit echtem Inhalt:** Zahlen in `stats` und `bars` stammen aus Messungen
  (Quelle oder `n =` in `note`), Abläufe und Systeme bilden das tatsächliche Produkt ab. Keine
  Schmuckgrafiken, keine Emojis, keine erfundenen Kennzahlen.
- **Formsprache der Website:** Linien, Mono-Nummern, Display-Schrift, ein Akzent, kleine Boxen
  mit Kartenfläche. Keine neuen Farben – alles über die Rollen aus `settings/tokens.css`, auch im
  dunklen Schema und bei »Mehr Kontrast«.
- **Bewegung mit Zweck:** Bausteine erscheinen beim Hineinscrollen wie der Rest der Seite;
  Diagramme bauen sich dabei einmal auf (Linie wächst, Balken füllen sich, Zahlen zählen hoch).
  Nichts läuft dauerhaft. Bei »Bewegung reduzieren« und ohne JavaScript steht alles
  sofort vollständig da.
- **Touch zuerst:** Auf Handy und Tablet werden Kachelreihen und der Bildstreifen wischbar; die
  angeschnittene nächste Kachel zeigt, dass es weitergeht. Am Desktop blättern Pfeile.
- **Orientierung:** Kapitelüberschriften bleiben am Desktop beim Lesen links stehen; die
  mitlaufende Leiste zeigt das aktuelle Kapitel.

## Neues Projekt anlegen – kopieren statt neu schreiben

1. `python tools/new_project.py <slug> --name "Projektname"` legt einen Entwurf mit **allen** Bausteinen
   als Beispiel an (Vorlage: `content/templates/case-study.json`).
2. Im Entwicklungs-Build zeigt **`/komponenten/`** jeden Baustein live mit seiner JSON-Vorlage und einem
   Knopf »JSON kopieren« – auch ganze Kapitel und eine komplette Case Study.
3. Nicht benötigte Bausteine löschen, Texte ersetzen, Bilder mit `tools/make_images.py` ergänzen,
   `draft` auf `false` setzen.

Bausteine lassen sich auch zwischen Projekten kopieren: ein Kapitel aus `projects.json` in ein anderes
Projekt übernehmen – der Build prüft Pflichtfelder und Werte.

## Seitenaufbau

1. Leiste: zurück zu den Projekten · Fallnummer · aktuelles Kapitel
2. Kopf: Art · Branche · Jahr, Titel, Kernsatz (`summary`), Steckbrief, Tags
3. Hauptbild (erstes Bild) bzw. Punktwolken-Illustration, wenn es keine Bilder gibt
4. »Auf einen Blick« (`glance`): genau drei Boxen, je ein Satz
5. Kapitel (`sections`): 3–4 sind ideal
6. »Einblicke«: Bildstreifen aus den weiteren Bildern
7. Link zur Live-Website (`url`)
8. Anfrage: »Ähnliches Vorhaben?« mit Hauptaktion; Thema im Formular ist vorausgewählt (Kunden- und Eigenprojekte)
9. Nächstes Projekt

## Bausteine

Jedes Kapitel: `{ "heading", "lead", "blocks": [ … ], "more" }`. Jeder Baustein kann `caption`
(Label darüber) und `note` (Quelle/Hinweis darunter) haben. Der Build prüft Pflichtfelder.

| `type` | Felder | Wofür | Darstellung |
|---|---|---|---|
| `text` | `text` | Absätze und Aufzählungen (`• `) | Fließtext |
| `cards` | `items: [{title, text}]` | 2–5 Merkmale, Funktionen, Zielgruppen | kleine Boxen; Handy/Tablet wischbar |
| `compare` | `columns: [{title, items, muted?}]` (genau 2) | Vorher/Ziel, Heute/Konzept, Im Fokus/Weggelassen | zwei Boxen; `muted` nimmt eine zurück |
| `quote` | `text`, `source?` | eine Kernaussage, Leitfrage | große Zeile mit Akzentlinie |
| `steps` | `items: [{title, text?}]` | Ablauf, Methode, Nutzerweg | Punkte auf einer Linie; ab 5 Schritten und auf dem Handy senkrecht |
| `status` | `items: [{title, state}]` mit `done`/`active`/`planned` | Projektstand, Ausblick | wie `steps`, Punkt gefüllt / mit Hof / als Umriss |
| `stats` | `items: [{value, label}]` | 2–3 belegte Kennzahlen | große Zahl in einer Box, zählt hoch |
| `groups` | `items: [{title, value, label, rows: [{label, value}]}]`, `suffix` | viele Einzelaussagen einer Befragung | **nach Themen gebündelt**: je Box eine Leitzahl, Einzelwerte als Balken |
| `split` | `items: [{label, value}]` (Summe ≤ 100), `suffix` | Anteile eines Ganzen | ein geteilter Balken, große Werte in der Legende |
| `scale` | `items: [{label, value}]`, `min`/`max` (Standard −3/+3), `neutral`, `neutralLabel` | Mittelwerte auf Skalen (UEQ, Schulnoten) | Balken ab Nullpunkt, neutrale Zone hinterlegt, Achse −3 · 0 · +3 |
| `bars` | `items: [{label, value}]`, `max` (Standard 100), `suffix` | wenige Werte im direkten Vergleich | Balken, Wert als Text daneben |
| `palette` | `items: [{hex, name, role}]` | Farbwelt einer Marke | Farbfelder; Handy: kompakte Liste |

**Statistiken aufbereiten:** Erst die Aussagen nach Themen clustern (`groups`), dann je Thema die
stärkste Aussage als Leitzahl, die übrigen als Balken. Anteile, die zusammen ein Ganzes ergeben,
als `split`; Skalenwerte immer mit Skala (`scale`), sonst ist »1,9« nicht einzuordnen.

**Keine Netz- oder Strukturdiagramme:** Zusammenhänge besser als Gegenüberstellung
(»Heute: vier Apps« / »Konzept: ein Interface«) oder als Karten erzählen.

## Bewegung

| Was | Wie | Ohne Unterstützung / reduziert |
|---|---|---|
| **Seitenwechsel** | Ein Vorhang für alle Wechsel innerhalb der Website (transitions.js, layout/curtain.css): Projekte, »Nächstes Projekt«, »Zurück zu den Projekten« und Menü/CTA von Unterseiten in einen Abschnitt der Startseite. Fährt hoch mit Nummer (`04 / 06`, `02 / 05` wie im mobilen Menü), Art, Akzentlinie und Titel Wort für Wort – optisch mittig, nie am unteren Rand (Browserleisten). Neue Seite startet darunter, Inhalt gleitet nach oben weg, Vorhang hebt sich, Seitenkopf bzw. Abschnittsüberschrift steigt nach. Hell: Navy, dunkel: Beige. Sprünge innerhalb der Startseite bleiben sanftes Scrollen | normaler Seitenwechsel (auch bei Zusatztaste, Zurück-Button, Neuladen) |
| Einblenden | `[data-rv]` + IntersectionObserver (effects.js) | sofort sichtbar |
| Boxen einer Reihe | kurz nacheinander (case-motion.css) | sofort sichtbar |
| Linien, Balken, Anteile | wachsen einmal von links/vom Nullpunkt | vollständig |
| Kapitellinie | zeichnet sich, wenn die Überschrift erscheint | vollständig |
| Zahlen | zählen in 1,1 s hoch (projects.js › initCountUp); Screenreader hören den Endwert | Endwert |
| Hauptbild | setzt sich beim Hineinscrollen (CSS `animation-timeline: view()`, Chromium/Safari) | ruhig |
| Bildstreifen | Bilder gleiten beim Wischen herein (`view(inline)`) | ruhig |

Kein Framework: Tailwind brächte einen Node-Build und eine zweite Quelle für Gestaltungswerte,
GSAP zusätzliches JavaScript für Effekte, die CSS inzwischen selbst kann (Entscheidung 26.10.2026).

## Bilder

- Erstes Bild = Hauptbild und Vorschau im Projekt-Akkordeon, weitere = Bildstreifen.
- `"fit": "contain"` für Hochformate und Geräte-Mockups – das ganze Bild bleibt sichtbar.
- Der Bildstreifen zeigt jedes Bild in seinem Format (gleiche Höhe, keine Beschnitte).

## Prüfung

`tests/test_build.py` (Bausteine im HTML, Werte als Text, Validierung), `tests/test_browser.py`
(Layout in 7 Breiten – wischbare Bereiche dürfen über den Rand laufen, die Seite selbst nie).
