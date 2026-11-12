'use strict';
// Run: node tests/exhaustive.test.js
const assert=require('node:assert/strict');
require('../src/core.js');require('../src/shared.js');
for(const filename of ['01-conversation','02-expression','03-action','04-description','05-logic','06-transformation']) require('../src/families/'+filename+'.js');
const {families,resolve,generate,runCombinations,allLevels}=globalThis.SW;
assert.equal(families.length,6);
assert.equal(allLevels().length,24);
let total=0;
const lines=[];
for(const {family,level} of allLevels()){
 let count=0;
 runCombinations(level,g=>{
  assert.equal(Object.keys(g.state).length,5);
  assert.equal(g.rings.length,5);
  assert.equal(g.result.lines.length>0,true);
  for(const l of g.result.lines){
   assert.ok(l.dev.trim()&&l.roman.trim()&&l.en.trim());
   assert.doesNotMatch(l.dev+l.roman+l.en,/undefined|NaN|\[object Object\]/);
  }
  count++;
 });
 assert(count>=32,`Insufficient combinations for ${level.id}: ${count}`);
 total+=count;
 const sample=generate(level,{});
 lines.push(`${level.id} | ${family.title} | ${level.title} | ${count} combinations | ${sample.result.lines[0].roman}`);
}
const convo=families[0].levels[0];
assert.match(generate(convo,{addressee:'sir',intent:'well'}).result.lines[0].roman,/bhavān katham asti/);
assert.match(generate(convo,{addressee:'friend',intent:'well'}).result.lines[0].roman,/tvaṃ katham asi/);
assert.match(generate(convo,{intent:'age',reply:'v0'}).result.lines[1].roman,/saptaviṃśatiḥ/);
const action=families.find(f=>f.id==='action').levels[0];
assert.equal(resolve(action,{verb:'go',target:'sans'}).state.target,'home','Object should reset to legal destination');
const trans=families.find(f=>f.id==='transformation').levels;
assert.match(generate(trans[1],{tense:'past',actor:'i',verb:'read'}).result.lines[0].roman,/apaṭham/);
assert.match(generate(trans[1],{tense:'future',actor:'sir',verb:'go'}).result.lines[0].roman,/gamiṣyati/);
assert.match(generate(trans[2],{actor:'we',verb:'read'}).result.lines[0].roman,/paṭhāmaḥ/);
assert.match(generate(trans[2],{actor:'youall',verb:'go'}).result.lines[0].roman,/gacchatha/);
assert.match(generate(trans[3],{change:'future',actor:'you'}).result.lines[1].roman,/paṭhiṣyasi|gamiṣyasi|lekhiṣyasi/);
console.log(`PASS: ${families.length} families, ${allLevels().length} levels, ${total.toLocaleString()} valid state combinations generated.`);
console.log(lines.join('\n'));
