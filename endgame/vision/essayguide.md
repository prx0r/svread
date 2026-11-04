# PĀṬALA ESSAY RESEARCH — PROGRAM GUIDE (ESSAY-RESEARCH-v1)

*2026-08-13. The essay is not a "downstream feature" and it is not a text generator. It is a major
research program sitting over the same canonical graph as Research, Review, and Learn. This guide
turns the essay lane into a first-class science with its own objects, benchmarks, and products. It
supersedes the thin-compiler framing of `devpath10` — the compiler proved convergence; this is the
research agenda on top of it.*

---

## 0. WHY THIS IS A PROGRAM, NOT A FEATURE

The current vertical already proved the point: the essay compiler could pass its local sentence-support
machinery while still producing two load-bearing sentences with **no real backward traceability** —
exactly what `EF-ESSAY-2026-0001` records. That is a strong signal that the high-level layers need
their own serious science, not just more schema.

The skeleton is right:

```text
ArgumentSynthesis
→ EssayPlan
→ EssayClaim[]
→ prose
```

But at least **six distinct hard problems** hide inside "essay." This guide names them and gives each
its own object, evaluator, and benchmark.

---

## 1. THE SIX HARD PROBLEMS OF ESSAY

### A. Thesis selection

Given a synthesis with 20 arguments and 5 cruxes: **what is actually worth saying?**

This is NOT solved by taking the synthesis conclusion. You need objects like:

```text
EssayQuestion
ThesisCandidate
ThesisSelection
ContributionClaim
```

A thesis has dimensions:

```text
novelty
importance
support strength
scope
counterargument burden
explanatory payoff
```

And critically:

```text
interesting ≠ established
established ≠ interesting
```

Pāṭala must distinguish "this is well-supported" from "this is the most interesting unresolved
implication." That is a serious research engine, not a lookup.

### B. Argument architecture

A good essay is not a list of supported claims. There is an **essay-level argument**:

```text
problem
↓
existing views
↓
pressure point
↓
main argument
↓
objection
↓
response
↓
implication
```

So eventually there is an explicit:

```text
EssayArgumentGraph
```

distinct from the underlying historical `ArgumentGraph`:

- The underlying graph says *what Abhinavagupta argued*.
- The essay graph says *how this paper argues for its own thesis about Abhinavagupta*.

Huge distinction. Do not collapse them.

### C. Literature positioning

Currently scholarship mostly appears as evidence/support. Real papers need:

```text
Scholar A says X
Scholar B reads the passage differently
Scholar C's reading implies Y
Our reconstruction agrees with A on ...
differs from B because ...
```

That requires a **scholarly-position layer**:

```text
ScholarlyPosition
InterpretiveClaim
Agreement
Disagreement
Extension
Correction
```

This is probably one of the biggest missing essay layers — and it feeds peer review directly.

### D. Contribution detection

A paper needs to know **what is actually new here**:

```text
NEW_TRANSLATION
NEW_RECONSTRUCTION
NEW_SOURCE_LINK
NEW_CRUX
NEW_COMPARISON
NEW_SYNTHESIS
NEW_PHILOSOPHICAL_ARGUMENT
```

The essay engine should not produce a "research article" unless it can state its contribution
precisely, e.g.:

```text
ContributionClaim:
  Previous scholarship has A/B.
  Pāṭala establishes C because evidence E ...
```

Then reviewers can attack **the contribution**, not the prose.

### E. Rhetorical compression

Even a perfectly correct graph can make unreadable prose. You need a separate model of:

```text
technical density
reader assumptions
definition timing
example placement
recap
analogy
compression
```

A public essay, journal article, lecture, and YouTube script can share the same epistemic skeleton
while being completely different rhetorical projections:

```text
ArgumentSynthesis
       ↓
EssayArgumentGraph
       ↓
RhetoricalPlan(profile)
       ↓
Prose
```

Profiles:

```text
SCHOLARLY_ARTICLE
ADVANCED_EXPLAINER
GENERAL_READER
LECTURE
VIDEO_SCRIPT
```

### F. Whole-document evaluation

The current finding (`EF-ESSAY-2026-0001`) proves this is necessary. You need separate evaluators for:

