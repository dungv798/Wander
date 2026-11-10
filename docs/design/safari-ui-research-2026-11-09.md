# Wander trên Safari iPhone: cuộn danh sách và màu mép trang

Ngày: 09/11/2026. Phạm vi: nghiên cứu và đề xuất UI; chưa sửa ứng dụng hoặc deploy.

## Vấn đề được người dùng xác nhận

- Vuốt danh sách điểm đến không thu thanh Safari như mong đợi; phải vuốt vùng khung bên ngoài.
- Màu vùng trên và dưới không liền với giao diện.
- Người dùng không nên phải biết vuốt ở đâu để trình duyệt phản hồi.

## Bằng chứng trong ứng dụng

- `styles/base.css`: thân trang khóa cuộn; `#screen` là vùng cuộn riêng được định vị tuyệt đối.
- `app/shell.css`: bảng nội dung có giới hạn trên/dưới; chế độ `data-fs` thêm vùng cuộn 120px bên ngoài app cố định. Trước khi được coi là thu thanh, bảng bị khóa cuộn; trong lúc cuộn thì blur bị tắt.
- `app/fullscreen.ts`: `scrollY >= 32` được dùng để suy đoán thanh Safari đã thu; đây không phải phép đo trạng thái thanh trình duyệt.
- `features/discover/homeSurface.css`: bảng Khám phá bắt đầu tại 39% chiều cao app trên điện thoại.
- Phép đo trước đó trên bản deploy, WebKit Windows tại 390×720: bảng danh sách cao khoảng 353px. Chưa mô phỏng được thanh Safari thật và safe area của iPhone bằng phép đo này.
- `index.html` và manifest khai báo màu `#eaf2f3`; vùng bản đồ và bảng nội dung lại có nền/chất liệu riêng. Khai báo theme-color không đủ để đảm bảo mép trình duyệt khớp trên mọi phiên bản Safari.

## Hướng đề xuất: giữ bản đồ, cho danh sách cuộn theo trang

Giữ bản đồ làm lớp nền. Bảng danh sách nằm trong luồng tài liệu, cao theo nội dung và đi lên cùng thao tác cuộn trang. Một cú vuốt trên bất kỳ thẻ điểm đến nào đều cuộn cùng một tài liệu; không chuyển quyền cuộn giữa hai vùng giữa chừng.

### Trạng thái đầu

- Header gọn, đủ logo/phạm vi/tìm kiếm; giảm cảm giác nhiều thanh nổi chồng nhau.
- Cho thấy một khoảng bản đồ khoảng 160–200px, điều chỉnh theo cỡ màn hình sau khi thử.
- Bảng nội dung rộng sát mép, bo hai góc trên khoảng 24px; nền sáng gần đặc.
- Danh sách tiếp tục xuống dưới tự nhiên; không cắt thành cửa sổ có chiều cao cố định.
- Nút “Bản đồ” rõ ràng để mở chế độ tương tác bản đồ lớn.

### Khi vuốt trên danh sách

- Bảng tự đi lên che bản đồ bằng cuộn tài liệu, không kéo một tay nắm riêng.
- Safari nhận thao tác cuộn tài liệu thật; vẫn cần kiểm tra trên các phiên bản iOS và kiểu thanh Safari mục tiêu.
- Khi đến đầu màn, chỉ giữ header/tìm kiếm gọn bằng sticky nếu cần.
- Không resize hero theo `dvh` ở từng khung hình khi thanh Safari co, tránh thay đổi bố cục đồng thời với cuộn.
- Không tắt/bật blur khi cuộn; bảng nội dung vốn dùng nền gần đặc.

### Khi mở bản đồ

- Hiện bản đồ toàn vùng app và thẻ thông tin điểm đang chọn nhỏ ở đáy.
- Nút “Danh sách” quay lại đúng vị trí đã xem.
- Trong chế độ này, vuốt bản đồ dùng để di chuyển bản đồ. Không lấy cử chỉ đó để giả cuộn trang nhằm ép thanh Safari thu.
- Nếu khóa cuộn tài liệu khi mở bản đồ, phải lưu/phục hồi vị trí và kiểm tra việc nhảy trang khi trở lại.

## Hướng thay thế để cân nhắc

1. Danh sách toàn trang và nút Bản đồ: dễ hiểu nhất, dành nhiều diện tích cho thẻ; giảm vai trò bản đồ ở lần nhìn đầu.
2. Bản đồ toàn màn hình với bảng kéo ba nấc: giữ cảm giác ứng dụng bản đồ, nhưng cần quản lý phức tạp giữa kéo bảng, cuộn danh sách và thanh Safari. Không ưu tiên cho vấn đề hiện tại.

## Màu và chất liệu

- Thử nền trung tính sáng `#F7F8F5` cho trang, header và vùng đỡ thanh điều hướng. Đây là màu đề xuất, chưa phải token đã duyệt.
- Đặt màu nền rõ trên cả html/body. Giữ theme-color và manifest cùng họ màu cho các môi trường còn dùng chúng.
- Tạo nền đặc phủ ngang mép trên/dưới, nội dung/nút thụt vào safe area. Nền kéo đến mép, không tạo thêm dải màu khác để lấp phần trống.
- Nếu giữ dock nổi, để nó trên một vùng nền cùng màu trang; không để màu bản đồ xanh ngấm ra hai mép.
- Giữ kính mờ có chừng mực bên trong giao diện; tránh đặt blur trực tiếp trên lớp ngoài cùng dùng để tạo màu mép.
- Không thể đảm bảo màu thanh Safari chính xác chỉ bằng CSS hoặc meta tag; cần kiểm tra Safari thật theo phiên bản và bố trí thanh địa chỉ.

## Kiểm chứng cần có cho prototype

