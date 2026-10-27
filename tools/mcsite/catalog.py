"""Komponenten-Seite (nur Entwicklungs-Build, /komponenten/): das kleine Design System der Website
zum Ansehen und Kopieren. Zeigt Buttons und Kennzeichnungen sowie jeden Baustein der Case Study
live – mit seiner JSON-Vorlage und einem Kopieren-Knopf. Quelle der Beispiele:
content/templates/case-study.json (dieselbe Vorlage nutzt tools/new_project.py).
"""
from __future__ import annotations

import json

from .blocks import BLOCK_TYPES
from .common import Page, esc, load_json
from .components import action, eyebrow, link_action, pill_link

TEMPLATE = "templates/case-study.json"

BLOCK_NOTES = {
    "text": "Freier Text, wenn kein anderer Baustein passt. Leerzeile = neuer Absatz, »• « = Aufzählung.",
    "cards": "2–5 Merkmale, Funktionen oder Zielgruppen – je Titel und ein Satz. Auf Handy und Tablet wischbar.",
    "compare": "Zwei Spalten: Vorher/Ziel, Heute/Konzept, Im Fokus/Weggelassen. »muted« nimmt eine Spalte zurück.",
    "quote": "Eine Kernaussage oder Leitfrage, groß gesetzt. Mit »source« als Kundenstimme.",
    "steps": "Ablauf, Methode, Nutzerweg. Bis 4 Schritte waagerecht, ab 5 senkrecht.",
    "status": "Projektstand: done (umgesetzt), active (in Arbeit), planned (geplant).",
    "stats": "2–3 belegte Kennzahlen. Reine Zahlen zählen beim Erscheinen hoch.",
    "groups": "Viele Aussagen einer Befragung, nach Themen gebündelt: je Thema Leitzahl und Einzelwerte.",
    "split": "Anteile eines Ganzen als ein geteilter Balken (Summe höchstens 100).",
    "scale": "Mittelwerte auf einer Skala mit neutraler Zone. Für Entscheider in Worten: »axis« (negativ · neutral · positiv) und »valueLabel« statt Zahl.",
    "bars": "Wenige Werte im direkten Vergleich.",
    "palette": "Farbwelt einer Marke: Farbfelder mit Name, Hex-Wert und Rolle.",
}


class CatalogMixin:
    def catalog_page(self) -> str:
        lang = "de"
        page = Page("komponenten/", lang, "catalog")
        tpl = load_json(TEMPLATE, self.content_dir)
        home = page.to(self.home_path(lang))
        examples: dict = {}
        for sec in tpl["de"]["sections"]:
            for block in sec.get("blocks", []):
                examples.setdefault(block["type"], block)
        missing = [t for t in BLOCK_TYPES if t not in examples]
        if missing:
            self.problems.append(f"content/{TEMPLATE}: Beispiel fehlt für {', '.join(missing)}.")

        items = "".join(self.catalog_item(
            f"block-{kind}", kind, BLOCK_NOTES.get(kind, ""),
            f'<div class="case-block case-block--{kind} is-revealed">{self.case_block(examples[kind], lang)}</div>',
            examples[kind]) for kind in BLOCK_TYPES if kind in examples)
        chapter = tpl["de"]["sections"][0]
        whole = {key: value for key, value in tpl.items() if not key.startswith("_")}
        main = f"""
<div class="catalog">
  <header class="catalog-intro">
    {eyebrow("Design System")}
    <h1 class="catalog-title type-display">Komponenten</h1>
    <p class="catalog-text">Alle Bausteine der Website zum Ansehen und Kopieren. Die JSON-Vorlagen gehören in
      <code>content/projects.json</code> in ein Kapitel unter <code>blocks</code>. Ein neues Projekt mit allen Bausteinen legt
      <code>python tools/new_project.py &lt;slug&gt; --name "…"</code> an. Regeln: <code>docs/CASE-STUDIES.md</code>.</p>
  </header>
  <section class="catalog-group" aria-labelledby="catalog-actions">
    <h2 id="catalog-actions" class="catalog-group-title type-display">Aktionen &amp; Kennzeichnungen</h2>
    {self.catalog_item("buttons", "Buttons", "Eine Hauptaktion je Bereich (dunkle Pille), Nebenaktionen als Link. Beschriftung der Hauptaktion überall gleich: content/*.json › ui.headerCta.",
                       f'<div class="catalog-buttons">{action(self.langs[lang]["ui"]["headerCta"], home + "#kontakt")}'
                       f'{link_action("Nebenaktion", home + "#projekte")}{pill_link("Verweis", home + "#leistungen")}'
                       f'<span class="catalog-dark">{action("Auf dunklem Grund", home + "#kontakt", variant="on-dark")}</span></div>')}
    {self.catalog_item("tags", "Kennzeichnungen", "Art des Projekts (Umriss) und Schlagworte (Fläche). Die Art kommt aus »kind«, die Schlagworte aus »tags«.",
                       '<div class="catalog-buttons"><span class="project-kind type-label">Kundenprojekt</span>'
                       '<ul class="project-tags"><li class="project-tag type-label">Vue.js</li><li class="project-tag type-label">UX Design</li></ul></div>')}
  </section>
  <section class="catalog-group" aria-labelledby="catalog-blocks">
    <h2 id="catalog-blocks" class="catalog-group-title type-display">Bausteine der Case Study</h2>
    {items}
  </section>
  <section class="catalog-group" aria-labelledby="catalog-whole">
    <h2 id="catalog-whole" class="catalog-group-title type-display">Größere Einheiten</h2>
    {self.catalog_item("glance", "Auf einen Blick", "Drei kurze Boxen unter dem Hauptbild – je ein Satz.",
                       self.case_glance(lang, tpl["de"]), tpl["de"]["glance"])}
    {self.catalog_item("chapter", "Kapitel", "Überschrift, ein Kernsatz, ein Baustein, Einzelheiten hinter »Mehr dazu«.", "", chapter)}
    {self.catalog_item("project", "Ganze Case Study", "Vollständiger Projekteintrag mit allen Bausteinen – Ausgangspunkt für neue Projekte.", "", whole)}
  </section>
</div>"""
        return self.simple_page(lang, page, title=self.page_title("Komponenten", lang, page),
                                description="Design System von mindcoded.studio: alle Bausteine mit JSON-Vorlagen zum Kopieren.", main=main, noindex=True,
                                data={"page": "catalog"}, body_class="page-sub page-catalog")

    def catalog_item(self, key: str, name: str, note: str, demo: str, source=None) -> str:
        code = ""
        if source is not None:
            code = (f'<div class="catalog-code"><pre id="json-{key}" tabindex="0" aria-label="JSON-Vorlage: {esc(name)}"><code>{esc(json.dumps(source, ensure_ascii=False, indent=2))}</code></pre>'
                    f'<button type="button" class="pill-link" data-copy="json-{key}" data-copy-done="Kopiert ✓" '
                    f'data-copy-fail="Bitte markieren und kopieren" aria-live="polite">JSON kopieren</button></div>')
        demo_html = f'<div class="catalog-demo">{demo}</div>' if demo else ""
        return (f'<section class="catalog-item" aria-labelledby="cat-{key}"><div class="catalog-head">'
                f'<h3 id="cat-{key}" class="catalog-name type-display">{esc(name)}</h3><p class="catalog-note">{esc(note)}</p></div>'
                f'{demo_html}{code}</section>')
