"""Batch morphology for svread, v2: Vidyut-first (fast, MIT), tagger-fallback (neural).
Vidyut resolves stems/segmentations; anything left lemma-less goes to sanskrit-tagger
in a few big batches. Resumable: skips works with finished JSON. CPU only.

Output: data/morph/<wid>.json {work, verses:[{id, seg, tags:{word:{src,pos,morph}}}]}
src = vidyut | tagger. key_terms gloss stays the display fallback in app.js.

Usage: nohup python3 scripts/batch_morph.py > /tmp/morph.log 2>&1 &
"""
import json, glob, os, re, sys

def clean_sa(s):
    s = re.sub(r'^# Text\s*', '', s or '')
    s = re.sub(r'\[[A-Za-z0-9_]+\]', '', s)
    return re.sub(r'\s+', ' ', s).strip()

def load_works(only):
    files = sorted(glob.glob('data/*.json'))
    files = [f for f in files if os.path.basename(f) not in ('library.json', 'works-index.json')]
    if only:
        files = [f for f in files if os.path.splitext(os.path.basename(f))[0] in only]
    works = []
    for f in files:
        wid = os.path.splitext(os.path.basename(f))[0]
        try:
            d = json.load(open(f))
        except Exception as e:
            print(wid, 'SKIP json', e, flush=True); continue
        items = d.get('verses') or d.get('chunks') or []
        recs = []
        for it in items:
            vid = it.get('id') or it.get('chunk')
            sa = clean_sa(it.get('sa') or it.get('sanskrit') or '')
            if vid and sa:
                recs.append((vid, sa))
        if recs:
            works.append((wid, recs))
    return works

def main():
    only = set(sys.argv[1:])
    os.makedirs('data/morph', exist_ok=True)
    works = load_works(only)
    todo = [(w, r) for w, r in works if not os.path.exists(f'data/morph/{w}.json')]
    print(f'{len(works)} works, {len(todo)} todo', flush=True)
    if not todo:
        return

    sys.path.insert(0, '/root/patalacheckpoints/pipeline')
    from verify_l0_p2 import vidyut_analyze
    uniq = {}
    for wid, recs in todo:
        for vid, sa in recs:
            for w in sa.split():
                uniq.setdefault(w, []).append((wid, vid))
    print(f'{len(uniq)} unique words -> vidyut', flush=True)
    vres = {}
    for i, w in enumerate(sorted(uniq)):
        try:
            vres[w] = vidyut_analyze(w)
        except Exception as e:
            vres[w] = [{'error': str(e)[:60]}]
        if (i + 1) % 2000 == 0:
            print(f'  vidyut {i+1}/{len(uniq)}', flush=True)

    need = sorted({w for w, a in vres.items()
                   if not a or any('error' in x for x in a) or not any(x.get('lemma') for x in a)})
    print(f'{len(need)} words need tagger', flush=True)
    tres = {}
    if need:
        import torch
        from sanskrit_tagger import tagger_factory
        m1 = torch.hub.load('koleslena/sanskrit_nlp_models', 'pos_tagger_model', trust_repo=True)
        tagger = tagger_factory.get_pos_tagger(m1)
        B = 64
        for i in range(0, len(need), B):
            chunk = need[i:i + B]
            try:
                out = tagger(chunk)
            except Exception as e:
                print('tagger chunk ERR', str(e)[:100], flush=True)
                continue
            for w, t in zip(chunk, out):
                tres[w] = (t[0] if isinstance(t, list) and t else str(t))
            print(f'  tagger {min(i+B, len(need))}/{len(need)}', flush=True)

    per_work = {}
    for wid, recs in todo:
        vw = []
        for vid, sa in recs:
            tags = {}
            for w in sa.split():
                a = vres.get(w, [])
                lem = next((x.get('lemma') for x in a if x.get('lemma')), None)
                if lem:
                    tags[w] = {'src': 'vidyut', 'lemma': lem}
                elif w in tres:
                    tags[w] = {'src': 'tagger', 'pos': tres[w]}
                else:
                    tags[w] = {'src': 'none'}
            vw.append({'id': vid, 'tags': tags})
        per_work[wid] = vw
        json.dump({'work': wid, 'verses': vw}, open(f'data/morph/{wid}.json', 'w'), ensure_ascii=False, indent=0)
        n_cov = sum(1 for v in vw for t in v['tags'].values() if t['src'] != 'none')
        n_all = sum(len(v['tags']) for v in vw)
        print(wid, f'{len(vw)} verses, coverage {n_cov}/{n_all}', flush=True)

if __name__ == '__main__':
    main()
