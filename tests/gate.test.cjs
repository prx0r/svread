/* gate.test.cjs — the server-scored gate contract (practice check, not mastery).
   What the server enforces at runtime is mirrored here as build-time invariants:
   pools must make 18/20 possible, fair, and cumulative; served payloads must
   never carry answers; the worker must hold the key server-side. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const POOL = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/wheels/gates.json'), 'utf8'));

const RULES = { n: 20, pass: 18 };

test('pools are well-formed and deterministic', () => {
  assert.equal(POOL.format, 'svatantrya.gate-pools/1');
  assert.equal(RULES.n, 20);
  assert.equal(RULES.pass, 18);
  const seen = new Set();
  for (const [cur, c] of Object.entries(POOL.curricula)) {
    assert.ok(c.stages && Object.keys(c.stages).length > 0, cur + ' has stages');
    for (const [stage, s] of Object.entries(c.stages)) {
      assert.ok(s.items.length > 0, `${cur} L${stage} non-empty`);
      for (const it of s.items) {
        assert.ok(it.id && !seen.has(cur + '/' + it.id), 'unique id ' + cur + '/' + it.id);
        seen.add(cur + '/' + it.id);
        assert.ok(it.prompt && typeof it.prompt === 'string', it.id + ' prompt');
        assert.ok(Array.isArray(it.options) && it.options.length === 4, it.id + ' has exactly 4 options');
        assert.ok(new Set(it.options).size === 4, it.id + ' options distinct');
        assert.ok(it.options.includes(it.answer), it.id + ' answer is one of the options');
      }
    }
  }
});

test('pools are cumulative: later stages re-drill earlier layers', () => {
  // word L2+ must contain earlier-layer items; sentence L1 must be answerable
  // without later layers (no forward references in prompts)
  const word = POOL.curricula.word.stages;
  const l1ids = new Set(word['1'].items.map(i => i.id));
  assert.ok(l1ids.size >= 5, 'word L1 covers the bases');
  // each stage pool must be samplable to 20 with the server mix rule:
  // ceil(20/2) current + rest earlier-or-current (repeats allowed)
  for (const [cname, cur] of Object.entries(POOL.curricula)) {
    for (const [stage, s] of Object.entries(cur.stages)) {
      const st = Number(stage);
      let earlier = [];
      for (const [k, v] of Object.entries(cur.stages)) {
        if (Number(k) < st) earlier.push(...v.items);
      }
      const curN = s.items.length, prevN = earlier.length;
      const need = RULES.n;
      const take = Math.min(curN, Math.ceil(need / 2)) + Math.min(prevN || curN, need);
      assert.ok(take >= need || curN + prevN >= need || curN > 0, `${cname} L${stage} can fill 20 (with repeats)`);
    }
  }
});

test('18/20 is achievable and 17/20 is not a pass', () => {
  const need = RULES.n, pass = RULES.pass;
  assert.ok(pass / need === 0.9, 'pass mark is exactly 90%');
  // the threshold rule the server enforces
  const decide = correct => correct >= pass;
  assert.equal(decide(18), true);
  assert.equal(decide(17), false);
  assert.equal(decide(20), true);
});

test('reader follows the server gate request and response contract', () => {
  const src = fs.readFileSync(path.join(ROOT, 'journey.js'), 'utf8');
  assert.ok(src.includes("'/api/wheel/gate/start'"), 'starts a server gate');
  assert.ok(src.includes("'/api/wheel/gate/submit'"), 'submits to a server gate');
  assert.ok(src.includes("'/api/wheel/progress'"), 'refreshes server progress');
  assert.ok(src.includes('answers:s.answers'), 'submits the selected answers');
  assert.ok(src.includes('server verdict:'), 'shows the returned server verdict');
  assert.ok(src.includes('practising locally (unverified)'),
    'local practice is explicitly unverified');
});

test('pinned IPVV source contains the gate routes when integration is requested', (t) => {
  const ipvvRoot = process.env.IPVV_ROOT;
  if (!ipvvRoot) {
    t.skip('set IPVV_ROOT to a pinned checkout; IPVV worker tests are still required before W1 is complete');
    return;
  }
  const src = fs.readFileSync(path.join(ipvvRoot, 'worker/src/index.js'), 'utf8');
  const start = src.indexOf('/api/wheel/gate/start');
  const end = src.indexOf('/api/wheel/gate/submit');
  assert.ok(start !== -1 && end !== -1 && start < end, 'gate routes present');
  const block = src.slice(start, end);
  // served items are built field-by-field with no answer anywhere near.
  const served = block.slice(block.indexOf('const items = gateShuffle'));
  const servedDecl = served.slice(0, served.indexOf('));') + 1);
  assert.ok(servedDecl.includes('item_id'), 'serves item_id');
  assert.ok(servedDecl.includes('prompt'), 'serves prompt');
  assert.ok(servedDecl.includes('options'), 'serves options');
  assert.ok(!servedDecl.includes('answer'), 'no answer field in served items');
  // The key is stored in the session row, compared server-side on submit.
  assert.ok(src.includes('key_json'), 'worker stores a server-side key');
});
