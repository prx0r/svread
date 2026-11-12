/* 7: ka–ta–ya: curated stems, not naive affix concatenation. */
(function(){'use strict';
const {line,choose,registerFamily}=SW;
const actors=[
 {id:'i',label:'अहम्',d:'अहं',r:'ahaṃ',e:'I',p:0},
 {id:'you',label:'त्वम्',d:'त्वं',r:'tvaṃ',e:'you',p:1},
 {id:'sir',label:'भवान्',d:'भवान्',r:'bhavān',e:'you (respectful)',p:2},
 {id:'he',label:'सः',d:'सः',r:'saḥ',e:'he',p:2}
];
const patterns=[
 {id:'7.1',title:'Place: -tra',focus:'kutra → tatra → yatra, in genuine questions, statements, and correlations.',words:[['कुत्र','kutra','where'],['तत्र','tatra','there'],['यत्र','yatra','wherever']],acts:[['पठ्','read','पठामि','पठसि','पठति','paṭhāmi','paṭhasi','paṭhati'],['वस्','live','वसामि','वससि','वसति','vasāmi','vasasi','vasati'],['गम्','go','गच्छामि','गच्छसि','गच्छति','gacchāmi','gacchasi','gacchati']]},
 {id:'7.2',title:'Time: -dā',focus:'kadā → tadā → yadā. Practise when/then/whenever.',words:[['कदा','kadā','when'],['तदा','tadā','then'],['यदा','yadā','when']],acts:[['पठ्','read','पठामि','पठसि','पठति','paṭhāmi','paṭhasi','paṭhati'],['गम्','go','गच्छामि','गच्छसि','गच्छति','gacchāmi','gacchasi','gacchati'],['लिख्','write','लिखामि','लिखसि','लिखति','likhāmi','likhasi','likhati']]},
 {id:'7.3',title:'Source: -taḥ',focus:'kutaḥ → tataḥ → yataḥ. Source and departure expressions.',words:[['कुतः','kutaḥ','from where'],['ततः','tataḥ','from there'],['यतः','yataḥ','from wherever']],acts:[['आगम्','come','आगच्छामि','आगच्छसि','आगच्छति','āgacchāmi','āgacchasi','āgacchati'],['निवृत्','return','निवर्ते','निवर्तसे','निवर्तते','nivarte','nivartase','nivartate']]},
 {id:'7.4',title:'Manner: how/as/so',focus:'katham → tathā → yathā. These are curated real forms, not a pretend -thā suffix.',words:[['कथम्','katham','how'],['तथा','tathā','thus'],['यथा','yathā','as']],acts:[['पठ्','read','पठामि','पठसि','पठति','paṭhāmi','paṭhasi','paṭhati'],['लिख्','write','लिखामि','लिखसि','लिखति','likhāmi','likhasi','likhati'],['वद्','speak','वदामि','वदसि','वदति','vadāmi','vadasi','vadati']]}
];
const levels=patterns.map(config=>({id:config.id,title:config.title,focus:config.focus,rings:[
 {id:'stem',title:'ka / ta / ya',options:config.words.map((w,i)=>choose('s'+i,w[0],{en:w[2]}))},
 {id:'actor',title:'Person',options:actors.map(p=>choose(p.id,p.label))},
 {id:'verb',title:'Action',options:config.acts.map((v,i)=>choose('v'+i,v[0],{en:v[1]}))},
 {id:'polarity',title:'Yes / no',options:[choose('yes','आम्'),choose('no','न')]},
 {id:'echo',title:'Follow-through',options:[choose('same','अहम् अपि'),choose('next','अहं लिखामि'),choose('stay','अहं तिष्ठामि')]}
 ],build:s=>{
 const p=actors.find(x=>x.id===s.actor),w=config.words[Number(s.stem.slice(1))],v=config.acts[Number(s.verb.slice(1))],neg=s.polarity==='no',verbD=v[2+p.p],verbR=v[5+p.p];
 const predD=`${p.d} ${neg?'न ':''}${verbD}`,predR=`${p.r} ${neg?'na ':''}${verbR}`;
 const second={same:['अहम् अपि तथैव करोमि','aham api tathaiva karomi','I do so too'],next:['अहं लिखामि','ahaṃ likhāmi','I write'],stay:['अहं तिष्ठामि','ahaṃ tiṣṭhāmi','I stay']}[s.echo];
 const isQ=s.stem==='s0',isRel=s.stem==='s2';
 const verbEn={read:'study',live:'live',go:'go',come:'come',return:'return',write:'write',speak:'speak'}[v[1]]||v[1];
 const verbEn3={study:'studies',live:'lives',go:'goes',come:'comes',return:'returns',write:'writes',speak:'speaks'}[verbEn]||verbEn;
 const subject=p.e==='you (respectful)'?'you':p.e,third=p.id==='he',negEn=third?'does not':'do not';
 let d,r,e;
 if(isQ){d=`${p.d} ${w[0]} ${neg?'न ':''}${verbD}?`;r=`${p.r} ${w[1]} ${neg?'na ':''}${verbR}?`;e=`${w[2]} ${third?'does':'do'} ${subject} ${neg?'not ':''}${verbEn}?`;}
 else if(isRel){const correl=['तत्र','तदा','ततः','तथा'][Number(config.id.slice(-1))-1],corrR=['tatra','tadā','tataḥ','tathā'][Number(config.id.slice(-1))-1];
 d=`${w[0]} ${predD}, ${correl} ${second[0]}।`;r=`${w[1]} ${predR}, ${corrR} ${second[1]}.`;e=`${w[2]} ${subject} ${neg?negEn+' ':''}${neg?verbEn:(third?verbEn3:verbEn)}, ${second[2]}.`;
 }else {d=`${p.d} ${w[0]} ${neg?'न ':''}${verbD}।`;r=`${p.r} ${w[1]} ${neg?'na ':''}${verbR}.`;e=`${subject} ${neg?negEn+' ':''}${neg?verbEn:(third?verbEn3:verbEn)} ${w[2]}.`;}
 return {lines:[line(d,r,e)],note:'The ka/ta/ya stems are lexical paradigms; the model does not fabricate forms by attaching arbitrary suffixes.'};
 }}));
registerFamily({id:'deictics',number:7,title:'KA–TA–YA',sub:'Where · when · whence · how',description:'One small set of question, demonstrative and relative patterns builds an enormous usable family.',levels});
})();
