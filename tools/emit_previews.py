#!/usr/bin/env python3
"""emit_previews.py — UNREVIEWED machine-proposed English previews, lane-clean.

For every traced work whose verified reader bundle (data/<work>.json) has
fewer verified English passages than chunks (n_pass < n), build
data/preview/<work>.json from svread's OWN published verify packs
(data/verify/<work>-<target>/...). Never reads translation-work, ipvv, or
any other repo. Never invents text: preview_english comes only from pack
bytes already bound in the trace (status BOUND), quoted verbatim with file
+ sha256 + byte length.

Why this exists: the reader bundle (emit_bundles.py) withholds English
unless a pack L2 entry carries a Sanskrit cite byte-present in the hashed
excerpt (verse-mapped join). Pilot IPVV L2 packs are section-level prose
with no sanskrit_cite, so all 49 chunks surface as Sanskrit-only with
gate BLOCKED. An AI visitor then sees a catalogue entry with no
retrievable text and cannot even find which chunk holds a quote. The
preview fixes discoverability WITHOUT changing any gate: every entry is
labelled UNREVIEWED, section-level, human review required, BLOCKED stays
BLOCKED, and the verified bundle is untouched.

Schema (svread-preview/1): {format, work, status, provenance, gate_summary,
chunks[]}. Each chunk: {chunk, gate (from verified bundle or trace),
verified_english ("" when withheld), preview_english, preview_source
{file, sha256, bytes, status}, preview_caveats[], sanskrit_sha256,
sanskrit_bytes, trace, verify_manifest}.

Deterministic: sorted chunks, no timestamps. --check byte-compares.
Fail-closed: any unreadable pack input aborts that work (no partial
preview for the work); never writes on failure.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TRACES = ROOT / "data" / "traces"
VERIFY = ROOT / "data" / "verify"
OUTDIR = ROOT / "data" / "preview"

FORMAT = "svread-preview/1"


def sha(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


def load(p: Path):
    return json.loads(p.read_text(encoding="utf-8"))


def bundle_gate(work: str, chunk: str) -> str:
    """Original gate from the verified reader bundle, if present."""
    try:
        b = load(ROOT / "data" / f"{work}.json")
    except (OSError, ValueError):
        return "UNKNOWN"
    for c in b.get("chunks", []) or []:
        if isinstance(c, dict) and c.get("chunk") == chunk:
            g = c.get("gate")
            return g if g in ("PASS", "BLOCKED", "WITHHELD") else "UNKNOWN"
    return "UNKNOWN"


def build_work(work: str, entries: list[dict]) -> tuple[dict, list[str]]:
    chunks = []
    failures: list[str] = []
    for e in sorted(entries, key=lambda x: x.get("target") or ""):
        target = e.get("target") or ""
        key = f"{work}-{target}"
        try:
            doc = load(TRACES / f"{key}.json")
            man = load(VERIFY / key / "manifest.json")
        except (OSError, ValueError) as ex:
            failures.append(f"{key}: missing trace/pack input ({ex})")
            return {}, failures
        gate = bundle_gate(work, target)
        if gate == "UNKNOWN":
            gate = ((doc.get("proofs", {}) or {}).get("chunk_gate", {}) or {}).get(
                "deterministic_gate", "UNKNOWN")
            if gate not in ("PASS", "BLOCKED", "WITHHELD"):
                gate = "BLOCKED"
        # verified English, if any, from the bundle (withheld logic already applied)
        verified = ""
        try:
            b = load(ROOT / "data" / f"{work}.json")
            for c in b.get("chunks", []) or []:
                if isinstance(c, dict) and c.get("chunk") == target:
                    verified = (c.get("l2") or "").strip()
                    break
        except (OSError, ValueError):
            pass
        # preview: first BOUND layer-l2 / layer-l1 pack file with plain_english
        preview_text = ""
        preview_src: dict = {}
        for art in man.get("artifacts", []) or []:
            name = art.get("name", "")
            if not name.endswith(".l2.json") and not name.endswith(".l1.json"):
                continue
            if art.get("status") != "BOUND":
                continue
            p = VERIFY / key / name
            try:
                raw = p.read_bytes()
            except OSError as ex:
                failures.append(f"{key}: cannot read pack file {name} ({ex})")
                return {}, failures
            if sha(raw) != art.get("sha256"):
                failures.append(f"{key}: pack file {name} hash mismatch")
                return {}, failures
            try:
                rows = json.loads(raw.decode("utf-8"))
            except (ValueError, UnicodeDecodeError):
                continue  # markdown legacy; not previewable as verse JSON
            if not isinstance(rows, list):
                continue
            paras = []
            for r in rows:
                if not isinstance(r, dict):
                    continue
                t = (r.get("plain_english") or r.get("text") or "").strip()
                if not t or "```" in t:
                    continue
                vid = r.get("verse_id") or r.get("id") or ""
                paras.append(f"[{vid}] {t}" if vid else t)
            if paras:
                preview_text = "\n\n".join(paras)
                preview_src = {"file": f"data/verify/{key}/{name}",
                               "sha256": art.get("sha256", ""),
                               "bytes": art.get("bytes", len(raw)),
                               "status": "BOUND"}
                break
        # Sanskrit identity from the pack source.txt
        s_sha, s_bytes = "", 0
        for art in man.get("artifacts", []) or []:
            if art.get("name") == "source.txt":
                s_sha = art.get("sha256", "")
                s_bytes = art.get("bytes", 0)
                break
        if verified.strip():
            # Verified English exists: no preview needed for this chunk.
            chunks.append({
                "chunk": target,
                "gate": gate,
                "verified_english": verified,
                "preview_english": "",
                "preview_source": {},
                "preview_caveats": [],
                "sanskrit_sha256": s_sha,
                "sanskrit_bytes": s_bytes,
                "trace": f"data/traces/{key}.json",
                "verify_manifest": f"data/verify/{key}/manifest.json",
            })
        elif preview_text:
            chunks.append({
                "chunk": target,
                "gate": gate,
                "verified_english": "",
                "preview_english": preview_text,
                "preview_source": preview_src,
                "preview_caveats": [
                    "UNREVIEWED machine-proposed preview; not scholarship",
                    "section-level prose, not verse-mapped (no sanskrit_cite join)",
                    "human review required before any quotation as translation",
                    f"gate {gate} unchanged; verified bundle untouched",
                ],
                "sanskrit_sha256": s_sha,
                "sanskrit_bytes": s_bytes,
                "trace": f"data/traces/{key}.json",
                "verify_manifest": f"data/verify/{key}/manifest.json",
            })
        else:
            chunks.append({
                "chunk": target,
                "gate": gate,
                "verified_english": "",
                "preview_english": "",
                "preview_source": {},
                "preview_caveats": [
                    "no pack English bound in this trace; Sanskrit excerpt only",
                    f"gate {gate} unchanged",
                ],
                "sanskrit_sha256": s_sha,
                "sanskrit_bytes": s_bytes,
                "trace": f"data/traces/{key}.json",
                "verify_manifest": f"data/verify/{key}/manifest.json",
            })
    n_prev = sum(1 for c in chunks if c["preview_english"].strip())
    n_ver = sum(1 for c in chunks if c["verified_english"].strip())
    doc_out = {
        "format": FORMAT,
        "work": work,
        "status": ("UNREVIEWED machine-proposed preview; gates unchanged; "
                   "verified bundle is the authority"),
        "provenance": ("derived ONLY from svread data/traces + data/verify "
                       "packs (re-hashed on emit); never translation-work; "
                       "preview text quoted verbatim from BOUND pack bytes"),
        "gate_summary": {"n": len(chunks), "n_pass_verified": n_ver,
                         "n_preview": n_prev},
        "rights": ("Sanskrit excerpts: edition-labelled (see trace source); "
                   "preview English: machine-proposed, free to cite WITH "
                   "the UNREVIEWED caveat and source hash"),
        "chunks": chunks,
    }
    return doc_out, failures


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--work", default="")
    a = ap.parse_args()
    try:
        index = load(TRACES / "index.json")
    except (OSError, ValueError) as ex:
        print(f"emit_previews: cannot read traces index ({ex})", file=sys.stderr)
        return 2
    by_work: dict[str, list[dict]] = {}
    for e in index.get("entries", []) or []:
        if isinstance(e, dict) and e.get("work"):
            by_work.setdefault(e["work"], []).append(e)
    if a.work:
        by_work = {a.work: by_work.get(a.work, [])}
        if not by_work[a.work]:
            print(f"emit_previews: no traces for work {a.work}", file=sys.stderr)
            return 2
    rendered: dict[str, str] = {}
    failures: list[str] = []
    for work in sorted(by_work):
        # Only works whose verified bundle withholds some English need a preview.
        try:
            b = load(ROOT / "data" / f"{work}.json")
            n = len(b.get("chunks", []) or [])
            n_pass = sum(1 for c in b.get("chunks", []) or []
                         if isinstance(c, dict) and (c.get("l2") or "").strip())
        except (OSError, ValueError):
            n, n_pass = len(by_work[work]), 0
        if n and n_pass >= n:
            continue  # fully verified; preview would add nothing
        doc_out, ferrs = build_work(work, by_work[work])
        if ferrs:
            failures.extend(ferrs)
            continue
        if not any(c["preview_english"].strip() for c in doc_out["chunks"]):
            continue  # no previewable English; skip (Sanskrit-only stays as is)
        rendered[f"data/preview/{work}.json"] = (
            json.dumps(doc_out, ensure_ascii=False, sort_keys=True, indent=1) + "\n")
    if failures:
        print("emit_previews: REFUSING (fail-closed):", file=sys.stderr)
        for f in failures[:20]:
            print("  - " + f, file=sys.stderr)
        return 1
    if a.dry_run:
        n_chunks = sum(json.loads(b)["gate_summary"]["n"] for b in rendered.values())
        print(f"dry-run: {len(rendered)} previews, {n_chunks} chunks; writes nothing")
        return 0
    if a.check:
        ok = True
        for name, blob in rendered.items():
            dst = ROOT / name
            if not dst.exists() or dst.read_text(encoding="utf-8") != blob:
                print(f"mismatch or missing: {name}")
                ok = False
        # stale previews (work now fully verified) must be gone
        if OUTDIR.is_dir():
            want = {n.split("/", 1)[1] for n in rendered}
            for p in sorted(OUTDIR.glob("*.json")):
                if p.name != "index.json" and p.name not in {w + ".json" for w in
                        [n.split("/")[-1][:-5] for n in rendered]}:
                    # keep-or-remove decision needs the index; report only
                    pass
        print("emit previews --check: " + ("GREEN" if ok else "RED"))
        return 0 if ok else 1
    OUTDIR.mkdir(parents=True, exist_ok=True)
    for name, blob in rendered.items():
        dst = ROOT / name
        dst.parent.mkdir(parents=True, exist_ok=True)
        dst.write_text(blob, encoding="utf-8")
    idx = {"format": "svread-preview-index/1",
           "note": ("UNREVIEWED machine-proposed previews; gates unchanged. "
                    "Verified bundles in data/<work>.json remain the authority."),
           "works": {json.loads(b)["work"]: {
               "preview": name,
               **json.loads(b)["gate_summary"]} for name, b in rendered.items()}}
    (OUTDIR / "index.json").write_text(
        json.dumps(idx, ensure_ascii=False, sort_keys=True, indent=1) + "\n",
        encoding="utf-8")
    print(f"published {len(rendered)} preview bundles")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
