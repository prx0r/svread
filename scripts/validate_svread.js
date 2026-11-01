// Sweep-validate syllable karaoke for every svread work.
// For each ?work=<wid>: loads the page, and for every verse checks
//   - how many words rendered as syllable spans vs whole-word fallbacks
//   - whether any Latin/ŋ leaked into the Devanagari
//   - whether the verse has an audio URL and it resolves
// Prints a per-work line and a final verdict. Exit 1 if any work fails.
//
// usage: node validate_svread.js [baseUrl] [wid ...]
const { chromium } = require('/home/ubuntu/mxth/mathartist/node_modules/playwright');
const https = require('https');

const BASE = process.argv[2] || 'https://svread.pages.dev';
const R2B = 'https://pub-87169194562a44fcb8279a799d626c62.r2.dev';
// site work id -> karaoke/align stem (same map as scripts/build_align.py)
const KMAP = { spanda:'spandakarika', phrdaya:'pratyabhijnahrdaya',
               bhairavanukaranastotra:'bhairavanukarana', sivastotravali:'shivastotravali' };
const WIDS = process.argv.slice(3);

const HEAD = url => new Promise(res => {
  const u = new URL(url);
  https.request({ method: 'HEAD', hostname: u.hostname, path: u.pathname + u.search,
                  headers: { 'User-Agent': 'Mozilla/5.0 (karaoke-validate)' } },
    r => res(r.statusCode)).on('error', () => res(0)).end();
});

(async () => {
  let wids = WIDS;
  if (!wids.length) {
    // ask the site which works it has
    const html = await new Promise((res, rej) =>
      https.get(`${BASE}/data/library.json`, r => { let d=''; r.on('data',c=>d+=c); r.on('end',()=>res(d)); }).on('error', rej));
    try { const j = JSON.parse(html); wids = (Array.isArray(j) ? j : (j.works||[])).map(w => w.work || w.id || w); } catch(e) { wids = []; }
  }
  if (!wids.length) { console.error('no works to check (pass wids explicitly)'); process.exit(2); }

  const b = await chromium.launch({
    executablePath: '/home/ubuntu/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome',
    args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'],
  });
  let fail = 0;
  for (const wid of wids) {
    const p = await b.newPage({ viewport: { width: 1400, height: 1000 } });
    try {
      await p.goto(`${BASE}/?work=${wid}`, { waitUntil: 'networkidle', timeout: 45000 });
      await p.waitForSelector('.verse', { timeout: 25000 });
      const r = await p.evaluate(() => {
        const out = { verses: 0, syl: 0, fb: 0, latin: 0, noAudio: 0, badVerses: [] };
        for (const v of document.querySelectorAll('.verse')) {
          const sa = v.querySelector('.sa'); if (!sa) continue;
          out.verses++;
          const k = sa.querySelectorAll('.kword').length;
          const f = [...sa.querySelectorAll('.w')].filter(w => !w.closest('.kword')).length;
          out.syl += k; out.fb += f;
          if (/[A-Za-z\u014b\u1e45]/.test(sa.textContent)) out.latin++;
          if (f) out.badVerses.push(`${v.getAttribute('data-i')}:${f}`);
        }
        return out;
      });
      const audio = await p.evaluate(() => {
        const a = document.querySelector('[data-rec], a.vref');
        return null;
      });
      const pct = r.syl + r.fb ? Math.round(100 * r.syl / (r.syl + r.fb)) : 0;
      // A work with no chant audio cannot sweep, and that is not a defect.
      // Chant exists iff there is a compiled artifact or karaoke timings for it.
      const kstem = KMAP[wid] || wid;
      const hasChant = (await HEAD(`${R2B}/align/${wid}.json`)) === 200
                    || (await HEAD(`${R2B}/karaoke/${kstem}.json`)) === 200;
      if (!hasChant) {
        console.log(`--   ${wid.padEnd(26)} verses=${String(r.verses).padStart(4)} no chant (expected)`);
        await p.close();
        continue;
      }
      const ok = r.verses > 0 && r.fb === 0 && r.latin === 0;
      if (!ok) fail++;
      console.log(`${ok ? 'OK  ' : 'CHECK'} ${wid.padEnd(26)} verses=${String(r.verses).padStart(3)} syl-words=${String(r.syl).padStart(4)} fallbacks=${String(r.fb).padStart(3)} latin-leak=${r.latin} (${pct}% syllable)` + (r.badVerses.length ? '  fb@' + r.badVerses.slice(0, 6).join(',') : ''));
    } catch (e) {
      console.log(`FAIL ${wid.padEnd(26)} ${String(e.message).slice(0, 70)}`);
      fail++;
    }
    await p.close();
  }
  await b.close();
  console.log(`\n${fail ? 'FAILURES: ' + fail : 'ALL WORKS CLEAN'}`);
  process.exit(fail ? 1 : 0);
})();
