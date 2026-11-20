#!/usr/bin/env python3
"""check_mcp_reflection.py — MCP surface vs server reality.

Two things must stay in sync or the public reader silently hides features:

  * every tool a gateway host allowlists must exist in its server;
  * every tool the server advertises should be reachable on some host
    (otherwise it is dead surface: built, tested, unreachable).

This is a reflection gate, not a feature audit. It answers one question:
"does what we expose equal what we run?" Fail-closed: exit 1 on any
allowlist entry that names a tool the server does not advertise.

Usage: python3 tools/check_mcp_reflection.py [--quiet]
"""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MCP = ROOT / "mcp"
GATEWAY = MCP / "gateway"


def server_tools(server_py: Path) -> set[str]:
    """Ask the server itself (JSON-RPC tools/list) so we never parse source."""
    req = json.dumps({"jsonrpc": "2.0", "id": 1, "method": "tools/list"}) + "\n"
    r = subprocess.run([sys.executable, str(server_py)], input=req,
                       capture_output=True, text=True, timeout=60)
    if r.returncode != 0:
        raise SystemExit(f"server {server_py} failed: {(r.stderr or '')[:400]}")
    for line in r.stdout.splitlines():
        try:
            obj = json.loads(line)
        except ValueError:
            continue
        if obj.get("id") == 1 and "result" in obj:
            return {t["name"] for t in obj["result"].get("tools", [])}
    raise SystemExit(f"server {server_py} returned no tools/list result")


def host_allowlists():
    """Yield (host, server_name, [tool names stripped of 'scholar__'])."""
    for p in sorted(GATEWAY.glob("servers-*.json")):
        d = json.loads(p.read_text(encoding="utf-8"))
        host = p.stem.replace("servers-", "")
        for sname, srv in (d.get("servers") or {}).items():
            allow = srv.get("tools_allow")
            if not allow:
                continue
            prefix = sname + "__"
            names = [n[len(prefix):] if n.startswith(prefix) else n for n in allow]
            yield host, sname, names


def main() -> int:
    quiet = "--quiet" in sys.argv
    server_py = MCP / "scholar_server.py"
    have = server_tools(server_py)
    seen_public: set[str] = set()
    errors, warns = [], []

    for host, sname, names in host_allowlists():
        if sname != "scholar":
            continue
        for n in names:
            seen_public.add(n)
            if n not in have:
                errors.append(f"{host}: allowlists scholar__{n} but the server does not advertise it")

    dead = sorted(have - seen_public)
    # Hosts that intentionally keep private/write surface off public readers.
    # We report dead tools as INFO, not failure: "unreachable" is a defect to
    # review, not always a bug.
    for e in errors:
        print("FAIL  " + e)
    if not quiet:
        print(f"INFO  server advertises {len(have)} tools; "
              f"{len(seen_public & have)} reachable on a gateway host")
        if dead:
            print("INFO  not on any gateway host: " + ", ".join(dead))

    if errors:
        print(f"reflection: RED ({len(errors)} stale allowlist entries)")
        return 1
    print("reflection: GREEN")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
