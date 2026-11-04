const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {spawnSync}=require('node:child_process');

test('release check detects changed assets and refuses an invalid Scholar projection',()=>{
  const root=path.join(__dirname,'..'),tmp=fs.mkdtempSync(path.join(os.tmpdir(),'svread-release-'));
  try{
    for(const name of ['index.html','app.js','styles.css','sw.js','manifest.webmanifest','README.md','SPEC.md','READER-ARCHITECTURE.md','data','align','scripts'])
      fs.cpSync(path.join(root,name),path.join(tmp,name),{recursive:true});
    const check=(...args)=>spawnSync('python3',[path.join(tmp,'scripts/release_manifest.py'),...args],{cwd:tmp,encoding:'utf8'});
    let result=check();assert.equal(result.status,0,result.stderr);
    fs.appendFileSync(path.join(tmp,'data/bhairavastava.json'),' ');
    result=check();assert.notEqual(result.status,0);assert.match(result.stderr,/manifest.*stale/);
    const index=path.join(tmp,'data/scholar/index.json'),originalIndex=fs.readFileSync(index,'utf8');
    const catalogue=JSON.parse(originalIndex);catalogue.paramarthasara.versions=999;fs.writeFileSync(index,JSON.stringify(catalogue));
    result=check('--write');assert.notEqual(result.status,0);assert.match(result.stderr,/index metadata/);
    fs.writeFileSync(index,originalIndex);
    const projection=path.join(tmp,'data/scholar/paramarthasara.json');
    const doc=JSON.parse(fs.readFileSync(projection,'utf8'));doc.source_edition='Altered edition';
    fs.writeFileSync(projection,JSON.stringify(doc));
    result=check('--write');assert.notEqual(result.status,0);assert.match(result.stderr,/projection hash/);
  }finally{fs.rmSync(tmp,{recursive:true,force:true});}
});
