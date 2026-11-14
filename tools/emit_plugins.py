#!/usr/bin/env python3
"""Emit the plugins page: every ChatGPT plugin in the estate, install-ready.

Single source of truth for counts/URLs is mcp/gateway/servers-<id>.json;
the display table below is hand-curated (update counts here when configs
change — --check keeps emitted bytes pinned, not live).

  plugins/index.html   human install page (no JS)
  plugins/index.md     markdown mirror
  plugins/plugins.json svatantrya.plugins/1 (agents read this)

  python3 tools/emit_plugins.py
  python3 tools/emit_plugins.py --check
"""
from __future__ import annotations
import argparse
import json
import os
import sys
from pathlib import Path

SVREAD = Path(__file__).resolve().parent.parent
OUT = SVREAD / 'plugins'
ORIGIN = (os.environ.get('SITE_ORIGIN') or 'https://svatantrya.net').rstrip('/')

# id, ChatGPT plugin name, tagline, description, auth, access, tools, tests.
# Counts verified live 2026-11-12/13; update here when a config changes.
PLUGINS = [
    {"id": "index", "name": "Svatantrya Index",
     "tagline": "Bibliography: which Sanskrit work is this?",
     "desc": "Resolve a work, search 2,051 titles, pull the full dossier.",
     "auth": "none", "access": "public", "tools": 5,
     "tests": ["Find the work called Tantrasara",
               "Give me the full dossier for tantrasara",
               "Which works still need translations or sources?"]},
    {"id": "sanskrit", "name": "Svatantrya Sanskrit",
     "tagline": "Hash-checked passages and English, citable.",
     "desc": "Search the corpus; pull Sanskrit plus editorial layers with hashes.",
     "auth": "none", "access": "public", "tools": 9,
     "tests": ["What does Tantrasara chapter 20 verse 1 say, in Sanskrit and English?",
               "List what has a reader bundle",
               "Compare versions of tsa-a20-v01"]},
    {"id": "practice", "name": "Svatantrya Practice",
     "tagline": "Wheels, levels, certificates; server-scored gates.",
     "desc": "Teach one level at a time; gates are scored server-side, the model never self-reports.",
     "auth": "mixed", "access": "public reads; scoring needs sign-in",
     "tools": "5 open + 3 signed-in",
     "tests": ["Teach me wheel level 1",
               "Prove the form gata",
               "Show my scored progress (needs sign-in)"]},
    {"id": "formal", "name": "Svatantrya Formal",
     "tagline": "Theorems, bridges, gaps, treeka chains.",
     "desc": "Evidence rows, chunk resolution, coverage gaps, work-to-essay chains. Refs are hashes.",
     "auth": "none", "access": "public", "tools": 10,
     "tests": ["What can you do? (navigates the layer)",
               "Show the formal coverage gaps",
               "Give me the treeka chain for tantrasara"]},
    {"id": "translate", "name": "Svatantrya Translate",
     "tagline": "Transmission briefs and translation state.",
     "desc": "Work state, 1-page briefs, concept grounds, recon. Quotes PASS-gated English only.",
     "auth": "none", "access": "public", "tools": 6,
     "tests": ["What is the state of work tantrasara-a01?",
               "Show me its transmission brief",
               "What are the grounds for hand-glossing it?"]},
    {"id": "tutor", "name": "Svatantrya Tutor",
     "tagline": "Objective-driven Sanskrit sessions.",
     "desc": "Daily brief, weekly arc, 15-minute sessions with assessment. Single learner.",
     "auth": "bearer", "access": "owner", "tools": 5,
     "tests": ["What is today's plan?",
               "Start a compression level 1 session",
               "Show my profile"]},
    {"id": "essay", "name": "Svatantrya Essay",
     "tagline": "Sourced essay workshop, human-gated.",
     "desc": "Drafts, sources, citations, claim audits, review packets. Nothing auto-publishes.",
     "auth": "bearer", "access": "owner", "tools": 24,
     "tests": ["List my documents",
               "Audit this draft against its sources",
               "What is waiting for human review?"]},
    {"id": "books", "name": "Svatantrya Books",
     "tagline": "Gated book production.",
     "desc": "Lanes, templates, staging into print products. Rendering stays human-gated.",
     "auth": "bearer", "access": "owner", "tools": 22,
     "tests": ["What lanes are open?",
               "Show the next actions for the current book"]},
    {"id": "video", "name": "Svatantrya Video",
     "tagline": "Gated video production.",
     "desc": "Projects, units, render-gate status, finals. Publishing stays human-gated.",
     "auth": "bearer", "access": "owner", "tools": 18,
     "tests": ["What video projects exist?",
               "What is the render-gate status?"]},
]

