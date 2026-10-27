#!/usr/bin/env python3
"""Veröffentlicht den Release-Build (dist/) – auf dem eigenen VPS per SSH oder auf Webspace per FTPS.

Eigener Server (empfohlen, SSH mit Schlüssel – unter Windows 11 ist ssh eingebaut):
  python tools/deploy.py --ssh mindcoded@server --dry-run   zeigt, was passieren würde
  python tools/deploy.py --ssh mindcoded@server             prüft, lädt als neuen Release hoch, schaltet um
  python tools/deploy.py --ssh mindcoded@server --rollback  zurück auf den vorherigen Release

  Auf dem Server: <root>/releases/<Zeitstempel>/ je Veröffentlichung, <root>/current zeigt per
  Symlink auf den aktiven Release (Webroot). Umschalten ist atomar: Besucher sehen nie einen
  halben Stand. Die letzten 5 Releases bleiben für einen schnellen Rollback erhalten.
  <root> kommt aus content/site.json › server.root (Standard /srv/mindcoded).

Webspace (FTPS, nur geänderte Dateien):
  python tools/deploy.py --dry-run    zeigt, was hochgeladen und gelöscht würde (verbindet sich, ändert nichts)
  python tools/deploy.py              prüft (tools/check.py --fast), zeigt den Plan, fragt nach, lädt hoch

FTPS-Zugangsdaten – nie im Projekt speichern:
  MC_FTP_HOST, MC_FTP_USER, MC_FTP_DIR   Server, Benutzer, Zielordner (Webroot, z. B. /html)
  MC_FTP_PASSWORD                         Passwort; fehlt es, wird es verdeckt abgefragt
  oder als Argumente --host, --user, --dir

Sicherheit und Ablauf:
- nur verschlüsselt (FTPS mit geprüftem Zertifikat); unverschlüsseltes FTP gibt es nicht
- nur ein Release-Build wird hochgeladen, nie dist-dev/
- jede Datei erst unter einem versteckten Temp-Namen, dann umbenannt – nie halbe Dateien online
- Reihenfolge: Assets → Formular → Seiten → .htaccess/robots/sitemap; keine Seite verweist auf
  eine noch fehlende Datei
- gelöscht werden nur Dateien, die ein früheres Deploy hochgeladen hat (Liste
  .deploy-manifest.json auf dem Server); Dateien des Hosters bleiben unberührt
- der private Formular-Ordner liegt außerhalb des Webroots und wird nie angefasst
"""
from __future__ import annotations

import argparse
import contextlib
import ftplib
import getpass
import hashlib
import io
import json
import os
import posixpath
import re
import shlex
import shutil
import ssl
import subprocess
import sys
import tarfile
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from mcsite import CONTENT, ROOT, load_json  # noqa: E402
from mcsite.common import BUILD_MARKER  # noqa: E402

MANIFEST = ".deploy-manifest.json"
LAST = {".htaccess", "robots.txt", "sitemap.xml", "llms.txt", "site.webmanifest"}
KEEP_RELEASES = 5
SSH_TARGET_RE = re.compile(r"^[a-z_][a-z0-9_-]{0,31}@[A-Za-z0-9.-]+$")


class DeployError(Exception):
    pass


# ---------------------------------------------------------------------- SSH: Releases auf dem eigenen Server

def build_archive(dist: Path) -> bytes:
    """dist/ als tar.gz im Speicher (ohne Build-Marker); Pfade relativ, nur Dateien und Ordner."""
    buf = io.BytesIO()
    with tarfile.open(fileobj=buf, mode="w:gz") as tar:
        for path in sorted(dist.rglob("*")):
            rel = path.relative_to(dist).as_posix()
            if rel == BUILD_MARKER or path.is_symlink() or not (path.is_file() or path.is_dir()):
                continue
            info = tar.gettarinfo(str(path), arcname=rel)
            info.uid = info.gid = 0
            info.uname = info.gname = ""
            info.mode = 0o755 if path.is_dir() else 0o644
            if path.is_file():
                with path.open("rb") as fh:
                    tar.addfile(info, fh)
            else:
                tar.addfile(info)
    return buf.getvalue()


