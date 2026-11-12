const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = process.cwd();
const ds = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/wheels/compose.json'), 'utf8'));
const prov = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/wheels/compose-provenance.json'), 'utf8'));

test('compose dataset is complete and well-formed', () => {
  assert.equal(ds.format, 'svatantrya.compose/1');
  assert.equal(ds.rows.length, 5739);
  assert.equal(ds.levels.length, 28);
  const byLevel = {};
  for (const r of ds.rows) {
    assert.equal(r.rings.length, 5, 'five rings per state');
    assert.ok(r.lines.length >= 1, 'at least one line');
    for (const l of r.lines) {
      for (const f of ['dev', 'roman', 'en']) {
        assert.ok(l[f] && l[f].trim(), `${f} present`);
      }
      assert.doesNotMatch(l.dev + l.roman + l.en, /undefined|NaN|\[object Object\]/);
    }
    assert.equal(r.status, 'MACHINE_PROPOSED_UNREVIEWED');
    byLevel[r.level] = (byLevel[r.level] || 0) + 1;
  }
  assert.ok(Object.values(byLevel).every((n) => n >= 32), 'every level has real coverage');
});

test('HOLD levels are flagged and provenance is pinned', () => {
  for (const lv of ['3.4', '4.3', '5.3', '5.4', '6.2']) {
    assert.ok(ds.levels.some((l) => l.level === lv && l.review === 'HOLD'), lv + ' held');
    assert.ok(ds.rows.filter((r) => r.level === lv).every((r) => r.review === 'HOLD'));
  }
  assert.equal(prov.r2_key, 'Svatantrya_Sanskrit_Generative_Wheels_6_Families_24_Levels.zip');
  assert.match(prov.r2_sha256, /^[0-9a-f]{64}$/);
});

test('golden agreement lines survive the pipeline', () => {
  const all = ds.rows.flatMap((r) => r.lines.map((l) => l.roman));
  assert.ok(all.some((s) => s.includes('bhavān katham asti')), 'respectful agreement');
  assert.ok(all.some((s) => s.includes('tvaṃ katham asi')), 'familiar agreement');
  assert.ok(all.some((s) => s.includes('apaṭham')), 'past tense form');
  assert.ok(all.some((s) => s.includes('saptaviṃśatiḥ')), 'numeral 27');
});
