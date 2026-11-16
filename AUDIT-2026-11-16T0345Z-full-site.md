# Svread Full Audit — 2026-11-16T03:45Z

*Box `/root/svread` (main `b071ae15`, feature `scholar-projections-tantraloka-served` +1 dirty file) vs prod `svatantrya.net` + `svread.pages.dev`. All tabs fetched live. Tests run on box (bun 1.4.0, no `node` binary).*

## Verdict: content honest, deploy stale, tabs JS-only

**No Sanskrit bleed into English. No slop. Holds honored. Links resolve. But prod serves ~655 fewer claims than local, and Library/Scholar/Sanskrit/Practice views are client-side shells (no-JS = empty).**

## Tab-by-tab — is each useful?

| Tab | Live result | Useful? |
|---|---|---|
| Library (`?view=library`) | JS shell only via fetch (4KB `index.html` + 146KB `app.js`); content renders client-side from `data/library.json` | Partial — works with JS, empty without; crawlers get nothing. Claim/work pages carry the SEO weight instead. |
| Scholar (`?view=scholar`) | Same shell; readable projections exist locally (`132/146` per translation-work) but public bundle stale (OWNER-DECISIONS D5b: 55 works, no Tantraloka, bridge `AttributeError`) | Partial — on-box yes, public no. ChatGPT cannot read Tantraloka today. |
| Sanskrit (`?view=sanskrit`) | Excerpt exactly as hashed; `Devanagari not in ledger → none rendered` (verified on param-p01 + ghat-p01). No guessed transliteration. | Yes — honest closed-world rule holds. |
| Practice (`?view=practice`) | `data/practice/cards.json` 10 cards live on prod, verbatim with sources (TĀ15, MV, Padoux, Flood). No doctrine overreach. | Yes. |
| Index/Biblio (`?view=biblio`) | `emit_biblio --check RED` — box DB 555 works vs committed `biblio.json` from 2051-work DB. `biblio-view.test` fails. | No — BLOCKED (known PRODUCTION §0). Needs enriched DB sync. |
| Essay (`essay.html`) | Pre-rendered, 4-step assembler (literature → ground/plan → enquiry → assemble), PUSHBACK gate, scorecard. | Yes — best pre-rendered surface after claim pages. |
| About/Cite | Pre-rendered, owner verbatim, `about.json` mirror, org + sameAs. | Yes. |

## English coverage — are translations showing?

- Claim sample `paramarthasara/param-p01`: 9 verses L2 shown, labeled `Machine rendering — unreviewed draft`, each `param-p01-vNN`. Honest UNREVIEWED, no human-sign claim. **Good.**
- `ghatakarpara/ghat-p01..p03`: `Editorial hold. English withheld until recheck coverage` — verify pack bytes present but **no English quoted**. **Correct, no leak.**
- Counts: `585` claim pages show rendering, `3` withhold (ghatakarpara). Trace-backed: 2621 packs verified, 0 broken links (G04), 2621/2621 sha match (G05).
- **Flaw:** 62 `ipvv-chunk*` claim pages have no trace bundle (chunk overviews, intentional) → `G01 pages==traces 2684 vs 2621 FAIL`. Gate is stale, not content. Fix gate to allow chunk pages.

## Sanskrit bleed?

- `grep -rl "None" claim/` → 2 hits, both `mv-k09` sentence `None of this fits.` — legitimate English, **not slop**.
- Devanagari appears only in hashed excerpt block, never inside English rendering lines (checked param-p01 HTML). **Clean.**
- `no private material` test passes solo (earlier parallel fail was 5s timeout cascade).

## Claim/chain/work integrity

- 10-section order verified on both samples: answer → passage → rendering/hold → claim table → NOT-establish → verify → hashes → chain → cite → related → provenance. Byte-verified emitter, fail-closed.
- `chain/` + work indexes resolve, 0 broken (G04). Sitemap local 2618 claims (3 held excluded, G06 PASS). `llms-full.txt` 411KB, `ai-catalog.json` present.
- **Flaw:** prod `sitemap.xml` has **1963 urls vs local 5430** — prod deploy is ~655 claims behind. Release manifest local `FAIL stale, run --write` confirms unshipped content. The 37 Tantraloka projections (the headline win) are built locally but **not live**.

