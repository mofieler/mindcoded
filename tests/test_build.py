"""Build, Release-Sperre und statische Qualitätsprüfungen des erzeugten HTML.

Aufruf: python -m unittest discover -s tests -v
"""
from __future__ import annotations

import gzip
import itertools
import json
import re
import shutil
import unittest
from pathlib import Path
from urllib.parse import unquote, urlparse

from tests.support import ROOT, Doc, export_tokens, make_release_content, new_project, site_build, temp_dir

# isort: split
from mcsite.blocks import BLOCK_TYPES, STATES  # noqa: E402 – Pfad setzt tests.support
from mcsite.css import load_tokens  # noqa: E402

GENERIC_TITLES = {"bundled page", "untitled", "document", "index"}


def html_pages(out: Path) -> list[Path]:
    return sorted(p for p in out.rglob("*.html") if p.name != "BETREIBER-TODO.html")


def page_dir(out: Path, page: Path) -> Path:
    return page.parent


class BuildFixtures(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = temp_dir("mc-test-build-")
        cls.dev_out = cls.tmp / "dev"
        cls.dev = site_build.build(release=False, out=cls.dev_out)
        cls.content = make_release_content(cls.tmp)
        cls.rel_out = cls.tmp / "release"
        cls.rel = site_build.build(release=True, out=cls.rel_out, content_dir=cls.content)

    @classmethod
    def tearDownClass(cls):
        shutil.rmtree(cls.tmp, ignore_errors=True)

    def read(self, out: Path, rel: str) -> str:
        return (out / rel).read_text(encoding="utf-8")


class TestBuildModes(BuildFixtures):
    def test_dev_build_generates_all_pages(self):
        for rel in ["index.html", "en/index.html", "impressum/index.html", "datenschutz/index.html",
                    "kontakt/danke/index.html", "kontakt/fehler/index.html", "en/contact/thanks/index.html",
                    "en/contact/error/index.html", "404.html", "BETREIBER-TODO.html",
                    "projekte/paquita-pilates/index.html", "en/work/paquita-pilates/index.html",
                    "leistungen/websites/index.html", "en/services/websites/index.html",
                    ".htaccess", "robots.txt", "site.webmanifest", "api/contact.php", "api/contact-settings.php",
                    ".well-known/security.txt", "favicon.svg", "favicon.ico", "apple-touch-icon.png",
                    "assets/style.css", "assets/app.js", "assets/social/og-default.png"]:
            self.assertTrue((self.dev_out / rel).is_file(), rel)
        self.assertGreater(self.dev["todos"], 0)

    def test_dev_build_is_not_indexable(self):
        self.assertIn("Disallow: /", self.read(self.dev_out, "robots.txt"))
        for page in html_pages(self.dev_out):
            self.assertIn('name="robots" content="noindex', page.read_text(encoding="utf-8"), page)

    def test_release_refuses_open_operator_data(self):
        content = self.tmp / "content-open"
        shutil.copytree(self.content, content)
        site = json.loads((content / "site.json").read_text(encoding="utf-8"))
        site["url"] = "TODO: Adresse"
        site["operator"]["name"] = "TODO: Name"
        (content / "site.json").write_text(json.dumps(site, ensure_ascii=False), encoding="utf-8")
        out = self.tmp / "blocked"
        with self.assertRaises(site_build.BuildError) as ctx:
            site_build.build(release=True, out=out, content_dir=content)
        text = "\n".join(ctx.exception.problems)
        self.assertIn("offene Betreiberangaben", text)
        self.assertIn("operator › name", text)
        self.assertIn("› url", text)
        self.assertFalse(out.exists(), "Ein abgebrochener Release-Build darf keine Dateien hinterlassen.")

    def test_release_excludes_drafts_and_placeholders(self):
        self.assertEqual(self.rel["drafts"], 0)
        projects = json.loads((self.content / "projects.json").read_text(encoding="utf-8"))["items"]
        for proj in projects:
            published = (self.rel_out / "projekte" / proj["slug"] / "index.html").exists()
            self.assertEqual(published, not proj.get("draft"), proj["slug"])
        services = json.loads((self.content / "services.json").read_text(encoding="utf-8"))["items"]
        for svc in services:
            published = (self.rel_out / "leistungen" / svc["slug"]["de"] / "index.html").exists()
            self.assertEqual(published, not svc["page"].get("draft"), f"Leistungsseite {svc['key']}: nur ohne Entwurf veröffentlichen")
        self.assertFalse((self.rel_out / "BETREIBER-TODO.html").exists())
        for page in html_pages(self.rel_out):
            text = page.read_text(encoding="utf-8")
            for needle in ("TODO", "Platzhalter", "PLATZHALTER", "dev-badge", "draft-badge"):
                self.assertNotIn(needle, text, f"{needle} in {page}")

    def test_case_blocks_render_without_js(self):
        page = self.read(self.dev_out, "projekte/hiqer/index.html")
        for cls in ("case-glance-list", "case-chapter", "case-cards", "case-steps", "case-groups", "case-split-bar",
                    "case-more", "case-gallery-strip", "data-chapter-label"):
            self.assertIn(cls, page)
        self.assertIn("84,6 %", page, "Messwerte stehen als Text neben den Balken")
        self.assertIn('<span class="visually-hidden">61,5 %</span>', page, "hochzählende Zahlen: Endwert für Screenreader")
        self.assertIn("<details", page, "»Mehr dazu« ist natives <details> (ohne JavaScript bedienbar)")
        en = self.read(self.dev_out, "en/work/hiqer/index.html")
        self.assertIn("84.6%", en)
        for slug, cls in (("beast", "case-scale-zone"), ("paquita-pilates", "case-palette"), ("paquita-pilates", "case-steps--status"),
                          ("pilateq", "case-compare"), ("pilateq", "case-quote")):
            self.assertIn(cls, self.read(self.dev_out, f"projekte/{slug}/index.html"), f"{cls} in {slug}")

    def test_featured_projects_as_cards(self):
        home = self.read(self.dev_out, "index.html")
        projects = json.loads((self.content / "projects.json").read_text(encoding="utf-8"))["items"]
        featured = [p for p in projects if p.get("featured")]
        self.assertTrue(featured)
        for proj in featured:
            slug = proj["slug"]
            self.assertIn(f'aria-labelledby="card-{slug}-title card-{slug}-cta"', home, "Karte ist ein Link mit kurzem Namen")
            self.assertEqual(home.count(f'data-vt="case-{slug}"'), 1, "nur als Karte, nicht zusätzlich in der Liste")
        self.assertIn("projects-more-title", home)

    def test_component_catalog_only_in_dev(self):
        page = self.read(self.dev_out, "komponenten/index.html")
        for kind in BLOCK_TYPES:
            self.assertIn(f"case-block--{kind}", page, f"Beispiel für {kind} auf der Komponenten-Seite")
        self.assertIn('data-copy="json-project"', page)
        self.assertFalse((self.rel_out / "komponenten").exists(), "Komponenten-Seite nie veröffentlichen")

    def test_new_project_from_template_builds(self):
        content = self.tmp / "content-new-project"
        shutil.copytree(self.content, content)
        new_project.add_project("test-projekt", "Testprojekt", "own", content)
        out = self.tmp / "dev-new-project"
        site_build.build(release=False, out=out, content_dir=content)
        page = self.read(out, "projekte/test-projekt/index.html")
        self.assertIn("Testprojekt", page)
        with self.assertRaises(SystemExit):
            new_project.add_project("test-projekt", "Doppelt", "own", content)

    def test_schema_matches_generator(self):
        """content/schema/projects.schema.json (Editor) kennt genau die Bausteine und Werte des Generators."""
        schema = json.loads((ROOT / "content" / "schema" / "projects.schema.json").read_text(encoding="utf-8"))
        defs = schema["$defs"]
        self.assertEqual(defs["block"]["properties"]["type"]["enum"], list(BLOCK_TYPES))
        for kind in BLOCK_TYPES:
            self.assertIn(f"block-{kind}", defs, f"Schema für Baustein {kind}")
        self.assertEqual(defs["project"]["properties"]["kind"]["enum"], ["client", "own", "concept", "study"])
        status = defs["block-status"]["properties"]["items"]["items"]["allOf"][1]["properties"]["state"]["enum"]
        self.assertEqual(status, list(STATES))

    def test_design_tokens_export_is_current(self):
        current = (ROOT / "design-tokens.json").read_text(encoding="utf-8")
        self.assertEqual(current, export_tokens.render(), "design-tokens.json veraltet – python tools/export_tokens.py")

    def test_case_content_is_validated(self):
        content = self.tmp / "content-bad-blocks"
        shutil.copytree(self.content, content)
        projects = json.loads((content / "projects.json").read_text(encoding="utf-8"))
        sections = projects["items"][0]["de"]["sections"]
        sections[0]["blocks"] = [{"type": "chart", "items": [1]}]
        sections[1]["blocks"] = [{"type": "scale", "items": [{"label": "x", "value": 4}]},
                                 {"type": "split", "items": [{"label": "a", "value": 70}, {"label": "b", "value": 40}]}]
        sections[2]["blocks"] = [{"type": "palette", "items": [{"hex": "red", "name": "n", "role": "r"}]}]
        (content / "projects.json").write_text(json.dumps(projects, ensure_ascii=False), encoding="utf-8")
        with self.assertRaises(site_build.BuildError) as ctx:
            site_build.build(release=False, out=self.tmp / "bad-blocks", content_dir=content)
        text = "\n".join(ctx.exception.problems)
        for needle in ("type muss eines von", "außerhalb der Skala", "mehr als 100", "hex wie #b27d55"):
            self.assertIn(needle, text)

    def test_release_without_projects_hides_section_and_nav(self):
        content = self.tmp / "content-no-projects"
        shutil.copytree(self.content, content)
        projects = json.loads((content / "projects.json").read_text(encoding="utf-8"))
        for proj in projects["items"]:
            proj["draft"] = True
        (content / "projects.json").write_text(json.dumps(projects, ensure_ascii=False), encoding="utf-8")
        out = self.tmp / "release-no-projects"
        site_build.build(release=True, out=out, content_dir=content)
        home = self.read(out, "index.html")
        self.assertNotIn('id="projekte"', home)
        self.assertNotIn('href="#projekte"', home)
        self.assertIn('href="#ablauf"', home)

    def test_release_seo_files(self):
        robots = self.read(self.rel_out, "robots.txt")
        self.assertIn("Sitemap: https://www.example.com/sitemap.xml", robots)
        self.assertIn("Disallow: /api/", robots)
        sitemap = self.read(self.rel_out, "sitemap.xml")
        self.assertIn("<loc>https://www.example.com/</loc>", sitemap)
        self.assertIn('hreflang="en" href="https://www.example.com/en/"', sitemap)
        self.assertIn('hreflang="x-default"', sitemap)
        self.assertIn("sitemap-image", sitemap)
        self.assertRegex(sitemap, r"<lastmod>\d{4}-\d{2}-\d{2}</lastmod>")
        home = self.read(self.rel_out, "index.html")
        self.assertIn('<link rel="canonical" href="https://www.example.com/">', home)
        self.assertIn('hreflang="x-default"', home)
        self.assertNotIn('name="robots"', home)
        self.assertIn('<meta property="og:image" content="https://www.example.com/assets/social/og-default.png">', home)
        self.assertIn('<meta property="og:image:width" content="1200">', home)
        self.assertIn('<meta property="og:locale:alternate" content="en_GB">', home)
        self.assertIn('name="twitter:card" content="summary_large_image"', home)
        self.assertEqual(home.count('name="theme-color"'), 2)
        ld = json.loads(re.search(r'<script type="application/ld\+json">(.*?)</script>', home, re.S).group(1))
        types = {node["@type"] for node in ld["@graph"]}
        self.assertEqual(types, {"LocalBusiness", "WebSite"})
        org = next(n for n in ld["@graph"] if n["@type"] == "LocalBusiness")
        self.assertIn({"@type": "City", "name": "Stuttgart"}, org["areaServed"])
        self.assertEqual(org["founder"]["@type"], "Person")
        self.assertTrue(org["logo"].startswith("https://www.example.com/"))
        self.assertNotIn("streetAddress", org["address"], "Straße nur bei seo.publishStreetAddress")
        llms = self.read(self.rel_out, "llms.txt")
        self.assertIn("## Leistungen", llms)
        security = self.read(self.rel_out, ".well-known/security.txt")
        self.assertIn("Contact: mailto:", security)
        self.assertIn("Canonical: https://www.example.com/.well-known/security.txt", security)

    def test_seo_options(self):
        content = make_release_content(temp_dir("mc-test-seo-"))
        site = json.loads((content / "site.json").read_text(encoding="utf-8"))
        site["seo"].update({"googleSiteVerification": "abcdefghijklmnop1234", "bingSiteVerification": "ABCDEF0123456789",
                            "googleVerificationFile": "google0123abcd4567.html", "blockAiTraining": True,
                            "profiles": ["https://www.example.com/profil"], "publishStreetAddress": True})
        (content / "site.json").write_text(json.dumps(site, ensure_ascii=False), encoding="utf-8")
        out = self.tmp / "seo"
        site_build.build(release=True, out=out, content_dir=content)
        home = (out / "index.html").read_text(encoding="utf-8")
        self.assertIn('<meta name="google-site-verification" content="abcdefghijklmnop1234">', home)
        self.assertIn('<meta name="msvalidate.01" content="ABCDEF0123456789">', home)
        self.assertEqual((out / "google0123abcd4567.html").read_text(encoding="utf-8"), "google-site-verification: google0123abcd4567.html")
        robots = (out / "robots.txt").read_text(encoding="utf-8")
        self.assertIn("User-agent: GPTBot\nDisallow: /", robots)
        ld = json.loads(re.search(r'<script type="application/ld\+json">(.*?)</script>', home, re.S).group(1))
        org = ld["@graph"][0]
        self.assertEqual(org["sameAs"], ["https://www.example.com/profil"])
        self.assertIn("streetAddress", org["address"])

    def test_htaccess_security_and_caching(self):
        ht = self.read(self.rel_out, ".htaccess")
        for header in ("Content-Security-Policy", "X-Content-Type-Options", "Referrer-Policy", "Strict-Transport-Security"):
            self.assertIn(header, ht)
        self.assertIn("RewriteCond %{HTTP_HOST} !^www\\.example\\.com$ [NC]", ht)
        self.assertIn("RewriteRule ^ https://www.example.com%{REQUEST_URI} [L,R=301]", ht)
        self.assertIn("index\\.html$ /$1 [L,R=301]", ht)
        self.assertIn("immutable", ht)
        self.assertIn("contact-settings", ht)
        self.assertIn("mail-templates", ht)
        self.assertIn("ErrorDocument 404 /404.html", ht)
        dev = self.read(self.dev_out, ".htaccess")
        self.assertNotIn("RewriteRule", dev, "Entwicklungs-Build darf nicht umleiten")

    def test_performance_budget(self):
        """Leistungsbudget der Startseite (gzip, ohne Bilder): verhindert, dass die Seite schleichend
        schwerer wird. Werte bewusst mit etwas Luft; wer sie anhebt, begründet es im Commit."""
        budget_kb = {"html": 22, "css": 22, "js": 72, "font": 160}  # Stand 10/2026: 16 / 15 / 61 / 153
        home = self.read(self.rel_out, "index.html")
        files = {"html": [self.rel_out / "index.html"], "css": [], "js": [], "font": []}
        for ref in re.findall(r'(?:href|src)="(assets/[^"?]+\.(?:css|js|woff2))', home):
            kind = {"css": "css", "js": "js", "woff2": "font"}[ref.rsplit(".", 1)[1]]
            files[kind].append(self.rel_out / ref)
        queue = list(files["js"])  # statische Importe gehören zum ersten Laden
        while queue:
            for name in re.findall(r"""from\s*'\./([\w.-]+\.js)""", queue.pop().read_text(encoding="utf-8")):
                dep = self.rel_out / "assets" / name
                if dep not in files["js"]:
                    files["js"].append(dep)
                    queue.append(dep)
        for kind, paths in files.items():
            size = sum(len(gzip.compress(f.read_bytes())) for f in set(paths)) / 1024
            self.assertLessEqual(size, budget_kb[kind], f"{kind}: {size:.1f} KB gzip > Budget {budget_kb[kind]} KB")

    def test_assets_are_versioned(self):
        home = self.read(self.rel_out, "index.html")
        for name in ("style.css", "app.js", "theme-init.js"):
            self.assertRegex(home, rf"assets/{re.escape(name)}\?v=[0-9a-f]{{10}}")
        app = self.read(self.rel_out, "assets/app.js")
        imports = re.findall(r"""from\s*'\./([\w.-]+\.js)(\?v=[0-9a-f]{10})?'""", app)
        self.assertTrue(imports)
        for name, version in imports:
            self.assertTrue(version, f"Import von {name} ohne Version – Langzeit-Cache wäre unsicher")

    def test_draft_text_pages_only_in_dev(self):
        self.assertTrue((self.dev_out / "barrierefreiheit" / "index.html").is_file())
        self.assertIn('href="barrierefreiheit/"', self.read(self.dev_out, "index.html"))
        self.assertFalse((self.rel_out / "barrierefreiheit").exists(), "Entwurf darf nicht veröffentlicht werden")
        self.assertNotIn("barrierefreiheit/", self.read(self.rel_out, "index.html"))
        self.assertFalse((self.rel_out / "projekte" / "diese-website").exists())

    def test_animated_steps_also_as_text(self):
        # Die Leistungs-Animation ist für Screenreader ausgeblendet – ihre Schritte stehen als Text im Panel.
        for out in (self.dev_out, self.rel_out):
            home = self.read(out, "index.html")
            label = json.loads((self.content / "de.json").read_text(encoding="utf-8"))["services"]["pageLabels"]["approach"]
            lists = re.findall(rf'<div class="visually-hidden"><p>{re.escape(label)}:</p><ol>(.*?)</ol></div>', home)
            count = len(json.loads((self.content / "services.json").read_text(encoding="utf-8"))["items"])
            self.assertEqual(len(lists), count)
            for items in lists:
                self.assertEqual(items.count("<li>"), 4)
                self.assertNotRegex(items, r"<li>\d", "Nummer steht schon in der Liste")

    def test_theme_default_in_markup(self):
        self.assertIn('data-theme-default="system"', self.read(self.rel_out, "index.html"))

    def test_css_bundled_and_minified(self):
        css = self.read(self.rel_out, "assets/style.css")
        self.assertNotIn("/*", css, "Release-CSS enthält Kommentare")
        self.assertNotIn("@import", css, "@import-Kette im Browser vermeiden – Module werden gebündelt")
        self.assertTrue(css.startswith("@layer reset,tokens,base,"), css[:60])
        self.assertFalse((self.rel_out / "assets" / "css").exists(), "CSS-Module dürfen nicht ausgeliefert werden")
        dev = self.read(self.dev_out, "assets/style.css")
        self.assertIn("/* ── components/button.css ── */", dev, "Entwicklungs-Build bleibt lesbar")

    def test_css_breakpoints_resolved(self):
        css = self.read(self.rel_out, "assets/style.css")
        self.assertNotRegex(css, r"@custom-media\s+--[\w-]+\s+\(")
        self.assertNotRegex(css, r"@media[^{]*\(--")
        home = self.read(self.rel_out, "index.html")
        media = json.loads(re.search(r'<script type="application/json" id="mc-data">(.*?)</script>', home, re.S).group(1))["media"]
        self.assertEqual(media["desktop"], "(min-width: 820px)")

    def test_placeholders_resolved(self):
        for page in html_pages(self.rel_out):
            self.assertNotRegex(page.read_text(encoding="utf-8"), r"\{brand\.|\{operator\.|\{year\}", page)

    def test_contact_settings_match_content(self):
        php = self.read(self.rel_out, "api/contact-settings.php")
        site = json.loads((ROOT / "content" / "site.json").read_text(encoding="utf-8"))
        for key, value in site["contact"]["limits"].items():
            self.assertIn(f"'{key}' => {value}", php)
        self.assertIn("'success' => 'kontakt/danke/'", php)
        self.assertIn("'success' => 'en/contact/thanks/'", php)

    def test_mail_templates_follow_tokens(self):
        """E-Mail-Vorlagen: nur Token-Farben, keine fremden Adressen, Bestätigung ohne Formular-Platzhalter."""
        php = self.read(self.rel_out, "api/mail-templates.php")
        self.assertTrue(php.startswith("<?php"))
        tokens = load_tokens()
        allowed = {v.lower() for scheme in tokens.values() for v in scheme.values()}
        used = {c.lower() for c in re.findall(r"#[0-9a-fA-F]{6}(?![0-9a-fA-F])", php)}
        self.assertTrue(used, "keine Farben gefunden")
        self.assertLessEqual(used, allowed, "Farben außerhalb der Design-Tokens")
        site = json.loads((self.content / "site.json").read_text(encoding="utf-8"))
        for url in re.findall(r"https?://[^\s'\"<>)]+", php):
            self.assertTrue(url.startswith(site["url"]), url)
        self.assertNotRegex(php, r"<img|@import|<link", "keine externen Bilder oder Stylesheets")
        receipt = php.split("'receipt' =>", 1)[1]
        for placeholder in ("%rows%", "%message%", "%value%", "%label%"):
            self.assertNotIn(placeholder, receipt, "Eingangsbestätigung darf keine Formularinhalte enthalten")
        self.assertIn("%rows%", php.split("'receipt' =>", 1)[0])

    def test_page_data_cannot_break_out_of_script(self):
        home = self.read(self.dev_out, "index.html")
        block = re.search(r'<script type="application/json" id="mc-data">(.*?)</script>', home, re.S).group(1)
        self.assertNotIn("<", block)
        self.assertEqual(json.loads(block)["lang"], "de")

    def test_intro_marker_only_on_home(self):
        for out in (self.dev_out, self.rel_out):
            for page in html_pages(out):
                rel = page.relative_to(out).as_posix()
                has = 'data-intro="' in page.read_text(encoding="utf-8").split("<head>")[0]
                self.assertEqual(has, rel in ("index.html", "en/index.html"), rel)

    def test_out_dir_guard(self):
        foreign = self.tmp / "fremd"
        foreign.mkdir()
        (foreign / "wichtig.txt").write_text("nicht löschen", encoding="utf-8")
        with self.assertRaises(site_build.BuildError):
            site_build.build(release=False, out=foreign)
        self.assertTrue((foreign / "wichtig.txt").exists())

    def test_server_configs_from_single_source(self):
        srv = self.rel_out.with_name(self.rel_out.name + "-server")
        read = lambda rel: (srv / rel).read_text(encoding="utf-8")  # noqa: E731
        caddy, nginx, headers = read("Caddyfile"), read("nginx/mindcoded.conf"), read("nginx/security-headers.conf")
        container = read("container/Caddyfile")
        htaccess = self.read(self.rel_out, ".htaccess")
        for name, value in site_build.SECURITY_HEADERS.items():
            with self.subTest(header=name):
                self.assertIn(f'{name} "{value}"', caddy)
                self.assertIn(f'{name} "{value}"', container)
                self.assertIn(f'add_header {name} "{value}" always;', headers)
                self.assertIn(f'Header always set {name} "{value}"', htaccess)
        # Vorladen beim Projektwechsel: Header und MIME-Typ der Regeldatei in jedem Server
        self.assertIn("Speculation-Rules `\"/speculation-rules.json\"`", caddy)
        self.assertIn("header @speculation Content-Type application/speculationrules+json", caddy)
        self.assertIn("add_header Speculation-Rules '\"/speculation-rules.json\"' always;", headers)
        self.assertIn("default_type application/speculationrules+json;", nginx)
        self.assertIn("Header always set Speculation-Rules '\"/speculation-rules.json\"'", htaccess)
        self.assertIn("ForceType application/speculationrules+json", htaccess)
        rules = json.loads(self.read(self.rel_out, "speculation-rules.json"))
        self.assertEqual(rules["prefetch"][0]["where"]["selector_matches"], "a[data-curtain-link]")
        for text in (caddy, nginx, container):
            self.assertEqual(text.count("{"), text.count("}"), "Klammern ausgeglichen")
        # Container hinter Coolify: gleiche Regeln, HTTP intern, echte Besucher-IP, kein Zugriffsprotokoll
        for rule in ("auto_https off", "trusted_proxies static private_ranges", ":8080 {", "root * /srv/www",
                     "@alt host example.com", "redir @alt https://www.example.com{uri} permanent",
                     "error @hidden 404", "error @internal 404", "php_fastcgi @contact unix//tmp/php-fpm.sock",
                     "error @php 404", "max_size 32KB"):
            self.assertIn(rule, container)
        self.assertNotIn("log {", container)
        container_pool = read("container/php-fpm.conf")
        for rule in ("listen = /tmp/php-fpm.sock", "pid = /tmp/php-fpm.pid", "php_admin_value[disable_functions]",
                     "php_admin_flag[allow_url_fopen] = off"):
            self.assertIn(rule, container_pool)
        # Kanonische Adresse, Sperren, PHP nur für das Formular
        self.assertIn("example.com {\n\tredir https://www.example.com{uri} permanent", caddy)
        self.assertIn("root * /srv/mindcoded/current", caddy)
        for rule in ("error @hidden 404", "error @internal 404", "php_fastcgi @contact unix//run/php/mindcoded-fpm.sock",
                     "error @php 404", "max_size 32KB"):
            self.assertIn(rule, caddy)
        self.assertIn("@internal path /api/lib/* /api/contact-settings.php /api/mail-templates.php", caddy)
        for rule in ("location ^~ /api/lib/ { return 404; }", "location = /api/contact-settings.php { return 404; }",
                     "location = /api/mail-templates.php { return 404; }",
                     "fastcgi_pass unix:/run/php/mindcoded-fpm.sock;", "location ~ \\.php$ { return 404; }"):
            self.assertIn(rule, nginx)
        pool = read("php-fpm/mindcoded.conf")
        for rule in ("env[MC_PRIVATE_DIR] = /srv/mindcoded/private", "php_admin_value[disable_functions]",
                     "php_admin_flag[allow_url_fopen] = off", "clear_env = yes"):
            self.assertIn(rule, pool)
        service = read("systemd/mindcoded-contact-cleanup.service")
        self.assertIn("ExecStart=/usr/bin/php /srv/mindcoded/current/api/contact.php --cleanup", service)
        self.assertIn("ReadWritePaths=/srv/mindcoded/private", service)
        self.assertIn("OnCalendar=hourly", read("systemd/mindcoded-contact-cleanup.timer"))
        dns = read("dns.txt")
        for record in ("MX     10 mail.example.com.", '"v=spf1 mx -all"', "_dmarc.example.com.", "→  mail.example.com"):
            self.assertIn(record, dns)
        self.assertFalse(self.dev_out.with_name(self.dev_out.name + "-server").exists(), "nur der Release erzeugt Serverkonfiguration")

    def test_contact_endpoint_modules_shipped_and_locked(self):
        for name in ("support", "config", "validate", "ratelimit", "challenge", "message", "smtp", "transport", "failures", "handler"):
            self.assertTrue((self.rel_out / "api" / "lib" / f"{name}.php").is_file(), name)
        self.assertEqual(self.read(self.rel_out, "api/lib/.htaccess").strip(), "Require all denied")

    def test_privacy_text_follows_mail_server(self):
        own = self.read(self.rel_out, "datenschutz/index.html")
        self.assertIn("meinem eigenen Mailserver", own)
        self.assertIn("nach 14 Tagen", own, "Löschfrist der Mailserver-Protokolle")
        self.assertNotIn("Resend", own)
        content = make_release_content(temp_dir("mc-test-hoster-"), mail_server="hoster")
        out = self.tmp / "hoster"
        site_build.build(release=True, out=out, content_dir=content)
        hoster = (out / "datenschutz" / "index.html").read_text(encoding="utf-8")
        self.assertIn("Mailserver meines Hosters", hoster)
        self.assertNotIn("meinem eigenen Mailserver", hoster)


class TestContentValidation(unittest.TestCase):
    """Unsichere Inhalte dürfen nie unbemerkt in die Ausgabe gelangen."""

    def build_with(self, mutate) -> list[str]:
        tmp = temp_dir("mc-test-validate-")
        try:
            content = tmp / "content"
            shutil.copytree(ROOT / "content", content)
            data = json.loads((content / "de.json").read_text(encoding="utf-8"))
            mutate(data)
            (content / "de.json").write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
            with self.assertRaises(site_build.BuildError) as ctx:
                site_build.build(release=False, out=tmp / "out", content_dir=content)
            return ctx.exception.problems
        finally:
            shutil.rmtree(tmp, ignore_errors=True)

    def test_unsafe_link_targets(self):
        for href in ("javascript:alert(1)", "//fremder-host.example.com", "/\\fremder-host", "data:text/html,x"):
            with self.subTest(href=href):
                def mutate(d, href=href):
                    d["hero"]["lead"] = f"Text mit [Link]({href})"
                problems = self.build_with(mutate)
                self.assertTrue(any("Unzulässiges Linkziel" in p for p in problems), problems)

    def test_path_traversal_in_slugs(self):
        def mutate(d):
            d["pages"]["thanks"]["slug"] = "../ausserhalb"
        self.assertTrue(any("ungültig" in p for p in self.build_with(mutate)))

    def test_nav_must_be_anchor(self):
        def mutate(d):
            d["nav"][0]["href"] = "javascript:alert(1)"
        self.assertTrue(any("nav" in p for p in self.build_with(mutate)))


class TestHtmlQuality(BuildFixtures):
    """Prüft jede erzeugte Seite (Release und Entwicklung)."""

    def each_page(self):
        for out in (self.rel_out, self.dev_out):
            for page in html_pages(out):
                yield out, page, Doc(page.read_text(encoding="utf-8"))

    def test_document_basics(self):
        for out, page, doc in self.each_page():
            with self.subTest(page=str(page.relative_to(out))):
                self.assertEqual((doc.doctype or "").lower(), "doctype html")
                html = doc.all("html")[0]
                expected = "en" if page.relative_to(out).parts[0] == "en" else "de"
                self.assertEqual(html.attrs.get("lang"), expected)
                title = doc.all("title")[0].all_text()
                self.assertTrue(title and title.lower() not in GENERIC_TITLES, title)
                desc = [m for m in doc.all("meta") if m.attrs.get("name") == "description"]
                self.assertEqual(len(desc), 1)
                self.assertTrue(40 <= len(desc[0].attrs["content"]) <= 170, desc[0].attrs["content"])
                self.assertTrue(any(m.attrs.get("name") == "viewport" for m in doc.all("meta")))

    def test_single_h1_and_heading_order(self):
        for out, page, doc in self.each_page():
            if page.name == "BETREIBER-TODO.html":
                continue
            with self.subTest(page=str(page.relative_to(out))):
                h1 = doc.all("h1")
                self.assertEqual(len(h1), 1)
                levels = [int(n.tag[1]) for n in doc.all() if re.fullmatch(r"h[1-6]", n.tag)]
                for prev, cur in itertools.pairwise(levels):
                    self.assertLessEqual(cur - prev, 1, f"Überschriften springen von h{prev} auf h{cur}")

    def test_home_h1_is_complete_without_js(self):
        for out, rel, text in ((self.rel_out, "index.html", "Websites, gemacht für Ihre Kunden."),
                               (self.rel_out, "en/index.html", "Websites, made for your customers.")):
            doc = Doc(self.read(out, rel))
            self.assertEqual(doc.all("h1")[0].all_text(), text)

    def test_core_content_in_initial_html(self):
        home = Doc(self.read(self.rel_out, "index.html"))
        text = home.root.all_text()
        de = json.loads((ROOT / "content" / "de.json").read_text(encoding="utf-8"))
        services = json.loads((ROOT / "content" / "services.json").read_text(encoding="utf-8"))["items"]
        for item in services:
            self.assertIn(item["de"]["title"], text)
            self.assertIn(item["de"]["desc"][:40], text)
        for step in de["process"]["steps"]:
            self.assertIn(step["title"], text)
        for field in ("cf-name", "cf-email", "cf-message"):
            self.assertIsNotNone(home.by_id(field))
        form = home.by_id("contact-form")
        self.assertEqual(form.attrs.get("method"), "post")
        self.assertTrue(form.attrs.get("action", "").endswith("api/contact.php"))

    def test_ids_unique_and_references_resolve(self):
        for out, page, doc in self.each_page():
            with self.subTest(page=str(page.relative_to(out))):
                ids = [n.attrs["id"] for n in doc.all() if "id" in n.attrs]
                self.assertEqual(len(ids), len(set(ids)), "doppelte IDs")
                known = set(ids)
                for n in doc.all():
                    for attr in ("aria-controls", "aria-labelledby", "aria-describedby", "for"):
                        for ref in (n.attrs.get(attr) or "").split():
                            self.assertIn(ref, known, f"{n.tag}[{attr}={ref}]")

    def test_links_and_assets_resolve(self):
        for out, page, doc in self.each_page():
            if page.name == "404.html":
                continue  # nutzt absolute Pfade ab Domain-Wurzel
            with self.subTest(page=str(page.relative_to(out))):
                for n in doc.all():
                    for attr in ("href", "src"):
                        url = n.attrs.get(attr)
                        if url is None or n.tag == "link" and n.attrs.get("rel") in ("canonical", "alternate"):
                            continue
                        self.assertNotIn(url.strip(), ("", "#"), f"leeres Ziel an <{n.tag}>")
                        self.assertFalse(url.lower().startswith("javascript:"))
                        parsed = urlparse(url)
                        if parsed.scheme in ("http", "https", "mailto"):
                            continue
                        if not parsed.path:
                            if parsed.fragment:
                                self.assertIsNotNone(doc.by_id(parsed.fragment), f"Anker #{parsed.fragment}")
                            continue
                        target = (page.parent / unquote(parsed.path)).resolve()
                        if target.is_dir() or parsed.path.endswith("/"):
                            target = target / "index.html"
                        self.assertTrue(target.is_file(), f"{url} → {target}")
                        if parsed.fragment and target.suffix == ".html":
                            self.assertIsNotNone(Doc(target.read_text(encoding="utf-8")).by_id(parsed.fragment), f"{url}")

    def test_csp_friendly_markup(self):
        for out, page, doc in self.each_page():
            with self.subTest(page=str(page.relative_to(out))):
                for n in doc.all():
                    self.assertNotIn("style", n.attrs, f"Inline-Style an <{n.tag}> (CSP)")
                    self.assertFalse(any(a.startswith("on") for a in n.attrs), f"Inline-Handler an <{n.tag}>")
                for script in doc.all("script"):
                    if "src" not in script.attrs:
                        self.assertIn(script.attrs.get("type"), ("application/json", "application/ld+json"))

    def test_accessible_names(self):
        for out, page, doc in self.each_page():
            with self.subTest(page=str(page.relative_to(out))):
                for n in doc.all():
                    if n.tag in ("button", "a") and "href" in n.attrs or n.tag == "button":
                        name = n.attrs.get("aria-label") or n.all_text()
                        self.assertTrue(name, f"<{n.tag}> ohne zugänglichen Namen: {n.attrs}")
                    if n.tag == "img":
                        self.assertIn("alt", n.attrs)
                        self.assertIn("width", n.attrs)
                        self.assertIn("height", n.attrs)
                    if n.tag in ("input", "textarea", "select") and n.attrs.get("type") != "hidden":
                        labelled = n.attrs.get("aria-label") or n.attrs.get("aria-labelledby")
                        has_for = any(lab.attrs.get("for") == n.attrs.get("id") for lab in doc.all("label"))
                        wrapped = False
                        parent = n.parent
                        while parent is not None:
                            if parent.tag == "label":
                                wrapped = True
                            parent = parent.parent
                        self.assertTrue(labelled or has_for or wrapped, f"Feld ohne Label: {n.attrs}")

    def test_accordions_have_state(self):
        home = Doc(self.read(self.dev_out, "index.html"))
        buttons = [n for n in home.all("button") if "aria-controls" in n.attrs and n.attrs["aria-controls"].startswith(("service-panel", "project-panel"))]
        self.assertGreaterEqual(len(buttons), 8)
        for btn in buttons:
            self.assertIn(btn.attrs.get("aria-expanded"), ("true", "false"))

    def test_legal_pages(self):
        imprint = self.read(self.rel_out, "impressum/index.html")
        privacy = self.read(self.rel_out, "datenschutz/index.html")
        self.assertIn("Max Mustermann", imprint)
        self.assertIn("§ 5 Digitale-Dienste-Gesetz", imprint)
        self.assertNotIn("Telefon:", imprint, "leere optionale Angaben müssen entfallen")
        for needle in ("mc-theme", "Art. 6 Abs. 1 lit. b DSGVO", "Art. 77 DSGVO", "Auftragsverarbeitung"):
            self.assertIn(needle, privacy)
        self.assertNotIn("sessionStorage", privacy, "das Intro kommt ohne Browser-Speicher aus")
        for out in (self.rel_out, self.dev_out):
            for page in html_pages(out):
                text = page.read_text(encoding="utf-8")
                self.assertNotIn("ec.europa.eu/consumers/odr", text, "OS-Plattform wurde 2025 eingestellt")
                self.assertNotIn("Cookie-Einstellungen", text)

    def test_footer_legal_links_everywhere(self):
        for out, page, doc in self.each_page():
            if page.name in ("404.html",):
                continue
            with self.subTest(page=str(page.relative_to(out))):
                hrefs = [a.attrs.get("href", "") for a in doc.all("a")]
                self.assertTrue(any(h.endswith("impressum/") for h in hrefs))
                self.assertTrue(any(h.endswith("datenschutz/") for h in hrefs))


class TestSingleSource(unittest.TestCase):
    """Farben und Breakpoints stehen nur in den CSS-Einstellungen – nicht zusätzlich im JavaScript."""

    def test_no_brand_colors_in_scripts(self):
        markers = {"#ff0000", "#00ff00"}  # interne Farbmarken der Formen-Rasterung, keine Markenfarben
        for script in (ROOT / "assets").glob("*.js"):
            found = {c.lower() for c in re.findall(r"#[0-9A-Fa-f]{6}\b", script.read_text(encoding="utf-8"))} - markers
            self.assertFalse(found, f"{script.name}: Farben {found} gehören als Token in assets/css/settings/tokens.css")

    def test_no_breakpoints_in_scripts(self):
        for script in (ROOT / "assets").glob("*.js"):
            text = script.read_text(encoding="utf-8")
            self.assertNotRegex(text, r"innerWidth\s*[<>]=?\s*\d{3,4}",
                                f"{script.name}: Breakpoint gehört nach assets/css/settings/media.css")


class TestCssArchitecture(unittest.TestCase):
    """Regeln für assets/css/ (Aufbau: docs/CSS.md) – ein kleiner Stylelint ohne Node.js."""

    MAX_LINES = 300
    IMPORTANT_ALLOWED = {"base/reset.css", "utilities/utilities.css", "overrides/reduced-motion.css", "overrides/print.css"}

    @classmethod
    def setUpClass(cls):
        cls.css_dir = site_build.CSS_DIR
        cls.modules = {p.relative_to(cls.css_dir).as_posix(): p.read_text(encoding="utf-8")
                       for p in sorted(cls.css_dir.rglob("*.css"))}
        cls.code = {name: site_build.strip_comments(text) for name, text in cls.modules.items()}

    @staticmethod
    def preludes(css: str) -> list[str]:
        """Selektoren aller Regeln (ohne At-Regeln)."""
        return [p.strip() for p in re.findall(r"([^{};]+)\{", css) if not p.strip().startswith("@")]

    def test_every_module_is_bundled(self):
        bundle = site_build.bundle_css()  # wirft BuildError bei fehlenden oder nicht eingebundenen Modulen
        for name in self.modules:
            if name != "main.css":
                self.assertIn(f"/* ── {name} ── */", bundle)

    def test_modules_are_documented_and_small(self):
        for name, text in self.modules.items():
            with self.subTest(module=name):
                self.assertTrue(text.startswith("/**"), "Jedes Modul beginnt mit einem Kommentar: Zweck und Aufbau")
                self.assertLessEqual(text.count("\n"), self.MAX_LINES, "Modul zu lang – nach Zuständigkeit teilen")

    def test_colors_only_in_tokens(self):
        for name, css in self.code.items():
            if name == "settings/tokens.css":
                continue
            with self.subTest(module=name):
                self.assertFalse(re.findall(r"#[0-9A-Fa-f]{3,8}\b|\b(?:rgba?|hsla?)\(", css),
                                 "Farbwerte gehören als Rolle in settings/tokens.css")

    def test_type_and_space_from_tokens(self):
        """Schriftgrößen und Abstände nur über --text-… und --space-… (Feinheiten unter 4 px erlaubt)."""
        spacing = r"(?<![\w-])((?:padding|margin|scroll-padding|scroll-margin)(?:-[a-z]+)*|gap|row-gap|column-gap)\s*:\s*([^;{}]+);"
        for name, css in self.code.items():
            if name.startswith("settings/") or name == "main.css":
                continue
            for value in re.findall(r"(?<![\w-])font-size\s*:\s*([^;{}]+);", css):
                with self.subTest(module=name, font_size=value):
                    self.assertRegex(value.strip(), r"^var\(--text-[\w-]+\)$", "Schriftgröße als Token aus settings/tokens.css")
            for prop, value in re.findall(spacing, css):
                with self.subTest(module=name, prop=prop, value=value):
                    self.assertNotRegex(value, r"(?<![\w.-])([4-9]|\d{2,})(\.\d+)?px|clamp\(",
                                        "Abstand als Token (--space-…) aus settings/tokens.css")

    def test_media_queries_use_custom_media(self):
        for name, css in self.code.items():
            if name == "settings/media.css":
                continue
            for prelude in re.findall(r"@media\s+([^{]+)\{", css):
                with self.subTest(module=name, media=prelude.strip()):
                    rest = re.sub(r"\(--[\w-]+\)|\b(?:and|or|not|only|print|screen|all)\b|,", "", prelude)
                    self.assertFalse(rest.strip(), "Breakpoints nur über @custom-media aus settings/media.css")

    def test_z_index_from_tokens(self):
        for name, css in self.code.items():
            for value in re.findall(r"z-index\s*:\s*([^;}]+)", css):
                with self.subTest(module=name, value=value):
                    self.assertRegex(value.strip(), r"^(var\(--z-[\w-]+\)|\d)$",
                                     "Seitenweite Ebenen über --z-…, innerhalb eines Bausteins 0–9")

    def test_important_only_where_intended(self):
        for name, css in self.code.items():
            if name not in self.IMPORTANT_ALLOWED:
                with self.subTest(module=name):
                    self.assertNotIn("!important", css, "Vorrang über Cascade Layers regeln, nicht über !important")

    def test_no_id_selectors(self):
        for name, css in self.code.items():
            for prelude in self.preludes(css):
                with self.subTest(module=name, selector=prelude):
                    self.assertNotRegex(re.sub(r"\[[^\]]*\]", "", prelude), r"#[A-Za-z_-]",
                                        "IDs sind Ankerpunkte für JavaScript – Gestaltung über Klassen")

    def test_custom_properties_defined_and_used(self):
        all_css = "\n".join(self.code.values())
        defined = set(re.findall(r"(--[\w-]+)\s*:", all_css))
        used = set(re.findall(r"var\(\s*(--[\w-]+)\s*\)", all_css))
        for name in sorted(used - defined):
            with self.subTest(variable=name):
                self.fail(f"var({name}) ohne Definition (Variablen aus JavaScript brauchen einen Ersatzwert)")
        readers = "\n".join(p.read_text(encoding="utf-8") for p in [*(ROOT / "assets").glob("*.js"), *(ROOT / "tools").rglob("*.py")])
        external = {f"--{n}" for n in re.findall(r"""['"](color-[\w-]+)['"]""", readers)}
        tokens = set(re.findall(r"(--[\w-]+)\s*:", self.code["settings/tokens.css"]))
        for name in sorted(tokens - used - external):
            with self.subTest(token=name):
                self.fail(f"Token {name} wird nirgends verwendet – entfernen")

    def test_minify_keeps_every_rule(self):
        bundle = site_build.bundle_css()
        minified = site_build.minify_css(bundle)
        squash = lambda s: re.sub(r"\s+", "", s)  # noqa: E731
        self.assertEqual(squash(minified), squash(site_build.strip_comments(bundle)))
        self.assertEqual(minified, site_build.minify_css(minified))
        self.assertIn('"✓"', minified, "Zeichenketten bleiben unverändert")
        self.assertIn(".site-header.is-floating .site-header-inner{", minified, "Nachfahren-Kombinator bleibt")
        self.assertIn("calc(100% - var(--header-h) - 40px - 72px)", minified, "Leerzeichen in calc() bleiben")


class TestDesignTokens(unittest.TestCase):
    """Misst die Kontraste der Farb-Tokens aus assets/css/settings/tokens.css (WCAG 2.2 AA)."""

    @staticmethod
    def ratio(a: str, b: str) -> float:
        def lum(h):
            rgb = [int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)]
            rgb = [c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4 for c in rgb]
            return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]
        hi, lo = sorted((lum(a), lum(b)), reverse=True)
        return (hi + 0.05) / (lo + 0.05)

    def test_contrast(self):
        tokens = site_build.load_tokens()
        light, dark = tokens["light"], tokens["dark"]
        checks = [
            # (Vordergrund, Hintergrund, Mindestwert, Verwendung)
            ("ink", "bg", 4.5, "Fließtext"), ("muted", "bg", 4.5, "Zweittext"), ("dim", "bg", 4.5, "kleine Labels"),
            ("dim", "card", 4.5, "Labels auf Karten"), ("accent-text", "bg", 4.5, "kleiner Akzenttext"),
            ("focus", "bg", 3.0, "Fokusrahmen"), ("accent", "bg", 3.0, "große Akzentschrift"),
            ("btn-fg", "btn", 4.5, "Buttons"),
            ("navy-muted", "navy", 4.5, "Text Kontakt"), ("navy-dim", "navy", 4.5, "Labels Kontakt"),
            ("navy-field", "navy", 3.0, "Feldgrenzen"), ("navy-fg", "navy", 4.5, "Text Kontakt"),
            ("error-navy", "navy", 4.5, "Fehlermeldungen"), ("navy-inverse-fg", "navy-inverse", 4.5, "Button Kontakt"),
            ("on-accent", "accent", 3.0, "Pfeile auf Akzent (Symbol)"), ("todo-ink", "todo", 4.5, "Entwicklungs-Hinweise"),
        ]
        for theme, tokens in (("hell", light), ("dunkel", dark)):
            for fg, bg, minimum, usage in checks:
                with self.subTest(theme=theme, pair=f"{fg}/{bg}"):
                    value = self.ratio(tokens[f"color-{fg}"], tokens[f"color-{bg}"])
                    self.assertGreaterEqual(value, minimum, f"{usage}: {value:.2f}:1")


if __name__ == "__main__":
    unittest.main()
