// claim-negative.test.cjs — the generator must refuse forged inputs.
//
// Each case builds a minimal SVREAD_ROOT in tmp (one trace + one pack),
// mutates exactly one thing, runs tools/emit_claim_pages.py and requires
// a nonzero exit with the expected reason. No network, no siblings:
// the fixtures are copied from the repo's own data, then tampered.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');
const EMITTER = path.join(ROOT, 'tools', 'emit_claim_pages.py');

function scaffold(key) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'svread-neg-'));
  const probe = JSON.parse(fs.readFileSync(
    path.join(ROOT, 'data', 'traces', `${key}.json`), 'utf8'));
  const work = probe.chunk.work;
  const target = probe.chunk.target;
  const tdir = path.join(tmp, 'data', 'traces');
  const vdir = path.join(tmp, 'data', 'verify', key);
  fs.mkdirSync(tdir, { recursive: true });
  fs.mkdirSync(vdir, { recursive: true });
  const trace = probe;
  const man = JSON.parse(fs.readFileSync(
    path.join(ROOT, 'data', 'verify', key, 'manifest.json'), 'utf8'));
  fs.copyFileSync(path.join(ROOT, 'data', 'traces', `${key}.json`),
    path.join(tdir, `${key}.json`));
  fs.writeFileSync(path.join(tdir, 'index.json'), JSON.stringify({
    format: 'svread-trace-index/1', count: 1, entries: [{
      file: `traces/${key}.json`, sha256: shaFile(`data/traces/${key}.json`),
      work, target, verdict: trace.verdict, gaps: trace.gaps || [],
    }],
  }));
  for (const a of man.artifacts) {
    fs.copyFileSync(path.join(ROOT, 'data', 'verify', key, a.name),
      path.join(vdir, a.name));
  }
  fs.writeFileSync(path.join(vdir, 'manifest.json'),
    JSON.stringify(man, null, 1));
  fs.writeFileSync(path.join(tmp, 'data', 'holds.json'),
    JSON.stringify({ format: 'svread-holds/1', holds: [] }));
  fs.writeFileSync(path.join(tmp, 'data', 'sources.json'),
    JSON.stringify({ format: 'svread-sources/1', works: {} }));
  return { tmp, vdir, tdir, trace, man };
}

function shaFile(rel) {
  return require('node:crypto').createHash('sha256')
    .update(fs.readFileSync(path.join(ROOT, rel))).digest('hex');
}

function run(tmp) {
  return spawnSync('python3', [EMITTER], {
    cwd: ROOT,
    env: { ...process.env, SVREAD_ROOT: tmp, SITE_ORIGIN: 'https://x.test' },
    encoding: 'utf8',
  });
}

const KEY = 'tantrasara-a08-tsa08-p03';

test('negative: altered source bytes are refused', () => {
  const { tmp, vdir } = scaffold(KEY);
  try {
    fs.appendFileSync(path.join(vdir, 'source.txt'), ' forged');
    const r = run(tmp);
    assert.notEqual(r.status, 0, 'must fail closed');
    assert.match(r.stderr + r.stdout, /source\.txt does not match trace/);
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});

test('negative: altered English with stale manifest is refused', () => {
  const { tmp, vdir } = scaffold(KEY);
  try {
    const l2 = path.join(vdir, 'tsa-a08.l2.json');
    const doc = JSON.parse(fs.readFileSync(l2, 'utf8'));
    doc[0].plain_english = 'FORGED ENGLISH';
    fs.writeFileSync(l2, JSON.stringify(doc));
    const r = run(tmp);
    assert.notEqual(r.status, 0, 'must fail closed');
    assert.match(r.stderr + r.stdout, /does not match trace layer sha/);
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});

test('negative: source AND manifest changed together still fails (trace rules)', () => {
  const { tmp, vdir } = scaffold(KEY);
  try {
    const crypto = require('node:crypto');
    fs.appendFileSync(path.join(vdir, 'source.txt'), ' forged');
    const manPath = path.join(vdir, 'manifest.json');
    const man = JSON.parse(fs.readFileSync(manPath, 'utf8'));
    const art = man.artifacts.find(a => a.name === 'source.txt');
    art.sha256 = crypto.createHash('sha256')
      .update(fs.readFileSync(path.join(vdir, 'source.txt'))).digest('hex');
    fs.writeFileSync(manPath, JSON.stringify(man));
    const r = run(tmp);
    assert.notEqual(r.status, 0, 'trace (not manifest) rules');
    assert.match(r.stderr + r.stdout, /source\.txt does not match trace/);
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});

test('negative: single other matching hash is not enough', () => {
  const { tmp, vdir, tdir } = scaffold(KEY);
  try {
    // keep ONLY the song proof verifiable; break everything else
    for (const f of fs.readdirSync(vdir)) {
      if (f !== 'proof-tsa-a08.json' && f !== 'manifest.json') {
        fs.writeFileSync(path.join(vdir, f), 'broken');
      }
    }
    const r = run(tmp);
    assert.notEqual(r.status, 0, 'one matching hash must not suffice');
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});

test('negative: missing layer file is refused', () => {
  const { tmp, vdir } = scaffold(KEY);
  try {
    fs.rmSync(path.join(vdir, 'tsa-a08.l0.json'));
    const r = run(tmp);
    assert.notEqual(r.status, 0, 'must fail closed');
    assert.match(r.stderr + r.stdout, /missing pack layer file/);
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});

test('negative: unmappable L2 withholds English but still emits honestly', () => {
  const { tmp, vdir, tdir } = scaffold(KEY);
  try {
    // rewrite every cite so none matches the excerpt
    const l2 = path.join(vdir, 'tsa-a08.l2.json');
    const doc = JSON.parse(fs.readFileSync(l2, 'utf8'));
    for (const e of doc) e.sanskrit_cite = 'xyzzy nomatch ' + e.verse;
    const crypto = require('node:crypto');
    const bytes = Buffer.from(JSON.stringify(doc));
    fs.writeFileSync(l2, bytes);
    // re-bind manifest + trace to the new bytes so ONLY the mapping fails
    const manPath = path.join(vdir, 'manifest.json');
    const man = JSON.parse(fs.readFileSync(manPath, 'utf8'));
    man.artifacts.find(a => a.name === 'tsa-a08.l2.json').sha256 =
      crypto.createHash('sha256').update(bytes).digest('hex');
    fs.writeFileSync(manPath, JSON.stringify(man));
    const tPath = path.join(tdir, `${KEY}.json`);
    const trace = JSON.parse(fs.readFileSync(tPath, 'utf8'));
    trace.layers.l2.sha256 = man.artifacts.find(a => a.name === 'tsa-a08.l2.json').sha256;
    fs.writeFileSync(tPath, JSON.stringify(trace));
    const idxPath = path.join(tdir, 'index.json');
    const idx = JSON.parse(fs.readFileSync(idxPath, 'utf8'));
    idx.entries[0].sha256 = crypto.createHash('sha256')
      .update(fs.readFileSync(tPath)).digest('hex');
    fs.writeFileSync(idxPath, JSON.stringify(idx));
    const r = run(tmp);
    assert.equal(r.status, 0, 'withholding is honest output, not failure');
    const page = fs.readFileSync(
      path.join(tmp, 'claim', 'tantrasara-a08', 'tsa08-p03', 'index.html'), 'utf8');
    assert.ok(!page.includes('Machine rendering'), 'no English quoted');
    assert.ok(page.includes('no pack L2 entry maps'), 'reason stated');
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});
