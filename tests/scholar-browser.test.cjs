const test=require('node:test');
const assert=require('node:assert/strict');
const {spawn}=require('node:child_process');
const path=require('node:path');
let chromium;try{({chromium}=require('playwright'));}catch{}
const executable=process.env.SCHOLAR_BROWSER_EXECUTABLE;

test('browser Scholar workflow saves decisions, sources, citations and review selections',
  {skip:!chromium||!executable},async()=>{
  const http=require('node:http'),fs=require('node:fs');const root=path.join(__dirname,'..');
  const site=http.createServer((req,res)=>{const relative=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\/+/, '')||'index.html';
    const name=path.resolve(root,relative);if(!name.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
    fs.readFile(name,(err,data)=>{if(err){res.writeHead(404);return res.end();}
      const ext=path.extname(name),type={'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.webmanifest':'application/manifest+json'}[ext]||'application/octet-stream';
      res.writeHead(200,{'Content-Type':type});res.end(data);});});
  await new Promise(resolve=>site.listen(0,'127.0.0.1',resolve));let browser;
  const origin=`http://127.0.0.1:${site.address().port}`,docs=new Map(),calls=[];
  let decisions=[],sources=[],annotations=[];const review={id:'review:one',owner_id:'alice',reviewer_id:'bob',work:'paramarthasara',document_id:'essay:one',revision:1,
    snapshot_sha256:'a'.repeat(64),snapshot:{content:{text:'Śiva is free'}},decision:null};
  try{
    browser=await chromium.launch({executablePath:executable,args:['--no-sandbox','--disable-gpu'],headless:true});
    const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',dialog=>dialog.accept());
    await page.route('https://ipvv-api.tradesprior.workers.dev/**',async route=>{
      const req=route.request(),u=new URL(req.url()),method=req.method(),body=req.postDataJSON(),routePath=decodeURIComponent(u.pathname);calls.push({path:routePath,method,body});
      let data,status=200;
      if(routePath==='/api/auth/me')data={profile:{id:'alice',display_name:'Alice'}};
      else if(routePath==='/api/scholar/documents'&&method==='GET')data={documents:[...docs.values()],next_offset:null};
      else if(routePath.startsWith('/api/scholar/documents/')&&method==='PUT'){
        const id=decodeURIComponent(routePath.split('/').pop()),prior=docs.get(id),{expected_revision,...rest}=body;
        if(expected_revision!==(prior?.revision||0)){status=409;data={error:'Conflict'};}else{const doc={...rest,revision:expected_revision+1};docs.set(id,doc);data={document:doc};}}
      else if(routePath==='/api/scholar/reviews'&&method==='GET')data={reviews:[review]};
      else if(routePath==='/api/scholar/style-examples')data={examples:[]};
      else if(routePath==='/api/scholar/decisions'){
        if(method==='POST')decisions=[{id:'decision:one',work:'paramarthasara',target:'param-p01-v01',revision:body.revision,subject:body.subject,before_text:body.before,after_text:body.after,reason:body.reason}];data={decisions};}
      else if(routePath==='/api/scholar/sources'){
        if(method==='POST')sources=[{id:'source:one',...body,projection_sha256:'b'.repeat(64)}];data={sources};}
      else if(routePath==='/api/scholar/source-links')data={links:[]};
      else if(routePath==='/api/scholar/citations/prepare')data={citations:[{work:'paramarthasara',target:'param-p01-v01',projection_sha256:'b'.repeat(64),t1_sha256:'c'.repeat(64)}]};
      else if(routePath==='/api/scholar/assist')data={document:{id:'agent:one',revision:1,content:{text:'Agent draft',task:'essay',model:'mock'}},message:'Draft saved privately.'};
      else if(routePath==='/api/scholar/reviews/review:one/annotations'){
        if(method==='POST')annotations=[{author_id:'alice',...body}];data={annotations};}
      else{status=404;data={error:'Unknown mock endpoint'};}
      await route.fulfill({status,contentType:'application/json',headers:{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Credentials':'true'},body:JSON.stringify(data)});
    });
    await page.goto(origin+'/?work=paramarthasara&view=scholar');await page.locator('#schworkspace').waitFor();
    await page.locator('#schta').fill('A human translation');
    await page.getByText(/My translation decisions/).click();
    await page.locator('#workspace-decision-subject').fill('svātantrya');await page.locator('#workspace-decision-before').fill('freedom');
    await page.locator('#workspace-decision-after').fill('sovereignty');await page.locator('#workspace-decision-reason').fill('Agency');
    await page.locator('#workspace-decision-save').click();await page.getByText(/My translation decisions \(1\)/).waitFor();
    await page.getByText(/My source notebook/).click();await page.locator('#workspace-source-note').fill('Private source note');await page.locator('#workspace-source-save').click();
    await page.getByText(/My source notebook \(1\)/).waitFor();
    await page.locator('summary').filter({hasText:'Essay'}).first().click();await page.locator('#workspace-new').click();
    await page.locator('summary').filter({hasText:'Essay'}).first().click();await page.locator('#workspace-title').fill('My essay');await page.locator('#workspace-text').fill('An argument');
    await page.locator('summary').filter({hasText:'Ask Qwen'}).click();await page.locator('.workspace-source-choice').check();await page.locator('#workspace-cite-sources').click();
    await page.waitForFunction(()=>document.querySelector('#schworkspace')?.textContent.includes('Passage references that will be included')); 
    const essay=[...docs.values()].find(d=>d.kind==='essay');assert.equal(essay.content.citations[0].target,'param-p01-v01');assert.doesNotMatch(JSON.stringify(essay),/Private source note/);
    await page.locator('summary').filter({hasText:'Ask Qwen'}).click();await page.locator('#workspace-task').selectOption('essay');await page.locator('#workspace-style').check();
    await page.locator('.workspace-decision-choice').check();await page.locator('.workspace-source-choice').check();await page.locator('#workspace-ask').click();
    await page.waitForFunction(()=>document.querySelector('#workspace-output')?.textContent.includes('Agent draft'));
    const ai=calls.find(c=>c.path==='/api/scholar/assist');assert.deepEqual(ai.body.decision_ids,['decision:one']);assert.deepEqual(ai.body.source_ids,['source:one']);assert.equal(ai.body.consent_to_ai,true);
    await page.locator('summary').filter({hasText:'Peer review'}).click();await page.locator('[id="workspace-annotation-review:one"]').fill('Check the term');
    await page.evaluate(()=>{const pre=document.getElementById('workspace-review-snapshot-review:one'),r=document.createRange();r.setStart(pre.firstChild,0);r.setEnd(pre.firstChild,4);const s=window.getSelection();s.removeAllRanges();s.addRange(r);});
    await page.locator('.workspace-annotation-add').click();await page.waitForFunction(()=>document.querySelector('#schmsg')?.textContent.includes('Comment saved'));
    assert.equal(annotations[0].quote,'Śiva');assert.equal(annotations[0].start,0);assert.equal(annotations[0].end,4);assert.deepEqual(errors,[]);
  }finally{if(browser)await browser.close();await new Promise(resolve=>site.close(resolve));}
});

test('browser → real local Worker → saved citations and exact review selection',
  {skip:!chromium||!executable||!process.env.SCHOLAR_WORKER_ROOT},async()=>{
  const fs=require('node:fs'),http=require('node:http'),{DatabaseSync}=require('node:sqlite');
  const root=path.join(__dirname,'..'),ipvv=process.env.SCHOLAR_WORKER_ROOT;
  const source=fs.readFileSync(path.join(ipvv,'worker/src/scholar-workspace.js'),'utf8');
  const moduleUrl=`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
  const index=fs.readFileSync(path.join(ipvv,'worker/src/index.js'),'utf8').replace("'./scholar-workspace.js'",JSON.stringify(moduleUrl));
  const worker=(await import(`data:text/javascript;base64,${Buffer.from(index).toString('base64')}`)).default;
  const db=new DatabaseSync(':memory:');db.exec(fs.readFileSync(path.join(ipvv,'worker/schema.sql'),'utf8'));
  const DB={prepare(sql){return {bind(...args){return {first:async()=>db.prepare(sql).get(...args)||null,
    all:async()=>({results:db.prepare(sql).all(...args)}),run:async()=>({meta:{changes:Number(db.prepare(sql).run(...args).changes)}})};}};}};
  const env={DB,SESSION_SECRET:'s'.repeat(32),SCHOLAR_DASHSCOPE_API_KEY:'mock',SCHOLAR_QWEN_FREE_TIER_CONFIRMED:'true',
    SCHOLAR_QWEN_DAILY_ACCOUNT_LIMIT:'5',SCHOLAR_QWEN_DAILY_GLOBAL_LIMIT:'10'};
  const call=(url,method='GET',data,cookie)=>worker.fetch(new Request('https://worker.example'+url,{method,
    headers:{Origin:'https://svread.pages.dev',...(data?{'Content-Type':'application/json'}:{}),...(cookie?{Cookie:cookie}:{})},...(data?{body:JSON.stringify(data)}:{})}),env);
  async function login(email){const r=await call('/api/auth/access','POST',{email,password:'strong-password',name:email.split('@')[0]});
    return {cookie:r.headers.get('Set-Cookie').split(';')[0],profile:(await r.json()).profile};}
  const alice=await login('alice@example.org'),bob=await login('bob@example.org');
  const essay={expected_revision:0,kind:'essay',work:'paramarthasara',target:'param-p01-v01',layer:'l3',title:'Essay',content:{text:'Śiva is free'}};
  assert.equal((await call('/api/scholar/documents/'+encodeURIComponent('essay:one'),'PUT',essay,alice.cookie)).status,200);
  const reviewResponse=await call('/api/scholar/reviews','POST',{document_id:'essay:one',revision:1,reviewer_id:bob.profile.id},alice.cookie);
  const review=await reviewResponse.json();assert.equal(reviewResponse.status,201);
  const projection=JSON.parse(fs.readFileSync(path.join(root,'data/scholar/paramarthasara.json'),'utf8'));
  const oldFetch=globalThis.fetch;let modelPrompt='';globalThis.fetch=async(url,options)=>{
    if(String(url).includes('/data/scholar/paramarthasara.json'))return Response.json(projection);
    if(String(url).includes('dashscope')){modelPrompt=JSON.parse(options.body).messages[0].content;return Response.json({choices:[{message:{content:'Grounded agent essay.'}}]});}
    return oldFetch(url,options);
  };
  const site=http.createServer((req,res)=>{const rel=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\/+/, '')||'index.html',name=path.resolve(root,rel);
    if(!name.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
    fs.readFile(name,(err,data)=>{if(err){res.writeHead(404);return res.end();}const ext=path.extname(name);
      res.writeHead(200,{'Content-Type':{'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.webmanifest':'application/manifest+json'}[ext]||'application/octet-stream'});res.end(data);});});
  await new Promise(resolve=>site.listen(0,'127.0.0.1',resolve));const origin=`http://127.0.0.1:${site.address().port}`;let browser;
  try{
    browser=await chromium.launch({executablePath:executable,args:['--no-sandbox','--disable-gpu'],headless:true});
    const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
    await page.route('https://ipvv-api.tradesprior.workers.dev/**',async route=>{const req=route.request(),method=req.method(),body=req.postData();
      const headers={Origin:'https://svread.pages.dev',Cookie:alice.cookie,...(body?{'Content-Type':'application/json'}:{})};
      const response=await worker.fetch(new Request(req.url(),{method,headers,...(body?{body}:{})}),env);
      const responseHeaders=Object.fromEntries(response.headers);responseHeaders['access-control-allow-origin']=origin;responseHeaders['access-control-allow-credentials']='true';
      await route.fulfill({status:response.status,headers:responseHeaders,body:await response.text()});});
    await page.goto(origin+'/?work=paramarthasara&view=scholar');await page.locator('#schworkspace').waitFor();
    await page.locator('#schta').fill('A human translation');await page.getByText(/My translation decisions/).click();
    await page.locator('#workspace-decision-subject').fill('svātantrya');await page.locator('#workspace-decision-after').fill('sovereignty');await page.locator('#workspace-decision-reason').fill('Agency');
    await page.locator('#workspace-decision-save').click();await page.getByText(/My translation decisions \(1\)/).waitFor();
    await page.getByText(/My source notebook/).click();await page.locator('#workspace-source-note').fill('Private source note');await page.locator('#workspace-source-save').click();await page.getByText(/My source notebook \(1\)/).waitFor();
    await page.locator('summary').filter({hasText:'Ask Qwen'}).click();await page.locator('.workspace-source-choice').check();await page.locator('#workspace-cite-sources').click();
    await page.waitForFunction(()=>document.querySelector('#schworkspace')?.textContent.includes('Passage references that will be included'));
    let docs=await (await call('/api/scholar/documents?work=paramarthasara','GET',undefined,alice.cookie)).json();
    const saved=docs.documents.find(d=>d.id==='essay:one');assert.equal(saved.content.citations.length,1);assert.doesNotMatch(JSON.stringify(saved),/Private source note/);
    await page.locator('summary').filter({hasText:'Ask Qwen'}).click();await page.locator('#workspace-task').selectOption('essay');await page.locator('#workspace-style').check();
    await page.locator('.workspace-decision-choice').check();await page.locator('.workspace-source-choice').check();await page.locator('#workspace-ask').click();
    await page.waitForFunction(()=>document.querySelector('#workspace-output')?.textContent.includes('Grounded agent essay'));assert.match(modelPrompt,/Private source note/);assert.match(modelPrompt,/Agency/);
    await page.locator('summary').filter({hasText:'Peer review'}).click();await page.locator(`[id="workspace-annotation-${review.id}"]`).fill('Check the term');
    await page.evaluate(id=>{const pre=document.getElementById('workspace-review-snapshot-'+id),r=document.createRange();r.setStart(pre.firstChild,0);r.setEnd(pre.firstChild,4);const s=window.getSelection();s.removeAllRanges();s.addRange(r);},review.id);
    await page.locator('.workspace-annotation-add').click();await page.waitForFunction(()=>document.querySelector('#schmsg')?.textContent.includes('Comment saved'));
    const annotationResponse=await call('/api/scholar/reviews/'+encodeURIComponent(review.id)+'/annotations','GET',undefined,alice.cookie);
    const comments=(await annotationResponse.json()).annotations;assert.equal(comments[0].quote,'Śiva');assert.deepEqual(errors,[]);
  }finally{if(browser)await browser.close();await new Promise(resolve=>site.close(resolve));globalThis.fetch=oldFetch;db.close();}
});
