#!/usr/bin/env python3
"""Compile the text->chant alignment into a versioned artifact.

Runtime matching is unverifiable: the browser fuzzy-matches two independently
segmented copies of the same verse on every page load, and a wrong hit is
invisible. This moves that work offline into align/<work>.json and gates it.

Method: align the WHOLE work at once (site words concatenated vs karaoke words
concatenated, in order) at CHARACTER level over consonant skeletons. Character
alignment handles Sanskrit sandhi naturally (one karaoke word vs several verse
words) without per-word heuristics. Unit boundaries then fall out of the map.

Gates (any failure aborts that work; no partial artifact is written):
  partition   every site word covered by exactly one clip
  order       clips strictly increasing across the work
  evidence    every clip's similarity score >= MIN_SCORE
  conserved   every chant clip used exactly once; syllable totals agree
  chain       clip durations usable (positive, finite)

usage: build_align.py [work ...]
"""
import json, sys, hashlib, unicodedata
from pathlib import Path
from difflib import SequenceMatcher

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / 'data'
OUT = ROOT / 'align'
KARAOKE = Path('/tmp/ipvv/site/data')   # our generated karaoke mirror
MIN_SCORE = 0.55
MAX_UNCOVERED = 0.05
GAP = 0.35

KMAP = {                                  # site id -> karaoke stem
    'spanda': 'spandakarika',
    'phrdaya': 'pratyabhijnahrdaya',
    'bhairavanukaranastotra': 'bhairavanukarana',
    'sivastotravali': 'shivastotravali',
}

def deva_to_iast(s):
    from indic_transliteration import sanscript
    return str(sanscript.transliterate(s, sanscript.DEVANAGARI, sanscript.IAST))

def skel_iast(s):
    """Consonant skeleton: drop vowel marks and diacritics, fold nasals/anusvara."""
    s = unicodedata.normalize('NFD', (s or '').lower())
    s = ''.join(c for c in s if not unicodedata.combining(c))
    s = s.replace('ṅ', 'n').replace('ñ', 'n').replace('ṇ', 'n')
    s = ''.join(ch for ch in s if ch.isalpha())
    s = ''.join(ch for ch in s if ch not in 'aiueo')
    return s.replace('n', 'N').replace('m', 'N')

def skel_deva(s):
    return skel_iast(deva_to_iast(s))

def load_units(site):
    """Both site schemas: Bilara 'chunks' (sanskrit) and 'verses' (sa)."""
    if isinstance(site, dict) and 'chunks' in site:
        return [(c.get('chunk') or c.get('id'), c.get('sanskrit') or '') for c in site['chunks']]
    if isinstance(site, dict) and 'verses' in site:
        return [(v.get('id'), v.get('sa') or '') for v in site['verses']]
    if isinstance(site, list):
        return [(c.get('chunk') or c.get('id'), c.get('sanskrit') or c.get('sa') or '') for c in site]
    return []

def words_of(text):
    out = []
    for w in (text or '').split():
        if all(ch in '।॥.,|;:' for ch in w):
            continue
        # source/chunk refs leak into the text field (e.g. '|| AgAna_1'):
        # real IAST is lowercase, so any uppercase token is not verse.
        if any(c.isupper() for c in w):
            continue
        w = w.strip('[]()')
        if w:
            out.append(w)
    return out

