#!/usr/bin/env python3
"""emit_endgame_docs.py — vendor the strategic/endgame docs so an outside agent
(ChatGPT) can read them from the site and over MCP, without following local paths.

Each copy is byte-for-byte the source with one provenance header prepended:

    <!-- vendored: source=/root/... sha256=<source sha> || edit the source -->

That makes drift visible: `--check` recomputes the source hash and fails if the
original changed, so a stale copy can never masquerade as current.

  python3 tools/emit_endgame_docs.py
  python3 tools/emit_endgame_docs.py --check
"""
from __future__ import annotations
import argparse
import hashlib
import json
import sys
from pathlib import Path

SVREAD = Path(__file__).resolve().parent.parent
OUTDIR = SVREAD / 'docs' / 'endgame'
INDEX = SVREAD / 'data' / 'endgame-docs.json'
STAMP = '2026-11-11'

DOCS = [
    ('/root/AGENTS.md', 'estate-rules-and-vision',
     'Estate rules, model policy, POW repos, and the owner\'s endgame vision (verbatim).'),
    ('/root/NORTHSTAR.md', 'northstar-data-contract',
     'The data contract: SOURCE → T1 → L0 → ARGMAP → L2 → L3, machine-checkable.'),
    ('/root/svread/MASTERPLAN3.md', 'masterplan3',
     'Operative plan W1–W8: practice gates, mechanics stamp, access, measurement, training, factory, Muktabodha corpus endgame.'),
    ('/root/trika-x/MASTERPLAN2.md', 'masterplan2',
     'The 20-todo trika-x plan (W0–W9): hygiene, identity root, verification, formal coverage, witness column, scholar loop.'),
    ('/root/trika-x/MASTERPLAN-TECHNICAL-SPEC.md', 'masterplan-technical-spec',
     'Technical spec behind masterplan2.'),
    ('/root/svread/ENDGAME.md', 'endgame',
     'The seven output forms, the honest use/skip list, and the three-move build order.'),
    ('/root/svread/CHATGPT-ENDGAME-PLAN.md', 'chatgpt-endgame-plan',
     'How an outside model is meant to drive the loop.'),
    ('/root/svread/ENDGAME-BUILD-PLAN.md', 'endgame-build-plan',
     'Concrete build plan for the endgame surfaces.'),
    ('/root/svread/SCHOLAR-ENDGAME-SPEC.md', 'scholar-endgame-spec',
     'Operational contract for the scholar loop.'),
    ('/root/svread/SCHOLAR-ENDGAME-VISION.md', 'scholar-endgame-vision',
     'The scholar product vision.'),
    ('/root/svread/TENSIONS-ENDGAME.md', 'tensions-endgame',
     'Tensions/crux machinery and where it ends.'),
    ('/root/trika-x/ENDGAME-RECIPES.md', 'endgame-recipes',
     'R1–R9 recipes: diary→essay, essay→audio, essay→video, journeys, parables, kids books, year review, poem book, short movies.'),
    ('/root/svread/sanskritplugins.md', 'sanskrit-plugins-review',
     'External review of the Sanskrit tooling: what is gold, what is machine-proposed, the human-review ladder.'),
    ('/root/svread/LEAN-AND-SANSKRIT-SYNTHESIS.md', 'lean-and-sanskrit',
     'What Lean proves and does not: three stamps (bytes, mechanics, meaning), J1–J5 joints.'),
    ('/root/svread/EXTERNAL-STRATEGY.md', 'external-strategy',
     'The independent review contract and M0–M6 roadmap we are held to.'),
    ('/root/svread/REVIEW-FINDINGS.md', 'review-findings',
     'Second-round review findings.'),
    ('/root/svread/MCP-INTEGRATION.md', 'mcp-integration',
     'MCP surface plan: bridge, sheaves, OAuth, the one endpoint for ChatGPT.'),
]


def sha(p: Path) -> str:
    return hashlib.sha256(p.read_bytes()).hexdigest()


def render(src: Path, slug: str) -> str:
    digest = sha(src)
    head = (f'<!-- vendored: source={src} sha256={digest} fetched={STAMP}\n'
            f'     edit the source, not this copy; regenerate with tools/emit_endgame_docs.py -->\n\n')
    return head + src.read_text(encoding='utf-8').rstrip() + '\n'


def build() -> tuple[dict[str, str], list[dict]]:
    files, index = {}, []
    for src_s, slug, summary in DOCS:
        src = Path(src_s)
        if not src.is_file():
            raise SystemExit(f'emit_endgame_docs: missing source {src}')
        files[f'{slug}.md'] = render(src, slug)
        index.append({'slug': slug, 'title': src.stem, 'summary': summary,
                      'source': src_s, 'sha256': sha(src),
                      'url': f'/docs/endgame/{slug}.md'})
    return files, index


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('--check', action='store_true')
    a = ap.parse_args()
    files, index = build()
    idx_text = json.dumps({'format': 'svatantrya.endgame-docs/1', 'generated_on': STAMP,
                           'note': ('Vendored copies with source hashes. If --check fails, '
                                    'the source changed: regenerate.'),
                           'docs': index}, indent=1, ensure_ascii=False) + '\n'

    if a.check:
        bad = []
        for name, text in files.items():
            p = OUTDIR / name
            if not p.exists() or p.read_text(encoding='utf-8') != text:
                bad.append(name)
        if INDEX.exists():
            cur = json.loads(INDEX.read_text(encoding='utf-8'))
            if cur.get('docs') != index:
                bad.append('data/endgame-docs.json')
        else:
            bad.append('data/endgame-docs.json')
        if bad:
            print('emit_endgame_docs --check: RED — stale or missing: ' + ', '.join(bad[:5]),
                  file=sys.stderr)
            return 1
        print(f'emit_endgame_docs --check: GREEN ({len(files)} docs, hashes match sources)')
        return 0

    OUTDIR.mkdir(parents=True, exist_ok=True)
    for name, text in files.items():
        (OUTDIR / name).write_text(text, encoding='utf-8')
    INDEX.write_text(idx_text, encoding='utf-8')
    print(f'endgame docs -> {OUTDIR.relative_to(SVREAD)} ({len(files)}), index -> '
          f'{INDEX.relative_to(SVREAD)}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
