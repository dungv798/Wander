---
name: wander-council
description: Let Wander specialist agents work independently, challenge each other once, converge, and bring the PO only the decisions that matter. Use for an AD-x technical decision, a Q-/P- product question, a design for one story, or a disputed approach. Hard budget (2 rounds, 6 dispatches), Tier-B points auto-defaulted and logged, Tier-A summarised on one page and asked with AskUserQuestion, answer recorded as an ADR or decision record.
argument-hint: "<AD-id | Q-id | câu hỏi thiết kế>  [report]   e.g. 'AD-1', 'Q17 xóa cả chuyến', 'thiết kế A-15 giờ ước chừng', 'AD-2 report'"
allowed-tools: Read Grep Glob Agent WebSearch WebFetch AskUserQuestion Write(/docs/architecture/**) Edit(/docs/architecture/**) Write(/docs/decisions/**) Edit(/docs/decisions/**) Edit(/docs/implementation/decisions.md)
---

# wander-council

Target: **$ARGUMENTS**

You are the orchestrator and the only arbiter. Specialists analyse; they never talk to each other directly — every challenge goes through you, and you stop the debate when the budget says so. Rules: `.claude/rules/decision-materiality.md`, `.claude/rules/planning-safety.md`. Routing and brief templates: `.claude/skills/wander-review/reference.md`.

**Budget (hard, never exceeded):** ≤ 2 rounds (1 independent + 1 targeted rebuttal) · ≤ 6 agent dispatches in total · ≤ 4 agents in round 1 · round 2 only on material disagreements, ≤ 3 of them · 1 retry only for an agent that returned nothing · ≤ 4 questions to the PO. Track the count in the task list; when a limit is reached, go to step 6 with what you have.

Mode `report` (last word of the target): run steps 1–6 and stop — no question, no file written.

## 1. Frame (no agents yet)
- Empty target → list OPEN AD-x from `docs/architecture/open-decisions.md` and the plan's open Q-items in one line each, ask which one, stop.
- Restate the question in one sentence and tier it. **Tier B** → pick the default, add a `DEFAULTED` row to `docs/implementation/decisions.md` §2, report in two lines, stop. **Tier C** → just answer, stop. Only **Tier A** continues.
- Already `APPROVED` (ADR or ✅)? Say so and stop unless the PO asked to revisit it.

## 2. Fact sheet (you read once so agents don't each re-read everything)
Read only what the question needs: plan sections via `.claude/rules/wander-product-context.md`, the AD entry, related ADRs, gates in `docs/implementation/decisions.md`, code paths (graph tools first). For current products, versions or prices, search the web (official sources first) and cite with date; unknown → `UNVERIFIED`.
Write a fact sheet of ≤ 25 lines: question · constraints with IDs and tokens (APPROVED items quoted short) · gates touched · relevant files · facts found (source, date) · what is explicitly out of scope.

## 3. Round 1 — independent (one message, parallel, `run_in_background: false`)
Choose the smallest set from the routing table (normally 2–3). Include `wander-skeptic-qa` whenever the PO will pick between options. Each brief = the fact sheet + that agent's specific question + "give ≥ 2 options with trade-offs, reversibility and học được gì; tier every point; use the wander-kit report format; ≤ 600 words". Never include your own leaning or another agent's findings.

## 4. Convergence table (you, no agents)
One row per point raised: point · position of each agent (token) · evidence · class:
| Class | Rule |
|---|---|
| **Đồng thuận** (all who spoke agree, evidence solid) | Tier B → adopt as default and log it. Tier A → becomes the recommendation to the PO (agreement ≠ correctness — say what evidence backs it). |
| **Bất đồng vật chất** (would change what the PO picks, or what it costs / risks) | Round 2 candidate. |
| **Bất đồng không vật chất** | You decide, one line of reasoning, logged as Tier B. |
| **Câu hỏi mới ngoài phạm vi** | Park in `open-decisions.md` → "Đã gác lại" (or note for the plan if product). Never chase it now. |
| **Thiếu bằng chứng** | Mark `UNVERIFIED`; only go to round 2 if one agent can settle it by reading a named source. |
No material disagreement → skip round 2 and say why.

## 5. Round 2 — targeted rebuttal (only agents involved, one message, parallel)
For each material disagreement (≤ 3): send the opposing claim quoted verbatim + the agent's own earlier claim; ask for `Chấp nhận` / `Giữ nguyên` / `Thu hẹp` with the single piece of evidence or scenario, ≤ 200 words, no new topics. Then update the table. Whatever is still split is **preserved as a disagreement** for the PO — never averaged, never a round 3.

## 6. One-page summary to the PO (Vietnamese, ≤ 1 page, shown before the question)
1. **Câu hỏi** — one sentence, why it matters now.
2. **Đã thống nhất** — consensus points and the Tier-B defaults you adopted (one line each).
3. **Cần anh chốt** — each Tier-A point: options (2–3) with how it works, benefit, cost/risk, reversibility, *học được gì / giống gì ở FPT*; where agents disagreed and why; **khuyến nghị (không phải quyết định)**.
4. **Đã gác lại** — parked questions.
5. **Chi phí** — agents used, rounds run, dispatches (e.g. "3 agent · 2 vòng · 5 lượt").

## 7. Ask and record
- One `AskUserQuestion` call (≤ 4 questions, recommended option first marked "(Recommended)").
- Technical answer → `docs/architecture/adr/ADR-<next>-<slug>.md` (status `APPROVED`, date, the PO's choice in his words, options considered, consequences, follow-up tasks; same shape as ADR-004) and set the AD row to `APPROVED → ADR-<n>`; add the ADR to the table in `docs/implementation/decisions.md` §1.
- Product answer → `docs/decisions/DR-<next>-<slug>.md` with the same shape. The master plan changes only if the PO explicitly says so.
- Tier-B defaults adopted → rows in `docs/implementation/decisions.md` §2.
- No answer / unattended → leave the item `OPEN`, add the summary under its entry in `open-decisions.md`, stop.

## 8. Close (≤ 6 lines)
Decision and where it is recorded · defaults logged · parked questions · follow-up work (implementation goes through `/wander-feature`, never inside this skill) · files changed · budget used.

## Never
Implement code · create cloud resources or secrets · mark anything `APPROVED` without the PO's answer in this conversation · let agents dispatch agents · re-ask an agent the same question · exceed the budget.
