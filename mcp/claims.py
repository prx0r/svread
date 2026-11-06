#!/usr/bin/env python3
"""Revision-bound essay claims; source freshness is scoped to bundled evidence.

A marker is syntactically CITED even if it cannot be resolved. CURRENT means
that its recorded projection hash matches a hash-checked bundled projection,
not that the source is authoritative, latest online, reviewed, or entails the
claim. Caller-provided hashes are historical claims, never proof of freshness.
External markers remain UNRESOLVED until an independent resolver is available.
"""
from __future__ import annotations

import hashlib
import re

from audit import MARKER_RE, QUOTE_RE

CLAIM_TYPES = ("quotation", "argument", "historical", "interpretive", "open_question")
LINK_STATUSES = ("CURRENT", "STALE", "UNRESOLVED")
SHA256 = re.compile(r"[0-9a-f]{64}")


def _sha(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def _current(marker, is_chunk, resolver):
    if not is_chunk or resolver is None:
        return None
    try:
        result = resolver(marker)
    except (OSError, ValueError, KeyError, TypeError):
        return None
    return result if isinstance(result, str) and SHA256.fullmatch(result) else None


def link(text: str, refs=None, essay_rev: str = "", source_revs: dict | None = None,
         resolver=None) -> dict:
    """Link claims to available bundled projection snapshots.

    `resolver` is an internal callable which resolves a marker against the
    actual bundled projection; it is never supplied by the MCP client. Source
    revs supplied by the caller are recorded historical values, not current
    source attestations. A missing historical hash can be captured from a
    freshly resolved local bundle at the time the record is created.
    """
    if not isinstance(text, str) or not text.strip():
        raise ValueError("Draft text is required")
    refs = refs or []
    source_revs = source_revs or {}
    if not isinstance(refs, list) or not isinstance(source_revs, dict):
        raise ValueError("References must be a list and source revisions an object")
    essay_sha = _sha(text)
    chunks = {f"{r['work']}:{r['target']}" for r in refs
              if isinstance(r, dict) and r.get('kind', 'chunk') == 'chunk'
              and isinstance(r.get('work'), str) and isinstance(r.get('target'), str)}
    claims = []
    for i, para in enumerate([p for p in re.split(r"\n\s*\n", text) if p.strip()]):
        markers = sorted(set(MARKER_RE.findall(para)))
        quotes = sorted(set(QUOTE_RE.findall(para)))
        links = []
        for marker in markers:
            is_chunk = marker in chunks
            actual = _current(marker, is_chunk, resolver)
            recorded = source_revs.get(marker)
            if recorded is not None and (not isinstance(recorded, str) or not recorded):
                raise ValueError('Source revisions must be nonempty strings')
            if actual is not None and recorded is None:
                recorded = actual
            status = ('UNRESOLVED' if actual is None else
                      'CURRENT' if recorded == actual else 'STALE')
            links.append({'marker': marker, 'status': status, 'recorded_rev': recorded,
                          'current_rev': actual, 'declared_chunk': is_chunk,
                          'resolves_chunk': bool(is_chunk and actual),
                          'resolution': 'BUNDLED_PROJECTION' if actual else 'UNRESOLVED'})
        claims.append({'para': i, 'type': 'quotation' if quotes else 'argument',
                       'citation': 'CITED' if markers else 'UNCITED',
                       'markers': markers, 'quotes': [q[:120] for q in quotes],
                       'links': links, 'assessment': 'UNASSESSED'})
    return {'format': 'essay-claim/1', 'essay_rev': essay_rev or essay_sha,
            'essay_sha256': essay_sha, 'claims': claims,
            'unresolved': sum(1 for c in claims for item in c['links'] if item['status'] == 'UNRESOLVED'),
            'limitations': ['CURRENT only compares a recorded hash with the local bundled projection; it is not proof of source authority, entailment, review, or latest online version.']}


def check_stale(record: dict, text: str, source_revs: dict | None = None, resolver=None) -> dict:
    """Recheck against real bundled snapshots; supplied current hashes are untrusted.

    The source_revs argument remains accepted for backwards compatibility but
    cannot supply authority for a CURRENT status. Legacy CURRENT links also
    become UNRESOLVED when their source cannot be independently resolved.
    """
    if not isinstance(record, dict) or record.get('format') != 'essay-claim/1':
        raise ValueError('not an essay-claim/1 record')
    if not isinstance(text, str):
        raise ValueError('Draft text must be a string')
    if source_revs is not None and not isinstance(source_revs, dict):
        raise ValueError('source revisions must be an object')
    current_sha = _sha(text)
    essay_stale = current_sha != record.get('essay_sha256')
    out_links = stale = unresolved = 0
    claims = []
    for c in record.get('claims', []):
        links = []
        for old in c.get('links', []):
            marker = old['marker']
            declared = old.get('declared_chunk', old.get('resolves_chunk')) is True
            actual = _current(marker, declared, resolver)
            recorded = old.get('recorded_rev')
            status = ('UNRESOLVED' if actual is None or not recorded else
                      'CURRENT' if actual == recorded else 'STALE')
            stale += status == 'STALE'
            unresolved += status == 'UNRESOLVED'
            out_links += 1
            links.append({**old, 'status': status, 'current_rev': actual,
                          'declared_chunk': declared, 'resolves_chunk': bool(declared and actual),
                          'resolution': 'BUNDLED_PROJECTION' if actual else 'UNRESOLVED'})
        claims.append({**c, 'links': links})
    return {'essay_stale': essay_stale, 'essay_sha256_then': record.get('essay_sha256'),
            'essay_sha256_now': current_sha, 'stale_links': stale,
            'unresolved_links': unresolved, 'links': out_links, 'claims': claims,
            'limitations': ['Freshness is scoped to local bundled projections; supplied source revisions are not independent verification.']}
