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
const API = 'https://ipvv-api.tradesprior.workers.dev';
// Chant audio + karaoke timings live in the public R2 bucket (CORS-open).
const R2 = 'https://pub-87169194562a44fcb8279a799d626c62.r2.dev';
/* studio chant: karaoke timings + mp3s live on the ipvv origin.
   Probed per work — the day kashaudio ships new timings, they just work. */
const CHANTDIR = {anuttarastika:'anuttarashtika_trad'};
let KAR = null; // {words:[[ {w,r,t0,t1} ]], au:[url|null]}
let ART = null, ART_CLIPS = {}, ART_REL = {};   // compiled alignment (see build_align.py)
let AU = null, AUtimer = null, AUix = null;
let QUEUE = null, QIDX = 0, QBASE = 0, QNEXT = null;
let LEFT = qs.get('left') || localStorage.getItem('svv-left') || 'sa-deva';
let RIGHT = qs.get('right') || localStorage.getItem('svv-right') || 'none';
const LIDS_BASE = ['sa-deva','sa-iast','l1','l2','c1'];
const RIDS_BASE = ['none','l1','l2','c1','mine'];
let LIDS = [...LIDS_BASE], RIDS = [...RIDS_BASE];
let L0 = null; // data/l0/<wid>.json {verses:[{id,tokens:[{iast,gloss,raw,status}]}]}
async function loadL0(){
  try{
    const m = await get(`data/l0/${WORK}.json`);
    if(m && m.verses && m.verses.length){
      L0 = {};
      for(const v of m.verses) L0[v.id] = v.tokens || [];
      if(!LIDS.includes('l0')){ LIDS.splice(3, 0, 'l0'); RIDS.splice(3, 0, 'l0'); }
    }
  }catch(e){ L0 = null; }
}
if(!LIDS_BASE.includes(LEFT)) LEFT = 'sa-deva';
if(!RIDS_BASE.includes(RIGHT)) RIGHT = 'none';

