<!-- vendored: source=/root/trika-x/MASTERPLAN2.md sha256=7ba167fc31554eacd962d0bd7fc0c99eaa86d3ef53ed949ebd9c2f93dc11a92c fetched=2026-11-11
     edit the source, not this copy; regenerate with tools/emit_endgame_docs.py -->

# MASTERPLAN2 — execution plan for the measured machine (2026-11-08)
*Status: CANONICAL. Execution plan; §2 baseline is an explicitly dated 2026-11-08 snapshot.

*Status: canonical execution plan from 2026-11-08. Supersedes the ordering in
`NEXT-STEPS.md` (kept as reference). `MASTER-PLAN.md` remains the architecture
and phase order — see its AMENDMENT 2026-11-08 for the updated scoreboard.
This file turns that scoreboard + the 20-todo queue + `docs/log/REVIEW-2026-11-08.md`
into one ordered, gated build plan. Every number below was measured on box
2026-11-08; every unmeasured item is marked as a claim, never a fact.*

---

## 0. The objective (one line)

An outsider, with no account and no code, can take any claim we publish, fetch
its trace and its bytes, recompute the hashes, and see the same numbers we do —
and where we could not verify something, we said so first.

**Definition of done (whole plan):** one question asked in chat → witness-pinned
(or honestly CANDIDATE) passages → layers → checked theorem → argued node →
crux → audited draft → PUSHBACK → human sign → release + DOI → optional video —
and every link replays from the DOI back to the manuscript witness using only
the three legitimacy logs (audit receipts, openpatala events, sanskritbench runs).

---

## 1. Laws inherited (non-negotiable, none re-opened here)

1. **Nothing is real because a file exists.** A claim needs a logged,
   reproducible gate. BLOCKED is never PASS.
2. **Machine proposes, human disposes.** No auto-sign, auto-publish,
   auto-practice-authorization, ever.
3. **Tiers on every claim** (T/R/E/C/H/X); R never promotes itself.
4. **Fail-closed.** Timeouts, blocks, empty responses are ERRORS, never passes.
5. **No rung ships without** hash + grounds/decision + gate + signer-role.
6. **Only `decide` proves** inside its finite scope. Heuristic PASS ≠ proof.
7. **Lanes respected.** translation-work ingest, ipvv worker, bookfactory,
   videofactory, svread worker are other lanes: read-only + specs + CLAIMS
   notes from trika-x. No writes into their repos.
8. **History is never edited.** Corrections are new dated files.
9. **One identity system.** openpatala is the root. No second DB, ledger, or
   ID scheme.
10. **Private stays private.** Diary material ships only with explicit,
    scoped, revocable consent. No auto-publish of personal material, ever.

---

## 2. Measured baseline (2026-11-08 — the only trusted numbers)

| Layer | Measured state | Source |
|---|---|---|
| openpatala gate | GREEN: api/mcp/evidence/db PASS; conformance + witnesses BLOCKED (recorded) | `python3 check.py` |
| openpatala DB | 555 works · 909 passages · 102 editions · 87 etexts · 1559 assertions · 121 ext-ids · 20 people · **0 witnesses** | live postgres |
| Upstream evidence bundle | 996 works · 79 assertions · 38 ext-ids · 990 events · 1 artifact | `data/evidence/evidence-bundle.json` |
| translation bridge | 28 works · 154 passage IDs · ledger bytes match · witnesses UNPINNED | `bridge_resolve.py --check` |
| source-map | 87 works · **6 bridged / 81 todo** | svread `source-map.json` |
| formal | 157 theorems · 155 entries + 2 exemptions · 0 bad chunk refs · axiom CLEAN (static) | `evidence_check.py` |
| formal coverage | **16/154 passage chunks (10%)** · gap list published | `data/formal.json` |
| traces | **909 bundles** (236 COMPLETE / 673 PARTIAL, trika-x side), external verify packs live | `data/traces/index.json` + svread publish |
| svread surface | 50 readable works · 55 scholar projections · 7078 manifest assets (incl. 909 verify packs) · 10 Sanskrit lessons | live site + manifest |
| tests | trika-x 94 · svread 51/0 (+5 skipped without infra) · gateway 11 · Lean harnesses green | 2026-11-08 runs |
| PUSHBACK | live (mock/go/cf, opt-in, verbatim shield, never edits) | `formal-trika/tools/pushback.py` |
| Hygiene | disk **95% (3.9G free)** · tree clean · nightly cron installed (03:00) · token rotation **still unconfirmed** | box |

