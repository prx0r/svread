const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const http = require('node:http');

const ROOT = path.join(__dirname, '..');
const json = name => JSON.parse(fs.readFileSync(path.join(ROOT, name), 'utf8'));
let chromium;
try { ({ chromium } = require('playwright')); } catch { /* optional local browser */ }
const executable = process.env.SANSKRIT_BROWSER_EXECUTABLE || '/usr/bin/chromium';

test('comparison data is explicitly attributed, source-bound and covers the pilot', () => {
  const catalog = json('data/comparisons/catalog.json');
  assert.equal(catalog.format, 'svread-comparisons/1');
  assert.equal(new Set(catalog.works.map(w => w.id)).size, catalog.works.length);
  assert.ok(catalog.works.length >= 8);
  for (const work of catalog.works) {
    assert.ok(work.id && work.title && work.sources.length);
    for (const source of work.sources) {
      assert.equal(new URL(source.url).protocol, 'https:');
      assert.ok(source.name && source.kind && source.coverage && source.rights);
      assert.equal(source.text, undefined, 'external translation text is not vendored');
    }
  }
  const audit = json('data/comparisons/anuttarastika.json');
  const bytes = fs.readFileSync(path.join(ROOT, audit.source_projection));
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), audit.source_projection_sha256);
  assert.match(audit.status, /not approved/i);
  const projection = JSON.parse(bytes);
  assert.equal(projection.work, audit.work);
  assert.deepEqual(audit.passages.map(p => p.locator), projection.chunks.map(p => p.chunk));
  assert.deepEqual(audit.passages.map(p => p.number), [1,2,3,4,5,6,7,8]);
  for (const p of audit.passages) assert.ok(p.draft && p.focus && p.status);
  assert.match(audit.passages[1].focus, /vihara.*vilasa/i);
  assert.match(audit.passages[3].focus, /vittamadhyamadavan.*vittamadyamadavat/);
  assert.match(audit.passages[5].status, /uncertainty/i);
});

test('browser compares, keeps notes local and withholds a stale snapshot',
  { skip: !chromium || !fs.existsSync(executable), timeout: 60000 }, async (t) => {
    const server = http.createServer((req, res) => {
      const relative = decodeURIComponent(new URL(req.url, 'http://localhost').pathname).replace(/^\/+/, '') || 'index.html';
      const target = path.resolve(ROOT, relative);
      if (!target.startsWith(ROOT + path.sep)) { res.writeHead(403); return res.end(); }
      fs.readFile(target, (err, data) => {
        if (err) { res.writeHead(404); return res.end(); }
        const type = {'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.webmanifest':'application/manifest+json'}[path.extname(target)] || 'application/octet-stream';
        res.writeHead(200, {'Content-Type':type}); res.end(data);
      });
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const origin = `http://127.0.0.1:${server.address().port}`;
    let browser;
    try {
      try { browser = await chromium.launch({executablePath:executable, args:['--no-sandbox']}); }
      catch (error) {
        if (/socket\(\) failed: Operation not permitted/.test(String(error))) {
          t.skip('browser cannot create its Unix socket in this sandbox'); return;
        }
        throw error;
      }
      const context = await browser.newContext({serviceWorkers:'block', viewport:{width:390,height:844}});
      await context.route('https://**', route => route.abort());
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', e => errors.push(String(e)));
      await page.goto(`${origin}/?view=compare`);
      await page.waitForSelector('.compare-work-list');
      assert.match(await page.locator('.reader-main').innerText(), /Anuttarāṣṭikā/);
      await page.getByRole('link', {name:'Anuttarāṣṭikā', exact:true}).click();
      await page.waitForSelector('#comparison-anu-p08');
      assert.equal(await page.locator('.compare-passage').count(), 8);
      assert.match(await page.locator('#comparison-anu-p02').innerText(), /vihara.*vilasa/i);
      assert.match(await page.locator('#comparison-audit').innerText(), /not a scholar-approved gold standard/i);
      assert.equal(await page.locator('.compare-source-list a').count(), 6);
      const src = await page.locator('.compare-source-list a').first().getAttribute('href');
      assert.ok(src.startsWith('https://www.sanskrit-trikashaivism.com/'));
      assert.equal(await page.locator('.compare-source-list a').first().getAttribute('rel'), 'noopener noreferrer');
      const note = '<img src=x onerror="window.noteExecuted=1">';
      await page.locator('#comparison-anu-p01 summary').click();
      await page.locator('#note-anu-p01').fill(note);
      await page.locator('#comparison-anu-p01 .compare-save').click();
      assert.match(await page.locator('#comparison-anu-p01 [role=status]').innerText(), /Saved/);
      assert.equal(await page.locator('#comparison-anu-p01 .compare-note-view').innerText(), note);
      await page.reload();
      await page.waitForSelector('#comparison-anu-p08');
      assert.equal(await page.locator('#note-anu-p01').inputValue(), note);
      assert.equal(await page.locator('#comparison-anu-p01 .compare-note-view').innerText(), note);
      assert.equal(await page.evaluate(() => window.noteExecuted), undefined);
      await page.locator('#comparison-anu-p01 summary').click();
      await page.locator('#comparison-anu-p01 .compare-clear').click();
      await page.reload();
      await page.waitForSelector('#comparison-anu-p08');
      assert.equal(await page.locator('#note-anu-p01').inputValue(), '');
      assert.match(await page.locator('#comparison-anu-p01 .compare-note-view').innerText(), /Add your own/);
      const dimensions = await page.evaluate(() => ({body:document.body.scrollWidth, viewport:innerWidth}));
      assert.ok(dimensions.body <= dimensions.viewport, `mobile overflow: ${JSON.stringify(dimensions)}`);
      await page.route('**/data/anuttarastika.json', async route => {
        const original = fs.readFileSync(path.join(ROOT, 'data/anuttarastika.json'), 'utf8');
        await route.fulfill({status:200,contentType:'application/json',body:original + ' '});
      });
      await page.reload();
      await page.waitForSelector('.compare-notice');
      await page.waitForFunction(() => document.querySelector('#comparison-audit')?.textContent.includes('source snapshot has changed'));
      assert.equal(await page.locator('.compare-passage').count(), 0, 'no stale comparisons');
      assert.equal(errors.length, 0, errors.join('\n'));
      await context.close();
    } finally {
      if (browser) await browser.close();
      await new Promise(resolve => server.close(resolve));
    }
  });
