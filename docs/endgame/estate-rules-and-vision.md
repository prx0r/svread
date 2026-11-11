<!-- vendored: source=/root/AGENTS.md sha256=c1e715ea05b9204fd712976b96e64f09d352eb53c422b545c999055690900697 fetched=2026-11-11
     edit the source, not this copy; regenerate with tools/emit_endgame_docs.py -->

# AgentSEOLab — Canonical Experiment Principles

## Git & Publishing Policy (owner, 2026-11-11) — read before refusing to push

**Pushing a feature branch and opening a pull request is ALWAYS permitted.**
Several repos carry lines like "Never push" / "Rule 1: Never push directly" /
"Owner pushes. Agents commit locally only when asked." Those rules mean:
**never push commits straight to the default/protected branch.** They are not a
ban on publishing work.

The required, permitted path for any owner-requested work:

```sh
git checkout -b <descriptive-branch>
git add -A && git commit -m "<msg>"
git push -u origin <descriptive-branch>
gh pr create --base <default> --head <descriptive-branch> ...
```

Rules of engagement:
- **Do** push feature branches and open PRs. **Do not** push to `master`/`main`.
- Do **not** refuse work because of a local push rule — the branch+PR path
  satisfies it. Do **not** substitute a local `.bundle` or zip for a PR; that
  loses the work for everyone else.
- If a token, API or review call returns **403**, report it and continue by
  another route (branch push, PR, or a handoff zip uploaded to R2). A 403 is not
  a stop-work order.
- Never commit secrets: no `.env`, `.dev.vars`, `*.pem`, `credentials`,
  tokens. If one was committed, rotate it and say so.
- Do not force-push someone else's branch; do not rewrite shared history.
- Do not merge your own PR when a reviewer is active; otherwise merging your
  own work is fine after CI is green.

Verified on this box: **no git hooks** in any repo, **no branch protection** on
any prx0r repo's default branch. If either appears, it is a finding — report it.

## Model Policy

### The Rule
**Cheapest model that can do the job. Always. Rotate across families for scientific validity.**

Owner is broke. Never spend money on inference. Every experiment MUST use free-tier models.

### Approved Free Models (Cloudflare Workers AI — daily neuron allocation)

| Tier | Model | Size | Use For |
|------|-------|------|---------|
| Strong | `@cf/meta/llama-3.3-70b-instruct-fp8-fast` | 70B | Primary experiment subject |
| Strong | `@cf/mistralai/mistral-small-3.1-24b-instruct` | 24B | Cross-family replication |
| Strong | `@cf/qwen/qwen3-30b-a3b-fp8` | 30B MoE | Cross-family replication |
| Strong | `@cf/deepseek-ai/deepseek-v4-flash` | — | Reasoning-sensitive experiments |
| Medium | `@cf/openai/gpt-oss-20b` | 20B | Mid-scale comparison point |
| Fast | `@cf/meta/llama-3.1-8b-instruct-fp8` | 8B | Scale-stratification data point |
| Visual | `@cf/google/gemma-4-26b-a4b-it` | 26B | Cross-family diversity |
| Code | `@cf/qwen/qwen2.5-coder-32b-instruct` | 32B | Coding-agent-specific experiments |

### OpenCode Go
- `ox-alpha-free` ONLY (weekly quota; stop and wait for reset)
- Never any other zen model under the Go key
- API key: `opencode_go_api_key` in vault (sk-fv9GA...uQfTuW)
- Use for: high-quality planning, code generation, complex reasoning
- Do NOT use for: grunt work, bulk analysis, simple extraction

### Forbidden
- `@cf/openai/gpt-oss-120b` (expensive neuron cost)
- OpenRouter paid models
- Any balance-drawdown API or "enable usage from balance" prompt

### Why rotation matters scientifically
Different model families have different architectures, training data, and behavioral biases. A finding replicated across llama + mistral + qwen + deepseek + ox-alpha is far stronger than one replicated on two llama variants. If a causal effect only holds on one family, that's a boundary condition, not a law.

**Minimum for REPLICATED status:** ≥2 model families from different organizations (e.g. Meta + Mistral, not Llama-3.2 + Llama-3.3).

