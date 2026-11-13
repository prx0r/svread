const test = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const path = require('node:path');
const { chromium, executable } = require('./_browser.cjs');

test('browser Sanskrit view lists lessons and switches depth tabs',
  { skip: !chromium }, async () => {
    const http = require('node:http'), fs = require('node:fs');
    const root = path.join(__dirname, '..');
    const site = http.createServer((req, res) => {
      const relative = decodeURIComponent(new URL(req.url, 'http://localhost').pathname).replace(/^\/+/, '') || 'index.html';
      const name = path.resolve(root, relative);
      if (!name.startsWith(root + path.sep)) { res.writeHead(403); return res.end(); }
      fs.readFile(name, (err, data) => {
        if (err) { res.writeHead(404); return res.end(); }
        const ext = path.extname(name), type = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.webmanifest': 'application/manifest+json' }[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': type }); res.end(data);
      });
    });
    await new Promise(resolve => site.listen(0, '127.0.0.1', resolve));
    const origin = `http://127.0.0.1:${site.address().port}`;
    let browser;
    try {
      browser = await chromium.launch({ executablePath: executable });
      const page = await browser.newPage();
      const errors = [];
      page.on('pageerror', e => errors.push(String(e)));
      await page.goto(`${origin}/?view=sanskrit`, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => document.querySelector('.reader-main h1'), { timeout: 15000 });
      const h1 = await page.textContent('.reader-main h1');
      assert.ok(/sanskrit/i.test(h1), `index heading, got: ${h1}`);
      const nav = await page.$$eval('.main-bar a', els => els.map(e => e.textContent.trim()));
      assert.ok(nav.includes('Scholar') && nav.includes('Sanskrit') && nav.includes('Index'), `nav: ${nav}`);
      assert.ok(!nav.some(t => /pushing/i.test(t)), `no Pushing tab: ${nav}`);
      const lessonLinks = await page.$$eval('.reader-main a[href*="lesson="]', els => els.map(e => e.getAttribute('href')));
      assert.equal(lessonLinks.length, 10);
      await page.goto(`${origin}/?view=sanskrit&work=bhairavastava&lesson=l01-mamatma`, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => document.querySelector('#sk-frame'), { timeout: 15000 });
      await page.waitForFunction(() => window.__skFrameReady === true, { timeout: 15000 });
      const frame = page.frames().find(f => /lesson-01(\.html)?\/?$/.test(f.url()));
      assert.ok(frame, 'lesson iframe attached');
      await frame.waitForFunction(() => document.querySelector('.depth-panel[data-d="learn"]'), { timeout: 15000 });
      const tabs = await frame.$$eval('.depth button[data-d]', els => els.map(e => e.textContent.trim()));
      assert.deepEqual(tabs, ['Learn it', 'Decode it', 'Recognise it']);
      let on = await frame.$$eval('.depth-panel.on', els => els.map(e => e.getAttribute('data-d')));
      assert.deepEqual(on, ['learn']);
      await frame.click('.depth button[data-d="decode"]');
      on = await frame.$$eval('.depth-panel.on', els => els.map(e => e.getAttribute('data-d')));
      assert.deepEqual(on, ['decode']);
      const rulebox = await frame.textContent('.depth-panel[data-d="decode"] .rulebox');
      assert.ok(/Rule box 1|Pāṇini 6\.1\.101/i.test(rulebox), `rule box present: ${rulebox.slice(0, 80)}`);
      const ask = await page.$('#sk-ask');
      assert.ok(ask, 'ask-the-chat button present');
      await page.click('#sk-ask');
      const qin = await page.$eval('#qin', el => el.value);
      assert.ok(/l01|mama|grammar/i.test(qin), `chat prefilled, got: ${qin}`);
      assert.equal(errors.filter(e => !/favicon|manifest/i.test(e)).length, 0, `no page errors: ${errors.join(' | ').slice(0, 500)}`);
    } finally {
      if (browser) await browser.close();
      site.close();
    }
  });

test('browser bibliography view filters works and shows lost with basis',
  { skip: !chromium }, async () => {
    const http = require('node:http');
    const fs = require('node:fs');
    const path = require('node:path');
    const root = path.join(__dirname, '..');
    const site = http.createServer((req, res) => {
      const relative = decodeURIComponent(new URL(req.url, 'http://localhost').pathname).replace(/^\/+/, '') || 'index.html';
      const name = path.resolve(root, relative);
      if (!name.startsWith(root + path.sep)) { res.writeHead(403); return res.end(); }
      fs.readFile(name, (err, data) => {
        if (err) { res.writeHead(404); return res.end(); }
        const ext = path.extname(name), type = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.webmanifest': 'application/manifest+json' }[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': type }); res.end(data);
      });
    });
    await new Promise(resolve => site.listen(0, '127.0.0.1', resolve));
    let browser;
    try {
      browser = await chromium.launch({ executablePath: executable });
      const page = await browser.newPage();
      const errors = [];
      page.on('pageerror', e => errors.push(String(e)));
      await page.goto(`http://127.0.0.1:${site.address().port}/?view=biblio`, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => document.querySelectorAll('#bibbody tr').length > 100, { timeout: 15000 });
      // Paginated: a first page of rows, never the whole 2,000+ corpus at once.
      const rows = await page.$$eval('#bibbody tr', els => els.length);
      assert.ok(rows >= 100 && rows <= 200, `first page rows: ${rows}`);
      assert.ok((await page.textContent('#bibcount')).includes('of'), 'match count shown');
      // Filter re-renders (not display:none): pick lost / unverified.
      await page.selectOption('#bibf', 'lost');
      await page.waitForFunction(() => document.querySelectorAll('#bibbody tr').length < 100, { timeout: 5000 });
      const lostRows = await page.$$eval('#bibbody tr', els => els.length);
      assert.ok(lostRows >= 1 && lostRows < 100, `lost rows: ${lostRows}`);
      const body = await page.textContent('.reader-main');
      assert.ok(/Kramakeli|Pūrvapa|STATUS|lost/i.test(body), 'lost works named');
      assert.equal(errors.filter(e => !/favicon|manifest/i.test(e)).length, 0, `no page errors: ${errors.join(' | ').slice(0, 200)}`);
    } finally {
      if (browser) await browser.close();
      site.close();
    }
  });
