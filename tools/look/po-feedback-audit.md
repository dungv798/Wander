# Kiểm kê phản hồi PO 29/10/2026

Phạm vi: đọc mọi `<button>`/`<Button>` trong `web/src`; nguồn kiểm kê lưu ở `.logs/look-real/button-source-inventory.txt`, khai báo nền ở `button-background-inventory.txt`. Không sửa `shared/map`; thay đổi ngoài danh sách tệp bàn giao thuộc công việc khác. Không thêm dependency, không chạy e2e, không commit.

## Nút và vật liệu

Nguồn duy nhất: `styles/tokens.css` + `styles/glass.css`; lớp dùng lại `glass-control` có trên Button/IconButton/Chip/ChipToggle. Các nút riêng dùng selector cầu nối cùng công thức. Alpha điều khiển .12, thanh tab .18; blur/viền sáng/vệt sáng/bóng lấy từ token. Sheet giữ .92 để đọc văn bản dài. Kính CSS không phải mô phỏng khúc xạ quang học iOS.

| Nhóm/lớp đã kiểm kê | Nền trước | Quyết định |
|---|---|---|
| Button `.btn`, `.ghost`, `.sun`, `.danger` | cam/trắng/vàng/đỏ | Kính phụ; chỉ `.g-primary` giữ gradient thương hiệu có vệt sáng. Danger giữ ngữ nghĩa bằng nhãn, không có nền đỏ đặc. |
| IconButton `.iconbtn`: Back/Đóng/sửa/chia sẻ; `.credit-btn`, `.gnav`, `.tile .x` | trắng pha nhiều hoặc navy | Kính gần trong; trên ảnh có scrim nhỏ riêng sau glyph trắng. |
| Deck `.round.small`, `.round.l`, `.round.r`, `.pill`, `.fchip` | navy/trắng/xanh lá/cam | Chỉ Chọn `.round.r` cam; còn lại kính; bỏ nhịp pulse xanh. |
| Chip `.chip.{cat,tint,glass,sun,warn,on}`, `.card-cat` | cam/vàng/navy/tint | Kính trung tính; nhãn nằm trên ảnh có scrim tối để đọc được. Chip chỉ đọc không bị ép hitbox 44px. |
| `.tab`, `#tabbar`, `.dtab`, `.dchip`, `.pack`, `.opt`, `.daylist button`, `.taskchk` | active cam/xanh/vàng | Kính; trạng thái bằng viền/chữ đậm/gạch chân. Check ẩn khi chưa chọn. |
| `.search`, search input, destination row | trắng đục | Kính chung, không mất focus ring. |
| `.linkbtn`, `.ghead`, `.grow`, `.resume`, `.obx-skip`, `.brand`, `.simbar .seg button`, toast action | nền trong/trắng/active tint | Chung vật liệu kính. |
| `.dcard`, `.mood`, `.mini`, `.mcard`, `.wcell`, `.tilebtn`, `.tcard`, `.tplcard`, `.irow` | ảnh/nền thẻ trắng | Giữ ảnh và bề mặt nội dung của thẻ; không phải màu nhấn của điều khiển. Các nút nổi bên trong chuyển kính. |
| Ghim, zoom, attribution của bản đồ | do shared/map quản lý | Không sửa theo ranh giới job; không dùng selector mới để tô chúng. |

CTA còn màu: Bắt đầu quẹt ở điểm đến; Chọn trong deck; Lưu thành chuyến ở Đã chọn; Thêm địa điểm trong chuyến; xác nhận/Lưu ở form/sheet. Demote nút gợi ý NextStep, thêm checklist và thêm từ mục chưa xếp ngày để tránh nhiều CTA trong chuyến. Cài đặt: lưu sở thích là chính, đổi tên thiết bị là kính phụ (CSS trong phạm vi styles). Không bắt buộc mọi màn phải có CTA màu, ví dụ danh sách chuyến chỉ có hành động kính.

