---
name: wander-review
description: Bounded multi-specialist review of ONE focused Wander target (a plan area such as Q16 recovery or the cost model, a design, or implemented code) that ends in a consolidated report — no question asked, nothing decided, no file written. Use when the PO wants analysis to read; use /wander-council when he wants to decide.
argument-hint: "<focused target, e.g. 'Q16 identity and recovery' or 'code: backend planning module'>"
disable-model-invocation: true
allowed-tools: Read Grep Glob Agent
---

# wander-review

Target: **$ARGUMENTS**

Empty or "review everything" → ask for one focused target and stop. A narrow question never triggers a full-plan read.

Run **steps 1–6 of `.claude/skills/wander-council/SKILL.md`** with its budget (≤ 2 rounds, ≤ 6 dispatches), with these differences:
- Skip the Tier-B/C early exits in step 1 — the PO asked for analysis, give it.
- For code targets route to `wander-code-reviewer` (+ `wander-skeptic-qa` for missing tests, + `wander-security-reviewer` for `identity/` or `shared/web/`).
- Consolidate with the report template in `.claude/skills/wander-review/reference.md` instead of the one-page summary: preserve disagreements side by side, mark failed citation checks `UNVERIFIED`.
- Tier-A items end as PROPOSED decision records with options, plus the line "Muốn chốt thì chạy `/wander-council <ID>`".
- Write nothing, ask nothing, approve nothing. End with "Không có file, kế hoạch hay quyết định nào bị thay đổi."
