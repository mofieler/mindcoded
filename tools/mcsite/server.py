"""Serverkonfiguration für den eigenen VPS – aus denselben Quellen wie die Website.

Der Release-Build schreibt nach dist-server/ (nie in den Webroot):
  Caddyfile                     empfohlen: HTTPS automatisch, kurze Konfiguration
  nginx/mindcoded.conf          Alternative (+ nginx/security-headers.conf)
  apache/mindcoded.conf         Alternative (die .htaccess im Webroot gilt weiterhin)
  php-fpm/mindcoded.conf        PHP nur für das Formular, gehärtet
  container/                    Caddyfile und PHP-FPM für das Docker-Image (Coolify, siehe Dockerfile)
  systemd/…cleanup.service/.timer  stündliche Wartung des Formulars
  dns.txt                       DNS-Einträge für Website und eigenen Mailserver
  LIESMICH.txt                  Reihenfolge der Einrichtung (ausführlich: docs/SERVER.md)

Sicherheits-Header kommen aus common.SECURITY_HEADERS (dieselben wie .htaccess und
Entwicklungsserver), Pfade aus content/site.json › server.
"""
from __future__ import annotations

from .common import SECURITY_HEADERS, SPECULATION_RULES_FILE, SPECULATION_RULES_HEADER, SPECULATION_RULES_TYPE

HSTS = "max-age=31536000"
PHP_DISABLED = "exec,passthru,shell_exec,system,proc_open,popen,pcntl_exec"
GENERATED = "Erzeugt von tools/build.py (Release) – nicht von Hand ändern, sondern content/site.json › server bzw. tools/mcsite/server.py."
# Container für Coolify (Dockerfile im Projektordner): feste Pfade im Image
CONTAINER_PORT = 8080
CONTAINER_WEBROOT = "/srv/www"
CONTAINER_SOCKET = "/tmp/php-fpm.sock"


