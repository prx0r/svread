#!/usr/bin/env python3
"""Translation strictness + formatting audit for svread work files.

Hard errors (exit 1): schema, gate values, l1 header/trailer mismatch,
SA charset leaks, BLOCKED boilerplate surviving in C1, C1 shape violations.
Flags (exit 0 unless --fail-on-flag): gloss coverage gaps, L0/SA
disagreements, cop-out glosses, L2 words with no L1 grounding.

Usage:
  python3 scripts/check_translations.py data/bhairavastava.json \
      --l0 data/l0/bhairavastava.json --c1-dir /root/ipvv/site/data/c1/bhairavastava
"""
import argparse
import json
import re
import sys
import unicodedata
from pathlib import Path

STOP = set("""the a an and of to in by with as is are was were be been being for from
on at that this these those it its he she they them his her their our you your my
mine me i we us not no never so than then thus when while where which who whom
whose what how all even though yet but or nor o oh very more most ever always still also such
than then them they their there these this those will shall can could would
should may might must do does did done have has had having am s t d ll m re ve""".split())

COPOUT = {"colophon", "colophon-end", "untranslated", "tbd", "todo", "?", "..."}

# domain glossary: transliterated terms and their standard English renderings.
# A grounded L2 may use either form.
SYN = {
 "bhakti": {"devotion", "devotee", "devotional", "devout"},
 "dhyana": {"meditation", "meditate"}, "japa": {"chant", "recitation", "recite"},
 "moksa": {"liberation", "release"}, "karuna": {"compassion", "compassionate"},
 "ananda": {"bliss", "joy", "joyful"}, "nirvrti": {"bliss"},
 "samsara": {"transmigration", "world", "worldly"},
 "jnana": {"knowledge", "wisdom", "wise"}, "atman": {"self"},
 "hrdaya": {"heart"}, "hrd": {"heart"}, "manas": {"mind"},
 "prabhu": {"lord"}, "natha": {"lord"}, "vibhu": {"lord", "pervading"},
 "stotra": {"hymn", "praise"}, "bhaya": {"fear"}, "bhiti": {"fear"},
 "sukha": {"joy", "happiness", "ease"}, "duhkha": {"suffering", "pain"},
 "kama": {"desire", "longing"}, "krodha": {"anger", "wrath"},
 "santi": {"peace", "tranquility"}, "mukti": {"liberation", "release"},
 "guru": {"teacher"}, "sishya": {"disciple"},
}

SA_ALLOWED = re.compile(r"^[A-Za-z\u0101\u012b\u016b\u1e5b\u1e37\u1e43\u1e41\u1e25\u1e45\u1e47\u1e63\u1e0d\u1e6d\u1e6c\u1e0c\u00f1\u015b\u1e47\u02bc\u2019'’!|.,;:\-—\s]+$")


def strip(s):
    return unicodedata.normalize("NFD", (s or "").lower()).encode("ascii", "ignore").decode()


def skel(s):
    return re.sub(r"[^a-z]", "", strip(s)).replace("a", "").replace("e", "").replace("i", "").replace("o", "").replace("u", "").replace("n", "N").replace("m", "N")


def match(a, b):
    if bool(a) and bool(b) and (a == b or a.startswith(b) or b.startswith(a) or (len(a) >= 3 and b in a) or (len(b) >= 3 and a in b)):
        return True
    # sandhi-tolerant: voicing/aspiration neutralised, trailing sibilant
    # stripped (vṛṣṭiḥ ~ vṛṣṭir, saṃvit ~ saṃvid). Strict exact-only, len>=4.
    na, nb = cls(a), cls(b)
    return len(na) >= 4 and na == nb


def cls(s):
    for dig, one in (("kh", "k"), ("gh", "g"), ("ch", "c"), ("jh", "j"),
                      ("th", "t"), ("dh", "d"), ("ph", "p"), ("bh", "b")):
        s = s.replace(dig, one)
    for grp in ("kg", "cj", "td", "pb"):
        for ch in grp[1:]:
            s = s.replace(ch, grp[0])
    return re.sub(r"[hrs]+$", "", s)


def words(s):
    return [w for w in re.findall(r"[A-Za-z\u0100-\u1e7f']+", s or "") if re.sub(r"[.!,;:'’‘|—-]", "", w)]


def stems(w):
    w = w.lower()
    out = {w}
    for suf in ("ies", "es", "s", "ed", "ing", "ly"):
        if w.endswith(suf) and len(w) > len(suf) + 2:
            st = w[: -len(suf)] if suf != "ies" else w[: -len(suf)] + "y"
            out.add(st)
            if len(st) >= 4 and st[-1] == st[-2]:
                out.add(st[:-1])  # dispelling -> dispell -> dispel
    return out


