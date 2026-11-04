const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');

test('Scholar workspace saves privately and labels a copied agent draft',async()=>{
  const storage=new Map(),saved=new Map(),calls=[],nodes=new Map();
  const localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k),
    key:i=>[...storage.keys()][i],get length(){return storage.size;}};
  const element=id=>{if(!nodes.has(id))nodes.set(id,{value:'',checked:false,textContent:'',dataset:{},addEventListener(type,fn){this[type]=fn;}});return nodes.get(id);};
  const container={set innerHTML(v){this.html=v;nodes.clear();},querySelector:element,querySelectorAll:()=>[]};
  const editor={value:'',addEventListener(type,fn){this[type]=fn;}};
  const fetch=async (url,options={})=>{
    const method=options.method||'GET', data=options.body?JSON.parse(options.body):null;calls.push({url:String(url),method,data});
    if(String(url).includes('/api/scholar/documents?'))return Response.json({documents:[...saved.values()],next_offset:null});
    if(String(url).endsWith('/api/scholar/reviews'))return Response.json(method==='POST'?{id:'review:one'}:{reviews:[]});
    if(String(url).endsWith('/api/scholar/style-examples'))return Response.json({examples:[]});
    if(method==='PUT'){
      const id=decodeURIComponent(String(url).split('/').pop()),prior=saved.get(id);
      if(data.expected_revision!==(prior?.revision||0))return Response.json({error:'conflict'},{status:409});
      const {expected_revision,...payload}=data,doc={...payload,revision:expected_revision+1};saved.set(id,doc);
      return Response.json({document:doc});
    }
    if(String(url).endsWith('/api/scholar/assist'))return Response.json({document:{id:'agent:one',revision:1,
      content:{text:'Agent reading',task:'translation',model:'qwen-test'}},message:'Agent draft saved privately.'});
    if(String(url).endsWith('/api/scholar/signoffs'))return Response.json({id:'signoff:one',snapshot_sha256:'a'.repeat(64)});
    if(String(url).endsWith('/api/scholar/submit'))return Response.json({status:'SUBMITTED_PUBLIC_BRANCH',message:'Submitted to a public Git branch for review.'});
    throw new Error('Unexpected request '+url);
  };
  const context=vm.createContext({fetch,localStorage,Response,URL,URLSearchParams,setTimeout,clearTimeout,
    crypto:{randomUUID:()=> 'id'},confirm:()=>true,CSS:{escape:x=>x}});
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../scholar-workspace-ui.js'),'utf8'),context);
  const profile={id:'alice',display_name:'Alice'};
  const suite=new context.ScholarWorkspace({api:'https://api.example',work:'testwork',profile:()=>profile});
  await suite.load();suite.attach({container,textarea:editor,target:'p-v01',layer:'l3',baseHash:'a'.repeat(64),parent:null});
  editor.value='A human draft';editor.input();const id='translation:l3:p-v01';await suite.flush(id);
  assert.equal(saved.get(id).content.text,'A human draft');
  element('#workspace-task').value='translation';element('#workspace-prompt').value='Be precise';element('#workspace-style').checked=true;
  await element('#workspace-ask').onclick();
  assert.equal(calls.find(x=>x.url.endsWith('/assist')).data.use_style,true);
  element('#workspace-use').onclick();await suite.flush(id);
  assert.equal(saved.get(id).content.assisted,true);assert.equal(saved.get(id).content.model,'qwen-test');
  element('#workspace-review-kind').value='translation';element('#workspace-reviewer').value='bob';await element('#workspace-share').onclick();
  assert.equal(calls.find(x=>x.url.endsWith('/reviews')&&x.method==='POST').data.document_id,id);
  element('#workspace-sign-kind').value='translation';element('#workspace-rights').value='all-rights-reserved';await element('#workspace-sign').onclick();
  assert.equal(calls.find(x=>x.url.endsWith('/signoffs')).data.confirmed,true);
  await element('#workspace-submit').onclick();
  assert.equal(calls.find(x=>x.url.endsWith('/submit')).data.confirm_submission,true);
  for(const state of suite.docs.values())clearTimeout(state.timer);
});

test('voice converts samples to little-endian 16 kHz PCM',()=>{
  const context=vm.createContext({btoa:binary=>Buffer.from(binary,'binary').toString('base64')});
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../scholar-voice.js'),'utf8'),context);
  const bytes=Buffer.from(context.ScholarVoice.pcm(new Float32Array([-1,1]),16000),'base64');
  assert.equal(bytes.readInt16LE(0),-32768);assert.equal(bytes.readInt16LE(2),32767);
});

