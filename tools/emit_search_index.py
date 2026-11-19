#!/usr/bin/env python3
"""emit_search_index.py — one fast, offline, Sanskrit-aware index over EVERY
chunk and EVERY level we actually hold. Stdlib only, deterministic, --check.

Why: the semantic index (translation-work/tools/build_search_index.py) covers
only works with a Scholar projection and needs a network embedding call. A
visitor asking "where does Abhinavagupta describe the City of Eight?" cannot
reach Tantrāloka through it. This index is lexical (instant, no network, no
embeddings) and covers all works, with honest labels for what each record is.

Sources, read-only at build time (the same sibling repos every other emitter
reads):
  - translation-work/<work>/passages.jsonl   -> Sanskrit chunk text (all works)
  - translation-work/<work>/data/<song>.<layer>.json -> canonical levels
  - translation-work/<work>/T1.md            -> translation document (t1-doc)
  - svread/data/preview/<work>.json          -> UNREVIEWED previews

Output (deterministic bytes):
  data/search-index/meta.json     counts, per-work/layer coverage, input hashes
  data/search-index/records.jsonl one JSON per unit: folded `text` for matching,
                                  display `snippet`, pointers, gate, status

Never invents text. Never promotes a label: a translation document is labelled
t1-doc, a preview UNREVIEWED, a canonical layer by its code + gate.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TW = Path("/root/translation-work")
OUT = ROOT / "data" / "search-index"
FORMAT = "svread-search-index/1"
MAX_TEXT = 40000
LEVELS = ("t1", "l0", "argmap", "l2", "c1", "l3", "l4", "c2")
SNIPPET = 220


def fold(s: str) -> str:
    """Diacritic-insensitive, case-insensitive, punctuation-free fold.

    NFKD + strip combining marks maps ṣ→s, ā→a, ṃ→m, ñ→n, ṭ→t, ... so an
    ASCII query 'puryastaka' matches 'puryaṣṭakādau'. '@' is GRETIL avagraha."""
    s = unicodedata.normalize("NFKD", s or "")
    s = "".join(c for c in s if not unicodedata.combining(c))
    s = s.replace("@", "")
    s = re.sub(r"[^A-Za-z0-9]+", " ", s.lower())
    return " ".join(s.split())


def sha(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


def load(p: Path):
    return json.loads(p.read_text(encoding="utf-8"))


def clip(s: str, n: int = MAX_TEXT) -> str:
    return s if len(s) <= n else s[:n]


def passage_ranges(passages_path: Path) -> list[tuple[str, int | None, int | None, str]]:
    """(locator, verse_start, verse_end, verses_label) from passages.jsonl."""
    out = []
    try:
        lines = passages_path.read_text(encoding="utf-8").splitlines()
    except OSError:
        return out
    for line in lines:
        if not line.strip():
            continue
        try:
            r = json.loads(line)
        except ValueError:
            continue
        loc = r.get("locator")
        if not isinstance(loc, str) or not loc:
            continue
        vs = str(r.get("verses") or "")
        m = re.match(r"^\s*\d+\.(\d+)\s*-\s*(\d+)\.(\d+)", vs)
        if m:
            out.append((loc, int(m.group(1)), int(m.group(3)), vs))
        else:
            out.append((loc, None, None, vs))
    return out


def locator_for(verse: int | None, ranges) -> tuple[str, str]:
    if verse is None:
        return "", ""
    for loc, a, b, label in ranges:
        if a is not None and a <= verse <= b:
            return loc, label
    return "", ""


def t1_text(rows) -> str:
    parts = []
    for r in rows if isinstance(rows, list) else [rows]:
        if not isinstance(r, dict):
            continue
        if r.get("quick_english"):
            parts.append(str(r["quick_english"]))
        for t in (r.get("tokens") or [])[:400]:
            if isinstance(t, dict):
                parts.append(f"{t.get('surface','')} {t.get('quick_gloss','')}")
    return " ".join(parts)


def l0_text(rows) -> str:
    parts = []
    for r in rows if isinstance(rows, list) else [rows]:
        if not isinstance(r, dict):
            continue
        surf = r.get("surface", "")
        opts = r.get("options") or []
        gl = opts[int(r.get("chosen_index") or 0)].get("gloss", "") if opts else ""
        parts.append(f"{surf} {gl}")
    return " | ".join(parts)


def flat_text(rows, keys) -> str:
    parts = []
    for r in rows if isinstance(rows, list) else [rows]:
        if isinstance(r, dict):
            for k in keys:
                v = r.get(k)
                if isinstance(v, str) and v.strip():
                    parts.append(v)
                elif isinstance(v, list):
                    parts.extend(str(x) for x in v if isinstance(x, (str, int)))
        elif isinstance(r, str):
            parts.append(r)
    return " ".join(parts)


def verse_of(r) -> int | None:
    v = r.get("verse")
    if isinstance(v, int):
        return v
    vid = r.get("verse_id")
    if isinstance(vid, str):
        m = re.search(r"-v(\d+)$", vid)
        if m:
            return int(m.group(1))
    return None


def doc_segments(raw: str, size: int = 6000) -> list[str]:
    """Split a translation document into paragraph-aligned segments."""
    paras = [p for p in re.split(r"\n\s*\n", raw) if p.strip()]
    segs, cur = [], ""
    for p in paras:
        if cur and len(cur) + len(p) + 2 > size:
            segs.append(cur)
            cur = ""
        cur = (cur + "\n\n" + p) if cur else p
    if cur.strip():
        segs.append(cur)
    return segs


def make(work, target, locator, verse, layer, gate, status, text, display, source):
    t = clip(fold(text))
    if not t:
        return None
    return {
        "id": f"{work}:{target}:{layer}:{verse if verse is not None else '-'}",
        "work": work,
        "target": target,
        "locator": locator,
        "verse": verse,
        "layer": layer,
        "gate": gate,
        "status": status,
        "source": source,
        "text": t,
        "snippet": (display or text).strip()[:SNIPPET],
    }


def build():
    records: list[dict] = []
    inputs: dict[str, str] = {}
    if not TW.is_dir():
        return None, "translation-work checkout not found", {}
    for wd in sorted(TW.iterdir()):
        if not wd.is_dir() or wd.name.startswith("."):
            continue
        work = wd.name
        gates = {}
        gp = wd / "GATE.json"
        if gp.exists():
            try:
                gates = load(gp)
            except ValueError:
                gates = {}
        ranges = passage_ranges(wd / "passages.jsonl")
        # 1. Sanskrit passage text (all works)
        pp = wd / "passages.jsonl"
        if pp.exists():
            inputs[str(pp)] = sha(pp.read_bytes())
            for loc, _a, _b, label in ranges:
                try:
                    pass
                except Exception:
                    pass
            for line in pp.read_text(encoding="utf-8").splitlines():
                if not line.strip():
                    continue
                try:
                    r = json.loads(line)
                except ValueError:
                    continue
                loc = r.get("locator")
                san = r.get("sanskrit") or ""
                if not (isinstance(loc, str) and san.strip()):
                    continue
                song = re.sub(r"-p\d+$", "", loc)
                gate = (gates.get(song) or {}).get("deterministic_gate", "UNKNOWN") \
                    if isinstance(gates, dict) else "UNKNOWN"
                rec = make(work, song, loc, None, "source", gate,
                           "Sanskrit chunk (verbatim edition span; verse label %s)" % (r.get("verses") or ""),
                           san, san, f"{work}/passages.jsonl")
                if rec:
                    records.append(rec)
        # 2. Canonical levels
        ddir = wd / "data"
        if ddir.is_dir():
            for layer in LEVELS:
                for f in sorted(ddir.glob(f"*.{layer}.json")):
                    song = f.name[:-(len(layer) + 6)]
                    try:
                        rows = load(f)
                    except (OSError, ValueError):
                        continue
                    inputs[str(f)] = sha(f.read_bytes())
                    gate = (gates.get(song) or {}).get("deterministic_gate", "UNKNOWN") \
                        if isinstance(gates, dict) else "UNKNOWN"
                    items = rows if isinstance(rows, list) else [rows]
                    if layer in ("t1", "l0") and isinstance(rows, list) and rows \
                            and isinstance(rows[0], dict) and ("verse" in rows[0] or "verse_id" in rows[0]):
                        for r in rows:
                            verse = verse_of(r)
                            loc, label = locator_for(verse, ranges)
                            text = t1_text([r]) if layer == "t1" else l0_text([r])
                            disp = r.get("quick_english") or text
                            rec = make(work, song, loc, verse,
                                       layer, gate, "canonical layer", text, disp, str(f.relative_to(TW)))
                            if rec:
                                records.append(rec)
                    elif layer == "argmap" and isinstance(rows, list) and rows \
                            and isinstance(rows[0], dict) and ("verse" in rows[0] or "verse_id" in rows[0]):
                        for r in rows:
                            verse = verse_of(r)
                            loc, _ = locator_for(verse, ranges)
                            rec = make(work, song, loc, verse,
                                       layer, gate, "canonical layer",
                                       flat_text([r], ("reconstruction", "premises", "inference", "question")),
                                       flat_text([r], ("reconstruction", "inference")), str(f.relative_to(TW)))
                            if rec:
                                records.append(rec)
                    elif layer in ("l2", "l3", "l4") and isinstance(rows, list) and rows \
                            and isinstance(rows[0], dict) and ("verse" in rows[0] or "verse_id" in rows[0]):
                        for r in rows:
                            verse = verse_of(r)
                            loc, _ = locator_for(verse, ranges)
                            rec = make(work, song, loc, verse,
                                       layer, gate, "canonical layer",
                                       flat_text([r], ("plain_english", "lines")),
                                       flat_text([r], ("plain_english", "lines")), str(f.relative_to(TW)))
                            if rec:
                                records.append(rec)
                    else:
                        rec = make(work, song, "", None, layer, gate, "canonical layer (song-level)",
                                   flat_text(items, ("essence", "renders", "sanskrit", "text", "note")),
                                   flat_text(items, ("essence", "text")), str(f.relative_to(TW)))
                        if rec:
                            records.append(rec)
        # 3. Translation document (prose / interlinear); honestly labelled
        t1md = wd / "T1.md"
        if t1md.exists():
            try:
                raw = t1md.read_text(encoding="utf-8")
            except OSError:
                raw = ""
            if raw.strip():
                inputs[str(t1md)] = sha(t1md.read_bytes())
                for i, seg in enumerate(doc_segments(raw), 1):
                    rec = make(work, "", "", None, "t1-doc", "UNKNOWN",
                               "translation document segment %d (not verse-mapped; see file)" % i,
                               seg, seg[:400], f"{work}/T1.md#seg{i}")
                    if rec:
                        records.append(rec)
    # 4. UNREVIEWED previews shipped by svread
    prev = ROOT / "data" / "preview"
    if prev.is_dir():
        for f in sorted(prev.glob("*.json")):
            if f.name == "index.json":
                continue
            try:
                d = load(f)
            except (OSError, ValueError):
                continue
            for c in d.get("chunks", []) or []:
                txt = c.get("preview_english") or ""
                if not txt.strip():
                    continue
                rec = make(d.get("work", f.stem), c.get("chunk", ""), "", None, "preview",
                           c.get("gate", "BLOCKED"), "UNREVIEWED machine preview",
                           txt, txt, f"data/preview/{f.name}")
                if rec:
                    records.append(rec)
    records.sort(key=lambda r: (r["work"], r["locator"], r["target"], r["layer"],
                                r["verse"] if r["verse"] is not None else -1, r["id"]))
    # dedupe identical units (work, locator, target, layer, verse, source);
    # ids collapse locator-less units, so key on the full identity instead.
    seen = {}
    for r in records:
        seen[(r["work"], r["locator"], r["target"], r["layer"], r["verse"], r["source"])] = r
    records = [seen[k] for k in sorted(seen, key=lambda k: tuple("" if x is None else str(x) for x in k))]
    cov: dict = {}
    for r in records:
        w = cov.setdefault(r["work"], {"records": 0, "layers": {}})
        w["records"] += 1
        w["layers"][r["layer"]] = w["layers"].get(r["layer"], 0) + 1
    blob = "\n".join(json.dumps(r, ensure_ascii=False, sort_keys=True) for r in records) + "\n"
    meta = {
        "format": FORMAT,
        "note": ("Lexical, offline index over every chunk and every level we "
                 "hold. `text` is folded (diacritics/case stripped) for "
                 "matching; `snippet` is display. layer=source is the Sanskrit "
                 "chunk; t1-doc is a translation document, not verse-mapped; "
                 "preview is UNREVIEWED. gate reflects the work's chunk gate."),
        "counts": {"records": len(records), "works": len(cov),
                   "by_layer": {l: sum(1 for r in records if r["layer"] == l)
                                for l in sorted({r["layer"] for r in records})}},
        "records_sha256": sha(blob.encode()),
        "inputs_sha256": {k: v for k, v in sorted(inputs.items())},
        "works": cov,
    }
    return {"records": blob, "meta": json.dumps(meta, ensure_ascii=False, sort_keys=True, indent=1) + "\n"}, "", meta


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true")
    a = ap.parse_args()
    built, err, meta = build()
    if err:
        print(f"emit_search_index: {err}", file=sys.stderr)
        return 2
    assert built is not None
    arts = {"data/search-index/records.jsonl": built["records"],
            "data/search-index/meta.json": built["meta"]}
    if a.check:
        ok = True
        for name, blob in arts.items():
            p = ROOT / name
            if not p.exists() or p.read_text(encoding="utf-8") != blob:
                print(f"mismatch or missing: {name}")
                ok = False
        print("emit search-index --check: " + ("GREEN" if ok else "RED"))
        return 0 if ok else 1
    for name, blob in arts.items():
        p = ROOT / name
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(blob, encoding="utf-8")
    print(f"published {meta['counts']['records']} records across "
          f"{meta['counts']['works']} works -> data/search-index/")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