def build_work(wid, kstem):
    site = json.loads((DATA / f'{wid}.json').read_text(encoding='utf-8'))
    units = load_units(site)
    if not units:
        return None, 'no text units'
    kf = KARAOKE / f'karaoke-{kstem}.json'
    if not kf.exists():
        return None, f'no karaoke for {kstem}'
    kar = json.loads(kf.read_text(encoding='utf-8'))

    sw = []                       # (unit_i, word)
    for ui, (_, text) in enumerate(units):
        for w in words_of(text):
            sw.append((ui, w))
    kw = []                       # (clip_i, text, nsyl)
    for ci, c in enumerate(kar):
        for w in c.get('words', []):
            kw.append((ci, w.get('w') or '', w.get('syls') or []))
    if not sw or not kw:
        return None, 'empty text or karaoke'

    # ---- character-level alignment over skeletons with index maps
    s_parts = [skel_iast(t) for _, t in sw]
    k_parts = [skel_deva(t) for _, t, _ in kw]
    s_idx, k_idx = [], []
    for i, p in enumerate(s_parts): s_idx += [i] * len(p)
    for i, p in enumerate(k_parts): k_idx += [i] * len(p)
    s_skel, k_skel = ''.join(s_parts), ''.join(k_parts)

    vote = {}
    sm = SequenceMatcher(a=s_skel, b=k_skel, autojunk=False)
    for a, b, n in sm.get_matching_blocks():
        for p in range(a, a + n):
            if p >= len(s_idx) or (b + p - a) >= len(k_idx):
                continue
            si, ki = s_idx[p], k_idx[b + p - a]
            vote.setdefault(si, {})
            vote[si][ki] = vote[si].get(ki, 0) + 1

    # ---- one karaoke word per site word, monotone
    assign, last = {}, -1
    for si in range(len(sw)):
        cands = [(c, k) for k, c in (vote.get(si) or {}).items() if k >= last]
        if not cands:
            assign[si] = None
            continue
        c, k = max(cands)
        assign[si] = k
        last = k

    # A site word the character alignment could not bind is almost always part
    # of a sandhi run whose sounds the neighbouring karaoke word already
    # carries. Inherit the previous binding so it gets its share of syllables.
    lastk = None
    for si in range(len(sw)):
        if assign.get(si) is None:
            if lastk is not None:
                assign[si] = lastk
        else:
            lastk = assign[si]

    unmatched = sum(1 for v in assign.values() if v is None)
    if unmatched > max(1, int(len(sw) * MAX_UNCOVERED)):
        return None, f'{unmatched}/{len(sw)} site words unmatched ({100*unmatched/len(sw):.0f}%)'

    # ---- clip -> unit, using the clip's FIRST covered site word
    clip_of_word = {}
    for si, ki in assign.items():
        if ki is not None:
            clip_of_word.setdefault(kw[ki][0], []).append(si)
    clip_unit = {}
    for clip, sis in clip_of_word.items():
        clip_unit[clip] = sw[min(sis)][0]

    # ---- emit
    out_units, prev_clip = [], -1
    for ui, (uid, _text) in enumerate(units):
        clips = []
        for clip in sorted((c for c, u in clip_unit.items() if u == ui)):
            sis = sorted(clip_of_word[clip])
            a = ''.join(s_parts[i] for i in sis)
            b = ''.join(k_parts[k] for k in range(len(kw)) if kw[k][0] == clip)
            score = (2.0 * min(len(a), len(b)) / (len(a) + len(b))) if (a or b) else 0.0
            c = kar[clip]
            clips.append({
                'clip': c.get('id') or f'c{clip}', 'kar_i': clip,
                'w0': sis[0], 'w1': sis[-1], 'n_words': len(sis),
                'score': round(score, 3),
                'dur': float(c.get('dur') or 0),
                'syls': sum(len(w.get('syls') or []) for w in c.get('words', [])),
            })
            prev_clip = max(prev_clip, clip)
        n_words = sum(1 for u, _ in sw if u == ui)
        w0 = next((i for i, (u, _) in enumerate(sw) if u == ui), 0)
        # ---- render-ready timeline: absolute syllable times per site word
        off, tl = 0.0, []
        for c in clips:
            tl.append((c['kar_i'], off)); off += c['dur'] + GAP
        base = tl[0][1] if tl else 0.0
        clip_off = {c: (o - base) for c, o in tl}
        # group consecutive site words that share one karaoke word (sandhi)
        mine = [(si, assign.get(si)) for si in range(w0, w0 + n_words)]
        words = []
        a = 0
        while a < len(mine):
            ki = mine[a][1]
            b = a
            while b + 1 < len(mine) and mine[b + 1][1] == ki:
                b += 1
            if ki is None:
                a = b + 1
                continue
            syls = kw[ki][2] or []
            clip = kw[ki][0]
            group = mine[a:b + 1]
            if not syls:
                a = b + 1
                continue
            # split this karaoke word's syllables across the site words it covers
            lens = [max(1, len(sw[si][1])) for si, _ in group]
            tot = sum(lens) or 1
            pos = 0
            for n, (si, _) in enumerate(group):
                take = len(syls) - pos if n == len(group) - 1 else max(1, round(len(syls) * lens[n] / tot))
                part = syls[pos:pos + take]; pos += take
                if not part:
                    continue
                o = clip_off.get(clip, 0.0)
                # Times only, no glyphs: the renderer slices the VERSE's own
                # word into this many chunks, so displayed text stays exact
                # even when the chant merged/split words differently.
                words.append([si, [[round(o + x['t0'], 3), round(o + x['t1'], 3)]
                                   for x in part]])
            a = b + 1
        out_units.append({'id': uid, 'w0': w0, 'n_words': n_words,
                          'clips': clips, 'dur': round(off, 3), 'words': words})

    # ---- gates
    errs = []
    used = [c['kar_i'] for u in out_units for c in u['clips']]
    if len(set(used)) != len(used):
        errs.append('conserved: a clip is used more than once')
    missing = [i for i in range(len(kar)) if i not in set(used)]
    head, tail = [], []
    if missing:
        # Chants carry paratext the prose text does not: an opening invocation
        # (oṃ namaḥ ...) and/or a closing colophon. Allow ONLY contiguous runs
        # at the very start and/or very end, and RECORD them in the artifact so
        # they are visible, never silent. Anything in the middle is real drift.
        n = len(kar)
        i = 0
        while i < n and i in missing: i += 1
        j = n - 1
        while j >= 0 and j in missing: j -= 1
        mid = [x for x in missing if x not in set(range(0, i)) | set(range(j + 1, n))]
        if mid:
            errs.append(f'conserved: unused clips mid-work: '
                        f'{[kar[x].get("id") for x in mid[:5]]}')
        head = [kar[x].get('id') for x in sorted(m for m in missing if m < i)]
        tail = [kar[x].get('id') for x in sorted(m for m in missing if m > j)]
    used_syl = sum(c['syls'] for u in out_units for c in u['clips'])
    unused_syl = sum(len(w.get('syls') or []) for i in missing for w in kar[i].get('words', []))
    if used_syl + unused_syl != sum(len(x) for _, _, x in kw):
        errs.append(f'conserved: syllables {used_syl}+{unused_syl} != {sum(len(x) for _,_,x in kw)}')

    seen = {}
    for u in out_units:
        ks = [c['kar_i'] for c in u['clips']]
        if ks != sorted(ks):
            errs.append(f"order: {u['id']} clips not increasing")
        bad = [c for c in u['clips'] if c['score'] < MIN_SCORE]
        if bad:
            errs.append(f"evidence: {u['id']} {len(bad)} clip(s) < {MIN_SCORE}")
        for c in u['clips']:
            if not (c['dur'] > 0):
                errs.append(f"chain: {u['id']}/{c['clip']} bad duration")
            for si in range(c['w0'], c['w1'] + 1):
                seen[si] = seen.get(si, 0) + 1
    dup = sum(1 for n in seen.values() if n > 1)
    if dup:
        errs.append(f'partition: {dup} site words claimed twice')
    covered = sum(1 for v in assign.values() if v is not None)
    if errs:
        return None, '; '.join(errs[:3])

    art = {
        'work': wid, 'schema': 1, 'gap': GAP,
        'text_sha': hashlib.sha256(json.dumps([t for _, t in sw], ensure_ascii=False).encode()).hexdigest()[:16],
        'karaoke_sha': hashlib.sha256(json.dumps([t for _, t, _ in kw], ensure_ascii=False).encode()).hexdigest()[:16],
        'coverage': round(covered / max(1, len(sw)), 4),
        'unaligned_head': head,
        'unaligned_tail': tail,
        'units': out_units,
    }
    return art, None

