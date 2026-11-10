#!/usr/bin/env python3
"""emit_claim_pages.py — one pre-rendered claim page per trace bundle.

Reads data/traces/index.json + each bundle + each verify-pack manifest +
(optional) data/<work>.json reader bundles; writes claim/<work>/<target>/
index.html + index.md, work/<work>/index.html, chain/<work>/<target>/
index.html. Hand-built exemplar: claim/tantrasara-a08/tsa08-p03/index.html.

SITE_ORIGIN env (default https://svatantrya.net, trailing slash stripped)
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
import re
import sys
from pathlib import Path

ROOT = Path(os.environ.get("SVREAD_ROOT") or Path(__file__).resolve().parent.parent)
TRACES = ROOT / "data" / "traces"
VERIFY = ROOT / "data" / "verify"
HOLDS = ROOT / "data" / "holds.json"
SOURCES = ROOT / "data" / "sources.json"

ORIGIN = (os.environ.get("SITE_ORIGIN") or "https://svatantrya.net").rstrip("/")

MIN_CITE_LEN = 20


def load_holds() -> dict:
    try:
        d = json.loads(HOLDS.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {}
    out = {}
    for h in d.get("holds", []) or []:
        if isinstance(h, dict) and h.get("work"):
            out[h["work"]] = h
    return out


def load_sources() -> dict:
    try:
        d = json.loads(SOURCES.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {}
    return d.get("works", {}) or {}


def norm(s: str) -> str:
    s = re.sub(r"//\s*abhts_[\d.]+", " ", s or "")
    s = re.sub(r"[|/‖]+", " ", s)  # danda variants differ by layer: unify
    return re.sub(r"\s+", " ", s).strip()


def flat(s: str) -> str:
    """Spacing-stripped form for sandhi-joined compounds (bahir asau in the
    gloss vs bahirasau in the ledger). Used only as a fallback join, with
    the same minimum length, never for display."""
    return re.sub(r"[\s\-‐‑]+", "", norm(s))


def sha_bytes(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


def verify_inputs(key: str, doc: dict, man: dict, entry_sha: str,
                  pack: Path) -> tuple[dict, str | None]:
    """Byte-verify every input by role and identity. Returns (blobs, None)
    on success or ({}, reason) on any mismatch — fail closed, no partial."""
    blobs: dict[str, bytes] = {}

    def read(name: str) -> bytes | None:
        p = pack / name
        try:
            return p.read_bytes()
        except OSError:
            return None

    trace_raw = (TRACES / f"{key}.json").read_bytes()
    if sha_bytes(trace_raw) != (entry_sha or ""):
        return {}, f"{key}: trace bytes do not match index sha"
    man_by_name = {}
    for a in man.get("artifacts", []) or []:
        if isinstance(a, dict) and a.get("name"):
            man_by_name[a["name"]] = a
    src = doc.get("source", {}) or {}
    # source bytes vs trace AND manifest (role source-bytes)
    raw = read("source.txt")
    if raw is None:
        return {}, f"{key}: missing pack source.txt"
    if sha_bytes(raw) != (src.get("bytes_sha256") or ""):
        return {}, f"{key}: source.txt does not match trace source sha"
    msrc = man_by_name.get("source.txt")
    if not msrc or msrc.get("role") != "source-bytes" or \
            msrc.get("sha256") != sha_bytes(raw):
        return {}, f"{key}: source.txt not bound by manifest as source-bytes"
    blobs["source.txt"] = raw
    # song proof vs trace AND manifest (role proof) — only when the trace
    # asserts one; honest absence (PARTIAL) is not a mismatch
    sp = (doc.get("proofs", {}) or {}).get("song_proof", {}) or {}
    spfile = sp.get("file") or ""
    spname = spfile.split("/")[-1]
    if sp.get("sha256"):
        if not spname:
            return {}, f"{key}: trace asserts proof sha but no proof file"
        praw = read(spname)
        if praw is None:
            return {}, f"{key}: missing pack proof file {spname}"
        if sha_bytes(praw) != sp["sha256"]:
            return {}, f"{key}: proof bytes do not match trace"
        mproof = man_by_name.get(spname)
        if not mproof or mproof.get("role") != "proof" or \
                mproof.get("sha256") != sha_bytes(praw):
            return {}, f"{key}: proof not bound by manifest as proof"
        blobs[spname] = praw
    # every trace layer with a sha must byte-match a manifest artifact
    for lname, lval in (doc.get("layers", {}) or {}).items():
        if not isinstance(lval, dict) or not lval.get("sha256"):
            continue
        fname = (lval.get("path") or "").split("/")[-1]
        if not fname:
            return {}, f"{key}: layer {lname} has sha but no file path"
        lraw = read(fname)
        if lraw is None:
            return {}, f"{key}: missing pack layer file {fname}"
        if sha_bytes(lraw) != lval["sha256"]:
            return {}, f"{key}: {fname} does not match trace layer sha"
        mart = man_by_name.get(fname)
        if not mart or mart.get("sha256") != sha_bytes(lraw):
            return {}, f"{key}: {fname} not bound by manifest"
        blobs[fname] = lraw
    return blobs, None


def verified_reading(blobs: dict, excerpt: str) -> tuple[list | None, str]:
    """English derived ONLY from verified pack L2 bytes, joined by explicit
    verse mapping (entry sanskrit_cite byte-present in the verified passage
    excerpt). Returns (lines[(verse_id, text)], '') or (None, reason)."""
    l2name = next((n for n in blobs
                   if n.endswith(".l2.json")), None)
    if not l2name:
        if "L2.md" in blobs:
            return None, ("legacy markdown rendering (section-level, not "
                           "verse-mapped to this passage)")
        return None, "no verified L2 layer in this pack"
    try:
        raw_text = blobs[l2name].decode("utf-8")
        entries = json.loads(raw_text)
    except (ValueError, UnicodeDecodeError):
        if raw_text.lstrip().startswith("#"):
            return None, ("legacy markdown rendering (section-level, not "
                           "verse-mapped to this passage)")
        return None, "verified L2 bytes do not parse as JSON"
    if not isinstance(entries, list):
        return None, "verified L2 is not a verse list"
    if entries and not any(isinstance(x, dict) and x.get("sanskrit_cite")
                           for x in entries):
        return None, ("pack L2 entries carry no Sanskrit cites to join on "
                       "(no verse mapping possible)")
    nsrc = norm(excerpt)
    fsrc = flat(excerpt)
    lines = []
    for e in entries:
        if not isinstance(e, dict):
            continue
        text = (e.get("plain_english") or "").strip()
        cite = norm(e.get("sanskrit_cite") or "")
        if not text or len(cite) < MIN_CITE_LEN:
            continue
        vid = e.get("verse_id") or f"v{e.get('verse', '?')}"
        if cite in nsrc:
            lines.append((str(e.get("verse", 0)), str(vid), text))
        elif len(flat(cite)) >= MIN_CITE_LEN and flat(cite) in fsrc:
            lines.append((str(e.get("verse", 0)), str(vid), text))
    if not lines:
        return None, ("no pack L2 entry maps to this passage excerpt "
                       "(verse-level mapping required, none found)")
    lines.sort(key=lambda x: (x[0], x[1]))
    return [(vid, t) for _, vid, t in lines], ""


def esc(s) -> str:
    return html.escape(s if isinstance(s, str) else ("" if s is None else str(s)),
                       quote=True)


def words(s: str) -> int:
    return len(s.split())


def load_json(p: Path):
    return json.loads(p.read_text(encoding="utf-8"))


def answer_for(work: str, verses: str, doc: dict, target: str = "") -> str:
    ass = doc.get("assurance", {}) or {}
    formal = doc.get("formal", {}) or {}
    gate = proofs_gate(doc)
    links = ass.get("trace_links_present", "UNKNOWN")
    gaps = doc.get("gaps", []) or []
    if links == "PASS":
        link_phrase = "passes link checks"
    elif links == "FAIL":
        link_phrase = (f"links incomplete ({len(gaps)} gaps named)"
                       if gaps else "links incomplete")
    else:
        link_phrase = f"links {links}"
    n_thm = len(formal.get("theorems") or [])
    if n_thm and all(not t.get("run_bound") for t in formal["theorems"]):
        formal_phrase = "counts REGISTERED without a per-declaration run"
    elif n_thm:
        formal_phrase = f"{n_thm} theorems REGISTERED"
    else:
        formal_phrase = "no formal theorems bound"
    if gate == "BLOCKED":
        gate_phrase = "Chunk gate BLOCKED"
    elif gate == "PASS":
        gate_phrase = "Chunk gate passes"
    else:
        gate_phrase = f"Chunk gate {gate}"
    wit = ass.get("witness", "UNPINNED")
    wit_phrase = "no witness verified" if wit == "UNPINNED" else f"witness {wit}"
    tgt = target or (doc.get("chunk", {}) or {}).get("target", "")
    vlabel = f"{work} {tgt} ({verses})"
    answer = (f"{vlabel} {link_phrase}; {formal_phrase}. "
              f"{gate_phrase}; {wit_phrase}.")
    # fail closed: the link claim must match the assurance value
    if (links == "PASS") != ("passes link checks" in answer):
        raise ValueError(f"link-phrase/assurance mismatch: {links}: {answer}")
    if (links == "FAIL") != ("links incomplete" in answer):
        raise ValueError(f"link-phrase/assurance mismatch: {links}: {answer}")
    return answer


def proofs_gate(doc: dict) -> str:
    return ((doc.get("proofs", {}) or {}).get("chunk_gate", {}) or {}).get(
        "deterministic_gate", "UNKNOWN")


def claim_rows(doc: dict) -> list[tuple[str, str, str]]:
    rows = []
    ass0 = doc.get("assurance", {}) or {}
    links0 = ass0.get("trace_links_present", "UNKNOWN")
    gaps0 = doc.get("gaps", []) or []
    rows.append(("Link completeness",
                 f"{links0}" + (f" ({len(gaps0)} gaps named)" if links0 == "FAIL" and gaps0 else ""),
                 "assurance.trace_links_present + gaps"))
    rows.append(("Human review",
                 f"{ass0.get('review', 'UNREVIEWED')} (machine rendering; no human sign-off)",
                 "assurance.review"))
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

def fmt_layer(k: str, v) -> str:
    if not isinstance(v, dict):
        return f"layer {k}: malformed entry (not an object)"
    sha = v.get("sha256") or ""
    path = v.get("path") or ""
    status = v.get("status") or "UNKNOWN"
    if sha and path:
        return f"layer {k}: {sha[:16]}…  {path}  {status}"
    if path:
        return f"layer {k}: {status} (bytes unrecorded) — {path}"
    return f"layer {k}: {status} (no bytes recorded)"


def build_claim_page(work: str, target: str, doc: dict, man: dict,
                     verse: str, reading: list | None, read_note: str,
                     hold: dict | None, srcinfo: dict | None,
                     prev: str | None,
                     nxt: str | None, bundle_sha: str) -> str:
    ass = doc.get("assurance", {}) or {}
    src = doc.get("source", {}) or {}
    layers = doc.get("layers", {}) or {}
    proofs = doc.get("proofs", {}) or {}
    formal = doc.get("formal", {}) or {}
    verses = src.get("verses") or target
    answer = answer_for(work, verses, doc)
    if words(answer) > 40:
        raise ValueError(f"answer too long ({words(answer)}w): {answer}")
    edition = ((src.get("edition", {}) or {}).get("label")
                 or "edition unrecorded")
    ed_status = ((src.get("edition", {}) or {}).get("status")
                 or "UNKNOWN")
    ledger = src.get("ledger", "ledger unrecorded")
    cg = proofs.get("chunk_gate", {}) or {}
    sp = proofs.get("song_proof", {}) or {}
    artifacts = man.get("artifacts", []) or []
    art_lines = "\n".join(
        f"{a.get('name') or '?'}  {(a.get('sha256') or '')[:16]}…  "
        f"{a.get('bytes') if a.get('bytes') is not None else '?'}B"
        for a in artifacts)
    layer_lines = "\n".join(
        fmt_layer(k, v) for k, v in layers.items())
    htv = man.get("how_to_verify") or (
        "For each artifact: curl the pack file, sha256sum it, compare with "
        "the manifest sha256 and the trace hashes. Any mismatch means the "
        "trace is stale.")
    claim_trs = "\n".join(
        f"<tr><td>{esc(c)}</td><td>{esc(s)}</td><td>{esc(b)}</td></tr>"
        for c, s, b in claim_rows(doc))
    review_state = str(ass.get("review", "UNREVIEWED"))
    if reading:
        verse_lines = "\n".join(
            f"<p><b>{esc(vid)}</b> — {esc(t)}</p>" for vid, t in reading)
        l2_block = (
            f"<p><strong>Machine rendering — unreviewed draft, not an "
            f"approved translation.</strong> Each line below is the pack's "
            f"verified L2 for the named verse (bytes checked against trace "
            f"and manifest; join: cited Sanskrit occurs in the hashed "
            f"excerpt, spacing-normalized). Clause-level proof is not "
            f"claimed.</p>\n"
            f"{verse_lines}")
    elif hold:
        l2_block = (
            f"<p><strong>Reading translation: withheld under editorial hold."
            f"</strong> {esc(str(hold.get('note', '')))} "
            f"Review required: {esc(str(hold.get('review', 'pending review')))}."
            f" The verify pack carries the layer bytes; no English is quoted "
            f"until the hold clears.</p>")
    else:
        l2_block = (
            f"<p><strong>Reading translation: withheld.</strong> "
            f"{esc(read_note)} The verify pack carries the layer bytes; no "
            f"English is quoted without a verified verse mapping.</p>")
    noindex = ('\n<meta name="robots" content="noindex">' if hold else "")
    if hold:
        hold_banner = (
            f'<p class="hold"><strong>Editorial hold.</strong> '
            f'{esc(str(hold.get("note", "")))} English is withheld until: '
            f'{esc(str(hold.get("review", "review")))}.</p>')
    else:
        hold_banner = ""
    translators = (srcinfo or {}).get("translators", []) or []
    credit = ("Translators/editors of record here: "
              + "; ".join(translators) + ". " if translators else
              "Translators/editors of record: not established here — "
              "see edition record. ")
    src_record_url = ((srcinfo or {}).get("source_url") or "").strip()
    src_licence = ((srcinfo or {}).get("licence") or "").strip()
    src_status = ((srcinfo or {}).get("status") or "unknown").strip()
    rels = []
    if prev:
        rels.append(f'<li>Previous claim in work: <a href="{ORIGIN}/claim/{esc(work)}/{esc(prev)}/">{esc(prev)}</a></li>')
    if nxt:
        rels.append(f'<li>Next claim in work: <a href="{ORIGIN}/claim/{esc(work)}/{esc(nxt)}/">{esc(nxt)}</a></li>')
    rels.append(f'<li>Work index: <a href="{ORIGIN}/work/{esc(work)}/">{esc(work)}</a></li>')
    verdict = doc.get('verdict', 'UNKNOWN')
    if verdict == "COMPLETE":
        trace_status = "links present only"
    elif verdict == "PARTIAL":
        trace_status = "links incomplete — see gaps"
    else:
        trace_status = "see gaps"
    chain_trs = "\n".join([
        f"<tr><td>SOURCE edition + span</td><td>{esc(edition)}; verses {esc(verses)} excerpt</td><td>{esc(ed_status)}; span {esc(str(ass.get('source_span_verified', 'UNKNOWN')))}</td></tr>",
        f"<tr><td>LAYERS</td><td>shas below; song-file paths</td><td>{esc(', '.join(sorted({str((v or {}).get('status')) for v in layers.values() if isinstance(v, dict)})))}</td></tr>",
        f"<tr><td>GATE deterministic</td><td>{esc(', '.join(cg.get('blocking', []) or ['none']))}</td><td>{esc(cg.get('deterministic_gate', 'UNKNOWN'))}</td></tr>",
        f"<tr><td>FORMAL theorems</td><td>registry references, run_bound false</td><td>{esc(formal.get('status', 'UNKNOWN'))}</td></tr>",
        f"<tr><td>TRACE bundle</td><td><code>{esc(bundle_sha[:16])}…</code></td><td>{esc(verdict)} ({esc(trace_status)})</td></tr>",
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
         "isBasedOn": {"@type": "CreativeWork", "name": edition,
                       **({"sameAs": src_record_url} if src_record_url else {})},
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
<meta name="citation_author" content="Svatantrya Reader">{noindex}
<meta property="og:title" content="{esc(work)} {esc(verses)} — gate, count and verifiability">
<meta property="og:type" content="article">
<meta property="og:url" content="{ORIGIN}/claim/{esc(work)}/{esc(target)}/">
<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False, sort_keys=True)}</script>
</head><body>
<nav aria-label="Breadcrumb"><a href="{ORIGIN}/">Svatantrya Reader</a> › <a href="{ORIGIN}/work/{esc(work)}/">{esc(work)}</a> › {esc(target)}</nav>
<main>
<p class="answer" id="answer">{esc(answer)}</p>
{hold_banner}
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
<li>That any translation is correct — matching bytes never prove correctness{"; no English is quoted on this page" if not reading else ", and the rendering above is an unreviewed machine draft"}.</li>
<li>That a human reviewed anything — review {esc(review_state)}, publication NOT_AUTHORIZED.</li>
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
song proof {esc(sp.get('file') or '')}: {esc(sp.get('sha256') or '')}  {esc(sp.get('status') or '')} ({esc(str(sp.get('warnings') or 0))} warnings)
trace bundle traces/{esc(work)}-{esc(target)}.json: {esc(bundle_sha)}
verify pack artifacts (bytes):
{esc(art_lines)}</pre>

<h2 id="chain">Chain</h2>
<table><thead><tr><th>Hop</th><th>Value</th><th>Status</th></tr></thead><tbody>
{chain_trs}
</tbody></table>

<h2>Cite this</h2>
<p>Svatantrya Reader, “{esc(work)} {esc(target)} ({esc(verses)})”, <code>{ORIGIN}/claim/{esc(work)}/{esc(target)}/</code>, version <code>trace {esc(bundle_sha)}</code> (full sha256 of the trace bundle). Retrieve and re-verify: <code>curl -s {ORIGIN}/data/traces/{esc(work)}-{esc(target)}.json | sha256sum</code> must print this digest. {esc(credit)}The URL serves the live version; the digest pins the cited bytes. There is no archival resolver: the digest is integrity evidence, not durable storage or scholarly validation. “Complete” means links present — not approval, proof, or witness verification.</p>

<h2>Related</h2>
<ul>
{chr(10).join(rels)}
</ul>

<h2>Provenance</h2>
<ul>
<li>Edition: <code>{esc(edition)}</code> ({esc(ed_status)}). Source record: {esc(src_record_url or "unrecorded")} (status: {esc(src_status)}). Licence: {esc(src_licence or "unestablished — consult the edition source; do not redistribute")}. A hash is not a licence.</li>
<li>Ledger: <code>{esc(ledger)}</code> (translation-work lane; read-only from here).</li>
<li>Generated by <code>tools/emit_claim_pages.py</code> from byte-verified trace + pack (every file hashed against trace and manifest by role). Regenerates byte-identically or fails closed.</li>
</ul>
</main>
</body></html>
"""


