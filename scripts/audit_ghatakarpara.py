#!/usr/bin/env python3
"""Compare numbered Ghaṭakarpara source paragraphs with the bundled reader.

Exit 1 means a coverage mismatch, 2 means the pinned source cannot be checked.
Passing this mechanical comparison is not a translation or scholarly review.
"""
import argparse
import hashlib
import json
import re
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PIN = 'c3025effdb6ed0ea7eeb83fc3b5b4955aed8086bc5a8a9ee4646d689ffe73783'


def norm(value):
    return re.sub(r'[\W_]+', '', unicodedata.normalize('NFC', value).casefold())


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, default=ROOT.parent/'ipvv/site/data/sanskrit/ghatakarpara.txt')
    args = parser.parse_args()
    try:
        raw = args.source.read_bytes()
        if hashlib.sha256(raw).hexdigest() != PIN:
            raise ValueError('source hash differs from the audited edition')
        paragraphs = re.split(r'\n\s*\n', raw.decode('utf-8'))
        sources = {}
        for paragraph in paragraphs:
            markers = re.findall(r'//\s*Ghk_(\d+)\s*//', paragraph)
            if len(markers) > 1:
                raise ValueError('multiple verse markers in a source paragraph')
            if markers:
                number = int(markers[0])
                if number in sources:
                    raise ValueError('duplicate source marker')
                sources[number] = re.sub(r'//\s*Ghk_\d+\s*//', '', paragraph).strip()
        if set(sources) != set(range(1, 22)):
            raise ValueError('expected 21 numbered source verses')
        data = json.loads((ROOT/'data/ghatakarpara.json').read_text(encoding='utf-8'))
        rows = data['chunks']
        mismatches = []
        for row in rows:
            match = re.fullmatch(r'\d+', str(row.get('verses', '')))
            if not match or int(match.group()) not in sources:
                raise ValueError(f"unmapped reader passage {row.get('chunk')}")
            if norm(row.get('sanskrit', '')) != norm(sources[int(match.group())]):
                mismatches.append(row['chunk'])
        if len(rows) != 21:
            raise ValueError('expected 21 reader passages')
    except (OSError, ValueError, KeyError, TypeError) as exc:
        print(f'BLOCKED: source audit unavailable: {exc}')
        return 2
    if mismatches:
        print(f'FAIL: {len(mismatches)}/21 passages differ from the pinned source: ' + ', '.join(mismatches))
        return 1
    print('PASS: 21 numbered Sanskrit passages match after whitespace/punctuation normalization.')
    print('This does not verify the translation, interpretation, source edition or review.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
