#!/usr/bin/env python3
"""treeka_server — read-only treeka assembly over formal-trika/data/treeka.json.

Joins, never invents. Entries keyed work:locator. A missing association is
missing data, never a claim. Status: public reads.
"""
from __future__ import annotations
import json
import sys
from pathlib import Path

from fastmcp import FastMCP

mcp = FastMCP("treeka")

TREKA = Path("/root/trika-x/formal-trika/data/treeka.json")

_cache: dict = {}


def _load() -> dict:
    if "data" not in _cache:
        _cache["data"] = json.loads(TREKA.read_text(encoding="utf-8"))
    return _cache["data"]


@mcp.tool()
def chain(work: str, locator: str = "") -> dict:
    """Full treeka chain for one work (or one work:locator): passages, argued
    nodes, cruxes, formal refs, essays, bridge state. Use when tracing what
    exists for a work and what is missing."""
    d = _load()
    works = d.get("works", {})
    if locator:
        key = f"{work}:{locator}"
        entry = works.get(key)
        return {"key": key, "entry": entry,
                "note": "null entry means no treeka row, never that the tradition lacks it"}
    rows = {k: v for k, v in works.items() if k.split(":")[0] == work}
    return {"work": work, "rows": len(rows), "entries": rows,
            "counts": d.get("counts", {})}


@mcp.tool()
def frontier(kind: str = "cruxless", work: str = "", limit: int = 20) -> dict:
    """Gap report driving the crux queue. kind is unargued|cruxless|essayless|
    no_formal_reference. Optionally filtered to one work. Use to find what
    needs arguing, cruxing, or essaying next."""
    d = _load()
    gaps = d.get("gaps", {})
    if kind not in gaps:
        return {"error": f"unknown kind {kind!r}",
                "kinds": sorted(gaps.keys())}
    items = gaps[kind]
    if work:
        items = [k for k in items if k.split(":")[0] == work]
    return {"kind": kind, "total": len(gaps[kind]), "returned": min(limit, len(items)),
            "keys": items[:max(0, limit)],
            "counts": d.get("counts", {})}


if __name__ == "__main__":
    if "--list" in sys.argv or "--help" in sys.argv:
        print("treeka MCP — chain, frontier (reads treeka.json, read-only)")
    else:
        mcp.run(transport="stdio")
