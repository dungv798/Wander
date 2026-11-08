# Performance, onboarding và mở rộng nội dung — 07/11/2026

Tiếp nối đợt sửa ảnh, gợi ý xếp ngày và mở rộng catalog 06/11. PO yêu cầu tiếp tục tự xử lý, đo lag, dùng chung các thành phần phù hợp, đồng bộ onboarding với UI B, kiểm như tester trên desktop/mobile, tiếp tục bổ sung nhiều địa điểm/ảnh/khoảnh khắc có nguồn. Không gọi Claude, không hỏi lại các thao tác thông thường đã được cho phép. Giữ dữ liệu review và workspace đang có thay đổi; không reset, không deploy/push hay sửa master plan.

## Nền đã hoàn tất

- Khi bắt đầu đợt này có 422 unit frontend qua; các kiểm chứng cuối sau thay đổi mới ghi ở phần cuối tài liệu.
- Toàn bộ backend test đã PASS sau khi chỉnh test DB dùng tmpfs và giới hạn cache context/heap cho kho toàn quốc; không sửa runtime/schema vì các thay đổi môi trường test này.
- Catalog: 20 điểm đến, 253 thẻ (40 ẩm thực), 413 ảnh địa điểm, 127 khoảnh khắc; 11.653 POI phụ trợ ở 20 nơi, không coi là POI đã được review. Bảo toàn nội dung cũ và kiểm hợp đồng PASS.
- Đã kiểm browser production về ảnh chậm/rapid back/reduced-motion/native lazy, áp dụng/Undo/reload, pending thật tạo bởi thành viên. Lỗi custom ngày bị mất sau save lỗi đã đổi sang khóa nội dung lịch và được xác nhận lại xanh trong E2E production.
- Preview 8787 đã nạp resource mới bằng `backend-preview.ps1 -PreserveData -PreviewHours 12`. Không xóa CSDL.

## Phạm vi kiểm và cải thiện

1. Đo production: tải đầu, chuyển màn, lọc cả nước, quẹt ảnh, scroll, mở chi tiết, onboarding; ghi long tasks/frame/bytes/DOM và trace ở 390×844 + 1440×1000. Chọn tối ưu từ bằng chứng.
2. Tối ưu tải/render/map/hiệu ứng; dùng chung các primitive phù hợp với tầng hiện có, không gom toàn bộ nghiệp vụ thành một component lớn. Giữ palette và flow B.
3. Onboarding theo UI mới: bản đồ sáng, ảnh người/thực tế, kính và nút/icon chung; tương tác quẹt → chọn → lịch → chia sẻ phải khớp app thật, reduced-motion và bàn phím hoạt động.
4. Tuyển thêm nội dung: ưu tiên nơi ít, trekking, món ăn/đời sống và khoảnh khắc; nguồn/tọa độ/giấy phép rõ, xem ảnh trước nhập. Không gán ảnh vùng cho quán/địa danh chưa chắc. Xu hướng là tuyển chọn có nguồn, không giả bảng hot thời gian thực.
5. Kiểm E2E như người dùng, sửa các lỗi nhìn thấy rồi chụp lại; lint/build/tests phù hợp. Báo link bản chạy, số trước/sau và giới hạn thực tế.

## Nhật ký và bằng chứng

Đợt trước: `refinement-motion-planner-data-2026-11-06.md`, audit/source/curation trong `docs/research/*20261106*`; log `.logs/refinement-*`. Không chạy `tools/dev.ps1 e2e/verify` vì thao tác đó reset DB review. Dùng kiểm thử trực tiếp với guard `WANDER_E2E_DB=wander_e2e`, backend 8787; ảnh production trong `.logs/claude-handoff/screens/`.

## Đã thực hiện

### Hiệu năng và thành phần chung

