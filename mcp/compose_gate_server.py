#!/usr/bin/env python3
"""compose_gate_server — server-scored generative composition drills.

ChatGPT (or any client) uses this under the hood for both jobs:
  generation  drill() samples fresh enumerated states (never repeats
              served items; HOLD levels excluded until expert-reviewed)
  validation  submit() scores against the server-held key; the model
              never sees answers, only correct/incorrect + feedback
  tracking    per-item mastery per user persists (sqlite outside the repo);
              review() replays weak items first (replay the hard ones)

Free-response scoring is normalized exact match (whitespace/punctuation/
case folded; documented heuristic, server-side). MCQ gates stay stricter.
Single-user v1: user_id defaults to owner; gateway bearer-gates these tools.
"""
from __future__ import annotations
import hashlib
import json
import os
import random
import re
import sqlite3
import sys
import time
import uuid
from pathlib import Path

from fastmcp import FastMCP  # noqa: E402

mcp = FastMCP("compose")

COMPOSE = Path("/root/svread/data/wheels/compose.json")
DB = Path(os.environ.get("COMPOSE_GATE_DB",
                         str(Path.home() / ".local" / "share" / "svatantrya" / "compose-gate.db")))
SESSION_TTL = 3600

_data: dict | None = None


def _load() -> dict:
    global _data
    if _data is None:
        _data = json.loads(COMPOSE.read_text(encoding="utf-8"))
    return _data


def _db() -> sqlite3.Connection:
    DB.parent.mkdir(parents=True, exist_ok=True)
    c = sqlite3.connect(str(DB))
    c.execute("""CREATE TABLE IF NOT EXISTS mastery (
        user_id TEXT NOT NULL, item_id TEXT NOT NULL,
        seen INTEGER NOT NULL DEFAULT 0, right INTEGER NOT NULL DEFAULT 0,
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        PRIMARY KEY (user_id, item_id))""")
    c.execute("""CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY, user_id TEXT NOT NULL, level TEXT NOT NULL,
        items_json TEXT NOT NULL, key_json TEXT NOT NULL,
        used INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL)""")
    return c


def _item_id(row: dict) -> str:
    return f"{row['level']}:{json.dumps(row['selection'], sort_keys=True, ensure_ascii=False)}"


def norm(s: str) -> str:
    s = (s or '').strip().lower()
    s = re.sub(r'[।॥?!.,;:\-—–\(\)\[\]\'\"]', '', s)
    s = re.sub(r'\s+', ' ', s).strip()
    return s


def _prompt_for(row: dict) -> dict:
    """What the learner sees: rings to fill + English meaning + first line role.
    Never the dev/roman answer."""
    first = row['lines'][0]
    return {
        'item_ref': _item_id(row),
        'level': row['level'], 'level_title': row['level_title'],
        'rings': row['rings'],
        'produce': first['en'],
        'hint_role': first.get('role', 'Sanskrit'),
        'note': row.get('note', ''),
    }


def _weight(seen: int, right: int) -> float:
    if seen == 0:
        return 3.0  # unseen first
    acc = right / max(1, seen)
    return 2.5 * (1.0 - acc) + 0.2  # weak items replay first


@mcp.tool()
def drill(level: str = "1.1", user_id: str = "owner", n: int = 5) -> dict:
    """Deal n fresh drill items for a level (default 1.1). Excludes HOLD
    levels and already-mastered items; weights weak items first. Returns
    prompts only — answers stay server-side. Use session_id to submit."""
    d = _load()
    rows = [r for r in d['rows'] if r['level'] == level and r['review'] != 'HOLD']
    if not rows:
        held = sorted({r['level'] for r in d['rows'] if r['level'] == level})
        return {"status": "BLOCKED",
                "error": f"level {level} has no servable items (HOLD: expert review pending)"
                if held else f"unknown level {level}"}
    c = _db()
    try:
        mast = {r[0]: (r[1], r[2]) for r in c.execute(
            "SELECT item_id, seen, right FROM mastery WHERE user_id = ?", (user_id,))}
    finally:
        c.close()
    weighted = []
    for r in rows:
        seen, right = mast.get(_item_id(r), (0, 0))
        if seen > 0 and right >= 2:
            continue  # mastered twice: retire
        weighted.append((_weight(seen, right), r))
    if not weighted:
        return {"status": "COMPLETE", "level": level,
                "message": "every item mastered twice — level complete"}
    rng = random.Random(f"{user_id}:{level}:{int(time.time() // 3600)}")
    picked, pool = [], [r for _, r in weighted]
    weights = [w for w, _ in weighted]
    for _ in range(min(max(1, int(n)), len(pool))):
        total = sum(weights)
        x = rng.random() * total
        for i, w in enumerate(weights):
            x -= w
            if x <= 0:
                picked.append(pool.pop(i))
                weights.pop(i)
                break
    key = {_item_id(r): {'dev': r['lines'][0]['dev'],
                         'roman': r['lines'][0]['roman']} for r in picked}
    sid = uuid.uuid4().hex
    c = _db()
    try:
        c.execute("INSERT INTO sessions (id, user_id, level, items_json, key_json, created_at)"
                  " VALUES (?,?,?,?,?,?)",
                  (sid, user_id, level,
                   json.dumps([_item_id(r) for r in picked], ensure_ascii=False),
                   json.dumps(key, ensure_ascii=False), int(time.time())))
        c.commit()
    finally:
        c.close()
    return {"session_id": sid, "level": level,
            "items": [_prompt_for(r) for r in picked],
            "rule": "produce the Sanskrit; submit with submit(); answers are server-held"}


