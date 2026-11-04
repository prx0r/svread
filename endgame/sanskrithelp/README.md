# SanskritHelp — daytime Sanskrit frontend

Live: **https://sanskrit.help** (Cloudflare Workers, tracks `main`).

Daytime laptop app: Pāṇini machine UI + tantra practice + readings.
Night engine = Stonedoorway · Memory engine = Bruno (linked, not merged).

## Orient in 2 minutes

| Doc | What |
|---|---|
| `HANDOVER.md` | Current state + pending threads |
| `AGENTS.md` | Working rules (read before building) |
| `docs/visions/VISION-INDEX.md` | Core visions first (awesomevision → awesome2 → awesomevision3), then annexes |
| `docs/visions/awesomecurriculum.md` | Nightly course: checkpoints 0–10, Audios 00–19 |
| `docs/TRANSLATION_FRONTIER.md` | Mālinī/Mātṛkā translation targets + packet |
| `DEPLOY-SPEC.md` | Deploy runbook (read the FIRST error) |

## Where things live

| Route | What |
|---|---|
| `/memory` | Hub: Tonight 50 chart, nyāsa, wheels, Bruno 50, canonical table, Night Handoff, Hindi |
| `/memory/hindi` | Hindi wheels, Text Mode (Osho), Field Scenarios, speak-and-score |
| `/learn/*` | Grammar curriculum (sandhi, roots, verbs, tutor…) |
| `/tantra/*` | Cakra grid, breath practice, log, tattvas, chat (provenance-labeled) |
| `/content/readings/*` | 6 corpora with audio (Śiva Sūtra 117 files, VBT…) |
| `/drill`, `/games` | Drills + play |

## Canonical data (frozen, tested)

* `public/memory/data/matrika_body_map.json` — **v2**: verse-literal TĀ 15.117–120, 50 loci. Truth source.
* `public/memory/data/malini_order.json` — Mālinī na→pha order.
* `public/memory/canonical/TA15_TABLE.html` — generated visible table (50+50).
* `public/memory/clips/` — 47/50 human clips (missing ḷ ḹ kṣa).
* Tests: `npm test` (111+) · `npx tsc --noEmit` must both pass.

## Rules that cost us before

* Verse vs apparatus never mixed in one sitting. Pacing/colors/DHVANI are ours, labeled.
* Phonemes are human recordings only — synth never enters install path unverified.
* Don&apos;t commit other sessions&apos; files (check `git status` + `git diff` first).

## Deploy

Push to `main` → GitHub Action (`opennextjs-cloudflare build` + `wrangler deploy`).
Secrets: `CLOUDFLARE_API_TOKEN` (Workers-scoped). No app keys needed (free backend).
