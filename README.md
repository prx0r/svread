# svread — fresh trika reader, from scratch

> **START HERE (2026-11-11):**
> - **[`docs/INDEX.md`](docs/INDEX.md)** — the map: canonical, reference, history.
>   Read this before anything else.
> - **[`PRODUCTION.md`](PRODUCTION.md)** — build / verify / deploy / ops (§0 = today's delta).
> - **[`MASTERPLAN3.md`](MASTERPLAN3.md)** — the operative plan (W1–W7).
> - **[`PROGRESS-REPORT-2026-11-11.md`](PROGRESS-REPORT-2026-11-11.md)** — what is
>   actually done against it, including the one **BLOCKED**.
> - **[`EXTERNAL-STRATEGY.md`](EXTERNAL-STRATEGY.md)** — the independent
>   integration contract + M0–M6 roadmap we are held to.
> - **[`MCP-INTEGRATION.md`](MCP-INTEGRATION.md)** — the one MCP surface for
>   ChatGPT (registry: [`data/mcp-registry.json`](data/mcp-registry.json)).
> - Reader spec: [`SPEC.md`](SPEC.md) · architecture:
>   [`READER-ARCHITECTURE.md`](READER-ARCHITECTURE.md) · testing: [`TESTING.md`](TESTING.md).

> NOTE 2026-11-10: this file describes the original reader scaffold. Current
> system docs: `PRODUCTION.md` (go-live manual: build/verify/deploy/ops),
> `SPEC.md` (reader architecture), `HANDOVER-SEO-2026-11-08.md` + 
> `SEO-GEO-PLAN-2026-11-08.md` (claim-page surface). Body below kept as history.

New standalone site. Old readers (`ipvv/site/app`, deitybody lab) untouched.

## Working code it stands on
- **Skeleton**: `gita-quotes` pattern (MIT) — static HTML/JS, vendored JSON
  and a service worker. No site build is required. Live reading data, chat and
  generated audio also depend on ipvv's hosted data and Worker; chant recordings
  and timings live in R2. Vendored reading data is the offline fallback.
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

The reader prefers live ipvv layers and then its vendored copy; those can change
independently. A `PASS` gate permits display but is not proof of an independent
scholar review. The reader withholds English for all other gates, including in
audio, export and its local word-gloss lookup. Sanskrit and editorial marks are
shown from the source data, not independently checked or corrected by the reader.
If an edition isn't recorded, the attribution says so. The last-resort root-text
fallback assigns local section IDs and does not claim verse-by-verse alignment.

The attributions panel identifies the chosen source as live, bundled or custom
and shows a SHA-256 fingerprint of the received data when browser cryptography is
available. Live data is mutable; the fingerprint identifies what was fetched but
does not archive it. The bundled `data/release-manifest.json` fingerprints the
checked-in assets and pins the Scholar projection and structural-schema hashes.
It does not establish authenticity or scholarly correctness. After changing any
bundled asset, regenerate it with `python3 scripts/release_manifest.py --write`
and verify with `python3 scripts/release_manifest.py`.

Run the local checks with `node --check app.js` and
`node --test tests/reader-integrity.test.cjs tests/release-manifest.test.cjs tests/service-worker-privacy.test.cjs tests/scholar-smoke.cjs`.
The audio Worker and its versioned R2 cache are documented in ipvv's
`worker/SVREAD-AUDIO.md` on the accompanying review branch.

See `READER-ARCHITECTURE.md` for the data flow, release checks and the active
Ghaṭakarpara source-coverage hold.

For the local Scholar MCP bridge, account privacy, and tests, see [mcp/README.md](mcp/README.md).


### Pushing Lab (prototype)

Open `pushing.html` from the navigation to turn pasted conversation turns into a
private, editable enquiry tree. Attach an available Scholar passage, select
permissioned scholarly essays, and draft a private, source-linked essay with Qwen.
Account, permissions and Qwen actions require the matching configured Worker. Read
[`PUSHING-LAB.md`](PUSHING-LAB.md) for boundaries, tests and the handoff.
