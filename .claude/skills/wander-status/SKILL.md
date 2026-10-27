---
name: wander-status
description: Show where the Wander project stands right now — git state, latest verification runs, backend test totals, open technical decisions (AD-x), release gates — and suggest the single most useful next step. Use when the PO asks "tiến độ", "đang ở đâu", "next step là gì" or at the start of a work session.
allowed-tools: Read Grep Glob Bash(node tools/wander-status.mjs*)
---

# wander-status

## Steps
1. Run `node tools/wander-status.mjs` once (read-only, < 1 s, always exits 0). That snapshot is your source; do not rebuild it by reading the files it summarises.
2. Read `docs/implementation/decisions.md` §6 (Tiến độ) only if the PO asks about features; do not re-read files the snapshot already summarises.
3. Answer in Vietnamese, ≤ 12 lines:
   - **Đang ở đâu** — slice, last commit, tests (counts + time; say "cũ" if older than the last commit or superseded), uncommitted changes.
   - **Đang chặn** — open gates that block the next milestone (RG-1 blocks real users; RG-5 blocks deployment) and Tier-A decisions whose "cần quyết trước" has arrived.
   - **Bước tiếp theo** — ONE recommendation with the command to run (e.g. `/wander-council AD-1`, `/wander-feature A-15`, `/wander-verify verify`), plus at most two alternatives. Prefer: failing tests → fix; uncommitted verified work → commit; a due Tier-A decision → council; otherwise the next story.
4. Never claim a test result that is not in the snapshot or a log you read.
