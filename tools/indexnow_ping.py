#!/usr/bin/env python3
"""indexnow_ping.py — submit sitemap URLs to IndexNow (Bing/Yandex).

Usage:
  python3 tools/indexnow_ping.py --key <32-hex> [--host svread.pages.dev] [--dry-run]

Reads sitemap.xml URLs for the host, POSTs them in one batch (<=10k) to
https://api.indexnow.org/indexnow. The key file must already be deployed
at https://<host>/<key>.txt containing exactly the key. Exit nonzero on
non-202/200 responses. No other network use.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--key", default=os.environ.get("INDEXNOW_KEY", ""))
    ap.add_argument("--host", default=os.environ.get(
        "SITE_ORIGIN", "https://svread.pages.dev").rstrip("/").split("://")[-1])
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()
    if not re.fullmatch(r"[0-9a-f]{16,128}", a.key or ""):
        print("indexnow: need --key (hex)", file=sys.stderr)
        return 2
    sm = (ROOT / "sitemap.xml").read_text(encoding="utf-8")
    urls = sorted({u for u in re.findall(r"<loc>([^<]+)</loc>", sm)
                   if a.host in u})
    if not urls:
        print("indexnow: no sitemap urls for host", file=sys.stderr)
        return 2
    payload = json.dumps({"host": a.host, "key": a.key,
                          "urlList": urls}).encode()
    print(f"indexnow: {len(urls)} urls for {a.host} (key {a.key[:8]}...)")
    if a.dry_run:
        print("dry-run: nothing sent")
        return 0
    req = urllib.request.Request("https://api.indexnow.org/indexnow",
                                 data=payload,
                                 headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            print(f"indexnow: HTTP {r.status}")
            return 0 if r.status in (200, 202) else 1
    except Exception as e:  # noqa: BLE001 — report, don't crash silently
        print(f"indexnow: submit failed: {e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
