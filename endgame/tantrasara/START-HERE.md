# START-HERE — the whole factory on one page (2026-11-04)

One index. Every essential doc, its status, and the exact process that
made ch01. Read top to bottom; nothing else needed before acting.
No renders touched to write this.

## 0. Read order (AGENTS.md law, no skipping)

1. `RUNTIME.md` — your verbatim gospel. The routine.
2. `PIPELINE.md` — the operating manual with readings map.
3. `GATES.md` — binary law, every line pass/fail.
4. `PROCESS.md` — the canonical chain. Then `BUILD-NOTES.md` (the log,
   wins on conflict except PROCESS open deltas), then `HANDOVER.md`
   (current state), `VISION.md` (taste), `MISTAKES.md` M1–M27 (the traps),
   `VISUAL.md` (screen law), `LAYERS.md` (every layer's source + gate).
5. `BLOCKS.md`, `INTRO_BLOCKS.md`, `CHAPTER-FORMAT.md`, `CHAPTER_PREP.md`,
   `PROVISIONAL_CASTING_14-22.md` — working notes, folded into PROCESS.
6. Skills: `tantrasara-storyboard` (casting), `tantrasara-holds` (cards).

## 1. Law (change only by owner call, same commit as code)

| doc | status |
|---|---|
| STANDARD.md | law, all 17 sections |
| GATES.md | binary gate list; H1 + header alignment open per your 11-04 calls |
| VISUAL.md | screen canon |
| GOLD-STANDARD.md | ch01 v3 reference, 439s 898 cuts |
| RUNTIME.md | gospel, frozen verbatim |
| PROCESS.md | canonical chain; open deltas listed at bottom |
| CHAPTER-FORMAT.md | freeze checklist + stop rule |
| FISH-DIRECTION.md | S2-only free-tier voicing law |
| SPEAKER-RULES.md | SUPERSEDED for casting (seats live in STANDARD §2); ritual shape kept |

## 2. Log (append-only, newest wins on state)

| doc | status |
|---|---|
| BUILD-NOTES.md | the log, current through bulk confirm + block rendering |
| PROCESS_NOTES.md | chain + wrong-vs-right + ch01 full-run failure log |
| MISTAKES.md | M1–M27, incl. my M24–M27 this session |
| HANDOVER.md | state; ch01 v3 + ch02 verified, batch running |
| REGISTRY.json | live board (stages, locks, queue, processes) |
| EVENTS.jsonl | every stage logs one line automatically |
| RENDER-PLAN.md | fleet + critical path + owner gates |
| READINESS.md | rundown; “not yet” predates bulk confirm, refreshed by this index |

## 3. Reference (frozen history, read never edit)

`archive/era-0/` (intake + superseded method), `reviews/` (empty
first-listener history), `DONE.md` (old rung law), `TIMINGS.md`
(ladder), `VISION.md` (intent template), `CHAPTER_PREP.md` (22-row
rundown: blocks, verse counts, b2 lines, cue plans),
`PROVISIONAL_CASTING_14-22.md` (476 unsure calls), `NEW-LANE.md`
(shiva pattern), `process/` (port notes for analayo machinery),
`sources/` (study-only audio), `tools/` (text-side beat/span tools),
`sections/` (empty). `shiva/` lane docs:
SHIVA-INTAKE, SHIVA-HANDOVER, CANONICAL-FLOW, LANE-PARITY.

## 4. Lanes (shared builders, single copy)

tantrasara: 22 chapters, `storyboard_chNN.json` (ch06 file is
`storyboard_ch6.json`), `overrides_chNN.json`, `glossary_chNN.json`,
`approved_chNN.json`, `review/chNN/`, `assets/thumbnail/` (only
ch01.png real — rest fall back to ch01 art, flagged wrong).
Repo builders: `build_storyboard`, `render_chapter`,
`assemble_chapter`, `holds_timeline`, `render_holds`, `build_clip`,
`verify_clip`, `publish_review`, `golden`, `gate_visual`,
(no-chunk full-chapter path) plus `run_blocks` (group-aligned
chunk parts + concat), `prove_clip` (proof pack per part),
`gate_storyboard` (pre-render gate: green, intro thumbnail, H8
60s rule, drops+M6, Deva discipline). Current law: thumbnail
holds the intro only; no visual static past 60s (H8); drops
gated H7. See PROCESS-NOTES2.md for the session record and
IMPACT-FLOW.md for the per-visual drop+pause pass (proposals only).
shiva: 78 units under `shiva/` (own storyboards, glossaries,
casting, review packs, series art). Lane routing: `holds.lane_for`.

## 5. The process that made ch01 (verbatim from the notes)

RUNTIME: blocks → Fish edits + timings → storyboard PNG proofs
(timings, speakers, karaoke) → perfect mp4 → Qwen final vs beats +
transcript. CHAPTER-FORMAT then mechanically: publish pack →
approval pinning SHAs (render refuses without) → render →
align ≥0.85 → assemble == sum of parts → holds sheets, your eye →
video → coverage printed → verify → Whisper head-check → Qwen
taste-only → golden-check → upload `copyto` + HEAD → your ears →
seal golden → commit one concern + push. Stop rule: anything
unplanned halts the line, log it, re-freeze from step one.
ch01 proof (`PROCESS_NOTES.md` 2026-11-02): 111 blocks, 7m19s,
9/9 groups, MMS 0.92–0.96, frames read at opener/verse/term/
narration, Whisper clean; lessons: `copyto` exact keys, retry or
copy down on mount flakes, sa-IN raw Devanagari, IAST-only verse
subtitles, clip ranges group-aligned. v3 (`GOLD-STANDARD.md`):
Deva-only verse, 3-layer terms (no literals on screen), lone
chants persist one block, count lists, white default, 2.8s crisp,
drops only on your call, bell +6dB, karaoke onsets gaps-to-prior.
Qwen pass-4: dash fixed, ṛ misread discarded, karaoke-ahead
uncorroborated.

## 6. Stale (do not use, do not link)

R2 root: `ch01_full`, `_v2` (hand-over link, superseded by v3),
`ch1_opening…v4`, `first_min*`, `cards/*` prototypes,
`ch02_firstmin/intro_frames`, `gateframes_round1`, my
`ch01_exemplary` (mislabeled, not v3-identical) and `ch03_p0*`
(parts, not chapters). Local: `assets/thumb_ch1.png` fallback,
`.draft` glossaries, parked `verse_gloss_*`, `glossary_ch*.draft`,
`finals/ch01_full.mp4` (pre-crisp) and `finals/ch02_full.mp4`
(pre-flip), `review/*/manifest approved:false` (pack view, blessing
lives in `approved_chNN.json`). Legacy scripts (read-only):
`build_pilot`, `build_firstmin*`, `build_board`, `make_card`,
`audit_tts`. My `/tmp` shadow drivers: unmerged, not canonical.

## 7. Open, awaiting you (nothing moves without your word)

1. Re-bless 21 storyboards (b2 chant SHAs; table verified this
   session — ch01 MATCH, rest RE-BLESS) + packs republished ✓.
2. Deva citations ch14–22 (V5 RED; M15/M23).
3. Impact-flow disposal (`IMPACT-FLOW.md` proposals + 14
   NO-GROUPFINAL calls).
4. Golden errata (`review/ch01/notes_round2.md`): paurusa gloss +
   anyam timestamp.
5. Per-chapter art for ch02–22 (fallback is wrong art).
6. Ears on ch01 (seals golden), ch14–22 casting, L3/L4 signoff.
7. Then: file drops → render missing audio → chunk video →
   prove → verify → seal → ship (full sequence in BUILD-NOTES
   "What's next").
