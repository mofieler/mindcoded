#!/usr/bin/env python3
"""Ein Befehl für alle Prüfungen – vor jedem Hochladen und (per Git-Hook) vor jedem Commit.

  python tools/check.py            Linter (Ruff), alle Tests inkl. Browser und WCAG-Prüfung (axe), echter PHP-Endpunkt
                                   (falls PHP installiert), Typprüfung JavaScript (falls TypeScript
                                   installiert, sonst npx), Stand des Releases
  python tools/check.py --fast     ohne Browser- und PHP-Tests (Sekunden statt Minuten; Git-Hook)
  python tools/check.py --release  zusätzlich: scheitert, solange der Release-Build nicht möglich ist

Exit-Code 0 = alles in Ordnung. Offene Betreiberangaben sind nur ein Hinweis, außer mit --release.
"""
from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from mcsite import ROOT, BuildError, build  # noqa: E402

FAST_TESTS = ["tests.test_build", "tests.test_contact_api", "tests.test_php_static", "tests.test_tools"]


def step(title: str) -> None:
    print(f"\n── {title} " + "─" * max(0, 60 - len(title)), flush=True)


def run_tests(fast: bool) -> bool:
    step("Tests" + (" (ohne Browser)" if fast else ""))
    cmd = [sys.executable, "-m", "unittest", *FAST_TESTS] if fast else \
        [sys.executable, "-m", "unittest", "discover", "-s", "tests", "-t", "."]
    return subprocess.run(cmd, cwd=ROOT).returncode == 0


def run_lint() -> bool | None:
    """Python-Linter Ruff (Regeln: ruff.toml). Lokal per »uv tool install ruff« installiert."""
    step("Linter Python (Ruff)")
    local = Path.home() / ".local" / "bin" / ("ruff.exe" if sys.platform == "win32" else "ruff")
    ruff = shutil.which("ruff") or (str(local) if local.is_file() else None)
    if not ruff:
        print("übersprungen – Ruff nicht installiert (uv tool install ruff; CI prüft immer)")
        return None
    return subprocess.run([ruff, "check", "tools", "tests"], cwd=ROOT).returncode == 0


def run_php() -> bool | None:
    step("PHP-Endpunkt")
    if not shutil.which("php"):
        print("übersprungen – PHP ist nicht installiert (Test: python tools/php_test.py)")
        return None
    return subprocess.run([sys.executable, "tools/php_test.py"], cwd=ROOT).returncode == 0


def run_typecheck() -> bool | None:
    """JavaScript-Typprüfung (jsconfig.json, Dateien mit // @ts-check) – ohne Build-Schritt."""
    step("Typprüfung JavaScript")
    tsc = shutil.which("tsc")
    npx = shutil.which("npx")
    if not tsc and not npx:
        print("übersprungen – Node.js/TypeScript nicht installiert (CI prüft immer)")
        return None
    cmd = [tsc, "-p", "jsconfig.json"] if tsc else [npx, "--yes", "-p", "typescript@5.6.3", "tsc", "-p", "jsconfig.json"]
    return subprocess.run(cmd, cwd=ROOT).returncode == 0


def release_state() -> list[str]:
    """Probe-Build für den Release in ein Temp-Verzeichnis – liefert die offenen Punkte."""
    step("Release")
    with tempfile.TemporaryDirectory(prefix="mc-check-") as tmp:
        try:
            build(release=True, out=Path(tmp) / "dist")
        except BuildError as err:
            open_items = [p for p in err.problems if p.startswith("  – ")]
            other = [p for p in err.problems if not p.startswith("  – ") and "offene Betreiberangaben" not in p]
            for problem in other:
                print(f"  {problem}")
            print(f"noch nicht möglich: {len(open_items)} offene Betreiberangaben"
                  + (f", {len(other)} weitere Probleme" if other else "")
                  + " – Liste: python tools/build.py --release")
            return err.problems
    print("bereit – python tools/build.py --release, danach python tools/deploy.py")
    return []


def main() -> int:
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8")
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--fast", action="store_true", help="ohne Browser- und PHP-Tests")
    parser.add_argument("--release", action="store_true", help="scheitert, solange der Release-Build nicht möglich ist")
    args = parser.parse_args()

    lint = run_lint()
    ok = run_tests(args.fast)
    php = None if args.fast else run_php()
    types = None if args.fast else run_typecheck()
    problems = release_state()

    step("Ergebnis")
    release = True if not problems else (False if args.release else None)
    results = [("Linter", lint, "nicht geprüft"), ("Tests", ok, ""), ("PHP-Endpunkt", php, "nicht geprüft"), ("Typprüfung", types, "nicht geprüft"),
               ("Release", release, "Angaben offen")]
    for name, state, note in results:
        mark = "✓" if state else ("–" if state is None else "✗")
        print(f"  {mark} {name}{f' ({note})' if state is None else ''}")
    failed = not ok or lint is False or php is False or types is False or (args.release and problems)
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
