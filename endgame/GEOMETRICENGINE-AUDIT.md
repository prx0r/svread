# prx0r/geometricengine — full audit (docs + code + data)

**Date:** 2026-11-06. **Auditor:** box agent (3-reader deep dive + independent
verification of load-bearing counts). **Scope:** all ~30 docs, `src/` (1,767
lines), `data/`, tests. Method: read everything, re-ran what runs, recomputed
what counts. Anything marked VERIFIED was checked on disk this session.

## 0 · Inventory (verified)

| File | Lines | Genre | Verdict |
|---|---|---|---|
| metaunoguide.md | 746 | guide: MetaUNO metacognitive layer + MHT research proposal | READ — best doc in repo |
| unoguide.md | 847 | guide: transition-training thesis + worked examples | READ — second best |
| devuno.md | 517 | build plan: LangGraph+SQLite+retrieval | READ — plan vs code checked |
| functions taxonomy 3.2.txt | 770 | taxonomy: 18 functions, 4 phases, per-function risks | READ — adoptable |
| mechanisms.txt | 508 | taxonomy: 15 mechanisms, 6 families, typical pairs | READ — adoptable |
| registers.txt | 457 | taxonomy: 24 claimed, 23 listed, 6 dims | READ — adoptable w/ note |
| graphexplain.md | 118 | pipeline explainer + table inventory | READ — partially stale |
| pathway.txt | 79 | older Memgraph variant pathway logic | READ — superseded variant |
| ingest.txt | 313 | older Memgraph/Redis/BERT variant spec | READ — superseded variant |
| user vector2.txt | 165 | DMPVN user vector + flywheel | READ — ideas only |
| genius enhancements.txt | 222 | impact-prediction + confidence + regen protocol | READ — adoptable guards |
| TESTING.md | 300 | test plan + critical-failure list | READ — suite itself red |
| tpnv2feedbackclaude.txt | 65 | external critique: abandon flywheel | READ — unaddressed in repo |
| v5 bb.txt | 34 | different system (Ouroboros pedagogy) | READ — unrelated, ignore |
| TPN FULL SPEC.txt = TPN_FULL_SPEC.txt | 2040 | spec: TPN-Prime (md5-identical dupes, VERIFIED) | READ — spec only, zero measurements |
| tpnv2.txt | 1678 | spec evolution (+W0, dashboard, lifecycle) | READ — spec only |
| best_tpn_research.txt = best tpn research.txt | 327 | literature rebuttal (md5-identical dupes, VERIFIED) | READ — external RCTs cited, not own results |
| tpn claude research mental health ai.txt | 393 | literature survey | READ — background only |
| tpn tech.txt | 338 | short paper + reviewer appendix | READ — claims are targets |
| tcis2.txt | 3173 | TCIS scaffold (mocks, dupes, truncated splice) | SKIMMED — do not build from |
| finale.txt | 10655 | 343 annotated episodes, 6 lineages (VERIFIED counts) | PARSED — filtered use only |
| uno.txt = data/uno.txt | 8760 | 274 episodes (md5-identical, VERIFIED; README says 58 — STALE) | PARSED — same caveats |
| final please.txt | 7308 | concatenated codebase dump (TPN modules) | SKIMMED — scaffold at best |
| satan.txt | 5160 | concatenated codebase dump (TCIS) + pasted LLM progress report inside its own tests | SKIMMED — untrusted draft |

## 1 · The three things in this repo (do not confuse them)

