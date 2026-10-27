# Hệ thống agent cho Wander

Cách dùng bộ agent và skill của Claude Code cho Wander: **xem tiến độ**, **ra quyết định kiến trúc/sản phẩm cùng PO**, **làm và rà code** trên stack đã duyệt (ADR-002, ADR-004). Agent phân tích và khuyến nghị; **PO quyết**.

> Cấu trúc lại ngày 24/10/2026: một "bộ hợp đồng" chung (`wander-kit`) nạp sẵn cho mọi agent, hội đồng agent có ngân sách cứng (`/wander-council`), skill chạy test thật (`/wander-verify`) và xem trạng thái (`/wander-status`), quy tắc code chỉ nạp khi mở file code.

## 1. Tổng quan

```
PO ──► Phiên Claude Code chính (điều phối + trọng tài duy nhất)
         │  skill: /wander-status · /wander-council · /wander-feature · /wander-verify · /wander-review …
         ├──► wander-software-architect   thiết kế, system design, phương án AD-x, giải thích để học
         ├──► wander-security-reviewer    danh tính, khôi phục, phiên, giới hạn tần suất, quyền (thiết kế + code)
         ├──► wander-product-analyst      phạm vi, tiêu chí nghiệm thu, phụ thuộc 1a/1b
         ├──► wander-skeptic-qa           phản biện, ca biên, thiếu test
         └──► wander-code-reviewer        rà thay đổi Java/TS, dùng code-review-graph
```

- Agent **chỉ đọc** (`tools: Read, Grep, Glob`; code-reviewer thêm các công cụ đọc đồ thị code). Không có Bash/Edit/Write/Agent ⇒ **không tự sửa file, không gọi agent khác**. Đây là rào chắn thật (allowlist công cụ).
- Agent không "nói chuyện" trực tiếp với nhau: phản biện đi qua phiên chính, phiên chính quyết định khi nào dừng.
- Mỗi agent nạp sẵn skill `wander-kit` (tóm tắt dự án, nhãn trạng thái, Tầng A/B/C, quy tắc bằng chứng, mẫu báo cáo). Thân file agent chỉ còn phần riêng của vai trò ⇒ ngắn, không trùng lặp.

## 2. Bắt đầu một phiên làm việc

| Muốn | Gõ |
|---|---|
| Biết đang ở đâu, nên làm gì tiếp | `/wander-status` |
| Chốt một quyết định kỹ thuật/sản phẩm (AD-x, Q-x, câu hỏi thiết kế) | `/wander-council AD-1` · `/wander-council Q17 xóa cả chuyến` |
| Chỉ muốn đọc phân tích, chưa chốt | `/wander-council AD-2 report` hoặc `/wander-review <mục tiêu>` |
| Làm một story / sửa lỗi | `/wander-feature A-15 giờ ước chừng` |
| Chạy test thật | `/wander-verify` (backend) · `/wander-verify e2e` · `/wander-verify verify` (tất cả) |
| Kiểm một câu/đề xuất với kế hoạch | `/wander-decision-audit <câu>` |
| Review spec trước khi code | `/wander-spec-review <file>` |
| Review planning không cần người trông, tiếp tục được | `/wander-autopilot <mục tiêu>` (xem `docs/autopilot/README.md`) |
| Hỏi một góc nhìn duy nhất (rẻ nhất) | `@agent-wander-software-architect so sánh cookie HttpOnly và bearer cho AD-1, đừng chọn hộ` |

`/wander-status` có thể được Claude tự gọi khi bạn hỏi "tiến độ thế nào"; các skill còn lại chỉ chạy khi bạn gõ (tắt tự kích hoạt để không tốn ngữ cảnh và không tự chạy việc tốn kém).

## 3. `/wander-council` — agent tự làm, tự phản biện, chỉ đưa PO điều quan trọng

