"""Files needed by operators but excluded from the public Pages bundle."""

PRIVATE_ASSETS = frozenset({
    'mcp/gateway/servers-nibbana.json',
    'deploy/systemd/svatantrya-mcp-nibbana.service',
    'tools/site_assets.py',
    'tools/stage_public_site.py',
})


def is_public_asset(relative_path: str) -> bool:
    return relative_path not in PRIVATE_ASSETS
