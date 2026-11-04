#!/usr/bin/env python3
"""Local stdio MCP bridge to bundled evidence and the authenticated Scholar API."""
import hashlib, json, os, re, sys, urllib.error, urllib.parse, urllib.request
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

def evidence(a):
    work, target = a.get('work'), a.get('target')
    if not isinstance(target, str) or not IDENT.fullmatch(target): raise ValueError('Invalid target ID')
    d = projection(work); song = re.sub(r'-v\d+$', '', target)
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
                                 headers={'Cookie':cookie, 'Content-Type':'application/json', 'Accept':'application/json'})
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
    if name=='list_documents':
        w=a.get('work');
        if not isinstance(w,str) or not WORK.fullmatch(w): raise ValueError('Invalid work ID')
        return api('GET','/api/scholar/documents?'+urllib.parse.urlencode({'work':w,'offset':a.get('offset',0)}))
    if name=='document_history': return api('GET','/api/scholar/documents/'+ident(a.get('document_id'))+'/history')
    if name=='list_reviews': return api('GET','/api/scholar/reviews')
    if name=='list_style_examples': return api('GET','/api/scholar/style-examples')
    if name=='save_document': return api('PUT','/api/scholar/documents/'+ident(a.get('document_id')),a.get('document'))
    if name=='request_review': return api('POST','/api/scholar/reviews',a)
    if name=='draft_with_qwen': return api('POST','/api/scholar/assist',a)
    raise ValueError('Unknown tool')

S= lambda props, required=[]: {'type':'object','properties':props,'required':required,'additionalProperties':False}
T={'type':'string'}
TOOLS=[
 ('list_works','List available bundled Scholar projections.',S({})),
 ('passage_evidence','Read hash-checked Sanskrit and editorial layers for a passage.',S({'work':T,'target':T},['work','target'])),
 ('list_documents','List this account’s private documents for a work.',S({'work':T,'offset':{'type':'integer','minimum':0}},['work'])),
 ('document_history','Read this account’s private document revision history.',S({'document_id':T},['document_id'])),
 ('list_reviews','List reviews accessible to this account.',S({})),
 ('list_style_examples','List this account’s explicitly saved private edit examples.',S({})),
 ('save_document','Save a private draft with expected_revision; conflicts are rejected.',S({'document_id':T,'document':{'type':'object'}},['document_id','document'])),
 ('request_review','Request private review of an exact saved revision.',S({'document_id':T,'reviewer_id':T,'revision':{'type':'integer'}},['document_id','reviewer_id','revision'])),
 ('draft_with_qwen','Request an agent draft; the Scholar API requires explicit consent and configured quotas.',S({'work':T,'target':T,'layer':T,'kind':T,'instruction':T,'consent_to_ai':{'type':'boolean'},'use_style':{'type':'boolean'},'style_example_ids':{'type':'array','items':T},'review_ids':{'type':'array','items':T},'document_id':T,'revision':{'type':'integer'}},['work','target','layer','kind','instruction','consent_to_ai']))]

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
