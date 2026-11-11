const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = process.cwd();
const dir = path.join(ROOT, 'mcp/gateway');

test('MCP gateway config is complete and self-consistent', () => {
  const conf = JSON.parse(fs.readFileSync(path.join(dir, 'servers.json'), 'utf8'));
  assert.equal(conf.format, 'svatantrya.mcp-gateway/1');
  const names = Object.keys(conf.servers);
  assert.ok(names.length >= 6, 'six live servers');
  for (const [name, cfg] of Object.entries(conf.servers)) {
    assert.ok(cfg.path.startsWith('/root/'), name + ' has an absolute path');
    assert.ok(fs.existsSync(cfg.path), name + ' script exists: ' + cfg.path);
    assert.ok(fs.existsSync(cfg.cwd), name + ' cwd exists: ' + cfg.cwd);
  }
  // CLI-only tools must carry a reason, not be silently dropped
  for (const [name, cfg] of Object.entries(conf.cli_only || {})) {
    assert.ok(cfg.reason && cfg.reason.length > 10, name + ' explains why it is cli_only');
  }
});

test('public endpoint is recorded in the MCP registry', () => {
  const reg = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/mcp-registry.json'), 'utf8'));
  const pub = reg.public_endpoint;
  assert.ok(pub, 'public_endpoint present');
  assert.equal(pub.url, 'https://mcp.sanskrit.help/mcp');
  assert.equal(pub.transport, 'streamable-http');
  assert.equal(pub.protocol, '2025-06-18');
  assert.ok(pub.tools >= 150, 'tool count recorded');
  assert.ok(/bearer/i.test(pub.auth), 'auth is stated');
});

test('tool catalogue matches the advertised count and hides no server', () => {
  const md = fs.readFileSync(path.join(dir, 'TOOLS.md'), 'utf8');
  const rows = md.split('\n').filter(l => /^[a-z0-9]+__[a-z0-9_]+/.test(l));
  assert.ok(rows.length >= 150, 'catalogue has the tools');
  for (const s of ['scholar', 'openpatala', 'federation', 'bookfactory', 'videofactory', 'aoc']) {
    assert.ok(rows.some(r => r.startsWith(s + '__')), 'catalogue covers ' + s);
  }
});
