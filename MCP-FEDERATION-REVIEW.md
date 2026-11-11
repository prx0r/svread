<!-- status: reference/review record — the audit stands; the plan lives in MCP-INTEGRATION.md -->

> **Status (2026-11-11):** reference/review record — the audit stands; the plan lives in MCP-INTEGRATION.md.

# MCP federation — review + plan to reach ChatGPT (2026-11-11)

Answers: what MCPs exist, what each exposes, and how ChatGPT gets to them
**without a Custom GPT Action** — browse-and-use, the way you described.

---

## 1. What exists (measured)

**One parent, five children, 104 tools, all stdio.**

`trika-x/formal-trika/tools/federation_gateway.py` is the parent (openpatala
identity + navigation). It starts each child over stdio, prefixes every tool
`<child>__<tool>`, routes by prefix, and **Fails Open** on a dead child
(excluded from `tools/list`, calls error, never fatal).

| Child | Tools | What it does | Sample tools |
|---|---|---|---|
| scholar (svread) | 33 | evidence, versions, essays, audits, pushback, + 4 wheel tools | `passage_evidence`, `search_texts`, `audit_draft`, `wheel_verify` |
| bookfactory | 22 | books: specs, entries, epub, package, audio plan | `factory_overview`, `new_book`, `read_entries`, `epub` |
| video (videofactory) | 18 | video: projects, units, gate, finals, publish (gated) | `vf_projects`, `vf_unit`, `vf_gate`, `vf_finals` |
| translation-work | 16 | pipeline: validate, gates, lore, swarm review | `status`, `validate`, `gates`, `swarm_review` |
| formal (trika-x) | 7 | proofs + traces | `axioms`, `evidence`, `table`, `trace` |
| openpatala | 5 + 2 | identity: works, bundles, frontier | `resolve`, `get_bundle`, `search` |
| federation | 1 | navigation guide | `federation__guide` |

Catalog frozen at `formal-trika/data/mcp-catalog.json` (104 tools, 0 banned
hits). The banned-action guard (`ship/render/publish/…`) matches the bare name
after prefix stripping — I checked the one suspicious case: `vf_publish` is the
factory's own gated tool, documented as such, and `list_published_essays` is
read-only. No defect.

Also present: `mcp/scholar_server.py` (local stdio, 37 tools, 4 wheel tools),
`aoc` (19 tools, carousels), `sleepdraw` (journeys), `content`, `powstock`,
`powpowpow` (separate product lines, not in the Trika federation).

**The gap in one line:** every one of these speaks **stdio on this box**.
ChatGPT cannot reach stdio. The worker's `/mcp` is stale (protocol
2024-11-05, hardcodes `ipvv-a8u.pages.dev`, no wheels/auth/progress).

---

## 2. The honest constraint (and the design it forces)

"ChatGPT browses to the site and uses the MCP" = **two different modes**, and
we need both:

| Mode | What ChatGPT can do | What it cannot |
|---|---|---|
| **Browsing** (built-in web) | GET any public URL: HTML, JSON, markdown | call MCP tools, write, hold a session |
| **Connector** (MCP) | `tools/list` + `tools/call` over HTTPS, auth, sessions | exist without the owner adding the connector once |

So: **dual-expose everything.**

- **Browse tier** — plain public JSON for every read-only capability.
  Already mostly there (harness.json, packs, claim pages, reader bundles).
  Add a generic `/mcp/call?tool=…&args=…` JSON shim so browsing mode can hit
  *any* read-only federated tool without the protocol.
- **Connector tier** — one remote MCP endpoint, full protocol, auth, writes.
  This is what enables progress + generation.

