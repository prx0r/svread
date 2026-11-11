# Blind eval rubric — correction effort, never BLEU

The set: `trika-blind-50.json`, a retrospective comparison set, not a sealed
holdout from earlier generation, training, or public exposure. Twenty-four
passages already have stored L2 translations. No human correction scores were
used to select the set. Its holdout scope is the upcoming human scoring pass.
Candidates run against it produce `results-<name>.json`.

## Per passage, per candidate (human fills these)

| Field | Meaning |
|---|---|
| `edits` | textual changes needed to reach scholarly acceptance |
| `wrong_terms` | mistranslated terms (philosophical terminology counts double in review) |
| `unsupported` | additions with no basis in the source |
| `survives_gates` | `yes` / `partial` / `no` — passes the evidence rules |
| `minutes` | estimated active correction time for a competent editor, to the nearest 0.5 minute; `0` means no edit is needed |
| `verdict` | `ACCEPT` / `REVISE` / `REJECT` |
| `notes` | what broke; the reason, not the vibe |

## Per candidate (derived only after every passage has human rows)

- mean `minutes` (the headline number: cost to scholarly acceptance)
- total `edits`, total `wrong_terms`, total `unsupported`
- `accept_rate` (ACCEPT / passages with human rows; the MITRA head-to-head uses 24 shared passages)
- per-category breakdown (only where `category` is human-assigned)

For this MITRA head-to-head, score only the 24 passages with both candidates.
The additional 26 MITRA outputs are coverage-only and receive no human quality
rows in this comparison.

For a rejected output, the reviewer still estimates the time needed to repair
it and records `REJECT` separately; do not omit the row from the mean. Round
minute estimates to the nearest 0.5 so a 0.5-minute decision threshold can be
represented. A `0` minute entry means no edit is needed.

Machine never writes these numbers. `eval_blind.py --candidate` records
coverage (missing / extra / empty) and a `human: PENDING_HUMAN` template —
that is all automation is allowed to do.

## Categories (human assigns; `category` is null until then)

`compound` · `terminology` · `negation` · `ritual` · `verse` · `ambiguity`

`category_candidate` in the set file is a machine hint (length / standalone
`na`), explicitly unreviewed.

## Rules

1. The existing L2 candidate may have prior prompt exposure; do not describe
   this comparison as a fresh unseen holdout for that pipeline. Do not tune on
   the human correction scores and then claim a blind result; use a fresh set
   for generalisation claims.
2. No aggregate "quality score". Report the table and paired passage-level
   minute estimates.
3. Licence gate first (`tools/check_licenses.py --admit <id> infer`): an
   unadmitted candidate cannot be run at all.
4. Ghaṭakarpara never enters this set (source-alignment hold).