- Baseline production phát hiện bấm Món ăn tải 19 JSON chi tiết điểm đến. `DestinationSummary.categories` là metadata đọc sinh từ catalog thật; frontend lọc đồng bộ trên tóm tắt. API cũ thiếu trường vẫn tải bù riêng nơi thiếu, có hủy kết quả cũ. Không nới domain, thêm bảng hay chuyển nghiệp vụ sang UI.
- Khi mọi điểm đến đều khớp bộ lọc, giữ nguyên tham chiếu danh sách nguồn. Lỗi bấm Món ăn làm mất mức zoom đã được tái hiện bằng E2E đỏ (`discovery-camera-red.log`), rồi xanh: cùng 20 nơi thì giữ camera của người xem. Hero/lưới ảnh không bị tháo khi lọc.
- 491 ảnh local có biến thể ghim 96×96: tổng nguồn **191.686.754 byte → 2.233.848 byte** cho bộ biến thể. App chỉ tải những ghim cần dùng, đây không phải dung lượng của một lượt trang. Ảnh đầy đủ và ghi công giữ nguyên cho chi tiết.
- Biến thể dùng hash nội dung nguồn + phiên bản crop, phục vụ ở `/assets/map-photos/`. HEAD thực tế trả `200 image/jpeg`, `public, max-age=31536000, immutable`; thay nguồn hoặc recipe đổi URL. Chỉ ánh xạ tệp đã dựng thật, URL lạ vẫn giữ nguyên. CDN Unsplash giữ `ixid` và giảm kích thước đúng ghim.
- Dùng chung `BrandMark`, `Button` (hỗ trợ ref chuẩn React 19), `IconButton`; nội dung chia sẻ/onboarding dùng cùng icon, trạng thái, vật liệu B. Tránh blur lồng trên nút nằm trong tờ kính đã lọc nền. Không thêm thư viện, gọi Claude hay thay framework.

### Onboarding

- Desktop có cột nội dung và sân khấu tương tác riêng, mobile ưu tiên ảnh rồi bản đồ/lịch. Giữ bốn bước, quẹt tay thật, replay, chuyển cảnh, bàn phím, reduced-motion, fallback khi nền bản đồ lỗi và ghi nhớ đã xem.
- Gỡ đồ vật trang trí kiểu máy bay/ống nhòm/la bàn nổi ở cảnh đầu; dùng ảnh thật và gợi ý trải nghiệm. Thương hiệu/nút/màu kính khớp app. Chấm tiến độ có vùng chạm 44 px; màn 320 px tách điều hướng thành hai hàng. Lịch cuộn được ở khung thấp; trên mobile rút ghi chú phụ để ưu tiên các điểm trong ngày.
- Cảnh chia sẻ khớp sản phẩm đang có: thành viên thêm nơi muốn ghé vào Chưa xếp ngày, chủ chuyến xếp vào ngày hoặc để sau. Gỡ lời hứa “sắp có” và luồng duyệt thêm địa điểm không có trong app thật. Đây vẫn là minh họa, không ghi chuyến lên server.
- Qua xem ảnh chụp đã sửa nút Bỏ qua bị rơi vào flow nội dung, nút Xem lại bị kéo dài/che lịch, thứ tự CSS của lớp UI mới và phần danh sách bị cắt không cuộn.
- Lượt xem ảnh cuối phát hiện nút Chia sẻ đè nhãn minh họa và avatar thành viên đè tab ngày. Đã đặt Chia sẻ đúng góc bản đồ, đưa avatar vào hàng tiêu đề ngày bằng accessory của `DaySheet`, gỡ viền highlight đen sang token lựa chọn chung và tăng chiều cao sân khấu desktop. Sau sửa **9/9 onboarding E2E PASS**, lint/build PASS (`onboarding-layout-verified.log`); kiểm chồng lấn được bổ sung vào script chụp.

### Nội dung

- **253 → 272** thẻ, **413 → 444** tham chiếu ảnh địa điểm, **127 → 153** khoảnh khắc; vẫn **20 điểm đến, 40 thẻ ẩm thực, 11.653 POI phụ trợ**.
- 19 địa điểm mới có ảnh được xem, mô tả, highlights và lưu ý riêng; thêm Ba Vì, Yên Tử, Hoàng Liên cho người thích đi bộ/trekking. Các ghim vùng núi không được mô tả là đầu tuyến/GPX; Phá Tam Giang là `exp-*` nên planner không tự dùng tâm vùng phá làm điểm ghé.
- 26 khoảnh khắc mới bổ sung con người, chợ, gốm, đèn lồng, trang phục, phơi ngô, chài lưới và những khoảng nghỉ. Không gắn ảnh cấp vùng cho một POI chưa chứng minh; chỉ ảnh cổng Chợ Đà Lạt có căn cứ được append vào đúng POI. Ba ảnh trùng nguồn không nhập lại, một ảnh quá tối và ảnh sai chủ thể bị giữ ngoài.
- Audit **PASS** bảo toàn toàn bộ nội dung/bìa/khoảnh khắc cũ, giữ nguyên thứ tự ảnh cũ, kiểm tệp/giới hạn/liên kết. Hồ sơ: `docs/research/expansion-20261107.md` cùng các manifest/audit có ngày 07/11.

