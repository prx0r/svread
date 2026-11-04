#!/usr/bin/env python3
"""Local stdio MCP bridge to bundled evidence and the authenticated Scholar API."""
import difflib, hashlib, importlib.metadata, json, os, re, sys, tempfile, urllib.error, urllib.parse, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
IDENT = re.compile(r'^[A-Za-z0-9][A-Za-z0-9_.:-]{0,159}$')
WORK = re.compile(r'^[a-z0-9][a-z0-9_-]{0,79}$')

def canonical(x):
    return json.dumps(x, ensure_ascii=False, sort_keys=True, separators=(',', ':')).encode()

def projection(work):
    if not isinstance(work, str) or not WORK.fullmatch(work): raise ValueError('Invalid work ID')
    if work == 'ghatakarpara': raise ValueError('Evidence withheld: source alignment needs upstream repair')
    p = ROOT / 'data' / 'scholar' / (work + '.json')
    try: d = json.loads(p.read_text(encoding='utf-8'))
    except FileNotFoundError: raise ValueError('Work has no bundled Scholar projection')
    claimed = d.get('projection_sha256')
    if d.get('work') != work or claimed != hashlib.sha256(canonical({k:v for k,v in d.items() if k != 'projection_sha256'})).hexdigest():
        raise ValueError('Projection hash or work ID mismatch')
    return d

def evidence(a, data=None):
    work, target = a.get('work'), a.get('target')
    if not isinstance(target, str) or not IDENT.fullmatch(target): raise ValueError('Invalid target ID')
    d = data if data is not None else projection(work); song = re.sub(r'-v\d+$', '', target)
    if song in d.get('withheld_songs', []) or not d.get('source_verses', {}).get(target) or not d.get('originals', {}).get('t1', {}).get(target):
        raise ValueError('Passage unavailable or withheld')
    layers = {}
    for layer in ('t1','l0','argmap','l2','c1','l3','l4','c2'):
        key = song if layer in ('c1','c2') else target
        value = d.get('originals', {}).get(layer, {}).get(key)
        if value is not None:
            expected = d.get('original_hashes', {}).get(layer, {}).get(key)
            if expected != hashlib.sha256(canonical(value)).hexdigest(): raise ValueError('Layer hash mismatch')
            layers[layer] = value
    return {'work':work, 'target':target, 'source':d['source_verses'][target], 'layers':layers,
            'l4_craft':d.get('l4_craft', {}).get(target, []), 'projection_sha256':d['projection_sha256'],
            'warning':'Bundled snapshot; hashes establish integrity, not philological correctness or human review.'}

def versions(a, include_content=False):
    work, target, layer = a.get('work'), a.get('target'), a.get('layer')
    if layer not in ('t1','l0','argmap','l2','c1','l3','l4','c2'): raise ValueError('Invalid layer')
    d=projection(work); evidence(a,d)
    key=re.sub(r'-v\d+$','',target) if layer in ('c1','c2') else target
    original=d.get('originals',{}).get(layer,{}).get(key)
    if original is None: raise ValueError('Layer unavailable for this passage')
    original_hash=d.get('original_hashes',{}).get(layer,{}).get(key)
    if hashlib.sha256(canonical(original)).hexdigest()!=original_hash: raise ValueError('Original layer hash mismatch')
    rows=[{'version_id':'original','author':None,'author_kind':'unknown','status':'canonical-source-layer',
           'parent':None,'content_sha256':original_hash,'content':original}]
    for v in d.get('versions',[]):
        if v.get('work')!=work or v.get('target')!=key or v.get('layer')!=layer: continue
        content=v.get('content');digest=v.get('content_sha256')
        if not isinstance(content,dict) or hashlib.sha256(canonical(content)).hexdigest()!=digest: raise ValueError('Version content hash mismatch')
        rows.append({'version_id':v.get('version_id'),'author':v.get('author'),'author_kind':v.get('author_kind','unknown'),
                     'status':v.get('status','unknown'),'parent':v.get('parent'),'content_sha256':digest,'content':content})
    if not include_content:
        rows=[{k:v for k,v in row.items() if k!='content'} for row in rows]
    return {'work':work,'target':target,'layer_target':key,'layer':layer,'projection_sha256':d['projection_sha256'],
            'versions':rows,'warning':'A stored version or hash does not establish human review or approval.'}

