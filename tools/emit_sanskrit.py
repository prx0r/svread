#!/usr/bin/env python3
"""emit_sanskrit.py — vendor Learn Sanskrit site into svread, verbatim.

Copies bookfactory prints/learn-sanskrit pages byte-for-byte EXCEPT two
mechanical rewrites, both recorded in provenance.json:
  1. Google Fonts <link> tags are removed and replaced with local @font-face
     rules pointing at vendored ../fonts/*.ttf (no network, same design).
  2. Nothing else is touched: chrome, tabs, tables, inline tab script stay
     exactly as the lane authored them. svread renders the pages in an
     iframe (?view=sanskrit&lesson=) with its own header + chat rail around.

Fail-closed: 10 lessons expected, each must contain witness + recite +
learn/decode/recognise depth panels + practice + provenance; no googleapis
URLs and no external <script src> may remain; unknown source_ref prefix =
build error. No network. Deterministic output.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "sanskrit"
SRC = Path(os.environ.get("SANSKRIT_SOURCE",
                           "/root/bookfactory/prints/learn-sanskrit"))
SITE = SRC / "site"
FONTS = SRC / "fonts"

WORKMAP = {
    "bh": "bhairavastava",
    "mpa": "mahopadeshavimshatika",
    "anu": "anuttarastika",
    "param": "paramarthasara",
    "bod": "bodhapancadasika",
    "tsa-a01": "tantrasara-a01",
}

def font_face_css(fonts: list[str]) -> str:
    rules = []
    if "CormorantGaramond[wght].ttf" in fonts:
        rules.append("@font-face{font-family:'Cormorant Garamond';font-weight:100 900;font-style:normal;font-display:swap;src:url('../fonts/CormorantGaramond[wght].ttf') format('truetype');}")
    if "TiroDevanagariSanskrit-Regular.ttf" in fonts:
        rules.append("@font-face{font-family:'Tiro Devanagari Sanskrit';font-style:normal;font-display:swap;src:url('../fonts/TiroDevanagariSanskrit-Regular.ttf') format('truetype');}")
    return ("\n<style data-sv-localfonts>\n" + "\n".join(rules) + "\n</style>\n")

GOOGLE_RE = re.compile(r'<link[^>]*fonts\.googleapis\.com[^>]*>\s*', re.IGNORECASE)
EXT_SCRIPT_RE = re.compile(r'<script[^>]*\bsrc\s*=\s*["\']https?://', re.IGNORECASE)


def work_of(source_ref: str) -> str:
    m = re.search(r"(tsa-a\d+)", source_ref or "", re.IGNORECASE)
    if m:
        key = m.group(1).lower()
    else:
        m = re.search(r"\b(bh|mpa|anu|param|bod)\b", source_ref or "",
                      re.IGNORECASE)
        if not m:
            raise ValueError(f"unknown source_ref prefix: {source_ref!r}")
        key = m.group(1).lower()
    if key not in WORKMAP:
        raise ValueError(f"unknown source_ref prefix: {source_ref!r}")
    return WORKMAP[key]


def vendor_html(name: str, fonts_available: list) -> tuple[str, dict]:
    text = (SITE / name).read_text(encoding="utf-8")
    checks = {
        "witness": 'id="witness"' in text,
        "recite": 'id="recite"' in text,
        "panels": all(f'data-d="{d}"' in text
                      for d in ("learn", "decode", "recognise")),
        "practice": "Practice and mastery" in text,
        "prov": 'id="prov"' in text,
    }
    missing = [k for k, v in checks.items() if not v]
    if missing:
        raise ValueError(f"{name}: missing sections {missing}")
    if EXT_SCRIPT_RE.search(text):
        raise ValueError(f"{name}: external script src (refusing)")
    out, n = GOOGLE_RE.subn("", text)
    if "googleapis" in out:
        raise ValueError(f"{name}: googleapis URL remains")
    css = font_face_css(fonts_available)
    out = out.replace("</head>", css + "</head>", 1)
    if "data-sv-localfonts" not in out:
        raise ValueError(f"{name}: font-face injection failed")
    info = {"google_links_removed": n, "bytes_in": len(text.encode()),
            "bytes_out": len(out.encode())}
    return out, info


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true")
    a = ap.parse_args()
    index = json.loads((SRC / "index.json").read_text(encoding="utf-8"))
    rule_boxes = json.loads((SRC / "rule-boxes.json").read_text(encoding="utf-8"))
    lessons = index.get("lessons", [])
    if len(lessons) != 10:
        print(f"expected 10 lessons, got {len(lessons)}", file=sys.stderr)
        return 2
    try:
        rev = subprocess.run(["git", "-C", str(SRC.parent.parent),
                              "rev-parse", "HEAD"], capture_output=True,
                             check=True, text=True).stdout.strip()
    except Exception:
        rev = "UNKNOWN"
    try:
        fonts = sorted(p.name for p in FONTS.glob("*.ttf"))
    except OSError:
        fonts = []
    if not fonts:
        print("no vendored fonts found", file=sys.stderr)
        return 2
    payload_index = {
        "book": index.get("book", "learn-sanskrit"),
        "title": index.get("title", ""),
        "subtitle": index.get("subtitle", ""),
        "lessons": [],
    }
    files: dict[str, str] = {}
    for e in lessons:
        html_name = e.get("html")
        if not html_name:
            print(f"lesson missing html: {e.get('id')}", file=sys.stderr)
            return 2
        work = work_of(e.get("source_ref", ""))
        payload_index["lessons"].append({
            "id": e["id"], "n": e.get("n"), "title": e.get("title"),
            "source_ref": e.get("source_ref"), "section": e.get("section"),
            "html": f"site/{html_name}", "work": work,
            "has_reader": (ROOT / "data" / f"{work}.json").exists(),
        })
        files[f"site/{html_name}"] = None
    payload_rules = {"rule_boxes": rule_boxes, "count": len(rule_boxes)}
    if payload_rules["count"] < 8:
        print(f"expected >=8 rule boxes, got {payload_rules['count']}",
              file=sys.stderr)
        return 2
    prov = {"bookfactory_rev": rev, "source": str(SITE),
            "transforms": ["google-fonts <link> removed", "local @font-face "
                           "injected (vendored OFL fonts)", "nothing else touched"],
            "files": {}}
    rendered: dict[str, bytes] = {}
    rendered["index.json"] = json.dumps(
        payload_index, ensure_ascii=False, sort_keys=True,
        indent=1).encode() + b"\n"
    rendered["rule-boxes.json"] = json.dumps(
        payload_rules, ensure_ascii=False, sort_keys=True,
        indent=1).encode() + b"\n"
    for name in sorted(files):
        html, info = vendor_html(Path(name).name, fonts)
        rendered[name] = html.encode()
        prov["files"][name] = {"sha256": hashlib.sha256(
            rendered[name]).hexdigest(), **info}
    for fn in fonts:
        data = (FONTS / fn).read_bytes()
        rendered[f"fonts/{fn}"] = data
        prov["files"][f"fonts/{fn}"] = {"sha256": hashlib.sha256(data).hexdigest()}
    prov_blob = json.dumps(prov, ensure_ascii=False, sort_keys=True,
                           indent=1).encode() + b"\n"
    if a.check:
        ok = True
        for name, blob in list(rendered.items()) + [("provenance.json", prov_blob)]:
            p = OUT / name
            if not p.exists() or p.read_bytes() != blob:
                print(f"mismatch or missing: data/sanskrit/{name}")
                ok = False
        print("sanskrit emit --check: " + ("GREEN" if ok else "RED (re-run emit)"))
        return 0 if ok else 1
    (OUT / "site").mkdir(parents=True, exist_ok=True)
    (OUT / "fonts").mkdir(parents=True, exist_ok=True)
    for name, blob in rendered.items():
        (OUT / name).write_bytes(blob)
    (OUT / "provenance.json").write_bytes(prov_blob)
    print(f"emitted {len(rendered) + 1} files -> data/sanskrit/ "
          f"(bookfactory {rev[:12]}; 10 lessons verbatim, {len(fonts)} fonts)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
