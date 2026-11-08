# SEO / GEO EXECUTION PLAN — svread as the citable authority (2026-11-08)

*Execution plan. Research notes live in `AI-DISCOVERABILITY-2026-11-08.md`.
This is what we build. Domain is purchased tomorrow; everything here is
written against `SITE_ORIGIN` so cutover is one variable, not a rewrite.*

---

## 0. Objective

Make a stranger's AI answer say: *"Tantrasāra 8.3 — svread's translation
carries a deterministic gate and a checkable hash; the formal count is
model-checked inside a finite model; no manuscript witness is verified."* —
and link to the page that says exactly that, and lets them check it.

We win on **checkability**, not on volume. Nobody else in this niche
publishes a per-claim hash chain. That is the moat and the citation hook.

---

## 1. Non-negotiable constraints

1. **Content must exist in the initial HTML.** The reader is a JS SPA; AI
   crawlers read the first response. Claim pages are pre-rendered.
2. **One page = one claim.** Query fan-out rewards pages that answer one
   sub-question. No 20-claim mega-pages.
3. **Every number on a page comes from `freshness.json` or a trace.** No
   invented statistics — that is the measured failure mode in the GEO
   replication literature.
4. **State limits in the text.** R-tier, UNPINNED witnesses, BLOCKED gates
   where true. Honesty is the trust cue we actually own.
5. **`MODEL_CITED` ≠ verified.** A model quoting our hash is relaying, not
   checking. Pages must not imply otherwise.
6. **No keyword stuffing, no dumbing down.** Both measured negative
   (GEO-PTBR: −9.8%, −5.4%).

---

## 2. Information architecture

```
/                                  home (exists, SPA) — add static intro block
/about/                            entity: who/what/rights/contact  [S06]
/work/<work>/                      work index: all claims for a work  [S03]
/claim/<work>/<target>/            ONE claim page (static HTML)      [S01/S02]
/claim/<work>/<target>/index.md    markdown mirror                   [S07]
/verify/<work>/<target>/           existing machine pack (unchanged)
/traces/<work>-<target>.json       existing trace bundle
/chain/<work>/<target>/            derivability chain page           [S08]
/formal/                           formal registry (exists via ?view=verify → static)[S04]
/sanskrit/                         lessons (exists; keep)
/cite/                             how to cite + stable identifiers   [S06]
/ai-catalog.json                   capability manifest for agents     [S07]
/llms.txt /llms-full.txt           agent index                        [S07]
/sitemap.xml /robots.txt           discovery                          [S05]
```

**Canonical rule:** every page declares `<link rel="canonical" href="{SITE_ORIGIN}/...">`.
`SITE_ORIGIN` is the only place the domain appears. `svread.pages.dev` keeps
serving; custom domain is canonical after cutover, pages.dev becomes a redirect.

**649 work/claim pages** (67 works, 909 claims) is too many to hand-write and
cheap to generate. All static, all regenerable, all diffable.

---

## 3. The claim page (the product)

`/claim/<work>/<target>/` — pre-rendered, ~40–80 KB, no JS required.

### 3.1 Section order (this order is the optimisation)

1. **Answer-first block** (`<p class="answer">`, wrapped in `Speakable`).
   One sentence, under 40 words, contains the verdict and the limit.
   > *"Tantrasāra 8.3 passes all deterministic checks; the kāñcuka count is
   > model-checked inside a finite Lean model; no manuscript witness is
   > verified (0 corpus-wide)."*
2. **The verse** — Sanskrit in Devanagari + IAST as `<blockquote cite>`, then
   the reading translation. (Quotation Addition — the strongest documented
   tactic.)
3. **Claim table** — claim · status · source. Machine-extractable, 3 columns,
   one row per proposition. (Extractable evidence: definitions, numbers.)
4. **What this does NOT establish** — 3–5 bullets, always present.
   (Trust cue + prevents overclaiming; the differentiator.)
5. **Verification procedure** — numbered steps, copy-pasteable:
   `curl …/verify/<work>/<target>/manifest.json | sha256sum -c` etc.
