#!/usr/bin/env python3
"""emit_estate_index.py — one machine-readable catalogue of everything an agent
(or a plugin builder) can use: repos, data, tools, docs, live endpoints and
ready-made plugin recipes.

Written for ChatGPT: it should be able to read this file first and know where
every Sanskrit asset lives, which MCP tool reaches it, and what can be built.

  python3 tools/emit_estate_index.py            # write data/estate-index.json
  python3 tools/emit_estate_index.py --check    # byte-identical?
"""
from __future__ import annotations
import argparse
import glob
import json
import os
import sys
from pathlib import Path

SVREAD = Path(__file__).resolve().parent.parent
OUT = SVREAD / 'data' / 'estate-index.json'
GATEWAY = SVREAD / 'mcp' / 'gateway' / 'servers.json'

REPOS = [
    ('svread', '/root/svread', 'site: reader, wheels, practice, scholar, eval, MCP', 'docs/INDEX.md'),
    ('ipvv', '/root/ipvv', 'Cloudflare worker: Google auth, wheel gates, progress', 'worker/src/index.js'),
    ('translation-work', '/root/translation-work', 'the corpus: L0-L4 layers for 112 works', 'AGENTS.md'),
    ('trika-x', '/root/trika-x', 'formal layer (Lean prakriya), federation gateway, recipes', 'INDEX.md'),
    ('openpatala', '/root/openpatala', 'bibliography DB + MCP (resolve/search/get_bundle)', 'patala/mcp_server.py'),
    ('bookfactory', '/root/bookfactory', 'book production pipeline + MCP', 'bf_mcp/server.py'),
    ('videofactory', '/root/videofactory', 'video production pipeline + MCP', 'vf_mcp_server.py'),
    ('aoc', '/root/aoc', 'AI Onboard carousel factory, gated + receipted', 'docs/HOW_IT_WORKS.md'),
    ('sleepdraw', '/root/sleepdraw', 'journey renderer + seal CLI', 'mcp_server.py'),
    ('deitybody', '/root/deitybody', '10-stage Matrka curriculum', 'data/curriculum.json'),
    ('bruno', '/root/bruno', 'curated Sanskrit wheel tier (MIT)', 'README.md'),
    ('sanskrithelp', '/root/sanskrithelp', 'atlas/host project', 'README.md'),
    ('sanskritbench', '/root/sanskritbench', 'benchmark scaffolding', 'README.md'),
]

