# Decision materiality — what to ask the PO, what to just decide

Why this rule exists: on 23/10/2026 the agents chose the whole tech stack (TypeScript/Node/SQLite) without asking, while filling reports with questions about decimal separators and currency symbols. The PO wants the opposite: **ask about what shapes the system, decide the small things yourself.** The project is also for **learning** (PO is a backend engineer: Java/Spring, DDD, CQRS at FPT), so material questions must teach, not just ask.

## Tiers

| Tier | What | What you do |
|---|---|---|
| **A — Ask before acting** | Tech stack, framework or **new runtime dependency**; architecture style, module/bounded-context boundaries, aggregate boundaries; persistence strategy and schema changes that affect product semantics; auth/security mechanism; cloud services, anything that costs money or creates infrastructure; public API contract breaks; data retention/deletion; anything hard to reverse; any product question that is 🔶/❓ in the master plan and blocks the work | Stop that part. Ask the PO with `AskUserQuestion` (≤ 4 questions, most impactful first, recommended option first and labelled "(Recommended)"). Record it in `docs/architecture/open-decisions.md` (technical) or the report (product). Continue only with work that does not depend on the answer. |
| **B — Decide and log** | Defaults inside an approved direction: validation limits, error codes, naming, copy text, UI micro-layout, test data, internal refactors, library *versions* within an approved stack | Pick a sensible default, write it in `docs/implementation/decisions.md` (§2) as `DEFAULTED`, mention it in one line of the final report. **Do not ask.** |
| **C — Just do** | Formatting, file organisation inside a layer, comments, fixing your own bugs | Do it. Do not mention unless asked. |

Tie-breakers: if unsure between A and B, ask "would reversing this later cost more than a day, or change what the user sees/pays/risks?" Yes → A. A question is never Tier A just because the plan marks it ❓ — if a sensible default exists and reversal is cheap, it is B (Q18 details are typically B).

## How to ask a Tier-A question (learning mode)
For each question give, in Vietnamese:
1. **Bối cảnh** — one sentence: what decision, why now.
2. **Phương án** — 2–3 options; for each: how it works in one line, benefit, cost/risk, how hard to reverse, *what the PO would learn / how it maps to FPT work*.
3. **Khuyến nghị** — one option with the reason, marked "khuyến nghị, không phải quyết định".
Then call `AskUserQuestion`. When the PO answers: write/update an ADR in `docs/architecture/adr/` with status `APPROVED` (PO's words) and update `open-decisions.md`.

## Hard limits
- Never mark something `APPROVED` unless the PO said so in this conversation or it is ✅ in the plan / an `APPROVED` ADR.
- Never introduce a Tier-A item silently, including by "temporary" code. If you had to stub something, label it `PROPOSED` in code comments and in the report.
- Batch questions: at most one `AskUserQuestion` call per task phase unless an answer creates a new Tier-A question.
- When the PO is not present (scheduled/unattended run): do all Tier B/C work, leave Tier-A items in `open-decisions.md`, and list them at the top of the report.
