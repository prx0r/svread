# Provenance — tutor memory backend

Vendored 2026-11-12 from R2 `ayoutube/Svatantrya_Tutor_Memory_Plugin_Backend_Handoff_2026-11-12.zip`
(sha256 5995461547eceb4731b473a1103bdef3d3dcd90b2858a63fbb2969cb7dacdb0b, 34 KB).

Upstream: a backend reference implementation (FastAPI + SQLite + pytest). It
deliberately implements NO MCP server, OAuth, or deployment — those live in
the existing Svatantrya estate (this repo's `mcp/` + gateway), not here.

Local changes (if any) will be listed here. House law applies: nothing
auto-publishes; per-user scoping at the gateway; ChatGPT-facing tools live in
`mcp/memory_server.py`, never in this directory.
