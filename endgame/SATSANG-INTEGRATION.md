# SATSANG + TANTRASARA + DEITYBODY — the surfaces: TV, video gen, practice

Spec, 2026-11-05. Overviews imported byte-identical into `satsang/`,
`tantrasara/`, `deitybody/` (docs only — no clones, disk respected). Sources:
`prx0r/satsang` (main), `prx0r/tantrasara` (master), `prx0r/deitybody` (main).
Companion: `../ENDGAME.md`, `../ENDGAME-BUILD-PLAN.md`,
`NIBBANAHELP-INTEGRATION.md`.

---

## 1. What the three are

| Repo | Role in the machine | Live state (from its own overviews) |
|---|---|---|
| **satsang** | **TV + COMMUNITY + COURSES + JOURNEYS** — the distribution surface. Living directory: 9,986 official-embed talks (gold 246 / strong 1,198), 22 Series (topic courses), Watch/TV mode, resonance loop, places (963), enquiry search, **shared account + day-gated journeys** (API MVP), **For You tension blocks**, journal→essay→video→For-You loop spec, practice engine (`/sit/`,`/breath/`), chat/path builder, **open MCP/REST API** (agents can query for sourced dated answers) | Live: tantrafiles.xyz (site/api/mcp/chat/search workers); satsang.digital pending nameservers |
| **tantrasara** | **VIDEO GEN** — the factory that feeds the TV. Six-section argument + essay-0 + rungs; chapter pipeline (source → storyboard → audio → align → cards → video), gates, gold standard (ch01 v3: 439s, 898 cuts) | ch01/ch02 verified; batch running (see its START-HERE) |
| **deitybody** | **PRACTICE** — text → syllabus → body. Abhinavagupta/Trika phonemic-body OS: Mālinī → Tantrāloka/Tantrasāra/Parātrīśikā → VBT dhāraṇās; train `क → /ka/ → articulation → body locus → glyph → resonance`; eight-phase path; `protocols/daily_practice.json` + month curriculum (16 vowels, varga cadence, matrika body map) | Backend + tests on box; northstar saved verbatim: *full text/method → syllabus → practice → visualization mapping the system on our body, with a standardized grammar for visualisations*, realtime AI-guided meditation (voice + wearables + viz) |

## 2. The fit — seven surfaces, one spine

```
EVIDENCE     translation-work (chunks·gates) + openpatala (witness) + sanskritbench (verify)
AUTHORITY    scholar stack (review → signoff → rights → release → DOI)
CONTENT      estate → PUSHING/cruxes → essays → packs → tantrasara factory (VIDEO GEN)
DISTRIBUTION satsang Watch / TV + Series courses + resonance + MCP API   ← satsang
PERSONAL     nibbanahelp (diary·tensions·relay) → satsang journeys (Day N) + For You blocks
PRACTICE     deitybody (text→syllabus→practice→body map) → satsang engine (/sit/) + guided Qwen
COMMUNITY    satsang (teachers·places·votes·circles·open data)
```

**Tensions are now the connector in four places** — nibbanahelp tension
states, scholar cruxes, Treeka gaps, and **satsang's For You tension blocks
already live** (`src/tensions.js` → knots.json → Resolve/Enlighten/Explain
rows with why-lines). The same node type drives: the memoir, the essay queue,
the recommendation feed, and the tree's gap report.

**The journey mechanic already exists.** Satsang's day-gated journeys
(`specs/JOURNEYS-DAYGATE.md`): invite-only circles, *you read others' Day N
only after posting your own*, entries encrypted at rest, day key released
after posting. The owner's refinement — **the number only advances on an
actual post, never with calendar time** — is the same anti-inflation rule as
nibbanahelp's 1-diary-per-day law. Day N = count of posting days; stopping
freezes it. Watched together with the nibbanahelp journey ledger (N3), a
person's day counter and their tamper-evident trace are the same record.

## 3. What already exists (don't rebuild)

- Catalogue + tiers + Series + Watch/TV + resonance + places + enquiry lens + MCP API — satsang, live.
- Day-gated journeys API + shared account (Google → ES256 tokens) — live MVP.
- **Journal → essay → video → @svatantryart → For You** content-loop spec — `satsang/specs/JOURNAL-TO-VIDEO.md`.
- Video factory — tantrasara (22 chapters green, batch running).
- Practice protocols + syllabus shape — deitybody (`daily_practice.json`, month curriculum, PATHWAY).
- Guided-voice substrate — our Qwen realtime (evidence + essay-context sessions, wire-proven).
- Featured Trika row on satsang (Lakshmanjoo, Wallis, Dyczkowski, Abhinavagupta…) — our tradition is already the front page.

## 4. What needs to be done (ordered)

| # | Task | Why |
|---|---|---|
| **S1** | **Day-counter semantics** — confirm/implement: Day N increments only on post (count of posting days, streak-free, never calendar); link the counter to nibbanahelp diary days + journey-ledger blocks (one record, two views). | The owner's rule; aligns three systems on one journey truth. |
| **S2** | **Full chain proof: source → practice → Qwen talk.** One guided session: deitybody phase/protocol as context + gated Sanskrit passages + Qwen realtime voice speaking *from the source*, closing as a logged journey block. | Proves PRACTICE end-to-end with the stack we already built (voice + evidence + consent). |
| **S3** | **Syllabus compiler** — text/method → course: translation-work chunks → units → practices → **standardized visualization grammar** (northstar's ask: each practice maps the system onto the body). Output shape = satsang Series + deitybody protocols. | The northstar verbatim: backend first, grammar for visualisations. |
| **S4** | **Generated courses on satsang** — our own: chapters/essay-0/rungs (tantrasara) + parable packs → Series episodes → Watch ingest. Others: existing catalogue (22 Series) stays. Label generated vs catalogue, always. | "Guided courses, our own and others" — provenance label is the law. |
| **S5** | **Close the content loop** — nibbanahelp/journal tension → essay (resolve chain) → pack → tantrasara/short factory → satsang Watch + For You. `JOURNAL-TO-VIDEO.md` already specced from the satsang side; ours supplies the packs and the gates. | The organism loop: what people carry → what gets made → what feeds back. |
| **S6** | **Journey ledger alignment (N3, owner-gated)** — when built, its witnesses serve both nibbanahelp blocks and satsang Day-N records. | One legitimacy spine, three surfaces. |
| **S7** | **Owner gates** — satsang.digital nameserver flip + `switch-domain.sh`; sit player wiring into the Practise tab (its own docs say "awaits the owner"); OAuth JS-origin for shared sign-in. | These three are one-command owner actions blocking surface completion. |

## 5. Guardrails (inherited + per-surface)

- Satsang sourcing: **official embeds/metadata only, no media hosting** (its law).
- Tier labels: generated vs catalogue, trika/lived vs scripture — never blurred.
- Journal/voice rule: the diarist's words only; device-computed concerns stay device-side (`wiser.journal`, never synced) — satsang already does this right.
- Day-gating privacy: entries encrypted, key released after posting — keep server-as-trusted-holder model unless owner asks E2E.
- Wearables/realtime meditation (northstar): spec before build; the voice substrate exists but biometrics + viz are Phase 4+ owner decisions.
- Other agents' lanes: satsang and deitybody repos are active elsewhere — this doc reads their overviews only; coordinate before writes.
