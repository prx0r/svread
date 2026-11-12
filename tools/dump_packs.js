// Enumerate pack × wheel states for the four-wheel architecture.
'use strict';
const path = require('node:path');
const SRC = path.resolve(__dirname, '..', 'data', 'wheels', 'compose-src', 'src');
require(path.join(SRC, 'core.js'));
require(path.join(SRC, 'shared.js'));
require(path.join(SRC, 'packs.js'));
const { runCombinations } = globalThis.SW;
const { packs, actorRing } = globalThis.SWPacks;

const LEVELS = [
  { level: '1.1', wheel: 'conversation', title: 'Dialogue', rings: 'conversation11', build: 'build11' },
  { level: '2.1', wheel: 'expression', title: 'Simple thoughts', rings: 'expression21', build: 'build21' },
  { level: '3.1', wheel: 'action', title: 'Simple actions', rings: 'action31', build: 'build31' },
  { level: '3.2', wheel: 'action', title: 'Where an action happens', rings: 'action32', build: 'build32' },
  { level: '4.1', wheel: 'description', title: 'Descriptions', rings: 'description41', build: 'build41' },
];

const rows = [];
for (const [packId, pack] of Object.entries(packs)) {
  for (const L of LEVELS) {
    const level = {
      id: L.level, title: L.title,
      rings: SWPacks[L.rings](pack, actorRing(pack)),
      build: SWPacks[L.build](pack),
    };
    try {
      runCombinations(level, (g) => {
        rows.push({
          wheel: L.wheel, level: `${L.wheel}.${L.level}`, level_title: L.title,
          pack: packId, pack_name: pack.name,
          rings: level.rings.map((r) => r.id),
          selection: g.state,
          lines: g.result.lines.map((l) => ({ dev: l.dev, roman: l.roman, en: l.en, role: l.role || 'Sanskrit' })),
          note: g.result.note || '',
        });
      });
    } catch (e) {
      rows.push({ wheel: L.wheel, level: `${L.wheel}.${L.level}`, pack: packId, error: String(e.message || e) });
    }
  }
}
process.stdout.write(JSON.stringify({ packs: Object.keys(packs), rows }));
