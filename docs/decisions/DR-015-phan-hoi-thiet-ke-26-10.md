# DR-015 — Phản hồi thiết kế của PO 26/10/2026: một bộ màu, onboarding và trang chủ có cảm hứng, thẻ quẹt không bị chữ đè, "để sau" đi tiếp, chuẩn mã FE

- **Trạng thái:** `APPROVED` cho các câu PO viết thành yêu cầu (bảng dưới, cột "Lời PO"); phần em tự chọn chi tiết ghi `DEFAULTED` ở `docs/implementation/decisions.md` §4; phần còn mở xếp vào **Tầng A đang chờ** cuối tệp.
- **Liên quan:** DR-009 (hướng lai), DR-013 (bộ màu Nắng vàng), D26 (bỏ qua mã có cảnh báo), DR-012/DR-014 (DG-2).
- **Báo cáo kèm ảnh:** `docs/ux/PO-FEEDBACK-2026-10-26.md`. Chuẩn mã: `docs/architecture/frontend-standards.md`.

## Quyết định (lời PO → việc đã làm)
| # | Lời PO (rút gọn) | Quyết định / việc |
|---|---|---|
| 1 | "Một bộ màu nhận diện thương hiệu, tái sử dụng toàn hệ thống; ưu tiên light, nền tối để sau" | `docs/ux/prototype/tokens.css` là nguồn màu DUY NHẤT (4 họ + 2 màu trạng thái); loại địa điểm không còn màu riêng; ngày xoay 3 màu thương hiệu; "chờ duyệt" dùng họ trời xanh (bỏ tím); bản đồ cùng bộ. Tối: giữ khung, chưa tinh chỉnh |
| 2 | "Chỉnh chu phần web nhưng đánh mạnh vào mobile" | Mọi màn làm lại kiểm ở 390 trước, 1280 sau |
| 3 | Onboarding chưa wow, hook chưa đủ giữ chân | 3 cảnh làm lại: (1) ảnh thật + ba sự thật từ kho biên tập + máy bay lướt qua; (2) **bộ bài mẫu tự quẹt** có bộ đếm "Đã chọn"; (3) **lịch mẫu tự xếp** 2 ngày × 2 nơi. Tiêu đề hiện từng chữ; mọi chuyển động tắt khi giảm chuyển động |
| 4 | Trang chủ 6/10, đơn điệu, ít animation | Thêm: thẻ giữa của quạt đổi ảnh luân phiên, nhãn "ghim" nổi, dải tên nơi chạy ngang, "Bạn đang mê gì?" (chọn loại → quẹt riêng loại đó), "Nên đi tháng này" cuộn ngang, ảnh lớn có chuyển động chậm, hiện dần khi cuộn |
| 5 | Trang Hà Giang: nửa trang là ảnh trống, không ăn nhập nội dung | Bìa gọn (250 px), lấy nét vào ruộng bậc thang (cắt trời trống), có vùng/khẩu hiệu từ kho biên tập; thêm 3 số nhanh và dải "Xem trước các nơi" nối bìa với cẩm nang |
| 6 | Thẻ quẹt nhỏ, bất đối xứng, chữ đè hết ảnh | Thẻ = ảnh (nửa trên, KHÔNG chữ đè) + khối thông tin trắng bên dưới (tên, vùng, 3 chip, 1–2 dòng); ở máy tính rộng hơn ~70% (304 → 520 px); chồng thẻ đối xứng |
| 7 | Chi tiết: thêm đánh giá/thông tin ngoài một đoạn dài | Nhận định "Wander gợi ý" lên đầu; lưới 6 thông tin nhanh (thời gian, độ khó, mùa đẹp, khoảng cách, xe máy, buổi nên đi); đoạn dài chuyển xuống cuối và thu gọn. **Điểm sao/đánh giá của người đi: CHƯA làm** (không có nguồn dữ liệu, không bịa) → Tầng A bên dưới |
| 8 | "Lưu địa điểm thành chuyến đi?": nền chói; bấm vào thì nền đen | Tờ phủ dùng cùng nền với màn quẹt (trời vàng → bơ), ô nhập trắng viền rõ (hết vàng chói); tấm mờ phía sau đổi từ đen sang nâu ấm nhạt + làm mờ |
| 9 | "Không muốn tạo danh tính/nhận mã → Để sau thì vẫn cho đi tiếp; chỉ cảnh báo 1 dòng nhẹ" | Đúng với D26. Trước đó "Để sau" ở tờ đầu **hủy** việc lưu; nay "Để sau, lưu chuyến đi luôn" lưu ngay, kèm MỘT dòng nhắc dưới nút ("…mất máy là mất chuyến đi và không lấy lại được…"), thông báo sau khi lưu, và một dòng nhắc còn lại ở đầu danh sách chuyến cho tới khi có mã; bỏ hộp xác nhận 2 bước. "Để sau" chỉ có ở lần lưu chuyến đầu tiên (không có ở Bảo mật/xác thực lại). Câu chữ cảnh báo là bản của em, **chưa được PO duyệt (DR-001 OQ-2)** |
| 10 | Chuẩn FE (SOLID, ACID, comment, tổ chức lại, không hard-code, tệp const, OOP, thành phần dùng lại) | Ghi thành `docs/architecture/frontend-standards.md` + `.claude/rules/frontend.md`; mã mới của prototype theo chuẩn; **chưa** viết lại `web/` hiện tại: em đề xuất đợi dựng lại từ prototype (PO nói FE làm ở pha sau) — **chờ G4, chưa chốt** |

