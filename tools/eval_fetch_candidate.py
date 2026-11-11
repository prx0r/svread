#!/usr/bin/env python3
"""eval_fetch_candidate.py — bring a kernel's candidate back, verify, record.

A candidate is only usable if its bytes match the manifest written beside it on
the machine that produced it. This tool:

  1. downloads the kernel output (kaggle kernels output)
  2. recomputes sha256 of results-<name>.json and compares to the manifest
  3. copies both into data/eval/candidates/<name>.json + <name>.manifest.json
  4. runs eval_blind.py --candidate (coverage only, never a score)

It refuses on a hash mismatch or a missing manifest. It does not score.

  python3 tools/eval_fetch_candidate.py --kernel priortrades/x --name mitra-mt
"""
from __future__ import annotations
import argparse
import hashlib
import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

SVREAD = Path(__file__).resolve().parent.parent
CAND = SVREAD / 'data' / 'eval' / 'candidates'


def sha256(p: Path) -> str:
    h = hashlib.sha256()
    with p.open('rb') as f:
        for b in iter(lambda: f.read(1 << 20), b''):
            h.update(b)
    return h.hexdigest()


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('--kernel', required=True)
    ap.add_argument('--name', required=True)
    ap.add_argument('--keep-dir', help='keep downloads here instead of a temp dir')
    args = ap.parse_args()

    work = Path(args.keep_dir) if args.keep_dir else Path(tempfile.mkdtemp(prefix='evalfetch-'))
    work.mkdir(parents=True, exist_ok=True)
    r = subprocess.run(['kaggle', 'kernels', 'output', args.kernel, '-p', str(work)],
                       capture_output=True, text=True)
    if r.returncode != 0:
        print('fetch failed:', (r.stdout + r.stderr).strip()[-400:], file=sys.stderr)
        return 1

    res = work / f'results-{args.name}.json'
    man = work / f'results-{args.name}.manifest.json'
    for p, what in ((res, 'results'), (man, 'manifest')):
        if not p.exists():
            print(f'missing {what} at {p} — the run did not finish cleanly', file=sys.stderr)
            return 1

    manifest = json.loads(man.read_text(encoding='utf-8'))
    got = sha256(res)
    want = manifest.get('outputs_sha256')
    if want != got:
        print(f'REFUSE: outputs sha256 mismatch (manifest {want}, file {got})',
              file=sys.stderr)
        return 2
    if manifest.get('candidate') != args.name:
        print(f"REFUSE: manifest names candidate {manifest.get('candidate')!r}, "
              f"expected {args.name!r}", file=sys.stderr)
        return 2

    errors = manifest.get('errors') or {}
    if errors:
        print(f'note: {len(errors)} passages recorded an error in the manifest')

    CAND.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(res, CAND / f'{args.name}.json')
    shutil.copyfile(man, CAND / f'{args.name}.manifest.json')
    print(f'fetched {manifest.get("translated")} passages, sha256 verified -> '
          f'data/eval/candidates/{args.name}.json')

    r = subprocess.run([sys.executable, str(SVREAD / 'tools' / 'eval_blind.py'),
                        '--candidate', str(CAND / f'{args.name}.json'),
                        '--name', args.name], cwd=SVREAD, text=True)
    return r.returncode


if __name__ == '__main__':
    raise SystemExit(main())
