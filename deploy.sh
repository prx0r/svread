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
# Token: env wins (CI secret / vault export); file fallback for the old box path.
if [ -z "${CLOUDFLARE_API_TOKEN:-}" ] && [ -f /root/.cf-api-token ]; then
  export CLOUDFLARE_API_TOKEN="$(cat /root/.cf-api-token)"
fi
: "${CLOUDFLARE_API_TOKEN:?Set CLOUDFLARE_API_TOKEN in env or place it in /root/.cf-api-token}"
STAGED_SITE="$(mktemp -d)"
trap 'rm -rf "$STAGED_SITE"' EXIT
python3 tools/stage_public_site.py "$STAGED_SITE"
# Post-stage guard (2026-11-16 incident): Pages deploys are atomic, so any live
# asset missing from the staged tree is DELETED in production. Refuse to deploy
# if a critical page or the claim page count regressed.
python3 - "$STAGED_SITE" <<'PY'
import pathlib, sys
staged = pathlib.Path(sys.argv[1])
critical = ['index.html', 'app.js', 'styles.css', 'sw.js', 'essay.html',
            'essay-workshop.js', 'essay-workshop.css', 'llms.txt',
            'sitemap.xml', 'ai-catalog.json', '_redirects']
missing = [f for f in critical if not (staged / f).is_file()]
claims = len(list(staged.glob('claim/*/*/index.html')))
if missing:
    sys.exit(f'REFUSING deploy: critical assets missing from staged tree: {missing}')
if claims < 900:
    sys.exit(f'REFUSING deploy: claim pages regressed to {claims} (< 900)')
print(f"staged guard ok: {len(list(staged.rglob('*')))} files, {claims} claim pages")
PY
# wrangler shim is broken on bun-only boxes (/usr/local/bin/wrangler needs node);
# prefer a working wrangler, fall back to bunx.
if command -v wrangler >/dev/null 2>&1 && wrangler --version >/dev/null 2>&1; then
  WRANGLER=wrangler
else
  WRANGLER="bunx --bun wrangler"
fi
$WRANGLER pages deploy "$STAGED_SITE" --project-name svread "$@"
