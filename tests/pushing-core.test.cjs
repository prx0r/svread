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
