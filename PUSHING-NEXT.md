# Pushing and Scholar: next features and production handoff

**For the next implementing agent.** This is a proposed roadmap and acceptance
contract, not a claim that these features or a production deployment exist.
Read [PUSHING-LAB.md](PUSHING-LAB.md) for the prototype and
[PUSHING-RESEARCH.md](PUSHING-RESEARCH.md) for the pinned Logicvid, Pāṭala,
library and essay sources. Read translation-work's `AGENT-MAP.md` and `SCHOLAR.md`,
and ipvv's `AGENTS.md`, ownership and claims rules before touching those repos.
Check each branch's current head and coordinate with other work before editing.

The aim is a scholar's research desk: a human question grows into a traceable
enquiry; a scholar can inspect the Sanskrit and competing readings, challenge
the crucial inference, write an essay with permissioned sources, invite review,
and deliberately publish a version. A reader can then ask a question of the
scholar's permitted, published work and see where each answer came from.

## 1. Starting point and release order

| Capability | State in these review branches | Remaining work |
| --- | --- | --- |
| Pushing enquiry | svread #5: local typed tree, imported conversations, 57 pinned archive entries, selected-branch crux brief, two-branch comparison, focused Qwen challenge, JSON export, optional private account snapshot. | Durable, explicitly shared cruxes; richer source trails. |
| Evidence and essays | Available Scholar projections, chosen C1/L4 data, selected private notebook sources and author-permitted published essay excerpts. A Qwen essay can be saved as a private AI-assisted draft. | Immutable resolvable evidence, claim-by-claim support review and a production provider. |
| Scholar work | Recovery branches provide private drafts/history, style edit pairs, forks, revision-bound review, sign-off and Git submission. | Deploy and exercise the complete stack; verify review integrity and publication gates. |
| Rights | ipvv #11 grants answer and draft use separately for an exact published essay version. The account recorded as author grants or revokes; default is deny. | Account attribution is self-attested. Current D1 stores the current grant, not an audit history. Revocation cannot retrieve content already sent to a provider. |
| Proof | The projection and source hashes check consistency; current AI citation checks constrain some essay markers. | Neither proves source completeness, provenance authenticity, the interpretation, citation entailment or independent peer review. |
| Release | svread #5 builds on unreleased #3; ipvv #11 builds on unreleased #9; translation-work #7 is also a dependency. These are review branches, not evidence of a live deployment. | Reconcile the active branches and deploy only after the actual gates and production smoke tests pass. |

The prototype has 22 Scholar projections for 55 reader works; 37 works lack a
named source edition in the current manifest. Tantrāloka's historical Pushing
sessions are browsable, but a corresponding Scholar projection is not available
in this bundle. Ghaṭakarpara remains under a Scholar evidence hold. Recheck these
counts on the chosen release commit; do not remove a hold to make a test pass.

**Sequence:** (0) prove the release and privacy boundary; (1) make source and
claim checking durable; (2) make the enquiry-to-essay and AI examiner flow
useful; (3) add an opt-in shared crux notebook and permissioned question
answering; (4) add learning paths and wider discovery after real use. Each
vertical slice below has an independently reviewable checkpoint. Push tested
branches as work proceeds; never force-push a collaborator's branch.

## 2. Production baseline — P0

### 2.1 One reproducible release, not three unrelated versions

**User sees:** a Scholar page that saves and reopens work, identifies the chosen
source version, and clearly says when AI or publishing is unavailable.

**Implement / verify**

1. Record the exact svread, ipvv, translation-work and source-library commits,
   schema release and build command in a release record. Restore the actual
   pinned source library and the normal receipt generation process. Do not
   manufacture missing `receipts.jsonl` or run a blanket re-emit of ingest-owned
   translation files. Follow the emitter ownership table in `AGENT-MAP.md`.
2. Run the translation-work canonical gate, the ipvv full build and site gate,
   and the svread manifest and browser tests from a clean checkout. The previously
   recorded ipvv gate cannot be reproduced in the present checkout because the
   generated receipts are absent.
3. On a staging Worker, back up the **correct** D1 database and test restore.
   Review and apply migrations 0002–0012 in order against the intended database,
   configure the intended provider, CORS origin, quotas and Git bridge, and
   establish a rollback. Never put secrets, private work or DB backups in Git.
   Publish the corresponding immutable reader assets and projection commit.
   The Worker currently fetches projection data from the public reader URL: make
   that source explicit and match it to the deployment before testing staging.
