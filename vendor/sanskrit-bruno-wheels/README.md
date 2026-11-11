# Sanskrit Bruno Wheels · source package

A completely standalone, zero-dependency, offline-friendly Sanskrit word- and sentence-building experiment. Inspired by Bruno's combinatorial wheels, but **grammatically constrained**: changing a ring doesn't blindly concatenate Sanskrit strings.

## Run it

**Easiest:** Open `index.html` in a modern desktop browser. No build step or internet connection is required. The app is plain HTML + CSS + JavaScript. If your browser prevents scripts from local files, run:

```bash
cd sanskrit_bruno_wheels
python3 -m http.server 8000
# visit http://localhost:8000
```

There are three tabs: word wheel, sentence wheel, and mastery drill. Tap ring sectors or the adjacent left/right controls; export the currently displayed SVG using **Export SVG**. The static `assets/*.svg` files are snapshots; the actual interactivity comes from `app.js` generating SVG DOM elements and attaching events.

## What's in the download

```text
index.html                 User interface
styles.css                 Responsive typography, layout, wheel styling
app.js                     SVG drawing, interactivity, quiz, SVG export
engine.js                  Pure finite, grammatical sentence generator
data.js                    Curated Sanskrit forms and word/verb metadata
assets/word-wheel.svg      Editable vector artwork (word-wheel snapshot)
assets/sentence-wheel.svg  Editable vector artwork (five-ring snapshot)
assets/architecture.svg    Technical structure of the engine
assets/roadmap.svg         Planned progressive rings / features
assets/preview-word.png    Browser-rendered preview
assets/preview-sentence.png
ROADMAP.md                 Detailed expansion specification
LICENSE                    Reuse terms
 tests/test-engine.js       Deterministic grammar/regression tests
```

Tests use Node (no npm install):

```bash
node tests/test-engine.js
```

## What is verified / what is not

- **23 beginner word forms** are curated in an explicit lookup table. The 24th visible cell, *eka* × manner, is intentionally excluded from the beginner set. This does **not** mean *ekathā* never existed: Whitney lists a rare example from the Jaiminīya Brāhmaṇa.
- Core adverb affixes reference Pāṇini 5.3.7 (`-tasil`), 5.3.10 (`-tral`), 5.3.15 (`-dā`), and 5.3.23 (`-thāl`). `katham` is special (5.3.25), **not** simply *ka + thā*.
- **Sentence wheel** supports four singular subjects, four optional possessors, location/time adverbs, five predicates, a male/female happy-adjective toggle, and four question types plus source questions with *come*. The finite verbs use curated present-tense forms.
- Sentence output is **padaccheda-style**, with words separated for learners. It does *not* perform full external sandhi. Sanskrit forms are not proof that every semantic combination is natural in every conversational setting.
- This is **not a complete Pāṇinian parser or generator** yet. The grammar notes refer to rules, but do not offer machine-verified full *prakriyā* traces. That would be a separate integration with Vidyut, with cross-checking and exceptions.

Grammar sources:
- Pāṇinian adverb section (Siddhāntakaumudī): https://www.premabase.com/siddhanta-kaumudi/p40/textbook/index.html
- Whitney's *Sanskrit Grammar*, chapter XVI: https://en.wikisource.org/wiki/Sanskrit_Grammar_(Whitney)/Chapter_XVI
- Vidyut (Pāṇinian word-generation engine): https://github.com/ambuda-org/vidyut
- Pronoun background: https://www.learnsanskrit.org/guide/nominals/pronouns/

## How to extend the word wheel

Open `data.js`. `stems` and `endings` determine what appears on the rings. Each form is a verified entry in `words`.

For example, the existing *sarva* entries look like:

```js
sarva: {
  place: regular('सर्वत्र', 'everywhere', 'सर्व + -त्र', 'सर्वत्र गच्छामि।', 'I go everywhere.'),
  time: regular('सर्वदा', 'always', 'सर्व + -दा', 'अहं सर्वदा सुखी अस्मि।', 'I am always happy.'),
  // ...
}
```

**To add another stem**, add an entry to `stems`, then manually add its attested `words[stemId]` mapping. Do **not** automatically concatenate stem + suffix. The engine should either display an explicitly approved form or a pedagogical gap. If you expand the ring size, `app.js` already computes angular positions from the number of entries.

## How to extend the sentence wheel

`data.js` has arrays for `owners`, `subjects`, `places`, `times`, and `predicates`. The relevant SVG rings are configured in `app.js` as `ringConfigs`. Each one declares:

```js
{ key:'place', label:'PLACE', title:'Location',
  items:D.places, inner:162, outer:199, fontSize:17 }
```

The `key` must match a field in the sentence state. When rotated, the chosen `item.id` is saved and `engine.js` turns the state into a sentence. The existing predicate structure is:

```js
{ id:'go', deva:'गम्', en:'go',
  forms:{first:'गच्छामि',second:'गच्छसि',third:'गच्छति'} }
```

**To add a subject:** provide its grammatical person, type (`pronoun` or `family`), and gender where fixed. The current `engine.js` handles singular only. Add new classes of subjects only after extending agreement and the tests.

**To add a predicate:** add its curated finite forms. Then check how it interacts with location, source, time, and question modes. A verb may not admit the same semantic roles as another. For real scaling, use typed valency/semantic constraints instead of scattered conditionals.

**To add a new full ring:** add the `state` field in `engine.js`, add a config entry to `ringConfigs` in `app.js`, and update `sentence()` to either use it or reject incompatible combinations. With six or more rings, consider switching to *nested wheel clusters* or collapsible modules rather than shrinking text forever.

## How to extend mastery drills

`app.js` generates word challenges from all approved `words`, and contains 10 hand-authored `sentenceCards`. To add conversational prompts, add entries to `sentenceCards` using the current engine state keys. The generated answer becomes the Devanāgarī reveal. Mastery is saved locally as IDs under `sanskrit-bruno-wheels-mastery-v1` in browser local storage; correct cards disappear and misses return to the end.

When the deck or item IDs change, migrate the storage key/version to avoid stale progress being assigned to a different word.

## Architecture direction

The *next* serious milestone is a **semantic representation** independent of the display rings:

```json
{
  "speechAct": "statement",
  "subject": {"lexeme":"mother", "possessor":"my", "number":"singular"},
  "predicate": {"lexeme":"be-happy", "tense":"present"},
  "circumstances": {"time":"always", "place":"there"}
}
```

Then, in order:
1. Validate the combination's argument structure and semantic compatibility.
2. Resolve subject gender/number/person and adjective agreement.
3. Derive words with a checked morphological backend (eventually **Vidyut**).
4. Assemble a well-formed sentence with a corpus-informed template.
5. Apply sandhi via a separate, auditable layer, also showing padaccheda.
6. Show a rule trace *only* where an actual derivation engine supports it; otherwise distinguish a mnemonic explanation from a proof.
7. Add speech/audio (phoneme-aware, not an unverified browser TTS voice), progress tracking, and reverse sentence parsing.

See `ROADMAP.md` for the proposed six-stage development path and acceptance checks.
