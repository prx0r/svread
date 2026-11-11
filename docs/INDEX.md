# docs index — what to read, what is history (2026-11-11)

The repo root carries three years of plans from many sessions. This page says
which documents are **current**, which are **reference**, which are **history**
kept for provenance, and which are the **owner's verbatim words** (never edit).

Read in this order if you are new:

1. [`README.md`](../README.md) — what the site is, START HERE block.
2. [`PRODUCTION.md`](../PRODUCTION.md) — build / verify / deploy / ops manual.
3. [`MASTERPLAN3.md`](../MASTERPLAN3.md) — the operative plan (W1–W7, estate map).
4. [`PROGRESS-REPORT-2026-11-11.md`](../PROGRESS-REPORT-2026-11-11.md) — what is
   actually done against that plan, with the one BLOCKED stated plainly.
5. [`EXTERNAL-STRATEGY.md`](../EXTERNAL-STRATEGY.md) — the independent review's
   integration contract + M0–M6 roadmap (this is the standard we are held to).
6. [`MCP-INTEGRATION.md`](../MCP-INTEGRATION.md) + [`data/mcp-registry.json`](../data/mcp-registry.json)
   — the one MCP surface for ChatGPT.
7. [`BENCHMARK-PLAN.md`](../BENCHMARK-PLAN.md) — pre-registered
   MITRA-MT vs ours comparison (correction minutes, never BLEU).
8. [`HANDOFF-PR-REVIEW.md`](../HANDOFF-PR-REVIEW.md) — open PRs, merge order,
   review focus (for an outside reviewer, not a status doc).

---

## Canonical (maintain these; they describe the live system)

| Doc | What it is | Notes |
|---|---|---|
| `README.md` | entry point + START HERE | keep short; history below the fold |
| `PRODUCTION.md` | ops manual: state, build order, gates, defects, go-live | numbers dated; §0 carries the delta |
| `MASTERPLAN3.md` | operative plan: W1–W7, sequencing, risks | external agent co-edits |
| `PROGRESS-REPORT-2026-11-11.md` | status vs MASTERPLAN3 | supersede by a new dated report, don't edit |
| `PROGRESS.md` | wave-by-wave build reports | append-only |
| `SPEC.md` | reader UX spec (lanes, rails, chat) | source of truth for the reader |
| `READER-ARCHITECTURE.md` | data flow, release checks, source holds | gates + provenance rules |
| `VERIFY.md` | how an outsider verifies a claim | hashes, curl+sha256sum |
| `MCP-INTEGRATION.md` | MCP surface plan (bridge, sheaves, OAuth) | pairs with the registry JSON |
| `OPENPATALA-CONNECTION.md` | how svread ↔ openpatala connect; **how to add texts** | bibliography is a DB view |
| `AUTH-AND-PROGRESS.md` | identity decisions: Google = site account, ORCID = publishing | binding owner decision |
| `SCHOLAR-PRIVACY.md` | privacy contract for scholar data | hashed in the release manifest |
| `WHEEL-LEVELS.md` | Sanskrit wheel levels + curriculum mapping | pairs with `data/wheels/` |
| `SANSKRIT-MEMORY-ENGINE-THESIS.md` | owner's thesis (verbatim) | canonical for the wheels |
| `EXTERNAL-STRATEGY.md` | independent integration contract + roadmap | the review standard |
| `REVIEW-FINDINGS.md` | second-round review findings (verbatim) | actionable list, dated heads |
| `TESTING.md` | every suite + exact command | added 2026-11-11 |
| `BENCHMARK-PLAN.md` | pre-registered blind benchmark of translation candidates | acceptance fixed before data |
| `HANDOFF-PR-REVIEW.md` | external reviewer's map of open PRs | update when PRs close |
| `docs/BIBLIO-AUTHORITY-GAP.md` | upstream biblio gaps measured, PG18→PG15 blocker | evidence, not blame |
| `docs/INDEX.md` | this file | |

## Reference (read when relevant; not maintained as live truth)

| Doc | Use |
|---|---|
| `RESOURCES.md` | inventory of sources/tools consulted |
| `SCHOLAR-ENDGAME-SPEC.md` / `SCHOLAR-ENDGAME-VISION.md` | the scholar/essay endgame design |
| `SCHOLAR-WIRING-PLAN.md` / `SCHOLAR-RELEASE-MAP.md` | scholar build/launch history |
| `TENSIONS-LINGUA-SPEC.md` / `TENSIONS-ENDGAME.md` | crux/tension language design |
| `PUSHING-LAB.md` / `PUSHING-NEXT.md` / `PUSHING-RESEARCH.md` | Pushing Lab boundaries + tests |
| `CHANT-UPLOAD.md` | how chant audio reaches R2 |
| `LEAN-AND-SANSKRIT-SYNTHESIS.md` | Lean × Sanskrit brainstorm (design note) |
| `MCP-FEDERATION-REVIEW.md` | MCP federation audit (evidence, not policy) |
| `PLAN-VERIFIED-RUNTIME.md` | earlier runtime plan; superseded by MASTERPLAN3 |
| `CHATGPT-ENDGAME-PLAN.md` | earlier ChatGPT plan; superseded by MCP-INTEGRATION |

## History (kept for provenance; do not act on these)

`ENDGAME.md` · `ENDGAME-BUILD-PLAN.md` · `HANDOVER-SEO-2026-11-08.md` ·
`SEO-GEO-PLAN-2026-11-08.md` · `AGENT-HANDOFF.md` (the intake that seeded the
external review; it delivered) · `PLAN-VERIFIED-RUNTIME.md` ·
`CHATGPT-ENDGAME-PLAN.md` · `MCP-FEDERATION-REVIEW.md`

## Owner verbatim (never edit; quote in place)

- `chatgptendgame.md` — the endgame sketch, exactly as typed.
- `sanskritplugins.md` — the ecosystem audit, exactly as received.
- `SANSKRIT-MEMORY-ENGINE-THESIS.md` — the wheels thesis.
- The About page text lives in `tools/emit_about.py` (emitter-owned, verbatim).

---

## House rules that apply to every doc

- A number in prose must come from a file you can name (or a command in the
  doc). Stale numbers are defects.
- **BLOCKED ≠ PASS.** A blocked gate is stated as blocked, with the reason.
- Status words: `DERIVED` (machine trace), `CURATED` (teaching form, no trace),
  `AGREE`/`DISAGREE_STANDS`/`MACHINE_GAP` (crosscheck), `UNREVIEWED`.
- Never auto-publish, auto-sign, or auto-promote. Humans hold those.
- When a doc stops being true, add a status banner (see the historical docs)
  rather than deleting it — provenance is part of the product.
