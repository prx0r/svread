#!/usr/bin/env python3
"""lingua.py — the shared language across all five systems. Stdlib, read-only.

  lingua.py resolve <id>     what bytes, what status, what license (or fail)
  lingua.py links <id>        every ID this one connects to (tension is the hub)
  lingua.py tensions           every tension known: personal + scholar cruxes
  lingua.py check              every sidecar ref + pack evidence ref resolves

ID grammar (see TENSIONS-LINGUA-SPEC.md): work:<work> | chunk:<work>:<locator>
| tension:<id> | crux:<work>:<slug> | essay:scholar:<work>:<essay_id>
| essay:personal:<path> | essay:expansion:<slug> | pack:<path> | aoc:<content_id>

Roots come from env (SVREAD_ROOT, TRANSLATION_WORK_ROOT, NIBBANAHELP_ROOT,
IPVV_ROOT, AOC_ROOT) so tests run on fixture trees. No writes, no network,
no models, no secrets in output. Private essay bodies are never excerpted.
"""
import hashlib
import json
import os
import re
import sys
from pathlib import Path

SVREAD = Path(os.environ.get("SVREAD_ROOT", "/root/svread"))
TW = Path(os.environ.get("TRANSLATION_WORK_ROOT", "/root/translation-work"))
NIB = Path(os.environ.get("NIBBANAHELP_ROOT", "/root/nibbanahelp"))
IPVV = Path(os.environ.get("IPVV_ROOT", "/root/ipvv"))
AOC = Path(os.environ.get("AOC_ROOT", "/root/aoc"))
TRIKA_X = Path(os.environ.get("TRIKA_X_ROOT", "/root/trika-x"))

HEADER_KEYS = ("day", "visibility", "voice", "audio", "resolves",
               "id", "status", "diarist", "opened", "domain", "roots",
               "factors", "factors_growing", "summary", "essay", "tension",
               "form", "evidence", "beats", "runtime_seconds", "contract")


class Unresolvable(Exception):
    pass


def sha_file(p: Path) -> str:
    return hashlib.sha256(p.read_bytes()).hexdigest()


def sha_text(s: str) -> str:
    return hashlib.sha256(s.encode()).hexdigest()


def load_json(p: Path):
    try:
        return json.loads(p.read_text())
    except (OSError, ValueError):
        return None


def header(p: Path) -> dict:
    try:
        text = p.read_text()
    except OSError:
        raise Unresolvable(f"unreadable: {p}")
    head = text.split("---", 1)[0] if "---" in text else ""
    out = {}
    for k in HEADER_KEYS:
        m = re.search(rf"^{k}:\s*(.+)$", head, re.M)
        if m:
            out[k] = m.group(1).strip()
    return out


def body(p: Path) -> str:
    text = p.read_text()
    return (text.split("---", 1)[1] if "---" in text else "").strip()


def sidecar(root=None) -> dict:
    root = root or NIB
    d = load_json(root / "tensions" / "_links.json")
    return d if isinstance(d, dict) else {}


# ---- resolvers: each returns a metadata+hashes record, never private bodies

def _openpatala_block(work: str) -> dict:
    """OpenPāṭala identity for a workdir. Read-only, never raises.

    Mirrors emit_scholar.source_ref (record sha + mapping status, explicit
    nulls on gaps). No edition_id: editions are CANDIDATE strings, so only
    the label travels (or null). Witnesses are not resolved here.
    """
    result = {"openpatala_work_id": None, "mapping_status": "UNKNOWN",
              "record_status": None, "record_sha256": None, "edition_label": None,
              "mapping_sha256": None, "scope": None, "language_conflict": None,
              "note": ""}
    try:
        rec_p = TW / work / "source" / "record.json"
        raw = rec_p.read_bytes()
        rec = json.loads(raw)
        if not isinstance(rec, dict) or rec.get("work") != work:
            result["note"] = "invalid or mismatched source record"
            return result
        result["record_sha256"] = hashlib.sha256(raw).hexdigest()
        result["record_status"] = rec.get("status") if isinstance(rec.get("status"), str) else None
        if result["record_status"] != "RECORDED":
            result["note"] = "source record is not RECORDED; mapping not resolved"
            return result
        edition = rec.get("edition")
        if isinstance(edition, dict) and isinstance(edition.get("label"), str):
            result["edition_label"] = edition["label"]
        try:
            map_raw = (TW / "source-maps" / "openpatala.json").read_bytes()
            mapping = json.loads(map_raw)
            works = mapping.get("works") if isinstance(mapping, dict) else None
            entry = works.get(work) if isinstance(works, dict) else None
            if not isinstance(entry, dict) or entry.get("work") != work:
                raise ValueError("missing or mismatched work mapping")
            status = entry.get("mapping_status")
            wid = entry.get("openpatala_work_id")
            if not ((status == "CANDIDATE" and isinstance(wid, str) and wid.strip()) or
                    (status == "UNMAPPED" and wid is None)):
                raise ValueError("invalid work mapping")
            result.update(openpatala_work_id=wid, mapping_status=status,
                          mapping_sha256=hashlib.sha256(map_raw).hexdigest(),
                          scope=entry.get("scope"),
                          language_conflict=entry.get("language_conflict"))
            result["note"] = "mapping is a candidate or unmapped; edition and witness not verified"
        except (OSError, ValueError, TypeError):
            result["note"] = "source record present; work mapping missing or invalid"
        return result
    except (OSError, ValueError, TypeError):
        result["note"] = "source record missing or unreadable"
        return result


