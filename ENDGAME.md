<!-- status: historical vision — superseded by MASTERPLAN3.md -->

> **Status (2026-11-11):** historical vision — superseded by MASTERPLAN3.md.

# ENDGAME — the shape, the varieties, what's genuinely worth using

Status: strategic spec, 2026-11-05. Companion to `SCHOLAR-ENDGAME-SPEC.md`
(the operational contract) and `RESOURCES.md` (the inventory). This is the
short answer: what the summit looks like, the forms it takes, and an
honest use/skip list. Nothing here is built unless it says so.

---

## The summit, in one paragraph

A scholar asks a hard question about a Trika text. The system retrieves
the exact passages (hash-pinned), the agent drafts in the scholar's
recorded voice with every claim traceable, a second pass tries to break
it, the audit refuses anything unverifiable, the human signs, and the
answer becomes a signed essay with a DOI — or a video, or a spoken
conversation, or a node on the tree of all Trika. Commodity generation;
scarce provenance. That is the whole endgame.

## The varieties (seven output forms)

| # | Variety | What it is | Built? |
|---|---|---|---|
| 1 | **Signed essay** | question → evidence → draft (voice) → WEAVE verbatim check → PUSHBACK destroy pass → audit receipt → human sign → bridge → release → Zenodo DOI | 90% — audit/signoff/bridge/release/zenodo-dry-run live; PUSHBACK pass + token pending |
| 2 | **Crux note** | one tension, resolved or honestly limited, 800–1,500 words, chunks pinned. The atomic unit | live (`resolve.py`, packs, `_links.json`) |
| 3 | **Explainer video** | essay → pack (`read\|comic\|parable\|diagram`) → slang register → tantrasara factory | packs live; **slang editions just landed**; factory remote |
| 4 | **Conversation** | voice/chat in the tradition's plain register; agent sees your draft, researches while you talk | text live, voice wire-proven, essay-context tested; browser session unobserved |
| 5 | **Treeka view** | works→passages→arguments→concepts→cruxes→essays + gap report (what's unargued, cruxless, essayless) | substrate live (lingua, anchors, argmaps); assembler = one tool |
| 6 | **Proactive memo** | save a version → objections, related passages, crossover leads, suggested works waiting next session | live (pm2 */30, local output) |
| 7 | **Thesis pair** | thesis + its strongest disproof, from the comparative pushing matrix | spec'd (truth-packet), not built |

## Genuinely amazing — use these

1. **The signature chain.** Audit receipt (content hash + verifier) →
   signoff (account + snapshot + rights) → git identity → Zenodo bundle
   with provenance. Nobody else in this space ties the electronic product
   to the owner this tightly. This is the moat; everything else is
   replaceable.
2. **Your kits as law.** STRUCTURE (owner verbatim never paraphrased),
   WEAVE (quote bank, never laundered), PUSHBACK (agent vs agent,
   honest remainder). Your own proven method, machine-enforced —
   `audit_draft` already runs the WEAVE half.
3. **Slang + voice.** The Tantrasāra slang editions plus Qwen realtime
   = explaining Trika conversationally in the tradition's own plain
   register. Nobody has this. It's the difference between a library and
   a teacher.
4. **Tensions → essays → videos.** One question, one essay, one video,
   all hash-linked end to end. The beauty pipeline, already half-wired.
5. **OpenPāṭala** (`prx0r/openpatala`, pulled 2026-11-05): the source
   ladder is not missing — it is built and verified. Witness → Surrogate →
   Transcription → Collation → VariantGraph → adjudication; 23 entity
   models (Work/Edition/Witness/Surrogate/EText/LogicalPassage/TextSpan/
   AuthorityEvidence/SourceLineage), R0–R5 resolver, Merkle event ledger,
   1,099 works, 11 adapters, 6 proofs + 26 gates PASS, red-team 4/4. It
   already knows tantrasara, paramarthasara, tantraloka. It is the
   permanent-memory column; our Scholar stack is the active-intelligence
   column. Treeka's root lives here.

## Skip (over-engineering, or later)

- Organism (5 docs, one idea), education surfaces, multi-surface
  platform (V12/13) — strategy for a crowd we don't have yet.
- Atlas-as-product (the V15 Neon/Postgres/OpenAlex-scale surface) —
  openpatala already IS the identity substrate; do not build a second
  one. Use its API/IDs, skip its product layer for now.
- Market entry / paid adjudication (V08/V10) — real, but for when
  external scholars exist. The warning stands: never free cleanup.
- Lean proof engine / formalisation — a research program, not the
  endgame.
- Tier-4 web search — useful for lit-review later; the internal index
  answers most questions today.

## Build order (three moves, nothing more)

1. **Bridge chunk ledgers ↔ openpatala identities** — one mapping file
   (our 86 `chunk:work:target` → its Work/Witness IDs) + a small adapter;
   then Treeka's root is witness-grade and every passage cites its
   edition. No schema change, no second database.
2. **PUSHBACK pass + Zenodo token** — the last two gates on Variety 1.
3. **Slang into chat** + `treeka.py` view — Varieties 4 and 5 close.

Everything else is already running or deliberately parked. The endgame
is not more systems; it is these seven varieties, each one question deep,
each one signature strong.