1. **Khung câu hỏi**: phân tầng. Tầng B → tự chọn mặc định, ghi `decisions.md` §2, dừng. Tầng C → trả lời luôn. Chỉ Tầng A mới họp.
2. **Bảng dữ kiện** (≤ 25 dòng): phiên chính đọc một lần (kế hoạch, ADR, gate, code, web nếu cần giá/phiên bản) rồi đưa cùng một bảng cho mọi agent ⇒ agent không đọc lại cùng tài liệu.
3. **Vòng 1 – độc lập, song song**: 2–3 agent theo bảng định tuyến (`.claude/skills/wander-review/reference.md`); luôn có `wander-skeptic-qa` khi PO phải chọn giữa các phương án. Không agent nào thấy kết luận của agent khác.
4. **Bảng hội tụ**: Đồng thuận (Tầng B → áp dụng luôn; Tầng A → thành khuyến nghị) · Bất đồng vật chất → vòng 2 · Bất đồng không vật chất → phiên chính tự quyết, ghi lại · Câu hỏi mới ngoài phạm vi → **gác lại** trong `open-decisions.md` · Thiếu bằng chứng → `UNVERIFIED`.
5. **Vòng 2 – phản biện có mục tiêu**: chỉ agent liên quan, trích nguyên văn ý kiến đối lập, trả lời `Chấp nhận` / `Giữ nguyên` / `Thu hẹp` ≤ 200 chữ. Còn bất đồng ⇒ giữ nguyên cho PO thấy, **không có vòng 3**.
6. **Một trang cho PO**: đã thống nhất · cần anh chốt (phương án, đánh đổi, đảo ngược được không, *học được gì / giống gì ở FPT*, khuyến nghị) · đã gác lại · chi phí (số agent/vòng/lượt).
7. **Hỏi** bằng `AskUserQuestion` (≤ 4 câu) → **ghi** ADR (`docs/architecture/adr/`) hoặc bản ghi quyết định sản phẩm (`docs/decisions/`), cập nhật `open-decisions.md`.

**Ngân sách cứng** (chống lặp vô hạn): ≤ 2 vòng · ≤ 6 lượt gọi agent · ≤ 4 agent ở vòng 1 · ≤ 3 điểm vào vòng 2 · 1 lần thử lại cho agent không trả gì · ≤ 4 câu hỏi cho PO. Hết ngân sách ⇒ tóm tắt với những gì có.

## 4. `/wander-feature` và `/wander-verify`

- `/wander-feature`: truy nguồn → hỏi Tầng A (hoặc chuyển sang council) → phác thiết kế ≤ 15 dòng → code theo thứ tự domain → migration → hạ tầng → command/query → API → test → `/wander-verify` → `wander-code-reviewer` → ghi `decisions.md` → báo cáo kèm **"Học được gì"**. Ngân sách: ≤ 1 lần hỏi architect, ≤ 2 lượt review, ≤ 3 vòng sửa-test.
- `/wander-verify`: chạy `tools/dev.ps1` thật (nền, không chờ vòng), đọc kết quả từ `.logs/*.status`, dòng `RESULT:` và JUnit XML qua `node tools/wander-status.mjs --tests`. Phân loại lỗi môi trường (Docker tắt, JDK, cổng) và lỗi code. Không bao giờ báo kết quả chưa đọc.
- Phiên cloud nối với máy Windows: shell của cầu nối không chạy được lệnh Windows ⇒ chạy task VS Code "Wander: …" rồi đọc log.

## 5. File nằm ở đâu

