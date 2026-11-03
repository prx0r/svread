# SVREAD SPEC — reader UX as agreed (2026-11-02)

## Lanes (parallel versions, grouped picker)

| Lane | Source | Rule |
|------|--------|------|
| Svatantrya | L4 | **THE canonical translation** (owner directive 2026-11-03). The song layer: L3 set to the rhythm of the verse. Default right column wherever it exists; `?right=svatantrya`/`canonical` alias here. |
| Final | L3 | Line-by-line, evocative, grounded (l0_ids + essence_maps). Default where no L4 is on file. |
| Literal | L0 word-gloss (fallback: L1 close) | Gloss only, never prose. |
| English translation | L2 | **The translation.** Plain exact English; translation, never commentary. (Renamed from 'Plain' — owner directive: call it English translation.) |
| Commentary | C1 SUMMARY + rasa | About the verse, openly labeled. Never a translation. |
| Sanskrit | sa-deva / sa-iast | Root text, always present, always first. |
| Yours | localStorage `mine` | Pasted by the reader, this device only. |

Old `?left=l1&right=c1` links keep resolving (lane ids unchanged). `?right=final|commentary|literal|plain` aliases accepted.

## Rails

- **Left rail (library side, unchanged):** work id, verse count, library, passage jump, text search, attributions, proof queue, export, issue link.
- **Right rail (reading side):** Display Settings, Recitation, Text Mode, **Ask the text (chat)** — in that order, chat last (= bottom right). The AI speaks first: a per-work wonder-question (`data/openers.json`) with an ask-→ link.
- **Left rail (library side, unchanged except +1):** work id, verse count, library, passage jump, text search, attributions, proof queue, **Hard Questions (pushing hounds, where filed)** — tap one to jump to its verse and ask it in chat — then export, issue link.
- **Sacked (deliberately):** Highlight box (duplicated Text Search), Morphology widget (showed "no analysis" — its job moves into chat + Literal lane), Dictionaries widget (its Key-Terms source died with the old C1 format; L0 lookup moves into chat).
- Tap-a-Sanskrit-word no longer opens a morphology table: it prefills the chat with `what does "X" mean in §N?` (one tap to ask, Enter to answer). Instant L0 gloss lives in the Literal lane, not in a widget.

## Chat: Qwen Omni via worker, local retrieval fallback

Small text, sharp precise answers. Two tiers:

- **Qwen Omni (primary):** `POST /api/chat/:work` on the ipvv worker — `qwen3.8-omni-flash` via DashScope. Pipeline: bge-m3 query embedding → gated cosine retrieval (PASS/PUBLISHED/OWNER only) → lexical fallback (transliteration-tolerant, work-name aware) → direct chunk-id injection → rerank top-5 → argmap graph walk + work-matched pushing probes → recorded-verdict injection from pushing INDEX → closed-world prompt (no source-talk, reader-aware, concise) → answer + follow-up suggestion. Session persisted per work (`svv-chat-<work>`); every Q&A logged with retrieved ids. The worker quotes L3 (final translation) where present.
- **Local retrieval (fallback):** instant answers from the work's own vendored files when the worker is unreachable or offline — L0 gloss ("what does X mean [in §N]?"), verse translation ("translate §N" → L3, fallback L2), verse commentary ("why §N" → C1 SUMMARY), trust ("is §N reviewed?" → proof gate/needs), navigation ("§N").
Answer policy is two-tier, not closed-world-only: (1) passages first, with citations — the default and the authority; (2) where passages are silent, stable background knowledge (authorship, dates, figures, plain glosses, general Trika context) may be given, explicitly marked "From general knowledge, not these verses" and closed with "Verify it against the texts"; (3) BLOCKED-verse English is never freelanced — translations the pipeline hasn't passed stay withheld even though the model could produce them. Never present general knowledge as coming from the passages; never contradict them.

## Chat v2 (shipped — was "later" above)

The worker endpoint, the retrieval filter, and the closed-world prompt are live. Remaining from the original gap list: per-clause L2→L0 derivation, signoffs, C2 poetic renders. Pushing sessions seed context via template match + work-matched probes + recorded verdicts.

## Data map (what feeds what)