**Staleness register** (fix the paper, not the machine; full list in
`docs/log/REVIEW-2026-11-08.md`): openpatala README counts (1099/247/2181) are stale vs
evidence-bundle (996/79/990) vs box DB (555); "slang landed" unverifiable on
svread disk; "Treeka assembler = one tool" not built; WITNESS-OCR is a doc.

---

## 3. Workstreams (the 20 todos, grouped and ordered)

Each item: **gate that marks it done** · **owner/lane** · **blocker**.
Priority: P0 = unblocks everything; P1 = proof/verification; P2 = surface &
closure; P3 = scale & humans; P4 = personal recipes (consent-gated).

### W0 — Hygiene & autonomy (P0, do first, ~1 session)

| # | Item | Done when | Owner | Blocker |
|---|---|---|---|---|
| 10a | Disk recovery to safe headroom | `df -h /` ≥ 15% free; deletions only of R2-pinned/rebuildable temp, each logged | box ops | owner eyes on shared checkouts |
| 10b | Dirty branch resolved | `box/peer-review-batch` committed or stashed with dated rationale; `git status` clean | trika-x | none |
| 10c | Nightly verify cron | log shows 7 consecutive green days | owner (writes cron) | owner call |
| 10d | Token rotation | R2 + Go keys rotated, old revoked, `/root/.env` updated, repo scans clean | owner | owner action |
| 10e | Secrets + disk guard in CI | preflight fails on secret grep hit or disk <10% | trika-x | none |

*Why first:* every later gate (tau scale, Mutate remainder ~2.9G, COMET torch)
needs disk; a dirty branch makes every `evidence_check` unreproducible.

### W1 — Identity root / openpatala (P1)

| # | Item | Done when | Owner | Blocker |
|---|---|---|---|---|
| 1 | Honest gate stays green | `check.py` GREEN with only numbered BLOCKED; no new silent FAIL | openpatala lane | adapter fix upstream |
| 19 | Corpus/biblio feed routine | atlas seeds re-run on atlas rev change; people/translations/editions current; refs not forked | trika-x | atlas rev cadence |
| 13 | Chunk↔verse map + source_verses | bridge resolves chunk → verse → witness-status for every ledger work; remainder tracked | translation-work lane | their build |

*Correction to old plan:* A-track is not "get everything openpatala" — 102
workdirs already have rows. It is "keep the gate honest and close the 81
unbridged works one lane decision at a time."

### W2 — Verification & traces (P1, the moat)

| # | Item | Done when | Owner | Blocker |
|---|---|---|---|---|
| 2 | R1 trace every readable passage | `data/traces/index.json` covers ≥90% of passages in readable works; every pack reproduces its trace; PARTIAL is labelled, never hidden | trika-x + svread | none (autonomous) |
| 5 | R4 chat cites verifiably | every chat answer citing a trace-bearing chunk returns trace + pack link; untraced chunks say "unverified" | svread worker | worker lane |
| 11 | Bench calibration (CPU first) | tau 3×3 smoke logged; gate-vs-gold false-PASS/BLOCK rates measured; thresholds stamped | sanskritbench | quota only for scale |

*Why now:* this is the one thing no competitor has — checkability without our
code. This session broadened it from 13 chunks to all 909 ledger locators;
that is the moat, and it needed no new infrastructure.

### W3 — Formal coverage (P1, gap-list order only)

| # | Item | Done when | Owner | Blocker |
|---|---|---|---|---|
| 4 | R3 formal >50% of gold chunks | each new theorem: prereg → model → must-fail twin → EVIDENCE → TABLE → run receipt; gap list still published | trika-x | scholar review for promotion (P-TK1) |

Order (never by taste): **phr mala rows (head phr-p05, prereg exists)** → VBT
clusters → tsa08 remainder → tsa01–22 gaps → tal-a15 remainder. P-TK1 / ti-ca /
rater-2 promote claims; they never initiate rungs.

### W4 — Witness column (P1, the only human-archive gate)

| # | Item | Done when | Owner | Blocker |
|---|---|---|---|---|
| 3 | R2 one VERIFIED witness | one core work has `witness.status = VERIFIED` with a real shelfmark; its trace's source hop cites it; UNKNOWN stays UNKNOWN elsewhere | owner/scholar (NGMPP) | manuscript eyes |

Candidates file is ready (`bridge/witness-candidates.json`). WITNESS-OCR is a
proposal, not a pipeline — do not present it as one.

### W5 — Datastructures / Treeka (P1–P2)

