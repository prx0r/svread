/* 10: imperative paradigms, no invented prohibitions. */
(function(){'use strict';const {line,choose,registerFamily}=SW;
const people=[{id:'you',d:'त्वम्',r:'tvaṃ',e:'you (familiar)',p:'informal'},{id:'sir',d:'भवान्',r:'bhavān',e:'you (respectful)',p:'polite'},{id:'madam',d:'भवती',r:'bhavatī',e:'you (respectful)',p:'polite'},{id:'all',d:'यूयम्',r:'yūyam',e:'you all',p:'plural'}];
const verbs=[
 {id:'read',label:'पठ्',forms:{informal:['पठ','paṭha'],polite:['पठतु','paṭhatu'],plural:['पठत','paṭhata']},objects:[['पुस्तकम्','pustakam','a book'],['श्लोकम्','ślokam','a verse']]},
 {id:'write',label:'लिख्',forms:{informal:['लिख','likha'],polite:['लिखतु','likhatu'],plural:['लिखत','likhata']},objects:[['शब्दम्','śabdam','a word'],['पत्रम्','patram','a letter']]},
 {id:'say',label:'वद्',forms:{informal:['वद','vada'],polite:['वदतु','vadatu'],plural:['वदत','vadata']},objects:[['सत्यम्','satyam','the truth'],['उत्तरम्','uttaram','the answer']]},
 {id:'go',label:'गम्',forms:{informal:['गच्छ','gaccha'],polite:['गच्छतु','gacchatu'],plural:['गच्छत','gacchata']},objects:[['गृहम्','gṛham','home'],['मन्दिरम्','mandiram','the temple']]}
];
const levels=[
 ['10.1','Direct imperatives','Learn informal imperative forms; action + object.',['you','all'],false],
 ['10.2','Respectful imperatives','bhavān/bhavatī use third-person imperative endings.',['sir','madam'],false],
 ['10.3','Singular vs plural','Change whom you address, and watch the endings.',['you','sir','madam','all'],false],
 ['10.4','Requests and context','Add context, emphasis and polite requests.',['you','sir','madam','all'],true]
].map(([id,title,focus,allowed,advanced])=>({id,title,focus,rings:[
 {id:'person',title:'Addressee',options:people.filter(p=>allowed.includes(p.id)).map(p=>choose(p.id,p.d))},
 {id:'verb',title:'Command',options:verbs.map(v=>choose(v.id,v.label))},
 {id:'object',title:'Object / destination',options:s=>verbs.find(v=>v.id===s.verb).objects.map((o,i)=>choose('v'+i,o[0]))},
 {id:'where',title:'Where / when',options:[choose('now','अधुना',{d:'अधुना',r:'adhunā',e:'now'}),choose('today','अद्य',{d:'अद्य',r:'adya',e:'today'}),choose('soon','शीघ्रम्',{d:'शीघ्रम्',r:'śīghram',e:'quickly'})]},
 {id:'style',title:'Tone',options:advanced?[choose('plain','सामान्यम्'),choose('please','कृपया'),choose('once','एकवारम्')]:[choose('plain','सामान्यम्'),choose('please','कृपया')]}
 ],build:(s,c)=>{
 const p=people.find(x=>x.id===s.person),v=verbs.find(x=>x.id===s.verb),o=v.objects[Number(s.object.slice(1))],form=v.forms[p.p],tone=s.style==='please'?['कृपया ','kṛpayā ','please ']:s.style==='once'?['एकवारम् ','ekavāram ','once ']:['','',''];
 return {lines:[line(`${tone[0]}${p.d} ${c.where.d} ${o[0]} ${form[0]}।`,`${tone[1]}${p.r} ${c.where.r} ${o[1]} ${form[1]}.`,`${tone[2]}${p.e}, ${s.verb==='read'?'read':s.verb==='write'?'write':s.verb==='say'?'say':'go to'} ${o[2]} ${c.where.e}.`)],note:'Imperatives are curated by addressee (informal, polite, plural); this wheel does not invent negative-command forms.'};
 }}));
registerFamily({id:'commands',number:10,title:'Commands & Requests',sub:'Read · write · go · speak',description:'Grammatical imperatives and polite requests with real agreement.',levels});
})();