BUNDLES = [
    {"id": "mcp", "name": "Svatantrya",
     "tagline": "Everything public in one install.",
     "desc": "All 45 public reads: bibliography, passages, wheels, translation briefs, formal layer, treeka chains, the 60-level compose curriculum, and the four-wheel map, packs, plus decompose/dialogue.",
     "auth": "none", "access": "public — start here", "tools": 45,
     "tests": ["What are the four wheels?",
               "Show me the Family pack",
               "Why does aham paṭhāmi become bhavān paṭhati?"]},
    {"id": "studio", "name": "Svatantrya Studio",
     "tagline": "Your writing + learning room.",
     "desc": "Tutor sessions, sourced essays, deterministic compose drills and the voice session loop (start/check/end), server-scored gates. Owner token.",
     "auth": "bearer", "access": "owner", "tools": 47,
     "tests": ["Start a warm-up session",
               "Check my Sanskrit: bhavān katham asti",
               "What should I study next?",
               "Remember that I prefer quick-fire drills"]},
    {"id": "factory", "name": "Svatantrya Factory",
     "tagline": "Books + video, gated.",
     "desc": "Book staging and video render gates. Human-gated publishing. Owner token.",
     "auth": "bearer", "access": "owner", "tools": 40,
     "tests": ["What lanes are open?",
               "What is the render-gate status?"]},
]

CLI = {
    "try_it_now": "curl -s -X POST https://mcp.svatantrya.net/mcp -H 'content-type: application/json' -H 'accept: application/json, text/event-stream' -d '{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"tools/list\",\"params\":{}}'  # 40 public tools, no auth. Parse the data: lines as JSON.",
    "inspector": "npx @modelcontextprotocol/inspector@latest  # Transport: Streamable HTTP, URL https://mcp.svatantrya.net/mcp (public, no headers). Bearer hosts (studio/factory/...): add Authorization: Bearer $MCP_TOKEN in Headers.",
    "claude_code_public": "claude mcp add --transport http svatantrya https://mcp.svatantrya.net/mcp",
    "claude_code_owner": "claude mcp add --transport http studio https://studio.svatantrya.net/mcp --header \"Authorization: Bearer $MCP_TOKEN\"",
    "opencode_public": "{\"mcp\": {\"svatantrya\": {\"type\": \"remote\", \"url\": \"https://mcp.svatantrya.net/mcp\"}}}  # paste into ~/.config/opencode/opencode.jsonc",
    "opencode_owner": "{\"mcp\": {\"studio\": {\"type\": \"remote\", \"url\": \"https://studio.svatantrya.net/mcp\", \"headers\": {\"Authorization\": \"Bearer $MCP_TOKEN\"}}}}",
    "python_agent": "from fastmcp import Client\nasync with Client('https://mcp.svatantrya.net/mcp') as c:\n    tools = await c.list_tools()  # 40 tools, no auth\n    r = await c.call_tool('compose__next_level', {})  # study-order next",
    "bearer_hosts": "studio svatantrya.net (47 tools) · factory (40) · essay (24) · books (22) · video (18) · tutor (5) · nibbana (4, private) · practice writes · all need Authorization: Bearer $MCP_TOKEN; reads on practice stay open.",
}

def esc(s: str) -> str:
    return (str(s).replace('&', '&amp;').replace('<', '&lt;')
            .replace('>', '&gt;').replace('"', '&quot;'))


def url(pid: str) -> str:
    return f"https://{pid}.svatantrya.net/mcp"


def build_html() -> str:
    cards = []
    for p in PLUGINS:
        tests = ''.join(f'<li>{esc(t)}</li>' for t in p['tests'])
        cards.append(
            f'<section><h2>{esc(p["name"])} <code>{esc(url(p["id"]))}</code></h2>'
            f'<p><strong>{esc(p["tagline"])}</strong> {esc(p["desc"])}</p>'
            f'<p>Auth: {esc(p["auth"])} · Access: {esc(p["access"])} · Tools: {esc(str(p["tools"]))}</p>'
            f'<p>Install: chatgpt.com/plugins → + → Add custom MCP server → paste the URL → '
            f'{"No authentication" if p["auth"] == "none" else ("paste the owner token" if p["auth"] == "bearer" else "No authentication for reads; owner token unlocks scoring")} → '
            f'Create as a plugin → Install.</p>'
            f'<p>Try:</p><ol>{tests}</ol></section>')
    bcards = []
    for p in BUNDLES:
        tests = ''.join(f'<li>{esc(t)}</li>' for t in p['tests'])
        bcards.append(
            f'<section><h2>{esc(p["name"])} <code>{esc(url(p["id"]))}</code></h2>'
            f'<p><strong>{esc(p["tagline"])}</strong> {esc(p["desc"])}</p>'
            f'<p>Auth: {esc(p["auth"])} · Access: {esc(p["access"])} · Tools: {esc(str(p["tools"]))}</p>'
            f'<p>Install: chatgpt.com/plugins → + → Add custom MCP server → paste the URL → '
            f'{"No authentication" if p["auth"] == "none" else "paste the owner token"} → '
            f'Create as a plugin → Install.</p>'
            f'<p>Try:</p><ol>{tests}</ol></section>')
    cli = ''.join(f'<li><code>{esc(v)}</code></li>' for v in CLI.values())
    jsonld = json.dumps({
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        'name': 'Svatantrya ChatGPT plugins',
        'itemListElement': [
            {'@type': 'ListItem', 'position': i + 1,
             'item': {'@type': 'SoftwareApplication', 'name': p['name'],
                      'url': url(p['id']), 'applicationCategory': 'ChatGPT plugin',
                      'description': f'{p["tagline"]} {p["desc"]}'}}
            for i, p in enumerate(PLUGINS)],
    }, ensure_ascii=False, sort_keys=True)
    return (
        '<!doctype html><html lang="en"><head><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width,initial-scale=1">'
        '<title>Svatantrya plugins — ChatGPT + agents</title>'
        f'<script type="application/ld+json">{jsonld}</script>'
        '</head><body><main>'
        '<h1>Svatantrya plugins</h1>'
        '<p>Start with the three bundles: <strong>Svatantrya</strong> is everything '
        'public in one install; <strong>Studio</strong> and <strong>Factory</strong> '
        'are the owner rooms. Below them, the same tools split per function for '
        'agents and power users. '
        'Machine-readable spec: <a href="plugins.json">plugins.json</a>.</p>'
        + ''.join(bcards) +
        '<h2>Per-function hosts (granular; same tools, split up)</h2>'
        + ''.join(cards) +
        '<h2>For agents (CLI)</h2><ol>' + cli + '</ol>'
        '<h2>Related</h2><p>Satsang runs its own open MCP at '
        '<code>https://mcp.tantrafiles.xyz/mcp</code> (talks, teachers, places). '
        'The owner console (all 198 tools, bearer) is '
        '<code>https://mcp.sanskrit.help/mcp</code>.</p>'
        '</main></body></html>\n')


