# Satsang visual grammar v1

The machine-readable version is `grammar.json`; this file explains it. The grammar turns practice-instruction semantics ("inhale through the left nostril", "hold", "spread", "rest attention in the skull") into a small set of visual primitives on one standard body. It **extends prx0r/deitybody** rather than replacing it:

| From deitybody | Used here as |
|---|---|
| `site/body/canonical-body.json`: region and centre names, y values (crown 3.3, brow 2.75, throat 1.6, heart 0.78, navel −0.9, dvādaśānta 4.3), mirror-correct orientation rule | Locus ids and head/torso coordinates (`frame` = deitybody scene units, y up) |
| `site/frameworks/layayoga/config/nadis-ten.json`: suṣumṇā/iḍā/piṅgalā topology, the kanda hub | `paths.sushumna/ida/pingala`, `loci.kanda` |
| `site/body/reference/anatomy-geometry.json`: dvādaśānta stations (brahmarandhra, tālu, bhrūmadhya…), chakra petals and colours | Loci, petal counts, optional chakra hues (off by default) |
| `site/engine/primitives/vitruvian-figure.js`: the capsule canon | The seated (padmasana) front silhouette, built from capsules |
| `site/engine/paths.js`: arc-length travel along addressed curves | Path primitive (constant-speed u ∈ 0..1) |
| `site/engine/mechanisms/registry.json` (nadi-flow, kundalini-ascent, field-suffusion, wave-interference, yantra-install) and `operators.json` (expand, contract, dissolve, suspend, pulse) | Motions carry a `deitybody` / `operator` cross-reference |
| `docs/ARCHITECTURE.md` product rules: no rainbow-chakra lead, stop always available, no competitive breath-holding | Palette rule, safety section, player behaviour |

Two deliberate departures: (1) the pelvis and legs are **re-seated** for a meditation posture (in canonical-body.json the root centre at −3.2 sits below the knees of the standing figure); (2) iḍā is drawn on **screen right**, following canonical-body.json's own orientation rule (facing the viewer, so screen-left is the practitioner's right). Note that `nadis-ten.json` puts iḍā at −x, which contradicts that rule; flag this upstream.

## 1. Primitives

| Primitive | Address | What it draws | Typical instruction |
|---|---|---|---|
| **locus** | `loci.<id>` | A named point: marker, halo, optional label. Kinds: chakra (with petals), resting spot, station | "at the tip of the nose", "the base of the spine" |
| **path** | `paths.<id>` | Flow along a curve between loci; arc-length parameterised; a glowing "liquid" stroke with advected particles riding in it; optional `exit: "air"` spray | "breathe in through the left nostril", "let it flow down the arms" |
| **field** | `regions.<id>` (`whole_body` = the silhouette, or ellipses: `kapala`, `head`, `chest`, `heart_cave`, `belly`) | Diffuse spread: particles sampled inside the region, plus a soft region glow | "spread through the whole body", "the skull vibrates" |
| **attention** | any locus, region or path | A spotlight: the periphery dims, focus radius by size: `narrow` 0.34, `medium` 0.75, `wide` 1.55, `whole` (no dimming). Eased so attention *moves* | "rest attention inside the skull", "keep awareness broad" |

Locus set (v1): dvādaśānta, sahasrāra, **brahmarandhra**, lalāṭa, **kapāla** (the cranial cavity, "cavern of Brahman"), middle_of_head, ājñā, nose_tip, nostril_L/R, palate, base_of_skull, viśuddha, throat_base, anāhata, heart_cave, middle_chest, breastbone, above_navel, maṇipūra, kanda, svādhiṣṭhāna, mūlādhāra, plus limb points (shoulder, elbow, wrist, fingertips, hip, knee, foot ×2). Ajahn Lee's six resting spots are all first-class loci.

