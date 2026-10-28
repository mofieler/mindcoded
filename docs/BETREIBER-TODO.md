# Offene Angaben und Entscheidungen des Betreibers

Stand: 19.10.2026. Die aktuelle, automatisch erzeugte Liste offener Felder steht nach
`python tools/build.py` unter `dist-dev/BETREIBER-TODO.html` (in der lokalen Vorschau:
`/BETREIBER-TODO.html`). Der Release-Build verweigert die Veröffentlichung, solange Punkte aus
Abschnitt A fehlen.

Alle Angaben trägt der Betreiber selbst in `content/` ein. Nichts davon wurde erfunden oder
vorausgefüllt.

## A. Pflicht – blockiert den Release-Build

| Datei › Feld | Was einzutragen ist |
|---|---|
| `site.json › url` | Öffentliche Adresse mit `https://`, ohne Schrägstrich am Ende. Wird für Canonical, `hreflang`, Sitemap und `og:url` gebraucht und schaltet in der `.htaccess` HTTPS-Umleitung und HSTS ein. |
| `site.json › operator.name` | Vor- und Nachname bzw. Firmenname (Impressum, Datenschutzerklärung) |
| `site.json › operator.legalForm` | Rechtsform oder `""` |
| `site.json › operator.street`, `postalCode`, `city` | Ladungsfähige Anschrift, kein Postfach |
| `site.json › operator.phone` | Telefonnummer oder `""` (E-Mail und Formular genügen für die schnelle Kontaktaufnahme) |
| `site.json › operator.vatId` | USt-IdNr. oder `""` |
| `site.json › operator.economicId` | Wirtschafts-Identifikationsnummer, falls zugeteilt, sonst `""` |
| `site.json › operator.register` | Registergericht und Nummer oder `""` |
| `site.json › operator.editorialResponsible` | Nur bei journalistisch-redaktionellen Inhalten, sonst `""` |
| `site.json › about.personName` | Name der Person hinter dem Studio – oder `""`, dann entfällt die Personenkarte |
| `de.json` / `en.json › about.personRole`, `about.personBio` | Rolle und zwei bis drei Sätze Hintergrund (nur wenn `personName` gesetzt ist) |
| `site.json › hosting.provider` | Name und Anschrift des Anbieters, bei dem der VPS gemietet ist |
| `site.json › hosting.dpaConfirmed` | `true`, sobald der Vertrag zur Auftragsverarbeitung mit dem VPS-Anbieter abgeschlossen ist. `false` blockiert den Release-Build. |
| `site.json › hosting.logRetention` | Speicherdauer der Webserver-Logs als Satzteil. Die erzeugte Caddy-Konfiguration behält sie 7 Tage, also »für sieben Tage«. |
| `site.json › hosting.mailLogRetention` | Löschfrist der Mailserver-Protokolle als Satzteil (»nach 14 Tagen«), in Stalwart einstellen (docs/E-MAIL.md) |
| `site.json › privacy.updated` | Stand der Datenschutzerklärung (»Oktober 2026«) |

`hosting.mailbox` ist nur bei `contact.mailServer: "hoster"` nötig; beim eigenen Mailserver
(`"own"`, Standard) entfällt es.

Optional, aber nur vollständig: Porträtfoto unter `assets/` ablegen und `about.photo`,
`photoWidth`, `photoHeight` sowie `photoAlt` (DE/EN) setzen.

## B. Inhalte bestätigen (keine Build-Sperre, vor dem Livegang prüfen)

Diese Texte habe ich aus den bisherigen Aussagen der Website abgeleitet und sprachlich
überarbeitet. Sie beschreiben aber eine Arbeitsweise, die nur der Betreiber bestätigen kann.

1. **Ablauf** (`process.steps`): Kennenlernen → Konzept & Angebot → Gestaltung & Umsetzung →
   Start & Übergabe. Entspricht das dem tatsächlichen Vorgehen? Gehören Zugänge und Einweisung
   zur Übergabe?
2. **»Was den Aufwand bestimmt«** und der Satz zum Angebot nach dem Kennenlernen.
3. **Leistungen:** Nur nennen, was tatsächlich angeboten wird, z. B. »Barrierefreiheit (WCAG)«,
   »Inhalte selbst pflegen« (CMS), »Anbindung bestehender Systeme«.
4. **Kontakt-Lead:** »Wir melden uns per E-Mail mit ersten Fragen und einem Vorschlag für ein
   Kennenlerngespräch.« Eine feste Antwortzeit wurde bewusst entfernt.
