# Svatantrya · Generative Sanskrit Wheels

A standalone offline five-ring Sanskrit practice app, organised as **6 wheel families × 4 progressively more demanding levels** = 24 working lessons.

The underlying idea is deliberately simple: **one wheel family represents one reusable grammatical operation**. Its variants are levels (`2.1`, `2.2`, `2.3`, `2.4`), *not* separate apps. For example, Expression is the one `I think / like X because Y` wheel: level 2.1 makes simple judgements, 2.2 adds preferences, 2.3 adds explanations, and 2.4 adds interests and follow-ups.

## Start

- **Easiest:** open `standalone.html` in a browser. This is one self-contained file.
- **Modular source:** open `index.html` from its folder. JS is split by families, but deliberately uses ordinary scripts, not ES modules, so no build step or server is necessary.
- Tap any segment on any ring, or use the five selectors below the wheel.
- `Spin all five` randomises all selections while preserving option constraints.
- `Reveal IAST` and `Reveal English` show the translations separately. `6.4` additionally hides the transformation target.
- `Mark practised` remembers a specific combination in **this browser only**, and `Export practice` saves it as JSON. There is no account sync or voice recognition yet.

## Families and progression

| Family | 1 | 2 | 3 | 4 |
|---|---|---|---|---|
| **1 Conversation** | 1.1 name, age, wellbeing | 1.2 home, study, destination | 1.3 contextual follow-ups | 1.4 interests + because |
| **2 Expression** | 2.1 I think X is Y | 2.2 I like X | 2.3 I think X because Y | 2.4 interests + explanation + question |
| **3 Action** | 3.1 who does what | 3.2 where | 3.3 want/can + infinitive | 3.4 past/present/future sequences |
| **4 Description** | 4.1 neuter nouns | 4.2 gender agreement | 4.3 comparative forms | 4.4 possession + location |
| **5 Logic** | 5.1 if/then | 5.2 cause/contrast | 5.3 claim/objection/reply | 5.4 Trika-themed discussion |
| **6 Transformation** | 6.1 person/negative/question | 6.2 tense | 6.3 singular/plural | 6.4 transform base → target |

**All 24 levels have exactly five active rings.** Later levels increase complexity *within* a family. They may introduce alternative ring functions while preserving the same five-ring interaction and progression.

## Project map

```text
sanskrit_wheels/
├── index.html                  Modular browser entrypoint
├── standalone.html             Generated single-file entrypoint
├── styles.css                  Theme and responsive layout
├── src/
│   ├── core.js                 Register, resolve, generate, enumerate states
│   ├── shared.js               Curated paradigms and shared word banks
│   ├── ui.js                   Clickable SVG rings, reveals, practice log
│   └── families/
│       ├── 01-conversation.js  Family 1, versions 1.1-1.4
│       ├── 02-expression.js    Family 2, versions 2.1-2.4
│       ├── 03-action.js        Family 3, versions 3.1-3.4
│       ├── 04-description.js   Family 4, versions 4.1-4.4
│       ├── 05-logic.js         Family 5, versions 5.1-5.4
│       └── 06-transformation.js Family 6, versions 6.1-6.4
├── docs/
│   ├── EXTENDING.md           Add 2.5 or a new family without touching core
│   ├── INTEGRATION_PROMPT.md  Existing Svatantrya project integration brief
│   └── REVIEW_NOTES.md       Tested scope and known limitations
├── tests/
│   ├── exhaustive.test.js     All selectable combination paths
│   └── browser_smoke.py       Optional Playwright smoke test
└── tools/
    └── build_standalone.py    Rebuild standalone.html from source files
```

## Tests

```sh
node tests/exhaustive.test.js
python tools/build_standalone.py
python tests/browser_smoke.py  # optional; needs Playwright + Chromium
```

The exhaustive test enumerates **4,755 selection states** across 24 levels. It checks that all five ring choices resolve and produce complete Sanskrit, IAST and English fields, and verifies a set of specific agreement, numeral and tense cases. This is **not** a comprehensive Sanskrit grammar certification. See `docs/REVIEW_NOTES.md`.

## Expansion principle

Do not fork an entire UI for each drill. Add `2.5` as a new entry inside `src/families/02-expression.js` with exactly five ring definitions and one deterministic `build()` function. Different options can depend on earlier rings (e.g. `go` uses destinations while `read` uses direct objects). The engine resolves those dependencies and resets illegal old choices.

For the existing Svatantrya site, port the engine and data to its component system instead of replacing its current design. No GitHub changes, remote deployment, MCP registration or ChatGPT plugin connection was performed here.
