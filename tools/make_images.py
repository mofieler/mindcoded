#!/usr/bin/env python3
"""Projektbilder vorbereiten: skalieren, als WebP in mehreren Breiten speichern, Eintrag erzeugen.

  python tools/make_images.py <slug> bild.jpg [bild2.png …]            zeigt den Eintrag für projects.json
  python tools/make_images.py <slug> bild.jpg --write                  trägt ihn in content/projects.json ein
  python tools/make_images.py <slug> bild.jpg --widths 800,1600 --quality 80

Ergebnis: assets/projects/<slug>/<name>-<breite>.webp – nie größer als das Original. Breite und
Höhe stehen im Eintrag (kein Layout-Sprung), kleinere Varianten im srcset (Handys laden weniger).
Alternativtexte kommen als TODO hinein; bis sie ausgefüllt sind, sperrt der Release-Build.

Kodiert wird mit Edge/Chrome headless (wie bei den Icons) – keine Bildbibliothek nötig.
Quellbilder NICHT unter assets/ ablegen (alles dort wird ausgeliefert), z. B. in bildquellen/.
"""
from __future__ import annotations

import argparse
import base64
import html
import json
import re
import shutil
import sys
import tempfile
import threading
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import edge  # noqa: E402

from mcsite import ASSETS, CONTENT  # noqa: E402

DEFAULT_WIDTHS = [800, 1200, 1600, 2400]
SOURCE_TYPES = {".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif"}

HARNESS = """<!doctype html><meta charset="utf-8"><title>Bilder</title><pre id="result"></pre>
<script type="module">
const p = new URLSearchParams(location.search);
const files = p.get('files').split(',');
const widths = p.get('widths').split(',').map(Number).sort((a, b) => a - b);
const quality = Number(p.get('q'));

// Schrittweise halbieren, dann auf das Ziel – sauberer als ein großer Sprung
function scale(img, w, h) {
  let src = img, cw = img.naturalWidth, ch = img.naturalHeight;
  while (cw / 2 >= w) {
    const c = document.createElement('canvas');
    c.width = Math.round(cw / 2); c.height = Math.round(ch / 2);
    const g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(src, 0, 0, c.width, c.height);
    src = c; cw = c.width; ch = c.height;
  }
  const out = document.createElement('canvas');
  out.width = w; out.height = h;
  const g = out.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(src, 0, 0, w, h);
  return out;
}

// Synchron kodieren: Edge headless liest die Seite nach seiner simulierten Uhr aus – asynchrone
// Arbeit (toBlob) wäre dann womöglich noch nicht fertig.
const webp = canvas => {
  const url = canvas.toDataURL('image/webp', quality);
  if (!url.startsWith('data:image/webp')) throw new Error('Browser kann kein WebP speichern');
  return url.slice(url.indexOf(',') + 1);
};

const load = src => new Promise((resolve, reject) => {
  const img = new Image();
  img.onload = () => resolve(img);
  img.onerror = () => reject(new Error(`Bild nicht lesbar: ${src}`));
  img.src = src;
});

const result = [];
try {
  for (const file of files) {
    const img = await load(file);
    const nw = img.naturalWidth, nh = img.naturalHeight;
    const targets = widths.filter(w => w < nw);
    if (!targets.length || widths[widths.length - 1] >= nw) targets.push(nw);  // nie hochskalieren
    const variants = [];
    for (const w of [...new Set(targets)]) {
      const h = Math.round(nh * w / nw);
      variants.push({ width: w, height: h, data: webp(scale(img, w, h)) });
    }
    result.push({ file, width: nw, height: nh, variants });
  }
  document.getElementById('result').textContent = JSON.stringify({ ok: true, result });
} catch (err) {
  document.getElementById('result').textContent = JSON.stringify({ ok: false, error: String(err) });
}
</script>"""


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


def safe_name(path: Path) -> str:
    name = re.sub(r"[^a-z0-9]+", "-", path.stem.lower()).strip("-")
    return name or "bild"


