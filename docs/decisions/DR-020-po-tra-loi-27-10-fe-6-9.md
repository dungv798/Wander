# DR-020 — PO trả lời 27/10/2026: phạm vi đêm FE-6…FE-9, thùng rác, nhánh B, lịch mẫu

- **Trạng thái:** `APPROVED` (lời PO qua AskUserQuestion, 27/10/2026).
- **Liên quan:** D19, D20, D26, DR-004, DR-011 A2, DR-018 N-2, DR-019, OQ-1.

## Quyết định
| Câu hỏi | PO chọn | Hệ quả |
|---|---|---|
| Phạm vi chạy qua đêm | **Sửa bộ thẻ + FE-6→FE-9**, dừng trước FE-10 (nối backend cần backend từng lát) | FE-6…FE-9 xong ở `web/` bằng API giả; FE-10 chưa làm |
| Git | **Không commit** (anh tự commit) | Toàn bộ thay đổi nằm ở working tree |
| Nội dung Lịch mẫu | Bản nháp có nhãn, chỉ dùng địa điểm trong kho (khi soạn) | 3 lịch ở `backend/src/main/resources/catalog/templates/ha-giang.json` |
| Chế độ tối | **Chưa làm, giữ chỉ sáng** | `<html data-theme="light">`; tùy chọn Sáng/Tối/Theo hệ thống (F22) để sau |
| Trần "Đã xóa gần đây" (500 mục/chuyến) khi đầy | **Chặn xóa thêm, báo rõ** (không tự xóa mục cũ) | Đúng D19; backend cần trần tương ứng |
| Hết phiên nhánh B (đã bỏ qua mã, mất thiết bị duy nhất) | **Cho bắt đầu danh tính mới sau cảnh báo rõ** chuyến cũ mất vĩnh viễn | D20 chấp nhận mất, không cấm làm lại; **OQ-1** (backend giữ/xóa dữ liệu cũ bao lâu) vẫn mở, phải quyết trước RG-5 |
| Ba Lịch mẫu | **Duyệt cả ba** (Vòng cung Đông Bắc 3 ngày, Đồng Văn cuối tuần 2 ngày, Tây Côn Lĩnh và Hoàng Su Phì 3 ngày) | `status: approved`, mất nhãn "Bản nháp" |
| Phiên tới | **Taste/rà soát giao diện, chữ phóng 200%, màn 320 px** | Chưa nối backend |

## Ghi chú
- Lưu ý khi duyệt: lịch "Vòng cung" dồn Cao nguyên đá (thời lượng "Cả ngày") và Cột cờ Lũng Cú vào cùng một ngày; lịch Tây Côn Lĩnh để ngày 2 trống (chặng leo cần ~2 ngày). PO có thể sửa nội dung sau.
- Giữ nguyên các mặc định Tầng B ghi ở `docs/implementation/decisions.md` (mục "Bộ thẻ quẹt, FE-6, FE-7", "FE-8, FE-9").
