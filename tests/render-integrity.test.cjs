// render-integrity.test.cjs — RENDER-level checks (bytes/claims checks missed this class).
// Root bug 2026-11-10: ipvv `ipv.txt` begins with `### Provenance...` header lines;
// the last-resort source path promoted them to §1 and IAST_DEVA transliterated
// ASCII metadata into Devanagari ("Pरोवेनन्चे"). Four checks, one class:
//   A  IAST_DEVA never mangles source/licence metadata (property)
//   B  extractProvenance pulls headers out of the verse flow (golden fixture)
//   C  no bundled reader data ships `#`-header lines as sanskrit content
//   D  no latin-letter-directly-glued-to-Devanagari on any published claim page
// Plus real-data: the actual ipvv ipv.txt (skips cleanly if checkout absent).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
const app = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');

function harness() {
  const context = vm.createContext({
    fetch: async () => new Response('', {status: 404}),
    URL, URLSearchParams, TextEncoder, TextDecoder, Response, crypto: require('node:crypto').webcrypto,
    location: {search: '?work=fixture', href: 'https://svread.pages.dev/?work=fixture'},
    window: {}, localStorage: {getItem: () => null, setItem() {}},
    document: {querySelector: () => null, documentElement: {style: {setProperty(){}}}},
  });
  const source = app.replace('main();\n})();',
    'globalThis.RT={extractProvenance,IAST_DEVA,saWords,safeReaderVerse,esc,applyPrefs};\n})();');
  assert.notEqual(source, app);
  vm.runInContext(source, context);
  return context.RT;
}
const RT = harness();

const DEV = (s) => /[\u0900-\u097F]/.test(s);
const META = [
  '### Provenance: GRETIL (Iyer/Pandey ed.) · CC BY-NC-SA 4.0',
  '### Source file: 6_sastra/3_phil/sa_abhinavagupta-IzvarapratyabhijJAvimarzinI.txt',
  '### Vendored: site/data/sanskrit/ipv.txt (research/education use; respect licence)',
  'CC BY-NC-SA 4.0',
];

test('A: IAST_DEVA never mangles source/licence metadata; real Sanskrit still converts', () => {
  for (const m of META) {
    assert.equal(RT.IAST_DEVA.convert(m), m, `metadata altered: ${m}`);
  }
  // guard must NOT disable actual conversion
  const dev = RT.IAST_DEVA.convert('bhagavat');
  assert.ok(DEV(dev), 'Sanskrit still converts to Devanagari');
  assert.notEqual(dev, 'bhagavat');
  // punctuation path still converts (per-char '|'. -> single danda)
  assert.equal(RT.IAST_DEVA.convert('||'), '\u0964\u0964');
});

test('B: extractProvenance — headers leave the verse flow, verbatim', () => {
  const input = [
    {id: 'x-s1', sa: META[0] + '\n' + META[1] + '\n' + META[2], gate: 'WITHHELD'},
    {id: 'x-s2', sa: 'o\u1e43 nama\u1e25 sa\u1e43vidvapu\u1e63e \u015biv\u0101ya /', gate: 'WITHHELD'},
    {id: 'x-s3', sa: 'first line\n### Source file: y.txt\nsecond line', gate: 'WITHHELD'},
  ];
  const {verses, provenance} = RT.extractProvenance(input);
  assert.equal(provenance.length, 4, 'all header lines extracted');
  assert.ok(provenance[0].startsWith('Provenance: GRETIL'), 'header text verbatim minus #');
  assert.equal(verses.length, 2, 'header-only paragraph never becomes a verse');
  for (const v of verses) assert.ok(!/###/.test(v.sa), `### leaked into verse ${v.id}`);
  assert.ok(verses[0].sa.startsWith('o\u1e43'), 'real verse untouched');
  assert.ok(verses[1].sa.includes('first line') && verses[1].sa.includes('second line'),
    'mixed paragraph keeps body');
  // belt: even if a header reached the converter, it passes through unchanged
  for (const p of provenance) assert.equal(RT.IAST_DEVA.convert(p), p);
  // same-line marker+body (`# Text  <verse>`, bodhapancadasika class): body kept
  const split = RT.extractProvenance([
    {id: 'b1', sa: '# Text  anastamitabh\u0101r\u016bpas tejas\u0101\u1e43 tamas\u0101m api |'},
  ]);
  assert.equal(split.verses.length, 1);
  assert.ok(split.verses[0].sa.startsWith('anastamitabh'), 'body survives marker split');
  assert.ok(!split.verses[0].sa.startsWith('#'), 'marker removed from verse');
  assert.ok(split.provenance.includes('Text'), 'label recorded as provenance');
});

test('C: no bundled reader data ships #-headers as sanskrit content', () => {
  const bad = [];
  for (const f of fs.readdirSync(path.join(ROOT, 'data'))) {
    if (!f.endsWith('.json') || ['index.json', 'biblio.json'].includes(f)) continue;
    let doc; try { doc = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', f), 'utf8')); } catch { continue; }
    if (!doc || typeof doc !== 'object') continue;
    const rows = Array.isArray(doc.chunks) ? doc.chunks : (Array.isArray(doc.verses) ? doc.verses : []);
    for (const r of rows) {
      const sa = String((r && (r.sanskrit || r.sa)) || '').trim();
      if (sa.startsWith('#')) bad.push(`${f}:${r.chunk || r.id || '?'}`);
    }
  }
  assert.deepEqual(bad, [], `header lines in bundle content: ${bad.slice(0, 5)}`);
});

test('D: no latin-letter glued to Devanagari on any published claim page', () => {
  const bad = [];
  const glue = /[\u0041-\u024F][\u0900-\u097F]/;  // e.g. "Pरो..." — the mangling signature
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, {withFileTypes: true})) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name === 'index.html') {
        const t = fs.readFileSync(p, 'utf8');
        if (glue.test(t)) bad.push(path.relative(ROOT, p));
      }
    }
  };
  const claimDir = path.join(ROOT, 'claim');
  if (fs.existsSync(claimDir)) walk(claimDir);
  assert.deepEqual(bad, [], `mixed-script glue: ${bad.slice(0, 5)}`);
});

test('real data: ipvv ipv.txt headers extract cleanly (sibling checkout; skips if absent)', (t) => {
  const f = '/root/ipvv/site/data/sanskrit/ipv.txt';
  if (!fs.existsSync(f)) { t.skip('ipvv checkout not present'); return; }
  const paras = fs.readFileSync(f, 'utf8')
    .split(/\n{2,}|\n(?=[\u0900-\u097F])/).map(p => p.trim()).filter(Boolean)
    .map(p => ({id: 'ipv-s0', sa: p, gate: 'WITHHELD'}));
  const {verses, provenance} = RT.extractProvenance(paras);
  assert.ok(provenance.length >= 3, 'three provenance headers found');
  assert.ok(provenance[0].startsWith('Provenance:'), 'first header verbatim');
  assert.ok(verses.length > 0, 'reading text remains after extraction');
  for (const v of verses.slice(0, 20)) {
    assert.ok(!v.sa.startsWith('#'), 'no header in early verses');
    assert.ok(!DEV(RT.IAST_DEVA.convert(v.sa.slice(0, 0))), 'sanity');
  }
  // the exact owner-reported failure: header line must convert to itself
  assert.equal(RT.IAST_DEVA.convert(provenance[0]), provenance[0]);
});