## Phương án đã cân nhắc (vì sao không chọn)
- **Giữ 6 màu loại nhưng nhạt hơn:** vẫn nhiều sắc trên một màn; PO muốn ít màu và có bộ chuẩn.
- **Bỏ qua mã bằng cách tự tạo mã và lưu hộ:** vi phạm D20–D26 (Wander không lưu bản đọc được của mã).
- **Làm điểm sao thử:** bị cấm (không bịa dữ kiện hiển thị); cần quyết nguồn dữ liệu trước.
- **Viết lại 197 KB `app.js` của prototype theo chuẩn FE:** tốn lớn, phá luồng đã kiểm, và nó là tài liệu thiết kế sẽ bị thay.

## Hệ quả
- Ảnh chụp, luồng thử (F02, F08, F15…), quét truy cập đã cập nhật theo màn mới (số liệu ở báo cáo kèm).
- Tài liệu: `design-system.md` §2 viết lại; `frontend.md` mở rộng; `CLAUDE.md` có con trỏ tới chuẩn FE.

## Tầng A đang chờ PO (mới từ phản hồi này)
1. **G1 — Đánh giá của người đi / điểm sao ở trang chi tiết:** (a) chỉ nhận định biên tập "Wander gợi ý" như hiện nay (khuyến nghị tới khi có cộng đồng); (b) đánh giá của thành viên Wander sau Lát 1b (cần mô hình dữ liệu, kiểm duyệt, chống giả mạo); (c) nhúng điểm từ nguồn ngoài (Google Maps…) — cần giấy phép, chi phí, phụ thuộc bên thứ ba.
2. **G2 — Bước "Bạn mê gì?" trong onboarding** (chọn 3 sở thích để sắp thẻ phù hợp trước): tăng cam kết ban đầu nhưng chạm F2 (sở thích có lưu vào tài khoản/chuyến không). Khuyến nghị: làm sau khi F2 được quyết.
3. **G3 — Công cụ ép chuẩn FE** (§9 của chuẩn: eslint-plugin-jsdoc, stylelint, boundaries, size-limit…): thêm devDependency.
4. **G4 — Xác nhận cách hiểu "ACID" ở FE** (mục 6 chuẩn FE) và có viết lại `web/` hiện tại theo chuẩn ngay hay đợi dựng lại từ prototype (khuyến nghị: đợi).
5. **G5 — Hậu quả của "Để sau" cần chốt trước khi coi là xong (nêu bởi `wander-product-analyst`):** (a) **F1** (phiên của danh tính chưa có mã có hết hạn không) vẫn mở: nếu hết hạn thì một dòng nhắc nhẹ che mất việc mất vĩnh viễn; khuyến nghị F1(a) phiên trượt không hết hạn. (b) Danh tính **chưa có mã** xác thực lại để xóa vĩnh viễn/đổi mã bằng gì (D25)? Phương án: (i) buộc tạo mã trước khi xóa vĩnh viễn (khuyến nghị, giữ D20–D26) · (ii) cho xóa không cần xác thực lại. Prototype hiện chỉ có hộp "chưa thể xác thực lại" ở mức khung.
