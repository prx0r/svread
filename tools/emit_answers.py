#!/usr/bin/env python3
"""Emit /a/<slug>/ answer pages — one static, no-JS page per Sanskrit form.

Why: ChatGPT's browsing mode (and any agent, and any human) can fetch a URL
and get a finished answer with no connector, no OAuth, no registration. One
fetch = one answer. Precomputed, deterministic, citable, zero inference cost.

Source of truth: data/grammar/{wheel-pack,wheel-links,crosscheck}.json.
Nothing is invented here; every claim on the page comes from those files.

Layout (fixed order): form -> answer (<=40 words) -> meaning -> verification
(verdict, machine rules, full prakriya) -> scripture -> what this does NOT
establish -> cite -> provenance.

  python3 tools/emit_answers.py
  python3 tools/emit_answers.py --check
"""
from __future__ import annotations
import argparse
import json
import re
import sys
import unicodedata
from pathlib import Path

SVREAD = Path(__file__).resolve().parent.parent
GRAMMAR = SVREAD / 'data' / 'grammar'
OUT = SVREAD / 'a'
ORIGIN = 'https://svatantrya.net'

VERDICT_TEXT = {
    'AGREE': 'machine-confirmed',
    'DISAGREE_STANDS': 'curated form; the machine differs',
    'MACHINE_GAP': 'taught form; the machine cannot derive it',
    'CURATED_ONLY': 'curated teaching form with no machine trace',
    'MACHINE_DERIVED': 'machine-derived; no curated cross-check on file',
}
ATTR2END = {'tral': 'place', 'da': 'time', 'tasil': 'source', 'thal': 'manner'}


def esc(s) -> str:
    return (str(s if s is not None else '').replace('&', '&amp;').replace('<', '&lt;')
            .replace('>', '&gt;').replace('"', '&quot;'))


def slugify(s: str) -> str:
    s = unicodedata.normalize('NFD', (s or '').lower())
    s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
    return re.sub(r'[^a-z0-9]+', '-', s).strip('-')


def verdict_for(entry: dict, row: dict | None) -> str:
    if row is not None:
        a = row.get('agree')
        return 'AGREE' if a is True else ('DISAGREE_STANDS' if a is False else 'MACHINE_GAP')
    if entry.get('kind') == 'curated-note' or entry.get('status') == 'CURATED':
        return 'CURATED_ONLY'
    return 'MACHINE_DERIVED'


def answer_line(entry: dict, row: dict | None, verdict: str) -> str:
    form = entry.get('iast') or entry.get('id')
    parts = [f"{form}: {VERDICT_TEXT[verdict]}."]
    mr = entry.get('machine_rules') or []
    if verdict == 'AGREE' and mr:
        parts.append(f"Derivation cites {', '.join(mr[:4])}.")
    if verdict == 'DISAGREE_STANDS':
        alts = ' / '.join((row or {}).get('machine_surfaces') or []) or 'another form'
        parts.append(f'Machine gives {alts}; the taught form stands.')
    if verdict == 'MACHINE_GAP':
        parts.append('Vidyut 0.4.0 yields no derivation; the curated form stands.')
    if entry.get('kind') == 'curated-note':
        parts.append('No derivation is claimed for it.')
    return ' '.join(parts)


