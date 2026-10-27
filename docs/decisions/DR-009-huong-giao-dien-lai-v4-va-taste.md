# DR-009 — Hướng giao diện: lai (minh họa v4 + nút phẳng, bóng nhẹ) và chuyển màn v4 vào prototype

- **Ngày:** 25/10/2026 · **Trạng thái:** APPROVED (PO trả lời bằng lựa chọn trong hội thoại)
- **Bối cảnh:** PO hỏi vì sao prototype mới khác xa mẫu v4 đã duyệt. Nguyên nhân: (1) khung T3 dựng lại từ đầu thay vì chuyển các màn v4; (2) lệnh "fix theo Taste" đã gạt gradient, bóng đổ lớn, vòng tròn màu theo loại, là chính những thứ làm v4 có vẻ rực rỡ. Hai chỉ dẫn của PO xung đột nhau.
- **PO chọn:**
  1. Hướng look: **"Lai: giữ minh họa v4, nút phẳng"** — khôi phục nền trời, máy bay, thẻ xòe quạt, la bàn, huy hiệu tròn theo loại; giữ nút CTA cam PHẲNG và bóng tĩnh nhẹ (bóng nổi chỉ cho lớp nổi thật).
  2. Thứ tự: **"Chuyển ngay, rồi mới T4"** — các màn v4 vào prototype trước khi làm cụm trip.
- **Hệ quả:**
  - `docs/ux/prototype/app/` là bản v4 chuyển sang (nguồn: artifact "Wander Khám Phá"), dữ liệu từ kho biên tập thật qua `adapt.js`; `adaptive.css` thêm bố cục thích ứng (thanh bên 96/264, hộp thoại giữa, ngăn kéo phải 440).
  - Các FAIL của Taste còn lại là **có chủ ý và được bảo vệ**: gradient nền trời (minh họa), huy hiệu tròn theo loại (màu mang nghĩa), thanh tab nổi có bóng và che chữ khi cuộn (bản chất lớp nổi), thẻ "Nổi bật" bị cắt mép (gợi cuộn ngang), thẻ xòe viền trắng. Taste vẫn bắt buộc cho mọi thứ không xung đột (h1, text-shadow, cạnh mép, truy cập).
  - Lỗi truy cập của v4 được sửa trong bản chuyển: tagline tàng hình ở giao diện tối, nút cam sáng lên dưới 4,5:1 ở giao diện tối (nay cố định `#d93a0b`), chú thích thẻ xòe bị che, thiếu h1.
- **Không đổi:** hướng rực rỡ kiểu Roameo, phông Baloo 2 + Be Vietnam Pro, Tabler Icons, vàng chỉ cho "chờ duyệt", thuật ngữ đã duyệt.
