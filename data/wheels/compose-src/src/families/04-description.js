(function(){'use strict';
const {choose,line,registerFamily}=SW;
const nouns=[
 {id:'book',label:'पुस्तकम्',gender:'n',dev:'पुस्तकम्',roman:'pustakam',en:'book',abl:'पुस्तकात्',ablR:'pustakāt'},
 {id:'temple',label:'मन्दिरम्',gender:'n',dev:'मन्दिरम्',roman:'mandiram',en:'temple',abl:'मन्दिरात्',ablR:'mandirāt'},
 {id:'place',label:'स्थानम्',gender:'n',dev:'स्थानम्',roman:'sthānam',en:'place',abl:'स्थानात्',ablR:'sthānāt'},
 {id:'student',label:'शिष्यः',gender:'m',dev:'शिष्यः',roman:'śiṣyaḥ',en:'student'},
 {id:'teacher',label:'अध्यापकः',gender:'m',dev:'अध्यापकः',roman:'adhyāpakaḥ',en:'teacher'},
 {id:'notebook',label:'पुस्तिका',gender:'f',dev:'पुस्तिका',roman:'pustikā',en:'notebook'},
 {id:'river',label:'नदी',gender:'f',dev:'नदी',roman:'nadī',en:'river'}
];
const adjectives=[
 {id:'beautiful',label:'सुन्दर',en:'beautiful',m:['सुन्दरः','sundaraḥ'],f:['सुन्दरी','sundarī'],n:['सुन्दरम्','sundaram'],comp:['सुन्दरतरम्','sundarataram']},
 {id:'new',label:'नवीन',en:'new',m:['नवीनः','navīnaḥ'],f:['नवीना','navīnā'],n:['नवीनम्','navīnam'],comp:['नवीनतरम्','navīnataram']},
 {id:'hard',label:'कठिन',en:'difficult',m:['कठिनः','kaṭhinaḥ'],f:['कठिना','kaṭhinā'],n:['कठिनम्','kaṭhinam'],comp:['कठिनतरम्','kaṭhinataram']}
];
const demonstratives=[{id:'this',label:'इदम्',forms:{m:['अयं','ayaṃ','this'],f:['इयं','iyaṃ','this'],n:['इदं','idaṃ','this']}},{id:'that',label:'तत्',forms:{m:['सः','saḥ','that'],f:['सा','sā','that'],n:['तत्','tat','that']}}];
const degrees=[{id:'plain',label:'सामान्यम्',dev:'',roman:'',en:''},{id:'very',label:'अतीव',dev:'अतीव ',roman:'atīva ',en:'very '},{id:'some',label:'किञ्चित्',dev:'किञ्चित् ',roman:'kiñcit ',en:'somewhat '}];
function descr(id,title,focus,subset){return {id,title,focus,rings:[
 {id:'point',title:'This or that',options:demonstratives.map(x=>choose(x.id,x.label))},
 {id:'noun',title:'Thing or person',options:subset.map(x=>choose(x.id,x.label))},
 {id:'quality',title:'Quality',options:adjectives.map(x=>choose(x.id,x.label))},
 {id:'degree',title:'Intensity',options:degrees.map(x=>choose(x.id,x.label))},
 {id:'polarity',title:'Affirm / deny',options:[choose('yes','अस्ति'),choose('no','नास्ति')]}
 ],build:s=>{
 const n=nouns.find(x=>x.id===s.noun),a=adjectives.find(x=>x.id===s.quality),dm=demonstratives.find(x=>x.id===s.point).forms[n.gender],deg=degrees.find(x=>x.id===s.degree),neg=s.polarity==='no';
 return {lines:[line(`${dm[0]} ${n.dev} ${deg.dev}${a[n.gender][0]} ${neg?'न ':' '}अस्ति।`.replace(/  +/g,' '),`${dm[1]} ${n.roman} ${deg.roman}${a[n.gender][1]} ${neg?'na ':' '}asti.`.replace(/  +/g,' '),`${dm[2]} ${n.en} is ${neg?'not ':''}${deg.en}${a.en}.`)],note:'The adjective and demonstrative both agree with the gender of the noun. Level 4.2 unlocks masculine and feminine nouns.'};
 }};}
const level43={id:'4.3',title:'Compare two things',focus:'Learn comparatives with an ablative point of comparison.',rings:[
 {id:'point',title:'Near / far',options:demonstratives.map(x=>choose(x.id,x.label))},
 {id:'noun',title:'Thing',options:nouns.slice(0,3).map(x=>choose(x.id,x.label))},
 {id:'quality',title:'Comparison',options:adjectives.map(x=>choose(x.id,x.label))},
 {id:'other',title:'Compared with',options:[choose('other','अन्यस्मात्'),choose('earlier','पूर्वस्मात्')]},
 {id:'mode',title:'Statement / question',options:[choose('say','वाक्यम्'),choose('ask','प्रश्नः')]}
 ],build:s=>{
 const n=nouns.find(x=>x.id===s.noun),a=adjectives.find(x=>x.id===s.quality),dm=demonstratives.find(x=>x.id===s.point).forms.n,ref=s.other==='other'?['अन्यस्मात्','anyasmāt','another']:['पूर्वस्मात्','pūrvasmāt','an earlier'],ask=s.mode==='ask';
 return {lines:[line(`${ask?'किम् ':''}${dm[0]} ${n.dev} ${ref[0]} ${n.abl} ${a.comp[0]} अस्ति${ask?'?':'।'}`,`${ask?'kim ':''}${dm[1]} ${n.roman} ${ref[1]} ${n.ablR} ${a.comp[1]} asti${ask?'?':'.'}`,`${ask?'Is ':''}${dm[2]} ${n.en} ${ask?'':'is '}more ${a.en} than ${ref[2]} ${n.en}${ask?'?':'.'}`)],note:'The comparison target is ablative: anyasmāt pustakāt (“than another book”). This is deliberately limited to comparing two items of the same type.'};
 }};
const owners=[{id:'my',label:'मम',dev:'मम',roman:'mama',en:'my'},{id:'your',label:'तव',dev:'तव',roman:'tava',en:'your'},{id:'his',label:'तस्य',dev:'तस्य',roman:'tasya',en:'his'}];
const locations=[{id:'here',label:'अत्र',dev:'अत्र',roman:'atra',en:'here'},{id:'there',label:'तत्र',dev:'तत्र',roman:'tatra',en:'there'},{id:'home',label:'गृहे',dev:'गृहे',roman:'gṛhe',en:'at home'}];
const level44={id:'4.4',title:'Ownership and location',focus:'Whose object is where, and is it present?',rings:[
 {id:'owner',title:'Owner',options:owners.map(x=>choose(x.id,x.label))},
 {id:'noun',title:'Thing',options:nouns.filter(x=>['book','temple','notebook'].includes(x.id)).map(x=>choose(x.id,x.label))},
 {id:'location',title:'Where?',options:locations.map(x=>choose(x.id,x.label))},
 {id:'time',title:'When?',options:[choose('now','अधुना'),choose('today','अद्य'),choose('always','सर्वदा')]},
 {id:'polarity',title:'Present / absent',options:[choose('yes','अस्ति'),choose('no','नास्ति')]}
 ],build:s=>{
 const o=owners.find(x=>x.id===s.owner),n=nouns.find(x=>x.id===s.noun),loc=locations.find(x=>x.id===s.location),ti=SWShared.times.find(x=>x.id===s.time),neg=s.polarity==='no';
 return {lines:[line(`${ti.dev} ${o.dev} ${n.dev} ${loc.dev} ${neg?'न ':' '}अस्ति।`.replace(/  +/g,' '),`${ti.roman} ${o.roman} ${n.roman} ${loc.roman} ${neg?'na ':' '}asti.`.replace(/  +/g,' '),`${ti.en}, ${o.en} ${n.en} is ${neg?'not ':''}${loc.en}.`)],note:'Possessors are genitive (mama, tava, tasya), while places often use the locative (gṛhe).'};
 }};
registerFamily({id:'description',number:4,title:'Description',sub:'This → Noun → Quality → Degree',description:'Demonstratives, gender agreement, comparisons, location and ownership.',levels:[descr('4.1','Neuter descriptions','Start with easy neuter forms.',nouns.slice(0,3)),descr('4.2','All genders','Rotate across masculine, feminine and neuter.',nouns),level43,level44]});
})();
