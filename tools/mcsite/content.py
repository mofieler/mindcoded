"""Inhalte laden und prüfen (content/*.json)."""
from __future__ import annotations

import re

from .blocks import BLOCK_TYPES, STATES
from .common import ASSETS, EMAIL_RE, IMAGE_PATH_RE, LANGS, PATH_SLUG_RE, SLUG_RE, is_todo, load_json


def contact_settings(site: dict, langs: dict) -> dict:
    """Formular-Regeln – eine Quelle für contact.php, Mock-Server und Frontend."""
    contact = site["contact"]
    de = langs["de"]["contact"]
    return {
        "limits": contact["limits"],
        "rate_limit": {
            "max": contact["rateLimit"]["maxRequests"],
            "window": contact["rateLimit"]["windowMinutes"] * 60,
        },
        "topics": [t["key"] for t in de["topics"]],
        "timelines": [o["value"] for o in de["timelineOptions"] if o["value"]],
        "topic_labels": {t["key"]: t["label"] for t in de["topics"]},
        "timeline_labels": {o["value"]: o["label"] for o in de["timelineOptions"] if o["value"]},
        "require_consent": bool(contact["requireConsent"]),
        "redirects": {
            lang: {
                "success": ("" if lang == "de" else f"{lang}/") + langs[lang]["pages"]["thanks"]["slug"] + "/",
                "error": ("" if lang == "de" else f"{lang}/") + langs[lang]["pages"]["error"]["slug"] + "/",
            }
            for lang in LANGS
        },
        "site_name": site["brand"]["name"] + site["brand"]["tld"],
    }


