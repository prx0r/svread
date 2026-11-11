/* measurement.test.cjs — W5 scaffold: licence gate + held-out blind set. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');
const read = p => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));

test('licence registry passes its own gate; admission refuses the right things', () => {
  const out = execFileSync('python3', ['tools/check_licenses.py', '--check'],
    { cwd: ROOT, encoding: 'utf8' });
  assert.ok(/GREEN/.test(out), out);
  const reg = read('data/licenses/registry.json');
  assert.ok(reg.entries.length >= 8, 'registry has entries');
  assert.ok(reg.rule.includes('without a row here'), 'rule states the gate');
  // refused: excluded and pending
  const refuse = id => {
    try {
      execFileSync('python3', ['tools/check_licenses.py', '--admit', id, 'train'],
        { cwd: ROOT, encoding: 'utf8' });
      return false;
    } catch (e) { return true; }
  };
  assert.ok(refuse('mitrasamgraha-nc-nd'), 'excluded slice refused for training');
  assert.ok(refuse('mitrasamgraha-sa'), 'pending corpus refused until verified');
  assert.ok(refuse('kaggle-chant-assets'), 'chant assets read-only');
  // admitted: registered quote
  const adm = execFileSync('python3', ['tools/check_licenses.py', '--admit',
    'gretil-editions', 'quote'], { cwd: ROOT, encoding: 'utf8' });
  assert.ok(/^ADMIT/.test(adm), adm);
});

test('evaluation set: 50 passages, retrospective scope and machine labels are honest', () => {
  const out = execFileSync('python3', ['tools/eval_blind.py', '--check'],
    { cwd: ROOT, encoding: 'utf8' });
  assert.ok(/GREEN/.test(out), out);
  const set = read('data/eval/trika-blind-50.json');
  assert.equal(set.count, 50);
  assert.equal(set.items.length, 50);
  assert.equal(new Set(set.items.map(i => i.id)).size, 50, 'unique ids');
  assert.ok(set.held_out_policy.includes('not a sealed holdout'));
  assert.ok(set.held_out_policy.includes('No human correction scores were used to select items'));
  for (const it of set.items) {
    assert.equal(it.held_out, true, it.id);
    assert.equal(it.held_out_scope, 'human-scoring-only', it.id);
    assert.ok(it.text && it.text.length > 10, it.id + ' has text');
    assert.match(it.trace_sha256, /^[0-9a-f]{64}$/, it.id);
    assert.equal(it.category, null, it.id + ' category waits for a human');
    assert.equal(it.classify, 'pending-human', it.id);
    assert.ok(['short', 'medium', 'long'].includes(it.difficulty), it.id);
    assert.ok(it.category_candidate.endsWith('-candidate'), it.id + ' hint is a candidate');
    assert.ok(!it.work.includes('ghatakarpara'), 'hold work excluded');
  }
  // rubric states the law
  const rub = fs.readFileSync(path.join(ROOT, 'data/eval/RUBRIC.md'), 'utf8');
  assert.ok(rub.includes('Machine never writes these numbers'));
  assert.ok(rub.includes('No aggregate'));
});

test('candidate #1 (ours) is exported with honest coverage', () => {
  const cand = read('data/eval/candidates/ours.json');
  const man = read('data/eval/candidates/ours.manifest.json');
  assert.equal(man.format, 'svatantrya.eval-candidate/1');
  assert.equal(man.candidate, 'ours');
  assert.equal(Object.keys(cand).length, man.passages_with_text, 'count matches manifest');
  assert.ok(man.passages_total === 50, 'set size recorded');
  assert.ok(man.passages_with_text > 0, 'some translations on file');
  assert.ok(man.passages_with_text <= 50);
  // every exported passage belongs to the held-out set
  const set = read('data/eval/trika-blind-50.json');
  const ids = new Set(set.items.map(i => i.id));
  for (const id of Object.keys(cand)) assert.ok(ids.has(id), 'exported id in set: ' + id);
  // results skeleton exists and scores nothing
  const res = read('data/eval/results-ours.json');
  assert.equal(res.human.status, 'PENDING_HUMAN');
  assert.equal(res.coverage.answered, man.passages_with_text);
  assert.ok(!('mean_minutes' in res));
  assert.ok(man.note.includes('no text is generated'));
  // slug-alignment regression: these translations live under a different slug
  // than the blind set's target (paratrimshika -> ptv-*, sivasutra -> span-*)
  assert.ok('paratrimshika:para-p01' in cand, 'paratrimshika aligned by citation');
  assert.ok('sivasutra:sivs-p01' in cand, 'sivasutra aligned by citation');
  // coverage accounting is complete: full + partial + unmeasured == with_text
  assert.equal((man.passages_full_coverage || 0) + (man.passages_partial || 0) +
               (man.passages_coverage_unmeasured || 0), man.passages_with_text);
  assert.ok(man.passages_full_coverage >= 20, 'most exported passages fully covered');
  // every partial flag carries a measured ratio below the threshold
  for (const [id, v] of Object.entries(man.provenance)) {
    if (v.partial) assert.ok(v.coverage !== null && v.coverage < 0.6, 'partial ratio: ' + id);
  }
});

test('candidate runner records coverage only, never scores', () => {
  const set = read('data/eval/trika-blind-50.json');
  const tmp = path.join(ROOT, 'data/eval', '_tmp-cand.json');
  const cand = {};
  for (const it of set.items.slice(0, 10)) cand[it.id] = 'x';
  fs.writeFileSync(tmp, JSON.stringify(cand));
  try {
    const out = execFileSync('python3', ['tools/eval_blind.py',
      '--candidate', tmp, '--name', 'selftest'], { cwd: ROOT, encoding: 'utf8' });
    assert.ok(/10\/50/.test(out), out);
    const res = read('data/eval/results-selftest.json');
    assert.equal(res.human.status, 'PENDING_HUMAN');
    assert.ok(!('mean_minutes' in res) && !('quality' in res), 'no machine score');
    assert.equal(res.coverage.missing.length, 40);
    assert.equal(res.coverage.extra.length, 0);
  } finally {
    fs.unlinkSync(tmp);
    fs.unlinkSync(path.join(ROOT, 'data/eval/results-selftest.json'));
  }
});

test('blind scoring sheet hides identity and balances presentation order', () => {
  const ours = read('data/eval/candidates/ours.json');
  const stub = {};
  for (const k of Object.keys(ours)) stub[k] = 'stub ' + k;
  const tmp = path.join(ROOT, 'data/eval', '_tmp-stub.json');
  const out = path.join(ROOT, 'data/eval', '_tmp-sheet');
  fs.writeFileSync(tmp, JSON.stringify(stub));
  try {
    execFileSync('python3', ['tools/eval_score_sheet.py',
      '--a', 'data/eval/candidates/ours.json', '--b', tmp,
      '--a-manifest', 'data/eval/candidates/ours.manifest.json',
      '--out', out, '--seed', '20261111'], { cwd: ROOT, encoding: 'utf8' });
    const md = fs.readFileSync(path.join(out, 'worksheet.md'), 'utf8');
    const structural = md.split('\n').filter(l => !l.startsWith('> ')).join('\n').toLowerCase();
    for (const word of ['mitra', 'ours', 'qwen']) {
      assert.ok(!structural.includes(word), 'sheet leaks ' + word);
    }
    const sheet = JSON.parse(fs.readFileSync(path.join(out, 'sheet.json'), 'utf8'));
    const key = JSON.parse(fs.readFileSync(path.join(out, 'key.json'), 'utf8'));
    assert.equal(sheet.rows.length, 27, 'only measurable full-coverage passages enter the comparison');
    assert.equal(key.excluded_unmeasured.length, 9, 'unmeasured passages stay out of the head-to-head');
    assert.equal(key.note, 'Scorer must not read this file.');
    for (const row of sheet.rows) {
      assert.ok(key.mapping[row.id], 'key covers ' + row.id);
      for (const v of ['A', 'B']) {
        assert.ok(row.versions[v].text.length > 0, 'version text present');
        assert.equal(row.versions[v].minutes, null, 'minutes not pre-filled');
        assert.equal(row.versions[v].verdict, null, 'verdict not pre-filled');
      }
      assert.deepEqual(row.presentation.slice().sort(), ['A', 'B']);
    }
    // presentation order is randomised, not all one way
    const aFirst = sheet.rows.filter(r => r.presentation[0] === 'A').length;
    assert.ok(aFirst > 0 && aFirst < sheet.rows.length, 'order is mixed');
  } finally {
    fs.unlinkSync(tmp);
    fs.rmSync(out, { recursive: true, force: true });
  }
});
