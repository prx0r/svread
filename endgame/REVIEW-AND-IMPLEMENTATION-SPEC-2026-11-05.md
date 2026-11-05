# Endgame review and implementation specification

**Date:** 2026-11-05. **Purpose:** an actionable review for the next agent, not a claim that these changes are already live. Keep the owner's sequence in `ENDGAME-BUILD-PLAN.md`: source identity → calibrated translation checks → IPVV/Tantrāloka → richer decision structures → pathways and content. Ship a useful vertical slice at each stage.

## 1. Verdict and scope

The destination is compelling: a scholar should be able to open an exact Sanskrit passage, inspect alternative readings and grounds, fork a translation, ask a source-aware assistant to help, write an essay, get revision-specific criticism, and publish a citable version with transparent authorship. A reader should be able to follow a claim back to its actual evidence and its limits.

The main problem is **not lack of architecture**. The current plans sometimes treat a candidate record, hash, automatic PASS, model judgment, account sign-off and independent peer review as though they established the same thing. They do not. Resolve that distinction before expanding autonomous production; do not build a large new graph service just to represent it.

Reviewed snapshots: svread `ce8f525`, translation-work `caa9b66`, SanskritBench `cb5981b`, OpenPāṭala `4147a19`, ipvv `origin/master` `365c122`. The earlier audit work is in **open, unmerged** [translation-work PR #8](https://github.com/prx0r/translation-work/pull/8) and [svread PR #6](https://github.com/prx0r/svread/pull/6). Their tests are useful evidence, but do not describe either PR as merged or as live deployment. “Live” in older endgame docs is a historical operational observation, not evidence that the present service or a particular commit is running.

### Fix these statements before agents treat the plan as policy

1. `ENDGAME-BUILD-PLAN.md` §0 says OpenPāṭala is first; §4 says the tau table is first. Make §0 authoritative and describe the tau pilot as parallel preparation, not a precondition to identifying sources.
2. The same plan calls 3 verses × 3 candidates a *proof* of human correlation. It is a smoke test. Its actual evaluator has no human quality ratings, and currently uses the same model for generation, judging and semantic scoring.
3. `endgame/README.md` says higher rungs may not be built on unsigned lower rungs. That would prevent private drafting and obscure what an agent actually did. The publish policy, identity, source and review states must be separate; a private draft may cite a clearly marked candidate, while publication follows the current human authorization rule and configured gates.
4. `IPVV-IMPORT.md` says the imported `source.start/end` values are byte spans. The checked data does not support this. Follow the migration contract in §3, not the current “run intake per volume” recipe.
5. `SYLLABUS-COMPILER.md` asserts there are “no dīkṣā issues in VBT.” Treat requirements as passage- and lineage-dependent and potentially disputed; a model or keyword classifier cannot grant eligibility.

## 2. Concrete findings, severity and ownership

| Priority | Finding and evidence | Required outcome | Owner |
|---|---|---|---|
| P0 | **IPVV source-coordinate mismatch.** Bundle `chunkA-svatyandya` says start 200/end 600 and contains 401 lines / 27,723 UTF-8 bytes. Those numbers cannot be byte offsets. In the checked `ipvv-vol1.txt` its 401 lines match source lines 204–604. Across 49 bundles, 43 line counts equal end−start+1 and six differ by one; adjacent ranges include overlaps and gaps. `intake.py` requires non-overlapping, complete UTF-8 byte spans and refuses an existing work directory. | Declare and verify the old coordinate system; build a reversible, reviewed migration with per-volume exact bytes. Preserve unresolved gaps and overlaps. | translation-work + ipvv source owner |
| P0 | **A passing citation check can miss source words.** The Paramārthasāra 1 L2 `sanskrit_cite` omits `ekaṃ niviṣṭaṃ bahudhā guhāsu`, while its recorded proof reports `PASS` with no L2 citation failures. The omitted Sanskrit occurs in the pinned source. This shows an incomplete citation, not necessarily an incorrect English translation. | Treat partial quotes as explicitly partial; where a full passage is claimed, check the complete source span and require human disposition of omissions. | translation-work |
| P0 | **A proof label overstates SanskritBench.** `check_coverage` uses word-count ratios; “source binding” is a length heuristic; the current result ID hashes a function object and only the first 40 candidate characters. A negated candidate can pass. | No heuristic PASS becomes fidelity, review or publish approval. Pin actual program and full inputs; report diagnostic categories and unknowns. | SanskritBench + translation-work |
| P0 | **The meta-evaluation is not human validation.** `validate_benchmark.py` calls the LLM comparison the “human” signal, gives the judge reference and candidates rather than the Sanskrit, uses one model for multiple roles, and its `kendall_tau` is not τ-b with ties. For `[1,1,2]` vs `[1,2,3]` it returns 1.0; τ-b is 0.816496…. | Separate genuine blinded human ratings from model proxy ratings; correct the statistic; publish data and uncertainty, not “proof” from n=3. | SanskritBench |
| P0 | **Experiment lineage is incomplete.** The benchmark passes a test/config descriptor as `gold` to `run_recorder`, not the selected actual rows; candidate text and individual judgments are absent from the aggregate raw record. The recorder hashes all supplied raw rows but saves at most 20, and writes to the same signature filename. | Content-address actual dataset, candidates and outputs; keep repeated nondeterministic runs separately and immutable. | SanskritBench |
| P0 | **Source identity is weaker than the plan implies.** A GRETIL external-ID match identifies a work candidate; it does not by itself authenticate an edition or manuscript witness. The checked Paramārthasāra OpenPāṭala dossier asserts language `en` despite the Sanskrit source. | Preserve conflicting assertions and UNKNOWN witness status until resolved with evidence. | OpenPāṭala + source owner |
| P0 | **Our new audit is a verse pilot, not an IPVV bridge.** PR #8's `lineage_audit.py` requires `<song>-v<number>` plus `workcfg` verse mappings and song JSON; IPVV's imported prose chunks do not satisfy that interface. | Add a versioned passage adapter for prose, multiple spans and volume IDs while preserving the working verse adapter and existing receipts. | translation-work + OpenPāṭala |
| P0 | **The supposedly canonical layer orders disagree.** `stack.json` lists C2 before L3/L4; `schemas.LAYER_ORDER` and `LAYERS.md` put it after them, while the endgame introduces L200 as a required seam absent from that layer registry. `check.py`'s `stack-sync` currently checks required fields and schema version, not layer ordering. | Settle a versioned dependency graph and the status of L200 with the translation lane; check it mechanically and preserve old schema versions. | translation-work |
| P0 | **Review/sign-off is not independently established by a hash.** The account-backed essay example is self-attested; public essay records need not contain an independent review, and the historical legacy signature warning remains. | Bind each review and approval to an exact immutable object and scope; distinguish account approval, cryptographic signature, editorial review and verified independent peer review. | ipvv Worker + translation-work |
| P0 | **Private-to-public leakage through the “organism.”** `NIBBANAHELP-INTEGRATION.md` proposes mining sessions; read-only access does not make diaries or conversation safe to export. Hashing them does not anonymize them. | Default private; explicit, scoped opt-in for each source and use; strip/aggregate before a queue is shared; enforce revocation and retention limits. | nibbanahelp + Scholar |
| P1 | **Essay traceability stops at a citation list.** One can attach a passage without establishing which sentence it supports or that an argument follows. Same-paragraph quote verification is useful but is not entailment. The checked-in editorial essay has no citation to the demonstrated verse. | Add a small, revision-bound claim/evidence table and show unresolved objections. | svread + Scholar |
| P1 | **“All works” is an inventory target, not verification coverage.** A source record may be `UNKNOWN`; a catalogue's work count, a SHA and a successful schema check do not establish edition, complete span, licence or human review. | Report each dimension separately, with denominators and unresolved records. | OpenPāṭala + translation-work |
| P1 | **Release is coupled to machine-local paths and several repositories.** Original `/root/...` paths, R2 artifacts, generated manifests, pinned gates and private service configuration matter. A branch is not a deployed Worker, bridge or reader. | Fresh-checkout release manifest and reproducible integration checks; separate test, candidate release and deployed version. | release operator + repo owners |
| P1 | **Learner and practice claims exceed review.** A source-to-practice compiler may preserve offsets but still misclassify a ritual, prerequisite or bodily instruction; one author's tradition is not every lineage. | Text-study default, named reviewed interpretation, explicit prerequisites and human practice review; UNKNOWN is not “beginner safe.” | satsang + deitybody + qualified reviewers |

Relevant code: [IPVV import recipe](https://github.com/prx0r/translation-work/blob/caa9b66/IPVV-IMPORT.md#L38-L64), [intake offset contract](https://github.com/prx0r/translation-work/blob/caa9b66/tools/intake.py#L22-L65), [benchmark experiment](https://github.com/prx0r/sanskritbench/blob/cb5981b/pipeline/validate_benchmark.py#L38-L94), [run record](https://github.com/prx0r/sanskritbench/blob/cb5981b/pipeline/run_recorder.py#L106-L135), [endgame plan](https://github.com/prx0r/svread/blob/ce8f525/ENDGAME-BUILD-PLAN.md#L8-L18), [practice pilot](https://github.com/prx0r/svread/blob/ce8f525/endgame/SYLLABUS-COMPILER.md#L96-L108).

## 3. Source → OpenPāṭala → passage contract

Use **one sidecar per source edition/volume**, not one fabricated witness per work. The independent source bytes and licence are upstream of the logical passage; a passage may contain root verse, commentary prose, embedded quotations and editorial material. Keep the edition distinct from any particular physical witness.

Minimum source record `source-record/1`:

```json
{
  "work_id": "ipvv", "source_id": "ipvv-vol1-EXACT-SHA256",
  "content_sha256": "<64 hex, bytes as acquired>",
  "edition": {"label": "...", "status": "candidate"},
  "witness": {"id": null, "status": "UNKNOWN"},
  "openpatala": {"work_id": null, "mapping_status": "CANDIDATE", "evidence_refs": []},
  "rights": {"status": "UNKNOWN", "statement_ref": null},
  "selectors": {"unit": "utf8-byte", "end": "exclusive"},
  "acquisition": {"origin": "...", "retrieved_at": "...", "acquired_by": "..."}
}
```

This JSON illustrates the **proposed** contract; it is not an implemented schema or a witness claim. `UNKNOWN` is a valid recorded state. Assertions about title, author, language, edition, witness and licence carry evidence, author, time, source and disagreement; do not silently replace a provider's disputed assertion. A title or shared GRETIL ID can produce a candidate mapping, not automatic promotion. Require the source SHA and the exact edition record on every span. Stable work, passage and content-version IDs are different identities: a corrected transcription makes a new source version and new selectors, with an explicit `supersedes`/alignment event, never a silent overwrite.

### IPVV migration, one chunk first

1. Preserve each original bundle and its hash. Record its `vol`, original `start/end`, declared/observed coordinate type and exact bundled text hash.
2. Compare the bundle text to the source volume using full line sequences. Report zero matches, multiple matches, normalization differences, gaps and overlaps. Do **not** infer a universal `+4` offset from the one example above.
3. For a unique exact match, compute byte offsets against the SHA-pinned UTF-8 volume; verify `raw[start:end]` equals the bundled bytes. For a non-exact match, retain `CANDIDATE` and a reviewer decision; never change text just to make offsets pass.
4. Represent a **logical commentary chunk as one or more spans**. Keep original physical line numbers, the new byte selector, and paragraph/root/embedded-citation relationships. Overlapping navigational views may coexist; the authoritative source coverage partition must separately account for every intended byte, including explicit non-content/editorial exclusions.
5. Extend or wrap intake with a versioned *add-source-to-existing-work* path and multiple volume manifests. Do not call the current `initialize` three times for an already existing `ipvv` directory or force prose chunks into made-up verse IDs. Convert legacy line-level L0 and T1 data as candidates, retaining original IDs, raw row hashes, conversion tool/config and any unmappable records.

Acceptance: one M00020 chunk round-trips to exact bytes; a deliberate off-by-one, changed source file, missing span, ambiguous match and unaccounted overlap fail or remain UNKNOWN; an independently checked root/commentary/quotation relationship survives a clean checkout. Then repeat by volume. No blanket import or PASS stamping.

The audit API must resolve both legacy verse IDs and opaque prose chunk IDs. Introduce a `PassageAdapter` boundary returning `{work, passage_id, source_versions[], spans[], layer_objects[], source_evidence_state}`; the adapter performs all work-specific selection and returns normalized, hash-pinned artifacts to the common auditor. Keep the existing `/2` receipt and verse behavior readable; issue a new schema version only if the output contract changes. A missing adapter or absent T1/L0 must return a clear incomplete/blocked result, never reuse a verse's proof for an entire commentary chunk.

## 4. Translation layers and SanskritBench

Each versioned layer object carries `work`, stable passage ID, `layer`, schema version, content hash, author/agent ID, parent version, source and upstream layer hashes, creation provenance and licence/permissions. A change to an upstream hash marks *dependent assessments* stale; it never erases older versions. Preserve the project's existing compact JSON hash and human-authority hash as **different named schemes**, with test vectors; never substitute one for the other.

Publish a **versioned dependency DAG** rather than assuming a list is a complete process. At minimum reconcile `stack.json`, `schemas.LAYER_ORDER`, `LAYERS.md` and `agent_contract.py`; specify which dependencies are required versus optional, and define whether L200 is a layer, a review artifact, or a work-specific historical format. Do not automatically add L200 to every legacy work or migrate C2/L4 content without a documented compatibility decision. Add a gate that checks actual order/dependencies and fails on a deliberate C2-before-required-L3 mutation; the current `stack-sync` passing is not evidence that this has happened.

Expose separate check outcomes: `PASS`, `FAIL`, `UNKNOWN`, `NOT_APPLICABLE`, and an explicit evidence scope. Minimum checks: source byte integrity, segment completeness versus the declared source, T1/L0/ARGMAP/L2/C1/L3/L4 schema and cross-layer invariants, cited-span resolution, benchmark diagnostics, review status and rights. A check can pass while semantic fidelity remains UNKNOWN. A human can review a token, a reading or a whole passage, but the review must state its actual scope; do not infer a whole-work audit from a sample.

Give a quotation a `coverage` field (`FULL_SPAN` or `EXCERPT`) and verify it against the exact targeted source version. Existing fragment-match checks may support `EXCERPT` but cannot certify `FULL_SPAN`. Add the Paramārthasāra 1 omission above as a regression fixture; correcting display data is a separate reviewed change with a new content version, not a rewrite of historical proof records.

### Benchmark protocol

- First, retain current SanskritBench checks under their pinned version as **advisory**. Rename displayed meanings to the actual measurement: length ratio, glossary substring heuristic, and so on. Version any replacement; do not rewrite historical results.
- Build a small consented evaluation set with source edition and byte-span hashes, candidate IDs and full candidate text hashes, annotation guidelines, attribution, licences, adjudication and distinct train/development/held-out splits grouped by work and source edition. Measure translation quality against **human annotations**; label LLM judgments `MODEL_PROXY` separately. Multiple valid translations and textual variants are allowed.
- Include negation, omissions, additions, agent/source inversion, word-order differences, technical terms, valid synonyms, compounds, prose/commentary and long contexts. Record severity, false-pass and false-block rates by error type, work, register and length; include confidence intervals and human agreement. Hold out entire works to detect leakage.
- Correct τ-b against a trusted implementation and fixture tests including ties and undefined/all-tied cases. Compare chrF, BLEU and any COMET or LLM score on the **same** held-out candidates and named human labels; inspect Sanskrit support and licensing before claiming applicability. A 3×3 run is only an end-to-end smoke test. Do not use a judge in the score and then claim agreement with that same judge as independent validation.
- A run records actual dataset digest, source/annotation revisions, full candidate IDs and output digests, evaluator code hash, model/provider and resolved configuration, randomization, failures, raw judgments or access-controlled references, and metrics. Use a unique execution ID plus content-addressed immutable artifacts: reruns with the same input signature must not overwrite one another. Report nondeterministic model outputs as recorded outputs, not reproducible deterministic computation.

Acceptance: the tie example returns approximately 0.8165; an all-tied ranking is undefined, not a fabricated score; negation/adversarial fixtures are not labelled “verified faithful”; changing any source/candidate/annotation changes the corresponding artifact digest; two stochastic reruns remain individually retrievable.

## 5. Scholar, agent and review authority

Store private work, style examples, review reports and account identifiers behind account access controls, not public Git. A project has an owner, collaborator permissions, exact source references, private notes, drafts, revision history and an explicit publication action. Importing an essay is not permission to send it to an LLM, train on it, quote it publicly, or publish derivatives.

For translation-style and essay-style assistance, use the existing opt-in retrieval of the scholar's selected prior **human-edited** examples as the baseline. Record the example/version IDs, provider, model, prompt-template version, requested scope and author consent in private provenance; make absence or withdrawal of consent block future use. Do not call this a fine-tuned model. Evaluate whether examples improve terminology and voice on scholar-held-out passages, with the author judging both quality and unwanted imitation; no cross-scholar mixing by default. Fine-tuning is a later opt-in research experiment, not a prerequisite.

An agent may propose an explicitly agent-attributed translation, objection or essay; it cannot impersonate a scholar or perform the scholar's approval. Under the current owner rule, publishing requires an authorized human action; any future public agent-only draft lane needs a separate explicit policy, label and gate. Distinguish contributor, editor, reviewer, publisher and rights holder. “Owner signs everything” must not imply the platform owner is author or owner of a visiting scholar's work.

A review targets `{object_id, content_sha256, revision, scope}` and records reviewer account/key, role, decision, conflict declaration, evidence and time. An author can approve their own work but that is not independent review. Cryptographic signatures, if added, sign the complete canonical event with an explicit algorithm, key ID, version and trust/rotation/revocation policy; a public key alone does not verify a person's identity. Retain legacy ID-only signatures labelled historical. A reviewer must expressly opt in before private comments go to any AI provider. A proposed criticism is an agent report until a human reviewer adopts it.

Do not use a time-per-signoff floor as proof someone read the work. Show unresolved diagnostics, require an affirmative scope-specific action and preserve the resulting event; independent sampling is a separate quality measure.

## 6. From enquiry to evidence-bound essay

Use the existing private Pushing/Scholar workspace. A minimal `research-project/1` contains question, working thesis, selected permitted sources and versions, source-specific notes, claims, objections, draft revisions and visibility. The graph is a view over these existing objects; no new graph database is necessary for the pilot.

An `essay-claim/1` record links one exact essay revision and paragraph/span to a claim type (`quotation`, `translation`, `historical`, `interpretive`, `argument`, `open_question`) and zero or more typed evidence links (`supports`, `qualifies`, `opposes`, `context`). Each link identifies source/work/edition/span, translation and layer version, evidence hash and access rights. A source citation proves resolution, not that the claim follows. Record `UNASSESSED`, `DISPUTED`, `HUMAN_ASSESSED` etc. independently of citation matching.

The first PUSHBACK assistant returns a small list of revision-bound candidate issues: claim span, category, source refs and exact scope, reason, alternative or counterevidence, status and model identity. It may say “unable to find support”; it must not claim a search exhausted all scholarship. The author can accept, reject, revise or defer each issue with a reason; unresolved issues remain visible in the signed snapshot. A reviewer invitation targets an exact version, and a later edit makes earlier approval stale for the changed snapshot.

Hard failures: nonexistent or changed source hash, fabricated verbatim quote, permission denial, invalid schema, stale required sign-off. Interpretive disagreement, uncited original argument and machine-suggested counterevidence are **reviewable judgments**, not automatic verdicts of falsity. The current quote check is limited to cited fields in the same paragraph and user-supplied sources are unverified; it cannot certify the argument.

Acceptance: create an essay with two claims and a real cited verse; inspect both evidence links; change one source/essay revision and see the affected link and sign-off become stale; a cross-paragraph borrowed quote fails; two scholars can disagree without overwriting each other; publish/retract operates on an exact version and rights statement. The existing editorial note must continue to be `UNLINKED` for the verse, not retroactively assigned evidence.

## 7. Privacy, rights, release and practice

For every artifact separately record rights to view, quote, redistribute, use in answers, use in drafting/style examples, train/fine-tune, generate audio/video and publish. Unknown rights block the corresponding reuse. Check the **current grant at request execution**, not just when a search index was built. Caches, embeddings, transcripts, queued jobs and media inherit the strictest applicable visibility; revocation prevents future retrieval and invalidates derived private indices. Record what has already left the system: revocation cannot guarantee deletion from public Git, a DOI archive, a third-party model provider or previously downloaded copies. Provider retention terms and paid/free limits need independent verification before deployment.

Personal sessions never enter an aggregate question queue, scholarly draft, training set or public artifact by default. With explicit per-session opt-in, produce a reviewable de-identified proposal with a provenance link in the private account; only the owner can approve any publication. Do not expose personal IDs, diary text, private prompt hashes or access tokens in public receipts.

A release manifest pins repo commits, source/edition and dataset hashes, schema and gate-program versions, required R2 objects and rights, reader projection, tool/runtime dependencies and deployed service versions. The actual documented producer owns each output: do not blanket re-emit ingest-shaped ipvv files; preserve hand-written argument maps; trace provenance; run each repo's existing gates and only then deploy. Validate in a clean checkout and separately record production verification; do not turn a test fixture or a local MCP response into a claim of a live provider call. Retraction is a new event plus regenerated public projection, not a promise that Git history disappears.

Practice pathways are projections of reviewed source and teaching context. A unit starts as `study`; `practice` requires a named scope, contextual prerequisites, permitted-source rights and a qualified human review. `UNKNOWN` or disputed initiation requirements stay study-only. Teacher/lineage disagreements are retained as positions, not resolved by keyword matching. Body-map visualizations cite the specific edition and editorial decision rather than calling one dataset universal truth. No consumer journey data flows into scholarly corpora without a separate explicit grant.

## 8. Execution sequence and definition of done

1. **P0 now — reconcile the plan.** Merge/review PR #8 and #6 under the normal release process, or clearly record why held. Update the contradictory benchmark, IPVV byte-span and unsigned-draft language; mark historic deployment statements with exact commit/date. Do not copy a candidate witness into 86 records.
2. **P0 pilot — one real source and one IPVV chunk.** Keep the Paramārthasāra receipt as a known `CANDIDATE`/`UNLINKED` example. Execute §3 on one IPVV prose chunk, including its source volume, actual line-to-byte conversion, overlap report and conversion fixture. Output no fabricated PASS.
3. **P0 benchmark reliability.** Correct/label the current metrics and result IDs; record actual test data and immutable runs; establish a small independently annotated gold protocol and red-team fixture. Smoke-test 3×3 only for plumbing.
4. **P1 Scholar loop.** Add exact versioned claim/evidence links and revision-bound agent PUSHBACK reports to the existing private project, retaining full author control and rights. Test two accounts plus change/review/signoff/publish and one optional historic projection.
5. **P1 release and expansion.** Reproduce the release from clean checkouts with rights and required artifacts available; project precise status dimensions in the reader. Expand source maps and conversion work per-volume only after sampling the pilot. IPVV/Tantrāloka remain blocked or explicitly incomplete wherever evidence is missing.
6. **P2 paths/media.** Produce one reviewed, source-cited study unit before scaling generation; add practice only after the separate eligibility review. The endgame graph and renderers consume existing evidence and permissions.

**One useful completed slice:** an identified person or clearly labelled agent works on one pinned source passage; the system shows source identity and uncertainty, complete available layer versions, reproducible checks and what they do *not* prove; a scholar creates a cited essay with a visible objection, approves the exact revision, and an independent user can resolve the released public evidence and its applicable rights. An unresolved witness is shown as unresolved. A DOI or manuscript link is not fabricated to make the demonstration look complete.

### External technical references

- [W3C Web Annotation Data Model](https://www.w3.org/TR/annotation-model/): selector/state concepts for portable passage anchors; a selector does not establish historical identity.
- [SciPy Kendall τ-b definition](https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.kendalltau.html): ties affect the denominator.
- [WMT 2023 metrics shared task](https://aclanthology.org/2023.wmt-1.51/): human-rated system/segment evaluation and statistical comparison; Sanskrit-domain validation still needs its own data.
- [in-toto attestation statement](https://github.com/in-toto/attestation/blob/main/spec/v1/statement.md): useful content-addressed provenance pattern; our current receipts are not signed in-toto attestations.
