"""UI-Komponenten des Generators: jede wiederkehrende Auszeichnung genau einmal.

Regel (CLAUDE.md › Design System): Kommt ein Stück Markup ein drittes Mal vor, wird es hier eine
Funktion. Seiten und Abschnitte rufen nur diese Funktionen auf; die Komponenten-Seite
(/komponenten/) zeigt dieselben Funktionen – Beispiel und Website können nicht auseinanderlaufen.

Alle Funktionen erwarten Text (wird hier maskiert) bzw. ausdrücklich `*_html` (schon sicheres HTML).
Gestaltung: assets/css/components/button.css, section.css.
"""
from __future__ import annotations

from .common import esc

ARROW = '<span class="arrow-circle" data-arrow aria-hidden="true"><span>→</span></span>'


def action(label: str, href: str = "", *, variant: str = "primary", attrs: str = "", hidden_suffix: str = "",
           magnetic: bool = True, submit: bool = False, label_attrs: str = "") -> str:
    """Hauptaktion als Pille mit Pfeilkreis. variant: »primary« (dunkel auf hell) oder »on-dark«
    (hell auf dunklem Grund). submit=True erzeugt einen Formular-Button statt eines Links."""
    cls = "btn-primary-pill" if variant == "primary" else "btn-contact-submit"
    suffix = f'<span class="visually-hidden">{esc(hidden_suffix)}</span>' if hidden_suffix else ""
    mag = " data-mag" if magnetic else ""
    inner = f"<span{label_attrs}>{esc(label)}{suffix}</span>{ARROW}"
    if submit:
        return f'<button type="submit" class="{cls}"{attrs}{mag}>{inner}</button>'
    return f'<a class="{cls}" href="{esc(href)}"{attrs}{mag}>{inner}</a>'


def link_action(label: str, href: str, *, external: bool = False) -> str:
    """Nebenaktion als unterstrichener Link; extern mit Pfeil nach außen."""
    if external:
        return f'<a class="btn-secondary-link" href="{esc(href)}" rel="noopener">{esc(label)} <span aria-hidden="true">↗</span></a>'
    return f'<a class="btn-secondary-link" href="{esc(href)}">{esc(label)}</a>'


def pill_link(label: str, href: str) -> str:
    """Verweis als Umriss-Pille (z. B. weitere Leistungen)."""
    return f'<a class="pill-link" href="{esc(href)}">{esc(label)}</a>'


def card(title: str, text_html: str, *, level: int = 3) -> str:
    """Kleine Box mit Titel und einem Satz (Listenpunkt). Gestaltung: components/card.css."""
    return f'<li class="card"><h{level} class="card-title">{esc(title)}</h{level}><p class="card-text">{text_html}</p></li>'


def eyebrow(text_html: str, *, navy: bool = False) -> str:
    """Kleine Zeile über einer Überschrift (Rubrik). Erwartet sicheres HTML."""
    variant = " section-eyebrow--navy" if navy else ""
    return f'<p class="section-eyebrow{variant} type-label">{text_html}</p>'
