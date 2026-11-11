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

**Near-term product test:** a reader opens a short work and can identify its
edition and passage, inspect the Sanskrit, compare distinct translations where
reuse is authorized, follow each wording to its source, and see where the
translators or editors differ. The project should preserve those differences
and explain them; it should not imply that a single machine-generated wording
settles the interpretation. Rights and source metadata are part of the product.

**Strategy in one line:** be a source-aware reading and learning system alongside
AI assistants: the software checks defined bytes, schemas, and computations;
qualified reviewers assess linguistic and interpretive claims; publication is
deliberate and human-controlled. A software check is never presented as proof
that a translation or interpretation is true.

---

# Part 0 — Current state (snapshot; recheck before implementation)

The counts and infrastructure claims in earlier drafts are historical until
reproduced. This snapshot was checked on 2026-11-11 against `svread` main at
`df304e0e` and the inspected `ipvv` master at `c2cb6b3`; PR #14 is a separate,
open documentation branch, not yet part of main. These are repository facts,
not proof that deployed services have the same state.

| Area | Verified state | Consequence |
|---|---|---|
| `svread` main CI | Inspected main run [42973083646](https://github.com/prx0r/svread/actions/runs/42973083646) failed on a stale release manifest. PR #14 is a separate open branch; rerun its checks after every update. | Keep manifest generation last; a PR result does not mean main is green. |
| Release / source checks | Current main's claim-page byte checks, negative tests, and Ghaṭakarpara English hold pass. | Preserve the source-byte and publication-hold gates. |
| Edition metadata | Release-manifest check reports 95 works and 37 without a named source edition. | Treat edition/witness identification as a publication blocker for affected works; do not let a valid byte hash imply a reliable source text. |
| Gate UI | `journey.js` calls `/api/wheel/progress` and `/api/wheel/gate/{start,submit}`. | Client references do not mean the routes exist or are deployed. |
| Public gate bank | `data/wheels/gates.json` contains answers for all 61 public items. | This is public practice material; it cannot support secure assessment or mastery claims. |
| `ipvv` backend | Inspected `c2cb6b3` has none of the wheel gate routes, `gate_sessions`, migration 0013/0014, `learner_progress`, or `learner_attempts`. | W1 is not shipped. The old plan's “tables live” statement was wrong. |
| Gate integration test | In `node --test tests/gate.test.cjs` with `IPVV_ROOT` set to that checkout, 4 checks pass and the route-presence integration check fails because the routes are absent. | Keep this failure visible until the backend is implemented and reviewed. |
| MCP implementations | Local stdio servers and a federation gateway exist in sibling repositories. Their current count, deployment, availability, auth behavior, and transport support have not been re-verified here. | Do not promise a 104-tool hosted service or a particular connector path. |
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
OPENPATALA_ROOT/patala/mcp_server.py     identity tools (verify current interface)
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

**Goal.** An assistant can retrieve bounded, source-linked reading and evidence
through one supported, authenticated, observable interface.

**Justification.** Existing local servers are stdio. The remote transport,
authentication, and product connector must be checked against the current
official specifications and the actual deployment before implementation.
Treat transport and connector support as implementation choices, not strategy
assumptions.

**Files**
- Add a small read-only adapter beside the chosen federation runtime; expose
  only reviewed tools, with schemas, source citations, budgets, timeouts, and
  request IDs.
- Use the transport and authorization flow required by the current official
  connector specification. Avoid anonymous discovery of sensitive tools.
- Never put credentials, user data, or write arguments in URLs. Use scoped
  credentials, revocation, rate limits, and auditable actions where supported.
- Keep authorization policy owned by the service responsible for the data; do
  not trust a federation gateway's catalogue as an access-control boundary.
- Add `data/mcp.json` and `llms.txt` only after endpoint, transport, auth, and
  privacy behavior have been verified in the deployed environment.

**Dev steps**
1. Inventory currently available tools; choose the smallest useful read-only
   set and test each response for source, rights, provenance, and failure mode.
2. Implement one supported transport and verify protocol negotiation,
   authentication, timeouts, rate limits, and shutdown behavior.
3. Test with an actual connector and account that has the required grants.
4. Consider narrowly scoped writes only after the read path and consent flow
   pass review.

**Acceptance**
- Tool list contains only reviewed tools and no accidental write or admin
  actions.
- Malformed input, unauthorized calls, expired/revoked credentials, child
  failure, timeouts, and rate limits fail safely and leave an audit record.
- A supported client can retrieve a source-linked result in a clean session;
  every connector capability claimed is observed and recorded.

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
- New `data/eval/trika-blind-50.json` (+ `.md` rubric): held-out passages with
  documented provenance, permissions, categories, difficulty, and separation
  from prompts, retrieval, and training.
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
- If a stable, authenticated OpenPatala interface is available, add a
  revision-pinned exporter for work/edition/passage/tradition IDs. Keep it
  disabled until that interface and its write permissions are verified.

**Dev steps**
1. Pick one small work; run driver; keep every failure BLOCKED.
2. Emit reader bundle → verify pack → claim pages.
3. Verify rights, metadata, work/edition/passages, and ID resolution.
4. Independent blind review on the new work. A human explicitly approves each
   release; a label does not substitute for review or publication permission.

**Acceptance:** source → private candidate layers → independent review → an
explicit, human-approved release. No generated layer is automatically rendered
or published. Machine-proposed labels remain until the relevant claims are
actually reviewed and approved.

**Depends on:** rights-reviewed sources, W5 protocol, and a human review process.
W3 is optional; an assistant connector is not required for a reliable pipeline.

---

# Part 4 — Sequencing

| Stage | Work | Exit evidence |
|---|---|---|
| 0. Make the repo truthful | Reconcile PR #14; keep release manifest and checks green on a fresh checkout; rebase PR #11 and resolve conflicts without weakening translation-rights rules. | Reproducible CI and a clean integration diff; current backend limitations documented. |
| 1. Prove reader value | Choose one short work with an identifiable edition; document witnesses and rights; compare only reusable translations or excerpts authorized for the use; publish a carefully reviewed two-verse pilot with source links and uncertainty notes. | Independent Sanskrit review; readers can compare distinct wording and trace claims to sources without an implied consensus. |
| 2. Measure the experience | Establish a human-reviewed translation baseline and run small learner/reader sessions; separate reading comprehension, terminology, and correction effort. | A frozen protocol and recorded results, including disagreements and limitations. |
| 3. Improve practice | Ship a usable practice surface. Add saved, low-stakes progress only after the IPVV routes, auth, schema, and tests exist. Keep public answer-bank practice labelled honestly. | Usability evidence; progress behavior is integration-tested and never represented as mastery. |
| 4. Add evidence tools | Build only the certificates and read-only assistant functions that solve observed reader/reviewer needs. | Exact provenance and checker receipts; narrow reviewed tool catalogue; failure and privacy controls. |
| 5. Expand carefully | Add more works after licensing, metadata, review capacity, and human approval are ready. Consider model adaptation only if the evaluation shows a persistent bottleneck. | Per-work review and explicit publication decision; held-out improvement before any model change. |

Always-on: fresh-checkout CI, manifest generated last, no blanket skips,
revision-pinned sibling inputs, and explicit rights/review status. The flagship
is a source-transparent small translation pilot; a sophisticated connector or
formal certificate is optional until it improves that reader experience.

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

---

# Part 9 — Next five actions (start here)

1. Reconcile PR #14 and restore reproducible fresh-checkout checks; regenerate
   the release manifest last.
2. Rebase PR #11 and resolve its manifest/style/service-worker conflicts while
   retaining the source and license restrictions; review the final diff.
3. Select one small translation pilot: verify edition and rights, map extant
   translations, choose two verses, and commission independent Sanskrit review.
4. Define a human-reviewed translation/reader baseline and an isolated
   evaluation protocol before comparing models or training.
5. Decide whether low-stakes progress is worth the IPVV backend work; if yes,
   implement and test routes/schema there before claiming server-scored gates.

Only after these unblockers should W2 certificates, W3 assistant access, and W6
training be prioritized. The outcome is useful when a reader can inspect the
source, compare translation choices, understand uncertainty, and learn from
well-attributed scholarship. The site checks specified artifacts and workflows;
scholars and readers judge the interpretation.
