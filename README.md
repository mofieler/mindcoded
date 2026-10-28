# mindcoded.studio

Website des Studios für Webdesign und Webentwicklung. Statisch vorgerendert mit einem
Python-Generator, angereichert mit Vanilla-JavaScript (Punktwolken, Akkordeons, mitlaufender
Header, Formular), Kontaktformular über einen eigenen PHP-Endpunkt. **Kein Node.js nötig** – weder
zum Bauen noch zum Testen.

| Zweck | Befehl |
|---|---|
| Lokal ansehen (baut automatisch neu) | `python tools/serve.py --watch` → http://127.0.0.1:8000 (`--lan`: auch fürs Handy im WLAN) |
| **Alles prüfen** (Ruff, Tests, Leistungsbudget, PHP, Typen, Stand des Releases) | `python tools/check.py` · schnell ohne Browser: `--fast` |
| Veröffentlichungs-Build | `python tools/build.py --release` → `dist/` |
| Veröffentlichen auf dem VPS (SSH, atomar, mit Rollback) | `python tools/deploy.py --ssh mindcoded@<server>` · zurück: `--rollback` |
| **Neues Projekt** aus der Vorlage (alle Bausteine, als Entwurf) | `python tools/new_project.py <slug> --name "…"` |
| Projektbilder vorbereiten (WebP, mehrere Breiten) | `python tools/make_images.py <slug> bildquellen/foto.jpg --write` |
| **Design System** ansehen, Bausteine als JSON kopieren | `python tools/serve.py` → http://127.0.0.1:8000/komponenten/ (nur Entwicklungs-Build) |
| Design Tokens für Figma/Tokens Studio exportieren (W3C-Format) | `python tools/export_tokens.py` → `design-tokens.json` |
| JavaScript-Typprüfung (ohne Build) | `tsc -p jsconfig.json` (in `check.py` und CI enthalten) |
| Python-Linter (Regeln in `ruff.toml`) | `ruff check tools tests` · einmalig installieren: `uv tool install ruff` |
| Echten PHP-Endpunkt testen | `python tools/php_test.py` (braucht PHP 8.1+) |
| Icons nach Farbänderung neu erzeugen | `python tools/make_icons.py` |
| Vorschaubild für geteilte Links neu erzeugen | `python tools/make_social.py` |
| CSS-Umbau prüfen (vorher/nachher) | `python tools/css_diff.py baseline` → umbauen → `python tools/css_diff.py compare` |

Voraussetzungen: Python 3.12+ (getestet mit 3.14), für Browser-Tests und Bild-Werkzeuge
Microsoft Edge oder Google Chrome. Keine Pakete, keine Installation.

---

## Aufbau – jeder Wert an genau einer Stelle

```
mindcoded/
├── content/              Inhalte – die einzige Stelle für Texte und Einstellungen
│   ├── site.json         Marke, Adresse, Betreiber, Hosting, Formular-Regeln, SEO
│   ├── de.json / en.json Texte je Sprache (inkl. Impressum und Datenschutz in de.json)
│   ├── services.json     Leistungen – beide Sprachen nebeneinander, inkl. Leistungsseiten
│   ├── projects.json     Projekte / Case Studies – beide Sprachen nebeneinander
│   ├── templates/        Vorlage einer Case Study mit jedem Baustein (Komponenten-Seite, new_project.py)
│   └── icons/            einfarbige Technik-Logos (Simple Icons, CC0) für die Leiste »Werkzeuge & Technik«
├── assets/               JavaScript, Schriften, Bilder
│   └── css/              Stylesheet in Modulen mit Cascade Layers (main.css = Reihenfolge, docs/CSS.md)
├── api/contact.php       Formular-Endpunkt (PHP 8.1+, ohne Fremdbibliotheken)
│   └── lib/              seine Module: Konfiguration, Prüfung, Rate-Limit, Nachricht, SMTP, Versand …
├── static/               Favicon und Icons (Wurzel der Website)
├── tools/                build.py, serve.py, check.py, deploy.py, php_test.py, css_diff.py,
│                         make_images.py, make_icons.py, make_social.py, edge.py
│   └── mcsite/           der Generator, ein Modul je Aufgabe (siehe tools/mcsite/__init__.py)
├── tests/                unittest-Suite, Browser-Tests, synthetische Fixtures
├── docs/                 SERVER.md, E-MAIL.md, MIGRATION.md, CASE-STUDIES.md, CSS.md, SEO.md, BETREIBER-TODO.md, MANUELLE-PRUEFUNG.md, adr/
├── dist-dev/             Entwicklungs-Build (Entwürfe, TODO-Markierungen) – nie hochladen
├── dist/                 Release-Build – genau dieser Ordner wird veröffentlicht (Webroot)
└── dist-server/          Release: Serverkonfiguration (Caddy, nginx, Apache, PHP-FPM, Timer, DNS)
```

