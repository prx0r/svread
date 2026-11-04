# NIBBANAHELP — the fifth system: personal tension surface + organism

Spec, 2026-11-05. Companion to `../ENDGAME.md` (varieties) and
`../ENDGAME-BUILD-PLAN.md` (ordered tasks). Repository: `prx0r/nibbanahelp`
(other agents are working there — this spec **reads** it; nothing here may
modify that repo without coordinating with its lane).

---

## 1. What nibbanahelp is now (survey, 2026-11-05)

Five live surfaces plus one spec:

1. **Diary + tensions** — dated diaries (1/day), tension entities with real
   status arcs (open → loosening → resolved), root/factor decodes.
2. **Relay chat** — never advises; tiered retrieval (canon → lineage → lived →
   **trika**) over a 1,895-item vector corpus; every session logged with its
   relayed ids.
3. **Personal essays** — speakable, `resolves:` chain into video packs
   (`resolve.py`: read/comic/parable/diagram; evidence refs accept `tension:*`
   **and** `chunk:*` together).
4. **Accounts + journeys** — auth, journeys page, durable D1 → R2 daily
   snapshots (Cloudflare cron).
5. **Journey-ledger spec** (`specs/journey-ledger.md`, NOT BUILT, owner-gated) —
   append-only Merkle log, signed checkpoints, independent witnesses,
   post-quantum-conservative hashes; "tamper-evident, not hack-proof";
   *trace permanent, words withdrawable*.
6. **Trika relay tier** — 104 chunks from `deitybody` via `tools/fetch_trika.py`,
   boosted in the LINEAGE tier.

## 2. Its role in the endgame machine

| System | Role |
|---|---|
| sanskritbench | VERIFY |
| openpatala | IDENTITY |
| translation-work + Scholar | EVIDENCE + AUTHORITY |
| the estate | RAW MATERIAL |
| **nibbanahelp** | **PERSONAL + ORGANISM** — the second tension ontology, the consumer/relay surface, the demand signal, and the lived-experience corpus |

The four integration claims:

- **Tension ontology twin.** A knot about debt and a crux about `apoha` are the
  same node: open → loosening → resolved-by-essay → video. `lingua` resolves
  `tension:*` today; packs cite `tension:*` + `chunk:*` in one evidence list —
  a personal tension essay already hangs on the same tree as a scholar essay.
- **The organism, already built.** The five patalacheckpoints organism docs
  (consumer-as-probe, demand graph, human-understanding) are ASPIRATIONAL over
  there and *running here*: logged questions, tension state changes, counts in
  the vis. The "Q moat variable" is measurable in sessions today.
- **The bridge, one direction live.** The trika tier means gate-checked Sanskrit
  already answers personal questions. The reverse is the prize: recurring
  unanswered session questions become the essay/explainer queue — personal
  demand steering what the scholar writes next.
- **Convergent legitimacy.** The journey ledger (transparency-log: Sigstore
  Rekor pattern) and our chain (audit receipt + openpatala Merkle events + git
  identity + Zenodo) invented the same spine independently. When it gets built,
  one shared design doc — **one legitimacy pattern, two systems**, not two.

## 3. What needs to be done (ordered)

| # | Task | Status now | Why |
|---|---|---|---|
| **N1** | **Sessions → tension/crux queue exporter.** Read-only script in *our* lane (svread/translation-work side): parse `sessions/*.json`, mine recurring unresolved questions + repeated relay ids, emit queue candidates into the Treeka gap report / Phase-3 crux queue. Never generates advice; question mining only. | missing — highest value, small | Closes the demand loop: what people actually ask decides what gets explained. |
| **N2** | **Slang register → relay + explainer tier.** Decide (owner): Tantrasāra slang editions as a clearly-labeled `explainer` tier in the relay (never scripture), and/or as the video chapter source. Input ready (`awesome-essays/tantrasara*`). | decision needed | Conversational explaining in the tradition's plain register — Variety 4's other half. |
| **N3** | **Journey ledger build — OWNER-GATED.** Spec says do not build until yes. When yes: one shared design doc with openpatala/signoff (Merkle append-only + signed checkpoints + witnesses + content-addressed bytes). | spec'd, not built | Prevents two legitimacy spines. |
| **N4** | **Trika corpus refresh recipe.** Document/automate `fetch_trika.py` → `build_index` → upload, and note translation-work passages as a future additional source (owner decision). | works, refresh manual | The one bridge direction must not rot. |
| **N5** | **Personal essays → publishing? (decide later).** Default stays local/private. If the owner ever wants personal essays published, reuse the same signoff/rights/audit chain — never a second one. | open decision | Consistency, not automation. |

## 4. Guardrails (non-negotiable, inherited)

- **VOICE RULE**: only the diarist's words are the diarist's words. No agent
  cements an invented personal line.
- **Visibility defaults**: private unless the diarist flips; grants explicit.
- **No laundering**: personal content never enters a scholarly artifact without
  an explicit per-version grant (same permission contract as essays).
- **Relay stays relay**: never advises; tiers labeled (trika/lived are not
  scripture; scripture is not therapy).
- Other agents' lane: coordination required for any write inside
  `nibbanahelp` — this spec lives in svread and only reads.

## 5. Fold-in points

- N1 → `ENDGAME-BUILD-PLAN.md` Phase 2 (loop closure).
- N2 → Phase 2/3, owner decision.
- N3 → Phase 3 (autonomy), owner-gated.
- Evidence/pack/lingua work for this integration is **already done** (§3 status).
