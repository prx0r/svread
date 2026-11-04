#!/usr/bin/env python3
"""Unit tests for audit.py — the reasoning-chain gate. Uses the real bundled
paramarthasara projection (read-only) plus fixture sources."""
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import audit  # noqa: E402

CHUNK = {"kind": "chunk", "work": "paramarthasara", "target": "param-p01-v01"}
QUOTE = "I resort to You"


class AuditTest(unittest.TestCase):
    def test_clean_draft_passes(self):
        text = f'He says "{QUOTE}" [paramarthasara:param-p01-v01].'
        r = audit.audit(text, refs=[CHUNK])
        self.assertEqual(r["verdict"], "PASS")
        self.assertEqual(len(r["content_sha256"]), 64)
        self.assertTrue(all(c["status"] == "pass" for c in r["checks"]))
        self.assertIn("T", r["at"])

    def test_dangling_marker_fails(self):
        r = audit.audit("A claim [frobnicate:x9] stands.", refs=[CHUNK])
        fails = [c for c in r["checks"] if c["status"] == "fail"]
        self.assertTrue(any("frobnicate:x9" in c["detail"] for c in fails))
        self.assertEqual(r["verdict"], "FAIL")

    def test_unverified_quote_fails(self):
        r = audit.audit('He says "totally invented phrase xyzzy" [paramarthasara:param-p01-v01].',
                        refs=[CHUNK])
        self.assertEqual(r["verdict"], "FAIL")
        self.assertTrue(any(c["check"] == "quotes-verify" and c["status"] == "fail"
                            for c in r["checks"]))

    def test_mapped_marker_passes(self):
        text = "As the note says [M1], things hold."
        src = {"markers": {"M1": {"text": "As the note says"}}}
        r = audit.audit(text, refs=[CHUNK], sources=src)
        self.assertEqual(r["verdict"], "PASS")

    def test_external_needs_retrieval_note(self):
        text = "See https://example.com/paper for background [paramarthasara:param-p01-v01]."
        r = audit.audit(text, refs=[CHUNK])
        self.assertEqual(r["verdict"], "FAIL")
        r2 = audit.audit(text, refs=[CHUNK], sources={
            "external": [{"ref": "https://example.com/paper", "retrieved": "2026-11-04"}]})
        self.assertEqual(r2["verdict"], "PASS")

    def test_withheld_chunk_fails(self):
        r = audit.audit("A claim [ghatakarpara:ghat-p01-v01].",
                        refs=[{"kind": "chunk", "work": "ghatakarpara",
                               "target": "ghat-p01-v01"}])
        self.assertEqual(r["verdict"], "FAIL")

    def test_bogus_chunk_fails(self):
        r = audit.audit("A claim [paramarthasara:nope].",
                        refs=[{"kind": "chunk", "work": "paramarthasara", "target": "nope"}])
        self.assertEqual(r["verdict"], "FAIL")

    def test_uncited_paragraph_warns_only(self):
        r = audit.audit("A long uncited paragraph with many words that says things "
                        "at length without any marker whatsoever attached to it.",
                        refs=[CHUNK])
        self.assertEqual(r["verdict"], "PASS")
        self.assertTrue(any(c["check"] == "uncited-paragraphs" and c["status"] == "warn"
                            for c in r["checks"]))

    def test_identity_and_model_recorded(self):
        r = audit.audit("Short.", refs=[], identity="tester", model="m-1")
        self.assertEqual(r["verifier"], "tester")
        self.assertEqual(r["model"], "m-1")

    def test_empty_text_rejected(self):
        with self.assertRaises(ValueError):
            audit.audit("   ", refs=[])


if __name__ == "__main__":
    unittest.main()
