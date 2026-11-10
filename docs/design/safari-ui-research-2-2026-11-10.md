# Wander trên Safari iPhone — nghiên cứu vòng 2 (10/11/2026)

Phạm vi: nghiên cứu và đề xuất; không sửa mã. Bổ sung cho `safari-ui-research-2026-11-09.md` và `ios27-liquid-glass-2026-11-09.md`. Kết quả đo lượt audit nằm ở `.logs/ios27-audit/`.

Nhãn: **[CHÍNH THỨC]** Apple/WebKit · **[CỘNG ĐỒNG]** diễn đàn, báo cáo lỗi, blog · **[ĐO]** đo trong repo · **[UNVERIFIED]** cần iPhone thật.

## 1. Mẫu thiết kế của PO nói gì (`docs/UI-sample`, `docs/UI-sample-2`) [đã xem ảnh]

- Bề mặt gần đặc, trắng/xanh rất nhạt, **viền mảnh + bóng mềm**; không có kính xám-xanh đục, không gradient chéo.
- Nút tròn ở header: nền trắng + viền mảnh. Chip lọc: nền trắng + viền mảnh; chip đang chọn là **nền cam đặc**.
- Thanh điều hướng đáy: cụm 3 tab dạng viên thuốc **gần trắng**, viền mảnh, **biểu tượng 3D**, nút "+" tròn riêng. Đây là mẫu của dock hiện tại, nhưng bản mobile mới đã thay 3D bằng SVG đơn sắc và đổi nền thành gradient kính.
- Màn bản đồ Hong Kong: bản đồ phía sau, **bảng gần đặc** bo trên, và một **viên thuốc hành động theo ngữ cảnh** ("Create trip to Hong Kong" + nút cam). Kính chỉ xuất hiện ở viên thuốc này.
- Kết luận: bản "Liquid Glass" 09/11 lệch khỏi mẫu của chính PO. Điều PO chưa ưng có thể là chính chỗ lệch này.

## 2. Apple HIG [CHÍNH THỨC] (đọc bản .md của Materials, Scroll views, Tab bars, Toolbars, Accessibility, Typography)

- Liquid Glass là lớp **điều khiển/điều hướng nổi**; "Don't use Liquid Glass in the content layer"; dùng "sparingly", chỉ cho phần tử chức năng quan trọng nhất.
- Biến thể **regular** khi nền có thể gây khó đọc hoặc có nhiều chữ; biến thể **clear** chỉ cho thành phần nổi trên ảnh/video, và nên thêm lớp tối 35% khi nền sáng.
- **Scroll edge effect**: tách thanh công cụ khỏi nội dung cuộn; chỉ dùng khi có phần tử nổi phía trước; **một hiệu ứng mỗi màn**; "không phải để trang trí, không che/làm tối như lớp phủ". Mặc định mềm.
- **Tab bar dùng để điều hướng, không phải hành động**; nhãn một từ; có thể có tab tìm kiếm riêng ở cuối. Nút "+ Tạo chuyến" trong dock là hành động, lệch khỏi khuyến nghị này.
- Toolbar: tối đa khoảng 3 nhóm, một hành động chính, tiêu đề dưới 15 ký tự, giảm nền và màu tô.
- Chữ iOS: mặc định 17pt, **tối thiểu 11pt**. Tương phản 4,5:1 cho chữ đến 17pt. Có **Increase Contrast** thì phải có bảng màu tương phản cao hơn. Reduce Transparency làm đổi biến thể vật liệu.
- Vùng chạm iOS: mặc định 44pt, tối thiểu 28pt (không phải "tối thiểu 44").

## 3. Safari 26 trên iPhone

- **[CHÍNH THỨC/CỘNG ĐỒNG]** WebKit bug 297779, bình luận của Simon Fraser (WebKit): "we chose to have bottom:0 be above the controls". Phần tử `position: fixed` ở đáy **nằm trên** thanh nổi của Safari, không nằm dưới. Hệ quả cho Wander: ở Safari thường, dock của app **xếp chồng lên** thanh Safari, nuốt chiều cao hữu dụng. [UNVERIFIED trên máy thật]
- **[CỘNG ĐỒNG]** Thread Apple Forums 800798: Safari 26 không vẽ nội dung fixed/sticky nằm dưới thanh điều khiển; trang không còn cuộn xuyên dưới thanh dưới. Chưa có phản hồi Apple/WebKit trong thread.
- **[CHÍNH THỨC]** Safari 26.1 sửa "bottom gap trên layout có container fixed cỡ viewport" (blog WebKit 26.1). **[CỘNG ĐỒNG]** nhiều người báo vẫn chưa hết hẳn ở 26.1.
- **[CỘNG ĐỒNG]** Thread 800125: sau khi đóng bàn phím, `visualViewport.height` vẫn nhỏ hơn `innerHeight` khoảng 24px ở một số máy iOS 26.0; Apple DTS đã chuyển cho kỹ sư, không có workaround.
- **[CỘNG ĐỒNG]** WebKit bug 319479: backdrop-filter trên phần tử fixed ở mép khiến Safari 26 bỏ lấy mẫu màu thanh và dùng màu nền. Đang mở, chưa xác nhận chính thức.
- **[CHÍNH THỨC]** Scroll-driven animations (`animation-timeline`, `animation-range`) có từ Safari 26.0; blog bên thứ ba nói chạy luồng riêng từ 26.4 [chưa kiểm]. Dùng được để làm tiêu đề co lại khi cuộn mà không cần JS lắng nghe cuộn.
- Không tìm thấy tài liệu chính thức về `viewport-fit=cover` với thanh nổi của Safari 26.

