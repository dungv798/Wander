# DR-031 — Duyệt PlaceRecord, ảnh bìa chuyến, video hành trình (PO, 30/10/2026)

- **Trạng thái:** `APPROVED` theo lời PO ("duyệt place record design") và `AskUserQuestion` 30/10/2026.
- **Liên quan:** DR-025/026/028/029/030; `docs/architecture/place-record-design.md`.

| Mục | PO chọn |
|---|---|
| **PlaceRecord design** | **Duyệt** thiết kế (`place-record-design.md`), phương án khuyến nghị ở §7 làm mặc định: `PlaceRecord` chung + provenance từng trường, hai lớp OSM rộng / Discover có ảnh duyệt, giờ mở cửa giữ raw + "chưa biết". Làm theo từng lát nhỏ, mỗi lát có test; Tầng A phát sinh riêng (dependency parser giờ mở cửa, nhập dữ liệu ảnh chưa xác minh, schema nếu lát cần) vẫn hỏi riêng |
| **Ảnh bìa từng chuyến** | Lưu **ở máy chủ** (cột cover trên chuyến; migration nhỏ, chỉ thêm trường, không phá API); chọn từ ảnh catalog của điểm đến + vài màu/gradient; **không** cho tải ảnh lên; chỉ Organizer đổi |
| **Video hành trình** | Làm **clip ~8 giây quay từ app thật** (Playwright, dữ liệu giả có sẵn), dùng làm **nền hero trang chủ** (lặp, không tiếng, ảnh tĩnh khi giảm chuyển động, tải lười, tệp nhẹ ~1–2 MB) và dùng làm clip quảng cáo |

## Phản hồi UI/UX 30/10 đã giao (job chi tiết/bản đồ, nút/tông, màn lịch trình)
Khối "Nên đi buổi nào/Mùa đẹp" thiếu dấu hiệu bấm được; bản đồ chi tiết không kéo được; nền nút nhòe xanh; "Xem thêm" chưa chỉnh chu; bản đồ khởi đầu quá nhỏ; sheet hở hai bên (không phải quyết định của PO: đổi sát hai mép); Chi phí khó đọc phải kéo ngang; "Hoàn tác"/"Chờ xác nhận"/"Đã đặt" có gạch chân/viền đen, tích không khác trạng thái, tích "Đã đặt" làm hộp dài ra; chọn giờ phải 24 giờ; trang Chuyến đi chán; nút vàng nhạt làm lại.
