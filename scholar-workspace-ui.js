/* Private account drafts, revision-specific review and opt-in Qwen assistance. */
(function(root){
  class ScholarWorkspace {
    constructor({api,work,profile,onStatus}){
      this.api=api;this.work=work;this.profile=profile;this.status=onStatus||(()=>{});
      this.docs=new Map();this.conflicts=new Map();this.reviews=[];this.examples=[];this.discussions=new Map();this.userId=null;
      this.current=null;this.essayId=null;this.agent=null;this.voice=null;this.voiceText='';this.signoffs=new Map();this.history=null;
    }
    esc(x){return String(x??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
    async request(path,method='GET',data){
      const response=await fetch(this.api+path,{method,credentials:'include',
        ...(data?{headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}:{})});
      const result=await response.json();if(!response.ok)throw new Error(result.error||'Request failed.');return result;
    }
    key(id){return `svv-private-${this.profile().id}-${id}`;}
    id(kind,target,layer=''){return `${kind}:${layer||'work'}:${target||this.work}`;}
    async load(){
      const uid=this.profile()?.id||null;
      if(uid!==this.userId){this.voice?.end();this.voice=null;this.voiceText='';this.docs.clear();this.conflicts.clear();this.signoffs.clear();this.reviews=[];this.examples=[];this.discussions.clear();this.essayId=null;this.agent=null;this.history=null;this.userId=uid;}
      if(!uid)return;
      try{
        let offset=0;const docs=[];
        do{const page=await this.request('/api/scholar/documents?work='+encodeURIComponent(this.work)+'&offset='+offset);
          docs.push(...(page.documents||[]));const next=page.next_offset;offset=Number.isSafeInteger(next)&&next>offset?next:null;
        }while(offset!==null);
        const reviews=await this.request('/api/scholar/reviews');
        const examples=await this.request('/api/scholar/style-examples');
        if(this.profile()?.id!==uid)return;
        for(const doc of docs)this.docs.set(doc.id,{data:doc,revision:doc.revision,dirty:false});
        const normal=`svv-private-${uid}-`,conflict=`svv-conflict-${uid}-`;
        const keys=Array.from({length:localStorage.length},(_,i)=>localStorage.key(i));
        for(const key of keys){
          if(!key?.startsWith(normal)&&!key?.startsWith(conflict))continue;
          try{const isConflict=key.startsWith(conflict),id=key.slice((isConflict?conflict:normal).length),saved=JSON.parse(localStorage.getItem(key));
            if(saved?.data?.id!==id||saved.data.work!==this.work)continue;
            if(isConflict){this.conflicts.set(id,saved);continue;}
            const revision=this.docs.get(id)?.revision||0;
            if(saved.base_revision===revision){const state={data:saved.data,revision,dirty:true};this.docs.set(id,state);
              state.timer=setTimeout(()=>this.flush(id).catch(e=>this.status(e.message)),600);}
            else{this.conflicts.set(id,saved);localStorage.setItem(conflict+id,JSON.stringify(saved));localStorage.removeItem(key);}
          }catch{}
        }
        this.reviews=reviews.reviews||[];
        this.examples=examples.examples||[];
      }catch(e){this.status('Private workspace unavailable: '+e.message);}
    }
    remember(data){
      if(!this.profile()?.id)return;
      let state=this.docs.get(data.id);if(!state){state={revision:0,dirty:false};this.docs.set(data.id,state);}
      state.data={...data};state.dirty=true;this.signoffs.delete(data.id);
      try{localStorage.setItem(this.key(data.id),JSON.stringify({base_revision:state.revision,data}));}catch{}
      clearTimeout(state.timer);state.timer=setTimeout(()=>this.flush(data.id).catch(e=>this.status(e.message)),600);
    }
    async flush(id){
      const state=this.docs.get(id),uid=this.profile()?.id;if(!state||!uid)throw new Error('Sign in and save a draft first.');
      if(state.deleting)return state.data;
      if(state.inflight){await state.inflight;if(state.dirty)return this.flush(id);return state.data;}
      if(!state.dirty)return state.data;
      const data=JSON.parse(JSON.stringify(state.data));
      state.inflight=this.request('/api/scholar/documents/'+encodeURIComponent(id),'PUT',{...data,expected_revision:state.revision})
        .then(result=>{if(this.profile()?.id!==uid)return;state.revision=result.document.revision;
          if(JSON.stringify(state.data)===JSON.stringify(data)){state.data=result.document;state.dirty=false;
            try{localStorage.removeItem(`svv-private-${uid}-${id}`);}catch{}}
          else try{localStorage.setItem(`svv-private-${uid}-${id}`,JSON.stringify({base_revision:state.revision,data:state.data}));}catch{}
          this.status('Saved privately to your account.');}).finally(()=>{state.inflight=null;});
      await state.inflight;if(state.dirty)return this.flush(id);return state.data;
    }
    document(id){return this.docs.get(id)?.data||null;}
    attach({container,textarea,target,layer,baseHash,parent}){
      if(this.current&&(this.current.target!==target||this.current.layer!==layer)){this.agent=null;this.history=null;}
      if(this.voice){this.voice.end();this.voice=null;this.voiceText='';}
      this.current={container,textarea,target,layer,baseHash,parent:parent?.startsWith('sv:')?parent:null};
      const saved=this.document(this.id('translation',target,layer));
      if(saved&&(saved.content.parent||null)===(this.current.parent||null))textarea.value=saved.content.text;
      if(this.profile()?.id){const id=this.id('reading',this.work),prior=this.document(id);
        if(prior?.target!==target||prior?.layer!==layer)this.remember({id,kind:'note',work:this.work,target,layer,title:'Reading position',content:{text:target}});}
      textarea.addEventListener('input',()=>this.saveTranslation());this.render();
    }
    saveTranslation(assisted){
      const {textarea,target,layer,baseHash,parent}=this.current,id=this.id('translation',target,layer);
      const old=this.document(id)?.content||{},content={text:textarea.value,base_sha256:baseHash||'',parent:parent||null,
        assisted:assisted?.assisted??!!old.assisted};
      if(assisted?.model||old.model)content.model=assisted?.model||old.model;
      if(assisted?.agent_source||old.agent_source)content.agent_source=assisted?.agent_source||old.agent_source;
      this.remember({id,kind:'translation',work:this.work,target,layer,title:'',content});
    }
    render(){
      if(!this.current?.container)return;
      const {container,textarea,target,layer}=this.current,e=x=>this.esc(x),profile=this.profile();
      if(!profile){container.innerHTML='<div class="cmp-note">Sign in to save private drafts and request review.</div>';return;}
      const noteId=this.id('note',target),note=this.document(noteId)?.content?.text||'';
      const essays=[...this.docs.values()].map(x=>x.data).filter(x=>x.kind==='essay');
      if(!this.essayId&&essays.length)this.essayId=essays[0].id;
      const essay=this.document(this.essayId),reviews=this.reviews.filter(r=>r.work===this.work);
      const essayReviews=reviews.filter(r=>r.owner_id===profile.id&&r.document_id===this.essayId);
      const conflicts=[...this.conflicts.entries()].filter(([,saved])=>saved.data.work===this.work);
      const activity=[...this.docs.values()].map(s=>s.data).filter(d=>d.work===this.work&&['agent-draft','conversation'].includes(d.kind));
      const history=this.history, revisions=history?.revisions||[];
      const historyOptions=(selection)=>revisions.map((v,i)=>`<option value="${v.revision}"${i===selection?' selected':''}>Revision ${v.revision} · ${e(v.updated_at)}</option>`).join('');
      container.innerHTML=`<div class="c2box"><div class="c2head">Private Scholar workspace</div>
        <div class="cmp-note">Account ${e(profile.display_name||'')} · reviewer ID ${e(profile.id)}</div>
        ${conflicts.length?`<details open><summary>Conflicting local edits (${conflicts.length})</summary><div class="cmp-note">Restoring a local copy will replace the newer account draft.</div>${conflicts.map(([id,s])=>`<div>${e(id)}</div><pre>${e(s.data.content?.text||'')}</pre><button class="c2btn workspace-restore" data-id="${e(id)}">Restore local copy</button>`).join('')}</details>`:''}
        <label>Private passage notes<textarea id="workspace-note" rows="3">${e(note)}</textarea></label>
        <details><summary>Essay</summary><select id="workspace-essay"><option value="">Choose an essay</option>${essays.map(x=>`<option value="${e(x.id)}"${x.id===this.essayId?' selected':''}>${e(x.title||'Untitled')}</option>`).join('')}</select>
          <button class="c2btn" id="workspace-new">New essay</button><input id="workspace-title" placeholder="Title" value="${e(essay?.title||'')}"/><textarea id="workspace-text" rows="6">${e(essay?.content?.text||'')}</textarea></details>
        <details${history?' open':''}><summary>Private revision history</summary>
          <select id="workspace-history-kind"><option value="translation"${history?.id!==this.essayId?' selected':''}>Current translation</option><option value="essay"${history&&history.id===this.essayId?' selected':''}>Selected essay</option></select>
          <button class="c2btn" id="workspace-history-load">Load revisions</button>
          <div class="cmp-note">Saved revisions remain private. Restoring one creates a new revision.</div>
          ${revisions.length?`<label>First revision <select id="workspace-history-left">${historyOptions(0)}</select></label><pre id="workspace-history-left-text"></pre>
            <label>Second revision <select id="workspace-history-right">${historyOptions(Math.min(1,revisions.length-1))}</select></label><pre id="workspace-history-right-text"></pre>
            <button class="c2btn" id="workspace-history-restore">Restore second revision</button><button class="c2btn" id="workspace-history-teach">Use these edits as a style example</button>${history.next_before?'<button class="c2btn" id="workspace-history-older">Load older revisions</button>':''}`:''}</details>
        <details><summary>Ask Qwen</summary><select id="workspace-task"><option value="readings">Compare three readings</option><option value="translation">Draft translation</option><option value="essay">Draft essay</option><option value="essay_revision">Revise selected essay</option></select>
          <textarea id="workspace-prompt" placeholder="What should it explore?"></textarea><label><input type="checkbox" id="workspace-style"/> Use my private style examples</label>
          <div class="cmp-note">Select saved edits below, or leave them unchecked to use at least three human-written examples from this work.</div>
          ${this.examples.map(x=>`<div><label><input type="checkbox" class="workspace-style-choice" value="${e(x.id)}"/> ${e(x.kind)} · ${e(x.work)} · revisions ${x.before_revision} → ${x.after_revision}</label> <button class="c2btn workspace-style-delete" data-id="${e(x.id)}">Remove example</button></div>`).join('')}
          ${essayReviews.length?`<div class="cmp-note">Feedback for the selected essay (only a current revision with reviewer permission can be sent to Qwen):</div>${essayReviews.map(r=>`<label><input type="checkbox" class="workspace-feedback-choice" value="${e(r.id)}"${!r.ai_consent||!r.decision||r.revision!==essay?.revision?' disabled':''}/> Revision ${r.revision} · ${e(r.decision||'awaiting review')} · ${r.ai_consent?'AI use permitted':'AI use not permitted'}</label>`).join('')}`:''}
          <button class="c2btn" id="workspace-ask">Ask Qwen</button><div class="cmp-note">Your selected passage, essay, examples and feedback are sent to Qwen only after your confirmation.</div>
          <pre id="workspace-output">${e(this.agent?.content?.text||'')}</pre><button class="c2btn" id="workspace-use">Use agent draft</button></details>
        <details><summary>Voice conversation</summary><button class="c2btn" id="workspace-talk">Talk</button><button class="c2btn" id="workspace-send">Send</button><button class="c2btn" id="workspace-end">End</button>
          <div class="cmp-note">Audio and this passage go to Qwen after consent; transcripts are saved privately. Provider usage may consume quota.</div><pre id="workspace-voice-text">${e(this.voiceText)}</pre></details>
        <details><summary>Peer review</summary><select id="workspace-review-kind"><option value="translation">Current translation</option><option value="essay">Selected essay</option></select>
          <input id="workspace-reviewer" placeholder="Reviewer account ID"/><button class="c2btn" id="workspace-share">Share saved revision</button>
          ${reviews.map(r=>`<div class="cmp-note">${e(r.document_id)} · revision ${r.revision} · ${e(r.decision||'awaiting review')} · ${e((r.snapshot_sha256||'').slice(0,12))}</div><pre>${e(r.snapshot?.content?.text||'')}</pre>
            ${r.reasoning?`<div>${e(r.reasoning)}</div>`:''}${Object.entries(r.rubric||{}).filter(([,v])=>v).map(([k,v])=>`<div><b>${e(k)}:</b> ${e(v)}</div>`).join('')}
            ${r.reviewer_id===profile.id&&!r.decision?`<textarea id="workspace-review-${e(r.id)}" placeholder="Overall reasoning"></textarea>
              <textarea id="workspace-review-argument-${e(r.id)}" placeholder="Argument and reasoning"></textarea><textarea id="workspace-review-evidence-${e(r.id)}" placeholder="Evidence and sources"></textarea>
              <textarea id="workspace-review-suggestions-${e(r.id)}" placeholder="Constructive suggestions"></textarea>
              <label><input type="checkbox" id="workspace-review-ai-${e(r.id)}"/> Allow the author to send this report to Qwen</label>
              <button class="c2btn workspace-decision" data-id="${e(r.id)}" data-decision="ACCEPT">Accept</button><button class="c2btn workspace-decision" data-id="${e(r.id)}" data-decision="REQUEST_CHANGES">Request changes</button><button class="c2btn workspace-decision" data-id="${e(r.id)}" data-decision="COMMENT">Comment</button>`:''}
            ${r.reviewer_id===profile.id&&r.decision?`<button class="c2btn workspace-review-consent" data-id="${e(r.id)}" data-allow="${r.ai_consent?'false':'true'}">${r.ai_consent?'Revoke AI permission':'Allow AI use of report'}</button>`:''}
            <button class="c2btn workspace-thread-load" data-id="${e(r.id)}">Load private discussion</button>
            ${(this.discussions.get(r.id)||[]).map(m=>`<div class="cmp-note">${m.author_id===profile.id?'You':'Participant'}: ${e(m.body)}</div>`).join('')}
            <textarea id="workspace-message-${e(r.id)}" placeholder="Reply privately"></textarea><button class="c2btn workspace-thread-send" data-id="${e(r.id)}">Send reply</button>`).join('')}</details>
        <details><summary>Author sign-off</summary><select id="workspace-sign-kind"><option value="translation">Current translation</option><option value="essay">Selected essay</option></select>
          <select id="workspace-rights"><option value="all-rights-reserved">All rights reserved</option><option value="cc-by-4.0">CC BY 4.0</option><option value="cc0">CC0</option></select>
          <button class="c2btn" id="workspace-sign">Sign off saved revision</button><button class="c2btn" id="workspace-submit">Submit signed revision</button>
          <div class="cmp-note">Sign-off is private. Submission may create a public Git branch for review; it does not merge or publish to the site automatically.</div></details>
        <details><summary>Saved agent and voice activity (${activity.length})</summary>${activity.map(d=>`<details><summary>${e(d.title||d.kind)} · ${e(d.target)}</summary><pre>${e(d.content?.text||'')}</pre><button class="c2btn workspace-delete" data-id="${e(d.id)}">Delete private copy</button></details>`).join('')}</details></div>`;
      const $=selector=>container.querySelector(selector);
      container.querySelectorAll('.workspace-restore').forEach(button=>{button.onclick=()=>{
        const id=button.dataset.id,s=this.conflicts.get(id);if(!s)return;this.conflicts.delete(id);
        try{localStorage.removeItem(`svv-conflict-${profile.id}-${id}`);}catch{}
        this.remember(s.data);if(id===this.id('translation',target,layer))textarea.value=s.data.content.text;this.render();
      };});
      container.querySelectorAll('.workspace-delete').forEach(button=>{button.onclick=async()=>{
        const id=button.dataset.id,state=this.docs.get(id);if(!state)return;
        if(!root.confirm('Delete this private copy? Previously shared or published copies remain.'))return;
        try{state.deleting=true;clearTimeout(state.timer);if(state.inflight)await state.inflight;
          if(state.revision)await this.request('/api/scholar/documents/'+encodeURIComponent(id),'DELETE',{expected_revision:state.revision});
          this.docs.delete(id);if(this.history?.id===id)this.history=null;
          try{localStorage.removeItem(this.key(id));}catch{}this.render();this.status('Private copy deleted.');
        }catch(err){state.deleting=false;this.status(err.message);}
      };});
      $('#workspace-note').oninput=event=>this.remember({id:noteId,kind:'note',work:this.work,target,layer,title:'Passage note',content:{text:event.target.value}});
      $('#workspace-new').onclick=()=>{this.essayId='essay:'+crypto.randomUUID();this.remember({id:this.essayId,kind:'essay',work:this.work,target,layer,title:'',content:{text:''}});this.render();};
      $('#workspace-essay').onchange=event=>{this.essayId=event.target.value||null;this.history=null;this.render();};
      const saveEssay=()=>{if(!this.essayId)return this.status('Create or choose an essay first.');
        const old=this.document(this.essayId), prior=old?.content||{};
        this.remember({id:this.essayId,kind:'essay',work:this.work,target:old?.target||target,layer:old?.layer||layer,
          title:$('#workspace-title').value,content:{text:$('#workspace-text').value,assisted:!!prior.assisted,...(prior.model?{model:prior.model}:{})}});};
      $('#workspace-title').oninput=saveEssay;$('#workspace-text').oninput=saveEssay;
      $('#workspace-ask').onclick=async()=>{
        const kind=$('#workspace-task').value,useStyle=$('#workspace-style').checked;
        const styleIds=[...container.querySelectorAll('.workspace-style-choice:checked')].map(x=>x.value);
        const reviewIds=kind==='essay_revision'?[...container.querySelectorAll('.workspace-feedback-choice:checked')].map(x=>x.value):[];
        if(styleIds.length&&!useStyle)return this.status('Select “Use my private style examples” first.');
        try{
          let source=null;if(kind==='essay_revision'){
            if(!this.essayId)throw new Error('Choose an essay first.');
            await this.flush(this.essayId);source=this.document(this.essayId);if(!source)throw new Error('Choose a saved essay.');
          }
          if(!root.confirm(`Send the passage${source?', your saved essay':''}${useStyle?', your selected private style examples':''}${reviewIds.length?', and the selected permitted peer feedback':''} to Qwen?`))return;
          const result=await this.request('/api/scholar/assist','POST',{work:source?.work||this.work,target:source?.target||target,
            layer:['l2','l3','l4'].includes(source?.layer||layer)?(source?.layer||layer):'l3',
            kind,instruction:$('#workspace-prompt').value,use_style:useStyle,style_example_ids:styleIds,review_ids:reviewIds,consent_to_ai:true,
            ...(source?{document_id:source.id,revision:source.revision}:{})});
          if(this.profile()?.id!==profile.id)return;
          this.agent=result.document;this.docs.set(result.document.id,{data:result.document,revision:result.document.revision,dirty:false});
          $('#workspace-output').textContent=result.document.content.text;this.status(result.message);
        }catch(e){this.status(e.message);}
      };
      $('#workspace-use').onclick=()=>{
        if(!this.agent)return this.status('Ask Qwen for a draft first.');
        if(['essay','essay_revision'].includes(this.agent.content.task)){
          const old=this.document(this.essayId);if(!old)return this.status('Create an essay first.');
          if(this.agent.content.task==='essay_revision'&&(this.agent.content.source_document_id!==old.id||
              this.agent.content.source_revision!==old.revision||this.docs.get(old.id)?.dirty))
            return this.status('The essay changed since this draft was generated. Request a fresh revision.');
          this.remember({...old,content:{text:this.agent.content.text,assisted:true,model:this.agent.content.model}});this.render();
        }else{textarea.value=this.agent.content.text;this.saveTranslation({assisted:true,model:this.agent.content.model,agent_source:this.agent.id});}
        this.status('Agent draft copied privately. Review it against the source.');
      };
      $('#workspace-talk').onclick=async()=>{
        if(!this.voice){
          if(!root.confirm('Send your voice and this passage to Qwen? Provider realtime usage may consume quota.'))return;
          const url=new URL(this.api);url.protocol=url.protocol==='https:'?'wss:':'ws:';url.pathname='/api/scholar/voice';
          url.search=new URLSearchParams({work:this.work,target}).toString();const owner=profile.id;
          this.voice=new root.ScholarVoice({url:url.toString(),onStatus:message=>this.status(message),
            onTranscript:(who,text)=>{if(this.profile()?.id!==owner)return;this.voiceText=who+': '+text;const node=$('#workspace-voice-text');if(node)node.textContent=this.voiceText;},
            onComplete:turn=>{if(this.profile()?.id!==owner||(!turn.user&&!turn.agent))return;
              this.remember({id:'voice:'+turn.id,kind:'conversation',work:this.work,target,layer,title:'Qwen voice conversation',
                content:{text:`You: ${turn.user}\nQwen: ${turn.agent}`,assisted:true,model:'qwen3.8-omni-flash-realtime'}});}});
        }
        try{await this.voice.talk();}catch{this.voice.end();this.voice=null;this.status('Microphone or voice connection unavailable.');}
      };
      $('#workspace-send').onclick=()=>this.voice?.send();
      $('#workspace-end').onclick=()=>{this.voice?.end();this.voice=null;};
      const selected=kind=>kind==='essay'?this.essayId:this.id('translation',target,layer);
      $('#workspace-history-load').onclick=async()=>{try{
        const id=selected($('#workspace-history-kind').value),uid=profile.id;if(!id)throw new Error('Choose a document.');
        await this.flush(id);const result=await this.request('/api/scholar/documents/'+encodeURIComponent(id)+'/history');
        if(this.profile()?.id!==uid)return;
        this.history={id,revisions:result.revisions||[],next_before:result.next_before};this.render();
        this.status('Private revision history loaded.');
      }catch(e){this.status(e.message);}};
      if(revisions.length){
        const updateHistory=()=>{for(const side of ['left','right']){
          const revision=Number($('#workspace-history-'+side).value),v=revisions.find(x=>x.revision===revision);
          $('#workspace-history-'+side+'-text').textContent=v?.content?.text||'';
        }};
        $('#workspace-history-left').onchange=updateHistory;$('#workspace-history-right').onchange=updateHistory;updateHistory();
        $('#workspace-history-restore').onclick=async()=>{try{
          const revision=Number($('#workspace-history-right').value),v=revisions.find(x=>x.revision===revision),id=history.id,uid=profile.id;
          if(!v||!this.document(id))throw new Error('Choose a saved revision.');
          if(!root.confirm('Restore this private revision as a new saved revision?'))return;
          await this.flush(id);if(this.profile()?.id!==uid||this.history!==history)return;
          this.remember({id,kind:v.kind,work:v.work,target:v.target,layer:v.layer,title:v.title,content:v.content});
          if(id===this.id('translation',target,layer))textarea.value=v.content.text;
          await this.flush(id);if(this.profile()?.id!==uid)return;
          this.history=null;this.render();this.status('Restored as a new private revision.');
        }catch(e){this.status(e.message);}};
        $('#workspace-history-teach').onclick=async()=>{try{
          const numbers=[Number($('#workspace-history-left').value),Number($('#workspace-history-right').value)].sort((a,b)=>a-b);
          if(!numbers[0]||numbers[0]===numbers[1])throw new Error('Choose two different saved revisions.');
          if(!root.confirm('Save these revisions as an example of your own editing style? They stay private unless you explicitly send them to Qwen.'))return;
          await this.request('/api/scholar/style-examples','POST',{document_id:history.id,before_revision:numbers[0],after_revision:numbers[1],confirmed:true});
          const result=await this.request('/api/scholar/style-examples');if(this.profile()?.id!==profile.id)return;
          this.examples=result.examples||[];this.render();this.status('Private style example saved.');
        }catch(e){this.status(e.message);}};
        if(history.next_before)$('#workspace-history-older').onclick=async()=>{try{
          const uid=profile.id,result=await this.request('/api/scholar/documents/'+encodeURIComponent(history.id)+'/history?before='+history.next_before);
          if(this.profile()?.id!==uid||this.history!==history)return;
          this.history={...history,revisions:[...revisions,...(result.revisions||[])],next_before:result.next_before};this.render();
        }catch(e){this.status(e.message);}};
      }
      $('#workspace-share').onclick=async()=>{try{const id=selected($('#workspace-review-kind').value);if(!id)throw new Error('Choose a document.');
        await this.flush(id);const doc=this.document(id);await this.request('/api/scholar/reviews','POST',{document_id:id,revision:doc.revision,reviewer_id:$('#workspace-reviewer').value.trim()});
        this.reviews=(await this.request('/api/scholar/reviews')).reviews||[];this.render();this.status('Revision shared privately.');}catch(e){this.status(e.message);}};
      container.querySelectorAll('.workspace-decision').forEach(button=>{button.onclick=async()=>{try{
        const id=button.dataset.id,reasoning=$(`#workspace-review-${CSS.escape(id)}`).value;
        const rubric={argument:$(`#workspace-review-argument-${CSS.escape(id)}`).value,evidence:$(`#workspace-review-evidence-${CSS.escape(id)}`).value,
          suggestions:$(`#workspace-review-suggestions-${CSS.escape(id)}`).value};
        const ai_consent=$(`#workspace-review-ai-${CSS.escape(id)}`).checked;
        await this.request('/api/scholar/reviews/'+encodeURIComponent(id)+'/decision','POST',{decision:button.dataset.decision,reasoning,rubric,ai_consent});
        this.reviews=(await this.request('/api/scholar/reviews')).reviews||[];this.render();this.status('Review saved.');}catch(e){this.status(e.message);}};});
      container.querySelectorAll('.workspace-review-consent').forEach(button=>{button.onclick=async()=>{try{
        await this.request('/api/scholar/reviews/'+encodeURIComponent(button.dataset.id)+'/ai-consent','POST',{allow:button.dataset.allow==='true'});
        this.reviews=(await this.request('/api/scholar/reviews')).reviews||[];if(this.profile()?.id!==profile.id)return;
        this.render();this.status('Reviewer permission updated.');}catch(e){this.status(e.message);}};});
      container.querySelectorAll('.workspace-style-delete').forEach(button=>{button.onclick=async()=>{try{
        if(!root.confirm('Remove this private style example from future drafting?'))return;
        await this.request('/api/scholar/style-examples/'+encodeURIComponent(button.dataset.id),'DELETE');
        this.examples=(await this.request('/api/scholar/style-examples')).examples||[];if(this.profile()?.id!==profile.id)return;
        this.render();this.status('Style example removed.');}catch(e){this.status(e.message);}};});
      const loadThread=async id=>{let offset=0,messages=[];do{
        const page=await this.request('/api/scholar/reviews/'+encodeURIComponent(id)+'/messages?offset='+offset);
        messages.push(...(page.messages||[]));const next=page.next_offset;offset=Number.isSafeInteger(next)&&next>offset?next:null;
      }while(offset!==null);if(this.profile()?.id!==profile.id)return;
        this.discussions.set(id,messages);this.render();};
      container.querySelectorAll('.workspace-thread-load').forEach(button=>{button.onclick=async()=>{try{await loadThread(button.dataset.id);}
        catch(e){this.status(e.message);}};});
      container.querySelectorAll('.workspace-thread-send').forEach(button=>{button.onclick=async()=>{try{
        const id=button.dataset.id,text=$(`#workspace-message-${CSS.escape(id)}`).value;
        await this.request('/api/scholar/reviews/'+encodeURIComponent(id)+'/messages','POST',{text});
        await loadThread(id);this.status('Private reply saved.');}catch(e){this.status(e.message);}};});
      $('#workspace-sign').onclick=async()=>{try{const id=selected($('#workspace-sign-kind').value);if(!id)throw new Error('Choose a document.');
        await this.flush(id);const doc=this.document(id),result=await this.request('/api/scholar/signoffs','POST',
          {document_id:id,revision:doc.revision,rights:$('#workspace-rights').value,confirmed:true});
        this.signoffs.set(id,result);this.status('Privately signed off revision '+doc.revision+' · '+result.snapshot_sha256.slice(0,12));}catch(e){this.status(e.message);}};
      $('#workspace-submit').onclick=async()=>{
        const id=selected($('#workspace-sign-kind').value),approval=this.signoffs.get(id);
        if(!approval)return this.status('Sign off the current saved revision first.');
        if(!root.confirm('Submit this signed version? Its text may become public on a Git branch. Confirm that you have authority to share it under your selected rights statement.'))return;
        try{const result=await this.request('/api/scholar/submit','POST',{signoff_id:approval.id,confirm_submission:true});
          this.status(result.message+(result.branch?' · '+result.branch:'')+(result.commit?' · '+result.commit.slice(0,12):''));}catch(e){this.status(e.message);}
      };
    }
  }
  root.ScholarWorkspace=ScholarWorkspace;
})(globalThis);
