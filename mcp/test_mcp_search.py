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
    def test_new_tools_listed(self):
        rs = run([req(1, "tools/list")])
        names = [x["name"] for x in rs[0]["result"]["tools"]]
        self.assertIn("search_texts", names)
        self.assertIn("text_themes", names)
        self.assertIn("audit_draft", names)
        self.assertIn("link_claims", names)
        self.assertIn("check_claim_staleness", names)
        self.assertIn("pushback", names)
        self.assertEqual(len(names), 33)

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
        ])
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
        ])
        self.assertEqual(content(rs[0])["status"], "loosening")
        self.assertIn("work:bodhapancadasika", content(rs[1])["links"])
        self.assertTrue(rs[2]["result"]["isError"])


if __name__ == "__main__":
    unittest.main()
