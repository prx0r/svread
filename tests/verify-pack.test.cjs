const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');

// Serve the site statically and verify ONLY by fetching + hashing, exactly as
// an external agent would. No Python, no project imports, no globals.
function serve() {
  const site = http.createServer((req, res) => {
    const rel = decodeURIComponent(new URL(req.url, 'http://x').pathname)
      .replace(/^\/+/, '') || 'index.html';
    const name = path.resolve(ROOT, rel);
    if (!name.startsWith(ROOT + path.sep)) { res.writeHead(403); return res.end(); }
    fs.readFile(name, (err, data) => {
      if (err) { res.writeHead(404); return res.end(); }
      const ext = path.extname(name);
      const type = { '.json': 'application/json', '.txt': 'text/plain',
        '.md': 'text/markdown' }[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': type }); res.end(data);
    });
  });
  return new Promise(r => site.listen(0, '127.0.0.1', () => r(site)));
}

const sha = b => crypto.createHash('sha256').update(b).digest('hex');

test('external agent can verify a trace with fetch + sha256 alone', async () => {
  const site = await serve();
  const base = `http://127.0.0.1:${site.address().port}`;
  try {
    const get = async p => {
      const r = await fetch(base + p);
      assert.equal(r.status, 200, `fetch ${p} -> ${r.status}`);
      return Buffer.from(await r.arrayBuffer());
    };

    // 1. index -> pick a COMPLETE chunk
    const idx = JSON.parse((await get('/data/traces/index.json')).toString());
    const pick = idx.entries.find(e => e.verdict === 'COMPLETE');
    assert.ok(pick, 'at least one COMPLETE trace');

    // 2. trace
    const traceRaw = await get(`/data/traces/${pick.file.split('/').pop()}`);
    const trace = JSON.parse(traceRaw.toString());
    assert.equal(sha(traceRaw), pick.sha256, 'trace hash matches index');

    // 3. pack manifest
    const dir = `/data/verify/${trace.chunk.work}-${trace.chunk.target}`;
    const man = JSON.parse((await get(`${dir}/manifest.json`)).toString());
    assert.equal(man.format, 'trika-verify-pack/1');
    assert.ok(man.artifacts.length >= 2, 'pack has artifacts');
    assert.ok(man.how_to_verify.includes('sha256sum'), 'recipe is code-free');

    // 4. hash every artifact and cross-check against BOTH manifest and trace
    const layerHash = {};
    for (const [k, v] of Object.entries(trace.layers || {})) {
      if (v && v.sha256) layerHash[path.basename(v.path)] = v.sha256;
    }
    for (const a of man.artifacts) {
      const bytes = await get(`${dir}/${a.name}`);
      const got = sha(bytes);
      assert.equal(got, a.sha256, `${a.name}: manifest hash matches bytes`);
      if (a.role === 'source-bytes') {
        assert.equal(got, trace.source.bytes_sha256,
          'source bytes reproduce the trace');
      } else if (a.role.startsWith('layer-')) {
        const want = layerHash[a.name];
        assert.ok(want, `${a.name} recorded in trace`);
        assert.equal(got, want, `${a.name}: bytes reproduce trace layer hash`);
      }
    }

    // 5. trace verdict must agree with its own gaps (no silent COMPLETE)
    if (trace.verdict === 'COMPLETE') {
      assert.deepEqual(trace.gaps, [], 'COMPLETE implies no gaps');
    } else {
      assert.ok(trace.gaps.length > 0, 'PARTIAL names its gaps');
    }

    // 6. index must cover every published pack and never overclaim
    const vIdx = JSON.parse((await get('/data/verify/index.json')).toString());
    assert.equal(vIdx.count, idx.count, 'one pack per trace');
    assert.ok(vIdx.no_code_needed.includes('sha256'), 'states no-code path');
    assert.ok(vIdx.what_matching_does_not_prove.some(s => /witness/.test(s)),
      'limits stated (witnesses)');
  } finally {
    site.close();
  }
});

test('verify packs cover every published trace and nothing stale', () => {
  const tIdx = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/traces/index.json'), 'utf8'));
  const vIdx = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/verify/index.json'), 'utf8'));
  const traceKeys = new Set(tIdx.entries.map(e => `${e.work}|${e.target}`));
  const packKeys = new Set(vIdx.packs.map(p => `${p.work}|${p.target}`));
  assert.deepEqual([...traceKeys].sort(), [...packKeys].sort(),
    'packs mirror traces exactly');
  for (const p of vIdx.packs) {
    const dir = path.join(ROOT, 'data', p.path);
    assert.ok(fs.existsSync(path.join(dir, 'manifest.json')), `${p.target} manifest`);
    const man = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8'));
    for (const a of man.artifacts) {
      const f = path.join(dir, a.name);
      assert.ok(fs.existsSync(f), `${p.target}/${a.name} exists`);
      assert.equal(sha(fs.readFileSync(f)), a.sha256, `${p.target}/${a.name} hash`);
    }
    // trace hash recorded inside the pack must match the real trace file
    const tPath = path.join(ROOT, 'data', 'traces', path.basename(man.trace.file));
    assert.equal(sha(fs.readFileSync(tPath)), man.trace.sha256,
      `${p.target}: pack pins the real trace`);
  }
});
