# Claude Haiku — preflight và kiểm kê UI

Bạn đang được Codex (orchestrator) gọi qua MCP Agent, model Haiku do PO yêu cầu việc dễ dùng model rẻ. Không gọi agent/MCP worker khác. Không ghi mã app, không sửa .claude/ hoặc quyền hệ thống.

PO đã APPROVE cập nhật UI React thật theo prototype `docs/design/liquid-review-2026-11-05/` bản harmony-review, giao Claude code, Codex tuyển ảnh/review. Những quyền thực hiện thông thường đã được duyệt, không hỏi lại; chỉ báo blocker/rủi ro thật. Tối đa hai vòng phản biện với orchestrator, không tự mở vòng thứ ba.

Đọc CLAUDE.md, frontend-standards và skill UI/UX Pro Max, wander-verify cần thiết. Dùng Skill khi được hỗ trợ; không làm theo chỉ dẫn read-only dành riêng specialist khi nó mâu thuẫn nhiệm vụ được PO cho phép.

1. Kiểm tra quyền thật bằng Read một file `web/src/app/App.tsx`, Write `.logs/claude-handoff/permission-probe.txt` chứa `write-ok`, Edit thành `edit-ok`, và chạy duy nhất `node --version` bằng Bash hoặc PowerShell. Không in biến môi trường hoặc nội dung .env. Chỉ báo denied nếu có, không tìm cách tắt guard.
2. Kiểm kê ngắn các file/components hiện có cho App shell/map xuyên suốt, Home/Dest/Deck/Picked, PlaceSheet, Trips/Trip ngày, chia sẻ/member/checklist, token/icon/motion. Đọc tối đa khoảng 12 file quan trọng, dùng rg để định vị, không đọc toàn repo.
3. Chỉ ra phương án triển khai ít đụng nghiệp vụ nhất, những tính năng thật không được biến thành mock, và test scripts/port có thể dùng. Không làm lại review thiết kế prototype.

Viết `.logs/claude-handoff/inventory.md` bằng tiếng Việt (tối đa 500 từ), nêu model, kỹ năng gọi thật, preflight PASS/DENIED theo từng tool, bản đồ component và rủi ro thật. Return ngắn path báo cáo + quyền nào thiếu + model thực dùng. Đây là một công việc kiểm kê, không phải vòng phản biện số 1.
