# Thử nguồn địa điểm ăn/uống và ảnh Đà Lạt — 29/10/2026

Đã thu thập dữ liệu thực tế và tạo [bảng xem ảnh](index.html). Chỉ là khảo sát; chưa nhập catalog hay DB chính, chưa thay schema hay app. Không scrape Google, không dùng API trả phí, không sinh ảnh/rating bằng AI.

## Độ phủ dữ liệu

Một truy vấn Overpass lấy đối tượng node/way/relation có amenity restaurant/cafe/fast_food/bar/pub/ice_cream trong bbox **11.88,108.36 → 12.02,108.53**. Đây là vùng hình chữ nhật chọn để khảo sát, không phải ranh giới hành chính toàn Đà Lạt; bao gồm vùng ngoài trung tâm, có thể thiếu vùng ngoại ô khác. Tọa độ polygon là center, không phải cửa vào.

| Trường | Số đối tượng |
|---|---:|
| Tổng ăn/uống | 817 |
| Nhà hàng | 399 |
| Cà phê | 331 |
| Fast food / bar / pub / kem | 54 / 28 / 1 / 4 |
| Có tên | 631 |
| Có ít nhất một tag địa chỉ | 275 |
| Có giờ mở cửa | 111 |
| Có điện thoại | 115 |
| Có website/contact:website | 27 |
| Có image/wikimedia_commons | 0 |
| Có Wikidata ID | 0 |

Đếm đối tượng OSM, **chưa khử trùng thành từng quán**; trường địa chỉ không có nghĩa địa chỉ đầy đủ. Ví dụ OSM có Café Tùng và Tùng Coffee gần nhau; không tự gộp hai node. Nguồn, thời điểm OSM và toàn bộ tags ở [pois.json](pois.json), số liệu ở [coverage.json](coverage.json). Chưa kiểm chứng quán còn hoạt động, giờ/điện thoại còn đúng hay độ chính xác thực địa.

## Ảnh: kết quả thực tế

Khảo sát bốn danh mục Commons (Cafés in Da Lat, Café Tùng, Le Café de la Poste, WoodStock Coffee), cộng tìm kiếm tổng quát và mẫu 12 tên quán OSM. Sau lọc metadata còn **116 ảnh ứng viên duy nhất**, không phải 116 quán. Tải **18 ảnh mẫu** đa dạng nhóm để xem; các vòng tuyển mẫu dùng lại cache metadata. Commons từng trả 429: đã tăng khoảng nghỉ và áp dụng cooldown tối thiểu 60 giây, không tăng concurrency.

Ảnh đạt bộ lọc: JPEG/PNG/WebP, ảnh gốc rộng ≥1.400 px và cao ≥800 px; metadata giấy phép CC BY/CC BY-SA/CC0/Public Domain rõ ràng, có tác giả. Mẫu tải là ảnh preview khoảng 1.200 px; metadata giữ URL gốc, kích thước, tác giả, credit và giấy phép. Ngưỡng kích thước không bảo đảm đẹp, đúng quán hoặc cập nhật.

Đã xem bảng ảnh thực tế; mở riêng ảnh Là Việt, Le Café de la Poste 04 và bốn ảnh nội thất WoodStock để đánh giá. Đề xuất bốn ảnh trong [curation.json](curation.json):

| Quán | Đánh giá ảnh | Ghép vị trí |
|---|---|---|
| WoodStock Coffee | Ảnh nội thất gỗ (10) rõ không gian và có chiều sâu; (7) dùng bổ sung. Ảnh dọc, một số vùng sáng gắt | Có node tên “Wood stock”; **chưa xác minh cùng cơ sở** |
| Le Café de la Poste | Ảnh 04: kiến trúc vàng, ô đỏ và cây xanh; ứng viên bìa ngang tốt nhất trong mẫu | Chưa tìm thấy OSM khớp; không tự thêm tọa độ |
| Là Việt Coffee | Morning Break có mô tả nguồn ghi đúng La Viet Coffee, Đà Lạt; đẹp về ánh sáng/màu, dùng chi tiết đồ uống; có giày làm đạo cụ | Có OSM La Viet Coffee; ghép tên/mô tả là ứng viên, chưa xác minh hiện trạng |

