/* Curated forms shared between families. These are data, not a general Sanskrit inflector. */
(function(root){
'use strict';
const people=[
 {id:'i',label:'अहम्',dev:'अहम्',roman:'aham',en:'I',person:'first',nom:'अहम्',nomR:'aham',dative:'मह्यम्',dativeR:'mahyam'},
 {id:'you',label:'त्वम्',dev:'त्वम्',roman:'tvam',en:'you (familiar)',person:'second',nom:'त्वम्',nomR:'tvaṃ',dative:'तुभ्यम्',dativeR:'tubhyam'},
 {id:'sir',label:'भवान्',dev:'भवान्',roman:'bhavān',en:'you (polite, man)',person:'third',nom:'भवान्',nomR:'bhavān',dative:'भवते',dativeR:'bhavate'},
 {id:'madam',label:'भवती',dev:'भवती',roman:'bhavatī',en:'you (polite, woman)',person:'third',nom:'भवती',nomR:'bhavatī',dative:'भवत्यै',dativeR:'bhavatyai'},
 {id:'he',label:'सः',dev:'सः',roman:'saḥ',en:'he',person:'third',nom:'सः',nomR:'saḥ',dative:'तस्मै',dativeR:'tasmai'}
];
const verbs={
 read:{label:'पठ् · study',transitive:true,forms:{first:['पठामि','paṭhāmi'],second:['पठसि','paṭhasi'],third:['पठति','paṭhati']},future:{first:['पठिष्यामि','paṭhiṣyāmi'],second:['पठिष्यसि','paṭhiṣyasi'],third:['पठिष्यति','paṭhiṣyati']},past:{first:['अपठम्','apaṭham'],second:['अपठः','apaṭhaḥ'],third:['अपठत्','apaṭhat']},inf:['पठितुम्','paṭhitum']},
 go:{label:'गम् · go',transitive:false,forms:{first:['गच्छामि','gacchāmi'],second:['गच्छसि','gacchasi'],third:['गच्छति','gacchati']},future:{first:['गमिष्यामि','gamiṣyāmi'],second:['गमिष्यसि','gamiṣyasi'],third:['गमिष्यति','gamiṣyati']},past:{first:['अगच्छम्','agaccham'],second:['अगच्छः','agacchaḥ'],third:['अगच्छत्','agacchat']},inf:['गन्तुम्','gantum']},
 write:{label:'लिख् · write',transitive:true,forms:{first:['लिखामि','likhāmi'],second:['लिखसि','likhasi'],third:['लिखति','likhati']},future:{first:['लेखिष्यामि','lekhiṣyāmi'],second:['लेखिष्यसि','lekhiṣyasi'],third:['लेखिष्यति','lekhiṣyati']},past:{first:['अलिखम्','alikham'],second:['अलिखः','alikhaḥ'],third:['अलिखत्','alikhat']},inf:['लेखितुम्','lekhitum']}
};
const topics=[
 {id:'sanskrit',label:'संस्कृतम्',dev:'संस्कृतम्',roman:'saṃskṛtam',en:'Sanskrit',adjN:['सुन्दरम्','sundaram','beautiful'],pronN:['तत्','tat','it'],reason:[['तत् मधुरम् अस्ति','tat madhuram asti','it sounds sweet'],['तत् उपयुक्तम् अस्ति','tat upayuktam asti','it is useful']]},
 {id:'meditation',label:'ध्यानम्',dev:'ध्यानम्',roman:'dhyānam',en:'meditation',adjN:['उपयुक्तम्','upayuktam','useful'],pronN:['तत्','tat','it'],reason:[['तत् शान्तिदायकम् अस्ति','tat śāntidāyakam asti','it is calming'],['तत् मनः स्थिरीकरोति','tat manaḥ sthirīkaroti','it steadies the mind']]},
 {id:'book',label:'पुस्तकम्',dev:'पुस्तकम्',roman:'pustakam',en:'the book',adjN:['सुन्दरम्','sundaram','beautiful'],pronN:['तत्','tat','it'],reason:[['तत् रोचकम् अस्ति','tat rocakam asti','it is interesting'],['तत् नवीनम् अस्ति','tat navīnam asti','it is new']]},
 {id:'music',label:'गीतम्',dev:'गीतम्',roman:'gītam',en:'the song',adjN:['मधुरम्','madhuram','sweet'],pronN:['तत्','tat','it'],reason:[['तत् मधुरम् अस्ति','tat madhuram asti','it sounds sweet'],['तत् मनोहरम् अस्ति','tat manoharam asti','it is delightful']]}
];
const times=[{id:'now',label:'अधुना',dev:'अधुना',roman:'adhunā',en:'now'}, {id:'today',label:'अद्य',dev:'अद्य',roman:'adya',en:'today'}, {id:'always',label:'सर्वदा',dev:'सर्वदा',roman:'sarvadā',en:'always'}];
root.SWShared={people,verbs,topics,times};
})(globalThis);
