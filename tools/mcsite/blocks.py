"""Case Study: Kurzüberblick, Kapitel mit Bausteinen (Karten, Ablauf, Kennzahlen, Balken, Skala,
Anteile, Themen-Gruppen, Zitat, Farbpalette, Stand, Gegenüberstellung), »Mehr dazu« und Bildstreifen.

Alles wird vorab als HTML/SVG erzeugt – ohne JavaScript vollständig lesbar, ohne Inline-Styles
(CSP). Bewegung entsteht nur über CSS, sobald ein Baustein ins Bild scrollt ([data-rv]).
Schema: README.md › Projekte, Begründung: docs/CASE-STUDIES.md.
"""
from __future__ import annotations

from .common import esc
from .components import card

BLOCK_TYPES = ("text", "cards", "steps", "stats", "bars", "scale", "split", "groups", "quote", "palette", "status", "compare")
STATES = ("done", "active", "planned")


def number(value: float, lang: str) -> str:
    text = f"{value:g}"
    return text.replace(".", ",") if lang == "de" else text


def counted(text: str) -> str:
    """Zahl, die beim Erscheinen hochzählt (projects.js › initCountUp). Vorgelesen wird immer der
    Endwert; die sichtbare Zahl ist für Screenreader ausgeblendet."""
    return f'<span class="visually-hidden">{esc(text)}</span><span aria-hidden="true" data-count>{esc(text)}</span>'