Các ví dụ không chọn: Café Tùng ảnh quá tối/ảnh mặt tiền nhiều xe; cận đồ trang trí WoodStock không thể hiện không gian; một ảnh Hong Kong lọt tìm kiếm “Cafe Tung” đã bị loại. Không dùng ảnh ly cà phê bất kỳ cho một quán. Không suy diễn điểm đánh giá từ độ đẹp của ảnh.

Danh mục 116 ảnh chưa được review hết. Bốn ảnh được tuyển là **khuyến nghị chất lượng thị giác**, không phải PO duyệt catalog, không xác nhận địa điểm hiện mở hay hoàn tất thẩm tra mọi quyền liên quan. Ảnh WoodStock mang năm 2022 trong tên tệp; một số ảnh Commons khác cũ hơn. Attribution của mỗi ảnh ở [photo-candidates.json](photo-candidates.json) và thẻ ảnh trong HTML. Chưa chỉnh sửa ảnh tải về.

## Hướng nên dùng cho Wander

**Tách hai lớp**: tập POI rộng từ OSM để tìm/định vị; tập địa điểm có ảnh đã tuyển cho Discover. Không loại POI chỉ vì thiếu ảnh. Discover chỉ đưa lên những địa điểm có ảnh đúng quán, đạt chất lượng và đã kiểm tra liên kết vị trí. Quán thiếu ảnh cần nguồn chủ quán/người dùng có quyền sử dụng, thay vì ghép ảnh đại diện sai.

Ưu tiên (1) ảnh không gian/mặt tiền đúng quán, (2) ảnh món/chi tiết có nguồn rõ, (3) độ phân giải, bố cục, ánh sáng, khả năng crop, (4) độ mới. Giữ provenance và license từng ảnh, không chỉ URL ảnh.

Nếu mở rộng khảo sát, cần khử trùng/ghép tên + tọa độ + địa chỉ; giữ trạng thái chưa xác minh cho các ghép gần giống. Không bật crawler tự chạy toàn Việt Nam từ bản thử này. Chưa cần quyết định dependency hay nguồn trả phí để hoàn thành thử nghiệm. Đưa luồng mới vào sản phẩm/schema là bước riêng sau đánh giá kết quả.

## Chạy lại

```powershell
node tools/catalog/probe-dalat-pois.mjs
node tools/catalog/render-dalat-trial.mjs
```

Cache request ở `.logs/da-lat-poi-trial/`; chạy lại mặc định dùng snapshot cache, không phải cập nhật trực tiếp. Artifact ảnh không còn trong mẫu được chuyển vào cache unused-photos, không xóa catalog hiện có. HTML đã mở bằng Edge headless và kiểm tra ảnh tải được; bản xem tĩnh ở [preview.jpg](preview.jpg). Đây là chạy thử dữ liệu và kiểm tra hiển thị, không phải test app/backend.

## Nguồn và quyền sử dụng

- [OSM](https://www.openstreetmap.org/copyright): ODbL, attribution © OpenStreetMap contributors; dữ liệu miễn phí không đồng nghĩa endpoint công cộng không giới hạn.
- [Overpass usage](https://dev.overpass-api.de/overpass-doc/en/preface/commons.html): truy vấn public có giới hạn; thử nghiệm dùng một truy vấn bbox có cache.
- [Commons ảnh quán Đà Lạt](https://commons.wikimedia.org/wiki/Category:Caf%C3%A9s_in_Da_Lat): tuyển theo danh mục cụ thể, không coi mọi ảnh trong danh mục là ảnh bìa phù hợp.
- [Commons reuse](https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia), [Imageinfo API](https://www.mediawiki.org/wiki/API:Imageinfo): cần theo giấy phép và attribution từng tệp. Metadata có thể thiếu hoặc sai, nên vẫn giữ trang nguồn để kiểm tra.