| Was ändern? | Wo |
|---|---|
| Texte, Navigation, Rechtstexte | `content/de.json`, `content/en.json` |
| Leistungen und Leistungsseiten | `content/services.json` |
| Projekte | `content/projects.json` (+ Bilder unter `assets/projects/`) – neu: `tools/new_project.py` |
| Leiste »Werkzeuge & Technik« | `content/site.json › tools` (+ SVG unter `content/icons/`) |
| Beschriftung der Hauptaktion (überall gleich) | `content/*.json › ui.headerCta` |
| Markenname, E-Mail, Adresse, Formular-Grenzen, SEO-Codes | `content/site.json` – in Texten als `{brand.full}` usw. |
| Farben, Abstände, Radien, Ebenen | `assets/css/settings/tokens.css` (Palette → Rollen) – Punktwolken, Manifest, `theme-color` folgen; nach Farbänderung `make_icons.py` und `make_social.py` |
| Breakpoints | `assets/css/settings/media.css › @custom-media` – CSS und JavaScript folgen |
| Schriftstile (Label, Mono, Display) | `assets/css/base/typography.css`, im HTML als `.type-label` usw. |
| Gestaltung eines Bausteins oder Abschnitts | `assets/css/components/`, `sections/`, `pages/` – siehe [docs/CSS.md](docs/CSS.md) |
| Seitenaufbau (HTML) | `tools/mcsite/sections.py` (Startseite), `pages.py` (Unterseiten), `layout.py` (Rahmen) |
| Sicherheits- und Cache-Header | `tools/mcsite/common.py` (Header), `output.py` (`.htaccess`) |

Beide Ausgabeordner werden bei jedem Build ersetzt. Ein Ordner, der nicht vom Build stammt, wird nie
gelöscht; der Build bricht dann ab. Die Gründe für den Aufbau stehen in [docs/adr/](docs/adr/).

## Inhalte pflegen

Nach dem Speichern baut `python tools/serve.py --watch` automatisch neu.

- **`TODO:`-Werte** sind fehlende Betreiberangaben. Im Entwicklungs-Build erscheinen sie gelb
  markiert, die Liste steht unter `/BETREIBER-TODO.html`. Der Release-Build bricht ab, solange
  einer davon auf einer veröffentlichten Seite verwendet wird.
- **`""`** bedeutet: Angabe entfällt. Die Zeile im Impressum verschwindet dann vollständig, z. B.
  Telefon oder USt-IdNr.
- **Platzhalter** wie `{brand.full}`, `{brand.email}` oder `{operator.name}` werden beim Bauen ersetzt.
- **Links** in Texten: `[Linktext](ziel)` – nur sichere Ziele (https, mailto, interne Pfade).
- **DE und EN** müssen dieselbe Struktur haben. Der Build prüft das.

Was der Betreiber noch liefern oder bestätigen muss: **[docs/BETREIBER-TODO.md](docs/BETREIBER-TODO.md)**.

### Leistungen und Leistungsseiten

Jede Leistung in `content/services.json`:

