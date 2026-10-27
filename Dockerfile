# mindcoded.studio – Image für Coolify (Traefik davor übernimmt TLS).
# Stufe 1 baut den Release (Python, nur Standardbibliothek), Stufe 2 liefert ihn mit Caddy aus;
# PHP-FPM läuft nur für das Kontaktformular. Konfiguration: dist-server/container/ (vom Build erzeugt).
# Laufzeit-Variablen (in Coolify setzen): MC_CONTACT_TO, MC_CONTACT_FROM, MC_SMTP_HOST, MC_SMTP_PORT,
# MC_SMTP_SECURITY, MC_SMTP_USER, MC_SMTP_PASSWORD – siehe docs/contact-config.example.php.
# Dauerhaftes Volume: /srv/private (Prüfwerte des Rate-Limits, Zustellfehler).

FROM python:3.13-alpine AS build
WORKDIR /src
COPY . .
RUN python tools/build.py --release

FROM caddy:2.10-alpine AS caddy

FROM php:8.3-fpm-alpine
# tini räumt beendete Kindprozesse ab (stündliche Wartung, Healthcheck) – keine Zombies
RUN apk add --no-cache tini \
    && rm -f /usr/local/etc/php-fpm.d/*.conf \
    && mkdir -p /srv/private /tmp/caddy \
    && chown www-data:www-data /srv/private /tmp/caddy \
    && chmod 700 /srv/private
COPY --from=caddy /usr/bin/caddy /usr/bin/caddy
COPY --from=build /src/dist-server/container/php-fpm.conf /usr/local/etc/php-fpm.d/mindcoded.conf
COPY --from=build /src/dist-server/container/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /src/dist /srv/www
COPY docker/entrypoint.sh /usr/local/bin/mindcoded-entrypoint

ENV MC_PRIVATE_DIR=/srv/private \
    XDG_CONFIG_HOME=/tmp/caddy \
    XDG_DATA_HOME=/tmp/caddy
VOLUME ["/srv/private"]
USER www-data
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1:8080/ && kill -0 "$(cat /tmp/php-fpm.pid)" || exit 1

ENTRYPOINT ["/sbin/tini", "--", "sh", "/usr/local/bin/mindcoded-entrypoint"]
