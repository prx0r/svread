# Plan: verified runtime + benchmark + training (2026-11-11)

Four things, in dependency order: **(1) a deterministic gate the model cannot
cheat, (2) certificates so verification is milliseconds not seconds, (3) a
blind benchmark that decides whether any model change is an improvement,
(4) training only after (3) exists.** Nothing here needs a new architecture —
it uses what is already running.

Measured on this box: warm Lean ≈ 280–380 ms per small certificate file,
cold ≈ 3 s. That single number drives the whole verification design.

---

## 1. The deterministic gate (what you asked for)

Right now `journey.js` scores in the browser and stores progress in
localStorage. ChatGPT drives the same content but is **not** held to the same
gate: it can say "you passed". That is the cheat surface. Close it by moving
the gate to the server.

### Contract

```
POST /api/wheel/gate        {curriculum, action:"start"}
  -> {session_id, items:[{id, prompt, options[4]}], n:20, pass:18, stage}
     (correct answers are never sent)

POST /api/wheel/gate        {session_id, answers:[{item_id, choice}]}
  -> {score, correct, passed, next_stage, unlock_url, progress}
```

Rules, all server-side so no model can fake them:

- **20 items, 18 to pass** (90%). Fixed count, not "90% of whatever you
  answered" — that removed the 9/10 loophole.
- **Cumulative mix:** items are drawn from the current stage plus all earlier
  stages, weighted toward the current one. Drilling earlier layers is forced,
  exactly as you said.
- **Server samples, shuffles options, holds the key.** The model relays the
  learner's chosen strings; the server compares. A model that guesses well is
  fine (knowing the answer is the goal); a model that *skips* is impossible.
- **One active session**, 10-minute expiry, rate-limited, 3 attempts per hour
  per curriculum. Attempts are recorded, so a "pass" always has a receipt.
- **Unlock is a server write**, not a client boolean: `stage` only increments
  in D1. The site reads it; ChatGPT reads it; neither can set it.
- **Signed-out fallback** keeps localStorage scoring but clearly labels it
  "unverified local score" — useful for practice, never for unlock.

### Lean's role here (J5, curriculum invariants)

The gate is only as honest as its item pool. Encode, per stage:
`word L1 = 6 bases`, `word L2 = 20 cells + 1 curated gap`, `karaka = 6`,
`as-paradigm = 9`, plus no-duplicate and pool≥20 properties — each with a
mutant that drops/duplicates an item. A data edit that silently shrinks a
pool fails the check before it can weaken the gate.

Acceptance: 10 attempts at 17/20 never unlock; 18/20 unlocks exactly once;
replaying the same session id cannot raise a score; a hand-edited pool fails
Lean.

---

## 2. Certificates, not runtime proofs (J1 + J2)

You asked whether `lean_check` is quick. Measured: **~300 ms warm per file**,
so 20 separate calls would be ~6 s. Correct design is three tiers, and the
model uses tier 1 almost always:

| Tier | Mechanism | Latency | When |
|---|---|---|---|
| **1. Certificate lookup** | hash → precomputed verdict | ~1 ms | every normal question |
| **2. Certificate verify** | small deterministic Python checker over the stored trace + rule table | ~1–5 ms | when the caller wants the reasoning, not just the verdict |
| **3. Lean re-check** | batch all certificates for one gate/limit into ONE Lean file | ~0.4 s | nightly CI, or on demand via a job tool |

Build order:

1. Formalize the rule slice that covers the 44 wheel forms (guṇa/vṛddhi,
   ṅīp/4.1.5, sup endings, tasil/tral/dā/thāl, as-paradigm). Small on purpose.
2. For each pack entry, emit a certificate record:
   `{pack_id, form, steps:[{sutra, before, after}], rule_table_sha, lean_ok, cert_sha}`.
3. Ship tier 1 in the answer page and the harness: a verdict plus `cert_sha`.
4. Add `wheel_certificate(form)` to MCP: returns the certificate, the tier-2
   checker result, and the cert hash. This is what "verified for ChatGPT"
   means concretely — it cites a re-checkable object, not a claim.

Honest scope line: certificates cover **mechanics** (does the derivation
follow). They never cover meaning. The answer page already carries the
"what this does not establish" block for that.

---

## 3. Benchmark before training (the eval set)