| Mục đích | Đường dẫn | Nạp khi nào |
|---|---|---|
| Ngữ cảnh dự án | `CLAUDE.md` (< 100 dòng) | Mọi phiên |
| Ranh giới an toàn, ngân sách | `.claude/rules/planning-safety.md` | Luôn |
| Hỏi gì / tự quyết gì (Tầng A/B/C) | `.claude/rules/decision-materiality.md` | Luôn |
| Quy ước backend (tầng, công thức thay đổi, bẫy JPA, chạy test) | `.claude/rules/backend.md` | Khi mở file `backend/**` |
| Quy ước giao diện + e2e | `.claude/rules/frontend.md` | Khi mở `web/**`, `e2e/**` |
| Bản đồ mục của kế hoạch + sổ trạng thái + băm sha256 | `.claude/rules/wander-product-context.md` | Khi mở kế hoạch / autopilot; agent đọc theo yêu cầu |
| Mẫu báo cáo đầy đủ | `.claude/rules/review-output.md` | Khi mở `docs/autopilot/**`, `docs/reviews/**` |
| Hợp đồng chung của agent | `.claude/skills/wander-kit/SKILL.md` | Nạp sẵn vào mỗi agent (không phải lệnh) |
| Bảng định tuyến + mẫu brief | `.claude/skills/wander-review/reference.md` | Khi chạy review/council/autopilot |
| Ảnh chụp trạng thái | `tools/wander-status.mjs` | `/wander-status`, `/wander-verify` |
| Quyền, hook | `.claude/settings.json` | Mọi phiên |
| Kế hoạch (nguồn sự thật, **không sửa**) | `docs/wander-master-plan.md` | Chỉ đọc đúng mục cần |

Skill do code-review-graph cài (`debug-issue`, `explore-codebase`, `refactor-safely`, `review-changes`) giữ nguyên; lệnh `code-review-graph install` có thể ghi lại chúng.

## 6. Thêm hoặc sửa agent

1. `.claude/agents/<ten>.md`: `name` khớp tên file; `description` nói rõ khi nào dùng (Claude dựa vào đây để chọn agent).
2. `tools: Read, Grep, Glob` (bốn agent planning **phải giữ đúng chuỗi này** — preflight của autopilot kiểm tra). Không thêm Bash/Edit/Write/Agent nếu bạn chưa đồng ý.
3. `skills: [wander-kit]` để nhận hợp đồng chung; thân file chỉ ghi phần riêng: đọc gì, phương pháp, không được làm gì.
4. Không đặt `permissionMode`, `hooks`, `memory` (memory tự cấp quyền ghi).
5. Thêm dòng vào bảng định tuyến `reference.md` (3 cột, tên agent bỏ tiền tố `wander-`).
6. Chạy `node --test .claude/scripts/autopilot.test.mjs` và `node .claude/scripts/autopilot.mjs dry-run --target "<mục tiêu>"` để chắc preflight còn PASS.

## 7. Token và chi phí

- Agent song song với ngữ cảnh tách biệt cho góc nhìn **độc lập** nhưng tốn **nhiều token tổng** hơn một lượt đọc. Vì vậy: Tầng B/C không bao giờ họp; bảng dữ kiện dùng chung; chọn ít agent nhất; câu hỏi nhỏ dùng một agent hoặc `/wander-decision-audit`.
- `effort`: architect/security/code-reviewer `high`, analyst/QA `medium`; `model: inherit`. `maxTurns` 16–24.
- RTK nén đầu ra lệnh shell; code-review-graph thay việc đọc cả thư mục bằng truy vấn đồ thị.

## 8. Giới hạn đã biết

- Quy tắc trong `CLAUDE.md`, rule và skill là **chỉ dẫn** cho model. Rào chắn cứng chỉ gồm `tools` của agent, `permissions.deny` (`.env`) và hook autopilot (đang tắt bằng `"matcher": "NONE"`; matcher để bật lại: `Write|Edit|MultiEdit|NotebookEdit|Bash|PowerShell|Agent|Task`). Việc "không sửa kế hoạch" ngoài autopilot hiện **chỉ dựa vào chỉ dẫn** — nên thêm `"Edit(/docs/wander-master-plan.md)"` và `"Write(/docs/wander-master-plan.md)"` vào `permissions.deny` nếu muốn chặn cứng (thay đổi quyền nên để PO tự làm).
- `code-review-graph install` ghi đè `.claude/settings.json` (nó không đọc được JSON có chú thích `//`). `tools/dev.ps1 install-tools` đã bỏ qua bước này nếu `.mcp.json` có sẵn cấu hình; nếu lỡ chạy, gộp lại quyền + hook autopilot + hook của code-review-graph. Không thêm chú thích `//` vào file này.
- Bản đồ trạng thái trong `wander-product-context.md` đã xác minh với kế hoạch v0.4; băm sha256 thay đổi ⇒ phải xác minh lại. Kiểm tra: `Get-FileHash docs\wander-master-plan.md -Algorithm SHA256`.
- Không tự động: sửa kế hoạch, duyệt quyết định, triển khai cloud, tạo bí mật, commit (chỉ khi PO bảo).