Fallback mặc định đặc khi không hỗ trợ backdrop-filter. Reduced transparency bỏ blur, dùng nền đặc; scrim ảnh chuyển sang token tối đặc. Contrast đọc từ token: trắng/scrim trên ảnh trắng 6.50:1, trên ảnh đen 19.48:1; chữ/nền fallback 15.20:1; chữ/gradient CTA tối thiểu 5.99:1. Đây là kiểm cặp màu chức năng, không phải đo toàn bộ màu trong PNG icon trang trí.

## Gallery

Gốc lỗi: `appearance.css` ghi đè gallery toàn cục thành tile 126×188, gap/padding và pseudo-element chừa cuối; cả bộ thẻ và bản đồ dùng cùng PlaceSheet/PlaceGallery. Không tìm thấy bằng chứng một lỗi riêng ở `.tmroot` hay PlaceRouteMap.

Sửa: mỗi slide bằng 100% khung, cao 224px cố định, object-fit contain; bỏ tile/gap/pseudo-element. Hook lấy bước bằng clientWidth, kẹp chỉ số bộ rỗng và dùng ResizeObserver giữ ảnh khi đổi cỡ. Unit kiểm kẹp/chiều rộng/scroll; e2e cập nhật đường chạm ghim canvas thật + next/prev và bộ thẻ, đếm giao hình học thay vì đếm DOM (chưa chạy).

Ảnh trước: ghim Cột cờ Lũng Cú mở 3 ảnh cùng khung 388×220. Sau: 1 ảnh trong khung 388×224. Chụp cũng kiểm Lang Biang từ nút truy cập ghim bản đồ, chuyển ảnh; bộ thẻ giữ ảnh thứ hai sau đổi viewport 390→430→390.

## Spacing và ảnh

Token nhịp khối 12px, đệm card 12px, gutter16, khoảng nhỏ8; giữ tap44. Giảm hero trang chủ 520→400, bìa điểm đến270→224, map chọn điểm đến38→24dvh; thẻ Đã chọn đổi từ4/5 sang1.2, thumb mục ngày80; đệm đáy sheet tính theo action/safe area thay150px cố định. Không sửa kích thước nền mapcard của job khác.

6 màn 390×844 trước/sau: home, destinations, destination, map-place, trips, trip. Artifact: `.logs/look-real/po-feedback/{before,after}/*.png`, `capture.json`, `compare-*.png`. Lệnh tái lập: `node tools/look/capture-po-feedback.mjs before|after`; `node tools/look/compare-po-feedback.mjs`. Chỉ chạy before trên bản trước sửa nếu muốn giữ đối chiếu gốc.

Đã xem tối đa 6 ảnh: R17-bottom và 5 bảng đối chiếu (bảng cuối có cả trips/trip). Nhận xét: chọn điểm đến thêm khoảng hai hàng trong màn đầu; detail thấy nhiều facts hơn; trips vốn đã gọn nên thay đổi chủ yếu ở vật liệu. Mẫu có kính ít phô trương hơn bóng của Wander. Bản sửa đầu có quạt ảnh che logo và màu chữ đóng/nhãn ảnh bị cascade; đã sửa, kiểm vị trí bằng DOM và tái chụp, không mở thêm ảnh vượt giới hạn. Bản đồ trong ảnh là nền GL giả cục bộ, không đại diện bản đồ thật hoặc nghiệm thu style bản đồ.

ScrollHeight vùng trang: home2060→1834, chọn điểm đến1755→1491, điểm đến1960→1852; danh sách chuyến vẫn844. Kiểm DOM thêm Đã chọn có tile175×146; cả Tổng quan/ngày1–3 dùng gap/padding-top12 và tối đa một CTA màu. Các màn vẫn cần cuộn khi nội dung dài; không thu nhỏ chữ để ép vừa màn.

## Công cụ và giới hạn

Đã dùng skill `tools/codex-skills/wander-implement/SKILL.md`, đọc CLAUDE/frontend standards/quy tắc áp dụng, rg, apply_patch, npm, playwright-core/Chrome và view_image. Code graph không có công cụ khả dụng. Không delegate. Không đánh giá refraction native, Safari/Firefox hay GPU trên thiết bị thật. E2E NOT_RUN theo chỉ thị PO; ảnh dùng API giả và nền GL giả, giữ đường callback bản đồ thật.
