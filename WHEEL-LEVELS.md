# ESG1 × Wheels — review and levels plan (2026-11-11)

Source reviewed: Medhā Michika, *Enjoyable Sanskrit Grammar Vol. 1: Basic
Structure of the Language* (Arsha Avinash Foundation, 2023; ESG1_2024.pdf,
203 pp). Copyrighted — **not vendored, not quoted**. This note is an original
review plus our own building plan. Buy/link page:
http://www.aarshavidyavarshini.org/downloads/samskrtam101/ (free PDF).

## Why it is masterful (the five moves)

1. **Sentence-first.** "The primary objective is to understand the basic unit
   of the language, the sentence." Three analysis steps: strip sandhi →
   identify the verb (root/suffix/meaning) → relate each noun to the verb
   (kāraka + vibhakti). Everything serves parsing real sentences.
2. **Concept before mechanics.** kāraka (Topic III) is taught first *in
   English* as six relationships; only later (Topic VIII) the vibhakti
   machinery. kartṛ ≠ prathamā is stated explicitly — most textbooks smear
   them together.
3. **Verb at the center.** Verbs (Topics IV–VI) come before nouns (VII–X).
   The verb selects the sentence; nouns orbit it. This is exactly a wheel
   with the verb as hub.
4. **Pronouns early, domain vocabulary.** tad/yad/etad/kim decline with rāma
   (Topic IX.3); vocabulary is drawn from Vedānta teaching, not random lists.
5. **Pāṇini-consistent terminology throughout**, so the transition to the
   sūtras is seamless rather than a re-learning.

## How it maps to our wheels

| ESG | Wheel status |
|---|---|
| Pronominal adverbs (kim/tad/yad/sarva/anya + tra/dā/tas/thā) | BUILT (Machine A, curated + machine tiers) |
| Verb-centered sentences, person/number agreement | BUILT (Machine B, curated engine + Vidyut traces) |
| Topic III: six kārakas as relationships | **NEW — kāraka wheel (this plan)** |
| Topic VIII: vibhakti meanings 1–7 | folds into the kāraka wheel (each kāraka carries its vibhakti) |
| Topics V–VI: laṭ then 9 more lakāras | future lakāra wheel (our as-paradigm is the seed) |
| Topics IX–X: declensions + pronouns | future declension wheels (our aham/tvam/mātā traces are the seed) |
| Topic XII: avyaya | Machine A already covers the pronominal adverbs |

Nothing is copied: sūtra numbers and the six kāraka names are shared
grammatical facts; all glosses and examples here are our own words and our
own machine derivations.

## Levels (each wheel = a level; each level = a tutor prompt)

Machine-readable entry: `data/wheels/tutor/LEVEL.md` (vendored, linked from
llms.txt). Point any tutor model at the level file + the JSON it cites.

- **Level 1 — Bases (Word 1.1).** Six question-bases only, no endings.
  Goal: hear/see kim/tad/yad/sarva/anya/eka. Data: `data/wheels/word.json`
  (bases array). Prompt: `data/wheels/tutor/level-01-bases.md`.
- **Level 2 — Endings (Word 1.2).** Full grid/disc + traces + crosscheck.
  Goal: place/time/source/manner; katham special; eka gaps. Data: word.json
  + `data/grammar/wheel-pack.json` + `data/grammar/crosscheck.json`.
  Prompt: `level-02-endings.md`.
- **Level 3 — Who does what (Sentence 2.1).** Subject + predicate rings,
  statement only. Goal: asmi/asi/asti, sukhi/sukhini. Prompt:
  `level-03-subject-verb.md`.
- **Level 4 — When and where (Sentence 2.2).** + time + place rings.
  Goal: adverbs never change. Prompt: `level-04-time-place.md`.
- **Level 5 — Asking (Sentence 2.3).** Question modes (gated) + possessors.
  Goal: kutra/kadā/katham/kutas + mama/tava/tasya/tasyāḥ.
  Prompt: `level-05-questions.md`.
- **Level 6 — Relationships (Kāraka 3.1).** NEW wheel: verb hub, six kāraka
  rings, each carrying its vibhakti + our example. Goal: kartṛ≠prathamā,
  the ESG Topic III move. Data: `data/wheels/karaka.json`.
  Prompt: `level-06-karaka.md`.

## Cumulative visualization (the 1.1 → 1.2 rule)

The wheels page gets a level selector. A level reveals only its rings:

- Word wheel: L1 shows the stems ring only (disc renders one ring, center
  shows the base meaning); L2 adds the endings ring + table.
- Sentence wheel: L3 shows who + does-what; L4 adds when + where; L5 adds
  modes + whose + gender.
- State persists per device; finishing a level's drill unlocks the next
  (local only, no account).

Rule for future wheels: every complex wheel ships with a 1.1 single-ring
view first. No 14-ring headaches, ever.
