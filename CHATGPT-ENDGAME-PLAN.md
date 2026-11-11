<!-- status: superseded by CHATGPT-NORTH-STAR.md, CHATGPT-PLUGIN.md, and data/mcp-registry.json -->

> **Status (2026-11-11):** superseded by CHATGPT-NORTH-STAR.md, CHATGPT-PLUGIN.md, and data/mcp-registry.json.

# ChatGPT Endgame — plan from here (2026-11-11)

Companion to `chatgptendgame.md` (owner verbatim). This is the build order that
takes us from today's site to: **ChatGPT is the main environment; the site exposes
tools, MCP, verification; progress lives in our profile store; free LLMs run the
translation pipeline; scholars refine and claim; openpatala categorises; ChatGPT
teaches and practises with the learner.**

Identity: **robo scholar = ChatGPT.** The site is the capability server. The
Scholar tab is where humans sign; ChatGPT is where humans learn and work.

---

## 0. What exists today (measured, not remembered)

| Piece | State | Where |
|---|---|---|
| Wheel harness (one fetch) | LIVE | `data/wheels/harness.json` (101KB), `HARNESS.md` |
| Tutor levels 1–6 | LIVE | `data/wheels/tutor/*.md` |
| Machine proofs | LIVE | `data/grammar/wheel-pack.json` (44 entries, 43 DERIVED), `crosscheck.json` |
| Curated tier (MIT) | LIVE | `vendor/sanskrit-bruno-wheels/` |
| Journey (90% gates) | LIVE | `wheels.html#journey`, `journey.js` |
| GPT Action spec | LIVE | `data/wheels/openapi.json` (7 public GETs) |
| GPT instructions | LIVE | `data/wheels/GPT-INSTRUCTIONS.md` |
| MCP (local stdio) | LIVE | `mcp/scholar_server.py`, 37 tools incl. 4 wheel tools |
| MCP (remote) | **STALE** | worker `/mcp`: protocol 2024-11-05, points at `ipvv-a8u.pages.dev`, no wheels/auth/progress |
| Practice tab | **MISSING** | no route in `app.js`; curriculum exists elsewhere |
| Curriculum content | READY | `/root/deitybody/data/curriculum.json` (10 stages), `practice/CURRICULUM_CARDS.md` (DO/MIND/NOT/SOURCE per stage) |
| Progress store | **MISSING** | D1 has profiles, no learner progress table |
| Autotranslate pipeline | READY-ish | translation-work T1→L0→argmap→L2→C1→proof; needs an LLM driver + intake |
| openpatala categorisation | READY | identity/API on :8821, 1,099 works, 11 adapters |
| Claims / verify packs | LIVE | 909 claim pages + packs + hashes |

Three access tiers, cheapest first:

- **T1 — GPT Action** (works today, no auth): public GETs. Good for reading
  wheels, packs, levels. No progress, no writes.
- **T2 — Remote MCP connector** (the real endgame): authenticated, stateful,
  does lookups, verification, progress read/write. Needs the worker upgrade.
- **T3 — Profile store** (D1): learner level, mastery per form, streak,
  consent. Survives across chats/devices. This is "mcp as your profile."

---

## 1. Phase plan (each phase ships something usable)

### P0 — Freeze the contract (this week)
**Goal:** what ChatGPT may call is written down and tested.

- [ ] Fix `openapi.json` version pinning: add `x-gate-version` + note that
      breaking changes bump `info.version`.
- [ ] Add `tests/openapi.test.cjs`: every path resolves to a file on disk;
      every operationId unique; no auth-required path listed.
- [ ] Publish `HARNESS.md`, `harness.json`, `openapi.json`, `GPT-INSTRUCTIONS.md`
      in `llms.txt` + `ai-catalog.json` (partly done).
- **Acceptance:** a fresh Custom GPT built from the instructions answers
  "start Level 1" and fetches all four data URLs without extra prompting.

### P1 — Remote MCP that actually works (2–3 days)
**Goal:** one endpoint a ChatGPT connector can add.

- [ ] Upgrade worker `/mcp` in `ipvv/worker/src/index.js`:
      - protocol `2025-06-18`, `GET` (SSE) + `POST` (JSON-RPC), `DELETE` for
        session teardown; `Mcp-Session-Id` header.
      - Keep the legacy single-POST behaviour for old clients (protocol
        negotiation on `initialize`).
- [ ] Tool set v1 (read-only, no auth needed for public tier):
      `wheel_harness`, `wheel_lookup`, `wheel_verify`, `wheel_level`
      (port from `mcp/scholar_server.py` — same schemas, same closed-world rules).