## 4. Kính trên web [CỘNG ĐỒNG, không có số đo]

- Công thức CSS an toàn trên iOS: `blur(~16px) saturate(~180%)`, tint trắng khoảng 8% cho kính trong, viền 1px nhạt, bóng mềm; viết cả `-webkit-backdrop-filter`. Biến CSS trong `-webkit-backdrop-filter` có nguồn báo không chạy; chưa có nguồn xác nhận, nên ghi giá trị cứng.
- **SVG `url()` trong `backdrop-filter` không chạy trên Safari**, và `@supports` báo sai là có. Khúc xạ thật (displacement) chỉ làm được bằng `filter: url()` lên chính nội dung, có trần kích thước và lỗi cache theo ID bộ lọc. Không đáng cho thanh điều hướng.
- Blur tĩnh gần như miễn phí; blur trên nội dung đang cuộn cần đo trên phần cứng thật. Một tác giả viết "worth it for a hero element, absurd for a nav bar" (ý kiến, không có số).
- Tổ tiên có `overflow:hidden` hoặc phần tử con `position:fixed` trong phần tử có backdrop-filter gây lỗi bố cục kỳ lạ.

## 5. Khoảng trống chưa lấp được

- Tìm kiếm chung về UX app du lịch (Wanderlog, Airbnb, Google Maps 2026) chỉ trả về bài chung chung. Các mô hình lặp lại: bản đồ + bảng kéo với các nấc (peek/nửa/đầy), nút chuyển bản đồ/danh sách, nhóm chip lọc. Không có nguồn đáng tin về số đo.
- Không có số đo hiệu năng blur trên iPhone từ nguồn nào, kể cả trong repo.

## 6. Hướng đề xuất (chưa phải quyết định của PO)

**A. Bám mẫu, kính đúng chỗ (khuyến nghị)**
1. Header không blur, nền gần đặc hòa với canvas; nút tròn trắng + viền mảnh (đúng mẫu). Tránh bug 319479 và lỗi chữ đè logo khi giảm trong suốt.
2. Dock: viên thuốc **gần đặc** (trắng ~92–96%) + viền mảnh + bóng mềm; khôi phục biểu tượng 3D của mẫu; blur nhẹ chỉ như lớp phụ, không gradient chéo, không saturate cao.
3. Chip đang chọn: cam đặc như mẫu; hero "Khám phá": nút trắng đặc thay vì kính xám.
4. Một scroll edge mềm duy nhất bằng `mask-image` gradient ở dưới dock; không đặt blur ở mép trên.
5. Tiêu đề lớn co lại khi cuộn bằng scroll-driven animation (có dự phòng nếu không hỗ trợ).
6. Khuyến khích cài vào Màn hình chính (PWA, manifest đã có): chế độ standalone bỏ hẳn thanh Safari, đúng cho dock kiểu app. [UNVERIFIED]

**B. Giữ Liquid Glass nhưng sửa cho đúng**
Giữ kính ở dock và nút, thêm vầng sáng/viền highlight tinh hơn, sửa các lỗi ở mục 1–2 của audit. Rủi ro hiệu năng và bug Safari 26 cao nhất, chi phí kiểm thử trên iPhone lớn nhất.

**C. Giống mẫu bản đồ Hong Kong: bỏ dock cố định trên màn duyệt**
Màn Khám phá/Điểm đến chỉ có viên thuốc hành động theo ngữ cảnh ("Tạo chuyến đến Hà Giang"); 3 tab chuyển vào header hoặc màn riêng. Giải phóng đáy cho thanh Safari, hợp khuyến nghị HIG (tab bar không chứa hành động). Thay đổi cấu trúc điều hướng lớn nhất.

## Nguồn

- Apple HIG: Materials, Scroll views, Tab bars, Toolbars, Accessibility, Typography (developer.apple.com/design/human-interface-guidelines)
- WebKit bug 297779 (bugs.webkit.org/show_bug.cgi?id=297779) · bug 319479 · WebKit Features for Safari 26.1 (webkit.org/blog/17541) · WebKit Features in Safari 26.0 (webkit.org/blog/17333) · A guide to Scroll-driven Animations (webkit.org/blog/17101)
- Apple Developer Forums: thread 800798, thread 800125
- Aave, "Building Glass for the Web" (aave.com/design/building-glass-for-the-web) · Pavel, "Liquid Glass on the Web: 6 Ways" (dev.to/devyatov)
- Ảnh mẫu của PO: `docs/UI-sample/`, `docs/UI-sample-2/`

## 7. Đã dựng theo hướng A (10/11/2026)

PO chọn A, tập trung Safari thường, yêu cầu full màn, ưu tiên thị giác, không lag. Chi tiết mặc định đã chọn: `docs/implementation/decisions.md` mục cuối. Ảnh trước/sau: `.logs/ios27-audit/before/` và `.logs/ios27-audit/*.png`. Số phần tử còn `backdrop-filter` trong khung nhìn trang chủ: 9 → 1 (nút thông tin trên ảnh hero). Tương phản trung vị mực/nền sau mọi nút: 10,4–12,3:1 (trước: 5,5–12,2). Chưa xác nhận trên iPhone thật.
