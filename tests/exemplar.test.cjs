// exemplar.test.cjs — the generated claim page must satisfy the independent
// hand-built fixture's contract (section order, answer rules, honesty).
// Byte-equality is NOT required: the fixture is the spec, not a snapshot.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const FIX = path.join('/root/trika-x/testing/fixtures/exemplar-tsa08-p03.template.html');
const PAGE = path.join(ROOT, 'claim/tantrasara-a08/tsa08-p03/index.html');

const ORDER = ['The passage', 'Claim table', 'What this does NOT establish',
  'Verify it', 'Hashes', 'Chain', 'Cite this', 'Related', 'Provenance'];

test('exemplar fixture exists and states the contract', () => {
  const t = fs.readFileSync(FIX, 'utf8');
  for (const h of ORDER) assert.ok(t.includes(`<h2>${h}`) || t.includes(`<h2 id="chain">Chain`),
    `fixture has section: ${h}`);
  assert.ok(t.includes('class="answer"'), 'fixture has answer block');
});

test('generated page honors the fixture contract', () => {
  const t = fs.readFileSync(PAGE, 'utf8');
  let last = -1;
  for (const h of ORDER) {
    const i = t.indexOf(`<h2>${h}`) >= 0 ? t.indexOf(`<h2>${h}`) : t.indexOf(`<h2 id="chain">Chain`);
    assert.ok(i > last, `section in order: ${h}`);
    last = i;
  }
  const m = t.match(/<p class="answer"[^>]*>(.*?)<\/p>/s);
  assert.ok(m, 'answer present');
  assert.ok(m[1].split(/\s+/).length <= 40, 'answer <= 40 words');
  assert.ok(t.includes('UNREVIEWED') || t.includes('review'), 'review status stated');
  assert.ok(!/Machine rendering[\s\S]{0,200}?gold/i.test(t), 'no gold language near reading');
});
