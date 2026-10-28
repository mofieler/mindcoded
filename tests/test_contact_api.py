"""Vertragstests für den Formular-Endpunkt.

Standard: gegen den Python-Mock (tools/serve.py) – ohne PHP, ohne Node.
Gegen den echten PHP-Endpunkt (z. B. »php -S«):
    set MC_API_URL=http://127.0.0.1:8080/api/contact.php
    python -m unittest tests.test_contact_api -v
Dafür muss contact.php mit transport »file« konfiguriert sein (siehe README › Formular lokal testen)
und MC_RATE_LIMIT_MAX=1000 gesetzt sein; der Rate-Limit-Test läuft nur gegen den Mock.
"""
from __future__ import annotations

import base64
import json
import os
import shutil
import unittest
import urllib.error
import urllib.parse
import urllib.request

from tests.support import Server, site_build, site_serve, temp_dir

solve_challenge = site_serve.solve_challenge

# Synthetische Werte aus reservierten Bereichen (RFC 2606 / freigegebener Platzhalter).
VALID = {
    "name": "Max Mustermann",
    "email": "max.mustermann@example.com",
    "message": "Synthetische Testnachricht für den Vertragstest.",
    "topics[]": ["website", "audit"],
    "timeline": "asap",
    "lang": "de",
}


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs):
        return None