| # | Item | Done when | Owner | Blocker |
|---|---|---|---|---|
| 12 | Decision trail at ingest | L0/L2/L4 acceptance writes decision rows; submission with unsigned load-bearing decision refused (409) | translation-work lane (checker ready) | lane wiring |
| 14 | Treeka view live | works → passages → argmaps → cruxes → essays + gap report (unargued / cruxless / essayless / unformalised) rendered and queryable | trika-x (`treeka.json` live) + svread view | none for read-only assembler |

### W6 — Scholar loop (P1–P2, Variety 1 + 2)

| # | Item | Done when | Owner | Blocker |
|---|---|---|---|---|
| 7 | Variety 1 close | PUSHBACK pass runs pre-review by default (opt-in quota); one signed essay gets a resolving Zenodo DOI; outsider replays DOI → witness | svread lane + owner token | **Zenodo token** |
| 15 | Crux queue + propose loop | gap report + pushing catalog → prioritized queue; Svatantrya drafts per crux (assisted flagged, quota-limited), audit + PUSHBACK, leaves proposal; never auto-sign | trika-x + scholar | quota for live runs |
| 20 | Peer-review debt | LEAD-REVIEW 16 flaws + REVIEW-REQUEST PR #5 answered in dated notes; each flaw marked fixed / accepted / rejected with evidence | trika-x | none |

### W7 — Surfaces (P2)

| # | Item | Done when | Owner | Blocker |
|---|---|---|---|---|
| 6 | Sanskrit `?view=sanskrit` slice | lesson l01 (mamātmā) shows verse, literal-gloss breakdown, rb-1/rb-2, chat from the same evidence spine with receipts, grammar tab labels every ML line with model+status; outsider replays lesson→locator→bytes→gate | svread lane (spec: `SVREAD-SANSKRIT-SPEC-2026-11-07.md`) | audio render = owner go |
| 9 | R5 discoverability | `site:` returns pages; Search Console impressions; ≥1 external referring domain | owner + trika-x content | owner Search Console / outreach |

*Honest note:* Google ignores llms.txt (documented). The lever is static
crawlable lesson pages + inbound links. Keep llms.txt for agents, never claim
it buys Google citations.

### W8 — Media / practice loop (P2–P3)

| # | Item | Done when | Owner | Blocker |
|---|---|---|---|---|
| 16 | Video carry-through | packs carry `evidence_refs` (work/locator/ledger-sha); sealed mp4 inherits GOLDEN gates; render refuses on missing refs | videofactory lane | their sealed path |
| 17 | Nibbanahelp N1 | sessions → tension/crux queue exporter, read-only, recurring unresolved questions feed the Treeka gap report | nibbanahelp + trika-x | VOICE RULE compliance |
| 18 | Syllabus compiler C1–C4 | C1 one practice unit rendered (study-only) → C2 37 āhṇikas classified → C3 path IDs + Series → C4 loop closure (day-gate, request→vid) | trika-x + satsang practice | dīkṣā policy (owner) |

### W9 — Endgame recipes (P4, consent-gated spec→build)

| # | Item | Done when | Owner | Blocker |
|---|---|---|---|---|
| 8a | R1 diary → personal essay (read) | consent-scoped diary → retrieve-first teacher → essay compile (verbatim diary voice + banked claims + tiers) → audit → pushback → human sign; no auto-publish | nibbanahelp + essay lane | running diary consent path |
| 8b | R7 diary year-review book | year boundary explicit; tension arcs human-flipped only; unresolved tensions stay unresolved in print; TEXT-GATE per entry | bookfactory lane | owner go |
| 8c | R8 poem book from your words | verbatim selection only (arrangement is the only craft); no generated or paraphrased lines; L3/L4 craft passes | bookfactory lane | owner go |

Recipes R2–R6, R9 stay spec-only. **R9 short movies explicitly NOT YET** —
gated on model quality set by the owner; no build, no tests, no placeholders.

---

## 4. Phased execution

