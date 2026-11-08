#!/usr/bin/env python3
"""emit_verify.py — publish per-chunk verification packs.

The point: an LLM or a human can verify a trace WITHOUT running our code.
For each published trika-trace/1 bundle we serve the exact bytes the trace
hashes, at a stable URL:

  data/verify/<work>-<target>/source.txt          == trace.source.bytes_sha256
  data/verify/<work>-<target>/<layer>.json        == trace.layers[<layer>].sha256
  data/verify/<work>-<target>/proof-<song>.json   == trace.proofs.song_proof.sha256
  data/verify/<work>-<target>/manifest.json       == list of the above + hashes

Verification then needs only fetch + sha256:
  curl -s <url> | sha256sum      # compare to the trace field

Fail-closed: every published file's sha256 is computed here and must equal
the hash recorded in the trace; a mismatch aborts the emit (we never ship a
pack that cannot reproduce the trace). Deterministic. --check compares bytes.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys
from pathlib import Path

ORIGIN = os.environ.get("SITE_ORIGIN", "https://svread.pages.dev").rstrip("/")

ROOT = Path(__file__).resolve().parent.parent
TRACES = ROOT / "data" / "traces"
OUT = ROOT / "data" / "verify"
TW = Path(os.environ.get("TRANSLATION_WORK", "/root/translation-work"))


def sha(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true")
    a = ap.parse_args()
    if not TRACES.is_dir():
        print("emit_verify: no traces published yet", file=sys.stderr)
        return 2
    bundles = sorted(p for p in TRACES.glob("*.json") if p.name != "index.json")
    if not bundles:
        print("emit_verify: zero trace bundles", file=sys.stderr)
        return 2

    rendered: dict[str, bytes] = {}
    problems: list[str] = []
    packs = []

    for bp in bundles:
        trace = json.loads(bp.read_text(encoding="utf-8"))
        chunk = trace.get("chunk", {})
        work, target = chunk.get("work"), chunk.get("target")
        if not work or not target:
            problems.append(f"{bp.name}: trace missing chunk ids")
            continue
        base = f"verify/{work}-{target}"
        arts = []

        # 1. source bytes (exact string the trace hashed)
        src = trace.get("source", {})
        want = src.get("bytes_sha256")
        ledger = TW / work / "passages.jsonl"
        if want and ledger.exists():
            row = None
            for line in ledger.read_text(encoding="utf-8").splitlines():
                if not line.strip():
                    continue
                r = json.loads(line)
                if r.get("locator") == target:
                    row = r
                    break
            if row is None or not isinstance(row.get("sanskrit"), str):
                problems.append(f"{target}: source row not found")
            else:
                raw = row["sanskrit"].encode()
                got = sha(raw)
                if got != want:
                    problems.append(f"{target}: source hash drift "
                                    f"({got[:12]} != {want[:12]})")
                else:
                    rendered[f"{base}/source.txt"] = raw
                    arts.append({"name": "source.txt", "role": "source-bytes",
                                 "sha256": got, "bytes": len(raw)})

        # 2. layers
        for layer, meta in (trace.get("layers") or {}).items():
            if not isinstance(meta, dict) or not meta.get("sha256"):
                continue
            rel = meta.get("path")
            if not rel:
                continue
            p = TW / rel
            if not p.exists():
                problems.append(f"{target}: layer file missing {rel}")
                continue
            raw = p.read_bytes()
            got = sha(raw)
            if got != meta["sha256"]:
                problems.append(f"{target}: layer {layer} hash drift")
                continue
            name = Path(rel).name
            rendered[f"{base}/{name}"] = raw
            arts.append({"name": name, "role": f"layer-{layer}",
                         "status": meta.get("status"),
                         "sha256": got, "bytes": len(raw),
                         "origin": rel})

        # 3. song proof
        pf = (trace.get("proofs") or {}).get("song_proof") or {}
        if pf.get("sha256") and pf.get("file"):
            p = TW / pf["file"]
            if p.exists():
                raw = p.read_bytes()
                got = sha(raw)
                if got != pf["sha256"]:
                    problems.append(f"{target}: proof hash drift")
                else:
                    name = p.name
                    rendered[f"{base}/{name}"] = raw
                    arts.append({"name": name, "role": "proof",
                                 "sha256": got, "bytes": len(raw),
                                 "origin": pf["file"]})

        if not arts:
            problems.append(f"{target}: no reproducible artifacts")
            continue

        manifest = {
            "format": "trika-verify-pack/1",
            "chunk": {"work": work, "target": target,
                      "immutable_id": chunk.get("immutable_id")},
            "trace": {"file": f"traces/{bp.name}", "sha256": sha(bp.read_bytes())},
            "verdict": trace.get("verdict"),
            "verdict_scope": trace.get("verdict_scope") or (
                "links present only — not approval, proof, or witness "
                "verification"),
            "assurance": trace.get("assurance") or {},
            "caveats": trace.get("caveats") or [],
            "gaps": trace.get("gaps") or [],
            "artifacts": arts,
            "how_to_verify": (
                "For each artifact: curl -s "
                f"{ORIGIN}/data/{base}/<name> | sha256sum, then compare that hash with the "
                "same artifact's 'sha256' above and in the trace. If every "
                "artifact matches and the trace's recorded verdict/gaps agree "
                "with what you read, the chain is intact. A mismatch means the "
                "upstream bytes changed after the trace was made: treat the "
                "trace as stale, not the hash as wrong."),
            "limits": (
                "Matching bytes prove the trace and these files agree. They do "
                "NOT prove the translation is correct, that a human reviewed "
                "it, or that a witness exists (witnesses are UNPINNED). A "
                "formal theorem is REGISTERED unless a per-declaration run "
                "digest is bound; MODEL_CHECKED would require that binding and "
                "never extends beyond the stated finite model."),
        }
        rendered[f"{base}/manifest.json"] = (json.dumps(
            manifest, ensure_ascii=False, sort_keys=True, indent=1) + "\n").encode()
        packs.append({"work": work, "target": target, "path": f"{base}",
                      "verdict": trace.get("verdict"),
                      "artifacts": len(arts)})

    if problems:
        print("emit_verify: REFUSING (fail-closed):", file=sys.stderr)
        for p in problems:
            print("  - " + p, file=sys.stderr)
        return 1

    index = {
        "format": "svread-verify-index/1",
        "count": len(packs),
        "packs": sorted(packs, key=lambda x: (x["work"], x["target"])),
        "recipe": [
            "1. Fetch traces/index.json to find a chunk and its verdict.",
            "2. Fetch traces/<work>-<target>.json — the full chain record.",
            "3. Fetch verify/<work>-<target>/manifest.json — the exact bytes "
            "that chain hashes, with their sha256.",
            "4. curl each artifact and sha256sum it; compare with the manifest.",
            "5. All match => the chain is intact as recorded. Any mismatch => "
            "stale trace (upstream changed), not a faulty hash.",
        ],
        "no_code_needed": "Fetch + sha256 only. No Python, no install, no key.",
        "what_matching_does_not_prove": [
            "that the English is a correct translation",
            "that a human reviewed or signed it",
            "that a manuscript witness exists (all UNPINNED)",
            "that a formal theorem applies outside its stated finite model",
        ],
    }
    rendered["verify/index.json"] = (json.dumps(
        index, ensure_ascii=False, sort_keys=True, indent=1) + "\n").encode()

    if a.check:
        ok = True
        for name, blob in rendered.items():
            dst = ROOT / "data" / name
            if not dst.exists() or dst.read_bytes() != blob:
                print(f"mismatch or missing: data/{name}")
                ok = False
        print("emit verify --check: " + ("GREEN" if ok else "RED"))
        return 0 if ok else 1

    for name, blob in rendered.items():
        dst = ROOT / "data" / name
        dst.parent.mkdir(parents=True, exist_ok=True)
        dst.write_bytes(blob)
    total = sum(1 for n in rendered if n != "verify/index.json")
    print(f"published {len(packs)} verification packs ({total} files) -> data/verify/")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