4. With two synthetic accounts, use the actual browser and real configured
   provider for one bounded, paid-if-applicable canary: sign in, save/reload a
   private enquiry, grant a test essay for answers, ask a cited question, revoke,
   and observe refusal. Test sign-out/account switch, offline recovery, a
   version-specific review, sign-off and a test submission to a non-production
   Git remote. Confirm no private text appears in public Git, caches or logs.
5. Log only bounded operational metadata by default: request ID, model/version,
   latency, outcome, token/cost counters where available and deployment ID.
   Do not log prompts, excerpts, transcripts, review bodies, tokens or credentials.
   Set per-user rate, length, concurrency, provider timeout and spend limits;
   show explicit failure instead of fabricating a result. Publish an operator
   retention/deletion policy matching the configured provider and DB.

**Done when:** clean-checkout gates and a recorded staging canary pass against
the exact release commits, rollback/restore has been exercised, and limitations
are visible to users. A mocked test or successful static-site deploy alone does
not satisfy this. Merge/deploy the recovery stack in dependency order, respecting
the other agent's changes and the repos' release gates.

### 2.2 Source and claim evidence that survives a new release

**User sees:** each supported paragraph offers “show source”: work, edition,
passage, layer, exact version, selected quote and an honest status such as
“source checked; interpretation awaiting review.” A missing edition is shown as
unknown rather than invented.

**Why first:** current citations carry T1/projection hashes, and essay-source
markers are checked against selected excerpts. They do not guarantee that every
claim has a source, that a quote supports the claim, or that the hashed
projection can still be retrieved after it changes.

**Proposed contract — do not reuse an existing hash scheme under a new name:**

```json
{
  "format": "svread-evidence/1",
  "source": {
    "kind": "sanskrit-layer",
    "work": "example-work",
    "passage": "example-segment",
    "layer": "c1",
    "edition": null,
    "immutable_object": {
      "repository": "prx0r/translation-work",
      "commit": "<full-git-commit>",
      "path": "<path-within-that-commit>",
      "content_sha256": "<sha256-of-declared-utf8-bytes>"
    }
  },
  "selector": {
    "quote": "<exact-substring>",
    "prefix": "<adjacent-text>",
    "suffix": "<adjacent-text>",
    "start_utf16": 0,
    "end_utf16": 17
  },
  "status": "unreviewed"
}
```

This is an illustrative shape, not a real citation; offsets and hashes are filled
from the actual pinned object. A Scholar-essay source instead names its exact
published essay ID and a **resolvable immutable projection/object**, author,
paragraph and applicable scope. Do not point an immutable citation only at the
current mutable URL. If the canonical source currently lacks a durable public
object, add a build-owned content-addressed public evidence snapshot **only for
material already authorized for publication**, with a retention plan and source
commit/path. Never put private notes, style examples or review reports there.

Define hash inputs at each boundary: source bytes are exact UTF-8 without
normalization; JS selector offsets refer to the exact decoded string in UTF-16
code units. Reject invalid ranges, surrogate splits, missing/multiple matches
and quote mismatches. Existing Scholar canonicalization and qprivately contracts
remain their own schemes; follow `SCHOLAR.md` rather than interchanging them.
An annotation on an older version stays anchored to that version. If a newer
version changes the quote or makes it ambiguous, mark it orphaned; offer a
human-confirmed re-anchor as a new record, never silently move it.

**Implement:** in translation-work's `tools/emit_scholar.py` emit versioned,
resolvable source identities where the data permits; validate in the canonical
schemas and `tools/scholar_service.py`. Extend ipvv's
`worker/src/scholar-workspace.js` citation preparation and submission checks;
extend svread's Scholar/Pushing source panels and `mcp/scholar_server.py` to
show the same references. Version and migrate the wire contract explicitly:
existing four-field citations remain readable; old citations without an
immutable object display “legacy reference”, and are not silently upgraded.
Keep the public Git bridge's accepted content schema and migrations coordinated.

