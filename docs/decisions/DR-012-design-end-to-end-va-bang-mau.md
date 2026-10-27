# DR-012 — Hoàn thiện thiết kế end-to-end và bộ màu hệ thống mới

> **Trạng thái: APPROVED — 25/10/2026** (PO trả lời bằng lựa chọn trong phiên làm việc, sau khi đọc `docs/implementation/spec-design-e2e-bang-mau.md`). Đây là quyết định về **phạm vi thiết kế**, không phải backend. Plan chủ không bị sửa. Backend vẫn chưa làm (PO: "chưa làm task BE, hoàn thiện design trước").

## Quyết định
| # | Nội dung | PO chọn |
|---|---|---|
| — | Spec `spec-design-e2e-bang-mau.md` | Duyệt, làm tiếp |
| Q1 | Màn "Hôm nay" khi đang đi | **Có, thiết kế khung** (đọc từ dữ liệu chuyến đã có, không thêm dữ liệu) |
| Q2 | Onboarding lần mở đầu | **3 thẻ giới thiệu có thanh tiến độ**, bỏ qua được, hiện một lần, rồi vào Khám phá |
| Q8 | Tạo chuyến nhiều bước (ai đi, sở thích, ngày linh hoạt) và bản đồ tuyến theo ngày | **Có, thiết kế khung cả hai** |
| Q5 | Hướng màu | PO chưa chọn hướng; sẽ xem 3 bộ màu (Trời xanh + cam, Nắng vàng, Lai) bằng ảnh thật rồi chọn |

Yêu cầu gốc của PO (nguyên văn): "end to end luôn, từ đầu đến cuối, từ onboarding tới sử dụng thật … phối màu lên một bộ màu hệ thống … thích màu như Roameo (tươi sáng, màu vàng hoặc xanh nhạt và sặc sỡ tươi mới chứ không phải màu trầm như hiện tại)". Ảnh tham chiếu: `docs/UI-sample/` (50 ảnh).

## Hệ quả và giới hạn
- **Thiết kế khung ≠ cam kết backend.** Q1, Q8 thêm nhu cầu dữ liệu (ví dụ ai đi, sở thích, tọa độ địa điểm cho tuyến) sẽ ghi vào `docs/ux/data-needs.md`; **mỗi thay đổi schema/API vẫn cần PO duyệt (Tầng A) trước khi làm backend.** "Dự kiến N ngày" (A3) vẫn chờ PO.
- Chỉ **tham chiếu gu**: không dùng logo, minh họa 3D, chữ, số liệu/đánh giá/dùng thử trả phí của Roameo; không có nhập địa điểm từ mạng xã hội (Q9 mặc định "không làm", chờ PO nếu muốn khác).
- Không bịa số sao/giá/giờ mở cửa; nội dung mới là bản nháp có nhãn.
- Giữ những thứ làm nên look DR-009; đổi **màu** và những gì đi theo màu. Nếu bộ màu buộc đổi gradient/bóng/huy hiệu thì hỏi PO trước.
- RG-2, RG-5, RG-6, RG-7 vẫn mở; không ra mắt người dùng thật.
