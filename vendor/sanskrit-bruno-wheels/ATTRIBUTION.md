# Vendored: Sanskrit Bruno Wheels (curated teaching tier)

Source: `Sanskrit_Bruno_Wheels_Source.zip` (sha256
`e04b6d6c67916e23fe536b7d6d2c1fc6199daeba5b902fc1fdf60677ae52c049`),
imported 2026-11-11 from the `ayoutube` R2 bucket. MIT License — see
`LICENSE` in this directory (© 2026 Sanskrit Bruno Wheels project contributors).

Files here are **byte-identical to the upstream package**. Do not edit them;
all integration lives in svread-owned code (`wheels.html`, `wheels.js`,
`tools/emit_*.py`, `tests/`).

What svread uses from this package:
- `data.js` — curated stems/endings/words, owners/subjects/places/times/
  predicates/modes (the teaching tier: eka, tasyāḥ, five verbs, question modes).
- `engine.js` — pure constrained sentence generator (`sentence(state)` returns
  `{valid:false}` for illegal combinations — fail-closed at the engine level).

What svread does NOT take: the standalone `index.html`/`app.js` UI (svread
renders its own wheels page reusing the same geometry idea), the stock photos
of code. Grammar authority stays split honestly: curated forms here are
teaching entries; machine-verified forms live in `data/grammar/wheel-pack.json`
(Vidyut traces). `tools/check_curated.py` cross-checks the two every build and
`data/grammar/crosscheck.json` records agreement per form.