**Tests:** exact source and quote resolve at the pinned commit even after the
current projection changes; a deleted/unavailable object, bad hash, altered
quote, ambiguous match, wrong passage/layer, UTF-16 surrogate boundary and
missing permission all fail closed. A hash-valid but semantically irrelevant
quote remains **unreviewed**, never “proved.” Test legacy citations and real
Git-backed object resolution in addition to mocked provider output.

### 2.3 Consent and review audit

**User sees:** for each published essay version, “allow answers” and “allow
drafting” separately, with provider disclosure, current setting, grant history
and a clear explanation of revocation. A changed essay needs a fresh decision.

**Implement:** extend `worker/migrations/0012_scholar_essay_permissions.sql` with
a **new** forward migration for append-only grant events plus current
materialized state. Record actor account, exact essay ID, scope, action, time and
policy/provider version; do not record the essay or prompt in the event. Update
the existing `PUT /api/scholar/essay-permissions` atomically with its event and
provide an authenticated author-only history view. Check the latest grant just
before dispatching each request; document the dispatch/revoke race and do not
promise to recall in-flight requests or provider copies. If a stronger guarantee
is required, serialize dispatch and revocation and test the actual mechanism.
Only the authenticated author account can grant; it is not independent proof
of the person's real-world identity or copyright ownership.

Set a separate explicit consent for any future external document ingestion and
provider use; publication, public Git presence or a copyright declaration is
not that grant. Private style examples remain owned by the authenticated
scholar. Review reports may be sent only when their author has opted in, the
essay author selects them, and they apply to the selected revision.

**Tests:** default-deny, cross-account access, independent scopes, stale version,
grant/revoke/regrant history, denied requests after observed revocation,
concurrent change around dispatch, selected-review consent and no confidential
text in logs/public Git. Test DB migration from a copy of the previous schema
and rollback/restore; document existing grants as history unknown.

## 3. The features that make it special — P1

### 3.1 Essay workbench: question → argument → draft

**User journey:** choose a branch and an available source passage; optionally
select a consented scholar essay and the author's own style edit pairs. Ask for:

1. **Construct:** the strongest charitable reading, labelled as a reconstruction.
2. **Prosecute:** its strongest objection and the precise inference in dispute.
3. **Provenance audit:** which claims are in the passage, which are editorial
   interpretation, which are scholarly positions, and which are the author's
   own inference; list missing evidence and unresolved questions.
4. **Draft:** an essay with a question, thesis, support, objection, response and
   open boundary. Keep it private and visibly AI-assisted until the existing
   human sign-off, validation and publication process.

Use a bounded sequence of calls to the existing `/api/scholar/assist` provider
interface, or one structured call where it proves adequate. Show exactly what
will be sent and obtain the existing consent before each provider request.
Offer a preview and allow the user to edit or stop; cap calls, input, output,
time and cost. No background multi-agent framework is needed. Treat all source
and user text as untrusted data, not instructions.

**Proposed private packet:** introduce `essay-packet/1` with
`enquiry_snapshot_sha256`, ordered `selected_node_ids`, an array of
`evidence_refs`, `thesis`, `claims[]` (stable ID, text, kind and evidence IDs),
`objections[]`, `open_questions[]`, model/prompt version and AI author label.
Hash the immutable session snapshot with a specified new canonicalization and
store the packet with the private draft. Do not put account IDs or private
enquiry text in public Git. Explicitly version the Worker draft-content schema:
today it only accepts specific essay content fields and four-field passage
citations; adding a packet needs validation, history and bridge changes.

Run a deterministic preflight: all referenced source IDs exist, quotes match,
known markers use the selected allowlist, public sources are publishable and
every claim explicitly designated as source-dependent has a reference or a
visible “citation needed” flag. Unknown citation forms, unavailable sources
or a revoked permission block the relevant action. A private draft can still be
saved as **unverified** with its flags; it is not publication-ready until the
author resolves them through the existing sign-off/review workflow. Structural
checks cannot decide whether the cited passage actually entails the claim:
display that question for human judgment, never call a schema check proof.

**Files:** `pushing-core.js`, `pushing-ui.js`, `pushing.html`;
ipvv `worker/src/scholar-workspace.js`, the new schema migration and
`tests/scholar-workspace.test.mjs`; translation-work
`tools/scholar_service.py` and relevant essay validation. Add a small
`mcp/scholar_server.py` tool only after the exact same account and consent
rules exist in the Worker. Preserve the current `svread-pushing/1` import.

