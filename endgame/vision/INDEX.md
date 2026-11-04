# PĀṬALA VISION — INDEX

*2026-08-12. The canonical map of Pāṭala's vision/strategy/product docs. One place to see the whole
strategic picture. This index is the single gate for "what is the vision" — add any new vision doc
here and in `docs/INDEX.md`.*

> **For the clean CATEGORY taxonomy (8 distinct categories, each mapped to a Layer), see
> `docs/vision/CATEGORIES.md`.** This index is the fuller reference; CATEGORIES.md is the organized view.
>
> **For the CANONICAL REVIEW INDEX (every vision doc → proper name · contribution · layer · build status,
> machine-parseable for an agent), see `docs/vision/REVIEWS.md`.** That is the agent-resolvable reference;
> this INDEX is the narrative guide.
>
> **For the MACHINE-VERIFIABLE manifest (every doc → one distinct role/name/file; the anti-redundancy
> check), see `docs/vision/VISION-MANIFEST.json` + `docs/vision/check_manifest.py`.** Run
> `python3 docs/vision/check_manifest.py` to verify no two vision docs share a role.

---

## How to read this

- **Canonical** = read/trust for that concern.
- **THE CORE BIBLE (`docs/vision/CORE-BIBLE.md`) = the top-level map** — one vision chunked into 6
  zoomable layers (sentence → paragraph → graph → checkpoints → domain lenses → specs/gold/data). Start
  there for the whole picture, then zoom into any layer here.
- The vision unfolds as a **sequence (Vision 01 → 13)**. Read in order for the full arc.
- Each doc is its own file; none is superseded — they are complementary layers of one vision.
- Original, un-numbered strategy docs (NORTHSTAR, foundationalideas, positioningpartners) are
  canonical but sit outside the numbered sequence; they are cross-referenced below.

---

## Recommended reading order (open these in this order)

New here? Do not read the whole surface top-down. Follow the arc:

1. **`docs/vision/CORE-BIBLE.md`** — the whole vision in one zoomable map (start + return point).
2. **`docs/endgame1.md` → `docs/endgame5year.md`** (Vision 01–05) — the origin arc: the translation
   laboratory, the Tantra Hub reframe, one infrastructure/many surfaces, the economics, the window.
3. **`docs/vision/vision-06-adversarial-review.md` → `docs/vision/vision-10-market-entry-and-partnerships.md`**
   (Vision 06–10) — the scholar-facing product: review, workbench, incentives, media, market entry.
4. **`docs/vision/vision-12-multi-surface-platform.md`** + **`docs/vision/vision-13-product-portfolio-by-user-base.md`**
   (Vision 12–13) — how it all re-renders as one core into role-based surfaces and a product catalog.
5. **`docs/vision/expansion/vision-11-siva-before-abhinava.md`** (Vision 11, but read here) — the *next* corpus
   expansion: the Śaiva genealogy. It connects forward into the IPVV work you're already doing.
   Its **deep-prehistory companion** (`docs/vision/expansion/vision-11-siva-before-abhinava-prehistory.md`)
   walks the source tree further back (Vedic Rudra → Proto-Indo-Iranian → PIE → Indus).
6. **`docs/vision/functionality/hermes-execution.md`** — the bridge from strategy to *execution*: which
   vision files the Hermes kernel operationalizes.
  7. **The lenses** — `docs/vision/functionality/README.md`, `docs/vision/scholars/README.md`,
     `docs/vision/economics/README.md` — the same vision at Layer 4 (tools / people / value), to taste.