| Data | Feeds |
|------|-------|
| `data/<work>.json` (layers: sa/l1/l2/l3/c1/argmap/gate) | columns, chat answers, export |
| `data/l0/<work>.json` | Literal lane, chat word answers |
| `data/morph/<work>.json`, `data/proof/<work>.json` | proof queue, trust answers (morphology UI removed) |
| `data/probes/<work>.json` (question, verse refs, verdict, transcript link) | Hard Questions rail: tap a hound → jump to verse + prefill chat |
| `site/data/c1/<work>/*.NOTE.md` (ipvv, not vendored) | future "scholar notes" expander; chat trust layer |
| `site/data/argmaps/<work>/*.md` (ipvv, not vendored) | future per-verse "why" expander; chat reasoning traces |
| pushing sessions (ipvv `site/data/pushing/`, indexed in `INDEX.json`: 56 files, 111 questions) | Hard Questions probes; chat template matches; R2 audio + karaoke per work |
| `svread-audio` R2 bucket (1430 objects: audio/karaoke/align) | studio chant playback + karaoke highlighting (falls back to browser TTS/voice) |
| corpus includes: translations (L1/L2/L3), site C1 + scholar NOTEs (incl. 20 Sivastotravali song essays), pushing sessions, essays, argmaps | RAG retrieval; re-embed on changed English/gates |
| excluded from site (deliberate) | tantraessays video-script packs (production assets, not reading text); volume `source-library` binaries (index-only); unchanted works have no karaoke (ghatakarpara, spandasandoha — needs recording, not wiring) |
| C2 renders (`/api/c2/render`) | future Poetic lane, once verse renders earn it |

## Scholar hub (shipped 2026-11-03 — `?work=X&view=scholar`)

The **Scholar** nav tab. Same functions (`$`/`esc`/`get`/`W`/`dl`/`norm`) and same classes
(`.col`/`.verbar`/`.version-select`/`.text`/`.varbox textarea`+`.savebtn`/`.widget`/`.wtable`/
`.vref-list`/`.c2row`/`.c2btn`/`.urn`/`.milestone`/`.cmp-note`) as the reader — no parallel design.

- **Layers:** t1 · l0 · argmap · l2 · c1 · l3 · l4 — originals are the canonical pipeline bytes
  (emitted by `translation-work/tools/emit_scholar.py`), never edited by the hub.
- **Versions fork:** pick any base (Original, any published `sv:…`, or any of your `local:◇`
  drafts) → edit → **Save as my version** = a child of that base (fork-of-fork, any depth,
  device-local). **Export JSON** publishes through `tools/scholar.py save` into the
  append-only `scholar/` ledgers (git).
- **Sign-offs widget:** per-song `accepted_by · date · scope · stack_sha · review_id` from the
  same ledgers (ReviewEvent bound to an exact stack hash + Ed25519 signature; PromotionEvent
  is the only path to reviewed).
- Data: `data/scholar/<work>.json` + `index.json` (works with scholar data). Reader path is
  untouched: without `?view=scholar` main() runs exactly as before.
- **Rights (owner directive):** our English translation (L1–L4 + commentary) = **FREE**;
  scholar edits/versions/reviews/sign-offs = **(c) their authors** — carried in the emitted
  `rights` block and shown in the reader's Attributions.

## Right-column dropdown: Language + Style (2026-11-03)

Below the existing lane groups the right dropdown now has two sections:
**Language** — `English` (the only language on file; more later), which selects the
canonical English lane (l4→l3→l2). **Style** — `Normal` (no style, the standard English
translation) plus the C2 derivations from `data/styles.json` (gen z · eli5 · poetic ·
formal · mathematical). Picking a style queues it (`svv-c2pending`) and routes to the
Yours/mine lane — canonical columns never show machine renders — auto-rendering the
current verse via the existing `/api/c2/render` flow. **These styles ARE the C2 layer.**

## Side-by-side alignment (2026-11-03)

Every verse pair gets an equal row height (`alignVerses()`, grow-only, equality-guarded,
re-run via ResizeObserver) so Sanskrit and English read across at the same eye line —
no cumulative drift on long works (105/105 paramarthasara pairs verified).

## Audio widget (was: Recitation — renamed 2026-11-03, owner directive)