DATASETS = [
    ('bibliography', 'data/biblio.json', 'scholar__list_works / openpatala__search',
     '2,051 works (authority digest pinned), 125 people; local mirror 1,034 works'),
    ('wheel-pack', 'data/grammar/wheel-pack.json', 'scholar__wheel_harness',
     'Vidyut derivations for the wheel forms, reviewed/unreviewed per entry'),
    ('wheel-crosscheck', 'data/grammar/crosscheck.json', 'scholar__wheel_verify',
     'Vidyut vs Process-Sanskrit disagreements'),
    ('certificates', 'data/grammar/certificates.json', 'scholar__wheel_certificate',
     '44 structural certificates; lean_independent only when the receipt hash matches'),
    ('prakriya-receipt', 'data/grammar/prakriya-receipt.json', 'scholar__wheel_certificate',
     'Lean 4 receipt: 44 traces, 68 error codes, 4 mutant theorems'),
    ('wheels-word', 'data/wheels/word.json', 'scholar__wheel_lookup',
     'declension wheel: 4 endings x 5 bases'),
    ('wheels-sentence', 'data/wheels/sentence.json', 'scholar__wheel_lookup',
     'sentence wheel'),
    ('wheels-trika', 'data/wheels/trika.json', 'scholar__wheel_lookup',
     'Trika term wheel'),
    ('wheels-karaka', 'data/wheels/karaka.json', 'scholar__wheel_lookup',
     '6 karakas'),
    ('gate-pools', 'data/wheels/gates.json', 'worker /api/wheel/gate/start',
     'word L1=6 L2=4 L3=8 L4=20; sentence L1=4 L2=10 L3=9'),
    ('harness', 'data/wheels/harness.json', 'scholar__wheel_harness',
     'per-level harness and prompts'),
    ('compose', 'data/wheels/compose.json', 'compose__levels / compose__drill',
     '9,507 enumerated wheel states over 60 levels, HOLD-gated, server-scored'),
    ('compose-packs', 'data/wheels/compose-packs.json', 'compose__decompose / compose__dialogue',
     '2,512 pack states: 6 content packs x 4 master wheels (conversation/expression/action/description)'),
    ('wheelmap', 'data/wheels/wheelmap.json', 'compose__wheels',
     '15 families -> 4 wheels; transformation is the explain-mechanic, not a wheel'),
    ('compose-check', 'data/wheels/compose-check.json', 'file read',
     'Vidyut mechanical validation of compose verbs: DERIVABLE vs review queue'),
    ('tutor-memory', 'services/tutor-memory/', 'memory__recommend / memory__record_attempt',
     'persistent verified learner state (internal service, bearer-gated MCP)'),
    ('voice-loop', 'docs/VOICE-LOOP-SPEC.md', 'compose__session_start / compose__session_check',
     'voice warm-up loop: determinism guarantees, build order, Apps SDK widget plan'),
    ('four-wheels-spec', 'docs/SANSKRIT-WHEELS-SPEC-VERBATIM.md', 'file read',
     'owner four-wheel + pack spec, verbatim owner words'),
    ('four-wheels-factcheck', 'docs/FOUR-WHEELS-FACTCHECK.md', 'file read',
     'what the four-wheel claim gets right and where it simplifies'),
    ('plugins-page', 'plugins/', 'chatgpt.com/plugins -> Add custom MCP server',
     'human install page; machine spec at plugins/plugins.json'),
    ('tutor', 'data/wheels/tutor/', 'scholar__wheel_level',
     'level 1-4 tutor texts'),
    ('practice', 'data/practice/curriculum.json', 'site ?view=practice',
     '10 Matrka stages, verbatim owner words, sha256 provenance'),
    ('practice-cards', 'data/practice/cards.json', 'site ?view=practice',
     'per-stage cards'),
    ('eval-set', 'data/eval/trika-blind-50.json', 'file read via workspace__ws_read',
     '50 held-out passages, 49 works, category null pending human'),
    ('eval-rubric', 'data/eval/RUBRIC.md', 'file read',
     'correction effort in minutes; never BLEU'),
    ('eval-ours', 'data/eval/candidates/ours.json', 'file read',
     '40/50 of our translations with per-passage coverage'),
    ('eval-results', 'data/eval/results-ours.json', 'file read',
     'coverage only; human: PENDING_HUMAN'),
    ('licences', 'data/licenses/registry.json', 'tools/check_licenses.py',
     '10 entries; excluded/pending/read_only statuses are enforced'),
    ('mcp-registry', 'data/mcp-registry.json', 'file read',
     'every MCP server in the estate, probed live'),
    ('estate-index', 'data/estate-index.json', 'workspace__ws_read',
     'this catalogue'),
    ('translations', '/root/translation-work/*/data/*.l{0,2,3,4}.json', 'workspace__ws_read',
     '279 songs; l3 final line-by-line, l2 readable, l0 parsed segments'),
    ('corpus-validator', '/root/translation-work/tools/validate_layers.py', 'workspace__ws_git',
     'coverage/phantom/double/empty checks; Tantrasara 22/22 clean'),
]

