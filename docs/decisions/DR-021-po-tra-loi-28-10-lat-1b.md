# DR-021 — PO trả lời 28/10/2026: nền tảng Lát 1b

> Nguồn: `AskUserQuestion` ngày 28/10/2026 (lời PO). Đây là quyết định **sản phẩm/kiến trúc** của 1b; kế hoạch gốc `docs/wander-master-plan.md` KHÔNG sửa (quy tắc 1): chỗ nào lệch kế hoạch gốc thì ghi rõ ở đây và ở đặc tả mô-đun.

| Mã | Câu hỏi | Quyết định của PO | Ghi chú / lệch kế hoạch gốc |
|---|---|---|---|
| H1 | Danh tính của thành viên | **Danh tính ẩn danh đầy đủ như chủ** (token, mã khôi phục, nhiều thiết bị) | Tái dùng toàn bộ mô-đun `identity`; một người có thể ở nhiều chuyến |
| H2 | Thành viên thêm mục thế nào | **Thêm trực tiếp; chỉ ĐỀ NGHỊ XÓA mới chờ Organizer duyệt** (khớp prototype F09–F11) | **Lệch R10** của kế hoạch gốc (R10: thành viên đề xuất, Organizer chấp nhận). Theo quy tắc 1, kế hoạch gốc giữ nguyên; DR này ghi đè cho 1b. Hệ quả: khái niệm "Proposal" của kế hoạch gốc chỉ còn dạng **đề nghị xóa**; mô-đun `proposals` giữ mã cũ nhưng phạm vi hẹp lại |
| H3 | Quyền xóa/khôi phục của thành viên (D19 giao cho 1b) | Thành viên **xóa mềm/khôi phục mục do chính mình thêm**; xóa mục của người khác = **đề nghị** chờ Organizer | Mọi thành viên xem "Đã xóa gần đây" (đề xuất từ bản đồ, không bị PO phản đối) |
| H4 | Mô hình Organizer | **Một Organizer duy nhất = chủ chuyến**, không chuyển quyền ở 1b; chỉ Organizer xóa chuyến | Chuyển quyền cần xác thực lại (D25) nên để lát sau |
| H5 | Giới hạn | (không hỏi, Tầng B) tối đa 10 thành viên/chuyến, 1 liên kết mời đang bật, tên hiển thị ≤ 40 ký tự | Ghi ở `docs/implementation/decisions.md` §2 |
| — | Bản đồ khả năng | **Duyệt** 6 mô-đun: `membership` → `access` → `completion` → `proposals` → `checklist` → `collab-ui` | Xem `docs/implementation/spec-lat-1b-capability-map.md` |

Tầng A còn lại cho PO ở các mô-đun sau: vòng đời chi tiết của "đề nghị xóa" (hết hạn? Organizer tự xóa có cần duyệt?), thông báo cho Organizer, thứ tự hiển thị checklist.