def encode(sources: list[Path], widths: list[int], quality: float) -> list[dict]:
    """Kodiert alle Quellen in Edge headless; liefert je Bild Original-Maße und Varianten (Bytes)."""
    with tempfile.TemporaryDirectory(prefix="mc-images-") as tmp:
        tmp = Path(tmp)
        names = []
        for i, src in enumerate(sources):
            name = f"quelle-{i}{src.suffix.lower()}"
            shutil.copy2(src, tmp / name)
            names.append(name)
        (tmp / "index.html").write_text(HARNESS, encoding="utf-8")
        server = ThreadingHTTPServer(("127.0.0.1", 0), partial(QuietHandler, directory=str(tmp)))
        threading.Thread(target=server.serve_forever, daemon=True).start()
        try:
            url = (f"http://127.0.0.1:{server.server_address[1]}/index.html?files={','.join(names)}"
                   f"&widths={','.join(map(str, widths))}&q={quality}")
            dom = edge.dump_dom(url, wait_ms=120_000, timeout=900)
        finally:
            server.shutdown()
            server.server_close()
    match = re.search(r'<pre id="result">(.*?)</pre>', dom, re.S)
    if not match or not match.group(1).strip():
        raise RuntimeError("Keine Antwort vom Browser – Bild beschädigt oder Format nicht unterstützt?")
    data = json.loads(html.unescape(match.group(1)))
    if not data["ok"]:
        raise RuntimeError(data["error"])
    for item in data["result"]:
        for variant in item["variants"]:
            variant["bytes"] = base64.b64decode(variant.pop("data"))
    return data["result"]


def write_variants(slug: str, source: Path, encoded: dict, out_dir: Path) -> dict:
    """Schreibt die WebP-Dateien und liefert den Eintrag für projects.json › images."""
    target = out_dir / slug
    target.mkdir(parents=True, exist_ok=True)
    base = safe_name(source)
    entries = []
    for variant in sorted(encoded["variants"], key=lambda v: -v["width"]):
        name = f"{base}-{variant['width']}.webp"
        (target / name).write_bytes(variant["bytes"])
        entries.append({"src": f"projects/{slug}/{name}", "width": variant["width"], "height": variant["height"]})
    main, *smaller = entries
    image = {**main, "alt": {"de": "TODO: Alternativtext – was zeigt das Bild?", "en": "TODO: alt text – what does the image show?"}}
    if smaller:
        image["srcset"] = [{"src": e["src"], "width": e["width"]} for e in smaller]
    return image


def add_to_projects(slug: str, images: list[dict], projects_file: Path) -> None:
    data = json.loads(projects_file.read_text(encoding="utf-8"))
    project = next((p for p in data["items"] if p.get("slug") == slug), None)
    if project is None:
        raise SystemExit(f"Projekt »{slug}« steht nicht in {projects_file.name} – zuerst anlegen.")
    project.setdefault("images", []).extend(images)
    projects_file.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main() -> int:
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8")
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("slug", help="Projekt aus content/projects.json")
    parser.add_argument("images", nargs="+", type=Path)
    parser.add_argument("--widths", default=",".join(map(str, DEFAULT_WIDTHS)), help="Zielbreiten in Pixeln")
    parser.add_argument("--quality", type=int, default=82, help="WebP-Qualität 1–100 (Standard 82)")
    parser.add_argument("--write", action="store_true", help="Eintrag in content/projects.json ergänzen")
    parser.add_argument("--out", type=Path, default=ASSETS / "projects", help=argparse.SUPPRESS)
    args = parser.parse_args()

    if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", args.slug):
        print("slug nur aus a–z, 0–9 und Bindestrichen.")
        return 2
    for path in args.images:
        if not path.is_file() or path.suffix.lower() not in SOURCE_TYPES:
            print(f"{path}: keine Bilddatei ({', '.join(sorted(SOURCE_TYPES))}).")
            return 2
        if ASSETS.resolve() in path.resolve().parents:
            print(f"{path}: Quellbilder nicht unter assets/ ablegen – dort wird alles ausgeliefert.")
            return 2
    if not edge.find_browser():
        print("Kein Edge/Chrome gefunden (Pfad über MC_BROWSER setzen).")
        return 2
    widths = sorted({int(w) for w in args.widths.split(",") if w.strip()})
    encoded = encode(args.images, widths, max(1, min(100, args.quality)) / 100)
    images = [write_variants(args.slug, src, enc, args.out) for src, enc in zip(args.images, encoded, strict=True)]
    for src, enc in zip(args.images, encoded, strict=True):
        sizes = ", ".join(f"{v['width']} px" for v in enc["variants"])
        total = sum(len(v["bytes"]) for v in enc["variants"]) / 1024
        print(f"{src.name}: {enc['width']}×{enc['height']} → {sizes} ({total:.0f} KB zusammen)")
    if args.write:
        add_to_projects(args.slug, images, CONTENT / "projects.json")
        print("In content/projects.json eingetragen. Alternativtexte (TODO) ausfüllen.")
    else:
        print("\nEintrag für content/projects.json › images (oder --write verwenden):")
        print(json.dumps(images, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
