# svread reader data and release checks

## Data flow and version identity

The static reader selects ipvv's live `data/layers/<work>.json`, then its live
`data/translations/<work>.json`, then `svread/data/<work>.json`. A custom `src`
URL replaces this selection. Live and custom inputs can change without a svread
commit. The attributions panel shows the actual response SHA-256 when available;
that identifies the bytes received, but does not preserve or authenticate them.
Root-text fallback sections use locally generated IDs and are not verse alignment.

`data/release-manifest.json` fingerprints the bundled files. Run
`python3 scripts/release_manifest.py` to check the asset list, passage IDs and
gates, Scholar projection hashes and original layer hashes; it records the schema
pin but does not independently verify the external schema snapshot. To update the
fingerprints after a deliberate change, run the same command with `--write`.
These checks establish consistency of the checked-in bytes, not source fidelity,
translation quality, human review, or independent authorship. The manifest is not
a cryptographic signature. Current missing edition names are enumerated in it.

The Scholar emitter in translation-work #7 rebuilds the full index from the
current work set and sorts its keys. On 2026-11-04, two independent full emissions
of the 21 bundled projections and index matched byte-for-byte, including when one
output directory started with a pre-existing index. This reproducibility check
does not independently validate the texts or translations.

The Scholar projection is produced by translation-work's `tools/emit_scholar.py`;
its content hash and schema pin are checked, but the live versioned Scholar
suite and its private account service are separate pending deployment work.
The ipvv Worker supplies chat, C2 and generated speech. The related
`worker/SVREAD-AUDIO.md` describes content-addressed generated audio in ipvv #10.
The reader's gate is a display rule, not a security boundary for an upstream API
that independently serves raw data. Release must also gate the upstream payloads.

| Reader dependency | Origin and version boundary |
| --- | --- |
| Passage layers | Live ipvv data first, bundled svread copy second. The response hash identifies the bytes fetched; the live origin is mutable. |
| Scholar versions and source evidence | Translation-work Git ledgers and layer files are emitted into checked-in svread projections; the projection hash binds the emitted object. The schema pin is recorded, not independently checked against the external snapshot. |
| Private drafts and reviews | ipvv Worker and D1; account records and review snapshots are private, not public Git. The extended workspace is in the matching ipvv and svread review branches and requires migrations and deployment. |
| Published scholar objects | Translation-work Git objects on explicit author submission, then a reviewed merge and regenerated reader projection. A created branch is not a live publication. |
| Chat and generated speech | ipvv Worker; provider configuration, model and quota belong to the deployment. The v2 speech cache in ipvv #10 binds exact spoken text, voice and model; the currently deployed legacy Worker may still use the older verse-only key. |
| Chant and timings | Public R2 objects plus any bundled alignment. These assets have independent lifecycles; they are not automatically proven to correspond to a newly revised text. |

Before deployment: run the local CI checks, the source coverage audit with the
correct pinned source checkout, and the ipvv site gate; integrate concurrent
changes and regenerate the manifest after the final merge. Then run an actual
browser smoke test and verify the deployed Worker and reader against their intended
commits. Provider, R2, D1, Git bridge and Cloudflare credentials are not part of
this repository or the manifest.

## Known source-coverage hold

The Ghaṭakarpara source `ipvv/site/data/sanskrit/ghatakarpara.txt`, recorded as
GRETIL's Parlier edition with Abhinavagupta's commentary (CC BY-NC-SA 4.0), has
SHA-256 `c3025effdb6ed0ea7eeb83fc3b5b4955aed8086bc5a8a9ee4646d689ffe73783`.
On 2026-11-04, all 21 numbered reader passages matched only the second line of
their corresponding source verse. Run `python3 scripts/audit_ghatakarpara.py`
with the sibling ipvv checkout, or pass `--source <path>`, to repeat the mechanical
comparison. A changed source hash stops the audit rather than assuming equivalence.

The reader withholds the dependent English, local glosses, proof claims, AI chat,
Scholar view and old karaoke alignment for this work. It fetches the existing
source file and displays all 21 numbered full Sanskrit verses only when its bytes
match the pin. If verification or fetch fails it labels the display incomplete.
The source file also contains an opening verse and commentary, so the 21 numbered
verses are not a complete edition of the whole file. Remove this temporary hold
only after the upstream T1/L0 and dependent layers are rebuilt against the full
source, their coverage and source identity are audited, and the release gates pass.

## References consulted

- [Bilara](https://github.com/suttacentral/bilara) and
  [bilara-data](https://github.com/suttacentral/bilara-data): stable segment IDs,
  separately versioned translations and explicit publication.
- [Scaife Viewer](https://github.com/scaife-viewer/scaife-viewer): parallel reading
  and citable references that distinguish work, version and passage.
- [Sefaria versions API](https://developers.sefaria.org/reference/get-versions):
  list selectable text versions with their metadata.
- [Ambuda Vidyut](https://github.com/ambuda-org/vidyut): Sanskrit tooling worth
  evaluating for candidate morphology and segmentation. It is not integrated here;
  candidates would still require human or agent adjudication and data-rights checks.

None of those projects or a cryptographic hash by itself validates the Sanskrit or
the reader's scholarly claims. Record and cite edition, contributor, exact version,
passage and review scope separately as those fields become available.

The bundled Ghaṭakarpara Scholar projection is now generated with all source
evidence and dependent layers withheld. The release manifest refuses to
rebaseline a projection that contains that material. This is a stopgap until
the authoritative source alignment, dependent layers and review are repaired;
it does not repair the live ipvv backend or establish copyright status.
