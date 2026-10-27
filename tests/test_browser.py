"""Browser-Tests mit Microsoft Edge / Chrome headless – ohne Node.js.

Wird übersprungen, wenn kein Edge/Chrome gefunden wird (Pfad über MC_BROWSER setzbar).
"""
from __future__ import annotations

import json
import re
import shutil
import unittest

from tests.support import ROOT, Server, site_build, temp_dir

# isort: split
import edge  # tools/edge.py (über tests.support im Suchpfad)

BROWSER = edge.find_browser()


@unittest.skipUnless(BROWSER, "Kein Edge/Chrome gefunden – Browser-Tests übersprungen")
class BrowserTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = temp_dir("mc-test-browser-")
        cls.out = cls.tmp / "dist"
        site_build.build(release=False, out=cls.out)
        shutil.copytree(ROOT / "tests" / "browser", cls.out / "__tests__")
        cls.server = Server(cls.out, frameable=True).__enter__()

    @classmethod
    def tearDownClass(cls):
        cls.server.__exit__(None, None, None)
        shutil.rmtree(cls.tmp, ignore_errors=True)

    def dom(self, path: str, **kwargs) -> str:
        html = edge.dump_dom(self.server.url + path, **kwargs)
        self.assertTrue(html.strip(), f"Leeres DOM für {path}")
        return html

    def html_attr(self, html: str, name: str) -> str | None:
        tag = re.search(r"<html[^>]*>", html).group(0)
        m = re.search(rf'{name}="([^"]*)"', tag)
        return m.group(1) if m else None

    def test_js_unit_tests(self):
        html = self.dom("__tests__/unit.html", wait_ms=2000)
        result = json.loads(re.search(r'<pre id="result">(.*?)</pre>', html, re.S).group(1))
        self.assertEqual(result["failed"], 0, result["failures"])
        self.assertGreaterEqual(result["passed"], 13)

    def test_layout_fits_phone_tablet_desktop(self):
        html = self.dom("__tests__/layout.html", wait_ms=60000)
        result = json.loads(re.search(r'<pre id="result">(.*?)</pre>', html, re.S).group(1))
        self.assertEqual(result["checked"], 35)
        self.assertEqual(result["problems"], [], json.dumps(result["problems"], ensure_ascii=False, indent=1))

    def test_curtain_transition(self):
        """Vorhang beim Projektwechsel: Eingang, Ausgang mit Titel des Ziels, Seite darunter inert."""
        html = self.dom("__tests__/motion.html", wait_ms=30000)
        result = json.loads(re.search(r'<pre id="result">(.*?)</pre>', html, re.S).group(1))
        self.assertEqual(result["problems"], [], json.dumps(result["problems"], ensure_ascii=False, indent=1))

    def test_accessibility_wcag_aa(self):
        """axe-core gegen WCAG 2.0/2.1/2.2 A und AA auf jeder Seitenart (tests/browser/a11y.js)."""
        html = self.dom("__tests__/a11y.html", wait_ms=90000)
        result = json.loads(re.search(r'<pre id="result">(.*?)</pre>', html, re.S).group(1))
        self.assertEqual(result["checked"], 9)
        self.assertEqual(result["violations"], [], json.dumps(result["violations"], ensure_ascii=False, indent=1))

    def test_app_boots_without_errors_on_every_page_type(self):
        for path in ("", "en/", "projekte/paquita-pilates/", "leistungen/websites/", "en/services/websites/",
                     "impressum/", "datenschutz/", "kontakt/danke/", "404.html"):
            with self.subTest(path=path or "/"):
                html = self.dom(path)
                self.assertEqual(self.html_attr(html, "data-app"), "ready", self.html_attr(html, "data-app-errors"))
                self.assertIn("js", self.html_attr(html, "class") or "")

    def test_h1_stays_stable_for_assistive_tech(self):
        html = self.dom("")
        self.assertRegex(html, r'class="typed-row" aria-hidden="true"')
        self.assertIn('<span class="visually-hidden">Ihre Kunden.</span>', html)

    def test_without_javascript_page_renders(self):
        # Edge headless kann bei abgeschaltetem JavaScript keinen Screenshot erzeugen. Gleichwertig:
        # dieselbe Seite ohne <script>-Tags – dann laufen weder theme-init.js noch app.js.
        html = (self.out / "index.html").read_text(encoding="utf-8")
        stripped = re.sub(r"<script\b[^>]*>.*?</script>", "", html, flags=re.S)
        self.assertIn('class="no-js"', stripped)
        (self.out / "nojs-preview.html").write_text(stripped, encoding="utf-8")
        shot = edge.screenshot(self.server.url + "nojs-preview.html", self.tmp / "nojs.png", width=1280, height=3000)
        self.assertGreater(shot.stat().st_size, 60_000, "Seite ohne JavaScript wirkt leer")

    def test_start_intro_hides_text_then_reveals(self):
        # Früh = vor dem ersten Animationsbild: theme-init.js entscheidet synchron im <head>. Mit mehr
        # Wartezeit wäre der Test zufällig – solange Dateien laden, hält Headless-Chrome die virtuelle
        # Zeit an, zeichnet aber weiter Bilder mit echten Zeitstempeln, und die Intro-Uhr läuft ab.
        early = edge.dump_dom(self.server.url + "?intro", wait_ms=1)
        self.assertIn("intro-pending", self.html_attr(early, "class") or "")
        late = edge.dump_dom(self.server.url + "?intro", wait_ms=8000)
        self.assertNotIn("intro-pending", self.html_attr(late, "class") or "")
        self.assertRegex(late, r'id="hero" class="hero-section intro-complete"')

    def test_no_intro_on_deep_link_or_subpages(self):
        html = edge.dump_dom(self.server.url + "#kontakt", wait_ms=300)
        self.assertNotIn("intro-pending", self.html_attr(html, "class") or "")
        html = edge.dump_dom(self.server.url + "impressum/", wait_ms=300)
        self.assertNotIn("intro-pending", self.html_attr(html, "class") or "")

    def test_make_images_creates_webp_variants(self):
        import struct
        import zlib

        import make_images  # tools/make_images.py

        def chunk(kind, data):
            return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data) & 0xFFFFFFFF)

        w, h = 1000, 600  # synthetischer Farbverlauf als Quelle
        raw = b"".join(b"\x00" + bytes(v for x in range(w) for v in (x * 255 // w, y * 255 // h, 128)) for y in range(h))
        src = self.tmp / "quelle.png"
        src.write_bytes(b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0))
                        + chunk(b"IDAT", zlib.compress(raw)) + chunk(b"IEND", b""))

        encoded = make_images.encode([src], [400, 800, 1600], 0.8)[0]
        self.assertEqual([(v["width"], v["height"]) for v in encoded["variants"]], [(400, 240), (800, 480), (1000, 600)],
                         "kleinere Breiten plus Originalbreite, nie hochskaliert")
        for variant in encoded["variants"]:
            self.assertEqual((variant["bytes"][:4], variant["bytes"][8:12]), (b"RIFF", b"WEBP"))
        image = make_images.write_variants("test-projekt", src, encoded, self.tmp / "bilder")
        self.assertEqual((image["src"], image["width"], image["height"]), ("projects/test-projekt/quelle-1000.webp", 1000, 600))
        self.assertEqual([s["width"] for s in image["srcset"]], [800, 400])
        self.assertIn("TODO", image["alt"]["de"])
        self.assertTrue((self.tmp / "bilder" / "test-projekt" / "quelle-400.webp").is_file())

    def test_reduced_motion_starts_paused(self):
        html = edge.dump_dom(self.server.url, extra_args=["--force-prefers-reduced-motion"])
        self.assertIn("motion-paused", self.html_attr(html, "class") or "")
        toggles = re.findall(r"<button[^>]*data-motion-toggle[^>]*>", html)
        self.assertTrue(toggles)
        for tag in toggles:
            self.assertIn('aria-pressed="true"', tag)


if __name__ == "__main__":
    unittest.main()
