---
paths:
  - docs/autopilot/**
  - docs/reviews/**
---
# Review output contract

(Subagents get the same contract, shorter, from the preloaded `wander-kit` skill.)

Write reports in Vietnamese (keep IDs, symbols and the classification tokens below in their original form). Be concise: target ≤ 600 words per specialist report, no transcripts.

## Classification tokens (use on every claim that matters)
`APPROVED` explicitly confirmed (✅) in the authoritative source · `PROPOSED` suggestion awaiting approval · `OPEN` not decided · `CONTRADICTION` two authoritative statements conflict (quote both) · `INFERENCE` consequence derived from a decision, not itself approved · `UNVERIFIED` evidence insufficient.
Plan symbols map: ✅→APPROVED, 🔶→PROPOSED or INFERENCE, ❓→OPEN, 🧪→UNVERIFIED, 📎 = fact (evidence), 🔁 = superseded history.

## Specialist report schema (all 9 sections, in order)
1. **Scope** — what was reviewed.
2. **Source evidence** — `path` + section/ID; line numbers only if actually read.
3. **Findings** — specific, grounded, each tagged with a token.
4. **Options** — alternatives and trade-offs, when applicable.
5. **Risks** — severity, likelihood if supportable, consequence.
6. **Unknowns** — what the evidence cannot settle.
7. **Recommendation** — marked "Khuyến nghị (không phải quyết định)".
8. **Confidence** — High/Medium/Low + one-line reason.
9. **Questions for the user** — only those that change the decision.

## Rules
- Distinguish confirmed contradictions from hypothetical risks.
- Agreement between agents is not correctness. Preserve disagreements; do not average them.
- Never fabricate citations, line numbers, test results, or documentation references. If unsure, write `UNVERIFIED`.
- Use concrete scenarios (who, device, step, outcome) instead of generic warnings.
