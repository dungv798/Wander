# Thử look, chưa phải quyết định nhận diện

Bật bằng `?look=nunito`, `?look=jakarta`, `?look=lexend` hoặc `#/deck/ha-giang?look=lexend`. URL ngoài hash ưu tiên; `?look=off` xóa lựa chọn. Lưu riêng tại `wander.web.look.v1`, đọc một lần mỗi lần khởi động. Không thêm UI, dependency hay preload; CSS thử tải động, font chỉ tải khi được dùng. A: Nunito toàn bộ; B: Jakarta tiêu đề/Nunito thân; C: Lexend tiêu đề/Nunito thân (trọng lượng gần nhất có sẵn theo CSS font matching). Giữ nguyên màu Nắng vàng và nhận diện khi tắt.

`node tools/look/capture.mjs` chụp 390×844 sáng, catalog thật qua route interception, danh tính/chuyến đi giả; không chạy backend/e2e. Tile bản đồ ngoài mạng bị chặn, vùng bản đồ dùng fallback của app. Kết quả `.logs/look-trial/`, ảnh ghép theo thứ tự default/A/B/C. Các ảnh này so sánh với mặc định cùng dữ liệu, không tái thiết kế bố cục.

Kiểm kê: `copy.vi.ts` dùng chữ, không có emoji trang trí cần thay; `discover.const.ts`, `trip.const.ts`, các màn dùng Tabler SVG qua `shared/ui/Icon.tsx`; minh họa ở `shared/ui/art/Art.tsx`. Trường `emoji` rỗng có chủ ý: hiện tại là SVG/minh họa, không gán emoji giả làm bằng chứng. 21 mục manifest là ánh xạ dự kiến; chưa truy cập repo từ sandbox để xác minh từ xa, script sẽ báo lỗi HTTP nếu đường dẫn đổi. Chưa nối Fluent vào UI; giữ component Icon hiện có, cơ chế ảnh/fallback để lượt sau khi có tài nguyên.

Claude chạy riêng `node tools/look/fetch-fluent-icons.mjs` khi có mạng. Script không được chạy trong lượt triển khai này. Script tải PNG và giấy phép MIT gốc từ Microsoft, kiểm signature/IHDR, lưu `web/public/look/icons/` và `LICENSE-NOTICE.txt`. Mỗi tệp giữ tên gốc; manifest lưu đường dẫn nguồn đầy đủ.
