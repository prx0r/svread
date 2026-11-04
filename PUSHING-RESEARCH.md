# Pushing, Logicvid and essay research — working index

This is a navigation and implementation handoff, not an evaluation of every
philosophical claim. The exact upstream paths, repository commits and Git blob IDs
are indexed in `data/pushing-source-index.json`; no source corpus is copied into
this repository. Regenerate the index with `scripts/index_pushing_research.py`
and three checkouts containing the pinned commits.

## Where the original material actually lives

- **Pāṭala:** `prx0r/patalacheckpoints` at `634d3cc…` contains `docs/vision/`,
  including `essayguide.md`, `vision-06-adversarial-review.md`,
  `vision-07-new-scholar.md` and `education/PATALA-EDUCATION-SYNTHESIS.md`.
  It also contains `machinelearning/research/patala_ml/pushing.py`,
  `essay_compiler.py`, the essay worker and essay-review benchmark examples.
- **Original Logicvid / Pushing source:** the current Pāṭala checkout does not have
  the `research-library` folder. It is in `prx0r/the-library` at `088b73f…`, under
  `research-library/pushing/` and `_source/`. This includes `logic5`, `logic6`,
  `logic7`, `logicdog`, both `logicframework` files, `logicvid3`, the method,
  questionnaires and the Tantrāloka/IPVV pushing indexes.
- **Worked sessions and examples:** `prx0r/ipvv` at `941ac2e…` contains
  `site/data/pushing/` including 36 `LOGICVID-session` files, extracts and the
  session index. The library's top-level `ESSAY-*` and `THREE-ESSAYS-*` files are
  examples of an argument advancing through tensions and open threads. They are
  working research, not a gold corpus or permission to reuse quoted scholarship.

## What matters for the implementation

1. `logicvidsmethod` specifies **construct → prosecute → provenance audit**:
   distinguish what a text says, an inference, an objection and a real boundary.
   The source-facing question is not a generic prompt; it grows from a difficulty
   in the material. Compression, attribution and cross-tradition bridges can fail.
2. `logic5/6` distinguish manifestation, self-awareness, self-validation and the
   unproved move from a local perspective to a universal subject. `logicdog` tests
   the hardest concrete case and distinguishes resemblance from identity.
   `logicframework*` separates levels and labels what is asserted, reconstructed,
   comparative or unresolved. These are positions to inspect, not established facts.
3. `logicvid3` asks for questions to retain ancestry and for independent branches
   to converge without losing their context. A local typed tree is the current
   prototype; no convergence score or shared knowledge graph is claimed yet.
4. Pāṭala's essay guide asks for a **question, a thesis, support, objection,
   response and unresolved boundary**, with source references and the author's own
   contribution distinct from reported textual or scholarly positions. Its audit
   history explicitly warns that resolvable IDs alone do not prove a sentence is
   actually supported. Do not promote a generated essay on a schema check alone.
5. The education vision starts with small actions like selecting a passage,
   attaching a premise and identifying a crux. A learner's response is not proof
   of mastery. Review must target the exact essay revision and identify who judged it.
6. The old `patala_ml/pushing.py` extractor marks some extracted gems
   `WELL_SUPPORTED` by heuristic; that label is not evidence of human review or
   a validated inference. Preserve it as a historical machine proposal only.

## Rights and release boundary

Existing signed essay snapshots have rights declarations, but a publication or a
copyright licence alone does not establish permission to send a scholar's essay
to a model or use it for another author's drafting. The working flow must require
an explicit grant from the authenticated author, scoped to the exact published
version and to the intended use, with revocation for future requests. Never infer
permission from a file being present in a public repository. Private chat, drafts,
style examples and review feedback remain private and require their existing
consent rules. All AI output is a draft and can contain unsupported claims.
