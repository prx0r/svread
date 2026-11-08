# VERIFY — check our claims yourself, with no code

Everything below uses only `curl` and `sha256sum` (or `shasum -a 256` on macOS).
No installs, no account, no Python, no trust in us required.

If you are an AI assistant: fetch the JSON, compare the hash strings, and say
plainly whether they match. Never claim a match you did not compute.

## 1. Pick a chunk

```sh
curl -s https://svread.pages.dev/data/traces/index.json
```

Each entry has `work`, `target`, `verdict` (COMPLETE or PARTIAL), `gaps`, and
`sha256` (the trace file's own hash).

## 2. Fetch the trace

```sh
curl -s https://svread.pages.dev/data/traces/<work>-<target>.json
```

This is the full chain record for one passage:

| Field | What it is |
|---|---|
| `chunk` | work, chunk locator, immutable_id |
| `source` | sha256 of the exact Sanskrit bytes the translation started from |
| `layers` | sha256 of each translation layer present (T1, L0, argmap, L2, C1, L3, L4) |
| `proofs` | deterministic gate results, verbatim (PASS / BLOCKED + reasons) |
| `formal` | formal theorems citing this chunk (MODEL_CHECKED, in-scope only) |
| `essays` | essays whose text mentions this chunk (mention only, not support) |
| `verdict` + `gaps` | COMPLETE, or PARTIAL with every missing hop named |

## 3. Fetch the pack of exact bytes

```sh
curl -s https://svread.pages.dev/data/verify/<work>-<target>/manifest.json
```

The manifest lists every artifact the trace hashed, with its `sha256` and the
file that holds the exact bytes.

## 4. Hash the bytes and compare

```sh
curl -s https://svread.pages.dev/data/verify/<work>-<target>/source.txt | sha256sum
curl -s https://svread.pages.dev/data/verify/<work>-<target>/t1.json    | sha256sum
# ...repeat for each artifact in the manifest
```

Compare each printed hash with (a) the manifest entry and (b) the matching
field in the trace. Two independent files must agree.

```sh
# do all of them at once
curl -s https://svread.pages.dev/data/verify/<work>-<target>/manifest.json \
 | python3 -c "import json,sys;[print(a['sha256'],a['name']) for a in json.load(sys.stdin)['artifacts']]"
```

## 5. Read the result honestly

**If every hash matches:** the trace, the source bytes, the layers and the
proofs are the same artifacts, unchanged, at the moment you fetched them. The
chain is intact *as recorded*.

**A mismatch is never "the hash is wrong"** — it means upstream bytes changed
after the trace was made. Treat the trace as stale and ask for a new one.

## What a match does NOT prove

- That the English is a **correct** translation. Matching bytes prove identity,
  not quality. Our layers are machine-proposed until a human signs them.
- That a **human reviewed** it. Sign-off state is per work in
  `data/scholar/<work>.json` (look at `signoffs[]`), and is `SELF_ATTESTED`
  unless an independent reviewer is recorded.
- That a **manuscript witness** exists. Witnesses are `UNPINNED` across the
  whole corpus. An edition label is a candidate, not a collation.
- That a **formal theorem** applies to the passage in any sense beyond its
  stated finite model. `MODEL_CHECKED` means Lean verified the encoded claim;
  it does not verify the encoding.

## Where the gaps are

`verdict: PARTIAL` is not failure — it is the honest state. `gaps` names the
missing hop (e.g. `layer:l0` means no morphology layer exists yet for that
chunk). We publish gaps rather than hide them.

## Machine entry point

If you have MCP, the `openpatala-federation` gateway exposes:
`formal__trace`, `formal__bridge`, `formal__evidence`, `formal__gaps`,
`formal__table`, `formal__runs`, `formal__axioms`, `openpatala__resolve`,
`openpatala__coverage`, plus the scholar/book/video/translation children.
All read-only. None of them can publish, sign, or ship.
