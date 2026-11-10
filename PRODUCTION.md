# PRODUCTION — Svatantrya Reader go-live manual (2026-11-10)

Living doc. How the whole estate fits, how to build/verify/deploy, what is
green, what is openly not done. Numbers below were measured on box
2026-11-10; reproduce with the commands given, never quote from memory.

## 1. The system in one diagram

```
openpatala (identity: work/edition/passage, UNPINNED valid)
  │  555 works · 909 passages · 102 editions · 87 etexts · 0 witnesses
  │  check.py GREEN · API :8821 · MCP 5 tools
  ▼
translation-work (evidence: T1→L0→argmap→L2→C1→L3→L4, sha per layer)
  │  101 works / 78 gold / 23 pending · TAL 22/37 · bridge 28 works/154 IDs BYTES_MATCH
  │  check.py: 20 proof-step FAILS (lane-owned harness bug, §7) — bridge output unaffected
  ▼
trika-x formal (theorem + prereg + must-fail twin + EVIDENCE + TABLE)
  │  157 theorems · 16/154 chunks (10%) · 0 Core/157 Frontier · axiom CLEAN
  │  94 tests OK · freshness SHARP · Lean receipts ab5dfcc/247d897 exit 0
  ▼
traces + verify packs (the moat: checkability without our code)
  │  909 bundles (236 COMPLETE / 673 PARTIAL) · 909 packs live
  │  emit_traces/emit_verify --check GREEN
  ▼
svread surface (this repo: reader + scholar + chat + claim pages)
  │  909 claim + 909 chain + 87 work pages · about/cite · llms(+full) · ai-catalog
  │  51 node tests green · 40 MCP tests green · seo_check 10/10 GREEN
  ▼
scholar MCP → essay (claims → audit → PUSHBACK → human sign; 33 tools)
  │  6 essays READY_FOR_HUMAN_REVIEW (all PARTIAL) · 7 review packets queued
  ▼
release → Zenodo DOI → factories (evidence_refs required; never without)
   Gates: 0 DOI yet (token = owner). R9 movies explicitly NOT YET.
```

Rule at every hop: bytes + hash + status + where-to-refetch, or it doesn't
ship. BLOCKED ≠ PASS. PARTIAL ≠ COMPLETE. R never promotes itself. No
auto-sign/publish/promote, ever. Lanes own their writes; trika-x/svread read
translation-work/ipvv/bookfactory/videofactory read-only (+ specs + CLAIMS).

## 2. Repos and what each owns

| Repo | Owns | Entry point | Health 11-10 |
|---|---|---|---|
| openpatala | identity root, resolver, API, MCP | `check.py`, `OPENPATALA.md` | GREEN + 2 recorded BLOCKED |
| translation-work | translation layers, gates, proofs | `check.py`, `RUNBOOK.md`, `HANDOVER-2026-11-07-MCP.md` | 20 proof-harness FAILS (§7); content + bridge GREEN |
| trika-x | formal models, traces, federation, essay gates | `DOCS.md`, `MASTERPLAN2.md`, `STATUS.md` | 94 tests OK, SHARP, 104-tool catalog SHARP |
| svread (here) | public surface, verify packs, claim pages, scholar UI | `SPEC.md`, `HANDOVER-SEO-2026-11-08.md` | 51 node + 40 MCP green, seo 10/10 |
| ipvv | scholar backend, pushing corpus, qp kernel | `HANDOVER.md`, `HANDOVER-PUSHING.md` | box/two-sources-v2, gate fix landed |
| sanskritbench | calibration metrics (advisory) | — | tau scale blocked (quota) |
| book/video factories | renders (draft + gated) | — | evidence_refs carry-through open |
| nibbanahelp | private diary/tension (consent-gated) | — | N1 exporter open |

Treeka (works → passages → argmaps → cruxes → essays + gap report) is the
read-only assembler over traces + `treeka.json`; the svread view is open work
(W5). Chunk↔verse map: 23 CLOSED / 64 OPEN (lane-side manifests needed).

## 3. Build order (dependency order, copy-paste)

```sh
cd /root/svread
python3 tools/emit_traces.py            # from trika-x (needs sibling checkout)
python3 tools/emit_verify.py            # packs (needs translation-work ledger)
python3 tools/emit_biblio.py            # needs DB (skips in CI by design)
python3 tools/emit_formal.py
python3 tools/emit_claim_pages.py --dry-run   # counts only
python3 tools/emit_claim_pages.py             # 909 claim + md + 87 work + chain
python3 tools/emit_discovery.py         # llms(+full), sitemap, robots, pushing, ai-catalog
python3 scripts/release_manifest.py --write   # LAST, after every content change
python3 tools/seo_check.py              # 10 gates
node --test tests/*.cjs
python3 -m unittest discover -s mcp -p "test_*.py"
./deploy.sh                             # wrangler pages deploy (needs CLOUDFLARE_API_TOKEN)
```

`SITE_ORIGIN` env (default `https://svread.pages.dev`, trailing slash
stripped) is the only place the hostname appears. Domain cutover = rebuild
with the new origin + `_redirects` 301 + Search Console/IndexNow submit.

