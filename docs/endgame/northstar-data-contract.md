<!-- vendored: source=/root/NORTHSTAR.md sha256=36e213558deb37c759c3e10c3b759159e2f0b5d66c76287ba87f531337080d2e fetched=2026-11-11
     edit the source, not this copy; regenerate with tools/emit_endgame_docs.py -->

# NORTHSTAR — the svread data contract (endgame)

*2026-11-02. The single source of truth for what each layer carries and how it renders.
Every rule below is machine-checkable: a `check.py` run with 0 failures is the only
claim of canonical. New data must validate against these schemas before it ships.*

## 0. The spine

```
SOURCE (sha-pinned, verse count verified against edition)
  → T1  fast translation, lore-primed: verse draft + pada-split glosses over the whole text.
        Coverage before sharpness. History[] on every change.
  → L0  scholarly audit, term-by-term: morphology + ranked OPTIONS with grounds + sources.
        Forks live here only (none|live|resolved). AMBIGUOUS is parse quality, not fork.
  → ARGMAP  whole-verse argument as terse logical statements; fork adjudication with reasons.
            traces: t1_verse, l0_ids, sanskrit_sha.
  → L2  plain exact English; every clause traces to L0 ids; cite byte-exact.
        Rasa in word choice, never decoration.
  → L3  FINAL canonical translation. One translation to look at. Line-by-line, evocative,
        rasa in diction. Every line traces to L0 + C1 essence. No new doctrine.
        Boundary items stay open with notes, never smoothed.
  → C1  essence (3–6 lines) + rasa block + standard 7-part essay (SUMMARY … RELATED).
        Names what the verse DOES, never the document. No quotes. No metacommentary.
  → C2  prompt-reproducible renders (eli5, genz, poetic, formal, mathematical, …).
        Each: style + reproducing prompt + model/date + paragraphs mapped to essence
        via maps_to. A new reading is just a prompt.
  → PROOF  B1–B8, all machine-checkable, per-song JSON (PASS/BLOCKED + needs + lineage).
  → SITE  chunks (PASS only carries English), L0, morph, proof, variants, argmaps, C1
          NOTEs, pushing INDEX, corpus.jsonl, vectors.json — all built, never hand-written.
```

## 1. Layer data types

Every file is JSON. Every record is an object with a content-derived id. No Markdown
is canonical — Markdown is a rendered view (render_md.py proves agreement).

### T1 — fast translation (ipvv `data/<song>.t1.json`)

```
[ { "verse_id": "bh-p01", "song": "bh-p01", "verse": 1,
    "quick_english": "pervading-… / … / I-venerate",
    "quick_english_source": "manual" | "machine",
    "source_lines": [7, 9],
    "source_file": "passages.jsonl",
    "tokens": [ { "surface": "vyāptacarācarabhāvaviśeṣaṃ",
                  "quick_gloss": "pervading-the-particular-states-of-moving-and-unmoving" } ] } ]
```

Invariants: T1 spans exactly the source verse set; every token is a source token;
coverage is judged against SOURCE text, not tool report.

### L0 — literal gloss (svread `data/l0/<work>.json`)

```
{ "work": "bhairavastava",
  "verses": [ { "id": "bh-p01",
                "tokens": [ { "iast": "bhairavanātham",
                              "gloss": "Bhairava-Lord",
                              "raw": "[and]-Bhairava-Lord (bhairavanātham)",
                              "status": "PARSED" | "AMBIGUOUS" | "FAILED" } ] } ] }
```

Crystal L0 (`translation-work/data/*.l0.json`) is richer (options[], grounds, source,
fork, morph, morph_unknown, history[]) and is the authoritative audit record; the svread
copy is a mechanical projection (chosen gloss only) via `scripts/import_crystal_l0.py`.

Invariants: L0.chosen == T1.quick_gloss unless revised+reason; fork:live|resolved ⟺ ≥2
options; forked tokens require analyzed morph (no unknowns).

### ARGMAP — the sharp translation's reasoning

```
[ { "verse_id": "bh-p01", "song": "bh-p01", "verse": 1,
    "scope": "verse" | "passage",
    "structured": true,
    "speaker": "Abhinavagupta (devotee's voice)",
    "question": "What is the object of veneration, and how does veneration relate to it?",
    "premises": [ "…" ],
    "inference": "…",
    "uncertainties": [ "…" ],
    "option_choices": [ { "l0_id": "bh-p01-p000", "chosen_index": 0,
                          "rejected": [1], "reason": "…" } ],
    "traces": { "t1_verse": "bh-p01", "l0_ids": ["bh-p01-p000", …],
                "sanskrit_sha": "<sha>" } } ]
```

