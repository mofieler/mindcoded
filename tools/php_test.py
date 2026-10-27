#!/usr/bin/env python3
"""Testet den echten PHP-Endpunkt api/contact.php – ohne Node.js, ohne echten Mailserver.

  python tools/php_test.py

Voraussetzung: PHP 8.1+ im PATH (oder Pfad über MC_PHP). Auch auf dem VPS ausführbar
(python3 tools/php_test.py im ausgecheckten Projekt). Alles läuft lokal, nichts verlässt den Rechner:

  1. Formular-Vertrag (tests/test_contact_api.py) mit transport »file« – angenommene Anfragen
     landen als .eml-Datei in einem Temp-Ordner
  2. SMTP-Versand an einen lokalen Test-Mailserver (tests/smtp_server.py): Kopfzeilen,
     Absender, Antwortadresse, Message-ID, Kodierung
  3. SMTP-Fehler (Server lehnt ab) → 502 und Eintrag im Zustellfehler-Protokoll
  4. Wartung: --check und --cleanup (meldet den Fehler aus Schritt 3 mit Exit-Code 2)
"""
from __future__ import annotations

import base64
import email
import json
import os
import shutil
import socket
import subprocess
import sys
import tempfile
import time
import unittest
import urllib.error
import urllib.request
from contextlib import contextmanager
from pathlib import Path
from urllib.parse import urlencode

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))
sys.path.insert(0, str(ROOT))
import build as site_build  # noqa: E402

from tests.smtp_server import FakeSmtpServer  # noqa: E402

# Synthetische Adressen aus dem reservierten Bereich example.com (RFC 2606).
SENDER = "formular@example.com"
INBOX = "postfach@example.com"
VISITOR = "max.mustermann@example.com"
FILE_CONFIG = """<?php
declare(strict_types=1);
return [
    'to' => '{inbox}',
    'from' => '{sender}',
    'transport' => 'file',
    'outbox_dir' => {outbox},
];
"""


def free_port() -> int:
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


