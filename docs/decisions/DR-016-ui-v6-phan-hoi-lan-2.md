# DR-016 — Vòng giao diện v6 (PO 26/10/2026, lần 2): màu tươi, bố cục, animation, thẻ quẹt toàn màn, bản đồ, ngày đỡ rối

- **Trạng thái:** `APPROVED` cho các câu PO viết thành yêu cầu (cột "Lời PO"); **bộ màu cuối cùng: CHỜ PO chọn** bằng `docs/ux/screenshots/palette/compare.html`; các câu Tầng A mới ở cuối tệp.
- **Liên quan:** DR-013 (Nắng vàng, **bị PO thấy "già, thiếu sức sống"**), DR-015, `docs/ux/research-ui-2026-10-26.md`, `docs/architecture/map-options.md`.
- **Phạm vi do PO đặt:** "tập trung hết vào phần UI ở phase này … chấp nhận làm lâu nhưng phải chất lượng"; backend và `web/` không đụng.

## Quyết định (lời PO → việc đã làm)
| # | Lời PO (rút gọn) | Việc |
|---|---|---|
| 1 | "Màu sắc quá già và thiếu sức sống" | Ba hướng màu tươi dựng sẵn bằng token (Biển sớm / Nhiệt đới / Hoàng hôn), đặt vào đúng bố cục mới; so cạnh nhau ở `compare.html`. Mọi bộ đạt AA (`check-palette.mjs`). **Chờ PO chọn một** |
| 2 | "Bố cục chưa hoàn thiện bắt mắt, thiếu animation, kể cả câu hook và template" | Làm lại trang chủ, trang Hà Giang, thẻ quẹt, chuyến đi, giới thiệu; kho chuyển động (liệt kê ở research §3); hook đổi luân phiên và tiêu đề hiện từng chữ; **lịch mẫu** (3 lịch ghép từ nơi có thật, nhãn bản nháp, "Dùng lịch này" tạo chuyến) |
| 3 | "Phần quẹt: hình mỗi item làm nền, nút và chữ đè lên cũng được, hình nhỏ quá" | Thẻ toàn màn: ảnh là nền cả màn (điện thoại), nền mờ theo ảnh + thẻ dọc lớn (máy tính); tiêu đề, chip, nút nổi đè lên ảnh; dấu ✓/✕ bóng kính; thẻ sau lớn dần khi kéo |
| 4 | "Chọn ngày cho địa điểm vẫn quá nhiều màu, rối nếu chuyến nhiều ngày" | Mọi ngày dùng **một màu nhấn**; chip "Ngày n" trung tính, tab ngày là viên thuốc; trên bản đồ chỉ tuyến ngày đang xem sáng, mục khác mờ; số ngày luôn ghi bằng chữ |
| 5 | "Nghiên cứu kĩ phần map, khá đơn điệu" | Bản đồ địa hình riêng từ độ cao và đường sá thật (AWS Terrain Tiles + OpenStreetMap), camera bay, ghim ảnh, tuyến vẽ dần, gộp cụm, tờ kéo 3 nấc; nghiên cứu phương án sản phẩm thật ở `map-options.md` (**AD-14 chờ PO**) |
| 6 | "Có thể download hoặc browser để tiếp cận kiến thức, demo bằng hình nếu ít tốn kém" | Đã tra web (xu hướng, bản đồ, thẻ quẹt) và dữ liệu thật; chọn **so sánh bằng ảnh** cho màu (token là nguồn duy nhất nên đổi bộ màu rất rẻ) và **áp thẳng** cho bố cục/animation |

## Phương án đã cân nhắc (vì sao không chọn)
- **Thư viện bản đồ (MapLibre/Mapbox/Google) ngay:** thêm dependency + chi phí/khóa API, chưa cần cho thiết kế; để AD-14.
- **Một bộ màu duy nhất em tự chọn:** PO đã nói muốn xem hình để duyệt, và gu màu là chỗ PO phản hồi mạnh nhất.
- **Mỗi ngày một màu nhưng nhạt hơn:** vẫn rối khi chuyến dài; PO muốn bớt màu.
- **Điểm sao/đánh giá trong chi tiết:** vẫn chưa có nguồn dữ liệu, không bịa (G1).

## Tầng A đang chờ PO (mới)
1. **Chọn bộ màu** (A "Biển sớm", B "Nhiệt đới", C "Hoàng hôn", hay giữ "hien-tai" cũ): xem `compare.html`. Em khuyến nghị A hoặc B (không phải quyết định).
2. **AD-14 Bản đồ sản phẩm thật** (`map-options.md`): giữ bản đồ riêng tới hết Lát 1a (khuyến nghị) / MapLibre + OpenFreeMap / MapLibre + PMTiles trên S3 / Mapbox hoặc Google.
3. **N-2 "Lịch mẫu" (Trip Ideas):** prototype có 3 lịch bản nháp để cho thấy ý tưởng; có đưa vào phạm vi thật không, ai biên tập, bao nhiêu lịch.
4. Còn mở từ trước: G1 (đánh giá), G2 (bước "Bạn mê gì?"), G3 (công cụ ép chuẩn FE), G4, G5 (F1 và xác thực lại khi chưa có mã), F1–F4, A3, B2–B4, E1, Q-d, Q6–Q9, Q12.
