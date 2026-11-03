# svread — fresh trika reader, from scratch

New standalone site. Old readers (`ipvv/site/app`, deitybody lab) untouched.

## Working code it stands on
- **Skeleton**: `gita-quotes` pattern (MIT) — one HTML + one JS + one JSON per
  work + service worker. No backend, no build, offline-first.
- **Data model**: SuttaCentral Bilara pattern — one chunk id, every layer
  (sa/l1/l2/c1/argmap) keyed to it ("cognates").
- **Reader chrome**: Scaife "add parallel version" + GitaVani per-verse voice
  picker + bhagavad-gita.us stacked voices + Anvaya `generated|human` flags.

## Layout
- `index.html` — shell + header + view switcher mount
- `styles.css` — **ALL visual design. Edit this file for typography/styling.**
  Tokens at top (`--sa-size`, `--en-size`, `--read-size`, `--measure`…),
  one section per view. Nothing in app.js depends on values, only class names.
- `app.js` — fetch once, render Read/Compare/Literal/Critical.
- `data/<work>.json` — `{work,title,master,verses:[{id,n,sa,l1,l2,c1,argmap,gate,model,date}]}`.
  Sanskrit stored as IAST; Devanagari rendered client-side (deterministic).
- `?work=X` vendored file · `?src=<url>` any layers-JSON url (CORS-open ipvv).

## Views
- **Read** = C1 commentary as clean prose (labels stripped), L2 fallback.
  Per-verse Commentary|Translation toggle. Fail-closed: BLOCKED = Sanskrit only.
- **Compare** = L1 | L2 columns. **Literal** = Sanskrit + L1.
- **Critical** = stacked voices + provenance + ＋ add your version (localStorage).
- **Scholar** (`?view=scholar`) = the hub: any layer → edit → save as a version that forks off the original or anyone’s version; sign-offs list. Same functions/classes.

## Run
Any static server on this dir, e.g. `python3 -m http.server 8133`.
Deploy: any static host (Cloudflare Pages: root = this dir, no build command).