def build(entry: dict, row: dict | None, lk: dict, cert: dict | None = None) -> str:
    verdict = verdict_for(entry, row)
    iast = entry.get('iast') or ''
    deva = entry.get('deva') or ''
    slug = slugify(iast or entry['id'])
    ans = answer_line(entry, row, verdict)
    rules = entry.get('machine_rules') or []
    prak = entry.get('prakriya') or []
    verses = (lk.get('verses') or [])[:10]
    lessons = lk.get('lessons') or []
    note = (row or {}).get('note') or entry.get('curated_note') or ''
    alts = (row or {}).get('machine_surfaces') or []
    if cert:
        if cert.get('lean_status') == 'checked':
            lv = str((cert.get('lean') or {}).get('lean_version') or 'Lean')
            lv = lv.split(',')[0].replace('Lean (version ', '')
            lean_txt = (f'Lean: <b>checked</b> ({esc(lv)} — structural check over the '
                        f'rule inventory, receipt-bound; <b>NOT a derivation from the '
                        f'Aṣṭādhyāyī</b> and not a claim about meaning)')
        else:
            lean_txt = ('Lean: <b>pending</b> — no matching receipt; structural '
                        'checks only, not a derivation from the Aṣṭādhyāyī')
        cert_block = (f'<h2>Certificate</h2>\n'
                      f'<p><code>{esc(cert["cert_sha"])}</code> — trace pinned '
                      f'(tier-2 recompute passes). Structure: {cert["checks"]["steps"]} steps, '
                      f'rule set <code>{esc(cert["rule_set_sha"][:16])}…</code>. '
                      f'{lean_txt}.</p>')
    elif entry.get('prakriya'):
        cert_block = '<h2>Certificate</h2>\n<p class="muted">certificate pending regeneration — run tools/emit_certificates.py.</p>'
    else:
        cert_block = '<h2>Certificate</h2>\n<p class="muted">no derivation claimed for this form — a certificate is not applicable.</p>'

    prak_rows = ''.join(
        f'<tr><td class="su">{esc(s.get("sutra",""))}</td>'
        f'<td class="si">{esc(s.get("sutra_iast") or "")}</td>'
        f'<td>{esc(s.get("after") or "")}</td></tr>'
        for s in prak[:24])
    verse_items = ''.join(
        f'<li><a href="/?work={esc(v["work"])}#{esc(v["verse"])}">{esc(v["work"])} · {esc(v["verse"])}</a></li>'
        for v in verses)
    lesson_items = ''.join(f'<li>{esc(x)}</li>' for x in lessons)

    jsonld = json.dumps({
        '@context': 'https://schema.org',
        '@type': ['DefinedTerm', 'CreativeWork'],
        'name': iast or entry['id'],
        'url': f'{ORIGIN}/a/{slug}/',
        'inLanguage': ['sa', 'en'],
        'description': ans,
        'isPartOf': {'@type': 'Dataset', 'name': 'Svatantrya grammar pack',
                     'distribution': {'@type': 'DataDownload',
                                      'contentUrl': f'{ORIGIN}/data/grammar/wheel-pack.json'}},
    }, ensure_ascii=False, sort_keys=True)

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>{esc(iast)} — {esc(VERDICT_TEXT[verdict])} · Svatantrya</title>
<meta name="description" content="{esc(ans)}"/>
<link rel="canonical" href="{ORIGIN}/a/{slug}/"/>
<meta property="og:title" content="{esc(iast)} — {esc(VERDICT_TEXT[verdict])}"/>
<meta property="og:description" content="{esc(ans)}"/>
<meta property="og:url" content="{ORIGIN}/a/{slug}/"/>
<style>
body{{max-width:46rem;margin:2rem auto;padding:0 1rem;font:16px/1.65 Georgia,serif;color:#222;background:#fffdf8}}
h1{{font-size:2rem;margin:.2rem 0 .1rem}}
.iast{{font-style:italic;color:#555;margin-bottom:1rem}}
.answer{{border-left:3px solid #8a6d1f;padding:.6rem .9rem;background:#fdf6e3;border-radius:4px;margin:1rem 0}}
table{{border-collapse:collapse;width:100%;margin:.6rem 0;font-size:.86rem}}
td,th{{border-bottom:1px solid #e3e6ea;padding:.3rem .4rem;text-align:left;vertical-align:top}}
.su{{font-family:ui-monospace,Menlo,monospace;white-space:nowrap;color:#1c4655}}
.si{{color:#777;font-style:italic}}
.muted{{color:#6b7280;font-size:.9rem}}
ul{{padding-left:1.2rem}}
code{{background:#f1f0eb;padding:.1rem .3rem;border-radius:3px;font-size:.85rem}}
h2{{font-size:.78rem;letter-spacing:.08em;text-transform:uppercase;color:#6b5d2a;margin:1.6rem 0 .4rem}}
</style>
<script type="application/ld+json">{jsonld}</script>
</head>
<body>
<p class="muted"><a href="/wheels.html">← wheels</a> · <a href="/">library</a></p>
<h1>{esc(deva)}</h1>
<div class="iast">{esc(iast)} · <span class="muted">{esc(entry.get('kind') or '')}</span></div>

<p class="answer">{esc(ans)}</p>

<h2>Meaning</h2>
<p>{esc(note) if note else '<span class="muted">No gloss on file.</span>'}</p>
{('<p class="muted">Alternative machine surfaces: ' + esc(' / '.join(alts)) + '</p>') if alts else ''}

<h2>Verification</h2>
<table>
<tr><th>status</th><td>{esc(entry.get('status') or '')}</td></tr>
<tr><th>verdict</th><td><b>{esc(verdict)}</b> — {esc(VERDICT_TEXT[verdict])}</td></tr>
<tr><th>machine rules</th><td>{esc(', '.join(rules)) if rules else '<span class="muted">none (no trace claimed)</span>'}</td></tr>
{('<tr><th>teaching ref</th><td>' + esc(entry.get('teaching_sutra') or '') + '</td></tr>') if entry.get('teaching_sutra') else ''}
</table>
{('<details><summary>full derivation (' + str(len(prak)) + ' steps)</summary><table><tr><th>sūtra</th><th>text</th><th>after</th></tr>' + prak_rows + '</table></details>') if prak else ''}
<p class="muted">Trace is Vidyut 0.4.0 machine output, unreviewed. Cross-check source: <a href="/data/grammar/crosscheck.json">crosscheck.json</a>.</p>
{cert_block}

<h2>In scripture</h2>
{('<ul>' + verse_items + '</ul>') if verse_items else '<p class="muted">No linked passages on file.</p>'}
{('<p class="muted">Lessons: ' + esc(', '.join(lessons)) + '</p>') if lesson_items else ''}

<h2>What this does not establish</h2>
<ul>
<li>Not a scholarly review; no human sign-off is recorded for this form.</li>
<li>A machine rule list is not proof the derivation is traditional.</li>
<li>Attestation here means the form occurs in a bundled passage, not that the passage uses it in this sense.</li>
<li>Curated teaching forms are beginner-safe choices, not a complete paradigm.</li>
</ul>

<h2>Cite</h2>
<p><code>{ORIGIN}/a/{slug}/</code> — Svatantrya grammar pack, form <code>{esc(entry['id'])}</code>.</p>
<p class="muted">Provenance: <a href="/data/grammar/wheel-pack.json">wheel-pack.json</a> · <a href="/data/wheels/harness.json">harness.json</a></p>
</body>
</html>
"""


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('--check', action='store_true')
    args = ap.parse_args()

    pack = json.loads((GRAMMAR / 'wheel-pack.json').read_text(encoding='utf-8'))
    links = json.loads((GRAMMAR / 'wheel-links.json').read_text(encoding='utf-8')).get('links', {})
    cc = json.loads((GRAMMAR / 'crosscheck.json').read_text(encoding='utf-8'))
    certs = {}
    cp = GRAMMAR / 'certificates.json'
    if cp.exists():
        certs = {c['pack_id']: c for c in json.loads(cp.read_text(encoding='utf-8')).get('entries', [])}
    rows = {r['id']: r for r in cc.get('rows', [])}
    cc_by_id = {}
    for rid, r in rows.items():
        cc_by_id[rid] = {**r, 'crosscheck_id': rid}

    pages = {}
    index = []
    for e in pack.get('entries', []):
        if e.get('status') not in ('DERIVED', 'CURATED'):
            continue
        row = None
        if e['id'] == 'kim-katham':
            row = cc_by_id.get('kim-manner')
        else:
            parts = e['id'].split('-')
            if len(parts) == 2 and parts[1] in ATTR2END:
                row = cc_by_id.get(parts[0] + '-' + ATTR2END[parts[1]])
        slug = slugify(e.get('iast') or e['id'])
        if not slug:
            print(f'emit_answers: empty slug for {e["id"]}', file=sys.stderr)
            return 1
        if slug in pages:
            print(f'emit_answers: slug collision {slug}', file=sys.stderr)
            return 1
        pages[slug] = build(e, row, links.get(e['id'], {}), certs.get(e['id']))
        index.append({'slug': slug, 'id': e['id'], 'iast': e.get('iast'),
                      'deva': e.get('deva'), 'verdict': verdict_for(e, row)})

    entries_json = {
        'format': 'svatantrya.answer-index/1',
        'origin': ORIGIN,
        'note': 'One static page per form: fetch the URL, get the answer. No registration, no JS.',
        'count': len(index),
        'entries': sorted(index, key=lambda x: x['slug']),
    }

    if args.check:
        ok = True
        for slug, html in pages.items():
            p = OUT / slug / 'index.html'
            if not p.exists():
                print(f'emit_answers --check: missing a/{slug}/index.html', file=sys.stderr)
                ok = False
            elif p.read_text(encoding='utf-8') != html:
                print(f'emit_answers --check: a/{slug}/ differs', file=sys.stderr)
                ok = False
        ip = OUT / 'index.json'
        want = json.dumps(entries_json, ensure_ascii=False, sort_keys=True, indent=2) + '\n'
        if not ip.exists() or ip.read_text(encoding='utf-8') != want:
            print('emit_answers --check: a/index.json differs', file=sys.stderr)
            ok = False
        return 0 if ok else 1

    for slug, html in pages.items():
        d = OUT / slug
        d.mkdir(parents=True, exist_ok=True)
        (d / 'index.html').write_text(html, encoding='utf-8')
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / 'index.json').write_text(
        json.dumps(entries_json, ensure_ascii=False, sort_keys=True, indent=2) + '\n',
        encoding='utf-8')
    print(f'emit_answers: {len(pages)} pages + index.json')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
