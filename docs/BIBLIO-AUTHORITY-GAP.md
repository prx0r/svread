# Biblio authority gaps (measured 2026-11-11)

`data/biblio.json` follows the external authority database (2,051 works; the
local PG15 mirror holds 1,034). Two gaps are inherited from upstream and are
recorded here so they are never mistaken for our regression.

## 427 untitled `PTW_` works

```
$ python3 - <<'EOF'
import json
works = json.load(open('data/biblio.json'))['works']
ptw = [w for w in works if w['id'].startswith('PTW_')]
print(len(ptw), sum(1 for w in ptw if not (w.get('title') or '').strip()))
EOF
1099 427
```

Every one of the 427 carries only `id` and `type: "TEXT"`. No title, no author,
no language, no editions, no passages, no translations. They are stubs in the
upstream DB, not records we dropped: our emitter copies their fields verbatim
and `emit_biblio --check` stays GREEN because the digest covers the whole file.

Consequence: a work with an empty title can never surface in the reader, the
wheel or a claim page. The biblio test tolerates <25% untitled; the current
share is 427/2051 = 20.8%, so it passes, but the number should be watched — if
upstream adds more stubs the test will start failing and that failure would be
a true signal, not noise.

What would close it: upstream filling `title` (or us mapping `PTW_` ids to
Muktabodha/TITUS records by hand). We cannot derive titles locally — the id is
opaque and the local mirror has no matching rows.

## `PTW_` ids cannot be re-derived locally

Ids are `PTW_` + 16 hex characters assigned upstream. Nothing in the local PG15
mirror or the translation-work tree generates them, so a full restore of the
authority DB is impossible here — only a mirror copy is. That is why
`data/biblio.authority.json` pins the digest instead of claiming local
authorship.

## What is NOT a gap

- 202 works have translation links; the rest legitimately have none (no one has
  published one). That is a coverage fact, not missing data.
- 37 works have no named source edition. The release manifest reports this on
  every run by design.

## Why the authority DB is not restored here (the exact blocker)

The authoritative DB runs PostgreSQL 18. This box runs PostgreSQL 15. A dump
taken with `pg_dump -Fc` on PG18 cannot be restored into PG15 — `pg_restore`
rejects a dump made by a newer major version, and there is no flag that makes
it accept one. Installing PG18 alongside is possible but would not make this
box the authority, and the mirror is sufficient for local experiments.

So the standing arrangement is:

1. the authority re-emits `data/biblio.json` on the PG18 box;
2. `data/biblio.authority.json` records the digest and counts of that emit;
3. here, `emit_biblio.py --check` verifies the committed file against the
   digest and prints `GREEN (external authority: 2051 works; local DB is a
   mirror at 1034)`.

The only honest local change is to the mirror (e.g. `tools/seed_muktabodha.py`),
never to the committed authority file. If a future run prints RED, the file
was edited or the authority changed — both are findings, not obstacles.
