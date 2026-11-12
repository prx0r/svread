# Svatantrya plugins

Start with the three bundles, then go granular if you want. Install: chatgpt.com/plugins → + → Add custom MCP server → paste URL → auth per row → Create as a plugin → Install.

## Start here (bundles)

## Svatantrya

`https://mcp.svatantrya.net/mcp`

Everything public in one install. All 45 public reads: bibliography, passages, wheels, translation briefs, formal layer, treeka chains, the 60-level compose curriculum, and the four-wheel map, packs, plus decompose/dialogue.

Auth: none · Access: public — start here · Tools: 45

Try:
- What are the four wheels?
- Show me the Family pack
- Why does aham paṭhāmi become bhavān paṭhati?

## Svatantrya Studio

`https://studio.svatantrya.net/mcp`

Your writing + learning room. Tutor sessions, sourced essays, deterministic compose drills and the voice session loop (start/check/end), server-scored gates. Owner token.

Auth: bearer · Access: owner · Tools: 47

Try:
- Start a warm-up session
- Check my Sanskrit: bhavān katham asti
- What should I study next?
- Remember that I prefer quick-fire drills

## Svatantrya Factory

`https://factory.svatantrya.net/mcp`

Books + video, gated. Book staging and video render gates. Human-gated publishing. Owner token.

Auth: bearer · Access: owner · Tools: 40

Try:
- What lanes are open?
- What is the render-gate status?

## Per-function hosts (granular; same tools, split up)

## Svatantrya Index

`https://index.svatantrya.net/mcp`

Bibliography: which Sanskrit work is this? Resolve a work, search 2,051 titles, pull the full dossier.

Auth: none · Access: public · Tools: 5

Try:
- Find the work called Tantrasara
- Give me the full dossier for tantrasara
- Which works still need translations or sources?

## Svatantrya Sanskrit

`https://sanskrit.svatantrya.net/mcp`

Hash-checked passages and English, citable. Search the corpus; pull Sanskrit plus editorial layers with hashes.

Auth: none · Access: public · Tools: 9

Try:
- What does Tantrasara chapter 20 verse 1 say, in Sanskrit and English?
- List what has a reader bundle
- Compare versions of tsa-a20-v01

## Svatantrya Practice

`https://practice.svatantrya.net/mcp`

Wheels, levels, certificates; server-scored gates. Teach one level at a time; gates are scored server-side, the model never self-reports.

Auth: mixed · Access: public reads; scoring needs sign-in · Tools: 5 open + 3 signed-in

Try:
- Teach me wheel level 1
- Prove the form gata
- Show my scored progress (needs sign-in)

## Svatantrya Formal

`https://formal.svatantrya.net/mcp`

Theorems, bridges, gaps, treeka chains. Evidence rows, chunk resolution, coverage gaps, work-to-essay chains. Refs are hashes.

Auth: none · Access: public · Tools: 10

Try:
- What can you do? (navigates the layer)
- Show the formal coverage gaps
- Give me the treeka chain for tantrasara

## Svatantrya Translate

`https://translate.svatantrya.net/mcp`

Transmission briefs and translation state. Work state, 1-page briefs, concept grounds, recon. Quotes PASS-gated English only.

Auth: none · Access: public · Tools: 6

Try:
- What is the state of work tantrasara-a01?
- Show me its transmission brief
- What are the grounds for hand-glossing it?

## Svatantrya Tutor

`https://tutor.svatantrya.net/mcp`

Objective-driven Sanskrit sessions. Daily brief, weekly arc, 15-minute sessions with assessment. Single learner.

Auth: bearer · Access: owner · Tools: 5

Try:
- What is today's plan?
- Start a compression level 1 session
- Show my profile

## Svatantrya Essay

`https://essay.svatantrya.net/mcp`

Sourced essay workshop, human-gated. Drafts, sources, citations, claim audits, review packets. Nothing auto-publishes.

Auth: bearer · Access: owner · Tools: 24

Try:
- List my documents
- Audit this draft against its sources
- What is waiting for human review?

## Svatantrya Books

`https://books.svatantrya.net/mcp`

Gated book production. Lanes, templates, staging into print products. Rendering stays human-gated.

Auth: bearer · Access: owner · Tools: 22

Try:
- What lanes are open?
- Show the next actions for the current book

## Svatantrya Video

`https://video.svatantrya.net/mcp`

Gated video production. Projects, units, render-gate status, finals. Publishing stays human-gated.

Auth: bearer · Access: owner · Tools: 18

Try:
- What video projects exist?
- What is the render-gate status?

## Nibbana Relay (private)

`https://nibbana.svatantrya.net/mcp`

Diary relay + decode review. Never listed. Relay lived experience with provenance (never advice); review decode proposals. Owner journal only.

Auth: bearer · Access: private — owner only, never in any directory · Tools: 4

Try:
- Relay what the diary says about restlessness
- Show day 1 decode rows

## For agents (CLI)

- `curl -s -X POST https://mcp.svatantrya.net/mcp -H 'content-type: application/json' -H 'accept: application/json, text/event-stream' -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'  # 40 public tools, no auth. Parse the data: lines as JSON.`
- `npx @modelcontextprotocol/inspector@latest  # Transport: Streamable HTTP, URL https://mcp.svatantrya.net/mcp (public, no headers). Bearer hosts (studio/factory/...): add Authorization: Bearer $MCP_TOKEN in Headers.`
- `claude mcp add --transport http svatantrya https://mcp.svatantrya.net/mcp`
- `claude mcp add --transport http studio https://studio.svatantrya.net/mcp --header "Authorization: Bearer $MCP_TOKEN"`
- `{"mcp": {"svatantrya": {"type": "remote", "url": "https://mcp.svatantrya.net/mcp"}}}  # paste into ~/.config/opencode/opencode.jsonc`
- `{"mcp": {"studio": {"type": "remote", "url": "https://studio.svatantrya.net/mcp", "headers": {"Authorization": "Bearer $MCP_TOKEN"}}}}`
- `from fastmcp import Client
async with Client('https://mcp.svatantrya.net/mcp') as c:
    tools = await c.list_tools()  # 40 tools, no auth
    r = await c.call_tool('compose__next_level', {})  # study-order next`
- `studio svatantrya.net (47 tools) · factory (40) · essay (24) · books (22) · video (18) · tutor (5) · nibbana (4, private) · practice writes · all need Authorization: Bearer $MCP_TOKEN; reads on practice stay open.`

<!-- machine-readable: https://svatantrya.net/plugins/plugins.json -->
