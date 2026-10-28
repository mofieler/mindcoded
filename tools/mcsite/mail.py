"""E-Mail-Vorlagen des Kontaktformulars – aus denselben Tokens und Inhalten wie die Website.

Ergebnis ist api/mail-templates.php (vom Build erzeugt). PHP setzt dort nur noch Werte ein:
%date%, %rows%, %message% sowie %label%/%value% in den Tabellenzeilen. Werte aus dem Formular
escaped PHP vor dem Einsetzen (api/lib/message.php); alles andere ist hier schon fertig.

E-Mail-Regeln: Tabellen-Layout, Inline-Styles, höchstens 600 px breit, keine externen Bilder
oder Schriften (Webfonts lädt kaum ein Programm – die Stacks fallen auf Systemschriften zurück),
dunkles Schema per prefers-color-scheme für Programme, die es unterstützen.
"""
from __future__ import annotations

import re

from .common import ASSETS, Page, esc

TOKENS_CSS = ASSETS / "css" / "settings" / "tokens.css"
# Datumsformat (PHP date()) je Sprache
DATE_FORMATS = {"de": "d.m.Y, H:i \\U\\h\\r", "en": "j M Y, H:i"}


def font_stacks() -> dict[str, str]:
    """--font-sans / --font-display aus tokens.css (eine Quelle mit der Website)."""
    css = TOKENS_CSS.read_text(encoding="utf-8")
    return {name: re.search(rf"--font-{name}:\s*([^;]+);", css).group(1).strip() for name in ("sans", "display")}


