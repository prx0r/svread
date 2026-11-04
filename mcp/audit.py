#!/usr/bin/env python3
"""audit.py — reasoning-chain gate for drafts. Stdlib only.

Every claim traceable or refused (adapted from LucaAmerio's lit-review
non-negotiables + TADDLE's defect taxonomy as a self-gate):

- no chunk cited without a hash check (projection verify)
- no quote without a verbatim match in a cited source (quote + location)
- no citation marker without a supplied source (invented citations fail)
- no external ref without a retrieval note (low-confidence refused)
- uncited paragraphs warn, never fail
- withheld-work chunks fail (unlicensed use)

Output is a receipt: content hash, verifier identity, per-check results,
verdict. The receipt plus sign-off is the signature chain: who (account),
what (hash), under which rights, checked by whom.
"""
import hashlib
import json
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


def source_texts(work, target):
    """All quotable bytes for one chunk, joined. Raises on withheld/mismatch."""
    _canonical, evidence = _server()
    ev = evidence({"work": work, "target": target})
    bits = [str(ev.get("source", ""))]
    for _layer, value in (ev.get("layers") or {}).items():
        bits.append(json.dumps(value, ensure_ascii=False))
    return " ".join(bits)


def audit(text, refs=None, sources=None, identity="scholar-mcp/audit",
          model=""):
    refs = refs or []
    sources = sources or {}
    if not isinstance(text, str) or not text.strip():
        raise ValueError("Draft text is required")
    checks = []

    def record(name, status, detail=""):
        checks.append({"check": name, "status": status, "detail": detail[:300]})

    chunks = [r for r in refs if isinstance(r, dict) and r.get("kind", "chunk") == "chunk"]
    supplied = {m: s for m, s in (sources.get("markers", {}) or {}).items()
                if isinstance(m, str) and isinstance(s, dict)}

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

    # 3. quotes verify verbatim against cited sources
    pool = " ".join(chunk_texts.values())
    pool += " " + " ".join(str(s.get("text", "")) for s in supplied.values())
    quotes = sorted(set(QUOTE_RE.findall(text)))
    if not quotes:
        record("quotes-verify", "pass", "no quoted spans to check")
    for q in quotes:
        if q.strip() in pool:
            record("quotes-verify", "pass", q[:80])
        else:
            record("quotes-verify", "fail", f"unverified verbatim: {q[:80]}")

    # 4. external refs need a retrieval note
    supplied_ext = {str(x.get("ref", "")) for x in (sources.get("external", []) or [])
                    if isinstance(x, dict) and x.get("ref") and x.get("retrieved")}
    for u in sorted(set(URL_RE.findall(text))):
        if u in supplied_ext:
            record("external-ref", "pass", u[:80])
        else:
            record("external-ref", "fail", f"{u[:80]} lacks a retrieval note (refused)")

    # 5. uncited paragraphs warn
    paras = [p for p in re.split(r"\n\s*\n", text) if p.strip()]
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
            "at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}
