# Connecting ChatGPT (or any remote client) to our MCP

## Live now

`https://mcp.sanskrit.help/mcp` — Streamable HTTP, protocol `2025-06-18`,
**198 tools**, bearer auth (401 without it). Verified 2026-11-11 from outside:
`initialize`, `tools/list`, and `scholar__wheel_level` all answer.

Named Cloudflare tunnel `svatantrya-mcp` (`281e3446-5a8d-4849-b37e-ee682a78c734`)
→ `127.0.0.1:8765`; code here. Token lives on the box, never in the repo.

In ChatGPT: Settings → Connectors → Add custom connector → URL above →
Authentication: Bearer → paste the token.

## Editing, not just reading

The `workspace` server gives an agent scoped read/edit over the repos:

| Tool | Does |
|---|---|
| `ws_roots` | allowed roots, blocked names, size limits |
| `ws_list` / `ws_read` | browse and read text files |
| `ws_write` / `ws_patch` | create/overwrite, or exact unique-string replace |
| `ws_grep` | regex search, 200-hit cap |
| `ws_git` | status, log, diff, add, commit, branch, checkout, show |

Secrets (`.env`, `.dev.vars`, `*.pem`, credentials) and `.git` internals are
refused; `git push` is deliberately not available — the agent edits and
commits, the owner pushes.

## What this endpoint is

One Streamable HTTP MCP endpoint over local stdio servers and configured remote
MCP servers. The checked-in configuration adds Satsang's public, read-only MCP
at `https://mcp.tantrafiles.xyz/mcp`, exposing its 28 documented tools under
the `satsang__` prefix. Its explicit allowlist prevents new upstream tools from
appearing automatically. The production endpoint gains these tools after this
gateway change is deployed; the active count is discovered dynamically and can
fall when a child or remote server is unavailable.

- 198 tools from the 7 local servers: `scholar` (38), `openpatala` (5), `federation` (109,
  already namespaced; 22 of its names duplicate a direct server and the direct
  one wins), `bookfactory` (22), `videofactory` (18), `aoc` (20), `workspace` (8).
- Up to 28 allowlisted `satsang__*` tools (up to 226 total), discovered from the remote server at
  runtime. They cover place and teacher search, traditions, practices, resources,
  events, lineage paths, study guides, retreat planning, and maintenance status.
- tool names are `<server>__<tool>` (e.g. `scholar__wheel_level`)
- each call opens a fresh client session: local stdio children are spawned and
  remote MCP servers receive HTTP requests; the gateway keeps no cross-call
  child session state
- `gateway__problems` reports any child that failed to start

Runtime is Python 3.13 with `mcp==2.3.0`. The gateway is `gateway.py`.

## 1. Start it (localhost)

```sh
cd mcp/gateway
MCP_TOKEN="$(openssl rand -hex 24)" ./start.sh
curl -s localhost:8765/health          # -> ok 8 servers
./smoke.py                              # list tools, call three, print verdict
./start-tunnel.sh                       # named tunnel -> mcp.sanskrit.help
```

The token is printed once by `start.sh` and written to `../logs/token` (0600).
Set it, don't invent one.

## 2. Make it reachable

ChatGPT cannot call localhost. Two options:

**A. Quick tunnel (no DNS change, URL changes each start)**

```sh
cloudflared tunnel --url http://127.0.0.1:8765
# gives https://<random>.trycloudflare.com — MCP path is /mcp
```

**B. Named tunnel (stable URL)** — the box already runs tunnel
`052f1ef4-ad76-4a86-b56f-041ab95f7001` with `atlas.sanskrit.help` and
`x402.sanskrit.help`. Add an ingress entry, then route DNS:

```yaml
# /root/.cloudflared/config.yml, before the 404 rule
  - hostname: mcp.sanskrit.help
    service: http://localhost:8765
```

```sh
cloudflared tunnel route dns 052f1ef4-ad76-4a86-b56f-041ab95f7001 mcp.sanskrit.help
```

Restarting the tunnel affects the other two hostnames; do it in a window and
re-check `atlas` after. Do not edit the config on a whim — it is shared.

## 3. Add the connector in ChatGPT

Settings → Connectors → Add custom connector:

- URL: `https://<host>/mcp`
- Auth: Bearer token (the one from step 1)
- If ChatGPT asks for OAuth: choose "no authentication" only on the quick tunnel
  you just created, and keep the token requirement on; otherwise use the bearer
  option. OAuth (`offline_access`) is the planned path in `svread/MCP-INTEGRATION.md`
  and is not built yet.

## 4. Sanity check from the adapter's point of view

```sh
curl -s -X POST https://<host>/mcp \
  -H "Authorization: Bearer $MCP_TOKEN" \
  -H 'content-type: application/json' \
  -H 'accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"curl","version":"0"}}}'
```

Then `tools/list` with the returned `Mcp-Session-Id` header (stateless mode may
issue none — that is fine).

## 5. First calls worth making

| Call | Why |
|---|---|
| `scholar__list_works` | what has a reader/evidence bundle |
| `scholar__passage_evidence {"work":"tantrasara-a20","target":"tsa-a20-v01"}` | hash-checked Sanskrit + editorial layers |
| `scholar__wheel_level {"level":1}` | the tutor text for a level |
| `scholar__wheel_certificate {...}` | structural certificate + Lean receipt match |
| `openpatala__search {"q":"tantrasara","limit":5}` | bibliography search (note: `q`) |
| `federation__guide` | the 109-tool gateway's own map |
| `scholar__search_texts {"query":"recognition","work":"tantrasara-a20"}` | corpus search |
| `satsang__search_places {"tradition":"Advaita Vedanta","country":"India","limit":5}` | sourced practice and study places |

The Satsang source is public and read-only. The gateway sends only arguments
for the selected `satsang__*` call to `mcp.tantrafiles.xyz`; it sends no
credentials. Its tool allowlist is pinned in `servers.json`.

## What is NOT available over MCP

- `translation-work` and `sleepdraw` are CLI tools, not protocol-clean stdio
  servers (one prints a banner to stdout, the other is hand-rolled JSON-RPC).
  Call them directly: `python3 <path> <tool> <json>`. They are listed under
  `cli_only` in `servers.json`.
- No filesystem or shell tool is exposed. Editing files is via the repo
  (git/ssh) or the write-capable `scholar__save_*` / `aoc__*` tools, never a
  generic write primitive.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `gateway__problems` non-empty | one child crashed at startup | run that child directly; it is listed in `servers.json` |
| 401 | token mismatch | check `logs/token`, restart with the same `MCP_TOKEN` |
| tool not found | wrong prefix | names are `<server>__<tool>`; see `TOOLS.md` |
| validation error on args | schema is passed through verbatim | read the tool's schema; e.g. openpatala uses `q`, not `query` |
| first call slow (~2–5 s) | child spawn + imports | expected; there is no warm pool yet |
