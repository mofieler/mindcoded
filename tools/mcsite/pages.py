"""Unterseiten: Case Study, Leistungsseite, Rechtsseiten, Meldungen, 404."""
from __future__ import annotations

from .common import LANGS, STEP_NUMBER_RE, Page, dig, esc, truncate
from .components import action, eyebrow, link_action, pill_link


class PagesMixin:
    def case_page(self, lang: str, projects: list, index: int) -> str:
        c = self.langs[lang]
        pj = c["projects"]
        proj = projects[index]
        d = proj[lang]
        page = Page(self.case_path(lang, proj["slug"]), lang, "case")
        nxt = projects[(index + 1) % len(projects)]
        kind = pj["kinds"][proj["kind"]]
        draft = f'<p class="draft-badge draft-badge--inline">{esc(c["ui"]["draftBadge"])}</p>' if proj.get("draft") else ""
        if proj.get("images"):
            hero = proj["images"][0]
            visual = ('<figure class="case-hero-figure">'
                      + self.img_html(hero, lang, page, sizes="(max-width: 1440px) 92vw, 1300px", cls=self.img_class(hero),
                                      lazy=False, priority=True)
                      + "</figure>")
        else:
            visual = (f'<div class="case-illustration" aria-hidden="true"><canvas id="case-canvas" class="case-illustration-canvas"></canvas>'
                      f'<span class="project-preview-badge type-label">{esc(pj["illustration"])}</span></div>')
        gallery = self.case_gallery(lang, page, proj.get("images", [])[1:])
        live = ""
        if proj.get("url"):
            live = f'<p class="case-live">{link_action(pj["liveLink"], proj["url"], external=True, attrs=self.track("Live-Seite geöffnet", projekt=proj["slug"]))}</p>'
        # Thema fürs Formular vorauswählen: die umfassendste Leistung des Projekts; Studienprojekte ohne Vorauswahl
        topic = ""
        if proj["kind"] in ("client", "own"):
            by_key = {s["key"]: s["topic"] for s in self.services}
            topic = next((by_key[k] for k in ("webapps", "websites", "modernization", "design")
                          if k in proj.get("serviceKeys", []) and k in by_key), "")
        ask = page.to(self.home_path(lang)) + (f"?thema={topic}" if topic else "") + "#kontakt"
        # Abschluss: mit »takeaway« der Nutzen für den Leser, sonst die allgemeine Einladung
        kicker, title = (pj["takeawayKicker"], d["takeaway"]) if d.get("takeaway") else (pj["ctaKicker"], pj["ctaTitle"])
        cta = (f'<section class="case-cta" aria-labelledby="case-cta-title" data-rv>'
               f'<div class="case-cta-text"><p class="case-cta-kicker type-label">{esc(kicker)}</p>'
               f'<h2 id="case-cta-title" class="case-cta-title type-display">{self.fmt(title)}</h2></div>'
               f'{action(c["ui"]["headerCta"], ask, attrs=self.track("Erstgespräch-Klick", ort="Projektseite", projekt=proj["slug"]))}</section>')
        next_link = ""
        if len(projects) > 1:
            next_link = (f'<a class="case-next-btn" href="{esc(page.to(self.case_path(lang, nxt["slug"])))}"{self.curtain_link(self.case_curtain(lang, nxt))}>'
                         f'<span class="next-meta"><span class="next-meta-kicker type-label">{esc(pj["next"])}</span>'
                         f'<span class="next-meta-name type-display">{esc(nxt[lang]["name"])}</span></span>'
                         f'<span class="next-arrow-btn" aria-hidden="true">→</span></a>')
        main = f"""
<article class="case-page" aria-labelledby="case-title">
  <div class="case-topbar">
    <div class="case-topbar-inner">
      <a class="case-back-btn" href="{page.to(self.home_path(lang))}#projekte"{self.curtain_link(self.projects_curtain(lang))}><span class="case-back-circle" aria-hidden="true">←</span><span>{esc(pj["back"])}</span></a>
      <span class="case-indicator type-label"><span class="case-indicator-count">{esc(pj["caseLabel"])} 0{index + 1} / 0{len(projects)}</span><span class="case-indicator-chapter" data-chapter-label aria-hidden="true"></span></span>
    </div>
  </div>
  <div class="case-body">
    <header class="case-header">
      {draft}
      <p class="case-meta-row type-label"><span class="meta-dot" aria-hidden="true"></span>{esc(kind)} · {esc(d["industry"])} · {esc(proj["year"])}</p>
      <h1 id="case-title" class="case-headline type-display" data-vt="case-{esc(proj["slug"])}">{esc(d["name"])}</h1>
    </header>
    <div class="case-summary">
      <p class="case-summary-text">{self.fmt(d["summary"])}</p>
      <div class="case-summary-side">{self.facts_html(lang, proj)}{self.tags_html(lang, proj)}</div>
    </div>
    {visual}
    {self.case_glance(lang, d)}
    {self.case_chapters(lang, d)}
    {self.case_video(lang, page, proj)}{gallery}{live}
    {cta}
    {next_link}
  </div>
</article>"""
        counterparts = {other: self.case_path(other, proj["slug"]) for other in LANGS}
        ld = []
        if self.page_url(""):
            org_id, _ = self.ld_ids()
            ld = [
                self.ld_breadcrumb([(c["services"]["pageLabels"]["breadcrumbHome"], self.home_path(lang)),
                                    (pj["eyebrow"], self.home_path(lang) + "#projekte"),
                                    (d["name"], page.path)]),
                {"@type": "CreativeWork", "name": d["name"], "description": truncate(self.text(d["summary"])),
                 "url": self.page_url(page.path), "inLanguage": lang, "creator": {"@id": org_id}},
            ]
        return self.simple_page(lang, page, title=self.page_title(f"{d['name']}: {d['services']}", lang, page),
                                description=truncate(self.text(d["summary"])), main=main, counterparts=counterparts,
                                noindex=bool(proj.get("draft")), data={"page": "case", "shape": proj["shape"]},
                                body_class="page-case", og_type="article", ld=ld, curtain=self.case_curtain(lang, proj))

    def service_page(self, lang: str, svc: dict) -> str:
        c = self.langs[lang]
        labels = c["services"]["pageLabels"]
        d = svc[lang]
        text = d["page"]
        index = self.services.index(svc)
        page = Page(self.service_path(lang, svc), lang, "service")
        home = self.home_path(lang)
        draft = f'<p class="draft-badge draft-badge--inline">{esc(c["ui"]["draftBadge"])}</p>' if svc["page"].get("draft") else ""
        ask = page.to(home) + f'?thema={svc["topic"]}#kontakt'  # maskiert in action()

        def block(key: str, body: str) -> str:
            if not body:
                return ""
            return (f'<section class="service-block" aria-labelledby="svc-{key}" data-rv><h2 class="service-block-title type-display" id="svc-{key}">'
                    f'{esc(labels[key])}</h2><div class="service-block-body">{body}</div></section>')

        intro = "".join(f"<p>{self.fmt(p)}</p>" for p in text.get("intro", []))
        includes = '<ul class="check-list">' + "".join(f"<li>{esc(t)}</li>" for t in d["tags"]) + "</ul>"
        step_texts = [STEP_NUMBER_RE.sub("", s) for s in d["stories"]]
        steps = '<ol class="service-steps">' + "".join(
            f'<li><span class="col-n type-mono" aria-hidden="true">0{k + 1}</span><span>{esc(s)}</span></li>'
            for k, s in enumerate(step_texts)) + "</ol>"
        for_whom = ""
        if text.get("forWhom"):
            for_whom = '<ul class="check-list">' + "".join(f"<li>{self.fmt(x)}</li>" for x in text["forWhom"]) + "</ul>"
        faq = "".join(
            f'<details class="faq-item"><summary>{self.fmt(item["q"])}</summary><div class="faq-answer"><p>{self.fmt(item["a"])}</p></div></details>'
            for item in text.get("faq", []))
        related = [p for p in self.visible_projects() if svc["key"] in p.get("serviceKeys", [])]
        projects_html = ""
        if related:
            pj = c["projects"]
            cards = "".join(
                f'<li><a class="related-card" href="{esc(page.to(self.case_path(lang, p["slug"])))}">'
                f'<span class="project-kind type-label">{esc(pj["kinds"][p["kind"]])}</span>'
                f'<span class="related-name type-display">{esc(p[lang]["name"])}</span>'
                f'<span class="related-meta">{esc(p[lang]["industry"])} · {esc(p["year"])}</span></a></li>'
                for p in related)
            projects_html = f'<ul class="related-list">{cards}</ul>'
        others = [s for s in self.visible_service_pages() if s is not svc]
        others_html = ""
        if others:
            links = "".join(f'<li>{pill_link(s[lang]["title"], page.to(self.service_path(lang, s)))}</li>'
                            for s in others)
            others_html = (f'<nav class="service-others" aria-labelledby="svc-others"><h2 class="service-block-title type-display" id="svc-others">'
                           f'{esc(labels["others"])}</h2><ul>{links}</ul></nav>')
        crumbs = [(labels["breadcrumbHome"], home), (labels["breadcrumbServices"], home + "#leistungen"), (d["title"], None)]
        main = f"""
<article class="service-page" aria-labelledby="service-title">
  <div class="service-page-inner">
    {self.breadcrumb(lang, page, crumbs)}
    <header class="service-hero">
      <div class="service-hero-text">
        {draft}
        {eyebrow(esc(d["cap"]))}
        <h1 class="service-page-title type-display" id="service-title">{esc(d["title"])}</h1>
        <p class="service-page-lead">{self.fmt(d["desc"])}</p>
        <div class="hero-actions">
          {action(labels["ctaButton"], ask, attrs=self.track("Erstgespräch-Klick", ort="Leistungsseite", leistung=svc["topic"]))}
        </div>
      </div>
      <div class="service-visual" aria-hidden="true"><canvas id="service-canvas" class="service-canvas"></canvas></div>
    </header>
    {block("intro", intro)}
    {block("includes", includes)}
    {block("approach", steps)}
    {block("forWhom", for_whom)}
    {block("faq", faq)}
    {block("projects", projects_html)}
    <section class="service-cta-card" aria-labelledby="svc-cta" data-rv>
      <h2 class="service-cta-title type-display" id="svc-cta">{esc(labels["ctaTitle"])}</h2>
      <p class="service-cta-text">{esc(labels["ctaText"])}</p>
      {action(labels["ctaButton"], ask, variant="on-dark", attrs=self.track("Erstgespräch-Klick", ort="Leistungsseite", leistung=svc["topic"]))}
    </section>
    {others_html}
  </div>
</article>"""
        counterparts = {other: self.service_path(other, svc) for other in LANGS}
        description = truncate(self.text(text.get("description") or d["desc"]))
        ld = []
        if self.page_url(""):
            org_id, _ = self.ld_ids()
            ld = [
                self.ld_breadcrumb([(crumbs[0][0], home), (crumbs[1][0], home + "#leistungen"), (d["title"], page.path)]),
                {"@type": "Service", "name": d["title"], "serviceType": d["cap"], "description": description,
                 "url": self.page_url(page.path), "provider": {"@id": org_id}, "areaServed": self.site["brand"]["countryCode"],
                 "inLanguage": lang},
            ]
        return self.simple_page(lang, page, title=self.page_title(f"{d['title']} – {d['cap']}", lang, page),
                                description=description, main=main, counterparts=counterparts,
                                noindex=bool(svc["page"].get("draft")), data={"page": "service", "service": index},
                                body_class="page-service", ld=ld)

    def legal_page(self, key: str) -> str:
        lang = "de"
        legal = self.langs["de"]["legal"][key]
        page = Page(legal["slug"] + "/", lang, "legal")
        v = self.vars(lang, page)
        parts = []
        for sec in legal["sections"]:
            cond = sec.get("if")
            if cond and dig(v, cond) in ("", None, False):
                continue
            inner = []
            for para in sec.get("paragraphs", []):
                rendered = self.fmt(para, v)
                if rendered:
                    inner.append(f"<p>{rendered}</p>")
            lines = [line for line in (self.fmt(x, v) for x in sec.get("lines", [])) if line]
            if lines:
                inner.append('<p class="legal-lines">' + "<br>".join(lines) + "</p>")
            if sec.get("list"):
                inner.append("<ul>" + "".join(f"<li>{self.fmt(x, v)}</li>" for x in sec["list"]) + "</ul>")
            for para in sec.get("after", []):
                rendered = self.fmt(para, v)
                if rendered:
                    inner.append(f"<p>{rendered}</p>")
            if inner:
                parts.append(f'<section class="legal-section"><h2>{esc(sec["heading"])}</h2>{"".join(inner)}</section>')
        updated = f'<p class="legal-updated type-mono">{self.fmt(legal["updatedLabel"], v)}</p>' if legal.get("updatedLabel") else ""
        c = self.langs["de"]
        draft = f'<p class="draft-badge draft-badge--inline">{esc(c["ui"]["draftBadge"])}</p>' if legal.get("draft") else ""
        main = f"""
<div class="legal-page">
  <div class="legal-container">
    {draft}
    {eyebrow(f'<a class="text-link" href="{page.to("")}">{esc(self.brand_full)}</a>')}
    <h1 class="legal-title type-display">{esc(legal["h1"])}</h1>
    <p class="legal-intro">{self.fmt(legal["intro"], v)}</p>
    {"".join(parts)}
    {updated}
  </div>
</div>"""
        return self.simple_page(lang, page, title=self.page_title(legal["title"], lang, page), description=legal["description"],
                                main=main, noindex=True, data={"page": "legal"}, body_class="page-legal")

    def message_page(self, lang: str, key: str) -> str:
        c = self.langs[lang]
        msg = c["pages"][key]
        page = Page(self.lang_prefix(lang) + msg["slug"] + "/", lang, "message")
        v = self.vars(lang, page)
        back = page.to(self.home_path(lang)) + ("#kontakt" if key == "error" else "")
        counterparts = {other: self.lang_prefix(other) + self.langs[other]["pages"][key]["slug"] + "/" for other in LANGS}
        main = f"""
<div class="message-page">
  <div class="message-container">
    {eyebrow(esc(self.brand_full))}
    <h1 class="message-title type-display">{esc(msg["h1"])}</h1>
    <p class="message-text">{self.fmt(msg["text"], v)}</p>
    {action(msg["back"], back, magnetic=False)}
  </div>
</div>"""
        return self.simple_page(lang, page, title=self.page_title(msg["title"], lang, page), description=truncate(self.text(msg["text"], v), 150),
                                main=main, counterparts=counterparts, noindex=True, data={"page": "message"})

    def not_found(self) -> str:
        lang = "de"
        msg = self.langs["de"]["pages"]["notFound"]
        page = Page("", lang, "notfound", absolute=True)
        main = f"""
<div class="message-page">
  <div class="message-container">
    {eyebrow("404")}
    <h1 class="message-title type-display">{esc(msg["h1"])}</h1>
    <p class="message-text">{esc(msg["text"])}</p>
    <p class="message-text" lang="en">This page does not exist.</p>
    {action(msg["back"], "/", magnetic=False)}
  </div>
</div>"""
        return self.simple_page(lang, page, title=self.page_title(msg["title"], lang, page), description=msg["text"],
                                main=main, noindex=True, data={"page": "notfound"})
