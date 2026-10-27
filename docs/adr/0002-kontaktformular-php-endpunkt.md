# 0002 – Kontaktformular über eigenen PHP-Endpunkt

- **Status:** angenommen
- **Datum:** 2026-10-19
- **Beteiligte:** Betreiber (Hosting-Entscheidung), Entwicklung

## Kontext

Das Formular zeigte eine Erfolgsmeldung, ohne Daten zu übermitteln – Anfragen gingen verloren (Arbeitsauftrag Punkt 1). Gehostet wird auf klassischem PHP-Webhosting. Geheimnisse dürfen nicht in den Client oder ins Repository gelangen; die Datenschutzerklärung muss den tatsächlichen Datenfluss beschreiben.

## Entscheidungstreiber

- Erfolgsmeldung nur nach bestätigtem Versand
- Serverseitige Prüfung, Spam-Schutz ohne Captcha, Rate-Limit
- Möglichst wenige Empfänger personenbezogener Daten (DSGVO)
- Läuft auf üblichem PHP-Hosting ohne Composer oder Zusatzdienste
- Formular funktioniert auch ohne JavaScript

## Optionen

1. **Eigenes `api/contact.php` ohne Fremdbibliotheken** – Versand über den Mailserver des Hosters oder optional die Resend-API.
2. **Formspree o. ä.** – kein Servercode, aber zusätzlicher Empfänger in den USA, Abhängigkeit von Kontingenten.
3. **Serverless-Funktion (Netlify, Cloudflare)** – passt nicht zum gewählten PHP-Hosting; lokaler Test bräuchte Node.js.

## Entscheidung

Gewählt: Option 1, weil sie zum Hosting passt, ohne weitere Auftragsverarbeiter auskommt (Standard-Versand über den Hoster) und alle Schutzmaßnahmen serverseitig umsetzt: Herkunftsprüfung (Origin und Sec-Fetch-Site, `Origin: null` wird abgelehnt), Größenlimit, Rate-Limit mit gehashter IP (IPv6 je /64) und täglich neu erzeugtem Zufallsschlüssel, Honeypot, Zeitfalle über die im Browser gemessene Ausfülldauer, Validierung und Schutz vor Header-Injection. Weicht der konfigurierte Versandweg von dem in `content/site.json` ab, den die Datenschutzerklärung beschreibt, verweigert der Endpunkt den Versand. Zugangsdaten kommen aus Umgebungsvariablen oder einer Datei außerhalb des Webroots. Ohne JavaScript leitet der Endpunkt auf Danke- bzw. Fehlerseiten weiter (Post/Redirect/Get).

## Konsequenzen

- Gut: Keine Erfolgsmeldung ohne Versand; Fehler zeigen eine verständliche Meldung, die Eingaben bleiben erhalten.
- Gut: Formularregeln (Grenzen, Themen) entstehen aus `content/*.json` und gelten gleich in Browser, PHP und lokalem Mock.
- Schlecht: PHP `mail()` hängt von der Zustellqualität des Hosters ab (SPF/DKIM der Absenderdomain nötig).
- Schlecht: Der lokale Mock prüft den Vertrag, nicht den PHP-Code selbst; der echte Endpunkt braucht einen Test mit PHP (siehe README).
- Restrisiko: Das Rate-Limit speichert Prüfwerte als Dateien; für die zugesagte Löschung nach spätestens 24 Stunden muss der Cron-Job `php contact.php --cleanup` eingerichtet sein.
