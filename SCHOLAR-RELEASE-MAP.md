<!-- status: historical — release map superseded by PRODUCTION.md -->

> **Status (2026-11-11):** historical — release map superseded by PRODUCTION.md.

# Scholar suite: release map

This is the checkpoint map for svread PR #3 and its companion Worker and translation-work PRs. The PR is draft and currently has merge conflicts; do not deploy until resolved and tested.

## P0: real scholar workflow
1. Reconcile svread #3 with current main; preserve reader and other agent changes.
2. Integrate ipvv #9 and translation-work #7 with their current bases. Apply Worker migrations 0002–0007 in a test environment.
3. Verify source editions and repair withheld Ghatakarpara source and dependent layers at their authoritative sources. Do not bypass gates.
4. Configure account, Qwen free-tier limits and publication bridge. Exercise real browser: save private draft, edit, consent to style examples, request revision-specific review, sign off, validate and submit to a test Git branch.
5. Run documented repo gates and deploy only when dependencies, source library and generated receipts are available.

## P1: Scholar desk
Bilara: stable passage-aligned source and version editor; Weblate: private account-owned translation memory; OpenReview: revision-specific reports, discussion and consent; Recogito text-annotator-js (BSD-3-Clause): evaluate selection and revision-bound annotations; Vidyut (MIT code, data rights separate): evaluate candidate morphology against scholar-reviewed fixtures.

## P2: research and publishing
Manubot: evaluate citations and reproducible export; Sefaria: typed passage links and source notebooks; Scaife: version-aware citation identifiers; CollateX (GPL-3.0): offline source-witness alignment pilot; Saktumiva: critical apparatus workflow; Zenodo: optional archival release. Pin dependencies and review individual licenses and source rights before integration.

## Security and provenance
Private drafts, edits, style examples and reviews remain account-scoped. AI use requires consent, labels agent outputs and records selected evidence. Review and sign-off bind exact revisions. No automatic public publication or invented human approval. Source hashes demonstrate integrity, not textual correctness.

## Checkpoints
Push small testable commits to review branches; never force push. At each checkpoint record repo, commit, tests, dependencies, live status and unresolved gates. An open PR is not a deployment.

## Decision-memory checkpoint

ipvv #9 now contains migration 0008 and account-scoped decisions tied to exact
saved revision hashes. The svread Scholar desk and local MCP bridge can create,
list, remove and explicitly select those decisions for consented Qwen drafts.
Deploy the matching Worker and migration before enabling this UI; this checkpoint
is not a production deployment. Tests mock the provider. The ipvv full site gate
remains blocked by missing receipts and source/build inputs.
