# Scholar MCP bridge (local stdio)

Run `python3 mcp/scholar_server.py` as a local MCP stdio server (protocol 2025-06-18). Configure an MCP client with that command and the repository root as working directory. No packages or background service are required. Standard output is reserved for JSON-RPC; the server does not log drafts or credentials.

The server exposes the bundled, hash-checked Scholar projections and L0–L4 evidence and hash-checked version comparisons by stable passage ID, plus authenticated Scholar account operations for private documents, revision history, review requests, saved style examples, revision-bound private editorial decisions, a private source notebook and Qwen drafts. It does not expose sign-off or publication. Those remain explicit account actions. Ghaṭakarpara evidence is withheld pending upstream alignment repair. A matching hash does not establish philological correctness, completeness, human review, or the latest public version.

For account tools, set `SCHOLAR_API_ORIGIN` to the intended HTTPS Scholar backend and `SCHOLAR_SESSION_COOKIE` to the authenticated account's Cookie header value in the local MCP client's **private environment**. Never commit or share this value. HTTP is permitted only for loopback development. Redirects are disabled so a session cannot be forwarded to another host. The account and all data returned to the MCP client are sensitive; only use a trusted client. No account tools work until the existing Worker, account login and database migrations are deployed. Qwen requires its existing explicit consent, server-side credentials and quotas.

The API enforces account access, revision conflicts, review permissions and model consent. This bridge is a local client, not an authentication service. Do not expose it to untrusted clients or treat a caller's claims as human identity. It implements the initialization and tools subset needed here, not every optional MCP capability.

`audit_draft` checks that quoted spans appear in actual text fields of a source
cited in the **same paragraph**. It records the matching marker and excludes JSON
IDs and metadata; it does not combine unrelated sources to make a quote pass.
Caller-supplied source text is not independently authenticated. A passing draft
check does not establish that claims follow, that a person reviewed them, or that
the receipt is digitally signed; long uncited paragraphs remain warnings.

`link_claims` and `check_claim_staleness` independently resolve declared
passage markers against available local Scholar projections. A link is
`CURRENT` only when its recorded projection hash matches that bundled snapshot;
the hash alone does not establish source authority or the latest online
version. Missing, withheld, external or unavailable references stay
`UNRESOLVED`; a changed projection is `STALE`. Caller-provided revision strings
cannot make a link current. Historical records are rechecked with the same
rules, and changing essay text marks the essay stale. These statuses are
advisory and do not grant publication rights or substitute for human review.

Run `python3 -m unittest discover -s mcp -p 'test_*.py' -v` for protocol, real bundled passage, account API conflict and redirect tests. The account service in that test is a local mock; it does not prove a production deployment, Qwen call or Git publication.

Design references: [Bilara](https://github.com/suttacentral/bilara) uses stable segments; [OpenReview](https://github.com/openreview/openreview-py) provides role-scoped reviews; [Weblate](https://docs.weblate.org/en/latest/admin/memory.html) supports per-user translation memory. These inform the workflow; no code was copied from them.

## Optional Vidyut candidates

Install `vidyut==0.4.0` in the MCP server's isolated Python environment to
enable the read-only `vidyut_candidates` tool. It transliterates the exact
bundled source and records its source and projection hashes. Set
`SCHOLAR_VIDYUT_METERS` to a separately obtained, licensed Vidyut-compatible
meter file and explicitly request `meter: true` to obtain an experimental
classification. The file's hash is recorded; the tool does not modify any
translation layers. Verify source coverage and all candidates independently.
Vidyut code and each data/model package have separate rights.

Selected source notebook entries can be turned into public-safe passage
references using `prepare_citations`. Private notes are omitted. Attaching the
result to an essay, signing off and submitting remain separate actions. A public
submission requires the matching Worker and translation-work bridge checkpoints.


## Permissioned scholarly essays and enquiry drafting

With the matching ipvv #11 Worker and migration 0012, `list_published_essays`
returns exact published essay IDs and the author's current answer/draft grants.
`draft_with_qwen` accepts explicitly selected `scholar_essays` references and
`kind: enquiry` or `essay`; the Worker checks the author grant for that use.
`prepare_citations` accepts selected notebook IDs and/or explicit passage IDs.
Consent to send selected context is required per request. This client does not
provide a tool to change another author's permissions. The returned paragraph
references are traceable excerpts, not proof that the generated prose follows.