def _valid_work(work: str) -> None:
    if not isinstance(work, str) or not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9_.-]{0,159}", work):
        raise Unresolvable(f"bad work: {work!r}")


def _personal_path(path: str, folder: str) -> Path:
    if not isinstance(path, str):
        raise Unresolvable('bad personal path')
    parts = Path(path).parts
    if len(parts) != 2 or parts[0] != folder or parts[1] in ('.', '..'):
        raise Unresolvable(f'bad {folder} path: {path!r}')
    base = (NIB / folder).resolve()
    candidate = (base / parts[1]).resolve()
    if candidate.parent != base:
        raise Unresolvable(f'{folder} path leaves its root')
    return candidate


def resolve_work(work: str) -> dict:
    _valid_work(work)
    d = TW / work
    if not d.is_dir():
        raise Unresolvable(f"unknown work: {work}")
    status = load_json(d / "STATUS.json") or {}
    counts = status.get("counts", {}) if isinstance(status, dict) else {}
    n_pass = sum(1 for _ in _jsonl(d / "passages.jsonl"))
    proj = SVREAD / "data" / "scholar" / f"{work}.json"
    rec = {"atom": "work", "id": f"work:{work}", "work": work,
           "passages": n_pass, "counts": counts,
           "projection": bool(proj.is_file()),
           "openpatala": _openpatala_block(work)}
    if proj.is_file():
        rec["projection_sha256"] = sha_file(proj)
    return rec


def _jsonl(p: Path):
    if not p.is_file():
        return
    for line in p.read_text().splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            yield json.loads(line)
        except ValueError:
            continue


def resolve_chunk(work: str, locator: str) -> dict:
    _valid_work(work)
    if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9_.-]{0,159}", locator or ""):
        raise Unresolvable(f"bad locator: {locator!r}")
    for row in _jsonl(TW / work / "passages.jsonl"):
        if row.get("locator") == locator:
            return {"atom": "chunk", "id": f"chunk:{work}:{locator}",
                    "work": work, "locator": locator,
                    "verses": row.get("verses", ""), "order": row.get("order", ""),
                    "projection": (SVREAD / "data" / "scholar" / f"{work}.json").is_file(),
                    "openpatala": _openpatala_block(work)}
    raise Unresolvable(f"unknown chunk: {work}:{locator}")


def resolve_tension(tid: str) -> dict:
    if not isinstance(tid, str) or not re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9_.-]{0,159}', tid):
        raise Unresolvable(f'bad tension: {tid!r}')
    p = _personal_path(f'tensions/{tid}.md', 'tensions')
    if not p.is_file():
        raise Unresolvable(f"unknown tension: {tid}")
    h = header(p)
    row = sidecar().get(tid, {})
    return {"atom": "tension", "id": f"tension:{tid}", "tension": tid,
            "status": h.get("status", "?"), "domain": h.get("domain", ""),
            "roots": h.get("roots", ""), "summary": h.get("summary", ""),
            "visibility": h.get("visibility", "private"),
            "essays": row.get("essays", []), "videos": row.get("videos", []),
            "packs": row.get("packs", []), "evidence": row.get("evidence", []),
            "file_sha256": sha_file(p)}


def pushing_catalog():
    d = load_json(SVREAD / "data" / "pushing-catalog.json")
    if not isinstance(d, dict) or not isinstance(d.get("records"), list):
        return []
    return d["records"]


