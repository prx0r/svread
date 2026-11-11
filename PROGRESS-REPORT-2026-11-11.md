# PROGRESS REPORT — 2026-11-11 vs MASTERPLAN3

Honest status of every MASTERPLAN3 workstream plus the estate-level tasks the
owner asked for (all on R2, one MCP surface, Lean, Sanskrit). Evidence is a
command or a URL; nothing below is "remembered".

Legend: **✅ done** · **◐ partial** · **⬜ not started** · **⛔ blocked**

---

## 1. Workstream status

### W1 — Uncheatable learning (gate + progress) ✅
- Server gate **live**: `POST /api/wheel/gate/{start,submit}`,
  `GET /api/wheel/progress` (worker v`9003faf6`).
- Sampler: 20 items (or full pool if smaller), **no repeated ids**;
  `pass_mark = ceil(0.9·n)`; cumulative mix (half current stage, half earlier).
- Atomicity: conditional `UPDATE … WHERE used=0` (CAS on `meta.changes`);
  receipt + progress + stored result in **one D1 batch**.
- Idempotent: identical retry → same `receipt_id` (`replayed:true`);
  different replay → 409; expiry → 410; 3/hour; sentence gated on word.
- 13/13 worker tests (`node --test ipvv/worker/test/gate.test.mjs`).
- Site: `journey.js` server mode with honest three-state banner
  (*local unverified* / *server-recorded* / *unavailable — nothing recorded*).
- Evidence: PR #12 (ipvv), PR #17 (labels/banner).

### W2 — Mechanics certificates ✅
- 44 certificates (`data/grammar/certificates.json`): trace sha, rule-set sha,
  structural checks, self-hash; tier-2 recompute (44/44, 0 failures).
