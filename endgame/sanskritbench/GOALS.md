# SANSKRITBENCHY — GOALS & CHECKPOINTS (the build path)

*2026-08-16 · The concrete, checkable goals toward `VISION.md`. Each item is falsifiable: DONE only when a
logged number / a real artifact exists, not when a file is written. Order: **Phase 1 → 6**.*

---

## ✅ DONE (the foundation)

- [x] Gold control — `sanskrit_gold.py`: 5,601 exemplars (373 Pratyabhijñā / 123 Krama / 278 Śaiva /
  4,827 Vedic) + Mitrasamgraha test (5,552) + 49 IPVV + 23 kramasadbhava.
- [x] Deterministic proof gate — `translation_proof.py`: faithful→PASS, hallucinated→BLOCKED,
  source-repeat→BLOCKED(ABSTENTION). Verified.
- [x] Experiment lab + registry — `experiment_lab.py`: 3 logged experiments, `--report`, `--sweep`.
- [x] Frontier datasets imported — Sāmayik (2,417), Itihāsa (11,721) → `data/frontier/` + `frontier_gold.py`.
- [x] Hermes callable — `pipeline/model.py` works (mimo-v2.5, 1M context).
- [x] Research deep-dives — COMET/crypto, HF/LoRA/persona, how-we-beat.

## PHASE 1 — the FIRST real proof (immediate, no torch)

> The first logged Kendall's-tau: does our metric beat chrF?

- [ ] Run the meta-eval on our own gold — `validate_benchmark.py --n 2 --m 3 --test mitrasamgraha`.
- [ ] Run the meta-eval on Sāmayik + Itihāsa gold (external validation).
- [ ] Fix the IPVV candidate timeout (pass a large `timeout` to `chat()`).
- [ ] **Gate:** a real, logged tau table (chrF vs bleu vs semantic-judge) on our gold AND frontier gold.

## PHASE 2 — learned metric baseline (needs torch/GPU)

> Does off-the-shelf COMET beat chrF/bleu on our Sanskrit gold?

- [ ] Install torch + `unbabel-comet` on a torch-enabled box.
- [ ] Run `wmt22-comet-da` + `cometkiwi-da` on Mitrasamgraha + IPVV + frontier gold.
- [ ] Compare COMET's tau vs chrF and vs our semantic-judge.
- [ ] **Gate:** a tau comparison table (COMET vs chrF vs ours) on the same gold.

## PHASE 3 — school/period conditioning (the novel moat)

> Does the metric rank better when it knows the philosophical school / historical period?

- [ ] Build the lemma→sense→(school,period) map from CDSL/DCS + Pāṭala.
- [ ] Build the *vimarśa* test: items where the correct rendering depends on school/period.
- [ ] School/period-conditioned metric (condition token or fine-tuned COMET head).
- [ ] Test a Sanskrit-first backbone (ByT5-Sanskrit 2409.13920 / Gemma2-MITRA 2601.06400) vs XLM-R.
- [ ] **Gate:** tau(school-conditioned) > tau(not), on the same gold; the *vimarśa* discriminator works.

## PHASE 4 — the Sanskrit DA/MQM gold (the long-term asset, hardest)

> The prerequisite for a real Sanskrit learned metric. Nobody has one.

- [ ] Sample N pairs from Mitrasamgraha (period/domain-annotated) + the 49 IPVV scholarly passages.
- [ ] Define the MQM schema (minor/major/critical) + DA scoring, in the `wmt-mqm-human-evaluation` format.
- [ ] Obtain expert judgments (śāstric expertise) or a school-instructed judge calibrated to experts.
- [ ] Store as `data/da-mqm/gold.jsonl` with full lineage.
- [ ] Meta-evaluate our metric vs it (the strongest proof).
- [ ] **Gate:** a real, versioned human-judgment set (not fabricated) + our metric's tau vs it > chrF's.

## PHASE 5 — the Pāṭala proof of translation (crypto layer)

> Bind a metric score (quality) to a cryptographic commitment (integrity). **Proves integrity, not quality.**

