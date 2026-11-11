# ChatGPT + OpenPāṭala — product north star

> **Owner direction, 2026-11-11.** This is the product contract for Svatantrya and the connected prx0r repositories. It describes the target; the live implementation status is recorded separately in [CHATGPT-PLUGIN.md](CHATGPT-PLUGIN.md) and the repository gates.

## Product direction

The primary work surface is a ChatGPT conversation connected to the scholarly estate. The user should be able to ask a question in ordinary language and have ChatGPT select the right repository tools, explain the evidence, produce a useful draft or lesson, and move approved work forward.

ChatGPT is the **roboscholar, essay writer, Pushing companion, Sanskrit tutor, practice guide, media producer, and content pusher**. It is the reasoning and authoring layer. The repositories remain the source of their own data, rules, evidence, and production gates.

OpenPāṭala is the **control plane and visible control panel**: it identifies works, editions, and passages; links evidence and provenance; shows what each system can do; and helps ChatGPT choose the next safe operation. It is not itself the authority for a Sanskrit reading, translation, or scholarly conclusion.

The intended loop is:

1. Resolve the work and passage through OpenPāṭala.
2. Retrieve source-bounded material and rights from Svatantrya, IPVV, or translation-work.
3. Let ChatGPT explain, compare, teach, question, or draft from that material.
4. Run the relevant validation, review, book, or video tools.
5. Save and push work through a reviewable branch and pull request.
6. Keep human approval at scholarly sign-off and public release.

## System responsibilities

| System | What ChatGPT uses it for | Boundary |
|---|---|---|
| **ChatGPT** | Research, synthesis, essays, Pushing questions, Sanskrit teaching and practice, media planning, and authorized content changes. | A model response is not evidence or human approval. Claims must point back to returned sources and statuses. |
| **OpenPāṭala** | Canonical work, edition, and passage identity; dossiers; bibliography search; provenance and workflow navigation. | Identity and machine status do not establish philological truth. |
| **svread** | Reader and evidence surfaces, claim pages, scholar documents, essay audit and pushback, Sanskrit wheels, lessons, and practice. | BLOCKED English stays hidden; machine derivations stay labelled as such; scholar review remains human. |
| **trika-x** | Federated tool routing, formal traces, proofs, bridge coverage, and checkability. | A proof or certificate establishes only the property it checks; it is not a reading or interpretation. |
| **IPVV + translation-work** | The IPVV source and translation process, from frozen source through translation layers, argument maps, gates, and review. | Machine proposals remain proposals; blocked or incomplete layers never become accepted by implication. |
| **bookfactory** | Book structures, entries, audio plans, EPUBs, and packages. | A completed package is not permission to publish it. |
| **videofactory** | Video projects, units, render preparation, gate checks, and final assets. | Rendering and publication remain gated by the existing owner-approval rules. |

OpenPāṭala remains the shared identity layer while each repository owns its data and writes. Cross-repository outputs should carry stable work and passage IDs, source references, byte hashes where available, rights or licence, review state, and a clear place to retrieve the underlying evidence.

## ChatGPT connector and plugin shape

The live entry point is the authenticated MCP connector documented in [CHATGPT-PLUGIN.md](CHATGPT-PLUGIN.md). It currently gives ChatGPT one remote connection with service-prefixed tools. That is the useful starting shape: one conversation can coordinate the estate without maintaining a second copy of every repository API.

The connected private **Svatantrya Sanskrit** ChatGPT app is a focused reader assistant today. It exposes five actions: list works, lexically search selected works, retrieve hash-checked passage evidence, audit essay citations, and return the essay drafting guide. It is not yet the OpenPāṭala-led control panel or a multi-repository write/push app.

Keep each tool group close to the repository that owns its data. OpenPāṭala is the default control surface; Scholar, federation, translation, BookFactory, VideoFactory, and workspace tools do the domain work. Separate ChatGPT Apps or plugin packages can be added when they provide a real permission boundary or a focused interface. They should route to the same source-owned tools rather than copy logic or data.

