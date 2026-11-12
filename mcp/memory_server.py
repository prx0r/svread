#!/usr/bin/env python3
"""memory_server — thin MCP wrapper over the tutor-memory internal service.

The backend (services/tutor-memory) holds persistent learner state; this
server is its only caller. Auth: the gateway bearer-gates these tools;
this wrapper attaches the internal service token + the gateway-resolved
learner id (env SVAT_TUTOR_LEARNER, owner v1). Never forwards client identity.
"""
from __future__ import annotations
import json
import os
import sys
import urllib.request
from pathlib import Path

from fastmcp import FastMCP  # noqa: E402

mcp = FastMCP("memory")

BASE = os.environ.get("SVAT_TUTOR_BASE", "http://127.0.0.1:8931")


def _headers() -> dict:
    tok = os.environ.get("SVAT_TUTOR_INTERNAL_TOKEN", "")
    uid = os.environ.get("SVAT_TUTOR_LEARNER", "owner")
    return {"Content-Type": "application/json",
            "X-Internal-Service-Token": tok,
            "X-Authenticated-User-Id": uid}


def _call(method: str, path: str, payload: dict | None = None) -> dict:
    data = json.dumps(payload or {}).encode()
    req = urllib.request.Request(BASE + path, data=data, method=method,
                                 headers=_headers())
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.loads(r.read().decode() or "{}")
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
def context() -> dict:
    """Compact learner context: preferences, focus, skills due. Read-only."""
    return _call("GET", "/v1/context")


@mcp.tool()
def recommend() -> dict:
    """Deterministic next-lesson recommendation with the why. preferred focus
    first, due review next, earliest prerequisite-ready lesson."""
    return _call("GET", "/v1/recommendation")


@mcp.tool()
def record_attempt(client_event_id: str = "", skill_id: str = "",
                   wheel_id: str = "", level_id: str = "", pack_id: str = "",
                   combination_id: str = "", rating: str = "good",
                   evidence: str = "model_feedback",
                   error_tags: list | None = None) -> dict:
    """Record one practice attempt. Idempotent per client_event_id (retries
    never double-count). rating: again|hard|good|easy. evidence must say how
    correctness was established (exact_match is verified; model_feedback is not)."""
    return _call("POST", "/v1/attempts",
                 {"client_event_id": client_event_id, "skill_id": skill_id,
                  "wheel_id": wheel_id, "level_id": level_id, "pack_id": pack_id,
                  "combination_id": combination_id, "rating": rating,
                  "evidence": evidence, "error_tags": error_tags or []})


@mcp.tool()
def set_preference(key: str = "", value: str = "") -> dict:
    """Save an explicit teaching preference (e.g. script_reveal, pacing).
    Only for learner-stated rules; inferences go through propose() instead."""
    return _call("PUT", f"/v1/preferences/{key}", {"value": value})


@mcp.tool()
def propose(kind: str = "", payload: dict | None = None,
         rationale: str = "") -> dict:
    """Propose a preference or pack-fact change for learner review. Never
    persists silently — the learner must decide() it."""
    return _call("POST", "/v1/proposals",
                 {"kind": kind, "payload": payload or {}, "rationale": rationale})


@mcp.tool()
def decide_proposal(proposal_id: str = "", approve: bool = False) -> dict:
    """Approve or reject a proposed change."""
    return _call("POST", f"/v1/proposals/{proposal_id}/decision",
                 {"approve": bool(approve)})


@mcp.tool()
def set_focus(wheel_id: str = "", level_id: str = "", pack_id: str = "") -> dict:
    """Set today's focus. Learner request only."""
    return _call("POST", "/v1/focus",
                 {"wheel_id": wheel_id, "level_id": level_id, "pack_id": pack_id})


@mcp.tool()
def export_data() -> dict:
    """Export the learner's tutor data (scoped to this learner)."""
    return _call("GET", "/v1/export")


if __name__ == "__main__":
    if "--list" in sys.argv or "--help" in sys.argv:
        print("memory MCP — context, recommend, record_attempt, set_preference, "
              "propose, decide_proposal, set_focus, export_data")
    else:
        mcp.run(transport="stdio")
