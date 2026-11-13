const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');

// Regression: the 2026-11-11 wheels/brand breakage ("wheely big bug").
// - wheels.html nav used bare ?view= links, trapping the reader on the wheels
//   page (clicking Scholar kept you on /wheels?view=scholar).
// - the nav gained a Wheels tab; the product decision is one Sanskrit tab.
// - commit ec722e33 split the .topbar-container rule, leaving a dangling
//   declaration fragment that broke the dark nav (brand lost white/no-underline).
test('nav tabs: one Sanskrit entry, no Wheels tab, links work from any page', () => {
  for (const f of ['index.html', 'wheels.html']) {
    const html = fs.readFileSync(path.join(ROOT, f), 'utf8');
    assert.ok(!/id="navwheels"|>Wheels<\/a>/.test(html), `${f}: no Wheels tab`);
    assert.ok(html.includes('class="brand"'), `${f}: brand present`);
  }
  const index = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  for (const id of ['navscholar', 'navsanskrit', 'navpractice', 'navbiblio']) {
    assert.ok(index.includes(`id="${id}"`), `index keeps #${id}`);
  }
  const wheels = fs.readFileSync(path.join(ROOT, 'wheels.html'), 'utf8');
  assert.ok(!/href="\?view=/.test(wheels), 'wheels.html: no bare ?view= links (they trap non-root pages)');
  for (const v of ['scholar', 'sanskrit', 'practice', 'biblio']) {
    assert.ok(wheels.includes(`./?view=${v}`), `wheels.html links ./?view=${v} from anywhere`);
  }
});

test('dark nav css: topbar rule intact, brand white without underline', () => {
  const css = fs.readFileSync(path.join(ROOT, 'styles.css'), 'utf8');
  assert.ok(/\.topbar-container\{[^}]*align-items:center/.test(css),
    '.topbar-container rule carries its layout declarations (no dangling fragment)');
  assert.ok(!/^  align-items:center;gap:1\.2rem;padding:.5rem 1rem\}$/m.test(css),
    'no dangling topbar fragment outside its rule (the ec722e33 split)');
  const open = (css.match(/\{/g) || []).length, close = (css.match(/\}/g) || []).length;
  assert.equal(open, close, `braces balanced (${open} vs ${close})`);
  assert.ok(/\.brand\{[^}]*color:#fff !important/.test(css), 'brand stays white');
  assert.ok(/\.brand\{[^}]*text-decoration:none/.test(css), 'brand has no underline');
});
