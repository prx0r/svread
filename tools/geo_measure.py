#!/usr/bin/env python3
"""geo_measure.py — S09 measurement harness: run the frozen question bank
against real search engines and record whether OUR site is retrieved/cited.

Ontology (never collapse): retrieved = our result appeared in the returned set;
cited = our exact URL appeared (search: same as retrieved; kept separate for
AI-answer engines where a summary can retrieve without linking); absorbed =
our phrasing survives in an AI answer (null unless an AI overview is returned).
Errors are ERRORS — recorded as status=ERROR rows, never as 'not retrieved'.

Engines (v1): SerpAPI `google` and `bing` (needs SERPAPI_KEY or --key).
AI-answer engines (chatgpt/perplexity) are structured in the row schema but
not queried until a key exists — no key, no claim.

Output: data/geo/<label>.jsonl (one row per question×engine) + summary.
Baseline first: run `--label baseline` BEFORE any tactic change; the question
file is frozen (versioned) so runs stay comparable.
"""
from __future__ import annotations

import argparse
import datetime
import json
import os
import sys
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
QUESTIONS = ROOT / "data" / "geo" / "questions.json"
OUTDIR = ROOT / "data" / "geo"
OUR_HOSTS = ("svatantrya.net", "svread.pages.dev")
UA = "svread-geo-measure/1.0 (+https://svatantrya.net)"


def serp(key: str, engine: str, q: str, extra: dict | None = None) -> dict:
    params = {"engine": engine, "q": q, "api_key": key, "num": "10"}
    if extra:
        params.update(extra)
    url = "https://serpapi.com/search.json?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)


def score(engine: str, resp: dict) -> dict:
    organic = resp.get("organic_results") or []
    hits = []
    for i, r in enumerate(organic, start=1):
        link = r.get("link") or ""
        if any(h in link for h in OUR_HOSTS):
            hits.append({"rank": i, "url": link, "title": r.get("title", "")})
    fs = resp.get("featured_snippet") or {}
    ai = resp.get("ai_overview") or {}
    return {
        "retrieved": bool(hits),
        "cited": bool(hits),
        "our_hits": hits,
        "top_url": organic[0].get("link") if organic else None,
        "featured_snippet_owner": (fs.get("link") if fs else None),
        "ai_overview_present": bool(ai),
        "absorbed": None,  # computed only when an AI answer text exists
        "error": None,
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--key", default=os.environ.get("SERPAPI_KEY", ""))
    ap.add_argument("--engine", default="google,bing")
    ap.add_argument("--label", default="")
    ap.add_argument("--limit", type=int, default=0, help="0 = all questions")
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()
    doc = json.loads(QUESTIONS.read_text())
    qs = (doc.get("aeo") or []) + (doc.get("entity") or [])
    if a.limit:
        qs = qs[: a.limit]
    engines = [e.strip() for e in a.engine.split(",") if e.strip()]
    if a.dry_run:
        print(f"plan: {len(qs)} questions × engines {engines} = "
              f"{len(qs) * len(engines)} rows; output data/geo/"
              f"{a.label or '<label>'}.jsonl; key "
              f"{'present' if a.key else 'MISSING (need SERPAPI_KEY)'}")
        return 0
    if not a.key:
        print("geo_measure: no SERPAPI_KEY (env or --key) — refusing, "
              "no baseline without real rows", file=sys.stderr)
        return 2
    label = a.label or "run-" + datetime.date.today().isoformat()
    OUTDIR.mkdir(parents=True, exist_ok=True)
    out = OUTDIR / f"{label}.jsonl"
    stamp = datetime.datetime.now(datetime.timezone.utc).isoformat()
    rows, errors = [], 0
    with out.open("a", encoding="utf-8") as fh:
        for q in qs:
            for eng in engines:
                try:
                    resp = serp(a.key, eng, q)
                    if resp.get("error"):
                        raise RuntimeError(str(resp["error"])[:120])
                    row = {"at": stamp, "engine": eng, "question": q,
                           "status": "ok", **score(eng, resp)}
                except Exception as e:  # noqa: BLE001 — errors are data
                    errors += 1
                    row = {"at": stamp, "engine": eng, "question": q,
                           "status": "ERROR", "retrieved": None,
                           "cited": None, "error": str(e)[:200]}
                fh.write(json.dumps(row, ensure_ascii=False) + "\n")
                rows.append(row)
                print(f"  [{eng}] {q[:52]!r} -> "
                      f"{'ERROR' if row['status']=='ERROR' else ('CITED rank '+str(row['our_hits'][0]['rank']) if row.get('cited') else 'not cited')}")
    ok = [r for r in rows if r["status"] == "ok"]
    cited = [r for r in ok if r.get("cited")]
    print(f"\nsummary: {len(rows)} rows, {errors} ERRORS, cited "
          f"{len(cited)}/{len(ok)} = "
          f"{(100*len(cited)//max(len(ok),1))}% host-presence "
          f"(label={label}, file=data/geo/{label}.jsonl)")
    print("baseline recorded. Next: Search Console submit, then re-run "
          "weekly with the same label family; kill any tactic that does not "
          "move cited% over 3 runs beyond noise.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
