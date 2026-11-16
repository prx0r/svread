# Svatantrya Simple Sentence Wheel — complete ChatGPT teaching pack

**सरलवाक्यचक्रम् | Ashram Core 20 | v1.0 | 2026-11-16**

This archive is a **standalone prompt-driven Sanskrit lesson system**, not a deployed website or a ChatGPT plugin. Its core artifact is `MASTER_CHATGPT_PROMPT.md`, which is intended to be pasted whole into a fresh ChatGPT chat. If uploading the ZIP files into ChatGPT, add `QUICK_START_PROMPT.md` and the data/exercise files; the master prompt already contains essential vocabulary and verb paradigms and can operate alone.

## Contents

- `MASTER_CHATGPT_PROMPT.md` — the full, self-contained reusable teacher prompt: five dependent rings, all 20 words, all 10 roots with 1st/2nd/3rd singular across three tenses, skill levels, diagnostic gates, case/question operators, correction algorithm and inline reference items.
- `QUICK_START_PROMPT.md` — short launcher for a chat where the supporting files are uploaded.
- `data/lexicon_20.json` and `.csv` — twenty words, grammatical gender, common case forms, lexical categories.
- `data/roots_10_three_tenses.json` and `.csv` — ten roots, 90 singular conjugated forms, valency constraints.
- `data/operators_time_place_questions.json` — operator bank for time, place and questions.
- `data/wheel_contract.json` — machine-readable five-ring dependency rules and level progression.
- `data/PROGRESS_TEMPLATE.json` — optional portable practice checkpoint, not account/server sync.
- `exercises/full_practice_bank.json` / `.csv` — 323 reusable diagnostic, transformation, question and composition cards, with private answer keys.
- `exercises/preliminaries_and_gates.json` — 96 dedicated preliminary cards.
- `docs/WHEEL_SPEC_AND_GATES.md` — learner states, progression, validity constraints, review and expansion strategy.
- `docs/GRAMMAR_QA_AND_SOURCES.md` — irregular grammar corrections, modern vocabulary, citations and review caveats.
- `tests/canonical_fixtures.json` — sample five-ring combinatorial outputs with known keys.
- `tests/negative_constraint_fixtures.json` — deliberately invalid combinations the tutor must refuse rather than concatenate.
- `tests/validate_pack.py` — offline standard-library pack validator.
- `examples/SAMPLE_TUTOR_SESSION.md` — expected tutoring rhythm.

## How to start

1. Open `MASTER_CHATGPT_PROMPT.md`, select all, paste into a **new ChatGPT conversation**.
2. ChatGPT should ask exactly **“Preliminaries 0.1 — Write in Sanskrit: Teacher.”**
3. Reply in Devanagari or plausible transliteration. The tutor should correct and immediately ask the next exercise.
4. Say “checkpoint” when you want a portable progress JSON, and paste it into a later chat with the master prompt.
5. For advanced work, optionally attach full practice JSON. The answer keys should remain tutor-facing.

## Design principles

- Same old Svatantrya format: `Wheel × Level × Pack × Five dependent rings × Learner state`.
- The **pack provides vocabulary**, the **wheel provides grammar**, the **level defines complexity**.
- Avoid blind Cartesian products. Not every root takes every object or grammatical relation.
- For voice: one prompt, wait, no premature reveal, keep pronunciation feedback grounded.
- Not copied from copyrighted textbooks; original learning examples.
- Tests are local self-consistency checks, **not** formal proof of complete Sanskrit correctness. External source-level review required before public release.

## Study expansion

Core: 20 words, 10 roots, three simple tense systems, singular persons, restricted case roles. A future 2.x wheel may add dual/plural, polite address, active/passive and case paradigms. The original controlled pack intentionally stays compact.
