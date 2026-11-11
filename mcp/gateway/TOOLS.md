# MCP tool catalogue (generated)

Generated from a live probe of the gateway. Regenerate with
`python3 gateway.py --list > TOOLS.md` after editing servers.json.

scholar__list_works                                      List available bundled Scholar projections.
scholar__passage_evidence                                Read hash-checked Sanskrit and editorial layers for a passag
scholar__list_versions                                   List stored versions for an exact passage and layer.
scholar__compare_versions                                Compare two hash-checked versions for an exact passage and l
scholar__vidyut_candidates                               Generate unreviewed transliteration and optional metre candi
scholar__list_documents                                  List this account’s private documents for a work.
scholar__document_history                                Read this account’s private document revision history.
scholar__list_reviews                                    List reviews accessible to this account.
scholar__list_review_annotations                         List private selected-text comments for an accessible review
scholar__add_review_annotation                           Comment on exact UTF-16 offsets in an immutable review snaps
scholar__list_style_examples                             List this account’s explicitly saved private edit examples.
scholar__list_source_links                               List your private typed source relationships.
scholar__save_source_link                                Save a private relationship between two owned sources.
scholar__delete_source_link                              Remove an owned private source relationship.
scholar__list_published_essays                           List published essay versions and their author-approved AI u
scholar__list_sources                                    List your private source notebook.
scholar__save_source                                     Save a hash-pinned private source reference.
scholar__prepare_citations                               Prepare citation references from selected notebook sources a
scholar__delete_source                                   Remove an owned source reference.
scholar__list_decisions                                  List your private revision-bound editorial decisions.
scholar__save_decision                                   Save a private editorial decision against an owned revision.
scholar__delete_decision                                 Remove an owned private editorial decision.
scholar__save_document                                   Save a private draft with expected_revision; conflicts are r
scholar__request_review                                  Request private review of an exact saved revision.
scholar__draft_with_qwen                                 Request an agent draft; the Scholar API requires explicit co
scholar__search_texts                                    Semantic search over the gate-labeled corpus (passages, prob
scholar__text_themes                                     Themes evidence for a work or ref: labels, core claims, cert
scholar__audit_draft                                     Check markers and quotes against same-paragraph sources. Sup
scholar__link_claims                                     Build a revision-bound claim table. CURRENT means the record
scholar__check_claim_staleness                           Recheck a claim table against the essay and local bundled pr
scholar__pushback                                        Revision-bound candidate issues (failed quotes, uncited para
scholar__wheel_harness                                   Learning-harness map: stages, gates, tutor files, verify sum
scholar__wheel_lookup                                    Look up one Sanskrit form in the vendored grammar pack: glos
scholar__wheel_verify                                    Prove one form fast: AGREE / DISAGREE_STANDS / MACHINE_GAP /
scholar__wheel_level                                     Get one tutor level prompt (goal, rules, drills, gate) by nu
scholar__wheel_certificate                               Derivation certificate for one form: stored cert + live tier
scholar__resolve_ref                                     Resolve any shared-language ID (work/chunk/tension/crux/essa
scholar__ref_links                                       Every ID connected to the given one — tension is the hub, li
openpatala__resolve                                      Resolve a Sanskrit work name to a canonical entity.
openpatala__get_bundle                                   Get full dossier for a work (assertions, external IDs, prove
openpatala__search                                       Search for Sanskrit works by title.
openpatala__get_frontier                                 List works needing translations or sources.
openpatala__get_health                                   Check system health.
federation__openpatala__resolve                          Resolve a work to ledger + openpatala identity block (UNRESO
federation__openpatala__coverage                         Source-map coverage: ledger works bridged vs todo (witnesses
federation__federation__guide                            How an agent navigates openpatala -> translation -> scholar 
federation__formal__trace                                Full Sanskrit-to-essay trace bundle for one chunk (bytes, la
federation__formal__bridge                               Resolve chunk:<locator> to work/edition/etext rows; witness 
federation__formal__evidence                             EVIDENCE rows for one theorem, or registry counts. Refs are 
federation__formal__table                                TABLE readings: theorem beside its plain-English scope note 
federation__formal__gaps                                 Treeka formal column: covered vs total chunks + the gap list
federation__formal__runs                                 Runs ledger: harness verdicts + receipt count (never reruns 
federation__formal__axioms                               Axiom audit state (static half; kernel verdict needs pinned 
federation__scholar__list_works                          [scholar] List available bundled Scholar projections.
federation__scholar__passage_evidence                    [scholar] Read hash-checked Sanskrit and editorial layers fo
federation__scholar__list_versions                       [scholar] List stored versions for an exact passage and laye
federation__scholar__compare_versions                    [scholar] Compare two hash-checked versions for an exact pas
federation__scholar__vidyut_candidates                   [scholar] Generate unreviewed transliteration and optional m
federation__scholar__list_documents                      [scholar] List this account’s private documents for a work.
federation__scholar__document_history                    [scholar] Read this account’s private document revision hist
federation__scholar__list_reviews                        [scholar] List reviews accessible to this account.
federation__scholar__list_review_annotations             [scholar] List private selected-text comments for an accessi
federation__scholar__add_review_annotation               [scholar] Comment on exact UTF-16 offsets in an immutable re
federation__scholar__list_style_examples                 [scholar] List this account’s explicitly saved private edit 
federation__scholar__list_source_links                   [scholar] List your private typed source relationships.
federation__scholar__save_source_link                    [scholar] Save a private relationship between two owned sour
federation__scholar__delete_source_link                  [scholar] Remove an owned private source relationship.
federation__scholar__list_published_essays               [scholar] List published essay versions and their author-app
federation__scholar__list_sources                        [scholar] List your private source notebook.
federation__scholar__save_source                         [scholar] Save a hash-pinned private source reference.
federation__scholar__prepare_citations                   [scholar] Prepare citation references from selected notebook
federation__scholar__delete_source                       [scholar] Remove an owned source reference.
federation__scholar__list_decisions                      [scholar] List your private revision-bound editorial decisio
federation__scholar__save_decision                       [scholar] Save a private editorial decision against an owned
federation__scholar__delete_decision                     [scholar] Remove an owned private editorial decision.
federation__scholar__save_document                       [scholar] Save a private draft with expected_revision; confl
federation__scholar__request_review                      [scholar] Request private review of an exact saved revision.
federation__scholar__draft_with_qwen                     [scholar] Request an agent draft; the Scholar API requires e
federation__scholar__search_texts                        [scholar] Semantic search over the gate-labeled corpus (pass
federation__scholar__text_themes                         [scholar] Themes evidence for a work or ref: labels, core cl
federation__scholar__audit_draft                         [scholar] Check markers and quotes against same-paragraph so
federation__scholar__link_claims                         [scholar] Build a revision-bound claim table. CURRENT means 
federation__scholar__check_claim_staleness               [scholar] Recheck a claim table against the essay and local 
federation__scholar__pushback                            [scholar] Revision-bound candidate issues (failed quotes, un
federation__scholar__wheel_harness                       [scholar] Learning-harness map: stages, gates, tutor files, 
federation__scholar__wheel_lookup                        [scholar] Look up one Sanskrit form in the vendored grammar 
federation__scholar__wheel_verify                        [scholar] Prove one form fast: AGREE / DISAGREE_STANDS / MAC
federation__scholar__wheel_level                         [scholar] Get one tutor level prompt (goal, rules, drills, g
federation__scholar__wheel_certificate                   [scholar] Derivation certificate for one form: stored cert +
federation__scholar__resolve_ref                         [scholar] Resolve any shared-language ID (work/chunk/tension
federation__scholar__ref_links                           [scholar] Every ID connected to the given one — tension is t
federation__bookfactory__factory_overview                [bookfactory] Start here. Returns bookfactory goal, lanes, m
federation__bookfactory__list_lanes                      [bookfactory] List every lane with registry stage, project s
federation__bookfactory__check_lane                      [bookfactory] Run the only gate (check.py). Returns canonica
federation__bookfactory__next_actions                    [bookfactory] Agent worklist: blocking problems, due-later p
federation__bookfactory__read_thesis                     [bookfactory] Read a thesis: book lane thesis (book=) or a p
federation__bookfactory__list_specs                      [bookfactory] List specs/, templates/, and styles/ available
federation__bookfactory__read_template                   [bookfactory] Read a genre template JSON (entry_anatomy, lay
federation__bookfactory__read_entries                    [bookfactory] Read prints/<book>/entries.json (all entries o
federation__bookfactory__read_book                       [bookfactory] Read prints/<book>/book.json (meta, sections, 
federation__bookfactory__read_decisions                  [bookfactory] Read projects/<book>/decisions.jsonl — every c
federation__bookfactory__read_docs                       [bookfactory] Read a root markdown doc: FACTORY-SPEC | BOOKS
federation__bookfactory__read_file                       [bookfactory] Read any file under bookfactory (relative path
federation__bookfactory__list_dir                        [bookfactory] List a directory under bookfactory (relative p
federation__bookfactory__inspect_verse                   [bookfactory] factory inspect: exact translation-layer verse
federation__bookfactory__read_rule_boxes                 [bookfactory] Read foundational rule boxes for a lesson-book
federation__bookfactory__decide                          [bookfactory] Append a justified construction decision. acti
federation__bookfactory__new_book                        [bookfactory] Scaffold a new lane. Prefer thesis= (path or s
federation__bookfactory__stage                           [bookfactory] Advance a lane stage (verified; failing checks
federation__bookfactory__audio_plan                      [bookfactory] Write prints/<book>/audio-plan.json (NO API ca
federation__bookfactory__epub                            [bookfactory] Build+validate reflowable EPUB3 for a book (af
federation__bookfactory__package                         [bookfactory] Assemble customer package (EPUB + PDF + audio 
federation__bookfactory__quote_preview                   [bookfactory] DRAFT quote postcard/social previews (watermar
federation__translation__status                          [translation] SMALL+LARGE entry point: work state — REGISTRY
federation__translation__validate                        [translation] Run the deterministic gates: validate_song (sc
federation__translation__lore                            [translation] Return the cached 1-page transmission brief fo
federation__translation__swarm_status                    [translation] Queue at a glance: pending/claimed/done/failed
federation__translation__swarm_seed                      [translation] Seed swarmable triple tasks (gloss+CM+argmap+L
federation__translation__swarm_review                    [translation] Assessor review packet for one DONE task: draf
federation__translation__swarm_decide                    [translation] Approve or bounce a reviewed task. Bounce note
federation__translation__promote                         [translation] Assessor promotion: assemble runs -> working f
federation__translation__skill                           [translation] Return the governing SKILL.md for a lane (the 
federation__translation__concepts                        [translation] Grounds for hand-glossing: concept-database en
federation__translation__gates                           [translation] The one gate (SKILL largetext §10): manifest f
federation__translation__recon                           [translation] Recon report for a work (read-only): source sp
federation__translation__assemble                        [translation] Assessor act: assemble beam runs -> working-T1
federation__translation__supervise                       [translation] Report the autonomous loop: continue.sh (regis
federation__translation__swarm_workers                   [translation] Beam-worker throttle (don't pound the free tie
federation__translation__review_sweep                    [translation] Run the assessor daemon sweep: mechanical verd
federation__video__vf_projects                           [video] Discover render lanes (projects/*/project.json): nam
federation__video__vf_status                             [video] Factory board: render-gate mode, milestones, locks, 
federation__video__vf_units                              [video] Per-unit stage table for a lane (tantrasara 22, shiv
federation__video__vf_unit                               [video] Deep unit state: storyboard sha, approval, issues, f
federation__video__vf_issues                             [video] Full issues file for a unit (kinds route to skills; 
federation__video__vf_gate                               [video] Evaluate the ONLY render gate: storyboard green + ow
federation__video__vf_logs                               [video] Tail a factory log (batch, overnight, batch_ch14_ret
federation__video__vf_finals                             [video] Shipped finals for a lane: sizes, verify/ship verdic
federation__video__vf_skills                             [video] Issue-kind to skill lookup (core/skills/REGISTRY.jso
federation__video__vf_skill                              [video] Full fix prescription for an issue kind (the linked 
federation__video__vf_triage                             [video] Action list for a unit: gate verdict, per-issue skil
federation__video__vf_skill_propose                      [video] Stage a new or updated issue skill (writes core/skil
federation__video__vf_check                              [video] Run the canonical factory gate (check.py). Exit 0 = 
federation__video__vf_tests                              [video] Run the factory test suite (quick subset default; fu
federation__video__vf_launch                             [video] Render one unit detached (batch --ship). Enforces th
federation__video__vf_queue                              [video] Queue a gated render into the next video-path gap (w
federation__video__vf_publish                            [video] Publish a file to R2 (copyto, mount-flake tolerant) 
federation__video__vf_pack                               [video] Zip shipped finals for comma unit ids (stored, no re
federation__openpatala_mcp__resolve                      [openpatala_mcp] Resolve a Sanskrit work name to a canonical
federation__openpatala_mcp__get_bundle                   [openpatala_mcp] Get full dossier for a work (assertions, ex
federation__openpatala_mcp__search                       [openpatala_mcp] Search for Sanskrit works by title.
federation__openpatala_mcp__get_frontier                 [openpatala_mcp] List works needing translations or sources.
federation__openpatala_mcp__get_health                   [openpatala_mcp] Check system health.
bookfactory__factory_overview                            Start here. Returns bookfactory goal, lanes, milestones, doc
bookfactory__list_lanes                                  List every lane with registry stage, project stage, thesis t
bookfactory__check_lane                                  Run the only gate (check.py). Returns canonical flag + full 
bookfactory__next_actions                                Agent worklist: blocking problems, due-later problems, open 
bookfactory__read_thesis                                 Read a thesis: book lane thesis (book=) or a pre-lane spec (
bookfactory__list_specs                                  List specs/, templates/, and styles/ available to instantiat
bookfactory__read_template                               Read a genre template JSON (entry_anatomy, layout, provenanc
bookfactory__read_entries                                Read prints/<book>/entries.json (all entries or one by entry
bookfactory__read_book                                   Read prints/<book>/book.json (meta, sections, trim, target_p
bookfactory__read_decisions                              Read projects/<book>/decisions.jsonl — every construction ch
bookfactory__read_docs                                   Read a root markdown doc: FACTORY-SPEC | BOOKS | PIPELINE | 
bookfactory__read_file                                   Read any file under bookfactory (relative path, no ..). Set 
bookfactory__list_dir                                    List a directory under bookfactory (relative path).
bookfactory__inspect_verse                               factory inspect: exact translation-layer verse + gate state.
bookfactory__read_rule_boxes                             Read foundational rule boxes for a lesson-book (default lear
bookfactory__decide                                      Append a justified construction decision. action: add-sectio
bookfactory__new_book                                    Scaffold a new lane. Prefer thesis= (path or specs name e.g.
bookfactory__stage                                       Advance a lane stage (verified; failing checks refuse forwar
bookfactory__audio_plan                                  Write prints/<book>/audio-plan.json (NO API calls / no Fish 
bookfactory__epub                                        Build+validate reflowable EPUB3 for a book (after content ex
bookfactory__package                                     Assemble customer package (EPUB + PDF + audio + sha256 manif
bookfactory__quote_preview                               DRAFT quote postcard/social previews (watermarked, never a s
videofactory__vf_projects                                Discover render lanes (projects/*/project.json): names, seri
videofactory__vf_status                                  Factory board: render-gate mode, milestones, locks, live bui
videofactory__vf_units                                   Per-unit stage table for a lane (tantrasara 22, shiva-sutras
videofactory__vf_unit                                    Deep unit state: storyboard sha, approval, issues, final siz
videofactory__vf_issues                                  Full issues file for a unit (kinds route to skills; open vs 
videofactory__vf_gate                                    Evaluate the ONLY render gate: storyboard green + owner appr
videofactory__vf_logs                                    Tail a factory log (batch, overnight, batch_ch14_retry, chai
videofactory__vf_finals                                  Shipped finals for a lane: sizes, verify/ship verdicts, publ
videofactory__vf_skills                                  Issue-kind to skill lookup (core/skills/REGISTRY.json): whic
videofactory__vf_skill                                   Full fix prescription for an issue kind (the linked skill ma
videofactory__vf_triage                                  Action list for a unit: gate verdict, per-issue skill routin
videofactory__vf_skill_propose                           Stage a new or updated issue skill (writes core/skills/<kind
videofactory__vf_check                                   Run the canonical factory gate (check.py). Exit 0 = CANONICA
videofactory__vf_tests                                   Run the factory test suite (quick subset default; full takes
videofactory__vf_launch                                  Render one unit detached (batch --ship). Enforces the render
videofactory__vf_queue                                   Queue a gated render into the next video-path gap (waiter pa
videofactory__vf_publish                                 Publish a file to R2 (copyto, mount-flake tolerant) + byte-v
videofactory__vf_pack                                    Zip shipped finals for comma unit ids (stored, no recompress
aoc__aoc_status                                          What the factory can do: templates, segments, hooks, receipt
aoc__aoc_hooks                                           Hook bank for a segment (electrician|beautician|plumber|sole
aoc__aoc_build                                           Build a carousel locally (PNGs+ZIP, gates enforced, no publi
aoc__aoc_validate                                        Run proof+gates on a plan WITHOUT rendering. Cheap quality c
aoc__aoc_inspect                                         Show pipeline graph, receipts chain, or proofs
aoc__aoc_lineage                                         content_id -> zip attachment log
aoc__aoc_measure                                         Record performance into receipt chain + namespaced memory
aoc__aoc_publish                                         Publication packet (asset + checklist). Marks nothing publis
aoc__aoc_publish_confirm                                 Confirm manual post with real post URL. Requires prior appro
aoc__aoc_rank                                            Rank creatives by leads/sales from namespaced memory
aoc__aoc_receipts                                        Verify receipt chain integrity
aoc__aoc_backup                                          Back up a built carousel to R2 (needs R2_* env). Writes back
aoc__aoc_review                                          Run the 15-point review: automated checks now, human items q
aoc__aoc_signoff                                         Record human verdict: approved|revise|rejected with reason
aoc__aoc_metrics                                         Append a raw metrics snapshot (manual/Studio CSV/API). Never
aoc__aoc_learn                                           Compile snapshots into namespaced creative learnings
aoc__aoc_score                                           Score prospects from CSV (density+diversity, age unknown wit
aoc__aoc_funnel                                          Acquisition funnel counts (leads, qualified, paid, revenue, 
aoc__aoc_campaign                                        Create a campaign and link one approved creative. Refuses du
aoc__aoc_personalize                                     Build one per-business variant (identity tokens only, resear

212 tools across 6 servers
