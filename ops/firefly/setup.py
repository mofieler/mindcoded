#!/usr/bin/env python3
"""Sets up Firefly III (finanzen.mindcoded.studio) for a German household plus self-employment.

Idempotent: existing items with the same name are left alone, so it can run again after changes.
Runs on the server (the name resolves to the VPN address there); the API token comes on stdin:
  ssh mindcoded 'python3 /root/ops/firefly/setup.py' < token-file
"""
from __future__ import annotations

import json
import sys
import urllib.error
import urllib.request

BASE = "https://finanzen.mindcoded.studio/api/v1"

ASSET_ACCOUNTS = [
    {"name": "Volksbank Girokonto", "account_role": "defaultAsset"},
    {"name": "C24 Smartkonto", "account_role": "defaultAsset"},
]

# Category -> keywords in the booking text (case-insensitive) that file a transaction there automatically
CATEGORIES: dict[str, list[str]] = {
    "Wohnen": ["miete", "nebenkosten", "hausverwaltung", "stadtwerke", "strom", "gas ", "rundfunk", "gez"],
    "Lebensmittel": ["rewe", "edeka", "aldi", "lidl", "kaufland", "netto", "penny", "denns", "alnatura", "tegut"],
    "Drogerie & Haushalt": ["dm-drogerie", "dm drogerie", "rossmann", "mueller", "müller", "ikea", "obi", "bauhaus"],
    "Restaurant & Café": ["restaurant", "cafe", "café", "lieferando", "wolt", "uber eats", "mcdonald", "burger king", "starbucks"],
    "Mobilität": ["deutsche bahn", "db vertrieb", "ssb ", "vvs", "aral", "shell", "esso", "tankstelle", "jet tank", "flixbus", "uber ", "tier ", "bolt"],
    "Versicherungen": ["versicherung", "allianz", "huk", "axa", "ergo", "debeka", "techniker krankenkasse", "aok", "barmer"],
    "Gesundheit": ["apotheke", "arzt", "praxis", "zahnarzt", "fitness", "urban sports"],
    "Telefon & Internet": ["telekom", "vodafone", "o2 ", "1&1", "congstar", "fraenk"],
    "Abos & Software": ["netflix", "spotify", "disney", "apple.com", "google one", "youtube", "amazon prime", "adobe", "figma", "notion", "openai", "anthropic"],
    "Kleidung": ["zalando", "h&m", "zara", "about you", "uniqlo"],
    "Shopping": ["amazon", "ebay", "otto ", "mediamarkt", "saturn"],
    "Freizeit & Hobby": ["kino", "eventim", "steam", "playstation", "nintendo"],
    "Reisen": ["booking.com", "airbnb", "lufthansa", "ryanair", "eurowings", "hotel"],
    "Bildung": ["udemy", "coursera", "thalia", "hugendubel"],
    "Geschenke & Spenden": ["spende", "geschenk"],
    "Bargeld": ["bargeld", "geldautomat", "auszahlung"],
    "Gebühren & Zinsen": ["entgelt", "kontoführung", "zinsen", "gebühr"],
    "Steuern & Abgaben": ["finanzamt", "steuer", "ihk", "rundfunkbeitrag"],
    "Sparen & Anlegen": ["trade republic", "scalable", "depot", "sparplan"],
    "Business: Hosting & Tools": ["hetzner", "porkbun", "github", "coolify", "backblaze", "cloudflare"],
    "Business: Ausgaben": [],
    "Einnahmen: Selbständig": [],
    "Einnahmen: Sonstiges": ["gehalt", "lohn", "erstattung", "rückzahlung"],
}

# Monthly budgets without amounts: the amount is set in the app once the first months show real spending
BUDGETS = ["Lebensmittel", "Restaurant & Café", "Mobilität", "Shopping & Kleidung", "Freizeit & Reisen",
           "Abos & Software", "Business"]

PIGGY_BANKS = [  # name, target (EUR, adjust in the app), notes
    ("Steuer-Rücklage", "3000", "Für Einkommensteuer-Nachzahlungen aus der Selbständigkeit – grob 25–30 % jedes Gewinns zurücklegen."),
    ("Notgroschen", "6000", "Drei bis sechs Monatsausgaben als Polster."),
]

BILLS = [  # name, amount, repeat_freq, keyword in booking text
    ("Hetzner Server", "17.24", "monthly", "hetzner"),
]

TAGS = ["steuerlich relevant", "privat", "geschäftlich"]


