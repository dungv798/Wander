# DR-017 — PO chọn: giữ bộ màu hiện tại (Nắng vàng) và giữ bản đồ riêng tới hết Lát 1a

- **Trạng thái:** `APPROVED` — PO trả lời 26/10/2026: "1. hiện tại 2.a" cho hai câu cuối `PO-REVIEW-UI-V6.md` §6.
- **Liên quan:** DR-013 (Nắng vàng), DR-016, AD-14, `docs/architecture/map-options.md`.

## Quyết định
| Câu | PO chọn | Hệ quả |
|---|---|---|
| Bộ màu | **hien-tai** (Nắng vàng v2, DR-013) | `tokens.css` giữ nguyên làm bộ chính thức. Ba hướng thử (`docs/ux/palettes/bien-som|nhiet-doi|hoang-hon.css`) giữ làm tài liệu, KHÔNG áp. Bố cục, animation, bản đồ, thẻ toàn màn, một màu cho mọi ngày của v6 vẫn giữ (PO không bác). Nếu sau này muốn đổi màu: ghi đè token như các tệp đó, đã đạt AA |
| AD-14 Bản đồ sản phẩm thật | **(a) giữ bản đồ địa hình riêng của Wander tới hết Lát 1a** | Không thêm thư viện bản đồ, không nguồn tile ngoài. Việc làm tiếp: thêm điểm đến mới bằng `build-map.mjs`; giảm kích thước ảnh nền khi có nhiều điểm đến. Xem lại AD-14 trước khi cần xoay/nghiêng, theo dõi vị trí hay nhiều điểm đến |

## Quy trình mới (PO, 26/10/2026)
"Từ giờ về sau sau mỗi phiên nếu còn cần approve gì thì list hết ra để t chọn": cuối MỖI phiên liệt kê **toàn bộ** mục đang chờ PO, mỗi mục có phương án và khuyến nghị, để PO chọn một lượt. Đã ghi vào `.claude/rules/decision-materiality.md`.
