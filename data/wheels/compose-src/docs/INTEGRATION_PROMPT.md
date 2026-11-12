# One-prompt handoff for the Svatantrya coding agent

Integrate the attached **Svatantrya Sanskrit Generative Wheels v2** into the **existing** Svatantrya Sanskrit tutor website/plugin without replacing its site design or routes.

The package contains 15 grammatical wheel families with 4 progressive variants each (60 levels). Every lesson has exactly five operative rings; one wheel family is a reusable sentence-generating mechanism, not a collection of separate mini-apps. For instance, family 2 evolves 2.1 basic opinion → 2.2 preference → 2.3 opinion because reason → 2.4 interests, and future levels stay inside the same family.

Use `docs/CODING_AGENT_DIRECTIVE.md` as the main implementation spec, `docs/STUDY_ORDER.md` as the exact pedagogical order (NOT family-number order), and `docs/CURRICULUM_MAP.json` as machine-readable dependency/neighbor data. Preserve stable level IDs. Port `src/core.js`, family modules, `src/curriculum.js`, and existing tests into the site's idiom. Implement daily focus (10–15 minutes), self-grading, ready-to-level-up versus spaced mastery, and free neighbor exploration without hard-locks. Reuse authorised per-account storage only after confirming its real API, and do not claim voice/audio assessment without verified recognition.

Do not invent Sanskrit forms, cite made-up verses, or concatenate arbitrary morphemes to fabricate words. Keep reviewed Sanskrit, IAST, English and structural role aligned. Run the 9,507-path generator test, curriculum graph test, browser UI checks and human Sanskrit editorial review before enabling strict correctness judgments. Produce an incremental PR describing completed work and unverified pieces. Do not build a new website or claim deployment absent live verification.
