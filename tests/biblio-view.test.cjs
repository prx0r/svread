const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');

test('emit_biblio --check is green and bundle is honest', (t) => {
  let out;
  try {
    out = execFileSync('python3', ['tools/emit_biblio.py', '--check'], { cwd: ROOT, encoding: 'utf8' });
  } catch (e) {
    // BLOCKED is its own state: exit 3 = this box's DB is BEHIND the committed
    // view (another box emitted an enriched bibliography). Skip with the
    // reason, never pass silently and never call it a defect.
    if (e.status === 3) {
      t.skip(String(e.stdout || '').trim().split('\n').pop());
      return;
    }
    // PR #7 P1: missing DB infrastructure SKIPs, never fails.
    if (/No module named 'psycopg2'|DB unreachable|connection|psql/i.test((e.stdout || '') + (e.message || ''))) {
      t.skip('no database/DB driver in this environment');
      return;
    }
    throw e;
  }
  assert.ok(out.includes('GREEN'), out);
  const d = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'biblio.json'), 'utf8'));
  assert.equal(d.format, 'svread-biblio/1');
  // Authoritative biblio (emitted from the system-of-record DB): 2,051 works,
  // 202 carrying translations with links/coverage. Local DB is a mirror.
  const auth = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'biblio.authority.json'), 'utf8'));
  assert.equal(auth.format, 'svatantrya.biblio-authority/1');
  assert.equal(auth.works, d.works.length, 'authority records this file');
  const crypto = require('node:crypto');
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, 'data', 'biblio.json'))).digest('hex'),
    auth.biblio_sha256, 'committed biblio matches the recorded authority digest');
  assert.ok(d.works.length >= 2000, `works: ${d.works.length}`);
  assert.ok(Object.keys(d.people || {}).length >= 10, 'people map present');
  const withTr = d.works.filter(w => (w.translations || []).length);
  assert.ok(withTr.length >= 100, `works with translations: ${withTr.length}`);
  // Known authority-DB gap: 427 PTW_ scholarship records carry an empty title
  // (the source rows have none). Recorded as a tolerance, not hidden.
  const untitled = d.works.filter(w => !String(w.title || '').trim());
  assert.ok(untitled.length / d.works.length < 0.25,
    `${untitled.length}/${d.works.length} untitled works — authority DB data gap`);
  for (const w of d.works) {
    assert.ok(w.id && typeof w.title === 'string', `work shape: ${w.id}`);
    if (w.status) assert.ok(/LOST|ATTESTED/.test(w.status), `${w.id} status labelled`);
    for (const t of (w.translations || [])) {
      assert.ok(t.lang && t.completeness, `${w.id} translation shape`);
    }
  }
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

test('emit_biblio_mirror --check is green and mirror rows are honest', (t) => {
  let out;
  try {
    out = execFileSync('python3', ['tools/emit_biblio_mirror.py', '--check'], { cwd: ROOT, encoding: 'utf8' });
  } catch (e) {
    // Exit 2 = infrastructure missing (no DB/driver/EVIDENCE): skip, never fail.
    if (e.status === 2) { t.skip('no database/DB driver in this environment'); return; }
    throw e;
  }
  assert.ok(out.includes('GREEN'), out);
  const m = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'biblio-mirror.json'), 'utf8'));
  assert.equal(m.format, 'svread-biblio-mirror/1', 'mirror format');
  assert.ok(m.works.length > 0, `mirror works: ${m.works.length}`);
  assert.ok(m.provenance && m.provenance.authority_works > 0, 'authority pin recorded');
  assert.ok(/pending authority sync/i.test(m.provenance.note || ''), 'mirror labelled, never authority');
  const b = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'biblio.json'), 'utf8'));
  assert.equal(m.provenance.authority_works, b.works.length, 'authority pin matches committed biblio');
  const bids = new Set(b.works.map(w => w.id));
  for (const w of m.works) {
    assert.ok(w.id && typeof w.title === 'string', `mirror row shape: ${w.id}`);
    assert.ok(!bids.has(w.id), `mirror row ${w.id} must not duplicate the authority file`);
  }
  const app = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
  assert.ok(app.includes('biblio-mirror.json'), 'reader merges the mirror file');
});
