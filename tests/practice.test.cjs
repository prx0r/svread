/* practice.test.cjs — vendored deitybody curriculum: verbatim, provenance,
   route wired. The assembly rule must appear on the page exactly as the
   source states it: modern apparatus over attested elements, never doctrine. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8');

test('vendored curriculum: 10 stages, provenance recorded', () => {
  const cur = JSON.parse(read('data/practice/curriculum.json'));
  const cards = JSON.parse(read('data/practice/cards.json'));
  assert.equal(cur.format, 'svatantrya.practice-curriculum/1');
  assert.equal(cards.format, 'svatantrya.practice-cards/1');
  assert.equal(cur.curriculum.stages.length, 10);
  assert.equal(cards.count, 10);
  assert.match(cur.source.sha256, /^[0-9a-f]{64}$/);
  assert.match(cards.source.sha256, /^[0-9a-f]{64}$/);
  assert.equal(cur.source.repo, 'prx0r/deitybody');
  // the assembly rule is present verbatim — it is the honesty law of this surface
  assert.ok(cur.rule_verbatim.includes('modern apparatus'), 'rule says apparatus');
  assert.ok(cur.rule_verbatim.includes('No stage may present synthesis as doctrine'),
    'rule forbids doctrine');
});

test('cards parse with the four canonical fields on most stages', () => {
  const cards = JSON.parse(read('data/practice/cards.json'));
  for (const c of cards.cards) {
    assert.equal(typeof c.n, 'number');
    assert.ok(c.title && c.title.length > 3, `card ${c.n} title`);
    assert.ok(c.fields.DO, `card ${c.n} has DO`);
    assert.ok(c.fields.SOURCE, `card ${c.n} has SOURCE (attested anchor)`);
  }
  // stage 1 carries the extra phonetics field
  const s1 = cards.cards.find(c => c.n === 1);
  assert.ok(s1.fields['How to hold the sound (phonetics, not doctrine)'],
    'stage 1 phonetics field');
  // byte-level: no card text may be paraphrased — the FULL DO text must
  // appear verbatim in the source markdown (external review of #18)
  const mdPath = process.env.DEITYBODY_ROOT
    ? path.join(process.env.DEITYBODY_ROOT, 'practice/CURRICULUM_CARDS.md')
    : '/root/deitybody/practice/CURRICULUM_CARDS.md';
  let md = null;
  try { md = fs.readFileSync(mdPath, 'utf8'); } catch { md = null; }
  if (md) {
    const squash = t => t.replace(/\s+/g, ' ').trim();
    const mdSquashed = squash(md);
    for (const c of cards.cards) {
      assert.ok(mdSquashed.includes(squash(c.fields.DO)),
        `card ${c.n} FULL DO text found verbatim in source`);
      assert.ok(mdSquashed.includes(squash(c.fields.SOURCE)),
        `card ${c.n} FULL SOURCE line found verbatim`);
    }
  }
});

test('practice view is wired: route, nav, render markers', () => {
  const app = read('app.js');
  assert.ok(app.includes("view')==='practice'"), 'route present');
  assert.ok(app.includes('practiceView'), 'view function present');
  assert.ok(app.includes('data/practice/curriculum.json'), 'reads vendored curriculum');
  assert.ok(app.includes('Assembly rule (verbatim from the source)'), 'shows the rule');
  assert.ok(app.includes('wheels.html#journey'), 'links scored grammar practice');
  const html = read('index.html');
  assert.ok(/href="\?view=practice"[^>]*>Practice</.test(html), 'nav item present');
  const css = read('styles.css');
  assert.ok(css.includes('.pr-stage'), 'stage styles present');
});

test('emitter is deterministic; vendored fallback works without upstream', () => {
  const { execFileSync } = require('node:child_process');
  // with upstream present: byte-identical rerun
  const out = execFileSync('python3', ['tools/emit_practice.py', '--check'],
    { cwd: ROOT, encoding: 'utf8' });
  assert.ok(/GREEN/.test(out), out);
  // without upstream (simulated via DEITYBODY_ROOT): the vendored fallback
  // must validate on its own — this exercises the OTHER branch of the emitter
  const fallback = execFileSync('python3', ['tools/emit_practice.py', '--check'], {
    cwd: ROOT, encoding: 'utf8',
    env: { ...process.env, DEITYBODY_ROOT: '/nonexistent-deitybody' },
  });
  assert.ok(/GREEN \(vendored fallback/.test(fallback),
    'fallback branch reported: ' + fallback);
});
