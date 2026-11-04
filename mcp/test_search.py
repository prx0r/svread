#!/usr/bin/env python3
"""Unit tests for search.py — fixture mini-index, mocked embeddings (no network)."""
import json
import os
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parent))
import search  # noqa: E402


def write(p: Path, s: str) -> Path:
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(s, encoding="utf-8")
    return p


class SearchTest(unittest.TestCase):
    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp())
        recs = [
            {"id": "chunk:w1:t1", "kind": "passage", "work": "w1", "ref": "t1",
             "text": "passage: freedom bondage release", "gate": "PASS",
             "license": "free", "source": "s"},
            {"id": "chunk:w1:t2", "kind": "passage", "work": "w1", "ref": "t2",
             "text": "passage: cooking recipes", "gate": "PASS",
             "license": "free", "source": "s"},
            {"id": "chunk:w2:t9", "kind": "passage", "work": "w2", "ref": "t9",
             "text": "passage: freedom again", "gate": "BLOCKED",
             "license": "restricted", "source": "s"},
        ]
        write(self.tmp / "records.jsonl",
              "\n".join(json.dumps(r) for r in recs) + "\n")
        write(self.tmp / "vectors.json", json.dumps({
            "ids": [r["id"] for r in recs],
            "vectors": [[1.0, 0.0], [0.0, 1.0], [0.9, 0.1]]}))
        write(self.tmp / "meta.json", json.dumps({"model": "m", "count": 3}))
        self.env = {"SEARCH_INDEX_ROOT": str(self.tmp)}
        self.emb = mock.patch.object(search, "embed_query", return_value=[1.0, 0.0])
        self.emb.start()

    def tearDown(self):
        self.emb.stop()

    def test_rank_work_filter_and_gate(self):
        with mock.patch.dict(os.environ, self.env):
            search._CACHE.clear()
            r = search.search_texts("freedom", top_k=5)
        ids = [x["id"] for x in r["results"]]
        self.assertEqual(ids[0], "chunk:w1:t1")
        self.assertNotIn("chunk:w2:t9", ids)  # BLOCKED excluded by default
        with mock.patch.dict(os.environ, self.env):
            search._CACHE.clear()
            r2 = search.search_texts("freedom", work="w1", top_k=5)
        self.assertTrue(all(x["work"] == "w1" for x in r2["results"]))

    def test_explicit_gates_override(self):
        with mock.patch.dict(os.environ, self.env):
            search._CACHE.clear()
            r = search.search_texts("freedom", gates=["BLOCKED"], top_k=5)
        self.assertEqual([x["id"] for x in r["results"]], ["chunk:w2:t9"])

    def test_top_k_bounds(self):
        with mock.patch.dict(os.environ, self.env):
            with self.assertRaises(ValueError):
                search.search_texts("x", top_k=99)

    def test_themes_match(self):
        tdir = self.tmp / "ipvv" / "site" / "data" / "themes"
        write(tdir / "clusters.json", json.dumps([{
            "cluster_id": "CL-9", "member_c1_ids": ["w1-thing"]}]))
        with mock.patch.dict(os.environ, {**self.env, "IPVV_ROOT": str(self.tmp / "ipvv")}):
            r = search.text_themes(work="w1")
        self.assertTrue(any("CL-9" in json.dumps(h) for h in r["themes"]))
        with mock.patch.dict(os.environ, {**self.env, "IPVV_ROOT": str(self.tmp / "ipvv")}):
            r2 = search.text_themes(work="nope")
        self.assertEqual(r2["count"], 0)


if __name__ == "__main__":
    unittest.main()
