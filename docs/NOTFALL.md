# Notfall: Server wiederherstellen

Was tun, wenn der VPS kaputt, gelöscht oder kompromittiert ist. Ziel: Website und Mail in etwa einer Stunde zurück.

## Was wo liegt

| Was | Wo |
|---|---|
| Website-Code | GitHub `mofieler/mindcoded` (Branch `main`) |
| Datenbanken, Postfächer, Formular-Daten, Coolify-Konfiguration | nächtliches Backup in Backblaze B2, Bucket `mindcoded-vps-backup-8689a6`, Pfad `vps` |
| Backup-Passwort, Zugänge (Hetzner, Porkbun, Backblaze, Stalwart, Umami) | Bitwarden |
| DNS | Porkbun (Stalwart pflegt die Mail-Einträge selbst über die Porkbun-API) |
| Betriebs-Skripte | `ops/` in diesem Repo |

## Ablauf

1. **Neuen Server** bei Hetzner anlegen (Ubuntu 24.04, gleiche Größe, Standort Nürnberg), Firewall `mindcoded-web`
   zuweisen, eigenen SSH-Schlüssel hinterlegen. Bei kompromittiertem Server: alle Passwörter und Schlüssel neu.
2. **Coolify installieren** (offizielles Installationsskript, siehe coolify.io/docs). Die IP in Porkbun bei allen
   A-Einträgen (`@`, `www`, `mail`, `stats`, `mta-sts`, `autoconfig`, `autodiscover`) auf den neuen Server ändern.
3. **Backup holen:**
   ```bash
   apt install -y restic
   export B2_ACCOUNT_ID=…  B2_ACCOUNT_KEY=…   # neuen Schlüssel in Backblaze anlegen
   export RESTIC_REPOSITORY=b2:mindcoded-vps-backup-8689a6:vps  RESTIC_PASSWORD=…   # aus Bitwarden
   restic snapshots && restic restore latest --target /root/r
   ```
4. **Dienste in Coolify neu anlegen** – gleiche Namen wie bisher:
   - Website: Anwendung aus GitHub, Dockerfile, Domains `mindcoded.studio`, `www.…`; Umgebungsvariablen `MC_*`
     (SMTP-Passwort für `formular@` in Stalwart neu setzen). Formular-Daten zurück:
     `/root/r/var/lib/docker/volumes/*-mindcoded-private/_data` in das neue Volume kopieren.
   - Stalwart: Dienst „Stalwart“ mit Image `stalwartlabs/stalwart:v1.0`, Ports 25/465/587/993, Domains
     `mail.…` und `mta-sts.…`. Vor dem ersten Start `/root/r/var/backups/mc-stage/stalwart/data/*` in das
     Daten-Volume und `…/stalwart/etc/*` in das Konfig-Volume kopieren – Konten, Mails und Einstellungen sind dann da.
   - Umami: Dienst „Umami“, danach den Dump einspielen:
     `zcat /root/r/var/backups/mc-stage/db/postgresql-*.sql.gz | docker exec -i <postgres-container> psql -U <user>`
5. **Betrieb einspielen:** `ops/install.sh` (siehe [ops/README.md](../ops/README.md)) und die Backup-Zugangsdaten anlegen.
6. **Prüfen:** Website, Formular (Testanfrage), Mail senden/empfangen, `mc-weekly-report --dry-run`.

## Wenn nur ein Teil kaputt ist

- **Website:** in Coolify neu deployen; letzter funktionierender Commit über *Rollback*.
- **Coolify-Oberfläche zeigt 503:** Route fehlt – `ops/traefik/mc-coolify-dashboard.yaml` nach
  `/data/coolify/proxy/dynamic/` kopieren (wirkt sofort).
- **Mail-Verwaltung zeigt 502:** Stalwart hat vermutlich den Proxy gesperrt – in Stalwart unter
  Settings › Security › Blocked IPs entsperren; `10.0.4.0/24` muss unter Allowed IPs stehen.
- **Einzelne Datei aus dem Backup:** `mc-restic restore latest --target /tmp/r --include <pfad>`.
