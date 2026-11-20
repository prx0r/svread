#!/usr/bin/env python3
"""test_concept_server.py — N5/N7: concept_get is one call, misses are stated."""
import importlib.util
import json
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent


def _load():
    spec = importlib.util.spec_from_file_location(
        "scholar_server", HERE / "scholar_server.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


class ConceptCard(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.m = _load()

    def test_kancuka_card_has_anchor_and_occurrences(self):
        c = self.m.concept_get({"term": "kancuka"})
        self.assertEqual(c["id"], "kancuka")
        self.assertEqual(c["tier"], "T")
        self.assertTrue(c["formal_anchors"])
        self.assertGreater(c["occurrence_count"], 0)
        self.assertEqual(c["review_state"], "UNREVIEWED")

    def test_missing_gloss_is_stated_not_invented(self):
        c = self.m.concept_get({"term": "kancuka"})
        if c["gloss_state"] != "CURATED":
            self.assertIsNone(c["definition"])
            self.assertIn("No curated gloss exists", c["warning"])

    def test_curated_concept_keeps_definition(self):
        c = self.m.concept_get({"term": "ananda"})
        self.assertEqual(c["gloss_state"], "CURATED")
        self.assertTrue(c["definition"])

    def test_unknown_term_fails_closed(self):
        c = self.m.concept_get({"term": "zzznotaterm"})
        self.assertFalse(c["found"])
        self.assertIn("not invented", c["note"])

    def test_occurrence_limit_respected(self):
        c = self.m.concept_get({"term": "tattva", "occurrence_limit": 3})
        self.assertLessEqual(len(c["occurrences"]), 3)
        self.assertTrue(c["occurrences_truncated"])

    def test_search_returns_concepts_not_passages(self):
        out = self.m.concept_search({"query": "bliss", "limit": 5})
        self.assertTrue(out["results"])
        for row in out["results"]:
            self.assertIn("gloss_state", row)


if __name__ == "__main__":
    unittest.main()
