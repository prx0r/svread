#!/usr/bin/env python3
"""seed_muktabodha.py — add the Muktabodha e-texts to the openpatala box DB.

Source of truth: the verified snapshot
  r2:patala/source/ingestion/MUKTABODHA/snapshots/muktabodha-library-2026-08-14/
The same 499 texts are indexed in trika-x `muktabodha-index.json`.

Writes ONLY to the local openpatala Postgres (works / editions / etexts),
idempotent (`ON CONFLICT DO NOTHING`), ids `mukta-M#####` taken from the
filename catalog number — the scheme the published bibliography uses.

Rights: CC BY-NC 4.0 per file headers (study only). The DB records
`rights_policy_id = NULL` (unknown at ingest), never a licence we invented.

  python3 tools/seed_muktabodha.py --dir /tmp/opencode/mukta/muktabodha-lib
  python3 tools/seed_muktabodha.py --dir ... --check   # count only, no writes
"""
from __future__ import annotations
import argparse
import json
import re
import sys
from pathlib import Path

FNAME = re.compile(r'^(?P<title>.*)-(?P<cat>M\d{5}[a-z]?)-IAST\.txt$', re.I)


def published_titles() -> dict:
    """id -> title from the published bibliography (correct IAST, header-parsed).

    The filenames are a simplified ASCII, NOT SLP1: transliterating them
    invents diacritics (ASTaprakaraNa is not aṣṭaprakaraṇa in SLP1). So we
    take titles from the bibliography where it has the work, and otherwise
    keep the raw filename text rather than fabricate anything."""
    p = Path(__file__).resolve().parent.parent / 'data' / 'biblio.json'
    if not p.exists():
        return {}
    doc = json.loads(p.read_text(encoding='utf-8'))
    return {w['id']: w.get('title') or '' for w in doc.get('works', [])
            if str(w.get('id', '')).startswith('mukta-')}


def parse(dirpath: Path) -> list:
    known = published_titles()
    rows = []
    for p in sorted(dirpath.glob('*.txt')):
        m = FNAME.match(p.name)
        if not m:
            continue
        cat = m.group('cat').upper()
        wid = f'mukta-{cat}'
        title = (known.get(wid) or m.group('title').replace('_', ' ')).strip()
        rows.append({'id': wid, 'title': title or cat,
                     'file': p.name, 'bytes': p.stat().st_size,
                     'title_source': 'biblio' if known.get(wid) else 'filename-raw'})
    return rows


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('--dir', required=True)
    ap.add_argument('--check', action='store_true')
    args = ap.parse_args()
    d = Path(args.dir)
    if not d.is_dir():
        print(f'seed_muktabodha: directory missing: {d}', file=sys.stderr)
        return 2
    rows = parse(d)
    if not rows:
        print('seed_muktabodha: no matching files', file=sys.stderr)
        return 2
    print(f'seed_muktabodha: {len(rows)} texts parsed')
    if args.check:
        print(json.dumps(rows[:3], ensure_ascii=False, indent=1))
        return 0

    import psycopg2
    conn = psycopg2.connect(dbname='openpatala', user='patala',
                            password='patala', host='127.0.0.1')
    cur = conn.cursor()
    added_w = added_e = added_t = 0
    for r in rows:
        wid = r['id']
        cur.execute("""INSERT INTO works (id, preferred_title, work_type)
                       VALUES (%s, %s, 'TEXT') ON CONFLICT (id) DO NOTHING""",
                    (wid, r['title']))
        added_w += cur.rowcount
        eid = f"{wid}:edition:1"
        cur.execute("""INSERT INTO editions (id, work_id, title, external_ids)
                       VALUES (%s, %s, %s, %s) ON CONFLICT (id) DO NOTHING""",
                    (eid, wid, r['title'],
                     json.dumps([{'scheme': 'muktabodha_catalog',
                                  'value': wid.replace('mukta-', '')}])))
        added_e += cur.rowcount
        tid = f"{wid}:etext:1"
        cur.execute("""INSERT INTO etexts (id, work_id, edition_id, provider_id,
                                           artifact_id, text_format, script,
                                           language)
                       VALUES (%s, %s, %s, 'PT_PROVIDER_muktabodha',
                               %s, 'PLAIN', 'latin', 'san')
                       ON CONFLICT (id) DO NOTHING""",
                    (tid, wid, eid, f'PTART_muk_{wid.replace("mukta-", "")}'))
        added_t += cur.rowcount
    conn.commit()
    cur.execute('SELECT count(*) FROM works')
    total = cur.fetchone()[0]
    print(f'seed_muktabodha: +{added_w} works, +{added_e} editions, +{added_t} etexts '
          f'| works now {total}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
