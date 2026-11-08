# Tinh chỉnh chuyển ảnh, xếp ngày và dữ liệu — 06/11/2026

Yêu cầu hiện tại của PO: giữ UI/màu vừa duyệt; sửa ảnh nhấp nháy, logic xếp ngày và preview, tăng bìa lịch; đối chiếu rule/kiến trúc; mở rộng địa điểm, món ăn và trải nghiệm có nguồn trên cả nước. Đã có ủy quyền chạy các công việc thông thường, không hỏi lại từng bước.

## Căn cứ và ranh giới

- DR-007: gom điểm gần nhau là gợi ý, xem trước/chấp nhận/bỏ/Hoàn tác; không tự xếp mục đang chờ duyệt xóa, không hứa gần nhau khi thiếu tọa độ.
- D16, DR-006/011/018: giữ ngày/thứ tự/giờ người dùng đã chọn; chỉ xếp mục chưa có ngày. Nghỉ do người dùng thêm. Một lần áp dụng dùng schedule nguyên tử, giữ 409/Undo.
- DR-025/031 và place-record-design §4: có nhu cầu ăn/nghỉ, dùng nguồn OSM; dữ kiện khác giả định; không đổi cafe thành quán bữa chính, không suy giờ/giá/nổi tiếng. Không gọi heuristics FE hiện tại là engine khả thi thời gian đầy đủ của thiết kế.
- DR-032: giờ mở cửa chưa parse thì vẫn raw/unknown; không thêm parser LGPL hoặc lấy rating bên ngoài. DR-034: ảnh thật có nguồn, đúng nơi/đúng món, không gán ảnh vùng cho một quán.
- TripPace hiện là nhãn theo quyết định cũ, không tự biến thành luật phân ngày. Không đổi schema, module/aggregate hay thêm dependency để sửa UI/heuristic. Không sửa master plan, không deploy/push.

## Các lát và điều kiện hoàn thành

1. **Chuyển ảnh:** tái hiện bằng mạng chậm và thao tác liên tiếp; giữ ảnh đang xem trong lúc giải mã ảnh mới, bỏ kết quả tải đã lỗi thời, crossfade opacity ngắn, reduced-motion tức thì; nguồn ảnh theo ảnh thật sự đang hiển thị; không nháy skeleton mỗi lần chuyển.
2. **Xếp ngày:** test đỏ trước sửa. Tính di chuyển liên điểm bằng cùng ước tính của app, tính cả mục đã có ngày; thời lượng thiếu không biến thành 0 phút. Không dồn vô hạn vào ngày cuối; phần chưa vừa vẫn ở Chưa có ngày và có lý do trong preview. Không tự dời booking, giờ hay mục đã xếp. Giữ cung nhiều ngày/chưa rõ tuyến để tự chốt. Đối chiếu pending deletion và quyền Organizer.
3. **Preview/bìa:** dùng cùng kính, khoảng cách, nút và icon với màn lịch vừa duyệt; thẻ ngày có ảnh/địa điểm/di chuyển/thiếu dữ liệu dễ đọc, đổi ngày ngay trên hàng; nút Áp dụng/Hủy cố định; bìa lớn hơn vừa phải. Kiểm cả mobile/desktop.
4. **Dữ liệu:** thống kê trước/sau theo từng điểm đến và loại; thêm địa điểm thật cho các nơi đang ít, món ăn và trải nghiệm có nguồn. Điểm/ảnh cũ được giữ. Món muốn thử không phải quán đã xác minh; ảnh món chỉ minh họa món, ghim khu vực phải ghi rõ. Xu hướng ghi bằng chứng và ngày nghiên cứu, không bịa số lượt/độ hot. Giữ hai lớp POI/Discover.
5. **Kiểm chứng:** unit/architecture phù hợp; trình duyệt trên backend thật, mạng chậm, rapid next/previous, preview/apply/Undo và dữ liệu giữ sau reload. Chụp các màn thay đổi; báo các giới hạn thật, không tính mock/thông tin chưa xác minh là đã hoàn thiện.

## Phát hiện ban đầu (trước sửa)

