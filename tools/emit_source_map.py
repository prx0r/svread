#!/usr/bin/env python3
"""emit_source_map.py — refresh ledger hashes/counts in source-map.json.

source-map.json is the bridge from svread works to translation-work ledgers
(with openpatala identity fields). The identity fields are hand-maintained;
the ledger hash and passage count are derived and drift whenever a ledger
changes upstream. This refreshes only those derived fields, preserving every
work-level mapping field untouched.

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
    works = doc.get("works") or {}
    if not TW.is_dir():
        print("source-map: translation-work checkout absent; nothing to refresh",
              file=sys.stderr)
        return 2
    changed = 0
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
            changed += 1
        if spec.get("passages") != rows:
            spec["passages"] = rows
            changed += 1
    blob = json.dumps(doc, ensure_ascii=False, sort_keys=True, indent=1) + "\n"
    if a.check:
        cur = MAP.read_text(encoding="utf-8")
        ok = cur == blob
        print("emit source-map --check: " + ("GREEN" if ok else "RED"))
        return 0 if ok else 1
    if changed:
        MAP.write_text(blob, encoding="utf-8")
    print(f"source-map: {changed} derived fields refreshed across {len(works)} works")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
