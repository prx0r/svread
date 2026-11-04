# ENDGAME folder — the endgame, high level (agent entry point)

This folder is the **collated high-level reading set** for any agent picking up
the endgame: the vision docs, the two verification/identity systems' overviews,
and pointers to everything live. Read this file first, then zoom as needed.
Nothing in this folder executes anything — the operational contracts live one
level up (listed at the bottom).

## The summit, one sentence

A hard question about a Trika text walks **down to a manuscript witness** and
back **up to a signed, DOI'd essay** — every link hash-pinned, decision-tracked,
gate-checked. The Svatantrya agent proposes (drafts, essays, videos, cruxes);
gates and audits verify; the owner is the root signature. Commodity generation,
scarce provenance.

## The four systems and their roles

| System | Role | This folder's docs |
|---|---|---|
| **sanskritbench** | **VERIFY** — gold sets, deterministic proof gate, COMET-vs-chrF meta-eval (Kendall's tau), content-addressed experiment records, lemma spine (Vidyut + ByT5 → school/period sense) | `sanskritbench/VISION.md` (north star) · `GOALS.md` (checkable build path) · `HOW-IT-WORKS.md` (skills/goals/kanban-gate mechanics) |
| **openpatala** | **IDENTITY** — the witness root: Work→Edition→Witness→Surrogate→EText ladder, 1,099 works, 11 adapters, Merkle event ledger, R0–R5 resolver. Answers "which edition is this passage from?" | `openpatala/README.md` (what it is) · `MASTER.md` (file map) |
| **translation-work + Scholar stack** | **EVIDENCE + AUTHORITY** — chunk ledgers, layered texts (T1→L4) with gates/proofs, ARGMAP arguments, Scholar workspace: drafts, decisions, review, signoff with rights → bridge → git → release → permissions | live docs below (not copied here — they change) |
| **The estate** | **RAW MATERIAL** — the owner's essays (awesome-essays 90-categorized), research-library, essay kits (STRUCTURE/ACQUIRE/WEAVE/PUSHBACK), pushing cruxes, slang editions | see `../RESOURCES.md` §A |

## Reading order (high level, ~15 minutes)

1. **`vision/CORE-BIBLE.md`** — one vision in 6 zoomable layers; the derivation
   graph (SOURCE → L0 → L200 AUDIT → ARGUMENT → ESSAY → MEDIA) is literally
   translation-work's directory tree.
2. **`vision/INDEX.md`** — the map of all 50 vision docs (categories A–H,
   canonical vs aspirational tags). Don't read them all; use this as the index.
3. **`vision/endgame2.md`** — the destination reframe (Tantra Hub: living
   bibliography + reader + workshop + commentary + media).
4. **`vision/vision-07-new-scholar.md`** — *essay is one output of the research
   graph, not the research object* — the frame our tensions→essays loop runs on.
5. **`vision/vision-06-adversarial-review.md`** — the "research compiler"
   (ERROR/WARNING/INFO criticism) — our `audit_draft` receipts are its build.
6. **`vision/essayguide.md`** — the Essay research program: six hard problems
   (thesis selection, argument graph, literature positioning, …) — the spec
   for the essay copilot's remaining stages.
7. **`vision/REVIEW-2026-11-05-live-stack.md`** — honest review of the vision
   docs vs what actually shipped; what to adopt, what to skip.
8. **`sanskritbench/` + `openpatala/`** — the VERIFY and IDENTITY systems in
   their own words.

## The invariant (never violate)

No rung of the stack ships until it carries **hash + decision/grounds + gate +
signer-role**. Higher rungs may not be built on unsigned lower rungs. The plan
that enforces this ordering is `../ENDGAME-BUILD-PLAN.md` (Phase 0 foundation
integrity → Phase 1 verification → Phase 2 loop closure → Phase 3 autonomy).

## Live / operational docs (one level up — always read the live copy)

- `../ENDGAME.md` — the shape, the seven output varieties, use/skip list.
- `../ENDGAME-BUILD-PLAN.md` — **the granular dev plan; tomorrow's first move
  is sanskritbench Phase 1 (tau table).**
- `../RESOURCES.md` — complete inventory (everything on the box + R2 mirrors).
- `../SCHOLAR-ENDGAME-SPEC.md` — operational contract (lifecycle, gates, runbook).
- `../SCHOLAR-ENDGAME-VISION.md` — owner's words, verbatim, plus session log.
- `../mcp/REDTEAM-2026-11-04.md` — the 51-test red-team record.

## Provenance of this folder

Copied byte-identical from their sources on 2026-11-05:
`patalacheckpoints/docs/{vision/*,endgame2.md}`, `openpatala/{README,MASTER}.md`,
`sanskritbench/{VISION,GOALS,HOW-IT-WORKS}.md`. Sources stay authoritative; if a
source doc is updated, re-copy (this folder is a snapshot for agents).
