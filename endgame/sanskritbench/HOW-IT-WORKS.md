# HOW THE AGENT WORKS — skills, goals, verification, and why it's trustworthy

*2026-08-16 · The master explanation of the whole system: how the hermes agent is made smart, how skills and
goals work, how verification ("don't move on until it's done") is enforced, and why it's deterministic
rather than theater. Read this before the recipes.*

---

## 1. THE ONE-SENTENCE ANSWER

> **The agent is "smart" not because it has a bigger model, but because it has (a) a **skill** that encodes
> the lab's exact workflow, (b) a **goal** that states the acceptance test it won't pass without, (c) a
> **kanban review-gate** that forces a different verifier to approve its work, and (d) a **crypto/provenance
> layer** that makes every number checkable — so it literally **cannot move on** until a logged, verified
> result exists.**

---

## 2. THE THREE MECHANISMS (what makes it smart)

### 2.1 SKILLS — how the agent "knows" the lab

**What a skill is:** a `SKILL.md` file with YAML frontmatter + a markdown body. Hermes loads it (via
`--skills <path>` or installed) and the model reads it as context — it's **instructions**, not code. It
tells the agent: what commands exist, what the workflow is, what the honest rules are, and how to verify.

```
---
name: sanskrit-benchy
description: "Drive the Sanskrit benchmark science lab..."
version: 1.0.0
date: 2026-08-16
metadata:
  hermes:
    tags: [Sanskrit, Benchmark, MT, COMET, Science]
---
# body: the command map, the run loop, the honest rules, how to read results
```

**Why skills make the agent smart:** the skill is the **institutional memory of HOW to do the work**. An
agent with no skill improvises (and hallucinates); an agent with the skill follows a proven, tested
workflow. It's the difference between a random intern and a trained one. The skill is also **self-
updating** — hermes can create/improve skills from experience.

**Our skills:**
- `skills/sanskrit-benchy/SKILL.md` — the lab driver (command map, run loop, rules).
- `skills/deal-radar/SKILL.md` — the dealradar driver.

### 2.2 GOALS — the acceptance test the agent won't pass without

**What a goal is:** a continuing, stated outcome the agent works toward (hermes `/goal`, or the `--goal`
flag / a kanban goal card). It's a **north-star acceptance test**, not a vague wish.

**How it "verifies" — the key mechanism:** a goal is tied to a **completion contract** — a
**deterministic gate** the agent must PASS before it considers the goal done. The goal isn't "done" when
the agent says so; it's done when the **gate** passes. So:

```
GOAL: "reach a logged Kendall's-tau where our metric beats chrF on mitrasamgraha"
  ↓
the agent runs the pipeline
  ↓
DETERMINISTIC GATE (run_recorder + audit + verify): is there a logged content-addressed number where
tau(our metric) > tau(chrF)? 
  ├─ NO → the goal is NOT met → the agent keeps working (it CANNOT move on)
  └─ YES → the goal is met → promote / mark done (audit-trail recorded)
```

**Why this prevents hallucination:** a lone agent can hallucinate "the metric is better." A goal + a
deterministic gate **cannot** — the gate recomputes the number on fixed gold and fails if it isn't there.
The agent's *opinion* is not the acceptance test; the *logged machine-computed number* is.

### 2.3 KANBAN REVIEW-GATES — the "different verifier" anti-circularity

**What it is:** the kanban board has a full review workflow: `claim` (atomic ownership) → work →
`request-review --summary` (state what you did + evidence) → reviewer checks → `request-changes`
(reject, bounce back) or `promote --reason` (approve, audit-trail). Plus `dispatch --failure-limit`
(auto-block after N failures).

