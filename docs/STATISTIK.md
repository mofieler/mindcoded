# Besucherstatistik (Umami)

Cookielose Statistik auf dem eigenen Server: https://stats.mindcoded.studio (Coolify-Dienst „Umami“,
Zugang im Passwort-Manager „Umami Statistik“). Datenschutzerklärung: `content/de.json › legal.privacy › Besucherstatistik`.

## Wie es eingebunden ist

- Nur im Release-Build (`layout.py › analytics_tag`); Entwicklung und Tests zählen nicht mit.
- Tracker unter `/insights`, Daten an `/api/ping` – umbenannt, damit Inhaltsblocker sie nicht verwerfen.
- `data-do-not-track` – Browser mit „Do Not Track“ werden nicht erfasst.
- `data-exclude-hash` – Sprünge zu Abschnitten (`/#leistungen`) sind **keine** eigenen Seitenaufrufe.
  Wie weit die Startseite gelesen wird, zeigt stattdessen das Ereignis „Abschnitt gesehen“.
- Daten älter als 26 Monate löscht eine wöchentliche Aufgabe in Coolify.
- Links in unseren Mails tragen `utm_source=e-mail` und `utm_medium=signatur` bzw. `fusszeile`; eigene Links
  (Google-Profil, Social Media, Angebote) ebenso kennzeichnen, z. B. `?utm_source=google-profil`. Sonst erscheinen
  solche Besuche als „Direkt / unbekannt“, weil Mail-Apps und Messenger keinen Verweis mitsenden.
- Ort: Land, Region und Stadt aus der IP-Adresse (die IP selbst speichert Umami nicht).
- `data-performance` – Ladezeiten (Core Web Vitals: LCP, INP, CLS …) unter *Performance* in Umami. Liest weitere
  Geräteinformationen aus; nach strenger Lesart von § 25 TDDDG ein Restrisiko (wie die Bildschirmgröße) – bewusst
  so entschieden (28.10.2026), kein Banner.
- Bewusst **nicht** genutzt: Session Replay und Heatmaps (zeichnen Besuche auf – widerspricht dem Versprechen).

Der Wochenbericht (`ops/bin/mc-weekly-report`) fasst die Zahlen jeden Freitag per Mail zusammen.

## Ereignisse

Erlaubte Namen stehen in `tools/mcsite/common.py › ANALYTICS_EVENTS`. Ein Test (`test_analytics_events_are_registered`)
bricht ab, wenn ein Name im HTML oder in `assets/*.js` dort fehlt – oder registriert, aber nirgends gemeldet wird.
Klicks setzt der Generator per `self.track(...)` als `data-umami-event`; alles andere meldet `assets/analytics.js › track`.
**Nie** Eingaben oder personenbezogene Daten als Eigenschaft mitsenden.

| Ereignis | Eigenschaften | Wann |
|---|---|---|
| Erstgespräch-Klick | `ort` (Kopfzeile, Menü, Hero, Studio, Leistungen, Leistungsseite, Projektseite), ggf. `leistung`, `projekt` | Klick auf einen Weg zum Kontakt |
| E-Mail-Klick | `ort` (Kontakt, Menü) | Klick auf die E-Mail-Adresse |
| Projekt geöffnet | `projekt` | Klick auf ein Projekt |
| Live-Seite geöffnet | `projekt` | Klick auf „Live-Seite“ einer Case Study |
| Video abgespielt | `projekt` | Start des Videos (Zwei-Klick-Lösung) |
| Sprache gewechselt | `nach` (de, en) | Klick auf die andere Sprache |
| Abschnitt gesehen | `abschnitt` (leistungen, ablauf, studio, projekte, kontakt) | Abschnitt steht 1 s in der Bildschirmmitte, einmal pro Aufruf |
| Seite nicht gefunden | `pfad` | Aufruf der 404-Seite – zeigt kaputte Links |
| Kontaktformular begonnen | – | erster Fokus im Formular |
| Kontaktformular gesendet | – | Server hat den Versand bestätigt |
| Kontaktformular fehlgeschlagen | `grund` (eingabe, limit, spamschutz, server) | Versand nicht möglich |

Neues Ereignis: Namen in `ANALYTICS_EVENTS` ergänzen, hier eintragen, bei neuer Art von Daten die
Datenschutzerklärung prüfen.

## Auswertung in Umami einrichten (einmalig)

Unter **Websites › mindcoded.studio**:

- **Funnel** „Anfrage“: Seitenaufruf `/` → Ereignis *Abschnitt gesehen* → *Kontaktformular begonnen* → *Kontaktformular gesendet*.
  Zeigt, an welcher Stelle Besucher abspringen.
- **Goals**: *Kontaktformular gesendet* und *E-Mail-Klick* – die beiden echten Anfragen.
- **Events › Erstgespräch-Klick** nach `ort` aufschlüsseln – welcher Button wirkt.
- **Events › Kontaktformular fehlgeschlagen** nach `grund` – häuft sich `spamschutz` oder `server`, ist etwas kaputt.

Was Umami nicht kann: Suchbegriffe. Die liefert die Google Search Console (siehe [SEO.md](SEO.md)).
