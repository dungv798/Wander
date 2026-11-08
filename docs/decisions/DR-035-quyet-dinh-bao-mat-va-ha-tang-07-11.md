# DR-035 — Quyết định bảo mật, hạ tầng và sản phẩm (07/11/2026)

**Trạng thái:** APPROVED (PO trả lời trực tiếp trong phiên 07/11/2026 qua lựa chọn có khuyến nghị).
**Nguồn:** báo cáo rà bảo mật (`wander-security-reviewer`), báo cáo review (`/wander-review`), `docs/implementation/decisions.md`.

## Quyết định

| Mã | Câu hỏi | Lựa chọn của PO | Hệ quả |
|---|---|---|---|
| Q-a | Phiên đăng nhập không hết hạn (DR-018 F1) | TTL trượt + tuyệt đối, kèm nút đăng xuất mọi máy khác | Cần thay đổi backend (hạn phiên, thu hồi hàng loạt) và test. |
| Q-b | Hạn mức duyệt ghép thiết bị / tái tạo mã | Tính theo danh tính, không theo phiên | Cần test hai phiên cùng danh tính. Chặn chuỗi chiếm quyền HIGH. |
| Q-c | CSP `connect-src` tới toàn bộ S3 | Thu hẹp qua proxy cùng nguồn (khi triển khai) | Chưa làm ngay; thuộc giai đoạn hạ tầng. |
| Q-d | `trusted-proxy-hops` | Giữ 0 cho tới khi có ALB chỉ nhận lưu lượng từ CloudFront | Không đổi cấu hình hiện tại. |
| Cloud | Kết nối Render/Neon và khóa N4 | Có kết nối Render/Neon. PO tự tạo tài khoản và secret; Claude hướng dẫn cấu hình theo runbook | Không tạo tài nguyên hay secret khi chưa có PO thao tác. |
| Hero 3D | Thêm three.js, GSAP, Lenis | Không thêm; giữ hero tắt | Không đổi runtime dependency. |
| PlaceRecord | Duyệt thiết kế `docs/architecture/place-record-design.md` §7 | Duyệt như đề xuất | Mở đường cho gợi ý ăn uống/cafe/nghỉ trong "Xếp giúp tôi". |
| Rating | Foursquare hiển thị cạnh rating Wander | Chờ đọc điều khoản và giá | Chưa tích hợp. |

## Lý do
Các quyết định Q-a và Q-b giảm thiệt hại khi phiên bị lộ, là điều kiện trước khi mở RG-2 cho người dùng thật.

## Việc chưa làm
- Q-c và Q-d chỉ thực hiện khi có hạ tầng.
- Rating Foursquare cần đọc điều khoản trước (UNVERIFIED).
