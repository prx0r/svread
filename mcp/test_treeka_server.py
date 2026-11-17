#!/usr/bin/env python3
"""test_treeka_server.py — N17: no silent empties in treeka__chain."""
import importlib.util
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent


def _load():
    spec = importlib.util.spec_from_file_location(
        "treeka_server", HERE / "treeka_server.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


class NoSilentEmpty(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.m = _load()
        cls.d = cls.m._load()

    def test_empty_essays_are_annotated(self):
        works = self.d["works"]
        counts = self.d.get("counts", {})
        empty = [k for k, v in works.items() if not v.get("essays")]
        self.assertTrue(empty, "fixture expects at least one essayless row")
        key = empty[0]
        work = key.split(":")[0]
        out = self.m.chain(work)
        entry = out["entries"][key]
        self.assertEqual(entry["essays"], [])
        self.assertIn("gap, not a denial", entry["essays_note"])

    def test_no_formal_ref_is_annotated(self):
        works = self.d["works"]
        counts = self.d.get("counts", {})
        noformal = [k for k, v in works.items()
                    if v.get("formal_reference") is False]
        self.assertTrue(noformal, "fixture expects at least one unformalised row")
        key = noformal[0]
        out = self.m.chain(key.split(":")[0], key.split(":")[1])
        self.assertIn("no registry theorem", out["entry"]["formal_note"])

    def test_counts_survive(self):
        out = self.m.chain("tantrasara-a08")
        self.assertIn("essayless", out["counts"])
        self.assertEqual(out["rows"], len(out["entries"]))


if __name__ == "__main__":
    unittest.main()
