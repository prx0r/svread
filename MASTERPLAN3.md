# MASTERPLAN 3 — svatantrya: full plan, files, and dev steps

**Date:** 2026-11-11 · **Owner:** prx0r · **Supersedes:** all ad-hoc plans from
this session (`PLAN-VERIFIED-RUNTIME.md`, `CHATGPT-ENDGAME-PLAN.md`,
`MCP-FEDERATION-REVIEW.md`, `AUTH-AND-PROGRESS.md`, `LEAN-AND-SANSKRIT-SYNTHESIS.md`)
— those remain as background evidence; this is the operative document.

**North star (About page, verbatim):** free reusable translations of important
Sanskrit texts · free AI pipelines to create and publish your own translations,
essays, books, video explainers, podcasts, courses, interactive practise
modules · formalisation of tantric traditions and practices · the realisation of
freedom for everyone, by themselves, independent of institutions.

**Strategy in one line:** be the **verification layer and runtime alongside
ChatGPT** — the model proposes, the site proves, the human signs.

---

# Part 0 — Verified state (evidence, not memory)

Reproduce with the commands given; never quote from memory.

| Claim | Evidence | Command |
|---|---|---|
| svread CI green | run `92d8f538`, 88 tests: 75 pass, 12 skip (browser), 0 fail | `gh run list -L1` |
| Manifest pinned | 11k+ assets | `python3 scripts/release_manifest.py` |
| SEO gates green | 10/10, 909 claim pages | `python3 tools/seo_check.py` |
| Wheel datasets deterministic | `--check` green | `python3 tools/emit_wheels.py --check` |
| Grammar pack | 45 entries, 44 DERIVED | `python3 tools/emit_grammar.py --check` |
| Crosscheck | 20 agree, 1 special (katham), 3 gaps | `python3 tools/check_curated.py` |
| Answer pages | 45 pages + index | `python3 tools/emit_answers.py --check` |
| Harness | one fetch, 101 KB, 26 pack entries | `python3 tools/emit_harness.py --check` |
| About | verbatim + `about.json` | `python3 tools/emit_about.py --check` |
| Google auth | site account, server-verified | `POST /api/auth/google` |
| ORCID | publishing credential only | UI copy + `AUTH-AND-PROGRESS.md` |
| Progress tables | `learner_progress`, `learner_attempts` (empty) | `wrangler d1 execute ipvv --remote` |
| MCP stdio local | 37 tools incl. 4 wheel tools | `mcp/scholar_server.py` |
| Federation MCP local | 104 tools, 5 children, FailOpen | `trika-x/formal-trika/tools/federation_gateway.py` |
| Kaggle | priortrades, 30 GPU-h / 20 TPU-h per week | `kaggle quota` |
| Email | om@svatantrya.net forwards (receive only) | CF Email Routing rule "om" |

**CI root cause fixed today:** `Path.exists()` raises `PermissionError` when the
runner cannot traverse `/root`. `tools/emit_discovery.py` and
`tools/emit_wheels.py` now treat unreadable paths as absent
(`_readable`/`_ok` helpers). Do not regress this: any new emitter that touches a
sibling repo must use the same guard.

---

# Part 1 — Why this design (justifications, each traceable)

1. **Server-scored gates, not client booleans.** `journey.js` scores in the
   browser, so ChatGPT (or a user) can assert a pass. Progress must be written
   only by the server, in the same transaction as the score. Justification:
   the gate is the product's promise; a self-reported score is marketing.
2. **Certificates, not live theorem proving.** Measured on this box: Lean warm
   ≈ 280–380 ms per file, cold ≈ 3 s. Twenty live checks ≈ 6 s per gate. So:
   precompute certificates, verify by hash (~1 ms) or a tiny Python checker
   (~5 ms), and batch Lean (~0.4 s) in CI or on demand.
3. **Three stamps, never merged.** Bytes (hash) ≠ mechanics (Lean/Vidyut) ≠
   meaning (human). `trika-x/formal-trika/control/TattvaInventory.lean` says it
   plainly: the list is "curated data, not a derivation from Sanskrit". A proof
   of consistency is not a proof of interpretation.
