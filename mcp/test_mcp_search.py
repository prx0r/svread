#!/usr/bin/env python3
"""MCP-level tests for search_texts/text_themes/audit_draft (subprocess server).

search_texts needs a query embedding (network) and is covered in
test_search.py with a mocked embedder; here we cover listing, themes
(local reads) and audit (bundled projections) end to end.
"""
import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

SERVER = Path(__file__).with_name("scholar_server.py")


def run(requests, env=None):
    e = dict(os.environ)
    if env:
        e.update(env)
    p = subprocess.run([sys.executable, str(SERVER)],
                       input="".join(json.dumps(r) + "\n" for r in requests),
                       text=True, capture_output=True, env=e, check=True)
    return [json.loads(line) for line in p.stdout.splitlines()]


def req(i, method, params=None):
    return {"jsonrpc": "2.0", "id": i, "method": method, "params": params or {}}


def tool(i, name, args):
    return req(i, "tools/call", {"name": name, "arguments": args})


def content(r):
    return json.loads(r["result"]["content"][0]["text"])


class McpSearchTest(unittest.TestCase):
    def setUp(self):
        # Small synthetic companion repositories make the protocol tests
        # portable and keep real diary data out of CI and test output.
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        root = Path(tmp.name)
        themes = root / 'ipvv/site/data/themes'
        themes.mkdir(parents=True)
        (themes / 'index.json').write_text(json.dumps([{'work':'ipvv','label':'fixture theme'}]))
        tensions = root / 'nibbanahelp/tensions'
        tensions.mkdir(parents=True)
        (tensions / 'debt-1500.md').write_text('id: debt-1500\nstatus: loosening\nvisibility: public\n---\nSynthetic fixture.\n')
        works = root / 'translation-work/bodhapancadasika'
        works.mkdir(parents=True)
        (works / 'passages.jsonl').write_text('{"locator":"bd-p01","verses":"1"}\n')
        (works / 'source').mkdir()
        (works / 'source/record.json').write_text(json.dumps({
            'work': 'bodhapancadasika', 'status': 'RECORDED',
            'edition': {'label': 'synthetic candidate'}}))
        maps = root / 'translation-work/source-maps'
        maps.mkdir()
        (maps / 'openpatala.json').write_text(json.dumps({'works': {
            'bodhapancadasika': {'work': 'bodhapancadasika', 'mapping_status': 'CANDIDATE',
                'openpatala_work_id': 'candidate-1', 'scope': 'part', 'language_conflict': True}}}))
        catalog = root / 'svread/data'
        catalog.mkdir(parents=True)
        (catalog / 'pushing-catalog.json').write_text(json.dumps({'records':[{
            'work':'bodhapancadasika', 'file':'LOGICVID-session-is-suffering-grace.md',
            'question':'Synthetic fixture question'}]}))
        self.env = {'IPVV_ROOT':str(root / 'ipvv'), 'NIBBANAHELP_ROOT':str(root / 'nibbanahelp'),
                    'TRANSLATION_WORK_ROOT':str(root / 'translation-work'), 'SVREAD_ROOT':str(root / 'svread')}

    def test_new_tools_listed(self):
        rs = run([req(1, "tools/list")])
        names = [x["name"] for x in rs[0]["result"]["tools"]]
        self.assertIn("search_texts", names)
        self.assertIn("text_themes", names)
        self.assertIn("audit_draft", names)
        self.assertIn("link_claims", names)
        self.assertIn("check_claim_staleness", names)
        self.assertIn("pushback", names)
        # wheel tools (reader + harness surface)
        for t in ("wheel_harness", "wheel_lookup", "wheel_verify", "wheel_level"):
            self.assertIn(t, names)
        # no silent removal: the historical core set must still be present
        self.assertGreaterEqual(len(names), 37)

    def test_themes_and_audit_end_to_end(self):
        rs = run([
            tool(1, "text_themes", {"work": "ipvv"}),
            tool(2, "text_themes", {"work": "no-such-work"}),
            tool(3, "audit_draft", {
                "text": 'He says "I resort to You" [paramarthasara:param-p01-v01].',
                "refs": [{"kind": "chunk", "work": "paramarthasara",
                          "target": "param-p01-v01"}]}),
            tool(4, "audit_draft", {
                "text": "A claim [frobnicate:x9] stands.", "refs": []}),
        ], env=self.env)
        self.assertGreater(content(rs[0])["count"], 0)
        self.assertEqual(content(rs[1])["count"], 0)
        self.assertEqual(content(rs[2])["verdict"], "PASS")
        self.assertTrue(content(rs[2])["content_sha256"])
        self.assertEqual(content(rs[3])["verdict"], "FAIL")

    def test_search_without_index_errors_cleanly(self):
        rs = run([tool(1, "search_texts", {"query": "freedom"})],
                 env={"SEARCH_INDEX_ROOT": "/tmp/does-not-exist-xyz"})
        self.assertTrue(rs[0]["result"]["isError"])

    def test_lingua_tools_end_to_end(self):
        rs = run([
            tool(1, "resolve_ref", {"id": "tension:debt-1500"}),
            tool(2, "ref_links", {"id": "crux:bodhapancadasika:LOGICVID-session-is-suffering-grace"}),
            tool(3, "resolve_ref", {"id": "frobnicate:x"}),
        ], env=self.env)
        self.assertEqual(content(rs[0])["status"], "loosening")
        self.assertIn("work:bodhapancadasika", content(rs[1])["links"])
        self.assertTrue(rs[2]["result"]["isError"])

    def test_openpatala_identity_through_mcp(self):
        rs = run([
            tool(1, 'resolve_ref', {'id': 'work:bodhapancadasika'}),
            tool(2, 'resolve_ref', {'id': 'chunk:bodhapancadasika:bd-p01'}),
            tool(3, 'resolve_ref', {'id': 'work:../nibbanahelp'}),
        ], env=self.env)
        a, b = content(rs[0])['openpatala'], content(rs[1])['openpatala']
        self.assertEqual(a, b)
        self.assertEqual(a['mapping_status'], 'CANDIDATE')
        self.assertEqual(len(a['mapping_sha256']), 64)
        self.assertTrue(a['language_conflict'])
        self.assertTrue(rs[2]['result']['isError'])


if __name__ == "__main__":
    unittest.main()
