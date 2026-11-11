const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');

test('biblio: no dead reader links; has_reader agrees with disk', () => {
  const b = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'biblio.json'), 'utf8'));
  let dead = [];
  let mismatched = [];
  for (const w of b.works) {
    const onDisk = fs.existsSync(path.join(ROOT, 'data', `${w.id}.json`));
    if (w.has_reader !== onDisk) mismatched.push(w.id);
    if (w.has_reader && !onDisk) dead.push(w.id);
  }
  assert.deepEqual(mismatched, [], 'has_reader must match what exists on disk');
  assert.deepEqual(dead, [], 'no phantom reader links');
  const linked = b.works.filter(w => w.has_reader).length;
  assert.ok(linked >= 45, `readable works: ${linked}`);
});

test('traces published, all verify, index honest', () => {
  const idx = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'traces', 'index.json'), 'utf8'));
  assert.equal(idx.format, 'svread-trace-index/1');
  assert.ok(idx.count >= 13, `trace count: ${idx.count}`);
  assert.equal(idx.count, idx.entries.length);
  for (const e of idx.entries) {
    const p = path.join(ROOT, 'data', e.file);
    assert.ok(fs.existsSync(p), `missing bundle ${e.file}`);
    const doc = JSON.parse(fs.readFileSync(p, 'utf8'));
    assert.equal(doc.format, 'trika-trace/1');
    assert.equal(doc.chunk.work, e.work);
    assert.equal(doc.chunk.target, e.target);
    assert.equal(doc.verdict, e.verdict, `${e.target} verdict drift`);
    const crypto = require('node:crypto');
    const sha = crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
    assert.equal(sha, e.sha256, `${e.target} hash mismatch`);
    assert.equal(doc.gaps.length, (e.gaps || []).length);
  }
  const complete = idx.entries.filter(e => e.verdict === 'COMPLETE').length;
  assert.ok(complete >= 11, `complete traces: ${complete}`);
  assert.ok(idx.entries.some(e => e.verdict === 'PARTIAL'), 'PARTIAL honestly kept');
});

test('llms.txt claims are measured, not inflated', () => {
  const llms = fs.readFileSync(path.join(ROOT, 'llms.txt'), 'utf8');
  const b = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'biblio.json'), 'utf8'));
  const readable = b.works.filter(w => w.has_reader).length;
  const withPass = b.works.filter(w => w.passages > 0).length;
  assert.ok(llms.includes(`${readable} readable now`), 'readable count is measured');
  assert.ok(llms.includes(`${withPass} with passage ledgers`), 'passage count measured');
  assert.ok(!/101 Sanskrit works with layered translations/.test(llms), 'old overclaim gone');
  assert.ok(llms.includes('/data/traces/index.json'), 'trace index linked');
  assert.ok(llms.includes('formal__gaps'), 'formal tool family named');
});

const EMITTERS = [
  // PR #7 P1: emitters needing sibling checkouts or a database SKIP with
  // a reason when that infrastructure is absent on the runner. Only
  // self-contained emitters must pass everywhere. One test per tool so a
  // skip can never mask a later failure (a t.skip() ends its own test only).
  { tool: 'emit_biblio.py', need: 'db' },
  { tool: 'emit_traces.py', need: 'trika' },
  { tool: 'emit_verify.py', need: 'trika+tw' },
  { tool: 'emit_formal.py', need: 'trika' },
  { tool: 'emit_discovery.py', need: null },
  { tool: 'emit_gate_pools.py', need: null },
  { tool: 'emit_certificates.py', need: null },
  { tool: 'emit_practice.py', need: null },
  { tool: 'emit_claim_pages.py', need: null },
  { tool: 'emit_index_meta.py', need: null },
  { tool: 'emit_eval_set.py', need: null },
  { tool: 'check_licenses.py', need: null },
  { tool: 'eval_blind.py', need: null },
];

function emitterSkipReason(need) {
  const fs2 = require('node:fs');
  const hasTrika = fs2.existsSync(process.env.TRIKA_X_ROOT || '/root/trika-x');
  const hasTW = fs2.existsSync(process.env.TRANSLATION_WORK || '/root/translation-work');
  if (need === 'db') return 'SKIP-IF-NO-DB';
  if (need === 'trika' && !hasTrika) return 'needs trika-x checkout';
  if (need === 'trika+tw' && !(hasTrika && hasTW)) return 'needs sibling checkouts';
  return null;
}

