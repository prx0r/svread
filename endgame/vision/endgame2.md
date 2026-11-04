# Endgame Spec 2 — the Tantra Hub

*2026-08-10. The second-iteration endgame spec. Companion to `docs/endgame1.md` (the translation-laboratory spec) and `corpus/learning/ENDGAME_SITE_SPEC.md` (the reader spec). This spec reframes the destination as a living bibliography + text-reader + translation-workshop + commentary + media hub — a "make the textual landscape of Tantra navigable" mission, not a translation-only site.*

---

Yes. That framing is much better.

This should be a **Tantra hub / living bibliography**, not a scoring database.

The core object is simply:

```text
SCHOOL
  ↓
TEXT
  ↓
WHAT EXISTS?
```

For each text:

```text
Title
Alternate titles
School / lineage
Approx. date
Author / attribution

Sanskrit
- e-text
- critical edition
- manuscript witnesses

Translations
- complete English
- partial English
- other languages
- no formal translation located

Our translation
- AI-assisted working translation
- clearly labelled NOT peer reviewed
- version / date
- source text used

Commentaries
- traditional commentaries
- modern scholarly commentary
- our explainer/commentary

Research / resources
- papers
- books
- lectures
- Hareesh
- Bäumer
- Sanderson
- Dyczkowski
- Torella
- Ratié
- etc.

Relations
- quoted by
- comments on
- borrows from
- associated tradition
```

And then divide the site naturally:

```text
ŚAIVA SIDDHĀNTA
BHAIRAVA / VIDYĀPĪṬHA
KAULA
TRIKA
KRAMA / KĀLĪKULA
KUBJIKĀ
PRATYABHIJÑĀ
ŚRĪVIDYĀ
NEWAR / SARVĀMNĀYA
...

later:
BUDDHIST TANTRA
NĀTHA
PĀÑCARĀTRA
etc.
```

The beautiful bit is that **you don't need completeness before launch**. Seed each school with maybe 5–15 major texts and let the graph expand as research uncovers references.

A text page could be extremely simple:

```text
KUBJIKĀMATATANTRA
Kubjikā · c. 9th–10th century

STATUS
Sanskrit e-text          ✓
Critical edition         ✓
Complete English         —
Partial English          ✓
Tantra Hub translation   ✓ AI-assisted / unreviewed

TEXT
Read Sanskrit →
Read our translation →

SCHOLARSHIP
Goudriaan & Schoterman →
Dyczkowski →
Sanderson →

COMMENTARY
What is Kubjikā? →
The sixfold sequence →
How Kubjikā relates to Trika →

MANUSCRIPTS
NAK ...
NGMPP ...

RELATED
Ṣaṭsāhasrasaṃhitā →
Śrīmatottara →
Ciñciṇīmatasārasamuccaya →
```

That is already useful even if the user never reads your translation.

## The AI angle is genuinely strong

A normal bibliography is designed for humans.

You can make yours useful to **both humans and retrieval agents** by keeping the data highly explicit.

For example, underneath every page have structured metadata:

```json
{
  "title": "Kubjikāmatatantra",
  "tradition": ["Kubjikā", "Kaula"],
  "translation_status": {
    "complete_english": false,
    "partial_english": true,
    "site_working_translation": true
  },
  "sanskrit_sources": [],
  "translations": [],
  "manuscripts": [],
  "scholarship": [],
  "related_texts": []
}
```

Then expose something like:

```text
/texts/kubjikamata
/traditions/krama
/people/abhinavagupta

/data/texts/kubjikamata.json
/data/texts.json
```

And eventually:

```text
/api/texts?tradition=krama
/api/texts?english_translation=false
```

Now an agent can answer:

> “Which important Krama texts lack a complete English translation?”

from your dataset rather than hallucinating.

Even better, every translation-status assertion should carry its **evidence**:

