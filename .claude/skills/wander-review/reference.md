# wander-review reference

## Routing (risk-based; use the smallest set that covers the target)
| Target type | Round 1 agents | Add only if |
|---|---|---|
| Identity, ownership, auth, recovery (Q16, D15, A-0) | security-reviewer, software-architect, skeptic-qa | product-analyst when scope or the 1a/1b boundary is in question |
| Cost model (D17/D18, R2–R4, Q18 cost part) | software-architect, skeptic-qa | product-analyst for replay mapping of the 32 "—" cells |
| Time and ordering (D16, R6, Q18 time part) | software-architect, skeptic-qa | product-analyst for acceptance criteria |
| Soft delete / Undo / permanent delete (D19, Q17) | software-architect, skeptic-qa | security-reviewer for retention/privacy; analyst for scope |
| Lát 1a scope, dependencies, blockers (§6, §9, §15.6) | product-analyst, skeptic-qa | architect for 1a→1b migration; security for D15 items |
| Lát 1b permissions, links (Q6–Q9, Q12) | security-reviewer, product-analyst, skeptic-qa | architect for concurrency/data model |
| Unresolved-question triage (Q11, P13) | product-analyst | skeptic-qa for hidden dependencies |
| Architecture / system design / tech choice (AD-1…AD-11, ADR) | software-architect | security-reviewer for auth/exposure; use `/wander-council` when the PO must choose |
| Implemented code (backend/, web/) | code-reviewer, skeptic-qa | security-reviewer for identity/, shared/web; architect if a boundary moves |
Minor wording or single-fact checks: use `/wander-decision-audit`, not a multi-agent run. Used by `/wander-review`, `/wander-council`, `/wander-spec-review` and the autopilot `route-hint` (keep the table shape: 3 columns, agent names without the `wander-` prefix).

## Round-1 brief template (one per agent, self-contained: agents do not see this conversation)
```
Target: <one sentence>.
Read only: docs/wander-master-plan.md sections <§ list> (IDs: <D…/Q…/R…/A-…>).
Status tokens in play: <ID → token> (from the plan; verify).
Your question: <specific to this specialist's role>.
Constraints: read-only; do not decide OPEN items; stack is fixed by docs/architecture/adr/ADR-002 (anything outside it is Tier A); tier every open point per .claude/rules/decision-materiality.md and ask only Tier A; no delegation.
Return the planning/design report from your preloaded wander-kit skill (same 9 sections as .claude/rules/review-output.md), in Vietnamese, ≤ 600 words.
```
Do not include your own conclusions or other agents' findings in round 1.

## Disagreement / gap list (build before round 2)
For each issue: claim A (agent, token, source) vs claim B (agent, token, source) · type (factual / interpretive / risk-severity / option-ranking) · evidence that would settle it · material? (would it change what the user must decide). Only material items go to round 2.

## Round-2 brief template (targeted)
```
Context: <agent X> reported: "<exact quote, ≤ 3 sentences>" (source: <ref>).
Your earlier position: "<quote>".
Task: rebut or accept in ≤ 200 words, citing plan sections or a concrete scenario. State if it changes your confidence. Do not introduce new topics.
```

## Consolidated report template (Vietnamese; ≤ ~900 words unless the target demands more)
1. **Phạm vi và nguồn** — target, plan version read, sections read, agents used (and why not others).
2. **Đồng thuận** — points several agents support independently (note: agreement ≠ correctness).
3. **Bất đồng được giữ nguyên** — each side, evidence, what would settle it. Mark whether round 2 ran.
4. **Khoảng trống bằng chứng** — `UNVERIFIED` items; failed citation checks.
5. **Phương án và đánh đổi** — only for OPEN items; all labeled PROPOSED.
6. **Rủi ro chính** — severity-ordered, scenario-based.
7. **Cần bạn phê duyệt** — Tier A only (Tier B goes to a one-line "Mặc định đã chọn" list); decision records: `ID` · question · options · what each locks in · reversibility · orchestrator's recommendation (marked "khuyến nghị, không phải quyết định").
8. **Ranh giới** — "Không có file, kế hoạch hay quyết định nào bị thay đổi. Chỉ bạn mới có thể phê duyệt."
Token note (optional): agents ran in parallel with isolated context, which improves independence but costs more total tokens than one pass; say how many agents/rounds ran.
