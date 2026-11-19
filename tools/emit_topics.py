#!/usr/bin/env python3
"""emit_topics.py — answer-first, citeable topic pages from curated sources.

Source of truth: topics/<id>.json (hand-curated, tracked). Output:
  topics/<id>/index.html   no-JS page: answer, claims + verbatim evidence,
                           available levels, caveats, how to verify, search
  topics/<id>/index.md     same content as markdown for agents
  data/topics/index.json   machine index (id, title, aliases, counts)

Deterministic (sorted, no timestamps); --check byte-compares. A topic source
must pass the schema checks here (id, answer, claims with tier + evidence with
work/target; no empty quotes) or nothing is written.
"""
from __future__ import annotations

import argparse
import html
import json
import re
import sys
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "topics"
OUT = ROOT / "data" / "topics"
ORIGIN = "https://svatantrya.net"
TIERS = {"T", "R", "E", "C", "H", "X"}
TW = Path("/root/translation-work")


def qnorm(s: str) -> str:
    """Marker-free, diacritic-free comparison form for verbatim checks."""
    s = re.sub(r"\[and\]-", " ", s or "")
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    return re.sub(r"[^a-z0-9]+", "", s.lower())


_WORKTEXT: dict = {}


def work_text(work: str) -> str | None:
    """All Sanskrit we hold for a work (passages + translation document)."""
    if work in _WORKTEXT:
        return _WORKTEXT[work]
    d = TW / work
    if not d.is_dir():
        _WORKTEXT[work] = None
        return None
    parts = []
    for name in ("passages.jsonl", "T1.md", "source.txt"):
        f = d / name
        if f.is_file():
            try:
                parts.append(f.read_text(encoding="utf-8"))
            except OSError:
                pass
    _WORKTEXT[work] = qnorm(" ".join(parts)) if parts else None
    return _WORKTEXT[work]


def target_text(work: str, target: str) -> str | None:
    """Sanskrit for the evidence's target chunk(s), in locator order."""
    d = TW / work
    pp = d / "passages.jsonl"
    if not pp.is_file():
        return work_text(work)
    locs = [x.strip() for x in str(target or "").split(",") if x.strip()]
    rows = {}
    try:
        for line in pp.read_text(encoding="utf-8").splitlines():
            if line.strip():
                r = json.loads(line)
                if r.get("locator"):
                    rows[r["locator"]] = r.get("sanskrit", "")
    except (OSError, ValueError):
        return work_text(work)
    if locs and all(l in rows for l in locs):
        return qnorm(" ".join(rows[l] for l in sorted(locs)))
    return work_text(work)


def check_quotes(t: dict) -> list[str]:
    """Every quote_iast must appear verbatim in its work's held Sanskrit.
    Skipped (not failed) when the translation-work checkout is absent."""
    if not TW.is_dir():
        return []
    errs = []
    for c in t.get("claims", []):
        for e in c.get("evidence", []):
            if e.get("external"):
                continue
            text = target_text(e.get("work", ""), e.get("target", ""))
            if text is None:
                errs.append(f"{e.get('work')}: work not found for verbatim check")
                continue
            if qnorm(e.get("quote_iast", "")) not in text:
                errs.append(f"{e.get('label')}: quote not verbatim in {e.get('work')}")
    return errs


def esc(s) -> str:
    return html.escape(s if isinstance(s, str) else str(s), quote=True)


def validate(t: dict) -> list[str]:
    errs = []
    if t.get("format") != "svatantrya-topic-src/1":
        errs.append("format")
    if not isinstance(t.get("id"), str) or not t["id"]:
        errs.append("id")
    if not isinstance(t.get("answer"), str) or len(t["answer"].strip()) < 40:
        errs.append("answer (>=40 chars)")
    claims = t.get("claims")
    if not isinstance(claims, list) or not claims:
        errs.append("claims")
        return errs
    for i, c in enumerate(claims):
        if c.get("tier") not in TIERS:
            errs.append(f"claim[{i}].tier")
        ev = c.get("evidence")
        if not isinstance(ev, list) or not ev:
            errs.append(f"claim[{i}].evidence")
            continue
        for j, e in enumerate(ev):
            if e.get("external"):
                if not (e.get("citation") or "").strip():
                    errs.append(f"claim[{i}].evidence[{j}] external without citation")
                if not ((e.get("quote_iast") or "").strip() or (e.get("quote_en") or "").strip()):
                    errs.append(f"claim[{i}].evidence[{j}] external without quote")
                continue
            if not e.get("work") or not e.get("target"):
                errs.append(f"claim[{i}].evidence[{j}] work/target")
            if not (e.get("quote_iast") or "").strip():
                errs.append(f"claim[{i}].evidence[{j}] quote_iast empty")
    return errs