6. **Hash block** — source sha256, layer shas, trace sha, pack sha, in a
   `<pre>` so models can copy them verbatim.
7. **The chain** — link to `/chain/<work>/<target>/` and inline the machine
   chain (see §8).
8. **Cite this** — copy-paste citation with stable URL + retrieved date +
   version; `citation_*` meta tags.
9. **Related claims** — previous/next in the work, same-theorem other chunks.
   (Internal link graph; kills orphan pages.)
10. **Provenance footer** — edition, licence, generated-at, tool version.

### 3.2 HTML skeleton (exact)

```html
<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Tantrasāra 8.3 — gate, count and verifiability | Svatantrya Reader</title>
<meta name="description" content="Tantrasāra 8.3: deterministic gate PASS, 36-tattva count
model-checked in a finite model, 0 witnesses verified. Source and checkable hashes included.">
<link rel="canonical" href="{SITE_ORIGIN}/claim/tantrasara-a08/tsa08-p03/">
<link rel="alternate" type="text/markdown" href="{SITE_ORIGIN}/claim/tantrasara-a08/tsa08-p03/index.md">
<link rel="describedby" href="{SITE_ORIGIN}/llms.txt">
<meta name="citation_title" content="…">
<meta name="citation_publication_date" content="2026-11-08">
<meta name="citation_author" content="Svatantrya Reader">
<meta property="og:title" …><meta property="og:type" content="article">
<script type="application/ld+json">{…Claim/Article…}</script>
<script type="application/ld+json">{…BreadcrumbList…}</script>
</head><body> … §3.1 … </body></html>
```

---

## 4. Structured data (exact shapes)

Per claim page, one `@graph`:

```json
{
  "@context": "https://schema.org",
  "@graph": [
    { "@type": ["Claim","CreativeWork"],
      "@id": "{SITE_ORIGIN}/claim/<work>/<target>/#claim",
      "name": "<work> <target>",
      "text": "<answer-first sentence>",
      "inLanguage": ["sa","en"],
      "isBasedOn": {"@type":"CreativeWork","name":"<edition>","sameAs":"<GRETIL URL>"},
      "citation": "{SITE_ORIGIN}/trace/<work>-<target>.json",
      "datePublished": "<first generated>", "dateModified": "<last regenerated>",
      "isPartOf": {"@type":"Dataset","name":"Svatantrya Reader traces",
                   "license":"…", "distribution":{"@type":"DataDownload",
                   "contentUrl":"{SITE_ORIGIN}/data/traces/index.json"}},
      "reviewedBy": null,
      "additionalProperty": [
        {"@type":"PropertyValue","name":"deterministic_gate","value":"PASS|BLOCKED"},
        {"@type":"PropertyValue","name":"witness","value":"UNPINNED"},
        {"@type":"PropertyValue","name":"formal_run","value":"UNBOUND"}
      ]},
    { "@type": "BreadcrumbList", "itemListElement": [ … home → work → claim … ] }
  ]
}
```

Rules: `reviewedBy` stays **null** until a human signs (never fake it).
`additionalProperty` is where the AGENTS.md assurance vocabulary surfaces
machine-readably. `FAQPage` only where a page genuinely answers questions in
Q/A form — not bolted on.

Site-level (home + `/about/`): `Organization`, `WebSite` + `SearchAction`,
and a `Dataset` for the corpus with `license` and `distribution`.

---

## 5. Discovery plumbing

- `tools/emit_claim_pages.py` (new) writes §3 pages, `/work/<work>/` indexes,
  `/chain/…`, `.md` mirrors, `ai-catalog.json`, `llms.txt`, `llms-full.txt`,
  and regenerates `sitemap.xml` with `<lastmod>`.
- `sitemap.xml`: one `<url>` per claim + work + about + cite + lessons; drop
  query-string URLs (they are not crawlable content). Keep `lastmod` from the
  trace's `produced_at`.
