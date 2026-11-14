// headers-frame-policy.test.cjs — the site-wide frame DENY stays, but the two
// pages the reader embeds (wheels.html and data/sanskrit/*.html) must be
// same-origin frameable, and ONLY those. Cloudflare Pages _headers accumulates
// overlapping rules, so each exception must `! X-Frame-Options` before setting
// SAMEORIGIN. If this test fails, a self-embed is refused by the browser again.
const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');

const HEADERS = fs.readFileSync(path.join(__dirname, '..', '_headers'), 'utf8');

// Parse _headers into [{pattern, lines:[...]}] blocks.
function blocks(src) {
  const out = [];
  let cur = null;
  for (const raw of src.split('\n')) {
    const line = raw.replace(/\r$/, '');
    if (!line.trim() || line.trim().startsWith('#')) continue;
    if (!/^\s/.test(line)) { cur = { pattern: line.trim(), lines: [] }; out.push(cur); }
    else if (cur) cur.lines.push(line.trim());
  }
  return out;
}

const B = blocks(HEADERS);
const find = (p) => B.filter((b) => b.pattern === p);

test('site-wide rule still denies framing', () => {
  const g = find('/*');
  assert.equal(g.length, 1, 'exactly one /* block');
  assert.ok(g[0].lines.includes('X-Frame-Options: DENY'),
    'global X-Frame-Options: DENY must remain');
});

for (const p of ['/wheels.html', '/data/sanskrit/*']) {
  test(`${p} detaches DENY and sets SAMEORIGIN`, () => {
    const b = find(p);
    assert.equal(b.length, 1, `exactly one ${p} block`);
    const lines = b[0].lines;
    const detach = lines.indexOf('! X-Frame-Options');
    const set = lines.indexOf('X-Frame-Options: SAMEORIGIN');
    assert.ok(detach !== -1, `${p} must detach the global header (! X-Frame-Options)`);
    assert.ok(set !== -1, `${p} must set X-Frame-Options: SAMEORIGIN`);
    assert.ok(detach < set, `${p} must detach before setting SAMEORIGIN`);
    // The exception must appear AFTER the global /* block (later wins).
    const gi = B.indexOf(find('/*')[0]);
    const bi = B.indexOf(b[0]);
    assert.ok(bi > gi, `${p} exception must come after the /* block`);
  });
}

test('no other path loosens the frame policy', () => {
  const loosened = B.filter((b) => b.lines.some((l) =>
    /^X-Frame-Options:\s*(SAMEORIGIN|ALLOW-FROM)/i.test(l)));
  const patterns = loosened.map((b) => b.pattern).sort();
  assert.deepEqual(patterns, ['/data/sanskrit/*', '/wheels.html'],
    'only the two reader-embedded paths may set SAMEORIGIN');
});