- RevealImage đổi src trực tiếp rồi đặt opacity 0, chờ decode mới fade từ 0; PlaceMedia còn remount ảnh theo URL và khởi động shimmer lại: mất ảnh cũ trong lúc chờ.
- planPreview chỉ cộng thời lượng tham quan, chưa cộng di chuyển; mục food/rest thiếu thời lượng có trọng số 0; ngày cuối nhận mọi phần dư. Tests cũ còn hợp thức hóa việc dồn quá tải.
- Preview chưa đọc pending deletion. API schedule chung kiểm organizer, range, live item và phiên bản; không có khái niệm riêng về nguồn auto suggestion.
- Kho Discover: 20 điểm đến, 166 thẻ, chỉ 1 thẻ ẩm thực ở Hà Giang; nhiều nơi chỉ 3–4 thẻ. POI quán ăn hiện chỉ có ở 5 điểm đến. Số sau bổ sung và trạng thái test cuối sẽ cập nhật sau khi chạy.

## Công cụ

Các skill local spec-driven-development, planning-and-task-breakdown, systematic-debugging, test-driven-development, ui-ux-pro-max, wander-verify; tự review theo kiến trúc repo. Không có tool code-review-graph trong phiên; đọc source/test trực tiếp. Không gọi Claude hay subagent.

## Kết quả triển khai

- Ảnh: một `img` được giữ tới khi ảnh yêu cầu đã decode; lớp ảnh cũ crossfade 160 ms, bỏ kết quả tải lỗi thời. Ảnh ban đầu chờ chính thẻ `img` nên vẫn giữ native lazy loading; reduced-motion không tạo lớp chạy hiệu ứng. Gallery không remount theo URL, ghi công theo ảnh đang hiển thị.
- Gợi ý ngày: chỉ xếp mục chưa có ngày và có vị trí đủ cụ thể. Giữ booking/giờ hẹn chưa có ngày, pending deletion, cung dài/chưa rõ tuyến và ý tưởng `exp-*` có mốc khu vực để người dùng quyết định. Tính cả thời gian tại điểm và chặng tiếp cận/liên điểm; không dồn phần dư vào ngày cuối. Lựa chọn ngày tường minh trong preview tính lại tổng/cảnh báo. Ngày cũ quá dày cũng có cảnh báo, vẫn giữ nguyên dữ liệu.
- Ngưỡng mặc định 6 giờ tại điểm/8 giờ tổng là giả định của gợi ý, không phải lịch khả thi đã được xác minh. Một hoạt động dài có thể đứng riêng. Hệ số đường/tốc độ giữ 1,5 và 25 km/h đang có trong app. Chưa biết chỗ nghỉ thì nối từ mốc cuối ngày trước, có báo thiếu vị trí/thời lượng. Không suy mật độ lịch từ nhãn `TripPace`.
- Lưu: dùng schedule nguyên tử hiện có, kiểm Organizer, đọc lại pending trước khi áp dụng, chặn bản nháp đã cũ; đóng sau khi server thành công, lỗi giữ bản nháp. `JpaTripRepository.save` dùng `OPTIMISTIC_FORCE_INCREMENT` trên aggregate: đề nghị xóa phát sinh sau lượt kiểm tra vẫn làm phiên bản lịch cũ bị server từ chối. API di chuyển thủ công không đổi nghĩa.
- UI: preview cùng hệ kính, token và nút của lịch; ảnh/nhãn ngày, ước tính tại điểm/đường đi, lý do giữ lại, chọn ngày tại từng hàng và chân hành động cố định. Thu gọn các ngày đã có lịch để lộ phần gợi ý. Mở chi tiết địa điểm trong lớp phủ, đóng lại giữ bản nháp. Bìa lịch tăng chiều cao 128 → 176 px.

## Dữ liệu và nghiên cứu

