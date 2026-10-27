# Wander — project context

Wander is a Vietnamese-language trip-planning app (personal project: built for fun and **for learning** — the Product Owner is a backend engineer practising the stack he uses at FPT; monetization deferred). **Status: implementation of Lát 1a in progress, authorized by the Product Owner** (default-first; ask only on Tier-A decisions). Q16 (detailed auth/recovery design) was approved by the PO on 24/10/2026 (`docs/decisions/DR-001`; RG-1 closed for design) but **G7 stays UNVERIFIED (RG-2): do not ship to real users while RG-2, RG-5, RG-6, RG-7 are open.**

## Stack (APPROVED, ADR-002, 24/10/2026)
Java 21 · Spring Boot 4 · **Clean Architecture + DDD + CQRS** · modular monolith (`identity`, `planning`) · JPA/Hibernate · PostgreSQL (Flyway) · AWS (target; nothing deployed) · front end React + **TypeScript** (Vite).
- Map, request lifecycle, feature recipe, "learn from the code": `docs/architecture/README.md`.
- Layout rules enforced by `backend/src/test/java/com/wander/ArchitectureTest.java` (ArchUnit).
- Chuẩn mã FE (PO 26/10/2026: SOLID, comment trước mỗi hàm, không hard-code, tệp const, cấu trúc theo tính năng, thành phần dùng lại): `docs/architecture/frontend-standards.md`; bộ màu thương hiệu duy nhất: `docs/ux/prototype/tokens.css`.
- Versions: Java 21 + Spring Boot 4.1 (ADR-004, APPROVED). Open technical decisions for the PO: `docs/architecture/open-decisions.md` (AD-1…AD-10). Defaults, gates, progress: `docs/implementation/decisions.md`.
- Setup and run guide for humans: `README.md` (install, run, dev mode, tests, env vars, troubleshooting).
- Run/verify on Windows: `powershell -ExecutionPolicy Bypass -File tools\dev.ps1 <doctor|backend-test|e2e|verify|run>`; logs in `.logs/`. Never claim a test result you did not read from a log.
- The old TypeScript server was removed (ADR-007, AD-10); the API contract lives in `web/src/api.ts` and the Java `*IT` tests. Old copy: `git show b6bd606:legacy/ts-server/<file>`.

## Design first (PO, 25/10/2026) — `.claude/rules/design-first.md`
**Cổng DG-1 ĐÃ ĐÓNG (PO duyệt 25/10/2026: `DR-010`; A1/A2/B1 ở `DR-011`): backend mới làm theo `docs/ux/data-needs.md` §2, dừng đúng chỗ khi gặp câu Tầng A còn mở (A3, B2, B3, B4, E1, Q-d, Q6–Q9, Q12).** Kỹ năng bắt buộc theo từng giai đoạn (`spec-driven-development`, `planning-and-task-breakdown`, `ui-ux-pro-max`, agent UX/UI, `wander-skeptic-qa`, `systematic-debugging`, `test-driven-development`), gọi bằng công cụ Skill và ghi "Công cụ đã dùng" cuối mỗi báo cáo. Điều phối: `/wander-design`. Đặc tả: `docs/ux/design-spec.md`.

## What to ask vs decide — `.claude/rules/decision-materiality.md`
- **Tier A (ask the PO first, with options + recommendation, explained so he learns):** stack/framework/new runtime dependency, architecture & module/aggregate boundaries, schema changes that change product meaning, auth/security mechanism, AWS services/cost/infrastructure, API breaking changes, data retention, anything hard to reverse, blocking 🔶/❓ product items.
- **Tier B (decide, log in decisions.md §2, mention in one line):** defaults inside an approved direction — limits, codes, naming, copy, most Q18 details.
- **Tier C (just do).**

## Source of truth
- Master plan: `docs/wander-master-plan.md` (verified **v0.4**). Written in Vietnamese. Keep Vietnamese product terms and IDs (D15, Q16, R6, A-0…) unchanged.
- **Never edit the master plan** unless the user explicitly says to. Propose changes in a report instead.
- Read only the sections you need. Section map: `.claude/rules/wander-product-context.md`.

## Slices
- **Lát 1a** = personal planning core, one user: anonymous identity, server-side storage, open on another device, secure auth/recovery of trip ownership (D15), trips/days/items, manual ordering, costs, soft delete + Undo, Rest/Task. No sharing.
- **Lát 1b** = sharing and collaboration: join by link + display name, propose/accept/reject, per-member checklist completion, permissions.

## How to read status (only ✅ / an APPROVED ADR is a decision)
✅ → `APPROVED` · 🔶 → `PROPOSED` / `INFERENCE` · ❓ → `OPEN` · 🧪 → `UNVERIFIED` · 📎 evidence · 🔁 superseded history.

## Approved product decisions (plan §14.1, §15.0)
- **D15 (Q1):** anonymous identity + server-side storage in 1a; trip opens on another device; secure auth/recovery of ownership must be *designed* (direction D20–D26; detailed design Q16 pending).
- **D16 (Q2):** time and duration optional; manual item order; each activity belongs to its chosen day; Rest added manually.
- **D17 (Q3):** cost = non-negative integer in thousand VND; show full VND; may be empty; reject negative/malformed.
- **D18 (Q4):** empty = unknown; 0 = known zero; "included" has its own checkbox + optional reference price and is **not** added to "tổng phải trả thêm".
- **D19 (Q5):** soft delete + Undo; "Đã xóa gần đây" kept until permanent delete; **no edit history**; permissions in sharing decided in 1b.
- **D20–D26 (Q16 direction):** no recovery without accepted evidence, permanent loss accepted; 1a evidence = self-kept recovery code + trusted device approval, no email/phone; one identity, many trips, one code; code single-use, regeneration needs a valid session; recovery completes only after a replacement code is confirmed; re-authentication before permanent trip delete / code regeneration / ownership transfer; show the code once at identity creation, skipping allowed with a warning.

