#!/usr/bin/env python3
"""emit_concepts.py — build data/concepts/index.json (NORTHSTAR N4 + N7).

The concept card is ASSEMBLED, never authored:

  gloss        from /root/translation-work/lore/concepts/<slug>.json
               (if absent: NO_CONCEPT_ENTRY — a gap, never an invention)
  formal       from trika-x EVIDENCE.json, via the audited anchor table below
               (every anchor must exist or the build fails closed)
  occurrences  from a single token pass over translation-work */data/*.l0.json
               `surface` (diacritic-folded), keyed to work + verse_id

  python3 tools/emit_concepts.py --write
  python3 tools/emit_concepts.py --check     # deterministic, exits 1 on drift

House law: this emitter never writes a definition. A missing gloss stays
missing and is labelled. Occurrence hits are tokens, not readings.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CONCEPTS_DIR = Path("/root/translation-work/lore/concepts")
TRANSLATION_WORK = Path("/root/translation-work")
EVIDENCE = Path("/root/trika-x/formal-trika/EVIDENCE.json")
OUT = ROOT / "data" / "concepts" / "index.json"
FORMAT = "svatantrya.concepts/1"

# Audited term -> theorem anchors. Each theorem must exist in EVIDENCE.json.
# This is an index, not a reading: it says which machine-checked table touches
# the term, and the card repeats the theorem's own scope note.
FORMAL_ANCHORS = {
    "kancuka": ["AnswerKey.lean :: key_five_kancukas",
                "Kancuka.lean :: count_5",
                "Kancuka.lean :: pairings_distinct"],
    "tattva": ["AnswerKey.lean :: key_thirtysix_tattvas",
               "Tattva.lean :: thirty_six",
               "TattvaInventory.lean :: named_tattvas_36"],
    "mala": ["Mala.lean :: count_3", "MalaFuel.lean :: grace_ignites"],
    "avarana": ["Avarana.lean :: course_ascends", "Avarana.lean :: partial_order_honest"],
    "spanda": ["Spanda.lean :: phases_two"],
    "rasa": ["Rasa.lean :: nine_only"],
    "upaya": ["Ladder.lean :: chain_trans",
              "Ladder.lean :: terminal_no_successor"],
    "saktipata": ["AnswerKey.lean :: key_grace_term", "Grace.lean :: flip_iff_ready_and_grace"],
    "pratyabhijna": ["Conjuncts.lean :: misidentification_never_recognizes",
                     "Recognition.lean :: recognition_adds_nothing"],
    "nyasa": ["Nyasa.lean :: order_chief", "Nyasa.lean :: matrika_total"],
    "pratyahara": ["Pratyahara.lean :: inventory_43", "Pratyahara.lean :: markers_13"],
    "dharana": ["AnswerKey.lean :: key_hundred_twelve_dharanas"],
    "vbt": ["Vbt.lean :: forms_eight"],
    "ahamkara": ["EgoOrigin.lean :: sankhya_requires_cause",
                 "EgoOrigin.lean :: trika_self_grounding_exists"],
}

TOKEN_RE = re.compile(r"[a-z]+")


def fold(text: str) -> str:
    """Diacritic- and case-insensitive Latin fold for token matching."""
    text = unicodedata.normalize("NFD", text or "")
    text = "".join(ch for ch in text if not unicodedata.combining(ch))
    return text.casefold()


def slug(term: str) -> str:
    return fold(term).replace(" ", "-")


def tokens(text: str) -> set:
    return set(TOKEN_RE.findall(fold(text)))


def load_evidence() -> dict:
    return json.loads(EVIDENCE.read_text(encoding="utf-8")).get("entries") or {}


def build_occurrences() -> dict:
    """one pass: folded token -> set of 'work|verse_id'."""
    inv: dict = {}
    for path in sorted(TRANSLATION_WORK.glob("*/data/*.l0.json")):
        work = path.parent.parent.name
        try:
            rows = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            continue
        for row in rows if isinstance(rows, list) else []:
            verse = row.get("verse_id")
            if not verse:
                continue
            for tok in tokens(row.get("surface") or ""):
                inv.setdefault(tok, set()).add(f"{work}|{verse}")
    return inv


def anchors_for(term: str, entries: dict) -> list:
    out = []
    for ref in FORMAL_ANCHORS.get(slug(term), []):
        entry = entries.get(ref)
        if entry is None:
            raise SystemExit(f"FAIL: anchor {ref!r} for {term!r} not in EVIDENCE.json")
        out.append({
            "theorem": ref,
            "kind": entry.get("kind"),
            "chunks": entry.get("chunks") or [],
            "note": "registry reference; not a source-to-theorem entailment",
        })
    return out


def concept_files() -> list:
    rows = []
    for path in sorted(CONCEPTS_DIR.glob("*.json")):
        if path.name == "README.md":
            continue
        try:
            rows.append(json.loads(path.read_text(encoding="utf-8")))
        except ValueError:
            continue
    return rows


def build() -> dict:
    entries = load_evidence()
    inv = build_occurrences()
    cards = []
    seen = set()

    def card(term, gloss, iast, work_hint):
        anchors = anchors_for(term, entries)
        stems = [t for t in tokens(iast or term) if len(t) >= 4]
        hits = set()
        if stems:
            for key, locs in inv.items():
                if any(key == st or (key.startswith(st)
                                     and len(key) <= len(st) + 6)
                       for st in stems):
                    hits |= locs
        else:
            for tok in tokens(iast or term):
                hits |= inv.get(tok, set())
        occ = sorted(hits)
        chunks = sorted({c.get("locator") for a in anchors
                         for c in a["chunks"] if c.get("locator")})
        tier = "T" if any(c.get("tier") == "T" for a in anchors
                          for c in a["chunks"]) else (
            "R" if anchors else "NONE")
        return {
            "id": slug(term),
            "term": term,
            "iast": iast or term,
            "gloss_state": "CURATED" if gloss.get("definition") else "NO_CONCEPT_ENTRY",
            "definition": gloss.get("definition"),
            "tradition": gloss.get("tradition"),
            "rasa": gloss.get("rasa"),
            "sources": gloss.get("sources") or [],
            "related": gloss.get("related") or [],
            "works": sorted(set(gloss.get("works") or []) |
                            {o.split("|")[0] for o in occ}),
            "tier": tier,
            "formal_anchors": anchors,
            "formal_chunks": chunks,
            "scope_note": ("MODEL_CHECKED inside the stated finite model only; "
                           "doctrine claims are out of scope by contract"),
            "occurrences": [{"work": o.split("|")[0], "verse_id": o.split("|")[1]}
                            for o in occ[:200]],
            "occurrence_count": len(occ),
            "occurrence_note": ("tokens, not readings; verse_id -> chunk locator "
                                "is a separate hop (formal__bridge)"),
            "review_state": "UNREVIEWED",
        }

    for row in concept_files():
        term = row.get("term") or ""
        if not term:
            continue
        cid = slug(term)
        if cid in seen:
            continue
        seen.add(cid)
        cards.append(card(term, row, row.get("iast"), None))

    # Anchored terms with no curated concept file still get a card, with the
    # gloss explicitly missing. kañcuka is the canonical example.
    for term in FORMAL_ANCHORS:
        if term in seen:
            continue
        seen.add(term)
        cards.append(card(term, {}, term, None))

    cards.sort(key=lambda c: c["id"])
    return {
        "format": FORMAT,
        "counts": {
            "concepts": len(cards),
            "curated_gloss": sum(1 for c in cards if c["gloss_state"] == "CURATED"),
            "no_gloss": sum(1 for c in cards if c["gloss_state"] != "CURATED"),
            "with_formal_anchor": sum(1 for c in cards if c["formal_anchors"]),
            "with_occurrences": sum(1 for c in cards if c["occurrences"]),
        },
        "provenance": {
            "gloss": str(CONCEPTS_DIR),
            "formal": str(EVIDENCE),
            "occurrences": str(TRANSLATION_WORK / "*/data/*.l0.json"),
        },
        "concepts": cards,
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--write", action="store_true")
    g.add_argument("--check", action="store_true")
    args = ap.parse_args()
    data = build()
    text = json.dumps(data, indent=1, ensure_ascii=False) + "\n"
    if args.write:
        OUT.parent.mkdir(parents=True, exist_ok=True)
        OUT.write_text(text, encoding="utf-8")
        print(f"wrote {OUT} ({len(text)} bytes) {data['counts']}")
        return 0
    current = OUT.read_text(encoding="utf-8") if OUT.exists() else ""
    if current != text:
        print("DRIFT: data/concepts/index.json is stale; run --write", file=sys.stderr)
        return 1
    print(f"SHARP {data['counts']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
