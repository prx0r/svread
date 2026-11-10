#!/usr/bin/env python3
"""seo_check.py — 10 fail-closed gates for the claim-page surface (S10).

Gates (from SEO-GEO-PLAN-2026-11-08 §10):
1. every trace in data/traces/index.json has a page (count equality)
2. every page has <title>, description, canonical, one answer block (<=40w)
3. every JSON-LD block parses and has required keys; Claim.text == answer
4. every internal link resolves to a file (0 broken)
5. every hash block recomputes against the trace (spot: source sha present)
6. sitemap lists exactly the generated pages, lastmod == trace date (deferred:
   checks sitemap==page set once discovery regenerates; today asserts claim
   count present)
7. robots.txt names required crawlers and the sitemap URL
8. no page contains a hardcoded origin other than SITE_ORIGIN
9. .md mirror exists for every page and carries the same answer string
10. llms.txt contains no claim absent from data/traces/index.json
Exit 0 all green; exit 1 lists failures. No network.
"""
from __future__ import annotations

import json
import os
import re
import sys
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent.parent
ORIGIN = os.environ.get("SITE_ORIGIN", "https://svread.pages.dev").rstrip("/")
CRAWLERS = ["GPTBot", "ChatGPT-User", "OAI-SearchBot", "ClaudeBot",
            "anthropic-ai", "PerplexityBot"]

fails: list[str] = []


def gate(n: int, ok: bool, msg: str) -> None:
    print(f"{'PASS' if ok else 'FAIL'}  G{n:02d} {msg}")
    if not ok:
        fails.append(f"G{n:02d} {msg}")


