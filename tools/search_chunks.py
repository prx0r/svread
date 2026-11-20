#!/usr/bin/env python3
"""search_chunks.py — instant lexical search over data/search-index/records/.

    Per-work shards (one small .jsonl per work + shards.json manifest), merged
    at load. The old monolith data/search-index/records.jsonl is still read as
    a fallback where present. stdlib only, no network.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SHARDS = ROOT / "data" / "search-index" / "records"
RECORDS = ROOT / "data" / "search-index" / "records.jsonl"
LAYER_RANK = {"c1": 0, "l2": 1, "argmap": 2, "l3": 3, "l4": 4, "t1": 5, "l0": 6,
              "preview": 7, "t1-doc": 8, "source": 9}
STOP = {"a", "an", "the", "of", "in", "on", "to", "and", "or", "is", "are", "was",
        "be", "by", "for", "with", "as", "at", "from", "that", "this", "it", "its",
        "into", "than", "then", "so", "such", "what", "which", "who", "how"}


def fold(s: str) -> str:
    s = unicodedata.normalize("NFKD", s or "")
    s = "".join(c for c in s if not unicodedata.combining(c))
    s = s.replace("@", "")
    s = re.sub(r"[^A-Za-z0-9]+", " ", s.lower())
    return " ".join(s.split())


def variants(term: str) -> list[str]:
    """Sanskrit-tolerant variants: the term, and a stem with a trailing vowel
    dropped (puryaṣṭaka -> puryaṣṭak matches puryaṣṭake / puryaṣṭakādau)."""
    out = [term]
    if len(term) >= 5 and term[-1] in "aeiou":
        out.append(term[:-1])
    return out


def term_in(text: str, term: str) -> bool:
    return any(v in text for v in variants(term))


def context(text: str, needle: str, width: int = 110) -> str:
    i = text.find(needle)
    if i < 0:
        return text[:2 * width]
    a, b = max(0, i - width), min(len(text), i + width)
    return ("…" if a else "") + text[a:b] + ("…" if b < len(text) else "")


_CACHE = None


def load():
    global _CACHE
    if _CACHE is None:
        recs = []
        try:
            shard_files = sorted(SHARDS.glob("*.jsonl")) if SHARDS.is_dir() else []
        except OSError:
            shard_files = []
        try:
            if shard_files:
                for f in shard_files:
                    recs.extend(json.loads(l) for l in
                                f.read_text(encoding="utf-8").splitlines() if l.strip())
            elif RECORDS.exists():
                recs = [json.loads(l) for l in
                        RECORDS.read_text(encoding="utf-8").splitlines() if l.strip()]
        except OSError:
            recs = []
        if not recs:
            raise ValueError(f"search index missing under {SHARDS} (run tools/emit_search_index.py)")
        _CACHE = recs
    return _CACHE


def search(query, work=None, layers=None, top=10):
    q = fold(query)
    if not q:
        raise ValueError("query required")
    content = [t for t in q.split() if t not in STOP] or q.split()
    out = []
    for r in load():
        if work and r["work"] != work:
            continue
        if layers and r["layer"] not in layers:
            continue
        t = r["text"]
        phrase = q in t or " ".join(variants(q)[-1:]) in t and len(content) == 1
        allt = all(term_in(t, x) for x in content)
        anyt = any(term_in(t, x) for x in content)
        if not (phrase or allt or (len(content) == 1 and anyt)):
            continue
        score = 4 if phrase else (2 if allt else 1)
        out.append((score, LAYER_RANK.get(r["layer"], 9), r["work"],
                    r["locator"] or r["target"], r["verse"] or 0, r))
    out.sort(key=lambda x: (-x[0], x[1], x[2], x[3], x[4]))
    hits = out[:top]
    hit_ids = {h["id"] for *_, h in hits}
    # Locus expansion: a level's English may not repeat the Sanskrit term
    # (it says "body-city-eight" for puryaṣṭaka). For every locus we matched,
    # add that locus's other held levels as companions, clearly marked, so a
    # caller sees the whole stack for the place the term occurs.
    loci = {(h["work"], h["locator"]) for *_, h in hits if h["locator"]}
    locus_verses: dict = {}
    for *_, h in hits:
        if h["locator"] and h["verse"]:
            locus_verses.setdefault((h["work"], h["locator"]), set()).add(h["verse"])
    hit_layers = {(h["work"], h["locator"], h["layer"]) for *_, h in hits if h["locator"]}
    best: dict = {}
    for r in load():
        key = (r["work"], r["locator"], r["layer"])
        if (r["work"], r["locator"]) not in loci or r["id"] in hit_ids or key in hit_layers:
            continue
        if r["layer"] not in ("source", "t1", "l0", "argmap", "l2", "c1", "l3", "l4", "t1-doc"):
            continue
        # Rank representatives: same verse as a lexical hit > row containing the
        # term > first row. So a level shows the verse actually asked about.
        same = 1 if r["verse"] in locus_verses.get((r["work"], r["locator"]), ()) else 0
        hit = 1 if term_in(r["text"], content[0]) else 0
        rank = (same, hit)
        cur = best.get(key)
        if cur is None or rank > cur[0]:
            best[key] = (rank, r)
    companions = [r for _, r in best.values()]
    companions.sort(key=lambda r: (r["work"], r["locator"] or "", LAYER_RANK.get(r["layer"], 9)))
    groups: dict = {}
    for *_, h in hits:
        g = groups.setdefault(h["work"], {"work": h["work"], "hits": [], "layers": set()})
        g["layers"].add(h["layer"])
        g["hits"].append(h)
    for c in companions:
        g = groups.setdefault(c["work"], {"work": c["work"], "hits": [], "layers": set()})
        g["layers"].add(c["layer"])
        g["hits"].append(c)
    for g in groups.values():
        g["layers"] = sorted(g["layers"], key=lambda l: LAYER_RANK.get(l, 9))
        g["hits"].sort(key=lambda r: (r["locator"] or "", LAYER_RANK.get(r["layer"], 9), r["verse"] or 0))
    needle = q if q in (hits[0][5]["text"] if hits else "") else variants(content[0])[-1]
    def rec(h, match):
        return {"work": h["work"], "target": h["target"], "locator": h["locator"],
                "verse": h["verse"], "layer": h["layer"], "gate": h["gate"],
                "status": h["status"], "match": match,
                "context": context(h["text"], needle),
                "snippet": h["snippet"], "source": h["source"]}
    return {"query": query, "folded": q, "total": len(out),
            "returned": len(hits), "companions": len(companions),
            "groups": list(groups.values()),
            "records": [rec(*h, "lexical") for h in
                        [(t[5],) for t in hits]] +
                       [rec(c, "same-chunk") for c in companions]}


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("query")
    ap.add_argument("--work")
    ap.add_argument("--layers", help="comma-separated (source,t1,l0,argmap,l2,c1,l3,l4,t1-doc,preview)")
    ap.add_argument("--top", type=int, default=10)
    ap.add_argument("--json", action="store_true")
    a = ap.parse_args()
    layers = [x.strip() for x in a.layers.split(",")] if a.layers else None
    try:
        res = search(a.query, work=a.work, layers=layers, top=a.top)
    except ValueError as e:
        print(f"search_chunks: {e}", file=sys.stderr)
        return 2
    if a.json:
        print(json.dumps(res, ensure_ascii=False, indent=1))
        return 0
    print(f"query '{a.query}' ({res['folded']}): {res['total']} matching units")
    for g in res["groups"]:
        print(f"\n## {g['work']}  layers: {', '.join(g['layers'])}")
        for h in g["hits"]:
            loc = h["locator"] or h["target"] or "-"
            v = f" v{h['verse']}" if h["verse"] else ""
            res_h = next(x for x in res['records'] if x['work'] == h['work']
                         and x['layer'] == h['layer'] and x['source'] == h['source'])
            print(f"  [{h['layer']}] {loc}{v}  ({h['gate']})")
            print(f"      …{res_h['context'][:220]}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