4. **No Custom GPT Actions.** Actions are being retired and are mutually
   exclusive with MCP apps; "plugin" now means MCP. Build one remote MCP.
5. **Read sheaf before write sheaf.** ChatGPT Plus/Pro custom MCP = read/fetch
   only; writes need Business+. Ship the learning loop on any plan; gate writes
   behind a scope check.
6. **Benchmark before training.** Training on machine-proposed layers is
   self-distillation. No model change ships without beating the held-out set.
7. **Licences before data.** Mitrasaṃgraha: 372,791 pairs CC BY-SA; the extra
   18,757 are CC BY-NC-ND. Restricted slices never enter a bundled corpus.
8. **Fail closed, label always.** BLOCKED English never returned; unlisted
   forms never rendered; `AGREE` means "machine confirms curation", not truth.

---

# Part 2 — Repository map (files this plan touches)

### svread (this repo — public surface + verification)
```
app.js                     reader, scholar view, word panel, Google exchange
index.html                 shell, nav (Library/Scholar/Sanskrit/Index/Wheels/About)
styles.css                 reader + scholar + account widget styles
wheels.html / wheels.js    wheel flow, discs, script combos, levels, drill
journey.js                 centre-out journey (client scoring today → server in W1)
sw.js / deploy.sh          cache bump + wrangler pages deploy
about/                     index.html, index.md, about.json (emitter-owned)
a/<slug>/                  one-URL answers (emitter-owned)
data/wheels/               word|sentence|trika|karaka.json, harness.json,
                           HARNESS.md, tutor/level-0{1..6}*.md, concepts/
data/grammar/              wheel-pack.json, wheel-links.json, crosscheck.json
data/sanskrit/             bookfactory lessons + rule boxes + provenance
data/traces/, data/verify/, claim/, work/, chain/   909 pages + packs
vendor/sanskrit-bruno-wheels/   MIT curated tier (byte-identical upstream)
tools/emit_*.py            traces, verify, biblio, formal, claim_pages,
                           discovery, sanskrit, grammar, wheels, harness, about, answers
tools/check_curated.py     curated-vs-machine crosscheck (node + vidyut)
tools/lingua.py            shared ID resolver (env-var roots)
tools/seo_check.py         ten gates
scripts/release_manifest.py   pins every asset; run LAST
mcp/scholar_server.py      37-tool stdio MCP (add wheel/gate tools here too)
tests/*.cjs                node suite (CI); tests/mcp/*.py for MCP
```

### ipvv (backend: auth, chat, scholar API, D1)
```
worker/src/index.js        routes: /api/auth/*, /api/chat/:work, /api/read,
                           /api/scholar/*, /mcp (stale)
worker/schema.sql          profiles, scholar_* tables
worker/migrations/0013_google_auth_and_progress.sql
                           auth_uid + learner_progress + learner_attempts
worker/wrangler.toml       D1 binding (ipvv), audio bucket
```

### translation-work (evidence layers + gates)
```
check.py                   canonical gate
mcp_server.py              16-tool stdio MCP (status/validate/lore/swarm…)
tools/                     build_l0, proof_record, emit_site, mitra_grounds,
                           vidyut_candidates, build_c1sum…
<work>/data/*.json         t1/l0/argmap/l2/c1/l3/l4 per passage
REGISTRY.json              gold/pending (machine-proposed ≠ human-approved)
```

### trika-x (formal + federation)
```
formal-trika/control/*.lean     named models + must-fail twins
formal-trika/data/treeka.json   passages/arguments/gaps
formal-trika/tools/federation_gateway.py   104-tool parent, FailOpen
formal-trika/data/federation-children.json 5 children: scholar, bookfactory,
                                            translation, video, openpatala_mcp
tools/mcp_catalog.py            catalog drift gate (banned-action guard)
```

### siblings (read-only)
```
/root/satsang/auth/src/*.js   Google sign-in worker (reused; we added
                              svatantrya.net to SITE_ORIGINS)
/root/openpatala/patala/mcp_server.py   identity tools (resolve/bundle/search)
/root/bookfactory/bf_mcp/server.py      books (22 tools)
/root/videofactory/vf_mcp_server.py     video (18 tools)
/root/deitybody/data/curriculum.json    Mātṛkā 10 stages
/root/deitybody/practice/CURRICULUM_CARDS.md  DO / MIND / NOT / SOURCE
```

