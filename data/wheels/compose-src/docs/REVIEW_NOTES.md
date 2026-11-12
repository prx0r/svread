# Testing scope, linguistic review and limitations (v2)

## Mechanical verification (executed)

- 15 families registered, each with 4 levels and exactly 5 rings: **60 lessons**.
- Exhaustive generation and nonempty Devanāgarī/IAST/English shape assertions over **9,507 legal selectable combinations**.
- Cross-variable regression fixtures: bhavān vs tvaṃ, age 27, singular/dual/plural, past/future, KA/TA/YA correlative pairs, restricted case objects/recipients, commands, -tvā sequences, causative paired sentences, iti reporting and compound vigrahas.
- Curriculum graph validates all 60 IDs, dependencies and recommended order. Self-rated readiness and separated-day mastery thresholds have unit tests.
- Desktop/mobile Chromium smoke passes: 15 families, daily focus, graded attempt, neighbor detour, target reveal for compound analysis, no JavaScript errors or horizontal overflow at 390px.

## Not yet independently established

**These passes do not amount to Sanskrit philological certification.** Mechanical enumeration checks code paths, state constraints, missing text and a subset of morphology; it does not prove every semantic choice or sandhi output is correct.

Before public use as a strict correctness oracle, commission expert review especially of:

- Original families `3.x` (tenses), `4.3` (comparatives), and `5.3–5.4` (argument forms) inherited from the first prototype.
- `7.3` source correlations (`yataḥ/tataḥ`) and the difference between spatial source and causal sense; `7.4` manner adverbs must NOT be derived by blind suffix joining.
- `8.x` agency, dative objects, instrumental, ablative motion constructions, and euphonic combinations. English paraphrases are simplified.
- `9.x` numeral agreement, nominal forms of one through four, and singular/dual/plural predicate grammar.
- `10.x` imperative politeness and whether contexts are idiomatic in spoken Sanskrit.
- `11.x` -tvā same-agent requirement and tense-aspect interpretation.
- `12.x` relative/correlative clause semantics and permissible particle placement.
- `13.x` causative roots and the number/case of their affected participant and second object, including possible alternative constructions.
- `14.x` iti with reported questions/thoughts and punctuation in Sanskrit teaching orthography.
- `15.x` compound membership, genitive vigraha alternatives, gender/case declensions and exact semantic relationships.

The educational sentences are **newly constructed**; none should be presented as sourced Abhinavagupta verses. Stronger editorial auditing, audio pronunciation checking and sourced grammar citations remain future work.

## Local-only scope

This is an **offline browser prototype**. No GitHub push, cloud deployment, ChatGPT plugin installation, remote course progress synchronisation, authenticated assessment, microphone/voice-recognition tests, or site integration was performed. The local progress mechanism is a self-reported heuristic and should not be represented as verified ability.