def fetch_challenge(url) -> dict:
    req = urllib.request.Request(url + "?challenge", headers={"Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=10) as res:
        return json.loads(res.read().decode("utf-8"))


def solved(url) -> str:
    """Frisch ausgegebene und gelöste Rechenaufgabe (Feld »altcha«)."""
    return solve_challenge(fetch_challenge(url))


def post(url, fields, *, json_accept=True, headers=None, raw: bytes | None = None):
    body = raw if raw is not None else urllib.parse.urlencode(fields, doseq=True).encode()
    req = urllib.request.Request(url, data=body, method="POST")
    req.add_header("Content-Type", "application/x-www-form-urlencoded")
    if json_accept:
        req.add_header("Accept", "application/json")
    for key, value in (headers or {}).items():
        req.add_header(key, value)
    opener = urllib.request.build_opener(NoRedirect)
    try:
        with opener.open(req, timeout=10) as res:
            return res.status, dict(res.headers), res.read()
    except urllib.error.HTTPError as err:
        with err:
            return err.code, dict(err.headers), err.read()


class ContactApiContract(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.external = os.environ.get("MC_API_URL")
        cls.tmp = temp_dir("mc-test-api-")
        if cls.external:
            cls.url = cls.external
            cls.server = None
        else:
            out = cls.tmp / "dist"
            site_build.build(release=False, out=out)
            cls.server = Server(out).__enter__()
            cls.url = cls.server.url + "api/contact.php"

    @classmethod
    def tearDownClass(cls):
        if cls.server:
            cls.server.__exit__(None, None, None)
        shutil.rmtree(cls.tmp, ignore_errors=True)

    def accepted(self) -> int | None:
        return self.server.httpd.api.accepted if self.server else None

    def json(self, body: bytes) -> dict:
        return json.loads(body.decode("utf-8"))

    def valid(self, **override):
        data = {**VALID, "elapsed": "10000", "altcha": solved(self.url)}
        data.update(override)
        return data

    def test_challenge_is_issued(self):
        task = fetch_challenge(self.url)
        self.assertEqual(task["algorithm"], "SHA-256")
        self.assertRegex(task["challenge"], r"^[0-9a-f]{64}$")
        self.assertRegex(task["salt"], r"\?expires=\d+$")
        self.assertRegex(task["signature"], r"^[0-9a-f]{64}$")
        self.assertGreater(task["maxnumber"], 0)

    def test_missing_or_forged_challenge_is_rejected(self):
        task = fetch_challenge(self.url)
        forged = json.loads(base64.b64decode(solve_challenge(task)))
        cases = {
            "fehlt": "",
            "kein Base64": "%%%",
            "falsche Zahl": {**forged, "number": forged["number"] + 1},
            "falsche Signatur": {**forged, "signature": "0" * 64},
            "verlängert": {**forged, "salt": forged["salt"].rsplit("=", 1)[0] + "=9999999999"},
        }
        for label, value in cases.items():
            with self.subTest(label):
                encoded = value if isinstance(value, str) else base64.b64encode(json.dumps(value).encode()).decode()
                before = self.accepted()
                status, _, body = post(self.url, self.valid(altcha=encoded))
                self.assertEqual(status, 422)
                self.assertEqual(self.json(body)["error"], "challenge")
                if before is not None:
                    self.assertEqual(self.accepted(), before)

    def test_solution_is_valid_only_once(self):
        solution = solved(self.url)
        self.assertEqual(post(self.url, self.valid(altcha=solution))[0], 200)
        status, _, body = post(self.url, self.valid(altcha=solution))
        self.assertEqual(status, 422)
        self.assertEqual(self.json(body)["error"], "challenge")

    def test_get_is_rejected(self):
        req = urllib.request.Request(self.url, headers={"Accept": "application/json"})
        with self.assertRaises(urllib.error.HTTPError) as ctx:
            urllib.request.urlopen(req, timeout=10)
        with ctx.exception as err:
            self.assertEqual(err.code, 405)
            self.assertIn("POST", err.headers.get("Allow", ""))

    def test_valid_submission_is_confirmed(self):
        before = self.accepted()
        status, _, body = post(self.url, self.valid())
        self.assertEqual(status, 200)
        self.assertEqual(self.json(body), {"ok": True})
        if before is not None:
            self.assertEqual(self.accepted(), before + 1)

    def test_empty_submission_is_rejected_server_side(self):
        status, _, body = post(self.url, {"lang": "de", "altcha": solved(self.url)})
        self.assertEqual(status, 422)
        data = self.json(body)
        self.assertFalse(data["ok"])
        self.assertEqual(data["fields"], {"name": "required", "email": "required", "message": "required"})

    def test_field_rules(self):
        cases = [
            ({"email": "keine-adresse"}, "email", "invalid"),
            ({"message": "kurz"}, "message", "too_short"),
            ({"message": "x" * 5001}, "message", "too_long"),
            ({"name": "N" * 101}, "name", "too_long"),
            ({"topics[]": ["website", "erfunden"]}, "topics", "invalid"),
            ({"timeline": "gestern"}, "timeline", "invalid"),
        ]
        for override, field, code in cases:
            with self.subTest(field=field, code=code):
                status, _, body = post(self.url, self.valid(**override))
                self.assertEqual(status, 422)
                self.assertEqual(self.json(body)["fields"].get(field), code)

    def test_header_injection_is_neutralised(self):
        status, _, body = post(self.url, self.valid(email="max.mustermann@example.com\r\nBcc: x@example.com"))
        self.assertEqual(status, 422)
        self.assertEqual(self.json(body)["fields"]["email"], "invalid")

    def test_honeypot_is_silently_dropped(self):
        before = self.accepted()
        status, _, body = post(self.url, self.valid(website="https://spam.example.com"))
        self.assertEqual(status, 200)
        self.assertEqual(self.json(body), {"ok": True})
        if before is not None:
            self.assertEqual(self.accepted(), before, "Honeypot-Treffer dürfen nicht zugestellt werden")

    def test_too_fast_submission_is_dropped(self):
        before = self.accepted()
        status, _, _ = post(self.url, self.valid(elapsed="800"))
        self.assertEqual(status, 200)
        if before is not None:
            self.assertEqual(self.accepted(), before)

    def test_odd_timing_values_never_drop_real_messages(self):
        # Fehlende oder unplausible Werte (z. B. von falsch gehenden Uhren) gelten nicht als Spam.
        for value in ("", "-5000", "abc"):
            with self.subTest(elapsed=value):
                before = self.accepted()
                status, _, body = post(self.url, self.valid(elapsed=value))
                self.assertEqual(status, 200)
                if before is not None:
                    self.assertEqual(self.accepted(), before + 1)

    def test_foreign_origin_is_rejected(self):
        for headers in ({"Origin": "https://evil.example.com"}, {"Origin": "null"},
                        {"Sec-Fetch-Site": "cross-site"}, {"Sec-Fetch-Site": "same-site"}):
            with self.subTest(headers=headers):
                status, _, _ = post(self.url, self.valid(), headers=headers)
                self.assertEqual(status, 403)

    def test_same_origin_is_accepted(self):
        host = urllib.parse.urlparse(self.url)
        status, _, _ = post(self.url, self.valid(), headers={"Origin": f"{host.scheme}://{host.netloc}", "Sec-Fetch-Site": "same-origin"})
        self.assertEqual(status, 200)

    def test_nested_values_are_rejected_cleanly(self):
        altcha = urllib.parse.urlencode({"altcha": solved(self.url)}).encode()
        status, _, body = post(self.url, None, raw=b"name[]=x&email[]=y&message[]=z&website[]=&topics[][]=a&lang=de&" + altcha)
        self.assertEqual(status, 422)
        self.assertEqual(self.json(body)["error"], "validation")

    def test_oversized_body_is_rejected(self):
        status, _, _ = post(self.url, None, raw=b"message=" + b"x" * 21000)
        self.assertEqual(status, 413)

    def test_no_js_post_redirects(self):
        for lang, success, error in (("de", "kontakt/danke/", "kontakt/fehler/"), ("en", "en/contact/thanks/", "en/contact/error/")):
            with self.subTest(lang=lang):
                status, headers, _ = post(self.url, self.valid(lang=lang), json_accept=False)
                self.assertEqual(status, 303)
                self.assertTrue(headers["Location"].endswith(success), headers["Location"])
                status, headers, _ = post(self.url, {"lang": lang, "altcha": solved(self.url)}, json_accept=False)
                self.assertEqual(status, 303)
                self.assertTrue(headers["Location"].endswith(error), headers["Location"])


@unittest.skipIf(os.environ.get("MC_API_URL"), "Rate-Limit-Test nur gegen den Mock")
class ContactApiRateLimit(unittest.TestCase):
    def test_rate_limit(self):
        tmp = temp_dir("mc-test-rate-")
        out = tmp / "dist"
        site_build.build(release=False, out=out)
        try:
            with Server(out, rate_max=None) as server:
                url = server.url + "api/contact.php"
                limit = server.httpd.api.settings["rate_limit"]["max"]
                data = {**VALID, "elapsed": "10000"}
                for _ in range(limit):
                    self.assertEqual(post(url, {**data, "altcha": solved(url)})[0], 200)
                status, _, body = post(url, {**data, "altcha": solved(url)})
                self.assertEqual(status, 429)
                self.assertEqual(json.loads(body)["error"], "rate_limited")
        finally:
            shutil.rmtree(tmp, ignore_errors=True)


if __name__ == "__main__":
    unittest.main()
