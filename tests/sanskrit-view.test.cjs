const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const SK = path.join(ROOT, 'data', 'sanskrit');
const WORKS = new Set(['bhairavastava', 'mahopadeshavimshatika', 'anuttarastika',
  'paramarthasara', 'bodhapancadasika', 'tantrasara-a01']);

test('emit outputs exist and validate', () => {
  const index = JSON.parse(fs.readFileSync(path.join(SK, 'index.json'), 'utf8'));
  assert.equal(index.lessons.length, 10);
  const rules = JSON.parse(fs.readFileSync(path.join(SK, 'rule-boxes.json'), 'utf8'));
  assert.equal(rules.count, rules.rule_boxes.length);
  assert.ok(rules.count >= 8);
  for (const e of index.lessons) {
    const L = JSON.parse(fs.readFileSync(path.join(SK, `lesson-${e.id}.json`), 'utf8'));
    for (const k of ['witness', 'recite', 'learn', 'decode', 'recognise', 'practice']) {
      assert.ok(L[k] && L[k].length > 50, `${e.id} section ${k} present`);
    }
    assert.ok(WORKS.has(L.work), `${e.id} work ${L.work} known`);
    assert.equal(L.has_reader, fs.existsSync(path.join(ROOT, 'data', `${L.work}.json`)));
    const blob = JSON.stringify(L);
    assert.ok(!blob.includes('googleapis'), `${e.id} no font CDN leak`);
    assert.ok(!blob.includes('<script'), `${e.id} no scripts`);
  }
  const prov = JSON.parse(fs.readFileSync(path.join(SK, 'provenance.json'), 'utf8'));
  assert.match(prov.bookfactory_rev, /^[0-9a-f]{7,40}$/);
  assert.ok(prov.files['index.json'] && prov.files['rule-boxes.json']);
});

test('sanskrit view wired in app + header + styles', () => {
  const app = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
  assert.ok(app.includes("?view=sanskrit") || app.includes("'sanskrit'"), 'route present');
  assert.ok(app.includes('sanskritView'), 'sanskritView present');
  assert.ok(app.includes('navsanskrit'), 'nav handler present');
  assert.ok(app.includes('sk-panel'), 'tab panels rendered');
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  assert.ok(html.includes('id="navsanskrit"'), 'header item present');
  assert.ok(html.includes('?view=sanskrit'), 'header links view');
  const css = fs.readFileSync(path.join(ROOT, 'styles.css'), 'utf8');
  assert.ok(css.includes('.sk-panel'), 'panel styles present');
  assert.ok(css.includes('.sk-tabs'), 'tab styles present');
});
