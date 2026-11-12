#!/usr/bin/env python3
"""compose_gate_server — deterministic server-scored composition drills.

ChatGPT uses this under the hood for both jobs:
  generation  drill() samples enumerated states from a SEEDED rng; the same
              (user_id, level, seed) always deals the same items (replayable)
  validation  submit() scores against the server-held key; the model never
              sees answers, only ok/not + the expected roman on a miss
  tracking    per-item mastery per user persists (sqlite outside the repo);
              review() replays weak items first

Determinism at runtime:
  - items are drawn only from the enumerated dataset (no model invention)
  - seed defaults to hour-bucket hash(user_id+level) so retries in the same
    hour replay identically; pass an explicit seed to pin a session forever
  - every session carries a receipt = sha256(level, seed, items, key)
  - submit is idempotent: an identical retry returns the same receipt
  - HOLD levels never deal

Read-only helpers (levels, show) are safe to expose publicly; drill/submit/
review/progress are per-user and must be bearer-gated.
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
        seed INTEGER NOT NULL, receipt TEXT NOT NULL,
        items_json TEXT NOT NULL, key_json TEXT NOT NULL,
        result_json TEXT, answers_json TEXT,
        used INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL)""")
    # migrate pre-receipt sessions tables (added seed/receipt/result/answers)
    have = {r[1] for r in c.execute("PRAGMA table_info(sessions)")}
    for col, decl in (('seed', 'INTEGER NOT NULL DEFAULT 0'),
                      ('receipt', 'TEXT NOT NULL DEFAULT \'\''),
                      ('result_json', 'TEXT'), ('answers_json', 'TEXT')):
        if col not in have:
            c.execute(f'ALTER TABLE sessions ADD COLUMN {col} {decl}')
    return c


def _item_id(row: dict) -> str:
    return f"{row['level']}:{json.dumps(row['selection'], sort_keys=True, ensure_ascii=False)}"


def norm(s: str) -> str:
    s = (s or '').strip().lower()
    s = re.sub(r'[।॥?!.,;:\-—–\(\)\[\]\'\"]', '', s)
    s = re.sub(r'\s+', ' ', s).strip()
    return s


def _tokens(t: str) -> set:
    return set(re.findall(r"[a-z\u0101\u012b\u016b\u1e5b\u1e5d\u1e37\u1e39\u1e43\u1e25\u00f1\u1e45\u015b\u1e63\u1e6d\u1e0d\u1e47]+", (t or '').lower()))


def _rows_for(level: str) -> list:
    return [r for r in _load()['rows'] if r['level'] == level and r['review'] != 'HOLD']


def _nearest(level: str, utterance: str):
    ut = _tokens(utterance)
    best = (-1.0, None)
    for r in _rows_for(level):
        rt = _tokens(r['lines'][0]['roman'])
        jac = len(ut & rt) / max(1, len(ut | rt))
        if jac > best[0]:
            best = (jac, r)
    return best[1], best[0]


def _ring_diff(target: dict, other: dict) -> list:
    """Which rings differ between two states of the same level."""
    out = []
    t = target.get('selection', {})
    o = other.get('selection', {})
    for k in t:
        if t.get(k) != o.get(k):
            out.append(k)
    return out