**A. UNO engine + transition data (REAL, partial).** `src/` implements the
graph-native pedagogical policy engine from README/devuno: ingest UNO
transcripts → SQLite hyperedges → embeddings → train weights → pathway
inference → template render → feedback retune. No LLM in the cognition
path (README's core claim — true of the code path). `finale.txt`/`uno.txt`
are the training corpora both guides describe (same schema; uno.txt is the
smaller export).

**B. TPN/TCIS/v5 specs + code dumps (aspirational + generated).** TPN FULL
SPEC is a thorough supervised-discovery design (P(B|A,U,C), 4 timescales,
cold-start rules, golden sequences) with every number a threshold in
pseudocode and the canonical example shipping all weights at 0.0.
`final please.txt` / `satan.txt` / `tcis2.txt` are generator outputs
(boilerplate + mocks + duplication + one pasted chatbot progress report
inside a test file). tpnv2 adds production machinery on paper; the Claude
feedback (abandon self-modifying flywheel) is unaddressed anywhere in code.

**C. Taxonomies + metacognition docs (the portable value).** Functions,
mechanisms, registers, user-vector, metaunoguide, genius enhancements.
These survive independent of any implementation.

## 2 · What the guides actually say (verified where checkable)

- UNO = transition training, not answer training: `state → move →
  next_state` with metacognitive commentary (unoguide.md:5-12).
- Same grammar across Socratic/Buddhist/Advaita/Therapeutic lineages
  (unoguide.md:191-209) — directly relevant to us: Buddhist
  (reification warning, view deconstruction, experiential reframing) and
  Advaita (subject-object inversion, binary collapse, source redirection)
  are our own moves, named.
- MetaUNO = second-order layer built ONLY from `my_thoughts`: policy
  rationale + state-inference explanation + move justification + prediction
  hypothesis + trap awareness + next-observation plan (metaunoguide.md:11-35),
  parsed into 5 sub-signals, bound as hyperedges
  `H_t={State, Behavior, Move, Mechanism, Register, Trap, PredictedImpact,
  MetaThought}`.
- Concrete transition (unoguide.md:312-336): fearful_disclosure + RM_03
  (conceptual_distinction) + system_dynamics + PR_02/IN_03/AT_03 →
  dawning_awareness. This is the atomic unit of everything.
- Pipeline per README/devuno/graphexplain: ingest → embed → train
  (`W[state][function]`, `W[state][mechanism]`, `W[function][next_state]`)
  → pathway (retrieve top-6 → infer state → query weights → marginals
  fallback) → LangGraph (retrieve → pathway → hermes seed → render → save)
  → feedback (`new = old + 0.1*reward`, rejected/preferred pairs kept).

## 3 · Taxonomies (adoptable, with notes)

- **18 functions, 4 phases** (UM definition_collapse→constraint_removal;
  RM analogy→frame_upgrade; SM direct_seeing→existential_commitment;
  ME process_discipline→method_explanation). Each carries its own risk
  notes (UM_01 humiliates the fragile; SM_01 gatekept for anxiety/psychosis;
  etc.) — the best safety thinking in the repo, adopt WITH the risks.
- **15 mechanisms, 6 families** (structural, causal, ontological,
  attentional, horizon, none) with documented typical pairs
  (RM_03→comparison_contrast, SM_02→subject_object_inversion…). Mechanism
  as lineage-agnostic geometry is the sharpest idea here.
- **Registers: 24 claimed, 23 listed** (header off by one — VERIFIED),
  6 dims (intensity, intimacy, linguistic, phenomenological, meta,
  attunement). Adopt the dims; re-derive the inventory count.
- **User vector / flywheel:** DMPVN vector + `modulate_vector` +
  4-workflow loop (reflex/cognitive/evolution/oversight). Ideas only —
  and the Claude feedback's collapse/bias/regulatory objections stand
  unrebutted in code. Do NOT import the self-modification loop.

## 4 · Corpora (filtered use only)

- `finale.txt`: VERIFIED 343 episodes / 888 pedagogy blocks / 628 distinct
  `student_state` strings (`cooperative_engagement` 97, `unknown` 48…).
  Lineages: Buddhist 74, Socratic 60, Therapeutic 58, Gurdjieffian 56,
  Realist 55, Advaita 40.
- Dead weight (VERIFIED): Socratic assistant turns are annotation-only
  shells ([/PEDAGOGY] with no teacher utterance — checked verbatim);
  my recount finds 132/888 turns with negligible surface; 626-state
  cardinality is untrainable without normalization; `UNKNOWN` functions
  present; file is six pasted JSON roots (invalid as a whole).
- `uno.txt`/`data/uno.txt`: VERIFIED identical (md5), 274 episodes —
  README/graphexplain describe a 58-episode file (STALE docs).
- Usable slice: non-empty utterances only, normalized states, Buddhist +
  Advaita + Socratic lineages as charter-adjacent teacher-move examples.
  Roughly half the bytes are dead weight.

## 5 · Code audit (src/ vs claims)

- Train rule is fixed rewards (`true→1.0 / partial→0.5 / else→0.3`,
  train.py:167-194) from parsed `prediction_match`, averaged into weights;
  feedback applies `weight += 0.1*reward` (weights.py). No Bayesian
  updater, no credible intervals, no juncture/cluster conditioning, no
  W3/W4 jobs — the TPN learning story is NOT implemented.
- Retrieval is brute-force NumPy cosine over embeddings.jsonl (no
  FAISS/Redis/effectiveness term despite spec). Pathway picks state by
  similarity vote over top-3 hyperedges.
- `state_classifier.py:20-21` is a stub (`classify() → "unknown"`).
- LLM (`deepseek_client.py`) classifies into UNO labels + renders text
  only; hermes_prompts quarantined; "LLM not wired" per graphexplain.
- Tests: 2 collection ERRORS (stale `aggregate_candidate_nodes` import and
  one more) — suite is red; subagent's older "12 passed 7 failed" was a
  different (also broken) state. Nothing here is green.
- The older ingest.txt/pathway.txt variant (Memgraph/Redis/BERT/GraphSAGE/
  Apriori/Celery) is a DIFFERENT, superseded stack — do not mix with src/.

## 6 · The circular-supervision problem (the central finding)

The training reward derives from `impact_predicted` vs the next authored
turn — both written by the same hand that wrote the PEDAGOGY block.
There are no measured outcomes anywhere in the loop: no patient results,
no session ratings from real users, no RCT, no latency histogram (the
<150ms claim has no measurement code — only a latency_ms query field).
The weights are self-consistent fiction: templated predictions coming true
in templated continuations. This doesn't make the architecture wrong — it
makes the weights unportable. The fix is exactly our trajectory spec:
retrain the same shape on OUR transitions, where loosening actually happened
and is logged.

## 7 · Safety / consent / provenance

- No consent records, de-identification pipeline, IRB, or speaker releases
  anywhere. Named book source (Tolan Ch.5) has no license/edition note;
  ethics sections are placeholders (`[IRB Approval Numbers]`).
- Mitigations that DO exist and are worth stealing: per-function risk
  notes, impact-prediction enum + confidence + impact_update protocol,
  `conf<0.4 → gentle + attuned` policy (genius enhancements), trap
  avoidance fields, clinician-dashboard workflow (spec only).
- Since the corpus is synthetic, there is no patient-privacy exposure —
  but equally no real-outcome grounding (§6). Treat as such.

## 8 · Usefulness verdicts (for teacher / trajectory / nibbanahelp)

ADOPT (take as-is): 18-function taxonomy + per-function risks; 15
mechanisms + typical pairs; register dims; my_thoughts 5-signal schema;
transition record shape (state/move/mechanism/register/predicted/next +
impact_update); trajectory-endgame shape confirmation (our N1 miner =
their select_pathway on real outcomes).
ADAPT (take with work): finale Buddhist/Advaita/Socratic episodes as
charter material (filter non-empty, normalize 626 states); phase arc
UNMAKING→REMAKING→SELF-MAKING→META as our arc-template's macro-shape;
feedback `rejected/preferred` pair habit for decode adjudication.
IGNORE: TPN/TCIS/v5 code dumps as code; all perf numbers; the flywheel
self-modification loop; UNO-trained weights for anything live; the 58-
episode doc numbers (stale); the `24 registers` header count.
DO NOT: present any of this as validated, cite invented baselines
(0.45/0.65/0.70/0.85), or mix the two stacks (src/ vs Memgraph variant).

## 9 · Recommended actions (ordered)

1. Fix the stale test import; get suite green (small, proves the pipeline runs).
2. Map 18 functions + 15 mechanisms onto the teacher spec's move vocabulary.
3. Filter finale Buddhist/Advaita episodes → charter material (non-empty, normalized states).
4. Design retraining bridge: our tension arcs (open→loosening→resolved + preceding move) as TransitionRecords; UNO engine retrained = trajectory miner implemented.
5. Keep evidence boundary: engine outputs are proposals (heuristic shelf, with the linter), never proof, never auto-act.


## 10 · Addendum: files missed in the first pass (2026-11-06, verified)

- **`uno/` subfolder: byte-identical duplicates** (md5-verified:
  `uno/unoguide.md` = `unoguide.md`, `uno/metaunoguide.md` =
  `metaunoguide.md`, `uno/uno.txt` = `uno.txt`). No new content; likely a
  packaging leftover. The "magnum opus" files are not a separate set —
  no file in the repo is named magnum/opus/hxrmxs; the magnum-scale items
  are `finale.txt` (data), TPN FULL SPEC (spec), and the generated dumps.
  (`v5 bb.txt` mentions a "Magnum Opus v5", but that is a different,
  unrelated system sketch.)
- **`index.html` + `server.py`: a working chat frontend.** stdlib HTTP
  server (no deps, no auth): `GET /` serves the page, `POST /api/chat`
  runs the LangGraph, `POST /api/feedback` writes scores. The page is a
  dark chat UI with collapsible trace view + rating buttons — i.e. the
  feedback loop has a UI, not just the Streamlit app. CORS wide open
  (`Access-Control-Allow-Origin: *`).
- **`data/engine.sqlite` is EMPTY (zero tables, VERIFIED).** Nothing
  trained ships with the repo. The table counts in graphexplain.md
  (201 hyperedges, 2153 weights) describe a built state the reader must
  reproduce via ingest → embed → train. Fresh clones start from zero.
- **`src/schema.sql`: 13 tables**, including `preference_pairs`
  (rejected/preferred = DPO-style loop, per devuno regen design),
  `response_forms`/`rendered_responses` (render variants), `episodes` /
  `turns` (raw), `mythought_hyperedges` / `incidences` / `policy_weights`
  / `graph_mythoughts` / `feedback_events`.
- **Models confirmed:** `PedagogyBlock` / `TurnRecord` / `TransitionRecord`
  / `EpisodeArc` (pedagogy.py); `RegisterProfile` with `from_strings` +
  `to_tuple` (register.py); LangGraph is 4 linear nodes
  (pathway → mythought → render → save, graph.py:39-48) — no branching,
  no cycles despite the "graph" name. Weight update confirmed as
  `0.1 * reward` upsert (`reward = score / 2.0`, weights.py:57-68).
- **Full test state (VERIFIED this session):** 2 collection ERRORS
  (stale imports), 7 FAILED (all `sqlite3.OperationalError` — they need
  a trained DB that doesn't ship), 12 passed (pure-logic tests).
  Net: nothing end-to-end is green on a fresh clone.
