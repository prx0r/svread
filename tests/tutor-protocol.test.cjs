// Prompt invariants for the Sanskrit tutor: the "quiz-first" bug must not come
// back. These are text gates over the tutor files ChatGPT actually loads.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.resolve(__dirname, '..');
const R = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

const PROTOCOL = 'data/wheels/tutor/SESSION-PROTOCOL.md';
const LEVELS = [1, 2, 3, 4, 5, 6].map(
  (n) => `data/wheels/tutor/level-0${n}-${['bases', 'endings', 'subject-verb', 'time-place', 'questions', 'karaka'][n - 1]}.md`);

test('session protocol exists and carries the seven rules', () => {
  const p = R(PROTOCOL);
  for (const r of ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']) {
    assert.ok(p.includes(`Rule ${r}`), `protocol has Rule ${r}`);
  }
  assert.match(p, /never test an untaught form/i, 'T1 states the invariant');
  assert.match(p, /first tutor turn[^.]*contains \*\*zero questions\*\*/i, 'new-learner first turn has no questions');
  assert.match(p, /\*Status: CANONICAL/, 'protocol is CANONICAL');
});

test('every level file defers to the session protocol', () => {
  for (const f of LEVELS) {
    const s = R(f);
    assert.ok(s.includes('SESSION-PROTOCOL.md'), `${f} references the protocol`);
  }
});

test('level 1 forbids a cold quiz and orders teach before test', () => {
  const s = R('data/wheels/tutor/level-01-bases.md');
  assert.match(s, /teach before you test/i, 'L1 has teach-first rule');
  assert.match(s, /banned/i, 'L1 names the cold-quiz pattern as banned');
  const teach = s.indexOf('Teach before you test');
  const drill = s.indexOf('Drill only after the teach turn');
  assert.ok(teach > -1 && drill > teach, 'teach rule precedes drill rule');
  // The teaching block itself must contain zero questions (turn 1 asks nothing).
  const block = s.slice(s.indexOf('## The teaching block'), s.indexOf('## Rules'));
  assert.equal((block.match(/\?/g) || []).length, 0, 'teaching block asks no questions');
});

test('every level states teach-before-test in its rules', () => {
  for (const f of LEVELS) {
    assert.match(R(f), /teach before you test/i, `${f} has teach-first rule 0`);
  }
});

test('harness opens with the session section before import', () => {
  const h = R('data/wheels/HARNESS.md');
  const s0 = h.indexOf('## 0. Open every session');
  const s1 = h.indexOf('## 1. Import the program');
  assert.ok(s0 > -1, 'HARNESS has §0 session opening');
  assert.ok(s0 < s1, '§0 precedes §1 import');
  assert.ok(h.includes('SESSION-PROTOCOL.md'), 'HARNESS loads the protocol');
});

test('both paste-ready tutor prompts load the protocol and ban cold quizzing', () => {
  const app = R('app.js');
  const wheels = R('wheels.html');
  for (const [name, s] of [['app.js', app], ['wheels.html', wheels]]) {
    assert.match(s, /SESSION-PROTOCOL\.md/, `${name} prompt loads protocol`);
    assert.match(s, /NEVER ask about a form you have not taught me/i, `${name} prompt bans cold quiz`);
  }
});

test('level 1 teaching block matches word.json exactly (no drift)', () => {
  const doc = R('data/wheels/tutor/level-01-bases.md');
  const word = JSON.parse(R('data/wheels/word.json'));
  const bases = word.bases;
  assert.ok(bases.length >= 1, 'word.json has bases');
  for (const b of bases) {
    assert.ok(doc.includes(`*${b.iast}*`), `L1 teaches ${b.iast} from data`);
  }
  // The doc must claim the same count as the data (catches "six" vs five drift).
  const wordNums = { 1: 'one', 2: 'two', 3: 'three', 4: 'four', 5: 'five', 6: 'six', 7: 'seven', 8: 'eight' };
  const w = wordNums[bases.length];
  assert.ok(
    doc.includes(`${bases.length} question-words`) ||
      doc.includes(`all ${bases.length}`) ||
      new RegExp(`${bases.length} Sanskrit bases`).test(doc) ||
      (w && new RegExp(`\\b${w} (question-words|Sanskrit bases)\\b`, 'i').test(doc)),
    `L1 states the data count (${bases.length})`);
  // No base in the doc that is not in the data.
  const mentioned = [...doc.matchAll(/^\d\. \*([a-zāīūṛṣṭṇṃḥ]+)\* ·/gm)].map((m) => m[1]);
  const dataIast = new Set(bases.map((b) => b.iast));
  for (const m of mentioned) {
    assert.ok(dataIast.has(m), `L1 does not teach unlisted base ${m}`);
  }
});

test('practice host exposes learner-gated writes, never owner', () => {
  const cfg = JSON.parse(R('mcp/gateway/servers-practice.json'));
  const open = cfg.open_tools || [];
  for (const t of ['compose__learner_start', 'compose__drill', 'compose__submit',
                   'compose__progress', 'compose__ready']) {
    assert.ok(open.includes(t), `${t} open on practice host`);
  }
  const compose = cfg.servers.compose;
  assert.ok(compose, 'compose server wired on practice host');
  assert.ok(compose.tools_allow.every((t) => t.startsWith('compose__')), 'compose tools only');
  assert.match(cfg.instructions, /learner_start/, 'instructions tell the model to mint a learner');
  assert.match(cfg.instructions, /SESSION-PROTOCOL/, 'instructions load the protocol first');
});

test('compose server has no owner default in per-user tools', () => {
  const s = R('mcp/compose_gate_server.py');
  assert.equal((s.match(/user_id: str = "owner"/g) || []).length, 0,
    'no per-user tool defaults to the shared owner');
  assert.match(s, /def learner_start/, 'learner_start exists');
  assert.match(s, /COMPOSE_ALLOW_OWNER/, 'owner path is env-gated');
  assert.match(s, /compare_digest/, 'token compare is constant-time');
  assert.match(s, /token_sha/, 'only the token hash is stored');
});
