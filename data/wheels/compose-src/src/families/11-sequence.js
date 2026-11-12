/* 11: -tvā action order (same agent in both clauses). */
(function(){'use strict';const {line,choose,registerFamily}=SW;
const actors=[{id:'i',d:'अहं',r:'ahaṃ',e:'I',p:0},{id:'you',d:'त्वं',r:'tvaṃ',e:'you',p:1},{id:'sir',d:'भवान्',r:'bhavān',e:'you (respectful)',p:2},{id:'he',d:'सः',r:'saḥ',e:'he',p:2}];
const first=[
 {id:'read',label:'पठित्वा',d:'संस्कृतं पठित्वा',r:'saṃskṛtaṃ paṭhitvā',e:'having studied Sanskrit'},
 {id:'bathe',label:'स्नात्वा',d:'स्नात्वा',r:'snātvā',e:'having bathed'},
 {id:'go',label:'गत्वा',d:'गृहं गत्वा',r:'gṛhaṃ gatvā',e:'having gone home'},
 {id:'eat',label:'भुक्त्वा',d:'भुक्त्वा',r:'bhuktvā',e:'having eaten'}
];
const second=[
 {id:'write',label:'लिख्',forms:[['श्लोकं लिखामि','ślokaṃ likhāmi','write a verse'],['श्लोकं लिखसि','ślokaṃ likhasi','write a verse'],['श्लोकं लिखति','ślokaṃ likhati','writes a verse']]},
 {id:'meditate',label:'ध्यै',forms:[['ध्यायामि','dhyāyāmi','meditate'],['ध्यायसि','dhyāyasi','meditate'],['ध्यायति','dhyāyati','meditates']]},
 {id:'rest',label:'विश्राम',forms:[['विश्रामं करोमि','viśrāmaṃ karomi','rest'],['विश्रामं करोषि','viśrāmaṃ karoṣi','rest'],['विश्रामं करोति','viśrāmaṃ karoti','rests']]}
];
const levels=[
 ['11.1','Having done X, do Y','Learn -tvā with same first-person subject.',['i','you'],['today','here']],
 ['11.2','Switch the agent','First-, second- and respectful third-person sentences.',['i','you','sir','he'],['today','here']],
 ['11.3','Time and location','Rotate time/place while retaining same-agent constraints.',['i','you','sir','he'],['today','here','always']],
 ['11.4','Narrative and follow-through','Add sequencing connectors to coherent two-action mini-narratives.',['i','you','sir','he'],['today','here','always']]
].map(([id,title,focus,who,t])=>({id,title,focus,rings:[
 {id:'actor',title:'Who',options:actors.filter(x=>who.includes(x.id)).map(x=>choose(x.id,x.d))},
 {id:'first',title:'First action',options:first.map(x=>choose(x.id,x.label))},
 {id:'second',title:'Then do',options:second.map(x=>choose(x.id,x.label))},
 {id:'context',title:'Time / place',options:[{id:'today',d:'अद्य',r:'adya',e:'today'},{id:'here',d:'अत्र',r:'atra',e:'here'},{id:'always',d:'सर्वदा',r:'sarvadā',e:'always'}].filter(x=>t.includes(x.id)).map(x=>choose(x.id,x.d,{d:x.d,r:x.r,e:x.e}))},
 {id:'link',title:'Sequence',options:id==='11.4'?[choose('plain','क्रमः'),choose('then','ततः'),choose('after','अनन्तरम्')]:[choose('plain','क्रमः'),choose('then','ततः')]}
 ],build:(s,c)=>{
 const p=actors.find(x=>x.id===s.actor),a=first.find(x=>x.id===s.first),b=second.find(x=>x.id===s.second),v=b.forms[p.p];
 const follow=s.link==='then'?[' ततः',' tataḥ',' then']:s.link==='after'?[' अनन्तरम्',' anantaram',' afterwards']:['','',''];
 return {lines:[line(`${c.context.d} ${p.d} ${a.d}${follow[0]} ${v[0]}।`,`${c.context.r} ${p.r} ${a.r}${follow[1]} ${v[1]}.`,`${c.context.e}, after ${({read:'studying Sanskrit',bathe:'bathing',go:'going home',eat:'eating'})[s.first]}, ${p.e} ${s.link==='plain'?'':s.link==='then'?'then ':'afterwards '}${v[2]}.`)],note:'-tvā requires the two actions to have the same agent. All verbs and -tvā forms here are curated. Context may be temporal or spatial; both actions share the same subject.'};
 }}));
registerFamily({id:'sequence',number:11,title:'Action Sequences',sub:'Having done X → do Y',description:'Chain two actions with the same subject using verified -tvā forms.',levels});
})();
