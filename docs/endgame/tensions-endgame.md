<!-- vendored: source=/root/svread/TENSIONS-ENDGAME.md sha256=3b34bbbbe6442bc8852c3ae7f5e0c0605238dc3f657cfa18c1e6767d0488a784 fetched=2026-11-11
     edit the source, not this copy; regenerate with tools/emit_endgame_docs.py -->

<!-- status: historical vision — see MASTERPLAN3.md -->

> **Status (2026-11-11):** historical vision — see MASTERPLAN3.md.

# Tensions Endgame — the name of the game

Owner decision (2026-11-04, verbatim in `SCHOLAR-ENDGAME-VISION.md`): the
endgame is **tensions**. Scholar cruxes and personal knots are the same
object. Tensions get resolved through essays that clear them up; essays
become videos. Chat turns are tensions too — anything unresolved that a
person or a text is carrying.

## The two loops, one shape

| | Personal (`prx0r/nibbanahelp`) | Scholar (svread / translation-work) |
|---|---|---|
| Tension record | `tensions/<id>.md` — status, domain, roots, progress log | Pushing Lab crux node — question, sources, readings, objections |
| Resolution | `essays/*.md` with `resolves: <id>` | Scholar essay draft → review → sign-off → published |
| Video | `videos/<slug>.pack.md` from the essay's own words | Pack contract defined; renderer wiring is next |
| Tooling | `tools/resolve.py` (check / link / propose / pack) + tests | Pushing Lab UI + Scholar lifecycle (live per `SCHOLAR-ENDGAME-SPEC.md`) |

Lifecycle in both: **open → loosening → resolved-by-essay → video**.
Scholar adds review + sign-off between essay and publish; the personal loop
adds speaking (an essay isn't done until it can be read aloud).

## Laws (both loops)

1. Essays resolve tensions; nothing deletes them. Resolved tensions stay as
   lineage for the next person.
2. Status flips are human, always. Tools propose (`propose`), never flip.
3. Machines write sidecars only. In nibbanahelp the tool never edits a
   tension body (voice rule). One essay resolves at most one tension.
4. Spoken text is never paraphrased by tooling — packs quote, renderers
   render, and any generated line is marked as generated.
5. Scholar trust vocabulary is unchanged: signed ≠ reviewed ≠ verified.
   A resolving essay is a signed position, not a proof the tension is gone.

## Where each piece lives today

- `nibbanahelp/tensions/` — 3 live tensions (coffee-addiction loosening,
  debt-1500 loosening, hidden-sexuality-shame open). Loop tooling shipped.
- `nibbanahelp/essays/` — speakable essays, `resolves:` header, sidecar
  `tensions/_links.json` (created on first `link`).
- `nibbanahelp/videos/` — frozen packs in 4 forms (`read` · `comic` ·
  `parable` · `diagram`), each carrying its contract + evidence in its
  header. No renderer is invoked by this loop — packs are the contract,
  renderers are replaceable.
- Scholar Pushing Lab — 57 pinned enquiries, crux briefs, essay seeds,
  Qwen drafting with consent; review/sign-off/submit live.

## The well-oiled machine (2026-11-04)

Four factories, one spine — every stage frozen, hashed, gated, re-runnable:

| Stage | Machine | Frozen artifact | Gate |
|---|---|---|---|
| Chunk | translation-work | `passages.jsonl` locators (`tsa01-p01`), T1→L4 layers, `GATE.json`, `STATUS.json` | deterministic gates, proofs, receipts |
| Argue | tantrasara repo | `essay0.json` (Q + plain + verbatim span), `rung_picks.json` (span budgets), `approved_chNN.json` (SHAs) | owner approvals; render REFUSES without them |
| Story | parables (`PARABLEVIDEO.MD`) | literal → parable (no doctrine terms in the tale) → tagged voice → one image → short; registry + seeds | register audit, voice validation, SANSKRIT FIRST |
| Ship | aoc slideshow factory | hook → slides JSON contract → PNGs → ZIP → receipt; content IDs hashed | fail-closed gates before render |

The new tantrasara pushes (2026-11-04: essay-0/rungs canon, 22 chapters
green, Anupāya gold, shard-ready factory) plug straight in: all 22
`tantrasara-aNN` works carry `passages.jsonl` chunk ledgers, and pack
`--evidence tantrasara-a01:tsa01-p01` refs resolve against those exact
locators — validated live, fail-closed. Scholar packs cite chunks;
personal packs cite `tension:<id>`. Same lifecycle, same laws, both
machine-checked by `resolve.py check`.

## Form taxonomy (one tension, many shapes)

- **read** — the essay aloud, verbatim. Contract: no paraphrase.
- **comic** — two-voice readout of the same words. Contract: ≤3 direction
  tags per beat (borrowed from the house drama-tag rule).
- **parable** — the turn as a tale. Contract: no doctrine terms in the
  tale, hinge names the turned claim, limit states where the analogy
  breaks (human fills; `check` warns until filled).
- **diagram** — the argument as nodes/edges. Contract: every node traces
  to an essay beat or evidence chunk; edges name the relation.

Taste (casting, art, which form fits) stays human — same law as the
tantrasara machine: gates guard the floor, never encode taste.

## Assessment: /patalacheckpoints

It is the atlas/workstation vision (living bibliography + text-reader +
translation-workshop + media hub), and its endgame docs frame navigability,
not tension resolution. Valuable as source landscape and reference — not
the tension operator. The "completely clarify everything" goal (every
concept, mechanism, ritual) is a research programme, correctly parked:
the attainable endgame is one tension resolved at a time, each with its
essay and its video.

## Next wiring (not this slice)

- Scholar essay drafts: optional tension link (Pushing Lab crux id or
  `work:target`) carried in content metadata through review → sign-off →
  published entry. Needs a worker change; spec before code.
- Video render: packs are renderer-agnostic by design; wire whichever
  renderer the owner picks (aoc slideshow factory is the candidate —
  evaluate, don't assume).
- Chat: log unresolved chat turns as tension-shaped records so they can
  enter either loop. Same lifecycle, same laws.