Invariants: traces resolve (t1_verse exists, every l0_id exists, sanskrit_sha matches
source); L2 lists ≥1 existing l0_id per verse.

### L2 — plain exact English

```
[ { "verse_id": "bh-p01", "song": "bh-p01", "verse": 1,
    "plain_english": "Pervading the particular states of moving and unmoving — …",
    "sanskrit_cite": "vyāptacarācarabhāvaviśeṣaṃ cinmayam …",
    "l0_ids": ["bh-p01-p000", …],
    "supplied": ["they (plural subject)"], "fidelity": "preserved" | "supplied" | "not-resolved" } ]
```

Invariants: every L2 lists ≥1 existing l0_id; cite byte-exact against source. Rasa in
word choice, never decoration.

### L3 — FINAL canonical translation (the one translation to look at)

```
[ { "verse_id": "bh-p01", "song": "bh-p01", "verse": 1,
    "lines": [ "Pervading every state of moving and unmoving, consciousness itself is one — without end or beginning.",
               "Bhairava, Lord, refuge of the helpless — with a mind become Yours, in my heart, I bow." ],
    "sanskrit_cite": "vyāptacarācarabhāvaviśeṣaṃ …",
    "l0_ids": ["bh-p01-p000", …],
    "essence_maps": [0, 1],
    "fidelity": "preserved" | "supplied" | "not-resolved",
    "supplied": [ "they (plural subject of dispel)" ],
    "notes": [ "svātmamaya kept constitutive ('made of You'), not identity — see NOTE boundary" ],
    "needs": ["human-review"] } ]
```

Invariants (schemas/l3.py): lines non-empty strings; every l0_id exists; every
essence_maps index in range (0..n-1); sanskrit_cite non-empty; no header/trailer,
no BLOCKED, no metacommentary, no rasa labels in prose. House convention: hemistich
couplets (2 lines). Machine-proposed until human signs off.

### C1 — essence + standard render (ipvv `data/<song>.c1.json`)

```
{ "song": "bh-p01",
  "essence": [ "Bhairava is established as all-pervading conscious reality: one, endless, beginningless …" ],
  "essence_source": "human-sharp",
  "renders": { "standard": { "sections": { "SUMMARY": "…", "FUNCTION": "…",
    "KEY TERMS": "…", "LOCAL CONTEXT": "…", "EXPLANATION": "…",
    "BOUNDARY": "…", "RELATED": "…" } } },
  "rasa": { "dominant": "śānta (tranquility) with adbhuta (wonder)",
            "sthāyibhāva": "…", "vyabhicāri": "…",
            "justification": "…" } }
```

Invariants: essence non-empty; standard render preserved with all 7 sections;
rasa optional, when present all three fields non-empty. C1 names what the verse
DOES (relish/camatkāra), never the document. No quotes. No metacommentary.

### C2 — prompt-reproducible renders (`data/<song>.c2.json`)

```
{ "song": "bh-p01",
  "renders": [ { "style": "eli5" | "genz" | "poetic" | "formal" | "mathematical" | …,
                 "prompt": "…reproducing prompt…",
                 "model": "qwen3.8-omni-flash", "date": "…",
                 "paragraphs": [ { "text": "…", "maps_to": [0, 1] } ] } ] }
```

Invariants: prompt non-empty; every paragraph maps_to at least one essence index;
maps_to in range. A new reading is just a prompt. Withheld from site until essence
is human-reviewed.

## 2. Site layer (svread `data/<work>.json`, ipvv `site/dist/data/layers/<work>.json`)

Bilara-style cognates: one JSON per work, keyed by chunk id. Every chunk carries
`sanskrit`, `l1`, `l2`, `l3`, `c1`, `argmap`, `gate`, `blocking`, `needs`, `model`,
`date`, `immutable_id`, `links`. The reader fetches once and works offline.
`l1`/`l2` carry `## <chunk> (<n>) … // <ref>` headers/trailers (stripped at render).
`c1`/`argmap` carry `## <chunk> — C1` / `## <chunk> — argument map` headers.