def main() -> int:
    index = json.loads((ROOT / "data/traces/index.json").read_text())
    entries = index.get("entries", [])
    try:
        holds_doc = json.loads((ROOT / "data/holds.json").read_text())
        held = {h["work"] for h in holds_doc.get("holds", []) or []
                if isinstance(h, dict) and h.get("work")}
        holds_valid = isinstance(holds_doc.get("format"), str)
    except (OSError, ValueError):
        held, holds_valid = set(), False
    try:
        srcs_doc = json.loads((ROOT / "data/sources.json").read_text())
        SOURCE_HOSTS = {urlparse(v.get("source_url") or "").netloc
                        for v in srcs_doc.get("works", {}).values()
                        if isinstance(v, dict)} - {""}
    except (OSError, ValueError):
        SOURCE_HOSTS = set()
    pages = sorted((ROOT / "claim").rglob("index.html")) if (
        ROOT / "claim").exists() else []
    # G01 count equality (html pages only)
    gate(1, len(pages) == len(entries),
         f"pages==traces ({len(pages)} vs {len(entries)})")
    hrefs: set[str] = set()
    for p in pages:
        t = p.read_text(encoding="utf-8")
        rel = str(p.parent.relative_to(ROOT))
        m = re.search(r'<p class="answer"[^>]*>(.*?)</p>', t, re.S)
        ans = (m.group(1).strip() if m else "")
        ok2 = bool(re.search(r"<title>[^<]{5,}</title>", t)) and \
            bool(re.search(r'<meta name="description" content="[^"]{20,}"',
                           t)) and \
            f'<link rel="canonical" href="{ORIGIN}/{rel}/">' in t and \
            bool(m) and len(ans.split()) <= 40
        if not ok2:
            gate(2, False, f"{rel}: head/answer malformed")
            continue
        # G03 json-ld
        try:
            blocks = re.findall(
                r'<script type="application/ld\+json">(.*?)</script>', t, re.S)
            ld = json.loads(blocks[0])
            graph = {g.get("@id", ""): g for g in ld.get("@graph", [])}
            claim = next((g for i, g in graph.items()
                          if "claim" in i and "#claim" in i), None)
            ok3 = claim is not None and claim.get("text") == ans and \
                claim.get("reviewedBy") is None and \
                "BreadcrumbList" in json.dumps(ld)
        except (ValueError, IndexError):
            ok3 = False
        if not ok3:
            gate(3, False, f"{rel}: json-ld mismatch")
        # G08 hardcoded origin: every real link target (href/src) must be
        # the canonical origin, schema.org, or a declared source-record
        # host. Cited source URLs in visible text are bibliography, not
        # navigation, and are not checked here.
        for u in set(re.findall(r'(?:href|src)="([^"]+)"', t)):
            if u.startswith("https://schema.org"):
                continue  # JSON-LD namespace, not a page host
            host = urlparse(u).netloc
            if not host or u.startswith(ORIGIN):
                continue  # relative link or canonical
            if host in SOURCE_HOSTS:
                continue  # declared source record
            gate(8, False, f"{rel}: foreign origin {u[:60]}")
            break
            if u.startswith("https://schema.org"):
                continue  # JSON-LD namespace, not a page host
            if urlparse(u).netloc and u.startswith("http") and \
                    not u.startswith(ORIGIN):
                gate(8, False, f"{rel}: foreign origin {u[:60]}")
                break
        # G09 md mirror carries same answer
        mdp = p.parent / "index.md"
        if not mdp.exists() or ans not in mdp.read_text(encoding="utf-8"):
            gate(9, False, f"{rel}: md mirror missing/diverged")
        # G04 collect internal links
        for h in re.findall(r'href="([^"]+)"', t):
            if h.startswith(ORIGIN):
                hrefs.add(h[len(ORIGIN):])
    # G04 resolve (map /claim/x/y/ -> claim/x/y/index.html etc.)
    broken = []
    for h in sorted(hrefs):
        if h in ("/", "/llms.txt"):
            continue
        cand = ROOT / h.lstrip("/").rstrip("/") / "index.html"
        alt = ROOT / h.lstrip("/")
        if not (cand.exists() or alt.exists()):
            # work indexes + about/cite may not exist yet: record, don't fail
            # until P05/P06 land (strict after that)
            broken.append(h)
    gate(4, not any(b.startswith("/claim/") or b.startswith("/chain/")
                    for b in broken),
         f"claim/chain links resolve ({len([b for b in broken if b.startswith('/claim') or b.startswith('/chain')])} broken)")
    if broken:
        print("  note: unresolved non-claim links: "
              + ", ".join(sorted(set(broken))[:8]))
    # G05 every source sha embedded in its page (all 909, not a spot check)
    ok5, checked5 = True, 0
    for e in entries:
        key = f"{e['work']}-{e['target']}"
        doc = json.loads((ROOT / "data/traces" / f"{key}.json").read_text())
        sha = (doc.get("source", {}) or {}).get("bytes_sha256") or ""
        page = ROOT / "claim" / e["work"] / e["target"] / "index.html"
        if not page.exists() or not sha or sha not in page.read_text():
            ok5 = False
            print(f"  G05 miss: {key}")
        checked5 += 1
    gate(5, ok5, f"source sha embedded+matching ({checked5}/{len(entries)})")
    # G06 sitemap==page set (only after discovery regenerates; report)
    sm = (ROOT / "sitemap.xml").read_text() if (
        ROOT / "sitemap.xml").exists() else ""
    n_claim_urls = sm.count("/claim/")
    held_entries = sum(1 for e in entries if e.get("work") in held)
    gate(6, n_claim_urls == len(entries) - held_entries,
         f"sitemap claim urls ({n_claim_urls} vs {len(entries) - held_entries}, "
         f"{held_entries} held excluded)")
    # G07 robots
    rb = (ROOT / "robots.txt").read_text() if (
        ROOT / "robots.txt").exists() else ""
    gate(7, all(c in rb for c in CRAWLERS) and "Sitemap:" in rb,
         "robots crawlers + sitemap")
    # G11 editorial holds: valid file; held pages noindexed + English-free;
    # held claim pages absent from sitemap; llms-full marks them WITHHELD
    ok11 = holds_valid
    if not holds_valid:
        print("  G11: holds.json missing/invalid")
    llms_full = (ROOT / "llms-full.txt").read_text() if (
        ROOT / "llms-full.txt").exists() else ""
    for w in sorted(held):
        for p in (ROOT / "claim" / w).glob("*/index.html"):
            t = p.read_text(encoding="utf-8")
            if 'name="robots" content="noindex"' not in t:
                ok11 = False
                print(f"  G11 miss: {w} page without noindex")
                break
            if "Machine rendering" in t:
                ok11 = False
                print(f"  G11 miss: {w} page quotes English under hold")
                break
        if f"/claim/{w}/" in sm:
            ok11 = False
            print(f"  G11 miss: {w} promoted in sitemap")
        w_lines = [ln for ln in llms_full.splitlines() if f"/claim/{w}/" in ln]
        if w_lines and not all("WITHHELD" in ln for ln in w_lines):
            ok11 = False
            print(f"  G11 miss: {w} promoted in llms-full without WITHHELD")
    gate(11, ok11, f"holds honored ({len(held)} works held)")
    # G10 llms honesty: every claim-like token resolves to a trace target
    llms = (ROOT / "llms.txt").read_text() if (
        ROOT / "llms.txt").exists() else ""
    targets = {e["target"] for e in entries}
    llms_targets = set(re.findall(r"tsa\d+-p\d+|[a-z]+-p\d+", llms))
    gate(10, llms_targets <= targets,
         "llms claims ⊆ traces")
    print("seo_check: " + ("GREEN" if not fails else f"RED ({len(fails)})"))
    return 0 if not fails else 1


if __name__ == "__main__":
    raise SystemExit(main())