```json
{
  "key": "websites",
  "topic": "website",
  "slug": { "de": "websites", "en": "websites" },
  "page": { "draft": true },
  "de": {
    "title": "…", "cap": "…", "desc": "…", "tags": ["…"], "stories": ["1. …", "2. …", "3. …", "4. …"],
    "page": { "description": "", "intro": ["Absatz", "Absatz"], "forWhom": ["…"], "faq": [{ "q": "…", "a": "…" }] }
  },
  "en": { "…": "gleiche Felder" }
}
```

- `key` – sprachneutral; Projekte verknüpfen sich darüber (`serviceKeys`).
- `topic` – wird im Kontaktformular vorausgewählt, wenn jemand »Dazu anfragen« wählt.
- `page.draft: true` – Leistungsseite nur im Entwicklungs-Build. Mit `false` erscheint sie unter
  `/leistungen/<slug>/` bzw. `/en/services/<slug>/`, wird im Leistungs-Akkordeon verlinkt und in
  Sitemap, strukturierte Daten und `llms.txt` aufgenommen. Ohne Entwurf blockieren offene TODOs
  der Seite den Release.
- `stories` – genau vier Schritte (Animation und »So gehen wir vor«).

### Projekte

In `content/projects.json` steht je Projekt ein Eintrag:

```json
{
  "slug": "beispiel-projekt", "draft": false, "kind": "own", "shape": 0, "year": "2026",
  "serviceKeys": ["websites"],
  "url": "https://…",
  "images": [
    { "src": "projects/beispiel-projekt/start-1600.webp", "width": 1600, "height": 1000,
      "srcset": [{ "src": "projects/beispiel-projekt/start-800.webp", "width": 800 }],
      "alt": { "de": "Startseite auf dem Laptop", "en": "Home page on a laptop" }, "fit": "contain" }
  ],
  "de": { "name": "…", "industry": "…", "services": "…", "tech": "", "summary": "…", "tags": ["Vue.js", "UX Design"],
          "glance": [{ "label": "Aufgabe", "text": "…" }, { "label": "Lösung", "text": "…" }, { "label": "Stand", "text": "…" }],
          "sections": [{ "heading": "Ausgangslage", "lead": "Ein Kernsatz.",
                         "blocks": [{ "type": "cards", "items": [{ "title": "…", "text": "…" }] }],
                         "more": "Einzelheiten hinter »Mehr dazu«" }] },
  "en": { "…": "gleiche Felder auf Englisch" }
}
```

- `draft: true` – nur im Entwicklungs-Build sichtbar (derzeit »Diese Website«).
- `featured: true` – auf der Startseite als große Bildkarte über der Projektliste (braucht Bilder; gezeigt wird der erste randlose Screenshot). Höchstens zwei bis drei, am besten Kundenprojekte.
- `kind` – `client` (Kundenprojekt, nur mit Freigabe), `own` (Eigenprojekt), `concept` (Konzeptstudie),
  `study` (Studienprojekt). Die Kennzeichnung steht sichtbar an jeder Karte.
- `tags` – optionale Schlagworte je Sprache, erscheinen als Pillen im Projekt-Akkordeon und in der Case Study.
- `glance` – »Auf einen Blick«: drei kurze Boxen unter dem Hauptbild (auf Handy/Tablet wischbar).
- `sections` – Kapitel: `heading`, ein Kernsatz `lead`, Bausteine `blocks`, Einzelheiten in `more`.
  Bausteine: `text`, `cards`, `compare`, `quote`, `steps`, `status`, `stats`, `groups`, `split`, `scale`, `bars`, `palette` – Felder,
  Regeln und Gestaltungsprinzipien in **[docs/CASE-STUDIES.md](docs/CASE-STUDIES.md)**. Der Build prüft sie.
  In Texten trennt eine Leerzeile Absätze, Zeilen mit `• ` werden zur Aufzählung.