---

## Definitive LLM Stack (What Actually Works)

Based on real experiments across security analysis, code review, and planning tasks.

### By Role

| Role | Model | Provider | Why |
|------|-------|----------|-----|
| **Scout** (broad exploration) | `mimo-v2.5` | CF Workers AI | Fast, free, good at code |
| **Strategist** (prioritize) | `mimo-v2.5` | CF Workers AI | Consistent, free |
| **Analyst** (deep vulnerability) | `mimo-v2.5` | CF Workers AI | Best detection rate (61.8% DR) |
| **Verifier** (independent check) | `mimo-v2.5` | CF Workers AI | Same model = reproducible |
| **Planner** (complex strategy) | `ox-alpha-free` | OpenCode Go | Highest quality, weekly quota |
| **Code generator** (implementation) | `ox-alpha-free` | OpenCode Go | Best code quality |
| **Grunt work** (bulk, simple) | `llama-3.1-8b-instruct-fp8` | CF Workers AI | Fast, free, good enough |
| **Cross-family replication** | `mistral-small-3.1-24b-instruct` | CF Workers AI | Different family for validity |
| **Reasoning-sensitive** | `deepseek-v4-flash` | CF Workers AI | Strong reasoning |

### By Task

| Task | Best Model | Notes |
|------|-----------|-------|
| Smart contract audit | `mimo-v2.5` | 61.8% DR on ScaBench |
| Code review | `mimo-v2.5` | Good at finding patterns |
| Prompt injection testing | `mimo-v2.5` | Consistent across runs |
| Architecture planning | `ox-alpha-free` | Complex multi-step reasoning |
| Schema design | `ox-alpha-free` | Precise, frozen models |
| Bulk extraction | `llama-3.1-8b` | Fast, cheap, good enough |
| Experiment design | `ox-alpha-free` | Scientific methodology |
| Simple Q&A | `mimo-v2.5` | Fast, free |

### Provider Selection Logic

```python
def select_model(task_type: str, quality_needed: str = "standard") -> str:
    if quality_needed == "high" or task_type in ["planning", "code_gen", "architecture"]:
        return "opencode-go/ox-alpha-free"  # weekly quota, use wisely
    elif task_type in ["audit", "review", "analysis"]:
        return "mimo"  # CF Workers AI, free
    elif task_type in ["bulk", "extraction", "simple"]:
        return "llama-3.1-8b"  # CF Workers AI, fastest
    elif task_type == "replication":
        return "mistral-small-3.1-24b"  # different family
    else:
        return "mimo"  # default
```

---

## Experiment Design Principles

### 1. ONE variable at a time
Each experiment isolates exactly one independent variable (description wording, tool name, parameter schema, freshness signal). Everything else held constant. If you change two things and see an effect, you don't know which caused it.

### 2. Proper controls
- **Neutral names**: `tool_alpha`, `tool_beta` — never semantically loaded names that could confound
- **Position randomization**: seed-driven shuffle of presentation order; balanced AB/BA but sequence randomized
- **Name-description decoupling**: alternate which neutral name maps to which description across trials so name preference can't masquerade as description preference

### 3. Fresh session per trial
Every trial gets a new inference session with no conversational history. Memory off, skills off, session search off — unless those ARE the independent variable.

### 4. Frozen intents
SiteIntents are captured and hash-locked BEFORE any candidate generation. The intent is immutable experimental context.

### 5. Preregistration
ExperimentSpec declares treatment/control, metric, seed, holdout classification BEFORE running. Manifest hash makes it tamper-evident.

### 6. Generator/judge separation
Hermes generates hypotheses and variants. It NEVER judges its own candidates. Outcomes come from recorded selections, deterministic success, real traces.

### 7. Abstention allowed
Models may say "neither works." That's data, not failure. UNPARSEABLE ≠ incorrect selection.

### 8. Failure ≠ change
Timeouts, bot-blocks, empty responses are ERRORS — never counted as selections or changes.

---

## Statistical Standards