class ContentMixin:
    def load(self) -> None:
        self.site = load_json("site.json", self.content_dir)
        self.langs = {lang: load_json(f"{lang}.json", self.content_dir) for lang in LANGS}
        self.projects = load_json("projects.json", self.content_dir)["items"]
        self.services = load_json("services.json", self.content_dir)["items"]
        self._index_todos(self.site, "content/site.json")
        for lang in LANGS:
            self._index_todos(self.langs[lang], f"content/{lang}.json")
        self._index_todos(self.projects, "content/projects.json › items")
        self._index_todos(self.services, "content/services.json › items")
        # Die Website-Adresse wird nicht als Text gerendert, ist aber Pflicht (Canonical, Sitemap, hreflang).
        if is_todo(self.site.get("url")):
            self._note_todo(self.site["url"])
        self.validate()

    def _index_todos(self, data, path: str) -> None:
        if isinstance(data, dict):
            for key, value in data.items():
                if not key.startswith("_"):
                    self._index_todos(value, f"{path} › {key}")
        elif isinstance(data, list):
            for i, value in enumerate(data):
                self._index_todos(value, f"{path} › {i}")
        elif is_todo(data):
            self.todo_index.setdefault(data, path)

    # ------------------------------------------------------------------ Sichtbarkeit

    def visible_projects(self) -> list:
        return [proj for proj in self.projects if not self.release or not proj.get("draft")]

    def visible_service_pages(self) -> list:
        """Leistungen mit eigener Seite (im Release nur die freigegebenen)."""
        return [svc for svc in self.services if "page" in svc and (not self.release or not svc["page"].get("draft"))]

    def has_service_page(self, svc: dict) -> bool:
        return any(s is svc for s in self.visible_service_pages())

    def legal_keys(self) -> list:
        """Rechtsseiten dieses Builds (nur Deutsch) – Entwürfe nur im Entwicklungs-Build."""
        legal = self.langs["de"]["legal"]
        return [key for key in ("imprint", "privacy", "accessibility")
                if key in legal and (not self.release or not legal[key].get("draft"))]

    # ------------------------------------------------------------------ Prüfungen

    def _check_image(self, where: str, img: dict) -> None:
        p = self.problems
        for variant in [img, *img.get("srcset", [])]:
            src = str(variant.get("src", ""))
            if not IMAGE_PATH_RE.fullmatch(src) or ".." in src:
                p.append(f"{where}: src »{src}« ungültig (Pfad unter assets/, nur Bildformate).")
            elif not (ASSETS / src).is_file():
                p.append(f"{where}: Datei assets/{src} fehlt.")
            if not isinstance(variant.get("width"), int) or variant["width"] <= 0:
                p.append(f"{where}: width als positive Zahl angeben ({src}).")
        if not isinstance(img.get("height"), int) or img["height"] <= 0:
            p.append(f"{where}: height als positive Zahl angeben (verhindert Layout-Sprünge).")
        # Sprechende Dateinamen (Google-Bildersuche): mindestens drei Wörter, nichts Generisches wie IMG_2041
        name = re.sub(r"-\d+$", "", str(img.get("src", "")).rsplit("/", 1)[-1].rsplit(".", 1)[0])
        if len(name.split("-")) < 3 or re.search(r"(^|-)(img|image|bild|dsc|photo|foto|screenshot|scan|v\d+|crop|\d+)(-|$)", name):
            p.append(f"{where}: Dateiname »{name}« nicht sprechend – z. B. »projekt-website-startseite« (Quelldatei so benennen, tools/make_images.py).")
        if img.get("fit") not in (None, "contain"):
            p.append(f"{where}: fit nur »contain« (ganzes Bild zeigen, z. B. Hochformat) oder weglassen.")
        for lang in LANGS:
            if not img.get("alt", {}).get(lang):
                p.append(f"{where}: alt-Text ({lang}) fehlt.")

    def validate(self) -> None:
        p = self.problems
        site = self.site
        if not EMAIL_RE.match(str(site["brand"].get("email", ""))):
            p.append("content/site.json › brand.email ist keine gültige E-Mail-Adresse.")
        if site["intro"] not in ("always", "on-entry", "off"):
            p.append("content/site.json › intro muss always, on-entry oder off sein.")
        if site["contact"].get("mailServer") not in ("own", "hoster"):
            p.append("content/site.json › contact.mailServer muss own (eigener Mailserver) oder hoster sein.")
        server = site.get("server", {})
        if not re.fullmatch(r"/[a-z0-9_./-]+", str(server.get("root", ""))) or ".." in str(server.get("root", "")):
            p.append("content/site.json › server.root: absoluter Pfad, z. B. /srv/mindcoded")
        if not re.fullmatch(r"[a-z_][a-z0-9_-]{0,31}", str(server.get("user", ""))):
            p.append("content/site.json › server.user: Linux-Benutzername, z. B. mindcoded")
        if not re.fullmatch(r"\d\.\d", str(server.get("phpVersion", ""))):
            p.append("content/site.json › server.phpVersion: z. B. 8.3")
        if not SLUG_RE.match(str(server.get("mailHost", ""))):
            p.append("content/site.json › server.mailHost: Name des Mail-Hosts ohne Domain, z. B. mail")
        if site["defaultTheme"] not in ("light", "dark", "system"):
            p.append("content/site.json › defaultTheme muss light, dark oder system sein.")
        url = site.get("url", "")
        if url and not is_todo(url) and (not url.startswith("https://") or url.endswith("/")):
            p.append("content/site.json › url muss mit https:// beginnen und ohne Schrägstrich enden.")
        social = site.get("socialImage")
        if social:
            if not IMAGE_PATH_RE.fullmatch(social) or ".." in social:
                p.append("content/site.json › socialImage: ungültiger Pfad.")
            elif not (ASSETS / social).is_file():
                p.append(f"content/site.json › socialImage: Datei assets/{social} fehlt (python tools/make_social.py).")
        seo = site.get("seo", {})
        for key in ("googleSiteVerification", "bingSiteVerification"):
            if seo.get(key) and not re.fullmatch(r"[A-Za-z0-9_-]{10,100}", seo[key]):
                p.append(f"content/site.json › seo.{key}: nur den Code eintragen, nicht das ganze Meta-Tag.")
        if seo.get("googleVerificationFile") and not re.fullmatch(r"google[0-9a-f]{8,32}\.html", seo["googleVerificationFile"]):
            p.append("content/site.json › seo.googleVerificationFile: Dateiname wie google0123abcd.html.")
        for profile in seo.get("profiles", []):
            if not str(profile).startswith("https://"):
                p.append(f"content/site.json › seo.profiles: »{profile}« muss mit https:// beginnen.")
        photo = site["about"].get("photo")
        if photo:
            if not IMAGE_PATH_RE.fullmatch(photo) or ".." in photo:
                p.append("content/site.json › about.photo: ungültiger Pfad.")
            elif not (ASSETS / photo).is_file():
                p.append(f"content/site.json › about.photo: Datei assets/{photo} fehlt.")
            if not (isinstance(site["about"].get("photoWidth"), int) and isinstance(site["about"].get("photoHeight"), int)
                    and site["about"]["photoWidth"] > 0 and site["about"]["photoHeight"] > 0):
                p.append("content/site.json › about: photoWidth und photoHeight als Zahlen angeben.")

        de, en = self.langs["de"], self.langs["en"]
        if [n["href"] for n in de["nav"]] != [n["href"] for n in en["nav"]]:
            p.append("DE/EN: nav hat unterschiedliche Ziele.")
        if len(de["process"]["steps"]) != len(en["process"]["steps"]):
            p.append("DE/EN: unterschiedliche Anzahl Ablaufschritte.")
        if [t["key"] for t in de["contact"]["topics"]] != [t["key"] for t in en["contact"]["topics"]]:
            p.append("DE/EN: Themen im Kontaktformular unterscheiden sich.")
        if [o["value"] for o in de["contact"]["timelineOptions"]] != [o["value"] for o in en["contact"]["timelineOptions"]]:
            p.append("DE/EN: Zeitrahmen-Optionen unterscheiden sich.")

        topics = {t["key"] for t in de["contact"]["topics"]}
        keys = set()
        for i, svc in enumerate(self.services):
            where = f"content/services.json › items › {i}"
            if not SLUG_RE.match(str(svc.get("key", ""))) or svc["key"] in keys:
                p.append(f"{where}: key fehlt, ist ungültig oder doppelt.")
            keys.add(svc.get("key"))
            if svc.get("topic") not in topics:
                p.append(f"{where}: topic muss ein Thema aus dem Kontaktformular sein ({', '.join(sorted(topics))}).")
            for lang in LANGS:
                if lang not in svc:
                    p.append(f"{where}: Sprachblock »{lang}« fehlt.")
                    continue
                if not SLUG_RE.match(str(svc.get("slug", {}).get(lang, ""))):
                    p.append(f"{where} › slug › {lang}: nur a–z, 0–9 und Bindestriche.")
                if len(svc[lang].get("stories", [])) != 4:
                    p.append(f"{where} › {lang}: genau 4 stories nötig (Animation).")
                if "page" in svc and not isinstance(svc[lang].get("page"), dict):
                    p.append(f"{where} › {lang}: page-Texte fehlen.")
        for lang in LANGS:
            slugs = [svc.get("slug", {}).get(lang) for svc in self.services]
            if len(slugs) != len(set(slugs)):
                p.append(f"content/services.json: doppelte slugs ({lang}).")

        for i, tool in enumerate(site.get("tools", [])):
            icon = self.content_dir / "icons" / f"{tool.get('icon', '')}.svg"
            if not tool.get("name") or not SLUG_RE.match(str(tool.get("icon", ""))) or not icon.is_file():
                p.append(f"content/site.json › tools › {i}: name und icon (Datei content/icons/<icon>.svg) nötig.")

        slugs = set()
        for i, proj in enumerate(self.projects):
            where = f"content/projects.json › items › {i}"
            if not SLUG_RE.match(proj.get("slug", "")):
                p.append(f"{where}: slug nur aus a–z, 0–9 und Bindestrichen.")
            if proj["slug"] in slugs:
                p.append(f"{where}: slug »{proj['slug']}« doppelt.")
            slugs.add(proj["slug"])
            if proj.get("kind") not in ("client", "own", "concept", "study"):
                p.append(f"{where}: kind muss client, own, concept oder study sein.")
            if not isinstance(proj.get("shape"), int) or not 0 <= proj["shape"] <= 3:
                p.append(f"{where}: shape muss 0–3 sein.")
            for key in proj.get("serviceKeys", []):
                if key not in keys:
                    p.append(f"{where}: serviceKeys enthält unbekannte Leistung »{key}«.")
            for lang in LANGS:
                if lang not in proj:
                    p.append(f"{where}: Sprachblock »{lang}« fehlt.")
                    continue
                tags = proj[lang].get("tags", [])
                if not isinstance(tags, list) or not all(isinstance(t, str) and t for t in tags):
                    p.append(f"{where} › {lang} › tags: Liste nicht leerer Texte erwartet.")
                p.extend(check_case(proj[lang], f"{where} › {lang}"))
            if proj.get("url") and not str(proj["url"]).startswith("https://"):
                p.append(f"{where}: url muss mit https:// beginnen.")
            for j, img in enumerate(proj.get("images", [])):
                self._check_image(f"{where} › images › {j}", img)

        # Werte, die in Pfade, Attribute oder Skripte gelangen, streng prüfen.
        for lang in LANGS:
            c = self.langs[lang]
            for item in c["nav"]:
                if not str(item.get("href", "")).startswith("#"):
                    p.append(f"content/{lang}.json › nav: href muss ein Anker (#…) sein.")
            path_slugs = [c["projects"]["slugBase"], c["services"]["slugBase"], c["pages"]["thanks"]["slug"], c["pages"]["error"]["slug"]]
            if lang == "de":
                path_slugs += [entry["slug"] for key, entry in c["legal"].items() if key != "sentences"]
            for slug in path_slugs:
                if not PATH_SLUG_RE.match(str(slug)):
                    p.append(f"content/{lang}.json: Pfad »{slug}« ungültig (nur a–z, 0–9, Bindestrich, Schrägstrich).")
            if not re.fullmatch(r"[a-z]{2}_[A-Z]{2}", str(c.get("locale", ""))):
                p.append(f"content/{lang}.json › locale muss wie de_DE aufgebaut sein.")
        numbers = {**site["contact"]["limits"], **site["contact"]["rateLimit"]}
        for key, value in numbers.items():
            if not isinstance(value, int) or isinstance(value, bool) or value <= 0:
                p.append(f"content/site.json › contact: {key} muss eine positive ganze Zahl sein.")
        if not re.fullmatch(r"[a-z0-9_-]+(?:/[a-z0-9_-]+)*\.php", str(site["contact"]["endpoint"])):
            p.append("content/site.json › contact.endpoint ungültig.")

        if self.release:
            if not url:
                p.append("content/site.json › url fehlt – nötig für Canonical, hreflang und Sitemap.")
            if site["hosting"]["dpaConfirmed"] is False:
                p.append("content/site.json › hosting.dpaConfirmed ist false – ohne Vertrag zur Auftragsverarbeitung nicht veröffentlichen.")
            for field_name in ("name", "street", "postalCode", "city", "country"):
                if not site["operator"].get(field_name):
                    p.append(f"content/site.json › operator.{field_name} ist Pflicht (Impressum).")