```json
{
  "complete_english": false,
  "status_checked": "2026-08-10",
  "evidence": [
    {
      "type": "bibliographic_search",
      "source": "..."
    }
  ],
  "certainty": "no complete translation located"
}
```

I would deliberately phrase the public status as:

> **No complete English translation located**

rather than:

> **Untranslated**

unless scholarship explicitly establishes that.

That makes the database much more trustworthy.

## Your translations fit naturally into it

There should probably be three badges:

```text
PUBLISHED TRANSLATION
scholarly / commercial / peer-reviewed etc.

WORKING TRANSLATION
Tantra Hub AI-assisted translation

COMMUNITY REVIEWED
working translation reviewed/corrected by contributors
```

Your version could say prominently:

> **Working translation**
> AI-assisted from the cited Sanskrit edition. Not peer reviewed. Corrections welcome.

Then a Sanskritist can click a verse and propose:

```text
Current:
...

Suggested:
...

Reason:
samāsa should be read as...
```

Over time you get something much more interesting than a static AI translation.

It becomes:

```text
MANUSCRIPT
   ↓
SANSKRIT
   ↓
WORKING TRANSLATION
   ↓
SCHOLAR CORRECTIONS
   ↓
VERSIONED COMMUNITY TEXT
```

That's basically **Bilara for Tantra**, embedded inside a bibliographic/reference system.

## And commentary becomes the discovery layer

The bibliography is the infrastructure.

The essays are what humans actually browse.

So someone enters through:

> **What does Śakti actually mean in the Tantras?**

Then the article references:

```text
Tantrasadbhāva 3.21
Kubjikāmata 5.14
Tantrāloka 3.67
Īśvarapratyabhijñā...
```

Each reference goes into your reader.

Likewise:

> What is Krama?
> Why twelve Kālīs?
> What is mantra?
> What is kula?
> What does recognition mean?
> How did Abhinavagupta synthesize Tantra?
> What is the relationship between Kubjikā and Trika?

So the site has three layers:

```text
DISCOVER
articles · explainers · lectures

EXPLORE
tradition map · people · concepts · timelines

SOURCE
texts · Sanskrit · translations · manuscripts · bibliography
```

That feels like the right product.

And yes, include good modern material alongside academic scholarship. A `Resources` field could distinguish:

```text
PRIMARY TEXT
ACADEMIC
TRADITIONAL COMMENTARY
LECTURE / COURSE
ACCESSIBLE EXPLAINER
```

So a Krama page can legitimately contain Sanderson and academic papers alongside a strong Hareesh Wallis explanation without pretending those are the same category of source.

The project then has a very simple mission:

> **Make the textual landscape of Tantra navigable.**

Not “translate every Sanskrit manuscript.”

Not “build the definitive ontology of Tantra.”

Just:

**What are the traditions? What are their texts? Where can I read them? What has been translated? What hasn't? What scholarship exists? How are the texts related?**

That alone would be extremely useful. github.com/xr843/fojin Yes — **FoJin is basically the infrastructural end-state**, but yours has a different center of gravity.

FoJin is primarily:

> **corpus aggregation → retrieval → cited AI answers → cross-canon comparison**

Its README makes that explicit: 10,500+ texts, 613 sources, 680K+ embedded passages, stable URNs, RAG, citation export, cross-canon parallels, knowledge graph, MCP access for AI agents.

Yours should be more like:

> **living scholarly hub → bibliography → text reader → translation workshop → commentary → lectures/explainers → AI retrieval**

That distinction matters.

I’d think of it as:

```text
FOJIN
"What does the Buddhist canon say?"

YOUR SITE
"What exists in this tantric tradition,
where can I read it,
what has been translated,
how do scholars understand it,
and can we collaboratively work on what's missing?"
```

## The core layers

### 1. Atlas / bibliography

This is the spine.

