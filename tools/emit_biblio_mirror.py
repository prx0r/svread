#!/usr/bin/env python3
"""emit_biblio_mirror.py — the local openpatala mirror's newest works, as a
site-served supplement to the authority bibliography.

The authority bibliography (data/biblio.json, 2,051 works, digest-pinned) is
emitted from the system-of-record DB (PG18 box) and MUST NOT be overwritten
from this box's PG15 mirror. This emitter publishes the delta instead: works
present in the local mirror DB but absent from the authority file, in the SAME
row schema, with provenance that says plainly what they are — mirror rows
pending authority sync, never authority records.

Fail-closed: DB unreachable, missing driver, empty delta query, or missing
authority file = non-zero exit with NO writes. Deterministic (sorted keys/rows).
--check verifies without writing. Exit 2 = infrastructure missing (no DB), so
CI skips with a reason instead of failing.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "biblio-mirror.json"
AUTHORITY = ROOT / "data" / "biblio.json"
OPENPATALA = Path(os.environ.get("OPENPATALA_ROOT", "/root/openpatala"))
TRIKA = Path(os.environ.get("TRIKA_X_ROOT", "/root/trika-x"))
EVIDENCE = TRIKA / "formal-trika" / "EVIDENCE.json"
DSN = os.environ.get("OPENPATALA_DSN",
                      "dbname=openpatala user=patala password=patala host=127.0.0.1")


def _db_label(dsn: str) -> str:
    m = re.search(r"@([^/]+)/(\w+)", dsn)
    if m:
        return f"{m.group(2)}@{m.group(1)}"
    m = re.search(r"dbname=(\w+).*host=([\w.]+)", dsn)
    if m:
        return f"{m.group(1)}@{m.group(2)}"
    return "openpatala box DB (local)"


def _rev(path: Path) -> str:
    try:
        return subprocess.run(
            ["git", "-C", str(path), "rev-parse", "--short", "HEAD"],
            capture_output=True, check=True, text=True).stdout.strip()
    except Exception:
        return "UNKNOWN"


def http_links(refs) -> list:
    out = []
    for r in refs or []:
        for m in re.findall(r"https?://[^\s,\]\)'\"]+", str(r)):
            if m not in out:
                out.append(m)
    return out


def build() -> dict:
    try:
        import psycopg2
        cx = psycopg2.connect(DSN)
    except Exception as e:
        print(f"biblio-mirror emit: DB unreachable ({e}); refusing stale write",
              file=sys.stderr)
        raise SystemExit(2)
    if not AUTHORITY.exists():
        print("biblio-mirror emit: authority data/biblio.json missing",
              file=sys.stderr)
        raise SystemExit(1)
    authority = json.loads(AUTHORITY.read_text(encoding="utf-8"))
    auth_ids = set(w["id"] for w in authority.get("works", []))
    if not auth_ids:
        print("biblio-mirror emit: authority has no works; refusing",
              file=sys.stderr)
        raise SystemExit(1)

    cur = cx.cursor()
    cur.execute("SELECT id, preferred_title, work_type, external_ids FROM works ORDER BY id")
    works = {r[0]: {"id": r[0], "title": r[1], "type": r[2],
                    "external_ids": r[3]} for r in cur.fetchall()}
    if not works:
        print("biblio-mirror emit: zero works; refusing stale write", file=sys.stderr)
        raise SystemExit(2)
    delta_ids = sorted(set(works) - auth_ids)
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
                formal[m.group(1)] = len(direct.get(m.group(1), set()))
                formal_inventory[m.group(1)] = len(w.get("chunks", []))
    except (OSError, ValueError) as e:
        print(f"biblio-mirror emit: EVIDENCE unreadable ({e})", file=sys.stderr)
        raise SystemExit(2)

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
    for wid in delta_ids:
        w = works[wid]
        ts = translations.get(wid, [])
        bundle = (ROOT / "data" / f"{wid}.json").exists()
        ext = w.get("external_ids") or {}
        traditions = (ext.get("traditions_authority")
                      or ext.get("seed_traditions")
                      or ext.get("traditions") or [])
        rows.append({
            "id": wid, "title": w["title"] if isinstance(w["title"], str) else "",
            "type": w["type"],
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
    used_people: dict[str, str] = {}
    for wid in delta_ids:
        for t in translations.get(wid, []):
            for p in t.get("by", []) or []:
                if p in people:
                    used_people[p] = people[p]
    doc = {"format": "svread-biblio-mirror/1", "works": rows,
           "people": used_people,
           "counts": {"works": len(rows),
                      "ours_translations": sum(1 for wid in delta_ids
                                               for t in translations.get(wid, [])
                                               if t.get("ours"))},
           "provenance": {"db": _db_label(DSN),
                          "openpatala_rev": _rev(OPENPATALA),
                          "generated_at": datetime.now(timezone.utc).strftime(
                              "%Y-%m-%dT%H:%M:%SZ"),
                          "authority_works": len(auth_ids),
                          "authority_sha256": hashlib.sha256(
                              AUTHORITY.read_bytes()).hexdigest(),
                          "note": ("Mirror delta: works in the local openpatala "
                                   "mirror DB absent from the authority "
                                   "data/biblio.json. Pending authority sync; "
                                   "never authority records. STATUS=reported rows "
                                   "are scholar-reported, not witness claims.")}}
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
            print("biblio-mirror emit --check: data/biblio-mirror.json missing")
            return 1
        cur = json.loads(OUT.read_text(encoding="utf-8"))
        new = json.loads(blob.decode("utf-8"))
        # generated_at / openpatala_rev are informational; the works payload
        # and authority pin decide freshness.
        for d in (cur, new):
            d.get("provenance", {}).pop("generated_at", None)
            d.get("provenance", {}).pop("openpatala_rev", None)
        ok = (json.dumps(cur, sort_keys=True) == json.dumps(new, sort_keys=True))
        print("biblio-mirror emit --check: " + ("GREEN" if ok else "RED (regenerate)"))
        return 0 if ok else 1
    OUT.write_bytes(blob)
    digest = hashlib.sha256(blob).hexdigest()
    print(f"emitted data/biblio-mirror.json ({doc['counts']['works']} mirror works, "
          f"authority {doc['provenance']['authority_works']}, sha256:{digest[:12]})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