def claim_html(c: dict) -> str:
    parts = [f'<section class="claim"><h2><span class="tier">{esc(c.get("tier"))}</span> {esc(c.get("claim"))}</h2>']
    for e in c.get("evidence", []):
        parts.append('<div class="evidence">')
        parts.append(f'<h3>{esc(e.get("label"))} <small>{esc(e.get("verses",""))}</small></h3>')
        parts.append(f'<blockquote class="iast" lang="sa">{esc(e.get("quote_iast"))}</blockquote>')
        if e.get("quote_en"):
            parts.append(f'<p class="en">{esc(e.get("quote_en"))}</p>')
        if e.get("external"):
            parts.append(f'<p class="prov external">external source — {esc(e.get("citation"))}</p>')
        else:
            w, tgt = e.get("work"), e.get("target")
            parts.append('<p class="prov">'
                         f'work <code>{esc(w)}</code> · chunk <code>{esc(tgt)}</code> · '
                         f'layers held: {esc(", ".join(e.get("layers", [])) or "none recorded")}</p>')
            parts.append(f'<p class="links"><a href="{ORIGIN}/work/{esc(w)}/">work index</a> · '
                         f'<a href="{ORIGIN}/data/search-index/records.jsonl">search index</a> · '
                         f'<a href="{ORIGIN}/data/{esc(w)}.json">reader bundle</a></p>')
        if e.get("translation_note"):
            parts.append(f'<p class="note">{esc(e["translation_note"])}</p>')
        parts.append('</div>')
    if c.get("note"):
        parts.append(f'<p class="note">{esc(c["note"])}</p>')
    parts.append('</section>')
    return "\n".join(parts)


def topic_html(t: dict) -> str:
    title = f'{t["title_en"]} ({t.get("title_iast","")})'
    body = [f'<!doctype html><html lang="en"><head><meta charset="utf-8">',
            '<meta name="viewport" content="width=device-width,initial-scale=1">',
            f'<title>{esc(title)} | Svatantrya</title>',
            f'<link rel="canonical" href="{ORIGIN}/topics/{esc(t["id"])}/">',
            '<meta name="description" content="' + esc(t["answer"][:180]) + '">',
            '<style>body{max-width:52rem;margin:2rem auto;padding:0 1rem;font:16px/1.6 system-ui,sans-serif}'
            'blockquote{background:#f6f6f6;border-left:4px solid #999;margin:1rem 0;padding:.5rem 1rem}'
            '.tier{display:inline-block;background:#222;color:#fff;border-radius:.25rem;padding:0 .4rem;font-size:.8em}'
            '.note{color:#555}.prov{font-size:.9em;color:#444}main h1{line-height:1.25}table{border-collapse:collapse;width:100%;margin:1rem 0}th,td{border:1px solid #ccc;padding:.4rem .5rem;text-align:left;vertical-align:top}th{background:#f2f2f2}</style>',
            '</head><body>',
            f'<nav><a href="{ORIGIN}/">Svatantrya</a> › <a href="{ORIGIN}/topics/">topics</a> › {esc(t["id"])}</nav>',
            f'<main><h1>{esc(title)}</h1>',
            f'<p class="answer"><strong>{esc(t["answer"])}</strong></p>']
    m = t.get("matrix") or {}
    if m.get("columns") and m.get("rows"):
        body.append('<section class="matrix"><h2>' + esc(m.get("title") or "Comparative table") + '</h2>')
        body.append('<table><thead><tr>' + ''.join(f'<th>{esc(c)}</th>' for c in m["columns"]) + '</tr></thead><tbody>')
        for row in m["rows"]:
            body.append('<tr>' + ''.join(f'<td>{esc(x)}</td>' for x in row) + '</tr>')
        body.append('</tbody></table>')
        if m.get("note"):
            body.append(f'<p class="note">{esc(m["note"])}</p>')
        body.append('</section>')
    body += [claim_html(c) for c in t.get("claims", [])]
    lr = t.get("levels_report") or {}
    if lr:
        body.append('<section class="levels"><h2>What the corpus actually holds</h2><ul>')
        for k, v in sorted(lr.items()):
            if k == "note":
                continue
            if isinstance(v, dict):
                body.append(f'<li><code>{esc(k)}</code> — {esc(v.get("status",""))}: '
                            f'{esc(", ".join(v.get("layers", [])))}</li>')
        if lr.get("note"):
            body.append(f'</ul><p class="note">{esc(lr["note"])}</p></section>')
        else:
            body.append('</ul></section>')
    body.append('<section class="caveats"><h2>Caveats</h2><ul>')
    body += [f'<li>{esc(x)}</li>' for x in t.get("caveats", [])]
    body.append('</ul></section>')
    s = t.get("search") or {}
    if s:
        body.append('<section class="how"><h2>Find this yourself</h2>'
                    f'<p>Search every chunk and level: <code>{esc(s.get("cli",""))}</code></p>'
                    '<p>Or call the MCP tool <code>search_chunks</code> with '
                    f'<code>{esc(json.dumps(s.get("mcp",{}).get("arguments",{})))}</code>.</p></section>')
    body.append('</main></body></html>')
    return "\n".join(body) + "\n"


