# PROGRESS — svatantrya build reports

Chronological. Latest first is never true; read top-down for order.

---

## Report #1 — 2026-11-11 · Wave 1: server-scored practice gates (W1)

> Relabelled after external review (PR #14): public pool = practice progress
> check, not mastery certification. "Uncheatable" overstated it — the server
> holds the unlock, but the answer key is public.

**Shipped.** Server-scored gates are live end to end.

- `tools/emit_gate_pools.py` → `data/wheels/gates.json` — public item banks
  (word L1=6 bases, L2=4 endings, L3=8 cells, L4=20 cells; sentence L1=4,
  L2=10, L3=9). Reading the pool is studying, not cheating; the server holds
  the key. Deterministic `--check`.
- Migration `0014_gate_sessions.sql` applied to D1 (remote) — session rows with
  server-side `key_json`, expiry, replay flag.
- Worker `POST /api/wheel/gate/{start,submit}` + `GET /api/wheel/progress`:
  samples 20 items (half current stage, half earlier — cumulative), shuffles
  options, never sends answers; scores; ≥18/20 unlocks in the same transaction;
  receipt in `learner_attempts`; 3 attempts/hour; replay → 409; expiry → 410;
  sentence circle locked until word circle done; signed-out → 401.
- `journey.js` server mode: signed-in learners get a "start scored gate"
  button; 20-question run; server verdict shown with receipt note; signed-out
  keeps local practice labelled *unverified*.
- Tests: `tests/gate.test.cjs` (4: pool shape, cumulative fill, 18/20 rule,
  key-never-served static check) + functional harness against the **real
  worker module** with an in-memory D1 stub: 13/13 pass (pass, fail, skip,
  rate-limit, replay, unauth, sentence-gate).

**Found and fixed on the way:** `gateRand` mixed Number%BigInt (threw → 503);
L4 pool had duplicate ids (kim/sarva cells in both L3 and L4 — L4 now adds
tad/yad/anya + repeats both).

**Evidence:** CI green at `92d8f538` (the earlier `PermissionError` on
`/root` paths fixed); wave-1 commit `c172dce3` pushed; full suite running in
background at `/tmp/opencode/suite.log`.

**Honest gaps:** expiry/replay paths proven by functional harness, not by a
live browser over the real worker (workerd binary too old locally for
`wrangler dev`; production endpoint verified manually). ChatGPT bearer path
exists (Authorization accepted) but untested until W3 OAuth.

**Next:** W2 certificates → W4 practice tab → W5 eval/licences → W3 bridge.
