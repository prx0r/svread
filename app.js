/* svread — Scaife mirror. Behaviors lifted from scaife-viewer (MIT).
   ?work=X [&left=sa-deva|sa-iast|l1|l2|c1] [&right=none|l1|l2|c1|mine] */
(function(){
"use strict";
const $ = s => document.querySelector(s);
const esc = s => String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
  .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const qs = new URLSearchParams(location.search);
const WORK = qs.get('work') || 'bhairavastava';
const SRC = qs.get('src');
const IPVV = 'https://ipvv-a8u.pages.dev';
const API = 'https://ipvv-api.tradesprior.workers.dev';
const GHATA_SOURCE = `${IPVV}/data/sanskrit/ghatakarpara.txt`;
const GHATA_SOURCE_SHA256 = 'c3025effdb6ed0ea7eeb83fc3b5b4955aed8086bc5a8a9ee4646d689ffe73783';
// Chant audio + karaoke timings live in the public R2 bucket (CORS-open).
const R2 = 'https://pub-87169194562a44fcb8279a799d626c62.r2.dev';
/* studio chant: karaoke timings + mp3s live on the ipvv origin.
   Probed per work — the day kashaudio ships new timings, they just work. */
const CHANTDIR = {anuttarastika:'anuttarashtika_trad'};
let KAR = null; // {words:[[ {w,r,t0,t1} ]], au:[url|null]}
let ART = null, ART_CLIPS = {}, ART_REL = {};   // compiled alignment (see build_align.py)
let AU = null, AUtimer = null, AUix = null;
let PS = null;      // per-section play: {kind:'sa'|'en'|'c1', i, paused, gen, audio, _step}
let PLAYGEN = 0;    // invalidates older chains (widget recite vs section play never fight)
const EN_READ_OFF = false;  // English (Granny) readout ON — default language reads English
let QUEUE = null, QIDX = 0, QBASE = 0, QNEXT = null;
let CURIX = 0;   // current verse (gutter / § jumps) — read-buttons act on it
/* debug/inspection hook (read-only): window.__sv.kar()/au()/ps() — no writes */
window.__sv = { kar:()=>KAR, au:()=>AU, ps:()=>PS, gen:()=>PLAYGEN };
let SCHPROF = null;  // signed-in scholar (GET /api/auth/me)
const DEFAULT_PH = 'ask about this work…';   // chat box placeholder (chat markup + pushing rotation share it)
let LEFT = qs.get('left') || localStorage.getItem('svv-left') || 'sa-deva';
let RIGHT = qs.get('right') || localStorage.getItem('svv-right') || 'none';
/* plain-word aliases: ?left=literal&right=poetic works; lane codes still accepted. */
const ALIAS = {literal:'l0', plain:'l2', poetic:'c1', commentary:'c1', final:'l3', svatantrya:'l4', canonical:'l4', close:'l1', gloss:'l0', reading:'c1'};
LEFT = ALIAS[(LEFT||'').toLowerCase()] || LEFT;
RIGHT = ALIAS[(RIGHT||'').toLowerCase()] || RIGHT;
const LIDS_BASE = ['sa-deva','sa-iast','l1','l2','l3','l4','c1'];
const RIDS_BASE = ['none','l1','l2','l3','l4','c1','mine'];
let LIDS = [...LIDS_BASE], RIDS = [...RIDS_BASE];
let L0 = null; // data/l0/<wid>.json {verses:[{id,tokens:[{iast,gloss,raw,status}]}]}
async function loadL0(){
  try{
    const m = await get(`data/l0/${WORK}.json`);
    if(m && m.verses && m.verses.length){
      L0 = {};
      for(const v of m.verses){
        const row=(DATA?.verses||[]).find(x=>x.id===v.id||x.chunk===v.id);
        if(isReaderPass(row)) L0[v.id] = v.tokens || [];
      }
      if(!LIDS.includes('l0')){ LIDS.splice(3, 0, 'l0'); RIDS.splice(3, 0, 'l0'); }
    }
  }catch(e){ L0 = null; }
}
/* l0 allowed pending loadL0 — post-load fallback (below) settles it per work */
if(!LIDS_BASE.includes(LEFT) && LEFT!=='l0') LEFT = 'sa-deva';
if(!RIDS_BASE.includes(RIGHT) && RIGHT!=='l0') RIGHT = 'none';

const IAST_DEVA = (()=>{
  const VOW={a:'\u0905','\u0101':'\u0906',i:'\u0907','\u012b':'\u0908',u:'\u0909','\u016b':'\u090a','\u1e5b':'\u090b','\u1e5d':'\u0960','\u1e37':'\u090c',e:'\u090f',o:'\u0913',ai:'\u0910',au:'\u0914'};
  const VSN={'\u0101':'\u093e',i:'\u093f','\u012b':'\u0940',u:'\u0941','\u016b':'\u0942','\u1e5b':'\u0943','\u1e5d':'\u0944','\u1e37':'\u0962',e:'\u0947',o:'\u094b',ai:'\u0948',au:'\u094c'};
  const CON={k:'\u0915',kh:'\u0916',g:'\u0917',gh:'\u0918','\u014b':'\u0919','\u1e45':'\u0919',c:'\u091a',ch:'\u091b',j:'\u091c',jh:'\u091d','\u00f1':'\u091e','\u1e6d':'\u091f','\u1e6dh':'\u0920','\u1e0d':'\u0921','\u1e0dh':'\u0922','\u1e47':'\u0923',t:'\u0924',th:'\u0925',d:'\u0926',dh:'\u0927',n:'\u0928',p:'\u092a',ph:'\u092b',b:'\u092c',bh:'\u092d',m:'\u092e',y:'\u092f',r:'\u0930',l:'\u0932',v:'\u0935','\u015b':'\u0936','\u1e63':'\u0937',s:'\u0938',h:'\u0939'};
  const OTH={'\u1e43':'\u0902','\u1e41':'\u0902','\u1e25':'\u0903',"'":'\u093d','\u2019':'\u093d','.':'\u0964','..':'\u0965','|':'\u0964','||':'\u0965',' ':' ','\n':'\n','\u2014':'\u0964'};
  const HAL='\u094d';
  const ALL=Object.keys(CON).concat(Object.keys(VOW)).sort((a,b)=>b.length-a.length);
  function convert(s){
    s=(s||'').normalize('NFC');
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
function cleanSA(s){ return (s||'').replace(/^# Text\s*/,'').replace(/\s+/g,' ').trim(); }
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
async function getReaderData(p){
  const response=await fetch(p);if(!response.ok)throw new Error('Reader data unavailable');
  const bytes=await response.arrayBuffer();
  const data=JSON.parse(new TextDecoder().decode(bytes));
  return {data,sha256:await sha256Bytes(bytes)};
}
async function sha256Bytes(bytes){
  try{const digest=await crypto.subtle.digest('SHA-256',bytes);
    return Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');}catch{return '';}
}
function parseGhatakarparaSource(text){
  const verses=new Map();
  for(const paragraph of text.split(/\n\s*\n/)){
    const matches=[...paragraph.matchAll(/\/\/\s*Ghk_(\d+)\s*\/\//g)];
    if(matches.length>1)return null;
    if(!matches.length)continue;
    const number=Number(matches[0][1]);
    if(number<1||number>21||verses.has(number))return null;
    verses.set(number,paragraph.replace(/\/\/\s*Ghk_\d+\s*\/\//,'').trim());
  }
  return verses.size===21?verses:null;
}
async function pinnedGhatakarpara(fetcher=fetch,pin=GHATA_SOURCE_SHA256){
  try{
    const response=await fetcher(GHATA_SOURCE);if(!response.ok)return null;
    const bytes=await response.arrayBuffer();if(await sha256Bytes(bytes)!==pin)return null;
    return parseGhatakarparaSource(new TextDecoder().decode(bytes));
  }catch{return null;}
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

let DATA = null;
let DATA_SOURCE = null;

// The same gate controls every reader surface, including audio and exports.
function isReaderPass(v){return !!(v&&v.gate==='PASS'&&
  [v.l2,v.l1].some(text=>typeof text==='string'&&text.trim()));}
function validReaderRow(v){return !!(v&&typeof v==='object'&&!Array.isArray(v)&&
  typeof (v.id||v.chunk)==='string'&&(v.id||v.chunk).trim()&&
  ['sa','sanskrit','gate','l1','l2','l3','l4','c1','argmap'].every(k=>v[k]==null||typeof v[k]==='string'));}
function safeReaderVerse(v){
  const sa=v.sa||v.sanskrit||'';
  if(isReaderPass(v))return {...v,sa};
  return {id:v.id||v.chunk||'',chunk:v.chunk||v.id||'',sa,gate:v.gate||'BLOCKED',
    model:v.model||'',date:v.date||'',source_issue:v.source_issue||'',source_complete:!!v.source_complete};
}

function engLaneId(){
  const vs = (DATA && DATA.verses) || [];
  if(vs.some(v=>v.l4)) return 'l4';
  if(vs.some(v=>v.l3)) return 'l3';
  return 'l2';
}
/* Side-by-side section alignment: every verse pair gets the same row height,
   so Sanskrit and English read across at the same eye line. Grow-only with an
   equality guard -> converges (no ResizeObserver loop). */

const VDEF = {
  'sa-deva': v=>({label:v.title||WORK, desc:'Sanskrit text, Devanagari', meta:''}),
  'sa-iast': v=>({label:v.title||WORK, desc:'Sanskrit text, IAST transliteration', meta:''}),
  'l1': ()=>({label:'Literal', desc:'Close translation — faithful to the Sanskrit', meta:'eng translation'}),
  'l2': ()=>({label:'English translation', desc:'The English translation — clear, direct prose', meta:'eng translation'}),
  'c1': ()=>({label:'Commentary', desc:'Commentary — SUMMARY plus rasa reading', meta:'eng commentary'}),
  'l3': ()=>({label:'Final', desc:'Final translation — line by line, evocative', meta:'eng final'}),
  'l4': ()=>({label:'Svatantrya Translation', desc:'English', meta:''}),
  'l0': ()=>({label:'Literal', desc:'Word-by-word gloss — the most literal layer', meta:'eng gloss'}),
  'mine': ()=>({label:'Your version', desc:'Pasted by you, this device only', meta:'eng user-version'}),
  'none': ()=>({label:'—', desc:'', meta:''}),
};

function saWords(v, iast, vix){
  const VI = (vix!=null) ? vix : (v.n-1);
  const raw = cleanSA(v.sa||'');
  const tokens = raw.split(/\s+/).filter(Boolean);
  const punctuation = w=>/^[\u0964\u0965.,|;:]+$/.test(w);
  const words = tokens.filter(w=>!punctuation(w));
  const shown = iast ? words : words.map(w=>/^\[lacuna\]$/i.test(w)?w:IAST_DEVA.convert(w));
  const keepPunctuation = rendered=>{let i=0;return tokens.map(w=>punctuation(w)?esc(iast?w:IAST_DEVA.convert(w)):rendered[i++]).join(' ');};
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
    return `<div class="sa">` + keepPunctuation(shown.map((w,j)=>{
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
    })) + `</div>` + roLine;
  }

  // ---- live karaoke match (works without an artifact)
  const kw = KAR && KAR.words[VI];
  if(kw && kw.length){
    const nf = x => (x||'').replace(/\u0902$/, '\u092e\u094d');
    return `<div class="sa">` + keepPunctuation(shown.map((w,j)=>{
      const candidate=kw[j]||{};
      const kk=candidate.r===words[j]?candidate:{};
      const t = (kk.t0!=null) ? ` data-t0="${kk.t0}" data-t1="${kk.t1}" data-i="${VI}"` : '';
      const syl = (kk.sslice && kk.sslice.length) ? kk.sslice : kk.syls;
      if(syl && syl.length && nf(syl.map(x=>x.d).join('')) === nf(w)){
        const inner = syl.map(x=>
          `<span class="w syl" data-t0="${x.t0}" data-t1="${x.t1}" data-i="${VI}">${esc(x.d)}</span>`).join('');
        return `<span class="kword" data-w="${esc(words[j])}" data-v="${esc(v.id)}">${inner}</span>`;
      }
      return `<span class="w" data-w="${esc(words[j])}" data-v="${esc(v.id)}"${t}>${esc(w)}</span>`;
    })) + `</div>` + (!iast ? `<div class="ro">${esc(raw)}</div>` : '');
  }

  // ---- nothing timed: plain text
  return `<div class="sa">` + keepPunctuation(shown.map((w,j)=>
    `<span class="w" data-w="${esc(words[j])}" data-v="${esc(v.id)}" data-i="${VI}">${esc(w)}</span>`))
    + `</div>` + roLine;
}
function verseText(v, vid, col, vix){
  const raw = cleanSA(v.sa||'');
  const pass = isReaderPass(v);
  const issue=v.source_issue?`<div class="milestone">${esc(v.source_issue)}</div>`:'';
  if(vid==='sa-deva') return saWords(v, false, vix)+issue;
  if(vid==='sa-iast') return saWords(v, true, vix)+issue;
  if(!pass) return saWords(v, false, vix)+issue
    + `<div class="milestone">English withheld — gate ${esc(v.gate||'BLOCKED')}</div>`;
  if(vid==='l1') return `<div class="enp">${esc(cleanEN(v.l1||v.l2||''))}</div>`;
  if(vid==='l2'){
    const t = esc(cleanEN(v.l2||v.l1||''));
    /* passage-grained chunks carry multi-paragraph L2: render the breaks */
    if(t.includes('\n\n')) return `<div class="enp">${t.split(/\n{2,}/).map(p=>`<p>${p.replace(/\n/g,'<br>')}</p>`).join('')}</div>`;
    return `<div class="enp">${t}</div>`;
  }
  if(vid==='l4'){
    if(v.l4)return `<div class="enp finalsec">${esc(v.l4).replace(/\n/g, '<br>')}</div>`;
    const fallback=v.l3||v.l2||v.l1||'',label=v.l3?'Final (L3)':v.l2?'English translation (L2)':'Literal (L1)';
    return `<div class="milestone">Svatantrya (L4) pending — showing ${label}.</div>`
      + `<div class="enp finalsec">${esc(cleanEN(fallback)).replace(/\n/g,'<br>')}</div>`;
  }
  if(vid==='l3') return v.l3 ? `<div class="enp finalsec">${esc(v.l3).replace(/\n/g, '<br>')}</div>` : `<div class="milestone">Final translation pending — needs human review.</div>`;
  if(vid==='c1'){
    if(v.c1) return `<div class="enp c1sec">${mdSec(v.c1.replace(/^##\s+[^\n]*\n/, ''))}</div>`;
    /* song-level commentary: data holds ONE copy on the song's first verse —
       every other verse of the song fans out from it (single change, all works) */
    const m = (v.id||'').match(/^(.*)-v\d+$/);
    if(m){
      const first = (DATA.verses||[]).find(x=>x.id===m[1]+'-v01' && isReaderPass(x) && x.c1)
                 || (DATA.verses||[]).find(x=>x.id && x.id.indexOf(m[1]+'-v')===0 && isReaderPass(x) && x.c1);
      if(first) return `<div class="enp c1sec">${mdSec(first.c1.replace(/^##\s+[^\n]*\n/, ''))}</div>`
        + `<div class="cmp-note">song commentary (from §${esc((first.id||'').split('-v').pop())})</div>`;
    }
    return `<div class="enp">${esc(cleanEN(v.l2||v.l1||''))}</div>`;
  }
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


/* ================= Scholar hub (?view=scholar) =================
   The same functions and classes as the reader: $, esc, get, W, dl,
   .col/.verbar/.version-select/.text, .varbox textarea + .savebtn,
   .widget/.wtable/.vref-list/.c2row/.c2btn/.cmp-note/.urn/.milestone.
   Data: data/scholar/<work>.json (emit_scholar.py) — originals come
   from the canonical pipeline bytes, versions/reviews/signoffs from
   the append-only scholar/ ledgers. Browser saves are device-local
   drafts (parent = the version they fork); Export JSON publishes. */
let SCH = null;                       // emitted scholar doc (data/scholar/<work>.json)
const SLAY = {
  t1:      {label:'T1',      desc:'fast translation + token gloss', mode:'field', field:'quick_english'},
  l0:      {label:'L0',      desc:'per-token gloss options (the audit)', mode:'json'},
  argmap:  {label:'Argmap',  desc:'speaker · question · premises · inference', mode:'json'},
  l2:      {label:'L2',      desc:'plain exact English', mode:'field', field:'plain_english'},
  c1:      {label:'C1',      desc:'essence + standard essay (song scope)', mode:'json'},
  l3:      {label:'L3',      desc:'final canonical translation — line by line', mode:'field', field:'lines'},
  l4:      {label:'L4',      desc:'the song — L3 set to music', mode:'field', field:'lines'},
  c2:      {label:'C2',      desc:'style renders mapped to the essence', mode:'json'},
};
const SLAY_ORDER = ['t1','l0','argmap','l2','c1','l3','l4','c2'];
function schDraftKey(){return SCHPROF?.id ? `svv-scholar-${WORK}-${SCHPROF.id}` : `svv-scholar-${WORK}`;}
function schDrafts(){ try{ return JSON.parse(localStorage.getItem(schDraftKey())) || []; }catch(e){ return []; } }
function schPutDrafts(a){ try{ localStorage.setItem(schDraftKey(), JSON.stringify(a)); }catch(e){} }
function schAuthor(){ try{ return localStorage.getItem('svv-scholar-author') || ''; }catch(e){ return ''; } }
function schLocalHash(o){
  const s = JSON.stringify(o); let h = 5381;
  for(let i=0;i<s.length;i++) h = ((h<<5)+h+s.charCodeAt(i))>>>0;
  return h.toString(16) + Date.now().toString(16).slice(-4);
}
function schVsort(ids){
  return ids.slice().sort((a,b)=>{
    const pa = a.match(/^(.*)-v(\d+)$/), pb = b.match(/^(.*)-v(\d+)$/);
    if(pa && pb && pa[1]===pb[1]) return (+pa[2])-(+pb[2]);
    return a < b ? -1 : a > b ? 1 : 0;
  });
}
function schTextOf(layer, obj){
  const def = SLAY[layer];
  if(!def) return '';
  if(def.mode==='json') return JSON.stringify(obj, null, 1);
  const v = obj ? obj[def.field] : '';
  return Array.isArray(v) ? v.join('\n') : String(v==null?'':v);
}
function schContentFrom(layer, target, text, base){
  const orig = (SCH.originals[layer]||{})[target];
  const def = SLAY[layer];
  if(def.mode==='json'){
    const o = JSON.parse(text);
    if(!o || typeof o !== 'object') throw new Error('not an object');
    return o;
  }
  const c = Object.assign({}, orig, base || {});
  c[def.field] = (def.field==='lines')
    ? String(text||'').split('\n').map(x=>x.trim()).filter(Boolean)
    : String(text||'');
  return c;
}
function schAllVersions(layer, target){
  return (SCH.versions||[]).concat(schDrafts())
    .filter(v=>v.layer===layer && v.target===target);
}
function schTreeHtml(layer, target, onBase){
  const rows = schAllVersions(layer, target);
  if(!rows.length) return `<div class="milestone">no scholar versions on this yet — be the first.</div>`;
  const ids = new Set(rows.map(v=>v.version_id));
  const kids = {};
  rows.forEach(v=>{ (kids[v.parent] = kids[v.parent]||[]).push(v); });
  const root = kids[null] || [];
  const outside = rows.filter(v=>v.parent && !ids.has(v.parent));
  const line = (v, depth)=>{
    const mine = v.version_id.startsWith('local:');
    const nm = esc(v.author||'anon') + (mine ? ' · this device' : '');
    return `<div style="padding-left:${depth*1.1}rem"><a href="#" class="schbase vref" data-vid="${esc(v.version_id)}">` +
      `${v.version_id.startsWith('local:')?'◇':'◆'} ${esc(v.author||'anon')}</a> ` +
      `<span class="cmp-note">${esc(v.status||'')} · ${esc((v.created_at||'').slice(0,16).replace('T',' '))} · ${esc((v.content_sha256||'local').slice(0,8))}</span>` +
      (v.note?`<div class="cmp-note">${esc(v.note)}</div>`:'') + `</div>` +
      (kids[v.version_id]||[]).map(k=>line(k, depth+1)).join('');
  };
  return root.map(v=>line(v,0)).join('') + outside.map(v=>line(v,0)).join('');
}
async function scholarView(){
  try{
    const r = await fetch(API + '/api/auth/me', {credentials: 'include'});
    SCHPROF = (await r.json()).profile;
  }catch(e){ SCHPROF = null; }
  let idx = null;
  try{ idx = await get('data/scholar/index.json'); }catch(e){}
  SCH = await get(`data/scholar/${WORK}.json`).catch(()=>null);
  document.title = `Scholar · ${WORK}`;
  if(!SCH){
    const works = idx ? Object.keys(idx) : [];
    $('#wh1').textContent = 'Scholar';
    $('#wh2').textContent = 'the hub for scholarly work and sign-offs';
    $('#wh3').textContent = works.length ? `${works.length} work(s) with scholar data` : 'no scholar data yet';
    $('#cols').innerHTML = `<section class="col left"><div class="text">` +
      (works.length
        ? `<div class="vref-list">` + works.map(w=>`<a href="?work=${esc(w)}&view=scholar">${esc(w)}</a>`).join('') + `</div>`
        : `<div class="milestone">nothing emitted yet — run tools/emit_scholar.py.</div>`) +
      `</div></section><section class="col right"><div class="text"><div class="milestone">pick a work → look at any layer → edit → save.</div></div></section>`;
    return;
  }
  const st0 = (()=>{ try{ return JSON.parse(localStorage.getItem(`svv-schol-${WORK}`)) || {}; }catch(e){ return {}; } })();
  const q=new URL(globalThis.location?.href||'https://svread.invalid/').searchParams;
  const qLayer=q.get('layer'),qTarget=q.get('target');
  const linked=!!(SLAY[qLayer]&&qTarget&&Object.hasOwn(SCH.originals?.[qLayer]||{},qTarget));
  const st = { layer: linked?qLayer:(SLAY[st0.layer] ? st0.layer : 'l3'), target: linked?qTarget:(st0.target || null), base: null };
  let publicationEndpoint = '';
  const workspace=typeof ScholarWorkspace==='function'?new ScholarWorkspace({api:API,work:WORK,
    profile:()=>SCHPROF,onStatus:message=>{const node=$('#schmsg');if(node)node.textContent=message;}}):null;
  if(workspace)await workspace.load();
  if(!st.target){
    const t = schVsort(Object.keys(SCH.originals[st.layer]||{}));
    st.target = t[0] || null;
  }
  const persist = ()=>{ try{ localStorage.setItem(`svv-schol-${WORK}`, JSON.stringify({layer:st.layer, target:st.target})); }catch(e){} };

  $('#wh1').textContent = `Scholar — ${SCH.work}`;
  $('#wh2').textContent = `${(SCH.versions||[]).length} versions · ${(SCH.reviews||[]).length} reviews · ${(SCH.signoffs||[]).length} sign-offs`;
  $('#wh3').textContent = 'look at any layer · edit · save — your version forks off the original or anyone’s';

  const allV = ()=>(SCH.versions||[]).concat(schDrafts());
  const basesList = ()=>[{id:null, name:'Original (canonical)'}]
    .concat(schAllVersions(st.layer, st.target).map(v=>({id:v.version_id, name:`${v.version_id.startsWith('local:')?'◇':'◆'} ${v.author||'unattributed'} · ${v.author_kind||'author type unspecified'} · ${v.status||'status unspecified'} · ${v.version_id}${v.version_id.startsWith('local:')?' · this device':''}`})));

  function currentBaseContent(){
    if(!st.base) return {content: (SCH.originals[st.layer]||{})[st.target], label:'Original (canonical)'};
    const v = allV().find(x=>x.version_id===st.base);
    if(!v){ st.base = null; return {content:(SCH.originals[st.layer]||{})[st.target], label:'Original (canonical)'}; }
    return {content: v.content, label: `${v.author}'s version (${v.version_id})`};
  }

  function renderCols(){
    const def = SLAY[st.layer];
    const orig = (SCH.originals[st.layer]||{})[st.target];
    const base = currentBaseContent();
    const origHtml = orig
      ? (def.mode==='json'
          ? `<div class="urn" style="white-space:pre-wrap">${esc(JSON.stringify(orig,null,1))}</div>`
          : `<div class="enp">${esc(schTextOf(st.layer, orig)).replace(/\n/g,'<br>')}</div>`)
      : `<div class="milestone">no canonical ${esc(st.layer)} for this target.</div>`;
    $('#cols').innerHTML =
      `<section class="col left">
         <div class="verbar"><div class="version-select"><span class="vlab">ORIGINAL</span>
           <span class="vdesc">${esc(def.label)} · ${esc(st.target||'—')}</span>
           <span class="vmeta">canonical pipeline bytes — never edited</span></div></div>
         <div class="text">${origHtml}
           <div class="c2box"><div class="cmp-note" style="text-transform:uppercase;letter-spacing:.15em;font-size:.68rem">Forks of this target</div>
           ${schTreeHtml(st.layer, st.target)}</div>
           <details class="c2box"><summary>Compare saved versions</summary>
             <div class="cmp-note">Read-only comparison for this passage and layer. Version status does not imply human review.</div>
             <label>First version <select id="schcompare-left">${basesList().map(v=>`<option value="${esc(v.id||'original')}">${esc(v.name)}</option>`).join('')}</select></label>
             <pre id="schcompare-left-text"></pre>
             <label>Second version <select id="schcompare-right">${basesList().map(v=>`<option value="${esc(v.id||'original')}">${esc(v.name)}</option>`).join('')}</select></label>
             <pre id="schcompare-right-text"></pre>
           </details>
         </div>
       </section>
       <section class="col right">
         <div class="verbar"><div class="version-select"><span class="vlab">YOUR EDIT</span>
           <span class="vdesc">base: ${esc(base.label)}</span>
           <span class="vmeta">save on this device or submit for review</span></div></div>
         <div class="text">
           <div class="varbox"><textarea id="schta" spellcheck="false">${esc(schTextOf(st.layer, base.content))}</textarea><br>
           <button class="savebtn" id="schsave">Save as my version</button>
           <button class="c2btn" id="schexport">Export JSON</button></div>
           <div id="schworkspace"></div>
           <div class="c2box"><div class="c2head">Submit for review</div>
           <input id="schendpoint" type="url" placeholder="Publication server" aria-label="Publication server" value="${esc(publicationEndpoint)}"/>
           <input id="schtoken" type="password" autocomplete="off" placeholder="Access token" aria-label="Access token"/>
           <button class="c2btn" id="schsubmit">Submit version</button>
           <div class="cmp-note">Publication currently uses a separate service token from your Scholar account. The token is sent to the publication server and is not saved in this browser. Submissions are reviewed before publication.</div></div>
           <div class="cmp-note" id="schmsg"></div>
         </div>
       </section>`;
    const comparable=schAllVersions(st.layer,st.target);
    $('#schcompare-left').value='original';
    $('#schcompare-right').value=st.base||comparable[0]?.version_id||'original';
    const updateComparison=()=>{
      for(const side of ['left','right']){
        const id=$('#schcompare-'+side).value;
        const version=id==='original'?null:comparable.find(v=>v.version_id===id);
        const content=id==='original'?orig:version?.content;
        $('#schcompare-'+side+'-text').textContent=content?schTextOf(st.layer,content):'Version unavailable for this passage.';
      }
    };
    $('#schcompare-left').onchange=updateComparison;$('#schcompare-right').onchange=updateComparison;updateComparison();
    // base = click a fork
    $('#cols').querySelectorAll('a.schbase').forEach(a=>{
      a.onclick = e=>{
        e.preventDefault();
        st.base = a.getAttribute('data-vid');
        renderCols();
      };
    });
    $('#schsave').onclick = ()=>{
      const msg = $('#schmsg');
      const text = $('#schta').value;
      let content;
      try{ content = schContentFrom(st.layer, st.target, text, currentBaseContent().content); }
      catch(err){ msg.textContent = `not saved — ${st.layer==='c1'||SLAY[st.layer].mode==='json' ? 'invalid JSON: '+esc(String(err).slice(0,60)) : esc(String(err))}`; return; }
      if(!text.trim()){ msg.textContent = 'not saved — hollow edit refused.'; return; }
      const author = schAuthor() || 'anonymous-scholar';
      const selected = st.base && allV().find(x=>x.version_id===st.base);
      const baseHash = selected?.base_sha256 || (SCH.original_hashes?.[st.layer]||{})[st.target] || '';
      const localId = (globalThis.crypto && crypto.randomUUID) ? crypto.randomUUID() : schLocalHash({t:st.layer,g:st.target,c:content,a:author,n:Date.now()});
      const v = {
        version_id: 'local:' + localId,
        work: WORK, layer: st.layer, target: st.target,
        parent: st.base, base_sha256: baseHash, author, author_kind: 'human',
        created_at: new Date().toISOString().replace(/\.\d+Z$/,'Z'),
        note: 'browser draft', content_sha256: '',
        content, status: 'DRAFT_LOCAL',
      };
      const all = schDrafts(); all.push(v); schPutDrafts(all);
      st.base = v.version_id;
      msg.textContent = `saved ◇ ${v.version_id} — parent: ${v.parent || 'original'}`;
      $('#wh2').textContent = `${(SCH.versions||[]).length} versions · ${all.length} mine · ${(SCH.reviews||[]).length} reviews · ${(SCH.signoffs||[]).length} sign-offs`;
      renderLib(); renderCols();
      $('#schmsg') && ($('#schmsg').textContent = `saved ◇ ${v.version_id} — parent: ${v.parent || 'original'} · export JSON to publish`);
    };
    $('#schendpoint').oninput = e=>{ publicationEndpoint = e.target.value.trim(); };
    function submission(){
      const base = currentBaseContent();
      if(!$('#schta').value.trim()) throw new Error('The edit is empty.');
      const content = schContentFrom(st.layer, st.target, $('#schta').value, base.content);
      const drafts = schDrafts();
      const chain = [];
      const visited = new Set();
      let parent = st.base;
      while(parent && parent.startsWith('local:')){
        if(visited.has(parent)) throw new Error('The draft chain contains a cycle.');
        visited.add(parent);
        const draft = drafts.find(x=>x.version_id===parent);
        if(!draft) throw new Error('A parent draft is missing from this device.');
        chain.unshift(draft);
        parent = draft.parent;
      }
      const currentText = schTextOf(st.layer, base.content).trim();
      if(!st.base || !st.base.startsWith('local:') || $('#schta').value.trim() !== currentText){
        const selected = st.base && allV().find(x=>x.version_id===st.base);
        const localId = (globalThis.crypto && crypto.randomUUID) ? crypto.randomUUID() : schLocalHash({t:st.layer,g:st.target,c:content,n:Date.now()});
        chain.push({version_id:'local:'+localId, work:WORK, layer:st.layer, target:st.target,
          parent:st.base, base_sha256:selected?.base_sha256 || (SCH.original_hashes?.[st.layer]||{})[st.target] || '',
          author:schAuthor() || 'anonymous-scholar', author_kind:'human',
          note:'exported from svread Scholar', content});
      }
      return {format:'scholar-submission/v1', work:WORK, versions:chain};
    }
    $('#schexport').onclick = ()=>{
      let payload;
      try{ payload = submission(); }
      catch(err){ $('#schmsg').textContent = String(err.message||err); return; }
      dl(`${WORK}-${st.layer}-${st.target}.version.json`, JSON.stringify(payload, null, 1), 'application/json');
      $('#schmsg').textContent = 'downloaded — import with: python3 tools/scholar.py import --file <json>';
    };
    $('#schsubmit').onclick = async ()=>{
      const message = $('#schmsg');
      const token = $('#schtoken').value;
      try{
        const endpoint = new URL(publicationEndpoint);
        const local = endpoint.hostname === 'localhost' || endpoint.hostname === '127.0.0.1';
        if(endpoint.username || endpoint.password || endpoint.search || endpoint.hash ||
           (endpoint.protocol !== 'https:' && !(local && endpoint.protocol === 'http:'))){
          throw new Error('Use an HTTPS publication server.');
        }
        if(!token) throw new Error('Enter your access token.');
        const payload = submission();
        const url = endpoint.origin + '/v1/scholar/submissions';
        message.textContent = 'Submitting…';
        const response = await fetch(url, {method:'POST', headers:{'Content-Type':'application/json',
          'Authorization':'Bearer '+token}, body:JSON.stringify(payload)});
        const result = await response.json();
        if(!response.ok) throw new Error(result.error || 'Submission failed.');
        $('#schtoken').value = '';
        message.textContent = 'Submitted for review · ' + result.branch;
      }catch(err){ message.textContent = String(err.message||err); }
    };
    if(workspace){
      const selected=st.base && allV().find(x=>x.version_id===st.base);
      workspace.attach({container:$('#schworkspace'),textarea:$('#schta'),target:st.target,layer:st.layer,
        baseHash:selected?.base_sha256||(SCH.original_hashes?.[st.layer]||{})[st.target]||'',parent:st.base});
    }
  }

  function renderLib(){
    const nOrig = Object.keys(SCH.originals[st.layer]||{}).length;
    const tgtIds = schVsort(Object.keys(SCH.originals[st.layer]||{}));
    $('#lib').innerHTML =
      W('schauth','Scholar account', SCHPROF
        ? `<table class="wtable"><tr><td>signed in</td><td>${esc(SCHPROF.display_name||'')} · ${esc(SCHPROF.email||'')}${SCHPROF.orcid?`<div class="cmp-note">ORCID ${esc(SCHPROF.orcid)}</div>`:''}</tr></table><div style="margin-top:.4rem"><button class="c2btn" id="schout">sign out</button></div>`
        : `<div class="c2row"><input id="schemail" placeholder="email" type="email"/><input id="schname" placeholder="display name"/></div>
           <div class="c2row" style="margin-top:.3rem"><input id="schpw" placeholder="password (8+ chars)" type="password"/><button class="c2btn" id="schgo">sign in / join</button></div>
           <div class="cmp-note" id="schauthmsg">Sign in to save private work, request review, and submit a signed version.</div>`)
      + W('schhub','Scholar',
        `<table class="wtable">`
        + `<tr><td>work</td><td>${esc(SCH.work)}</td></tr>`
        + `<tr><td>versions</td><td>${(SCH.versions||[]).length} published · ${schDrafts().length} mine (device)</td></tr>`
        + `<tr><td>reviews</td><td>${(SCH.reviews||[]).length} ReviewEvents (exact-hash bound)</td></tr>`
        + `<tr><td>promotions</td><td>${(SCH.promotions||[]).length} — the only path to reviewed</td></tr>`
        + (SCH.contract ? `<tr><td>schema</td><td>${esc(SCH.contract.structural_schema_version||'')} · <span title="${esc(SCH.contract.contract_sha256||'')}">${esc((SCH.contract.contract_sha256||'').slice(0,12))}</span></td></tr>` : '')
        + `<tr><td>generated</td><td>${esc(SCH.generated||'')}</td></tr>`
        + `</table><div class="cmp-note" style="margin-top:.4rem"><a class="redlink" href="?work=${esc(WORK)}">← back to the reader</a></div>`)
      + W('schessays','Scholar essays',
          (SCH.essays||[]).length ? SCH.essays.map(a=>{
            const refs=Array.isArray(a.snapshot?.content?.citations)?a.snapshot.content.citations:[];
            const commit=/^[a-f0-9]{40,64}$/.test(a.source_git_commit||'')?a.source_git_commit:'';
            const references=refs.filter(c=>c&&/^[a-z0-9][a-z0-9_-]{0,79}$/.test(c.work||'')&&/^[A-Za-z0-9][A-Za-z0-9_.-]{0,159}$/.test(c.target||''));
            return `<details><summary>${esc(a.title)} · ${esc(a.author)}</summary><div class="cmp-note">${esc(a.rights)}${a.assisted?' · AI-assisted':''}</div><div class="enp">${esc(a.text).replace(/\n/g,'<br>')}</div>`+
              (references.length?`<div class="cmp-note">Passage references (T1 hashes are recorded; verify the pinned source and the argument):</div>${references.map(c=>{
                const current=`?work=${encodeURIComponent(c.work)}&view=scholar&layer=t1&target=${encodeURIComponent(c.target)}`;
                const song=c.target.replace(/-v\d+$/,'');
                const pinned=commit?`https://github.com/prx0r/translation-work/blob/${commit}/${encodeURIComponent(c.work)}/data/${encodeURIComponent(song)}.t1.json`:'';
                return `<div class="cmp-note">${esc(c.work)} · ${esc(c.target)} · T1 ${esc((c.t1_sha256||'').slice(0,12))} · <a href="${esc(current)}">open current</a>${pinned?` · <a href="${esc(pinned)}" target="_blank" rel="noopener">view pinned Git source</a>`:''}</div>`;
              }).join('')}`:'')+`</details>`;
          }).join('')
            : `<div class="milestone">No published essays for this work yet.</div>`)
      + W('schsign','Sign-offs',
          ((SCH.signoffs||[]).length
            ? `<table class="wtable">` + SCH.signoffs.map(s=>
                `<tr><td>${esc(s.song)}</td><td>${esc(s.accepted_by)} · ${esc(s.date)} · ${esc(s.scope)}<div class="cmp-note">${esc((s.stack_sha||'').slice(0,12))} · ${esc(s.review_id||'')}</div></td></tr>`).join('') + `</table>`
            : `<div class="milestone">no sign-offs yet.</div>`))
      + W('schlayers','Layers',
          SLAY_ORDER.map(l=>{
            const n = Object.keys(SCH.originals[l]||{}).length;
            const on = l===st.layer;
            return `<div><a href="#" class="schlay" data-l="${l}"${on?' style="font-weight:700;color:#B45141"':''}>${SLAY[l].label}</a> <span class="cmp-note">${n} ${l==='c1'||l==='c2'?'songs':'verses'}</span></div>`;
          }).join('') + `<div class="cmp-note">${esc(SLAY[st.layer].desc)}</div>`)
      + W('schtgt','Passages',
          `<div class="wsearch"><input id="schq" placeholder="filter §…" aria-label="filter passages"/><button id="schqgo">go</button></div>
           <div class="vref-list" id="schtgtlist">` +
          tgtIds.map(t=>`<a href="#" class="schtgt" data-t="${esc(t)}"${t===st.target?' style="font-weight:700;color:#B45141"':''}>${esc(t.replace(/^[a-z0-9]+-/,'').replace('-v',' §'))}</a>`).join('') +
          `</div>`)
      + W('schbase','Base for your edit',
          `<div class="vref-list">` + basesList().map(b=>
            `<a href="#" class="schbase2" data-vid="${b.id?esc(b.id):''}"${(st.base||'')===(b.id||'')?' style="font-weight:700;color:#B45141"':''}>${esc(b.name)}</a>`).join('') + `</div>`)
      + W('schmine','My versions (this device)',
          `<div class="c2row"><input id="schauthor" placeholder="your name (for versions)" value="${esc(schAuthor())}"/><button class="c2btn" id="schauthorok">set</button></div>`
          + `<div class="cmp-note">edits save here first (◇ = device-local). Export JSON for import into the shared ledger — a fork of whichever base you chose.</div>`
          + `<table class="wtable">` + schDrafts().filter(v=>v.layer===st.layer).slice(-8).reverse().map(v=>
              `<tr><td>${esc(v.target.replace(/^[a-z0-9]+-/,'').replace('-v',' §'))}</td><td>${esc(v.author)}<div class="cmp-note">parent: ${esc((v.parent||'original').slice(0,20))}</div></td></tr>`).join('') + `</table>`);
    // bindings
    $('#lib').querySelectorAll('.schlay').forEach(a=>{
      a.onclick = e=>{
        e.preventDefault();
        st.layer = a.getAttribute('data-l');
        const t = schVsort(Object.keys(SCH.originals[st.layer]||{}));
        st.target = t.includes(st.target) ? st.target : (t[0]||null);
        st.base = null; persist(); renderLib(); renderCols();
      };
    });
    $('#lib').querySelectorAll('.schtgt').forEach(a=>{
      a.onclick = e=>{
        e.preventDefault();
        st.target = a.getAttribute('data-t'); st.base = null;
        persist(); renderLib(); renderCols();
      };
    });
    $('#lib').querySelectorAll('.schbase2').forEach(a=>{
      a.onclick = e=>{
        e.preventDefault();
        st.base = a.getAttribute('data-vid') || null;
        renderLib(); renderCols();
      };
    });
    const q = $('#schq');
    if(q){
      const filt = ()=>{
        const v = norm(q.value||'');
        $('#schtgtlist').querySelectorAll('a').forEach(a=>{
          a.style.display = (!v || norm(a.textContent).includes(v)) ? '' : 'none';
        });
      };
      q.oninput = filt;
      $('#schqgo').onclick = filt;
      q.addEventListener('keydown', e=>{ if(e.key==='Enter') filt(); });
    }
    const sok = $('#schauthorok');
    if(sok) sok.onclick = ()=>{ try{ localStorage.setItem('svv-scholar-author', $('#schauthor').value.trim()); }catch(e){} renderLib(); };
    const sgo = $('#schgo');
    if(sgo) sgo.onclick = async ()=>{
      const msg = $('#schauthmsg');
      try{
        const r = await fetch(API + '/api/auth/access', {method:'POST', credentials:'include',
          headers:{'Content-Type':'application/json'},
          body: JSON.stringify({email: $('#schemail').value.trim(), name: $('#schname').value.trim(), password: $('#schpw').value})});
        const d = await r.json();
        if(!r.ok) throw new Error(d.error || ('http '+r.status));
        SCHPROF = d.profile;
        try{ localStorage.setItem('svv-scholar-author', d.display_name || d.profile.display_name || ''); }catch(e){}
        if(workspace)await workspace.load();
        renderLib(); renderCols();
      }catch(e){ if(msg) msg.textContent = String(e.message||e).slice(0,90); }
    };
    const sout = $('#schout');
    if(sout) sout.onclick = async ()=>{
      try{ await fetch(API + '/api/auth/logout', {method:'POST', credentials:'include'}); }catch(e){}
      SCHPROF = null; if(workspace)await workspace.load(); renderLib(); renderCols();
    };
    $('#lib').querySelectorAll('.widget h2').forEach(h=>{ h.onclick = ()=>h.parentElement.classList.toggle('closed'); });
  }

  renderLib();
  renderCols();
}

/* Sanskrit hub (?view=sanskrit) — Learn Sanskrit lessons, verbatim imports.
   data/sanskrit/site/*.html via tools/emit_sanskrit.py (bookfactory source;
   only change: Google Fonts -> vendored local @font-face). Lessons render
   in an auto-sized same-origin iframe so design, tabs and tables stay
   exactly as authored. svread chrome (header + chat rail) stays outside.
   Chat follows ?work= (lesson links carry it); the Ask button prefills the
   rail with the current lesson. Recitation: the lessons' own guides +
   reader links where audio exists. */
let SK_LESSON = null;
function skAskPrefill(){
  const inp = document.querySelector('#qin');
  if(inp && SK_LESSON){
    inp.value = `In "${SK_LESSON.title}" (${SK_LESSON.source_ref}): explain the grammar of this verse`;
    inp.focus();
  }
  const rail = document.querySelector('#wid-chat');
  if(rail){ rail.classList.remove('closed'); rail.scrollIntoView({block:'nearest'}); }
}
function skSyncFromFrame(frame){
  let href = '';
  try{ href = frame.contentWindow.location.href; }catch(e){ return; }
  const m = /lesson-(\d+)\.html/.exec(href);
  if(!m) return;
  fetch('data/sanskrit/index.json').then(r=>r.json()).then(idx=>{
    const n = +m[1], entry = (idx.lessons||[]).find(l=>l.n===n);
    if(!entry || (SK_LESSON && SK_LESSON.id===entry.id)) return;
    SK_LESSON = entry;
    const bar = document.querySelector('#sk-cur');
    if(bar) bar.innerHTML = `Now viewing: <b>${esc(entry.title)}</b> <span class="mut">${esc(entry.source_ref||'')}</span>`;
    document.title = `${entry.title} · Sanskrit`;
  }).catch(()=>{});
}
function skAutosize(frame){
  try{
    const doc = frame.contentDocument;
    if(!doc || !doc.body) return;
    const h = Math.max(doc.body.scrollHeight, 600);
    frame.style.height = Math.min(h + 40, 6000) + 'px';
  }catch(e){}
}
async function sanskritView(){
  if(typeof DATA !== 'undefined' && !DATA) DATA = {verses:[]};
  try{ buildRightRail([]); }catch(e){}
  const hb = document.querySelector('#headbar'); if(hb) hb.style.display = 'none';
  const idx = await get('data/sanskrit/index.json');
  const rules = await get('data/sanskrit/rule-boxes.json').catch(()=>({rule_boxes:[]}));
  const main = document.querySelector('.reader-main');
  const lid = qs.get('lesson');
  if(!lid){
    const byStage = {};
    (idx.lessons||[]).forEach(l=>{ (byStage[l.section]=byStage[l.section]||[]).push(l); });
    const STAGE_T = s=>({'stage-1-sounds':'Stage 1 \u00b7 Sounds','stage-2-language':'Stage 2 \u00b7 Language','stage-3-instructions':'Stage 3 \u00b7 Instructions','stage-4-trika-grammar':'Stage 4 \u00b7 Trika grammar','stage-5-original':'Stage 5 \u00b7 Originals'}[s]||s);
    main.innerHTML = `<h1>${esc(idx.title||'Learn Sanskrit')}</h1>`
      + `<p class="mut">${esc(idx.subtitle||'')}</p>`
      + Object.keys(byStage).map(s=>`<h2>${esc(STAGE_T(s))}</h2>`
        + byStage[s].map(l=>`<div style="margin:.4rem 0"><a href="?view=sanskrit&work=${encodeURIComponent(l.work)}&lesson=${encodeURIComponent(l.id)}"><b>${esc(l.title)}</b></a> <span class="mut">${esc(l.source_ref||'')}</span>${l.has_reader?'':' <span class="mut">(reader forthcoming)</span>'}</div>`).join('')).join('')
      + `<h2>Rule boxes</h2>` + (rules.rule_boxes||[]).map(r=>`<div class="sk-rulebox"><div class="sk-rb-t">${esc(r.title)}</div><div>${esc(r.body)}</div></div>`).join('')
      + `<p><a href="?view=biblio">Browse the full bibliography</a> \u2014 every work, edition, translation with links, lost works with their basis, formal coverage, essays.</p>`
      + `<p class="mut">Lessons: bookfactory prints/learn-sanskrit, imported verbatim (see data/sanskrit/provenance.json).</p>`;
    document.title = 'Sanskrit \u00b7 svread';
    SK_LESSON = null;

    return;
  }
  const entry = (idx.lessons||[]).find(l=>l.id===lid);
  if(!entry) throw new Error('unknown lesson');
  SK_LESSON = entry;
  const work = entry.work || qs.get('work') || 'bhairavastava';
  const readerLinks = entry.has_reader
    ? `<a href="?work=${encodeURIComponent(work)}">Open ${esc(work)} in the reader</a> \u00b7 <a href="?work=${encodeURIComponent(work)}&view=scholar">Scholar</a>`
    : `<span class="mut">Reader forthcoming for ${esc(work)} \u2014 the lesson below is complete as written.</span>`;
  main.innerHTML = `<p><a href="?view=sanskrit">\u2190 all lessons</a></p>`
    + `<h1>${esc(entry.title)}</h1>`
    + `<p class="mut">${esc(entry.source_ref||'')} \u00b7 ${readerLinks}</p>`
    + `<p id="sk-cur" class="mut"></p>`
    + `<p><button class="c2btn" id="sk-ask">Ask the chat about this verse</button> `
    + `<span class="mut">chat answers from ${esc(work)} with receipts.</span></p>`
    + `<iframe id="sk-frame" title="${esc(entry.title)}" src="data/sanskrit/${esc(entry.html)}" style="width:100%;border:1px solid var(--g200);border-radius:6px;min-height:600px;background:#fff"></iframe>`
    + `<p class="mut">Lesson design: bookfactory Learn Sanskrit (imported verbatim). Recitation guide is inside the lesson; audio renders with owner go.</p>`;
  document.title = `${entry.title} \u00b7 Sanskrit`;
  const frame = document.querySelector('#sk-frame');
  const ask = document.querySelector('#sk-ask');
  if(ask) ask.onclick = skAskPrefill;
  if(frame){
    frame.addEventListener('load', ()=>{
      try{ window.__skFrameReady = true; }catch(e){}
      skAutosize(frame);
      skSyncFromFrame(frame);
      try{
        const doc = frame.contentDocument;
        if(doc) doc.querySelectorAll('[data-d]').forEach(el=>el.addEventListener('click', ()=>setTimeout(()=>skAutosize(frame), 60)));
      }catch(e){}
    });
  }
}

/* Bibliography (?view=biblio) — a view on the openpatala box DB.
   data/biblio.json via tools/emit_biblio.py (works, editions, translations
   with links, ours status, formal chunks, essays). No header tab: linked
   from the Sanskrit view + direct URL. */
async function biblioView(){
  const B = await get('data/biblio.json');
  const people = B.people || {};
  const nameOf = id => people[id] || id.replace(/^person:/,'').replace(/-/g,' ');
  const byName = t => (t.by||[]).map(nameOf).join(', ');
  const tRow = w => {
    const trs = (w.translations||[]).map(t=>{
      const links = (t.links||[]).map(u=>` <a href="${esc(u)}" target="_blank" rel="noopener">[source]</a>`).join('');
      return `<div>${esc(t.lang||'')} · ${esc(byName(t))} · ${esc(t.completeness||'')}${links}</div>`;
    }).join('') || '<span class="mut">—</span>';
    const eds = (w.editions||[]).map(e=>esc(e.title||e.id)).join('; ') || '—';
    const formal = (w.formalized==null ? '—' : `${w.formalized}/${w.passages} passages`);
    const sch = w.has_projection ? `<a href="?work=${encodeURIComponent(w.id)}&view=scholar">${w.essays} essays</a>` : '—';
    const reader = w.passages>0 ? `<a href="?work=${encodeURIComponent(w.id)}">reader</a>` : '<span class="mut">no passages</span>';
    return `<tr data-id="${esc(w.id)}" data-title="${esc((w.title||'')+' '+w.id+' '+(w.author||''))}" data-kind="${w.status?'lost':(w.translations&&w.translations.length?'trans':'none')}${w.essays?' essays':''}${w.formalized!=null?' formal':''}">`
      + `<td><b>${esc(w.title||w.id)}</b><div class="mut">${esc(w.id)}${w.author?` · ${esc(w.author)}`:''}</div></td>`
      + `<td>${w.status?`<span class="sk-badge">${esc(w.status.split(':')[0])}</span>`:'—'}<div class="mut">${w.status?esc(w.status.slice(0,120)):''}</div></td>`
      + `<td>${w.passages} · ${reader}</td><td>${esc(eds.slice(0,160))}</td><td>${trs}</td>`
      + `<td>${formal}</td><td>${sch}</td></tr>`;
  };
  const lost = B.works.filter(w=>w.status);
  const main = $('.reader-main');
  main.innerHTML = `<h1>Bibliography</h1>`
    + `<p class="mut">A view on the openpatala box DB (ground layer): ${B.counts.works} works · `
    + `${B.counts.lost_or_unverified} lost or unverified · ${B.counts.ours_translations} ours translations. `
    + `Hash-pinned at release (see data/biblio.json provenance). STATUS=reported rows are scholar-reported, not witness claims.</p>`
    + `<p><input id="bibq" placeholder="filter: title, work id, author…" style="width:min(32rem,90%)"> `
    + `<select id="bibf"><option value="">all</option><option value="lost">lost / unverified</option>`
    + `<option value="trans">has translations</option><option value="essays">has essays</option><option value="formal">formalized</option></select></p>`
    + `<table class="sk-table"><thead><tr><th>Work</th><th>Status</th><th>Passages</th><th>Editions</th><th>Translations</th><th>Formal</th><th>Essays</th></tr></thead>`
    + `<tbody id="bibbody">${B.works.map(tRow).join('')}</tbody></table>`
    + `<p class="mut">Lost &amp; unverified (${lost.length}): ${lost.map(w=>esc(w.title||w.id)).join(' · ')}</p>`;
  document.title = 'Bibliography · svread';
  const filt = ()=>{
    const q = ($('#bibq').value||'').toLowerCase(), f = $('#bibf').value;
    main.querySelectorAll('#bibbody tr').forEach(tr=>{
      const okQ = !q || (tr.getAttribute('data-title')||'').toLowerCase().includes(q);
      const okF = !f || (tr.getAttribute('data-kind')||'').includes(f);
      tr.style.display = (okQ&&okF) ? '' : 'none';
    });
  };
  $('#bibq').addEventListener('input', filt);
  $('#bibf').addEventListener('change', filt);
}

async function main(){
  const ns = $('#navscholar');
  if(ns) ns.onclick = e=>{ e.preventDefault(); location.href = `?work=${encodeURIComponent(WORK)}&view=scholar`; };
  const nsk = $('#navsanskrit');
  if(nsk) nsk.onclick = e=>{ e.preventDefault(); location.href = `?work=${encodeURIComponent(WORK)}&view=sanskrit`; };
  if(qs.get('view')==='sanskrit'){
    try{ await sanskritView(); }
    catch(err){ $('.reader-main').innerHTML = `<p id="err">Sanskrit view: ${esc(String(err&&err.message||err))}</p>`; }
    return;
  }
  if(qs.get('view')==='biblio'){
    try{ await biblioView(); }
    catch(err){ $('.reader-main').innerHTML = `<p id="err">Bibliography view: ${esc(String(err&&err.message||err))}</p>`; }
    return;
  }
  if(qs.get('view')==='scholar'){
    if(WORK==='ghatakarpara'){
      $('.reader-main').innerHTML = `<p id="err">Ghaṭakarpara Scholar data is withheld while incomplete source passages and their dependent translations are rechecked. <a href="${GHATA_SOURCE}" target="_blank" rel="noopener">Open the source edition</a>.</p>`;
      return;
    }
    try{ await scholarView(); }
    catch(err){ $('.reader-main').innerHTML = `<p id="err">Scholar view: ${esc(String(err&&err.message||err))}</p>`; }
    return;
  }
  let D = null;
  /* canonical-first: ipvv layers JSONs are the backend source of truth.
     Vendored data/ copy is the offline fallback, not the authority. */
  for(const u of (SRC ? [SRC] : [`${IPVV}/data/layers/${WORK}.json`, `${IPVV}/data/translations/${WORK}.json`, `data/${WORK}.json`])){
    try{
      const loaded=await getReaderData(u);D=loaded.data;
      const rows=Array.isArray(D?.verses)?D.verses:Array.isArray(D?.chunks)?D.chunks:null;
      if(rows?.length&&rows.every(validReaderRow)){
        DATA_SOURCE={kind:SRC?'Custom source':u.startsWith(IPVV)?'Live ipvv data (mutable)':'Bundled snapshot',sha256:loaded.sha256};
        if(!SRC&&!u.startsWith(IPVV)){
          try{const manifest=await get('data/release-manifest.json'),expected=manifest?.assets?.[`data/${WORK}.json`];
            DATA_SOURCE.manifest=expected&&loaded.sha256?(expected===loaded.sha256?'matches bundled manifest':'does not match bundled manifest'):'manifest unavailable';}
          catch{DATA_SOURCE.manifest='manifest unavailable';}
        }
        break;
      }
      D=null;
    }catch(e){ D = null; }
  }
  // last resort: Sanskrit root via works-index (Sanskrit always, English never)
  if(!D){
    try{
      const idx = await get('data/works-index.json');
      const rec = Object.values(idx||{}).find(r=>(r.translation===WORK||r.work===WORK) && r.sanskrit);
      if(rec){
        const raw = await get(`${IPVV}/data/sanskrit/${rec.sanskrit}`);
        if(typeof raw==='string'&&!/^\s*(?:<!doctype\s+html|<html\b)/i.test(raw)){
          const paras = raw.split(/\n{2,}|\n(?=[\u0900-\u097F])/).map(p=>p.trim()).filter(p=>p);
          D = {title: rec.title||WORK, master: rec.author||'', source:`ipvv/data/sanskrit/${rec.sanskrit}`,
            verses: paras.map((p,i)=>({id:`${WORK}-s${i+1}`, sa:p, l1:'', l2:'', c1:'', argmap:'', gate:'WITHHELD'}))};
          DATA_SOURCE={kind:'Live Sanskrit source fallback (unversioned)',sha256:''};
        }
      }
    }catch(e){}
  }
  let verses = D && (D.verses || (D.chunks||[]).map(c=>({
    id:c.chunk, sa:c.sanskrit, l1:c.l1, l2:c.l2, l3:c.l3, l4:c.l4, c1:c.c1, argmap:c.argmap,
    gate:c.gate, model:c.model||'', date:c.date||'' })));
  if(!verses || !verses.length){
    $('.reader-main').innerHTML = `<p id="err">Nothing on file for “${esc(WORK)}” yet.</p>`;
    return;
  }
  if(WORK==='ghatakarpara'){
    const pinned=await pinnedGhatakarpara();
    verses=verses.map(v=>{
      const match=String(v.id||v.chunk||'').match(/-v(\d+)$/),full=match&&pinned?.get(Number(match[1]));
      return {...v,sa:full||v.sa||v.sanskrit||'',gate:'WITHHELD',source_complete:!!full,source_issue:full
        ?'Sanskrit restored from the pinned source. English is withheld until translation coverage is rechecked.'
        :'This Sanskrit display is incomplete. Open the source edition; English is withheld until coverage is rechecked.'};
    });
    if(pinned&&DATA_SOURCE)DATA_SOURCE.sourceSha=GHATA_SOURCE_SHA256;
  }
  verses=verses.map(safeReaderVerse);
  DATA = {title:(D.title||WORK), master:(D.master||''), source_edition:(D.source_edition||''),
    source:typeof D.source==='string'?D.source:'', verses};
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
  const title = DATA.title, master = DATA.master;
  document.title = `${title} · svread`;
  $('#wh1').textContent = title;   // canonical heading: TITLE ONLY, all texts (stats live in the rail)

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
                     .filter(w=>!/^[\u0964\u0965.,|;:]+$/.test(w)); // punctuation is not a timed word
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
  // Existing alignments were created against the partial source display.
  if(WORK==='ghatakarpara'){KAR=null;ART=null;ART_CLIPS={};ART_REL={};}

  await loadMorph();
  await loadL0();
  await loadProbes();
  if(qs.get('left')==='l0' && L0) LEFT = 'l0';
  if(qs.get('right')==='l0' && L0) RIGHT = 'l0';
  /* L3 is the one translation to look at: default to it wherever it exists
     (no URL param and no stored preference — explicit choices always win) */
  try{
    if(!qs.get('right') && !localStorage.getItem('svv-right')){
      if((DATA.verses||[]).some(v=>v.l4)) RIGHT = 'l4';          /* Svatantrya (L4) is the canonical one to look at */
      else if((DATA.verses||[]).some(v=>v.l3)) RIGHT = 'l3';
    }
  }catch(e){}
  /* literal lane falls back to the close translation where no word-gloss is on file */
  if(LEFT==='l0' && !LIDS.includes('l0')) LEFT = 'l1';
  if(RIGHT==='l0' && !RIDS.includes('l0')) RIGHT = 'l1';
  renderCol('L', LEFT); renderCol('R', RIGHT);
  /* paired layout: one grid owns both columns — rows auto-size to the taller
     cell, so § markers align exactly (replaces the old height-floor JS) */
  try{
    const cols = $('#cols');
    cols.classList.add('paired');
    cols.style.gridTemplateRows = 'repeat(' + (verses.length + 1) + ',auto)'; // +1 = verbar row
  }catch(e){}
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
  get('data/styles.json').then(a=>{ if(Array.isArray(a)) window.SVSTYLES = a; }).catch(()=>{});
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
  /* queued C2 pick from the Style dropdown: auto-render for the current verse */
  try{
    const pend = JSON.parse(sessionStorage.getItem('svv-c2pending') || 'null');
    if(pend && RIGHT === 'mine'){
      sessionStorage.removeItem('svv-c2pending');
      const v = (DATA.verses || [])[pend.ix || 0];
      if(v){
        const inp = document.getElementById('c2in-' + v.id);
        if(inp){
          inp.value = String(pend.style || '').slice(0, 60);
          const el = document.querySelector(`.verse[data-i="${pend.ix || 0}"]`);
          if(el) el.scrollIntoView({block:'center'});
          /* STORED approved render first (ipvv/data/c2/<work>.<style>.json,
             tools/emit_c2.py — prompt-reproducible, proof-gated); live render
             only when no stored render covers this song/verse */
          const songOf = ((v.id || '').match(/^(.*)-v\d+$/) || [])[1] || v.id;
          const raw = String(pend.style || '').trim();
          const cands = [raw.replace(/\s+/g, ''), raw.replace(/\s+/g, '-'), raw];
          const tryStored = i => i >= cands.length ? Promise.resolve(null)
            : get(`${IPVV}/data/c2/${WORK}.${cands[i]}.json`).then(d=>{
                if(!d || !d.items) return tryStored(i + 1);
                const it = d.items.find(x => x.chunk === songOf) || d.items.find(x => x.chunk === v.id);
                if(!it) return tryStored(i + 1);
                const txt = (it.paragraphs && it.paragraphs.length)
                  ? it.paragraphs.map(pp => pp.text).join('\n\n') : (it.c2 || '');
                return txt ? {txt, prov: it, style: cands[i]} : tryStored(i + 1);
              }).catch(()=>tryStored(i + 1));
          tryStored(0).then(hit=>{
            const out = document.getElementById('c2out-' + v.id);
            if(hit && out){
              out.innerHTML = `<div class="enp c2txt">${esc(hit.txt)}</div>`
                + `<div class="c2meta">stored render · ${esc(hit.style)} · ${esc(String(hit.prov.model||'').slice(0,64))} · proof ${esc(hit.prov.gate||'')}</div>`
                + `<button class="c2save" data-ch="${esc(v.id)}">Save as mine →</button>`;
              const sv = out.querySelector('.c2save');
              if(sv) sv.onclick = ev=>{ setVar(ev.target.getAttribute('data-ch'), hit.txt); location.reload(); };
              return;
            }
            const b = document.querySelector(`.c2btn[data-ch="${v.id}"]`);
            if(b) b.click();                              // no stored → live render
          });
        }
      }
    }
  }catch(e){}
  document.querySelectorAll('#textL .w, #textR .w').forEach(w=>{
    w.onclick = ()=>askWord(w);
  });
  // § = play from this verse (Sanskrit on the Sanskrit column, English on English columns)
  const langOfLane = lane => (lane==='sa-deva'||lane==='sa-iast') ? 'sa'
    : lane==='c1' ? 'c1'
    : (lane==='l1'||lane==='l2'||lane==='l3'||lane==='l4') ? 'en' : null;
  document.querySelectorAll('a.vref').forEach(a=>{
    a.onclick = e=>{
      e.preventDefault();
      const i = +a.getAttribute('data-i'); CURIX = i;
      const lane = a.closest('#colL') ? LEFT : RIGHT;
      const lang = langOfLane(lane);
      if(lang) splayToggle(lang, i); else reciteVerse(i);
    };
  });
  // gutter prev/next verse
  let cur = CURIX;
  const goVerse = d=>{
    cur = Math.min(verses.length-1, Math.max(0, cur+d));
    CURIX = cur;
    const el = document.querySelector(`.verse[data-i="${cur}"]`);
    if(el) el.scrollIntoView({block:'center', behavior:'smooth'});
  };
  $('#pgleft a').onclick = e=>{ e.preventDefault(); goVerse(-1); };
  $('#pgright a').onclick = e=>{ e.preventDefault(); goVerse(1); };
  const nse = $('#navsearch'); if(nse) nse.onclick = e=>{ e.preventDefault(); const w = document.querySelector('#lib #wq'); if(w){ w.focus(); w.scrollIntoView({block:'center'}); } };
  // rail collapse arrows (Scaife) + drag-to-resize (widths persist; drag past
  // 60px collapses, drag back restores — see installResize)
  const lay = document.querySelector('.layout');
  installResize(lay);

  window.scrollTo(0,0);
}
async function buildLeftRail(verses, LIBDATA){
  // LEFT RAIL — Scaife order: id, verses, library, reference, search, attributions, proof, export
  try{
    const lib = LIBDATA || (await get('data/library.json')) || [];
    const urn = `urn:svread:${WORK}`;
    const libAside = $('#lib');
    libAside.innerHTML =
      W('workid','Work ID', (DATA.source_edition
          ? `<div class="urn">${esc(DATA.source_edition)}</div><div class="cmp-note">${esc(urn)}</div>`
          : `<div class="urn">${esc(urn)}</div>`))
      + (WORK==='ghatakarpara'?W('sourcehold','Source notice',`<div class="cmp-note">The translation was produced from incomplete passages and is withheld for rechecking. <a class="redlink" href="${GHATA_SOURCE}" target="_blank" rel="noopener">Open the full GRETIL source</a> · Parlier edition, CC BY-NC-SA 4.0.</div>`):'')
      + W('verses','Verses', `<a href="#" id="vcount" style="color:#B45141">${verses.length}</a>`)
      + W('library','Library', `<div id="liblist">${libraryHtml(lib)}</div>`)
      + W('ref','Passage Reference', `<div class="wsearch"><input id="wjump" placeholder="§ number…" inputmode="numeric"/><button id="wgo2">go</button></div><div class="vref-list" style="margin-top:.4rem">${verses.map((v,i)=>`<a href="#v${i}" data-i="${i}">§${i+1}</a>`).join('')}</div>`)
      + W('search','Text Search', `<div class="wsearch"><input id="wq" placeholder="find in this work…"/><button id="wgo">go</button></div><div style="margin:.3rem 0;font-size:13px"><label><input type="radio" name="smode" value="form" checked/> Form</label> <label style="margin-left:.6rem"><input type="radio" name="smode" value="lemma"/> Lemma</label></div><div class="cmp-note">Use text input above to find text in this version.</div><div id="wres" style="margin-top:.4rem"></div>`)
      + W('attr','Attributions', `<table class="wtable">`
        + `<tr><td>work</td><td>${esc(DATA.title)}</td></tr>`
        + `<tr><td>source</td><td>${esc(DATA.source_edition || 'Edition not recorded for this display.')}</td></tr>`
        + (DATA.source?`<tr><td>source file</td><td>${esc(DATA.source)}</td></tr>`:'')
        + (DATA_SOURCE?`<tr><td>data</td><td>${esc(DATA_SOURCE.kind)}${DATA_SOURCE.sha256?` · SHA-256 <span title="${esc(DATA_SOURCE.sha256)}">${esc(DATA_SOURCE.sha256.slice(0,16))}</span>`:' · fingerprint unavailable'}${DATA_SOURCE.manifest?` · ${esc(DATA_SOURCE.manifest)}`:''}</td></tr>`:'')
        + (DATA_SOURCE?.sourceSha?`<tr><td>pinned source</td><td><span title="${esc(DATA_SOURCE.sourceSha)}">SHA-256 ${esc(DATA_SOURCE.sourceSha.slice(0,16))}</span></td></tr>`:'')
        + `<tr><td>translation</td><td><b>FREE</b> — our English (L1–L4, commentary) is free use. Scholar edits &amp; words: © their authors, all rights reserved.</td></tr>`
        + `<tr><td>editions</td><td>Svatantrya (L4) · Final · Literal gloss · English translation · Commentary — pipeline, machine-proposed, needs human review</td></tr>`
        + `<tr><td>gate</td><td>${verses.filter(v=>v.gate==='PASS').length}/${verses.length} passages passed</td></tr>`
        + (PROOF ? `<tr><td>proof</td><td>${Object.values(PROOF).filter(p=>p.gate==='PASS').length}/${Object.keys(PROOF).length} proved 5/5 · deterministic gate, no model</td></tr>` : '')
        + `<tr><td>repository</td><td>prx0r/svread · data: prx0r/ipvv layers</td></tr></table>`)
      + (PROOF ? W('proof','Proof Queue', proofQueueHtml()) : '')
      + (PROBES && PROBES.length ? W('probes','Hard Questions', probesHtml() + (PROBES_SOURCE ? `<div class="cmp-note" style="margin-top:.4rem"><a class="redlink" href="${esc(PROBES_SOURCE)}" target="_blank" rel="noopener">full hound transcripts →</a></div>` : '')) : '')
      + W('export','Export Passage', `<a class="redlink" href="#" id="exp-t">as text</a> or <a class="redlink" href="#" id="exp-j">as json</a>`)
      + W('issue','Report an Issue', `<a class="redlink" href="https://github.com/prx0r/svread/issues/new" target="_blank" rel="noopener">open a GitHub issue</a>`);
    bindProbes();
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

/* drag-to-resize: gutters #pgleft (master list) / #pgright (chat rail).
   Drag = resize; past 60px = collapse; widths + collapse persist per device.
   The gutter's own arrow clicks (verse nav) are swallowed after a real drag. */
function installResize(lay){
  const lib = document.querySelector('#lib'), rail = document.querySelector('.rail');
  const MIN = 60;
  const save = (k,v)=>{ try{ localStorage.setItem(k, v); }catch(e){} };
  const load = k=>{ try{ return localStorage.getItem(k); }catch(e){ return null; } };
  const setHide = (which, hide)=>{
    const c = which==='L' ? 'hideL' : 'hideR';
    if(hide) lay.classList.add(c); else lay.classList.remove(c);
    save('svv-hide'+which, hide ? '1' : '0');
  };
  const toggle = which=> setHide(which, !lay.classList.contains(which==='L'?'hideL':'hideR'));
  const tl = document.querySelector('#tabL a'), tr = document.querySelector('#tabR a');
  if(tl) tl.onclick = e=>{ e.preventDefault(); toggle('L'); };
  if(tr) tr.onclick = e=>{ e.preventDefault(); toggle('R'); };
  const w0 = load('svv-libw'), r0 = load('svv-railw');
  if(w0 && lib) lib.style.flex = '0 0 ' + w0;
  if(r0 && rail) rail.style.flex = '0 0 ' + r0;
  if(load('svv-hideL')==='1') lay.classList.add('hideL');
  if(load('svv-hideR')==='1') lay.classList.add('hideR');
  const drag = (el, gutter, cfg, side)=>{
    if(!el || !gutter) return;
    let startX=0, startW=0, active=false, moved=false;
    /* two handles: the gutter AND the panel's inner edge (chat window's left
       edge / master menu's right edge — the slider the owner asked for) */
    const edgeOK = e=>{
      const r = el.getBoundingClientRect();
      return side==='left' ? (r.right - e.clientX) <= 7 : (e.clientX - r.left) <= 7;
    };
    const down = (e, cap)=>{
      if(e.button!==0) return;
      active=true; moved=false; startX=e.clientX; startW=cfg.get();
      try{ cap.setPointerCapture(e.pointerId); }catch(err){}
      lay.classList.add('dragging'); e.preventDefault();
    };
    const move = e=>{
      if(!active) return;
      const dx = e.clientX - startX;
      if(Math.abs(dx)>4) moved=true;
      const w = side==='left' ? startW+dx : startW-dx;
      if(w >= MIN) setHide(cfg.which, false);
      cfg.set(w);
    };
    const end = ()=>{
      if(!active) return;
      active=false;
      lay.classList.remove('dragging');
      if(moved){
        const kill = ev=>{ ev.stopPropagation(); ev.preventDefault();
          gutter.removeEventListener('click', kill, true); };
        gutter.addEventListener('click', kill, true);
        setTimeout(()=>gutter.removeEventListener('click', kill, true), 300);
      }
      const w = cfg.get();
      if(w < MIN){ setHide(cfg.which, true); cfg.set(0); }
      else { setHide(cfg.which, false); save(cfg.key, Math.round(w)+'px'); }
    };
    gutter.addEventListener('pointerdown', e=>down(e, gutter));
    gutter.addEventListener('pointermove', move);
    gutter.addEventListener('pointerup', end);
    gutter.addEventListener('pointercancel', end);
    el.addEventListener('pointerdown', e=>{ if(edgeOK(e)) down(e, gutter); });
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
  };
  /* LEFT menu: NO slider (owner) — #pgleft stays pure verse-nav; the tab arrow
     still collapses it. Only the chat side resizes. */
  const lw = load('svv-libw'); if(lw && lib) lib.style.flex = '0 0 ' + lw;
  drag(rail, document.querySelector('#pgright'), {which:'R', key:'svv-railw',
    get:()=>parseFloat(getComputedStyle(rail).width)||360,
    set:w=>{ rail.style.flex='0 0 '+Math.max(Math.round(w),0)+'px'; }}, 'right');
}

/* c1sum — standardized chat intro: first C1 SUMMARY clamped to chat length */
function c1sumLine(){
  const vs = (DATA && DATA.verses) || [];
  const v = vs.find(x=>isReaderPass(x)&&x.c1) || null;
  if(!v) return '';
  const raw = (v.c1 || '').replace(/^##\s+[^\n]*\n/, '');
  const m = raw.match(/\*\*SUMMARY\.\*\*\s*([\s\S]*?)(\n\n|\n\*Rasa|$)/);
  let t = (m ? m[1] : cleanEN(raw)).replace(/\s+/g, ' ').trim();
  if(t.length > 300){
    const cut = t.slice(0, 300);
    const dot = cut.lastIndexOf('. ');
    t = (dot > 120 ? cut.slice(0, dot + 1) : cut.trimEnd() + '…');
  }
  return t;
}
function renderCol(side, vid){
  const labelEl = $(side==='L' ? '#verlabelL' : '#verlabelR');
  const menuEl = $(side==='L' ? '#vermenuL' : '#vermenuR');
  const textEl = $(side==='L' ? '#textL' : '#textR');
  const ids = side==='L' ? LIDS : RIDS;
  const v0 = DATA.verses[0];
  const d = VDEF[vid]({title:DATA.title});
  labelEl.innerHTML = vid==='none' ? '' : `<div class="vlab" style="font-weight:700">${esc(d.label)}</div><div class="vdesc">${esc(d.desc)}</div><div class="vmeta">${esc(d.meta)}</div>`;
   /* grouped picker: Translations header with narrow bars (Final · Literal · Plain · Commentary),
      then Sanskrit, then Yours. Version ids unchanged — old links keep working. */
  /* Translations bars: Final (l3, the one translation) · Literal (word-gloss l0 where on file, else close l1) · Plain (l2) · Commentary (c1). Lane ids unchanged — old links keep working. */
  const TBARS = [...((DATA.verses||[]).some(v=>v.l4) ? ['l4'] : []), 'l3', ...(LIDS.includes('l0') ? ['l0'] : ['l1']), 'l2','c1'];
  const GROUPS=[['Translations',TBARS,'bars'],['Sanskrit',['sa-deva','sa-iast'],'list'],['Yours',['mine','none'],'list']];
  const inIds=id=>ids.includes(id);
  const item=id=>{
    const dd = VDEF[id]({title:DATA.title});
    const mark = id===vid ? `<span class="side">${side}</span>` : `<span class="side">&nbsp;</span>`;
    return `<a class="dropdown-item" href="#" data-col="${side}" data-v="${id}">${mark}<div><div class="label">${esc(dd.label)}</div><div class="description">${esc(dd.desc)}</div><div class="metadata">${esc(dd.meta)}</div></div></a>`;
  };
  let menuHtml='';
  if(side === 'R'){
    /* right picker: LANGUAGES row (EN = the canonical English lane l4→l3→l2),
       then GEN-Z / POETIC (C2 renders, queued to the mine lane) / LITERAL
       (word-gloss l0 where on file, else close l1). No Yours, no verbose lists. */
    const eng = engLaneId();
    const lit = RIDS.includes('l0') ? 'l0' : 'l1';
    const bar = (v,label)=>`<a class="tbar${v===vid?' on':''}" href="#" data-col="R" data-v="${v}">${esc(label)}</a>`;
    menuHtml = `<div class="dgroup">LANGUAGES</div><div class="tbars">${bar(eng,'EN')}</div>`
      + `<div class="tbars"><a class="tbar styleitem" href="#" data-style="gen z">GEN-Z</a><a class="tbar styleitem" href="#" data-style="poetic">POETIC</a>${bar(lit,'LITERAL')}</div>`
      + `<div class="tbars">${bar('sa-deva','SANSKRIT')}${bar('sa-iast','IAST')}</div>`;
  } else {
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
  }
  let extra = '';
  menuEl.innerHTML = menuHtml + extra + (side==='R' && vid!=='none' ? `<div class="dropdown-divider"></div><a class="dropdown-item remove" href="#" data-col="R" data-v="none"><span class="side">&nbsp;</span><div><div class="label">remove column</div></div></a>` : '');
  menuEl.querySelectorAll('.dropdown-item,.tbar').forEach(a=>{
    if(a.hasAttribute('data-style')) return;
    a.onclick = e=>{ e.preventDefault(); menuEl.classList.remove('show'); setCol(a.getAttribute('data-col')==='L'?'left':'right', a.getAttribute('data-v')); };
  });
  /* Style = C2. Canonical columns never show machine renders (doctrine): a style
     pick routes to the mine lane with the render queued for the current verse. */
  menuEl.querySelectorAll('.styleitem').forEach(a=>{
    a.onclick = e=>{
      e.preventDefault(); menuEl.classList.remove('show');
      const st = a.getAttribute('data-style');
      try{ sessionStorage.setItem('svv-c2pending', JSON.stringify({style: st, ix: CURIX})); }catch(err){}
      setCol('right', 'mine');
    };
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
  textEl.querySelectorAll('.splay').forEach(b=>{
    b.onclick = e=>{ e.preventDefault(); e.stopPropagation();
      splayToggle(b.getAttribute('data-k'), +b.getAttribute('data-i')); };
  });
  const del = $('#colRdel');
  if(del) del.onclick = e=>{ e.preventDefault(); setCol('right','none'); };
}

let MORPH = null; // data/morph/<wid>.json {verses:[{id,tags:{word:{src,lemma?,pos?}}}]}
let PROOF = null; // data/proof/<wid>.json {verses:{id:{gate,blocking,checks,source_sha,result_id,model,date}}}
let PROBES = null; // data/probes/<wid>.json {probes:[{id,question,verses:[n],verdict}]} — pushing hounds
async function loadProbes(){
  if(WORK==='ghatakarpara'){PROBES=null;PROBES_SOURCE='';return;}
  try{
    const p = await get(`data/probes/${WORK}.json`);
    PROBES = (p && p.probes) || null;
    PROBES_SOURCE = (p && p.source) || '';
  }catch(e){ PROBES = null; }
}
let PROBES_SOURCE = '';
async function loadMorph(){
  if(WORK==='ghatakarpara'){MORPH=null;PROOF=null;return;}
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
/* pushing hounds: the hardest questions, each with its verdict. Tap one to
   hound the text — jumps to the verse and asks the chat. */
function probesHtml(){
  return `<div class="cmp-note" style="margin-bottom:.3rem">${PROBES.length} hard questions, hounded against the text. Tap one to ask it.</div>`
    + PROBES.map((p,k)=>{
      const iv = (p.verses||[]).length ? p.verses[0]-1 : null;
      return `<div style="margin:.4rem 0"><a href="#" data-pq="${k}"><b>${esc(p.id.toUpperCase())}</b> — ${esc(p.question)}</a>`
        + (iv!=null ? ` <a href="#" data-pj="${iv}">§${iv+1}</a>` : '')
        + `<div class="cmp-note">${esc(p.verdict)}</div></div>`;
    }).join('');
}
function bindProbes(){
  const box = $('#wid-probes');
  if(!box) return;
  box.querySelectorAll('a[data-pq]').forEach(a=>{
    a.onclick = e=>{
      e.preventDefault();
      const p = PROBES[+a.getAttribute('data-pq')];
      if(!p) return;
      const iv = (p.verses||[]).length ? p.verses[0]-1 : null;
      if(iv!=null){
        const el = document.querySelector(`.verse[data-i="${iv}"]`);
        if(el) el.scrollIntoView({block:'center', behavior:'smooth'});
      }
      const inp = $('#qin');
      if(inp){
        inp.value = p.question + (iv!=null ? ` (re §${iv+1})` : '');
        inp.focus();
        const rail = $('#wid-chat');
        if(rail){ rail.classList.remove('closed'); rail.scrollIntoView({block:'nearest'}); }
      }
    };
  });
  box.querySelectorAll('a[data-pj]').forEach(a=>{
    a.onclick = e=>{ e.preventDefault(); const el=document.querySelector(`.verse[data-i="${a.getAttribute('data-pj')}"]`); if(el) el.scrollIntoView({block:'center',behavior:'smooth'}); };
  });
}
/* tap a Sanskrit word: prefill the chat with a grounded question about it */
function askWord(w){
  document.querySelectorAll('.w.sel').forEach(x=>x.classList.remove('sel'));
  w.classList.add('sel');
  const ia = w.getAttribute('data-w'), id = w.getAttribute('data-v');
  const i = (DATA.verses||[]).findIndex(v=>v.id===id);
  const inp = $('#qin');
  if(inp){
    inp.value = `what does "${ia||'?'}" mean in §${i>=0?i+1:'?'}`;
    inp.focus();
  }
  const rail = $('#wid-chat');
  if(rail){ rail.classList.remove('closed'); rail.scrollIntoView({block:'nearest'}); }
}

function quiet(){
  QUEUE = null; QIDX = 0; QBASE = 0; QNEXT = null;
  if(AUtimer){ cancelAnimationFrame(AUtimer); AUtimer = null; }
  if(AU){ AU.onended = null; try{ AU.pause(); }catch(e){} }
  try{ speechSynthesis.cancel(); }catch(e){}
  document.querySelectorAll('.w.sing').forEach(w=>w.classList.remove('sing'));
  document.querySelectorAll('.verse.now').forEach(v=>v.classList.remove('now'));
}
function bumpPlay(){ PLAYGEN++; PS = null; repaintSplay(); }
function stopRecite(){ bumpPlay(); quiet(); AUix = null; }
/* ---- per-section play: starts at a section, auto-continues to the end ----
   sa = chant/browser voice via stepOnce · en/c1 = Granny via /api/read (R2-cached) */
function readUrlFor(v, kind){
  if(!isReaderPass(v))return Promise.reject(new Error('English withheld by the passage gate'));
  let text = '';
  if(kind === 'c1'){
    text = cleanEN((v.c1 || '').replace(/^##\s+[^\n]*\n/, ''));
    if(!text){
      const m = (v.id||'').match(/^(.*)-v\d+$/);
      const first = m && (DATA.verses||[]).find(x=>x.id===m[1]+'-v01' && isReaderPass(x) && x.c1);
      text = first ? cleanEN(first.c1.replace(/^##\s+[^\n]*\n/, '')) : '';
    }
  } else {
    text = (v.l4 || v.l3 || v.l2 || '').trim();
  }
  if(!text) return Promise.reject(new Error('no english on file — withheld'));
  return fetch(API + '/api/read', {method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({work: WORK, verse: v.id, lang: kind==='c1'?'c1':'en', text: text.slice(0,4000)})})
    .then(r=>r.json().then(d=>{ if(!r.ok) throw new Error(d.error||('http '+r.status)); return d.url; }));
}
function splayStart(kind, from){
  PLAYGEN++; const g = PLAYGEN;
  quiet(); AUix = null;
  PS = {kind, i: from, paused: false, gen: g, audio: null};
  repaintSplay();
  const step = ()=>{
    if(!PS || PS.gen !== g || PS.paused) return;
    repaintSplay();                          // paint the NEW current section each advance
    const vs = DATA.verses || [];
    if(PS.i >= vs.length){ stopRecite(); return; }
    const i = PS.i;
    if(kind === 'sa'){
      markVerse(i); AUix = i;
      stepOnce(i, ()=>{ if(!PS || PS.gen !== g || PS.paused) return; PS.i++; step(); });
      return;
    }
    const v = vs[i];
    if(kind === 'en' && !(v.l4 || v.l3 || v.l2)){ PS.i++; step(); return; }
    markVerse(i);
    readUrlFor(v, kind).then(url=>{
      if(!PS || PS.gen !== g || PS.paused) return;
      const a = new Audio(url); PS.audio = a;
      a.onended = ()=>{ if(!PS || PS.gen !== g) return; PS.i++; PS.audio = null; step(); };
      a.play().catch(()=>{ if(PS && PS.gen === g){ PS.i++; PS.audio = null; step(); } });
    }).catch(()=>{ if(PS && PS.gen === g){ PS.i++; step(); } });
  };
  PS._step = step;
  step();
}
function splayToggle(kind, ix){
  if(kind !== 'sa' && enSilent()) return;
  if(PS && PS.i === ix && PS.kind === kind){          // same section: pause / resume
    if(!PS.paused){
      PS.paused = true;
      if(kind === 'sa'){
        try{ AU && AU.pause(); }catch(e){}
        if(AUtimer){ cancelAnimationFrame(AUtimer); AUtimer = null; }
        try{ speechSynthesis.pause(); }catch(e){}
      } else if(PS.audio){ PS.audio.pause(); }
      repaintSplay();
    } else {
      PS.paused = false;
      if(kind === 'sa'){
        try{ speechSynthesis.resume(); }catch(e){}
        if(AU && !AU.ended){ AU.play().catch(()=>{}); AUtimer = requestAnimationFrame(tickAU); }
      } else if(PS.audio){ PS.audio.play().catch(()=>{}); }
      else if(PS._step) PS._step();          // paused between fetches — re-kick
      repaintSplay();
    }
    return;
  }
  splayStart(kind, ix);                       // any other section: start the chain there
}
function repaintSplay(){
  const ra = document.querySelector('#rcAll');
  if(ra) ra.textContent = (PS && !PS.paused) ? '\u23F8' : '\u25B6';   // one button: play ⇄ pause
  document.querySelectorAll('.verse.paused').forEach(v=>v.classList.remove('paused'));
  if(PS && PS.paused) document.querySelectorAll(`.verse[data-i="${PS.i}"]`).forEach(v=>v.classList.add('paused'));
}
let SEL_LANG = 'en';   // headbar language selector: 'sa' | 'en' (EN default)
function enSilent(){
  if(EN_READ_OFF){ const m=$('#readMsg'); if(m) m.textContent='english readout is off for now'; return true; }
  return false;
}
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
    const source=(DATA?.verses||[])[i]?.sa||'';
    const u = new SpeechSynthesisUtterance(IAST_DEVA.convert(cleanSA(source)).slice(0,1200));
    u.rate = 0.95; u.onend = next;
    speechSynthesis.speak(u);
  }catch(e){ next(); }
}
function stepOnce(i, next){
  const verse=(DATA?.verses||[])[i];
  if(verse?.source_issue){if(verse.source_complete)speakThen(i,next);else next();return;}
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
function reciteVerse(i){ bumpPlay(); quiet(); AUix = i; markVerse(i); stepOnce(i, ()=>stopRecite()); }
function reciteAll(){
  bumpPlay(); quiet();
  const g = PLAYGEN;
  let i = 0;
  const step = ()=>{
    if(g !== PLAYGEN) return;
    if(i >= DATA.verses.length){ stopRecite(); return; }
    AUix = i; markVerse(i);
    stepOnce(i, ()=>{ if(g !== PLAYGEN) return; i++; step(); });
  };
  step();
}

const W = (id, title, body)=>`<div class="widget" id="wid-${id}"><h2><span><span class="tog">⌄</span>${title}</span></h2><div class="wbody">${body}</div></div>`;
function buildRightRail(verses){
  $('#headbar').innerHTML =
    `<div class="hbrow">
      <span class="tsize hbg">${['Αα','Αα','Αα','Αα','Αα'].map((a,i)=>`<button data-s="${i}" style="font-size:${[11,13,15,19,24][i]}px" title="text size">${a}</button>`).join('')}</span>
      <span class="hbsep"></span>
      <span class="twidth hbg">${['Narrow','Normal','Wide','Full'].map(w=>`<a href="#" data-w="${w}" title="text width">${w}</a>`).join(' ')}</span>
      <span class="hbsep"></span>
      <button id="readSa" class="hbbtn" title="language: Sanskrit">स</button>
      <button id="readEn" class="hbbtn hbsel" title="language: English (selected)">EN</button>
      <button id="rcAll" class="hbbtn" title="play English">▶</button>
    </div>
    <div id="readMsg" class="cmp-note hbmsg"></div>`;
  $('#rail').innerHTML =
    W('chat','Chat', `<div id="convo" aria-live="polite"></div><div class="wsearch wsbox"><textarea id="qin" placeholder="${DEFAULT_PH}" aria-label="ask about this work"></textarea><span class="wsrow"><span class="wsrow"><button id="qgo" class="circbtn trident" title="send"><svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><path d="M12 21V3M6.5 5.5v4M17.5 5.5v4M6.5 9.5h11"/></svg><span class="sr">send</span></button></span></span></div>`).replace('<span class="tog">⌄</span>',''),
  // collapsible widgets
  document.querySelectorAll('#headbar .widget h2').forEach(h=>{
    h.onclick = ()=>h.parentElement.classList.toggle('closed');
  });
  // recitation
  const rcA = $('#rcAll');
  /* headbar: स/EN = language SELECTOR (EN default), one ▶/⏸ toggle after them —
     idle ▶ plays the work from the current section in the selected language;
     while playing the same button pauses/resumes (all chains route through PS) */
  const readSa = $('#readSa'), readEn = $('#readEn');
  const setSel = lang=>{
    if(PS) stopRecite();                    // switching language = fresh intent
    SEL_LANG = lang;
    if(readSa) readSa.classList.toggle('hbsel', lang==='sa');
    if(readEn) readEn.classList.toggle('hbsel', lang==='en');
    if(rcA) rcA.title = 'play ' + (lang==='sa' ? 'Sanskrit' : 'English');
    const m = $('#readMsg'); if(m) m.textContent = '';
    repaintSplay();
  };
  if(readSa) readSa.onclick = ()=>setSel('sa');
  if(readEn) readEn.onclick = ()=>setSel('en');
  if(rcA) rcA.onclick = ()=>{
    if(PS){ splayToggle(PS.kind, PS.i); return; }   // ⏸ pause / ▶ resume
    splayStart(SEL_LANG, CURIX || 0);               // idle → play from here, selected language
  };
  /* text mode retired with its widget (tap-to-ask works everywhere now)
  document.querySelectorAll('#wid-mode [data-m]').forEach(b=>{
    b.onclick = ()=>{
      document.querySelectorAll('#wid-mode [data-m]').forEach(x=>x.classList.remove('on'));
      b.classList.add('on');
      document.body.classList.toggle('highlight', b.getAttribute('data-m')==='highlight');
    };
  });
  */
  /* ---- Ask the text: Qwen Omni via worker, local retrieval fallback.
     Answers are grounded in this work's files, with citations. */
  const vjump = i=>`<a href="#" data-jump="${i}">§${i+1}</a>`;
  const bindJumps = box=>{
    box.querySelectorAll('a[data-jump]').forEach(a=>{
      a.onclick = e=>{ e.preventDefault(); const el=document.querySelector(`.verse[data-i="${a.getAttribute('data-jump')}"]`); if(el) el.scrollIntoView({block:'center',behavior:'smooth'}); };
    });
    box.querySelectorAll('a[data-doc]').forEach(a=>{
      a.onclick = e=>{ e.preventDefault(); openDoc(a.getAttribute('data-doc'), a.getAttribute('title')||'source'); };
    });
  };
  const openDoc = (url, title)=>{
    let ov = document.getElementById('qdocov');
    if(!ov){
      ov = document.createElement('div');
      ov.id = 'qdocov';
      ov.innerHTML = '<div class="qdochead"><span id="qdoct"></span><a href="#" id="qdocx">×</a></div><div class="qdocbody" id="qdocb"></div>';
      const rail = document.querySelector('#wid-chat .wbody');
      (rail || document.body).appendChild(ov);
      document.getElementById('qdocx').onclick = ev=>{ ev.preventDefault(); ov.style.display='none'; };
    }
    document.getElementById('qdoct').textContent = title;
    const b = document.getElementById('qdocb');
    b.textContent = 'loading…';
    ov.style.display = '';
    fetch(url).then(r=>{ if(!r.ok) throw 0; return r.text(); })
      .then(t=>{ b.textContent = (t||'').slice(0,6000); })
      .catch(()=>{ b.textContent = 'Could not load this record.'; });
  };
  const l0find = (id, ia)=>{
    if(!L0 || !L0[id]) return null;
    const nq = normQ(ia||'');
    return (L0[id]||[]).find(t=>{ const k=normQ(t.iast||''); return k&&nq&&(k===nq||k.includes(nq)||nq.includes(k)); }) || null;
  };
  const l0scan = q=>{
    const out = [];
    if(!L0) return out;
    for(const vid of Object.keys(L0)){
      const i = (DATA.verses||[]).findIndex(v=>v.id===vid||v.chunk===vid);
      if(i<0||!isReaderPass(DATA.verses[i]))continue;
      for(const t of (L0[vid]||[])){
        const hay = `${t.iast||''} ${t.gloss||''}`.toLowerCase();
        if(hay.includes(q)){ out.push({i, vid, t}); break; }
      }
      if(out.length>=8) break;
    }
    return out;
  };
  const summOf = v=>{
    const m = (v.c1||'').match(/\*\*SUMMARY\.\*\*\s*([^*]+)/);
    if(!m) return '';
    return m[1].trim().split(/(?<=[.?!])\s+/).slice(0,2).join(' ');
  };
  const gateNote = v=>`English is withheld for this verse (gate ${esc(v.gate||'BLOCKED')}) — Sanskrit only.`;
  function answerQuestion(rawQ){
    const q0 = (rawQ||'').trim(); if(!q0) return '';
    const q = q0.toLowerCase();
    const verses = DATA.verses||[];
    const vm = q.match(/(?:§|verse|v)\s*(\d{1,3})/);
    const vi = vm ? (+vm[1]-1) : -1;
    const vok = vi>=0 && vi<verses.length;
    const v = vok ? verses[vi] : null;
    const pass = v && v.gate==='PASS' && (v.l2||v.l1);
    if(/^(help|what can you do|commands|\?)$/.test(q))
      return `Ask about words (“what does X mean”), verses (“translate §3”, “why §3”, “is §3 reviewed”), or jump (“§3”). I answer only from this work's files.`;
    // navigation: bare §N / "verse N" / "go N"
    if(vok && /^(§\s*\d+|verse\s+\d+|v\s*\d+|go(\s+to)?\s+§?\s*\d+|show\s+§?\s*\d+)$/.test(q)){
      const el = document.querySelector(`.verse[data-i="${vi}"]`);
      if(el) el.scrollIntoView({block:'center', behavior:'smooth'});
      const first = ((v.l4||v.l3||'').split('\n').map(s=>s.trim()).filter(Boolean)[0]) || cleanEN(v.l2||v.l1||'').slice(0,120);
      return pass ? `${vjump(vi)} — ${esc(first)}` : `${vjump(vi)} — ${gateNote(v)}`;
    }
    // "what does X mean [in §N]?"
    let mq = q.match(/what does\s+["“”']?(.+?)["“”']?\s+mean(?:\s+(?:in|of|at)\s+(?:§\s*\d+|verse\s+\d+|this\s+verse))?\s*\??$/)
          || q.match(/mean(?:ing)?\s+of\s+["“”']?(.+?)["“”']?\s*\??$/);
    if(!mq && q.split(/\s+/).length<=3 && !vok && !/^(what is|what's|define)\b/.test(q)) mq = [q, q0.replace(/[?]/g,'')];
    if(mq){
      const term = (mq[1]||'').replace(/^(?:the|a|an)\s+/,'').trim();
      if(term){
        if(vok && pass){
          const hit = l0find(v.id, term);
          if(hit) return `<b>${esc(term)}</b> in ${vjump(vi)} — ${esc((hit.gloss||'').replace(/\n/g,' '))}.`;
        }
        if(vok && !pass) return `${vjump(vi)} — ${gateNote(v)}`;
        const hits = l0scan(term.toLowerCase());
        if(hits.length) return `<b>${esc(term)}</b> — ` + hits.slice(0,3).map(h=>`${esc((h.t.gloss||'').replace(/\n/g,' '))} ${h.i>=0?vjump(h.i):''}`).join(' · ');
        return `“${esc(term)}” is not in this work's word-gloss.`;
      }
    }
    // "translate §N" / "what does §N say|mean"
    if(vok && /translat|what does|say|mean|reading/.test(q)){
      if(!pass) return `${vjump(vi)} — ${gateNote(v)}`;
      const lines = (v.l4||v.l3||'').split('\n').map(s=>s.trim()).filter(Boolean);
      const body = lines.length ? lines.map(esc).join('<br>') : esc(cleanEN(v.l2||v.l1||''));
      return `${vjump(vi)} — ${body}`;
    }
    // "why §N" / "commentary"
    if(vok && /why|commentary|reading|explain/.test(q)){
      if(!pass) return `${vjump(vi)} — ${gateNote(v)}`;
      const s = summOf(v);
      return s ? `${vjump(vi)} — ${esc(s)}` : `${vjump(vi)} — no commentary on file.`;
    }
    // "what is X" (term, no verse): gloss + commentary hint
    const mw = q.match(/^(?:what is|what's|define)\s+(.+?)\s*\??$/);
    if(mw){
      const hits = l0scan(mw[1].trim());
      if(hits.length){ const h = hits[0]; return `<b>${esc(mw[1].trim())}</b> — ${esc((h.t.gloss||'').replace(/\n/g,' '))} ${h.i>=0?vjump(h.i):''}.`; }
      return `Nothing on file for “${esc(mw[1].trim())}”.`;
    }
    // trust / proof
    if(/review|proof|trust|human|machine|reliable|complete/.test(q)){
      if(vok){
        const p = (PROOF||{})[v.id];
        const g = p ? p.gate : (pass ? 'PASS (unproved record)' : 'BLOCKED');
        return `${vjump(vi)} — proof ${esc(String(g))}; machine-proposed, needs human review.`;
      }
      const n = verses.filter(x=>x.gate==='PASS'&&(x.l2||x.l1)).length;
      return `${n}/${verses.length} passages gate-passed · English shows only where passed · all machine-proposed, needs human review.`;
    }
    return `I answer only from this work's files — try “what does … mean”, “translate §N”, “why §N”, or “§N”.`;
  }
  const convo = $('#convo');
  const qsay = (cls, html)=>{
    if(!convo) return;
    const d = document.createElement('div');
    d.className = 'qbub '+cls; d.innerHTML = html;
    convo.appendChild(d); bindJumps(d);
    convo.scrollTop = convo.scrollHeight;
  };
  if(convo && !convo.dataset.hi){
    convo.dataset.hi = '1';
    /* the AI speaks first: a wondering question pertaining to this work.
       Precomputed openers (data/openers.json) — no inference on page load. */
    /* first message = c1sum mini-essay (compiled from argmaps+C1 by
       translation-work/tools/build_c1sum.py); no "ask" link — the box IS the ask */
    const openerFallback = 'I wonder what this work is really asking…';
    if(WORK==='ghatakarpara')qsay('a','This work is being rechecked against the complete source. Translation and AI answers are temporarily withheld.');
    else fetch(`data/chatsum/${encodeURIComponent(WORK)}.json`).then(r=>r.ok?r.json():null).catch(()=>null).then(cs0=>{
      if(cs0 && cs0.text){                       // authored chatsum (datatype: chatsum)
        qsay('a', `<b>${esc(cs0.title||WORK)}</b> — ${esc(cs0.text)}`);
        return;
      }
      fetch('data/c1sum.json').then(r=>r.ok?r.json():{}).catch(()=>({})).then(cs=>{
        const intro = (cs && cs[WORK]) || c1sumLine();
        if(intro){
          qsay('a', `<b>${esc((DATA&&DATA.title)||WORK)}</b> — ${esc(intro)}`);
        } else {
          fetch('data/openers.json').then(r=>r.ok?r.json():{}).catch(()=>({}))
            .then(o=>qsay('a', `<i>${esc(o[WORK]||openerFallback)}</i>`));
        }
      });
    });
  }
  /* Qwen Omni via the ipvv worker (RAG over gated corpus + pushing probes,
     closed world per CHAT.md). Local retrieval answers instantly and covers
     offline/failure — the worker is for open questions. */
  /* grey placeholder = a probing query, new every 20s. Send with an empty
     box to ask the one showing; typing clears it until the box is empty again.
     Seed: the work's pushing/hound queries, else the text's own argmap questions. */
  const PUSH = {seed: [], ix: 0, on: false};
  const pushPh = ()=>{ const i = $('#qin');
    if(i && PUSH.on && PUSH.seed.length) i.placeholder = PUSH.seed[PUSH.ix % PUSH.seed.length]; };
  const startPush = (seed)=>{
    if(PUSH.on || !seed.length) return;
    PUSH.seed = seed; PUSH.on = true; PUSH.ix = 0; pushPh();
    setInterval(()=>{ const i = $('#qin');
      if(!i || (i.value || '').trim()) return;      // typing ⇒ leave it alone
      PUSH.ix++; pushPh(); }, 20000);
  };
  if(WORK!=='ghatakarpara')fetch('https://ipvv-a8u.pages.dev/data/pushing/INDEX.json').then(r=>r.ok?r.json():{}).catch(()=>({}))
   .then(idx=>{
     const qs = ((idx && idx.records) || []).filter(r=>r.work_hint === WORK)
                   .flatMap(r => (r.questions || []).map(q => q.q)).filter(Boolean);
     if(qs.length){ startPush(qs); return; }
     /* no hound corpus for this work → the shared bank of sharp general
        enquiries reused across pushing texts (data/pushbank.json) */
     fetch('data/pushbank.json').then(r=>r.ok?r.json():{}).catch(()=>({}))
       .then(b=>{ const g = (b && b.queries) || []; if(g.length) startPush(g); });
   });

  const qrun = ()=>{
    const inp = $('#qin'); if(!inp || inp.disabled) return;
    let q = (inp.value||'').trim();
    if(!q && PUSH.on && PUSH.seed.length && inp.placeholder !== DEFAULT_PH){
      q = PUSH.seed[PUSH.ix % PUSH.seed.length]; PUSH.ix++;   // empty box + grey query = ask it
    }
    if(!q) return;
    inp.value = ''; inp.disabled = true;
    if(PUSH.on) pushPh();
    qsay('q', esc(q));
    const thinking = document.createElement('div');
    thinking.className = 'qbub a thinking'; thinking.textContent = '…';
    convo.appendChild(thinking); convo.scrollTop = convo.scrollHeight;
    if(WORK==='ghatakarpara'){
      thinking.remove();qsay('a','Answers are withheld until the complete source and translation have been rechecked.');
      inp.disabled=false;return;
    }
    let sid = null;
    try{ sid = localStorage.getItem('svv-chat-'+WORK) || null; }catch(e){}
    const ctrl = new AbortController();
    const to = setTimeout(()=>ctrl.abort(), 90000);
    fetch(API + '/api/chat/' + encodeURIComponent(WORK), {method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({session_id: sid, message: q}), signal: ctrl.signal})
    .then(r=>{ if(!r.ok) throw new Error('http '+r.status); return r.json(); })
    .then(d=>{
      clearTimeout(to);
      try{ if(d.session_id) localStorage.setItem('svv-chat-'+WORK, d.session_id); }catch(e){}
      thinking.remove();
      /* citations become tiny numbered refs. Verse chunks jump in place;
         C1 NOTEs and argmaps (not rendered on this page) open the source doc. */
      const known = {};
      (DATA.verses||[]).forEach((v,i)=>{ if(v.id) known[v.id]=i; });
      const docUrl = id=>{
        let m;
        if(m=id.match(/^c1:([^/]+)\/(.+?\.NOTE)$/)) return `https://ipvv-a8u.pages.dev/data/c1/${m[1]}/${m[2]}.md`;
        if(m=id.match(/^pt:argument:([^:]+):(.+)$/)) return `https://ipvv-a8u.pages.dev/data/argmaps/${m[1]}/${m[2]}.md`;
        return null;
      };
      const chunkOf = id=>{
        const parts = id.split(/[:/]/);
        const last = parts[parts.length-1].replace(/\.(NOTE|md)$/i,'');
        if(known[last]!=null) return last;
        if(known[id]!=null) return id;
        return null;
      };
      let html = esc(d.reply||'No answer.');
      const seen = {}; let n = 0;
      const cite = id=>{
        if(!(id in seen)){ n++; seen[id]=n; }
        return seen[id];
      };
      html = html.replace(/\[([^\]]+)\]/g, (full, id0)=>{
        const id = (id0||'').trim();
        const u = docUrl(id);
        if(u) return `<a href="#" class="qref" data-doc="${esc(u)}" title="${esc(id)}">[${cite(id)}]</a>`;
        const c = chunkOf(id);
        if(c!=null) return `<a href="#" class="qref" data-jump="${known[c]}" title="${esc(id)}">[${cite(id)}]</a>`;
        return full;
      });
      qsay('a', html
        + (d.suggestion ? `<div class="qsug">Try: <a href="#" data-qask="${esc(d.suggestion)}">${esc(d.suggestion)}</a></div>` : ''));
      const sug = convo.querySelector('.qsug a[data-qask]');
      if(sug) sug.onclick = ev=>{ ev.preventDefault(); inp.value = ev.target.textContent; qrun(); };
    })
    .catch(err=>{
      clearTimeout(to);
      thinking.remove();
      const why = (err && err.name==='AbortError') ? 'timed out' : String((err&&(err.message||err))||err).slice(0,60);
      qsay('a', `<span class="cmp-note">Qwen unreachable (${esc(why)}) — answering from this work's files:</span> ` + answerQuestion(q));
    })
    .finally(()=>{ inp.disabled = false; try{ inp.focus(); }catch(e){} });
  };
  const qgo = $('#qgo'); if(qgo) qgo.onclick = qrun;
  const qin = $('#qin');
  if(qin) qin.addEventListener('keydown', e=>{ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); qrun(); } });
  if(qin) qin.addEventListener('input', ()=>{
    const has = (qin.value||'').trim().length > 0;
    if(PUSH.on) qin.placeholder = (has || !PUSH.seed.length) ? DEFAULT_PH : PUSH.seed[PUSH.ix % PUSH.seed.length];
  });
  // size (5 steps, Scaife) / width (text links, Scaife)
  const sizes = [[0.9,0.8],[1.0,0.85],[1.25,1.0],[1.5,1.15],[1.8,1.3]];
  document.querySelectorAll('#headbar [data-s]').forEach(b=>{
    b.onclick = ()=>{
      const i = +b.getAttribute('data-s');
      const r = document.documentElement.style;
      r.setProperty('--sa-size', sizes[i][0]+'rem');
      r.setProperty('--en-size', sizes[i][1]+'rem');
      try{ localStorage.setItem('svv-tsize', i); }catch(e){}
      document.querySelectorAll('#headbar [data-s]').forEach(x=>x.classList.remove('on'));
      b.classList.add('on');
    };
  });
  const widths = {Narrow:'38rem', Normal:'46rem', Wide:'62rem', Full:'100%'};
  document.querySelectorAll('#headbar [data-w]').forEach(b=>{
    b.onclick = e=>{
      e.preventDefault();
      document.documentElement.style.setProperty('--measure', widths[b.getAttribute('data-w')]);
      try{ localStorage.setItem('svv-twidth', b.getAttribute('data-w')); }catch(e){}
      document.querySelectorAll('#headbar [data-w]').forEach(x=>x.classList.remove('on'));
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
    const b = document.querySelector(`#headbar [data-s="${s}"]`); if(b) b.classList.add('on');
    const w = localStorage.getItem('svv-twidth')||'Normal';
    const widths = {Narrow:'38rem', Normal:'46rem', Wide:'62rem', Full:'100%'};
    r.setProperty('--measure', widths[w]||widths.Normal);
    const wb = document.querySelector(`#headbar [data-w="${w}"]`); if(wb) wb.classList.add('on');
  }catch(e){}
}
main();
})();