test('late voice transcription is saved to its original turn',()=>{
  const context=vm.createContext({btoa:binary=>Buffer.from(binary,'binary').toString('base64')});
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../scholar-voice.js'),'utf8'),context);
  const saved=[];const voice=new context.ScholarVoice({url:'wss://example.test',onComplete:turn=>saved.push({...turn})});
  const event=data=>voice.receive({data:JSON.stringify(data)});
  voice.turn={id:'first',user:'',agent:'',completed:false};
  event({type:'input_audio_buffer.committed',item_id:'item-1'});
  event({type:'response.audio_transcript.delta',delta:'First answer'});event({type:'response.done'});
  voice.turn={id:'second',user:'',agent:'',completed:false};
  event({type:'conversation.item.input_audio_transcription.completed',item_id:'item-1',transcript:'First question'});
  assert.equal(saved.at(-1).id,'first');assert.equal(saved.at(-1).user,'First question');assert.equal(saved.at(-1).agent,'First answer');
});

test('conflicting offline edits remain recoverable without overwriting the account',async()=>{
  const storage=new Map(),id='translation:l3:p-v01';
  const local={id,kind:'translation',work:'testwork',target:'p-v01',layer:'l3',title:'',content:{text:'Offline copy'}};
  let account={...local,content:{text:'Newer account copy'},revision:2};
  storage.set('svv-private-alice-'+id,JSON.stringify({base_revision:1,data:local}));
  const localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k),
    key:i=>[...storage.keys()][i],get length(){return storage.size;}};
  const fetch=async(url,options={})=>{
    if(String(url).endsWith('/api/scholar/reviews'))return Response.json({reviews:[]});
    if(String(url).endsWith('/api/scholar/style-examples'))return Response.json({examples:[]});
    if(String(url).includes('/api/scholar/documents?'))return Response.json({documents:[account],next_offset:null});
    if(options.method==='PUT'){const body=JSON.parse(options.body);assert.equal(body.expected_revision,2);
      const {expected_revision,...data}=body;account={...data,revision:3};return Response.json({document:account});}
    throw new Error('unexpected request');
  };
  const nodes=new Map(),restore={dataset:{id}};
  const container={set innerHTML(v){this.html=v;nodes.clear();},querySelector(key){if(!nodes.has(key))nodes.set(key,{value:'',addEventListener(){}});return nodes.get(key);},
    querySelectorAll(key){return key==='.workspace-restore'?[restore]:[];}};
  const context=vm.createContext({fetch,localStorage,Response,URL,URLSearchParams,setTimeout,clearTimeout,
    crypto:{randomUUID:()=> 'id'},confirm:()=>true,CSS:{escape:x=>x}});
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../scholar-workspace-ui.js'),'utf8'),context);
  const workspace=new context.ScholarWorkspace({api:'https://api.example',work:'testwork',profile:()=>({id:'alice'})});
  await workspace.load();const editor={value:'',addEventListener(){}};
  workspace.attach({container,textarea:editor,target:'p-v01',layer:'l3',baseHash:'',parent:null});
  assert.equal(editor.value,'Newer account copy');assert.match(container.html,/Offline copy/);
  assert.equal(account.content.text,'Newer account copy');assert.ok(storage.has('svv-conflict-alice-'+id));
  restore.onclick();await workspace.flush(id);assert.equal(account.content.text,'Offline copy');assert.equal(account.revision,3);
  for(const state of workspace.docs.values())clearTimeout(state.timer);
});

