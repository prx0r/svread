# RESOURCES — complete inventory + the autonomous scholar loop

Status: living note, 2026-11-05. Every entry is on this box or one fetch
away. Secrets are referenced by path only, never by value.

---

## A. Your own philosophy corpus (the priority estate)

| Resource | Where | What |
|---|---|---|
| **awesome-essays** | `visuals/outputs/awesome-essays-extracted/` (1,195 files) | Your essays/sessions/fragments. **`INDEX.md` = 90 hand-read, 10 categories**: I Frontier arc (14: frontier→finalword×3→everything wrong→researchprop) · II Inexternalism & Recognition (13: siobserver, am0, truth* dossier, monismmania) · III Logicvid era (12: logic5-7, logicframework×2, tetraproof, logicdog) · IV Proclus/Iamblichus (proclusss 76KB, procluselements, iamblichustheurgy) · V Checkpoints · VI Abhinavagupta & Tantra (14 incl. Tantrasāra slang editions) · VII Buddhism (nibbana/samsara/rebirth/jhana) · VIII Consciousness science (qrii, ctmu, valence, ocheeema) · IX Comedy/video · X Diaries. 508 top-level files are new vs research-library |
| **research-library** | `damn/research-library/` (mirror `projects/`, ~900 files) | The categorized estate: `recognition/` (aperture/, pushing/, pushing-ipvv/, pushing-tantraloka/, books/ Ratié+Torella, r2-audio-transcripts), 7-fold model, 5-stage lens, commentaries, confrontations |
| **Essay kits (methodology)** | `…/gochema/essays/` (18 kits) | STRUCTURE (owner verbatim locked) · ACQUIRE (fetch list) · WEAVE (verbatim quote bank) · PUSHBACK (agent-vs-agent destroy pass) · ESSAY (citation-verified, voice-mix counted) · STORYBOARD. `what-is-jhana` complete; `rebirth-explained` peer-reviewed v1.2 |
| **Philosophy archive** | `visuals/outputs/extracted/original-philosophy-archive/` (1,933 files) | ipvv 811 · gochema 418 · sanskritree 396 (Lean proof_engine, RESEARCH_PROGRAMME — unique on box) · checkpoints 305 · recognition.pdf + expansion-essay-pack JSON |
| **IPVV site essays** | `ipvv/site/data/essays/` (22, live) | The magnum-opus set (ultimate-proof, felt, C-razor, advaita/buddhist…) — already on the site, also in the archive (dupes) |
| **Tension essays** | `nibbanahelp/essays/`, `tantraessays/` (213 md) | Speakable personal essays; Dyczkowski lecture essays with verbatim clip IDs |

## B. Canon & translation (the evidence spine)

- **translation-work**: 86 chunk ledgers (860 passages), 22 hash-pinned
  Scholar projections, tantraloka a01–a37, paramarthasara (L4 DRAFTs),
  GATE.json per work, proofs, `scholar/` ledgers.
- **Tantrasāra slang editions (NEW, gold)**: `awesome-essays/tantrasara1…22`
  (~1.3MB) + `shivasutrasfinal` (378KB) — the slang-retelling chapter source
  the video factory's PIPELINE expects; also the conversational register for
  chat mode. Not present anywhere else on the box.
- **prx0r/tantrasara** (remote): video factory — essay0/rungs canon,
  storyboards, approvals, render plan, 22 chapters green.
- **openpatala** (`/root/openpatala`, prx0r/openpatala): the identity &
  provenance layer — 1,099 works (GRETIL/Sanskritree/Archive.org/Crossref/
  PANDiT/OpenAlex/Muktabodha adapters), 247 assertions, Merkle event
  ledger, witness→surrogate→transcription ladder, R0–R5 resolver, FastAPI
  18 endpoints + MCP server. Verified: 6 proofs, 26 gates, red-team 4/4.
  Knows tantrasara/paramarthasara/tantraloka. Next: Phase 1.1 gold work
  dossiers (DEV-PLAN). Bridge to our chunk ledgers = Treeka's root.
  Durable mirror: `patala` R2 bucket → `projects/openpatala/snapshots/
  2026-11-05/` (tar.gz + manifest, sha256 round-trip verified).
- **ipvv work dir** (`translation-work/ipvv/`, imported 2026-11-05): the
  flagship IPVV as a canonical work — passages (49, locator-normalized,
  vol/line ranges), 49 frozen T1 + 14 detail, 35 l0 reports, 49 L2 data rows,
  49 published bundles (byte-spans into M00020/21/22), pilot 109 (L2 reads +
  argument maps), CL-3 themes, GATE = PROOF_NOT_RUN (honest). Source volumes
  sha-pinned in STATUS. **`translation-work/IPVV-IMPORT.md` = the flag doc**
  (every recipe for the gold lane: intake spans → L0 contract → proofs →
  emit → Scholar edits/L3/L4). Projection registered on the hub
  (`data/scholar/ipvv.json`, 49 withheld until proofs). R2 staging:
  `/root/ipvv-r2-staging/` (150 MB).
- **svread**: reader + projections + pushing catalog (57) + release manifest
  (309 assets, hash-gated) + PUSHING-LAB (crux briefs, essay seeds).

## C. Indexes & retrieval (find anything fast)

| Index | Size | Access |
|---|---|---|
| Semantic search | 1,102 vectors, 22 works (bge-m3, gate+license labeled) | MCP `search_texts`; rebuild: `tools/build_search_index.py` |
| Essay starters | 779 (1,177 with philosophy archive) | `essay_starters.py index`; glossary 300 proposals → 40-item review queue; anchor coverage per starter |
| Shared language | 60 tensions (3 personal + 57 cruxes), all IDs resolvable | `lingua.py` + MCP `resolve_ref`/`ref_links` |
| Themes | clusters + adjudications (CL-3 certificates) | MCP `text_themes` |
| nibbanahelp corpus | 1,895 items (vectors + index) | tension.py / chat relay |
| Style/decisions | glossary terms, edit pairs, lexical grounds | Scholar API (consent-gated per request) |