def release_script(root: str, release: str, keep: int = KEEP_RELEASES) -> str:
    """Shell-Skript für den Server: entpacken, atomar umschalten, alte Releases aufräumen."""
    return f"""set -eu
umask 022
ROOT={shlex.quote(root)}
REL="$ROOT/releases/{release}"
mkdir -p "$ROOT/releases"
test ! -e "$REL"
mkdir "$REL"
tar -xzf - -C "$REL" --no-same-owner
test -f "$REL/index.html"
ln -sfn "$REL" "$ROOT/current.tmp"
mv -Tf "$ROOT/current.tmp" "$ROOT/current"
ls -1d "$ROOT"/releases/*/ | sort -r | tail -n +{keep + 1} | while read -r old; do rm -rf -- "$old"; done
echo "aktiv: $REL"
"""


def rollback_script(root: str) -> str:
    return f"""set -eu
ROOT={shlex.quote(root)}
CURRENT=$(readlink -f "$ROOT/current")
PREVIOUS=$(ls -1d "$ROOT"/releases/*/ | sort -r | sed 's:/$::' | grep -v -x -F -- "$CURRENT" | head -n 1)
test -n "$PREVIOUS" || {{ echo "kein früherer Release vorhanden" >&2; exit 1; }}
ln -sfn "$PREVIOUS" "$ROOT/current.tmp"
mv -Tf "$ROOT/current.tmp" "$ROOT/current"
echo "aktiv: $PREVIOUS (vorher: $CURRENT)"
"""


def ssh_deploy(dist: Path, target: str, root: str, *, rollback: bool = False, dry_run: bool = False,
               run=subprocess.run, out=print) -> int:
    if not SSH_TARGET_RE.match(target):
        raise DeployError("Ziel als benutzer@server angeben (SSH-Zugang mit Schlüssel).")
    ssh = shutil.which("ssh") or "ssh"
    base = [ssh, "-o", "BatchMode=yes", "-o", "ConnectTimeout=15", target]
    if rollback:
        out(f"Rollback auf {target}:{root} …")
        return 0 if dry_run else run([*base, rollback_script(root)]).returncode
    release = time.strftime("%Y%m%d-%H%M%S")
    archive = build_archive(dist)
    out(f"Release {release}: {len(archive) / 1024:.0f} KB nach {target}:{root}/releases/ – danach Umschalten von current.")
    if dry_run:
        out("Probelauf – nichts übertragen.")
        return 0
    result = run([*base, release_script(root, release)], input=archive)
    if result.returncode == 0:
        out("Fertig. Prüfen: Website aufrufen, Testanfrage senden. Zurück: --rollback")
    return result.returncode


def server_root() -> str:
    return str(load_json("site.json", CONTENT).get("server", {}).get("root", "/srv/mindcoded")).rstrip("/")


def check_release_build(dist: Path) -> None:
    if not (dist / BUILD_MARKER).is_file():
        raise DeployError(f"{dist} ist kein Build – zuerst: python tools/build.py --release")
    if (dist / "BETREIBER-TODO.html").exists():
        raise DeployError(f"{dist} ist ein Entwicklungs-Build – nie hochladen. Release: python tools/build.py --release")
    robots = (dist / "robots.txt").read_text(encoding="utf-8") if (dist / "robots.txt").is_file() else ""
    if any(line.strip() == "Disallow: /" for line in robots.splitlines()):
        raise DeployError("robots.txt sperrt alle Suchmaschinen – das ist kein Release-Build.")


def local_files(dist: Path) -> dict[str, str]:
    """{Pfad: SHA-256} aller auszuliefernden Dateien."""
    files = {}
    for path in sorted(dist.rglob("*")):
        rel = path.relative_to(dist).as_posix()
        if path.is_file() and rel not in (BUILD_MARKER, MANIFEST):
            files[rel] = hashlib.sha256(path.read_bytes()).hexdigest()
    return files


