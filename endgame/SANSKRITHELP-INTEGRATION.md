# SANSKRITHELP — the STUDY surface + body-data truth source + translation frontier

Spec, 2026-11-05 (owner: "add sanskrithelp to our endgame"). Local repo
`/root/sanskrithelp` (752MB — overviews copied here, not the repo). Live:
https://sanskrit.help. Overviews imported: `README.md`, `HANDOVER.md`,
`INDEX.md`, `TRANSLATION_FRONTIER.md`.

## What it is

The **daytime Sanskrit frontend**: Pāṇini machine UI, grammar curriculum
(`/learn`: sandhi, roots, verbs, tutor), drills + games (`/drill`, `/games`),
readings with audio (6 corpora incl. Śiva Sūtra 117 files + **VBT**), tantra
practice (cakra grid, breath, tattvas, provenance-labeled chat), the memory hub
(nyāsa, wheels, speak-and-score), and phoneme clips (47/50 human recordings).
Law: 111+ tests + tsc clean; **human recordings only in install paths; verse vs
apparatus never mixed in one sitting.**

## Why it matters to the endgame (three load-bearing assets)

1. **The body-map truth source.** `public/memory/data/matrika_body_map.json`
   v2 = **verse-literal TĀ 15.117–120, 50 loci** — the visualization/body grammar
   comes from Tantrāloka itself, already canonical and tested here. This is the
   layer `SYLLABUS-COMPILER.md` needs for "each practice maps the system onto
   the body" (northstar) — and it's what deitybody's map derives from.
2. **Study-side syllabus inputs (already imported to the VBT pilot).**
   `vbt-daily.json` (65/112 dhāraṇās mapped: technique · trains · āhṇika coord ·
   upāya) + `syllabus.json` (matrka-course-v1: vaikhari → madhyama → pasyanti).
   Plus `awesomecurriculum.md` (nightly course: checkpoints 0–10, Audios 00–19)
   — curriculum formats exist in both directions (study + practice).
3. **Translation frontier (feeds the master sequence's translation track).**
   `docs/TRANSLATION_FRONTIER.md` (ACTIVE): five Mālinī/Mātṛkā phonemic-body
   targets (Śrīmatottaratantra 7, Kularatnoddyota 5.84–101, Tantrasadbhāva 2,
   Kubjikāmatatantra 17.94–109, Ṣaṭsāhasrasaṃhitā 7.5–38) + two controls, with
   manuscript records (NAK 2/214 etc.) — a ready-made queue for "get all
   translations sanskritbenched."

## Role in the seven-surface machine

| System | Role |
|---|---|
| sanskritbench · openpatala · translation-work+scholar · estate | VERIFY · IDENTITY · EVIDENCE+AUTHORITY · RAW MATERIAL (see §2 of README) |
| nibbanahelp | PERSONAL + ORGANISM |
| satsang · tantrasara · deitybody | SURFACES — TV · video gen · practice |
| **sanskrithelp** | **STUDY + BODY-DATA + TRANSLATION FRONTIER** — grammar/drills/readings surface; mātrikā locus truth (TĀ 15.117–120); VBT + syllabus study inputs; the phonemic-body translation queue |

## What needs doing (SH1–SH3)

- **SH1**: point the syllabus compiler's body layer at
  `matrika_body_map.json` v2 as the truth source (deitybody map = derivative;
  one source, provenance noted).
- **SH2**: phoneme clips (47/50, missing ḷ ḹ kṣa) → practice-audio gap list for
  the C1 VBT pilot only if the pilot needs them (don't block on it).
- **SH3**: TRANSLATION_FRONTIER targets → queue in the translation track of the
  master sequence (step 3), coordinated with translation-work's lane owner.

## Guardrails

- Their laws are theirs: human phonemes only, verse/apparatus separation,
  don't commit other sessions' files (their AGENTS.md).
- Local repo is read-copied here; no writes to /root/sanskrithelp from this lane.
