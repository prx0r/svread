(function(){'use strict';
const {choose,line,registerFamily}=SW,{people,verbs,times}=SWShared;
const actors=people.slice(0,4);
const targets={
 read:[{id:'sans',label:'संस्कृतम्',dev:'संस्कृतम्',roman:'saṃskṛtam',en:'Sanskrit'},{id:'veda',label:'वेदान्तम्',dev:'वेदान्तम्',roman:'vedāntam',en:'Vedānta'},{id:'text',label:'पुस्तकम्',dev:'पुस्तकम्',roman:'pustakam',en:'a book'}],
 go:[{id:'home',label:'गृहम्',dev:'गृहम्',roman:'gṛham',en:'home'},{id:'kashi',label:'काशीम्',dev:'काशीम्',roman:'kāśīm',en:'to Kashi'},{id:'ashram',label:'आश्रमम्',dev:'आश्रमम्',roman:'āśramam',en:'to the ashram'}],
 write:[{id:'letter',label:'पत्रम्',dev:'पत्रम्',roman:'patram',en:'a letter'},{id:'verse',label:'श्लोकम्',dev:'श्लोकम्',roman:'ślokam',en:'a verse'},{id:'word',label:'शब्दम्',dev:'शब्दम्',roman:'śabdam',en:'a word'}]
};
const places=[{id:'home',label:'गृहे',dev:'गृहे',roman:'gṛhe',en:'at home'},{id:'ashram',label:'आश्रमे',dev:'आश्रमे',roman:'āśrame',en:'at the ashram'},{id:'here',label:'अत्र',dev:'अत्र',roman:'atra',en:'here'}];
const mode=[{id:'want',label:'इच्छति',forms:{first:['इच्छामि','icchāmi','want'],second:['इच्छसि','icchasi','want'],third:['इच्छति','icchati','wants']}},{id:'can',label:'शक्नोति',forms:{first:['शक्नोमि','śaknomi','can'],second:['शक्नोषि','śaknoṣi','can'],third:['शक्नोति','śaknoti','can']}}];
const timeSet=[{id:'yesterday',label:'ह्यः',dev:'ह्यः',roman:'hyaḥ',en:'yesterday',tense:'past'},{id:'today',label:'अद्य',dev:'अद्य',roman:'adya',en:'today',tense:'forms'},{id:'tomorrow',label:'श्वः',dev:'श्वः',roman:'śvaḥ',en:'tomorrow',tense:'future'}];
const who=state=>actors.find(x=>x.id===state.actor);
const target=state=>targets[state.verb].find(x=>x.id===state.target);
const targetOptions=s=>targets[s.verb].map(x=>choose(x.id,x.label));
const commonActor={id:'actor',title:'Who?',options:actors.map(x=>choose(x.id,x.label))};
const commonVerb={id:'verb',title:'Action',options:Object.entries(verbs).map(([id,v])=>choose(id,v.label))};
function verbForm(s,tense){return verbs[s.verb][tense||'forms'][who(s).person];}
const level31={id:'3.1',title:'Simple actions',focus:'Who does what, to what, and when?',rings:[commonActor,commonVerb,{id:'target',title:'Object / goal',options:targetOptions},{id:'time',title:'When?',options:times.map(t=>choose(t.id,t.label))},{id:'polarity',title:'Positive / negative',options:[choose('yes','आम्'),choose('no','न')]}],build:s=>{
 const p=who(s),t=target(s),time=times.find(x=>x.id===s.time),v=verbForm(s),neg=s.polarity==='no';
 return {lines:[line(`${time.dev} ${p.nom} ${t.dev} ${neg?'न ':''}${v[0]}।`,`${time.roman} ${p.nomR} ${t.roman} ${neg?'na ':''}${v[1]}.`,`${p.en} ${neg?'do not ':' '}${s.verb==='go'?'go':' '+(s.verb==='read'?'study':'write')} ${t.en} ${time.en}.`.trim().replace('  ',' '))],note:'The target ring depends on the selected verb, preventing “go a book”. This level deliberately practises present tense with time adverbs.'};
 }};
const level32={id:'3.2',title:'Where an action happens',focus:'Use the locative with reading and writing.',rings:[commonActor,{id:'verb',title:'Action',options:[choose('read','पठ्'),choose('write','लिख्')]},{id:'target',title:'Object',options:targetOptions},{id:'place',title:'Where?',options:places.map(x=>choose(x.id,x.label))},{id:'time',title:'When?',options:times.map(x=>choose(x.id,x.label))}],build:s=>{
 const p=who(s),t=target(s),pl=places.find(x=>x.id===s.place),time=times.find(x=>x.id===s.time),v=verbForm(s);
 return {lines:[line(`${time.dev} ${p.nom} ${pl.dev} ${t.dev} ${v[0]}।`,`${time.roman} ${p.nomR} ${pl.roman} ${t.roman} ${v[1]}.`,`${p.en} ${s.verb==='read'?'study':'write'} ${t.en} ${pl.en} ${time.en}.`)],note:'The place is expressed with a locative, e.g. gṛhe (“at home”), not the destination case used with gacchati.'};
 }};
const level33={id:'3.3',title:'Wants and abilities',focus:'A verb infinitive followed by “want” or “can”.',rings:[commonActor,commonVerb,{id:'target',title:'Object / goal',options:targetOptions},{id:'modal',title:'Want / can',options:mode.map(m=>choose(m.id,m.label))},{id:'polarity',title:'Positive / negative',options:[choose('yes','आम्'),choose('no','न')]}],build:s=>{
 const p=who(s),t=target(s),v=verbs[s.verb],m=mode.find(x=>x.id===s.modal),vf=m.forms[p.person],neg=s.polarity==='no';
 return {lines:[line(`${p.nom} ${t.dev} ${v.inf[0]} ${neg?'न ':''}${vf[0]}।`,`${p.nomR} ${t.roman} ${v.inf[1]} ${neg?'na ':''}${vf[1]}.`,`${p.id==='i'?'I':'you'} ${neg?'do not ':''}${s.modal==='can'?'can ':'want to '}${s.verb==='go'?'go':s.verb==='read'?'study':'write'} ${t.en}.`.replace('do not can','cannot'))],note:'The infinitive (gantum/paṭhitum/lekhitum) does not change with person. The following finite verb does.'};
 }};
const sequences=[{id:'pastnow',label:'ह्यः → अद्य',a:'yesterday',b:'today'},{id:'nowfuture',label:'अद्य → श्वः',a:'today',b:'tomorrow'},{id:'pastfuture',label:'ह्यः → श्वः',a:'yesterday',b:'tomorrow'}];
const level34={id:'3.4',title:'Two-event narratives',focus:'Link past, present and future with the same action.',rings:[commonActor,commonVerb,{id:'target',title:'Object / goal',options:targetOptions},{id:'sequence',title:'Timeline',options:sequences.map(x=>choose(x.id,x.label))},{id:'polarity',title:'Next action',options:[choose('yes','आम्'),choose('no','न')]}],build:s=>{
 const p=who(s),t=target(s),seq=sequences.find(x=>x.id===s.sequence),at=timeSet.find(x=>x.id===seq.a),bt=timeSet.find(x=>x.id===seq.b),a=verbForm(s,at.tense),b=verbForm(s,bt.tense),neg=s.polarity==='no';
 const desc=s.verb==='go'?'go':s.verb==='read'?'study':'write';
 return {lines:[line(`${at.dev} ${p.nom} ${t.dev} ${a[0]}।`,`${at.roman} ${p.nomR} ${t.roman} ${a[1]}.`,`${seq.a}: ${p.en} ${desc==='go'?'went':desc==='study'?'studied':'wrote'} ${t.en}.`,'Event 1'),line(`${bt.dev} ${p.nom} ${t.dev} ${neg?'न ':''}${b[0]}।`,`${bt.roman} ${p.nomR} ${t.roman} ${neg?'na ':''}${b[1]}.`,`${seq.b}: ${p.id==='i'?'I':'you'} ${bt.tense==='future'?(neg?'will not ':'will '):(neg?'do not ':'')}${desc} ${t.en}.`,'Event 2')],note:'The second sentence is automatically conjugated for the selected time. First-person and polite second-person address do not share verb endings.'};
 }};
registerFamily({id:'action',number:3,title:'Action',sub:'Who → Verb → Object → Place → Time',description:'Verb agreement, objects, place, infinitives and timelines.',levels:[level31,level32,level33,level34]});
})();
