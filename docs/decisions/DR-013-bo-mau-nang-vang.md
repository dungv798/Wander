# DR-013 — Bộ màu hệ thống: Nắng vàng (v2) và nút gradient nhẹ

> **Trạng thái: APPROVED — 25/10/2026** (PO chọn bằng lựa chọn sau khi xem ảnh thật ở `docs/ux/screenshots/palette/compare.html`). Quyết định về **thiết kế giao diện**, không phải backend. Plan chủ không đổi.

## Quyết định
| Câu | PO chọn |
|---|---|
| Hướng màu | **(b) Nắng vàng, sửa tiếp** → bản `docs/ux/palettes/nang-vang-2.css` |
| Nút chính | **Có, thử gradient nhẹ** (đổi quyết định "nút phẳng" của DR-009 cho nút chính: gradient ngang hổ phách → cam, chữ mực tối) |
| Xác nhận bản v2 | **"Đúng ý, áp toàn app"** |

Lời PO ban đầu: "t thích màu như Roameo (tươi sáng, màu vàng hoặc xanh nhạt và sặc sỡ tươi mới chứ không phải màu trầm như hiện tại)".

## Nội dung bộ màu (đọc từ `nang-vang-2.css`)
Nền bơ nhạt `#fff8d8`; trời xanh `#8fd3fb` → vàng chanh `#ffe872`; nút gradient `#ffb01f` → `#ff6a00` chữ `#2a1700` (9,40:1 và 5,99:1); thương hiệu chữ cam đậm `#b84c00`; "chờ duyệt" lavender (tách khỏi vàng nhấn); bản tối navy `#15223d`, trời `#1f4a7a` → `#2c3a73`. Tương phản: 104 phép tính (52 cặp × sáng/tối), 0 lỗi (đọc từ `contrast.mjs`).

## Hệ quả
- Áp xuống `app.css`, `adaptive.css`, `admin.css`, thư viện thành phần; màu loại và màu ngày tính lại; màu ghim bản đồ đã đọc từ token.
- Đây vẫn chỉ là **màu**; thẻ pastel nhiều màu, nền kính, biểu tượng 3D (vòng 2 táo bạo) **không** được duyệt trong DR này.
- Chữ trắng trên vàng vẫn cấm; vàng chỉ là nền, vạch, huy hiệu, nhãn có chữ mực tối.
- Chuyển nút gradient: mọi nút chính của app và quản trị; chấm/chip dùng `--cta` giữ phẳng.
