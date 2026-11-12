# ADR-009 — Nguồn dữ liệu địa điểm: miễn phí, biên tập theo điểm đến, qua cổng `PlaceCatalog`

> **English title:** Place data: free, hand-curated per destination, behind a PlaceCatalog port
> **Summary (EN):** Place data reaches the application through a domain port. The first adapter is a zero-cost, editorially curated catalog stored in the repository, with source, license and author on every field and photo; a Google Places adapter can be added later without changing business code.

- **Trạng thái:** `APPROVED` — PO chọn "Bắt đầu miễn phí, thêm Google sau (cùng cổng PlaceCatalog)" ngày 24/10/2026, sau khi nói: "t ko có tiền và ko muốn tốn chi phí mà có cách nào tốt hơn ko".
- **Liên quan:** DR-005 (khám phá bằng quẹt), DR-006, `docs/ux/product-spec-v1.md`, ADR-002/003 (Clean Architecture, cổng/adapter), D8/D14/Q15 (plan).

## Quyết định
1. Dữ liệu địa điểm cho bộ thẻ quẹt đi qua **một cổng domain `PlaceCatalog`** (tìm điểm đến, danh sách ứng viên, chi tiết, ảnh). Nghiệp vụ không biết nguồn.
2. **Adapter đầu tiên là kho tự biên tập, chi phí 0:** với mỗi điểm đến (bắt đầu **Hà Giang**), một bộ khoảng 20–40 địa điểm lưu trong repo (tệp dữ liệu có phiên bản + ảnh), mỗi trường và mỗi ảnh có **nguồn, giấy phép, tác giả**.
   - Nguồn nội dung: Wikivoyage, Wikipedia, Wikidata, Wikimedia Commons (giấy phép mở, lưu được, phải ghi công), OpenStreetMap/Geoapify cho tên và tọa độ, cộng **ảnh và hiểu biết của PO**.
3. **Thêm adapter Google Places hoặc nhà cung cấp khác sau**, nếu PO muốn mở rộng sang điểm đến chưa biên tập. **Không** tạo tài khoản đám mây hay khóa API ở giai đoạn này.
4. **Cổng admin** để nhập/sửa dữ liệu (PO đã muốn) trở thành bước sớm hơn dự kiến, vì nội dung do ta biên tập.

## Dữ kiện đã tra (24/10/2026)
| Hướng | Chi phí / điều kiện | Điểm đáng chú ý |
|---|---|---|
| Google Places API (New) | Trang giá chính thức: hạn mức miễn phí hằng tháng theo từng loại gọi (Text Search Pro 5.000, Place Details Pro 5.000, Essentials 10.000, ảnh 1.000); vượt thì Details Pro 17 USD/1.000, ảnh 7 USD/1.000. Cần tài khoản thanh toán (trang giá **không nói rõ** có cần thẻ, `UNVERIFIED`) | Trang chính sách: **không được lưu/ cache nội dung ngoài `place_id`**; phải hiện logo/ ghi công Google; kết quả hiện trên bản đồ phải dùng Google Map. Mỗi lần xem thẻ là một lần gọi |
| Foursquare Places API | Trang giá: Pro miễn phí 500 lượt đầu, sau đó 15 USD/1.000. Giá ảnh/ tips và độ phủ Việt Nam **chưa kiểm** | Hạn mức nhỏ |
| Tripadvisor Content API | Nguồn tin mâu thuẫn; có tin API cũ ngừng 31/08/2026 (**chưa xác nhận**) | Ghi công nặng, ít ảnh mỗi nơi |
| Geoapify Places | Trang giá: gói miễn phí **không cần thẻ**, 3.000 credit/ngày, 5 yêu cầu/giây; cần ghi công; trang không nói về lưu kết quả | Dữ liệu từ OSM, thường **không có ảnh** |
| OpenTripMap | Tên miền chuyển hướng sang trang đỗ (parked) khi thử | Có vẻ đã ngừng, **không dùng** (`UNVERIFIED`) |
| Dữ liệu mở (OSM, Wikidata, Wikipedia, Commons) | Miễn phí, không khóa; ODbL (OSM, ghi nguồn) và CC BY-SA (Wikipedia/ Wikivoyage, ghi công và chia sẻ tương tự), ảnh Commons có **giấy phép riêng từng tệp** | Thử nghiệm: Wikivoyage "Ha Giang" chỉ có **5 mục** liệt kê; Overpass trả 40 điểm quanh Hà Giang, **12 có tên, 0 có thẻ wikidata/ảnh**. Vì vậy **cần biên tập tay**, không thể tự động hoàn toàn |

## Phương án đã cân nhắc
| Phương án | Kết luận |
|---|---|
| Google Places ngay | Dữ liệu tốt nhất nhưng cần tài khoản thanh toán; PO không muốn chi phí. Hoãn, cắm sau qua cổng |
| Foursquare / Tripadvisor | Không chọn: hạn mức nhỏ hoặc không chắc còn dùng được, ghi công nặng |
| Chỉ dữ liệu mở tự động | Không chọn: quá thưa ở vùng sâu, gần như không có ảnh |
| **Kho tự biên tập + dữ liệu mở (chọn)** | Chi phí 0, lưu được, có kiểm soát chất lượng; đổi lại tốn công biên tập |

## Hệ quả
- Chỉ các điểm đến đã biên tập mới có bộ thẻ; mỗi thẻ phải có ≥ 1 ảnh (quy tắc của đặc tả).
- Phải **ghi nguồn, giấy phép, tác giả** cho văn bản và ảnh, và hiển thị ghi công trong giao diện (trang chi tiết). Văn bản chép từ Wikipedia/Wikivoyage mang giấy phép CC BY-SA: không dùng trái giấy phép; với dự án học tập, an toàn nhất là **viết lại bằng lời mình** và chỉ lấy dữ kiện.
- Không có điểm sao của người dùng; có thể thay bằng nhãn biên tập (nổi bật, nên đi mùa nào).
- Cần công cụ nạp/ kiểm dữ liệu (tệp + script, sau đó cổng admin).
- Khi thêm adapter Google: tuân thủ điều khoản (chỉ lưu `place_id`, ghi công), khóa API là bí mật (biến môi trường), đặt hạn mức; cần một ADR bổ sung và PO duyệt chi phí.
