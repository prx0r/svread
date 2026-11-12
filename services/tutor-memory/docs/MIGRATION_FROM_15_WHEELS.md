# Keep 60 existing lessons; show four wheels

## Prior artifacts

The earlier `Svatantrya_Sanskrit_Wheels_15_Families_60_Levels.zip` has:
- stable old IDs `1.1` through `15.4`;
- 15 separate JS family modules and one ring renderer;
- client-side `localStorage` key `svatantrya.generative-wheels.v1`;
- a curriculum graph and editorial review notes.

**Do not discard or overwrite** that source. This backend package deliberately does not copy its HTML, PNG screenshots or 60 lesson content. Import the old archive directly during integration.

## Four visible destination wheels

| Old family | Map to visible wheel | Retain as internal skill / mode |
|---|---|---|
| 1 Conversation | Conversation | greetings, question forms |
| 2 Expression | Expression | opinion, preference, reasons |
| 3 Action | Action | agent, objects, time, place |
| 4 Description | Description | demonstratives, adjectives |
| 5 Logic | Expression | conditions, objections |
| 6 Transformation | Action + cross-wheel mode | person, tense, polarity |
| 7 KA–TA–YA | Conversation | deictics, question words |
| 8 Cases | Action | case roles |
| 9 Numbers | Action + Description | number agreement, quantities |
| 10 Commands | Action | imperatives |
| 11 Sequence | Action | converbs, temporal sequence |
| 12 Correlatives | Conversation + Expression | yadā/tadā, yatra/tatra |
| 13 Causatives | Action | causative verbs |
| 14 Quotation | Expression | iti, reporting speech |
| 15 Compounds | Description | compounds as noun/quality construction |

No old user progress is to be blindly marked 'mastered'. Map legacy `practised` to exploration/seen only. If grade provenance is unknown, keep it as `legacy_unverified` and offer review.

## Migration steps

1. Snapshot the existing source and learner data; test restoring both before migration.
2. Introduce `wheel_id` as a presentation alias, not a replacement for the lesson's historic `legacy_id`.
3. Create explicit `legacy_id -> (visible_wheel, new_level_id, skill_ids[])` mappings. Avoid guesses: 6 and 9 can target multiple wheel operations. Allow duplicates in skills, not duplicate progress counts.
4. Assign stable `pack_id`s; start with the old built-in examples as a default pack, not private About Me data.
5. Register verified IAST/Devanāgarī/English templates with schema and content version IDs.
6. Import existing progress exactly once with an idempotent job and audit counts. Invalid/unknown IDs become quarantined records, not silently skipped.
7. Compare generated outputs of each of the 60 old levels before and after refactor, with reviewed examples and a human linguist.
8. Cut over the interface behind a feature flag; keep rollback to existing 15-family UI until parity is verified.

A new level can be added without schema migration by adding versioned wheel configuration and skill IDs. A pack can be swapped without renaming any learner skill IDs.

## Content provenance

Generated practice sentences are labelled `pedagogical`. Quotations attributed to Abhinavagupta or other authors require edition/source/locator and philological review. Never fabricate canonical Sanskrit simply to fill wheel combinations.
