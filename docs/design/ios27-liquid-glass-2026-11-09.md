# Wander mobile — Liquid Glass và tham khảo thiết kế thực tế

Ngày: 09/11/2026. Phản hồi PO: bản nền đặc trước đó chưa đẹp; muốn UI theo iOS 27.2 và xem cách các website ấn tượng thiết kế. Các thay đổi dưới đây ở máy cục bộ, chưa deploy.

## Nguồn đã xem

| Nguồn | Quan sát và bài học áp dụng |
|---|---|
| [Apple iOS 27](https://www.apple.com/os/ios/) và [bản phát hành iOS 27.2](https://developer.apple.com/news/releases/?id=10262026b) | Apple mô tả Liquid Glass cải thiện khả năng đọc, độ tương phản và khúc xạ. Bản ghi 27.2 xác nhận phiên bản; không suy ra mọi thay đổi giao diện xuất hiện riêng trong bản vá này. Đã tải và xem ảnh nhóm nút Mail của Apple. |
| [Apple HIG — Materials](https://developer.apple.com/design/human-interface-guidelines/materials) | Kính thuộc lớp điều khiển/điều hướng nổi; phần nội dung dùng vật liệu thông thường. Dùng độ mờ vừa đủ cho chữ, tôn trọng giảm trong suốt và tăng tương phản. Đã đọc bản Markdown chính thức. |
| [Flighty](https://flighty.com/) và [Apple Behind the Design: Flighty](https://developer.apple.com/news/?id=970ncww4) | Website dùng tiêu đề rất rõ, khoảng thở lớn và hình sản phẩm làm trọng tâm. Bài phân tích của Apple nhấn mạnh thông tin cần thiết phải dễ tìm. Áp dụng: các hành động chính dễ nhận ra, biểu tượng mobile nhất quán, giảm lớp nổi đè lên nội dung. |
| [Airbnb Experiences](https://www.airbnb.com/s/experiences) | Đã mở desktop/mobile: ảnh và thông tin tên, loại trải nghiệm, thời lượng được tách rõ; bộ lọc ngắn gọn. Áp dụng: tên và mô tả điểm đến nằm dưới ảnh, dễ so sánh khi lướt; giữ số nơi có thật từ catalog. Không thêm giá hoặc đánh giá giả. |
| [Visit Finland](https://www.visitfinland.com/en/) | Ảnh cảnh quan chiếm vai trò lớn; các phần tiếp theo dẫn từ cảm hứng đến vùng, câu chuyện và tuyến đi. Áp dụng: hero có ảnh thật và câu gợi ý ngắn theo điểm đến; không biến mọi khối thành kính. Cookie banner cản một phần ảnh chụp, nên đối chiếu thêm nội dung và cấu trúc trang. |
| [Awwwards — Travel & Tourism](https://www.awwwards.com/websites/travel-tourism/) | Web reader timeout nhưng mở được bằng trình duyệt, đã xem gallery desktop/mobile. Các mẫu xuất hiện gồm Columbus Travel, Vita Travels và We Were The Scenery: quan sát được cách dùng ảnh lớn, chữ có thứ bậc và màu nhấn có chọn lọc. Không dùng danh hiệu của gallery làm bằng chứng về hiệu quả sử dụng. |
| [Godly](https://godly.website/) | URL hiện chuyển tới Recent — Design Inspiration. Đã xem gallery thực tế: bố cục ưu tiên tác phẩm và hạn chế chrome cạnh tranh với nội dung. Dùng để đối chiếu nhịp ảnh/chữ, không sao chép tài sản hoặc chuyển động nặng. |

Mobbin chỉ trả trang yêu cầu đăng nhập trong công cụ web; không coi là đã kiểm tra được các luồng bên trong.

Ảnh tham khảo và báo cáo duyệt trang nằm trong `.logs/ios27/reference-*.png`, `references.json`; đây là tài liệu review, không phải tài sản đưa vào ứng dụng.

## Thay đổi trong Wander

- **Điều hướng:** cụm ba tab kính dạng capsule, nút tạo chuyến tròn tách riêng. Mobile dùng SVG đơn sắc thay icon 3D; desktop giữ biểu tượng và bố cục hiện tại.
- **Header:** nền khuếch tán nhẹ, nút Bản đồ/Danh sách và tìm kiếm dạng kính. Chuyển nút Bản đồ từ đáy lên header sau khi ảnh 375×667 cho thấy nó che thông tin hero.
- **Vật liệu:** nền nội dung sáng trung tính; mép kính sáng, bóng tiếp xúc mảnh và độ mờ tập trung vào các điều khiển nổi. Có màu dự phòng cho dark mode, giảm trong suốt và tăng tương phản.
- **Nội dung:** chữ hệ thống iPhone; tiêu đề lớn hơn, hero ảnh cao 240px có câu gợi ý theo catalog. Thẻ điểm đến tách ảnh khỏi tên/mô tả; không thêm nội dung giả.
- **Cuộn:** giữ cuộn tài liệu, nhớ vị trí khi đóng bản đồ/chi tiết và quay lại từ tìm kiếm. Vùng bản đồ xem trước giảm 180 → 160px, camera và CSS dùng cùng giá trị. Không khôi phục cơ chế `fs` cũ.

Các kích thước/màu nằm trong `styles/tokens.css`; không thêm thư viện hoặc thay đổi API. Hiệu ứng kính được dựng bằng CSS, không phải vật liệu native của UIKit.

## Kiểm chứng

Kết quả được ghi sau khi kiểm tra; log nằm trong `.logs/ios27/`.

- E2E thao tác với cấu trúc header cuối: 4/4 (`mobile-e2e-final.log`).
- Build: PASS (`build-final.log`); vẫn có cảnh báo chunk MapLibre lớn.
- Lint toàn bộ: PASS (`lint.log`). Các tệp TS/CSS thay đổi sau đó được kiểm lại riêng: PASS (`eslint-final.log`, `stylelint-final.log`).
- Kiểm hằng số camera/CSS: 3/3 (`const-tests.log`).
- Duyệt ảnh Chrome/WebKit tại 390×844, 375×667 và Chrome desktop 1440×1000: không tràn ngang, không lỗi JavaScript ở các lượt đã hoàn tất (`report.json`).
- Giới hạn ảnh WebGL sau resize của WebKit Windows đã được ghi ở `safari-ui-research-2026-11-09.md`. Chưa xác nhận độ mượt, thanh Safari và safe area trên iPhone thật.
