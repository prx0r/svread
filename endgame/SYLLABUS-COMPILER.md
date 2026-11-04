# SYLLABUS COMPILER — Trika-focused, aimed at Tantrāloka

Spec, 2026-11-05, on the owner's directive: *"satsang has the bones … it ended
up shitty and I want it trika focused aimed at tantraloka."* Answers "how do we
make it, is it possible inside Trika" with: **yes — and ~60% of one path already
exists.** Overviews imported: `satsang/{TEXT-TO-PRACTICE,PRACTICE-ENGINE,GRAMMAR}.md`.

---

## 1. Verdict: possible, because the bones + the corpus + the spines all exist

| Piece | Where | State |
|---|---|---|
| **text→practice machinery** (7-layer provenance pipeline: SourceText → Passages → ExtractedInstructions → Practice → Script → Timeline → Render; model fenced, every field span-traced, safety structural, `status: review` until human signs off) | **IMPORTED 2026-11-05 → `/root/satsang-practice/`** (prx0r/satsang @ ef85d86, sparse; `IMPORT.md` = provenance) | **shipped + verified here: 110 compile checks, 43 t2p checks, 0 schema errors. Already ships `vbt-spacious` (VBT v.63 + vv.43–48 routine)** |
| **the corpus** — Tantrāloka all 37 āhṇikas | translation-work `tantraloka-a01..a37`: `passages.jsonl` locators, ARGMAP (question/premises/unresolved per section), GATE.json, T1/L1/L2, source files | chunked + argmapped; gates vary per unit (display fail-closed) |
| **the practice vocabulary + body map** | deitybody: eight-phase path, `protocols/daily_practice.json`, month curriculum, matrika body map, selected VBT dhāraṇās | backend + tests on box |
| **the narration voice** | Tantrasāra slang editions (`awesome-essays/tantrasara1..22`, `shivasutrasfinal`) | landed, unused |
| **the player/clock/render** | satsang engine (`compile.mjs`, sit player, grammar.json) | shipped, sit-player wiring awaits owner |
| **the three spines** (below) | tantrasara canon + TĀ order + deitybody PATHWAY | all written |

**What was shitty was the target, not the machine.** The pipeline's worked
example is a generic Theravada breath manual; nothing in it is Trika, nothing
is our data, nothing maps to a body the way northstar demands. Fix = retarget
the same machine at our canon. The rules we keep verbatim: *model never writes
offsets/timings/numbers · every derived field traces to a span · never narrate
the conditional or promised (signs/powers become Ask answers, not scripted
promises) · safety caps are compiler-side.*

## 2. The three spines (what a Trika pathway is made of)

1. **Pedagogical spine — Tantrasāra's six questions** (canon `essay0.json`):
   own nature → why not seen → what binds → how to see (the four upāyas as
   graded *ways of seeing*) → **how to practice** (bath/offerings/mantra = inner
   absorption; daily + occasional rite — mapped to TĀ Ch 6, 12–14, 18, 20) →
   what remains after death. This is already a course outline, with rungs
   (reading-time budgets) for depth levels.
2. **Source spine — Tantrāloka's own 37-āhṇika order** — the traditional
   reading order; each āhṇika = a unit block with ARGMAP questions.
3. **Body spine — deitybody's eight-phase path** (`PATHWAY.md`): ordinary body →
   mapped body → mantra-body → deity-body → cosmos-body, month curriculum,
   matrika install cadence.

A pathway = a path through all three: question (why/what) → āhṇika (where the
text answers) → practice (what to do with the body).

## 3. How the compiler works (4 steps, reusing existing layers)

```
1. UNITIZE   TĀ passages.jsonl + ARGMAP sections → units
             {unit: tantraloka-a06:tsa06-p03, question, verses, unresolved[]}
2. TYPE      practice-term detection (nyāsa · dhyāna · prāṇāyāma · mantra ·
             homa · pūjā · abhiṣeka · dhāraṇā · dīkṣā …) → theory | practice | insight
             practice units feed the EXISTING ExtractedInstructions layer
             (spans quoted from the āhṇika source, model fenced as ever)
3. GATE      the Trika honesty layer — every unit classified:
             text-study · doable (no prerequisites) · requires-dīkṣā/teacher
             TĀ is a ritual manual: initiation-gated units render as STUDY
             with the text's own conditions quoted, never as DIY checklists.
             Blocked-gate prose displays as status (fail-closed, unchanged law).
4. ASSEMBLE  prereq DAG (āhṇika order + deitybody phase flags + dīkṣā flags)
             → emit: satsang Series (course) + deitybody practice proposals
             + engine practice JSON (schema v2.1) + path view with IDs
```

