import hashlib, importlib.util, json, os, subprocess, sys, tempfile, threading, unittest
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
SERVER = Path(__file__).with_name('scholar_server.py')

def run(requests, env=None):
    p=subprocess.run([sys.executable,str(SERVER)],input=''.join(json.dumps(r)+'\n' for r in requests),text=True,capture_output=True,env=env,check=True)
    return [json.loads(line) for line in p.stdout.splitlines()]

def req(i,method,params=None): return {'jsonrpc':'2.0','id':i,'method':method,'params':params or {}}
def tool(i,name,args): return req(i,'tools/call',{'name':name,'arguments':args})
def content(r): return json.loads(r['result']['content'][0]['text'])

class Mock(BaseHTTPRequestHandler):
    seen=[]
    uas=[]
    def log_message(self,*args): pass
    def do_GET(self):
        self.uas.append(self.headers.get('User-Agent') or '')
        self.seen.append((self.path,self.headers.get('Cookie')))
        if self.path=='/api/scholar/reviews':
            self.send_response(302);self.send_header('Location','http://127.0.0.1:1/leak');self.end_headers();return
        self.send_response(200);self.send_header('Content-Type','application/json');self.end_headers();self.wfile.write(b'{"documents":[]}')
    def do_POST(self):
        self.uas.append(self.headers.get('User-Agent') or '')
        data=json.loads(self.rfile.read(int(self.headers['Content-Length'])))
        self.seen.append((self.path,data))
        self.send_response(200);self.send_header('Content-Type','application/json');self.end_headers();self.wfile.write(b'{"ok":true}')
    def do_PUT(self):
        self.uas.append(self.headers.get('User-Agent') or '')
        data=json.loads(self.rfile.read(int(self.headers['Content-Length'])))
        self.send_response(409 if data['expected_revision']!=0 else 200);self.end_headers();self.wfile.write(b'{"error":"revision conflict"}' if data['expected_revision']!=0 else b'{"document":{"revision":1}}')

