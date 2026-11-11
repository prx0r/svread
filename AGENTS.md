# AGENTS.md — svread (svatantrya.net)

Short. The full estate policy lives in `/root/AGENTS.md`; the docs map is
[`docs/INDEX.md`](docs/INDEX.md).

## Publishing (read first)

**Push feature branches and open PRs — always permitted.** "Never push" in an
estate doc means *never push to the default branch*. This repo's default is
`main`.

```sh
git checkout -b <branch>
git add -A && git commit -m "<msg>"
git push -u origin <branch>
gh pr create --base main --head <branch> ...
```

- A 403 from a token/API is **not** a stop order: push the branch, open the PR,
  or hand off a zip via R2, and report it.
- Never commit secrets (`.env`, `.dev.vars`, `*.pem`, tokens). If one lands,
  rotate it and say so.
- Merging: don't merge your own PR while a reviewer is active; otherwise merge
  after CI is green.

## Before you change anything

1. `docs/INDEX.md` — canonical vs reference vs history.
2. `PRODUCTION.md` §0 — today's delta; §3 — build order (emitters, then
   `release_manifest.py --write` **last**).
3. `TESTING.md` — every suite and its exact command.

## House law (non-negotiable)

- **BLOCKED ≠ PASS.** A blocked gate is reported as blocked, with the reason.
- **DERIVED ≠ truth.** Machine traces and `AGREE` crosschecks are computation,
  not scholarship; never present them as a reading.
- **Three stamps stay separate:** bytes (hashes), mechanics (certificates /
  Lean), meaning (human sign-off).
- **Closed world:** unlisted Sanskrit forms never render; BLOCKED English never
  ships.
- **No auto-publish / auto-sign / auto-promote**, ever. Humans hold those.
- Deitybody curriculum: modern apparatus over attested elements — never
  doctrine.
- Secrets and private material never enter crawler-facing files or archives.

## Where the work is

| Area | Files |
|---|---|
| Reader | `app.js`, `styles.css`, `index.html`, `SPEC.md` |
| Wheels + practice | `wheels.html`, `wheels.js`, `journey.js`, `data/wheels/`, `data/practice/` |
| Gates (server) | ipvv `worker/src/index.js` + `worker/test/gate.test.mjs` |
| Certificates | `tools/certlib.py`, `tools/emit_certificates.py`, `data/grammar/certificates.json` |
| Evidence surface | `claim/`, `work/`, `chain/`, `data/traces/`, `data/verify/` |
| MCP | `mcp/scholar_server.py`, `data/mcp-registry.json`, `MCP-INTEGRATION.md` |
| Emitters | `tools/emit_*.py` (all `--check` deterministic) |
