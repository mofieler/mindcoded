"""Abschnitte der Startseite."""
from __future__ import annotations

import re

from .common import LANGS, STEP_NUMBER_RE, Page, esc
from .components import action, card, eyebrow, link_action


class SectionsMixin:
    def hero(self, lang: str, has_projects: bool) -> str:
        c = self.langs[lang]
        h = c["hero"]
        secondary = link_action(h["ctaProjects"], "#projekte") if has_projects else link_action(h["ctaProcess"], "#ablauf")
        stages = "".join(
            f'<div class="hero-stage-item"><div class="hero-stage-label"><span class="stage-num type-mono">0{i + 1}</span>'
            f'<span class="stage-name type-mono">{esc(name)}</span></div><div class="hero-stage-bar"><div data-pbar="{i}"></div></div></div>'
            for i, name in enumerate(h["stages"])
        )
        return f"""
<section id="hero" class="hero-section" aria-labelledby="hero-title">
  <div class="hero-overlay" aria-hidden="true"></div>
  <canvas id="hero-canvas" class="hero-canvas" aria-hidden="true"></canvas>
  <div id="hero-inner" class="hero-content-wrapper">
    <div class="hero-grid">
      <div class="hero-text-col">
        <div class="hero-mobile-stage-box" data-hero-stage-box aria-hidden="true"></div>
        <p class="hero-eyebrow type-label">{esc(h["eyebrow"])}</p>
        <h1 class="hero-title type-display" id="hero-title">
          <span class="hero-line">{esc(h["h1a"])}</span>
          <span class="hero-line">{esc(h["h1b"])}</span>
          <span class="typed-row"><span id="hero-typed-text" class="typed-text" data-typed>{esc(h["words"][0])}</span><span class="cursor" aria-hidden="true"></span></span>
        </h1>
        <p class="hero-lead">{self.fmt(h["lead"])}</p>
        <div class="hero-actions">
          {action(h["cta"], "#kontakt")}
          {secondary}
        </div>
        <div class="hero-mobile-stages" aria-hidden="true">{stages}</div>
      </div>
    </div>
  </div>
  <div class="hero-desktop-stage-box" data-hero-stage-box aria-hidden="true"></div>
  <div class="hero-footer-bar">
    <div class="hero-footer-inner">
      <div class="hero-stages-grid" aria-hidden="true">{stages}</div>
    </div>
  </div>
</section>"""

    def services_section(self, lang: str, page: Page) -> str:
        s = self.langs[lang]["services"]
        labels = s["pageLabels"]
        items = []
        for i, svc in enumerate(self.services):
            d = svc[lang]
            first = i == 0
            tags = "".join(f'<li class="service-tag-pill type-mono">{esc(t)}</li>' for t in d["tags"])
            name = f'<span class="visually-hidden">: {esc(d["title"])}</span>'
            more = ""
            if self.has_service_page(svc):
                more = (f'<a class="service-more-link" href="{esc(page.to(self.service_path(lang, svc)))}">'
                        f'{esc(labels["more"])}{name} <span aria-hidden="true">→</span></a>')
            ask = (f'<a class="service-ask-link" href="#kontakt" data-topic-select="{esc(svc["topic"])}">'
                   f'{esc(labels["ask"])}{name}</a>')
            # Die Animation zeigt die vier Schritte nur als Bild (für Screenreader ausgeblendet) –
            # hier stehen sie als Text.
            steps = "".join(f"<li>{esc(STEP_NUMBER_RE.sub('', s))}</li>" for s in d["stories"])
            steps = f'<div class="visually-hidden"><p>{esc(labels["approach"])}:</p><ol>{steps}</ol></div>'
            items.append(f"""
        <div class="service-accordion-item accordion-item{' is-active is-open' if first else ''}" data-service-idx="{i}">
          <h3 class="accordion-heading">
            <button type="button" class="service-toggle-btn" id="service-btn-{i}" aria-expanded="{'true' if first else 'false'}" aria-controls="service-panel-{i}">
              <span class="service-num type-mono" aria-hidden="true">0{i + 1}</span>
              <span class="service-item-title type-display">{esc(d["title"])}</span>
              <span class="accordion-icon" aria-hidden="true">{self.accordion_icon()}</span>
            </button>
          </h3>
          <div class="accordion-panel" id="service-panel-{i}" role="region" aria-labelledby="service-btn-{i}">
            <div class="accordion-panel-inner">
              <div class="service-content-body">
                <p class="service-desc">{self.fmt(d["desc"])}</p>
                <ul class="service-tags-list">{tags}</ul>
                {steps}
                <div class="service-links">{more}{ask}</div>
              </div>
            </div>
          </div>
        </div>""")
        first = self.services[0][lang]
        bars = "".join(f'<div class="story-bar-track"><div class="story-bar-fill" data-scbar="{k}"></div></div>' for k in range(4))
        return f"""
<section id="leistungen" class="section services-section" aria-labelledby="services-title">
  <div class="section-container">{self.section_head(s, "services-title")}
    <div class="services-main-grid">
      <div id="services-accordion-list" class="services-accordion-list" data-rv>{"".join(items)}
      </div>
      <div class="services-stage-container">
        <div id="services-stage-card" class="services-stage-card" aria-hidden="true">
          <canvas id="services-canvas" class="services-canvas"></canvas>
          <div class="mobile-swipe-hint type-mono">{esc(s["swipeHint"])}</div>
          <div class="services-card-top type-label"><span id="services-card-cap">{esc(first["cap"])}</span><span id="services-card-idx">01 / 0{len(self.services)}</span></div>
          <div class="services-card-bottom">
            <div class="story-title-row"><span id="story-scene-title" class="story-scene-title type-display">{esc(first["stories"][0])}</span><span id="story-scene-counter" class="story-scene-counter type-mono">1 / 4</span></div>
            <div class="story-bars-grid">{bars}</div>
          </div>
        </div>
      </div>
    </div>{f'<p class="services-extra" data-rv>{self.fmt(s["extra"])}</p>' if s.get("extra") else ""}
  </div>
</section>"""

    def process(self, lang: str) -> str:
        p = self.langs[lang]["process"]
        steps = "".join(
            f'<li class="process-step col-block"><span class="col-n type-mono" aria-hidden="true">0{i + 1}</span>'
            f'<h3 class="col-h type-display">{esc(step["title"])}</h3><p class="col-t">{self.fmt(step["text"])}</p></li>'
            for i, step in enumerate(p["steps"])
        )
        effort = "".join(f"<li>{self.fmt(x)}</li>" for x in p["effortItems"])
        return f"""
<section id="ablauf" class="section process-section" aria-labelledby="process-title">
  <div class="section-container">{self.section_head(p, "process-title")}
    <ol class="process-steps" data-rv>{steps}</ol>
    <div class="effort-card" data-rv>
      <h3 class="effort-title type-display">{esc(p["effortTitle"])}</h3>
      <ul class="check-list">{effort}</ul>
      <p class="effort-note">{self.fmt(p["effortNote"])}</p>
    </div>
  </div>
</section>"""

    def about(self, lang: str, page: Page) -> str:
        a = self.langs[lang]["about"]
        about_cfg = self.site["about"]
        v = self.vars(lang, page)
        person = ""
        name = about_cfg.get("personName", "")
        if name:
            photo = ""
            if about_cfg.get("photo"):
                photo = self.img_html({"src": about_cfg["photo"], "width": about_cfg["photoWidth"], "height": about_cfg["photoHeight"],
                                       "alt": {lang: a["photoAlt"]}}, lang, page, sizes="200px", cls="person-photo")
            person = f"""
      <figure class="person-card" data-rv>
        {photo}
        <figcaption>
          <p class="person-name type-display">{self.fmt(name)}</p>
          <p class="person-role type-label">{self.fmt(a["personRole"])}</p>
          <p class="person-bio">{self.fmt(a["personBio"])}</p>
        </figcaption>
      </figure>"""
        cta = action(a["cta"], "#kontakt")
        lead = f'<p class="section-lead">{self.fmt(a["lead"], v)}</p><div class="about-cta">{cta}</div>'
        reasons = ""
        if a.get("reasons"):
            cards = "".join(card(r["title"], self.fmt(r["text"]), level=4) for r in a["reasons"]["items"])
            reasons = (f'<div class="about-reasons" data-rv><h3 class="about-reasons-title type-display">{esc(a["reasons"]["title"])}</h3>'
                       f'<ul class="about-reasons-list snap-row">{cards}</ul></div>')
        return f"""
<section id="studio" class="section about-section" aria-labelledby="about-title">
  <div class="section-container">{self.section_head(a, "about-title", lead)}{person}{reasons}
  </div>
</section>"""

    def projects_section(self, lang: str, page: Page, projects: list) -> str:
        c = self.langs[lang]
        pj = c["projects"]
        cols = pj["cols"]
        rows = []
        cards = []
        for i, proj in enumerate(projects):
            d = proj[lang]
            if proj.get("featured") and proj.get("images"):
                cards.append(self.project_card(lang, page, proj))
                continue
            kind = pj["kinds"][proj["kind"]]
            draft = f'<span class="draft-badge">{esc(c["ui"]["draftBadge"])}</span>' if proj.get("draft") else ""
            if proj.get("images"):
                img = proj["images"][0]
                preview = self.img_html(img, lang, page, cls=f"project-preview-img {self.img_class(img)}".strip(),
                                        sizes="(max-width: 1023px) calc(100vw - 40px), 55vw")
            else:
                preview = (f'<canvas class="project-preview-canvas" data-project-canvas="{proj["shape"]}" aria-hidden="true"></canvas>'
                           f'<span class="project-preview-badge type-label">{esc(pj["illustration"])}</span>')
            rows.append(f"""
        <div class="project-item accordion-item" data-project-idx="{i}">
          <h3 class="accordion-heading">
            <button type="button" class="project-row-btn" id="project-btn-{i}" aria-expanded="false" aria-controls="project-panel-{i}">
              <span class="project-num type-mono" aria-hidden="true">0{i + 1}</span>
              <span class="project-name-wrapper">
                <span class="project-name type-display" data-vt="case-{esc(proj["slug"])}">{esc(d["name"])}</span>
                <span class="project-kind type-label">{esc(kind)}</span>
                <span class="project-mobile-meta type-label">{esc(d["industry"])} · {esc(proj["year"])}</span>
              </span>
              <span class="project-col-text">{esc(d["industry"])}</span>
              <span class="project-col-text">{esc(d["services"])}</span>
              <span class="project-col-year type-mono">{esc(proj["year"])}</span>
              <span class="accordion-icon" aria-hidden="true">{self.accordion_icon()}</span>
            </button>
          </h3>
          <div class="accordion-panel" id="project-panel-{i}" role="region" aria-labelledby="project-btn-{i}">
            <div class="accordion-panel-inner">
              <div class="project-expanded-grid">
                <div class="project-preview-card">{preview}{draft}</div>
                <div class="project-details-col">
                  <p class="project-summary">{self.fmt(d["summary"])}</p>
                  {self.facts_html(lang, proj, limit=4)}
                  {self.tags_html(lang, proj)}
                  {action(pj["cta"], page.to(self.case_path(lang, proj["slug"])), attrs=self.curtain_link(self.case_curtain(lang, proj)), hidden_suffix=": " + d["name"])}
                </div>
              </div>
            </div>
          </div>
        </div>""")
        header = (f'<div class="projects-table-header type-label" aria-hidden="true"><span>{esc(cols["nr"])}</span><span>{esc(cols["name"])}</span>'
                  f'<span>{esc(cols["industry"])}</span><span>{esc(cols["services"])}</span><span>{esc(cols["year"])}</span><span></span></div>')
        lead = f'<p class="section-lead">{self.fmt(pj["lead"])}</p>'
        featured = f'<ul class="project-cards" role="list">{"".join(cards)}</ul>' if cards else ""
        # Mit Karten darüber bekommt die Liste eine eigene Überschrift; der Hinweis gehört zur Liste.
        more = (f'<div class="projects-more-head"><h3 class="projects-more-title type-display">{esc(pj["moreTitle"])}</h3>'
                if cards else '<div class="projects-more-head">')
        more += f'<p class="section-note type-label">{esc(pj["note"])}</p></div>'
        return f"""
<section id="projekte" class="section projects-section" aria-labelledby="projects-title">
  <div class="section-container">{self.section_head(pj, "projects-title", lead)}{featured}
    <div class="projects-table" data-rv>
      {more}
      {header}
      <div id="projects-list" class="projects-list">{"".join(rows)}
      </div>
    </div>
  </div>
</section>"""

    def project_card(self, lang: str, page: Page, proj: dict) -> str:
        """Große Bildkarte für ein hervorgehobenes Projekt (projects.json › featured). Die ganze Karte ist
        der Link; ihr Name ist kurz (Projektname + Aktion) statt des gesamten Kartentexts."""
        pj = self.langs[lang]["projects"]
        d = proj[lang]
        slug = esc(proj["slug"])
        # Lieber ein randloser Screenshot als ein Mockup mit Rand – füllt die Karte und zeigt das Produkt.
        img = next((i for i in proj["images"] if i.get("fit") != "contain"), proj["images"][0])
        media = self.img_html(img, lang, page, cls=f"project-card-img {self.img_class(img)}".strip(),
                              sizes="(max-width: 767px) calc(100vw - 32px), 45vw")
        href = page.to(self.case_path(lang, proj["slug"]))
        return (f'<li class="project-card" data-rv><a class="project-card-link" href="{esc(href)}" '
                f'aria-labelledby="card-{slug}-title card-{slug}-cta"{self.curtain_link(self.case_curtain(lang, proj))}>'
                f'<div class="project-card-media">{media}</div>'
                f'<div class="project-card-body">'
                f'<p class="project-card-meta type-label">{esc(pj["kinds"][proj["kind"]])} · {esc(d["industry"])} · {esc(proj["year"])}</p>'
                f'<h3 class="project-card-title type-display" id="card-{slug}-title" data-vt="case-{slug}">{esc(d["name"])}</h3>'
                f'<p class="project-card-text">{self.fmt(d["summary"])}</p>'
                f'<p class="project-card-cta"><span id="card-{slug}-cta">{esc(pj["cta"])}</span>'
                f'<span class="cta-arrow" aria-hidden="true">→</span></p>'
                f'</div></a></li>')

    def facts_html(self, lang: str, proj: dict, limit: int | None = None) -> str:
        pj = self.langs[lang]["projects"]
        labels = pj["factLabels"]
        d = proj[lang]
        facts = [
            (labels["kind"], pj["kinds"][proj["kind"]]),
            (labels["industry"], d["industry"]),
            (labels["services"], d["services"]),
            (labels["year"], proj["year"]),
        ]
        if d.get("tech"):
            facts.append((labels["tech"], d["tech"]))
        if limit:
            facts = facts[:limit]
        items = "".join(f'<div class="fact-item"><dt class="fact-label type-label">{esc(k)}</dt><dd class="fact-value">{self.fmt(v)}</dd></div>'
                        for k, v in facts if v)
        return f'<dl class="project-facts-grid">{items}</dl>'

    def tags_html(self, lang: str, proj: dict) -> str:
        tags = proj[lang].get("tags") or []
        if not tags:
            return ""
        items = "".join(f'<li class="project-tag type-label">{esc(t)}</li>' for t in tags)
        return f'<ul class="project-tags" aria-label="{esc(self.langs[lang]["projects"]["tagsLabel"])}">{items}</ul>'

    def tools_strip(self, lang: str) -> str:
        """Leiste »Werkzeuge & Technik«: einfarbige Logos mit Namen (content/icons, Simple Icons), die
        ruhig durchlaufen. Die zweite Liste ist nur die Fortsetzung für die Endlosschleife."""
        tools = self.site.get("tools") or []
        if not tools:
            return ""
        label = self.langs[lang]["hero"]["toolsLabel"]
        items = "".join(f'<li class="tools-item">{self.tool_icon(t["icon"])}<span>{esc(t["name"])}</span></li>' for t in tools)
        return (f'<section class="tools-strip" aria-label="{esc(label)}">'
                f'<p class="tools-label type-label" aria-hidden="true">{esc(label)}</p>'
                f'<div class="tools-viewport"><div class="tools-track"><ul class="tools-list">{items}</ul>'
                f'<ul class="tools-list" aria-hidden="true">{items}</ul></div></div></section>')

    def tool_icon(self, name: str) -> str:
        """Nur die Pfade des Logos übernehmen – gefärbt wird es über currentColor."""
        svg = (self.content_dir / "icons" / f"{name}.svg").read_text(encoding="utf-8")
        paths = "".join(f'<path d="{d}"/>' for d in re.findall(r'\sd="([0-9A-Za-z.,\s-]+)"', svg))
        return f'<svg class="tools-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">{paths}</svg>'

    def contact(self, lang: str, page: Page) -> str:
        c = self.langs[lang]
        ct = c["contact"]
        v = self.vars(lang, page)
        lim = self.site["contact"]["limits"]
        email = self.site["brand"]["email"]
        opt = f' <span class="field-optional">({esc(ct["optional"])})</span>'
        topics = "".join(
            f'<label class="topic-chip"><input type="checkbox" name="topics[]" value="{esc(t["key"])}"><span>{esc(t["label"])}</span></label>'
            for t in ct["topics"]
        )
        timeline = "".join(f'<option value="{esc(o["value"])}">{esc(o["label"])}</option>' for o in ct["timelineOptions"])
        consent = ""
        if self.site["contact"]["requireConsent"]:
            consent = f"""
          <div class="form-field form-field--check">
            <input type="checkbox" id="cf-consent" name="consent" value="1" required aria-describedby="cf-consent-error">
            <label for="cf-consent">{self.fmt(ct["consentLabel"], v)}</label>
            <p id="cf-consent-error" class="field-error" hidden></p>
          </div>"""
        return f"""
<section id="kontakt" class="contact-section" aria-labelledby="contact-title">
  <div class="contact-container">
    <div class="contact-canvas-wrapper" aria-hidden="true"><canvas id="contact-canvas" class="contact-canvas"></canvas></div>
    <div class="contact-main-grid">
      <div class="contact-info-col" data-rv>
        {eyebrow(esc(ct["eyebrow"]), navy=True)}
        <h2 class="contact-title type-display" id="contact-title">{esc(ct["h"])} <em>{esc(ct["em"])}</em></h2>
        <p class="contact-lead">{self.fmt(ct["lead"])}</p>
        <div class="contact-next">
          <p class="contact-label-dim type-label">{esc(ct["nextTitle"])}</p>
          <ol class="contact-steps">{"".join(f'<li>{self.fmt(step)}</li>' for step in ct["nextSteps"])}</ol>
        </div>
        <div class="contact-direct-links">
          <p class="contact-label-dim type-label">{esc(ct["direct"])}</p>
          <a href="mailto:{esc(email)}" class="contact-mail-link type-display">{esc(email)}</a>
          <p class="contact-location">{esc(ct["loc"])}</p>
        </div>
      </div>
      <div class="contact-form-col" data-rv>
        <form id="contact-form" class="contact-form-card" action="{esc(page.to(self.site["contact"]["endpoint"]))}" method="post" aria-labelledby="contact-form-title">
          <h3 class="visually-hidden" id="contact-form-title">{esc(ct["formTitle"])}</h3>
          <input type="hidden" name="lang" value="{lang}">
          <input type="hidden" name="elapsed" value="">
          <input type="hidden" name="altcha" value="">
          <p class="form-required-note">{esc(ct["requiredNote"])}</p>
          <fieldset class="topic-group">
            <legend class="contact-label type-label">{esc(ct["topicLegend"])}{opt}</legend>
            <div id="contact-topic-chips" class="topic-chips-wrapper">{topics}</div>
          </fieldset>
          <div class="form-field">
            <label for="cf-name" class="contact-label type-label">{esc(ct["nameLabel"])}</label>
            <input type="text" id="cf-name" name="name" class="form-input" autocomplete="name" required maxlength="{lim["nameMax"]}" aria-describedby="cf-name-error">
            <p id="cf-name-error" class="field-error" hidden></p>
          </div>
          <div class="form-field">
            <label for="cf-email" class="contact-label type-label">{esc(ct["emailLabel"])}</label>
            <input type="email" id="cf-email" name="email" class="form-input" autocomplete="email" inputmode="email" required maxlength="{lim["emailMax"]}" spellcheck="false" aria-describedby="cf-email-hint cf-email-error">
            <p id="cf-email-hint" class="field-hint">{esc(ct["emailHint"])}</p>
            <p id="cf-email-error" class="field-error" hidden></p>
          </div>
          <div class="form-field">
            <label for="cf-message" class="contact-label type-label">{esc(ct["messageLabel"])}</label>
            <textarea id="cf-message" name="message" class="form-textarea" rows="4" required minlength="{lim["messageMin"]}" maxlength="{lim["messageMax"]}" aria-describedby="cf-message-hint cf-message-error"></textarea>
            <p id="cf-message-hint" class="field-hint">{esc(ct["messageHint"])}</p>
            <p id="cf-message-error" class="field-error" hidden></p>
          </div>
          <div class="form-field">
            <label for="cf-timeline" class="contact-label type-label">{esc(ct["timelineLabel"])}{opt}</label>
            <select id="cf-timeline" name="timeline" class="form-select">{timeline}</select>
          </div>
          <div class="hp-field" aria-hidden="true">
            <label for="cf-website">{esc(ct["honeypotLabel"])}</label>
            <input type="text" id="cf-website" name="website" tabindex="-1" autocomplete="off">
          </div>{consent}
          <p class="form-privacy">{self.fmt(ct["privacyNotice"], v)}</p>
          <div id="contact-status" class="form-status" role="status" aria-live="polite"></div>
          {action(ct["send"], variant="on-dark", submit=True, label_attrs=" data-submit-label")}
        </form>
        <div id="contact-thanks-card" class="contact-thanks-card" hidden>
          <h3 class="thanks-title type-display" tabindex="-1">{esc(ct["thanks"])}</h3>
          <p class="thanks-text">{self.fmt(ct["thanksText"])}</p>
          <button type="button" id="contact-reset-btn" class="thanks-reset-btn">{esc(ct["again"])}</button>
        </div>
      </div>
    </div>
  </div>
</section>"""

    def home(self, lang: str) -> str:
        c = self.langs[lang]
        page = Page(self.home_path(lang), lang, "home")
        projects = self.visible_projects()
        counterparts = {other: self.home_path(other) for other in LANGS}
        v = self.vars(lang, page)
        ct = c["contact"]
        sections = [self.hero(lang, bool(projects)), self.tools_strip(lang), self.services_section(lang, page)]
        if projects:
            sections.append(self.projects_section(lang, page, projects))
        sections += [self.process(lang), self.about(lang, page), self.contact(lang, page)]
        fab = (f'<a href="#kontakt" id="mobile-fab" class="mobile-fab-btn"><span class="mobile-fab-label">{esc(c["ui"]["headerCta"])}</span>'
               f'<span class="cta-arrow" aria-hidden="true">→</span></a>')
        body = "\n".join([
            '<div id="progress-bar" class="progress-bar" aria-hidden="true"></div>',
            self.header(lang, page, counterparts),
            '<main id="main" tabindex="-1">', *sections, "</main>",
            self.footer(lang, page),
            self.mobile_menu(lang, page, counterparts),
            fab,
        ])
        data = {
            "page": "home",
            "words": c["hero"]["words"],
            "services": [{"cap": s[lang]["cap"], "stories": s[lang]["stories"]} for s in self.services],
            "contact": {
                "endpoint": page.to(self.site["contact"]["endpoint"]),
                # Spam-Schutz: Aufgabe vom Endpunkt, gelöst im Worker (assets/pow-worker.js)
                "challenge": {"url": page.to(self.site["contact"]["endpoint"]) + "?challenge",
                              "worker": self.asset(page, "pow-worker.js"),
                              "ttl": self.site["contact"]["challenge"]["ttlMinutes"] * 60},
                "limits": self.site["contact"]["limits"],
                "requireConsent": self.site["contact"]["requireConsent"],
                "topics": [t["key"] for t in ct["topics"]],
                "send": ct["send"], "sending": ct["sending"],
                "errors": {k: self.plain(text, v) for k, text in ct["errors"].items()},
                # Notausgang, wenn der Versand scheitert: Nachricht im eigenen E-Mail-Programm öffnen
                "fallback": {"email": self.site["brand"]["email"], "label": ct["mailFallback"],
                             "subject": self.plain(ct["mailFallbackSubject"], v)},
            },
        }
        return self.shell(page, title=c["meta"]["title"], description=c["meta"]["description"], body=body,
                          alternates=counterparts, data=data, body_class="page-home",
                          curtain=self.home_curtain(lang))
