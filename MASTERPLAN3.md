# MASTERPLAN 3 — svatantrya: full plan, files, and dev steps

**Date:** 2026-11-11 · **Owner:** prx0r · **Status:** operative strategy, with
the evidence correction below taking precedence over older implementation notes.
It consolidates the ad-hoc plans from this session (`PLAN-VERIFIED-RUNTIME.md`, `CHATGPT-ENDGAME-PLAN.md`,
`MCP-FEDERATION-REVIEW.md`, `AUTH-AND-PROGRESS.md`, `LEAN-AND-SANSKRIT-SYNTHESIS.md`)
— those remain as background evidence; this is the operative document.

**North star (About page, verbatim):** free reusable translations of important
Sanskrit texts · free AI pipelines to create and publish your own translations,
essays, books, video explainers, podcasts, courses, interactive practise
modules · formalisation of tantric traditions and practices · the realisation of
freedom for everyone, by themselves, independent of institutions.

**Corpus endgame:** systematically catalogue and translate the Muktabodha
holdings, with English as the first production language. The first translation
campaign is the complete searchable e-text collection. The longer programme
also accounts for the IFP paper transcripts and Gokarna Vedic collections;
image-only or fragmentary items need a transcription and source-review stage
before they can enter translation. Muktabodha currently describes more than
3,000 digitally preserved items, over 570 searchable e-texts, over 2,000 IFP
transcripts, and a separate Vedic manuscript collection
([collection overview](https://muktabodha.org/digital-library/)). A 499-item
work queue is therefore a working subset, not a complete corpus denominator.

**Near-term product test:** one complete, rights-cleared short work moves from
an identified source edition through full passage coverage and independent
review into a reader, a learning path, and a reusable book-generation input. A
reader can inspect the Sanskrit, compare distinct translations where reuse is
authorized, follow each wording to its source, and see where translators or
editors differ. Preserve those differences; do not imply that one machine
wording settles the interpretation. Rights and source metadata are part of the
product.

**Strategy in one line:** be a source-aware reading and learning system alongside
AI assistants: the software checks defined bytes, schemas, and computations;
qualified reviewers assess linguistic and interpretive claims; publication is
deliberate and human-controlled. A software check is never presented as proof
that a translation or interpretation is true.

---

# Part 0 — Current state (snapshot; recheck before implementation)

The counts and infrastructure claims in earlier drafts are historical until
reproduced. This snapshot was refreshed on 2026-11-11 against `svread` main at
`0b929e6a` (PR #14 is merged) and the inspected `ipvv` master at `c2cb6b3`.
PR state and workflow results below refer to the exact heads named; repository
facts do not prove that deployed services have the same state.

| Area | Verified state | Consequence |
|---|---|---|
| `svread` main / PR #14 | PR #14 merged as `0b929e6a`; its review recorded 82 Node checks passing, 0 failing, 12 skipped and 40 MCP checks passing, 1 skipped. The earlier run [42973083646](https://github.com/prx0r/svread/actions/runs/42973083646) was before that merge and failed on a stale manifest. | Treat the merged PR's test report as a pinned result, not a guarantee about later main or deployment. |
| Release / source checks | Current main's claim-page byte checks, negative tests, and Ghaṭakarpara English hold pass. | Preserve the source-byte and publication-hold gates. |
| Edition metadata | Release-manifest check reports 95 works and 37 without a named source edition. | Treat edition/witness identification as a publication blocker for affected works; do not let a valid byte hash imply a reliable source text. |
| Gate UI | `journey.js` calls `/api/wheel/progress` and `/api/wheel/gate/{start,submit}`. | Client references do not mean the routes exist or are deployed. |
| Public gate bank | `data/wheels/gates.json` contains answers for all 61 public items. | This is public practice material; it cannot support secure assessment or mastery claims. |
| `ipvv` backend | Inspected `c2cb6b3` has none of the wheel gate routes, `gate_sessions`, migration 0013/0014, `learner_progress`, or `learner_attempts`. | W1 is not shipped. The old plan's “tables live” statement was wrong. |
| Gate integration test | In `node --test tests/gate.test.cjs` with `IPVV_ROOT` set to that checkout, 4 checks pass and the route-presence integration check fails because the routes are absent. | Keep this failure visible until the backend is implemented and reviewed. |
| OpenPatala interface | Current OpenPatala main has a 46-route GET API and a 5-tool stdio MCP. The MCP `search`/`resolve` implementations scan up to 10,000 works; `get_frontier` returns a general work list rather than a translation/source frontier. No MCP write/job tools exist. | OpenPatala is the right registry owner, but its MCP is not yet the promised control panel. Build a narrow typed service contract before exposing job writes. |
| OpenPatala credentials | Current `patala/db/connection.py` defaults to a password-free local URL, while `patala/db/store.py` still has a `patala:patala` fallback. PR #16 in `svread` copies that value into `OPENPATALA-CONNECTION.md`; its latest head `bca2e47c` has Reader integrity run [42982438119](https://github.com/prx0r/svread/actions/runs/42982438119) passing. | Remove password-bearing examples/defaults, use the approved secret mechanism, and rotate the value if it was used beyond an isolated local database. A green docs check does not clear credential handling. |
| Muktabodha scope | The official overview describes three distinct collections: searchable e-texts, IFP paper transcripts, and Gokarna Vedic manuscripts. The current translation-work queue has 499 rows, not a demonstrated census of all three collections. | Count every catalogued item; give exclusions an explicit reason; track transcription readiness separately from translation. |
| translation-work PR #18 | Current head `0ad2804d` adds a 499-row queue, 492 ranked rows, and 355 discovery rows. Seven queued Buddhist records are filtered out; 270/355 discovery records report zero confirmed translations across three queried sources. Its 980 assessor entries are process judgments, not named human Sanskrit reviews. The head has no PR workflow runs or commit statuses. | Keep the full denominator and label search completeness; zero hits are “not found in these searches,” not “untranslated.” No translation-complete claim is supported by these discovery counts. |
| PR #18 reproducibility/security | `prioritize_mukta.py` reads `/tmp/mukta_census.json` and a `/root/openpatalaproject` index; read errors silently become empty data and default to `T=0` (“unserved”). `mukta_deepfind_batch.py` hardcodes `/root` imports and a `patala:patala` DB password. | Pin inputs, use repository/config roots and environment-based credentials, and make missing data an explicit blocked/error state before merge or batch runs. |
| Kulārṇavatantra sample in PR #18 | `T1-kul-p04.md` / `p05.md` and their parsed JSON are machine-proposed glosses; parsed `quick_english` is blank for all 25 verses in each file. The p04 glosses omit the first half of verses; p05 labels the colophon and next chapter as vv.122–125. Muktabodha M00031's text ends ullāsa I at v.121, has a colophon, then starts ullāsa II at v.1. | Treat the files as partial machine artifacts, not translations or full source coverage. Passage locators must preserve chapter-local numbering and paratext. |
| Runtime credentials / quotas | Not verified for this snapshot. | Check live provider settings immediately before use; do not bake quotas or secret paths into the plan. |

Reproduction notes for this audit: `python3 scripts/release_manifest.py` reported
11,029 asset hashes, 95 works, 55 Scholar projections, and 37 works without a
named source edition. `node --test tests/gate.test.cjs` with `IPVV_ROOT` set to
the inspected checkout reported four passing checks and one failed assertion
for route presence because those routes are absent. The public-key count comes
from `data/wheels/gates.json`.

**How to refresh this section:** record checkout revisions, exact commands,
results, and date. Use explicit repo-root variables such as `SVREAD_ROOT` and
`IPVV_ROOT`; never infer that a sibling checkout exists under `/root`. A
passing unit or emitter check verifies only the condition it exercises, not
production deployment, authorization, translation quality, or user outcomes.

---

# Part 1 — Why this design (justifications, each traceable)

1. **Separate practice from assessment.** Public answer keys make the current
   wheel bank useful for practice but unsuitable for a secure assessment.
   Server-side scoring can protect the integrity of a stored result only when
   the bank and eligibility rules are server-controlled; it does not prove
   mastery. Call it low-stakes progress until an unseen, rights-cleared item
   pool, reviewed scoring policy, and abuse controls exist.
2. **Make checks reproducible, not ceremonial.** Hashes identify bytes but do
   not validate a derivation. Run the actual checker against pinned inputs;
   cache or precompute only when measured runtime makes it useful, and preserve
   the checker version, command, result, and source revisions in the receipt.
3. **Keep evidence types distinct.** Byte identity, a formalized mechanical
   derivation, philological evidence, and human interpretation answer different
   questions. A Lean theorem proves a statement in its encoded system; it does
   not by itself establish that the encoding captures Sanskrit usage or that a
   reading is correct.
4. **Use a supported integration path.** Choose one maintained remote tool
   protocol after checking the current official spec and the deployed host.
   Do not hard-code a product feature's retirement, exclusivity, or transport
   behavior into this plan.
5. **Read before write.** Begin with source-backed, read-only functions. Add
   writes only when the specific tool has explicit user consent, narrow
   authorization, auditability, and a tested recovery path. Do not tie these
   rules to subscription tiers; verify the actual granted scopes.
6. **Benchmark before training.** Training on machine-proposed layers is
   self-distillation. No model change ships without beating the held-out set.
7. **Licences before data.** Check the license and permitted uses for the exact
   corpus version and each included slice. Record attribution and restrictions;
   dataset size or a repository-level license does not grant rights to every
   item. Restricted material never enters a bundled corpus.
8. **Fail closed, label precisely.** BLOCKED English never returned; unlisted
   forms never rendered; `AGREE` means only that a defined machine check passed,
   not that the translation or interpretation is true.

---

# Part 2 — Repository map (files this plan touches)

### svread (this repo — public surface + verification)
```
app.js                     reader, scholar view, word panel, Google exchange
index.html                 shell, nav (Library/Scholar/Sanskrit/Index/Wheels/About)
styles.css                 reader + scholar + account widget styles
wheels.html / wheels.js    wheel flow, discs, script combos, levels, drill
journey.js                 centre-out journey (currently references absent IPVV gate routes)
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
mcp/scholar_server.py      local stdio scholar tools (inventory at pinned revision)
tests/*.cjs                node suite (CI); tests/mcp/*.py for MCP
```

### ipvv (separate backend checkout; current master must be checked)
```
worker/src/index.js        routes: /api/auth/*, /api/chat/:work, /api/read,
                           /api/scholar/* (route list is revision-specific)
worker/schema.sql          inspect at the pinned revision before relying on it
worker/migrations/         current inspected master has no gate/session or
                           learner-progress migration (as of c2cb6b3)
worker/wrangler.toml       D1 binding (ipvv), audio bucket
```

### translation-work (evidence layers + gates; pin revision before integration)
```
check.py                   canonical gate
mcp_server.py              local stdio interface (inventory current tools)
tools/                     build_l0, proof_record, emit_site, mitra_grounds,
                           vidyut_candidates, build_c1sum…
<work>/data/*.json         t1/l0/argmap/l2/c1/l3/l4 per passage
REGISTRY.json              gold/pending (machine-proposed ≠ human-approved)
```

### OpenPatala (canonical registry + control plane)
```
patala/                     identities, editions, passages, rights, provenance
patala/api.py               typed read API; current main exposes GET routes
patala/mcp_server.py        current five-tool stdio reader; not yet a job console
migrations/                 append-only events, artifacts, rights, observations,
                            candidates, assertions, editions, witnesses, texts
```
OpenPatala owns canonical IDs and current registry state. It should own the job
ledger and release pointers too, but translation workers must not write
directly to its database. Content remains in revisioned, hash-addressed
artifacts; OpenPatala records their identity, rights, locators, and event links.

### trika-x (formal + federation)
```
formal-trika/control/*.lean     named models + must-fail twins
formal-trika/data/treeka.json   passages/arguments/gaps
formal-trika/tools/federation_gateway.py   local federation parent; verify
                                          tool catalogue and failure policy
formal-trika/data/federation-children.json child config; verify enabled
                                           children and their permissions
tools/mcp_catalog.py            catalog drift gate (banned-action guard)
```

### sibling checkouts (integration boundaries)
```
SATSANG_ROOT/auth/src/*.js               Google sign-in worker (verify origin list)
OPENPATALA_ROOT/patala/mcp_server.py     registry MCP (current tools are read-only)
BOOKFACTORY_ROOT/bf_mcp/server.py        books (verify current catalogue)
VIDEOFACTORY_ROOT/vf_mcp_server.py       video (verify current catalogue)
DEITYBODY_ROOT/data/curriculum.json      Mātṛkā curriculum (pin revision)
DEITYBODY_ROOT/practice/CURRICULUM_CARDS.md  source-owned DO / MIND / NOT / SOURCE
```
Missing sibling variables mean “integration unavailable,” not “look in a
conventional home directory.” Pin and record every sibling revision used to
generate a vendored artifact.

---

# Part 3 — Workstreams with dev steps

## W1 — Low-stakes practice progress (gates + records)

**Goal.** A learner can practise and see progress recorded consistently across
the site and any authorized assistant integration. This is not a test of
mastery while assessment items and keys are public.

**Current state.** The client references worker routes, but the inspected IPVV
master has no gate routes or progress/session schema. The public gate bank
contains an `answer` for every one of its 61 items. The “uncheatable” claim and
the plan's former assumption that progress tables already existed are false.

**Justification.** Server-side receipts can make progress records consistent
and harder to tamper with. They cannot establish mastery when the answer key is
public, the learner can use another source, or the scoring policy is unvalidated.
Keep this feature labelled practice; do not use it for credentials or claims of
competence.

**Files**
- Modify IPVV only after pinning its checkout and reviewing route/auth patterns:
  `GET /api/wheel/progress`, `POST /api/wheel/gate/start`, and
  `POST /api/wheel/gate/submit` (exact API shape to be settled from the current
  client and backend contract).
- Add a reviewed migration for progress and short-lived gate sessions only if
  needed. Store the minimum receipt data (policy/version, selected item IDs,
  score, result, timestamp); do not retain raw answers without a stated need.
  Keep session answer keys server-only for any future secure assessment.
- Modify `journey.js` to match the implemented IPVV API once it exists; show a
  clear unavailable state until then. Keep any local practice explicitly
  labelled unsaved, and do not describe a server-recorded result as mastery.
- Keep `tools/emit_gate_pools.py` deterministic, but treat its output as public
  practice content. A future secure assessment needs a separate, non-public
  pool and an explicit rights review.
- Add backend tests for auth, ownership, session expiry/replay, eligibility,
  transaction behavior, rate limiting, and concurrent submissions. Existing
  client contract tests do not substitute for worker integration tests.

**Data contract**
```
POST /api/wheel/gate/start  {curriculum, stage}      → {session_id, items[], expires_at}
    items[]: {item_id, prompt, options[]}            (practice bank is public)
POST /api/wheel/gate/submit {session_id, answers[]} → {score, recorded, next_stage?}
```
For practice, scoring thresholds are feedback settings, not certification
standards. Server validates the requested stage and derives the learner's next
practice stage from its own record; it never trusts a client-supplied pass or
unlock. Sessions are user-bound, short-lived, one-use, rate-limited, and
transactionally consumed. Authorization fails closed. Apply CSRF/origin
protections to cookie auth, and narrowly scope bearer credentials.

If the product later needs a real assessment: commission a separate, licensed
item bank; keep items and keys out of public bundles and logs; randomize from a
large pool; document validation and retake policy; have a domain reviewer sign
off. Until then, do not advertise “uncheatable,” “mastery,” or certification.

**Dev steps**
1. Pin IPVV and design the schema/API with least-privilege auth and data
   minimization; test against a local/test database before any migration runs.
2. Keep `emit_gate_pools.py` output explicitly labelled public practice; do not
   call its public keys a secure gate.
3. Implement worker routes and end-to-end tests in the IPVV repository.
4. Update `journey.js` to show saved practice progress or a clear unavailable
   state; derive the next stage from the server record.
5. Add assistant access only after the read-only integration is stable and the
   write operation has explicit per-action authorization.

**Acceptance**
- Practice results are calculated from server-held session data; client cannot
  set its score, next stage, or saved progress.
- Second submission with a consumed session is rejected without changing the
  existing receipt; concurrent duplicate submissions cannot double-advance.
- Hand-shrink a pool in `data/` → `emit_gate_pools.py --check` fails.
- Without authentication or an available backend, public practice remains
  accessible and the UI clearly says progress is not saved (or why it cannot be
  started); it never implies a saved result.
- Worker route tests pass in pinned IPVV; svread client contract tests pass.

**Depends on:** IPVV ownership, a reviewed schema/API, and authentication actually
present at the pinned backend revision.

---

## W2 — The mechanics stamp (certificates)

**Goal.** A derivation record points to reproducible source data, an explicitly
scoped formalization, and the exact checker run. Its tier says what was checked.

**Justification.** We store Vidyut traces "unreviewed" and tell readers so. A
certificate can make a computation reproducible. A hash alone only identifies
bytes; it does not validate them. Lean proves the encoded proposition under the
declared axioms and imports, not that the selected Pāṇinian rule or linguistic
analysis is correct. Record philological review separately.

**Files**
- In the `trika-x` checkout, add
  `formal-trika/control/PrakriyaSlice.lean` only after choosing a small set of
  attested derivations. Verify each rule number, adhikāra, condition, exception,
  and alternative against a named grammar edition; the prior draft's rule list
  included placeholders and unverified mappings and is withdrawn.
- In `svread`, add `tools/emit_certificates.py`: read the pinned
  `data/grammar/wheel-pack.json`, write `data/grammar/certificates.json`, and
  provide `--check`.
- Modify `tools/emit_answers.py`: add `cert_sha` + "checked" block from
  certificates (never invent; if absent, say "certificate pending").
- Modify `tools/emit_harness.py`: include `certificates` index + tier note.
- Modify `mcp/scholar_server.py`: add `wheel_certificate(form)`.
- New `tests/certificates.test.cjs`.

**Data contract**
```json
{"format":"svatantrya.certificates/1",
 "entries":[{"pack_id":"sarva-tral","form":"sarvatra",
   "source_pack_sha":"…","rule_slice_revision":"…",
   "lean_version":"…","command":"…","result":"passed",
   "run_receipt_sha":"…","philology_review":"pending"}]}
```

**Dev steps**
1. Name the exact claim to be formalized and review the rule statement,
   conditions, exceptions, and encoding with a Sanskrit grammarian.
2. Pin source-pack, rule-slice, dependency, compiler, and command revisions;
   record an actual checker receipt and negative/mutant controls.
3. Emit only the tier supported by the evidence: byte-identified, mechanically
   checked, or separately human-reviewed. Never infer the last from the first two.
4. If exposed through MCP, return the evidence record and its limits verbatim.
5. Run deterministic checks in CI; require the exact checker run for any
   “mechanically checked” label.

**Acceptance**
- Each certificate identifies its exact source pack, rule slice, imports,
  Lean version, command, and successful checker receipt, or says pending.
- A corrupted input or failing mutant cannot retain a passed status.
- Human review status is distinct and links to a named reviewer and scope; no
  claim of universal grammatical coverage.

**Depends on:** a revision-pinned grammar pack, a named grammar edition, and
Sanskrit review of the exact formalized derivations.

---

## W3 — Access layer (read-only first)

**Goal.** OpenPatala is the single registry/control plane. ChatGPT is the
learning, research, and writing interface through a small, authenticated MCP;
it can read source-linked records and submit bounded candidate jobs without
becoming the source of truth or release authority.

**Justification.** Existing local servers are stdio. The remote transport,
authentication, and product connector must be checked against the current
official specifications and the actual deployment before implementation.
Treat transport and connector support as implementation choices, not strategy
assumptions.

**Current gap.** The current OpenPatala MCP has five read tools and its
`get_frontier` implementation is not a true translation frontier. Its API has
typed GET routes, but no job/candidate/review write contract. The MCP is a
useful prototype, not yet a control panel. The general trika-x federation is a
worker aggregation layer; its catalogue is not an authorization boundary and
should not be exposed wholesale as ChatGPT's privileged interface.

**Files**
- Extend OpenPatala's service boundary first; add a small read-only MCP surface
  beside it with reviewed schemas, source citations, budgets, timeouts, and
  request IDs. Do not use direct SQL from ChatGPT, svread, or translation
  workers.
- Use the transport and authorization flow required by the current official
  connector specification. Avoid anonymous discovery of sensitive tools.
- Never put credentials, user data, or write arguments in URLs. Use scoped
  credentials, revocation, rate limits, and auditable actions where supported.
- Keep authorization policy owned by the service responsible for the data; do
  not trust a federation gateway's catalogue as an access-control boundary.
- First read tools: `catalog.search`, `work.dossier`, `source.coverage`,
  `translation.matrix`, `queue.preview`, and `job.status`. Every response names
  the exact source edition, artifact hash, locator, rights state, review state,
  and any unavailable evidence.
- Later write tools, only after review: `job.create` and `candidate.submit` may
  create private work. `review.submit` records a named review. Release approval
  remains a human action with an explicit, separate permission. A model may
  never turn its own candidate into an approved or public translation.
- Each job pins canonical work/edition/locator IDs, source hash, target
  language/layer, rights decision, prompt and model versions, output hashes,
  reviewer state, retry/idempotency key, and an append-only provenance event.
- ChatGPT may teach from approved public layers, compare authorized
  translations, help write essays, and request new drafts. Bookfactory and
  other generators consume only approved release snapshots; generated books,
  courses, and media link back to the exact released text and sources.
- Add `data/mcp.json` and `llms.txt` only after endpoint, transport, auth, and
  privacy behavior have been verified in the deployed environment.

**Dev steps**
1. Inventory available OpenPatala routes and every MCP grant; close the
   frontier/search gaps and define typed response schemas.
2. Implement one supported read transport and verify protocol negotiation,
   authentication, timeouts, rate limits, and shutdown behavior.
3. Test with an actual connector and account that has the required grants;
   test DB/API and child-service outages explicitly.
4. Add private candidate-job writes only after the read path, consent flow,
   job ledger, and recovery behavior pass review.

**Acceptance**
- Initial tool list contains only reviewed read tools and no accidental write
  or admin actions; later write tools are separately scoped and permissioned.
- Malformed input, unauthorized calls, expired/revoked credentials, child
  failure, timeouts, and rate limits return an explicit error, never empty
  success or a stale “healthy” result; actions leave an audit record.
- A supported client can retrieve a source-linked dossier and translation
  comparison in a clean session; every connector capability claimed is
  observed and recorded.

**Depends on:** source-aware read responses and an implemented, security-reviewed
transport. W2 is optional; tools must state when no mechanical certificate exists.

---

## W4 — Practice surface (curriculum)

**Goal.** The missing tab; learning as a product, not a demo.

**Justification.** Deitybody contains a source-owned curriculum and cards;
verify and pin the exact revision and permissions before vendoring a snapshot.
The svread practice route has not been implemented.

**Files**
- New `tools/emit_practice.py`: vendors a licensed, revision-pinned snapshot to
  `data/practice/curriculum.json`, `cards.json` (parse DO/MIND/NOT/SOURCE),
  `stages/*.md`; provenance hashes; `--check`.
- Modify `app.js`: `?view=practice` route (three tracks: Wheels embed, Mātṛkā,
  Reader drill), nav item.
- Modify `styles.css`: practice layout.
- New `tests/practice.test.cjs`: source snapshot, card text, accessible progress
  state, and no unsupported learning claims.

**Dev steps**
1. Emit + pin provenance; assert source hash.
2. Route + track UI; embed wheels journey (no duplication).
3. Wire Mātṛkā progress to W1 only if the backend implementation exists and is
   integration-tested; label it as practice.
4. Add "copy ChatGPT prompt" per stage (same pattern as journey).

**Acceptance:** only source-authorized stages render; emitted card text is
byte-identical to the pinned source; progress is labelled as practice and
server-saved only if W1 is actually deployed; `seo_check` stays green.

**Depends on:** a rights-cleared, revision-pinned curriculum. Saved progress
depends on W1, but the practice surface itself does not.

---

## W5 — Measurement (benchmark + licences)

**Goal.** Measure translation and learning usefulness against a human-reviewed
baseline, while tracking data rights and provenance.

**Files**
- New `data/eval/muktabodha-blind-set.json` (+ `.md` rubric): held-out passages with
  documented provenance, permissions, categories, difficulty, and separation
  from prompts, retrieval, and training. Stratify across verse, prose, ritual,
  philosophical argument, commentary, and source quality where the corpus
  supports those categories.
- New `tools/eval_blind.py`: runs candidates (pipeline export, MITRA-MT output,
  tool stack), scores correction effort, writes `data/eval/results-<date>.json`.
- New `data/licenses/registry.json` + `tools/check_licenses.py`: per dataset
  release/checksum/attribution/allowed uses; pipeline refuses unregistered data.

**Dev steps**
1. Select passages only after checking source rights and ensuring the test set
   is genuinely isolated from prompts, retrieval indexes, and model training.
2. Have Sanskrit reviewers define the rubric and establish a human-reviewed
   reference/baseline with disagreements recorded.
3. Freeze the evaluation set and protocol before comparing systems; score
   terminology, omissions, additions, syntax, and correction effort separately.
4. Compare the current pipeline and any candidate system; report uncertainty,
   evaluator agreement, and limitations. Do not start model training in parallel.
5. Register each dataset's license, source, checksum, permitted uses, and
   exclusions before a loader can access it.

**Acceptance:** one results table per candidate; a dataset without a registry
row cannot be loaded; evaluation results reproduce from the pinned protocol.

**Depends on:** source rights and reviewer time. Benchmark design can proceed
in parallel with W1, but evaluation runs and candidate selection wait for the
frozen human-reviewed baseline.

---

## W6 — Training (only after W5)

**Goal.** Consider a narrow model adaptation only if measured evidence shows a
specific failure that simpler tools cannot address.

**Default:** defer. Training creates licensing, privacy, maintenance, and
regression costs; no repository evidence yet establishes that LoRA or a new
translation model is the limiting factor.

**Files, if justified by W5**
- A narrowly scoped experiment and run record containing the dataset checksum,
  license, consent basis, model/code versions, seeds, and evaluation result.

**Order + acceptance**
1. First test deterministic glossary checks, retrieval, prompts, and reviewer
   guidance against W5. Constrained decoding may be unsuitable if it forces a
   term where context demands another sense.
2. Consider adaptation only with an explicit data-rights and consent review,
   sufficient representative data, and a pre-registered evaluation protocol.
3. Require material improvement on independent held-out passages, no increase
   in critical errors, documented model/data versions, and a rollback plan.
   Fixed passage-count thresholds alone do not establish sufficiency.

**Depends on:** W5.

---

## W7 — Factory (more works)

**Goal.** A reproducible assistant for preparing candidate evidence layers;
humans review all linguistic decisions and control publication.

**Files**
- New `translation-work/tools/auto_pipeline.py`: job-per-layer candidate driver
  (`t1 → l0 → argmap → l2 → c1`), stamps model/date/prompt-hash, stops on gate
  failure; writes to a private candidate area, never canonical publication data.
- Modify `translation-work/check.py` usage in CI: fail on any BLOCKED leaking
  into a reader bundle.
- Reuse `tools/emit_verify.py`, `tools/emit_claim_pages.py`,
  `tools/emit_traces.py`, `tools/emit_biblio.py` (svread).
- Use OpenPatala IDs for all work/edition/passage joins. A worker submits a
  candidate artifact through the OpenPatala service contract; it never writes
  straight to the canonical DB. Until job writes are implemented and reviewed,
  run jobs locally and attach them as clearly provisional artifacts.
- The T1 gloss is an alignment aid, not a finished translation. Require full
  source coverage before downstream L0/argument-map/literal/readable layers;
  empty English fields, missing pādas, broken segmentation, or unresolved
  chapter boundaries keep the job `BLOCKED`.
- Keep source census, extant-translation research, machine-draft coverage,
  human-reviewed coverage, and released coverage as separate measures. A search
  with no hit is not proof that no translation exists.

**Dev steps**
1. Pick one complete, short work from the inventory; pin source, rights, IDs,
   locators, and the full expected passage count.
2. Run driver; require exact text coverage and keep every failure BLOCKED.
3. Emit reader bundle → verify pack → claim pages from an approved snapshot.
4. Independent blind review on the work. A human explicitly approves each
   release; a label does not substitute for review or publication permission.

**Acceptance:** source → private candidate layers → independent review → an
explicit, human-approved release. No generated layer is automatically rendered
or published. Machine-proposed labels remain until the relevant claims are
actually reviewed and approved.

**Depends on:** rights-reviewed sources, W5 protocol, and a human review process.
W3 is optional; an assistant connector is not required for a reliable pipeline.

---

## W8 — Muktabodha translation programme (the corpus endgame)

**Goal.** Produce an English translation for every catalogued Muktabodha text
that can be transcribed and legally processed, while keeping source
transcription, translation, review, and publication distinct. Text or rights
barriers remain explicit work states. “Complete” is measured against named
collections and passage coverage, never the volume of model output.

**Scope and denominators**
- Begin with the complete catalog of searchable Muktabodha e-texts. The
  Institute currently reports more than 570; reconcile the official catalog,
  source files, and OpenPatala ledger by catalog ID before using a percentage.
- In parallel, catalogue all IFP transcripts and Gokarna Vedic holdings.
  Track image-only, partial, damaged, and not-yet-transcribed items as
  transcription work; they enter translation after usable text is established.
- Include every tradition represented in scope. Delayed or excluded works stay
  in the registry with the reason, owner, and next action. The queue must not
  silently filter Buddhist or other records by title substring.
- Queue order is a scheduling choice, separate from the corpus census. A
  “shortest first” score preserves the full denominator and discloses its
  signals, sources, uncertainty, and excluded/blocked rows.

**Canonical passage dossier**
For every text unit, OpenPatala links the canonical work ID and collection
catalog ID to the exact source edition/artifact and checksum, rights state for
discovery/fetching/derivative/release, stable chapter-local locator, source
text, segmentation state, cited alternate translations and reuse rights,
translation layers, and review/release events. A witness is recorded only when
source evidence identifies one. Colophons, appendices, and chapter-local
numbering remain distinct from verse sequences.

**Editorial layers and status**
1. **Source transcription:** exact bytes and line/pāda mapping; unresolved
   readings remain visible.
2. **T1 gloss:** token/pāda alignment and morphology/gloss candidates. It is an
   alignment aid; translation coverage begins at the complete English layers.
3. **Literal draft:** complete sense-preserving English with one aligned unit
   per source passage.
4. **Readable draft:** idiomatic English linked to the literal layer and
   Sanskrit, with unresolved choices and alternatives recorded.
5. **Scholarly apparatus:** translation decisions, variants, lexical evidence,
   commentarial evidence, and citations, with claims attributable.
6. **Human reviews:** Sanskrit/language review, tradition/interpretive review,
   and editorial copyedit recorded as separate decisions.
7. **Release:** rights-cleared, versioned public snapshot approved by a human;
   `bookfactory` and `svread` consume that snapshot, never a mutable worker
   directory.

Track source and rights states separately from translation states. Suggested
translation states are `draft_pending`, `machine_draft`, `language_review`,
`philology_review`, `copyedit`, `approved`, `released`, `withheld`, and
`blocked`. Remove `DONE = machine-translated` from user-facing or corpus
completion reporting. Report at least catalog coverage, source-text coverage,
rights-cleared coverage, machine-draft coverage, human-reviewed coverage, and
released coverage.

**Discovery and alternate-translation research**
Search named catalogs and indexes with versioned queries. Record date, source,
access/coverage result, matched edition, language, translator, and evidence URL.
Interpret `0 hits` as a result of those searches only. Label availability
`unknown` until the search protocol has adequate coverage; use `no known
translation located` only with a dated, documented search. Avoid translation
counts based on title matches alone. Store full alternate wording only where
its license/use permits it; otherwise retain citation metadata and a link.

**Quality gates**
- Expected source passage count and actual count reconcile before translation;
  every pāda/line has explicit coverage or an exception record.
- Source and target passage locators stay aligned. Chapter numbering restarts
  where the edition restarts; colophons remain paratext.
- Every layer carries source hash, tool/model/prompt version, run ID, and
  reviewer/status. Candidate and approved versions are immutable and linked.
- Machine drafts cannot set `approved`, `released`, or canonical scholarly
  assertions. Unresolved source or rights states are visible to editors and
  readers.
- Reader, lesson, essay, book, audio, video, and course outputs record their
  exact release snapshot and source links so each derivative is reproducible.

**Build order**
1. Reconcile PR #16's connection guide with current code; remove password
   examples/defaults and credential-bearing shell commands before using it as
   onboarding documentation.
2. Import the official Muktabodha catalog as registry records; reconcile all
   three collections and create a gap report against the current 499-row queue.
3. Define OpenPatala schemas and service endpoints for collection/work/edition,
   source artifacts, passage coverage, rights, alternatives, jobs, candidates,
   reviews, and releases. Keep ingestion staged until reviewed.
4. Finish one complete short work under the gates above. Use the current
   Kulārṇavatantra p04/p05 machine artifacts as a negative case for missing
   pāda coverage, blank English, and chapter/colophon boundaries.
5. Add ChatGPT's read-only learning/writing cockpit, then narrow candidate-job
   writes with consent and provenance. Publish only through human approval.
6. Batch across the full e-text corpus after coverage metrics and review cost
   are stable. Expand to image-only IFP/Gokarna materials as separate
   transcription-plus-translation campaigns.

**Completion evidence.** Every catalog item has an explicit state and next
action; every translatable passage is accounted for; every public translation
has complete coverage, source/rights metadata, independent review, and a human
release event. Report draft throughput separately from scholarly publication.

---

# Part 4 — Sequencing

| Stage | Work | Exit evidence |
|---|---|---|
| 0. Secure and stabilize | Reconcile PR #16's connection guide with credential policy and current code. Keep PR #18's machine outputs explicitly provisional; correct denominator, locator, and coverage defects before presenting its queue as a translation programme. Preserve fresh-checkout checks and generate the release manifest last. | Credential-free docs/defaults; current CI evidence; PR #18 reports drafts, not completed translations. |
| 1. Census the corpus | Import the official Muktabodha catalogs into OpenPatala and reconcile searchable e-texts, IFP transcripts, and Gokarna items by catalog ID. Record transcription readiness, collection, rights state, and exclusions for every item. | A source-linked inventory with a known denominator and a gap report for the existing 499-row queue. |
| 2. Prove one full work | Select a complete, rights-cleared short work with an identifiable edition. Build full source and passage coverage, literal/readable English layers, documented alternatives, independent review, and a public reader snapshot. | Every passage accounted for; reviewers can trace decisions; a reader can compare versions and understand uncertainty. |
| 3. Build the editorial factory | Implement source alignment, layer jobs, coverage/locator gates, provenance, and human review in translation-work, with OpenPatala IDs and staged artifact submission. Measure correction effort on held-out passages. | Reproducible job receipts and reviewer evidence; machine output stays private until approval. |
| 4. Add OpenPatala MCP | Ship the reviewed read-only catalog/dossier/coverage/translation tools first. Add private candidate-job writes only after auth, idempotency, audit events, consent, and recovery are proven. | A supported client retrieves exact source-linked records; failure modes are explicit; no model can self-approve. |
| 5. Deliver ChatGPT and book generation | Use ChatGPT as the learning, research, and writing desk over approved OpenPatala dossiers. Feed bookfactory and other generators from versioned release snapshots with attribution and source links. | Learners can ask about a passage; generated essays/books/media identify their exact released inputs. |
| 6. Scale to all collections | Batch through the searchable e-text collection under stable gates; separately fund and schedule OCR/transcription for image-first IFP and Gokarna material. Expand by reviewable releases and tradition-aware queues. | Collection and passage coverage advance transparently; drafts, reviewed translations, and published works are reported separately. |

Always-on: fresh-checkout CI, manifest generated last, no blanket skips,
revision-pinned sibling inputs, and explicit rights/review status. The flagship
is a source-transparent complete-work pilot. A connector, certificate, or new
model earns priority only when it reduces measured work or improves reader and
reviewer outcomes without weakening source, rights, or approval controls.

---

# Part 5 — Kaggle compute (optional; verify before every use)

Do not assume an account, credential, quota, accelerator, or dataset permission
is live. Check provider status, current quotas, costs, terms, and data rights
immediately before a run. Keep credentials in the approved secret store or a
protected local credential file; never commit them, print them, or put them in
URLs or notebook output.

Kaggle is an optional batch environment for a rights-cleared, already-designed
evaluation. It is not a runtime or a reason to train. Do not upload held-out
evaluation data unless the provider terms and isolation plan permit it.

**Hard guardrail — do not touch the chanting work.**
Read-only unless the owner explicitly changes that instruction:
- dataset `priortrades/kashmir-chant-cards`
- kernel `priortrades/vagdhenu-chant-gpu`
- anything else matching `chant|vagdhenu|kashmir`.

**Naming and isolation**
- New datasets and jobs use a private, project-owned namespace; each pins its
  dataset and code versions.
- Do not modify any pre-existing dataset for these experiments; create a new
  private dataset for each authorized run.

**Artifact return path**
Every authorized run records model/version, code revision, command, seeds,
dataset checksum, license, and evaluation protocol. Results remain private until
reviewed. No output becomes canonical text or training data without separate
rights review, human review, and the relevant evaluation gate.

No notebooks are committed to the roadmap until a concrete benchmark question,
data permission, and local baseline justify the cost. Stop idle jobs, record
actual usage, and do not modify the protected chanting assets.

---

# Part 6 — Secrets and environments

| Material | Handling rule |
|---|---|
| Cloudflare, storage, OAuth, signing, and API credentials | Keep in the approved secret store; restrict scope; never put values in source, tickets, chat, logs, URLs, or generated artifacts. |
| Public client identifiers | Confirm that they are designed to be public; still restrict redirect origins and allowed audiences. |
| Local provider credentials | Use protected, ignored files or the provider's supported credential helper; do not assume a particular home-directory path. |
| Any credential pasted into chat or committed by mistake | Treat as exposed: revoke/rotate, inspect use, and remove it from active auth flows. History cleanup is separate from rotation. |

Deploy and migration commands are repository- and environment-specific. Review
the target, diff, current schema, backup/recovery plan, and authorization before
running them; a local command name is not evidence that production is safe.

---

# Part 7 — Definition of done

**Learning.** A learner can use the practice material and understand whether
progress is local or saved. Saved progress is consistent across authorized
clients. It is not described as mastery or certification unless a validated,
rights-cleared assessment exists.

**Evidence.** Pages distinguish source-byte identity, reproducible mechanical
checks, philological review, and interpretive judgment. Each statement links to
the evidence supporting that statement; missing review is shown as pending.

**Production.** One work proceeds from a licensed, identified source through
private candidate layers and independent review to an explicitly approved
release. No automated step publishes linguistic interpretation.

**Corpus.** Every item in each named Muktabodha collection has a registry
record and explicit readiness/state. Passage-level source and translation
coverage is measurable. Machine-draft, human-reviewed, and released counts are
separate; an incomplete catalog cannot be reported as full-corpus progress.

**Access.** A supported client can retrieve a bounded, source-linked answer
through a reviewed read-only interface. Any later write is explicitly
authorized, narrowly scoped, auditable, and tested; no subscription tier or
connector feature is assumed.

---

# Part 8 — Risks

1. Public keys undermine assessment → label existing pools as practice; do not
   claim mastery or credentials; create a separate private bank only if needed.
2. Backend route mismatch → pin the IPVV revision and test the real worker API;
   unavailable progress is explicit, while authorization always fails closed.
3. Service outage → degrade availability clearly; never bypass auth or expose a
   privileged fallback route.
4. Rights contamination → registry and source review before copying, training,
   hosting, or publishing any text or dataset.
5. Formalisation overreach → show the exact encoded claim and checker scope;
   keep mechanical evidence separate from grammatical and interpretive review.
6. Ambient checkout assumptions → use explicit repository roots and pinned
   revisions; a missing sibling checkout is unavailable, not silently skipped.
7. Evaluation leakage → separate held-out data from prompts, retrieval, and
   training; audit copies and access before drawing conclusions.
8. Credentials or personal data leak → least privilege, rotation after exposure,
   minimized receipts, and no secrets in chat, URLs, logs, or artifacts.
9. Unnecessary infrastructure/training → defer until reader studies and the
   benchmark show a concrete bottleneck.
10. False corpus coverage → reconcile every official catalog and collection;
    never let a work-priority queue, search failure, or machine-draft status
    stand in for a complete translation denominator.

---

# Part 9 — Next five actions (start here)

1. Fix the credential-bearing OpenPatala defaults/examples and revise PR #16;
   its latest Reader integrity run passes, but this security issue remains.
2. Reconcile the official Muktabodha catalog against all 499 queued records;
   explain the seven filtered records and identify missing collection items.
3. Repair the Kulārṇavatantra sample's full pāda coverage, English layer, and
   chapter-local locators; keep the current artifacts marked as machine drafts.
4. Select a complete, short, rights-cleared work and establish the source,
   segmentation, alternatives, translation layers, and independent-review
   protocol for a gold-standard end-to-end pilot.
5. Specify OpenPatala's job/candidate/review/release service contract and
   source-linked MCP read tools; keep all generated content private until an
   authorized human release.

Then batch the full searchable e-text corpus. Plan transcription as a distinct
stage for image-first holdings. The system is useful when people can discover
reliable source text, see translation alternatives and uncertainty, learn from
primary sources, and reuse approved translations to create attributed books,
essays, lessons, and media. The site checks defined artifacts and workflows;
scholars and readers judge the interpretation.