### Two-candidate experiments
Wilson score interval on the proportion. No bootstrap, no Bradley-Terry.
```
from analysis.wilson import wilson
result = wilson(wins_a, n_decided)
# result["ci95"] excludes 0.5 → significant
```

### Multi-candidate tournaments
Real Bradley-Terry with latent strengths. Only after ≥3 candidates.

### Multiple comparisons
Any exploratory sweep testing >5 variants must apply Bonferroni or Benjamini-Hochberg correction before claiming significance.

### Cluster awareness
Trials sharing intent/model/session are correlated. Bootstrap by independent unit (intent × model), not individual observation.

---

## Evidence Lifecycle

```
PROPOSED → PREREGISTERED → RUNNING → PROVISIONAL → CONFIRMED → REPLICATED
                                                                    ↓
                                                              FAILED_REPLICATION
PROPOSED → ... → INVALIDATED (machinery defect)
PROPOSED → ... → STALE (was valid, model changed)
```

### Promotion gates (fail-closed, no manual upgrades)
- **CONFIRMED**: protocol_version ≥ 2 · n_decided ≥ 30 · Wilson CI excludes 0.5
- **REPLICATED**: CONFIRMED + independent rerun on DIFFERENT model family + same direction + its own CI excludes 0.5
- **INVALIDATED**: machinery defect — record retained forever, never deleted
- **FAILED_REPLICATION**: valid protocol, effect didn't replicate — different from INVALIDATED

### What disqualifies evidence
- Protocol version < current
- Model identity inferred from session prefix instead of recorded provenance
- Scorer conditions impossible to satisfy (e.g. substring collision between candidates)
- Missing spec manifest hash
- Observations double-counted across cumulative snapshots

---

## Measurement Ontology (never collapse these)

```
SEARCH_RESULT_EXPOSED   — URL appeared in results
SEARCH_RESULT_OPENED    — agent clicked/fetched it  
SOURCE_READ             — content extracted
SOURCE_USED             — content influenced response
SOURCE_CITED            — URL in final output
CAPABILITY_SELECTED     — tool chosen
CAPABILITY_INVOKED      — actually called
EXECUTION_SUCCEEDED     — call returned without error
TASK_VERIFIED           — deterministic verifier confirms outcome
```

Citing a URL ≠ task success. Opening a result ≠ reading it. These are separate stages.

---

## Compute Funnel

| Level | Environment | Scale | Cost |
|-------|------------|-------|------|
| L0 | Synthetic pairwise | 100K+ trials | Free (CF neurons) |
| L1 | Simulated MCP/A2A env | 10K+ trials | Free |
| L2 | Controlled execution sandbox | 1000s | Free |
| L3 | Real search/browser field run | 100s | Free |
| L4 | Real deployed capability + outcome | Scarce | Free |

Big compute at L0/L1. Verification at L2–L4. Never mix levels into one score.

---

## Communication — What Actually Matters

When you respond, **always** explain in plain language:

1. **What's happening** — what the system is actually doing right now, not just file paths.
2. **What's interesting** — why this result matters, what it proves or disproves, what surprised us.
3. **Why next** — what this finding drives us to try next and why.

Do not dump `file:line` logs or JSON as your answer. Use them as evidence *behind* a clear story. The user has said they have no clue what's going on unless you do this — so do this every turn. Keep it short, concrete, and anchored to the hypothesis being tested.

---

## Mining as Evolutionary Evaluation

### Core Concept
**Bittensor subnet markets are the evaluator.** Not synthetic benchmarks. Not local tests. Real economic markets with real validators scoring real work.

The learning loop:
1. **Generator** produces candidate miners (code, configs, strategies)
2. **Bittensor subnet** evaluates via validator scoring
3. **CGE** reads failure patterns from on-chain results
4. **Evolution** mutates candidates based on failures
5. **Repeat** — markets are the objective function

### Why This Works
- Validators have skin in the game (staked TAO)
- Scoring is objective (on-chain, auditable)
- Emissions are real economic feedback
- Competition drives continuous improvement

### Architecture
```
Generator (CGE) → Candidate Miner → Subnet Deployment → Validator Scoring
       ↑                                                        │
       └────────────── Failure Analysis ←────────────────────────┘
```