def build_md(work: str, target: str, verses: str, answer: str, verse: str,
             reading: list | None, read_note: str, hold: dict | None,
             review_state: str,
             rows: list[tuple[str, str, str]]) -> str:
    trs = "\n".join(f"| {c} | {s} | {b} |" for c, s, b in rows)
    warn = (f"\n> Machine rendering — {review_state}, not an approved "
            f"translation. No English here was human-reviewed.\n")
    if hold:
        warn += (f"\n> Editorial hold: {hold.get('note', '')} "
                 f"English withheld until: {hold.get('review', 'review')}.\n")
    if reading:
        l2_sec = "\n## Reading (machine draft, verse-mapped)\n\n" + "\n".join(
            f"**{vid}** — {t}" for vid, t in reading) + "\n"
    else:
        l2_sec = (f"\n## Reading\n\nWithheld. {read_note}\n" if not hold else
                  "\n## Reading\n\nWithheld under editorial hold (see above).\n")
    return (f"# {work} {target} ({verses})\n\n{answer}\n{warn}\n"
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
    holds = load_holds()
    sources = load_sources()
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
        # F03: byte-verify every input by role and identity before rendering
        blobs, reason = verify_inputs(
            key, doc, man, e.get("sha256") or "", VERIFY / key)
        if reason:
            failures.append(reason)
            continue
        try:
            verse = blobs["source.txt"].decode("utf-8")
        except UnicodeDecodeError:
            failures.append(f"{key}: source.txt not utf-8")
            continue
        if "```" in verse:
            failures.append(f"{key}: verse contains code fence; refusing")
            continue
        hold = holds.get(work)
        if hold and "english" in (hold.get("scope") or []):
            reading, read_note = None, "editorial hold"
        else:
            reading, read_note = verified_reading(blobs, verse)
        if reading and any("```" in t for _, t in reading):
            failures.append(f"{key}: reading contains code fence; refusing")
            continue
        sibs = [x.get("target") for x in by_work[work]]
        i = sibs.index(target)
        prev = sibs[i - 1] if i > 0 else None
        nxt = sibs[i + 1] if i + 1 < len(sibs) else None
        try:
            page = build_claim_page(work, target, doc, man, verse, reading,
                                    read_note, hold, sources.get(work),
                                    prev, nxt, e.get("sha256") or "")
        except ValueError as ex:
            failures.append(f"{key}: {ex}")
            continue
        verses = (doc.get("source", {}) or {}).get("verses") or target
        answer = answer_for(work, verses, doc)
        review_state = str((doc.get("assurance", {}) or {}).get(
            "review", "UNREVIEWED"))
        rendered[f"claim/{work}/{target}/index.html"] = page
        rendered[f"claim/{work}/{target}/index.md"] = build_md(
            work, target, verses, answer, verse, reading, read_note, hold,
            review_state, claim_rows(doc))
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
                verses = (d.get("source", {}) or {}).get("verses") or x.get("target")
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
        print("emit claim pages --check: " + ("GREEN" if ok else "RED"))
        return 0 if ok else 1
    for name, blob in rendered.items():
        dst = ROOT / name
        dst.parent.mkdir(parents=True, exist_ok=True)
        dst.write_text(blob, encoding="utf-8")
    print(f"published {len(entries)} claim pages (+md mirrors, "
          f"{len(by_work)} work indexes, chain pages)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