8. **The education lens** — `docs/vision/education/PATALA-EDUCATION-SYNTHESIS.md` (the current, most-complete
   statement, imported from R2) + `docs/vision/education/LEARNING_STRATEGY.md` (content strategy) +
   `docs/vision/education/EDUCATION_VISION.md` (graph-native teaching engine) + `docs/vision/education/sources/`
   (raw imported design dialogue).
 9. **The source-resolution lens** — `docs/vision/source-resolution/source-resolver-design.md` — the
    **federated edition/manuscript resolver**: Work → Edition → Witness → Surrogate → Transcription → E-text
    → SOURCE, with the authority ladder (DISCOVERED → … → SCHOLAR_CONFIRMED), the Sanskrit-specific authority
    stack (NCC, NMM/Pandulipi Patala, NGMCP, SARIT, GRETIL, Muktabodha) + book catalogs + IIIF, and the
    reconciliation pattern (no automatic authority promotion). This is the layer *below* the factory that the
    verification work (pipeline/verify_editions.py) and manuscript vision (Vision 14) build on.
 10. **The manuscript / OpenPāṭala lens** — the manuscript-ingest + Atlas-build vision:
    `docs/vision/vision-14-manuscript-to-scholarly-asset.md` (upload → label → route → process → expose) +
    `docs/vision/vision-15-patala-atlas-sanskrit-research-graph.md` (the Atlas = "OpenAlex for Sanskrit") +
    `openpatala/README.md` (the build folder + imported OpenAlex reference docs) +
    `docs/vision/atlas/technical-architecture-v1.md` (the authoritative Architecture v1: the Pāṭala
    Authority Graph + full SQL/Pydantic schema + 3 P0 corrections) +
    `docs/vision/atlas/atlas-engineering-blueprint.md` (Postgres=R2=event-log storage; I1–I6) +
    `docs/vision/atlas/atlas-cloudflare-edge-layer.md` (Neon/Postgres canonical, Workers API + Hyperdrive +
    R2, factory self-hosted) + `docs/vision/atlas/atlas-performance.md` (compute-on-write doctrine;
    immutable versions = cacheable; agent bundles; Astro islands; Rust for hot kernels) +
    `docs/vision/atlas/agent-optimization.md` (the agent product surface: discoverability, 7 MCP tools, token budgets, evals) +
    `docs/vision/functionality/research/2026-08-12/06_ATLAS/RESEARCH_AND_BUILD.md`
    (the endgame-build project). This is the current forward build — the foundation (B) before the vertical (C).
  8. **Foundational deep-dives** — `docs/NORTHSTAR.md` (deepest strategy), `docs/foundationalideas.md`
     (the passage-identity idea), `docs/positioningpartners.md` (positioning).

> **Program guide (un-numbered, canonical):** `docs/vision/essayguide.md` — the essay/education/
> review/external-tools research-program guide (`ESSAY-RESEARCH-v1`). Essay is not a text generator:
> thesis selection, EssayArgumentGraph, literature positioning, contribution detection, rhetorical
> compression, whole-document evaluation. Includes the education layers (skill ontology, misconception
> graph, proof-of-understanding, transfer, progressive zoom), the PĀṬALA REVIEW platform, the five
> external-tool classes, and the four program benchmarks (ESSAY-BENCH / EDU-BENCH / REVIEW-BENCH /
> RESEARCH-TOOLS-BENCH). This is the roadmap for making Essay a first-class research science over the
> same canonical graph.

> Why step 4 before step 5? Vision 12/13 are the *current* product frame; Vision 11 is the *next*
> corpus. Read the current frame first, then the expansion you will actually build toward.

---

## The numbered vision sequence