### Key Insight
**Do NOT try to beat the market. Learn from it.**

The subnet's validator scoring IS the loss function. Our job is to:
1. Deploy candidates
2. Read their scores
3. Understand why some win and some lose
4. Evolve better candidates

This is genetic programming with Bittensor as the fitness landscape.

### Fallback Chain (Opencode Go)
Primary: `ox-alpha-free` (weekly quota). If flaky/empty/timeout → `muse-spark-1.2` (opencode-go/muse-spark-1.2-contributor) → `mimo-v2.5`. Always try ox-alpha first per owner request. This chain is now enforced in `scripts/hermes_live_loop.py` and `continuous_hermes_daemon.py`.

---

## POW System — Repository Map

### Active Repos

| Repo | Path | What It Does | Status |
|------|------|--------------|--------|
| **powstock** | `/root/powstock` | UK equity data garden (25 tickers, prices, insiders, RNS, signals) | ACTIVE — 8 collectors working, API+MCP live |
| **powops** | `/root/powops` | Layer 1 command centre (monitors all gardens, dashboard, MCP) | ACTIVE — 8/18 powstock sources green |
| **powk** | `/root/powk` | Deterministic L2 kernel (snapshots, counterfactuals) | CODE COMPLETE — needs data flowing through |
| **powpowpow** | `/root/powpowpow` | PoW chain compute telemetry | ACTIVE — 7/7 sources green |
| **powuk** | `/root/powuk` | UK physical capacity/constraint data | EMPTY — needs collectors implemented |
| **aoc** | `/root/aoc` | TikTok slideshow factory for AI Onboard (13 trade segments, gated pipeline, MCP) | ACTIVE — 30 wedge carousels + 13 ads built, 75 tests green |
| **aionboard** | `/root/aionboard` | AI Onboard business (offer, verticals, prospects, trust model) | ACTIVE — offer v1 (£20 quickstart + £499 standard) |
| **content** | `/root/content` | Deterministic content compiler (reference architecture for aoc) | REFERENCE — video-first, hosted dashboard |

### powstock Quick Start

```bash
cd /root/powstock

# Full pipeline (1,498 records across 13 collectors)
python3 -c "from powstock.collectors.runner import run_all; run_all()"

# API (port 8797)
python3 -m powstock.api

# MCP (stdio)
python3 -m powstock.mcp --stdio

# Tests
python3 -m pytest tests/ -m "not integration"

# Status
python3 -c "from powstock.collectors.runner import status; status()"
```

### powstock Data

| Table | Rows | What |
|-------|------|------|
| price_daily | 11,506 | 2 years daily OHLCV for 24/25 tickers |
| insider_deals | 9 | Universe-filtered PDMR deals |
| short_interest | 843 | FCA short positions (15/25 tickers matched) |
| rns_announcements | 932 | Investegate RNS (18 tickers) |
| company_profiles | 25 | Companies House profiles (all 25) |
| observation | 5,065 | Raw metrics |
| ingest_run | 64 | Collection lifecycle tracking |
| artifact_object | 115 | Content-addressed raw objects |

### powstock Signals (9/11 working)

| Signal | Status | What It Measures |
|--------|--------|------------------|
| price_momentum_50d | ✓ | 50-day price momentum |
| price_momentum_200d | ✓ | 200-day price momentum |
| moving_average_crossover | ✓ | 50/200 MA ratio (death/golden cross) |
| drawdown_from_peak | ✓ | 52-week drawdown |
| short_interest_level | ✓ | Short interest as % of float |
| short_squeeze_risk | ✓ | Short squeeze potential |
| filing_event_signal | ✓ | Filing activity level |
| alignment_score | ✓ | Insider + short interest alignment |
| composite_score | ✓ | Weighted composite of all signals |
| insider_pressure | ✗ | Needs Tracefour API key |
| anomaly_score | ✗ | Needs insider data |

### powstock Blockers

