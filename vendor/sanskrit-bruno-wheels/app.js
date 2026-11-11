/** Sanskrit Bruno Wheels · offline interactive SVG renderer and controller */
(function () {
  'use strict';
  const D=window.SanskritData, E=window.SanskritEngine;
  const $=id=>document.getElementById(id), NS='http://www.w3.org/2000/svg';
  const $svg=(name,attributes={})=>{
    const el=document.createElementNS(NS,name);
    for(const [key,value] of Object.entries(attributes)) el.setAttribute(key,String(value));
    return el;
  };
  const add=(parent,tag,attrs={},text)=>{
    const el=$svg(tag,attrs);if(text!==undefined)el.textContent=text;parent.appendChild(el);return el;
  };
  const pos=(r,deg)=>{const t=(deg-90)*Math.PI/180;return [300+r*Math.cos(t),300+r*Math.sin(t)];};
  const sector=(r1,r2,start,end)=>{
    const p1=pos(r2,start),p2=pos(r2,end),p3=pos(r1,end),p4=pos(r1,start);
    return `M ${p1.join(' ')} A ${r2} ${r2} 0 0 1 ${p2.join(' ')} L ${p3.join(' ')} A ${r1} ${r1} 0 0 0 ${p4.join(' ')} Z`;
  };
  const palette=[['#e6eff0','#c7dce0','#2e6071'],['#f6eddd','#ecdbb3','#836327'],['#e9ede9','#d5e2d4','#466c62'],['#f4eee9','#e3d4ca','#765c56'],['#e7eaf0','#d0d9e6','#405b70']];
  function wheel(target,rings,center,subtitle) {
    const svg=$(target);svg.replaceChildren();
    add(svg,'title',{},target==='word-svg'?'The Sanskrit word wheel':'The Sanskrit sentence wheel');
    add(svg,'desc',{},'Select a sector or use the arrow buttons to rotate independent grammatical rings.');
    add(svg,'circle',{cx:300,cy:300,r:290,fill:'#f9f7f0',stroke:'#b5aa92','stroke-width':1.5});
    for(let i=0;i<72;i++){
      const a=i*5,p1=pos(i%3===0?281:285,a),p2=pos(289,a);
      add(svg,'line',{x1:p1[0],y1:p1[1],x2:p2[0],y2:p2[1],stroke:'#b2a98e','stroke-width':i%3===0?1.4:.6});
    }
    rings.forEach((ring,ringI)=>{
      const [pale,active,ink]=palette[ringI%palette.length];const n=ring.items.length;
      for(let j=0;j<n;j++){
        const item=ring.items[(ring.index+j)%n];
        const g=add(svg,'g',{class:'wedge',role:'button',tabindex:0,'aria-label':`${ring.title}: ${item.en||item.deva}; select`});
        add(g,'title',{},`${ring.title}: ${item.deva} (${item.en||'none'})`);
        const start=j*360/n-180/n+.5,end=j*360/n+180/n-.5;
        add(g,'path',{class:'sector',d:sector(ring.inner,ring.outer,start,end),fill:j===0?active:pale,stroke: '#b7af9d','stroke-width':j===0?2:1});
        const mid=pos((ring.inner+ring.outer)/2,j*360/n);
        add(g,'text',{x:mid[0],y:mid[1]+1,'text-anchor':'middle','dominant-baseline':'middle',class:'wheel-text','font-family':'Noto Sans Devanagari, Nirmala UI, Mangal, sans-serif',fill:j===0?ink:'#57666b','font-size':ring.fontSize||19,'font-weight':j===0?750:450},item.deva);
        const callback=()=>ring.select((ring.index+j)%n);
        g.addEventListener('click',callback);
        g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();callback();}});
      }
    });
    const radius=Math.min(...rings.map(x=>x.inner))-5;
    add(svg,'circle',{cx:300,cy:300,r:radius,fill:'#fffdfa',stroke:'#aaa18f','stroke-width':1.5});
    add(svg,'circle',{cx:300,cy:300,r:radius-6,fill:'none',stroke:'#ded5c1','stroke-width':.8});
    const textSize=center.length>12?17:center.length>7?23:30;
    add(svg,'text',{x:300,y:290,'text-anchor':'middle','font-size':10,'font-family':'sans-serif','letter-spacing':2,fill:'#9b7b44'},subtitle);
    add(svg,'text',{x:300,y:326,'text-anchor':'middle',class:'center-main','font-family':'Noto Sans Devanagari, Nirmala UI, Mangal, sans-serif','font-size':textSize,'font-weight':700,fill:'#1c4655'},center);
    const tip=add(svg,'g',{'aria-hidden':true});
    add(tip,'path',{d:'M 292 9 L 308 9 L 300 25 Z',fill:'#aa7d36'});
    add(tip,'circle',{cx:300,cy:18,r:2,fill:'#fff6e0'});
  }
  let stemIndex=0,endingIndex=0,wordHidden=false;
  function currentWord(){const stem=D.stems[stemIndex],ending=D.endings[endingIndex];return {stem,ending,form:E.stemWord(stem.id,ending.id)};}
  function renderWord(){
    const {stem,ending,form}=currentWord();
    $('stem-label').textContent=stem.deva;$('stem-gloss').textContent=stem.en;
    $('ending-label').textContent=ending.deva;$('ending-gloss').textContent=ending.en;
    const result=wordHidden?'?':form?form.word:'—';
    wheel('word-svg',[
      {title:'Stem',items:D.stems,index:stemIndex,inner:186,outer:276,fontSize:23,select:i=>{stemIndex=i;renderWord();}},
      {title:'Ending',items:D.endings,index:endingIndex,inner:102,outer:180,fontSize:23,select:i=>{endingIndex=i;renderWord();}}
    ],result,'THE CONSTRUCTION');
    $('word-answer').textContent=result;
    $('word-meaning').textContent=wordHidden?'Speak it aloud first':form?form.en:'Not in the starter set';
    $('word-formula').textContent=wordHidden?'•••••':form?form.formula:'—';
    $('word-rule').textContent=form?`Reference: Pāṇini ${form.ruleExtra?.includes('5.3.25')?'5.3.25':ending.rule}`:'Rare एकथा is attested historically; deliberately excluded here.';
    $('word-example').textContent=wordHidden?'—':form?form.example:'—';
    $('word-example-en').textContent=wordHidden?'Reveal via the checkbox':form?form.exampleEn:'A gap in the beginner deck is not necessarily an ungrammatical word.';
    $('word-special').textContent=wordHidden?'':form?.ruleExtra||'';
  }
  let state={...E.initialState};
  let showGrammar=false;
  const ringConfigs=[
    {key:'subject',label:'PERSON',title:'Subject',items:D.subjects,inner:242,outer:279,fontSize:18},
    {key:'owner',label:'WHOSE?',title:'Possessor',items:D.owners,inner:202,outer:239,fontSize:18},
    {key:'place',label:'PLACE',title:'Location',items:D.places,inner:162,outer:199,fontSize:17},
    {key:'time',label:'TIME',title:'Time',items:D.times.filter(x=>x.id!=='once'),inner:122,outer:159,fontSize:17},
    {key:'predicate',label:'PREDICATE',title:'Predicate',items:D.predicates,inner:80,outer:119,fontSize:17}
  ];
  function updateState(key,id) {
    state={...state,[key]:id};
    if(key==='predicate'&&id!=='come'&&state.mode==='source')state.mode='statement';
    renderSentence();
  }
  function renderSentence(){
    const result=E.sentence(state);
    const rings=ringConfigs.map(config=>({
      ...config,index:Math.max(0,config.items.findIndex(item=>item.id===state[config.key])),
      select:index=>updateState(config.key,config.items[index].id)
    }));
    wheel('sentence-svg',rings,'वाक्यम्','SENTENCE');
    const controls=$('sentence-controls');controls.replaceChildren();
    for(const ring of rings){
      const row=document.createElement('div');row.className='ring-control';
      const title=document.createElement('label');title.textContent=ring.label;row.appendChild(title);
      const prev=document.createElement('button');prev.type='button';prev.className='mini-btn';prev.textContent='‹';prev.setAttribute('aria-label',`Previous ${ring.label}`);
      prev.addEventListener('click',()=>updateState(ring.key,ring.items[(ring.index-1+ring.items.length)%ring.items.length].id));row.appendChild(prev);
      const value=document.createElement('div');value.className='value-container';const big=document.createElement('div');big.className='control-value';big.textContent=ring.items[ring.index].deva;
      const gloss=document.createElement('div');gloss.className='value-gloss';gloss.textContent=ring.items[ring.index].en;value.append(big,gloss);row.appendChild(value);
      const next=document.createElement('button');next.type='button';next.className='mini-btn';next.textContent='›';next.setAttribute('aria-label',`Next ${ring.label}`);
      next.addEventListener('click',()=>updateState(ring.key,ring.items[(ring.index+1)%ring.items.length].id));row.appendChild(next);
      controls.appendChild(row);
    }
    const modes=$('mode-picker');modes.replaceChildren();
    for(const m of D.modes){
      const btn=document.createElement('button');btn.type='button';btn.textContent=m.label;
      if(state.mode===m.id)btn.classList.add('active');
      if(m.id==='source'&&state.predicate!=='come'){
        btn.disabled=true;btn.title='Select the “come” predicate to ask “from where?”';
      }
      btn.addEventListener('click',()=>updateState('mode',m.id));modes.appendChild(btn);
    }
    $('gender-choice').value=state.gender;
    $('sentence-answer').textContent=result.valid?result.text:'—';
    $('sentence-english').textContent=result.valid?result.english:'Invalid selection';
    $('sentence-warning').classList.toggle('hidden',result.valid);
    $('sentence-warning').textContent=result.valid?'':result.error;
    const grammar=$('sentence-grammar');grammar.replaceChildren();
    if(result.valid){
      for(const x of result.details){
        const detail=document.createElement('div');detail.className='detail';
        const l=document.createElement('span');l.textContent=x.label;
        const v=document.createElement('strong');v.textContent=x.value;
        const w=document.createElement('p');w.textContent=x.why;
        detail.append(l,v,w);grammar.appendChild(detail);
      }
      const note=document.createElement('p');note.className='small-muted';note.textContent=result.note;grammar.appendChild(note);
    }
    grammar.classList.toggle('hidden',!showGrammar);
    $('toggle-grammar').textContent=showGrammar?'Hide explanation ↑':'Show why it works ↓';
  }
  const sentenceCards=[
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
  ];
  const deck=[
    ...D.stems.flatMap(stem=>D.endings.filter(end=>E.stemWord(stem.id,end.id)).map(end=>{
      const f=E.stemWord(stem.id,end.id);
      return {id:`w:${stem.id}:${end.id}`,q:f.en,hint:stem.deva,answer:f.word,note:f.formula,kind:'Word family'};
    })),
    ...sentenceCards.map((card,i)=>{
      const out=E.sentence({...E.initialState,...card.s});
      return {id:`s:${i}`,q:card.q,hint:'Build the complete sentence',answer:out.text,note:out.english,kind:'Conversation'};
    })
  ];
  const storageKey='sanskrit-bruno-wheels-mastery-v1';
  let mastered=new Set(),queue=[],retries=0,shown=false;
  try {mastered=new Set(JSON.parse(localStorage.getItem(storageKey)||'[]'));} catch(e) {mastered=new Set();}
  function saveProgress(){try{localStorage.setItem(storageKey,JSON.stringify([...mastered]));}catch(e){/* private browsing or blocked storage */}}
  function syncQueue(){queue=deck.filter(x=>!mastered.has(x.id));}
  function renderPractice(){
    $('practice-progress').textContent=`${mastered.size} / ${deck.length} mastered`;
    $('practice-misses').textContent=`${retries} retries`;
    $('practice-progress-bar').style.width=`${100*mastered.size/deck.length}%`;
    const body=$('quiz-body'),buttons=$('quiz-buttons');body.replaceChildren();buttons.replaceChildren();
    if(!queue.length){
      const emblem=document.createElement('div');emblem.className='big-deva';emblem.textContent='सिद्धम्';
      const h=document.createElement('h3');h.textContent='Everything mastered.';
      const p=document.createElement('p');p.className='small-muted';p.textContent='Reset the deck or add new word families in data.js.';
      body.append(emblem,h,p);return;
    }
    const q=queue[0];
    const kind=document.createElement('div');kind.className='quiz-kind';kind.textContent=q.kind;
    const title=document.createElement('h3');title.textContent=q.q;
    const hint=document.createElement('div');hint.className='quiz-hint';hint.textContent=q.hint;
    body.append(kind,title,hint);
    if(shown){
      const answer=document.createElement('div');answer.className='quiz-answer';answer.textContent=q.answer;
      const note=document.createElement('div');note.className='quiz-note';note.textContent=q.note;
      body.append(answer,note);
      const miss=document.createElement('button');miss.textContent='↺ Missed · repeat';miss.addEventListener('click',()=>grade(false));
      const right=document.createElement('button');right.className='primary';right.textContent='✓ Got it · remove';right.addEventListener('click',()=>grade(true));
      buttons.append(miss,right);
    } else {
      const placeholder=document.createElement('p');placeholder.className='quiz-note';placeholder.textContent='Say the Sanskrit aloud. Then reveal the Devanāgarī.';
      body.appendChild(placeholder);
      const reveal=document.createElement('button');reveal.className='primary';reveal.textContent='Reveal the answer';reveal.addEventListener('click',()=>{shown=true;renderPractice();});buttons.appendChild(reveal);
    }
  }
  function grade(correct){const q=queue.shift();if(correct){mastered.add(q.id);saveProgress();}else{queue.push(q);retries++;}shown=false;renderPractice();}
  function showTab(tab){
    document.querySelectorAll('[data-view]').forEach(x=>x.classList.toggle('hidden',x.dataset.view!==tab));
    document.querySelectorAll('[data-tab]').forEach(x=>{const active=x.dataset.tab===tab;x.classList.toggle('active',active);if(active)x.setAttribute('aria-current','page');else x.removeAttribute('aria-current');});
    if(tab==='word')renderWord();if(tab==='sentence')renderSentence();if(tab==='practice')renderPractice();
  }
  function exportSVG(id,filename){
    const source=$(id).cloneNode(true);
    source.setAttribute('xmlns',NS);source.setAttribute('width','1000');source.setAttribute('height','1000');
    const text='<?xml version="1.0" encoding="UTF-8"?>\n'+new XMLSerializer().serializeToString(source);
    const url=URL.createObjectURL(new Blob([text],{type:'image/svg+xml;charset=utf-8'}));
    const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  async function copyString(text,btn){
    try{
      if(navigator.clipboard && window.isSecureContext){await navigator.clipboard.writeText(text);}
      else {const t=document.createElement('textarea');t.value=text;t.style.position='fixed';t.style.opacity=0;document.body.appendChild(t);t.select();const ok=document.execCommand('copy');t.remove();if(!ok)throw new Error('Copy unavailable');}
      const old=btn.textContent;btn.textContent='Copied ✓';setTimeout(()=>btn.textContent=old,1200);
    }catch(e){btn.textContent='Select text to copy';}
  }
  function init(){
    document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>showTab(b.dataset.tab)));
    $('stem-prev').addEventListener('click',()=>{stemIndex=(stemIndex+5)%6;renderWord();});
    $('stem-next').addEventListener('click',()=>{stemIndex=(stemIndex+1)%6;renderWord();});
    $('end-prev').addEventListener('click',()=>{endingIndex=(endingIndex+3)%4;renderWord();});
    $('end-next').addEventListener('click',()=>{endingIndex=(endingIndex+1)%4;renderWord();});
    $('hide-word').addEventListener('change',e=>{wordHidden=e.target.checked;renderWord();});
    $('random-word').addEventListener('click',()=>{stemIndex=Math.floor(Math.random()*6);endingIndex=Math.floor(Math.random()*4);renderWord();});
    $('export-word').addEventListener('click',()=>exportSVG('word-svg','sanskrit-word-wheel-current.svg'));
    $('export-sentence').addEventListener('click',()=>exportSVG('sentence-svg','sanskrit-sentence-wheel-current.svg'));
    $('gender-choice').addEventListener('change',e=>updateState('gender',e.target.value));
    $('toggle-grammar').addEventListener('click',()=>{showGrammar=!showGrammar;renderSentence();});
    $('copy-sentence').addEventListener('click',e=>copyString(E.sentence(state).text,e.currentTarget));
    $('reset-practice').addEventListener('click',()=>{if(!window.confirm('Reset all mastered words and sentences on this device?'))return;mastered.clear();saveProgress();retries=0;shown=false;syncQueue();renderPractice();});
    syncQueue();showTab('word');
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  window.SanskritWheelsDev={getState:()=>({...state}),generate:E.sentence,word:E.stemWord,deckSize:deck.length};
})();