class MailMixin:
    def mail_templates(self) -> dict:
        de = self.langs["de"]["contact"]["mail"]
        return {
            "date_format": DATE_FORMATS,
            "notify": self.mail_notify(de["notify"]),
            "receipt": {lang: self.mail_receipt(lang, self.langs[lang]["contact"]["mail"]["receipt"]) for lang in self.langs},
        }

    # ------------------------------------------------------------------ Bausteine

    def mail_vars(self, lang: str) -> dict:
        return self.vars(lang, Page(path="", lang=lang, kind="message", absolute=True))

    def mail_style(self) -> dict[str, str]:
        light, fonts = self.tokens["light"], font_stacks()
        return {
            "bg": light["color-bg"], "card": light["color-card"], "ink": light["color-ink"],
            "muted": light["color-muted"], "dim": light["color-dim"], "line": light["color-line"],
            "link": light["color-accent-text"], "sans": fonts["sans"], "display": fonts["display"],
        }

    def mail_dark_css(self) -> str:
        """Dunkles Schema für Apple Mail, iOS, Outlook.com u. a. – Klassen ergänzen die Inline-Styles."""
        dark = self.tokens["dark"]
        return (
            "@media (prefers-color-scheme: dark) {"
            f" .mc-bg {{ background: {dark['color-bg']} !important; }}"
            f" .mc-card {{ background: {dark['color-card']} !important; border-color: {dark['color-line']} !important; }}"
            f" .mc-ink {{ color: {dark['color-ink']} !important; }}"
            f" .mc-muted {{ color: {dark['color-muted']} !important; }}"
            f" .mc-line {{ border-color: {dark['color-line']} !important; }}"
            f" .mc-link {{ color: {dark['color-accent-text']} !important; }}"
            " }"
        )

    def mail_html(self, lang: str, title: str, preheader: str, heading: str, body: str, footer: str) -> str:
        s = self.mail_style()
        wordmark = (f'<span style="font-family:{s["display"]};font-size:20px;font-weight:700;letter-spacing:-0.01em">'
                    f'{esc(self.site["brand"]["name"])}</span>'
                    f'<span style="font-family:{s["display"]};font-size:20px;color:{s["link"]}" class="mc-link">'
                    f'{esc(self.site["brand"]["tld"])}</span>')
        return (
            f'<!DOCTYPE html>\n<html lang="{lang}"><head><meta charset="utf-8">'
            '<meta name="viewport" content="width=device-width, initial-scale=1">'
            '<meta name="color-scheme" content="light dark"><meta name="supported-color-schemes" content="light dark">'
            f'<title>{esc(title)}</title><style>{self.mail_dark_css()}</style></head>'
            f'<body style="margin:0;padding:0;background:{s["bg"]}" class="mc-bg">'
            # Vorschautext in der Postfach-Liste, im Text selbst unsichtbar
            f'<div style="display:none;max-height:0;overflow:hidden;opacity:0">{esc(preheader)}</div>'
            f'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:{s["bg"]}" class="mc-bg">'
            '<tr><td align="center" style="padding:32px 16px">'
            '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px">'
            f'<tr><td style="padding:0 8px 20px;color:{s["ink"]}" class="mc-ink">{wordmark}</td></tr>'
            f'<tr><td style="background:{s["card"]};border:1px solid {s["line"]};border-radius:12px;padding:36px 32px" class="mc-card">'
            f'<h1 style="margin:0 0 20px;font-family:{s["display"]};font-size:26px;line-height:1.2;font-weight:700;color:{s["ink"]}" class="mc-ink">{esc(heading)}</h1>'
            f'{body}</td></tr>'
            f'<tr><td style="padding:20px 8px 0;font-family:{s["sans"]};font-size:12px;line-height:1.6;color:{s["dim"]}" class="mc-muted">{footer}</td></tr>'
            '</table></td></tr></table></body></html>'
        )

    def mail_paragraph(self, text: str, small: bool = False) -> str:
        s = self.mail_style()
        size, color, css = ("13px", s["muted"], "mc-muted") if small else ("16px", s["ink"], "mc-ink")
        return f'<p style="margin:0 0 16px;font-family:{s["sans"]};font-size:{size};line-height:1.6;color:{color}" class="{css}">{esc(text)}</p>'

    def mail_footer(self, lang: str, imprint_label: str) -> tuple[str, str]:
        """Pflichtangaben (Name, Anschrift, Kontakt) und Link zum Impressum – als HTML und Text."""
        op, brand = self.site["operator"], self.site["brand"]
        imprint = f'{self.site["url"]}/{self.langs["de"]["legal"]["imprint"]["slug"]}/'
        parts = [op["name"], op["street"], f'{op["postalCode"]} {op["city"]}', brand["email"]]
        link = self.mail_style()["link"]
        html = (" · ".join(esc(p) for p in parts)
                + f'<br><a href="{esc(imprint)}" style="color:{link}" class="mc-link">{esc(imprint_label)}</a>'
                + f' · <a href="{esc(self.site["url"])}/" style="color:{link}" class="mc-link">{esc(self.brand_full)}</a>')
        text = "\n".join(["-- ", " · ".join(parts), f"{imprint_label}: {imprint}"])
        return html, text

    # ------------------------------------------------------------------ Vorlagen

    def mail_receipt(self, lang: str, t: dict) -> dict:
        """Eingangsbestätigung an die anfragende Person – werbefrei und ohne Formularinhalte
        (sonst ließe sich das Formular nutzen, um fremden Text an fremde Adressen zu schicken)."""
        v = self.mail_vars(lang)
        p = {key: self.plain(t[key], v) for key in ("subject", "preheader", "heading", "greeting", "closing", "notice", "imprint")}
        paragraphs = [self.plain(text, v) for text in t["paragraphs"]]
        name = self.site["operator"]["name"]
        footer_html, footer_text = self.mail_footer(lang, p["imprint"])
        body = "".join([
            self.mail_paragraph(p["greeting"]),
            *(self.mail_paragraph(text) for text in paragraphs),
            self.mail_paragraph(f'{p["closing"]}\n{name}').replace("\n", "<br>"),
            f'<hr style="border:0;border-top:1px solid {self.mail_style()["line"]};margin:24px 0" class="mc-line">',
            self.mail_paragraph(p["notice"], small=True),
        ])
        text = "\n\n".join([p["greeting"], *paragraphs, f'{p["closing"]}\n{name}', p["notice"], footer_text]) + "\n"
        return {
            "subject": p["subject"],
            "html": self.mail_html(lang, p["subject"], p["preheader"], p["heading"], body, footer_html),
            "text": text,
        }

    def mail_notify(self, t: dict) -> dict:
        """Benachrichtigung an das Studio: Angaben als Tabelle, Nachricht als Absatz."""
        v = self.mail_vars("de")
        s = self.mail_style()
        p = {key: self.plain(t[key], v) for key in ("subject", "preheader", "heading", "sent", "replyHint")}
        footer_html, footer_text = self.mail_footer("de", self.plain(self.langs["de"]["contact"]["mail"]["receipt"]["imprint"], v))
        cell = f'font-family:{s["sans"]};font-size:15px;line-height:1.5;padding:8px 0;border-bottom:1px solid {s["line"]};vertical-align:top'
        row_html = (f'<tr><td style="{cell};color:{s["muted"]};width:120px;padding-right:16px" class="mc-muted mc-line">%label%</td>'
                    f'<td style="{cell};color:{s["ink"]}" class="mc-ink mc-line">%value%</td></tr>')
        message = (f'<p style="margin:24px 0 8px;font-family:{s["sans"]};font-size:13px;color:{s["muted"]}" class="mc-muted">{esc(t["labels"]["message"])}</p>'
                   f'<div style="font-family:{s["sans"]};font-size:16px;line-height:1.6;color:{s["ink"]};white-space:pre-wrap" class="mc-ink">%message%</div>')
        body = "".join([
            '<table role="presentation" width="100%" cellpadding="0" cellspacing="0">%rows%</table>',
            message,
            f'<hr style="border:0;border-top:1px solid {s["line"]};margin:24px 0" class="mc-line">',
            self.mail_paragraph(p["sent"], small=True),
            self.mail_paragraph(p["replyHint"], small=True),
        ])
        text = "\n".join([p["heading"], "", "%rows%", "", f'{t["labels"]["message"]}:', "%message%", "", footer_text.split("\n", 1)[0],
                          p["sent"], p["replyHint"]]) + "\n"
        return {
            "subject": p["subject"],
            "labels": t["labels"],
            "html": self.mail_html("de", p["subject"], p["preheader"], p["heading"], body, footer_html),
            "text": text,
            "row_html": row_html,
            "row_text": "%label%: %value%",
        }
