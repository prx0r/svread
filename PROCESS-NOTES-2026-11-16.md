# PROCESS NOTES — 2026-11-16 (how to do this work, repeatably)

*Durable operator notes from this session. Not a changelog — this is the
**procedure**: how to deploy safely, recover production, debug chat, rebuild
vectors, and verify the reader, plus the traps that cost time. Read with
`PROVE-EXPOSE.md` (canonical pipeline), `DEEPDIVE-2026-11-16-functionality.md`
(measured per-work state), and `CHATGPT-FEEDBACK.md` (what ChatGPT probes).*

---

## 0. The mental model (one paragraph)

svread is a **static site** (Cloudflare Pages, atomic deploys) backed by a
**Cloudflare Worker** (`ipvv-api`, chat/TTS/auth) and **R2 buckets** (audio +
vectors). Content flows one way: translation-work → trika-x traces →
`emit_*` → claim pages → `release_manifest --write` → staged deploy. Anything
not in git does not exist after the next deploy — and a deploy that drops live
files is silent. Every deploy must be followed by live verification (§2).

## 1. Deploy without regressing production

```bash
export CLOUDFLARE_API_TOKEN="$(agent-vault vault credential get CLOUDFLARE_API_TOKEN --vault oracle)"
./deploy.sh          # bumps sw cache, emit_index_meta, manifest --write, stage, wrangler pages deploy
```

`deploy.sh` now **refuses** when the staged tree is missing a critical asset
(`index.html`, `app.js`, `styles.css`, `sw.js`, `essay.html`,
`essay-workshop.js/css`, `llms.txt`, `sitemap.xml`, `ai-catalog.json`,
`_redirects`) or claim pages < 900. If it refuses, do NOT bypass — find the
missing file first.

**Post-deploy verification (always, ~60 s):**
```bash
curl -s https://svatantrya.net/ | grep -o '>[A-Za-z]*</a>'   # 7 tabs incl. Essay
curl -s -o /dev/null -w "%{size_download}\n" https://svatantrya.net/app.js
curl -s -D - -o /dev/null https://svatantrya.net/essay.html  # expect 308 → /essay
```

**THE #1 TRAP (cost us an 18 h rollback): atomic + untracked = silent deletion.**
Pages deploys replace the *entire* site. On 2026-11-16 a deploy staged only
tracked files and deleted live-but-untracked assets (`essay.html`,
`essay-workshop.js/css`, the Essay nav, 106 lines of newer `app.js`). There
was no error anywhere. The guard above exists because of this.

## 2. Emergency production rollback (Cloudflare API)

```bash
export CLOUDFLARE_API_TOKEN="$(agent-vault vault credential get CLOUDFLARE_API_TOKEN --vault oracle)"
ACCT="$(agent-vault vault credential get CLOUDFLARE_ACCOUNT_ID --vault oracle)"
# list recent production deployments first:
bunx --bun wrangler pages deployment list --project-name svread
# roll back to a known-good deployment id:
curl -s -X POST "https://api.cloudflare.com/client/v4/accounts/$ACCT/pages/projects/svread/deployments/<id>/rollback" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" -H 'content-type: application/json'
sleep 20   # then run the §1 verification
```

Rollback is instant and safe (2026-11-16: 90 s to green). **Then recover the
source**: the rolled-back deployment is the only copy of any live-not-in-git
file. Fetch each file from that deployment URL and commit it:
```bash
curl -sL "https://<shortid>.svread.pages.dev/app.js" -o app.js
```
Verify byte counts against the pre-rollback live state before committing.

## 3. Reader data model (what each feature reads)

| Feature | Reads | Gate |
|---|---|---|
| Sanskrit text | `data/<work>.json → chunks[].sanskrit` | always shown (closed-world, Deva toggle only) |
| English | `chunks[].l2/l3/l4` **iff** `gate==='PASS'` | `isReaderPass()`; else withheld UX with reasons |
| Chat | R2 `data/vectors.json` (worker `getVectors`) | only `gate ∈ PASS/PUBLISHED/OWNER` rows are used |
| TTS | `POST /api/read` (worker) → R2 `read-v2/…mp3` | key binds exact text+voice — revisions never reuse audio |
| Essay workshop | static shell + worker `/essay` app | `/essay.html` 308s to `/essay` (Pages normalisation) |
| Practice cards | `data/practice/cards.json` | verbatim, sourced — never doctrine |

**Withheld-English contract** (test-enforced in `tests/reader-integrity.test.cjs`):
`safeReaderVerse` strips all English fields from BLOCKED verses; `readUrlFor`
rejects with `withheld` before any fetch, so **blocked English never reaches
audio** (`calls === 0` asserted). Updating the withheld *message* is fine;
weakening the stripping is not.

## 4. Debugging chat (the recipe that found the cross-work leak)

