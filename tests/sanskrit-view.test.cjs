const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const SK = path.join(ROOT, 'data', 'sanskrit');

test('emit outputs exist and validate (verbatim import)', () => {
  const index = JSON.parse(fs.readFileSync(path.join(SK, 'index.json'), 'utf8'));
  assert.equal(index.lessons.length, 10);
  const rules = JSON.parse(fs.readFileSync(path.join(SK, 'rule-boxes.json'), 'utf8'));
  assert.equal(rules.count, rules.rule_boxes.length);
  assert.ok(rules.count >= 8);
  for (const e of index.lessons) {
    assert.ok(e.html && e.id && e.title && e.source_ref && e.work, `index row: ${e.id}`);
    const html = fs.readFileSync(path.join(SK, e.html), 'utf8');
    for (const d of ['learn', 'decode', 'recognise']) {
      assert.ok(html.includes(`data-d="${d}"`), `${e.id} panel ${d}`);
    }
    assert.ok(html.includes('id="witness"'), `${e.id} witness`);
    assert.ok(html.includes('id="recite"'), `${e.id} recite`);
    assert.ok(html.includes('Practice and mastery'), `${e.id} practice`);
    assert.ok(!html.includes('googleapis'), `${e.id} no font CDN`);
    assert.ok(!/src="https?:/.test(html), `${e.id} no external scripts`);
    assert.ok(html.includes('data-sv-localfonts'), `${e.id} local fonts`);
  }
  const fonts = fs.readdirSync(path.join(SK, 'fonts')).filter(f => f.endsWith('.ttf'));
  assert.ok(fonts.length >= 1, 'vendored fonts present');
  const prov = JSON.parse(fs.readFileSync(path.join(SK, 'provenance.json'), 'utf8'));
  assert.match(prov.bookfactory_rev, /^[0-9a-f]{7,40}$/);
  assert.ok(prov.files['site/lesson-01.html'], 'lesson hashes recorded');
});

test('sanskrit + index views wired in app and header', () => {
  const app = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
  assert.ok(app.includes('sanskritView'), 'sanskrit view present');
  assert.ok(app.includes('sk-frame'), 'iframe lesson present');
  assert.ok(app.includes('skSyncFromFrame'), 'context sync present');
  assert.ok(app.includes('skAskPrefill'), 'ask prefill present');
  assert.ok(app.includes('biblioView'), 'biblio view present');
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  assert.ok(html.includes('id="navsanskrit"'), 'sanskrit header item');
  assert.ok(html.includes('id="navbiblio"'), 'index header item');
  assert.ok(!/Pushing Lab/.test(html), 'no pushing tab');
  assert.ok(app.includes('sk-wheels'), 'sanskrit tab embeds the wheel flow');
  assert.ok(app.includes('wheels.html#level-1') && app.includes('wheels.html#level-6'), 'level deep links present');
  const css = fs.readFileSync(path.join(ROOT, 'styles.css'), 'utf8');
  assert.ok(css.includes('.sk-rulebox'), 'rulebox styles present');
  assert.ok(css.includes('.sk-table'), 'biblio table styles present');
});