def build_md() -> str:
    lines = ['# Svatantrya plugins', '',
             'Start with the three bundles, then go granular if you want. Install: chatgpt.com/plugins → + → '
             'Add custom MCP server → paste URL → auth per row → Create as a plugin → Install.', '',
             '## Start here (bundles)', '']
    for p in BUNDLES:
        lines += [f'## {p["name"]}', '', f'`{url(p["id"])}`', '',
                  f'{p["tagline"]} {p["desc"]}', '',
                  f'Auth: {p["auth"]} · Access: {p["access"]} · Tools: {p["tools"]}', '',
                  'Try:']
        lines += [f'- {t}' for t in p['tests']] + ['']
    lines += ['## Per-function hosts (granular; same tools, split up)', '']
    for p in PLUGINS:
        lines += [f'## {p["name"]}', '', f'`{url(p["id"])}`', '',
                  f'{p["tagline"]} {p["desc"]}', '',
                  f'Auth: {p["auth"]} · Access: {p["access"]} · Tools: {p["tools"]}', '',
                  'Try:']
        lines += [f'- {t}' for t in p['tests']] + ['']
    lines += ['## For agents (CLI)', '']
    lines += [f'- `{v}`' for v in CLI.values()] + ['']
    lines += [f'<!-- machine-readable: {ORIGIN}/plugins/plugins.json -->', '']
    return '\n'.join(lines)


def build_json() -> dict:
    return {
        'format': 'svatantrya.plugins/1',
        'origin': ORIGIN,
        'install': ('Start with the bundles: Svatantrya (everything public, no auth), '
                    'Studio + Factory (owner token). Per-function hosts below for '
                    'agents and power users.'),
        'bundles': [
            {'id': p['id'], 'name': p['name'], 'url': url(p['id']),
             'tagline': p['tagline'], 'description': p['desc'],
             'auth': p['auth'], 'access': p['access'], 'tools': p['tools'],
             'test_prompts': p['tests']} for p in BUNDLES],
        'plugins': [
            {'id': p['id'], 'name': p['name'], 'url': url(p['id']),
             'tagline': p['tagline'], 'description': p['desc'],
             'auth': p['auth'], 'access': p['access'], 'tools': p['tools'],
             'test_prompts': p['tests']} for p in PLUGINS],
        'agent_cli': CLI,
        'related': {
            'satsang_mcp': 'https://mcp.tantrafiles.xyz/mcp',
            'owner_console': 'https://mcp.sanskrit.help/mcp',
        },
        'directory_status': ('Not yet submitted. Public five are submission-ready '
                             'pending domain verification + reviewer test runs; '
                             'owner four stay unlisted.'),
        'pages': {'human': f'{ORIGIN}/plugins/',
                  'markdown': f'{ORIGIN}/plugins/index.md'},
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('--check', action='store_true')
    args = ap.parse_args()
    files = {
        'index.html': build_html(),
        'index.md': build_md(),
        'plugins.json': json.dumps(build_json(), ensure_ascii=False, sort_keys=True, indent=2) + '\n',
    }
    if args.check:
        ok = True
        for name, want in files.items():
            p = OUT / name
            if not p.exists():
                print(f'emit_plugins --check: missing plugins/{name}', file=sys.stderr)
                ok = False
            elif p.read_text(encoding='utf-8') != want:
                print(f'emit_plugins --check: plugins/{name} differs', file=sys.stderr)
                ok = False
        return 0 if ok else 1
    OUT.mkdir(parents=True, exist_ok=True)
    for name, want in files.items():
        (OUT / name).write_text(want, encoding='utf-8')
    print(f'emit_plugins: plugins/index.html + index.md + plugins.json ({ORIGIN})')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
