# Handoff — open PRs and what to review

Written 2026-11-11 for an external reviewing agent. Nothing here is merged on
trust: every branch below is pushed and open, and each claim is checkable with
the commands given beside it.

House rules that bind the reviewer:

- `BLOCKED ≠ PASS`. If a check cannot run, say BLOCKED with the reason.
- Machine traces are DERIVED. A passing test does not make a text true.
- Nothing auto-publishes, auto-signs or auto-renders.
- Never commit secrets (`.env`, `.dev.vars`, `*.pem`, tokens).
- Feature branches and PRs are always fine; never push to `main`.

## Open PRs, in merge order

### 1. svread #21 — MITRA-MT benchmark: pre-registration + runner

Branch `bench/mitra-mt-plan`.

What it changes:

- `data/licenses/registry.json`: `mitra-mt` is registered under Apache-2.0,
  based on the Hugging Face API/model card, with immutable revision
  `66869d9b73f5180fa124b4975c52f5033517e101`.
- `tools/check_licenses.py`: registered non-text assets without local bytes
  require an HTTPS source URL and a full 40- or 64-hex revision. A bare word
  such as “revision” is not a pin. Text entries can use a claim-page note;
  pending, excluded, and read-only entries remain refused. `tests/test_license_pins.py`
  covers these cases.
- `BENCHMARK-PLAN.md`: honest retrospective human-scoring comparison. The set
  has 50 passages across 49 works (one extra passage from the first sorted
  work); 40 have some stored L2 text, 27 full coverage, 4 partial, 9
  unmeasurable, and 10 untranslated. The head-to-head is limited to the 27
  full-coverage passages. It is a human-scoring holdout only, not a sealed set
  against earlier generation, training, or public exposure. No scores exist.
- `experiments/mitra-mt/`: inputs-only Kaggle dataset metadata and a chunked,
  single-passage T4 runner using the released model-card prompt, disabled
  thinking, float16 NF4 compute, and a runtime/provenance manifest. The runner
  aborts before model load if the Kaggle input mount is missing.
- `tools/eval_score_sheet.py`: writes a blinded, shuffled worksheet and a
  separate identity key. It must restrict the comparison to the 27 measurable,
  non-partial passages; the 9 unmeasurable passages are listed as excluded in
  the key, not scored as if they were full coverage.

Review focus:

1. Is the licence status supported by the HF API/model-card bytes?
2. Is the licence gate appropriately strict? Check the full immutable pin,
   HTTPS requirement, and refusal cases.
3. Does the plan keep its pre-registered metric and acceptance rules honest?
   Do not describe the set as hidden from earlier generation or the public.
4. The new PR no longer adds a second public copy of the source payload, but
   the canonical blind-set JSON on the base branch already publishes selected
   excerpts, some pointing to GRETIL. The complete editions are not copied,
   but the existing excerpt publication needs its own rights review because
   GRETIL is marked non-redistributable in the registry.
5. The Kaggle CLI was unavailable in this review environment. Dataset privacy
   and execution on the remote T4 were not independently verified; no
   MITRA-MT score exists.

Run:

```sh
cd svread && python3 tools/check_licenses.py --check
python3 tools/check_licenses.py --admit mitra-mt infer
python3 tools/check_licenses.py --admit mitrasamgraha-nc-nd infer   # must REFUSE, exit 2
python3 -m unittest discover -s tests -p 'test_license_pins.py' -v
python3 scripts/release_manifest.py
node --test tests/measurement.test.cjs
```

### 2. ipvv #12 — Google site auth + server-scored wheel gates

Branch `box/wheel-gates`. This is the one that changes live user behaviour, so
review it before the docs PRs.

Contents: `POST /api/auth/google` (verifies the Google token server-side
against `satsang-auth` `/v1/me`, mints `svsess`), `POST /api/wheel/gate/start`,
`POST /api/wheel/gate/submit`, `GET /api/wheel/progress`; migrations
`0013`–`0015`; `ipvv/worker/test/gate.test.mjs` (13 tests).

