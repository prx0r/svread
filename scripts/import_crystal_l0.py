#!/usr/bin/env python3
"""Import crystal L0 (translation-work data/*.l0.json) into svread L0 format.

Provenance: translation-work proof-PASS chosen glosses (options[chosen_index]),
grouped by token verse_id. Mechanical — no gloss content is altered here.
Gloss strictness fixes belong in the crystal pipeline (L0 options + grounds),
not in this import.

Usage: python3 scripts/import_crystal_l0.py <work> [<work> ...]
Reads /root/translation-work/<work>/data/*.l0.json, writes data/l0/<work>.json.
"""
import json
import sys
from pathlib import Path

TW = Path("/root/translation-work")


def main():
    for work in sys.argv[1:]:
        data = TW / work / "data"
        files = sorted(data.glob("*.l0.json"))
        if not files:
            print(f"{work}: no crystal l0 files, skipped")
            continue
        verses, seen = [], {}
        for f in files:
            for t in json.loads(f.read_text(encoding="utf-8")):
                vid = t.get("verse_id") or f.stem.replace(".l0", "")
                if vid not in seen:
                    seen[vid] = {"id": vid, "tokens": []}
                    verses.append(seen[vid])
                opts = t.get("options", [])
                ci = t.get("chosen_index", 0)
                gloss = opts[ci]["gloss"] if ci < len(opts) else ""
                seen[vid]["tokens"].append({
                    "iast": t.get("surface", ""),
                    "gloss": gloss,
                    "raw": t.get("legacy_raw", ""),
                    "status": t.get("status", "PARSED") or "PARSED",
                })
        out = Path("data/l0") / f"{work}.json"
        out.write_text(json.dumps({"work": work, "verses": verses},
                                  ensure_ascii=False, indent=1), encoding="utf-8")
        ntok = sum(len(v["tokens"]) for v in verses)
        print(f"{work}: {len(verses)} verses, {ntok} tokens -> {out}")


if __name__ == "__main__":
    main()
