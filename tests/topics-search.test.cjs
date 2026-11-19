const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');
const py = (args) => execFileSync('python3', args, { cwd: ROOT, encoding: 'utf8' });

test('search index and topic pages are deterministic', () => {
  assert.match(py(['tools/emit_search_index.py', '--check']), /GREEN/);
  assert.match(py(['tools/emit_topics.py', '--check']), /GREEN/);
});

test('an ASCII query finds the City of Eight across levels', () => {
  // The user-facing question: "puryastaka" with no diacritics must locate
  // the loci in Tantrasāra and Tantrāloka, and report which levels exist.
  const out = JSON.parse(py(['tools/search_chunks.py', 'puryastaka', '--top', '40', '--json']));
  assert.ok(out.total >= 5, `expected several matches, got ${out.total}`);
  const works = new Set(out.records.map((r) => r.work));
  for (const w of ['tantrasara-a13', 'tantraloka-a24', 'tantraloka-a15', 'tantraloka-a09']) {
    assert.ok(works.has(w), `missing ${w} in search results`);
  }
  // Full-stack witness: Tantrasāra 13.24 has level analyses, not just source
  // (query scoped to the work so the source record is not crowded out).
  const tsOut = JSON.parse(py(['tools/search_chunks.py', 'puryastaka', '--work', 'tantrasara-a13', '--top', '20', '--json']));
  const ts = tsOut.records;
  const layers = new Set(ts.map((r) => r.layer));
  for (const l of ['source', 't1', 'l2', 'argmap']) {
    assert.ok(layers.has(l), `tantrasara-a13 missing layer ${l} in results`);
  }
  // Search may never claim a level the layers index does not record for a
  // work (the corpus gains levels over time; the invariant is no invention).
  const li = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'layers-index.json'), 'utf8'));
  const allowed = new Map(li.works.map((w) => [w.work,
    new Set(['source', 't1-doc', ...w.songs.flatMap((s) => Object.keys(s.layers))])]));
  for (const r of out.records) {
    const ok = allowed.get(r.work);
    assert.ok(!ok || ok.has(r.layer), `${r.work} claimed unrecorded layer ${r.layer}`);
  }
});

test('topic page is answer-first with tier + verbatim evidence', () => {
  const md = fs.readFileSync(path.join(ROOT, 'topics', 'puryastaka', 'index.md'), 'utf8');
  assert.match(md, /^# The City of Eight/);
  assert.match(md, /Yes — Abhinavagupta explicitly equates the body/);
  assert.match(md, /## \[T\]/, 'tiered claim missing');
  assert.match(md, /dehapuryaṣṭakādau/, 'verbatim Sanskrit missing');
  assert.match(md, /tantrasara-a13/, 'chunk locator missing');
  assert.match(md, /Caveats/);
  const html = fs.readFileSync(path.join(ROOT, 'topics', 'puryastaka', 'index.html'), 'utf8');
  assert.match(html, /class="tier"/);
  assert.match(html, /lang="sa"/);
});

test('topics + search are discoverable by agents', () => {
  const llms = fs.readFileSync(path.join(ROOT, 'llms.txt'), 'utf8');
  assert.match(llms, /\/data\/search-index\/records\.jsonl/);
  assert.match(llms, /\/topics\//);
  assert.match(llms, /search_chunks/);
  const sm = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
  assert.match(sm, /\/topics\/puryastaka\//);
  const idx = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'topics', 'index.json'), 'utf8'));
  assert.ok(idx.topics.puryastaka);
});
