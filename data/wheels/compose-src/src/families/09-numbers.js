/* 9: agreement with explicitly curated singular, dual and plural noun/verb forms. */
(function(){'use strict';const {line,choose,registerFamily}=SW;
const people=[
 {id:'m',label:'शिष्य',e:'male students',n:[['एकः शिष्यः','ekaḥ śiṣyaḥ','one student'],['द्वौ शिष्यौ','dvau śiṣyau','two students'],['त्रयः शिष्याः','trayaḥ śiṣyāḥ','three students'],['चत्वारः शिष्याः','catvāraḥ śiṣyāḥ','four students'],['पञ्च शिष्याः','pañca śiṣyāḥ','five students']],acts:{read:[['पठति','paṭhati'],['पठतः','paṭhataḥ'],['पठन्ति','paṭhanti']],go:[['गच्छति','gacchati'],['गच्छतः','gacchataḥ'],['गच्छन्ति','gacchanti']]}},
 {id:'f',label:'शिष्या',e:'female students',n:[['एका शिष्या','ekā śiṣyā','one female student'],['द्वे शिष्ये','dve śiṣye','two female students'],['तिस्रः शिष्याः','tisraḥ śiṣyāḥ','three female students'],['चतस्रः शिष्याः','catasraḥ śiṣyāḥ','four female students'],['पञ्च शिष्याः','pañca śiṣyāḥ','five female students']],acts:{read:[['पठति','paṭhati'],['पठतः','paṭhataḥ'],['पठन्ति','paṭhanti']],go:[['गच्छति','gacchati'],['गच्छतः','gacchataḥ'],['गच्छन्ति','gacchanti']]}},
 {id:'n',label:'पुस्तक',e:'books',n:[['एकं पुस्तकम्','ekaṃ pustakam','one book'],['द्वे पुस्तके','dve pustake','two books'],['त्रीणि पुस्तकानि','trīṇi pustakāni','three books'],['चत्वारि पुस्तकानि','catvāri pustakāni','four books'],['पञ्च पुस्तकानि','pañca pustakāni','five books']],acts:{exist:[['अस्ति','asti'],['स्तः','staḥ'],['सन्ति','santi']],new:[['नवीनम् अस्ति','navīnam asti'],['नवीने स्तः','navīne staḥ'],['नवीनानि सन्ति','navīnāni santi']]}}
];

people[0].kind='m';people[1].kind='f';people[2].kind='n';
people.push({id:'m2',label:'बाल',kind:'m',e:'boys',n:[['एकः बालः','ekaḥ bālaḥ','one boy'],['द्वौ बालौ','dvau bālau','two boys'],['त्रयः बालाः','trayaḥ bālāḥ','three boys'],['चत्वारः बालाः','catvāraḥ bālāḥ','four boys'],['पञ्च बालाः','pañca bālāḥ','five boys']],acts:people[0].acts});
people.push({id:'f2',label:'बालिका',kind:'f',e:'girls',n:[['एका बालिका','ekā bālikā','one girl'],['द्वे बालिके','dve bālike','two girls'],['तिस्रः बालिकाः','tisraḥ bālikāḥ','three girls'],['चतस्रः बालिकाः','catasraḥ bālikāḥ','four girls'],['पञ्च बालिकाः','pañca bālikāḥ','five girls']],acts:people[1].acts});
people.push({id:'n2',label:'फल',kind:'n',e:'fruits',n:[['एकं फलम्','ekaṃ phalam','one fruit'],['द्वे फले','dve phale','two fruits'],['त्रीणि फलानि','trīṇi phalāni','three fruits'],['चत्वारि फलानि','catvāri phalāni','four fruits'],['पञ्च फलानि','pañca phalāni','five fruits']],acts:people[2].acts});

const levels=[
 ['9.1','Masculine: eka/dvau/trayaḥ','Masculine students: numerals, singular/dual/plural verbs.',['m','m2']],
 ['9.2','Feminine: ekā/dve/tisraḥ','Feminine students require different numerals.',['f','f2']],
 ['9.3','Neuter: ekaṃ/dve/trīṇi','Neuter books, copula and adjective agreement.',['n','n2']],
 ['9.4','Gender-switch challenge','Rotate gender, number, action and agreement together.',['m','m2','f','f2','n','n2']]
].map(([id,title,focus,types])=>({id,title,focus,rings:[
 {id:'noun',title:'Noun gender',options:types.map(k=>{const p=people.find(x=>x.id===k);return choose(k,p.label)})},
 {id:'count',title:'One to five',options:[1,2,3,4,5].map(n=>choose('n'+n,'०१२३४५'[n]))},
 {id:'action',title:'Action',options:s=>people.find(x=>x.id===s.noun).kind==='n'?[choose('exist','अस्ति'),choose('new','नवीनम्')]:[choose('read','पठ्'),choose('go','गम्')]},
 {id:'polarity',title:'Yes / no',options:[choose('yes','आम्'),choose('no','न')]},
 {id:'place',title:'Place',options:[choose('here','अत्र',{d:'अत्र',r:'atra',e:'here'}),choose('there','तत्र',{d:'तत्र',r:'tatra',e:'there'})]}
 ],build:(s,c)=>{
 const p=people.find(x=>x.id===s.noun),n=Number(s.count.slice(1)),triple=p.n[n-1],verb=p.acts[s.action][n===1?0:n===2?1:2],neg=s.polarity==='no';
 const [dev,roman,label]=triple;
 const dv=dev;const engVerb=s.action==='read'?(n===1?'studies':'study'):s.action==='go'?(n===1?'goes':'go'):s.action==='exist'?(n===1?'is':'are'):(n===1?'is new':'are new');
 return {lines:[line(`${c.place.d} ${dv} ${neg?'न ':''}${verb[0]}।`,`${c.place.r} ${roman} ${neg?'na ':''}${verb[1]}.`,`${label} ${neg?(p.kind==='n'?(n===1?'is not':'are not'):(n===1?'does not':'do not'))+' ':''}${neg?(p.kind==='n'?(s.action==='new'?'new':'present'):(s.action==='read'?'study':'go')):engVerb} ${c.place.e}.`)],note:'1 → singular, 2 → dual, 3–5 → plural. The nominal numeral forms depend on gender; verbs depend on grammatical number.'};
 }}));
registerFamily({id:'numbers',number:9,title:'Number & Agreement',sub:'1 · 2 · many → forms change',description:'Rotate number and gender, forcing the Sanskrit numeral, noun and verb to agree.',levels});
})();