HEX_RE = re.compile(r"#[0-9A-Fa-f]{6}")
BLOCK_FIELDS = {"text": ("text",), "cards": ("items",), "steps": ("items",), "stats": ("items",), "bars": ("items",),
                "scale": ("items",), "split": ("items",), "groups": ("items",), "quote": ("text",),
                "palette": ("items",), "status": ("items",), "compare": ("columns",)}


def is_number(value) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def check_case(d: dict, where: str) -> list[str]:
    """Prüft Kurzüberblick, Kapitel und Bausteine einer Case Study (docs/CASE-STUDIES.md)."""
    p = []
    if "takeaway" in d and not (isinstance(d["takeaway"], str) and d["takeaway"].strip()):
        p.append(f"{where} › takeaway: ein Satz, was Leserinnen und Leser davon haben.")
    for g in d.get("glance", []):
        if not g.get("label") or not g.get("text"):
            p.append(f"{where} › glance: label und text nötig.")
    for i, sec in enumerate(d.get("sections", [])):
        at = f"{where} › sections › {i}"
        if not sec.get("heading"):
            p.append(f"{at}: heading fehlt.")
        if not (sec.get("text") or sec.get("blocks") or sec.get("lead")):
            p.append(f"{at}: text, lead oder blocks nötig.")
        for j, b in enumerate(sec.get("blocks", [])):
            bt = f"{at} › blocks › {j}"
            kind = b.get("type")
            if kind not in BLOCK_TYPES:
                p.append(f"{bt}: type muss eines von {', '.join(BLOCK_TYPES)} sein.")
                continue
            missing = [f for f in BLOCK_FIELDS[kind] if not b.get(f)]
            if missing:
                p.append(f"{bt}: {', '.join(missing)} fehlt.")
                continue
            if kind == "status" and any(s.get("state") not in STATES for s in b["items"]):
                p.append(f"{bt}: state muss done, active oder planned sein.")
            if kind == "palette" and any(not HEX_RE.fullmatch(str(c.get("hex", ""))) for c in b["items"]):
                p.append(f"{bt}: hex wie #b27d55 angeben.")
            values = [x.get("value") for x in b["items"]] if kind in ("bars", "scale", "split", "groups") else []
            if kind == "groups":
                values += [r.get("value") for g in b["items"] for r in g.get("rows", [])]
            if not all(is_number(v) for v in values):
                p.append(f"{bt}: value muss eine Zahl sein.")
            elif kind == "split" and sum(values) > 100.5:
                p.append(f"{bt}: Anteile ergeben zusammen mehr als 100.")
            elif kind == "scale" and any(not b.get("min", -3) <= v <= b.get("max", 3) for v in values):
                p.append(f"{bt}: Wert liegt außerhalb der Skala.")
            if kind == "scale" and "axis" in b and (not isinstance(b["axis"], list) or len(b["axis"]) != 3):
                p.append(f"{bt}: axis braucht genau 3 Beschriftungen (links, Mitte, rechts).")
            if kind == "compare" and len(b["columns"]) != 2:
                p.append(f"{bt}: compare braucht genau 2 columns.")
    return p
