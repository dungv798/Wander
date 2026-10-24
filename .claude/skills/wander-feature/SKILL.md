---
name: wander-feature
description: Implement ONE Wander story or change end to end in the approved stack (Java/Spring Boot Clean Architecture + DDD + CQRS backend, React/TypeScript web) — trace to the plan, stop for Tier-A decisions, design, implement, test (domain, ArchUnit, Testcontainers API tests, e2e), review with wander-code-reviewer, log defaults, and report what was learned. Use for A-/B- stories or bug fixes.
argument-hint: "<story ID or change, e.g. 'A-15 giờ ước chừng' or 'fix: reorder ignores trashed items'>"
disable-model-invocation: true
---

# wander-feature

Change: **$ARGUMENTS**

## 0. Preconditions
- If `$ARGUMENTS` is empty, ask for one story/change and stop.
- Read `docs/architecture/README.md` (recipe §5), `.claude/rules/decision-materiality.md`, `docs/implementation/decisions.md` (gates, defaults, progress).

## 1. Trace (no code yet)
- Find the story/rules in the plan (map: `.claude/rules/wander-product-context.md`) and classify each needed claim (APPROVED / PROPOSED / OPEN …).
- List decisions the change needs and tier them. **Tier A → ask the PO now** with one `AskUserQuestion` (options + recommendation, learning style). Product Tier A that the plan leaves ❓ and that blocks the change → stop that part. Tier B → choose, note for the log.

## 2. Design sketch (≤ 15 lines, shown to the PO before coding if the change touches > 1 module or the schema)
Aggregate + invariants · command(s) · query/read model · migration · endpoint · tests at each level. For non-trivial design, dispatch `wander-software-architect` (one round).

## 3. Implement in this order
Domain + domain tests → Flyway migration (new `V<n>__*.sql`, never edit applied ones) → infrastructure mapping → application command/query → API → API `*IT` tests (positive + negative) → web/e2e if UI changes. Keep the HTTP contract consistent with `web/src/api.ts`.

## 4. Verify (real runs, never claimed)
On the PO's Windows machine run `powershell -ExecutionPolicy Bypass -File tools\dev.ps1 backend-test` (and `e2e` if UI changed); read `.logs\<cmd>.log` / `.status`. Fix until PASS. If you cannot run it, say so and mark results `UNVERIFIED`.

## 5. Review
Dispatch `wander-code-reviewer` on the changed files (it uses code-review-graph blast radius if available). Fix BLOCKER/MAJOR; list the rest.

## 6. Record and report
- Update `docs/implementation/decisions.md`: progress row, any `DEFAULTED` items (Tier B), gates touched.
- Report (Vietnamese, short): what changed (files), test results with counts from the log, Tier-A decisions still open, and **"Học được gì"** — 2–3 bullets linking concepts to the exact code (e.g. why the lock is optimistic here).
- Commit only if the PO asks.

## Limits
Never ship to real users while RG-1 is open; no cloud resources or secrets; no new runtime dependency without a Tier-A answer; never edit `docs/wander-master-plan.md`.
