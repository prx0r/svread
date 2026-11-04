/* Pushing Lab is local-first. Network is used only for public projections and explicit Scholar actions. */
(function(){
  'use strict';
  const C=globalThis.PushingCore, $=id=>document.getElementById(id);
  const API='https://ipvv-api.tradesprior.workers.dev', KEY='svv-pushing-lab/1';
  const BASE='https://github.com/prx0r/ipvv/blob/941ac2ecf1f8e5791a887d9d769159ecbffd7c04/site/data/pushing/tantraloka/';
  const seeds=[
    {label:'The perceiver · why is blue mine?',question:'If the perceiver is universal, why is blue manifest to me and not everyone?',file:'LOGICVID-session-Q1-reflexivity.md'},
    {label:'Love and fear · what is fear?',question:'If everything is rooted in love, then what is fear?',file:'LOGICVID-session-fear-love-recoil.md'},
    {label:'Suffering · the hardest objection',question:'Why would Śiva play when people suffer?',file:'LOGICVID-session-hardest-objections.md'},
    {label:'Freedom · why the five coverings?',question:'Why does freedom conceal itself in these particular ways?',file:'LOGICVID-session-kancukas-self-emptying.md'}
  ];
  const typeNames={'question':'Question','source':'Source note','answer':'Proposed answer','inference':'Inference','objection':'Objection','crux':'Crux / honest limit','branch':'Next branch','essay-idea':'Essay idea'};
  let session,selected=null,projection=null,verifiedSource=null,loadSerial=0,proposalParent=null,proposalSession=null;
  let accountEssays=[],accountEnquiries=[],accountEssayOwner=null,accountEnquiryOwner=null;
  let initialMessage='';
  try{const raw=localStorage.getItem(KEY);session=raw?C.validateSession(JSON.parse(raw)):C.makeSession();}
  catch{session=C.makeSession();initialMessage='The saved enquiry could not be read. Import a backup before replacing it.';}
  const status=message=>{$('status').textContent=message;};
  function save(){try{C.validateSession(session);localStorage.setItem(KEY,JSON.stringify(session));return true;}
    catch(e){status('Could not save on this device: '+e.message+' Export a backup.');return false;}}
  function el(tag,text,cls){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;}
  function button(text,fn,cls='quiet'){const b=el('button',text,cls);b.type='button';b.onclick=fn;return b;}
  function option(value,text){const x=el('option',text);x.value=value;return x;}
  function add(options){session=C.addNode(session,options);selected=session.nodes.at(-1).id;save();render();}
  function renderTurns(){
    const box=$('turns');box.replaceChildren();
    session.turns.forEach((turn,index)=>{
      const row=el('div',undefined,'turn'),label=el('strong',`${turn.label} · ${turn.origin} (as labelled)`),text=el('p',turn.text);
      const controls=el('div',undefined,'inline'),kind=el('select');kind.setAttribute('aria-label',`Type for conversation turn ${index+1}`);
      C.TYPES.forEach(k=>kind.append(option(k,typeNames[k])));kind.value=turn.origin==='human'?'question':'answer';
      const b=button('Add to tree',()=>{try{add({parent:selected,type:kind.value,origin:turn.origin,text:turn.text,turn:index});status('Conversation turn added to the tree.');}catch(e){status(e.message);}});
      controls.append(kind,b);row.append(label,text,controls);box.append(row);
    });
  }
  function renderTree(){
    const area=$('tree');area.replaceChildren();$('count').textContent=`${session.nodes.length} ${session.nodes.length===1?'node':'nodes'}`;
    if(!session.nodes.length){area.append(el('div','Your first question belongs here.','tree-empty'));}
    else{
      const kids=new Map();for(const n of session.nodes){const key=n.parent||'';if(!kids.has(key))kids.set(key,[]);kids.get(key).push(n);}
      function list(parent){const ul=el('ol');for(const n of kids.get(parent)||[]){const li=el('li'),card=el('div',undefined,'node'+(selected===n.id?' selected':''));
        card.append(el('div',`${typeNames[n.type]} · ${n.origin}`,'node-meta'),el('div',n.text,'node-text'));
        if(n.link){const a=el('a',`Prior enquiry: ${n.link.label} ↗`,'node-link');a.href=n.link.url;a.target='_blank';a.rel='noopener noreferrer';card.append(a);}
        if(n.private_ref)card.append(el('div',`Private essay revision ${n.private_ref.revision}; stored reference, recheck before relying on it.`,'note'));
        if(n.reference){const r=n.reference;card.append(el('div',`Passage: ${r.work} / ${r.target} · ${r.source_edition}. Stored reference; recheck before relying on it.`,'note'));const a=el('a','Open passage in Scholar ↗','node-link');a.href=`./?work=${encodeURIComponent(r.work)}&view=scholar&layer=t1&target=${encodeURIComponent(r.target)}`;card.append(a);}
        const controls=el('div');controls.append(button(n.id===selected?'Selected':'Select',()=>{selected=n.id;renderTree();renderNext();}));
        if(!n.reference&&!n.private_ref)controls.append(button('Edit',()=>{const value=prompt('Edit this note:',n.text);if(value===null)return;try{session=C.editNode(session,n.id,value);save();render();status('Note updated.');}catch(e){status(e.message);}}));
        controls.append(button('Remove',()=>{if(!confirm('Remove this node?'))return;try{session=C.removeLeaf(session,n.id);if(selected===n.id)selected=n.parent;save();render();status('Node removed.');}catch(e){status(e.message);}}));
        card.append(controls);li.append(card);if(kids.has(n.id))li.append(list(n.id));ul.append(li);}return ul;}
      area.append(list(''));
    }
    const n=session.nodes.find(x=>x.id===selected);$('parent-label').textContent=n?`under selected ${typeNames[n.type].toLowerCase()}`:'as a new root';
  }
  function renderNext(){
    const area=$('next');area.replaceChildren();const n=session.nodes.find(x=>x.id===selected);if(!n)return;
    area.append(el('h3','Where could you push next?'),el('p','Choose a question to add it under the selected node. These are prompts, not findings.'));
    for(const q of C.questions(n))area.append(button(q,()=>{try{add({parent:n.id,type:'question',origin:'agent',text:q});status('Question prompt added; follow or edit it.');}catch(e){status(e.message);}}));
  }
  function render(){ $('title').value=session.title;renderTurns();renderTree();renderNext(); }
  function setSeedLink(){const seed=seeds[Number($('seed').value)]||seeds[0];$('seed-link').href=BASE+seed.file;}
  seeds.forEach((s,i)=>$('seed').append(option(String(i),s.label)));$('seed').onchange=setSeedLink;setSeedLink();
  $('add-seed').onclick=()=>{const seed=seeds[Number($('seed').value)]||seeds[0];try{
    add({parent:null,type:'question',origin:'unknown',text:seed.question,link:{label:seed.label,url:BASE+seed.file}});
    status('Added a question from an earlier enquiry; check the underlying source before treating it as evidence.');
  }catch(e){status(e.message);}};
  $('title').oninput=()=>{session={...session,title:$('title').value};save();};
  $('new').onclick=()=>{if((session.nodes.length||session.turns.length)&&!confirm('Start a new enquiry? Export the current one first if you want a copy.'))return;
    session=C.makeSession();selected=null;projection=null;verifiedSource=null;proposalParent=null;proposalSession=null;accountEssays=[];accountEnquiries=[];accountEssayOwner=null;accountEnquiryOwner=null;
    $('scholar-essays').replaceChildren(option('','Choose an essay'));$('scholar-excerpt').value='';$('account-enquiries').replaceChildren(option('','Choose a saved enquiry'));
    $('work').value='';$('target').replaceChildren(option('','Choose a passage'));$('source').textContent='Choose a work and passage to inspect its source.';
    $('attach-source').disabled=true;$('essay').value='';$('agent-output').value='';save();render();status('New private enquiry.');};
  $('parse').onclick=()=>{try{const turns=C.parseTranscript($('transcript').value);if(!turns.length)throw Error('Paste a conversation first.');
    const next={...session,turns:[...session.turns,...turns]};C.validateSession(next);session=next;save();$('transcript').value='';renderTurns();status(`Added ${turns.length} conversation turn(s).`);
  }catch(e){status(e.message);}};
  function addWritten(parent){try{add({parent,type:$('node-type').value,origin:$('node-origin').value,text:$('node-text').value});$('node-text').value='';status('Thought added.');}catch(e){status(e.message);}}
  $('add-node').onclick=()=>addWritten(selected);$('add-root').onclick=()=>addWritten(null);
  $('export').onclick=()=>{try{const blob=new Blob([JSON.stringify(C.validateSession(session),null,2)+'\n'],{type:'application/json'});
    const a=document.createElement('a'),url=URL.createObjectURL(blob);a.href=url;a.download='pushing-enquiry.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    status('Enquiry exported, including all pasted turns.');}catch(e){status(e.message);}};
  $('import').onchange=async event=>{const file=event.target.files?.[0];if(!file)return;try{
    if(file.size>1000000)throw Error('Choose an enquiry file under 1 MB.');const loaded=C.validateSession(JSON.parse(await file.text()));
    if((session.nodes.length||session.turns.length)&&!confirm('Replace the enquiry on this device with the imported file?'))return;
    session=loaded;selected=null;projection=null;verifiedSource=null;proposalParent=null;proposalSession=null;$('essay').value='';$('agent-output').value='';
    save();render();await loadWork(session.work,session.target);status('Imported. Passage references in a file are claims until rechecked.');
  }catch(e){status('Could not import: '+e.message);}finally{event.target.value='';}};
  function canonical(v){if(Array.isArray(v))return '['+v.map(canonical).join(',')+']';
    if(v&&typeof v==='object')return '{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}';return JSON.stringify(v);}
  async function sha(v){const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(canonical(v)));return [...new Uint8Array(hash)].map(x=>x.toString(16).padStart(2,'0')).join('');}
  async function readJson(url){const r=await fetch(url,{cache:'no-store'});if(!r.ok)throw Error('This Scholar projection is unavailable.');return r.json();}
  async function loadWork(work,target=''){
    const serial=++loadSerial;projection=null;verifiedSource=null;$('attach-source').disabled=true;$('target').replaceChildren(option('','Choose a passage'));
    $('source').textContent='Choose a work and passage to inspect its source.';
    if(!work){$('work').value='';return;}
    if(!/^[a-z0-9][a-z0-9_-]{0,79}$/.test(work))throw Error('Invalid work.');
    $('work').value=work;
    const data=await readJson(`data/scholar/${encodeURIComponent(work)}.json`);if(serial!==loadSerial)return;
    const {projection_sha256:claimed,...rest}=data;
    if(data.work!==work||!/^[a-f0-9]{64}$/.test(claimed||'')||await sha(rest)!==claimed)throw Error('Scholar projection integrity check failed.');
    if(serial!==loadSerial)return;projection=data;
    const ids=Object.keys(data.source_verses||{}).filter(id=>data.originals?.t1?.[id]&&Array.isArray(data.withheld_songs)&&!data.withheld_songs.includes(id.replace(/-v\d+$/,''))).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
    ids.forEach(id=>$('target').append(option(id,id)));if(!ids.length){$('source').textContent='No available source passages in this projection.';return;}
    if(target&&ids.includes(target)){$('target').value=target;await chooseSource();}
    else if(target){session={...session,target:''};save();$('source').textContent='The saved passage is unavailable in this projection.';}
  }
  async function chooseSource(){
    const target=$('target').value,serial=++loadSerial;verifiedSource=null;$('attach-source').disabled=true;
    session={...session,target};save();if(!target||!projection){$('source').textContent='Choose a passage.';return;}
    const v=projection.source_verses?.[target],t1=projection.originals?.t1?.[target],hash=projection.original_hashes?.t1?.[target];
    if(!v||typeof v.text!=='string'||!v.text.trim()||!t1||!/^[a-f0-9]{64}$/.test(hash||'')||await sha(t1)!==hash)throw Error('Passage integrity check failed.');
    if(serial!==loadSerial)return;
    const edition=String(projection.source_edition||v.source_origin||'Edition not recorded').slice(0,500);
    verifiedSource={work:session.work,target,projection_sha256:projection.projection_sha256,t1_sha256:hash,source_edition:edition,text:v.text};
    $('source').textContent=`${target} · ${edition}\n\n${v.text}\n\nBundle hash checked. Verify edition and full passage coverage independently.`;$('attach-source').disabled=false;
  }
  $('work').onchange=async()=>{const work=$('work').value;session={...session,work,target:''};save();try{await loadWork(work);}catch(e){status(e.message);}};
  $('target').onchange=async()=>{try{await chooseSource();}catch(e){status(e.message);}};
  $('attach-source').onclick=()=>{if(!verifiedSource)return;const {text,...reference}=verifiedSource;try{add({parent:selected,type:'source',origin:'source',text,reference});status('Source added. Add your interpretation as a separate node.');}catch(e){status(e.message);}};
  async function request(path,method='GET',data){const r=await fetch(API+path,{method,credentials:'include',...(data?{headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}:{})});
    let value;try{value=await r.json();}catch{throw Error('Scholar backend returned an unexpected response.');}if(!r.ok)throw Error(value.error||'Scholar request failed.');return value;}
  async function profile(){const me=await request('/api/auth/me');if(!me.profile?.id)throw Error('Sign in to Scholar first.');return me.profile;}
  function checkPrivateOwners(nodes,uid){if(nodes.some(n=>n.private_ref&&n.private_ref.owner_id!==uid))throw Error('This enquiry includes an excerpt from a different Scholar account. Open that account or remove the excerpt before sending or saving it.');}
  function clearPrivateViews(){accountEssays=[];accountEnquiries=[];accountEssayOwner=null;accountEnquiryOwner=null;$('scholar-essays').replaceChildren(option('','Choose an essay'));$('scholar-excerpt').value='';$('account-enquiries').replaceChildren(option('','Choose a saved enquiry'));}
  async function checkVisibleAccount(){if(!accountEssayOwner&&!accountEnquiryOwner)return;try{const owner=await profile();if((accountEssayOwner&&owner.id!==accountEssayOwner)||(accountEnquiryOwner&&owner.id!==accountEnquiryOwner)){clearPrivateViews();status('Account changed; private Scholar lists were cleared.');}}catch{clearPrivateViews();status('Signed out; private Scholar lists were cleared.');}}
  addEventListener('focus',checkVisibleAccount);
  async function documents(work){let offset=0,all=[];do{const data=await request('/api/scholar/documents?work='+encodeURIComponent(work)+'&offset='+offset);all.push(...(data.documents||[]));const next=data.next_offset;offset=Number.isSafeInteger(next)&&next>offset?next:null;}while(offset!==null);return all;}
  $('save-account').onclick=async()=>{try{
    if(!session.work)throw Error('Choose a Scholar work first.');const raw=JSON.stringify(C.validateSession(session));if(raw.length>60000)throw Error('This enquiry is too large for a Scholar snapshot; export JSON instead.');
    const work=session.work,target=session.target,title=session.title||'Pushing enquiry',owner=await profile();
    if(JSON.stringify(session)!==raw)throw Error('The enquiry changed; try again.');checkPrivateOwners(session.nodes,owner.id);
    if(!confirm(`Save a private snapshot to ${owner.display_name||'your Scholar account'}? It includes all imported conversation turns.`))return;
    if((await profile()).id!==owner.id||JSON.stringify(session)!==raw)throw Error('The account or enquiry changed; try again.');
    const id='conversation:pushing-'+crypto.randomUUID();await request('/api/scholar/documents/'+encodeURIComponent(id),'PUT',{
      expected_revision:0,kind:'conversation',work,target,layer:'',title:'Pushing: '+title.slice(0,290),content:{text:raw,assisted:session.nodes.some(n=>n.origin==='agent')}});
    status('Private enquiry snapshot saved to Scholar.');
  }catch(e){status(e.message);}};
  $('list-account').onclick=async()=>{try{
    if(!session.work)throw Error('Choose the work the enquiry was saved under.');const owner=await profile(),work=session.work,docs=await documents(work);
    if((await profile()).id!==owner.id||session.work!==work)throw Error('The account or work changed; try again.');
    accountEnquiryOwner=owner.id;accountEnquiries=docs.filter(d=>d.kind==='conversation'&&d.id.startsWith('conversation:pushing-'));
    $('account-enquiries').replaceChildren(option('','Choose a saved enquiry'));accountEnquiries.forEach((d,i)=>$('account-enquiries').append(option(String(i),`${d.title} · ${d.updated_at||''}`)));
    status(`${accountEnquiries.length} private enquiry snapshot(s) found.`);
  }catch(e){status(e.message);}};
  $('open-account').onclick=async()=>{try{
    const val=$('account-enquiries').value;if(val==='')throw Error('Choose a saved enquiry.');const doc=accountEnquiries[Number(val)],owner=await profile();
    if(!doc||owner.id!==accountEnquiryOwner)throw Error('Account changed; find your enquiries again.');
    const loaded=C.validateSession(JSON.parse(doc.content.text));if((session.nodes.length||session.turns.length)&&!confirm('Replace this device’s current enquiry with the private Scholar snapshot?'))return;
    if((await profile()).id!==owner.id)throw Error('Account changed; try again.');session=loaded;selected=null;proposalParent=null;proposalSession=null;$('essay').value='';$('agent-output').value='';save();render();await loadWork(session.work,session.target);
    status('Private Scholar snapshot opened on this device.');
  }catch(e){status(e.message);}};
  $('load-essays').onclick=async()=>{try{
    if(!session.work)throw Error('Choose a Scholar work first.');const owner=await profile(),work=session.work,docs=await documents(work);
    if((await profile()).id!==owner.id||session.work!==work)throw Error('The account or work changed; try again.');
    accountEssayOwner=owner.id;accountEssays=docs.filter(d=>d.kind==='essay');$('scholar-essays').replaceChildren(option('','Choose an essay'));
    accountEssays.forEach((d,i)=>$('scholar-essays').append(option(String(i),`${d.title||'Untitled'} · revision ${d.revision}`)));$('scholar-excerpt').value='';
    status(`${accountEssays.length} private essay(s) found.`);
  }catch(e){status(e.message);}};
  $('scholar-essays').onchange=async()=>{try{const owner=await profile();if(owner.id!==accountEssayOwner){clearPrivateViews();throw Error('Account changed; find your essays again.');}const val=$('scholar-essays').value,doc=val===''?null:accountEssays[Number(val)];$('scholar-excerpt').value=doc?.content?.text||'';}catch(e){status(e.message);}};
  $('add-essay-excerpt').onclick=async()=>{try{
    const val=$('scholar-essays').value,doc=val===''?null:accountEssays[Number(val)],owner=await profile();
    if(!doc||owner.id!==accountEssayOwner||doc.work!==session.work)throw Error('Account or work changed; find your essays again.');
    const box=$('scholar-excerpt'),start=box.selectionStart,end=box.selectionEnd;if(end<=start)throw Error('Select an excerpt from the essay first.');
    const text=doc.content.text.slice(start,end);if(text.length>12000)throw Error('Select an excerpt under 12,000 characters.');
    if(!confirm('Add this private essay excerpt to the enquiry saved on this device? It will remain on this device after sign-out until you remove it.'))return;
    const snapshot={kind:doc.kind,work:doc.work,target:doc.target,layer:doc.layer,title:doc.title,content:doc.content},hash=await sha(snapshot);
    if((await profile()).id!==owner.id)throw Error('Account changed; try again.');
    add({parent:selected,type:'answer',origin:doc.content.assisted?'agent':'human',text,private_ref:{owner_id:owner.id,document_id:doc.id,revision:doc.revision,snapshot_sha256:hash}});
    status('Excerpt added from the saved essay revision.');
  }catch(e){status(e.message);}};
  $('ask').onclick=async()=>{try{
    if(!verifiedSource||session.work!==verifiedSource.work||session.target!==verifiedSource.target)throw Error('Choose a verified available Scholar passage first.');
    const promptText=C.modelInstruction(session,selected),path=C.path(session,selected),capturedSession=session.id,parent=selected,source={...verifiedSource},owner=await profile();
    checkPrivateOwners(path,owner.id);
    if(session.id!==capturedSession||selected!==parent||verifiedSource?.work!==source.work||verifiedSource?.target!==source.target||C.modelInstruction(session,parent)!==promptText)throw Error('The selected branch or passage changed; try again.');
    if(!confirm(`Send the selected ${path.length}-node branch, ${source.work} / ${source.target}, and its available layers to Qwen using ${owner.display_name||'your Scholar account'}? Other conversation turns are not sent.`))return;
    if((await profile()).id!==owner.id||session.id!==capturedSession||selected!==parent||verifiedSource?.work!==source.work||verifiedSource?.target!==source.target||C.modelInstruction(session,parent)!==promptText)throw Error('The account, branch or passage changed; try again.');
    const result=await request('/api/scholar/assist','POST',{work:source.work,target:source.target,layer:'l3',kind:'essay',instruction:promptText,use_style:false,consent_to_ai:true});
    if((await profile()).id!==owner.id)throw Error('Account changed; reopen the workspace.');
    if(!result.document?.content?.text)throw Error('The model returned no proposal.');
    $('agent-output').value=result.document.content.text;proposalParent=parent;proposalSession=capturedSession;
    status('Agent proposal saved privately by Scholar. Check it; add it to the tree only if useful.');
  }catch(e){status(e.message);}};
  $('add-agent').onclick=()=>{try{if(proposalSession&&proposalSession!==session.id)throw Error('This proposal belongs to a different enquiry.');
    const parent=proposalParent||selected;if(parent&&!session.nodes.some(n=>n.id===parent))throw Error('The original branch is no longer present.');
    add({parent,type:'answer',origin:'agent',text:$('agent-output').value});$('agent-output').value='';proposalParent=null;proposalSession=null;status('Agent proposal added as an unverified node.');
  }catch(e){status(e.message);}};
  $('essay-preview').onclick=()=>{try{$('essay').value=C.essaySeed(session);status('Essay seed prepared. You can edit it before saving.');}catch(e){status(e.message);}};
  $('copy').onclick=async()=>{try{if(!$('essay').value)throw Error('Prepare an essay seed first.');await navigator.clipboard.writeText($('essay').value);status('Essay seed copied.');}catch(e){status(e.message||'Could not copy on this device.');}};
  $('save-essay').onclick=async()=>{try{
    const text=$('essay').value;if(!text.trim()||text.length>60000)throw Error('Prepare an essay seed of at most 60,000 characters.');
    if(!session.work||!session.target||!verifiedSource)throw Error('Choose an available Scholar work and passage first.');
    const owner=await profile(),work=session.work,target=session.target,title=session.title||'Pushing enquiry';checkPrivateOwners(session.nodes,owner.id);
    if(!confirm(`Create a private essay draft for ${work} / ${target} in ${owner.display_name||'your Scholar account'}?`))return;
    if((await profile()).id!==owner.id)throw Error('Account changed; reopen the workspace.');
    const id='essay:pushing-'+crypto.randomUUID(),assisted=session.nodes.some(n=>n.origin==='agent');
    await request('/api/scholar/documents/'+encodeURIComponent(id),'PUT',{expected_revision:0,kind:'essay',work,target,layer:'l3',title,content:{text,assisted}});
    status('Private essay draft saved. Open Scholar to review, invite review and sign off.');
  }catch(e){status(e.message);}};
  async function init(){
    render();if(initialMessage)status(initialMessage);
    try{const idx=await readJson('data/scholar/index.json');Object.keys(idx).sort().forEach(work=>$('work').append(option(work,work)));
      const q=new URL(location.href).searchParams;if(!session.work&&q.get('work')){session={...session,work:q.get('work'),target:q.get('target')||''};C.validateSession(session);save();}
      if(session.work)await loadWork(session.work,session.target);
    }catch(e){status('Passage lookup: '+e.message);}
  }
  init();
})();
