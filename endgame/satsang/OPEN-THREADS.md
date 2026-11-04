# Satsang: open threads

Derived from the project audit of 2026-10-25 (Satsang section), updated the same day. Status: **NS** not started ·
**P** partial · **B** blocked · **AU** awaiting the owner · **IP** in progress · **done**. Close a line by moving it to
"Closed" with the date.

| # | Thread | Status | Next step |
|---|---|---|---|
| S2 | Sit player → main site Practise tab ("Sit with it (hands-off)") | **AU** | Owner says yes/no; if yes follow specs/SIT-PLAYER.md §6 (iframe or same-origin, `satsang-sit-end` logging). |
| S5 | PLACES-REVIEW decisions (Rigpa, ZCLA, Sivananda, Himalayan Inst., Shambhala, Satyananda, Triratna, Kripalu, SYDA, Española, SFZC, Kabbalah Centre, NKT, Monte Sahaja) | **AU** | Owner decides keep / annotate / drop per row. Section C (Diamond Way, Osho, Amma, Isha, Dhammakaya) needs sourcing first. |
| S6 | Captions for passages / jump-to-moment | **B** | YouTube blocks the sandbox and GitHub runners. Only route: owner's machine runs yt-dlp → private satsang-data (needs OK). |
| S7 | Passage embeddings 1,472 / 8,165 | P | `embed.py passages 90` loop (local, free), pack, eval. Low value until captions exist. |
| S8 | Why-lines for gold/strong talks | NS | One line per gold/strong clip; re-ingest. Cheapest search-quality win. |
| S10 | Rob Burbea: profile with 0 talks | NS | Source official talks (Dharma Seed / Hermes Amāra) as full talks + virtual clips. |
| S11 | Two lecture links without licence-registry entries | not verified | Run `app/tools/licence_gate.py` over all resource URLs; add evidence or hold. |
| S12 | Pa-Auk "Dependent Origination: Previous Lives" (unofficial upload only) | B | Find an official copy or leave out. |
| S13 | Next Series: consciousness transference (phowa) via SERIES-FORMULA | **AU** | Owner says go. |
| S14 | Domain switch to satsang.digital | **AU** | Owner sets Porkbun nameservers to Cloudflare, then `app/tools/switch-domain.sh`. |
| S15 | Google OAuth (GOOGLE_CLIENT_ID empty; claim-device untested live) | **AU** | Owner creates a Google client ID. |
| S16 | Crowd tally | P (code done 2026-10-25) | Anon votes + resonates now count (down-weighted); watch real volume; the cron (02:17 +07) fires (clip_stats `_job` row). |
| S17 | Atlas timeline / knowledge graph | P (prototype) | Decide: ship as a Traditions timeline view or park. |
| S18 | User curations / essays (ROADMAP 14) | NS | Needs moderation design + sign-in; park. |
| S19 | Topic review queues + LLM labelling (ROADMAP 13) | NS | Needs spend approval. |
| S20 | Visualisation cycles with deitybody (ROADMAP 15) | NS | Fold into /sit/ routines. |
| S21 | Gather phase 1 (ROADMAP 16) | NS | Park. |
| S22 | Qwen key (chat prose, realtime voice in /talk/) | **AU** | Key + spend approval from the owner; stays off. |
| S23 | Voice approval (Phonon Everly / Fish voice) | **AU** | Owner listens once. |
| S24 | More VBT / text → practice pipelines (Expand the Room, Catch the Gap, Sivananda pranayama, MN 10) | NS | Build as /sit/ pipelines. |
| S25 | Engine preview Worker near the 3 MB Free cap | risk | Move renders to R2/KV before adding more. |
| S26 | Teacher-page topic MMR; routines UI | NS | Routines UI folds into S2. |
| S27 | PLACES-TODO coverage + data quality | NS | Standing list in specs/PLACES-TODO.md; work top-down. Includes re-checking the 9 `details_unverified` places (PLACES-REVIEW D). |
| S30 | Discovery-batch flags (SES schools, Integral Yoga) | **AU** | Owner decides keep / annotate / drop (specs/PLACES-REVIEW.md section D); both are on the map with a place-level safety record. |
| S31 | No favicon: /favicon.svg 404s (static /place pages link it; index.html has none) | NS | Add a favicon to site/ (crawl flags it on static pages). |
| S32 | Enquiry lens index predates the 78 new places | NS | `sh deploy.sh search` if the lens should list them (lens held list now reads person red flags only). |
| S33 | Sivananda *Kundalini Yoga* (DLS) source map: passes 0–2 done read-only (189 sections, 23 runnable candidates, 59 rules; text private in satsang-data) | **AU** | Owner/teacher reviews `engine/sources/books/sivananda-kundalini-yoga/labels.tsv` tiers + REPORT.md conflicts, then pass 3 (first batch: sukha purvaka, nadi suddhi, bhastrika, suryabheda, ujjayi, bandhas, kapalabhati). Nothing compiled or deployed. |
| S34 | Chat leads 2026-10-26: Trika teachers/places done in ext-49 (2026-10-31); tulku + cosmology topics remain | NS | Topics "Tulkus & rebirth", "Buddhist cosmology / Tushita", "How to enter Trika" (notes/2026-10-26-trika-tulkus-cosmology.md). |
| S35 | Trika completeness follow-ups (ext-49 held list) | NS | Research Bhāskara, Maheśvarānanda, Sāhib Kaul, Jankinath Kaul "Kamal" (ishwarashram.in was 500), Kufayev/Baret circles; source Lakshmanjoo -> Jaideva Singh / Gnoli / Padoux edges or leave medium. |
| S37 | Phone crawl / screenshots blocked: headless Chromium gets 407 from the sandbox proxy | B | Find a proxy-auth route for puppeteer (or run tools/check/crawl-run.sh from the owner's machine); ext-49 used an HTTP check of 47 pages instead. 2026-11-05: tools/shots/shot-foryou-tensions.mjs LIVE=1 took live phone + desktop shots through the request proxy (puppeteer interception + node fetch); crawl.mjs could reuse that route. |
| S38 | Awakening algorithm (journal → urgency → For You; A→B contract) | **P** (slice 1 live 2026-11-04; tension blocks live 2026-11-05, wiser-web 2cfeb8a1) | Owner uses For You's tension blocks for a week and presses "This helped" / "Not this"; then phase 2 (urgent slots, owner-labelled eval, test 17). Gaps from private/foryou/eval-2026-11-05.md → content loop (S41). Optional ask to nibbanahelp: `/feed.json` + CORS on `/journeys.json`. |
| S39 | Content loop journal → essay → video → @svatantryart → For You | spec + run-001 files (2026-11-04) | specs/JOURNAL-TO-VIDEO.md. Owner: approval #1 on private/content-loop/run-001 outline; choose the essay lane home (ipvv proposed); say whether Satsang may ingest @svatantryart now (4 videos). ipvv-api MCP search/list_works return [] (tell ipvv's owner). |
| S40 | Featured tradition (Trika) on Watch, For You cold start, Teachers | done 2026-11-04 | Edit order/people in app/wisegraph/featured.json; build-featured.py drops safety-record people; a live phone screenshot is still blocked (S37), local screenshots of the same dist taken. |
| S41 | For You tension-block gaps → content-loop video requests | **AU** | Owner reads private/foryou/eval-2026-11-05.md §Misses (5 gaps, kept private because they mirror the journal) and approves which become requests. Non-live knots (anger, fear, grief, relationships, restless, sloth, illness) tuned lightly: tune when a journal brings them. |
| S42 | Journey ledger (nibbanahelp): journeys as tamper-evident signed blocks, PQ-signed witnessed checkpoints, no blockchain (prx0r/nibbanahelp specs/journey-ledger.md, f1f5847) | spec (2026-11-05), not built | Owner decides in nibbanahelp: go for v0 (hash chain + SSH Ed25519 over existing markdown, verifier script, no deps), deps for v1, wall opt-in. Satsang side when a ledger exists: vendor the pinned verifier, verify feed items itself, use witnessed time for recency, count only verified tension transitions toward outcome learning (specs/AWAKENING-ALGORITHM.md §4.1). |
| S43 | Shared account (satsang-auth, auth.tantrafiles.xyz) for Satsang + nibbana + body lab | **AU** (live 2026-11-05, satsang-auth ed224533, wiser-api 957754d5, wiser-web b75cba7d) | Owner: Google Cloud Console → Funnier OAuth client 50738620553-fq7m… → Authorized JavaScript origins += `https://auth.tantrafiles.xyz` (no redirect URI); or a new "Satsang" client (specs/SHARED-ACCOUNT.md §6). Then one real sign-in end to end (Satsang menu → hosted page → back; device-link sheet). nibbanahelp/deitybody: integrate only when their owner asks (snippet §5). Key rotation not built (§8). |
| S44 | Day-gated journeys (each day you post opens that day) | API MVP live, no page (2026-11-05) | Owner decides where the wall lives (nibbana white page vs Satsang page); crisis-hold release flow; witnessed checkpoints; E2E reveal protocol only if circles grow (specs/JOURNEYS-DAYGATE.md §3, §10). |
| S28 | "USER TODO: public repo wiser-open for mcp/" | probably moot | prx0r/satsang is public: confirm, drop, add `repository` to the discovery card. |
| S29 | Held claims (Sucitto / Kornfield / Ramdev roles, 21 medium teacher_of edges, 28 held texts) | P | Verification pass with sources. |

## Closed
- S36 Swami Shankarananda person-level safety record: owner said flag (2026-11-04). Record shankarananda-2015 (sources/ext-49-trika-complete/redflags-public.json; The Age 2015, Yoga Australia 2015, MPNews 2015, ABC 2021), held from gold/lens like Sogyal/Maezumi; swami-shankarananda-avg is a different person (Arsha Vidya, Dayananda line), left alone. wiser-web ea484597, wiser-mcp 0996b4d7.
- S4 Places discovery batch: regenerated (78) and merged 2026-10-25 as sources/ext-48-places-discovery (e47d10c, 6fcd7e9, 4ef3002, 0dde0cd); wiser-web 4faff2e7, wiser-mcp 058c53fc. 953 places.
- S1 Enquiry lens / search bar: shipped 2026-10-25 ~07:30 (satsang-search a0a6d033, wiser-web 244808a2).
- S3 Commit the sit player / engine work: committed 2026-10-25 (ce1ee78 engine, ffacc03 spec + release.sh); tests compile 110, t2p 43, sit 250, schemas 0 errors, practice-engine 813/813.

## Security (cross-project, owner action)
- Rotate the R2 key that sits in public prx0r/characters HEAD (Funnier); revoke the GitHub PAT pasted in chat and save a new one in the vault.
