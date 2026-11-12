// Dump every enumerable generative-wheel state using the vendored v2 engine.
// Reads ../data/wheels/compose-src, writes rows as JSON to stdout.
// Deterministic: families/levels/options in registration order.
'use strict';
const path = require('node:path');
const SRC = path.resolve(__dirname, '..', 'data', 'wheels', 'compose-src', 'src');
require(path.join(SRC, 'core.js'));
require(path.join(SRC, 'shared.js'));
require(path.join(SRC, 'curriculum.js'));
const FAMILIES = ['01-conversation', '02-expression', '03-action', '04-description',
  '05-logic', '06-transformation', '07-deictics', '08-cases', '09-numbers',
  '10-commands', '11-sequence', '12-correlatives', '13-causatives',
  '14-quotation', '15-compounds'];
for (const f of FAMILIES) require(path.join(SRC, 'families', f + '.js'));
const { allLevels, runCombinations } = globalThis.SW;
const rows = [];
for (const { family, level } of allLevels()) {
  runCombinations(level, (g) => {
    rows.push({
      family: family.id,
      family_n: family.number,
      family_title: family.title,
      level: level.id,
      level_title: level.title,
      focus: level.focus || '',
      rings: level.rings.map((r) => r.id),
      ring_titles: level.rings.map((r) => r.title || ''),
      selection: g.state,
      lines: g.result.lines.map((l) => ({ dev: l.dev, roman: l.roman, en: l.en, role: l.role || 'Sanskrit' })),
      note: g.result.note || '',
    });
  });
}
process.stdout.write(JSON.stringify(rows));
