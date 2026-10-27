# E-Mail: eigener Mailserver (Stalwart) und Versand des Kontaktformulars

Stand: 19.10.2026. Ziel: Postfächer unter der eigenen Domain auf dem eigenen VPS, ohne laufende
Kosten. Das Formular liefert per SMTP an diesen Mailserver ein; der Server signiert mit DKIM, und
SPF und DMARC passen. Die Entscheidung steht in
[adr/0006-eigener-mailserver-stalwart.md](adr/0006-eigener-mailserver-stalwart.md), die
Server-Grundeinrichtung in [SERVER.md](SERVER.md).

In den Beispielen steht `example.com` für Ihre Domain. Die passenden Werte für Ihre Domain
erzeugt der Release-Build in `dist-server/dns.txt`.

## Wie es zusammenhängt

```
Besucher ─HTTPS─▶ Webserver (Caddy) ─▶ api/contact.php ─SMTP 465, TLS, Anmeldung─▶ Stalwart ─▶ Postfach hallo@
                                                                                    (derselbe VPS, lokal zugestellt)
Ihr Mailprogramm ⇄ IMAP 993 / SMTP 465 ⇄ Stalwart ⇄ Port 25 ⇄ Mailserver anderer Anbieter
```

**Wichtig:** Formular-Mails verlassen den Server nie, sie werden lokal ins eigene Postfach
zugestellt. Spam-Ordner und IP-Ruf spielen für das Formular deshalb keine Rolle. Sie betreffen
nur Ihre eigenen ausgehenden Mails, etwa Antworten an Kunden; dafür gilt Abschnitt 6.

## 1. Voraussetzungen prüfen – vor allem anderen

| Punkt | Prüfen | Wenn nicht erfüllt |
|---|---|---|
| **Port 25 ausgehend** (Mails an Gmail & Co.) | auf dem VPS: `timeout 5 bash -c '</dev/tcp/gmail-smtp-in.l.google.com/25' && echo offen \|\| echo gesperrt` | Viele Anbieter sperren ihn ab Werk, z. B. Hetzner Cloud bis zur Freischaltung per Antrag nach der ersten Rechnung. Das Formular funktioniert trotzdem; für eigene Mails Freischaltung beantragen. |
| **Port 25 eingehend** und 465, 587, 993 | Firewall des VPS und des Anbieters | freigeben (siehe [SERVER.md](SERVER.md)) |
| **Reverse-DNS (PTR)** | im Kundenmenü des VPS-Anbieters einstellbar? | ohne PTR lehnen große Anbieter Mails ab |
| **IP-Ruf** | IP des VPS in einem Blocklisten-Check prüfen (z. B. MXToolbox, Spamhaus) | gelistete IP: neue IP anfordern |
| **Arbeitsspeicher** | ≥ 1 GB frei (Empfehlungen in Anleitungen: 2 GB) | größeren Tarif wählen |

## 2. DNS-Einträge

Alle Einträge stehen fertig in `dist-server/dns.txt`. Was sie bewirken:

| Eintrag | Zweck |
|---|---|
| `A`/`AAAA mail.example.com` | Adresse des Mailservers |
| `MX example.com → mail.example.com` | wohin Mails an `@example.com` zugestellt werden |
| `TXT "v=spf1 mx -all"` | **SPF:** nur der Mailserver darf für die Domain senden |
| `TXT <selector>._domainkey` | **DKIM:** öffentlicher Schlüssel; Stalwart signiert jede ausgehende Mail |
| `TXT _dmarc "v=DMARC1; p=none; rua=…"` | **DMARC:** Regel für Mails, die SPF/DKIM nicht bestehen, plus tägliche Berichte |
| MTA-STS, TLS-RPT | erzwingen verschlüsselte Zustellung an Ihren Server und melden Probleme |
| `autoconfig`/`autodiscover` | Mailprogramme finden die Einstellungen selbst |
| **PTR** (beim VPS-Anbieter) | Rückwärtsauflösung der IP auf `mail.example.com` |

**DMARC schrittweise verschärfen:**
1. Mit `p=none` beginnen und zwei bis vier Wochen die Berichte lesen (an `dmarc@…`).
2. Sind alle eigenen Mails mit SPF und DKIM `pass`, auf `p=quarantine` umstellen.
3. Danach auf `p=reject`.

