# DR-023 — PO phản hồi 28/10/2026: dữ liệu địa điểm, bản đồ, giao diện, thẻ khám phá

- **Trạng thái:** `APPROVED` theo lời PO ở dưới; phần bản đồ chờ thử nghiệm (spike) rồi mới ghi ADR.
- **Liên quan:** ADR-009 (nguồn địa điểm miễn phí), ADR-010 (module catalog, dữ liệu là tệp JSON trong repo), DR-009/DR-013 (nhận diện giao diện đã duyệt).

## PO nói gì (phản hồi 28/10/2026, tóm tắt)
1. Nhấn tab/thẻ khám phá nên sang thẻ mới hoặc có cách "next ảnh".
2. Phần "Lưu … địa điểm thành chuyến đi": mỗi hành động có một hiệu ứng, nhìn rối mắt.
3. Bản đồ: zoom lag; zoom thì ghim như bị tính lại; chuyển Ngày 1/Ngày 2 thì bản đồ bị đưa về khung ban đầu thay vì giữ chỗ vừa zoom; có ghim hiện số "2".
4. Dữ liệu backend quá ít: cần 10–20 nơi cho Đà Lạt, Tà Xùa, Nha Trang, Đà Nẵng, Hội An, Huế, Quy Nhơn, Phú Yên, Vĩnh Hy, TP.HCM, Hà Nội…, miễn phí, ảnh sinh động, có đánh giá sao nếu được; bấm tìm kiếm thì hiện bản đồ Việt Nam rồi bay tới điểm vừa nhập sau khoảng 1 giây. Hỏi: dữ liệu đang lưu ở DB à? Đây là việc ưu tiên nhất.
5. Giao diện chưa đẹp bằng Roameo: font, icon, nút kính mờ sáng bóng, ít phải cuộn; muốn tiệm cận và học thêm tính năng từ `docs/UI-sample-2`.

## PO chọn (AskUserQuestion, 28/10/2026)
| Câu hỏi | Lựa chọn của PO |
|---|---|
| Nguồn dữ liệu và đánh giá | "Bán tự động từ nguồn mở, chưa có sao" — sau khi yêu cầu tra thật kỹ mọi cách trước khi trả lời |
| Công nghệ bản đồ | "MapLibre + OpenFreeMap + hillshade AWS" — sau khi yêu cầu tìm giải pháp có sẵn thay vì tự dựng |
| Mức đổi giao diện | "Làm trước bộ token: font, icon, nút kính mờ; sau đó áp từng màn" |
| Nút tab ở thẻ khám phá | "Chạm nửa phải/trái ảnh để sang ảnh sau/trước, nút riêng để sang thẻ mới" |

## Đã kiểm chứng khi tra cứu (28/10/2026)
- Thử Overpass quanh Đà Lạt: 84 đối tượng du lịch, 53 có tên, **chỉ 4 có `wikidata`, 2 có ảnh, 0 có điểm sao**. Dữ liệu OSM một mình không đủ làm thẻ có ảnh và mô tả; cần Wikipedia/Wikidata/Commons và biên tập.
- Google Places: trang chính sách chính thức cho lưu `place_id` vô thời hạn; lat/lng, điểm sao, ảnh, review **không được lưu**, hiển thị trên bản đồ phải dùng Google Map và kèm logo Google. Foursquare: tài liệu cấm lưu phần lớn trường; gói miễn phí các nguồn nói khác nhau (`UNVERIFIED`). Không có bộ dữ liệu mở nào vừa miễn phí, vừa hợp pháp, vừa có điểm sao cho địa điểm Việt Nam.
- Không cào (scrape) Google Maps hay TripAdvisor: vi phạm điều khoản; dữ liệu cào không dùng hợp pháp được.
- OpenFreeMap: dùng thương mại được, không khóa API, không giới hạn lượt xem/yêu cầu trên máy chủ công cộng, **không có SLA**, phải ghi công OSM (trang chính thức openfreemap.org). MapLibre GL là BSD-3.

## Quyết định thực hiện
1. **Dữ liệu:** dựng bằng `tools/catalog/build-catalog.mjs` từ seed biên tập (`tools/catalog/seeds/*.mjs`) + Wikipedia tiếng Việt, Wikidata, Wikimedia Commons. Chỉ nhận ảnh JPEG giấy phép CC BY / CC BY-SA / CC0 / Public domain, ghi tác giả, giấy phép, liên kết gốc. Mọi nội dung biên tập (lời dẫn, nhãn "nên đi", mẹo, mùa) là **bản nháp chờ PO duyệt**. Chưa có điểm sao.
2. **Chỗ lưu:** giữ ADR-010 (tệp JSON và ảnh trong `backend/src/main/resources/catalog/`, nạp lúc khởi động, kiểm tra ngay) thay vì chuyển sang bảng DB. Lý do: thêm điểm đến không cần migration; PO duyệt được bằng diff git; chuyển sang DB hợp lý khi có cổng admin. (Tôi đã gợi ý "lưu vào DB (V16)" trước khi đối chiếu ADR-010; đó là gợi ý sai so với ADR đã duyệt. PO có thể yêu cầu chuyển, việc này vẫn Tầng A.)
3. **Bản đồ:** thử nhỏ MapLibre GL + OpenFreeMap + hillshade từ ô độ cao AWS Terrain, đo kích thước gói và độ mượt, rồi ghi ADR trước khi thay bản đồ tự dựng.
4. **Giao diện:** đổi token (font, icon, nút kính mờ) trước, ghi DR riêng về font/icon cụ thể khi chọn xong; giữ bảng màu Nắng vàng đã duyệt (DR-013).
5. **Thẻ khám phá:** chạm nửa trái/phải ảnh để chuyển ảnh; nút riêng sang thẻ mới.

## Còn mở
- Điểm sao: chưa có nguồn hợp lệ; chỉ làm sao do người dùng Wander chấm sau này (cần quyết định riêng).
- Hạ tầng tile bản đồ: OpenFreeMap công cộng không có SLA; tự host (PMTiles) hoãn tới khi có hạ tầng.
- Ảnh và mô tả của Tà Xùa, một số địa điểm nhỏ: dữ liệu mở rất thưa, cần PO hoặc người biên tập bổ sung thủ công.
