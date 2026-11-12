/* Sanskrit Wheels — framework. Vanilla JS, file:// compatible, no dependencies. */
(function (root) {
  'use strict';
  const families = [];
  function registerFamily(family) {
    if (!family || !family.id || !Array.isArray(family.levels)) throw Error('Invalid wheel family');
    if (families.some(f=>f.id===family.id)) throw Error('Duplicate family '+family.id);
    for (const level of family.levels) {
      if (!/^\d+\.\d+$/.test(level.id) || !Array.isArray(level.rings) || level.rings.length!==5 || typeof level.build!=='function') throw Error('Bad level '+level.id);
      if (level.rings.some(r=>!r.id || !r.title || !r.options)) throw Error('Bad ring in '+level.id);
    }
    families.push(family);
  }
  function options(ring, state) { return typeof ring.options==='function' ? ring.options(state) : ring.options; }
  function resolve(level, desired={}) {
    const state={}; const rings=[];
    for (const ring of level.rings) {
      const opts=options(ring,state);
      if (!Array.isArray(opts) || !opts.length) throw Error('No options for '+ring.id);
      if (new Set(opts.map(o=>o.id)).size!==opts.length) throw Error('Duplicate choices in '+ring.id);
      const selected=opts.find(o=>o.id===desired[ring.id])||opts[0];
      state[ring.id]=selected.id; rings.push({ring,options:opts,selected});
    }
    return {state,rings};
  }
  function generate(level, desired) {
    const resolved=resolve(level,desired);
    const chosen=Object.fromEntries(resolved.rings.map(r=>[r.ring.id,r.selected]));
    const result=level.build(resolved.state,chosen);
    if(!result || !Array.isArray(result.lines) || !result.lines.length) throw Error('No output for '+level.id);
    result.lines.forEach((line,i)=>{
      for(const field of ['dev','roman','en']) if(typeof line[field]!=='string'||!line[field].trim()) throw Error('Missing '+field+' in '+level.id+' line '+i);
      if(/undefined|null|NaN|\[object Object\]/.test(line.dev+' '+line.roman+' '+line.en)) throw Error('Bad generated line in '+level.id);
    });
    return {...resolved,chosen,result};
  }
  function allLevels(){return families.flatMap(f=>f.levels.map(l=>({family:f,level:l})));}
  function line(dev,roman,en,role='Sanskrit'){return {dev,roman,en,role};}
  function pick(arr,i){return arr[Math.max(0,Math.min(arr.length-1,i))];}
  function choose(id,label,extra={}){return {id,label,...extra};}
  function cartesianSizes(level){const r=resolve(level);return r.rings.reduce((n,x)=>n*x.options.length,1);}
  function runCombinations(level,cb){
    const visit=(i,selection)=>{
      if(i===level.rings.length){cb(generate(level,selection));return;}
      const {rings}=resolve(level,selection); // downstream options depend only on prior rings
      for(const option of rings[i].options) visit(i+1,{...selection,[level.rings[i].id]:option.id});
    };visit(0,{});
  }
  root.SW={registerFamily,families,resolve,generate,allLevels,line,pick,choose,runCombinations,cartesianSizes};
})(globalThis);
