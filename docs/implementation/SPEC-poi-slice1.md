# PlaceRecord — lát 1: POI backend

Căn cứ: DR-031 (30/10/2026), DR-025/026, `place-record-design.md` §2–7; lưu JSON theo phương án A/ADR-010. Phạm vi là đọc POI, chưa tính khung bữa ăn hay ghi lịch.

## Dữ liệu nhập ngoại tuyến

Nguồn: `docs/research/da-lat-poi-trial/pois.json`, lấy lúc **2026-10-29T02:34:26.802Z**, dữ liệu OSM lúc **2026-10-29T02:23:30Z**, bbox `11.88,108.36,12.02,108.53`.

| Loại chuẩn hóa | Trước | Có tên, trước gộp | Sau gộp |
|---|---:|---:|---:|
| food (restaurant) | 399 | 316 | 314 |
| cafe | 331 | 256 | 256 |
| fast_food | 54 | 38 | 37 |
| bar (bar/pub) | 29 | 20 | 20 |
| other (ice_cream/loại khác) | 4 | 1 | 1 |
| Tổng | **817** | **631** | **628** |

Bỏ 186 đối tượng không tên; gộp 3 nguồn. Giữ nguồn nhiều tag nhất, hòa theo khóa `type/id`; tên so Unicode NFC, không phân biệt hoa/thường, gom khoảng trắng, **không bỏ dấu hay từ**. Khoảng cách tới nguồn được giữ ≤50 m; không gộp dây chuyền vượt ngưỡng. Đây là quy tắc batch được giao riêng trong lát 1; không coi kết quả là review xác nhận cùng cơ sở. `mergedFrom` giữ type/id, URL, tọa độ và toàn bộ tag để có thể xem lại/tách nguồn.

Ba nguồn gộp: Ga Ran Popeyes Chicken (`node/13590791001` → `node/13590773501`), BBQ (`node/13593119305` → `node/13593119304`), Pizza Chorio (`node/5865318885` → `node/6552761486`). Hai tên Tùng khác nhau vẫn giữ riêng.

Id `poi-da-lat-<osmType>-<osmId>` không phụ thuộc tên, phân biệt node/way trùng số. Đây là batch snapshot cố định; refresh đổi nguồn đại diện hoặc node thành polygon cần review alias trước khi phát hành batch mới, chưa có cơ chế tự chuyển danh tính. Dữ liệu OSM gộp chưa được nâng thành hồ sơ Discover.

105/628 có `openingHoursRaw`; 523 thiếu, trả null/UNKNOWN. Có raw thì RAW, giữ nguyên chuỗi, kể cả khoảng trắng. Mọi POI là `SNAPSHOT_UNVERIFIED`; raw không chứng minh đang mở hoặc còn hoạt động. Provenance theo từng trường có dữ kiện giữ OSM URL, ngày snapshot, thời điểm nguồn, **ODbL-1.0**, liên kết giấy phép và **© OpenStreetMap contributors**. Trường thiếu không được bù từ thương hiệu/nguồn khác. Chỉ nhận tag `wikidata`, không dùng `brand:wikidata`.

## Quyết định triển khai trong hướng đã duyệt

- `PlaceRecord` giữ danh tính/dữ kiện nền; `PoiRecord` là mô hình đọc rộng, qua cổng `PoiCatalog` riêng. Không hạ bất biến ảnh của `Place` hoặc thay hợp đồng Discover. Không thêm bảng/Flyway/dependency.
- Tài nguyên `catalog/poi/da-lat.json` do `node tools/catalog/build-poi.mjs` sinh, không gọi mạng/đồng hồ. Dữ liệu giống nhau sinh cùng byte; thống kê và cảnh báo chưa xác minh nằm cả trong tệp và đầu ra lệnh.
- Tọa độ lưu `[lat,lon]` ở `center`; node là `point`, polygon là `center`. Tâm Đà Lạt lấy đúng mốc chính catalog **11.9404,108.4583**, phạm vi batch **15.000 m** bao snapshot, kiểm fail-fast. Bán kính batch khác trần truy vấn. Địa chỉ chỉ ghép các tag `addr:*` có sẵn, không khẳng định đủ số nhà/đường.
- Adapter kiểm nguồn, loại, trạng thái giờ, provenance, danh tính không trùng, ngày batch và bán kính khi khởi động; tài nguyên sai không được âm thầm bỏ qua. Domain thuần Java, không import identity/planning. Chưa đo latency/bộ nhớ chạy Java.

