<!-- vendored: source=/root/trika-x/MASTERPLAN-TECHNICAL-SPEC.md sha256=38c687cb69f8bd0cc67522056249640896f3aeacfdc0da4704e74167da16eaf2 fetched=2026-11-11
     edit the source, not this copy; regenerate with tools/emit_endgame_docs.py -->

# MASTERPLAN TECHNICAL SPEC — endgame build, ground up (2026-11-06)

**Canonical build spec.** Companion to the adversarial audit
(`/root/TECHNICAL-SPEC-2026-11-05.md` — reproduced breaks; this doc
builds forward) and to `MASTER-PLAN.md`/`OPERATIONS.md`/`NEXT-STEPS.md`.
Rule over everything: **every artifact derives from Sanskrit bytes, and
Lean is preserved** — every formal claim resolves to chunk + named
theorem + recorded run, or it is not cited anywhere downstream.

## 0. Grounding rule (non-negotiable)

`source bytes → edition record → witness status → layers → formal →
argument → essay → render → teach → practice`. Any link missing its
input fails closed (UNKNOWN, never assumed). Tiers T/R/E/C/H/X ride
every claim; R never promotes itself. Machine proposes, human disposes.
No auto-sign, auto-publish, auto-practice-authorization, ever.

## 1. Source + identity (openpatala backbone — LIVE on box)

