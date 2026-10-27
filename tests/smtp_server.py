"""Kleiner SMTP-Server für Tests (nur Standardbibliothek, nur 127.0.0.1, ohne TLS).

Nimmt Nachrichten an und speichert sie im Speicher – es wird nichts weitergeleitet. Genutzt von
tools/php_test.py (SMTP-Versand des echten PHP-Endpunkts) und tests/test_tools.py.

  with FakeSmtpServer(user="formular@example.com", password="test") as smtp:
      … smtp.port … smtp.messages …
  FakeSmtpServer(reject_rcpt=True)   lehnt jeden Empfänger mit 550 ab (Fehlerfall)
"""
from __future__ import annotations

import base64
import socketserver
import threading
from dataclasses import dataclass, field


@dataclass
class Received:
    mail_from: str
    rcpt_to: list[str]
    data: bytes
    authenticated: str | None


@dataclass
class FakeSmtpServer:
    user: str | None = None
    password: str | None = None
    reject_rcpt: bool = False
    messages: list[Received] = field(default_factory=list)

    def __post_init__(self):
        outer = self

        class Handler(socketserver.StreamRequestHandler):
            def send(self, line: str) -> None:
                self.wfile.write(line.encode("ascii") + b"\r\n")

            def readline(self) -> str:
                return self.rfile.readline(4096).decode("utf-8", "replace").rstrip("\r\n")

            def handle(self):
                self.send("220 test.example.com ESMTP Testserver")
                mail_from, rcpt, auth = None, [], None
                while True:
                    line = self.readline()
                    if not line and self.rfile.closed:
                        return
                    verb = line.split(" ", 1)[0].upper()
                    if verb in ("EHLO", "HELO"):
                        self.send("250-test.example.com")
                        self.send("250-AUTH PLAIN LOGIN")
                        self.send("250 8BITMIME")
                    elif verb == "AUTH":
                        auth = self.auth(line)
                        if auth is None:
                            self.send("535 5.7.8 Authentication failed")
                        else:
                            self.send("235 2.7.0 Authentication successful")
                    elif verb == "MAIL":
                        if outer.user and not auth:
                            self.send("530 5.7.0 Authentication required")
                            continue
                        mail_from = line.split(":", 1)[1].strip().strip("<>")
                        rcpt = []
                        self.send("250 2.1.0 Ok")
                    elif verb == "RCPT":
                        if outer.reject_rcpt:
                            self.send("550 5.1.1 Mailbox unavailable")
                            continue
                        rcpt.append(line.split(":", 1)[1].strip().strip("<>"))
                        self.send("250 2.1.5 Ok")
                    elif verb == "DATA":
                        if not mail_from or not rcpt:
                            self.send("503 5.5.1 Bad sequence")
                            continue
                        self.send("354 End data with <CR><LF>.<CR><LF>")
                        lines = []
                        while True:
                            raw = self.rfile.readline(65536)
                            if raw in (b".\r\n", b""):
                                break
                            lines.append(raw[1:] if raw.startswith(b"..") else raw)  # Dot-Stuffing zurücknehmen
                        outer.messages.append(Received(mail_from, rcpt, b"".join(lines), auth))
                        self.send("250 2.0.0 Ok: queued")
                    elif verb == "RSET":
                        mail_from, rcpt = None, []
                        self.send("250 Ok")
                    elif verb == "NOOP":
                        self.send("250 Ok")
                    elif verb == "QUIT":
                        self.send("221 Bye")
                        return
                    elif not line:
                        return
                    else:
                        self.send("502 5.5.2 Command not implemented")

            def auth(self, line: str) -> str | None:
                parts = line.split()
                mechanism = parts[1].upper() if len(parts) > 1 else ""
                if mechanism == "PLAIN":
                    token = parts[2] if len(parts) > 2 else self.ask("")
                    try:
                        _, user, password = base64.b64decode(token).decode("utf-8").split("\0")
                    except ValueError:
                        return None
                elif mechanism == "LOGIN":
                    user = base64.b64decode(self.ask("VXNlcm5hbWU6")).decode("utf-8")
                    password = base64.b64decode(self.ask("UGFzc3dvcmQ6")).decode("utf-8")
                else:
                    return None
                return user if (user, password) == (outer.user, outer.password) else None

            def ask(self, challenge: str) -> str:
                self.send(f"334 {challenge}")
                return self.readline()

        self.server = socketserver.ThreadingTCPServer(("127.0.0.1", 0), Handler)
        self.server.daemon_threads = True

    @property
    def port(self) -> int:
        return self.server.server_address[1]

    def __enter__(self) -> FakeSmtpServer:
        threading.Thread(target=self.server.serve_forever, daemon=True).start()
        return self

    def __exit__(self, *exc) -> None:
        self.server.shutdown()
        self.server.server_close()
