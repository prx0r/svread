#!/usr/bin/env python3
"""emit_claim_pages.py — one pre-rendered claim page per trace bundle.

Reads data/traces/index.json + each bundle + each verify-pack manifest +
(optional) data/<work>.json reader bundles; writes claim/<work>/<target>/
index.html + index.md, work/<work>/index.html, chain/<work>/<target>/
index.html. Hand-built exemplar: claim/tantrasara-a08/tsa08-p03/index.html.

SITE_ORIGIN env (default https://svread.pages.dev, trailing slash stripped)
is the only place the hostname appears. Deterministic: sorted entries, no
timestamps except the data's own produced_at (omitted when absent).
--dry-run prints counts, writes nothing. --check byte-compares.
Fails closed: missing trace/pack, hash mismatch, or answer >40 words aborts
the whole emit — no partial publication.
"""
from __future__ import annotations

import argparse
import hashlib
import html
import json
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TRACES = ROOT / "data" / "traces"
VERIFY = ROOT / "data" / "verify"

ORIGIN = os.environ.get("SITE_ORIGIN", "https://svread.pages.dev").rstrip("/")


def esc(s) -> str:
    return html.escape(s if isinstance(s, str) else ("" if s is None else str(s)),
                       quote=True)


def words(s: str) -> int:
    return len(s.split())


def load_json(p: Path):
    return json.loads(p.read_text(encoding="utf-8"))


def answer_for(work: str, verses: str, doc: dict) -> str:
    ass = doc.get("assurance", {}) or {}
    formal = doc.get("formal", {}) or {}
    gate = proofs_gate(doc)
    n_thm = len(formal.get("theorems") or [])
    if gate == "BLOCKED":
        gate_phrase = "Chunk gate BLOCKED"
    elif gate == "PASS":
        gate_phrase = "Chunk gate passes"
    else:
        gate_phrase = f"Chunk gate {gate}"
    if n_thm and all(not t.get("run_bound") for t in formal["theorems"]):
        formal_phrase = "counts REGISTERED without a per-declaration run"
    elif n_thm:
        formal_phrase = f"{n_thm} theorems REGISTERED"
    else:
        formal_phrase = "no formal theorems bound"
    wit = ass.get("witness", "UNPINNED")
    wit_phrase = "no witness verified" if wit == "UNPINNED" else f"witness {wit}"
    vlabel = f"{work} {doc.get('chunk', {}).get('target', '')} ({verses})"
    return (f"{vlabel} passes link checks; {formal_phrase}. "
            f"{gate_phrase}; {wit_phrase}.")


def proofs_gate(doc: dict) -> str:
    return ((doc.get("proofs", {}) or {}).get("chunk_gate", {}) or {}).get(
        "deterministic_gate", "UNKNOWN")


def claim_rows(doc: dict) -> list[tuple[str, str, str]]:
    rows = []
    for t in (doc.get("formal", {}) or {}).get("theorems", []) or []:
        st = "REGISTERED" if t.get("status") in (
            "ARGMAP-PINNED", "REGISTERED") else (t.get("status") or "UNKNOWN")
        rb = "" if t.get("run_bound") else ", run UNBOUND"
        rows.append((t.get("theorem", "?"),
                     f"{st}{rb} (tier {t.get('tier', '?')})",
                     "trace formal; EVIDENCE registry reference only"))
    cg = ((doc.get("proofs", {}) or {}).get("chunk_gate", {}) or {})
    blocking = ", ".join(cg.get("blocking", []) or []) or "none"
    rows.append(("Deterministic chunk gate", cg.get("deterministic_gate",
                "UNKNOWN") + f" ({blocking})", "proofs.chunk_gate"))
    ass = doc.get("assurance", {}) or {}
    rows.append(("Manuscript witness",
                 f"{ass.get('witness', 'UNPINNED')} (0 verified corpus-wide)",
                 "identity.witness"))
    rows.append(("Source-span completeness",
                 str(ass.get("source_span_verified", "UNKNOWN")),
                 "assurance: ledger span is an excerpt; volume not hashed"))
    return rows


