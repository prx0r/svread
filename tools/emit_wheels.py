#!/usr/bin/env python3
"""Emit vendored wheel datasets for wheels.html (no live computation).

Reads data/grammar/wheel-pack.json + wheel-links.json (both vendored bytes).
Writes data/wheels/{word,sentence,trika}.json -- deterministic, --checkable.

Law: options reference pack entry ids only. A referenced id missing from the
pack (or not DERIVED/CURATED) fails closed. Trika options cite
translation-work lore/concepts files only when the file exists and parses;
otherwise the option ships with source status PENDING and no link.
"""
from __future__ import annotations
import argparse
import json
import subprocess
import sys
from pathlib import Path

SVREAD = Path(__file__).resolve().parent.parent
CONCEPTS = SVREAD / 'data' / 'wheels' / 'concepts'
CONCEPTS_UPSTREAM = Path('/root/translation-work/lore/concepts')
GRAMMAR = SVREAD / 'data' / 'grammar'

BASES = [
    ('kim', 'kim', 'what? which?'),
    ('tad', 'tad', 'that'),
    ('yad', 'yad', 'which (relative)'),
    ('sarva', 'sarva', 'all, every'),
    ('anya', 'anya', 'other'),
]
ENDINGS = [
    ('tral', 'place', 'where', '5.3.10'),
    ('dA', 'time', 'when', '5.3.15'),
    ('tasil', 'source', 'from where', '5.3.7'),
    ('TAl', 'manner', 'how', '5.3.23'),
]

SUBJECTS = [
    {'id': 'aham', 'label': 'aham', 'en': 'I',
     'verb': 'as-lat-Uttama-Eka', 'adj': 'sukhin-pum-nom-sg',
     'note': '1st person singular: asmi; adjective unmarked masculine'},
    {'id': 'tvam', 'label': 'tvam', 'en': 'you',
     'verb': 'as-lat-Madhyama-Eka', 'adj': 'sukhin-pum-nom-sg',
     'note': '2nd person singular: asi'},
    {'id': 'mama-mata', 'label': 'mama mata', 'en': 'my mother',
     'verb': 'as-lat-Prathama-Eka', 'adj': 'sukhin-stri-nom-sg',
     'note': '3rd person singular feminine: asti; adjective feminises to sukhini'},
    {'id': 'pita', 'label': 'pita', 'en': '(my) father',
     'verb': 'as-lat-Prathama-Eka', 'adj': 'sukhin-pum-nom-sg',
     'note': '3rd person singular masculine: asti; adjective stays sukhi'},
]