## Still OPEN — do not decide (product)
**26/10/2026: PO answered most of the list below in `docs/decisions/DR-018-po-tra-loi-hang-loat-26-10.md` (Q6–Q9, Q12, Q13, A3, B2–B4, E1, F1–F4, G1–G5, N-1…N-4, Q-d). Next phase = real FE build before backend. Still open: DR-018 §5 (Q10, Q15, N-x sub-questions, phase order, DG-2 closing record).**
Q13 and 1b questions Q6–Q9, Q12 (plus Q10, Q15 deferred). Resolved since the plan: Q16 (`DR-001`), Q11 (`DR-002`, package C), Q14 (`DR-003`), Q17b (`DR-004`); Q17 a/c and Q18 details are Tier B defaults in `docs/implementation/decisions.md` §2. Proposals P1–P15 remain proposals unless the plan marks them ✅.

## Agents and skills (project-local) — guide: `docs/agent-system.md`
- **Agents** (`.claude/agents/`, read-only, never delegate, contract preloaded from the `wander-kit` skill): `wander-software-architect` (design, system design, AD-x options, teaches), `wander-security-reviewer` (design + code), `wander-product-analyst` (scope, acceptance criteria), `wander-skeptic-qa` (challenges claims, edge cases, missing tests), `wander-code-reviewer` (Java/TS change review via code-review-graph).
- **Skills** (type them): `/wander-status` (where are we, next step) · `/wander-council <AD-x|Q-x|câu hỏi>` (agents debate within a budget, PO decides, ADR written) · `/wander-feature <story>` (implement end to end) · `/wander-verify [cmd]` (real test runs, results from logs) · `/wander-review <target>` (analysis only) · `/wander-decision-audit <claim>` · `/wander-spec-review <file>` · `/wander-autopilot` (unattended planning runs, state in `docs/autopilot/`).
- **Rules** (`.claude/rules/`): always — `planning-safety.md`, `decision-materiality.md`; loaded with matching files — `backend.md`, `frontend.md`, `wander-product-context.md` (plan section map), `review-output.md`.
- **Budgets:** multi-agent ≤ 2 rounds and ≤ 6 dispatches; implementation ≤ 3 verify-fix cycles; off-scope questions are parked, not chased.

## Tooling for AI-assisted work
- **RTK** (token-optimizing CLI proxy, global hook from `rtk init -g`, telemetry off): shell commands are rewritten through it automatically; `rtk gain` shows savings.
- **code-review-graph** (MCP, `.mcp.json`; usage below). Rebuild with `code-review-graph build` after large changes. Re-running its `install` rewrites `.claude/settings.json` — see `docs/agent-system.md` before doing that.

## Evidence and uncertainty
Cite `path` + section/ID (+ line numbers only if you read them in this session). Never invent citations, line numbers, metrics, or test results. Say `UNVERIFIED` when evidence is missing.

<!-- code-review-graph MCP tools -->
## MCP Tools: code-review-graph

**This project has a knowledge graph. Start with the code-review-graph
MCP tools to narrow scope, then read the source.** The graph is cheaper than scanning files and
gives you structural context (callers, dependents, test coverage) that file search cannot.

### When to use graph tools FIRST

- **Exploring code**: `semantic_search_nodes_tool` or `query_graph_tool` instead of Grep
- **Understanding impact**: `get_impact_radius_tool` instead of manually tracing imports
- **Code review**: `detect_changes_tool` + `get_review_context_tool` instead of reading entire files
- **Finding relationships**: `query_graph_tool` with callers_of/callees_of/imports_of/tests_for
- **Architecture questions**: `get_architecture_overview_tool` + `list_communities_tool`

### Verify in the source

- Narrow scope with the graph, then read the source. Do not change code from graph output alone.
- For any non-trivial change, read the implementation and the relevant tests before concluding.
- Verify the exact source when touching behavior, database logic, migrations, retries, fallbacks,
  recovery, or compatibility code.
- When the graph and the source disagree, the source wins. The graph may be stale or may not
  model that relationship.
- An empty graph result can mean "not indexed" or "not statically visible", not "does not exist".

### Key Tools

| Tool | Use when |
| ------ | ---------- |
| `detect_changes_tool` | Reviewing code changes — gives risk-scored analysis |
| `get_review_context_tool` | Need source snippets for review — token-efficient |
| `get_impact_radius_tool` | Understanding blast radius of a change |
| `get_affected_flows_tool` | Finding which execution paths are impacted |
| `query_graph_tool` | Tracing callers, callees, imports, tests, dependencies |
| `semantic_search_nodes_tool` | Finding functions/classes by name or keyword |
| `get_architecture_overview_tool` | Understanding high-level codebase structure |
| `refactor_tool` | Planning renames, finding dead code |

### Workflow

1. The graph auto-updates on file changes (via hooks).
2. Use `detect_changes_tool` for code review.
3. Use `get_affected_flows_tool` to understand impact.
4. Use `query_graph_tool` pattern="tests_for" to check coverage.
<!-- /code-review-graph MCP tools -->
