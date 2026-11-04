# Pushing Lab — prototype and handoff

## Purpose

Turn a person's question or pasted conversation into a private, branching enquiry:
question → source or proposed answer → objection / crux → deeper question → essay
seed. The person chooses what becomes a node. A node has a type, origin and parent;
these are editorial assertions, not proof that a claim is true or reviewed. The
pinned Tantrāloka sessions in `ipvv/site/data/pushing/tantraloka/` are examples of
this method, not an authoritative edition of the Sanskrit.

The existing IPVV `specs/pushing/PUSHING_GUIDE.md` and
`process/PUSHING-QUESTION-CRAFT.md` are the method: let the text speak first,
then construct, question the inference and record the honest boundary. Keep
modern comparisons distinct from textual assertions. Never call an AI extraction
or a discussion an accepted, verified or publicly promoted claim.

## Working prototype

Open `pushing.html` from the reader navigation. For local use:

```sh
python3 -m http.server 8000
# Open http://127.0.0.1:8000/pushing.html
```

- Search 57 pinned enquiries from the IPVV Pushing index, including the
  Tantrāloka and IPVV sessions, or type your own question. The old enquiries
  are working research, not primary sources. Rebuild the catalogue with
  `python3 scripts/build_pushing_catalog.py --ipvv /path/to/ipvv`.
- Paste a labelled conversation and select turns into an editable tree. Add an
  answer, inference, objection, crux or branch; choose suggested questions or write
  your own. Speaker labels are as provided, not identity verification.
- Choose an available Scholar passage. The page checks the projection and T1
  hashes, displays the source and records its reference. A hash verifies bundled
  bytes, not edition accuracy, complete coverage or an interpretation.
- Everything stays in this browser by default; export/import JSON for a backup.
  A Scholar account can explicitly save or reopen a private snapshot containing
  the complete pasted conversation. Each save creates a new private snapshot.
- Load **your own** saved Scholar essay, select an exact excerpt and add it to the
  enquiry. Its account, revision and snapshot hash remain attached locally. A
  different signed-in account cannot send or save that referenced excerpt. The
  local copy remains on the device after sign-out; the user is told before adding it.
- Select saved passage references, including their private notes, and published
  scholar essays from one or more works whose authors have permitted the requested use. Authors can grant
  answers and essay drafting separately for an exact published version, or revoke
  those grants. No permission is inferred from copyright or publication alone.
- Ask Qwen about the selected branch only after confirmation. The Worker retrieves
  chosen passage layers, including available C1, and bounded permissioned essay
  excerpts. A scholar citation identifies the exact essay and paragraph. The user
  chooses whether to add the proposal to the tree. No other branch, private essay
  ID or account ID is sent as branch context.
- Draft an essay from the selected enquiry with Qwen; optionally select the
  scholar's own prior human edit pairs as style examples. The draft is private
  and marked AI-assisted. The selected passage references are prepared and
  rechecked before saving; the author's bibliography is added to the draft.
  Model-generated arguments and citation relevance still require human review.
  Scholar's existing review, sign-off and publication flows remain separate.

For development against a local Worker, configure its `CORS_ORIGIN` as
`http://127.0.0.1:8000`, start it on `127.0.0.1:8787`, and open:

`http://127.0.0.1:8000/pushing.html?api=http%3A%2F%2F127.0.0.1%3A8787`

The `api` override is accepted only when both the page and the API are on a
loopback host; a public page cannot be redirected to another API this way. The
Worker currently fetches its evidence from the public svread projection URL, so
its evidence must also be available there or supplied by a test adapter.

The matching ipvv #11 Worker and migrations 0002–0012 are needed for account,
author permission, source, essay and Qwen buttons. A configured provider and explicit consent are needed for Qwen; the
prototype's local enquiry, prompts and JSON import/export do not need either.
Tantrāloka Scholar projections are not available in this bundle, so its archive
sessions can be explored but cannot be attached as verified Scholar passages.
Ghaṭakarpara is withheld while its source coverage is repaired.

## Checks

```sh
node --test tests/pushing-core.test.cjs
SCHOLAR_BROWSER_EXECUTABLE=/path/to/chromium \
SCHOLAR_WORKER_ROOT=/path/to/ipvv \
node --test tests/pushing-browser.test.cjs
python3 scripts/release_manifest.py
```

The optional browser test runs the actual page and local Worker against SQLite,
with the Qwen provider and Worker projection fetch mocked; the browser reads
hash-valid projections containing test published essays from two works. It checks
scoped author permission, selected C1 and style examples, cited AI essay drafting, selected-branch
isolation, declined consent, source holds, private saving, account switching and
untrusted text rendering. It does not establish real D1, provider, deployment,
philological correctness or independent peer review.

## Ideas borrowed, not copied

- [UBC Socrates](https://github.com/ubc/socrates-v3): guided questions and source
  links beside the conversation; its GPL-3.0 code is not copied here.
- [Argdown](https://github.com/argdown/argdown): distinguish claims and support /
  attack relationships; start with typed parent links rather than a graph service.
- [ThoughtDAG](https://github.com/chenxiachan/thoughtdag): branch a conversation
  and select which path becomes the next model context.
- [Hypothesis](https://github.com/hypothesis/client): retain the exact quoted text
  and its context; this prototype does not promise durable web annotation anchors.
- [OpenReview](https://docs.openreview.net/how-to-guides/submissions-comments-reviews-and-decisions/how-to-submit-a-review-revision):
  keep review bound to a particular revision; reuse Scholar's existing workflow.

## Ideas to develop next

| Idea | Concrete use | Constraint |
| --- | --- | --- |
| Crux cards | Collect questions such as the Q1 move from “manifest to me” to a universal perceiver, with the claimed inference, strongest objection and what could resolve it. | A card stays an attributed proposal until a person accepts it. |
| Two readings | Put two rival reconstructions side by side and ask where they rely on different premises or passages. | Preserve tradition, scope and unresolved disagreement. |
| Examiner for an essay | Select a saved passage of your essay and ask which inference needs evidence; the selected excerpt retains its exact private revision. | Revision-bound review questions remain a next step; do not send a reviewer’s private report without their permission and the author's selection. |
| Curiosity path | Use the learner's own chosen branches to suggest the next source, counterexample and small exercise. | Suggestions are not an assessment of mastery. |
| Argument-to-essay trail | Assemble a working thesis from selected notes, show the sources and objections beside it, then hand it to Scholar for editing and review. | No automatic publication; do not present a hash as a proof. |
| Cross-work crux map | Compare how Tantrāloka, IPVV and another tradition respond to one question. | Require actual passage coverage before calling an answer grounded. |

Promotion to a shared knowledge tree must be an explicit human action with
provenance and revision history. Search, embeddings and graph databases can wait
until people have used the small workflow and its limits are clear.

## Release boundary

This branch is for review and testing, not a live release. The recovered Scholar
suite is in svread #3, ipvv #9 and translation-work #7. Its production Worker,
D1 migrations, bridge and Qwen provider are not yet established by this prototype.
