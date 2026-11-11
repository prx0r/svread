<!-- status: reference design note — W2 certificates implemented the first joint (see PROGRESS-REPORT) -->

> **Status (2026-11-11):** reference design note — W2 certificates implemented the first joint (see PROGRESS-REPORT).

# Lean × Sanskrit — what it can and cannot do here (2026-11-11)

Answer to: how does Lean fit, does it connect to the Sanskrit repos in the
audit, and what genuinely new thing does that unlock?

---

## 1. What Lean actually proves (and the three stamps)

Looking at `trika-x/formal-trika/control/`, Lean is doing two honest jobs:

1. **Named models.** `TattvaInventory.lean` declares an inductive `Tattva` with
   exactly the 36 names, then defines `pureTattvas`, `kancukas`, `mayaSix` and
   proves the grouped arithmetic the texts state (5 + 6, 11 + 25, …). The
   header is explicit: *"curated data, not a derivation from Sanskrit"*.
2. **Must-fail twins.** Every model has a mutant (`BrokenTattvaInventory.lean`
   miscounts māyā as pure) that the invariants must reject. A proof that no
   mutant survives is the only evidence the invariants bite.

That is the right use. It proves **internal consistency of a formalization**
and **that a stated structural property holds**. It does not prove the
enumeration is the tradition's, that Abhinavagupta accepted it, or that a
translation is right. Lean is a *mechanical* checker, not a philological one.

So the architecture is three independent stamps, never merged:

| Stamp | Mechanism | Answers |
|---|---|---|
| **Bytes** | SHA-256 pins, verify packs | *Is this the text we claim?* |
| **Mechanics** | Lean + Vidyut traces | *Does the derivation/structure hold?* |
| **Meaning** | Human scholar sign-off | *Is this the right reading?* |

A claim page should show all three, separately. Today it shows bytes and
meaning; the mechanics stamp is the gap.

---

## 2. The five real joints between Lean and Sanskrit

Ranked by novelty × feasibility. Each is a small, checkable artifact, not a
research programme.

### J1 — Verified prakriyā (the strongest idea)
Vidyut emits a derivation as a list of steps: rule id → state → state. Today
`svread/data/grammar/wheel-pack.json` stores those traces **unreviewed**.
Lean can turn a trace into an *obligation*: for each step, "rule X is
applicable at state S, and applying it yields S′". Formalize a slice of the
Aṣṭādhyāyī (tripādī ordering, guṇa/vṛddhi, ṣatva/ṇatva, visarga) and a trace
becomes a certificate instead of an assertion.

Payoff: the answer page for `sarvatra` carries `certificate: <hash>`, and a
machine can re-check the derivation without trusting Vidyut or us. This is
the single most defensible thing this project could own: **not a translation
service — a derivation checker.**

Feasibility: medium. Start with the 44 forms we already have, not all 2,000
rules. A hand-checked slice that covers the wheel pack is enough to prove the
concept.

### J2 — Grammar kernel as a runtime tool
Expose `lean_check(form | rule | state)` over MCP. Then ChatGPT (or a scholar)
asks "does 4.1.5 ṅīp apply to `sukhin` here?" and gets a checked yes/no with a
proof hash, not a confident paragraph. This is the "verification layer
alongside ChatGPT" in its most literal form: the model proposes, the kernel
disposes.

### J3 — Must-fail twins for translation claims
`trika-x` already refuses mutated theorems. Extend the discipline: for every
accepted translation, generate the strongest plausible *wrong* reading and
require the evidence rules (L0 options, argmap, commentarial support) to
reject it. A translation that cannot distinguish itself from its twin is not
evidenced — it is fluent.

This is the audit's "AI that argues against its own translations", but with a
mechanical gate instead of a vibe. Lean is optional here; the mutant
discipline is the point.

### J4 — Witness-consistency invariants (Saktumiva/Upama link)
If we adopt a variant-graph model (witness → reading per locus), Lean can
check properties that are genuinely structural:
- every witness has **exactly one** reading per locus (no silent conflation);
- the contamination graph is **acyclic**;
- the edition is a **derived set** of attested readings, never a free-floating
  string;
- a variant used in a translation **exists** in at least one witness.

That last one is decisive for the audit's "living critical edition" idea:
a translation cannot cite a reading no witness attests. This is checkable,
novel, and does not require solving philology.

### J5 — Teaching invariants on the wheels
Cheap and immediate: the wheel datasets already have exact cardinalities
(4 endings × 5 bases = 20 cells, 1 curated gap; 6 kārakas; 9 `as` forms;
50 mātṛkā; 14 Māheśvara sūtras; 10 lakāras). Encode them as Lean counts with
twins (drop a kāraka, duplicate a cell) so a data edit that silently changes
pedagogy fails a check. This makes the *curriculum* verified, not just the
grammar — and it pairs directly with the 90% journey gates.

---

## 3. Repo-by-repo: where the audit's finds fit