for (const { tool, need } of EMITTERS) {
  test(`emitter deterministic --check: ${tool}`, (t) => {
    const pre = emitterSkipReason(need);
    if (pre === 'SKIP-IF-NO-DB') {
      // decided after attempt: only a missing database skips, nothing else
    } else if (pre) {
      t.skip(`${tool}: ${pre}; not present here`);
      return;
    }
    let out;
    try {
      out = execFileSync('python3', ['tools/' + tool, '--check'],
        { cwd: ROOT, encoding: 'utf8' });
    } catch (e) {
      if (e.status === 3) { t.skip(String(e.stdout || '').trim().split('\n').pop()); return; }
      const msg = (e.stdout || '') + (e.message || '');
      const fs2b = require('node:fs');
      const hasTrikaB = fs2b.existsSync(process.env.TRIKA_X_ROOT || '/root/trika-x');
      if (need === 'db' &&
          (/No module named 'psycopg2'|DB unreachable|connection|psql/i.test(msg) ||
           (!hasTrikaB && /EVIDENCE unreadable|No such file/i.test(msg)))) {
        t.skip(`${tool} needs trika-x and/or a database; not present here`);
        return;
      }
      throw e;
    }
    // Some deterministic checks intentionally stay silent on success.
    // execFileSync already throws on non-zero status; if a check prints a
    // result, require it to be an explicit GREEN rather than arbitrary output.
    assert.ok(!out.trim() || /GREEN/.test(out), `${tool}: ${out}`);
  });
}

test('formal registry is published and honest', () => {
  const f = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'formal.json'), 'utf8'));
  assert.equal(f.format, 'trika-formal-registry/1');
  assert.ok(f.counts.theorems >= 150, `theorems: ${f.counts.theorems}`);
  assert.ok(f.counts.chunks_in_snapshot >= 150, 'snapshot counted');
  assert.ok(typeof f.counts.chunks_unformalized === 'number', 'gaps counted');
  assert.ok(/REGISTERED/.test(f.scope_statement), 'scope stated');
  assert.ok(/not prove the doctrine/i.test(f.scope_statement), 'limits stated');
  for (const [name, e] of Object.entries(f.entries)) {
    assert.ok(e.kind, `${name} has kind`);
    assert.ok(/REGISTERED/.test(e.status), `${name} labelled`);
  }
  assert.ok(f.gaps.unformalized_chunks.length > 0, 'gap list published');
  assert.equal(f.verify_yourself.recipe.includes('VERIFY.md'), true);
});

test('verify view + VERIFY.md are wired', () => {
  const app = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
  assert.ok(app.includes('verifyView'), 'verify view fn');
  assert.ok(app.includes("'verify'"), 'verify route');
  assert.ok(app.includes('manifest.json'), 'links to packs');
  const md = fs.readFileSync(path.join(ROOT, 'VERIFY.md'), 'utf8');
  assert.ok(md.includes('sha256sum'), 'recipe is shell-only');
  assert.ok(/does NOT prove/i.test(md), 'limits stated');
  assert.ok(/UNPINNED/.test(md), 'witness honesty');
  assert.ok(/trika-trace\/1|trace/.test(md), 'points at traces');
});

test('chat answers carry a verify footer (R4)', () => {
  const src = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
  assert.ok(src.includes('verifyFooter'), 'footer builder present');
  assert.ok(src.includes('data/traces/index.json'), 'footer reads trace index');
  assert.ok(src.includes('data/verify/'), 'footer links verify packs');
  assert.ok(src.includes('unverified — no trace'), 'untraced chunks labelled, not linked');
  assert.ok(src.includes('manifest.json'), 'pack manifest linked');
  assert.ok(src.includes('claim/${esc(e.work)}/${esc(e.target)}/'), 'footer links readable claim page');
});

test('verify packs disclose gate status, not just a verdict (PR #7)', () => {
  const fs2 = require('node:fs'), path2 = require('node:path');
  const dir = path2.join(ROOT, 'data', 'verify');
  if (!fs2.existsSync(dir)) { return; }
  const walk = (d) => fs2.readdirSync(d, {withFileTypes:true}).flatMap(e =>
    e.isDirectory() ? walk(path2.join(d, e.name)) : [path2.join(d, e.name)]);
  const packs = walk(dir).filter(f => f.endsWith('manifest.json')).slice(0, 50);
  assert.ok(packs.length > 0, 'packs exist');
  for (const f of packs) {
    const m = JSON.parse(fs2.readFileSync(f, 'utf8'));
    assert.ok(m.assurance && typeof m.assurance === 'object',
      `${f}: assurance block present`);
    assert.ok('chunk_gate' in m.assurance, `${f}: gate status disclosed`);
    assert.ok(Array.isArray(m.caveats), `${f}: caveats array present`);
    assert.ok(/REGISTERED/.test(m.limits || ''), `${f}: current wording`);
  }
});
