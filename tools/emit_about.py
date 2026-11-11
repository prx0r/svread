#!/usr/bin/env python3
"""Emit the About page (verbatim owner text) + its machine-readable mirror.

Owner text is reproduced exactly, spelling included ("reuseable", "practise"),
because it is a statement of intent, not copy to be edited. The machine
readable form carries the same words in structured fields so an agent can read
the mission without parsing prose.

  about/index.html   human page (no JS)
  about/index.md     markdown mirror
  about/about.json   svatantrya.about/1 (mission, goals[], contact, support, dedication)

  python3 tools/emit_about.py
  python3 tools/emit_about.py --check
"""
from __future__ import annotations
import argparse
import json
import os
import sys
from pathlib import Path

SVREAD = Path(__file__).resolve().parent.parent
OUT = SVREAD / 'about'
ORIGIN = (os.environ.get('SITE_ORIGIN') or 'https://svatantrya.net').rstrip('/')

# ---- owner verbatim (do not edit; spelling preserved) ----
MISSION = 'the inherent condition of sovereign freedom (my own interpretation)'
GOALS = [
    'free and reuseable translations of important sanskrit texts',
    ('free AI pipelines for creating and publishing your own: translations, essays, '
     'books, video explainers, podcasts, courses, interactive practise modules'),
    'formalisation of tantric traditions and practices',
]
GOAL_4 = 'the realisation of freedom for everyone, by themselves, independent of institutions'
CONTACT = 'idonietas@gmail.com'
SUPPORT = 'whatever i take is for siva'
DEDICATION = 'om namah shivayah \u0950'
SITE_ADDRESS = 'om@svatantrya.net'


def esc(s: str) -> str:
    return (str(s).replace('&', '&amp;').replace('<', '&lt;')
            .replace('>', '&gt;').replace('"', '&quot;'))


def build_html() -> str:
    goals_li = ''.join(
        f'<li>{esc(g)}</li>' for g in GOALS + [GOAL_4])
    jsonld = json.dumps({
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'Organization',
                '@id': f'{ORIGIN}/about/#org',
                'name': 'Svatantrya',
                'alternateName': 'svatantrya.net',
                'url': f'{ORIGIN}/',
                'email': CONTACT,
                'contactPoint': {'@type': 'ContactPoint', 'contactType': 'general',
                                 'email': SITE_ADDRESS},
                'description': f'Svatantrya \u2014 {MISSION}. ' + '; '.join(GOALS + [GOAL_4]) + '.',
                'knowsAbout': ['Sanskrit', 'Trika Shaivism', 'translation',
                               'formalisation', 'open educational resources'],
                'sameAs': ['https://github.com/prx0r/ipvv',
                           'https://github.com/prx0r/translation-work',
                           'https://github.com/prx0r/trika-x',
                           'https://github.com/prx0r/svread'],
            },
            {
                '@type': 'ItemList',
                '@id': f'{ORIGIN}/about/#goals',
                'name': 'Goals',
                'itemListElement': [
                    {'@type': 'ListItem', 'position': i + 1, 'name': g}
                    for i, g in enumerate(GOALS + [GOAL_4])
                ],
            },
        ],
    }, ensure_ascii=False, sort_keys=True)

    return f"""<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>About \u2014 Svatantrya</title>
<meta name="description" content="Svatantrya: free reusable translations of important Sanskrit texts, free AI pipelines for translations, essays, books, video, podcasts, courses and practice modules, formalisation of tantric traditions, and the realisation of freedom for everyone, by themselves, independent of institutions.">
<link rel="canonical" href="{ORIGIN}/about/">
<meta property="og:type" content="website">
<meta property="og:title" content="About \u2014 Svatantrya">
<meta property="og:description" content="Free translations, free AI pipelines, formalisation of tantric traditions, and freedom for everyone, by themselves.">
<meta property="og:url" content="{ORIGIN}/about/">
<script type="application/ld+json">{jsonld}</script>
<style>
body{{max-width:44rem;margin:2rem auto;padding:0 1.1rem;font:16px/1.7 Georgia,serif;color:#222;background:#fffdf8}}
h1{{font-size:2.1rem;margin:.2rem 0 .1rem;letter-spacing:.02em}}
.mission{{font-size:1.05rem;color:#4a4a4a;margin:.2rem 0 1.4rem}}
h2{{font-size:.8rem;letter-spacing:.09em;text-transform:uppercase;color:#6b5d2a;margin:1.8rem 0 .5rem}}
ol{{padding-left:1.3rem}} li{{margin:.45rem 0}}
.muted{{color:#6b7280;font-size:.9rem}}
.box{{border-left:3px solid #8a6d1f;background:#fdf6e3;border-radius:4px;padding:.7rem 1rem;margin:1.2rem 0}}
.dedication{{font-size:1.35rem;margin-top:1.8rem}}
a{{color:#1c4655}}
</style>
</head>
<body>
<p class="muted"><a href="{ORIGIN}/">\u2190 Svatantrya</a></p>
<h1>svatantrya</h1>
<p class="mission">{esc(MISSION)}</p>

<h2>This site aims to achieve these 4 goals</h2>
<ol>{goals_li}</ol>

<div class="box">
<p><b>please email me if any thoughts:</b> <a href="mailto:{CONTACT}">{CONTACT}</a></p>
<p>also feel free to support me, {esc(SUPPORT)}</p>
</div>

<p class="dedication">{esc(DEDICATION)}</p>

<p class="muted">Site address: <a href="mailto:{SITE_ADDRESS}">{SITE_ADDRESS}</a> — it forwards to the owner inbox above.</p>

<h2>What this site is, technically</h2>
<p>A checkable Trika Shaivism library and workshop: Sanskrit sources with layered
translations, machine derivations with visible disagreement, formal models with
must-fail twins, and one URL per claim so anyone can re-verify it. Reading and
practice are free. Nothing is auto-published, auto-signed, or auto-promoted.</p>

<h2>Machine-readable</h2>
<p class="muted">This page is mirrored at <a href="{ORIGIN}/about/about.json">about.json</a>
(structured mission and goals) and <a href="{ORIGIN}/about/index.md">index.md</a>.
The text above is the owner's verbatim statement, spelling preserved.</p>
</body></html>
"""