**Why it prevents hallucination — the anti-circularity rule:** the **scorer ≠ the generator**. The agent
that produced the result is NOT the one that verifies it. A **different profile/agent** reviews the work
against the goal. This breaks the failure mode where a model "grades its own homework." The `--summary`
and `--metadata` fields force the worker to state concrete evidence ("here's what I ran, here's the logged
number") that the reviewer can check against the actual registry.

**The swarm pattern** (`kanban swarm --worker --verifier --synthesizer`) is the strongest form: parallel
workers produce, a dedicated **verifier** checks, a **synthesizer** writes up only what passed.

---

## 3. THE END-TO-END VERIFICATION LOOP (how "don't move on" is enforced)

```
GOAL (the acceptance test, e.g. "logged tau > chrF on fixed gold")
   │
   ▼  kanban decompose → tasks
agent CLAIMS a task (atomic ownership)
   │
   ▼  runs agent/run.py --step X  (the orchestrator, hermes model, logs to the trace)
   │
   ▼  run_recorder.py → content-addressed run record (sha256(gold‖code‖config) → out_hash + nanopub)
   │
   ▼  deterministic proof gate (translation_proof.py) + audit.py (recompute on fixed gold, fail on mismatch)
   │
   ▼  kanban request-review --summary --metadata   (worker states its evidence)
DIFFERENT profile (verifier) checks against the goal
   │
   ├─ request-changes → back to worker (verification FAILED → cannot move on)
   └─ promote --reason → approved, audit-trail recorded
   │
   ▼  hooks: on complete → auto-run check.py + verify.py (the gate is enforced, not assumed)
   │
   ▼  cron watchdog re-validates daily; mcp serve exposes verified results to other agents
```

**At every stage, a content-addressed, timestamped, logged trace entry exists
(`agent/trace.py`). If it isn't in the trace, it didn't happen.**

---

## 4. WHY THIS IS DETERMINISTIC (not theater)

| Failure mode (a lone agent) | How we prevent it |
|---|---|
| "The metric is better" (assertion) | a **logged tau vs human gold** on fixed gold — `audit.py` recomputes + fails on mismatch |
| "I translated it well" (opinion) | **gold-reference anti-hallucination** — candidate vs a real gold ref (chrF); if it doesn't match, NOT verified |
| "My result is real" (no provenance) | **content-addressed run record** — `sha256(gold‖code‖config) → out_hash` + nanopublication |
| "I verified my own work" (circular) | **kanban review-gate + swarm verifier** — a different agent/profile verifies |
| "I changed something, it's fine" (unchecked) | **hooks auto-run `check.py` + `verify.py`** on task-complete |
| "I ran it, I promise" (unlogged) | **centralized trace** — every step is in `agent-steps.jsonl`, queryable |

**The core principle:** the agent's *belief* is never the acceptance test. Only a **machine-computed,
content-addressed, logged number on fixed gold** is. The agent is a very capable *proposer*; the system is
the *verifier*.

---

## 5. THE LAYERS (what each piece does)

```
┌─ ORCHESTRATION (hermes) ────────────────────────────────┐
│  skills (the "how") · goals (the "what must be true")   │
│  kanban (who does what + review-gates)                  │
│  cron (when it re-runs) · hooks (auto-verify on events) │
│  moa (ensemble grading) · mcp serve (expose verified)   │
└──────────────────────────┬──────────────────────────────┘
                           ▼
┌─ EXECUTION (the lab) ───────────────────────────────────┐
│  agent/run.py (orchestrator — every step logs)          │
│  model.py (hermes → mimo-v2.5, 1M ctx)          │
│  pipeline/*.py (gold, benchmark, proof, runner, COMET)  │
│  tree_search.py (AIDE metric-grounded strategy search)  │
│  agent/memory.py (DML deterministic temporal memory)    │
└──────────────────────────┬──────────────────────────────┘
                           ▼
┌─ VERIFICATION (the crypto/provenance layer) ────────────┐
│  run_recorder.py (content-addressed records + nanopubs) │
│     + eigenius 4-kind ladder (Declared/Observed/Derived/Verified)
│  translation_proof.py (deterministic Pāṭala proof gate) │
│     + CITATION_GROUNDING (darshana-graph "only real edges")
│  agent/verify.py (gold anti-hallucination)              │
│  agent/audit.py (golden-file recompute)                 │
│  agent/trace.py (every run, greppable)                  │
│  Engram (blind-assessor learning/review memory)         │
└──────────────────────────────────────────────────────────┘
```

---

## 6. WHY IT'S TRUSTWORTHY (the honest answer)

1. **Grounding** — every number traces to a machine-computed, content-addressed run record on fixed gold.
   No record = theater.
2. **Anti-circularity** — the verifier ≠ the generator (kanban review-gate / swarm verifier).
3. **Determinism** — the gates (proof, audit, verify) are reproducible Python, not model opinions.
4. **Logging** — every step is in the trace; if it isn't logged, it didn't happen.
5. **Budget safety** — RAM/CPU is checked before + during heavy jobs (`agent/ramwatch.py`) so the box
   doesn't crash mid-run.

**The honest limitation:** this verifies *computation* + *internal consistency* + *gold-match*. It does
NOT verify *expert human semantic correctness* — that needs the expert MQM gold (human-in-the-loop). The
crypto layer proves integrity, never quality. These limits are documented, not hidden.

---

*Read `RECIPES.md` for every command an agent can run, and the full feature→verification map in
`research/HERMES-VERIFICATION-ARCHITECTURE.md`.*
