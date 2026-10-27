# DR-004 — Xóa cả chuyến chưa có ở Lát 1a (Q17b)

- **Trạng thái:** `APPROVED` — PO chọn "Chưa có xóa chuyến ở 1a" ngày 24/10/2026 (khuyến nghị của hội đồng).
- **Liên quan:** Q17b, D19, D25/QĐ-4, OQ-1, gate RG-5.

## Quyết định
1a **không có** thao tác xóa mềm hay xóa vĩnh viễn **cả chuyến**. D25 (xác thực lại trước xóa vĩnh viễn cả chuyến) chưa áp dụng vì thao tác không tồn tại.

## Hệ quả
- Chuyến tạo nhầm tồn tại mãi trong 1a (chỉ xóa được từng mục theo Q17c).
- **OQ-1** (giữ dữ liệu chuyến mất quyền vĩnh viễn và bản sao lưu) vẫn `OPEN`, **phải quyết trước RG-5 / ra mắt thật**; đã gác ở `open-decisions.md`.
- Khi thêm xóa chuyến sau này: cần DR mới, thiết kế re-auth (MĐ-1), `docs/implementation/decisions.md` §2 dòng Q17b cập nhật.