- Tables: works (544) / editions (87) / etexts (87, file:// + sha) /
  passages (909, chunk locators + immutable_ids) / assertions (1532,
  incl. 1070 HAS_LAYER) / witnesses (0 — enforced empty).
- Ingest: `openpatala_ingest.py` (translation-work layout + `--file`
  Mode B for new works); seeds: availability 260 + 184 gold dossiers
  (events skipped — ID stubs, fabrication refused). All idempotent.
- Resolve: `bridge_resolve chunk:X [--db]` → work/edition/etext rows;
  snapshot path stays byte-authoritative; witnesses hard-UNPINNED.
- Access another box: R2 `openpatala/box-2026-11-06/` (dump+manifest,
  restore proven) or rebuild-from-repos (bridge README recipe).
- SOTA reuse: hxrmxs packet pattern (versioned info-packets + falsifiers
  → our claim tables + kill criteria); sanskritree Kāṇḍa layering
  (siddha/vidhi/asiddha → our T/R scoping).

## 2. Translation (translation-work lane; read-only + specs from here)

Stack T1→L0→argmap→L2→C1 per chunk (their crystal skill is law).
Joints this plan needs: chunk↔verse map (spec'd, their build),
`source_verses` fill (spec'd), layer-accept decisions at ingest
(checker ready), pair-structured emission T1↔L1 (F3 unblocked by it),
micro-intakes (sivasutras 14-line precedent filed). L0-as-terms pilot
(Sohoni/Huet-backed) derives Sanskrit-side formal content from the
morphology layer itself.

## 3. Formal (Lean 4.34.1, 107 theorems — preserved end to end)

Per chunk: prereg → model → must-fail twin (single-line diffs) →
EVIDENCE entry → TABLE reading → axiom audit (107 CLEAN, 77 zero-axiom)
→ runs receipt. Blind protocol (Upaya pilot SAME×5 + VOCAB-GAP recorded;
family-2 owed). Compression honesty (TK-R2 downgraded by correction
record; āvaraṇa order as first independent key; v9 embedding designed).
No theorem cited downstream without entry + run + tier note.

## 4. Argument (argmap nodes → cruxes; Nyāya-gate spirit)

Nodes index (2269) → crux queue (888 + lived tensions) → treeka
assembler (909 keyed, gaps drive queue) → pushing probes. SOTA reuse:
hxrmxs Nyāya gate (5 fallacies) as the adjudication pattern for
examinership; sanskritree BNF gate as claim-shape discipline; dpaul
kāraka roles as a candidate upgrade for argmap typing (study, not adopted).

## 5. Scholar hub (svread; Variety-1 closes here)

Draft (voice-recorded) → claims table → audit → PUSHBACK (live:
mock/go:/cf:, opt-in, verbatim shield, never edits) → human review →
sign-off (409 on edit) → bridge → release → DOI. Gaps: chunk↔verse
(spec'd), PUSHBACK-on-arrivals (CLI ready), Zenodo token (dry-run
builds), signoff-staleness propagation (spec'd, worker lane).

## 6. Books (bookfactory lanes; content sourcing law)

Frozen layers → TEXT (L3/L2, Deva transliterated at build) → CARD
(extract-and-place ONLY, fail-closed) → BOOK → TEXT-GATE (GATE.json
PASS per verse) → KDP preflight → paperback/postcard/social. Spec from
here: packs carry `evidence_refs` (work/locator/ledger-sha); lanes plug
in, never fork. First lane candidate: bhairavastava (reference work,
8 PASS / 2 BLOCKED — BLOCKED stays blocked).

## 7. Videos (videofactory lanes; sealed pipeline)

SOURCE → BLOCKS → DIRECTION → GLOSSARY → APPROVAL → AUDIO → ALIGN
(≥0.85) → HOLDS/VIDEO → VERIFY → SHIP → GOLDEN. Spec: render receipts
carry pack evidence_refs; art bank (trika-art-bank) proposes only.
SOTA reuse: hxrmxs signature-GLSL + timing arcs as the visual language
reference; HyperFrames only where the factory's sealed path can't go.

## 8. Teaching (syllabus compiler + study tracks)

Practice-unit/1 (source refs, no timings, R-gloss provenance, review
status) → syllabus steps (reviewer fills TODOs) → engine scores →
paths (three spines, no-DIY asserted) → day-gate → slang register
(pointers + per-session consent) → study tracks (mātṛkā cards ×50,
pratyāhāra sets, First-Steps shape, sandhi-through-sūtras pattern).
Eligibility (study/doable/requires-dīkṣā, A-APP1-consistent,
human-signed) gates every render; slang never replaces sources.

## 9. Practice + diary + teacher (the loop closes)

Day-gate truth (posting-day counts + tz-lock + repo-days, complementary)
→ journey (ledger spec owner-gated; day_gate.py compatible micro-impl)
→ diary (nibbanahelp entries/tensions, VOICE RULE absolute) → teacher
relay (retrieve-first, zero advice) → assessor (reads station/means/
conjuncts/grace pilots + compiler units; human disposes) → new questions
re-enter as cruxes. Tensions endgame: personal knots + scholar cruxes,
one shape (open → loosening → resolved-by-essay → video), status flips
human-only, resolved tensions kept as lineage.

## 10. Autonomy (what runs without humans)
Nightly verify (proposed cron, logs only); idempotent re-seeds; treeka
refresh; calibration reruns before any threshold change; PUSHBACK on new
drafts (mock now, live behind opt-in + quota); Mutate sweeps (transient
toolchain, disk-checked). Humans required: witness eyes, rulings
(P-TK1/ti-ca/rater-2/station), sign-offs, dīkṣā policy, tokens, owner
gates (ledger/trajectory/vis-mode/catalog/sit-player).

## 11. Acceptance (the slice that proves the machine)

ONE tension walked source→video with every link green: witness-grade (or
honestly CANDIDATE) source → gated layers → checked theorem → argued
node → queued crux → audited draft → PUSHBACK → signed essay → DOI →
pack with refs → sealed video → taught unit → diary echo → teacher read.
Plus endgame1 metrics adopted: 2× translation time, >95% span alignment,
<1% unsupported additions (proof gate measures two of three today).
Until the slice exists, display formal artifacts as research records only.

## 12. Hardened laws (from PR #4 follow-up merges, 2026-11-06)

1. **Pilot statistics are descriptive.** No HOLDS/NULL verdict language on
   small-n, single-diarist, machine-proposed data (T-C1 p-value labeled
   descriptive; independence never assumed). Prereg kill rules still decide
   next steps; the p-value doesn't.
2. **Study-only until a real review boundary exists.** Practice assembler,
   unit renderer, and study cards emit STUDY with `practice_authorized:
   false`; keyword `doable` labels and input status strings are provisional
   and never authorize. Spine stations UNMAPPED, prereq edges empty until
   verified prerequisites exist.
3. **Joins are work-scoped with reason codes.** Argmap nodes resolve only
   within their own work (EXACT_LOCATOR / LOCATOR_ONLY / FOREIGN_LOCATOR /
   AMBIGUOUS_RANGE / NO_COORDINATE …); reversed ranges and cross-work
   rescues fail instead of guessing; float coordinates (1.10→1.1) never
   match; every index records git rev + dirty flag + ledger/file SHAs.
4. **External text needs opt-in; checkouts are configurable.** Live model
   calls require `--allow-external-text` (regex redaction is incomplete);
   no hardcoded `/root/<repo>` paths — env overrides
   (`SVREAD_CHECKOUT`, `GO_BEAM_PATH`, `SATSANG_PRACTICE_CHECKOUT`,
   `NIBBANAHELP_CHECKOUT`, …) with same-box defaults. Tests use synthetic
   tmp fixtures, never real units.
5. **Export boundaries are fail-closed.** Tensions without an explicit
   header/body boundary are skipped (never parsed as headers — disclosure
   risk). Bodymap agreement checks candidate files, never source truth.
6. **Coverage counts honestly.** Treeka v2 reports exact registry
   references and keeps `formalized: null` for unknown; 45 listed ≠ 45
   formalized (7 direct). Essay joins scope to the correct work.