5. **Zeitrahmen-Optionen** im Formular (`contact.timelineOptions`).
6. **Impressum › Verbraucherstreitbeilegung:** Die Erklärung »nicht bereit und nicht verpflichtet«
   ist voreingestellt (`operator.consumerDisputeStatement`). Bitte bestätigen. Der frühere Link
   zur EU-Plattform für Online-Streitbeilegung wurde entfernt, weil die Plattform im Juli 2025
   eingestellt wurde.
7. **»Wir« oder »ich«:** Die Texte sprechen durchgehend von »wir«. Arbeitet eine Einzelperson,
   ggf. anpassen.
8. **Datenschutzerklärung und Impressum rechtlich prüfen lassen.** Sie beschreiben den
   tatsächlichen technischen Datenfluss (keine Cookies, kein Tracking, Formular über den
   eigenen Mailserver, Mailserver-Protokolle, Rate-Limit mit gehashter IP, Browser-Speicher),
   ersetzen aber keine Rechtsberatung.

## C. Leistungsseiten (größter SEO-Hebel)

Für jede der vier Leistungen ist eine eigene Unterseite vorbereitet (`content/services.json`,
`page.draft: true`). Im Entwicklungs-Build sind sie sichtbar, z. B. `/leistungen/websites/`.
Aufbau, Brotkrumen, Fragen und Antworten, passende Projekte, Anfrage-Button mit Themen-Vorauswahl
sowie strukturierte Daten sind fertig. Es fehlen nur die Texte:

- `page.description` – ein Satz für Suchergebnisse (leer: Kurzbeschreibung der Leistung wird genutzt)
- `page.intro` – zwei bis vier Absätze in eigenen Worten: Was genau, wie, mit welchem Ergebnis?
- `page.forWhom` – für wen die Leistung passt (Stichpunkte)
- `page.faq` – drei bis fünf echte Fragen von Interessenten mit kurzen Antworten

Danach `page.draft` auf `false` setzen. Die Seite erscheint dann im Leistungs-Akkordeon
(»Mehr erfahren«), in Sitemap, `llms.txt` und strukturierten Daten. Einzeln veröffentlichen ist
möglich. Schritte nach dem Livegang: [docs/SEO.md](SEO.md).

## D. Projekte

Die vier Beispielprojekte sind Platzhalter (`draft: true`) und werden nicht veröffentlicht.
Die früheren Kennzahlen (»85 % digitale Buchungen«, »98/100 Lighthouse«, »40.000 Tickets«,
»WCAG 2.1 AA zertifiziert« usw.) waren nicht belegt und sind entfernt.

Für jedes echte Projekt (Schema in der README; Bilder mit `python tools/make_images.py`):

- Art festlegen: Kundenprojekt (nur mit Freigabe des Kunden), Eigenprojekt oder Konzeptstudie
- Ausgangslage, eigener Beitrag, Lösung
- Ergebnisse nur mit Beleg (Messung, Kundenaussage mit Freigabe)
- Freigegebene Bilder (WebP/AVIF, z. B. 1600 × 1000) mit Alternativtexten DE/EN
- Optional: Link zur Live-Website

## E. Technik und Betrieb

**Server (VPS)** – Schritt für Schritt in [docs/SERVER.md](SERVER.md):
- [ ] Beim VPS-Anbieter klären:
  - Ist Port 25 ausgehend offen oder freischaltbar?
  - Lässt sich Reverse-DNS (PTR) setzen?
  - Steht die IP auf keiner Blockliste? (docs/E-MAIL.md, Abschnitt 1)
- [ ] Grundsicherung: Updates automatisch, SSH nur mit Schlüssel, Firewall
- [ ] `content/site.json › server` prüfen (Basisordner, Benutzer, PHP-Version des Systems), dann
      `python tools/build.py --release` → Konfiguration in `dist-server/`
- [ ] PHP-FPM-Pool und Webserver (Caddy empfohlen) aus `dist-server/` einspielen, vorher prüfen
      (`caddy validate` bzw. `nginx -t`)
- [ ] DNS-Einträge nach `dist-server/dns.txt` anlegen, Reverse-DNS beim VPS-Anbieter
- [ ] Veröffentlichen: `python tools/deploy.py --ssh mindcoded@<server>` (Rollback: `--rollback`)
- [ ] Wartungs-Timer einschalten: `systemctl enable --now mindcoded-contact-cleanup.timer`
  - Er löscht stündlich die Prüfwerte; ohne ihn ist die Zusage »spätestens nach 24 Stunden
    gelöscht« nicht gesichert.
  - Nicht zugestellte Anfragen meldet er mit Exit-Code 2 (`systemctl --failed`).