```text
local sentence support
claim traceability
essay argument validity
literature fairness
counterargument coverage
thesis warrant
contribution novelty
scope discipline
```

The older project work already warned about "scope-creep essay layer" and structurally elegant
containers being mistaken for results. The new vertical is finally testing that concern in practice.

---

## 2. EDUCATION IS EVEN BIGGER

`LearningClaim → Skill → Interaction` is only the **content object model**. It barely touches the
actual learning system. A Brilliant-quality education product requires at least these layers:

```text
knowledge representation
skill representation
misconception model
interaction generation
difficulty calibration
feedback
mastery model
adaptive sequencing
transfer testing
long-term retention
UI/interaction design
```

### Education layer A — what does "understanding" mean?

For one philosophical argument, understanding can mean:

```text
remember proposition
identify speaker
identify premise
reconstruct warrant
distinguish grounding from inference
locate objection
identify crux
predict consequence of premise removal
compare rival models
ground claim in source
repair mistranslation
```

These are **different cognitive skills**. Define a proper skill ontology:

```text
RECALL
CLASSIFY_SPEAKER
IDENTIFY_COMMITMENT
GROUND_SOURCE
ATTACH_PREMISE
RECONSTRUCT_WARRANT
FOLLOW_INFERENCE
IDENTIFY_ATTACK
IDENTIFY_CRUX
COMPARE_POSITION
QUALIFY_SCOPE
EVALUATE_TRANSLATION
SYNTHESIZE_DEBATE
```

Then learning becomes measurable.

### Education layer B — misconception graph

The NAT failure families already describe reasoning mistakes that are **also human conceptual
misconceptions**:

```text
OBJECTION_AS_AUTHOR_VIEW
GROUNDING_AS_INFERENCE
QUALIFIER_DROP
SCOPE_INFLATION
OPEN_AS_RESOLVED
RIVAL_AS_CONSENSUS
INVENTED_BRIDGE
```

Build `Misconception` as a first-class object:

```text
MISCONCEPTION:
  opponent_position_is_author_commitment

  diagnostic interactions:
    Q17, Q24

  remediation:
    speaker-attribution exercise

  related NAT failure:
    OBJECTION_AS_AUTHOR_VIEW
```

Now Pāṭala learns **what the learner misunderstands structurally** — far deeper than quizzes.

### Education layer C — proof of understanding

A good question isn't "what did Abhinavagupta say?" It is **"which model of the argument is
compatible with all the constraints?"** The wrong answers should each violate one structural fact, so
a correct answer is genuine evidence of understanding:

```text
Correct:          Buddhist objection attacks P2.

Distractor A:     attributes objection to Abhinavagupta   → SPEAKER_COLLAPSE
Distractor B:     attacks conclusion directly             → ARGUMENT_DIRECTION_ERROR
Distractor C:     treats source evidence as premise       → GROUNDING_AS_INFERENCE
```

### Education layer D — interactive manipulation

Go beyond multiple choice:

```text
drag premise onto inference
toggle premise
reorder argument
attach source
highlight speaker
repair translation
construct counterargument
choose best warrant
```

The crucial property: **every manipulation maps to canonical graph operations.** The education UI is
not a game pasted over text; it is a controlled interface to the same epistemic graph.

### Education layer E — adaptive sequencing

Track mastery, then target the weak skill:

```text
learner understands speaker attribution
but fails warrants
→ the next interaction targets warrants
```

Needed objects:

```text
LearnerModel
SkillMastery
MisconceptionEvidence
InteractionOutcome
```

