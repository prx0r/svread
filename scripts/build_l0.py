"""Build L0 token data for svread from frozen T1-full files.
Runs ipvv's t1_extract (read-only over immutable chunks), maps tokens to
verse chunks via ## headers, writes data/l0/<wid>.json:
  {work, verses:[{id, tokens:[{iast,gloss,raw,status}]}]}
Usage: python3 scripts/build_l0.py [wid ...]   (default: all samples/*/T1-full.md)
"""
import json, glob, os, re, subprocess, sys

IPVV = '/root/ipvv'

def verse_ranges(t1path):
    """Map file line number -> chunk id from ## headers. Returns (headers, total_lines)."""
    headers = []  # (start_line_idx, chunk_id), 0-based line numbers
    with open(t1path, encoding='utf-8') as f:
        lines = f.readlines()
    for i, ln in enumerate(lines):
        m = re.match(r'##\s+(\S+)', ln.strip())
        if m:
            headers.append((i, m.group(1)))
    return headers, len(lines)

def chunk_for_line(headers, total, line_id_1based):
    """line_id from extractor is 1-based file line. Return owning chunk or None."""
    idx = line_id_1based - 1
    owner = None
    for start, cid in headers:
        if start <= idx:
            owner = cid
        else:
            break
    return owner

def main():
    only = set(sys.argv[1:])
    os.makedirs('data/l0', exist_ok=True)
    done = 0
    for t1 in sorted(glob.glob(f'{IPVV}/samples/*/T1-full.md')):
        wid = os.path.basename(os.path.dirname(t1))
        if only and wid not in only:
            continue
        workdir = f'/tmp/l0work/{wid}'
        os.makedirs(workdir, exist_ok=True)
        before = glob.glob('/tmp/**/*.l0.jsonl', recursive=True)
        before_m = {p: os.path.getmtime(p) for p in before}
        r = subprocess.run(['python3', f'{IPVV}/tools/t1_extract.py', t1, '--format', 'json'],
                           capture_output=True, text=True, cwd=workdir)
        after = glob.glob('/tmp/**/*.l0.jsonl', recursive=True)
        fresh = [p for p in after if p not in before_m or os.path.getmtime(p) > before_m[p] + 0.5]
        if not fresh:
            print(wid, 'NO OUTPUT', (r.stderr.strip().split(chr(10))[-1][:100] if r.stderr else ''), flush=True)
            continue
        newest = max(fresh, key=os.path.getmtime)
        recs = []
        for line in open(newest, encoding='utf-8'):
            line = line.strip()
            if line:
                recs.append(json.loads(line))
        headers, total = verse_ranges(t1)
        verses, order = {}, []
        for t in recs:
            cid = chunk_for_line(headers, total, t.get('line_id', 0)) or 'unmapped'
            if cid not in verses:
                verses[cid] = []
                order.append(cid)
            verses[cid].append({'iast': t.get('lemma_iast', ''), 'gloss': t.get('literal_gloss', ''),
                                'raw': t.get('raw_fragment', ''), 'status': t.get('status', '')})
        json.dump({'work': wid, 'verses': [{'id': c, 'tokens': verses[c]} for c in order]},
                  open(f'data/l0/{wid}.json', 'w'), ensure_ascii=False, indent=0)
        n = sum(len(v) for v in verses.values())
        print(wid, len(order), 'chunks,', n, 'tokens', flush=True)
        done += 1
    print('done:', done)

if __name__ == '__main__':
    main()
