# ENDBAME BUILD PLAN — what this became, the roles, the granular plan

Session handover, 2026-11-05. Read this first tomorrow. Companion docs:
`RESOURCES.md` (inventory), `ENDGAME.md` (shape + varieties), `SCHOLAR-ENDGAME-SPEC.md`
(operational contract), `SCHOLAR-ENDGAME-VISION.md` (owner words verbatim),
`translation-work/BUILD-2026-11-04-P0.md` (P0 build log).

## 0. MASTER SEQUENCE (owner, 2026-11-05 — this is the order)

Verbatim in `SCHOLAR-ENDGAME-VISION.md`. Execute in this order:

1. **Get everything openpatala** → uniform source records (§Phase 0.1) +
   chunk↔openpatala bridge (§Phase 0.2) + register **IPVV and our 86 works**
   (IPVV is currently absent from openpatala's translation-availability; our
   chunk ledgers point nowhere upstream).
2. **All translations sanskritbenched** → sanskritbench Phase 1 tau table +
   gate-vs-gold calibration + proof-gate sweep over existing translations
   (state: 951/1,240 site rows PASS; TĀ 0/605 gate-PASS).
3. **IPVV + Tantrāloka fully translated and sanskritbenched** → the
   translation track. **Lane note:** translation-work is owned by other agents
   (gold batch running: 42/42 CANONICAL pattern proven) — coordinate; this plan
   tracks it, does not write it. sanskrithelp's TRANSLATION_FRONTIER targets
   (5 phonemic-body texts) queue here (`endgame/SANSKRITHELP-INTEGRATION.md` SH3).
4. **All datastructures** → Phase 0 remainder: decision trail at ingest,
   ARGMAP nodes, source-map sidecar.
5. **Pathways + content** → Treeka view, syllabus C1–C4 (VBT pilot; module
   imported at `/root/satsang-practice`), courses, vids.

**Tomorrow's first move: step 1 — openpatala-ize.** (The tau table of §4.1 is
step 2's opener and stays ready: `validate_benchmark.py --dry-run` first.)

---

## 1. What this has become

Started as a scholar workspace (draft → review → sign → publish). It is now a
**four-system machine for autonomous scholarship with a human signature**:

```
Svatantrya agent proposes  →  gates/audit verify  →  scholar signs under their name
      (drafts, essays,           (nothing unsigned        (rights, git identity,
       videos, cruxes)             survives)                Zenodo DOI)
```

The endgame one-liner: *a hard question about a Trika text walks down to a witness
and back up to a signed, DOI'd essay* — with every link hash-pinned, decision-tracked,
and gate-checked. Commodity generation, scarce provenance. The owner is the root
signature; nothing publishes without it.

## 2. The four systems and their roles

| System | Role | State |
|---|---|---|
| **sanskritbench** | **VERIFY** — the legitimacy engine. Gold control (5,601 exemplars + Mitrasāmgraha 5,552 + IPVV 49 + frontier 14,138 + MQM annotation), the deterministic proof gate (SOURCE_BINDING/COVERAGE/ABSTENTION/TERM_CONSISTENCY/CITATION_GROUNDING — *the lineage of translation-work's GATE.json*), the COMET-vs-chrF meta-eval (Kendall's tau, WMT protocol), `experiment_lab` + `run_recorder` (content-addressed logged numbers), lemma spine (ByT5 + Vidyut → school/period sense → persona LoRA). Hermes skills/goals/kanban: cannot mark done without a logged verified result. | Foundation DONE; Phase 1 (tau table) pending |
| **openpatala** | **IDENTITY** — the witness root. 1,099 works, 11 adapters, Work→Edition→Witness→Surrogate→EText ladder, R0–R5 resolver, Merkle event ledger, run_recorder/trace. Answers "which edition/witness is this passage?" Machine-verified (6 proofs, 26 gates, red-team 4/4). Mirrored to `patala` R2 bucket. | Built; bridge to our chunks = next |
| **translation-work + scholar stack** | **EVIDENCE + AUTHORITY** — the layers (T1→L0→L2→L200→C1→L3→L4) with per-song gates and proofs; ARGMAP (question/premises/conclusion/unresolved per passage); Scholar workspace (drafts, decisions, review, signoff with rights, bridge → git → release → permissions, MCP 30 tools, Qwen text live, voice wire-proven). | Live; `scholar/` on 1 work, source binding uneven |
| **satsang · tantrasara · deitybody** | **SURFACES** — TV/distribution + community + day-gated journeys (satsang, live), video gen factory (tantrasara, running), practice/syllabus (deitybody). Spec: `endgame/SATSANG-INTEGRATION.md` | Live / batch / backend; day-counter + syllabus compiler + content loop to wire |
| **nibbanahelp** | **PERSONAL + ORGANISM** — second tension ontology, relay chat (canon/lineage/lived/trika), demand signal, lived corpus, journey-ledger spec (owner-gated). Spec: `endgame/NIBBANAHELP-INTEGRATION.md` | Live; sessions→queue exporter missing |
| **The estate** | **RAW MATERIAL** — awesome-essays (1,195; 90 curated), research-library (~900), philosophy archive (1,933) with the STRUCTURE/ACQUIRE/WEAVE/PUSHBACK kits, 22 IPVV essays, slang editions (tantrasara1–22 + shivasutrasfinal), pushing catalog (57 cruxes), nibbanahelp tensions. | Indexed (1,177 starters) |

