#!/usr/bin/env python3
"""claims.py — minimal essay-claim/evidence table (revision-bound).

One record per cited paragraph: claim type (quotation vs argument),
which markers it cites, and whether each link is CURRENT or STALE against
the recorded essay/source revisions. Interpretive disagreement is reviewable,
never an auto-fail: statuses are UNASSESSED/CITED/UNCITED + CURRENT/STALE.
No entailment judgment, no signature, no peer-review claim.

Scope: essay-claim/1. Stdlib only.
"""
from __future__ import annotations

import hashlib
import re

from audit import MARKER_RE, QUOTE_RE

CLAIM_TYPES = ("quotation", "argument", "historical", "interpretive",
               "open_question")
LINK_STATUSES = ("CURRENT", "STALE", "UNRESOLVED")


def _sha(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def link(text: str, refs=None, essay_rev: str = "",
         source_revs: dict | None = None) -> dict:
    """Build a claim table for the exact text revision given.

    refs: [{"kind":"chunk","work":...,"target":...}] chunk refs; markers of the
    form [A]/[M1] resolve against sources["markers"] supplied alongside (see
    audit.audit for the marker contract). source_revs maps marker-or-chunk key
    ("work:target" or supplied marker) to the content hash it was checked at.
    """
    if not isinstance(text, str) or not text.strip():
        raise ValueError("Draft text is required")
    refs = refs or []
    source_revs = source_revs or {}
    essay_sha = _sha(text)
    chunks = {(r.get("work"), r.get("target")) for r in refs
              if isinstance(r, dict) and r.get("kind", "chunk") == "chunk"
              and r.get("work") and r.get("target")}
    claims = []
    for i, para in enumerate([p for p in re.split(r"\n\s*\n", text) if p.strip()]):
        markers = sorted(set(MARKER_RE.findall(para)))
        quotes = sorted(set(QUOTE_RE.findall(para)))
        ctype = "quotation" if quotes else "argument"
        links = []
        for m in markers:
            key = m if ":" not in m else m
            recorded = source_revs.get(m, source_revs.get(key))
            if recorded is None:
                status = "UNRESOLVED"
            else:
                status = "CURRENT"
            links.append({"marker": m, "status": status,
                          "recorded_rev": recorded,
                          "resolves_chunk": any(f"{w}:{t}" == m for w, t in chunks)})
        claims.append({"para": i, "type": ctype,
                       "citation": "CITED" if markers else "UNCITED",
                       "markers": markers, "quotes": [q[:120] for q in quotes],
                       "links": links, "assessment": "UNASSESSED"})
    return {"format": "essay-claim/1", "essay_rev": essay_rev or essay_sha,
            "essay_sha256": essay_sha, "claims": claims,
            "unresolved": sum(1 for c in claims for l in c["links"]
                              if l["status"] == "UNRESOLVED")}


def check_stale(record: dict, text: str, source_revs: dict | None = None) -> dict:
    """Re-resolve a stored table against current revisions.

    Essay text change → essay STALE (prior approvals target the old snapshot).
    Per-link source rev change → that link STALE. Nothing auto-fails.
    """
    if not isinstance(record, dict) or record.get("format") != "essay-claim/1":
        raise ValueError("not an essay-claim/1 record")
    source_revs = source_revs or {}
    current_sha = _sha(text)
    essay_stale = current_sha != record.get("essay_sha256")
    out_links = stale = 0
    claims = []
    for c in record.get("claims", []):
        links = []
        for l in c.get("links", []):
            now = source_revs.get(l["marker"])
            if now is None:
                status = l["status"]
            elif now != l.get("recorded_rev"):
                status = "STALE"
            else:
                status = l["status"]
            if status == "STALE":
                stale += 1
            out_links += 1
            links.append({**l, "status": status})
        claims.append({**c, "links": links})
    return {"essay_stale": essay_stale,
            "essay_sha256_then": record.get("essay_sha256"),
            "essay_sha256_now": current_sha,
            "stale_links": stale, "links": out_links, "claims": claims}