Claimed semantics that matter:

- items never repeat within a session; `n = min(20, unique items available)`;
  pass threshold `ceil(0.9n)`.
- consume is compare-and-swap on `used=0` with `meta.changes` checked, and
  receipt + progress + result land in one D1 batch.
- replay of an identical submission returns the same `receipt_id` with
  `replayed: true`; a differing submission is 409; an expired session is 410;
  rate limit 3/hour.

Review focus: the CAS path (double-submit race), whether `answers_json` can
leak correct answers to the client before submit, and whether the Google
verification trusts any client-supplied field.

Run:

```sh
cd ipvv/worker && node --test test/gate.test.mjs
```

Migrations 0013–0015 are already applied on the remote D1; re-applying is
idempotent but say so before doing it.

### 3. trika-x #10 and #11 — scoped report counts, Lean prakriyā slice

Branch `fix/treeka-report-scoped-counts`, `w2b-prakriya-slice`.

- #10 fixes `treeka_report.py` so every summary count honours `--work`; a
  regression test was added. Small, self-contained; merge first.
- #11 vendors `formal-trika/control/PrakriyaSlice.lean` + its receipt (Lean
  4.34.1, 44 traces, 68 error codes, 4 mutant theorems) and a generator. The
  svread certificate layer consumes the receipt only when
  `receipt.pack_sha256` matches the pack, so a stale receipt cannot claim
  `lean_status=checked`.

Review focus: #11 is a proof *artefact*, not a proof of the doctrine. Check
that nothing in the site renders a Lean-checked badge for a passage whose
receipt does not match, and that the mutants actually fail.

Run:

```sh
cd trika-x && python3 -m pytest formal-trika/tests/ -q
```

### 4. translation-work #18 — Muktabodha autonomous burn

Branch `burn/muktabodha`. This is the live factory front: Trika completion plus
a 499-work queue. Highest-risk PR of the set because it can move a lot of data
at once.

Review focus: does it write only into `burn/` outputs, does every emitted
translation keep its layer labels, and does the queue refuse non-admitted
sources (licence gate)? Check that no CC BY-NC-ND Mitrasaṃgraha slice is mixed
into anything bundleable.

Run the repo's own tests (`python3 -m pytest tests/ -q` from
`/root/translation-work`) and inspect the diff stat before merging — this one
should not be squash-merged blindly.

### 5. svread #11, trika-x #8 and #9 — earlier agent work, older base

These predate the current `main` and are listed for completeness:

- svread #11 `codex/translation-comparison-hub`: source-aware translation
  comparison pilot. Superseded in spirit by the blind-eval work now on `main`;
  decide merge-or-close rather than leaving it to rot.
- trika-x #8 `review/external-2026-11-08`: an external review snapshot. Docs
  only. Merge if the findings are still true, close if superseded.
- trika-x #9 `codex/essay-source-span-check`: binds textual essay claims to
  their ledger passage. Overlaps `scholar_check_claim_staleness`; check for
  duplicate machinery before merging.

## What we want from the reviewer

1. Merge or close each of the above with a one-line reason — no silent abandonment.
2. Prioritise #12 (live auth and gates) over docs PRs.
3. On #21, judge only the licence flip, the gate-rule change and the honesty of
   the pre-registration. Do not judge the not-yet-run benchmark.
4. Flag anything that claims a result without a human in the loop.

## Current session state (for context, not review)

- Blind set: 50 passages, 49 works, Ghaṭakarpara excluded, `category` null
  pending human classification.
- Our candidate: 40/50 coverage (27 full, 4 partial), exported with a manifest.
- MITRA-MT: harness packaged; Kaggle run failing on dataset mount, probe in
  flight. No score exists and none should be reported yet.
- Licence gate: 10 entries, GREEN.
- Release manifest: PASS, 11,041 asset hashes.