class ServerMixin:
    # ------------------------------------------------------------------ Grundwerte

    def server_paths(self) -> dict:
        srv = self.site["server"]
        root = srv["root"].rstrip("/")
        host = self.canonical_host()
        apex = host[4:] if host.startswith("www.") else host
        return {
            "host": host,
            "alt": apex if host.startswith("www.") else f"www.{host}",
            "apex": apex,
            "mail": f"{srv['mailHost']}.{apex}",
            "root": root,
            "webroot": f"{root}/current",
            "private": f"{root}/private",
            "user": srv["user"],
            "php": srv["phpVersion"],
            "socket": f"/run/php/{srv['user']}-fpm.sock",
        }

    def server_configs(self) -> dict[str, str]:
        p = self.server_paths()
        return {
            "Caddyfile": self.caddyfile(p),
            "nginx/mindcoded.conf": self.nginx_conf(p),
            "nginx/security-headers.conf": self.nginx_headers(),
            "apache/mindcoded.conf": self.apache_conf(p),
            "php-fpm/mindcoded.conf": self.fpm_pool(p),
            "systemd/mindcoded-contact-cleanup.service": self.cleanup_service(p),
            "systemd/mindcoded-contact-cleanup.timer": self.cleanup_timer(),
            "container/Caddyfile": self.container_caddyfile(p),
            "container/php-fpm.conf": self.container_fpm_pool(),
            "dns.txt": self.dns_records(p),
            "LIESMICH.txt": self.server_readme(p),
        }

    # ------------------------------------------------------------------ Caddy

    def caddyfile(self, p: dict) -> str:
        log = f"""
	log {{
		output file /var/log/caddy/{p['host']}.log {{
			roll_keep_for 168h
		}}
	}}"""
        return f"""# {self.brand_full} – Caddy (empfohlen). {GENERATED}
# Prüfen:  caddy validate --config /etc/caddy/Caddyfile   ·   Laden: systemctl reload caddy
# HTTPS-Zertifikate holt Caddy automatisch (Let's Encrypt) für alle Namen unten.

{p['alt']} {{
	redir https://{p['host']}{{uri}} permanent
}}

{p['host']} {{
{self.caddy_site_body(p['webroot'], p['socket'])}
{log}
}}

# Eigener Mailserver (Stalwart): Weboberfläche, JMAP und Einrichtungshilfen für Mailprogramme
# laufen hinter Caddy. Stalwart lauscht dafür nur lokal auf HTTP 8080 (docs/E-MAIL.md).
{p['mail']}, autoconfig.{p['apex']}, autodiscover.{p['apex']}, mta-sts.{p['apex']} {{
	reverse_proxy 127.0.0.1:8080
}}
"""

    def caddy_site_body(self, webroot: str, socket: str) -> str:
        """Regeln der Website – gleich für den eigenen VPS und den Container hinter Coolify."""
        headers = "\n".join(f'\t\t{name} "{value}"' for name, value in SECURITY_HEADERS.items())
        return f"""	root * {webroot}
	encode zstd gzip

	header {{
{headers}
		Strict-Transport-Security "{HSTS}"
		{SPECULATION_RULES_HEADER[0]} `{SPECULATION_RULES_HEADER[1]}`
		-Server
	}}
	@speculation path /{SPECULATION_RULES_FILE}
	header @speculation Content-Type {SPECULATION_RULES_TYPE}

	@hidden {{
		path */.*
		not path /.well-known/*
	}}
	@internal path /api/lib/* /api/contact-settings.php
	@index path_regexp index ^(.*/)index\\.html$
	@contact path /api/contact.php
	@php path *.php
	@versioned path *.css *.js *.woff2
	@media path *.png *.svg *.ico *.webp *.avif *.jpg *.jpeg
	@pages path *.html */ *.xml *.txt *.webmanifest

	# CSS/JS werden nur mit ?v=<Inhalts-Hash> eingebunden – ein Jahr unveränderlich
	header @versioned Cache-Control "public, max-age=31536000, immutable"
	header @media Cache-Control "public, max-age=2592000"
	header @pages Cache-Control "no-cache"

	# Reihenfolge wie geschrieben: erst sperren, dann Formular (PHP), dann Dateien
	route {{
		error @hidden 404
		error @internal 404
		redir @index {{re.index.1}} permanent
		request_body @contact {{
			max_size 32KB
		}}
		php_fastcgi @contact unix/{socket}
		error @php 404
		file_server
	}}

	handle_errors {{
		@notfound expression {{err.status_code}} == 404
		handle @notfound {{
			rewrite * /404.html
			file_server
		}}
		handle {{
			respond "{{err.status_code}} {{err.status_text}}"
		}}
	}}"""

    # ------------------------------------------------------------------ Container (Coolify)

    def container_caddyfile(self, p: dict) -> str:
        return f"""# {self.brand_full} – Caddy im Container hinter Coolify (Traefik). {GENERATED}
# TLS und Zertifikate übernimmt Traefik; Caddy liefert intern HTTP auf :{CONTAINER_PORT}.
# Kein Zugriffsprotokoll im Container – Docker-Logs würden sonst unbegrenzt IP-Adressen sammeln.
{{
	admin off
	auto_https off
	persist_config off
	servers {{
		# echte Besucher-IP aus X-Forwarded-For – sonst greift das Rate-Limit für alle gemeinsam
		trusted_proxies static private_ranges
		client_ip_headers X-Forwarded-For
	}}
}}

:{CONTAINER_PORT} {{
	@alt host {p['alt']}
	redir @alt https://{p['host']}{{uri}} permanent

{self.caddy_site_body(CONTAINER_WEBROOT, CONTAINER_SOCKET)}
}}
"""

    def container_fpm_pool(self) -> str:
        return f"""; {self.brand_full} – PHP-FPM im Container, nur für das Kontaktformular. {GENERATED}
; Läuft als www-data (Container ohne root). Die MC_*-Variablen kommen aus Coolify.
[global]
error_log = /proc/self/fd/2
pid = /tmp/php-fpm.pid

[mindcoded]
listen = {CONTAINER_SOCKET}
listen.mode = 0600

pm = ondemand
pm.max_children = 4
pm.process_idle_timeout = 30s
pm.max_requests = 500

; Die Umgebung des Containers enthält nur, was Coolify setzt (MC_CONTACT_TO, MC_SMTP_… usw.)
clear_env = no
catch_workers_output = yes

; Härtung: nur, was das Formular braucht
php_admin_value[open_basedir] = /srv/
php_admin_value[disable_functions] = {PHP_DISABLED}
php_admin_flag[allow_url_fopen] = off
php_admin_flag[display_errors] = off
php_admin_flag[log_errors] = on
php_admin_value[post_max_size] = 32K
php_admin_flag[file_uploads] = off
php_admin_value[max_execution_time] = 30
php_admin_value[memory_limit] = 32M
"""

    # ------------------------------------------------------------------ nginx

    def nginx_headers(self) -> str:
        lines = [f'add_header {name} "{value}" always;' for name, value in SECURITY_HEADERS.items()]
        lines.append(f'add_header Strict-Transport-Security "{HSTS}" always;')
        lines.append(f"add_header {SPECULATION_RULES_HEADER[0]} '{SPECULATION_RULES_HEADER[1]}' always;")
        return (f"# {self.brand_full} – Sicherheits-Header. {GENERATED}\n"
                "# nginx vererbt add_header nicht in Blöcke mit eigenem add_header – deshalb überall einbinden.\n"
                + "\n".join(lines) + "\n")

    def nginx_conf(self, p: dict) -> str:
        cert = f"/etc/letsencrypt/live/{p['host']}"
        return f"""# {self.brand_full} – nginx. {GENERATED}
# Zertifikate: certbot certonly --nginx -d {p['host']} -d {p['alt']} -d {p['mail']}
# Prüfen: nginx -t   ·   Laden: systemctl reload nginx
# security-headers.conf nach /etc/nginx/snippets/mindcoded-security-headers.conf kopieren.

server {{
	listen 80;
	listen [::]:80;
	server_name {p['host']} {p['alt']} {p['mail']};
	location /.well-known/acme-challenge/ {{ root /var/www/letsencrypt; }}
	location / {{ return 301 https://{p['host']}$request_uri; }}
}}

server {{
	listen 443 ssl http2;
	listen [::]:443 ssl http2;
	server_name {p['alt']};
	ssl_certificate {cert}/fullchain.pem;
	ssl_certificate_key {cert}/privkey.pem;
	return 301 https://{p['host']}$request_uri;
}}

server {{
	listen 443 ssl http2;
	listen [::]:443 ssl http2;
	server_name {p['host']};
	ssl_certificate {cert}/fullchain.pem;
	ssl_certificate_key {cert}/privkey.pem;

	root {p['webroot']};
	index index.html;
	charset utf-8;
	server_tokens off;
	access_log /var/log/nginx/{p['host']}.log;
	include snippets/mindcoded-security-headers.conf;

	gzip on;
	gzip_types text/css text/javascript application/javascript application/json image/svg+xml application/manifest+json application/xml text/plain;

	# …/index.html → …/ (nur die ursprüngliche Anfrage, nicht interne Weiterleitungen)
	if ($request_uri ~ "^(.*/)index\\.html(\\?.*)?$") {{ return 301 $1$2; }}

	location ~ /\\.(?!well-known/) {{ return 404; }}
	location ^~ /api/lib/ {{ return 404; }}
	location = /api/contact-settings.php {{ return 404; }}

	location = /api/contact.php {{
		client_max_body_size 32k;
		include fastcgi_params;
		fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
		fastcgi_pass unix:{p['socket']};
	}}
	location ~ \\.php$ {{ return 404; }}
	location = /{SPECULATION_RULES_FILE} {{ types {{ }} default_type {SPECULATION_RULES_TYPE}; }}

	location ~* \\.(css|js|woff2)$ {{
		include snippets/mindcoded-security-headers.conf;
		add_header Cache-Control "public, max-age=31536000, immutable" always;
	}}
	location ~* \\.(png|svg|ico|webp|avif|jpe?g)$ {{
		include snippets/mindcoded-security-headers.conf;
		add_header Cache-Control "public, max-age=2592000" always;
	}}
	location / {{
		include snippets/mindcoded-security-headers.conf;
		add_header Cache-Control "no-cache" always;
		try_files $uri $uri/ =404;
	}}
	error_page 404 /404.html;
}}

# Eigener Mailserver (Stalwart): Weboberfläche und Einrichtungshilfen hinter nginx (docs/E-MAIL.md)
server {{
	listen 443 ssl http2;
	listen [::]:443 ssl http2;
	server_name {p['mail']};
	ssl_certificate {cert}/fullchain.pem;
	ssl_certificate_key {cert}/privkey.pem;
	location / {{
		proxy_pass http://127.0.0.1:8080;
		proxy_set_header Host $host;
		proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
		proxy_set_header X-Forwarded-Proto https;
	}}
}}
"""

    # ------------------------------------------------------------------ Apache

    def apache_conf(self, p: dict) -> str:
        cert = f"/etc/letsencrypt/live/{p['host']}"
        return f"""# {self.brand_full} – Apache. {GENERATED}
# Sicherheits-Header, Weiterleitungen und Cache regelt die .htaccess im Webroot (AllowOverride All).
# Module: a2enmod ssl headers rewrite deflate proxy_fcgi setenvif · Zertifikate: certbot --apache
# Prüfen: apachectl configtest   ·   Laden: systemctl reload apache2

<VirtualHost *:80>
	ServerName {p['host']}
	ServerAlias {p['alt']}
	Redirect permanent / https://{p['host']}/
</VirtualHost>

<VirtualHost *:443>
	ServerName {p['host']}
	ServerAlias {p['alt']}
	DocumentRoot {p['webroot']}
	ServerSignature Off

	SSLEngine on
	SSLCertificateFile {cert}/fullchain.pem
	SSLCertificateKeyFile {cert}/privkey.pem

	<Directory {p['webroot']}>
		Options -Indexes +SymLinksIfOwnerMatch
		AllowOverride All
		Require all granted
	</Directory>

	# PHP nur für das Formular
	<Files "contact.php">
		SetHandler "proxy:unix:{p['socket']}|fcgi://localhost"
	</Files>
</VirtualHost>
"""

    # ------------------------------------------------------------------ PHP-FPM

    def fpm_pool(self, p: dict) -> str:
        return f"""; {self.brand_full} – PHP-FPM-Pool nur für das Kontaktformular. {GENERATED}
; Ablage: /etc/php/{p['php']}/fpm/pool.d/mindcoded.conf  ·  Laden: systemctl reload php{p['php']}-fpm
[mindcoded]
user = {p['user']}
group = {p['user']}
listen = {p['socket']}
; Benutzer des Webservers: www-data (nginx/Apache unter Debian/Ubuntu) bzw. caddy
listen.owner = www-data
listen.group = www-data
listen.mode = 0660

pm = ondemand
pm.max_children = 4
pm.process_idle_timeout = 30s
pm.max_requests = 500

clear_env = yes
env[MC_PRIVATE_DIR] = {p['private']}

; Härtung: nur, was das Formular braucht
php_admin_value[open_basedir] = {p['root']}/
php_admin_value[disable_functions] = {PHP_DISABLED}
php_admin_flag[allow_url_fopen] = off
php_admin_flag[display_errors] = off
php_admin_flag[log_errors] = on
php_admin_value[post_max_size] = 32K
php_admin_flag[file_uploads] = off
php_admin_value[max_execution_time] = 30
php_admin_value[memory_limit] = 32M
"""

    # ------------------------------------------------------------------ Wartung

    def cleanup_service(self, p: dict) -> str:
        return f"""# {self.brand_full} – Wartung des Kontaktformulars. {GENERATED}
# Ablage: /etc/systemd/system/ · Start: systemctl enable --now mindcoded-contact-cleanup.timer
# Fehler (Exit-Code 2 = Anfragen nicht zugestellt): systemctl --failed · journalctl -u mindcoded-contact-cleanup
[Unit]
Description=mindcoded.studio – Prüfwerte löschen, Zustellfehler melden

[Service]
Type=oneshot
User={p['user']}
Group={p['user']}
Environment=MC_PRIVATE_DIR={p['private']}
ExecStart=/usr/bin/php {p['webroot']}/api/contact.php --cleanup
NoNewPrivileges=yes
ProtectSystem=strict
ProtectHome=yes
PrivateTmp=yes
ReadWritePaths={p['private']}
"""

    def cleanup_timer(self) -> str:
        return f"""# {self.brand_full} – stündliche Wartung des Kontaktformulars. {GENERATED}
[Unit]
Description=mindcoded.studio – stündliche Wartung des Kontaktformulars

[Timer]
OnCalendar=hourly
RandomizedDelaySec=5min
Persistent=true

[Install]
WantedBy=timers.target
"""

    # ------------------------------------------------------------------ DNS

    def dns_records(self, p: dict) -> str:
        return f"""{self.brand_full} – DNS-Einträge. {GENERATED}
<IPv4> und <IPv6> = Adressen des VPS. Erklärung: docs/E-MAIL.md

Website
  {p['host']}.                 A      <IPv4>
  {p['host']}.                 AAAA   <IPv6>          (falls der VPS IPv6 hat)
  {p['alt']}.                  A      <IPv4>          (leitet auf {p['host']} um)
  {p['alt']}.                  AAAA   <IPv6>

Mailserver (Stalwart auf demselben VPS)
  {p['mail']}.                 A      <IPv4>
  {p['mail']}.                 AAAA   <IPv6>
  {p['apex']}.                 MX     10 {p['mail']}.
  {p['apex']}.                 TXT    "v=spf1 mx -all"
  _dmarc.{p['apex']}.          TXT    "v=DMARC1; p=none; rua=mailto:dmarc@{p['apex']}; adkim=s; aspf=s"
  <selector>._domainkey.{p['apex']}.  TXT  (Wert aus Stalwart: Verwaltung › Domains › DNS-Einträge)
  autoconfig.{p['apex']}.      CNAME  {p['mail']}.    (Mailprogramme finden die Einstellungen)
  autodiscover.{p['apex']}.    CNAME  {p['mail']}.
  mta-sts / _mta-sts / _smtp._tls     (Werte aus Stalwart – erzwingt TLS bei eingehender Mail)

Beim VPS-Anbieter (nicht beim DNS-Anbieter): Reverse-DNS (PTR)
  <IPv4>  →  {p['mail']}
  <IPv6>  →  {p['mail']}

DMARC verschärfen, sobald die Berichte 2–4 Wochen sauber sind:
  p=none  →  p=quarantine  →  p=reject

Optional: nur Let's Encrypt darf Zertifikate ausstellen
  {p['apex']}.                 CAA    0 issue "letsencrypt.org"
"""

    def server_readme(self, p: dict) -> str:
        return f"""{self.brand_full} – Serverkonfiguration (Release-Build). {GENERATED}

Ausführliche Anleitung: docs/SERVER.md (Server) und docs/E-MAIL.md (Mailserver).

Verzeichnisse auf dem VPS
  {p['root']}/releases/<Zeitstempel>/   je Veröffentlichung (tools/deploy.py --ssh)
  {p['webroot']}  → Symlink auf den aktuellen Release (Webroot)
  {p['private']}/                       Formular-Konfiguration, Prüfwerte, Zustellfehler (Rechte 700)

Reihenfolge
  1. DNS nach dns.txt, Reverse-DNS beim VPS-Anbieter
  2. Benutzer {p['user']} und Ordner anlegen, PHP {p['php']} (php-fpm, php-cli) installieren
  3. php-fpm/mindcoded.conf → /etc/php/{p['php']}/fpm/pool.d/
  4. Webserver: Caddyfile (empfohlen) ODER nginx/ ODER apache/
  5. Stalwart einrichten (docs/E-MAIL.md), Konten hallo@ und formular@ anlegen
  6. {p['private']}/contact-config.php aus docs/contact-config.example.php
  7. Veröffentlichen: python tools/deploy.py --ssh <benutzer>@<server>
  8. php {p['webroot']}/api/contact.php --check, dann --send-test
  9. systemd/ → /etc/systemd/system/, systemctl enable --now mindcoded-contact-cleanup.timer
"""
