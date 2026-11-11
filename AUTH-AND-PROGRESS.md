# Progress storage and identity (2026-11-11)

> **Owner decision (2026-11-11), binding:** **Google is the site account.**
> You sign in with Google to read-save, keep progress, and use the scholar
> workspace. **ORCID is not a login here — it is the publishing credential**,
> connected after sign-in, used when a version is published (Zenodo / DOI).
> The UI says this explicitly; ORCID login remains only as a legacy path for
> scholars who already have no Google account.


Question: how do we store progress — Google sign-in on the site, or the
ChatGPT plugin?

Short answer: **neither alone. One identity, two doors.** The site signs you in
with a cookie; ChatGPT signs you in with OAuth; both resolve to the same
`profiles.id`, and the progress row belongs to that id. The model's memory is
never the store.

---

## 1. What already exists

`ipvv/worker` today:

- `profiles(id, email, password_hash, salt, display_name, orcid, provider)` —
  the `provider` column already allows `local | orcid | google`.
- `POST /api/auth/access` — email + password sign-in / join.
- `GET /api/auth/me`, `POST /api/auth/logout`.
- ORCID OAuth start + callback, producing a `svsess` HttpOnly cookie (7 days).
- D1, and `profiles.id` as a stable UUID.

So the account system exists. What is missing is (a) a Google leg, (b) tokens
ChatGPT can hold, (c) the progress table itself.

---

## 2. The identity decision

| Option | Works for the site | Works for ChatGPT | Verdict |
|---|---|---|---|
| ChatGPT memory / chat history | — | "remembers" | **No.** Not durable, not verifiable, not shareable; the model can invent progress. |
| Anonymous device id (localStorage) | yes | no | Local practice only, labelled unverified. |
| Google sign-in only | yes | only if it is also our OAuth provider | Convenience door, not the identity model. |
| ORCID only | yes | yes | Scholarly door; excludes casual learners. |
| **One profile, three login methods** (email, ORCID, Google) | yes | yes | **Yes.** Same `user_id` behind every door. |

Why one profile: a scholar signs in with ORCID to sign work; the same person
practises with Google on a phone; a learner starts with Google and later links
ORCID to publish. Progress and sign-off must not fork by login method.

Linking rule: attach a login method to an existing profile by **verified**
email or ORCID; if the match is ambiguous, require an explicit link step —
never silently merge accounts.

---

## 3. Two doors, one session model

**Site door (cookie).** `svsess` HttpOnly, SameSite=None, 7 days, already
implemented. Progress reads/writes go through it.

**ChatGPT door (OAuth 2.1, issued by us).** ChatGPT connectors support OAuth,
and the research is blunt about the requirement: the provider must issue
**refresh tokens** and advertise `offline_access` in
`/.well-known/oauth-authorization-server`, or the connection dies when the
first token expires.

- `GET  /oauth/authorize` → reuse the existing login (ORCID / Google /
  email), consent screen listing scopes.
- `POST /oauth/token` → access token (15 min) + refresh token (30 days).
- `GET  /.well-known/oauth-authorization-server` → metadata, `scopes_supported`
  including `offline_access`.
- Tokens are opaque, stored hashed in D1 (`oauth_tokens`), revocable per
  device, with the same `sub = profiles.id`.
- Scopes: `progress:read`, `progress:write`, `reader:read`. Nothing that can
  sign, publish or spend.

**Connector auth mode: mixed.** `initialize` + `tools/list` unauthenticated
(public sheaf: wheels, verification, reader); per-tool OAuth for anything that
writes. That is exactly what mixed authentication is for, and it keeps the
zero-friction read path.

Do **not** run the write sheaf with "no authentication". Without a token there
is no `user_id`, so progress would be per-install and forgeable — the opposite
of what we want.

---

## 4. The progress store

```sql
CREATE TABLE IF NOT EXISTS learner_progress (
  user_id     TEXT NOT NULL,
  curriculum  TEXT NOT NULL,      -- 'wheels-word' | 'wheels-sentence' | 'deitybody-matrika'
  stage       INTEGER NOT NULL DEFAULT 1,
  passed_json TEXT NOT NULL DEFAULT '[]',   -- [{stage, score, at, session}]
  items_json  TEXT NOT NULL DEFAULT '{}',   -- {item_id: {seen, right, last}}
  updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, curriculum)
);

CREATE TABLE IF NOT EXISTS learner_attempts (   -- receipts: every gate attempt
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL,
  curriculum  TEXT NOT NULL,
  stage       INTEGER NOT NULL,
  items_json  TEXT NOT NULL,      -- the exact 20 items served (ids + options)
  answers_json TEXT NOT NULL,
  score       INTEGER NOT NULL,
  passed      INTEGER NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
```

Rules:

- **Only the server writes `stage`.** The client never receives a boolean it
  can flip; unlock happens in the same transaction that scores the attempt.
- **Attempts are receipts.** `items_json` records what was served, so a score
  can be re-checked later; replaying a session id cannot raise it.
- **Per-item mastery** is kept so drills can weight weak forms — this is the
  adaptive part, and it is data, not model memory.
- **Export/delete** endpoints from day one: progress is personal data.

---

## 5. Signed-out behaviour

- Practice works with localStorage, as now, but every surface labels it
  **"unverified local score"**.
- On first sign-in, offer a merge: take the higher stage, union the passed
  stages, keep the better per-item mastery. Deterministic, shown to the user
  before it is applied.
- No silent upload of local progress.

---

## 6. What this means for the gate (from PLAN-VERIFIED-RUNTIME)

The gate needs an identity to attach receipts to. That is why this comes first:

1. `learner_progress` + `learner_attempts` migration.
2. `POST /api/wheel/gate/start` and `/submit` — accept cookie **or** bearer.
3. OAuth server (authorize, token, metadata, revoke).
4. Google login leg (`/api/auth/google/start`, `/callback`), upsert by email.
5. Site: "keep your progress" prompt + merge; ChatGPT: OAuth connector.

Acceptance: sign in with Google on the site, pass a stage, open ChatGPT,
connect with OAuth, ask for progress — same stage. Sign out on one door, the
other keeps working. Revoke the token and the write path fails closed.

---

## 7. One-line recommendation

**Google (and ORCID, and email) are doors, not the identity.** One
`profiles.id` owns the progress; the site opens it with a cookie, ChatGPT with
our own OAuth token; the server scores and unlocks; the model never holds
state it can lie about.