```text
Trika
  ├─ Mālinīvijayottara
  ├─ Tantrasadbhāva
  ├─ Parātriṃśikā
  └─ ...

Krama
  ├─ Kramasadbhāva
  ├─ Devīpañcaśataka
  ├─ Kaulasūtra
  └─ ...

Kubjikā
  ├─ Laghvikāmnāya
  ├─ Kubjikāmata
  ├─ Ṣaṭsāhasra
  └─ ...
```

Every record answers:

**What is it?**
**Where is the Sanskrit?**
**What manuscripts survive?**
**Has it been translated?**
**Who has studied it?**
**Where can I read/listen/watch more?**

That alone is valuable.

---

### 2. Reader

Each actual text gets:

```text
Sanskrit | English | Commentary
```

with verse-level anchors.

For example:

```text
Kubjikāmata 3.14

[Sanskrit]

[Published translation, if licensable/linkable]

[Tantra Hub working translation]

[Commentary]

[Parallels]

[Citations]
```

This eventually becomes the part AI agents can retrieve from.

---

### 3. Translation workshop

This is where yours departs dramatically from FoJin.

A text with no English translation gets:

> **No complete formal English translation located**

then:

> **Tantra Hub Working Translation — AI-assisted, not peer reviewed**

And scholars can interact with individual passages:

```text
Propose correction
Add grammatical note
Suggest alternate translation
Add parallel passage
Add manuscript reading
Add bibliographic reference
```

You could effectively make the **translation itself an open scholarly object** rather than a static PDF.

That is much more interesting.

---

### 4. Commentary layer

And not only old commentaries.

Each passage can accumulate:

```text
TRADITIONAL
Jayaratha
Kṣemarāja
etc.

SCHOLARLY
Sanderson
Dyczkowski
Bäumer
Törzsök
Ratié
Torella
Goodall

SITE COMMENTARY
plain-language explanation
technical explanation
cross-text synthesis
```

Then the Sanskrit corpus becomes intelligible rather than merely searchable.

---

### 5. Media / lectures

This is the layer FoJin doesn't really center.

A page for **Krama** could contain:

```text
INTRODUCTION
What is Krama?

KEY TEXTS
...

LECTURES
Hareesh Wallis — ...
Bettina Bäumer — ...
academic seminar — ...

ESSAYS
The Twelve Kālīs
Krama and cognition
Krama in Abhinavagupta

SCHOLARSHIP
Sanderson ...
Dyczkowski ...
...
```

So the site answers both:

> “I'm a scholar looking for manuscripts.”

and:

> “I heard someone mention Krama yesterday. What the hell is it?”

That's powerful.

---

## Then steal FoJin's *machine-facing* idea later

FoJin has something especially smart: it isn't merely a website; its corpus is exposed so AI assistants can retrieve cited passages through stable identifiers and MCP/API tooling.

We should absolutely borrow that principle.

Every object should eventually have a stable ID:

```text
tantra:text:kubjikamata
tantra:text:kubjikamata:3.14

tantra:person:abhinavagupta

tantra:tradition:krama

tantra:concept:kula
```

Then an API/MCP tool could expose:

```text
search_texts
read_passage
find_translations
get_commentary
search_bibliography
get_text_status
get_related_texts
```

So future ChatGPT could answer:

> Which Kubjikā texts remain untranslated?

by querying **your structured bibliography**, rather than doing the messy web archaeology we're currently doing.

Or:

> How does `kula` differ between early Kaula and Abhinavagupta?

and retrieve cited occurrences directly from your corpus.

That's when the project becomes real **knowledge infrastructure**.

## The ecosystem would look something like

```text
                    TANTRA HUB

                 ┌── ATLAS ──┐
                 │ traditions │
                 │ texts      │
                 │ people     │
                 │ concepts   │
                 └────┬───────┘
                      │
       ┌──────────────┼─────────────────┐
       ▼              ▼                 ▼
   SOURCES         LEARNING         SCHOLARSHIP
   Sanskrit        essays           bibliography
   manuscripts     lectures         publications
   translations    explainers       citations
       │              │                 │
       └──────────────┼─────────────────┘
                      ▼
                   READER
                      │
              verse-level comments
                      │
              translation workshop
                      │
               scholar review
                      │
                      ▼
                STRUCTURED API
                      │
                      ▼
                  AI AGENTS
```

