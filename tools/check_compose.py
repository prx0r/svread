#!/usr/bin/env python3
"""check_compose.py — mechanically validate compose verb forms with Vidyut.

Same pattern as tools/check_curated.py (curated-vs-machine), applied to the
generative compose dataset. It does NOT rewrite lines and never invents a
derivation: it derives a candidate space from Vidyut 0.4.0 + the local kosha
and reports which compose verb tokens are DERIVABLE, which are NOT, and which
roots are MISSING from the kosha (a gap, not an error).

  data/wheels/compose-check.json   svatantrya.compose-check/1

  python3 tools/check_compose.py
  python3 tools/check_compose.py --check

Caveat (house law): agreement here is surface membership in a derived space,
not a full sentence parse. A NOT_FOUND token is a prompt to look, never a
silent correction. Missing roots mean "not in this kosha", never "invalid".
"""
from __future__ import annotations
import argparse
import json
import re
import sys
from pathlib import Path

SVREAD = Path(__file__).resolve().parent.parent
COMPOSE = SVREAD / 'data' / 'wheels' / 'compose.json'
OUT = SVREAD / 'data' / 'wheels' / 'compose-check.json'
KOSHA = Path('/root/vidyut-0.4.0/kosha')
SUPPORTED = '0.4.0'

# root clean_text -> human label. Missing ones are reported as MISSING_ROOT.
ROOTS = {
    'paW': 'paṭh (read)', 'gam': 'gam (go)', 'as': 'as (be)', 'liK': 'likh (write)',
    'vas': 'vas (dwell)', 'man': 'man (think)', 'jYA': 'jñā (know)', 'vad': 'vad (speak)',
    'ruc': 'ruc (please)', 'has': 'has (laugh)', 'kf': 'kṛ (make)', 'av': 'av (protect)',
    'dA': 'dā (give)', 'gfh': 'gṛh (grasp)', 'dfS': 'dṛś (see)', 'sTA': 'sthā (stand)',
    'DyE': 'dhyai (meditate)', 'vft': 'vṛt (turn)',
}
# extra roots referenced by compose but possibly absent from the kosha
WANT_EXTRA = {'nAS': 'nāś (destroy)', 'icC': 'icch (wish)', 'viSrAm': 'viśram (rest)',
             'praC': 'prach (ask)'}

# pin the correct homonym per root (same clean_text, different gana)
GANA_PIN = {
    'paW': 'Bhvadi', 'gam': 'Bhvadi', 'as': 'Adadi', 'liK': 'Tudadi',
    'vas': 'Bhvadi', 'man': 'Divadi', 'jYA': 'Ghatadi', 'vad': 'Bhvadi',
    'ruc': 'Bhvadi', 'has': 'Bhvadi', 'kf': 'Svadi', 'av': 'Bhvadi',
    'Sak': 'Svadi', 'dA': 'Juhotyadi', 'gfh': 'Bhvadi', 'dfS': 'Bhvadi',
    'sTA': 'Bhvadi', 'DyE': 'Bhvadi', 'vft': 'Bhvadi',
}


def _vidyut():
    import importlib.metadata as md
    try:
        version = md.version('vidyut')
    except Exception:
        raise SystemExit('check_compose: vidyut not installed')
    if version != SUPPORTED:
        raise SystemExit(f'check_compose: expected vidyut {SUPPORTED}, found {version}')
    from vidyut import kosha as kosha_mod
    from vidyut.prakriya import (Vyakarana, Pada, Prayoga, Lakara, Purusha, Vacana)
    from vidyut.lipi import transliterate, Scheme
    return kosha_mod, Vyakarana, Pada, Prayoga, Lakara, Purusha, Vacana, transliterate, Scheme


