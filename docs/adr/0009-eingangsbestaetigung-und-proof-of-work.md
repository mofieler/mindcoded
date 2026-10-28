# 0009 – Eingangsbestätigung und Spam-Schutz per Rechenaufgabe

- **Status:** angenommen (ergänzt 0002)
- **Datum:** 2026-10-28
- **Beteiligte:** Betreiber, Entwicklung

## Kontext

Anfragende sollen eine Bestätigung bekommen, dass ihre Nachricht angekommen ist. Das alte Projekt (Nuxt) nutzte dafür Double-Opt-in mit Google reCAPTCHA und Resend. Seit 0006 versendet der eigene Mailserver. Eine automatische Mail an eine Adresse, die jemand ins Formular tippt, geht an eine **ungeprüfte** Adresse. Dafür gibt es zwei Risiken: unerwünschte Werbung (BGH VI ZR 134/15) und Missbrauch des Formulars, um fremde Texte an fremde Adressen zu schicken.

## Entscheidungstreiber

- Keine verlorenen Anfragen
- Rechtssicher: Für Kontaktformulare gibt es in Deutschland keine Double-Opt-in-Pflicht (die gilt für Werbe-Einwilligungen, UWG § 7). Automatische Mails dürfen keine Werbung enthalten.
- Keine Dritten, keine Cookies, kein Einwilligungsbanner
- Barrierefrei: keine Bilder- oder Texträtsel
- Keine neue Abhängigkeit (kein Node-Build, keine Fremdbibliothek)

## Optionen

1. **Double-Opt-in mit Link:** Die Anfrage wird erst nach dem Klick zugestellt. Sie muss bis dahin auf dem Server liegen, und nicht bestätigte Anfragen gehen verloren. Die Bestätigungsmail geht trotzdem an eine ungeprüfte Adresse, das Risiko sinkt also nicht.
2. **Sofort zustellen und eine werbefreie Eingangsbestätigung ohne Formularinhalte senden**, geschützt durch eine Rechenaufgabe im Browser.
3. **Google reCAPTCHA oder Cloudflare Turnstile:** Daten gehen an einen Dienst in den USA. Das braucht eine Einwilligung und ein Konto; ohne Zustimmung ist das Formular nicht nutzbar.

## Entscheidung

Gewählt: Option 2.

**Spam-Schutz:** Eine Rechenaufgabe (Proof-of-Work) nach dem ALTCHA-Protokoll, selbst umgesetzt.
- `api/lib/challenge.php` stellt die Aufgabe und signiert sie per HMAC. Der Schlüssel liegt im privaten Ordner, die Aufgabe ist 10 Minuten gültig.
- `assets/pow.js` und `assets/pow-worker.js` lösen sie im Hintergrund, sobald jemand das Formular benutzt.
- Jede Lösung gilt nur einmal.
- Ohne gültige Lösung antwortet der Server mit `422 challenge` und stellt nichts zu.
- Honeypot, Zeitfalle, Herkunftsprüfung und Rate-Limit bleiben bestehen.

**Eingangsbestätigung:** Sie geht erst raus, nachdem die Anfrage zugestellt ist.
- DE oder EN nach der Sprache des Formulars, `Auto-Submitted: auto-replied`, Antworten gehen an das Studio.
- **Keine Werbung und keine Formularinhalte, auch nicht der Name.** Dadurch ist das Formular als Relais für fremde Texte wertlos.
- Scheitert sie, wird das nur protokolliert, die Anfrage gilt trotzdem als angekommen.

**Gestaltung:** Benachrichtigung und Bestätigung sind HTML mit Textfassung (multipart/alternative). `tools/mcsite/mail.py` erzeugt sie aus den Design-Tokens und `content/*.json › contact.mail` und schreibt sie nach `api/mail-templates.php`. PHP setzt nur noch die escapten Werte ein.

## Konsequenzen

- Gut: Keine Anfrage geht verloren, keine Zwischenspeicherung von Anfragen, keine Dritten, kein Cookie-Banner.
- Gut: Mails sehen aus wie die Website. Farben, Schriften und Texte haben eine Quelle, und Tests prüfen, dass nur Token-Farben vorkommen.
- Schlecht: Ohne JavaScript lässt sich das Formular nicht mehr absenden. Die Fehlerseite und der mailto-Ausweg bleiben als Alternative.
- Schlecht: Die Eingangsbestätigung ist ausgehende Mail an fremde Server. Sie hängt vom IP-Ruf des VPS und von der Freigabe von Port 25 bei Hetzner ab (0006).
- Restrisiko: Proof-of-Work bremst Masseneinsendungen, verhindert gezielten Missbrauch aber nicht. Rate-Limit und Honeypot bleiben deshalb nötig. Die Schwierigkeit (`content/site.json › contact.challenge.maxNumber`) lässt sich anheben.
