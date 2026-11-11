# ChatGPT plugin / connector — live MCP for the whole estate

Status: **live**. One remote MCP endpoint, systemd-owned, survives reboots.

Product scope and the OpenPāṭala control-plane direction are in [CHATGPT-NORTH-STAR.md](CHATGPT-NORTH-STAR.md). This file remains the operational source for the live connector.

## Connect it

1. In ChatGPT: **Settings → Connectors → Add custom connector** (a "plugin" in
   the new Apps model is exactly an MCP connector).
2. URL: `https://mcp.sanskrit.help/mcp`
3. Authentication: **Bearer**. The token is not in this repo:

   ```sh
   sudo grep MCP_TOKEN /etc/svatantrya-mcp.env
   ```

4. Save. The tool list appears as server tabs (`scholar`, `openpatala`,
   `federation`, `bookfactory`, `videofactory`, `aoc`, `workspace`).

Health check without the handshake:

```sh
curl -s https://mcp.sanskrit.help/health        # -> ok 7 servers
curl -s -o /dev/null -w '%{http_code}\n' -X POST https://mcp.sanskrit.help/mcp \
  -H 'content-type: application/json' -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
# 401 = auth working
```

## What is exposed (documented count: 197 tools, 7 servers)

| Server | Tools | What ChatGPT can do |
|---|---|---|
| `scholar` | 38 | passages + hash-checked evidence, wheels, certificates, essays, sources, decisions, reviews |
| `openpatala` | 5 | resolve a work, search the bibliography, full dossier, frontier, health |
| `federation` | 109 | the trika-x gateway: formal evidence, treeka, bridges, cross-repo navigation |
| `bookfactory` | 22 | read lanes, theses, templates, entries, decisions, gate checks |
| `videofactory` | 18 | lanes, units, render-gate status |
| `aoc` | 20 | carousel factory: status, validate, review, receipts (writes are gated) |
| `workspace` | 7 | **edit the repos**: list/read/write/patch/grep, git status/log/diff/add/commit |

**Inventory drift:** the live estate index reports 198 tools and includes
`workspace__estate_index` in `read_first`; this checked-in registry and generated
catalogue report 197 and do not list that operation. Reconcile the authenticated
`tools/list`, generator, and deployed code before using a single final count.

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

## For a future "rebuild as a plugin" pass

The MCP endpoint *is* the plugin. What would make it feel like a product:

- a `ui://` widget for `scholar__passage_evidence` (Sanskrit + English + hashes)
- a `chatgpt-app.json` manifest with name, description, icon, and the six
  read tools as the default surfaced set
- OAuth (Google, reusing the site's `satsang-auth` flow) so each user gets
  their own scopes instead of a shared token
- rate limiting at the worker/tunnel edge before anything public is shared
