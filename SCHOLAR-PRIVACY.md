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
`0003_scholar_history.sql`, and `0004_scholar_ai_limits.sql` must be deployed first.
The revision history panel compares two private saved snapshots and can restore the
second as a new revision;
that invalidates any earlier sign-off. The history migration can recover only the
current revision of drafts saved before it was installed. Deleting a private
document deletes its private history, but not previously shared review snapshots or
Git submissions.
Realtime voice remains disabled until the operator configures the Qwen provider and
free quota; the provider receives audio and the passage after the user's consent.
With the matching Worker and translation-work bridge configured, an explicit author
confirmation submits an unchanged signed revision to a Git branch for review. That
branch may be public; submission does not merge it or publish it to the reader.

Before deployment run `node --check app.js` and
`node --test tests/scholar-smoke.cjs tests/service-worker-privacy.test.cjs
tests/scholar-workspace-ui.test.cjs`, and a real browser smoke test covering login,
account switch, sign-out, offline fallback and actual Qwen voice with permission.
