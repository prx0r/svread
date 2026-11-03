const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

test('Scholar keeps a local fork chain and submits the same data', async () => {
  const root = path.join(__dirname, '..');
  const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
  const code = app.slice(app.indexOf('let SCH = null;'), app.indexOf('\nasync function main(){'));
  const data = JSON.parse(fs.readFileSync(path.join(root, 'data/scholar/paramarthasara.json'), 'utf8'));
  const storage = new Map([['svv-scholar-author', 'Test scholar']]);
  const nodes = new Map();
  let download;
  let submitted;
  let uuid = 0;
  function node(selector) {
    if (!nodes.has(selector)) {
      const value = {value: '', textContent: '', style: {}, querySelectorAll: () => [],
        addEventListener: () => {}};
      Object.defineProperty(value, 'innerHTML', {
        get() { return this.html || ''; },
        set(html) {
          this.html = html;
          if (selector === '#cols') {
            const match = html.match(/<textarea id="schta"[^>]*>([\s\S]*?)<\/textarea>/);
            node('#schta').value = match ? match[1] : '';
            node('#schtoken').value = '';
          }
        },
      });
      nodes.set(selector, value);
    }
    return nodes.get(selector);
  }
  const context = vm.createContext({
    WORK: 'paramarthasara', document: {}, URL,
    localStorage: {getItem: key => storage.get(key) || null, setItem: (key, value) => storage.set(key, value)},
    crypto: {randomUUID: () => `test-${++uuid}`},
    get: async name => name.endsWith('index.json') ? {paramarthasara: {}} : data,
    $: node, esc: value => String(value == null ? '' : value),
    norm: value => String(value).toLowerCase(), W: (_id, _title, html) => html,
    dl: (_filename, body) => { download = JSON.parse(body); },
    fetch: async (_url, options) => {
      submitted = JSON.parse(options.body);
      assert.equal(options.headers.Authorization, 'Bearer private-token');
      return {ok: true, json: async () => ({branch: 'scholar/submission-test'})};
    },
  });
  vm.runInContext(code, context);
  await vm.runInContext('scholarView()', context);
  node('#schta').value = 'First version';
  node('#schsave').onclick();
  node('#schta').value = 'Second version';
  node('#schsave').onclick();
  node('#schexport').onclick();
  assert.equal(download.versions.length, 2);
  assert.equal(download.versions[1].parent, download.versions[0].version_id);
  assert.deepEqual(download.versions[1].content.lines, ['Second version']);
  assert.ok(download.versions[0].base_sha256);
  node('#schendpoint').oninput({target: {value: 'https://scholar.example'}});
  node('#schtoken').value = 'private-token';
  await node('#schsubmit').onclick();
  assert.equal(submitted.versions.length, 2);
  assert.equal(node('#schtoken').value, '');
  assert.match(node('#schmsg').textContent, /Submitted for review/);
});