- [ ] Wire the deterministic gate (`translation_proof.py`) into the product path.
- [ ] Hash/Merkle-commit `(source, hypothesis, reference, metric_score)` per translation.
- [ ] Add signed timestamp + model-ID (the attestation-bundle pattern, arXiv:2604.25200).
- [ ] Optional: EZKL / RISC-Zero proof that the metric scored these inputs (compute integrity).
- [ ] **Gate:** a logged commitment that verifies (src,hyp,ref,score) is unaltered + attributable, clearly
      labelled **integrity-only**.

## PHASE 6 — the persona-translation product (translate-as-people · license)

> Translate a text "as different people," each output verified + committed, then license it.

- [ ] Per-persona LoRA adapters (Vedic ritualist / Pratyabhijñā ācārya / Śaiva Siddhānta theologian), trained
      on real translator corpora (QLoRA on GPU).
- [ ] End-to-end pipeline: text → lemma → persona → verify → commit → Pāṭala proof.
- [ ] The licensing wrapper (the verified, attributable guarantee as a service).
- [ ] **Gate:** an end-to-end verified + committed translation from a chosen persona, with a full Pāṭala proof.

---

## THE NON-NEGOTIABLE RULES

- **No claim of "better" without a logged tau vs human gold on the same fixed data** (registry).
- **No "trained COMET" before the Phase 4 DA/MQM gold exists.**
- **Reuse, don't rebuild:** adopt COMET, MTME, wmt-mqm, span-meta-eval, ezkl, risc0 (see `repos/README.md`).
- **Every result resolves** to `result_id · benchmark_version · gold_version · model_version · split ·
  date`, or it doesn't exist.
- **The crypto layer (Phase 5) proves integrity, never quality** — keep the two distinct in every claim.
- Build **Phase 1 → 6** in order; never present a phase as done before its gate passes.

## PHASE 7 — the re-render + fine-tune capability (the product vision)

> Take a full text, re-render passages into multiple equally-valid translations, and build fine-tuning data.

- [x] **render-engine** — `pipeline/renderer.py`: re-render a passage into N register-candidates, score each
      (proof gate + semantic), keep the equally-valid set. **DONE (verified):** a real passage re-rendered
      into 3 of 4 equally-valid candidates (literal/plain/natural PASS + 0.8 semantic; precise correctly
      rejected). Gate: ≥2 valid candidates. ✅
- [x] **finetune-data** — `pipeline/finetune_builder.py`: build LoRA-ready plain/precise/literal/natural
      register-pair data from gold + re-renders. **DONE (verified):** `data/finetune/sanskrit-translation-
      pairs.jsonl` with register-tagged pairs. ✅
- [x] **checkpoint DAG** — `pipeline/checkpoint.py`: decompose each vision into falsifiable checkpoints
      (effect + gate + prereqs); the agent works the NEXT checkpoint and only marks DONE when the gate
      passes. **DONE (verified):** the re-render + fine-tune DAG advanced gold-ready → render-engine →
      finetune-data, all DONE. ✅
- [x] **AIDE tree search** — `pipeline/tree_search.py`: metric-grounded search over strategies. **DONE
      (verified):** a real run scored baseline 0.700 and honestly reported "no improvement" rather than
      fabricating a win. ✅
- [x] **deterministic memory** — `agent/memory.py` (DML) + Engram installed. **DONE (verified):** records +
      queries past decisions (anti-regression). ✅
- [ ] **(later, needs GPU) LoRA fine-tune per register** — train a "plain English" and "precise" adapter from
      the validated pairs; each output verified by the same gate. **Gate:** a per-register adapter whose
      outputs pass the proof gate + semantic threshold. (Blocked on GPU, not code.)

## THE DUAL DEV PLANS (which plan to follow)

- **CPU box (now):** `DEV-PLAN-NO-GPU.md` — keep building the instruments (SaQE data, challenge sets,
  annotation, triangulation, benchmark) that need no torch.
- **GPU box (when available):** `DEV-PLAN-WITH-GPU.md` — the full ML path: reproduce baseline → COMET
  meta-validation → SaQE → calibration + conformal → LoRA/translator → proof-carrying system → papers.
- **The checkpoint DAG** (`pipeline/checkpoint.py`) is the live truth: 8/9 gates DONE, `lora-adapter`
  (GPU) is the next gate. Run `python3 agent/run.py --step checkpoints` to see it.
