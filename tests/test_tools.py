"""Werkzeuge: Upload (tools/deploy.py) mit FTP-Double, Test-Mailserver für php_test.py."""
from __future__ import annotations

import ftplib
import json
import shutil
import smtplib
import unittest

import deploy  # tools/deploy.py (über tests.support im Suchpfad)

from tests.smtp_server import FakeSmtpServer
from tests.support import site_build, temp_dir

SENDER = "formular@example.com"
INBOX = "postfach@example.com"


class FakeSmtpServerTests(unittest.TestCase):
    """Der Test-Mailserver muss sich wie ein echter verhalten – sonst wäre php_test.py wertlos."""

    def test_accepts_message_and_undoes_dot_stuffing(self):
        with FakeSmtpServer() as server, smtplib.SMTP("127.0.0.1", server.port, timeout=5) as client:
            client.sendmail(SENDER, [INBOX], b"Subject: Test\r\n\r\nZeile\r\n.Punkt am Anfang\r\n")
        self.assertEqual(len(server.messages), 1)
        msg = server.messages[0]
        self.assertEqual((msg.mail_from, msg.rcpt_to), (SENDER, [INBOX]))
        self.assertIn(b"\r\n.Punkt am Anfang\r\n", msg.data)

    def test_can_reject_recipients(self):
        with (FakeSmtpServer(reject_rcpt=True) as server, smtplib.SMTP("127.0.0.1", server.port, timeout=5) as client,
              self.assertRaises(smtplib.SMTPRecipientsRefused)):
            client.sendmail(SENDER, [INBOX], b"x")
        self.assertEqual(server.messages, [])


class SshDeployTests(unittest.TestCase):
    """Releases per SSH: Archiv, Server-Skript und Aufruf – ohne echten Server."""

    def setUp(self):
        self.tmp = temp_dir("mc-test-ssh-")
        self.dist = self.tmp / "dist"
        site_build.build(release=False, out=self.dist)

    def tearDown(self):
        shutil.rmtree(self.tmp, ignore_errors=True)

    def test_archive_contains_site_without_marker(self):
        import io
        import tarfile
        with tarfile.open(fileobj=io.BytesIO(deploy.build_archive(self.dist)), mode="r:gz") as tar:
            members = {m.name: m for m in tar.getmembers()}
        self.assertIn("index.html", members)
        self.assertIn("api/contact.php", members)
        self.assertNotIn(deploy.BUILD_MARKER, members)
        self.assertEqual(members["index.html"].mode, 0o644)
        self.assertEqual(members["api"].mode, 0o755)
        self.assertTrue(all(not m.name.startswith(("/", "..")) for m in members.values()), "nur relative Pfade")

    def test_release_script_switches_atomically_and_keeps_five(self):
        script = deploy.release_script("/srv/mindcoded", "20261019-120000")
        self.assertIn("set -eu", script)
        self.assertIn('tar -xzf - -C "$REL" --no-same-owner', script)
        self.assertIn('test -f "$REL/index.html"', script, "erst prüfen, dann umschalten")
        self.assertIn('mv -Tf "$ROOT/current.tmp" "$ROOT/current"', script)
        self.assertIn("tail -n +6", script)
        self.assertLess(script.index("test -f"), script.index("mv -Tf"))
        self.assertIn("ROOT='/srv/mindcoded dir'", deploy.release_script("/srv/mindcoded dir", "x"), "Pfad sicher maskiert")

    def test_ssh_deploy_sends_archive_to_server(self):
        calls = []

        def fake_run(cmd, input=None):
            calls.append((cmd, input))
            return type("Result", (), {"returncode": 0})()

        code = deploy.ssh_deploy(self.dist, "mindcoded@server", "/srv/mindcoded", run=fake_run, out=lambda *_: None)
        self.assertEqual(code, 0)
        cmd, data = calls[0]
        self.assertIn("BatchMode=yes", cmd, "nie interaktiv nach Passwörtern fragen")
        self.assertEqual(cmd[-2], "mindcoded@server")
        self.assertIn("mv -Tf", cmd[-1])
        self.assertEqual(data[:2], b"\x1f\x8b", "gzip-Archiv über stdin")

        calls.clear()
        deploy.ssh_deploy(self.dist, "mindcoded@server", "/srv/mindcoded", rollback=True, run=fake_run, out=lambda *_: None)
        self.assertIn("readlink -f", calls[0][0][-1])
        self.assertIsNone(calls[0][1])

        calls.clear()
        deploy.ssh_deploy(self.dist, "mindcoded@server", "/srv/mindcoded", dry_run=True, run=fake_run, out=lambda *_: None)
        self.assertEqual(calls, [], "Probelauf überträgt nichts")
        for bad in ("server", "root@server; rm -rf /", "-oProxyCommand=x@server"):
            with self.assertRaises(deploy.DeployError):
                deploy.ssh_deploy(self.dist, bad, "/srv/mindcoded", run=fake_run, out=lambda *_: None)


