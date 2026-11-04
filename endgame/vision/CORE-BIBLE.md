# THE CORE BIBLE — one vision, zoomable into layers

*2026-08-12. The single canonical vision, chunked into **layers of scope** — like zooming into a map.
Every vision doc in the repo is one zoom-level of THIS ONE vision, not a separate product. The rule:
**there is ONE vision; the layers are the same truth at different resolutions.** Start at the top
(Layer 0) and zoom in as deep as your work needs. Each layer links down (deeper detail) and up (context).*

---

## HOW TO READ THIS (the zoom model)

```
LAYER 0 — THE ONE SENTENCE (the whole vision in a line)
   ↓ zoom in
LAYER 1 — THE ONE PARAGRAPH (what + why)
   ↓ zoom in
LAYER 2 — THE DERIVATION GRAPH (the spine: Sanskrit → … → media)
   ↓ zoom in
LAYER 3 — THE CHECKPOINTS (what's real vs what's left, measured)
   ↓ zoom in
LAYER 4 — THE DOMAIN LAYERS (each lens on the same vision)
   ↓ zoom in
LAYER 5 — THE SPECS / GOLD / DATA (the ground truth each layer consumes)
```

Each layer is **the same vision at a different scope.** None is a separate product. To go deep on any
one, follow the links.

---

## LAYER 0 — THE ONE SENTENCE

> **Pāṭala makes one historically-grounded scholarly tradition fully computable: a single evidence graph
> from Sanskrit to scholarship to media, where every claim resolves to its source, and the whole thing
> reproduces across traditions.**

---

## LAYER 1 — THE ONE PARAGRAPH

We are building a **computable scholarly tradition**: a single evidence graph over Sanskrit sources
(source → translation → decision → commentary → theme → claim → essay → pedagogy), where every layer is
machine-queryable, every claim resolves to its source, and any reader — scholar or beginner — can enter
at the depth they need. The IPVV is the flagship; the architecture is agnostic and generalizes to any
text (Tantra now, then Yogic/Vedānta, Buddhism/Greek/Nyāya). **One trustworthy scholarly core, rendered
as many media projections.**

**Canonical doc:** `VISION_AND_NAVIGATION.md` (the single entry point).

---

## LAYER 2 — THE DERIVATION GRAPH (the spine)

```
SOURCE → L0/L1 → L2 READ → L200 AUDIT → C1 COMMENTARY → THEMES → ARGUMENT → SYNTHESIS → WORKBENCH → API/MCP
                                   → MEDIA (Vision 09): essays / shorts / video / AI-teacher
   (the canonical production stack — L200 is the proof-carrying audit seam between L2 and C1;
    see docs/global/PATALA-GLOBAL-ARCHITECTURE.md, Plane 4A)
```

Every higher node points downward; every node's status is honest (`DETERMINISTIC_FACT |
MACHINE_PROPOSED | HUMAN_REVIEWED | ACCEPTED`). Nothing is real because code exists.

**Canonical docs:** `machinelearning/_ACTIVE/dualagentvision.md` (master graph) +
`dualagentvision-ADAPTED.md` (mapped to our infra).

---

## LAYER 3 — THE CHECKPOINTS (what's real vs what's left)

```
CP0 BENCHMARK · CP1 SOURCE PROOF · CP2 RETRIEVAL · CP3 THEMES · CP4 ARGUMENT · CP5 VERIFICATION
CP6 SYNTHESIS · CP7 WORKBENCH · CP8 ADVERSARIAL REVIEW · CP9 API/MCP · CP10 COLLAB · CP11 ECONOMIC · CP12 CROSS-CORPUS
```
**Real state (honest):** CP0 DONE · CP1 PARTIAL(L0) · CP2 PARTIAL · CP3 PARTIAL · CP4 PARTIAL · CP5–6
PARTIAL · CP7+ NOT STARTED. Live tracked in `handover/STATE.yaml` via `flow.py status`.

**The ACTIVE work right now (2026-08-12):** **CP4 — the argument layer.** The 5 gold arguments
(ARG-001..005) are built and internally consistent, but still **`CANDIDATE` (unreviewed)**. The gate to
CP4-real is: **independent review of the golds** (see `machinelearning/research/experiments/ARG-GOLD-REVIEW-PROTOCOL.md`),
then a real extractor that beats the baseline, then the Nyāya/evaluator machinery over real `Inference`
objects. This is the bridge that unblocks the media layer and cross-tradition. Every session updates
this via `handover/flow.py update agent1 CP4 ...`.

**Canonical doc:** `handover/CHECKPOINTS.md` + the live state.

---

## LAYER 4 — THE DOMAIN LAYERS (each lens on the same vision)

Each is the ONE vision viewed through one lens. All interdependent — each consumes the one below.

| Lens | The vision viewed as… | Canonical doc | Feeds / is fed by |
|---|---|---|---|
| **4a. The Scholarly Factory** | the source→translation→commentary pipeline | `onboarding/README.md` (Stages) + `THE_COMPANION.md` | feeds everything |
| **4b. The Discovery Engine** | Pushing — hound a text with "why" to find its arguments | `skills/push-text` + `research-library/pushing` | feeds 4c (arguments) |
| **4c. The Philosophy IR** | argument-under-interpretation: Commitments, Frames, Alignments, Regimes, Cruxes | `machinelearning/_ACTIVE/ARGUMENT-IR-VISION.md` | the heart of CP4–CP5 |
| **4d. The ML Layer** | learnable + verifiable: benchmark, retrieval, extraction, gate | `handover/agent-1-ml/ML-MECHANICS-REFERENCE.md` | measures 4a–4c |
| **4e. The Agent System** | who does it + tracked progress (template→instances) | `handover/SYSTEM.md` + `AGENTS.yaml` | coordinates all lanes |
| **4f. The Product Endgame** | the interfaces: essays, workbench, review, economics | `docs/vision/INDEX.md` (Vision 01–09) | consumes 4a–4e |
| **4g. The Media Layer** | the scholarly core rendered as media + cross-tradition | `docs/vision/vision-09-*.md` | consumes 4c (arguments) |
| **4h. The Economics** | scarce assets + scholar incentives | `docs/vision/vision-08-*.md` + `endgame4.md` | sustains the whole |

### The three human/tool/value lenses (the sub-folders of Layer 4)
These three lenses carve the SAME vision by who/what/why — each is its own folder with a README that
assigns the existing docs (content untouched) + the relationships:

| Lens | Folder | The vision viewed as… | The loop |
|---|---|---|---|
| **FUNCTIONALITY** | `docs/vision/functionality/README.md` | the tools + machinery + interfaces | gives scholars the workbench |
| **EXECUTION (Hermes)** | `docs/vision/functionality/hermes-execution.md` + `handover/hermes/` | the replaceable execution kernel (kanban, cron, worktree, skills, sessions) that operationalizes every projection | runs the factory + review + projections |
| **SCHOLARS** | `docs/vision/scholars/README.md` | the human layer — the contributors whose judgment is the moat | produces the expert data |
| **ECONOMICS** | `docs/vision/economics/README.md` | the sustainability — scarce assets + the flywheel | turns the data into revenue + fellowships |

```
FUNCTIONALITY → SCHOLARS (the workbench) → ECONOMICS (the data capital + flywheel) → FUNCTIONALITY (better tools)
                                          ↕
                                    THE SCHOLARLY CORE (what every claim resolves to)
