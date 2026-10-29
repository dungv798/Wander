# DR-028 — Tone nền trắng mát, hero ảnh, kính mạnh hơn (PO, 29/10/2026)

- **Trạng thái:** `APPROVED` theo `AskUserQuestion` ngày 29/10/2026. **Điều chỉnh** DR-013 (bảng màu Nắng vàng): thương hiệu vàng được giữ nhưng đổi vai trò, không bỏ.
- **Liên quan:** DR-009, DR-013, DR-024, DR-027.

## PO nói gì
Map và nút "ổn hơn nhiều"; nhưng nền vàng kem khi làm background trông vintage/cũ; nút cần trong và bóng kiểu thủy tinh hơn nữa; trang chủ chưa gây ấn tượng, nhiều đoạn thừa, quá nhiều content item; UX mới đạt khoảng 7 điểm.

## PO chọn
| Câu hỏi | Lựa chọn |
|---|---|
| Tone nền | **Nền gần trắng mát; vàng chỉ làm điểm nhấn** (CTA, trạng thái chọn, tab đang chọn, chấm nhấn); màu phong phú đến từ ảnh/bản đồ |
| Trang chủ | **Hero ảnh to + 3 khối gọn** (tiếp tục / gợi ý theo sở thích / khối nhỏ nếu đáng giữ); bỏ minh họa mặt trời, máy bay, thẻ quạt, dải chạy chữ, chip lặp |
| Kính của nút | **Mạnh hơn** (blur nhiều, viền sáng, vệt phản chiếu rõ), vẫn CSS thuần |

## Hệ quả
- Giữ tương phản chữ >= 4,5:1; `?look=classic` vẫn đưa về bản cũ.
- Không làm mất chức năng chưa có chỗ thay khi dọn trang chủ (kiểm kê ở `docs/design/home-audit.md`).
