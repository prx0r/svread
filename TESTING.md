# TESTING — every suite and its exact command (2026-11-11)

Nothing here is optional-by-vibes. A skip must carry a reason; a BLOCKED must say
BLOCKED. Run these before any deploy.

## 1. Fast gate (what CI runs, ~3 min)

```sh
cd /root/svread
python3 scripts/release_manifest.py            # asset hashes + projections (must PASS)
node --test tests/*.cjs                        # full node suite
python3 -m unittest discover -s mcp -p "test_*.py"   # MCP suite (40)
```

CI (`.github/workflows/reader-check.yml`) runs: manifest → `node --check` →
node tests → MCP tests. Keep it green; a fresh checkout is the contract.

## 2. Emitters (deterministic bytes)

Every content emitter must be byte-identical on rerun:

```sh
for t in emit_grammar emit_wheels emit_gate_pools emit_certificates \
         emit_harness emit_answers emit_about emit_practice emit_eval_set \
         emit_discovery; do python3 tools/$t.py --check; done
python3 tools/check_licenses.py --check     # licence gate
python3 tools/eval_blind.py --check         # blind set + rubric
python3 tools/eval_export_ours.py --check   # our candidate, coverage honest
python3 tools/seo_check.py                  # 10 SEO gates
```

The license-pin invariant also has focused tests:

```sh
python3 -m unittest discover -s tests -p 'test_license_pins.py' -v
```

`emit_biblio.py --check` exits **3 = BLOCKED** when this box's DB lags the
committed view. That is neither pass nor defect; the tests skip with the reason.

## 2b. Blind evaluation loop

```sh
python3 tools/eval_export_ours.py                     # ours.json + manifest
python3 tools/eval_fetch_candidate.py --kernel <ref> --name mitra-mt
                                                      # pull, verify sha256, record
python3 tools/eval_score_sheet.py --a data/eval/candidates/ours.json \
    --b data/eval/candidates/mitra-mt.json \
    --a-manifest data/eval/candidates/ours.manifest.json \
    --out experiments/mitra-mt/scoring --seed 20261111
python3 tools/eval_tally.py --sheet experiments/mitra-mt/scoring/sheet.json \
    --key experiments/mitra-mt/scoring/key.json       # after a human fills it
```

Coverage is machine data; minutes and verdicts are human-only. `eval_fetch`
refuses on a sha256 mismatch, `eval_score_sheet` refuses to leak candidate
identity, `eval_tally` refuses on any unfilled field.

Node tests (in `tests/measurement.test.cjs`, 5): licence gate, held-out set,
our export, coverage-only runner, blind sheet.

## 3. Worker / gate (ipvv repo)

```sh
cd /root/ipvv
node --test worker/test/gate.test.mjs       # 13 checks: sampler, CAS, receipts
```

Covers: unique item ids, `pass = ceil(0.9·n)`, skip-ahead 403, sentence gating,
identical replay returns the same receipt, different replay 409, 3/hour limit,
401 unauth, 403 cross-origin. Runs the **real worker module** with an in-memory
D1 stub — no wrangler, no network, no svread checkout.

## 4. Formal / Lean (trika-x repo)

```sh
cd /root/trika-x
python3 -m unittest formal-trika.tests.test_gen_prakriya_slice    # 4
python3 -m unittest formal-trika.tests.test_treeka_report         # 5
python3 formal-trika/tools/gen_prakriya_slice.py --run            # lean + receipt
```

The receipt pins Lean version, command, file sha, pack sha, exit code. A pack
edit makes the receipt stale and demotes certificates to `pending` by design.

## 5. Browser tests (skipped without playwright)

`tests/sanskrit-browser`, `scholar-browser`, `pushing-browser` skip when
playwright/chromium is absent (labelled). With it:

```sh
SANSKRIT_BROWSER_EXECUTABLE=/path/to/chrome node --test tests/sanskrit-browser.test.cjs
```

## 6. Manual smoke (deploy gate)

```sh
./deploy.sh
for p in "" "?view=practice" "wheels" "a/sarvatra/" "about/" "?view=scholar" \
         "claim/tantrasara-a08/tsa08-p03/" "data/wheels/harness.json" \
         "data/mcp-registry.json" "sitemap.xml" "robots.txt"; do
  printf "%-45s " "$p"; curl -s -o /dev/null -w "%{http_code}\n" "https://svatantrya.net/$p"
done
```

Expect 200 for all; the claim page must show `class="answer"` with JS disabled.

## 7. Release hygiene (every content change)

1. Regenerate emitters (write mode) for whatever changed.
2. `python3 scripts/release_manifest.py --write` **last**.
3. `python3 scripts/release_manifest.py` → must PASS.
4. Commit; never commit `data/release-manifest.json` without the matching tree.

## 8. What the suites do NOT prove

- Machine traces are `DERIVED`, not philologically correct.
- `AGREE` = machine confirms curation; it is not truth.
- Certificates cover **structural well-formedness over a rule inventory** —
  never a derivation from the Aṣṭādhyāyī, never meaning.
- A green suite is consistency of checked-in bytes, not scholarly review.
