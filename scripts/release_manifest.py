#!/usr/bin/env python3
"""Fingerprint and check svread's bundled assets without external dependencies.

This checks bytes and the existing Scholar projection hashes. It does not establish
that an edition, translation, review or passage alignment is philologically correct.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = ROOT / 'data' / 'release-manifest.json'
sys.path.insert(0, str(ROOT / 'tools'))
from site_assets import is_public_asset


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def canonical(value) -> bytes:
    return json.dumps(value, sort_keys=True, separators=(',', ':'), ensure_ascii=False).encode('utf-8')


def build() -> tuple[dict, list[str]]:
    errors: list[str] = []
    assets = [ROOT / name for name in ('.nojekyll', 'index.html', 'app.js', 'styles.css', 'sw.js',
                                        'manifest.webmanifest', 'README.md', 'SPEC.md', 'READER-ARCHITECTURE.md',
                                        'PUSHING-LAB.md', 'PUSHING-NEXT.md', 'PUSHING-RESEARCH.md', 'pushing.html', 'pushing.css', 'pushing-core.js', 'pushing-ui.js')]
    assets += [ROOT / name for name in ('wheels.html', 'wheels.js', 'journey.js', 'SANSKRIT-MEMORY-ENGINE-THESIS.md')
               if (ROOT / name).is_file()]
    assets += [p for p in (ROOT / 'vendor' / 'sanskrit-bruno-wheels').rglob('*')
               if p.is_file()]
    assets += [ROOT / name for name in ('scholar-voice.js', 'scholar-workspace-ui.js', 'SCHOLAR-PRIVACY.md')
               if (ROOT / name).is_file()]
    # scholar_server imports the shared resolver from tools at runtime.
    assets += [ROOT / 'tools' / 'lingua.py']
    assets += [p for p in (ROOT / '.github' / 'workflows').glob('*') if p.is_file()]
    assets += [p for folder in ('a', 'data', 'align', 'scripts', 'mcp', 'claim',
                                'work', 'chain', 'about', 'cite')
               for p in (ROOT / folder).rglob('*')
               if p.is_file() and p != MANIFEST and '__pycache__' not in p.parts and not p.name.endswith('.pyc')]
    assets += [ROOT / name for name in ('llms.txt', 'llms-full.txt',
                                        'ai-catalog.json', 'sitemap.xml',
                                        'robots.txt') if (ROOT / name).is_file()]
    files = {p.relative_to(ROOT).as_posix(): sha(p.read_bytes()) for p in sorted(assets)
             if is_public_asset(p.relative_to(ROOT).as_posix())}
    works, missing_editions = 0, []
    for path in sorted((ROOT / 'data').glob('*.json')):
        if path == MANIFEST:
            continue
        try:
            doc = json.loads(path.read_text(encoding='utf-8'))
        except (OSError, ValueError) as exc:
            errors.append(f'{path.name}: invalid JSON: {exc}')
            continue
        if not isinstance(doc, dict):
            continue
        rows = doc.get('chunks', doc.get('verses'))
        if not isinstance(rows, list):
            continue
        works += 1
        if not doc.get('source_edition'):
            missing_editions.append(path.stem)
        ids = set()
        for row in rows:
            if not isinstance(row, dict):
                errors.append(f'{path.name}: non-object passage')
                continue
            passage = row.get('chunk', row.get('id'))
            if not isinstance(passage, str) or not passage:
                errors.append(f'{path.name}: missing passage ID')
                continue
            if passage in ids:
                errors.append(f'{path.name}: duplicate passage ID {passage}')
            ids.add(passage)
            if row.get('gate') not in ('PASS', 'BLOCKED', 'WITHHELD'):
                errors.append(f'{path.name}: {passage}: invalid gate')
            source = row.get('sanskrit', row.get('sa', ''))
            if not isinstance(source, str) or not source.strip():
                errors.append(f'{path.name}: {passage}: no source text')
    projection_dir = ROOT / 'data' / 'scholar'
    projection_index = json.loads((projection_dir / 'index.json').read_text(encoding='utf-8'))
    projected = {}
    for path in sorted(projection_dir.glob('*.json')):
        if path.name == 'index.json':
            continue
        doc = json.loads(path.read_text(encoding='utf-8'))
        recorded = doc.get('projection_sha256')
        body = {key: value for key, value in doc.items() if key != 'projection_sha256'}
        if doc.get('work') != path.stem or recorded != sha(canonical(body)):
            errors.append(f'{path.name}: projection hash or work ID mismatch')
        originals, hashes = doc.get('originals', {}), doc.get('original_hashes', {})
        if path.stem == 'ghatakarpara' and (
            any(doc.get('originals', {}).values()) or
            any(doc.get(key) for key in ('source_verses','l4_craft','versions','essays','reviews','promotions','signoffs'))
        ):
            errors.append(f'{path.name}: source coverage hold contains Scholar evidence')
        for layer, values in originals.items():
            layer_hashes = hashes.get(layer, {})
            if set(values) != set(layer_hashes):
                errors.append(f'{path.name}: {layer} original hash index differs')
                continue
            for target, value in values.items():
                if sha(canonical(value)) != layer_hashes[target]:
                    errors.append(f'{path.name}: {layer}/{target} original hash mismatch')
        if set(doc.get('source_verses', {})) - set(originals.get('t1', {})):
            errors.append(f'{path.name}: displayed source without a T1 target')
        index_entry = projection_index.get(path.stem, {}) if isinstance(projection_index, dict) else {}
        expected = {'versions': len(doc.get('versions', [])), 'reviews': len(doc.get('reviews', [])),
                    'signoffs': len(doc.get('signoffs', [])), 'generated': doc.get('generated')}
        if not isinstance(index_entry, dict) or any(index_entry.get(key) != value for key, value in expected.items()):
            errors.append(f'{path.name}: Scholar index metadata does not match the projection')
        contract = doc.get('contract', {})
        projected[path.stem] = {'projection_sha256': recorded,
                                'schema_version': contract.get('structural_schema_version'),
                                'schema_sha256': contract.get('structural_schema_snapshot_sha256')}
    if not isinstance(projection_index, dict) or set(projection_index) != set(projected):
        errors.append('Scholar index does not match the bundled projections')
    return {'format': 'svread-bundled-release/1', 'assets': files, 'scholar_projections': projected,
            'work_count': works, 'works_without_recorded_edition': missing_editions}, errors


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--write', action='store_true', help='regenerate the bundled manifest')
    args = parser.parse_args()
    try:
        manifest, errors = build()
    except (OSError, ValueError, TypeError, AttributeError) as exc:
        print(f'FAIL: could not inspect bundled data: {exc}', file=sys.stderr)
        return 1
    if errors:
        for error in errors:
            print('FAIL:', error, file=sys.stderr)
        return 1
    encoded = json.dumps(manifest, sort_keys=True, indent=2, ensure_ascii=False) + '\n'
    if args.write:
        MANIFEST.write_text(encoded, encoding='utf-8')
        print(f'Wrote {MANIFEST.relative_to(ROOT)}')
    elif not MANIFEST.exists() or MANIFEST.read_text(encoding='utf-8') != encoded:
        print('FAIL: bundled release manifest is missing or stale; run with --write', file=sys.stderr)
        return 1
    print(f"PASS: {len(manifest['assets'])} asset hashes, {manifest['work_count']} works, "
          f"{len(manifest['scholar_projections'])} Scholar projections")
    print(f"INFO: {len(manifest['works_without_recorded_edition'])} works have no named source edition; see the manifest")
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