**Tests:** one selected branch and source reach the model; sibling branches do
not. Unknown IDs, forged `E999:p1`, altered quote, wrong source, stale snapshot
and private notes without selection fail. A valid-looking but irrelevant
citation is marked for human review. Save/reopen packet without losing the
original question; changing the essay invalidates the old sign-off. Test
provider timeout/error, account switch and explicit consent declined.

### 3.2 The “why?” examiner for essays and peer review

**Starting point:** the existing branch supports a focused challenge on a selected
enquiry branch, including an excerpt the author chose from their own saved
essay. It retains an account and revision reference but does not yet verify an
exact annotation against immutable history or create a review suggestion.

**User sees:** select a paragraph of an exact saved revision, then ask: “What
must be true for this to follow?”, “What is the strongest rival reading?” or
“What would change the conclusion?” The result identifies the target quote,
assumption, objection, relevant evidence and an answerable next question.
The scholar can accept, edit or discard each suggestion.

**Implement:** reuse the existing revision-bound review snapshot and exact
annotation offsets. Add an explicit AI examination action with
`document_id`, `revision`, snapshot hash, exact selected quote and selected
permitted evidence IDs. Save AI suggestions as author-private draft items with
the exact target revision, never as another person's review, an independent
review, a decision or an approval. On revision change show the suggestion is
stale; retain it on the old version. To use a human review report, enforce both
reviewer's `ai_consent` and author's selection as the existing
`essay_revision` flow does. Do not send thread messages automatically.

**Tests:** changed text/revision produces a conflict; two reviewers cannot
impersonate one another; unconsented report never enters the provider request;
stale feedback stays on the old snapshot; AI critique cannot trigger a
promotion/sign-off or be counted as independent human review.

### 3.3 Crux notebook: turn conversations into reusable knowledge

**User sees:** a small card beside the enquiry:

> Question: If the perceiver is universal, why is blue manifest to me and not
> everyone? Proposed crux: what justifies the move from a local manifestation
> to a universal subject? Alternative: the two claims may concern different
> levels. Next action: locate and compare the relevant passage and objection.

This is a historical working question, not a settled interpretation or a
substitute for a source. The card retains the exact conversation ancestry and
distinguishes source, person's claim, proposed inference and objection. Let
users compare two readings side by side and identify the premise where they
diverge. Suggest related existing enquiries, but let a human choose a link;
similar wording does not prove the questions or traditions are equivalent.

**Starting point:** the branch already produces a local selected-branch crux
brief, with copy and transfer to the essay editor. It is derived on demand from
the tree; it is not yet a separately saved or shared card.

**Implement:** start with a private `crux/1` object containing a stable ID,
title, question, selected source/session/node references, thesis, disputed
inference, strongest objection, `unresolved_questions[]`, status, creator
and revision. Link an existing tree node to a card without changing its parent.
If multiple relationships are needed, add a versioned optional relation list
(`supports`, `objects_to`, `qualifies`, `related_to`) and retain original
parents. Keep `svread-pushing/1` import/export round-trippable; never invent
provenance when upgrading. Default private. Shared publication requires an
explicit author action, an independently reviewable public subset and revision
history. Do not make all account conversations a public knowledge graph.

**Tests:** the Q1 example remains open and attributed; two independent paths
can reference one proposed crux without losing ancestry; duplicates and cycles
are handled deliberately; export/import preserves old sessions; one user's
private tree is not discoverable by another; shared cards never contain an
unselected private turn. Deletion/retraction semantics must be specified before
public sharing, including the effect on existing citations.

### 3.4 Ask a scholar's work — permissioned answers

**User sees:** choose a scholar's permitted published essay and a question; the
answer separates “the author says”, “related passage” and “inference”, with
clickable exact-version paragraph citations. If nothing relevant is available,
it says so and points to the sources actually searched.

**Implement:** extend the existing bounded `scholar_essays` selection in
`/api/scholar/assist`. Retrieve only exact-version materials allowed for
**answers**, show the selected excerpts before the provider call and recheck
grants. Use small keyword search over authorized essays initially; list searched
sources and unknowns. Do not infer permission to use a work for drafting just
because answer use is granted. No account-private essay, review, style sample
or third-party library text is eligible merely because it exists in a repo.
Full external-paper ingestion needs its own provenance, rights and provider
consent design; start with already-published, opted-in Scholar objects.