---

# Part 3 — Workstreams with dev steps

## W1 — Uncheatable learning (gate + progress)

**Goal.** A model cannot fake or skip a level; site and ChatGPT share one record.

**Justification.** Gate is the product promise; `journey.js` currently scores
client-side; `learner_progress` already exists (migration 0013).

**Files**
- Modify `ipvv/worker/src/index.js`: add `POST /api/wheel/gate/start`,
  `POST /api/wheel/gate/submit`; reuse `sessUid()` and `signTok()` patterns;
  accept `Authorization: Bearer` **or** `svsess` cookie.
- New `ipvv/worker/migrations/0014_gate_sessions.sql`: `gate_sessions(id,
  user_id, curriculum, stage, items_json, key_json, expires_at, used)`.
- Modify `journey.js`: replace local scoring with server calls; keep local score
  labelled "unverified local score" when signed out.
- New `tools/emit_gate_pools.py`: derive item pools per curriculum/stage from
  `data/wheels/*.json` + `vendor/…/data.js`, deterministic, `--check`.
- New `tests/gate.test.cjs`: contract tests (see acceptance).

**Data contract**
```
POST /api/wheel/gate/start  {curriculum}            → {session_id, items[20], n:20, pass:18}
    items[]: {item_id, prompt, options[4]}          (never the key)
POST /api/wheel/gate/submit {session_id, answers[]} → {score, passed, next_stage, unlock_url}
```
Rules: cumulative mix (current stage + earlier, weighted); 20 items; 18 pass;
one active session; 10-min expiry; 3 attempts/hour; replay inert; stage written
only here.

**Dev steps**
1. Migration 0014 + apply remote.
2. `emit_gate_pools.py` → `data/wheels/gates.json` (pools + counts).
3. Endpoints; write `learner_attempts` receipt with served items and answers.
4. `journey.js`: start → render 20 → submit → show server verdict; unlock link.
5. ChatGPT path: same endpoints, bearer token (after W3 OAuth).

**Acceptance**
- 17/20 → no unlock; 18/20 → unlock once; second submit with same session → 409.
- Hand-shrink a pool in `data/` → `emit_gate_pools.py --check` fails.
- Signed-out still works locally with the "unverified" label.
- `node --test tests/gate.test.cjs` green; `tests/wheels.test.cjs` unchanged.

**Depends on:** none (Google + tables live).

---

## W2 — The mechanics stamp (certificates)

**Goal.** A derivation is a re-checkable object with a hash.

**Justification.** We store Vidyut traces "unreviewed" and tell readers so. A
certificate turns that admission into a checked artifact. Measured Lean cost
justifies precomputation.

**Files**
- New `formal-trika/control/PrakriyaSlice.lean`: rule slice for our 44 forms
  (guṇa/vṛddhi 7.3.84/6.1.78, ṅīp 4.1.5, sup 4.1.2/7.1.x, tasil/tral/dā/thāl
  5.3.7/10/15/23, `as` 2.4.72/8.4.68). Small on purpose.
- New `tools/emit_certificates.py`: reads `data/grammar/wheel-pack.json`, writes
  `data/grammar/certificates.json`; `--check`.
- Modify `tools/emit_answers.py`: add `cert_sha` + "checked" block from
  certificates (never invent; if absent, say "certificate pending").
- Modify `tools/emit_harness.py`: include `certificates` index + tier note.
- Modify `mcp/scholar_server.py`: add `wheel_certificate(form)`.
- New `tests/certificates.test.cjs`.

**Data contract**
```json
{"format":"svatantrya.certificates/1","generator":{"lean":"4.34.1"},
 "entries":[{"pack_id":"sarva-tral","form":"sarvatra",
   "steps":[{"sutra":"5.3.10","before":"sarvatral","after":"sarvatra"}],
   "rule_table_sha":"…","lean_ok":true,"cert_sha":"…"}]}
```