def build_md() -> str:
    lines = ['# svatantrya', '', MISSION, '', '## This site aims to achieve these 4 goals', '']
    lines += [f'- {g}' for g in GOALS + [GOAL_4]]
    lines += ['', f'please email me if any thoughts: {CONTACT}', '',
              f'also feel free to support me, {SUPPORT}', '', DEDICATION, '',
              f'<!-- machine-readable: {ORIGIN}/about/about.json -->', '']
    return '\n'.join(lines)


def build_json() -> dict:
    return {
        'format': 'svatantrya.about/1',
        'origin': ORIGIN,
        'name': 'svatantrya',
        'mission': MISSION,
        'mission_note': "owner's own interpretation, stated as such",
        'goals': GOALS + [GOAL_4],
        'goals_count': 4,
        'contact': CONTACT,
        'site_address': SITE_ADDRESS,
        'site_address_note': 'receives and forwards to the owner inbox; not a separate mailbox',
        'support': SUPPORT,
        'dedication': DEDICATION,
        'verbatim': True,
        'note': ('Owner statement, reproduced exactly (spelling preserved). '
                 'Reading and practice are free; nothing here is auto-published, '
                 'auto-signed, or auto-promoted.'),
        'pages': {'human': f'{ORIGIN}/about/', 'markdown': f'{ORIGIN}/about/index.md'},
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('--check', action='store_true')
    args = ap.parse_args()
    files = {
        'index.html': build_html(),
        'index.md': build_md(),
        'about.json': json.dumps(build_json(), ensure_ascii=False, sort_keys=True, indent=2) + '\n',
    }
    if args.check:
        ok = True
        for name, want in files.items():
            p = OUT / name
            if not p.exists():
                print(f'emit_about --check: missing about/{name}', file=sys.stderr)
                ok = False
            elif p.read_text(encoding='utf-8') != want:
                print(f'emit_about --check: about/{name} differs', file=sys.stderr)
                ok = False
        return 0 if ok else 1
    OUT.mkdir(parents=True, exist_ok=True)
    for name, want in files.items():
        (OUT / name).write_text(want, encoding='utf-8')
    print(f'emit_about: about/index.html + index.md + about.json ({ORIGIN})')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