### Phase 0 — Hygiene + honesty lock (this week, autonomous)
W0 complete; openpatala gate re-run and pinned; `docs/log/REVIEW-2026-11-08.md` accepted
as the staleness register; canonical-counts rule enforced (counts carry
bytes+hash or they don't ship). **Exit:** disk ≥15% free, clean branch, cron
decision recorded, one honest gate run archived.

### Phase 1 — Broaden the moat (autonomous, 1–2 weeks)
W2 R1 traces to ≥90% of readable passages; W4 R4 chat verify links where traces
exist; W3 formal works the gap list from phr-p05; W5 treeka view (read-only)
plus decision-trail checker wired to the lane. **Exit:** an outsider can verify
any readable passage, not just 13; treeka gap report is queryable; formal
coverage climbing with receipts.

### Phase 2 — Close the loop (needs 2 human answers)
W6 Variety 1 to DOI (Zenodo token) + PUSHBACK default + crux propose loop;
W7 Sanskrit slice accepted and deployed; W1 bridge remainder decisions with
the translation lane. **Exit:** one DOI'd essay replays end-to-end; Sanskrit
lesson verifies; 81 unbridged works have explicit decisions (bridged or
UNRESOLVED-with-reason).

### Phase 3 — Scale + scarce reality (quota/GPU/humans)
W3 >50% coverage with promotion gates; W4 one VERIFIED witness; W8 video
carry-through + syllabus C1–C4; W9 recipes as owner approves consent paths;
bench tau scale (n≥30, Wilson CI) when quota allows. **Exit:** the
definition-of-done slice exists once, with every link green.

### Phase 4 — Replication & breadth (only after Phase 3)
Second model family on the same claims (REPLICATED status path); Greek/Pāli
breadth only if the same primitives hold unchanged; no non-Trika expansion
before the loop closes.

---

## 5. Dependency graph

```
W0 hygiene ──► everything (disk, clean tree)
W1 openpatala gate ──► W2 traces ──► W6 DOI replay
W1 bridge (28/154) ──► W5 treeka view ──► W6 crux queue
W3 formal ──► W5 treeka formal column ──► W6 essay grounds
W4 witness ──► W2 trace source hop ──► W6 citable primary source
W7 Sanskrit ──► W8 syllabus (lesson units) ──► W8 practice loop
W6 PUSHBACK ──► W9 recipe audit (reuse, don't rebuild)
W2 bench calibration ──► every metric claim (thresholds stamped)
```

Rules: no arrow may be skipped by claiming its upstream is "close enough";
BLOCKED upstream propagates as BLOCKED downstream, never as PASS.

---

## 6. Human-gate register (what we cannot unblock ourselves)

| Gate | Who | Unblocks | Status |
|---|---|---|---|
| Zenodo token | owner | first DOI (Variety 1) | dry-run builds ready |
| P-TK1 ruling | scholar | first scholar-signed formal claim | pack ready, unestablished |
| rater-2 pass | second human | T-C2 criteria bite (kappa ≥0.6) | sheet ready |
| ti/ca signatures + station | scholar | mapping beyond structural side | pilots exist |
| NGMPP / microfilm eyes | owner/scholar | VERIFIED witness | candidates ready |
| dīkṣā policy | owner | practice authorization boundary | compiler holds STUDY-only |
| Journey / ledger / trajectory / vis-mode go | owner | W8 loop closure | spec only |
| Audit voice render go | owner | Sanskrit recitation audio | audio-plan ready |
| Search Console + outreach | owner | R5 indexing | site shipped |
| Token rotation + cron install | owner | W0 closure | scripts ready |

**Rule:** rulings promote, never initiate. The machine keeps building.

**Adopted from PR #7 (lead review 2026-11-08):** every rung ships as R-tier
count-facts only and every citation carries the R-tier + "registry refs
unreviewed" qualifier; twin refusal is an anti-vacuity check, not a semantic
validation; **second-encoder review is owed and BLOCKS any promotion above
R** (scholar/lead channel); a first DERIVED essay exemplar is owed before any
DOI (Q12); finite-count velocity never substitutes for doctrinal leverage in
rung choice.

---

## 7. Scoreboard (current → target, with honest denominators)

| Metric | Now | Phase 1 | Phase 2 | Phase 3 |
|---|---|---|---|---|
| openpatala gate | GREEN, 2 BLOCKED | same, numbered | same | ≤1 BLOCKED (witness) |
| Works in DB | 555 | 555 | 555+ | 600+ |
| Bridged works | 6/87 | 6/87 | 87/87 decided | 87/87 |
| Traces | 909 (236 C / 673 P) | ≥90% readable | all readable | all + packs |
| Formal coverage | 16/154 (10%) | ~30/154 | ~50/154 | >77/154 (50%) |
| Witnesses | 0 | 0 | 0 | ≥1 VERIFIED |
| Scholar projections | 55 | 55 | 56+ | all readable |
| Essays with DOI | 0 | 0 | 1 | several |
| Sanskrit lessons live | 10 (verbatim) | l01 slice | full slice | audio (go) |
| Discoverability | 0 indexed | submitted | indexed | ≥1 ref domain |
| Tests | 94 / 51 / 11 | +new | +new | CI gate |
| Disk free | 3.9G (95%) | ≥15% | ≥15% | ≥15% |

Never report a numerator without its denominator. Never report "complete"
without a replay path.

---

## 8. Risk register

| Risk | Impact | Mitigation |
|---|---|---|
| Disk 98% | blocks tau scale, Mutate, torch | W0a first; owner eyes before deleting shared checkouts |
| Dirty peer-review branch | unreproducible evidence | W0b: commit/stash with rationale before any rung |
| Three-number drift (1099/996/555) | credibility hole | canonical-counts rule; wiring test enforces llms.txt |
| Token exposure (R2/Go pasted) | security | W0d rotation; `/root/.env` only; secret grep in preflight |
| Lane collision | other agents' repos corrupted | read-only + specs + CLAIMS notes; never write their files |
| Scope creep (R9 movies, Greek) | dilution | explicitly parked; Phase 4 only after loop closes |
| Quota dependence (tau, PUSHBACK live) | stalls calibration | CPU-first calibration; live runs batched to funded sessions |
| Overclaiming formal/coverage | repeats 0.5.2 failure | tiers + `formalized: null` for unknown; gap list always published |

---

## 9. Change control

- **MASTERPLAN2** supersedes `NEXT-STEPS.md` ordering (NEXT-STEPS stays as
  reference). `MASTER-PLAN.md` keeps architecture + phase order; its
  2026-11-08 amendment carries the scoreboard.
- `docs/log/DECISION-PACKET-2026-11-06.md` remains the live list of human asks; update
  statuses there, do not fork a second ask list.
- `docs/log/REVIEW-2026-11-08.md` is the staleness register; corrections to it are new
  dated files, never edits.
- `SYNERGY-CHAIN-2026-11-08.md` is the composition + versioning protocol (how
  the parts feed each other, how numbers stay sharp). `freshness.py --check`
  is the drift gate it depends on.
- `DOCS.md` is the entry point: read order, map, and handover to the next
  lead agent. Dated records live under `docs/log/` (append-only).
- `MCP-OPS.md` is the federation operating guide; `tools/mcp_catalog.py
  --check` is its drift gate (104 tools / 8 families, measured 2026-11-08).
- Each workstream item closes with: commit SHA, gate output pasted into a dated
  process note, and the artifact path. If it isn't in the trace, it didn't
  happen.

---

## 10. Non-goals (binding)

No second database, ledger, or ID scheme. No auto-sign / auto-publish /
auto-practice-authorization. No quota spend on grunt work. No GPU-blocked work
without a GPU box. No heuristic PASS, beautiful output, or big model treated as
proof. No invented witnesses, editions, or DOIs. No editing history. No
non-Trika expansion until the loop closes. No claiming the model is the mind.
No rendering short movies (R9) until the owner sets the bar and models qualify.

---

## 11. First three moves (this session, if nothing else)

1. **W0** — disk headroom + commit/stash the dirty branch (no destructive gc
   without owner go). Everything else depends on it.
2. **W2/R1** — run the trace compiler over all readable works; publish PARTIAL
   honestly; extend `data/traces/index.json` toward ≥90%.
3. **W5/treeka** — refresh the read-only treeka gap report so the next rung,
   the crux queue, and the Sanskrit lessons all read from one live index.

Everything after that is ordered by the phases above, and every claim is
reported with its denominator and its replay path.

---

## 16. NORTHSTAR — everything derivable from Sanskrit to essays (2026-11-08)

**The northstar:** every essay in the estate resolves to Sanskrit bytes
through a machine-checked chain — essay claim → chunk locator → layer bytes
→ trace bundle → source bytes + witness status. Anything that does not
resolve is labelled PARTIAL or BROKEN, never shipped, never signed.

**Honest status against the northstar (measured 2026-11-08):**

- openpatala is NOT fully done: adapters discover nothing (upstream gap),
  witnesses 0 corpus-wide, 81/87 works unbridged, DEV-PLAN phases 1.1–1.8
  open. It is an honest working root (555 works / 909 passages, gated),
  not a complete identity system.
- trika-x is NOT fully done: 157 theorems over 16/154 chunks (10%); 893/909
  passages without registry refs; no witnesses; human gates open.
- trika-x CAN serve as the foundation for essays and peer review TODAY for
  the machine side: essay gate (`essay_check`), claim tables, audit_draft,
  PUSHBACK, review packets, Core promotion refused without authenticated
  review. What it cannot do alone: verse-pin chunks (chunk↔verse map, lane),
  sign layer decisions (lane), witness anything (archive), or rule (humans).

**The 10-item derivability queue (all autonomous — no owner, lane, or quota):**

| ID | Item | Done means |
|---|---|---|
| N01 | `essay_derive.py` chain audit | every essay claim carries chunk → layer → trace → source-bytes status |
| N02 | Derivation audit over all compiled essays | DERIVED/PARTIAL/BROKEN per essay; machine-fixable breaks fixed |
| N03 | Candidate chunk↔verse map (read-only, trika-x side) | verse ranges for every chunk, all CANDIDATE, lane disposes |
| N04 | Decision-trail audit across works | unsigned load-bearing decisions listed per work |
| N05 | VBT-cluster rung P-VBT1 (8 candidate forms) | prereg → model → twin → EVIDENCE + TABLE | done 2026-11-08: Vbt.lean, twin refused |
| N06 | Second rung P-VBT2 (3 unpointability coordinates) | same discipline | done 2026-11-08: twin refused; negation-count variant rejected on held spans |
| N07 | Machine review packets for top queued cruxes | audit + PUSHBACK queued; rulings stay human |
| N08 | Essay seeds for top queue items | machine-proposed, labelled, never canonical |
| N09 | Freshness tracks essay-derivation metrics | derived/partial/broken counts in the ledger |
| N10 | Full regression battery + log | every gate green in one archived run | done 2026-11-08: 79 tests, all gates, openpatala GREEN; harness receipt 247d897 exit 0/0/0 |

Rule: no essay, seed, packet, or rung ships a claim its chain cannot
produce. The chain is the product; the prose is its rendering.

---

## 12. The 20-item execution queue (2026-11-08)

Single ordered queue. IDs are stable — refer to them in commits and process
notes. A row closes only with: commit SHA + gate output + artifact path. No
row closes on intent. `P` = phase (0 hygiene, 1 moat, 2 close loop, 3 scale).

| ID | Item | Workstream | Gate (done means) | Owner/lane | Depends on | Status |
|---|---|---|---|---|---|---|
| Q01 | Disk headroom: inventory + safe reclamation to ≥15% free | W0 | `df -h /` ≥15%; every deletion logged, shared checkouts untouched | box ops + owner eyes | — | in progress |
| Q02 | Install nightly-verify cron | W0 | log shows 7 consecutive green days | owner | Q01 | blocked (owner call) |
| Q03 | Rotate pasted R2/Go tokens | W0 | old revoked, `/root/.env` updated, repo scans clean | owner | — | blocked (owner action) |
| Q04 | Regression gate: openpatala check.py GREEN; freshness SHARP | W0 | both commands exit as designed on a clean tree | trika-x + openpatala | — | pending |
| Q05 | Compile traces for every chunk in every readable work | W2 | `data/traces/index.json` ≥90% of readable passages; every pack reproduces; PARTIAL labelled | trika-x (+ svread publish) | Q04 | trika-x done 2026-11-08: 909/909 (236 C / 673 P); svread publish pending lane |
| Q06 | Chat answers carry trace+pack links, else say "unverified" | W2 | wiring test: traced chunk → working link; untraced → explicit label | svread worker | Q05 | pending |
| Q07 | Bench CPU calibration: tau 3×3 + gate-vs-gold | W2 | tau smoke logged; false-PASS/BLOCK measured; thresholds stamped | sanskritbench | — | pending |
| Q08 | Formal next rung phr-p05 | W3 | prereg → model → twin refuses → EVIDENCE + TABLE + run receipt | trika-x | Q04 | pending |
| Q09 | One VERIFIED witness (NGMPP shelfmark) | W4 | `witness.status = VERIFIED`, trace source hop cites it, UNKNOWN kept elsewhere | owner/scholar | archive access | blocked (human) |
| Q10 | Layer-accept decision rows at ingest | W5 | unsigned load-bearing decision refused (409) | translation-work lane | lane wiring | pending (other lane) |
| Q11 | Treeka view live | W5 | gap report queryable: unargued/cruxless/essayless/unformalised | trika-x (+ svread view) | Q05 | pending |
| Q12 | Variety 1: PUSHBACK default + first DERIVED exemplar + Zenodo DOI | W6 | PUSHBACK runs pre-review; one essay chain goes DERIVED (`essay_derive`); one DOI resolves and replays to witness | svread + owner | Zenodo token | blocked (token; DERIVED exemplar owed first per lead R3) |
| Q13 | Crux queue + Svatantrya propose loop | W6 | prioritized queue; draft per crux (assisted flagged), audit+PUSHBACK, never auto-sign | trika-x + scholar | Q11, quota | pilot done 2026-11-08: queue 882; param-p02 drafted (qwen) → audit → PUSHBACK (mistral) 2 objections; proposal only |
| Q14 | Peer-review debt: LEAD 16 flaws + PR #5 scope | W6 | each flaw marked fixed/accepted/rejected with evidence, dated note | trika-x | — | pending |
| Q15 | Sanskrit `?view=sanskrit` l01 slice | W7 | lesson → locator → bytes → gate replay; ML lines labelled | svread lane | — | pending (spec ready) |
| Q16 | Discoverability R5: Search Console + first inbound domain | W7 | `site:` returns pages; impressions; ≥1 referring domain | owner + trika-x | — | blocked (owner/outreach) |
| Q17 | Video: packs carry `evidence_refs`; sealed mp4 GOLDEN | W8 | render refuses without refs; receipt carries them | videofactory lane | — | pending (other lane) |
| Q18 | Nibbanahelp N1 sessions exporter | W8 | read-only exporter feeds tension/crux queue; VOICE RULE tested | nibbanahelp + trika-x | — | pending (other lane) |
| Q19 | Syllabus compiler C1–C4 | W8 | study-only unit → 37 āhṇikas → paths → day-gate closure | trika-x + satsang | dīkṣā policy | blocked (policy) |
| Q20 | Recipes R1/R7/R8 consent paths | W9 | consent-scoped diary → essay/year-review/poem book; no auto-publish; tests | nibbanahelp + bookfactory | owner go | blocked (owner) |

### Queue rules

- One `in_progress` at a time; blockers are named, never skipped.
- Owner-gated rows (Q02, Q03, Q09, Q12, Q16, Q19, Q20) do not stall the queue:
  the machine continues on the next autonomous row.
- A row that reveals a new stale number must update `freshness.json` in the
  same session.


---

## 13. MCP hardening pass (2026-11-08, M01–M05)

| ID | Item | Result |
|---|---|---|
| M01 | Inventory surfaces vs doc claims | 104 tools / 8 families live; docs said 98 and `book__*` (drift found) |
| M02 | Prove servers start + answer | gateway + all five children answered `tools/list` and representative calls |
| M03 | Fix doc drift | FORMAL-MCP v3 (7 tools implemented); PARENT-CONTRACT prefixes/counts; FEDERATION/MODULES 98→104 |
| M04 | Harden conformance | gateway tests 11 GREEN (guide prefixes, local families, catalog-vs-live); pre-test expected surface updated to real names |
| M05 | Operating guide | `MCP-OPS.md` (topology, quickstart, catalog, contract, troubleshooting) |

Verified commands: `python3 -m unittest formal-trika.tests.test_federation_gateway`
(11 OK), `python3 tools/federation_pretest.py` (GREEN), `python3
tools/mcp_catalog.py --check` (SHARP).


---

## 14. Autonomous work log (2026-11-08, second pass)

- **Freshness made a gate.** `formal-trika/tools/freshness.py` captures every
  canonical number with its command + source hash; `--check` fails on drift.
  Disk is context, not a claim (10MB noise must not fake data drift). Ledger
  now includes the trika-x trace index. State: SHARP.
- **Q05 trace coverage (trika-x side).** `formal-trika/tools/trace_all.py`
  compiles every ledger locator: **909 bundles / 87 works / 0 errors —
  236 COMPLETE, 673 PARTIAL** in 18.5s, 4.2MB. Two samples re-verified with
  `trace_bundle.py --verify` (one COMPLETE, one PARTIAL). PARTIAL names its
  gaps; nothing was promoted. svread publication (`emit_verify.py`) is the
  lane's next step, not done here.
- **MCP hardening** — see §13. 76 tests green, pre-test GREEN, catalog SHARP.
- **Docs** — `MCP-OPS.md` added; FORMAL-MCP v3; PARENT-CONTRACT/FEDERATION/
  MODULES counts corrected to 104 tools / 8 families.


---

## 15. Autonomous work log (2026-11-08, third pass)

- **Q07 bench CPU half.** Real 3×3 smoke (`validate_benchmark --n 3 --m 3`,
  model mimo-v2.5 via hermes): all tau undefined (tied/constant) — run
  `54b08b41` logged, no win, plumbing only. `calibrate_gate.py --n 200`
  reproduces the 11-06 record **byte-identically** (false-BLOCK 0.290;
  false-PASS hallucinated 0.235 / truncated 0.885 / term-drift 0.725 /
  source-repeat 0.090; verdict GATE NEEDS TUNING). Determinism is the sharp
  part: same seed, same numbers, no human conclusion drawn.
- **Q08 rung phr-p05.** `PREREGISTRATION-PHR-CLOSE-RUNG.md`: P-PHR4
  (closing sequence `[17,18,19,20]`, length 4) + P-PHR5 (means named once,
  `[18]`, length 1 ∧ Nodup), R-tier, L2 + ledger + ARGMAP ground. Lean 4.34.1
  compiles; `BrokenPhrThreeCloses` (`[17,19,20]`) and `BrokenPhrTwoMeans`
  (`[18,19]`) both refuse at the expected false proposition (single-line
  diffs verified). Wired into `control/run.sh`, `TABLE-READINGS.md`,
  `EVIDENCE.json` (155 theorems / 153 entries, axiom CLEAN static). Full
  harness receipt (`record_run.py`) running in background.
- **Q11 treeka view.** `treeka_report.py` renders `treeka.json` as a
  queryable gap report (`--work`, `--queue`, `--md`; rung-queue order:
  phr mala → VBT clusters → tsa08 remainder → rest). Refresh caught real
  drift: the committed `treeka.json` lacked registry refs for phr-p01..04
  and span-p01 that EVIDENCE already had — now 893 unformalised (was 900),
  matching `evidence_check` 16/154 chunks.


- **Q14 dispositions.** LEAD's 7 findings verified against live code
  (L1–L5, L7 mechanism-fixed; L6 opt-in gate exists, provenance open; core
  promotion refuses with 0 Core rows). REVIEW-REQUEST's 16 answered as
  recorder, not ruler: 5 need human/lane rulings (R2, R6, R7, R10, R11),
  4 scholar-channel (R8, R9, R16 + R12 owner's), R15 grammar proposed
  (`theorem:<repo>:<path>::<name>`, non-binding). Nothing claimed closed that
  isn't machine-checked.

- **Q08 receipt.** `runs/runs.jsonl` 2026-11-08T06:29:49Z rev `ab5dfcc`:
  control exit 0 (incl. `BrokenPhrThreeCloses: closes_four is false`,
  `BrokenPhrTwoMeans: means_once is false), recognition exit 0, tc1 exit 0.
  Coverage now 157 theorems / 155 entries, 16/154 chunks (10%).

- **Q13 pilot.** Queue refreshed: 882 argmap-uncertainty candidates
  (priority 0 = referenced works first). Head crux param-p02 (v15/v16/v18)
  drafted by qwen3-30b (2/2 CITED, audit 12 checks) then destroyed by
  mistral-small (2 objections, honest remainder: R reconstructions, no formal
  entries). Two families, free rails, zero quota. Draft + receipt + pushback
  in `swarm/robo-param-p02-2026-11-08-071651.*` — proposal, never signed.

- **VBT receipt.** `runs/runs.jsonl` 2026-11-08T08:46:13Z rev `247d897`:
  control exit 0 (incl. `BrokenVbtSeven: forms_eight is false`,
  `BrokenVbtTwoCoords: coords_three is false), recognition exit 0, tc1 exit 0.
  Coverage 157/155, 16/154 chunks (10%). Queue head: vbt-p03.

---

## 17. Adopted delivery order (PR #7 §5, 2026-11-08)

Seven checkpoints, small PRs, reviewer-readable diffs, green scoped runs. Do
not wait for the whole corpus to be perfect; do not use a green artifact as
scholarly sign-off. Trika-x's role is marked per checkpoint; the rest belongs
to the owning lanes (filed in `LANE-ASKS-2026-11-08.md`).

| # | Checkpoint | Owners | Trika-x part | Done when |
|---|---|---|---|---|
| 1 | Stop inaccurate claims + unsafe checks | svread, openpatala, sanskritbench | none (lanes) | misleading data regenerated, synthetic counterexamples covered, status read-only, exact revisions published |
| 2 | Make the two active PRs reviewable | trika-x, svread | split-by-concern description, fix trace verification/IDs/status semantics, regenerate Frontier rows | CI runs against exact head; a human can assess without unrelated files |
| 3 | Repair one source passage end to end (phr 1–4) | translation-work + openpatala + Sanskrit reviewer | none until the passage lands | every translation/claim resolves to its span + editorial status; a changed byte invalidates approval |
| 4 | Connect that passage to one formal example + one essay | trika-x + Scholar | model grammatical/propositional structure separately from counts; bind per-declaration run evidence; prepare essay whose claims resolve to the reviewed passage | source → translation → interpretation → model → proof result traceable incl. remainder; author can sign one exact essay revision |
| 5 | Ship a thin reader slice | svread + ipvv | none (lanes) | clean checkout builds the same output; stale inputs visible; synthetic accounts isolated |
| 6 | Connect outputs + teacher selectively | bookfactory, videofactory, teacher | evidence_refs in packs (already spec'd) | artifacts cite input revision; user can export/delete private sessions |
| 7 | Archive + automate maintenance | each repo | STATUS.md + clean-checkout fixture suite + exact-revision CI outcomes (W07/W10) | another agent finds the contract and reproduces the narrow example without box paths or private data |
