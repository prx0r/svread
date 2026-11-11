#!/usr/bin/env python3
"""Emit derivation certificates for wheel-pack forms (mechanics stamp, part 1).

  data/grammar/certificates.json  — one certificate per DERIVED pack entry
                                    that carries a prakriya trace.

Honest scope: trace pinning + structural checks + self-hash, re-verifiable by
`tools/certlib.py` (the MCP wheel_certificate tool uses the same function).
`lean_status` is `pending` for every entry until trika-x's PrakriyaSlice
(W2b) runs; this emitter never writes `lean_status: ok` on its own.

  python3 tools/emit_certificates.py
  python3 tools/emit_certificates.py --check
"""
from __future__ import annotations
import argparse
import json
import sys
from pathlib import Path

SVREAD = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(SVREAD / 'tools'))
import certlib  # noqa: E402

GRAMMAR = SVREAD / 'data' / 'grammar'
OUT = GRAMMAR / 'certificates.json'


def build() -> dict:
    pack = json.loads((GRAMMAR / 'wheel-pack.json').read_text(encoding='utf-8'))
    entries = []
    for e in pack.get('entries', []):
        if e.get('status') != 'DERIVED' or not e.get('prakriya'):
            continue
        entries.append(certlib.compute(e, lean_status='pending'))
    entries.sort(key=lambda c: c['pack_id'])
    return {
        'format': certlib.FORMAT,
        'status': 'machine-generated-unreviewed',
        'lean_note': ('Every lean_status is pending: the Lean rule slice '
                      '(trika-x PrakriyaSlice) has not run against these '
                      'traces yet (W2b). Certificates pin and structure-check '
                      'traces; they do not prove rule applicability.'),
        'verify_with': ('recompute from data/grammar/wheel-pack.json with '
                        'tools/certlib.py — wheel_certificate MCP tool does this'),
        'count': len(entries),
        'entries': entries,
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('--check', action='store_true')
    args = ap.parse_args()
    doc = build()
    if args.check:
        if not OUT.exists():
            print('emit_certificates --check: missing certificates.json', file=sys.stderr)
            return 1
        want = json.dumps(doc, ensure_ascii=False, sort_keys=True, indent=2) + '\n'
        if OUT.read_text(encoding='utf-8') != want:
            print('emit_certificates --check: certificates.json differs', file=sys.stderr)
            return 1
        print('emit certificates --check: GREEN')
        return 0
    OUT.write_text(json.dumps(doc, ensure_ascii=False, sort_keys=True, indent=2) + '\n',
                   encoding='utf-8')
    ok = sum(1 for c in doc['entries'] if c['checks']['codes_well_formed'] and c['checks']['steps_have_after'])
    print(f"emit_certificates: {doc['count']} certificates, {ok} structurally clean, "
          f"lean_status=pending for all (W2b)")
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
