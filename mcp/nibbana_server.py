#!/usr/bin/env python3
"""nibbana_server — private relay + teacher decode review (owner-only bearer).

Relay matches and relays with provenance; it never generates advice.
Corrections save to the owner's local journal only — never committed,
never published. Diarist's words vs generated text are never mixed
(VOICE RULE); every relayed item carries kind + source.
"""
from __future__ import annotations
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from fastmcp import FastMCP  # noqa: E402

sys.path.insert(0, "/root/nibbanahelp/tools")
from tension import load, similar, tension_text  # noqa: E402
from teacher_stage0 import TeacherStore, Conflict  # noqa: E402
from ai import embed_batch  # noqa: E402

mcp = FastMCP("nibbana")


def _item_view(item: dict, score: float) -> dict:
    return {"id": item.get("id"), "kind": item.get("kind"),
            "label": item.get("label"), "url": item.get("url"),
            "themes": (item.get("themes") or [])[:5],
            "score": round(score, 3),
            "excerpt": (item.get("text") or "")[:400]}


@mcp.tool()
def relay_match(text: str = "", tension_id: str = "", k: int = 5) -> dict:
    """Match a situation against lived logs, lineage, and own past: embed the
    query, cosine top-k with own-tension anchor boost, relevance floor 0.28.
    Returns relays with kind+source, never advice. One field required."""
    try:
        items, mat = load()
        if tension_id:
            qtext, skip = tension_text(tension_id), f"tension:{tension_id}"
        elif text:
            qtext, skip = text, None
        else:
            return {"error": "pass text or tension_id"}
        qvec = embed_batch([qtext[:2000]])[0]
        hits = similar(qvec, items, mat, k=max(1, min(int(k), 10)), skip_id=skip)
        return {"matches": [_item_view(it, s) for it, s in hits],
                "rule": "relay with provenance only; never advice"}
    except Exception as e:
        return {"status": "BLOCKED", "error": f"{type(e).__name__}: {e}"[:300]}


@mcp.tool()
def relay_tension(tension_id: str = "") -> dict:
    """Full text of one own tension file (body after the header block)."""
    try:
        return {"tension_id": tension_id, "text": tension_text(tension_id)}
    except Exception as e:
        return {"status": "BLOCKED", "error": f"{type(e).__name__}: {e}"[:300]}


@mcp.tool()
def teacher_decodes(day: int = 1) -> dict:
    """One day of machine-proposed decode rows with questions, corrections to
    date, and hashes. Labels are proposals, never assertions about a person."""
    try:
        return TeacherStore().day(int(day))
    except Exception as e:
        return {"status": "BLOCKED", "error": f"{type(e).__name__}: {e}"[:300]}


@mcp.tool()
def teacher_submit_correction(day: int = 0, moment: int = 0, field: str = "",
                              value: str = "", expected_revision: str | None = None,
                              source_row_sha256: str = "", note: str = "") -> dict:
    """Save a decode correction to the owner's local journal (owner-readable,
    hash-chained, never committed or published). Reload decodes first and pass
    the shown expected_revision + source_row_sha256."""
    try:
        req = {"day": int(day), "moment": int(moment), "field": field,
               "value": value, "expected_revision": expected_revision,
               "source_row_sha256": source_row_sha256, "note": note}
        return TeacherStore().revise(req)
    except Conflict as e:
        return {"status": "CONFLICT", "error": str(e)[:300]}
    except Exception as e:
        return {"status": "BLOCKED", "error": f"{type(e).__name__}: {e}"[:300]}


if __name__ == "__main__":
    if "--list" in sys.argv or "--help" in sys.argv:
        print("nibbana MCP — relay_match, relay_tension, teacher_decodes, teacher_submit_correction (private)")
    else:
        mcp.run(transport="stdio")
