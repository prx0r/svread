/**
 * Sanskrit Bruno Wheels · reviewed teaching vocabulary (v1).
 * Every word form is explicitly entered; no unrestricted string concatenation.
 * Sources: Whitney, Sanskrit Grammar §§1098–1103; Siddhāntakaumudī
 * prāgdiśīya section; Pāṇini 5.3.7, 5.3.10, 5.3.15, 5.3.23, 5.3.25.
 * Rule IDs are reference pointers, NOT an algorithmic proof of derivation.
 */
(function (root) {
  'use strict';
  const stems = [
    { id:'kim', deva:'किम्', en:'question', short:'what?' },
    { id:'tad', deva:'तद्', en:'demonstrative', short:'that' },
    { id:'yad', deva:'यद्', en:'relative', short:'which' },
    { id:'sarva', deva:'सर्व', en:'universal', short:'all' },
    { id:'eka', deva:'एक', en:'numeral', short:'one' },
    { id:'anya', deva:'अन्य', en:'alternative', short:'other' }
  ];
  const endings = [
    { id:'place', deva:'त्र', en:'place', question:'WHERE?', rule:'5.3.10', technical:'त्रल्' },
    { id:'time', deva:'दा', en:'time', question:'WHEN?', rule:'5.3.15', technical:'दा' },
    { id:'source', deva:'तः', en:'source', question:'FROM WHERE?', rule:'5.3.7', technical:'तसिल्' },
    { id:'manner', deva:'था', en:'manner', question:'HOW?', rule:'5.3.23', technical:'थाल्' }
  ];
  const regular=(word,en,formula,example,exampleEn,ruleExtra='')=>({word,en,formula,example,exampleEn,ruleExtra});
  const words = {
    kim: {
      place: regular('कुत्र','where?','किम् → कु- · + -त्र','कुत्र गच्छसि?','Where are you going?','Special interrogative stem'),
      time: regular('कदा','when?','किम् → क- · + -दा','कदा पठसि?','When do you study?','Stem changes'),
      source:regular('कुतः','from where?','किम् → कु- · + -तस् → -तः','कुतः आगच्छसि?','Where are you coming from?','Final -s surfaces as -ḥ in isolation'),
      manner:regular('कथम्','how?','किम् → क- · special -थम्','कथम् असि?','How are you?','Exception: Pāṇini 5.3.25, not regular -था')
    },
    tad: {
      place:regular('तत्र','there','त- + -त्र','मम माता तत्र अस्ति।','My mother is there.'),
      time:regular('तदा','then','त- + -दा','तदा पठामि।','I study then.'),
      source:regular('ततः','from there; therefore','त- + -तस् → -तः','ततः आगच्छामि।','I come from there.'),
      manner:regular('तथा','thus; in that way','त- + -था','यथा ... तथा ...','As ... so ...')
    },
    yad: {
      place:regular('यत्र','where ... (relative)','य- + -त्र','यत्र ... तत्र ...','Where ... there ...'),
      time:regular('यदा','when ... (relative)','य- + -दा','यदा ... तदा ...','When ... then ...'),
      source:regular('यतः','from where ...; because','य- + -तस् → -तः','यतः ... ततः ...','From where ... from there ...'),
      manner:regular('यथा','as; in which way','य- + -था','यथा ... तथा ...','As ... so ...')
    },
    sarva: {
      place:regular('सर्वत्र','everywhere','सर्व + -त्र','सर्वत्र गच्छामि।','I go everywhere.'),
      time:regular('सर्वदा','always','सर्व + -दा','अहं सर्वदा सुखी अस्मि।','I am always happy.'),
      source:regular('सर्वतः','from / on every side','सर्व + -तस् → -तः','सर्वतः','On every side.'),
      manner:regular('सर्वथा','in every way; entirely','सर्व + -था','सर्वथा','In every way.')
    },
    eka: {
      place:regular('एकत्र','together; in one place','एक + -त्र','एकत्र','In one place.'),
      time:regular('एकदा','once; at one time','एक + -दा','एकदा','Once.'),
      source:regular('एकतः','from / on one side','एक + -तस् → -तः','एकतः','On one side.'),
      manner:null // Rare ekathā is attested in JB (Whitney §1101); omit for beginner pedagogy.
    },
    anya: {
      place:regular('अन्यत्र','elsewhere','अन्य + -त्र','अन्यत्र गच्छामि।','I go elsewhere.'),
      time:regular('अन्यदा','at another time','अन्य + -दा','अन्यदा पठामि।','I study at another time.'),
      source:regular('अन्यतः','from elsewhere; from another side','अन्य + -तस् → -तः','अन्यतः','From elsewhere.'),
      manner:regular('अन्यथा','otherwise; differently','अन्य + -था','अन्यथा','Otherwise.')
    }
  };
  const owners=[
    {id:'my',deva:'मम',en:'my'},
    {id:'your',deva:'तव',en:'your'},
    {id:'his',deva:'तस्य',en:'his'},
    {id:'her',deva:'तस्याः',en:'her'}
  ];
  const subjects=[
    {id:'i',deva:'अहम्',en:'I',person:'first',kind:'pronoun'},
    {id:'you',deva:'त्वम्',en:'you',person:'second',kind:'pronoun'},
    {id:'mother',deva:'माता',en:'mother',person:'third',gender:'f',kind:'family'},
    {id:'father',deva:'पिता',en:'father',person:'third',gender:'m',kind:'family'}
  ];
  const places=[
    {id:'none',deva:'—',en:''},
    {id:'here',deva:'अत्र',en:'here'},
    {id:'there',deva:'तत्र',en:'there'},
    {id:'elsewhere',deva:'अन्यत्र',en:'elsewhere'},
    {id:'everywhere',deva:'सर्वत्र',en:'everywhere'}
  ];
  const times=[
    {id:'none',deva:'—',en:''},
    {id:'always',deva:'सर्वदा',en:'always'},
    {id:'then',deva:'तदा',en:'then'},
    {id:'once',deva:'एकदा',en:'once'}
  ];
  const predicates=[
    {id:'be',deva:'अस्',en:'be',forms:{first:'अस्मि',second:'असि',third:'अस्ति'}},
    {id:'happy',deva:'सुखिन्',en:'be happy',forms:{first:'अस्मि',second:'असि',third:'अस्ति'}},
    {id:'go',deva:'गम्',en:'go',forms:{first:'गच्छामि',second:'गच्छसि',third:'गच्छति'}},
    {id:'come',deva:'आगम्',en:'come',forms:{first:'आगच्छामि',second:'आगच्छसि',third:'आगच्छति'}},
    {id:'study',deva:'पठ्',en:'study',forms:{first:'पठामि',second:'पठसि',third:'पठति'}}
  ];
  const modes=[
    {id:'statement',label:'Statement'},
    {id:'where',label:'Where?'},
    {id:'when',label:'When?'},
    {id:'how',label:'How?'},
    {id:'source',label:'From where?'}
  ];
  const grammarSources=[
    {name:'Siddhāntakaumudī: pronoun-derived adverbs',url:'https://www.premabase.com/siddhanta-kaumudi/p40/textbook/index.html'},
    {name:'Whitney, Sanskrit Grammar, Chapter XVI',url:'https://en.wikisource.org/wiki/Sanskrit_Grammar_(Whitney)/Chapter_XVI'},
    {name:'Vidyut Pāṇinian derivation engine',url:'https://github.com/ambuda-org/vidyut'},
    {name:'LearnSanskrit: pronouns',url:'https://www.learnsanskrit.org/guide/nominals/pronouns/'}
  ];
  const data={stems,endings,words,owners,subjects,places,times,predicates,modes,grammarSources};
  if(typeof module==='object' && module.exports) module.exports=data;
  root.SanskritData=data;
})(typeof window!=='undefined'?window:globalThis);