DOCS = [
    ('README.md', 'START HERE for the site'),
    ('docs/INDEX.md', 'which docs are canonical, reference, history'),
    ('CHATGPT-PLUGIN.md', 'connector setup, tool map, editing limits, monitoring'),
    ('PLUGIN-PACK.md', 'press-create rows, test prompts, agent CLI, directory checklist'),
    ('VOICE-LOOP-SPEC.md', 'voice companion loop + scenario engine + build order (see docs/)'),
    ('FOUR-WHEELS-FACTCHECK.md', 'four-wheel claim: what holds, what simplifies (see docs/)'),
    ('SANSKRIT-WHEELS-SPEC-VERBATIM.md', 'owner four-wheel spec verbatim (see docs/)'),
    ('BENCHMARK-PLAN.md', 'pre-registered translation benchmark'),
    ('MCP-INTEGRATION.md', 'MCP surface plan (OAuth, bridge, sheaves)'),
    ('LEAN-AND-SANSKRIT-SYNTHESIS.md', 'what Lean proves and does not (three stamps)'),
    ('EXTERNAL-STRATEGY.md', 'external review contract and roadmap'),
    ('PRODUCTION.md', 'build, verify, deploy'),
    ('TESTING.md', 'every suite and exact command'),
    ('PROGRESS-REPORT-2026-11-11.md', 'status against MASTERPLAN3'),
    ('docs/BIBLIO-AUTHORITY-GAP.md', 'upstream biblio stubs, PG18 to PG15 blocker'),
    ('HANDOFF-PR-REVIEW.md', 'open PRs, merge order, review focus'),
]

RECIPES = [
    {'name': 'Wheel tutor plugin', 'uses': ['scholar__wheel_level', 'scholar__wheel_lookup',
     'scholar__wheel_verify', 'scholar__wheel_certificate'],
     'build': 'ask for a level, drill a form, show the derivation + certificate hash'},
    {'name': 'Reader with evidence', 'uses': ['scholar__passage_evidence', 'scholar__list_versions',
     'scholar__compare_versions'],
     'build': 'Sanskrit + editorial layers with hash-checked provenance'},
    {'name': 'Bibliography explorer', 'uses': ['openpatala__resolve', 'openpatala__search',
     'openpatala__get_bundle', 'openpatala__get_frontier'],
     'build': 'resolve a work, show dossiers, list what still needs translation'},
    {'name': 'Translation QA', 'uses': ['workspace__ws_read', 'workspace__ws_grep',
     'workspace__ws_git'],
     'build': 'run the corpus validator, show coverage gaps, patch a layer'},
    {'name': 'Book builder', 'uses': ['bookfactory__factory_overview', 'bookfactory__list_lanes',
     'bookfactory__read_thesis', 'bookfactory__check_lane'],
     'build': 'inspect a lane, read thesis/entries, run the single gate'},
    {'name': 'Video/seal pipeline', 'uses': ['videofactory__vf_status', 'videofactory__vf_units'],
     'build': 'read render-gate state per unit'},
    {'name': 'Campaign carousels', 'uses': ['aoc__aoc_status', 'aoc__aoc_validate',
     'aoc__aoc_review', 'aoc__aoc_receipts'],
     'build': 'validate a hook, run the 15-point review, inspect receipt chain'},
    {'name': 'Formal evidence browser', 'uses': ['federation__guide', 'formal__evidence',
     'formal__gaps'],
     'build': 'navigate formal artifacts and gaps across the estate'},
    {'name': 'Compose voice loop', 'uses': ['compose__levels', 'compose__curriculum',
     'compose__session_start', 'compose__session_check', 'compose__session_end',
     'compose__review', 'compose__progress'],
     'build': 'daily focus from study order, warm-up session, spoken attempts checked against the lattice, replays of weak items'},
    {'name': 'Four-wheel packs explorer', 'uses': ['compose__wheels', 'compose__packs',
     'compose__decompose', 'compose__dialogue', 'compose__why_change'],
     'build': 'same construction across packs; break an utterance into rings; multi-wheel exchange; explain what changed'},
    {'name': 'Tutor memory', 'uses': ['memory__context', 'memory__recommend',
     'memory__record_attempt', 'memory__set_preference', 'memory__propose',
     'memory__decide_proposal', 'memory__set_focus'],
     'build': 'persistent verified learner state; deterministic next-lesson; preferences only by explicit request'},
]


def count(pattern: str) -> int:
    return len(glob.glob(pattern, recursive=True))


