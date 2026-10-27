"""Texte, Platzhalter, sichere HTML-Ausgabe und Pfade."""
from __future__ import annotations

import html

from .common import LINK_RE, PLACEHOLDER_RE, SAFE_HREF_RE, TODO_CLOSE, TODO_OPEN, Page, dig, esc, is_todo


class TextMixin:
    # ------------------------------------------------------------------ Marke

    @property
    def brand_full(self) -> str:
        brand = self.site["brand"]
        return brand["name"] + brand["tld"]

    def page_title(self, title: str, lang: str, page: Page) -> str:
        """Seitentitel nach dem Muster »Seite – Marke« (Startseite: Titel aus content)."""
        return f"{self.text(title, self.vars(lang, page))} – {self.brand_full}"

    # ------------------------------------------------------------------ Platzhalter

    def _note_todo(self, text: str) -> None:
        path = self.todo_index.get(text, "unbekannte Stelle")
        self.todos.setdefault(path, text)

    def vars(self, lang: str, page: Page) -> dict:
        site = self.site
        sentences = self.langs["de"]["legal"]["sentences"]
        dpa = site["hosting"]["dpaConfirmed"]
        dpa_sentence = sentences["dpa"] if dpa is True else (dpa if is_todo(dpa) else "")
        own = site["contact"]["mailServer"] == "own"
        mail_sentences = {
            "transportSentence": sentences["mailOwn" if own else "mailHoster"],
            "mailboxSentence": sentences["mailboxOwn" if own else "mailboxHoster"],
        }
        return {
            "brand": {**site["brand"], "full": self.brand_full},
            "operator": site["operator"],
            "hosting": {**site["hosting"], "dpaSentence": dpa_sentence},
            "contact": {**site["contact"], **mail_sentences},
            "privacy": site["privacy"],
            "year": str(self.year),
            "home": page.to(self.home_path(lang)),
            "privacyUrl": page.to(self.langs["de"]["legal"]["privacy"]["slug"] + "/"),
            "lang": lang,
        }

    def subst(self, text: str, variables: dict, mark: bool = True, depth: int = 0):
        """Ersetzt {pfad}-Platzhalter. Gibt None zurück, wenn ein Platzhalter leer ist
        (dann entfällt die ganze Zeile bzw. der ganze Absatz)."""
        empty = False

        def repl(match):
            nonlocal empty
            try:
                value = dig(variables, match.group(1))
            except KeyError:
                self.problems.append(f"Unbekannter Platzhalter {{{match.group(1)}}} in »{text[:60]}…«")
                return match.group(0)
            if value is None or value is False or value == "":
                empty = True
                return ""
            value = str(value)
            if PLACEHOLDER_RE.search(value) and depth < 3:
                value = self.subst(value, variables, mark, depth + 1) or ""
            if is_todo(value) and mark and TODO_OPEN not in value:
                self._note_todo(value)
                return f"{TODO_OPEN}{value}{TODO_CLOSE}"
            return value

        result = PLACEHOLDER_RE.sub(repl, text)
        return None if empty else result

    def fmt(self, text: str, variables: dict | None = None):
        """Text → sicheres HTML: Platzhalter, [Links](url) und TODO-Markierungen."""
        if text is None:
            return None
        if is_todo(text) and not PLACEHOLDER_RE.search(text):
            self._note_todo(text)
            text = f"{TODO_OPEN}{text}{TODO_CLOSE}"
        if variables is not None:
            text = self.subst(text, variables)
            if text is None:
                return None
        out = esc(text)

        def link(match):
            label, href = match.group(1), html.unescape(match.group(2))
            if not SAFE_HREF_RE.match(href):
                self.problems.append(f"Unzulässiges Linkziel: {href}")
                return label  # nur den Text ausgeben, nie einen unsicheren Link
            return f'<a class="text-link" href="{esc(href)}">{label}</a>'

        out = LINK_RE.sub(link, out)
        if TODO_OPEN in out:
            badge = esc(self.langs["de"]["ui"]["todoBadge"])
            out = out.replace(TODO_OPEN, f'<mark class="todo" title="{badge}">').replace(TODO_CLOSE, "</mark>")
        return out

    def blocks(self, text: str, p_class: str = "col-t") -> str:
        """Mehrzeiliger Text → Absätze und Listen: Leerzeile trennt Absätze,
        Zeilen mit »• « werden zu einer Liste mit Akzentpunkten."""
        out = []
        for chunk in text.split("\n\n"):
            items: list[str] = []
            for line in chunk.split("\n"):
                line = line.strip()
                if line.startswith("• "):
                    items.append(f"<li>{self.fmt(line[2:])}</li>")
                    continue
                if items:
                    out.append('<ul class="check-list">' + "".join(items) + "</ul>")
                    items = []
                if line:
                    out.append(f'<p class="{p_class}">{self.fmt(line)}</p>')
            if items:
                out.append('<ul class="check-list">' + "".join(items) + "</ul>")
        return "".join(out)

    def text(self, text: str, variables: dict | None = None) -> str:
        """Reiner Text (Titel, Attribute, JSON): Platzhalter ersetzt, Links aufgelöst, TODOs erfasst."""
        if variables is not None:
            text = self.subst(text, variables, mark=False) or ""
        if is_todo(text):
            self._note_todo(text)
        return LINK_RE.sub(r"\1", text)

    def attr(self, text: str, variables: dict | None = None) -> str:
        """Text für Attribute (alt, content, aria-label) – escaped, ohne Markup."""
        return esc(self.text(text, variables))

    def plain(self, text: str, variables: dict) -> str:
        """Text für JSON-Daten (JavaScript)."""
        return self.text(text, variables)

    # ------------------------------------------------------------------ Pfade

    def home_path(self, lang: str) -> str:
        return "" if lang == "de" else f"{lang}/"

    def lang_prefix(self, lang: str) -> str:
        return self.home_path(lang)

    def case_path(self, lang: str, slug: str) -> str:
        return f"{self.lang_prefix(lang)}{self.langs[lang]['projects']['slugBase']}/{slug}/"

    def service_path(self, lang: str, svc: dict) -> str:
        return f"{self.lang_prefix(lang)}{self.langs[lang]['services']['slugBase']}/{svc['slug'][lang]}/"

    def page_url(self, path: str) -> str | None:
        url = self.site.get("url", "")
        if not url or is_todo(url):
            return None
        return f"{url}/{path}"

    def asset(self, page: Page, name: str) -> str:
        version = self.asset_versions.get(name)
        url = page.to(f"assets/{name}")
        return f"{url}?v={version}" if version else url