def resolve_crux(work: str, slug: str) -> dict:
    for r in pushing_catalog():
        p = Path(r.get("file", ""))
        if r.get("work") == work and p.stem == slug:
            return {"atom": "crux", "id": f"crux:{work}:{slug}",
                    "work": work, "slug": slug,
                    "question": r.get("question", ""), "title": r.get("title", ""),
                    "file": r.get("file", ""), "git_blob": r.get("git_blob", "")}
    raise Unresolvable(f"unknown crux: {work}:{slug}")


def resolve_scholar_essay(work: str, essay_id: str) -> dict:
    _valid_work(work)
    if not re.fullmatch(r"essay:[a-f0-9]{64}", essay_id or ""):
        raise Unresolvable(f"bad essay id: {essay_id!r}")
    d = load_json(SVREAD / "data" / "scholar" / f"{work}.json")
    if not isinstance(d, dict):
        raise Unresolvable(f"no projection for work: {work}")
    for e in d.get("essays", []) or []:
        if e.get("essay_id") == essay_id:
            text = e.get("text", "") if isinstance(e.get("text"), str) else ""
            return {"atom": "essay", "id": f"essay:scholar:{work}:{essay_id}",
                    "kind": "scholar", "work": work, "title": e.get("title", ""),
                    "author": e.get("author", ""), "rights": e.get("rights", ""),
                    "identity_state": e.get("identity_state", ""),
                    "assisted": e.get("assisted", False),
                    "model": e.get("model", "") or "-",
                    "target": e.get("target", "") or "-",
                    "text_sha256": sha_text(text), "text_chars": len(text),
                    "excerpt": text[:300], "live_only": ["reviews", "grants"]}
    raise Unresolvable(f"unknown scholar essay: {work}:{essay_id}")


def resolve_expansion_essay(slug: str) -> dict:
    """Machine-compiled expansion draft (trika-x swarm). Metadata only.

    Body withheld (draft under review; owner voice inside). Exposes claim
    counts, tiers present, tracks, chunk, openpatala block, and review
    status — enough to route peer review without excerpting prose.
    """
    if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9_.:-]{0,159}", slug or ""):
        raise Unresolvable(f"bad expansion slug: {slug!r}")
    base = TRIKA_X / "formal-trika" / "swarm" / slug
    # Literal suffix append: with_suffix would turn slug "a.b" into "a.md".
    md, ej, rcp = (Path(str(base) + x) for x in (".md", ".essay.json", ".receipt.json"))
    if not md.is_file() or not ej.is_file():
        raise Unresolvable(f"not an expansion essay: {slug}")
    try:
        doc = json.loads(ej.read_text(encoding="utf-8"))
    except ValueError:
        raise Unresolvable(f"unreadable essay record: {slug}")
    tiers = sorted({c.get("tier") for c in doc.get("claims", []) if c.get("tier")})
    return {"atom": "essay", "id": f"essay:expansion:{slug}", "kind": "expansion",
            "title": doc.get("title", slug), "chunk": doc.get("chunk", ""),
            "verses": doc.get("verses", []), "tracks": doc.get("tracks", []),
            "claims": len(doc.get("claims", [])), "tiers": tiers,
            "theorems": [t.get("name") for t in doc.get("theorems", [])],
            "status": doc.get("status", ""), "excerpt": "(withheld: draft under review)",
            "text_sha256": sha_file(md),
            "openpatala": (json.loads(rcp.read_text(encoding="utf-8")).get("openpatala")
                           if rcp.is_file() else None)}


def resolve_personal_essay(path: str) -> dict:
    p = _personal_path(path, 'essays')
    if not p.is_file() or p.name.startswith("_"):
        raise Unresolvable(f"not a personal essay: {path}")
    h = header(p)
    rec = {"atom": "essay", "id": f"essay:personal:{path}", "kind": "personal",
           "title": "(withheld: not public)",
           "visibility": h.get("visibility", "private"),
           "resolves": h.get("resolves", "") or "-",
           "file_sha256": sha_file(p)}
    if h.get("visibility") == "public":
        rec['title'] = (body(p).splitlines() or [''])[0].lstrip('# ').strip()
        rec["excerpt"] = body(p)[:300]
    else:
        rec["excerpt"] = "(withheld: not public)"
    return rec