## 9. Lịch sử

- 23/10/2026: agent tự chọn stack TypeScript/SQLite (ADR-001) mà không hỏi, lại hỏi PO những chi tiết vụn ⇒ thêm quy tắc Tầng A/B/C.
- 24/10/2026: PO chọn stack Java (ADR-002) và Java 21 + Boot 4.1 (ADR-004); thêm `wander-code-reviewer`, `/wander-feature`, RTK, code-review-graph. Sau đó cấu trúc lại: `wander-kit`, `/wander-council` (thay `/wander-architecture-decision`), `/wander-verify`, `/wander-status`, rule backend/frontend theo đường dẫn, rút gọn agent và rule luôn nạp.

## Công cụ ngoài đã đánh giá (25/10/2026)

Nguồn: ba nhóm agent đánh giá độc lập (đọc mã thật, giấy phép, hook, cách cài). Số "tiết kiệm" của nhà phát hành không được dùng làm bằng chứng.

| Công cụ | Quyết định | Lý do và cách dùng |
|---|---|---|
| RTK | Giữ, đã cài | Hook Bash toàn cục. `rtk gain` đo được 113 lệnh, 51,9% (22,7K token) ở lần đo hôm nay; tổng tiết kiệm nhỏ. Telemetry tắt |
| Headroom | Bỏ qua | Proxy nền thấy toàn bộ prompt, lưu nội dung gốc plaintext, beacon bật mặc định, chồng chéo với RTK |
| Context7 | Cài (phạm vi project, `.mcp.json`) | Tra tài liệu đúng phiên bản cho Spring Boot 4 / Jackson 3. Gửi tên thư viện + câu hỏi tới Upstash, không gửi mã. Cần duyệt MCP project ở phiên sau; chưa dùng API key |
| Repomix | Không cài; `npx repomix@1.18.1` khi cần | Đo thật: backend + web + docs/ux nén = 83.121 token. Chỉ để tổng quan một lần; làm việc tương tác dùng code-review-graph |
| Superpowers | Chép riêng `systematic-debugging` | Không cài plugin (hook SessionStart ép gọi skill, kỹ năng tự commit/worktree trái luật dự án) |
| Addy Osmani agent-skills | Chép `planning-and-task-breakdown`, `spec-driven-development`, `test-driven-development` | Đường ghi file đổi về `docs/implementation/`; ví dụ TDD là JS, đã ghi chú dùng JUnit |
| Anthropic Skills, plugin chính thức | Cài khi cần | Phần lớn trùng thứ đã có |
| Everything Claude Code | Bỏ qua | 130 KB mô tả, 27 hook, ghi vào `~/.claude` |
| revfactory/harness, wshobson/agents | Bỏ qua | Sinh agent có quyền ghi, trái `planning-safety.md`; khung hiện có đủ dùng |
| UI/UX Pro Max | Giữ (project), `disable-model-invocation`, đã sửa `${CLAUDE_SKILL_DIR}` | Cần Python 3 để chạy `search.py`; máy chưa có. Dùng để rà màn đã làm, không để định hướng lại thiết kế |
| Taste-Skill | Đưa sang `~/.claude/skills` (user), `disable-model-invocation` | Luật chống gradient/bóng/kính trái hướng thiết kế PO chọn (app du lịch rực rỡ). Chỉ mượn vòng "chụp màn hình, xem, sửa" |

Kỹ năng chép về đều đặt `disable-model-invocation: true` (chỉ chạy khi gõ lệnh hoặc khi `wander-feature` gọi), để mô tả không chiếm ngữ cảnh mỗi phiên.