**Dev steps**
1. Formalize slice; prove each rule's applicability shape; add a mutant per rule.
2. Emit certificates from pack traces; batch Lean check in one file.
3. Answer pages: verdict → certificate → full trace (tier order).
4. `wheel_certificate` MCP tool returns certificate + tier-2 result.
5. CI: `--check` on certificates + Lean batch.

**Acceptance**
- Every one of the 45 answer pages carries `cert_sha` or an explicit
  "certificate pending".
- Corrupt one step in a fixture → checker fails closed.
- `lean` batch for all 44 ≤ 2 s.

**Depends on:** grammar pack (live).

---

## W3 — Access layer (ChatGPT, no Actions)

**Goal.** ChatGPT reaches us from scratch; read now, write when scope allows.

**Justification.** All MCPs are stdio; ChatGPT needs HTTPS (SSE or Streamable
HTTP) and supports Secure MCP Tunnel for private hosts. Actions are the wrong
path.

**Files**
- New `tools/mcp_bridge.py`: HTTP⇄stdio bridge over
  `trika-x/formal-trika/tools/federation_gateway.py`.
  - `POST /mcp` (JSON-RPC), `GET /mcp` (SSE), `DELETE /mcp` (session end),
    `GET /health`, `GET /tools.json`, `GET /call?tool=&args=`.
  - Auth: mixed — open `initialize`/`tools/list`; per-tool bearer.
  - Limits: 60 s/call, 10 concurrent, 64 KB body; job ids for long work.
- New `tools/mcp_bridge_selftest.py`: protocol negotiation, FailOpen, auth,
  limits.
- Modify `ipvv/worker/src/index.js`: OAuth server for the write sheaf:
  `/oauth/authorize`, `/oauth/token`, `/.well-known/oauth-authorization-server`
  (advertise `offline_access`), revoke; opaque tokens hashed in D1
  (`0015_oauth_tokens.sql`).
- New `data/mcp.json` + `llms.txt` entry: server URL, auth note, tool list.

**Dev steps**
1. Bridge + selftest locally against the federation (104 tools).
2. Tunnel (`cloudflared`) → verify `initialize`/`tools/list` over HTTPS.
3. Add connector in ChatGPT (Secure MCP Tunnel first), scan tools.
4. OAuth read scope, then write scope for progress only.
5. Publish `tools.json` + `/call` browse shim for non-connector reading.

**Acceptance**
- `initialize` → ≥104 tools; `wheel_verify katham` → `DISAGREE_STANDS`.
- Kill `bookfactory` → catalogue loses its 22 tools, parent stays up.
- `curl` `/call?tool=wheel_verify&args=…` (no protocol) answers.
- Junk bearer → 401; expired token → 401; revoked token → 401.

**Depends on:** W2 (so tools return proofs).

---

## W4 — Practice surface (curriculum)

**Goal.** The missing tab; learning as a product, not a demo.

**Justification.** `deitybody/data/curriculum.json` (10 stages) and
`practice/CURRICULUM_CARDS.md` already exist with attested sources; the site has
no practice route (`grep "practice\|practise" app.js` = 0).

**Files**
- New `tools/emit_practice.py`: vendors to `data/practice/curriculum.json`,
  `cards.json` (parse DO/MIND/NOT/SOURCE), `stages/*.md`; provenance hashes;
  `--check`.
- Modify `app.js`: `?view=practice` route (three tracks: Wheels embed, Mātṛkā,
  Reader drill), nav item.
- Modify `styles.css`: practice layout.
- New `tests/practice.test.cjs`: 10 stages; card text matches source; gate uses
  W1 endpoint; no new claims.

**Dev steps**
1. Emit + pin provenance; assert source hash.
2. Route + track UI; embed wheels journey (no duplication).
3. Wire Mātṛkā stage gates to W1 (server-scored).
4. Add "copy ChatGPT prompt" per stage (same pattern as journey).

**Acceptance:** 10 stages render; byte-identical card text; Mātṛkā stage 1 gate
is server-scored; `seo_check` stays green.

**Depends on:** W1.

---

## W5 — Measurement (benchmark + licences)

**Goal.** Replace "our way works well" with a number; make data lawful.

**Files**
- New `data/eval/trika-blind-50.json` (+ `.md` rubric): 50 held-out passages,
  categories, expected difficulty; **never** used in prompts.
