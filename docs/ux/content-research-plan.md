# Kế hoạch nghiên cứu nội dung và UX/UI — "quẹt để khám phá địa danh"

> Trạng thái: **bản nháp để PO duyệt** (24/10/2026). Chưa phải quyết định. Master plan v0.4 không đổi.
> Bối cảnh: PO muốn tính năng lõi là quẹt phải để chọn địa điểm và khám phá hồ sơ địa danh, hướng gần với Roameo; hiện chưa có nội dung. Plan hiện chỉ có nhánh prototype swipe (D7 ✅, §11.3), swipe/vote trong một khung giờ ở Lát 2, gợi ý/địa điểm ở Lát 3 (Q15 ❓). Cổng admin chưa có trong plan.
> Prototype: https://claude.ai/artifact/8jnJ1egNKcrBDFNu1zQL6a (dữ liệu mẫu, riêng tư, không thuộc codebase).

> **Cập nhật 24/10/2026:** phân tích Roameo đầy đủ hơn và tầm nhìn đã làm rõ của PO (tìm điểm đến → thẻ nhiều ảnh → giỏ → lưu thành lịch trình → chia sẻ nhóm → cổng admin) nằm ở [`roameo-analysis.md`](roameo-analysis.md). Số liệu đánh giá bên dưới là lần tra đầu, thay đổi theo thời điểm.

## 1. Roameo — những gì tra được (chưa kiểm chứng độc lập)

Nguồn là mô tả của chính hãng, trang cửa hàng ứng dụng và một bài phỏng vấn; không có đánh giá độc lập. Ghi lại để so sánh, không sao chép thương hiệu hay giao diện.