@contextmanager
def php_server(php: str, out: Path, env: dict):
    port = free_port()
    proc = subprocess.Popen([php, "-S", f"127.0.0.1:{port}", "-t", str(out)], env=env,
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        for _ in range(50):
            try:
                socket.create_connection(("127.0.0.1", port), timeout=0.2).close()
                break
            except OSError:
                time.sleep(0.1)
        yield f"http://127.0.0.1:{port}"
    finally:
        proc.terminate()
        proc.wait(timeout=5)


def post_form(base: str) -> tuple[int, dict]:
    body = urlencode({"name": "Max Mustermann", "email": VISITOR, "message": "Synthetische Testanfrage mit Umlauten: äöü.",
                      "topics[]": "website", "lang": "de", "elapsed": "5000"}).encode()
    req = urllib.request.Request(f"{base}/api/contact.php", data=body, method="POST", headers={
        "Accept": "application/json", "Content-Type": "application/x-www-form-urlencoded",
        "Origin": base, "Sec-Fetch-Site": "same-origin"})
    try:
        with urllib.request.urlopen(req, timeout=20) as res:
            return res.status, json.loads(res.read())
    except urllib.error.HTTPError as err:
        return err.code, json.loads(err.read() or b"{}")


class Check:
    def __init__(self):
        self.failed = 0

    def __call__(self, ok: bool, label: str) -> None:
        print(f"  {'✓' if ok else '✗'} {label}")
        self.failed += 0 if ok else 1


def main() -> int:
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8")
    php = os.environ.get("MC_PHP") or shutil.which("php")
    if not php:
        print("PHP nicht gefunden. Installation z. B.: winget install PHP.PHP.8.4 – oder Pfad in MC_PHP setzen.")
        return 2
    version = subprocess.run([php, "-r", "echo PHP_VERSION;"], capture_output=True, text=True).stdout.strip()
    print(f"PHP {version}")

    tmp = Path(tempfile.mkdtemp(prefix="mc-php-"))
    out, private, outbox = tmp / "dist", tmp / "private", tmp / "outbox"
    private.mkdir()
    site_build.build(release=False, out=out)
    (private / "contact-config.php").write_text(
        FILE_CONFIG.format(inbox=INBOX, sender=SENDER, outbox=repr(str(outbox)).replace('"', "'")), encoding="utf-8")
    base_env = {**os.environ, "MC_PRIVATE_DIR": str(private), "MC_RATE_LIMIT_MAX": "1000"}
    check = Check()
    try:
        print("\n1. Formular-Vertrag (transport file)")
        with php_server(php, out, base_env) as base:
            os.environ["MC_API_URL"] = f"{base}/api/contact.php"
            suite = unittest.defaultTestLoader.loadTestsFromName("tests.test_contact_api")
            result = unittest.TextTestRunner(verbosity=1).run(suite)
        mails = sorted(outbox.glob("*.eml")) if outbox.exists() else []
        check(result.wasSuccessful(), "alle Vertragstests")
        check(bool(mails), f"{len(mails)} angenommene Nachricht(en) im Test-Postausgang")

        smtp_env = {**base_env, "MC_CONTACT_TRANSPORT": "smtp", "MC_SMTP_HOST": "127.0.0.1",
                    "MC_SMTP_SECURITY": "none", "MC_SMTP_HELO": "web.example.com"}

        print("\n2. SMTP-Versand an den Test-Mailserver")
        with FakeSmtpServer() as smtp, php_server(php, out, {**smtp_env, "MC_SMTP_PORT": str(smtp.port)}) as base:
            status, body = post_form(base)
        check(status == 200 and body.get("ok") is True, f"Antwort 200 ok (erhalten: {status} {body})")
        check(len(smtp.messages) == 1, "genau eine Nachricht angenommen")
        if smtp.messages:
            received = smtp.messages[0]
            msg = email.message_from_bytes(received.data)
            check(received.mail_from == SENDER and received.rcpt_to == [INBOX], "Envelope: eigene Adresse → Postfach")
            check(SENDER in msg["From"] and "Kontaktformular" in msg["From"], "From: eigene Adresse mit Anzeigename")
            check(msg["Reply-To"] == f"<{VISITOR}>", "Reply-To: Adresse des Besuchers")
            check(bool(msg["Message-ID"]) and msg["Message-ID"].endswith("@example.com>"), "Message-ID mit eigener Domain")
            check(bool(msg["Date"]), "Date gesetzt")
            check(msg["Auto-Submitted"] == "auto-generated", "Auto-Submitted gesetzt")
            text = base64.b64decode(msg.get_payload()).decode("utf-8")
            check("Max Mustermann" in text and "äöü" in text, "Text vollständig, UTF-8 korrekt")
            check(b"\r\n" in received.data and b"\n\n" not in received.data.replace(b"\r\n", b""), "CRLF-Zeilenenden")

        print("\n3. SMTP-Fehler: Server lehnt den Empfänger ab")
        with FakeSmtpServer(reject_rcpt=True) as smtp, php_server(php, out, {**smtp_env, "MC_SMTP_PORT": str(smtp.port)}) as base:
            status, body = post_form(base)
        check(status == 502 and body.get("error") == "send_failed", f"Antwort 502 send_failed (erhalten: {status})")
        log = private / "zustellfehler.log"
        check(log.exists() and "send_failed:smtp" in log.read_text(encoding="utf-8"), "Eintrag im Zustellfehler-Protokoll")

        print("\n4. Wartungsbefehle")
        script = str(out / "api" / "contact.php")
        cli_env = {**base_env, "MC_CONTACT_TRANSPORT": "smtp", "MC_SMTP_HOST": "mail.example.com",
                   "MC_SMTP_SECURITY": "tls", "MC_CONTACT_TO": INBOX, "MC_CONTACT_FROM": SENDER}
        checked = subprocess.run([php, script, "--check"], env=cli_env, capture_output=True, text=True, encoding="utf-8")
        check(checked.returncode == 0 and "Bereit" in checked.stdout, "--check meldet »Bereit«")
        insecure = subprocess.run([php, script, "--check"], env={**cli_env, "MC_SMTP_SECURITY": "none"},
                                  capture_output=True, text=True, encoding="utf-8")
        check(insecure.returncode == 1, "--check lehnt unverschlüsseltes SMTP außerhalb von Tests ab")
        cleanup = subprocess.run([php, script, "--cleanup"], env=cli_env, capture_output=True, text=True, encoding="utf-8")
        check(cleanup.returncode == 2 and "ACHTUNG" in cleanup.stdout, "--cleanup meldet den Zustellfehler (Exit-Code 2)")
        usage = subprocess.run([php, script], env=cli_env, capture_output=True, text=True, encoding="utf-8")
        check(usage.returncode == 1 and "--send-test" in usage.stderr, "ohne Befehl: Hilfe")
    finally:
        shutil.rmtree(tmp, ignore_errors=True)

    print(f"\n{'Alles bestanden.' if not check.failed else f'{check.failed} Prüfung(en) fehlgeschlagen.'}")
    return 1 if check.failed else 0


if __name__ == "__main__":
    sys.exit(main())
