const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');

test('emit_discovery --check is green and outputs are well-formed', () => {
  const out = execFileSync('python3', ['tools/emit_discovery.py', '--check'], { cwd: ROOT, encoding: 'utf8' });
  assert.ok(out.includes('GREEN'), out);
  const llms = fs.readFileSync(path.join(ROOT, 'llms.txt'), 'utf8');
  assert.ok(llms.startsWith('# Svatantrya Reader'), 'llms.txt title');
  assert.ok(llms.includes('?view=sanskrit'), 'sanskrit view linked');
  assert.ok(llms.includes('?view=biblio'), 'biblio view linked');
  assert.ok(llms.includes('/data/biblio.json'), 'biblio data linked');
  assert.ok(llms.includes('/data/pushing.json'), 'pushing digest linked');
  assert.ok(!llms.includes('{ORIGIN}'), 'no unexpanded template vars');
  assert.ok(llms.includes('How to cite'), 'citation section present');
  assert.ok(llms.includes('SELF_ATTESTED'), 'honesty vocabulary present');
  const sm = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
  assert.ok(sm.includes('<urlset'), 'sitemap root');
  assert.ok(sm.includes('?view=sanskrit'), 'sanskrit in sitemap');
  assert.ok(sm.includes('pushing.html'), 'pushing in sitemap');
  assert.ok(sm.includes('data/sanskrit/site/lesson-01.html'), 'static lessons crawlable without JS');
  assert.equal((sm.match(/lesson-\d+\.html/g) || []).length, 10, 'all 10 lessons listed');
  const robots = fs.readFileSync(path.join(ROOT, 'robots.txt'), 'utf8');
  assert.ok(robots.includes('Sitemap:'), 'robots points at sitemap');
  assert.ok(/GPTBot|ChatGPT-User|ClaudeBot/i.test(robots), 'AI crawlers allowed');
  assert.ok(robots.includes('OAI-SearchBot'), 'ChatGPT search crawler allowed');
  assert.ok(!/^Disallow: \/$/m.test(robots), 'nothing disallowed site-wide');
  const htmlHead = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  assert.ok(htmlHead.includes('name="description"'), 'meta description for snippets');
  const pushing = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'pushing.json'), 'utf8'));
  assert.ok(pushing.count >= 100, `pushing items: ${pushing.count}`);
  for (const it of pushing.items.slice(0, 20)) {
    assert.ok(it.id && it.question, 'pushing item shape');
    assert.ok(typeof it.verdict === 'string', 'verdict present (may be open)');
  }
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const ld = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  assert.equal(ld['@type'], 'WebSite');
  assert.ok(ld.url.includes('svread.pages.dev'), 'canonical origin');
});

test('no private material in crawler-facing files', () => {
  const secrets = [/cookie/i, /\bBearer [A-Za-z0-9\-_\.~+/=]{8,}/, /account_id/, /passwd/i,
    /password\s*[:=]/i, /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/];
  const files = [];
  const walk = dir => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.name.startsWith('.')) continue;
      const p = path.join(dir, e.name);
      if (e.isDirectory()) { if (!/pycache|node_modules/.test(p)) walk(p); }
      else if (/\.(json|txt|xml|html|md)$/.test(e.name)) files.push(p);
    }
  };
  walk(path.join(ROOT, 'data'));
  const pub = ['llms.txt', 'sitemap.xml', 'robots.txt', 'index.html']
    .map(f => path.join(ROOT, f));
  const offenders = [];
  for (const f of [...files, ...pub]) {
    let s;
    try { s = fs.readFileSync(f, 'utf8'); } catch { continue; }
    for (const re of secrets) {
      const m = s.match(re);
      if (m) offenders.push(`${path.relative(ROOT, f)}: ${re} -> ...${m[0].slice(0, 40)}`);
    }
  }
  assert.deepEqual(offenders, [], `private material must not ship:\n${offenders.join('\n')}`);
});
