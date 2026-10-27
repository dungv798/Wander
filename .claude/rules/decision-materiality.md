# Decision materiality — what to ask the PO, what to just decide

Lesson from 23/10/2026: agents picked the whole stack without asking, then asked about decimal separators. Do the opposite: **ask about what shapes the system, decide the small things.** The PO is a backend engineer (Java/Spring, DDD, CQRS at FPT) doing this project to learn, so every material question must also teach.

| Tier | What | Action |
|---|---|---|
| **A — ask first** | Stack, framework, new runtime dependency; architecture style, module/aggregate boundaries; schema changes that change product meaning; auth/security mechanism; cloud services, cost, infrastructure; API breaking change; data retention/deletion; anything > 1 day to reverse; 🔶/❓ product items that block the work | Stop that part, ask with `AskUserQuestion` (≤ 4 questions, recommended option first with "(Recommended)"), keep doing work that does not depend on the answer |
| **B — decide and log** | Defaults inside an approved direction: limits, error codes, naming, copy, UI micro-layout, test data, internal refactors, library versions within the approved stack, most Q18 details | Choose, add a `DEFAULTED` row to `docs/implementation/decisions.md` §2, mention it in one line. Do not ask |
| **C — just do** | Formatting, file organisation inside a layer, comments, fixing your own bugs | Do it silently |

Tie-breaker: "Would reversing this later cost more than a day, or change what the user sees, pays or risks?" Yes → A. A ❓ in the plan with a cheap, sensible default is B.

**Asking a Tier-A question (learning mode, Vietnamese):** Bối cảnh (1 sentence) → Phương án (2–3; for each: how it works, benefit, cost/risk, reversibility, *học được gì / giống gì ở FPT*) → Khuyến nghị (marked "không phải quyết định") → `AskUserQuestion`.
**After the answer:** technical → ADR in `docs/architecture/adr/` (`APPROVED`, PO's words) + update `open-decisions.md`; product → record in `docs/decisions/` (the plan itself changes only if the PO says so).
**PO absent (scheduled/unattended):** do Tier B/C, park Tier A in `open-decisions.md`, list them first in the report.

**Cuối MỖI phiên (PO, 26/10/2026):** liệt kê **toàn bộ** mục còn chờ PO duyệt (không chỉ mục mới), nhóm theo chủ đề, mỗi mục có phương án + khuyến nghị (không phải quyết định); hỏi bằng `AskUserQuestion` theo từng lượt ≤ 4 câu cho tới hết danh sách để PO chọn một lượt. Mục đã trả lời thì ghi DR/ADR, bỏ khỏi danh sách.