def compare_versions(a):
    result=versions(a,True); left=a.get('left');right=a.get('right')
    if not isinstance(left,str) or not isinstance(right,str): raise ValueError('Choose two version IDs')
    lookup={v['version_id']:v for v in result['versions']}
    if left not in lookup or right not in lookup: raise ValueError('Version not found for this passage and layer')
    one=json.dumps(lookup[left]['content'],ensure_ascii=False,sort_keys=True,indent=2).splitlines(keepends=True)
    two=json.dumps(lookup[right]['content'],ensure_ascii=False,sort_keys=True,indent=2).splitlines(keepends=True)
    diff=''.join(difflib.unified_diff(one,two,fromfile=left,tofile=right))
    result.pop('versions');result.update({'left':{k:v for k,v in lookup[left].items() if k!='content'},
      'right':{k:v for k,v in lookup[right].items() if k!='content'},'diff':diff[:60000],'truncated':len(diff)>60000})
    return result

def vidyut_candidates(a):
    ev=evidence(a)
    source=ev['source'].get('text') if isinstance(ev['source'],dict) else None
    if not isinstance(source,str) or not source.strip(): raise ValueError('Source text unavailable')
    try:
        version=importlib.metadata.version('vidyut')
        from vidyut.lipi import Scheme,transliterate
    except (ImportError,importlib.metadata.PackageNotFoundError) as exc:
        raise ValueError('Install the optional vidyut==0.4.0 package') from exc
    if version!='0.4.0': raise ValueError('Expected vidyut 0.4.0')
    scheme=a.get('scheme','iast');src={'iast':Scheme.Iast,'devanagari':Scheme.Devanagari}.get(scheme)
    if src is None: raise ValueError('Choose iast or devanagari')
    slp=transliterate(source,src,Scheme.Slp1)
    result={'work':ev['work'],'target':ev['target'],'projection_sha256':ev['projection_sha256'],
            'source_text_sha256':hashlib.sha256(source.encode()).hexdigest(),'source_scheme':scheme,
            'slp1_candidate':slp,'generator':{'name':'vidyut','version':version},
            'status':'machine-generated-unreviewed','warning':'Verify source coverage, script and analysis independently.'}
    if a.get('meter') is True:
        meter=os.environ.get('SCHOLAR_VIDYUT_METERS','')
        if not meter: raise ValueError('Set SCHOLAR_VIDYUT_METERS to a licensed meter file')
        try: raw=Path(meter).read_bytes()
        except OSError as exc: raise ValueError('Meter file unavailable') from exc
        if not raw or len(raw)>2_000_000: raise ValueError('Meter file must be nonempty and no larger than 2 MB')
        from vidyut.chandas import Chandas
        with tempfile.NamedTemporaryFile() as pinned:
            pinned.write(raw);pinned.flush();match=Chandas(pinned.name).classify(slp)
        result['meter_candidate']={'name_slp1':match.padya,'meter_data_sha256':hashlib.sha256(raw).hexdigest(),
          'syllables':[[{'text':x.text,'weight':x.weight} for x in row] for row in match.aksharas],
          'warning':'Experimental; not a verified metre.'}
    return result

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs): return None

def api(method, path, data=None):
    origin = os.environ.get('SCHOLAR_API_ORIGIN', '')
    cookie = os.environ.get('SCHOLAR_SESSION_COOKIE', '')
    parsed = urllib.parse.urlsplit(origin)
    if (not parsed.hostname or parsed.username or parsed.password or parsed.path not in ('','/') or parsed.query or parsed.fragment or
        not (parsed.scheme == 'https' or (parsed.scheme == 'http' and parsed.hostname in ('localhost','127.0.0.1','::1')))):
        raise ValueError('Configure SCHOLAR_API_ORIGIN as HTTPS or a loopback HTTP origin')
    if not cookie or '\n' in cookie or '\r' in cookie: raise ValueError('Configure SCHOLAR_SESSION_COOKIE privately')
    raw = None if data is None else json.dumps(data).encode()
    req = urllib.request.Request(origin.rstrip('/') + path, data=raw, method=method,
                                 headers={'Cookie':cookie, 'Content-Type':'application/json', 'Accept':'application/json',
                                          'User-Agent':'svread-scholar-mcp/0.1'})
    try:
        with urllib.request.build_opener(NoRedirect).open(req, timeout=30) as response:
            payload = response.read(1024*1024+1)
            if len(payload)>1024*1024: raise ValueError('Scholar response too large')
            return json.loads(payload)
    except urllib.error.HTTPError as exc:
        try: msg=json.loads(exc.read(16384)).get('error','Request failed')
        except (ValueError, AttributeError): msg='Request failed'
        raise ValueError('Scholar API %s: %s' % (exc.code, str(msg)[:500]))
    except urllib.error.URLError: raise ValueError('Scholar API unavailable')

