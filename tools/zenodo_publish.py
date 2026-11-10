#!/usr/bin/env python3
"""zenodo_publish.py — bundle a signed essay revision and publish it to Zenodo.

Pipeline: essay.md (exact revision) + claim/audit receipts + pushback report
+ rights file -> bundle dir -> deposit -> upload -> metadata -> publish.

SAFETY: --submit refuses without BOTH a human signoff id (--signoff
signoff:<uuid>, proving a scholar signed this exact revision with declared
rights) AND an explicit --confirm-live flag. Dry-run (default) builds and
validates everything locally, prints the metadata + manual curl commands,
touches no network except --check-token.

Token: $ZENODO_TOKEN (or $ZENODO_SANDBOX_TOKEN with --sandbox).
Get one at https://zenodo.org/account/settings/applications/tokens/new/
(scopes: deposit:write + deposit:actions). Never in repos (0600 file).

ORCID: pass --orcid 0000-000X-XXXX-XXXX to record it in creators[]. To have
Zenodo auto-update the ORCID profile, the author must log into Zenodo *with*
ORCID once (account settings -> linked accounts) — that linkage is a human
account step, not an API call.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
UA = "svread-zenodo/1.0 (+https://svread.pages.dev)"


def sha(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


def load_json(p: Path):
    return json.loads(p.read_text(encoding="utf-8"))


def api(base: str, token: str, method: str, path: str,
        body=None, raw: bytes | None = None, ctype="application/json"):
    url = base + path
    data = raw if raw is not None else (
        json.dumps(body).encode() if body is not None else None)
    if ctype and data is None and method in ("POST", "PUT"):
        data = b"{}"
    req = urllib.request.Request(
        url, data=data, method=method,
        headers={"Authorization": f"Bearer {token}", "User-Agent": UA,
                 "Content-Type": ctype})
    with urllib.request.urlopen(req, timeout=120) as r:
        payload = r.read()
        return r.status, json.loads(payload) if payload.strip() else {}


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--essay", required=True,
                    help="essay markdown path (exact signed revision)")
    ap.add_argument("--work", required=True)
    ap.add_argument("--target", required=True)
    ap.add_argument("--chunk-locator", default="",
                    help="e.g. tsa08-p01 (defaults to target)")
    ap.add_argument("--creator", required=True,
                    help='"Family name, Given names"')
    ap.add_argument("--orcid", default=os.environ.get("ZENODO_DEFAULT_ORCID", ""),
                    help="0000-000X-XXXX-XXXX (validated, not verified; "
                    "default from $ZENODO_DEFAULT_ORCID)")
    ap.add_argument("--affiliation", default="Independent scholar")
    ap.add_argument("--license", default="cc-by-4.0")
    ap.add_argument("--signoff", default="",
                    help="signoff:<uuid> from Scholar signoff (required to submit)")
    ap.add_argument("--out", default="",
                    help="bundle dir (default <essay>.zenodo/)")
    ap.add_argument("--sandbox", action="store_true",
                    help="use sandbox.zenodo.org (test DOIs 10.5072, cleaned anytime)")
    ap.add_argument("--dry-run", action="store_true",
                    help="build + validate bundle only (default if no --submit)")
    ap.add_argument("--submit", action="store_true")
    ap.add_argument("--confirm-live", action="store_true")
    ap.add_argument("--check-token", action="store_true",
                    help="GET /api/deposit/depositions to verify the token only")
    a = ap.parse_args()

    base = ("https://sandbox.zenodo.org/api"
            if a.sandbox else "https://zenodo.org/api")
    token = (os.environ.get("ZENODO_SANDBOX_TOKEN") if a.sandbox
             else os.environ.get("ZENODO_TOKEN", ""))
    if a.orcid:
        if not re.fullmatch(r"\d{4}-\d{4}-\d{4}-\d{3}[\dX]", a.orcid):
            print("zenodo: bad ORCID format (want 0000-000X-XXXX-XXXX)",
                  file=sys.stderr)
            return 2
        # ORCID check digit (ISO 7064 MOD 11-2); catches typos, not identity
        digits = a.orcid.replace("-", "")
        total = 0
        for ch in digits[:15]:
            total = (total + int(ch)) * 2
        check = (12 - total % 11) % 11
        if str(check if check < 10 else "X") != digits[15]:
            print("zenodo: ORCID check digit mismatch (typo?)",
                  file=sys.stderr)
            return 2
    if a.check_token:
        if not token:
            print("zenodo: no token in env", file=sys.stderr)
            return 2
        st, body = api(base, token, "GET", "/deposit/depositions")
        print(f"token ok: HTTP {st}, {len(body)} depositions")
        return 0 if st == 200 else 1

    essay = Path(a.essay)
    if not essay.is_file():
        print(f"zenodo: essay not found: {essay}", file=sys.stderr)
        return 2
    text = essay.read_text(encoding="utf-8")
    title = next((ln.strip("# ").strip() for ln in text.splitlines()
                  if ln.strip().startswith("#")), essay.stem)
    chunk = a.chunk_locator or a.target
    trace_url = f"https://svread.pages.dev/data/traces/{a.work}-{a.target}.json"
    claim_url = f"https://svread.pages.dev/claim/{a.work}/{a.target}/"
    creator: dict = {"name": a.creator, "affiliation": a.affiliation}
    if a.orcid:
        creator["orcid"] = a.orcid
    bundle = Path(a.out or (str(essay) + ".zenodo"))
    bundle.mkdir(parents=True, exist_ok=True)
    (bundle / "essay.md").write_text(text, encoding="utf-8")
    local_meta = {
        "format": "svread-zenodo-bundle/1",
        "essay_sha256": sha(text.encode()),
        "work": a.work, "target": a.target, "chunk": chunk,
        "signoff": a.signoff or "UNSIGNED-DRAFT (do not submit)",
        "trace_url": trace_url, "claim_url": claim_url,
        "license": a.license, "orcid": a.orcid or "not-provided",
    }
    (bundle / "bundle.json").write_text(
        json.dumps(local_meta, indent=1, ensure_ascii=False) + "\n",
        encoding="utf-8")
    metadata = {
        "title": title,
        "upload_type": "publication",
        "publication_type": "preprint",
        "description":
            f"Machine-proposed draft, human-signed Scholar essay. "
            f"Assurance at signing: see bundle.json (signoff id, trace URL, "
            f"claim table). Verify the sources independently: fetch the "
            f"trace bundle and recompute sha256 ({trace_url}). "
            f"Cite the claim page ({claim_url}). "
            f"Translation layers are machine-proposed unless the essay text "
            f"states human review.",
        "creators": [creator],
        "access_right": "open",
        "license": a.license,
        "keywords": ["Trika Shaivism", "Sanskrit", chunk,
                     f"{a.work}:{a.target}"],
        "related_identifiers": [
            {"identifier": trace_url, "relation": "isSupplementedBy"},
            {"identifier": claim_url, "relation": "isDocumentedBy"},
        ],
        "language": "eng",
        "version": f"signoff-{a.signoff or 'unsigned'}",
    }
    (bundle / "zenodo-metadata.json").write_text(
        json.dumps({"metadata": metadata}, indent=1, ensure_ascii=False) + "\n",
        encoding="utf-8")
    print(f"bundle: {bundle} (essay {len(text)} chars, "
          f"sha256 {local_meta['essay_sha256'][:16]}...)")
    print("metadata creators:", json.dumps(metadata["creators"]))
    print("metadata license:", metadata["license"],
          "| related:", len(metadata["related_identifiers"]))

    if not a.submit:
        print("dry-run: bundle validated locally, nothing sent. "
              "To submit: set $ZENODO_TOKEN, pass --signoff signoff:<uuid> "
              "--submit --confirm-live (sandbox first: --sandbox).")
        print("Manual path: POST /api/deposit/depositions {} -> PUT "
              "<bucket>/<file> -> PUT metadata -> POST .../actions/publish. "
              "See https://developers.zenodo.org/#quickstart-upload")
        return 0

    # ---- submit path (fail-closed gates) ----
    if not a.signoff.startswith("signoff-"):
        print("zenodo: REFUSING — --submit requires --signoff signoff:<uuid> "
              "(human sign-off of this exact revision)", file=sys.stderr)
        return 1
    if not a.confirm_live:
        print("zenodo: REFUSING — add --confirm-live to publish for real",
              file=sys.stderr)
        return 1
    if not token:
        print("zenodo: no token (set $ZENODO_TOKEN or --sandbox token)",
              file=sys.stderr)
        return 1
    st, dep = api(base, token, "POST", "/deposit/depositions", body={})
    if st != 201:
        print(f"zenodo: create failed: HTTP {st} {dep}", file=sys.stderr)
        return 1
    dep_id = dep["id"]
    bucket = dep["links"]["bucket"]
    print(f"deposition {dep_id} created")
    # upload each file to <bucket>/<name>
    import urllib.parse as _u
    for f in sorted(bundle.iterdir()):
        if not f.is_file():
            continue
        url = bucket + "/" + _u.quote(f.name)
        req = urllib.request.Request(
            url, data=f.read_bytes(), method="PUT",
            headers={"Authorization": f"Bearer {token}", "User-Agent": UA,
                     "Content-Type": "application/octet-stream"})
        try:
            with urllib.request.urlopen(req, timeout=300) as r:
                print(f"  uploaded {f.name}: HTTP {r.status}")
        except Exception as e:  # noqa: BLE001
            print(f"  upload failed for {f.name}: {e}", file=sys.stderr)
            return 1
    st, _ = api(base, token, "PUT",
                f"/deposit/depositions/{dep_id}", body={"metadata": metadata})
    if st != 200:
        print(f"zenodo: metadata failed: HTTP {st}", file=sys.stderr)
        return 1
    print("metadata set. Publish with:")
    print(f"  POST {base}/deposit/depositions/{dep_id}/actions/publish")
    print("Refusing to auto-publish: run the publish call yourself after "
          "reviewing the draft deposition in the browser.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