Use the live [estate index](https://svatantrya.net/data/estate-index.json) as the generated discovery map for repositories, assets, endpoints, tool routes, and plugin recipes. Its current recipes give us a practical first plugin set:

| ChatGPT surface | Estate-index recipe | Main use |
|---|---|---|
| OpenPāṭala Control | Bibliography explorer | Resolve works, inspect dossiers, and see what needs sources or translation. |
| Svatantrya Scholar | Wheel tutor + Reader with evidence | Ground research in passages, versions, hashes, grammar tools, lessons, and certificates. |
| Trika-X | Formal evidence browser | Navigate formal evidence, bridges, and gaps. |
| IPVV + translation-work | Translation QA | Inspect source and layers, validate coverage, review gates, and return honest blocked states. |
| BookFactory | Book builder | Inspect a lane, build entries, and run its gate. |
| VideoFactory | Video/seal pipeline | Read project and unit state, then prepare gated media work. |
| AOC, optional | Campaign carousels | Keep the separate carousel product line available without mixing it into Sanskrit research. |

The estate index is the navigation layer; OpenPāṭala supplies work identity and provenance. ChatGPT chooses the route and explains what each tool returned.

The control plane should expose a concise capability and status map: which work is identified, which evidence is available, which gate is next, which service can run it, and what result came back. ChatGPT performs the cross-system reasoning and tells the user when a service is missing, stale, blocked, or only machine-derived.

## Replace Qwen with ChatGPT

The current Pushing prototype and Scholar tools still contain Qwen-backed drafting and challenge calls. For work initiated in ChatGPT, ChatGPT itself should compose the answer, essay, lesson, or media brief. MCP tools should supply bounded source material, permission checks, storage, audit, and workflow actions. The ChatGPT route should not call Qwen as a second model behind the conversation.

For Pushing, ChatGPT receives only the branch and evidence the user selected, respects essay permissions, and proposes additions for the user to accept. It can save a private draft, run the existing citation and claim checks, and request pushback. A saved draft remains AI-assisted until reviewed. The legacy Qwen path should be removed from the ChatGPT-facing workflow once this route passes its acceptance checks.

A standalone website that generates text outside a ChatGPT conversation would need its own server-side model integration. That is a separate product surface; it should not be confused with ChatGPT using the estate's MCP connector.

## Writing, pushing, and release boundaries

ChatGPT should be able to create or update repository content, explain the diff, commit on a feature branch, and push that branch or open a pull request when the user has asked it to. Protected default branches remain untouched. Each change should carry its source links, validation state, and a reviewable summary.

The current workspace MCP can read, write, patch, and commit, but its Git tool does not push. A dedicated, least-privilege branch-push and pull-request action is therefore part of the content-pusher work. It should not be implemented as unrestricted shell access.

No tool may silently sign, promote, merge, or publish a scholarly result. Human review stays attached to the exact revision. A public release requires its existing gates and explicit owner approval. User consent is required before storing personal practice progress or using private material.

Carry the existing project rules through every plugin:

- **BLOCKED is not PASS.**
- **DERIVED is not truth.**
- **MACHINE_PROPOSED is not ACCEPTED.**
- Preserve bytes, mechanics, and human meaning as separate evidence.
- A missing or failed child tool must be reported honestly; it must never become a fabricated success.

## Current integration gaps

The endpoint health check returned seven servers during this review. [CHATGPT-PLUGIN.md](CHATGPT-PLUGIN.md) and the checked-in registry report 197 tools, while the live estate index reports 198 and names `workspace__estate_index` in its `read_first` tools. That operation is absent from the checked-in generated catalogue and workspace server. Reconcile the authenticated `tools/list`, estate-index generator, and deployed code before treating either count as final. The connector uses one shared bearer credential; per-user OAuth and fine-grained identity scopes are not in place.

The focused ChatGPT app is operational for a bounded passage workflow: an IAST search for `anuttara` found `anuttarastika:anu-p03`, and passage retrieval returned its GRETIL source, projection hash, layered material, and claim-page URL. That response included a source-license label but an empty `rights` object; publishing and reuse must not treat that as cleared rights. A Devanāgarī query (`शिव`) was rejected by the search validator, so the Sanskrit tutor needs verified Devanāgarī search as well as IAST, lessons, and practice actions. A lexical query that returns no hit must be treated as a retrieval limit, not evidence that a term or passage is absent.

The live groups include Scholar, OpenPāṭala, the trika-x federation, BookFactory, VideoFactory, AOC, and the scoped workspace editor. Translation operations are available through the federation/CLI route rather than a standalone ChatGPT server. IPVV itself does not appear as a first-class server group in the published connector; its legacy worker /mcp is not the production estate entry point. A dedicated IPVV tool group and a clearer translation-work interface are still needed for the full domain-plugin vision.

The estate index distinguishes the 2,051-work authority digest from its 1,034-work local mirror; [PRODUCTION.md](PRODUCTION.md) records a 555-work OpenPāṭala box database. The control surface must identify which catalogue a result came from and expose the mismatch, rather than presenting the counts as interchangeable.

The workspace editor intentionally has no push operation today. This is a real gap for the requested content-pusher role. The live tool map and limits belong in [CHATGPT-PLUGIN.md](CHATGPT-PLUGIN.md); [MCP-INTEGRATION.md](MCP-INTEGRATION.md) is the earlier bridge and OAuth design record, not the current live-status document.

## Delivery order

1. **Make the control plane useful.** Keep OpenPāṭala resolution and provenance central; add a readable capability map and workflow status across the connected repositories.
2. **Make research and learning dependable in ChatGPT.** Exercise source lookup, passage evidence, wheel lookup, lessons, and practice from a fresh connected chat. Keep progress writes consent-gated.
3. **Move Pushing and essay drafting to ChatGPT.** Use selected branches and permissioned evidence, then save, audit, and request pushback through Scholar. Retire the Qwen-backed ChatGPT path after acceptance.
4. **Complete IPVV and translation-work access.** Give those workflows clear, scoped tool groups and return their actual layer and gate states and source lineage.
5. **Connect media production.** Let ChatGPT prepare book and video jobs, check their gates, and retrieve artifact links without treating preparation as publication.
6. **Add a reviewable content-push action.** Push user-authorized feature branches and open PRs; keep protected-branch merges and public release under human control.

## Definition of done

- From one ChatGPT conversation, a user can resolve a work in OpenPāṭala and retrieve its source-bounded passage evidence through Scholar.
- A Sanskrit lesson follows the published wheel sequence and reports the source's verification status for each form.
- An essay or Pushing response is produced by ChatGPT, cites the exact selected evidence, can be saved privately, and returns audit or pushback results without an automatic sign-off.
- IPVV and translation-work actions expose their real layer and gate state; no blocked item is promoted.
- Book and video requests return their current job state and artifacts; release actions still require the designated human gate.
- A content change can be committed on a feature branch, pushed, and opened as a PR with a clear diff summary and validation state. ChatGPT never pushes straight to a protected default branch.
- The OpenPāṭala control surface shows what is known, what is missing, and which system owns the next action.