def stage(rel: str) -> int:
    """Upload-Reihenfolge: 0 Assets/Icons, 1 Formular, 2 Seiten und Übriges, 3 Serverregeln und Verzeichnisse."""
    if rel.startswith("assets/") or "/" not in rel and rel.endswith((".png", ".ico", ".svg")):
        return 0
    if rel.startswith("api/"):
        return 1
    if rel in LAST:
        return 3
    return 2


def plan(local: dict[str, str], remote: dict[str, str]) -> tuple[list[str], list[str]]:
    """(hochzuladen in sicherer Reihenfolge, zu löschen) – gelöscht wird nur, was im alten Manifest steht."""
    upload = sorted((rel for rel, digest in local.items() if remote.get(rel) != digest), key=lambda r: (stage(r), r))
    delete = sorted(rel for rel in remote if rel not in local)
    return upload, delete


class Remote:
    """Dateioperationen relativ zum Zielordner; ftp ist ein ftplib.FTP_TLS (oder ein Test-Double)."""

    def __init__(self, ftp, root: str):
        self.ftp = ftp
        self.root = "/" + root.strip("/") if root.strip("/") else ""
        self.known_dirs: set[str] = set()

    def path(self, rel: str) -> str:
        return f"{self.root}/{rel}" if self.root else rel

    def ensure_dir(self, rel_dir: str) -> None:
        parts = [p for p in rel_dir.split("/") if p]
        for i in range(1, len(parts) + 1):
            sub = "/".join(parts[:i])
            if sub in self.known_dirs:
                continue
            with contextlib.suppress(ftplib.error_perm):  # existiert schon
                self.ftp.mkd(self.path(sub))
            self.known_dirs.add(sub)

    def put(self, rel: str, data: bytes) -> None:
        folder, name = posixpath.split(rel)
        self.ensure_dir(folder)
        tmp = self.path(posixpath.join(folder, f".upload-{name}"))
        target = self.path(rel)
        self.ftp.storbinary(f"STOR {tmp}", io.BytesIO(data))
        try:
            self.ftp.rename(tmp, target)
        except ftplib.error_perm:  # manche Server überschreiben beim Umbenennen nicht
            with contextlib.suppress(ftplib.error_perm):
                self.ftp.delete(target)
            self.ftp.rename(tmp, target)

    def delete(self, rel: str) -> None:
        with contextlib.suppress(ftplib.error_perm):  # schon weg
            self.ftp.delete(self.path(rel))

    def read_manifest(self) -> dict[str, str]:
        buf = io.BytesIO()
        try:
            self.ftp.retrbinary(f"RETR {self.path(MANIFEST)}", buf.write)
        except ftplib.error_perm:
            return {}
        try:
            data = json.loads(buf.getvalue().decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError):
            raise DeployError(f"{MANIFEST} auf dem Server ist beschädigt – bitte prüfen oder löschen.") from None
        files = data.get("files", {}) if isinstance(data, dict) else {}
        return {k: v for k, v in files.items() if isinstance(k, str) and isinstance(v, str)}


def deploy(dist: Path, remote: Remote, *, dry_run: bool = False, confirm=None, out=print) -> dict:
    local = local_files(dist)
    upload, delete = plan(local, remote.read_manifest())
    out(f"{len(upload)} Dateien hochladen, {len(delete)} veraltete löschen, {len(local) - len(upload)} unverändert.")
    for rel in upload[:12]:
        out(f"  + {rel}")
    if len(upload) > 12:
        out(f"  … {len(upload) - 12} weitere")
    for rel in delete:
        out(f"  − {rel}")
    if dry_run or not (upload or delete):
        return {"uploaded": 0, "deleted": 0, "planned": (upload, delete)}
    if confirm and not confirm():
        out("Abgebrochen – nichts geändert.")
        return {"uploaded": 0, "deleted": 0, "planned": (upload, delete)}
    for i, rel in enumerate(upload, 1):
        remote.put(rel, (dist / rel).read_bytes())
        if i % 25 == 0:
            out(f"  {i}/{len(upload)} …")
    for rel in delete:
        remote.delete(rel)
    manifest = json.dumps({"files": local}, indent=1, sort_keys=True).encode("utf-8")
    remote.put(MANIFEST, manifest)  # zuletzt: bricht der Upload ab, wiederholt der nächste Lauf ihn
    out("Fertig. Bitte jetzt eine Testanfrage über das Formular senden.")
    return {"uploaded": len(upload), "deleted": len(delete), "planned": (upload, delete)}


