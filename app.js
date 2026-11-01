/* svread — Scaife mirror. Behaviors lifted from scaife-viewer (MIT).
   ?work=X [&left=sa-deva|sa-iast|l1|l2|c1] [&right=none|l1|l2|c1|mine] */
(function(){
"use strict";
const $ = s => document.querySelector(s);
const esc = s => (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const qs = new URLSearchParams(location.search);
const WORK = qs.get('work') || 'bhairavastava';
const SRC = qs.get('src');
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

function verseText(v, vid, col){
  const raw = cleanSA(v.sa||'');
  const pass = v.gate==='PASS' && (v.l2||v.l1);
  if(vid==='sa-deva' || vid==='sa-iast'){
    const words = raw.split(/\s+/).filter(Boolean);
    const shown = vid==='sa-deva' ? words.map(w=>IAST_DEVA.convert(w)) : words;
    return `<div class="sa">` + shown.map((w,i)=>
      `<span class="w" data-w="${esc(words[i])}" data-v="${esc(v.id)}">${esc(w)}</span>`).join(' ')
      + `</div>` + (vid==='sa-deva' ? `<div class="ro">${esc(raw)}</div>` : '');
  }
  if(!pass) return `<div class="sa">` + raw.split(/\s+/).filter(Boolean).map(w=>
    `<span class="w" data-w="${esc(w)}" data-v="${esc(v.id)}">${esc(IAST_DEVA.convert(w))}</span>`).join(' ')
    + `</div><div class="ro">${esc(raw)}</div><div class="milestone">English withheld — gate ${esc(v.gate||'BLOCKED')}</div>`;
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
  for(const u of (SRC ? [SRC] : [`data/${WORK}.json`])){
    try{ D = await get(u); if(D) break; }catch(e){}
  }
  let verses = D && (D.verses || (D.chunks||[]).map(c=>({
    id:c.chunk, sa:c.sanskrit, l1:c.l1, l2:c.l2, c1:c.c1, argmap:c.argmap,
    gate:c.gate, model:c.model||'', date:c.date||'' })));
  if(!verses || !verses.length){
    $('.reader-main').innerHTML = `<p id="err">Nothing on file for “${esc(WORK)}” yet.</p>`;
    return;
  }
  DATA = {title:(D.title||WORK), master:(D.master||''), verses};
  buildTerms(verses);
  const title = DATA.title, master = DATA.master;
  document.title = `${title} · svread`;
  $('#wh1').textContent = title;
  $('#wh2').textContent = `${master?master+' · ':''}verse 1–${verses.length} (${verses.length} passages)`;
  const nPass = verses.filter(v=>v.gate==='PASS' && (v.l2||v.l1)).length;
  $('#wh3').textContent = `${nPass}/${verses.length} passages gate-passed · English shows only where passed`;

  renderCol('L', LEFT); renderCol('R', RIGHT);
  if(RIGHT==='none') $('#colR').classList.add('hidden');
  buildRail(verses);
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
  // gutter prev/next verse
  let cur = 0;
  const goVerse = d=>{
    cur = Math.min(verses.length-1, Math.max(0, cur+d));
    const el = document.querySelector(`.verse[data-i="${cur}"]`);
    if(el) el.scrollIntoView({block:'center', behavior:'smooth'});
  };
  $('#pgleft a').onclick = e=>{ e.preventDefault(); goVerse(-1); };
  $('#pgright a').onclick = e=>{ e.preventDefault(); goVerse(1); };
  $('#navsearch').onclick = e=>{ e.preventDefault(); const w = document.querySelector('#wid-search input'); if(w){ w.focus(); w.scrollIntoView({block:'center'}); } };
  window.scrollTo(0,0);
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
    `<div class="verse" data-i="${i}" id="v${i}"><div class="vref">§ ${i+1}</div>${verseText(v, vid, side)}</div>`
  ).join('');
  const del = $('#colRdel');
  if(del) del.onclick = e=>{ e.preventDefault(); setCol('right','none'); };
}

function selectWord(w){
  document.querySelectorAll('.w.sel').forEach(x=>x.classList.remove('sel'));
  w.classList.add('sel');
  document.body.classList.add('highlight');
  const ia = w.getAttribute('data-w'), id = w.getAttribute('data-v');
  const g = glossFor(id, ia);
  const box = $('#wid-word .wbody');
  if(box) box.innerHTML = `<table class="wtable">`
    + `<tr><td>form</td><td style="font-family:var(--deva);font-size:1.2em">${esc(IAST_DEVA.convert(cleanSA(ia)))}</td></tr>`
    + `<tr><td>iast</td><td><i>${esc(ia)}</i></td></tr>`
    + (g ? `<tr><td>gloss</td><td><b>${esc(g.t)}</b> — ${esc(g.g)}</td></tr>`
         : `<tr><td>gloss</td><td>No gloss on file — T1 word-gloss pending.</td></tr>`)
    + `<tr><td>verse</td><td>${esc(id)}</td></tr></table>`;
}

function buildRail(verses){
  const W = (id, title, body)=>`<div class="widget" id="wid-${id}"><h2><span><span class="tog">−</span>${title}</span></h2><div class="wbody">${body}</div></div>`;
  $('#rail').innerHTML =
    W('word','Word Study Tools',
      `<div class="tmode"><button data-m="normal" class="on">normal</button><button data-m="highlight">highlight</button></div><div id="wsw">Select a Sanskrit word to analyze its form.</div>`) // placeholder replaced below
    + W('size','Text Size', `<div class="tsize">${['Αα','Αα','Αα','Αα'].map((a,i)=>`<button data-s="${i}" style="font-size:${[12,15,18,22][i]}px">${a}</button>`).join('')}</div>`)
    + W('width','Text Width', `<div class="twidth">${['Narrow','Normal','Wide','Full'].map(w=>`<button data-w="${w}">${w}</button>`).join('')}</div>`)
    + W('ref','Passage Reference', `<div class="vref-list">${verses.map((v,i)=>`<a href="#v${i}" data-i="${i}">§${i+1}</a>`).join('')}</div>`)
    + W('search','Text Search', `<div class="wsearch"><input id="wq" placeholder="find in this work…"/><button id="wgo">go</button></div><div id="wres" style="margin-top:.4rem"></div>`)
    + W('attr','Attributions', `<table class="wtable">`
      + `<tr><td>work</td><td>${esc(DATA.title)}</td></tr>`
      + `<tr><td>editions</td><td>L1 close · L2 read · C1 commentary — pipeline, machine-proposed, needs human review</td></tr>`
      + `<tr><td>gate</td><td>${verses.filter(v=>v.gate==='PASS').length}/${verses.length} passages passed</td></tr>`
      + `<tr><td>repository</td><td>prx0r/svread · data: prx0r/ipvv layers</td></tr></table>`)
    + W('export','Export Passage', `<a href="#" id="exp-t">as text</a> · <a href="#" id="exp-j">as json</a>`)
    + W('issue','Report an Issue', `<a href="https://github.com/prx0r/svread/issues/new" target="_blank" rel="noopener">open a GitHub issue</a>`);
  // collapsible widgets
  document.querySelectorAll('.widget h2').forEach(h=>{
    h.onclick = ()=>h.parentElement.classList.toggle('closed');
  });
  // text mode
  document.querySelectorAll('#wid-word [data-m]').forEach(b=>{
    b.onclick = ()=>{
      document.querySelectorAll('#wid-word [data-m]').forEach(x=>x.classList.remove('on'));
      b.classList.add('on');
      document.body.classList.toggle('highlight', b.getAttribute('data-m')==='highlight');
    };
  });
  // size / width
  const sizes = [[1.0,0.85],[1.25,1.0],[1.5,1.15],[1.8,1.3]];
  document.querySelectorAll('#wid-size [data-s]').forEach(b=>{
    b.onclick = ()=>{
      const i = +b.getAttribute('data-s');
      const r = document.documentElement.style;
      r.setProperty('--sa-size', sizes[i][0]+'rem');
      r.setProperty('--en-size', sizes[i][1]+'rem');
      try{ localStorage.setItem('svv-tsize', i); }catch(e){}
      document.querySelectorAll('#wid-size [data-s]').forEach(x=>x.classList.remove('on'));
      b.classList.add('on');
    };
  });
  const widths = {Narrow:'38rem', Normal:'46rem', Wide:'62rem', Full:'100%'};
  document.querySelectorAll('#wid-width [data-w]').forEach(b=>{
    b.onclick = ()=>{
      document.documentElement.style.setProperty('--measure', widths[b.getAttribute('data-w')]);
      try{ localStorage.setItem('svv-twidth', b.getAttribute('data-w')); }catch(e){}
      document.querySelectorAll('#wid-width [data-w]').forEach(x=>x.classList.remove('on'));
      b.classList.add('on');
    };
  });
  // reference jumps
  document.querySelectorAll('.vref-list a').forEach(a=>{
    a.onclick = e=>{
      e.preventDefault();
      const el = document.querySelector(`.verse[data-i="${a.getAttribute('data-i')}"]`);
      if(el) el.scrollIntoView({block:'center', behavior:'smooth'});
    };
  });
  // search
  const run = ()=>{
    const q = ($('#wq').value||'').trim().toLowerCase();
    const box = $('#wres');
    if(!q){ box.innerHTML=''; return; }
    const hits = [];
    verses.forEach((v,i)=>{
      const hay = `${v.sa} ${v.l1} ${v.l2} ${v.c1||''}`.toLowerCase();
      if(hay.includes(q)) hits.push(i);
    });
    box.innerHTML = hits.length
      ? `${hits.length} match${hits.length===1?'':'es'}: ` + hits.map(i=>`<a href="#" data-i="${i}">§${i+1}</a>`).join(' ')
      : 'no matches in this work.';
    box.querySelectorAll('a').forEach(a=>{
      a.onclick = e=>{
        e.preventDefault();
        const el = document.querySelector(`.verse[data-i="${a.getAttribute('data-i')}"]`);
        if(el) el.scrollIntoView({block:'center', behavior:'smooth'});
      };
    });
  };
  $('#wgo').onclick = run;
  $('#wq').addEventListener('keydown', e=>{ if(e.key==='Enter') run(); });
  // export
  $('#exp-t').onclick = e=>{
    e.preventDefault();
    const t = verses.map((v,i)=>`§${i+1}\n${cleanSA(v.sa)}\n${cleanEN(v.l2||v.l1||'')}`).join('\n\n');
    dl(`${WORK}.txt`, t, 'text/plain');
  };
  $('#exp-j').onclick = e=>{
    e.preventDefault();
    dl(`${WORK}.json`, JSON.stringify(verses, null, 1), 'application/json');
  };
}
function dl(name, text, type){
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], {type}));
  a.download = name; a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href), 4000);
}
function applyPrefs(){
  try{
    const s = +(localStorage.getItem('svv-tsize')||1);
    const sizes = [[1.0,0.85],[1.25,1.0],[1.5,1.15],[1.8,1.3]];
    const r = document.documentElement.style;
    r.setProperty('--sa-size', sizes[s][0]+'rem');
    r.setProperty('--en-size', sizes[s][1]+'rem');
    const b = document.querySelector(`#wid-size [data-s="${s}"]`); if(b) b.classList.add('on');
    const w = localStorage.getItem('svv-twidth')||'Normal';
    const widths = {Narrow:'38rem', Normal:'46rem', Wide:'62rem', Full:'100%'};
    r.setProperty('--measure', widths[w]||widths.Normal);
    const wb = document.querySelector(`#wid-width [data-w="${w}"]`); if(wb) wb.classList.add('on');
  }catch(e){}
}
main();
})();
