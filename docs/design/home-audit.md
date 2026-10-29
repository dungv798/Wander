# Kiểm kê trang chủ — 29/10/2026

Phạm vi PO duyệt: hero ảnh to + tối đa ba khối gọn. Không đổi API, phụ thuộc hoặc vật liệu kính chung. Công cụ: skill `tools/codex-skills/wander-implement/SKILL.md`, đọc mã bằng PowerShell/rg (graph MCP không có trong phiên), playwright-core/API giả, TypeScript, ESLint, Stylelint, node:test, Vite. Không delegate, không chạy e2e.

| Khối trước | Mục đích | Trùng với | Quyết định, lý do | Lối truy cập sau |
| --- | --- | --- | --- | --- |
| HomeSky: logo/câu mời luân phiên | Nhận diện, cảm hứng | HeroWide, tagline catalog | Gộp vào hero ảnh bìa, tên điểm đến và tagline duy nhất | Hero trang chủ |
| Mặt trời/mây/máy bay/la bàn | Trang trí | Các lớp nền | Bỏ khỏi trang chủ để ưu tiên ảnh và CTA | Không có chức năng cần chuyển |
| Chip ghim và quạt ảnh | Giới thiệu địa điểm | Ribbon, mood, Month, Wall | Bỏ; ảnh nổi bật được dùng trong cross-fade, không lặp tên | Bộ thẻ và cẩm nang |
| HeroWide | Hero cho màn rộng | HomeSky | Gộp cùng thành phần ảnh thật, CSS thích ứng | Hero 768/1280 |
| SearchBox | Đổi điểm đến | SearchBox trên bản rộng | Giữ đúng một nút kính trong hero | `#/destinations` |
| Ribbon | Chạy tên địa điểm | Chip ghim, quạt, mood | Bỏ cả thành phần; không có hành động riêng | `#/deck/<id>` và cẩm nang |
| ResumeSection | Tiếp tục các nơi đã chọn | Đã chọn | Giữ một thẻ; ưu tiên chuyến đang diễn ra/Hôm nay, rồi chuyến sắp tới hoặc bản mới nhất; không có chuyến mới dùng Đang chọn dở | `#/today/<trip>`, `#/trip/<trip>`, `#/picked` |
| MoodSection | Chọn loại trải nghiệm | Các hàng ảnh | Giữ tối đa 5 thẻ ảnh + tên loại + số nơi; ưu tiên mood đang chọn. Không thêm suy đoán sở thích khi thiếu dữ liệu | Thẻ mở deck lọc loại; Xem tất cả mở `#/dest/<id>` |
| MonthSection | Gợi ý mùa đẹp | Mood, Wall | Bỏ khỏi home; thông tin mùa vẫn có trong catalog/cẩm nang | Cẩm nang: khối months, ghi chú mùa của địa điểm |
| TemplatesSection (`extra` từ App) | Khởi tạo từ lịch có sẵn | Không có lối thay tương đương | Giữ khối cuối có điều kiện, giảm chiều cao thẻ; toàn bộ lịch vẫn cuộn và mở sheet được | Trang chủ, sheet lịch mẫu và biểu mẫu tạo chuyến |
| WallSection (rộng) | Tường ảnh | Mood, quạt, Month | Bỏ; không có chức năng độc lập | Cẩm nang xem trước nơi, sheet địa điểm |
| DestMapSection | Xem bản đồ | Bản đồ trên DestScreen | Bỏ khỏi home để gọn và tránh tải bản đồ ngay | Xem tất cả → cẩm nang → bản đồ |
| DestinationCardSection | Mở cẩm nang | Xem tất cả mới | Gộp thành Xem tất cả, không lặp thẻ bìa lớn | `#/dest/<id>` |
| Mở trên máy này | Khôi phục quyền truy cập | SecurityScreen | Bỏ nút khỏi home, giữ luồng bảo mật đang có | Cài đặt → Bảo mật và thiết bị → khôi phục |
| FeaturedSection/SoonSection | Dấu vết cấu trúc tìm kiếm cũ, không được gọi | Màn chọn điểm đến | Xóa mã không dùng cùng các section cũ | Màn chọn điểm đến vẫn nguyên |

## Hành vi và mặc định trong phạm vi duyệt

- Bìa `coverUrl` luôn đứng đầu, thêm tối đa ba URL ảnh đầu địa điểm khác, loại URL rỗng/trùng; kho ít ảnh không bịa ảnh. `home.const.ts` giữ giới hạn bốn ảnh, nhịp 6.000 ms, năm mood và kích thước ảnh.
- Chỉ cross-fade opacity, không phóng ảnh; kích thước vùng cố định, ảnh lazy và có width/height. Giảm chuyển động giữ bìa tĩnh; trỏ/focus hero dừng thay ảnh.
- Liên kết phủ hero và nút chính mở bộ thẻ; nút tìm độc lập, không lồng button/link. Không thêm màu hex, dùng token và lớp kính/shared Button sẵn có.
- Ba vị trí nội dung, không ép hiện khối trống. Lịch mẫu giữ `TemplatesSection` hiện có để không mất chức năng; chữ của thành phần lịch mẫu thuộc tính năng templates, không sao chép sang copy trang chủ.
- Mặc định đảo ngược được: chọn chuyến theo hôm nay → sắp tới gần nhất → mới nhất; ghi ở đây để Claude có thể tích hợp vào sổ quyết định chung, worker không sửa sổ ngoài quyền sở hữu.

## Bằng chứng hình và nhận xét

`.logs/home-v2/capture.mjs` dùng playwright-core, catalog cục bộ và API giả có một chuyến + lịch mẫu thật. Ảnh `before/{390,1280}.png`, `after/{390,1280}.png`; JSON/log cùng thư mục. Bản trước dựng mã home từ HEAD qua bộ nạp Vite, không ghi đè workspace; CSS dùng chung theo workspace tại lúc chụp nên không phải so sánh vật liệu độc lập với job kính.

Đã xem tổng cộng 5 ảnh trong quá trình làm (hai bản trước sơ bộ, ba bản sau gồm một lần rà lại mobile). Phát hiện và sửa thẻ Tiếp tục bị CSS grid cũ ép chữ, hero rộng bị max-width chung. Ảnh sau rõ hành động chính và gọn hơn; scrim hơi đậm, nút kính phụ trông khá trắng theo vật liệu hiện tại. Thanh tab nổi vẫn che một phần hàng mood ở mép dưới viewport đầu; cuộn nhẹ thấy đầy đủ. Không sửa vật liệu/thanh tab thuộc job khác.

Bộ chụp có đủ ba khối: scrollHeight mobile 1.163 px so với trước 2.185 px, desktop 1.081 px so với trước 3.596 px; không tràn ngang ở 390/768/1280. Đây là đo với fixture, không phải bảo đảm mọi tên chuyến/lịch dài hoặc cỡ chữ phóng to. E2e chỉ cập nhật selector/khẳng định cùng ý nghĩa, không chạy theo yêu cầu.
