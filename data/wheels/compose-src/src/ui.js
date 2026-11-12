/* Accessible five-ring UI. Uses plain scripts so it opens directly from index.html. */
(function () {'use strict';
const {families,resolve,generate}=SW;
const curriculum=SWCurriculum;
const $=id=>document.getElementById(id);
const localKey='svatantrya.generative-wheels.v1';
let saved={practised:{},stats:{},focus:null,lastFamily:'conversation',lastLevel:'1.1'};
try{const raw=localStorage.getItem(localKey);if(raw){const old=JSON.parse(raw);if(old && typeof old==='object') saved={...saved,...old,practised:old.practised||{},stats:old.stats||{}}}}catch(e){console.warn('Progress storage unavailable; practice is temporary',e)}
let family=families.find(f=>f.id===saved.lastFamily)||families[0];
let level=family.levels.find(l=>l.id===saved.lastLevel)||family.levels[0];
let selection={},romanVisible=false,englishVisible=false,targetVisible=false;
function persist(){try{localStorage.setItem(localKey,JSON.stringify(saved))}catch(e){/* can still practise in memory */}}
function current(){return generate(level,selection)}
function focusForToday(){const day=curriculum.localDate();if(!saved.focus||saved.focus.day!==day||!curriculum.lessonOf(saved.focus.id)){saved.focus={day,id:curriculum.recommend(saved.stats)};persist()}return saved.focus.id;}
function stateKey(g){return family.id+'/'+level.id+'/'+level.rings.map(r=>g.state[r.id]).join('|')}
let toastHandle;
function toast(msg){$('toast').textContent=msg;$('toast').classList.add('visible');clearTimeout(toastHandle);toastHandle=setTimeout(()=>$('toast').classList.remove('visible'),2400)}
function countPaths(l){function visit(i,s){if(i===5)return 1;const current=resolve(l,s).rings[i];return current.options.reduce((n,o)=>n+visit(i+1,{...s,[l.rings[i].id]:o.id}),0)}return visit(0,{})}
const counts={};
function transition(f,l){family=f;level=l;selection={};romanVisible=false;englishVisible=false;targetVisible=false;saved.lastFamily=f.id;saved.lastLevel=l.id;persist();render()}
function makeText(el,tag,txt,className){const node=document.createElement(tag);node.textContent=txt;if(className)node.className=className;el.append(node);return node}
function button(label,onClick,klass=''){const b=document.createElement('button');b.type='button';b.className='button '+klass;b.textContent=label;b.addEventListener('click',onClick);return b}
function svg(tag,attrs={},textContent){const el=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [k,v] of Object.entries(attrs))el.setAttribute(k,String(v));if(textContent!==undefined)el.textContent=textContent;return el}
function polar(r,theta){const rad=theta*Math.PI/180;return [300+r*Math.cos(rad),300+r*Math.sin(rad)]}
function sector(outer,inner,a,b){const [x1,y1]=polar(outer,a),[x2,y2]=polar(outer,b),[x3,y3]=polar(inner,b),[x4,y4]=polar(inner,a);const large=(b-a)>180?1:0;return `M${x1} ${y1} A${outer} ${outer} 0 ${large} 1 ${x2} ${y2} L${x3} ${y3} A${inner} ${inner} 0 ${large} 0 ${x4} ${y4} Z`}
function setChoice(ringId,id){selection={...selection,[ringId]:id};const res=resolve(level,selection);selection=res.state;targetVisible=false;render()}
function spin(){romanVisible=false;englishVisible=false;const s={};for(const r of level.rings){const list=typeof r.options==='function'?r.options(s):r.options;const x=list[Math.floor(Math.random()*list.length)];s[r.id]=x.id}selection=s;targetVisible=false;render()}
function next(){romanVisible=false;englishVisible=false;const res=resolve(level,selection);const s={...res.state};for(let i=4;i>=0;i--){const item=res.rings[i];const position=item.options.findIndex(x=>x.id===s[item.ring.id]);const nextAt=position+1;if(nextAt<item.options.length){s[item.ring.id]=item.options[nextAt].id;break}else{s[item.ring.id]=item.options[0].id;}}
 selection=resolve(level,s).state;targetVisible=false;render()}
function drawWheel(g){const root=$('wheel');root.replaceChildren();
 g.rings.forEach((row,i)=>{
  const outer=279-i*36,inner=outer-34,n=row.options.length;
  row.options.forEach((option,j)=>{
   const a=-90+(j*360/n),b=-90+((j+1)*360/n),mid=(a+b)/2;
   const group=svg('g',{class:'wheel-segment'+(row.selected.id===option.id?' selected':''),role:'button',tabindex:'0','aria-label':`Layer ${i+1}: ${row.ring.title}, ${option.label}${option.en?' ('+option.en+')':''}.`});
   group.append(svg('path',{d:sector(outer,inner,a,b),fill:j%2?'#1a2634':'#202e3d'}));
   const [x,y]=polar((outer+inner)/2,mid);
   const fontSize=Math.min(13,n>=7?10.5:13);
   const t=svg('text',{x,y,'text-anchor':'middle','dominant-baseline':'middle','font-size':fontSize},option.label);
   const tip=svg('title',{},`${row.ring.title}: ${option.label}${option.preview?' — '+option.preview:''}`);
   group.append(t,tip);group.addEventListener('click',()=>setChoice(row.ring.id,option.id));
   group.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setChoice(row.ring.id,option.id)}});root.append(group);
  });
 });
 const center=svg('g',{class:'wheel-center',role:'button',tabindex:'0','aria-label':'Spin all five rings'});
 center.append(svg('circle',{cx:300,cy:300,r:92}),svg('text',{x:300,y:276,'text-anchor':'middle','font-size':32},'ॐ'),svg('text',{x:300,y:310,'text-anchor':'middle','font-size':17},level.id),svg('text',{x:300,y:332,'text-anchor':'middle','font-size':12},'SPIN ALL'));
 center.addEventListener('click',spin);center.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();spin()}});root.append(center);
}
function drawControls(g){const root=$('ring-controls');root.replaceChildren();g.rings.forEach((row,i)=>{
 const wrap=document.createElement('div');wrap.className='ring-row';makeText(wrap,'span',String(i+1),'ring-id');makeText(wrap,'span',row.ring.title,'ring-label');
 const select=document.createElement('select');select.setAttribute('aria-label',`Ring ${i+1}: ${row.ring.title}`);
 row.options.forEach(o=>{const op=document.createElement('option');op.value=o.id;op.textContent=`${o.label}${o.preview?' · '+o.preview:''}`;select.append(op)});select.value=row.selected.id;select.addEventListener('change',e=>setChoice(row.ring.id,e.target.value));wrap.append(select);
 const cycle=button('↻',()=>{const current=row.options.findIndex(x=>x.id===row.selected.id);setChoice(row.ring.id,row.options[(current+1)%row.options.length].id)},'ring-cycle');cycle.title='Advance this ring';wrap.append(cycle);root.append(wrap);
 });}
