#!/usr/bin/env python3
"""emit_readability.py — one honest audit: catalogue vs retrievable text.

Builds data/readability.json from svread's own checked-in files only:
traces index, per-work reader bundles, scholar index/projections, work
pages, claim pages, preview index. No network, no sibling repos.

For every work known to any surface, records: trace verdicts, bundle
n/n_pass, scholar versions, work page + claim page presence, preview
presence, and a one-line status an AI can quote (e.g. "catalogued with
Sanskrit excerpts; English withheld BLOCKED; UNREVIEWED preview live").

Deterministic, --check byte-compares. Never fails closed on a missing
optional surface; records it as absent.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FORMAT = "svread-readability/1"

# Works the reader itself refuses (see projection() in mcp/scholar_server.py).
# Their bundle may look complete, but the live API withholds them; the audit
# must say so rather than report a text that cannot be retrieved.
WITHHELD = {
    "ghatakarpara": "source alignment needs upstream repair",
}


def load(p: Path, default=None):
    try:
        return json.loads(p.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return default


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true")
    a = ap.parse_args()

    tdx = load(ROOT / "data" / "traces" / "index.json", {}) or {}
    entries = tdx.get("entries", []) or []
    by_work: dict[str, list[dict]] = {}
    for e in entries:
        if isinstance(e, dict) and e.get("work"):
            by_work.setdefault(e["work"], []).append(e)

    scholar_idx = load(ROOT / "data" / "scholar" / "index.json", {}) or {}
    preview_idx = load(ROOT / "data" / "preview" / "index.json", {}) or {}
    preview_works = set((preview_idx.get("works", {}) or {}).keys())

    biblio = load(ROOT / "data" / "biblio.json", {}) or {}
    bib_rows = {w.get("id") or w.get("work"): w for w in (biblio.get("works") or [])
                if isinstance(w, dict)}
    # The audited universe is traces + scholar projections + reader bundles.
    # A work with a served bundle (biblio has_reader) must appear even when
    # it has no traces or projection yet — otherwise the audit undercounts
    # what the reader can actually serve (svacchandatantra precedent).
    bundle_works = {wid for wid, w in bib_rows.items() if w.get("has_reader")}

    works: dict[str, dict] = {}
    for work in sorted(set(list(by_work) + list(scholar_idx) + list(bundle_works))):
        tlist = by_work.get(work, [])
        verdicts = {}
        for e in tlist:
            v = e.get("verdict") or "UNKNOWN"
            verdicts[v] = verdicts.get(v, 0) + 1
        bundle = load(ROOT / "data" / f"{work}.json", None)
        # Two bundle schemas coexist and both serve the reader (app.js reads
        # chunks and verses): the chunk index ({chunks:[...]}) and the full
        # verse bundle ({verses:[...]}). A bundle exists if either is non-empty.
        rows = []
        if isinstance(bundle, dict):
            if isinstance(bundle.get("chunks"), list) and bundle["chunks"]:
                rows = bundle["chunks"]
            elif isinstance(bundle.get("verses"), list) and bundle["verses"]:
                rows = bundle["verses"]
        if rows:
            n = len(rows)
            n_pass = sum(1 for c in rows
                         if isinstance(c, dict) and (c.get("l2") or "").strip())
            bundle_info = {"exists": True, "n": n, "n_pass": n_pass}
        else:
            bundle_info = {"exists": False, "n": len(tlist), "n_pass": 0}
        sch = scholar_idx.get(work, {})
        work_page = (ROOT / "work" / work / "index.html").exists()
        claim_dir = ROOT / "claim" / work
        claim_pages = sorted(p.name for p in claim_dir.iterdir()
                             if p.is_dir()) if claim_dir.is_dir() else []
        has_preview = work in preview_works
        bib = bib_rows.get(work, {})
        if work in WITHHELD:
            status = f"withheld by the reader: {WITHHELD[work]}"
        elif bundle_info["exists"] and bundle_info["n_pass"] >= bundle_info["n"] \
                and bundle_info["n"] > 0:
            status = (f"readable now: {bundle_info['n_pass']}/{bundle_info['n']} "
                      f"passages with verified English")
        elif has_preview:
            status = (f"catalogued with Sanskrit excerpts; verified English "
                      f"{bundle_info['n_pass']}/{bundle_info['n']}; "
                      f"UNREVIEWED machine preview live in "
                      f"data/preview/{work}.json")
        elif bundle_info["exists"]:
            status = (f"catalogued with Sanskrit excerpts; English withheld "
                      f"({bundle_info['n_pass']}/{bundle_info['n']} verified); "
                      f"no preview bound yet")
        elif tlist:
            status = ("in trace index only; no reader bundle yet; "
                      "Sanskrit + status via trace JSON")
        else:
            status = "scholar record only; no traces or bundle yet"
        works[work] = {
            "traces": {"total": len(tlist), "verdicts": verdicts},
            "bundle": bundle_info,
            "scholar": {"indexed": work in scholar_idx,
                        "versions": (sch or {}).get("versions", 0),
                        "reviews": (sch or {}).get("reviews", 0),
                        "signoffs": (sch or {}).get("signoffs", 0)},
            "work_page": work_page,
            "claim_pages": len(claim_pages),
            "preview": has_preview,
            "withheld": work in WITHHELD,
            "biblio": {"has_reader": bool(bib.get("has_reader")),
                       "passages": bool(bib.get("passages")),
                       "has_projection": bool(bib.get("has_projection"))} if bib else {},
            "status": status,
        }
    gaps = sorted([w for w, r in works.items()
                   if w in WITHHELD or r["bundle"]["n_pass"] < r["bundle"]["n"]])
    doc = {
        "format": FORMAT,
        "note": ("catalogue is not text: a listed work may carry Sanskrit "
                 "excerpts with English withheld (BLOCKED). 'readable now' "
                 "means verified English in data/<work>.json; 'preview' means "
                 "UNREVIEWED machine prose in data/preview/<work>.json with "
                 "gates unchanged. Verify by re-hashing trace + pack bytes."),
        "counts": {"works": len(works),
                   "fully_verified": sum(1 for w, r in works.items()
                                         if w not in WITHHELD
                                         and r["bundle"]["exists"] and r["bundle"]["n"] > 0
                                         and r["bundle"]["n_pass"] >= r["bundle"]["n"]),
                   "with_preview": sum(1 for r in works.values() if r["preview"]),
                   "withheld": sum(1 for w in works if w in WITHHELD),
                   "withheld_or_partial": len(gaps)},
        "gaps": gaps,
        "works": works,
    }
    blob = json.dumps(doc, ensure_ascii=False, sort_keys=True, indent=1) + "\n"
    dst = ROOT / "data" / "readability.json"
    if a.check:
        if not dst.exists() or dst.read_text(encoding="utf-8") != blob:
            print("mismatch or missing: data/readability.json")
            print("emit readability --check: RED")
            return 1
        print("emit readability --check: GREEN")
        return 0
    dst.write_text(blob, encoding="utf-8")
    print(f"published data/readability.json ({len(works)} works, "
          f"{len(gaps)} with withheld/partial English)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