And crucially, **you don't need to build FoJin-scale infrastructure now**.

Your first version can literally just be:

**Atlas + 50 seeded text records + links + translation-status bibliography + 5 working translations + a handful of good essays/resources.**

Then the richer corpus emerges naturally from actually using the site.

The nice thing is that the bibliography isn't ancillary anymore. It becomes the **index joining everything together**: manuscript → Sanskrit → published translation → working translation → scholarship → lecture → commentary → AI retrieval.

That feels much closer to what you're actually building than “Tantra translation website.”

---

# Addendum — the translation environment + the machine-facing API + the research OS

*2026-08-10. The continuation of the spec: the scholarly translation environment (retrieve-context-on-demand), the audit engine, the media/lecture layer, the Sanskrit-TTS primitive, and the research-operating-system end-state with the provenance hierarchy.*

Yes. That is the real differentiator: **not just a corpus, but a scholarly translation environment that can retrieve context on demand**.

The core workflow could eventually look like this:

```text
Translator opens an untranslated verse
        ↓
selects a difficult term: vimarśa
        ↓
MCP/API queries Tantra Hub
        ↓
returns:

• same lemma in this text
• same lemma in texts ±150 years
• uses within the same school
• uses in adjacent schools
• traditional commentary glosses
• published scholarly translations
• dictionary senses
• parallel constructions
• quotations / textual borrowings
• manuscript variants
• confidence + provenance
        ↓
LLM proposes translation
        ↓
AUDIT

"Your translation as 'reflection' conflicts with
the established sense in 7/9 nearby Trika passages."

"Possible parallel: Tantrāloka 3.xx"

"Jayaratha glosses this occurrence with ..."

"Ratié renders a closely related construction as ..."

        ↓
human reviews
```

That is **vastly more useful** than generic Sanskrit RAG.

The API needs to understand contextual constraints, not merely full-text search. Eventually you want queries like:

```text
/search/occurrences
  ?lemma=kula
  &tradition=krama
  &date_from=850
  &date_to=1050

/parallels
  ?passage=kubjikamata:3.14

/term/history
  ?lemma=vimarsa

/translations
  ?passage=ipk:1.5.12

/commentaries
  ?passage=tantraloka:3.67

/manuscripts
  ?text=tantrasadbhava
```

And MCP makes that available *inside* ChatGPT, Claude, Codex, or a specialist translation agent.

A translation agent could literally call:

```text
get_passage()
find_parallel_passages()
find_term_occurrences()
get_traditional_commentary()
get_published_translations()
get_manuscript_variants()
audit_translation()
```

The last one could become particularly strong because your existing translation/audit work gives you the beginnings of that architecture already. Instead of an audit being some vague LLM critique, it can issue evidence-backed warnings:

```text
NEGATION
Possible omitted na.

TERM DRIFT
śakti translated differently from neighbouring occurrences.

UNSUPPORTED ADDITION
English concept has no obvious Sanskrit support.

PARALLEL CONFLICT
Close parallel translated differently.

COMMENTARY CONFLICT
Traditional gloss does not support proposed reading.

GRAMMATICAL UNCERTAINTY
Compound admits two plausible parses.

SOURCE UNCERTAINTY
Witnesses disagree at the relevant locus.
```

Then distinguish **error detection from interpretation**. An audit shouldn't say “translation wrong” simply because Sanderson translated something differently. It should say:

> `REVIEW`: your rendering differs from three relevant parallels and Jayaratha's gloss. Evidence →

That would be genuinely useful to scholars.

## The media side fits the same architecture

The site doesn't need a hard divide between “academic database” and “learning app.”

A concept can have multiple representations:

```text
ŚAKTI

Primary passages
Scholarship
Traditional commentary
Site explainer
Lecture
5-minute introduction
Full seminar
Audio Sanskrit
Interactive diagram
Practice/history discussion
Bibliography
```

If a scholar gives permission, their lecture can become a first-class scholarly resource rather than some random YouTube URL.

You could film:

**Bettina Bäumer — What does vimarśa mean?**

and then annotate it:

```text
00:00 introduction
03:42 prakāśa/vimarśa
11:08 Utpaladeva
17:51 Abhinavagupta
26:02 relation to mantra
```

Those timestamps can link directly into concept/text pages.

Even better, generate a transcript and—**with appropriate permission**—index it alongside the corpus:

```text
resource: lecture
speaker: Bettina Bäumer
concepts: [vimarśa, prakāśa]
texts: [ĪPK, Tantrāloka]
transcript_segments:
   ...
```

Then an AI researcher asking:

> What are competing interpretations of vimarśa?

could retrieve:

* primary texts
* Jayaratha
* Ratié
* Bäumer lecture
* Dyczkowski
* your site's working commentary

while clearly distinguishing each source type.

## Meditation/practice content needs one important distinction

I'd keep:

**textual scholarship** and **practice instruction** visibly separate.

For example:

```text
Vijñānabhairava 24

SOURCE
Sanskrit
translations
commentaries
philology

INTERPRETATION
scholarly essays
lectures

PRACTICE
guided version by [teacher]
authorized/adapted by [teacher]
```

Then if you work with a scholar/practitioner, you can explicitly label:

> Guided interpretation by X, based on their reading of VBh 24.

rather than making the site's AI silently convert medieval ritual/yogic texts into modern meditation instructions.

That gives you credibility and lets different teachers disagree.

## Sanskrit TTS is another excellent API primitive

Not merely:

`text → speech`

but:

```text
POST /tts/sanskrit

input
  devanagari / IAST
mode
  prose / śloka / mantra-text
segmentation
  pada / verse / continuous
speed
source_passage_id
```

Then every Sanskrit passage gets a play button automatically.

And because the passage has a stable ID, an app can ask:

```text
/audio/tantraloka:1.1
```

You could eventually support synchronized highlighting:

```text
विमर्शशरीर एव प्रकाशः

  ↑      ↑        ↑
audio follows individual pada/word
```

which makes the corpus valuable for Sanskrit learners too.

## The end-state is almost a research operating system

Not:

> “here are my Tantra essays.”

But:

```text
TANTRA HUB
│
├── Canonical bibliography
├── Manuscript acquisition registry
├── Sanskrit corpus
├── Translation registry
├── Open working translations
├── Collaborative review
├── Traditional commentaries
├── Scholarly literature
├── Lectures/video
├── Concept concordance
├── Cross-text parallels
├── Sanskrit tools
├── TTS
├── Translation audits
├── Search/RAG
├── API
└── MCP
```

And because **every claim ultimately resolves to a source**, agents can use it without treating your site's generated material as equivalent to critical scholarship.

That provenance hierarchy might be the single most important architectural principle:

```text
MANUSCRIPT
CRITICAL EDITION
PUBLISHED TRANSLATION
TRADITIONAL COMMENTARY
PEER-REVIEWED SCHOLARSHIP
SCHOLAR LECTURE
COMMUNITY CONTRIBUTION
SITE WORKING TRANSLATION
AI-GENERATED ANALYSIS
```

Every returned object tells the agent what kind of evidence it is.

Then a scholarly translation agent can be instructed:

> Prefer critical editions and traditional commentaries as primary evidence; use peer-reviewed scholarship for interpretation; treat Tantra Hub working translations and AI analyses as provisional.

That makes the whole thing substantially more trustworthy than just dumping thousands of embeddings into a vector database.

And the nice part is that **the thing we're doing manually in this conversation—finding obscure sources, identifying translation status, finding manuscript witnesses, comparing terminology—is basically the prototype for what the API should automate.**

