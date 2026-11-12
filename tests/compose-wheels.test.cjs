const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = process.cwd();
const ds = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/wheels/compose.json'), 'utf8'));
const prov = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/wheels/compose-provenance.json'), 'utf8'));

const HOLD = ['3.4', '4.3', '5.3', '5.4', '7.4',
  '13.1', '13.2', '13.3', '13.4', '15.1', '15.2', '15.3', '15.4'];

test('compose v2 dataset is complete and well-formed', () => {
  assert.equal(ds.format, 'svatantrya.compose/2');
  assert.equal(ds.rows.length, 9507);
  assert.equal(ds.levels.length, 60);
  assert.equal(ds.counts.families, 15);
  const byLevel = {};
  for (const r of ds.rows) {
    assert.equal(r.rings.length, 5, 'five rings per state');
    assert.ok(r.lines.length >= 1, 'at least one line');
    for (const l of r.lines) {
      for (const f of ['dev', 'roman', 'en']) assert.ok(l[f] && l[f].trim(), `${f} present`);
      assert.doesNotMatch(l.dev + l.roman + l.en, /undefined|NaN|\[object Object\]/);
    }
    assert.equal(r.status, 'MACHINE_PROPOSED_UNREVIEWED');
    byLevel[r.level] = (byLevel[r.level] || 0) + 1;
  }
  assert.equal(Object.keys(byLevel).length, 60);
  assert.ok(Object.values(byLevel).every((n) => n >= 32), 'every level has real coverage');
});

test('HOLD levels are flagged and provenance is pinned to v2', () => {
  for (const lv of HOLD) {
    assert.ok(ds.levels.some((l) => l.level === lv && l.review === 'HOLD'), lv + ' held');
    assert.ok(ds.rows.filter((r) => r.level === lv).every((r) => r.review === 'HOLD'));
  }
  assert.equal(prov.r2_key, 'Svatantrya_Sanskrit_Wheels_15_Families_60_Levels.zip');
  assert.equal(prov.r2_sha256, '0f21d720f2c5880fa72adb0f189952fc170b284f077daf8e7010bf00bf1d08a0');
  assert.ok(prov.supersedes, 'records the retired v1 zip');
});

test('curriculum study order is complete and consistent', () => {
  const order = ds.curriculum.study_order;
  assert.equal(order.length, 60);
  assert.equal(order[0].id, '1.1');
  const ids = new Set(order.map((o) => o.id));
  assert.equal(ids.size, 60);
  for (const o of order) {
    assert.ok(o.rank >= 1 && o.family && o.title, 'ranked entry has shape');
    for (const p of o.prerequisites || []) assert.ok(ids.has(p), `${o.id} prereq ${p} exists`);
  }
});

test('golden agreement lines survive the pipeline', () => {
  const all = ds.rows.flatMap((r) => r.lines.map((l) => l.roman));
  assert.ok(all.some((s) => s.includes('bhavān katham asti')), 'respectful agreement');
  assert.ok(all.some((s) => s.includes('tvaṃ katham asi')), 'familiar agreement');
  assert.ok(all.some((s) => s.includes('saptaviṃśatiḥ')), 'numeral 27');
});
