# LEAD AGENT BRIEF — build the full endgame. Implementations, not specs.

**Date:** 2026-11-06. **For:** the lead agent (Codex lane + any successor).
**Rule of this brief (owner-ordered): worked examples and implementations,
not more specs.** Every section names exact files to read, exact commands
to run, and the pattern to extend. Where a spec is the deliverable, it is
listed as unbuilt — do not re-spec what exists; implement the next rung.
**Machine proposes, human disposes. Nothing here is built unless the runs
ledger says so.**

Read order: §0 → §1 → your lane (§2–§5 pick one) → §6 flaws → §7 build order.
Verify every claim below by running the cited command; trust no summary,
including this one.

## 0 · The mission in one page

A scholar asks a hard Trika question. The system retrieves witness-pinned
passages, drafts in the scholar's voice with every claim traceable, tries
to break the draft, refuses anything unverifiable, the human signs, and the
answer ships as essay / video / spoken session / syllabus unit — each link
hash-pinned. Coda (from the magnum opus transmission that governs this
whole estate): *do not give the next agent the style — give it the
accumulated critic.*

State today: formal core green (Lean 18/18 + evidence chain + Treeka
column + openpatala bridge mapped, witness IDs pending); abhidhamma
linter + 144 decoded diary moments (machine-proposed, owner-unreviewed);
nibbanahelp relay + strict diary gates + teacher spec (stages 0–5);
publishing factories live but awaiting Trika lanes. What's missing is
volume: more gold, more decodes, more cruxes walked, more lanes.

## 1 · Is the Lean system finished? (asked and answered)

There is no single Lean system. There are three:

1. **Thon Ly's formal-abhidhamma** (`trika-x/repos/formal-abhidhamma/`):
   MATURE, not finished. Arm A done (89/121 cittas from general rules,
   6/6 breaks fail, DOI + OTS timestamps), extensive run history with
   honestly recorded FAILs and confounded controls. Ongoing research program.
   USE AS: the method template (prereg → controls → mutants → verdicts) and
   the abhidhamma reference tables. Do NOT re-derive it; cite it.
2. **Our formal-trika** (`trika-x/formal-trika/`): GREEN, early. Control
   (mala/pramātṛ/kañcuka/σ-flip) + arm A recognition rungs (Transitions,
   NonEntail, Conjuncts, Memory, Tractatus, Coords) + arm B (KancukaCorr,
   Grace, Upaya + 3 must-fail mutants, 18/18) + AnswerKey, vocab extractor,
   blind protocol, TABLE.md (76 theorems, staleness-checked), runs ledger,
   METHOD essay, T-C1/T-C3/T-C4 pilots holding, T-C2 awaiting rater-2.
   VERIFY: `export PATH="$HOME/.elan/bin:$PATH" && cd formal-trika/control && bash run.sh` (expect all PASS incl. `pairings_distinct` must-fail) and `cd ../recognition && LEAN=... bash run.sh` (expect `== 18 passed, 0 failed`).
3. **patalacheckpoints: no Lean system.** Grep it: zero `.lean` files.
   Its Sanskrit pipeline is DeepSeek-based, its verification is the
   anti-theatre doctrine (below), not proof assistants. Do not look for
   Lean there; look there for everything else (§5).

Verdict: no Lean system is "finished" — Thon's is the most complete in
existence for its domain and still open; ours is green at small scope and
must grow rung by rung. Finished was never the goal; checked-at-every-step is.

## 2 · Source ground (read this before touching anything)

### 2.1 translation-work — the gold (READ-ONLY for you; owned by other agents)
- Layout: `translation-work/<work>/` with `T1 (immutable Sanskrit close) →
  L0 (morphology) → ARGMAP (question/premises/inference) → L2 (book prose)
  → L200/C1 → GATE.json + proofs`. Law: **T1 never edited; BLOCKED = no
  English, ever; machine proposes, human disposes.**