| # | Doc | Focus (one line) |
|---|---|---|
| **01** | `docs/endgame1.md` | The translation-laboratory endgame — machine-assisted critical translation from witnesses to auditable publication. |
| **02** | `docs/endgame2.md` | Endgame Spec 2 — the **Tantra Hub**: living bibliography + text-reader + translation-workshop + commentary + media. The current destination reframe. |
| **03** | `docs/endgame3.md` | Endgame Spec 3 — **one scholarly knowledge infrastructure, several interfaces** (not separate projects). |
| **04** | `docs/endgame4.md` | Endgame Spec 4 — the **economic thesis**: scarce assets = source data + rights + provenance + expert judgment. |
| **05** | `docs/endgame5year.md` | Endgame Spec 5 — **2026–2031 strategic window** (manuscript digitisation money, IKS funding, DH, AI). |
| **06** | `docs/vision/vision-06-adversarial-review.md` | **Pāṭala Review** — adversarial scholarly review + the research compiler (scholar-facing API mega-product). *(new, from R2)* |
| **07** | `docs/vision/vision-07-new-scholar.md` | **The New Scholar** — workbench, perspective collector, research-graph scholarship. *(new, from R2)* |
| **08** | `docs/vision/vision-08-scholar-economics.md` | **Scholar Incentives & Economics** — paid adjudication, ORCID/CRediT credit, ownership. *(new, from R2)* |
| **09** | `docs/vision/vision-09-media-and-cross-tradition.md` | **The Media Layer & Cross-Tradition Engine** — the scholarly core rendered as shorts/video/essays/AI-teacher (Workengestation = written voice, Renderio = video), then reproduced across traditions (Tantra → Yogic → Vedānta → Greek). |
| **10** | `docs/vision/vision-10-market-entry-and-partnerships.md` | **Market Entry & Partnerships** — academic partners (BHU + global scholars), funding/fellowship sources, institutional models, outreach, low-cost pilots, legal/IP, metrics. *(new, from R2)* |
| **11** | `docs/vision/expansion/vision-11-siva-before-abhinava.md` | **Śiva Before Abhinava** — the genealogy of Śaiva ideas as the next major corpus: six chronological corpora (Rudra→Śiva→Pāśupata→Early Tantra→Bhairava/Kaula→Kashmir) + three cross-cutting graphs (concept, cosmology, argument), ending at Abhinavagupta and connecting into IPVV. *(new, from R2)* |
| **11b** | `docs/vision/expansion/vision-11-siva-before-abhinava-prehistory.md` | **Śiva Before Abhinava — deep source tree**: extends the Śaiva genealogy backward from the Ṛgveda through Proto-Indo-Iranian → Proto-Indo-European → Indus/prehistoric South Asia (~4500 BCE). Defines the evidence ladder (textual → comparative reconstruction → archaeological correlate → speculative), the parallel Indus branch (typed hypotheses only), and proposes Ṛgveda + Avesta as the deepest corpus inputs. *(new, from R2 `sivahistorical`)* |
| **12** | `docs/vision/vision-12-multi-surface-platform.md` | **The Multi-Surface Platform** — one scholarly core (graph + MCP/API + executable-corrections engine) rendered through five permission-scoped surfaces: consumer (educational, read-only) · scholar (Workbench, propose + scoped submit) · contributor (manuscript ingestion) · developer (MCP/API) · reviewer (adjudication, strongest boundary). Grounded in the review-engine authorization policy. *(new)* |
| **13** | `docs/vision/vision-13-product-portfolio-by-user-base.md` | **The Product Portfolio by User Base** — the cohesive product catalog aligning every vision doc to a surface: scholar (translation audit/rating, adversarial review, comparison, term audit, the PĀṬALA-IPVV benchmark, research compiler, workbench, bounties/credit) · consumer (Tantra Hub, atlas, learning, media) · contributor (manuscript, critical editions) · developer (API/MCP/protocol) · reviewer (queue, adjudication, credit). *(new)* |
| **14** | `docs/vision/vision-14-manuscript-to-scholarly-asset.md` | **Manuscript → Machine-Readable Scholarly Asset** — "Muktabodha, but derived": every text becomes a Pāṭala-derived version (translated, tagged with school/period/lemmas, provenance-bearing, API-exposed). The granular quality ladder, manuscript auto-ingest (upload → label → route → process → expose), the read API, and reuse-first links to Muktabodha/GRETIL/IFP/EFEO. Mostly wraps the built factory — next steps are the read API + bibliography gap + ingest routing. *(new)* |
| **15** | `docs/vision/vision-15-patala-atlas-sanskrit-research-graph.md` | **The Pāṭala Atlas — "OpenAlex for Sanskrit"** — promote the bibliography to the authoritative research graph the factory is downstream of. Models **textual transmission** (Work→Edition→Witness→Surrogate→Transcription→E-text→Source, kept distinct), reconciled lazily across NCC/NMM/NGMCP/GRETIL/SARIT/Muktabodha + library catalogs + IIIF. Layering: Atlas (identity/provenance) → Factory (transformation) → Epistemic Core (trust). Mostly formalizes the built bibliography+quality+catalog+registries; next steps are the identity distinction, reconciliation adapters, and the read API. *(new)* |
| **PG** | `docs/vision/essayguide.md` | **The Essay Research Program (`ESSAY-RESEARCH-v1`)** — program guide, not a text generator. Essay = thesis selection, EssayArgumentGraph, literature positioning, contribution detection, rhetorical compression, whole-document evaluation. Education = skill ontology, misconception graph, proof-of-understanding, interactive manipulation, adaptive sequencing, transfer, progressive zoom. Plus the PĀṬALA REVIEW platform, the five external-tool classes, and the four program benchmarks (ESSAY-BENCH / EDU-BENCH / REVIEW-BENCH / RESEARCH-TOOLS-BENCH). |

