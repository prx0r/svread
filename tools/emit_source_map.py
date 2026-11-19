#!/usr/bin/env python3
"""emit_source_map.py — keep source-map.json in step with translation-work.

source-map.json is the bridge from svread works to translation-work ledgers
(plus openpatala identity fields). Identity fields are hand-maintained; the
ledger hash and passage count are derived and drift whenever a ledger changes
upstream.

This tool:
  1. adds works that have a ledger in translation-work but no mapping yet
     (identity UNPINNED — an owner/human sets openpatala ids later);
  2. refreshes ledger_sha256 + passages for every mapped work;
  3. never touches any other field.

  python3 tools/emit_source_map.py --check
  python3 tools/emit_source_map.py          # write
"""
from __future__ import annotations

import argparse
import hashlib
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TW = Path("/root/translation-work")
MAP = ROOT / "source-map.json"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true")
    a = ap.parse_args()
    try:
        doc = json.loads(MAP.read_text(encoding="utf-8"))
    except (OSError, ValueError) as e:
        print(f"source-map: unreadable ({e})", file=sys.stderr)
        return 2
    works = doc.setdefault("works", {})
    if not TW.is_dir():
        print("source-map: translation-work checkout absent; nothing to refresh",
              file=sys.stderr)
        return 2

    added = []
    for d in sorted(TW.iterdir()):
        pp = d / "passages.jsonl"
        if not (d.is_dir() and pp.is_file()) or d.name in works:
            continue
        works[d.name] = {
            "ledger": f"{d.name}/passages.jsonl",
            "openpatala_work_key": d.name.split("-")[0],
            "openpatala_work_id": "UNPINNED",
            "witness": "UNPINNED",
            "status": "CANDIDATE-WORK",
        }
        added.append(d.name)

    refreshed = 0
    for work, spec in works.items():
        rel = spec.get("ledger")
        if not isinstance(rel, str):
            continue
        p = TW / rel
        if not p.is_file():
            continue
        raw = p.read_bytes()
        sha = hashlib.sha256(raw).hexdigest()
        rows = sum(1 for line in raw.decode("utf-8", "ignore").splitlines() if line.strip())
        if spec.get("ledger_sha256") != sha:
            spec["ledger_sha256"] = sha
            refreshed += 1
        if spec.get("passages") != rows:
            spec["passages"] = rows
            refreshed += 1

    blob = json.dumps(doc, ensure_ascii=False, sort_keys=True, indent=1) + "\n"
    if a.check:
        ok = MAP.read_text(encoding="utf-8") == blob
        print("emit source-map --check: " + ("GREEN" if ok else "RED"))
        return 0 if ok else 1
    if added or refreshed or MAP.read_text(encoding="utf-8") != blob:
        MAP.write_text(blob, encoding="utf-8")
    print(f"source-map: {len(added)} works added"
          + (f" ({', '.join(added[:6])}{'…' if len(added) > 6 else ''})" if added else "")
          + f", {refreshed} derived fields refreshed, {len(works)} works total")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
