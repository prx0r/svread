const test=require('node:test');const assert=require('node:assert/strict');const C=require('../pushing-core.js');
test('conversation turns retain stated speaker and selected text',()=>{
 const turns=C.parseTranscript('Me: Why blue?\ncontinued\nQwen: Maybe.\n\nUser: Why?');
 assert.deepEqual(turns.map(t=>t.origin),['human','agent','human']);assert.equal(turns[0].text,'Why blue?\ncontinued');
 const s={...C.makeSession(),turns};const next=C.addNode(s,{type:'question',origin:turns[0].origin,text:turns[0].text,turn:0,id:'node:1'});
 assert.equal(next.nodes[0].text,'Why blue?\ncontinued');assert.equal(next.nodes[0].turn,0);assert.equal(s.nodes.length,0);
});
test('branches preserve their ancestry and reject forged or cyclic parents',()=>{
 let s=C.makeSession();s=C.addNode(s,{id:'node:1',type:'question',origin:'human',text:'Why?'});
 s=C.addNode(s,{id:'node:2',parent:'node:1',type:'objection',origin:'human',text:'But why?'});
 s=C.addNode(s,{id:'node:3',parent:'node:1',type:'branch',origin:'agent',text:'Another way'});
 assert.deepEqual(C.path(s,'node:2').map(n=>n.id),['node:1','node:2']);assert.throws(()=>C.removeLeaf(s,'node:1'),/child/);
 assert.throws(()=>C.validateSession({...s,nodes:[{...s.nodes[0],parent:'node:3'},...s.nodes.slice(1)]}),/parent/);
 assert.throws(()=>C.addNode(s,{id:'node:4',parent:'node:404',type:'question',origin:'human',text:'X'}),/parent/);
});
test('source reference stays intact and essay notes mark agent work',()=>{
 let s=C.makeSession('Reflexivity');const reference={work:'paramarthasara',target:'param-p01-v01',projection_sha256:'a'.repeat(64),t1_sha256:'b'.repeat(64),source_edition:'GRETIL'};
 s=C.addNode(s,{id:'node:1',type:'source',origin:'source',text:'paraṃ',reference});
 assert.throws(()=>C.editNode(s,'node:1','forged'),/intact/);
 s=C.addNode(s,{id:'node:2',parent:'node:1',type:'crux',origin:'agent',text:'A possible gap.'});
 const md=C.essaySeed(s);assert.match(md,/crux · agent/);assert.match(md,/Recheck the source/);assert.match(md,/require checking/);
});
test('Qwen context contains only the selected branch and has an honest size limit',()=>{
 let s=C.makeSession();s=C.addNode(s,{id:'node:1',type:'question',origin:'human',text:'Shared root'});
 s=C.addNode(s,{id:'node:2',parent:'node:1',type:'crux',origin:'human',text:'Selected'});
 s=C.addNode(s,{id:'node:3',parent:'node:1',type:'objection',origin:'human',text:'PRIVATE UNSELECTED'});
 const p=C.modelInstruction(s,'node:2');assert.match(p,/Selected/);assert.doesNotMatch(p,/PRIVATE UNSELECTED/);
 assert.throws(()=>C.modelInstruction(C.addNode(s,{id:'node:4',type:'answer',origin:'human',text:'x'.repeat(5000)}),'node:4'),/too long/);
});

test('private essay references retain revision but do not leak account or document IDs into model or essay text',()=>{
 let s=C.makeSession();s=C.addNode(s,{id:'node:1',type:'answer',origin:'human',text:'A claim',private_ref:{owner_id:'alice-private-id',document_id:'essay:secret-id',revision:3,snapshot_sha256:'c'.repeat(64)}});
 assert.throws(()=>C.editNode(s,'node:1','Changed'),/intact/);
 for(const out of [C.modelInstruction(s,'node:1'),C.essaySeed(s)]){assert.doesNotMatch(out,/alice-private-id|essay:secret-id/);}
 assert.match(C.essaySeed(s),/revision 3/);
});

test('local API override only accepts loopback and cannot redirect production traffic',()=>{
 const live='https://ipvv-api.tradesprior.workers.dev';
 assert.equal(C.resolveApi('https://svread.pages.dev/pushing.html?api=https://attacker.example'),live);
 assert.equal(C.resolveApi('http://127.0.0.1:8000/pushing.html?api=http%3A%2F%2F127.0.0.1%3A8787'),'http://127.0.0.1:8787');
 assert.throws(()=>C.resolveApi('http://localhost:8000/pushing.html?api=https://attacker.example'),/loopback/);
 assert.throws(()=>C.resolveApi('http://localhost:8000/pushing.html?api=http%3A%2F%2Flocalhost%3A8787%2Fx'),/loopback/);
});

