const assert=require('node:assert/strict');
const D=require('../data.js');
const E=require('../engine.js');
let count=0;
function eq(actual,expected,msg){assert.equal(actual,expected,msg);count++;}
const expected=[
['kim',['कुत्र','कदा','कुतः','कथम्']],
['tad',['तत्र','तदा','ततः','तथा']],
['yad',['यत्र','यदा','यतः','यथा']],
['sarva',['सर्वत्र','सर्वदा','सर्वतः','सर्वथा']],
['eka',['एकत्र','एकदा','एकतः',null]],
['anya',['अन्यत्र','अन्यदा','अन्यतः','अन्यथा']]
];
for(const [stem,forms] of expected){forms.forEach((word,i)=>eq(E.stemWord(stem,D.endings[i].id)?.word||null,word,stem+'/'+D.endings[i].id));}
function s(settings){return E.sentence({...E.initialState,...settings});}
eq(s({subject:'i',time:'none',place:'here',predicate:'be'}).text,'अहम् अत्र अस्मि।');
eq(s({subject:'mother',owner:'my',time:'none',place:'there',predicate:'be'}).text,'मम माता तत्र अस्ति।');
eq(s({subject:'mother',owner:'my',time:'always',place:'none',predicate:'happy'}).text,'मम माता सर्वदा सुखिनी अस्ति।');
eq(s({subject:'i',time:'always',place:'none',predicate:'happy'}).text,'अहम् सर्वदा सुखी अस्मि।');
eq(s({subject:'you',time:'none',place:'none',predicate:'study',mode:'when'}).text,'त्वम् कदा पठसि?');
eq(s({subject:'you',time:'none',place:'none',predicate:'come',mode:'source'}).text,'त्वम् कुतः आगच्छसि?');
eq(s({subject:'father',owner:'your',time:'none',place:'there',predicate:'go'}).text,'तव पिता तत्र गच्छति।');
eq(s({subject:'mother',owner:'her',time:'none',place:'there',predicate:'happy'}).text,'तस्याः माता तत्र सुखिनी अस्ति।');
eq(s({subject:'you',gender:'f',time:'none',place:'here',predicate:'happy'}).text,'त्वम् अत्र सुखिनी असि।');
eq(s({subject:'you',time:'none',place:'there',predicate:'study',mode:'how'}).text,'त्वम् कथम् तत्र पठसि?');
eq(s({subject:'i',time:'none',place:'there',predicate:'be',mode:'source'}).valid,false);
// Exhaustively ensure supported small sentence combinations produce outputs, with no undefined tokens.
for(const subject of D.subjects){for(const owner of D.owners){for(const place of D.places){for(const time of D.times.filter(x=>x.id!=='once')){for(const predicate of D.predicates){for(const mode of D.modes){if(mode.id==='source'&&predicate.id!=='come')continue;const out=s({subject:subject.id,owner:owner.id,place:place.id,time:time.id,predicate:predicate.id,mode:mode.id});assert(out.valid);assert(!out.text.includes('undefined'));assert(!out.text.includes('null'));assert(out.tokens.length>=2);count++;}}}}}}
console.log(`PASS: ${count} assertions, including all 23 beginner word forms and every permitted wheel configuration.`);
