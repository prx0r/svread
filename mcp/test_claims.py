#!/usr/bin/env python3
"""Revision comparisons never treat caller-supplied hashes as authority."""
import unittest
import claims

MARKER = 'paramarthasara:param-p01-v01'
REF = {'kind': 'chunk', 'work': 'paramarthasara', 'target': 'param-p01-v01'}
HASH1, HASH2 = 'a' * 64, 'b' * 64


class ClaimsTest(unittest.TestCase):
    def resolve(self, marker):
        if marker == MARKER:
            return HASH1
        raise ValueError('not available')

    def test_current_only_for_resolved_bundled_chunk(self):
        text = f'The verse says "a unique sentence" [{MARKER}].\n\nAn argument [A].'
        rec = claims.link(text, refs=[REF], source_revs={'A': 'untrusted'}, resolver=self.resolve)
        first, second = (c['links'][0] for c in rec['claims'])
        self.assertEqual(first['status'], 'CURRENT')
        self.assertEqual(first['recorded_rev'], HASH1)
        self.assertEqual(first['resolution'], 'BUNDLED_PROJECTION')
        self.assertEqual(second['status'], 'UNRESOLVED')
        self.assertEqual(rec['unresolved'], 1)
        self.assertEqual([c['type'] for c in rec['claims']], ['quotation', 'argument'])

    def test_changed_or_unavailable_source_fails_closed(self):
        text = f'Claim [{MARKER}].'
        rec = claims.link(text, refs=[REF], resolver=self.resolve)
        changed = claims.check_stale(rec, text, resolver=lambda _: HASH2)
        self.assertEqual(changed['stale_links'], 1)
        self.assertEqual(changed['claims'][0]['links'][0]['status'], 'STALE')
        # A caller echoing the old hash cannot turn an unavailable source CURRENT.
        missing = claims.check_stale(rec, text, source_revs={MARKER: HASH1},
                                     resolver=lambda _: None)
        self.assertEqual(missing['unresolved_links'], 1)
        self.assertEqual(missing['claims'][0]['links'][0]['status'], 'UNRESOLVED')

    def test_fabricated_marker_and_revision_never_current(self):
        rec = claims.link('Claim [madeup:passage].', refs=[],
                          source_revs={'madeup:passage': HASH1}, resolver=self.resolve)
        self.assertEqual(rec['claims'][0]['links'][0]['status'], 'UNRESOLVED')
        legacy = {'format': 'essay-claim/1', 'essay_sha256': 'irrelevant',
                  'claims': [{'links': [{'marker': 'A', 'status': 'CURRENT',
                                         'recorded_rev': HASH1, 'resolves_chunk': False}]}]}
        result = claims.check_stale(legacy, 'Claim [A].', source_revs={'A': HASH1})
        self.assertEqual(result['claims'][0]['links'][0]['status'], 'UNRESOLVED')

    def test_mismatched_historical_revision_is_stale(self):
        rec = claims.link(f'Claim [{MARKER}].', refs=[REF],
                          source_revs={MARKER: HASH2}, resolver=self.resolve)
        self.assertEqual(rec['claims'][0]['links'][0]['status'], 'STALE')

    def test_essay_edit_and_uncited_claim(self):
        text = f'Claim [{MARKER}].'
        rec = claims.link(text, refs=[REF], resolver=self.resolve)
        self.assertTrue(claims.check_stale(rec, text + ' More.', resolver=self.resolve)['essay_stale'])
        uncited = claims.link('An original argument with no markers at all here.')
        self.assertEqual(uncited['claims'][0]['citation'], 'UNCITED')
        self.assertEqual(uncited['claims'][0]['assessment'], 'UNASSESSED')

    def test_empty_text_rejected(self):
        with self.assertRaises(ValueError):
            claims.link('   ')


if __name__ == '__main__':
    unittest.main()