const IAST_DEVA = (()=>{
  const VOW={a:'\u0905','\u0101':'\u0906',i:'\u0907','\u012b':'\u0908',u:'\u0909','\u016b':'\u090a','\u1e5b':'\u090b','\u1e5d':'\u090c','\u1e37':'\u090d',e:'\u090f',o:'\u0913',ai:'\u0910',au:'\u0914'};
  const VSN={'\u0101':'\u093e',i:'\u093f','\u012b':'\u0940',u:'\u0941','\u016b':'\u0942','\u1e5b':'\u0943','\u1e5d':'\u0944','\u1e37':'\u0962',e:'\u0947',o:'\u094b',ai:'\u0948',au:'\u094c'};
  const CON={k:'\u0915',kh:'\u0916',g:'\u0917',gh:'\u0918','\u014b':'\u0919','\u1e45':'\u0919',c:'\u091a',ch:'\u091b',j:'\u091c',jh:'\u091d','\u00f1':'\u091e','\u1e6d':'\u091f','\u1e6dh':'\u0920','\u1e0d':'\u0921','\u1e0dh':'\u0922','\u1e47':'\u0923',t:'\u0924',th:'\u0925',d:'\u0926',dh:'\u0927',n:'\u0928',p:'\u092a',ph:'\u092b',b:'\u092c',bh:'\u092d',m:'\u092e',y:'\u092f',r:'\u0930',l:'\u0932',v:'\u0935','\u015b':'\u0936','\u1e63':'\u0937',s:'\u0938',h:'\u0939'};
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
  'l1': ()=>({label:'Close', desc:'Close translation — faithful to the Sanskrit', meta:'eng translation'}),
  'l2': ()=>({label:'Plain', desc:'Plain translation — clear English', meta:'eng translation'}),
  'c1': ()=>({label:'Reading', desc:'Reading — commentary as prose', meta:'eng commentary'}),
  'l0': ()=>({label:'Word gloss', desc:'Word-by-word gloss', meta:'san gloss-layer'}),
  'mine': ()=>({label:'Your version', desc:'Pasted by you, this device only', meta:'eng user-version'}),
  'none': ()=>({label:'—', desc:'', meta:''}),
};

function saWords(v, iast, vix){
  const VI = (vix!=null) ? vix : (v.n-1);
  const raw = cleanSA(v.sa||'');
  const words = raw.split(/\s+/).filter(Boolean)
                   .filter(w=>!/^[\u0964\u0965.,|;:]+$/.test(w))
                   .filter(w=>!/[A-Z]/.test(w));
  const shown = iast ? words : words.map(w=>IAST_DEVA.convert(w));
  const roLine = iast ? '' : `<div class="ro">${esc(raw)}</div>`;

  // ---- compiled path (preferred): no matching, no karaoke dependency.
  // The artifact gives each verse word a list of [t0,t1] slots. Split the
  // verse's own glyphs into that many pieces so text stays exact.
  const relA = ART_REL[VI];
  if(relA && relA.size && !iast){
    const cutAt = (str, k) => {
      if(k <= 1 || str.length <= 1) return [str];
      const out = []; let prev = 0;
      for(let i=1;i<k;i++){
        const at = Math.round(str.length * i / k);
        if(at <= prev || at >= str.length) continue;
        out.push(str.slice(prev, at)); prev = at;
      }
      out.push(str.slice(prev));
      return out;
    };
    return `<div class="sa">` + shown.map((w,j)=>{
      const sy = relA.get(j);
      if(sy && sy.length){
        const parts = cutAt(w, Math.min(sy.length, Math.max(1, w.length)));
        const times = sy.length === parts.length ? sy
                    : parts.map((_,i)=>sy[Math.min(sy.length-1, Math.floor(i*sy.length/parts.length))]);
        const inner = parts.map((p,i)=>
          `<span class="w syl" data-t0="${times[i][0]}" data-t1="${times[i][1]}" data-i="${VI}">${esc(p)}</span>`).join('');
        return `<span class="kword" data-w="${esc(words[j])}" data-v="${esc(v.id)}">${inner}</span>`;
      }
      return `<span class="w" data-w="${esc(words[j])}" data-v="${esc(v.id)}">${esc(w)}</span>`;
    }).join(' ') + `</div>` + roLine;
  }

  // ---- live karaoke match (works without an artifact)
  const kw = KAR && KAR.words[VI];
  if(kw && kw.length){
    const shownK = iast ? kw.map(k=>k.r) : kw.map(k=>IAST_DEVA.convert(k.r));
    const nf = x => (x||'').replace(/\u0902$/, '\u092e\u094d');
    return `<div class="sa">` + shownK.map((w,j)=>{
      const kk = kw[j] || {};
      const t = (kk.t0!=null) ? ` data-t0="${kk.t0}" data-t1="${kk.t1}" data-i="${VI}"` : '';
      const syl = (kk.sslice && kk.sslice.length) ? kk.sslice : kk.syls;
      if(syl && syl.length && nf(syl.map(x=>x.d).join('')) === nf(w)){
        const inner = syl.map(x=>
          `<span class="w syl" data-t0="${x.t0}" data-t1="${x.t1}" data-i="${VI}">${esc(x.d)}</span>`).join('');
        return `<span class="kword" data-w="${esc(kk.r)}" data-v="${esc(v.id)}">${inner}</span>`;
      }
      return `<span class="w" data-w="${esc(kk.r)}" data-v="${esc(v.id)}"${t}>${esc(w)}</span>`;
    }).join(' ') + `</div>` + (!iast ? `<div class="ro">${esc(kw.map(k=>k.r).join(' '))}</div>` : '');
  }

  // ---- nothing timed: plain text
  return `<div class="sa">` + shown.map((w,j)=>
    `<span class="w" data-w="${esc(words[j])}" data-v="${esc(v.id)}" data-i="${VI}">${esc(w)}</span>`).join(' ')
    + `</div>` + roLine;
}
function verseText(v, vid, col, vix){
  const raw = cleanSA(v.sa||'');
  const pass = v.gate==='PASS' && (v.l2||v.l1);
  if(vid==='sa-deva') return saWords(v, false, vix);
  if(vid==='sa-iast') return saWords(v, true, vix);
  if(!pass) return saWords(v, false, vix)
    + `<div class="milestone">English withheld — gate ${esc(v.gate||'BLOCKED')}</div>`;
  if(vid==='l1') return `<div class="enp">${esc(cleanEN(v.l1||v.l2||''))}</div>`;
  if(vid==='l2') return `<div class="enp">${esc(cleanEN(v.l2||v.l1||''))}</div>`;
  if(vid==='c1') return v.c1 ? `<div class="enp c1sec">${mdSec(v.c1)}</div>` : `<div class="enp">${esc(cleanEN(v.l2||v.l1||''))}</div>`;
  if(vid==='l0'){
    const toks = (L0 && (L0[v.id]||L0[v.chunk])) || [];
    if(!toks.length) return `<div class="milestone">No word gloss on file for this verse yet — T1 gloss pending.</div>`;
    return `<table class="wtable l0tab">` + toks.map(t=>
      `<tr><td class="l0sa">${esc(IAST_DEVA.convert(cleanSA(t.iast||'')))}</td>`
      + `<td class="l0ro"><i>${esc(t.iast||'')}</i></td>`
      + `<td>${esc(t.gloss||'')}${t.status&&t.status!=='PARSED'?` <span class="l0st">${esc(t.status)}</span>`:''}</td></tr>`
    ).join('') + `</table>`;
  }
  if(vid==='mine'){
    const uv = getVar(v.id);
    /* C2 voice box (PASS verses only): any style, grounded on the canonical
       packet, rendered by the api worker per skills/render-c2. Lives here —
       canonical columns are never touched by machine renderings. */
    const c2 = (v.gate==='PASS')
      ? `<div class="c2box"><div class="c2head">Render in any voice</div><div class="c2row"><input id="c2in-${esc(v.id)}" maxlength="60" placeholder="e.g. gen z, sailor, bedtime story…"/><button class="c2btn" data-ch="${esc(v.id)}" data-chunk="${esc(v.chunk||v.id)}">Render →</button></div><div class="c2out" id="c2out-${esc(v.id)}"></div></div>`
      : '';
    return (uv ? `<div class="enp yours">${esc(uv)}</div>` : '')
      + `<div class="varbox"><textarea id="var-${esc(v.id)}" placeholder="Paste your translation (from your own book)…"></textarea><br><button class="savebtn" data-ch="${esc(v.id)}">Save on this device</button></div>`
      + c2;
  }
  return '';
}

async function main(){
  let D = null;
  /* canonical-first: ipvv layers JSONs are the backend source of truth.
     Vendored data/ copy is the offline fallback, not the authority. */
  for(const u of (SRC ? [SRC] : [`${IPVV}/data/layers/${WORK}.json`, `${IPVV}/data/translations/${WORK}.json`, `data/${WORK}.json`])){
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

  // studio chant: align karaoke to displayed verses. Karaoke files vary —
  // some carry romanisation, some only Devanagari, and many merge sandhi
  // (सङ्क्रामोऽत्र = "saṃkrāmo 'tra"). So we compare CONSONANT SKELETONS and
  // walk both lists in order, letting one karaoke word cover several verse
  // words. Unmatched words simply get no timing.
  try{
    // Timings are small JSON and may live either on R2 or with the site.
    // R2 first (authoritative, CORS-open); the ipvv origin can return its SPA
    // fallback HTML with a 200, which get() would hand back as a string.
    let kar = null;
    for(const u of [`${R2}/karaoke/${WORK}.json`, `${IPVV}/data/karaoke-${WORK}.json`]){
      try{ const r = await get(u); if(Array.isArray(r) && r.length){ kar = r; break; } }catch(e){}
    }
    if(Array.isArray(kar) && kar.length){
      const dir = CHANTDIR[WORK] || WORK;
      const DEVCON = {'\u0915':'k','\u0916':'kh','\u0917':'g','\u0918':'gh','\u0919':'N',
        '\u091a':'c','\u091b':'ch','\u091c':'j','\u091d':'jh','\u091e':'N',
        '\u091f':'t','\u0920':'th','\u0921':'d','\u0922':'dh','\u0923':'N',
        '\u0924':'t','\u0925':'th','\u0926':'d','\u0927':'dh','\u0928':'N',
        '\u092a':'p','\u092b':'ph','\u092c':'b','\u092d':'bh','\u092e':'N',
        '\u092f':'y','\u0930':'r','\u0932':'l','\u0935':'v',
        '\u0936':'s','\u0937':'s','\u0938':'s','\u0939':'h'};
      const skelDeva = s=>{
        let out='';
        for(const ch of (s||'')){
          if(DEVCON[ch]) out += DEVCON[ch];
          else if(/[a-zA-Z]/.test(ch)) out += ch.toLowerCase();
        }
        return out;
      };
      const skelIast = s=>{
        const norm=(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
        return norm.replace(/[^a-z]/g,'').replace(/[aeiou]/g,'').replace(/[nm]/g,'N');
      };
      KAR = {words: [], au: []};
      verses.forEach((v,ix)=>{
        const raw = cleanSA(v.sa||v.sanskrit||'');
        const vw = raw.split(/\s+/).filter(Boolean)
                     .filter(w=>!/^[\u0964\u0965.,|]+$/.test(w))       // danda is not a word
                     .filter(w=>!/[A-Z]/.test(w));                    // source refs (AgAna_1)
        // one predicate, used both to pick the covering karaoke entry and to
        // assign timings — mismatched rules here silently killed whole works.
        const skelMatch = (t, ksk)=>{
          if(!t || !ksk) return false;
          return ksk===t || ksk.startsWith(t) || t.startsWith(ksk)
            || (t.length>=3 && ksk.includes(t));
        };
        const countMatch = k=>{
          const sk = (k.words||[]).map(x=>skelDeva(x.w||''));
          let n=0;
          vw.forEach(w=>{ const t=skelIast(w); if(sk.some(x=>skelMatch(t,x))) n++; });
          return n;
        };
        let best=null, bestN=0;
        // same number of verses as chant clips -> they correspond 1:1
        if(kar.length === verses.length){
          best = kar[ix]; bestN = countMatch(best);
        } else {
          kar.forEach(k=>{ const n=countMatch(k); if(n>bestN){ bestN=n; best=k; } });
        }
        const covered = best && bestN >= Math.max(1, Math.ceil(vw.length*0.3));
        const kw = covered ? (best.words||[]) : [];
        const ks = kw.map(x=>({skel:skelDeva(x.w||''), t0:x.t_on, t1:x.t_off,
                               w:x.w, syls:x.syls||null}));
        // Direct lookup: a karaoke word may cover several verse words (sandhi),
        // so repeats are allowed. Exact > prefix > containment.
        // Word-final anusvara is written both ways across sources.
        const nfDev = x => (x||'').replace(/\u0902$/, '\u092e\u094d');
        const out = vw.map(w=>{
          const t = skelIast(w);
          const devW = IAST_DEVA.convert(w);
          // Prefer an UNUSED exact word match over a fuzzy skeleton hit:
          // fuzzy matching could hand a word someone else's timings (and
          // therefore someone else's syllables), which silently demoted it
          // to whole-word highlighting even though an exact entry existed.
          let hit = ks.find(k=>!k.used && k.w && nfDev(k.w) === nfDev(devW));
          if(!hit && t){
            hit = ks.find(k=>!k.used && k.skel===t)
               || ks.find(k=>!k.used && (k.skel.startsWith(t) || t.startsWith(k.skel)))
               || ks.find(k=>!k.used && k.skel===t)
               || ks.find(k=>!k.used && (k.skel.startsWith(t) || t.startsWith(k.skel)))
               || ks.find(k=>!k.used && t.length>=3 && k.skel.includes(t))
               || ks.find(k=>k.skel===t)
               || ks.find(k=>k.skel && (k.skel.startsWith(t) || t.startsWith(k.skel)))
               || (t.length>=3 ? ks.find(k=>k.skel && k.skel.includes(t)) : null);
          }
          if(hit) hit.used = true;
          return {w, r:w, t0:hit?hit.t0:null, t1:hit?hit.t1:null,
                  syls:hit?hit.syls:null, kwd:hit?hit.w:null, hit:hit||null};
        });
        // A karaoke word often merges several verse words (sandhi:
        // sankramo'tra = samkramo 'tra). Every verse word in that run maps
        // to the same hit, so split the hit's syllables across the run by
        // relative length; each word then gets its own slice.
        for(let a=0;a<out.length;){
          const h = out[a].hit;
          if(!h || !h.syls || !h.syls.length){ a++; continue; }
          let b=a; while(b+1<out.length && out[b+1].hit===h) b++;
          if(b>a){
            const lens = out.slice(a,b+1).map(x=>Math.max(1,(x.w||'').length));
            const tot = lens.reduce((p,q)=>p+q,0);
            const n = h.syls.length;
            let pos=0;
            for(let k=a;k<=b;k++){
              const take = (k===b) ? n-pos : Math.max(1, Math.round(n*lens[k-a]/tot));
              out[k].sslice = h.syls.slice(pos, pos+take);
              pos += take;
            }
          }
          a=b+1;
        }
        KAR.words[ix]=out;
        KAR.au[ix]= (covered && best.id) ? `${R2}/audio/${dir}/${best.id}.mp3` : null;
      });
    }
  }catch(e){ KAR = null; }

  // ---- compiled alignment (scripts/build_align.py). When present the browser
  // does NO text matching: the artifact already says which chant clips belong
  // to this passage and gives every syllable an absolute time within it.
  ART = null; ART_CLIPS = {}; ART_REL = {};
  try{
    let art = null;
    for(const u of [`${R2}/align/${WORK}.json`, `align/${WORK}.json`]){
      try{ const r = await get(u); if(r && Array.isArray(r.units) && r.units.length){ art = r; break; } }catch(e){}
    }
    if(art){
      ART = art;
      const dir = CHANTDIR[WORK] || WORK;
      art.units.forEach((u, i) => {
        ART_CLIPS[i] = (u.clips||[]).map(c=>({ url:`${R2}/audio/${dir}/${c.clip}.mp3`, dur:c.dur }));
        const rel = new Map();
        (u.words||[]).forEach(w => rel.set(w[0] - u.w0, w[1]));
        ART_REL[i] = rel;
      });
    }
  }catch(e){ ART = null; }

  await loadMorph();
  await loadL0();
  if(qs.get('left')==='l0' && L0) LEFT = 'l0';
  if(qs.get('right')==='l0' && L0) RIGHT = 'l0';
  renderCol('L', LEFT); renderCol('R', RIGHT);
  const syncCols = ()=>{
    const split = RIGHT!=='none';
    const colR = $('#colR'), add = $('#addcol');
    if(colR) colR.style.display = split ? '' : 'none';
    const t = $('#textR'); if(t) t.style.display = split ? '' : 'none';
    const del = $('#colRdel'); if(del) del.style.display = split ? '' : 'none';
    if(add) add.style.display = split ? 'none' : '';
  };
  syncCols();
  const addBtn = $('#addcol');
  if(addBtn) addBtn.onclick = e=>{
    e.stopPropagation();
    const colR = $('#colR');
    if(colR) colR.style.display = '';
    const menu = $('#vermenuR');
    document.querySelectorAll('.dropdown-menu').forEach(m=>{ if(m!==menu) m.classList.remove('show'); });
    if(menu) menu.classList.add('show');
  };
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
  document.querySelectorAll('.c2btn').forEach(b=>{
    b.onclick = async ()=>{
      const ch = b.getAttribute('data-ch'), chunk = b.getAttribute('data-chunk');
      const inp = document.getElementById('c2in-'+ch), out = document.getElementById('c2out-'+ch);
      const style = (inp && inp.value.trim().slice(0,60)) || '';
      if(!style){ if(out) out.innerHTML = `<div class="milestone">Name a voice first — e.g. gen z.</div>`; return; }
      b.disabled = true; const old = b.textContent; b.textContent = 'Rendering…';
      try{
        const r = await fetch(API+'/api/c2/render', {method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({work: WORK, chunk, style})});
        const d = await r.json();
        if(!r.ok) throw new Error(d.error || ('http '+r.status));
        out.innerHTML = `<div class="enp c2txt">${esc(d.c2)}</div>`
          + `<div class="c2meta">machine rendering · ${esc(d.style)} · ${esc(d.model||'')}</div>`
          + `<button class="c2save" data-ch="${esc(ch)}">Save as mine →</button>`;
        out.querySelector('.c2save').onclick = ev=>{
          setVar(ev.target.getAttribute('data-ch'), d.c2); location.reload();
        };
      }catch(e){
        if(out) out.innerHTML = `<div class="milestone">${esc(String(e.message||e).slice(0,160))}</div>`;
      }
      b.disabled = false; b.textContent = old;
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
        + `<tr><td>editions</td><td>Close translation · Reading translation · Commentary — pipeline, machine-proposed, needs human review</td></tr>`
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
  labelEl.innerHTML = vid==='none' ? '' : `<div class="vlab" style="font-weight:700">${esc(d.label)}</div><div class="vdesc">${esc(d.desc)}</div><div class="vmeta">${esc(d.meta)}</div>`;
  /* grouped picker: Translations header with narrow bars (Close · Plain · Reading),
     then Sanskrit, then Yours. Version ids unchanged — old links keep working. */
  const GROUPS=[['Translations',['l1','l2','c1'],'bars'],['Sanskrit',['sa-deva','sa-iast','l0'],'list'],['Yours',['mine','none'],'list']];
  const inIds=id=>ids.includes(id);
  const item=id=>{
    const dd = VDEF[id]({title:DATA.title});
    const mark = id===vid ? `<span class="side">${side}</span>` : `<span class="side">&nbsp;</span>`;
    return `<a class="dropdown-item" href="#" data-col="${side}" data-v="${id}">${mark}<div><div class="label">${esc(dd.label)}</div><div class="description">${esc(dd.desc)}</div><div class="metadata">${esc(dd.meta)}</div></div></a>`;
  };
  let menuHtml='';
  for(const [gname,gids,kind] of GROUPS){
    const present=gids.filter(inIds);
    if(!present.length) continue;
    menuHtml+=`<div class="dgroup">${gname}</div>`;
    if(kind==='bars'){
      menuHtml+=`<div class="tbars">`+present.map(id=>{
        const dd = VDEF[id]({title:DATA.title});
        return `<a class="tbar${id===vid?' on':''}" href="#" data-col="${side}" data-v="${id}" title="${esc(dd.desc)}">${esc(dd.label)}</a>`;
      }).join('')+`</div>`;
    }else{
      menuHtml+=present.map(item).join('');
    }
  }
  menuEl.innerHTML = menuHtml + (side==='R' && vid!=='none' ? `<div class="dropdown-divider"></div><a class="dropdown-item remove" href="#" data-col="R" data-v="none"><span class="side">&nbsp;</span><div><div class="label">remove column</div></div></a>` : '');
  menuEl.querySelectorAll('.dropdown-item,.tbar').forEach(a=>{
    a.onclick = e=>{ e.preventDefault(); menuEl.classList.remove('show'); setCol(a.getAttribute('data-col')==='L'?'left':'right', a.getAttribute('data-v')); };
  });
  const drop = $(side==='L' ? '#verdropL' : '#verdropR');
  drop.onclick = ()=>{
    document.querySelectorAll('.dropdown-menu').forEach(m=>{ if(m!==menuEl) m.classList.remove('show'); });
    menuEl.classList.toggle('show');
  };
  if(vid==='none'){
    textEl.innerHTML='';
    return;
  }
  textEl.innerHTML = DATA.verses.map((v,i)=>
    `<div class="verse" data-i="${i}" id="v${i}"><a class="vref" href="#v${i}" data-i="${i}" title="recite this verse">§ ${i+1}</a>${verseText(v, vid, side, i)}</div>`
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
  QUEUE = null; QIDX = 0; QBASE = 0; QNEXT = null;
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
function playClip(){
  if(!QUEUE || QIDX >= QUEUE.length){ const nx = QNEXT; QUEUE = null; if(nx) nx(); return; }
  AU = AU || new Audio();
  AU.src = QUEUE[QIDX].url;
  AU.onended = ()=>{
    QBASE += (QUEUE[QIDX].dur || 0) + (ART ? (ART.gap||0) : 0);
    QIDX++;
    playClip();
  };
  AU.play().catch(()=>{ // autoplay blocked or clip missing
    QBASE += (QUEUE[QIDX].dur || 0) + (ART ? (ART.gap||0) : 0);
    QIDX++; playClip();
  });
  AUtimer = requestAnimationFrame(tickAU);
}
function tickAU(){
  if(!AU) return;
  const t = (QUEUE ? QBASE : 0) + AU.currentTime;
  document.querySelectorAll('.w.sing').forEach(w=>w.classList.remove('sing'));
  const all = document.querySelectorAll(`.w[data-t0][data-i="${AUix}"]`);
  // Hold the most recently started syllable until the next one begins, so
  // inter-syllable gaps don't flash the line unlit. Onsets are in document
  // order, so the last span with t0 <= t is the current one.
  let cur = null;
  for(const w of all){
    if(+w.getAttribute('data-t0') <= t) cur = w; else break;
  }
  if(cur) cur.classList.add('sing');
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
  const q = ART_CLIPS[i];
  if(q && q.length){
    QUEUE = q; QIDX = 0; QBASE = 0; QNEXT = next;
    playClip();
    return;
  }
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
