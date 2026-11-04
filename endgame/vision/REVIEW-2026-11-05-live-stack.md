# REVIEW — the vision docs vs the live stack (2026-11-05)

Additive review by the box agent after reading all 50 vision docs
(24k lines, written 2026-08-12→14). No existing file modified.

## Verdict

The vision layer is genuinely strong — unusually disciplined for a
personal project: one CORE BIBLE in 6 zoom levels, a machine-checkable
VISION-MANIFEST with anti-redundancy, a canonical REVIEWS.md with honest
status tags (BUILT/PARTIAL/ASPIRATIONAL), and a category taxonomy that
keeps 50 docs from becoming soup. The core sentence — *"one
historically-grounded scholarly tradition fully computable: an evidence
graph where every claim resolves to its source"* — is the same sentence
as the live Scholar stack, said earlier and at higher altitude.

The problem is not quality. It is **date and duplication**: these docs
were written when "CP7+ NOT STARTED" was true. Since August, the live
system (svread + ipvv worker + translation-work) shipped drafts, review,
signoff, bridge publishing, permissions, MCP, search index, and the audit
gate — none of which these docs know about. Several entries marked
ASPIRATIONAL are now quietly BUILT somewhere else. There are two visions
of one project; they need a reconciliation, not a rewrite.

## Category-by-category

| Category | Docs | Assessment |
|---|---|---|
| A. Foundations (CORE-BIBLE, endgame 01–05, NORTHSTAR) | 9 | The derivation graph (SOURCE→L0→L2→L200 AUDIT→C1→THEMES→ARGUMENT→SYNTHESIS→WORKBENCH→API→MEDIA) is literally our translation-work stack. L200 as "proof-carrying audit seam" = our GATE.json/proofs. Accurate, still true. |
| B. Scholars (06 review, 07 new scholar) | 3 | **The two best docs.** V06's "research compiler" (ERROR/WARNING/INFO diagnostics on a paper) is our `audit_draft` receipts, independently reinvented. V07's "essay is one output of the research graph, not the research object" is exactly the starters/tensions→essay loop we built. Adopt both framings verbatim. |
| C. Economics (08, 10) | 3 | V08's warning is the most important line in the whole set: *never become "the AI translation project scholars correct for free."* Our signoff/permission model already avoids this (owner signs, grants explicit, paid adjudication is the future external-scholar path). V10's BHU/funding map is real work for later — not blocking. |
| D. Media & Organism (09 + 5 organism docs) | 6 | V09's projection doctrine (core vs presentation, "content never changes, only the projection") = our pack/renderer split. Organism = 5 docs on one idea (consumer-as-probe → demand graph) — ASPIRATIONAL, interesting, not now. |
| E. Platform (12, 13) | 3 | Permission-scoped surfaces (consumer/scholar/contributor/developer/reviewer) = our grants model, already enforced. V13's product catalog is the sales doc we don't need yet. |
| F. Expansion (11 + prehistory + manifest) | 4 | Braided-history correction is right (no linear Rudra→Abhinava). The corpus acquisition manifest (legal tiers 0–3) is the correct checklist for growing Treeka's canon — use when expanding, not before. |
| G. Atlas/Identity (14, 15, source-resolver, 5 atlas docs) | 9 | **The missing foundation below our stack.** Source-resolver's ladder (Work→Edition→Witness→Surrogate→Transcription→E-text→Source, authority DISCOVERED→SCHOLAR_CONFIRMED, no auto-promotion) is the root our chunk ledgers lack: we pin passages to projections, but not to *which edition/witness* they came from. V15's "OpenAlex for Sanskrit" is Treeka's trunk with the transmission spine. |
| H. Education/Research-program (essayguide + education) | 6 | **essayguide is the spec for our essay copilot's missing stages**: six hard problems (thesis selection, EssayArgumentGraph, literature positioning, contribution detection, rhetorical compression, whole-document evaluation). We have stages 3–5 equivalents (evidence, weave, pushback); thesis selection + the argument graph are the two we lack. Education = projection of the graph, progressive epistemic zoom — future surface, not core. |

## Overlaps / redundancy (despite the manifest)

- Education sources/ = raw dialogue imports (kept deliberately, fine).
- Organism = 5 docs, one idea.
- Atlas = 6 docs, one subsystem — but each adds a real constraint
  (edge layer, performance laws, agent-optimization).
- Real duplication risk is **cross-repo**: Pāṭala vision describes
  Pāṭala (Next.js + Hermes + factory) while the live Scholar stack
  (svread/ipvv/translation-work) implements the same nouns (review,
  workbench, essay, media, permissions) with different code. Nothing is
  wrong; nothing is connected.

## What to adopt (ranked)

1. **Reconciliation doc** (the hermes-execution.md pattern, applied to
   the live stack): vision object → live object → status. This is the
   single highest-value doc missing from the set.
2. **Source-resolver ladder as Treeka's root** — our next foundational
   layer below the chunk ledgers (which edition does `tsa01-p01` come
   from? currently unanswerable at the witness level).
3. **essayguide's six problems** as the essay-copilot backlog (thesis
   selection + EssayArgumentGraph first).
4. **V06/V07 language** as canon for the Scholar docs (research
   compiler; essay-as-rendering).
5. **V08 warning** into the economics/permissions docs: paid
   adjudication path for external scholars, never free cleanup.
6. **V11 acquisition manifest** when Treeka grows past the current canon.

## What NOT to do

- Do not merge the two stacks now. Pāṭala vision remains the strategy
  layer; the live stack remains the proof layer. Reconcile with a map,
  not a migration.
- Do not build organism/education/media surfaces before the source
  ladder — every doc in this set agrees the graph is downstream of the
  sources, and the sources are the thinnest layer we have.
