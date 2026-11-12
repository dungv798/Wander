# AI-assisted workflow

Wander is built by one engineer (the "product owner", PO) working with Claude Code. This page states what the AI does, what it
may not do, and where a human decides. The setup is versioned in the repo under `CLAUDE.md` and `.claude/`.

## Building blocks

| Piece | Where | Role |
|---|---|---|
| Project memory | `CLAUDE.md` | Stack, slices, approved decisions, what is still open. Loaded every session. |
| Rules | `.claude/rules/` | Always-on safety (`planning-safety.md`), a decision-materiality tiering (`decision-materiality.md`), plus backend/frontend/review rules loaded when matching files are touched. |
| Specialist agents | `.claude/agents/` | Five **read-only** reviewers: software architect, security reviewer, product analyst, skeptic/QA, code reviewer. They have no edit tools and cannot delegate. |
| Skills | `.claude/skills/` | Repeatable workflows: `/wander-feature` (story end to end), `/wander-verify` (real test runs), `/wander-review`, `/wander-council` (bounded multi-agent debate), `/wander-spec-review`, `/wander-decision-audit`, `/wander-status`. |
| Guard hook | `.claude/hooks/` | Blocks writes to the master plan and confines unattended planning runs to their own state directory. |
| Code graph | MCP `code-review-graph` | Structural index (callers, impact radius, tests-for) used to narrow a review before reading source. |

## Permission boundaries

- Agents are read-only; only the main session edits files, and it never edits `docs/wander-master-plan.md` unless told to in that conversation.
- No silent promotion: a proposal, an inference or agent consensus is never recorded as a decision. Only an ADR/decision record marked `APPROVED` after the PO said so counts.
- Forbidden without explicit approval: creating cloud resources, pipelines or secrets; force-push or history rewrite; shipping to real users while the security gates are open; weakening permission boundaries.
- Secrets, tokens and `.env` content are never printed or committed (`gitleaks` runs in CI).
- Test results are only reported from logs or JUnit XML actually read in the session; otherwise the status is `UNVERIFIED`.
- Work is bounded: multi-agent work ≤ 2 rounds and ≤ 6 dispatches; implementation ≤ 3 verify-fix cycles before stopping to report.

## Who decides what

| Tier | Examples | Who |
|---|---|---|
| A | Stack or new runtime dependency, module/aggregate boundaries, auth/security mechanism, cloud cost, breaking API changes, data retention | **PO.** The agent presents options with a recommendation and trade-offs, then records the answer as an ADR. |
| B | Limits, error codes, naming, copy, library versions inside the approved stack | **Agent** decides and logs the default in `docs/implementation/decisions.md`. |
| C | Formatting, file layout inside a layer, comments, fixing its own bugs | **Agent**, silently. |

## Human review gate

1. The agent proposes a change; the PO reviews the diff and the evidence (test logs, screenshots) before anything is merged.
2. Mechanical gates run on every change: ArchUnit architecture rules, JaCoCo coverage floors, Checkstyle with zero warnings,
   Testcontainers integration tests, web typecheck/lint/tests, secret and image scans in CI.
3. A reviewer agent (`wander-code-reviewer`) checks boundaries, transactions, locking and security basics; its findings are
   ranked BLOCKER/MAJOR/MINOR and a BLOCKER stops the change.
4. Only the PO merges, deploys and publishes. The AI never merges to `main` or touches the live environment.