**E-Mail (Stalwart)** – Schritt für Schritt in [docs/E-MAIL.md](E-MAIL.md):
- [ ] Stalwart installieren. Die Weboberfläche läuft hinter dem Webserver; das Zertifikat kommt
      per DNS-01.
- [ ] Domain anlegen und die DKIM-, MTA-STS- und TLS-RPT-Einträge veröffentlichen
- [ ] Konten `hallo@` (Postfach) und `formular@` (nur Website, Zufallspasswort) anlegen; Aliase
      `postmaster@`, `abuse@` und `dmarc@` auf `hallo@`
- [ ] Protokoll-Aufbewahrung begrenzen und in `site.json › hosting.mailLogRetention` eintragen
- [ ] `/srv/mindcoded/private/contact-config.php` aus der Vorlage anlegen (Rechte 600), dann
      `--check` und `--send-test`
- [ ] Mail an mail-tester.com (Ziel 10/10) und an Gmail (»Original anzeigen«: SPF, DKIM und
      DMARC = PASS); DMARC nach 2–4 Wochen verschärfen
- [ ] Backup von `/var/lib/stalwart`, `/etc/stalwart` und `/srv/mindcoded/private` einrichten
      und die Wiederherstellung einmal testen

**Prüfen**
- [ ] **PHP-Endpunkt testen:** `python tools/php_test.py` – auf dem Arbeitsrechner, sobald PHP
      installiert ist, oder direkt auf dem VPS (`python3 tools/php_test.py` im Projekt).
      - Geprüft werden SMTP-Versand, Fehlerfall und Wartungsbefehle gegen einen lokalen
        Test-Mailserver.
      - Bisher nicht ausgeführt: Der Code ist nur statisch geprüft.
- [ ] Nach dem Veröffentlichen: Testanfrage über das Formular, dann die Prüfliste
      [docs/MANUELLE-PRUEFUNG.md](MANUELLE-PRUEFUNG.md) (iPhone, Android, Firefox, Screenreader)
- [ ] **Erklärung zur Barrierefreiheit** (Entwurf, `content/de.json › legal › accessibility`):
      nach der manuellen Prüfung Stand der Vereinbarkeit, Einschränkungen, Prüfart und Datum
      eintragen (alle `TODO:`), dann `draft: false` – sie erscheint im Footer. Rechtlich prüfen
      lassen, ob für das Studio Pflichten aus dem Barrierefreiheitsstärkungsgesetz bestehen.
- [ ] Git installieren und das Projekt einchecken (README › Versionsverwaltung)
- [ ] Vorschaubild für geteilte Links prüfen: `assets/social/og-default.png` (1200 × 630,
      Wortmarke, Claim, Punktwolke) ist mit `python tools/make_social.py` aus den Markenfarben
      erzeugt. Freigeben oder durch ein eigenes Bild gleicher Größe ersetzen
      (`site.json › socialImage`, Alternativtext in `meta.socialAlt`).
- [ ] Suchmaschinen einrichten: Google Search Console, Bing Webmaster Tools, Google
      Unternehmensprofil. Schritte und Felder (`site.json › seo`) in [docs/SEO.md](SEO.md).
- [ ] `seo.securityTxt` ist an: `/.well-known/security.txt` nennt die Studio-Adresse als Kontakt
      für Sicherheitsmeldungen. Läuft jährlich ab und wird bei jedem Build erneuert, also
      mindestens einmal im Jahr neu bauen und hochladen.
- [ ] Optional: `seo.blockAiTraining` – KI-Trainings-Crawler aussperren (Google-Suche bleibt erlaubt).

## F. Voreinstellungen (bei Bedarf ändern)

- Farbschema folgt dem System (`site.json › defaultTheme: "system"`); alternativ `"light"` oder `"dark"`.
- Start-Intro nur beim Ankommen von außen (`site.json › intro: "on-entry"`, ohne Browser-Speicher); `"off"` schaltet es ab.
- Formular-Grenzen und Rate-Limit: `site.json › contact.limits`, `contact.rateLimit`.

## G. Bewusst nicht umgesetzt (nur mit echten Angaben)

- Preise oder Einstiegspreise, typische Projektdauer
- Zugesagte Reaktionszeit
- Terminbuchung (»15-Minuten-Gespräch«) – nur mit echtem Buchungslink
- Kundenlogos, Testimonials
