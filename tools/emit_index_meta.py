#!/usr/bin/env python3
"""emit_index_meta.py — keep index.html's canonical/JSON-LD origin in sync.

The home page carries the site-level identity: `<link rel=canonical>`,
OpenGraph URL, and the WebSite JSON-LD with its SearchAction target. All of
them must name SITE_ORIGIN, or the entity points at the old host after a
domain cutover (and Google sees two competing canonicals).

This emitter rewrites only the origin inside those blocks. It never touches
copy. Idempotent: running twice changes nothing. --check is a CI gate.

  python3 tools/emit_index_meta.py            # rewrite from SITE_ORIGIN
  python3 tools/emit_index_meta.py --check    # fail if stale
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
INDEX = ROOT / "index.html"
ORIGIN = os.environ.get("SITE_ORIGIN", "https://svread.pages.dev").rstrip("/")

KNOWN_ORIGINS = ("https://svread.pages.dev",)


def rewrite(html: str) -> str:
    out = html
    for old in KNOWN_ORIGINS:
        out = out.replace(old, ORIGIN)
    # canonical link: insert if absent (idempotent)
    if 'rel="canonical"' not in out:
        out = out.replace(
            '<link rel="manifest"',
            f'<link rel="canonical" href="{ORIGIN}/"/>\n'
            '<link rel="manifest"', 1)
    # OpenGraph/Twitter URL + title, only if the tags exist or we add them
    if 'property="og:url"' not in out:
        out = out.replace(
            '<link rel="manifest"',
            f'<meta property="og:type" content="website"/>\n'
            f'<meta property="og:title" content="Svatantrya Reader"/>\n'
            f'<meta property="og:url" content="{ORIGIN}/"/>\n'
            f'<meta property="og:description" content="Checkable Trika '
            f'Shaivism library: Sanskrit, layered translations, traces and '
            f'hashes."/>\n'
            f'<meta name="twitter:card" content="summary"/>\n'
            '<link rel="manifest"', 1)
    return out


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--check", action="store_true")
    a = ap.parse_args()
    if not INDEX.is_file():
        print("emit_index_meta: no index.html", file=sys.stderr)
        return 2
    before = INDEX.read_text(encoding="utf-8")
    after = rewrite(before)
    # sanity: the JSON-LD must still parse
    m = re.search(r'<script type="application/ld\+json">(.*?)</script>',
                  after, re.S)
    if not m:
        print("emit_index_meta: JSON-LD block missing", file=sys.stderr)
        return 1
    try:
        ld = json.loads(m.group(1))
    except ValueError as e:
        print(f"emit_index_meta: JSON-LD invalid ({e})", file=sys.stderr)
        return 1
    if not str(ld.get("url", "")).startswith(ORIGIN):
        print(f"emit_index_meta: WebSite url not {ORIGIN}", file=sys.stderr)
        return 1
    if a.check:
        ok = after == before
        print("emit index-meta --check: " + ("GREEN" if ok else "RED (run it)"))
        return 0 if ok else 1
    INDEX.write_text(after, encoding="utf-8")
    print(f"index.html origin -> {ORIGIN} (canonical, og, JSON-LD)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
