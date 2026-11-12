(function(){'use strict';
const {choose,line,registerFamily}=SW, {people,topics}=SWShared;
const speaker=people.slice(0,4),topicsOpts=topics.map(t=>choose(t.id,t.label));
const predicates=[{id:'beautiful',label:'सुन्दरम्',dev:'सुन्दरम्',roman:'sundaram',en:'beautiful'},{id:'useful',label:'उपयुक्तम्',dev:'उपयुक्तम्',roman:'upayuktam',en:'useful'},{id:'hard',label:'कठिनम्',dev:'कठिनम्',roman:'kaṭhinam',en:'difficult'},{id:'interesting',label:'रोचकम्',dev:'रोचकम्',roman:'rocakam',en:'interesting'}];
const stances=[{id:'think',label:'मन्ये',forms:{first:['मन्ये','manye','think'],second:['मन्यसे','manyase','think'],third:['मन्यते','manyate','thinks']}},{id:'know',label:'जानामि',forms:{first:['जानामि','jānāmi','know'],second:['जानासि','jānāsi','know'],third:['जानाति','jānāti','knows']}},{id:'say',label:'वदामि',forms:{first:['वदामि','vadāmi','say'],second:['वदसि','vadasi','say'],third:['वदति','vadati','says']}}];
function resolveSpeaker(s){return speaker.find(p=>p.id===s.speaker)}
function resolveTopic(s){return topics.find(t=>t.id===s.topic)}
const level21={id:'2.1',title:'Simple thoughts',focus:'Say what you think, know or say about something.',rings:[
 {id:'speaker',title:'Who thinks?',options:speaker.map(p=>choose(p.id,p.label))},
 {id:'stance',title:'Mental verb',options:stances.map(x=>choose(x.id,x.label))},
 {id:'topic',title:'Topic',options:topicsOpts},
 {id:'quality',title:'Judgment',options:predicates.map(x=>choose(x.id,x.label))},
 {id:'degree',title:'Degree',options:[choose('plain','सामान्यम्'),choose('very','अतीव'),choose('not','न')]}
 ],build:s=>{
 const p=resolveSpeaker(s),t=resolveTopic(s),q=predicates.find(x=>x.id===s.quality),v=stances.find(x=>x.id===s.stance).forms[p.person];
 const degree=s.degree==='plain'?['','','']:s.degree==='very'?['अतीव ','atīva ','very ']:['न ','na ','not '];
 return {lines:[line(`${p.nom} ${t.dev} ${degree[0]}${q.dev} इति ${v[0]}।`,`${p.nomR} ${t.roman} ${degree[1]}${q.roman} iti ${v[1]}.`,`${p.en} ${v[2]} that ${t.en} is ${degree[2]}${q.en}.`)],note:'iti marks the proposition being thought, known or said. For bhavān/bhavatī, use third-person verb forms.'};
 }};
const reaction=[{id:'like',label:'रोचते',dev:'रोचते',roman:'rocate',en:'likes'},{id:'love',label:'अतीव रोचते',dev:'अतीव रोचते',roman:'atīva rocate',en:'really likes'},{id:'dislike',label:'न रोचते',dev:'न रोचते',roman:'na rocate',en:'does not like'}];
const level22={id:'2.2',title:'Preferences',focus:'Who likes what, and when?',rings:[
 {id:'speaker',title:'Experiencer',options:speaker.map(p=>choose(p.id,p.label))},
 {id:'topic',title:'Interest',options:topicsOpts},
 {id:'feeling',title:'Reaction',options:reaction.map(x=>choose(x.id,x.label))},
 {id:'time',title:'Time',options:SWShared.times.map(t=>choose(t.id,t.label))},
 {id:'mode',title:'Mode',options:[choose('statement','वाक्यम्'),choose('question','प्रश्नः')]}
 ],build:s=>{
 const p=resolveSpeaker(s),t=resolveTopic(s),feel=reaction.find(x=>x.id===s.feeling),time=SWShared.times.find(x=>x.id===s.time),ask=s.mode==='question';
 const d=`${ask?'किं ':''}${time.dev} ${p.dative} ${t.dev} ${feel.dev}${ask?'?':'।'}`;
 const r=`${ask?'kiṃ ':''}${time.roman} ${p.dativeR} ${t.roman} ${feel.roman}${ask?'?':'.'}`;
 const subj=p.id==='i'?'I':p.id==='he'?'he':'you';
 const reactionText=s.feeling==='like'?'like':s.feeling==='love'?'really like':'not like';
 const statement=s.feeling==='like'?(p.person==='third'&&p.id==='he'?'likes':'like'):s.feeling==='love'?(p.person==='third'&&p.id==='he'?'really likes':'really like'):(p.person==='third'&&p.id==='he'?'does not like':'do not like');
 const e=ask?`${p.id==='he'?'Does':'Do'} ${subj} ${reactionText} ${t.en} ${time.en}?`:`${subj} ${statement} ${t.en} ${time.en}.`;
 return {lines:[line(d,r,e)],note:'Sanskrit rocate means “is pleasing to”. The person who likes it appears in the dative case (mahyam, tubhyam, bhavate).'};
 }};
const level23={id:'2.3',title:'Thoughts with reasons',focus:'A proposition + personal stance + why / contrast.',rings:[
 {id:'speaker',title:'Speaker',options:speaker.map(p=>choose(p.id,p.label))},
 {id:'stance',title:'Stance',options:stances.slice(0,2).map(x=>choose(x.id,x.label))},
 {id:'topic',title:'Proposition',options:topicsOpts},
 {id:'reason',title:'Explanation',options:[choose('r0','कारणम् १'),choose('r1','कारणम् २')]},
 {id:'link',title:'Link',options:[choose('because','यतः'),choose('and','अपि च'),choose('but','किन्तु')]}
 ],build:s=>{
 const p=resolveSpeaker(s),t=resolveTopic(s),v=stances.find(x=>x.id===s.stance).forms[p.person],rr=t.reason[Number(s.reason.slice(1))];
 const connect={because:['यतः','yataḥ','because'],and:['अपि च','api ca','and'],but:['किन्तु','kintu','but']}[s.link];
 return {lines:[line(`${p.nom} ${t.dev} ${t.adjN[0]} इति ${v[0]}, ${connect[0]} ${rr[0]}।`,`${p.nomR} ${t.roman} ${t.adjN[1]} iti ${v[1]}, ${connect[1]} ${rr[1]}.`,`${p.en} ${v[2]} ${t.en} is ${t.adjN[2]}, ${connect[2]} ${rr[2]}.`)],note:'Some combinations are grammatically sound but make odd arguments. That is useful for evaluating whether a reason really supports the statement.'};
 }};
const level24={id:'2.4',title:'Interests in depth',focus:'Express preferences with strength, evidence and a follow-up question.',rings:[
 {id:'speaker',title:'Who likes it?',options:speaker.slice(0,3).map(p=>choose(p.id,p.label))},
 {id:'topic',title:'Interest',options:topicsOpts},
 {id:'feeling',title:'Preference',options:reaction.slice(0,2).map(x=>choose(x.id,x.label))},
 {id:'reason',title:'Reason',options:[choose('r0','कारणम् १'),choose('r1','कारणम् २')]},
 {id:'question',title:'Follow-up',options:[choose('why','किमर्थम्'),choose('which','किम्'),choose('where','कुत्र')]}
 ],build:s=>{
 const p=resolveSpeaker(s),t=resolveTopic(s),feel=reaction.find(x=>x.id===s.feeling),rr=t.reason[Number(s.reason.slice(1))];
 const follow={why:line('किमर्थम्?','kimartham?','Why?','Follow-up'),which:line('भवते किं रोचते?','bhavate kiṃ rocate?','What do you like? (respectful, masculine)','Follow-up'),where:line('भवान् कुत्र पठति?','bhavān kutra paṭhati?','Where do you study? (respectful, masculine)','Follow-up')}[s.question];
 return {lines:[line(`${p.dative} ${t.dev} ${feel.dev}, यतः ${rr[0]}।`,`${p.dativeR} ${t.roman} ${feel.roman}, yataḥ ${rr[1]}.`,`${p.id==='i'?'I':'you'} ${s.feeling==='love'?'really like':'like'} ${t.en}, because ${rr[2]}.`),follow],note:'Level 2.4 is the interests iteration of Expression, not a new family. In the follow-up the tutor respectfully addresses a male learner.'};
 }};
registerFamily({id:'expression',number:2,title:'Expression',sub:'I think / like X because Y',description:'One family that grows from judgments into interests, reasons and dialogue.',levels:[level21,level22,level23,level24]});
})();
