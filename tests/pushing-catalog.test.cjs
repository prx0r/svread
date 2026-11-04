const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
test('archive catalogue identifies safe pinned files and does not turn prior enquiries into source proof',()=>{
 const catalog=JSON.parse(fs.readFileSync(path.join(__dirname,'../data/pushing-catalog.json'),'utf8'));
 assert.equal(catalog.format,'svread-pushing-catalog/1');assert.match(catalog.revision,/^[a-f0-9]{40}$/);assert.ok(catalog.records.length>=50);
 const seen=new Set();for(const row of catalog.records){assert.match(row.file,/^[A-Za-z0-9_./-]+\.md$/);assert.ok(!row.file.split('/').includes('..'));assert.match(row.git_blob,/^[a-f0-9]{40}$/);assert.ok(row.question);assert.ok(!seen.has(row.file));seen.add(row.file);}
});
