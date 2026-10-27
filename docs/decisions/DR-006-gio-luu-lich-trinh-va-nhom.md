# DR-006 — Giỏ → lịch trình (chưa có ngày) và quyền của nhóm

- **Trạng thái:** `APPROVED` — PO chọn ngày 24/10/2026: "Hỏi khoảng ngày lúc lưu; nơi đã chọn vào 'Chưa xếp'" và "Tự vào lịch trình, chỉ 'xóa' mới cần chủ duyệt" (cả hai là khuyến nghị của hội đồng).
- **Liên quan:** DR-005, `docs/ux/product-spec-v1.md` (O-2, O-3, O-4), R5/R6 (plan §7.4), D16, D19, Q6, Q9.

## Quyết định
1. **Lưu giỏ vào lịch trình:** khi lưu, **hỏi khoảng ngày** (giữ R5: lịch trình luôn có ngày đi/về). Các địa điểm đã chọn vào một vùng **"Chưa xếp ngày"** trong lịch trình; người dùng đưa từng nơi vào ngày bằng thao tác tay (kéo hoặc chọn ngày).
2. **Thành viên nhóm "chọn thêm" địa điểm:** địa điểm **tự vào** lịch trình ngay. Chỉ **yêu cầu xóa** mới cần **chủ lịch trình duyệt/từ chối**. Chủ vẫn xóa trực tiếp được.

## Hệ quả (chưa làm, cần khi thực hiện)
- **Đổi lược đồ (Tầng A, PO đã đồng ý hướng):** mục (`items`) được phép **không thuộc ngày nào** (ngày cho phép rỗng). Cần migration mới (không sửa V1–V3), domain `Item`/`Trip` (vị trí "chưa xếp" riêng, quy tắc R6 "mỗi hoạt động thuộc ngày được chọn" mở rộng cho trạng thái chưa xếp), query/API, UI, test; tổng chi phí vẫn tính cả mục chưa xếp (cần quy tắc hiển thị rõ). Làm qua `/wander-feature`, một story riêng.
- **Quy tắc đặt tên:** tên mặc định là tên điểm đến; trùng thì hậu tố " - 2", " - 3"… (số nhỏ nhất chưa dùng).
- **Quyền thành viên (Lát 1b):** thêm = hành động của thành viên; xóa = yêu cầu, chủ duyệt. Khớp cơ chế đề xuất/duyệt của plan nhưng **đảo nghĩa** so với plan §B (plan: thành viên đề xuất, chủ duyệt mọi thứ); ghi nhận để Q6/Q9 dùng.
- Khóa lạc quan theo chuyến (ADR-003) giữ nguyên: hai thiết bị thêm đồng thời có thể nhận 409.