def load_work(path):
    d = json.loads(Path(path).read_text(encoding="utf-8"))
    if isinstance(d, list):
        chunks = d
    elif "chunks" in d:
        chunks = d["chunks"]
    elif "verses" in d:
        chunks = [{"chunk": v.get("id"), "verses": "", "gate": v.get("gate", "PASS"),
                   "sanskrit": v.get("sa", ""), "l1": v.get("l1", ""),
                   "l2": v.get("l2", ""), "c1": v.get("c1", "")} for v in d["verses"]]
    else:
        raise SystemExit(f"unrecognised shape in {path}")
    out = []
    for c in chunks:
        out.append({"id": c.get("chunk"), "gate": c.get("gate", "BLOCKED"),
                    "sa": c.get("sanskrit", "") or c.get("sa", ""),
                    "l1": c.get("l1", ""), "l2": c.get("l2", ""),
                    "c1": c.get("c1")})
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("workfile")
    ap.add_argument("--l0", default=None)
    ap.add_argument("--c1-dir", default=None, help="dir of per-chunk C1 .md + .NOTE.md files")
    ap.add_argument("--fail-on-flag", action="store_true")
    a = ap.parse_args()

    chunks = load_work(a.workfile)
    l0 = {}
    if a.l0 and Path(a.l0).exists():
        for v in json.loads(Path(a.l0).read_text(encoding="utf-8")).get("verses", []):
            l0[v["id"]] = v.get("tokens", [])

    errors, flags = [], []
    for n, c in enumerate(chunks, 1):
        tag = c["id"] or f"#{n}"
        # --- S1 schema / gate
        if not c["id"]:
            errors.append(f"{tag}: missing chunk id")
        if c["gate"] not in ("PASS", "BLOCKED", "WITHHELD"):
            errors.append(f"{tag}: bad gate {c['gate']!r}")
        if not c["sa"].strip():
            errors.append(f"{tag}: empty Sanskrit")
        # --- S4 SA charset
        if c["sa"] and not SA_ALLOWED.match(c["sa"]):
            bad = sorted(set(re.sub(r"[A-Za-z\u0100-\u1e7f'’!|.,;:\-—\s]", "", c["sa"])))
            errors.append(f"{tag}: SA charset leak {bad}")
        # --- S2/S3 l1 header + trailer (skipped when lane empty & not PASS)
        l1 = c["l1"] or ""
        has_l1 = bool(l1.strip())
        if not has_l1 and c["gate"] == "PASS":
            errors.append(f"{tag}: gate PASS but empty l1")
        if has_l1:
            hm = re.match(r"^##\s+(\S+)\s+\((\d+)\)", l1)
            if not hm:
                errors.append(f"{tag}: l1 missing '## <id> (<n>)' header")
            elif hm.group(1) != c["id"]:
                errors.append(f"{tag}: l1 header id {hm.group(1)} != {c['id']}")
            else:
                # number may be scoped to the song (s01-v02 -> 2 of s01) or global
                grp = re.sub(r"-v\d+$", "", c["id"])
                same = [x for x in chunks if re.sub(r"-v\d+$", "", x["id"]) == grp]
                pos = [x["id"] for x in same].index(c["id"]) + 1
                if int(hm.group(2)) not in (n, pos):
                    flags.append(f"{tag}: l1 header number ({hm.group(2)}) matches neither position {n} nor song-scope {pos}")
            tm = re.search(r"//\s*(\S+)\s*$", l1)
            if not tm:
                errors.append(f"{tag}: l1 missing '// <ref>' trailer")
            elif tm.group(1) != c["id"]:
                if re.match(r"^[a-z]+-[a-z]*\d+$", tm.group(1)):
                    flags.append(f"{tag}: l1 trailer //{tm.group(1)} points at a different chunk")
                # else: external source ref (e.g. //UtSst_8.12) — accepted silently
        # --- S5 segment/word ratio + S5b order check (need a populated l1)
        sa_w = [w for w in words(c["sa"]) if not re.fullmatch(r"[A-Z][A-Za-z0-9_]+", w)]
        body = re.sub(r"//\s*\S+\s*$", "", l1).strip()
        segs = [s for s in body.split("\n")[1:] for s in [s] if s.strip()]
        segs = [s for s in "/".join(segs).split("/") if s.strip()]
        if has_l1 and sa_w and (len(segs) < 0.5 * len(sa_w) or len(segs) > 1.6 * len(sa_w)):
            flags.append(f"{tag}: coarse l1 segmentation ({len(segs)} segs vs {len(sa_w)} SA words)")
        # --- S5b order check: long SA word glossed as bare function words.
        # Decompounds shift 1:1 alignment, so require a ±1 window with no
        # short SA word before flagging.
        if has_l1 and len(segs) == len(sa_w):
            for i, (w, s) in enumerate(zip(sa_w, segs)):
                content = [t for t in re.findall(r"[a-z]+", strip(s)) if t not in STOP]
                window = sa_w[max(0, i - 1):i + 2]
                if len(w) >= 7 and not content and all(len(x) >= 7 for x in window):
                    flags.append(f"{tag}: L1 seg for {w!r} is bare function words ({s.strip()!r}) — confirm stem rendered")
        # --- S6/S7 L0 coverage (SA -> gloss)
        toks = l0.get(c["id"], [])
        if l0 and not toks:
            flags.append(f"{tag}: no L0 gloss on file")
        elif toks:
            tsk = [(t.get("iast", ""), skel(t.get("iast", ""))) for t in toks]
            allk = " ".join(k for _, k in tsk)
            missing = [w for w in sa_w if not any(match(skel(w), k) for _, k in tsk) and skel(w) not in allk]
            cov = (len(sa_w) - len(missing)) / max(1, len(sa_w))
            if cov < 0.95:
                flags.append(f"{tag}: L0 covers {cov:.0%} of SA ({len(missing)}/{len(sa_w)} unmatched: {', '.join(missing[:6])})")
            # --- S8 cop-outs + dupes
            for t in toks:
                g = (t.get("gloss") or "").replace("\n", "")
                if g.lower() in COPOUT or not g.strip():
                    flags.append(f"{tag}: cop-out gloss for {t.get('iast')!r} -> {g!r}")
                if t.get("status", "PARSED") != "PARSED":
                    flags.append(f"{tag}: unparsed token {t.get('iast')!r} ({t.get('status')})")
            seen = {}
            for t in toks:
                g = (t.get("gloss") or "").lower()
                seen.setdefault(g, []).append(t.get("iast"))
            for g, ids in seen.items():
                if g and len(ids) > 2:
                    flags.append(f"{tag}: gloss {g!r} reused x{len(ids)} ({', '.join(ids[:4])})")
        # --- S10/S12 L2 grounding in L1 (need a populated l1)
        l1bag = set()
        if has_l1:
            for w in re.findall(r"[a-z]+", strip("/".join(segs))):
                l1bag.update(stems(w))
                l1bag.update(SYN.get(w, ()))
        l2 = c["l2"] or ""
        novel = sorted({w for s in re.split(r"[.?!]", l2) for w in re.findall(r"[a-z]+", strip(s))
                        if w not in STOP and not any(st in l1bag for st in stems(w))})
        if has_l1 and novel and c["gate"] == "PASS":
            flags.append(f"{tag}: L2 words with no L1 grounding: {', '.join(novel[:12])}")
        for s in re.split(r"[.?!]", l2):
            cw = [w for w in re.findall(r"[a-z]+", strip(s)) if w not in STOP]
            if has_l1 and len(cw) >= 4 and not any(any(st in l1bag for st in stems(w)) for w in cw):
                flags.append(f"{tag}: L2 sentence with zero L1 overlap: {s.strip()[:90]!r}")
        # --- S13 L3 Final lane (when present, PASS only)
        l3 = (c.get("l3") or "")
        if l3 and c["gate"] == "PASS":
            if l3.startswith("##") or re.search(r"//\s*\S+\s*$", l3):
                errors.append(f"{tag}: L3 carries header/trailer (translation only)")
            if "BLOCKED" in l3:
                errors.append(f"{tag}: L3 carries BLOCKED boilerplate")
            for doc, pat in [("metacommentary", r"[Tt]he (verse|hymn|passage|text|song) (says|describes|opens|closes|moves)"),
                             ("essay header", r"\*\*(SUMMARY|FUNCTION|KEY TERMS)"),
                             ("rasa note", r"\*Rasa:")]:
                if re.search(pat, l3):
                    flags.append(f"{tag}: L3 smells of {doc} — translation, not commentary")
            nl = len([x for x in l3.split("\n") if x.strip()])
            if nl != 2:
                flags.append(f"{tag}: L3 has {nl} lines (house convention: hemistich couplets)")
        # --- S11 C1 shape
        c1 = c["c1"]
        if c1 is None and a.c1_dir:
            p = Path(a.c1_dir) / f"{c['id']}.md"
            c1 = p.read_text(encoding="utf-8", errors="replace") if p.exists() else None
            if p.exists() and not (Path(a.c1_dir) / f"{c['id']}.NOTE.md").exists():
                flags.append(f"{tag}: C1 NOTE file missing alongside")
        if c1 and c["gate"] == "PASS":
            if not re.match(rf"^##\s+{re.escape(c['id'])}\s+—\s*C1", c1):
                errors.append(f"{tag}: C1 missing '## {c['id']} — C1' header")
            if "BLOCKED" in c1:
                errors.append(f"{tag}: C1 still carries BLOCKED boilerplate")
            if "**SUMMARY.**" not in c1:
                errors.append(f"{tag}: C1 missing SUMMARY")
            if not re.search(r"\*Rasa:", c1):
                errors.append(f"{tag}: C1 missing Rasa line")
            nw = len(c1.split())
            if not 40 <= nw <= 450:
                flags.append(f"{tag}: C1 length {nw} words (house range 40-450)")

    print(f"== {a.workfile}: {len(chunks)} chunks ==")
    for e in errors:
        print("ERROR", e)
    for f in flags:
        print("FLAG ", f)
    print(f"{len(errors)} errors, {len(flags)} flags")
    sys.exit(1 if errors or (a.fail_on_flag and flags) else 0)


if __name__ == "__main__":
    main()
