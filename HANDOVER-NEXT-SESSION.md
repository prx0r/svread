# Handover — next session

Written 2026-11-11. Read `docs/INDEX.md`, then `data/estate-index.json` (or
`workspace__estate_index` over MCP) before touching anything. The plans are
resolved below: what is done, what is blocked, and the ten jobs, in order.

## 1. What is live right now

| Thing | State |
|---|---|
| MCP endpoint | `https://mcp.sanskrit.help/mcp`, Streamable HTTP `2025-06-18`, **198 tools / 7 servers**, bearer auth |
| Auth | `sudo grep MCP_TOKEN /etc/svatantrya-mcp.env` |
| Supervision | `svatantrya-mcp.service` + `svatantrya-mcp-tunnel.service`, both `Restart=always`, enabled at boot |
| Site | `https://svatantrya.net` deployed from `main`; `/data/estate-index.json` and `/data/endgame-docs.json` live |
| Catalogue | `workspace__estate_index`, plus 17 vendored endgame docs under `/docs/endgame/` |
| Editing | `workspace__ws_*` (read/write/patch/grep, git status/log/diff/add/commit/branch/checkout; **no push**) |

Health: `curl -s https://mcp.sanskrit.help/health` → `ok 7 servers`.
Bare `POST /mcp` without a token → 401 (correct).

## 2. What this session actually did

1. **MITRA-MT benchmark pre-registered** (`BENCHMARK-PLAN.md`) and a Kaggle
   runner built; every failure documented in `experiments/mitra-mt/ERRORS.md`.
   Kernel run is **not** a result — it is a harness. Licence registry entry
   `mitra-mt` is `registered` (Apache-2.0, revision `66869d9b`).
2. **Coverage bug found and fixed**: our export was 24/50, actually **40/50**
   (27 full, 4 partial, 9 unmeasurable, 10 untranslated). Translations stored
   under `ptv-*`, `span-*`, `tal-aNN` were being missed; the exporter now
   aligns by citation containment and joins only matched rows.
