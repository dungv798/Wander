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
