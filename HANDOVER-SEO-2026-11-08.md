# HANDOVER — SEO/GEO build (svread + trika-x), 2026-11-08

**Read this first, then `SEO-GEO-PLAN-2026-11-08.md`, then run §7.** This file
is the "straight way in": what exists, what to build, exact files, exact
commands, and the traps that will bite you.

Owner context: domain is purchased **tomorrow**. Everything is built against
`SITE_ORIGIN` so cutover is one variable. Nothing here blocks on the domain.

---

## 0. One-paragraph state

The research is done (`trika-x/docs/AI-DISCOVERABILITY-2026-11-08.md`), the
execution spec is written (`SEO-GEO-PLAN-2026-11-08.md`), the existing emit
pipeline is inventoried, and **nothing has been generated yet**. 909 trace
bundles, 909 verify packs, 67 work bundles, 10 Sanskrit lessons and the
bibliography are all live on `svread.pages.dev`. What is missing is the thing
that makes us citable: **one pre-rendered HTML page per claim, with the
quotation, the status, and the hashes in the initial response.**

---

## 1. What already works (reuse it — do not rewrite)

| File | What it does | Reuse as |
|---|---|---|
| `tools/emit_traces.py` | Copies trika-x traces → `data/traces/`, verifies each, builds `index.json`, has `--check` | **Pattern for every emitter**: render dict → compare bytes → fail closed |
| `tools/emit_verify.py` | Builds `data/verify/<work>-<target>/` packs with `manifest.json` (verdict, assurance, caveats, artifacts+hashes) | **Source of truth for hashes on the claim page** |
| `tools/emit_discovery.py` | `llms.txt`, `sitemap.xml`, `robots.txt`, `data/pushing.json` | **Extend it** for claim pages + `SITE_ORIGIN` |
| `tools/emit_biblio.py` | `data/biblio.json` (works, formalized counts, inventory) | Counts for answer-first lines |
| `tools/emit_formal.py` | `data/formal.json` (REGISTERED theorems, gaps) | Formal status block |
| `scripts/release_manifest.py` | Hashes every asset; CI gate | **Regenerate LAST, every time** |
| `tests/wiring.test.cjs`, `tests/discovery.test.cjs` | Integrity assertions | Extend with SEO gates |
| `svread/.github/workflows/reader-check.yml` | manifest → node --check → node tests → MCP tests | Add `seo_check.py` here |

**Data contracts you will use** (all already on disk):

```
data/traces/index.json            count, verdicts, entries[{work,target,file,sha256,verdict,gaps,caveats,theorems,immutable_id}]
data/traces/<work>-<target>.json  chunk{}, source{bytes_sha256,bytes_present,edition,witness,verses},
                                  layers{<l>: {present,sha256,path,status}}, proofs{chunk_gate{status,deterministic_gate,blocking},song_proof{status}},
                                  formal{status,theorems[{theorem,tier,status,run_bound}]}, assurance{...}, verdict, verdict_scope, gaps, caveats, open_problems
data/verify/<w>-<t>/manifest.json verdict, verdict_scope, assurance, caveats, gaps, artifacts[{name,role,sha256,bytes}], how_to_verify, limits
data/<work>.json                  work, chunks[{chunk:"ajad-p01-v01", verses:"1", sanskrit, l1, l2, l3, l4, c1, argmap, gate, blocking, date}]
data/biblio.json                  works[], counts{}
data/formal.json                  entries{}, counts{}, scope_statement, gaps{}
data/traces/index.json            (see above)
data/release-manifest.json        assets[]  ← regenerate after ANY content change
```

**Critical ID mapping:** `data/<work>.json` chunks are **verse-level**
(`ajad-p01-v01`); trace targets are **passage-level** (`ajad-p01`). Join by
`chunk.split("-v")[0]`. Do not assume they are the same key.

---

## 2. The one thing to build first

**B02 + B03**: the claim page emitter. Everything else (JSON-LD, sitemap,
llms, chains, measurement) hangs off it.

### 2.1 Page spec — exact section order

`/claim/<work>/<target>/index.html`, pre-rendered, no JS. Order matters
because it is the citation surface.

