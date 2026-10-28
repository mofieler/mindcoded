# SEO – was technisch vorbereitet ist und was beim Livegang zu tun ist

Stand: 19.10.2026. Alles unter »Automatisch« erzeugt `python tools/build.py --release` ohne weiteres
Zutun, sobald `content/site.json › url` gesetzt ist.

## Automatisch im Release-Build

| Bereich | Umsetzung |
|---|---|
| Inhalte im HTML | Alle Texte stehen im ausgelieferten HTML (vorgerendert), Seiten funktionieren ohne JavaScript |
| Sprachen | Eigene URLs `/` (DE) und `/en/`, `lang` je Seite, `hreflang` de/en/x-default im `<head>` und in der Sitemap |
| Kanonische Adresse | `<link rel="canonical">` je Seite; `.htaccess` leitet anderen Host (mit/ohne www), `http` und `…/index.html` per 301 auf die eine Adresse um |
| Titel & Beschreibung | Je Seite eindeutig, Muster »Seite – Marke«; Beschreibungen an Wortgrenzen gekürzt (≤ 155 Zeichen) |
| Social Sharing | Open Graph (Titel, Beschreibung, Bild 1200 × 630 mit Maßen und Alternativtext, Sprache + Alternativsprache), Twitter/X `summary_large_image` |
| Strukturierte Daten | `ProfessionalService` (Logo, Bild, E-Mail, Ort, Einsatzgebiet, optional Profile und Straße) und `WebSite` auf allen Seiten; `BreadcrumbList` + `Service` auf Leistungsseiten; `BreadcrumbList` + `CreativeWork` auf Case Studies |
| Sitemap | `sitemap.xml` mit allen veröffentlichten Seiten, Sprachverweisen, Projektbildern und dem echten Änderungsdatum der Inhalte (nicht dem Build-Datum) |
| robots.txt | Erlaubt alles außer `/api/`, nennt die Sitemap; optional KI-Trainings-Crawler aussperren (`seo.blockAiTraining`) |
| Nicht indexiert | Impressum, Datenschutz, Danke-/Fehlerseiten, 404 und alle Entwürfe tragen `noindex`; der Entwicklungs-Build sperrt Suchmaschinen komplett |
| Leistung | Vorgeladene Schriften, kein externes Laden, Bilder mit Breite/Höhe (kein Layout-Sprung), `srcset` für Projektbilder, `fetchpriority` für das Hauptbild, CSS/JS mit Inhalts-Hash und 1 Jahr Cache, gzip |
| Weitere Dateien | `/.well-known/security.txt`, `/llms.txt` (Kurzübersicht für KI-Assistenten), `site.webmanifest`, Favicons |
| Verifizierung | Meta-Tags für Google und Bing oder Google-Verifizierungsdatei – nur Code in `content/site.json › seo` eintragen |

## Beim Livegang (einmalig)

1. **Website-Adresse festlegen:** `content/site.json › url`, z. B. `https://www.mindcoded.studio`
   (mit oder ohne www – die andere Variante leitet die `.htaccess` automatisch um).
2. **Google Search Console** (search.google.com/search-console):
   - Am besten **Domain-Property** per DNS-TXT-Eintrag beim Hoster anlegen. Sie deckt http/https
     und alle Subdomains ab, und am Code ändert sich nichts.
   - Alternativ **URL-Präfix-Property**: den Code aus dem HTML-Tag-Verfahren in
     `seo.googleSiteVerification` eintragen oder den Dateinamen der HTML-Datei in
     `seo.googleVerificationFile`. Danach neu bauen und hochladen.
   - Unter »Sitemaps« die Adresse `sitemap.xml` einreichen.
   - Mit der »URL-Prüfung« die Startseite und `/en/` live testen und die Indexierung beantragen.
3. **Bing Webmaster Tools** (bing.com/webmasters): Website aus der Search Console importieren
   (geht in einem Schritt) oder `seo.bingSiteVerification` setzen. Bing beliefert auch DuckDuckGo,
   Ecosia und andere.
4. **Google Unternehmensprofil** (business.google.com): Für »Webdesign Stuttgart« ist das lokale
   Profil der größte Hebel. Name, Ort und Website müssen exakt mit Impressum und Website
   übereinstimmen (NAP-Konsistenz). Die Profil-URL anschließend in `seo.profiles` eintragen,
   ebenso LinkedIn, GitHub usw.
5. **Prüfen:**
   - Rich-Results-Test (search.google.com/test/rich-results) für Start-, Leistungs- und Case-Seite
   - PageSpeed Insights (pagespeed.web.dev) für Mobil und Desktop; Felddaten erscheinen erst nach
     einigen Wochen mit genug Besuchern
   - Vorschau geteilter Links, z. B. mit dem LinkedIn Post Inspector

## Inhaltlich – die größten Hebel

Technisch ist die Seite vorbereitet; Rankings entstehen über Inhalte:

- **Leistungsseiten veröffentlichen** (`content/services.json`): pro Leistung 300–600 Wörter in
  eigenen Worten, typische Fragen, passende Projekte. Danach `page.draft` auf `false` setzen. Jede
  Seite wird automatisch in Navigation, Sitemap, strukturierte Daten und interne Verlinkung
  aufgenommen.
