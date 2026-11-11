<!-- status: owner verbatim audit — never edit; findings tracked in REVIEW-FINDINGS.md -->

> **Status (2026-11-11):** owner verbatim audit — never edit; findings tracked in REVIEW-FINDINGS.md.

# Sanskrit AI ecosystem audit, November 2026

Repositories: `translation-work` · `svread` · `trika-x` · Treeka

## Initial findings

There are some genuinely significant developments worth investigating, particularly from October 2026. The strongest opportunities are not another general-purpose chatbot. They are Sanskrit-specific translation models, substantial new parallel corpora, linguistic analysis systems, and tools for checking translations against actual textual evidence.

Two especially important discoveries:

- MITRA-MT (October 2026): A newly published open-weight model for translating between classical Asian languages, including Sanskrit, Tibetan, and Classical Chinese. It comes with evaluation resources and a large parallel corpus.&#x20;

  [image](https://www.google.com/s2/favicons?domain=https://aclanthology.org\&sz=32)

  aclanthology.org

- Mitrasaṃgraha (October 2026): A Sanskrit–English translation dataset containing 391,548 aligned sentence pairs, including manually corrected development and test sets. Its evaluations explicitly identify compound interpretation and philosophical terminology as continuing weaknesses. That makes it highly relevant to Abhinavagupta.&#x20;

  [image](https://www.google.com/s2/favicons?domain=https://aclanthology.org\&sz=32)

  aclanthology.org


I also accessed the live GitHub repositories through the connected GitHub account. Direct `git clone` is blocked by DNS in this environment, so I am inspecting their actual repository files and metadata instead. This is a source-level review, but not a locally executed full test suite.

One naming clarification: I couldn't find a separate `prx0r/treeka` repository. Treeka appears to be implemented within `trika-x`, including its reporting and formal-analysis tools.

## 1. Live repository health

[translation-work](https://github.com/prx0r/translation-work?utm_source=chatgpt.com)

Scholarly review outstanding

Latest checked commit: `fe1c2e5`, November 11. Its registry declares 95/95 works gold, but the project's own documentation says these are machine-proposed, not 95 human-approved critical translations. The newer commits mainly update the machine-work plan and manifests.

[svread](https://github.com/prx0r/svread?utm_source=chatgpt.com)

CI failing

Latest checked commit: `ec722e3`, November 11. GitHub Actions reports 68 passing, 4 failing, 12 skipped tests. The new Sanskrit wheels, Scholar interface, and reader improvements are present, but the clean-checkout build is not green.

[Inspect the November 11 CI run](https://github.com/prx0r/svread/actions/runs/42958739833?utm_source=chatgpt.com)

[trika-x / Treeka](https://github.com/prx0r/trika-x?utm_source=chatgpt.com)

CI passing

Default branch: `fdc4e33`. Its November 8 formal-check run passed. However, the project explicitly distinguishes machine-checked formal statements from source-supported philosophical interpretations, with substantial formal-coverage gaps.

[Inspect the passing formal-check run](https://github.com/prx0r/trika-x/actions/runs/42491927101?utm_source=chatgpt.com)

### The immediate `svread` problems

I retrieved the latest CI logs, not just the status indicator. Four failures are identifiable:

| Failure                   | Actual cause                                                                         |
| ------------------------- | ------------------------------------------------------------------------------------ |
| Exemplar fixture          | Test reads `/root/trika-x/testing/fixtures/...`, unavailable to the GitHub runner    |
| Sanskrit wheel references | A required `pasu` concept file is absent                                             |
| Kāraka wheel              | Test attempts to load `/root/svread/vendor/sanskrit-bruno-wheels/data.js`            |
| Discovery emitter         | Depends on `/root/ipvv/site/data/pushing/INDEX.json`, which the runner cannot access |

These are mainly repository portability and dependency-management failures, rather than evidence that the underlying Sanskrit is wrong.

The fix should be a genuine fresh-checkout CI contract: repository-relative paths, vendored or explicitly acquired dependencies, synthetic fixtures, and separate integration tests for private cross-repository resources. Do not solve this by making the failing tests optional. That would be a rather expensive way to turn red lights into decorative lighting.

## 2. Best Sanskrit AI innovations to integrate

I've ranked these by usefulness to your actual translation, philology, and reader systems, rather than by how impressive their benchmark scores look.

| Technology                                                                                                       | Why it matters                                                                                                  | My recommendation                                                     |
| ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| [MITRA-MT, October 2026](https://aclanthology.org/2026.wmt-main.26/?utm_source=chatgpt.com)                      | Open-weight, domain-trained 9B translation model; accompanying parallel corpus spans 2.34 million segment pairs | High: benchmark as an independent translation candidate               |
| [Mitrasaṃgraha, October 2026](https://aclanthology.org/2026.wmt-main.27/?utm_source=chatgpt.com)                 | 391,548 Sanskrit–English sentence pairs with corrected evaluation sets                                          | High: create a properly separated evaluation and retrieval dataset    |
| [MITRA Lexicon](https://github.com/dharmamitra/dharmamitra-lexicon?utm_source=chatgpt.com)                       | Corpus-attested translation senses, rather than isolated dictionary definitions                                 | High: expand the existing integration with source-aware ranking       |
| [Process-Sanskrit](https://github.com/Giacomo-De-Luca/Process-Sanskrit?utm_source=chatgpt.com)                   | Morphology, dictionary lookup, inflection handling, and compound analysis                                       | High: add a second opinion alongside Vidyut                           |
| [Sanskrit Travelogue, May 2026](https://aclanthology.org/2026.lrec-1.535/?utm_source=chatgpt.com)                | 12,394 texts, 73.1 million tokens, multiple synchronized linguistic representations                             | Medium-high: research and search infrastructure, subject to licensing |
| [Sansar Sanskrit Corpus](https://huggingface.co/datasets/MuseMesh/sansar-sanskrit-corpus?utm_source=chatgpt.com) | 252 million Sanskrit words with a particularly useful per-source licensing approach                             | Medium-high: reusable corpus intake and provenance design             |
| [UniLipi, 2026](https://ihdia.iiit.ac.in/unilipi/?utm_source=chatgpt.com)                                        | OCR across 13 Indic scripts; reported 6.9% overall character error rate                                         | Experimental: manuscript benchmark, not automatic publication         |
| [Saktumiva / Upama](https://www.saktumiva.org/?utm_source=chatgpt.com)                                            | Digital Sanskrit critical editions, manuscript transcriptions, collation and variant apparatus                  | Very high for scholarship: evaluate as a model for your witness layer |

The first five are backed by published research or identifiable open-source implementations. The release details and limitations matter: MITRA-MT was primarily developed for Buddhist literature, so successful Sanskrit translation benchmarks do not establish accuracy for Trika metaphysics.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://aclanthology.org\&sz=32)

aclanthology.org+4



### What you already have

An important finding: you are not starting from zero on Sanskrit-specific AI.

`translation-work` already contains `tools/mitra_grounds.py`, using a provenance-recorded subset of 219 Trika-relevant Sanskrit headwords, extracted from 384,073 inspected entries of the MITRA Lexicon. It is read-only, with source attestations, so there is no reason to build another dictionary service from scratch.

You also already have Vidyut experiments, and `svread` has a derivation-aware grammar-wheel system. Its current crosscheck records 20 agreements, one disagreement, and three gaps against Vidyut 0.4.0. That is a useful design: disagreements are visible rather than quietly replaced.

The improvement is to combine independent evidence sources, retaining every analysis as a candidate until a reviewer chooses it.

For example, tattva cannot safely be translated as “truth” merely because that ranks first in a broad translation lexicon. In a Trika discussion of the thirty-six tattvas, the operative sense is often a constituted principle or category of reality. Corpus frequency is evidence, not a vote that decides philosophical meaning.

### A significant licensing trap

Mitrasaṃgraha has two release sets: 372,791 pairs under CC BY-SA 4.0, and a full 391,548-pair dataset under the more restrictive CC BY-NC-ND 4.0. The 18,757 additional restricted pairs cannot simply be bundled into a commercial or freely redistributable corpus.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://huggingface.co\&sz=32)

huggingchat/papers-content



Process-Sanskrit's downloadable linguistic database also carries non-commercial terms, independently of the Python package. Sanskrit Travelogue similarly describes its published resources as non-commercial.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://github.com\&sz=32)

GitHub+1



Before integrating any dataset, the pipeline should record the exact release, checksum, record-level permissions where available, attribution, and whether it may be used for training, inference, quotation, and redistribution. Otherwise, a technically brilliant translation platform can end up built on material it cannot lawfully publish.

## 3. Review of the deeper architecture

### `translation-work`: impressive infrastructure, but “gold” needs a stricter definition

The layered design is worth retaining. Each passage can connect a source reading to token glosses, alternative meanings, an argument map, readable translations, interpretive essays, and stylistic versions.

That is substantially more useful for scholarship than storing one AI-generated English paragraph.

A particularly encouraging discovery: the earlier Pratyabhijñāhṛdaya source-span defect appears repaired. Its five passage records now contain the complete sets of four sūtras rather than just one sūtra each.

The next test should deliberately alter one source sūtra in an isolated fixture and verify that every dependent translation, proof record, reader projection, and Treeka trace becomes invalid. If a source changes but downstream approval survives, the lineage system is not yet trustworthy.

The other major missing piece is a proper human-review ladder:

Edition or manuscript reading

Exact source, bibliographic identity, variants, limitations

Machine linguistic candidates

Vidyut, Process-Sanskrit, MITRA, translation models

Recorded expert adjudication

Accepted meanings, rejected alternatives, unresolved questions

Public, independently inspectable edition

Reader, translations, citations, version and review status

A source hash establishes identity, not correctness. Even a perfectly reproduced transcription can faithfully preserve a mistake.

### `svread`: the best route to an actual scholarly product

The Sanskrit learning surfaces, reader, comparison view, and formal verification links are coming together.

I particularly like the direction of [PR #11, the translation comparison pilot](https://github.com/prx0r/svread/pull/11?utm_source=chatgpt.com). It proposes original comparison material, source alignment, external links to other translators, and explicit warnings when a draft hasn't been reviewed.

This should become a central feature. Imagine opening a single verse and being able to inspect your literal translation, alternative interpretive choices, a grammatically supported word breakdown, relevant commentarial evidence, and links to published translations.

Crucially, each difference needs a reason, not simply another AI wording.

Before merging PR #11, verify the passage hashes, source boundaries, copyright handling, and clean CI.

### `trika-x` and Treeka: useful research coordination, not yet proof of the philosophy

Treeka is real and has a substantial dataset. I inspected `formal-trika/data/treeka.json` and its assembly/reporting code.

Indexed passages

# 909

Unargued

# 578

Without formal registry reference

# 893

Ambiguous locators

# 12

Current committed Treeka snapshot. A formal registry reference is not necessarily a completed proof.

There are also 123 cruxless and 331 essayless passage entries.

One small code-level issue: `treeka_report.py --work` filters its passages, but the printed summary still uses corpus-wide counts. Fixing that would make its per-work reporting accurate.

The larger question is which properties Lean actually proves. A valid formal derivation from premises does not establish that Abhinavagupta historically accepted those premises, nor that a Sanskrit passage entails them.

I would strongly support [PR #9](https://github.com/prx0r/trika-x/pull/9?utm_source=chatgpt.com), which tightens the binding of essay claims to their source passages, subject to reviewing and testing the full patch. It moves the system towards evidential accountability.

## 4. Three particularly promising additions

A Trika-specific blind evaluation set. Build roughly 50 independently checked Sanskrit passages covering difficult compounds, philosophical terminology, negation, ritual instructions, poetry, and genuine textual ambiguities. Compare the existing translation pipeline against MITRA-MT and combinations of Vidyut, Process-Sanskrit, and the MITRA lexicon. Judge not just fluency but semantic mistakes, ungrounded claims, and the actual amount of scholarly correction needed.

A digital textual apparatus. Saktumiva and its open-source [Upama collation library](https://github.com/chchch/upama?utm_source=chatgpt.com) are worth investigating closely. They offer a useful approach to recording competing manuscript readings, not merely competing English translations.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://saktumiva.org\&sz=32)

saktumiva.org+1

Sanskrit recitation and pronunciation. [Su-śrotā](https://github.com/prathoshap/sushrota-sanskrit-asr?utm_source=chatgpt.com) has Sanskrit-specific speech-recognition checkpoints intended for śāstric prose and recitation. That is worth benchmarking against ordinary speech recognition for the `svread` learning experience, especially vowel length and consonant accuracy.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://github.com\&sz=32)

GitHub



One additional research resource worth inspecting is [Anamavajra's Sanskrit corpus](https://huggingface.co/datasets/Anamavajra-Labs/sanskrit-corpus?utm_source=chatgpt.com), which reports 2,272 Sanskrit–English verse pairs associated with Śaiva/Tantric sources. The listed licensing is non-commercial, and the source/translation alignment would need checking before it could serve as trustworthy training or evaluation data.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://huggingface.co\&sz=32)

Datasets at Hugging Face



## 5. What I would do next, in order

P0

Make `svread` CI green on a fresh checkout.

Repair the four reproducible failures and remove the machine-specific dependency assumptions. A published scholarly platform should not require the developer's `/root` directory to exist.

P0

Separate machine validation from human scholarly authority.

Preserve independent statuses for source authentication, edition comparison, expert translation approval, formal verification, and licensing.

P1

Benchmark MITRA-MT and the combined linguistic toolchain.

Don't modify canonical translations automatically. Generate evidence-bearing candidates and compare them on held-out Trika passages.

P1

Produce one genuinely reviewable critical-edition showcase.

A small work with an authenticated textual basis, documented variants, expert-reviewed meanings, and public provenance would establish more scholarly credibility than another fifty machine-completed texts.

P2

Pilot manuscript OCR and Sanskrit ASR.

Only advance candidates that beat the current approach on independently transcribed or recorded samples.

## Full technical handoff

I packaged the findings into a Markdown audit suitable for your coding agents. It includes repository revisions, current failures, source-level observations, external research links, PR notes, proposed implementation ownership, and explicit acceptance tests.

Sanskrit AI & Repository Audit

Markdown · November 11, 2026 · \~15 KB

Download the complete technical audit

My overall assessment: The projects already have the foundations for something genuinely distinctive: a Sanskrit reading and translation environment in which the evidence for each interpretation is accessible and disagreements remain visible.

The most consequential next step isn't more generation. It is proving that a knowledgeable outsider can independently check a reading, challenge a translation, and understand exactly why one interpretation was accepted over another.

That is what would move the system from impressive AI engineering towards a credible scholarly resource.

I have not changed or merged anything in the repositories. I think we could build something genuinely extraordinary here. Not another Sanskrit chatbot, but a system that can read Sanskrit, investigate its meanings, challenge its own interpretations, explain its reasoning, and teach you the language while you explore.

The mad thing is that we already have much of the infrastructure. `translation-work` holds the translations and argument layers, `trika-x` handles evidence and research gaps, Treeka connects the concepts, and `svread` provides the reader.

Here are the five ideas I'd be most excited about.

## 1. The Sanskrit Microscope

My favourite for immediate impact

Imagine reading a passage from Abhinavagupta. You tap any word and the entire linguistic machinery opens.

EXAMPLE · ŚIVA SŪTRA 1.5

# उद्यमो भैरवः

udyamo bhairavaḥ

The arising is Bhairava.

SandhiGrammarMeaning

Literal: The arising is Bhairava.

Interpretive question: What kind of arising? Ordinary exertion, or the sudden emergence of awakened awareness?

Compare the interpretive tradition, especially Kṣemarāja, before deciding.

Illustrative interaction, not a deployed feature. This could combine existing reader text, Vidyut and reviewed commentarial analysis.

Now imagine that for every word of Tantrāloka, Śivastotrāvalī and the other texts.

Vidyut can generate Sanskrit word forms with rule-by-rule Pāṇinian derivations, while other analyzers can propose segmentation and morphology.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://github.com\&sz=32)

GitHub



You could click a root and discover every related word in the entire corpus. Click a grammatical rule and see its other occurrences. Click an interpretation and inspect what supports it.

Why this is insane: The reader stops being a translation viewer and becomes an interactive Sanskrit research environment.

## 2. An AI that argues against its own translations

Highest scholarly value

This is where MITRA-MT becomes particularly interesting.

Instead of asking one model to translate a Sanskrit verse, run a controlled panel:

Exact Sanskrit source

Edition and textual variants preserved

MITRA-MT

Independent translation proposal

Current translation stack

Existing layered interpretation

Linguistic analyzers

Compounds, cases, roots, sandhi

Commentarial evidence

Attested interpretations and variants

Adversarial interpretation audit

Find disagreements, omissions and unsupported claims

Human review queue

The system reports each unresolved ambiguity, the competing readings and evidence needed to resolve it.

MITRA-MT is particularly attractive because it was trained for classical Asian languages, while Mitrasaṃgraha provides substantial Sanskrit translation data for benchmarking. But both still face challenges with philosophical compounds and metaphors.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://aclanthology.org\&sz=32)

aclanthology.org+1



The useful output isn't "three models agree, therefore correct." Models can share training biases.

It's "Here are the five strongest reasons this translation might be wrong."

That's the kind of functionality scholars could actually value.

## 3. Treeka as a philosophical discovery engine

Most ambitious research idea

Right now Treeka indexes passages, arguments, research gaps, and formal associations.

I would develop it into a searchable network of philosophical claims.

Imagine typing:

> Does Abhinavagupta consider devotion a means to liberation, an expression of liberation, or both?

Instead of a chatbot improvising a plausible answer, it would traverse actual passages and distinguish:

- Direct statements by Abhinavagupta.
- Relevant positions in Utpaladeva and Kṣemarāja.
- Commentarial interpretations.
- Scholarly disagreements and unsupported inferences.

Every connection would identify its source and its evidential status.

Then the really interesting part: automated discovery of unresolved cruxes.

Treeka could flag places where two passages appear to make contradictory claims, one philosophical term is being translated inconsistently, or an argument depends on an unverified manuscript reading.

Some discoveries would be false positives, naturally. Philosophy isn't a database join wearing a robe. But a ranked queue of genuinely difficult textual problems could guide research much more effectively than translating works in arbitrary order.

## 4. An adaptive Sanskrit immersion environment

Highest everyday usefulness

This is perhaps the most immediately enjoyable.

Turn `svread` into an environment where Sanskrit study, recitation, and philosophical reading all reinforce one another.

You read a verse in the morning, practice its vocabulary in conversation, hear a precise recitation, and later receive a short exercise based on the forms you struggled with.

Imagine the system notices that you understand kutra, tatra, kadā and tadā, but repeatedly confuse kutaḥ and katham. It selects new exercises using those same word families, then finds authentic sentences containing them.

The speech component is especially promising. Su-śrotā already provides Sanskrit-specific recognition designed for prose and recitation. Its authors describe syllable-level feedback and uncertainty-aware correction, though we'd need to test accuracy on your own recordings.

The revolutionary combination would be a grammar engine linked to real Sanskrit literature and personalized pronunciation practice.

Rather than learning paradigms in isolation, you'd gradually acquire the language needed to read Abhinavagupta.

## 5. The living critical edition

Biggest long-term academic opportunity

Imagine that a Tantrāloka verse isn't displayed as a single allegedly definitive Sanskrit text.

You see the edition, alternative readings, manuscript evidence where available, commentators' interpretations, and alternative translations.

If a manuscript reading changes, the system could identify every translation and argument potentially affected by that change.

Saktumiva already demonstrates digital manuscript transcription and automatic collation for Sanskrit critical editions.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://saktumiva.org\&sz=32)

saktumiva.org



Combining that approach with your layered translation records and Treeka's claim graph would be extremely powerful.

The important caveat is access to real witnesses. We shouldn't pretend that several digitized copies of the same printed edition amount to independent manuscript evidence.

## Which are worth building?

My estimates, not benchmarked measurements

| Idea                     | Potential                         | Difficulty  | Priority |
| ------------------------ | --------------------------------- | ----------- | -------- |
| Sanskrit Microscope      | Transformative reader feature     | Medium      | 1        |
| AI translation adversary | Major scholarly advantage         | Medium–high | 2        |
| Adaptive Sanskrit tutor  | Large educational audience        | Medium      | 3        |
| Treeka discovery engine  | Novel research capability         | High        | 4        |
| Living critical edition  | Long-term academic infrastructure | Very high   | 5        |

## The project I'd build first

One complete, deeply interactive, evidence-aware edition of a small Trika text.

I'd choose the Pratyabhijñāhṛdaya, with its 20 sūtras and extensive interpretive possibilities, or the shorter Anuttarāṣṭikā for a faster initial demonstration.

The reader would contain the original Sanskrit, clickable grammatical derivations, translation comparisons, Kṣemarāja's relevant commentary where applicable, research disagreements, pronunciation practice, and source provenance.

Then run the same machinery across the existing corpus.

The biggest opportunity isn't to become the website with the most machine-generated Sanskrit translations. It's to make the evidence behind Sanskrit interpretation dramatically easier to investigate than anywhere else.

And there is a real difference between those ambitions. The first is a content factory. The second could become a new kind of scholarly instrument.