def topic_md(t: dict) -> str:
    lines = [f'# {t["title_en"]} ({t.get("title_iast","")})', "",
             t["answer"], "", f'Canonical: {ORIGIN}/topics/{t["id"]}/', ""]
    m = t.get("matrix") or {}
    if m.get("columns") and m.get("rows"):
        lines.append(f'## {m.get("title") or "Comparative table"}')
        lines.append("")
        lines.append('| ' + ' | '.join(m["columns"]) + ' |')
        lines.append('|' + '|'.join('---' for _ in m["columns"]) + '|')
        for row in m["rows"]:
            lines.append('| ' + ' | '.join(str(x) for x in row) + ' |')
        if m.get("note"):
            lines.append("")
            lines.append(f'_{m["note"]}_')
        lines.append("")
    for c in t.get("claims", []):
        lines.append(f'## [{c.get("tier")}] {c.get("claim")}')
        for e in c.get("evidence", []):
            lines.append(f'### {e.get("label")} — {e.get("verses","")}')
            lines.append(f'> {e.get("quote_iast")}')
            if e.get("quote_en"):
                lines.append("")
                lines.append(e["quote_en"])
            lines.append("")
            if e.get("external"):
                lines.append(f'*External source:* {e.get("citation")} (not in our corpus; not re-verified here).')
            else:
                lines.append(f'work `{e.get("work")}` · chunk `{e.get("target")}` · '
                             f'layers: {", ".join(e.get("layers", []))}')
            if e.get("translation_note"):
                lines.append(f'_{e["translation_note"]}_')
            lines.append("")
        if c.get("note"):
            lines.append(c["note"])
            lines.append("")
    lines.append("## Caveats")
    lines += [f'- {x}' for x in t.get("caveats", [])]
    lines.append("")
    return "\n".join(lines) + "\n"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true")
    a = ap.parse_args()
    srcs = sorted(SRC.glob("*.json")) if SRC.is_dir() else []
    if not srcs:
        print("emit_topics: no topic sources", file=sys.stderr)
        return 2
    arts: dict[str, str] = {}
    index = {}
    bad = 0
    for f in srcs:
        try:
            t = json.loads(f.read_text(encoding="utf-8"))
        except ValueError as e:
            print(f"{f.name}: invalid JSON: {e}", file=sys.stderr)
            bad += 1
            continue
        errs = validate(t) + check_quotes(t)
        if errs:
            print(f"{f.name}: FAIL {errs}", file=sys.stderr)
            bad += 1
            continue
        tid = t["id"]
        arts[f"topics/{tid}/index.html"] = topic_html(t)
        arts[f"topics/{tid}/index.md"] = topic_md(t)
        index[tid] = {"title": t["title_en"], "iast": t.get("title_iast", ""),
                      "aliases": t.get("aliases", []),
                      "claims": len(t.get("claims", [])),
                      "page": f"topics/{tid}/"}
    if bad:
        print("emit_topics: REFUSING (fail-closed)", file=sys.stderr)
        return 1
    rows = "\n".join(
        f'<li><a href="{ORIGIN}/topics/{k}/">{esc(v["title"])}</a> '
        f'<small>({esc(v.get("iast",""))})</small></li>'
        for k, v in sorted(index.items()))
    arts["topics/index.html"] = (
        '<!doctype html><html lang="en"><head><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width,initial-scale=1">'
        f'<title>Topics | Svatantrya</title>'
        f'<link rel="canonical" href="{ORIGIN}/topics/">'
        '<style>body{max-width:52rem;margin:2rem auto;padding:0 1rem;font:16px/1.6 system-ui,sans-serif}</style>'
        f'</head><body><nav><a href="{ORIGIN}/">Svatantrya</a> › topics</nav>'
        '<main><h1>Topics</h1>'
        '<p>Answer-first pages: each claim carries a tier and verbatim evidence '
        'with chunk locators and the levels the corpus actually holds.</p>'
        f'<ul>{rows}</ul></main></body></html>\n')
    arts["data/topics/index.json"] = json.dumps(
        {"format": "svatantrya-topics/1",
         "note": "Answer-first topic pages; every claim carries a tier and verbatim evidence.",
         "topics": index}, ensure_ascii=False, sort_keys=True, indent=1) + "\n"
    if a.check:
        ok = True
        for name, blob in arts.items():
            p = ROOT / name
            if not p.exists() or p.read_text(encoding="utf-8") != blob:
                print(f"mismatch or missing: {name}")
                ok = False
        print("emit topics --check: " + ("GREEN" if ok else "RED"))
        return 0 if ok else 1
    for name, blob in arts.items():
        p = ROOT / name
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(blob, encoding="utf-8")
    print(f"published {len(index)} topic pages")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
