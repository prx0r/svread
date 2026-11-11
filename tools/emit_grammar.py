#!/usr/bin/env python3
"""Emit vendored grammar packs for the Sanskrit wheels + word breakdowns.

Build-time only. Output is frozen bytes under data/grammar/, hash-pinned by
scripts/release_manifest.py like every other bundled asset.

Sources (read-only, never edited here):
  - Vidyut 0.4.0 prakriya (word generation + rule traces) + kosha data
  - bruno lab sutrapatha_merged.json (sutra code -> iast text, 3983 rules)
  - svread data/<work>.json + data/l0/<work>.json (scripture links)
  - svread data/sanskrit/index.json (lesson links)

Law:
  - Every derived surface must come from Vidyut. A failed derivation yields
    status PENDING with no trace -- never an invented prakriya.
  - Curated teaching notes are labelled curated-note, separate from traces.
  - Machine simplifications in the thesis table are corrected, not hidden
    (see NOTES: kim+tral fires 5.3.13; kim+thal yields katha, katham is 5.3.24-25 thamu;
    anya+tasil yields anyatah, the thesis table's anyatha is a typo).

Usage:
  python3 tools/emit_grammar.py            # writes data/grammar/*.json
  python3 tools/emit_grammar.py --check    # byte-identical check, no writes
"""
from __future__ import annotations
import argparse
import importlib.metadata
import json
import sys
from pathlib import Path

SVREAD = Path(__file__).resolve().parent.parent
BRUNO_DATA = Path('/root/bruno/sanskrit/lab/data/sutrapatha_merged.json')
KOSHA_DEFAULT = Path('/root/vidyut-0.4.0/kosha')

SUPPORTED_VIDYUT = '0.4.0'

# (base_slpi, taddhita_attr, entry_id, teaching_sutra, teaching_note)
MACHINE_A = [
    ('kim', 'tral', 'kim-tral', '5.3.10', 'place: tral (machine fires 5.3.13 on kim; 5.3.10 is the general adhikara)'),
    ('tad', 'tral', 'tad-tral', '5.3.10', 'place: tral'),
    ('yad', 'tral', 'yad-tral', '5.3.10', 'place: tral'),
    ('sarva', 'tral', 'sarva-tral', '5.3.10', 'place: tral'),
    ('anya', 'tral', 'anya-tral', '5.3.10', 'place: tral'),
    ('kim', 'dA', 'kim-da', '5.3.15', 'time: da'),
    ('tad', 'dA', 'tad-da', '5.3.15', 'time: da'),
    ('yad', 'dA', 'yad-da', '5.3.15', 'time: da'),
    ('sarva', 'dA', 'sarva-da', '5.3.15', 'time: da'),
    ('anya', 'dA', 'anya-da', '5.3.15', 'time: da'),
    ('kim', 'tasil', 'kim-tasil', '5.3.7', 'source: tasil'),
    ('tad', 'tasil', 'tad-tasil', '5.3.7', 'source: tasil'),
    ('yad', 'tasil', 'yad-tasil', '5.3.7', 'source: tasil'),
    ('sarva', 'tasil', 'sarva-tasil', '5.3.7', 'source: tasil'),
    ('anya', 'tasil', 'anya-tasil', '5.3.7', 'source: tasil (thesis table misprints anyatha; machine: anyatah)'),
    ('tad', 'TAl', 'tad-thal', '5.3.23', 'manner: thal (machine fires 5.3.25; 5.3.23 is the teaching ref)'),
    ('yad', 'TAl', 'yad-thal', '5.3.23', 'manner: thal (machine fires 5.3.25)'),
    ('sarva', 'TAl', 'sarva-thal', '5.3.23', 'manner: thal (machine fires 5.3.25)'),
    ('anya', 'TAl', 'anya-thal', '5.3.23', 'manner: thal (machine fires 5.3.25)'),
    ('kim', 'TAl', 'kim-thal', '5.3.23', 'manner: thal on kim yields katha, NOT katham (machine-verified); katham is the 5.3.24-25 thamu special'),
    # NOTE: atra (idam+tral) does not derive in Vidyut 0.4.0 (sarvanaman gap);
    # the sentence wheel defaults to tatra and marks atra PENDING elsewhere.
]