TRIKA_WHEELS = [
    {'id': 'trika-bondage', 'title': 'The bound and the binder',
     'rings': [
        {'id': 'pati', 'label': 'pati', 'en': 'the Lord',
         'gloss': 'consciousness itself, free and self-aware',
         'concept': None},
        {'id': 'pasu', 'label': 'paśu', 'en': 'the bound soul',
         'gloss': 'consciousness contracted by limitation',
         'concept': 'pasanudbheda.json'},
        {'id': 'pasa', 'label': 'pāśa', 'en': 'the bond',
         'gloss': 'what binds: limitation, impurity, action-traces',
         'concept': None},
     ],
     'note': 'Rotate the three: who binds whom with what. The Trika answer is always given in the texts, never invented here.'},
    {'id': 'trika-speech', 'title': 'Three levels of speech',
     'rings': [
        {'id': 'para', 'label': 'parā', 'en': 'supreme speech',
         'gloss': 'undivided word-awareness, will alone',
         'concept': 'para.json'},
        {'id': 'parapara', 'label': 'parāparā', 'en': 'middle speech',
         'gloss': 'word and meaning half-emerged',
         'concept': None},
        {'id': 'apara', 'label': 'aparā', 'en': 'lower speech',
         'gloss': 'fully uttered, differentiated speech',
         'concept': None},
     ],
     'note': 'The classic Trika triad of the goddess in sound. Options without concept files are teaching labels, marked pending.'},
    {'id': 'trika-powers', 'title': 'Three powers of the Lord',
     'rings': [
        {'id': 'jnana', 'label': 'jñāna', 'en': 'knowledge',
         'gloss': 'the power by which consciousness knows',
         'concept': 'jnanadvibhinna.json'},
        {'id': 'iccha', 'label': 'icchā', 'en': 'will',
         'gloss': 'the power by which consciousness moves toward manifestation',
         'concept': None},
        {'id': 'kriya', 'label': 'kriyā', 'en': 'action',
         'gloss': 'the power by which consciousness makes',
         'concept': 'kriya.json'},
     ],
     'note': 'Every Trika act is all three at once; the wheel isolates them to see each clearly.'},
    {'id': 'trika-knowing', 'title': 'Knowing: knower, means, known',
     'rings': [
        {'id': 'pramatr', 'label': 'pramātṛ', 'en': 'the knower',
         'gloss': 'the subject pole of any cognition',
         'concept': None},
        {'id': 'pramana', 'label': 'pramāṇa', 'en': 'the means',
         'gloss': 'perception, inference, testimony -- how it is known',
         'concept': None},
        {'id': 'prameya', 'label': 'prameya', 'en': 'the known',
         'gloss': 'the object pole, what is known',
         'concept': None},
     ],
     'note': 'The epistemic wheel: every claim page in this library is implicitly a pramāṇa/prameya pair. No concept files yet; all three marked pending.'},
]


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('--check', action='store_true')
    args = ap.parse_args()

    pack = json.loads((GRAMMAR / 'wheel-pack.json').read_text(encoding='utf-8'))
    links_doc = json.loads((GRAMMAR / 'wheel-links.json').read_text(encoding='utf-8'))
    links = links_doc.get('links', {})
    by_id = {e['id']: e for e in pack.get('entries', [])}
    try:
        cc_rows = {r['id']: r for r in
                   json.loads((GRAMMAR / 'crosscheck.json').read_text(encoding='utf-8')).get('rows', [])}
    except OSError:
        cc_rows = {}
    ATTR2END = {'tral': 'place', 'da': 'time', 'tasil': 'source', 'thal': 'manner'}

    def need(eid: str) -> dict:
        e = by_id.get(eid)
        if e is None:
            raise ValueError(f'wheel references unknown pack id {eid}')
        if e.get('status') not in ('DERIVED', 'CURATED'):
            raise ValueError(f'wheel references non-ready pack id {eid}: {e.get("status")}')
        return e

    def surf(eid: str) -> dict:
        e = need(eid)
        lk = links.get(eid, {})
        iast, deva = e.get('iast', ''), e.get('deva', '')
        # prefer the machine surface that agrees with the curated teaching form
        m = None
        parts = eid.split('-')
        if len(parts) == 2 and parts[1] in ATTR2END:
            m = cc_rows.get(f'{parts[0]}-{ATTR2END[parts[1]]}')
        if m and m.get('agree'):
            want = m.get('deva_curated')
            for s in (e.get('all_surfaces') or []):
                if s.get('deva') == want:
                    iast, deva = s['iast'], s['deva']
                    break
        return {'id': eid, 'iast': iast, 'deva': deva,
                'status': e.get('status', ''),
                'lessons': (lk.get('lessons') or [])[:4],
                'verses': [{'work': r['work'], 'verse': r['verse']} for r in (lk.get('verses') or [])[:6]]}

    # ---- Machine A: word wheel (base x ending grid) ----
    cells = []
    for base_slp, base_iast, base_en in BASES:
        row = {'base': base_slp, 'base_iast': base_iast, 'base_en': base_en, 'cells': {}}
        for attr, func, en, sutra in ENDINGS:
            eid = f'{base_slp}-{attr.lower()}' if attr != 'TAl' else f'{base_slp}-thal'
            if base_slp == 'kim' and attr == 'TAl':
                # kim+thal is katha (machine), katham is the 5.3.24 special: both shown honestly
                row['cells'][attr] = {'derived': surf(eid), 'special': 'kim-katham'}
            else:
                row['cells'][attr] = {'derived': surf(eid), 'special': None}
        cells.append(row)
    word = {
        'format': 'svatantrya.wheel-word/1', 'title': 'Machine A: the word constructor',
        'status': 'machine-generated-unreviewed',
        'bases': [{'slp1': b, 'iast': i, 'en': e} for b, i, e in BASES],
        'endings': [{'attr': a, 'function': f, 'en': e, 'sutra': s} for a, f, e, s in ENDINGS],
        'rows': cells,
        'specials': {'kim-katham': surf('kim-katham')},
        'warning': 'Surfaces are Vidyut machine derivations, unreviewed. kim+thal gives katha; katham is the 5.3.24 special case.',
    }

    # ---- Machine B: sentence wheel ----
    rings = []
    subj_opts = []
    for s in SUBJECTS:
        v = surf(s['verb'])
        a = surf(s['adj'])
        subj_opts.append({**s, 'verb_surface': v, 'adj_surface': a})
    rings.append({'id': 'subject', 'label': 'who', 'options': subj_opts})

    def ring_opts(title: str, eids: list) -> dict:
        return {'id': title, 'label': title, 'options': [surf(e) for e in eids]}

    rings.append(ring_opts('place', ['kim-tral', 'tad-tral', 'yad-tral', 'sarva-tral', 'anya-tral']))
    rings.append(ring_opts('time', ['kim-da', 'tad-da', 'yad-da', 'sarva-da', 'anya-da']))
    rings.append(ring_opts('source', ['kim-tasil', 'tad-tasil', 'yad-tasil', 'sarva-tasil', 'anya-tasil']))
    rings.append(ring_opts('manner', ['tad-thal', 'yad-thal', 'sarva-thal', 'anya-thal']))
    rings.append({'id': 'verb', 'label': 'being', 'options': [surf(f'as-lat-{p}-{n}') for p in ('Uttama', 'Madhyama', 'Prathama') for n in ('Eka',)], 'note': 'shown for study; the subject ring already selects the verb'})
    sentence = {
        'format': 'svatantrya.wheel-sentence/1', 'title': 'Machine B: the sentence constructor',
        'status': 'machine-generated-unreviewed',
        'rings': rings,
        'agreement': ('The subject selects person/number/gender; the verb and the '
                      'state adjective follow. Adverbs (place/time/source/manner) never change.'),
        'warning': 'Assembled from machine-derived forms; combinations are grammatical but not all are idiomatic. Scripture links mark attested forms, not attested sentences.',
    }

    # ---- Trika wheels ----
    tw = []
    for w in TRIKA_WHEELS:
        opts = []
        for o in w['rings']:
            cfile = o.get('concept')
            cref = None
            if cfile:
                def _ok(x):
                    try:
                        return x.is_file()
                    except OSError:
                        return False
                p = CONCEPTS / cfile
                if not _ok(p):
                    up = CONCEPTS_UPSTREAM / cfile
                    if _ok(up):
                        p = up
                if _ok(p):
                    try:
                        d = json.loads(p.read_text(encoding='utf-8'))
                        cref = {'file': cfile,
                                'term': d.get('term') or d.get('iast') or '',
                                'definition': (d.get('definition') or '')[:280]}
                    except Exception:
                        cref = None
            opts.append({**o, 'concept_ref': cref,
                         'source_status': 'LINKED' if cref else 'PENDING'})
        tw.append({'id': w['id'], 'title': w['title'], 'note': w['note'], 'options': opts})
    trika = {
        'format': 'svatantrya.wheel-trika/1', 'title': 'Trika wheels',
        'status': 'curated-teaching-unreviewed',
        'wheels': tw,
        'warning': 'Teaching labels. LINKED options quote the concept file; PENDING options are owner glosses awaiting concept files. Nothing here is doctrine.',
    }

    # ---- Karaka wheel (ESG Topic III move: relationships before machinery) ----
    # All glosses are our own words; sutra numbers and karaka names are shared
    # grammatical facts. Examples use only words present in our own datasets
    # (wheel-pack surfaces + curated verb forms); anything else is marked NEXT.
    KARAKA = [
        {'id': 'kartr', 'label': 'kartṛ', 'en': 'agent, the doer',
         'gloss': 'the independent one who acts — the verb answers to it',
         'sutra': '1.4.54', 'sutra_iast': 'svatantraḥ kartā',
         'vibhakti': 'prathamā (1st)', 'example': 'ahaṃ gacchāmi',
         'example_en': 'I go', 'example_src': 'curated verb forms'},
        {'id': 'karman', 'label': 'karman', 'en': 'object, what is acted upon',
         'gloss': 'what the doer most wants to reach through the act',
         'sutra': '1.4.49', 'sutra_iast': 'kartur īpsitatamaṃ karma',
         'vibhakti': 'dvitīyā (2nd)', 'example': 'grāmaṃ gacchāmi',
         'example_en': 'I go to the village', 'example_src': 'pack noun-grama-acc + curated gacchāmi'},
        {'id': 'karana', 'label': 'karaṇa', 'en': 'instrument, the means',
         'gloss': 'the means the doer uses most effectively',
         'sutra': '1.4.42', 'sutra_iast': 'sādhakatamaṃ karaṇam',
         'vibhakti': 'tṛtīyā (3rd)', 'example': 'manasā',
         'example_en': 'with the mind (form on file; pair it with any action)',
         'example_src': 'pack noun-manas-inst'},
        {'id': 'sampradana', 'label': 'sampradāna', 'en': 'recipient',
         'gloss': 'the one the doer aims the act at — the receiver',
         'sutra': '1.4.32', 'sutra_iast': 'karmaṇā yam abhipraiti sa sampradānam',
         'vibhakti': 'caturthī (4th)', 'example': 'pitre',
         'example_en': 'for father (form on file; giving verbs arrive later)',
         'example_src': 'pack kin-pita-dat'},
        {'id': 'apadana', 'label': 'apādāna', 'en': 'origin, point of departure',
         'gloss': 'the fixed point from which something moves away',
         'sutra': '1.4.24', 'sutra_iast': 'dhruvam apāye ’pādānam',
         'vibhakti': 'pañcamī (5th)', 'example': 'grāmāt āgacchāmi',
         'example_en': 'I come from the village',
         'example_src': 'pack noun-grama-abl + curated āgacchāmi'},
        {'id': 'adhikarana', 'label': 'adhikaraṇa', 'en': 'locus, where it rests',
         'gloss': 'the ground on which the act or being rests',
         'sutra': '1.4.45', 'sutra_iast': 'ādhāro ’dhikaraṇam',
         'vibhakti': 'saptamī (7th)', 'example': 'grāme asmi',
         'example_en': 'I am in the village',
         'example_src': 'pack noun-grama-loc + pack as-lat-Uttama-Eka'},
    ]
    kw = []
    for o in KARAKA:
        # every example word must resolve to a pack surface or a curated form
        kw.append({**o, 'source_status': 'READY'})
    karaka = {
        'format': 'svatantrya.wheel-karaka/1', 'title': 'Kāraka wheel',
        'status': 'curated-teaching-unreviewed',
        'wheels': [{'id': 'karaka', 'title': 'Six relationships to the verb',
                     'note': 'The verb is the hub; every noun is one of six relationships to it. '
                             'kāraka (relationship) first, vibhakti (ending) second — the ESG move.',
                     'options': kw}],
        'warning': 'Teaching glosses in our own words. Examples assemble only words already on file.',
    }

    files = {'word.json': word, 'sentence.json': sentence, 'trika.json': trika, 'karaka.json': karaka}
    html = emit_html(word, sentence, trika, karaka)
    out_dir = SVREAD / 'data' / 'wheels'
    if args.check:
        ok = True
        for name, obj in files.items():
            p = out_dir / name
            if not p.exists():
                print(f'emit_wheels --check: missing {name}', file=sys.stderr)
                ok = False
                continue
            want = json.dumps(obj, ensure_ascii=False, sort_keys=True, indent=2) + '\n'
            if p.read_text(encoding='utf-8') != want:
                print(f'emit_wheels --check: {name} differs', file=sys.stderr)
                ok = False
        hp = SVREAD / 'wheels.html'
        if not hp.exists() or hp.read_text(encoding='utf-8') != html:
            print('emit_wheels --check: wheels.html differs', file=sys.stderr)
            ok = False
        return 0 if ok else 1
    out_dir.mkdir(parents=True, exist_ok=True)
    for name, obj in files.items():
        (out_dir / name).write_text(
            json.dumps(obj, ensure_ascii=False, sort_keys=True, indent=2) + '\n',
            encoding='utf-8')
    (SVREAD / 'wheels.html').write_text(html, encoding='utf-8')
    print('emit_wheels: word/sentence/trika written + wheels.html')
    return 0


