const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const {webcrypto,createHash}=require('node:crypto');
const {TextEncoder}=require('node:util');

function load(){
  const context=vm.createContext({crypto:webcrypto,TextEncoder,Uint8Array,Blob,URL,setTimeout});
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../scholar-media.js'),'utf8'),context);
  return context.ScholarMedia;
}

test('packet binds exact saved text and metadata without private reviews',async()=>{
  const api=load(),doc={id:'essay:e1',revision:3,kind:'essay',work:'ipvv',target:'p01',layer:'l3',title:'On recognition',
    content:{text:'Śiva\nA <script> is text.',citations:[{work:'ipvv',target:'p01',t1_sha256:'a'.repeat(64),projection_sha256:'b'.repeat(64)}]}};
  const result=await api.createPacket(doc,{id:'alice',display_name:'Alice'});
  assert.equal(result.snapshot.content.text,doc.content.text);
  assert.equal(result.origin.revision,3);assert.equal(result.origin.author,'Alice');
  assert.equal(result.text_sha256,createHash('sha256').update(doc.content.text,'utf8').digest('hex'));
  assert.equal(result.snapshot_sha256,createHash('sha256').update(api.canonical(result.snapshot),'utf8').digest('hex'));
  assert.equal(JSON.stringify(result).includes('alice'),false);
  assert.equal(result.status,'private-draft');
});

test('packet refuses unsaved or empty essays',async()=>{
  const api=load();
  await assert.rejects(()=>api.createPacket({id:'x',revision:0,kind:'essay',content:{text:'draft'}},{id:'x'}),/Save/);
  await assert.rejects(()=>api.createPacket({id:'x',revision:1,kind:'essay',content:{text:' '}},{id:'x'}),/Save/);
  await assert.rejects(()=>api.createPacket({id:'x',revision:1,kind:'translation',content:{text:'text'}},{id:'x'}),/Save/);
});

test('workspace downloads only the saved revision and makes no upload request',async()=>{
  const nodes=new Map(),calls=[],downloads=[];
  const element=id=>{if(!nodes.has(id))nodes.set(id,{value:'',checked:false,textContent:'',dataset:{},addEventListener(){}});return nodes.get(id);};
  const container={set innerHTML(v){this.html=v;nodes.clear();},querySelector:element,querySelectorAll:()=>[]};
  const context=vm.createContext({crypto:webcrypto,TextEncoder,Uint8Array,Blob,URL,setTimeout,clearTimeout,confirm:()=>true,CSS:{escape:x=>x},
    localStorage:{getItem(){return null},setItem(){},removeItem(){},get length(){return 0}},
    fetch:async()=>{calls.push('network');throw Error('unexpected network')} });
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../scholar-media.js'),'utf8'),context);
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../scholar-workspace-ui.js'),'utf8'),context);
  context.ScholarMedia.download=packet=>downloads.push(packet);
  const profile={id:'alice',display_name:'Alice'},suite=new context.ScholarWorkspace({api:'https://unused',work:'ipvv',profile:()=>profile});
  const doc={id:'essay:e1',revision:4,kind:'essay',work:'ipvv',target:'p01',layer:'l3',title:'Essay',content:{text:'Saved essay'}};
  suite.docs.set(doc.id,{data:doc,revision:4,dirty:false});suite.essayId=doc.id;
  suite.current={container,textarea:{},target:'p01',layer:'l3'};suite.render();
  await element('#workspace-media').onclick();
  assert.equal(downloads.length,1);assert.equal(downloads[0].origin.revision,4);
  assert.equal(downloads[0].snapshot.content.text,'Saved essay');assert.deepEqual(calls,[]);
});

test('account switch during save never retries the old draft under the new account',async()=>{
  let finish,profile={id:'alice'},calls=0;
  const pending=new Promise(resolve=>{finish=resolve;});
  const context=vm.createContext({setTimeout,clearTimeout,Response,URL,URLSearchParams,
    fetch:async()=>{calls++;return pending;},localStorage:{removeItem(){},setItem(){}}});
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../scholar-workspace-ui.js'),'utf8'),context);
  const suite=new context.ScholarWorkspace({api:'https://unused',work:'ipvv',profile:()=>profile});
  suite.docs.set('essay:e1',{data:{id:'essay:e1',kind:'essay',work:'ipvv',content:{text:'Private Alice text'}},revision:1,dirty:true});
  const saving=suite.flush('essay:e1');profile={id:'bob'};
  finish(Response.json({document:{revision:2,content:{text:'Private Alice text'}}}));
  await assert.rejects(saving,/Account changed/);assert.equal(calls,1);
});
