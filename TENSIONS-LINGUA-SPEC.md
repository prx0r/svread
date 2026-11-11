<!-- status: reference — crux/tension language spec -->

> **Status (2026-11-11):** reference — crux/tension language spec.

# Tensions Lingua Spec — one language, zero migrations

Status: **spec + reference implementation** (`tools/lingua.py`, stdlib only,
read-only). No existing system is modified: the resolver reads every repo
and writes none. Tension is the core connector — every loop already has a
tension-shaped object, so links meet there, including under the hood where
two systems never directly reference each other.

## 1. The rule

Nothing gets a new schema. Each repo keeps its native files. The shared
language is an **ID grammar** plus **sidecar links** (which already exist:
`_links.json`, `approved_chNN.json`, essay-permission rows, receipt chains).
A resolver answers, for any ID: *what bytes, what status, what license —
or fail closed.*

## 2. Atoms and IDs

| Atom | ID form | Resolves to (bytes + status + license) |
|---|---|---|
| Work | `work:<work>` | tw dir: `STATUS.json` counts, passages count, projection presence |
| Chunk | `chunk:<work>:<locator>` | `passages.jsonl` row (verses, order) + projection present/absent |
| Tension (personal) | `tension:<id>` | `tensions/<id>.md` header (status/domain/roots/summary) + sidecar links |
| Crux (scholar) | `crux:<work>:<slug>` | pushing-catalog record (question/title/file/git_blob) |
| Essay (scholar) | `essay:scholar:<work>:<essay_id>` | projection entry: title/author/rights/identity/assisted/model + text hash |
| Essay (personal) | `essay:personal:<path>` | nibbanahelp essay header (`resolves:`) + body hash |
| Pack | `pack:<path>` | pack header (form/evidence/beats/runtime) + file hash |
| Render | `aoc:<content_id>` | receipt row (hook/template/slides/zip) |

Out of scope (live-only, not on disk): D1 drafts/reviews/grants, R2 audio,
Vectorize. The resolver reports their absence as `live_only: true` where a
link would need them, never by guessing.

## 3. Tension as the core connector

Under the hood, every cross-system path passes through a tension node:

```
chunk ──evidence──▶ pack ──resolves──▶ tension ◀──resolves── essay
crux ──янDEX(work)──▶ work ◀──projection── chunk
tension ──status──▶ (open | loosening | resolved)
```

Link rules (enforced by `lingua.py check`, mirroring `resolve.py check`):

- Essays resolve tensions; nothing deletes them.
- Packs cite chunks (`<work>:<locator>`) or tensions (`tension:<id>`); every
  ref must resolve or the pack is stale.
- One personal essay resolves at most one tension.
- Status flips are human; machines write sidecars only.
- Scholar essay → chunk links are unavailable on disk (citations live in
  D1); the resolver links scholar essays to their work, never to passages
  it cannot verify.

## 4. Resolver contract (`tools/lingua.py`)

Stdlib only. Roots overridable by env (`SVREAD_ROOT`, `TRANSLATION_WORK_ROOT`,
`NIBBANAHELP_ROOT`, `IPVV_ROOT`, `AOC_ROOT`) so tests run on fixture trees.

- `resolve <id>` → JSON record, exit 0; unknown/unresolvable → stderr +
  exit 1 (fail closed, no partial records).
- `links <id>` → sorted linked IDs (both directions, deduplicated).
- `tensions` → every tension known: personal tensions (kind `tension`)
  plus pushing cruxes (kind `crux`).
- `check` → every sidecar essay/video ref exists; every pack evidence ref
  resolves; exit 1 on any breakage.

Records never embed secrets, private drafts, or full texts — metadata and
hashes only (excerpts capped at 300 chars where shown at all).

## 5. What this does not do (deliberately)

- No writes to any repo. No DB, no network, no models.
- No new IDs minted; it only reads IDs the systems already mint.
- No taste, no ranking, no resolution of tensions — it maps the territory
  so the loops (scholar review, diarist hand, owner ears) can traverse it.
- Tantrasara render repo is remote-only: packs may cite its *translation*
  chunks (local, in translation-work), never its storyboards (not on disk).
