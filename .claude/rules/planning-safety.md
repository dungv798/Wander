# Planning safety

1. **Plan is read-only.** Do not edit `docs/wander-master-plan.md`, decision statuses, or product requirements. Recommendations stay recommendations.
2. **No silent promotion.** A proposal, inference, agent consensus, or "obvious" default never becomes a decision. Only the user approves (plan symbol ✅, or an ADR marked `APPROVED` after the user said so).
3. **Materiality decides whether to ask** (`.claude/rules/decision-materiality.md`). Tier A (stack, architecture, new dependency, security mechanism, cloud/cost, schema semantics, irreversible, blocking 🔶/❓ product items) → ask the PO before acting. Tier B → default and log in `docs/implementation/decisions.md`. Tier C → just do. Do not fill reports with Tier-B questions.
4. **No invention.** Do not invent requirements, metrics, evidence, or citations. **Stack is approved** by `docs/architecture/adr/ADR-002-java-spring-stack.md` (Java/Spring Boot, Clean Architecture, DDD, CQRS, JPA/Hibernate, PostgreSQL, AWS, TypeScript front end). Anything outside ADR-002 is Tier A.
5. **Scope.** The planning-review agents and skills (`wander-*`) are read-only. Since 23/10/2026 the Product Owner authorizes application code in the main session (`docs/implementation/decisions.md`). Still forbidden without explicit PO approval: shipping to real users while release gate RG-1 (Q16 design) is open, creating cloud resources / deployment / secret config, and any weakening of permission boundaries. Authentication is implemented only as far as D15 and D20–D26 define it.
6. **Specialist agents are read-only** (Read, Grep, Glob, plus read-only code-graph tools where listed) and **do not delegate**. If you need another specialist, say so in your report; the orchestrator decides.
7. **Orchestrator limits.** At most one parallel round plus one targeted adversarial round per review. Re-run only the checks affected by a material change. No loops.
8. **Privacy.** Never print secrets, tokens, environment variables, or personal data in reports.
9. **Approval boundary.** Every consolidated report ends by listing what needs the user's approval (Tier A only), and states which files changed (or that nothing changed).
