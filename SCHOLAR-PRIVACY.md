# Scholar privacy and offline behavior

The service worker must not cache account responses. It now bypasses the shared
cache for cross-origin requests, same-origin `/api/` requests, and non-GET requests;
it also honors `Cache-Control: no-store` for same-origin resources. Public static
reader assets remain available from the offline cache. Cross-origin resources must
use the reader's existing vendored fallback when offline.

Scholar's existing local fork drafts are keyed by work and signed-in account ID.
The legacy anonymous key is still available when signed out, but it is not silently
merged into any account. These local drafts are not encrypted and remain accessible
to someone with access to the same browser storage. Sign-out redraws the editor so
the previous account's visible draft is no longer shown.

The Scholar workspace UI in this branch can save account-backed drafts and notes,
invite peer review, sign off a revision privately and ask Qwen with explicit consent.
The matching ipvv Worker branch and D1 migrations `0002_scholar_workspace.sql`,
`0003_scholar_history.sql`, `0004_scholar_ai_limits.sql`,
`0005_scholar_peer_review.sql`, `0006_scholar_style_examples.sql` and
`0007_scholar_review_versions.sql` through `0011_scholar_source_links.sql` must be deployed first.
The revision history panel compares two private saved snapshots and can restore the
second as a new revision;
that invalidates any earlier sign-off. The history migration can recover only the
current revision of drafts saved before it was installed. Deleting a private
document deletes its private history, but not previously shared review snapshots or
Git submissions.
An author can mark two saved revisions as a private before/after style example and
choose those examples when asking Qwen to draft or revise. A reviewer can give
structured feedback and discuss it privately with the author. The reviewer controls
whether their report may be sent to Qwen; the author must select the report and
confirm the request. Discussion messages are not sent to Qwen. Restoring an old
revision or copying an agent draft produces a new saved revision, and an old review
or sign-off does not silently transfer to it. Reviewers can revise their reports
without deleting the earlier report versions. These examples inform individual
requests; they do not fine-tune the model.
Realtime voice remains disabled until the operator configures the Qwen provider and
free quota; the provider receives audio and the passage after the user's consent.
With the matching Worker and translation-work bridge configured, an explicit author
confirmation submits an unchanged signed revision to a Git branch for review. That
branch may be public; submission does not merge it or publish it to the reader.

Before deployment run `node --check app.js` and
`node --test tests/scholar-smoke.cjs tests/service-worker-privacy.test.cjs
tests/scholar-workspace-ui.test.cjs`, and a real browser smoke test covering login,
account switch, sign-out, offline fallback and actual Qwen voice with permission.


The workspace also supports revision-bound private decisions, selected-text review
comments, a source notebook, typed private source relationships and explicitly
attached essay passage references. Private source notes and review comments are
not included in public citations. Only selected, consented evidence is sent to
Qwen; the source links themselves are not sent automatically.

### Optional real-browser integration check

With Playwright available to Node and a compatible Chromium binary, run:

```sh
SCHOLAR_BROWSER_EXECUTABLE=/path/to/chromium \
SCHOLAR_WORKER_ROOT=/path/to/ipvv \
node --test tests/scholar-browser.test.cjs
```

The first test uses a mocked account API; the second uses the local Worker and
SQLite with two test accounts. Both use a local static site and mock external
Qwen access. The tests do not establish production credentials, Cloudflare D1
migrations, real provider usage, microphone permissions or deployment. They skip
when the optional browser and Worker paths are not supplied.

## Book and video drafts

The Scholar essay panel can download a `scholar-media/1` packet from the exact
saved revision. It stays on the device until you choose what to do with it;
no speech provider or public storage is contacted by this button. The packet
contains the full essay and its attached references, so treat it as a private
copy. The local bookfactory runner can turn it into a draft book proof,
narrated video and captions; that runner does not publish either. The hashes
record consistency, not author identity, consent to public distribution or
independent review. If the account or saved essay changes during preparation,
the download is refused and must be started again.
