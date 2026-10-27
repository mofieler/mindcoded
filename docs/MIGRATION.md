# Umstieg: alte Nuxt-Website → statischer Generator, Resend → eigener Mailserver

Stand: 26.10.2026. Dieses Dokument beschreibt, was beim Wechsel vom alten Aufbau (Nuxt 3, Node,
PostgreSQL, Resend, reCAPTCHA, Deployment über Coolify) auf diesen Aufbau übernommen wurde und was
noch zu tun ist, bevor der alte Stand abgeschaltet wird. Einrichtung des Servers:
[SERVER.md](SERVER.md), des Mailservers: [E-MAIL.md](E-MAIL.md), Begründung:
[adr/0006](adr/0006-eigener-mailserver-stalwart.md).

## Was übernommen wurde

Der alte Stand liegt vollständig (mit Git-Historie, nicht eingecheckten Änderungen und `.env`) im
Nachbarordner `../mindcoded-nuxt-alt/`.

| Quelle | Neu | Hinweis |
|---|---|---|
| alte Nuxt-Seite: Paquita-Texte, Tags | `content/projects.json › paquita-pilates` | Farbpalette (7 Farben) und Schriften von hier |
| moritzfieler.de (`../moritzfieler.com/frontend`): Paquita, Pilateq, Connected E-Mobility, B.E.A.S.T., HIQER, Kischde | `content/projects.json` | Texte zu Kapiteln verdichtet (docs/CASE-STUDIES.md), Messwerte unverändert übernommen |
| Bilder beider Seiten | `assets/projects/<slug>/*.webp`, Quellen in `bildquellen/` | mit `tools/make_images.py`, Alternativtexte ergänzt |
| Profilfoto, Werdegang (moritzfieler.de) | `assets/about/portrait-320.webp`, `content/*.json › about` | Bio ohne aktuellen Arbeitgeber |
| `pages/imprint.vue` (Name, Anschrift, Berufsbezeichnung, Kleinunternehmer) | `content/site.json › operator`, `about.personRole` | USt-IdNr. entfällt (§ 19 UStG) |
| `.env.example › SITE_URL` | `content/site.json › url` | |

Bewusst nicht übernommen:
- **Branchen-Beispielseiten** (Ironpulse, Boeckler, Dr. Hartmann, Tre Pini). Erfundene Firmen mit
  erfundenen Kennzahlen schwächen die echten Referenzen. Die Startbilder liegen weiter in
  `bildquellen/` – für gezielte Entwürfe an echte Interessenten.
- Personen- und Ambiente-Fotos unter `public/images/` (Herkunft und Lizenz nicht dokumentiert).
- »Steal Back« (Spielkonzept): auf moritzfieler.de nicht veröffentlicht, keine Bilder.
- Die B.E.A.S.T.-Präsentation (PDF) und das Video – vor einer Veröffentlichung die Freigabe von
  Mercedes-AMG klären.
- Double-Opt-in, Datenbank und reCAPTCHA des alten Formulars. Das neue Formular braucht sie
  nicht: Schutz über Honeypot, Zeitfalle, Herkunftsprüfung und Rate-Limit (README › Kontaktformular).

Widersprüche in den Quellen, offen zu klären:
- Note der Bachelorarbeit: 1,3 (bestätigt am 26.10.2026; die alte Projektseite nannte fälschlich 1,0).
- Zeiträume bei Mercedes-Benz und DHBW weichen zwischen Werdegang und Zeitleiste ab.
- Jahr der Bachelorarbeit (2024) ist aus dem Werdegang abgeleitet; HIQER (2021) aus dem Datum der
  Testauswertung.

## Resend abschalten

Erst ausführen, wenn das neue Formular auf dem VPS eine Testanfrage zugestellt hat
(`php …/api/contact.php --send-test`, danach über die Website).

1. **Alte App stoppen:** in Coolify die Nuxt-Anwendung `mindcoded` stoppen. Erst danach die
   folgenden Schlüssel entwerten, sonst schlägt das alte Formular fehl, solange es noch läuft.
