# Add levels without new applications

Example: add `2.5` under the existing Expression family.

1. Append a level object in `src/families/02-expression.js`: a unique `id:'2.5'`, readable `title`/`focus`, **five** `rings`, and a deterministic `build(state,chosen)` returning `{lines:[SW.line(dev,roman,en)],note}`.
2. Each ring has `id`, `title`, and an `options` array (or a function of previously selected rings). Dependently filter options so changing `verb` to `go` cannot retain a `book` object; changing `gender` requires recomputing the numeral and adjective.
3. Update `src/curriculum.js` to insert `2.5` **after `2.4`** where the concept makes pedagogic sense; `prereqs('2.5')` will infer `2.4` automatically. Add cross prerequisites only when essential.
4. Update `docs/STUDY_ORDER.md` and regenerate `docs/CURRICULUM_MAP.json`. Include related practice wheels so learners can detour rather than getting trapped.
5. Add at least one hand-reviewed Sanskrit + IAST + English fixture, plus any dependent-choice assertions, in `tests/exhaustive.test.js`.
6. Run `node tests/exhaustive.test.js`, `python tools/build_standalone.py`, and optionally `python tests/browser_smoke.py`.
7. Do not change stable IDs when editing text. If a grammatical correction changes selectable state IDs, create an explicit progress migration.

**Never generate freely from lexical roots alone.** Sanskrit verbal forms, numeral inflections, cases, sandhi and compound semantics require reviewed paradigm data or rules proven for each category.

Adding a sixteenth family instead uses a new `src/families/16-new-family.js`, registration via `SW.registerFamily`, a script entry in `index.html`, and curriculum entries with prerequisites. A new five-ring UI is NOT needed.
