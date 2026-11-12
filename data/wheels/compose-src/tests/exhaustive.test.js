'use strict';
// Run: node tests/exhaustive.test.js
const assert=require('node:assert/strict');
const fs=require('node:fs');
require('../src/core.js');require('../src/shared.js');
for(const f of fs.readdirSync(__dirname+'/../src/families').sort())require('../src/families/'+f);
require('../src/curriculum.js');
const {families,resolve,generate,runCombinations,allLevels}=globalThis.SW;
const graph=globalThis.SWCurriculum;
assert.equal(families.length,15);
assert.equal(allLevels().length,60);
graph.validate();
let total=0;
const counts=[];
for(const {family,level} of allLevels()){
 let count=0;
 runCombinations(level,g=>{
  assert.equal(Object.keys(g.state).length,5);
  assert.equal(g.rings.length,5);
  assert.ok(g.result.lines.length>0);
  for(const l of g.result.lines){
   assert.ok(l.dev.trim()&&l.roman.trim()&&l.en.trim());
   assert.doesNotMatch(l.dev+l.roman+l.en,/undefined|NaN|\[object Object\]/);
  }
  count++;
 });
 assert(count>=10,`Too few combinations for ${level.id}: ${count}`);
 total+=count;
 counts.push([level.id,count]);
}
const level=id=>allLevels().find(x=>x.level.id===id).level;
const get=(id,s)=>generate(level(id),s);
// Regression checks for original six families.
assert.match(get('1.1',{addressee:'sir',intent:'well'}).result.lines[0].roman,/bhavān katham asti/);
assert.match(get('1.1',{addressee:'friend',intent:'well'}).result.lines[0].roman,/tvaṃ katham asi/);
assert.match(get('1.1',{intent:'age',reply:'v0'}).result.lines[1].roman,/saptaviṃśatiḥ/);
assert.equal(resolve(level('3.1'),{verb:'go',target:'sans'}).state.target,'home');
assert.match(get('6.2',{tense:'past',actor:'i',verb:'read'}).result.lines[0].roman,/apaṭham/);
assert.match(get('6.2',{tense:'future',actor:'sir',verb:'go'}).result.lines[0].roman,/gamiṣyati/);
assert.match(get('6.3',{actor:'we',verb:'read'}).result.lines[0].roman,/paṭhāmaḥ/);
assert.match(get('6.4',{change:'future',actor:'you'}).result.lines[1].roman,/paṭhiṣyasi|gamiṣyasi|lekhiṣyasi/);
// New mechanisms: lexical stems, case-dependent choices, number/verb agreement,
// proper command endings, sequencing, correlative pair matching, causative,
// quotation, and compound analytical target.
assert.match(get('7.1',{stem:'s0',actor:'sir'}).result.lines[0].roman,/bhavān kutra/);
assert.match(get('7.2',{stem:'s2'}).result.lines[0].roman,/yadā .* tadā/);
assert.match(get('7.3',{stem:'s0'}).result.lines[0].roman,/kutaḥ/);
assert.match(get('7.4',{stem:'s2'}).result.lines[0].roman,/yathā .* tathā/);
assert.notEqual(resolve(level('8.1'),{action:'read',object:'fruit'}).state.object,'fruit');
assert.notEqual(resolve(level('8.2'),{who:'guru',recipient:'teacher'}).state.recipient,'teacher');
assert.match(get('8.2',{who:'guru',recipient:'student'}).result.lines[0].roman,/śiṣyāya/);
assert.match(get('8.4',{from:'home',to:'ashram'}).result.lines[0].roman,/gṛhāt āśramam/);
assert.match(get('9.1',{count:'n2'}).result.lines[0].roman,/dvau śiṣyau paṭhataḥ/);
assert.match(get('9.2',{count:'n3'}).result.lines[0].roman,/tisraḥ śiṣyāḥ paṭhanti/);
assert.match(get('9.3',{count:'n3'}).result.lines[0].roman,/trīṇi pustakāni santi/);
assert.match(get('10.3',{person:'sir',verb:'read'}).result.lines[0].roman,/bhavān.*paṭhatu/);
assert.match(get('10.3',{person:'all',verb:'read'}).result.lines[0].roman,/yūyam.*paṭhata/);
assert.match(get('11.2',{actor:'sir',first:'read'}).result.lines[0].roman,/bhavān saṃskṛtaṃ paṭhitvā/);
assert.match(get('12.1',{person:'sir'}).result.lines[0].roman,/yadā bhavān .* tadā/);
assert.match(get('13.1',{learner:'student'}).result.lines[1].roman,/śiṣyam .* pāṭhayati/);
assert.match(get('14.3',{quote:'question'}).result.lines[0].roman,/iti pṛcchati/);
assert.match(get('15.1',{first:'guru',second:'bhakti',case:'gen',direction:'join'}).result.lines[1].roman,/gurubhakteḥ/);
assert.equal(level('15.4').challenge,true);
// Dependency-aware, non-hard-lock progression and transparent self-rating algorithm.
assert.equal(graph.order.length,60);
assert(graph.prereqs('12.1').includes('7.2'));
assert(graph.neighbors('12.1').includes('7.2'));
assert.equal(graph.recommend({}),'1.1');
const grades={};const id='1.1';
for(let i=0;i<8;i++)graph.practice(grades,id,`unique${i}`,'yes');
assert.equal(graph.metrics(grades,id).ready,true);
assert.equal(graph.metrics(grades,id).mastered,false);
assert.equal(graph.recommend(grades),'7.1');
for(let i=0;i<3;i++)grades[id].attempts.push({key:'day2'+i,grade:'yes',day:'2000-01-01'});
assert.equal(graph.metrics(grades,id).mastered,true);
console.log(`PASS: ${families.length} families · ${allLevels().length} levels · ${total.toLocaleString()} generated states · curriculum DAG and self-rated mastery checks.`);
console.log(counts.map(([id,n])=>`${id}=${n}`).join(' '));
