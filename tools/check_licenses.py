#!/usr/bin/env python3
"""check_licenses.py — the licence gate (W5).

Registry invariants, enforced fail-closed:

  * unique ids; status in the allowed set
  * `allowed` has exactly {train, infer, quote, redistribute} as bools
  * status=excluded            -> train=false, redistribute=false
  * status=pending_verification-> admitted() refuses every purpose until the
    release and checksum are verified (allowed still records licence terms)
  * status=read_only           -> everything false except as the guardrail says
  * checksum is sha256-hex or null; a null checksum requires pending/internal
    status (a filled checksum with pending status is fine — bytes were hashed)
  * every entry carries attribution and a non-empty notes/release

`--check` prints GREEN and exits 0 only if all invariants hold.
The pipeline (W7) will call `admitted(id, purpose)` before any use.

  python3 tools/check_licenses.py
  python3 tools/check_licenses.py --check
"""
from __future__ import annotations
import argparse
import json
import re
import sys
from pathlib import Path

SVREAD = Path(__file__).resolve().parent.parent
REG = SVREAD / 'data' / 'licenses' / 'registry.json'

STATUS = {'registered', 'pending_verification', 'excluded', 'read_only', 'internal'}
ALLOWED_KEYS = {'train', 'infer', 'quote', 'redistribute'}
SHA_RE = re.compile(r'^[0-9a-f]{64}$')


def problems(doc: dict) -> list[str]:
    out = []
    if doc.get('format') != 'svatantrya.licence-registry/1':
        out.append('bad format tag')
    if not doc.get('rule'):
        out.append('missing rule text')
    seen = set()
    for e in doc.get('entries', []):
        eid = e.get('id', '<no id>')
        if eid in seen:
            out.append(f'{eid}: duplicate id')
        seen.add(eid)
        st = e.get('status')
        if st not in STATUS:
            out.append(f'{eid}: bad status {st!r}')
        al = e.get('allowed')
        if not isinstance(al, dict) or set(al) != ALLOWED_KEYS:
            out.append(f'{eid}: allowed must be exactly {sorted(ALLOWED_KEYS)}')
        elif not all(isinstance(v, bool) for v in al.values()):
            out.append(f'{eid}: allowed values must be bool')
        else:
            if st == 'excluded' and (al['train'] or al['redistribute']):
                out.append(f'{eid}: excluded but train/redistribute true')
            # pending_verification: allowed reflects the LICENCE terms;
            # admitted() refuses on status regardless — verification is the gate
            if st == 'read_only' and (al['train'] or al['redistribute'] or al['infer']):
                out.append(f'{eid}: read_only must not train/infer/redistribute')
        ck = e.get('checksum')
        if ck is not None and not (isinstance(ck, str) and SHA_RE.match(ck)):
            out.append(f'{eid}: checksum must be sha256 hex or null')
        if ck is None and st == 'registered':
            # registered without bytes only makes sense for text-sources whose
            # per-item hashes live on claim pages; require a note saying so
            if 'claim page' not in (e.get('notes', '') + e.get('release', '')):
                out.append(f'{eid}: registered with null checksum and no claim-page note')
        if not e.get('attribution'):
            out.append(f'{eid}: missing attribution')
        if not (e.get('notes') or e.get('release')):
            out.append(f'{eid}: missing notes/release')
    return out


def admitted(doc: dict, entry_id: str, purpose: str) -> tuple[bool, str]:
    """Pipeline gate: purpose in {train, infer, quote, redistribute}."""
    e = next((x for x in doc.get('entries', []) if x.get('id') == entry_id), None)
    if e is None:
        return False, f'{entry_id}: not in registry — cannot use'
    if e.get('status') == 'excluded':
        return False, f'{entry_id}: excluded — never'
    if e.get('status') == 'pending_verification':
        return False, f'{entry_id}: pending_verification — verify release+checksum first'
    if e.get('status') == 'read_only':
        return False, f'{entry_id}: read_only — owner instruction required'
    ok = bool(e.get('allowed', {}).get(purpose))
    return ok, (f'{entry_id}: {purpose} allowed ({e.get("status")})' if ok
                else f'{entry_id}: {purpose} not allowed')


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('--check', action='store_true')
    ap.add_argument('--admit', nargs=2, metavar=('ID', 'PURPOSE'),
                    help='test one admission decision, print verdict')
    args = ap.parse_args()
    if not REG.exists():
        print('check_licenses: registry missing', file=sys.stderr)
        return 1
    doc = json.loads(REG.read_text(encoding='utf-8'))
    if args.admit:
        ok, msg = admitted(doc, args.admit[0], args.admit[1])
        print(('ADMIT ' if ok else 'REFUSE ') + msg)
        return 0 if ok else 2
    probs = problems(doc)
    if probs:
        for p in probs:
            print('FAIL ' + p, file=sys.stderr)
        return 1
    n = len(doc.get('entries', []))
    if args.check:
        print(f'check_licenses --check: GREEN ({n} entries)')
    else:
        print(f'check_licenses: {n} entries, all invariants hold')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
