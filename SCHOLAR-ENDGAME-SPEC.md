# Scholar Endgame — Specification

Status: **live in production** (see §9 for the verification record).
Owner: Svatantrya / svread. This is the contract for the whole loop, not a
wish list. Every claim below is either enforced by code and tests or marked
as an open gate.

## 1. Purpose

Carry one claim from a Sanskrit source to a signed, publicly readable
position without ever losing provenance:

```
source → layered translation → draft → peer review → author sign-off
       → public branch → release → published position
       → explicit AI-use permission → human or agent enquiry
```

The same evidence spine feeds the public reader, the Scholar workspace, the
Pushing Lab (human enquiry) and the MCP server (agent enquiry). No surface
may bypass another surface's gates.

## 2. Actors and trust states

| Actor | Surface | Identity |
|---|---|---|
| Reader | svread.pages.dev | none (anonymous, read-only) |
| Scholar | svread `?view=scholar` | `svsess` HMAC cookie (PBKDF2 account) |
| Author | Scholar | account + display name; published essays are `SELF_ATTESTED` |
| Reviewer | Scholar | a second account, explicitly invited per revision |
| Enquiry author | Pushing Lab | device-local by default; optional Scholar saves |
| Agent | MCP server (`svread-scholar-mcp/0.1`) | read-only evidence; account tools need an explicit session cookie |
| Release operator | box | runs `emit_scholar` + manifest + reader deploy |

Trust vocabulary is fixed: `SELF_ATTESTED` ≠ reviewed ≠ verified.
Publishing means "the author signed this exact snapshot and chose to make it
public". It does not assert correctness.

## 3. Services and topology

```
                    ┌──────────────────────────────┐
                    │  svread.pages.dev (static)   │
                    │  reader · scholar · pushing  │
                    │  data/scholar/*.json         │
                    │  data/release-manifest.json  │
                    └──────────────┬───────────────┘
                                   │ fetch (hash-checked)
                    ┌──────────────▼───────────────┐
                    │  ipvv-api (Cloudflare Worker)│
                    │  auth · documents · reviews  │
                    │  signoffs · permissions      │
                    │  AI proxy · /api/read (R2)   │
                    └───┬───────────┬──────────┬───┘
                        │           │          │
             D1 (ipvv)  │      R2 (audio)     │ HTTPS + HMAC
                        │                     │
                        │        ┌────────────▼─────────────┐
                        │        │ bridge.sanskrit.help     │
                        │        │ scholar_service.py (box) │
                        │        │ git worktrees + push     │
                        │        └────────────┬─────────────┘
                        │                     │ git push
                        │        ┌────────────▼─────────────┐
                        │        │ prx0r/translation-work   │
                        │        │ scholar/essays/*.json    │
                        │        │ scholar/versions.jsonl   │
                        │        └──────────────────────────┘
                        │
                  agents ── MCP ── local evidence + account API
```

Single-box publish path: the bridge runs on the same box as the canonical
repo. It is exposed only through a named Cloudflare Tunnel and authenticates
every submission with a shared HMAC secret (±120 s replay window). It binds
127.0.0.1 only.

## 4. Lifecycle and endpoints

Documents are private per account until signed and submitted.

| Step | Endpoint | Gate |
|---|---|---|
| Draft / revise | `PUT /api/scholar/documents/:id` | `expected_revision` CAS |
| Request review | `POST /api/scholar/reviews` | reviewer ≠ author, exact revision |
| Review decision | `POST /api/scholar/reviews/:id/decision` | reviewer only, frozen snapshot |
| Sign off | `POST /api/scholar/signoffs` | `confirmed:true`, exact revision hash |
| Submit | `POST /api/scholar/submit` | signoff matches live snapshot; bridge configured |
| Grant AI use | `PUT /api/scholar/essay-permissions` | author only; published essay only; separate answers/drafts |
| Read published | `GET /api/scholar/published-essays?work=` | any signed-in account |
| Read-only agent | MCP `list_published_essays` + `passage_evidence` | no writes, no signoff/publish tools exposed |

Sign-off does not freeze the draft. Editing after sign-off invalidates the
signoff and submission returns 409 until re-signed.

## 5. Published essay contract

`submit_essay` (bridge) writes exactly one content-addressed file:

```
<work>/scholar/essays/<sha256(canonical(entry))>.json
branch: scholar/essay-<digest>
entry:  format scholar-essay/1 · work · target · title · text · author ·
        author_id · identity_state SELF_ATTESTED · rights · signoff ·
        snapshot · assisted · model · validation_scope
```

The submission validates the target against the exact committed T1 rows and
`proof-<song>.json` (`deterministic_gate: PASS`, layer hashes current). A
branch is pushed to the public remote but **never merged automatically**.
Private reviewer text, style examples and source notes never enter the
published file.

## 6. Release contract

A published branch only reaches readers through a release:

1. merge the branch into `translation-work` main (fast-forward; the branch is
   based on the submission-time HEAD);
2. `python3 tools/emit_scholar.py --work <work>` → `svread/data/scholar/<work>.json`
   + `index.json`;
3. `python3 scripts/release_manifest.py --write` → hashes every asset;
4. run reader tests; deploy via `deploy.sh` (bumps the SW cache);
5. verify the live projection hash and manifest.

The worker loads projections from the live reader origin, so permissions and
AI retrieval always act on released bytes.

## 7. Permission contract

- One row per `(work, essay_id)`; author_id must match the published record.
- `allow_answers` and `allow_drafts` are independent; both default to false.
- Revocation is a real update, not a delete with a stale read: the published
  essay response reflects the stored grant on every request.