1. **Tracefour API key** — Register at https://www.tracefour.com, set `POWSTOCK_TRACEFOUR_API_KEY`
2. **Finnhub API key** — Register at https://finnhub.io, set `POWSTOCK_FINNHUB_API_KEY`
3. **Proxy for DMO/FCA** — Both behind anti-bot
4. **Retry logic** — UK Parliament, European Insiders timeout
5. **Congress parser** — XML malformed + CSRF 403

See `/root/powstock/BLOCKERS.md` for full details.

### powstock Key Files

| File | What |
|------|------|
| `powstock/collectors/runner.py` | Orchestrator — init_db, run_all, heartbeat |
| `powstock/collectors/__init__.py` | Exports all 20 collectors |
| `powstock/universe.py` | 25 securities with CH#, ISIN, LEI |
| `powstock/api.py` | FastAPI HTTP server (port 8797) |
| `powstock/mcp.py` | MCP tool server (11 tools) |
| `layer1/artifacts.py` | Content-addressed raw storage |
| `layer2/signals/__init__.py` | 10 signal functions |
| `data/powstock.db` | SQLite database |
| `HANDOVER.md` | Full handover for next agent |
| `THREADS.md` | 16 open threads |
| `BLOCKERS.md` | What needs human intervention |
| `BUILD_NOTES.md` | Session log of all changes |
| `DEVPLAN.md` | Roadmap and milestones |

### aoc Quick Start

```bash
cd /root/aoc

# Build one carousel (gated, receipted)
python3 -c "from core.carousel import run_carousel; print(run_carousel('UK electricians — still doing quotes at 9pm?', 'opportunity', segment='electrician')['zip'])"

# Cheap check (no render)
python3 mcp_server.py aoc_validate '{"hook": "UK electricians — still doing quotes at 9pm?", "segment": "electrician"}'

# Gallery + review queue
python3 -m web.viewer  # http://127.0.0.1:8798/

# Tests (75, no network)
python3 -m pytest tests/ -q
```

### aoc Data

| Area | State |
|------|-------|
| Segments | 13 skins (electrician, beautician, nails, lashes, hair, cleaners, dog_groomers, gardeners, car_detailers, driving_instructors, weddings, plumber, sole_trader) |
| Templates | 11 (opportunity → trust, incl. waitlist + annuity + retention) |
| Claims registry | 88 records (`claims.yaml`) |
| Offers | £20 quickstart (waitlist) + £499 standard, versioned (`offers.yaml`) |
| Built carousels | 90+ in `store/` (gitignored), index in `store/campaigns.json` |
| Review sign-offs | 10 on file in hash-chained receipts |
| MCP tools | 19 (`aoc_status` → `aoc_funnel`) |

### aoc Invariants

1. No render without passing gates. 2. No approval without exact asset hashes.
3. No publish without approval + real post URL. 4. No invented numbers.
5. Unknown segments raise. 6. Withdrawn permission blocks everything.
7. Snapshots append, never overwrite. 8. Leads ≠ qualified. 9. Views ≠ value.

### aoc Key Files

| File | What |
|------|------|
| `docs/HOW_IT_WORKS.md` | Read-first map of the whole system |
| `AGENTS.md` | Working rules for this repo |
| `core/carousel.py` | Orchestrator — plan→proof→gates→render→validate→export |
| `core/{gates,proof,ids}.py` | 9 gates, claims resolution, canonical IDs |
| `core/{state,store}.py` | Lifecycle state machine + SQLite persistence |
| `core/{review,validate}.py` | 15-point checklist, pixel checks, contact sheets |
| `core/{memory,analytics,acquisition}.py` | Rankings, snapshots→learnings, funnel |
| `core/{personalize,offers}.py` | Per-business variants, offer registry |
| `slides/generate.py` | Skin loader, generic decks, hook bank |
| `render/slide.py` | PIL 1080×1920 compositor |
| `mcp_server.py` | 19 MCP tools (stdio + CLI) |
| `web/viewer.py` | Local gallery + review queue (:8798) |
| `claims.yaml` / `offers.yaml` | Fact + offer registries |
| `segments/*/` | 13 skins + per-vertical strategies |

### aionboard Quick Reference

