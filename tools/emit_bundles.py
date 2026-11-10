#!/usr/bin/env python3
"""emit_bundles.py — reader bundles for works that have none, derived ONLY
from byte-verified trace packs (never from translation-work lanes directly).

For every traced work WITHOUT data/<work>.json, builds a reader bundle
{work, n, n_pass, source_edition, pushing, chunks[]} where each chunk
carries the passage excerpt as hashed plus verified pack-derived English
(verse-mapped) or nothing, with gate from the trace. The reader renders
Sanskrit-only wherever English is absent (isReaderPass requires gate PASS
AND non-empty English); held works are marked WITHHELD with the hold reason.

Lane-clean: reads only svread's own published traces + verify packs
(which it re-hashes against trace AND manifest by role, reusing
emit_claim_pages.verify_inputs). Never invents a translation, never touches
another repo, never overwrites a lane-authored bundle. Deterministic:
sorted entries, no timestamps (date "unrecorded" — traces carry none).
--dry-run prints counts, writes nothing. --check byte-compares.
Fails closed: any unverifiable pack aborts the whole emit.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

ROOT = Path(os.environ.get("SVREAD_ROOT") or Path(__file__).resolve().parent.parent)
TRACES = ROOT / "data" / "traces"
VERIFY = ROOT / "data" / "verify"

sys.path.insert(0, str(ROOT / "tools"))
import emit_claim_pages as EC  # noqa: E402  (reuse verified-bytes machinery)


def load_holds() -> dict:
    try:
        d = json.loads((ROOT / "data" / "holds.json").read_text())
    except (OSError, ValueError):
        return {}
    return {h["work"]: h for h in d.get("holds", []) or []
            if isinstance(h, dict) and h.get("work")}


def build_bundle(work: str, items: list[tuple[dict, dict, str]],
                 holds: dict) -> tuple[dict, list[str]]:
    """items: (trace doc, pack manifest, index sha256). Returns bundle or
    failures. All bytes verified inside via EC.verify_inputs."""
    hold = holds.get(work)
    chunks = []
    failures: list[str] = []
    for doc, man, isha in items:
        chunk = (doc.get("chunk", {}) or {}).get("target", "")
        key = f"{work}-{chunk}"
        blobs, reason = EC.verify_inputs(key, doc, man, isha, VERIFY / key)
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
        src = doc.get("source", {}) or {}
        cg = (doc.get("proofs", {}) or {}).get("chunk_gate", {}) or {}
        if hold and "english" in (hold.get("scope") or []):
            lines, note = None, "editorial hold"
            gate = "WITHHELD"
            issue = str(hold.get("note", "English withheld under hold."))
        else:
            lines, note = EC.verified_reading(blobs, verse)
            raw_gate = cg.get("deterministic_gate", "UNKNOWN") or "UNKNOWN"
            if raw_gate in ("PASS", "BLOCKED", "WITHHELD"):
                gate = raw_gate
            else:
                # Manifest + reader vocabularies are closed tri-state; an
                # unrun gate fails closed as BLOCKED and says so.
                gate = "BLOCKED"
            issue = "" if lines else note
        l2 = ""
        if lines:
            if any("```" in t for _, t in lines):
                failures.append(f"{key}: reading contains code fence")
                continue
            l2 = "\n\n".join(f"[{vid}] {t}" for vid, t in lines)
        blocking = list(cg.get("blocking", []) or [])
        if gate == "BLOCKED" and (cg.get("deterministic_gate") or "UNKNOWN") not in ("PASS", "BLOCKED", "WITHHELD"):
            blocking = blocking + ["gate-status-unrecorded-in-trace (treated as BLOCKED in reader)"]
        chunks.append({
            "chunk": chunk,
            "verses": src.get("verses") or chunk,
            "gate": gate,
            "blocking": blocking,
            "model": "svread-pack-derived/1",
            "date": "unrecorded",
            "status": "machine-proposed, unreviewed",
            "sanskrit": verse,
            "l1": "",
            "l2": l2,
            "l3": "",
            "l4": "",
            "c1": "",
            "argmap": "",
            "source_issue": issue,
        })
    edition = ""
    for doc, _, _ in items:
        edition = ((doc.get("source", {}) or {}).get("edition", {}) or {}
                   ).get("label", "") or edition
    bundle = {
        "work": work,
        "n": len(chunks),
        "n_pass": sum(1 for c in chunks if c["l2"].strip()),
        "source_edition": edition or "unrecorded",
        "pushing": [],
        "chunks": chunks,
        "provenance": ("svread-pack-derived/1: every field byte-verified "
                       "against trace + pack manifest; English only where a "
                       "verified pack L2 entry cites Sanskrit present in the "
                       "hashed excerpt. Regenerates byte-identically or fails "
                       "closed."),
    }
    return bundle, failures


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()
    index = json.loads((TRACES / "index.json").read_text())
    entries = sorted(index.get("entries", []),
                     key=lambda e: (e.get("work") or "", e.get("target") or ""))
    if not entries:
        print("emit_bundles: zero entries; refusing empty publish",
              file=sys.stderr)
        return 2
    by_work: dict[str, list[dict]] = {}
    for e in entries:
        by_work.setdefault(e.get("work") or "?", []).append(e)
    holds = load_holds()
    rendered: dict[str, str] = {}
    failures: list[str] = []
    skipped = 0
    for work in sorted(by_work):
        if (ROOT / "data" / f"{work}.json").exists():
            skipped += 1
            continue  # never overwrite lane-authored bundles
        items = []
        ok = True
        for e in by_work[work]:
            key = f"{e.get('work')}-{e.get('target')}"
            try:
                doc = json.loads((TRACES / f"{key}.json").read_text())
                man = json.loads((VERIFY / key / "manifest.json").read_text())
            except (FileNotFoundError, ValueError) as ex:
                failures.append(f"{key}: missing input ({ex})")
                ok = False
                break
            items.append((doc, man, e.get("sha256") or ""))
        if not ok:
            continue
        bundle, ferrs = build_bundle(work, items, holds)
        if ferrs:
            failures.extend(ferrs)
            continue
        rendered[f"data/{work}.json"] = (json.dumps(
            bundle, ensure_ascii=False, sort_keys=True, indent=1) + "\n")
    if failures:
        print("emit_bundles: REFUSING (fail-closed):", file=sys.stderr)
        for f in failures[:20]:
            print("  - " + f, file=sys.stderr)
        return 1
    if a.dry_run:
        n_chunks = sum(json.loads(b)["n"] for b in rendered.values())
        print(f"dry-run: {len(rendered)} new bundles, {n_chunks} chunks "
              f"({skipped} existing untouched); writes nothing")
        return 0
    if a.check:
        ok = True
        for name, blob in rendered.items():
            dst = ROOT / name
            if not dst.exists() or dst.read_text(
                    encoding="utf-8") != blob:
                print(f"mismatch or missing: {name}")
                ok = False
        print("emit bundles --check: " + ("GREEN" if ok else "RED"))
        return 0 if ok else 1
    for name, blob in rendered.items():
        dst = ROOT / name
        dst.parent.mkdir(parents=True, exist_ok=True)
        dst.write_text(blob, encoding="utf-8")
    print(f"published {len(rendered)} reader bundles "
          f"({skipped} existing untouched)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
