/* essay-workshop.js — assemble, never generate. Ground + plan + enquiry -> packet/draft. */
(() => {
  const API = 'https://ipvv-api.tradesprior.workers.dev';
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const LS = 'svv-essay-workshop/1';
  const state = { profile: null, groundIndex: [], sources: [], bib: null, ground: null, plan: null, packet: '', draftDoc: null };

  const SINGLE = [
    ['Abstract', 130], ['Introduction', 340], ['The Doctrinal Context', 380],
    ['The Argument', 900], ['Objections and Replies', 650], ['The Synthesis', 420],
    ['Conclusion', 280], ['References', 60],
  ];
  const COMPARE = [
    ['Abstract', 150], ['Introduction: Two Accounts of the Primary', 380],
    ['The Question Stated', 300], ['Being as Primary Cause (Aquinas)', 720],
    ['Consciousness as Primary Cause (Abhinavagupta)', 720],
    ['The Crux: Esse or Cit?', 650], ['Mediating Orders: Angels and Tattvas / Deities', 650],
    ['Causation: Creation and Manifestation', 600], ['Objection and Disanalogy', 600],
    ['Conclusion', 300], ['References', 60],
  ];

  function save() {
    const data = {
      title: $('#ew-title').value, angle: $('#ew-angle').value,
      enquiry: $('#ew-enquiry').value, litNote: $('#ew-lit-note').value,
      mode: $('#ew-mode').value, words: $('#ew-words').value,
      verseLimit: $('#ew-verse-limit').value, work: $('#ew-work').value,
      selected: [...document.querySelectorAll('.ew-src:checked')].map(x => x.value),
      log: [...$('#ew-log').children].map(li => li.textContent),
    };
    try { localStorage.setItem(LS, JSON.stringify(data)); } catch {}
  }
  function load() {
    try { return JSON.parse(localStorage.getItem(LS) || '{}'); } catch { return {}; }
  }

  async function getJSON(url, opts) {
    const r = await fetch(url, Object.assign({ credentials: 'include' }, opts));
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || (url + ' → ' + r.status));
    return j;
  }

  async function boot() {
    try {
      const me = await getJSON(API + '/api/auth/me');
      state.profile = me.profile || null;
    } catch { state.profile = null; }
    $('#ew-auth').innerHTML = state.profile
      ? `Signed in as <b>${esc(state.profile.display_name || state.profile.id)}</b>. Drafts save privately; nothing is published.`
      : `Read-only workshop. <a href="?view=scholar">Sign in via Scholar</a> to save drafts and request review.`;

    try {
      const gi = await getJSON('data/essay-ground/index.json');
      state.groundIndex = gi.works || [];
      $('#ew-work').innerHTML = state.groundIndex.map(w =>
        `<option value="${esc(w.work)}" data-path="${esc(w.path)}">${esc(w.work)} · ${w.count} verses</option>`).join('') || '<option value="">no ground exported</option>';
    } catch { $('#ew-work').innerHTML = '<option value="">no ground index</option>'; }

    try {
      const si = await getJSON('data/essay-sources/index.json');
      state.sources = si.sources || [];
      $('#ew-lit').innerHTML = state.sources.map(s => `
        <div class="ew-card"><label><input type="checkbox" class="ew-src" value="${esc(s.id)}"/>
        <span><b>${esc(s.citation)}</b> — ${esc(s.title)}
        <span class="cite">${esc(s.authors.join(', '))} · ${esc(s.venue || '')}${s.doi ? ' · ' + esc(s.doi) : ''}</span></span></label></div>`).join('');
    } catch { $('#ew-lit').innerHTML = '<p class="ew-note">Literature index unavailable.</p>'; }

    try {
      const b = await getJSON('data/essay-sources/kaul-citations.json');
      state.bib = b;
      $('#ew-lit').insertAdjacentHTML('beforeend',
        `<div class="ew-card"><label><input type="checkbox" class="ew-src" value="__bib__" id="ew-bib"/>
        <span><b>Kaul 2022 bibliography</b> — ${b.count} citations
        <span class="cite">Bibliographic engagement only; claims stay off the public site.</span></span></label></div>`);
    } catch {}

    const saved = load();
    if (saved.title) $('#ew-title').value = saved.title;
    if (saved.angle) $('#ew-angle').value = saved.angle;
    if (saved.enquiry) $('#ew-enquiry').value = saved.enquiry;
    if (saved.litNote) $('#ew-lit-note').value = saved.litNote;
    if (saved.mode) $('#ew-mode').value = saved.mode;
    if (saved.words) $('#ew-words').value = saved.words;
    if (saved.verseLimit) $('#ew-verse-limit').value = saved.verseLimit;
    if (saved.work) $('#ew-work').value = saved.work;
    if (Array.isArray(saved.log)) saved.log.forEach(t => addLog(t, false));
    if (Array.isArray(saved.selected)) document.querySelectorAll('.ew-src').forEach(x => { if (saved.selected.includes(x.value)) x.checked = true; });
    document.body.addEventListener('input', save);
    document.body.addEventListener('change', save);
  }

  async function loadGround() {
    const opt = $('#ew-work').selectedOptions[0];
    if (!opt || !opt.dataset.path) throw new Error('Choose an exported ground.');
    const doc = await getJSON(opt.dataset.path);
    state.ground = doc;
    return doc;
  }

  function buildPlan() {
    const mode = $('#ew-mode').value;
    const words = Math.max(800, Math.min(8000, Number($('#ew-words').value) || 3000));
    const skel = mode === 'comparative' ? COMPARE : SINGLE;
    const total = skel.reduce((a, [, w]) => a + w, 0);
    const verses = state.ground ? Object.keys(state.ground.verses) : [];
    const limit = Math.max(1, Math.min(verses.length || 1, Number($('#ew-verse-limit').value) || 22));
    const sel = verses.slice(0, limit);
    return {
      title: $('#ew-title').value.trim() || 'Untitled essay',
      mode, words, work: state.ground ? state.ground.work : '',
      target: sel[0] || '',
      sections: skel.map(([t, w]) => ({ title: t, target_words: Math.round(w * words / total) })),
      verses: sel,
      ground_sha256: state.ground ? state.ground.sha256 : null,
    };
  }

  function groundText(plan) {
    if (!state.ground) return '';
    const lines = [];
    for (const vid of plan.verses) {
      const v = state.ground.verses[vid]; if (!v) continue;
      lines.push(`[${vid}] speaker: ${v.speaker || ''} | question: ${v.question || ''}`);
      if (v.sanskrit) lines.push(`  sanskrit: ${v.sanskrit}`);
      if (v.l3) lines.push(`  l3: ${v.l3}`);
      if (v.l2 && v.l2 !== v.l3) lines.push(`  l2: ${v.l2}`);
      (v.argmap?.premises || []).slice(0, 4).forEach(p => lines.push(`  premise: ${p}`));
      if (v.argmap?.inference) lines.push(`  inference: ${v.argmap.inference}`);
      (v.argmap?.uncertainties || []).slice(0, 3).forEach(u => lines.push(`  uncertainty: ${u}`));
    }
    return lines.join('\n');
  }

  function literatureText() {
    const ids = [...document.querySelectorAll('.ew-src:checked')].map(x => x.value);
    const chosen = state.sources.filter(s => ids.includes(s.id));
    const note = $('#ew-lit-note').value.trim();
    const bib = ids.includes('__bib__') && state.bib
      ? 'Bibliography identified by Kaul 2022 (engage only; do not attribute a claim not in the packet):\n' +
        state.bib.citations.map(c => `- ${c.author} ${c.year} (${c.topic})`).join('\n') : '';
    return [chosen.map(s => `- ${s.citation}: ${s.title} (${s.role}). ${s.note || ''}`).join('\n'), bib,
      note ? `Reviewer's requirement: ${note}` : ''].filter(Boolean).join('\n');
  }

  const TARGET = { words: 4000, sections: 9, unique_verses: 22, sanskrit_quotes: 14,
    objection_moves: 18, reply_moves: 20, questions: 10, author_claims: 3, secondary_citations: 8 };
  function metrics(text) {
    const secs = (text.match(/^##\s+/gm) || []).length;
    const words = (text.match(/\b[\w\u0100-\u017f'-]+\b/g) || []).length;
    const verses = new Set((text.match(/\b(?:tsa|tal|ipk|ipv)-[a-z0-9]+-v\d+\b/g) || []));
    const lines = text.split('\n');
    let skt = 0;
    for (const line of lines) {
      const t = line.trim(); if (!t) continue;
      if (t.startsWith('>') && (t.includes('||') || /[āīūṛṃḥśṣṭḍṇñṅ]/.test(t))) { skt++; continue; }
      if (t.length > 50 && /[āīūṛṃḥśṣṭḍṇñṅ]/.test(t) && /\[(?:tsa|tal|ipk|ipv)-[^\]]+\]\s*$/.test(t)) skt++;
    }
    return {
      words, sections: secs, unique_verses: verses.size, sanskrit_quotes: skt,
      objection_moves: (text.match(/\b(objection|opponent|argues?|would say|on behalf of)\b/gi) || []).length,
      reply_moves: (text.match(/\b(reply|in response|therefore|hence|it follows|maintains|points out)\b/gi) || []).length,
      questions: (text.match(/\?/g) || []).length,
      author_claims: (text.match(/\b(I (?:argue|show|claim)|this (?:essay|paper) (?:shows|argues)|we argue)\b/gi) || []).length,
      secondary_citations: (text.match(/\[[^\]]*\b\d{4}[a-z]?[^\]]*\]/g) || []).length,
      literature: /^##\s+.*(literature|scholarship)/mi.test(text),
      desideratum: /desideratum|remains unresolved/i.test(text),
    };
  }
  function scoreDraft(text) {
    const m = metrics(text || '');
    const rows = Object.entries(TARGET).map(([k, t]) => [k, m[k], t, m[k] >= t]);
    rows.push(['literature section', m.literature, true, m.literature]);
    rows.push(['desideratum', m.desideratum, true, m.desideratum]);
    const pass = rows.filter(r => r[3]).length;
    $('#ew-score').textContent = `${pass}/${rows.length} checks pass\n\n` +
      rows.map(([k, v, t, ok]) => `${ok ? 'PASS' : 'FAIL'} ${k.padEnd(22)} ${String(v).padStart(6)} / ${t}`).join('\n');
  }

  function enquiryAll() {
    const log = [...$('#ew-log').children].map(li => '- ' + li.textContent);
    return [$('#ew-enquiry').value.trim()].concat(log).filter(Boolean).join('\n');
  }

  function buildPacket(plan) {
    const rules = `RULES
- Quote Sanskrit ONLY from a "sanskrit:" field above, verbatim. Never invent a verse or citation.
- Cite Abhinavagupta as [verse-id]. Cite Aquinas as [ST I, q.N, a.M] only if in the literature packet.
- Give the rival the strongest form of the objection, then reply, then state the consequence.
- Do not announce the thesis early; earn it and name it in the Conclusion.
- Keep supplied uncertainties open. Do not smooth a fork.`;
    const axes = plan.mode === 'comparative' ? `FOUR AXES
1. What is primary: being (esse) or consciousness/agency (cit, kartr)?
2. Mediating order: angels as created immaterial substances vs tattvas/saktis/deities as levels or powers.
3. Causation: creation ex nihilo and secondary causes vs abhasa/manifestation and svatantrya.
4. Knowledge and naming: analogy of being vs recognition (pratyabhijna) and vimarsa.
MANDATORY DISANALOGY: name at least three places the comparison breaks.` : '';
    return `ROLE
You assemble a scholarly essay from frozen slots. You do not invent evidence. You write the
transitions, objections, replies and consequences around the supplied ground.

TITLE
${plan.title}

SHAPE (${plan.words} words)
${plan.sections.map(s => `- ${s.title}: ~${s.target_words} words`).join('\n')}

${axes}

GROUND — ABHINAVAGUPTA (${plan.work}, ground sha ${String(plan.ground_sha256).slice(0, 12)})
${groundText(plan)}

LITERATURE (metadata; do not quote text not supplied)
${literatureText() || '(none selected)'}

AUTHOR'S ENQUIRY — the argument that must be answered
${enquiryAll() || '(none yet)'}

${rules}`;
  }

  async function assemble() {
    $('#ew-status').textContent = 'Assembling…';
    $('#ew-draft-wrap').hidden = true;
    try {
      await loadGround();
      const plan = buildPlan();
      state.plan = plan;
      $('#ew-plan-out').textContent = plan.sections.map(s => `${s.title} — ~${s.target_words}w`).join('\n') +
        `\n\nverses: ${plan.verses.length} · ground sha ${String(plan.ground_sha256).slice(0, 12)}`;
      state.packet = buildPacket(plan);
      $('#ew-packet').value = state.packet;

      let draft = null;
      try {
        const out = await getJSON(API + '/api/essay/assemble', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            work: plan.work, target: plan.target, title: plan.title, mode: plan.mode,
            words: plan.words, plan: plan.sections, ground: groundText(plan),
            literature: literatureText(), enquiry: enquiryAll(),
            ground_sha256: plan.ground_sha256, consent_to_ai: true,
          }),
        });
        draft = out && out.text ? String(out.text) : null;
      } catch (e) {
        draft = null;
        $('#ew-status').textContent = 'Live assembler not configured (' + e.message + '). Packet prepared — copy it to the agent.';
      }
      if (draft) {
        $('#ew-draft').value = draft;
        $('#ew-draft-wrap').hidden = false;
        scoreDraft(draft);
        $('#ew-status').textContent = 'Assembled from the frozen packet. Read it, then push back.';
      } else {
        $('#ew-draft').value = '';
        $('#ew-draft-wrap').hidden = true;
      }
    } catch (e) {
      $('#ew-status').textContent = 'Error: ' + e.message;
    }
  }

  async function saveToScholar() {
    if (!state.profile) { $('#ew-save-status').textContent = 'Sign in via Scholar first.'; return; }
    const text = $('#ew-draft').value.trim() || $('#ew-packet').value.trim();
    if (!text) { $('#ew-save-status').textContent = 'Nothing to save.'; return; }
    const plan = state.plan || buildPlan();
    const id = 'essay:' + (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()));
    $('#ew-save-status').textContent = 'Saving…';
    try {
      const out = await getJSON(API + '/api/scholar/documents/' + encodeURIComponent(id), {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'essay', work: plan.work, target: plan.target, layer: 'l3',
          title: plan.title, content: { text }, expected_revision: 0,
        }),
      });
      state.draftDoc = out.document;
      $('#ew-save-status').textContent = 'Saved privately to Scholar (revision ' + out.document.revision + '). Request review from the Scholar tab.';
    } catch (e) {
      $('#ew-save-status').textContent = 'Save failed: ' + e.message;
    }
  }

  function addLog(text, rerender = true) {
    if (!text || !String(text).trim()) return;
    const li = document.createElement('li');
    li.textContent = String(text).trim();
    $('#ew-log').appendChild(li);
  }

  function sharpen() {
    const arg = $('#ew-enquiry').value.trim();
    if (arg) addLog(arg, false);
    $('#ew-enquiry').value = '';
    assemble();
  }

  async function copyPacket() {
    const text = $('#ew-packet').value || state.packet;
    if (!text) return;
    try { await navigator.clipboard.writeText(text); $('#ew-status').textContent = 'Packet copied.'; }
    catch { $('#ew-packet').select(); document.execCommand('copy'); $('#ew-status').textContent = 'Packet copied.'; }
  }

  document.addEventListener('DOMContentLoaded', () => {
    boot();
    $('#ew-plan').onclick = async () => {
      try {
        await loadGround();
        const plan = buildPlan();
        $('#ew-plan-out').textContent = plan.sections.map(s => `${s.title} — ~${s.target_words}w`).join('\n') +
          `\n\nverses: ${plan.verses.length} · ground sha ${String(plan.ground_sha256).slice(0, 12)}`;
      } catch (e) { $('#ew-plan-out').textContent = 'Error: ' + e.message; }
    };
    $('#ew-assemble').onclick = assemble;
    $('#ew-copy').onclick = copyPacket;
    $('#ew-add-arg').onclick = () => { addLog($('#ew-enquiry').value, false); $('#ew-enquiry').value = ''; save(); };
    $('#ew-save').onclick = saveToScholar;
    $('#ew-sharpen').onclick = sharpen;
    let st = null;
    $('#ew-draft').addEventListener('input', () => {
      clearTimeout(st); st = setTimeout(() => scoreDraft($('#ew-draft').value), 400);
    });
  });
})();