def derive_space() -> tuple[dict, dict, list]:
    (kosha_mod, Vyakarana, Pada, Prayoga, Lakara, Purusha, Vacana,
     transliterate, Scheme) = _vidyut()
    k = kosha_mod.Kosha(str(KOSHA))
    v = Vyakarana()
    entries = {}
    for d in k.dhatus():
        if getattr(d, 'prefixes', None):
            continue
        ct = getattr(d, 'clean_text', None)
        if ct not in ROOTS and ct not in WANT_EXTRA:
            continue
        s_ = str(d)
        pin = GANA_PIN.get(ct)
        if pin and pin not in s_:
            continue  # a different homonym; skip
        entries.setdefault(ct, d)
    space: dict[str, dict] = {}
    missing: list = []
    lak = [Lakara.Lat, Lakara.Lan, Lakara.Lrt]
    for code in list(ROOTS) + list(WANT_EXTRA):
        entry = entries.get(code)
        if entry is None:
            missing.append(code)
            continue
        forms: dict[str, bool] = {}
        try:
            args = entry.to_prakriya_args()
        except Exception:
            missing.append(code)
            continue
        for lk in lak:
            for pu in (Purusha.Prathama, Purusha.Madhyama, Purusha.Uttama):
                for va in (Vacana.Eka, Vacana.Dvi, Vacana.Bahu):
                    try:
                        res = v.derive(Pada.Tinanta(args, Prayoga.Kartari, lk, pu, va))
                    except Exception:
                        continue
                    for r in res:
                        forms[transliterate(r.text, Scheme.Slp1, Scheme.Iast).strip()] = True
        space[code] = forms
    # prefixed verbs (avagacchati = ava + gacchati) with simple prefixation
    PREFIXES = ['ava', 'anu', 'pra', 'vi', 'sam', 'upa', 'ni', 'abhi', 'ud', 'pari',
                'apa', 'ati', 'adhi', 'pari', 'su', 'dus']
    prefixed = {}
    for code, forms in space.items():
        for f in forms:
            for pre in PREFIXES:
                prefixed[pre + f] = True
    space['_prefixed'] = prefixed
    return space, {c: ROOTS.get(c) or WANT_EXTRA.get(c) for c in ROOTS}, missing


def verb_tokens(rows: list) -> dict:
    """Distinct roman verb-like tokens across all compose lines."""
    pat = re.compile(r'(ti|si|mi|nti|maḥ|tha|te|se|nte|dhve|vaḥ|staḥ|svaḥ)$')
    out: dict[str, int] = {}
    for r in rows:
        for l in r['lines']:
            for w in re.findall(r"[a-zāīūṛṝḷḹṃḥñṅśṣṭḍṇ]+", l['roman'].lower()):
                if pat.search(w):
                    out[w] = out.get(w, 0) + 1
    return out


def build_report() -> dict:
    ds = json.loads(COMPOSE.read_text(encoding='utf-8'))
    space, labels, missing = derive_space()
    all_forms: set[str] = set()
    per_root: dict[str, list] = {}
    for code, forms in space.items():
        if code == '_prefixed':
            all_forms.update(forms)
            continue
        all_forms.update(forms)
        per_root[labels.get(code, code)] = sorted(forms)
    toks = verb_tokens(ds['rows'])
    result = {}
    for tok in sorted(toks):
        if tok in all_forms:
            result[tok] = 'DERIVABLE'
        else:
            # a token may be a noun/participle that merely looks verb-like
            result[tok] = 'NOT_FOUND'
    counts = {'tokens': len(result)}
    for verdict in ('DERIVABLE', 'NOT_FOUND'):
        counts[verdict] = sum(1 for v in result.values() if v == verdict)
    return {
        'format': 'svatantrya.compose-check/1',
        'generator': {'name': 'vidyut', 'version': SUPPORTED, 'kosha': str(KOSHA)},
        'status': 'machine-checked-surface',
        'warning': ('Surface membership in a Vidyut-derived verb space, not a full '
                    'sentence parse. NOT_FOUND is a prompt to look, never a silent '
                    'correction. Missing roots mean absent from this kosha, not invalid. '
                    'Known gap: Vidyut 0.4.0 applies Bhvadi vikarana to antargana '
                    'roots (jñā→jñāti, want jānāti; same for śak/kṛ), and causal/prefixed '
                    'forms (nāśayati, sthirīkaroti, icchati, viśrāmyati) are not yet derived. '
                    'These are validator gaps, not compose errors.'),
        'counts': counts,
        'missing_roots': sorted(missing),
        'tokens': result,
        'roots_derived': {k: len(v) for k, v in per_root.items()},
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('--check', action='store_true')
    args = ap.parse_args()
    rep = build_report()
    text = json.dumps(rep, ensure_ascii=False, sort_keys=True, indent=2) + '\n'
    if args.check:
        if not OUT.exists():
            print('check_compose --check: missing compose-check.json', file=sys.stderr)
            return 1
        if OUT.read_text(encoding='utf-8') != text:
            print('check_compose --check: compose-check.json differs', file=sys.stderr)
            return 1
        return 0
    OUT.write_text(text, encoding='utf-8')
    c = rep['counts']
    print(f"check_compose: {c['DERIVABLE']}/{c['tokens']} verb tokens derivable, "
          f"{c['NOT_FOUND']} to review, missing roots: {rep['missing_roots']}")
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