**Integration (how they connect):**
- `chunk:work:target` ↔ openpatala Work/Witness IDs (mapping file + adapter — missing, #1 below).
- translation-work gates ← sanskritbench `translation_proof.py` checks (shared lineage; keep in sync).
- sanskritbench gold + tau calibrates every automated signal the scholar stack trusts.
- audit_draft receipts + openpatala run records + sanskritbench run_recorder = three independent legitimacy logs.
- essays → packs → slang → factory (video); essays → Zenodo bundle (token pending).

## 3. Known flaws → fix (drives the plan)

| Flaw | Fix | Phase |
|---|---|---|
| No decision trail at layer ingest (machine default can become "the" reading unsigned) | layer acceptance writes decision rows; machine-proposed flagged, human-accepted signed | 0.3 |
| Witness gap: source binding uneven (SOURCE.sha only on some works) | uniform source record + openpatala bridge | 0.1–0.2 |
| Prestige laundering: high-status signoff ≠ read | audit PASS required + human action log; disclosure (`assisted`+model) on every artifact | 0.3, 4 |
| Monoculture: one model judging itself | cross-family destroy pass (PUSHBACK), disagreement surfaced | 2.2 |
| No ground truth on meaning (gates check structure) | tau table, gold calibration, COMET/COMETKiwi as thresholded signal, round-trip | 1 |
| Rubber-stamping | signoff requires audit PASS + time-per-signoff floor + sampling re-audit | 0.3 |

## 4. Immediate next steps (and why)

1. **sanskritbench Phase 1 — the tau table.** Why first: it is the *proof* that
   our combined metric + gate ranks translations like a human judge better than
   chrF does. Everything downstream (thresholds, "legit beyond doubt") calibrates
   against this number. No GPU; free models; logged via run_recorder.
   `python3 pipeline/validate_benchmark.py --n 3 --m 3 --dry-run` → real run.
2. **Chunk ↔ openpatala bridge.** Why: without it every claim stops at
   "projection + GRETIL note," not at a witness. One mapping file
   (86 ledgers → its Work IDs) + small adapter; then Treeka's root is witness-grade.
3. **L0/layer decision-trail wiring.** Why: the owner's own flaw — signed
   foundations before higher rungs. Uses the existing decisions table; small.
4. **PUSHBACK pass + Zenodo token.** Why: these two close Variety 1 (signed essay
   with DOI) completely. PUSHBACK = cross-family destroy pass over audit_draft
   output; token = one value from the owner.
5. **Slang register → chat + treeka.py view.** Why: Varieties 4 and 5 — the
   conversational teacher and the gap-reporting tree, both with substrate ready.

## 5. Granular dev plan — pristine data structures from the foundation up

**The invariant (never violate):** no rung ships until it carries
`hash + decision/grounds + gate + signer-role`. Higher rungs may not exist on
unsigned lower rungs. This is the ordering law.

### Phase 0 — Foundation integrity (data structures first)
- **0.1 Uniform source record.** Every one of the 86 works gets the tantrasara
  pattern: `SOURCE.sha` + `SOURCE.txt` (publisher, edition, retrieval date) or an
  explicit `source: unknown` record. No work silent about its origin.
  *Done when:* `check.py` reports 86/86 with a source record.
- **0.2 openpatala bridge.** Mapping file `source-map.json`
  (`work` → openpatala Work ID + witness siglum) + adapter script; projections
  gain an optional `source_ref`. Read-only into openpatala first (no writes back
  into translation-work files beyond the new sidecar).
  *Done when:* `lingua resolve chunk:tsa01-p01` chains to a witness ID.
- **0.3 Decision trail at ingest.** L0 chosen_index + L2/L4 acceptance write
  decision rows (`subject: layer-accept:<work>:<target>`, grounds, reviewer,
  revision). Machine-proposed rows carry `proposed_by: <model>`; only
  human-accepted rows count as signed. Signoff gate requires zero unsigned
  load-bearing decisions on the submitted snapshot.
  *Done when:* a submission with an unsigned layer decision is refused (409).
- **0.4 ARGMAP → machine nodes.** Parse each `ARGMAP.md` into
  `argmaps/<work>.jsonl` (question, premises[], inference, conclusion,
  unresolved[], passage locators). `unresolved` entries become crux candidates
  in the tensions graph automatically.
  *Done when:* treeka gap report shows argued/unargued passages per work.
- **0.5 `scholar/` pattern rollout.** Script the paramarthasara layout
  (versions.jsonl, reviews.jsonl, essays/) for any work on demand — no new
  schema, just the convention instantiated.
  *Done when:* one more work (e.g. spandasandoha) carries a scholar ledger.

### Phase 1 — Verification (sanskritbench)
- **1.1 Tau table** on Mitrasāmgraha gold (n=3, m=3 first, then scale):
  chrF vs bleu vs combined vs proof-gate vs semantic-judge, logged.
- **1.2 Gate-vs-gold calibration:** run `translation_proof` over gold positives
  and deliberately corrupted candidates; measure false-PASS/false-BLOCK rates;
  tune thresholds; stamp threshold version on results.
- **1.3 COMET/COMETKiwi baseline** (torch/GPU, later): off-the-shelf first,
  domain-tune only if it loses to chrF on 1.1's protocol.
- **1.4 Ensemble thresholds:** cross-family LLM-judge disagreement + round-trip
  diff as additional signals; each with a threshold from 1.2; no signal
  auto-passes alone.

### Phase 2 — Loop closure (Treeka + varieties)
- **2.1 `treeka.py`** — read-only assembler: works → passages → ARGMAP nodes →
  glossary anchors → cruxes → essays + gap report (unargued passages, cruxless
  arguments, essayless cruxes).
- **2.2 PUSHBACK pass** — CLI/MCP stage: cross-family destroy pass over any
  draft after audit_draft, before human review; output = resolution +
  honest-remainder (kit format).
- **2.3 Zenodo** — owner token → first sandbox DOI → prod.
- **2.4 Slang register** into chat mode (consent-gated context) + voice browser
  session observation.
- **2.5 nibbanahelp N1** — sessions → tension/crux queue exporter (read-only,
  our lane): recurring unresolved questions feed the Treeka gap report and the
  Phase-3 crux queue. See `endgame/NIBBANAHELP-INTEGRATION.md`.

### Phase 3 — Autonomy (the propose loop)
- **3.1 Crux queue** — §2.1 gap report + pushing catalog → prioritized queue.
- **3.2 Svatantrya proposes** — agent drafts per queued crux under the owner's
  account (assisted flagged), runs audit + PUSHBACK, leaves a proposal for the
  scholar; scholar edits → signs → publish. Quota-limited, never auto-sign.
- **3.3 Video** — slang chapters → packs → tantrasara factory; packs carry
  evidence refs (already fail-closed).
- **3.4 nibbanahelp N2/N3/N5** — slang tier in relay (owner decision), journey
  ledger build under ONE shared legitimacy design with openpatala (owner-gated),
  personal-essay publishing reuse (decide later). Guardrails: VOICE RULE,
  visibility defaults, grants explicit.
- **3.4 External scholars (later)** — V08 economics: paid adjudication, ORCID/
  CRediT credit; only after Phases 0–2 are pristine.

### Phase 4 — Surfaces (owner-driven, per `endgame/SATSANG-INTEGRATION.md`)
- **4.1 S1 day-counter** — Day N = count of posting days only (never calendar);
  one journey truth across satsang, nibbanahelp, journey ledger.
- **4.2 S2 guided-session proof** — source → deitybody protocol → Qwen realtime
  speaks from gated passages → logged journey block.
- **4.3 S3 syllabus compiler — Trika, aimed at Tantrāloka** (full spec:
  `endgame/SYLLABUS-COMPILER.md`) — retarget satsang's shipped text→practice
  pipeline (keep machinery + laws, replace content target): three spines
  (TS six questions · TĀ 37-āhṇika order · deitybody eight-phase), unitize →
  type → **eligibility gate** (text-study vs doable vs requires-dīkṣā) → path
  assembly with lingua IDs. Phases: C1 one practice unit rendered → C2 all 37
  āhṇikas classified → C3 path IDs + Series + practice proposals → C4 loop
  closure (day-gate, request→vid, For-You).
- **4.4 S4/S5 content loop** — packs/chapters → tantrasara factory → satsang
  Watch/For-You; generated-vs-catalogue labels always on.
- **4.5 S6/S7** — journey-ledger witnesses shared (owner-gated); three
  owner flips (domain, sit player, OAuth origin).

### Definition of done for the whole plan
One question asked in chat → agent retrieves witness-pinned passages → drafts in
recorded voice → audit + PUSHBACK PASS → owner signs → release + DOI → video
optional — and an outsider can replay every link from the DOI back to the
manuscript witness using only the three legitimacy logs (audit receipts,
openpatala events, sanskritbench runs).
