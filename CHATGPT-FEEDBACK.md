# ChatGPT feedback — use the MCP surface, tell us what broke

*For ChatGPT (or any agent) with custom connectors. Goal: you use every MCP
tool from YOUR end; we fix what you can't reach. No vibes — every probe below
has a ground-truth expectation measured 2026-11-16. Paste back the report
template in §3 and nothing else.*

## 1. Connect (custom connectors, no auth anywhere here)

| # | URL | Expect |
|---|---|---|
| 1 | `https://shastra.svatantrya.net/mcp` | tools list incl. `translation__*` / `shastra__*` (counts drift as tools land; non-empty is the gate) |
| 2 | `https://mcp.svatantrya.net/mcp` | HTTP 200 (allow 60s — Cloudflare tunnel is slow); tools incl. `scholar__passage_evidence`, `formal__trace`, `openpatala__*` |
| 3 | `https://patala.svatantrya.net/health` | HTTP 200 (plain REST GET) |
| 4 | `https://video.svatantrya.net/mcp` | HTTP **401** (`www-authenticate: Bearer`) — that IS correct (Cloudflare Access gate, owner decision). A 200 here is a *change*, report it. |
| 5 | `https://book.svatantrya.net/mcp` | MCP endpoint alive (GET 400 without session is normal StreamableHTTP behavior, not an outage) |

## 2. Probe (in order, read-only — do NOT call write/promote/publish tools)

P1. `scholar__passage_evidence({"work":"paramarthasara","target":"param-p01-v01"})` → expect `source.text` starting `paraṃ parasthaṃ gahanād anādim` + a `layers` object with `t1`.
P2. `scholar__passage_evidence({"work":"tantraloka-a01","target":"tal-a01-v01"})` → expect `Work has no bundled Scholar projection` (isError). That is the *known coverage gap* (Tantraloka projections unmerged, PR #48) — report `P2: GAP-CONFIRMED`, not a failure.
P3. `formal__trace({"work":"paramarthasara","target":"param-p01"})` → expect a trace bundle (verdict COMPLETE or PARTIAL with named gaps).
P4. Plain GET `https://svatantrya.net/claim/paramarthasara/param-p01/` → expect answer-first HTML, hash block, verify steps (no JS needed).
P5. Plain GET `https://svatantrya.net/claim/ghatakarpara/ghat-p01/` → expect **withheld English** (`Editorial hold`, no translation quoted). If English shows here, that is a P0 — report immediately.

## 3. Report back (paste this filled in)

```
## ChatGPT surface report — <date UTC>
P1 param-p01 evidence: [PASS/FAIL] source_starts_with=<first 40 chars> layers=<keys>
P2 tal-a01 gap: [GAP-CONFIRMED/UNEXPECTED-PASS/FAIL] notes=<…>
P3 formal trace: [PASS/FAIL] verdict=<…>
P4 claim HTML: [PASS/FAIL] notes=<…>
P5 ghat hold: [HOLD-HONORED/P0-LEAK]
Unclear (anything you could not decide — say so, never guess):
Verdict: [LEGIT / LEGIT-WITH-NOTES / NOT-LEGIT]
```

## 4. Where feedback goes

- Quick: paste the report into the chat you came from.
- Durable: open an issue with title `chatgpt-surface: <one line>` and paste the report (template: `.github/ISSUE_TEMPLATE/chatgpt-feedback.yml`).
- Never: do not open PRs, do not write files, do not retry a failed probe more than once (a second identical failure IS the result).

## 5. Standing knowns (do NOT file as failures)

- P2 gap (no Tantraloka scholar projections publicly yet) — tracked in PR #48 + the coverage lane.
- Video MCP 401 — intended Access gate.
- Queue/serve counts drift (beam loop runs 24/7); only worry if `claimed` grows or workers read 0.
- Local-only fixes (bridge py3.14 shim, box env) differ from prod until deployed — say which URL you tested.