1. **`<p class="answer">`** — ≤40 words. Verdict + limit. Wrapped in
   `Speakable`. Example:
   > *Tantrasāra 8.3 passes all deterministic checks. The kāñcuka count is
   > REGISTERED in a finite Lean model, with no per-declaration run bound. No
   > manuscript witness is verified: 0 corpus-wide.*
2. **The verse** — Devanagari + IAST in `<blockquote cite="…">`, then L2
   reading translation. (Quotation Addition — arXiv:2311.09735.)
3. **Claim table** — `claim | status | basis`, one row per proposition.
4. **What this does NOT establish** — 3–5 bullets. Always present.
5. **Verify it** — numbered steps: fetch manifest → sha256 each artifact →
   compare. Copy-pasteable.
6. **Hashes** — `<pre>` block: source sha, each layer sha, trace sha, pack sha.
7. **Chain** — link `/chain/<work>/<target>/` + inline assurance table.
8. **Cite this** — copy-paste citation with stable URL + date + version.
9. **Related** — prev/next claim in work, same-work index link.
10. **Provenance** — edition, licence, generated-at, tool version.

### 2.2 Emitter contract

`tools/emit_claim_pages.py`:

- reads `data/traces/index.json` + each bundle + each pack manifest +
  `data/<work>.json` + `data/formal.json`;
- writes `claim/<work>/<target>/index.html`, `.../index.md`, work indexes
  `work/<work>/index.html`, chain pages `chain/<work>/<target>/index.html`;
- `SITE_ORIGIN` from env, default `https://svread.pages.dev`, **strip trailing
  slash**;