Paths (v1): `sushumna`, `ida`, `pingala` (crossing helix: nostril → ājñā → crossing at each chakra → mūlādhāra), `spine`, `arm_L/R`, `leg_L/R` (Ajahn Lee's routes), `front_line`, `chest_down`, `nose_to_kapala`, `heart_to_kapala`, `navel_to_nose`, `kapala_to_brahmarandhra`.

## 2. Motions × breath phase

Breath phases are the clock: `in`, `hold_in`, `out`, `hold_out`, plus `natural` (the orb shows a suggested 5 s in / 6 s out, drawn faint) and `rest`. Every motion is a function of phase progress p ∈ 0..1, eased (default `inOutSine`, `outQuad` for kapalabhati strokes).

| Motion | On | In-phase behaviour | Meaning |
|---|---|---|---|
| **flow** | path | `fill`: the channel fills from its source to the breath front f = ease(p); `drain`: the column leaves through the far end; `stream`: whole path flowing | breath/prāṇa moving along a nāḍī |
| **fill** | field, locus | intensity 0→1 (with `from`, behaves like expand) | gathering, receiving |
| **hold-glow** | locus, path | steady halo; *pressure shimmer* grows with time held (orbiting motes, jitter, a breathing ring) | retention, compression, kumbhaka |
| **dissipate** | field, path, locus | intensity 1→0; motes drift outward and cool to smoke | release, letting go, dissolving |
| **expand** | field, attention | a wavefront grows from the origin locus; a soft-edged glow follows it | spreading, pervading |
| **contract** | field | the front shrinks toward the origin | gathering in, withdrawal |
| **rise** | path | flow upward on the central line | ascent (kuṇḍalinī, attention rising) |
| **pulse** | locus | one impulse per stroke: ring and particle kick | active expulsion (kapālabhāti) |
| **rotate** | locus | the petal ring turns slowly | a chakra installed, resting at a centre |
| **vibrate** | field | radial standing wave and expanding ripples | sound and nāda (bhrāmarī, mantra) |
| **steady** | any | a gentle glow that breathes with the volume | resting, abiding |

## 3. Colour and temperature

| Token | Hex | Temperature | Means |
|---|---|---|---|
| breath | `#f3dca0` | warm neutral | in-breath, generic prāṇa |
| lunar | `#b4cdf0` | cool | iḍā, left, cooling |
| solar | `#f2a54a` | warm | piṅgalā, right, heating |
| central | `#fff2d2` | white-gold | suṣumṇā, balance |
| retention | `#e9b764` | deep gold | held breath |
| release | `#cdbfa8` | cooling smoke | out-breath, dissipation |
| ember | `#ff8a3d` | hot | agni at the navel, expulsion |
| nada | `#d2c3f2` | cool violet | sound and vibration |
| awareness | `#efe9dd` | neutral | attention, knowing, space |

The palette sits on the live site's tokens (`--bg #0a0d14`, gold `#e8cf96`, amber `#d9982f`). Chakra hues exist but stay **off** by default. Pale colours get an additive-blend gain (`GAIN` in engine.js) so they glow rather than clip to white.

## 4. Instruction verbs → primitives

The compiler expands `"do": [{ "verb": …, … }]` using `grammar.verbs`, so a book miner can emit verbs instead of hand-placed visuals:

| Verb | Becomes | Default phase | Example |
|---|---|---|---|
| draw, inhale, send | path · flow · fill | in | `{verb:"draw", along:"ida"}` |
| hold, retain | locus · hold-glow | hold_in | `{verb:"hold", at:"muladhara"}` |
| release, exhale | path · flow · drain | out | `{verb:"release", along:"pingala"}` |
| let_flow | path · flow · stream | any | "let it flow down the arms" |
| spread | field · expand (`from`) | any | `{verb:"spread", from:"breastbone", over:"whole_body"}` |
| fill | field · fill | in | |
| dissolve | field · dissipate | out | |
| rest_attention | attention (size) | any | `{verb:"rest_attention", at:"kapala", size:"narrow"}` |
| fix | attention · narrow | any | "fix the gaze at the tip of the nose" |
| feel | locus · steady + attention · medium | any | "feel the heart" |
| rise | path · rise | in | |
| hum | field · vibrate | out | `{verb:"hum", over:"kapala"}` |
| expel | locus · pulse | out | |
| unite | field · steady over whole_body | any | Ajahn Lee step 7 |

## 5. Safety (enforced by the player and compiler, not the content)

- Max hold is **30 s** (or the practice's `safety.max_hold_s` if lower); longer holds are capped and logged in `timeline.safety.applied`.
- **Beginner mode** applies `safety.beginner_override` (e.g. 1:4:2 → 1:0:2, 20 → 10 strokes), then strips any remaining hold over 10 s.
- `needs_teacher` and contraindications show on the start card before anything plays. Space or Escape always stops.
- Visuals show *where attention goes*. They are not anatomy and make no claim that a nāḍī is a nerve.

## 6. Extending

Add a locus or path in `grammar.json` (world units, mirror-correct), keep the deitybody name if one exists, and add `from` provenance. New motions need a renderer case in `player/engine.js` (`drawPath` / `drawLocus` / `drawField`) and a row here.

## 7. Milestone 1 renderers (2026-10-21)
| Primitive | Renderer | Behaviour |
|---|---|---|
| figure | `body/figure.mjs` (SVG) | seated front + side line art; belly, ribs, collarbones, shoulders, lungs and diaphragm move with `body/breath.mjs`; loci stay put |
| airflow | `body/figure.mjs` | streaks at the nostrils (side: the nose), direction from the flow sign, opacity from its speed; off in reduced motion |
| wave | `fx/wave.mjs` + SVG line + `fx/glow.js` halo | amplitude eases amp→to over the cue (a `flat_hold` cue reaches `to` by 55 %); `voice_react` lifts it with the narration's loudness envelope; `inward` quietens the outer wave first; `particles` ride it into the head |
| field (glow) | `fx/glow.js` | breath-synced soft glow + slow motes at the region centre (`fill` ramps in) |
| attention (glow) | `fx/glow.js` | a breathing glow on the attended locus/region (not drawn for `whole`) |
The Canvas2D renderer (`player/engine.js`) does not draw these yet; plays use `player/play.js`.