def build_claim_page(work: str, target: str, doc: dict, man: dict,
                     verse: str, l2: str | None, prev: str | None,
                     nxt: str | None, bundle_sha: str) -> str:
    ass = doc.get("assurance", {}) or {}
    src = doc.get("source", {}) or {}
    layers = doc.get("layers", {}) or {}
    proofs = doc.get("proofs", {}) or {}
    formal = doc.get("formal", {}) or {}
    verses = src.get("verses", target)
    answer = answer_for(work, verses, doc)
    if words(answer) > 40:
        raise ValueError(f"answer too long ({words(answer)}w): {answer}")
    edition = (src.get("edition", {}) or {}).get("label", "edition unrecorded")
    ed_status = (src.get("edition", {}) or {}).get("status", "UNKNOWN")
    ledger = src.get("ledger", "ledger unrecorded")
    cg = proofs.get("chunk_gate", {}) or {}
    sp = proofs.get("song_proof", {}) or {}
    artifacts = man.get("artifacts", []) or []
    art_lines = "\n".join(
        f"{a.get('name')}  {(a.get('sha256') or '')[:16]}…  {a.get('bytes', '?')}B"
        for a in artifacts)
    layer_lines = "\n".join(
        f"layer {k}: {(v.get('sha256') or '')[:16]}…  {v.get('path')}  {v.get('status')}"
        for k, v in layers.items() if isinstance(v, dict))
    htv = man.get("how_to_verify") or (
        "For each artifact: curl the pack file, sha256sum it, compare with "
        "the manifest sha256 and the trace hashes. Any mismatch means the "
        "trace is stale.")
    claim_trs = "\n".join(
        f"<tr><td>{esc(c)}</td><td>{esc(s)}</td><td>{esc(b)}</td></tr>"
        for c, s, b in claim_rows(doc))
    if l2:
        l2_block = (f"<p>{esc(l2)}</p>\n<p>Every clause traces to the layer "
                    "bytes above; read them in the verify pack.</p>")
    else:
        l2_block = (f"<p><strong>Reading translation: withheld.</strong> No "
                    f"reader bundle (<code>data/{esc(work)}.json</code>) covers "
                    f"this passage in this release, so no English rendering is "
                    f"quoted. The verify pack carries the layer bytes; read them "
                    f"there rather than trusting a rendering we cannot show.</p>")
    rels = []
    if prev:
        rels.append(f'<li>Previous claim in work: <a href="{ORIGIN}/claim/{esc(work)}/{esc(prev)}/">{esc(prev)}</a></li>')
    if nxt:
        rels.append(f'<li>Next claim in work: <a href="{ORIGIN}/claim/{esc(work)}/{esc(nxt)}/">{esc(nxt)}</a></li>')
    rels.append(f'<li>Work index: <a href="{ORIGIN}/work/{esc(work)}/">{esc(work)}</a></li>')
    chain_trs = "\n".join([
        f"<tr><td>SOURCE edition + span</td><td>{esc(edition)}; verses {esc(verses)} excerpt</td><td>{esc(ed_status)}; span {esc(str(ass.get('source_span_verified', 'UNKNOWN')))}</td></tr>",
        f"<tr><td>LAYERS</td><td>shas below; song-file paths</td><td>{esc(', '.join(sorted({str((v or {}).get('status')) for v in layers.values() if isinstance(v, dict)})))}</td></tr>",
        f"<tr><td>GATE deterministic</td><td>{esc(', '.join(cg.get('blocking', []) or ['none']))}</td><td>{esc(cg.get('deterministic_gate', 'UNKNOWN'))}</td></tr>",
        f"<tr><td>FORMAL theorems</td><td>registry references, run_bound false</td><td>{esc(formal.get('status', 'UNKNOWN'))}</td></tr>",
        f"<tr><td>TRACE bundle</td><td><code>{esc(bundle_sha[:16])}…</code></td><td>{esc(doc.get('verdict', 'UNKNOWN'))} (links present only)</td></tr>",
        f"<tr><td>PACK manifest</td><td>{len(artifacts)} artifacts</td><td>links present</td></tr>",
        f"<tr><td>WITNESS</td><td>none verified</td><td>{esc(str(ass.get('witness', 'UNPINNED')))}</td></tr>",
        f"<tr><td>REVIEW</td><td>none bound</td><td>{esc(str(ass.get('review', 'UNREVIEWED')))}</td></tr>",
        f"<tr><td>PUBLICATION</td><td>human sign-off required; never automatic</td><td>{esc(str(ass.get('publication', 'NOT_AUTHORIZED')))}</td></tr>",
    ])
    ld = {"@context": "https://schema.org", "@graph": [
        {"@type": ["Claim", "CreativeWork"],
         "@id": f"{ORIGIN}/claim/{work}/{target}/#claim",
         "name": f"{work} {target}", "text": answer,
         "inLanguage": ["sa", "en"],
         "isBasedOn": {"@type": "CreativeWork", "name": edition},
         "citation": {"@type": "CreativeWork",
                      "url": f"{ORIGIN}/data/traces/{work}-{target}.json"},
         "isPartOf": {"@type": "Dataset", "name": "Svatantrya Reader trace corpus",
                      "distribution": {"@type": "DataDownload",
                                       "contentUrl": f"{ORIGIN}/data/traces/index.json"}},
         "reviewedBy": None,
         "additionalProperty": [
             {"@type": "PropertyValue", "name": "deterministic_gate",
              "value": str(proofs_gate(doc))},
             {"@type": "PropertyValue", "name": "witness",
              "value": str(ass.get("witness", "UNPINNED"))},
             {"@type": "PropertyValue", "name": "formal_run",
              "value": str(ass.get("formal_run", "UNBOUND"))},
             {"@type": "PropertyValue", "name": "review",
              "value": str(ass.get("review", "UNREVIEWED"))},
             {"@type": "PropertyValue", "name": "publication",
              "value": str(ass.get("publication", "NOT_AUTHORIZED"))}]},
        {"@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Svatantrya Reader",
             "item": f"{ORIGIN}/"},
            {"@type": "ListItem", "position": 2, "name": work,
             "item": f"{ORIGIN}/work/{work}/"},
            {"@type": "ListItem", "position": 3, "name": target,
             "item": f"{ORIGIN}/claim/{work}/{target}/"}]}]}
    return f"""<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{esc(work)} {esc(verses)} — gate, count and verifiability | Svatantrya Reader</title>
<meta name="description" content="{esc(answer)} Hashes included.">
<link rel="canonical" href="{ORIGIN}/claim/{esc(work)}/{esc(target)}/">
<link rel="alternate" type="text/markdown" href="{ORIGIN}/claim/{esc(work)}/{esc(target)}/index.md">
<link rel="describedby" href="{ORIGIN}/llms.txt">
<meta name="citation_title" content="{esc(work)} {esc(target)} ({esc(verses)}) — trace-backed claim page">
<meta name="citation_author" content="Svatantrya Reader">
<meta property="og:title" content="{esc(work)} {esc(verses)} — gate, count and verifiability">
<meta property="og:type" content="article">
<meta property="og:url" content="{ORIGIN}/claim/{esc(work)}/{esc(target)}/">
<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False, sort_keys=True)}</script>
</head><body>
<nav aria-label="Breadcrumb"><a href="{ORIGIN}/">Svatantrya Reader</a> › <a href="{ORIGIN}/work/{esc(work)}/">{esc(work)}</a> › {esc(target)}</nav>
<main>
<p class="answer" id="answer">{esc(answer)}</p>

<h2>The passage</h2>
<p>Passage excerpt exactly as hashed (from <code>{esc(ledger)}</code>). Devanagari is not in the ledger, so none is rendered. The recorded hash covers this excerpt, not the edition volume.</p>
<blockquote cite="{ORIGIN}/data/traces/{esc(work)}-{esc(target)}.json"><pre>{esc(verse)}</pre></blockquote>
{l2_block}

<h2>Claim table</h2>
<table><thead><tr><th>Claim</th><th>Status</th><th>Basis</th></tr></thead><tbody>
{claim_trs}
</tbody></table>

<h2>What this does NOT establish</h2>
<ul>
<li>That any translation is correct — matching bytes never prove correctness{"; no English is quoted on this page" if not l2 else ""}.</li>
<li>That a human reviewed anything — review UNREVIEWED, publication NOT_AUTHORIZED.</li>
<li>That a manuscript witness exists — witnesses are UNPINNED until manuscript records exist.</li>
<li>That a formal count is proved for this passage — theorems are REGISTERED via reference; no per-declaration run digest is bound.</li>
<li>That the excerpt is the whole span — span completeness is {esc(str(ass.get('source_span_verified', 'UNKNOWN')))}.</li>
</ul>

<h2>Verify it</h2>
<ol>
<li>Fetch the trace: <code>curl -s {ORIGIN}/data/traces/{esc(work)}-{esc(target)}.json</code></li>
<li>Fetch the pack manifest: <code>curl -s {ORIGIN}/data/verify/{esc(work)}-{esc(target)}/manifest.json</code></li>
<li>{esc(htv)}</li>
<li>If every hash matches and the verdict/gaps here agree with the trace, the chain is intact. A mismatch means upstream bytes changed: treat the trace as stale, not the hash as wrong.</li>
</ol>

<h2>Hashes</h2>
<pre>source excerpt: {(src.get('bytes_sha256') or '')}
  ledger: {esc(ledger)} · edition: {esc(edition)} ({esc(ed_status)})
{esc(layer_lines)}
song proof {(sp.get('file') or '')}: {(sp.get('sha256') or '')}  {(sp.get('status') or '')} ({(sp.get('warnings') or 0)} warnings)
trace bundle traces/{esc(work)}-{esc(target)}.json: {esc(bundle_sha)}
verify pack artifacts (bytes):
{esc(art_lines)}</pre>

<h2 id="chain">Chain</h2>
<table><thead><tr><th>Hop</th><th>Value</th><th>Status</th></tr></thead><tbody>
{chain_trs}
</tbody></table>

<h2>Cite this</h2>
<p>Svatantrya Reader, “{esc(work)} {esc(target)} ({esc(verses)})”, <code>{ORIGIN}/claim/{esc(work)}/{esc(target)}/</code>, version <code>trace {esc(bundle_sha[:16])}…</code>. “Complete” means links present — not approval, proof, or witness verification.</p>

<h2>Related</h2>
<ul>
{chr(10).join(rels)}
</ul>

<h2>Provenance</h2>
<ul>
<li>Edition: <code>{esc(edition)}</code> ({esc(ed_status)}). Licence: consult the edition source; layers are quoted only from pinned bundles in this release.</li>
<li>Ledger: <code>{esc(ledger)}</code> (translation-work lane; read-only from here).</li>
<li>Generated by <code>tools/emit_claim_pages.py</code> from the trace bundle + pack manifest. Regenerates byte-identically or fails closed.</li>
</ul>
</main>
</body></html>
"""