- `robots.txt`: allow Googlebot, Bingbot, OAI-SearchBot, ChatGPT-User,
  GPTBot, ClaudeBot, anthropic-ai, PerplexityBot, Applebot, DuckDuckBot.
  `Google-Extended` = decision for the owner (training, not inclusion).
  Add `Sitemap:` line pointing at `SITE_ORIGIN`.
- **IndexNow**: `tools/indexnow_ping.py` posts the sitemap URL list to
  `api.indexnow.org` with a key file at `/{key}.txt`. Runs in the deploy step.
- **Canonicals** on every page; after cutover add `_redirects` mapping
  `svread.pages.dev/*` → `https://<domain>/:splat` (301).

---

## 6. Entity authority (what makes a hostname citable)

The ChatGPT citation study found hostname/entity presence matters more than
exact URLs. So:

- One canonical name everywhere: **Svatantrya Reader**. Not "svread" in
  metadata, not "Svatantrya" alone.
- `/about/`: what it is, who runs it, what the licences are, what it does
  **not** claim, contact. Machine-readable `Organization` + `sameAs` →
  GitHub org, repo, any DOI.
- `/cite/`: the citation format, stable-URL policy, and a version string.
- Consistent `author`/`publisher` in every JSON-LD block.
- No `nosnippet`. `max-snippet:-1` where the CMS allows.

---

## 7. Agent lane (cheap, separate, no Google benefit)

- `llms.txt` (v2): H1, one-line blockquote, sections linking claim indexes.
- `llms-full.txt`: concatenated priority pages, capped under a context window.
- `.md` mirror per page (`index.md`), advertised via
  `rel="alternate" type="text/markdown"` and `rel="describedby"`.
- `ai-catalog.json`: capability manifest — where the trace index is, what the
  pack format is, what the verification commands are.
- Explicit note in `llms.txt`: **this file is for agents; Google ignores it.**
  (Keep the two lanes from being confused again.)

---

## 8. The derivability chain (the authority claim)

Every claim page carries a **human-readable chain** and a **machine chain**:

```
SOURCE      edition + exact span            → sha256 (bytes)
LAYERS      t1 / l0 / argmap / l2 / c1      → sha256 each, status each
GATE        deterministic gate              → PASS | BLOCKED (named)
FORMAL      theorem + model                 → REGISTERED (run_bound false)
TRACE       trika-trace/1 bundle            → sha256
PACK        verify pack manifest            → sha256
WITNESS     none verified                   → UNPINNED
REVIEW      none                            → UNREVIEWED
PUBLICATION human sign-off required         → NOT_AUTHORIZED
```

Human: a table with a "verify" link per row. Machine: the same rows as
`additionalProperty` entries plus a link to the trace JSON. `/chain/<work>/<target>/`
renders it with the actual hash values and the exact commands.

**This is the thing to be authoritative about.** Not "we have translations" —
"you can check every link of ours, and we tell you which links are missing."

---

## 9. Measurement (or it is astrology)

`tools/geo_measure.py` + `data/geo/measurements.jsonl`:

