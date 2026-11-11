# Blind eval rubric — correction effort, never BLEU

The set: `trika-blind-50.json` (held out — never used in prompts, tuning, or
training). Candidates run against it produce `results-<name>.json`.

## Per passage, per candidate (human fills these)

| Field | Meaning |
|---|---|
| `edits` | textual changes needed to reach scholarly acceptance |
| `wrong_terms` | mistranslated terms (philosophical terminology counts double in review) |
| `unsupported` | additions with no basis in the source |
| `survives_gates` | `yes` / `partial` / `no` — passes the evidence rules |
| `minutes` | estimated minutes for a Sanskrit-competent reviewer |
| `verdict` | `ACCEPT` / `REVISE` / `REJECT` |
| `notes` | what broke; the reason, not the vibe |

## Per candidate (derived only after every passage has human rows)

- mean `minutes` (the headline number: cost to scholarly acceptance)
- total `edits`, total `wrong_terms`, total `unsupported`
- `accept_rate` (ACCEPT / 50)
- per-category breakdown (only where `category` is human-assigned)

Machine never writes these numbers. `eval_blind.py --candidate` records
coverage (missing / extra / empty) and a `human: PENDING_HUMAN` template —
that is all automation is allowed to do.

## Categories (human assigns; `category` is null until then)

`compound` · `terminology` · `negation` · `ritual` · `verse` · `ambiguity`

`category_candidate` in the set file is a machine hint (length / standalone
`na`), explicitly unreviewed.

## Rules

1. A candidate that never sees the held-out set during tuning stays honest;
   anything that touched it is contaminated and must be re-run on a fresh set.
2. No aggregate "quality score". Report the table.
3. Licence gate first (`tools/check_licenses.py --admit <id> infer`): an
   unadmitted candidate cannot be run at all.
4. Ghaṭakarpara never enters this set (source-alignment hold).
