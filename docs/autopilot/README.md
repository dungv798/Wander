# /wander-autopilot — chạy một mục tiêu planning từ đầu đến cuối

Một lệnh, một mục tiêu hẹp. Orchestrator tự lập danh sách giai đoạn, gọi song song các agent chuyên môn sẵn có, đối chiếu kết quả, tổng hợp, kiểm tra, rồi ghi báo cáo. Nó **không** sửa kế hoạch tổng thể, **không** viết code, **không** biến đề xuất thành quyết định. Chỉ bạn mới duyệt.

## Khởi động
Trong thư mục `D:\Wander`:

| Mục đích | Lệnh |
|---|---|
| Xem trước, không ghi file | `/wander-autopilot dry-run Q16 thiết kế xác thực và khôi phục quyền chủ chuyến` |
| Chạy thật | `/wander-autopilot Q16 thiết kế xác thực và khôi phục quyền chủ chuyến` |
| Tiếp tục sau khi bị ngắt | `/wander-autopilot resume` (hoặc `resume <run-id>`) |

Chế độ quyền khuyến nghị: mở `claude` trong thư mục dự án, chấp nhận hộp thoại tin cậy một lần (để các quy tắc `permissions.allow` của dự án có hiệu lực), rồi gõ lệnh ở trên.

Chạy không cần ngồi canh bằng `claude -p` (đã chạy thử trong sandbox Linux với Claude Code 2.1.309; chưa chạy trên Windows của bạn). Thư mục chưa được tin cậy thì `-p` bỏ qua `permissions.allow` của dự án, nên phải cấp ba quyền hẹp ngay trên dòng lệnh, và chế độ `dontAsk` từ chối mọi thứ ngoài danh sách:
`claude -p "/wander-autopilot Q16 …" --permission-mode dontAsk --allowedTools "Write(/docs/autopilot/**)" "Edit(/docs/autopilot/**)" "Bash(node .claude/scripts/autopilot.mjs *)" --max-turns 150 --max-budget-usd 6 --output-format json`
Thiếu ba quyền này thì run dừng an toàn ở lần lưu file đầu tiên và đóng là `blocked`. Không dùng `--dangerously-skip-permissions`.

## Các file
| File | Vai trò |
|---|---|
| `.claude/skills/wander-autopilot/SKILL.md`, `reference.md` | Quy trình và mẫu (dùng lại agent và bảng định tuyến của `/wander-review`) |
| `.claude/scripts/autopilot.mjs` | Máy trạng thái: checkpoint, resume, giới hạn vòng lặp, kiểm tra, đóng run |
| `.claude/scripts/autopilot-lib.mjs` | Hàm dùng chung (băm, đọc kế hoạch, chính sách guard) |
| `.claude/hooks/autopilot-guard.mjs` | Hook PreToolUse chặn cứng (xem dưới) |
| `.claude/scripts/autopilot.test.mjs` | Kiểm thử: `node --test .claude/scripts/autopilot.test.mjs` |
| `docs/autopilot/authorizations.json` | Danh sách ủy quyền thường trực của bạn. **Đang rỗng**: chưa ủy quyền loại quyết định nào |
| `docs/autopilot/runs/<run-id>/` | Một lần chạy: `checkpoint.json`, `report.md`, `stages/`, `agents/`, `deliverables/`, `validation.json`, `dispatch.log` |

## Cái gì được chặn bằng mã (không chỉ bằng lời nhắc)
- **Luôn bật:** không công cụ nào (Write/Edit/MultiEdit/NotebookEdit, và lệnh shell có toán tử ghi) được đụng `docs/wander-master-plan.md`. Cộng thêm `permissions.deny` có sẵn.
- **Trong một run (có `docs/autopilot/ACTIVE.json` còn hạn):** chỉ ghi được dưới `docs/autopilot/`; shell chỉ chạy `node .claude/scripts/autopilot.mjs …`; chỉ gọi 4 agent `wander-*`, chỉ trong vòng đã mở, mỗi agent một lần mỗi vòng (thử lại một lần nếu chưa có báo cáo); tối đa 8 lần gọi; file trạng thái do script quản lý.
- **Máy trạng thái:** tối đa 2 vòng review (1 song song + 1 phản biện có mục tiêu), tối đa 2 lần bắt đầu mỗi giai đoạn, tối đa 5 lần resume, dừng sau 3 lần guard từ chối, lease hết hạn sau 8 giờ.
- Hook chạy ở dạng `onFailure: block` (cần Claude Code ≥ 2.1.295): nếu hook lỗi hoặc thiếu `node`, lệnh bị chặn thay vì lọt qua.

## Resume: kiểm tra gì trước khi tiếp tục
Mỗi giai đoạn xong ghi sha256 của đầu vào và đầu ra. `resume` băm lại: đầu vào đổi, đầu ra bị sửa/mất, hoặc giai đoạn trước đó stale → làm lại đúng giai đoạn đó; còn lại dùng lại. **Kế hoạch đổi hash = dừng cứng** (`STOP_PLAN_CHANGED`), phải tạo run mới sau khi bạn xác minh lại. File đổi ngoài `docs/autopilot/` được báo là "drift" và làm `write_scope` thất bại khi kiểm tra.

## Giới hạn (nói thẳng)
- **Không có gì đảm bảo chạy xuyên mọi lời nhắc quyền, giới hạn ngữ cảnh, lỗi mạng hay gián đoạn dịch vụ.** Nếu phiên bị ngắt, checkpoint còn lại và bạn gõ `resume`; nó không tự khởi động lại.
- Chế độ `auto` cần gói/mô hình hỗ trợ, có thể bị quản trị viên tắt, và theo tài liệu "giảm lời nhắc nhưng không đảm bảo an toàn". Ở chế độ `-p`, lệnh bị chặn bị từ chối rồi Claude tiếp tục, không dừng cả run.
- Hook phụ thuộc `node` có trong PATH trên Windows (chưa kiểm trên máy bạn). Rào chắn Bash đối với kế hoạch là heuristic (lệnh đọc dùng Read/Grep/Glob); Write/Edit thì chặn chắc.
- `--max-budget-usd`/`--max-turns` chỉ có ở chế độ `-p` và là ước tính phía client.
- Thư mục chưa phải kho Git: phần "diff" dùng bảng băm toàn bộ file lúc `init`. Có `.git` thì `git status` cũng được ghi vào báo cáo.
- Lần chạy `emulated` (khi không chạy được Claude Code thật) đánh dấu agent là **UNVERIFIED**: validate cố ý báo `WARN`.
- Ủy quyền tự áp dụng vào kế hoạch **chưa được nối**: chưa có loại quyết định nào được bạn ủy quyền, và kế hoạch được bảo vệ ghi. Autopilot ghi khuyến nghị và tiếp tục phần việc độc lập.
