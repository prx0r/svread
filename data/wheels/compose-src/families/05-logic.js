(function(){'use strict';
const {line,choose,registerFamily}=SW,{people}=SWShared;
const actors=people.slice(0,4);
const conditions=[
 {id:'study',label:'पठति',object:'संस्कृतम्',objectR:'saṃskṛtam',en:'study Sanskrit',verb:{first:['पठामि','paṭhāmi'],second:['पठसि','paṭhasi'],third:['पठति','paṭhati']}},
 {id:'go',label:'गच्छति',object:'गृहम्',objectR:'gṛham',en:'go home',verb:{first:['गच्छामि','gacchāmi'],second:['गच्छसि','gacchasi'],third:['गच्छति','gacchati']}},
 {id:'write',label:'लिखति',object:'श्लोकम्',objectR:'ślokam',en:'write a verse',verb:{first:['लिखामि','likhāmi'],second:['लिखसि','likhasi'],third:['लिखति','likhati']}}
];
const results=[
 {id:'learn',label:'अवगच्छति',verb:{first:['अवगच्छामि','avagacchāmi'],second:['अवगच्छसि','avagacchasi'],third:['अवगच्छति','avagacchati']},en:'understand'},
 {id:'rest',label:'विश्राम्यति',verb:{first:['विश्राम्यामि','viśrāmyāmi'],second:['विश्राम्यसि','viśrāmyasi'],third:['विश्राम्यति','viśrāmyati']},en:'rest'},
 {id:'smile',label:'हसति',verb:{first:['हसामि','hasāmi'],second:['हससि','hasasi'],third:['हसति','hasati']},en:'smile'}
];
const basicTopics=[
 {id:'sanskrit',label:'संस्कृतम्',dev:'संस्कृतम्',roman:'saṃskṛtam',en:'Sanskrit',predicate:['सुन्दरम्','sundaram','beautiful'],reasons:[['तत् मधुरम् अस्ति','tat madhuram asti','it is sweet-sounding'],['तत् उपयुक्तम् अस्ति','tat upayuktam asti','it is useful']]},
 {id:'meditation',label:'ध्यानम्',dev:'ध्यानम्',roman:'dhyānam',en:'meditation',predicate:['उपयुक्तम्','upayuktam','useful'],reasons:[['तत् मनः स्थिरीकरोति','tat manaḥ sthirīkaroti','it steadies the mind'],['तत् शान्तिदायकम् अस्ति','tat śāntidāyakam asti','it is calming']]},
 {id:'knowledge',label:'ज्ञानम्',dev:'ज्ञानम्',roman:'jñānam',en:'knowledge',predicate:['महत्त्वपूर्णम्','mahattvapūrṇam','important'],reasons:[['तत् अज्ञानं नाशयति','tat ajñānaṃ nāśayati','it dispels ignorance'],['तत् उपयुक्तम् अस्ति','tat upayuktam asti','it is useful']]}
];
const speakerRing={id:'speaker',title:'Person',options:actors.map(x=>choose(x.id,x.label))};
const level51={id:'5.1',title:'If … then',focus:'Condition + consequence with person agreement.',rings:[speakerRing,
 {id:'if',title:'If action',options:conditions.map(x=>choose(x.id,x.label))},
 {id:'then',title:'Then result',options:results.map(x=>choose(x.id,x.label))},
 {id:'time',title:'When?',options:[choose('today','अद्य'),choose('always','सर्वदा'),choose('now','अधुना')]},
 {id:'negative',title:'Consequence',options:[choose('yes','आम्'),choose('no','न')]}
 ],build:s=>{
 const p=actors.find(x=>x.id===s.speaker),i=conditions.find(x=>x.id===s.if),o=results.find(x=>x.id===s.then),t=SWShared.times.find(x=>x.id===s.time),neg=s.negative==='no',iv=i.verb[p.person],ov=o.verb[p.person];
 return {lines:[line(`यदि ${t.dev} ${p.nom} ${i.object} ${iv[0]}, तर्हि ${p.nom} ${neg?'न ':''}${ov[0]}।`,`yadi ${t.roman} ${p.nomR} ${i.objectR} ${iv[1]}, tarhi ${p.nomR} ${neg?'na ':''}${ov[1]}.`,`If ${p.en} ${i.en} ${t.en}, then ${p.en} ${neg?'do not ':''}${o.en}.`)],note:'yadi (“if”) introduces the condition; tarhi (“then”) introduces the consequence. This is a grammar drill, not an endorsement of every hypothetical consequence.'};
 }};
const connectors=[{id:'because',label:'यतः',dev:'यतः',roman:'yataḥ',en:'because'},{id:'but',label:'किन्तु',dev:'किन्तु',roman:'kintu',en:'but'},{id:'and',label:'अपि च',dev:'अपि च',roman:'api ca',en:'and'}];
const level52={id:'5.2',title:'Premise and reason',focus:'Connect an evaluative claim to a cause or contrast.',rings:[
 {id:'topic',title:'Subject',options:basicTopics.map(x=>choose(x.id,x.label))},
 {id:'polarity',title:'Claim',options:[choose('yes','अस्ति'),choose('no','नास्ति')]},
 {id:'connector',title:'Relation',options:connectors.map(x=>choose(x.id,x.label))},
 {id:'reason',title:'Evidence',options:[choose('r0','कारणम् १'),choose('r1','कारणम् २')]},
 {id:'mode',title:'Assert / ask',options:[choose('say','वाक्यम्'),choose('ask','प्रश्नः')]}
 ],build:s=>{
 const t=basicTopics.find(x=>x.id===s.topic),neg=s.polarity==='no',link=connectors.find(x=>x.id===s.connector),reason=t.reasons[Number(s.reason.slice(1))],ask=s.mode==='ask';
 const claim=line(`${ask?'किम् ':''}${t.dev} ${neg?'न ':''}${t.predicate[0]} अस्ति${ask?'?':', '+link.dev+' '+reason[0]+'।'}`,`${ask?'kiṃ ':''}${t.roman} ${neg?'na ':''}${t.predicate[1]} asti${ask?'?':', '+link.roman+' '+reason[1]+'.'}`,`${ask?'Is ':' '}${t.en} ${ask?'':'is '}${neg?'not ':''}${t.predicate[2]}${ask?'?':', '+link.en+' '+reason[2]+'.'}`.trim(),'Claim');
 const answer=line(`${link.dev} ${reason[0]}।`,`${link.roman} ${reason[1]}.`,`${link.en} ${reason[2]}.`,'Suggested response');
 return {lines:ask?[claim,answer]:[claim],note:'The reason ring always changes the suggested explanation. Judge whether the reasoning is persuasive, not just grammatical.'};
 }};
const level53={id:'5.3',title:'Objections',focus:'Claim, challenge and reply in a miniature debate.',rings:[
 {id:'topic',title:'Subject',options:basicTopics.map(x=>choose(x.id,x.label))},
 {id:'stance',title:'Claim strength',options:[choose('plain','सामान्यम्'),choose('very','अतीव')]},
 {id:'question',title:'Challenge',options:[choose('why','किमर्थम्'),choose('how','कथम्'),choose('is','किम्')]},
 {id:'reason',title:'Reply',options:[choose('r0','कारणम् १'),choose('r1','कारणम् २')]},
 {id:'final',title:'Wrap-up',options:[choose('therefore','अतः'),choose('understand','अवगच्छामि'),choose('doubt','संशयः')]}
 ],build:s=>{
 const t=basicTopics.find(x=>x.id===s.topic),r=t.reasons[Number(s.reason.slice(1))],degree=s.stance==='very'?['अतीव ','atīva ','very ']:['','',''];
 const challenge={why:line('किमर्थम्?','kimartham?','Why?','Objection'),how:line('कथम्?','katham?','How?','Objection'),is:line('किं तत् सत्यम्?','kiṃ tat satyam?','Is that true?','Objection')}[s.question];
 const final={therefore:line('अतः एवम् अस्ति।','ataḥ evam asti.','Therefore, it is so.','Conclusion'),understand:line('अहम् अवगच्छामि।','aham avagacchāmi.','I understand.','Conclusion'),doubt:line('मम संशयः अस्ति।','mama saṃśayaḥ asti.','I have a doubt.','Conclusion')}[s.final];
 return {lines:[line(`${t.dev} ${degree[0]}${t.predicate[0]} अस्ति।`,`${t.roman} ${degree[1]}${t.predicate[1]} asti.`,`${t.en} is ${degree[2]}${t.predicate[2]}.`,'Claim'),challenge,line(`यतः ${r[0]}।`,`yataḥ ${r[1]}.`,`Because ${r[2]}.`,'Reply'),final],note:'These are illustrative practice arguments written for the wheel, not quotations or definitive Trika doctrines.'};
 }};
const trika=[
 {id:'siva',label:'शिवः',claim:['शिवः सर्वत्र अस्ति','śivaḥ sarvatra asti','Śiva is everywhere'],r:[['सः सर्वव्यापकः अस्ति','saḥ sarvavyāpakaḥ asti','he is all-pervading'],['सः स्वतन्त्रः अस्ति','saḥ svatantraḥ asti','he is free']]},
 {id:'conscious',label:'चैतन्यम्',claim:['चैतन्यम् एकम् अस्ति','caitanyam ekam asti','Consciousness is one'],r:[['तत् सर्वत्र अस्ति','tat sarvatra asti','it is everywhere'],['तत् स्वप्रकाशम् अस्ति','tat svaprakāśam asti','it is self-luminous']]},
 {id:'know',label:'ज्ञानम्',claim:['ज्ञानम् महत्त्वपूर्णम् अस्ति','jñānam mahattvapūrṇam asti','Knowledge is important'],r:[['तत् अज्ञानं नाशयति','tat ajñānaṃ nāśayati','it dispels ignorance'],['तत् उपयुक्तम् अस्ति','tat upayuktam asti','it is useful']]}
];
const level54={id:'5.4',title:'Trika discussion patterns',focus:'Assemble claim → evidence → challenge → response → conclusion.',rings:[
 {id:'topic',title:'Trika subject',options:trika.map(x=>choose(x.id,x.label))},
 {id:'reason',title:'Evidence',options:[choose('r0','१'),choose('r1','२')]},
 {id:'link',title:'Because / therefore',options:[choose('because','यतः'),choose('therefore','अतः')]},
 {id:'objection',title:'Challenge',options:[choose('why','किमर्थम्'),choose('how','कथम्'),choose('is','किम्')]},
 {id:'answer',title:'Response',options:[choose('repeat','पुनः'),choose('accept','आम्'),choose('uncertain','न जानामि')]}
 ],build:s=>{
 const t=trika.find(x=>x.id===s.topic),r=t.r[Number(s.reason.slice(1))],l=s.link==='because';
 const ask={why:line('किमर्थम्?','kimartham?','Why?','Challenge'),how:line('कथम्?','katham?','How?','Challenge'),is:line('किम् एतत् सत्यम्?','kim etat satyam?','Is this true?','Challenge')}[s.objection];
 const end={repeat:line(`${t.claim[0]}।`,`${t.claim[1]}.`,`${t.claim[2]}.`,'Response'),accept:line('आम्, अवगच्छामि।','ām, avagacchāmi.','Yes, I understand.','Response'),uncertain:line('न जानामि।','na jānāmi.','I do not know.','Response')}[s.answer];
 return {lines:[line(`${t.claim[0]}।`,`${t.claim[1]}.`,`${t.claim[2]}.`,'Claim'),line(`${l?'यतः '+r[0]:'यतः '+r[0]+', अतः '+t.claim[0]}।`,`${l?'yataḥ '+r[1]:'yataḥ '+r[1]+', ataḥ '+t.claim[1]}.`,`${l?'Because '+r[2]:'Because '+r[2]+', therefore '+t.claim[2]}.`,'Support'),ask,end],note:'Original illustrative sentences, NOT cited Sanskrit from Abhinavagupta. “Therefore” is generated as a discourse exercise; learners should assess whether the claim is actually justified.'};
 }};
registerFamily({id:'logic',number:5,title:'Logic',sub:'If → Then → Because → Objection',description:'Conditionals, reasons, debate and Trika-themed arguments.',levels:[level51,level52,level53,level54]});
})();