## Tests

- MCP `40 OK (1 skip)`. Node `96 pass / 6 skip / 8 fail`:
  - 4 emitter `--check` (biblio/traces/verify/eval_set): drift after new traces (2621→2622) + biblio RED — regen needed, biblio BLOCKED on DB.
  - `karaka wheel`: shells out to `node`, box has only `bun` — CI-only env gap, not content.
  - `release-manifest`: 5s bun timeout on box, passes with `--timeout 60000` scope.
  - `biblio-view`: same biblio RED root cause.
- `r2_system_backup --check`: `KeyError R2_ENDPOINT` — env not wired on box + dirty `tools/r2_system_backup.py` on feature branch. Ops-only.

## Deploy / R2 / secrets

- Deploy possible: `bunx wrangler 4.129.0` works; `/usr/local/bin/wrangler` shim broken (shebang `env` failure). `deploy.sh` needs `/root/.cf-api-token` (missing) — token exists in vault (`CLOUDFLARE_API_TOKEN`), wire via env at deploy time.
- Tunnels up (3x cloudflared, `:8930` mcp, `:8802`, `:8795` listening) though systemd reports inactive (run by supervisor, not systemd).
- Secrets: no `.env/pem/token` in crawler files per test (solo PASS). R2 creds present as files (`/root/.r2*`), not in repo.

## Flaws ranked (fix order)

1. **Prod stale (~655 claims, Tantraloka missing).** Regen `release_manifest --write` + `pages deploy`. Why first: everything else is local-only until shipped.
2. **Public scholar bundle stale (55 works, no Tantraloka) + bridge `AttributeError`.** Fix bridge runtime (older venv / pinned `mcp` SDK), green `passage_evidence` locally, then repoint tunnel per OWNER-DECISIONS D5b order. Until then ChatGPT reads nothing new.
3. **Biblio BLOCKED (555 vs 2051 DB).** Sync enriched DB dump, `emit_biblio + manifest`. Blocks Index tab + 2 node tests.
4. **G01 gate stale (chunk pages).** Allowlist `ipvv-chunk*` or count verse-claims only. 1-line.
5. **Tab views JS-only.** Pre-render Library/Scholar/Sanskrit/Practice snapshots (or SSR key routes) so no-JS + crawlers get content; claim pages already do.
6. **Box env gaps.** `node` symlink for bun-box tests; `R2_ENDPOINT` env wiring; `release-manifest` timeout 60s; fix `/usr/local/bin/wrangler` shebang or standardize on `bunx`.
7. **Feature-branch drift.** `scholar-projections-tantraloka-served` sits ahead of old base with 1 dirty file; main advanced 75 commits. Rebase or PR after deploy.

*No fabricated Sanskrit. No mass promotion. English stays labeled UNREVIEWED; holds stay withheld.*

## Correction (2026-11-16 ~04:00Z — branch confusion resolved)

The "prod stale" finding above compared the wrong trees. Re-measured per branch:

- `main`: 909 claim pages == 909 trace entries (G01 GREEN), sitemap 1963 urls — **identical to prod** (1963). Prod is current with main, not stale.
- `feature/scholar-projections-tantraloka-served` (and PR #48 `bridge/claim-coverage-2026-11-14`): the 2621-trace / 2684-page / 37-Tantraloka world. Its 63 extra pages are `ipvv-chunk*` overviews without trace bundles — the coverage branch must emit chunk traces or drop those pages before G01 goes green there.
- PR #48 state: `CONFLICTING` + Reader-integrity CI `FAILURE` (2026-11-14). Unmergable as-is — conflict resolution + green CI first (bridge lane), then deploy carries Tantraloka live.
- G01 needs no change on main (chunk overviews HAVE traces 1:1 here). Do not apply a chunk exclusion to main — it would break the count.
- Bridge (trika-x `tools/mcp_bridge.py`): py3.14 `Union.model_validate_json` failure reproduced; fixed on trika-x branch `fix/mcp-py314-union-compat` (TypeAdapter shim). Bridge now lists 95 tools; `param-p01-v01` returns real Sanskrit; `tal-a01-v01` correctly reports no projection (coverage gap, not a bridge bug).
