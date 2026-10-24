# Wander product context (verified registry)

Verified against `docs/wander-master-plan.md` **v0.4**, sha256 `2d1072592109115556cbc9f84b451a68e741b438cd8a1fbfb55ea05484d1fad0`. If the plan's version or hash differs, this registry may be stale: re-verify against the plan before relying on it, and tell the orchestrator.

This file is a **map**, not a copy. For content, read the plan section.

## Section map (read only what you need)
| Topic | Plan section |
|---|---|
| Goals, resources | §1 |
| Evidence from the real trip file | §2 |
| Roles (Organizer / Member / Viewer) | §3 |
| Slices and roadmap, MoSCoW | §6.1–§6.3 |
| Entities, item types | §7.1, §7.2 |
| Business rules R1–R16 | §7.4 |
| Flows, edge cases | §8 |
| Stories 1a (A-0…A-18), independence check | §9.1, §9.2 |
| Stories 1b (B-1…B-7), Lát 2/3 | §9.3, §9.4 |
| Replay test and pass criteria | §10 (criteria §10.5) |
| Risks | §12 |
| Estimates | §13 |
| Decisions D1–D19 / proposals P1–P15 / assumptions G1–G7 | §14.1 / §14.2 / §14.3 |
| Open questions, blockers | §15 (resolved Q1–Q5 in §15.0; blockers in §15.6) |
| Working with Claude Code | §16 |

## Implementation map (outside the plan)
| Topic | Where |
|---|---|
| Stack (APPROVED by PO 24/10/2026) | `docs/architecture/adr/ADR-002-java-spring-stack.md` |
| Module/layer/CQRS layout (PROPOSED) | `docs/architecture/adr/ADR-003-modules-layers-cqrs.md`, overview `docs/architecture/README.md` |
| Open technical decisions AD-1…AD-11 | `docs/architecture/open-decisions.md` |
| Implementation defaults, release gates RG-1…RG-7, progress | `docs/implementation/decisions.md` |
| Backend code (Java) | `backend/` — `identity` and `planning` modules; tests in `backend/src/test/java` |
| Front end (TypeScript) | `web/`; browser tests `e2e/` |
| Legacy TypeScript server (reference only) | `legacy/ts-server/` |

## Status registry
- **APPROVED:** D1–D26 (D20–D26 = recovery principle and Q16 direction; Q16's detailed design is still pending the user's approval and Q16 stays OPEN). Stack ADR-002.
- **OPEN:** Q6, Q7, Q8, Q9, Q10, Q11, Q12, Q13, Q14, Q15, **Q16, Q17, Q18**; technical AD-1…AD-11.
- **Resolved into decisions:** Q1→D15, Q2→D16, Q3→D17, Q4→D18, Q5→D19 (details still open in Q16–Q18).
- **PROPOSED:** P1, P2, P4–P6, P8–P12, P14, P15; P7 and P13 are partly superseded (manual Rest approved by D16; automatic Rest and Task/"tạo nhanh" still proposed); P3 superseded by D17–D18. ADR-003.
- **UNVERIFIED assumptions:** G1–G7.
- **Blockers before a Lát 1a spec (§15.6):** Q16 design approved by the user; Q11; user confirmation of P13; P2/P5 worth review. Q17/Q18 can close during spec review (most Q18 details are Tier B: default and log).

## Reading traps
- §7.1/§9.1 rows may mix ✅ (scope) with ❓ (details) in one cell. Classify each claim separately.
- "Consequences" written after a ✅ decision are 🔶 `INFERENCE` until the user confirms them.
- Do not infer from the plan: auth mechanism details beyond D20–D26, UI design, detailed 1b permissions (plan header §"Quy tắc đọc").
- The plan says "no tech stack chosen" because it predates ADR-002. **The stack is now approved (ADR-002).** Physical schema lives in Flyway migrations as an implementation of the plan's entities; a schema change that alters product meaning is Tier A.
- Materiality: `.claude/rules/decision-materiality.md` decides what to ask.
