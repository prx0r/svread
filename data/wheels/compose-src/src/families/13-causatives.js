/* 13: paired noncausative and causative phrases; never derive forms from strings. */
(function(){'use strict';const {line,choose,registerFamily}=SW;
const causers=[{id:'guru',d:'गुरुः',r:'guruḥ',e:'teacher'},{id:'mother',d:'माता',r:'mātā',e:'mother'},{id:'father',d:'पिता',r:'pitā',e:'father'}];
const pupils=[{id:'student',nom:'शिष्यः',nomr:'śiṣyaḥ',acc:'शिष्यम्',accr:'śiṣyam',e:'student'},{id:'child',nom:'बालः',nomr:'bālaḥ',acc:'बालम्',accr:'bālam',e:'boy'}];
const acts=[
 {id:'read',label:'पठ् → पाठय्',natural:['पठति','paṭhati','reads'],caus:['पाठयति','pāṭhayati','makes read / teaches'],objects:[['पुस्तकम्','pustakam','a book'],['श्लोकम्','ślokam','a verse']]},
 {id:'write',label:'लिख् → लेखय्',natural:['लिखति','likhati','writes'],caus:['लेखयति','lekhayati','makes write'],objects:[['पत्रम्','patram','a letter'],['शब्दम्','śabdam','a word']]},
 {id:'see',label:'दृश् → दर्शय्',natural:['पश्यति','paśyati','sees'],caus:['दर्शयति','darśayati','shows'],objects:[['चित्रम्','citram','a picture'],['मन्दिरम्','mandiram','a temple']]},
 {id:'hear',label:'श्रु → श्रावय्',natural:['शृणोति','śṛṇoti','hears'],caus:['श्रावयति','śrāvayati','makes hear / recites to'],objects:[['गीतम्','gītam','a song'],['श्लोकम्','ślokam','a verse']]}
];
const configs=[
 ['13.1','Read → teach','Compare who reads versus who causes reading.',['read','write'],['guru','mother']],
 ['13.2','Write → make write','Add writing and rotate the teacher.',['read','write'],['guru','mother','father']],
 ['13.3','See/hear → show/recite','Discover irregular root-to-causative relationships.',['see','hear'],['guru','mother','father']],
 ['13.4','All causatives','Mix causes, agents, objects and active / contrasting output.',['read','write','see','hear'],['guru','mother','father']]
];
const levels=configs.map(([id,title,focus,actsAllowed,causersAllowed])=>({id,title,focus,rings:[
 {id:'causer',title:'Causer',options:causers.filter(x=>causersAllowed.includes(x.id)).map(x=>choose(x.id,x.d))},
 {id:'learner',title:'Person affected',options:pupils.map(x=>choose(x.id,x.nom))},
 {id:'verb',title:'Root',options:acts.filter(x=>actsAllowed.includes(x.id)).map(x=>choose(x.id,x.label))},
 {id:'object',title:'Object',options:s=>acts.find(x=>x.id===s.verb).objects.map((o,i)=>choose('o'+i,o[0]))},
 {id:'mode',title:'Compare / negate',options:[choose('contrast','द्वे वाक्ये'),choose('caused','णिच्'),choose('negative','न')]}
 ],build:s=>{
 const c=causers.find(x=>x.id===s.causer),p=pupils.find(x=>x.id===s.learner),v=acts.find(x=>x.id===s.verb),o=v.objects[Number(s.object.slice(1))],neg=s.mode==='negative';
 const base=line(`${p.nom} ${o[0]} ${v.natural[0]}।`,`${p.nomr} ${o[1]} ${v.natural[1]}.`,`The ${p.e} ${v.natural[2]} ${o[2]}.`,'Simple action');
 const caused=line(`${c.d} ${p.acc} ${o[0]} ${neg?'न ':''}${v.caus[0]}।`,`${c.r} ${p.accr} ${o[1]} ${neg?'na ':''}${v.caus[1]}.`,`The ${c.e} ${s.verb==='see'?(neg?'does not show':'shows')+' '+o[2]+' to the '+p.e:(neg?'does not make':'makes')+' the '+p.e+' '+(s.verb==='read'?'read':s.verb==='write'?'write':'hear')+' '+o[2]}.`,'Causative');
 return {lines:s.mode==='contrast'?[base,caused]:[caused],note:'The noncausative subject becomes the affected person in the accusative in these curated causative patterns. Some causatives have additional constructions not taught here.'};
 }}));
registerFamily({id:'causatives',number:13,title:'Causatives',sub:'Do → cause someone to do',description:'Compare two grammatical structures using attested, separately listed causative stems.',levels});
})();
