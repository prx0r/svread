// Dump every enumerable generative-wheel state using the vendored engine.
// Reads ../data/wheels/compose-src, writes rows as JSON to stdout.
// Deterministic: families/levels/options in registration order.
'use strict';
const path = require('node:path');
const SRC = path.resolve(__dirname, '..', 'data', 'wheels', 'compose-src');
require(path.join(SRC, 'core.js'));
require(path.join(SRC, 'shared.js'));
for (const f of ['01-conversation', '02-expression', '03-action', '04-description', '05-logic', '06-transformation']) {
  require(path.join(SRC, 'families', f + '.js'));
}
const { allLevels, runCombinations } = globalThis.SW;
const rows = [];
for (const { family, level } of allLevels()) {
  runCombinations(level, (g) => {
    rows.push({
      family: family.id,
      family_n: family.number,
      level: level.id,
      level_title: level.title,
      rings: level.rings.map((r) => r.id),
      selection: g.state,
      lines: g.result.lines.map((l) => ({ dev: l.dev, roman: l.roman, en: l.en, role: l.role || 'Sanskrit' })),
      note: g.result.note || '',
    });
  });
}
process.stdout.write(JSON.stringify(rows));
