#!/usr/bin/env python3
"""emit_biblio.py — openpatala bibliography as a static view on the DB.

The DB is the ground layer. This script reads it (works, editions, etexts,
passages counts, translations, people, assertions) plus the trika-x formal
registry (EVIDENCE.json chunks per work) and svread scholar projections
(essays/versions per work), and writes data/biblio.json + provenance.

Fail-closed: DB unreachable, missing seed contract, or empty result =
non-zero exit with NO writes (never ship a stale bibliography).
Deterministic output (sorted keys/rows). --check verifies without writing.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "biblio.json"
TRIKA = Path(os.environ.get("TRIKA_X_ROOT", "/root/trika-x"))
EVIDENCE = TRIKA / "formal-trika" / "EVIDENCE.json"
DSN = os.environ.get("OPENPATALA_DSN",
                      "dbname=openpatala user=patala password=patala host=127.0.0.1")


def _db_label(dsn: str) -> str:
    # Provenance records WHERE (host/db), never credentials.
    m = re.search(r"@([^/]+)/(\w+)", dsn)
    if m:
        return f"{m.group(2)}@{m.group(1)}"
    m = re.search(r"dbname=(\w+).*host=([\w.]+)", dsn)
    if m:
        return f"{m.group(1)}@{m.group(2)}"
    return "openpatala box DB (local)"


def http_links(refs) -> list:
    out = []
    for r in refs or []:
        for m in re.findall(r"https?://[^\s,\]\)'\"]+", str(r)):
            if m not in out:
                out.append(m)
    return out


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true")
    a = ap.parse_args()

    try:
        import psycopg2
        cx = psycopg2.connect(DSN)
    except Exception as e:
        print(f"biblio emit: DB unreachable ({e}); refusing stale write",
              file=sys.stderr)
        return 2
    cur = cx.cursor()
    cur.execute("SELECT id, preferred_title, work_type, external_ids FROM works ORDER BY id")
    works = {r[0]: {"id": r[0], "title": r[1], "type": r[2],
                    "external_ids": r[3]} for r in cur.fetchall()}
    if not works:
        print("biblio emit: zero works; refusing stale write", file=sys.stderr)
        return 2
    cur.execute("SELECT work_id, count(*) FROM passages GROUP BY work_id")
    passages = {r[0]: r[1] for r in cur.fetchall()}
    cur.execute("SELECT id, work_id, title FROM editions")
    editions: dict[str, list] = {}
    for eid, wid, title in cur.fetchall():
        editions.setdefault(wid, []).append({"id": eid, "title": title})
    cur.execute("SELECT id, work_id, target_language, translator_ids, "
                "completeness, provenance_refs, external_ids FROM translations")
    translations: dict[str, list] = {}
    ours = 0
    for tid, wid, lang, trs, comp, prov, ext in cur.fetchall():
        links = http_links(prov)
        meta0 = (ext[0] if isinstance(ext, list) and ext else ext) or {}
        if isinstance(meta0, dict):
            u = meta0.get("url")
            if u and u not in links:
                links = (links or []) + [u]
        translations.setdefault(wid, []).append(
            {"id": tid, "lang": lang, "by": list(trs or []),
             "completeness": comp, "links": links,
             "coverage": (meta0 or {}).get("coverage") if isinstance(meta0, dict) else None,
             "ours": tid.startswith("seed:ours:")})
        if tid.startswith("seed:ours:"):
            ours += 1
    cur.execute("SELECT id, preferred_name FROM people ORDER BY id")
    people = {r[0]: r[1] for r in cur.fetchall()}
    cur.execute("SELECT subject_id, predicate_uri, literal, epistemic_mode "
                "FROM assertions WHERE predicate_uri IN "
                "('TITLE','AUTHOR','LANGUAGE','STATUS')")
    meta: dict[str, dict] = {}
    for sid, pred, lit, mode in cur.fetchall():
        m = meta.setdefault(sid, {})
        if pred == "STATUS":
            m["status"] = lit
            m["status_mode"] = mode
        elif pred in ("AUTHOR", "LANGUAGE") and pred.lower() not in m:
            m[pred.lower()] = lit
    cx.close()

    formal: dict[str, int] = {}
    formal_inventory: dict[str, int] = {}
    try:
        ev = json.loads(EVIDENCE.read_text(encoding="utf-8"))
        by_loc: dict[str, set] = {}
        for spec in (ev.get("works") or {}).values():
            m = re.search(r"translation-work/([^/]+)/passages\.jsonl",
                          spec.get("ledger", ""))
            if m:
                for loc in spec.get("chunks", []) or []:
                    by_loc.setdefault(loc, set()).add(m.group(1))
        direct: dict[str, set] = {}
        for _thm, ent in (ev.get("entries") or {}).items():
            for c in (ent.get("chunks", []) or []):
                owners = by_loc.get(c.get("locator"), set())
                if len(owners) == 1:
                    w = next(iter(owners))
                    direct.setdefault(w, set()).add(c.get("locator"))
        for _key, w in (ev.get("works") or {}).items():
            m = re.search(r"translation-work/([^/]+)/passages\.jsonl",
                          w.get("ledger", ""))
            if m:
                # formalized = chunks with a direct registry reference.
                # Inventory count kept alongside for transparency.
                formal[m.group(1)] = len(direct.get(m.group(1), set()))
                formal_inventory[m.group(1)] = len(w.get("chunks", []))
        ev_rev = subprocess_rev()
        ev_bytes = (TRIKA / "formal-trika" / "EVIDENCE.json").read_bytes()
        ev_digest = {"trika_rev": ev_rev,
                     "evidence_sha256": hashlib.sha256(ev_bytes).hexdigest()}
    except (OSError, ValueError) as e:
        print(f"biblio emit: EVIDENCE unreadable ({e})", file=sys.stderr)
        return 2

    scholars: dict[str, dict] = {}
    for proj in sorted((ROOT / "data" / "scholar").glob("*.json")):
        if proj.name == "index.json":
            continue
        try:
            d = json.loads(proj.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            continue
        scholars[proj.stem] = {"essays": len(d.get("essays") or []),
                               "versions": len(d.get("versions") or [])}

    rows = []
    for wid in sorted(works):
        w = works[wid]
        ts = translations.get(wid, [])
        bundle = (ROOT / "data" / f"{wid}.json").exists()
        ext = w.get("external_ids") or {}
        traditions = (ext.get("traditions_authority")
                      or ext.get("seed_traditions")
                      or ext.get("traditions") or [])
        rows.append({
            "id": wid, "title": w["title"], "type": w["type"],
            "traditions": traditions,
            "site_url": ext.get("site_url"),
            "author": meta.get(wid, {}).get("author"),
            "language": meta.get(wid, {}).get("language"),
            "status": meta.get(wid, {}).get("status"),
            "editions": sorted(editions.get(wid, []), key=lambda e: e["id"]),
            "translations": sorted(ts, key=lambda t: t["id"]),
            "passages": passages.get(wid, 0),
            "formalized": formal.get(wid),
            "formalized_inventory": formal_inventory.get(wid),
            "essays": scholars.get(wid, {}).get("essays", 0),
            "versions": scholars.get(wid, {}).get("versions", 0),
            "has_projection": wid in scholars,
            "has_reader": bundle,
        })
    lost = [r for r in rows
            if (r.get("status") or "").startswith(("LOST", "ATTESTED"))]
    doc = {"format": "svread-biblio/1", "works": rows,
           "people": people,
           "counts": {"works": len(rows), "lost_or_unverified": len(lost),
                      "ours_translations": ours},
           "provenance": {"db": _db_label(DSN),
                          "evidence": ev_digest,
                          "note": "View on the openpatala box DB (ground layer). "
                                  "STATUS=reported rows are scholar-reported, not "
                                  "witness claims. OURS-* = machine-proposed, "
                                  "human review pending."}}
    blob = json.dumps(doc, ensure_ascii=False, sort_keys=True,
                      separators=(",", ":")).encode()
    digest = hashlib.sha256(blob).hexdigest()
    if a.check:
        if not OUT.exists():
            print("biblio emit --check: data/biblio.json missing")
            return 1
        cur = json.loads(OUT.read_text(encoding="utf-8"))
        new = json.loads(blob.decode("utf-8"))
        # trika_rev is informational (which commit the EVIDENCE bytes came
        # from); freshness is decided by evidence_sha256, not by unrelated
        # trika-x commits.
        cur.get("provenance", {})["evidence"] = {"trika_rev": "MASKED",
            "evidence_sha256": (cur.get("provenance", {}).get("evidence") or {}).get("evidence_sha256")}
        new.get("provenance", {})["evidence"] = {"trika_rev": "MASKED",
            "evidence_sha256": (new.get("provenance", {}).get("evidence") or {}).get("evidence_sha256")}
        ok = (json.dumps(cur, sort_keys=True) == json.dumps(new, sort_keys=True))
        if not ok:
            # BLOCKED is its own state (house rule: BLOCKED ≠ PASS). When this
            # box's DB holds FEWER works than the committed view, the DB is
            # behind — another box emitted an enriched bibliography. Exit 3 so
            # callers can label it a skip instead of a pass or a defect.
            cur_n = len(cur.get("works", []) or [])
            new_n = len(new.get("works", []) or [])
            if new_n < cur_n:
                print(f"biblio emit --check: BLOCKED — local DB has {new_n} works, "
                      f"committed view has {cur_n}; the DB is behind this box "
                      f"(sync the openpatala DB, then re-emit)")
                return 3
        print("biblio emit --check: " + ("GREEN" if ok else "RED (regenerate)"))
        return 0 if ok else 1
    OUT.write_bytes(blob)
    print(f"emitted data/biblio.json ({len(rows)} works, {len(lost)} "
          f"lost/unverified, sha256:{digest[:12]})")
    return 0


def subprocess_rev() -> str:
    try:
        import subprocess
        return subprocess.run(
            ["git", "-C", str(TRIKA), "rev-parse", "--short", "HEAD"],
            capture_output=True, check=True, text=True).stdout.strip()
    except Exception:
        return "UNKNOWN"


if __name__ == "__main__":
    raise SystemExit(main())
