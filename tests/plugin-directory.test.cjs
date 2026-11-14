const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = path.join(__dirname, '..', 'plugins');
const project = path.join(__dirname, '..');

test('the public plugin directory excludes private services', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'plugins.json'), 'utf8'));
  for (const entry of [...manifest.plugins, ...manifest.bundles]) {
    assert.doesNotMatch(entry.access, /\bprivate\b/i);
  }
  for (const file of ['index.html', 'index.md', 'plugins.json',
    '../CHATGPT-PLUGIN.md', '../PLUGIN-PACK.md', '../data/mcp-registry.json']) {
    const content = fs.readFileSync(path.join(root, file), 'utf8');
    assert.doesNotMatch(content, /diary relay|owner journal only|never in any directory/i,
      `${file} must not list a private service`);
    assert.doesNotMatch(content, /nibbana\.svatantrya\.net/i,
      `${file} must not disclose the private relay URL`);
  }
});

test('deployment staging and the public manifest exclude operator-only assets', () => {
  const policy = JSON.parse(execFileSync('python3', ['-c',
    'import json,sys; sys.path.insert(0, sys.argv[1]); from site_assets import PRIVATE_ASSETS; print(json.dumps(sorted(PRIVATE_ASSETS)))',
    path.join(project, 'tools')], {encoding: 'utf8'}));
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'svread-stage-test-'));
  try {
    const source = path.join(temp, 'source');
    const destination = path.join(temp, 'destination');
    fs.mkdirSync(source);
    fs.writeFileSync(path.join(source, 'index.html'), 'public');
    fs.writeFileSync(path.join(source, '.env'), 'secret');
    fs.writeFileSync(path.join(source, 'host.pem'), 'secret');
    for (const rel of policy) {
      const file = path.join(source, rel);
      fs.mkdirSync(path.dirname(file), {recursive: true});
      fs.writeFileSync(file, 'operator-only');
    }
    execFileSync('python3', [path.join(project, 'tools', 'stage_public_site.py'),
      destination, '--source', source]);
    assert.equal(fs.readFileSync(path.join(destination, 'index.html'), 'utf8'), 'public');
    assert.equal(fs.existsSync(path.join(destination, '.env')), false);
    assert.equal(fs.existsSync(path.join(destination, 'host.pem')), false);
    const manifest = JSON.parse(fs.readFileSync(path.join(project, 'data', 'release-manifest.json'), 'utf8'));
    for (const rel of policy) {
      assert.equal(fs.existsSync(path.join(destination, rel)), false);
      assert.equal(Object.hasOwn(manifest.assets, rel), false);
    }
    assert.throws(() => execFileSync('python3', [path.join(project, 'tools', 'stage_public_site.py'),
      destination, '--source', source], {stdio: 'pipe'}), /Command failed/);
  } finally {
    fs.rmSync(temp, {recursive: true, force: true});
  }
});
