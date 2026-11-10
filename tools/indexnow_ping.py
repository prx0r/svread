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
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--key", default=os.environ.get("INDEXNOW_KEY", ""))
    ap.add_argument("--host", default=os.environ.get(
        "SITE_ORIGIN", "https://svread.pages.dev").rstrip("/").split("://")[-1])
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--batch", type=int, default=200,
                    help="urls per request (first full submit got 403)")
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
    payload0 = {"host": a.host, "key": a.key}
    print(f"indexnow: {len(urls)} urls for {a.host} (key {a.key[:8]}...), "
          f"batches of {a.batch}")
    if a.dry_run:
        print("dry-run: nothing sent")
        return 0
    bad = 0
    for i in range(0, len(urls), a.batch):
        chunk = urls[i:i + a.batch]
        payload = json.dumps({**payload0, "urlList": chunk}).encode()
        ok = False
        for attempt in (1, 2, 3):
            req = urllib.request.Request(
                "https://api.indexnow.org/indexnow", data=payload,
                headers={"Content-Type": "application/json",
                         "User-Agent": "svread-indexnow/1"})
            try:
                with urllib.request.urlopen(req, timeout=60) as r:
                    print(f"  batch {i // a.batch + 1}: HTTP {r.status}")
                    ok = r.status in (200, 202)
                    break
            except Exception as e:  # noqa: BLE001
                print(f"  batch {i // a.batch + 1} try {attempt}: {e}",
                      file=sys.stderr)
                time.sleep(5 * attempt)
        if not ok:
            bad += 1
        time.sleep(2)
    print("indexnow: " + ("ALL SENT" if not bad else f"{bad} batches failed"))
    return 0 if not bad else 1


if __name__ == "__main__":
    raise SystemExit(main())
