const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const {createHash}=require('node:crypto');

test('release check detects changed assets and refuses an invalid Scholar projection',()=>{
  const root=path.join(__dirname,'..'),tmp=fs.mkdtempSync(path.join(os.tmpdir(),'svread-release-'));
  try{
    for(const name of ['.nojekyll','index.html','app.js','styles.css','sw.js','manifest.webmanifest','README.md','SPEC.md','READER-ARCHITECTURE.md',
      'scholar-voice.js','scholar-workspace-ui.js','SCHOLAR-PRIVACY.md','PUSHING-LAB.md','PUSHING-NEXT.md','PUSHING-RESEARCH.md','pushing.html','pushing.css','pushing-core.js','pushing-ui.js','wheels.html','wheels.js','SANSKRIT-MEMORY-ENGINE-THESIS.md','vendor','data','align','scripts','mcp','claim','work','chain','about','cite',
      'llms.txt','llms-full.txt','ai-catalog.json','sitemap.xml','robots.txt'])
      fs.cpSync(path.join(root,name),path.join(tmp,name),{recursive:true});
    fs.mkdirSync(path.join(tmp,'tools'));
    fs.copyFileSync(path.join(root,'tools/lingua.py'),path.join(tmp,'tools/lingua.py'));
    if(fs.existsSync(path.join(root,'.github')))fs.cpSync(path.join(root,'.github'),path.join(tmp,'.github'),{recursive:true});
    const check=(...args)=>spawnSync('python3',[path.join(tmp,'scripts/release_manifest.py'),...args],{cwd:tmp,encoding:'utf8'});
    let result=check();assert.equal(result.status,0,result.stderr);
    const resolver=path.join(tmp,'tools/lingua.py'),resolverBytes=fs.readFileSync(resolver);
    fs.appendFileSync(resolver,'\n# changed\n');
    result=check();assert.notEqual(result.status,0);assert.match(result.stderr,/manifest.*stale/);
    fs.writeFileSync(resolver,resolverBytes);
    fs.appendFileSync(path.join(tmp,'data/bhairavastava.json'),' ');
    result=check();assert.notEqual(result.status,0);assert.match(result.stderr,/manifest.*stale/);
    const index=path.join(tmp,'data/scholar/index.json'),originalIndex=fs.readFileSync(index,'utf8');
    const catalogue=JSON.parse(originalIndex);catalogue.paramarthasara.versions=999;fs.writeFileSync(index,JSON.stringify(catalogue));
    result=check('--write');assert.notEqual(result.status,0);assert.match(result.stderr,/index metadata/);
    fs.writeFileSync(index,originalIndex);
    const held=path.join(tmp,'data/scholar/ghatakarpara.json'),heldBytes=fs.readFileSync(held,'utf8'),h=JSON.parse(heldBytes);
    const canonical=v=>Array.isArray(v)?'['+v.map(canonical).join(',')+']':v&&typeof v==='object'?'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}':JSON.stringify(v);
    const digest=v=>createHash('sha256').update(canonical(v)).digest('hex');
    h.originals.t1.fake={verse_id:'fake'};h.original_hashes.t1.fake=digest(h.originals.t1.fake);
    delete h.projection_sha256;h.projection_sha256=digest(h);fs.writeFileSync(held,JSON.stringify(h));
    result=check('--write');assert.notEqual(result.status,0);assert.match(result.stderr,/source coverage hold/);
    fs.writeFileSync(held,heldBytes);
    const projection=path.join(tmp,'data/scholar/paramarthasara.json');
    const doc=JSON.parse(fs.readFileSync(projection,'utf8'));doc.source_edition='Altered edition';
    fs.writeFileSync(projection,JSON.stringify(doc));
    result=check('--write');assert.notEqual(result.status,0);assert.match(result.stderr,/projection hash/);
  }finally{fs.rmSync(tmp,{recursive:true,force:true});}
});
