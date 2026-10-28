"""Ausgabe: Assets, Begleitdateien (.htaccess, robots, Sitemap …) und Gesamtablauf."""
from __future__ import annotations

import datetime as dt
import json
import re
import shutil
import struct
from urllib.parse import urlparse

from .common import (
    AI_TRAINING_BOTS,
    API,
    ASSETS,
    BUILD_MARKER,
    LANGS,
    SECURITY_HEADERS,
    SPECULATION_RULES,
    SPECULATION_RULES_FILE,
    SPECULATION_RULES_HEADER,
    SPECULATION_RULES_TYPE,
    STATIC,
    BuildError,
    esc,
    file_hash,
    php_export,
)
from .content import contact_settings
from .css import bundle_css, minify_css, parse_tokens, process_css

JS_IMPORT_RE = re.compile(r"""(\bfrom\s*|\bimport\s*\(?\s*)(['"])\./([\w.-]+\.js)\2""")


def image_size(path) -> tuple[int, int] | None:
    """Breite/Höhe aus PNG- oder JPEG-Kopf lesen (ohne Bildbibliothek)."""
    data = path.read_bytes()
    if data[:8] == b"\x89PNG\r\n\x1a\n":
        return struct.unpack(">II", data[16:24])
    if data[:2] == b"\xff\xd8":
        i = 2
        while i < len(data) - 9:
            if data[i] != 0xFF:
                i += 1
                continue
            marker, length = data[i + 1], struct.unpack(">H", data[i + 2:i + 4])[0]
            if marker in (0xC0, 0xC1, 0xC2):
                h, w = struct.unpack(">HH", data[i + 5:i + 9])
                return w, h
            i += 2 + length
    return None


