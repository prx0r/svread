/* 15: attested/simple semantically checked tatpuruṣa entries; no blind compound algebra. */
(function(){'use strict';const {line,choose,registerFamily}=SW;
const pairs=[
 {first:'śiva',firstD:'शिव',second:'bhakti',secondD:'भक्ति',compound:'शिवभक्तिः',roman:'śivabhaktiḥ',gen:'शिवभक्तेः',genR:'śivabhakteḥ',loc:'शिवभक्तौ',locR:'śivabhaktau',vig:'शिवस्य भक्तिः',vigR:'śivasya bhaktiḥ',meaning:'devotion to Śiva'},
 {first:'guru',firstD:'गुरु',second:'bhakti',secondD:'भक्ति',compound:'गुरुभक्तिः',roman:'gurubhaktiḥ',gen:'गुरुभक्तेः',genR:'gurubhakteḥ'.replace('­',''),loc:'गुरुभक्तौ',locR:'gurubhaktau',vig:'गुरोः भक्तिः',vigR:'guroḥ bhaktiḥ',meaning:'devotion to the guru'},
 {first:'śiva',firstD:'शिव',second:'pūjā',secondD:'पूजा',compound:'शिवपूजा',roman:'śivapūjā',gen:'शिवपूजायाः',genR:'śivapūjāyāḥ',loc:'शिवपूजायाम्',locR:'śivapūjāyām',vig:'शिवस्य पूजा',vigR:'śivasya pūjā',meaning:'worship of Śiva'},
 {first:'guru',firstD:'गुरु',second:'pūjā',secondD:'पूजा',compound:'गुरुपूजा',roman:'gurupūjā',gen:'गुरुपूजायाः',genR:'gurupūjāyāḥ',loc:'गुरुपूजायाम्',locR:'gurupūjāyām',vig:'गुरोः पूजा',vigR:'guroḥ pūjā',meaning:'worship of the guru'},
 {first:'śiva',firstD:'शिव',second:'jñāna',secondD:'ज्ञान',compound:'शिवज्ञानम्',roman:'śivajñānam',gen:'शिवज्ञानस्य',genR:'śivajñānasya',loc:'शिवज्ञाने',locR:'śivajñāne',vig:'शिवस्य ज्ञानम्',vigR:'śivasya jñānam',meaning:'knowledge of Śiva'},
 {first:'ātma',firstD:'आत्म',second:'jñāna',secondD:'ज्ञान',compound:'आत्मज्ञानम्',roman:'ātmajñānam',gen:'आत्मज्ञानस्य',genR:'ātmajñānasya',loc:'आत्मज्ञाने',locR:'ātmajñāne',vig:'आत्मनः ज्ञानम्',vigR:'ātmanaḥ jñānam',meaning:'knowledge of the Self'},
 {first:'tattva',firstD:'तत्त्व',second:'jñāna',secondD:'ज्ञान',compound:'तत्त्वज्ञानम्',roman:'tattvajñānam',gen:'तत्त्वज्ञानस्य',genR:'tattvajñānasya',loc:'तत्त्वज्ञाने',locR:'tattvajñāne',vig:'तत्त्वस्य ज्ञानम्',vigR:'tattvasya jñānam',meaning:'knowledge of reality'},
 {first:'tattva',firstD:'तत्त्व',second:'vicāra',secondD:'विचार',compound:'तत्त्वविचारः',roman:'tattvavicāraḥ',gen:'तत्त्वविचारस्य',genR:'tattvavicārasya',loc:'तत्त्वविचारे',locR:'tattvavicāre',vig:'तत्त्वस्य विचारः',vigR:'tattvasya vicāraḥ',meaning:'investigation into reality'},
 {first:'ātma',firstD:'आत्म',second:'vicāra',secondD:'विचार',compound:'आत्मविचारः',roman:'ātmavicāraḥ',gen:'आत्मविचारस्य',genR:'ātmavicārasya',loc:'आत्मविचारे',locR:'ātmavicāre',vig:'आत्मनः विचारः',vigR:'ātmanaḥ vicāraḥ',meaning:'inquiry into the Self'}
];
const groups=[
 ['15.1','Devotion and worship','Combine transparent genitive tatpuruṣa compounds.',['bhakti','pūjā'],['śiva','guru']],
 ['15.2','Knowledge and inquiry','Explore jñāna and vicāra compounds.',['jñāna','vicāra'],['śiva','ātma','tattva']],
 ['15.3','Mix semantic families','Switch the first/last member while preserving valid curated combinations.',['bhakti','pūjā','jñāna','vicāra'],['śiva','guru','ātma','tattva']],
 ['15.4','Cases and analysis','Compound → case form → expanded vigraha.',['bhakti','pūjā','jñāna','vicāra'],['śiva','guru','ātma','tattva']]
];
const levels=groups.map(([id,title,focus,last,first])=>({id,title,focus,challenge:id==='15.4',rings:[
 {id:'first',title:'First member',options:[...new Set(pairs.filter(p=>first.includes(p.first)&&last.includes(p.second)).map(p=>p.first))].map(x=>{const p=pairs.find(y=>y.first===x);return choose(x,p.firstD)})},
 {id:'second',title:'Second member',options:s=>pairs.filter(p=>p.first===s.first&&last.includes(p.second)).map(p=>choose(p.second,p.secondD))},
 {id:'case',title:'Case',options:[choose('nom','प्रथमा'),choose('gen','षष्ठी'),choose('loc','सप्तमी')]},
 {id:'direction',title:'Training direction',options:[choose('join','समासः'),choose('split','विग्रहः')]},
 {id:'task',title:'Exercise focus',options:[choose('form','रूपम्'),choose('meaning','अर्थः')]}
 ],build:s=>{
 const p=pairs.find(x=>x.first===s.first&&x.second===s.second),d=s.case==='nom'?p.compound:s.case==='gen'?p.gen:p.loc,r=s.case==='nom'?p.roman:s.case==='gen'?p.genR:p.locR;
 const input=s.direction==='join'?line(`${p.firstD} + ${p.secondD}`,`${p.first} + ${p.second}`,`Combine into a compound denoting ${p.meaning}.`,'Prompt'):line(d,r,`Identify the parts and meaning of ${p.meaning}.`,'Prompt');
 const target=s.direction==='join'?line(d,r,`${p.meaning} (${s.case==='nom'?'nominative':s.case==='gen'?'genitive':'locative'})`,'Target (reveal to check)'):line(p.vig,p.vigR,p.meaning,'Target (reveal to check)');
 const meta=s.task==='meaning'?line('षष्ठीतत्पुरुषः','ṣaṣṭhī-tatpuruṣaḥ','Genitive tatpuruṣa: first member relates to second through a genitive expansion.','Analysis'):line(`${p.compound} ← ${p.vig}`,`${p.roman} ← ${p.vigR}`,`${p.meaning}.`,'Analysis');
 return {lines:[input,target,meta],note:'Finite vetted compound pairs. Inflected nominative/genitive/locative forms are listed explicitly; never concatenate two arbitrary words and claim the result is valid.'};
 }}));
registerFamily({id:'compounds',number:15,title:'Compounds',sub:'Join ↔ unpack real compounds',description:'Build, split, inflect and interpret curated Sanskrit compounds from real lexical forms.',levels});
})();
