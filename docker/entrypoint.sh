#!/bin/sh
# Start im Container: PHP-FPM (Formular) im Hintergrund, stündliche Wartung, Caddy im Vordergrund.
set -eu

php-fpm --daemonize

# Wartung wie der systemd-Timer auf dem VPS: Prüfwerte löschen, Zustellfehler melden (Exit 2 → Log)
(
    while sleep 3600; do
        php /srv/www/api/contact.php --cleanup || echo "contact cleanup: exit $?" >&2
    done
) &

exec caddy run --config /etc/caddy/Caddyfile --adapter caddyfile
