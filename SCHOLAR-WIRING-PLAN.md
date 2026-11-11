<!-- status: historical — scholar wiring shipped -->

> **Status (2026-11-11):** historical — scholar wiring shipped.

# Scholar wiring plan — review of codex's three draft PRs

*2026-11-04. Reviewed: svread #3 (client), ipvv #9 (worker), translation-
work #7 (bridge/emit). Companion docs: `worker/SCHOLAR-RELEASE-HANDOFF.md`
(ipvv branch), `SCHOLAR-PRIVACY.md` (svread branch), `SCHOLAR.md`
(translation-work branch).*

## Verdict

The suite is well-built and ready to wire. Privacy and integrity are
handled above the bar for a private-beta: server-side credentials only,
`no-store` on account responses, service-worker bypass for `/api/*` and
non-GET, per-account localStorage keys with account-switch clearing,
optimistic concurrency (`expected_revision` → 409), immutable review
snapshots, hash-sealed data projections (`projection_sha256` + original
layer hashes), and a ghatakarpara evidence hold rather than shipping bad
alignment. Tests are real: 23 Node + 2 Chromium (browser → local Worker →
SQLite, Qwen mocked), 20 worker/auth tests, 29 Python tests.

**But nothing is deployed.** Live checks today:

| Surface | State |
|---|---|
| `ipvv-api…/api/scholar/documents` | **404** (worker not deployed) |
| `svread.pages.dev/scholar-workspace-ui.js` | **HTML fallback** (old app served) |
| D1 migrations 0002–0011 | not applied |
| Voice | triple-gated off (`QWEN_REALTIME_ENABLED`, `SCHOLAR_QWEN_FREE_TIER_CONFIRMED`, `SCHOLAR_DASHSCOPE_API_KEY`) |

## What each PR ships

**svread #3 (+2,878/−17, 25 files)** — workspace UI (private drafts,
revision history + compare/restore, style examples, essays + citations,
reviews, decisions, source notebook + typed links, report history,
annotations), guarded push-to-talk voice (16k in / 24k out, server-side
creds, explicit Talk/Send), 22 vendored Scholar projections (~450k lines
from our pipeline, hash-sealed), pinned ghatakarpara source (SHA-256),
reader gate `isReaderPass` applied to every surface incl. audio/exports,
local MCP stdio server (hash-verified evidence, versions/compare, optional
vidyut 0.4.0 transliteration + licensed meter), release manifest builder,
6 new test files. **Supersedes #4's reader-integrity work** (carries the
same app.js gates, audit script, sw privacy tests) — #4 conflicts only
because it lacks the workspace; close it after verifying
`READER-ARCHITECTURE.md`/README carry-over.

**ipvv #9 (+1,954/−8)** — `/api/scholar/*` API on the existing worker
(scholar-workspace.js 614 lines, index.js routing 906), D1 migrations
0002–0011 (additive), `svsess` auth with strong-secret enforcement,
origin allowlist (already includes `svread.pages.dev`), Git-bridge submit,
Qwen assist with atomic daily account/global reservations, `/api/scholar/
voice` WebSocket relay (Bearer proxy to DashScope realtime).

**translation-work #7 (+724/−32)** — `tools/scholar.py`, service additions
(review versions, decisions, annotations, source links), `emit_scholar.py`
determinism, `vidyut_candidates.py`, SCHOLAR.md + VIDYUT-EVALUATION.md.

## Blockers (ordered)

1. **Merge reconciliation** — #4 vs #3 overlap; #10 (audio versioning) and
   #11 (pushing permissions) are in flight and touch the same surfaces.
   Rebase onto current mains, rerun suites. No force-push.
2. **D1 backup + migrations** — `wrangler d1 export ipvv` to a secure
   off-repo file first, then 0002→0011 in order (`--remote`). Migrations
   are additive/repeatable but the backup is non-negotiable.
3. **Worker deploy** — from `ipvv/worker/` (only). Verify `/api/scholar/
   documents` → 401 (not 404), CORS echoes `https://svread.pages.dev`.
4. **svread deploy** — only after worker+migrations; `deploy.sh` (bumps SW
   cache), verify `scholar-workspace-ui.js` returns JS, workspace renders,
   login works cross-origin.
5. **Keep Qwen off** — text and voice stay disabled until the owner has a
   provider-side spending cap, the Scholar secret, and a real provider
   test. Free-tier flag alone is not a cap.
6. **Known content holds** — ghatakarpara evidence withheld pending
   upstream alignment repair; 37 works lack named `source_edition`;
   full-site gate needs the authorized build host (source-library volume +
   `site/dist/data/receipts.jsonl`).
7. **ORCID** — phase 2: register Public API client (redirect
   `…/api/auth/orcid/callback`), then `wrangler secret put`. Local
   email/password auth is live and sufficient for beta.

## Wiring sequence

**Phase 0 — reconcile (no deploy).** Worktrees for svread #3, ipvv #9,
translation-work #7; rebase; run all suites locally. Confirm #3 ⊇ #4;
close #4; then merge #7 → #9 → #3 in that order.