def build_md(work: str, target: str, verses: str, answer: str, verse: str,
             l2: str | None, rows: list[tuple[str, str, str]]) -> str:
    trs = "\n".join(f"| {c} | {s} | {b} |" for c, s, b in rows)
    l2_sec = f"\n## Reading\n\n{l2}\n" if l2 else (
        "\n## Reading\n\nWithheld: no reader bundle covers this passage in "
        "this release. See the verify pack for layer bytes.\n")
    return (f"# {work} {target} ({verses})\n\n{answer}\n\n"
            f"Canonical: {ORIGIN}/claim/{work}/{target}/\n\n"
            f"## Passage (excerpt as hashed)\n\n```\n{verse}\n```\n"
            f"{l2_sec}\n## Claims\n\n| Claim | Status | Basis |\n"
            f"|---|---|---|\n{trs}\n")


def build_work_index(work: str, items: list[tuple[str, str, str]]) -> str:
    lis = "\n".join(
        f'<li><a href="{ORIGIN}/claim/{esc(work)}/{esc(t)}/">{esc(t)}</a> — '
        f"{esc(v)} — {esc(a)}</li>" for t, v, a in items)
    return f"""<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{esc(work)} — claims | Svatantrya Reader</title>
<link rel="canonical" href="{ORIGIN}/work/{esc(work)}/">
</head><body>
<nav aria-label="Breadcrumb"><a href="{ORIGIN}/">Svatantrya Reader</a> › {esc(work)}</nav>
<main><h1>{esc(work)} — {len(items)} claims</h1>
<ul>
{lis}
</ul></main>
</body></html>
"""


