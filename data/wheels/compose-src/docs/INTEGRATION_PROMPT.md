# Implementation brief for the existing Svatantrya Sanskrit Wheel

Integrate the *functionality* of the attached `sanskrit_wheels` app into the existing Svatantrya Sanskrit tutor / ChatGPT plugin. **Do not rebuild, replace, or fork the existing website, its routes, design tokens or learning-progress infrastructure.**

## User intent

Six **families** of five-layer grammatical wheels. Each family is an exercise type, not an isolated tool per subtopic. Lessons grow inside each family using `1.1`, `1.2`, `1.3`, `1.4`, and future `1.5`; `2.1`–`2.4` etc. The family `2 Expression` is the canonical example: simple opinions, likes, `I think X because Y`, and interest-specific elaborations are *progression levels of the same wheel*. There is one shared UI and one shared grammar-aware engine.

## What to preserve

- `src/core.js`: registration, normalisation of five options, dependent choices, deterministic generation, exhaustive enumeration.
- `src/families/*.js`: six data modules with four progressively harder levels each. Port them as content data/functions into the existing site's code style.
- Five working radial rings (not merely decorative circles), with simultaneous selectable options, and a clear IAST/English reveal.
- Audio/voice can use the generated `dev`, `roman`, `en`, `role` per line, but never fabricate speech-quality scores.
- A lesson gate can unlock `n.2` when `n.1` is actually mastered, not just when it is visited.

## Quality gates

- Exhaustive tests on all legal paths, along with manually reviewed Sanskrit for newly added rules.
- Respectful masculine/feminine `bhavān/bhavatī` + third-person verbs; `tvaṃ` + second-person forms.
- Gender-aware nominal agreement; case-based verb frames; written Devanāgari + IAST + English alignment.
- Do not introduce unverified Sanskrit into public exercises, and do not present pedagogic philosophy sentences as classical quotations.
- Track attempted/succeeded/review-due data per authenticated learner only when the existing site's authorised data path actually exists.

## Future levels

To add, say, `2.5 Comparisons of interests`, append one reviewed level with exactly five rings in family 2, no new application. Add test assertions for that level. Keep wheel state shareable: `{family:'expression', level:'2.5', selection:{...}}`.

## Scope

This ZIP is a tested standalone demonstration and source package, **not** proof of live integration, deployed APIs, per-account persistence, or a connected plugin.