def ident(v):
    if not isinstance(v,str) or not IDENT.fullmatch(v): raise ValueError('Invalid ID')
    return v

def call(name,a):
    if not isinstance(a,dict): raise ValueError('Arguments must be an object')
    if name=='list_works':
        index=json.loads((ROOT/'data/scholar/index.json').read_text(encoding='utf-8'))
        return {'works':sorted(index), 'note':'Bundled projections; Ghaṭakarpara is withheld pending source repair.'}
    if name=='passage_evidence': return evidence(a)
    if name=='list_versions': return versions(a)
    if name=='compare_versions': return compare_versions(a)
    if name=='vidyut_candidates': return vidyut_candidates(a)
    if name=='list_documents':
        w=a.get('work');
        if not isinstance(w,str) or not WORK.fullmatch(w): raise ValueError('Invalid work ID')
        return api('GET','/api/scholar/documents?'+urllib.parse.urlencode({'work':w,'offset':a.get('offset',0)}))
    if name=='document_history': return api('GET','/api/scholar/documents/'+ident(a.get('document_id'))+'/history')
    if name=='list_reviews': return api('GET','/api/scholar/reviews')
    if name=='list_review_annotations': return api('GET','/api/scholar/reviews/'+ident(a.get('review_id'))+'/annotations')
    if name=='add_review_annotation':
        review=ident(a.get('review_id')); return api('POST','/api/scholar/reviews/'+review+'/annotations',{k:v for k,v in a.items() if k!='review_id'})
    if name=='list_style_examples': return api('GET','/api/scholar/style-examples')
    if name=='list_source_links': return api('GET','/api/scholar/source-links')
    if name=='save_source_link': return api('POST','/api/scholar/source-links',a)
    if name=='delete_source_link': return api('DELETE','/api/scholar/source-links/'+ident(a.get('link_id')),{})
    if name=='list_published_essays':
        w=a.get('work')
        if not isinstance(w,str) or not WORK.fullmatch(w): raise ValueError('Invalid work ID')
        return api('GET','/api/scholar/published-essays?'+urllib.parse.urlencode({'work':w}))
    if name=='list_sources': return api('GET','/api/scholar/sources')
    if name=='save_source': return api('POST','/api/scholar/sources',a)
    if name=='prepare_citations': return api('POST','/api/scholar/citations/prepare',a)
    if name=='delete_source': return api('DELETE','/api/scholar/sources/'+ident(a.get('source_id')),{})
    if name=='list_decisions': return api('GET','/api/scholar/decisions')
    if name=='save_decision': return api('POST','/api/scholar/decisions',a)
    if name=='delete_decision': return api('DELETE','/api/scholar/decisions/'+ident(a.get('decision_id')),{})
    if name=='save_document': return api('PUT','/api/scholar/documents/'+ident(a.get('document_id')),a.get('document'))
    if name=='request_review': return api('POST','/api/scholar/reviews',a)
    if name=='draft_with_qwen': return api('POST','/api/scholar/assist',a)
    raise ValueError('Unknown tool')

