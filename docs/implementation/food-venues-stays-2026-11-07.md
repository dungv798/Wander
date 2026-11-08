# Bổ sung món, quán và chỗ ở — 07/11/2026

PO yêu cầu bổ sung dữ liệu vào app hiện có, đã cho phép tự thực hiện các thao tác thông thường. Phạm vi: 20 điểm đến hiện có; thêm món đặc trưng, địa chỉ quán ăn/cà phê cụ thể và chỗ ở thật. Giữ dữ liệu, ảnh và lịch mẫu cũ. Không đặt phòng, thu thập đánh giá Google, thêm giá/giờ giả, đổi DB, deploy hoặc gọi Claude.

## Tiêu chí

- Món theo vùng là ý tưởng `exp-*`, không biến thành địa chỉ quán đã xác minh.
- Quán/chỗ ở cần tên, địa chỉ, nguồn đã đọc và vị trí đối chiếu; kết quả đồng tên, sai vùng hoặc chi nhánh chưa xác định giữ ngoài. Nguồn doanh nghiệp/du lịch chính thức; thông tin chưa xác nhận để chưa biết. Không sao chép lời quảng cáo hay xếp hạng sao làm đánh giá của Wander.
- Ảnh quán/khách sạn phải đúng cơ sở và giấy phép hợp lệ; không lấy ảnh món hay cảnh vùng để giả ảnh doanh nghiệp. Thiếu ảnh vẫn được có hồ sơ theo DR-033.
- Metadata quán/chỗ ở tùy chọn trong catalog để đưa địa chỉ, website và nguồn thành hành động hữu ích. Không thêm bảng/module/dependency; API additive, dữ liệu cũ tiếp tục đọc được. Café thêm vào lịch dạng Nghỉ; chỗ ở giữ dạng Lưu trú và người dùng tự chọn ngày, không tự nhét vào tour tham quan.
- Kiểm preservation, trùng lặp, tọa độ, ảnh/giấy phép; unit/catalog/backend và browser trên dữ liệu mới. Giữ performance metadata tóm tắt/thumbnail đã tối ưu. Chạy preview với PreserveData, không reset DB.

## Mốc xuất phát

20 điểm đến, 272 thẻ, 40 thẻ ẩm thực, 444 tham chiếu ảnh địa điểm, 153 khoảnh khắc. Snapshot riêng của đầu đợt dùng để kiểm chỉ append, không đổi bản ghi đã có.

## Kết quả nhập

- Thêm 37 thẻ: 11 món muốn thử, 6 quán ăn, 5 quán cà phê, 15 khách sạn/resort. Tổng 309 thẻ, trong đó 62 thuộc ẩm thực (gồm món, quán ăn và café); 470 tham chiếu ảnh, 153 khoảnh khắc.
- Thêm 24 mục vào cẩm nang ẩm thực; món không có ảnh đúng không bị ép thành thẻ minh họa sai. Có thể trùng chủ đề ở cẩm nang và thẻ do mục cẩm nang liên kết tới đúng thẻ; không nhân bản địa điểm.
- 26 ảnh mới đã xem đủ tỷ lệ, CC BY/BY-SA hoặc public domain; 10 ảnh đúng doanh nghiệp cho Metropole, Majestic, Morin, Dalat Palace và Café Giảng, 16 ảnh món. Không dùng hình từ website khách sạn khi chưa có quyền sử dụng.
- Còn ứng viên ngoài kho vì chưa chốt vị trí hoặc nguồn: gồm H’Mong Village, Thác Mây Tà Xùa, Stelia, Avani, Dakruco và một số quán. Chưa có khách sạn được nhập mới ở Hà Giang, Tà Xùa, Phú Yên, Quy Nhơn, Buôn Ma Thuột. Không gán tọa độ trung tâm vùng cho doanh nghiệp. Website honghanh.vn thực tế là Honda, kienxay.vn là đơn vị kiến trúc; đã loại nguồn này. Không có giá/giờ/phòng trống/rating tự sinh.
- Metadata API tùy chọn `venue`: kind, kindName, address, website, sourceUrl, checkedAt. `VenueDetails` kiểm HTTPS và category đúng loại ở domain. Không đổi DB/schema/module/dependency. Legacy trả venue null.
- Chi tiết dùng cùng template: địa chỉ, website khi có, nguồn/ngày kiểm chứng, Google Maps search; giá và giờ chưa xác nhận hiện rõ. Café mặc định là Nghỉ, không xóa nhắc bữa trưa; khách sạn giữ Chưa có ngày để người dùng chọn ngày nhận phòng. Cả đường lưu từ Đã chọn và từ Chi tiết giữ metadata. Browser RED đã bắt được mapping trong App còn làm mất metadata; đã bỏ phép chiếu tại App, TripsScreen và PlaceTripAction để giữ nguyên PlaceView khi mở form.
- Hồ sơ thiếu ảnh dùng placeholder theo loại trong danh sách, bộ quẹt, chi tiết và Đã chọn. Giữ nguyên hệ nút/animation của app.
- Tạo thêm 26 thumbnail có hash: tổng 517 ảnh map, nguồn 199.647.754 byte → thumbnail 2.367.356 byte. Không tải ảnh gốc cho các ghim.

Nguồn chính và bằng chứng: `docs/research/venue-candidates-20261107.json`, `dish-candidates-20261107.json`, `food-venues-applied-20261107.json`, `food-venues-audit-20261107.json`. Các mục nguồn chính thức đều đi theo hồ sơ trong app; OSM được lưu riêng trong tips để đối chiếu vị trí. Script nhập kiểm snapshot 272 thẻ đầu đợt trước khi ghi.

## Kiểm thử

- 434/434 frontend unit, lint toàn web và build production đã qua trước rà cuối giao diện; catalog/domain/API backend 48/48 và Checkstyle qua. Test café cũ được cập nhật công khai: café chỉ là điểm nghỉ, không đại diện cho một bữa ăn. Thêm test giữ nhắc trưa, chỗ ở không tự xếp tham quan, validation nguồn và API additive.
- Kiểm preservation và contract: PASS, không đổi thẻ/ảnh/moments/cover/guide đã có; không reset DB review.
- Browser production: 2/2 viewport 390 và 1440 qua cả lưu bộ Đã chọn (café + khách sạn) và lưu café trực tiếp từ Chi tiết; kiểm địa chỉ, website, nguồn, ảnh, đúng loại mục, booking, chưa biết giá, chưa có ngày và không tràn ngang/pageerror. `tools/review-food-venues-20261107.mjs`, ảnh và kết quả `.logs/food-venues-browser/`.
- 8/8 browser regression: 4 auto-plan, 1 lọc chủ đề/performance, 3 ảnh/animation/lazy; `.logs/food-venues-regression.log`.
- Hành trình 9 bước × mobile/desktop: 2/2 PASS, khám phá → điểm đến → món ăn → quẹt → Đã chọn → form → Chưa có ngày → lịch → chia sẻ, bộ sưu tập vẫn giữ; `.logs/food-venues-user-journey/`.
- Build cuối và lint các component/style thay đổi qua. Chi tiết quán/chỗ ở chỉ hiện khung giờ/mùa khi có dữ liệu thật, tránh bốn buổi tham quan rỗng. Browser xác nhận lại sau thay đổi cuối: 2/2 PASS; ảnh và kết quả trong `.logs/food-venues-browser/`, log `.logs/food-venues-browser-verified.log`.