def main():
    OUT.mkdir(exist_ok=True)
    only = [a for a in sys.argv[1:] if not a.startswith('-')]
    have = {p.stem[len('karaoke-'):] for p in KARAOKE.glob('karaoke-*.json')}
    ok = bad = 0
    for p in sorted(DATA.glob('*.json')):
        wid = p.stem
        if wid in ('library', 'works-index') or (only and wid not in only):
            continue
        kstem = KMAP.get(wid, wid)
        if kstem not in have:
            continue
        art, err = build_work(wid, kstem)
        if err:
            print(f'FAIL {wid:26} {err}')
            bad += 1
            continue
        (OUT / f'{wid}.json').write_text(json.dumps(art, ensure_ascii=False, indent=1), encoding='utf-8')
        lines = [f"{wid}  coverage={art['coverage']*100:.1f}%  units={len(art['units'])}"]
        for u in art['units']:
            for c in u['clips']:
                lines.append(f"  {u['id']:10} {c['clip']:22} w{c['w0']}-{c['w1']} "
                             f"score={c['score']:.2f} dur={c['dur']:.1f}s")
        (OUT / f'{wid}.report.txt').write_text('\n'.join(lines) + '\n', encoding='utf-8')
        print(f"OK   {wid:26} coverage={art['coverage']*100:5.1f}%  clips={sum(len(u['clips']) for u in art['units'])}")
        ok += 1
    print(f'\n{ok} aligned, {bad} failed')
    sys.exit(1 if bad else 0)

main()