Start with deterministic state transitions (e.g. "3 strong successes + transfer success → mastery
candidate"); add Bayesian Knowledge Tracing / IRT-like models later.

### Education layer F — transfer

Solving the same IPVV argument may just be memorization. True mastery means identifying the same
structural principle in a **new passage**:

```text
near transfer
far transfer
```

Example: learn speaker attribution on IPVV → test on a Dharmakīrti passage. This turns the corpus
into an enormous educational dataset.

### Education layer G — progressive zoom

The killer UI:

```text
simple explanation
↓
claim
↓
argument
↓
rival
↓
crux
↓
translation
↓
Sanskrit
↓
edition
↓
manuscript
```

The same concept deepens as the learner progresses. Unlike Brilliant, this knowledge has **real
textual depth underneath it**.

---

## 3. PEER REVIEW IS ANOTHER ENTIRE PLATFORM

The current ReviewBundle / human-authority path is the right primitive, but it is mostly the **atomic
review transaction**. Real scholarship needs much more — think `PĀṬALA REVIEW`, not "review button."

### Review layer A — what exactly can be reviewed?

Everything, granularly:

```text
Work identity
Edition identity
TranslationDecision
Proposition
Argument
Crux
ArgumentSynthesis
EssayClaim
Essay
LearningClaim
```

A scholar should not have to review an entire article if their expertise is "this Sanskrit compound
is mistranslated." **Granular review is one of Pāṭala's biggest advantages.**

### Review layer B — scoped expertise

Reviewer authority must itself be scoped:

```text
ReviewerProfile
DomainScope
LanguageCompetence
TextExpertise
MethodExpertise
CredentialEvidence
```

But crucially: **credentials ≠ correctness.** They affect routing/context, not truth.

### Review layer C — competing judgments

Do not collapse review into accepted/rejected:

```text
ReviewEvent A: translation should be X
ReviewEvent B: X misses technical nuance
ReviewEvent C: both defensible depending on reading
```

Pāṭala should preserve all three. Adjudication can then say: *canonical reading = X qualified by Y;
dissent remains live.* This is much richer than journal peer review.

### Review layer D — reviewer disagreement as data

Reviewer disagreements become epistemic objects:

```text
Which translation decisions generate the most expert disagreement?
Which concepts have stable consensus?
Which arguments are controversial because of one Sanskrit reading?
```

A new scholarly-analytics layer.

### Review layer E — review impact

The killer feature:

```text
reject TD-17
↓
3 propositions affected
↓
2 arguments weakened
↓
1 synthesis stale
↓
essay paragraph requires revision
↓
education question invalid
```

Vastly beyond ordinary peer review. This should be the signature UI.

### Review layer F — publication/revision workflow

```text
submission
pre-review
review rounds
author response
revised object
meta-review
adjudication
release
```

Always on exact object versions. The current review-engine work already moved toward multi-round
`initial → rebuttal → meta_review`, which is the correct direction.

### Review layer G — proof-of-scholarship

The genuinely big strategic play. A scholar's contribution history becomes a **citable contribution
graph**, not a social-media reputation score:

```text
reviewed 327 objects
87 accepted corrections
21 alternative readings
13 adjudications
expertise concentrated in X
```

---

## 4. EXTERNAL TOOLING IS NOT ONE LANE — FIVE CLASSES

### A. Acquisition / bibliography
```text
Zotero · Crossref · OpenAlex · OpenCitations · WorldCat · LoC · Google Books · HathiTrust
```
Purpose: *find things, identify things, connect scholarship.* Not interpret them.

### B. Document parsing
```text
GROBID · OCR · TEI tooling
```
Purpose: PDF → structured document (citations, sections, bibliographic metadata). Again:
**extraction ≠ scholarly truth.**

### C. Research assistants
```text
PaperQA2 · SciRAG · other retrieval/research agents
```
These should *propose* candidate scholarship / quotations / conflicts / evidence. Never directly
establish authority. Pāṭala evaluates and grounds them.

### D. Annotation tools
```text
INCEpTION · Recogito
```
Span annotation, speaker labels, argument roles, translation decisions, NER, gold dataset building.
Rather than building every annotation UI ourselves, Pāṭala can export/import tasks to mature tools:

```text
Pāṭala exports:  50 uncertain speaker spans
INCEpTION:       scholars annotate
Pāṭala imports:  ReviewEvents / gold labels
```

That could massively accelerate benchmark creation. **Underexplored — high priority.**

### E. Scholarly identity / review / publishing
```text
ORCID · ROR · Crossref · COAR Notify · nanopublications · Manubot · OpenReview-like workflows
```
The outward-facing scholar network. Reuse these standards rather than invent a new researcher ID,
institution database, or generic review transport — while preserving Pāṭala's unique semantics
internally.

---

## 5. MANUSCRIPT TOOLING IS ANOTHER MAJOR UNIVERSE (later phase)

External stack:

```text
IIIF · Kraken · Transkribus · eScriptorium · TEI · collation tools
```

Then:

```text
folio image
→ transcription
→ variant
→ edition decision
→ translation
→ proposition
```

This is where Pāṭala eventually becomes much more than an argument engine. Phase after the three above.

---

## 6. FOUR PROGRAMS, FOUR SEPARATE BENCHMARKS

Not one giant test suite.

### ESSAY-BENCH
```text
traceability
thesis warrant
literature fairness
argument completeness
novelty/contribution
scope
readability
```

### EDU-BENCH
```text
skill validity
distractor validity
misconception diagnosis
learning gain
transfer
retention
```

### REVIEW-BENCH
```text
review expressivity
inter-reviewer disagreement
correction quality
impact accuracy
adjudication fidelity
```

### RESEARCH-TOOLS-BENCH
```text
metadata precision
span extraction quality
citation resolution
source echo detection
candidate recall
authority inflation
```

---

## 7. ROADMAP — REORGANIZE AROUND THESE PRODUCTS

The early architecture phase is over. Next era:

```text
CORE QUALIFICATION
│
├ IPVV VERTICALS
│
├ source authority
│
└ real ARGMAP
│
├───────────────────────────┐
│                           │
▼                           ▼
ESSAY LAB               EDUCATION LAB
5 serious papers         1 complete module
                        + learner tests
│                           │
└────────────┬──────────────┘
             ▼
       SCHOLAR REVIEW
       external experts
       corrections
       adjudication
             │
             ▼
        TOOL ECOSYSTEM
   annotation/import/export
   identity/review standards
```

Not sequentially forever — parallel once stable.

## 8. PRIORITY ORDERING (right now)

1. **Finish VERTICAL-1 essay repair.** Make the essay actually 13/13 (resolve `EF-ESSAY-2026-0001`
   via supersession + blind retest, never patch v1 in place).
2. **Turn the 8 education interactions into a real 20–30 minute micro-course.** Not more raw
   interactions — a coherent learning sequence.
3. **Put the exact same argument in front of one knowledgeable scholar.** Simultaneously tests
   ReviewBundle, synthesis, essay, and translation.
4. **Build the annotation bridge.** INCEpTION/Recogito-style export/import for creating human gold
   cheaply.
5. **Expand to 5 serious IPVV arguments.** Then produce an essay collection, an education module,
   and multiple scholar review bundles.

---

## 9. THE BIG INSIGHT

Pāṭala is no longer one product. It is becoming a **shared epistemic substrate** with at least three
enormous native applications:

```text
PĀṬALA RESEARCH    discover / reconstruct / synthesize
PĀṬALA REVIEW      verify / dispute / adjudicate
PĀṬALA LEARN       understand / manipulate / prove mastery
```

And **Essay** sits between Research and the public — the system for turning structured knowledge into
defensible intellectual claims. Each is big enough to be a standalone product, but they remain
powerful precisely because they are projections over the same canonical graph rather than three
disconnected systems.

---

## 10. RELATED DOCS

- Vision: `docs/vision/CORE-BIBLE.md`, `docs/vision/education/EDUCATION_VISION.md`,
  `docs/vision/education/PATALA-EDUCATION-SYNTHESIS.md`, `docs/vision/vision-06-adversarial-review.md`
- Ontology: `docs/ontology/EO-v2.md`, `docs/ontology/` (Essay Object)
- Build: `devpaths/devpath10.md` (essay compiler), `devpaths/devpath11.md` (education compiler),
  `devpaths/devpath13-a1-continue-v2.md` (P8 whole-essay audit)
- Inventory (WHAT EXISTS / DON'T REBUILD): `endgamebuild/INFRA-INVENTORY.md`
- Findings: `data/evaluation/findings/EF-ESSAY-2026-0001.json`
- VERTICAL-1: `data/published/ipvv/IPVV-VERTICAL-001-SOURCE-DOSSIER.md`
- Benchmarks: `benchmarks/v0/review/VERTICAL-1-ESSAY-AUDIT.json`,
  `benchmarks/v0/review/VERTICAL-1-EDUCATION.json`
