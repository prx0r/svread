/** Pure, deliberately constrained Sanskrit sentence engine. */
(function (root) {
  'use strict';
  const D = (typeof require==='function' && typeof module==='object' && module.exports)
    ? require('./data.js') : root.SanskritData;
  const byId=(arr,id)=>arr.find(x=>x.id===id);
  const initialState={subject:'i',owner:'my',gender:'m',place:'here',time:'always',predicate:'happy',mode:'statement'};
  const stemWord=(stemId,endingId)=>D.words[stemId] && D.words[stemId][endingId] || null;
  function sentence(s) {
    const subject=byId(D.subjects,s.subject),owner=byId(D.owners,s.owner);
    const place=byId(D.places,s.place),time=byId(D.times,s.time);
    const pred=byId(D.predicates,s.predicate);
    if(!subject||!owner||!place||!time||!pred) return {valid:false,error:'Unknown selection'};
    if(!D.modes.some(x=>x.id===s.mode)) return {valid:false,error:'Unknown sentence mode'};
    if(s.mode==='source'&&pred.id!=='come')
      return {valid:false,error:'“From where?” requires a source-compatible action in this starter engine. Select “come”.'};
    // Nominal person and gender determine the finite verb and adjective.
    const gender=subject.gender || (s.gender==='f'?'f':'m');
    const subjectDeva=subject.kind==='family'?owner.deva+' '+subject.deva:subject.deva;
    const subjectEn=subject.kind==='family'?owner.en+' '+subject.en:subject.en;
    const person=subject.person;
    const verb=pred.forms[person];
    const quality=pred.id==='happy'?(gender==='f'?'सुखिनी':'सुखी'):'';
    const loc=s.mode==='where'?'कुत्र':s.mode==='source'?'कुतः':place.id!=='none'?place.deva:'';
    const timeDeva=s.mode==='when'?'कदा':time.id!=='none'?time.deva:'';
    const how=s.mode==='how'?'कथम्':'';
    const tokens=[subjectDeva,timeDeva,how,loc,quality,verb].filter(Boolean);
    const text=tokens.join(' ')+(s.mode==='statement'?'।':'?');
    const be=person==='first'?'am':person==='second'?'are':'is';
    const subjLower=subjectEn;
    const actualPlace=place.en,actualTime=time.en;
    const coreVerb=pred.id==='be'?'':pred.id==='happy'?'happy':pred.id==='go'?'go':pred.id==='come'?'come':'study';
    function conjPresent() {return pred.id==='go'?(person==='third'?'goes':'go'):pred.id==='come'?(person==='third'?'comes':'come'):person==='third'?'studies':'study';}
    function questionAux(){return person==='third'?'does':'do';}
    let english='';
    if(s.mode==='statement') {
      if(pred.id==='be'||pred.id==='happy') english=`${subjectEn} ${be}${actualTime?' '+actualTime:''}${coreVerb?' '+coreVerb:''}${actualPlace?' '+actualPlace:''}.`;
      else english=`${subjectEn} ${actualTime?actualTime+' ':''}${conjPresent()}${actualPlace?' '+actualPlace:''}.`;
    } else if(s.mode==='source') {
      english=`Where ${questionAux()} ${subjLower} come from${actualTime?' '+actualTime:''}?`;
    } else if(pred.id==='be'||pred.id==='happy') {
      const q=s.mode==='where'?'Where':s.mode==='when'?'When':'How';
      const timePhrase=s.mode==='when'?'':actualTime?' '+actualTime:'';
      const locPhrase=s.mode==='where'?'':actualPlace?' '+actualPlace:'';
      english=`${q} ${be} ${subjLower}${timePhrase}${coreVerb?' '+coreVerb:''}${locPhrase}?`;
    } else {
      const q=s.mode==='where'?'Where':s.mode==='when'?'When':'How';
      const timePhrase=s.mode==='when'?'':actualTime?' '+actualTime:'';
      const locPhrase=s.mode==='where'?'':actualPlace?' '+actualPlace:'';
      english=`${q} ${questionAux()} ${subjLower} ${coreVerb}${locPhrase}${timePhrase}?`;
    }
    english=english.charAt(0).toUpperCase()+english.slice(1);
    return {
      valid:true,text,english,tokens,
      details:[
        {label:'Subject',value:subjectDeva,why:`${person}-person singular${subject.kind==='family'?'; genitive possessor':''}`},
        {label:'Predicate',value:verb,why:`The verb agrees with the subject (${person}-person singular).`},
        ...(quality?[{label:'Agreement',value:quality,why:`Nom. singular ${gender==='f'?'feminine':'masculine'} of सुखिन् (happy).`}]:[]),
        ...(timeDeva?[{label:'Time',value:timeDeva,why:'Indeclinable adverb; does not change for person or gender.'}]:[]),
        ...(loc?[{label:s.mode==='source'?'Source':'Place',value:loc,why:'Indeclinable adverb; its form is independent of the subject.'}]:[]),
        ...(how?[{label:'Manner',value:'कथम्',why:'Special interrogative manner form (Pāṇini 5.3.25).'}]:[])
      ],
      note:'Teaching view: these are deliberately separate words (padaccheda), not an automatically sandhi-joined text.'
    };
  }
  const engine={D,initialState,byId,stemWord,sentence};
  if(typeof module==='object'&&module.exports)module.exports=engine;
  root.SanskritEngine=engine;
})(typeof window!=='undefined'?window:globalThis);
