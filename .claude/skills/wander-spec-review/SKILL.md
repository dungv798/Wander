---
name: wander-spec-review
description: Review a future Lát 1a or Lát 1b specification file BEFORE implementation. Checks traceability to approved requirements, acceptance and negative cases, data integrity, authorization, error handling and recovery, testability, scope, unresolved assumptions, and migration. Returns blockers, important issues, minor issues and open questions separately. Read-only; never edits the spec or the plan.
argument-hint: "<path to spec file, e.g. docs/slices/lat-1a.md>"
disable-model-invocation: true
allowed-tools: Read, Grep, Glob, Agent
---

# wander-spec-review

Spec: **$ARGUMENTS**

## Run only when
`$ARGUMENTS` is a path to an existing spec file. If missing or the file does not exist, say so and stop; do not invent a spec. (As of v0.3 no formal Lát 1a spec exists and the plan lists blockers in §15.6.) This skill never writes or edits the spec.

## Workflow (main session orchestrates; reuse `.claude/skills/wander-review/reference.md` for templates)
1. **Read** the spec fully, and the plan sections it cites (map in `.claude/rules/wander-product-context.md`). Do not read unrelated plan sections.
2. **Blocker gate (no agents needed).** Check the spec against plan §15.6: does it rely on an unresolved choice (Q16, Q11, P13, P2, P5…) as if decided? Does it choose an auth mechanism, UI design, database structure, or stack that the plan says must not be inferred? Each is a **Blocker** unless the plan marks it ✅ or the spec labels it explicitly as a proposal awaiting approval.
3. **Checklist** — evaluate and cite spec location + plan ID for each:
   - Traceability: every requirement maps to a ✅ item (D-, R-, A-/B- ID); nothing invented.
   - Acceptance criteria: observable, include negative cases (negative/malformed cost, empty vs 0 vs included, deleted item excluded from totals, restore to original day, order preserved across devices).
   - Data integrity and authorization: ownership, who can delete/restore/permanently delete, anonymous identity boundaries.
   - Error handling and recovery: lost device/ownership, failed save, offline/weak network (Q15 is OPEN).
   - Testability: rules written so a test can assert them; Replay criteria (§10.5) reachable.
   - Scope boundaries: 1a does not depend on 1b (§9.2); deferred items stay deferred.
   - Unresolved assumptions and dependencies; migration implications 1a→1b.
4. **Specialists (risk-based, optional).** If the spec touches identity/ownership, include `wander-security-reviewer`; if data model/ordering/cost/delete semantics, include `wander-software-architect`; always allow `wander-skeptic-qa` for edge cases. Dispatch in parallel with self-contained briefs (see reference.md); at most one targeted second round. For a small spec, skip agents and do the checklist yourself.
5. **Report** in Vietnamese, with four separate lists:
   **Blockers** · **Vấn đề quan trọng** · **Vấn đề nhỏ** · **Câu hỏi mở cho bạn**. Each item: location in spec, plan source (ID/§), token (`CONTRADICTION`, `OPEN`, …), why it matters, suggested fix marked as a recommendation.
   End with: "Không có file, spec, kế hoạch hay quyết định nào bị thay đổi."

## Limits
Read-only. No rewriting the spec, no approving decisions, no invented citations or line numbers, no recursive delegation, no repeated full reviews: re-check only items affected by a change.