- **Echte Projekte** mit Ausgangslage, Beitrag und belegtem Ergebnis, mit Bildern und Alternativtexten.
- **H1 der Startseite:** Sie enthält bewusst keinen Suchbegriff (»Digitales, gemacht für …«).
  »Webdesign · Entwicklung · Stuttgart« steht im Titel und in der Zeile darüber. Wer stärker auf
  lokale Suche zielt, kann den Ort in die H1 aufnehmen – das ist eine Text-, keine Technikfrage.
- **Erwähnungen und Verlinkungen:** Branchenverzeichnisse, Partner, Kammern, lokale Netzwerke.

## Sichtbar in Stuttgart und der Region (Stand 26.10.2026)

Recherche: Google-Dokumentation, Local Search Forum, Search Engine Journal, BrightLocal, Search Engine Land
(Quellen unten). Reihenfolge nach Wirkung.

1. **Google-Unternehmensprofil** – der stärkste Hebel für lokale Suchen.
   - Hauptkategorie »Webdesigner«, weitere passende Kategorien sparsam; nicht ständig wechseln.
   - Als Einzugsgebiets-Unternehmen anlegen (Adresse verbergen, Einzugsgebiet Stuttgart und Region).
   - Leistungen, Öffnungszeiten, Foto (Porträt), Website-Link mit `?utm_source=gbp` nur, wenn eine Statistik läuft.
   - Regelmäßig Beiträge (z. B. neue Case Study) – aktive Profile ranken besser.
2. **Bewertungen** – Menge, Aktualität und Wortlaut zählen. Jede zufriedene Kundin, jeden Kunden direkt
   mit Link bitten (Paquita zuerst). Nie kaufen oder mit Gegenleistung belohnen (verstößt gegen Googles Richtlinien).
3. **Einheitliche Angaben (NAP)** – Name, Ort, E-Mail überall gleich schreiben: Website, Profil, Verzeichnisse.
4. **Wenige gute Einträge statt vieler schlechter** – Apple Business Connect, Bing Places, Das Örtliche/Gelbe Seiten,
   11880, Branchenverzeichnisse für Webdesign; dazu Hochschule der Medien (Alumni) und lokale Netzwerke.
5. **Links aus echten Projekten** – Hinweis »Website: mindcoded.studio« im Footer von Kundenwebsites
   (mit Einverständnis), Case-Study-Verweis auf der Kundenseite.
6. **Inhalte statt Städte-Seiten** – keine Seiten, die sich nur im Ortsnamen unterscheiden (gelten als
   »Doorway Pages«). Stuttgart und Region stehen natürlich in Leistungsseiten, strukturierten Daten
   (`seo.areaServed`) und Case Studies. Neue Seiten nur mit eigenem Inhalt (z. B. Case Study eines Kunden aus Esslingen).
7. **Bilder** – sprechende Dateinamen (der Build lehnt generische Namen ab), Alt-Texte, die beschreiben,
   was zu sehen ist; WebP in mehreren Größen. Laut Foren ein kleiner, aber kostenloser Faktor; Alt-Text und Kontext wiegen mehr.
8. **Messen ohne Tracking-Banner** – Google Search Console (Suchbegriffe, Klicks, Positionen) und Bing Webmaster
   Tools genügen für SEO. Besucherzahlen cookielos selbst gehostet mit Umami (siehe [STATISTIK.md](STATISTIK.md)).
   **Google Analytics 4** nur mit Einwilligungs-Banner (TTDSG/DSGVO) – widerspricht dem Versprechen
   »keine Cookies, kein Tracking« und liefert wegen Ablehnungen lückenhafte Daten. Entscheidung: offen (Betreiber).

Quellen: [Google – Bilder](https://support.google.com/webmasters/answer/114016) ·
[Search Engine Journal – Local SEO für Einzugsgebiets-Unternehmen](https://www.searchenginejournal.com/local-seo-for-service-area-businesses/533552/) ·
[BrightLocal – lokale Landingpages](https://www.brightlocal.com/learn/local-landing-pages/) ·
[Search Engine Land – lokale Landingpages](https://searchengineland.com/optimizing-local-landing-pages-for-search-best-practices-393396) ·
[Local Search Forum – Städte-Seiten](https://localsearchforum.com/threads/best-way-to-create-city-pages-without-looking-spammy.63114/) ·
[Shopify Community – Bildnamen](https://community.shopify.com/t/image-filenames-important-for-seo-or-not-anymore/570169)

## Optionen in `content/site.json › seo`

| Feld | Wirkung |
|---|---|
| `googleSiteVerification` | Meta-Tag `google-site-verification` (nur den Code) |
| `googleVerificationFile` | erzeugt die HTML-Datei der Search Console im Webroot |
| `bingSiteVerification` | Meta-Tag `msvalidate.01` |
| `profiles` | Profile (Unternehmensprofil, LinkedIn …) als `sameAs` in den strukturierten Daten |
| `publishStreetAddress` | Straße und PLZ aus dem Impressum auch in den strukturierten Daten (Standard: nur Ort) |
| `blockAiTraining` | sperrt bekannte KI-Trainings-Crawler in `robots.txt` (die Google-Suche bleibt erlaubt) |
| `securityTxt` | `/.well-known/security.txt` mit Kontaktadresse (Standard: an) |
