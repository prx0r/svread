# Satsang Practice Engine: data structures v0.1 (2026-10-20)

> **Status (2026-10-25):** **partial**. Shipped: practice records, practice pages + timer, "Practise with the body" breathplayer overlay. Not started: Sivananda book miner.

Goal: granular practice discovery (e.g. "all kundalini practices"), a Practice tab, a Theory tab, structured pathways, books mined into routines, an executable script for real-time breath animation + narration (+ wearables later), and progress on the profile. Everything agent-native.

## 1. Object layers (smallest → largest)
| Layer | What | Example | schema.org |
|---|---|---|---|
| Concept | Theory: an idea, a body map term, with per-tradition definitions | prana, kundalini, sushumna, ajna, granthi, bandha | DefinedTerm in a DefinedTermSet |
| Element | An atomic, reusable action | "inhale left nostril 4 counts", "jalandhara bandha", "japa of Om x108" | HowToDirection |
| Practice | A named technique = ordered Elements + params | Nadi Shodhana (Sivananda 1:4:2) | HowTo |
| Routine | A timed session of Practices | "Sivananda 30-min morning kundalini sadhana" | HowTo (steps = practices) |
| Pathway | A multi-week curriculum with stages and gates | "Kundalini foundations, 12 weeks" | Course + CourseInstance |
| Session | One user's run of a Routine/Practice | log row | (private) |

Practices are variants-aware: `variant_of` links Sivananda vs Satyananda vs 3HO versions of the "same" kriya, so we can compare across schools.

