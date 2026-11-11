# Benchmark plan — does MITRA-MT beat what we already have?

Status: **active**. Licence cleared by owner 2026-11-11. This document is the
pre-registration: the set, the candidates, the metric and the acceptance
criteria are fixed *before* any score is seen.

## Question

If a reader is handed a machine translation of a Trika passage, how much work
does it take to make it publishable? We compare our own stored translations
against MITRA-MT, the strongest open Sanskrit→English system as of WMT 2026,
on the same 50 held-out passages.

This is not a leaderboard chase. We want to know whether our pipeline adds
value, and where MITRA-MT is already good enough that we should stop spending
effort.

## The set

`data/eval/trika-blind-50.json` — 50 passages, one per work, 49 works, selected
2026-11-11 by a machine rule from the trace corpus. Ghaṭakarpara excluded
(source hold). Every item carries `held_out: true` and a `trace_sha256`. The
passages are never used in prompts, tuning or training.

Known skew, stated up front:

- 26 of the 50 have no translation of ours on file, so the head-to-head only
  covers **24** passages. MITRA-MT will be run on all 50 anyway — the extra 26
  tell us what we are missing, not who wins.
- `category` is null for every item: classification (compound / terminology /
  negation / ritual / verse / ambiguity) is a human job and stays pending. Any
  per-category claim before that is exploratory.
- Difficulty is machine-assigned (long / medium / short), not judged.

Inputs are packaged privately on Kaggle as `priortrades/svatantrya-blind-50`
(inputs only, no reference English). Licence is composite — mostly GRETIL
editions under CC BY-NC-SA where stated — so evaluation only, no
redistribution.

## Candidates

| # | Candidate | Provenance | Source |
|---|-----------|-----------|--------|
| 1 | **ours** | translation-work L2 layers, 24/50 coverage | `data/eval/candidates/ours.json` |
| 2 | **mitra-mt** | `buddhist-nlp/mitra-qwen35-translate` @ `66869d9b`, Apache-2.0, base Qwen3.5-9B | Kaggle kernel `priortrades/svatantrya-eval-mitra` |

MITRA-MT is run with the paper's plain instruction prompt
(`Translate the following Sanskrit text into English:\n\n{text}`), greedy
decoding, 4-bit nf4 on a T4. No system-prompt engineering, no few-shot —
the same "no help" condition a user would get.

Fairness caveats to record in any writeup:

- MITRA-MT's training corpus (Mitra-Parallel, 1.69M records) is largely
  Buddhist literature. Trika is adjacent, not identical. If it underperforms,
  that is a domain boundary, not a claim that the model is weak.
- Its 9B parameters and 22.6B-token pretraining dwarf anything we have.
  Losing narrowly is a good result for our pipeline.
- Ours is a *selection* from existing published translations, not a fresh
  generation on the day. Ours is therefore expected to be cleaner prose; the
  interesting question is whether that gap survives human correction effort.

## Metric

Correction effort, per `data/eval/RUBRIC.md` — minutes a competent editor
needs to make the passage publishable, scored 0–4 per passage by a human.
Never BLEU, never an LLM judge, never a similarity score.

Reported as: mean minutes per passage, per candidate, on the 24 shared
passages; distribution of 0–4 scores; and the number of passages needing no
edit at all.

## Protocol

1. MITRA-MT outputs are frozen on Kaggle with a manifest (model revision,
   prompt, decoding, input sha256, output sha256, errors).
2. Outputs are brought back and checked with
   `python3 tools/eval_blind.py --candidate <file> --name mitra-mt` for
   coverage and schema only. That tool **cannot** score — it prints
   `PENDING_HUMAN` by design.
3. Both candidate files are put into the same human scoring form, passage
   order shuffled with a fixed seed, candidate identities hidden.
4. One human scores both. No model scores anything.
5. Results land in `data/eval/results-<candidate>.json` and the site.

## Acceptance (decided now, before data)

- **MITRA-MT wins** if its mean correction minutes are lower than ours on the
  24 shared passages by ≥0.5 min and it needs-no-edit on more passages.
  Response: we stop claiming our pipeline is the quality path; we use MITRA-MT
  as a first draft and keep our layer for terminology and doctored reading.
- **Ours wins** if the reverse holds. Response: document which kinds of passage
  (compound, terminology, negation) drive the gap.
- **Tie** (within 0.5 min): the honest answer, and the most useful one. It
  means machine translation has reached the "good first draft" line for Trika,
  and our effort should move from producing translations to verifying them.

A null or negative result is publishable and will be published. Nothing here
auto-publishes: the site only carries numbers after the human scoring pass.

## Costs

- Kaggle: one GPU session (≈10–20 min incl. install) against the 30 GPU-h/week
  free quota. Chant datasets and kernels are untouched (read-only forever).
- No paid inference anywhere.

## Artifacts

```
experiments/mitra-mt/
  dataset/            blind-inputs.json, dataset-metadata.json  (pushed private)
  kernel/             script.py, kernel-metadata.json           (pushed, GPU T4)
data/eval/
  candidates/ours.json                33→24 translations
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
```
