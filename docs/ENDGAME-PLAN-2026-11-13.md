# ENDGAME PLAN — layers, exposure, and the ordered build (2026-11-13)

*Status: operative plan, supersedes nothing — it sits under `MASTERPLAN3.md`
and `docs/endgame/`, and reconciles them with what is actually exposed today.
Every number below was measured on this box on 2026-11-13; reproduce with the
commands named.*

This answers two questions the owner asked:

1. **How are we exposing `translation-work` and all our layers?**
2. **What is the plan across trika-x, formal-trika, and the endgame docs?**

---

## 1. What we actually have (measured)

### 1.1 The layers (`translation-work`)

Eight layer types per work directory, JSON, content-addressed:

| Layer | What it is | Purpose |
|---|---|---|
| `t1` | fast translation + token glosses | face every pāda up front; coverage decided early |
| `l0` | literal gloss with fork/options/grounds | **ambiguity lives here**, nowhere else |
| `argmap` | speaker/question/premises/inference/uncertainties | the reasoning behind the reading |
| `l2` | plain exact English, `l0_ids`, fidelity flags | the faithful draft |
| `l3` | FINAL canonical translation, 2-line couplets | the one translation to read |
| `c1` | essence + 7-section standard render + rasa | what the verse *does* |
| `c2` | prompt-reproducible registers (eli5/genz/poetic…) | one reading per prompt |
| `l4` | song / craft render | listenable form |

**Counts (measured):** 112 work dirs, **80 with layer data**; files —
`t1 323 · l0 323 · argmap 279 · l2 325 · l3 268 · l4 268 · c1 279 · c2 231`.
`REGISTRY.json`: 101 works — 36 `gold`, 42 `gold (machine-proposed…)`,
10 `pending`, 12 `recon complete`, 1 `no-repo`. "Gold" = machine-proposed
unless a human signed; treat it as a draft tier, not approval.

### 1.2 What the public site exposes

| Surface | Count | Notes |
|---|---|---|
| authority bibliography | 2,051 works (+224 mirror) | `data/biblio.json`, digest-pinned |
| reader bundles | 88 works | `data/<work>.json` (site layer: sanskrit, l1, l2, l3, c1, argmap, gate) |
| trace bundles | 909 chunks / 87 works | `data/traces/<work>-<target>.json` — source→layers→proofs→theorems |
| verify packs | 909 | `data/verify/<work>-<target>/manifest.json` + artifacts |
| claim pages | 909 | `/claim/<work>/<target>/` (answer-first, hashes) |
| scholar projections | 55 | essays/versions/reviews |
| trace works that are read | 87 / 87 | every trace work also has a reader bundle |

### 1.3 What ChatGPT can reach (live MCP, probed)

| Endpoint | Tools | Auth | What it gives |
|---|---|---|---|
| `mcp.svatantrya.net/mcp` | **47** | none | public bundle: openpatala, scholar, formal, treeka, translate, compose, federation |
| `sanskrit.svatantrya.net/mcp` | 9 | none | Sanskrit-focused reads |
| `index.svatantrya.net/mcp` | 5 | none | bibliography/index |
| `studio` / `factory` | 47 / 40 | owner bearer | tutor memory, essays, drills, voice loop, factories |
| federation (local) | 109 | stdio | all child servers |

Layer-relevant tools that exist **today**:

- `scholar__passage_evidence(work,target)` → `source` + **all eight layers**
  (`t1,l0,argmap,l2,c1,l3,l4,c2`) for bundled works. Verified live.
- `formal__trace` → full trace bundle (bytes + layers + proofs + theorems).
- `scholar__search_texts`, `scholar__text_themes`, `scholar__resolve_ref`,
  `scholar__ref_links` → semantic + graph access.
- `translate__status/validate/lore/skill/concepts/gates/recon` → **work meta,
  not layer text**; no enumeration of a work's passages or layer coverage.
