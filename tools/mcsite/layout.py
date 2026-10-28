"""Seitenrahmen und wiederkehrende Bausteine (Head, Header, Menü, Footer, Bilder)."""
from __future__ import annotations

from .common import ANALYTICS_EVENTS, LANGS, Page, esc, is_todo, script_json
from .components import eyebrow


class LayoutMixin:
    # ------------------------------------------------------------------ Seitenrahmen

    def shell(self, page: Page, *, title: str, description: str, body: str,
              alternates: dict | None = None, noindex: bool = False, data: dict | None = None,
              body_class: str = "", og_type: str = "website", ld: list | None = None,
              curtain: dict | None = None) -> str:
        lang = page.lang
        c = self.langs[lang]
        site = self.site
        seo = site.get("seo", {})
        v = self.vars(lang, page)
        title_text = self.text(title, v)
        desc_text = self.text(description, v)
        light, dark = self.tokens["light"], self.tokens["dark"]

        head = [
            '<meta charset="utf-8">',
            '<meta name="viewport" content="width=device-width, initial-scale=1">',
            f"<title>{esc(title_text)}</title>",
            f'<meta name="description" content="{esc(desc_text)}">',
        ]
        if noindex or not self.release:
            head.append('<meta name="robots" content="noindex, follow">')
        if seo.get("googleSiteVerification"):
            head.append(f'<meta name="google-site-verification" content="{esc(seo["googleSiteVerification"])}">')
        if seo.get("bingSiteVerification"):
            head.append(f'<meta name="msvalidate.01" content="{esc(seo["bingSiteVerification"])}">')

        canonical = None if noindex else self.page_url(page.path)
        if canonical:
            head.append(f'<link rel="canonical" href="{esc(canonical)}">')
            for alt_lang, alt_path in (alternates or {}).items():
                head.append(f'<link rel="alternate" hreflang="{alt_lang}" href="{esc(self.page_url(alt_path))}">')
            if alternates and "de" in alternates:
                head.append(f'<link rel="alternate" hreflang="x-default" href="{esc(self.page_url(alternates["de"]))}">')

        head += [
            f'<meta property="og:type" content="{og_type}">',
            f'<meta property="og:site_name" content="{esc(self.brand_full)}">',
            f'<meta property="og:title" content="{esc(title_text)}">',
            f'<meta property="og:description" content="{esc(desc_text)}">',
            f'<meta property="og:locale" content="{esc(c["locale"])}">',
        ]
        for other in (alternates or {}):
            if other != lang:
                head.append(f'<meta property="og:locale:alternate" content="{esc(self.langs[other]["locale"])}">')
        if canonical:
            head.append(f'<meta property="og:url" content="{esc(canonical)}">')
        social = site.get("socialImage")
        if social and self.page_url(""):
            head += [
                f'<meta property="og:image" content="{esc(self.page_url("assets/" + social))}">',
                f'<meta property="og:image:width" content="{self.social_size[0]}">',
                f'<meta property="og:image:height" content="{self.social_size[1]}">',
                f'<meta property="og:image:alt" content="{self.attr(c["meta"]["socialAlt"], v)}">',
                '<meta name="twitter:card" content="summary_large_image">',
            ]
        else:
            head.append('<meta name="twitter:card" content="summary">')
        head += [
            f'<meta name="theme-color" content="{light["color-bg"]}" media="(prefers-color-scheme: light)">',
            f'<meta name="theme-color" content="{dark["color-bg"]}" media="(prefers-color-scheme: dark)">',
            f'<link rel="icon" href="{page.to("favicon.ico")}" sizes="32x32">',
            f'<link rel="icon" href="{page.to("favicon.svg")}" type="image/svg+xml">',
            f'<link rel="apple-touch-icon" href="{page.to("apple-touch-icon.png")}">',
            f'<link rel="manifest" href="{page.to("site.webmanifest")}">',
        ]
        for font in self.preload_fonts:
            head.append(f'<link rel="preload" href="{page.to("assets/fonts/" + font)}" as="font" type="font/woff2" crossorigin>')
        head += [
            f'<link rel="stylesheet" href="{self.asset(page, "style.css")}">',
            f'<script src="{self.asset(page, "theme-init.js")}"></script>',
            f'<script type="module" src="{self.asset(page, "app.js")}"></script>',
            *self.analytics_tag(),
            # Ganzer Modulbaum parallel statt Kette von Anfragen (app.js → hero.js → hero-canvas.js …)
            *(f'<link rel="modulepreload" href="{self.asset(page, name)}">' for name in self.module_graph("app.js")),
        ]
        if canonical:
            head.append(self.structured_data(lang, ld or []))

        payload = {"lang": lang, "home": page.to(self.home_path(lang)), "media": self.media,
                   "ui": {"menuOpen": c["ui"]["menuOpen"], "menuClose": c["ui"]["menuClose"]}}
        payload.update(data or {})

        dev = ""
        if not self.release:
            dev = (f'<p class="dev-badge type-mono">Entwicklungs-Build · Entwürfe sichtbar · '
                   f'<a href="{page.to("BETREIBER-TODO.html")}">offene Angaben</a> · '
                   f'<a href="{page.to("komponenten/")}">Komponenten</a></p>')

        theme = site["defaultTheme"]
        attrs = [f'lang="{lang}"', 'class="no-js"', f'data-theme="{"dark" if theme == "dark" else "light"}"',
                 f'data-theme-default="{esc(theme)}"']
        if page.kind == "home":
            attrs.append(f'data-intro="{esc(site["intro"])}"')
        if curtain:
            attrs.append(f'data-curtain-page="{esc(page.kind)}"')
            if curtain.get("targets"):
                attrs.append(f'data-curtain-targets="{esc(" ".join(curtain["targets"]))}"')
        return (
            "<!DOCTYPE html>\n"
            f'<html {" ".join(attrs)}>\n<head>\n'
            + "\n".join(head)
            + f'\n</head>\n<body class="{body_class}">\n'
            + f'<a class="skip-link" href="#main">{esc(c["ui"]["skipLink"])}</a>\n'
            # Vorhang auf jeder Seite: Ausgang zu Projekten und Abschnitten; Eingang nur mit »curtain«
            + self.curtain_html(curtain or {}) + "\n"
            + body
            + f'\n{dev}\n<script type="application/json" id="mc-data">{script_json(payload)}</script>\n</body>\n</html>\n'
        )

    # ------------------------------------------------------------------ Strukturierte Daten

    def ld_ids(self) -> tuple[str, str]:
        base = self.page_url("")
        return base + "#organization", base + "#website"

    def structured_data(self, lang: str, extra: list) -> str:
        brand = self.site["brand"]
        seo = self.site.get("seo", {})
        operator = self.site["operator"]
        base = self.page_url("")
        org_id, site_id = self.ld_ids()
        address = {"@type": "PostalAddress", "addressLocality": brand["city"], "addressCountry": brand["countryCode"]}
        if seo.get("publishStreetAddress") and not any(is_todo(operator.get(k)) or not operator.get(k)
                                                        for k in ("street", "postalCode", "city")):
            address.update({"streetAddress": operator["street"], "postalCode": operator["postalCode"],
                            "addressLocality": operator["city"]})
        about = self.site.get("about", {})
        org = {
            "@type": "LocalBusiness",
            "@id": org_id,
            "name": self.brand_full,
            "url": base,
            "email": brand["email"],
            "description": self.text(self.langs[lang]["meta"]["description"]),
            "logo": base + "icon-512.png",
            "image": base + ("assets/" + self.site["socialImage"] if self.site.get("socialImage") else "icon-512.png"),
            "address": address,
            # Einsatzgebiet: Stuttgart und Region (content/site.json › seo.areaServed), remote deutschlandweit
            "areaServed": [{"@type": "City", "name": city} for city in seo.get("areaServed", [brand["city"]])]
                          + [{"@type": "Country", "name": "Deutschland"}],
            "knowsAbout": [self.text(s[lang]["title"]) for s in self.services],
        }
        if about.get("personName") and not is_todo(about["personName"]):
            founder = {"@type": "Person", "name": about["personName"], "jobTitle": self.text(self.langs[lang]["about"]["personRole"])}
            if about.get("photo"):
                founder["image"] = base + "assets/" + about["photo"]
            org["founder"] = founder
        if seo.get("profiles"):
            org["sameAs"] = list(seo["profiles"])
        website = {"@type": "WebSite", "@id": site_id, "url": base, "name": self.brand_full,
                   "inLanguage": list(LANGS), "publisher": {"@id": org_id}}
        data = {"@context": "https://schema.org", "@graph": [org, website, *extra]}
        return '<script type="application/ld+json">' + script_json(data) + "</script>"

    def ld_breadcrumb(self, items: list[tuple[str, str]]) -> dict:
        return {"@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": i + 1, "name": name, "item": self.page_url(path)}
            for i, (name, path) in enumerate(items)
        ]}

    # ------------------------------------------------------------------ Bausteine

    def brand_html(self) -> str:
        b = self.site["brand"]
        return f'<span class="brand-name">{esc(b["name"])}</span><span class="brand-tld">{esc(b["tld"])}</span>'

    def analytics_tag(self) -> list[str]:
        """Besucherstatistik (Umami auf eigenem Server): keine Cookies, nichts im Browser gespeichert,
        »Do Not Track« wird beachtet, Ladezeiten (Core Web Vitals) werden mitgemessen – Entscheidung des Betreibers
        trotz Restrisiko nach § 25 TDDDG (docs/STATISTIK.md). Nur im Release-Build – Entwicklung und Tests zählen nicht mit."""
        cfg = self.site.get("analytics") or {}
        if not self.release or not cfg.get("websiteId"):
            return []
        domain = self.site["url"].split("//", 1)[-1]
        return [f'<script defer src="{esc(cfg["script"])}" data-website-id="{esc(cfg["websiteId"])}" '
                f'data-domains="{esc(domain)}" data-do-not-track="true" data-exclude-hash="true" data-performance="true"></script>']

    def nav_items(self, lang: str, page: Page) -> list[tuple[str, str, str]]:
        """(Beschriftung, Ziel, Abschnitts-ID) – auf Unterseiten zeigen Anker auf die Startseite."""
        has_projects = bool(self.visible_projects())
        home = "" if page.kind == "home" else page.to(self.home_path(lang))
        items = []
        for item in self.langs[lang]["nav"]:
            if item.get("requires") == "projects" and not has_projects:
                continue
            items.append((item["label"], home + item["href"], item["href"].lstrip("#")))
        return items

    def theme_toggle(self, lang: str) -> str:
        label = esc(self.langs[lang]["ui"]["themeLabel"])
        return (f'<button type="button" class="theme-toggle-btn" data-action="toggle-theme" aria-pressed="false">'
                f'<span class="visually-hidden">{label}</span><span class="theme-dial" data-theme-rot aria-hidden="true"></span></button>')

    def lang_switch(self, lang: str, page: Page, counterparts: dict) -> str:
        c = self.langs[lang]
        links = []
        for other in LANGS:
            target = counterparts.get(other, self.home_path(other))
            name = esc(self.langs[other]["langName"])
            current = ' aria-current="page"' if other == lang else ""
            cls = "lang-btn is-active" if other == lang else "lang-btn"
            track = "" if other == lang else self.track("Sprache gewechselt", nach=other)
            links.append(f'<a class="{cls}" href="{page.to(target)}" hreflang="{other}" lang="{other}"{current}{track}>'
                         f'<span aria-hidden="true">{other.upper()}</span><span class="visually-hidden">{name}</span></a>')
        return f'<nav class="lang-switcher type-mono" aria-label="{esc(c["ui"]["langNav"])}">{"".join(links)}</nav>'

    def cta_href(self, lang: str, page: Page) -> str:
        return "#kontakt" if page.kind == "home" else page.to(self.home_path(lang)) + "#kontakt"

    @staticmethod
    def spy_attr(page: Page, target: str) -> str:
        """Markiert Navigationslinks der Startseite für die Anzeige des aktuellen Abschnitts."""
        return f' data-spy="{esc(target)}"' if page.kind == "home" else ""

    def header(self, lang: str, page: Page, counterparts: dict) -> str:
        c = self.langs[lang]
        nav = "".join(
            f'<li><a href="{esc(href)}"{self.spy_attr(page, target)}{self.nav_curtain(lang, page, target)}>{esc(label)}</a></li>'
            for label, href, target in self.nav_items(lang, page)
        )
        v = self.vars(lang, page)
        return f"""
<header class="site-header" id="top" data-header>
  <div class="site-header-inner">
    <a href="{page.to(self.home_path(lang))}" id="site-logo" class="site-logo" aria-label="{self.attr(c["ui"]["homeLabel"], v)}">{self.brand_html()}</a>
    <nav class="desktop-nav" aria-label="{esc(c["ui"]["mainNav"])}"><ul>{nav}</ul></nav>
    <div class="header-controls">
      <a class="header-cta" href="{self.cta_href(lang, page)}"{self.nav_curtain(lang, page, "kontakt")}{self.track("Erstgespräch-Klick", ort="Kopfzeile")}>{esc(c["ui"]["headerCta"])}</a>
      {self.theme_toggle(lang)}
      {self.lang_switch(lang, page, counterparts)}
    </div>
    <div class="mobile-controls">
      {self.theme_toggle(lang)}
      <button type="button" id="menu-open-btn" class="menu-burger-btn" aria-expanded="false" aria-controls="mobile-menu">
        <span class="visually-hidden">{esc(c["ui"]["menuOpen"])}</span>
        <span class="burger-line-1" aria-hidden="true"></span><span class="burger-line-2" aria-hidden="true"></span>
      </button>
    </div>
  </div>
</header>"""

    def mobile_menu(self, lang: str, page: Page, counterparts: dict) -> str:
        c = self.langs[lang]
        email = self.site["brand"]["email"]
        links = "".join(
            f'<li><a href="{esc(href)}" class="menu-link-item"{self.spy_attr(page, target)}{self.nav_curtain(lang, page, target)}>'
            f'<span class="menu-link-num type-mono" aria-hidden="true">0{i + 1}</span>'
            f'<span class="menu-link-label type-display">{esc(label)}<span class="menu-dot" aria-hidden="true"></span></span>'
            f'<span class="menu-link-arrow" aria-hidden="true">→</span></a></li>'
            for i, (label, href, target) in enumerate(self.nav_items(lang, page))
        )
        return f"""
<div id="mobile-menu" class="mobile-overlay-menu" role="dialog" aria-modal="true" aria-label="{esc(c["ui"]["menuLabel"])}" hidden>
  <canvas id="menu-canvas" class="menu-canvas" aria-hidden="true"></canvas>
  <div class="menu-top-bar">
    <span class="site-logo" aria-hidden="true">{self.brand_html()}</span>
    <button type="button" id="menu-close-btn" class="menu-close-btn">
      <span class="visually-hidden">{esc(c["ui"]["menuClose"])}</span>
      <span class="close-cross" aria-hidden="true"><span class="close-cross-line-1"></span><span class="close-cross-line-2"></span></span>
    </button>
  </div>
  <nav class="menu-nav-links" aria-label="{esc(c["ui"]["mainNav"])}"><ul>{links}</ul></nav>
  <div class="menu-bottom-box">
    <a href="{self.cta_href(lang, page)}" class="menu-cta-pill"{self.track("Erstgespräch-Klick", ort="Menü")}><span>{esc(c["ui"]["headerCta"])}</span><span class="cta-arrow" aria-hidden="true">→</span></a>
    <div class="menu-sub-row">
      <div class="menu-controls-group">{self.theme_toggle(lang)}{self.lang_switch(lang, page, counterparts)}</div>
      <a href="mailto:{esc(email)}" class="menu-mail-link type-mono"{self.track("E-Mail-Klick", ort="Menü")}>{esc(email)}</a>
    </div>
  </div>
</div>"""

    def footer(self, lang: str, page: Page) -> str:
        c = self.langs[lang]
        v = self.vars(lang, page)
        legal = self.langs["de"]["legal"]
        imprint = page.to(legal["imprint"]["slug"] + "/")
        privacy = page.to(legal["privacy"]["slug"] + "/")
        de_attr = ' hreflang="de"' if lang != "de" else ""
        a11y = ""
        if "accessibility" in self.legal_keys():
            a11y = (f'\n      <li><a href="{page.to(legal["accessibility"]["slug"] + "/")}"{de_attr}>'
                    f'{esc(c["footer"]["accessibility"])}</a></li>')
        return f"""
<footer class="site-footer">
  <div class="site-footer-inner">
    <p class="footer-brand">{self.brand_html()}</p>
    <ul class="footer-links">
      <li><a href="{imprint}"{de_attr}>{esc(c["footer"]["imprint"])}</a></li>
      <li><a href="{privacy}"{de_attr}>{esc(c["footer"]["privacy"])}</a></li>{a11y}
      <li><a href="#top">{esc(c["footer"]["top"])} <span aria-hidden="true">↑</span></a></li>
      <li class="footer-motion"><button type="button" class="footer-motion-toggle" data-motion-toggle aria-pressed="false">
        <span class="motion-icon" aria-hidden="true"></span>{esc(c["ui"]["motionPause"])}</button></li>
    </ul>
    <p class="footer-copy type-mono">{self.fmt(c["footer"]["copyright"], v)}</p>
  </div>
</footer>"""

    def breadcrumb(self, lang: str, page: Page, items: list[tuple[str, str | None]]) -> str:
        """Sichtbarer Seitenpfad; letzter Eintrag ohne Link (aktuelle Seite)."""
        parts = []
        for label, target in items:
            if target is None:
                parts.append(f'<li aria-current="page">{esc(label)}</li>')
            else:
                parts.append(f'<li><a href="{esc(page.to(target))}">{esc(label)}</a></li>')
        return f'<nav class="breadcrumb type-label" aria-label="{esc(self.langs[lang]["ui"]["breadcrumb"])}"><ol>{"".join(parts)}</ol></nav>'

    def section_head(self, block: dict, id_: str, lead_html: str = "") -> str:
        lead = lead_html or f'<p class="section-lead">{self.fmt(block["lead"])}</p>'
        return f"""
    <div class="section-header-grid" data-rv>
      <div class="section-title-col">
        {eyebrow(esc(block["eyebrow"]))}
        <h2 class="section-title type-display" id="{id_}">{esc(block["h"])} <em>{esc(block["em"])}</em></h2>
      </div>
      <div class="section-lead-col">{lead}</div>
    </div>"""

    def accordion_icon(self) -> str:
        return '<span class="plus-icon"><span class="plus-icon-h"></span><span class="plus-icon-v"></span></span>'

    def img_html(self, img: dict, lang: str, page: Page, *, sizes: str, cls: str = "",
                 lazy: bool = True, priority: bool = False) -> str:
        """<img> mit Breite/Höhe (kein Layout-Sprung) und optional srcset für mehrere Größen."""
        srcset = ""
        if img.get("srcset"):
            variants = ", ".join(f'{esc(page.to("assets/" + s["src"]))} {int(s["width"])}w'
                                 for s in [img, *img["srcset"]])
            srcset = f' srcset="{variants}" sizes="{esc(sizes)}"'
        loading = ' loading="lazy"' if lazy else ""
        fetch = ' fetchpriority="high"' if priority else ""
        cls_attr = f' class="{cls}"' if cls else ""
        return (f'<img{cls_attr} src="{esc(page.to("assets/" + img["src"]))}"{srcset} alt="{self.attr(img["alt"][lang])}" '
                f'width="{int(img["width"])}" height="{int(img["height"])}"{loading}{fetch} decoding="async">')

    # ------------------------------------------------------------------ Vorhang beim Projektwechsel

    def curtain_html(self, cur: dict) -> str:
        """Vollflächiger Vorhang mit dem Ziel des Seitenwechsels (layout/curtain.css, transitions.js).
        Ein Inhalt je Ziel: »default« (Projekt bzw. Ausgang), auf der Startseite zusätzlich einer je
        Abschnitt – sichtbar über html[data-curtain-target] (theme-init.js). Rein dekorativ:
        Screenreader erleben einen normalen Seitenwechsel."""
        bodies = [self.curtain_body(cur, "default")]
        bodies += [self.curtain_body(target, key) for key, target in cur.get("targets", {}).items()]
        return ('<div class="page-curtain" aria-hidden="true" data-curtain>'
                f'<div class="curtain-top type-mono"><span class="curtain-brand">{esc(self.brand_full)}</span></div>'
                + "".join(bodies) + '<span class="curtain-progress"></span></div>')

    @staticmethod
    def curtain_body(cur: dict, key: str) -> str:
        """Nummer, Art, Linie, Titel (Wort für Wort in Masken) und Zusatz – derselbe Aufbau, den
        transitions.js beim Ausgang mit den Angaben des Links füllt."""
        words = " ".join(f'<span class="curtain-word"><span>{esc(w)}</span></span>' for w in str(cur.get("title", "")).split())
        return (f'<div class="curtain-body" data-curtain-body="{esc(key)}">'
                f'<p class="curtain-line-mask"><span class="curtain-index type-mono" data-curtain-index>{esc(cur.get("index", ""))}</span></p>'
                f'<p class="curtain-line-mask"><span class="curtain-kicker type-label" data-curtain-kicker>{esc(cur.get("kicker", ""))}</span></p>'
                '<span class="curtain-rule"></span>'
                f'<p class="curtain-title type-display" data-curtain-title>{words}</p>'
                f'<p class="curtain-line-mask"><span class="curtain-sub" data-curtain-sub>{esc(cur.get("sub", ""))}</span></p></div>')

    @staticmethod
    def track(event: str, **props: str) -> str:
        """Ereignis für die Besucherstatistik (Umami zählt Klicks auf Elemente mit data-umami-event).
        Nur Art des Klicks und Projekt – nie Eingaben oder personenbezogene Daten."""
        if event not in ANALYTICS_EVENTS:
            raise ValueError(f"Unbekanntes Statistik-Ereignis: {event}")
        return f' data-umami-event="{esc(event)}"' + "".join(f' data-umami-event-{k}="{esc(v)}"' for k, v in props.items())

    @staticmethod
    def curtain_link(cur: dict) -> str:
        """Attribute für einen Link, der mit Vorhang zu seinem Ziel wechselt."""
        return " data-curtain-link" + "".join(f' data-curtain-{key}="{esc(cur.get(key, ""))}"' for key in ("index", "kicker", "title", "sub"))

    def case_curtain(self, lang: str, proj: dict) -> dict:
        d = proj[lang]
        projects = self.visible_projects()
        number = next((i for i, p in enumerate(projects) if p is proj), 0) + 1
        return {"kicker": f'{self.langs[lang]["projects"]["kinds"][proj["kind"]]} · {d["industry"]}',
                "title": d["name"], "sub": d["services"], "index": f"{number:02d} / {len(projects):02d}"}

    def section_curtains(self, lang: str) -> dict[str, dict]:
        """Vorhang je Abschnitt der Startseite; Nummern wie im mobilen Menü (01 / 05 …)."""
        c = self.langs[lang]
        content_keys = {"leistungen": "services", "projekte": "projects", "ablauf": "process", "studio": "about", "kontakt": "contact"}
        items = self.nav_items(lang, Page(path="", lang=lang, kind="home"))
        out = {}
        for i, (_, _, target) in enumerate(items):
            sec = c.get(content_keys.get(target, ""))
            if sec:
                title = " ".join(part for part in (sec["h"], sec.get("em", "")) if part).rstrip(".?")
                out[target] = {"kicker": sec["eyebrow"], "title": title, "sub": "", "index": f"{i + 1:02d} / {len(items):02d}"}
        return out

    def projects_curtain(self, lang: str) -> dict:
        return self.section_curtains(lang).get("projekte", {})

    def home_curtain(self, lang: str) -> dict:
        """Startseite: ein Vorhang je Abschnitt, in den man von einer Unterseite springt."""
        return {**self.projects_curtain(lang), "targets": self.section_curtains(lang)}

    def nav_curtain(self, lang: str, page: Page, target: str) -> str:
        """Menü-Links von Unterseiten wechseln mit Vorhang zum Abschnitt – wie Projektlinks."""
        cur = self.section_curtains(lang).get(target) if page.kind != "home" else None
        return self.curtain_link(cur) if cur else ""

    def simple_page(self, lang: str, page: Page, *, title: str, description: str, main: str,
                    counterparts: dict | None = None, noindex: bool = False, data: dict | None = None,
                    body_class: str = "page-sub", og_type: str = "website", ld: list | None = None,
                    curtain: dict | None = None) -> str:
        counterparts = counterparts or {other: self.home_path(other) for other in LANGS}
        body = "\n".join([
            '<div id="progress-bar" class="progress-bar" aria-hidden="true"></div>',
            self.header(lang, page, counterparts),
            f'<main id="main" tabindex="-1">{main}</main>',
            self.footer(lang, page),
            self.mobile_menu(lang, page, counterparts),
        ])
        alternates = counterparts if not noindex else None
        return self.shell(page, title=title, description=description, body=body, alternates=alternates,
                          noindex=noindex, data=data, body_class=body_class, og_type=og_type, ld=ld, curtain=curtain)
