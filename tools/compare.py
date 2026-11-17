#!/usr/bin/env python3
"""compare.py — trika-x against existing formalisations (NORTHSTAR-2 / THESIS).

The unit is a COMPARISON, not a vibe. Type rules:

  C1  every comparison names their artefact + a citation (their_anchor)
  C2  every our_anchor MUST resolve in trika-x EVIDENCE.json (fail closed)
  C3  verdict ∈ {fit, partial, incompatible}
  C4  incompatible REQUIRES a named obstruction (the precise reason)
  C5  fit REQUIRES a fit_basis
  C6  at least one shared axis and one disparity, each with 'matters'
  C7  chunk must exist in the translation-work ledger
  C8  'what_it_means' is required: a comparison with no consequence is noise

Essays are then generated STRUCTURALLY from the record: sections follow the
record's own fields, claims are derived one-to-one from disparities, and the
result goes through the same gate as every other essay.

  python3 tools/compare.py list
  python3 tools/compare.py check
  python3 tools/compare.py essay <id> [--date YYYY-MM-DD]

Writes essays to trika-x formal-trika/swarm (the one essay home). Writes
nothing else. Never flips a verdict by itself.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
TRIKA = Path("/root/trika-x")
EVIDENCE = TRIKA / "formal-trika" / "EVIDENCE.json"
SWARM = TRIKA / "formal-trika" / "swarm"
TW = Path("/root/translation-work")
DATA = ROOT / "data" / "xmodel" / "comparisons.json"

VERDICTS = ("fit", "partial", "incompatible", "not-comparable")
# Marr-level / scope discipline from Yan et al. (2026, Biological Cybernetics):
# an "incompatible" verdict is only allowed when both sides answer the SAME
# explanatory question. A different scope is not a contradiction.
SCOPES = ("same", "different")


class Bad(Exception):
    pass


def load() -> dict:
    return json.loads(DATA.read_text(encoding="utf-8"))


def evidence_keys() -> set:
    return set((json.loads(EVIDENCE.read_text(encoding="utf-8"))
                .get("entries") or {}))


def ledger_row(chunk: str):
    work, _, locator = (chunk or "").partition(":")
    if not work or not locator:
        return None
    p = TW / work / "passages.jsonl"
    if not p.is_file():
        return None
    for line in p.read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        try:
            row = json.loads(line)
        except ValueError:
            continue
        if row.get("locator") == locator:
            return row
    return None


def check_record(c: dict, keys: set, seen: set) -> list:
    f = []
    cid = c.get("id", "")
    if not re.fullmatch(r"[a-z0-9][a-z0-9-]{2,79}", cid or ""):
        f.append("bad id slug")
    if cid in seen:
        f.append("duplicate id")
    seen.add(cid)
    for k in ("their", "their_kind", "their_anchor", "what_it_means"):
        if not (c.get(k) or "").strip():
            f.append(f"missing {k}")
    if c.get("verdict") not in VERDICTS:
        f.append(f"verdict not in {VERDICTS}")
    if c.get("scope") not in SCOPES:
        f.append(f"scope not in {SCOPES}")
    if c.get("verdict") == "incompatible" and c.get("scope") != "same":
        f.append("incompatible verdict but scope is not 'same' "
                 "(use not-comparable or name the shared question)")
    if c.get("verdict") == "not-comparable" and not (c.get("scope_difference") or "").strip():
        f.append("not-comparable without scope_difference")
    if not c.get("shared_tools"):
        f.append("no shared_tools (name the formal tools the comparison needs)")
    tr = c.get("tractability") or {}
    if not tr.get("ours") or not tr.get("theirs"):
        f.append("tractability needs both sides")
    if c.get("verdict") == "incompatible" and not (c.get("obstruction") or "").strip():
        f.append("incompatible without a named obstruction")
    if c.get("verdict") == "fit" and not (c.get("fit_basis") or "").strip():
        f.append("fit without fit_basis")
    anchors = c.get("our_anchor") or []
    if not anchors:
        f.append("no our_anchor")
    for a in anchors:
        if a not in keys:
            f.append(f"our_anchor does not resolve: {a!r}")
    if not c.get("shared"):
        f.append("no shared axes")
    disp = c.get("disparities") or []
    if not disp:
        f.append("no disparities")
    for d in disp:
        for k in ("axis", "their", "ours", "matters"):
            if not (d.get(k) or "").strip():
                f.append(f"disparity missing {k}")
    if not ledger_row(c.get("chunk", "")):
        f.append(f"chunk not in ledger: {c.get('chunk')!r}")
    return f


def check_all() -> int:
    d = load()
    keys = evidence_keys()
    seen: set = set()
    bad = 0
    rows = d.get("comparisons") or []
    for c in rows:
        fails = check_record(c, keys, seen)
        if fails:
            bad += 1
            print(f"FAIL {c.get('id')}")
            for x in fails:
                print(f"  - {x}")
    by = {}
    for c in rows:
        by[c.get("verdict")] = by.get(c.get("verdict"), 0) + 1
    scope = {}
    for c in rows:
        scope[c.get("scope")] = scope.get(c.get("scope"), 0) + 1
    print(f"compare: {len(rows) - bad}/{len(rows)} pass type logic  {by}  scope={scope}")
    return 0 if bad == 0 else 1


def list_all() -> int:
    for c in load().get("comparisons") or []:
        print(f"{c['id']:<40} {c.get('verdict'):<12} {c.get('their_kind','')[:46]}")
    return 0


def _sha(s: str) -> str:
    return hashlib.sha256(s.encode("utf-8")).hexdigest()


def build_essay(c: dict, date: str) -> dict:
    disp = c.get("disparities") or []
    claims = []
    for i, d in enumerate(disp, 1):
        claims.append({"id": f"CLM-{i}", "tier": "H",
                       "text": f"On the {d['axis']} axis: their account holds that {d['their']}; "
                               f"trika-x holds that {d['ours']}. This matters because {d['matters']}."})
    claims.append({"id": f"CLM-{len(disp) + 1}", "tier": "E",
                   "text": f"Their formalisation is: {c['their']} ({c['their_anchor']}). "
                           f"Recorded as published; not re-verified by this essay."})
    claims.append({"id": f"CLM-{len(disp) + 2}", "tier": "R",
                   "text": f"Our side is anchored in machine-checked structures: "
                           f"{', '.join(c['our_anchor'])}. Registry references are not "
                           f"source-to-theorem entailments."})
    if c.get("obstruction"):
        claims.append({"id": f"CLM-{len(disp) + 3}", "tier": "H",
                       "text": f"Obstruction: {c['obstruction']}"})
    for i, s in enumerate(c.get("shared") or [], 1):
        claims.append({"id": f"CLM-S{i}", "tier": "C",
                       "text": f"Shared ground: {s}."})
    claims.append({"id": "CLM-W", "tier": "H",
                   "text": f"What it means: {c['what_it_means']}"})

    row = ledger_row(c["chunk"])
    edition = (row or {}).get("source_edition") or ""
    work = c["chunk"].split(":")[0]
    slug = f"xmodel-compare-{c['id']}-{date}"
    essay = {
        "format": "trika-essay/1",
        "id": f"essay:expansion-{slug}",
        "title": f"Comparison: trika-x and {c['their']}",
        "date": date,
        "chunk": c["chunk"],
        "verses": (row or {}).get("verses") or [],
        "voice": "agent-drafted under owner direction; structural generation from a comparison record; not human-reviewed",
        "claims": claims,
        "theorems": [{"name": a, "tier": "UNVERIFIED"} for a in c["our_anchor"]],
        "open_questions": [
            f"Does the {c.get('verdict')} verdict survive a reviewer who knows the source language?",
            "Which disparity would move first if the other formalisation changed?"],
        "tracks": ["F1", "F2", "F11"],
        "openpatala": {"openpatala_work_id": work,
                       "mapping_status": "CANDIDATE",
                       "edition_label": edition},
        "status": "MACHINE-COMPILED",
        "comparison": {"id": c["id"], "verdict": c.get("verdict")},
    }
    receipt = {"format": "trika-essay-receipt/1", "essay": slug, "date": date,
               "frozen_claims": [dict(x) for x in claims],
               "theorems": [dict(t) for t in essay["theorems"]],
               "note": "Frozen at compile time; a change to any claim text invalidates this receipt."}

    lines = [f"# Comparison: trika-x and {c['their']}", "",
             f"*Verdict: **{c.get('verdict')}**. Generated structurally from "
             f"`compare:{c['id']}`. Machine-compiled; human review is a separate step.*", "",
             "## Their side", "",
             f"Their work is {c['their_kind']}. [CLM-{len(disp) + 1}]", "",
             "## Our side", "",
             f"Trika-x contributes machine-checked structures. [CLM-{len(disp) + 2}]", ""]
    if c.get("shared"):
        lines += ["## Shared ground", ""]
        for i, s in enumerate(c.get("shared") or [], 1):
            lines.append(f"- Shared axis {i}: {s}. [CLM-S{i}]")
        lines.append("")
    lines += ["## Disparities", ""]
    for i, d in enumerate(disp, 1):
        lines += [f"### {d['axis'].title()}", "",
                  f"{d['axis'].title()} is where the two formalisms part. [CLM-{i}]", ""]
    if c.get("obstruction"):
        lines += ["## Obstruction", "", f"There is a structural obstruction. [CLM-{len(disp) + 3}]", ""]
    lines += ["## What it means", "", f"The consequence is stated, not implied. [CLM-W]", "",
              "## Limits", "",
              "The other formalisation is recorded as published and is not re-verified here. "
              "The trika-x side is machine-checked only inside finite models; no claim about "
              "doctrine truth is made. A human reviewer must confirm the comparison before it "
              "is cited.", ""]
    md = "\n".join(lines)

    return {"slug": slug, "essay": essay, "receipt": receipt, "md": md}


def write_essay(cid: str, date: str) -> None:
    d = load()
    c = next((x for x in d.get("comparisons") or [] if x.get("id") == cid), None)
    if c is None:
        raise Bad(f"unknown comparison: {cid}")
    fails = check_record(dict(c), evidence_keys(), set())
    if fails:
        raise Bad(f"comparison fails its own type logic: {fails}")
    built = build_essay(c, date)
    slug = built["slug"]
    (SWARM / f"{slug}.essay.json").write_text(
        json.dumps(built["essay"], indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    (SWARM / f"{slug}.receipt.json").write_text(
        json.dumps(built["receipt"], indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    (SWARM / f"{slug}.md").write_text(built["md"], encoding="utf-8")
    print(f"wrote {slug} ({len(built['essay']['claims'])} claims)")


def main() -> int:
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    sub.add_parser("list")
    sub.add_parser("check")
    e = sub.add_parser("essay")
    e.add_argument("id")
    e.add_argument("--date", default="2026-11-17")
    try:
        a = ap.parse_args()
        if a.cmd == "list":
            return list_all()
        if a.cmd == "check":
            return check_all()
        write_essay(a.id, a.date)
        return 0
    except Bad as exc:
        print(f"FAIL: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
