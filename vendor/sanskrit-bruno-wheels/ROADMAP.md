# Expansion blueprint: toward a complete Sanskrit grammar wheel system

## Design principle

Treat the wheels as **a visual control surface for a constrained grammar engine**. A dial position represents an abstract grammatical/semantic choice (subject, place, time, predicate, question). Its surface form is a **result**, not an unconstrained concatenation. The learner sees where the result comes from, while invalid combinations are blocked or explained.

## Ring architecture

| Module | Rings | What's generated | Criteria to unlock |
|---|---|---|---|
| I: Pronominal adverbs | ka-/ta-/ya-/sarva-/eka-/anya-; place/time/source/manner | 23 carefully selected forms (plus historically rare forms later) | 90% recall across two sessions |
| II: Short statements | singular subject; possessor; place; time; predicate | `मम माता तत्र अस्ति।` etc. | 90% word-generation fluency |
| III: Actions and questions | verb class; present-person agreement; where/when/how/from-where | `कुत्र गच्छसि?` and natural replies | short spontaneous dialogues |
| IV: People, gender, number | singular/dual/plural; noun gender; pronoun and adjective declension | contextually correct agreement | generated forms checked by morphology backend |
| V: Cases and arguments | nominative, accusative, instrumental, dative, ablative, genitive, locative | who does what to whom; possession/source/location | valency rules, corpus examples, tests |
| VI: Advanced derivation | tense/mood, causatives, participles, compounds, sandhi | larger corpus-aware sentences and reversible analysis | Vidyut trace and independent verification |

The ring count must **not** grow forever. Use nested wheels (adverb module, noun/relationship module, verb module, sentence module) connected by one shared state. A compact UI can show only the module currently relevant.

## Technical design

**Core data types**

- `Lexeme`: lemma, gender, class, valency, inflection family, sense IDs, frequency, attested citations.
- `MorphForm`: canonical surface, padaccheda, tags (person, number, gender, case, tense), source, provenance, review status.
- `GrammarRule`: Pāṇini sūtra, rule type, applicability, exception priority, URL, derivation step evidence.
- `SentenceIntent`: subject, object, relationship, predicate, circumstantial modifiers, speech act.
- `SentenceResult`: validated Sanskrit, gloss, English paraphrase, per-token derivations, warnings.

**Pipeline**

1. **Selection**: wheel state → semantic object, not raw strings.
2. **Constraints**: predicate's argument structure and compatible question roles.
3. **Morphology**: finite verbs, nominal declensions and suffix rules using verified generation (Vidyut adapter for future stages).
4. **Syntax**: simple attested sentence templates first; later corpus-informed flexible orders.
5. **Sandhi**: separate reversible layer with controls for padaccheda vs connected text.
6. **Evidence**: link to rules and scholarly grammars, show actual derivation trace if available, indicate uncertainty or stylistic oddity.
7. **Learning**: adaptive spaced practice for words, structures, audible prompts, and reverse parsing.

### Specific hard cases

- **कथम्** is not mechanically `क + था`: special Pāṇinian treatment. Always honour exceptions and rule priority.
- **कुतः** vs **कुत्र** shows why terminal sounds and different suffix functions matter; don't confuse the *ablative* function with the *locative* function.
- **अत्र** does not follow from naïve `एतद् + त्र`. Stem substitution is part of the grammatical system.
- **सुखी** vs **सुखिनी** involves the subject's grammatical gender, not an optional visual spelling convention.
- **तस्य** vs **तस्याः** are different genitive pronoun forms. Do not identify possessors only by English gender without a Sanskrit case tag.
- **कः समयः?** and idiomatic clock-time constructions require a phrase-level inventory, not automatic `-दा` manipulation.
- Not all adverbs occur naturally with all predicates; grammatical possibility and conversational idiomaticity must be separately represented.

## Vidyut integration plan

Official upstream: https://github.com/ambuda-org/vidyut

1. Add a Rust/WASM or small server adapter for `vidyut-prakriya` behind an interface such as `derive(lemma, desiredFeatures)`.
2. Define strict input/output schemas. Never let the UI interpret a surface string as complete grammatical metadata.
3. Cache selected outputs with deterministic test vectors and source versions.
4. Compare results against vetted paradigms and a second morphological reference; flag differences instead of silently choosing.
5. Render derivational steps as a chain with actual sūtra IDs; do not invent traces when the generator returns only a form.
6. Use an independent sandhi pass, keep optional pre-sandhi output visible.
7. Include dialect/register flags for Classical Sanskrit vs earlier/Vedic forms, and keep rare attestations marked rather than treating them as ordinary conversation.

## Verification requirements for every new ring

- Unit tests for every curated mapping and each ambiguous or exceptional form.
- Cross-product tests that ensure no unsupported combinations generate silently.
- Morphological agreement tests for person, number, gender, case.
- Semantic checks for argument roles, e.g. `from where` with motion/source predicates.
- Round-trip tests for `padaccheda ↔ sandhi`, where supported and unambiguous.
- Reference provenance on lexemes and representative generated sentences.
- Accessibility: use buttons in addition to circle arcs, keyboard navigation, large touch targets, high legibility.
- Browser SVG export checks, including exported text legibility and portable fonts.

## Good next deliverable

Implement **a 10-turn conversation trainer** on the current engine before extending to new morphology:

1. `कुत्र असि?` → `अहम् अत्र अस्मि।`
2. `तव माता कुत्र अस्ति?` → `मम माता तत्र अस्ति।`
3. `कदा पठसि?` → `अहम् सर्वदा पठामि।`
4. `कुतः आगच्छसि?` → source reply (add a curated source construction, not guessed morphology).
5. `कथम् असि?` → `अहम् सुखी अस्मि।`

The UI can feed the existing memory loop, show slow audio and accept spoken responses. Adding actual dialogue is more useful to beginner fluency than merely adding a sixth decorative ring.