## 2. Faceted tagging (controlled vocabularies, multi-select)
Each facet is its own vocab file (`vocab/<facet>.json`, with ids, labels, aliases, per-tradition notes), so the UI filters and agents query the same way.
- **tradition / school / lineage**: hatha (Sivananda, Bihar/Satyananda, Krishnamacharya), kundalini (3HO/Yogi Bhajan, Shakta-tantric, Kashmir Shaiva), Theravada, Tibetan, Advaita, Christian contemplative...
- **method**: pranayama, kriya, mudra, bandha, asana, mantra-japa, nada, trataka, dharana-visualisation, nyasa, enquiry, yoga-nidra, puja-ritual, devotional-kirtan, walking, body-scan, metta, koan, contemplative-prayer
- **body locus** (target): chakras, nadis, granthis, marmas, plus Tibetan channels and Taoist dantian, each a Concept; a crosswalk table maps between systems with confidence (never asserting they're "the same")
- **aim**: calm, energise, focus, insight, devotion, purification, sleep, grief, anxiety, embodiment, awakening-energy (linked to the 20 intention chips)
- **breath physiology** (computed from the script): rate (bpm), ratio (in:hold:out:hold), nostril, retention max (s), arousal direction (up/down), CO2-tolerance load
- **practical**: duration band, posture, eyes, time of day, equipment, solo/group, language
- **level & access**: first-steps / steady / deep; prerequisites (practice ids + days); `needs_teacher`, `initiation_required` (shown as orientation-only, never scripted in full)
- **safety**: contraindications (pregnancy, hypertension, epilepsy, psychosis/trauma history, glaucoma...), `intensity` 1–5, `stop_if` signs
- **provenance**: source text + location (book, chapter, page/verse), teacher, clip timestamps, `source_url`, `verified_on`, `confidence`, `evidence` (traditional / clinical studies with DOIs)

"All kundalini practices" = `method∈{kriya,pranayama,bandha,mudra,mantra}` AND `aim∋awakening-energy` OR tradition∈kundalini-*; saved as a named **Lens** (a stored query) so it's a shareable URL and an MCP call.

## 3. The executable script (drives animation, narration, wearables)
A Practice/Routine compiles to a **Script**: parallel time-aligned tracks, deterministic and renderer-agnostic.
```json
{ "script_version": 1, "practice": "nadi-shodhana-sivananda", "loops": 10,
  "params": { "count_s": 1.0, "ratio": [4,16,8,0] },
  "tracks": {
    "breath": [ {"phase":"in","nostril":"L","counts":4}, {"phase":"hold_in","counts":16,"bandha":["jalandhara"]},
                {"phase":"out","nostril":"R","counts":8}, {"phase":"in","nostril":"R","counts":4},
                {"phase":"hold_in","counts":16}, {"phase":"out","nostril":"L","counts":8} ],
    "voice":  [ {"at":"phase:in","text":"Close the right nostril. Breathe in through the left.","once":true} ],
    "visual": [ {"at":"phase:*","locus":"ida|pingala","glyph":"flow","colour":"breath","motion":"follow-breath"} ],
    "audio":  [ {"at":"loop:end","sound":"bell-soft"} ],
    "haptic": [ {"at":"phase:*","pattern":"swell"} ] },
  "progression": [ {"after_sessions":7,"if":"completion>=0.9","set":{"loops":"+2"}} ],
  "adapt": [ {"signal":"hr","if":">baseline+15","do":"ratio:drop_holds"} ],
  "safety": { "max_hold_s": 30, "beginner_override": {"ratio":[4,0,8,0]} } }
```
- Breath phases are the animation clock: the fluid renderer interpolates volume curves per phase (ease-in-out), so the same script drives a body map, a fluid orb or a TV view.
- Voice lines are our own words, timed to phase events; TTS in real time (Fish Audio key exists) or cached.
- `adapt` and `haptic` are inert until wearables exist; the schema holds the slot now (signals: hr, hrv_rmssd, breath_rate, eda, movement).
- `safety` is enforced by the player, not the content (hard caps by user level and flags).

## 4. Theory tab
Concepts form a graph: `is_a`, `part_of`, `located_at` (body locus), `practised_by` (practice ids), `defined_in` (text + verse), `compare` (tradition takes, like topic-takes.json). Each Concept page: a short definition, a per-tradition definition table, practices that use it, talks at timestamps, texts. That gives Practice ↔ Theory two-way links (e.g. jalandhara bandha → granthi → Kashmir Shaiva / Bihar / 3HO views).

## 5. Mining a book into routines (the formula)
1. **Source gate**: rights check (e.g. Divine Life Society freely distributes many Sivananda books; record the licence). Store page refs plus our own wording only; quotes ≤ 25 words.
2. **Segment**: chapters → instruction blocks (imperatives, counts, ratios, "repeat", "practise for N days").
3. **Extract** (LLM with a JSON schema): candidate Elements/Practices/Routines with `span` citations (book, page, para), raw numbers kept verbatim.
4. **Normalise**: map to vocabularies (method, locus, aim), units (counts→seconds via params), and existing practices (dedupe via `variant_of`).
5. **Compile** to a Script; run the safety linter (holds > caps, contraindication words in the source → tags).
6. **Review queue** (keeper findings): confidence < 0.8, any retention, any needs_teacher → human/agent review before it's public.
7. **Publish**: the practice page + JSON + markdown + HowTo JSON-LD + MCP.
Output per book: `sources/books/<slug>/{extract.jsonl, practices.json, routines.json, concepts.json, REPORT.md}`.

## 6. Pathways
`Pathway { id, title, tradition, aim[], weeks, stages: [{ id, title, weeks, routines: [{routine, days_per_week}], theory: [concept ids], talks: [clip refs], gate: {min_sessions, min_days, completion>=, self_check: [questions]} }], teacher_led_stage?: place/teacher refs }`. A gate unlocks the next stage; a pathway can hand off to a real place (e.g. "next: the Rishikesh course").

## 7. Profile progress (private by default, exportable)
- `Session { id, user, routine|practice, started_at, duration_s, completion, loops_done, ratio_achieved, pre:{calm,energy,focus 1-5}, post:{...}, note (local only), sensor_summary? }`
- `PracticeState { user, practice, sessions, streak_days, last_at, current_params (from progression), level }`
- `PathwayState { user, pathway, stage, gates_met, started_at }`
- Derived: streaks, minutes per method/aim, "what's working" (pre→post deltas by practice), feeding For You (practices and talks) and the intention matcher.

### 7.1 Planned session log + daily snapshot (from satsang-extensions 42, archived 2026-10-21; NOT built: needs accounts + D1)
- **Session row = the journal's `practice_session` kind.** One row per sit in `practice_log` (PROFILE.md 0016): `{id, who (u:<id>|d:<device>),
  practice (built practice id, e.g. vbt-mind-between-objects), at, minutes, completion?, pre/post {calm,energy,focus 1-5}?, quality? (1-5, the
  user's own word), note? (private), source: timer|player|manual, collection? + unit? (journey/series step it advanced)}`. Other journal kinds map
  elsewhere (insight/journal_entry -> private essay, book_note -> works log, ritual_note -> a practice_log note, question -> teacher-prompt card);
  dream/symbol entries are record-only (no AI interpretation, ever). Private by default, in `/me/export`, removed by `DELETE /me`.
- **Daily snapshot** (`GET /me/snapshot`, computed on read from live rows, cached 1 h, never prebuilt files): `{type:'daily-snapshot', date, who,
  taste_chips[] (words, never numbers), exploring[], due[] {ref, kind: practice|routine|journey|retreat, why<=200}, journeys[] {collection, unit, title},
  streak {week_dots, month_sits, total_hours} (plain counts, no pressure copy), suggested_next {talk?, practice?, topic?, reason<=200}}`. Agents
  (the 41 agent shelf) read this, never raw tables. Draft schema: `specs/extensions/42-user-profile/schemas/daily-snapshot.json`.
- Until accounts exist the device keeps the same shape locally (collections.js already logs journey progress on the device).

## 8. Agent-native (everything)
Every Concept/Practice/Routine/Pathway/Lens has `/x/<id>` HTML, `.json`, `.md`, JSON-LD and a script at `/x/<id>/script.json`. MCP tools: `find_practices(facets…)`, `get_practice`, `get_script`, `get_routine`, `get_pathway`, `get_concept`, `compare_concept(traditions)`, `build_routine(aim, minutes, level, constraints)` (deterministic composer over tagged practices), `list_lenses`. Vocabularies are published at `/vocab/*.json` so agents filter with the same ids. Sessions are NOT exposed (private) except to the user's own token later.

## 9. Build order
1. Vocab files + practice v2 / element / routine / pathway / concept / script / session JSON Schemas; migrate the 76 practices (scripts for the ~20 breath/timer ones).
2. Practice tab with facet filters + Lenses; Theory tab from Concepts.
3. Script player v0 (breath orb + phase narration, dark design).
4. The book miner on one Sivananda text as a pilot, with a review queue in keeper.
5. Pathways + profile progress.

## 10. Live breath engine on the practice pages + course tree (built 2026-10-24)
- **Practise with the body** (`#practice/<id>`): opens `engine/breath` (body.js + breath.js, the white page of light) as a full-screen
  overlay over the dark site (`app/src/breathplayer.js` -> `site/breathplayer.js`, loaded on demand via `<meta name="wiser-breath">`).
  Per practice from `app/wisegraph/practice-body.json` (merged into `practices[].body` by `tools/build-collections.py`):
  `mode body|text`, `locus` (none, heart, nostrils, belly, central, channels, whole, space = `LOCUS` in body.js), `pace {inn,out}`
  (default 4.2/6.0 s) and `lead` (gently lengthen, exhale first, never past ~5.5/min). Natural breath only: no retention anywhere,
  and the engine has no hold. Steps come as one quiet fading line at a time (wall-clock cues over the chosen minutes); hold/release,
  opt-in mic and breath sound as on /breath/. End -> the same dark log sheet as the timer (`source: 'player'`).
  The dark timer stays: "Timer only" beside it, the first button under `prefers-reduced-motion`, and the automatic fallback when
  WebGL2 or the module is missing. needsTeacher / orientation-only, reading, movement, lying, daily-life, initiated and
  course-taught practices are `text` (no body button).
- **Course tree** (`app/wisegraph/courses.json` + `courses.schema.json` -> `tools/build-courses.py` -> `site/data/wisegraph/courses.json`):
  tradition > school > course > phase > practice, after deitybody's tradition > course > phase menu. Non-destructive: every
  collection (mini-course included) is a course node whose units become phases (or the groups in `phases`); every practice sits
  on exactly one school shelf; `index.practice[id]` gives each practice's tradition, school and course/phase uses (the practice
  page's "where this sits" line). Mini-courses are placed by their own `school`; mixed-tradition collections go to Across traditions.
  `collections.js` exposes `courseTree()` for the #courses UI. Tests: `node app/tools/test-practice-engine.mjs [--browser outDir filter]`.
