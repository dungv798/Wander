# wander-autopilot reference

Reuse, do not copy: routing table, round-1 / round-2 brief templates, disagreement list and the consolidated template live in `.claude/skills/wander-review/reference.md`. Status tokens and the specialist report schema live in `.claude/rules/review-output.md`.

## Stages and dependencies
```
preflight → scope → route → review-r1 → reconcile → [review-r2 optional] → consolidate → [apply optional] → report → validate → close
```
Independent work continues when one branch is blocked. A blocked stage blocks only its dependents. `next` reports `runnable`, `blocked`, `waiting`, `stop`.

## Stop conditions (explicit; the first four are enforced by code)
| Code | Trigger | Enforced by | Action |
|---|---|---|---|
| `STOP_ROUND_LIMIT` | round 3 requested | CLI `round open` | consolidate with what exists |
| `STOP_RETRY_LIMIT` | stage started twice without success | CLI `stage start` | stage becomes `blocked`; report |
| `DISPATCH_LIMIT` / `DISPATCH_RETRY_LIMIT` | > 8 dispatches, or agent dispatched twice with no saved report | PreToolUse hook | close round with `--missing` |
| `STOP_GUARD_DENIALS` | guard denied 3 calls in this run | hook log + CLI `next` | checkpoint, close blocked |
| `STOP_PLAN_CHANGED` | plan hash ≠ run baseline on resume | CLI `resume` (exit 4) | no writes; new run after user re-verifies |
| `STOP_RESUME_LIMIT` | > 5 resumes | CLI `resume` | ask the user |
| `STOP_LEASE_EXPIRED` | lease older than 8 h | CLI `next` | `resume` (re-verifies everything) |
| `STOP_TOTAL_STARTS` | > 25 stage starts | CLI | close blocked |
| `STOP_BLOCKER` | nothing runnable, required stage blocked | CLI `next` | close blocked with the blocker |
Not enforceable in-session (use CLI flags): token/cost budget → `--max-budget-usd`, `--max-turns` with `claude -p`.

## What resume verifies
Every finished stage records sha256 of its inputs and outputs. `resume` re-hashes them: a changed input, a modified or missing output, or a stale upstream stage marks the stage `stale` (re-done); everything else is reused. A changed plan is a hard stop. Files changed outside `docs/autopilot/` are reported as drift (and fail validation `write_scope`).

## Stage output files (all under `docs/autopilot/runs/<run-id>/`)
`stages/scope.md`, `stages/route.md`, `stages/reconcile.md`, `stages/consolidate.md` · `agents/<agent>-r<n>.md` (verbatim specialist report) · `deliverables/*.md` · `report.md` · script-written: `checkpoint.json`, `dispatch.log`, `denials.log`, `validation.json`.

## report.md template (Vietnamese)
````markdown
# Báo cáo autopilot — <run-id>
> Mục tiêu: <target> · Kế hoạch: v0.3, sha256 <12 ký tự đầu> · Executor: <claude-code|emulated> · Trạng thái: <complete|blocked>

## 1. Công việc đã hoàn thành
<bảng: giai đoạn · trạng thái · đầu ra>

## 2. Phát hiện chính
<đồng thuận · bất đồng được giữ nguyên · khoảng trống bằng chứng; mỗi ý có token và nguồn §/ID>

## 3. Quyết định chưa giải quyết
<bản ghi: ID · token · phương án và đánh đổi · thứ bị khóa · đảo ngược được không · khuyến nghị (không phải quyết định)>

```json autopilot-decisions
[
  {"id": "D15", "status": "APPROVED", "source": "§14.1"},
  {"id": "Q16", "status": "OPEN", "source": "§15.1"},
  {"id": "DRAFT-1", "status": "PROPOSED", "about": "Q16", "source": "stages/consolidate.md"}
]
```

## 4. Việc bị chặn và blocker chính xác
<hoặc "Không có">

## 5. File đã thay đổi
<!-- autopilot:files:start -->
<!-- autopilot:files:end -->

## 6. Kết quả kiểm tra
<!-- autopilot:validation:start -->
<!-- autopilot:validation:end -->

## 7. Giới hạn của lần chạy này
<executor có phải emulated không; chỗ nào UNVERIFIED; điều chưa kiểm>

## 8. Ranh giới
Không có quyết định nào được chuyển thành APPROVED. Kế hoạch tổng thể không bị sửa. Chỉ bạn mới có thể phê duyệt.
````
Decisions block rules (checked by `validate`): `status` ∈ the six tokens; only plan D-items may be `APPROVED` and each listed D-item must stay `APPROVED`; an OPEN Q-item may not be `PROPOSED` (put the recommendation in a `DRAFT-n` entry); new records use `DRAFT-n`; `CONTRADICTION` needs `quotes` (≥ 2) and every quote must appear verbatim in the plan or a saved report.

## Autopilot additions to the round-1 brief
Add one line to the template in the wander-review reference: `Write nothing; your whole answer is the report (the orchestrator saves it).` Do not add conclusions, other agents' findings, or the run's recommendation.

## Q16 guidance (the first real target)
Q16 is `OPEN` and blocks the Lát 1a spec (§15.6). Approved inputs: D15, D8, D19, R13, A-0. The eight design questions are in §15.1. The run must compare mechanisms only as analysis, label every option `PROPOSED`, keep Q16 `OPEN`, and produce at most one `DRAFT-n` recommendation plus the list of what the user must approve. It must not choose or implement an auth mechanism.