function drawPractice(g){
 const root=$('generated');root.replaceChildren();
 g.result.lines.forEach((x,i)=>{
  if((level.id==='6.4'||level.challenge)&&i>=1&&!targetVisible){const cover=makeText(root,'div','Target hidden: transform the sentence before revealing.','hidden-answer');cover.setAttribute('aria-label','Target is hidden');return;}
  const wrap=document.createElement('div');wrap.className='line-block';makeText(wrap,'div',x.role||'Sanskrit','line-role');makeText(wrap,'div',x.dev,'line-dev');if(romanVisible)makeText(wrap,'div',x.roman,'line-roman');if(englishVisible)makeText(wrap,'div',x.en,'line-en');root.append(wrap);
 });
 $('lesson-note').textContent=g.result.note||'';
 $('reveal-roman').classList.toggle('active',romanVisible);$('reveal-roman').textContent=romanVisible?'Hide IAST':'Reveal IAST';
 $('reveal-english').classList.toggle('active',englishVisible);$('reveal-english').textContent=englishVisible?'Hide English':'Reveal English';
 $('reveal-target').hidden=!(level.id==='6.4'||level.challenge);$('reveal-target').textContent=targetVisible?'Hide target':'Reveal target';
 const k=stateKey(g),done=!!saved.practised[k];$('practice-badge').textContent=done?'Practised ✓':'New combination';$('mark').textContent=done?'✓ Explored (click to unmark)':'Mark explored';
 const prefix=family.id+'/'+level.id+'/';$('family-progress').textContent=Object.keys(saved.practised).filter(k=>k.startsWith(prefix)).length;
 const m=curriculum.metrics(saved.stats,level.id);$('level-up').hidden=!m.ready; $('level-up').textContent=`Level up → ${level.id.split('.')[0]+'.'+(Number(level.id.split('.')[1])+1)}`; $('mastery-info').textContent=`${level.id}: ${m.status}. ${m.correct}/${m.graded} self-checked correct, ${m.unique} distinct correct combinations, ${m.days} day(s). Ready: 8 attempts, 6 distinct correct, ≥80% recent accuracy. Mastery: repeat on another day.`;
}
function drawFamilies(){const root=$('families');root.replaceChildren();families.forEach(f=>{
 const b=document.createElement('button');b.className='family-button'+(f.id===family.id?' active':'');b.type='button';makeText(b,'span',`${f.number}. ${f.title}`,'family-name');makeText(b,'span',f.sub,'family-sub');b.setAttribute('aria-current',f.id===family.id?'true':'false');b.addEventListener('click',()=>transition(f,f.levels[0]));root.append(b)});
 const tabs=$('level-tabs');tabs.replaceChildren();family.levels.forEach(l=>{const b=button(`${l.id} · ${l.title}`,()=>transition(family,l),'level-tab'+(l===level?' active':''));b.setAttribute('aria-current',l===level?'step':'false');tabs.append(b)});
}
function render(){const g=current();selection=g.state;
 drawFamilies();drawWheel(g);drawControls(g);drawPractice(g);drawCurriculum();
 $('lesson-code').textContent=`FAMILY ${family.number} · LEVEL ${level.id}`;
 $('lesson-title').textContent=`${family.title} · ${level.title}`;
 $('lesson-focus').textContent=level.focus;
 $('family-description').textContent=family.description;
 const key=family.id+'/'+level.id;
 if(!counts[key]) counts[key]=countPaths(level);
 $('combos').textContent=counts[key].toLocaleString()+' combinations';
 const i=family.levels.indexOf(level);$('prev-level').disabled=i===0;$('next-level').disabled=i===family.levels.length-1;
}
function drawCurriculum(){
 const fid=focusForToday(),lesson=curriculum.lessonOf(fid),mf=curriculum.metrics(saved.stats,fid);
 $('daily-focus').textContent=`${fid} · ${curriculum.familyOf(fid)?.title}: ${lesson.title} (${mf.status}). Suggested daily focus: 10–15 minutes.`;
 const nroot=$('neighbors');nroot.replaceChildren();
 for(const n of curriculum.neighbors(level.id)){
  const l=curriculum.lessonOf(n),f=curriculum.familyOf(n),m=curriculum.metrics(saved.stats,n);
  const b=button(`${n} · ${f.title} · ${l.title} (${m.status})`,()=>transition(f,l),'neighbor-chip');nroot.append(b);
 }
}
function navigate(id){const l=curriculum.lessonOf(id),f=curriculum.familyOf(id);if(l&&f)transition(f,l)}
$('go-focus').addEventListener('click',()=>navigate(focusForToday()));
$('set-focus').addEventListener('click',()=>{saved.focus={day:curriculum.localDate(),id:level.id};persist();render();toast('Daily focus set');});
$('level-up').addEventListener('click',()=>{const f=family,idx=f.levels.indexOf(level),next=f.levels[idx+1];if(next)transition(f,next);else navigate(curriculum.recommend(saved.stats));});
$('auto-focus').addEventListener('click',()=>{saved.focus={day:curriculum.localDate(),id:curriculum.recommend(saved.stats)};persist();navigate(saved.focus.id)});
function selfGrade(grade){const g=current(),k=stateKey(g),m=curriculum.practice(saved.stats,level.id,k,grade);persist();toast(grade==='yes'?(m.ready?'Level-up ready. Revisit another day to master.':'Correct self-check recorded.'):'Marked for more practice.');if(grade==='yes')next();else render();}
$('got-it').addEventListener('click',()=>selfGrade('yes'));
$('retry').addEventListener('click',()=>selfGrade('retry'));
$('spin').addEventListener('click',spin);$('reset').addEventListener('click',()=>{selection={};romanVisible=false;englishVisible=false;targetVisible=false;render()});$('next-combo').addEventListener('click',next);
$('reveal-roman').addEventListener('click',()=>{romanVisible=!romanVisible;render()});$('reveal-english').addEventListener('click',()=>{englishVisible=!englishVisible;render()});$('reveal-target').addEventListener('click',()=>{targetVisible=!targetVisible;render()});
$('mark').addEventListener('click',()=>{const key=stateKey(current());if(saved.practised[key]){delete saved.practised[key];toast('Unmarked')}else{saved.practised[key]={at:new Date().toISOString(),level:level.id};toast('Combination marked practised')}persist();render()});
$('copy').addEventListener('click',async()=>{const result=current().result;const sanskrit=result.lines.map(x=>x.dev).join('\n');try{if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(sanskrit)}else{const t=document.createElement('textarea');t.value=sanskrit;document.body.append(t);t.select();document.execCommand('copy');t.remove()}toast('Sanskrit copied')}catch(e){toast('Could not copy; select the sentences manually')}});
$('prev-level').addEventListener('click',()=>{const i=family.levels.indexOf(level);if(i>0)transition(family,family.levels[i-1])});$('next-level').addEventListener('click',()=>{const i=family.levels.indexOf(level);if(i<family.levels.length-1)transition(family,family.levels[i+1])});
$('export').addEventListener('click',()=>{const blob=new Blob([JSON.stringify({...saved,exportedAt:new Date().toISOString()},null,2)],{type:'application/json'});const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download='sanskrit-wheel-practice.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1000)});
render();
})();