- No permission is inferred from copyright, publication or authorship.
- Only exact published versions can be granted.

## 8. Gates deliberately left closed

| Gate | State | Requirement |
|---|---|---|
| Qwen text | closed | `SCHOLAR_DASHSCOPE_API_KEY` + daily account/global caps |
| Realtime voice | closed | `QWEN_REALTIME_ENABLED`, free-tier confirmation, provider URL/key |
| ORCID identity | closed | owner registers a Public API client (redirect `/api/auth/orcid/callback`) |
| Third-party AI use | requires author grant | enforced live |
| Video/render | paused | owner decision; fal key intentionally not used |

## 9. Verification record

Filled by the live run on 2026-11-04. See §10 for commands.

- Two-account author/reviewer loop: **PASS**. Author `Svatantrya Editorial` (`f1399a67-9ce1-45c9-a4f0-9a263bb52eec`) saved a draft, requested review; reviewer `Peer Reviewer` (`90513e3d-3a42-4b42-87ad-3f5fb7ee60c9`) recorded `ACCEPT` (`review:b9e7f1c9-6cfa-4af0-aff0-6a5c8b4f533f`); author signed off `cc-by-4.0` (`signoff:20971909-93c4-4c8d-9414-b6c6f30d3c19`) and submitted.
- Publish via bridge (branch + commit): **PASS**. Bridge accepted the signed submission with a fresh HMAC (±120 s), wrote `paramarthasara/scholar/essays/62e62283….json`, and pushed branch `scholar/essay-62e62283ac8d5aa4a927ecbdcc064eeac4a38d8291a5dcd39db976f1b794e51b` at commit `55e9216f` to `prx0r/translation-work`. Merged fast-forward to `master` (`55e9216`) — never auto-merged by the bridge.
- Release + projection hash: **PASS**. `emit_scholar.py --work paramarthasara` produced 1 essay (`essay:62e62283…`, 1327 KB projection); manifest `303 asset hashes, 55 works, 22 Scholar projections`; live deploy `f53b23fb` serves the essay at `/data/scholar/paramarthasara.json`.
- Permission grant → visible → revoke → visible → re-grant: **PASS**. Author `allow_answers=true` → `published-essays` returns `allowed.answers=true`; revoke → `false`; final state `allow_answers=true, allow_drafts=false`.
- Non-author grant refused: **PASS**. Reviewer POST to the permission endpoint → `403 {"error":"Only the author can change these permissions."}`.
- MCP published-essay visibility: **PASS**. `list_published_essays` returns the essay with rights; evidence tools unaffected; 25 tools total.
- Pushing scholarship panel: **PASS**. Reviewer cookie shows `What a signed essay is · Svatantrya Editorial · paramarthasara / Allowed: answers · no drafts`; non-owner gets no grant controls.
- Browser tests: **PASS**. `pushing-browser` + both `scholar-browser` suites green against real Chromium + local Worker; full svread suite 38/38, ipvv 23/23, MCP 6/6.
- First published essay: `essay:62e62283ac8d5aa4a927ecbdcc064eeac4a38d8291a5dcd39db976f1b794e51b` — "What a signed essay is", `SELF_ATTESTED`, `assisted:false`. Editorial accounts are live and documented in `/root/.scholar/endgame-accounts.json` (0600); the owner may retire them at will.

## 10. Operational runbook

```sh
# Bridge (box; repo must be clean; 8899 is held by the old dashboard, use 8901)
cd /root/translation-work
pm2 start python3 --name scholar-bridge -- tools/scholar_service.py \
  --bridge-secret-file /root/.scholar/bridge_secret \
  --origin https://svread.pages.dev --port 8901 --push-remote origin

# Tunnel "scholar-bridge" (id d18a275a-9716-463c-9dc9-0bc7ba3bced4),
# ingress bridge.sanskrit.help → http://127.0.0.1:8901
pm2 start cloudflared --name scholar-bridge-tunnel -- tunnel --no-autoupdate run \
  --token-file /root/.scholar/tunnel_token
pm2 save

# Worker secrets
printf %s "$SECRET" | wrangler secret put SCHOLAR_BRIDGE_SECRET
printf %s https://bridge.sanskrit.help/ | wrangler secret put SCHOLAR_BRIDGE_URL

# Release (after a submission branch exists)
git merge --ff-only scholar/essay-<digest>
python3 tools/emit_scholar.py --work <work>
cd /root/svread && python3 scripts/release_manifest.py --write && ./deploy.sh
```

Rollback: revoke the branch by not merging it; to unpublish a released essay,
revert its entry in the work ledger, re-emit, rebuild the manifest, redeploy.
The Git branch and signed snapshot remain as the audit record.

## 11. Test matrix

| Layer | Test | Where |
|---|---|---|
| Unit | MCP tools, redirect/SSRF guards, permissions, auth | `svread/mcp/test_scholar_server.py`, `ipvv/tests/orcid-auth.test.mjs` |
| Worker | full account→signoff→publish→permission chain on a real local Git remote | `ipvv/tests/scholar-publish-e2e.test.mjs` |
| Browser | Scholar workspace + Pushing Lab against a local Worker | `svread/tests/scholar-browser.test.cjs`, `pushing-browser.test.cjs` |
| Release | manifest hash gates, reader integrity, SW privacy | `svread/tests/*.cjs` |
| Live | two-account publish through `bridge.sanskrit.help`, release, permission, MCP | this document, §9 |
