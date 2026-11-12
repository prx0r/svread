# Voice companion loop — spec (2026-11-12)

Goal: open ChatGPT voice with the Svatantrya plugin and get a warm-up
conversation that **starts itself**, runs **Sanskrit-first**, explains rules
in English, and tracks every produced sentence server-side so weak forms
come back and mastered ones retire.

Not a new app. It is the existing pieces in one loop:
`compose.json` (4,755 enumerated states) + `compose_gate_server`
(drill/submit/review/progress) + a thin **session conductor**.

## 1. The loop (what the learner experiences)

```
voice on → plugin called → session_start(level)
  → teacher greets in Sanskrit (scripted, from the level's own ring space)
  → learner attempts a sentence in Sanskrit (may be slow / broken)
  → session_check(utterance)  → grammar-aware verdict
       ok        → confirm + one more, harder ring combination
       near-miss → name the ONE wrong ring, in English, once ("you used
                   tvaṃ but you're addressing bhavān — try bhavān katham asti")
       silence / "I don't understand" in English → English explanation,
                   then hand the same sentence back to repeat
  → every attempt scored into mastery (drill/submit path)
  → session_end → summary: mastered / to-replay / next level
```

The teacher **never reads out the whole answer first**. It gives the frame,
the learner produces, the server checks. Same discipline as the gates.

## 2. Why this is better than a chatbot tutor

We own the target space. Every level is a finite, enumerated set of valid
sentences (24 levels, 4,755 states). So a learner's utterance can be matched
against known-good states:

- **exact/normalized match** → correct (same normaliser as `submit`)
- **near match** → identify which ring diverged (speaker / verb / object /
  reason / time…) because we know which slot each word came from
- **no match** → say what was missing, don't invent a correction

That is a *grammar-aware correction engine*, not an LLM vibe check. It can
say "your sentence is grammatical but it's level 3.1's frame, not 2.2" —
because it can locate the utterance in the level lattice.

## 3. Tools (add to compose gate server; no new service)

| Tool | Job |
|---|---|
| `session_start(level, user_id)` | pick family+level, deal 3–5 warm-up items (`drill` under the hood), return a teacher brief: target rings, Sanskrit greeting script, English rule note, one-question-at-a-time policy |
| `session_check(utterance, session_id, user_id)` | normalise → match against the session's valid states → `{verdict: ok\|near\|no, wrong_ring?, say_this?, repeat_request}` |
| `session_next(session_id)` | next ring combination, escalating within the level |
| `session_end(session_id)` | mastery summary + what to replay tomorrow |
| *(existing)* `drill` `submit` `review` `progress` | deal / score / replay / report |

`session_check` is the only genuinely new logic: fuzzy match to the session's
enumerated states. ~80 lines, reuses the normaliser and the dataset.

## 4. Voice-friendly rules (bake into the teacher brief)

