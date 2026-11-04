# Scholar MCP bridge (local stdio)

Run `python3 mcp/scholar_server.py` as a local MCP stdio server (protocol 2025-06-18). Configure an MCP client with that command and the repository root as working directory. No packages or background service are required. Standard output is reserved for JSON-RPC; the server does not log drafts or credentials.

The server exposes the bundled, hash-checked Scholar projections and L0–L4 evidence and hash-checked version comparisons by stable passage ID, plus authenticated Scholar account operations for private documents, revision history, review requests, saved style examples, revision-bound private editorial decisions, a private source notebook and Qwen drafts. It does not expose sign-off or publication. Those remain explicit account actions. Ghaṭakarpara evidence is withheld pending upstream alignment repair. A matching hash does not establish philological correctness, completeness, human review, or the latest public version.

For account tools, set `SCHOLAR_API_ORIGIN` to the intended HTTPS Scholar backend and `SCHOLAR_SESSION_COOKIE` to the authenticated account's Cookie header value in the local MCP client's **private environment**. Never commit or share this value. HTTP is permitted only for loopback development. Redirects are disabled so a session cannot be forwarded to another host. The account and all data returned to the MCP client are sensitive; only use a trusted client. No account tools work until the existing Worker, account login and database migrations are deployed. Qwen requires its existing explicit consent, server-side credentials and quotas.

The API enforces account access, revision conflicts, review permissions and model consent. This bridge is a local client, not an authentication service. Do not expose it to untrusted clients or treat a caller's claims as human identity. It implements the initialization and tools subset needed here, not every optional MCP capability.

Run `python3 -m unittest discover -s mcp -p 'test_*.py' -v` for protocol, real bundled passage, account API conflict and redirect tests. The account service in that test is a local mock; it does not prove a production deployment, Qwen call or Git publication.

Design references: [Bilara](https://github.com/suttacentral/bilara) uses stable segments; [OpenReview](https://github.com/openreview/openreview-py) provides role-scoped reviews; [Weblate](https://docs.weblate.org/en/latest/admin/memory.html) supports per-user translation memory. These inform the workflow; no code was copied from them.
