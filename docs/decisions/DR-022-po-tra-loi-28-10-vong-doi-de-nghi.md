# DR-022 — PO trả lời 28/10/2026: vòng đời đề nghị xóa, thành viên bị gỡ, thông báo

Nguồn: câu trả lời của PO qua AskUserQuestion sau rà soát độc lập Lát 1b (`wander-code-reviewer`, `wander-skeptic-qa`). Trạng thái: **APPROVED** (lời PO). Kế hoạch gốc không sửa.

| # | Câu hỏi | PO chọn | Thực hiện |
|---|---|---|---|
| 1 | Đề nghị xóa đang chờ nhưng Organizer đã xóa thẳng mục | **Tự đóng thành "đã xử lý"** (khuyến nghị) | `Trip.softDelete` gọi `TripCircle.settlePendingOf`: đề nghị chờ của mục đó thành `approved` (điều người đề nghị muốn đã xảy ra). Test: `DeletionRequestTest`, `DeletionRequestApiIT`, e2e |
| 2 | Thành viên đang mở chuyến thì bị gỡ | **Đẩy về danh sách chuyến kèm thông báo** (khuyến nghị) | `useGoneGuard`: quay lại tab ⇒ đọc lại chuyến; chỉ 404 mới tính (`isTripGone`), rớt mạng không đá người dùng ra. e2e có |
| 3 | Thông báo giữa các thành viên (báo người bị gỡ, báo Organizer có đề nghị mới) | **Chưa làm, để sau** (khuyến nghị) | Organizer thấy số đề nghị khi mở chuyến/quay lại tab; thông báo đẩy/email gắn với hạ tầng, làm cùng giai đoạn phát hành |
