(function(){'use strict';
const {choose,line,registerFamily}=SW,{people,verbs}=SWShared;
const actors=people.slice(0,4);
const objects={
 read:[{id:'sanskrit',label:'संस्कृतम्',dev:'संस्कृतम्',roman:'saṃskṛtam',en:'Sanskrit'},{id:'veda',label:'वेदान्तम्',dev:'वेदान्तम्',roman:'vedāntam',en:'Vedānta'},{id:'book',label:'पुस्तकम्',dev:'पुस्तकम्',roman:'pustakam',en:'a book'}],
 go:[{id:'kashi',label:'काशीम्',dev:'काशीम्',roman:'kāśīm',en:'Kashi'},{id:'home',label:'गृहम्',dev:'गृहम्',roman:'gṛham',en:'home'},{id:'temple',label:'मन्दिरम्',dev:'मन्दिरम्',roman:'mandiram',en:'the temple'}],
 write:[{id:'letter',label:'पत्रम्',dev:'पत्रम्',roman:'patram',en:'a letter'},{id:'verse',label:'श्लोकम्',dev:'श्लोकम्',roman:'ślokam',en:'a verse'},{id:'word',label:'शब्दम्',dev:'शब्दम्',roman:'śabdam',en:'a word'}]
};
const who=s=>actors.find(p=>p.id===s.actor), what=s=>objects[s.verb].find(x=>x.id===s.object);
const actorRing={id:'actor',title:'Person',options:actors.map(x=>choose(x.id,x.label))};
const verbRing={id:'verb',title:'Verb',options:Object.entries(verbs).map(([id,v])=>choose(id,v.label))};
const objectRing={id:'object',title:'Object / destination',options:s=>objects[s.verb].map(x=>choose(x.id,x.label))};
const yesNo={id:'negative',title:'Polarity',options:[choose('yes','आम्'),choose('no','न')]};
function sentence(s,tense='forms',neg=false,ask=false,personOverride=null){
 const p=personOverride||who(s),o=what(s),v=verbs[s.verb][tense][p.person],pre=ask?'किम् ':'',preR=ask?'kiṃ ':'',not=neg?'न ':'',notR=neg?'na ':'';
 const dev=`${pre}${p.nom} ${o.dev} ${not}${v[0]}${ask?'?':'।'}`;
 const roman=`${preR}${p.nomR} ${o.roman} ${notR}${v[1]}${ask?'?':'.'}`;
 let predicate=s.verb==='read'?'study':s.verb==='write'?'write':'go to';
 let time=tense==='past'?'(past)':tense==='future'?'(future)':'(present)';
 return line(dev,roman,`${ask?'Question: ':' '}${p.en} ${neg?'NOT ':''}${predicate} ${o.en} ${time}${ask?'?':'.'}`.trim());
}
const level61={id:'6.1',title:'Person and negation',focus:'Change I/you/you polite and flip an assertion into a question.',rings:[actorRing,verbRing,objectRing,yesNo,{id:'ask',title:'Statement / question',options:[choose('say','वाक्यम्'),choose('ask','प्रश्नः')]}],build:s=>({lines:[sentence(s,'forms',s.negative==='no',s.ask==='ask')],note:'A respectful “you” (bhavān/bhavatī) takes third-person verb endings, while tvaṃ takes second-person endings.'})};
const tenses=[{id:'past',label:'ह्यः',prefix:'ह्यः',roman:'hyaḥ',en:'yesterday'},{id:'forms',label:'अद्य',prefix:'अद्य',roman:'adya',en:'today'},{id:'future',label:'श्वः',prefix:'श्वः',roman:'śvaḥ',en:'tomorrow'}];
const level62={id:'6.2',title:'Past, present, future',focus:'Rebuild the verb for yesterday, today and tomorrow.',rings:[actorRing,verbRing,objectRing,{id:'tense',title:'Time / tense',options:tenses.map(x=>choose(x.id,x.label))},yesNo],build:s=>{
 const t=tenses.find(x=>x.id===s.tense),v=sentence(s,s.tense,s.negative==='no');
 return {lines:[line(`${t.prefix} ${v.dev}`,`${t.roman} ${v.roman}`,`${t.en}: ${v.en}`)],note:'The past uses the imperfect for the selected roots; the future uses -iṣya- or an appropriate future stem. Curated paradigms, not guessed endings.'};
 }};
const plurals=[
 {id:'i',label:'अहम्',person:'first',nom:'अहम्',nomR:'aham',en:'I',plural:false},
 {id:'we',label:'वयम्',person:'first',nom:'वयम्',nomR:'vayam',en:'we',plural:true},
 {id:'you',label:'त्वम्',person:'second',nom:'त्वम्',nomR:'tvaṃ',en:'you',plural:false},
 {id:'youall',label:'यूयम्',person:'second',nom:'यूयम्',nomR:'yūyam',en:'you all',plural:true},
 {id:'he',label:'सः',person:'third',nom:'सः',nomR:'saḥ',en:'he',plural:false},
 {id:'they',label:'ते',person:'third',nom:'ते',nomR:'te',en:'they',plural:true}
];
const pluralVerbs={
 read:{first:['पठामः','paṭhāmaḥ'],second:['पठथ','paṭhatha'],third:['पठन्ति','paṭhanti']},
 go:{first:['गच्छामः','gacchāmaḥ'],second:['गच्छथ','gacchatha'],third:['गच्छन्ति','gacchanti']},
 write:{first:['लिखामः','likhāmaḥ'],second:['लिखथ','likhatha'],third:['लिखन्ति','likhanti']}
};
const level63={id:'6.3',title:'Singular and plural',focus:'I → we; you → you all; he → they.',rings:[
 {id:'actor',title:'Who / how many?',options:plurals.map(x=>choose(x.id,x.label))},verbRing,objectRing,yesNo,{id:'ask',title:'Statement / question',options:[choose('say','वाक्यम्'),choose('ask','प्रश्नः')]}
 ],build:s=>{
 const p=plurals.find(x=>x.id===s.actor),o=what(s),verb=p.plural?pluralVerbs[s.verb][p.person]:verbs[s.verb].forms[p.person],neg=s.negative==='no',ask=s.ask==='ask';
 return {lines:[line(`${ask?'किम् ':''}${p.nom} ${o.dev} ${neg?'न ':''}${verb[0]}${ask?'?':'।'}`,`${ask?'kiṃ ':''}${p.nomR} ${o.roman} ${neg?'na ':''}${verb[1]}${ask?'?':'.'}`,`${p.en} ${neg?'do not ':''}${s.verb==='go'?'go to':s.verb==='read'?'study':'write'} ${o.en}${ask?'?':'.'}`)],note:'Number changes the verb ending. You are now rotating person AND singular/plural in one ring.'};
 }};
const level64={id:'6.4',title:'Transform a sentence',focus:'Read the starting statement; mentally transform it before revealing the target.',rings:[actorRing,verbRing,objectRing,{id:'start',title:'Start sentence',options:[choose('positive','Positive'),choose('negative','Negative'),choose('question','Question')]},{id:'change',title:'Transform into',options:state=>[choose('negative','Negate'),choose('question','Ask'),choose('past','Past'),choose('future','Future')].filter(o=>!(state.start==='negative'&&o.id==='negative')&&!(state.start==='question'&&o.id==='question'))}],build:s=>{
 const base=sentence(s,'forms',s.start==='negative',s.start==='question');
 const out=s.change==='negative'?sentence(s,'forms',true,false):s.change==='question'?sentence(s,'forms',false,true):sentence(s,s.change,false,false);
 const prompt=line(base.dev,base.roman,base.en,'Start');
 const target={...out,role:'Target (reveal to check)'};
 return {lines:[prompt,target],note:'The target is deliberately shown only after you press “Reveal target”. In past/future transformations a tense change is implied, with no separate time adverb.'};
 }};
registerFamily({id:'transformation',number:6,title:'Transformation',sub:'Same sentence → New grammar',description:'Flip person, polarity, question, tense and number.',levels:[level61,level62,level63,level64]});
})();