class BlocksMixin:
    # ------------------------------------------------------------------ Kopf und Galerie

    def case_glance(self, lang: str, d: dict) -> str:
        if not d.get("glance"):
            return ""
        pj = self.langs[lang]["projects"]
        items = "".join(f'<li class="case-glance-item"><p class="case-glance-label type-label">{esc(g["label"])}</p>'
                        f'<p class="case-glance-text">{self.fmt(g["text"])}</p></li>' for g in d["glance"])
        return (f'<section class="case-glance" aria-labelledby="glance-title" data-rv>'
                f'<h2 id="glance-title" class="visually-hidden">{esc(pj["glanceTitle"])}</h2>'
                f'<ul class="case-glance-list snap-row">{items}</ul></section>')

    def case_gallery(self, lang: str, page, images: list) -> str:
        if not images:
            return ""
        pj = self.langs[lang]["projects"]
        shots = "".join(
            '<figure class="case-shot">'
            + self.img_html(img, lang, page, sizes="(max-width: 819px) 80vw, 45vw", cls=self.img_class(img))
            + (f'<figcaption class="case-shot-caption">{esc(img["caption"][lang])}</figcaption>' if img.get("caption") else "")
            + "</figure>"
            for img in images
        )
        nav = (f'<div class="case-gallery-nav">'
               f'<button type="button" class="case-gallery-btn" data-gallery-prev aria-label="{esc(pj["galleryPrev"])}"><span aria-hidden="true">←</span></button>'
               f'<button type="button" class="case-gallery-btn" data-gallery-next aria-label="{esc(pj["galleryNext"])}"><span aria-hidden="true">→</span></button>'
               f'</div>') if len(images) > 1 else ""
        return (f'<section class="case-gallery" aria-labelledby="gallery-title">'
                f'<div class="case-gallery-head" data-rv><h2 id="gallery-title" class="case-gallery-title type-display">{esc(pj["galleryTitle"])}</h2>{nav}</div>'
                f'<div class="case-gallery-strip" data-gallery tabindex="0" role="region" aria-labelledby="gallery-title">{shots}</div>'
                f'</section>')

    @staticmethod
    def img_class(img: dict) -> str:
        return "img-contain" if img.get("fit") == "contain" else ""

    # ------------------------------------------------------------------ Kapitel

    def case_chapters(self, lang: str, d: dict) -> str:
        pj = self.langs[lang]["projects"]
        out = []
        for k, sec in enumerate(d["sections"]):
            cid = f"kapitel-{k + 1}"
            blocks = sec.get("blocks") or ([{"type": "text", "text": sec["text"]}] if sec.get("text") else [])
            lead = f'<p class="case-lead" data-rv>{self.fmt(sec["lead"])}</p>' if sec.get("lead") else ""
            body = "".join(f'<div class="case-block case-block--{b["type"]}" data-rv>{self.case_block(b, lang)}</div>' for b in blocks)
            more = ""
            if sec.get("more"):
                more = (f'<details class="case-more" data-rv><summary class="case-more-btn"><span>{esc(pj["more"])}</span>'
                        f'<span class="case-more-icon" aria-hidden="true"><span class="plus-icon"><span class="plus-icon-h"></span>'
                        f'<span class="plus-icon-v"></span></span></span></summary>'
                        f'<div class="case-more-body">{self.blocks(sec["more"], "case-text")}</div></details>')
            out.append(
                f'<section class="case-chapter" id="{cid}" aria-labelledby="{cid}-title" data-chapter="{esc(sec["heading"])}">'
                f'<div class="case-chapter-head" data-rv><span class="col-n type-mono" aria-hidden="true">{k + 1:02d}</span>'
                f'<h2 id="{cid}-title" class="case-chapter-title type-display">{esc(sec["heading"])}</h2></div>'
                f'<div class="case-chapter-body">{lead}{body}{more}</div></section>')
        return f'<div class="case-chapters">{"".join(out)}</div>'

    def case_block(self, b: dict, lang: str) -> str:
        caption = f'<p class="case-caption type-label">{esc(b["caption"])}</p>' if b.get("caption") else ""
        note = f'<p class="case-note type-mono">{self.fmt(b["note"])}</p>' if b.get("note") else ""
        return caption + getattr(self, f"block_{b['type']}")(b, lang) + note

    def block_text(self, b: dict, lang: str) -> str:
        return self.blocks(b["text"], "case-text")

    def block_cards(self, b: dict, lang: str) -> str:
        items = "".join(card(c["title"], self.fmt(c["text"])) for c in b["items"])
        return f'<ul class="case-cards snap-row">{items}</ul>'

    def _steps(self, items: list, cls: str, state_labels: dict | None = None) -> str:
        out = []
        for s in items:
            state = s.get("state")
            mod = f" is-{state}" if state else ""
            label = f'<span class="case-step-state type-label">{esc(state_labels[state])}</span>' if state else ""
            text = f'<span class="case-step-text">{self.fmt(s["text"])}</span>' if s.get("text") else ""
            out.append(f'<li class="case-step{mod}"><span class="case-step-dot" aria-hidden="true"></span>{label}'
                       f'<span class="case-step-title">{esc(s["title"])}</span>{text}</li>')
        return f'<ol class="{cls}">{"".join(out)}</ol>'

    def block_steps(self, b: dict, lang: str) -> str:
        return self._steps(b["items"], "case-steps")

    def block_status(self, b: dict, lang: str) -> str:
        return self._steps(b["items"], "case-steps case-steps--status", self.langs[lang]["projects"]["states"])

    def block_stats(self, b: dict, lang: str) -> str:
        items = "".join(f'<div class="case-stat"><dt class="case-stat-label">{self.fmt(s["label"])}</dt>'
                        f'<dd class="case-stat-value type-display">{counted(s["value"])}</dd></div>' for s in b["items"])
        return f'<dl class="case-stats">{items}</dl>'

    def bar_rows(self, items: list, lang: str, top: float = 100, suffix: str = "") -> str:
        rows = []
        for item in items:
            width = max(0.0, min(100.0, item["value"] / top * 100))
            rows.append(
                f'<li class="case-bar"><span class="case-bar-label">{self.fmt(item["label"])}</span>'
                f'<span class="case-bar-value type-mono">{esc(number(item["value"], lang) + suffix)}</span>'
                f'<svg class="case-bar-track" viewBox="0 0 100 4" preserveAspectRatio="none" aria-hidden="true" focusable="false">'
                f'<rect class="case-bar-bg" width="100" height="4"/><rect class="case-bar-fill" width="{width:.1f}" height="4"/></svg></li>')
        return "".join(rows)

    def block_bars(self, b: dict, lang: str) -> str:
        return f'<ul class="case-bars">{self.bar_rows(b["items"], lang, b.get("max", 100), b.get("suffix", ""))}</ul>'

    def block_scale(self, b: dict, lang: str) -> str:
        """Werte auf einer Skala mit Nullpunkt (z. B. UEQ −3 … +3), neutrale Zone hinterlegt. Für Leser
        ohne Fachwissen: »axis« benennt die Achse in Worten, »valueLabel« ersetzt die Zahl am Balken."""
        lo, hi = b.get("min", -3), b.get("max", 3)

        def x(v: float) -> float:
            return (v - lo) / (hi - lo) * 600

        zone = ""
        if b.get("neutral"):
            n0, n1 = b["neutral"]
            zone = f'<rect class="case-scale-zone" x="{x(n0):.1f}" width="{x(n1) - x(n0):.1f}" height="8"/>'
        zero = x(0) if lo < 0 < hi else 0
        rows = []
        for item in b["items"]:
            v = x(item["value"])
            neg = " is-negative" if v < zero else ""
            rows.append(
                f'<li class="case-scale-row"><span class="case-bar-label">{self.fmt(item["label"])}</span>'
                f'<span class="case-bar-value type-mono">{esc(item.get("valueLabel") or number(item["value"], lang))}</span>'
                f'<svg class="case-scale-track" viewBox="0 0 600 8" preserveAspectRatio="none" aria-hidden="true" focusable="false">'
                f'<rect class="case-bar-bg" width="600" height="8"/>{zone}'
                f'<rect class="case-scale-fill{neg}" x="{min(zero, v):.1f}" width="{abs(v - zero):.1f}" height="8"/>'
                f'<rect class="case-scale-zero" x="{zero - 1:.1f}" width="2" height="8"/></svg></li>')
        if b.get("axis"):
            low, mid, high = b["axis"]
        else:
            low = number(lo, lang).replace("-", "−")
            mid = number((lo + hi) / 2, lang)
            high = ("+" if hi > 0 else "") + number(hi, lang)
        axis = (f'<div class="case-scale-axis type-mono" aria-hidden="true"><span>{esc(low)}</span>'
                f'<span>{esc(mid)}</span><span>{esc(high)}</span></div>')
        legend = ""
        if b.get("neutral") and b.get("neutralLabel"):
            legend = (f'<p class="case-scale-legend"><span class="case-scale-swatch" aria-hidden="true"></span>'
                      f'{esc(b["neutralLabel"])}</p>')
        return f'<ul class="case-scale">{"".join(rows)}</ul>{axis}{legend}'

    def block_split(self, b: dict, lang: str) -> str:
        """Anteile eines Ganzen (z. B. Nutzungsabsicht) als ein geteilter Balken mit Legende."""
        suffix = b.get("suffix", "")
        segs, pos = [], 0.0
        for i, item in enumerate(b["items"]):
            width = max(0.0, item["value"] - 0.6)
            segs.append(f'<rect class="case-split-seg case-split-seg--{i + 1}" x="{pos:.2f}" width="{width:.2f}" height="10"/>')
            pos += item["value"]
        legend = "".join(
            f'<li class="case-split-item"><span class="case-split-dot case-split-dot--{i + 1}" aria-hidden="true"></span>'
            f'<span class="case-split-value type-display">{counted(number(item["value"], lang) + suffix)}</span>'
            f'<span class="case-split-label">{self.fmt(item["label"])}</span></li>'
            for i, item in enumerate(b["items"]))
        return (f'<svg class="case-split-bar" viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true" focusable="false">'
                f'<rect class="case-bar-bg" width="100" height="10"/>{"".join(segs)}</svg>'
                f'<ul class="case-split-legend">{legend}</ul>')

    def block_groups(self, b: dict, lang: str) -> str:
        """Aussagen nach Themen gebündelt: je Thema eine Leitzahl und die Einzelwerte als Balken."""
        suffix = b.get("suffix", "")
        cards = []
        for g in b["items"]:
            rows = f'<ul class="case-bars case-bars--compact">{self.bar_rows(g["rows"], lang, 100, suffix)}</ul>' if g.get("rows") else ""
            cards.append(
                f'<div class="case-group"><p class="case-group-title type-label">{esc(g["title"])}</p>'
                f'<p class="case-group-figure"><span class="case-group-value type-display">{counted(number(g["value"], lang) + suffix)}</span>'
                f'<span class="case-group-label">{self.fmt(g["label"])}</span></p>{rows}</div>')
        return f'<div class="case-groups snap-row">{"".join(cards)}</div>'

    def block_quote(self, b: dict, lang: str) -> str:
        source = f'<footer class="case-quote-source type-label">{esc(b["source"])}</footer>' if b.get("source") else ""
        return f'<blockquote class="case-quote"><p class="case-quote-text type-display">{self.fmt(b["text"])}</p>{source}</blockquote>'

    def block_palette(self, b: dict, lang: str) -> str:
        items = "".join(
            f'<li class="case-swatch"><svg class="case-swatch-chip" viewBox="0 0 1 1" preserveAspectRatio="none" aria-hidden="true" focusable="false">'
            f'<rect width="1" height="1" fill="{esc(c["hex"])}"/></svg><span class="case-swatch-name">{esc(c["name"])}</span>'
            f'<span class="case-swatch-hex type-mono">{esc(c["hex"].upper())}</span><span class="case-swatch-role">{esc(c["role"])}</span></li>'
            for c in b["items"])
        return f'<ul class="case-palette">{items}</ul>'

    def block_compare(self, b: dict, lang: str) -> str:
        cols = "".join(
            f'<div class="case-compare-col"><p class="case-caption type-label">{esc(col["title"])}</p>'
            f'<ul class="check-list{" check-list--muted" if col.get("muted") else ""}">{"".join(f"<li>{self.fmt(x)}</li>" for x in col["items"])}</ul></div>'
            for col in b["columns"])
        return f'<div class="case-compare">{cols}</div>'
