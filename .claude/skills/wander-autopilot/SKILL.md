---
name: wander-autopilot
description: Run ONE focused Wander planning target end to end, unattended and resumable. Checklist of stages, parallel specialist reviews (max 2 rounds), reconcile, consolidate, validate, checkpointed report. Never edits the master plan, never promotes a proposal to a decision. Use `dry-run <target>` first or `resume`.
argument-hint: "<focused target, e.g. 'Q16 auth and recovery'> | dry-run <target> | resume [run-id]"
disable-model-invocation: true
allowed-tools: Read Grep Glob Agent Write(/docs/autopilot/**) Edit(/docs/autopilot/**) Bash(node .claude/scripts/autopilot.mjs *)
---

# wander-autopilot

Input: **$ARGUMENTS**

You are the orchestrator and arbiter. State, limits and checks live in deterministic scripts; you do the reading, judging and writing. Reuse the existing agents and `.claude/skills/wander-review/reference.md` (routing table, brief templates, report template). Do not copy them.

## Entry
- Empty input: say what is needed (a focused target) and stop. This is the only question you may ask before work starts.
- `dry-run <target>`: run `node .claude/scripts/autopilot.mjs dry-run --target "<target>"`, then describe the stage plan, routing and what would be read. Write nothing. Stop.
- `resume [run-id]`: go to **Resume**.
- Anything else is the target: go to **Start**. Never invent a broader target.

## Hard rules (the guard hook enforces the starred ones)
- Planning only. No product code, schemas, auth implementation, secrets. *
- `docs/wander-master-plan.md` is read-only. *  Changes the plan would need go in a patch proposal file under `docs/autopilot/`, never in the plan.
- During a run you may write only under `docs/autopilot/`; Bash is only `node .claude/scripts/autopilot.mjs …`. Read files ONLY with Read/Grep/Glob. Never use Bash for `cat`, `ls`, `head`, `sha256sum` or anything else: each such call is a guard denial, and three denials stop the run (`STOP_GUARD_DENIALS`). *
- One CLI command per Bash call: no `&&`, `;`, pipes or redirects (the guard denies them, and denials count toward the stop).
- Run `node .claude/scripts/autopilot.mjs cite-check <files>` on every file you wrote (reconcile, consolidate, deliverables, report) BEFORE `stage done`, and fix what it flags first. If a finished stage's saved output still needs a small correction, edit it and then run `node .claude/scripts/autopilot.mjs amend --file <path> --reason "<what changed and why>"` (logged; max 10). Never leave a finished output edited without `amend`: `validate` fails on the hash mismatch.
- Never hand-edit `checkpoint.json`, `ACTIVE.json`, `dispatch.log`, `denials.log`, `authorizations.json`. *
- Only the 4 `wander-*` agents may be dispatched, only inside an open round, once per round each; one retry is allowed only if the first dispatch produced no saved report. *
- Max 2 review rounds (1 parallel + 1 targeted); max 8 dispatches; max 2 starts per stage; max 5 resumes. *(CLI/hook)*
- Status tokens: only ✅ in the plan is `APPROVED`. Everything else keeps its token (`.claude/rules/review-output.md`). Agent agreement is not correctness. Never invent citations, line numbers, quotes or results.
- Reports in Vietnamese (IDs, symbols and tokens unchanged). Read only the plan sections the target needs (map: `.claude/rules/wander-product-context.md`).

## Decision policy
| Status | What you do |
|---|---|
| `APPROVED` (D-items) | Preserve verbatim. Never reinterpret, never downgrade. |
| `OPEN` (Q-items) | Analyse alternatives, recommend one as a separate `DRAFT-n` entry (`PROPOSED`, "khuyến nghị, không phải quyết định"). The Q item stays `OPEN`. |
| `PROPOSED` / `INFERENCE` | Keep as is; say what approval would change. |
| `CONTRADICTION` | Quote both statements verbatim in the decisions block; never resolve by overwriting. |
| `UNVERIFIED` | State the missing evidence. |
Auto-resolving into the canonical plan: `docs/autopilot/authorizations.json` lists authorized classes (currently none) and the plan is also write-protected. So: **record the recommendation, then continue all work that does not depend on that decision.** If a blocker stops further work, `stage block … --blocker "<precise blocker>"`, checkpoint, and report it once. Do not re-ask.

## Start
1. `node .claude/scripts/autopilot.mjs init --target "<target>"`. If it refuses with `LEASE_ACTIVE`, do **Resume** instead. If `PREFLIGHT_FAILED`, report the failing checks and stop.
2. Create tasks from the stage list (TaskCreate), one per stage.
3. Go to **Loop**.

## Resume
1. `node .claude/scripts/autopilot.mjs resume` (add `--run <id>` if given). It re-hashes plan, inputs and outputs of finished stages.
2. `hard_stop` (e.g. `STOP_PLAN_CHANGED`): write nothing, report the exact reason and that a new run (`init`) is needed after the user re-verifies. Stop.
3. Otherwise **reuse** every stage listed in `reuse` (do not redo them, do not re-dispatch agents whose report is saved) and redo only `redo` stages. If a round is still open with dispatches but no saved reports (the earlier session ended before saving), re-dispatch each such agent ONCE (the hook allows exactly one retry); an agent that already had two dispatches and no report is closed with `round close --missing <agent>:<reason>`. Report `drift_outside_autopilot` if non-empty. Go to **Loop**.

## Loop
Repeat: `node .claude/scripts/autopilot.mjs next`.
- `stop = READY_TO_CLOSE` → **Close**.
- `stop` is any other value (`STOP_BLOCKER`, `STOP_GUARD_DENIALS`, `STOP_LEASE_EXPIRED`, `STOP_TOTAL_STARTS`) → checkpoint, **Close** with `--outcome blocked`, report the exact stop code. Never loop past a stop.
- Otherwise run every stage in `runnable` (independent stages in the same message). For each: `stage start <id>` → do the recipe → `stage done <id> --inputs <paths> --outputs <paths>` (or `stage fail`/`stage block`). A refused call (`exit 3`) is a stop signal, not something to work around.

## Stage recipes (details and templates: `.claude/skills/wander-autopilot/reference.md`)
Run files go in `docs/autopilot/runs/<run-id>/` (`stages/`, `agents/`, `deliverables/`).
1. **preflight** — `stage start preflight`, then `preflight` (it marks the stage). FAIL → `stage block` with the failing checks.
2. **scope** — read the section map; Grep IDs from the target; Read only those plan sections. Write `stages/scope.md`: sections read, each ID with its status token, what is in/out of scope, which OPEN/PROPOSED items touch the target. Inputs: the plan and the section map.
3. **route** — `route-hint --target "<target>"`; confirm or adjust (smallest set that covers the target; never "all four" by default). Write `stages/route.md` with agents chosen and one line each why, and why others were not.
4. **review-r1** — `stage start review-r1`; `round open --n 1 --agents a,b,c`. In ONE message dispatch all chosen agents with the round-1 brief template (self-contained; no conclusions of yours), each with `run_in_background: false` so the reports come back in this same turn. Your very next action is to Write each returned report verbatim to `agents/<agent>-r1.md`, before reading, reasoning or anything else: a report not saved to disk is lost if the session ends, and the round then cannot be completed. `round close --n 1` (use `--missing agent:reason` only for an agent that truly returned nothing). `stage done review-r1 --outputs <saved reports>`.
5. **reconcile** — `cite-check` on the saved reports; remove or mark `UNVERIFIED` anything it flags. Build the disagreement/gap list (reference.md). Write `stages/reconcile.md`. Decide if any item is **material** (would change what the user must decide).
6. **review-r2** — none material → `stage skip review-r2 --reason "<why no material disagreement>"`. Otherwise `stage start review-r2`, `round open --n 2 --agents <only those involved> --reason "<the material disagreement>"`, targeted rebuttal briefs, save `agents/<agent>-r2.md`, `round close --n 2`, `stage done`. A third round does not exist.
7. **consolidate** — `stages/consolidate.md` using the consolidated template: agreement, preserved disagreements (not averaged), evidence gaps, options for OPEN items with trade-offs, severity-ordered scenario risks, decision records. Everything labelled with tokens.
8. **apply** — only reversible documentation inside `deliverables/` that the plan itself calls for as a proposal (e.g. a short design brief for Q16 per §15.1, marked "DRAFT – PROPOSED, chưa được duyệt") or a `plan-patch-proposal.md`. Nothing else is written. Nothing to produce → `stage skip apply --reason …`.
9. **report** — write `report.md` from the template (decisions block, file markers). `stage done report --outputs <run>/report.md`.
10. **validate** — `stage start validate`, `validate`. On FAIL fix the named cause (usually report.md) and retry once; a second FAIL → `stage block validate --blocker …` and close as blocked.

## Close
`node .claude/scripts/autopilot.mjs close --outcome complete` (or `blocked`). The script fills the files-changed and validation blocks of `report.md` itself and releases the lease. Then reply briefly: outcome, what was reviewed, decisions awaiting the user (one line each), report path, validation result, and say plainly if the executor was `emulated` or any check was `WARN`/`UNVERIFIED`. State that nothing in the master plan changed.

## Limits you must be honest about
Permissions: this skill's `allowed-tools` apply only while the skill's own turn runs. Interactive sessions in a trusted folder also get the project `permissions.allow`. For `claude -p` in a folder that has not been trusted, the project allow rules are ignored, so the caller must grant the three narrow rules on the command line (see `docs/autopilot/README.md`); without them the run stops safely at the first save, as `blocked`.
You cannot bypass permission prompts, context limits, network failures or service interruptions. If the session ends mid-run the checkpoint survives; the user starts `resume`. Never claim a run was unattended-safe beyond what the checkpoint and `validation.json` show.