test('private revisions can be compared and restored as a new version',async()=>{
  const storage=new Map(),nodes=new Map(),id='translation:l3:p-v01',puts=[];
  const localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k),
    key:i=>[...storage.keys()][i],get length(){return storage.size;}};
  let account={id,kind:'translation',work:'testwork',target:'p-v01',layer:'l3',title:'',
    content:{text:'Current text',assisted:true,model:'qwen-test'},revision:2,updated_at:'2026-11-03'};
  const revisions=[account,{...account,revision:1,content:{text:'Earlier human text',assisted:false}}];
  const fetch=async(url,options={})=>{
    if(String(url).endsWith('/api/scholar/reviews'))return Response.json({reviews:[]});
    if(String(url).endsWith('/api/scholar/style-examples'))return Response.json({examples:[]});
    if(String(url).includes('/api/scholar/documents?'))return Response.json({documents:[account],next_offset:null});
    if(String(url).endsWith('/history'))return Response.json({revisions,next_before:null});
    if(options.method==='PUT'){const data=JSON.parse(options.body);puts.push(data);assert.equal(data.expected_revision,2);
      const {expected_revision,...payload}=data;account={...payload,revision:3};return Response.json({document:account});}
    throw new Error('Unexpected request '+url);
  };
  const element=key=>{if(!nodes.has(key))nodes.set(key,{value:'',textContent:'',addEventListener(){}});return nodes.get(key);};
  const container={set innerHTML(v){this.html=v;nodes.clear();},querySelector:element,querySelectorAll:()=>[]};
  const context=vm.createContext({fetch,localStorage,Response,URL,URLSearchParams,setTimeout,clearTimeout,
    crypto:{randomUUID:()=> 'id'},confirm:()=>true,CSS:{escape:x=>x}});
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../scholar-workspace-ui.js'),'utf8'),context);
  const suite=new context.ScholarWorkspace({api:'https://api.example',work:'testwork',profile:()=>({id:'alice'})});
  await suite.load();const editor={value:'',addEventListener(){}};
  suite.attach({container,textarea:editor,target:'p-v01',layer:'l3',baseHash:'',parent:null});
  element('#workspace-history-kind').value='translation';await element('#workspace-history-load').onclick();
  element('#workspace-history-left').value='2';element('#workspace-history-right').value='1';
  element('#workspace-history-right').onchange();
  assert.equal(element('#workspace-history-left-text').textContent,'Current text');
  assert.equal(element('#workspace-history-right-text').textContent,'Earlier human text');
  suite.signoffs.set(id,{id:'signoff:old'});await element('#workspace-history-restore').onclick();
  assert.equal(puts[0].content.text,'Earlier human text');assert.equal(account.revision,3);
  assert.equal(editor.value,'Earlier human text');assert.equal(suite.signoffs.has(id),false);
  for(const state of suite.docs.values())clearTimeout(state.timer);
});

test('essay revision sends selected review and style edits, then blocks a stale agent draft',async()=>{
  const storage=new Map(),nodes=new Map(),calls=[],statuses=[];
  const localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k),
    key:i=>[...storage.keys()][i],get length(){return storage.size;}};
  let essay={id:'essay:1',kind:'essay',work:'testwork',target:'p-v01',layer:'l3',title:'My paper',content:{text:'My revision'},revision:2};
  const reviews=[{id:'review:1',owner_id:'alice',reviewer_id:'bob',work:'testwork',document_id:essay.id,
    revision:2,decision:'REQUEST_CHANGES',ai_consent:true,snapshot:{content:{text:'My revision'}}}];
  const examples=[{id:'style:1',document_id:essay.id,work:'testwork',kind:'essay',layer:'l3',before_revision:1,after_revision:2}];
  const fetch=async(url,options={})=>{
    const method=options.method||'GET',data=options.body?JSON.parse(options.body):null;calls.push({url:String(url),method,data});
    if(String(url).includes('/api/scholar/documents?'))return Response.json({documents:[essay],next_offset:null});
    if(String(url).endsWith('/api/scholar/reviews'))return Response.json({reviews});
    if(String(url).endsWith('/api/scholar/style-examples'))return Response.json({examples});
    if(String(url).endsWith('/api/scholar/assist'))return Response.json({document:{id:'agent:1',kind:'agent-draft',revision:1,
      content:{text:'Proposed revised paper',task:'essay_revision',model:'qwen-test',source_document_id:essay.id,source_revision:2}},message:'Saved privately.'});
    if(method==='PUT'){assert.equal(data.expected_revision,2);const {expected_revision,...payload}=data;essay={...payload,revision:3};return Response.json({document:essay});}
    throw new Error('Unexpected request '+url);
  };
  const element=key=>{if(!nodes.has(key))nodes.set(key,{value:'',checked:false,textContent:'',addEventListener(){}});return nodes.get(key);};
  const container={set innerHTML(v){this.html=v;nodes.clear();},querySelector:element,querySelectorAll(key){
    if(key==='.workspace-style-choice:checked')return [{value:'style:1'}];
    if(key==='.workspace-feedback-choice:checked')return [{value:'review:1'}];return [];}};
  const context=vm.createContext({fetch,localStorage,Response,URL,URLSearchParams,setTimeout,clearTimeout,
    crypto:{randomUUID:()=> 'id'},confirm:()=>true,CSS:{escape:x=>x}});
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../scholar-workspace-ui.js'),'utf8'),context);
  const suite=new context.ScholarWorkspace({api:'https://api.example',work:'testwork',profile:()=>({id:'alice'}),onStatus:s=>statuses.push(s)});
  await suite.load();const editor={value:'',addEventListener(){}};
  suite.attach({container,textarea:editor,target:'p-v01',layer:'l3',baseHash:'',parent:null});
  element('#workspace-task').value='essay_revision';element('#workspace-style').checked=true;element('#workspace-prompt').value='Strengthen it';
  await element('#workspace-ask').onclick();
  const sent=calls.find(x=>x.url.endsWith('/assist')).data;
  assert.equal(sent.document_id,'essay:1');assert.equal(sent.revision,2);
  assert.deepEqual(sent.style_example_ids,['style:1']);assert.deepEqual(sent.review_ids,['review:1']);assert.equal(sent.consent_to_ai,true);
  suite.docs.get('essay:1').data.revision=3;element('#workspace-use').onclick();
  assert.match(statuses.at(-1),/changed since this draft/);suite.docs.get('essay:1').data.revision=2;
  element('#workspace-use').onclick();await suite.flush('essay:1');
  assert.equal(essay.content.text,'Proposed revised paper');assert.equal(essay.content.assisted,true);assert.equal(essay.revision,3);
  for(const state of suite.docs.values())clearTimeout(state.timer);
});

