#!/usr/bin/env python3
"""Unit tests for the minimal essay-claim/evidence table."""
import unittest

import claims


class ClaimsTest(unittest.TestCase):
    def test_two_claims_cited_and_current(self):
        text = ('The verse says "a unique sentence" [A].\n\n'
                'I argue this supports recognition [paramarthasara:param-p01-v01].')
        refs = [{"kind": "chunk", "work": "paramarthasara",
                 "target": "param-p01-v01"}]
        rec = claims.link(text, refs=refs,
                          source_revs={"A": "rev1",
                                       "paramarthasara:param-p01-v01": "rev2"})
        self.assertEqual(len(rec["claims"]), 2)
        self.assertEqual(rec["claims"][0]["type"], "quotation")
        self.assertEqual(rec["claims"][1]["type"], "argument")
        self.assertTrue(all(c["citation"] == "CITED" for c in rec["claims"]))
        self.assertEqual(rec["unresolved"], 0)
        fresh = claims.check_stale(rec, text,
                                   source_revs={"A": "rev1",
                                                "paramarthasara:param-p01-v01": "rev2"})
        self.assertFalse(fresh["essay_stale"])
        self.assertEqual(fresh["stale_links"], 0)

    def test_source_change_stales_one_link(self):
        text = 'Claim "a unique sentence" [A] and more [B].'
        rec = claims.link(text, source_revs={"A": "r1", "B": "r1"})
        fresh = claims.check_stale(rec, text,
                                   source_revs={"A": "r1", "B": "r2"})
        self.assertFalse(fresh["essay_stale"])
        self.assertEqual(fresh["stale_links"], 1)

    def test_essay_edit_stales_essay_not_links(self):
        text = 'Claim [A].'
        rec = claims.link(text, source_revs={"A": "r1"})
        fresh = claims.check_stale(rec, text + ' More.', source_revs={"A": "r1"})
        self.assertTrue(fresh["essay_stale"])
        self.assertEqual(fresh["stale_links"], 0)

    def test_uncited_is_recorded_not_failed(self):
        rec = claims.link('An original argument with no markers at all here.')
        self.assertEqual(rec["claims"][0]["citation"], "UNCITED")
        self.assertEqual(rec["claims"][0]["assessment"], "UNASSESSED")

    def test_empty_text_rejected(self):
        with self.assertRaises(ValueError):
            claims.link('   ')


if __name__ == "__main__":
    unittest.main()