test('essay request retains the selected enquiry, objection and boundary without other branches',()=>{
 let s=C.makeSession();s=C.addNode(s,{id:'node:1',type:'question',origin:'human',text:'Why?'});
 s=C.addNode(s,{id:'node:2',parent:'node:1',type:'objection',origin:'human',text:'What justifies this?'});
 s=C.addNode(s,{id:'node:3',parent:'node:1',type:'crux',origin:'human',text:'OTHER PRIVATE BRANCH'});
 const q=C.essayInstruction(s,'node:2');assert.match(q,/What justifies this/);assert.match(q,/strongest objection/);assert.doesNotMatch(q,/OTHER PRIVATE BRANCH/);
});

test('crux brief follows one branch, retains source and authorship, and leaves gaps open',()=>{
 const reference={work:'paramarthasara',target:'param-p01-v01',projection_sha256:'a'.repeat(64),t1_sha256:'b'.repeat(64),source_edition:'Edition unknown'};
 let s=C.makeSession('Universal perceiver');
 s=C.addNode(s,{id:'q',type:'question',origin:'human',text:'Why is blue manifest to me?'});
 s=C.addNode(s,{id:'src',parent:'q',type:'source',origin:'source',text:'Source text',reference});
 s=C.addNode(s,{id:'inf',parent:'src',type:'inference',origin:'human',text:'A proposed inference.'});
 s=C.addNode(s,{id:'crux',parent:'inf',type:'crux',origin:'agent',text:'What justifies that step?'});
 s=C.addNode(s,{id:'other',parent:'q',type:'objection',origin:'human',text:'PRIVATE SIBLING'});
 const brief=C.cruxBrief(s,'crux');
 assert.match(brief,/Why is blue manifest to me/);assert.match(brief,/paramarthasara \/ param-p01-v01/);
 assert.match(brief,/\[agent\] What justifies that step/);assert.match(brief,/## Objections\nNot yet recorded/);
 assert.doesNotMatch(brief,/PRIVATE SIBLING/);assert.match(brief,/not verified findings/);
 assert.throws(()=>C.cruxBrief(s,'missing'),/Select an enquiry node/);
});

test('examiner challenges the selected branch without including private siblings',()=>{
 let s=C.makeSession();s=C.addNode(s,{id:'q',type:'question',origin:'human',text:'Why?'});
 s=C.addNode(s,{id:'claim',parent:'q',type:'inference',origin:'human',text:'This must follow.'});
 s=C.addNode(s,{id:'other',parent:'q',type:'answer',origin:'human',text:'PRIVATE SIBLING'});
 const prompt=C.modelInstruction(s,'claim','examine');
 assert.match(prompt,/premise that needs justification/);assert.match(prompt,/strongest relevant objection/);
 assert.match(prompt,/This must follow/);assert.doesNotMatch(prompt,/PRIVATE SIBLING/);
 assert.throws(()=>C.modelInstruction(s,'claim','unknown'),/Unknown enquiry mode/);
});

test('private proposal ownership survives an enquiry export but is not sent to the model or brief',()=>{
 let s=C.makeSession();s=C.addNode(s,{id:'q',type:'question',origin:'human',text:'Why?'});
 s=C.addNode(s,{id:'a',parent:'q',type:'objection',origin:'agent',text:'Check the premise.',private_owner:'alice-private-id'});
 const reopened=C.validateSession(JSON.parse(JSON.stringify(s)));assert.equal(reopened.nodes[1].private_owner,'alice-private-id');
 assert.doesNotMatch(C.modelInstruction(reopened,'a','examine'),/alice-private-id/);
 assert.doesNotMatch(C.cruxBrief(reopened,'a'),/alice-private-id/);
 assert.throws(()=>C.addNode(s,{id:'bad',type:'answer',origin:'agent',text:'X',private_owner:''}),/owner/);
});

test('comparison keeps two paths and their provenance, without including other branches or account IDs',()=>{
 let s=C.makeSession('Two readings');s=C.addNode(s,{id:'q',type:'question',origin:'human',text:'What follows?'});
 s=C.addNode(s,{id:'a',parent:'q',type:'answer',origin:'human',text:'First reading'});
 s=C.addNode(s,{id:'b',parent:'q',type:'answer',origin:'agent',text:'Second reading',private_owner:'alice-private-id'});
 s=C.addNode(s,{id:'c',parent:'q',type:'answer',origin:'human',text:'UNSELECTED SECRET'});
 const brief=C.comparisonBrief(s,'a','b'),instruction=C.comparisonInstruction(s,'a','b');
 for(const result of [brief,instruction]){
   assert.match(result,/First reading/);assert.match(result,/Second reading/);
   assert.doesNotMatch(result,/UNSELECTED SECRET|alice-private-id/);
 }
 assert.match(brief,/Reading A/);assert.match(brief,/Reading B/);
 assert.throws(()=>C.comparisonBrief(s,'a','a'),/two different/);
 assert.throws(()=>C.comparisonInstruction(s,'a','missing'),/no longer available/);
});
