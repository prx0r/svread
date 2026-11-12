# Coding-agent directive: Svatantrya five-ring Sanskrit curriculum

## Core product decision (non-negotiable)

**One five-ring renderer, one generation engine, fifteen grammatical wheel families, progressive versions within each family.** A level like `2.3` is NOT a new product or a separate UI. `2.1` introduces simple judgments; `2.2` adds preferences; `2.3` adds *because*; `2.4` applies the same opinion/explanation wheel to interests. Continue with `2.5`, `2.6`, etc. **Do not overengineer** with unrelated mini-apps, a new website, an LLM generating unverified inflections, or a five-service dependency graph.

The attached code already implements the offline prototype. **Port the functions into the EXISTING Svatantrya site's components/design**, preserving the site's layout, routing, tutor voice interface, and authorised user-progression system. Do not replace the existing site. Do not claim it is live before deployment and verified read/write tests.

## First: run the existing work

1. `node tests/exhaustive.test.js` must pass.
2. `python tools/build_standalone.py` regenerates a dependency-free, working HTML file.
3. `python tests/browser_smoke.py` validates desktop/mobile interactions if Chromium/Playwright are available.
4. Inspect `docs/REVIEW_NOTES.md` before publishing generated sentences as authoritative.

## Learning order and daily loop

Use `src/curriculum.js` as the executable curriculum graph, and `docs/CURRICULUM_MAP.json` as a machine-readable handoff. `docs/STUDY_ORDER.md` lists all 60 lessons in **recommended study sequence**, interleaved across families. Family numbering is a stable content ID, **not** the recommended study order.

**Daily journey:**

1. Auto-suggest earliest prerequisite-ready **not-yet-ready** level. One level is the day's focus, recommended **10–15 minutes**; do not override a learner's manual focus.
2. Generate a fresh five-ring combination; the learner attempts the Sanskrit aloud or silently **before revealing IAST/English**.
3. Learner self-grades `Got it` or `Needs practice`; a practice mark is *not* proof of competence. Store a grade, combination ID and timestamp. A tutor/voice system must not silently mark correct without reliable assessment.
4. When a level is `Ready to level up`, show the **next level in that family**. It may be accessed immediately. It becomes `Mastered` after review on a separate day. See `PROGRESS_AND_MASTERY.md` for the exact thresholds and what is merely self-reported.
5. If frustrated, show the 3–6 **related wheels** from `SWCurriculum.neighbors(levelId)`; a detour must not erase the original daily focus or block freely browsing other levels.
6. Next day, recommend the next eligible level or a review due (a future backend may implement a proper spaced scheduler).

**Never hard-lock exploration**. Prerequisites inform the recommendation; they do not forbid selecting a family or lesson. Manual `Make today's focus` is always available.

## Pedagogy: foundations before complexity

Teach in this dependency-aware order, not `1.1...1.4, 2.1...2.4`:

1. `1.1 → 7.1 → 3.1 → 6.1 → 4.1 → 9.1`: basic social exchange, place-question families, subject-verb-object, verb person, noun descriptions, first number agreement.
2. `1.2 → 7.2 → 3.2 → 8.1 → 10.1 → 2.1`: questions about places, when, location, nominative/accusative, commands, opinions.
3. Interleave more person/gender/number, want/can, dative/ablative, **before** conditional and advanced compound logic. Follow the full 60-item map; don't guess another sequence.
4. Treat `13.x` causatives and `15.x` compounds as late intermediate/advanced: they need cases and verb transformations, not memorised fragments.

**Why it works:** each ring trains a distinct operation, while wheel levels introduce exactly one or two new grammatical dependencies. Rerolling a prior ring recomputes dependent options (e.g., a `go` verb offers destinations, a `read` verb offers objects; a dual numeral triggers dual nouns/verbs).

## Data and generator contracts

- A family has a stable `id`, `number`, `title`, `description`, and `levels[]`.
- Every level has a stable ID `family-number.level-number` (e.g. `7.4`), meaningful `title` and `focus`, **exactly five `rings`**, and deterministic `build(state, chosen)`.
- Ring definitions: `{id,title,options}` where `options` can be a static array or `function(previousSelection)`; options are `{id,label,...}`. Avoid invalid states by constraining `options` based on earlier rings.
- `SW.generate` returns each line as `{dev,roman,en,role}`. All three text forms must remain aligned; IAST must retain vowel lengths and consonant diacritics.
- Grammar is a **finite reviewed morphology bank + structural templates**. Never produce arbitrary Sanskrit by concatenating root strings or using an unchecked model completion. Curate the resulting output, including sandhi and agreement.
- All text about Trika must distinguish *original pedagogical examples* from *verified quoted verses*. Do not invent canonical Sanskrit.
- Changing a ring should affect a relevant component of the example. Automated selection-path coverage is necessary but not sufficient; add reviewed linguistic fixtures per rule.
- Each family can add `2.5` etc. without duplicating the renderer, tutor orchestration, or user state.

## Progress and privacy

The offline app writes browser-only `svatantrya.generative-wheels.v1` localStorage fields `{practised, stats, focus, lastFamily, lastLevel}`. Keep family and level IDs stable for migrations. Existing `practised` records are **explored states**, not success grades. Never silently interpret them as mastery.

For the existing Svatantrya authenticated site, persist progress only via its authorised per-account backend, with an explicit schema and migrations. No remote write path is bundled or verified here. The plugin may synchronise only after user/session identity and persistence permissions are established. Export JSON remains available for portability. Under offline-only usage, progress is **device/browser-local**.

## Acceptance criteria for integration PR

- Existing Svatantrya site styling and routes preserved; no replacement website.
- At least 15 registered families, 60 original levels, 5 operative rings each; existing combinations still generate.
- All 60 study-order IDs and all graph prerequisites validate; recommended initial focus is `1.1`.
- Changing person, gender, numeral, verb frame, case, quote, or compound moves the correct other forms; invalid choices reset rather than yielding nonsense.
- One daily focus and related-wheel detours work; grade histories survive reload; last practice doesn't get overwritten by navigation.
- Per-level status clearly says `Unstarted`, `In practice`, `Ready to level up`, or `Mastered`, based only on available evidence.
- Visible IAST/English reveal and hidden-target exercises; responsive mobile UI and keyboard-accessible ring controls.
- Exhaustive mechanical tests, browser smoke, and **independent Sanskrit editorial review** before public grammar-correction claims.
- PR explains what was implemented, what remains prototype-only, and what was actually verified live.

## Handoff deliverables

Commit modular engine, 15 family definitions, curriculum graph, unit/browser tests, and a migration plan. Keep the next work incremental and reviewable. Do not import secrets, invent API endpoints, or publish a new site in place of the established one.
