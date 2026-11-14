#!/usr/bin/env python3
"""Copy the site to an isolated deploy directory without private assets."""
from __future__ import annotations

import argparse
import shutil
from pathlib import Path
from site_assets import is_public_asset


def stage(source: Path, destination: Path) -> None:
    source = source.resolve()
    destination = destination.resolve()
    if destination == source or source in destination.parents:
        raise ValueError('deployment directory must be outside the source tree')
    if destination.exists() and any(destination.iterdir()):
        raise ValueError('deployment directory must be empty')

    def ignore(directory: str, names: list[str]) -> set[str]:
        relative_dir = Path(directory).relative_to(source)
        return {name for name in names
                if name in {'.git', 'node_modules', '__pycache__', '.env', '.dev.vars'}
                or name.startswith('.env.') or name.endswith('.pem')
                or not is_public_asset((relative_dir / name).as_posix())}

    shutil.copytree(source, destination, dirs_exist_ok=True,
                    symlinks=True, ignore=ignore)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('destination', type=Path)
    parser.add_argument('--source', type=Path, default=Path(__file__).resolve().parent.parent)
    args = parser.parse_args()
    stage(args.source, args.destination)


if __name__ == '__main__':
    main()
