/* about.test.cjs — the owner's statement is verbatim, reachable, and machine-readable. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8');

test('about page carries the owner statement verbatim', () => {
  const html = read('about/index.html');
  const md = read('about/index.md');
  const json = JSON.parse(read('about/about.json'));

  assert.equal(json.format, 'svatantrya.about/1');
  assert.equal(json.verbatim, true);
  // spelling is deliberately preserved: reuseable, practise
  assert.ok(json.goals[0].includes('free and reuseable translations of important sanskrit texts'));
  assert.ok(json.goals[1].includes('interactive practise modules'));
  assert.equal(json.goals.length, 4);
  assert.equal(json.goals_count, 4);
  assert.equal(json.mission, 'the inherent condition of sovereign freedom (my own interpretation)');
  assert.equal(json.contact, 'idonietas@gmail.com');
  assert.ok(json.dedication.startsWith('om namah shivayah'));
  assert.equal(
    json.goals[3],
    'the realisation of freedom for everyone, by themselves, independent of institutions');

  for (const s of ['svatantrya', 'inherent condition of sovereign freedom',
    'free and reuseable translations', 'interactive practise modules',
    'formalisation of tantric traditions and practices',
    'independent of institutions', 'idonietas@gmail.com', 'for siva',
    'om namah shivayah']) {
    assert.ok(md.includes(s), `md has: ${s}`);
  }
  for (const s of ['inherent condition of sovereign freedom', 'reuseable',
    'practise modules', 'idonietas@gmail.com', 'om namah shivayah']) {
    assert.ok(html.includes(s), `html has: ${s}`);
  }
  // canonical origin is the live domain, not a preview host
  assert.ok(html.includes('https://svatantrya.net/about/'));
  assert.ok(!html.includes('svread.pages.dev'));
  // structured data: org + goal list
  assert.ok(html.includes('schema.org') && html.includes('ItemList'));
  const ld = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  const list = ld['@graph'].find(x => x['@type'] === 'ItemList');
  assert.equal(list.itemListElement.length, 4);
});

test('about is reachable from the site nav and machine surfaces', () => {
  const idx = read('index.html');
  assert.ok(/href="about\/"[^>]*>About</.test(idx), 'About link in nav');
  const llms = read('llms.txt');
  assert.ok(llms.includes('/about/about.json'), 'llms.txt lists about.json');
  const cat = JSON.parse(read('ai-catalog.json'));
  assert.ok(JSON.stringify(cat).includes('about.json'), 'ai-catalog lists about.json');
  const sitemap = read('sitemap.xml');
  assert.ok(sitemap.includes('https://svatantrya.net/about/'), 'sitemap has about');
});