def build() -> dict:
    biblio = json.loads((SVREAD / 'data' / 'biblio.json').read_text(encoding='utf-8'))
    gateway = json.loads(GATEWAY.read_text(encoding='utf-8'))
    licences = json.loads((SVREAD / 'data' / 'licenses' / 'registry.json').read_text(encoding='utf-8'))
    certs = json.loads((SVREAD / 'data' / 'grammar' / 'certificates.json').read_text(encoding='utf-8'))
    cert_n = certs.get('count') if isinstance(certs, dict) else len(certs)
    mcp = json.loads((SVREAD / 'data' / 'mcp-registry.json').read_text(encoding='utf-8'))
    endgame = json.loads((SVREAD / 'data' / 'endgame-docs.json').read_text(encoding='utf-8'))

    return {
        'format': 'svatantrya.estate-index/1',
        'generated_by': 'tools/emit_estate_index.py',
        'purpose': ('Read me first. Every Sanskrit asset, tool, doc and endpoint in one file, '
                    'with the MCP tool that reaches it, and ready-made plugin recipes.'),
        'live': {
            'site': 'https://svatantrya.net',
            'mcp': 'https://mcp.svatantrya.net/mcp',
            'transport': 'streamable-http',
            'protocol': '2025-06-18',
            'tools': 45,
            'auth': 'none (public bundle); bearer for Studio/Factory (owner), mixed on practice',
            'bundles': {k: v for k, v in (mcp.get('hosts') or {}).items()
                        if k in ('svatantrya', 'studio', 'factory')},
            'console': mcp.get('public_endpoint', {}).get('url'),
        },
        'rules': [
            'BLOCKED != PASS. If a check cannot run, say BLOCKED and why.',
            'Machine traces are DERIVED, not truth.',
            'Nothing auto-publishes, auto-signs or auto-renders.',
            'Never invent Sanskrit. A form not in the corpus does not render.',
            'Licence gate first: tools/check_licenses.py --admit <id> infer.',
            'Missing means not in the data, never that the tradition is silent.',
        ],
        'counts': {
            'works': len(biblio.get('works', [])),
            'people': len(biblio.get('people', [])),
            'translations_songs': len(glob.glob('/root/translation-work/*/data/*.l3.json')),
            'l2_files': len(glob.glob('/root/translation-work/*/data/*.l2.json')),
            'certificates': cert_n,
            'licence_entries': len(licences.get('entries', [])),
            'mcp_servers': len(gateway.get('servers', {})),
            'mcp_tools': mcp.get('public_endpoint', {}).get('tools'),
            'blind_passages': 50,
            'our_candidates': 40,
        },
        'repos': [{'name': n, 'path': p, 'what': w, 'start': s} for n, p, w, s in REPOS],
        'data': [{'name': n, 'path': p, 'tool': t, 'what': w} for n, p, t, w in DATASETS],
        'docs': [{'path': p, 'what': w} for p, w in DOCS],
        'endgame_docs': endgame['docs'],
        'reading_order': [
            'workspace__estate_index (this file)',
            'docs/endgame/estate-rules-and-vision.md — the rules and the vision',
            'docs/endgame/endgame.md — the seven output forms',
            'docs/endgame/lean-and-sanskrit.md — what Lean proves, what only a human can',
            'docs/endgame/masterplan3.md + masterplan2.md — what is left to build',
            'HANDOVER-NEXT-SESSION.md — the next ten jobs',
            'docs/endgame/endgame-recipes.md — R1–R9 recipes',
        ],
        'mcp_servers': {k: {'path': v['path'], 'role': v.get('role', '')} for k, v in gateway['servers'].items()},
        'plugin_recipes': RECIPES,
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('--check', action='store_true')
    a = ap.parse_args()
    doc = build()
    text = json.dumps(doc, indent=1, ensure_ascii=False, sort_keys=False) + '\n'
    if a.check:
        if not OUT.exists() or OUT.read_text(encoding='utf-8') != text:
            print('emit_estate_index --check: RED (index differs)', file=sys.stderr)
            return 1
        print(f"emit_estate_index --check: GREEN ({doc['counts']['mcp_tools']} tools, "
              f"{doc['counts']['works']} works)")
        return 0
    OUT.write_text(text, encoding='utf-8')
    print(f'estate index -> {OUT.relative_to(SVREAD)} '
          f"({doc['counts']['works']} works, {doc['counts']['translations_songs']} songs, "
          f"{doc['counts']['mcp_tools']} tools)")
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