- `openpatala__*` → identity/dossier; `compose__*` → wheels; `treeka__*` →
  argument/crux chains.

### 1.4 The actual gap

1. **No layer index.** ChatGPT cannot ask "which layers exist for work X, for
   which passages, with what hashes/status" in one call. It can fetch a
   passage it already knows (`scholar__passage_evidence`) or a trace it already
   knows, but cannot enumerate.
2. **`translate__*` is meta.** It reports counts/state, not the layer text, and
   it is not a coverage map.
3. **80 works have layers, 88 are readable** — close, but the layer corpus is
   not discoverable through one deterministic export.
4. **Ambiguity (the crown jewel) is invisible.** `l0` forks and `argmap`
   `option_choices` are where our work differs from commodity translation, and
   no tool surfaces "show the forks in this verse."
5. **No coverage/gap tool.** "Which chunks lack l3 / human review / a witness"
   is a query nobody can run over MCP.

---

## 2. Useful use cases (ranked by value ÷ cost)

| # | Use case | Needs | Cost |
|---|---|---|---|
| U1 | **ChatGPT teaches a passage with the full stack** — T1 → L0 → L2 → L3 → C1, each with hash + status | layer index + existing `passage_evidence` | low |
| U2 | **"Where does this translation fork?"** — show L0 ambiguity + ARGMAP option choices and why | new fork tool over existing data | low |
| U3 | **Coverage desk** — per work: passages with/without l3, human review, witness | coverage tool over existing data | low |
| U4 | **Compare layers** — literal vs readable vs song, see where sense shifts | existing layers + a compare tool | low |
| U5 | **Sourced essay from a passage** — ARGMAP + C1 + crux → draft → audit | essay host (bearer) + claims | medium |
| U6 | **Personalised teaching** — diary → essay → audio → video (R1–R9) | consent + essay/factory lanes | high |
| U7 | **Book/video from approved layers** | release snapshots + evidence_refs | high |
| U8 | **Form/translation matrix across editions** | rights + translation rows | medium |

U1–U4 are all *read-only over data we already have*. They are the cheapest way
to make the endgame real and to make the site worth visiting beyond the reader.

---

## 3. The plan

Sequencing rule: **expose what exists before building more.** Every phase
ships a measured surface and a gate; nothing auto-publishes.

### P0 — Layer access + coverage (read-only) — this week

**Goal:** ChatGPT can enumerate and read the layer corpus, and see the forks.

Deliverables (all deterministic, `--check`, fail-closed):
1. `svread/tools/emit_layers_index.py` → `data/layers-index.json`
   - per work: `targets[]`, `verses`, layers present per target, file sha256,
     `gold`/`machine-proposed` flag, `human_review` state, missing-layer list.
   - reads `translation-work` **read-only** via `TRANSLATION_WORK` env; missing
     checkout = skip, not fail.
2. MCP tools (svread scholar server + public gateway):
   - `layers_index(work?)` — the index, filterable.
   - `passage_layers(work,target,layer?)` — one passage's stack from the
     canonical files (not just the site projection).
   - `translation_forks(work,target?)` — L0 options/fork state + ARGMAP
     `option_choices`/`uncertainties`.
3. Site: `?view=layers` (or a work-page section) showing layer coverage per
   work, with the mirror/honesty labels already used elsewhere.
4. Prompt cards: add "show the layer stack and where it forks" to the reader
   and scholar prompts.

**Exit gate:** for any of the 80 layer works, a clean ChatGPT session can list
its passages, fetch any layer, and see its forks — every response carrying
source sha, layer sha, and status. `emit_layers_index --check` GREEN.

**Owner/lane:** svread (read-only over translation-work). No writes.

### P1 — Make "ChatGPT displays it" a contract

**Goal:** a stable render shape so answers are consistent, not ad-hoc.

- `data/chatgpt/render-contract.md` + a small `render_blocks` helper: which
  fields map to which table/card (verse, deva, iast, en, source, hash, status).
