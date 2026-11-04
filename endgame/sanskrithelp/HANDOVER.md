# HANDOVER — sanskrithelp, session 2026-10-07 (HEAD `87f57ee`)

> LIVE on sanskrit.help (deploy green). 154/154 tests · tsc clean.
> Big session: Mātṛkā v2 freeze → Hindi engine → Jev/transmission → audio v2 → corpus batches.

## What landed (all live, verified 200s)
- **Canon**: matrika-body-map-v2 (sūtra-sinews), Tonight 50, Bruno 50 volvelle, TA15 table (50+50), Theory Shelf.
- **Audio v2**: RyanNeural cues + verse loci (espeak retired); 47/50 human clips mapped (ḷ ḹ kṣa missing); TRANSCRIPTS.md per file.
- **Hindi**: Osho Dataset Zero + Text Mode + scenarios with 3-stage audio scenes, speak-and-score (/api/assess), adaptive difficulty, daily loop, Glot spec, Snell vocab (1223 + audio), Bhatia/Snell skeletons (gated), pathway v1, 3 new machines (imperative/subjunctive/habitual-q), 1781 drills.
- **LLM backend**: free-model default (was 500ing) + honest errors; `/api/enquiry` (self-enquiry), `/api/hxrmxs` (transmission-first: 723 verbatim exemplars, retrieve-first).
- **Jev**: real Decisions API pinned 1.13 (router was wrong endpoint); trajectory position in state; prod needs dashboard secret (fallbacks live).
- **Corpus**: missing-corpus batches 1+2 pulled (731 eps normalized, 12 lineages, arcs to 63; synthetics flagged).
- **Course**: syllabus.json (26 units, validated) + Word-level axis; curriculum + audio-course scope docs.
- **Org**: dup clip dirs deleted, cakra audio fixed, README added, TA15_NYASA linked, tantra↔memory crosslinks.

## Open / pending (no-push rule: batch commits held locally unless asked)
- Working tree should hold ONLY the other session's simulator/coach files. If anything else is uncommitted, it is Hindi/HXRMXS follow-ups — ask before pushing.
- Other session's simulator/coach files STILL untouched (never stage).
- Ears needed: EdgeSanskrit drafts, vocab-audio voice assumption.
- Keys: OPENROUTER in local .env only (prod needs dashboard secret); Cloudflare token in chat history (rotate if one-job).
- Gated: chant v2 + diarization (HF clicks); Mālinī loci verify; Sprint-1; Osho 02–10.

## Prior sessions (2026-10-06 and earlier — see below)

> LIVE on sanskrit.help (deploy green, verified 200s). Threads: A doctrine ·
> B Hindi engine · C voice/conversation · D corpus · E music/geometry · F ops.
> Map: docs/visions/VISION-INDEX.md (canonical: docs/visions/awesomevision.md).

## State at this point
- HEAD `83be0e2` "Track 1: pure reference, your-turn prompts removed".
- Track 1 = Ryan locus cues + real grid clips (1.6MB, 136s), no synth voice,
  no your-turn prompts. 4 clipless gaps (ḷ ḹ ṅa ña) hold silence.
- Practice chart + Track 1 reachable: hub hero card, nyasa Night-1 button.
- 57/57 tests green · tsc clean · build prerenders · deploy tracks main.
- Git clean after this commit except: simulator/coach in-progress files
  (NOT committed, other session's work).
- Open threads: Stanza blocked (torch); corpus = spec only; live voice needs
  QWEN/GEMINI keys + relay + account activation; 4 grid clips unrecorded;
  GitHub Pages mirror live too.

## Prior sessions (2026-10-05)

## Repos & commits
- `sanskrithelp` (branch `main`, HEAD `62f17c6`):
  - `891383a` provenance pass, wheel import, grace/syllabus guides
  - `b385536`→`e189415` canonical v1 + regression tests (+ vitest.config include)
  - `11412c8` ESLint apostrophe fixes; `62f17c6` tsconfig test-excludes
- `bruno` (branch `master`, HEAD `81be025`): texts-status review + seal-inventory fix
- Left uncommitted (pre-existing, not ours): simulator/coach files,
  package.json/lock churn, bruno packs/downloads. Don't sweep in blindly.

## Doctrine (locked this session)
- **Verse-literal TĀ 15.117–120 is canonical**: arms shoulder/arm/hand/fingers/nails
  (`skandha-bāhu-kara-aṅguli-nakhe`), legs hip/thigh/knee/shank/toes (`kaṭyām
  ūrvādiṣu`), `sa` = śukra, `a` = forehead. Truth source:
  `public/memory/data/matrika_body_map.json` (id `matrika-body-map-v1`, 50 entries,
  per-entry `{text, sanskrit}` tags + `apparatus_variant`).
- Apparatus (Dyczkowski vol 8 App. A+C: elbow/wrist/fingers, buttock) recorded
  only. Never mixed in one sitting. Full record: `canonical/TA15_NYASA.md`.
- Pacing (2/night), study sets, DHVANI/articulation rings, colors: OURS, labeled.
- ARTICULATION ring ≠ his *karaṇa*. No Hz doctrine. TĀ-5 ladder unverified on disk.

## New files
- `public/memory/matrka-wheel/` — R2 `stallshark/matrka_bruno_wheel.zip` import
  (`index.html` untouched) + `integrated.html` (wheel→body marker→clip loop).
- `public/memory/canonical/GRACE-AND-THE-NEOPHYTE.md`, `MATRIKA-SYLLABUS.md`
  (latter: text-only, `[REC]`-tagged, §7 lists what texts don't say).
- `tests/matrika-canonical.test.ts` (checklist + wheel agreement + nyasa guards).
- `bruno/sanskrit/BRUNO-TEXTS-STATUS.md` (holdings vs gaps; seal ops = interpreted).

## Volume paths (mounted)
- TĀ translation: `/mnt/HC_Volume_106959365/root/projects/source-library/tantra/abhinavagupta/`
  (`ahnika-*.txt`, `tantraloka-complete.txt`, `tantraloka-vol*-dyczkowski.txt`)
- Sanskrit: same dir, `gretil_tantraloka.txt` (`AbhT_15.117-120`, `AbhT_1.168-170`, `AbhT_4.207-209`, `AbhT_13.129-132` verified).
- NOT on volume: MV Sanskrit, Jayaratha, Explicatio full text, Greer/Gosnell/Sturlese.

## Pending (ordered)
1. **Deploy**: swap `CLOUDFLARE_API_TOKEN` for Workers-scoped token → rerun →
   verify live nyasa (DEPLOY-SPEC.md). R2 S3 creds for bucket work are with owner.
2. Missing 24/50 phoneme clips (`ma`, labials, retroflex, semivowels…).
3. Build-time single-sourcing (views hardcoded-but-tested today).
4. Acquire MV 8 / Jayaratha / Explicatio to close verse-vs-apparatus + seal gaps.

## Secrets hygiene
Tokens were passed via env/stdin only, never written to repo (verified by grep
before each commit). `CLOUDFLARE_API_TOKEN` secret currently = under-scoped R2
token (set 2026-10-05T21:30Z) — replace, don't append.
