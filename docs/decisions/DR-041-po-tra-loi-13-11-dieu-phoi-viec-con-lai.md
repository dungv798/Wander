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

## Lượt hai cùng ngày (PO chọn đúng phương án khuyến nghị cả bốn câu)
| Mã | Câu hỏi | Lựa chọn của PO | Hệ quả |
|---|---|---|---|
| ORD-6 | T10: khoảng hở TOCTOU của phiên đã thu hồi | **Chấp nhận (a) cho người quen** | Phương án (b) `SELECT … FOR SHARE` không làm. Đã ghi ở threat-model T10 và `open-decisions.md`; xem lại trước khi mở cho người lạ. |
| ORD-7 | AD-17, AD-19, ADR-011 "học tự nguyện" | **Chưa làm, đặt sau** | Giữ mở; không phát sinh việc. Làm khi PO nêu số giờ (STR-1 = C). |
| ORD-8 | `keep-warm.yml` | **Giữ, gỡ ngay nếu Render phản đối** | Chỉ chạy sau khi merge vào `main`. Rủi ro điều khoản (T9) vẫn được PO biết và chấp nhận. |
| ORD-9 | Hai key Google Maps của bên thứ ba trong lịch sử (commit `480978dc76`) | **Bỏ khỏi lịch sử trước khi public** | Gộp vào lần force-push lịch sử viết lại (`history-rewrite.md` bước 4). Claude chỉ chuẩn bị bản sạch; PO tự force-push. |

## Còn chờ PO
Không còn câu Tầng A nào mở từ lượt này. Việc chỉ PO làm được: xem bảng "Lộ trình còn lại" (Chặng 1 đến 3).
