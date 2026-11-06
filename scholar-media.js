/* Create an exact, local-only Scholar publication packet. No network calls. */
(function(root){
  'use strict';
  function canonical(value){
    if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';
    if(value&&typeof value==='object')return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}';
    return JSON.stringify(value);
  }
  async function sha(text){
    if(!root.crypto?.subtle)throw new Error('A secure browser with SHA-256 is required.');
    const digest=await root.crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));
    return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');
  }
  async function createPacket(doc,profile){
    if(!doc||doc.kind!=='essay'||!doc.id||!Number.isSafeInteger(doc.revision)||doc.revision<1||
       typeof doc.content?.text!=='string'||!doc.content.text.trim())throw new Error('Save a non-empty essay first.');
    if(!profile?.id)throw new Error('Sign in to prepare your essay.');
    const snapshot=JSON.parse(JSON.stringify({kind:doc.kind,work:doc.work,target:doc.target,layer:doc.layer,title:doc.title,content:doc.content}));
    const packet={format:'scholar-media/1',status:'private-draft',
      origin:{type:'scholar',document_id:doc.id,revision:doc.revision,author:profile.display_name||''},
      snapshot,snapshot_sha256:await sha(canonical(snapshot)),text_sha256:await sha(snapshot.content.text)};
    return packet;
  }
  function download(packet){
    const blob=new Blob([JSON.stringify(packet,null,2)+'\n'],{type:'application/json'});
    const url=root.URL.createObjectURL(blob),link=root.document.createElement('a');
    const name=(packet.snapshot.title||'essay').replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'').slice(0,60)||'essay';
    link.href=url;link.download=`${name}-r${packet.origin.revision}-media.json`;link.click();
    setTimeout(()=>root.URL.revokeObjectURL(url),1000);
  }
  root.ScholarMedia={canonical,createPacket,download};
})(globalThis);
