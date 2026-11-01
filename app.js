/* SVREAD app — fetch once, render four views. No backend, no build.
   Data: data/<work>.json (vendored) or ?src=<url> for any layers JSON.
   All styling in styles.css; this file only builds class names. */
(function(){
"use strict";
const $ = s => document.querySelector(s);
const esc = s => (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const qs = new URLSearchParams(location.search);
const WORK = qs.get('work') || 'bhairavastava';
const SRC = qs.get('src'); // optional: absolute layers-JSON url for other works
let VIEW = qs.get('view') || localStorage.getItem('svv-view') || 'read';
if(!['read','compare','literal','critical'].includes(VIEW)) VIEW = 'read';
let READVOICE = localStorage.getItem('svv-readvoice') || 'c1'; // c1 | l2

/* IAST -> Devanagari, deterministic longest-match. No dependencies. */
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
function cleanSA(s){
  return (s||'').replace(/^# Text\s*/,'').replace(/\[[A-Za-z0-9_]+\]/g,'').replace(/\s+/g,' ').trim();
}
function cleanEN(s){
  return (s||'').replace(/^#+\s*[^\n]*\n/,'').replace(/\s*\/\/\s*\S+\s*$/,'').trim();
}
function rich(s){
  return esc(s).replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
    .replace(/(^|[\s(])\*([^*\n]+)\*/g, '$1<i>$2</i>');
}
/* lite markdown: headers + **label.** blocks; bare=true strips labels for reading. */
function mdLite(s, bare){
  return (s||'').split(/\n{2,}/).map(p=>{
    p = p.trim(); if(!p) return '';
    const hm = p.match(/^(#{1,3})\s+(.*)$/);
    if(hm) return bare ? `<p>${esc(hm[2])}</p>` : `<div class="vlab">${esc(hm[2])}</div>`;
    const lm = p.match(/^\*\*([^*]+)\*\*\s*(.*)$/s);
    if(lm){
      const body = rich(lm[2]);
      return bare ? `<p>${body}</p>`
        : `<div class="c1sec"><div class="vlab">${esc(lm[1]).replace(/\.+$/,'')}</div><div>${body}</div></div>`;
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
function getVar(id){ try{ return localStorage.getItem(`svv-${WORK}-${id}`) || ''; }catch(e){ return ''; } }
function setVar(id, v){ try{ localStorage.setItem(`svv-${WORK}-${id}`, v); }catch(e){} }
function go(view){
  const u = new URL(location.href);
  u.searchParams.set('view', view);
  try{ localStorage.setItem('svv-view', view); }catch(e){}
  location.href = u.toString();
}
function devaNum(n){
  const d=['०','१','२','३','४','५','६','७','८','९'];
  return String(n).split('').map(c=>d[+c]||c).join('');
}

async function main(){
  let D = null;
  const urls = SRC ? [SRC] : [`data/${WORK}.json`];
  for(const u of urls){ try{ D = await get(u); if(D) break; }catch(e){} }
  // layers-JSON shape ({chunks:[...]}) or site shape ({verses:[...]})
  let verses = D && (D.verses || (D.chunks||[]).map(c=>({
    id:c.chunk, sa:c.sanskrit, l1:c.l1, l2:c.l2, c1:c.c1, argmap:c.argmap,
    gate:c.gate, model:c.model||'', date:c.date||'' })));
  if(!verses || !verses.length){
    $('#view').innerHTML = `<p id="err">Nothing on file for “${esc(WORK)}” yet.</p>`;
    return;
  }
  verses.forEach((v,i)=>{ v.n = i+1; });
  $('#wtitle').textContent = (D && D.title) || WORK;
  const nPass = verses.filter(v=>v.gate==='PASS' && (v.l2||v.l1)).length;
  $('#wsub').textContent = `${D.master?D.master+' · ':''}${verses.length} passages · ${nPass} with English · Sanskrit always`;
  $('#fprov').textContent = `machine-proposed · needs human review`;
  const labels = [['read','Read'],['compare','Compare'],['literal','Literal'],['critical','Critical']];
  $('#vsw').innerHTML = labels.map(([v,l])=>`<button class="vsw${VIEW===v?' on':''}" data-v="${v}">${l}</button>`).join('');
  document.querySelectorAll('.vsw').forEach(b=>{ b.onclick = ()=>go(b.getAttribute('data-v')); });

  $('#view').innerHTML = verses.map((v)=>{
    const vn = devaNum(v.n);
    const raw = cleanSA(v.sa||'');
    const deva = IAST_DEVA.convert(raw);
    const sa = deva ? `<div class="dline">${esc(deva)}</div><div class="rline">${esc(raw)}</div>` : '';
    const pass = v.gate==='PASS' && (v.l2||v.l1);
    const en1 = pass ? cleanEN(v.l1||'') : '';
    const en2 = pass ? cleanEN(v.l2||v.l1||'') : '';
    const uv = getVar(v.id);
    let body = '';
    if(!pass){
      body = sa; // fail-closed: Sanskrit only
    } else if(VIEW==='read'){
      const pick = `<div class="readpick">`
        + `<button class="${READVOICE==='c1'?'on':''}" data-rv="c1">Commentary</button>`
        + `<button class="${READVOICE==='l2'?'on':''}" data-rv="l2">Translation</button></div>`;
      const prose = (READVOICE==='c1' && v.c1) ? `<div class="readc1">${mdLite(v.c1, true)}</div>`
        : `<div class="en read">${esc(en2)}</div>`;
      body = sa + pick + prose;
    } else if(VIEW==='compare'){
      body = `<div class="cmp"><div><div class="vlab">L1 · close</div><div class="en">${esc(en1||en2)}</div></div><div><div class="vlab">L2 · read</div><div class="en">${esc(en2)}</div></div></div>`;
    } else if(VIEW==='literal'){
      body = `${sa}<div class="vlab">L1 · close</div><div class="en">${esc(en1||en2)}</div>`;
    } else {
      body = `${sa}`
        + `<div class="vlab">L1 · close</div><div class="en">${esc(en1||en2)}</div>`
        + `<div class="vlab">L2 · read</div><div class="en">${esc(en2)}</div>`
        + (v.c1?`<div class="vlab">C1 · commentary</div><div class="c1">${mdLite(v.c1)}</div>`:'')
        + (v.argmap?`<details class="arg"><summary>Argument map</summary><div class="c1">${mdLite(v.argmap)}</div></details>`:'')
        + `<div class="prov">gate ${esc(v.gate||'?')} · ${esc(v.model||'')} · ${esc(v.date||'')} · machine-proposed, needs human review</div>`
        + (uv?`<div class="vlab">Your version · this device only</div><div class="en yours">${esc(uv)}</div>`:'')
        + `<div class="varbox" style="display:none"><textarea id="var-${v.n}" placeholder="Paste your translation (from your own book)…"></textarea><br><button class="playbtn" data-savevar="${v.n}" data-ch="${esc(v.id)}">Save on this device</button></div>`
        + `<button class="playbtn addvar">＋ add your version</button>`;
    }
    return `<div class="verse" data-v="${v.n}"><div class="vnum">${vn}</div>${body}<div class="vclose">॥ ${vn} ॥</div></div>`;
  }).join('') + `<div class="rend">❖ ❖ ❖</div>`;

  document.querySelectorAll('[data-rv]').forEach(b=>{
    b.onclick = ()=>{
      READVOICE = b.getAttribute('data-rv');
      try{ localStorage.setItem('svv-readvoice', READVOICE); }catch(e){}
      go('read');
    };
  });
  document.querySelectorAll('.addvar').forEach(b=>{
    b.onclick = ()=>{ const box = b.parentElement.querySelector('.varbox'); if(box) box.style.display = box.style.display==='none' ? '' : 'none'; };
  });
  document.querySelectorAll('[data-savevar]').forEach(b=>{
    b.onclick = ()=>{
      const ta = document.getElementById(`var-${b.getAttribute('data-savevar')}`);
      if(ta && ta.value.trim()){ setVar(b.getAttribute('data-ch'), ta.value.trim()); go(VIEW); }
    };
  });
  const spk = $('#speak');
  if(spk) spk.onclick = ()=>{
    try{
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance($('#view').innerText.slice(0, 1500));
      u.rate = 0.95; speechSynthesis.speak(u);
    }catch(e){}
  };
  window.scrollTo(0,0);
}
main();
})();
