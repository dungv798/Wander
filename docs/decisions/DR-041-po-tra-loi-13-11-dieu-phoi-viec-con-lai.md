# DR-041 — PO trả lời 13/11/2026: điều phối việc còn lại

**Trạng thái:** APPROVED (PO trả lời trực tiếp bằng `AskUserQuestion`, 13/11/2026). Master plan không đổi.
**Nguồn:** bảng "Lộ trình còn lại" tạo sau `/wander-status` cùng ngày (tổng hợp từ `todo.md`, DR-037…040, `threat-model-1a.md`, `upgrade-report.md`, `po-render-checklist-2026-11-12.md`).

## Quyết định
| Mã | Câu hỏi | Lựa chọn của PO | Hệ quả |
|---|---|---|---|
| ORD-1 | Tập trung việc nào trước | **"Làm hết"** | Claude làm mọi việc không cần thao tác của PO theo thứ tự: commit `.mcp.json`, dọn todo/script, verify (cần Docker), chuẩn bị lại bản lịch sử viết lại, soạn hướng dẫn tạo tài nguyên. Không push, không force-push, không tạo tài nguyên đám mây. |
| ORD-2 | `.mcp.json` | **Commit vào nhánh** | Tệp có đường dẫn riêng của máy PO (`D:\Wander\tools\codex-mcp\server.mjs`, đường dẫn `codex.js` dưới thư mục người dùng). PO đã biết điều đó khi chọn; lưu ý khi repo public. |
| ORD-3 | AWS (DR-040) | **Làm trên Render**, kèm một trang HTML hướng dẫn từng bước (ý nghĩa của mỗi bước) để PO tự tạo tài nguyên rồi nối chúng | AWS vẫn treo; không cần trần tiền hay tài khoản AWS lúc này. Hướng dẫn: trang artifact "Wander Dựng Hạ Tầng" (Neon, Render, R2). |
| ORD-4 | Sáu mục tính năng cũ trong `todo.md` | **Bỏ các mục tính năng, giữ 2 mục dọn dẹp** | Bỏ: nội dung điểm đến dưới 10 nơi, duyệt nội dung 11 điểm đến, màn chọn điểm đến + bản đồ Việt Nam, giao diện Roameo. Giữ: gỡ `TerrainMap*`/`build-map.mjs`/`web/public/map/ha-giang` và xóa `web/spike/`. |
| ORD-5 | 11 script review dùng một lần ở `tools/` | Gộp vào "làm hết" (xóa được vì còn trong lịch sử git) | Đã `git rm` 11 tệp: `build-b-parity-review`, `capture-b-reference`, `debug-b-trip-choice`, 8 tệp `review-*`. Giữ `dev.ps1`, `e2e.sh`, `quality.ps1`, `wander-status.mjs`, `profile-wander-performance.mjs`. Khôi phục: `git show <commit-truoc>:tools/<tệp>`. |

## Chưa hỏi / còn chờ PO (Tầng A)
- T10: chấp nhận khoảng hở TOCTOU phiên đã thu hồi cho người quen (DR-040 đã diễn giải thận trọng là chấp nhận (a)).
- Mục học tự nguyện AD-17, AD-19, ADR-011: có đặt trần giờ không.
- Giữ hay bỏ `keep-warm.yml` (rủi ro điều khoản Render, T9).
- Thời điểm bỏ file research chứa 2 key Google Maps của bên thứ ba khỏi lịch sử (trước khi public là khuyến nghị).