---

## The top-level map (start here)

| Doc | Focus |
|---|---|
| **`docs/vision/CORE-BIBLE.md`** | **THE CORE BIBLE** — one vision chunked into 6 zoomable layers (sentence → paragraph → graph → checkpoints → domain lenses → specs/gold/data). The top-level gate: read this, then zoom into any numbered vision below. |
| `machinelearning/_ACTIVE/PATALA-ENGINE-ROADMAP-12MO.md` | The 12-month philosophy-engine roadmap (the strategic reference; gold-first build order + 8 benchmark tasks + crux algorithm). |
| **`docs/vision/functionality/research/2026-08-12/`** | **Product research-and-build pack (2026-08-12)** — 5 projects (Factory · Benchmarks · Audit · Review · Workbench) + the shared reuse/build doctrine + architecture + source index. The research-under-the-vision for the functionality lens: what Pāṭala owns vs reuses, the build order, and the error taxonomy. Anchor: `prx0r/patala` commit `619b7c8`. Maps: 03→Vision 06, 04→Vision 07, 02→Vision 13, 00→Vision 01/Hermes A3, 01→DEVPLAN §5. |

## The three lenses (the human/tool/value folders)

| Lens | Folder | The vision viewed as… |
|---|---|---|
| **Functionality** | `docs/vision/functionality/README.md` | the tools + machinery + interfaces (the projections of one core) |
| **Functionality — Hermes execution** | `docs/vision/functionality/hermes-execution.md` | **the vision × Hermes map** — which vision files the execution kernel operationalizes, and where other tech (Pāṭala-owned + external interop) is needed. The bridge from strategy to execution. |
| **Scholars** | `docs/vision/scholars/README.md` | the human layer — the contributors whose judgment is the moat, and their new role |
| **Economics** | `docs/vision/economics/README.md` | the sustainability — scarce assets, funding channels, the flywheel |

Each folder assigns the existing docs (content untouched) + the relationships. They are the same vision
at Layer 4 of the CORE-BIBLE, seen through what we build / who does it / what sustains it.

---

## Map to the engineering checkpoint ladder (CP0–CP12)

The vision arc (above) is the *product/strategic* view; the checkpoint ladder
(`handover/CHECKPOINTS.md`) is the *engineering* view of the same work. Rough mapping:

| Vision | Checkpoints it lands on |
|---|---|
| 01 translation-lab / 02 Tantra Hub | CP1 (source proof) → CP6 (synthesis) |
| 03 one scholarly infrastructure | the whole ladder (CP0–CP12) |
| 04 economic thesis / 08 scholar economics | CP10–CP12 (collaborative + economic + cross-corpus) |
| 05 five-year strategic window | sequencing of CP1–CP6 |
| 06 Pāṭala Review (adversarial review) | CP5 (verification) + CP8 (adversarial review) |
| 07 New Scholar (workbench) | CP7 (workbench) → CP9 (API/MCP) |
| 11 Śiva Before Abhinava (cross-corpus genealogy) | CP1 (per-corpus source proof, reused) → CP12 (cross-corpus) |
| 12 Multi-Surface Platform (consumer/scholar/contributor/developer/reviewer) | CP9 (API/MCP) → CP10 (collaborative) → CP12 (cross-corpus) |
| 13 Product Portfolio (per user base) | CP9 (API/MCP) + CP5/CP8 (review) + CP7 (workbench) |