ChatGPT does not "discover" a connector from a web page; the owner adds the
URL once per account. After that, it is available in every new chat with zero
pasting — which is the actual requirement ("I start on ChatGPT and it can
access it"). Browse tier is the zero-setup path; connector tier is the
persistent one.

---

## 3. Target architecture

```
ChatGPT  ──browse──▶  https://svatantrya.net/mcp/*        (public JSON shim, GET)
   │                    └─ Pages static + worker proxy
   └──connector──▶  https://mcp.svatantrya.net/mcp        (remote MCP, HTTPS)
                        │  Cloudflare Tunnel
                        ▼
                   box: mcp_bridge.py  :8848
                        │  wraps stdio
                        ▼
                   federation_gateway.py  (104 tools)
                        │  FailOpen
        ┌───────┬───────┼────────┬──────────┐
     scholar  book   video  translation  formal/openpatala
```

Why a box bridge, not the worker: book/video/translation children are Python
processes with local data and filesystems. The worker cannot spawn them. The
bridge is thin — it translates HTTP MCP ⇄ stdio JSON-RPC and enforces auth.
The box already runs five cloudflared tunnels, so this is an ingress entry,
not new infrastructure.

### 3.1 Bridge (`tools/mcp_bridge.py`, new)
- MCP Streamable HTTP: `POST /mcp` (JSON-RPC), `GET /mcp` (SSE stream),
  `DELETE /mcp` (session end). Protocol `2025-06-18`, negotiate down to
  `2024-11-05` for the legacy worker path.
- `GET /health` → gateway + child liveness (FailOpen states visible).
- `GET /tools.json` → the frozen catalog (browse tier).
- `GET /call?tool=…&args=<urlencoded json>` → one-shot read-only call
  (browse tier). Same closed-world errors as MCP.
- Auth: `Authorization: Bearer <token>` for the connector; `/call` allows a
  public allowlist only (wheels, reader, claims, openpatala reads). Writes and
  generation require the token.
- Limits: 60s per call, 10 concurrent, body ≤ 64KB. Long jobs return a job id.

### 3.2 Async jobs (required for books/video)
Tool calls time out. Generation does not. So:
- `job__start(tool, args)` → `{job_id}`; `job__status(job_id)` →
  `{state, progress, artifact_url}`; `job__cancel(job_id)`.
- Artifacts land in R2 (`svread-audio` or a new `mcp-artifacts`) and are served
  by URL. **Rendering/publishing stays human-gated** — the async layer runs
  prep/plan/gate/package; `vf_gate` and sign-off still decide what ships.

### 3.3 Auth path (phase 2)
- Phase 1: single owner bearer token → owner-only connector. Ships fastest.
- Phase 2: OAuth 2.0 on the worker, with ORCID as the identity provider
  (already wired at `/api/auth/orcid/*`). ChatGPT connectors support OAuth;
  token exchange issues a scoped MCP token bound to the profile. Then
  `progress_*` tools write per-user rows.

---

## 4. Tool exposure policy

Three sheaves, checked in code (not by convention):

| Sheaf | Auth | Tools |
|---|---|---|
| **public** (browse + anon connector) | none | `wheel_*`, `scholar__passage_evidence`, `search_texts`, `openpatala__resolve/search/get_bundle`, `formal__*`, `federation__guide` |
| **personal** | bearer / OAuth | `progress_get/record`, `scholar__*` account tools, `translation__validate` (read), `bookfactory__read_*` |
| **generative** | bearer + job | `bookfactory__new_book/stage/package/epub`, `video__vf_*`, `translation__swarm_*` |

Hard rules carried over: BLOCKED English never returned; no `ship/render/publish/
signoff/submit` actions (the `vf_publish` exception stays gated and human-run);
no account data on the public sheaf; failures never leak child stderr.

---

## 5. Phases (smallest that proves it)

**P1 — bridge + tunnel (1–2 days, agent-doable)**
- `tools/mcp_bridge.py` + tests (protocol negotiation, FailOpen, auth, limits).
- `cloudflared` ingress `mcp.svatantrya.net → :8848` (needs CF DNS record;
  owner or API token).
- Verify: `initialize` → `tools/list` = 104; `wheel_verify katham` =
  `DISAGREE_STANDS`; kill a child → catalog drops it, parent stays up.

**P2 — browse tier (half day)**
- `/mcp/call` allowlist + `/tools.json`; list them in `llms.txt`,
  `ai-catalog.json`, `/.well-known/mcp.json` (server URL + auth note).
- Verify: plain `curl` (no protocol) answers a wheel question.

**P3 — progress + personal (2 days)**
- Bearer token, `learner_progress` table (migration), `progress_*` tools.
- Site `#journey` reads the same store when signed in.

**P4 — generative sheaf (2–3 days)**
- Job queue + R2 artifacts; expose book/video prep and packaging.
- One real book (spec → entries → epub) and one video (project → units →
  gate) driven entirely from ChatGPT.

**P5 — OAuth (when a second human user exists)**
- ORCID→MCP token exchange; per-user scopes. Skip until needed.

---

## 6. What ChatGPT can then do (concrete)

- **Learn**: `wheel_harness` → `wheel_level 3` → `wheel_verify` per form →
  `progress_record` → site links for the discs. Voice-only works.
- **Read**: `openpatala__resolve` → `scholar__passage_evidence` →
  `scholar__search_texts` → claim page URL for hashes.
- **Write**: `scholar__search_texts` → draft → `audit_draft` → `pushback` →
  human sign in the Scholar tab.
- **Make**: `bookfactory__new_book` → `stage` → `package` → `epub`;
  `video__vf_projects` → `vf_unit` → `vf_gate` → `vf_finals`.
  Nothing renders or publishes without the human gate.
- **Trika**: `formal__evidence` / `formal__table` for proofs; wheel option →
  concept → C1 → claim page; guided meditations stay drafts for sign-off.

---

## 7. Open questions for the owner

1. Hostname: `mcp.svatantrya.net` (clean) vs a `*.sanskrit.help` subdomain
   already on the tunnel?
2. Bearer token first (owner-only, today) vs wait for OAuth? Recommend bearer.
3. Which generative sheaf first — books or video? Recommend books (deterministic
   files, easier to verify end to end).
4. Bridge stays on this box (needs uptime) or move to a small VPS later?

---

## 8. How ChatGPT actually connects (verified 2026-11-11)

Short answer to "surely I just make a ChatGPT plugin": **effectively yes — but a
"plugin" today IS a custom MCP server.** The 2023 plugin programme was shut
down in April 2024; the word came back in July 2026 when the App Directory was
renamed the Plugin Directory, and what it holds are MCP-based apps. Custom GPTs
with OpenAPI Actions are being retired and migrated to plugins. So the correct
build is exactly what this plan says: one remote MCP server, added as a plugin.

### Verified requirements

| Requirement | Detail |
|---|---|
| Transport | Remote HTTPS only. **SSE and Streamable HTTP** both supported. `/mcp` endpoint. |
| Local/private servers | Not directly — but OpenAI supports **Secure MCP Tunnel**, so a box-hosted server can connect without public exposure. |
| Enablement | **Developer Mode** must be on (Settings → Apps & Connectors / Plugins → Create). |
| Authentication | OAuth, no-auth, or **mixed** (initialize + tools/list unauthenticated, per-tool auth). |
| OAuth detail | Provider must issue refresh tokens and advertise `offline_access` at `.well-known/openid-configuration` or `.well-known/oauth-authorization-server`, or ChatGPT loses access when the token expires. |
| Tools | search/fetch tools are **no longer required**; any tools available, writes included. |
| Platform | Web only (no mobile). |
| Agent mode | Does **not** use custom apps. Deep research uses them **read/fetch only**. |
| Actions + Apps | Mutually exclusive on one GPT — do not mix. |

### The one constraint that changes our plan (plan tier)

- **Business / Enterprise / Edu**: full MCP, including **write/modify** tools.
- **Plus / Pro (individual)**: custom MCP servers are **read/fetch only**.

Consequence: `progress_record`, book staging, video job creation are *writes*.
On a personal Plus/Pro account they will not be available; on Business+ they
are. Three ways forward:

1. **Business plan** (owner) → full write surface, nothing else changes.
2. **Split the server**: read/fetch sheaf works on Plus/Pro today (wheels,
   verification, reader, claim lookup, openpatala browse). Writes gated behind
   a plan check and activated later. This still delivers learn + verify +
   explain on a personal account.
3. **Hybrid**: writes executed on the box by a scheduled job the learner
   queues through a read tool that returns a one-time signed URL — more
   machinery, avoids the plan constraint, but it is a workaround, not the
   clean path.

Recommendation: build the split now (option 2). The read sheaf is the whole
learning loop; the write sheaf lights up the day the account is Business.

### Updated next moves

1. `tools/mcp_bridge.py` — Streamable HTTP + SSE, mixed auth, `/health`,
   `/tools.json`, `/call` shim. (unchanged)
2. Connect via **Secure MCP Tunnel** rather than a public hostname if we want
   zero DNS work and zero exposure; otherwise `mcp.svatantrya.net` + bearer.
3. Enable Developer Mode → Add custom MCP server → Scan Tools. That is the
   entire "make a plugin" step.
4. Do NOT build a Custom GPT with Actions (retiring, and mutually exclusive).

### Sources

- OpenAI Help: "Connecting custom MCP servers in ChatGPT" (developer mode,
  transports, auth, plan tiers, tunnel, mobile, agent mode limits).
- OpenAI API docs: "Create custom MCP server" (plugin framing, SSE +
  streaming HTTP, auth modes, CIMD/DCR, tools toggle).
- Timeline: plugins ended Apr 2024 → GPTs/Actions → MCP adopted Mar 2025 →
  Apps SDK Oct 2025 → Plugin Directory Jul 2026; Custom GPT retirement FAQ
  says custom actions do **not** migrate.
