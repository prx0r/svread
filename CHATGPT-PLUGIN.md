# ChatGPT plugins — per-function MCP hosts (2026-11-12)

Status: **live**. Ten small hosts replaced the one 198-tool firehose
(ChatGPT degrades past ~50 tools and doesn't paginate `tools/list`).
Each host is systemd-owned, survives reboots, served through the one
`tunnel svatantrya-mcp` with per-host DNS + ingress.

## Install matrix (one ChatGPT plugin per row)

Flow per host: `chatgpt.com/plugins` → `+` → Add custom MCP server →
name + URL → auth per row → Create as a plugin → Install → `@name` in chat.

| Plugin | URL | Auth in ChatGPT | Tools |
|---|---|---|---|
| **Svatantrya (start here)** | `https://mcp.svatantrya.net/mcp` | No authentication | 40 public reads incl. the 60-level compose curriculum |
| **Svatantrya Studio** | `https://studio.svatantrya.net/mcp` | static bearer (owner token) | 39 tutor + essay + compose drills + voice session loop |
| **Svatantrya Factory** | `https://factory.svatantrya.net/mcp` | static bearer (owner token) | 40 books + video |
| index | `https://index.svatantrya.net/mcp` | No authentication | 5 openpatala reads |
| sanskrit | `https://sanskrit.svatantrya.net/mcp` | No authentication | 9 scholar reads |
| practice | `https://practice.svatantrya.net/mcp` | No authentication (reads); `progress__*` 401 without bearer | 5 wheel reads + 3 scored (bearer) |
| formal | `https://formal.svatantrya.net/mcp` | No authentication | guide + 7 formal reads + 2 treeka |
| translate | `https://translate.svatantrya.net/mcp` | No authentication | 6 shastra teaching reads |
| tutor | `https://tutor.svatantrya.net/mcp` | static bearer (owner token) | 5 session tools |
| essay | `https://essay.svatantrya.net/mcp` | static bearer (owner token) | 24 essay workflow |
| books | `https://books.svatantrya.net/mcp` | static bearer (owner token) | 22 book factory |
| video | `https://video.svatantrya.net/mcp` | static bearer (owner token) | 18 video factory |
| nibbana | `https://nibbana.svatantrya.net/mcp` | static bearer (owner token), **private — never list** | 4 relay/teacher |

Bearer token (owner only, never in repo): `sudo grep MCP_TOKEN /etc/svatantrya-mcp.env`.
`https://mcp.sanskrit.help/mcp` stays the owner console (full 198, bearer).

## Read this first (for the model)

Call `workspace__estate_index` on the console host (or read
`https://svatantrya.net/data/estate-index.json`). One JSON with:

- `counts` — 2,051 works, 268 translated songs, 44 certificates, 198 tools
- `repos` — what each of the 13 trees is and where to start
- `data` — every Sanskrit asset and **the MCP tool that reaches it**
- `docs` — what to read for rules, Lean limits, deployment
- `plugin_recipes` — eight buildable plugins with the exact tool chains

## Connect the owner console (firehose, bypasses the small hosts)

1. In ChatGPT: **Settings → Connectors → Add custom connector**.
2. URL: `https://mcp.sanskrit.help/mcp`
3. Authentication: **Bearer** (token above).
4. Save. The tool list appears as server tabs (`scholar`, `openpatala`,
   `federation`, `bookfactory`, `videofactory`, `aoc`, `workspace`).

Health check without the handshake:

```sh
curl -s https://mcp.sanskrit.help/health        # -> ok 7 servers
curl -s -o /dev/null -w '%{http_code}\n' -X POST https://mcp.sanskrit.help/mcp \
  -H 'content-type: application/json' -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
# 401 = auth working
```

## What is exposed (198 tools, 7 servers)

| Server | Tools | What ChatGPT can do |
|---|---|---|
| `scholar` | 38 | passages + hash-checked evidence, wheels, certificates, essays, sources, decisions, reviews |
| `openpatala` | 5 | resolve a work, search the bibliography, full dossier, frontier, health |
| `federation` | 109 | the trika-x gateway: formal evidence, treeka, bridges, cross-repo navigation |
| `bookfactory` | 22 | read lanes, theses, templates, entries, decisions, gate checks |
| `videofactory` | 18 | lanes, units, render-gate status |
| `aoc` | 20 | carousel factory: status, validate, review, receipts (writes are gated) |
| `workspace` | 8 | **catalogue + edit the repos**: list/read/write/patch/grep, git status/log/diff/add/commit |

Tool names are `<server>__<tool>`, e.g. `scholar__wheel_level`,
`openpatala__search` (arg is `q`, not `query`), `workspace__ws_patch`.

Full generated catalogue: `mcp/gateway/TOOLS.md`.

## Editing surface (how ChatGPT changes things)

`workspace` tools are deliberately narrow:

- roots: the 13 repos under `/root`, resolved through symlinks
- refused by name: `.env`, `.dev.vars`, `*.pem`, credentials, `id_rsa`,
  `.npmrc`, `.r2-env`, `.cf-api-token`; `.git`, `node_modules`, `.venv` refused
- `ws_write` ≤ 512 KB text; `ws_patch` replaces one exact unique string
- `ws_git` allows status/log/diff/add/commit/branch/checkout/show — **no push**

So the loop is: read → patch → commit on a branch → the owner pushes / opens the
PR. That keeps a human on the one action that publishes.

## File map — where to change what

| Goal | File |
|---|---|
| add a server to the endpoint | `mcp/gateway/servers.json` (path, cwd, env) |
| change routing/auth/transport | `mcp/gateway/gateway.py` |
| add a tool to a child server | that repo's server file, e.g. `svread/mcp/scholar_server.py`, `openpatala/patala/mcp_server.py`, `translation-work/mcp_server.py` |
| edit files through MCP | `mcp/gateway/workspace_server.py` (roots, deny list, git allowlist) |
| public endpoint facts | `data/mcp-registry.json` → `public_endpoint` |
| tests | `tests/mcp-gateway.test.cjs` |
| systemd units | `deploy/systemd/svatantrya-mcp*.service` |
| narration for humans | this file, `mcp/gateway/README.md`, `MCP-INTEGRATION.md` |

Adding a tool to a FastMCP child is one decorated function, e.g.:

```python
@mcp.tool()
async def my_tool(query: str) -> str:
    """One line the model reads."""
    return json.dumps(...)
```

Then `systemctl restart svatantrya-mcp` (children are spawned per call, so the
gateway picks it up immediately; no redeploy needed).

## Running it

```sh
systemctl status svatantrya-mcp.service svatantrya-mcp-tunnel.service
systemctl restart svatantrya-mcp.service        # after editing gateway code
journalctl -u svatantrya-mcp.service -n 50
```

- `svatantrya-mcp.service` — `127.0.0.1:8765`, `Restart=always`, enabled
- `svatantrya-mcp-tunnel.service` — named Cloudflare tunnel `svatantrya-mcp`
  → `mcp.sanskrit.help`, `Restart=always`, enabled
- token: `/etc/svatantrya-mcp.env` (0600), read by both units

Rotating the token: edit `MCP_TOKEN` in that file, `systemctl restart
svatantrya-mcp`, then update the connector.

## Monitoring to script

| Cadence | Check | Fail means |
|---|---|---|
| hourly | `curl -fsS https://mcp.sanskrit.help/health` | tunnel or gateway down |
| daily | `gateway__problems` over MCP | a child server stopped importing |
| daily | `systemctl is-active svatantrya-mcp{,-tunnel}` | restart loop |
| weekly | `journalctl -u svatantrya-mcp -p warning` | repeated child crashes |
| weekly | compare `tools/list` count to `TOOLS.md` | a tool vanished |

## Honest caveats

1. **One shared bearer token.** Anyone with it can edit any repo (except push)
   and call `aoc__*` writes. Treat it as a root-adjacent secret; rotate before
   sharing.
2. **No OAuth yet.** The plan in `MCP-INTEGRATION.md` is per-tool OAuth with
   `offline_access` so a connector can act as a specific account. Not built.
3. **`aoc` and `bookfactory` write tools are gated but real.** They append
   receipts/decisions; none publish.
4. **The federation server has its own names** (`federation__guide`,
   `openpatala__resolve`, `formal__*`). 22 names duplicate a direct server and
   the direct server wins.
5. **Apps-SDK widgets are not built.** The connector works with plain tool
   results; rich UI would need a widget + `ui://` resources.

## Owner TODOs (needs a human)

1. **Practice scoring needs your session.** `progress__*` answers BLOCKED until
   `SVATANTRYA_SESSION` is set: sign in on svatantrya.net, copy the session
   token, add `SVATANTRYA_SESSION=<token>` to `/etc/svatantrya-mcp.env`,
   `systemctl restart svatantrya-mcp-practice`. Re-do when the session expires.
2. **Per-user OAuth instead of the shared bearer.** Gateway already speaks mixed
   auth + RFC 9728 discovery (`/.well-known/oauth-protected-resource`,
   `WWW-Authenticate` challenges). Missing: a real authorization server
   (Google upstream, `offline_access`, per-tool `securitySchemes`). Bearer hosts
   stay owner-only until then — nibbana especially.
3. **Directory submission (public plugins only: index/sanskrit/practice/formal/
   translate).** Needs: domain verification, 5 positive + 3 negative test cases
   per plugin, reviewer-usable demo (public hosts need no creds), and the
   OAuth step above for anything with writes. Nibbana is never submitted.
4. **Remaining builds:** `treeka` frontier polish, tutor voice/audio job ids,
   `hxrmxs`/`rag` reference tools on the tutor host, edge Worker migration for
   the 5 read hosts so the box isn't load-bearing.

## For a future product-feel pass

- a `ui://` widget for `scholar__passage_evidence` (Sanskrit + English + hashes)
- a `chatgpt-app.json` manifest with name, description, icon, and the six
  read tools as the default surfaced set
- rate limiting at the worker/tunnel edge before anything public is shared