- 20 điểm đến; **166 → 253** thẻ Discover, **1 → 40** thẻ ẩm thực; **323 → 413** tham chiếu ảnh địa điểm; **107 → 127** khoảnh khắc.
- POI phụ trợ mở rộng từ 5 lên **20 điểm đến, 11.653 bản ghi** có tên. Đây là snapshot OSM chưa xác minh hiện trạng, không phải 11.653 địa điểm đã được Wander review; không trộn vào số thẻ Discover. Cà phê/bar không biến thành quán bữa chính. Mỗi batch giữ tâm, phạm vi và provenance riêng; một số khu đông dùng phạm vi 5 km để lấy dữ liệu ổn định, các nơi khác tối đa 15 km.
- Món ăn là ý tưởng theo vùng có mốc khu vực, ảnh minh họa đúng món đã xem, chưa phải quán đã xác minh. Các món chưa có ảnh phù hợp vẫn được đưa vào cẩm nang, không lấy ảnh nguyên liệu/động vật sống/món khác để lấp.
- Thêm điểm biển/văn hóa/hang động và trekking. Ngũ Chỉ Sơn dùng đúng đối tượng `peak` từ OSM, loại tọa độ xã trong lượt mới. Ảnh Hoa Lư đổi từ sơ đồ sang ảnh thực tế. Ảnh Kỳ Co chưa đủ chắc về địa điểm được giữ ngoài app.
- Nguồn vùng: Vietnam Tourism, cổng du lịch địa phương, báo Sơn La/Quảng Ninh; tọa độ Wikipedia/Wikidata/OSM; ảnh Commons có tác giả/giấy phép/trang gốc. Chủ đề ẩm thực, thủ công, đi chậm/thiên nhiên dựa nghiên cứu có ngày; không gắn số lượt hay bảng “hot” thời gian thực. Booking Travel Predictions 2026 là khảo sát ý định toàn cầu, không dùng như thống kê nhu cầu riêng Việt Nam.
- Bảo toàn **PASS** toàn bộ thẻ cũ, bìa cũ, khoảnh khắc cũ và phần nội dung cẩm nang cũ. Không sửa lịch mẫu đã duyệt. Chi tiết trước/sau và nơi còn thiếu ảnh: `docs/research/catalog-enrichment-audit-20261106.json`; nguồn món/ý tưởng: `food-experiences-20261106.json`; quyết định tuyển ảnh: hai manifest `*-photo-candidates-20261106.json`.

## Giới hạn sản phẩm còn thật

Engine server kiểm bữa ăn, giờ hẹn, giờ mở cửa và tuyến đi đầy đủ của DR-025/031 vẫn chưa được triển khai trọn vẹn trong phạm vi này. Giờ OSM còn raw/unknown; thời gian đi là ước tính, không phải routing/GPX hay kiểm tra tuyến trekking đang mở. Google reviews/API bên ngoài không được thêm. Các giới hạn này phải giữ rõ trong UI và khi báo kết quả; không gọi heuristic mới là engine hoàn chỉnh.

## Kiểm chứng

- Unit frontend cuối đợt 06/11: 422/422 qua; có test đỏ tái hiện rồi xanh cho ảnh, sức chứa/di chuyển và bản nháp gợi ý sau lỗi lưu. Lint và production build qua.
- Trình duyệt production: mạng chậm, thao tác lùi khi đang tải, reduced-motion, native lazy; preview/áp dụng/Undo/reload/lưu lỗi/đổi ngày; pending deletion tạo bởi thành viên thật được kiểm lại trước schedule. Ảnh mobile và desktop không tràn ngang, chân nút nằm trong viewport.
- Backend lần đầu bắt được nhãn độ khó mới dài quá hợp đồng 20 ký tự; đã rút gọn dữ liệu, không nới giới hạn domain. Test giấy phép cũ chỉ kiểm Hà Giang và chưa nhận Pexels đã duyệt: cập nhật để kiểm tất cả điểm đến, giữ danh sách giấy phép CC cụ thể và bắt đúng trang ảnh nguồn với Pexels.
- Testcontainers trên Docker Desktop bị timeout ở bước initdb; dùng tmpfs riêng cho PostgreSQL tạm của tests. Cache Spring context giới hạn 2 và heap test 1 GB tránh giữ nhiều bản kho toàn quốc trong hàng chục context. Đây là cấu hình test, không đổi runtime/volume/CSDL review. Toàn bộ backend suite đã PASS; chạy lại 07/11 cũng **359 ca PASS** (`.logs/performance-backend-tests.log`).
- Kết thúc kiểm browser: bốn ca planner đều qua, gồm giữ lựa chọn sau save lỗi, pending tạo thật bởi thành viên và mở chi tiết không mất draft. Ba ca motion qua sau khi cô lập ảnh lazy khỏi yêu cầu sprite bản đồ. Hành trình thật 9 bước trên hai cỡ màn đã PASS. Đợt tiếp theo và bằng chứng mới: `performance-onboarding-expansion-2026-11-07.md`.
