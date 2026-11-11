# OPENPATALA — how svread connects to it, and how to add texts

*2026-11-11. Every path below was read off the live box; counts re-queried
from the DB. Canonical openpatala doc: `/root/openpatala/OPENPATALA.md`.*

```
                    ┌──────────────────────────────────────────────┐
                    │  openpatala (identity layer)                 │
   Postgres box DB  │  /root/openpatala  ·  API 127.0.0.1:8821     │
   555 works        │  patala/mcp_server.py (5 tools, stdio)       │
   909 passages     └───────────┬───────────────┬──────────────────┘
        ▲                       │               │
        │ psycopg2              │ stdio MCP     │ REST (reads)
        │                       │               │
┌───────┴────────────┐  ┌───────┴──────────────┴──┐   ┌────────────────────┐
│ svread             │  │ trika-x federation      │   │ any HTTP client    │
│ tools/emit_biblio  │  │ gateway (104 tools,     │   │ :8821 /v1/works    │
│ tools/lingua.py    │  │  openpatala_mcp child)  │   └────────────────────┘
│ data/biblio.json   │  └────────────────────────┘
└────────────────────┘
```

---

## 1. svread bibliography ↔ openpatala

**The bibliography IS a view of the openpatala DB.** Not a separate list.

| Piece | Path | What it does |
|---|---|---|
| Emitter | `svread/tools/emit_biblio.py` | Docstring: *"openpatala bibliography as a static view on the DB"*. Connects `dbname=openpatala user=patala password=patala host=127.0.0.1` (psycopg2). Prints `openpatala box DB (local)`. |
| Output | `svread/data/biblio.json` | **555 works** — every row's `id` is the openpatala work id (e.g. `PTCND_pandit_109577`). Also `counts`, `people`, `provenance`. |
| Served at | `?view=biblio` (Index tab), `llms.txt`, `ai-catalog.json` | Static; regenerate with `python3 tools/emit_biblio.py` after DB changes. |
| CI note | `tests/wiring.test.cjs` → `emit_biblio.py` need=`db` | Skips when no DB; never "fix" that skip. |

**Per-work bridge (which svread work ↔ which openpatala id):**

| Piece | Path | What it does |
|---|---|---|
| Map | `translation-work/source-maps/openpatala.json` | 3 entries so far. Format `svatantrya-openpatala-map/1`; keys carry `openpatala_work_id` + mapping_status. Rule in the file: *CANDIDATE = shared external ID only; witness stays UNKNOWN until resolved with evidence.* |
| Reader | `svread/tools/lingua.py` → `_openpatala_block(work)` | Reads that map, returns `{openpatala_work_id, mapping_status, …}`; defaults `UNKNOWN` / `UNMAPPED` when absent. |
| Embedded in | every trace bundle (`data/traces/<work>-<target>.json`) + claim pages | The `openpatala` block is part of the evidence chain: claim → work id → identity layer. |

So the chain is: **claim page → trace bundle → `lingua.py` block → source-map →
openpatala work id → Postgres row.** Adding a map entry is how you connect a
new translation-work work to an openpatala identity.

---

## 2. openpatala MCP — where the code is, how it's connected

| Piece | Path | What it does |
|---|---|---|
| **Server code** | `/root/openpatala/patala/mcp_server.py` | stdio MCP, **5 tools**: `resolve` (name → entity), `get_bundle` (dossier: assertions + external ids), `search` (title search), `get_frontier` (works needing translations/sources), `get_health` (counts). Imports `mcp.server.mcpserver.MCPServer` (mcp 2.x; `pip install mcp`). Run: `python3 /root/openpatala/patala/mcp_server.py` (NDJSON JSON-RPC on stdin/stdout). |
| **Federation connection** | `/root/trika-x/formal-trika/data/federation-children.json` | Child entry `openpatala_mcp`: `cmd: ["python3", "/root/openpatala/patala/mcp_server.py"]`. The gateway prefixes tools `openpatala_mcp__<tool>` and routes by prefix. |
| Gateway | `/root/trika-x/formal-trika/tools/federation_gateway.py` | One stdio endpoint aggregating 104 tools (scholar 33, bookfactory 22, video 18, translation 16, formal 7, openpatala 5+2, guide 1). FailOpen: dead child drops out, parent survives. |
| Frozen catalog | `/root/trika-x/formal-trika/data/mcp-catalog.json` | `tools/mcp_catalog.py --check` fails if the live catalog drifts. |
| HTTP API (separate) | `patala/api.py` on **127.0.0.1:8821** | REST reads: `/health`, `/v1/works`, `/v1/works/{id}`, `/v1/bundle/{id}`. Start: `PYTHONPATH=. nohup python3 -m uvicorn patala.api:app --port 8821 --host 127.0.0.1 &` |

**To call it yourself (no gateway):**
```sh
printf '%s\n' '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' \
  | python3 /root/openpatala/patala/mcp_server.py
```
**Via the federation (all 104 tools):**
```sh
printf '%s\n' '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' \
  | python3 /root/trika-x/formal-trika/tools/federation_gateway.py
```
(svread's own 37-tool MCP is `svread/mcp/scholar_server.py` — different server,
same stdio JSON-RPC shape.)

---

## 3. openpatala DB — where it lives, how to touch it