test('reviewer sends a structured report and explicitly opts into AI use',async()=>{
  const nodes=new Map(),calls=[];
  const localStorage={getItem:()=>null,setItem(){},removeItem(){},key:()=>null,get length(){return 0;}};
  const review={id:'review:1',owner_id:'alice',reviewer_id:'bob',work:'testwork',document_id:'essay:1',revision:1,
    decision:null,snapshot:{content:{text:'Draft'}}};
  const fetch=async(url,options={})=>{const method=options.method||'GET',data=options.body?JSON.parse(options.body):null;
    calls.push({url:String(url),method,data});
    if(String(url).includes('/api/scholar/documents?'))return Response.json({documents:[],next_offset:null});
    if(String(url).endsWith('/api/scholar/reviews'))return Response.json({reviews:[review]});
    if(String(url).endsWith('/api/scholar/style-examples'))return Response.json({examples:[]});
    if(String(url).endsWith('/decision'))return Response.json({id:review.id,decision:data.decision});
    if(String(url).endsWith('/revise'))return Response.json({id:review.id,decision:data.decision});
    throw new Error('Unexpected request '+url);
  };
  const element=key=>{if(!nodes.has(key))nodes.set(key,{value:'',checked:false,textContent:'',addEventListener(){}});return nodes.get(key);};
  const button={dataset:{id:'review:1',decision:'REQUEST_CHANGES'}};
  const container={set innerHTML(v){this.html=v;nodes.clear();},querySelector:element,querySelectorAll(key){return key==='.workspace-decision'?[button]:[];}};
  const context=vm.createContext({fetch,localStorage,Response,URL,URLSearchParams,setTimeout,clearTimeout,
    crypto:{randomUUID:()=> 'id'},confirm:()=>true,CSS:{escape:x=>x}});
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../scholar-workspace-ui.js'),'utf8'),context);
  const suite=new context.ScholarWorkspace({api:'https://api.example',work:'testwork',profile:()=>({id:'bob'})});
  await suite.load();suite.attach({container,textarea:{value:'',addEventListener(){}},target:'p-v01',layer:'l3',baseHash:'',parent:null});
  element('#workspace-review-review:1').value='Needs revision';element('#workspace-review-argument-review:1').value='Clarify argument';
  element('#workspace-review-evidence-review:1').value='Check source';element('#workspace-review-suggestions-review:1').value='Add evidence';
  element('#workspace-review-ai-review:1').checked=true;await button.onclick();
  const report=calls.find(x=>x.url.endsWith('/decision')).data;
  assert.equal(report.decision,'REQUEST_CHANGES');assert.equal(report.rubric.evidence,'Check source');assert.equal(report.ai_consent,true);
  review.decision='REQUEST_CHANGES';review.report_revision=1;button.dataset.existing='true';button.dataset.revision='1';suite.render();
  element('#workspace-review-review:1').value='Updated reasoning';element('#workspace-review-argument-review:1').value='Clarified';
  element('#workspace-review-evidence-review:1').value='Verified';element('#workspace-review-suggestions-review:1').value='';
  element('#workspace-review-ai-review:1').checked=false;await button.onclick();
  const revision=calls.find(x=>x.url.endsWith('/revise')).data;
  assert.equal(revision.expected_revision,1);assert.equal(revision.reasoning,'Updated reasoning');assert.equal(revision.ai_consent,false);
  for(const state of suite.docs.values())clearTimeout(state.timer);
});