## D. Pipelines & tools (what actually runs)

- **Scholar P0**: `scholar_apply` (replay your glossary anywhere, live),
  `scholar_memo` (proactive memos; pm2 `scholar-memos` cron */30, local
  output), `essay_starters` (index/glossary/anchor), `build_search_index`,
  `audit_draft` (verbatim-quote + marker + external-ref gate, content-hash
  receipts), `zenodo_publish` (bundle proven, publish needs token),
  nibbana `resolve.py` (tension→essay→video packs, 4 forms).
- **MCP: 30 tools** — evidence, documents, reviews, signoffs, decisions,
  style, search, themes, audit, resolve/links. Local stdio, gate-labeled.
- **Qwen text: LIVE** (5/day/account, 20 global; secrets set; grounded
  answers proven). **Voice: built + wire-proven** (worker relay 101 both
  paths, public `dashscope-intl` endpoint accepted, session.created/updated
  observed; essay-context consent path unit-tested; browser session not yet
  observed end-to-end).
- **sanskritbench** (`/root/sanskritbench`, prx0r/sanskritbench): the
  VERIFY pillar — gold control (`sanskrit_gold.py`: 5,601 exemplars + Mitrasāmgraha
  5,552 + IPVV 49 + frontier Sāmayik 2,417 / Itihāsa 11,721 + MQM annotation),
  deterministic proof gate (SOURCE_BINDING/COVERAGE/ABSTENTION/TERM_CONSISTENCY/
  CITATION_GROUNDING — the lineage of translation-work's GATE.json), COMET-vs-chrF
  meta-eval with Kendall's tau (WMT protocol), `experiment_lab` + `run_recorder`
  (content-addressed logged runs), lemma spine (ByT5 + Vidyut → school/period
  sense → persona LoRA), Hermes skills/goals/kanban gates. Status: foundation
  DONE; Phase 1 = tau table (no GPU, free models) pending.
- **Publish chain**: signoff → HMAC bridge → git branch → merge → emit →
  manifest → deploy. First published essay live (cc-by-4.0).

## E. Video & render

tantrasara factory (remote, chapter pipeline) · aoc slideshow (gated,
receipted) · parables P1 (33 packages, seeds 801–848) · sleepdraw journeys ·
pack contract (`read|comic|parable|diagram`, evidence fail-closed).

## F. Accounts, models, gates

- Accounts: editorial + reviewer (`/root/.scholar/endgame-accounts.json`, 0600).
- Models: CF Workers AI (bge-m3, llama, mistral — free), Qwen DashScope
  (key `/root/.scholar/dashscope_key`; quotas 5/20), ox-alpha-free (weekly).
- Infra: pm2 (scholar-bridge, scholar-bridge-tunnel, scholar-memos), CF
  tunnels, R2 audio, D1.
- **Blocked (owner-side)**: Zenodo token; ORCID app; Qwen voice browser
  session; websearch Tier-4 primitive; glossary review queue (40 terms).

---

## Endgame reading folder (agent entry point)

`endgame/` — collated high-level docs for any agent: vision (CORE-BIBLE, INDEX,
endgame2, V06/V07, essayguide, live-stack review) + openpatala overviews +
sanskritbench VISION/GOALS/HOW-IT-WORKS, with `endgame/README.md` as the map
(roles, reading order, the pristine-foundation invariant). Byte-identical
snapshots; sources stay authoritative.

## THE AUTONOMOUS SCHOLAR LOOP — "AI is the scholar"

Every stage below maps to something that exists. The human holds one lever:
the signature.

```
1. CRUX MINING      pushing catalog + argmap unresolved + contentions +
                     literature (awesome-essays INDEX categories) → open questions
2. STRUCTURE        owner brief locked verbatim (kit law) → the question is yours
3. ACQUIRE          search_texts + evidence API + ACQUIRE fetch list → banked sources
4. DRAFT            Qwen assist + glossary replay + your style pairs → draft with
                     provenance fields (assisted/model/agent_source)
5. WEAVE            quote bank: every claim verbatim-checked (audit_draft enforces)
6. PUSHBACK         agent-vs-agent destroy pass → resolution + honest remainder
                     [kit method; our audit covers markers/quotes — full pass = next]
7. SCIENCE BRIDGE   Tier-3 crossover leads (memo compiler: qrii/ctmu/valence…);
                     Tier-4 external = pending websearch primitive
8. THESIS/DISPROOF  truth-packet spec exists (premise→inference→strength→falsifier);
                     comparative pushing matrix = the theses builder
9. AUDIT + SIGN     content-hash receipt + signoff + git identity = the signature
                     chain (who/what/rights/checked-by)
10. PUBLISH → VIDEO bridge/release live; Zenodo dry-run proven (token pending);
                     packs → slang editions → tantrasara factory
```

The loop is not "AI writes and we post." It is: AI runs 1,3,4,5,6,7,8
relentlessly (finding cruxes, checking science, disproving its own drafts),
the audit refuses anything unverifiable, and the human signs. That is why
the scholar is replaceable and the signature is not — which is exactly the
system you built.

### Ranked next wirings
1. Slang editions → video factory chapters + chat conversational register.
2. awesome-essays → permanent essay-starters root, INDEX categories as topics.
3. PUSHBACK pass as a CLI/MCP stage (full destroy pass before human review).
4. Voice browser session + research-while-talking toast flow.
5. Zenodo token → first DOI.
6. Tier-4 websearch primitive (URL+hash+date, never cited as canon).