**Where the live agent system tracks this:** `handover/SYSTEM.md` (template → instances) +
`handover/STATE.yaml` via `python3 handover/flow.py status`.

---

## The site spec (the concrete destination)

| Doc | Focus |
|---|---|
| `docs/ENDGAME_SITE_SPEC.md` | The Tantra Reader (essays.tantrafiles.xyz) — what the site is, what it renders, where each element comes from. Note: `endgame2.md` reframes this as the Tantra Hub. |

---

## The scholarly-evidence infrastructure (2026-08-13 — a foundational cross-cutting layer)

| Doc | Focus |
|---|---|
| `source-evidence/docs/scholar-layer-schema-stack.md` | the **Pāṭala Source Evidence Profile v0** — compose FaBiO/PROV-O/Web Annotation/CiTO/RO-Crate/IIIF (not a new ontology); only SourceAssertion/CorroborationEvent/authority/review are Pāṭala-native |
| `source-evidence/docs/scholar-layer-evaluation-and-ids.md` | four standards families + the **evaluation plane** (TantraFact/ArgumentBench/PāṭalaQA sit OUTSIDE the production graph) + CTS/DTS/JATS/ORCID/ROR |
| `source-evidence/docs/reuse-first-stack.md` | **borrow open-source systems** (GROBID/Zotero/OpenAlex/OpenCitations/RO-Crate/ORKG/OpenReview); Pāṭala owns only the thin resolver + the epistemic seam |
| `source-evidence/docs/tools/` | per-tool integration docs with API details + polite rate-limiting etiquette |
| `source-evidence/` | the working substrate (schema/registry/ro_crate/pilot) |

**Why it matters to the vision:** the scholar corpus is potentially a massive moat, but **only after it becomes a
provenance-addressable evidence corpus rather than a folder of excellent PDFs**. This layer feeds the
two-source-side architecture (primary text + published scholarship converge at Proposition ↔ CorroborationEvent
↔ SourceAssertion) and is the substrate every projection (site, education, media, scholar hub, assistant) consumes
via the same IDs.

## The vision → borrowed-tools map (2026-08-13 — what each vision capability is implemented with)

The vision's capabilities map to mature open tools; Pāṭala builds only the epistemic dependency graph on top.
See `source-evidence/docs/tool-integration3.md` (the final assembled architecture) + `source-evidence/docs/tools/`.

| Vision capability | Implemented with (borrowed) |
|---|---|
| source ingest / identify (V01/02/11) | GROBID / Docling / Zotero / Crossref / OpenAlex / OpenCitations |
| scholarly retrieval (V06/07) | PaperQA2 / SciRAG / Tantivy (BM25 baseline) |
| translation audit (V06/13) | Pāṭala vertical + GROBID extraction + the verification floor |
| argument extraction/audit (V06) | Pāṭala argument IR + the active Nyāya audit (native) |
| adversarial thesis review (V06) | OpenReview / Kotahi + COAR Notify federation + Pāṭala ReviewEvent |
| research exploration / perspectives (V07) | STORM / Co-STORM + Recogito annotations + Pāṭala graph |
| benchmark / evaluation (V13) | **Inspect AI** (the runtime) + custom scorers/scanners |
| human annotation / adjudication (V07/08) | INCEpTION (gold lab) + Recogito (native Workbench UI) |
| publication / review workflow (V06/08/12) | OpenReview / Kotahi / Janeway / PubPub + Manubot (essays) |
| identity / credit / economics (V08) | ORCID / ROR / CRediT / RAiD / Crossref review-DOI / Open Collective |
| many surfaces / education / media / API (V09/12/13) | Pāṭala Next.js + the graph projections + DTS/IIIF/TEI/JATS |

**The takeaway:** the vision looked mammoth because every doc described a product capability — but capabilities do
NOT imply building the surrounding software. Pāṭala's proprietary layer is only the fine-grained epistemic
dependency graph that knows *which source supports which interpretation, which licenses which proposition, which
participates in which argument, what the crux is, who reviewed it, and what downstream conclusions change when a
judgment changes.*

## Foundational / strategic (the deep vision, un-numbered)

