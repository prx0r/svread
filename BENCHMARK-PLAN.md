# Benchmark plan — does MITRA-MT beat what we already have?

Status: **active**. Licence cleared by owner 2026-11-11. This pre-registration
fixes the correction metric, scoring protocol and acceptance criteria before
any human score is seen. The 50-item set and stored L2 candidates already exist: 40 passages have some
text, 27 at full coverage. No MITRA output or human correction score exists yet.

## Question

If a reader is handed a machine translation of a Trika passage, how much work
does it take to make it publishable? We compare our own stored translations
against MITRA-MT, a strong open Sanskrit→English model from WMT 2026, on the
same 50 evaluation passages.

This is not a leaderboard chase. We want to compare the correction effort for
our stored translations and a strong open model, and learn where to spend
review effort. This is an exploratory comparison, not a claim about general
Trika translation quality.

## The set

`data/eval/trika-blind-50.json` — 50 passages across 49 works, selected
2026-11-11 by a machine rule from the trace corpus. It takes one passage per
work, then a second from the first sorted work to reach 50. Ghaṭakarpara is
excluded (source hold). Every item sets `held_out_scope` to
`human-scoring-only` and carries a `trace_sha256`.

This is a retrospective comparison, not a sealed holdout from earlier
generation, training or public exposure: 40 passages already have stored L2
text, including 27 at full coverage. Four are partial and nine are not
measurable against the exported source spans. No human correction scores were used to select the set. The
holdout applies only to the upcoming human correction-scoring pass. The new
MITRA run receives the Sanskrit source with no English references; the scorer
does not see candidate identities.

Known skew, stated up front:

- Coverage was revised after a real alignment bug fix (2026-11-11): the
  exporter originally matched only the blind-set slug, while some works were
  stored under different slugs (`paratrimshika` as `ptv-*`, `sivasutra` as
  `span-*`, and Tantrāloka chapters as `tal-aNN`). It now aligns using the
  Sanskrit citations present in each candidate file. Result: **40/50** have
  some stored text, **27** full, **4** partial, **9** unmeasurable and **10**
  untranslated. The head-to-head is limited to the 27 full passages; partials
  are reported separately and cannot count as wins. MITRA-MT runs on all 50;
  the rest are coverage data, not head-to-head evidence.
- `category` is null for every item: classification (compound / terminology /
  negation / ritual / verse / ambiguity) is a human job and stays pending. Any
  per-category claim before that is exploratory.
- Difficulty is machine-assigned (long / medium / short), not judged.

The inputs-only Kaggle copy is `priortrades/svatantrya-blind-50`; it contains no
reference English and is recorded as private in the owner handoff. Its Kaggle
visibility was not independently queried during this review. Its payload is
not duplicated in this PR's public source tree. The canonical set file is
already present in the public repository, so the source passages are not
confidential. That public file contains selected text excerpts, some pointing
to GRETIL editions. It does not mirror complete editions, but
the existing excerpt publication needs its own rights review because the
registry currently sets GRETIL `redistribute` to false. This PR removes its new
duplicate payload. MITRA's earlier training may have included some of the same
public source texts; the benchmark cannot establish model-level source
non-exposure.

## Candidates

| # | Candidate | Provenance | Source |
|---|-----------|-----------|--------|
| 1 | **ours** | stored translation-work L2 layers; 40/50 have text, 27 full; this export does not establish human approval or publication | `data/eval/candidates/ours.json` |
| 2 | **mitra-mt** | `buddhist-nlp/mitra-qwen35-translate` @ `66869d9b`, Apache-2.0, base Qwen3.5-9B | Kaggle kernel `priortrades/svatantrya-eval-mitra` |

