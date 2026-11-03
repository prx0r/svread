#!/usr/bin/env bash
# svread deploy — ALWAYS bumps the service-worker cache first (cache-first sw:
# return visitors keep stale app.js until the version changes — this bit us once).
set -e
cd "$(dirname "$0")"
python3 - <<'PY'
import re, time, pathlib
p = pathlib.Path('sw.js'); s = p.read_text()
v = int(time.time())
s = re.sub(r"const C = 'svread-v\d+'", f"const C = 'svread-{v}'", s, count=1)
p.write_text(s)
print("SW cache ->", re.search(r"const C = '([^']+)'", s).group(1))
PY
export CLOUDFLARE_API_TOKEN="$(cat /root/.cf-api-token)"
wrangler pages deploy . --project-name svread "$@"
