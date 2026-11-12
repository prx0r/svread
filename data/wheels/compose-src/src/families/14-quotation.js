/* 14: iti quoted speech and thought, fixed quotations with controlled reporting. */
(function(){'use strict';const {line,choose,registerFamily}=SW;
const speakers=[{id:'guru',d:'गुरुः',r:'guruḥ',e:'teacher'},{id:'student',d:'शिष्यः',r:'śiṣyaḥ',e:'student'},{id:'woman',d:'शिष्या',r:'śiṣyā',e:'female student'}];
const statements=[
 {id:'sanskrit',d:'संस्कृतं सुन्दरम् अस्ति',r:'saṃskṛtaṃ sundaram asti',e:'Sanskrit is beautiful',kind:'statement'},
 {id:'shiva',d:'शिवः सर्वत्र अस्ति',r:'śivaḥ sarvatra asti',e:'Śiva is everywhere',kind:'statement'},
 {id:'study',d:'अहं पठामि',r:'ahaṃ paṭhāmi',e:'I study',kind:'statement'},
 {id:'question',d:'त्वं कुत्र गच्छसि',r:'tvaṃ kutra gacchasi',e:'Where are you going?',kind:'question'},
 {id:'name',d:'तव नाम किम्',r:'tava nāma kim',e:'What is your name?',kind:'question'}
];
const levels=[
 ['14.1','Someone says “...”','Use iti after a complete assertion.',['statement'],['say','repeat']],
 ['14.2','Someone thinks “...”','Use iti with manyate.',['statement'],['say','think']],
 ['14.3','Someone asks “...?”','Use iti with pṛcchati, genuine direct questions.',['question'],['ask','repeatask']],
 ['14.4','Say · think · ask','The reporting verb depends on the type of quotation.',['statement','question'],['say','think','ask']]
].map(([id,title,focus,kinds,reporting])=>({id,title,focus,rings:[
 {id:'who',title:'Speaker',options:speakers.map(x=>choose(x.id,x.d))},
 {id:'quote',title:'Quotation',options:statements.filter(q=>kinds.includes(q.kind)).map(q=>choose(q.id,q.d))},
 {id:'report',title:'Speech / thought',options:s=>{const isQ=statements.find(x=>x.id===s.quote).kind==='question';return reporting.filter(x=>isQ?['ask','repeatask'].includes(x):['say','think','repeat'].includes(x)).map(x=>choose(x,x==='say'?'वदति':x==='think'?'मन्यते':x==='repeat'?'पुनः वदति':x==='repeatask'?'पुनः पृच्छति':'पृच्छति'))}},
 {id:'negative',title:'Affirm / negate reporting',options:[choose('yes','आम्'),choose('no','न')]},
 {id:'follow',title:'Follow-up',options:[choose('none','अस्तु'),choose('why','किमर्थम्?'),choose('how','कथम्?')]}
 ],build:s=>{
 const p=speakers.find(x=>x.id===s.who),q=statements.find(x=>x.id===s.quote),v=s.report==='say'?['वदति','vadati','says']:s.report==='think'?['मन्यते','manyate','thinks']:s.report==='repeat'?['पुनः वदति','punaḥ vadati','says again']:s.report==='repeatask'?['पुनः पृच्छति','punaḥ pṛcchati','asks again']:['पृच्छति','pṛcchati','asks'],neg=s.negative==='no';
 const end=q.kind==='question'?'?':'।',follow=s.follow==='why'?line('किमर्थम्?','kimartham?','Why?','Follow-up'):s.follow==='how'?line('कथम्?','katham?','How?','Follow-up'):null;
 return {lines:[line(`${p.d} “${q.d}${q.kind==='question'?'?':'।'}” इति ${neg?'न ':''}${v[0]}।`,`${p.r} “${q.r}${end==='?'?'?':'.'}” iti ${neg?'na ':''}${v[1]}.`,`The ${p.e} ${neg?'does not ':''}${v[2]}: “${q.e}”`,'Reported speech'),...(follow?[follow]:[])],note:'iti marks the end of quoted content. The reporting verb is constrained by whether the quote is a statement or question.'};
 }}));
registerFamily({id:'quotation',number:14,title:'Quotation & iti',sub:'“X” iti vadati / manyate',description:'Construct and report speech, thought and questions using iti without arbitrary verb substitutions.',levels});
})();