| Điểm | Nội dung | Nguồn |
|---|---|---|
| Cơ chế lõi | Quẹt kiểu Tinder trên các địa điểm đã chọn lọc để cả nhóm đồng thuận | [PhocusWire](https://www.phocuswire.com/interviews/startups/startup-stage-roameo-targets-group-travel-planning-swipe-match-interface), [Google Play](https://play.google.com/store/apps/details?id=com.roameo.app&hl=en) |
| Đầu ra | Từ các "match" của nhóm, tạo lịch trình theo ngày, tối ưu tuyến, kèm liên kết đặt chỗ (Klook, Trip.com, Agoda) | [App Store](https://apps.apple.com/us/app/roameo-ai-trip-planner/id6748898199), [roameoai.com](https://www.roameoai.com/) |
| Nhập cảm hứng | Nhập bài đã lưu từ Instagram, TikTok, Xiaohongshu | App Store |
| Cập nhật sau | Kéo-thả địa điểm vào ngày; hiển thị phiếu bầu của từng thành viên | Google Play |
| Dùng một mình | Có, nhưng thiết kế trước hết cho nhóm | Similarweb |
| Đánh giá | App Store 3,8/5 (10 lượt); Google Play 4,3/5 (2.024 lượt, theo AppBrain). Có phản hồi "quẹt không làm gì", nhà phát triển trả lời đã sửa | App Store, AppBrain |

Số liệu "5.0" và "2.000+ chuyến" trên website là tự công bố. Roame.io là sản phẩm khác, không nhầm.

**Bài học cho Wander (giả thuyết cần kiểm chứng):** (a) quẹt chỉ có ý nghĩa nếu thẻ **có sức hút thị giác và đủ thông tin để quyết định**; (b) giá trị nằm ở bước sau quẹt (nhóm khớp, ra lịch); (c) nội dung và ảnh là nút thắt, không phải mã.

## 2. Wander khác gì (đề xuất để PO xác nhận)

- Tiếng Việt, du lịch trong nước trước (Hà Giang, Sa Pa, Ninh Bình, Hội An...), người dùng đã có lõi lập kế hoạch cá nhân (Lát 1a) — **quẹt đổ vào lịch chuyến**, không tạo lịch tách rời.
- Hồ sơ địa danh có "nên đi tháng nào", chi phí tham khảo theo ngày, "nên làm", "cần biết" (đã có trong prototype, dữ liệu mẫu).
- Cổng admin để biên tập hồ sơ (mục 5).

## 3. Câu hỏi nghiên cứu nội dung

| # | Câu hỏi | Cách tìm câu trả lời | Đầu ra |
|---|---|---|---|
| R1 | Nguồn nội dung nào dùng được hợp pháp và đủ chất lượng cho ~100 địa danh đầu tiên? | So sánh: tự viết/biên tập; Wikivoyage (giấy phép CC BY-SA, cần ghi nguồn và chia sẻ tương tự); OpenStreetMap (ODbL, cho tọa độ/tên); Wikimedia Commons (giấy phép từng ảnh khác nhau); API địa điểm thương mại (điều khoản lưu trữ/hiển thị **cần đọc lại bản hiện hành, UNVERIFIED**); cộng tác viên | Bảng so sánh: chất lượng, giấy phép, chi phí, giới hạn lưu trữ, rủi ro |
| R2 | Ảnh lấy ở đâu để đẹp mà không vi phạm bản quyền? | Ảnh tự chụp / mua / ảnh cấp phép mở; quy trình ghi tác giả và giấy phép cho mỗi ảnh | Chính sách ảnh + trường nguồn/giấy phép trong dữ liệu |
| R3 | Một hồ sơ địa danh cần những trường nào để người ta quẹt được? | Thử 10 thẻ với 5–8 người dùng mục tiêu (thẻ giấy hoặc prototype), hỏi "thiếu gì để quyết?" | Lược đồ hồ sơ (vùng, mùa, chi phí, hoạt động, lưu ý, ảnh, tọa độ, độ tin cậy) |
| R4 | Dữ liệu "mùa nên đi", "chi phí" lấy từ đâu và tươi bao lâu? | Nguồn chính thức (khí tượng, cơ quan du lịch), khảo sát giá thực tế, ngày kiểm tra gần nhất | Trường `kiểm_tra_lần_cuối`, quy tắc làm mới |
| R5 | AI có được dùng để soạn nháp hồ sơ không? | Thử soạn 10 hồ sơ, đối chiếu từng khẳng định với nguồn, đo tỉ lệ sai | Quy trình: AI chỉ soạn nháp, người duyệt từng khẳng định, bắt buộc có nguồn |
| R6 | Thuật ngữ và cách gọi tên địa danh (dấu, tên cũ/mới, vùng)? | Chuẩn hóa theo nguồn địa danh chính thức | Bảng tên chuẩn + bí danh để tìm kiếm |
| R7 | Người dùng tự thêm địa danh (như "gõ địa điểm" ở D14) hay chỉ chọn từ kho? | Phỏng vấn + xem Roameo/đối thủ | Quyết định phạm vi, liên hệ D14 |
| R8 | Thẻ nên sắp theo gì (gần, mùa, sở thích)? Quẹt xong đi đâu? | Thử với prototype, quan sát | Quy tắc xếp thẻ ban đầu (không cần thuật toán thông minh) |

Ràng buộc: không bịa số liệu, giá hay ảnh; mọi khẳng định trong hồ sơ phải truy được nguồn; giấy phép nào không rõ thì không dùng.

## 4. Kế hoạch UX/UI (không viết code ứng dụng trước khi duyệt)

1. **Prototype quẹt** (đã dựng, mục đầu tệp): thử cảm giác quẹt, hồ sơ, khớp nhóm, xếp lịch. PO dùng và cho phản hồi.
2. **Vòng lõi và luồng người dùng:** khám phá → quẹt → danh sách → khớp nhóm → xếp lịch; trạng thái rỗng, hết thẻ, hoàn tác (D19).
3. **Wireframe điện thoại** cho từng màn; hướng thị giác (màu, chữ, ảnh, chuyển động); design tokens.
4. **Chọn thư viện giao diện sau khi có thiết kế** (không chọn trước): Tier A vì thêm dependency.
5. **Đo bằng quan sát** theo plan §11.3 (vòng 1 bình chọn thủ công, vòng 2 tương tác), không coi là cam kết triển khai vote.

## 5. Cổng admin (đề xuất yêu cầu, chưa có trong plan)

- Người dùng: chỉ PO (và người được mời) — đây là **bề mặt xác thực thứ hai**, khác danh tính ẩn danh của người đi du lịch (Q16): cần thiết kế riêng (Tier A, bảo mật).
- Việc cần làm: tạo/sửa/ẩn hồ sơ; nháp → duyệt → xuất bản; ảnh kèm tác giả và giấy phép; nguồn cho từng khẳng định; nhập/xuất CSV; kiểm tra "lần kiểm cuối" quá hạn.
- Lưu trữ ảnh: kho đối tượng (S3 khi lên AWS, ADR-006) — chi phí chưa tính (`UNVERIFIED`).
- Có thể bắt đầu bằng **tệp dữ liệu có phiên bản trong repo** (YAML/JSON) cho ~20 hồ sơ đầu, chưa cần cổng admin; làm cổng admin khi số hồ sơ và người biên tập tăng.

## 6. Thứ tự đề xuất

1. PO thử prototype, phản hồi (cảm giác quẹt, thẻ, hồ sơ).
2. R1–R3 song song với thiết kế wireframe; chốt lược đồ hồ sơ và nguồn nội dung đầu tiên.
3. Soạn 20 hồ sơ thật (R5 quy trình) và thử lại với người dùng.
4. Quyết định Tier A: nguồn dữ liệu (Q15), phạm vi cổng admin, quẹt cá nhân hay theo nhóm ở giai đoạn đầu, thư viện giao diện.
5. Ghi quyết định vào `docs/decisions/` (DR) trước khi viết code.

## 7. Cần PO quyết (Tier A)

- Phạm vi thay đổi: đưa "khám phá địa danh bằng quẹt" thành lõi sản phẩm (ảnh hưởng thứ tự Lát 2/3, Q10; ảnh hưởng D8 "gợi ý ở Lát 3").
- Nguồn nội dung đầu tiên (Q15) và ai viết/biên tập.
- Cổng admin: có làm, khi nào, và dùng cơ chế xác thực nào.