- one question per turn; wait; no stacked questions
- target sentence first in IAST + Devanagari, then let the learner speak
- invite repetition: "शनैः पठ — say it slowly"
- English only for the rule after a miss; the *task* stays Sanskrit
- never correct more than one ring per turn
- no speech-quality scores (we don't measure pronunciation — say so)
- phrasing to seed: "aham na avagacchāmi" → teacher explains in English once,
  then returns to Sanskrit

## 5. What exists vs what's needed

| Piece | State |
|---|---|
| 4,755-state dataset + levels | **done** (`data/wheels/compose.json`) |
| server-scored drill/submit/review/progress | **done** (`mcp/compose_gate_server.py`, verified: no key leak) |
| MCP host | wire the gate into the Svatantrya bundle (+ session tools) |
| `session_*` conductor | **to build** (~1 file) |
| voice | ChatGPT voice + plugin (client-side, nothing to build) |
| audio for lines | free edge TTS already in sanskrithelp `/api/tts` |

## 6. Low-hanging fruit (do these, cheap)

1. **Numbers wheel** — the engine already emits numerals (`saptaviṃśatiḥ`,
   `viṃśatiḥ`, `triṃśat`). Add a `numbers` family (1–100, ordinals, counting
   objects) using the same 5-ring contract; zero new machinery.
2. **Wire compose into the public bundle** — 2 tools (`drill`, `progress`) on
   `mcp.svatantrya.net`; the rest behind Studio (bearer).
3. **Audio on every compose line** — lines already carry `dev/roman/en/role`;
   pipe through existing edge TTS so "listen" works offline-ish.
4. **Certificates reuse** — the 44 grammar certificates + `wheel_verify`
   already prove forms; compose lines can cite the same receipts.

## 7. High-leverage, but bounded (the "insane" ones)

1. **Vidyut as mechanical validator (biggest win).** Vidyut 0.4.0 is
   installed with `prakriya`, `chandas`, `kosha`. It can *derive* the correct
   verb/noun form and prove our `build()` output is Pāṇinian-correct — turning
   4,755 `MACHINE_PROPOSED_UNREVIEWED` rows into `MECHANICALLY_CHECKED` without
   a human in the loop. Requires the `dhatupatha.tsv` data file (not on the
   box yet; one download). This is the difference between "looks grammatical"
   and "derivable".
2. **Whitney's Sanskrit Grammar** (public domain, 1879): roots + paradigms +
   sandhi tables. Use it two ways: (a) seed a bigger compose corpus, (b) a
   second independent oracle beside Vidyut (two engines disagree → HOLD).
3. **Chandas** (Vidyut) — once learners start composing verses, metre-check
   the output; already wired in `vidyut_candidates`.
4. **Panini slice reuse** — `trika-x/formal-trika/control/PrakriyaSlice.lean`
   + 44 certificates already do receipt-bound derivation. Compose should
   mint the *same* receipt shape, not a parallel one.

## 8. Non-goals (do not build)

- pronunciation scoring / speech recognition grading (we can't measure it)
- a new UI (voice + existing plugin is the surface)
- an LLM writing Sanskrit sentences freehand (that is how unverified Sanskrit
  gets published; the enumerated set is the guardrail)
- multi-user accounts before per-user OAuth lands (single owner v1)

## 9. Build order

1. `session_start/check/next/end` on the compose gate (fuzzy matcher).
2. Wire compose gate into `mcp.svatantrya.net` (drill/progress public;
   session/submit/review behind Studio bearer).
3. Download `dhatupatha.tsv` → Vidyut validator pass over all 4,755 rows.
4. Numbers family on the same contract.
5. Audio wiring on compose lines.

---

## 10. Scenarios — wheels combined into role-play (the endgame)

A *scenario* is a role pairing plus a vocabulary domain plus the wheel families
in play. The teacher becomes one character, the learner another, and the drill
targets come from the combined ring space.

```
scenario = (roles: {teacher: X, learner: Y},
            domain: vocabulary set (market, ashram, home…),
            families: which wheel families are legal,
            objective: what the learner must accomplish,
            difficulty: level band)
```

### First scenario — student and guru (start here)

- roles: guru (teacher) / śiṣya (learner)
- families: 1 Conversation + 2 Expression + 7 Numbers
- flow: greeting → name/age (7.3) → what do you study (1.2) → why (2.3) → thanks
- teacher speaks simple Sanskrit, explains a rule in English **only after** a miss
- one ring wrong per turn, never more

### Second — marketplace (the seller/buyer twist)

- roles: **learner = seller**, teacher = buyer (or swap; randomised)
- families: 7 Numbers + 3 Action + 2 Expression
- the learner's line is seeded from the wheel space, e.g.
  `mayā phalāni vikrīyante` (fruits are sold by me) / "I have many delicious
  strawberries — would you like one?"
- humour and freeflow sit *on top of* the grammar frame: the frame guarantees
  correctness, the learner/persona supplies the life

### How scenarios are generated (not hand-written)

- pick roles × domain × family-band → sample a *goal state* from the combined
  enumerated space (e.g. "learner says age 36 and has an elder brother")
- the teacher's script is the *questions* that elicit that state
- `session_check` validates the learner's replies against the same lattice, so
  role-play never drifts into uncorrected free Sanskrit

### Why this is the real unlock

Every scenario is deterministic, replayable, tracked, and correctable — a
randomised role-play that still knows exactly which ring the learner got wrong.
Specialist terminology is just a new **domain vocabulary pack** (Āyurveda,
ritual, philosophy) layered onto the same five-ring contract; no new engine.

### Non-goal

The teacher must not free-compose Sanskrit dialogues. It elicits and responds
within the enumerated frame; anything outside it is English explanation or a
next-level prompt. Humour is welcome in the *persona*, never in invented grammar.

---

## 11. Runtime determinism (what "deterministic" actually means here)

Four separate guarantees; do not conflate them.

1. **Generation is enumerated, never invented.** Items come only from
   `compose.json`; no model composes Sanskrit. The dataset is emitted by the
   engine itself (`dump_compose.js`), so data and code cannot drift.
2. **Dealing is seeded.** `drill(level, user_id, seed)` → same triple always
   deals the same items. Default seed = hourly bucket of
   `sha256(user_id:level:hour)`, so a retry within the hour replays; pass an
   explicit `seed` to pin forever.
3. **Scoring is server-side and idempotent.** The key never leaves the server.
   `submit` is a compare-and-set: an identical retry returns the same receipt;
   a different replay is refused.
4. **Receipts make it auditable.** `receipt = sha256(level, seed, item_ids,
   key)`. Store it; any later run with the same inputs regenerates the same
   receipt. A receipt proves *what was asked*, not that a human said it.

Normalisation is versioned by code (`norm()`): strip punctuation/danda,
lowercase, fold whitespace. Accepted iff the answer equals the Devanagari or
the IAST form after normalisation. Change `norm` → bump the dataset format.

## 12. Order of work (do top-down; each step is shippable)

| # | Step | Why now | State |
|---|---|---|---|
| 1 | Deterministic gate (seed + receipt + idempotent submit) | foundation for everything | **done** |
| 2 | Expose via plugins: `compose__levels/show` public, `drill/submit/review/progress` on Studio | ChatGPT can use it today | **done** |
| 3 | `session_*` conductor (start/check/next/end) | turns drills into the voice warm-up loop | next |
| 4 | Gateway resource proxying + `_meta.ui` passthrough | prerequisite for widgets | next |
| 5 | `ui://compose/rings` widget (on-screen rings) | “get chat to display stuff” | after 4 |
| 6 | Numbers + compose inside `session_*` | endgame voice loop | after 3 |
| 7 | Scenario engine (roles × domain × families) | role-play | after 6 |
| 8 | Per-user OAuth (offline_access) | multi-user; nibbana stays last | later |

## 13. On-screen display — how ChatGPT shows a widget

The Apps SDK path (OpenAI “Plugins”, 2026):

- a tool result carries `structuredContent` (model reads), `content` (text
  fallback) and `_meta` (UI, model does not see);
- `_meta.ui.resourceUri = "ui://compose/rings"` points at an HTML resource
  served over MCP with `mimeType: "text/html;profile=mcp-app"`;
- the widget runs in an iframe, talks to ChatGPT over the MCP Apps bridge
  (`postMessage`): it receives `ui/notifications/tool-result` and may call
  `tools/call` itself;
- **the tool must be fully useful without the widget** — text fallback first,
  widget as enhancement. Voice has no screen; both paths must work.

What this needs from us: (a) compose tools return `structuredContent` (rings +
prompt + options) and `_meta.ui`; (b) the gateway proxies **resources** and
preserves `_meta`/`outputSchema` (today it strips them) — that is step 4.

The widget itself is one HTML file: five concentric SVG rings, click to
select, “Reveal IAST / English”, “Check” → `tools/call compose__submit`.
It renders the *same* enumerated state the server scored, so screen and voice
can never disagree.
