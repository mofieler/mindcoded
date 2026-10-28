"""Zusammenbau des Generators aus den Bausteinen."""
from __future__ import annotations

import datetime as dt
from dataclasses import dataclass, field
from pathlib import Path

from .blocks import BlocksMixin
from .catalog import CatalogMixin
from .common import CONTENT, ROOT
from .content import ContentMixin
from .layout import LayoutMixin
from .mail import MailMixin
from .output import OutputMixin
from .pages import PagesMixin
from .sections import SectionsMixin
from .server import ServerMixin
from .text import TextMixin


@dataclass
class Builder(ContentMixin, TextMixin, LayoutMixin, SectionsMixin, PagesMixin, BlocksMixin, CatalogMixin, MailMixin, OutputMixin, ServerMixin):
    release: bool
    out: Path
    content_dir: Path = CONTENT
    site: dict = field(default_factory=dict)
    langs: dict = field(default_factory=dict)
    projects: list = field(default_factory=list)
    services: list = field(default_factory=list)
    problems: list = field(default_factory=list)
    todos: dict = field(default_factory=dict)       # Inhaltspfad -> Text, nur tatsächlich verwendete
    todo_index: dict = field(default_factory=dict)  # Text -> Inhaltspfad
    tokens: dict = field(default_factory=dict)      # Farb-Tokens aus style.css
    media: dict = field(default_factory=dict)       # Breakpoints aus style.css
    preload_fonts: list = field(default_factory=list)
    asset_versions: dict = field(default_factory=dict)
    social_size: tuple | None = None
    year: int = field(default_factory=lambda: dt.date.today().year)


def default_out(release: bool) -> Path:
    """Release → dist/ (wird hochgeladen), Entwicklung → dist-dev/ (nie hochladen)."""
    return ROOT / ("dist" if release else "dist-dev")


def build(release: bool = False, out: Path | None = None, content_dir: Path | None = None) -> dict:
    return Builder(release=release, out=out or default_out(release), content_dir=content_dir or CONTENT).run()