## 3. Stalwart installieren

Nach der offiziellen Anleitung ([stalw.art › Install › Linux](https://www.stalw.art/docs/install/platform/linux)). Zum Zeitpunkt dieser Anleitung:

```sh
curl --proto '=https' --tlsv1.2 -sSf https://get.stalw.art/install.sh -o install.sh
less install.sh                      # vor dem Ausführen lesen
sudo sh install.sh
sudo journalctl -u stalwart -n 200 | grep -A8 'bootstrap mode'   # einmaliges Admin-Passwort
```

Programm, Konfiguration und Daten liegen danach unter `/usr/local/bin/stalwart`, `/etc/stalwart/`
und `/var/lib/stalwart/`.

**Einrichtung im Browser, nie öffentlich:**
1. Vom eigenen Rechner einen Tunnel öffnen: `ssh -L 8080:127.0.0.1:8080 mindcoded@<server>`.
2. Lokal http://127.0.0.1:8080/admin öffnen. Port 8080 bleibt in der Firewall zu.

### Port 443 teilen

Website und Mailserver laufen auf demselben VPS. Port 443 gehört dem Webserver; Stalwarts
Weboberfläche läuft dahinter. Die erzeugte Caddy- bzw. nginx-Konfiguration leitet `mail.…`,
`autoconfig.…`, `autodiscover.…` und `mta-sts.…` an `127.0.0.1:8080` weiter.

In Stalwart:
- Den HTTP-Listener nur an `127.0.0.1:8080` binden und keinen eigenen Listener auf 443 betreiben.
- `127.0.0.1` als vertrauenswürdigen Proxy eintragen, damit Stalwart die echte Client-IP sieht.
  Die Bezeichnung der Einstellung hängt von der Version ab.

**TLS-Zertifikat für SMTP/IMAP:** Stalwart braucht ein Zertifikat für `mail.example.com`, kann
es aber nicht über den belegten Port 443 holen. Zwei Wege:
- **Empfohlen: DNS-01.** Im Einrichtungsassistenten einen unterstützten DNS-Anbieter mit API
  wählen; die Liste steht in der Stalwart-Doku, die DNS-Dienste mancher Hoster sind kostenlos.
  Stalwart holt und erneuert das Zertifikat dann selbst, ohne offenen Port.
- **Alternative:** Der Webserver holt das Zertifikat für `mail.…`, Stalwart liest es aus dessen
  Ablage. Das braucht Leserechte für den Stalwart-Benutzer und ein Neuladen nach jeder
  Erneuerung (alle 60–90 Tage), ist also fehleranfälliger.

### Domain, Konten, Aliase

1. **Domain** `example.com` anlegen. Stalwart zeigt dann die nötigen DNS-Einträge, vor allem den
   DKIM-Schlüssel. Diese **vor dem ersten Versand** veröffentlichen.
2. **Konten:**
   - `hallo@` – Ihr Postfach
   - `formular@` – **nur** für die Website: eigenes, langes Zufallspasswort, nicht für Menschen
     gedacht. Bei Bedarf weitere Postfächer, unbegrenzt.
3. **Aliase** auf `hallo@`: `postmaster@`, `abuse@` (von RFC 2142 erwartet) und `dmarc@`
   (DMARC-Berichte).
4. **Spamfilter:** Stalwart bringt ihn mit (DNS-Blocklisten, Greylisting, Klassifikator). Die
   Standardwerte reichen für den Anfang.
5. **Protokoll-Aufbewahrung:** begrenzen, z. B. 14 Tage. Den Wert in
   `content/site.json › hosting.mailLogRetention` eintragen; er steht in der
   Datenschutzerklärung.
6. **MTA-STS und TLS-RPT** einschalten und die angezeigten Einträge veröffentlichen.

## 4. Formular anbinden

Im privaten Ordner auf dem Server (`/srv/mindcoded/private/contact-config.php`, Rechte 600,
Vorlage [contact-config.example.php](contact-config.example.php)):

| Schlüssel | Wert |
|---|---|
| `to` | `hallo@<domain>` |
| `from` | `formular@<domain>` |
| `transport` | `smtp` |
| `smtp_host` | `mail.<domain>` (muss zum Zertifikat passen) |
| `smtp_port` / `smtp_security` | `465` / `tls` |
| `smtp_user` | `formular@<domain>` |
| `smtp_password` | das Zufallspasswort des Kontos – nur hier, nie im Repository |

Prüfen und testen, als Benutzer der Website:

```sh
sudo -u mindcoded env MC_PRIVATE_DIR=/srv/mindcoded/private php /srv/mindcoded/current/api/contact.php --check
sudo -u mindcoded env MC_PRIVATE_DIR=/srv/mindcoded/private php /srv/mindcoded/current/api/contact.php --send-test
```

`--send-test` meldet bei Problemen den genauen Schritt, etwa `smtp:auth:535` (Passwort falsch)
oder `smtp:connect_failed` (Host, Port oder Firewall).

**So ist die Nachricht aufgebaut** (`api/lib/message.php`):
- **Absender:** immer `formular@`, nie die Adresse des Besuchers. Sonst scheitert DMARC.
- **»Antworten«:** geht an den Besucher.
- **Kopfzeilen:** Message-ID mit Ihrer Domain und `Auto-Submitted: auto-generated`, damit keine
  Abwesenheitsnotizen zurückkommen.
- **Erfolg:** meldet das Formular nur, wenn Stalwart die Nachricht angenommen hat. Fehler landen
  in `zustellfehler.log`, und die stündliche Wartung meldet sie.

## 5. Mailprogramme

| | Server | Port | Verschlüsselung | Benutzer |
|---|---|---|---|---|
| Empfang (IMAP) | `mail.<domain>` | 993 | SSL/TLS | volle Adresse |
| Versand (SMTP) | `mail.<domain>` | 465 | SSL/TLS | volle Adresse |

Mit den `autoconfig`-Einträgen finden Thunderbird, Apple Mail und Outlook das meist selbst.
Stalwart unterstützt außerdem JMAP. Einen vollwertigen Webmailer bringt Stalwart nach Stand
dieser Recherche nicht mit; bei Bedarf lässt sich einer ergänzen, etwa SnappyMail oder
Roundcube.

## 6. Zustellbarkeit der eigenen Mails

- **Test:**
  - Eine Mail an die Prüfadresse von [mail-tester.com](https://www.mail-tester.com) senden; Ziel ist 10/10.
  - Eine Mail an ein Gmail-Konto senden und dort »Original anzeigen« öffnen: SPF, DKIM und DMARC müssen **PASS** zeigen.
- **Anmelden bei** [Google Postmaster Tools](https://postmaster.google.com) und Microsoft SNDS:
  Dort sehen Sie, wie die großen Anbieter Ihre Domain bewerten.
- **Neue IP »aufwärmen«:** In den ersten Wochen normal und in kleinen Mengen schreiben, keine
  Massenmails.
- **Wenn Port 25 gesperrt bleibt** oder einzelne Anbieter Mails ablehnen: Für ausgehende Mails
  lässt sich ein SMTP-Relay als »Smarthost« eintragen. Das ist meist kostenpflichtig; kleine
  Mengen sind teils gratis. Formular und Empfang bleiben davon unberührt.

## 7. Betrieb

| Wann | Was |
|---|---|
| automatisch | Sicherheitsupdates des Systems (unattended-upgrades), Zertifikate, Formular-Wartung (Timer) |
| monatlich | Stalwart-Update nach den Release-Notes; das Konfigurationsformat hat sich zwischen Versionen schon geändert |
| monatlich | DMARC-Berichte ansehen, `systemctl --failed`, freier Speicher |
| vierteljährlich | Wiederherstellung aus dem Backup testen |

**Backup:** `/var/lib/stalwart/` (Postfächer) und `/etc/stalwart/` täglich auf einen anderen
Speicherort, z. B. mit restic oder borg. Snapshots des Anbieters sind eine gute Ergänzung, aber
kein Ersatz.

## Quellen

- Stalwart: [Installation unter Linux](https://www.stalw.art/docs/install/platform/linux), [Projekt auf GitHub](https://github.com/stalwartlabs/mail-server)
- RFC 8314 (TLS für Einlieferung), RFC 6409 (Mail-Einlieferung), RFC 3834 (automatische Antworten), RFC 2142 (postmaster, abuse)
- Port-25-Sperren bei Cloud-Anbietern: z. B. [Hetzner-FAQ, zitiert im Discourse-Forum](https://meta.discourse.org/t/ports-blocked-hetzner-cloud-server/225146)
