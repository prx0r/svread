# Daily focus, exploration, readiness and spaced mastery

The learner asked for *one wheel as a daily focus*, a progressive `n.1 → n.2 → ...` skill tree, and frictionless excursions to adjacent wheels if a construction becomes too difficult.

## Practical loop

1. Recommend one study focus per calendar day, initially `1.1 Conversation: Introductions`, via `SWCurriculum.recommend(stats)`.
2. Present one five-ring generated prompt. Attempt pronunciation/construction before revealing IAST/English. Spin one ring, then other rings, to see exactly what changes.
3. Press **Got it** for a genuinely answered prompt; **Needs practice** when unsure. **Mark explored** records exposure but does NOT imply correctness.
4. Once ready, **Level up** into the next numbered variant of the same family. The learner can alternatively move sideways to an easier neighbor, practise there, then return to the original focus.
5. On a later day, revisit the wheel to stabilise long-term mastery.

## Concrete state definitions implemented

- **Unstarted:** no self-graded attempts.
- **In practice:** attempts recorded, but not ready.
- **Ready to level up:** at least **8 self-graded attempts**, including **6 distinct correct combinations**, with **≥80% correct in the latest 10 graded attempts** (or all graded attempts when fewer).
- **Mastered:** ready, **11 total correct self-reports**, and at least **2 distinct local calendar dates** with positive practice.

These are low-friction **practice heuristics**, not validated language proficiency measures. An authenticated teacher or reliable quiz/grading mode could replace them with evidence-based assessment later; do not call voice pronunciation "verified" without assessment. Self-ratings can be inaccurate, and marking a correct answer repeatedly cannot manufacture six distinct successful combinations.

## State fields

`stats[lessonId].attempts[]` contains `{key, grade, day, at}`. `key` includes family ID, level ID and five selected option IDs. Store the last 120 attempts per level in the offline prototype.

`focus = {day, id}` uses the learner browser's local date. A manual `Make today's focus` takes priority for that day. If a new day starts, recommend the earliest prerequisite-ready level not yet ready; once everything is ready, suggest a level not yet mastered for spaced review. Keep a future site-level override if the learner wants to persist a focus across multiple days.

`practised` is legacy exploration logging, not proof of mastery, and must never be migrated into positive grades.

## Dependencies and detours

- Every `n.2` requires `n.1` for the **recommended path**, but no levels are hard-locked.
- Additional cross-family prerequisites appear in `curriculum.js`, for example `12.1 Relative–Correlative` builds on `7.2 KA–TA–YA Time`; `13.1 Causatives` builds on `8.2 Dative/recipient`; `15.1 Compounds` builds on `8.2 Case Relations`.
- `SWCurriculum.neighbors(id)` surfaces conceptual relatives and the nearby sequence, such as `7.2` when struggling with `12.1`.
- Browsing neighbors never edits `focus`, and all graded work stays tied to its actual level.

## Integration warning

Browser localStorage is not per-account persistence. The offline prototype has NO verified cross-device sync. When porting to Svatantrya, map this schema to authenticated learner storage with explicit authorisation, field migration and export. Never pretend records survive device/browser deletion.
