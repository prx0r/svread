# Satsang: text → practice runtime (spec v1, 2026-10-21)

> **Status (2026-10-25):** **shipped in engine/** (6 pipeline-built practices, 3 routines; preview https://engine.tantrafiles.xyz/sit/). Not yet on the main site (awaits owner, SIT-PLAYER §6).

A source text (a meditation-manual chapter) becomes a runnable, rendered practice: a guided session in the engine player, narration audio, sound cues and a preview video, where every word, number and picture traces back to a span of the source or to a named rule. Extends PRACTICE-ENGINE.md §5 ("mining a book") and feeds PRACTICE-MEDIA and PRACTICE-ASK. Worked example: Ajaan Lee, *Keeping the Breath in Mind*, Method 1 (`engine/pipeline/ajahn-lee-method-1/`, demo `?p=ajahn-lee-method-1`).

## 1. Principles
1. **One source of truth per layer, one clock.** Each layer is a file with a JSON Schema in `engine/schema/`; the compiled timeline (`compile.mjs`) is the clock the player, the mix and the video all read. Nothing is hand-timed downstream of it.
2. **Every derived field traces to a span.** Spans are `{passage, quote, start, end}`; the quote is re-checked against the hashed source by offset in tests. A value the text doesn't state is `inferred` and must name a rule in `tools/extract/defaults.json` (with its reason and confidence) or cite another span.
3. **The model is fenced.** Only two steps need judgement (extraction, narration wording). The model never writes offsets, timings or uncited numbers; its output is resolved and validated by deterministic code, and rejected on any error (one repair round, then stop).
4. **Never narrate the conditional or the promised.** Signs, lights, visions and powers are not scripted; they become Ask answers with the source's own handling. Outcomes are the teacher's description, never a target.
5. **Safety is structural.** Holds are capped by the compiler/player (30 s; beginner strips > 10 s); a practice's beginner form can drop whole stages; cautions from elsewhere in the same work are allowed for safety with a flag.
6. **Backward compatible.** Existing practices compile unchanged (56 → 65 compiler checks still pass); all additions are optional fields.

## 2. Layers (why each exists)
| # | Layer | File (schema) | Why it exists | Made by |
|---|---|---|---|---|
| 1 | **SourceText** | `sources/<id>/source-text.json` (`source-text.json`) + `<segment>.txt` | Pins the edition, translator, licence *evidence* (URL + verbatim sentence) and segment hashes, so every quote is checkable and we know whether we may store words at all. | `tools/extract/fetch.mjs` (deterministic HTML→text, sha256) |
| 2 | **Passages** | `pipeline/<p>/passages.json` (`passages.json`) | Stable sentence ids + offsets: the unit everything cites. A rule-based `kind_guess` drives the coverage check. | `segment.mjs` (deterministic) |
| 3 | **ExtractedInstructions** | `instructions.json` (`instruction.json`) | Atomic instructions (action, locus, attention, breath phase, words, count, duration, conditions, warnings, intent, scripted?) each with spans and per-field provenance; plus **coverage** = what every passage became. | LLM or agent draft (`PROMPT.md §A`) → `extract.mjs` resolve + validate |
| 4 | **Practice** | `practices/<p>.json` (`practice-v2.json`, v2.1 additive) + `head.json` | The runnable unit the engine already understands, now with `stages`, block ids, `provenance.blocks` (instr ids + rule per number), `provenance.fields`, `derivation` (files, hashes, extractor mode), `safety.beginner_override.skip_stages`, `safety.alternatives`, `ask`. | `build-practice.mjs` (deterministic templates per action) |
| 5 | **Script** (narration) | `narration.json` (`narration-script.json`) | Words separate from timing: plain-English lines, optional original-quote lines, `say` for pronunciation, basis per line. Lets wording/translation change without touching the practice, and lets the lint prove the voice says nothing unsupported. | LLM or agent (`PROMPT.md §B`) → merged into block captions by the builder |
| 6 | **Timeline** | `timeline.json` (existing `timeline.json`, v0.2 additive) | The clock: breath/voice/visual/attention/audio/haptic tracks + markers (rounds, **stages**). | `compile.mjs` (existing) |
| 7 | **Render** | `renders/<p>/{voice,cues,mix,preview}` (`render.json`) | Measured artefacts: TTS clips (hash-cached, silence-trimmed, word timestamps, intelligibility score), the cue kit, mixes with measured LUFS/true peak, the preview video. | `tools/media/{tts.mjs, align.py, cues.py, mix.py, preview.mjs}` |
| + | **Inference rules** | `tools/extract/defaults.json` (`inference-rules.json`) | The only place an unstated value can come from: what it sets, the value, basis (engine default, convention, analogy, cited, policy…), confidence. Practices store rule ids, not copies. | hand-edited, reviewed |
| + | **Ask preloads** | `ask.json` (`ask-preload.json`) | PRACTICE-ASK QAs per practice, phase ids = stage ids, sources = instruction spans, `status: candidate` until a human reviews. | agent/LLM, validated against instructions |

### Field provenance (`prov`)
`{basis: quoted|paraphrased|inferred, rule?, cite?, note?}`. Absent ⇒ the value must be supported by the quote, and the validator checks it: numbers via `numbersIn` (digits + number words), body places via grammar label/alias words, breath pairing via the word "breath", meditation words by substring. Paraphrase needs a note ("the nostrils → `nose_tip`"). Inferred needs a rule or a cited span.

### Practice additions (v2.1, all optional)
- `stages[] {id,label,optional}`: also the PRACTICE-ASK phase ids; compile emits `markers {kind:'stage'}`.
- Block fields: `id`, `stage`, `instr[]`, `quote {text,cite}` (shown under the caption, never spoken), `voice_first` / `sound_first` (inside a repeat, only on the first iteration), repeat `unit` ("breath", "round trip": the orb's sub-label).
- `safety.beginner_override.skip_stages[]`, `safety.alternatives[]`; `compile(…, {skip_stages})` for optional stages.
- `provenance`, `derivation`, `ask`; `meta.status` uses the existing enum (`review` until a human signs off; maps to deitybody's verify).
- Engine/player changes: compiler v0.2 (stages, skip, voice block/quote, sound_first, unit), player shows quote lines, `window.SatsangCues` hook for a rendered cue kit, `advance(t)` for offline rendering, `options.skip_stages`. Grammar 1.1: loci `middle_of_forehead` (label "forehead"), `top_of_head`; an `audio` map (PRACTICE-MEDIA sound vocabulary).

## 3. Pipeline
```
fetch.mjs ─► segment.mjs ─► [LLM §A | agent draft] ─► extract.mjs (resolve offsets, validate, coverage)
          ─► head.json + narration.json [LLM §B | agent] ─► build-practice.mjs (templates, narration merge, provenance, slot check)
          ─► tts.mjs (Fish, cached) ─► align.py (whisper words, match) ─► build-practice.mjs --voice (measured fit)
          ─► compile.mjs ─► cues.py ─► mix.py (-14 LUFS) ─► preview.mjs (player rendered offline + mix) ─► deploy-preview.mjs
```
Commands for the example are in `engine/pipeline/ajahn-lee-method-1/REPORT.md`. Tests: `node tools/test-text-to-practice.mjs` (43 checks) + `node tools/test-compile.mjs` (65) + `python3 tools/validate-schemas.py`.

### Builder templates (deterministic)
Carriers make blocks; modifiers ride on them. `posture/recollect/recite` → a natural block sized to its narration (`fit-narration`); `breath_word` with words + count → `repeat N [in label=word, out label=word]` (≤ 3 unrolled so each breath can carry a line); the stage whose count is `stillness-rounds` becomes the engine's `round` (user-adjustable); `move_attention` (back_and_forth, N) → `repeat N [in: attention → far spot, out: back]` (`traverse-with-breath`) plus an `end` breath; `settle` → one breath at the spot (`moment-one-breath`); `spread` → field/path visuals. Modifiers before the first carrier of a stage join its first block; after a carrier, each gets one guidance breath (`guidance-breaths`). A lead-in bowl and a chime per stage come from `lead-in` / `stage-chime`.

### Timing slots
A narration line's slot runs from its block's start to the next spoken line. Build fails if measured speech + 0.6 s (`narration-margin`) exceeds the slot in the normal or beginner form. Fix by splitting the line across in/out blocks ("…"), shortening it, or giving it a `say`. Lines are never time-stretched.

## 4. Validation (summary; full table in `tools/extract/PROMPT.md`)
Instructions: verbatim unique quotes; offsets reproduce; supported-or-provenanced fields; rules exist; unscripted ⇒ reason; confidence < 0.8 ⇒ review queue; coverage has no `uncovered` actionable passage. Narration: numbers ⊆ quoted counts (inferred numbers only on `inferred` lines); place words ⊆ the line's loci; no unscripted instruction narrated; quote lines verbatim ≤ 25 words; captions ≤ 140 chars. Build: every block has instructions or a rule; slots fit. Media: every spoken line has a clip; whisper match ≥ 0.9 mean; mix −14 ± 0.5 LUFS, TP ≤ −1 dBTP. Tests also prove the validators bite (tampered count, shifted offset, non-verbatim quote, unsupported narration number, narrating the light sign all fail).

## 5. Safety layer
- Compiler/player caps unchanged (max hold 30 s, beginner strips holds > 10 s, start card shows contraindications, Stop always one key).
- `beginner_override.skip_stages`: whole stages dropped for beginners (Method 1: the head bases, per Ajaan Lee's Method 2 caution "don't focus on any spot above the base of the throat" for frequent headaches: `caution-cross-method`).
- `safety.alternatives`: "most people find Method 2 easier" → offered on strain.
- Conditional experiences (signs/lights) are never scripted (`no-nimitta-scripting`); their handling is preloaded in Ask with the source's words.
- The LLM can never raise intensity: no template produces a hold, and counts come only from quotes or rules.

## 6. Hooks for PRACTICE-ASK
`practice.ask.phases` = stage ids (and timeline stage markers, so the player knows the phase at any t); `practice.ask.preload[]` = QAs with `phase`, `intent`, `safety`, `answer_spoken` (≤ 60 words), `action` (`continue | switch_params | offer …`), `instr` and resolved `sources` (passage ids). The deterministic triage stays in front; these are the cache entries for the likely questions (signs, pictures, headache → beginner form, strain → Method 2, mind following the breath, why the bases, is it working).

## 7. Licence handling
`source-text.licence` records the evidence URL and the verbatim sentence; tests check it appears on the stored copyright page. `store_verbatim: true` only when the licence allows redistribution (CC BY-NC here); otherwise keep offsets + hashes and fetch at build time. Derived practices inherit the licence (`meta.license`); for NC sources renders must not be sold, paywalled or monetised (the book counts *any* sale as commercial) — relevant to any YouTube plan. The app's licence registry (`app/wisegraph/licence-registry.json`) should get a book entry for this text (not edited here: outside engine/specs).

## 8. Render notes
- Voice: Fish `s2.1-pro-free`, library voice `8d797adca9af48ca9e8a1c7284db1d6c` ("meditation": generic, not named after or cloned from anyone), speed 0.85, ≈ 105 wpm. Pending the user's choice (PRACTICE-MEDIA §5). Browser speechSynthesis is the fallback for any caption without a clip.
- Cues: bowl strikes are modal synthesis (generated, no samples), chime and tick from the earshot bank, all `earshot sfx check` clean; levels ≈ −18 dB (bowls) and −20 dB (chime) re voice loudness; ducked 6 dB under speech.
- The demo plays clips matched by caption text (`renders/<p>/voice/manifest.json`) and the cue kit (`cues.json`); voice is on by default when a rendered narration exists.
- Preview video: the live player rendered offline (`advance(t)` frame by frame, 24 fps) — the HyperFrames idea (seek(t) renderer, no separate art) without the HyperFrames toolchain, which isn't installed for this project.
