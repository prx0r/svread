#!/usr/bin/env python3
"""emit_traces.py — publish trika-trace/1 bundles into svread.

Copies trika-x/formal-trika/data/traces/*.json into data/traces/ verbatim
(hash recorded), plus data/traces/index.json (coverage + per-chunk status)
so agents can fetch a trace by URL without an MCP connection.

Fail-closed: a bundle must be valid trika-trace/1 and re-verify against the
live sources (delegates to trika-x trace_bundle.py --verify). Any bundle that
fails verification aborts the whole emit — no partial publication.
Deterministic output. --check compares bytes.
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
TRIKA = Path(os.environ.get("TRIKA_X_ROOT", "/root/trika-x"))
SRC = TRIKA / "formal-trika" / "data" / "traces"
VERIFY = TRIKA / "formal-trika" / "tools" / "trace_bundle.py"
OUT = ROOT / "data" / "traces"


def sha(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true")
    ap.add_argument("--skip-verify", action="store_true",
                    help="copy only (tests); never use for a release")
    a = ap.parse_args()
    if not SRC.is_dir():
        print(f"emit_traces: no bundles at {SRC}", file=sys.stderr)
        return 2
    bundles = sorted(SRC.glob("*.json"))
    if not bundles:
        print("emit_traces: zero bundles; refusing empty publish", file=sys.stderr)
        return 2
    rendered: dict[str, bytes] = {}
    entries = []
    failures = []
    for p in bundles:
        raw = p.read_bytes()
        try:
            doc = json.loads(raw)
        except ValueError as e:
            failures.append(f"{p.name}: invalid json ({e})")
            continue
        if doc.get("format") != "trika-trace/1":
            failures.append(f"{p.name}: not trika-trace/1")
            continue
        if not a.skip_verify:
            r = subprocess.run([sys.executable, str(VERIFY), "--verify", str(p)],
                               capture_output=True, text=True, timeout=180)
            if r.returncode != 0:
                failures.append(f"{p.name}: verify failed "
                                f"{(r.stderr or r.stdout)[:160]}")
                continue
        chunk = doc.get("chunk", {})
        entries.append({
            "file": f"traces/{p.name}",
            "sha256": sha(raw),
            "work": chunk.get("work"),
            "target": chunk.get("target"),
            "immutable_id": chunk.get("immutable_id"),
            "verdict": doc.get("verdict"),
            "gaps": doc.get("gaps", []),
            "caveats": doc.get("caveats", []),
            "theorems": [t.get("theorem") for t
                         in (doc.get("formal", {}).get("theorems") or [])],
        })
        rendered[f"traces/{p.name}"] = raw
    if failures:
        print("emit_traces: REFUSING to publish (fail-closed):", file=sys.stderr)
        for f in failures:
            print("  - " + f, file=sys.stderr)
        return 1
    entries.sort(key=lambda e: (e.get("work") or "", e.get("target") or ""))
    index = {
        "format": "svread-trace-index/1",
        "count": len(entries),
        "verdicts": {
            "COMPLETE": sum(1 for e in entries if e["verdict"] == "COMPLETE"),
            "PARTIAL": sum(1 for e in entries if e["verdict"] == "PARTIAL"),
        },
        "note": "Each file is a trika-trace/1 bundle: source bytes -> layers "
                "-> proofs -> formal theorems -> citing essays, hash-pinned. "
                "Re-verify with trika-x formal-trika/tools/trace_bundle.py "
                "--verify. COMPLETE means every applicable hop resolved; "
                "PARTIAL names its gaps and never hides them.",
        "entries": entries,
    }
    rendered["traces/index.json"] = (json.dumps(
        index, ensure_ascii=False, sort_keys=True, indent=1) + "\n").encode()
    if a.check:
        ok = True
        for name, blob in rendered.items():
            dst = ROOT / "data" / name
            if not dst.exists() or dst.read_bytes() != blob:
                print(f"mismatch or missing: data/{name}")
                ok = False
        print("emit traces --check: " + ("GREEN" if ok else "RED"))
        return 0 if ok else 1
    (OUT).mkdir(parents=True, exist_ok=True)
    for name, blob in rendered.items():
        (ROOT / "data" / name).write_bytes(blob)
    print(f"published {len(entries)} trace bundles -> data/traces/ "
          f"({index['verdicts']['COMPLETE']} COMPLETE, "
          f"{index['verdicts']['PARTIAL']} PARTIAL)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
