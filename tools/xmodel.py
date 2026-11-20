#!/usr/bin/env python3
"""xmodel.py — cross-model tensions with type logic (NORTHSTAR-2 / THESIS §4).

A tension is the unit of work; an essay resolves it. This tool enforces the
type rules that stop a comparison from becoming mush:

  T1  id slug, question, >=2 distinct models, axis in the four, positions ok
  T2  every trika anchor MUST exist in trika-x EVIDENCE.json (fail closed)
  T3  a model without formal anchors requires an asymmetry_note
  T4  tickers: resolved requires a named human signer (never machine/agent)
  T5  every tension names a settling_condition (falsifier), non-empty
  T6  essay slug, if set, must exist as a triple and declare this tension

  python3 tools/xmodel.py list
  python3 tools/xmodel.py check            # exit 1 on any failure
  python3 tools/xmodel.py resolve xmodel:recognition-vs-individuation
  python3 tools/xmodel.py essay <tension-id>   # print the essay requirement

Read-only except nothing: this tool writes nothing. Status flips are human.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
SVREAD = ROOT
TRIKA = Path("/root/trika-x")
EVIDENCE = TRIKA / "formal-trika" / "EVIDENCE.json"
SWARM = TRIKA / "formal-trika" / "swarm"
TENSIONS = SVREAD / "data" / "xmodel" / "tensions.json"

AXES = ("self", "rigidity", "change", "agent")
TIERS = {"T", "R", "E", "C", "H", "X"}
SIGNER_BANNED = {"machine", "agent", "ai", "model", "system", "auto", "bot"}


class Bad(Exception):
    pass


def load() -> dict:
    return json.loads(TENSIONS.read_text(encoding="utf-8"))


def evidence_keys() -> set:
    ev = json.loads(EVIDENCE.read_text(encoding="utf-8"))
    return set((ev.get("entries") or {}))


def check_tension(t: dict, keys: set) -> list:
    f = []
    tid = t.get("id", "")
    if not re.fullmatch(r"[a-z0-9][a-z0-9-]{2,79}", tid or ""):
        f.append("bad id slug")
    if not (t.get("question") or "").strip():
        f.append("empty question")
    models = t.get("models") or []
    if len(set(models)) < 2:
        f.append("needs >=2 distinct models")
    if t.get("axis") not in AXES:
        f.append(f"axis not in {AXES}")
    pos = t.get("positions") or []
    if len(pos) != len(models):
        f.append("positions must match models 1:1")
    for p in pos:
        if p.get("model") not in models:
            f.append(f"position model {p.get('model')!r} not in models")
        if p.get("tier") not in TIERS:
            f.append(f"position tier {p.get('tier')!r} invalid")
        if not (p.get("claim") or "").strip():
            f.append("position with empty claim")
    anchors = t.get("trika_anchors") or []
    if not anchors:
        f.append("no trika anchor")
    for a in anchors:
        if a not in keys:
            f.append(f"anchor does not resolve in EVIDENCE.json: {a!r}")
    formalised = t.get("formalised") or {}
    if not formalised.get("trika"):
        f.append("trika side must be formalised:true")
    for m in models:
        if not formalised.get(m) and not (t.get("asymmetry_note") or "").strip():
            f.append(f"model {m!r} unformalised but no asymmetry_note")
    if not (t.get("settling_condition") or "").strip():
        f.append("no settling_condition (this is the falsifier)")
    status = t.get("status")
    if status not in ("open", "loosening", "resolved"):
        f.append(f"bad status {status!r}")
    if status == "resolved":
        by = (t.get("resolved_by") or "").strip()
        if not by:
            f.append("resolved without resolved_by (humans hold status flips)")
        elif any(w in by.casefold() for w in SIGNER_BANNED):
            f.append(f"resolved_by looks machine-ish: {by!r}")
    essay = t.get("essay")
    if essay:
        md = SWARM / f"{essay}.md"
        ej = SWARM / f"{essay}.essay.json"
        if not md.is_file() or not ej.is_file():
            f.append(f"essay triple missing for {essay!r}")
        else:
            rec = json.loads(ej.read_text(encoding="utf-8"))
            tn = rec.get("tension") or {}
            if tn.get("id") != f"xmodel:{tid}":
                f.append(f"essay {essay!r} does not declare xmodel:{tid}")
            if tn.get("relation") not in ("resolves", "loosens"):
                f.append(f"essay {essay!r} bad tension relation")
    return f


def check_all() -> int:
    d = load()
    keys = evidence_keys()
    ids = [t.get("id") for t in d.get("tensions") or []]
    dups = sorted({i for i in ids if ids.count(i) > 1})
    bad = 0
    for t in d.get("tensions") or []:
        fails = check_tension(t, keys)
        if fails:
            bad += 1
            print(f"FAIL {t.get('id')}")
            for x in fails:
                print(f"  - {x}")
    if dups:
        print(f"FAIL duplicate ids: {dups}")
        bad += 1
    total = len(d.get("tensions") or [])
    print(f"xmodel: {total - bad}/{total} tensions pass type logic"
          + ("" if bad == 0 else f" ({bad} failing)"))
    return 0 if bad == 0 else 1


def resolve(i: str) -> dict:
    tid = i.split(":", 1)[1] if i.startswith("xmodel:") else i
    d = load()
    for t in d.get("tensions") or []:
        if t.get("id") == tid:
            keys = evidence_keys()
            return {
                "atom": "xmodel-tension", "id": f"xmodel:{tid}",
                "question": t.get("question"), "models": t.get("models"),
                "axis": t.get("axis"), "status": t.get("status"),
                "disagreement": t.get("disagreement"),
                "settling_condition": t.get("settling_condition"),
                "clinical_implication": t.get("clinical_implication"),
                "trika_anchors": [{"theorem": a, "resolves": a in keys}
                                  for a in t.get("trika_anchors") or []],
                "formalised": t.get("formalised"),
                "asymmetry_note": t.get("asymmetry_note"),
                "essay": t.get("essay"),
                "visibility": "public",
                "note": "a tension is a question, not a verdict",
            }
    raise Bad(f"unknown xmodel tension: {tid}")


def list_all() -> int:
    d = load()
    for t in d.get("tensions") or []:
        print(f"{t['id']:<40} {t['axis']:<8} {t['status']:<9} "
              f"{'+'.join(t.get('models') or [])}")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    sub.add_parser("list")
    sub.add_parser("check")
    r = sub.add_parser("resolve")
    r.add_argument("id")
    try:
        a = ap.parse_args()
        if a.cmd == "list":
            return list_all()
        if a.cmd == "check":
            return check_all()
        print(json.dumps(resolve(a.id), indent=1, ensure_ascii=False))
        return 0
    except Bad as e:
        print(f"FAIL: {e}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
