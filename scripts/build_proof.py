"""Build proof records: run sanskritbench's deterministic translation gate
over every gated English candidate, vendor the verdicts as data.
NOT a copy of their code: imports their module at build time (this box only);
only our verdicts ship. Run: python3 scripts/build_proof.py [wid ...]
Output: data/proof/<wid>.json {verse:{gate,blocking,checks,source_sha,result_id,model,date}}
"""
import json, glob, os, re, sys

sys.path.insert(0, '/tmp/opencode/sanskritbench/pipeline')
try:
    from translation_proof import verify_translation
except Exception as e:
    print('need sanskritbench clone at /tmp/opencode/sanskritbench:', e)
    sys.exit(1)


def clean_en(s):
    s = re.sub(r'^#+\s*[^\n]*\n', '', s or '')
    return re.sub(r'\s*\/\/\s*\S+\s*$', '', s).strip()


def main():
    only = set(sys.argv[1:])
    files = sorted(glob.glob('data/*.json'))
    files = [f for f in files if os.path.basename(f) not in ('library.json', 'works-index.json')]
    if only:
        files = [f for f in files if os.path.splitext(os.path.basename(f))[0] in only]
    os.makedirs('data/proof', exist_ok=True)
    n_pass = n_block = 0
    for f in files:
        wid = os.path.splitext(os.path.basename(f))[0]
        try:
            d = json.load(open(f))
        except Exception as e:
            print(wid, 'SKIP', e, flush=True); continue
        items = d.get('verses') or d.get('chunks') or []
        out = {}
        for it in items:
            vid = it.get('id') or it.get('chunk')
            sa = (it.get('sa') or it.get('sanskrit') or '').strip()
            en = clean_en(it.get('l2') or it.get('l1') or '')
            if not vid or not sa or not en:
                continue
            if (it.get('gate') or 'BLOCKED') != 'PASS':
                continue
            try:
                p = verify_translation(sa, en)
            except Exception as e:
                print(wid, vid, 'gate ERR', str(e)[:100], flush=True); continue
            out[vid] = {
                'gate': p['deterministic_gate'],
                'blocking': p['blocking'],
                'checks': {k: bool(v['PASS']) for k, v in p['checks'].items()},
                'source_sha': p['source_sha'],
                'result_id': p['lineage']['result_id'],
                'model': it.get('model', ''), 'date': it.get('date', ''),
            }
            if p['deterministic_gate'] == 'PASS':
                n_pass += 1
            else:
                n_block += 1
        json.dump({'work': wid, 'verses': out}, open(f'data/proof/{wid}.json', 'w'), ensure_ascii=False, indent=0)
        print(wid, len(out), 'proofs', flush=True)
    print(f'PROOF PASS: {n_pass}  BLOCKED: {n_block}')


if __name__ == '__main__':
    main()
