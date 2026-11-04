const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const {webcrypto,createHash}=require('node:crypto');

const app=fs.readFileSync(path.join(__dirname,'../app.js'),'utf8');
function harness(fetch){
  const context=vm.createContext({fetch,URL,URLSearchParams,TextEncoder,TextDecoder,Response,crypto:webcrypto,
    location:{search:'?work=testwork',href:'https://svread.pages.dev/?work=testwork'},window:{},
    localStorage:{getItem:()=>null,setItem(){}},document:{querySelector:()=>null}});
  const source=app.replace('main();\n})();',`globalThis.readerTest={safeReaderVerse,isReaderPass,verseText,readUrlFor,saWords,IAST_DEVA,esc,loadL0,getReaderData,
    setData:value=>{DATA=value;},setKaraoke:value=>{KAR=value;},getL0:()=>L0};\n})();`);
  assert.notEqual(source,app);vm.runInContext(source,context);return context.readerTest;
}

test('reader fingerprints the exact response bytes, including formatting',async()=>{
  const bytes='{\n  "work": "testwork"\n}\n';
  const reader=harness(async()=>new Response(bytes,{headers:{'Content-Type':'application/json'}}));
  const result=await reader.getReaderData('data/testwork.json');
  assert.equal(result.data.work,'testwork');assert.equal(result.sha256,createHash('sha256').update(bytes).digest('hex'));
});

test('blocked English is removed from every exported row and cannot reach audio',async()=>{
  let calls=0;const reader=harness(async()=>{calls++;return Response.json({url:'https://audio.example/a.mp3'});});
  const raw={id:'p-v01',sa:'śivaḥ',gate:'BLOCKED',l1:'secret l1',l2:'secret l2',l3:'secret l3',l4:'secret l4',c1:'secret c1',argmap:'secret map',extra:'secret'};
  const safe=reader.safeReaderVerse(raw);
  assert.equal(safe.sa,'śivaḥ');assert.doesNotMatch(JSON.stringify(safe),/secret/);
  assert.equal(reader.isReaderPass({gate:'PASS',l1:'   ',l2:''}),false);
  assert.match(reader.verseText(safe,'l2','L',0),/English withheld/);
  await assert.rejects(reader.readUrlFor(raw,'en'),/withheld/);assert.equal(calls,0);
  const pass={id:'p-v02',sa:'śivaḥ',gate:'PASS',l2:'A public reading'};
  assert.match(reader.verseText(pass,'l4','R',1),/showing English translation \(L2\)/);
  assert.match(reader.verseText(pass,'l4','R',1),/A public reading/);
  reader.setData({verses:[raw,pass]});
  await assert.rejects(reader.readUrlFor(pass,'c1'),/no english/);assert.equal(calls,0);
  assert.equal(await reader.readUrlFor(pass,'en'),'https://audio.example/a.mp3');assert.equal(calls,1);
});

test('offline word glosses cannot expose a blocked or unknown passage',async()=>{
  const reader=harness(async()=>Response.json({verses:[{id:'p-v01',tokens:[{gloss:'private gloss'}]},
    {id:'p-v02',tokens:[{gloss:'public gloss'}]},{id:'unknown',tokens:[{gloss:'unknown gloss'}]}]}));
  reader.setData({verses:[{id:'p-v01',gate:'BLOCKED',l2:'not public'}, {id:'p-v02',gate:'PASS',l2:'public'}]});
  await reader.loadL0();assert.equal(reader.getL0()['p-v01'],undefined);assert.equal(reader.getL0().unknown,undefined);
  assert.equal(reader.getL0()['p-v02'][0].gloss,'public gloss');
});

test('Sanskrit rendering preserves source words and punctuation when timings differ',()=>{
  const reader=harness(async()=>Response.json({})),v={id:'p-v01',n:1,sa:'śivaḥ [lacuna] [ku] | dīKṣā ca ||'};
  let html=reader.saWords(v,true,0);assert.match(html,/śivaḥ/);assert.match(html,/dīKṣā/);assert.match(html,/\|/);
  assert.match(html,/\[lacuna\]/);assert.match(html,/\[ku\]/);
  assert.match(reader.saWords(v,false,0),/\[lacuna\]/);
  reader.setKaraoke({words:[[{r:'other',t0:0,t1:1}]]});html=reader.saWords(v,true,0);
  assert.match(html,/dīKṣā/);assert.doesNotMatch(html,/>other</);
  assert.equal(reader.IAST_DEVA.convert('ṝ'),'ॠ');assert.equal(reader.IAST_DEVA.convert('ḷ'),'ऌ');
  assert.equal(reader.IAST_DEVA.convert('r\u0323\u0304'),'ॠ');
  assert.match(reader.esc('" onmouseover="x'),/&quot;/);
});

test('source fallback keeps all paragraphs and rejects a 200 HTML fallback',async()=>{
  const run=async source=>{
    const fakeFetch=async url=>{
      if(String(url).endsWith('data/works-index.json'))return Response.json({one:{work:'testwork',title:'Test',sanskrit:'test.txt'}});
      if(String(url).endsWith('/data/sanskrit/test.txt'))return new Response(source,{headers:{'Content-Type':'text/plain'}});
      return new Response('',{status:404});
    };
    const nodes=new Map(),node=selector=>{if(selector==='#navscholar')return null;
      if(!nodes.has(selector))nodes.set(selector,{innerHTML:''});return nodes.get(selector);};
    const context=vm.createContext({fetch:fakeFetch,URL,URLSearchParams,Response,
      location:{search:'?work=testwork',href:'https://svread.pages.dev/?work=testwork'},window:{},
      localStorage:{getItem:()=>null,setItem(){}},document:{querySelector:node}});
    const sourceCode=app.replace('DATA.verses.forEach((v,i)=>{ v.n = i+1; });','globalThis.loaded=DATA; return;')
      .replace('main();\n})();','globalThis.start=main;\n})();');
    vm.runInContext(sourceCode,context);await context.start();return context;
  };
  const data=await run(Array.from({length:81},(_,i)=>`verse ${i+1}`).join('\n\n'));
  assert.equal(data.loaded.verses.length,81);assert.equal(data.loaded.verses[80].sa,'verse 81');
  const html=await run('<!DOCTYPE html><html><body>Missing page</body></html>');assert.equal(html.loaded,undefined);
});
