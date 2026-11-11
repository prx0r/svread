#!/usr/bin/env python3
"""workspace_server.py — scoped read/edit access to the estate for an agent.

Tools:
  ws_roots                 allowed roots and what is blocked
  ws_list {path}           list a directory
  ws_read {path}           read a text file (<= 512 KB)
  ws_write {path, content} create/overwrite a text file
  ws_patch {path, old, new} exact-string replace (fails if not unique)
  ws_grep {query, path?, glob?}  literal/regex search, bounded output
  ws_git {repo, action, args?}   status | log | diff | add | commit | branch | checkout

It is deliberately narrow:
  * only paths under ALLOW_ROOTS, resolved through symlinks
  * secrets are refused by name (.env, .dev.vars, *.pem, credentials, id_rsa,
    .npmrc, .git-credentials) and .git internals are never readable
  * no shell; git actions are an allowlist and `push` is not one of them
  * writes are text only, capped, and always report the bytes written
"""
from __future__ import annotations
import json
import os
import re
import subprocess
import sys
from pathlib import Path

import mcp.types as types
from mcp.server.lowlevel import Server

ALLOW_ROOTS = [Path(p).resolve() for p in (
    "/root/svatantrya-workspace/repos",
    "/root/svread", "/root/ipvv", "/root/translation-work", "/root/trika-x",
    "/root/openpatala", "/root/bookfactory", "/root/videofactory", "/root/aoc",
    "/root/sleepdraw", "/root/deitybody", "/root/bruno",
)]
DENY_NAMES = {".env", ".dev.vars", ".npmrc", ".git-credentials", "credentials",
              "id_rsa", "id_ed25519", ".netrc", ".r2-env", ".cf-api-token"}
DENY_SUFFIX = (".pem", ".key", ".p12", ".pfx")
DENY_PARTS = {"node_modules", ".venv", "__pycache__", ".wrangler"}
MAX_READ = 512 * 1024
MAX_WRITE = 512 * 1024
GIT_ACTIONS = {"status", "log", "diff", "add", "commit", "branch", "checkout", "show"}


def resolve(p: str) -> Path:
    path = Path(p).expanduser()
    if not path.is_absolute():
        raise ValueError("path must be absolute")
    real = path.resolve()
    if not any(real == r or r in real.parents for r in ALLOW_ROOTS):
        raise ValueError(f"outside allowed roots: {real}")
    parts = set(real.parts)
    if parts & DENY_PARTS:
        raise ValueError(f"refused path component: {real}")
    if real.name in DENY_NAMES or real.suffix in DENY_SUFFIX:
        raise ValueError(f"refused file name: {real.name}")
    if ".git" in real.parts:
        raise ValueError("refused: use ws_git for repository history")
    return real


def text_of(p: Path) -> str:
    data = p.read_bytes()
    if len(data) > MAX_READ:
        raise ValueError(f"file too large ({len(data)} bytes > {MAX_READ})")
    return data.decode("utf-8", errors="replace")


TOOLS = [
    types.Tool(name="estate_index",
               description="The whole estate in one JSON: repos, Sanskrit data, docs, MCP servers, plugin recipes.",
               inputSchema={"type": "object", "properties": {
                   "section": {"type": "string",
                               "description": "optional: counts|repos|data|docs|mcp_servers|plugin_recipes|rules"}}}),
    types.Tool(name="ws_roots", description="Allowed roots, blocked paths and limits.",
               inputSchema={"type": "object", "properties": {}}),
    types.Tool(name="ws_list", description="List a directory (names, sizes, dirs).",
               inputSchema={"type": "object", "properties": {"path": {"type": "string"}},
                            "required": ["path"]}),
    types.Tool(name="ws_read", description="Read a text file under an allowed root.",
               inputSchema={"type": "object", "properties": {"path": {"type": "string"}},
                            "required": ["path"]}),
    types.Tool(name="ws_write", description="Create or overwrite a text file. Reports bytes written.",
               inputSchema={"type": "object", "properties": {
                   "path": {"type": "string"}, "content": {"type": "string"}},
                   "required": ["path", "content"]}),
    types.Tool(name="ws_patch", description="Replace an exact unique string in a file.",
               inputSchema={"type": "object", "properties": {
                   "path": {"type": "string"}, "old": {"type": "string"},
                   "new": {"type": "string"}}, "required": ["path", "old", "new"]}),
    types.Tool(name="ws_grep", description="Search file contents; bounded to 200 hits.",
               inputSchema={"type": "object", "properties": {
                   "query": {"type": "string"}, "path": {"type": "string"},
                   "glob": {"type": "string"}}, "required": ["query"]}),
    types.Tool(name="ws_git", description="Repository git: status|log|diff|add|commit|branch|checkout|show. Never push.",
               inputSchema={"type": "object", "properties": {
                   "repo": {"type": "string"}, "action": {"type": "string"},
                   "args": {"type": "array", "items": {"type": "string"}}},
                   "required": ["repo", "action"]}),
]

