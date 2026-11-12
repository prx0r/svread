#!/usr/bin/env python3
"""progress_server — server-scored wheel gates via the ipvv worker.

The worker holds the key, samples items, scores, and writes unlocks; the model
never self-reports. Requires the owner's worker session (SVATANTRYA_SESSION env,
from site sign-in) — without it tools answer BLOCKED, never fake scores.
Reads/writes here are per-user; the gateway must bearer-gate these tools.
"""
from __future__ import annotations
import json
import os
import sys
import urllib.request
from pathlib import Path

from fastmcp import FastMCP

mcp = FastMCP("progress")

BASE = os.environ.get("PROGRESS_BASE", "https://svatantrya.net")


def _session() -> str:
    return os.environ.get("SVATANTRYA_SESSION", "").strip()


def _call(method: str, path: str, payload: dict | None = None) -> dict:
    tok = _session()
    if not tok:
        return {"status": "BLOCKED",
                "error": "owner worker session not configured (SVATANTRYA_SESSION); "
                         "sign in on the site and set it — scores are server-side only"}
    data = json.dumps(payload or {}).encode() if payload is not None else None
    req = urllib.request.Request(
        BASE + path, data=data,
        method=method,
        headers={"Content-Type": "application/json",
                 "Authorization": "Bearer " + tok},
    )
    try:
        with urllib.request.urlopen(req, timeout=40) as r:
            return json.loads(r.read().decode())
    except Exception as e:
        body = ""
        try:
            body = e.read().decode()[:300]  # type: ignore[union-attr]
        except Exception:
            body = str(e)[:300]
        try:
            return json.loads(body) if body else {"error": str(e)[:200]}
        except Exception:
            return {"error": (body or str(e))[:300]}


@mcp.tool()
def gate_start(curriculum: str = "word", stage: int = 1) -> dict:
    """Start a server-scored gate: the worker samples items, shuffles options,
    holds the key. curriculum is word|sentence. Use at most 3 starts/hour —
    the worker rate-limits. Returns session_id + items (no answers)."""
    if curriculum not in ("word", "sentence"):
        return {"error": "curriculum must be word|sentence"}
    return _call("POST", "/api/wheel/gate/start",
                 {"curriculum": curriculum, "stage": int(stage)})


@mcp.tool()
def gate_submit(session_id: str = "", answers: list | None = None) -> dict:
    """Submit gate answers [{item_id, choice}]. The worker scores, writes the
    receipt + unlock atomically. Identical retry returns the same receipt."""
    return _call("POST", "/api/wheel/gate/submit",
                 {"session_id": session_id, "answers": answers or []})


@mcp.tool()
def progress() -> dict:
    """Own scored progress per curriculum (stage, passed). Server-side truth;
    local practice scores are unverified by definition."""
    return _call("GET", "/api/wheel/progress")


if __name__ == "__main__":
    if "--list" in sys.argv or "--help" in sys.argv:
        print("progress MCP — gate_start, gate_submit, progress (worker-backed, needs session)")
    else:
        mcp.run(transport="stdio")
