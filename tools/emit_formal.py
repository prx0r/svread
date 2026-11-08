#!/usr/bin/env python3
"""emit_formal.py — publish trika-x's formal registry for external agents.

Writes data/formal.json: what has been formally checked, its scope, what is
gap, and the runs that produced it. Read-only over trika-x.

Honesty rules baked in:
  - Every theorem carries REGISTERED unless a per-declaration run digest is
    bound; MODEL_CHECKED is reserved for that binding (none exist yet).
  - KEY entries are counts (tradition's numbers), not derived results.
  - Gap counts are reported, never smoothed into a coverage percentage claim.
  - Axiom audit is the STATIC half only; the kernel verdict needs the pinned
    Lean toolchain and is not asserted here.
Fail-closed: EVIDENCE.json unreadable or empty => non-zero, no write.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TRIKA = Path(os.environ.get("TRIKA_X_ROOT", "/root/trika-x"))
EV = TRIKA / "formal-trika" / "EVIDENCE.json"
SNAP = TRIKA / "formal-trika" / "bridge" / "passages.snapshot.json"
RUNS = TRIKA / "formal-trika" / "runs" / "runs.jsonl"
OUT = ROOT / "data" / "formal.json"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true")
    a = ap.parse_args()
    try:
        ev = json.loads(EV.read_text(encoding="utf-8"))
    except (OSError, ValueError) as e:
        print(f"emit_formal: EVIDENCE unreadable ({e})", file=sys.stderr)
        return 2
    entries = ev.get("entries") or {}
    if not entries:
        print("emit_formal: zero entries; refusing", file=sys.stderr)
        return 2

    kinds: dict[str, int] = {}
    chunks: dict[str, list] = {}
    out_entries = {}
    for thm, e in entries.items():
        k = e.get("kind", "?")
        kinds[k] = kinds.get(k, 0) + 1
        locs = [c.get("locator") for c in (e.get("chunks") or [])
                if c.get("locator")]
        for loc in locs:
            chunks.setdefault(loc, []).append(thm)
        out_entries[thm] = {
            "kind": k,
            "chunks": e.get("chunks", []),
            "r_sources": e.get("r_sources", []),
            "status": ("REGISTERED (registry reference only; "
            "no per-declaration run digest bound)"),
        }

    covered = set(chunks)
    all_chunks = set()
    try:
        snap = json.loads(SNAP.read_text(encoding="utf-8"))
        for w in (snap.get("works") or {}).values():
            for p in (w.get("passages") or []):
                if p.get("locator"):
                    all_chunks.add(p["locator"])
    except (OSError, ValueError):
        pass

    runs = []
    try:
        for line in RUNS.read_text(encoding="utf-8").splitlines():
            if line.strip():
                runs.append(json.loads(line))
    except (OSError, ValueError):
        pass

    doc = {
        "format": "trika-formal-registry/1",
        "counts": {
            "theorems": len(entries),
            "exemptions": len(ev.get("exemptions") or []),
            "by_kind": kinds,
            "chunks_referenced": len(covered),
            "chunks_in_snapshot": len(all_chunks),
            "chunks_unformalized": len(all_chunks - covered) if all_chunks else None,
        },
        "scope_statement": (
            "REGISTERED means the entry exists in EVIDENCE.json pointing at "
            "chunk locators; it does not prove the doctrine, certify a successful "
            "run, certify a translation, or validate the encoding of "
            "text into premises. MODEL_CHECKED is reserved for entries with "
            "a verifiable declaration-specific successful run bound to "
            "statement + toolchain + artifact digest; this registry "
            "currently binds none. KEY entries recite the tradition's "
            "counts; they are data, not derivations. R-tier (reconstructed) "
            "rules never promote themselves to T (textual)."),
        "evidence_rules": [
            "Every theorem has an EVIDENCE entry pointing at chunk locators.",
            "Registry references are not source-to-theorem entailments.",
            "Witnesses are UNPINNED corpus-wide; no siglum is invented.",
        ],
        "entries": dict(sorted(out_entries.items())),
        "gaps": {
            "unformalized_chunks": sorted(all_chunks - covered)[:200] if all_chunks else [],
            "note": "This list is the formalisation queue, in priority order.",
        },
        "runs": {
            "count": len(runs),
            "latest": ({
                "at": runs[-1].get("at"),
                "rev": runs[-1].get("rev"),
                "harnesses": {k: v.get("exit") for k, v
                              in (runs[-1].get("harnesses") or {}).items()},
            } if runs else None),
        },
        "verify_yourself": {
            "trace_index": "/data/traces/index.json",
            "verify_index": "/data/verify/index.json",
            "recipe": "VERIFY.md — fetch + sha256sum, no code",
        },
    }
    blob = (json.dumps(doc, ensure_ascii=False, sort_keys=True, indent=1)
            + "\n").encode()
    if a.check:
        if not OUT.exists() or OUT.read_bytes() != blob:
            print("emit_formal --check: RED (regenerate)")
            return 1
        print("emit_formal --check: GREEN")
        return 0
    OUT.write_bytes(blob)
    print(f"published data/formal.json ({len(entries)} theorems, "
          f"{len(covered)}/{len(all_chunks) or '?'} chunks referenced)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
