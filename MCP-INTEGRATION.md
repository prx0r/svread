# MCP INTEGRATION — one surface for ChatGPT (2026-11-11)

> **Status (2026-11-11): historical design record.** The endpoint is now live; use [CHATGPT-PLUGIN.md](CHATGPT-PLUGIN.md) and [data/mcp-registry.json](data/mcp-registry.json) for current connector, tool inventory, authentication, and operations. The bridge/tunnel rows below describe the earlier plan and are superseded.

Companion to `data/mcp-registry.json` (probed live: 8 servers, 122 leaf tools,
109 federated). This is the plan to make the whole estate reachable from
ChatGPT as **one thing**, with the smallest honest surface.

---

## 1. What exists today (probed, not remembered)

| Server | Tools | Role | Where |
|---|---|---|---|
| **trika-x-federation** | **109** | **THE entry point** — aggregates the five children + formal tools, FailOpen | `trika-x/formal-trika/tools/federation_gateway.py` |
| svread-scholar | 38 | evidence, versions, audits, wheels, certificates | `svread/mcp/scholar_server.py` |
| bookfactory | 22 | book specs → gated print products | `bookfactory/bf_mcp/server.py` |
| videofactory | 18 | video projects → gated mp4s | `videofactory/vf_mcp_server.py` |
| translation-work | 16 | layers: status/validate/lore/swarm | `translation-work/mcp_server.py --serve` |
| openpatala | 5 | identity: resolve/bundle/search/frontier/health | `openpatala/patala/mcp_server.py` |
| aoc | 20 | carousel factory (separate product line) | `aoc/mcp_server.py` |
| sleepdraw | 4 | journey renderer (separate product line) | `sleepdraw/mcp_server.py` (CLI-style) |

All are **stdio**. ChatGPT cannot reach stdio. The ipvv worker `/mcp` is a
legacy JSON-RPC stub (protocol 2024-11-05, no auth, no wheels) — superseded.

## 2. The one-surface plan

```
ChatGPT ──HTTPS──▶ mcp.svatantrya.net/mcp   (or Secure MCP Tunnel)
                       │
                 tools/mcp_bridge.py   (box-side; Streamable HTTP + SSE)
                       │  stdio
                 trika-x federation gateway  (109 tools, FailOpen)
                       │
     ┌───────┬─────────┼──────────┬───────────┬──────────┐
  scholar  book    video   translation  openpatala   formal(7)
```

**Do not expose all 109.** The registry names the sheaves:

- **read sheaf (public)** — `wheel_harness`, `wheel_level`, `wheel_verify`,
  `wheel_certificate`, `openpatala__resolve|get_bundle|search`,
  `scholar__passage_evidence|search_texts`, `formal__evidence|bridge|gaps`,
  `federation__guide`. Source-bounded, no account needed.
- **write sheaf (OAuth)** — `progress_get`, `progress_record` only.
  Consent-gated, revocable, least privilege.
- **generative sheaf (OAuth + job ids)** — bookfactory/videofactory staging
  and packaging. Long jobs return `job_id`; artifacts land in R2.
  Rendering/publishing stays human-gated — always.

## 3. Bridge requirements (from EXTERNAL-STRATEGY §C)

- `POST /mcp` JSON-RPC, `GET /mcp` SSE, `DELETE /mcp` session end;
  protocol negotiation 2025-06-18 with 2024-11-05 fallback.
- **Mixed auth**: `initialize` + `tools/list` open; per-tool bearer for writes.
  No token in a URL. POST for any convenience call endpoint.
- FailOpen preserved: a dead child drops from `tools/list`, the parent stays.
- Limits: 60 s/call, 10 concurrent, 64 KB body; job ids for long work.
- Every tool response carries source, review status, licence, and failure
  behaviour — the same envelope as the site.

## 4. OAuth (write sheaf)

- Worker issues tokens; `sub = profiles.id` (Google site account, ORCID only
  for publishing).
- **Advertise `offline_access`** at `/.well-known/oauth-authorization-server`
  and issue refresh tokens — otherwise ChatGPT loses access when the first
  token expires (measured requirement, #14 research).
- Scopes: `progress:read`, `progress:write`, `reader:read`. Nothing that can
  sign, publish, render, or spend.
- Revocation per device; account isolation tested.

## 5. What ChatGPT then does (concrete)

| Ask | Path |
|---|---|
| "teach me level 3" | `wheel_harness` → `wheel_level` → `wheel_verify` per form → deep link to `wheels.html#level-3` |
| "prove that derivation" | `wheel_certificate` → `cert_sha` + `lean_independent` (receipt-bound) |
| "which text is this?" | `openpatala__resolve` → `openpatala__get_bundle` |
| "what does this verse say?" | `scholar__passage_evidence` → claim page URL for bytes+hashes |
| "record my score" (after consent) | `progress_record` — server scores via the gate; model never self-reports |
| "make a book" | bookfactory staging → `job_id` → artifact URL; human signs |

## 6. Status and next steps

| Piece | Status |
|---|---|
| Registry (this doc + JSON) | **done** — 8 servers probed, sheaves named |
| Bridge (`tools/mcp_bridge.py`) | **not built** — next |
| Tunnel / hostname | not configured (tunnel preferred; no public surface) |
| OAuth for write sheaf | not built; design fixed above |
| Legacy ipvv `/mcp` | superseded; leave inert until the bridge lands |

Order: bridge + selftest → tunnel → read sheaf live → OAuth → write sheaf.
