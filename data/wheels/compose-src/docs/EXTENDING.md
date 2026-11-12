# Adding levels without multiplying apps

Each family owns ordered levels. Example: **2 Expression** evolves into **2.1 Simple thoughts → 2.2 Preferences → 2.3 Because/Contrast → 2.4 Interests**.

To add **2.5 Comparing two interests**, edit `src/families/02-expression.js` and add a level to the family `levels` array. Do not add a new menu entry, route or copy of the UI.

## API

```js
const newLevel = {
  id: '2.5',
  title: 'Comparing interests',
  focus: 'Prefer X to Y and explain why.',
  rings: [
    {id:'speaker', title:'Who?', options:[{id:'i',label:'अहम्'}, /* ... */]},
    {id:'interestA', title:'Like more', options:[/* curated */]},
    {id:'interestB', title:'Like less', options:(selected) => /* legal alternatives */ []},
    {id:'degree', title:'How much?', options:[/* ... */]},
    {id:'reason', title:'Why?', options:[/* ... */]}
  ],
  build: (selected, chosen) => ({
    lines: [SW.line('REVIEWED DEVANAGARI', 'reviewed IAST', 'reviewed English')],
    note: 'Grammar point and restrictions.'
  })
};
```

The snippet is a **schema example**, not executable Sanskrit content. Every actual option must be curated and the build must produce grammatical and meaning-aligned output before merging.

### Important semantics

- `selected`: a plain map of ring IDs to option IDs (`{speaker:'i',interestA:'meditation',...}`).
- `chosen`: option objects selected by the engine (`chosen.speaker`, etc.).
- `options(selected)`: dynamically compute legal choices from *earlier* rings. You cannot depend on a later ring. The core normalises stale downstream selections.
- `build(...)`: a pure function. No browser, LLM, network, user account, side effects, or `Math.random()` inside.
- Return `lines` each with `dev`, `roman`, `en`, optional `role`, and a pedagogic `note`.
- **Exactly five rings per level**, each actually changing what the learner sees or practises.
- Do not string together arbitrary inflected words. Curate paradigms, case frames, and collocations, or add reviewed inflection logic.

## Tests when adding a level

1. Add its entry to its family's `levels` array.
2. Run `node tests/exhaustive.test.js`. It discovers and enumerates all new options automatically. Update the expected total levels from 24 to 25 and add an important language-specific assertion.
3. Ensure selecting a different transitive/intransitive verb changes the available objects to appropriate case frames.
4. Verify every Devanagari/IAST pair and every rendered English interpretation manually, including negation, questions, person, gender, number and temporal context.
5. Test keyboard focus, touch targets, and mobile layout.
6. If you change `src` or `styles.css`, rebuild `standalone.html` with `python tools/build_standalone.py`.

## Future site integration (optional)

Expose the `family`, `level`, 5 ring IDs, resolved `state` and generated lines in a stable exercise record. In a later connected version, save attempts per authenticated user and reuse the existing site's progress logic. Keep the browser-only practice log explicitly separate from a real per-account record. Never claim pronunciation scoring from unanalysed speech.
