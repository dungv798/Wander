# Gói duyệt DG-1 cho PO (sáng 26/10/2026)

> **CẬP NHẬT 25/10/2026: DG-1 ĐÃ ĐƯỢC PO DUYỆT** (`DR-010` APPROVED; A1/A2/B1 ở `DR-011`). Phần dưới là bản gốc để tra cứu, các câu "chờ duyệt" trong đó đã cũ. Việc đang chờ PO hiện nay: `docs/ux/PO-REVIEW-DG2.md` và `DR-014` (dự thảo).

> Soạn trong phiên đêm 25/10/2026, theo lời anh: "process hết những cái còn lại … thật kĩ, sáng mai t sẽ check". **Em không đóng DG-1, không commit, không đụng backend.** Việc cần anh làm: xem, chọn ở `po-questions.md`, rồi duyệt hoặc không ở `docs/decisions/DR-010-dg1-de-nghi-dong-cong-DU-THAO.md`.

## 1. Cách xem (5 phút)
1. Chạy máy chủ tĩnh: `node docs/ux/tools/serve.mjs` rồi mở:
   - App: http://127.0.0.1:4177/ (mở DevTools → thiết bị 390 px để xem bản điện thoại; kéo rộng ≥ 1280 để xem bản máy tính)
   - Quản trị: http://127.0.0.1:4177/admin.html (bấm "Vào bản thử")
   - Thư viện thành phần: http://127.0.0.1:4177/components.html
2. Thử nhanh: `/?fresh=1` (người mới hoàn toàn, chưa có chuyến mẫu); `/?state=loading|error|offline`; `/?ttl=20` (lần thử khôi phục hết hạn sau 20 giây).
3. Các nút có nhãn **"BẢN THỬ"** hoặc **"Giả lập: …"** chỉ để thử (máy mới xin ghép, thiết bị khác khôi phục, xung đột phiên bản, người được mời, hết phiên quản trị).
4. Ảnh chụp thật (390/768/1280 × sáng/tối): `docs/ux/screenshots/INDEX.md` (390 ảnh, 0 lỗi console). Ảnh `t1-*`, `t3-*` là bản thử cũ trước DR-009, **không còn đại diện**, bỏ qua.
5. Liên kết artifact: **không đăng**, vì prototype cần máy chủ cục bộ để đọc kho biên tập và ảnh.

## 2. Có gì (đọc từ lần chạy cuối, không từ trí nhớ)
| Việc | Kết quả |
|---|---|
| `node docs/ux/tools/flows.mjs` | **12/12 luồng đạt**: F00 Khám phá, F01 trạng thái Khám phá, F02 danh tính, F03 chuyến, F04 xếp ngày, F05 mục/chi phí, F07 xóa/thùng rác/xác thực lại, F08 bảo mật/khôi phục, F09 nhóm, F12 quản trị, F14 khung thích ứng, T2 thành phần |
| `a11y-scan.mjs --strict` | 220 trang (mọi màn × 390/768/1280 × sáng/tối): tương phản 0, thiếu tên 0, ô nhập không nhãn 0, vùng chạm < 44 px 0, ảnh thiếu alt 0, id trùng 0; thoát 0 |
| `contrast.mjs` | thư viện 122 phép tính 0 lỗi; app 30 phép tính 0 lỗi |
| Taste (`--app`) | app 5 FAIL **giữ có chủ ý** (DR-009) + 4 WARN bảo vệ; đăng nhập quản trị 0 FAIL, 2 WARN bảo vệ |
| Phản biện độc lập | vòng 1: `wander-skeptic-qa`, `wander-product-analyst`, `wander-security-reviewer`; vòng 2: skeptic kiểm lại các bản sửa → **không còn BLOCKER/MAJOR** (4 lượt gọi, trong ngân sách 6) |
| Backend | không đổi. Java/Gradle **không chạy** trong phiên này |