**Tests:** answer-only grants answer but cannot draft; a revised essay or
revocation closes access; cross-work searches honor each author's scope; empty
results abstain; altered or nonexistent paragraph references fail; a model
instruction embedded in an essay cannot override system instructions. Measure
correct citation **and** human-judged support separately.

### 3.5 Style memory the scholar controls

**User sees:** a private “my choices” view showing actual before/after edit
pairs, source work/layer, dates and which pairs will be used. The scholar opts
into examples for one draft, can remove them and can inspect the resulting
translation or essay as an AI draft.

**Implement:** build on the existing `scholar_style_examples` and explicitly
selected `style_example_ids`; add an editable glossary of the scholar's
preferred terms as private versioned decisions only if the existing decision
mechanism cannot already express it. Rank candidates by work/layer and recency;
show the selected pair, never silently learn from another scholar's work or
review feedback. Preserve disagreement with the Sanskrit and surface tradeoffs
in lexical choices. Start with retrieval of examples and prompt context, not
automatic fine-tuning, voice impersonation or a claim that style is mastered.

**Tests:** only the owner's explicitly selected human edit pairs are sent;
deleting a pair removes it from future requests; disabled style sends none;
wrong work/layer is labelled; source evidence is not overridden by a style
preference; drafts retain the AI and human authorship distinction.

## 4. Later, after the first scholar workflows work — P2

- **Guided learning from a crux.** Turn an approved source/objection pair into a
  short exercise: identify a premise, compare two readings, then choose a next
  passage or hint. Retain the learner's own answer privately. Do not claim
  demonstrated mastery based on a single AI judgment.
- **Research library and bibliography.** First import metadata, stable IDs and
  links; use rights-cleared exact versions for full-text or model processing.
  Let scholars choose whether to permit answers and drafting independently.
  Metadata access is not permission to reproduce a paper or send its text to
  a model. Export a bibliography without making arbitrary server-side URL fetches.
- **Cross-work discovery.** Suggest possible connections by lexical matching
  over public metadata and opt-in cards, with source and uncertainty visible.
  Collect human corrections before considering embeddings, a vector service,
  cross-tradition alignment scores or a separate graph database.
- **Sanskrit candidates.** Evaluate Vidyut's segmentation and morphology as
  alternatives for a human to adjudicate, preserving tool/version/data
  provenance. Existing optional MCP support should not be described as
  verified morphology; independently check any linguistic data's rights.

## 5. Research patterns to reuse

These are design references, not bundled dependencies. Confirm current licences,
versions, transitive dependencies and data rights before copying code.

