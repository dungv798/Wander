---
name: wander-review
description: Run a bounded, evidence-based multi-specialist review of ONE focused Wander planning target (e.g. Q16 identity and recovery, the Q3/Q4 cost model, Lát 1a scope, the time and ordering model). Dispatches the read-only wander-* agents in parallel, allows at most one adversarial round, and ends with a consolidated report. Never changes the plan or any decision.
argument-hint: "<focused target, e.g. 'Q16 identity and recovery options'>"
disable-model-invocation: true
allowed-tools: Read, Grep, Glob, Agent
---

# wander-review

Target: **$ARGUMENTS**

## Run only when
The user names a focused target. If `$ARGUMENTS` is empty, or asks for a full-project review, ask for one target and stop. A narrow question never triggers a full-plan read.
Do **not** use this to approve decisions, edit the plan, write specs, or implement anything.

## Workflow (the main session is the orchestrator and arbiter)
1. **Authoritative files.** Confirm `docs/wander-master-plan.md` exists and read its header (version line). If the version is not v0.3, tell the user and continue only with what you verified. Check `CLAUDE.md` and `.claude/rules/` are present (they define status tokens and the report schema; do not restate them).
2. **Extract.** Using the section map in `.claude/rules/wander-product-context.md`, read **only** the plan sections relevant to the target. Note IDs and each item's status token. Do not read the whole plan.
3. **Route (risk-based).** Pick specialists with the routing table in `.claude/skills/wander-review/reference.md`. Do not call all four by default. State which agents you chose and why in one line.
4. **Dispatch round 1 in parallel**, in one message, using the brief template in `reference.md`. Each brief names the target, the exact sections/IDs to read, the status tokens that matter, and the question for that specialist. Never pass your own conclusions in round 1, so findings stay independent.
5. **Collect** the reports. Build the disagreement/evidence-gap list (see `reference.md`). Check that cited IDs/sections really exist in the plan; mark failed checks `UNVERIFIED`.
6. **Round 2 (optional, at most one).** Only if there is a **material** disagreement, an unchallenged option set that the user would rely on, or a claim lacking evidence. Send targeted briefs to only the agents involved, quoting the opposing claim, and ask for a short rebuttal. Do not start a third round, do not re-run unaffected checks.
7. **Consolidate** using the report template in `reference.md`. Preserve disagreements side by side; do not average or declare a winner unless evidence settles it, and say what evidence.
8. **Stop at the approval boundary.** List the decisions the user must make, each as a PROPOSED decision record with options. State plainly that no file, plan, or decision was changed.

## Hard limits
- Specialists are read-only and cannot spawn agents; never ask them to. No recursive delegation.
- Max: one parallel round + one targeted round. No loops, no automatic re-review.
- Read with Read/Grep/Glob. Do not use shell commands to read or change anything beyond a read-only version/hash check of the plan.
- Do not write files unless the user asked for a saved report; never edit the master plan.
- Never mark anything APPROVED. Only the user approves.
- Never fabricate citations, line numbers, or results.