| Piece | Path / value |
|---|---|
| **DB** | PostgreSQL on the box: `postgresql://patala:patala@localhost:5432/openpatala` (env override `DATABASE_URL`) |
| Connect code | `/root/openpatala/patala/db/connection.py` → `get_connection()` (psycopg2) |
| Write helpers | `/root/openpatala/patala/db/store.py` → `insert_work`, `insert_assertion`, `insert_external_id`, `insert_event`, `insert_artifact`, `insert_raw_observation`, … |
| Migrations | `/root/openpatala/migrations/001_create_all_tables.sql` (34 tables) + `002_add_missing_tables.sql`; runner `patala/db/migrate.py` |
| Key tables | `works`, `editions`, `etexts`, `passages`, `assertions`, `external_identifiers`, `events`, `raw_observations`, `rights_policies`, … |
| **Counts (re-queried 2026-11-11)** | `works = 555` · 909 passages · 102 editions · 87 etexts · **0 witnesses** |
| Gate | `cd /root/openpatala && python3 check.py` — PASS/FAIL/BLOCKED per suite; BLOCKED is never PASS |
| Manual | `/root/openpatala/OPENPATALA.md` (what works, what doesn't, reproduce-from-scratch) |
| R2 mirror | `patala-volume-archive` bucket → `archive/openpatala/` (tree mirror + full tarball incl. .git + manifest, 2026-11-11) |

Query it directly:
```sh
PGPASSWORD=patala psql -h 127.0.0.1 -U patala -d openpatala \
  -c "SELECT id, preferred_title FROM works ORDER BY created_at DESC LIMIT 10;"
```

---

## 4. Adding texts to openpatala (the goal)

Ranked paths — **Mode B first**, it is built exactly for "one new work from
anywhere":

### Path A — one new Sanskrit work (recommended)
The loader lives in trika-x (it owns the bridge; openpatala owns identity):
```sh
cd /root/trika-x
python3 formal-trika/tools/openpatala_ingest.py \
  --file /path/to/text.txt \
  --work my-new-work \
  --edition "GRETIL / your edition string, as precise as you have" \
  --title "Full Title of the Work" \
  [--provider NAME]
```
What it writes (idempotent, `ON CONFLICT DO NOTHING` on stable ids):
`works` (id = work key) → `editions` (`{work}:edition:1` + external_ids) →
`artifacts` (sha256 of your bytes, `storage_uri = file://`) → `etexts`
(`{work}:etext:1`) → `passages` (one per ledger locator, `citation_scheme`
= chunk-locator). Source file for provenance: first of
`SOURCE.txt/SOURCE.md/source.txt/source/edition.json`.

### Path B — batch from the translation-work layout
Same script, no `--file`: reads every workdir with `passages.jsonl` +
`source-maps/openpatala.json` dossiers:
```sh
python3 formal-trika/tools/openpatala_ingest.py [--tw /root/translation-work] [--limit N]
```

### Path C — seeds already in the repo (re-runnable, idempotent)
```sh
python3 formal-trika/tools/openpatala_seed.py
python3 formal-trika/tools/openpatala_ingest.py
python3 formal-trika/tools/seed_atlas_biblio.py --apply
python3 formal-trika/tools/seed_abhinavagupta.py --apply
```

### Path D — adapter pipeline (curated external sources; event-sourced)
`SOURCE → RAW OBSERVATION → CANDIDATE ASSERTION → IDENTITY RESOLUTION → ENTITY`
```sh
cd /root/openpatala
python3 -m patala.cli ingest --source gretil --limit 10 --data-dir data
```
Registered `source_id`s in `patala/adapters/*/adapter.py`: `gretil`, `crossref`,
`openalex`, `wikidata`, `orcid`, `archiveorg`, `collatex`, `pandit`, `ror`,
`stam`, `darshana`, `sanskritree`, `muktabodha`. **Known blocker (OPENPATALA.md):**
adapters currently discover nothing in this checkout — "No items discovered".
Fixing = giving adapters real data/fetch paths; treat Path A/B as the working
routes until then.

### Path E — programmatic inserts (last resort)
`patala/db/store.py::insert_work(...)` etc. Only with an event row —
"Tools don't become truth; their outputs become observations."

### After adding — the required chain
1. `cd /root/openpatala && python3 check.py` (gate must not regress)
2. `PGPASSWORD=patala psql … -c "SELECT count(*) FROM works"` (see it)
3. svread: add the work to `translation-work/source-maps/openpatala.json`
   (`openpatala_work_id` + mapping_status) — this is what makes svread's
   traces/claims cite the new identity
4. svread: `python3 tools/emit_biblio.py` (bibliography picks it up;
   needs the DB — CI skips by design)
5. svread: downstream emits per `PRODUCTION.md` §3 (traces → verify →
   claim pages → discovery → `release_manifest.py --write` LAST)

---

## 5. Rules (inherited, non-negotiable)

- Identity is not philological truth: a work id + shared string is a
  **candidate** mapping, never a proven edition or witness.
- Nothing is real because a file exists; a claim needs a logged observation.
- Witnesses stay `UNPINNED` (currently 0 corpus-wide) until manuscript eyes.
- BLOCKED ≠ PASS at every gate; `check.py` decides, not us.
- svread reads openpatala **read-only**; writes happen in the openpatala or
  trika-x lanes (Paths A–E run from those checkouts).
