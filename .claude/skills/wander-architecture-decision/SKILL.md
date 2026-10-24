---
name: wander-architecture-decision
description: Take ONE technical/architecture question for Wander (tech choice, framework, AWS service, data/consistency design, security mechanism) from open question to a PO decision recorded as an ADR. Researches options, asks the architect (and security reviewer if relevant), explains trade-offs in learning style, asks the PO with AskUserQuestion, then writes the ADR. Use for AD-1…AD-11 or any new Tier-A technical choice.
argument-hint: "<AD-id or technical question, e.g. 'AD-2 AWS compute' or 'Spring Security hay bộ lọc tự viết'>"
disable-model-invocation: true
allowed-tools: Read Grep Glob Agent WebSearch WebFetch AskUserQuestion Write(/docs/architecture/**) Edit(/docs/architecture/**)
---

# wander-architecture-decision

Question: **$ARGUMENTS**

Purpose: the PO decides architecture; agents prepare the decision and teach. (Rule: `.claude/rules/decision-materiality.md`.)

## Steps
1. **Frame.** Read `docs/architecture/open-decisions.md`, ADR-002/ADR-003 and `docs/architecture/README.md`. If `$ARGUMENTS` is empty, list the OPEN AD items with one line each and ask which one (stop). Confirm the question is Tier A; if it is Tier B, say so, pick the default, log it in `docs/implementation/decisions.md` §2 and stop.
2. **Constraints.** List the APPROVED requirements and gates it touches (D-/R-/A- IDs, RG-1…RG-7, ADR-002). Read only the plan sections needed.
3. **Facts.** For anything about current products, versions or prices, search the web (official docs first) and cite. Unknown prices stay `UNVERIFIED`.
4. **Specialists (max one round).** Dispatch `wander-software-architect`; add `wander-security-reviewer` if auth/data exposure is involved. Brief: the question, constraints, the ask "≥ 2 options with trade-offs, reversibility, learning angle, Tier classification". Do not pass your own conclusion.
5. **Ask the PO.** Write a short Vietnamese explanation (bối cảnh, phương án with pros/cons/reversibility/"học được gì", khuyến nghị — không phải quyết định), then one `AskUserQuestion` call (≤ 4 questions; recommended option first with "(Recommended)").
6. **Record.**
   - PO answered → create `docs/architecture/adr/ADR-<next>-<slug>.md` (status `APPROVED`, date, PO's choice in their words, options considered, consequences, follow-up tasks) and mark the AD row `APPROVED → ADR-<n>`.
   - No answer (unattended) → keep `OPEN`, add the analysis under the AD entry, stop.
7. **Report** in 5 lines: decision, ADR path, follow-up work, anything still open. Never implement the decision in this skill — implementation goes through `/wander-feature` or a normal task.

## Limits
No code changes. No cloud resources or secrets. Never mark `APPROVED` without the PO's explicit answer in this conversation.