Offer v1: £20 Muse Quickstart (waitlist until UK launch) + £499 Standard AI Setup.
Electricians = separate higher-value POW route. Trust model: no passwords,
no money movement, no silent sends, revocable everything, minimal data.
Key files: `OFFER.md` (canonical), `TRUST_MODEL.md`, `targets.md`,
`PROSPECT_SCORING.md`, `verticals/*/` (11 packs), `prospects_electrical.csv`.

### quill-app Live Ops (2026-10-24 session — full notes: `manuscriptAI/docs/SESSION-2026-10-24.md`)

Repo `/root/manuscriptAI` → `prx0r/quill-app` main. Live: https://quill.agi.みんな (worker `quill`).

| Rule | Why |
|------|-----|
| Build worker deploys with `WEB=1 npm run build` ONLY | Plain build emits `/manuscriptAI/` base → live serves index.html as JS → dead blank page |
| `wrangler deploy` ONLY from `deploy/` | Wrong-dir deploy created stray `react-example` worker + root strays |
| `rm -rf ../.wrangler ../wrangler.jsonc` before every deploy | Wrangler recreates the stray state dir and then refuses the next deploy |
| Token: `CLOUDFLARE_API_TOKEN="$(cat /root/.cf-api-token)"` (600, never in repo) | Old env token is dead (9109) |
| NEVER restart the box bridge (Oct21 pid, :18787) until canvas endpoints are reconstructed in-repo | `/canvas/*` routes live ONLY in that process memory — disk `bridge.py` has none; restart kills web canvas sync |
| Verify after every deploy: live HTML shows `/assets/` + bundle URL returns JS (not HTML), `packs.json` count | Catches base-path regressions in 10s |
| aws-cli broken on box (botocore) — use boto3 with `/root/.r2-env` | `uploads` bucket holds the big zips (sketch + 2× image, Sep 30); default bucket is `blog-video-assets` |

Canvas/AI state: pull cards + local chat default = `deepseek-v4.1-flash` via worker (longcat = dead 402).
Shift+S asks answer as canvas blocks + per-canvas history. `⟲ pursue` needs owner-local bridge (dead on public, falls back to direct answer).

### sleepdraw Journey Engine (session 2026-10-25)

Repo `prx0r/sleepdraw`. **Read `/root/sleepdraw/HANDOVER-NEXT.md` first.**

| Thing | Where | Why |
|-------|-------|-----|
| **Journey renderer** | `progressive_journey.py` | 12 checkpoints → continuous video, 15s, pure numpy. THE pipeline |
| **14 validation gates** | `axioms.py` | Post-hoc checks + encode_prompt(). Storyboards must pass before use |
| **2,290 labeled pairs** | `storyboards/journey-pairs.json` | CIRThan sketch↔thangka, zip_keys verified 8/8 (mixed .png/.jpg from split files) |
| **3 twelve-stage prototypes** | `storyboards/0{1,2,3}-stage-*.png` | Owner's checkpoints, pixel-registered 620x900 |
| **Engine comparison** | R2 `stallshark/engine-comparison/` | 5 MP4s: whiteboard-video-engine / animator / progressive / lora2 / mahakala |
| **Bailian image models** | `docs/BAILIAN-STACK.md` | Singapore workspace endpoint ONLY (not dashscope-intl). Local file upload = 401, use URLs |
| **Engines cloned** | `/root/engines/` (+venv) | whiteboard-video-engine (colour reveal), animator (quick), 5 others |

**Job split:** journeys → progressive_journey (light paper, continuous). sleep channels → techdou lora1/2/3 (white-on-black, fade-outs). Never mix.

**quill-app canvas**: journey chat (🎨 director mode), video embeds (same-origin `dist/journey/`), model selection in chat, `/journey` worker endpoint. Live: quill.agi.みんな

---

## svatantrya.net — Sanskrit / Trika estate (2026-11-11)

Live surface: **https://svatantrya.net** (Cloudflare Pages, repo `/root/svread`).
**Read `svread/docs/INDEX.md` first** — it says which docs are canonical vs history.

