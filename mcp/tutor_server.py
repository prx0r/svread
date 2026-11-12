#!/usr/bin/env python3
"""tutor_server — objective-driven Sanskrit sessions (sanskrithelp tutor).

Wraps tutor/conductor + navigator read-only-safe: brief/arc/start read specs;
submit assesses (grammar deterministic; conceptual falls back to heuristics
without CHUTES key) and updates the learner profile. Single-user v1: user_id
defaults to owner; the gateway bearer-gates this host.
"""
from __future__ import annotations
import sys

sys.path.insert(0, "/root/sanskrithelp")

from fastmcp import FastMCP  # noqa: E402

from tutor.conductor import start_session, submit_session  # noqa: E402
from tutor.navigator import get_daily_brief, generate_weekly_arc  # noqa: E402
from tutor.profile import load_tutor_profile  # noqa: E402

mcp = FastMCP("tutor")


@mcp.tool()
def daily_brief(user_id: str = "owner") -> dict:
    """Today's plan from the weekly arc: slot, zone, level. Start here each day."""
    try:
        return get_daily_brief(user_id)
    except Exception as e:
        return {"error": f"{type(e).__name__}: {e}"[:300]}


@mcp.tool()
def weekly_arc(user_id: str = "owner") -> dict:
    """Weekly goals across zones. Regenerates when stale."""
    try:
        return generate_weekly_arc(load_tutor_profile(user_id))
    except Exception as e:
        return {"error": f"{type(e).__name__}: {e}"[:300]}


@mcp.tool()
def session_start(zone_id: str = "", level: int = 1, user_id: str = "owner") -> dict:
    """Start a session: objectives, first prompt, max 15 min. 3 failed attempts
    in a zone level route to remedial prerequisites."""
    try:
        return start_session(user_id, zone_id, int(level))
    except Exception as e:
        return {"error": f"{type(e).__name__}: {e}"[:300]}


@mcp.tool()
def session_submit(zone_id: str = "", level: int = 1, user_input: str = "",
                   user_id: str = "owner") -> dict:
    """Submit a session response. Assesses pass/fail with feedback; profile
    advances on pass. Conceptual zones use heuristics without a model key."""
    try:
        return submit_session(user_id, zone_id, int(level), user_input)
    except Exception as e:
        return {"error": f"{type(e).__name__}: {e}"[:300]}


@mcp.tool()
def profile(user_id: str = "owner") -> dict:
    """Learner profile: zone levels, retry counts, weekly arc state."""
    try:
        p = load_tutor_profile(user_id)
        return {"user_id": p.user_id, "zone_levels": p.zone_levels,
                "retry_counts": p.retry_counts if hasattr(p, "retry_counts") else {},
                "weekly_arc": getattr(p, "weekly_arc", None)}
    except Exception as e:
        return {"error": f"{type(e).__name__}: {e}"[:300]}


if __name__ == "__main__":
    if "--list" in sys.argv or "--help" in sys.argv:
        print("tutor MCP — daily_brief, weekly_arc, session_start, session_submit, profile")
    else:
        mcp.run(transport="stdio")
