/* Pushing Lab is local-first. Network is used only for public projections and explicit Scholar actions. */
(function(){
  'use strict';
  const C=globalThis.PushingCore, $=id=>document.getElementById(id);
  const readOnlyPreview=location.hostname==='prx0r.github.io';
  if(readOnlyPreview)$('preview-warning').hidden=false;
  const KEY='svv-pushing-lab/1';let API,apiError='';try{API=C.resolveApi(location.href);}catch(e){apiError=e.message;}
  const BASE='https://github.com/prx0r/ipvv/blob/941ac2ecf1f8e5791a887d9d769159ecbffd7c04/site/data/pushing/';
  const seeds=[
    {label:'The perceiver · why is blue mine?',question:'If the perceiver is universal, why is blue manifest to me and not everyone?',file:'tantraloka/LOGICVID-session-Q1-reflexivity.md'},
    {label:'Love and fear · what is fear?',question:'If everything is rooted in love, then what is fear?',file:'tantraloka/LOGICVID-session-fear-love-recoil.md'},
    {label:'Suffering · the hardest objection',question:'Why would Śiva play when people suffer?',file:'tantraloka/LOGICVID-session-hardest-objections.md'},
    {label:'Freedom · why the five coverings?',question:'Why does freedom conceal itself in these particular ways?',file:'tantraloka/LOGICVID-session-kancukas-self-emptying.md'}
  ];
  const typeNames={'question':'Question','source':'Source note','answer':'Proposed answer','inference':'Inference','objection':'Objection','crux':'Crux / honest limit','branch':'Next branch','essay-idea':'Essay idea'};
  let session,selected=null,projection=null,verifiedSource=null,loadSerial=0,proposalParent=null,proposalSession=null,proposalSnapshot=null,proposalOwner=null,proposalType='answer',proposalGeneration=0;
  let accountEssays=[],accountEnquiries=[],accountEssayOwner=null,accountEnquiryOwner=null;
  let notebook=[],published=[],styles=[],notebookOwner=null,publishedOwner=null,styleOwner=null,generatedEssay=null;
  const selectedScholarKeys=new Set();
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
        if(n.private_owner)card.append(el('div','Private AI proposal linked to its Scholar account.','note'));
        if(n.reference){const r=n.reference;card.append(el('div',`Passage: ${r.work} / ${r.target} · ${r.source_edition}. Stored reference; recheck before relying on it.`,'note'));const a=el('a','Open passage in Scholar ↗','node-link');a.href=`./?work=${encodeURIComponent(r.work)}&view=scholar&layer=t1&target=${encodeURIComponent(r.target)}`;card.append(a);}
        const controls=el('div');controls.append(button(n.id===selected?'Selected':'Select',()=>{selected=n.id;renderTree();renderNext();renderCrux();}));
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
  function renderCrux(){
    const available=!!selected&&session.nodes.some(n=>n.id===selected);
    $('crux-brief').textContent=available?C.cruxBrief(session,selected):'Select a node in your enquiry to make a brief.';
    $('crux-use').disabled=!available;$('crux-copy').disabled=!available;
  }
  function renderComparison(){
    const left=$('compare-a'),right=$('compare-b'),a=left.value,b=right.value;
    for(const select of [left,right]){
      select.replaceChildren(option('','Choose a thought'));
      for(const n of session.nodes)select.append(option(n.id,`${typeNames[n.type]} · ${n.origin}: ${n.text.replace(/\s+/g,' ').slice(0,90)}`));
    }
    left.value=session.nodes.some(n=>n.id===a)?a:'';right.value=session.nodes.some(n=>n.id===b)?b:'';
    const ready=!!left.value&&!!right.value&&left.value!==right.value;
    $('compare-brief').textContent=ready?C.comparisonBrief(session,left.value,right.value):'Choose two different enquiry nodes.';
    for(const id of ['compare-use','compare-copy','compare-ask','external-compare'])$(id).disabled=!ready;
  }
  function render(){ $('title').value=session.title;renderTurns();renderTree();renderNext();renderCrux();renderComparison(); }
  function selectedSeed(){const value=$('seed').value;return value===''?null:seeds[Number(value)]||null;}
  function setSeedLink(){const seed=selectedSeed();$('add-seed').disabled=!seed;$('seed-link').hidden=!seed;if(seed)$('seed-link').href=BASE+seed.file;}
  function renderSeedOptions(){const query=$('seed-search').value.trim().toLowerCase(),prior=$('seed').value;$('seed').replaceChildren();
    seeds.forEach((seed,index)=>{if((seed.label+' '+seed.question).toLowerCase().includes(query))$('seed').append(option(String(index),seed.label));});
    if([...$('seed').options].some(x=>x.value===prior))$('seed').value=prior;setSeedLink();}
  $('seed').onchange=setSeedLink;$('seed-search').oninput=renderSeedOptions;renderSeedOptions();
  $('add-seed').onclick=()=>{const seed=selectedSeed();if(!seed)return;try{
    add({parent:null,type:'question',origin:'unknown',text:seed.question,link:{label:seed.label,url:BASE+seed.file}});
    status('Added a question from an earlier enquiry; check the underlying source before treating it as evidence.');
  }catch(e){status(e.message);}};
  $('title').oninput=()=>{session={...session,title:$('title').value};save();renderCrux();renderComparison();};
  $('compare-a').onchange=renderComparison;$('compare-b').onchange=renderComparison;
  $('new').onclick=()=>{if((session.nodes.length||session.turns.length)&&!confirm('Start a new enquiry? Export the current one first if you want a copy.'))return;
    session=C.makeSession();selected=null;projection=null;verifiedSource=null;proposalParent=null;proposalSession=null;proposalSnapshot=null;proposalOwner=null;proposalType='answer';proposalGeneration++;generatedEssay=null;clearPrivateViews();$('agent-citations').replaceChildren();$('essay-citations').replaceChildren();$('external-prompt').value='';
    $('work').value='';$('target').replaceChildren(option('','Choose a passage'));$('source').textContent='Choose a work and passage to inspect its source.';
    $('attach-source').disabled=true;$('save-source').disabled=true;$('essay').value='';$('agent-output').value='';save();render();status('New private enquiry.');};
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
    session=loaded;selected=null;projection=null;verifiedSource=null;proposalParent=null;proposalSession=null;proposalSnapshot=null;proposalOwner=null;proposalType='answer';proposalGeneration++;generatedEssay=null;clearPrivateViews();$('essay-citations').replaceChildren();$('agent-citations').replaceChildren();$('essay').value='';$('agent-output').value='';$('external-prompt').value='';
    save();render();await loadWork(session.work,session.target);status('Imported. Passage references in a file are claims until rechecked.');
  }catch(e){status('Could not import: '+e.message);}finally{event.target.value='';}};
  function canonical(v){if(Array.isArray(v))return '['+v.map(canonical).join(',')+']';
    if(v&&typeof v==='object')return '{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}';return JSON.stringify(v);}
  async function sha(v){const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(canonical(v)));return [...new Uint8Array(hash)].map(x=>x.toString(16).padStart(2,'0')).join('');}
  async function readJson(url){const r=await fetch(url,{cache:'no-store'});if(!r.ok)throw Error('This Scholar projection is unavailable.');return r.json();}
  async function loadWork(work,target=''){
    const serial=++loadSerial;projection=null;verifiedSource=null;$('attach-source').disabled=true;$('save-source').disabled=true;$('target').replaceChildren(option('','Choose a passage'));
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
    const target=$('target').value,serial=++loadSerial;verifiedSource=null;$('attach-source').disabled=true;$('save-source').disabled=true;
    session={...session,target};save();if(!target||!projection){$('source').textContent='Choose a passage.';return;}
    const v=projection.source_verses?.[target],t1=projection.originals?.t1?.[target],hash=projection.original_hashes?.t1?.[target];
    if(!v||typeof v.text!=='string'||!v.text.trim()||!t1||!/^[a-f0-9]{64}$/.test(hash||'')||await sha(t1)!==hash)throw Error('Passage integrity check failed.');
    if(serial!==loadSerial)return;
    const edition=String(projection.source_edition||v.source_origin||'Edition not recorded').slice(0,500);
    verifiedSource={work:session.work,target,projection_sha256:projection.projection_sha256,t1_sha256:hash,source_edition:edition,text:v.text};
    $('source').textContent=`${target} · ${edition}\n\n${v.text}\n\nBundle hash checked. Verify edition and full passage coverage independently.`;$('attach-source').disabled=false;$('save-source').disabled=false;
  }
  $('work').onchange=async()=>{const work=$('work').value;$('scholar-work').value=work;session={...session,work,target:''};save();try{await loadWork(work);}catch(e){status(e.message);}};
  $('target').onchange=async()=>{try{await chooseSource();}catch(e){status(e.message);}};
  $('attach-source').onclick=()=>{if(!verifiedSource)return;const {text,...reference}=verifiedSource;try{add({parent:selected,type:'source',origin:'source',text,reference});status('Source added. Add your interpretation as a separate node.');}catch(e){status(e.message);}};
  async function request(path,method='GET',data){if(readOnlyPreview)throw Error('Scholar accounts and Qwen are not connected on this reader preview.');if(!API)throw Error(apiError||'Scholar API unavailable.');const r=await fetch(API+path,{method,credentials:'include',...(data?{headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}:{})});
    let value;try{value=await r.json();}catch{throw Error('Scholar backend returned an unexpected response.');}if(!r.ok)throw Error(value.error||'Scholar request failed.');return value;}
  async function profile(){const me=await request('/api/auth/me');if(!me.profile?.id)throw Error('Sign in to Scholar first.');return me.profile;}
  function checkPrivateOwners(nodes,uid){if(nodes.some(n=>(n.private_ref&&n.private_ref.owner_id!==uid)||(n.private_owner&&n.private_owner!==uid)))throw Error('This enquiry includes material from a different Scholar account. Open that account or remove that material before sending or saving it.');}
  function clearPrivateViews(){accountEssays=[];accountEnquiries=[];accountEssayOwner=null;accountEnquiryOwner=null;notebook=[];published=[];styles=[];notebookOwner=null;publishedOwner=null;styleOwner=null;selectedScholarKeys.clear();$('style-choices').replaceChildren();$('source-choices').replaceChildren();$('scholarship').replaceChildren();$('scholar-essays').replaceChildren(option('','Choose an essay'));$('scholar-excerpt').value='';$('account-enquiries').replaceChildren(option('','Choose a saved enquiry'));}
  async function checkVisibleAccount(){if(!accountEssayOwner&&!accountEnquiryOwner&&!notebookOwner&&!publishedOwner&&!styleOwner)return;try{const owner=await profile();if((accountEssayOwner&&owner.id!==accountEssayOwner)||(accountEnquiryOwner&&owner.id!==accountEnquiryOwner)||(notebookOwner&&owner.id!==notebookOwner)||(publishedOwner&&owner.id!==publishedOwner)||(styleOwner&&owner.id!==styleOwner)){clearPrivateViews();status('Account changed; private Scholar lists were cleared.');}}catch{clearPrivateViews();status('Signed out; private Scholar lists were cleared.');}}
  addEventListener('focus',checkVisibleAccount);
  $('save-source').onclick=async()=>{try{
    if(!verifiedSource)throw Error('Choose a passage first.');const owner=await profile(),source={...verifiedSource};
    if((await profile()).id!==owner.id||verifiedSource?.work!==source.work||verifiedSource?.target!==source.target)throw Error('Account or passage changed; try again.');
    await request('/api/scholar/sources','POST',{work:source.work,target:source.target,note:''});status('Passage saved to your private source notebook.');
  }catch(e){status(e.message);}};
  $('load-sources').onclick=async()=>{try{
    const owner=await profile(),result=await request('/api/scholar/sources');if((await profile()).id!==owner.id)throw Error('Account changed; try again.');
    notebookOwner=owner.id;notebook=result.sources||[];const box=$('source-choices');box.replaceChildren();
    for(const item of notebook){const row=el('div',undefined,'evidence-choice'),input=el('input');input.type='checkbox';input.className='notebook-choice';input.value=item.id;
      const label=el('label',`${item.work} / ${item.target}${item.note?' · note: '+item.note:''}`);label.prepend(input);row.append(label);box.append(row);}
    status(`${notebook.length} saved passage(s) found. Select up to three for Qwen.`);
  }catch(e){status(e.message);}};
  function selectedSources(){const ids=[...document.querySelectorAll('.notebook-choice:checked')].map(x=>x.value);if(ids.length>3)throw Error('Select at most three notebook passages.');return ids;}
  $('load-style').onclick=async()=>{try{
    const owner=await profile(),result=await request('/api/scholar/style-examples');if((await profile()).id!==owner.id)throw Error('Account changed; try again.');
    styleOwner=owner.id;styles=(result.examples||[]).filter(x=>x.kind==='essay');const box=$('style-choices');box.replaceChildren();
    for(const item of styles){const row=el('div',undefined,'evidence-choice'),input=el('input');input.type='checkbox';input.className='style-choice';input.value=item.id;
      const label=el('label',`${item.work} · essay revisions ${item.before_revision} → ${item.after_revision}`);label.prepend(input);row.append(label);box.append(row);}
    status(`${styles.length} private essay style edit(s) found. Select up to six.`);
  }catch(e){status(e.message);}};
  function selectedStyle(){const ids=[...document.querySelectorAll('.style-choice:checked')].map(x=>x.value);if(ids.length>6)throw Error('Select at most six style edits.');return ids;}
  function selectedScholars(scope){const selectedRows=[...document.querySelectorAll('.scholar-choice:checked')].map(x=>published[Number(x.value)]);
    if(selectedRows.length>3)throw Error('Select at most three published essays.');
    if(selectedRows.some(x=>!x||(scope==='answers'?!x.allow_answers:!x.allow_drafts)))throw Error('A selected author has not permitted this particular use.');
    return selectedRows.map(x=>({work:x.work,essay_id:x.essay_id}));}
  function renderPublished(){const box=$('scholarship');box.replaceChildren();
    if(!published.length){box.append(el('p','No published essays in this work yet.','note'));return;}
    published.forEach((essay,index)=>{const row=el('div',undefined,'citation'),label=el('label'),choice=el('input');choice.type='checkbox';choice.className='scholar-choice';choice.value=String(index);
      const key=essay.work+'\0'+essay.essay_id;choice.disabled=!essay.allow_answers&&!essay.allow_drafts;choice.checked=selectedScholarKeys.has(key)&&!choice.disabled;
      choice.onchange=()=>{if(choice.checked)selectedScholarKeys.add(key);else selectedScholarKeys.delete(key);};
      label.append(choice,document.createTextNode(` ${essay.title} · ${essay.author} · ${essay.work}`));row.append(label);
      row.append(el('div',`Allowed: ${essay.allow_answers?'answers':'no answers'} · ${essay.allow_drafts?'drafts':'no drafts'}`,'note'));
      if(essay.owned){const panel=el('div',undefined,'grant-controls'),a=el('input'),d=el('input'),al=el('label'),dl=el('label');a.type=d.type='checkbox';a.className='grant-answers';d.className='grant-drafts';a.checked=essay.allow_answers;d.checked=essay.allow_drafts;
        al.append(a,document.createTextNode('Allow AI answers from this version'));dl.append(d,document.createTextNode('Allow AI essay drafting from this version'));
        panel.append(al,dl,button('Save my permissions',async()=>{try{const owner=await profile(),allowAnswers=a.checked,allowDrafts=d.checked;if(owner.id!==publishedOwner)throw Error('Account changed; reload published essays.');
          if(!confirm(`For this exact published essay, ${allowAnswers?'allow':'disallow'} AI answers and ${allowDrafts?'allow':'disallow'} AI essay drafts?`))return;
          if((await profile()).id!==owner.id||a.checked!==allowAnswers||d.checked!==allowDrafts)throw Error('Account or permissions changed; try again.');
          await request('/api/scholar/essay-permissions','PUT',{work:essay.work,essay_id:essay.essay_id,allow_answers:allowAnswers,allow_drafts:allowDrafts,confirmed:true});
          essay.allow_answers=allowAnswers;essay.allow_drafts=allowDrafts;if(!allowAnswers&&!allowDrafts)selectedScholarKeys.delete(key);renderPublished();status('Permissions updated for this published version.');
        }catch(e){status(e.message);}}));row.append(panel);}
      box.append(row);});
  }
  $('load-scholarship').onclick=async()=>{try{
    const work=$('scholar-work').value;if(!work)throw Error('Choose a work for the scholarship.');const owner=await profile();
    if(publishedOwner&&publishedOwner!==owner.id)clearPrivateViews();
    const result=await request('/api/scholar/published-essays?work='+encodeURIComponent(work));
    if((await profile()).id!==owner.id||$('scholar-work').value!==work)throw Error('Account or work changed; try again.');
    publishedOwner=owner.id;published=[...published.filter(x=>x.work!==work),...(result.essays||[])];renderPublished();status(`${(result.essays||[]).length} published essay(s) found for ${work}.`);
  }catch(e){status(e.message);}};
  function showCitations(id,items){const box=$(id);box.replaceChildren();for(const c of items||[]){const row=el('div',undefined,'citation');
    row.append(el('strong',`[${c.marker}] ${c.author} · ${c.title} · paragraph ${c.paragraph}`));
    const link=el('a','Open published essay in Scholar ↗');link.href=`./?work=${encodeURIComponent(c.work)}&view=scholar`;row.append(el('div',`Exact version ${c.essay_id}`,'note'),link);
    const detail=el('details'),summary=el('summary','Inspect selected excerpt');detail.append(summary,el('p',c.excerpt));row.append(detail);box.append(row);}}
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
    if((await profile()).id!==owner.id)throw Error('Account changed; try again.');session=loaded;selected=null;proposalParent=null;proposalSession=null;proposalSnapshot=null;proposalOwner=null;proposalType='answer';proposalGeneration++;generatedEssay=null;clearPrivateViews();$('essay-citations').replaceChildren();$('agent-citations').replaceChildren();$('essay').value='';$('agent-output').value='';$('external-prompt').value='';save();render();await loadWork(session.work,session.target);
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
    const text=doc.content.text.slice(start,end),parent=selected,sessionId=session.id;if(text.length>12000)throw Error('Select an excerpt under 12,000 characters.');
    if(!confirm('Add this private essay excerpt to the enquiry saved on this device? It will remain on this device after sign-out until you remove it.'))return;
    const snapshot={kind:doc.kind,work:doc.work,target:doc.target,layer:doc.layer,title:doc.title,content:doc.content},hash=await sha(snapshot);
    if((await profile()).id!==owner.id||session.id!==sessionId||session.work!==doc.work||selected!==parent||$('scholar-essays').value!==val)throw Error('Account, essay or branch changed; try again.');
    add({parent,type:'answer',origin:doc.content.assisted?'agent':'human',text,private_ref:{owner_id:owner.id,document_id:doc.id,revision:doc.revision,snapshot_sha256:hash}});
    status('Excerpt added from the saved essay revision.');
  }catch(e){status(e.message);}};
  async function assist(kind,mode='enquiry'){
    if(!session.work)throw Error('Choose a work first.');
    const ids=selectedSources(),refs=selectedScholars(kind==='essay'?'drafts':'answers'),styleIds=kind==='essay'?selectedStyle():[];
    const source=verifiedSource?{...verifiedSource}:null;
    if(source&&(source.work!==session.work||source.target!==session.target))throw Error('The selected passage changed; choose it again.');
    if(kind==='essay'&&!source)throw Error('Choose a verified Scholar passage for the essay first.');
    if(!source&&!ids.length&&!refs.length)throw Error('Choose a passage, a notebook source or permitted scholarship first.');
    const compare=kind==='enquiry'&&mode==='compare',capturedSession=session.id,parent=compare?$('compare-a').value:selected,other=compare?$('compare-b').value:null,work=session.work,target=source?.target||'';
    const paths=compare?C.comparisonPaths(session,parent,other):[C.path(session,parent)],path=paths[0];
    const instruction=kind==='essay'?C.essayInstruction(session,parent):compare?C.comparisonInstruction(session,parent,other):C.modelInstruction(session,parent,mode),owner=await profile();
    checkPrivateOwners(paths.flat(),owner.id);if(ids.length&&notebookOwner!==owner.id)throw Error('Account changed; reload your sources.');
    if(refs.length&&publishedOwner!==owner.id)throw Error('Account changed; reload published essays.');
    if(styleIds.length&&styleOwner!==owner.id)throw Error('Account changed; reload your style edits.');
    const signature=JSON.stringify({ids,refs,styleIds});
    const current=()=>session.id===capturedSession&&(compare?$('compare-a').value===parent&&$('compare-b').value===other:selected===parent)&&session.work===work&&
      (source?(verifiedSource?.work===source.work&&verifiedSource?.target===source.target):!verifiedSource)&&
      (kind==='essay'?C.essayInstruction(session,parent):compare?C.comparisonInstruction(session,parent,other):C.modelInstruction(session,parent,mode))===instruction&&
      JSON.stringify({ids:selectedSources(),refs:selectedScholars(kind==='essay'?'drafts':'answers'),styleIds:kind==='essay'?selectedStyle():[]})===signature;
    if(!current())throw Error('The branch, sources or passage changed; try again.');
    if(!confirm(`Send the selected ${path.length}-node branch${compare?' and '+paths[1].length+'-node comparison branch':''}${source?', '+source.work+' / '+source.target+' and its available layers':''}${ids.length?', '+ids.length+' notebook source(s) and their notes':''}${refs.length?', '+refs.length+' author-permitted essay(s)':''}${styleIds.length?', and '+styleIds.length+' selected private style edit(s)':''} to Qwen using ${owner.display_name||'your Scholar account'}? Other conversation turns are not sent.`))return null;
    if((await profile()).id!==owner.id||!current())throw Error('The account, branch or selected evidence changed; try again.');
    const result=await request('/api/scholar/assist','POST',{work,target,layer:'l3',kind,instruction,use_style:styleIds.length>0,style_example_ids:styleIds,source_ids:ids,scholar_essays:refs,consent_to_ai:true});
    if((await profile()).id!==owner.id||!current())throw Error('Account or enquiry changed; the response remains in the original private account.');
    if(!result.document?.content?.text)throw Error('The model returned no proposal.');
    return {doc:result.document,owner:owner.id,source,ids,refs,parent,session:capturedSession,work,target,branchSnapshots:paths.map(branch=>({id:branch.at(-1).id,bytes:JSON.stringify(branch)}))};
  }
  async function ask(mode){const generation=++proposalGeneration;try{
    const result=await assist('enquiry',mode);if(!result)return;
    if(generation!==proposalGeneration)throw Error('A newer request replaced this proposal; the earlier response remains in its private account.');
    $('agent-output').value=result.doc.content.text;proposalParent=result.parent;proposalSession=result.session;proposalSnapshot=result.branchSnapshots;proposalOwner=result.owner;proposalType=mode==='examine'?'objection':'answer';
    showCitations('agent-citations',result.doc.content.scholar_citations);status('Agent proposal saved privately by Scholar. Check it; add it to the tree only if useful.');
  }catch(e){status(e.message);}}
  $('ask').onclick=()=>ask('enquiry');$('challenge').onclick=()=>ask('examine');$('compare-ask').onclick=()=>ask('compare');
  function prepareExternal(mode){try{
    const compare=mode==='compare',parent=compare?$('compare-a').value:selected,other=compare?$('compare-b').value:null;
    const paths=compare?C.comparisonPaths(session,parent,other):[C.path(session,parent)];
    const prompt=compare?C.comparisonInstruction(session,parent,other):C.modelInstruction(session,parent,'examine');
    const owners=[...new Set(paths.flat().flatMap(n=>[n.private_owner,n.private_ref?.owner_id]).filter(Boolean))];
    if(owners.length>1)throw Error('These branches contain material from different Scholar accounts.');
    if($('agent-output').value.trim()&&!confirm('Replace the current proposal with a new prompt?'))return;
    proposalGeneration++;proposalParent=parent;proposalSession=session.id;proposalSnapshot=paths.map(branch=>({id:branch.at(-1).id,bytes:JSON.stringify(branch)}));proposalOwner=owners[0]||null;proposalType=compare?'answer':'objection';
    $('external-prompt').value=prompt;$('agent-output').value='';$('agent-citations').replaceChildren();status('Prompt prepared on this device. Review it before sharing.');
  }catch(e){status(e.message);}}
  $('external-challenge').onclick=()=>prepareExternal('examine');$('external-compare').onclick=()=>prepareExternal('compare');
  $('external-copy').onclick=async()=>{try{if(!$('external-prompt').value)throw Error('Prepare a prompt first.');await navigator.clipboard.writeText($('external-prompt').value);status('Prompt copied. Review it before sharing.');}catch(e){status(e.message||'Select the prompt and copy it manually.');}};
  $('add-agent').onclick=async()=>{try{if(proposalOwner&&(await profile()).id!==proposalOwner)throw Error('This proposal belongs to a different Scholar account.');
    if(proposalSession&&proposalSession!==session.id)throw Error('This proposal belongs to a different enquiry.');
    const parent=proposalParent||selected;if(parent&&!session.nodes.some(n=>n.id===parent))throw Error('The original branch is no longer present.');
    if(proposalSnapshot&&proposalSnapshot.some(x=>JSON.stringify(C.path(session,x.id))!==x.bytes))throw Error('The original branch changed; ask again before adding the proposal.');
    add({parent,type:proposalType,origin:'agent',text:$('agent-output').value,private_owner:proposalOwner});$('agent-output').value='';proposalParent=null;proposalSession=null;proposalSnapshot=null;proposalOwner=null;proposalType='answer';status('Agent proposal added as an unverified node.');
  }catch(e){status(e.message);}};
  function useBrief(brief){if($('essay').value.trim()&&!confirm('Replace the current working brief?'))return;
    generatedEssay=null;$('essay-citations').replaceChildren();$('essay').value=brief;status('Selected branch prepared as an editable essay brief.');
  }
  $('crux-use').onclick=()=>{try{useBrief(C.cruxBrief(session,selected));}catch(e){status(e.message);}};
  $('crux-copy').onclick=async()=>{try{await navigator.clipboard.writeText(C.cruxBrief(session,selected));status('Selected branch brief copied.');}catch(e){status(e.message||'Could not copy on this device.');}};
  $('compare-use').onclick=()=>{try{useBrief(C.comparisonBrief(session,$('compare-a').value,$('compare-b').value));}catch(e){status(e.message);}};
  $('compare-copy').onclick=async()=>{try{await navigator.clipboard.writeText(C.comparisonBrief(session,$('compare-a').value,$('compare-b').value));status('Comparison copied.');}catch(e){status(e.message||'Could not copy on this device.');}};
  $('essay-preview').onclick=()=>{try{generatedEssay=null;$('essay-citations').replaceChildren();$('essay').value=C.essaySeed(session);status('Essay seed prepared. You can edit it before saving.');}catch(e){status(e.message);}};
  async function prepareDraftCitations(result){
    const passages=result.source?[{work:result.source.work,target:result.source.target}]:[],data=await request('/api/scholar/citations/prepare','POST',{source_ids:result.ids,passages});
    const citations=data.citations||[],root=result.source&&citations.find(x=>x.work===result.source.work&&x.target===result.source.target);
    if(result.source&&(!root||root.t1_sha256!==result.source.t1_sha256||root.projection_sha256!==result.doc.content.projection_sha256||root.projection_sha256!==result.source.projection_sha256))throw Error('The source changed since drafting; review it and draft again.');
    for(const ref of result.doc.content.source_references||[]){const c=citations.find(x=>x.work===ref.work&&x.target===ref.target);if(!c||c.projection_sha256!==ref.projection_sha256)throw Error('A notebook source changed since drafting; review it and draft again.');}
    return citations;
  }
  $('draft-essay').onclick=async()=>{try{
    const result=await assist('essay');if(!result)return;const refs=result.doc.content.scholar_citations||[];
    const bibliography=refs.length?'\n\n## Scholarly sources to check\n'+refs.map(c=>`- [${c.marker}] ${c.author}, ${c.title}, ${c.essay_id}, paragraph ${c.paragraph} (${c.work}).`).join('\n'):'';
    $('essay').value=result.doc.content.text+bibliography;showCitations('essay-citations',refs);
    generatedEssay={...result,ready:false,citations:[]};const citations=await prepareDraftCitations(result);
    generatedEssay={...result,ready:true,citations};status('AI essay draft prepared privately with passage references. Check every claim and citation.');
  }catch(e){status(e.message);}};
  $('copy').onclick=async()=>{try{if(!$('essay').value)throw Error('Prepare an essay seed first.');await navigator.clipboard.writeText($('essay').value);status('Essay seed copied.');}catch(e){status(e.message||'Could not copy on this device.');}};
  $('save-essay').onclick=async()=>{try{
    const text=$('essay').value;if(!text.trim()||text.length>60000)throw Error('Prepare an essay seed of at most 60,000 characters.');
    if(!session.work||!session.target||!verifiedSource)throw Error('Choose an available Scholar work and passage first.');
    const owner=await profile(),work=session.work,target=session.target,title=session.title||'Pushing enquiry';checkPrivateOwners(session.nodes,owner.id);
    if(generatedEssay&&(!generatedEssay.ready||generatedEssay.owner!==owner.id||generatedEssay.session!==session.id||generatedEssay.work!==work||generatedEssay.target!==target))throw Error('The AI draft belongs to another account, enquiry or passage, or its references need checking.');
    if(!confirm(`Create a private essay draft for ${work} / ${target} in ${owner.display_name||'your Scholar account'}? Any attached passage references will be included if you later submit it.`))return;
    if((await profile()).id!==owner.id)throw Error('Account changed; reopen the workspace.');
    if(generatedEssay){const current=await prepareDraftCitations(generatedEssay);if(JSON.stringify(current)!==JSON.stringify(generatedEssay.citations))throw Error('A source changed since drafting; review it and draft again.');}
    if($('essay').value!==text||session.work!==work||session.target!==target||session.title!==title&&!(session.title===''&&title==='Pushing enquiry'))throw Error('The draft or passage changed; try again.');
    const id='essay:pushing-'+crypto.randomUUID(),assisted=!!generatedEssay||session.nodes.some(n=>n.origin==='agent');
    const content={text,assisted,...(generatedEssay?{model:generatedEssay.doc.content.model,agent_source:generatedEssay.doc.id,citations:generatedEssay.citations}:{})};
    await request('/api/scholar/documents/'+encodeURIComponent(id),'PUT',{expected_revision:0,kind:'essay',work,target,layer:'l3',title,content});
    status('Private essay draft saved. Open Scholar to review, invite review and sign off.');
  }catch(e){status(e.message);}};
  async function init(){
    render();if(initialMessage||apiError)status(initialMessage||apiError);
    try{const catalog=await readJson('data/pushing-catalog.json');if(catalog.format!=='svread-pushing-catalog/1'||catalog.revision!=='941ac2ecf1f8e5791a887d9d769159ecbffd7c04'||!Array.isArray(catalog.records))throw Error('Archive index is invalid.');
      for(const row of catalog.records){if(typeof row.file!=='string'||! /^[A-Za-z0-9_./-]+\.md$/.test(row.file)||row.file.split('/').includes('..')||typeof row.question!=='string'||typeof row.title!=='string'||seeds.some(x=>x.file===row.file))continue;
        seeds.push({label:`${row.work||'pushing'} · ${row.title}`.slice(0,180),question:row.question.slice(0,1000),file:row.file});}renderSeedOptions();
    }catch(e){status('Archive index: '+e.message);}
    try{const idx=await readJson('data/scholar/index.json');Object.keys(idx).sort().forEach(work=>{$('work').append(option(work,work));$('scholar-work').append(option(work,work));});
      const q=new URL(location.href).searchParams;if(!session.work&&q.get('work')){session={...session,work:q.get('work'),target:q.get('target')||''};C.validateSession(session);save();}
      if(session.work){$('scholar-work').value=session.work;await loadWork(session.work,session.target);}
    }catch(e){status('Passage lookup: '+e.message);}
  }
  init();
})();