S= lambda props, required=[]: {'type':'object','properties':props,'required':required,'additionalProperties':False}
T={'type':'string'}
TOOLS=[
 ('list_works','List available bundled Scholar projections.',S({})),
 ('passage_evidence','Read hash-checked Sanskrit and editorial layers for a passage.',S({'work':T,'target':T},['work','target'])),
 ('list_versions','List stored versions for an exact passage and layer.',S({'work':T,'target':T,'layer':T},['work','target','layer'])),
 ('compare_versions','Compare two hash-checked versions for an exact passage and layer.',S({'work':T,'target':T,'layer':T,'left':T,'right':T},['work','target','layer','left','right'])),
 ('vidyut_candidates','Generate unreviewed transliteration and optional metre candidates from a bundled passage.',S({'work':T,'target':T,'scheme':{'type':'string','enum':['iast','devanagari']},'meter':{'type':'boolean'}},['work','target'])),
 ('list_documents','List this account’s private documents for a work.',S({'work':T,'offset':{'type':'integer','minimum':0}},['work'])),
 ('document_history','Read this account’s private document revision history.',S({'document_id':T},['document_id'])),
 ('list_reviews','List reviews accessible to this account.',S({})),
 ('list_review_annotations','List private selected-text comments for an accessible review.',S({'review_id':T},['review_id'])),
 ('add_review_annotation','Comment on exact UTF-16 offsets in an immutable review snapshot.',S({'review_id':T,'start':{'type':'integer','minimum':0},'end':{'type':'integer','minimum':1},'quote':T,'body':T},['review_id','start','end','quote','body'])),
 ('list_style_examples','List this account’s explicitly saved private edit examples.',S({})),
 ('list_source_links','List your private typed source relationships.',S({})),
 ('save_source_link','Save a private relationship between two owned sources.',S({'from_source_id':T,'to_source_id':T,'relation':{'type':'string','enum':['comments_on','quotes','parallels','responds_to','possibly_related']},'note':T},['from_source_id','to_source_id','relation','note'])),
 ('delete_source_link','Remove an owned private source relationship.',S({'link_id':T},['link_id'])),
 ('list_published_essays','List published essay versions and their author-approved AI use scopes.',S({'work':T},['work'])),
 ('list_sources','List your private source notebook.',S({})),
 ('save_source','Save a hash-pinned private source reference.',S({'work':T,'target':T,'note':T},['work','target','note'])),
 ('prepare_citations','Prepare citation references from selected notebook sources and/or explicit passages.',S({'source_ids':{'type':'array','items':T,'maxItems':10},'passages':{'type':'array','items':S({'work':T,'target':T},['work','target']),'maxItems':10}})),
 ('delete_source','Remove an owned source reference.',S({'source_id':T},['source_id'])),
 ('list_decisions','List your private revision-bound editorial decisions.',S({})),
 ('save_decision','Save a private editorial decision against an owned revision.',S({'document_id':T,'revision':{'type':'integer'},'subject':T,'before':T,'after':T,'reason':T},['document_id','revision','subject','before','after','reason'])),
 ('delete_decision','Remove an owned private editorial decision.',S({'decision_id':T},['decision_id'])),
 ('save_document','Save a private draft with expected_revision; conflicts are rejected.',S({'document_id':T,'document':{'type':'object'}},['document_id','document'])),
 ('request_review','Request private review of an exact saved revision.',S({'document_id':T,'reviewer_id':T,'revision':{'type':'integer'}},['document_id','reviewer_id','revision'])),
 ('draft_with_qwen','Request an agent draft; the Scholar API requires explicit consent and configured quotas.',S({'work':T,'target':T,'layer':T,'kind':T,'instruction':T,'consent_to_ai':{'type':'boolean'},'use_style':{'type':'boolean'},'style_example_ids':{'type':'array','items':T},'decision_ids':{'type':'array','items':T},'source_ids':{'type':'array','items':T},'scholar_essays':{'type':'array','items':S({'work':T,'essay_id':T},['work','essay_id']),'maxItems':3},'review_ids':{'type':'array','items':T},'document_id':T,'revision':{'type':'integer'}},['work','target','layer','kind','instruction','consent_to_ai']))]

def handle(req):
    method=req.get('method'); params=req.get('params') or {}
    if method=='initialize': return {'protocolVersion':'2025-06-18','capabilities':{'tools':{}},'serverInfo':{'name':'svread-scholar','version':'0.1.0'}}
    if method=='ping': return {}
    if method=='tools/list': return {'tools':[{'name':n,'description':d,'inputSchema':s} for n,d,s in TOOLS]}
    if method=='tools/call':
        try: result=call(params.get('name'),params.get('arguments',{})); return {'content':[{'type':'text','text':json.dumps(result,ensure_ascii=False)}]}
        except (ValueError,TypeError,KeyError,json.JSONDecodeError) as e: return {'isError':True,'content':[{'type':'text','text':str(e)}]}
    raise NotImplementedError()

def main():
    for line in sys.stdin:
        try:
            if len(line)>262144: raise ValueError('Request too large')
            req=json.loads(line)
            if not isinstance(req,dict) or req.get('jsonrpc')!='2.0': raise ValueError('Invalid request')
            if 'id' not in req: continue
            try: out={'jsonrpc':'2.0','id':req['id'],'result':handle(req)}
            except NotImplementedError: out={'jsonrpc':'2.0','id':req['id'],'error':{'code':-32601,'message':'Method not found'}}
        except (ValueError,TypeError,json.JSONDecodeError): out={'jsonrpc':'2.0','id':None,'error':{'code':-32600,'message':'Invalid request'}}
        print(json.dumps(out,ensure_ascii=False),flush=True)
if __name__=='__main__': main()
