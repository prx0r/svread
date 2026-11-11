import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from tools.check_licenses import admitted, problems


def entry(
    kind="model",
    status="registered",
    release="",
    source_url="https://example.org/source",
    notes="Reviewed for this test.",
):
    return {
        "id": "sample",
        "kind": kind,
        "source_url": source_url,
        "release": release,
        "checksum": None,
        "attribution": "Sample authors",
        "allowed": {"train": False, "infer": False, "quote": True, "redistribute": False},
        "status": status,
        "notes": notes,
    }


def registry(item):
    return {
        "format": "svatantrya.licence-registry/1",
        "rule": "A registry row is required before use.",
        "entries": [item],
    }


class LicensePinTests(unittest.TestCase):
    def test_registered_nontext_requires_full_immutable_revision(self):
        item = entry(release="revision 66869d9b")
        self.assertTrue(any("full immutable revision" in p for p in problems(registry(item))))

    def test_registered_nontext_accepts_full_revision_and_https_source(self):
        item = entry(release="model @ 66869d9b73f5180fa124b4975c52f5033517e101")
        self.assertEqual(problems(registry(item)), [])

    def test_registered_text_source_keeps_claim_page_pin_rule(self):
        item = entry(kind="text-source", release="per edition", notes="Hashes live on each claim page.")
        self.assertEqual(problems(registry(item)), [])

    def test_registered_external_pin_requires_https_source(self):
        item = entry(release="model @ 66869d9b73f5180fa124b4975c52f5033517e101", source_url=None)
        self.assertTrue(any("HTTPS source_url" in p for p in problems(registry(item))))

    def test_pending_and_excluded_still_refuse_inference(self):
        for status in ("pending_verification", "excluded", "read_only"):
            with self.subTest(status=status):
                ok, _ = admitted(registry(entry(status=status)), "sample", "infer")
                self.assertFalse(ok)


if __name__ == "__main__":
    unittest.main()