**Phase 1 — worker live (30 min).**
```bash
cd /root/ipvv && git checkout codex/scholar-workspace-recovery-v2
cd worker
wrangler d1 export ipvv --remote --output /root/backups/ipvv-$(date +%F).sql
for f in migrations/00{02..11}_*.sql; do
  wrangler d1 execute ipvv --remote --file "$f"; done
wrangler deploy
```
Verify: 401 on documents, 200 on public endpoints, CORS headers.

**Phase 2 — reader live (15 min).**
```bash
cd /root/svread && git checkout main && git merge –-no-ff codex/scholar-workspace-recovery-v2
./deploy.sh
```
Verify: JS not HTML, workspace visible, save/history round-trip, account
switch clears drafts, SW caches no account responses.

**Phase 3 — MCP local wiring.** Run `python3 mcp/scholar_server.py` with
`SCHOLAR_API_ORIGIN=https://ipvv-api.tradesprior.workers.dev` +
`SCHOLAR_SESSION_COOKIE` in the client's private env; smoke: projection
hash, evidence layers, versions, compare. (session_secret already shared
at `/root/.scholar/session_secret` 600.)

**Phase 4 — acceptance (gates release).** Browser: login, account switch,
private save, conflict 409, history restore (invalidates signoff), reviewer
isolation, signoff, Qwen consent (mocked ok), voice permissions (off).
Bridge: disposable Git submission test. Then declare beta.

**Phase 5 — later gates.** Qwen text/voice on (spending cap + secret +
limits), ORCID live (client creds), Zenodo DOI leg, full-site gate on
authorized host, ghatakarpara repair, source_edition backfill.

## Notes for our stack

- The 22 scholar projections are our pipeline's works — our parable
  packages are independent artifacts; the reader's gate does not touch
  them.
- MCP server can be wired into opencode/agents directly; it is local-only
  by design (redirects off, loopback HTTP only, no logging of drafts).
- Voice architecture matches our existing Qwen/DashScope usage — same
  provider as the ipvv worker's `/api/read` path; keep the free-cap rule.

## DEPLOYED — 2026-11-04 15:30 UTC

| Item | Result |
|---|---|
| translation-work #7 | merged (`d54fe03`), 29 py tests pass |
| ipvv #9+#11 merged, #10 on top | `609b96fc` (test-harness fix), 20 worker tests pass |
| svread #3+#5 merged, #4 closed superseded | `b8418fc` main |
| D1 backup | `/root/backups/ipvv-2026-11-04-1527.sql` (268 KB) |
| D1 migrations 0002–0012 | all applied remote ✅ |
| Worker deploy | version `b99671ec` |
| svread deploy | `92e7c07c` → svread.pages.dev (SW cache bumped) |
| Smoke (prod) | signup → me → PUT draft rev1 → GET → DELETE all pass; test account cleaned |
| Voice | correctly disabled (401 anon / "not configured" auth) |
| Qwen text | still off (no `SCHOLAR_DASHSCOPE_API_KEY`) |

Wiring verified: CORS echoes `https://svread.pages.dev` with credentials;
`/api/scholar/documents` 401 anon; projection data + manifest 200 on the
reader.

## POST-DEPLOY INTEGRATION — 2026-11-04 15:55 UTC

| Item | Result |
|---|---|
| svread reader-integrity commits | merged `647d4f3` (keep pushing shell + held-work tests; manifest regenerated: 303 asset hashes, 55 works, 22 projections) |
| svread tests | 35 pass, 3 skip (38) |
| Reader redeploy | `6be87a3c` → svread.pages.dev |
| Pushing Lab live | `/pushing` → "Pushing Lab · Svatantrya"; `pushing-core/ui.js`, `pushing.css` 200; catalog `57` records; source index live |
| Permission routes (live) | anon 401; bad payload 400; unknown essay 404; published-essays 200 `[]`; assist without consent 400 |
| MCP protocol | initialize + tools/list: 25 tools (`list_works` → 22 works) |
| MCP evidence | real `bh-p01` source + layers (12.9 KB); ghatakarpara correctly withheld ("source alignment needs upstream repair") |
| MCP versions/compare | paramarthasara 4 versions, diff 1004 chars |
| MCP vidyut | installed — candidates return slp1 + meter hash, marked unreviewed |
| MCP account tools | live worker: list/save/history/published-essays pass; Qwen drafting blocked by consent gate |
| MCP fix | Cloudflare 1010 blocked python-urllib UA → explicit `User-Agent: svread-scholar-mcp/0.1` + regression assertion |
| Cross-repo e2e | `scholar-mcp-e2e` 1/1; permissions+orcid 3/3 |
| `/api/read` | $0 TTS rendered bh-p01 (124,550 B, `cached:false`), R2 audio HEAD 200 |
| opencode wiring | `scholar` local MCP server added to `~/.config/opencode/opencode.jsonc` |
| Smoke cleanup | test profile + rows deleted (0 `@svread.test` profiles remain) |
| Remaining gate | voice/Qwen provider creds + caps; ORCID client — unchanged |
