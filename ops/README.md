# Betrieb des VPS (`ops/`)

Skripte und Zeitpläne, die auf dem Server laufen. Das Repo ist die Quelle; geändert wird hier, eingespielt mit:

```bash
scp -r ops mindcoded:/root/ && ssh mindcoded 'bash /root/ops/install.sh'
```

Geheimnisse liegen **nie** im Repo (es ist öffentlich), sondern nur auf dem Server bzw. im Passwort-Manager.

| Datei | Aufgabe | Zeitplan |
|---|---|---|
| `bin/mc-backup` | verschlüsseltes Backup mit restic nach Backblaze B2 (Datenbank-Dumps, Stalwart, Website-Daten, Coolify-Konfiguration); Aufbewahrung 7 Tage / 4 Wochen / 6 Monate; sonntags Stichprobe der Daten | täglich 03:15 UTC |
| `bin/mc-weekly-report` | Wochenbericht an hallo@: Besucherzahlen aus Umami, Weg zur Anfrage, Herkunft, Server-Gesundheit (Backups, Platz, Erreichbarkeit, Formular, Zertifikate, Domain, Software-Versionen) | Freitag 16:00 Berlin |
| `bin/mc-alert` | Mail an hallo@, wenn ein Dienst fehlschlägt (`OnFailure=` in den Units) | bei Fehler |
| `bin/mc-restic` | restic mit den Backup-Zugangsdaten, z. B. `mc-restic snapshots` | von Hand |
| `apt/52unattended-reboot` | Sicherheitsupdates mit automatischem Neustart, nur wenn nötig | 04:00 UTC |
| `traefik/mc-coolify-dashboard.yaml` | Route zur Coolify-Oberfläche, die Coolify nicht verwaltet – Coolify löschte seine `coolify.yaml` beim Proxy-Neustart (28.10.2026), die Oberfläche lieferte 503 | dauerhaft |
| `monitor.py` | Prüfung von außen (GitHub Actions, `.github/workflows/monitor.yml`): Seiten, Formular, Coolify, MTA-STS, TLS von SMTP/IMAP | alle 15 Min. |

Test des Berichts ohne Versand: `ssh mindcoded 'mc-weekly-report --dry-run' > bericht.html`

## Backup-Zugangsdaten (einmalig von Hand)

Datei `/root/.config/mc-backup.env` (Rechte 600) mit `B2_ACCOUNT_ID`, `B2_ACCOUNT_KEY` (Application Key nur für den
Bucket), `RESTIC_REPOSITORY=b2:mindcoded-vps-backup-8689a6:vps` und `RESTIC_PASSWORD`. Das Passwort steht zusätzlich
in Bitwarden („Backup restic“) – ohne es ist kein Backup lesbar. Einen neuen B2-Schlüssel gibt es jederzeit in der
Backblaze-Oberfläche unter *Application Keys*.

Kosten: keine. Backblaze-Obergrenzen stehen auf 0 $ (Warnung per Mail bei 75 % und 100 %), Hetzner warnt ab 20 €/Monat.

Wiederherstellen: [docs/NOTFALL.md](../docs/NOTFALL.md).