- `images` – WebP/AVIF unter `assets/projects/<slug>/`; Breite, Höhe und Alternativtexte sind Pflicht.
  `srcset` mit kleineren Varianten ist optional, aber empfohlen (Handys laden dann kleinere Dateien).
  Das erste Bild ist Vorschau und Hauptbild, weitere bilden den Bildstreifen »Einblicke« (`caption` optional).
  `"fit": "contain"` zeigt das ganze Bild statt eines Ausschnitts (Hochformate, Geräte-Mockups).
- **Ergebnisse nur mit Beleg nennen** – Zahlen in `stats` und `bars` nur aus echten Messungen.

**Bilder** erzeugt `python tools/make_images.py <slug> bildquellen/foto.jpg --write`:
- Es skaliert auf 800, 1200, 1600 und 2400 px, nie größer als das Original.
- Es speichert WebP unter `assets/projects/<slug>/` und trägt Maße und `srcset` in `projects.json` ein.
- Die Alternativtexte stehen als `TODO` drin; bis sie ausgefüllt sind, sperrt der Release.
- **Quelldateien sprechend benennen** (z. B. `kundenname-website-startseite.png`) – der Name wird übernommen und der Build lehnt generische Namen wie `IMG_2041` oder `bild-1` ab (Google-Bildersuche).
- Quellfotos gehören nicht unter `assets/`, sonst werden sie mit ausgeliefert. Der Ordner `bildquellen/` ist dafür vorgesehen und nicht im Repository.
- Hinweis: `--write` formatiert `projects.json` einheitlich neu.

Ohne veröffentlichte Projekte blendet der Build den Abschnitt »Projekte« samt Navigationspunkt aus.
Die Case Study **»Diese Website«** (`diese-website`) liegt als Entwurf bereit; nach dem Livegang
gemessene Werte (z. B. PageSpeed) ergänzen und veröffentlichen.

## Veröffentlichen

Die Website läuft auf einem **eigenen VPS** mit eigenem Mailserver (Stalwart). Einmalige Einrichtung:
[docs/SERVER.md](docs/SERVER.md) und [docs/E-MAIL.md](docs/E-MAIL.md). Umstieg von der alten Nuxt-Website,
Abschalten von Resend und Betrieb neben Coolify: [docs/MIGRATION.md](docs/MIGRATION.md).

1. Offene Angaben in `content/` ergänzen ([docs/BETREIBER-TODO.md](docs/BETREIBER-TODO.md)).
2. `python tools/check.py --release` – alle Tests grün, Release möglich.
3. `python tools/build.py --release` – erzeugt:
   - `dist/` – den Webroot
   - `dist-server/` – Caddy/nginx/Apache, PHP-FPM, Wartungs-Timer und DNS-Einträge, abgeleitet aus
     `content/site.json › server`
4. **Hochladen per SSH:** `python tools/deploy.py --ssh mindcoded@<server>`.
   - Das Skript prüft vorher, lädt in einen neuen Release-Ordner und schaltet `current` atomar um.
   - `--rollback` holt den vorherigen Stand in Sekunden zurück. `--dry-run` zeigt nur den Plan.
   - Für klassischen Webspace gibt es FTPS (`python tools/deploy.py` mit `MC_FTP_*`, siehe `--help`).
5. Auf dem Server: `php …/api/contact.php --check`, dann `--send-test`.
6. Testanfrage über das Formular senden, dann [docs/MANUELLE-PRUEFUNG.md](docs/MANUELLE-PRUEFUNG.md)
   (echte Geräte, Screenreader) und [docs/SEO.md](docs/SEO.md) (Search Console, Bing, Unternehmensprofil).

## Versionsverwaltung (Git)

Git ist auf dem Arbeitsrechner noch nicht installiert. Vorbereitet sind `.gitignore`,
`.gitattributes` (einheitliche Zeilenenden) und ein Prüf-Hook vor jedem Commit. Nach der
Installation von Git (z. B. von git-scm.com) einmalig im Projektordner:

```powershell
git init
git config core.hooksPath .githooks   # vor jedem Commit: python tools/check.py --fast
git add .
git commit -m "Ausgangsstand"
```