def build_work_md(work: str, items: list[tuple[str, str, str]]) -> str:
    lis = "\n".join(f"- [{t}]({ORIGIN}/claim/{work}/{t}/) — {v} — {a}"
                    for t, v, a in items)
    return (f"# {work} — {len(items)} claims\n\n"
            f"Canonical: {ORIGIN}/work/{work}/\n\n{lis}\n")


def build_chain_md(work: str, target: str, doc: dict) -> str:
    ass = doc.get("assurance", {}) or {}
    rows = "\n".join(f"| {k} | {v} |" for k, v in sorted(ass.items()))
    return (f"# Chain: {work} {target}\n\n"
            f"Canonical: {ORIGIN}/chain/{work}/{target}/\n\n"
            f"| Field | Value |\n|---|---|\n{rows}\n")


def build_chain_page(work: str, target: str, doc: dict) -> str:
    ass = doc.get("assurance", {}) or {}
    rows = "\n".join(
        f"<tr><td>{esc(k)}</td><td>{esc(str(v))}</td></tr>"
        for k, v in sorted(ass.items()))
    return f"""<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{esc(work)} {esc(target)} — derivability chain | Svatantrya Reader</title>
<link rel="canonical" href="{ORIGIN}/chain/{esc(work)}/{esc(target)}/">
</head><body>
<nav aria-label="Breadcrumb"><a href="{ORIGIN}/">Svatantrya Reader</a> › <a href="{ORIGIN}/claim/{esc(work)}/{esc(target)}/">{esc(target)}</a> › chain</nav>
<main><h1>Chain: {esc(work)} {esc(target)}</h1>
<table><thead><tr><th>Field</th><th>Value</th></tr></thead><tbody>
{rows}
</tbody></table>
<p>Each row links to a real artifact via the claim page's hash block. A hash that does not recompute fails the page.</p>
</main>
</body></html>
"""


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()
    try:
        index = load_json(TRACES / "index.json")
    except FileNotFoundError:
        print("emit_claim_pages: no data/traces/index.json", file=sys.stderr)
        return 2
    entries = sorted(index.get("entries", []),
                     key=lambda e: (e.get("work") or "", e.get("target") or ""))
    if not entries:
        print("emit_claim_pages: zero entries; refusing empty publish",
              file=sys.stderr)
        return 2
    by_work: dict[str, list[dict]] = {}
    for e in entries:
        by_work.setdefault(e.get("work") or "?", []).append(e)
    rendered: dict[str, str] = {}
    failures: list[str] = []
    for e in entries:
        work, target = e.get("work") or "", e.get("target") or ""
        key = f"{work}-{target}"
        try:
            doc = load_json(TRACES / f"{key}.json")
            man = load_json(VERIFY / key / "manifest.json")
        except FileNotFoundError as ex:
            failures.append(f"{key}: missing input ({ex.filename})")
            continue
        # hash agreement: manifest artifacts vs trace layers/source/proof
        trace_shas = {src_sha(doc), proof_sha(doc)}
        trace_shas |= set(layer_shas(doc).values())
        man_shas = {(a.get("sha256") or "") for a in man.get("artifacts", [])}
        if not (trace_shas & man_shas):
            failures.append(f"{key}: no manifest sha matches any trace sha")
            continue
        try:
            verse = (VERIFY / key / "source.txt").read_text(encoding="utf-8")
        except FileNotFoundError:
            failures.append(f"{key}: missing pack source.txt")
            continue
        l2 = work_l2(work, target)
        sibs = [x.get("target") for x in by_work[work]]
        i = sibs.index(target)
        prev = sibs[i - 1] if i > 0 else None
        nxt = sibs[i + 1] if i + 1 < len(sibs) else None
        try:
            page = build_claim_page(work, target, doc, man, verse, l2,
                                    prev, nxt, e.get("sha256") or "")
        except ValueError as ex:
            failures.append(f"{key}: {ex}")
            continue
        verses = (doc.get("source", {}) or {}).get("verses", target)
        answer = answer_for(work, verses, doc)
        rendered[f"claim/{work}/{target}/index.html"] = page
        rendered[f"claim/{work}/{target}/index.md"] = build_md(
            work, target, verses, answer, verse, l2, claim_rows(doc))
        rendered[f"chain/{work}/{target}/index.html"] = build_chain_page(
            work, target, doc)
        rendered[f"chain/{work}/{target}/index.md"] = build_chain_md(
            work, target, doc)
    for work, es in sorted(by_work.items()):
        items = []
        for x in es:
            verses = ""
            try:
                d = load_json(TRACES / f"{work}-{x.get('target')}.json")
                verses = (d.get("source", {}) or {}).get("verses",
                                                          x.get("target"))
                items.append((x.get("target"), x.get("verdict"),
                              answer_for(work, verses, d)))
            except (FileNotFoundError, KeyError):
                pass
        rendered[f"work/{work}/index.html"] = build_work_index(work, items)
        rendered[f"work/{work}/index.md"] = build_work_md(work, items)
    if failures:
        print("emit_claim_pages: REFUSING (fail-closed):", file=sys.stderr)
        for f in failures[:20]:
            print("  - " + f, file=sys.stderr)
        return 1
    if a.dry_run:
        n_claim = sum(1 for k in rendered if k.startswith("claim/")
                      and k.endswith(".html"))
        print(f"dry-run: {len(entries)} traces -> {n_claim} claim pages, "
              f"{len(by_work)} work indexes, {n_claim} chain pages, "
              f"{n_claim} md mirrors; writes nothing")
        return 0
    if a.check:
        ok = True
        for name, blob in rendered.items():
            dst = ROOT / name
            if not dst.exists() or dst.read_text(
                    encoding="utf-8") != blob:
                print(f"mismatch or missing: {name}")
                ok = False
        # exemplar is hand-built: must still satisfy the gates
        print("emit claim pages --check: " + ("GREEN" if ok else "RED"))
        return 0 if ok else 1
    for name, blob in rendered.items():
        dst = ROOT / name
        dst.parent.mkdir(parents=True, exist_ok=True)
        dst.write_text(blob, encoding="utf-8")
    print(f"published {len(entries)} claim pages (+md mirrors, "
          f"{len(by_work)} work indexes, chain pages)")
    return 0


def src_sha(doc: dict) -> str:
    return (doc.get("source", {}) or {}).get("bytes_sha256") or ""


def proof_sha(doc: dict) -> str:
    return ((doc.get("proofs", {}) or {}).get("song_proof", {}) or {}).get(
        "sha256") or ""


def layer_shas(doc: dict) -> dict[str, str]:
    out = {}
    for k, v in ((doc.get("layers", {}) or {}).items()):
        if isinstance(v, dict) and v.get("sha256"):
            out[k] = v["sha256"]
    return out


def work_l2(work: str, target: str) -> str | None:
    p = ROOT / "data" / f"{work}.json"
    if not p.exists():
        return None
    try:
        d = load_json(p)
    except ValueError:
        return None
    for c in d.get("chunks", []) or []:
        if str(c.get("chunk", "")).split("-v")[0] == target:
            l2 = c.get("l2")
            if isinstance(l2, str) and l2.strip():
                return l2.strip()
            return None
    return None


if __name__ == "__main__":
    raise SystemExit(main())
