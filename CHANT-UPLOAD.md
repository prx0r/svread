<!-- status: reference — chant audio to R2 -->

> **Status (2026-11-11):** reference — chant audio to R2.

# Chant audio → R2 (handover for next agent)

## State: R2 audio + karaoke complete for all chanted works (verified 2026-11-02)

Bucket **`svread-audio`** exists and is PUBLIC at:
`https://pub-87169194562a44fcb8279a799d626c62.r2.dev`

Done (verified OK): bhairavastava (10), anuttarastika (8 + trad 8),
stavacintamani (120), dehastha (16), bodhapancadasika (15),
mahopadeshavimshatika (20), rahasyapanchadashika (16),
paramadvayadvadashika (13), pancashloki (5), kramastotra (30),
+ full coverage: ajadapramatrsiddhi, anubhavanivedana,
bhairavanukarana, bodhavilasa, isvarasiddhi, paramarthacarca,
paramarthasara, parapravesika, paryantapancasika, phrdaya,
ptvmadhyama, saktavijnana, sambandhasiddhi, sivastotravali (20 songs),
sivasutra, spandakarika, svabodhasiddhi, tattvasandoha.
Compiled align/ artifacts (R2): 9 works (anuttarastika,
bhairavanukarana, bhairavanukaranastotra, bhairavastava,
bodhapancadasika, paramarthasara, paryantapancasika,
sivastotravali, stavacintamani).

Not chanted (no kashaudio source — needs recording, not upload):
ghatakarpara, spandasandoha (+ tantrasara, vbt, malinivijaya roots).
Also: anuttarastika audio dirs use the `anuttarashtika[_trad]`
spelling; site maps via CHANTDIR (`anuttarastika→anuttarashtika_trad`).

## Finish the upload

```bash
python3 scripts/upload_chant.py
```
Idempotent (skips converted mp3s). Needs `/root/.r2-env`
(`R2_ENDPOINT`, `R2_ACCESS_KEY`, `R2_SECRET_KEY`).
Source: local `/root/kashaudio/<dir>/` (`*.wav` + `word_timings.json`).
Output per work: `audio/<wid>/<clip>.mp3` (96k) + `karaoke/<wid>.json`
+ top-level `works.json` manifest (rewritten each run — run once at end).

Mapping quirk: kashaudio dir `anuttarashtika_trad` uploads as wid
`anuttarastika` (see JOBS in script). Trad audio is the reference; the
AI `anuttarashtika/` dir is deliberately skipped.

Verify: `curl -s -o /dev/null -w "%{http_code}\n"
https://pub-87169194562a44fcb8279a799d626c62.r2.dev/works.json`
then spot-check one mp3 + one karaoke json per work.

## Rewire svread to R2

`site` currently chants from the ipvv origin (2 works). Switch it:

- `app.js`: add `const R2AUDIO = 'https://pub-87169194562a44fcb8279a799d626c62.r2.dev'`
- karaoke probe: `` `${R2AUDIO}/karaoke/${WORK}.json` `` (replaces
  `` `${IPVV}/data/karaoke-${WORK}.json` ``)
- clip url: `` `${R2AUDIO}/audio/${WORK}/${k.id}.mp3` ``
  (replaces the `${IPVV}/audio/${dir}/…` line; delete `CHANTDIR`)
- `works.json` on R2 is the coverage list if a widget ever needs it.

## Verify (Playwright, headless Chromium on box)

```bash
python3 -m http.server 8145   # in /root/svread
# load ?work=kramastotra, click #rcAll, expect:
#   .w[data-t0] count > 0, .verse.now advances, .w.sing present, no pageerrors
```

Then `git add -A && git commit && git push` + `wrangler pages deploy .`
(CLOUDFLARE_API_TOKEN from `/root/.cf-api-token`, project `svread`).

## Do NOT
- Vendor wavs/mp3s into git (700MB+). R2 only.
- Touch the `svatantrya` R2 bucket — name collision, чужой мусор.
- Re-upload the 4 done works unless timings change (script overwrites).
