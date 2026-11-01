/* svread — Scaife mirror. Behaviors lifted from scaife-viewer (MIT).
   ?work=X [&left=sa-deva|sa-iast|l1|l2|c1] [&right=none|l1|l2|c1|mine] */
(function(){
"use strict";
const $ = s => document.querySelector(s);
const esc = s => (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const qs = new URLSearchParams(location.search);
const WORK = qs.get('work') || 'bhairavastava';
const SRC = qs.get('src');
const IPVV = 'https://ipvv-a8u.pages.dev';
/* studio chant: karaoke timings + mp3s live on the ipvv origin.
   Probed per work — the day kashaudio ships new timings, they just work. */
const CHANTDIR = {anuttarastika:'anuttarashtika_trad'};
let KAR = null; // {words:[[ {w,r,t0,t1} ]], au:[url|null]}
let AU = null, AUtimer = null, AUix = null;
let LEFT = qs.get('left') || localStorage.getItem('svv-left') || 'sa-deva';
let RIGHT = qs.get('right') || localStorage.getItem('svv-right') || 'l2';
const LIDS = ['sa-deva','sa-iast','l1','l2','c1'];
const RIDS = ['none','l1','l2','c1','mine'];
if(!LIDS.includes(LEFT)) LEFT = 'sa-deva';
if(!RIDS.includes(RIGHT)) RIGHT = 'l2';

const IAST_DEVA = (()=>{
  const VOW={a:'\u0905','\u0101':'\u0906',i:'\u0907','\u012b':'\u0908',u:'\u0909','\u016b':'\u090a','\u1e5b':'\u090b','\u1e5d':'\u090c','\u1e37':'\u090d',e:'\u090f',o:'\u0913',ai:'\u0910',au:'\u0914'};
  const VSN={'\u0101':'\u093e',i:'\u093f','\u012b':'\u0940',u:'\u0941','\u016b':'\u0942','\u1e5b':'\u0943','\u1e5d':'\u0944','\u1e37':'\u0962',e:'\u0947',o:'\u094b',ai:'\u0948',au:'\u094c'};
  const CON={k:'\u0915',kh:'\u0916',g:'\u0917',gh:'\u0918','\u014b':'\u0919',c:'\u091a',ch:'\u091b',j:'\u091c',jh:'\u091d','\u00f1':'\u091e','\u1e6d':'\u091f','\u1e6dh':'\u0920','\u1e0d':'\u0921','\u1e0dh':'\u0922','\u1e47':'\u0923',t:'\u0924',th:'\u0925',d:'\u0926',dh:'\u0927',n:'\u0928',p:'\u092a',ph:'\u092b',b:'\u092c',bh:'\u092c',m:'\u092e',y:'\u092f',r:'\u0930',l:'\u0932',v:'\u0935','\u015b':'\u0936','\u1e63':'\u0937',s:'\u0938',h:'\u0939'};
  const OTH={'\u1e43':'\u0902','\u1e41':'\u0902','\u1e25':'\u0903',"'":'\u093d','\u2019':'\u093d','.':'\u0964','..':'\u0965','|':'\u0964','||':'\u0965',' ':' ','\n':'\n','\u2014':'\u0964'};
  const HAL='\u094d';
  const ALL=Object.keys(CON).concat(Object.keys(VOW)).sort((a,b)=>b.length-a.length);
  function convert(s){
    const tk=[]; let i=0;
    while(i<s.length){
      let hit=null;
      for(const k of ALL){ if(s.startsWith(k,i)){hit=k;break;} }
      if(!hit){ const c=s[i]; tk.push({t:'o',v:(OTH[c]!==undefined?OTH[c]:c)}); i++; continue; }
      if(CON[hit]) tk.push({t:'c',v:CON[hit]});
      else tk.push({t:'v',v:VOW[hit],k:hit});
      i+=hit.length;
    }
    let out='';
    for(let j=0;j<tk.length;j++){
      const t=tk[j];
      if(t.t==='o'){out+=t.v;continue;}
      if(t.t==='v'){out+=t.v;continue;}
      const nx=tk[j+1];
      if(nx&&nx.t==='v'){ if(nx.k==='a'){out+=t.v;} else {out+=t.v+(VSN[nx.k]||'');} j++; }
      else if(nx&&nx.t==='c'){ out+=t.v+HAL; }
      else { out+=t.v+HAL; }
    }
    return out;
  }
  return {convert};
})();
function cleanSA(s){ return (s||'').replace(/^# Text\s*/,'').replace(/\[[A-Za-z0-9_]+\]/g,'').replace(/\s+/g,' ').trim(); }
function cleanEN(s){ return (s||'').replace(/^#+\s*[^\n]*\n/,'').replace(/\s*\/\/\s*\S+\s*$/,'').trim(); }
function rich(s){
  return esc(s).replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
    .replace(/(^|[\s(])\*([^*\n]+)\*/g, '$1<i>$2</i>');
}
function mdSec(s, bare){
  return (s||'').split(/\n{2,}/).map(p=>{
    p = p.trim(); if(!p) return '';
    const hm = p.match(/^(#{1,3})\s+(.*)$/);
    if(hm) return bare ? `<p>${esc(hm[2])}</p>` : `<div class="vlab" style="font-size:12px;letter-spacing:.15em;text-transform:uppercase;color:#B45141;margin:.8rem 0 .3rem">${esc(hm[2])}</div>`;
    const lm = p.match(/^\*\*([^*]+)\*\*\s*(.*)$/s);
    if(lm){
      const body = rich(lm[2]);
      return bare ? `<p>${body}</p>`
        : `<div><div class="vlab" style="font-size:12px;letter-spacing:.15em;text-transform:uppercase;color:#B45141;margin:.8rem 0 .3rem">${esc(lm[1]).replace(/\.+$/,'')}</div><div>${body}</div></div>`;
    }
    return `<p>${rich(p).replace(/\n/g, '<br>')}</p>`;
  }).join('');
}
async function get(p){
  const r = await fetch(p);
  if(!r.ok) throw 0;
  const ct = r.headers.get('content-type')||'';
  return ct.includes('json') ? r.json() : r.text();
}
function norm(s){ return (s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z]/g,''); }
function getVar(id){ try{ return localStorage.getItem(`svv-${WORK}-${id}`) || ''; }catch(e){ return ''; } }
function setVar(id, v){ try{ localStorage.setItem(`svv-${WORK}-${id}`, v); }catch(e){} }
function setCol(which, v){
  const u = new URL(location.href);
  u.searchParams.set(which, v);
  try{ localStorage.setItem(which==='left'?'svv-left':'svv-right', v); }catch(e){}
  location.href = u.toString();
}

let DATA = null, TERMS = {}; // verseId -> [{t,g}]
function buildTerms(v){
  TERMS = {};
  v.forEach(x=>{
    const m = (x.c1||'').match(/\*\*KEY TERMS\.\*\*\s*([^\n]+)/);
    TERMS[x.id] = [];
    if(m) m[1].split(/[·;]/).forEach(part=>{
      const mm = part.trim().match(/^(.+?)\s*\((.+)\)$/);
      if(mm) TERMS[x.id].push({t:mm[1].trim(), g:mm[2].trim()});
    });
  });
}
function glossFor(id, word){
  const w = norm(word);
  for(const e of (TERMS[id]||[])){
    const t = norm(e.t);
    if(!t || !w) continue;
    if(t===w || t.startsWith(w.slice(0,-2)) && w.length>3 || w.startsWith(t)) return e;
  }
  return null;
}

const VDEF = {
  'sa-deva': v=>({label:v.title||WORK, desc:'Sanskrit text, Devanagari', meta:'san edition'}),
  'sa-iast': v=>({label:v.title||WORK, desc:'Sanskrit text, IAST transliteration', meta:'san transliteration'}),
  'l1': ()=>({label:'L1 — close translation', desc:'Proposition-faithful English, Sanskrit-close', meta:'eng translation'}),
  'l2': ()=>({label:'L2 — read translation', desc:'Book prose, Dyczkowski-mode', meta:'eng translation'}),
  'c1': ()=>({label:'C1 — commentary', desc:'Passage commentary, 100–450 words', meta:'eng commentary'}),
  'mine': ()=>({label:'Your version', desc:'Pasted by you, this device only', meta:'eng user-version'}),
  'none': ()=>({label:'—', desc:'', meta:''}),
};

function saWords(v, iast){
  // aligned karaoke timings when chant covers this verse's words, else plain split.
  // data-t0/1 emitted only for matched words; tickAU skips the rest.
  const kw = KAR && KAR.words[v.n-1];
  if(kw && kw.length){
    const shown = iast ? kw.map(k=>k.r) : kw.map(k=>IAST_DEVA.convert(k.r));
    return `<div class="sa">` + shown.map((w,j)=>{
      const t = (kw[j].t0!=null) ? ` data-t0="${kw[j].t0}" data-t1="${kw[j].t1}" data-i="${v.n-1}"` : '';
      return `<span class="w" data-w="${esc(kw[j].r)}" data-v="${esc(v.id)}"${t}>${esc(w)}</span>`;
    }).join(' ')
      + `</div>` + (!iast ? `<div class="ro">${esc(kw.map(k=>k.r).join(' '))}</div>` : '');
  }
  const raw = cleanSA(v.sa||'');
  const words = raw.split(/\s+/).filter(Boolean);
  const shown = iast ? words : words.map(w=>IAST_DEVA.convert(w));
  return `<div class="sa">` + shown.map((w,j)=>
    `<span class="w" data-w="${esc(words[j])}" data-v="${esc(v.id)}" data-i="${v.n-1}">${esc(w)}</span>`).join(' ')
    + `</div>` + (!iast ? `<div class="ro">${esc(raw)}</div>` : '');
}
function verseText(v, vid, col){
  const raw = cleanSA(v.sa||'');
  const pass = v.gate==='PASS' && (v.l2||v.l1);
  if(vid==='sa-deva') return saWords(v, false);
  if(vid==='sa-iast') return saWords(v, true);
  if(!pass) return saWords(v, false)
    + `<div class="milestone">English withheld — gate ${esc(v.gate||'BLOCKED')}</div>`;
  if(vid==='l1') return `<div class="enp">${esc(cleanEN(v.l1||v.l2||''))}</div>`;
  if(vid==='l2') return `<div class="enp">${esc(cleanEN(v.l2||v.l1||''))}</div>`;
  if(vid==='c1') return v.c1 ? `<div class="enp c1sec">${mdSec(v.c1)}</div>` : `<div class="enp">${esc(cleanEN(v.l2||v.l1||''))}</div>`;
  if(vid==='mine'){
    const uv = getVar(v.id);
    return (uv ? `<div class="enp yours">${esc(uv)}</div>` : '')
      + `<div class="varbox"><textarea id="var-${esc(v.id)}" placeholder="Paste your translation (from your own book)…"></textarea><br><button class="savebtn" data-ch="${esc(v.id)}">Save on this device</button></div>`;
  }
  return '';
}

async function main(){
  let D = null;
  for(const u of (SRC ? [SRC] : [`data/${WORK}.json`, `${IPVV}/data/layers/${WORK}.json`, `${IPVV}/data/translations/${WORK}.json`])){
    try{ D = await get(u); if(D && (D.verses || D.chunks)) break; else D = null; }catch(e){ D = null; }
  }
  // last resort: Sanskrit root via works-index (Sanskrit always, English never)
  if(!D){
    try{
      const idx = await get('data/works-index.json');
      const rec = Object.values(idx||{}).find(r=>(r.translation===WORK||r.work===WORK) && r.sanskrit);
      if(rec){
        const raw = await get(`${IPVV}/data/sanskrit/${rec.sanskrit}`);
        const paras = String(raw).split(/\n{2,}|\n(?=[\u0900-\u097F])/).map(p=>p.trim()).filter(p=>p).slice(0,80);
        D = {title: rec.title||WORK, master: rec.author||'', verses: paras.map((p,i)=>({id:`${WORK}-s${i+1}`, sa:p, l1:'', l2:'', c1:'', argmap:'', gate:'WITHHELD'}))};
      }
    }catch(e){}
  }
  let verses = D && (D.verses || (D.chunks||[]).map(c=>({
    id:c.chunk, sa:c.sanskrit, l1:c.l1, l2:c.l2, c1:c.c1, argmap:c.argmap,
    gate:c.gate, model:c.model||'', date:c.date||'' })));
  if(!verses || !verses.length){
    $('.reader-main').innerHTML = `<p id="err">Nothing on file for “${esc(WORK)}” yet.</p>`;
    return;
  }
  DATA = {title:(D.title||WORK), master:(D.master||''), verses};
  DATA.verses.forEach((v,i)=>{ v.n = i+1; });
  // pretty title + master name from the library catalogue
  try{
    const lib = await get('data/library.json');
    for(const m of (lib||[])) for(const w of (m.works||[])){
      if(w.id===WORK){
        if(w.title) DATA.title = w.title;
        if(!DATA.master || DATA.master===WORK) DATA.master = m.name||m.id;
      }
    }
  }catch(e){}
  buildTerms(verses);
  const title = DATA.title, master = DATA.master;
  document.title = `${title} · svread`;
  $('#wh1').textContent = title;
  $('#wh2').textContent = `${master?master+' · ':''}verse 1–${verses.length} (${verses.length} passages)`;
  const nPass = verses.filter(v=>v.gate==='PASS' && (v.l2||v.l1)).length;
  $('#wh3').textContent = `${nPass}/${verses.length} passages gate-passed · English shows only where passed`;

  // studio chant for this work? align karaoke to displayed verses by word
  // overlap (karaoke entries may span differently than pipeline chunks).
  // Words failing to match get no timing; verses failing to match get no audio.
  try{
    const kar = await get(`${IPVV}/data/karaoke-${WORK}.json`);
    if(Array.isArray(kar) && kar.length){
      const dir = CHANTDIR[WORK] || WORK;
      const wmap = {};
      kar.forEach(k=>{ (k.words||[]).forEach(w=>{
        const key = w.r || w.w;
        if(key && !(key in wmap)) wmap[key] = {t0:w.t_on, t1:w.t_off};
      }); });
      KAR = {words: verses.map((v)=>{
        const raw = cleanSA(v.sa||v.sanskrit||'');
        return raw.split(/\s+/).filter(Boolean).map(w=>({w, r:w, ...(wmap[w]||{t0:null,t1:null})}));
      }), au: verses.map((v)=>{
        const raw = cleanSA(v.sa||v.sanskrit||'');
        const ws = new Set(raw.split(/\s+/).filter(Boolean));
        let best=null, bestN=0;
        kar.forEach(k=>{
          const ks = new Set((k.words||[]).map(x=>x.r||x.w));
          let n=0; ws.forEach(w=>{ if(ks.has(w)) n++; });
          if(n>bestN){ bestN=n; best=k; }
        });
        return (best && bestN>0) ? `${IPVV}/audio/${dir}/${best.id}.mp3` : null;
      })};
    }
  }catch(e){ KAR = null; }

  renderCol('L', LEFT); renderCol('R', RIGHT);
  if(RIGHT==='none'){ const t = $('#textR'); if(t) t.style.display='none'; const d=$('#colRdel'); if(d) d.style.display='none'; }
  await loadMorph();
  let LIBDATA = null;
  try{ LIBDATA = await get('data/library.json'); }catch(e){}
  buildLeftRail(verses, LIBDATA);
  buildRightRail(verses);
  applyPrefs();
  document.addEventListener('click', e=>{
    if(!e.target.closest('.verbar')) document.querySelectorAll('.dropdown-menu').forEach(m=>m.classList.remove('show'));
  });

  document.querySelectorAll('.savebtn').forEach(b=>{
    b.onclick = ()=>{
      const ta = document.getElementById(`var-${b.getAttribute('data-ch')}`);
      if(ta && ta.value.trim()){ setVar(b.getAttribute('data-ch'), ta.value.trim()); location.reload(); }
    };
  });
  document.querySelectorAll('#textL .w, #textR .w').forEach(w=>{
    w.onclick = ()=>selectWord(w);
  });
  // § = recite this verse (studio chant where it exists, voice otherwise)
  document.querySelectorAll('a.vref').forEach(a=>{
    a.onclick = e=>{ e.preventDefault(); reciteVerse(+a.getAttribute('data-i')); };
  });
  // gutter prev/next verse
  let cur = 0;
  const goVerse = d=>{
    cur = Math.min(verses.length-1, Math.max(0, cur+d));
    const el = document.querySelector(`.verse[data-i="${cur}"]`);
    if(el) el.scrollIntoView({block:'center', behavior:'smooth'});
  };
  $('#pgleft a').onclick = e=>{ e.preventDefault(); goVerse(-1); };
  $('#pgright a').onclick = e=>{ e.preventDefault(); goVerse(1); };
  $('#navsearch').onclick = e=>{ e.preventDefault(); const w = document.querySelector('#lib #wq'); if(w){ w.focus(); w.scrollIntoView({block:'center'}); } };
  // rail collapse arrows (Scaife)
  const lay = document.querySelector('.layout');
  $('#tabL a').onclick = e=>{ e.preventDefault(); lay.classList.toggle('hideL'); };
  $('#tabR a').onclick = e=>{ e.preventDefault(); lay.classList.toggle('hideR'); };

  window.scrollTo(0,0);
}
async function buildLeftRail(verses, LIBDATA){
  // LEFT RAIL — Scaife order: id, verses, library, reference, search, attributions, proof, export
  try{
    const lib = LIBDATA || (await get('data/library.json')) || [];
    const urn = `urn:svread:${WORK}`;
    const libAside = $('#lib');
    libAside.innerHTML =
      W('workid','Work ID', `<div class="urn">${esc(urn)}</div>`)
      + W('verses','Verses', `<a href="#" id="vcount" style="color:#B45141">${verses.length}</a>`)
      + W('library','Library', `<div id="liblist">${libraryHtml(lib)}</div>`)
      + W('ref','Passage Reference', `<div class="wsearch"><input id="wjump" placeholder="§ number…" inputmode="numeric"/><button id="wgo2">go</button></div><div class="vref-list" style="margin-top:.4rem">${verses.map((v,i)=>`<a href="#v${i}" data-i="${i}">§${i+1}</a>`).join('')}</div>`)
      + W('search','Text Search', `<div class="wsearch"><input id="wq" placeholder="find in this work…"/><button id="wgo">go</button></div><div style="margin:.3rem 0;font-size:13px"><label><input type="radio" name="smode" value="form" checked/> Form</label> <label style="margin-left:.6rem"><input type="radio" name="smode" value="lemma"/> Lemma</label></div><div class="cmp-note">Use text input above to find text in this version.</div><div id="wres" style="margin-top:.4rem"></div>`)
      + W('attr','Attributions', `<table class="wtable">`
        + `<tr><td>work</td><td>${esc(DATA.title)}</td></tr>`
        + `<tr><td>editions</td><td>L1 close · L2 read · C1 commentary — pipeline, machine-proposed, needs human review</td></tr>`
        + `<tr><td>gate</td><td>${verses.filter(v=>v.gate==='PASS').length}/${verses.length} passages passed</td></tr>`
        + (PROOF ? `<tr><td>proof</td><td>${Object.values(PROOF).filter(p=>p.gate==='PASS').length}/${Object.keys(PROOF).length} proved 5/5 · deterministic gate, no model</td></tr>` : '')
        + `<tr><td>repository</td><td>prx0r/svread · data: prx0r/ipvv layers</td></tr></table>`)
      + (PROOF ? W('proof','Proof Queue', proofQueueHtml()) : '')
      + W('export','Export Passage', `<a class="redlink" href="#" id="exp-t">as text</a> or <a class="redlink" href="#" id="exp-j">as json</a>`)
      + W('issue','Report an Issue', `<a class="redlink" href="https://github.com/prx0r/svread/issues/new" target="_blank" rel="noopener">open a GitHub issue</a>`);
    bindLibrary($('#liblist'));
    $('#vcount').onclick = e=>{ e.preventDefault(); const el=document.querySelector('.verse[data-i="0"]'); if(el) el.scrollIntoView(); };
    const goJump = ()=>{
      const n = parseInt(($('#wjump').value||'').replace(/[^0-9]/g,''),10);
      if(n>=1 && n<=verses.length){ const el=document.querySelector(`.verse[data-i="${n-1}"]`); if(el) el.scrollIntoView({block:'center'}); }
    };
    $('#wgo2').onclick = goJump;
    $('#wjump').addEventListener('keydown', e=>{ if(e.key==='Enter') goJump(); });
    libAside.querySelectorAll('.vref-list a').forEach(a=>{
      a.onclick = e=>{ e.preventDefault(); const el=document.querySelector(`.verse[data-i="${a.getAttribute('data-i')}"]`); if(el) el.scrollIntoView({block:'center',behavior:'smooth'}); };
    });
    const runQ = ()=>{
      const q = ($('#wq').value||'').trim();
      const box = $('#wres');
      if(!q){ box.innerHTML=''; return; }
      const mode = (libAside.querySelector('input[name=smode]:checked')||{}).value || 'form';
      const hits = [];
      if(mode==='lemma' && MORPH){
        const qn = normQ(q);
        verses.forEach((v,i)=>{
          const tags = MORPH[v.id]||{};
          for(const w of Object.keys(tags)){
            const mo = tags[w];
            const lem = normQ((mo&&mo.lemma)||'');
            if((lem && (lem===qn||lem.startsWith(qn))) || normQ(w)===qn || normQ(w).startsWith(qn)){ hits.push(i); break; }
          }
        });
      } else {
        const ql = q.toLowerCase();
        verses.forEach((v,i)=>{
          const hay = `${v.sa} ${v.l1} ${v.l2} ${v.c1||''}`.toLowerCase();
          if(hay.includes(ql)) hits.push(i);
        });
      }
      box.innerHTML = hits.length
        ? `${hits.length} match${hits.length===1?'':'es'}: ` + hits.map(i=>`<a href="#" data-i="${i}">§${i+1}</a>`).join(' ')
        : 'no matches in this work.';
      box.querySelectorAll('a').forEach(a=>{
        a.onclick = e=>{ e.preventDefault(); const el=document.querySelector(`.verse[data-i="${a.getAttribute('data-i')}"]`); if(el) el.scrollIntoView({block:'center',behavior:'smooth'}); };
      });
    };
    $('#wgo').onclick = runQ;
    $('#wq').addEventListener('keydown', e=>{ if(e.key==='Enter') runQ(); });
    $('#exp-t').onclick = e=>{ e.preventDefault(); dl(`${WORK}.txt`, verses.map((v,i)=>`§${i+1}\n${cleanSA(v.sa)}\n${cleanEN(v.l2||v.l1||'')}`).join('\n\n'), 'text/plain'); };
    $('#exp-j').onclick = e=>{ e.preventDefault(); dl(`${WORK}.json`, JSON.stringify(verses, null, 1), 'application/json'); };
    libAside.querySelectorAll('[data-pi]').forEach(a=>{
      a.onclick = e=>{ e.preventDefault(); const el=document.querySelector(`.verse[data-i="${a.getAttribute('data-pi')}"]`); if(el) el.scrollIntoView({block:'center',behavior:'smooth'}); };
    });
    libAside.querySelectorAll('.widget h2').forEach(h=>{ h.onclick = ()=>h.parentElement.classList.toggle('closed'); });
  }catch(e){ const la=$('#lib'); if(la) la.innerHTML='<p class="loading">library unavailable</p>'; }
}
function normQ(s){ return (s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z]/g, ''); }
// Hidden masters (no readable texts yet — restore by deleting this list):
// kallata (spandavrtti, spanda-sutra-varttika, tattvartha-cintamani),
// lalla (vakyani), lakshmanagupta + sambhunatha (transmission only),
// sivopadhyaya (vb-vivrti). Textless works under kept masters also filtered.
const HIDDEN_MASTERS = ['kallata','lalla','lakshmanagupta','sambhunatha','sivopadhyaya'];
function libraryHtml(lib){
  const shown = (lib||[]).filter(m=>!HIDDEN_MASTERS.includes(m.id))
    .map(m=>({m, works:(m.works||[]).filter(w=>w.lv)}))
    .filter(x=>x.works.length);
  const curMaster = (function(){
    for(const x of shown) if(x.works.some(w=>w.id===WORK)) return x.m.id;
    return '';
  })();
  return shown.map(x=>
    `<div class="m${x.m.id===curMaster?' open':''}" data-m="${esc(x.m.id)}">`
    + `<button class="mrow${x.m.id===curMaster?' on':''}"><span class="car">${x.m.id===curMaster?'▾':'▸'}</span><span>${esc(x.m.name||x.m.id)}</span></button>`
    + `<div class="wlist">${x.works.map(w=>`<a href="?work=${esc(w.id)}" class="${w.id===WORK?'cur':''}">${esc(w.title||w.id)}${w.lv==='sa'?' °':''}</a>`).join('')}</div></div>`
  ).join('');
}
function bindLibrary(box){
  if(!box) return;
  box.querySelectorAll('.mrow').forEach(b=>{
    b.onclick = ()=>{
      const m = b.parentElement, open = m.classList.toggle('open');
      b.querySelector('.car').textContent = open ? '▾' : '▸';
    };
  });
}

function renderCol(side, vid){
  const labelEl = $(side==='L' ? '#verlabelL' : '#verlabelR');
  const menuEl = $(side==='L' ? '#vermenuL' : '#vermenuR');
  const textEl = $(side==='L' ? '#textL' : '#textR');
  const ids = side==='L' ? LIDS : RIDS;
  const v0 = DATA.verses[0];
  const d = VDEF[vid]({title:DATA.title});
  labelEl.innerHTML = vid==='none' ? `<span style="color:#adb5bd">no parallel version</span>`
    : `<div class="vlab" style="font-weight:700">${esc(d.label)}</div><div class="vdesc">${esc(d.desc)}</div><div class="vmeta">${esc(d.meta)}</div>`;
  menuEl.innerHTML = ids.map(id=>{
    const dd = VDEF[id]({title:DATA.title});
    const mark = id===vid ? `<span class="side">${side}</span>` : `<span class="side">&nbsp;</span>`;
    return `<a class="dropdown-item" href="#" data-col="${side}" data-v="${id}">${mark}<div><div class="label">${esc(dd.label)}</div><div class="description">${esc(dd.desc)}</div><div class="metadata">${esc(dd.meta)}</div></div></a>`;
  }).join('') + (side==='R' && vid!=='none' ? `<div class="dropdown-divider"></div><a class="dropdown-item remove" href="#" data-col="R" data-v="none"><span class="side">&nbsp;</span><div><div class="label">remove column</div></div></a>` : '');
  menuEl.querySelectorAll('.dropdown-item').forEach(a=>{
    a.onclick = e=>{ e.preventDefault(); menuEl.classList.remove('show'); setCol(a.getAttribute('data-col')==='L'?'left':'right', a.getAttribute('data-v')); };
  });
  const drop = $(side==='L' ? '#verdropL' : '#verdropR');
  drop.onclick = ()=>{
    document.querySelectorAll('.dropdown-menu').forEach(m=>{ if(m!==menuEl) m.classList.remove('show'); });
    menuEl.classList.toggle('show');
  };
  if(vid==='none'){ textEl.innerHTML=''; return; }
  textEl.innerHTML = DATA.verses.map((v,i)=>
    `<div class="verse" data-i="${i}" id="v${i}"><a class="vref" href="#v${i}" data-i="${i}" title="recite this verse">§ ${i+1}</a>${verseText(v, vid, side)}</div>`
  ).join('');
  const del = $('#colRdel');
  if(del) del.onclick = e=>{ e.preventDefault(); setCol('right','none'); };
}

let MORPH = null; // data/morph/<wid>.json {verses:[{id,tags:{word:{src,lemma?,pos?}}}]}
let PROOF = null; // data/proof/<wid>.json {verses:{id:{gate,blocking,checks,source_sha,result_id,model,date}}}
async function loadMorph(){
  try{
    const m = await get(`data/morph/${WORK}.json`);
    MORPH = {};
    for(const v of (m.verses||[])) MORPH[v.id] = v.tags || {};
  }catch(e){ MORPH = null; }
  try{
    const p = await get(`data/proof/${WORK}.json`);
    PROOF = (p && p.verses) || null;
  }catch(e){ PROOF = null; }
}
function proofQueueHtml(){
  const open = Object.entries(PROOF||{}).filter(([id,p])=>(p.blocking||[]).length>0);
  if(!open.length) return `<div class="cmp-note">every gated verse proves 5/5.</div>`;
  // map verse id -> index for jumps
  const idxOf = {};
  DATA.verses.forEach((v,i)=>{ idxOf[v.id]=i; });
  return `<div class="cmp-note">${open.length} verse${open.length===1?'':'s'} with open checks (length-ratio is heuristic — see record):</div>`
    + open.map(([id,p])=>{
      const i = idxOf[id];
      return `<div style="margin:.35rem 0"><a href="#" data-pi="${i==null?'':i}">§${i==null?'?':i+1}</a> <span style="color:#868e96">${esc((p.blocking||[]).join(', '))}</span> <span style="color:#adb5bd">#${esc(p.result_id||'')}</span></div>`;
    }).join('');
}
function selectWord(w){
  document.querySelectorAll('.w.sel').forEach(x=>x.classList.remove('sel'));
  w.classList.add('sel');
  document.body.classList.add('highlight');
  const ia = w.getAttribute('data-w'), id = w.getAttribute('data-v');
  const g = glossFor(id, ia);
  const mo = MORPH && MORPH[id] && MORPH[id][ia];
  let morphRow = '';
  if(mo && mo.src==='vidyut' && mo.lemma)
    morphRow = `<tr><td>morph</td><td>stem <b>${esc(mo.lemma)}</b> <span style="color:#adb5bd">(Vidyut)</span></td></tr>`;
  else if(mo && mo.src==='tagger' && mo.pos)
    morphRow = `<tr><td>morph</td><td>${esc(mo.pos)} <span style="color:#adb5bd">(neural)</span></td></tr>`;
  else if(MORPH)
    morphRow = `<tr><td>morph</td><td>No analysis on file — T1 word-gloss pending.</td></tr>`;
  else
    morphRow = `<tr><td>morph</td><td>batch pending — key-terms below meanwhile.</td></tr>`;
  const box = $('#wid-word .wbody');
  if(box) box.innerHTML = `<table class="wtable">`
    + `<tr><td>form</td><td style="font-family:var(--deva);font-size:1.2em">${esc(IAST_DEVA.convert(cleanSA(ia)))}</td></tr>`
    + `<tr><td>iast</td><td><i>${esc(ia)}</i></td></tr>`
    + morphRow
    + (g ? `<tr><td>gloss</td><td><b>${esc(g.t)}</b> — ${esc(g.g)}</td></tr>` : '')
    + `<tr><td>verse</td><td>${esc(id)}</td></tr></table>`;
}

function quiet(){
  if(AUtimer){ cancelAnimationFrame(AUtimer); AUtimer = null; }
  if(AU){ AU.onended = null; try{ AU.pause(); }catch(e){} }
  try{ speechSynthesis.cancel(); }catch(e){}
  document.querySelectorAll('.w.sing').forEach(w=>w.classList.remove('sing'));
  document.querySelectorAll('.verse.now').forEach(v=>v.classList.remove('now'));
}
function stopRecite(){ quiet(); AUix = null; }
function markVerse(i){
  document.querySelectorAll('.verse.now').forEach(v=>v.classList.remove('now'));
  document.querySelectorAll(`.verse[data-i="${i}"]`).forEach(el=>{
    el.classList.add('now'); el.scrollIntoView({block:'center', behavior:'smooth'});
  });
}
function tickAU(){
  if(!AU) return;
  const t = AU.currentTime;
  document.querySelectorAll('.w.sing').forEach(w=>w.classList.remove('sing'));
  const all = document.querySelectorAll(`.w[data-t0][data-i="${AUix}"]`);
  for(const w of all){
    if(t >= +w.getAttribute('data-t0') && t <= +w.getAttribute('data-t1')){ w.classList.add('sing'); break; }
  }
  if(!AU.paused && !AU.ended) AUtimer = requestAnimationFrame(tickAU);
}
function speakThen(i, next){
  try{
    const el = document.querySelector(`#textL .verse[data-i="${i}"], #textR .verse[data-i="${i}"]`);
    const u = new SpeechSynthesisUtterance((el ? el.innerText : '').slice(0,1200));
    u.rate = 0.95; u.onend = next;
    speechSynthesis.speak(u);
  }catch(e){ next(); }
}
function stepOnce(i, next){
  const au = KAR && KAR.au && KAR.au[i];
  if(au){
    AU = AU || new Audio();
    AU.src = au; AU.onended = next;
    AU.play().catch(()=>{ speakThen(i, next); });
    AUtimer = requestAnimationFrame(tickAU);
  } else speakThen(i, next);
}
function reciteVerse(i){ quiet(); AUix = i; markVerse(i); stepOnce(i, ()=>stopRecite()); }
function reciteAll(){
  quiet();
  let i = 0;
  const step = ()=>{
    if(i >= DATA.verses.length){ stopRecite(); return; }
    AUix = i; markVerse(i);
    stepOnce(i, ()=>{ i++; step(); });
  };
  step();
}

const W = (id, title, body)=>`<div class="widget" id="wid-${id}"><h2><span><span class="tog">⌄</span>${title}</span></h2><div class="wbody">${body}</div></div>`;
function buildRightRail(verses){
  $('#rail').innerHTML =
    W('mode','Text Mode',
      `<div class="tmode"><button data-m="normal" class="on">normal</button><button data-m="highlight">highlight</button></div><div class="cmp-note">normal selection of text for copying possible</div>`)
    + W('hl','Highlight', `<div class="wsearch"><input id="hlq" placeholder="highlight words…"/></div><div id="hlc" class="cmp-note"></div>`)
    + W('word','Morphology', `<div class="cmp-note">In <b>highlight</b> text mode, select a word to get morphological analysis.</div><div id="wsw">Select a Sanskrit word to analyze its form.</div>`)
    + W('dict','Dictionaries', `<div class="wsearch"><select id="dsel" style="max-width:7rem"><option value="terms">Key Terms</option></select><input id="dq" placeholder="look up a term…"/></div><div class="cmp-note">Search with * to match anywhere in the headword.</div><div id="dres" style="margin-top:.4rem"></div>`)
    + W('display','Display Settings',
      `<div class="cmp-note" style="text-transform:uppercase;letter-spacing:.15em;font-size:.68rem">Text Size</div><div class="tsize">${['Αα','Αα','Αα','Αα','Αα'].map((a,i)=>`<button data-s="${i}" style="font-size:${[11,13,15,19,24][i]}px">${a}</button>`).join('')}</div>`
      + `<div class="cmp-note" style="text-transform:uppercase;letter-spacing:.15em;font-size:.68rem;margin-top:.6rem">Text Width</div><div class="twidth">${['Narrow','Normal','Wide','Full'].map(w=>`<a href="#" data-w="${w}">${w}</a>`).join(' ')}</div>`)
    + W('recite','Recitation',
      `<div class="tsize"><button id="rcAll">▶ recite all</button><button id="rcStop">■ stop</button></div><div class="cmp-note">${KAR ? 'studio chant, karaoke-timed · tap § for one verse' : 'browser voice · no studio chant on file · tap § for one verse'}</div>`);
  // collapsible widgets
  document.querySelectorAll('#rail .widget h2').forEach(h=>{
    h.onclick = ()=>h.parentElement.classList.toggle('closed');
  });
  // recitation
  const rcA = $('#rcAll'), rcS = $('#rcStop');
  if(rcA) rcA.onclick = ()=>reciteAll();
  if(rcS) rcS.onclick = ()=>stopRecite();
  // text mode
  document.querySelectorAll('#wid-mode [data-m]').forEach(b=>{
    b.onclick = ()=>{
      document.querySelectorAll('#wid-mode [data-m]').forEach(x=>x.classList.remove('on'));
      b.classList.add('on');
      document.body.classList.toggle('highlight', b.getAttribute('data-m')==='highlight');
    };
  });
  // highlight-a-word box
  const hlq = $('#hlq');
  if(hlq) hlq.addEventListener('input', ()=>{
    const q = hlq.value.trim();
    document.querySelectorAll('.w.hl').forEach(w=>w.classList.remove('hl'));
    const box = $('#hlc');
    if(!q){ if(box) box.innerHTML=''; return; }
    const ql = q.toLowerCase().replace(/\*/g,'');
    let n = 0;
    document.querySelectorAll('.w').forEach(w=>{
      const t = (w.getAttribute('data-w')||'').toLowerCase();
      if(t && (q.includes('*') ? t.includes(ql) : t===ql)){ w.classList.add('hl'); n++; }
    });
    if(box) box.innerHTML = n ? `${n} hit${n===1?'':'s'}` : 'no matches';
  });
  // dictionaries: key-terms lookup
  const drun = ()=>{
    const q = ($('#dq').value||'').trim().toLowerCase().replace(/\*/g,'');
    const box = $('#dres');
    if(!q){ box.innerHTML=''; return; }
    const hits = [];
    verses.forEach((v,i)=>{
      for(const e of (TERMS[v.id]||[])){
        if(e.t.toLowerCase().includes(q) || (e.g||'').toLowerCase().includes(q)){ hits.push({i, e}); break; }
      }
    });
    box.innerHTML = hits.length
      ? hits.map(h=>`<div><b>${esc(h.e.t)}</b> — ${esc(h.e.g)} <a href="#" data-i="${h.i}">§${h.i+1}</a></div>`).join('')
      : 'no entries found.';
    box.querySelectorAll('a').forEach(a=>{
      a.onclick = e=>{ e.preventDefault(); const el=document.querySelector(`.verse[data-i="${a.getAttribute('data-i')}"]`); if(el) el.scrollIntoView({block:'center',behavior:'smooth'}); };
    });
  };
  const dgo = $('#dq'); if(dgo){
    dgo.addEventListener('keydown', e=>{ if(e.key==='Enter') drun(); });
    dgo.addEventListener('input', ()=>{ if(!dgo.value.trim()) $('#dres').innerHTML=''; });
  }
  // size (5 steps, Scaife) / width (text links, Scaife)
  const sizes = [[0.9,0.8],[1.0,0.85],[1.25,1.0],[1.5,1.15],[1.8,1.3]];
  document.querySelectorAll('#wid-display [data-s]').forEach(b=>{
    b.onclick = ()=>{
      const i = +b.getAttribute('data-s');
      const r = document.documentElement.style;
      r.setProperty('--sa-size', sizes[i][0]+'rem');
      r.setProperty('--en-size', sizes[i][1]+'rem');
      try{ localStorage.setItem('svv-tsize', i); }catch(e){}
      document.querySelectorAll('#wid-display [data-s]').forEach(x=>x.classList.remove('on'));
      b.classList.add('on');
    };
  });
  const widths = {Narrow:'38rem', Normal:'46rem', Wide:'62rem', Full:'100%'};
  document.querySelectorAll('#wid-display [data-w]').forEach(b=>{
    b.onclick = e=>{
      e.preventDefault();
      document.documentElement.style.setProperty('--measure', widths[b.getAttribute('data-w')]);
      try{ localStorage.setItem('svv-twidth', b.getAttribute('data-w')); }catch(e){}
      document.querySelectorAll('#wid-display [data-w]').forEach(x=>x.classList.remove('on'));
      b.classList.add('on');
    };
  });
}
function dl(name, text, type){
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], {type}));
  a.download = name; a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href), 4000);
}
function applyPrefs(){
  try{
    const s = (localStorage.getItem('svv-tsize')==null) ? 2 : +localStorage.getItem('svv-tsize');
    const sizes = [[0.9,0.8],[1.0,0.85],[1.25,1.0],[1.5,1.15],[1.8,1.3]];
    const r = document.documentElement.style;
    r.setProperty('--sa-size', sizes[s][0]+'rem');
    r.setProperty('--en-size', sizes[s][1]+'rem');
    const b = document.querySelector(`#wid-display [data-s="${s}"]`); if(b) b.classList.add('on');
    const w = localStorage.getItem('svv-twidth')||'Normal';
    const widths = {Narrow:'38rem', Normal:'46rem', Wide:'62rem', Full:'100%'};
    r.setProperty('--measure', widths[w]||widths.Normal);
    const wb = document.querySelector(`#wid-display [data-w="${w}"]`); if(wb) wb.classList.add('on');
  }catch(e){}
}
main();
})();
