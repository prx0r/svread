# SANSKRITBENCHY — THE VISION + CHECKPOINTED ROADMAP + PĀṬALA PROOFS

*2026-08-16 · The single north-star for the whole `sanskritbenchy` project. Read this first. It ties
together: the benchmark (prove our metric beats chrF), the product (translate-as-people · verify · license),
the lemma spine (school/period-correct meaning), and the **Pāṭala proof** (deterministic + cryptographic
verification). Every checkpoint below is falsifiable: it is DONE only when a logged, reproducible artifact
exists — not when a file is written.*

---

## 1. THE GOAL (one sentence)

> **Build the first Sanskrit translation stack that can PROVE a translation is correct — school- and
> period-aware, learned-metric-verified, and cryptographically committed — so it can be licensed as a
> provably-faithful translation service.**

## 2. THE THREE PILLARS (what "correct" requires)

1. **VERIFY (the benchmark)** — a metric that provably beats BLEU/chrF (Kendall's tau vs human gold), per
   school × per period.
2. **PROVE (the Pāṭala proof)** — deterministic checks (SOURCE_BINDING / COVERAGE / ABSTENTION /
   TERM_CONSISTENCY) + a cryptographic commitment (faithful AND unaltered/attributable).
3. **TRANSLATE + LICENSE (the product)** — per-persona LoRA styles over a lemma spine, each output
   verified + committed, so it can be licensed as correct.

**The lemma spine:** segmentation/lemmatization (ByT5-Sanskrit + Vidyut) → **lemma→sense→(school,period)**
disambiguation (the moat, built from CDSL/DCS + Pāṭala) → persona translation → verify → commit.

---

## 3. THE PĀṬALA PROOF — what a "proof of translation" is

An LLM translation is a **verifiable PĀṬALA PROOF** only when it passes deterministic, checkable
constraints — not because a model wrote it (the ONE RULE). Two layers:

### Layer 1 — the deterministic gate (`pipeline/translation_proof.py`, DONE)
```
SOURCE_BINDING    every rendered clause traces to source (no hallucination)
TERM_CONSISTENCY  technical terms map 1:1 to the canonical glossary (no drift)
ABSTENTION        unsure spans flagged, never invented
COVERAGE          the whole source is addressed (no dropped pādas)
SEMANTIC_FIDELITY 0-1 meaning-match vs gold (the grade, not the gate)
→ PASS = a verifiable PROOF; every proof carries full lineage (result_id · source_sha · gold_version · checks)
```

### Layer 2 — the cryptographic commitment (Phase E, to build)
```
hash/Merkle-commit (source, hypothesis, reference, metric_score)
  + signed timestamp + model-ID            → "this run → this output, unaltered, attributable"
  + (optional) EZKL/RISC-Zero proof        → "the metric scored these inputs" (compute integrity)
```

## 3.5 THE AUTONOMOUS GOAL-HITTING (how we get there without babysitting)

The project hits goals autonomously via a **vision → checkpoint DAG** (`pipeline/checkpoint.py`): a vision
is decomposed into falsifiable checkpoints, each with an effect + prerequisites + a **deterministic gate**.
A checkpoint is DONE only when its gate PASSES (a logged, content-addressed, deterministic check). An agent
or the watchdog works the DAG: it always knows the NEXT checkpoint (prereqs done, not done), runs it, and
only marks DONE when the gate passes. **The agent doesn't guess what "done" means — the DAG defines it.**

```
VISION → checkpoint DAG (effect + gate per step) → agent works the NEXT checkpoint
  → gate PASSES → mark DONE → next
  → gate FAILS → NOT done → the agent CANNOT move past it
```

**Example (the re-render + fine-tune vision):**
```
[gold-ready]    a clean fixed gold exists (junk dropped)                     → gate: clean_exemplars() > 5000  ✅ DONE
[render-engine] a passage re-renders into N equally-valid translations       → gate: renderer.py --dry-run     ⬜ NEXT
[finetune-data] fine-tuning register-pair data (plain/precise) built          → gate: finetune_builder.py
```

## 3.6 THE RE-RENDER + FINE-TUNE CAPABILITY (the product vision)

**The capability:** take a full text, re-render passages/sections into **multiple translations that all
score as equally valid** in our ML verification system (`pipeline/renderer.py` — generates candidates in
literal/plain/precise/natural registers, keeps those that PASS the proof gate AND semantic-fidelity
threshold). Then build **fine-tuning data** for "more plain English" and "more precise" registers
(`pipeline/finetune_builder.py`) — LoRA-ready instruction pairs, ready to train per-register adapters.

```
FULL TEXT → passage → re-render into N candidates (registers) → score each (proof gate + semantic)
  → keep the EQUALLY-VALID set → build fine-tune pairs (plain / precise / literal / natural)
  → (later) LoRA fine-tune per register → "translate this as plain English" / "precisely"
```

This is what makes "translate a text as different people / in different registers, each verified" real:
the renderer proves each variant is equally valid, and the fine-tune data turns the validated variants
into trainable adapters. All of it passes through the same content-addressed verification (nothing is
"valid" unless a logged proof gate + semantic check says so).

> **The honest rule (verified deep-dive):** the crypto layer proves **integrity** (this run produced this
> output), never **quality**. Only the metric + deterministic gate prove quality. Keep the two distinct in
> every claim. **Never call a zkML proof "proof of a good translation."**

---

## 4. THE CHECKPOINTED ROADMAP (each = a falsifiable gate)

### ✅ DONE (the CPU-runnable foundation — all verified)
- **[x] Gold control** — `sanskrit_gold.py`: 5,601 exemplars + `clean_exemplars()` (drops junk/source-repeat).
- **[x] Deterministic proof gate** — `translation_proof.py` (incl. **CITATION_GROUNDING** — rejects
  invented terms, the darshana-graph rule).
- **[x] Experiment lab + registry** — `experiment_lab.py` (3 logged, report/sweep).
- **[x] Frontier datasets** — Sāmayik (2,417), Itihāsa (11,721), MITRA cross-canon (imported).
- **[x] Hermes callable** — `model.py` (mimo-v2.5, 1M ctx).
- **[x] Re-render** — `renderer.py`: N equally-valid translations + candidate-disagreement signal. **Verified:**
  3 valid candidates, convergent.
- **[x] Fine-tune data** — `finetune_builder.py`: LoRA register-pair data.
- **[x] Challenge sets** — `sanskrit_mqm.py`: the Sanskrit MQM taxonomy + controlled bad translations (SaQE data).
- **[x] Multi-reference benchmark** — `benchmark_registry.py` (PaliBench: references[] + alternative_senses).
- **[x] AIDE tree search** — `tree_search.py`: metric-grounded strategy search.
- **[x] Checkpoint DAG** — `checkpoint.py`: the vision→checkpoint gates (8/9 DONE).
- **[x] Verification spine** — `run_recorder.py` (content-address + eigenius kind), `verify.py`, `audit.py`,
  `schemas.py` + `validate_data.py` (strict data gate), `trace.py`, `memory.py` (DML), `ramwatch.py`.
- **[x] Proof-carrying evidence** — `proof_carrying.py`: the immutable translation artifact (§12).
- **[x] Confidence contract** — `confidence.py`: the feature-vector + multidimensional proof score (§7,§20).
- **[x] Cross-canon triangulation** — `triangulation.py`: Tibetan/Chinese evidence channel (§3,§13).
- **[x] Research deep-dives** — 13 verified (incl. `visionadvice.md`, the frontier blueprint).

### ⬜ PHASE 1 — the FIRST real proof (immediate, no torch)
- [ ] **Run the meta-eval on our own gold** — `validate_benchmark.py --n 2 --m 3 --test mitrasamgraha`
      → a logged Kendall's-tau (chrF vs bleu vs our semantic-judge). **Gate:** a real tau number in the
      registry, showing whether our semantic-judge beats chrF.
- [ ] **Run the same meta-eval on Sāmayik + Itihāsa gold** — external validation. **Gate:** tau on frontier
      gold too.
- [ ] **Fix IPVV candidate timeout** — pass a large `timeout` to `chat()`. **Gate:** IPVV produces candidates.

### ⬜ PHASE 2 — learned metric baseline (needs torch/GPU)
- [ ] **Install torch + COMET** on a torch-enabled box (not this 8GB box). **Gate:** `comet_scorer.py`
      returns real scores.
- [ ] **Run COMET on our gold + frontier gold** — compare its tau vs chrF and vs our semantic-judge.
      **Gate:** a tau comparison table (COMET vs chrF vs ours).

### ⬜ PHASE 3 — school/period conditioning (the novel moat)
- [ ] **Build the lemma→sense→(school,period) map** from CDSL/DCS + Pāṭala. **Gate:** a lemma can resolve
      to different senses by school/period.
- [ ] **The *vimarśa* test** — fixed items where the correct rendering depends on school/period. **Gate:**
      the metric ranks the school-appropriate candidate higher with conditioning than without.
- [ ] **School/period-conditioned metric** — fine-tune COMET (or a condition token) on the gold.
      **Gate:** tau(school-conditioned) > tau(not).

### ⬜ PHASE 4 — the Sanskrit DA/MQM gold (the long-term asset)
- [ ] **Sample + build** a Sanskrit human-judgment set (DA + MQM schema from `wmt-mqm-human-evaluation`).
      **Gate:** a real, versioned human-judgment set (not fabricated).
- [ ] **Meta-evaluate our metric vs it** — the strongest proof. **Gate:** our metric's tau vs the DA/MQM
      gold > chrF's, logged.

### ⬜ PHASE 5 — the Pāṭala proof of translation (crypto layer)
- [ ] **Deterministic gate integrated** into the product path (already built; wire it in). **Gate:** every
      served translation carries its PASS/BLOCK proof + lineage.
- [ ] **Crypto commitment** — hash/Merkle-commit `(src, hyp, ref, metric_score)` + signed timestamp +
      model-ID. **Gate:** a verifiable commitment (unaltered + attributable), clearly labelled integrity-only.
- [ ] **(Optional) EZKL/RISC-Zero proof** — prove the metric scored these inputs. **Gate:** a verifiable
      compute-integrity proof.

### ⬜ PHASE 6 — the persona-translation product (translate-as-people · license)
- [ ] **Per-persona LoRA adapters** (translate as a Vedic ritualist / Pratyabhijñā ācārya / Śaiva Siddhānta
      theologian), trained on real translator corpora (QLoRA on GPU). **Gate:** each adapter produces a
      recognizably different, school-correct register.
- [ ] **Verify + commit every output** (deterministic gate + metric + crypto). **Gate:** an end-to-end
      pipeline: text → lemma → persona → verify → commit → proof.
- [ ] **The licensing wrapper** — the verified, attributable guarantee as a service. **Gate:** a product
      spec + the legal/licensing framing defined (no precedent exists — we define it).

---

## 4.5 THE GRANULAR ATTAINMENT PATH (the exact route to the final vision)

The vision — a calibrated, proof-carrying Sanskrit MT system (`research/visionadvice.md`) — decomposes
into these gates. Everything **✅ DONE** is built + verified on this box; the rest is the route forward.

```
✅ gold-ready → ✅ render-engine → ✅ finetune-data → ✅ full-text-render → ✅ fine-tune-verified
   → ✅ triangulation (cross-canon evidence)
   → ✅ confidence-contract (feature-vector + multidim proof score)
   → ✅ proof-evidence (the immutable artifact)
   → ⬜ lora-adapter (per-register LoRA — needs GPU)                     ← the GPU gate
   → ⬜ COMET baseline (Phase 2 — needs torch)
   → ⬜ SaQE training (the Sanskrit evaluator — needs the MQM gold + GPU)
   → ⬜ calibrated confidence + conformal layer (§7/§8 — needs human gold)
   → ⬜ the *vimarśa* school/period conditioning (§3 — needs the lemma map)
   → ⬜ the multi-reference blind benchmark (§19 — PaliBench + human gold)
   → ⬜ the licensing wrapper (the product)
```

**The granular gates (each falsifiable):**
1. **gold-ready** ✅ — clean fixed gold > 5,000 exemplars (junk dropped).
2. **render-engine** ✅ — a passage re-renders into ≥2 equally-valid translations (proof PASS + semantic ≥ 0.5).
3. **finetune-data** ✅ — LoRA register-pair data exists, schema-valid.
4. **full-text-render** ✅ — a full passage → N equally-valid, verified translations.
5. **fine-tune-verified** ✅ — the fine-tune pairs are VERIFIED (each passed the proof gate).
6. **triangulation** ✅ — the cross-canon (Tibetan/Chinese) evidence channel works.
7. **confidence-contract** ✅ — the feature-vector + multidim proof-score contract is scaffolded.
8. **proof-evidence** ✅ — every translation ships the immutable evidence artifact.
9. **lora-adapter** ⬜ — a per-register LoRA adapter (needs GPU).
10. **COMET baseline** ⬜ — COMET scores + tau vs chrF/bleu (needs torch).
11. **SaQE** ⬜ — the Sanskrit-specialized evaluator/error-detector (needs MQM gold + GPU).
12. **calibrated-conformal** ⬜ — calibrated P(no major error) + conformal interval (needs human gold).
13. **vimarsa-test** ⬜ — school/period-conditioned metric ranks the school-correct sense higher.
14. **blind-benchmark** ⬜ — the multi-reference, private, PaliBench-style test.
15. **license** ⬜ — the verified, attributable translation service.

**The dependency rule:** each gate's prereqs must be DONE first (the checkpoint DAG enforces this). CPU
gates (1-8) are done; GPU/human gates (9-15) are the route forward. Run `python3 agent/run.py --step
checkpoints` to see the live DAG and the next gate.

---

## 5. THE META-EVAL LOOP (how the benchmark improves itself)

```
validate (run tau of each metric vs human gold)
   → observe which metric/error-family is weakest
   → hypothesis_lab proposes a better metric/config
   → run it as a new experiment
   → re-validate → did tau improve? → keep or discard → repeat
```

The benchmark **scores itself upward** toward higher human correlation. If it isn't a logged tau on the
same fixed gold, it isn't decided.

---

## 6. THE RULE (anti-theatre)

> **No claim of "better" is made without a logged Kendall's-tau vs human gold on the same fixed data. No
> "trained COMET" is claimed before the Sanskrit DA/MQM gold exists. The crypto layer proves integrity,
> never quality. Reuse the mature toolkits (COMET, MTME, MQM, ezkl, risc0). Build Phase 1 → 6 in order;
> never present a phase as done before its gate passes. If it isn't a logged number, it isn't real.**

---

## 7. HOW IT FITS THE LAB (the file map)

| Piece | Serves |
|---|---|
| `pipeline/sanskrit_gold.py` | the fixed gold control (Phase 1 baseline) |
| `pipeline/frontier_gold.py` | the imported Sāmayik/Itihāsa external gold |
| `pipeline/experiment_lab.py` | runs the experiments that feed the tau computation |
| `pipeline/translation_proof.py` | **the deterministic Pāṭala proof gate** (Layer 1) |
| `pipeline/validate_benchmark.py` | THE meta-eval: tau of each metric vs the judge (adopt MTME) |
| `pipeline/comet_scorer.py` | the learned-metric adapter (Phase 2) |
| `pipeline/hypothesis_lab.py` | the self-improvement loop |
| `pipeline/model.py` | the hermes client (the execution kernel) |
| `tools/sanskrit_benchmark.py` | the per-school × per-period leaderboard + cost router |
| `repos/` | the adopted toolkits (COMET, MTME, MQM, ezkl, risc0, IndicTrans2) |
| `hermes/` | the bundled hermes agent docs + how-to-call guide |

---

## 8. THE KEY DOCS

| Doc | What |
|---|---|
| `research/HOW-WE-BEAT-AND-IMPROVE-THE-BENCHMARK.md` | the meta-eval protocol + the improvable axes |
| `research/DEEP-DIVE-COMET-CRYPTO-VERIFICATION.md` | COMET/ML verification + cryptographic proofs |
| `research/HF-SANSKRIT-LORA-PERSONA-SURVEY.md` | the persona-translation / LoRA / lemmatization landscape |
| `research/PROOF-OF-TRANSLATION.md` | the proof architecture + verified arXiv literature |
| `research/VISION-COMET-SCHOOL-PERIOD-BENCHMARK.md` | the COMET + school/period build path |

---

*This is the north star. Phase 1 is the immediate, real next step — it needs only hermes (already
callable) and produces the first logged Kendall's-tau. Everything else builds on that number. The Pāṭala
proof is the spine: deterministic gate (done) → crypto commitment (Phase 5) — so a translation is not just
generated, it is verified and provable.*