```
These are the three spokes around the same scholarly core — the same vision at Layer 4, seen through
what we build, who does it, and what sustains it.

---

## LAYER 5 — THE SPECS / GOLD / DATA (the ground truth)

The lowest zoom — the actual objects each layer consumes:
- **The corpus:** IPVV passages, chunks, L0, L2, C1 (63 files) — the substrate.
- **The gold:** `benchmarks/v0/` (frozen) + ARG-GOLD-001/002 (the seed evidence).
- **The specs:** `docs/INDEX.md` (the flat canonical map) — the single source of truth per concern.
- **The imports:** `machinelearning/_ACTIVE/PATALA-ENGINE-ROADMAP-12MO.md` + the `PHILOSOPHY-ENGINE-*`
  reviews (the strategy references the roadmap/IR draws from).

---

## THE INTERDEPENDENCE (why the layers are ONE vision, not separate docs)

```
Layer 0-1 (the sentence/paragraph)  ← the WHY
   ↓  made concrete by
Layer 2 (the graph)                 ← the SPINE
   ↓  measured by
Layer 3 (the checkpoints)           ← the WHAT'S LEFT
   ↓  lensed through
Layer 4 (the domain layers)         ← the HOW (each a view of the spine)
   ↓  grounded in
Layer 5 (specs/gold/data)           ← the TRUTH under every layer
```

**Nothing at Layer 4 is a separate product.** The philosophy IR (4c), the media layer (4g), the
economics (4h) are all projections of the SAME spine (Layer 2). Zooming in on any of them shows the same
core. This is what "one vision, several interfaces" (Vision 03) means as a *documents* structure.

---

## THE UPDATE PROTOCOL (keep it a living bible)

1. **The top (Layer 0–2) changes rarely** — only when the vision itself shifts.
2. **The middle (Layer 3–4) changes as checkpoints move** — update via `handover/flow.py` (live state)
   + the canonical doc per lens.
3. **The bottom (Layer 5) is where the work lives** — gold, data, specs.
4. **A new vision doc = a new zoom-level or a new lens at Layer 4** — register it in `docs/vision/INDEX.md`
   AND this bible, never leave it orphaned.
5. **Interdependence rule:** every layer names what it consumes and feeds. If a doc's inputs/outputs
   aren't clear, it's not fully integrated.

---

## THE ONE-SENTENCE CARRY-FORWARD

**There is ONE Pāṭala vision — a computable scholarly tradition — and all the vision docs are the same
truth chunked into zoomable layers: the sentence (0), the paragraph (1), the derivation graph (2), the
checkpoints (3), the domain lenses (4), and the specs/gold/data (5). The layers are interdependent
projections of one spine, not separate products; keep the top stable, the middle live (via flow.py), the
bottom full of real work — and register every new doc in both `docs/vision/INDEX.md` and this bible.**
