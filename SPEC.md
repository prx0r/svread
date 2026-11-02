# SVREAD SPEC — reader UX as agreed (2026-11-02)

## Lanes (parallel versions, grouped picker)

| Lane | Source | Rule |
|------|--------|------|
| Final | L3 | **The one translation to look at.** Line-by-line, evocative, grounded (l0_ids + essence_maps). Default right column wherever it exists. |
| Literal | L0 word-gloss (fallback: L1 close) | Gloss only, never prose. |
| Plain | L2 | **The translation.** Plain exact English; translation, never commentary. |
| Commentary | C1 SUMMARY + rasa | About the verse, openly labeled. Never a translation. |
| Sanskrit | sa-deva / sa-iast | Root text, always present, always first. |
| Yours | localStorage `mine` | Pasted by the reader, this device only. |

Old `?left=l1&right=c1` links keep resolving (lane ids unchanged). `?right=final|commentary|literal|plain` aliases accepted.

## Rails

- **Left rail (library side, unchanged):** work id, verse count, library, passage jump, text search, attributions, proof queue, export, issue link.
- **Right rail (reading side):** Display Settings, Recitation, Text Mode, **Ask the text (chat)** — in that order, chat last (= bottom right).
- **Sacked (deliberately):** Highlight box (duplicated Text Search), Morphology widget (showed "no analysis" — its job moves into chat + Literal lane), Dictionaries widget (its Key-Terms source died with the old C1 format; L0 lookup moves into chat).
- Tap-a-Sanskrit-word no longer opens a morphology table: it prefills the chat with `what does "X" mean in §N?` (one tap to ask, Enter to answer). Instant L0 gloss lives in the Literal lane, not in a widget.

## Chat v1 (this spec): retrieval-only, no inference

Small text, sharp precise answers, **retrieved from the work's own files only** — the chat never invents. Closed world (mirrors translation-work `CHAT.md`):

- Answerable: L0 gloss for a word ("what does X mean [in §N]?"), verse translation ("translate §N", "what does §N say?" → L3, fallback L2), verse commentary ("why this reading?", "what is X?" → C1 SUMMARY + argmap inference), trust ("is this reviewed?" → proof gate/needs), navigation ("go to §N", "§N").
- Citations mandatory: every claim ends with a `§N` jump link.
- Gates enforced: BLOCKED verses have no English — the chat says so and shows Sanskrit only. Same fail-closed as the columns.
- Unknown questions get an honest boundary ("I only answer from this work's files — try …"), never a guess.

## Chat v2 (later, needs worker): LLM with the closed-world contract

Per translation-work `CHAT.md` + `DATATYPES.json` worker contracts (chat-answer, style-render): retrieval over `corpus.jsonl` (PASS/PUBLISHED/OWNER only), `variants/*.json` (fork status always stated, never one-sided), proofs + signoffs for trust questions. Missing pieces before v2 is honest: embeddings over the corpus, the enforced retrieval filter in worker code, per-clause L2→L0 derivation. Pushing sessions (GEM Q&A per work) seed few-shot examples.

## Data map (what feeds what)

| Data | Feeds |
|------|-------|
| `data/<work>.json` (layers: sa/l1/l2/l3/c1/argmap/gate) | columns, chat answers, export |
| `data/l0/<work>.json` | Literal lane, chat word answers |
| `data/morph/<work>.json`, `data/proof/<work>.json` | proof queue, trust answers (morphology UI removed) |
| `site/data/c1/<work>/*.NOTE.md` (ipvv, not vendored) | future "scholar notes" expander; chat trust layer |
| `site/data/argmaps/<work>/*.md` (ipvv, not vendored) | future per-verse "why" expander; chat reasoning traces |
| pushing sessions (ipvv `site/data/pushing/`) | future "hardest questions" + chat few-shots |
| C2 renders (`/api/c2/render`) | future Poetic lane, once verse renders earn it |

## Open (not decided here)

Poetic lane stays parked until verse-level renders exist. Song-level C1 essays (Śivastotrāvalī) need a song view. Ghaṭakarpara per-verse T1 re-chunk belongs to the crystal pipeline. Bhairavastava v10 root adjudication (`bhavati` vs `bhavamaru`) needs a Sanskritist.
