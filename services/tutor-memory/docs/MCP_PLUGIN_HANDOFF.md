# How to attach to the ChatGPT plugin (backend contract only)

**The requested output is backend code and a plugin integration guide, not ChatGPT Actions.** There is deliberately no installable MCP server or tool-registration code in this ZIP. Nothing has been deployed or connected to an account.

## Recommended architecture

```
ChatGPT + Svatantrya plugin skill
   -> existing authenticated plugin MCP at https://mcp.svatantrya.net/mcp (verify live)
       -> validate OAuth 2.1 bearer token / issuer / audience / expiry / scopes
       -> map authenticated account to opaque svatantrya learner ID
       -> private internal tutor adapter (127.0.0.1:8931, or private network)
           -> database (SQLite local prototype / managed SQL production)
           -> recommendation logic + teaching style bank
       -> existing five-ring Sanskrit UI / generation logic
```

The domain above was provided as an existing endpoint in the project history. **This ZIP does not verify its current contents, uptime or available tooling**. Don't assume it already exposes these tutor functions.

## Why not simply rely on ChatGPT Memory?

ChatGPT's user memory personalizes the conversation when relevant. A plugin cannot assume a universal API that reads the host's memory summary and writes exact skill scores. Treat host memory as optional contextual input. Only transmit tiny learner-approved fields on the current user request. Never scrape transcripts or ask for the user's whole memory to initialize the pack.

## Backend capabilities a future MCP adapter must expose

These are **intentional operations**, not implemented GPT Actions or registered MCP tools:

- `load_tutor_context`: authenticated account only, return compact learner preferences, selected focus and due skills.
- `get_next_practice`: deterministic recommendation and useful explanation of why.
- `record_practice_result`: idempotent, includes exercise, stable skill ID, grade, evidence provenance and content version.
- `set_teaching_preference`: only when explicitly requested by the learner, else propose and require review.
- `review_suggested_preference`: show the one proposed change and obtain approval/rejection.
- `propose_personal_pack_fact`: from a bounded, user-requested subject; default private and requires approval.
- `set_daily_focus`: only on learner request.
- `export_or_delete_tutor_data`: authenticated scoped request; deletion requires explicit confirmation.

No "capture entire conversation" tool. No silent exporting data from ChatGPT Memory, files or connected services.

## Auth gate

OpenAI's plugin auth docs specify OAuth 2.1 authorization code + PKCE for user linking, with metadata discovery and audience/scope validation. An internal application token is **not user OAuth**. A trusted OAuth gateway is required to call the included `backend/api.py`.

Suggested scopes (backend design names, not deployed):

- `tutor.read`: view your own context, wheel progress, and due reviews.
- `tutor.practice`: submit your own practice attempts/focus.
- `tutor.profile`: change your teaching bank and approve pack proposals.
- `tutor.delete`: explicit export/deletion workflow; preferably separate high-friction confirmation.

Use least privilege, per-user server-side row filters, rate limits, request sizes, and a private network. Never let the model choose a `user_id`. For multiple linked accounts, expose an OAuth-scoped read-only account profile in MCP according to the official guide.

## Host skill instructions

Install `skill/SKILL.md` as part of the *existing* plugin's skill packaging after integration. The skill determines **when** to load the context, how to teach and when to store a result. The MCP server is the authority for persistent state. The ring UI remains frontend-owned.

If a session is offline or the plugin is unconnected, continue teaching using the immediate conversation; say progress cannot be saved across sessions. Do not falsely claim "recorded" or "mastered" without a successful backend write.

## Tool results

Return only the needed current learning fields in `structuredContent`; keep internal user IDs, raw error logs and event ids out of model-facing results unless a stable identifier is necessary for a follow-up. Version all public response schemas (`schema_version`).

## ChatGPT UI state

Server owns teaching bank and exercise results. Widget instance may own currently selected ring and reveal toggles. Don't treat `widgetState` or browser `localStorage` as durable, cross-chat learning records. Sync meaningful progress back to the server after confirmed user interactions.

### End-to-end acceptance test

1. Two separate linked accounts cannot view/edit each other's profile, even by tampering with request arguments.
2. User changes 'show IAST only on reveal', then opens a new ChatGPT conversation: plugin reads new preference.
3. User tries a Sanskrit response; server records once after retries; unverified assessment is labelled correctly.
4. User switches Classroom -> Trika pack at the same grammar level; skill progress stays continuous.
5. User asks to forget an approved About Me fact; it disappears from tutor context and export after deletion.
6. User unlinks plugin: no tool can read profile; documented retention controls remain available.
7. Backups restore into staging; old lesson IDs and practice event IDs retain correct ownership.
8. Live MCP Inspector with denied/expired tokens and unauthenticated requests confirms fail-closed behavior.
