"""Certificate math shared by the emitter and the MCP tool.

A certificate is the mechanics stamp for one pack entry: it pins the trace,
records what was structurally checked, and hashes itself. It does NOT claim
Lean verification — `lean_status` stays `pending` until the trika-x
PrakriyaSlice lands (W2b). Tier-2 verification = recompute from the pack and
compare: that is `verify()` below, and it needs no Lean, no network, no trust
in the emitter beyond the bytes.

Canonical hashing: JSON, UTF-8, sort_keys, compact separators — identical on
both sides, or the stamp is worthless.
"""
from __future__ import annotations
import hashlib
import json
import re

FORMAT = 'svatantrya.certificates/1'
# Vidyut emits some bare numbers for special rules (e.g. '89' in the kutra
# trace); accept them, count them as unknown-code rather than failing.
CODE_RE = re.compile(r'^\d+(\.\d+)*$')


def canonical(obj) -> str:
    return json.dumps(obj, ensure_ascii=False, sort_keys=True, separators=(',', ':'))


def sha(text: str) -> str:
    return hashlib.sha256(text.encode('utf-8')).hexdigest()


def compute(entry: dict, lean_status: str = 'pending',
            lean: dict | None = None) -> dict:
    """Build the certificate for one wheel-pack entry. Pure function.
    `lean` is the receipt binding (version/command/file+pack sha/scope),
    carried verbatim when present so verify() reproduces cert_sha."""
    prak = entry.get('prakriya') or []
    codes = [str(s.get('sutra') or '') for s in prak]
    checks = {
        'steps': len(prak),
        'codes_well_formed': all(CODE_RE.match(c) for c in codes) if codes else False,
        'steps_have_after': all(bool((s.get('after') or '').strip()) for s in prak) if prak else False,
        'unknown_corpus_codes': sum(1 for s in prak if not (s.get('sutra_iast') or '').strip()),
        'rule_set_sha': sha(canonical(sorted(set(codes)))),  # set of codes, not rule texts
    }
    trace = sha(canonical(prak))
    body = {
        'format': FORMAT,
        'pack_id': entry.get('id'),
        'form': entry.get('iast'),
        'trace_sha': trace,
        'rule_set_sha': checks['rule_set_sha'],
        'checks': checks,
        'lean_status': lean_status,
        'note': ('Pins the stored derivation trace and its rule set. Tier-2 check '
                 'recomputes this from the pack. Even when Lean-checked, the '
                 'scope is structural well-formedness over the rule inventory — '
                 'NOT a derivation from the Aṣṭādhyāyī and NOT a claim about meaning.'),
    }
    if lean:
        body['lean'] = lean
    body['cert_sha'] = sha(canonical(body))
    return body


def verify(entry: dict, cert: dict) -> dict:
    """Tier-2: recompute from the pack entry; never trust the stored cert."""
    fresh = compute(entry, lean_status=cert.get('lean_status', 'pending'),
                    lean=cert.get('lean'))
    ok = (fresh['cert_sha'] == cert.get('cert_sha')
          and fresh['trace_sha'] == cert.get('trace_sha'))
    return {'ok': ok, 'recomputed_cert_sha': fresh['cert_sha'],
            'stored_cert_sha': cert.get('cert_sha')}
