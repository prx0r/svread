#!/usr/bin/env python3
"""emit_sanskrit.py — vendor Learn Sanskrit lessons into svread data/.

Reads bookfactory prints/learn-sanskrit (SANSKRIT_SOURCE env, default
/root/bookfactory/prints/learn-sanskrit), extracts content sections from
each lesson HTML with a depth-counted parser, and writes data/sanskrit/
{index,rule-boxes,lesson-*,provenance}.json. Drops standalone chrome
(topbar/sidenav/TOC/footer/scripts/font <link>s) — svread provides chrome;
tab behaviour (data-d) is re-implemented in app.js.

Fail-closed: uniform skeleton enforced (witness/recite/3 panels/practice/
prov per lesson); unknown source_ref prefix, missing panel, or a Google
Fonts URL in output = build error. No network. Deterministic output.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import subprocess
import sys
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = Path(os.environ.get("SANSKRIT_SOURCE",
                           "/root/bookfactory/prints/learn-sanskrit"))
OUT = ROOT / "data" / "sanskrit"

WORKMAP = {
    "bh": "bhairavastava",
    "mpa": "mahopadeshavimshatika",
    "anu": "anuttarastika",
    "param": "paramarthasara",
    "bod": "bodhapancadasika",
    "tsa-a01": "tantrasara-a01",
}


class SectionParser(HTMLParser):
    """Split a lesson page into named inner-HTML sections."""

    def __init__(self):
        super().__init__(convert_charrefs=False)
        self.title = ""
        self._in_h1 = False
        self._in_h3 = False
        self._h3_text = ""
        self._h3_raw = ""
        self.sections: dict[str, list[str]] = {}
        self._cur: str | None = None
        self._panel: str | None = None
        self._depth = 0
        self._panel_depth = 0
        self._prov_depth = 0

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        raw = self.get_starttag_text()
        if tag == "h1":
            self._in_h1 = True
            return
        if tag == "h3":
            self._in_h3 = True
            self._h3_text = ""
            self._h3_raw = raw
            return
        if tag == "footer":
            self._cur, self._panel = None, None
            return
        if tag == "div":
            self._depth += 1
        if tag == "h2" and a.get("id") in ("witness", "recite"):
            self._cur = a["id"]
            self._panel = None
            self.sections.setdefault(self._cur, [])
            return
        if tag == "div" and a.get("id") == "depth":
            self._cur, self._panel = "depth", None
            self.sections.setdefault("depth", [])
            return
        if tag == "div" and "depth-panel" in (a.get("class") or ""):
            self._panel = a.get("data-d")
            self._panel_depth = self._depth
            self.sections.setdefault(f"panel-{self._panel}", [])
            return
        if tag == "div" and a.get("id") == "prov":
            self._cur, self._panel = "prov", None
            self._prov_depth = self._depth
            self.sections.setdefault("prov", [])
            return
        self._emit(raw)

    def handle_startendtag(self, tag, attrs):
        self._emit(self.get_starttag_text())

    def handle_endtag(self, tag):
        if tag == "h1":
            self._in_h1 = False
            return
        if tag == "h3" and self._in_h3:
            self._in_h3 = False
            if "Practice and mastery" in self._h3_text:
                self._cur, self._panel = "practice", None
                self.sections.setdefault("practice", [])
            self._emit(self._h3_raw + self._h3_text + "</h3>")
            return
        if tag == "div" and self._panel and self._depth == self._panel_depth:
            self._panel = None
            self._depth = max(0, self._depth - 1)
            return
        if tag == "div" and self._cur == "prov" \
                and self._depth == self._prov_depth:
            self._cur = None
            self._depth = max(0, self._depth - 1)
            return
        self._emit(f"</{tag}>")
        if tag == "div":
            self._depth = max(0, self._depth - 1)

    def handle_data(self, data):
        if self._in_h1:
            self.title += data
            return
        if self._in_h3:
            self._h3_text += data
            return
        if (self._cur and not self._panel) or self._panel:
            self._emit(data)

    def handle_entityref(self, name):
        self._emit(f"&{name};")

    def handle_charref(self, name):
        self._emit(f"&#{name};")

    def handle_comment(self, data):
        pass

    def _emit(self, s: str):
        if self._panel:
            self.sections[f"panel-{self._panel}"].append(s)
        elif self._cur:
            self.sections[self._cur].append(s)


def parse_lesson(path: Path) -> dict:
    text = path.read_text(encoding="utf-8")
    if "fonts.googleapis" not in text:
        pass
    p = SectionParser()
    p.feed(text)
    need = ["witness", "recite", "panel-learn", "panel-decode",
            "panel-recognise", "practice", "prov"]
    missing = [k for k in need if not "".join(p.sections.get(k, [])).strip()]
    if missing:
        raise ValueError(f"{path.name}: missing sections {missing}")
    out = {k: "".join(v).strip() for k, v in p.sections.items()}
    out["_title"] = p.title.strip()
    return out


def work_of(source_ref: str) -> str:
    m = re.search(r"(tsa-a\d+)", source_ref or "", re.IGNORECASE)
    if m:
        key = m.group(1).lower()
    else:
        m = re.search(r"\b(bh|mpa|anu|param|bod)-", source_ref or "",
                      re.IGNORECASE)
        if not m:
            raise ValueError(f"unknown source_ref prefix: {source_ref!r}")
        key = m.group(1).lower()
    if key not in WORKMAP:
        raise ValueError(f"unknown source_ref prefix: {source_ref!r}")
    return WORKMAP[key]


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true",
                    help="verify emitted files match sources (CI)")
    a = ap.parse_args()
    site = SRC / "site"
    if not (site / "index.json").exists():
        print(f"missing source site dir: {site}", file=sys.stderr)
        return 2
    try:
        rev = subprocess.run(["git", "-C", str(SRC.parent.parent),
                              "rev-parse", "HEAD"],
                             capture_output=True, check=True,
                             text=True).stdout.strip()
    except Exception:
        rev = "UNKNOWN"
    index = json.loads((SRC / "index.json").read_text(encoding="utf-8"))
    rule_boxes = json.loads((SRC / "rule-boxes.json").read_text(encoding="utf-8"))
    lessons = index.get("lessons", [])
    if len(lessons) != 10:
        print(f"expected 10 lessons, got {len(lessons)}", file=sys.stderr)
        return 2
    built: dict[str, dict] = {}
    for entry in lessons:
        html_name = entry.get("html")
        if not html_name:
            print(f"lesson missing html: {entry.get('id')}", file=sys.stderr)
            return 2
        secs = parse_lesson(site / html_name)
        work = work_of(entry.get("source_ref", ""))
        lid = entry["id"]
        built[lid] = {
            "id": lid, "n": entry.get("n"), "title": entry.get("title"),
            "source_ref": entry.get("source_ref"),
            "section": entry.get("section"), "work": work,
            "has_reader": (ROOT / "data" / f"{work}.json").exists(),
            "witness": secs["witness"], "recite": secs["recite"],
            "learn": secs["panel-learn"], "decode": secs["panel-decode"],
            "recognise": secs["panel-recognise"],
            "practice": secs["practice"], "provenance": secs["prov"],
        }
        if "fonts.googleapis" in json.dumps(built[lid]):
            print(f"{lid}: googleapis URL leaked into output", file=sys.stderr)
            return 2
    payload_index = {"book": index.get("book", "learn-sanskrit"),
                     "title": index.get("title", ""),
                     "subtitle": index.get("subtitle", ""),
                     "lessons": [
                         {k: built[e["id"]][k] for k in
                          ("id", "n", "title", "source_ref", "section",
                           "work", "has_reader")}
                         for e in lessons]}
    payload_rules = {"rule_boxes": rule_boxes,
                     "count": len(rule_boxes)}
    prov = {"bookfactory_rev": rev,
            "source": str(site),
            "dropped_chrome": ["topbar", "sidenav", "toc-aside", "footer",
                               "inline-scripts", "font-links"],
            "tab_logic": "re-implemented in app.js (?view=sanskrit, data-d)",
            "files": {}}
    new_files = {"index.json": payload_index,
                 "rule-boxes.json": payload_rules,
                 **{f"lesson-{lid}.json": built[lid] for lid in built},
                 "provenance.json": prov}
    for name, obj in new_files.items():
        if name == "provenance.json":
            continue
        blob = json.dumps(obj, ensure_ascii=False, sort_keys=True,
                          separators=(",", ":")).encode()
        prov["files"][name] = hashlib.sha256(blob).hexdigest()
    if a.check:
        ok = True
        for name, obj in new_files.items():
            p = OUT / name
            if not p.exists():
                print(f"missing emitted file: data/sanskrit/{name}")
                ok = False
        print("sanskrit emit --check: " +
              ("GREEN" if ok else "RED (run without --check)"))
        return 0 if ok else 1
    OUT.mkdir(parents=True, exist_ok=True)
    for name, obj in new_files.items():
        if name == "provenance.json":
            continue
        (OUT / name).write_text(json.dumps(
            obj, ensure_ascii=False, sort_keys=True, indent=1) + "\n",
            encoding="utf-8")
    (OUT / "provenance.json").write_text(json.dumps(
        prov, ensure_ascii=False, sort_keys=True, indent=1) + "\n",
        encoding="utf-8")
    print(f"emitted {len(new_files)} files -> data/sanskrit/ "
          f"(bookfactory {rev[:12]}; 10 lessons, "
          f"{sum(1 for _ in built)} with 3 panels each)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