The planned MITRA-MT run uses its released model-card **closed-book prompt
template**, wrapped by the model tokenizer's chat template with thinking
disabled. There are no retrieved references or few-shot examples. Decoding is
greedy; weights use 4-bit NF4 on a T4 with float16 compute. The model revision,
prompt, decoding, quantization and exact runtime versions are recorded in the output
manifest. This follows the model's published usage instructions rather than
the earlier generic one-line prompt. Source: [MITRA-QWEN model card](https://huggingface.co/buddhist-nlp/mitra-qwen35-translate).

Fairness caveats to record in any writeup:

- MITRA-MT's training corpus (Mitra-Parallel, 1.69M records) is largely
  Buddhist literature. Trika is adjacent, not identical. If it underperforms,
  that is a domain boundary, not a claim that the model is weak.
- Its 9B parameters and 22.6B-token pretraining dwarf anything we have.
  Losing narrowly is a good result for our pipeline.
- Ours is a selection from stored L2 artifacts, not a fresh generation. The
  export records the layer, but that alone does not establish human approval or
  publication; do not assume that our prose is cleaner before scoring it.
- The benchmark has one human scorer and 27 full-coverage shared passages. Results are
  descriptive; report the paired passage data and do not imply statistical
  significance or broad generalisation.

## Metric

Correction effort, per `data/eval/RUBRIC.md` — a human's estimated active
minutes for a competent editor to make each passage publishable, recorded to
the nearest 0.5 minute. Zero means no edit is needed; the verdict is recorded
separately. A rejected translation still gets a repair-time estimate and is not
dropped from the mean. Never BLEU, never an LLM judge, never a similarity score.

Reported as: mean minutes per passage, per candidate, on the 27 full-coverage
shared passages; the paired per-passage minute estimates; verdicts; and the
number of passages needing no edit at all. Partial passages are described
separately. MITRA outputs without a full-coverage stored counterpart are
coverage data and do not enter the head-to-head comparison.

## Protocol

1. MITRA-MT outputs are frozen on Kaggle with a manifest (model revision,
   prompt, decoding, input sha256, output sha256, errors).
2. Outputs are brought back and checked with
   `python3 tools/eval_blind.py --candidate <file> --name mitra-mt` for
   coverage and schema only. That tool **cannot** score — it prints
   `PENDING_HUMAN` by design.
3. Build the blinded sheet with `tools/eval_score_sheet.py`, using the ours
   manifest to restrict the comparison to the 27 measurable, non-partial
   passages. Passage order and A/B placement are shuffled with seed `20261111`;
   the identity key is kept separate from the scorer's worksheet.
4. One human scores both. No model scores anything.
5. Results land in `data/eval/results-<candidate>.json` and the site.

## Acceptance (decided now, before scoring)

- Let `Δ = mean(mitra-mt minutes) − mean(ours minutes)` on the 27 full-coverage
  shared passages. **MITRA-MT wins** if `Δ ≤ −0.5` and it needs no edit on strictly
  more passages.
  Response: for this 27-passage comparison, record the result as evidence
  against a correction-effort advantage for our stored L2 outputs. Do not
  generalise it to all Trika translation or human-approved work.
- **Ours wins** if `Δ ≥ 0.5` and ours needs no edit on strictly more passages.
  Response: document what the human notes show; category analysis stays
  exploratory until the categories are human-assigned.
- **Tie** if `|Δ| < 0.5`, regardless of the no-edit counts; report those counts
  alongside it.
- **Inconclusive** if the mean threshold is reached but the no-edit count does
  not favor the same candidate, or the counts are equal. Do not force that case
  into a win or tie.

A null or negative result is publishable and will be published. Nothing here
auto-publishes: the site only carries numbers after the human scoring pass.

## Costs

- Kaggle: one GPU session (≈10–20 min incl. install) against the 30 GPU-h/week
  free quota. Chant datasets and kernels are untouched (read-only forever).
- No paid inference anywhere.

## Artifacts

```
experiments/mitra-mt/
  dataset/            dataset-metadata.json (metadata only; input payload stays private on Kaggle)
  kernel/             script.py, kernel-metadata.json           (GPU T4)
data/eval/
  candidates/ours.json                40 translations (27 full coverage)
  candidates/mitra-mt.json            pulled back from Kaggle
  candidates/mitra-mt.manifest.json   provenance + hashes
  results-ours.json                   existing scaffold record
  results-mitra-mt.json               after human scoring
```

Re-run:
```sh
kaggle kernels push -p experiments/mitra-mt/kernel
kaggle kernels status priortrades/svatantrya-eval-mitra-mt-on-blind-50
kaggle kernels output priortrades/svatantrya-eval-mitra-mt-on-blind-50 -p experiments/mitra-mt/out
python3 tools/eval_blind.py --candidate experiments/mitra-mt/out/results-mitra-mt.json --name mitra-mt
python3 tools/eval_score_sheet.py --a data/eval/candidates/ours.json --b data/eval/candidates/mitra-mt.json --a-manifest data/eval/candidates/ours.manifest.json --out data/eval/scoring
```