# katham is special: plain thal on kim yields katha, not katham.
KATHAM_NOTE = {
    'id': 'kim-katham',
    'iast': 'katham',
    'kind': 'curated-note',
    'status': 'CURATED',
    'teaching_sutra': '5.3.24-25',
    'note': ('katham is not the regular thal product: kim+thal derives katha '
             '(machine-verified). katham is kim+thamu per the special rules '
             '5.3.24 (idamas thamuh) and 5.3.25 (kimas ca). No machine trace claimed for katham itself.'),
}

# (purusha, vacana, entry_id_suffix)
AS_PARADIGM = [
    ('Uttama', 'Eka', 'asmi'), ('Madhyama', 'Eka', 'asi'), ('Prathama', 'Eka', 'asti'),
    ('Uttama', 'Dvi', 'asvas'), ('Madhyama', 'Dvi', 'asthas'), ('Prathama', 'Dvi', 'astas'),
    ('Uttama', 'Bahu', 'asmas'), ('Madhyama', 'Bahu', 'astha'), ('Prathama', 'Bahu', 'santi'),
]


def load_sutras() -> dict:
    merged = json.loads(BRUNO_DATA.read_text(encoding='utf-8'))
    out = {}
    for item in merged.get('items', []):
        code = item.get('sutra')
        if code and code not in out:
            out[code] = item.get('iast') or ''
    return out


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('--check', action='store_true')
    ap.add_argument('--kosha', default=str(KOSHA_DEFAULT))
    args = ap.parse_args()

    try:
        version = importlib.metadata.version('vidyut')
    except importlib.metadata.PackageNotFoundError:
        print('emit_grammar: vidyut package not installed', file=sys.stderr)
        return 1
    if version != SUPPORTED_VIDYUT:
        print(f'emit_grammar: expected vidyut {SUPPORTED_VIDYUT}, found {version}', file=sys.stderr)
        return 1
    from vidyut.lipi import transliterate, Scheme
    from vidyut.prakriya import Vyakarana, Pada, Pratipadika, Taddhita, Prayoga, Lakara, Purusha, Vacana

    kosha_path = Path(args.kosha)
    if not kosha_path.is_dir():
        print(f'emit_grammar: kosha data dir missing: {kosha_path}', file=sys.stderr)
        return 1
    from vidyut import kosha as kosha_mod
    k = kosha_mod.Kosha(str(kosha_path))
    v = Vyakarana()
    sutras = load_sutras()

    def ia(slp: str) -> str:
        try:
            return transliterate(slp, Scheme.Slp1, Scheme.Iast)
        except Exception:
            return slp

    def trace_of(prak) -> list:
        steps = []
        for st in prak.history:
            code = getattr(st, 'code', '')
            res = getattr(st, 'result', '')
            if isinstance(res, list):
                after = ' + '.join(ia(x) if isinstance(x, str) else str(x) for x in res)
            elif isinstance(res, str):
                after = ia(res)
            else:
                after = str(res)
            steps.append({'sutra': str(code), 'sutra_iast': sutras.get(str(code), ''),
                          'after': after})
        return steps

    def deva(iast: str) -> str:
        try:
            return transliterate(iast, Scheme.Iast, Scheme.Devanagari)
        except Exception:
            return iast

    entries: list = []

    # ---- Machine A: taddhita derivations ----
    for base_slp1, tattr, eid, teaching, note in MACHINE_A:
        ent = {'id': eid, 'kind': 'taddhita', 'base_slpi': base_slp1,
               'ending': tattr, 'teaching_sutra': teaching,
               'teaching_sutra_iast': sutras.get(teaching, ''),
               'curated_note': note}
        try:
            t = getattr(Taddhita, tattr)
            pp = Pratipadika.taddhitanta(Pratipadika.basic(base_slp1), t)
            res = v.derive(Pada.make_avyaya(pp))
            if not res:
                raise ValueError('empty derivation')
            r = res[0]
            ent['iast'] = ia(r.text)
            ent['deva'] = deva(ent['iast'])
            ent['surface_slpi'] = r.text
            ent['all_surfaces'] = []
            for r2 in res[:4]:
                _s2 = ia(r2.text)
                if _s2 not in [x['iast'] for x in ent['all_surfaces']]:
                    ent['all_surfaces'].append({'iast': _s2, 'deva': deva(_s2),
                                                'slp1': r2.text})
            ent['prakriya'] = trace_of(r)
            ent['machine_rules'] = sorted({s['sutra'] for s in ent['prakriya'] if s['sutra'].startswith(('5.', '7.', '8.'))})
            ent['status'] = 'DERIVED'
        except Exception as exc:
            ent['iast'] = ''
            ent['deva'] = ''
            ent['prakriya'] = []
            ent['machine_rules'] = []
            ent['status'] = f'PENDING ({exc})'
        entries.append(ent)
    entries.append(KATHAM_NOTE)

    # ---- Machine B: as/Lat paradigm (Adadi, Bhuvi) ----
    as_entry = None
    for d in k.dhatus():
        s = str(d)
        if "aupadeshika='asa~'" in s and 'Adadi' in s:
            as_entry = d
            break
    if as_entry is None:
        print('emit_grammar: as/Adadi dhatu not found in kosha', file=sys.stderr)
        return 1
    dhatu_args = as_entry.to_prakriya_args()
    for pur_s, vac_s, suffix in AS_PARADIGM:
        eid = f'as-lat-{pur_s}-{vac_s}'
        ent = {'id': eid, 'kind': 'tinanta', 'dhatu': 'as (Adadi, Bhuvi: to be)',
               'lakara': 'Lat (present)', 'purusha': pur_s, 'vacana': vac_s}
        try:
            p = Pada.Tinanta(dhatu_args, Prayoga.Kartari, Lakara.Lat,
                             getattr(Purusha, pur_s), getattr(Vacana, vac_s))
            res = v.derive(p)
            if not res:
                raise ValueError('empty derivation')
            r = res[0]
            ent['iast'] = ia(r.text)
            ent['deva'] = deva(ent['iast'])
            ent['surface_slpi'] = r.text
            ent['all_surfaces'] = []
            for r2 in res[:4]:
                _s2 = ia(r2.text)
                if _s2 not in [x['iast'] for x in ent['all_surfaces']]:
                    ent['all_surfaces'].append({'iast': _s2, 'deva': deva(_s2),
                                                'slp1': r2.text})
            ent['prakriya'] = trace_of(r)
            ent['machine_rules'] = sorted({s['sutra'] for s in ent['prakriya'] if s['sutra'].startswith(('3.', '7.', '8.'))})
            ent['status'] = 'DERIVED'
        except Exception as exc:
            ent['iast'] = ''
            ent['deva'] = ''
            ent['prakriya'] = []
            ent['machine_rules'] = []
            ent['status'] = f'PENDING ({exc})'
        entries.append(ent)

    # ---- pronouns + kinship (Machine B subjects / possessors) ----
    # SLP1 bases; expected surfaces recorded as teaching checks, but the entry
    # is DERIVED only if the machine surface matches exactly.
    PERSONS = [
        ('asmad', 'Pum', 'Prathama', 'Eka', 'aham', 'pers-pron-1sg-nom', '1st sg nominative: pairs with asmi, unmarked adjective'),
        ('yuzmad', 'Pum', 'Prathama', 'Eka', 'tvam', 'pers-pron-2sg-nom', '2nd sg nominative: pairs with asi'),
        ('asmad', 'Pum', 'Sasthi', 'Eka', 'mama', 'pers-pron-1sg-gen', '1st sg genitive (possessor): mama mata'),
        ('yuzmad', 'Pum', 'Sasthi', 'Eka', 'tava', 'pers-pron-2sg-gen', '2nd sg genitive (possessor)'),
        ('tad', 'Pum', 'Sasthi', 'Eka', 'tasya', 'pers-pron-3sg-gen', '3rd sg genitive (possessor)'),
        ('mAtf', 'Stri', 'Prathama', 'Eka', 'mAtA', 'kin-mata-nom', 'mother, fem nom sg: pairs with asti + sukhini'),
        ('pitf', 'Pum', 'Prathama', 'Eka', 'pitA', 'kin-pita-nom', 'father, masc nom sg: pairs with asti + sukhi'),
        # object / locus nouns for the karaka level (ESG Topic III examples)
        ('grAma', 'Pum', 'Dvitiya', 'Eka', 'grAmam', 'noun-grama-acc', 'village, acc sg: gramam gacchami (karman)'),
        ('grAma', 'Pum', 'Panchami', 'Eka', 'grAmAt', 'noun-grama-abl', 'village, abl sg: gramat agacchami (apadana)'),
        ('grAma', 'Pum', 'Saptami', 'Eka', 'grAme', 'noun-grama-loc', 'village, loc sg: grame asmi (adhikarana)'),
        ('manas', 'Napumsaka', 'Trtiya', 'Eka', 'manasA', 'noun-manas-inst', 'mind, inst sg: means (karana)'),
        ('pitf', 'Pum', 'Caturthi', 'Eka', 'pitre', 'kin-pita-dat', 'father, dat sg: recipient (sampradana); giving verbs later'),
    ]
    for base_slp1, linga_s, vib_s, vac_s, expect_slp1, eid, agree in PERSONS:
        ent = {'id': eid, 'kind': 'subanta', 'pratipadika_slpi': base_slp1,
               'linga': linga_s, 'vibhakti': vib_s, 'vacana': vac_s,
               'curated_note': agree, 'expected_slpi': expect_slp1}
        try:
            from vidyut.prakriya import Linga, Vibhakti
            pp = Pratipadika.basic(base_slp1)
            p = Pada.Subanta(pp, getattr(Linga, linga_s), getattr(Vibhakti, vib_s),
                             getattr(Vacana, vac_s))
            res = v.derive(p)
            if not res:
                raise ValueError('empty derivation')
            r = res[0]
            if r.text != expect_slp1:
                raise ValueError(f'surface {r.text!r} != expected {expect_slp1!r}')
            ent['iast'] = ia(r.text)
            ent['deva'] = deva(ent['iast'])
            ent['surface_slpi'] = r.text
            ent['all_surfaces'] = []
            for r2 in res[:4]:
                _s2 = ia(r2.text)
                if _s2 not in [x['iast'] for x in ent['all_surfaces']]:
                    ent['all_surfaces'].append({'iast': _s2, 'deva': deva(_s2),
                                                'slp1': r2.text})
            ent['prakriya'] = trace_of(r)
            ent['machine_rules'] = sorted({s['sutra'] for s in ent['prakriya'] if s['sutra'].startswith(('4.', '7.', '8.'))})
            ent['status'] = 'DERIVED'
        except Exception as exc:
            ent['iast'] = ''
            ent['deva'] = ''
            ent['prakriya'] = []
            ent['machine_rules'] = []
            ent['status'] = f'PENDING ({exc})'
        entries.append(ent)
    for linga_s, eid, agree in [('Pum', 'sukhin-pum-nom-sg', 'masculine nominative singular: pairs with aham (unmarked)'),
                                ('Stri', 'sukhin-stri-nom-sg', 'feminine nominative singular: pairs with mata (mama mata ... asti)')]:
        ent = {'id': eid, 'kind': 'subanta', 'pratipadika': 'sukhin (happy)',
               'linga': linga_s, 'vibhakti': 'Prathama', 'vacana': 'Eka',
               'curated_note': agree}
        try:
            from vidyut.prakriya import Linga, Vibhakti
            pp = Pratipadika.basic('suKin')
            p = Pada.Subanta(pp, getattr(Linga, linga_s), Vibhakti.Prathama, Vacana.Eka)
            res = v.derive(p)
            if not res:
                raise ValueError('empty derivation')
            r = res[0]
            ent['iast'] = ia(r.text)
            ent['deva'] = deva(ent['iast'])
            ent['surface_slpi'] = r.text
            ent['all_surfaces'] = []
            for r2 in res[:4]:
                _s2 = ia(r2.text)
                if _s2 not in [x['iast'] for x in ent['all_surfaces']]:
                    ent['all_surfaces'].append({'iast': _s2, 'deva': deva(_s2),
                                                'slp1': r2.text})
            ent['prakriya'] = trace_of(r)
            ent['machine_rules'] = sorted({s['sutra'] for s in ent['prakriya'] if s['sutra'].startswith(('4.', '7.', '8.'))})
            ent['status'] = 'DERIVED'
        except Exception as exc:
            ent['iast'] = ''
            ent['deva'] = ''
            ent['prakriya'] = []
            ent['machine_rules'] = []
            ent['status'] = f'PENDING ({exc})'
        entries.append(ent)

    pack = {
        'format': 'svatantrya.grammar-pack/1',
        'status': 'machine-generated-unreviewed',
        'generator': {'name': 'vidyut', 'version': version,
                      'kosha': str(kosha_path),
                      'sutra_text': 'bruno lab sutrapatha_merged.json (Vidyut sutrapatha + GRETIL when present)'},
        'warning': ('Computational candidates only. Every trace is machine output, '
                    'not a verified derivation and not a publication. Ghatakarpara '
                    'forms are excluded pending the source-alignment repair.'),
        'entries': entries,
    }

    # ---- scripture links: which pack forms occur in reader bundles / L0 / lessons ----
    surf_to_ids: dict = {}
    for e in entries:
        for key in ('iast',):
            s = (e.get(key) or '').strip().lower()
            if s:
                surf_to_ids.setdefault(s, []).append(e['id'])
        dv = (e.get('deva') or '').strip()
        if dv:
            surf_to_ids.setdefault('deva:' + dv, []).append(e['id'])
    links = build_links(surf_to_ids)

    out_dir = SVREAD / 'data' / 'grammar'
    files = {
        'wheel-pack.json': pack,
        'wheel-links.json': links,
    }
    if args.check:
        ok = True
        for name, obj in files.items():
            p = out_dir / name
            if not p.exists():
                print(f'emit_grammar --check: missing {name}', file=sys.stderr)
                ok = False
                continue
            want = json.dumps(obj, ensure_ascii=False, sort_keys=True, indent=2) + '\n'
            if p.read_text(encoding='utf-8') != want:
                print(f'emit_grammar --check: {name} differs', file=sys.stderr)
                ok = False
        return 0 if ok else 1
    out_dir.mkdir(parents=True, exist_ok=True)
    for name, obj in files.items():
        (out_dir / name).write_text(
            json.dumps(obj, ensure_ascii=False, sort_keys=True, indent=2) + '\n',
            encoding='utf-8')
    n_der = sum(1 for e in entries if e.get('status') == 'DERIVED')
    print(f'emit_grammar: {len(entries)} entries, {n_der} DERIVED; links for {len(links["links"])} entries')
    return 0


