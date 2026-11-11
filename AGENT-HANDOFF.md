# AGENT HANDOFF — split of concerns (2026-11-11)

This PR packages everything: what is done, what is next (the full TODO list),
and who does what. Two roles:

- **ME (integration agent, this repo)** — grunt work and integration: build the
  files, wire the endpoints, run the emitters, keep CI green, deploy, write
  progress reports. I execute against `MASTERPLAN3.md`.
- **YOU (external/strategy agent)** — advanced planning: the integration spec,
  the high-level test strategy, the cross-repo strategy, and the repo map with
  concerns split. You do NOT write production code in svread; you produce
  specs/tests-as-docs/strategy that I then implement.

If you are the external agent: start by reading `MASTERPLAN3.md` (full plan,
file map, dev steps), `PROGRESS.md` (what actually shipped), and this file.
Your deliverables are listed under "YOUR WORKSTREAM" below.

---

## Relevant repos (one line each)

| Repo | Path | Owns | Touch policy |
|---|---|---|---|
| svread | `/root/svread` | public surface: reader, wheels, gates, claim pages, MCP stdio, emitters | I own code here |
| ipvv | `/root/ipvv` | worker: auth, chat, scholar API, **gate endpoints**, D1 | I own routes; you spec contracts |
| translation-work | `/root/translation-work` | T1→L0→argmap→L2→C1 layers, check.py, mcp_server | lane-owned; I integrate read-only |
| trika-x | `/root/trika-x` | Lean models + twins, Treeka, federation gateway (104 tools) | lane-owned; I add Lean slices as files with your spec |
| openpatala | `/root/openpatala` | identity (works/editions/passages), API :8821 | read-only for me |
| bookfactory | `/root/bookfactory` | books MCP (22 tools) | read-only |
| videofactory | `/root/videofactory` | video MCP (18 tools) | read-only |
| satsang | `/root/satsang` | Google sign-in worker (reused) | only if auth breaks |
| deitybody | `/root/deitybody` | Mātṛkā curriculum (10 stages) + cards | read-only, I vendor it |
| Kaggle | priortrades | batch GPU (30h/wk) | chant datasets/kernels are **read-only, never touch** |

---

## WHAT I DO (grunt + integration) — in execution order

Already shipped (see `PROGRESS.md` for evidence):
1. ✅ Server-scored gates: pools (`emit_gate_pools.py`), D1 sessions,
   worker `/api/wheel/gate/*`, journey.js server mode, 17 contract/functional
   checks green. CI green (`92d8f538`+).
2. ✅ Earlier this session: wheels/answers/harness/about/one-URL answers,
   Google site-account auth, ORCID=publishing split, CI fresh-checkout fixes.

Remaining (my queue, executes top-down):
3. **W2 certificates** — `PrakriyaSlice.lean` (rule slice + mutants) in
   trika-x; `tools/emit_certificates.py` → `data/grammar/certificates.json`;
   `cert_sha` on answer pages + harness; `wheel_certificate` MCP tool;
   Lean batch check.
4. **W4 practice tab** — vendor deitybody curriculum → `data/practice/`;
   `?view=practice` route (wheels/mātṛkā/reader tracks); Mātṛkā gates use the
   new server gate.
5. **W5 measurement scaffold** — `data/eval/trika-blind-50.json` (held-out
   passages), `tools/eval_blind.py`, licence registry `data/licenses/registry.json`
   + loader gate; fix `treeka_report.py --work` counts (trika-x, small).
6. **W3 access bridge** — `tools/mcp_bridge.py` (Streamable HTTP⇄stdio over the
   federation), selftest, Secure MCP Tunnel, read-sheaf tools.json + /call shim.
   OAuth write-sheaf AFTER your spec lands.
7. **W6 scaffolding (no runs)** — `tools/constrain_glossary.py`,
   `data/training/cards.json` schema; GPU runs only after W5 baseline exists.
8. **W7 factory driver** — `translation-work/tools/auto_pipeline.py` after your
   integration spec defines the job contract.
9. Standing: emitters deterministic (`--check`), manifest LAST, no blanket
   skips, deploy after each wave, `PROGRESS.md` report after each wave.

## YOUR WORKSTREAM (strategy + spec + high-level tests)

The current five deliverables and independent review are collected in
[`EXTERNAL-STRATEGY.md`](EXTERNAL-STRATEGY.md). It is written against the
current checked-in heads; re-check those heads before implementation.

Deliverables, as documents (markdown in this repo or a follow-up PR branch):

1. **INTEGRATION SPEC** — the contract between components: gate session
   lifecycle (start/submit/expiry/replay), certificate schema vs Lean slice,
   MCP bridge auth model (mixed), factory job contract (layer → gate → emit),
   OAuth scopes. State invariants and failure modes; I implement exactly this.
2. **HIGH-LEVEL TEST STRATEGY** — what is unit / contract / functional /
   browser / live per workstream; what runs in CI vs nightly; the fresh-checkout
   contract; how we test worker endpoints without `wrangler dev` (the in-memory
   D1 stub pattern already used in the gate harness — extend it).
3. **CROSS-REPO STRATEGY** — lane ownership matrix (who may write where),
   vendoring policy (what gets copied into svread vs fetched live), the
   openpatala/trika-x/translation-work bridge points, and the order in which
   repos may change so nothing breaks another lane's CI.
4. **ROADMAP RECONCILIATION** — reconcile `MASTERPLAN3.md` with reality after
   wave 1: reprioritize W2–W7, name risks, define the milestone where ChatGPT
   first connects (read sheaf) and the milestone where writes unlock.
5. **REPO/CONCERNS SPLIT** — for the whole estate: which repo should own
   practice tab data, certificates, bridge, OAuth, factory — with a one-page
   diagram.

Rules you inherit (non-negotiable): three stamps (bytes/mechanics/meaning)
never merged; no auto-sign/publish/render; BLOCKED never leaks; closed-world
forms only; restricted-licence data never bundled; chant datasets on Kaggle
are read-only; you do not deploy or merge production code.

## Definition of done for the intake and follow-up work

- [x] Intake PR #13: PROGRESS.md + this handoff + full TODO list in-repo
- [ ] W1 server routes and migration verified on IPVV main and staging
- [ ] External agent's five deliverables reviewed and merged
- [ ] I execute queue items 3–9 against the merged spec