- New `tools/eval_blind.py`: runs candidates (pipeline export, MITRA-MT output,
  tool stack), scores correction effort, writes `data/eval/results-<date>.json`.
- New `data/licenses/registry.json` + `tools/check_licenses.py`: per dataset
  release/checksum/attribution/allowed uses; pipeline refuses unregistered data.
- Fix `trika-x/formal-trika/tools/treeka_report.py`: `--work` must scope counts
  (audit finding).

**Dev steps**
1. Assemble 50 passages from existing bundles (L0-rich, compounds, negation).
2. Define rubric: edits, wrong terms, unsupported additions, survives gates.
3. Baseline run on current pipeline; record.
4. Add MITRA-MT candidate (Kaggle batch, see Part 5).
5. Licence registry; gate the loader.

**Acceptance:** one results table per candidate; a dataset without a registry
row cannot be loaded; `treeka_report.py --work X` prints only X's counts.

**Depends on:** nothing; start in parallel.

---

## W6 — Training (only after W5)

**Goal.** Fix specialist weak spots without self-distillation.

**Files**
- New `tools/constrain_glossary.py`: decode-time glossary constraint from
  `translation-work/lore/trika_glossary_index.json` + `lore/concepts/`.
- New `kaggle/` (kernels): `svatantrya-lora-style`, `svatantrya-eval-mitra`,
  `svatantrya-asr-bench` (see Part 5 guardrails).
- New `data/training/cards.json`: dataset checksum, licence, seeds, eval score.

**Order + acceptance**
1. Glossary-constrained decoding: term-consistency up, no meaning changes,
   beats baseline on W5.
2. Style LoRA on **signed C1 only** (never unsigned layers): beats baseline on
   held-out style ratings, no source-meaning edits.
3. Translation LoRA only with ≥200 human-signed passages; otherwise not built.

**Depends on:** W5.

---

## W7 — Factory (more works)

**Goal.** The content engine with the benchmark as admission control.

**Files**
- New `translation-work/tools/auto_pipeline.py`: job-per-layer driver
  (`t1 → l0 → argmap → l2 → c1`), stamps model/date/prompt-hash, stops on gate
  failure; writes to `<work>/data/` only.
- Modify `translation-work/check.py` usage in CI: fail on any BLOCKED leaking
  into a reader bundle.
- Reuse `tools/emit_verify.py`, `tools/emit_claim_pages.py`,
  `tools/emit_traces.py`, `tools/emit_biblio.py` (svread).
- New `tools/emit_patala.py`: push work/edition/passage + tradition to
  openpatala API (`:8821`), idempotent, fail-closed.

**Dev steps**
1. Pick one small work; run driver; keep every failure BLOCKED.
2. Emit reader bundle → verify pack → claim pages.
3. openpatala categorisation; verify IDs resolve.
4. Blind eval on the new work; publish only with "machine-proposed" labels.

**Acceptance:** source → gated layers → reader → claims → openpatala with zero
manual layer edits, and every page says machine-proposed until signed.

**Depends on:** W5 (admission), W3 (ChatGPT driving).

---

# Part 4 — Sequencing

| Wave | When | Ships | Gate to next wave |
|---|---|---|---|
| 1 | this week | W1 gate+progress, W2 certificates, W5 scaffolding | 18/20 server unlock; certs on all pages |
| 2 | 2–3 weeks | W3 bridge+tunnel (read), W4 practice tab, W5 results | ChatGPT calls tools; practice gated |
| 3 | month+ | W3 write scope, W6 constrained decoding → style LoRA, W7 one work | eval beats baseline; one work end-to-end |

Always-on: CI green on fresh checkout; manifest last; no blanket skips;
PR #9 / #11 reviewed with tests; flagship showcase = Pratyabhijñāhṛdaya with
three stamps.

---

# Part 5 — Kaggle compute (credential live, guardrails strict)

**Credential (never in the repo):**
```
~/.kaggle/access_token        (chmod 600)  ← already installed
KAGGLE_API_TOKEN              (env var, if preferred)
account: priortrades
quota: 30 GPU-h / 20 TPU-h per week
```

