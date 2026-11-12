# Svatantrya Tutor Memory & Teaching Engine

**Backend handoff, 2026-11-12.** This is for the existing Svatantrya Sanskrit **ChatGPT plugin backend**. **No ChatGPT Actions, MCP plugin deployment, OpenAI account link, repo push or external calls are performed.**

## Keep it deliberately small

Four universal five-ring wheels: **Conversation, Expression, Action, Description**. Swappable topic packs: **About Me, Classroom, Family, Travel, Vedānta, Trika, ...**. Levels belong to the wheel, not to the packs. Grammar skill IDs are stable and reused across all packs.

The backend owns four things:
1. **Teaching preferences**: user-approved, revisable rules such as "Devanāgarī first, IAST on reveal". ChatGPT's own Memory can supply context but is *not* authoritative state.
2. **Learner state**: the day's focus, skill progress, practice evidence and reviews due.
3. **Approved personal pack facts**: narrowly scoped facts from user-reviewed proposals. No entire chat transcripts or hidden memory imports.
4. **Deterministic next-lesson reasoning**: preferred focus first, due review next, then earliest prerequisite-ready lesson; free exploration is never locked.

This repository contains a **working, local backend reference** with SQLite persistence, a private FastAPI internal adapter and tests. It does *not* implement OAuth, a public MCP endpoint, automatic phonetic scoring, Sanskrit morphological generation, UI, or a production database migration. Those should be integrated into the existing serving estate, *not rebuilt here*.

### Package contents

- `backend/store.py`: persistent learner state, idempotent attempts, self-assessment versus verified performance, approval workflow, export/delete, review schedule.
- `backend/api.py`: private HTTP adapter **only for calls from a trusted gateway**; deliberately fails closed if internal token is unset.
- `fixtures/curriculum.json`: **8 illustrative mappings** of the four wheels, not a replacement for the previous 60 lessons.
- `fixtures/teaching_style_seed.json`: proposed (not pre-saved) style preferences from the user's own practice.
- `docs/ARCHITECTURE.md`: how the tutor learns how to teach; state machine and context format.
- `docs/MCP_PLUGIN_HANDOFF.md`: how to add the existing plugin's OAuth-protected MCP adapter (no actual actions executed here).
- `docs/MIGRATION_FROM_15_WHEELS.md`: preserving 60 existing levels and progress while presenting four wheels.
- `docs/OPERATIONS.md`: necessary boring infrastructure, monitoring and privacy.
- `docs/AGENT_BUILD_ORDER.md`: actionable coding-agent priorities and acceptance checklist.
- `skill/SKILL.md`: optional tutoring workflow for a future plugin skill.
- `tests/`: verification and security regression tests.

### Run locally

```bash
cd svatantrya_tutor_backend
python -m pip install -r requirements.txt
python -m pytest -q
# Private service only; never put this on the public internet!
export SVAT_TUTOR_INTERNAL_TOKEN="<a-long-random-secret-from-your-secret-manager>"
uvicorn backend.api:app --host 127.0.0.1 --port 8931
```

`GET /health` is a liveness endpoint. Every `/v1/` route requires `X-Internal-Service-Token` **and** `X-Authenticated-User-Id` injected by an authenticated gateway. The latter is **not** a mechanism by which end users authenticate themselves. A public MCP server must validate OAuth on each request, resolve its *own opaque learner identifier*, and access this service through the internal network. Do not forward raw client-supplied identity headers.

This reference uses SQLite for one-process local development. For multi-replica production, run a real managed database, apply migrations, rate limits and backup/restore tests, and validate your OAuth gateway. See `docs/OPERATIONS.md`.

### Memory rules

- A casual remark is **not** a permanent learning preference. Explicit learner changes can be saved; inferred adjustments are *proposed* for approval.
- ChatGPT can receive a small **lesson context summary**; it must never receive unrelated saved history by default.
- Do not silently mark a skill mastered because the learner tapped `Got it`, because a model replied `correct`, or because they repeated a phrase. Store evidence source and cross-day review outcomes.
- Never gather full chat history, credentials, precise location, medical details or other unnecessary sensitive information into packs.
- Users can inspect, correct, export and delete their Svatantrya backend data separately from ChatGPT Memory.

### Current implementation caveats

- Verified correctness requires `exact_match` (against editor-approved answer forms) or `human_review`. The **caller** is responsible for honestly setting the evidence source; the backend cannot validate Sanskrit or voice itself. The authenticated gateway must permit these evidence values only from trusted assessors, not arbitrary client input.
- Review dates use a deliberately simple 1/3/7/14/30/60/120-day spacing. Replace with a proper FSRS library only after collecting meaningful, valid graded review histories.
- `get_recommendation` supports the sample curriculum. Production must feed in the migrated full curriculum graph.
- The included regex catches a few obvious credential patterns but is **not** a comprehensive sensitive-data filter. Enforce approved field types and explicit consent upstream; avoid broad free-text profile fields.
- Any data-export or delete endpoint must be gated by the appropriate OAuth scopes and explicit confirmation. Clearing live records is not equivalent to purging backups: implement a disclosed retention/purge process.

Source research: see `docs/SOURCES.md`.

The internal API requires `SVAT_TUTOR_ASSESSOR_TOKEN` (a separate secret) for attempts marked `exact_match` or `human_review`. Never give this token to the browser or the language model. The trustworthy assessor verifies the output against vetted answers or a human reviewer before the gateway attaches that token. `self_report`, `model_feedback` and `voice_unverified` cannot claim verified mastery.

For a self-contained demonstration without HTTP or credentials:

```bash
python -m examples.local_demo
```

The JSON schemas in `contracts/` describe external integration payloads. The final production event contract should **require `content_version`** after lesson IDs and content migrations are settled; this reference API does not yet store it, so do not treat the current event model as version-stable.