- deterministic (sorted, stable ordering, no timestamps in output except the
  data's own `produced_at`);
- `--check` compares bytes exactly (copy `emit_traces.py` shape);
- `--dry-run` prints counts and writes nothing (agentmarkup CLI behaviour);
- fails closed on: missing trace, missing pack, missing work bundle, a hash
  that does not recompute, or a number not in `data/freshness`-equivalent
  source (see §5).

---

## 3. The 20 todos (copy into your tracker)

| # | Task | Files | Acceptance |
|---|---|---|---|
| B01 | Inventory (done) | — | this doc |
| B02 | Template exemplar | `claim/tantrasara-a08/tsa08-p03/index.html` hand-built | answer ≤40 words; passes `seo_check` |
| B03 | `emit_claim_pages.py` | `tools/emit_claim_pages.py` | page count == trace count; `--check` byte-identical rerun |
| B04 | JSON-LD | in emitter | every block parses; `reviewedBy: null`; `additionalProperty` carries assurance |
| B05 | Work indexes + breadcrumbs + prev/next | emitter | 0 orphans; ≤3 hops from `/` |
| B06 | `.md` mirrors + `rel=alternate`/`describedby`, llms v2, llms-full, ai-catalog | emitter + `emit_discovery.py` | every page has a mirror; `rel` tags present |
| B07 | Sitemap `lastmod` + robots + IndexNow + canonicals | `emit_discovery.py`, `tools/indexnow_ping.py` | sitemap set == page set; sitemap valid XML |
| B08 | `/about/`, `/cite/`, Organization/WebSite + `sameAs` | `about/index.html`, `cite/index.html` | entity fields consistent site-wide |
| B09 | `/chain/<work>/<target>/` | emitter | each row links a real artifact; hashes recompute |
| B10 | Honesty pass | emitter | `verdict_scope` + `assurance` + limits on every page |
| B11 | Freshness-gated stats | emitter | every number traceable to a data file |
| B12 | `tools/seo_check.py` (10 gates) | new | all 10 pass |
| B13 | `tools/geo_measure.py` | new | 50×3×2 run; host+URL metrics stored |
| B14 | Baseline run | `data/geo/baseline.jsonl` | baseline recorded before any change |
| B15 | `_headers`, `_redirects` | new | cache + 301 block ready (inert until domain) |
| B16 | `SITE_ORIGIN` both-origin test | emitter + CI | builds identical except origin |
| B17 | CI wiring + deploy | `reader-check.yml`, `deploy.sh` | live pages verified |
| B18 | agentmarkup-style `check`/`dry-run` | emitter | `--dry-run` writes nothing |
| B19 | FAQPage only where genuine | emitter | schema matches visible text |
| B20 | Final audit + push | — | full suite green |

---

## 4. JSON-LD (exact minimal shapes)

Claim page `@graph`:

```json
{"@context":"https://schema.org","@graph":[
 {"@type":["Claim","CreativeWork"],
  "@id":"{SITE_ORIGIN}/claim/<work>/<target>/#claim",
  "name":"<work> <target>",
  "text":"<answer-first sentence, same string as the visible block>",
  "inLanguage":["sa","en"],
  "isBasedOn":{"@type":"CreativeWork","name":"<edition>","sameAs":"<source url if any>"},
  "citation":{"@type":"CreativeWork","url":"{SITE_ORIGIN}/data/traces/<work>-<target>.json"},
  "dateModified":"<trace produced_at date>",
  "isPartOf":{"@type":"Dataset","name":"Svatantrya Reader trace corpus",
              "distribution":{"@type":"DataDownload","contentUrl":"{SITE_ORIGIN}/data/traces/index.json"}},
  "additionalProperty":[
    {"@type":"PropertyValue","name":"deterministic_gate","value":"<PASS|BLOCKED|UNKNOWN>"},
    {"@type":"PropertyValue","name":"witness","value":"UNPINNED"},
    {"@type":"PropertyValue","name":"formal_run","value":"UNBOUND"},
    {"@type":"PropertyValue","name":"review","value":"UNREVIEWED"},
    {"@type":"PropertyValue","name":"publication","value":"NOT_AUTHORIZED"}]},
 {"@type":"BreadcrumbList","itemListElement":[ … ]}
]}
```

Rules: `text` must be byte-identical to the visible answer paragraph (Google
penalises schema that doesn't match visible content). `reviewedBy` stays
`null` until a human signs. `Speakable` wraps the answer paragraph only.

---

## 5. The traps (these will bite you)

1. **`ORIGIN` was hardcoded** at `tools/emit_discovery.py` (**fixed**: reads
   `SITE_ORIGIN`; the note stays because any new emitter must do the same)
   (`https://svread.pages.dev`). Replace with `SITE_ORIGIN` env before doing
   anything else, or every canonical/sitemap/llms URL is wrong after cutover.
2. **`tests/wiring.test.cjs` asserted `svread.pages.dev`** (**fixed**: reads
   `SITE_ORIGIN`) — any new origin assertion must do the same.
3. **`llms.txt` stale count — FIXED 2026-11-08.** It used to say "13 chunks";
   it now derives 909 + the COMPLETE/PARTIAL split from
   `data/traces/index.json`. Keep it derived — this is the class of bug the
   project exists to prevent.
4. **`discovery.test.cjs:42` asserts exactly 10 lesson URLs.** Adding claim
   pages is fine; changing lesson count is not.
5. **`release_manifest.py` must run LAST**, after every content change, or
   `reader-check` fails at the manifest step. We lost an hour to this once.
6. **`emit_biblio.py --check` needs psycopg2 + the box DB**; CI skips it by
   design (`tests/wiring.test.cjs`). Don't "fix" the skip.
7. **Passage vs verse ids** (§1). Join on `split("-v")[0]`.
8. **The trace hashes the passage excerpt, not the whole verse.** `source.bytes_sha256`
   covers the ledger's `sanskrit` string. Do not tell a reader the hash covers
   the full sūtra. This is the PR #7 span caveat — it is still open upstream
   (`phrdaya` labels 1–4 sūtras, holds one). Say "passage excerpt" in the
   hash block.
9. **`data/<work>.json` only exists for 67 works**; 909 traces are spread over
   87 works. Where there is no work bundle, quote nothing and link the reader;
   never fabricate a translation string.
10. **No numbers from nowhere.** Every count in prose must come from
    `biblio.json`, `formal.json`, `traces/index.json`, or `freshness.json`
    (trika-x). If you cannot cite the file, do not write the number.

---

## 6. Commands

```sh
cd /root/svread

# build (once B03 exists)
python3 tools/emit_traces.py            # traces from trika-x
python3 tools/emit_verify.py            # packs
python3 tools/emit_biblio.py            # needs DB (skips in CI)
python3 tools/emit_formal.py
python3 tools/emit_claim_pages.py --dry-run   # counts only
python3 tools/emit_claim_pages.py             # writes claim/ work/ chain/
python3 tools/emit_discovery.py         # llms/sitemap/robots/pushing
python3 scripts/release_manifest.py --write   # LAST
python3 tools/seo_check.py              # 10 gates
node --test tests/*.cjs
python3 -m unittest discover -s mcp -p "test_*.py"
./deploy.sh
```

`deploy.sh` bumps `sw.js` cache, regenerates the manifest, and runs
`wrangler pages deploy`. Requires `CLOUDFLARE_API_TOKEN="$(cat /root/.cf-api-token)"`
(or it reads the file itself).

---

## 7. Do this, in this order (first three moves)

1. ~~Fix `SITE_ORIGIN` … dynamic trace count~~ **DONE 2026-11-08 (`cc847f5`)**:
   `emit_discovery.py` reads `SITE_ORIGIN`, `llms.txt` reports 909 chunks live,
   the wiring test is origin-aware. Traps 1–3 are now historical notes, kept
   because the *pattern* recurs.
2. **Hand-build B02**: one perfect claim page at
   `claim/tantrasara-a08/tsa08-p03/index.html` using the §2.1 spec and real
   values from `data/traces/tantrasara-a08-tsa08-p03.json` and
   `data/verify/tantrasara-a08-tsa08-p03/manifest.json`. Deploy it. Look at it
   in a browser with JS disabled. It must read perfectly without JavaScript.
3. **Write `emit_claim_pages.py`** from the B02 template; generate all 909.
   `--dry-run`, then real, then `--check`. Then sitemap + IndexNow (B07) and
   the 10 SEO gates (B12). Deploy.

After that: `/chain/` pages (B09), entity pages (B08), agent lane (B06),
measurement baseline (B13/B14) — in that order, because each depends on the
previous.

---

## 8. Domain cutover (tomorrow, ~20 min)

1. Verify pages.dev build is green and live.
2. Buy domain → Cloudflare Pages → add custom domain → wait for cert.
3. `SITE_ORIGIN=https://<domain> ./deploy.sh` (all canonicals/sitemap/llms
   regenerate from that one variable).
4. Add `_redirects`: `https://svread.pages.dev/*  https://<domain>/:splat  301`.
5. Search Console: add the **domain property** (DNS TXT), submit sitemap,
   URL-inspect + request indexing for `/`, `/about/`, and one claim page.
6. Bing Webmaster: verify, submit sitemap, IndexNow key file at `/{key}.txt`.
7. Verify: `curl -s https://<domain>/claim/tantrasara-a08/tsa08-p03/ | grep -c "answer"`
   and `curl -s https://<domain>/sitemap.xml | grep -c "<loc>"`.
8. Re-baseline measurement under the new hostname.

Guard: `seo_check.py` must fail if any page contains a hardcoded origin that
is not `SITE_ORIGIN`.

---

## 9. Definition of done (the whole build)

- `curl -s <claim url>` (no JS) returns the claim, the quotation, the status,
  the limits, the hashes, and the verification steps.
- `tools/seo_check.py` is green and wired into CI.
- sitemap lists every claim; IndexNow pinged; robots allows the AI crawlers.
- Search Console shows the domain property verified and the sitemap accepted.
- A measurement baseline exists, and the first tactic experiment has a kill
  criterion.
- `data/release-manifest.json` is current and `reader-check` is green.
- No stale numbers anywhere: `grep -rn "13 chunks\|98%\|MODEL_CHECKED theorem"` returns nothing.

---

## 10. What authority we are claiming (and not)

We are **not** claiming "authoritative translations". We are claiming
**authoritative checkability**: every claim we publish names its source, its
gate status, its formal status, its witness status, and lets anyone recompute
the hashes. That is the unique, defensible position, and it is the only thing
a citation should say about us.

Sources for the tactics: arXiv:2311.09735 (GEO), 2607.14035 (survey),
2605.25517 (what gets cited), 2603.29979 (structure), 2604.25707 (absorption),
2610.15382 (ChatGPT citations), 2611.01126 (LIVE-GEO). Google AI features
docs; llms.txt v2. Full notes: `trika-x/docs/AI-DISCOVERABILITY-2026-11-08.md`.
