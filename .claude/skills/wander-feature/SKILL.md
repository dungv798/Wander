---
name: wander-feature
description: Implement ONE Wander story or change end to end in the approved stack (Java/Spring Boot Clean Architecture + DDD + CQRS backend, React/TypeScript web): trace to the plan, stop only for Tier-A decisions, design, implement, test for real (domain, ArchUnit, Testcontainers API tests, e2e), review with wander-code-reviewer, log defaults, and explain what was learned. Use for A-/B- stories or bug fixes.
argument-hint: "<story ID or change, e.g. 'A-15 giờ ước chừng' or 'fix: reorder ignores trashed items'>"
---

# wander-feature

Change: **$ARGUMENTS**

**Budget:** ≤ 1 architect consult · ≤ 2 code-review passes · ≤ 3 verify-fix cycles. Hitting a limit → stop and report what is left, do not loop.

## 0. Preconditions
Empty → ask for one story/change and stop. Read `docs/architecture/README.md` (recipe §5) and `docs/implementation/decisions.md` (defaults §2, gates §3). Backend conventions load from `.claude/rules/backend.md` when you open backend files.

## 1. Trace (no code yet)
- Find the story/rules in the plan (section map: `.claude/rules/wander-product-context.md`); tag each needed claim (APPROVED / PROPOSED / OPEN …).
- List the decisions the change needs and tier them. **Tier A** → ask now with one `AskUserQuestion` (options + recommendation, learning style); if the PO wants a debate first, hand over to `/wander-council`. A blocking ❓ product item → stop that part, keep the rest. **Tier B** → choose, note for the log.

## 1b. Công cụ bắt buộc dùng (PO yêu cầu 25/10/2026)
- Story lớn hơn một lát: gọi `/planning-and-task-breakdown` (ghi `docs/implementation/plan.md` + `todo.md`), và `/spec-driven-development` nếu đặc tả chưa có. Hai kỹ năng này chỉ viết kế hoạch, không viết mã.
- Khi cần tra API thư viện (Spring Boot 4, Jackson 3, Testcontainers, React): ưu tiên MCP `context7` (nếu đã được duyệt và có trong phiên) thay vì đoán từ trí nhớ.
- Hiểu nhanh phạm vi mã: `code-review-graph` trước, đọc mã sau. Chỉ khi cần tổng quan một lần mới chạy `npx repomix@1.18.1 --compress ...`.

## 2. Design sketch (≤ 15 lines)
Aggregate + invariants · command(s) · query/read model · migration · endpoint · tests per level. Show it to the PO before coding only if the change touches > 1 module, the schema, or the API contract. Non-trivial design → one `wander-software-architect` consult with a self-contained brief.

## 3. Implement (order from `.claude/rules/backend.md`)
Domain + domain tests → new Flyway migration → infrastructure mapping → application command/query → API → `*IT` (positive + negative) → web/e2e if UI changes. Keep `web/src/api.ts` in sync.

Kỷ luật test: logic domain làm theo `/test-driven-development` (viết test đỏ trước, rồi mới viết mã). Khi một test đỏ ngoài dự kiến: gọi `/systematic-debugging`, đọc lỗi thật trong log, tìm nguyên nhân gốc trước khi sửa; không đoán.

## 4. Verify for real
Run `/wander-verify backend-test` (and `e2e` if UI changed). Fix and re-run within the budget. Results come only from `.logs/` and the JUnit XML; if nothing could run, say so and mark `UNVERIFIED`.

## 5. Review
Dispatch `wander-code-reviewer` naming the changed files and the story ID. Fix BLOCKER/MAJOR, re-verify, optionally one more review pass on the fixes only. List MINOR/NIT without fixing unless trivial.

## 6. Record and report
- `docs/implementation/decisions.md`: progress row (§6), `DEFAULTED` rows (§2), gates touched (§3).
- Report (Vietnamese, short): files changed · test counts from the log · Tier-A items still open · **"Học được gì"** — 2–3 bullets linking a concept to the exact code (e.g. why the lock is optimistic here, why the query skips the aggregate).
- Commit only if the PO asks.

## Never
Ship to real users while RG-1 is open · create cloud resources or secrets · add a runtime dependency without a Tier-A answer · edit an applied migration · edit `docs/wander-master-plan.md`.
