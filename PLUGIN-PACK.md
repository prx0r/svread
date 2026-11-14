# Plugin pack — press create (2026-11-13)

Goal: anyone installs any plugin in ~1 minute with copy-paste. Human page:
`https://svatantrya.net/plugins/` · machine spec: `plugins/plugins.json`
(single source of truth for URLs/counts; this file is the paste-ready companion).

## The one flow

1. `chatgpt.com/plugins` → `+` → **Add custom MCP server**
2. Name: the row's name. Server URL: the row's URL (include `/mcp`).
3. Auth: **No authentication** for the five public rows; **static bearer**
   (owner token, `sudo grep MCP_TOKEN /etc/svatantrya-mcp.env`) for the rest.
   Practice: no-auth install gives reads; reinstall/paste token for scoring.
4. **Create as a plugin → Install.** In chat: `@Name` + prompt.

## Start here (3 installs cover everything)

| # | Name (paste) | URL (paste) | Auth | Tools |
|---|---|---|---|---|
| A | Svatantrya | `https://mcp.svatantrya.net/mcp` | No auth | 35 |
| B | Svatantrya Studio | `https://studio.svatantrya.net/mcp` | bearer (owner) | 32 |
| C | Svatantrya Factory | `https://factory.svatantrya.net/mcp` | bearer (owner) | 40 |

Most people stop here. Below: the same tools split per function.

## Granular rows (same tools, split up)

| # | Name (paste) | URL (paste) | Auth | Tools |
|---|---|---|---|---|
| 1 | Svatantrya Index | `https://index.svatantrya.net/mcp` | No auth | 5 |
| 2 | Svatantrya Sanskrit | `https://sanskrit.svatantrya.net/mcp` | No auth | 9 |
| 3 | Svatantrya Practice | `https://practice.svatantrya.net/mcp` | No auth (reads) | 5+3 |
| 4 | Svatantrya Formal | `https://formal.svatantrya.net/mcp` | No auth | 10 |
| 5 | Svatantrya Translate | `https://translate.svatantrya.net/mcp` | No auth | 6 |
| 6 | Svatantrya Tutor | `https://tutor.svatantrya.net/mcp` | bearer (owner) | 5 |
| 7 | Svatantrya Essay | `https://essay.svatantrya.net/mcp` | bearer (owner) | 24 |
| 8 | Svatantrya Books | `https://books.svatantrya.net/mcp` | bearer (owner) | 22 |
| 9 | Svatantrya Video | `https://video.svatantrya.net/mcp` | bearer (owner) | 18 |

Description paste (append to any row's name): the tagline + desc from
`plugins/plugins.json`. First prompts per plugin: same file, `test_prompts`.

## For agents (CLI, no ChatGPT needed)

All endpoints speak Streamable HTTP (SSE framing: parse `data:` lines).
Public five need no headers; the rest need `Authorization: Bearer $MCP_TOKEN`.

```sh
# fastest check (any host)
npx @modelcontextprotocol/inspector@latest   # → Streamable HTTP → URL above

# Claude Code
claude mcp add --transport http svatantrya-index https://index.svatantrya.net/mcp
claude mcp add --transport http svatantrya-tutor https://tutor.svatantrya.net/mcp \
  --header "Authorization: Bearer $MCP_TOKEN"

# opencode (~/.config/opencode/opencode.jsonc)
{"mcp": {"svatantrya-index": {"type": "remote", "url": "https://index.svatantrya.net/mcp"}}}

# curl: tools/list (open) — bearer hosts 401 without the header
curl -s -X POST https://index.svatantrya.net/mcp \
  -H 'content-type: application/json' -H 'accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'

# FastMCP (python): Client(url) for public; Client(url, auth=BearerAuth(token)) for gated
```

stdio-only clients (old Claude Desktop): run the child server directly —
every child behind the gateway is a stdio script (see `mcp/gateway/servers-*.json`).

## Directory submission checklist (public five only)

- [ ] Domain verification (Cloudflare DNS TXT when OpenAI issues it)
- [ ] 5 positive + 3 negative test runs per plugin, recorded
- [ ] Reviewer demo needs no credentials (true for all five)
- [ ] Descriptions state read-only + provenance rules (done in plugins.json)
- [ ] Owner-only plugins stay unlisted

## What the masterplan review said (2026-11-13, two passes)

Core (`MASTERPLAN3`, `PROGRESS-REPORT`, `EXTERNAL-STRATEGY`, `MCP-INTEGRATION`,
trika-x `MASTER-PLAN/MASTERPLAN2/STATUS`, translation-work
`NORTHSTAR/CANONICAL/LAYERS`) and satellites (the personal lane `ROADMAP/HANDOVER`,
sanskrithelp `AGENTS/HANDOVER`/Bruno synthesis, satsang `BRIEF/OPEN-THREADS`)
agree: **read-first narrow surface, machine-proposes/human-disposes,
BLOCKED≠PASS, provenance envelope, never expose federation wholesale.**
The plans predate the tunnel/gateway build (they say "bridge not built" —
it is now, plus mixed auth and discovery metadata). Known tension resolved
as: *every tool has a plugin home; writes stay gated.* Translation-work has
no auth story of its own — hence it sits behind our gateway, never directly.
Satsang is the most plugin-ready neighbour (live MCP at
`mcp.tantrafiles.xyz/mcp`); federation with it is phase 2.
Private journals, credentials, vectors, and unlicensed transcripts or portraits
must stay out of published assets.
