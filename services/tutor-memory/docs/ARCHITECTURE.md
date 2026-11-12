# Tutor Memory: exact product logic

## Contract

`Lesson = Wheel × Level × Pack × Five ring selections × Learner state`

A *wheel* defines how to construct a sentence; a *level* constrains grammar; a *pack* offers vocabulary and vetted relations; five ring selections generate a specific exercise. The state engine decides which skill to practise, not the Sanskrit text itself.

**Only four visible wheels:** Conversation (1), Expression (2), Action (3), Description (4). The former 15 families remain curriculum primitives, not 15 top-level tools.

## Model memory versus authoritative state

- **ChatGPT Memory:** optional, high-level context. Not guaranteed to be replayed on every turn, not programmatically queryable by the Svatantrya website, and not automatically synchronized with plugin accounts.
- **Teaching style bank:** explicit, user-correctable preferences; keys are narrow and simple (`explanation_style`, `script_reveal`, `pacing`, etc.). There is no vast psychological profile.
- **Learning state:** attempts and evidence, stable skill IDs, today's focus and scheduled reviews.
- **Personal packs:** a separate set of approved, minimal facts, not a copy of chat history.

## Teaching preference lifecycle

1. **Learner says explicitly:** "Always show Devanāgarī before IAST." Ask no needless extra questions. With a linked learner profile, update `script_reveal` directly, after recognizing this as an explicit persistent instruction. If the learner meant only this session, use a session override instead.
2. **Model notices a pattern:** "Maybe they prefer short bursts." Never claim this as fact. Send a short *suggestion* via `propose`, explaining the evidence.
3. **Learner accepts:** Persist one preference and its provenance. User edits override inferred suggestions. If refused, do not nag.
4. **New contradictory instruction:** A clear current learner request overrides prior preferences. Either change session-only or persist based on explicit scope.
5. **User asks:** "What do you remember about how I learn?" Show the whole short bank and allow edits/deletion.

Example teaching bank (user-editable, not inferred as diagnosis):

```json
{
  "script_reveal": "Devanagari first; hide IAST and English until reveal",
  "explanation_style": "Start with transformations and pattern recognition; offer grammar explanations on request",
  "pacing": "Quick-fire, one new construction at a time",
  "preferred_examples": "Everyday conversation, Trika and Vedanta",
  "practice_mode": "Five-ring combinatorial practice, with freedom to explore neighbors"
}
```

## Small state machine

| State | Evidence | Next step |
|---|---|---|
| `unseen` | No attempt | Demonstrate one pattern |
| `practising` | Attempts, not yet sufficient verified evidence | Give varied instances of the same construction |
| `ready` | ≥3 verified successful attempts, ≥2 distinct combinations | Offer the next level, schedule spaced review |
| `mastered` | ≥5 verified successes, ≥3 combinations, ≥2 different days | Keep occasional reviews, test new packs |
| `review_due` | Previously mastered, then failed a verified review | Show the same concept in a new context |

These are **v1 implementation thresholds**, not scientific claims about perfect mastery. Update thresholds based on real reliability and language-teacher review. An `again` or `hard` grade without trusted correctness is recorded as feedback, not silently labelled an objectively failed exam.

Evidence types:
- `self_report`: learner says it felt easy/hard. Useful for pacing, **not proof of correctness**.
- `model_feedback`: provisional assessment; never automatically authoritative.
- `voice_unverified`: audio exercise without a validated speech assessor.
- `exact_match`: deterministic comparison to *approved* accepted-answer set (normalize spelling, sandhi alternatives, accent where appropriate).
- `human_review`: explicitly reviewed against a vetted rubric.

## On every lesson turn

1. Resolve the learner from OAuth through a trusted server. **Never rely on ChatGPT account name, prompt text or a caller-provided user ID.**
2. Load a bounded lesson context: teaching style, focus, top due skills, approved relevant pack facts; not full exercise history.
3. Render a five-ring wheel and provide the student's chosen `pack` at their selected `level`.
4. Ask for one production/recognition attempt. Reveal IAST/English only as preferences and lesson mode permit.
5. Receive assessment with evidence source; record once via an idempotency key.
6. Respond with one concise correction and, optionally, `Why did that change?`.
7. If repeated errors occur, recommend one *neighbor skill* but keep current focus pinned. If ready, offer a new level without locking other wheels.
8. End on user choice, not another nagging question. Never claim a skill mastered without cross-day verified evidence.

### When confusion is discovered

`ErrorTag → skill_id → simplest related level`. E.g. `verb-person` → Action 3.1; `case-destination` → Action 3.3; `kuta-tatra` → Conversation 1.2. This is a static, versioned map. Learn the *failure mode*, not the entire chat.

### Learning transfer

If a learner produces `ahaṃ paṭhāmi` correctly in the Classroom pack, present the same morphology later with Trika and About Me. Grammar mastery stays attached to `verb.present.person`; word familiarity stays attached to pack vocabulary. Do not force every pack to be completed.

## Minimal model-visible context

```json
{
  "teaching_style": {"pacing":"Short quick-fire","script_reveal":"Devanagari first"},
  "daily_focus": {"wheel_id":"action","level_id":"3.1","pack_id":"classroom"},
  "skill_summary": [
    {"skill_id":"verb.present.person","stage":"practising","seen":4,"verified_correct":1,"due":false}
  ],
  "approved_pack_facts": [{"pack_id":"about-me","fact":"Interested in Sanskrit"}],
  "pending_suggestions":0
}
```

Rule: context <= a few KB, prioritized for the current practice. Long-term events remain server-side.

## Recommendations (transparent)

1. Learner's explicitly selected focus (today) wins, including when they detour elsewhere.
2. Then prioritize a review that is due.
3. Then choose the earliest prerequisite-ready level that isn't finished.
4. Offer exploration sideways and a way back. Don't forcibly switch based on hidden ranking.

The time zone is a user-controlled IANA string; never infer precision of location or save it for this purpose.

## Scheduling

Start with deterministic 1, 3, 7, 14, 30, 60, 120 day intervals based on verified successes. Compute due-on-read; no background job is needed for daily recommendations. For a future FSRS replacement, use an existing maintained implementation and test schedules against its reference vectors. Don't roll your own FSRS equations.
