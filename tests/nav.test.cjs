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

test('phone lane toggle: wired, hidden on desktop, single-lane classes', () => {
  const app = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
  const css = fs.readFileSync(path.join(ROOT, 'styles.css'), 'utf8');
  assert.ok(app.includes('id="lanetog"'), 'lane toggle markup');
  assert.ok(app.includes('applyMobLane'), 'lane apply fn');
  assert.ok(app.includes("mob-sa-only") && app.includes("mob-en-only"), 'single-lane classes');
  assert.ok(/@media \(max-width:640px\)[\s\S]*body\.split \.lanetog\{display:inline-flex/.test(css),
    'toggle only shows on phone when split');
  assert.ok(/\.lanetog\{display:none\}/.test(css), 'hidden by default (desktop)');
});

test('ChatGPT prompt card: present on every view, names real tools', () => {
  const app = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
  assert.ok(app.includes('mountChatGPT'), 'mount helper');
  assert.ok(app.includes("https://mcp.svatantrya.net/mcp"), 'public MCP url');
  assert.ok(app.includes("https://svatantrya.net/plugins/"), 'install url');
  for (const kind of ['sanskrit','practice','verify','biblio','scholar','reader']) {
    assert.ok(app.includes(`mountChatGPT('${kind}')`), `card mounted on ${kind}`);
  }
  const wheels = fs.readFileSync(path.join(ROOT, 'wheels.html'), 'utf8');
  const corpus = app + '\n' + wheels;
  for (const tool of ['scholar__wheel_harness','scholar__wheel_verify','compose__wheels',
                      'openpatala__resolve','formal__trace','scholar__passage_evidence']) {
    assert.ok(corpus.includes(tool), `prompt names ${tool}`);
  }
  assert.ok(wheels.includes('Run this with ChatGPT'), 'wheels page card');
  assert.ok(wheels.includes('mcp.svatantrya.net/mcp'), 'wheels prompt has endpoint');
  const css = fs.readFileSync(path.join(ROOT, 'styles.css'), 'utf8');
  assert.ok(css.includes('body.embed .cg{display:none}'), 'no duplicate card in embedded wheels');
});