- Bake the contract into the prompt cards (already started) and `ai-catalog.json`.
- Add the same copy-prompt block to static `/claim/` and `/work/` pages.

**Exit gate:** two independent ChatGPT sessions render the same passage to the
same table shape from the same tool output.

### P2 — Coverage + honesty at scale

- Work coverage: source passages vs layer coverage vs human review vs witness
  (four separate numbers, never collapsed).
- Surface the 224 mirror works honestly (already started) and retire the mirror
  when the PG18 authority sync lands.
- Fix `bodhavilasa` / `sivastotravali` / `ipvv` partials (known corpus defects).

**Exit gate:** one coverage page per work, no number without a file.

### P3 — Factory (writes), behind approval

- `translation-work/tools/auto_pipeline.py` (t1→l0→argmap→l2→c1), stamps
  model/date/prompt hash, stops on gate failure, writes only to a private
  candidate area.
- Candidate submission through OpenPatala's service contract (never direct DB).
- Review queue + PUSHBACK destroy pass; human sign; release snapshot.

**Exit gate:** one complete short work runs source → candidate → independent
review → explicit human release, with receipts.

### P4 — Endgame essays (trika-x batch)

- Wire the existing pieces: `crux_queue` → `essay_compile` (voice + frozen
  claims) → v6 → svread audit/pushback → Scholar review → sign → DOI → video
  pack. This is `formal-trika/ENDGAME-ESSAYS.md` executed, not redesigned.
- Priority: finished ground (22 tsa + 14 TAL golds), then speculative, then
  the channeling programme.

**Exit gate:** one signed essay with resolvable claims and a DOI dry-run; the
seven export packets (review_packet) still pass.

### P5 — Recipes R1–R9 (private → owned media)

- Execute `ENDGAME-RECIPES.md` with consent gates: diary → essay → audio →
  video → journey link. Standing invariants: diary private, consent per use,
  revocable, no auto-publish.
- R9 (short movies) stays **not built** until the owner sets the model bar.

**Exit gate:** one recipe end-to-end on the owner's own material, with consent
receipts and human gates; nothing published automatically.

### P6 — Identity + witness + formal coverage (long pole)

- PG18 authority sync; witnesses stay UNPINNED until manuscript eyes;
  formal coverage grows by the queue (16/154 chunks today); second-encoder
  review for Core.

This is the rung that makes us **citable as primary**, and it is gated on
humans and manuscripts, not code.

---

## 4. What this plan deliberately does NOT do

- No second database; OpenPatala owns identity, translation-work owns layers.
- No writes from ChatGPT in P0/P1; read-only first (EXTERNAL-STRATEGY M4).
- No bulk translation or LoRA before a measured baseline (M6).
- No claim that machine drafts are translations; tiers stay on everything.
- No auto-publish, auto-sign, auto-promote.

## 5. Next five actions (start here)

1. Emit `data/layers-index.json` with `--check` (svread tool, reads
   translation-work read-only).
2. Add `layers_index` / `passage_layers` / `translation_forks` to the scholar
   MCP server and the public gateway; test against a clean session.
3. Add the layer-coverage section to `?view=biblio` (or a new `?view=layers`).
4. Extend the ChatGPT prompt cards with "show the stack + the forks."
5. Choose the first complete short work for P3 (rights-cleared, short,
   identified edition) and write its review protocol.

## 6. Honest limits (do not paper over)

- **Witnesses = 0.** Nothing is witness-grade yet (`UNPINNED`).
- **Authority DB on PG18**; this box is a 1,034-work mirror. The mirror file
  surfaces the delta honestly; it is not authority.
- **Human review is the real constraint** for l3 approval, essays, and recipes.
- **License** varies per source (e.g. one source is CC BY-NC-SA 4.0); a hash is
  not a licence. Rights state must travel with every layer.
- Formal coverage is 16/154 chunks; "REGISTERED" means referenced, not proved.