```bash
# 1. what CAN this work answer with? (gate filter = what the worker sees)
python3 -c "import json; d=json.load(open('/tmp/vectors.json'));
print([r['id'] for r in d if r['work']=='<work>' and r['gate'] in ('PASS','PUBLISHED','OWNER')])"
# 2. probe the candidate filter directly:
curl -X POST https://ipvv-api.tradesprior.workers.dev/api/chat/<work> \
  -H 'content-type: application/json' -d '{"message":"<question>"}'
```

Root causes found 2026-11-16:
- **Unscoped probe/hound fallback.** Passage candidates were work-scoped; the
  "prior enquiry" probe and hound-verdict blocks were not. `paramarthasara`
  returned **Bodhapañcādikā** content. Fix: require the probe/verdict to name
  the requested work; add nothing otherwise (worker `src/index.js`, landed).
- **Stale vector gates.** `paramarthasara` had 12 records, all BLOCKED, while
  the bundles were PASS → zero candidates → only the (leaky) fallback spoke.
  Fix: rebuild vectors from the bundles (§5).
- A work with no PASS English (kularnavatantra: 0 vectors; Tantraloka: 633
  BLOCKED/1 PASS) **must** refuse — that is the assessor lane, not retrieval.
  The correct output is "no passages", never another text.

## 5. Rebuilding chat vectors (`ipvv/tools/build_svread_vectors.py`)

```bash
cd /root/ipvv
python3 tools/build_svread_vectors.py --dry-run   # counts first
python3 tools/build_svread_vectors.py              # embeds changed text only (bge-m3)
```

Rules baked into the builder (do not bypass):
- Source = `/root/svread/data/*.json` bundles (`chunks[].gate/english`).
- `data/holds.json` works are **never** answerable (ghatakarpara).
- Only `PASS/PUBLISHED/OWNER` rows are written — dead rows are ~45% of payload.
- Floats rounded to 6 dp (34 MB → ~11 MB); en/l3 truncated to 900 chars.
- **Pages has a 25 MB/file cap** — vectors live in R2 now:
  `pub-87169194562a44fcb8279a799d626c62.r2.dev/data/vectors.json`
  (worker `getVectors` reads R2 first, Pages as fallback).
- Env for embedding: `CF_ACCOUNT_ID` + `CF_API_TOKEN` from `/root/.r2-env`
  (or exported). ~1,000 embeds ≈ 50 bge-m3 calls at batch 20.

Upload + worker deploy:
```bash
bunx --bun wrangler r2 object put "svread-audio/data/vectors.json" \
  --file=site/dist/data/vectors.json --content-type=application/json --remote
cd worker && bunx --bun wrangler deploy        # ipvv-api.tradesprior.workers.dev
```

## 6. Worker deploys (ipvv-api)

- No `node` on this box — `bunx --bun wrangler …` throughout; `/usr/local/bin/wrangler`
  shim is broken (shebang), `bunx` works (`wrangler 4.129.0`).
- `bun build src/index.js` catches syntax errors before deploy (caught a
  duplicated `try {` on 2026-11-16 — esbuild's `Expected "finally"` means an
  unbalanced `try` above the reported line).
- `/usr/bin/python3` is 3.14: `mcp<=2.3` stdio breaks with
  `AttributeError: 'typing.Union' object has no attribute 'model_validate_json'`
  (verified `mcp==2.3.0` still broken). The trika-x bridge carries a
  TypeAdapter shim on branch `fix/mcp-py314-union-compat` — do not touch it
  from here; that lane owns it.

## 7. PR / CI workflow notes

- svread default is `main`; feature branches + PRs are the norm. CI =
  `Reader integrity` (`reader-check.yml`): index-meta check, manifest, seo,
  `node --test tests/*.cjs`, MCP unittest.
- **Box-only failures are environmental, not real:** node tests that shell to
  `node` fail here (no binary) and pass on CI; `bun test` default 5 s timeout
  kills the manifest/release checks (use `--timeout 120000`); `emit_traces`
  exceeds any sane box timeout — trust CI, verify targeted files locally.
- `measurement.test.cjs:62` expects **40** eval passages — the committed
  `ours.json` is the CI-compatible one. Regenerating on-box yields 49 and
  breaks CI. Do not "fix" by recommitting the 49.
- Post-deploy convention: a `chore/post-deploy-manifest-sw-*` PR (see #47, #58).
  `sw.js` cache strings and the manifest always drift on deploy — that is
  expected, not a bug.
- Convention for new static pages: pin them in `scripts/release_manifest.py`
  assets (lesson from essay.html) or the next staged deploy deletes them.

## 8. Numbers snapshot (2026-11-16, end of session)

- 87 claim works · 909 claim pages · 909 trace bundles on site
  · 55 scholar projections · 95 reader bundles.
- Feature coverage: Sanskrit 87/87 · English **41/87** · chat-eligible
  **26 work names** (was 13) · Tantraloka English 1/634 chunks.
- Translation pipeline (neighbour lane): burn T1 25.3k / L0 25.2k, queue ~2
  pending; 46 traced-but-unpublished works = PR #48 (CONFLICTING + CI red —
  needs rebase + 63 `ipvv-chunk*` orphans fixed).
