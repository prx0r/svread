# Four wheels — fact-check before implementation (2026-11-12)

Companion to `SANSKRIT-WHEELS-SPEC-VERBATIM.md` (the owner's words, unedited).
This file is analysis only. Verdict up front: **the architecture is right; two
of the "absorbs" lists are simplifications worth stating plainly.**

## 1. Is four wheels correct?

As a *pedagogy*, yes. As a *strict partition*, no — and the difference matters.

| Proposed wheel | v2 families it genuinely subsumes | Cleanly? |
|---|---|---|
| Conversation | 1 conversation, 7 deictics, 14 quotation (reporting) | yes |
| Expression | 2 expression, 5 logic, 12 correlatives, 14 quotation (thought) | yes |
| Action | 3 action, 8 cases, 10 commands, 11 sequence, 13 causatives | yes |
| Description | 4 description, 15 compounds | yes |

Two honest corrections:

1. **Transformation (family 6) is not a wheel.** It is the *mechanism* by which
   any wheel changes a person, tense or polarity — i.e. exactly the owner's own
   "Why did that change?" reveal. Folding it in as a wheel would be a category
   error; keeping it as the explain-layer is correct and is how the spec already
   uses it. Mapping: `wheel = null, role = mechanic`.
2. **Numbers (9) and Deictics (7) are cross-cutting, not owned.** Age appears in
   Conversation, counting in Action and Description; question-words appear in
   Conversation and correlatives in Expression. Assigning them wholly to one
   wheel loses generality. They are better modelled as *ring capabilities*
   available to several wheels. The wheelmap records `primary` vs
   `cross_cutting` rather than pretending a partition.

Net: **4 wheels + 1 mechanic (transformation) + packs**, with numbers/deictics as
shared capabilities. That is a compression, not a taxonomy — which is the point.

## 2. Are they generative? Infinite?

Three different questions, three different answers:

- **Per step: finite.** Each wheel×level is a finite enumeration (currently
  9,507 states over 60 levels; pack expansion adds more). Every state is known
  and testable. This is a feature: no unverified Sanskrit is ever produced.
- **In sequence: unbounded.** Conversation is genuinely open-ended — its
  follow-up ring emits the next question ("Continue by answering it and rotating
  again" is in the engine's own note). You can keep talking forever; the state
  space is finite but the walk through it is not. This is a finite-state
  dialogue, like a Markov chain, not a script.
- **With packs: multiplicative, still finite.** A pack swaps the lexeme set
  (actors, objects, places) into the same grammar. 6 packs × the Action wheel
  alone already yields 1,350 states. Hundreds of packs would reach millions —
  practically inexhaustible for a learner, still enumerable for testing.

**Mathematically infinite** would require recursion (embedded clauses:
"I think that he said that she knows…"). We deliberately do **not** generate that
freehand, because unverified recursion is exactly where wrong Sanskrit appears.
So the honest label is: *unbounded in use, finite and verified underneath* —
never "infinite Sanskrit", which would be a promise we cannot keep honestly.

## 3. Was the old model wrong?

Not wrong — it was a *grammar syllabus*. The four wheels are a *usage syllabus*.
The grammar topics remain as patterns (wheelmap keeps all 15), but the learner
meets them as consequences of changing one sentence, which is the stated goal.
Nothing is deleted; family and level IDs stay stable so progress migrates.

## 4. What this implementation does (this pass)

- `data/wheels/wheelmap.json` — the 15→4 mapping, level roadmap, mastery axes.
- `data/wheels/compose-src/src/packs.js` — six starter packs (About Me, Family,
  Classroom, Travel, Vedānta, Trika) and a pack-aware Action wheel (3.1/3.2).
  Packs supply *vetted inflected lexemes*; the wheel supplies grammar. No new
  inflector is invented — a future pass can derive forms with Vidyut.
- `tools/dump_packs.js` → enumerated pack×wheel states (1,350, zero errors).
- `tools/emit_packs.py` → `data/wheels/compose-packs.json` (deterministic).
- "Why did that change?" diff function in `packs.js`.

## 5. What is deliberately NOT done yet

- Expression / Conversation / Description pack variants (only Action so far —
  the owner's own worked example).
- Pack creation from a conversation (spec §9) — needs human review + validation
  before any pack is publishable.
- Deriving pack lexemes with Vidyut instead of curating surfaces.
- Any claim that the generated sentences are philologically certified: they are
  `MACHINE_PROPOSED_UNREVIEWED` like the rest of the dataset.