**What Kaggle is for:** batch only — MITRA-MT inference on the blind set, ASR
benchmarking (Su-śrotā), LoRA/CPT fits, bulk corpus processing. **Never** the
runtime: no inbound ports, ephemeral disk, sessions sleep.

**Hard guardrail — do not touch the chanting work.**
Read-only, forever, without an explicit owner instruction:
- dataset `priortrades/kashmir-chant-cards` (111 MB, "gold")
- kernel `priortrades/vagdhenu-chant-gpu`
- anything else matching `chant|vagdhenu|kashmir`.

**Naming and isolation**
- New datasets: `priortrades/svatantrya-<thing>` (private unless explicitly
  made public).
- New kernels: `priortrades/svatantrya-<task>`; each pins its dataset version.
- Never `kaggle datasets version` on an existing non-svatantrya dataset.

**Artifact return path**
Every run writes `results.json` + `run.json` (model id, versions, seeds,
dataset checksums, licence) and uploads to a **new** svatantrya dataset; we
vendor the JSON back into `data/eval/` or `data/training/cards.json`. GPU
output never becomes canonical text without W5/W6 gates.

**Planned notebooks**
1. `svatantrya-eval-mitra` — MITRA-MT over `trika-blind-50`, correction-effort
   scoring.
2. `svatantrya-asr-bench` — Su-śrotā vs baseline on our recordings; vowel
   length and aspiration errors counted separately.
3. `svatantrya-lora-style` — LoRA on signed C1 only; must beat baseline.
4. `svatantrya-corpus-batch` — sandhi split / morphology over intake, outputs
   datasets only.

**Cost discipline:** 30 h/week covers ~4 runs of the above; log GPU-hours per
run in `data/training/cards.json`; never leave a kernel running.

---

# Part 6 — Secrets and environments (inventory)

| Secret | Where | Never |
|---|---|---|
| CLOUDFLARE_API_TOKEN | `/root/.cf-api-token` | repo, logs |
| R2 keys | `/root/.r2-env` | repo |
| SESSION_SECRET, ORCID_CLIENT_* | CF Worker secrets | repo |
| Kaggle token | `~/.kaggle/access_token` | repo |
| Google client id | satsang `wrangler.toml` (public id) | n/a |

Deploys: `./deploy.sh` (svread, bumps SW + manifest), `wrangler deploy`
(ipvv worker, satsang-auth), `wrangler d1 execute` for migrations.

---

# Part 7 — Definition of done

**Learning.** An outsider signs in with Google, is tested by ChatGPT and by the
site, and both see the same server-written progress; no level can be skipped.

**Proof.** Every answer page carries a certificate hash that a stranger can
re-check without our code, plus a byte hash for the text and a human sign-off
field that is honest when empty.

**Production.** One work goes source → gated layers → reader → claim pages →
openpatala with zero manual layer edits, and says "machine-proposed" where that
is true.

**Access.** ChatGPT adds one connector and, in a fresh chat, can learn, verify,
and (Business+) record progress — with no pasted instructions and no Actions.

---

# Part 8 — Risks

1. Plan tier blocks writes → split sheaves; read path ships anyway.
2. Single-box runtime → FailOpen + `/health` + JSON `/call` fallback.
3. Licence contamination → registry gate (W5) before loader.
4. Self-distillation → signed-only data; eval admission (W6).
5. Formalisation overreach → three stamps printed on every page.
6. `/root` assumptions in CI → safe-path guard (fixed; keep it).
7. Kaggle quota burn → per-run logging, 4 planned notebooks only.

---

# Part 9 — Next five actions (start here)

1. `0014_gate_sessions.sql` + `/api/wheel/gate/{start,submit}` (W1).
2. `tools/emit_gate_pools.py` + Lean pool invariants with mutants (W1 J5).
3. `tools/emit_certificates.py` + `PrakriyaSlice.lean` (W2).
4. `tools/mcp_bridge.py` + Secure MCP Tunnel, read sheaf live (W3).
5. `tools/emit_practice.py` + `?view=practice` (W4).

Each is independently shippable. Together they turn the library into an
instrument: the model proposes, the site proves, the person signs.