| Piece | Where | State |
|---|---|---|
| Reader + wheels + practice | `/root/svread` | live: `wheels`, `?view=practice`, `?view=scholar`, 45 `/a/<form>/` answer pages |
| Worker (auth, chat, gates) | `/root/ipvv/worker` | live: Google site auth, ORCID publishing, server-scored wheel gates (20 items, 18 pass, CAS + receipts) |
| Layers + gates | `/root/translation-work` | T1→L4; `burn/muktabodha` PR #18 is the live factory front |
| Formal + Treeka + federation | `/root/trika-x` | Lean `PrakriyaSlice.lean` (44 traces, 4 mutants, receipt-bound); federation gateway = 109 tools |
| Identity | `/root/openpatala` | 555 works here; committed biblio was emitted from a 2,051-work DB elsewhere (**BLOCKED**, see PROGRESS-REPORT) |
| Curriculum | `/root/deitybody` | 10-stage Mātṛkā; vendored into svread |

**All-system backup (canonical):** bucket **`svatantrya-system`**, root
**`INDEX.json`** — 12 repo archives (with .git) + 6 packages ≈ 2.28 GB.
Rebuild/add: `python3 svread/tools/r2_system_backup.py [--only X|--check|--force]`.
Secrets are excluded; never archive `.env`/`.dev.vars`.

**One MCP surface for ChatGPT:** `svread/data/mcp-registry.json` (8 servers
probed live; federation = 109 tools; read/write/generative sheaves) + plan in
`svread/MCP-INTEGRATION.md`. Bridge/tunnel/OAuth are the remaining build.

**Gates:** `svread/python3 tools/seo_check.py` (10/10), `svread/TESTING.md` for
every suite. House law: BLOCKED ≠ PASS; machine traces are DERIVED, not truth;
nothing auto-publishes or auto-signs.

## ENDGAME VISION — owner directive 2026-11-06 (verbatim, binding)

*The following is the user's message saved verbatim. Where it directs,
it wins. Spelling/punctuation preserved exactly as written.*

NICE I THINK IM SEEING HOW THIS COULD BE AWESOME RIGHT. ESSENTIALLY U HAVE NIBBANA HELP WITH ALL THE DIARY AND ISSUES THEN U COULD FEED THIS TO TEACHER AND CHAT AND THIS ESSAY WRITING STUFF WHICH CAN WRITE PERSONALISED ESSASY / TEACHINGS FOR YOU TO READ AND LISTEN TO (ALL SOURCED) AND POTENTIALLY EVEN CREATE YOU VIDEOS TAHT YOU CAN OWN / PUBLISH FOR OTHERS, LINK TO YOUR JOURNEY, I GUESS TAHTS ENDGAME TYPE STUFF BUT THE SYNERGY IS GOOD TO NOTE FOR OTHER SIMILAR TYPE RECIPES.. I THINK THATS THE BIG UNLOCK HERE WE CAN HAVE LOTS OF INTERESTING RECIPES OVER ALL THIS .. EVEN DOWN TO SHRT MOVIES ONCE AI MODELS GET GOOD ENOUGH RIGHT .. THATS KINDA WHERE OUR C2 STUFF ABOUT PARABLES AND ROADMAN IS HEADED RIGHT.. KIDS BOOKS.. IMAGINE A BOOKE MADE FROM YOUR DIARY, YEAR REVIEW OF HARDSHIPS, A POEM BOOK MADE FROM YOUR WORDS SPEC ALL THIS OUT AND SAVE THIS MESSAGE VERBAITM AND PUT IT IN ENDGAME VISION IN AGENTS.MD OR SOMWHEERE WHERE PPL CAN SEE IT

*Interpretation (kept separate from the words): diary/issues (nibbanahelp)
→ teacher/chat → essay pipeline → personalised sourced essays/teachings
(read + listen) → ownable/publishable videos → journey-linked. Recipes
multiply over all of it (parables/C2, roadman, kids books, diary book,
year review, poem book, short movies when models qualify). Spec lives at
trika-x `ENDGAME-RECIPES.md`. Standing invariants: diary is private —
consent per use, revocable, no auto-publish of personal material, ever;
sourced means every claim resolves or it doesn't ship.*
