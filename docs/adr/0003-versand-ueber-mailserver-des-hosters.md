# 0003 – Standard-Versand über den Mailserver des Hosters

- **Status:** abgelöst durch [0006](0006-eigener-mailserver-stalwart.md) – die Website läuft auf einem eigenen VPS mit eigenem Mailserver; der Resend-Weg ist entfernt
- **Datum:** 2026-10-19
- **Beteiligte:** Betreiber (Zustimmung offen), Entwicklung

## Kontext

`api/contact.php` kann Anfragen über PHP `mail()` (Mailserver des Hosters) oder über die Resend-API versenden (ADR 0002). Die Wahl bestimmt, welche Dienstleister Formulardaten erhalten und was die Datenschutzerklärung beschreiben muss.

## Entscheidungstreiber

- Datensparsamkeit: möglichst wenige Empfänger, keine Drittlandübermittlung
- Zuverlässige Zustellung
- Kein zusätzlicher Vertrag, kein API-Schlüssel nötig

## Optionen

1. **`mail` (Hoster)** – keine weiteren Empfänger; Zustellung abhängig von SPF/DKIM-Einrichtung beim Hoster.
2. **`resend`** – gute Zustellung und Protokolle; zusätzlicher Auftragsverarbeiter in den USA, API-Schlüssel und Domain-Verifizierung nötig.

## Entscheidung

Vorgeschlagen: Option 1 als Standard (`content/site.json › contact.transport = "mail"`), weil sie ohne weitere Empfänger und ohne Drittlandübermittlung auskommt. Option 2 bleibt per Konfiguration verfügbar; der Build tauscht dann den Absatz in der Datenschutzerklärung automatisch aus und verlangt die Angabe der Übermittlungsgrundlage.

## Konsequenzen

- Gut: Datenschutzerklärung bleibt schlank; keine Geheimnisse außer Postfach-Adressen nötig.
- Schlecht: Zustellprobleme fallen erst auf, wenn Anfragen fehlen – nach dem Livegang ein Testversand und eine Prüfung der Spam-Ordner sind Pflicht.
- Restrisiko: Manche Hoster verbieten den Envelope-Sender (`-f`); dann `envelope_sender` auf `false` setzen.
