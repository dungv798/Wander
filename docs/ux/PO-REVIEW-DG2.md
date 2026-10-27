# Gói duyệt DG-2 cho PO (thiết kế end-to-end + bộ màu mới)

> Soạn 25/10/2026 theo lời anh: "chưa làm task BE, hoàn thiện design trước … end to end … onboarding tới sử dụng thật … bộ màu tươi như Roameo". **Em không đóng DG-2, không commit, không đụng backend.** Số liệu dưới đây đều **đọc từ lần chạy cuối** (`.logs/`), không từ trí nhớ.

## 1. Cách xem (5 phút)
1. `node docs/ux/tools/serve.mjs` rồi mở:
   - **Người mới (thấy giới thiệu 3 thẻ):** http://127.0.0.1:4177/?fresh=1
   - **Đã có chuyến mẫu:** http://127.0.0.1:4177/ → tab Chuyến đi
   - **Quản trị:** http://127.0.0.1:4177/admin.html → "Vào bản thử"
   - Xem 390 px: DevTools → thiết bị; ≥ 1280 px để xem bố cục máy tính.
2. Nhấn để thử: Chuyến đi → **Tạo từng bước (bản thử)**; vào một chuyến → **Hôm nay (bản thử)** (giả lập ngày ở đầu màn); biểu tượng ⓘ ở Chuyến đi → **Cài đặt và giới thiệu** (có nút giả lập hết phiên và lỗi theo mã); trong chuyến → nút chia sẻ → **Ảnh/PDF/Thêm vào lịch** (xem trước); Tổng quan → hàng **Tuyến theo ngày**.
3. So màu: `docs/ux/screenshots/palette/compare.html` (3 bộ + bản cũ). Ảnh toàn bộ màn: `docs/ux/screenshots/INDEX.md`.
4. Bản đồ hành trình: `docs/ux/journey-map.md`.

## 2. Có gì mới
| Việc | Kết quả |
|---|---|
| **Bộ màu Nắng vàng v2 + nút gradient** (DR-013) | áp toàn app, quản trị và thư viện thành phần; ảnh sáng/tối đã xem |
| **Onboarding 3 thẻ** (S14, F15) | thanh tiến độ, Quay lại, Bỏ qua, hiện một lần; nội dung là bản nháp |
| **Tạo chuyến theo bước** (S15, F16) | 6 bước, khung; "Ai đi" chỉ là kiểu chuyến đi |
| **Tuyến theo ngày** (S16) | chip "Ngày n · ~x km" ở Tổng quan; trong Ngày n đã có đường nối từ trước |
| **Hôm nay** (S17, F17) | kế hoạch ngày hiện tại, việc cần làm, chi đã biết giá, mở bản đồ ngoài; giả lập ngày |
| **Hết phiên 2 nhánh, lỗi theo mã, Cài đặt** (S19–S21, F18) | `docs/ux/error-codes.md` |
| **Xuất xem trước Ảnh/PDF/Lịch** (S18, F19) | chưa tạo tệp |
| **Quản trị: chọn tệp ảnh, bản nháp điểm đến** (A4, A5, F20) | chưa tải lên máy chủ |
| **Gỡ thành viên** (G8, F21) | 1b, chỉ người tạo thấy |

**Giao diện sáng/tối:** mặc định **sáng**; đổi ở Cài đặt → Giao diện (Sáng / Tối / Theo hệ thống).

## 3. Số liệu kiểm (đọc từ log)
| Kiểm | Kết quả |
|---|---|
| `flows.mjs` (`.logs/flows-final.log`) | **19/19 luồng đạt** |
| `a11y-scan.mjs --strict` (`.logs/a11y-final.log`) | **320 trang, 0 phát hiện** (tương phản, tên, nhãn, vùng chạm 44 px, alt, id, h1). Lần đầu sau đổi màu có 138 trang lỗi tương phản (chữ trắng cứng trên nhãn ngày): **đã sửa** |
| `contrast.mjs` app | **106 phép tính, 0 lỗi** |
| `contrast.mjs` thư viện thành phần | **122 phép tính, 0 lỗi** |
| Taste `--app` | màn chính **5 FAIL, 5 WARN**, đều thuộc nhóm đã giữ ở DR-009 / DR-013 (lý do ở `decisions.md` §4); màn giới thiệu: 2 FAIL (gradient nền trời DR-009, nút gradient DR-013), 3 WARN |
| Phản biện độc lập | `wander-product-analyst` ×2 và `wander-skeptic-qa` ×1 (3 lượt, trong ngân sách 6): đã sửa các phát hiện Tầng B/C (chữ nội bộ lọt ra màn, "kiểu chuyến đi" trộn vào "phong cách", lời hứa không có cơ chế, xuất lịch cho chuyến chưa chắc ngày, quyền gỡ thành viên, focus, ngày giả lập dùng chung); **phần Tầng A còn lại là các câu ở mục 4** |

