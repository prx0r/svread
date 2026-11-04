# Satsang

A living spiritual directory: teachers, scholars, lineages, traditions, places to study and practise, free texts and practices, a topic-flash resonance feed, TV mode, and an open MCP/REST API that agents (ChatGPT, Claude) can query for sourced, dated answers.

- **Live:** https://tantrafiles.xyz (MCP `https://mcp.tantrafiles.xyz/mcp`, API `https://api.tantrafiles.xyz`, chat `https://chat.tantrafiles.xyz`).
- **satsang.digital: pending.** The domain is prepared but not active (its nameservers must point to Cloudflare first); after `app/tools/switch-domain.sh` it becomes the main host and tantrafiles.xyz 301s to it.
- `domain.mjs` – the one place for public hostnames (BASE); `app/tools/switch-domain.sh` attaches the satsang.digital Worker domains, flips BASE, redeploys and makes tantrafiles.xyz 301 (path kept).
- `app/` – site (Cloudflare Worker), API (Worker + D1), build tools, wisegraph data
- `mcp/` – read-only MCP server + REST/OpenAPI + open-data dumps (see mcp/README.md)
- `specs/` – data model, schemas, ranking, loop, profile, roadmap
- `sources/` – sourcing pipelines and metadata (official embeds and metadata only; no media)
- `atlas/` – tradition timeline knowledge graph prototype (not on the site)
- `engine/` – practice engine: text → practice pipelines, the hands-off sit player (`/sit/`, preview https://engine.tantrafiles.xyz/sit/)
- `search/` – enquiry lens Worker (satsang-search)
- `BRIEF.md` current state · `OPEN-THREADS.md` open work · `MERGE-LOG.md` history · `_archive/` old briefs and reports

Deploy: `sh app/deploy.sh` (site), `sh app/deploy.sh api`, `sh app/deploy.sh mcp` (also `chat`, `search`). Release: `sh tools/release/release.sh "msg"` (engine/ via `RELEASE_ENGINE=1 RELEASE_ONLY=engine`). Worker names (wiser-web, wiser-api, wiser-mcp), the D1 database and KV namespaces keep their original internal names.

Licences: code MIT (mcp/LICENSE-CODE); our curation CC BY 4.0 (mcp/LICENSE-DATA); third-party records are metadata only.
