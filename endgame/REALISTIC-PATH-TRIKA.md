# REALISTIC PATH — Trika only, buildable now, no training

**Date:** 2026-11-06. **Constraints (owner-set):** Trika materials only.
No model training of any kind (rules, `decide`, retrieval over existing
embeddings, and human judgment only). Every stage shippable on its own;
each states its exit gate. This doc reconciles: ENDGAME.md + BUILD-PLAN
(master sequence), TEACHER-ENDGAME spec (stages 0–5), RECONCILIATION-HXRMXS
(adopt/adapt/keep-separate), trika-x arm A–D state, both publishing
factories' actual gates.

## 0 · The logical flow (one diagram)

```
GOLD (translation-work, Trika works, gated T1/L0/argmap/L2)
  │  chunk ids (passages.jsonl locators)
  ▼
FORMAL (trika-x Lean: MALA/PRAMATR/KANCUKA/RECOGNITION + arm-B Grace/Upaya/Corr)
  │  EVIDENCE.json pins every theorem to chunk ids (74+2, checker-enforced)
  ▼
ARGUE (crux per unresolved node; Treeka gap report w/ formal column)
  │  essay-claim/1 + audit_draft + PUSHBACK (+ formal issues)
  ▼
TEACH (nibbanahelp relay + decode readout + gated practice units)
  │  packs with tension:*/chunk:*/formal:* refs
  ▼
PUBLISH (bookfactory lanes → KDP/Etsy/site · videofactory lanes → watch)
  │  packs + sealed outputs + receipts
  ▼
DEMAND (N1 sessions→queue miner → next crux; journey ledger later)
```

Nothing trains. Nothing auto-signs. Every arrow is either built or a named
small script below. The formal core is the root of the argument tree;
openpatala is the root of identity; both resolve per claim.

## 1 · What's already true (no work, just record it)

- Lean core green: control (incl. AnswerKey) + recognition 18/18,
  test_tools 4/4, vocab/table freshness checks, tc1 pilot holds (p=0.046).
  PR #1 merged; PR #2 open with arm C (AnswerKey, blind rig, TABLE,
  runs ledger, method essay, rater-2 sheet); arm D evidence chain on a
  branch (EVIDENCE.json 74+2, checker green, 15% gold coverage + gap list).
- Nibbanahelp: relay (never advises, trika tier live), 144 decoded moments
  committed, strict diary gates, /mobile, teacher spec + journey-ledger spec written.
- Practice: syllabus compiler spec'd (C1 VBT pilot module imported),
  deitybody units + audio exist, sit player ships, VBT-spacious runs.
- Publishing: bookfactory (fail-closed check.py, quote loop drafts, 2 prayer-book parity lanes) and videofactory (layer stack + BARS + approvals) both real, both gated, both awaiting Trika lanes.

## 2 · Stages (in order; later stages never block earlier ones)

### Stage 1 — Merge + ratify (1 review session + 1 human pass)
1. **Merge PR #2** (lead-agent review). Unblocks everything referencing arm C.
2. **Rater-2 pass** on UPAYA-Criteria (T-C2 sheet ready; ~30 min human work).
   Closes the last UNRESOLVED pilot → upaya advice becomes usable.
3. **Merge arm-D branch** after #2 (evidence chain + TEACHER-INTERFACE).
*Exit:* main green, all pilots scored except week-2-dependent ones. *Cost:* review time only.

### Stage 2 — Coverage instruments (2 small scripts, no new theory)
4. **Treeka formal column** (`treeka_formal.py` in trika-x/tools): reads
   EVIDENCE.json + translation-work ledgers → per-passage
   `formalized / armed / unarmed` + gap report (unargued passages,
   cruxless arguments, essayless cruxes). The prioritization instrument
   for everything downstream. *Exit:* `python3 tools/treeka_formal.py`
   prints the gap list; CI runs it read-only.
5. **Chunk↔openpatala bridge** (master-sequence step 1): one mapping file
   (86 ledgers → Work/Witness IDs) + read-only adapter. Makes every
   EVIDENCE chunk id witness-grade. *Exit:* `lingua resolve chunk:tsa08-p03`
   chains to a witness. Small, mechanical, unblocks Treeka's root.
*Cost:* ~2 focused sessions. *No training, no new models.*

### Stage 3 — Argue (wire existing pieces, don't build new ones)
6. **Essay pipeline FORMALIZATION class**: essay claims gain `formal_status`
   (which premises are Lean-checked); PUSHBACK gains the three formal
   issues (scope overreach, content-boundary crossing, R-as-T). This is
   the review-compiler v2, minus Bayesian parts (deliberately rejected).
7. **Crux queue from gaps**: Treeka gap report + pushing catalog → ranked
   queue (RIVAL-open + formalizable first). Manual ranking initially;
   no scorer to calibrate.
*Exit:* one crux walked end-to-end (chunk → formal → argument → essay
draft with audit receipt). *Cost:* wiring + one worked example.

### Stage 4 — Teach v0, text only (nibbanahelp lane)
8. **Read-your-week**: relay + decode readout + `?`-as-questions, per the
   teacher spec Stage 0. Uses committed decodes; new weeks decode as they
   land (owner adjudicates `?`s — that IS the training signal, and it's
   human, not gradient).
9. **Practice units**: syllabus C1 (VBT 65 dhāraṇās mapped) → deitybody
   slots → sit player. Config assembly, not new code (compiler + units +
   player all ship). Eligibility gate stays human-review.
*Exit:* a diarist completes one gated unit from a decode reading.
*Cost:* assembly + testing. Voice explicitly later (Qwen browser e2e gap).

### Stage 5 — Publish Trika lanes (factory lanes, not factory builds)
10. **Bookfactory lane**: VBT cards / stotra anthology. Requires GOLD +
    GATE.json PASS on the texts (translation-work lane; coordinate, don't
    write). Quote-loop first (postcards/social), paperback after preflight.
11. **Videofactory lane**: slang chapters → storyboards → approvals →
    renders. Requires pack `formal:*` refs resolving (Stage 3 output).
*Exit:* one Trika product shipped per factory with full receipts.
*Cost:* lane configs + approvals (human). No factory code changes expected.

### Stage 6 — Demand loop (1 read-only script)
12. **N1 sessions→queue miner**: parse sessions/*.json, mine recurring
    unresolved questions + repeated relay ids → Treeka gap report.
    Read-only; never generates advice. Closes the loop: what people
    actually ask decides what gets explained next.
*Exit:* first mined queue feeding a crux. *Cost:* one script.

## 3 · Explicitly out (parked, with reasons)

- **Any model training** (incl. UNO weight retraining): needs the
  trajectory-endgame go-ahead + week-2+ decodes as supervision. Real, but
  later — and the path above never needs it.
- **Bayesian posteriors, reputation tiers, organism building**: different
  legitimacy theories (see RECONCILIATION-HXRMXS §4). Not in this path.
- **Voice**: Qwen browser session unverified end-to-end (text carries the
  whole path; voice is a later mouth, not a missing root).
- **Journeys ledger / Zenodo DOI**: owner-gated / token-pending; the audit
  receipts already pin everything they would pin.
- **Non-Trika materials**: Buddhist corpora stay method-reference only;
  quantum/AI/consciousness-science crossover stays out until the Trika
  loop is closed (opportunity-cost rule).

## 4 · Master order of work (the next 6 moves)

1. Merge PR #2 → 2. rater-2 pass → 3. Treeka formal column → 4. chunk bridge → 5. one crux end-to-end → 6. teacher v0 readout. Practice/publish/demand follow in lane order; nothing downstream blocks anything upstream.