No model change ships without this. Build it once, reuse it forever.

- **50 blind Trika passages**, independently checked, covering: long compounds,
  philosophical terminology, negation, ritual instruction, verse, and genuine
  ambiguity. Held out — never used for prompting or training.
- **Candidates:** current free-model pipeline; MITRA-MT; process-Sanskrit +
  Vidyut + MITRA-lexicon combined; any LoRA.
- **Metric: correction effort**, not BLEU. Per passage: number of edits, number
  of wrong terms, number of unsupported additions, and whether the passage
  survives the evidence rules. Report as "minutes to scholarly acceptance".
- **Licence registry per dataset** before use: release, checksum, attribution,
  and allowed uses (train / infer / quote / redistribute). Mitrasaṃgraha:
  372,791 pairs CC BY-SA; the extra 18,757 under CC BY-NC-ND are **excluded**
  from any bundled corpus.
- **Where we expect to lose:** compound interpretation and philosophical
  terminology — which the Mitrasaṃgraha paper itself names as weaknesses. The
  benchmark should confirm that, not hide it.

Acceptance: a single table that says, per candidate, what it costs to correct.
Only then does "our way works well" become a measured claim.

---

## 4. Training: what is worth it, what is not

The pipeline is quick and free because it is structured and gated, not because
the models understand Trika. Specialised compounding is where it will bend.
So train in this order, each gated by §3:

| Target | Verdict | Why |
|---|---|---|
| **Terminology (gloss consistency)** | Do first, cheapest | Train on human-signed L0 + the concept files only. Even better: constrained decoding against a glossary beats a LoRA for consistency, and we can ship it this week. |
| **Style (L2 → C1 register)** | Worth it | Style is learnable, errors are visible, and it does not touch source meaning. Train on signed C1 only. |
| **Translation (Sanskrit → L2)** | Only with ≥200 human-signed passages | Training on machine-proposed layers teaches the model our mistakes. Mitrasaṃgraha is a licence minefield and Buddhist-domain. |
| **"More old Sanskrit"** | After the benchmark | Admission control: a new work enters the factory, the eval gates its layers; the model never becomes the authority. |

Hard rules: never train on unsigned layers as ground truth; every training run
records dataset checksums, licence, seeds, and the eval score it must beat;
LoRA artifacts are versioned in R2 with a card. **Self-distillation on our own
gated output is the specific failure mode to avoid** — we would be amplifying
our own habits and calling it improvement.

Where the work actually runs: Kaggle/Colab for the GPU batch (MITRA-MT
inference, ASR benchmark, LoRA fits), returning artifacts (JSON, hashes,
model cards) that we vendor back. Kaggle is never the runtime — no inbound,
ephemeral, no durable store.

---

## 5. Order of work (acceptance-first)

| # | Ship | Acceptance |
|---|---|---|
| 1 | Server gate (`/api/wheel/gate`) + D1 `learner_progress` | 17/20 never unlocks; 18/20 unlocks once; replay cannot raise score |
| 2 | Lean curriculum invariants + mutants | pool edits that weaken a gate fail CI |
| 3 | Certificates for 44 wheel forms + `wheel_certificate` MCP tool | every answer page carries `cert_sha`; tier-2 checker reproduces the verdict |
| 4 | Blind eval set + benchmark runner | one table of correction effort per candidate |
| 5 | Glossary-constrained decoding | term-consistency score up, no meaning changes |
| 6 | Style LoRA (signed C1 only) | beats baseline on §3 or it is not merged |
| 7 | Runtime MCP bridge (from the federation review) | ChatGPT can call gate + certificate tools remotely |

Steps 1–3 are the "verified for ChatGPT" core and are all small. Step 4 is the
one that changes how we talk about quality: from "our way works well" to a
number.

---

## 6. What we will not do

- No "verified" badge that merges bytes, mechanics and meaning into one word.
- No gate that a model can self-report as passed.
- No training on unsigned machine output as if it were gold.
- No restricted-licence data in any bundled corpus.
- No Lean claim about what a text means, or what a scholar historically held.

---

## 7. The one-line version

**Server-scored gates make progress server-recorded and replay-proof (a practice
check while the pool is public, not mastery); certificates make
verification instant; a blind benchmark makes quality measurable; training
then optimises against that measurement instead of against our own
enthusiasm.**
