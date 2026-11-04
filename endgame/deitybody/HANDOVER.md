# HANDOVER — deitybody (for the next agent)

## Live state
- **Site:** https://body.stonedoorway.com/lab (canonical: `/lab`, clean URLs; `/` redirects there)
- **Menu is Trika-only** (lab.js filters traditions.json to trika at render; other tracks parked, VBT kept as Trika course). PTv nights course (8 nights × 2 phonemes, powers from Jaideva Singh table, `site/data/ptv_nights.json`) is the nightly core.
- **Repo:** https://github.com/prx0r/deitybody (PUBLIC), branch `main`
- **Deploy:** `wrangler deploy` in `/root/deitybody` (worker `deitybody`, assets `./site`), CF account in `/root/.ochema-env` (`CLOUDFLARE_API_TOKEN` env). After deploy, **purge edge cache** for changed URLs or the user sees stale builds. User must hard-refresh (Cmd/Ctrl+Shift+R) or use private window.
- **Verify every deploy:** `python3 scripts/smoke.py --url https://body.stonedoorway.com/lab` (expects 50 glyphs after entering Trika, 0 boot errors). Local dev server: any static server on `site/` (clean URLs only work live; use `/lab.html` locally).

## What this is
Interactive subtle-body atlas + practice engine. Zero-build vanilla JS + vendored Three.js. One body mesh rig, many tradition overlays, declarative practice scores on one clock, machine-readable everything.

## Owner's non-negotiables (learned the hard way)
- **Bare canvas on load.** Nothing renders until chosen. Every layer must deep-hide (see gotcha #1).
- **Traditions own their practices.** Never mix tracks in one menu zone. Ajahn/breath is NOT Trika.
- **Provenance on everything.** SOURCE_ATTESTED vs PEDAGOGICAL. Never present reconstruction as text.
- **No Hz-per-phoneme, no medical claims.** Nāda is unstruck; sensors never certify experience.
- **Plain language + short replies.** No file:line dumps as answers; story first.
- Owner's spelling "matrika" (one a) is intentional in casual chat; canonical docs use Mātṛkā.

## Architecture (current)
- `site/lab.js` (~1300 lines, monolith — the known tech debt) + `site/lab.html`
- `site/engine/`: clock, session (expected/rendered/reported), graph (3 frames), agent tools, breath (unified signal), paths (arc-length registry), body (address space), sound (triple system), sensors (sim/BLE/Muse), mantra/player+drills, audio (chant-player, router, spectrum, phoneme analysis), cymatics, dynamics (RK4, fractals, nodal), mxth (chladni), mechanisms/registry, primitives (lotus, spokes, vitruvian, vitruvian-figure, avatar, grid-field, nadis), operators, primitive-registry, sound, sensors
- `site/frameworks/`: trika (+syllabus, practices incl aum/soham/om/namah), yoga (+syllabus, 4 scores), hermetic (+middle-pillar, vitruvian-man), layayoga (anahata verified + nadis-ten), vajrayana (kalachakra), vbt (25 dharanas + v24 score), theravada (ajahn-lee-1), vipassana, daoist (stub), _incoming (compiler output)
- `site/data/`: phonemes.json (typed records v1), mantras.json, traditions.json (menu graph), malini_order, matrika_body_map
- `site/audio/`: phonemes/ (48 human + 2 synth), library/ (49 engine takes + manifest), mantras/ (4 phrases), loci_v2/, tracks/
- `site/mantra.html`: chant-through + grades G0–G4 + recall quiz (weakest-first, localStorage)
- `scripts/`: smoke.py, audit.mjs (audio coverage), text_to_graph.py, compile_syllabus.py, render_library.py, build_library_manifest.py
- `corpus/`: extracts (BODY_GEOGRAPHY, GOSWAMI-ANAHATA, MUSICAL-SOUND, FLOOD...), primary (vitruvius, tantric_body, PTv)
- `docs/`: VISION-matrika-pathway (SOURCE), IMAGINAL-GYM (spec), WEARABLES, PATHWAY, ARCHITECTURE

## Gotchas (each cost a debugging session)
1. **CSS2DRenderer ignores parent visibility.** Every layer toggle MUST traverse-deep (`setVisibleDeep`). Any new CSS2D label added visible-by-default leaks onto bare canvas.
2. **Edit tooling duplicates blocks.** After every multi-edit, `node --check` + grep for duplicated function names before deploy.
3. **Cloudflare edge caches aggressively.** Purge zone cache for changed files post-deploy.
4. **Module eval order:** anything referenced at module top-level must be declared above use (TDZ kills silently-ish; boot banner catches it — keep `#booterr`).
5. **`window.deitybody` reassignment:** single literal, no defineProperty games.
6. **OM/audio: never stretch recordings** (vowel quantity), gaps carry timing.
7. **ḷ/ḹ have no verified recordings.** Silence + visible flag, never substitution.

## Open threads (by value)
1. Recall drills → lab 3D (tap-body answers; mantra.html has 2D working).
2. Breath `startWhen` conditions (scores follow live breath when confidence allows).
3. Nodal particles behind Chladni; RK4 ambient currents; tiny_maps transitions.
4. Spanda score format conversion; voice-leading octave smoothing.
5. BLE strap + Muse connect buttons (sensors.js ready; Chrome/Edge only).
6. Petal vṛttis on tap; 8 anahata concentrations as scores; bhutashuddhi counts score.
7. Sārdhatriśatikālottara mining; Netra-7 nodes; comparison split-screen polish.
8. Vajrayāna winds/drops animation (structure only — initiation contexts never replaced).

## Owner's current focus
North star: `northstar.md`. Backend-first: full taxonomy in `docs/CATALOG.md` + `site/data/catalog.json` (tradition → school → course → phase → practice, standard score grammar). Frontend migrates to walk the catalog next. Mātṛkā track per VISION-matrika-pathway.md stays the live reference.
