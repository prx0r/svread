const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');

test('emit_biblio --check is green and bundle is honest', () => {
  const out = execFileSync('python3', ['tools/emit_biblio.py', '--check'], { cwd: ROOT, encoding: 'utf8' });
  assert.ok(out.includes('GREEN'), out);
  const d = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'biblio.json'), 'utf8'));
  assert.equal(d.format, 'svread-biblio/1');
  assert.ok(d.works.length >= 500, `works: ${d.works.length}`);
  assert.ok(d.counts.lost_or_unverified >= 7, 'lost works present');
  assert.ok(d.counts.ours_translations >= 100, 'ours translations present');
  assert.ok(Object.keys(d.people || {}).length >= 10, 'people map present');
  for (const w of d.works) {
    assert.ok(w.id && w.title, `work shape: ${w.id}`);
    if (w.status) assert.ok(/LOST|ATTESTED/.test(w.status), `${w.id} status labelled`);
    for (const t of (w.translations || [])) {
      assert.ok(t.lang && t.completeness, `${w.id} translation shape`);
    }
  }
  const lost = d.works.filter(w => (w.status || '').startsWith('LOST'));
  assert.ok(lost.length >= 7, `lost count: ${lost.length}`);
  assert.ok(lost.every(w => (w.status_basis || w.status || '').length > 10), 'lost basis recorded');
});

test('biblio view wired without a header tab', () => {
  const app = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
  assert.ok(app.includes('biblioView'), 'biblioView present');
  assert.ok(app.includes("?view=biblio") || app.includes("'biblio'"), 'route present');
  assert.ok(app.includes('sk-table'), 'table markup present');
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  assert.ok(!/Bibliography/.test(html), 'no header tab (scholar + sanskrit only)');
  const css = fs.readFileSync(path.join(ROOT, 'styles.css'), 'utf8');
  assert.ok(css.includes('.sk-table'), 'table styles present');
  assert.ok(css.includes('.sk-badge'), 'badge styles present');
});
