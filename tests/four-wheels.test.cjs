const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = process.cwd();
const wm = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/wheels/wheelmap.json'), 'utf8'));
const pk = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/wheels/compose-packs.json'), 'utf8'));

test('wheelmap: four wheels, all 15 families mapped', () => {
  assert.equal(wm.format, 'svatantrya.wheelmap/1');
  assert.equal(wm.wheels.length, 4);
  assert.deepEqual(wm.wheels.map((w) => w.id).sort(),
    ['action', 'conversation', 'description', 'expression']);
  for (const w of wm.wheels) assert.equal(w.rings.length, 5, w.id + ' has five rings');
  const fams = Object.keys(wm.families);
  assert.equal(fams.length, 15, 'all 15 v2 families are mapped');
  assert.equal(wm.families.transformation.role, 'mechanic', 'transformation is a mechanic, not a wheel');
  assert.equal(wm.families.transformation.wheel, null);
});

test('packs: six starter packs, all four wheels, no generation errors', () => {
  assert.equal(pk.format, 'svatantrya.compose-packs/1');
  assert.equal(pk.packs.length, 6);
  assert.deepEqual([...pk.packs].sort(),
    ['about-me', 'classroom', 'family', 'travel', 'trika', 'vedanta'].sort());
  assert.equal(pk.counts.errors, 0);
  assert.equal(pk.rows.length, 2512);
  const wheels = new Set(pk.rows.map((r) => r.wheel));
  for (const w of ['conversation', 'expression', 'action', 'description']) {
    assert.ok(wheels.has(w), 'wheel present: ' + w);
  }
  for (const r of pk.rows) {
    assert.equal(r.status, 'MACHINE_PROPOSED_UNREVIEWED');
    for (const l of r.lines) {
      for (const f of ['dev', 'roman', 'en']) assert.ok(l[f] && l[f].trim());
      assert.doesNotMatch(l.dev + l.roman + l.en, /undefined|NaN|\[object Object\]/);
    }
  }
});

test('same construction across packs (transfer test)', () => {
  const find = (pack, actor, level) => pk.rows.find(
    (r) => r.pack === pack && r.level === level && r.selection.actor === actor);
  // first-person "today I study X" must agree in every pack summary
  for (const pack of ['about-me', 'vedanta', 'trika', 'travel', 'classroom']) {
    const r = find(pack, 'i', 'action.3.1');
    assert.ok(r, pack + ' has a first-person state');
    assert.match(r.lines[0].roman, /paṭhāmi|likhāmi|gacchāmi/, pack + ' uses a first-person verb');
  }
  // subject drives agreement: brother -> paṭhati, I -> paṭhāmi
  const bro = find('family', 'brother', 'action.3.1');
  const me = find('family', 'i', 'action.3.1');
  assert.match(bro.lines[0].roman, /paṭhati/);
  assert.match(me.lines[0].roman, /paṭhāmi/);
});

test('British/Indian spelling is not silently broken (golden wording)', () => {
  const r = pk.rows.find((x) => x.pack === 'family' && x.level === 'action.3.1' && x.selection.actor === 'brother');
  const r2 = pk.rows.find((x) => x.level === 'action.3.1' && x.selection.actor === 'sir');
  assert.match(r.lines[0].en, /the brother studies/);
  assert.match(r2.lines[0].en, /you .* study/); // polite 'you' takes base form in English
});
