# DR-030 — PlaceRecord (hướng), font, thẻ bản đồ trang chủ (PO, 30/10/2026)

- **Trạng thái:** `APPROVED` theo `AskUserQuestion` 30/10/2026 cho các mục dưới; mục "đợt làm tiếp" **chưa rõ** (PO chọn cả ba việc và "nghỉ đợt này").
- **Liên quan:** DR-025/026, DR-028, DR-029; `docs/architecture/place-record-design.md`.

| Câu hỏi | PO chọn |
|---|---|
| PlaceRecord (gợi ý quán cụ thể) | **Duyệt hướng**; PO review chi tiết `place-record-design.md` §7 rồi Codex làm từng lát. Schema/DB, parser giờ mở cửa và nhập dữ liệu vẫn là Tầng A, hỏi riêng từng lát |
| Thẻ bản đồ nhỏ ở trang chủ | **Giữ**, PO xem bản chạy thật rồi quyết tiếp |
| Font | **Giữ hiện tại**: font hệ thống rounded, Nunito tự host làm dự phòng (giả thuyết mẫu dùng SF Rounded vẫn UNVERIFIED) |
| "Đã ghé" cho địa điểm (29–30/10) | Đã làm, không cần migration; xem `docs/implementation/SPEC-visited.md` |

## Chưa rõ
Đợt tiếp theo: tuyến chạm được; tìm/lọc/sắp xếp chuyến + chọn nhiều nơi thêm vào Ngày n; cấu trúc thẻ/hero theo mẫu + e2e cho "Đã ghé" — PO chọn cả ba nhưng cũng chọn "nghỉ đợt này". Chờ PO xác nhận.
