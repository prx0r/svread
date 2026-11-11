#!/usr/bin/env python3
"""r2_system_backup.py — put the whole system on R2, repeatably.

One bucket, one convention, per repo:
  repos/<name>/<name>-<date>.tar.gz     full tree incl. .git (restorable)
  repos/<name>/<name>-<date>.sha256     sha256 of that tarball
  repos/<name>/manifest.json            latest: commit, dirty flag, counts,
                                        tar key/bytes/sha, date, excludes

Skips a repo when the remote manifest already records the same git HEAD and
clean/dirty state (re-runnable; use --force to redo). Streams tar.gz straight
into R2 multipart upload — no disk staging (this box is at 97%).

  python3 tools/r2_system_backup.py                 # all repos
  python3 tools/r2_system_backup.py --only svread
  python3 tools/r2_system_backup.py --check         # verify remote manifests
  python3 tools/r2_system_backup.py --force svread  # redo even if unchanged

Exit 0 = every requested repo verified in the manifest sense; 1 = any failure.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import os
import subprocess
import sys
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import boto3
from botocore.config import Config as BotoConfig

BUCKET = 'svatantrya-system'
DATE = time.strftime('%Y-%m-%d')

# name -> checkout path (satsang has no permanent checkout; use the pinned extract)
REPOS = {
    'svread': '/root/svread',
    'ipvv': '/root/ipvv',
    'translation-work': '/root/translation-work',
    'trika-x': '/root/trika-x',
    'bookfactory': '/root/bookfactory',
    'videofactory': '/root/videofactory',
    'deitybody': '/root/deitybody',
    'openpatala': '/root/openpatala',
    'bruno': '/root/bruno',
    'satsang': '/tmp/opencode/prx0r-satsang-ef85d86',
}
# regenerable/junk never worth a backup byte
TAR_EXCLUDES = ['--exclude=__pycache__', '--exclude=.wrangler',
                '--exclude=node_modules', '--exclude=.venv',
                '--exclude=*.log', '--exclude=.pytest_cache']
PART = 64 * 1024 * 1024


def env():
    e = {}
    for line in open('/root/.r2-env'):
        line = line.strip()
        if line and '=' in line and not line.startswith('#'):
            k, v = line.split('=', 1)
            e[k.strip()] = v.strip()
    return e


def s3client():
    e = env()
    return boto3.client('s3', endpoint_url=e['R2_ENDPOINT'],
                        aws_access_key_id=e['R2_ACCESS_KEY_ID'],
                        aws_secret_access_key=e['R2_SECRET_ACCESS_KEY'],
                        config=BotoConfig(max_pool_connections=16,
                                          retries={'max_attempts': 8}))


def ensure_bucket(s3):
    try:
        s3.head_bucket(Bucket=BUCKET)
    except Exception:
        s3.create_bucket(Bucket=BUCKET)


def git_info(path: Path):
    if not (path / '.git').exists():
        return None, None
    try:
        head = subprocess.run(['git', '-C', str(path), 'rev-parse', 'HEAD'],
                              capture_output=True, text=True, check=True).stdout.strip()
        dirty = bool(subprocess.run(['git', '-C', str(path), 'status', '--porcelain'],
                                    capture_output=True, text=True).stdout.strip())
        return head, dirty
    except Exception:
        return None, None


def remote_manifest(s3, name):
    try:
        body = s3.get_object(Bucket=BUCKET, Key=f'repos/{name}/manifest.json')['Body'].read()
        return json.loads(body)
    except Exception:
        return None


def upload_part(s3, uid, key, num, data):
    for attempt in range(8):
        try:
            r = s3.upload_part(Bucket=BUCKET, Key=key, UploadId=uid,
                               PartNumber=num, Body=data)
            return num, r['ETag']
        except Exception:
            time.sleep(2 ** attempt)
    raise RuntimeError(f'part {num} failed')


def stream_tar_gz(s3, name: str, path: Path, key: str) -> tuple[str, int]:
    """tar czf - (excl. junk) -> R2 multipart. Returns (sha256, bytes)."""
    args = ['tar', 'czf', '-'] + TAR_EXCLUDES + ['-C', str(path.parent), path.name]
    proc = subprocess.Popen(args, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
    uid = s3.create_multipart_upload(Bucket=BUCKET, Key=key)['UploadId']
    h = hashlib.sha256()
    total = 0
    partnum = 0
    etags = {}
    pool = ThreadPoolExecutor(max_workers=4)
    pending = {}
    try:
        while True:
            chunk = proc.stdout.read(PART)
            if not chunk:
                break
            h.update(chunk)
            total += len(chunk)
            partnum += 1
            fut = pool.submit(upload_part, s3, uid, key, partnum, chunk)
            pending[fut] = partnum
            if len(pending) >= 8:
                for f in list(pending):
                    if f.done():
                        n, et = f.result()
                        etags[n] = et
                        del pending[f]
        for f in pending:
            n, et = f.result()
            etags[n] = et
    except Exception:
        try:
            s3.abort_multipart_upload(Bucket=BUCKET, Key=key, UploadId=uid)
        except Exception:
            pass
        raise
    finally:
        proc.stdout.close()
        proc.wait()
        pool.shutdown()
    s3.complete_multipart_upload(
        Bucket=BUCKET, Key=key, UploadId=uid,
        MultipartUpload={'Parts': [{'PartNumber': n, 'ETag': etags[n]}
                                   for n in sorted(etags)]})
    return h.hexdigest(), total


def backup_repo(s3, name: str, path: Path, force: bool) -> dict:
    if not path.is_dir():
        return {'repo': name, 'status': 'SKIP', 'reason': 'path missing'}
    head, dirty = git_info(path)
    prior = remote_manifest(s3, name)
    if not force and prior and prior.get('git_head') == head \
            and prior.get('git_dirty') == dirty and dirty is not None:
        return {'repo': name, 'status': 'SKIP',
                'reason': f'unchanged at {str(head)[:12]}'}
    prefix = f'repos/{name}/'
    tar_key = f'{prefix}{name}-{DATE}.tar.gz'
    sha, nbytes = stream_tar_gz(s3, name, path, tar_key)
    s3.put_object(Bucket=BUCKET, Key=f'{prefix}{name}-{DATE}.sha256',
                  Body=f'{sha}  {name}-{DATE}.tar.gz\n'.encode())
    # count files (cheap walk, junk excluded)
    nfiles = sum(1 for p in path.rglob('*') if p.is_file()
                 and not any(x in p.parts for x in ('__pycache__', '.wrangler',
                                                    'node_modules', '.venv', '.git')))
    manifest = {
        'format': 'svatantrya.system-backup/1',
        'repo': name, 'local_path': str(path), 'date': DATE,
        'git_head': head, 'git_dirty': dirty,
        'tar': {'key': tar_key, 'bytes': nbytes, 'sha256': sha},
        'files_excluded': TAR_EXCLUDES, 'files_counted': nfiles,
        'uploaded_at': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
    }
    s3.put_object(Bucket=BUCKET, Key=f'{prefix}manifest.json',
                  Body=json.dumps(manifest, indent=2, sort_keys=True).encode())
    return {'repo': name, 'status': 'OK', 'bytes': nbytes, 'sha': sha[:12],
            'head': str(head)[:12] if head else 'n/a', 'files': nfiles}


def check_repo(s3, name: str) -> dict:
    m = remote_manifest(s3, name)
    if not m:
        return {'repo': name, 'status': 'FAIL', 'reason': 'no remote manifest'}
    tar = m.get('tar', {})
    try:
        s3.head_object(Bucket=BUCKET, Key=tar.get('key', ''))
        sha_body = s3.get_object(
            Bucket=BUCKET, Key=f'repos/{name}/{name}-{m.get("date")}.sha256'
        )['Body'].read().decode()
        listed = sha_body.split()[0]
        ok = listed == tar.get('sha256')
        return {'repo': name, 'status': 'OK' if ok else 'FAIL',
                'head': str(m.get('git_head'))[:12], 'bytes': tar.get('bytes'),
                'reason': '' if ok else 'sha mismatch'}
    except Exception as e:
        return {'repo': name, 'status': 'FAIL', 'reason': str(e)[:100]}


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('--only', action='append', default=[])
    ap.add_argument('--check', action='store_true')
    ap.add_argument('--force', action='store_true')
    args = ap.parse_args()
    names = args.only or list(REPOS)
    s3 = s3client()
    ensure_bucket(s3)
    fails = 0
    for n in names:
        if n not in REPOS:
            print(f'{n}: unknown repo', file=sys.stderr)
            fails += 1
            continue
        t0 = time.time()
        try:
            r = check_repo(s3, n) if args.check else backup_repo(
                s3, n, Path(REPOS[n]), args.force)
        except Exception as e:
            r = {'repo': n, 'status': 'FAIL', 'reason': str(e)[:200]}
        el = time.time() - t0
        print(f"{r['status']:5} {n:20} {r.get('bytes', 0)/1e6:8.1f} MB "
              f"{el:6.1f}s {r.get('reason') or r.get('sha') or ''}")
        if r['status'] == 'FAIL':
            fails += 1
    print(f"bucket: {BUCKET} · {'ALL OK' if fails == 0 else str(fails) + ' FAILED'}")
    return 1 if fails else 0


if __name__ == '__main__':
    raise SystemExit(main())
