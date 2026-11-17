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


def _annotate(entry: dict, counts: dict) -> dict:
    """Never return a silent empty list. A missing association is a stated gap."""
    if entry is None:
        return entry
    out = dict(entry)
    if not out.get("essays"):
        out["essays"] = []
        out["essays_note"] = (
            "no essay bound to this passage — a gap, not a denial "
            f"(corpus essayless: {counts.get('essayless', 'unknown')})")
    if out.get("formal_reference") is False:
        out["formal_note"] = (
            "no registry theorem references this passage "
            f"(corpus no_formal_reference: {counts.get('no_formal_reference', 'unknown')})")
    return out


@mcp.tool()
def chain(work: str, locator: str = "") -> dict:
    """Full treeka chain for one work (or one work:locator): passages, argued
    nodes, cruxes, formal refs, essays, bridge state. Use when tracing what
    exists for a work and what is missing. Empty essays/formal refs are
    annotated as gaps, never returned as silent empties."""
    d = _load()
    works = d.get("works", {})
    counts = d.get("counts", {})
    if locator:
        key = f"{work}:{locator}"
        entry = works.get(key)
        return {"key": key, "entry": _annotate(entry, counts),
                "note": "null entry means no treeka row, never that the tradition lacks it"}
    rows = {k: _annotate(v, counts) for k, v in works.items()
            if k.split(":")[0] == work}
    return {"work": work, "rows": len(rows), "entries": rows,
            "counts": counts}


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
