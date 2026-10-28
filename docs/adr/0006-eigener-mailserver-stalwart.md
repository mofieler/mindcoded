# 0006 – Eigener Mailserver (Stalwart) auf dem VPS, Formular per SMTP

- **Status:** angenommen (löst [0003](0003-versand-ueber-mailserver-des-hosters.md) ab)
- **Datum:** 2026-10-19
- **Beteiligte:** Betreiber (Vorgaben: eigener Server, möglichst dauerhaft kostenlos, erweiterbar, eigene Domain), Entwicklung

## Kontext

Die Website läuft auf einem eigenen VPS, nicht auf einem Webhosting-Paket. Damit fehlt der
Mailserver, den ADR 0003 voraussetzte. Ein Postfach unter der eigenen Domain gibt es noch nicht.
Das Formular soll E-Mails selbst versenden statt über Resend: keine laufenden Kosten, keine
weiteren Empfänger der Formulardaten. Die Mails sollen signiert sein und nicht im Spam landen.

## Entscheidungstreiber

- Keine laufenden Kosten
- Keine Formulardaten bei Dritten (Datenschutz, keine Drittlandübermittlung)
- Erweiterbar: beliebig viele Adressen und Domains, Standardprotokolle (IMAP, SMTP, JMAP)
- Vertretbarer Betriebsaufwand auf vorhandener Hardware
- Formular meldet nur Erfolg, wenn die Nachricht wirklich angenommen wurde

## Optionen

1. **Stalwart auf dem VPS** – ein Programm für SMTP, IMAP, JMAP, Spamfilter und DKIM; Lizenz 0 €;
   etwa 1–2 GB RAM.
2. **Mailcow auf dem VPS** – ausgereifte Komplettlösung mit Webmail und Groupware; braucht
   6–8 GB RAM und mehr Wartung.
3. **Zoho Mail Free** – kein Betrieb nötig, aber im Gratis-Tarif ohne IMAP/SMTP. Der Anbieter kann
   die Bedingungen ändern, und das Formular bräuchte trotzdem einen eigenen Versandweg.
4. **Kleiner Bezahl-Anbieter** (z. B. mailbox.org, Migadu) – beste Zustellbarkeit ohne Betrieb,
   ab etwa 20–40 € im Jahr.
5. **Weiter mit Resend** – zusätzlicher Auftragsverarbeiter in den USA, API-Schlüssel nötig.

## Entscheidung

Gewählt: Option 1.
- Sie ist die einzige Option, die dauerhaft kostenlos ist, Formulardaten auf eigener Hardware
  hält und ohne Grenzen erweiterbar bleibt.
- Der Ressourcenbedarf passt zu einem kleinen VPS.

Umsetzung:
- **Versand:** Das Formular liefert per SMTP (Port 465, TLS mit geprüftem Zertifikat, Anmeldung
  mit eigenem Konto `formular@`) an Stalwart. Implementiert ist das ohne Fremdbibliothek in
  `api/lib/smtp.php`.
- **Code:** Der Resend-Weg ist entfernt.
- **Datenschutzerklärung:** Sie beschreibt den eigenen Mailserver
  (`content/site.json › contact.mailServer = "own"`).

## Konsequenzen

- **Gut:**
  - Keine laufenden Kosten und keine Dritten im Formularweg.
  - Formular-Mails an das eigene Postfach werden lokal zugestellt und sind damit unabhängig von IP-Ruf und Spamfiltern. Die Eingangsbestätigung an die anfragende Person (0009) ist dagegen ausgehende Mail und braucht Port 25 sowie einen sauberen IP-Ruf.
    anderer Anbieter.
- **Gut:** Beliebig viele Postfächer, Aliase und weitere Domains ohne Mehrkosten.
- **Gut:** Das Formular kennt Erfolg nur als »vom Server angenommen«. Fehler werden protokolliert,
  und die Wartung meldet sie.
- **Schlecht:** Der Betreiber ist Mail-Administrator: Updates, Backups, DNS (SPF, DKIM, DMARC,
  PTR) und Überwachung von Blocklisten.
- **Schlecht:** Port 443 wird mit der Website geteilt. Das Zertifikat für SMTP/IMAP kommt deshalb
  per DNS-01 oder aus der Ablage des Webservers (docs/E-MAIL.md).
- **Restrisiko:** Wie gut eigene ausgehende Mails ankommen, hängt vom Ruf der VPS-IP ab und davon,
  ob der Anbieter Port 25 freigibt. Ausweg ohne Änderung am Formular: ein SMTP-Relay nur für
  ausgehende Mails.
- **Restrisiko:** Der PHP-SMTP-Client ist statisch geprüft und hat einen vorbereiteten
  Ende-zu-Ende-Test (`tools/php_test.py` mit lokalem Test-Mailserver). Ausgeführt ist er erst,
  wenn PHP verfügbar ist.
