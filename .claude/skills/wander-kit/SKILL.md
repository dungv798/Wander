---
name: wander-kit
description: Shared working contract for Wander specialist subagents (status tokens, decision tiers, evidence rules, report formats, project map). Preloaded into every wander-* agent; not a user command.
user-invocable: false
---

# Wander kit — read once, apply everywhere

## Project in 8 lines
- Wander: Vietnamese trip-planning app, personal project built **for learning**. PO = a backend engineer (Java/Spring, DDD, CQRS at FPT). Teach while you analyse.
- Source of truth for product: `docs/wander-master-plan.md` (v0.4, **read-only**). Before reading it, read the section map `.claude/rules/wander-product-context.md` and open only the sections you need.
- Stack (APPROVED): Java 21 + Spring Boot 4.1 (ADR-002, ADR-004), Clean Architecture + DDD + CQRS, modular monolith `identity` / `planning`, JPA/Hibernate + Flyway + PostgreSQL, AWS target (nothing deployed), React + TypeScript web. Layout ADR-003 (PROPOSED). Map: `docs/architecture/README.md`.
- Open technical decisions: `docs/architecture/open-decisions.md` (AD-x). Defaults, release gates RG-1…RG-7, progress: `docs/implementation/decisions.md`.
- Product decisions APPROVED: D15–D19 (anonymous identity + server storage; optional time, manual order; cost = non-negative integer thousand VND; empty ≠ 0, "included" not in totals; soft delete + Undo, no edit history) and D20–D26 (recovery direction: code + trusted device, no email/phone, code single-use, confirm replacement before commit, re-auth for destructive ops, show code once).
- OPEN product questions: Q16 (detailed auth design — gate RG-1), Q17, Q18 (mostly Tier B), Q11, Q13, Q14, Q6–Q9, Q12 (1b). P1–P15 are proposals.
- Code: `backend/src/main/java/com/wander/{identity,planning,shared}`; tests `backend/src/test/java` (ArchUnit `ArchitectureTest`, domain tests, `*IT` API tests on Testcontainers); web `web/src`; browser tests `e2e/`.- Code graph: if `mcp__code-review-graph__*` tools exist in your session, use them to find callers/dependents/tests before reading folders (call `get_minimal_context_tool` first, `detail_level="minimal"`).

## Status tokens (tag every claim that matters)
`APPROVED` (✅ in plan, or an APPROVED ADR) · `PROPOSED` (🔶, suggestion) · `INFERENCE` (derived from a decision, not itself approved) · `OPEN` (❓) · `UNVERIFIED` (🧪 or missing evidence) · `CONTRADICTION` (two authoritative statements conflict — quote both). 📎 = evidence from the real trip file. 🔁 = superseded history. Agent agreement is never evidence.

## Decision tiers (what goes to the PO)
- **Tier A — PO must decide:** stack/framework/new runtime dependency, architecture or module/aggregate boundaries, schema changes that change product meaning, auth/security mechanism, cloud services/cost, API breaking change, data retention, anything costing > 1 day to reverse, blocking 🔶/❓ product items.
- **Tier B — pick a default, log it:** limits, codes, naming, copy, formatting, most Q18 details, internal refactors, versions inside an approved stack.
- **Tier C — just do / omit.**
Only Tier A appears under "Questions for the user". State your Tier-B default in one line instead of asking.

## Evidence rules
- Cite `path` + section/ID; add line numbers only if you read those lines in this run. Never invent citations, numbers, prices, benchmarks or test results — write `UNVERIFIED`.
- Concrete scenarios beat generic warnings: who, device, step, outcome.
- Distinguish confirmed contradictions from hypothetical risks.
- You are read-only. Never claim you changed, ran or approved anything. Never delegate.

## Output formats (Vietnamese; keep IDs, symbols and tokens as-is)

**Planning / design report (default), ≤ 600 words:**
1. Phạm vi — what you reviewed (files, sections).
2. Nguồn — sources read.
3. Phát hiện — ordered by impact, each tagged with a token and a Tier.
4. Phương án — only for real decisions: ≥ 2 options, each with benefit, cost/risk, reversibility, "học được gì".
5. Rủi ro — severity + concrete scenario.
6. Chưa rõ — what the evidence cannot settle.
7. Khuyến nghị (không phải quyết định) — your position in one or two sentences.
8. Độ tin cậy — High/Medium/Low + one-line reason.
9. Câu hỏi cho PO — Tier A only, ≤ 3, each with options + recommendation. Write "Không có" if none.

**Code review report** (wander-code-reviewer): see that agent's own format.

**Rebuttal (round 2), ≤ 200 words:** `Chấp nhận` / `Giữ nguyên` / `Thu hẹp` + the one piece of evidence or scenario that justifies it. No new topics.
