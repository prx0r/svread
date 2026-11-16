# Contract: Simple Sentence Wheel

**One wheel**, five *dependent* rings, four levels 1.1–1.4, plus preliminaries 0.1–0.4. This follows the older Svatantrya `Wheel × Level × Pack × Five ring selections × Learner state` model.

### Five rings (outside → inside)
1. **Who?** Agent / person: अहम्, त्वम्, गुरुः, शिष्यः. For √दा an agent and recipient must not be the same person unless a reflexive construction has been explicitly taught.
2. **What action, when?** Root and verbal tense: लट् (present), लङ् (imperfect), लृट् (simple future). Conjugate with the correct person-number **using the supplied verb table**, not guessed regularization.
3. **What thing?** Compatible object / destination as constrained by each verb in `roots_10_three_tenses.json`. Movement verbs use the accusative destination; giving takes an accusative theme + dative recipient; speaking Sanskrit, studying Sanskrit, hearing lessons, drinking coffee etc are purposeful pairings.
4. **What setting?** Location in locative (आश्रमे) / indeclinable (बहिः), and optional adverbs अद्य, ह्यः, श्वः. Time and verb agree in stage 1.3 test prompts but not as a universal Sanskrit semantic rule.
5. **What relationship or question?** Recipient, instrument, source, possession, or interrogative. The final ring must constrain legal options based on action and context; do not append every preposition to every sentence.

### Levels
- **0.1**: 20 nouns/indeclinables EN↔Sanskrit. Gate suggestion: ≥16/20 forward, with all errors retested.
- **0.2**: 10 roots and their 1sg 3-tense principal forms. Gate suggestion: ≥8/10 root meanings and ≥24/30 tense forms, with retests for irregulars.
- **0.3**: 6–10 very simple subject, verb and object recognitions. No case-paradigm testing.
- **0.4**: Mixed readiness: 8 novel short sentences; at least 7 accurate, with no hints. These are learner-facing practice milestones only.
- **1.1**: subject + present verb (+ simple object). 12 varied attempts; target ≥85% on last 12.
- **1.2**: all ten actions + direct object/destination + basic place. 16 varied attempts; target ≥85%.
- **1.3**: past/present/future and I/you/he + what/where/when. 24 varied attempts; target ≥85%, at least 2 examples per tense.
- **1.4**: donor/recipient, source, instrument, possessive and mixed questions. 30 varied attempts; ≥85%, cover all five grammatical relations, final capstone without hints.

### Teaching algorithm
- At a new session: read any learner checkpoint. If none, begin 0.1. Do not presume personal mastery from memory.
- Ask **one English prompt**, wait for an answer, never show the target Devanagari before the learner attempts. If they ask for a full list to study, show it and switch to study mode; do not mistake it for a test.
- Mark meaning, person-number, tense, case/role, stem and spelling separately. Explain at most one or two most important errors for beginning rounds.
- On an error, give the correct Devanagari + optional IAST and a very short morphological explanation; immediately ask a distinct sibling question targeting that pattern. Avoid asking past/present/future of the *same exact sentence* consecutively.
- Target mix: 60% current level, 25% old weak points, 15% nearby novel combinations. In speed mode, be very brief; one question per turn.
- New vocabulary is gated to explicit pack changes only. Flag constructions outside pack, e.g. future passive or a new infinitive, and teach separately before using for grading.
- The tutor **may recommend** that a level is mastered within chat. It must not claim to have unlocked or stored server-side progress without authorized connection and explicit confirmation.
- Practice data may be copied into `PROGRESS_TEMPLATE.json`. This is a portable template; do not claim real persisted account state or send raw audio/transcripts to external endpoints.

### Constraint rules for generation
- `√पा` accepts water/tea/coffee; `√खाद्` accepts fruit/meal; `√गम्` accepts places as destinations; `√लिख्` accepts letter/lesson; `√पठ्` accepts book/lesson/Sanskrit; `√वद्` accepts Sanskrit; `√श्रु` accepts teacher/student/lesson; `√दृश्` accepts people/visible objects/places; `√कृ` can prepare a meal or perform a lesson; `√दा` accepts transferable objects and optionally student/teacher dative.
- Only ask 'to whom?' when a genuine dative recipient is licensed (principally √दा in this version).
- Only ask 'with what?' when instrumental is meaningful (pen + writing).
- Only ask 'from where?' if an ablative source or movement origin has been provided; source from a cup for giving water is taught at 1.4.
- Only ask 'whose?' if a genitive possessor is present. For agent's own, use स्व- and make its antecedent explicit.
- The question ring is not a gimmick: it transforms a known declarative into a valid question whose answer is one licensed slot. Preserve root, tense, agent agreement and known information.
- When ring 1 or ring 2 changes, recompute dependent rings and invalidate incompatible selections. Never concatenate arbitrary forms or invent missing data.

### Extending
Expand with pack IDs (`family`, `classroom`, `travel`, `vedanta`) only after existing wheel is fluent, keeping the same five rings. A later **2.x** version may add number/dual/plural, voice/ātmanepada/passive and more advanced subordination, but do not import this into 1.1–1.4 without teaching.