## 3. Thay đổi lớn so với tối qua
Căn định dạng mã theo `Secrets.java` (mã khôi phục 30 ký hiệu, mã ghép `XXXX-XXXX`); bỏ "còn N lần thử"; khóa Esc ở bước hiện mã; màn duyệt thiết bị nêu đủ thông tin; nhật ký hoạt động; thùng rác đúng vị trí/ngày; đề nghị xóa kèm lý do; vào chuyến bằng liên kết + tên hiển thị (chặn giả mạo); tiến độ việc cần làm theo người; trạng thái tìm không ra và ảnh lỗi; cổng quản trị mức khung với 8 luật "thẻ đủ chuẩn".

## 4. Anh cần chọn (Tầng A), thứ tự chặn backend
Đầy đủ phương án + khuyến nghị: `docs/ux/po-questions.md`. Năm câu quan trọng nhất:
1. **A1 R12**: đổi ngày chuyến làm mục nằm ngoài khoảng: chặn (plan) hay đưa về "Chưa có ngày" (prototype)?
2. **A2**: thùng rác 30 ngày (DR-008) mâu thuẫn plan R7/D19 "giữ đến khi xóa vĩnh viễn": cần DR sửa chữ plan.
3. **B1**: xóa vĩnh viễn từng mục có phải xác thực lại không (mỗi lần đốt một mã khôi phục)? Em khuyến nghị (b): chỉ cho thao tác cả chuyến/tạo mã/chuyển giao.
4. **B2**: người lấy được máy còn phiên có thể tự phát hành mã đầu tiên rồi dùng làm bằng chứng xác thực lại, hoặc thu hồi máy của chủ → chiếm quyền vĩnh viễn. Em khuyến nghị thời gian chờ cho mã phát hành sau khi đã bỏ qua.
5. **C2**: phần nhóm (1b) trong prototype chỉ là thiết kế, **không** tính vào backend 1a. Quản trị: **Q-d** chưa quyết.

## 5. Còn yếu / chưa kiểm (nói thẳng)
- Chưa kiểm trình đọc màn hình, thiết bị thật, chữ phóng 200%, Firefox/Safari (RG-7). Mọi thứ trên là Chrome headless.
- Toàn bộ là localStorage: mã khôi phục, danh sách thiết bị, "máy chủ" giả đều **giả**. Khóa 5 lần chỉ ở client; bản thật phải đếm ở server (MĐ-8). Đừng bê cách lưu mã vào `web/`.
- Màn duyệt thiết bị hiện "Hà Nội" là **ví dụ** của bản thử (đã gắn nhãn).
- Chưa dựng: tải ảnh lên, tạo điểm đến mới, xuất Ảnh/PDF/Lịch, hết phiên người dùng thường, màn gỡ thành viên.
- Quản trị ngoài trang đăng nhập chưa qua Taste (chỉ a11y-scan và ảnh).
- G7 vẫn **UNVERIFIED**; RG-2, RG-5, RG-6, RG-7 vẫn mở: **không ra mắt người dùng thật**.

## 6. Công cụ đã dùng
Kỹ năng: `systematic-debugging` (sửa lỗi `adapt.js`, vá `shots`), `ui-ux-pro-max`, `planning-and-task-breakdown`, `spec-driven-development` (đã gọi ở các lượt trước của phiên; tối nay áp dụng, không gọi lại). Tác tử: `wander-skeptic-qa` ×2, `wander-product-analyst` ×1, `wander-security-reviewer` ×1 (tối nay, + ba lượt tương tự trước đó). Công cụ: playwright-core + Chrome (luồng, ảnh, quét), Taste `inspect.mjs --app`, `contrast.mjs`, `a11y-scan.mjs`. RTK: `rtk gain` đọc lúc kết thúc: 312 lệnh, tiết kiệm 46,2K token (53,7%). code-review-graph: **không dùng** tối nay (không có mã backend/web nào thay đổi).