def _seed_for(user_id: str, level: str, seed: int | None) -> int:
    if seed is not None:
        return int(seed)
    hour = int(time.time() // 3600)
    h = hashlib.sha256(f"{user_id}:{level}:{hour}".encode()).hexdigest()[:12]
    return int(h, 16)


def _receipt(level: str, seed: int, item_ids: list, key: dict) -> str:
    payload = json.dumps({'level': level, 'seed': seed, 'items': item_ids,
                          'key': key}, sort_keys=True, ensure_ascii=False)
    return hashlib.sha256(payload.encode()).hexdigest()


def _prompt_for(row: dict) -> dict:
    first = row['lines'][0]
    return {'item_ref': _item_id(row), 'level': row['level'],
            'level_title': row['level_title'], 'rings': row['rings'],
            'produce': first['en'], 'hint_role': first.get('role', 'Sanskrit'),
            'note': row.get('note', '')}


def _weight(seen: int, right: int) -> float:
    if seen == 0:
        return 3.0
    return 2.5 * (1.0 - right / max(1, seen)) + 0.2


# ---------------------------------------------------------------- read-only

@mcp.tool()
def levels() -> dict:
    """List every composition level with its size and review status. Safe to
    call publicly. HOLD levels are not servable until expert review."""
    d = _load()
    return {'format': d['format'], 'levels': d['levels'], 'counts': d['counts'],
            'note': 'HOLD levels are excluded from drill() until expert review.'}


@mcp.tool()
def curriculum() -> dict:
    """The recommended 1-60 study order (family IDs are not the study order),
    with prerequisites and neighbour wheels. Read-only; drives daily focus."""
    d = _load()
    return {'format': 'svatantrya.study-order/1',
            'counts': d['counts'],
            'study_order': d['curriculum']['study_order'],
            'note': 'family number is a stable content ID, not the study order'}


@mcp.tool()
def next_level(level: str = "", done: list | None = None) -> dict:
    """Recommend the next study-order level. Pass the level you just finished
    (its next-in-family if ready) or omit to get the first not in `done`.
    Read-only; never hard-locks exploration."""
    d = _load()
    order = d['curriculum']['study_order']
    done = set(done or [])
    if level:
        fam = level.split('.')[0]
        sibs = [o for o in order if o['id'].split('.')[0] == fam]
        sibs.sort(key=lambda o: int(o['id'].split('.')[1]))
        for i, o in enumerate(sibs):
            if o['id'] == level and i + 1 < len(sibs):
                nxt = sibs[i + 1]
                return {'from': level, 'next': nxt['id'], 'title': nxt['title'],
                        'focus': nxt['focus'], 'prerequisites': nxt['prerequisites'],
                        'neighbors': nxt['neighbor_wheels'], 'why': 'next in family'}
    for o in order:
        if o['id'] not in done:
            return {'next': o['id'], 'title': o['title'], 'focus': o['focus'],
                    'rank': o['rank'], 'prerequisites': o['prerequisites'],
                    'neighbors': o['neighbor_wheels'], 'why': 'earliest not done'}
    return {'status': 'COMPLETE', 'message': 'all 60 levels seen — review due'}


@mcp.tool()
def neighbors(level: str = "") -> dict:
    """Related wheels to detour to when a construction is hard. Does not
    change the day's focus."""
    d = _load()
    for o in d['curriculum']['study_order']:
        if o['id'] == level:
            return {'level': level, 'neighbors': o['neighbor_wheels']}
    return {'error': f'unknown level {level}'}


@mcp.tool()
def show(level: str = "1.1", index: int = 0) -> dict:
    """Show one fully-rendered example state of a level (Devanagari + IAST +
    English). A teaching example, not a gate item. Read-only."""
    d = _load()
    rows = [r for r in d['rows'] if r['level'] == level]
    if not rows:
        return {'error': f'unknown level {level}'}
    r = rows[max(0, min(int(index), len(rows) - 1))]
    return {'level': level, 'level_title': r['level_title'],
            'selection': r['selection'],
            'lines': r['lines'], 'note': r.get('note', ''),
            'status': r['status'], 'review': r['review']}


# ---------------------------------------------------------------- per-user

@mcp.tool()
def drill(level: str = "1.1", user_id: str = "owner", n: int = 5,
          seed: int | None = None) -> dict:
    """Deal n fresh drill items for a level. Deterministic: the same
    (user_id, level, seed) deals the same items; seed defaults to an hourly
    bucket so retries replay. Excludes HOLD levels and mastered items; weights
    weak items first. Returns prompts only — answers stay server-side."""
    d = _load()
    rows = [r for r in d['rows'] if r['level'] == level and r['review'] != 'HOLD']
    if not rows:
        return {"status": "BLOCKED",
                "error": f"level {level} has no servable items (HOLD: expert review pending)"}
    sd = _seed_for(user_id, level, seed)
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
            continue
        weighted.append((_weight(seen, right), r))
    if not weighted:
        return {"status": "COMPLETE", "level": level,
                "message": "every item mastered twice — level complete"}
    rng = random.Random(sd)
    pool = [r for _, r in weighted]
    weights = [w for w, _ in weighted]
    picked = []
    for _ in range(min(max(1, int(n)), len(pool))):
        total = sum(weights)
        x = rng.random() * total
        for i, w in enumerate(weights):
            x -= w
            if x <= 0:
                picked.append(pool.pop(i))
                weights.pop(i)
                break
    item_ids = [_item_id(r) for r in picked]
    key = {_item_id(r): {'dev': r['lines'][0]['dev'], 'roman': r['lines'][0]['roman']}
           for r in picked}
    receipt = _receipt(level, sd, item_ids, key)
    sid = uuid.uuid4().hex
    c = _db()
    try:
        c.execute("INSERT INTO sessions (id,user_id,level,seed,receipt,items_json,"
                  "key_json,created_at) VALUES (?,?,?,?,?,?,?,?)",
                  (sid, user_id, level, sd, receipt, json.dumps(item_ids, ensure_ascii=False),
                   json.dumps(key, ensure_ascii=False), int(time.time())))
        c.commit()
    finally:
        c.close()
    return {"session_id": sid, "level": level, "seed": sd, "receipt": receipt,
            "items": [_prompt_for(r) for r in picked],
            "rule": "produce the Sanskrit; submit with submit(); answers are server-held"}


@mcp.tool()
def submit(session_id: str = "", answers: list | None = None,
           user_id: str = "owner") -> dict:
    """Score a drill session. answers: [{item_ref, text}]. Normalized exact
    match against dev or roman. Idempotent: an identical retry returns the
    same receipt."""
    c = _db()
    try:
        row = c.execute("SELECT user_id,level,receipt,items_json,key_json,used,"
                        "result_json FROM sessions WHERE id = ?", (session_id,)).fetchone()
        if not row:
            return {"error": "unknown session — call drill() first"}
        uid, level, receipt, items_json, key_json, used, result_json = row
        if uid != user_id:
            return {"error": "session belongs to another learner"}
        item_ids = json.loads(items_json)
        given = {(a.get('item_ref') if isinstance(a, dict) else None):
                 (a.get('text', '') if isinstance(a, dict) else '')
                 for a in (answers or [])}
        canon = json.dumps([{k: given.get(k, '')} for k in item_ids],
                           sort_keys=True, ensure_ascii=False)
        if used:
            if result_json and json.loads(result_json).get('_answers') == canon:
                out = json.loads(result_json)
                out.pop('_answers', None)
                out['replayed'] = True
                return out
            return {'error': 'session already submitted with different answers', 'receipt': receipt}
        key = json.loads(key_json)
        detail, correct = [], 0
        for ref in item_ids:
            k = key.get(ref, {})
            g = norm(given.get(ref, ''))
            ok = bool(g) and g in {norm(k.get('dev', '')), norm(k.get('roman', ''))}
            if ok:
                correct += 1
            detail.append({'item_ref': ref, 'ok': ok,
                           'expected_roman': None if ok else k.get('roman', '')})
        passed = correct == len(item_ids) and item_ids
        for d_ in detail:
            c.execute("INSERT INTO mastery (user_id,item_id,seen,right) VALUES (?,?,1,?) "
                      "ON CONFLICT(user_id,item_id) DO UPDATE SET seen=seen+1, "
                      "right=right+?, updated_at=datetime('now')",
                      (user_id, d_['item_ref'], 1 if d_['ok'] else 0, 1 if d_['ok'] else 0))
        result = {'receipt': receipt, 'score': correct, 'total': len(item_ids),
                  'passed': passed, 'detail': detail,
                  'next': 'review() replays weak items; drill() deals fresh ones',
                  '_answers': canon}
        c.execute("UPDATE sessions SET used=1, result_json=?, answers_json=? WHERE id=?",
                  (json.dumps(result, ensure_ascii=False), canon, session_id))
        c.commit()
    finally:
        c.close()
    result.pop('_answers', None)
    return result


@mcp.tool()
def review(user_id: str = "owner", n: int = 5) -> dict:
    """Replay the hard ones: lowest-accuracy seen items first, HOLD excluded.
    Returns prompts (no answers). Start a scored session with drill()."""
    d = _load()
    by_id = {_item_id(r): r for r in d['rows'] if r['review'] != 'HOLD'}
    c = _db()
    try:
        rows = c.execute("SELECT item_id,seen,right FROM mastery WHERE user_id=? AND seen>0",
                         (user_id,)).fetchall()
    finally:
        c.close()
    scored = sorted((r / max(1, s), s, i) for i, s, r in rows if i in by_id)
    picks = [by_id[i] for _, _, i in scored[:max(1, int(n))]]
    if not picks:
        return {'status': 'COMPLETE', 'message': 'nothing weak yet — drill() first'}
    return {'items': [_prompt_for(r) for r in picks],
            'rule': 'weakest first; call drill() for a scored session on these'}


@mcp.tool()
def progress(user_id: str = "owner") -> dict:
    """Mastery summary: seen/right per level. Server-side truth."""
    d = _load()
    lvl_of = {_item_id(r): r['level'] for r in d['rows']}
    c = _db()
    try:
        rows = c.execute("SELECT item_id,seen,right FROM mastery WHERE user_id=?",
                         (user_id,)).fetchall()
    finally:
        c.close()
    agg: dict = {}
    for i, s, r in rows:
        a = agg.setdefault(lvl_of.get(i, '?'), {'seen_items': 0, 'right_total': 0, 'seen_total': 0})
        a['seen_items'] += 1
        a['seen_total'] += s
        a['right_total'] += r
    return {'user_id': user_id, 'levels': agg,
            'note': 'an item retires after 2 correct; review() replays the rest'}


# ------------------------------------------------------------------ session
# Voice/role-play loop: start -> check (per utterance) -> end. Uses the same
# deterministic deal and server-held key as drill/submit; adds fuzzy matching
# so a spoken attempt can be located in the level lattice.

@mcp.tool()
def session_start(level: str = "", user_id: str = "owner", n: int = 3,
                  seed: int | None = None) -> dict:
    """Start a warm-up session. If level is empty, uses the study-order next
    level. Deals n items and returns a teacher brief (target rings, English
    prompts, Sanskrit-first policy). Deterministic per (user, level, seed)."""
    if not level:
        order = _load()['curriculum']['study_order']
        level = order[0]['id']
    res = _drill_impl(level, user_id, int(n), seed)
    if 'session_id' not in res:
        return res
    lvl = next((l for l in _load()['levels'] if l['level'] == level), {})
    return {
        'session_id': res['session_id'], 'level': level,
        'level_title': lvl.get('title', ''), 'focus': lvl.get('focus', ''),
        'seed': res['seed'], 'receipt': res['receipt'],
        'brief': {
            'policy': ('Sanskrit first: greet and ask in Sanskrit, one question at a '
                       'time. Explain a rule in English only after a miss, then hand '
                       'the same sentence back to repeat slowly. Never read the whole '
                       'answer first. Do not claim pronunciation scores.'),
            'setting': lvl.get('focus', ''),
        },
        'items': res['items'],
    }


@mcp.tool()
def session_check(utterance: str = "", item_ref: str = "", session_id: str = "",
                  user_id: str = "owner") -> dict:
    """Check one spoken/written attempt. Returns ok / near / no, the expected
    roman form, and which ring most likely went wrong. Server-side key only."""
    c = _db()
    try:
        row = c.execute("SELECT user_id,level,key_json FROM sessions WHERE id=?",
                        (session_id,)).fetchone()
    finally:
        c.close()
    if not row:
        return {'error': 'unknown session — call session_start() first'}
    uid, level, key_json = row
    if uid != user_id:
        return {'error': 'session belongs to another learner'}
    key = json.loads(key_json)
    if item_ref not in key:
        return {'error': f'item_ref not in this session: {item_ref}'}
    exp_dev = key[item_ref]['dev']
    exp_roman = key[item_ref]['roman']
    g = norm(utterance)
    if g and g in {norm(exp_dev), norm(exp_roman)}:
        return {'verdict': 'ok', 'expected_roman': exp_roman,
                'say': 'correct — say it once more, slowly'}
    target = next((r for r in _load()['rows']
                   if _item_id(r) == item_ref), None)
    near, jac = _nearest(level, utterance)
    out = {'verdict': 'near' if jac >= 0.5 else 'no',
           'expected_roman': exp_roman, 'expected_dev': exp_dev,
           'match_score': round(jac, 2)}
    if target and near and _item_id(near) != item_ref:
        diff = _ring_diff(target, near)
        out['likely_ring'] = diff
        titles = dict(zip(target.get('rings', []), target.get('ring_titles', [])))
        out['hint'] = 'compare the ' + ', '.join(titles.get(x, x) for x in diff) + ' ring'
    if out['verdict'] == 'no':
        out['say'] = 'try again; the target is shown'
    else:
        out['say'] = 'almost — one part differs'
    return out


@mcp.tool()
def session_end(session_id: str = "", user_id: str = "owner") -> dict:
    """Close a session: mastery summary for the level + the next study-order
    level to try."""
    c = _db()
    try:
        row = c.execute("SELECT level FROM sessions WHERE id=? AND user_id=?",
                        (session_id, user_id)).fetchone()
    finally:
        c.close()
    if not row:
        return {'error': 'unknown session'}
    level = row[0]
    order = _load()['curriculum']['study_order']
    nxt = _next_impl(level)
    return {'level': level, 'next': nxt,
            'say': 'session closed — review the misses tomorrow, then continue'}


def _drill_impl(level, user_id, n, seed):
    return drill(level, user_id, n, seed)


def _next_impl(level):
    return next_level(level, None)


if __name__ == "__main__":
    if "--list" in sys.argv or "--help" in sys.argv:
        print("compose gate — levels, show, drill, submit, review, progress")
    else:
        mcp.run(transport="stdio")
