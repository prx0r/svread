(function(){'use strict';
const {line,choose,registerFamily}=SW;
const people=[
 {id:'sir',label:'भवान्',nom:'भवान्',nr:'bhavān',poss:'भवतः',pr:'bhavataḥ',dat:'भवते',dr:'bhavate',third:true},
 {id:'madam',label:'भवती',nom:'भवती',nr:'bhavatī',poss:'भवत्याः',pr:'bhavatyāḥ',dat:'भवत्यै',dr:'bhavatyai',third:true},
 {id:'friend',label:'त्वम्',nom:'त्वम्',nr:'tvaṃ',poss:'तव',pr:'tava',dat:'तुभ्यम्',dr:'tubhyam',third:false}
];
const topics={
 name:{label:'नाम',question:p=>line(`${p.poss} नाम किम्?`,`${p.pr} nāma kim?`,'What is your name?','Question'),values:[line('मम नाम टॉम्।','mama nāma Tom.','My name is Tom.','Answer'),line('मम नाम रामः।','mama nāma Rāmaḥ.','My name is Rama.','Answer'),line('मम नाम सीता।','mama nāma Sītā.','My name is Sita.','Answer')],next:['age','well','study']},
 age:{label:'वयः',question:p=>line(`${p.poss} वयः कियत्?`,`${p.pr} vayaḥ kiyat?`,'How old are you?','Question'),values:[line('मम वयः सप्तविंशतिः।','mama vayaḥ saptaviṃśatiḥ.','I am 27 years old.','Answer'),line('मम वयः विंशतिः।','mama vayaḥ viṃśatiḥ.','I am 20 years old.','Answer'),line('मम वयः त्रिंशत्।','mama vayaḥ triṃśat.','I am 30 years old.','Answer')],next:['study','well','name']},
 well:{label:'कथम्',question:p=>line(`${p.nom} कथम् ${p.third?'अस्ति':'असि'}?`,`${p.nr} katham ${p.third?'asti':'asi'}?`,'How are you?','Question'),values:[line('अहं कुशली अस्मि।','ahaṃ kuśalī asmi.','I am well. (masculine speaker)','Answer'),line('अहं सुखी अस्मि।','ahaṃ sukhī asmi.','I am happy. (masculine speaker)','Answer'),line('अहं स्वस्थः अस्मि।','ahaṃ svasthaḥ asmi.','I am healthy. (masculine speaker)','Answer')],next:['name','study','age']},
 study:{label:'पठनम्',question:p=>line(`${p.nom} किं ${p.third?'पठति':'पठसि'}?`,`${p.nr} kiṃ ${p.third?'paṭhati':'paṭhasi'}?`,'What do you study?','Question'),values:[line('अहं संस्कृतं पठामि।','ahaṃ saṃskṛtaṃ paṭhāmi.','I study Sanskrit.','Answer'),line('अहं वेदान्तं पठामि।','ahaṃ vedāntaṃ paṭhāmi.','I study Vedānta.','Answer'),line('अहं शैवदर्शनं पठामि।','ahaṃ śaivadarśanaṃ paṭhāmi.','I study Śaiva philosophy.','Answer')],next:['where','go','age']},
 where:{label:'वासः',question:p=>line(`${p.nom} कुत्र ${p.third?'वसति':'वससि'}?`,`${p.nr} kutra ${p.third?'vasati':'vasasi'}?`,'Where do you live?','Question'),values:[line('अहम् अत्र वसामि।','aham atra vasāmi.','I live here.','Answer'),line('अहं काश्यां वसामि।','ahaṃ kāśyāṃ vasāmi.','I live in Kashi.','Answer'),line('अहं भारते वसामि।','ahaṃ bhārate vasāmi.','I live in India.','Answer')],next:['study','go','name']},
 go:{label:'गमनम्',question:p=>line(`${p.nom} कुत्र ${p.third?'गच्छति':'गच्छसि'}?`,`${p.nr} kutra ${p.third?'gacchati':'gacchasi'}?`,'Where are you going?','Question'),values:[line('अहं गृहं गच्छामि।','ahaṃ gṛhaṃ gacchāmi.','I am going home.','Answer'),line('अहं काशीं गच्छामि।','ahaṃ kāśīṃ gacchāmi.','I am going to Kashi.','Answer'),line('अहं विद्यालयं गच्छामि।','ahaṃ vidyālayaṃ gacchāmi.','I am going to school.','Answer')],next:['where','study','well']},
 studywhere:{label:'कुत्र पठति',question:p=>line(`${p.nom} कुत्र ${p.third?'पठति':'पठसि'}?`,`${p.nr} kutra ${p.third?'paṭhati':'paṭhasi'}?`,'Where do you study?','Question'),values:[line('अहम् अत्र पठामि।','aham atra paṭhāmi.','I study here.','Answer'),line('अहं गृहे पठामि।','ahaṃ gṛhe paṭhāmi.','I study at home.','Answer'),line('अहम् आश्रमे पठामि।','aham āśrame paṭhāmi.','I study at the ashram.','Answer')],next:['study','go','where']}
};
function convo(id,title,focus, topicIds){
 return {id,title,focus,rings:[
  {id:'addressee',title:'Address',options:people.map(p=>choose(p.id,p.label,p))},
  {id:'intent',title:'Question',options:topicIds.map(id=>choose(id,topics[id].label,{en:id}))},
  {id:'reply',title:'Answer value',options:state=>topics[state.intent].values.map((v,i)=>choose('v'+i,['१','२','३'][i],{preview:v.en}))},
  {id:'style',title:'Response style',options:[choose('full','पूर्णम्',{en:'Complete answer'}),choose('short','लघु',{en:'Short answer'})]},
  {id:'next',title:'Follow-up',options:state=>topics[state.intent].next.map((topic,i)=>choose('n'+i,topics[topic].label,{preview:topic,topic}))}
 ],build:(s,c)=>{
   const p=people.find(x=>x.id===s.addressee), t=topics[s.intent],n=topics[c.next.topic];
   const answer=t.values[Number(s.reply.slice(1))],short=line(answer.dev.replace(/^मम (नाम|वयः) /,'').replace(/^अहं /,'').replace(/^अहम् /,''),answer.roman.replace(/^mama (nāma|vayaḥ) /,'').replace(/^ahaṃ /,'').replace(/^aham /,''),`Short: ${answer.en}`,'Answer');
   return {lines:[t.question(p),s.style==='short'?short:answer,{...n.question(p),role:'Follow-up'}],note:'The fifth ring generates the next question. Continue by answering it and rotating again. Gendered first-person wellbeing answers currently assume a male respondent.'};
 }};
}
const interests=[
 {id:'sanskrit',label:'संस्कृतम्',obj:'संस्कृतम्',objR:'saṃskṛtam',en:'Sanskrit',reason:[['तत् सुन्दरम् अस्ति','tat sundaram asti','it is beautiful'],['तत् उपयुक्तम् अस्ति','tat upayuktam asti','it is useful'],['तत् मधुरम् अस्ति','tat madhuram asti','it is sweet-sounding']]},
 {id:'meditate',label:'ध्यानम्',obj:'ध्यानम्',objR:'dhyānam',en:'meditation',reason:[['तत् शान्तिदायकम् अस्ति','tat śāntidāyakam asti','it is calming'],['तत् उपयुक्तम् अस्ति','tat upayuktam asti','it is useful'],['तत् मनोहरम् अस्ति','tat manoharam asti','it is delightful']]},
 {id:'book',label:'पुस्तकम्',obj:'पुस्तकम्',objR:'pustakam',en:'this book',reason:[['तत् रोचकम् अस्ति','tat rocakam asti','it is interesting'],['तत् सुन्दरम् अस्ति','tat sundaram asti','it is beautiful'],['तत् नवीनम् अस्ति','tat navīnam asti','it is new']]}
];
const interestLevel={id:'1.4',title:'Interests and reasons',focus:'What do you like? Answer with a personal reason.',rings:[
 {id:'addressee',title:'Address',options:people.map(p=>choose(p.id,p.label,p))},
 {id:'interest',title:'Interest',options:interests.map(x=>choose(x.id,x.label))},
 {id:'feeling',title:'Feeling',options:[choose('like','रोचते',{en:'like'}),choose('love','अतीव रोचते',{en:'like very much'}),choose('dislike','न रोचते',{en:'do not like'})]},
 {id:'reason',title:'Reason',options:[choose('r0','कारणम् १'),choose('r1','कारणम् २'),choose('r2','कारणम् ३')]},
 {id:'next',title:'Follow-up',options:[choose('study','किं पठति'),choose('where','कुत्र वसति'),choose('go','कुत्र गच्छति')]}
 ],build:(s)=>{
  const p=people.find(x=>x.id===s.addressee),x=interests.find(x=>x.id===s.interest),r=x.reason[Number(s.reason.slice(1))];
  const phrase=s.feeling==='like'?['रोचते','rocate','like']:s.feeling==='love'?['अतीव रोचते','atīva rocate','really like']:['न रोचते','na rocate','do not like'];
  return {lines:[line(`${p.dat} किं रोचते?`,`${p.dr} kiṃ rocate?`,'What do you like?','Question'),line(`मह्यं ${x.obj} ${phrase[0]}, यतः ${r[0]}।`,`mahyaṃ ${x.objR} ${phrase[1]}, yataḥ ${r[1]}.`,`I ${phrase[2]} ${x.en}, because ${r[2]}.`,'Answer'),{...topics[s.next].question(p),role:'Follow-up'}],note:'1.4 is an iteration of the same conversation wheel, not a separate tool. The reason phrase is topic-dependent.'};
 }};
registerFamily({id:'conversation',number:1,title:'Conversation',sub:'Questions → Answers → Follow-ups',description:'The original recursive dialogue wheel.',levels:[
 convo('1.1','Introductions','Name, age (including 27) and wellbeing.',['name','age','well']),
 convo('1.2','Everyday questions','Residence, studies and destination.',['where','study','go']),
 convo('1.3','Contextual follow-ups','Study locations and branching discussion.',['studywhere','study','where']),
 interestLevel
]});
})();
