# Boring infrastructure that prevents expensive educational nonsense

## Minimum infrastructure (v1)

| Requirement | Ship in v1? | Detail |
|---|---|---|
| Persist per learner | Yes | Database, opaque user ID from validated OAuth token |
| Teaching bank edits and proposals | Yes | User can inspect/edit/delete; no silent durable inference |
| Attempts + source of grading | Yes | Append-only, idempotency key, versioned exercise IDs |
| Deterministic lesson schedule | Yes | One daily focus, due reviews, prerequisite-ready fallback |
| Minimal pack proposal approval | Yes | No raw transcript collection; private by default |
| Export / account deletion | Yes | Including documented backups lifecycle |
| AuthN/AuthZ | Yes | OAuth 2.1 at existing MCP boundary + private backend service |
| Reliability / logging | Yes | Liveness, bounded latency, redacted audit & counters |
| Data backup / restore | Yes | Encrypted, rehearsed restore, documented retention |
| Pack/generator versioning | Yes | Old exercise IDs must still be interpretable |
| FSRS personalization | Later | Only with reliable scored review history |
| Embeddings / vector DB | No | Not needed for a small typed teaching bank |
| Multi-agent swarm | No | Needless for tutor progress |
| RAG over all conversations | No | Overcollection, cost, privacy and prompt-injection risks |
| Autonomous profile mining | No | Proposed only on explicit user-initiated topic |

## Production hardening

**Credentials & networking**: private DB and internal service, TLS externally, OAuth on every MCP request, validate issuer/audience/scopes/expiry, never accept user identity from ChatGPT prompt fields. `SVAT_TUTOR_INTERNAL_TOKEN` must come from a secret manager with rotation, not git. Apply origin/service policies and request size limits.

**Database**: SQLite in this ZIP is intended for local development / controlled single-process testing. For multiple processes/hosts use Postgres with connection pooling, migrations, per-user constraints, transactions and encrypted backups. Build a one-time import from old browser-local state with preview, checksum and idempotent run ID. Do not auto-merge by email/name; use verified account mapping.

**Latency**: a context query should be fast and bounded; avoid retrieving hundreds of attempts on each question. Return the preferred focus, 6 top skills and 8 approved facts at most. Session ring state stays client-side until a real attempt is submitted. No synchronous calls to translation models during write transactions.

**Failure modes**: offline practice may continue, but show `progress not synced`. Queue client events with stable IDs for retry; preserve attempt timestamps, reconcile server receipt and prevent duplicate mastery. Fail closed on identity mismatch. A write failure must not be acknowledged as saved.

**Observability**: structured metrics: 401/403 rates, p50/p95 latency, write failure rate, duplicate-idempotency hits, db errors, sync backlog, slow recommendations, due-review backlog and migrations. Logs: request type, duration, code and coarse correlation ID. Never log prompts, raw Sanskrit answers, personal packs, OAuth tokens, user secrets or raw transcripts by default.

**Backups**: daily encrypted backups with a retention schedule approved and published by the operator, quarterly restore rehearsal, and automated checks for migration reversibility. Account deletion must remove live rows and apply documented backup expiry, not promise instant removal from immutable archives.

**Privacy policy and consent**: document the exact categories stored (teaching preferences, progress data, approved personal topics), user controls, intended retention and connected service processors. Don't import health, religion, intimate life, political views, financial secrets or precise location to a learner pack by default. Even beneficial personalisation requires a bounded user request and preview.

**Anti-prompt-injection**: content packs/teacher quotes are data, not instructions. Model-generated suggestions cannot execute privileged changes without a separate trusted workflow. All API fields validated; skills are developer-authored, never edited by pack content. Avoid putting user-generated text in a system prompt.

**Content QA**: for every generated Sanskrit example have grammar/content version, Devanāgarī, IAST, English and `source_type` (`pedagogical` vs `quoted`). Validate all initial ring combinations for mechanical correctness and independently review linguistically. Curated material can contain errors; a successful HTTP response is not grammatical proof.

**Release**: staging environment, schema migrations with rehearsal, canary flag, rollback path, smoke tests for 4 wheels × 6 packs, rate limits, OAuth deny cases, backup restore, contract tests with ChatGPT plugin, independent Sanskrit editorial approval.

## Reducing learner friction

- One daily focus, not a maze of lessons. Related wheels are optional detours, and return-to-focus remains visible.
- Don't require users to "choose learning theory settings". Show plain-language controls: *Shorter drills*, *Explain more*, *Show IAST*, *Mix packs*, *Review this later*.
- Let users request "Why did that change?" rather than automatically lecturing.
- Track **what error** occurred (`verb-person`, `case-location`, `number-agreement`), not a whole story about the learner.
- When proficiency is weak, recycle a known example with one ring change before introducing additional features.

## Acceptance before deploying

- [ ] User-visible privacy policy, OAuth metadata and scopes reviewed.
- [ ] Live end-to-end signed/expired/revoked token tests and account-isolation tests.
- [ ] Backup restore drill and account deletion drill.
- [ ] Idempotency retries tested with network loss.
- [ ] Client no longer treats browser localStorage or ChatGPT Memory as authoritative mastery.
- [ ] No generated Sanskrit published unreviewed.
- [ ] No credential secrets committed.
- [ ] Plugin can read its own profile and continue across separate conversations.

**Assessment attestation**: `exact_match` and `human_review` are privileged evidence categories. The sample API refuses them unless the caller also presents a separate `SVAT_TUTOR_ASSESSOR_TOKEN`, injected only by the trusted assessment service. Do not expose that secret to clients or model context. Review and rotate both service and assessor secrets.

**Freshness**: a personal pack statement like "I am 27" or "I will study in January" is time-sensitive. Production should store a `valid_until` and user confirmation date, and suppress expired facts until reconfirmed. The v1 reference does not yet implement fact expiry; keep such facts out of permanent auto-imports.