_instructions = (
    "Read and edit the svatantrya estate. Secrets and .git internals are refused; "
    "git push is not available. Prefer ws_patch over ws_write for existing files.")


server = None  # constructed below, after the handlers exist


async def on_list_tools(_ctx, _params):
    return types.ListToolsResult(tools=TOOLS)


async def on_call_tool(_ctx, p):
    name, a = p.name, (p.arguments or {})

    def out(obj):
        return types.CallToolResult(content=[types.TextContent(
            type="text", text=obj if isinstance(obj, str) else json.dumps(obj, ensure_ascii=False, indent=1))])

    try:
        if name == "estate_index":
            idx = json.loads(Path("/root/svread/data/estate-index.json").read_text(encoding="utf-8"))
            sec = a.get("section")
            return out(idx.get(sec) if sec and sec in idx else idx)

        if name == "ws_roots":
            return out({"roots": [str(r) for r in ALLOW_ROOTS],
                        "deny_names": sorted(DENY_NAMES), "deny_suffix": list(DENY_SUFFIX),
                        "max_read": MAX_READ, "max_write": MAX_WRITE,
                        "git": sorted(GIT_ACTIONS), "push": "not available"})

        if name == "ws_list":
            d = resolve(a["path"])
            if not d.is_dir():
                return out({"error": "not a directory"})
            rows = []
            for e in sorted(d.iterdir())[:500]:
                rows.append({"name": e.name, "dir": e.is_dir(),
                             "size": None if e.is_dir() else e.stat().st_size})
            return out({"path": str(d), "entries": rows})

        if name == "ws_read":
            f = resolve(a["path"])
            if not f.is_file():
                return out({"error": "not a file"})
            return out(text_of(f))

        if name == "ws_write":
            f = resolve(a["path"])
            body = a["content"]
            if len(body.encode()) > MAX_WRITE:
                return out({"error": "content too large"})
            f.parent.mkdir(parents=True, exist_ok=True)
            f.write_text(body, encoding="utf-8")
            return out({"path": str(f), "bytes": len(body.encode())})

        if name == "ws_patch":
            f = resolve(a["path"])
            src = f.read_text(encoding="utf-8")
            old, new = a["old"], a["new"]
            n = src.count(old)
            if n == 0:
                return out({"error": "old string not found"})
            if n > 1:
                return out({"error": f"old string is not unique ({n} matches)"})
            f.write_text(src.replace(old, new, 1), encoding="utf-8")
            return out({"path": str(f), "replaced": 1})

        if name == "ws_grep":
            root = resolve(a.get("path") or str(ALLOW_ROOTS[0]))
            pat = re.compile(a["query"])
            glob = a.get("glob") or "*"
            hits = []
            for f in root.rglob(glob):
                if len(hits) >= 200:
                    break
                try:
                    fr = resolve(str(f))
                except ValueError:
                    continue
                if not fr.is_file() or fr.stat().st_size > MAX_READ:
                    continue
                try:
                    for i, line in enumerate(fr.read_text(encoding="utf-8", errors="replace").splitlines(), 1):
                        if pat.search(line):
                            hits.append({"file": str(fr), "line": i, "text": line[:300]})
                            if len(hits) >= 200:
                                break
                except OSError:
                    continue
            return out({"hits": hits, "count": len(hits)})

        if name == "ws_git":
            repo = resolve(a["repo"])
            action = a["action"]
            if action not in GIT_ACTIONS:
                return out({"error": f"action not allowed: {action}"})
            extra = [str(x) for x in (a.get("args") or [])]
            if any(x in ("push", "--force", "-f") for x in extra):
                return out({"error": "push/force is not available here"})
            cmd = ["git", "-C", str(repo), action] + extra
            r = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
            return out({"cmd": " ".join(cmd), "code": r.returncode,
                        "stdout": r.stdout[-20000:], "stderr": r.stderr[-4000:]})

        return types.CallToolResult(is_error=True, content=[types.TextContent(
            type="text", text=f"unknown tool {name}")])
    except Exception as exc:
        return types.CallToolResult(is_error=True, content=[types.TextContent(
            type="text", text=f"{type(exc).__name__}: {exc}"[:500])])


server = Server("svatantrya-workspace", version="1.0.0", instructions=_instructions,
                on_list_tools=on_list_tools, on_call_tool=on_call_tool)


def main() -> int:
    import anyio
    from mcp.server.stdio import stdio_server

    async def run():
        async with stdio_server() as (read, write):
            await server.run(read, write, server.create_initialization_options())
    anyio.run(run)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
