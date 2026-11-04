#!/usr/bin/env python3
"""search.py — semantic search over the gate-labeled corpus + themes lookup. Stdlib only.

Index root: $SEARCH_INDEX_ROOT or ~/.scholar/search-index (records.jsonl,
vectors.json, meta.json from translation-work/tools/build_search_index.py).
Query embeddings via CF Workers AI bge-m3 (free tier); token from
CF_API_TOKEN / CLOUDFLARE_API_TOKEN env, else the box token files.
"""
import json
import math
import os
import urllib.request
from pathlib import Path

ALLOWED_GATES = ("PASS", "PUBLISHED", "OWNER")
_CACHE = {}


def index_root() -> Path:
    env = os.environ.get("SEARCH_INDEX_ROOT", "")
    return Path(env) if env else Path.home() / ".scholar" / "search-index"


def load():
    root = index_root()
    key = str(root)
    if key not in _CACHE:
        try:
            raw = (root / "records.jsonl").read_text(encoding="utf-8")
            vecs = json.loads((root / "vectors.json").read_text(encoding="utf-8"))
            meta = json.loads((root / "meta.json").read_text(encoding="utf-8"))
        except OSError:
            raise ValueError(f"Search index unavailable at {root} (build it first)")
        except ValueError:
            raise ValueError(f"Search index at {root} is corrupt")
        recs = [json.loads(l) for l in raw.splitlines() if l.strip()]
        vecs = json.loads((root / "vectors.json").read_text(encoding="utf-8"))
        meta = json.loads((root / "meta.json").read_text(encoding="utf-8"))
        if len(vecs.get("ids", [])) != len(vecs.get("vectors", [])):
            raise ValueError("Search index vectors/ids length mismatch")
        by_id = {r["id"]: r for r in recs if isinstance(r, dict) and r.get("id")}
        _CACHE[key] = (by_id, dict(zip(vecs["ids"], vecs["vectors"])), meta)
    return _CACHE[key]


def cf_token() -> str:
    # Order matters: the deploy token (CLOUDFLARE_API_TOKEN, pages-only) must
    # never shadow a Workers AI token. Box files beat it.
    if os.environ.get("CF_API_TOKEN"):
        return os.environ["CF_API_TOKEN"]
    for path in (Path("/root/.r2-env"), Path.home() / ".cf-api-token"):
        try:
            text = path.read_text()
        except OSError:
            continue
        for line in text.splitlines():
            line = line.strip()
            if line.startswith("CF_API_TOKEN="):
                return line.split("=", 1)[1].strip()
        if path.name == ".cf-api-token" and text.strip() and "=" not in text:
            return text.strip()
    return os.environ.get("CLOUDFLARE_API_TOKEN", "")


def cf_account() -> str:
    try:
        for line in Path("/root/.r2-env").read_text().splitlines():
            if line.strip().startswith("CF_ACCOUNT_ID="):
                return line.split("=", 1)[1].strip()
    except OSError:
        pass
    return os.environ.get("CF_ACCOUNT_ID", "954612afb5a97bb15dddcdc70176813d")


def embed_query(text: str):
    if not isinstance(text, str) or not text.strip():
        raise ValueError("Query text is required")
    token = cf_token()
    if not token:
        raise ValueError("No CF API token (CF_API_TOKEN env or box token file)")
    req = urllib.request.Request(
        f"https://api.cloudflare.com/client/v4/accounts/{cf_account()}/ai/run/@cf/baai/bge-m3",
        data=json.dumps({"text": ["question: " + text[:2000]]}).encode(),
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json",
                 "User-Agent": "svread-scholar-mcp/0.1"})
    with urllib.request.urlopen(req, timeout=120) as resp:
        return json.loads(resp.read())["result"]["data"][0]


def cosine(a, b) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a))
    nb = math.sqrt(sum(y * y for y in b))
    return dot / (na * nb + 1e-9)


def search_texts(query, work=None, kind=None, top_k=8, gates=None):
    by_id, vecs, meta = load()
    if not isinstance(top_k, int) or top_k < 1 or top_k > 20:
        raise ValueError("top_k must be 1..20")
    allowed = set(gates) if gates else set(ALLOWED_GATES)
    q = embed_query(query)
    scored = []
    for rid, vec in vecs.items():
        rec = by_id.get(rid)
        if not rec or rec.get("gate") not in allowed:
            continue
        if work and rec.get("work") != work:
            continue
        if kind and rec.get("kind") != kind:
            continue
        scored.append((cosine(q, vec), rec))
    scored.sort(key=lambda t: -t[0])
    return {"model": meta.get("model", ""), "count": len(scored),
            "results": [{"id": r["id"], "kind": r.get("kind", ""),
                         "work": r.get("work", ""), "ref": r.get("ref", ""),
                         "text": r.get("text", "")[:500],
                         "gate": r.get("gate", ""),
                         "license": r.get("license", ""),
                         "score": round(float(s), 4)}
                        for s, r in scored[:top_k]]}


def _theme_files():
    ipvv = Path(os.environ.get("IPVV_ROOT", "/root/ipvv"))
    return [ipvv / "site" / "data" / "themes" / n for n in
            ("clusters.json", "adjudication-cl3.json", "theme-map-ipvv-v0.json",
             "theme-discovery-ipvv-v0.json", "index.json")]


def text_themes(work=None, ref=None, query=None):
    hits = []
    for path in _theme_files():
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            continue
        items = data if isinstance(data, list) else [data]
        for i, t in enumerate(items):
            if not isinstance(t, dict):
                continue
            blob = json.dumps(t, ensure_ascii=False)
            if work and work not in blob:
                continue
            if ref and ref not in blob:
                continue
            label = ((t.get("proposed_theme", {}) or {}).get("label")
                     or t.get("label") or t.get("theme_id")
                     or t.get("cluster_id") or path.stem)
            claim = ((t.get("proposed_theme", {}) or {}).get("core_claim", "")
                     or t.get("core_claim", ""))
            hits.append({"theme": str(label)[:200],
                         "core_claim": str(claim)[:400],
                         "certificate": ((t.get("proposed_theme", {}) or {}).get("certificate")
                                         or t.get("certificate", "")),
                         "members": ((t.get("proposed_theme", {}) or {}).get("members")
                                     or t.get("members", "") or t.get("member_c1_ids", "")),
                         "source": path.name})
    if query and isinstance(query, str):
        toks = {w.lower() for w in query.split() if len(w) > 3}
        def score(h):
            blob = (h["theme"] + " " + h["core_claim"]).lower()
            return sum(1 for t in toks if t in blob)
        hits.sort(key=score, reverse=True)
    return {"themes": hits[:12], "count": len(hits)}
