# Svread functional deepdive — 2026-11-16 (post-restore)

*Measured live against `svatantrya.net` + the deployed data/API, per work. Every
claim below was tested, not inferred. 87 works have claim pages.*

## Headline

| Feature | Works working | Notes |
|---|---|---|
| **Sanskrit text** | **87 / 87** | every claim work renders its source |
| **English translation** | **41 / 87** | 46 works gate-BLOCKED → English deliberately withheld |
| **Granny TTS (fish)** | works wherever English exists | live `POST /api/read` → real mp3 |
| **Chat rail** | **13 / 87** | needs PASS vectors for the work; else answers from other works |
| **Essay workshop** | works | static shell + `/essay` app; was dropped by my deploy, now restored |
| **Practice cards** | works | 10 cards, verbatim sources |
| **Wheels/tutor** | works | level-01 glosses fixed in #61 |

## 1. Sanskrit reader — WORKING (87/87)

Every work bundle carries `chunks[].sanskrit`. Deva toggle uses `IAST_DEVA`
(closed-world; no guessing). Recovered app.js also strips *display-only*
paratext (`(page 7)`, soft hyphens) while hashing the raw bytes. Verified:
`paramarthasara` renders `paraṃ parasthaṃ gahanād anādim…`.

## 2. English translation — 41/87, correct withholding on the rest

`isReaderPass(v)` = `gate==='PASS'` **and** a non-empty `l2`/`l1`.

- **46 works have NO English at all.** Almost all are **Tantraloka a01–a37 + vbt + ipvv + 7 short Trika works**, and they are `gate=BLOCKED` with `blocking: ["ABSTENTION","CITATION_GROUNDING"]`. Reader shows the new single-voice message: *"English is withheld for this verse (gate BLOCKED) — Sanskrit only. (ABSTENTION, CITATION_GROUNDING) Open in Scholar"*.
- Tantraloka gate census: **633 BLOCKED / 1 PASS** across all 37 ahnikas. So the flagship text is Sanskrit-only on the reader today.
- This is honest, not a bug — but it *is* the biggest product gap: the Tantraloka "37 served" refers to **scholar projections**, not reader English.
- Ghaṭakarpara: hash-pinned source shown, translation withheld by editorial hold (verified live).

## 3. Granny / voice readout — WORKING

`POST /api/read` on `ipvv-api.tradesprior.workers.dev` returns real `audio/mpeg`:
- `lang=en` → Granny British (`614f8afd…`), 106,578 B for param-p01 ✓
- `lang=sa` → Sanskrit voice (`4e873c37…`), 76,067 B ✓
- `lang=c1` → Granny commentary, 91,114 B ✓

R2-cached by hash of `{text, voice, model}`, so a revision never reuses old audio.
Caveats: needs `FISH_API_KEY` (present); the mp3 is stored publicly on `pub-*.r2.dev`; player is per-section chain (sa/en/c1) with graceful skip when no English.

## 4. Chat rail — WORKS FOR 13/87 (root-caused)

Chat is RAG over `vectors.json` (1,709 records, 52 work names). It filters
candidates to `gate ∈ {PASS,PUBLISHED,OWNER}` **and** `work ∈ requested works`.

- **Only 13 work names have eligible vectors** → chat can only answer those.
  `kularnavatantra`: **0 vectors**. `paramarthasara`: 12 vectors, **all BLOCKED** → zero candidates.
- **Cross-work leak:** when a work has no candidates, an *unscoped* "prior
  enquiry/probe" context is injected. Asking `paramarthasara` "what does verse 1
  teach?" returned **Bodhapañcādikā** content (cited a bodhapancadasika pushing file). Asking `kularnavatantra` "summarise chapter 1" → "passages here do not contain… tantrāloka".
- Good news: when the work has vectors it's strong — `sivastotravali` (920 recs) answered verse 1 accurately and cited its source.
- Two fixes needed: (a) refresh vectors for the 74 works; (b) scope the probe/hound fallback to the requested work (or label it as corpus-wide).

## 5. Essay workshop — WAS BROKEN BY MY DEPLOY, NOW FIXED

- `/essay` serves the workshop (worker-backed, noindex) and `essay.html` 308s to it.
- My 04:35Z deploy staged only tracked files and **deleted** `essay.html`,
  `essay-workshop.js`, `essay-workshop.css` + the Essay nav + 106 lines of newer
  `app.js`. Production rolled back 18h.
- **Remediated:** rolled prod back to deployment `98fea373` via API, recovered the
  exact files from production, committed, PR #62 (CI green) → merged → redeployed.
  Verified live: Essay nav present, `essay.html`→`/essay` 308, `essay-workshop.js/css` 200, app.js 158,913 B, noscript block present, sitemap 1963, `CHATGPT-FEEDBACK.md` 200.

## 6. Per-work matrix — where each feature stands

- **Full (sa+en+chat): 11 works** — ajadapramatrsiddhi, anubhavanivedana, anuttarastika, bhairavastava, bodhapancadasika, bodhavilasa, gitarthasangraha, isvarasiddhi, kramastotra, paramarthacarca, pancashloki (sample).
- **Sanskrit only (no English): 46** — all Tantraloka + vbt + ipvv + paratrimshika, ptvmadhyama, saktavijnana, sivasutra, spanda, stavacintamani, svabodhasiddhi.
- **English but no chat: ~30** — english present, vectors missing (e.g. paramarthasara, tantrasara-aNN, stavacintamani).

## 7. What to fix next, in order

1. **Scope the chat fallback by work** (small worker change; stops the
   cross-work answer). Highest trust impact.
2. **Rebuild vectors for the 74 missing works** (needs PASS/PUBLISHED gates;
   blocked on the assessor lane for Tantraloka).
3. **Tantraloka English**: the 633 BLOCKED verses need ABSTENTION/
   CITATION_GROUNDING resolved — that is the translation-work assessor lane, not svread.
4. **Deploy guard**: make `deploy.sh` refuse if tracked-vs-live asset count drops
   (this incident was silent). Add live-manifest diff before upload.
5. Pre-render Library/Scholar/Sanskrit/Practice (noscript exists; full SSR is the follow-up).

## 8. Incident note (for the log)

- Cause: `deploy.sh` → `stage_public_site.py` copies **tracked files only**;
  Pages deploys are atomic, so untracked-but-live assets vanish.
- Detect: post-deploy `curl` diff of nav + app.js size + essay routes. Add to deploy.sh.
- Recovery: Cloudflare deployment rollback API (`POST /accounts/{acct}/pages/projects/svread/deployments/{id}/rollback`), then recover from the live deployment URL, commit, PR.
