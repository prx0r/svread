/* 12: relative/correlative pairs are learned as structures, not random clauses. */
(function(){'use strict';const {line,choose,registerFamily}=SW;
const actors=[{id:'i',d:'अहं',r:'ahaṃ',e:'I',p:0},{id:'you',d:'त्वं',r:'tvaṃ',e:'you',p:1},{id:'sir',d:'भवान्',r:'bhavān',e:'you respectfully',p:2},{id:'he',d:'सः',r:'saḥ',e:'he',p:2}];
const acts=[{id:'read',label:'पठ्',v:[['पठामि','paṭhāmi','study'],['पठसि','paṭhasi','study'],['पठति','paṭhati','studies']]},{id:'write',label:'लिख्',v:[['लिखामि','likhāmi','write'],['लिखसि','likhasi','write'],['लिखति','likhati','writes']]},{id:'go',label:'गम्',v:[['गच्छामि','gacchāmi','go'],['गच्छसि','gacchasi','go'],['गच्छति','gacchati','goes']]}];
const configs=[
 {id:'12.1',title:'When → then',focus:'yadā ... tadā ... (time)',pair:['यदा','yadā','तदा','tadā','when','then']},
 {id:'12.2',title:'Where → there',focus:'yatra ... tatra ... (place)',pair:['यत्र','yatra','तत्र','tatra','wherever','there']},
 {id:'12.3',title:'As → so',focus:'yathā ... tathā ... (manner)',pair:['यथा','yathā','तथा','tathā','as','so']},
 {id:'12.4',title:'Mix matching pairs',focus:'Change relative family while keeping its proper correlative.',pair:null}
];
const pairs=[configs[0].pair,configs[1].pair,configs[2].pair];
const emphatic=base=>[base[0],base[1],{ 'तदा':'तदैव','तत्र':'तत्रैव','तथा':'तथैव'}[base[2]],{'tadā':'tadaiva','tatra':'tatraiva','tathā':'tathaiva'}[base[3]],base[4],'exactly '+base[5]];
const levels=configs.map(cfg=>({id:cfg.id,title:cfg.title,focus:cfg.focus,rings:[
 {id:'pair',title:'Matched pair',options:(cfg.pair?[cfg.pair,emphatic(cfg.pair)]:pairs).map((x,i)=>choose('p'+i,`${x[0]} / ${x[2]}`))},
 {id:'person',title:'First clause who?',options:actors.map(x=>choose(x.id,x.d))},
 {id:'verb1',title:'First action',options:acts.map(v=>choose(v.id,v.label))},
 {id:'verb2',title:'Second action',options:s=>acts.filter(v=>v.id!==s.verb1).map(v=>choose(v.id,v.label))},
 {id:'polarity',title:'First clause negated?',options:[choose('yes','आम्'),choose('no','न')]}
 ],build:s=>{
 const pair=(cfg.pair?[cfg.pair,emphatic(cfg.pair)]:pairs)[Number(s.pair.slice(1))],a=actors.find(x=>x.id===s.person),v1=acts.find(x=>x.id===s.verb1).v[a.p],v2=acts.find(x=>x.id===s.verb2).v[0],neg=s.polarity==='no';
 return {lines:[line(`${pair[0]} ${a.d} ${neg?'न ':''}${v1[0]}, ${pair[2]} अहं ${v2[0]}।`,`${pair[1]} ${a.r} ${neg?'na ':''}${v1[1]}, ${pair[3]} ahaṃ ${v2[1]}.`,`${pair[4]} ${a.e} ${neg?'does not ':''}${v1[2]}, ${pair[5]} I ${v2[2]}.`)],note:'Each relative word must travel with its matching correlative: yadā/tadā, yatra/tatra, yathā/tathā.'};
 }}));
registerFamily({id:'correlatives',number:12,title:'Relative–Correlative',sub:'When/then · Where/there',description:'A real Sanskrit sentence-building engine for matched relative structures.',levels});
})();