- Trên iPhone nhỏ và lớn: vuốt giữa ảnh, chữ, khoảng trống danh sách đều cuộn đúng trang.
- Thanh Safari đang mở/thu: nội dung không nhảy, tab cuối không bị che, mép không ló màu nền khác.
- Trở lại từ chi tiết hoặc bản đồ: giữ đúng vị trí danh sách.
- Mở tìm kiếm với bàn phím: ô nhập và kết quả đầu còn nhìn thấy; đóng bàn phím không đổi vị trí bất ngờ.
- Kiểm tra cả kiểu thanh Safari trên/dưới/compact và chế độ ngang nếu hỗ trợ.
- Repo đã có `.github/workflows/ios-safari-sim.yml` chạy Safari iOS trong Simulator trên GitHub macOS. Hiện workflow mở URL và chụp, chưa tự vuốt; không coi nó là xác nhận hành vi gesture trên iPhone thật.
- WebKit Windows dùng để kiểm tra bố cục, không xác nhận được màu và thao tác thanh Safari.

## Nguồn

- WebKit, Designing Websites for iPhone X: nền html/body, viewport-fit và safe-area insets: https://webkit.org/blog/7929/designing-websites-for-iphone-x/
- WebKit, New WebKit Features in Safari 15.4: các đơn vị svh/lvh/dvh và viewport thay đổi khi thanh trình duyệt co: https://webkit.org/blog/12445/new-webkit-features-in-safari-15-4/
- Báo cáo WebKit 319479: backdrop-filter trên thanh fixed/sticky có thể khiến Safari 26 dùng màu nền dự phòng. Đây là báo cáo đang mở, không phải xác nhận nguyên nhân trên máy người dùng: https://bugs.webkit.org/show_bug.cgi?id=319479
- Apple Developer Forums 690835 có báo cáo Safari thu thanh khi cuộn phần tử overflow. Vì vậy không khẳng định mọi nested scroller đều không thu thanh; đề xuất cuộn tài liệu ở đây nhằm loại bỏ cơ chế chia quyền cuộn cụ thể của Wander: https://developer.apple.com/forums/thread/690835

## Prototype đã triển khai và kiểm tra cục bộ (09/11/2026)

Phần nghiên cứu phía trên mô tả hiện trạng trước khi sửa. Prototype hiện có trong `web/`, chưa deploy:

- Dưới 768px, các màn Khám phá, Điểm đến, Đã chọn, Chuyến đi và bộ chọn điểm đến dùng cuộn tài liệu; không còn cơ chế `fs` chuyển quyền cuộn theo ngưỡng pixel. Các URL cũ có `?fs=0`/`?fs=1` không điều khiển bố cục mới.
- Header cao 60px cộng safe area, vùng bản đồ xem trước 180px; bảng nội dung trong luồng trang, nền gần đặc. Header và dock dùng cùng nền `--mobile-canvas`; kích thước nội dung không chạy theo `dvh` khi cuộn.
- Nút Bản đồ/Danh sách mở bản đồ lớn, khóa nền và trả lại vị trí đọc. Chi tiết địa điểm dùng chung khóa cuộn có đếm các lớp lồng nhau. Rời màn xóa lựa chọn mở bản đồ, tránh Back về trang có danh sách bị ẩn.
- Màn rộng giữ bảng bên cạnh bản đồ. Không thêm thư viện hoặc thay đổi API.

### Bằng chứng đã đọc

- Build: PASS, `.logs/safari-build-final.log`. Vite vẫn có cảnh báo kích thước chunk MapLibre.
- ESLint + Stylelint: PASS, `.logs/safari-lint-final.log` (`Lint exit: 0`).
- Unit: 475/475, `.logs/safari-unit-tests.log`.
- E2E mục tiêu: 4/4, `.logs/safari-mobile-e2e-final.log`; kiểm cử chỉ cảm ứng CDP, mở/đóng bản đồ và Back qua tìm kiếm trên Chrome/WebKit, chi tiết địa điểm và chuyển sang bố cục desktop. Các test này dùng máy chủ danh mục chỉ đọc của `web/scripts/catalogStub.mjs`, không xác nhận luồng ghi chuyến đi với backend Java.
- Review bản đồ thật: `.logs/safari-mobile-review/report.json`, `.logs/safari-visual-review-network.log`. Chrome và WebKit đều giữ vị trí `520 → 520`, `#screen.scrollTop = 0`, không tràn ngang tại 390×844. Có ảnh bổ sung ở 375×667.

### Giới hạn kiểm chứng ảnh WebKit trên Windows

Sau khi canvas bản đồ đổi từ vùng xem trước sang toàn màn hình, WebKit Windows có thể chụp ra nền trống dù renderer vẫn báo ghim, camera và kích thước đúng. Probe độc lập `.logs/webkit-resize-probe.mjs` tái hiện bằng canvas WebGL thuần: trước resize có màu xanh, sau resize ảnh chỉ còn nền, trong khi `isContextLost() = false`, `getError() = 0`. Ảnh đối chứng ở `.logs/safari-mobile-review/webkit-probe-{before,after}.png`.

Hiện tượng khớp [Playwright #42885](https://github.com/microsoft/playwright/issues/42885), lỗi ảnh chụp WebGL sau resize trên bản Windows được xác nhận ở upstream. Không thêm workaround vào ứng dụng để chữa ảnh của công cụ. Đây chưa phải bằng chứng bản đồ bị trống trên Safari iPhone thật.

Chưa xác nhận trên iPhone thật: thao tác thu/mở thanh Safari, màu thanh trình duyệt, safe area, bàn phím và độ mượt khi vuốt. Chưa chạy lại toàn bộ bộ E2E với backend Java cho prototype này.