## 4. The claim page (the product)

`/claim/<work>/<target>/`, pre-rendered, no JS. Ten sections in fixed order:
answer-first (≤40 words, Speakable) → passage excerpt as hashed (IAST;
Devanagari only from a pinned bundle, never transliterated by guesswork;
L2 withheld with explicit note when no reader bundle covers the passage) →
claim table (claim/status/basis) → what-this-does-NOT-establish (always) →
verify steps → hash block → chain table → cite-this → related (prev/next +
work index) → provenance (edition, ledger, tool versions). JSON-LD Claim
graph mirrors the visible answer byte-for-byte; `reviewedBy: null` until a
human signs. `.md` mirror per page; work indexes; chain pages.

## 5. Test evidence (2026-11-10, all logged)

- trika-x: 94 unit OK · evidence_check 157/155+2, 0 bad refs · table --check ·
  freshness SHARP · mcp_catalog 104 SHARP · federation pretest GREEN ·
  bridge 28/154 BYTES_MATCH · axiom CLEAN · essay_check 6/6 READY (PARTIAL,
  human gate) · essay_derive 6 PARTIAL 0 BROKEN · review 0 Core/157 Frontier.
- svread: emit_traces/verify/discovery/formal/claim_pages --check GREEN ·
  seo_check 10/10 GREEN (909==909, 0 broken claim/chain links, sitemap 1919
  urls) · node 51 pass 0 fail · mcp 40 OK · manifest 10,897 assets pinned.
- openpatala: check.py GREEN (4 PASS + 2 recorded BLOCKED) · API counts match DB.
- Red team: 20/20 probes in `trika-x/testing/` (logs T02–T19 + FINAL-2026-11-10):
  17 HOLDs (incl. 1-byte tamper caught, 8/8 twins refuse, 7 forgery tests fail
  closed, PUSHBACK raised a real objection without editing) · 3 named GAPs
  (phrdaya excerpt-as-span P0; sitemap/page-set until S02 — now closed by this
  build; MVV METACOMMENTARY + parsed-0, review pending).
- openpatala MCP: unknown tool → -32601, missing arg → -32602, dead child →
  FailOpen, parent stays up.

## 6. What is NOT done (do not let anyone reframe these)

Formal 10% (gap list ordered, phr-p05 head, prereg exists) · 0 Core (needs
second-encoder review + P-TK1/ti-ca/rater-2) · witnesses 0 (NGMPP eyes) ·
0 DOI (Zenodo token + DERIVED exemplar Q12 first) · bench tau scale
(quota/GPU) · Treeka svread view · Sanskrit slice · N1 exporter · C1–C4 ·
recipes R1–R8 consent paths · R9 movies NOT YET · Search Console/outreach/
inbound links · chunk-verse 64 OPEN · decision-trail ingest wiring.

## 7. Known defects (file:line, repro, owner)

1. **translation-work proof harness** `tools/proof_record.py:410` prints
   `decision trail: ...` to stdout after the JSON document; `check.py:83`
   `json.loads(r3.stdout)` then fails → all 20 proof-sXX report
   gate=UNPARSEABLE (content itself is PASS-with-disp or honest BLOCKED).
   Lane-owned one-line fix: print to stderr. Filed as lane ask; not touched
   from here (read-only rule). Bridge bytes consumed downstream are GREEN.
2. **MVV l0 parsed-0** (`origin/master` proof-mv-k03): `parsed: 0 /
   tokens: 1515` + METACOMMENTARY warning; machine-proposed, review pending.
3. **Disk 96%** (3.5G free): 1.2G reclaimable in `~/.cache` (playwright 924M
   + uv 307M) needs owner go per W0a; `/tmp` has live agent files — untouched.
   S01–S10 build needs ~50MB; deploy unaffected.
4. **Branch skew**: translation-work `box/decision-trail` vs `origin/master`
   (MVV) diverged both ways; ipvv `box/two-sources-v2` 1 ahead of master.
   Lanes dispose; no cross-merge from here.

## 8. Go-live checklist (today)

- [x] S01 exemplar + S02 emitter (909, deterministic, fail-closed)
- [x] S03–S05 indexes/JSON-LD/sitemap(1919)/robots/canonicals
- [x] S06 about/cite (+md mirrors, Organization + sameAs)
- [x] S07 llms-full/ai-catalog/md mirrors
- [x] S08 chain pages (+md)
- [x] S10 seo_check 10/10 + CI step + emitter in wiring test + manifest covers new tree
- [x] R4 footer links claim pages; ROADMAP R4 stale-note recorded
- [x] node suite re-run after app.js/test edits (51/0 FINAL; 51/0 FINAL-node2 post-deploy pending §9 log)
- [x] `./deploy.sh` + live curl checks (3,839 files; answer+hash no-JS ✓; sitemap 1919 ✓; about/cite/llms-full/catalog 200 ✓; prod 200 ✓)
- [ ] Search Console verify + sitemap submit + IndexNow (owner)
- [ ] geo_measure baseline (S09) before claiming any tactic works