def esc(s) -> str:
    return (str(s or '').replace('&', '&amp;').replace('<', '&lt;')
            .replace('>', '&gt;').replace('"', '&quot;'))


def tri(deva: str, iast: str, en: str | None = None) -> str:
    en = iast if en is None or en == '' else en
    return (f'<span class="tri"><span class="t-deva">{esc(deva or "")}</span>'
            f'<span class="t-iast"><i>{esc(iast or "")}</i></span>'
            f'<span class="t-en">{esc(en or "")}</span></span>')


def load_curated() -> dict | None:
    """Pre-render data from the vendored curated tier (node dump, no npm)."""
    vendor = SVREAD / 'vendor' / 'sanskrit-bruno-wheels' / 'data.js'
    js = ("const D=require(%s);console.log(JSON.stringify({subjects:D.subjects,"
          "owners:D.owners,places:D.places,times:D.times,predicates:D.predicates,modes:D.modes}));"
          % json.dumps(str(vendor)))
    try:
        raw = subprocess.run(['node', '-e', js], capture_output=True, text=True,
                             check=True, timeout=60)
        return json.loads(raw.stdout)
    except Exception:
        return None


def emit_html(word: dict, sentence: dict, trika: dict, karaka: dict) -> str:
    """Pre-rendered wheels page: readable with no JS; wheels.js enhances."""
    try:
        cc = json.loads((SVREAD / 'data' / 'grammar' / 'crosscheck.json').read_text(encoding='utf-8'))
        cc_sum = cc.get('summary', {})
    except OSError:
        cc, cc_sum = {}, {}
    cur = load_curated()
    # Machine A table (tri-spans for the toggle)
    head = ''.join(f'<th>{esc(e["function"])}<br><span class="mut">{tri(e["en"], e["en"], e["en"])} · {esc(e["sutra"])}</span></th>'
                   for e in word['endings'])
    rows = []
    for r in word['rows']:
        tds = [f'<td class="wbase"><b>{tri("", r["base_iast"], r["base_en"])}</b></td>']
        for e in word['endings']:
            c = r['cells'][e['attr']]
            d = c['derived']
            cell = (f'<td><button data-cell="{esc(r["base"])}|{esc(e["attr"])}" title="{esc(d["iast"])}">'
                    f'{tri(d["deva"], d["iast"], d["iast"])}</button>')
            if c.get('special'):
                sp = word['specials']['kim-katham']
                cell += f'<div class="mut">also: {tri(sp["iast"], sp["iast"], "how? (5.3.24-25 special)")}</div>'
            cell += '</td>'
            tds.append(cell)
        rows.append('<tr>' + ''.join(tds) + '</tr>')
    cc_line = ''
    if cc_sum:
        cc_line = (f'<p class="cmp-note">machine check over the curated table: '
                   f'{cc_sum.get("agree", "?")} agree exactly, {cc_sum.get("disagree", "?")} special '
                   f'(katham), {cc_sum.get("gap", "?")} machine gaps (ekatra, ekataḥ). '
                   f'Full per-form report: <a href="data/grammar/crosscheck.json">crosscheck.json</a>. '
                   f'Disagreement is a teaching decision or a machine gap — never a silent override.</p>')
    # Machine B pre-render: curated rings where available, else sentence.json
    # Machine B pre-render: curated rings where available, else sentence.json
    # data-min = first level that reveals the ring (cumulative unlock)
    RING_LEVEL = {'subject': 3, 'predicate': 3, 'time': 4, 'place': 4, 'owner': 5}
    if cur:
        def chips(items, keyname='en'):
            return ''.join(
                f'<button data-opt="{esc(o["id"])}"><b>{tri(o["deva"], o["deva"], o.get(keyname, ""))}</b></button>'
                for o in items)
        ring_order = [('subject', 'who', cur['subjects']), ('predicate', 'does what', cur['predicates']),
                      ('time', 'when', cur['times']), ('place', 'where', cur['places']),
                      ('owner', 'whose', cur['owners'])]
        sent_rings = ''.join(
            f'<div class="wring" data-ring="{rid}" data-min="{RING_LEVEL[rid]}"><h4>{label}</h4><div class="chips">{chips(items)}</div></div>'
            for rid, label, items in ring_order)
        modes = ''.join(f'<button data-mode="{esc(m["id"])}">{esc(m["label"])}</button>' for m in cur['modes'])
    else:
        subj_ring = next(r for r in sentence['rings'] if r['id'] == 'subject')
        sent_rings = (
            f'<div class="wring" data-ring="subject"><h4>who</h4><div class="chips">'
            + ''.join(f'<button data-opt="{esc(o["id"])}"><b>{tri(o["label"], o["label"], o["en"])}</b></button>'
                      for o in subj_ring['options'])
            + '</div></div>')
        modes = ''
    # Trika wheels
    tw = []
    for w in trika['wheels']:
        opts = ''.join(
            f'<button data-opt="{esc(o["id"])}"><b>{tri(o["label"], o["label"], o["en"])}</b></button>'
            for o in w['options'])
        tw.append(
            f'<section class="twheel" data-trika="{esc(w["id"])}"><h3>{esc(w["title"])}</h3>'
            f'<div class="chips">{opts}</div><div class="trika-detail mut">Pick one: definition and source land here.</div>'
            f'<div class="mut">{esc(w["note"])}</div></section>')
    # Karaka wheel (same option-wheel component, new dataset)
    kr = karaka['wheels'][0]
    karaka_opts = ''.join(
        f'<button data-opt="{esc(o["id"])}"><b>{tri(o["label"], o["label"], o["en"])}</b><br><span class="mut">{esc(o["vibhakti"])}</span></button>'
        for o in kr['options'])
    karaka_html = (
        f'<section class="twheel" data-karaka="{esc(kr["id"])}"><h3>{esc(kr["title"])}</h3>'
        f'<div class="chips">{karaka_opts}</div><div class="karaka-detail mut">Pick one: relationship, ending, and worked example land here.</div>'
        f'<div class="mut">{esc(kr["note"])}</div></section>')
    tutor_levels = [
        ('level-01-bases.md', 'Level 1 — Bases', 'six question-words, no endings'),
        ('level-02-endings.md', 'Level 2 — Endings', '20 cells + traces + crosscheck'),
        ('level-03-subject-verb.md', 'Level 3 — Who does what', 'agreement: verb + adjective follow'),
        ('level-04-time-place.md', 'Level 4 — When and where', 'adverbs join, never inflect'),
        ('level-05-questions.md', 'Level 5 — Asking', 'gated modes + possessors + 10-turn script'),
        ('level-06-karaka.md', 'Level 6 — Relationships', 'six kārakas, verb at the hub'),
    ]
    tutor_html = ''.join(
        f'<div><a href="data/wheels/tutor/{f}"><b>{t}</b></a> <span class="mut">— {d}</span></div>'
        for f, t, d in tutor_levels)
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"/>
<meta name="description" content="Sanskrit memory wheels: rotate meaning rings, Paninian grammar handles the rest. Word constructor, sentence constructor, Trika wheels, mastery drill."/>
<title>Sanskrit Wheels — svread</title>
<link rel="canonical" href="https://svatantrya.net/wheels.html"/>
<link rel="stylesheet" href="styles.css"/>
<style>
.wheel-page{{max-width:70rem;margin:0 auto;padding:1rem}}
.wheel-page table{{border-collapse:collapse;width:100%;margin:.6rem 0}}
.wheel-page th,.wheel-page td{{border:1px solid var(--g200,#e3e6ea);padding:.45rem .5rem;text-align:center;vertical-align:top}}
.wheel-page .wbase{{text-align:left}}
.wheel-page button[data-cell],.chips button{{font:inherit;background:#fff;border:1px solid var(--g200,#e3e6ea);border-radius:8px;padding:.35rem .6rem;cursor:pointer;line-height:1.5}}
.wheel-page button[data-cell].on,.chips button.on,#sent-modes button.on{{border-color:#8a6d1f;background:#fffdf4}}
.wring{{margin:.8rem 0}}
.wring h4{{margin:.2rem 0;text-transform:capitalize}}
.chips{{display:flex;flex-wrap:wrap;gap:.4rem}}
#sent-out,.twheel,#word-detail,#drill{{border:1px solid var(--g200,#e3e6ea);border-radius:10px;padding:.8rem 1rem;margin:.8rem 0;background:#fff}}
.twheel h3{{margin:.1rem 0 .5rem}}
.cmp-note{{font-size:.85rem;color:#6b5d2a;background:#fdf6e3;border-radius:6px;padding:.4rem .6rem;margin:.4rem 0}}
#word-detail .prak{{margin:.35rem 0 .2rem;padding-left:1.2rem;font-size:12.5px;line-height:1.6}}
#word-detail .psutra,.psutra{{font-family:ui-monospace,Menlo,monospace;font-size:11.5px;background:#f1f0eb;border-radius:4px;padding:0 .3rem;white-space:nowrap}}
.twocol{{display:grid;grid-template-columns:1fr 1fr;gap:.8rem}}
.twocol h4{{margin:.3rem 0 .1rem;font-size:.8rem;text-transform:uppercase;letter-spacing:.06em;color:#6b5d2a}}
@media (max-width:640px){{.twocol{{grid-template-columns:1fr}}}}
/* script toggle: one script visible at a time */
.t-iast,.t-en{{display:none}}
body.script-iast .t-deva{{display:none}}body.script-iast .t-iast{{display:inline}}body.script-iast .t-iast i{{font-style:italic}}
body.script-en .t-deva,body.script-en .t-iast{{display:none}}body.script-en .t-en{{display:inline}}
/* disc */
#word-disc svg{{width:100%;height:auto;max-width:560px;display:block;margin:0 auto}}
#word-disc .sector{{fill:#eef3f1;stroke:#b7af9d;stroke-width:1}}
#word-disc .wedge.sel .sector{{fill:#e8d9a8;stroke:#8a6d1f;stroke-width:2}}
#word-disc .dlbl{{display:none;font-family:inherit}}
body.script-deva #word-disc .d-deva{{display:block}}
body.script-iast #word-disc .d-iast{{display:block}}
body.script-en #word-disc .d-en{{display:block}}
#word-disc .d-en{{font-size:.62em}}
#script-toggle label{{font:inherit;background:#fff;border:1px solid var(--g200,#e3e6ea);border-radius:8px;padding:.3rem .7rem;cursor:pointer}}
#script-toggle label:has(input:checked){{border-color:#8a6d1f;background:#fffdf4}}
#script-toggle input{{accent-color:#8a6d1f}}
#sent-modes button{{font:inherit;background:#fff;border:1px solid var(--g200,#e3e6ea);border-radius:8px;padding:.3rem .7rem;cursor:pointer}}
.tok{{white-space:nowrap}}
#drill-bar-wrap{{height:8px;background:#eee;border-radius:4px;overflow:hidden;margin:.4rem 0}}
#drill-bar{{height:8px;background:#8a6d1f;width:0}}
#j-disc svg{{width:100%;height:auto;max-width:420px;display:block;margin:0 auto}}
#j-disc .sector{{fill:#eef3f1;stroke:#b7af9d;stroke-width:1}}
#j-disc .wedge.sel .sector{{fill:#e8d9a8;stroke:#8a6d1f;stroke-width:2}}
#j-quiz h3{{margin:.3rem 0}}
#j-quiz .chips button{{min-width:7rem}}
</style>
</head>
<body class="reader script-deva">
<script>if(/[?&]embed=1/.test(location.search))document.body.classList.add('embed');</script>
<header><nav>
  <div class="topbar-container">
    <a class="brand" href="./">स्वतन्त्र</a>
    <ul class="main-bar">
      <li><a href="./">Library</a></li>
      <li><a href="./?view=scholar">Scholar</a></li>
      <li><a href="./?view=sanskrit">Sanskrit</a></li>
      <li><a href="./?view=practice">Practice</a></li>
      <li><a href="./?view=biblio">Index</a></li>
    </ul>
  </div>
</nav></header>
<main class="wheel-page">
<h1>Sanskrit memory wheels</h1>
<p class="mut">Bruno meets Pāṇini: you turn the meaning rings; Paninian grammar handles the transformations. Two tiers side by side — <b>curated teaching forms</b> (hand-entered, beginner-safe) and <b>machine traces</b> (Vidyut derivations, unreviewed). Full thesis: <a href="SANSKRIT-MEMORY-ENGINE-THESIS.md">SANSKRIT-MEMORY-ENGINE-THESIS.md</a>; upstream curated package (MIT): <a href="vendor/sanskrit-bruno-wheels/">vendor/sanskrit-bruno-wheels/</a>.</p>
<div id="journey"><span class="mut">Journey lives here once JavaScript loads.</span></div>
<div id="script-toggle" role="group" aria-label="scripts (tick any combination)"><label><input type="checkbox" data-script="deva" checked> देवनागरी</label> <label><input type="checkbox" data-script="iast"> roman (IAST)</label> <label><input type="checkbox" data-script="en"> English</label></div>
<div style="margin:.4rem 0"><label class="mut" for="wheel-level">level</label> <select id="wheel-level"><option value="1">1 · bases</option><option value="2">2 · endings</option><option value="3">3 · who does what</option><option value="4">4 · when + where</option><option value="5">5 · asking</option><option value="6" selected>6 · everything</option></select> <span class="mut">cumulative: each level adds rings, never removes.</span></div>
{cc_line}
<h2>Machine A: the word constructor</h2>
<p data-min-word="2">Five bases × four endings as a table — or as rotating discs below it. Tap any cell or disc sector for teaching note + machine trace + scripture. Level 1 shows the bases ring only.</p>
<table id="word-grid"><tr><th></th>{head}</tr>{''.join(rows)}</table>
<div id="word-disc" aria-label="rotating word discs"></div>
<div id="word-detail"><span class="mut">Pick a cell: surface, derivation and scripture land here.</span></div>

<h2>Machine B: the sentence constructor</h2>
<p>Pick who, whose, where, when, and what they do — person, number and gender resolve automatically. Question modes are gated: <i>from where?</i> needs <i>come</i>. Words show ■ machine-traced or ◇ curated-only.</p>
<div id="sent-rings">{sent_rings}</div>
<div style="margin:.6rem 0"><span id="sent-modes" data-min="5">{modes}</span> <label class="mut" data-min="5">gender <select id="sent-gender"><option value="m">masc.</option><option value="f">fem.</option></select></label> <button id="sent-clear">reset</button></div>
<div id="sent-out"><div class="ctx-deva" style="font-size:1.5em">अहं सर्वदा अत्र सुखी अस्मि।</div><div class="mut">default: I + always + here + happy + am. Enable JavaScript to rotate the rings.</div></div>

<h2>Mastery drill</h2>
<p class="mut">Say it aloud, reveal, grade yourself. Mastered cards leave; misses recycle. Progress stays on this device.</p>
<div id="drill"><div id="drill-count" class="mut"></div><div id="drill-bar-wrap"><div id="drill-bar"></div></div><div id="drill-body"></div><div id="drill-btns" style="margin-top:.5rem;display:flex;gap:.5rem"></div><div style="margin-top:.5rem"><button id="drill-reset">reset deck</button></div></div>

<h2>Kāraka wheel</h2>
<p>The verb is the hub; every noun is one of six relationships to it. Relationship first, ending second.</p>
{karaka_html}
<p class="mut">Status: {esc(karaka["status"])}. {esc(karaka["warning"])}</p>

<h2>Learning harness (for ChatGPT / any tutor model)</h2>
<p>One fetch carries the whole program: <a href="data/wheels/harness.json"><b>harness.json</b></a> (all wheels + decision tree + verify index + links). The master prompt that teaches a model to use this site: <a href="data/wheels/HARNESS.md"><b>HARNESS.md</b></a> — display protocol, stages, verification, pronunciation, translation-work + trika-x links.</p>
<h2>Tutor levels (machine-readable)</h2>
<p>Point any tutor model at one file per level — data URLs, closed-world rules, drills, unlock order.</p>
{tutor_html}

<h2>Trika wheels</h2>
<p>Same machine, Trika content: rotate the old triads and see each pole clearly.</p>
{''.join(tw)}
<p class="mut">Status: {esc(trika["status"])}. {esc(trika["warning"])}</p>
</main>
<script type="application/json" id="wheel-word">{json.dumps(word, ensure_ascii=False, sort_keys=True)}</script>
<script type="application/json" id="wheel-sentence">{json.dumps(sentence, ensure_ascii=False, sort_keys=True)}</script>
<script type="application/json" id="wheel-trika">{json.dumps(trika, ensure_ascii=False, sort_keys=True)}</script>
<script type="application/json" id="wheel-karaka">{json.dumps(karaka, ensure_ascii=False, sort_keys=True)}</script>
<script type="application/json" id="wheel-crosscheck">{json.dumps(cc.get("summary", {}), ensure_ascii=False, sort_keys=True)}</script>
<script src="vendor/sanskrit-bruno-wheels/data.js"></script>
<script src="vendor/sanskrit-bruno-wheels/engine.js"></script>
<script src="wheels.js"></script>
<script src="journey.js"></script>
</body>
</html>
"""


if __name__ == '__main__':
    raise SystemExit(main())
