#!/usr/bin/env python3
"""External uptime check, run by .github/workflows/monitor.yml every 15 minutes from GitHub's servers.

Exits non-zero when something is down; GitHub then mails the repository owner. Standard library only.
Local: python ops/monitor.py
"""
from __future__ import annotations

import datetime as dt
import json
import os
import socket
import ssl
import sys
import urllib.request

SITE = "https://mindcoded.studio"
MAIL_HOST = "mail.mindcoded.studio"
CERT_MIN_DAYS = 10

PAGES = {
    "Website": f"{SITE}/",
    "Website EN": f"{SITE}/en/",
    "Impressum": f"{SITE}/impressum/",
    "Statistik-Skript": "https://stats.mindcoded.studio/insights",
    "Mail-Verwaltung": f"https://{MAIL_HOST}/admin/",
    "MTA-STS-Richtlinie": "https://mta-sts.mindcoded.studio/.well-known/mta-sts.txt",
}


def get(url: str) -> tuple[int, bytes]:
    req = urllib.request.Request(url, headers={"User-Agent": "mindcoded-monitor (github actions)"})
    with urllib.request.urlopen(req, timeout=20) as res:
        return res.status, res.read(200_000)


def check_pages() -> list[str]:
    problems = []
    for name, url in PAGES.items():
        try:
            status, _ = get(url)
            if status != 200:
                problems.append(f"{name}: HTTP {status}")
        except Exception as err:  # noqa: BLE001
            problems.append(f"{name}: {getattr(err, 'code', '')} {type(err).__name__}")
    return problems


def check_form() -> list[str]:
    """The contact form hands out a proof-of-work task – proves PHP and its private folder work."""
    try:
        _, body = get(f"{SITE}/api/contact.php?challenge")
        task = json.loads(body)
        return [] if task.get("algorithm") == "SHA-256" and task.get("signature") else ["Kontaktformular: unerwartete Antwort"]
    except Exception as err:  # noqa: BLE001
        return [f"Kontaktformular: {type(err).__name__}"]


def cert_days(host: str, port: int, starttls: bool = False) -> int:
    ctx = ssl.create_default_context()
    with socket.create_connection((host, port), timeout=15) as sock:
        if starttls:  # SMTP on 25: greeting, EHLO, STARTTLS
            f = sock.makefile("rwb")
            f.readline()
            f.write(b"EHLO monitor.mindcoded.studio\r\n"); f.flush()
            while (line := f.readline())[3:4] == b"-":
                pass
            f.write(b"STARTTLS\r\n"); f.flush()
            if not f.readline().startswith(b"220"):
                raise RuntimeError("STARTTLS refused")
        with ctx.wrap_socket(sock, server_hostname=host) as tls:
            not_after = ssl.cert_time_to_seconds(tls.getpeercert()["notAfter"])
    return (dt.datetime.fromtimestamp(not_after, dt.timezone.utc) - dt.datetime.now(dt.timezone.utc)).days


def check_mail() -> list[str]:
    problems = []
    ports = [("SMTP (Versand, 465)", 465, False), ("IMAP (993)", 993, False)]
    if not os.environ.get("GITHUB_ACTIONS"):  # Azure blocks outbound port 25 for GitHub's runners
        ports.insert(0, ("SMTP (Empfang, 25)", 25, True))
    for name, port, starttls in ports:
        try:
            days = cert_days(MAIL_HOST, port, starttls)
            if days < CERT_MIN_DAYS:
                problems.append(f"{name}: Zertifikat läuft in {days} Tagen ab")
        except Exception as err:  # noqa: BLE001
            problems.append(f"{name}: {type(err).__name__} {err}")
    return problems


def main() -> int:
    problems = check_pages() + check_form() + check_mail()
    for host in ("mindcoded.studio", "stats.mindcoded.studio"):
        try:
            if (days := cert_days(host, 443)) < CERT_MIN_DAYS:
                problems.append(f"Zertifikat {host}: läuft in {days} Tagen ab")
        except Exception as err:  # noqa: BLE001
            problems.append(f"Zertifikat {host}: {type(err).__name__}")
    if problems:
        print("STÖRUNG:\n- " + "\n- ".join(problems))
        return 1
    print("Alles erreichbar.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