Private Daten (Formular-Konfiguration, Quellfotos, Builds) sind über `.gitignore` ausgeschlossen.
Name und E-Mail für Commits setzt Git bei der ersten Nutzung – dafür eine Studio- oder
Rollenadresse verwenden, keine private.

**Sicherheit und Caching auf dem Server** kommen aus einer Quelle (`tools/mcsite/common.py`) und
gelten gleich für Caddy, nginx, Apache (`.htaccess`) und den lokalen Entwicklungsserver:
- CSP ohne `unsafe-inline`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, COOP und HSTS
- eine einzige Adresse (https, kanonischer Host, kein `index.html`)
- interne Dateien und Ordner gesperrt (`api/lib/`, Einstellungen, versteckte Dateien)
- PHP nur für `/api/contact.php`
- CSS und JavaScript über einen Inhalts-Hash versioniert und ein Jahr gecacht

## SEO

Technik und Launch-Schritte: **[docs/SEO.md](docs/SEO.md)**. Kurz: vorgerenderte Seiten je Sprache,
Canonical, `hreflang`, Sitemap mit Bildern, strukturierte Daten (Unternehmen, Website,
Brotkrumen, Leistungen, Case Studies), Vorschaubild, Verifizierung für Google und Bing,
`robots.txt`, `security.txt`, `llms.txt`.

## Kontaktformular

```
Browser ──POST──▶ api/contact.php ──SMTP 465 (TLS, Anmeldung)──▶ eigener Mailserver (Stalwart, DKIM)
   │                 │                                              └─▶ Postfach (lokal zugestellt)
   │ mit JS: JSON    ├─ Herkunft (Origin, Sec-Fetch-Site), max. 20 KB
   │ ohne JS: 303 ──▶├─ Rate-Limit 5 / 10 min (HMAC der IP bzw. IPv6-/64, Schlüssel täglich neu)
   ▼  Danke-/Fehlerseite ├─ Rechenaufgabe gelöst? (Proof-of-Work, ALTCHA-kompatibel, docs/adr/0009)
                     ├─ Honeypot-Feld, Zeitfalle (im Browser gemessene Ausfülldauer < 3 s)
                     ├─ Validierung (Pflichtfelder, Längen, E-Mail, erlaubte Themen)
                     ├─ Konfiguration vollständig? (sonst 503, Eintrag im Zustellfehler-Protokoll)
                     ├─ Erfolg nur, wenn der Mailserver die Nachricht angenommen hat
                     └─ danach Eingangsbestätigung an die anfragende Person (werbefrei, ohne Inhalte)
```

Der Endpunkt ist in Module zerlegt (`api/lib/`, vom Webserver gesperrt): Konfiguration, Prüfung,
Rate-Limit, Nachricht (RFC 5322, DMARC-gerecht), SMTP-Client (TLS mit Zertifikatsprüfung, keine
Fremdbibliothek), Versandwege, Fehlerprotokoll, Ablauf. Wartung auf dem Server:
`php contact.php --check | --send-test | --cleanup`.

- Die Erfolgsmeldung erscheint **nur**, wenn der Server `{"ok": true}` zurückgibt. Bei Fehlern
  bleiben alle Eingaben erhalten. Die Meldung bietet an, die Nachricht vorausgefüllt mit dem eigenen
  E-Mail-Programm zu senden, damit niemand neu tippen muss.
- Stehen ungesendete Eingaben im Formular, fragt der Browser vor dem Neuladen, Schließen oder
  Verlassen der Website nach. Links innerhalb der Website lösen keine Rückfrage aus; beim
  Zurückgehen stellt der Browser die Eingaben wieder her. Gespeichert wird dafür nichts.
- Nicht zugestellte Anfragen merkt sich der Endpunkt im privaten Ordner (`zustellfehler.log`,
  nur Zeitpunkt und Fehlertyp, 30 Tage); der Cron-Lauf meldet sie.