## API cộng thêm

`GET /api/catalog/destinations/{id}/poi?kind=food|cafe|rest|all&near=lat,lon&radiusM=2000&limit=20`

Phản hồi `{ "poi": [...] }`; mỗi phần tử có `id,name,kind,lat,lon,distanceM,address,openingHoursRaw,openingHoursStatus,phone,website,verificationStatus,attribution`. Attribution gồm nguồn/URL, ngày snapshot, giấy phép/URL và credit. Không gửi toàn bộ provenance trong danh sách; giữ nguồn đầy đủ trong tài nguyên. Không ảnh/rating/nhãn đang mở.

Default `kind=all`; thiếu near dùng tâm batch. `food` chỉ food/fast_food, `cafe` chỉ cafe; `rest` cũng chỉ cafe, không phải khách sạn hoặc loại POI mới và chưa khẳng định cafe có bữa chính. Khoảng cách haversine **chim bay, mét chưa làm tròn**; lọc ≤radius, sắp tăng rồi id, sau cùng áp limit. Radius 1..5000 m, limit 1..30; vượt trần trả 400, không tự mở rộng. Chưa có batch trả 200/danh sách rỗng, kể cả mã điểm đến lạ; endpoint chi tiết điểm đến cũ vẫn 404 như trước.

Tham số sai trả `ApiError` hiện có: `MALFORMED` cho định dạng/loại sai, `OUT_OF_RANGE` cho vượt giới hạn, kèm `field`. Chuỗi query chặn ở 80 ký tự trước parse. `PoiSearch` là record được kiểm thủ công; repo chưa có Bean Validation, lát này không thêm dependency. Dùng cùng `RateLimits.catalog(ClientAddress.of(...))`, kể cả query sai; quá hạn mức trả 429/RATE_LIMITED. Route thuộc mẫu công khai `/api/catalog/**` hiện có, không sửa permissions.

**Việc tích hợp ngoài ownership:** Claude cần thêm `GET /api/catalog/destinations/{id}/poi` vào tập `PUBLIC` và cập nhật mô tả số route tại `backend/src/test/java/com/wander/identity/SecurityIT.java`; mẫu security thực tế đã cho phép nhưng test kiểm kê hiện coi route mới là riêng tư. Worker không sửa tệp đó.

## Kiểm tra và lát 2

Test viết trước implementation: `PoiRecordTest`, `PoiApiIT`, `build-poi.test.mjs`. Node chạy RED khi chưa có module, sau đó GREEN 5/5. Bổ sung `PoiQueriesTest`, `PoiDataTest`, `PoiRateLimitIT` cho thứ tự/lọc/biên, fail-fast tài nguyên và hạn mức chung. Log ở `.logs/poi-slice1/`.

Backend **NOT_RUN** theo giới hạn sandbox: chưa chứng minh biên dịch, JUnit/IT, ArchitectureTest, Checkstyle hay JaCoCo đạt; chưa tái hiện RED backend bằng chạy thật. Claude cập nhật kiểm kê route rồi chạy `powershell -ExecutionPolicy Bypass -File tools/dev.ps1 verify` tại môi trường Gradle/Docker. Kiểm tĩnh Node chỉ hỗ trợ đọc mã, không thay các cổng này.

Lát 2: FE “Thêm bữa trưa” gọi API quanh các điểm trong ngày, giữ bảng tra id/tọa độ POI riêng, hiển thị ghi công và chưa xác minh giờ. Preview/chọn/đổi quán, tính khả thi lịch và lưu/Undo nguyên tử thuộc các lát sau; API này chưa cung cấp những khả năng đó. Parser giờ, rating và duyệt ảnh vẫn để sau; WoodStock/Le Café không có ảnh được nhập Discover trong lát này.

Công cụ đã dùng: skill `wander-implement`, skill `test-driven-development` (đọc SKILL.md), apply_patch, PowerShell/Node/git chỉ đọc trạng thái/diff. Graph MCP không khả dụng; không delegate/commit/push/deploy.
