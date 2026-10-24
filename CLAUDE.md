# Wander — project context

Wander is a Vietnamese-language trip-planning app (personal project: built for fun and **for learning** — the Product Owner is a backend engineer practising the stack he uses at FPT; monetization deferred). **Status: implementation of Lát 1a in progress, authorized by the Product Owner** (default-first; ask only on Tier-A decisions). Q16 (detailed auth/recovery design) and G7 stay OPEN/UNVERIFIED: **do not ship to real users until the PO approves the Q16 design (release gate RG-1).**

## Stack (APPROVED, ADR-002, 24/10/2026)
Java 21 · Spring Boot 4 · **Clean Architecture + DDD + CQRS** · modular monolith (`identity`, `planning`) · JPA/Hibernate · PostgreSQL (Flyway) · AWS (target; nothing deployed) · front end React + **TypeScript** (Vite).
- Map, request lifecycle, feature recipe, "learn from the code": `docs/architecture/README.md`.
- Layout rules enforced by `backend/src/test/java/com/wander/ArchitectureTest.java` (ArchUnit).
- Open technical decisions for the PO: `docs/architecture/open-decisions.md` (AD-1…AD-11). Defaults, gates, progress: `docs/implementation/decisions.md`.
- Run/verify on Windows: `powershell -ExecutionPolicy Bypass -File tools\dev.ps1 <doctor|backend-test|e2e|verify|run>`; logs in `.logs/`. Never claim a test result you did not read from a log.
- `legacy/ts-server/` is the old TypeScript server, kept only as an API-contract reference (AD-10). Do not extend it.

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
Q16 (detailed auth/recovery design), Q17 (Undo scope, trip-level soft delete, permanent delete), Q18 (small details — mostly Tier B, defaults logged), Q11, Q13, Q14, and 1b questions Q6–Q9, Q12. Proposals P1–P15 remain proposals unless the plan marks them ✅.

## Agents and skills (project-local)
- Agents in `.claude/agents/` (read-only, no delegation): `wander-product-analyst`, `wander-software-architect` (stack-aware, system design, teaches), `wander-security-reviewer` (design + code), `wander-skeptic-qa`, `wander-code-reviewer` (Java/TS change review, uses code-review-graph).
- Skills (invoke manually): `/wander-feature` (implement one story end to end), `/wander-architecture-decision` (prepare + ask a Tier-A technical decision, write the ADR), `/wander-review`, `/wander-decision-audit`, `/wander-spec-review`, `/wander-autopilot` (planning-only reviews; state in `docs/autopilot/`).
- Rules: `.claude/rules/` (`decision-materiality.md`, `planning-safety.md`, `review-output.md`, `wander-product-context.md`). Guide: `docs/agent-system.md`.

## Tooling for AI-assisted work
- **RTK** (`rtk`, token-optimizing CLI proxy): installed with a global Claude Code hook (`rtk init -g`); shell commands are rewritten through it automatically. `rtk gain` shows savings.
- **code-review-graph** (code knowledge graph over MCP, `.mcp.json`): before reviewing or changing code, prefer its review-context / impact tools over reading whole folders. Rebuild with `code-review-graph build` after large changes.

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