3. **Corpus validator built** (`translation-work/tools/validate_layers.py`,
   PR #20). Tantrasāra **22/22 clean**: 745 rows, 9,415 source segments, 100%
   coverage, no phantom/double/empty rows. Whole corpus: **272/279 clean**.
4. **MCP estate gateway built and made public**: 198 tools across scholar,
   openpatala, federation, bookfactory, videofactory, aoc, workspace.
   Fixes on the way: slug derivation, mount path, OOM, bitsandbytes, output
   schemas, federation double-prefixing, `BOOKFACTORY_ROOT`.
5. **Everything indexed**: `ESTATE.md`-equivalent JSON, 17 vendored endgame
   docs with source hashes, 8 plugin recipes, one reading order.

## 3. Plan resolution — MASTERPLAN2 / MASTERPLAN3 / ENDGAME

**MASTERPLAN3 (svread W1–W8)**

| Phase | State |
|---|---|
| W1 practice gates | **done** — server-scored, CAS, receipts, 13/13 worker tests |
| W2 mechanics stamp | **partial** — 44 certificates bound to a Lean receipt; J1 covers 44 forms, not the whole pack |
| W3 access layer | **partial** — Google site auth built (ipvv PR #12, open); ORCID publishing only |
| W4 practice surface | **done** — `?view=practice`, 10 stages |
| W5 measurement | **scaffold done** — blind set, rubric, licence gate, candidates; **human scoring not done** |
| W6 training | **deferred by design** — only if W5 shows a failure simpler tools cannot fix |
| W7 factory | **not started** — no `auto_pipeline.py`; nothing writes candidates automatically |
| W8 Muktabodha corpus | **queue exists** (translation-work PR #18, 499 works), denominators still unreconciled |

**MASTERPLAN2 (trika-x W0–W9)**: hygiene done; identity root = openpatala
(live, 1,034 works mirror); verification/traces live (receipt-bound Lean slice,
PR #11); formal coverage still gap-list driven; **witness column not built**;
Treeka datastructures live with a report-scoping fix in PR #10; scholar loop
live on `main`; surfaces (this MCP) now live; media/practice loop only
acceptance-gated; **W9 endgame recipes are so far spec only** (R1–R9 in
`docs/endgame/endgame-recipes.md`).

**ENDGAME.md**: variety 1 (signed essay) ~90% — PUSHBACK destroy-pass not
built; varieties 2–7 vary from live to spec. Variety 5 (Treeka view) needs one
assembler tool.

## 4. The ten jobs for next session

1. **Human-score the blind set.** 40 of ours vs MITRA-MT on the 27 full-coverage
   passages. Run `tools/eval_score_sheet.py` (already tested), fill the sheet,
   `tools/eval_tally.py`. This closes W5 and decides W6.
2. **Corpus defects**: `bodhavilasa` rows all claim the full 88-id file
   (re-split per verse); `sivastotravali` one dropped segment of 521; `ipvv` ×5
   partials (13–38% of 772–1,961 segments) — finish or mark partial in data.
3. **Extend J1**: certificates for the whole wheel pack, not 44 forms. Same
   receipt-hash rule: never claim `lean_status=checked` without a matching pack.
4. **Build J3 must-fail twins**: for each accepted translation, the strongest
   plausible wrong reading must be rejected by evidence rules. This is the
   closest thing to a machine proof of translation the plans allow.
5. **W7 `auto_pipeline.py`**: t1→l0→argmap→l2→c1 driver, stamps model/date/
   prompt-hash, stops on gate failure, writes only to a private candidate area.
6. **W8 denominators**: reconcile 570+ Muktabodha catalogue IDs, IFP
   transcripts, Gokarna holdings against OpenPatala; publish coverage as
   fraction of a named collection, never volume of output.
7. **PUSHBACK pass** for variety 1 (signed essay): destroy-pass before audit.
8. **Treeka assembler**: one tool turning gaps into a view (variety 5).
9. **Witness column** (MASTERPLAN2 W4): variant graph + invariants (one reading
   per locus, acyclic contamination, translations cite attested readings only).
10. **W6 decision record**: explicitly decline or scope training after W5
    results; write it down either way.

## 5. Known blockers (do not paper over)

- **Human review time** is the real constraint for W5, W8 and J3. No machine
  substitute; say so in any status.
- **Authority bibliography lives on PG18**; this box is PG15 with a 1,034-work
  mirror. 427 `PTW_*` works are upstream stubs (id + type only).
- **10 blind passages** have no translation of ours (Tantrāloka a01/a03/a04/
  a06/a08/a09/a10/a13/a15/a16) — parse stage only.
- **`translation-work` and `sleepdraw` are CLI**, not MCP. Wrapping them is a
  small, honest job nobody has done.
- **Shared bearer token** on the public MCP. Rotate before wider sharing; OAuth
  is unbuilt.

## 6. Exact commands

```sh
# health and stack
curl -s https://mcp.sanskrit.help/health
systemctl status svatantrya-mcp.service svatantrya-mcp-tunnel.service

# corpus validation
cd /root/translation-work && python3 tools/validate_layers.py --match tantrasara
python3 tools/validate_layers.py            # whole corpus, exit 2 on defects

# blind eval loop
cd /root/svread
python3 tools/eval_export_ours.py
python3 tools/eval_score_sheet.py --a data/eval/candidates/ours.json \
  --b data/eval/candidates/mitra-mt.json \
  --a-manifest data/eval/candidates/ours.manifest.json \
  --out experiments/mitra-mt/scoring --seed 20261111
python3 tools/eval_tally.py --sheet experiments/mitra-mt/scoring/sheet.json \
  --key experiments/mitra-mt/scoring/key.json

# gates + catalogue + docs
python3 tools/check_licenses.py --check
python3 tools/emit_estate_index.py --check
python3 tools/emit_endgame_docs.py --check
python3 scripts/release_manifest.py && node --test tests/*.test.cjs

# deploy (site) — then commit the manifest + sw bump
./deploy.sh
```

## 7. Repo state at handover

- `svread` — `main` deployed, all tests green (110 node tests, manifest PASS,
  seo 10/10)
- `ipvv` — PR #12 open (Google auth + wheel gates)
- `trika-x` — PRs #11 (Lean slice, updated with 2026-11-10 chunks), #10, #9, #8
- `translation-work` — PR #20 (validator), #18 (Muktabodha burn)
- `bookfactory` — PR #1 (root env override)
- `openpatala` — PR #1 (stale-plan banners)
- `videofactory` — clean; a stray `videofactory/videofactory/` 1.5 MB copy is
  untracked and should be quarantined or deleted
- `bruno` — untracked data drops (`sanskrit/r2-packs`, `sources/panini`),
  deliberate

## 8. ChatGPT plugin and MCP consolidation (2026-11-12)

- The live Svatantrya connector is `https://mcp.sanskrit.help/mcp`, bearer
  authenticated. The last recorded live catalogue has 198 tools across 7
  configured local servers. The agent-facing roles and setup remain in
  `CHATGPT-PLUGIN.md` and `mcp/gateway/README.md`.
- Satsang already exposes a public read-only Streamable HTTP MCP at
  `https://mcp.tantrafiles.xyz/mcp`; its server card documents 28 directory
  tools. It is now configured as a remote gateway source with an explicit
  allowlist, exposed as `satsang__*`. The allowlist is deliberate: upstream
  additions do not become tools until reviewed here.
- The Satsang gateway change is on branch
  `feature/satsang-remote-mcp-2026-11-12`. The live connector remains at 198
  tools until the branch is merged and `svatantrya-mcp` is restarted; with all
  28 Satsang tools available, the catalogue should be about 226. Confirm the
  actual count using `tools/list` because the gateway discovers tools at
  runtime and reports unavailable children separately.
- The focused config/catalogue suite passed 3/3 in the development checkout;
  Python syntax, JSON parsing and `git diff --check` passed. A live remote
  handshake was not available in that checkout. Verify the remote call and
  `gateway__problems` on the host before treating Satsang as live.
- The `prx0r/nibbanahelp` repository lookup returned 404 through the GitHub
  connector. Resolve the correct repo name/access before adding it to the
  gateway; do not invent a local path.
- Other ChatGPT roles remain: Scholar for passage evidence, essays and
  revision-bound review; OpenPatala for canonical work identity and dossiers;
  translation-work for L0–L4 and Beam/Iceman; BookFactory and VideoFactory for
  derived media. Keep generation, review, author sign-off, publication and
  deployment as separate recorded gates.
- PR #26 is open from `feature/satsang-remote-mcp-2026-11-12` and was
  mergeable on the first GitHub read; no CI statuses were returned. Next:
  review/merge it, restart `svatantrya-mcp`, then confirm
  `satsang__search_places`, sourced place records, and the updated dynamic tool
  list. Do not deploy the Svread site as a substitute for restarting the MCP
  service.