test('a stale workspace cannot copy an agent draft after the account changes',async()=>{
  const nodes=new Map(),status=[],profile={id:'alice'};
  const localStorage={getItem:()=>null,setItem(){},removeItem(){},key:()=>null,get length(){return 0;}};
  const fetch=async url=>{
    if(String(url).includes('/api/scholar/documents?'))return Response.json({documents:[],next_offset:null});
    if(String(url).endsWith('/api/scholar/reviews'))return Response.json({reviews:[]});
    if(String(url).endsWith('/api/scholar/style-examples'))return Response.json({examples:[]});
    throw new Error('Unexpected request');
  };
  const element=key=>{if(!nodes.has(key))nodes.set(key,{value:'',checked:false,textContent:'',addEventListener(){}});return nodes.get(key);};
  const container={set innerHTML(v){nodes.clear();},querySelector:element,querySelectorAll:()=>[]};
  const context=vm.createContext({fetch,localStorage,Response,URL,URLSearchParams,setTimeout,clearTimeout,
    crypto:{randomUUID:()=> 'id'},confirm:()=>true,CSS:{escape:x=>x}});
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../scholar-workspace-ui.js'),'utf8'),context);
  const suite=new context.ScholarWorkspace({api:'https://api.example',work:'testwork',profile:()=>profile,onStatus:s=>status.push(s)});
  await suite.load();suite.attach({container,textarea:{value:'',addEventListener(){}},target:'p-v01',layer:'l3',baseHash:'',parent:null});
  suite.agent={content:{task:'essay',text:'Alice private draft'}};profile.id='bob';element('#workspace-use').onclick();
  assert.match(status.at(-1),/Account changed/);assert.equal([...suite.docs.values()].some(x=>x.data?.content?.text==='Alice private draft'),false);
  for(const state of suite.docs.values())clearTimeout(state.timer);
});

test('private decisions attach to a saved revision and require selection for Qwen',async()=>{
  const storage=new Map(),saved=new Map(),nodes=new Map(),calls=[];let decisions=[];
  const localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k),
    key:i=>[...storage.keys()][i],get length(){return storage.size;}};
  const element=id=>{if(!nodes.has(id))nodes.set(id,{value:'',checked:false,textContent:'',dataset:{},addEventListener(type,fn){this[type]=fn;}});return nodes.get(id);};
  const container={set innerHTML(v){this.html=v;nodes.clear();},querySelector:element,
    querySelectorAll(key){return key==='.workspace-decision-choice:checked'&&decisions.length?[{value:decisions[0].id}]:[];}};
  const editor={value:'The sovereign',addEventListener(type,fn){this[type]=fn;}};
  const fetch=async(url,options={})=>{const method=options.method||'GET',data=options.body?JSON.parse(options.body):null;calls.push({url:String(url),method,data});
    if(String(url).includes('/api/scholar/documents?'))return Response.json({documents:[],next_offset:null});
    if(String(url).endsWith('/api/scholar/reviews'))return Response.json({reviews:[]});
    if(String(url).endsWith('/api/scholar/style-examples'))return Response.json({examples:[]});
    if(String(url).endsWith('/api/scholar/decisions')){
      if(method==='POST'){decisions=[{id:'decision:one',work:'testwork',target:'p-v01',revision:data.revision,subject:data.subject,before_text:data.before,after_text:data.after,reason:data.reason}];return Response.json({id:'decision:one'});}
      return Response.json({decisions});}
    if(method==='PUT'){const {expected_revision,...payload}=data;const doc={...payload,revision:expected_revision+1};saved.set(doc.id,doc);return Response.json({document:doc});}
    if(String(url).endsWith('/api/scholar/assist'))return Response.json({document:{id:'agent:1',revision:1,content:{text:'Draft'}},message:'Saved'});
    throw new Error('Unexpected request '+url);
  };
  const context=vm.createContext({fetch,localStorage,Response,URL,URLSearchParams,setTimeout,clearTimeout,
    crypto:{randomUUID:()=> 'id'},confirm:()=>true,CSS:{escape:x=>x}});
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../scholar-workspace-ui.js'),'utf8'),context);
  const suite=new context.ScholarWorkspace({api:'https://api.example',work:'testwork',profile:()=>({id:'alice'})});
  await suite.load();suite.attach({container,textarea:editor,target:'p-v01',layer:'l3',baseHash:'',parent:null});
  element('#workspace-decision-subject').value='svātantrya';element('#workspace-decision-before').value='freedom';
  element('#workspace-decision-after').value='sovereignty';element('#workspace-decision-reason').value='Agency';
  await element('#workspace-decision-save').onclick();
  const sent=calls.find(x=>x.url.endsWith('/decisions')&&x.method==='POST');assert.equal(sent.data.revision,1);assert.equal(sent.data.subject,'svātantrya');
  assert.match(container.html,/svātantrya/);element('#workspace-task').value='translation';element('#workspace-style').checked=true;
  await element('#workspace-ask').onclick();const draft=calls.find(x=>x.url.endsWith('/assist')).data;
  assert.deepEqual([...draft.decision_ids],['decision:one']);assert.equal(draft.consent_to_ai,true);
  for(const state of suite.docs.values())clearTimeout(state.timer);
});