def resolve_pack(path: str) -> dict:
    p = _personal_path(path, 'videos')
    if not p.is_file() or not p.name.endswith(".pack.md"):
        raise Unresolvable(f"not a video pack: {path}")
    h = header(p)
    ev = [e.strip() for e in h.get("evidence", "-").split(",")
          if e.strip() and e.strip() != "-"]
    return {"atom": "pack", "id": f"pack:{path}", "essay": h.get("essay", ""),
            "tension": h.get("tension", "") or "-",
            "visibility": h.get("visibility", "private"),
            "form": h.get("form", ""), "contract": h.get("contract", ""),
            "evidence": ev, "beats": h.get("beats", ""),
            "runtime_seconds": h.get("runtime_seconds", ""),
            "file_sha256": sha_file(p)}


def resolve_aoc(content_id: str) -> dict:
    for row in _jsonl(AOC / "receipts" / "content.jsonl"):
        d = row.get("data", {}) if isinstance(row, dict) else {}
        if d.get("content_id") == content_id:
            return {"atom": "render", "id": f"aoc:{content_id}",
                    "event": row.get("event", ""), "at": row.get("at", ""),
                    "hook": d.get("hook", ""), "template": d.get("template", ""),
                    "slides": d.get("slides", ""), "zip": d.get("zip", ""),
                    "receipt_id": row.get("receipt_id", "")}
    raise Unresolvable(f"unknown aoc content: {content_id}")


def resolve(i: str) -> dict:
    if i.startswith("essay:expansion:"):
        return resolve_expansion_essay(i[len("essay:expansion:"):])
    if i.startswith("essay:scholar:"):
        rest = i[len("essay:scholar:"):]
        work, _, eid = rest.partition(":")
        return resolve_scholar_essay(work, eid)
    if i.startswith("essay:personal:"):
        return resolve_personal_essay(i[len("essay:personal:"):])
    if i.startswith("chunk:"):
        rest = i[len("chunk:"):]
        work, _, loc = rest.partition(":")
        return resolve_chunk(work, loc)
    if i.startswith("crux:"):
        rest = i[len("crux:"):]
        work, _, slug = rest.partition(":")
        return resolve_crux(work, slug)
    if i.startswith("tension:"):
        return resolve_tension(i[len("tension:"):])
    if i.startswith("pack:"):
        return resolve_pack(i[len("pack:"):])
    if i.startswith("aoc:"):
        return resolve_aoc(i[len("aoc:"):])
    if i.startswith("work:"):
        return resolve_work(i[len("work:"):])
    raise Unresolvable(f"unknown id kind: {i!r}")


# ---- link graph: tension is the hub, traversed both directions

def _evidence_ids(evidence) -> list:
    out = []
    for e in evidence or []:
        if e.startswith("tension:"):
            out.append(e)
        elif ":" in e:
            work, loc = e.split(":", 1)
            out.append(f"chunk:{work.strip()}:{loc.strip()}")
    return out


def links(i: str) -> list:
    # Validate paths before following any edges or reading their headers.
    resolve(i)
    out = set()
    if i.startswith("tension:"):
        tid = i[len("tension:"):]
        row = sidecar().get(tid, {})
        for e in row.get("essays", []):
            out.add(f"essay:personal:{e}")
        for v in row.get("videos", []) + row.get("packs", []):
            out.add(f"pack:{v}")
        out.update(_evidence_ids(row.get("evidence", [])))
    elif i.startswith("essay:personal:"):
        h = header(NIB / i[len("essay:personal:"):])
        if h.get("resolves"):
            out.add(f"tension:{h['resolves']}")
    elif i.startswith("pack:"):
        h = header(NIB / i[len("pack:"):])
        if h.get("essay"):
            out.add(f"essay:personal:{h['essay']}")
        if h.get("tension") and h["tension"] != "-":
            out.add(f"tension:{h['tension']}")
        out.update(_evidence_ids(
            [e.strip() for e in h.get("evidence", "-").split(",")
             if e.strip() and e.strip() != "-"]))
    elif i.startswith("chunk:"):
        rest = i[len("chunk:"):]
        out.add(f"work:{rest.split(':')[0]}")
        vdir = NIB / "videos"
        if vdir.is_dir():
            for vp in sorted(vdir.glob("*.pack.md")):
                h = header(vp)
                ev = [e.strip() for e in h.get("evidence", "-").split(",")]
                for kind_ref in _evidence_ids([e for e in ev if e != "-"]):
                    if kind_ref == i:
                        out.add(f"pack:{vp.relative_to(NIB).as_posix()}")
    elif i.startswith("crux:"):
        out.add(f"work:{i[len('crux:'):].split(':')[0]}")
    elif i.startswith("essay:scholar:"):
        rest = i[len("essay:scholar:"):]
        out.add(f"work:{rest.split(':')[0]}")
    elif i.startswith("essay:expansion:"):
        d = resolve_expansion_essay(i[len("essay:expansion:"):])
        if d.get("chunk") and ":" in d["chunk"]:
            out.add(f"chunk:{d['chunk']}")
            out.add(f"work:{d['chunk'].split(':')[0]}")
    elif i.startswith("work:"):
        work = i[len("work:"):]
        for r in pushing_catalog():
            if r.get("work") == work:
                out.add(f"crux:{work}:{Path(r.get('file', '')).stem}")
    elif i.startswith("aoc:"):
        pass  # terminal: receipts point nowhere further on disk
    else:
        raise Unresolvable(f"unknown id kind: {i!r}")
    # every link must itself resolve (fail closed, no dangling edges)
    good = set()
    for j in sorted(out):
        try:
            resolve(j)
            good.add(j)
        except Unresolvable:
            pass
    return sorted(good)


