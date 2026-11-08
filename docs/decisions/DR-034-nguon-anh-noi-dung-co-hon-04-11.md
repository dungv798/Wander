# DR-034 — Nguồn ảnh/nội dung "có hồn" cho Wander (04/11/2026)

**Trạng thái:** PO đã chọn nguồn (AskUserQuestion, 04/11/2026); từng nguồn còn cổng riêng bên dưới. Không nguồn nào được bật cho người dùng thật khi RG-2/RG-5/RG-6/RG-7 còn mở.

## Bối cảnh
PO nhận xét web nghèo: ~136 địa điểm / 12 điểm đến (mỗi nơi 5–22), gần như chỉ ảnh phong cảnh từ Commons, thiếu ảnh có người, món ăn, hoạt động; Hà Giang 8 nơi và Tà Xùa 2 nơi chưa có ảnh (số liệu đếm từ `backend/src/main/resources/catalog/*.json` ngày 04/11). Câu hỏi: dùng Pinterest/mạng xã hội để lấy ảnh?

## PO chọn (cả 4)
| # | Nguồn | Cổng trước khi dùng |
|---|---|---|
| 1 | Mở rộng Commons + Openverse (ưu tiên ảnh có người, món ăn, lễ hội, chợ) | Làm ngay bằng `tools/catalog/photo-pipeline.mjs`, chỉ giấy phép CC BY / CC BY-SA / CC0 / PD, lưu tác giả + giấy phép + liên kết trang tệp. Chọn ảnh bằng mắt, chỉ thêm, không ghi đè ảnh đã tuyển. |
| 2 | Unsplash / Pexels API | Cần khóa API do PO cấp (không tự tạo, không in ra); đọc điều khoản (hotlink, ghi nguồn, giới hạn) trước. Dự kiến dùng cho ảnh nền hero/danh mục, không gắn thành ảnh của một địa điểm cụ thể (nguy cơ gắn nhầm nơi). |
| 3 | Nhúng bài mạng xã hội (oEmbed) | Đọc điều khoản từng nền tảng; script bên thứ ba cần tải lười + đồng ý riêng tư; không cào/tải ảnh về. |
| 4 | Người dùng tự đăng ảnh (UGC) | Pha sau: cần lưu trữ (S3), kiểm duyệt, báo cáo; chạm AWS nên chờ RG-5. Chưa làm. |

## Không làm
Cào hoặc tải ảnh từ Pinterest/Instagram/TikTok/Facebook về tự lưu: vi phạm điều khoản và bản quyền của người đăng.

## Việc kế tiếp
- Codex (research, model rẻ): `docs/research/image-sources/TERMS.md` tóm tắt điều khoản nguồn 2 và 3 (UNVERIFIED cho tới khi đọc xong).
- Claude: chạy pipeline ảnh mở rộng cho điểm đến yếu trước (Hà Giang, Tà Xùa, Nha Trang, Phú Yên, Quy Nhơn).

## Cập nhật 05/11/2026 — cấp khóa
- **Pexels:** PO báo trang đang hiển thị việc cấp khóa API mới tạm dừng, không xin được khóa ⇒ tạm gạt nguồn này (không phải quyết định bỏ hẳn; thử lại sau).
- **Openverse:** không cần khóa để chạy (gọi ẩn danh, đã thử có lỗi 500 chập chờn, công cụ có thử lại); đăng ký là lệnh POST chứ không phải trang web. Không bắt buộc.
- **Unsplash:** đường vào trang ứng dụng ở https://unsplash.com/oauth/applications (sau khi đăng nhập).

## Quyết định 05/11/2026 — Unsplash: hotlink cho Khoảnh khắc và ảnh bìa (PO chọn, APPROVED)
- **PO chọn** (AskUserQuestion): "Hotlink, chỉ cho Khoảnh khắc và ảnh bìa". Lý do kỹ thuật: điều khoản Unsplash bắt buộc dùng URL ảnh do API trả về (không lưu tệp), ghi tên nhiếp ảnh gia + liên kết gốc có `utm_source`.
- **Đã làm:** `Photo` nhận đúng một nguồn (tệp cục bộ HOẶC URL ngoài trong danh sách cho phép `EXTERNAL_PHOTO_HOSTS` = `images.unsplash.com`); `Destination.coverPhoto` tùy chọn; chủ đề mới `hanh-trinh`; CSP `img-src` thêm `https://images.unsplash.com` (HttpConstants, ghi lý do tại chỗ); công cụ `tools/catalog/unsplash-moments.mjs`.
- **Rủi ro chấp nhận có kiểm soát:** máy người xem gửi IP/Referer tới Unsplash; kết quả tìm kiếm Unsplash lẫn ảnh sai nơi (đã thấy Ninh Bình/Hạ Long trong kết quả Hội An, Huế) ⇒ chỉ nhận ảnh có nội dung tự nhận ra được địa danh, xem từng ảnh bằng contact sheet; không dùng chân dung cận mặt/ảnh trẻ em.
- **Còn nợ:** (1) báo lượt dùng `download_location` cho vài ảnh bị 403 vì hết hạn mức giờ (Hội An 2–7 ảnh, Huế 1) ⇒ chạy lại sau 1 giờ; (2) chế độ Demo (50 lượt/giờ) chỉ đủ cho phát triển, chạy thật phải gửi đơn duyệt (RG-2 đã chặn việc mở cho người lạ); (3) **Secret Key đã bị dán vào chat ⇒ PO nên tạo lại (regenerate) ở trang ứng dụng Unsplash** (không dùng trong mã).
