#!/usr/bin/env python3
"""Tests for lingua.py — the shared language. Fixture trees by env override,
plus read-only probes against the live repos (reads only, never writes)."""
import json
import os
import hashlib
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import lingua
from lingua import Unresolvable


def write(p: Path, s: str) -> Path:
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(s)
    return p


def available(*paths: Path) -> bool:
    try:
        return all(p.is_file() for p in paths)
    except OSError:
        return False


class Fixture(unittest.TestCase):
    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp())
        self.env = {
            "SVREAD_ROOT": str(self.tmp / "svread"),
            "TRANSLATION_WORK_ROOT": str(self.tmp / "tw"),
            "NIBBANAHELP_ROOT": str(self.tmp / "nib"),
            "IPVV_ROOT": str(self.tmp / "ipvv"),
            "AOC_ROOT": str(self.tmp / "aoc"),
        }
        self.old = {k: os.environ.get(k) for k in self.env}
        os.environ.update(self.env)
        for mod in (lingua,):
            mod.SVREAD = Path(self.env["SVREAD_ROOT"])
            mod.TW = Path(self.env["TRANSLATION_WORK_ROOT"])
            mod.NIB = Path(self.env["NIBBANAHELP_ROOT"])
            mod.IPVV = Path(self.env["IPVV_ROOT"])
            mod.AOC = Path(self.env["AOC_ROOT"])
        r = self.tmp
        write(r / "tw" / "demo-a01" / "STATUS.json",
              '{"counts": {"passages": 2}}')
        write(r / "tw" / "demo-a01" / "passages.jsonl",
              '{"locator": "d01-p01", "verses": "1.1", "order": 1}\n')
        write(r / "svread" / "data" / "scholar" / "demo-a01.json",
              '{"work": "demo-a01", "essays": []}')
        write(r / "svread" / "data" / "pushing-catalog.json",
              '{"format": "x", "revision": "r", "records": ['
              '{"file": "demo-a01/LOGICVID-x.md", "git_blob": "abc", '
              '"question": "why?", "title": "T", "work": "demo-a01"}]}')
        write(r / "nib" / "tensions" / "t1.md",
              "id: t1\nvisibility: public\nstatus: loosening\n"
              "domain: doubt\nroots: [moha]\nsummary: a test knot\n---\nbody\n")
        write(r / "nib" / "essays" / "e1.md",
              "day: 1\nvisibility: public\nvoice: own\naudio: -\n"
              "resolves: t1\n---\n# Title\n\nSome text here.\n")
        write(r / "nib" / "tensions" / "_links.json", json.dumps({
            "t1": {"essays": ["essays/e1.md"], "videos": ["videos/e1.read.pack.md"],
                   "packs": ["videos/e1.read.pack.md"],
                   "evidence": ["tension:t1", "demo-a01:d01-p01"]}}))
        write(r / "nib" / "videos" / "e1.read.pack.md",
              "essay: essays/e1.md\ntension: t1\nvisibility: public\nform: read\n"
              "evidence: tension:t1, demo-a01:d01-p01\ncontract: c\nbeats: 1\n"
              "runtime_seconds: 10\n---\n# P\n\n## Beat 1 (~10s)\n\nSome text here.\n")
        write(r / "aoc" / "receipts" / "content.jsonl",
              '{"receipt_id": "r1", "event": "carousel_built", "at": "t", '
              '"data": {"content_id": "aoc_x", "hook": "h", "template": "t", '
              '"slides": 7, "zip": "z"}}\n')

    def tearDown(self):
        for k, v in self.old.items():
            if v is None:
                os.environ.pop(k, None)
            else:
                os.environ[k] = v
        import lingua as m
        m.SVREAD = Path(os.environ.get("SVREAD_ROOT", "/root/svread"))
        m.TW = Path(os.environ.get("TRANSLATION_WORK_ROOT", "/root/translation-work"))
        m.NIB = Path(os.environ.get("NIBBANAHELP_ROOT", "/root/nibbanahelp"))
        m.IPVV = Path(os.environ.get("IPVV_ROOT", "/root/ipvv"))
        m.AOC = Path(os.environ.get("AOC_ROOT", "/root/aoc"))

    def test_resolve_each_atom(self):
        self.assertEqual(lingua.resolve("work:demo-a01")["passages"], 1)
        c = lingua.resolve("chunk:demo-a01:d01-p01")
        self.assertEqual(c["verses"], "1.1")
        self.assertTrue(c["projection"])
        t = lingua.resolve("tension:t1")
        self.assertEqual(t["status"], "loosening")
        self.assertEqual(t["essays"], ["essays/e1.md"])
        cr = lingua.resolve("crux:demo-a01:LOGICVID-x")
        self.assertEqual(cr["question"], "why?")
        e = lingua.resolve("essay:personal:essays/e1.md")
        self.assertEqual(e["resolves"], "t1")
        self.assertIn("Some text", e["excerpt"])
        p = lingua.resolve("pack:videos/e1.read.pack.md")
        self.assertEqual(p["form"], "read")
        self.assertEqual(p["evidence"], ["tension:t1", "demo-a01:d01-p01"])
        a = lingua.resolve("aoc:aoc_x")
        self.assertEqual(a["hook"], "h")

    def test_openpatala_block_null_without_records(self):
        w = lingua.resolve("work:demo-a01")
        op = w["openpatala"]
        self.assertIsNone(op["openpatala_work_id"])
        self.assertIsNone(op["record_sha256"])
        self.assertTrue(op["note"])
        c = lingua.resolve("chunk:demo-a01:d01-p01")
        self.assertIsNone(c["openpatala"]["openpatala_work_id"])

    def test_openpatala_input_is_pinned_and_candidate_scope_is_preserved(self):
        record = write(self.tmp / 'tw/demo-a01/source/record.json', json.dumps({
            'work': 'demo-a01', 'status': 'RECORDED', 'edition': {'label': 'candidate'}}))
        mapping = write(self.tmp / 'tw/source-maps/openpatala.json', json.dumps({
            'works': {'demo-a01': {'work': 'demo-a01', 'mapping_status': 'CANDIDATE',
                'openpatala_work_id': 'candidate-1', 'scope': 'part', 'language_conflict': True}}}))
        op = lingua.resolve('work:demo-a01')['openpatala']
        self.assertEqual(op['record_sha256'], hashlib.sha256(record.read_bytes()).hexdigest())
        self.assertEqual(op['mapping_sha256'], hashlib.sha256(mapping.read_bytes()).hexdigest())
        self.assertEqual(op['openpatala_work_id'], 'candidate-1')
        self.assertEqual(op['scope'], 'part')
        self.assertTrue(op['language_conflict'])
        self.assertEqual(lingua.resolve('chunk:demo-a01:d01-p01')['openpatala'], op)

    def test_openpatala_malformed_or_conflicting_data_is_unknown(self):
        record = self.tmp / 'tw/demo-a01/source/record.json'
        mapping = self.tmp / 'tw/source-maps/openpatala.json'
        write(record, json.dumps({'work': 'demo-a01', 'status': 'RECORDED', 'edition': 'bad'}))
        for bad in ('[]', '{"works": []}', '{"works": {"demo-a01": []}}',
                    '{"works": {"demo-a01": {"work":"demo-a01", "mapping_status":"CANDIDATE"}}}', '{'):
            with self.subTest(bad=bad):
                write(mapping, bad)
                op = lingua.resolve('work:demo-a01')['openpatala']
                self.assertEqual(op['mapping_status'], 'UNKNOWN')
                self.assertIsNone(op['openpatala_work_id'])
                self.assertIsNone(op['edition_label'])
        write(record, json.dumps({'work': 'another-work', 'status': 'RECORDED'}))
        self.assertIsNone(lingua.resolve('work:demo-a01')['openpatala']['record_sha256'])

    def test_work_paths_cannot_escape_translation_root(self):
        for ref in ('work:../nib', 'chunk:../nib:t1', 'work:/tmp', 'work:'):
            with self.subTest(ref=ref), self.assertRaises(Unresolvable):
                lingua.resolve(ref)

    def test_resolve_fails_closed(self):
        for bad in ("work:nope", "chunk:demo-a01:nope", "tension:ghost",
                    "crux:demo-a01:nope", "essay:personal:essays/nope.md",
                    "pack:videos/nope.pack.md", "aoc:nope", "frobnicate:x",
                    "essay:scholar:demo-a01:essay:123"):
            with self.assertRaises(Unresolvable, msg=bad):
                lingua.resolve(bad)

    def test_links_tension_is_the_hub(self):
        got = lingua.links("tension:t1")
        self.assertIn("essay:personal:essays/e1.md", got)
        self.assertIn("pack:videos/e1.read.pack.md", got)
        self.assertIn("chunk:demo-a01:d01-p01", got)
        # reverse directions meet at the same hub
        self.assertIn("tension:t1", lingua.links("essay:personal:essays/e1.md"))
        self.assertIn("tension:t1", lingua.links("pack:videos/e1.read.pack.md"))
        self.assertIn("pack:videos/e1.read.pack.md",
                      lingua.links("chunk:demo-a01:d01-p01"))
        self.assertIn("crux:demo-a01:LOGICVID-x", lingua.links("work:demo-a01"))

    def test_private_essay_body_withheld(self):
        write(self.tmp / "nib" / "essays" / "priv.md",
              "day: 1\nvisibility: private\nvoice: own\naudio: -\n---\n# P\n\nsecret\n")
        rec = lingua.resolve("essay:personal:essays/priv.md")
        self.assertEqual(rec["excerpt"], "(withheld: not public)")

    def test_check_clean_and_broken(self):
        self.assertEqual(lingua.check(), 0)
        (self.tmp / "nib" / "videos" / "e1.read.pack.md").write_text(
            (self.tmp / "nib" / "videos" / "e1.read.pack.md").read_text().replace(
                "demo-a01:d01-p01", "demo-a01:ghost"))
        self.assertEqual(lingua.check(), 1)

    def test_tensions_lists_both_kinds(self):
        ids = [t["id"] for t in lingua.all_tensions()]
        self.assertIn("tension:t1", ids)
        self.assertIn("crux:demo-a01:LOGICVID-x", ids)


