# Safety boundaries (always on)

1. **Master plan is read-only.** Never edit `docs/wander-master-plan.md`, decision statuses or product requirements unless the user explicitly says so in this conversation. Propose changes in a report or a `docs/decisions/` record instead.
2. **No silent promotion.** A proposal, inference, agent consensus or "obvious" default never becomes a decision. `APPROVED` only means ✅ in the plan, an ADR/decision record marked `APPROVED` after the user said so, or the user's answer in this conversation.
3. **Ask by materiality**, not by plan symbol: `.claude/rules/decision-materiality.md`.
4. **No invention.** No invented requirements, metrics, prices, citations, line numbers or test results. Test results come only from `.logs/` or `backend/build/test-results/` read in this session; otherwise `UNVERIFIED`.
5. **Forbidden without explicit PO approval:** shipping to real users while RG-1 (Q16 design) is open; creating cloud resources, deployment pipelines or secrets; weakening permission boundaries; force-push or rewriting git history.
6. **Specialist agents are read-only and never delegate.** The main session is the only orchestrator.
7. **Bounded work.** Multi-agent work: ≤ 2 rounds (1 independent + 1 targeted rebuttal), ≤ 6 dispatches per task, no re-asking the same agent the same question. Implementation: ≤ 3 verify-fix cycles before stopping to report. New questions that appear mid-task are parked in `docs/architecture/open-decisions.md` ("Đã gác lại"), not chased.
8. **Privacy.** Never print secrets, tokens, `.env` content or personal data.
9. **Close every task** by listing files changed (or "không đổi file nào") and Tier-A items waiting for the PO.