| Doc | Focus |
|---|---|
| `docs/NORTHSTAR.md` | The strategic plan for a scholarly intelligence layer for tantric textual heritage (the 1.19cr-manuscript Gyan Bharatam context, positioning between layers). The deepest strategy doc. |
| `docs/foundationalideas.md` | The foundational idea: every artifact attaches to a stable passage/text identity (Bilara/immutable-segment precedent). |
| `docs/positioningpartners.md` | Positioning & partners — the connective research layer. |

---

## Development plans (the how, not the vision)

| Doc | Focus |
|---|---|
| `docs/nextdev.md` | The minimal formal primitives everything hangs off. |
| `docs/nextdev2.md` | Pāṭala development plan (forward). |
| `docs/DEV_PLAN.md` | Development plan (API-first, bibliography-first). |
| `docs/DEV_PLAN_AGNOSTIC_CONTRACT.md` | The agnostic-contract dev plan (ML lane). |

---

## ML / product-resolutions vision (the multi-resolution endgame)

| Doc | Focus |
|---|---|
| `machinelearning/VISION-COMPUTABLE-TRADITION.md` | The computable-scholarly-tradition vision (ORIGINAL/READ/GUIDE/STUDY/CRITICAL projections). |
| `machinelearning/MLVISION.md` | ML vision (big picture). |
| `machinelearning/PATALA_AS_LIBRARY_ENGINE.md` | Pāṭala as the engine for the `.meta/` Library (4 wings as register-projections). |
| `machinelearning/_ACTIVE/RETRIEVAL-NEUROSYNTHETIC-VISION.md` | the "semantic microscope" — the neural retrieval + neurosymbolic layer (Stages A–E) + the comprehensive review of BGE-M3/ColBERT/HippoRAG/GraphRAG/DSPy/Kùzu vs current state. |
| `docs/vision/education/LEARNING_STRATEGY.md` | The learning/education content strategy — research once, structure once, distill repeatedly (knowledge packet as the durable unit). |
| `docs/vision/education/EDUCATION_VISION.md` | The graph-native teaching engine vision — the graph selects the teaching move; every lesson is a path through the graph. |
| `docs/vision/education/PATALA-EDUCATION-SYNTHESIS.md` | **Pāṭala Education — cross-lane synthesis** (imported from R2) — the one-line definition, the 4 native education objects (LearningClaim/Skill/Interaction/MasteryEvidence), the interaction compiler, the counterfactual/crux primitive, the tech stack, and the first prototype. The current, most-complete statement of the education vision. |
| `docs/vision/education/sources/` | Raw imported education design docs (01–05) — the original dialogue exports (educationn/2/main/global + greeek-GlossLM) preserved byte-for-byte. |

## The organism vision (Pāṭala as a living system — the Human Understanding Graph)

*Imported 2026-08-14 from the `sanskritree` R2 bucket. Pāṭala as organism: the consumer app becomes a
sensor for what humans fail to understand, feeding the epistemic graph back. The `Q` in the moat
equation. Synthesis guide: `docs/process/09-organism.md`.*

| Doc | Focus |
|---|---|
| `docs/vision/organism/patalaorganism.md` | The core organism thesis: two first-class graphs (epistemic + human understanding), knowledge states, explanation gaps, scholar bounties, the demand-driven chain. |
| `docs/vision/organism/patalaorganismvisions.md` | The scale: longitudinal user graph, personalized conceptual maps, latent audiences, cross-domain behavior. |
| `docs/vision/organism/consumerorganism.md` | The consumer-as-probe thesis: questions reveal what the graph is missing; consumer interaction as a second measurement layer. |
| `docs/vision/organism/consumerorganismtech.md` | The engineering: immutable event stream → graph projections (Graphiti temporal graph, pyBKT learner model). |
| `docs/vision/organism/organism_meh.md` | The adaptive-learning architecture: Knowledge Space Theory, outer fringe, BKT vs modern KT (pyKT). |

---

## Update protocol

When you add a vision doc: give it the next `vision-NN-<topic>.md` number, add a header (title +
provenance + `see docs/vision/INDEX.md`), add it to this table, and add it to `docs/INDEX.md`. The
sequence and this index are the single source of truth for "what is the vision."
