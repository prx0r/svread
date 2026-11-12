# Verification and limitations

## Verified mechanically

- 6 registered families, 24 levels, 5 rings per level.
- 4,755 resolvable selection combinations generate complete `dev`, `roman`, `en` output objects.
- Branch-specific answer lists and verb objects change when the question/verb changes.
- Specific tests cover: respectful vs familiar second-person verb agreement; age 27; present, imperfect and future model forms; singular vs plural; rejection/normalisation of incompatible dependent options.
- UI smoke pass in browser rendering: SVG interactions, family switching, version switching, answer reveals, hidden transformation targets, marking practise and phone-size no horizontal overflow.

## Not yet verified

- This is a curated grammar-teaching prototype, **not an audited philological corpus**. Exhaustive generation tests catch broken paths and missing fields, not nuanced errors in inflection, sandhi or semantics.
- All examples require expert review before public publishing or use as a strict correction oracle, especially 3.4 (narrative tenses), 4.3 (comparatives), 5.3–5.4 (constructed reasoning) and tense-dependent verb forms.
- 5.x statements about Trika are original educational sentences; they are not verified quotations or doctrinal proof.
- Some cross-ring combinations are linguistically grammatical but argumentative or semantically odd on purpose. Semantic plausibility could be further constrained.
- The learner answering 1.x is assumed masculine for gendered wellbeing adjectives. The addressee gender switch does not set respondent gender, which should be a separate future preference.
- English glosses paraphrase the exercise and may simplify aspect or social registers.
- Local progress lives in browser `localStorage` and is NOT account-linked. Export is a local JSON download; no upload or automatic import.
- Voice input/output, microphone, pronunciation assessment, user profiles, server integration, GitHub publishing and MCP plugin wiring are **not** included.

## Targeted next QA

1. Have a qualified Sanskrit reader vet each family, especially 3.x and 5.x.
2. Add independently reviewed test fixtures for person/gender/case/sandhi and all generated learner-facing lines.
3. Add task-aware ring interactions that can be exposed by a ChatGPT tutor via stateful plugin calls.
4. Keep new content behind review gates and trace source editions for sourced expressions.
