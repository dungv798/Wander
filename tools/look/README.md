# Look sản phẩm theo DR-024

Look mới bật mặc định: system rounded trên Apple, Nunito tự lưu dự phòng; năm vật liệu kính CSS, Fluent PNG cho ngữ nghĩa và Tabler cho điều khiển. Giữ Nắng vàng, không thêm dependency hay khúc xạ. `?look=classic` đối chiếu bố cục cũ và SVG; dùng Be Vietnam Pro, không tải Baloo 2. Classic lưu riêng tại `wander.web.look.v1`; `?look=off` xóa lựa chọn. URL ngoài hash ưu tiên URL trong hash. Cờ thử font cũ không còn bật trial.

`node tools/look/capture-real.mjs final` dùng playwright-core có sẵn, Chrome headless và Vite trong tiến trình; chặn API bằng fixture từ catalog cục bộ, chặn mạng ngoài. Không chạy backend hoặc bộ E2E. Chụp năm màn trang chủ, chọn điểm đến, bộ thẻ quẹt, chi tiết địa điểm, Chuyến đi ở 390×844 cho mỗi look. Lưu 10 ảnh màn, 5 ảnh ghép mẫu–mới–classic và capture.json tại `.logs/look-real/vfinal/`. LOOK_EXTENDED=1 thêm ảnh tăng chữ/zoom; không bật trong lượt mặc định.

Kiểm font thực tải, PNG 24/32/40 px theo CSS (thẻ quẹt phía sau có transform), tràn ngang, nút tiếp/phím trái gallery và lỗi JavaScript. Mẫu bộ thẻ quẹt chỉ tham chiếu, không có màn quẹt tương đương. Bản đồ hiện fallback vì nguồn style/tile mạng ngoài bị chặn; ảnh không chứng nhận chất lượng bản đồ. Safari/iPhone, GPU Android, bàn phím thật và giảm trong suốt native chưa kiểm.

Gallery mới dùng khung 126×188 với object-fit:contain, giữ toàn ảnh và chấp nhận khoảng trống khi tỷ lệ nguồn khác khung. Bước cuộn đo từ khoảng cách giữa ảnh, dùng chung với gallery toàn chiều rộng classic. Trang chủ vẫn hero Wander, thứ tự tên–gallery và bảng thông tin chi tiết khác mẫu; không tuyên bố giống từng pixel.

fluent-icons.json ghi nghĩa của 21 tài nguyên hiện có. Chợ, khoảng cách, thuê xe, checklist và nhãn tiện đường giữ Tabler đúng nghĩa. Không chạy fetch-fluent-icons.mjs trong lượt này. Giấy phép Fluent ở web/public/look/icons/LICENSE-NOTICE.txt; Nunito ở web/public/fonts/OFL-Nunito.txt, sao từ https://raw.githubusercontent.com/google/fonts/main/ofl/nunito/OFL.txt.
