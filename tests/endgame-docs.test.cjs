const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const ROOT = process.cwd();
const idx = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/endgame-docs.json'), 'utf8'));

test('vendored endgame docs match their sources byte for byte', () => {
  assert.equal(idx.format, 'svatantrya.endgame-docs/1');
  assert.ok(idx.docs.length >= 12, 'the strategic docs are vendored');
  for (const d of idx.docs) {
    const src = fs.readFileSync(d.source);
    const sha = crypto.createHash('sha256').update(src).digest('hex');
    assert.equal(sha, d.sha256, 'source hash recorded for ' + d.slug);
    const copy = fs.readFileSync(path.join(ROOT, 'docs/endgame', d.slug + '.md'), 'utf8');
    assert.ok(copy.startsWith('<!-- vendored:'), d.slug + ' carries provenance');
    assert.ok(copy.includes('sha256=' + d.sha256), d.slug + ' copy matches recorded hash');
    assert.ok(copy.includes(src.toString('utf8').trim().slice(0, 120)), d.slug + ' body is the source');
  }
});

test('estate index points at the endgame docs and a reading order', () => {
  const e = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/estate-index.json'), 'utf8'));
  assert.ok(Array.isArray(e.endgame_docs) && e.endgame_docs.length >= 12);
  assert.ok(Array.isArray(e.reading_order) && e.reading_order.length >= 5);
  assert.ok(e.plugin_recipes.length >= 6, 'recipes stay listed');
  for (const d of e.endgame_docs) {
    assert.ok(d.url.startsWith('/docs/endgame/'), 'url is site-relative');
  }
});
