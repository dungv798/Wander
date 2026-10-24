---
name: wander-decision-audit
description: Check one proposed decision, spec statement, or change against the Wander master plan. Traces each claim to a plan source, classifies it (APPROVED, PROPOSED, OPEN, CONTRADICTION, INFERENCE, UNVERIFIED), finds contradictions and missing requirements, lists affected requirements, and drafts a decision record for human approval. Single-agent, no delegation; never edits the plan or marks anything approved.
argument-hint: "<the proposed decision or statement to audit>"
disable-model-invocation: true
allowed-tools: Read, Grep, Glob
---

# wander-decision-audit

Subject: **$ARGUMENTS**

## Run only when
The user gives a specific decision, spec sentence, or change to check. If `$ARGUMENTS` is empty, ask for it and stop. For broad analysis with several viewpoints use `/wander-review`. Do **not** use this to edit the plan or to approve anything.

## Workflow (main session, no subagents)
1. **Source.** Confirm `docs/wander-master-plan.md` and its version line. Use the section map in `.claude/rules/wander-product-context.md` and read only the sections that the subject touches (use Grep for IDs such as `D18`, `R4`, `Q17` rather than reading the whole file).
2. **Decompose** the subject into atomic claims.
3. **Trace** each claim: plan source (`§` + ID, plus line numbers only if you read them now) and its status token, using the mapping in `.claude/rules/review-output.md`. A claim backed only by 🔶/❓ items is not approved; say so. Claims derived from a ✅ decision but not stated by it are `INFERENCE`.
4. **Check** for: contradictions (quote both statements), missing requirements the claim silently needs, hidden dependencies (1a→1b, §9.2), and conflicts with `planning-safety.md`.
5. **Impact.** List affected rules (R-), stories (A-/B-), risks (§12), estimates (§13), and open questions that would change.
6. **Decision record** (for human approval), in Vietnamese:
   - Mã tạm: `DRAFT-<n>` (not a D-number; D-numbers are assigned by the user when approving)
   - Câu hỏi/quyết định đề xuất · Trạng thái hiện tại (token) · Phương án (≥ 2 if consequential) và đánh đổi · Hệ quả/thứ bị khóa · Đảo ngược được không · Điều cần xác nhận
   - Dòng cuối: "Chưa được duyệt. Không có file nào bị thay đổi."

## Limits
Read-only. No edits to the plan, no status changes, no delegation, no invented citations. If evidence is insufficient, output `UNVERIFIED` rather than guessing.
