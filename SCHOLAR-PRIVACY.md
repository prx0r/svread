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
The matching ipvv Worker branch and additive D1 migration must be deployed first.
Realtime voice remains disabled until the operator configures the Qwen provider and
free quota; the provider receives audio and the passage after the user's consent.
This branch does not implement publication from account sign-off to Git.

Before deployment run `node --check app.js` and
`node --test tests/scholar-smoke.cjs tests/service-worker-privacy.test.cjs
tests/scholar-workspace-ui.test.cjs`, and a real browser smoke test covering login,
account switch, sign-out, offline fallback and actual Qwen voice with permission.
