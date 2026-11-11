/* wheels.test.cjs — grammar packs + wheel datasets + wheels.html integrity.
   Law enforced: no invented surfaces. Every option references a DERIVED or
   CURATED pack entry; every link resolves to a real work bundle/verse/lesson. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8');
const J = p => JSON.parse(read(p));

test('grammar pack: derived surfaces, honest statuses', () => {
  const pack = J('data/grammar/wheel-pack.json');
  assert.equal(pack.format, 'svatantrya.grammar-pack/1');
  assert.equal(pack.status, 'machine-generated-unreviewed');
  assert.ok(pack.generator && pack.generator.name === 'vidyut', 'generator recorded');
  assert.ok(pack.entries.length >= 30, 'pack has the wheel vocab');
  const byId = new Map(pack.entries.map(e => [e.id, e]));
  for (const e of pack.entries) {
    assert.ok(e.id && e.kind, `entry shape: ${e.id}`);
    if (e.status === 'DERIVED') {
      assert.ok(e.iast && e.deva, `${e.id} has surfaces`);
      assert.ok(Array.isArray(e.prakriya) && e.prakriya.length > 0, `${e.id} has trace`);
      for (const s of e.prakriya) assert.ok(s.sutra, `${e.id} step has sutra code`);
      // no invented traces: every derived entry must cite at least one real sutra rule
      assert.ok((e.machine_rules || []).length > 0, `${e.id} cites machine rules`);
    } else {
      assert.ok(e.status.startsWith('PENDING') || e.status === 'CURATED', `${e.id} honest status`);
      assert.ok(!e.prakriya || e.prakriya.length === 0, `${e.id} no trace without derivation`);
    }
  }
  // spot checks on the thesis corrections
  assert.equal(byId.get('anya-tasil').iast, 'anyataḥ', 'thesis typo corrected by machine');
  assert.equal(byId.get('kim-thal').iast, 'kathā', 'kim+thal is katha, not katham');
  assert.equal(byId.get('kim-katham').status, 'CURATED', 'katham is curated-note only');
  assert.equal(byId.get('sukhin-stri-nom-sg').iast, 'sukhinī', 'feminine agreement derives');
  assert.equal(byId.get('as-lat-Uttama-Eka').iast, 'asmi', 'asmi derives');
  assert.equal(byId.get('as-lat-Prathama-Eka').iast, 'asti', 'asti derives');
});

test('wheel links resolve to real verses and lessons', () => {
  const doc = J('data/grammar/wheel-links.json');
  const lessons = J('data/sanskrit/index.json').lessons;
  const lessonIds = new Set(lessons.map(l => l.id));
  const lessonWorks = new Set(lessons.map(l => l.work));
  let checked = 0;
  for (const [eid, lk] of Object.entries(doc.links)) {
    for (const r of (lk.verses || []).slice(0, 3)) {
      // work bundle exists (reader bundle or l0 file)
      const bundle = path.join(ROOT, 'data', `${r.work}.json`);
      const l0 = path.join(ROOT, 'data', 'l0', `${r.work}.json`);
      assert.ok(fs.existsSync(bundle) || fs.existsSync(l0), `${eid}: work file for ${r.work}`);
      checked++;
    }
    for (const l of (lk.lessons || [])) {
      assert.ok(lessonIds.has(l), `${eid}: lesson ${l} exists`);
    }
  }
  assert.ok(checked > 10, 'links actually checked');
});

test('wheel datasets reference ready pack entries only', () => {
  const pack = J('data/grammar/wheel-pack.json');
  const ready = new Set(pack.entries.filter(e => e.status === 'DERIVED' || e.status === 'CURATED').map(e => e.id));
  const word = J('data/wheels/word.json');
  const sent = J('data/wheels/sentence.json');
  const trika = J('data/wheels/trika.json');
  const need = [];
  for (const r of word.rows) for (const k of Object.keys(r.cells)) {
    need.push(r.cells[k].derived.id);
    if (r.cells[k].special) need.push(word.specials[r.cells[k].special].id);
  }
  for (const ring of sent.rings) for (const o of ring.options) {
    if (typeof o === 'string') { need.push(o); continue; }
    if (ring.id === 'subject') { need.push(o.verb_surface.id, o.adj_surface.id); continue; }
    need.push(o.id);
  }
  for (const id of need) assert.ok(ready.has(id), `wheel option ready: ${id}`);
  assert.equal(word.rows.length, 5, 'five bases');
  assert.ok(sent.rings.find(r => r.id === 'subject').options.length === 4, 'four subjects');
  // trika concept refs resolve to real files when LINKED
  for (const w of trika.wheels) {
    assert.ok(w.options.length >= 3, `${w.id} has options`);
    for (const o of w.options) {
      if (o.source_status === 'LINKED') {
        assert.ok(o.concept_ref && o.concept_ref.file, `${o.id} has ref`);
        assert.ok(fs.existsSync(`/root/translation-work/lore/concepts/${o.concept_ref.file}`), `${o.id} concept file exists`);
        const d = JSON.parse(fs.readFileSync(`/root/translation-work/lore/concepts/${o.concept_ref.file}`, 'utf8'));
        assert.ok((d.definition || '').includes(o.concept_ref.definition.slice(0, 40)), `${o.id} quote matches`);
      } else {
        assert.equal(o.source_status, 'PENDING', `${o.id} honest pending`);
        assert.ok(!o.concept_ref, `${o.id} no invented ref`);
      }
    }
  }
});

test('wheels.html pre-renders with no JS needed', () => {
  const html = read('wheels.html');
  for (const s of ['kutra', 'tatra', 'sarvatra', 'katham', 'sukhin', 'asmi', 'Trika wheels', 'wheels.js']) {
    assert.ok(html.includes(s), `wheels.html contains ${s}`);
  }
  assert.ok(html.includes('id="wheel-word"') && html.includes('id="wheel-sentence"'), 'embedded datasets');
  assert.ok(html.includes('svatantrya.net/wheels.html'), 'canonical origin');
  assert.ok(html.includes('id="script-toggle"'), 'script toggle present');
  assert.ok(html.includes('id="word-disc"'), 'disc view present');
  assert.ok(html.includes('id="drill-body"'), 'drill present');
  assert.ok(html.includes('vendor/sanskrit-bruno-wheels/data.js'), 'curated tier loaded');
  assert.ok(html.includes('id="wheel-crosscheck"'), 'crosscheck summary embedded');
});

test('vendored curated tier is byte-identical upstream + crosscheck fresh', () => {
  const attr = read('vendor/sanskrit-bruno-wheels/ATTRIBUTION.md');
  assert.ok(attr.includes('MIT'), 'license noted');
  assert.ok(fs.existsSync(path.join(ROOT, 'vendor/sanskrit-bruno-wheels/LICENSE')), 'license vendored');
  const cc = J('data/grammar/crosscheck.json');
  assert.equal(cc.format, 'svatantrya.curated-crosscheck/1');
  const crypto = require('node:crypto');
  const sha = crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, 'vendor/sanskrit-bruno-wheels/data.js'))).digest('hex');
  assert.equal(sha, cc.vendor_sha256, 'crosscheck matches current vendor data.js');
  const rows = new Map(cc.rows.map(r => [r.id, r]));
  assert.equal(cc.rows.length, 23 + 1, '23 cells + 1 intentional gap');
  assert.equal(rows.get('kim-manner').agree, false, 'katham flagship disagree recorded');
  assert.ok((rows.get('kim-manner').machine_surfaces || []).includes('kathā'), 'machine katha recorded');
  assert.equal(rows.get('sarva-time').agree, true, 'sarvada agrees via second reading');
  assert.ok(rows.get('eka-manner').agree === null, 'intentional gap stays null');
  assert.equal(cc.summary.agree + cc.summary.disagree + cc.summary.gap, cc.rows.length, 'summary adds up');
});

test('karaka wheel: six relationships, honest examples', () => {
  const k = J('data/wheels/karaka.json');
  assert.equal(k.format, 'svatantrya.wheel-karaka/1');
  const opts = k.wheels[0].options;
  assert.equal(opts.length, 6);
  const ids = opts.map(o => o.id);
  for (const want of ['kartr', 'karman', 'karana', 'sampradana', 'apadana', 'adhikarana']) {
    assert.ok(ids.includes(want), `karaka ${want}`);
  }
  const pack = J('data/grammar/wheel-pack.json');
  const surfs = new Set();
  for (const e of pack.entries) {
    if (e.iast) surfs.add(e.iast.replace(/\s+/g, ' '));
    for (const s of (e.all_surfaces || [])) surfs.add(s.iast);
  }
  const cur = JSON.parse(require('node:child_process')
    .execSync('node -e "const D=require(\'/root/svread/vendor/sanskrit-bruno-wheels/data.js\');console.log(JSON.stringify(D))"', {encoding: 'utf8'}));
  const curForms = new Set();
  for (const p of cur.predicates) for (const k2 of Object.keys(p.forms)) curForms.add(p.forms[k2]);
  for (const o of opts) {
    assert.ok(/^1\.4\.\d+$/.test(o.sutra), `${o.id} sutra`);
    assert.ok(o.vibhakti && o.example && o.example_en, `${o.id} complete`);
    // every example word must exist in our own datasets (pack or curated verbs)
    const norm = s => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z]/g, '');
    const packN = new Set([...surfs].map(norm));
    const curN = new Set([...curForms].map(norm));
    for (const w of o.example.split(/\s+/)) {
      const nw = norm(w);
      const inPack = [...packN].some(s => nw && (s.includes(nw) || nw.includes(s)));
      const inCur = [...curN].some(s => nw && (s.includes(nw) || nw.includes(s)));
      assert.ok(inPack || inCur, `${o.id} example word on file: ${w}`);
    }
  }
});

test('tutor levels are machine-readable and resolve', () => {
  const levels = ['level-01-bases.md', 'level-02-endings.md', 'level-03-subject-verb.md',
    'level-04-time-place.md', 'level-05-questions.md', 'level-06-karaka.md'];
  for (const f of levels) {
    const t = read(`data/wheels/tutor/${f}`);
    assert.ok(t.includes('https://svatantrya.net/data/'), `${f} cites data URLs`);
    for (const m of t.matchAll(/https:\/\/svatantrya\.net\/(data\/[^\s)]+|vendor\/[^\s)]+)/g)) {
      const local = path.join(ROOT, m[1]);
      assert.ok(fs.existsSync(local), `${f} -> ${m[1]} exists`);
    }
  }
  const html = read('wheels.html');
  assert.ok(html.includes('id="wheel-level"'), 'level selector present');
  assert.ok(html.includes('data-min="5"'), 'ring levels present');
  assert.ok(html.includes('data-karaka="karaka"'), 'karaka wheel present');
  assert.ok(html.includes('level-06-karaka.md'), 'tutor index present');
  assert.ok(html.includes('id="journey"'), 'journey section present');
  assert.ok(html.includes('journey.js'), 'journey script present');
  assert.ok(html.includes('data-script="iast"') && html.includes('type="checkbox"'), 'combo script toggle present');
});

test('harness is the one-fetch program', () => {
  const h = J('data/wheels/harness.json');
  assert.equal(h.format, 'svatantrya.wheel-harness/1');
  assert.ok(h.harness_prompt.endsWith('/data/wheels/HARNESS.md'), 'prompt linked');
  assert.ok(fs.existsSync(path.join(ROOT, 'data/wheels/HARNESS.md')), 'prompt vendored');
  for (const k of ['word', 'sentence', 'karaka', 'trika']) {
    assert.ok(h.wheels[k] && h.wheels[k].format, `wheel embedded: ${k}`);
  }
  assert.equal(h.decision_tree.stages.length, 6, 'six stages');
  assert.ok(h.decision_tree.stages.every(s => s.level && s.name && s.needs !== undefined && s.pass && s.on_pass && s.on_fail), 'stages complete');
  const pack = J('data/grammar/wheel-pack.json');
  const ready = new Set(pack.entries.filter(e => e.status === 'DERIVED' || e.status === 'CURATED').map(e => e.id));
  for (const id of Object.keys(h.verify.pack_index)) assert.ok(ready.has(id), `pack index ready: ${id}`);
  const cc = J('data/grammar/crosscheck.json');
  assert.deepEqual(h.verify.crosscheck_summary, cc.summary, 'crosscheck summary matches');
  assert.equal(h.verify.disagreements.length, cc.summary.disagree, 'every disagree recorded');
  // every local URL in the harness resolves to a file on disk
  const urls = [];
  const walk = o => {
    if (typeof o === 'string' && o.startsWith('https://svatantrya.net/')) urls.push(o);
    else if (Array.isArray(o)) o.forEach(walk);
    else if (o && typeof o === 'object') Object.values(o).forEach(walk);
  };
  walk(h);
  let checked = 0;
  for (const u of new Set(urls)) {
    if (u.includes('<') || u.includes('>')) continue; // placeholder patterns, not files
    const clean = u.split(' ')[0].split('#')[0].split('?')[0];
    const m = clean.match(/^https:\/\/svatantrya\.net\/((?:data|vendor)\/.+|wheels\.html)$/);
    if (!m) continue; // reader/claim routes with placeholders or query strings
    const local = path.join(ROOT, m[1]);
    assert.ok(fs.existsSync(local), `harness URL resolves: ${m[1]}`);
    checked++;
  }
  assert.ok(checked > 10, `harness file URLs checked (${checked}); reader/claim routes are templates by design`);
  for (const t of h.tutor) {
    assert.ok(fs.existsSync(path.join(ROOT, 'data/wheels/tutor', t.file)), `tutor file: ${t.file}`);
  }
});

test('reader word panel wired, chat prefill kept', () => {
  const app = read('app.js');
  assert.ok(app.includes('renderWordPanel'), 'panel renderer present');
  assert.ok(app.includes('paintWordGrammar'), 'grammar painter present');
  assert.ok(app.includes('data/grammar/wheel-pack.json'), 'panel reads vendored pack');
  assert.ok(app.includes('id="wid-word"') || app.includes("W('word'"), 'word widget in rail');
  assert.ok(app.includes('what does "'), 'chat prefill kept');
  const css = read('styles.css');
  assert.ok(css.includes('#wordbody'), 'panel styles present');
});