2. **Resend-API-Schlüssel widerrufen:** Resend-Dashboard › API Keys › Schlüssel löschen.
3. **Domain in Resend entfernen:** Resend-Dashboard › Domains › `mindcoded.studio` löschen.
4. **DNS-Einträge von Resend löschen** – sie stehen im Resend-Dashboard bei der Domain. Üblich sind:
   - `TXT resend._domainkey` (DKIM von Resend)
   - `MX send` und `TXT send` (Rücklauf- und SPF-Eintrag der Versand-Subdomain)

   Vorher prüfen, dass keiner dieser Namen mit den neuen Einträgen aus `dist-server/dns.txt`
   kollidiert. Den Haupt-SPF-Eintrag der Domain (`v=spf1 mx -all`) **nicht** um Resend erweitern.
5. **reCAPTCHA-Schlüssel löschen:** Google reCAPTCHA Admin › Website entfernen.
6. **Gespeicherte Kontaktanfragen** in der PostgreSQL-Datenbank der alten App (Coolify):
   bei Bedarf exportieren, dann Datenbank löschen. Das sind personenbezogene Daten, die der neue
   Aufbau nicht mehr speichert und die neue Datenschutzerklärung nicht mehr nennt.
7. **Resend-Konto kündigen**, sobald nichts anderes mehr darüber sendet.
8. Die alte `.env` in `../mindcoded-nuxt-alt/` enthält die echten Schlüssel. Nach Schritt 2 und 5
   sind sie wertlos; den Ordner trotzdem nicht weitergeben oder hochladen.

## Coolify auf demselben VPS

[SERVER.md](SERVER.md) geht davon aus, dass Caddy direkt auf dem Server die Ports 80 und 443
bedient. Läuft auf dem VPS bereits **Coolify**, gehören diese Ports dessen Proxy (Traefik). Beide
zugleich auf 443 geht nicht. Zwei Wege:

**Empfohlen – Caddy hinter Traefik:** Der Aufbau aus SERVER.md bleibt (Releases, `deploy.py`,
PHP-FPM-Pool, Wartungs-Timer), nur Caddy lauscht intern statt öffentlich.
- In der Caddyfile die Website-Blöcke auf `http://…:8081` umstellen und `auto_https off` setzen;
  TLS übernimmt Traefik.
- In Coolify (Server › Proxy › Dynamic Configuration) einen Router für `mindcoded.studio`,
  `www.`, `mail.`, `autoconfig.`, `autodiscover.` und `mta-sts.` auf `http://host.docker.internal:8081`
  anlegen, mit Let's-Encrypt-Zertifikat von Traefik.
- Die Sicherheits-Header setzt weiterhin Caddy – sie kommen aus derselben Quelle wie in den Tests.
- Caddy muss die echte Besucher-IP aus `X-Forwarded-For` übernehmen (`trusted_proxies` auf das
  Docker-Netz), sonst greift das Rate-Limit des Formulars für alle Besucher gemeinsam.
- Stalwarts Mail-Ports (25, 465, 587, 993) sind davon nicht betroffen; Traefik belegt sie nicht.
  Das SMTP/IMAP-Zertifikat am besten per DNS-01 ([E-MAIL.md](E-MAIL.md) › Port 443 teilen).

**Alternative – als Coolify-Anwendung:** Ein Container mit Caddy und PHP-FPM, der `dist/` ausliefert.
Passt zu den übrigen Coolify-Projekten, ersetzt aber `deploy.py` (atomare Releases, Rollback) und
den Wartungs-Timer durch Coolify-Mittel; `private/` braucht ein dauerhaftes Volume. Dafür gibt es
hier noch kein Dockerfile.

Diese Anpassungen sind **noch nicht** in den erzeugten Server-Dateien (`dist-server/`) umgesetzt.
Vorher klären, ob Coolify auf dem Ziel-VPS tatsächlich läuft und welche Ports belegt sind
(`sudo ss -tlnp`).

## Git und Deployment des alten Repositorys

Das GitHub-Repository `mindcoded` gehört zur alten Nuxt-App; Coolify baut vermutlich automatisch aus
dessen `main`. Diesen Stand **nicht** auf `main` dieses Repositorys pushen, solange die alte App dort
deployt wird – Coolify würde ihn als Node-Anwendung bauen und die Website wäre offline. Entweder
ein neues Repository anlegen oder erst die alte App in Coolify vom Repository trennen.
