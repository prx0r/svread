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

## Smallest useful build

1. A static, local-first page with a starter enquiry from the existing Tantrāloka
   pushing sessions and an empty enquiry. Paste chat, preserve who said each
   line, and choose lines to add as editable question, answer, evidence, objection,
   crux, branch or essay idea. Nodes retain their parent and their stated origin.
2. Store the working enquiry only on the current device by default, with JSON
   import/export. Show the next questions the person could ask. Export an essay
   seed in Markdown. Nothing is published or added to the shared knowledge graph.
3. When the matching Scholar Worker is available, explicitly save an essay seed
   to the signed-in account as a private draft. The existing review, sign-off and
   publication controls remain the only route onward.
4. Offer Qwen pushing only through the existing consented Scholar assist endpoint,
   against a chosen available Scholar work and passage. Only the selected branch
   is sent, with the passage/layers fetched by the Worker. The reply is an agent
   proposal and enters the tree only if the person selects it. Qwen and Scholar
   accounts require their separately deployed Worker and provider configuration.

No new database, vector service, automated publication, source certification or
independent peer-review claim is needed for this prototype. Tantrāloka Scholar
projections are not yet available here: its pinned historical pushing sessions
can be explored, but they must not be presented as source-verified verse evidence.

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

## Next, if the prototype earns it

Add curated source-linked crux cards, opposing reconstructions and evidence gaps;
compare a question across works without flattening distinct traditions; offer a
reviewer's permissioned "push this premise" action against an immutable essay
revision; derive a learning route from the questions a reader chooses. Promotion
to a shared knowledge tree must be an explicit human action with provenance and
revision history. Do not send private peer-review reports to a model without the
reviewer's existing permission and the author's selection.

## Release boundary

This branch is for review and testing, not a live release. The recovered Scholar
suite is in svread #3, ipvv #9 and translation-work #7. Its production Worker,
D1 migrations, bridge and Qwen provider are not yet established by this prototype.
