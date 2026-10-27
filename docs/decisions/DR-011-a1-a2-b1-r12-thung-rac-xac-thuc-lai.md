# DR-011 — A1 (R12), A2 (thời hạn thùng rác), B1 (xác thực lại xóa từng mục)

> **Trạng thái: APPROVED — 25/10/2026** (PO trả lời bằng lựa chọn trong phiên làm việc, sau khi đọc phương án và khuyến nghị ở `docs/ux/po-questions.md`). Đây là quyết định sản phẩm: **không sửa** `docs/wander-master-plan.md`; chữ plan chỉ đổi khi PO nói rõ. Phần "Đề xuất sửa chữ plan" bên dưới là để PO duyệt riêng.

## 1. Quyết định

| # | Câu hỏi | PO chọn | Nghĩa là gì khi làm |
|---|---|---|---|
| A1 | R12: đổi ngày chuyến làm mục nằm ngoài khoảng | **(b)** cho phép đổi; mục lệch (kể cả mục đã xóa) tự về "Chưa có ngày"; có Hoàn tác | Migration `items.day_date` cho phép NULL; `Trip` bỏ `DATES_ORPHAN_ITEMS`; `restore` không ném `DAY_OUT_OF_RANGE` mà đưa về "Chưa có ngày"; API trả mục chưa có ngày; Hoàn tác đổi ngày là một lệnh nguyên tử |
| A2 | Thời hạn "Đã xóa gần đây" | **(b)** giữ đến khi người dùng xóa vĩnh viễn (R7/D19 gốc) | **Không** có job xóa định kỳ, **không** có `expiresAt`, **không** thông báo hết hạn. Hủy phần "30 ngày" của DR-008 Q-e. Prototype phải bỏ chữ/đếm ngược 30 ngày. OQ-1 (dữ liệu chuyến mất quyền, bản sao lưu RDS) vẫn mở trước RG-5 |
| B1 | Xóa vĩnh viễn TỪNG MỤC có xác thực lại không | **(b)** không; xác thực lại chỉ cho xóa cả chuyến, tạo lại mã, chuyển giao (D25 gốc) | Xóa vĩnh viễn một mục chỉ cần phiên chủ chuyến. Hủy phần "xác thực lại từng mục" của DR-008 Q-e. Prototype F07 phải bỏ bước xác thực lại ở xóa từng mục; INV-14/MĐ-1 giữ nguyên |

## 2. Hệ quả cho công việc
- **Lát 2** (mục chưa có ngày + R12 mới): mở được ngay theo A1(b) (migration `day_date` nullable, đổi `Item`/`Trip`, API, test).
- **Lát 3** (gán ngày hàng loạt + Hoàn tác): mở được (phụ thuộc A1, đã có).
- **Lát 4** (thùng rác): rút gọn. Không job, không `expiresAt`; chỉ danh sách "Đã xóa gần đây", khôi phục, xóa vĩnh viễn từng mục (không step-up) và xóa vĩnh viễn cả thùng (xem Tầng B bên dưới).
- **Lát 6** (cờ ngày chưa chắc, A3) vẫn chờ PO.
- Prototype cần sửa theo A2/B1 (F07, `screens.md`, `user-flows.md`, `design-system.md` nếu nhắc 30 ngày): việc thiết kế, làm được dưới DG-1 đã đóng.

## 3. Đề xuất sửa chữ plan (CHƯA áp dụng, chờ PO nói "sửa")
- **R12**: thay "không cho đổi ngày khi có mục nằm ngoài" bằng "đổi ngày được; mục nằm ngoài khoảng mới về 'Chưa có ngày'".
- **R7/D19**: không đổi (A2 chọn giữ nguyên chữ gốc).

## 4. Điều DR này KHÔNG làm
Không quyết A3, B2, B3, B4, E1, Q-d, Q6–Q9, Q12; không cho ra mắt người dùng thật (RG-2, RG-5, RG-6, RG-7 mở).