**IDs (extend lingua grammar):**
`path:trika/tantraloka-guide` · `unit:tantraloka-a06:tsa06-p03` ·
`practice:<id>` — each linking to teachers (satsang), essays (scholar),
packs/videos (factory), tensions (nibbanahelp journey). The path is a
subgraph of Treeka, not a new store.

## 4. What replaces the Ajahn Lee content (keep/replace table)

| Keep (machinery, laws) | Replace (content target) |
|---|---|
| 7-layer pipeline + schemas + provenance + inference rules | SourceText: Ajaan Lee → **TĀ / TS / VBT / Mālinī sources** (our hashes, our licences) |
| grammar.json structure + compile/cues/mix/preview | Practice loci: generic breath places → **matrika/mālinī body map** (deitybody) |
| Sit player, stages, beginner-override, safety caps | Curriculum: single method → **six-question path + 37 āhṇika order + eight-phase body layer** |
| `status: review` until human sign-off (maps to deitybody verify) | Narration: generic plain → **slang register** (our Tantrasāra editions), each line span-cited |
| PRACTICE-ASK (Ask answers instead of promised outcomes) | Catalogue practices (Ajahn Lee tier) → **our Trika tier**, labelled; catalogue stays as "others" |

## 5. The endgame loop it closes (owner's asks, mapped)

- **Pathways linked to nibbanahelp**: journey Day N (posting-days only) gates
  progression view; open tensions → For-You already picks content; path nodes
  carry `tension:*` refs so "what's on your path" and "what you're carrying"
  are one graph.
- **IDs to teachers, essays, vids**: every unit links out (satsang teachers,
  scholar essays, packs) — the same resolver walks it.
- **Good chat session → essay/vid**: a session with an accepted relay/crux →
  tension candidate → essay loop (live) → pack → tantrasara/short factory →
  satsang Watch (`JOURNAL-TO-VIDEO.md` already specced this from their side).
- **"Ask for a vid about xyz"**: request node (chat or workspace) → queue →
  agent drafts from source with evidence → audit → owner/scholar sign →
  factory. One queue, existing gates.

## 6. Build phases (folds into ENDGAME-BUILD-PLAN Phase 4.3)

- **C1 pilot — VBT, decided (owner 2026-11-05: "vbt is perfect for this").**
  Inputs all on disk: `satsang-practice/pilot-inputs/vbt-daily.json` (65 of 112
  dhāraṇās mapped: technique · trains · āhṇika coord · **upāya class**),
  `pilot-inputs/syllabus.json` (matrka-course-v1 skeleton), deitybody VBT
  selections + matrika body map, engine's own `vbt-spacious` as the reference
  implementation, slang editions as narration register. Path: ingest the 65-unit
  table → unitize/type/gate (no dīkṣā issues in VBT — it's the one canonical
  practice text built for this) → one dhāraṇā through the imported pipeline →
  sit-player preview.
  *Done when:* engine preview plays a VBT dhāraṇā from our table with
  span-cited quotes (Sanskrit verse ↔ technique ↔ upāya).
- **C2 unitize + type + gate all 37 āhṇikas** → `syllabus/tantraloka.json`
  (units, questions, eligibility classes). *Done when:* every unit is
  classified; dīkṣā-gated units are study-only, verified by a spot-check.
- **C3 path assembly + IDs** → `path:trika/*` + satsang Series outline +
  deitybody practice proposals (`status: review`). *Done when:* a path view
  resolves a unit to teacher + essay + practice + tension.
- **C4 loop closure** — day-gate progression + request→vid queue + For-You
  receives path nodes (owner decisions: sit player wiring, practice sign-offs).

**Owner gates:** every practice proposal before publish (existing review
status does this — never bypass); sit-player wiring (already awaits owner);
choice of pilot unit (C1).
