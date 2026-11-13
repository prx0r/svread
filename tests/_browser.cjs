// Shared browser resolution for tests. The box has playwright-core in several
// places (and the chromium binary), but a single hardcoded path made every
// browser test skip silently. Resolve the first module that loads, then the
// first real executable; a genuine skip only happens when none exist.
const path = require('node:path');

const MODULE_CANDIDATES = [
  process.env.PLAYWRIGHT_MODULE,
  'playwright',
  'playwright-core',
  '/root/freaktown/node_modules/playwright-core',
  '/tmp/opencode/pw/node_modules/playwright-core',
  '/tmp/pwtest/node_modules/playwright-core',
].filter(Boolean);

function loadChromium() {
  for (const m of MODULE_CANDIDATES) {
    try { return require(m).chromium; } catch { /* try next */ }
  }
  return undefined;
}

const chromium = loadChromium();

function resolveExecutable() {
  if (process.env.SANSKRIT_BROWSER_EXECUTABLE) return process.env.SANSKRIT_BROWSER_EXECUTABLE;
  const fs = require('node:fs');
  const guesses = [
    '/root/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome',
    '/root/.cache/ms-playwright/chromium_headless_shell-1228/chrome-linux64/headless_shell',
  ];
  for (const g of guesses) { if (fs.existsSync(g)) return g; }
  try { const p = chromium && chromium.executablePath(); if (p && fs.existsSync(p)) return p; } catch { /* fall through */ }
  return undefined;
}

module.exports = { chromium, executable: resolveExecutable() };