## 4. Anh cần chọn (Tầng A) — xem `docs/ux/po-questions.md` mục F và `docs/decisions/DR-014-…-DU-THAO.md`
1. **F1 Phiên hết hạn khi chưa có mã:** (a) phiên trượt, không hết hạn (khuyến nghị) · (b) phải lưu mã trước · (c) cho hết hạn, chấp nhận mất. *Hiện màn hết phiên nhánh B gắn nhãn "chờ PO quyết".*
2. **F2 "Ai đi" và "Sở thích":** (a) chỉ làm quen, không lưu (khuyến nghị tới khi quyết) · (b) thuộc tính chuyến mới (đổi schema) · (c) gộp vào "phong cách".
3. **F3 Ai gỡ thành viên:** (a) chỉ người tạo (khuyến nghị) · (b) thành viên gửi đề nghị. *(1b)*
4. **Cụm khung dựng thêm ngoài DR-012** (S18, A4, A5, G8, S19–S21): giữ làm khung hay cắt? Agent rà khuyến nghị giữ S19–S21, cắt S18/A4/A5, để G8 sang 1b.
5. **Ảnh tham chiếu mà em chưa dựng:** nhập từ Instagram/TikTok/Maps, Passport, Trip Ideas, AI tạo lịch, thời tiết, ảnh bìa/mô tả/quyền xem chuyến. Muốn dựng cái nào thì nói.
6. Còn mở từ trước: A3, B2/B3/B4/E1, Q-d, Q6–Q9, Q12, OQ-1.

## 5. Còn yếu / chưa kiểm (nói thẳng)
- Vẫn là Chrome headless; **chưa kiểm** trình đọc màn hình, thiết bị thật, chữ phóng 200%, Firefox/Safari (RG-7).
- Mọi thứ lưu trong `localStorage`; "máy chủ", danh tính, mã khôi phục, giả lập ngày/hết phiên/lỗi đều giả.
- **Màu "sặc sỡ":** để đạt AA, vàng sáng không làm được huy hiệu loại/màu ngày trên thẻ trắng (cần ≥ 3:1), nên màu loại ẩm thực và màu ngày đậm hơn mẫu pastel của Roameo. Bản đồ trong chuyến vẫn xanh lá/xanh dương cũ (vẽ cứng). Thẻ pastel nhiều màu, nền kính, biểu tượng 3D (vòng 2 táo bạo) **chưa làm**, đợi anh nói.
- Mã lỗi đọc từ chuỗi trong mã backend; **ánh xạ HTTP status chưa đối chiếu** (`UNVERIFIED`).
- Hôm nay: theo múi giờ thiết bị; chưa xử lý mục qua nửa đêm; khoảng cách là đường chim bay ×1,5 (ước tính).
- Wizard chưa có ca test "người mới chưa có danh tính", "tên trùng", "chuyến 1 ngày / 366 ngày"; xem phản biện skeptic.
- Taste chưa chạy riêng cho từng màn mới (chỉ màn chính và màn giới thiệu).

## 6. Công cụ đã dùng
Kỹ năng gọi thật: `wander-design`, `spec-driven-development`, `planning-and-task-breakdown`, `ui-ux-pro-max` (không có Python nên tra CSV bằng Grep: tìm ra dòng "Travel/Tourism: xanh trời + cam"). Tác tử: 3 agent màu (`general-purpose`, mỗi hướng một agent), `wander-product-analyst` ×2, `wander-skeptic-qa` ×1. Công cụ: playwright (luồng, ảnh, quét), `contrast.mjs`, `a11y-scan.mjs`, Taste `inspect.mjs`, `sample-colors.mjs` (đo màu 50 ảnh tham chiếu), `palette-shots.mjs`. Không gọi `systematic-debugging` như kỹ năng (sửa lỗi bằng đọc lỗi thật từng bước). `code-review-graph`: không dùng (không có mã backend/web thật đổi). RTK: `rtk gain` đọc cuối lượt (toàn cục): 337 lệnh, tiết kiệm 46,6K token (53,5%).
**Không gọi được:** `/wander-feature` (chỉ PO gõ).