| Find | Lean? | What we actually do with it |
|---|---|---|
| **MITRA-MT** (9B, classical Asian languages) | No | Independent **translation candidate** in the panel; never canonical, never proof. Benchmark on Trika passages, not BLEU. |
| **Mitrasaṃgraha** (391k pairs) | No | **Evaluation + retrieval** set. Licence split matters: 372,791 CC BY-SA vs the 18,757 extra under CC BY-NC-ND. Record per-record permissions; never bundle the restricted slice. |
| **MITRA Lexicon** | No | Corpus-attested senses; already have `mitra_grounds.py` (219 Trika headwords, 384,073 entries inspected). Frequency ≠ philosophical meaning (the `tattva` example). |
| **Process-Sanskrit** | No | **Second opinion** alongside Vidyut. Disagreement is data (we already do this in `crosscheck.json`). Non-commercial DB terms separate from the package licence. |
| **Sanskrit Travelogue** (73M tokens) | No | Search/research infra only; licence says non-commercial. |
| **Sansar corpus** (252M words) | No | Model for **per-source licensing** in intake; don't redistribute wholesale. |
| **UniLipi OCR** | No | Manuscript benchmark; candidates only. |
| **Saktumiva / Upama** | **Yes (J4)** | The witness/variant layer is the natural home for structural proofs. |
| **Su-śrotā ASR** | No | Pronunciation **evidence** for drills (vowel length, aspiration). Feed the journey gate; do not claim phoneme proof. |
| **Anamavajra Śaiva corpus** | No | Candidate eval data after alignment + licence check. |

The pattern: **linguistic tools produce candidates; Lean checks mechanics;
humans settle meaning.** No repo in that list can substitute for the third.

---

## 4. Treeka × Lean

Treeka today: 909 passages, 578 unargued, 893 without a formal registry
reference, 12 ambiguous locators, 123 cruxless, 331 essayless. That is a map
of *gaps*, which is exactly what a proof system is for — but only if we are
honest about what gets formalized.

What Lean can do here:

- **Consistency, not truth.** Formalize claims as tuples over a shared
  vocabulary (term, relation, qualifier). If two passages yield `P` and `¬P`
  under the same assumptions, flag a **crux candidate**. Ranked queue, expected
  false positives, human adjudication. (The audit's "philosophical discovery
  engine", with a mechanical detector.)
- **No orphan claims.** Every Treeka edge must resolve to a passage id and an
  evidence status — already the direction of PR #9. Lean can check the
  *graph* invariants (no cycles in "supports", every conclusion reachable from
  at least one attested premise) without pretending to check doctrine.
- **The per-work reporting bug** the audit found (`treeka_report.py --work`
  filters passages but prints corpus-wide counts) should be fixed regardless;
  a report that lies about its own scope undermines everything else.

What Lean cannot do: tell you whether Abhinavagupta *held* the premise. A
valid derivation from premises is not a historical claim.

---

## 5. Where is this all heading

Not a translation factory. A **checking instrument** with three audiences:

1. **Learner + ChatGPT** — the wheels, journey gates, and a `lean_check` tool.
   Learning is verified where it is mechanical (forms, agreement, derivations)
   and honest where it is not (interpretation).
2. **Scholar** — a translation workspace where the machine produces candidates,
   a twin tries to break them, and the human signs. The signature chain plus
   the derivation certificate is the product.
3. **Outsider** — one URL per claim that anyone can re-verify without our code.
   That is the only thing that makes "authoritative checkability" real.

The moat is not the corpus (others have bigger corpora) and not the model
(others have better models). It is the **chain from a Sanskrit string to a
re-checkable certificate to a human signature**, with disagreements kept
visible at every step.

---

## 6. Compute: can this run on Kaggle?

Yes for **batch**, no for **runtime**.

Kaggle (free T4/P100, ~30 GPU-h/week, notebook sessions, no inbound ports,
ephemeral disk) is the right place for:

- MITRA-MT inference over a blind Trika eval set (50 passages) and
  Mitrasaṃgraha evaluation slices;
- Su-śrotā ASR benchmarking against our own recordings;
- LoRA/CPT experiments on our own gated layers (never on restricted corpora);
- bulk corpus processing (sandhi splitting, morphology) where the output is a
  dataset, not a service.

Kaggle is the wrong place for the MCP runtime, the reader, or anything the
site must answer in <1s: notebooks cannot accept inbound connections, sleep,
and have no durable storage. Runtime stays on the box behind the tunnel;
heavy batch goes to Kaggle/Colab and returns **artifacts** (JSON, hashes,
certificates) that we vendor back into the repo.

Rule: every Kaggle run emits model id, versions, seeds, dataset checksums and
licence notes — otherwise its output cannot enter the pipeline.

---

## 7. What would make this legitimate (the audit's core point)

1. **Green CI on a fresh checkout.** Done today: vendored fixtures and
   concepts, relative paths, no blanket skips (the pushing digest falls back to
   vendored bytes rather than skipping the test).
2. **Separate the stamps.** Byte identity, mechanical proof, human approval —
   distinct fields, never collapsed into one "verified" badge.
3. **License registry before data.** Every dataset row: release, checksum,
   attribution, and allowed uses (train / infer / quote / redistribute).
4. **One real showcase.** Pratyabhijñāhṛdaya (20 sūtras) done with all three
   stamps beats fifty machine-completed texts.
5. **A blind eval set.** ~50 Trika passages, independently checked, used to
   compare pipelines — reported as correction effort, not BLEU.

---

## 8. First three moves (in order)

1. **J5 then J1.** Encode wheel cardinalities as Lean counts + twins (a day),
   then formalize the derivation slice that covers the 44 wheel forms and emit
   a `certificate` per answer page. Small, visible, and it proves the method.
2. **J3 twin discipline** in the translation pipeline: every accepted passage
   needs a rejected twin, recorded. This is the cheapest scholarly credibility
   available.
3. **J2 `lean_check` over MCP** once J1 exists, so ChatGPT can call the kernel.
   The runtime-verification layer becomes real the moment a model can get a
   checked yes/no instead of a paragraph.

Everything else — MITRA benchmark, ASR, witness layer, Treeka cruxes — hangs
off those three without changing the architecture.
