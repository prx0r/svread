/* journey.js — guided circle completion for the wheels.
   Standalone (own loaders; runs after wheels.js). One circle at a time,
   built from the center outward: each layer unlocks at >=90% over >=10
   tries, and every layer's quiz re-drills all earlier layers (cumulative).
   A per-layer "ChatGPT prompt" button copies a co-teaching brief encoding
   exactly the items on file — the model explains and tests, the page scores. */
(function(){
'use strict';
const $ = s=>document.querySelector(s);
const $$ = s=>Array.from(document.querySelectorAll(s));
const esc = s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function readJSON(id){
  try{ const el=document.getElementById(id); return el?JSON.parse(el.textContent):null; }
  catch(e){ return null; }
}
function tri(deva,iast,en){
  en=(en==null||en==='')?iast:en;
  return `<span class="tri"><span class="t-deva">${esc(deva||'')}</span><span class="t-iast"><i>${esc(iast||'')}</i></span><span class="t-en">${esc(en||'')}</span></span>`;
}
function jt(o){ return tri(o.t,o.i||o.t,o.e!=null?o.e:o.t); }
const WORD = readJSON('wheel-word');
const CUR = (typeof window!=='undefined') ? window.SanskritData : null;
const ENG = (typeof window!=='undefined') ? window.SanskritEngine : null;
const NS='http://www.w3.org/2000/svg';
function svgEl(n,attrs,text){
  const el=document.createElementNS(NS,n);
  for(const k of Object.keys(attrs||{})) el.setAttribute(k,attrs[k]);
  if(text!==undefined) el.textContent=text;
  return el;
}
/* ---------- state ---------- */
const JKEY='svv-journey-v1';
function jload(){ try{return JSON.parse(localStorage.getItem(JKEY)||'{}');}catch(e){return {};} }
function jsave(s){ try{localStorage.setItem(JKEY,JSON.stringify(s));}catch(e){} }
function jstate(){
  const s=jload();
  s.word=s.word||{layer:1,asked:0,correct:0};
  s.sentence=s.sentence||{layer:1,asked:0,correct:0};
  if(!s.sentence.layer) s.sentence.layer=1; // locked by the circle button until the word circle is done
  return s;
}
function wordDone(st){ return st.word.layer>4; }
/* ---------- layers ---------- */
function endDeva(attr){ return attr==='tral'?'त्र':attr==='dA'?'दा':attr==='tasil'?'तः':'था'; }
// item: {id, q, qSub, options:[{t, sub}], answer, layer}
function wordItems(layer){
  if(!WORD) return [];
  const items=[];
  const bases=WORD.bases, ends=WORD.endings;
  if(layer>=1) bases.forEach(b=>items.push({id:'b:'+b.slp1,layer:1,
    q:'which base means “'+b.en+'” (what? / that / …)?', qSub:'bases',
    options:bases.map(x=>({t:({kim:'किम्',tad:'तद्',yad:'यद्',sarva:'सर्व',anya:'अन्य',eka:'एक'}[x.slp1]),i:x.iast,e:x.en})),
    answer:({kim:'किम्',tad:'तद्',yad:'यद्',sarva:'सर्व',anya:'अन्य',eka:'एक'}[b.slp1])}));
  if(layer>=2) ends.forEach(e=>items.push({id:'e:'+e.attr,layer:2,
    q:'which ending answers “'+e.en+'” ('+e.sutra+')?', qSub:'endings',
    options:ends.map(x=>({t:endDeva(x.attr),i:x.attr,e:x.en+' · '+x.sutra})),
    answer:endDeva(e.attr)}));
  const cellItems=(onlyBases)=>{
    const out=[];
    (WORD.rows||[]).forEach(r=>{
      if(onlyBases&&!onlyBases.includes(r.base)) return;
      ends.forEach(e=>{
        const c=r.cells[e.attr]; if(!c||!c.derived) return;
        const others=[];
        (WORD.rows||[]).forEach(r2=>ends.forEach(e2=>{
          const c2=r2.cells[e2.attr];
          if(c2&&c2.derived&&c2.derived.deva!==c.derived.deva&&others.length<12) others.push(c2.derived.deva);
        }));
        const opts=[c.derived.deva];
        const seen=new Set(opts);
        // deterministic distractors: rotate by cell position
        let k=(r.base.length+e.attr.length)%Math.max(1,others.length);
        while(opts.length<4&&others.length){ const o=others[k%others.length]; if(!seen.has(o)){opts.push(o);seen.add(o);} k++; if(k>others.length+4) break; }
        out.push({id:'c:'+r.base+'-'+e.attr,layer:onlyBases?3:4,
          q:'build: '+r.base_en+' + '+e.en+' → ?', qSub:'cells',
          options:opts.map(t=>({t,i:t,e:''})), answer:c.derived.deva});
      });
    });
    return out;
  };
  if(layer>=3) items.push(...cellItems(['kim','sarva']));
  if(layer>=4) items.push(...cellItems(null).filter(x=>!x.id.startsWith('c:kim-')&&!x.id.startsWith('c:sarva-')));
  return items.filter(x=>x.layer<=layer);
}
function sentItems(layer){
  if(!CUR||!ENG) return [];
  const items=[];
  const D=CUR;
  if(layer>=1) D.subjects.forEach(su=>{
    const forms=[...new Set(D.predicates.map(p=>p.forms[{i:'first',you:'second',mother:'third',father:'third'}[su.id]||'third']))];
    while(forms.length<4) forms.push('—');
    items.push({id:'s:'+su.id,layer:1,
      q:'subject “'+su.en+'” takes which “be” verb?', qSub:'agreement',
      options:forms.slice(0,4).map(t=>({t,i:t,e:''})),
      answer:({i:'अस्मि',you:'असि',mother:'अस्ति',father:'अस्ति'}[su.id])});
  });
  if(layer>=2){
    const states=[
      {s:{subject:'i',place:'there',time:'none',predicate:'be'},label:'I am there.'},
      {s:{subject:'i',place:'none',time:'always',predicate:'happy'},label:'I am always happy.'},
      {s:{subject:'mother',owner:'my',place:'there',time:'none',predicate:'be'},label:'My mother is there.'},
      {s:{subject:'you',place:'there',time:'none',predicate:'go'},label:'You go there.'}
    ];
    states.forEach((st,i)=>{
      const out=ENG.sentence(Object.assign({},ENG.initialState,st.s));
      if(!out.valid) return;
      const distract=states.filter((_,j)=>j!==i).slice(0,3).map(d=>{
        const o=ENG.sentence(Object.assign({},ENG.initialState,d.s)); return o.valid?o.text:'—';
      });
      items.push({id:'s2:'+i,layer:2,q:'which Sanskrit says “'+st.label+'”?',qSub:'sentences',
        options:[out.text,...distract].map(t=>({t,i:t,e:''})),answer:out.text});
    });
  }
  if(layer>=3){
    const modes=[{m:'where',s:{subject:'you',place:'none',time:'none',predicate:'be',mode:'where'}},
                 {m:'when',s:{subject:'you',place:'none',time:'none',predicate:'study',mode:'when'}},
                 {m:'how',s:{subject:'you',place:'none',time:'none',predicate:'happy',mode:'how'}}];
    modes.forEach((mo,i)=>{
      const out=ENG.sentence(Object.assign({},ENG.initialState,mo.s));
      if(!out.valid) return;
      const distract=modes.filter((_,j)=>j!==i).slice(0,3).map(d=>{
        const o=ENG.sentence(Object.assign({},ENG.initialState,d.s)); return o.valid?o.text:'—';
      });
      items.push({id:'s3:'+i,layer:3,q:'ask it (“'+mo.m+'?”) — which sentence?',qSub:'questions',
        options:[out.text,...distract].map(t=>({t,i:t,e:''})),answer:out.text});
    });
  }
  return items.filter(x=>x.layer<=layer);
}
/* ---------- quiz sampling (cumulative: half current, half earlier) ---------- */
function pick(pool,n,layer){
  const cur=pool.filter(x=>x.layer===layer), old=pool.filter(x=>x.layer<layer);
  const out=[], seen=new Set();
  const take=(arr,k)=>{ let i=arr.length? (layer*7+3)%arr.length : 0;
    for(let t=0;t<arr.length&&out.length<k;t++){ const it=arr[(i+t*3)%arr.length];
      if(!seen.has(it.id)){seen.add(it.id);out.push(it);} } };
  take(cur,Math.ceil(n/2)); take(old,n-out.length);
  take(pool,n-out.length);
  return out;
}
/* ---------- journey UI ---------- */
let JQ=null; // current question
function circleLabel(c){ return c==='word'?'Word circle':'Sentence circle'; }
function maxLayer(c){ return c==='word'?4:3; }
function layerName(c,l){
  return c==='word'
    ? ['','1 · Bases','2 · Endings','3 · First words','4 · Full grid'][l]
    : ['','1 · Who does','2 · Sentences','3 · Asking'][l];
}
function renderJourney(){
  const host=$('#journey'); if(!host||!WORD) return;
  const st=jstate();
  const circle=st.circle||'word';
  const sl=circle==='word'?st.word:st.sentence;
  host.innerHTML=`
    <h2>Journey: build the circle from the center</h2>
    <p class="mut">One circle at a time. Each layer unlocks at <b>90% over 10+ tries</b>; every layer re-drills the earlier ones — that is the whole method. ChatGPT can co-teach: copy the prompt, paste it there, talk it through, then come back and prove it here.</p>
    <div class="chips" id="j-circles">
      <button data-c="word">Word circle ${wordDone(st)?'· done ✓':''}</button>
      <button data-c="sentence" ${wordDone(st)?'':'disabled title="finish the word circle first"'}>Sentence circle ${st.sentence.layer>3?'· done ✓':''}</button>
    </div>
    <div id="j-disc" aria-label="journey disc"></div>
    <div id="j-progress" class="mut"></div>
    <div id="j-layers" class="chips"></div>
    <div id="j-quiz"></div>
    <div style="margin-top:.5rem;display:flex;gap:.5rem;flex-wrap:wrap">
      <button id="j-copy">copy ChatGPT prompt for this layer</button>
      <button id="j-reset">reset journey</button>
    </div>
    <div id="j-msg" class="mut"></div>`;
  $$('#j-circles button').forEach(b=>b.addEventListener('click',()=>{
    if(b.disabled) return;
    const s=jstate(); s.circle=b.getAttribute('data-c'); jsave(s); renderJourney();
  }));
  renderDisc(circle,sl.layer);
  renderLayers(circle,sl);
  nextQuestion(circle);
  $('#j-copy').addEventListener('click',()=>copyPrompt(circle));
  $('#j-reset').addEventListener('click',()=>{
    if(!window.confirm('Reset journey progress on this device?')) return;
    jsave({}); renderJourney();
  });
}
function renderLayers(circle,sl){
  const box=$('#j-layers'); if(!box) return;
  box.innerHTML='';
  for(let l=1;l<=maxLayer(circle);l++){
    const locked=l>sl.layer;
    const b=document.createElement('button');
    b.textContent=layerName(circle,l)+(l<sl.layer?' ✓':locked?' · locked':' · current');
    b.disabled=locked;
    b.addEventListener('click',()=>{ /* layers advance only by passing */ });
    box.appendChild(b);
  }
  const pct=sl.asked?Math.round(100*sl.correct/sl.asked):0;
  $('#j-progress').innerHTML=`${esc(circleLabel(circle))} · layer ${sl.layer>maxLayer(circle)?'complete':sl.layer} · score ${sl.correct}/${sl.asked} (${pct}%) · unlock at 90% over 10+`;
}
function sectorPath(cx,cy,rIn,rOut,a0,a1){
  const p=(r,a)=>{const t=(a-90)*Math.PI/180;return [cx+r*Math.cos(t),cy+r*Math.sin(t)];};
  const [x1,y1]=p(rOut,a0),[x2,y2]=p(rOut,a1),[x3,y3]=p(rIn,a1),[x4,y4]=p(rIn,a0);
  return `M ${x1.toFixed(1)} ${y1.toFixed(1)} A ${rOut} ${rOut} 0 1 1 ${x2.toFixed(1)} ${y2.toFixed(1)} L ${x3.toFixed(1)} ${y3.toFixed(1)} A ${rIn} ${rIn} 0 1 0 ${x4.toFixed(1)} ${y4.toFixed(1)} Z`;
}
function renderDisc(circle,layer){
  const host=$('#j-disc'); if(!host) return;
  host.innerHTML='';
  const N=maxLayer(circle), CX=200, CY=200;
  const svg=svgEl('svg',{viewBox:'0 0 400 400',role:'img','aria-label':'journey progress disc'});
  svg.appendChild(svgEl('circle',{cx:CX,cy:CY,r:190,fill:'#f9f7f0',stroke:'#b5aa92','stroke-width':1.5}));
  for(let l=1;l<=N;l++){
    const rOut=190-(l-1)*38, rIn=rOut-34;
    const done=l<layer, cur=l===layer;
    const g=svgEl('g',{class:'wedge'+(done?' sel':'')});
    g.appendChild(svgEl('path',{d:sectorPath(CX,CY,rIn,rOut,0,359.9),class:'sector',
      fill:done?'#e8d9a8':cur?'#fff':'#eee',opacity:cur?1:(done?1:.55)}));
    const t=svgEl('text',{x:CX,y:CY-(rIn+rOut)/2+5,'text-anchor':'middle','font-size':13,fill:done?'#1c4655':'#57666b'},
      (done?'✓ ':l>layer?'locked · ':'')+layerName(circle,l));
    svg.appendChild(g); svg.appendChild(t);
  }
  const c=svgEl('text',{x:CX,y:CY+6,'text-anchor':'middle','font-size':17,'font-weight':700,fill:'#1c4655'},
    circle==='word'?'पदम्':'वाक्यम्');
  svg.appendChild(c); host.appendChild(svg);
}
function nextQuestion(circle){
  const st=jstate();
  const sl=circle==='word'?st.word:st.sentence;
  if(sl.layer>maxLayer(circle)){
    $('#j-quiz').innerHTML=`<div style="font-size:2em">सिद्धम्</div><p><b>${esc(circleLabel(circle))} complete.</b> ${circle==='word'?'The sentence circle is open.':'You built it from the center.'}</p>`;
    return;
  }
  const pool=circle==='word'?wordItems(sl.layer):sentItems(sl.layer);
  if(!pool.length){ $('#j-quiz').innerHTML='<span class="mut">loading items…</span>'; return; }
  const quiz=pick(pool,4,sl.layer);
  const q=quiz[(sl.asked*5+sl.layer)%quiz.length];
  // 4 options: answer + 3 distractors from the same pool
  const distract=pool.filter(x=>x.answer!==q.answer).map(x=>x.answer);
  const seen=new Set([q.answer]), opts=[q.answer];
  let k=(sl.asked*3+1)%Math.max(1,distract.length);
  while(opts.length<4&&distract.length){ const o=distract[k%distract.length]; if(!seen.has(o)){opts.push(o);seen.add(o);} k++; if(k>distract.length+4) break; }
  const flip=(sl.asked%2===0)?1:-1;
  const order=opts.map((t,i)=>({t,i})).sort((a,b)=>flip*(a.i-b.i));
  JQ={qid:q.id,answer:q.answer};
  $('#j-quiz').innerHTML=`<div class="mut">${esc(q.qSub||'')} · layer ${sl.layer}</div><h3>${esc(q.q)}</h3>`
    + `<div class="chips">`+order.map(o=>`<button data-a="${esc(o.t)}">${jt(o)}</button>`).join('')+`</div><div id="j-fb" class="mut"></div>`;
  $$('#j-quiz [data-a]').forEach(b=>b.addEventListener('click',()=>grade(circle,b.getAttribute('data-a'))));
}
function grade(circle,given){
  if(!JQ) return;
  const st=jstate();
  const sl=circle==='word'?st.word:st.sentence;
  sl.asked++; const ok=given===JQ.answer; if(ok) sl.correct++;
  const pct=Math.round(100*sl.correct/sl.asked);
  const fb=$('#j-fb');
  if(fb) fb.innerHTML=ok?'<b>correct.</b>':`<b>not quite</b> — the wheel says ${tri(JQ.answer,JQ.answer,'')}.`;
  if(sl.asked>=10&&pct>=90&&sl.layer<=maxLayer(circle)&&(sl.passed||0)<sl.layer){
    sl.passed=sl.layer; sl.layer++; sl.asked=0; sl.correct=0; // fresh 10 for the new layer
    if(fb) fb.innerHTML+=` <b>Layer ${sl.layer-1} complete — the next ring opens. Fresh score from here.</b>`;
  }
  if(circle==='word') st.word=sl; else st.sentence=sl;
  jsave(st); JQ=null;
  if(sl.layer>maxLayer(circle)){ setTimeout(()=>renderJourney(), ok?900:2000); return; }
  setTimeout(()=>{ renderLayers(circle,sl); renderDisc(circle,sl.layer); nextQuestion(circle); }, ok?700:1800);
}
function copyPrompt(circle){
  const st=jstate();
  const sl=circle==='word'?st.word:st.sentence;
  const pool=(circle==='word'?wordItems(Math.min(sl.layer,maxLayer(circle))):sentItems(Math.min(sl.layer,maxLayer(circle))));
  const items=pool.slice(0,24).map(x=>`${x.answer}`).join(', ');
  const tutor=circle==='word'
    ? (sl.layer<=2?'https://svatantrya.net/data/wheels/tutor/level-0'+sl.layer+'-'+(sl.layer===1?'bases':'endings')+'.md':'https://svatantrya.net/data/wheels/tutor/level-02-endings.md')
    : 'https://svatantrya.net/data/wheels/tutor/level-0'+(sl.layer+2)+'-'+['subject-verb','time-place','questions'][Math.min(sl.layer,3)-1]+'.md';
  const txt=`Teach me the Sanskrit ${circleLabel(circle).toLowerCase()}, layer ${sl.layer} (${layerName(circle,Math.min(sl.layer,maxLayer(circle)))}). My score here: ${sl.correct}/${sl.asked}.\n\nThe ONLY forms that exist in this layer: ${items}.\nRules: teach nothing outside that list — say "not in this layer yet" instead. Explain each form once, then test me aloud, 10 questions, keep score, and tell me my percentage. Earlier layers are already mine; mix them in.\nReference (machine-readable): ${tutor}\nVerify any derivation at https://svatantrya.net/data/grammar/crosscheck.json. Begin.`;
  const done=ok=>{
    const m=$('#j-msg'); if(m) m.textContent=ok?'Prompt copied — paste it into ChatGPT and talk it through. Then come back and prove it here.':'Copy failed — select and copy manually.';
  };
  if(navigator.clipboard&&window.isSecureContext){ navigator.clipboard.writeText(txt).then(()=>done(true),()=>done(false)); }
  else{
    const t=document.createElement('textarea'); t.value=txt; document.body.appendChild(t); t.select();
    try{ done(document.execCommand('copy')); }catch(e){ done(false); } t.remove();
  }
}
/* ---- server-scored gates (server records the score; practice check, not mastery) ----
   When signed in, quizzes run as server sessions: the server samples,
   shuffles, holds the key, scores, and writes the unlock. The local drill
   stays for signed-out practice, labelled unverified. */
const SRV_API = (typeof window!=='undefined' && window.SVREAD_API) || 'https://ipvv-api.tradesprior.workers.dev';
const SRV = {me: null, progress: null, progressState: 'signed-out', session: null, busy: false};
async function srvJson(path, opts){
  const r = await fetch(SRV_API + path, Object.assign({credentials:'include'}, opts||{}));
  let j = null; try{ j = await r.json(); }catch(e){ j = null; }
  if(!r.ok) throw new Error((j&&j.error)||('http '+r.status));
  return j;
}
async function srvSync(){
  try{
    const me = await srvJson('/api/auth/me');
    SRV.me = (me && me.profile) || null;
  }catch(e){ SRV.me = null; }
  if(SRV.me){
    try{
      const pr = await srvJson('/api/wheel/progress');
      const m = {};
      for(const p of (pr.progress||[])) m[p.curriculum] = p;
      SRV.progress = m; SRV.progressState = 'ok';
    }catch(e){ SRV.progress = null; SRV.progressState = 'failed'; }
  } else { SRV.progress = null; SRV.progressState = 'signed-out'; }
  paintSrvBanner();
  return SRV;
}
function srvStage(circle){
  if(!SRV.progress) return null;
  const p = SRV.progress[circle];
  if(!p) return 1;
  return Math.min(Number(p.stage)||1, maxLayer(circle)+1);
}
function paintSrvBanner(){
  let el = document.getElementById('j-srv');
  if(!el){
    const host = document.getElementById('journey');
    if(!host) return;
    el = document.createElement('div');
    el.id = 'j-srv'; el.setAttribute('class','mut');
    host.insertBefore(el, host.firstChild);
  }
  if(SRV.me && SRV.progressState === 'ok'){
    const w = (SRV.progress && SRV.progress.word) || {stage:1};
    const sn = (SRV.progress && SRV.progress.sentence) || {stage:1};
    el.innerHTML = 'signed in as <b>'+esc(SRV.me.display_name||SRV.me.email||'scholar')+'</b> · server-recorded practice progress · word layer '+esc(String(Math.min(w.stage,5)))+' · sentence layer '+esc(String(Math.min(sn.stage,4)))+' · <span class="mut">low-stakes check, not mastery · ChatGPT uses the same record</span>';
  } else if(SRV.me){
    el.innerHTML = 'signed in as <b>'+esc(SRV.me.display_name||SRV.me.email||'scholar')+'</b> · <span class="cmp-note">progress unavailable right now — nothing is being recorded. Try again shortly; local practice below still works.</span>';
  } else {
    el.textContent = 'practising locally (unverified) — sign in via the Scholar tab to make scores count.';
  }
}
function srvQuizHtml(it, i, n){
  return '<div class="mut">scored gate · question '+(i+1)+' of '+n+' · answers stay on the server</div><h3>'+esc(it.prompt)+'</h3>'
    + '<div class="chips">'+it.options.map(o=>'<button data-sa="'+esc(o)+'">'+esc(o)+'</button>').join('')+'</div><div id="j-fb" class="mut"></div>';
}
async function srvStart(circle){
  if(SRV.busy) return;
  const st = jstate(); const sl = circle==='word'?st.word:st.sentence;
  const stage = srvStage(circle) || sl.layer;
  if(stage > maxLayer(circle)){ return; }
  SRV.busy = true;
  try{
    const r = await srvJson('/api/wheel/gate/start', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({curriculum:circle, stage})});
    SRV.session = {circle, stage, id:r.session_id, items:r.items, idx:0, answers:[]};
    srvRenderQ();
  }catch(e){
    const fb = document.getElementById('j-fb'); const m = document.getElementById('j-msg');
    const msg = 'gate unavailable: '+e.message;
    if(fb) fb.textContent = msg; else if(m) m.textContent = msg;
  }finally{ SRV.busy = false; }
}
function srvRenderQ(){
  const s = SRV.session; if(!s) return;
  const it = s.items[s.idx];
  if(!it){ srvSubmit(); return; }
  const box = document.getElementById('j-quiz');
  box.innerHTML = srvQuizHtml(it, s.idx, s.items.length);
  Array.prototype.forEach.call(box.querySelectorAll('[data-sa]'), function(b){
    b.addEventListener('click', function(){
      s.answers.push({item_id: it.item_id, choice: b.getAttribute('data-sa')});
      s.idx++;
      if(s.idx >= s.items.length) srvSubmit(); else srvRenderQ();
    });
  });
}
async function srvSubmit(){
  const s = SRV.session; if(!s) return;
  SRV.session = null;
  const box = document.getElementById('j-quiz');
  box.innerHTML = '<span class="mut">scoring on the server…</span>';
  try{
    const r = await srvJson('/api/wheel/gate/submit', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({session_id:s.id, answers:s.answers})});
    let html = '<div><b>server verdict: '+r.score+'/'+r.total+(r.passed?' — PASS':' — not yet')+'</b></div>';
    html += '<div class="mut">receipt kept server-side · replaying this session changes nothing</div>';
    if(r.passed && r.unlock){
      html += r.unlock.done
        ? '<div><b>'+esc(circleLabel(s.circle))+' complete.</b> The next circle opens when its gate is passed.</div>'
        : '<div>Layer complete — next layer unlocked.</div>';
    } else if(!r.passed){
      html += '<div class="mut">under 18/20. Earlier layers were mixed in on purpose — that is the method.</div>';
    }
    box.innerHTML = html;
    try{
      const pr = await srvJson('/api/wheel/progress');
      const m = {};
      for(const p of (pr.progress||[])) m[p.curriculum] = p;
      SRV.progress = m; paintSrvBanner();
    }catch(e){}
  }catch(e){
    box.innerHTML = '<span class="mut">submit failed: '+esc(e.message)+' — start a fresh gate.</span>';
  }
}
function srvStartButton(circle){
  const st = jstate(); const sl = circle==='word'?st.word:st.sentence;
  const stage = (SRV.me && srvStage(circle)) || sl.layer;
  if(stage > maxLayer(circle)) return '';
  return '<div style="margin:.5rem 0"><button id="j-gate">start scored gate · '+esc(layerName(circle,stage))+' (20 questions, 18 to pass)</button> <span class="muted">server-scored, receipt kept</span></div>';
}
const _renderJourneyOrig = renderJourney;
renderJourney = function(){
  _renderJourneyOrig();
  srvSync().then(()=>{
    paintSrvBanner();
    if(!SRV.me || SRV.progressState !== 'ok') return;
    const st = jstate(); const circle = st.circle||'word';
    const box = document.getElementById('j-quiz');
    if(box && !SRV.session){
      const w = document.createElement('div');
      w.innerHTML = srvStartButton(circle);
      box.insertBefore(w, box.firstChild);
      const b = document.getElementById('j-gate');
      if(b) b.addEventListener('click', function(){ srvStart(circle); });
    } else if(box && SRV.session && SRV.session.circle !== circle){
      SRV.session = null;
    }
  }).catch(()=>{});
};
document.addEventListener('DOMContentLoaded',()=>{ renderJourney(); });
})();
