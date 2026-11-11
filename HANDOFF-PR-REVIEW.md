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

- `data/licenses/registry.json`: `mitra-mt` flips `pending_verification` →
  `registered`. Apache-2.0 was read from the HF API and the card, the model is
  ungated, and the entry is pinned to HF revision `66869d9b…` with the paper
  URL. `allowed` is now train/infer/quote/redistribute = true.
- `tools/check_licenses.py`: registered entries with no local bytes may now pin
  by release page or revision, not only claim page. This was needed because a
  model is pinned by an immutable revision, not by a per-item hash.
- `BENCHMARK-PLAN.md`: pre-registration. 50 blind passages; 24 shared with our
  own translations; metric is human correction minutes; acceptance rules fixed
  before any score exists.
- `experiments/mitra-mt/`: inputs-only Kaggle dataset metadata (private) and a
  T4 kernel that writes results plus a provenance manifest.

Review focus:

1. Is flipping the licence status justified by the bytes on the HF page?
   `curl -s https://huggingface.co/api/models/buddhist-nlp/mitra-qwen35-translate | jq '.cardData.license,.gated'`
2. Is the loosened licence-gate rule too loose? It still requires *some* pin
   text and never admits `excluded`/`pending`/`read_only` entries.
3. Does the plan pre-register honestly — could we move goalposts after seeing
   scores? Check `BENCHMARK-PLAN.md` § Acceptance.
4. Dataset licence is `other`, private, evaluation-only. Confirm we are not
   redistributing GRETIL editions.

Run:

```sh
cd svread && python3 tools/check_licenses.py --check
python3 tools/check_licenses.py --admit mitra-mt infer
python3 tools/check_licenses.py --admit mitrasamgraha-nc-nd infer   # must REFUSE, exit 2
python3 scripts/release_manifest.py                                  # must PASS
python3 -m pytest tests/ -q
```

Known state, not a defect in this PR: the Kaggle kernel run is still being
debugged. Versions 1–2 failed because the dataset did not appear under the
expected `/kaggle/input` path; version 3 is a probe that prints the mount tree
and aborts before loading the model if inputs are missing. Kernel:
`priortrades/svatantrya-eval-mitra-mt-on-blind-50`. Do not merge a claim that
MITRA-MT was benchmarked — only that the harness exists and the inputs are
packaged.

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
