"""Hilfsfunktionen für Microsoft Edge / Chrome im Headless-Modus (nur Standardbibliothek).

Genutzt von tools/make_icons.py und den Browser-Tests – so lässt sich ohne Node.js
rendern, das fertige DOM auslesen und ein Screenshot erstellen.
"""
from __future__ import annotations

import os
import shutil
import subprocess
import tempfile
from pathlib import Path

CANDIDATES = [
    os.environ.get("MC_BROWSER", ""),
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    "/usr/bin/microsoft-edge",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
]


def find_browser() -> str | None:
    for path in CANDIDATES:
        if path and Path(path).is_file():
            return path
    for name in ("msedge", "microsoft-edge", "google-chrome", "chromium", "chrome"):
        found = shutil.which(name)
        if found:
            return found
    return None


def _run(args: list[str], timeout: int = 60) -> subprocess.CompletedProcess:
    browser = find_browser()
    if not browser:
        raise RuntimeError("Kein Edge/Chrome gefunden (Pfad über MC_BROWSER setzen).")
    with tempfile.TemporaryDirectory(prefix="mc-edge-") as profile:
        cmd = [browser, "--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check",
               "--disable-extensions", "--hide-scrollbars", f"--user-data-dir={profile}", *args]
        return subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=timeout)


def dump_dom(url: str, *, javascript: bool = True, width: int = 1440, height: int = 900, wait_ms: int = 4000,
             extra_args: list[str] | None = None, timeout: int = 60) -> str:
    """Liefert das DOM nach dem Laden (mit oder ohne JavaScript)."""
    args = [f"--window-size={width},{height}", f"--virtual-time-budget={wait_ms}", *(extra_args or [])]
    if not javascript:
        args.append("--blink-settings=scriptEnabled=false")
    result = _run([*args, "--dump-dom", url], timeout=timeout)
    return result.stdout


def screenshot(url: str, out: Path, *, width: int, height: int, javascript: bool = True,
               wait_ms: int = 4000, transparent: bool = False, extra: list[str] | None = None) -> Path:
    out = Path(out).resolve()
    out.parent.mkdir(parents=True, exist_ok=True)
    args = [f"--window-size={width},{height}", f"--virtual-time-budget={wait_ms}", f"--screenshot={out}"]
    if transparent:
        args.append("--default-background-color=00000000")
    if not javascript:
        args.append("--blink-settings=scriptEnabled=false")
    args += extra or []
    _run([*args, url])
    if not out.is_file():
        raise RuntimeError(f"Screenshot nicht erzeugt: {out}")
    return out