class TestMcp(unittest.TestCase):
    def test_protocol_and_real_bundled_passage(self):
        rs=run([req(1,'initialize',{'protocolVersion':'2025-06-18'}),req(2,'tools/list'),tool(3,'list_works',{}),tool(4,'passage_evidence',{'work':'paramarthasara','target':'param-p01-v01'}),tool(5,'passage_evidence',{'work':'ghatakarpara','target':'ghat-p01-v01'}),tool(6,'passage_evidence',{'work':'../../etc','target':'x'})])
        self.assertEqual(rs[0]['result']['protocolVersion'],'2025-06-18')
        self.assertIn('draft_with_qwen',[x['name'] for x in rs[1]['result']['tools']])
        self.assertIn('paramarthasara',content(rs[2])['works'])
        ev=content(rs[3]);self.assertIn('śambhuṃ',ev['source']['text']);self.assertIn('l0',ev['layers']);self.assertEqual(len(ev['projection_sha256']),64)
        self.assertTrue(rs[4]['result']['isError']);self.assertTrue(rs[5]['result']['isError'])
    @unittest.skipUnless(importlib.util.find_spec('vidyut'), 'optional Vidyut is not installed')
    def test_vidyut_candidates_use_bundled_source_and_are_unreviewed(self):
        args={'work':'paramarthasara','target':'param-p01-v01','scheme':'iast'}
        rs=run([tool(1,'vidyut_candidates',args),tool(2,'vidyut_candidates',{**args,'meter':True})])
        result=content(rs[0]);self.assertIn('paraM',result['slp1_candidate']);self.assertEqual(result['status'],'machine-generated-unreviewed')
        self.assertEqual(result['generator']['version'],'0.4.0');self.assertTrue(rs[1]['result']['isError'])
        with tempfile.NamedTemporaryFile() as f:
            raw=b'test\tvrtta\tGGLGLLLGLLGLGG\n';f.write(raw);f.flush()
            env=dict(os.environ,SCHOLAR_VIDYUT_METERS=f.name)
            measured=content(run([tool(3,'vidyut_candidates',{**args,'meter':True})],env)[0])
            self.assertEqual(measured['meter_candidate']['meter_data_sha256'],hashlib.sha256(raw).hexdigest())
            self.assertTrue(measured['meter_candidate']['syllables'])

    def test_version_comparison_uses_real_bundled_fork_and_exact_passage(self):
        args={'work':'paramarthasara','target':'param-p01-v01','layer':'l3'}
        rs=run([tool(1,'list_versions',args),tool(2,'compare_versions',{**args,'left':'original','right':'sv:ac094e65ee9be6aa'}),
                tool(3,'compare_versions',{**args,'left':'original','right':'sv:missing'})])
        rows=content(rs[0])['versions'];self.assertEqual(rows[0]['version_id'],'original');self.assertEqual(len(rows),4)
        comparison=content(rs[1]);self.assertEqual(comparison['right']['version_id'],'sv:ac094e65ee9be6aa')
        self.assertEqual(comparison['right']['status'],'MACHINE_DRAFT');self.assertTrue(rs[2]['result']['isError'])
        self.assertNotIn('content',rows[0])

    def test_decisions_and_drafting_are_explicit_account_requests(self):
        server=ThreadingHTTPServer(('127.0.0.1',0),Mock);t=threading.Thread(target=server.serve_forever,daemon=True);t.start()
        try:
            env=dict(os.environ,SCHOLAR_API_ORIGIN='http://127.0.0.1:'+str(server.server_port),SCHOLAR_SESSION_COOKIE='session=private')
            decision={'document_id':'a','revision':1,'subject':'svātantrya','before':'freedom','after':'sovereignty','reason':'context'}
            task={'work':'testwork','target':'p-v01','layer':'l3','kind':'translation','instruction':'','consent_to_ai':True,'use_style':True,'decision_ids':['decision:1']}
            rs=run([tool(1,'save_decision',decision),tool(2,'draft_with_qwen',task)],env)
            self.assertEqual(content(rs[0]),{'ok':True});self.assertEqual(content(rs[1]),{'ok':True})
            self.assertEqual(Mock.seen[-2][1],decision);self.assertEqual(Mock.seen[-1][1],task)
            self.assertIn('svread-scholar-mcp/0.1',Mock.uas[-1])
        finally: server.shutdown();server.server_close();t.join()
    def test_published_essay_retrieval_and_explicit_draft_arguments(self):
        server=ThreadingHTTPServer(('127.0.0.1',0),Mock);t=threading.Thread(target=server.serve_forever,daemon=True);t.start()
        try:
            env=dict(os.environ,SCHOLAR_API_ORIGIN='http://127.0.0.1:'+str(server.server_port),SCHOLAR_SESSION_COOKIE='session=private')
            task={'work':'paramarthasara','target':'','layer':'l3','kind':'enquiry','instruction':'Why?','consent_to_ai':True,'scholar_essays':[{'work':'paramarthasara','essay_id':'essay:'+'a'*64}]}
            refs={'passages':[{'work':'paramarthasara','target':'param-p01-v01'}]}
            rs=run([tool(1,'list_published_essays',{'work':'paramarthasara'}),tool(2,'draft_with_qwen',task),tool(3,'prepare_citations',refs)],env)
            self.assertEqual(content(rs[1]),{'ok':True});self.assertEqual(content(rs[2]),{'ok':True})
            self.assertIn('/api/scholar/published-essays?work=paramarthasara',[x[0] for x in Mock.seen]);self.assertEqual(Mock.seen[-2][1],task);self.assertEqual(Mock.seen[-1][1],refs)
        finally: server.shutdown();server.server_close();t.join()
    def test_account_api_conflict_and_redirect(self):
        server=ThreadingHTTPServer(('127.0.0.1',0),Mock);t=threading.Thread(target=server.serve_forever,daemon=True);t.start()
        try:
            env=dict(os.environ,SCHOLAR_API_ORIGIN='http://127.0.0.1:'+str(server.server_port),SCHOLAR_SESSION_COOKIE='session=private')
            rs=run([tool(1,'list_documents',{'work':'paramarthasara'}),tool(2,'save_document',{'document_id':'draft1','document':{'expected_revision':0}}),tool(3,'save_document',{'document_id':'draft1','document':{'expected_revision':1}}),tool(4,'list_reviews',{})],env)
            self.assertEqual(content(rs[0]),{'documents':[]});self.assertEqual(content(rs[1])['document']['revision'],1)
            self.assertTrue(rs[2]['result']['isError']);self.assertTrue(rs[3]['result']['isError']);self.assertNotIn('private',json.dumps(rs))
            self.assertEqual(Mock.seen[-2][1],'session=private')
        finally: server.shutdown();server.server_close();t.join()
if __name__=='__main__': unittest.main()
