# Implementation directive for the coding agent

## North star

One shared teaching memory and progress backend; **four** visible five-ring wheels; topic packs. This is the continuation of the existing Svatantrya site/plugin, not a replacement product. Don't create more top-level wheels, plugins, services or microservices without specific need. Don't switch to GPT Actions.

## Recommended order (a dozen small reviewable PRs, not one risky mega-PR)

1. **Read the live existing estate and old bundle**: confirm active `mcp.svatantrya.net/mcp`, old source of Sanskrit wheels, auth provider, database and serving chain. Do not infer runtime state from documentation. Never push production changes from this ZIP alone.
2. **Define identity boundary**: one immutable opaque Svatantrya learner id per verified logged-in account. Enforce OAuth 2.1 issuer, audience, expiry, PKCE and scopes at the existing MCP gateway. Verify two-account isolation before writing other code.
3. **Import schemas**: migrate `backend/store.py` to the estate's database; `SQLite` is a reference. Add migrations, rollback and audit. No secrets or debug chat logs.
4. **Preserve existing wheel content**: read old 15-family/60-level source, build explicit legacy -> four-wheel mapping per `MIGRATION_FROM_15_WHEELS.md`. Test original example parity; never convert explored to mastered.
5. **Connect state to daily wheel**: read compact `context`; one focus, reveal settings, current level and due reviews. Keep ring state client-side until a scored attempt.
6. **Save practice reliably**: stable client event id, content version, skill id, pack id, assessment provenance; retries must not count twice. Display confirmation only after backend ack.
7. **Teaching bank**: show and edit short preferences; user changes win. Infer only a *proposal*, require review. Add one-click short/long explanation override for current session.
8. **Pack creation**: ask "make an About Me pack from relevant things I've told you"; show a short fact/vocabulary preview. Never send conversation history or automatically copy host memory. Persist only individually approved facts.
9. **Prerequisite graph and neighbors**: write the 4-wheel skill DAG and static error-tag -> neighbor map; keep focus pinned while exploring. Compute due on read; no background jobs required.
10. **Safety & privacy controls**: explicit export, deletion, scope restrictions, audit, retention policy and backup lifecycle. Keep private sensitive details out of lesson context.
11. **QA & evals**: Sanskrit editorial fixtures, structural tests, auth negative cases, multiple accounts, mobile & voice flows, plugin disconnect behavior, restore exercise.
12. **Stage and ship incrementally**: private staging MCP, Inspector tests, ChatGPT conversations across multiple sessions, release behind feature flag and rollback ready. Only then announce persistent progress as live.

## Do not overengineer

No vector DB, topic embedding store, custom model fine-tuning, independent memory bot, rule-generating LLM, FSRS reimplementation, giant skill taxonomy or "personality profiler" in the first version.

The **state machine** needs only `unseen -> practising -> ready -> mastered`, with `review_due` on evidence-backed lapse, and free navigation throughout.

## Success tests from real learner requests

- "Can we do one to thirty-nine quickly?" → number practice inside Action or Description at suitable level.
- "Why is it asti, not asmi?" → explain person agreement briefly and register `verb.present.person` as a candidate review, not auto-fail without evidence.
- "I like this because..." → Expression with a reason connector; no separate grammar app.
- "Make an About Me pack" → preview user-provided relevant facts; approve; reuse across four wheels.
- "Less explanation, more quick-fire from now on" → explicit durable teaching-bank preference saved, then reflected next conversation.
- "I keep forgetting case endings" → suggest Action destination/location and conversation place questions, keep same daily focus.
- "Start today's Sanskrit" → explicit focus else due reviews else earliest suitable next lesson.
- "What have I mastered?" → distinguish verified mastery from practice/self-reported familiarity.
- "Delete my personal pack" → confirm, delete approved facts, preserve progress unless expressly asked to delete all.

## State adapter protocol

A generated exercise carries `{wheel_id, level_id, pack_id, content_version, combination_id, skill_ids, devanagari, iast, english}`. The teaching backend reads only stable identifiers/assessment data, not unrestricted transcript text. Skill IDs must remain stable when topics/packs change. A new pack never needs a new grammar wheel.

**Final handoff requirement:** a PR describing implemented code, real tests run, exact deployment status, auth scope mapping, backup recovery and a manual/automated Sanskrit editorial report. No invented success claims.
