# DR-026 — Bản đồ native, chỉ đường ước tính, schema POI (PO, 29/10/2026)

- **Trạng thái:** `APPROVED` theo câu trả lời `AskUserQuestion` ngày 29/10/2026. Căn cứ: `docs/research/map/ban-do-giai-phap.md` (Codex, nhiều mục `UNVERIFIED` vì không có mạng/GPU thật), `docs/research/da-lat-poi-trial/VERIFY-MATCHES.md`.
- **Liên quan:** ADR-015 (MapLibre + OpenFreeMap + hillshade AWS, giữ nguyên), DR-024, DR-025.

| Câu hỏi | PO chọn |
|---|---|
| Bản đồ làm gì tiếp | **Ghim/cụm native + style Wander (Liberty đổi paint theo token) + tuyến chạm được**, theo lộ trình §7 bước 2–4; không thêm dependency, giữ MapLibre và nguồn tile đã duyệt |
| Chỉ đường | **Giữ đường ước tính**, ổn định tương tác trước; thử dịch vụ chỉ đường sau (profile xe máy, điều khoản, quota) rồi mới chọn nhà cung cấp |
| Schema POI ăn/uống/nghỉ | **A: `PlaceRecord` chung + provenance từng trường**, `DiscoverProfile` tùy chọn; giờ mở cửa giữ raw + "chưa biết" (86% thiếu), thư viện parser để sau; ảnh WoodStock/Le Café chưa vào Discover tới khi xác minh xong |

## Hệ quả
- Ghim native mất nút HTML focus được: bắt buộc có đường thay thế bàn phím/đọc màn hình (danh sách ↑/↓ hiện có), e2e bản đồ phải đổi sang điểm kiểm không dựa DOM ghim.
- Mọi mốc đo hiệu năng phải chạy ở máy có mạng + GPU thật trước/sau; Codex chưa đo được.
- Schema `PlaceRecord`: Tầng A, **thiết kế chi tiết trình PO trước khi viết mã**; chưa nhập dữ liệu thử vào catalog/DB.