@mcp.tool()
def submit(session_id: str = "", answers: list | None = None,
           user_id: str = "owner") -> dict:
    """Score a drill session. answers: [{item_ref, text}]. Normalized exact
    match against dev or roman; identical retry returns the same receipt."""
    c = _db()
    try:
        row = c.execute("SELECT user_id, level, items_json, key_json, used"
                        " FROM sessions WHERE id = ?", (session_id,)).fetchone()
        if not row:
            return {"error": "unknown session — call drill() first"}
        if row[0] != user_id:
            return {"error": "session belongs to another learner"}
        if row[4]:
            return {"error": "session already submitted — drill again for fresh items"}
        key = json.loads(row[3])
        given = {(a.get('item_ref') if isinstance(a, dict) else None):
                 (a.get('text', '') if isinstance(a, dict) else '')
                 for a in (answers or [])}
        detail, correct = [], 0
        for ref in json.loads(row[2]):
            k = key.get(ref, {})
            ok = norm(given.get(ref, '')) in {norm(k.get('dev', '')), norm(k.get('roman', ''))} \
                and norm(given.get(ref, '')) != ''
            if ok:
                correct += 1
            detail.append({"item_ref": ref, "ok": ok,
                           "expected_roman": k.get('roman', '') if not ok else None})
        passed = correct == len(json.loads(row[2])) and len(json.loads(row[2])) > 0
        for d_ in detail:
            c.execute("INSERT INTO mastery (user_id, item_id, seen, right)"
                      " VALUES (?,?,1,?) ON CONFLICT(user_id, item_id) DO UPDATE SET"
                      " seen = seen + 1, right = right + ?, updated_at = datetime('now')",
                      (user_id, d_['item_ref'], 1 if d_['ok'] else 0, 1 if d_['ok'] else 0))
        c.execute("UPDATE sessions SET used = 1 WHERE id = ?", (session_id,))
        c.commit()
    finally:
        c.close()
    return {"score": correct, "total": len(detail), "passed": passed,
            "detail": detail,
            "next": "review() replays weak items; drill() deals fresh ones"}


@mcp.tool()
def review(user_id: str = "owner", n: int = 5) -> dict:
    """Replay the hard ones: lowest-accuracy seen items first, HOLD excluded.
    Returns prompts (no answers). Submit via a drill session."""
    d = _load()
    by_id = {_item_id(r): r for r in d['rows'] if r['review'] != 'HOLD'}
    c = _db()
    try:
        rows = c.execute("SELECT item_id, seen, right FROM mastery WHERE user_id = ? AND seen > 0",
                         (user_id,)).fetchall()
    finally:
        c.close()
    scored = sorted(((r / max(1, s), s, i) for i, s, r in rows if i in by_id))
    picks = [by_id[i] for _, _, i in scored[:max(1, int(n))]]
    if not picks:
        return {"status": "COMPLETE", "message": "nothing weak yet — drill() first"}
    return {"items": [_prompt_for(r) for r in picks],
            "rule": "weakest first; call drill() for a scored session on these"}


@mcp.tool()
def progress(user_id: str = "owner") -> dict:
    """Mastery summary: seen/right per level. Server-side truth."""
    d = _load()
    lvl_of = {_item_id(r): r['level'] for r in d['rows']}
    c = _db()
    try:
        rows = c.execute("SELECT item_id, seen, right FROM mastery WHERE user_id = ?",
                         (user_id,)).fetchall()
    finally:
        c.close()
    agg: dict = {}
    for i, s, r in rows:
        lv = lvl_of.get(i, '?')
        a = agg.setdefault(lv, {'seen_items': 0, 'right_total': 0, 'seen_total': 0})
        a['seen_items'] += 1
        a['seen_total'] += s
        a['right_total'] += r
    return {"user_id": user_id, "levels": agg,
            "note": "an item retires after 2 correct; review() replays the rest"}


if __name__ == "__main__":
    if "--list" in sys.argv or "--help" in sys.argv:
        print("compose gate — drill, submit, review, progress (server-scored)")
    else:
        mcp.run(transport="stdio")