## Kiểm chứng cuối

- **427/427 unit frontend**, lint và production build PASS (`.logs/performance-{unit,lint,build}-verified.log`). Chunk MapLibre lớn vẫn là tải riêng; không giấu cảnh báo bằng cách nâng ngưỡng build.
- **359 ca backend toàn suite PASS** sau metadata đọc; sau resource mới chạy thêm **45 ca catalog + checkstyleMain PASS** (`performance-catalog-backend-final.log`). Không reset dữ liệu review.
- **17/17 browser E2E PASS** trên production: planner áp dụng/Undo/reload, giữ draft sau lỗi, pending tạo thật bởi member; lọc giữ ảnh/camera và không tải cả nước; onboarding/quẹt tay/replay/chia sẻ minh họa/fallback/reduced-motion; ảnh chậm, rapid-back, native lazy (`performance-browser-verified.log`).
- Hành trình người dùng 9 bước × desktop/mobile PASS: home → điểm đến → chi tiết món → quẹt → đã chọn → form tạo chuyến → chưa xếp → lịch → share. Ảnh và log `.logs/performance-final-user-journey/`, không tràn ngang/che zoom.
- API kho mới trả đúng 272 thẻ, 40 thẻ món, metadata khớp loại địa điểm thật; **104 URL ảnh địa điểm bổ sung HTTP 200**. 8 ảnh review ẩm thực ở Huế/Nha Trang/Quy Nhơn: `.logs/performance-final-catalog-review/`.
- Onboarding kiểm cuối **16 màn chụp** (4 cảnh × 320/390/768/1440 px) PASS: không tràn ngang, không lỗi trang, mọi nút đang hiển thị/hoạt động có vùng chạm ≥44 px, bản đồ lên được. Ở màn thấp lịch cuộn để tới các hàng còn lại. Bằng chứng `.logs/onboarding-20261107/`, log `onboarding-verified-20261107.log`.
- Sau tinh chỉnh Chia sẻ/avatar/chiều cao desktop, chụp lại **8 màn mobile/desktop PASS**, gồm kiểm avatar không chạm tab và nút Chia sẻ không đè nhãn; log `onboarding-layout-screens-verified.log`. Không còn công việc kiểm chứng đang chờ trong đợt này.
- Baseline và lượt cuối được đo production bằng cùng Chrome/CPU throttle 4×, 390×844 và 1440×1000; không chạy browser kiểm thử khác đồng thời. JSON `.logs/performance-{baseline,verified}-isolated-20261107/result.json`; số tải đầu có ảnh hưởng mạng nền bản đồ nên không coi là cam kết SLA/FPS.

| Đo cùng kịch bản | Mobile trước → sau | Desktop trước → sau |
| --- | --- | --- |
| Home có hero sẵn sàng | 9.223 → 2.389 ms | 9.472 → 2.327 ms |
| Yêu cầu chi tiết cả nước sau lọc | 19 → 0 | 19 → 0 |
| P95 khoảng cách rAF trong lượt tải/lọc/cuộn | 350 → 150 ms | 584 → 167 ms |

P95 ở đây là phép đo stress toàn lượt gồm tải bản đồ, không phải FPS cuộn ổn định; script ghi cả long tasks/bytes để không suy diễn từ một con số. Không tuyên bố đã đạt 60 FPS ở mọi thiết bị.

Phần còn thưa và nguồn chưa xác minh được liệt kê trong hồ sơ nghiên cứu. Giờ/giá/review Google trực tiếp, routing/GPX và engine xếp lịch đầy đủ không được tuyên bố đã có chỉ vì UI đã hoàn thiện hơn.
