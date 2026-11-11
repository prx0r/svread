/* certificates.test.cjs — mechanics stamp: pin, structure-check, recompute.
   Honesty locks: lean_status may be 'checked' ONLY when a passing Lean
   receipt pins this exact pack (file+pack sha); otherwise 'pending'.
   Every certificate must recompute from the pack (tier-2), and checked
   certificates must carry the scope disclaimer — an inventory check is
   never a derivation from the Aṣṭādhyāyī. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');
const read = p => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));

test('certificates exist for every derived traced entry, none missing', () => {
  const pack = read('data/grammar/wheel-pack.json');
  const certs = read('data/grammar/certificates.json');
  assert.equal(certs.format, 'svatantrya.certificates/1');
  const derived = pack.entries.filter(e => e.status === 'DERIVED' && (e.prakriya || []).length > 0);
  assert.equal(certs.count, derived.length, 'one cert per traced derived entry');
  assert.equal(certs.entries.length, certs.count);
  const byId = new Map(certs.entries.map(c => [c.pack_id, c]));
  for (const e of derived) assert.ok(byId.has(e.id), 'cert for ' + e.id);
});

test('every certificate recomputes from the pack (tier-2, no trust)', () => {
  // the recompute uses the same code the MCP tool uses — via python certlib
  const out = execFileSync('python3', ['-c', `
import json, sys
sys.path.insert(0, 'tools')
import certlib
pack = {e['id']: e for e in json.load(open('data/grammar/wheel-pack.json'))['entries']}
certs = json.load(open('data/grammar/certificates.json'))['entries']
bad = [c['pack_id'] for c in certs if not certlib.verify(pack[c['pack_id']], c)['ok']]
print(len(certs), len(bad), bad[:5])
`], { cwd: ROOT, encoding: 'utf8' }).trim().split(' ');
  assert.equal(Number(out[0]) > 0, true, 'certs present');
  assert.equal(Number(out[1]), 0, 'tier-2 recompute failures: ' + out.slice(2).join(' '));
});

test('honesty: lean status is receipt-bound, scoped, pack-pinned', () => {
  const crypto = require('node:crypto');
  const certs = read('data/grammar/certificates.json');
  const receipt = read('data/grammar/prakriya-receipt.json');
  const packSha = crypto.createHash('sha256')
    .update(fs.readFileSync(path.join(ROOT, 'data/grammar/wheel-pack.json'))).digest('hex');
  const receiptLive = receipt.exit_code === 0 && receipt.pack_sha256 === packSha;
  for (const c of certs.entries) {
    assert.ok(['checked', 'pending'].includes(c.lean_status), c.pack_id + ' known status');
    assert.ok(c.note.includes('NOT a derivation'), c.pack_id + ' carries the scope note');
    if (c.lean_status === 'checked') {
      assert.ok(receiptLive, 'checked requires a passing receipt for this pack');
      assert.ok(c.lean, c.pack_id + ' carries the lean binding');
      assert.equal(c.lean.pack_sha256, packSha, c.pack_id + ' bound to this pack bytes');
      assert.ok(c.lean.scope.includes('NOT a derivation'), c.pack_id + ' scope in binding');
      assert.ok(c.lean.lean_version && c.lean.command && c.lean.file_sha256,
        c.pack_id + ' binds version + command + file sha');
    }
  }
  if (receiptLive) {
    assert.ok(certs.entries.every(c => c.lean_status === 'checked'),
      'live receipt => every traced cert checked');
    assert.ok(certs.lean_note.includes('structural') || certs.lean_note.includes('Lean-checked'),
      'bundle note states what was checked');
  } else {
    assert.ok(certs.entries.every(c => c.lean_status === 'pending'),
      'stale/absent receipt => everything pending');
  }
});

test('answer pages and harness carry the certificate', () => {
  const html = fs.readFileSync(path.join(ROOT, 'a/sarvatra/index.html'), 'utf8');
  const certs = read('data/grammar/certificates.json');
  const sarv = certs.entries.find(c => c.pack_id === 'sarva-tral');
  assert.ok(html.includes(sarv.cert_sha), 'sarvatra page carries its cert_sha');
  assert.ok(html.includes('Lean: <b>' + sarv.lean_status + '</b>'),
    'page states the actual Lean status (' + sarv.lean_status + ')');
  assert.ok(html.includes('NOT a derivation'), 'page states the scope disclaimer');
  const noCert = fs.readFileSync(path.join(ROOT, 'a/katham/index.html'), 'utf8');
  assert.ok(noCert.includes('no derivation claimed'), 'katham: no cert, said honestly');
  const h = read('data/wheels/harness.json');
  assert.equal(h.verify.certificates.count, certs.count, 'harness count matches');
  assert.equal(h.verify.certificates.lean_status, certs.entries[0].lean_status,
    'harness reports the same status as the certs');
  assert.ok(h.verify.fast_path.some(x => x.includes('cert_sha')), 'harness fast path mentions certs');
});

test('emitter is deterministic', () => {
  const out = execFileSync('python3', ['tools/emit_certificates.py', '--check'],
    { cwd: ROOT, encoding: 'utf8' });
  assert.ok(true, out);
});
