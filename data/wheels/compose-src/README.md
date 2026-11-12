# Svatantrya Sanskrit · Five-Ring Generative Wheels (v2)

**15 wheel families × 4 progressively harder levels = 60 playable levels.** Every level contains **exactly five interactive rings**. One family represents one grammatical machine, and its numbered `n.1`→`n.2`→`n.3`→`n.4` levels add depth to the same machine. The goal is combinatorial mastery, **not** a dozen disconnected apps.

## Run

- Double-click **`standalone.html`**. The entire offline app is contained in this file.
- Or open `index.html` inside this folder for the modular source version; no build server is required.
- Use the 5 rings or dropdowns to change the generated Sanskrit. Hide/reveal IAST and English. In transformation `6.4` and compounds `15.4`, reveal the hidden target after answering.
- Self-rate **Got it** / **Needs practice**, or mark a combination **Explored** without grading yourself.
- **Today's focus** recommends one level. **Make today's focus** lets you pick any other. **Nearby wheels** provides easy detours. Nobody is hard-blocked from exploring.
- Progress and daily focus are saved in this **browser only** (localStorage). Export uses a JSON download. **There is no account sync or automatic import.**

## The 15 families

| Family | The grammatical machine it trains |
|---|---|
| **1. Conversation** | Question → answer → recursive follow-up |
| **2. Expression** | Subject → thought/like/want → proposition → because → explanation |
| **3. Action** | Who → verb → object → place → time |
| **4. Description** | Demonstrative → noun → quality → degree → comparison/possession |
| **5. Logic** | If/claim → condition → consequence → objection/reply |
| **6. Transformation** | Same sentence → change person, polarity, number or tense |
| **7. KA–TA–YA** | Question/demonstrative/relative → place/time/source/manner patterns |
| **8. Case Relations** | Giver → receiver → object; instrument/locative/ablative |
| **9. Number & Agreement** | Rotate numeral → noun gender → noun number → verb number |
| **10. Commands** | Addressee → imperative verb → object → context → tone |
| **11. Action Sequences** | Same agent → first action (-tvā) → second action → context |
| **12. Relative–Correlative** | yadā/tadā, yatra/tatra, yathā/tathā matched clauses |
| **13. Causatives** | X does Y → Z causes X to do Y |
| **14. Quotation & iti** | Quote → speaker → says/thinks/asks → response |
| **15. Compounds** | First member → second member → case → join/split → meaning |

These are **families**, not levels in mandatory family-number order. The recommended learning order deliberately **interleaves families** to teach prerequisites before advanced variations.

## Curriculum and agent handoff

- **`docs/STUDY_ORDER.md`**: full **1–60 lesson sequence** with rationales, prerequisites and help-wheel links.
- **`docs/CODING_AGENT_DIRECTIVE.md`**: exact handoff, integration rules, tests, and progress/migration contract.
- **`docs/PROGRESS_AND_MASTERY.md`**: daily focus logic; ready-to-level-up vs spaced mastery; grading cautions.
- **`docs/CURRICULUM_MAP.json`**: machine-readable ordered lesson IDs, dependencies and neighbor suggestions.
- **`docs/EXTENDING.md`**: add `2.5`, `7.5`, or an entirely new family without touching existing lessons.
- **`docs/REVIEW_NOTES.md`**: what passed and what still needs expert review.

## File layout

```text
sanskrit_wheels/
├── standalone.html
├── index.html
├── styles.css
├── src/
│   ├── core.js                 # Five-ring rules; dependent choices
│   ├── curriculum.js           # Pedagogical order, prerequisites, focus/mastery
│   ├── shared.js               # Shared curated paradigm data
│   ├── ui.js                   # One UI for all families and all levels
│   └── families/
│       ├── 01-conversation.js
│       ├── 02-expression.js
│       ├── ...
│       └── 15-compounds.js
├── docs/
├── tests/
└── tools/build_standalone.py
```

## Tests

```sh
node tests/exhaustive.test.js
python tools/build_standalone.py
python tests/browser_smoke.py     # optional; requires Playwright + Chromium
```

Tested: **15 families, 60 levels, 9,507 selectable state combinations**, and a browser smoke pass on desktop + 390-pixel mobile. Generation coverage means the code outputs complete text for each valid selection, **not that all Sanskrit has been reviewed by a philologist**. This is an offline prototype, not a deployed site, ChatGPT plugin, or reliable automatic pronunciation assessment. See review notes.