class Api:
    def __init__(self, token: str):
        self.headers = {"Authorization": f"Bearer {token}", "Accept": "application/vnd.api+json",
                        "Content-Type": "application/json"}

    def call(self, method: str, path: str, body: dict | None = None):
        data = json.dumps(body).encode() if body is not None else None
        req = urllib.request.Request(BASE + path, data=data, method=method, headers=self.headers)
        try:
            with urllib.request.urlopen(req, timeout=30) as res:
                raw = res.read()
                return json.loads(raw) if raw else {}
        except urllib.error.HTTPError as err:
            raise SystemExit(f"{method} {path}: HTTP {err.code} {err.read()[:300]!r}") from None

    def names(self, path: str, key: str = "name") -> dict[str, str]:
        out, page = {}, 1
        while True:
            res = self.call("GET", f"{path}{'&' if '?' in path else '?'}limit=200&page={page}")
            for item in res.get("data", []):
                out[item["attributes"].get(key) or item["attributes"].get("title")] = item["id"]
            meta = res.get("meta", {}).get("pagination", {})
            if page >= meta.get("total_pages", 1):
                return out
            page += 1


def main() -> None:
    token = sys.stdin.read().strip()
    if not token:
        raise SystemExit("API token expected on stdin")
    api = Api(token)
    who = api.call("GET", "/about/user")["data"]["attributes"]["email"]
    print(f"Firefly-Benutzer: {who.split('@')[0][:2]}…")
    done: list[str] = []

    accounts = api.names("/accounts?type=asset")
    for acc in ASSET_ACCOUNTS:
        if acc["name"] not in accounts:
            api.call("POST", "/accounts", {"type": "asset", "currency_code": "EUR", "include_net_worth": True,
                                           "active": True, **acc})
            done.append(f"Konto {acc['name']}")

    categories = api.names("/categories")
    for name in CATEGORIES:
        if name not in categories:
            api.call("POST", "/categories", {"name": name})
            done.append(f"Kategorie {name}")

    budgets = api.names("/budgets")
    for name in BUDGETS:
        if name not in budgets:
            api.call("POST", "/budgets", {"name": name, "active": True})
            done.append(f"Budget {name}")

    piggies = api.names("/piggy-banks")
    accounts = api.names("/accounts?type=asset")
    giro = accounts.get("C24 Smartkonto") or next(iter(accounts.values()))
    for name, target, notes in PIGGY_BANKS:
        if name not in piggies:
            api.call("POST", "/piggy-banks", {"name": name, "notes": notes, "target_amount": target, "start_date": "2026-11-01",
                                              "accounts": [{"account_id": giro}], "transaction_currency_code": "EUR"})
            done.append(f"Sparziel {name}")

    tags = api.names("/tags", key="tag")
    for tag in TAGS:
        if tag not in tags:
            api.call("POST", "/tags", {"tag": tag})
            done.append(f"Tag {tag}")

    bills = api.names("/bills")
    for name, amount, freq, _ in BILLS:
        if name not in bills:
            api.call("POST", "/bills", {"name": name, "amount_min": amount, "amount_max": amount, "date": "2026-11-01",
                                        "repeat_freq": freq, "currency_code": "EUR", "active": True})
            done.append(f"Fixkosten {name}")

    # Rules: one group, one rule per category, matching the booking text
    groups = api.names("/rule-groups", key="title")
    group_id = groups.get("Automatisch einordnen")
    if not group_id:
        group_id = api.call("POST", "/rule-groups", {"title": "Automatisch einordnen",
                                                     "description": "Ordnet importierte Buchungen anhand des Buchungstexts zu."})["data"]["id"]
        done.append("Regelgruppe Automatisch einordnen")
    rules = api.names("/rules", key="title")
    for name, words in CATEGORIES.items():
        title = f"Kategorie: {name}"
        if not words or title in rules:
            continue
        api.call("POST", "/rules", {
            "title": title, "rule_group_id": group_id, "trigger": "store-journal", "active": True,
            "strict": False, "stop_processing": False,
            "triggers": [{"type": "description_contains", "value": w.strip(), "active": True, "stop_processing": False}
                         for w in words],
            "actions": [{"type": "set_category", "value": name, "active": True, "stop_processing": False}],
        })
        done.append(f"Regel {title}")

    print(f"{len(done)} Einträge angelegt" + (":\n- " + "\n- ".join(done) if done else " (alles war schon da)"))


if __name__ == "__main__":
    main()