- Trika gold that matters: `tantrasara-a07` (tattva ladder, 36),
  `tantrasara-a08` (kañcuka doctrine: v17 five followers, v35 śaktipāta,
  p03 grace→ladder + "knowing partially, clinging, I do"),
  `paramarthasara` (saptadhā-pramātṛ scheme), `phrdaya` (mala adjudication,
  phr-p04), `vbt` (112 dhāraṇās = the means catalog),
  `bhairavastava` (stavana register + Dyczkowski lecture notes),
  `spanda` (pulse/recognition-adjacent).
- Chunk IDs: `passages.jsonl` per work (`locator` like `tsa08-p03` +
  `immutable_id pt:pid:<work>:NNN` + GRETIL edition + verse spans).
  These are the atoms everything cites. Never invent a locator; resolve
  via `python3 tools/bridge_resolve.py chunk:<id>` (trika-x).
- Your lane: coordinate, never write. A needed source fix = a CLAIM filed
  upstream, never a patch. (ipvv Law #1, applied estate-wide.)

### 2.2 openpatala — identity roots (bridge mapped, witnesses pending)
- `openpatala/data/translation-availability.json` (260 works incl.
  tantrasara, paramarthasara, spandakarika, vijnanabhairava — VERIFIED
  present) + `data/gold/PTCND_*.json` dossiers (Tantrasāra verified;
  Paramārthasāra verified).
- Bridge status: `trika-x/formal-trika/bridge/openpatala-map.json` maps
  all 6 gold works → work keys + dossier ids + GRETIL editions. Witness-level
  IDs are UNPINNED (their CLI is broken in this checkout; do not invent IDs).
- YOUR TASK (concrete, no spec needed): get their resolver running or
  reimplement the minimal query (work key → witness list), fill the
  `witness` fields, extend `bridge_resolve.py --check` to verify them.
  Acceptance: `bridge_resolve.py chunk:tsa08-p03` prints a witness siglum.
  Follow their source-resolver design (`patalacheckpoints/docs/vision/
  source-resolution/source-resolver-design.md`, 1070 lines): Work → Edition
  → Witness → Surrogate → Transcription → E-text, authority ladder,
  NO automatic authority promotion, human reconciliation queue.

### 2.3 patalacheckpoints unlocks (adopt, don't rebuild)
This repo (`/root/patalacheckpoints`, Tantra Hub + essays site) is prior
art at larger scale. Verified contents and what to take:
- **EDUCATION_VISION.md** (graph-native teaching engine): ALREADY SPECS
  borrowing the UNO engine (mechanism-shapes per educational step; Trika
  examples: mirror/crystal analogy, IPVV-vs-TĀ contrast, kārikā→Vṛtti→
  Vivṛti→IPV chain, reversal moves). This is our teacher spec's missing
  move vocabulary — adopt the mechanism-per-step tagging, skip re-deriving it.
- **Anti-theatre doctrine** (`AGENTS.md` + `machinelearning/_ACTIVE/` +
  `theatre_check.py --status`): "a tested schema is not a result."
  RUN IT before any build here; port its stance into our CI where missing.
- **Essayguide** (`docs/vision/essayguide.md`): 6 hard problems of essay
  (thesis selection, argument architecture, positioning, contribution
  detection, compression, whole-doc eval) + education A–G + peer review
  A–G. Use as the checklist our essay pipeline (Stages 3–4, §7) must
  satisfy one item at a time — do NOT implement the platform, work the list.
- **Source-resolver design** (§2.2 above — the single most valuable doc).
- **Organism/education/economics visions**: read-only context for the
  demand-loop and N3 ledger design. Do not build; the owner gates N3.
- **Do NOT import**: any running code unreviewed (different stack, Next.js
  vs ours), the partnership/economics machinery, or auto-anything.

## 3 · Formal core (extend rung by rung — recipe included)

Location: `trika-x/formal-trika/`. Method: `TRIKA-METHOD.md` (read it;
it binds you). Every new rung follows this exact recipe — worked example
in parentheses (Upaya.lean, arm B):

1. **Write PREREGISTRATION-<rung>.md FIRST** (predictions + confidence +
   kill criteria; tiers T/R declared; commit before any `.lean`).
   (Example: `PREREGISTRATION-DECODE-RUNG.md`: T-C1 p=0.55 with Fisher
   exact test named in advance.)
2. **Types before rules**: add inductives/structures (keep the blind
   protocol satisfiable: run `tools/vocab.py --check` after).
   (Example: `MeansState{ready, pure}` + three relations, not three tables.)
3. **General constraints only** — a per-item table is KEY data, never a
   rule. If you write a mapping, it goes in the evidence registry as
   stipulated + evidence-pinned (see `KancukaCorr.lean` + `EVIDENCE.json`).
4. **Must-fail twin**: copy the file, break exactly one load-bearing
   def, name the SAME theorem in `run.sh`'s `mustfail` line. The harness
   (`tools/must_fail.py`) requires: identical statement, pinned Lean
   4.34.1, warnings-as-errors, exactly one expected `decide`-false error.
   (Read `BrokenGrace.lean` history: conjunct-drop mutants break 3 theorems
   and the harness rejects them — sever-mutant pattern documented in
   runs/INDEX.md arm-B section. Do not repeat that debugging.)
5. **TABLE.md entry**: add the plain-English reading to
   `TABLE-READINGS.md`, regenerate (`tools/table.py`), `--check` green.
6. **Evidence row**: every theorem gets an `EVIDENCE.json` entry (chunk
   ids via `bridge_resolve.py`, or R-source path, or lived-decode ref,
   or explicit exemption with reason). Run `tools/evidence_check.py`
   (currently: 76 theorems, 74+2, 22/22 chunks resolve).
7. **runs/INDEX.md verdict** in plain PASS/REFUTED/UNRESOLVED/PENDING.
   `tools/record_run.py` appends the machine receipt; ledger cites it.
8. **CI stays green**: `formal-checks.yml` runs tests + vocab/table
   freshness + both harnesses + tc1 + bridge check. Never land red.

Current coverage (Treeka formal column, run it):
`python3 tools/treeka_formal.py` → 6/45 chunks formalized, 16 armed,
23 unarmed + gap list. THAT LIST IS YOUR BACKLOG, in order. Next rungs
are not chosen by taste: take the top unarmed chunk that has an argmap
and formalize what it states. (Suggested: tsa08-p04 (evolution/senses),
then phr-p0X mala rows, then VBT dhāraṇās by cluster.)

Reference neighbours (cite, don't redo): Thon Ly `repos/formal-abhidhamma`
(method + run discipline + AnswerKey pattern), Barendregt `papers/`
(implicit-spec axiom style; AM0 σ-flip is our Recognition.lean's ancestor).

## 4 · Teacher (the assessor — implement, don't re-spec)

Spec: `nibbanahelp/specs/teacher-endgame.md` (stages 0–5, four-move
contract, response discipline). Status: spec'd, stage 0 unbuilt. Implement
in this order — each is code, each has a worked example to copy:

1. **Stage 0 readout** (text): relay + decode readout + `?`-as-questions
   over `corpus/abhidhamma/play/*.jsonl` (144 moments, machine-proposed,
   owner-unreviewed — treat conf=low as questions, never assertions).
   Copy the up() picker + gate pattern in `tools/serve.py`; new endpoint
   or mode, same gates. Acceptance: diarist corrects a tag → decode
   revision committed. (Worked example: day-7 #24 UNMAPPED → ask, don't fill.)
2. **UNO move vocabulary** (`/tmp/geometricengine`, audited in
   `/root/GEOMETRICENGINE-AUDIT.md`): 18 functions (UNMAKING/REMAKING/
   SELF-MAKING/META) + 15 mechanisms + register dims. Adopt the taxonomy
   as the teacher's move set; do NOT adopt its weights (self-consistent
   fiction — documented). Retraining on our transitions is a trajectory-
   gated later stage, not now.
3. **Stage 1 types**: BLOCKED on trajectory-endgame owner go-ahead.
   When unblocked: `types` field on sessions + miner per the spec.
   Do not freelance a variant.
4. **Voice**: blocked on browser e2e (wire proven, session not).
   Text carries the whole path; voice is a mouth, not a root.
5. **Practice**: syllabus C1 (VBT 65 dhāraṇās mapped) → deitybody units
   → sit player. Config assembly using `satsang-practice/engine`
   (text→practice, span-traced, model never writes offsets) — do not
   reimplement the compiler.
6. **N1 demand miner** (read-only script over sessions/ → crux queue):
   buildable now, small, high value — do it right after Stage 0.

Hard rules (from the spec + audit, non-negotiable): VOICE RULE (only the
diarist's words are theirs); four moves only (relay verbatim / scoped
reading / one question / gated unit); no verdicts on the person; no
bare advice (units, not sentences); every claim carries its receipt
(chunk id → formal theorem → witness, when bridge completes).

## 5 · Publishing (lanes, not factories)

Both factories live and are strict — your job is LANES, never factory code:
- **bookfactory** (`/tmp/bookfactory`): `factory.py inspect|quote|verify`,
  `check.py` fail-closed, quote-loop (postcard+social, DRAFT watermarked),
  parity lanes first. NEEDS from us: GOLD + GATE.json PASS on the text
  (coordinate with translation-work lane; never hand-copy text —
  entries.json block rule). First lane candidate: VBT cards / stotra
  anthology (small, gated, high-signal).
- **videofactory** (`/tmp/videofactory`): layer stack + BARS + approvals +
  `PERMISSIONS.md`. NEEDS: `formal:*` refs resolving (Stage 3 output) +
  storyboards + owner approvals. Follow their per-scene review +
  decision-log discipline (adopted from the magnum-opus HITL spec).
- Do NOT touch: factory engines, renderers, schemas, CI. Lane configs +
  approvals only. Stale outputs deleted before rebuild (their rule, our
  disk at 98% makes it survival).

## 6 · ALL FLAWS FOUND (with how to overcome — owner asked explicitly)

**Formal core.**
- F1. Small-n pilots (T-C1 26 arcs p=0.046; T-C4 n=4). Overcome: week-2+
  decodes re-run the SAME frozen tests (no new tests until pilots confirm
  or die); kill rules already written — enforce them, including the
  embarrassing outcome.
- F2. Single rater throughout (I'm rater-1's author). Overcome: rater-2
  sheet ready (`T-C2-RATER2-SHEET.md`) — needs an independent mind,
  cannot be automated or self-run. Blocker is human, say so.
- F3. Grace audit may be circular (looking for residual steps finds them).
  Overcome: the kill rule (zero-(b) kills the variable) + have rater-2
  score grace-clauses blind in the same pass.
- F4. ti/ca coordinates have no felt signature; doubt→kn is thin.
  Overcome: F-CORR stays hypothesis; do NOT cite it as established;
  the T-C1 re-runs are the verdict mechanism.
- F5. Station tags applied to ~4 moments of 144. Overcome: systematic
  station pass (mechanical, unblocked) before any station-dependent claim.
- F6. Thon Ly's L3/canonical-layer and edition variables not run.
  Overcome: layers-as-variable is documented (TRIKA-METHOD §3); first
  use = the TĀ 9.183/203/204 pins (UNPINNED — pin or drop the citation).

**Decodes & teacher.**
- F7. All 144 decodes machine-proposed, owner-unreviewed. Overcome: the
  adjudication queue IS the product (Stage 0) — unreviewed volume is
  not a finding, reviewed corrections are.
- F8. UNO weights are self-consistent fiction (predicted impact vs
  authored next turn). Overcome: never deploy; retrain-only path.
- F9. Voice wire-proven, browser session not. Overcome: text-first order
  stands; do not demo voice until e2e passes on-device.
- F10. No blind re-derivation run yet (instrument built, unused).
  Overcome: lead agent runs BLIND.md exercise on Upaya first (smallest).

**Corpus & pipeline.**
- F11. IPVV chunks BLOCKED/PROOF_NOT_RUN; 15% gold formal coverage.
  Overcome: Treeka gap list order (formalize top unarmed-with-argmap
  chunk next); IPVV migration contract before any IPVV formal claim.
- F12. Rater agreement unmeasured everywhere (decode tags, upaya tags).
  Overcome: kappa on the next 50 clauses, two raters, published in ledger
  win or lose.
- F13. Magunm-opus-scale overreach risk (their flaw #6, ours by
  inheritance): 4 factories + organism + atlas in others' docs.
  Overcome: the opportunity-cost rule — any infra task must enable content
  within 2 weeks or it waits. Enforce in review.

## 7 · Build order (next 10, each with acceptance)

1. Merge PR #2 (review; unblocks arm C). *Done when: main green, #2 closed.*
2. Rater-2 pass (human, ~1 session). *Done when: T-C2 scored ≥0.6 or parked per kill rule.*
3. `treeka_formal.py` in CI read-only mode + gap list as the standing backlog. *Done when: CI prints it green.*
4. Chunk↔openpatala witness completion (needs working resolver or fixed CLI). *Done when: `bridge_resolve` prints a siglum.*
5. Next crux (tsa08-p04 or top gap) walked end-to-end (copy CRUX-WALKTHROUGH-01 shape). *Done when: claim table + PUSHBACK + honest remainder on file.*
6. Stage 0 readout (nibbanahelp). *Done when: a tag correction lands as a decode revision.*
7. N1 miner (read-only). *Done when: first session-mined crux enters the queue.*
8. Station pass over 144 moments. *Done when: every moment has a station or explicit unknown.*
9. VBT/bookfactory lane (needs GOLD+GATE upstream). *Done when: one shipped card set with receipts.*
10. Blind re-derivation of Upaya (lead agent). *Done when: note filed SAME/DIFFERENT/VOCAB-GAP.*

Non-goals restated (do not sneak these in): no training runs, no Bayesian
posteriors as legitimacy, no reputation system, no organism build (gated),
no auto-publish/auto-sign, no second ledger, no non-Trika expansion until
the loop closes, no claiming the model is the mind.

## Appendix · Repo/file map (absolute paths)

- Endgame plan: `svread/ENDGAME.md`, `ENDGAME-BUILD-PLAN.md`,
  `endgame/REALISTIC-PATH-TRIKA.md` (this brief's 6-move plan),
  `endgame/RECONCILIATION-HXRMXS.md`, `endgame/teacher-endgame.md` (spec),
  `SCHOLAR-ENDGAME-{SPEC,VISION}.md`, `RESOURCES.md`, `TENSIONS-ENDGAME.md`.
- Formal: `trika-x/formal-trika/` (control/ + recognition/*.lean +
  PREREGISTRATION*.md + runs/INDEX.md + TABLE.md + Vocab.lean + BLIND.md +
  EVIDENCE.json + tools/{run.sh,must_fail.py,tc1_cooccurrence.py,
  treeka_formal.py,bridge_resolve.py,evidence_check.py,record_run.py}).
  Verify: harness commands in §1 + `python3 tools/table.py --check`.
- Reference: `trika-x/{INDEX,VISION-ARCHITECTURE}.md`,
  `repos/formal-abhidhamma/` (method), `papers/barendregt/` (axiom style),
  `TRIKA-X-SEEDS.md` (evidence index), `REQUIREMENTS-FROM-DECODE.md`.
- Teacher surface: `nibbanahelp/` (relay, gates, `corpus/abhidhamma/`
  vocab+linter+play decodes, `tools/check_factors.py`,
  `specs/teacher-endgame.md`); UNO engine `/tmp/geometricengine`
  (audited — see `/root/GEOMETRICENGINE-AUDIT.md`).
- Publishing: `/tmp/bookfactory`, `/tmp/videofactory` (lanes only).
- Practice: `/root/satsang-practice/engine`, `/root/deitybody/{practice,audio}`.
- Identity: `/root/openpatala` + `trika-x/formal-trika/bridge/`.
- Source gold: `/root/translation-work/{tantrasara-a07,a08,paramarthasara,phrdaya,vbt,spanda,bhairavastava}/`.
- Prior art (read-only): `/tmp/hxrmxs-truth-engine` (magnum-opus, TRUTHMAP-ARGUMENT-FABRIC, FATHERFUCKER 6d engine), `/tmp/hxrmxs-corpus` (finale/uno + magnum opus v3), `/root/patalacheckpoints` (education vision, essayguide, anti-theatre, source-resolver).
- Verify-everything commands: Lean harnesses (§1) · `python3 -m pytest tests/` (trika-x) · `bridge_resolve --check` · `table.py --check` · `vocab.py --check` · `evidence_check.py` · `tc1_cooccurrence.py`.
