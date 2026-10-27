# Eigener Server (VPS): Einrichtung und Betrieb

Stand: 19.10.2026. Website und Mailserver laufen auf einem VPS. Der Release-Build erzeugt alle
Konfigurationsdateien in `dist-server/`, abgeleitet aus `content/site.json › server` und denselben
Sicherheitsregeln wie die Website. Der Mailserver ist in [E-MAIL.md](E-MAIL.md) beschrieben.

Beispiele gehen von Debian 12 oder Ubuntu 24.04 aus, mit Benutzer `mindcoded` und Basisordner
`/srv/mindcoded`; beides ist in `site.json › server` einstellbar.

## Aufbau

```
/srv/mindcoded/
├── releases/20261019-120000/   je Veröffentlichung ein Ordner (die letzten 5 bleiben)
├── current → releases/…        Symlink auf den aktiven Release = Webroot
└── private/                    contact-config.php, ratelimit/, zustellfehler.log (Rechte 700)

Caddy (443) ──▶ /srv/mindcoded/current        statische Dateien
            ──▶ PHP-FPM-Pool »mindcoded«      nur /api/contact.php
            ──▶ 127.0.0.1:8080                Stalwart-Weboberfläche (mail.…)
Stalwart    ◀── 25, 465, 587, 993             Mail
```

## 1. Grundsicherung

```sh
sudo apt update && sudo apt full-upgrade
sudo apt install unattended-upgrades && sudo dpkg-reconfigure -plow unattended-upgrades
```

**SSH nur mit Schlüssel:**
- In `/etc/ssh/sshd_config` setzen: `PasswordAuthentication no` und `PermitRootLogin no`.
- Vorher einen eigenen Schlüssel hinterlegen und die Anmeldung testen.
- Unter Windows: `ssh-keygen -t ed25519` erzeugt den Schlüssel, der öffentliche Teil kommt nach
  `~/.ssh/authorized_keys`.

**Firewall** (Beispiel `ufw`): Port 8080 bleibt zu.

```sh
sudo ufw allow OpenSSH
sudo ufw allow 80,443/tcp          # Website, Zertifikate
sudo ufw allow 25,465,587,993/tcp  # Mail
sudo ufw enable
```

## 2. Benutzer, Ordner, PHP

```sh
sudo adduser --disabled-password --gecos "" mindcoded
sudo mkdir -p /srv/mindcoded/releases /srv/mindcoded/private
sudo chown -R mindcoded:mindcoded /srv/mindcoded
sudo chmod 700 /srv/mindcoded/private
sudo apt install php-fpm php-cli php-mbstring
```

Die PHP-Version hängt vom System ab: Debian 12 bringt 8.2 mit, Ubuntu 24.04 bringt 8.3. Den Wert
in `content/site.json › server.phpVersion` eintragen und neu bauen. Danach den Pool einspielen:

```sh
sudo cp dist-server/php-fpm/mindcoded.conf /etc/php/8.3/fpm/pool.d/
# bei Caddy: listen.owner und listen.group auf caddy ändern
sudo systemctl reload php8.3-fpm
```

**Was der Pool absichert:**
- PHP läuft nur für das Formular.
- PHP läuft unter eigenem Benutzer.
- Dateizugriffe sind auf `/srv/mindcoded/` begrenzt.
- Shell-Funktionen und `allow_url_fopen` sind aus.
- Datei-Uploads sind aus, Anfragen sind auf 32 KB begrenzt.

## 3. Webserver – empfohlen Caddy

Caddy holt HTTPS-Zertifikate selbst, unterstützt HTTP/3 und kommt mit kurzer Konfiguration aus.
Installation nach [caddyserver.com/docs/install](https://caddyserver.com/docs/install), danach:

```sh
sudo cp dist-server/Caddyfile /etc/caddy/Caddyfile
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

Alternativ nginx (`dist-server/nginx/`, Zertifikate mit certbot) oder Apache
(`dist-server/apache/`; die `.htaccess` im Webroot gilt dort weiter). Alle drei setzen dieselben
Sicherheits-Header, sperren interne Dateien und führen PHP nur für `/api/contact.php` aus.

**Logs:** Caddy behält Zugriffsprotokolle 7 Tage (`roll_keep_for 168h`). Den Wert als »für sieben
Tage« in `site.json › hosting.logRetention` eintragen; er steht in der Datenschutzerklärung.

## 4. Veröffentlichen

Vom eigenen Rechner, mit SSH-Schlüssel für den Benutzer `mindcoded`:

```powershell
python tools/build.py --release
python tools/deploy.py --ssh mindcoded@<server> --dry-run
python tools/deploy.py --ssh mindcoded@<server>
```

**Was dabei passiert:**
1. Das Skript prüft vorher (`check.py --fast`).
2. Es überträgt den Release als Archiv in einen neuen Ordner.
3. Es prüft, ob `index.html` vorhanden ist.
4. Erst dann schaltet es `current` atomar um. Besucher sehen nie einen halben Stand.
5. Ist etwas schiefgegangen, holt `--rollback` den vorherigen Release in Sekunden zurück.

## 5. Formular und Wartung

1. `/srv/mindcoded/private/contact-config.php` anlegen (Rechte 600, Eigentümer `mindcoded`);
   die Werte stehen in [E-MAIL.md](E-MAIL.md), Abschnitt 4.
2. Prüfen: `sudo -u mindcoded env MC_PRIVATE_DIR=/srv/mindcoded/private php /srv/mindcoded/current/api/contact.php --check`
3. Testen: wie oben mit `--send-test`.
4. Stündliche Wartung einschalten:
   ```sh
   sudo cp dist-server/systemd/mindcoded-contact-cleanup.* /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl enable --now mindcoded-contact-cleanup.timer
   ```
   Werden Anfragen nicht zugestellt, endet der Lauf mit Exit-Code 2 und erscheint in
   `systemctl --failed`. Details: `journalctl -u mindcoded-contact-cleanup`.

Den echten Endpunkt kann man auch direkt auf dem VPS testen. Im ausgecheckten Projekt
`python3 tools/php_test.py` ausführen: lokal, ohne Mailversand nach außen.

## 6. Betrieb

| Wann | Was |
|---|---|
| automatisch | Sicherheitsupdates, Zertifikate (Caddy), Formular-Wartung (Timer) |
| monatlich | `apt full-upgrade` und Neustart bei Kernel-Updates; `systemctl --failed`; freier Speicher (`df -h`) |
| vierteljährlich | Backup-Wiederherstellung testen |

**Backup:** `/srv/mindcoded/private`, `/etc/caddy` und die Stalwart-Daten (siehe
[E-MAIL.md](E-MAIL.md)). Die Website selbst lässt sich jederzeit neu bauen und muss nicht
gesichert werden.

**Erreichbarkeit überwachen** (optional): Einen externen Uptime-Dienst, viele haben kostenlose
Tarife, die Startseite und `https://<domain>/api/contact.php` abfragen lassen. Die Formularadresse
antwortet auf GET bewusst mit 405; das zeigt, dass PHP läuft.