def connect(host: str, user: str, password: str) -> ftplib.FTP_TLS:
    ftp = ftplib.FTP_TLS(host, context=ssl.create_default_context(), timeout=60)
    ftp.login(user, password)  # sichert die Steuerverbindung vor dem Senden des Passworts (AUTH TLS)
    ftp.prot_p()               # auch die Datenverbindung verschlüsseln
    return ftp


def main() -> int:
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8")
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--ssh", metavar="BENUTZER@SERVER", help="eigener Server: Release per SSH (empfohlen)")
    parser.add_argument("--rollback", action="store_true", help="mit --ssh: zurück auf den vorherigen Release")
    parser.add_argument("--root", help="mit --ssh: Basisordner auf dem Server (Standard: site.json › server.root)")
    parser.add_argument("--host", default=os.environ.get("MC_FTP_HOST"))
    parser.add_argument("--user", default=os.environ.get("MC_FTP_USER"))
    parser.add_argument("--dir", default=os.environ.get("MC_FTP_DIR", ""), help="Zielordner (Webroot) auf dem Server")
    parser.add_argument("--dist", type=Path, default=ROOT / "dist")
    parser.add_argument("--dry-run", action="store_true", help="nur anzeigen, nichts ändern")
    parser.add_argument("--yes", action="store_true", help="ohne Rückfrage hochladen")
    parser.add_argument("--skip-checks", action="store_true", help="Tests vorher nicht ausführen")
    args = parser.parse_args()
    if args.ssh:
        try:
            if not args.rollback:
                check_release_build(args.dist)
                if not args.skip_checks and not args.dry_run:
                    print("Prüfe vorher (tools/check.py --fast) …")
                    if subprocess.run([sys.executable, "tools/check.py", "--fast"], cwd=ROOT).returncode != 0:
                        raise DeployError("Prüfungen fehlgeschlagen – nichts hochgeladen.")
            return ssh_deploy(args.dist, args.ssh, args.root or server_root(), rollback=args.rollback, dry_run=args.dry_run)
        except DeployError as err:
            print(err)
            return 1
    if not args.host or not args.user:
        print("Server und Benutzer fehlen: --host/--user oder MC_FTP_HOST/MC_FTP_USER setzen.")
        return 2
    try:
        check_release_build(args.dist)
        if not args.skip_checks and not args.dry_run:
            print("Prüfe vorher (tools/check.py --fast) …")
            if subprocess.run([sys.executable, "tools/check.py", "--fast"], cwd=ROOT).returncode != 0:
                raise DeployError("Prüfungen fehlgeschlagen – nichts hochgeladen.")
        password = os.environ.get("MC_FTP_PASSWORD") or getpass.getpass(f"Passwort für {args.user}@{args.host}: ")
        ftp = connect(args.host, args.user, password)
        try:
            confirm = None if args.yes else (lambda: input("Hochladen? [j/N] ").strip().lower() in ("j", "ja", "y", "yes"))
            deploy(args.dist, Remote(ftp, args.dir), dry_run=args.dry_run, confirm=confirm)
        finally:
            try:
                ftp.quit()
            except (OSError, ftplib.Error):
                ftp.close()
    except DeployError as err:
        print(err)
        return 1
    except (OSError, ftplib.Error, ssl.SSLError) as err:
        print(f"Verbindung oder Übertragung fehlgeschlagen: {err}")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