- **Lean slice** (trika-x PR #11): `PrakriyaSlice.lean` — 68-code inventory,
  44 traces, 4 mutant rejection theorems; Lean **4.34.1 exit 0**,
  receipt `PrakriyaSlice.receipt.json` pins file+pack sha.
- `lean_status = checked` only when the receipt matches the current pack;
  otherwise `pending` (staleness demotes automatically).
- MCP `wheel_certificate` re-binds to the receipt independently
  (`lean_independent`), never trusts the certificate's own claim.
- Every page states the scope: *structural well-formedness over the rule set —
  NOT a derivation from the Aṣṭādhyāyī, never a claim about meaning*.
- Evidence: PR #15, trika-x PR #11.

### W3 — Access layer (ChatGPT MCP) ◐
- **Registry done**: `data/mcp-registry.json` — 8 servers probed live,
  122 leaf tools, federation = **109 tools**.
- **Plan done**: `MCP-INTEGRATION.md` — one surface, three sheaves,
  bridge requirements, OAuth design, concrete ChatGPT behaviours.
- ⬜ Bridge (`tools/mcp_bridge.py`), tunnel, OAuth — not built yet.
- Legacy ipvv `/mcp` superseded, left inert.

### W4 — Practice surface ◐→✅ (delivered)
- `?view=practice` live: 10 deitybody Mātṛkā stages, verbatim cards
  (DO / IN THE MIND / NOT / SOURCE), assembly rule shown verbatim, provenance
  sha256 per file; links to the scored wheels journey.
- 4/4 tests incl. a **real** fallback test (`DEITYBODY_ROOT=/nonexistent`).
- ⬜ Mātṛkā stages are not yet gate-scored (W1 gate covers wheels only).
- Evidence: PR #18.

### W5 — Measurement ◐
- **Licence gate** live: 10 entries; `--admit` refuses excluded, pending,
  read-only. Mitrasaṃgraha NC-ND slice permanently excluded.
- **Blind set** live: 50 held-out passages, one per work (49 works),
  Ghaṭakarpara excluded, trace shas pinned, categories honestly `null`.
- **Rubric** live: correction effort, mean minutes; machine writes no score.
- **Runner** live: coverage only (`PENDING_HUMAN` skeleton).
- ⬜ No candidate run yet (needs verified licences + a candidate).
- ⛔ holdout is not technically enforced against contributors (noted in review).

### W6 — Training ⬜
Not started, correctly: MASTERPLAN/strategy gate it behind W5 baselines and
human-signed data. No glossary-constraint tool yet.

### W7 — Factory (autotranslate) ⬜
Not started. translation-work has the pipeline + gates; the job driver and
admission control (W5) come first. The other agent's `burn/muktabodha` PR #18
in translation-work is the live factory front and is **not mine**.

---

## 2. Estate tasks the owner asked for

### All of the system on R2 ✅
- Canonical bucket **`svatantrya-system`**, root **`INDEX.json`**.
- **12 repo archives** (full git, `.git` included): svread, ipvv,
  translation-work, trika-x, bookfactory, videofactory, deitybody, openpatala,
  bruno, satsang, **sanskrithelp**, **sanskritbench**.
- **6 packages** copied in from the other agents (tw, bookfactory,
  videofactory, openpatala, translation-work/2026-11-11, videofactory MCP pack).
- Total ≈ **2.28 GB**; every manifest carries commit + sha256 + excludes.
- Secrets audited: `.env`/`.dev.vars`/`*.pem`/credentials excluded from all
  archives; ipvv tarball re-downloaded and listed (14,603 members, zero
  secret paths). A dummy local `.dev.vars` was briefly included in the first
  run — replaced; contents were non-production placeholders.
- Re-runnable: `python3 tools/r2_system_backup.py [--only X] [--check] [--force]`.

### One MCP surface ◐
Registry + plan done (above). The single entry point is
`trika-x-federation` (109 tools); ChatGPT reaches it through the bridge,
which is the next build.

### Lean / formal / Treeka ◐
- Lean certifices: **done** (W2b above), inside trika-x control/.
- Treeka: report fixed (`--work` scopes every count; trika-x PR #10) +
  regression test. Treeka data archived on R2 inside the trika-x repo.
- ⬜ Treeka svread view (W5 in PRODUCTION.md's old numbering) still open.

### Sanskrit ✅ (substantial)
- Wheels: word (5 bases × 4 endings), sentence, kāraka, Trika; discs,
  **any-combination script toggle** (deva/iast/en), cumulative levels 1–6.
- **45 one-URL answer pages** (`/a/<slug>/`) with certificate + scripture.
- One-fetch harness (`data/wheels/harness.json`) + 6 tutor prompts.
- 10 bookfactory lessons + 8 Pāṇini rule boxes; practice tab (10 stages).
- Crosscheck: 20 agree, 1 special (katham), 3 machine gaps — visible.

---

## 3. Health

| Check | Result |
|---|---|
| svread node suite | green; **1 labelled skip**: biblio `BLOCKED` |
| MCP suite | 40 OK |
| Emitters `--check` | all GREEN except `emit_biblio` = **BLOCKED** |
| `seo_check` | 10/10 GREEN |
| release manifest | PASS (11,036 assets) |
| Worker tests | 13/13 |
| trika-x tests | slice tests 4/4; report tests 5/5 |
| Live site | `?view=practice`, `wheels`, `/a/sarvatra/`, `about/`, `?view=scholar` all 200 |

**The one BLOCKED, stated plainly:** this box's openpatala DB has **555 works**;
the committed `data/biblio.json` was emitted elsewhere from a **2,051-work** DB
(the Muktabodha enrichment). The gate now says `BLOCKED` (exit 3) instead of
red or a silent pass. To clear it: get the enriched DB dump onto this box, then
`python3 tools/emit_biblio.py` (write) and regenerate the manifest.

---

## 4. What is genuinely left

1. **MCP bridge + tunnel** (W3) — the one build that makes ChatGPT real.
2. **OAuth** for the write sheaf (progress only).
3. **Candidate eval run** (W5) — pick one, admit it, score 50 passages by hand.
4. **Mātṛkā gates** — wire practice stages into the server gate.
5. **Sync the openpatala DB** to clear the BLOCKED biblio.
6. W6/W7 — deferred by design until 3 exists.