def all_tensions() -> list:
    out = []
    tdir = NIB / "tensions"
    if tdir.is_dir():
        for p in sorted(tdir.glob("*.md")):
            if p.name.startswith("_"):
                continue
            h = header(p)
            out.append({"id": f"tension:{p.stem}", "kind": "tension",
                        "status": h.get("status", "?"),
                        "domain": h.get("domain", ""),
                        "summary": h.get("summary", "")})
    for r in pushing_catalog():
        out.append({"id": f"crux:{r.get('work')}:{Path(r.get('file', '')).stem}",
                    "kind": "crux", "status": "open",
                    "domain": r.get("work", ""),
                    "summary": r.get("question", "")})
    return out


def check() -> int:
    errors, n_refs = [], 0
    for tid, row in sidecar().items():
        if not (NIB / "tensions" / f"{tid}.md").is_file():
            errors.append(f"_links.json: unknown tension '{tid}'")
            continue
        for e in row.get("essays", []):
            n_refs += 1
            if not (NIB / e).is_file():
                errors.append(f"_links.json: '{tid}' missing essay '{e}'")
        for v in row.get("videos", []) + row.get("packs", []):
            n_refs += 1
            if not (NIB / v).is_file():
                errors.append(f"_links.json: '{tid}' missing video '{v}'")
        for ref in _evidence_ids(row.get("evidence", [])):
            n_refs += 1
            try:
                resolve(ref)
            except Unresolvable as ex:
                errors.append(f"_links.json: '{tid}': {ex}")
    vdir = NIB / "videos"
    if vdir.is_dir():
        for vp in sorted(vdir.glob("*.pack.md")):
            rel = vp.relative_to(NIB).as_posix()
            h = header(vp)
            if h.get("essay") and not (NIB / h["essay"]).is_file():
                errors.append(f"{rel}: missing source essay '{h['essay']}'")
                n_refs += 1
            for ref in _evidence_ids(
                    [e.strip() for e in h.get("evidence", "-").split(",")
                     if e.strip() and e.strip() != "-"]):
                n_refs += 1
                try:
                    resolve(ref)
                except Unresolvable as ex:
                    errors.append(f"{rel}: {ex}")
    for err in errors:
        print(f"ERROR: {err}")
    print(f"lingua check: {n_refs} refs, {len(errors)} errors")
    return 1 if errors else 0


def main(argv) -> int:
    if not argv or argv[0] not in ("resolve", "links", "tensions", "check"):
        print(__doc__)
        return 1
    cmd = argv[0]
    if cmd == "check":
        return check()
    if cmd == "tensions":
        print(json.dumps(all_tensions(), ensure_ascii=False, indent=1))
        return 0
    if len(argv) < 2:
        raise SystemExit(f"usage: lingua.py {cmd} <id>")
    if cmd == "resolve":
        try:
            print(json.dumps(resolve(argv[1]), ensure_ascii=False, indent=1))
            return 0
        except Unresolvable as ex:
            print(f"error: {ex}", file=sys.stderr)
            return 1
    if cmd == "links":
        try:
            for j in links(argv[1]):
                print(j)
            return 0
        except Unresolvable as ex:
            print(f"error: {ex}", file=sys.stderr)
            return 1
    return 1


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