class FakeFTP:
    """Minimaler FTP-Server im Speicher: Dateien als {Pfad: Bytes}, Verzeichnisse als Menge."""

    def __init__(self, files: dict[str, bytes] | None = None):
        self.files = dict(files or {})
        self.dirs: set[str] = set()
        self.log: list[str] = []

    def mkd(self, path):
        if path in self.dirs:
            raise ftplib.error_perm("550 exists")
        self.dirs.add(path)

    def storbinary(self, cmd, fp):
        path = cmd.split(" ", 1)[1]
        self.files[path] = fp.read()
        self.log.append(f"STOR {path}")

    def rename(self, src, dst):
        if dst in self.files:
            raise ftplib.error_perm("553 exists")  # wie Server, die beim Umbenennen nicht überschreiben
        self.files[dst] = self.files.pop(src)
        self.log.append(f"RNTO {dst}")

    def delete(self, path):
        if path not in self.files:
            raise ftplib.error_perm("550 not found")
        del self.files[path]
        self.log.append(f"DELE {path}")

    def retrbinary(self, cmd, callback):
        path = cmd.split(" ", 1)[1]
        if path not in self.files:
            raise ftplib.error_perm("550 not found")
        callback(self.files[path])


class DeployTests(unittest.TestCase):
    def setUp(self):
        self.tmp = temp_dir("mc-test-deploy-")
        self.dist = self.tmp / "dist"
        site_build.build(release=False, out=self.dist)  # Inhalt egal – nur Dateien zum Hochladen
        (self.dist / "BETREIBER-TODO.html").unlink()
        (self.dist / "robots.txt").write_text("User-agent: *\nDisallow: /api/\n", encoding="utf-8")

    def tearDown(self):
        shutil.rmtree(self.tmp, ignore_errors=True)

    def test_plan_orders_assets_first_and_server_rules_last(self):
        local = {"index.html": "a", "assets/style.css": "b", ".htaccess": "c", "api/contact.php": "d", "favicon.svg": "e"}
        upload, delete = deploy.plan(local, {"index.html": "a", "alt/index.html": "x"})
        self.assertEqual(upload, ["assets/style.css", "favicon.svg", "api/contact.php", ".htaccess"])
        self.assertEqual(delete, ["alt/index.html"])

    def test_refuses_dev_build(self):
        dev = self.tmp / "dev"
        site_build.build(release=False, out=dev)
        with self.assertRaises(deploy.DeployError):
            deploy.check_release_build(dev)
        with self.assertRaises(deploy.DeployError):
            deploy.check_release_build(self.tmp / "fehlt")
        deploy.check_release_build(self.dist)  # vorbereitet wie ein Release

    def test_first_deploy_uploads_everything_then_only_changes(self):
        ftp = FakeFTP({"/html/hoster-info.html": b"vom Hoster"})
        remote = deploy.Remote(ftp, "/html")
        result = deploy.deploy(self.dist, remote, out=lambda *_: None)
        local = deploy.local_files(self.dist)
        self.assertEqual(result["uploaded"], len(local))
        self.assertEqual(ftp.files["/html/index.html"], (self.dist / "index.html").read_bytes())
        self.assertFalse([p for p in ftp.files if "/.upload-" in p], "Temp-Dateien bleiben nicht liegen")
        self.assertNotIn(f"/html/{deploy.BUILD_MARKER}", ftp.files)
        manifest = json.loads(ftp.files["/html/.deploy-manifest.json"])["files"]
        self.assertEqual(manifest, local)

        # Zweiter Lauf: eine Datei geändert, eine entfernt
        (self.dist / "index.html").write_text("geändert", encoding="utf-8")
        (self.dist / "404.html").unlink()
        ftp.log.clear()
        result = deploy.deploy(self.dist, remote, out=lambda *_: None)
        self.assertEqual(result["uploaded"], 1)
        self.assertEqual(result["deleted"], 1)
        self.assertEqual(ftp.files["/html/index.html"], "geändert".encode())
        self.assertNotIn("/html/404.html", ftp.files)
        self.assertEqual(ftp.files["/html/hoster-info.html"], b"vom Hoster", "fremde Dateien bleiben unangetastet")

    def test_dry_run_and_cancel_change_nothing(self):
        ftp = FakeFTP()
        remote = deploy.Remote(ftp, "")
        deploy.deploy(self.dist, remote, dry_run=True, out=lambda *_: None)
        deploy.deploy(self.dist, remote, confirm=lambda: False, out=lambda *_: None)
        self.assertEqual(ftp.files, {})

    def test_html_after_assets(self):
        ftp = FakeFTP()
        deploy.deploy(self.dist, deploy.Remote(ftp, ""), out=lambda *_: None)
        order = [entry.split(" ", 1)[1] for entry in ftp.log if entry.startswith("RNTO")]
        first_html = min(i for i, p in enumerate(order) if p.endswith(".html"))
        last_asset = max(i for i, p in enumerate(order) if p.startswith("assets/"))
        last_html = max(i for i, p in enumerate(order) if p.endswith(".html"))
        self.assertLess(last_asset, first_html, "Seiten erst, wenn ihre Assets online sind")
        self.assertGreater(order.index(".htaccess"), last_html, "Serverregeln zuletzt")
        self.assertEqual(order[-1], ".deploy-manifest.json", "Manifest erst nach erfolgreichem Upload")


if __name__ == "__main__":
    unittest.main()
