#!/usr/bin/env python3
"""audit.py — reasoning-chain gate for drafts. Stdlib only.

Every claim traceable or refused (adapted from LucaAmerio's lit-review
non-negotiables + TADDLE's defect taxonomy as a self-gate):

- no chunk cited without a hash check (projection verify)
- no quote without a verbatim match in a source cited in the same paragraph
- no citation marker without a supplied source (invented citations fail)
- no external ref without a retrieval note (low-confidence refused)
- uncited paragraphs warn, never fail
- withheld-work chunks fail (unlicensed use)

Output is a receipt: content hash, verifier identity, per-check results,
verdict. These checks do not establish entailment, peer review or a digital
signature. User-supplied sources are not independently authenticated.
"""
import hashlib
import re
import time


def _server():
    # Lazy: avoids a circular import when scholar_server loads this module.
    import scholar_server
    return scholar_server.canonical, scholar_server.evidence

MARKER_RE = re.compile(r"\[([A-Za-z0-9][A-Za-z0-9_.:-]{0,159})\]")
QUOTE_RE = re.compile(r"[\"“]([^\"”]{8,400})[\"”]")
URL_RE = re.compile(r"https?://\S+|doi:\S+|arXiv:\S+", re.IGNORECASE)
CHUNK_MARKER_RE = re.compile(r"^([a-z0-9][a-z0-9_-]*):([A-Za-z0-9][A-Za-z0-9_.-]{0,159})$")
QUOTABLE_FIELDS = frozenset({
    "text", "surface", "citation", "sanskrit_cite", "quick_english", "quick_gloss",
    "plain_english", "final_english", "gloss", "grounds", "morph", "reconstruction",
    "reason", "reasoning", "inference", "question", "argument", "summary",
    "lines", "essence", "premises", "uncertainties", "paragraphs",
})


def source_texts(work, target):
    """Actual source/layer text fields, excluding JSON metadata and IDs."""
    _canonical, evidence = _server()
    ev = evidence({"work": work, "target": target})
    bits = []
    def collect(value, field=""):
        if isinstance(value, str):
            if field in QUOTABLE_FIELDS:
                bits.append(value)
        elif isinstance(value, list):
            for item in value:
                collect(item, field)
        elif isinstance(value, dict):
            for key, item in value.items():
                collect(item, key)
    collect(ev.get("source", {}))
    for value in (ev.get("layers") or {}).values():
        collect(value)
    return bits


def audit(text, refs=None, sources=None, identity="scholar-mcp/audit",
          model=""):
    refs = refs or []
    sources = sources or {}
    if not isinstance(text, str) or not text.strip():
        raise ValueError("Draft text is required")
    if not isinstance(refs, list) or not isinstance(sources, dict) or not isinstance(sources.get('markers', {}), dict):
        raise ValueError("References must be a list and sources/markers must be objects")
    checks = []

    def record(name, status, detail=""):
        checks.append({"check": name, "status": status, "detail": detail[:300]})

    chunks = [r for r in refs if isinstance(r, dict) and r.get("kind", "chunk") == "chunk"]
    supplied = {m: s for m, s in (sources.get("markers", {}) or {}).items()
                if isinstance(m, str) and isinstance(s, dict) and
                isinstance(s.get("text"), str) and s["text"].strip()}

    # 1. chunk refs resolve + hash-check
    chunk_texts = {}
    for r in chunks:
        work, target = r.get("work", ""), r.get("target", "")
        try:
            chunk_texts[(work, target)] = source_texts(work, target)
            record("chunk-resolves", "pass", f"{work}:{target}")
        except (ValueError, TypeError, KeyError) as e:
            record("chunk-resolves", "fail", f"{work}:{target}: {e}")

    # 2. markers in text map to a supplied source or a verified chunk
    supplied_markers = set(supplied)
    for m in sorted(set(MARKER_RE.findall(text))):
        if m in supplied_markers:
            record("marker-mapped", "pass", f"[{m}]")
            continue
        cm = CHUNK_MARKER_RE.match(m)
        if cm and (cm.group(1), cm.group(2)) in chunk_texts:
            record("marker-mapped", "pass", f"[{m}]")
            continue
        record("marker-mapped", "fail", f"[{m}] has no supplied source (invented citation?)")

    # 3. A quote can match only an actual text field belonging to a source
    # cited in the same paragraph. Do not pool unrelated chunks or JSON keys.
    paras = [p for p in re.split(r"\n\s*\n", text) if p.strip()]
    checked_quotes = 0
    for para in paras:
        markers = set(MARKER_RE.findall(para))
        candidates = []
        for marker in markers:
            cm = CHUNK_MARKER_RE.match(marker)
            key = (cm.group(1), cm.group(2)) if cm else None
            if key in chunk_texts:
                candidates.extend((marker, passage) for passage in chunk_texts[key])
            elif marker in supplied and isinstance(supplied[marker].get('text'), str):
                candidates.append((marker, supplied[marker]['text']))
        for q in QUOTE_RE.findall(para):
            checked_quotes += 1
            matching = sorted({marker for marker, passage in candidates if q.strip() and q in passage})
            if matching:
                record("quotes-verify", "pass", f"{q[:80]} — [{matching[0]}]")
            else:
                record("quotes-verify", "fail", f"no same-paragraph cited source matches: {q[:80]}")
    if not checked_quotes:
        record("quotes-verify", "pass", "no quoted spans to check")

    # 4. external refs need a retrieval note
    supplied_ext = {str(x.get("ref", "")) for x in (sources.get("external", []) or [])
                    if isinstance(x, dict) and x.get("ref") and x.get("retrieved")}
    for u in sorted(set(URL_RE.findall(text))):
        if u in supplied_ext:
            record("external-ref", "pass", u[:80])
        else:
            record("external-ref", "fail", f"{u[:80]} lacks a retrieval note (refused)")

    # 5. uncited paragraphs warn
    bare = [p for p in paras if not MARKER_RE.search(p) and len(p.split()) > 12]
    if bare:
        record("uncited-paragraphs", "warn", f"{len(bare)} paragraphs carry no citation")
    else:
        record("uncited-paragraphs", "pass", "every substantial paragraph is cited")

    failed = [c for c in checks if c["status"] == "fail"]
    verdict = "FAIL" if failed else "PASS"
    return {"content_sha256": hashlib.sha256(text.encode()).hexdigest(),
            "verifier": identity, "model": model or "",
            "checks": checks, "verdict": verdict,
            "scope": "draft-source-check/2",
            "limitations": ["A match is not proof of entailment, peer review or identity.",
                            "User-supplied source text is not independently authenticated."],
            "at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}
