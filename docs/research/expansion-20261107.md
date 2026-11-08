# Tuyển thêm nội dung — 07/11/2026

Tiếp nối kho 20 điểm đến, 253 thẻ, 40 thẻ ẩm thực, 413 tham chiếu ảnh địa điểm, 127 khoảnh khắc đã kiểm 06/11. Đợt này thêm **19 thẻ, 31 tham chiếu ảnh địa điểm và 26 khoảnh khắc**: tổng **272 / 444 / 153**, vẫn 40 thẻ ẩm thực. Không trộn 11.653 POI OSM phụ trợ với thẻ Discover đã biên tập.

## Căn cứ và cách tuyển

- Đọc trang nguồn từng ảnh Pexels cụ thể, lưu tác giả, vị trí được trang gốc mô tả, liên kết và [giấy phép Pexels](https://www.pexels.com/license/). Tải ảnh 1280 px, xem nguyên tỷ lệ trong ba contact sheet rồi mới append. Không tải hàng loạt kết quả search hay gắn một ảnh vùng cho quán/địa danh không xác định.
- 26 khoảnh khắc mới gồm chợ, phơi ngô, gốm, đèn lồng, trang phục, đi thuyền, chài lưới, bữa ăn và những khoảng nghỉ. Ba ảnh đã có trong kho được nhận diện theo URL nguồn nên không nhân đôi. Một ảnh chợ Đà Lạt quá tối bị loại. Chú thích ảnh Hà Giang được sửa từ ứng viên “dệt” thành **phơi ngô** sau khi xem ảnh.
- Địa danh dùng bài Wikipedia/Wikidata tương ứng, hoặc đúng đối tượng OSM đã đọc tên, loại và vùng. Ảnh Commons phải có giấy phép CC BY/BY-SA/CC0/Public domain hợp lệ và trang gốc. Loại ảnh ghép bảo tàng, bản sao P18/lead và ảnh Quảng Uyên không chứng minh trải nghiệm Phúc Sen. Không nhập các kết quả Nominatim như quán cà phê Hòn Chồng, bến xe Dốc Lết, phường Tự Lạn hoặc địa danh đồng tên ở tỉnh khác.
- 19 thẻ mới có mô tả ngắn, highlights và lưu ý riêng phục vụ quyết định. Giá, giờ mở cửa, độ khó và thời lượng chưa xác minh giữ trạng thái chưa biết. Ba Vì, Yên Tử, Hoàng Liên là ý tưởng trekking cần chốt tuyến, không phải GPX/đầu tuyến đã xác minh. Phá Tam Giang dùng mã `exp-*` để planner không tự coi tâm vùng phá là một điểm ghé/bến thuyền.

## Hồ sơ kiểm được

- `expansion-candidates-20261107.json`: bài nguồn, tọa độ, ảnh và chỉ số đã duyệt; các ứng viên không đủ căn cứ vẫn giữ ngoài app.
- `geocode-supplement-20261107.json`, `expansion-supplement-20261107.json`: kết quả vị trí và các ảnh bổ sung; chỉ bốn POI có ảnh đúng được nhập.
- `moment-candidates-20261107.json`: từng ảnh Pexels, tác giả, vị trí, quyết định và chú thích sau kiểm.
- `expansion-applied-20261107.json`: danh sách thẻ/khoảnh khắc của đợt này. Script chạy lại không tạo trùng.
- `catalog-enrichment-audit-20261107.json`: bảo toàn nội dung/bìa/khoảnh khắc cũ, ảnh cũ vẫn giữ nguyên thứ tự và chỉ append ảnh mới; kiểm giới hạn domain, tệp ảnh và liên kết.

Chủ đề đi chậm, văn hóa địa phương, hoạt động cùng bạn bè có thể tham khảo [Booking.com Travel Predictions 2027](https://news.booking.com/bookingcom-2027-travel-predictions-reveal-the-ultimate-travel-flex/) (công bố 14/10/2026; khảo sát toàn cầu tháng 7–8/2026). Đây là gợi ý định hướng trải nghiệm, không phải bảng điểm hot Việt Nam hoặc số liệu sử dụng Wander. App không gắn nhãn xu hướng thời gian thực khi chưa có dữ liệu.

## Phần còn thưa

Các nơi như Phong Nha, Tà Xùa, Cao Bằng vẫn ít thẻ hơn Hà Giang. Một số địa danh nhỏ thiếu ảnh mở hoặc tọa độ đủ tin cậy; các ứng viên được lưu để tiếp tục tuyển, không thêm thẻ rỗng hàng loạt chỉ để tăng số. Google reviews và giờ/giá trực tiếp chưa có nguồn API trong đợt này.