Gate rule (fail-closed): PASS chunks carry English; BLOCKED chunks have empty l1/l2
and Sanskrit only. Never silently embed BLOCKED English.

## 3. Site data types (svread)

### L0 (svread `data/l0/<work>.json`)

Projection of crystal L0 (chosen gloss only). `{work, verses:[{id, tokens:[{iast, gloss,
raw, status}]}]}`. Drives the Literal lane and the chat word-gloss answers.

### Morph (`data/morph/<work>.json`)

Neural/Vidyut stem analysis. `{work, verses:[{id, tags:{word:{src, lemma?, pos?}}}]}`.
Supplements the word panel; L0 gloss is the authority.

### Proof (`data/proof/<work>.json`)

`{work, verses:{id:{gate, blocking, checks, source_sha, result_id, model, date}}}`.
Drives the left-rail Proof Queue and trust answers in chat.

### Probes (`data/probes/<work>.json`)

`{work, source, probes:[{id, question, verses:[n], verdict, session, chain}]}`.
The pushing hounds, playable from the left rail.

### Openers (`data/openers.json`)

`{work: "I wonder …"}` — per-work wonder-question, the AI's first message.

### Library (`data/library.json`)

`[{id, name, works:[{id, title, lv}]}]` with `lv` ∈ {null, 'sa', 'full'}. Drives
the left-rail library tree. Only `lv !== null` works are linkable.

## 4. Recitation data

Studio chant (kashaudio): `audio/<wid>/<clip>.mp3` (96k) + `karaoke/<wid>.json`
`{id, dur, syls, words:[{w, r, t_on, t_off, syls:[{d,t0,t1}]}`. Compiled alignment
(`align/<wid>.json`) carries absolute per-syllable times and clip boundaries.
R2 public at `https://pub-87169194562a44fcb8279a799d626c62.r2.dev`.

The reader renders Devanagari client-side from IAST (`IAST_DEVA.convert`, deterministic).
IAST is the canonical Sanskrit storage; Devanagari is rendered, never stored.

## 5. C2 storage on git (the endgame)

C2 renders live in `translation-work/data/<song>.c2.json` (schema: `schemas/c2.py`).
Each render is `{style, prompt, model, date, paragraphs:[{text, maps_to}]}`.
Styles are open-ended (eli5, genz, poetic, formal, mathematical, …); a new reading is
just a prompt. Many renders per song, all in one file, content-addressed by
`{song, style, prompt-hash}`. The Poetic lane on svread is parked until verse-level
renders exist and pass review.

## 6. Citing

`work · chunk · source file lines` — e.g. *bhairavastava bh-p07 · bhairavastava-u.txt:88*.
Line numbers come from `links.source_lines`. Never cite a pada index alone.

## 7. Trust

Every layer is `MACHINE_PROPOSED` until a human signs off (`data/<song>.signoff.json`).
Unsigned = machine-proposed, everywhere, no exceptions. Proof gates (B1–B8) are
deterministic and re-runnable; the site displays proof gate + needs, never a verdict.

## 8. Verification

- `cd translation-work && python3 check.py` → CANONICAL, 0 failures.
- `cd translation-work && python3 tools/validate_song.py --song <s> --work <w>` → 0 errors.
- `cd svread && python3 scripts/check_translations.py data/<w>.json --l0 data/l0/<w>.json --c1-dir /root/ipvv/site/data/c1/<w>` → 0 errors.
- `cd ipvv && python3 site/build.py layers && python3 tools/validate_site.py --work <w>` → 0 errors.
- Live check: `curl … | python3 -c "import json,sys; …"` on content, never on HTTP code (SPA fallback).

## 9. What is NOT in scope (deliberate)

- No JSDOM/browser harness yet (biggest testing gap — known, accepted).
- No embeddings cron (manual run of `build_embeddings.py`); vectors must be rebuilt
  on new content, re-embedded by hand.
- No cryptographic signatures on receipts (empty `signature` field; grants need key
  management above the kernel).
- No per-clause L2→L0 derivation (T2) — verse-level traces only.
- No Git LFS for binaries — R2 is the byte store; git holds specs, process, data.
- Ghatakarpara / Spandasandoha / Anuttarastika p02–p04 need crystal-pipeline work
  before L3; their site lanes are honestly gapped.