- [ ] Tool set v2 (auth required, ORCID session via existing `svsess`):
      `reader_passage(work,target)`, `word_gloss(work,verse)`,
      `claim(work,target)`, `search_texts(query)`, `progress_get`,
      `progress_record`.
- [ ] Fail closed: unknown tool → -32601; missing arg → -32602; BLOCKED English
      never returned (reuse the gate).
- **Acceptance:** `curl POST /mcp` with `initialize` then `tools/list` returns
  11+ tools on protocol 2025-06-18; `wheel_verify {form:"katham"}` returns
  `DISAGREE_STANDS`; worker stays up on a dead child.

### P2 — Progress profile in D1 (2 days)
**Goal:** "mcp as your profile."

New table (migration in `ipvv/worker/migrations/`):

```sql
CREATE TABLE IF NOT EXISTS learner_progress (
  user_id      TEXT NOT NULL,
  curriculum   TEXT NOT NULL,          -- 'wheels-word', 'wheels-sentence', 'deitybody-matrika'
  stage        INTEGER NOT NULL,       -- current level (1..N)
  asked        INTEGER DEFAULT 0,
  correct      INTEGER DEFAULT 0,
  passed_json  TEXT DEFAULT '[]',      -- stages passed, with timestamps
  items_json   TEXT DEFAULT '{}',      -- per-form mastery: {item_id: {seen,right,last}}
  updated_at   TEXT DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, curriculum)
);
```

- [ ] `progress_get(curriculum)` / `progress_record({curriculum, item, correct})`
      with the same gate math as `journey.js` (90% over 10+, cumulative).
- [ ] Consent: recording requires `progress_consent: true` in the first call;
      without it the tool answers but writes nothing (and says so).
- [ ] The site's `#journey` reads the same store when signed in, so
      ChatGPT-scored practice and on-site practice are ONE record. Local
      localStorage stays the signed-out fallback.
- **Acceptance:** score 10 in ChatGPT → refresh `journey.html` signed in →
      same 10/10 shown. Sign out → still local. Two devices → same.

### P3 — Practice tab on svread (2–3 days)
**Goal:** the missing surface — and it is the curriculum, not a new invention.

- [ ] New route `?view=practice` + nav item. Three tracks:
      1. **Wheels** (existing journey, embedded — no duplicate).
      2. **Deitybody / Mātṛkā** (10 gated stages from `deitybody/data/curriculum.json`).
      3. **Reader drill** (verse → parse → kāraka, uses existing traces).
- [ ] Vendor the curriculum data into `data/practice/` with provenance hashes:
      `curriculum.json`, `cards.json` (parsed from `CURRICULUM_CARDS.md`:
      DO / IN THE MIND / NOT / SOURCE), stage gate definitions.
- [ ] Each stage renders: goal, weeks, nightly practice, graduation bar,
      attested sources, and a "Copy ChatGPT prompt" button (same pattern as
      journey) pointing at the remote MCP tools.
- [ ] **Law:** synthesis never presented as doctrine (deitybody lock 9);
      every practice element traces to MV / TĀ / PTv / VBT as the cards do.
- **Acceptance:** `?view=practice` shows 10 stages; stage 1 card matches
  `CURRICULUM_CARDS.md` byte-for-byte content; no new claims invented.

### P4 — Package the product (1 day after P1–P3)
- [ ] Public Custom GPT ("Svatantrya Sanskrit"): Action = `openapi.json`,
      instructions = `GPT-INSTRUCTIONS.md`. Learners never paste anything.
- [ ] Private GPT with the MCP connector (owner account first) where progress
      and reader tools live.
- [ ] `data/wheels/GPT-INSTRUCTIONS.md` gains the progress + practice-track
      paragraphs once P2/P3 are real (not before).
- **Acceptance:** owner opens the GPT, says "practise mātṛkā stage 3", gets
  the card, is tested aloud, and the score lands in D1.

### P5 — Autotranslate pipeline (the big one; 1–2 weeks)
**Goal:** free LLMs run translation-work end to end; scholars refine; claims
are the product.

- [ ] **Intake:** a work enters as source bytes + edition + licence. Provider
      adapters: GRETIL / DLI / SARIT / Ambuda handoff. Store in
      `translation-work/<work>/source/` with sha + verse count (the existing
      discipline; no batch).
