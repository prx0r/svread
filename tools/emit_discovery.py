#!/usr/bin/env python3
"""emit_discovery.py — llms.txt, sitemap.xml, robots.txt, pushing digest.

Makes svread legible to AI agents and crawlers. All outputs are derived
from versioned sources (no hand lists to rot):

- data/pushing.json: digest of ipvv pushing INDEX (id, work, question,
  verdict, source file). Read-only wrt /root/ipvv.
- llms.txt: site map in markdown for LLMs (what this is, views, data
  endpoints, how to cite). Absolute URLs from SITE_ORIGIN (default pages.dev).
- sitemap.xml: HTML entry points (views are query-param routes on /).
- robots.txt: permissive (incl. named AI crawlers) + sitemap pointer.

Fail-closed: missing source (ipvv INDEX, biblio.json, sanskrit index) =
non-zero exit, no writes. Deterministic output.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "data"
IPVV_PUSHING = Path("/root/ipvv/site/data/pushing/INDEX.json")
ORIGIN = os.environ.get("SITE_ORIGIN", "https://svread.pages.dev").rstrip("/")


def load_json(p: Path):
    try:
        return json.loads(p.read_text(encoding="utf-8"))
    except (OSError, ValueError) as e:
        print(f"emit discovery: cannot read {p} ({e})", file=sys.stderr)
        raise SystemExit(2)


def build_pushing() -> dict:
    idx = load_json(IPVV_PUSHING)
    recs = idx.get("records", []) if isinstance(idx, dict) else []
    if not recs:
        print("emit discovery: pushing INDEX has no records", file=sys.stderr)
        raise SystemExit(2)
    out = []
    for r in recs:
        for q in r.get("questions", []) or []:
            out.append({"id": q.get("id"), "work": r.get("work_hint", ""),
                        "question": q.get("q", ""),
                        "verdict": q.get("verdict", ""),
                        "source": "prx0r/ipvv site/data/pushing/" + r.get("file", "")})
    out.sort(key=lambda x: (x["work"], x["id"] or ""))
    if len(out) < 10:
        print(f"emit discovery: suspiciously few pushing items ({len(out)})",
              file=sys.stderr)
        raise SystemExit(2)
    return {"format": "svread-pushing-digest/1",
            "count": len(out), "items": out,
            "note": "Verdicts are hound findings (open vs resolved), not "
                    "doctrinal claims. Full sessions live in the ipvv repo; "
                    "ask follow-ups via the pushing lab."}


def trace_stats() -> tuple[int, dict]:
    """Live trace count + verdicts from data/traces/index.json (no stale numbers)."""
    try:
        d = json.loads((ROOT / "data" / "traces" / "index.json").read_text())
        return int(d.get("count") or 0), (d.get("verdicts") or {})
    except (OSError, ValueError):
        return 0, {}


def build_llms(pushing: dict, biblio: dict, sanskrit: dict) -> str:
    works = biblio.get("counts", {}).get("works", 0)
    lost = biblio.get("counts", {}).get("lost_or_unverified", 0)
    rows = biblio.get("works") or []
    ours = biblio.get("counts", {}).get("ours_translations", 0)
    readable = sum(1 for w in rows if w.get("has_reader"))
    with_pass = sum(1 for w in rows if w.get("passages"))
    projected = sum(1 for w in rows if w.get("has_projection"))
    formal = sum(1 for w in rows if w.get("formalized"))
    n_traces, tr_verdicts = trace_stats()
    complete = tr_verdicts.get("COMPLETE", 0)
    partial = tr_verdicts.get("PARTIAL", 0)
    lines = [
        "# Svatantrya Reader (svread)",
        "",
        f"> Machine-readable Trika Shaivism library. Measured state: "
        f"{ours} works in our translation pipeline, {with_pass} with "
        f"passage ledgers, {readable} readable now, {projected} with a "
        f"scholar projection, {formal} with formalised chunks. Layered "
        f"translations use T1 (literal gloss), L0 (morphology), ARGMAP "
        f"(argument), L2 (reading), C1 (essence), L3 (final), L4 (song). "
        f"Also: 10 Learn Sanskrit lessons, a {works}-work bibliography with "
        f"translation links, live Q&A enquiries, and a scholar workspace.",
        "",
        "## Views (single-page app; these URLs load the view)",
        "",
        f"- Reader (browse; {readable} works currently have a reader bundle): {ORIGIN}/",
        f"- Sanskrit lessons (10, Learn/Decode/Recognise tabs): {ORIGIN}/?view=sanskrit",
        f"- Bibliography index ({works} works, {lost} lost/unverified): {ORIGIN}/?view=biblio",
        "- Scholar hub (per work, ?work=<id>&view=scholar): drafts, review, signoff, DOI",
        f"- Pushing Lab (live enquiries): {ORIGIN}/pushing.html",
        "- Chat: every page has a chat rail answering from that work's gated passages with citations.",
        "",
        "## Data (fetchable JSON, hash-pinned in data/release-manifest.json)",
        "",
        f"- Bibliography (works, editions, translations+links, lost with basis, formal coverage): {ORIGIN}/data/biblio.json",
        f"- Sanskrit lessons index + rule boxes: {ORIGIN}/data/sanskrit/index.json",
        f"- Per-work reader bundle: {ORIGIN}/data/<work>.json (55+ works; originals, layers, hashes)",
        f"- Scholar projections: {ORIGIN}/data/scholar/<work>.json (versions, essays, reviews, signoffs, projection_sha256)",
        f"- Pushing digest ({pushing['count']} live questions + hound verdicts): {ORIGIN}/data/pushing.json",
        f"- Sanskrit lessons (rendered pages): {ORIGIN}/data/sanskrit/site/lesson-01.html ... lesson-10.html",
        f"- Formal registry (every REGISTERED theorem, its scope, and the unformalised gap list): {ORIGIN}/data/formal.json",
        f"- Verification packs + no-code recipe (fetch + sha256sum, no install): {ORIGIN}/data/verify/index.json",
        f"- Trace index ({n_traces} chunks; {complete} COMPLETE / {partial} PARTIAL; "
        f"per-chunk source->layers->proofs->theorems->essays, hash-pinned): "
        f"{ORIGIN}/data/traces/index.json",
        f"- Trace bundles (one JSON per chunk, trika-trace/1, re-verifiable): {ORIGIN}/data/traces/<work>-<target>.json",
        "- Or ask an MCP client with the openpatala-federation gateway for formal__trace {work, target} (plus formal__bridge, formal__gaps, formal__evidence, formal__table, formal__runs, formal__axioms)",
        "",
        "## Layers (internal codes -> public names; codes are load-bearing)",
        "",
        "T1 draft-translation · L0 literal-gloss · ARGMAP argument-map · "
        "L2 reading-translation · C1 essence · C2 register-render · "
        "L3 final-translation · L4 song. See trika-x layer-names map.",
        "",
        "## How to cite (so answers stay traceable)",
        "",
        f"- Self-verification (no code, no account): {ORIGIN}/?view=verify "
        f"and {ORIGIN}/VERIFY.md — fetch the trace + pack, sha256sum the bytes, "
        f"compare. Matching hashes prove identity; they do not prove quality.",
        "",
        "- Cite work id + chunk locator (e.g. bhairavastava bh-p02) + "
        "immutable_id (pt:pid:...) + projection_sha256 when quoting a "
        "projection.",
        "- OURS-* translations are machine-proposed, human review pending — "
        "say so. Lost works are scholar-REPORTED (finding-aid basis), not "
        "witnessed. Scholar essays are SELF_ATTESTED positions unless "
        "independently reviewed — say which.",
        "- Never invent a witness, edition, or DOI. If the record says "
        "UNPINNED/BLOCKED/UNVERIFIED, repeat that. For full verification, "
        "resolve a formal__trace bundle for the chunk and re-run its hashes.",
        "",
        "## Rights",
        "",
        "- Sanskrit sources: edition-labelled (mostly GRETIL CC BY-NC-SA); "
        "specific edition rights unknown unless stated.",
        "- Our English layers: cite with provenance; style/voice examples "
        "need author grant (see Scholar permissions).",
        "",
    ]
    return "\n".join(lines)


def build_sitemap() -> str:
    # NOTE: keep locs literal (query strings are valid in sitemaps).
    # Static lesson pages are listed directly so crawlers that skip JS
    # still discover full-text lessons; ?view= URLs cover the app shell.
    urls = ["", "pushing.html", "?view=sanskrit", "?view=biblio",
            "?view=scholar"]
    try:
        idx = json.loads((ROOT / "data" / "sanskrit" / "index.json").read_text())
        for e in idx.get("lessons", []):
            if e.get("html"):
                urls.append(f"data/sanskrit/{e['html']}")
    except (OSError, ValueError):
        pass
    seen, unique = set(), []
    for u in urls:
        if u not in seen:
            seen.add(u)
            unique.append(u)
    body = "\n".join(f"  <url><loc>{ORIGIN}/{u}</loc></url>" for u in unique)
    return ("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n"
            "<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n"
            + body + "\n</urlset>\n")


def build_robots() -> str:
    bots = ["GPTBot", "ChatGPT-User", "OAI-SearchBot", "ClaudeBot",
            "anthropic-ai", "Cohere-ai", "PerplexityBot", "Google-Extended",
            "Bytespider"]
    lines = [f"User-agent: {b}\nAllow: /" for b in bots]
    lines.append("User-agent: *\nAllow: /")
    lines.append(f"Sitemap: {ORIGIN}/sitemap.xml")
    return "\n\n".join(lines) + "\n"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true")
    a = ap.parse_args()
    pushing = build_pushing()
    biblio = load_json(OUT / "biblio.json")
    sanskrit = load_json(OUT / "sanskrit" / "index.json")
    if not biblio.get("works"):
        print("emit discovery: biblio.json has no works", file=sys.stderr)
        return 2
    artifacts = {
        "data/pushing.json": json.dumps(pushing, ensure_ascii=False,
                                        sort_keys=True, indent=1) + "\n",
        "llms.txt": build_llms(pushing, biblio, sanskrit),
        "sitemap.xml": build_sitemap(),
        "robots.txt": build_robots(),
    }
    if a.check:
        ok = True
        for name, content in artifacts.items():
            p = ROOT / name
            if not p.exists() or p.read_bytes() != content.encode():
                print(f"mismatch or missing: {name}")
                ok = False
        print("emit discovery --check: " + ("GREEN" if ok else "RED"))
        return 0 if ok else 1
    for name, content in artifacts.items():
        (ROOT / name).write_text(content, encoding="utf-8")
    print(f"emitted llms.txt + sitemap.xml + robots.txt + "
          f"data/pushing.json ({pushing['count']} items)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
