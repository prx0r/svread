const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');

test('account requests bypass the shared offline cache',async()=>{
  const handlers={},calls=[];
  const context=vm.createContext({URL,
    self:{location:{origin:'https://svread.pages.dev'},addEventListener:(name,fn)=>{handlers[name]=fn;}},
    caches:{match:async()=>{calls.push('match');return null;},open:async()=>({put:async()=>calls.push('put')})},
    fetch:async request=>{calls.push('fetch:'+request.url);return {ok:true,headers:{get:()=>null},clone(){return this;}};}});
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../sw.js'),'utf8'),context);
  let result;
  handlers.fetch({request:{url:'https://ipvv-api.tradesprior.workers.dev/api/auth/me',method:'GET'},respondWith:p=>{result=p;}});
  await result;assert.equal(calls.length,1);assert.match(calls[0],/^fetch:/);
  calls.length=0;
  handlers.fetch({request:{url:'https://svread.pages.dev/api/scholar/documents',method:'GET'},respondWith:p=>{result=p;}});
  await result;assert.equal(calls.length,1);assert.match(calls[0],/^fetch:/);
});

test('offline fallback returns the HTML shell only for navigation',async()=>{
  const handlers={},shell={marker:'shell'};
  const context=vm.createContext({URL,Response,
    self:{location:{origin:'https://svread.pages.dev'},addEventListener:(name,fn)=>{handlers[name]=fn;}},
    caches:{match:async key=>key==='./index.html'?shell:null,open:async()=>({put:async()=>{}})},
    fetch:async()=>{throw new Error('offline');}});
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../sw.js'),'utf8'),context);
  let result;
  handlers.fetch({request:{url:'https://svread.pages.dev/data/work.json',method:'GET',mode:'cors'},respondWith:p=>{result=p;}});
  assert.equal((await result).type,'error');
  handlers.fetch({request:{url:'https://svread.pages.dev/?work=x',method:'GET',mode:'navigate'},respondWith:p=>{result=p;}});
  assert.equal(await result,shell);
});