| Project | Useful mechanism | Adaptation here |
| --- | --- | --- |
| [ThoughtDAG](https://github.com/chenxiachan/thoughtdag) | Branching conversations with chosen context. | A selected path and explicit additional evidence determine each request; retain ancestry and user control. |
| [Argdown](https://github.com/argdown/argdown) | Argument maps distinguish statements, support and attack. | Typed crux links and side-by-side alternatives; defer a graph engine. |
| [SuttaCentral Bilara](https://github.com/suttacentral/bilara) | Stable segment keys align text and translations. | Passage identity persists across Sanskrit, layers, different authors and annotation. Do not assume their content licences apply to ours. |
| [Sefaria](https://github.com/Sefaria/Sefaria-Project) | Named text versions and linked references; source sheets combine materials. | Version-switchable passage links and curated, provenance-preserving reading sets. |
| [Hypothesis](https://github.com/hypothesis/client) and [W3C Web Annotation](https://www.w3.org/TR/annotation-model/) | Quote plus position selectors. | Exact quote/context anchored to an immutable version; surface ambiguous re-anchors for human confirmation. |
| [OpenReview](https://github.com/openreview/openreview-web) | Revision-specific reviews and controlled visibility. | Preserve review revision, author response and reviewer consent; AI critiques never become independent review. |
| [Citation.js](https://github.com/citation-js/citation-js) | CSL/BibTeX/RIS bibliographic interchange. | Evaluate a pinned, minimal module only when metadata export is needed; metadata is not a full-text licence. |
| [Vidyut](https://github.com/ambuda-org/vidyut) | Sanskrit transliteration, sandhi, segmentation and morphology candidates. | Optional local adjudication aid; assess data rights and coverage separately. |
| [Promptfoo](https://github.com/promptfoo/promptfoo) | Repeatable prompt/model tests and adversarial cases. | An optional offline harness over synthetic or explicitly permitted fixtures; never send private examples to an evaluator without consent. |
| [UBC Socrates](https://github.com/ubc/socrates-v3) | Guided source-grounded questioning. | Borrow the interaction idea; its GPL-3.0 code is not copied into this prototype. |

## 6. Acceptance suite and implementation lanes

Maintain two distinct suites:

1. **Deterministic safety/integrity:** exact reference/quote/permission checks,
   account isolation, migration/restore, cache safety, stale signatures,
   concurrent edits, idempotency, payload limits, invalid structured output
   and injection attempts. These can gate every commit.
2. **Human-annotated research quality:** create at least 20 deliberately varied,
   rights-cleared examples from actual available sources, with the exact
   edition/version/quotes and a human-recorded expected support judgment. Include
   unresolved questions, two plausible readings, a mistaken quantifier jump,
   weak C1 evidence, no-source abstention, revocation and a genuinely useful
   objection. Keep the historical Q1 as a question until a qualified person
   supplies real supporting references. Compare retrieval correctness,
   citation resolution, unsupported-claim rate and usefulness separately;
   report the sample and human disagreement. Automated model judges may flag
   candidates but do not replace the annotated source review.

Coordinate ownership to avoid collisions:

| Lane | Main files | Earliest deliverable |
| --- | --- | --- |
| Reader | svread `pushing-core.js`, `pushing-ui.js`, `pushing.html`, `tests/pushing-*.cjs` | Explicit evidence and enquiry packet UI. |
| Account/API | ipvv `worker/src/scholar-workspace.js`, new migration, `tests/scholar-workspace.test.mjs`, `tests/pushing-scholar-permissions.test.mjs` | Consent event migration and citation preflight. |
| Canon/bridge | translation-work `schemas/`, `tools/emit_scholar.py`, `tools/scholar_service.py`, `tools/scholar.py` | Immutable source identity and compatible validated export. |
| Release/integration | Both repos' integration tests, release manifests and deployment configuration | Reproducible build and staging canary with two synthetic accounts. |

Before each checkpoint run the owning repo's required gate; on svread use
`python3 scripts/release_manifest.py` and `node --test tests/*.cjs`, and run
the actual browser integration with `SCHOLAR_BROWSER_EXECUTABLE` and
`SCHOLAR_WORKER_ROOT` set. On ipvv use the documented `bash tools/verify.sh`
and `python3 tools/verify_site.py`; on translation-work run `python3 check.py`.
Run the focused Worker and bridge tests for changed behavior. Record skipped and
blocked checks honestly; push a review branch as a checkpoint rather than
representing a partial gate as a production release.

For the current branches, the cross-repository tests must be pointed at the
matching checkouts; their default sibling paths may exist but contain a different
bridge version. From the ipvv checkout:

```sh
SCHOLAR_TRANSLATION_ROOT=/path/to/translation-work \
SCHOLAR_MCP_SERVER=/path/to/svread/mcp/scholar_server.py \
node --test tests/scholar-workspace.test.mjs \
  tests/pushing-scholar-permissions.test.mjs \
  tests/scholar-publish-e2e.test.mjs tests/scholar-mcp-e2e.test.mjs \
  tests/scholar-auth.test.mjs
```

From the svread checkout, with a compatible Chromium and Playwright installed:

```sh
SCHOLAR_BROWSER_EXECUTABLE=/path/to/chromium \
SCHOLAR_WORKER_ROOT=/path/to/ipvv \
node --test --test-concurrency=1 tests/*.cjs
python3 -m unittest discover -s mcp -p 'test_*.py' -q
```

These integration tests use a local Worker and SQLite, and mock the provider
and public projection fetch. The publication test uses a real temporary Git
remote. They do not establish a deployed Worker, actual D1, a live provider,
source completeness or philological correctness.
