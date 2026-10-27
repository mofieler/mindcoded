"""Statische Prüfung des PHP-Endpunkts – fängt Tippfehler und Strukturfehler auch ohne PHP.

Ersetzt nicht die Ausführung: python tools/php_test.py (braucht PHP 8.1+) testet das Verhalten
gegen den echten Endpunkt, einschließlich SMTP-Versand an einen lokalen Test-Mailserver.
"""
from __future__ import annotations

import re
import unittest

from tests.support import ROOT

API = ROOT / "api"
LIB_FILES = sorted((API / "lib").glob("*.php"))
PHP_FILES = [API / "contact.php", *LIB_FILES, ROOT / "docs" / "contact-config.example.php"]
DANGEROUS = ("eval", "exec", "shell_exec", "system", "passthru", "popen", "proc_open", "unserialize",
             "var_dump", "print_r", "phpinfo", "assert", "create_function", "extract")


def strip_php(code: str) -> str:
    """Entfernt Kommentare und Zeichenketten (inkl. Heredoc) – übrig bleibt die Struktur."""
    out, i, n = [], 0, len(code)
    while i < n:
        two = code[i:i + 2]
        if two == "/*":
            end = code.find("*/", i + 2)
            i = n if end < 0 else end + 2
        elif two == "//" or code[i] == "#":
            end = code.find("\n", i)
            i = n if end < 0 else end
        elif code.startswith("<<<", i):
            match = re.match(r"<<<\s*['\"]?(\w+)['\"]?\n", code[i:])
            if not match:
                raise ValueError(f"Heredoc ohne Bezeichner bei Zeichen {i}")
            close = re.compile(rf"\n[ \t]*{match.group(1)}\b")
            end = close.search(code, i + match.end())
            if not end:
                raise ValueError(f"Heredoc {match.group(1)} nicht geschlossen")
            out.append('""')
            i = end.end()
        elif code[i] in "'\"":
            quote, j = code[i], i + 1
            while j < n and code[j] != quote:
                j += 2 if code[j] == "\\" else 1
            if j >= n:
                raise ValueError(f"Zeichenkette ab Zeichen {i} nicht geschlossen")
            out.append('""')
            i = j + 1
        else:
            out.append(code[i])
            i += 1
    return "".join(out)


class PhpStaticTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.sources = {p: p.read_text(encoding="utf-8") for p in PHP_FILES}
        cls.code = {p: strip_php(text) for p, text in cls.sources.items()}

    def name(self, path) -> str:
        return path.relative_to(ROOT).as_posix()

    def test_file_header_and_strict_types(self):
        for path, text in self.sources.items():
            with self.subTest(file=self.name(path)):
                self.assertTrue(text.startswith("<?php\n"), "beginnt mit <?php")
                self.assertIn("declare(strict_types=1);", text)
                self.assertNotIn("?>", self.code[path], "kein schließendes ?> (verhindert versehentliche Ausgabe)")

    def test_brackets_balanced(self):
        pairs = {")": "(", "]": "[", "}": "{"}
        for path, code in self.code.items():
            with self.subTest(file=self.name(path)):
                stack = []
                for line_no, line in enumerate(code.splitlines(), 1):
                    for char in line:
                        if char in "([{":
                            stack.append((char, line_no))
                        elif char in pairs:
                            self.assertTrue(stack and stack[-1][0] == pairs[char], f"»{char}« ohne Gegenstück in Zeile {line_no}")
                            stack.pop()
                self.assertEqual(stack, [], f"offene Klammern: {stack[:3]}")

    def test_statements_terminated(self):
        # Häufiger Tippfehler: fehlendes Semikolon vor einer neuen Anweisung in der nächsten Zeile.
        for path, code in self.code.items():
            lines = code.splitlines()
            for k, line in enumerate(lines[:-1]):
                nxt = lines[k + 1].strip()
                stripped = line.rstrip()
                if re.search(r"(\)|\w|\]|\"\")$", stripped) and re.match(r"(return|\$\w+\s*=|mc_\w+\(|echo|throw|if \()", nxt) \
                        and not re.search(r"(^\s*(if|elseif|foreach|for|while|switch|function|catch|match|else)\b|=>|,|\.|\(|\?|:|&&|\|\|)$", stripped) \
                        and not re.match(r"^\s*(if|elseif|foreach|for|while|function|catch|} catch|else)\b", stripped):
                    with self.subTest(file=self.name(path), line=k + 1):
                        self.fail(f"Zeile {k + 1} endet ohne Semikolon: {stripped.strip()!r}")

    def test_lib_files_cannot_run_directly(self):
        for path in LIB_FILES:
            with self.subTest(file=self.name(path)):
                self.assertRegex(self.sources[path], r"if \(!defined\('MC_CONTACT'\)\) \{\s*http_response_code\(404\);\s*exit;")

    def test_every_lib_file_is_loaded(self):
        entry = self.sources[API / "contact.php"]
        required = re.findall(r"require __DIR__ \. '/lib/([\w-]+\.php)';", entry)
        self.assertEqual(sorted(required), sorted(p.name for p in LIB_FILES))

    def test_called_functions_and_constants_exist(self):
        code = "\n".join(self.code[p] for p in [API / "contact.php", *LIB_FILES])
        defined = set(re.findall(r"\bfunction\s+(mc_\w+)\s*\(", code))
        called = set(re.findall(r"(?<!function )\b(mc_\w+)\s*\(", code))
        called |= set(re.findall(r"'(mc_\w+)'", "\n".join(self.sources[p] for p in LIB_FILES)))  # array_map('mc_scalar', …)
        self.assertEqual(sorted(called - defined), [], "aufgerufen, aber nirgends definiert")
        constants = set(re.findall(r"\bconst\s+(MC_\w+)\s*=", code))
        used = set(re.findall(r"\b(MC_[A-Z0-9_]+)\b", code)) - {"MC_CONTACT"}
        env_names = set(re.findall(r"'(MC_[A-Z_]+)'", "\n".join(self.sources.values())))  # Umgebungsvariablen
        self.assertEqual(sorted(used - constants - env_names), [], "Konstante verwendet, aber nicht definiert")
        self.assertIn("McSmtpError", code)
        self.assertRegex(code, r"final class McSmtpError extends RuntimeException")

    def test_no_dangerous_functions(self):
        for path, code in self.code.items():
            for func in DANGEROUS:
                with self.subTest(file=self.name(path), function=func):
                    self.assertNotRegex(code, rf"(?<![\w>$:]){func}\s*\(")

    def test_tls_always_verified(self):
        smtp = self.sources[API / "lib" / "smtp.php"]
        self.assertIn("'verify_peer' => true", smtp)
        self.assertIn("'verify_peer_name' => true", smtp)
        self.assertIn("'allow_self_signed' => false", smtp)
        self.assertNotRegex(smtp, r"verify_peer'\s*=>\s*false")
        config = self.sources[API / "lib" / "config.php"]
        self.assertIn("smtp_security »none« ist nur für lokale Tests erlaubt", config)

    def test_no_real_addresses_or_secrets(self):
        for path, text in self.sources.items():
            with self.subTest(file=self.name(path)):
                addresses = re.findall(r"[\w.+-]+@[\w-]+\.[a-z]{2,}", text)
                self.assertFalse([a for a in addresses if not a.endswith(("example.com", "example.org"))],
                                 "nur Beispieladressen (example.com)")
                self.assertNotRegex(text, r"(?i)(password|passwort)'\s*=>\s*'[^']+'", "keine Zugangsdaten im Code")


class StripPhpTests(unittest.TestCase):
    def test_strips_strings_comments_heredoc(self):
        code = "<?php\n$a = 'x)'; // )\n/* ( */ $b = \"{$a}\\\"(\";\nconst T = <<<TXT\n(\nTXT;\n"
        self.assertEqual(strip_php(code).count("("), 0)
        self.assertEqual(strip_php(code).count(")"), 0)


if __name__ == "__main__":
    unittest.main()
