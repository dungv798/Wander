# DR-024 — PO chọn hướng look Roameo và tính năng bổ sung (29/10/2026)

- **Trạng thái:** `APPROVED` theo câu trả lời của PO bằng `AskUserQuestion` ngày 29/10/2026. Căn cứ: `docs/design/roameo-spec.md` (Codex nghiên cứu 37 ảnh, các kết luận về font gốc và khúc xạ iOS 26 vẫn `UNVERIFIED`).
- **Liên quan:** DR-009, DR-013 (nhận diện và bảng màu Nắng vàng, giữ nguyên), DR-023.

## PO nói gì (29/10/2026)
Font thử không giống mẫu `docs/UI-sample-2`, nút liquid glass chưa làm thật, icon chưa đổi, "không đạt yêu cầu"; muốn dựa vào mẫu và giao Codex nghiên cứu, kiểm thử kỹ. Bản đồ lag, mờ, kiểu "giấy 20 năm trước", ảnh chi tiết bị phóng to, tuyến không tương tác: giao model `gpt-6-astra` effort `high` tìm giải pháp.

## PO chọn
| Câu hỏi | Lựa chọn |
|---|---|
| Hiệu ứng kính | **CSS thuần** (mờ nền + vệt sáng); không thêm thư viện khúc xạ |
| Tính năng thêm từ mẫu | **Cả bốn:** (1) tìm/lọc/sắp xếp chuyến đi, (2) chọn nhiều nơi rồi "Thêm vào Ngày n", (3) ước tính di chuyển giữa các điểm, (4) bộ sưu tập nhiều danh sách và nhập link |

## Hệ quả
- Look mới bật mặc định, giữ bảng màu Nắng vàng; `?look=classic` đưa về bản cũ để so sánh. Bỏ Baloo 2.
- (1) và (2) làm ngay sau look + bản đồ (không cần quyết định thêm trừ API thêm theo lô nếu cần).
- (3) cần dịch vụ chỉ đường ngoài (chi phí, điều khoản, quota) và (4) cần schema mới: **vẫn là Tầng A**, sẽ hỏi lại với phương án cụ thể sau khi có kết quả nghiên cứu bản đồ. PO đã chọn hướng làm, chưa chọn nhà cung cấp hay schema.