class OutputMixin:
    # ------------------------------------------------------------------ Assets

    def copy_assets(self) -> None:
        target = self.out / "assets"
        bundle = bundle_css()
        self.tokens = parse_tokens(bundle)
        css, self.media = process_css(bundle)
        fonts_used = set(re.findall(r"""url\(["']?fonts/([\w.-]+\.woff2)["']?\)""", css))
        self.preload_fonts = re.findall(r"""/\*\s*preload\s*\*/[^}]*?url\(["']?fonts/([\w.-]+\.woff2)""", css)
        if self.release:
            css = minify_css(css)
        for src in ASSETS.rglob("*"):
            if src.is_dir():
                continue
            rel = src.relative_to(ASSETS)
            if rel.parts[0] == "css" or (len(rel.parts) == 1 and src.suffix in (".css", ".js")):
                continue  # CSS-Module werden gebündelt, Skripte unten versioniert
            if rel.parts[0] == "fonts" and src.suffix == ".woff2" and src.name not in fonts_used:
                continue
            dest = target / rel
            dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src, dest)
        self.write("assets/style.css", css)
        self.asset_versions["style.css"] = file_hash(css)
        self.version_scripts()
        social = self.site.get("socialImage")
        self.social_size = image_size(ASSETS / social) if social else None
        if social and not self.social_size:
            self.problems.append("content/site.json › socialImage: nur PNG oder JPEG verwenden.")

    def version_scripts(self) -> None:
        """Jede JS-Datei bekommt ?v=<Inhalts-Hash>; Importe werden umgeschrieben. Der Hash eines
        Moduls umfasst die Versionen seiner Importe – ändert sich ein Baustein, ändern sich auch
        alle Module, die ihn laden. Dadurch dürfen Browser Skripte ein Jahr lang cachen."""
        sources = {p.name: p.read_text(encoding="utf-8") for p in ASSETS.glob("*.js")}
        done: dict[str, str] = {}
        self.script_deps = {name: [m.group(3) for m in JS_IMPORT_RE.finditer(text)] for name, text in sources.items()}

        def version(name: str, stack: tuple = ()) -> str:
            if name in done:
                return done[name]
            if name in stack:
                raise BuildError([f"assets/{name}: zirkulärer Import ({' → '.join(stack + (name,))})"])
            if name not in sources:
                raise BuildError([f"assets/{stack[-1]}: importiert fehlende Datei {name}"])

            def repl(match):
                dep = match.group(3)
                return f"{match.group(1)}{match.group(2)}./{dep}?v={version(dep, stack + (name,))}{match.group(2)}"

            text = JS_IMPORT_RE.sub(repl, sources[name])
            done[name] = file_hash(text)
            self.write(f"assets/{name}", text)
            return done[name]

        for name in sources:
            self.asset_versions[name] = version(name)

    def module_graph(self, entry: str) -> list[str]:
        """Alle Module, die entry (transitiv) importiert – für <link rel="modulepreload">."""
        seen: list[str] = []

        def walk(name: str) -> None:
            for dep in self.script_deps.get(name, []):
                if dep not in seen:
                    seen.append(dep)
                    walk(dep)

        walk(entry)
        return seen

    # ------------------------------------------------------------------ Begleitdateien

    def canonical_host(self) -> str | None:
        url = self.page_url("")
        return urlparse(url).hostname if url else None

    def htaccess(self) -> str:
        host = self.canonical_host()
        headers = "\n".join(f'  Header always set {k} "{v}"' for k, v in SECURITY_HEADERS.items())
        live = bool(host and self.release)
        hsts = '  Header always set Strict-Transport-Security "max-age=31536000"\n' if live else ""
        headers += f"\n  Header always set {SPECULATION_RULES_HEADER[0]} '{SPECULATION_RULES_HEADER[1]}'"
        rewrite = ""
        if live:
            pattern = re.escape(host)
            rewrite = f"""
<IfModule mod_rewrite.c>
  RewriteEngine On
  # Eine einzige Adresse für Suchmaschinen: anderer Host (z. B. ohne/mit www) → {host}
  RewriteCond %{{HTTP_HOST}} !^{pattern}$ [NC]
  RewriteRule ^ https://{host}%{{REQUEST_URI}} [L,R=301]
  # http → https
  RewriteCond %{{HTTPS}} !=on
  RewriteCond %{{HTTP:X-Forwarded-Proto}} !https
  RewriteRule ^ https://{host}%{{REQUEST_URI}} [L,R=301]
  # …/index.html → …/ (keine doppelten Adressen)
  RewriteCond %{{THE_REQUEST}} \\s/+(.*/)?index\\.html[\\s?] [NC]
  RewriteRule ^(.*/)?index\\.html$ /$1 [L,R=301]
</IfModule>
"""
        return f"""# {self.brand_full} – generiert von tools/build.py ({"Release" if self.release else "Entwicklung"}).
# Nicht von Hand bearbeiten: Änderungen in tools/mcsite/output.py vornehmen und neu bauen.

Options -Indexes
DirectorySlash On
DirectoryIndex index.html index.php
ErrorDocument 404 /404.html
AddDefaultCharset utf-8
AddType application/manifest+json .webmanifest
<Files "{SPECULATION_RULES_FILE}">
  ForceType {SPECULATION_RULES_TYPE}
</Files>
AddType text/javascript .js
AddType font/woff2 .woff2
AddType image/avif .avif
AddType image/webp .webp
{rewrite}
<IfModule mod_headers.c>
{headers}
{hsts}  Header always unset X-Powered-By
  Header unset X-Powered-By
  # HTML, Manifest, Sitemap: immer frisch prüfen
  <FilesMatch "\\.(html|json|webmanifest|xml|txt)$">
    Header set Cache-Control "no-cache"
  </FilesMatch>
  # CSS/JS werden nur mit ?v=<Inhalts-Hash> eingebunden – ein Jahr unveränderlich cachen
  <FilesMatch "\\.(css|js|woff2)$">
    Header set Cache-Control "public, max-age=31536000, immutable"
  </FilesMatch>
  <FilesMatch "\\.(png|svg|ico|webp|avif|jpg|jpeg)$">
    Header set Cache-Control "public, max-age=2592000"
  </FilesMatch>
</IfModule>

<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css text/javascript application/javascript application/json image/svg+xml application/manifest+json application/xml text/plain
</IfModule>

# Formular: Anfragekörper begrenzen, bevor PHP ihn einliest
<Files "contact.php">
  LimitRequestBody 32768
</Files>

# Interne Dateien nie ausliefern
<FilesMatch "^(contact-settings\\.php|mail-templates\\.php|\\..*)$">
  Require all denied
</FilesMatch>
"""

    def robots(self) -> str:
        if not self.release:
            return "# Entwicklungs-Build – nicht indexieren\nUser-agent: *\nDisallow: /\n"
        lines = []
        if self.site.get("seo", {}).get("blockAiTraining"):
            lines.append("# Kein Training von KI-Modellen (content/site.json › seo.blockAiTraining)")
            for bot in AI_TRAINING_BOTS:
                lines += [f"User-agent: {bot}", "Disallow: /", ""]
        lines += ["User-agent: *", "Disallow: /api/", "Allow: /"]
        sitemap = self.page_url("sitemap.xml")
        if sitemap:
            lines += ["", f"Sitemap: {sitemap}"]
        return "\n".join(lines) + "\n"

    def content_lastmod(self) -> str:
        """Letzte Änderung der Inhalte (nicht das Build-Datum) – Google wertet nur verlässliche Daten."""
        newest = max((self.content_dir / name).stat().st_mtime
                     for name in ("site.json", "de.json", "en.json", "projects.json", "services.json"))
        return dt.datetime.fromtimestamp(newest, dt.UTC).date().isoformat()

    def sitemap(self, entries: list[tuple[str, dict, list]]) -> str | None:
        if not self.page_url(""):
            return None
        lastmod = self.content_lastmod()
        rows = []
        for path, alternates, images in entries:
            alts = "".join(f'\n    <xhtml:link rel="alternate" hreflang="{lang}" href="{esc(self.page_url(p))}"/>'
                           for lang, p in alternates.items())
            if "de" in alternates:
                alts += f'\n    <xhtml:link rel="alternate" hreflang="x-default" href="{esc(self.page_url(alternates["de"]))}"/>'
            imgs = "".join(f"\n    <image:image><image:loc>{esc(self.page_url('assets/' + src))}</image:loc></image:image>"
                           for src in images)
            rows.append(f"  <url>\n    <loc>{esc(self.page_url(path))}</loc>\n    <lastmod>{lastmod}</lastmod>{alts}{imgs}\n  </url>")
        return ('<?xml version="1.0" encoding="UTF-8"?>\n'
                '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" '
                'xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n'
                + "\n".join(rows) + "\n</urlset>\n")

    def manifest(self) -> str:
        light = self.tokens["light"]
        return json.dumps({
            "name": self.brand_full,
            "short_name": self.site["brand"]["name"],
            "lang": "de",
            "icons": [
                {"src": "icon-192.png", "sizes": "192x192", "type": "image/png"},
                {"src": "icon-512.png", "sizes": "512x512", "type": "image/png"},
                {"src": "favicon.svg", "sizes": "any", "type": "image/svg+xml"},
            ],
            "theme_color": light["color-ink"],
            "background_color": light["color-bg"],
            "display": "browser",
        }, ensure_ascii=False, indent=2) + "\n"

    def security_txt(self) -> str:
        expires = (dt.datetime.now(dt.UTC) + dt.timedelta(days=365)).strftime("%Y-%m-%dT00:00:00Z")
        lines = [f"Contact: mailto:{self.site['brand']['email']}", f"Expires: {expires}", "Preferred-Languages: de, en"]
        canonical = self.page_url(".well-known/security.txt")
        if canonical:
            lines.append(f"Canonical: {canonical}")
        return "\n".join(lines) + "\n"

    def llms_txt(self) -> str:
        """Kurzübersicht für KI-Assistenten (llms.txt-Vorschlag) – nur veröffentlichte Seiten."""
        de = self.langs["de"]
        lines = [f"# {self.brand_full}", "", f"> {self.text(de['meta']['description'])}", "",
                 "## Leistungen"]
        for svc in self.services:
            target = self.service_path("de", svc) if self.has_service_page(svc) else "#leistungen"
            lines.append(f"- [{svc['de']['title']}]({self.page_url(target)}): {svc['de']['desc']}")
        lines += ["", "## Seiten",
                  f"- [Startseite (Deutsch)]({self.page_url('')})",
                  f"- [Home (English)]({self.page_url('en/')})",
                  f"- [Kontakt]({self.page_url('')}#kontakt)",
                  f"- [Impressum]({self.page_url(de['legal']['imprint']['slug'] + '/')})",
                  f"- [Datenschutz]({self.page_url(de['legal']['privacy']['slug'] + '/')})"]
        if "accessibility" in self.legal_keys():
            lines.append(f"- [Barrierefreiheit]({self.page_url(de['legal']['accessibility']['slug'] + '/')})")
        projects = [p for p in self.visible_projects()]
        if projects:
            lines += ["", "## Projekte"]
            lines += [f"- [{p['de']['name']}]({self.page_url(self.case_path('de', p['slug']))}): {p['de']['summary']}" for p in projects]
        return "\n".join(lines) + "\n"

    def todo_report(self) -> str:
        rows = "".join(f'<tr><td><code class="type-mono">{esc(path)}</code></td><td>{esc(text)}</td></tr>'
                       for path, text in sorted(self.todos.items()))
        drafts = "".join(f"<li>Projekt <code>{esc(p['slug'])}</code></li>" for p in self.projects if p.get("draft"))
        drafts += "".join(f"<li>Seite <code>{esc(entry['slug'])}</code></li>" for key, entry in self.langs["de"]["legal"].items()
                          if key != "sentences" and entry.get("draft"))
        drafts += "".join(f"<li>Leistungsseite <code>{esc(s['key'])}</code></li>" for s in self.services if s.get("page", {}).get("draft"))
        return f"""<!DOCTYPE html>
<html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex"><title>Offene Betreiberangaben – Entwicklungs-Build</title>
<link rel="stylesheet" href="assets/style.css?v={self.asset_versions.get('style.css', '')}"></head>
<body class="page-sub"><main id="main" class="legal-page"><div class="legal-container">
<p class="section-eyebrow type-label">Entwicklungs-Build</p>
<h1 class="legal-title type-display">Offene Betreiberangaben</h1>
<p class="legal-intro">Diese Seite existiert nur im Entwicklungs-Build. Solange hier Einträge stehen, verweigert <code>python tools/build.py --release</code> die Veröffentlichung. TODOs in Entwürfen blockieren nicht – Entwürfe werden nicht veröffentlicht.</p>
<section class="legal-section"><h2>{len(self.todos)} offene Angaben</h2>
<table class="todo-table"><thead><tr><th>Fundstelle</th><th>Was fehlt</th></tr></thead><tbody>{rows}</tbody></table></section>
<section class="legal-section"><h2>Entwürfe (werden nicht veröffentlicht)</h2><ul>{drafts or "<li>keine</li>"}</ul></section>
</div></main></body></html>
"""

    # ------------------------------------------------------------------ Dateien

    def write(self, rel: str, text: str) -> None:
        dest = self.out / rel
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_text(text, encoding="utf-8", newline="\n")

    @staticmethod
    def prepare_dir(path) -> None:
        """Leert einen Zielordner – aber nur, wenn er leer ist oder von diesem Build stammt."""
        if path.exists():
            if any(path.iterdir()) and not (path / BUILD_MARKER).exists():
                raise BuildError([f"{path} ist nicht leer und stammt nicht von tools/build.py – wird nicht gelöscht."])
            shutil.rmtree(path)
        path.mkdir(parents=True)
        (path / BUILD_MARKER).write_text("Von tools/build.py erzeugt – wird bei jedem Build ersetzt.\n", encoding="utf-8")

    def prepare_out(self) -> None:
        self.prepare_dir(self.out)

    @property
    def server_out(self):
        """Serverkonfiguration neben dem Webroot-Build (dist → dist-server), nie darin."""
        return self.out.with_name(self.out.name + "-server")

    def write_server_configs(self) -> None:
        self.prepare_dir(self.server_out)
        for rel, text in self.server_configs().items():
            dest = self.server_out / rel
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_text(text, encoding="utf-8", newline="\n")

    # ------------------------------------------------------------------ Ablauf

    def run(self) -> dict:
        self.load()
        if self.problems:
            # Ungültige Inhalte (z. B. Pfade) brechen ab, bevor irgendetwas geschrieben wird.
            raise BuildError(list(self.problems))
        self.prepare_out()
        self.copy_assets()
        for src in STATIC.iterdir():
            if src.is_file():
                shutil.copy2(src, self.out / src.name)

        projects = self.visible_projects()
        services = self.visible_service_pages()
        sitemap = []
        for lang in LANGS:
            self.write(self.home_path(lang) + "index.html", self.home(lang))
            for i, proj in enumerate(projects):
                self.write(self.case_path(lang, proj["slug"]) + "index.html", self.case_page(lang, projects, i))
            for svc in services:
                self.write(self.service_path(lang, svc) + "index.html", self.service_page(lang, svc))
            for key in ("thanks", "error"):
                msg = self.langs[lang]["pages"][key]
                self.write(self.lang_prefix(lang) + msg["slug"] + "/index.html", self.message_page(lang, key))
        for key in self.legal_keys():
            self.write(self.langs["de"]["legal"][key]["slug"] + "/index.html", self.legal_page(key))
        self.write("404.html", self.not_found())

        # Indexierbare Seiten für die Sitemap (Entwürfe nie)
        for lang in LANGS:
            sitemap.append((self.home_path(lang), {o: self.home_path(o) for o in LANGS}, []))
            for svc in services:
                if not svc["page"].get("draft"):
                    sitemap.append((self.service_path(lang, svc), {o: self.service_path(o, svc) for o in LANGS}, []))
            for proj in projects:
                if not proj.get("draft"):
                    images = [img["src"] for img in proj.get("images", [])]
                    sitemap.append((self.case_path(lang, proj["slug"]), {o: self.case_path(o, proj["slug"]) for o in LANGS}, images))

        api_dir = self.out / "api"
        api_dir.mkdir(exist_ok=True)
        shutil.copy2(API / "contact.php", api_dir / "contact.php")
        shutil.copytree(API / "lib", api_dir / "lib", dirs_exist_ok=True)
        # Bausteine nie direkt aufrufbar (Apache; Caddy/nginx sperren den Ordner in ihrer Konfiguration)
        self.write("api/lib/.htaccess", "Require all denied\n")
        self.write("api/contact-settings.php",
                   "<?php\n// Generiert von tools/build.py – nicht von Hand bearbeiten.\n"
                   "if (realpath(__FILE__) === realpath($_SERVER['SCRIPT_FILENAME'] ?? '')) { http_response_code(404); exit; }\n"
                   f"return {php_export(contact_settings(self.site, self.langs))};\n")
        self.write("api/mail-templates.php",
                   "<?php\n// Generiert von tools/build.py (tools/mcsite/mail.py) – nicht von Hand bearbeiten.\n"
                   "if (realpath(__FILE__) === realpath($_SERVER['SCRIPT_FILENAME'] ?? '')) { http_response_code(404); exit; }\n"
                   f"return {php_export(self.mail_templates())};\n")

        seo = self.site.get("seo", {})
        self.write(".htaccess", self.htaccess())
        self.write("robots.txt", self.robots())
        self.write(SPECULATION_RULES_FILE, json.dumps(SPECULATION_RULES, separators=(",", ":")) + "\n")
        self.write("site.webmanifest", self.manifest())
        if seo.get("securityTxt", True):
            self.write(".well-known/security.txt", self.security_txt())
        if seo.get("googleVerificationFile"):
            name = seo["googleVerificationFile"]
            self.write(name, f"google-site-verification: {name}")
        if self.release and self.page_url(""):
            self.write("sitemap.xml", self.sitemap(sitemap))
            self.write("llms.txt", self.llms_txt())
            self.write_server_configs()

        if self.release:
            problems = list(self.problems)
            if self.todos:
                problems.append(f"{len(self.todos)} offene Betreiberangaben:")
                problems += [f"  – {path}: {text}" for path, text in sorted(self.todos.items())]
            if problems:
                shutil.rmtree(self.out, ignore_errors=True)
                if (self.server_out / BUILD_MARKER).exists():  # nur eigene Ausgabe löschen
                    shutil.rmtree(self.server_out, ignore_errors=True)
                raise BuildError(problems)
        else:
            self.write("BETREIBER-TODO.html", self.todo_report())
            self.write("komponenten/index.html", self.catalog_page())
            if self.problems:
                raise BuildError(self.problems)
        drafts = (sum(1 for p in projects if p.get("draft")) + sum(1 for s in services if s["page"].get("draft"))
                  + sum(1 for k in self.legal_keys() if self.langs["de"]["legal"][k].get("draft")))
        return {"pages": len(list(self.out.rglob("*.html"))), "todos": len(self.todos), "drafts": drafts, "out": str(self.out)}
