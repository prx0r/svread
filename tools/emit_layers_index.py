#!/usr/bin/env python3
"""emit_layers_index.py — index of the canonical translation-work layer corpus.

The layer text lives in translation-work (another lane; read-only from here).
This emitter builds ONE deterministic map so ChatGPT and the site can answer
"which layers exist for which passages, with what hashes and status" without
guessing paths:

  data/layers-index.json  {format, works[], bundles{}, counts{}, provenance{}}

Per work dir: songs with per-layer {file, sha256, bytes, rows}, verse-id
unions, passages.jsonl {rows, sha256, locators}, REGISTRY status row,
STATUS.json counts/needs, and the site bundle name when data/<dir>.json exists.

Fail-closed: no translation-work checkout, no REGISTRY, or empty result =
non-zero exit with NO writes (never ship a stale index). Deterministic
(sorted keys/rows). --check verifies without writing. Exit 2 = infrastructure
missing (no checkout) so CI skips with a reason instead of failing.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "layers-index.json"
TW = Path(os.environ.get("TRANSLATION_WORK", "/root/translation-work"))
LAYERS = ("t1", "l0", "argmap", "l2", "l3", "l4", "c1", "c2")


def _rev(path: Path) -> str:
    try:
        return subprocess.run(
            ["git", "-C", str(path), "rev-parse", "--short", "HEAD"],
            capture_output=True, check=True, text=True).stdout.strip()
    except Exception:
        return "UNKNOWN"


def _sha(p: Path) -> str:
    return hashlib.sha256(p.read_bytes()).hexdigest()


def _rows_of(doc) -> int:
    if isinstance(doc, list):
        return len(doc)
    if isinstance(doc, dict) and isinstance(doc.get("essence"), list):
        return len(doc["essence"])
    return 1


def _verse_ids(doc) -> set:
    out = set()
    recs = doc if isinstance(doc, list) else [doc]
    for r in recs:
        if not isinstance(r, dict):
            continue
        v = r.get("verse_id") or r.get("song")
        if isinstance(v, str) and v:
            out.add(v)
    return out


def build() -> dict:
    reg_path = TW / "REGISTRY.json"
    if not TW.is_dir() or not reg_path.exists():
        print("layers-index emit: no translation-work checkout with "
              "REGISTRY.json here; refusing stale write", file=sys.stderr)
        raise SystemExit(2)
    try:
        reg = json.loads(reg_path.read_text(encoding="utf-8"))
    except (OSError, ValueError) as e:
        print(f"layers-index emit: REGISTRY unreadable ({e})", file=sys.stderr)
        raise SystemExit(2)
    reg_rows = {w.get("work"): w for w in (reg.get("works") or [])
                 if isinstance(w, dict) and w.get("work")}

    works = []
    layer_file_totals = {L: 0 for L in LAYERS}
    for d in sorted(p for p in TW.iterdir() if p.is_dir() and (p / "data").is_dir()):
        dd = d / "data"
        files = sorted(dd.glob("*.json"))
        songs: dict[str, dict] = {}
        for f in files:
            parts = f.name.split(".")
            if len(parts) < 3 or parts[-1] != "json" or parts[-2] not in LAYERS:
                continue
            layer = parts[-2]
            song = ".".join(parts[:-2])
            try:
                doc = json.loads(f.read_text(encoding="utf-8"))
            except (OSError, ValueError):
                continue
            e = songs.setdefault(song, {"layers": {}, "verse_ids": set()})
            e["layers"][layer] = {"file": f"data/{f.name}",
                                  "sha256": _sha(f),
                                  "bytes": f.stat().st_size,
                                  "rows": _rows_of(doc)}
            e["verse_ids"] |= _verse_ids(doc)
            layer_file_totals[layer] += 1
        if not songs:
            continue
        for e in songs.values():
            e["verse_ids"] = sorted(e["verse_ids"])
        song_list = [{"song": s, **songs[s]} for s in sorted(songs)]
        pj = dd.parent / "passages.jsonl"
        passages = None
        if pj.exists():
            try:
                rows = [json.loads(line) for line in
                        pj.read_text(encoding="utf-8").splitlines() if line.strip()]
                locs = sorted({str(r.get("locator")) for r in rows
                               if isinstance(r, dict) and r.get("locator")})
                passages = {"file": "passages.jsonl", "sha256": _sha(pj),
                              "rows": len(rows), "locators": locs}
            except (OSError, ValueError):
                pass
        status_path = d / "STATUS.json"
        status = None
        if status_path.exists():
            try:
                s = json.loads(status_path.read_text(encoding="utf-8"))
                status = {"counts": s.get("counts"),
                          "needs": s.get("needs")}
            except (OSError, ValueError):
                pass
        bundle = d.name if (ROOT / "data" / f"{d.name}.json").exists() else None
        reg_row = reg_rows.get(d.name, {})
        works.append({
            "work": d.name,
            "registry_status": reg_row.get("status"),
            "gold": bool(reg_row.get("gold", False)),
            "site_bundle": bundle,
            "songs": song_list,
            "passages": passages,
            "status": status,
        })
    if not works:
        print("layers-index emit: zero layer works; refusing stale write",
              file=sys.stderr)
        raise SystemExit(2)
    bundles: dict[str, list] = {}
    for w in works:
        if w["site_bundle"]:
            bundles.setdefault(w["site_bundle"], []).append(w["work"])
    doc = {"format": "svread-layers-index/1",
           "works": works,
           "bundles": bundles,
           "counts": {"works_with_layers": len(works),
                      "songs": sum(len(w["songs"]) for w in works),
                      "layer_files": layer_file_totals,
                      "with_site_bundle": sum(1 for w in works if w["site_bundle"]),
                      "with_passages": sum(1 for w in works if w["passages"])},
           "provenance": {"translation_work": str(TW),
                          "translation_work_rev": _rev(TW),
                          "registry_sha256": _sha(reg_path),
                          "generated_at": __import__("datetime").datetime.now(
                              __import__("datetime").timezone.utc).strftime(
                              "%Y-%m-%dT%H:%M:%SZ"),
                          "note": ("Read-only map of another lane's canonical "
                                   "files. Hashes identify bytes; a gold flag "
                                   "is machine-proposed unless a human signed "
                                   "it. Missing layers are gaps, not silence.")}}
    return doc


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true")
    a = ap.parse_args()
    try:
        doc = build()
    except SystemExit as e:
        return int(e.code or 0)
    blob = json.dumps(doc, ensure_ascii=False, sort_keys=True,
                      separators=(",", ":")).encode()
    if a.check:
        if not OUT.exists():
            print("layers-index emit --check: data/layers-index.json missing")
            return 1
        cur = json.loads(OUT.read_text(encoding="utf-8"))
        new = json.loads(blob.decode("utf-8"))
        for d in (cur, new):
            d.get("provenance", {}).pop("generated_at", None)
            d.get("provenance", {}).pop("translation_work_rev", None)
        ok = (json.dumps(cur, sort_keys=True) == json.dumps(new, sort_keys=True))
        print("layers-index emit --check: " + ("GREEN" if ok else "RED (regenerate)"))
        return 0 if ok else 1
    OUT.write_bytes(blob)
    digest = hashlib.sha256(blob).hexdigest()
    print(f"emitted data/layers-index.json ({doc['counts']['works_with_layers']} works, "
          f"{doc['counts']['songs']} songs, sha256:{digest[:12]})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