class LiveReadOnly(unittest.TestCase):
    """Probes against the real repos. Reads only — fails if repos move."""

    @unittest.skipUnless(available(lingua.TW / 'tantrasara-a01/passages.jsonl'),
                         'live translation-work checkout unavailable')
    def test_live_chunk_and_work(self):
        c = lingua.resolve("chunk:tantrasara-a01:tsa01-p01")
        self.assertEqual(c["verses"], "1.1-1.5")
        w = lingua.resolve("work:tantrasara-a01")
        self.assertGreaterEqual(w["passages"], 1)

    @unittest.skipUnless(available(lingua.TW / 'vbt/source/record.json',
                                  lingua.TW / 'tantrasara-a08/source/record.json',
                                  lingua.TW / 'source-maps/openpatala.json'),
                         'live OpenPatala source records unavailable')
    def test_openpatala_block_live(self):
        w = lingua.resolve("work:vbt")
        op = w["openpatala"]
        self.assertEqual(op["record_status"], "RECORDED")
        self.assertEqual(len(op["record_sha256"]), 64)
        self.assertEqual(op["mapping_status"], "UNMAPPED")
        t = lingua.resolve("work:tantrasara-a08")
        self.assertEqual(t["openpatala"]["mapping_status"], "CANDIDATE")
        self.assertEqual(t["openpatala"]["openpatala_work_id"],
                         "PTCND_sa_abhinavagupta-tantrasAra")

    @unittest.skipUnless(available(lingua.NIB / 'tensions/debt-1500.md',
                                  lingua.SVREAD / 'data/pushing-catalog.json'),
                         'live tensions/catalog unavailable')
    def test_live_tensions_and_cruxes(self):
        t = lingua.resolve("tension:debt-1500")
        self.assertEqual(t["status"], "loosening")
        ids = [x["id"] for x in lingua.all_tensions()]
        self.assertIn("tension:debt-1500", ids)
        self.assertTrue(any(x.startswith("crux:") for x in ids))

    @unittest.skipUnless(available(lingua.SVREAD / 'data/scholar/paramarthasara.json'),
                         'live scholar projection unavailable')
    def test_live_scholar_essay_and_links(self):
        from lingua import load_json
        d = load_json(lingua.SVREAD / 'data/scholar/paramarthasara.json')
        eid = d["essays"][0]["essay_id"]
        rec = lingua.resolve(f"essay:scholar:paramarthasara:{eid}")
        self.assertEqual(rec["author"], "Svatantrya Editorial")
        self.assertIn(f"work:paramarthasara",
                      lingua.links(f"essay:scholar:paramarthasara:{eid}"))

    @unittest.skipUnless(available(lingua.AOC / 'receipts/content.jsonl'),
                         'live AOC receipts unavailable')
    def test_live_aoc_receipt(self):
        rec = lingua.resolve("aoc:aoc_66b19fb4c46b")
        self.assertEqual(rec["template"], "opportunity")


if __name__ == "__main__":
    unittest.main()
