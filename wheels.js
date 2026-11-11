/* wheels.js — slot rings + disc view + drill over two honest tiers.
   Tiers: curated teaching (vendor/sanskrit-bruno-wheels/data.js + engine.js,
   MIT, byte-identical upstream) and machine-verified (vendored Vidyut pack
   data/grammar/wheel-pack.json, lazy-fetched). No live derivation anywhere:
   unlisted forms never render. Script toggle: deva/iast/en via .tri spans. */
(function(){
'use strict';
const $ = s=>document.querySelector(s);
const $$ = s=>Array.from(document.querySelectorAll(s));
const esc = s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function readJSON(id){
  try{ const el=document.getElementById(id); return el?JSON.parse(el.textContent):null; }
  catch(e){ return null; }
}
/* tri-spans: every surface renders in all three scripts; CSS picks one. */
function tri(deva,iast,en){
  en = (en==null||en==='')?iast:en;
  return `<span class="tri"><span class="t-deva">${esc(deva||'')}</span><span class="t-iast"><i>${esc(iast||'')}</i></span><span class="t-en">${esc(en||'')}</span></span>`;
}
const WORD = readJSON('wheel-word'), SENT = readJSON('wheel-sentence'),
      TRIKA = readJSON('wheel-trika'), CC = readJSON('wheel-crosscheck');
const CUR = (typeof window!=='undefined') ? window.SanskritData : null;
const ENG = (typeof window!=='undefined') ? window.SanskritEngine : null;
let PACK=null, PACKLOAD=null;
function loadPack(){
  if(PACKLOAD) return PACKLOAD;
  PACKLOAD = fetch('data/grammar/wheel-pack.json').then(r=>{ if(!r.ok) throw 0; return r.json(); })
    .then(p=>{ PACK=p; return p; }).catch(()=>null);
  return PACKLOAD;
}
function normQ(s){ return (s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z]/g,''); }
function packFind(deva,iast){
  if(!PACK) return null;
  const nq=normQ(iast), dv=(deva||'').trim();
  return (PACK.entries||[]).find(e=>(e.iast&&normQ(e.iast)===nq)||(dv&&e.deva===dv))||null;
}
function packSteps(e){
  return (e.prakriya||[]).filter(s=>s.sutra&&/^(4\.|5\.|7\.|8\.|1\.4|3\.4|6\.)/.test(s.sutra)).slice(0,8);
}
/* ---------- script toggle ---------- */
function initToggle(){
  const bar=$('#script-toggle'); if(!bar) return;
  const cur=(()=>{ try{return localStorage.getItem('svv-script')||'deva';}catch(e){return 'deva';} })();
  setScript(cur);
  bar.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>setScript(b.getAttribute('data-script'))));
}
function setScript(s){
  document.body.classList.remove('script-deva','script-iast','script-en');
  document.body.classList.add('script-'+s);
  try{localStorage.setItem('svv-script',s);}catch(e){}
  $$('#script-toggle button').forEach(b=>b.classList.toggle('on',b.getAttribute('data-script')===s));
}
/* ---------- Machine A: table + disc ---------- */
let wordSel={base:'sarva',attr:'tral'};
function curatedCell(base,attr){
  if(!CUR) return null;
  const w=CUR.words[base]&&CUR.words[base][attr];
  return w||null;
}
function paintWordDetail(base,attr){
  const d=$('#word-detail'); if(!d) return;
  const row=(WORD.rows||[]).find(r=>r.base===base);
  const end=(WORD.endings||[]).find(x=>x.attr===attr)||{};
  const cell=row&&row.cells[attr];
  if(!cell){ d.innerHTML='<span class="mut">Pick a cell.</span>'; return; }
  const e=cell.derived||{};
  const cur=curatedCell(base,attr);
  let h=`<div style="font-size:1.6em">${tri(e.deva,e.iast,(cur&&cur.en)||'')}</div>`
    + `<div class="mut">${esc(row.base_en)} + ${esc(end.en||'')} · teaching ref ${esc(end.sutra||'')}</div>`;
  if(cell.special==='kim-katham'&&CC){
    h+=`<div class="cmp-note">katham is the 5.3.24–25 thamu special — plain kim+thal gives <i>kathā</i>. Both shown; neither invented.</div>`;
  }
  h+=`<div class="twocol"><div><h4>machine trace</h4><div id="word-prak" class="mut">derivation: loading…</div></div>`
    + `<div><h4>teaching note</h4><div class="mut">${cur?esc(cur.formula||'')+(cur.example?` — e.g. ${cur.example} (${cur.exampleEn||''})`:'')+(cur.ruleExtra?` [${cur.ruleExtra}]`:''):'curated entry absent; machine only.'}</div></div></div>`
    + `<div id="word-links"></div>`;
  d.innerHTML=h;
  loadPack().then(()=>{
    const p=$('#word-prak'); if(!p) return;
    const full=packFind(e.deva,e.iast);
    p.innerHTML=full&&full.kind!=='curated-note'&&packSteps(full).length
      ? `<ol class="prak">${packSteps(full).map(s=>`<li><span class="psutra">${esc(s.sutra)}</span> → ${esc(s.after)}${s.sutra_iast?` <span class="mut">${esc(s.sutra_iast)}</span>`:''}</li>`).join('')}</ol><div class="mut">Vidyut, unreviewed · full trace in data/grammar/wheel-pack.json</div>`
      : '<span class="mut">no machine trace on file — teaching note stands alone.</span>';
    const lk=$('#word-links');
    if(lk){
      const vs=(e.verses||[]), ls=(e.lessons||[]);
      lk.innerHTML=(vs.length||ls.length)
        ? `<div style="margin-top:.4rem"><b>scripture:</b> ${vs.slice(0,6).map(r=>`<a href="?work=${encodeURIComponent(r.work)}#${encodeURIComponent(r.verse)}">${esc(r.work)} ${esc(r.verse)}</a>`).join(' · ')}${ls.length?`<div class="mut">lessons: ${ls.map(esc).join(', ')}</div>`:''}</div>`:'';
    }
  });
}
function markWordSel(){
  $$('#word-grid [data-cell]').forEach(b=>{
    const [base,attr]=b.getAttribute('data-cell').split('|');
    b.classList.toggle('on',base===wordSel.base&&attr===wordSel.attr);
  });
  paintDisc();
}
function initWord(){
  if(!WORD) return;
  $$('#word-grid [data-cell]').forEach(b=>b.addEventListener('click',()=>{
    const [base,attr]=b.getAttribute('data-cell').split('|');
    wordSel={base,attr}; markWordSel(); paintWordDetail(base,attr);
  }));
  markWordSel(); paintWordDetail(wordSel.base,wordSel.attr);
  initDisc();
}
/* concentric disc: two rings (stems outer, endings inner), same state as table */
const NS='http://www.w3.org/2000/svg';
function svgEl(n,attrs,text){
  const el=document.createElementNS(NS,n);
  for(const k of Object.keys(attrs||{})) el.setAttribute(k,attrs[k]);
  if(text!==undefined) el.textContent=text;
  return el;
}
function sectorPath(cx,cy,rIn,rOut,a0,a1){
  const p=(r,a)=>{const t=(a-90)*Math.PI/180;return [cx+r*Math.cos(t),cy+r*Math.sin(t)];};
  const [x1,y1]=p(rOut,a0),[x2,y2]=p(rOut,a1),[x3,y3]=p(rIn,a1),[x4,y4]=p(rIn,a0);
  const laf=(a1-a0)>180?1:0;
  return `M ${x1.toFixed(1)} ${y1.toFixed(1)} A ${rOut} ${rOut} 0 ${laf} 1 ${x2.toFixed(1)} ${y2.toFixed(1)} L ${x3.toFixed(1)} ${y3.toFixed(1)} A ${rIn} ${rIn} 0 ${laf} 0 ${x4.toFixed(1)} ${y4.toFixed(1)} Z`;
}
function scriptText(el,deva,iast,en){
  // disc labels follow the global script toggle via CSS classes
  el.appendChild(svgEl('text',{class:'dlbl d-deva','text-anchor':'middle','dominant-baseline':'middle'},deva));
  el.appendChild(svgEl('text',{class:'dlbl d-iast','text-anchor':'middle','dominant-baseline':'middle'},iast));
  el.appendChild(svgEl('text',{class:'dlbl d-en','text-anchor':'middle','dominant-baseline':'middle'},en||iast));
}
function markDiscLevel(n){
  const host=$('#word-disc'); if(!host) return;
  host.setAttribute('data-disc-level', n<2?'stems':'full');
  initDisc();
}
function baseDeva(key){
  if(CUR&&CUR.stems){ const s=CUR.stems.find(x=>x.id===key); if(s&&s.deva) return s.deva; }
  return {kim:'किम्',tad:'तद्',yad:'यद्',sarva:'सर्व',anya:'अन्य',eka:'एक'}[key]||key;
}
function initDisc(){
  const host=$('#word-disc'); if(!host||!WORD) return;
  host.innerHTML='';
  const CX=300,CY=300;
  const svg=svgEl('svg',{viewBox:'0 0 600 600',role:'img','aria-label':'word wheel discs'});
  svg.appendChild(svgEl('circle',{cx:CX,cy:CY,r:292,fill:'#f9f7f0',stroke:'#b5aa92','stroke-width':1.5}));
  const bases=WORD.bases, ends=WORD.endings;
  const stemsOnly=curLevel()<2;
  const rings=stemsOnly?[
    {items:bases.map(b=>({key:b.slp1,deva:baseDeva(b.slp1),iast:b.iast,en:b.en})),rIn:150,rOut:286,fs:24,sel:wordSel.base,attr:'base'}
  ]:[
    {items:bases.map(b=>({key:b.slp1,deva:baseDeva(b.slp1),iast:b.iast,en:b.en})),rIn:196,rOut:286,fs:22,sel:wordSel.base,attr:'base'},
    {items:ends.map(x=>({key:x.attr,deva:x.attr==='tral'?'त्र':x.attr==='dA'?'दा':x.attr==='tasil'?'तः':'था',iast:x.attr,en:x.en+' · '+x.sutra})),rIn:104,rOut:190,fs:17,sel:wordSel.attr,attr:'attr'}
  ];
  // resolve deva labels from current derived surfaces where possible
  rings[0].items.forEach(it=>{
    const row=(WORD.rows||[]).find(r=>r.base===it.key);
    const c=row&&row.cells[wordSel.attr];
    if(c&&c.derived) it.deva=c.derived.deva;
  });
  if(rings[1]) rings[1].items.forEach(it=>{
    const row=(WORD.rows||[]).find(r=>r.base===wordSel.base);
    const c=row&&row.cells[it.key];
    if(c&&c.derived) it.deva=c.derived.deva;
  });
  rings.forEach(ring=>{
    const n=ring.items.length;
    ring.items.forEach((it,i)=>{
      const a0=i*360/n-180/n+.6, a1=i*360/n+180/n-.6;
      const g=svgEl('g',{class:'wedge'+(it.key===ring.sel?' sel':'')});
      g.appendChild(svgEl('path',{d:sectorPath(CX,CY,ring.rIn,ring.rOut,a0,a1),class:'sector'}));
      const mid=(a0+a1)/2, rr=(ring.rIn+ring.rOut)/2;
      const t=(mid-90)*Math.PI/180, x=CX+rr*Math.cos(t), y=CY+rr*Math.sin(t);
      const label=svgEl('g',{transform:`translate(${x.toFixed(1)},${y.toFixed(1)}) rotate(${(mid+90).toFixed(1)})`,'font-size':ring.fs});
      scriptText(label,it.deva,it.iast,it.en);
      g.appendChild(label);
      g.style.cursor='pointer';
      g.addEventListener('click',()=>{
        if(ring.attr==='base') wordSel.base=it.key; else wordSel.attr=it.key;
        markWordSel(); paintWordDetail(wordSel.base,wordSel.attr);
      });
      svg.appendChild(g);
    });
  });
  const c0=svgEl('circle',{cx:CX,cy:CY,r:96,fill:'#fffdfa',stroke:'#aaa18f','stroke-width':1.5});
  svg.appendChild(c0);
  const row=(WORD.rows||[]).find(r=>r.base===wordSel.base);
  const cell=row&&row.cells[wordSel.attr];
  const cen=svgEl('g',{transform:`translate(${CX},${CY-6})`,'text-anchor':'middle'});
  scriptText(cen,cell?cell.derived.deva:'—',cell?cell.derived.iast:'','');
  svg.appendChild(cen);
  const sub=svgEl('text',{x:CX,y:CY+44,'text-anchor':'middle','font-size':11,fill:'#9b7b44','letter-spacing':2},'THE CONSTRUCTION');
  svg.appendChild(sub);
  host.appendChild(svg);
}
function paintDisc(){ initDisc(); }
/* ---------- Machine B: curated engine + machine chips ---------- */
function sentState(){
  let s={};
  try{ s=JSON.parse(localStorage.getItem('svv-wheels')||'{}').sentence||{}; }catch(e){ s={}; }
  return Object.assign({subject:'i',owner:'my',gender:'m',place:'here',time:'always',predicate:'happy',mode:'statement'},s);
}
function saveSent(st){
  let all={}; try{ all=JSON.parse(localStorage.getItem('svv-wheels')||'{}'); }catch(e){}
  all.sentence=st; try{localStorage.setItem('svv-wheels',JSON.stringify(all));}catch(e){}
}
function paintSentence(){
  const out=$('#sent-out'); if(!out||!ENG||!CUR) return;
  const st=sentState();
  const r=ENG.sentence(st);
  if(!r.valid){ out.innerHTML=`<div class="cmp-note">${esc(r.error||'invalid selection')}</div>`; return; }
  const toks=(r.tokens||[]);
  loadPack().then(()=>{
    const chips=toks.map(t=>{
      const f=packFind(t,t);
      const steps=f?packSteps(f):[];
      return `<span class="tok">${tri(t,t,'')}${f&&steps.length?` <span class="psutra" title="${esc(steps.map(s=>s.sutra).join(', '))}">${steps.length} rules</span>`:` <span class="mut" title="curated teaching form, no machine trace">◇</span>`}</span>`;
    }).join(' ');
    out.innerHTML=`<div style="font-size:1.5em;line-height:2">${chips}</div>`
      + `<div>${tri(r.text,r.text,r.english)}</div>`
      + `<div class="cmp-note">■ ${esc('machine-traced')} · ◇ ${esc('curated teaching form')} — tap Machine A for derivations.</div>`
      + `<div class="mut">${esc(r.note||'')}</div>`
      + `<div class="sdetails">${(r.details||[]).map(x=>`<div><b>${esc(x.label)}</b>: ${tri(x.value,x.value,'')} <span class="mut">${esc(x.why||'')}</span></div>`).join('')}</div>`;
    markSentSel(st);
  });
  // instant paint without pack
  out.innerHTML=`<div style="font-size:1.5em;line-height:2">${toks.map(t=>tri(t,t,t)).join(' ')}</div><div>${tri(r.text,r.text,r.english)}</div>`;
  markSentSel(st);
}
function markSentSel(st){
  st=st||sentState();
  $$('#sent-rings [data-ring]').forEach(wrap=>{
    const r=wrap.getAttribute('data-ring');
    wrap.querySelectorAll('[data-opt]').forEach(b=>b.classList.toggle('on',b.getAttribute('data-opt')===st[r]));
  });
  $$('#sent-modes [data-mode]').forEach(b=>b.classList.toggle('on',b.getAttribute('data-mode')===st.mode));
  const g=$('#sent-gender'); if(g) g.value=st.gender;
}
function initSentence(){
  if(!ENG||!CUR) { const o=$('#sent-out'); if(o) o.innerHTML='<span class="mut">curated engine failed to load; static tables above still stand.</span>'; return; }
  const D=CUR;
  const host=$('#sent-rings'); host.innerHTML='';
  const mk=(id,label,items)=>{
    const div=document.createElement('div'); div.className='wring'; div.setAttribute('data-ring',id);
    div.innerHTML=`<h4>${esc(label)}</h4><div class="chips"></div>`;
    const box=div.querySelector('.chips');
    items.forEach(o=>{
      const b=document.createElement('button');
      b.setAttribute('data-opt',o.id);
      b.innerHTML=tri(o.deva,o.deva,o.en||'');
      b.addEventListener('click',()=>{ const st=sentState(); st[id]=o.id; if(id==='predicate'&&o.id!=='come'&&st.mode==='source') st.mode='statement'; saveSent(st); paintSentence(); });
      box.appendChild(b);
    });
    host.appendChild(div);
  };
  mk('subject','who',D.subjects); mk('owner','whose',D.owners);
  mk('place','where',D.places); mk('time','when',D.times); mk('predicate','does what',D.predicates);
  const modes=$('#sent-modes'); modes.innerHTML='';
  D.modes.forEach(m=>{
    const b=document.createElement('button'); b.textContent=m.label; b.setAttribute('data-mode',m.id);
    b.addEventListener('click',()=>{ const st=sentState(); st.mode=m.id; saveSent(st); paintSentence(); });
    modes.appendChild(b);
  });
  const gsel=$('#sent-gender');
  if(gsel) gsel.addEventListener('change',()=>{ const st=sentState(); st.gender=gsel.value; saveSent(st); paintSentence(); });
  const clr=$('#sent-clear');
  if(clr) clr.addEventListener('click',()=>{ saveSent({subject:'i',owner:'my',gender:'m',place:'here',time:'always',predicate:'happy',mode:'statement'}); paintSentence(); });
  paintSentence();
}
/* ---------- levels (cumulative unlock) ---------- */
const RING_LEVEL={subject:3,predicate:3,time:4,place:4,owner:5};
function curLevel(){ try{return parseInt(localStorage.getItem('svv-wlevel')||'6',10)||6;}catch(e){return 6;} }
function applyRingVisibility(){
  const n=curLevel();
  $$('#sent-rings [data-ring]').forEach(w=>{
    w.style.display=(RING_LEVEL[w.getAttribute('data-ring')]||6)<=n?'':'none';
  });
  const modes=$('#sent-modes'), gl=document.querySelector('label[data-min]');
  if(modes) modes.style.display=n>=5?'':'none';
  if(gl) gl.style.display=n>=5?'':'none';
}
function setLevel(n){
  try{localStorage.setItem('svv-wlevel',String(n));}catch(e){}
  const sel=$('#wheel-level'); if(sel) sel.value=String(n);
  applyRingVisibility();
  markDiscLevel(n); paintSentence(); renderDrill();
}
function initLevels(){
  const sel=$('#wheel-level'); if(!sel) return;
  sel.value=String(curLevel());
  sel.addEventListener('change',()=>setLevel(parseInt(sel.value,10)||6));
  setLevel(curLevel());
}
/* ---------- Trika + karaka (option wheels) ---------- */
function initOptionWheels(){
  if(TRIKA) $$('[data-trika] [data-opt]').forEach(b=>b.addEventListener('click',()=>{
    const wrap=b.closest('[data-trika]');
    wrap.querySelectorAll('[data-opt]').forEach(x=>x.classList.remove('on'));
    b.classList.add('on');
    const w=(TRIKA.wheels||[]).find(x=>x.id===wrap.getAttribute('data-trika'));
    const o=w&&(w.options||[]).find(x=>x.id===b.getAttribute('data-opt'));
    const d=wrap.querySelector('.trika-detail');
    if(d&&o){
      d.innerHTML=`<b>${tri(o.label,o.label,o.en)}</b><div>${esc(o.gloss)}</div>`
        +(o.concept_ref?`<div class="mut">concept: ${esc(o.concept_ref.term)} — ${esc(o.concept_ref.definition)} <span class="mut">(${esc(o.concept_ref.file)})</span></div>`:`<div class="mut">source: pending — teaching gloss, no concept file yet. Not doctrine.</div>`);
    }
  }));
  const KARA=readJSON('wheel-karaka');
  if(KARA) $$('[data-karaka] [data-opt]').forEach(b=>b.addEventListener('click',()=>{
    const wrap=b.closest('[data-karaka]');
    wrap.querySelectorAll('[data-opt]').forEach(x=>x.classList.remove('on'));
    b.classList.add('on');
    const w=(KARA.wheels||[]).find(x=>x.id===wrap.getAttribute('data-karaka'));
    const o=w&&(w.options||[]).find(x=>x.id===b.getAttribute('data-opt'));
    const d=wrap.querySelector('.karaka-detail');
    if(d&&o){
      d.innerHTML=`<b>${tri(o.label,o.label,o.en)}</b><div>${esc(o.gloss)}</div>`
        +`<div>sūtra ${esc(o.sutra)} <span class="mut">${esc(o.sutra_iast)}</span> · wears ${esc(o.vibhakti)}</div>`
        +`<div>e.g. ${tri(o.example,o.example,o.example_en)} <span class="mut">(${esc(o.example_src)})</span></div>`;
    }
  }));
}
/* ---------- Drill (SRS) ---------- */
function cardLevel(kind, s){
  if(kind==='word') return 2;
  if(!s) return 3;
  if(s.mode&&s.mode!=='statement') return 5;
  if(s.owner&&s.owner!=='my') return 5;
  if((s.place&&s.place!=='none')||(s.time&&s.time!=='none')) return 4;
  return 3;
}
function drillDeck(){
  const deck=[];
  if(CUR&&ENG){
    CUR.stems.forEach(st=>CUR.endings.forEach(end=>{
      const f=ENG.stemWord(st.id,end.id);
      if(f) deck.push({id:`w:${st.id}:${end.id}`,kind:'word',level:2,q:`${f.en} (${st.en} + ${end.en})`,hint:st.deva,answer:f.word,note:f.formula});
    }));
    [
      {q:'I am here.',s:{subject:'i',place:'here',time:'none',predicate:'be'}},
      {q:'My mother is there.',s:{subject:'mother',owner:'my',place:'there',time:'none',predicate:'be'}},
      {q:'I am always happy.',s:{subject:'i',place:'none',time:'always',predicate:'happy'}},
      {q:'Where is my mother?',s:{subject:'mother',owner:'my',place:'none',time:'none',predicate:'be',mode:'where'}},
      {q:'I go there.',s:{subject:'i',place:'there',time:'none',predicate:'go'}},
      {q:'When do you study?',s:{subject:'you',place:'none',time:'none',predicate:'study',mode:'when'}},
      {q:'Where do you come from?',s:{subject:'you',place:'none',time:'none',predicate:'come',mode:'source'}},
      {q:'My mother is always happy.',s:{subject:'mother',owner:'my',place:'none',time:'always',predicate:'happy'}},
      {q:'My father is here.',s:{subject:'father',owner:'my',place:'here',time:'none',predicate:'be'}},
      {q:'You are happy there.',s:{subject:'you',place:'there',time:'none',predicate:'happy'}}
    ].forEach((c,i)=>{
      const out=ENG.sentence(Object.assign({},ENG.initialState,c.s));
      if(out.valid) deck.push({id:`s:${i}`,kind:'say it',level:cardLevel('s',c.s),q:c.q,hint:'Build the full sentence',answer:out.text,note:out.english});
    });
  }
  const lv=curLevel();
  return deck.filter(x=>(x.level||6)<=lv);
}
const DKEY='svv-wheel-drill-v1';
function drillLoad(){ try{return new Set(JSON.parse(localStorage.getItem(DKEY)||'[]'));}catch(e){return new Set();} }
function drillSave(s){ try{localStorage.setItem(DKEY,JSON.stringify([...s]));}catch(e){} }
let drillShown=false, drillMisses=0;
function initDrill(){
  const host=$('#drill'); if(!host) return;
  if(!CUR||!ENG){ host.innerHTML='<span class="mut">drill needs the curated engine; tables above still stand.</span>'; return; }
  renderDrill();
  $('#drill-reset').addEventListener('click',()=>{
    if(!window.confirm('Reset mastered cards on this device?')) return;
    drillSave(new Set()); drillMisses=0; drillShown=false; renderDrill();
  });
}
function renderDrill(){
  const host=$('#drill'); if(!host) return;
  const deck=drillDeck();
  const mastered=drillLoad();
  const queue=deck.filter(x=>!mastered.has(x.id));
  $('#drill-count').textContent=`${mastered.size} / ${deck.length} mastered · ${drillMisses} retries`;
  const bar=$('#drill-bar'); if(bar) bar.style.width=`${deck.length?100*mastered.size/deck.length:0}%`;
  const body=$('#drill-body'), btns=$('#drill-btns');
  body.innerHTML=''; btns.innerHTML='';
  if(!queue.length){
    if(curLevel()<2){
      body.innerHTML=`<p class="mut">Cards unlock from Level 2 — spin the bases ring first, then come back.</p>`; return;
    }
    body.innerHTML=`<div style="font-size:2em">सिद्धम्</div><h3>Everything mastered.</h3><p class="mut">Reset the deck or pick a higher level.</p>`; return;
  }
  const q=queue[0];
  body.innerHTML=`<div class="mut">${esc(q.kind)}</div><h3>${tri(q.q,q.q,'')}</h3><div class="mut">${tri(q.hint,q.hint,'')}</div>`;
  if(drillShown){
    body.innerHTML+=`<div style="font-size:1.8em">${tri(q.answer,q.answer,'')}</div><div class="mut">${esc(q.note||'')}</div>`;
    const miss=document.createElement('button'); miss.textContent='↺ Missed · repeat';
    miss.addEventListener('click',()=>{ drillMisses++; drillShown=false; renderDrill(); });
    const got=document.createElement('button'); got.className='primary'; got.textContent='✓ Got it · remove';
    got.addEventListener('click',()=>{ const m=drillLoad(); m.add(q.id); drillSave(m); drillShown=false; renderDrill(); });
    btns.append(miss,got);
  } else {
    body.innerHTML+=`<p class="mut">Say it aloud. Then reveal.</p>`;
    const rev=document.createElement('button'); rev.className='primary'; rev.textContent='Reveal the answer';
    rev.addEventListener('click',()=>{ drillShown=true; renderDrill(); });
    btns.appendChild(rev);
  }
}
document.addEventListener('DOMContentLoaded',()=>{ initToggle(); initLevels(); initWord(); initSentence(); initOptionWheels(); initDrill(); applyRingVisibility(); });
})();