- [ ] **Driver:** `tools/auto_pipeline.py` calls free models per layer in the
      canonical order (T1 → L0 → argmap → L2 → C1), each layer a separate job
      so a failure never corrupts the next:
      - T1: llama-3.3-70b (coverage first, per-pada)
      - L0: qwen3-30b (morphology options; must reach 100% parsed or BLOCKED)
      - argmap: deepseek-v4-flash (reasoning)
      - L2: mistral-small-24b (prose) — cross-family on purpose
      - C1: llama-3.3-70b + mistral replicate (two renders, disagreement flagged)
      Every output: model id, date, prompt hash, token counts. Machine-proposed.
- [ ] **Gates:** reuse `translation-work/check.py` + proof_record; a layer that
      fails its gate stays BLOCKED and never reaches the reader (existing law).
- [ ] **Categorise:** on pass, emit to openpatala (work/edition/passage,
      tradition field) so retrieval can filter by tradition; the bridge exists
      (28 works / 154 IDs BYTES_MATCH) — extend it.
- [ ] **Claims:** emit verify pack + claim page per passage via
      `tools/emit_verify.py` / `emit_claim_pages.py` (already deterministic).
- [ ] **Rights:** initial translation = free use (owner directive); the claim
      page states provenance, licence, and that it is machine-proposed until a
      scholar signs. Scholar sign-off is the only path to `reviewed`.
- **Acceptance:** one new work goes source → gated layers → reader bundle →
  claim pages → openpatala entry, with zero manual layer editing, and the
  claim page says "machine-proposed, unreviewed" until signed.

### P6 — Papers + peer review with ChatGPT (continuous after P5)
- [ ] Essay pipeline exists (Scholar): claims → audit → PUSHBACK → human sign.
      ChatGPT's job is drafting against `search_texts` + claim tables, never
      asserting beyond them.
- [ ] Peer-review mode: two independent models critique a draft; disagreements
      become `pushback` candidates; a human decides. (Agent vs agent; the human
      is the only judge.)
- [ ] Publish to Zenodo only after human sign (existing gate; 0 DOI today).
- **Acceptance:** one full loop on a real work: ChatGPT drafts → audit receipt →
  second-model objections → scholar accepts/rejects → signed essay.

---

## 2. The decision tree ChatGPT follows (canonical)

```
new learner
 ├─ has progress? (progress_get) ── no ─→ Level 1 (bases)
 └─ yes ─→ resume at recorded stage; if stale >30d, re-test that stage first

practice loop (any stage)
 ├─ teach one item (closed world, cite status)
 ├─ test aloud ×10
 ├─ score ── <90% ─→ re-drill with ALL earlier stages mixed (cumulative)
 └─ ≥90% ─→ progress_record(pass) → unlock next stage → send page link

content question
 ├─ form? ─→ wheel_verify (AGREE / DISAGREE_STANDS / MACHINE_GAP / CURATED_ONLY)
 ├─ verse? ─→ reader_passage → L0 → argmap → L2 → C1 (in that order)
 └─ disputed? ─→ claim(work,target) → show hashes + verify steps

writing
 ├─ draft against search_texts + claim tables only
 ├─ audit_draft → pushback → human sign
 └─ never publish without signoff
```

---

## 3. Hard laws (carried from the estate; no exceptions)

1. Closed world: unlisted forms never render; BLOCKED English never returned.
2. Machine ≠ reviewer: every tool response labels unreviewed vs curated vs
   signed. `AGREE` means machine confirms curation, never correctness.
3. Progress is private: no recording without consent; revocable; exportable.
4. No auto-publish, no auto-sign, no auto-promote — anywhere, ever.
5. Deitybody/curriculum: synthesis never presented as doctrine; stages are
   modern apparatus over attested elements.
6. Free models only for the pipeline; every output carries model + date +
   prompt hash so a stale render is detectable.
7. One canonical code path per job; no second ledger, no second ID scheme.

---

## 4. What can be done TODAY vs what needs owner action

**Agent can do now:** P0 fully; P1 code + tests; P2 migration + tools; P3
practice tab + vendored curriculum; P4 spec files.

**Needs owner:**
- Add the remote MCP URL as a connector in ChatGPT (account UI).
- ORCID client creds are live; D1 migration run (`wrangler d1 execute`).
- Approve vendoring deitybody curriculum into svread (cross-lane copy; read-only
  there, emitted here with provenance).
- The Custom GPT creation itself (one-time UI step).

---

## 5. Order of work (next three moves)

1. **P1 + P2** together: remote MCP with progress. Nothing else matters until
   ChatGPT can call one authenticated endpoint and remember you.
2. **P3** practice tab, reading the same store. Now the site and ChatGPT are
   one system, not two.
3. **P5** autotranslate on one real work, end to end, to prove the factory.

Everything else is already built and waiting.
