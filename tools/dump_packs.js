// Enumerate pack × wheel states for the four-wheel architecture.
'use strict';
const path = require('node:path');
const SRC = path.resolve(__dirname, '..', 'data', 'wheels', 'compose-src', 'src');
require(path.join(SRC, 'core.js'));
require(path.join(SRC, 'shared.js'));
require(path.join(SRC, 'packs.js'));
const { runCombinations } = globalThis.SW;
const { packs, action31, action32, build31, build32 } = globalThis.SWPacks;

const LEVELS = [
  { id: 'action.3.1', wheel: 'action', level: '3.1', title: 'Simple actions', rings: action31, build: build31 },
  { id: 'action.3.2', wheel: 'action', level: '3.2', title: 'Where an action happens', rings: action32, build: build32 },
];

const rows = [];
for (const [packId, pack] of Object.entries(packs)) {
  for (const L of LEVELS) {
    const actors = pack.subjects.map((s) => SWPacks.actorById(s));
    const ringActor = { id: 'actor', title: 'Who?', options: actors.map((a) => SW.choose(a.id, a.dev, { en: a.en, person: a.person })) };
    const level = { id: L.level, title: L.title, rings: L.rings(pack, ringActor), build: L.build(pack) };
    try {
      runCombinations(level, (g) => {
        rows.push({
          wheel: L.wheel, level: L.id, level_title: L.title,
          pack: packId, pack_name: pack.name,
          rings: level.rings.map((r) => r.id),
          selection: g.state,
          lines: g.result.lines.map((l) => ({ dev: l.dev, roman: l.roman, en: l.en, role: l.role || 'Sanskrit' })),
          note: g.result.note || '',
        });
      });
    } catch (e) {
      rows.push({ wheel: L.wheel, level: L.id, pack: packId, error: String(e.message || e) });
    }
  }
}
process.stdout.write(JSON.stringify({ packs: Object.keys(packs), rows }));
