<!-- vendored: source=/root/svread/REVIEW-FINDINGS.md sha256=dadd09b766360c01a7c5bff89b22639193573c480b3b7db8b5ef42502706e3a6 fetched=2026-11-11
     edit the source, not this copy; regenerate with tools/emit_endgame_docs.py -->

# Review handoff — 2026-11-11

## IPVV #12 (head 6c7fdc9)
- Gate sampling repeats item IDs to fill 20 slots. Stage-one pools have fewer than 20 unique items; scoring counts repeated IDs more than once. Sample without replacement and define behavior for small pools.
- Session use is read then updated unconditionally; simultaneous submissions can both pass the check. A failure after marking used can lose the receipt. Use atomic conditional consumption and durable, idempotent result/progress persistence; test concurrency and partial failures.
- No PR workflow run or combined status was observed for this head. The PR reports 12 tests; this review did not run them.

## svread #19 (head 7829ea4)
- Backup archives whole working trees, including ignored/untracked files, without excluding .env or .dev.vars. Audit any previously uploaded archives and protect credentials.
- Skip logic compares only HEAD and dirty boolean; further changes to a dirty worktree can be skipped. Tar exit status is not checked before completing upload. The check compares manifest and sidecar and checks object presence, but does not rehash archive contents.
- GRETIL admission is broad despite varying per-edition terms; evaluation-set creation copies source text without an item-level admission check. Record edition-level rights and verify each use. The committed benchmark texts are visible to contributors, so the holdout policy is not technically enforced.
- Reader integrity workflow #228 succeeded.

## svread #18 (head a143106)
- Vendoring with source hashes and an explicit modern-assembly caveat is useful. The supposed missing-upstream test invokes the same hard-coded path twice; it does not simulate both cases. The verbatim test checks only the first 60 characters of DO text. Reader integrity #226 succeeded.

## svread #17 (head ab947a7)
- Honest progress/unavailable states are a useful correction. Reader integrity #224 succeeded.

## svread #16 (head bca2e47)
- Replace documented local database password examples with environment-variable placeholders. Reader integrity #222 succeeded.

## svread #15 (head 872b06c)
- Certificates honestly mark Lean pending. rule_table_sha hashes the set of sutra codes rather than rule-table contents. Verification takes lean_status from the certificate itself; independently validate proof status. Reader integrity #220 succeeded.

These findings were not posted on GitHub: the connected integration returned 403 when submitting a review.