def build_links(surf_to_ids: dict) -> dict:
    """Map pack surfaces to reader verses (deva substring / L0 iast token)."""
    links: dict = {}
    data = SVREAD / 'data'
    works = sorted(p for p in data.glob('*.json')
                   if p.name not in ('biblio.json', 'formal.json')
                   and not p.name.startswith(('traces', 'verify', 'grammar')))
    # lesson index: work -> lesson ids
    lesson_idx = {}
    try:
        sidx = json.loads((data / 'sanskrit' / 'index.json').read_text(encoding='utf-8'))
        for les in sidx.get('lessons', []):
            lesson_idx.setdefault(les.get('work'), []).append(les.get('id'))
    except Exception:
        pass
    l0_cache: dict = {}
    for wf in works:
        try:
            bundle = json.loads(wf.read_text(encoding='utf-8'))
        except Exception:
            continue
        if isinstance(bundle, list):
            work = wf.stem
            verses = bundle
        elif isinstance(bundle, dict):
            work = bundle.get('work') or wf.stem
            verses = bundle.get('verses') or bundle.get('chunks') or []
        else:
            continue
        l0f = data / 'l0' / f'{work}.json'
        toks_by_verse: dict = {}
        if l0f.exists():
            try:
                l0 = json.loads(l0f.read_text(encoding='utf-8'))
                for vv in l0.get('verses', []):
                    toks_by_verse[vv.get('id')] = [t.get('iast', '').lower() for t in vv.get('tokens', [])]
            except Exception:
                pass
        for vs in verses:
            if not isinstance(vs, dict):
                continue
            vid = vs.get('id') or vs.get('chunk') or ''
            sa = vs.get('sa') or vs.get('sanskrit') or ''
            toks = toks_by_verse.get(vid, [])
            for surf, ids in surf_to_ids.items():
                hit = False
                if surf.startswith('deva:'):
                    if surf[5:] and surf[5:] in sa:
                        hit = True
                elif surf and (surf in toks or surf in sa.lower()):
                    hit = True
                if hit:
                    for eid in ids:
                        links.setdefault(eid, {'verses': [], 'lessons': []})
                        ref = {'work': work, 'verse': vid}
                        if ref not in links[eid]['verses']:
                            links[eid]['verses'].append(ref)
    for eid, lk in links.items():
        works_hit = {r['work'] for r in lk['verses']}
        lk['verses'] = sorted(lk['verses'], key=lambda r: (r['work'], r['verse']))[:12]
        les = []
        for w in sorted(works_hit):
            les.extend(lesson_idx.get(w, []))
        lk['lessons'] = sorted(set(les))
    return {'format': 'svatantrya.wheel-links/1',
            'status': 'machine-generated-unreviewed',
            'warning': 'Substring/token matches only; a match is not a grammatical attestation.',
            'links': links}


if __name__ == '__main__':
    raise SystemExit(main())