test('review comments use exact selected snapshot offsets',async()=>{
  const nodes=new Map(),calls=[],add={dataset:{id:'review:1'}};let comments=[];
  const textNode={},prefix={selectNodeContents(){},setEnd(){},toString(){return '🕉 ';}};
  const selection={rangeCount:1,getRangeAt:()=>({startContainer:textNode,endContainer:textNode,startOffset:3,toString:()=> 'Śiva'})};
  const element=id=>{if(!nodes.has(id))nodes.set(id,{value:'',checked:false,textContent:id.includes('snapshot')?'🕉 Śiva is free':'',dataset:{},contains:n=>n===textNode,addEventListener(){}});return nodes.get(id);};
  const container={set innerHTML(v){this.html=v;nodes.clear();},querySelector:element,querySelectorAll(key){return key==='.workspace-annotation-add'?[add]:[];}};
  const fetch=async(url,options={})=>{const method=options.method||'GET',data=options.body?JSON.parse(options.body):null;calls.push({url:String(url),method,data});
    if(String(url).includes('/api/scholar/documents?'))return Response.json({documents:[],next_offset:null});
    if(String(url).endsWith('/api/scholar/reviews'))return Response.json({reviews:[{id:'review:1',owner_id:'alice',reviewer_id:'bob',work:'testwork',document_id:'a',revision:1,snapshot_sha256:'a'.repeat(64),snapshot:{content:{text:'🕉 Śiva is free'}}}]});
    if(String(url).endsWith('/api/scholar/style-examples'))return Response.json({examples:[]});
    if(String(url).endsWith('/api/scholar/decisions'))return Response.json({decisions:[]});
    if(String(url).endsWith('/annotations')){if(method==='POST')comments=[{author_id:'alice',...data}];return Response.json({annotations:comments});}
    throw new Error('Unexpected request '+url);
  };
  const localStorage={getItem(){return null;},setItem(){},removeItem(){},key(){},get length(){return 0;}};
  const context=vm.createContext({fetch,localStorage,Response,URL,URLSearchParams,setTimeout,clearTimeout,
    crypto:{randomUUID:()=> 'id'},confirm:()=>true,CSS:{escape:x=>x},getSelection:()=>selection,document:{createRange:()=>prefix}});
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../scholar-workspace-ui.js'),'utf8'),context);
  const suite=new context.ScholarWorkspace({api:'https://api.example',work:'testwork',profile:()=>({id:'alice'})});
  await suite.load();suite.attach({container,textarea:{value:'',addEventListener(){}},target:'p-v01',layer:'l3',baseHash:'',parent:null});
  element('#workspace-annotation-review:1').value='Explain the source';await add.onclick();
  const sent=calls.find(x=>x.url.endsWith('/annotations')&&x.method==='POST').data;
  assert.equal(sent.start,3);assert.equal(sent.end,7);assert.equal(sent.quote,'Śiva');assert.equal(sent.body,'Explain the source');
  assert.match(container.html,/Explain the source/);for(const state of suite.docs.values())clearTimeout(state.timer);
});
