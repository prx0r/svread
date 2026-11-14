#!/usr/bin/env bash
# svread deploy — ALWAYS bumps the service-worker cache first (cache-first sw:
# return visitors keep stale app.js until the version changes — this bit us once).
set -e
cd "$(dirname "$0")"
python3 - <<'PY'
import re, time, pathlib
p = pathlib.Path('sw.js'); s = p.read_text()
v = int(time.time())
s = re.sub(r"const C = 'svread-[^']+'", f"const C = 'svread-{v}'", s, count=1)
p.write_text(s)
print("SW cache ->", re.search(r"const C = '([^']+)'", s).group(1))
PY
python3 tools/emit_index_meta.py
python3 scripts/release_manifest.py --write
export CLOUDFLARE_API_TOKEN="$(cat /root/.cf-api-token)"
STAGED_SITE="$(mktemp -d)"
trap 'rm -rf "$STAGED_SITE"' EXIT
python3 tools/stage_public_site.py "$STAGED_SITE"
wrangler pages deploy "$STAGED_SITE" --project-name svread "$@"
