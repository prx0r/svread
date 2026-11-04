const test=require('node:test');const assert=require('node:assert/strict');const path=require('node:path');
let chromium;try{({chromium}=require('playwright'));}catch{}
const executable=process.env.SCHOLAR_BROWSER_EXECUTABLE,ipvv=process.env.SCHOLAR_WORKER_ROOT;
test('Pushing Lab: real browser, local Scholar Worker, private branch and essay',
 {skip:!chromium||!executable||!ipvv},async()=>{
  const fs=require('node:fs'),http=require('node:http'),{DatabaseSync}=require('node:sqlite');const root=path.join(__dirname,'..');
  const source=fs.readFileSync(path.join(ipvv,'worker/src/scholar-workspace.js'),'utf8');
  const moduleUrl=`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
  const index=fs.readFileSync(path.join(ipvv,'worker/src/index.js'),'utf8').replace("'./scholar-workspace.js'",JSON.stringify(moduleUrl));
  const worker=(await import(`data:text/javascript;base64,${Buffer.from(index).toString('base64')}`)).default;
  const db=new DatabaseSync(':memory:');db.exec(fs.readFileSync(path.join(ipvv,'worker/schema.sql'),'utf8'));
  const DB={prepare(sql){return {bind(...args){return {first:async()=>db.prepare(sql).get(...args)||null,
    all:async()=>({results:db.prepare(sql).all(...args)}),run:async()=>({meta:{changes:Number(db.prepare(sql).run(...args).changes)}})};}};}};
  const env={DB,SESSION_SECRET:'s'.repeat(32),SCHOLAR_DASHSCOPE_API_KEY:'mock',SCHOLAR_QWEN_FREE_TIER_CONFIRMED:'true',SCHOLAR_QWEN_DAILY_ACCOUNT_LIMIT:'5',SCHOLAR_QWEN_DAILY_GLOBAL_LIMIT:'10'};
  const call=(url,method='GET',data,cookie)=>worker.fetch(new Request('https://worker.example'+url,{method,headers:{Origin:'https://svread.pages.dev',...(data?{'Content-Type':'application/json'}:{}),...(cookie?{Cookie:cookie}:{})},...(data?{body:JSON.stringify(data)}:{})}),env);
  async function login(email){const r=await call('/api/auth/access','POST',{email,password:'strong-password',name:email.split('@')[0]});return {cookie:r.headers.get('Set-Cookie').split(';')[0],profile:(await r.json()).profile};}
  const alice=await login('alice@example.org'),bob=await login('bob@example.org');
  const projection=JSON.parse(fs.readFileSync(path.join(root,'data/scholar/paramarthasara.json'),'utf8'));
  const oldFetch=globalThis.fetch;let prompt='',modelCalls=0;globalThis.fetch=async(url,options)=>{
    if(String(url).includes('/data/scholar/paramarthasara.json'))return Response.json(projection);
    if(String(url).includes('dashscope')){prompt=JSON.parse(options.body).messages[0].content;modelCalls++;return Response.json({choices:[{message:{content:'Proposed crux: why must it follow?'}}]});}return oldFetch(url,options);};
  const site=http.createServer((req,res)=>{const rel=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\/+/, '')||'index.html',name=path.resolve(root,rel);
    if(!name.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
    fs.readFile(name,(err,data)=>{if(err){res.writeHead(404);return res.end();}const ext=path.extname(name);res.writeHead(200,{'Content-Type':{'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css'}[ext]||'application/octet-stream'});res.end(data);});});
  await new Promise(resolve=>site.listen(0,'127.0.0.1',resolve));const origin=`http://127.0.0.1:${site.address().port}`;env.CORS_ORIGIN=origin;
  const api=http.createServer(async(req,res)=>{try{const chunks=[];for await(const chunk of req)chunks.push(chunk);const raw=Buffer.concat(chunks);
    const url=`http://127.0.0.1:${api.address().port}${req.url}`,options={method:req.method,headers:req.headers,...(raw.length?{body:raw,duplex:'half'}:{})};
    const response=await worker.fetch(new Request(url,options),env);res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));
  }catch(e){res.writeHead(500);res.end('local worker adapter failed');}});
  await new Promise(resolve=>api.listen(0,'127.0.0.1',resolve));const apiOrigin=`http://127.0.0.1:${api.address().port}`;let browser,page;
  try{
    browser=await chromium.launch({executablePath:executable,args:['--no-sandbox','--disable-gpu'],headless:true});page=await browser.newPage();page.setDefaultTimeout(6000);const errors=[];
    let approveDialogs=true;page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>approveDialogs?d.accept():d.dismiss());
    await page.context().addCookies([{name:'svsess',value:alice.cookie.slice('svsess='.length),url:apiOrigin}]);
    await page.goto(origin+'/pushing.html?api='+encodeURIComponent(apiOrigin));await page.locator('#add-seed').click();
    await page.locator('#transcript').fill('Me: What is missing?\nQwen: A possible inference.');await page.locator('#parse').click();
    await page.locator('.turn').first().getByRole('button',{name:'Add to tree'}).click();
    await page.locator('#node-type').selectOption('crux');await page.locator('#node-text').fill('Where is the actual proof?');await page.locator('#add-node').click();
    await page.locator('#node-text').fill('PRIVATE UNSELECTED BRANCH <img src=x onerror="window.broken=true">');await page.locator('#add-root').click();
    await page.locator('.node').filter({hasText:'Where is the actual proof?'}).getByRole('button',{name:'Select'}).click();
    await page.waitForSelector('#work option[value="paramarthasara"]',{state:'attached'});await page.locator('#work').selectOption('paramarthasara');
    await page.waitForSelector('#target option[value="param-p01-v01"]',{state:'attached'});await page.locator('#target').selectOption('param-p01-v01');
    await page.waitForFunction(()=>!document.querySelector('#attach-source').disabled);assert.match(await page.locator('#source').textContent(),/paraṃ/);
    await page.locator('#attach-source').click();assert.match(await page.getByText('Open passage in Scholar ↗').getAttribute('href'),/paramarthasara/);approveDialogs=false;const declined=page.waitForEvent('dialog');await page.locator('#ask').click();await declined;assert.equal(modelCalls,0);approveDialogs=true;await page.locator('#ask').click();await page.waitForFunction(()=>document.querySelector('#agent-output').value.includes('Proposed crux'));
    assert.match(prompt,/Where is the actual proof/);assert.doesNotMatch(prompt,/PRIVATE UNSELECTED BRANCH/);assert.equal(modelCalls,1);
    const before=await page.locator('.node').count();await page.locator('#add-agent').click();assert.equal(await page.locator('.node').count(),before+1);
    assert.equal(await page.locator('.node img').count(),0);assert.equal(await page.evaluate(()=>window.broken),undefined);
    await page.locator('#essay-preview').click();await page.locator('#save-essay').click();await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('Private essay draft saved'));
    let docs=(await (await call('/api/scholar/documents?work=paramarthasara','GET',undefined,alice.cookie)).json()).documents;
    const essay=docs.find(d=>d.kind==='essay');assert.ok(essay);assert.equal(essay.content.assisted,true);assert.match(essay.content.text,/Where is the actual proof/);
    await page.locator('#save-account').click();await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('snapshot saved to Scholar'));
    docs=(await (await call('/api/scholar/documents?work=paramarthasara','GET',undefined,alice.cookie)).json()).documents;assert.ok(docs.find(d=>d.kind==='conversation'));
    await page.locator('#list-account').click();await page.waitForSelector('#account-enquiries option[value="0"]',{state:'attached'});await page.locator('#account-enquiries').selectOption('0');await page.locator('#open-account').click();await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('snapshot opened'));assert.ok((await page.locator('.node').count())>0);
    await page.locator('summary').filter({hasText:'Bring an excerpt'}).click();await page.locator('#load-essays').click();await page.waitForSelector('#scholar-essays option[value="0"]',{state:'attached'});
    await page.locator('#scholar-essays').selectOption('0');await page.waitForFunction(()=>document.querySelector('#scholar-excerpt').value.length>0);
    await page.locator('#scholar-excerpt').evaluate(x=>{x.focus();x.setSelectionRange(0,20);});await page.locator('#add-essay-excerpt').click();
    await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('Excerpt added'));
    const stored=JSON.parse(await page.evaluate(()=>localStorage.getItem('svv-pushing-lab/1'))),ref=stored.nodes.at(-1).private_ref;
    assert.equal(ref.owner_id,alice.profile.id);assert.equal(ref.document_id,essay.id);assert.equal(ref.revision,essay.revision);
    await page.context().clearCookies();await page.context().addCookies([{name:'svsess',value:bob.cookie.slice('svsess='.length),url:apiOrigin}]);await page.locator('#ask').click();await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('different Scholar account'));assert.equal(modelCalls,1);
    await page.reload();await page.waitForFunction(()=>document.querySelectorAll('.node').length>0);assert.equal(await page.locator('.node img').count(),0);await page.locator('#work').selectOption('ghatakarpara');await page.waitForFunction(()=>document.querySelector('#source').textContent.includes('No available source'));assert.equal(await page.locator('#attach-source').isDisabled(),true);assert.deepEqual(errors,[]);
  }catch(e){if(page)console.error('Pushing test status:',await page.locator('#status').textContent().catch(()=>''));throw e;}finally{if(browser)await browser.close();await new Promise(resolve=>api.close(resolve));await new Promise(resolve=>site.close(resolve));globalThis.fetch=oldFetch;db.close();}
});