Right rail, same structure and buttons as before (`▶ recite all` / `■ stop` unchanged) plus:
**read sanskrit** · **read english** — renders the CURRENT verse via the worker
`POST /api/read` (fish `s2.1-pro-free`, $0 header-pinned) and plays it. Sanskrit voice =
`4e873c37…` (Andlig Sanskrit Röst, IAST→Devanagari client-side), English voice = `614f8afd…`
(Granny British) over the canonical L4 (fallback L3/L2; no English = withheld, never freelanced).
Stored verse-by-verse in R2 `svread-audio` at `read/<work>/<verse>_sa|en.mp3` — first tap
renders + stores, later taps hit the cache (`{cached:true}`).

## Chat + Audio + § (as shipped 2026-11-03, rev2)

- **Chat** (was "Ask the text"): docked BOTTOM-RIGHT — output fills the whole right
  rail (`#convo` flex), input pinned at its bottom. First message = **c1sum**: a
  standardized intro formula over C1 (first `**SUMMARY.**`, clamped to 300 chars at a
  sentence edge; falls back to `data/openers.json`, then the generic wonder-line).
- **Headbar (minimal)**: beside the title — `Αα Αα Αα Αα Αα` · width links · icon
  buttons `▶` recite-all · `■` stop · `स` read Sanskrit · `EN` read English — no
  headings, no explanations (title tooltips only). Same ids/bindings as before.
- **§ = play**: the section icon IS the play button (per-section ▶ removed). Language
  follows the column's lane (Sanskrit lanes → chant chain, English lanes → Granny
  chain, commentary → c1 text, other → classic single recite). Click again = pause
  (marker: red §). Auto-continues to the end; `■ stop` clears everything.
- **English readout SILENT for now**: `EN_READ_OFF = true` in app.js — English/c1
  playback shows "english readout is off for now" (flip to false to re-enable fish).
- **Service worker**: cache-first — `deploy.sh` bumps the SW version EVERY deploy
  (stale-shells bit us once: karaoke appeared "broken" from an old cached app.js).

## Chat rev3 (2026-11-03)

- **Intro = c1sum mini-essay** (~900 chars): compiled per work by
  `translation-work/tools/build_c1sum.py` → `data/c1sum.json` — opening argmap
  question + one C1 essence sentence per song, in order. Fallback: in-page
  `c1sumLine()` → openers.json. No "ask" link (the box is the ask).
- **Chat box**: tall textarea (not a bar) reaching near the page bottom; two
  circles stacked right of it — 🎙 voice input (SpeechRecognition; fills the box)
  above, ↑ send below. Enter sends (Shift+Enter = newline).
- **Grey placeholder = a probing query, new every 20s** — seeded from the work's
  pushing/hound queries (pushing INDEX) or, where the work has none, from its own
  argmap questions. Press send with an empty box to ask it; typing clears it until
  the box is empty again.
- Widget collapse (⌄) removed from Chat — the header is static.

## Canonical heading (2026-11-03)

Reader headings are **TITLE ONLY** for every text — the `verse 1–N (N passages)` and
`N/N gate-passed · English shows only where passed` lines are removed from the top
(empty h2/h3 are display:none); gate/trust facts live in the rail's Attributions.
The Scholar view keeps its own hub stats line (it is a different view).

## Chat rev4 + drag-resize (2026-11-03)

- **Chat box flush to the bottom**: rail widened (360px default), rail padding
  bottom 40→6px, textarea 8.5rem; voice/send circles now OVERLAY the box's
  bottom-right corner (textarea takes the full width); convo + rail scrollbars
  hidden (wheel/touch still scroll — they ate horizontal space).
- **Pushing placeholder seeds**: work-specific hound queries from the pushing
  INDEX first; otherwise the shared bank `data/pushbank.json` (12 sharp general
  enquiries reused across pushing texts, owner-approved). Argmap-question seed
  dropped (read as random out of context).
- **Drag-to-resize**: gutters are drag handles — #pgleft resizes the master
  list, #pgright resizes the chat rail. Dragging past 60px collapses the
  section; dragging back out restores it live; widths + collapse persist per
  device (localStorage) and the ←/→ tabs agree with the persisted state.
  Verse-nav arrows on the gutters still tap-work; swallowed after a real drag.

## Open (not decided here)

Poetic lane stays parked until verse-level renders exist. Song-level C1 essays (Śivastotrāvalī) need a song view. Ghaṭakarpara per-verse T1 re-chunk belongs to the crystal pipeline. Bhairavastava v10 root adjudication (`bhavati` vs `bhavamaru`) needs a Sanskritist.