- Grenzen und Themen kommen aus `content/` und gelten gleich im Browser, in PHP
  (`dist/api/contact-settings.php`, vom Build erzeugt) und im lokalen Mock.
- Themen-Vorauswahl über `?thema=<topic>` (Leistungsseiten) oder »Dazu anfragen«.
- Keine Einwilligungs-Checkbox: Rechtsgrundlage ist Art. 6 Abs. 1 lit. b/f DSGVO, mit Hinweis und
  Link zur Datenschutzerklärung. Optional: `content/site.json › contact.requireConsent = true`.
- `content/site.json › contact.mailServer` (`own` oder `hoster`) bestimmt den Text der
  Datenschutzerklärung. Der tatsächliche Versandweg steht in `contact-config.php`.
- Lokal ohne PHP: `python tools/serve.py --api fail|ratelimit|slow` simuliert Fehlerfälle.
- Mit PHP: `python tools/php_test.py` prüft den echten Endpunkt, auch auf dem VPS:
  - Vertrag
  - SMTP-Versand an einen lokalen Test-Mailserver
  - Fehlerfall
  - Wartungsbefehle
- Ohne PHP prüft `tests/test_php_static.py`:
  - Struktur
  - aufgerufene Funktionen
  - Zertifikatsprüfung
  - verbotene Funktionen

## Bedienung auf allen Geräten

- **Handy:** Mobilmenü als Dialog (Fokusfalle, Escape), kompakter Anfrage-Button, der über
  Projekten, Formular und Eingaben verschwindet, Touch-Ziele ≥ 44 px, Wischen in den Animationen.
- **Tablet:** Hoch- und Querformat eigens abgestimmt (Hero-Höhe, Projekttabelle, Formular
  einspaltig, Leistungsseite gestapelt).
- **Desktop:** Hover-Effekte nur bei Maus, magnetische Buttons.
- **Animationen anhalten:** Schalter im Footer jeder Seite (WCAG 2.2.2); bei der
  Systemeinstellung »Bewegung reduzieren« von Anfang an angehalten.
- **Überall:**
  - Der mitlaufende Header erscheint beim Hochscrollen und markiert den aktuellen Abschnitt.
  - Das Farbschema folgt dem System, bis man selbst umschaltet. Wer zurückschaltet, folgt wieder dem System.
  - Weiche Seitenübergänge (View Transitions; der Projekttitel wandert in die Case Study mit) gibt es in Chrome, Edge und Safari.
- **Schwache Geräte:** Die Animationen messen die tatsächliche Bildrate. Ist sie dauerhaft zu
  niedrig, senken sie Auflösung und Punktzahl stufenweise (`assets/perf.js`, ohne Speicherung).
- **Barrierefreiheit:**
  - Inhalte vollständig ohne JavaScript nutzbar.
  - Sichtbarer Fokus, Skip-Link, Landmarks, Brotkrumen.
  - Akkordeons mit `aria-expanded`; Kontraste gemessen (Text ≥ 4,5 : 1, Bedienelemente ≥ 3 : 1).
  - Unterstützt »Mehr Kontrast« und den Windows-Kontrastmodus.
  - Animationen lassen sich anhalten (siehe oben); was sie zeigen, steht für Screenreader als Text daneben.
  - **Erklärung zur Barrierefreiheit** (`content/de.json › legal › accessibility`) liegt als Entwurf
    bereit. Prüfergebnis eintragen, dann `draft: false`, und sie erscheint im Footer
    ([docs/MANUELLE-PRUEFUNG.md](docs/MANUELLE-PRUEFUNG.md)).
- **Start-Intro:** einmal pro Sitzung, nur auf der Startseite. Jede Interaktion beendet es; spätestens
  nach 5 s ist der Inhalt da. Zum erneuten Ansehen `?intro` an die Adresse hängen. Steuerung:
  `content/site.json › intro`.

## Tests

`python -m unittest discover -s tests -t . -v`:

| Datei | Prüft |
|---|---|
| `tests/test_build.py` | Seiten vollständig, Release-Sperre, keine Entwürfe/Platzhalter im Release, Titel/Description/`lang`, eine H1 (komplett ohne JS), Überschriftenfolge, IDs, ARIA-Bezüge, Links und Assets erreichbar, CSP-taugliches Markup, Labels, Alt-Texte, Rechtsseiten, SEO-Dateien und -Optionen, `.htaccess` (Sicherheit, Weiterleitungen, Cache), Serverkonfiguration (gleiche Header in Caddy/nginx/Apache, Sperren, PHP nur fürs Formular, gehärteter Pool, Timer, DNS), Datenschutztext je Mailserver, Versionierung der Skripte, aufgelöste Breakpoints und Platzhalter, keine Farben/Breakpoints im JavaScript, Kontraste, **CSS-Architektur** (Module eingebunden und dokumentiert, Farben nur in Tokens, Breakpoints nur über `@custom-media`, `z-index`/`!important`/IDs, Tokens definiert und genutzt, Verkleinern verlustfrei) |
| `tests/test_contact_api.py` | Formular-Vertrag: 405, Rechenaufgabe (fehlt, gefälscht, doppelt), 422 je Feldregel, verschachtelte Felder, Header-Injection, Honeypot, Zeitfalle, Herkunft, 413, Weiterleitungen ohne JS, Rate-Limit |
| `tests/test_browser.py` | Edge/Chrome headless: JS-Einheitentests (Formular, Rückfrage beim Verlassen, Header-Logik, Themen-Vorauswahl, Farbschema, Leistungswächter), **Layout in 7 Breiten von 360 bis 1920 px ohne Überlaufen**, App startet fehlerfrei auf jedem Seitentyp, stabile H1, Darstellung ohne JavaScript, Start-Intro, Reduced Motion, Bildwerkzeug (WebP-Varianten) |
| `tests/test_php_static.py` | PHP-Endpunkt ohne PHP: Kopf und `strict_types`, Klammern, jede aufgerufene Funktion/Konstante definiert, Module nicht direkt aufrufbar, keine gefährlichen Funktionen, TLS immer geprüft, keine echten Adressen oder Zugangsdaten |
| `tests/browser/a11y.js` (über `test_browser.py`) | **WCAG 2.2 AA mit axe-core** auf jeder Seitenart; Logo-Wortmarke ausgenommen (Logo-Ausnahme in WCAG 1.4.3) |
| `tests/browser/motion.js` | Vorhang beim Projektwechsel: Eingang, Ausgang mit Zieltitel, Seite darunter `inert` |
| `tests/test_tools.py` | Veröffentlichen per SSH (Archiv, atomares Umschalten, Rollback, sichere Zielangabe) und FTPS (Reihenfolge, nur Änderungen, Löschen nur eigener Dateien), kein Upload von Entwicklungs-Builds; Test-Mailserver |

Browser-Tests werden übersprungen, wenn kein Edge/Chrome gefunden wird (Pfad über `MC_BROWSER`).

## Datenschutz

- Keine Cookies, kein Tracking, keine externen Ressourcen (CSP `default-src 'self'`).
- Browser-Speicher: `localStorage › mc-theme` (nur nach Klick auf den Farbschema-Schalter, gelöscht
  bei Rückkehr zur Systemeinstellung) – steht in der Datenschutzerklärung. Das Start-Intro braucht
  keinen Speicher (läuft nur beim Ankommen von außen). Formulareingaben werden nicht im Browser gespeichert.
- `contact.php` protokolliert nur Ereignistypen, nie Formularinhalte oder IP-Adressen.
- Impressum und Datenschutzerklärung sind **technisch vorbereitet, keine Rechtsberatung**.

## Schriften

Bricolage Grotesque, Manrope und Space Mono, lokal gehostet unter der SIL Open Font License 1.1.
Der Lizenztext liegt in `assets/fonts/LICENSES.md` und wird mit ausgeliefert.