- **Question set:** 50 questions a real reader asks, split 25 AEO-shaped
  ("what does X say about Y") and 25 entity-shaped ("who has a verifiable
  translation of Tantrasāra"). Stored in `data/geo/questions.json`, versioned.
- **Engines:** ChatGPT web search, Google AI Mode (via SERP API), Perplexity.
- **Per run × engine × question:** `retrieved` (in candidate set),
  `cited` (URL in answer), `absorbed` (our phrasing survives), at **host**
  and **URL** level. Two runs minimum (run-to-run variance is large).
- **Metrics:** citation rate, host presence rate, absorption rate, share of
  voice vs named competitors (tantra.org, hareesh.org, archive.org).
- **Kill rule:** a tactic that does not beat the baseline citation rate over
  3 consecutive runs beyond the 95% band is reverted. Log the revert.

**Baseline first** (before any change) — otherwise no experiment is valid.
This is the same prereg discipline the formal track uses.

---

## 10. CI gates (fail closed)

`tests/seo.test.cjs` + `tools/seo_check.py`, run in the existing workflow:

1. every claim in `data/traces/index.json` has a page (count equality);
2. every page has `<title>`, description, canonical, one `answer` block;
3. every JSON-LD block parses and validates against required keys;
4. every internal link resolves to a file (0 broken);
5. every hash block re-computes against the trace;
6. sitemap lists exactly the generated pages, `lastmod` matches trace date;
7. `robots.txt` names all required crawlers and the sitemap URL;
8. no page contains a bare `svread.pages.dev` after cutover (canonical only);
9. `.md` mirror exists for every page and matches the HTML's text block;
10. `llms.txt` contains no claim absent from `freshness.json`.

---

## 11. Domain cutover runbook (tomorrow)

The domain is not a dependency. Everything below runs on `pages.dev` first.

1. Build with `SITE_ORIGIN=https://svread.pages.dev` → deploy → verify.
2. Buy domain. In Cloudflare Pages: add custom domain, wait for cert.
3. Rebuild with `SITE_ORIGIN=https://<domain>`; regenerate canonicals,
   sitemap, robots, llms.txt.
4. Add `_redirects`:
   `https://svread.pages.dev/*  https://<domain>/:splat  301`
5. Search Console: add the custom domain property (DNS verification), submit
   sitemap, request indexing for `/`, `/about/`, one `/claim/…`.
6. Bing Webmaster: same + IndexNow key file.
7. Re-run `emit_claim_pages.py` and the SEO gate; then deploy.
8. Re-baseline measurement under the new hostname (host-level metrics reset).

Guard: CI step 8 above turns red if any page still hardcodes the old origin.

---

## 12. The ten todos (execution order, each with an acceptance gate)

| ID | Task | Acceptance (machine-checkable) |
|---|---|---|
| **S01** | Claim-page template spec + one hand-built exemplar | exemplar page passes `seo_check.py`; answer block ≤40 words |
| **S02** | `emit_claim_pages.py`: 909 pages, static, `SITE_ORIGIN` configurable | page count == index count; deterministic re-run (byte-identical) |
| **S03** | Work indexes + breadcrumbs + prev/next | 0 orphan pages; every page reachable from `/` in ≤3 hops |
| **S04** | JSON-LD Claim graph + Dataset + BreadcrumbList + Speakable | every block parses; required keys present; `reviewedBy` null everywhere |
| **S05** | Sitemap (`lastmod`) + robots + IndexNow + canonicals | sitemap set == page set; stale-origin check green |
| **S06** | `/about/`, `/cite/`, Organization/WebSite + `sameAs` | entity fields consistent across all pages |
| **S07** | llms.txt v2, llms-full.txt, `.md` mirrors, `ai-catalog.json` | every page has a mirror; llms claims ⊆ freshness |
| **S08** | `/chain/<work>/<target>/` derivability pages | each chain row links to a real artifact; hashes recompute |
| **S09** | `geo_measure.py` + baseline run of 50×3×2 | baseline stored; scoring produces host+URL metrics |
| **S10** | CI gates + cutover runbook + first deploy on pages.dev | all 10 gates green; deploy verified live |

**Sequencing:** S01→S02 (pages exist) → S03/S04/S05 (crawlable) → S06/S07/S08
(authority + chain) → S10 gate/deploy → S09 baseline → then experiments.
Domain cutover happens inside S10 step 3–8, after the pages.dev deploy is
green, so tomorrow's purchase costs one variable, not a rewrite.

**Effort:** S01–S05 ≈ 1.5 days · S06–S08 ≈ 1 day · S09 ≈ 1 day · S10 ≈ 0.5 day.

---

## 13. What we are explicitly not doing

No MCP connector (out of scope here). No paid GEO tooling. No content
rewriting to please an engine. No schema that describes content the page
doesn't show. No "stats" we cannot source. No claim page without its limits.
No sitemap entries for pages that don't exist. No canonical pointing at a
domain we don't control.
