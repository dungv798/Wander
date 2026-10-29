# PlaceRecord và gợi ý ăn, cà phê, nghỉ trong lịch

Ngày: 29/10/2026. **PROPOSED — thiết kế chi tiết để PO duyệt, chưa phải quyết định triển khai.** Phiên này chỉ viết tài liệu, không sửa mã, DB, dependency hay nhập dữ liệu. DR-025 đã duyệt làm gợi ý bằng OSM, rating Wander để sau; DR-026 đã chọn PlaceRecord chung, provenance từng trường, DiscoverProfile tùy chọn và giờ raw + chưa biết. Các lựa chọn lưu trữ, ranh giới chi tiết và API dưới đây vẫn cần duyệt ở nơi ghi Tầng A.

## 1. Bài toán, dữ liệu và ràng buộc

Lịch cần cả tham quan lẫn ăn/nghỉ. Ta cần tìm được quán gần đoạn đang đi, giải thích vì sao gợi ý, cho đổi quán và giữ lịch khả thi. Ảnh đẹp không chứng minh đúng chi nhánh; thiếu ảnh không làm quán mất giá trị tìm kiếm. Vì thế có hai lớp trên cùng danh tính: **POI OSM rộng** cho tìm/gợi ý; **Discover** chỉ có hồ sơ đủ nội dung và ảnh được duyệt.

### 1.1. Bằng chứng đã đọc

| Nguồn trong repo | Điều xác nhận được |
|---|---|
| [DR-025](../decisions/DR-025-rating-va-goi-y-an-uong-nghi-29-10.md), [DR-026](../decisions/DR-026-ban-do-chi-duong-schema-poi-29-10.md) | Hướng sản phẩm đã duyệt; thiết kế chi tiết schema phải trình trước code; chưa nhập mẫu vào catalog/DB. Không Google rating, không cào Google/TripAdvisor; chỉ liên kết ra Google Maps. |
| [VERIFY-MATCHES](../research/da-lat-poi-trial/VERIFY-MATCHES.md), Phần 1, §2 và Quyết định cho PO | Snapshot 817 đối tượng chưa dedupe; bằng chứng live có giới hạn; nhận diện lịch sử tách khỏi tình trạng hoạt động và duyệt ảnh. |
| [ADR-010](adr/ADR-010-module-catalog.md), [README kiến trúc](README.md), [backend-conventions](backend-conventions.md) | Ba module identity/planning/catalog; catalog hiện chỉ đọc JSON classpath, không bảng DB; domain thuần Java, CQRS, module không import nhau. Sơ đồ README còn mô tả hai module; dùng ADR-010 cho catalog. |
| [data-needs](../ux/data-needs.md), §1–2b | Nhu cầu mục tự do/Rest, giờ/thời lượng tùy chọn, lịch nguyên tử/Undo, catalog biên tập. Một số dòng “thiếu” là ảnh chụp thiết kế cũ, không kết luận backend hiện vẫn thiếu khi mã đã có. |
| [planDays.ts](../../web/src/features/trips/model/planDays.ts), [TripSheets.tsx](../../web/src/features/trips/components/TripSheets.tsx), [tripsActions.ts](../../web/src/features/trips/hooks/tripsActions.ts) | Xếp mục chưa có ngày, xem trước, áp dụng qua Undo; chưa thêm quán/Rest. |
| [CatalogViews.java](../../backend/src/main/java/com/wander/catalog/application/view/CatalogViews.java), [Place.java](../../backend/src/main/java/com/wander/catalog/domain/model/Place.java) | PlaceView có lat/lon nullable, duration chuỗi, bestSlots, ảnh; Place bắt buộc ảnh và trường biên tập. ReferenceView backend đã có tọa độ dù comment FE còn nói thiếu. |

### 1.2. Có gì, thiếu gì?

Theo VERIFY-MATCHES §2.3, snapshot bbox Đà Lạt ngày 29/10/2026 có **111/817 = 13,59%** có tag `opening_hours`; **706/817 = 86,41%** thiếu. Đây là độ đầy đủ tag của mẫu, không phải tỷ lệ quán thực tế mở cửa hay độ đúng của giờ.

| Loại | Số đối tượng | Có giờ | Tỷ lệ |
|---|---:|---:|---:|
| restaurant | 399 | 53 | 13,28% |
| cafe | 331 | 47 | 14,20% |
| fast_food | 54 | 5 | 9,26% |
| bar | 28 | 6 | 21,43% |

Năm đối tượng còn lại là pub/ice_cream. Có `addr:*` chưa chắc đủ số nhà và đường; nhiều quán thiếu tên, liên hệ, cuisine. Mẫu chưa cung cấp thời lượng ăn, bữa nào phục vụ, giá đáng tin hay rating Wander. Không suy ra những trường này từ tên quán hoặc tạo số sao/giá giả. `away` của PlaceView là ước tính từ mốc tham chiếu, không phải ma trận đi lại giữa các điểm.

`planDays` hiện lấy `unassignedItems`, đi từ hub theo điểm gần nhất bằng `airKm`, để mục thiếu tọa độ cuối, chia theo số mục với tải ngày sẵn có. `coordOf` chỉ tra `DestinationDetail.places`; `hubPoint` chỉ xét reference đầu. OverviewTab mở overlay → AutoPlanSheet gọi planDays → actions.applyPlan lọc mục còn chưa có ngày → HttpTripsGateway gửi `/schedule`. Backend PlanningCommandHandler kiểm Organizer và gọi `Trip.assignDays` trong giao dịch; Trip kiểm toàn bộ assignments trước khi đổi. Đây là lưu lịch, chưa phải máy đề xuất quán.

Giờ và thời lượng mục hiện tùy chọn. Không thể hứa “không vượt giờ” bằng cách chỉ đếm mục. Tuyến vẫn **ước tính** theo DR-026; hệ số đường núi 1,5 và tốc độ 25 km/h trong `shared/lib/geo.ts` là giả định hiện có, không phải số đo đường thực tế.

## 2. Mô hình miền đề xuất

Aggregate là ranh giới giữ bất biến, không đồng nghĩa một bảng. Value object là giá trị bất biến tự kiểm tra hợp lệ. Read model là hình dạng dữ liệu phục vụ màn hình, có thể ghép nhiều nguồn mà không buộc màn hình biết aggregate.

### 2.1. PlaceRecord trong catalog

Đề xuất PlaceRecord là aggregate root sở hữu danh tính cơ sở, dữ kiện được chọn và bằng chứng của chúng. Nó không chứa lịch riêng của người dùng; Trip vẫn thuộc planning. Không mở API quản trị trong lát này.

| Thành phần/VO | Dữ liệu và bất biến đề xuất |
|---|---|
| PlaceId | Slug nội bộ ổn định, giữ nguyên id catalog cũ; đổi tên không đổi slug. Với bảng mới, UUID v7 làm khóa kỹ thuật theo DB-3, slug là khóa nghiệp vụ duy nhất và là id API; không đổi `placeId` của lịch sang UUID. |
| ExternalIdentity | `osmRefs[{type,id}]` với type node/way/relation và id nguồn; `wikidataQid` nullable, đúng cơ sở/chi nhánh. Khóa nguồn là namespace + type + id, không chỉ số. Không có QID không làm record vô hiệu. |
| IdentityFacts | destinationId, tên, tên khác, địa chỉ cấu trúc/hiển thị, phone/website tùy có; giá trị thiếu là unknown, không bù từ thương hiệu. |
| GeoLocation | lat/lon cùng có hoặc cùng thiếu, WGS-84 đúng phạm vi; kind point/center/entrance, accuracyMeters nullable. Không tự dùng tọa độ khách sạn cho quán. |
| ServiceClassification | category giữ mã hiện có (`am` cho ăn/uống); foodKind restaurant/cafe/fast_food/bar/pub/ice_cream; cuisine, dietary, mealServices có nguồn hoặc unknown. Cafe không tự mặc định phục vụ bữa chính. |
| VisitDuration | durationMin số và nguồn/nhãn ước tính; nullable. Chuỗi duration Discover chỉ để hiển thị, không parse ngược “1–2 giờ” thành số giả. |
| OpeningHours | raw nguyên văn, timezone IANA, parseStatus, checkedAt/evidenceRef. Asia/Ho_Chi_Minh là timezone địa điểm, không dùng timezone máy khách. |
| Verification | matchStatus CONFIRMED/LIKELY/UNVERIFIED/REJECTED và evidenceRefs; operatingStatus unknown/active/temporarily_closed/closed tách riêng. CONFIRMED danh tính không nghĩa hiện đang mở. |
| FieldAssertion | assertionId, fieldPath, value, sourceKind, sourceUrl/objectId/version/timestamp nếu có, retrievedAt, license, status, confidence có lý do, reviewer/verifiedAt tùy có. `selectedAssertionId` của mỗi trường phải trỏ bằng chứng cùng trường; giữ cả phương án xung đột. |

`FieldAssertion.status` dùng unverified/corroborated/conflicted/rejected; confidence là nhãn có lý do, không phải xác suất đo được. Khi chọn địa chỉ 200 Nguyễn Công Trứ theo nguồn chính thức cho Là Việt, vẫn giữ assertion OSM 198 và ghi lý do chọn; không sửa mất nguồn. Không một cờ `verified=true` chung che hết các trường còn yếu.

Một source ref chỉ gắn một record chuẩn sau review; refresh cùng type/id phải idempotent. Chuẩn hóa tên và khoảng cách chỉ tạo ứng viên duplicate. Không tự merge Tùng 4070796725 và 6152520385 vì cách 48,4 m; QID thương hiệu hay số điện thoại chung chuỗi cũng chưa đủ. Nếu review xác nhận merge, giữ alias id cũ, toàn bộ nguồn và quyết định để tra lại; không gán ảnh của quán cũ cho cơ sở mới cùng địa chỉ. Cách lưu alias/chuyển liên kết cần PO duyệt cùng schema.

“Nghỉ” là nhu cầu trong planning: `rest` có thể không có placeId. Quán cà phê dùng cho nhu cầu nghỉ vẫn là cafe, không đổi thành lưu trú (`luu`) hay loại địa điểm “rest” mới. Bữa/cà phê gắn quán ánh xạ sang item `food`; khung nghỉ thuần sang `rest`, ăn tự do sang `food` không placeId. `breakfast/lunch/dinner/coffee/rest` là loại khung đề xuất, không thay enum ItemType hiện có.

### 2.2. DiscoverProfile và ảnh

Đề xuất DiscoverProfile là thành phần tùy chọn do PlaceRecord quản lý, cùng id, không có danh tính quán riêng. Nó chứa area, hook, summary, highlights, tips, tháng đẹp, verdict/reasons, bestSlots/slotReason và ảnh biên tập. Sau này nếu workflow quản trị có vòng đời độc lập mới cân nhắc tách aggregate (Tầng A). Hiện không tự thêm module.

Điều kiện xuất Discover: đủ bất biến của Place hiện tại, ảnh `approved`, ghép đúng cơ sở được reviewer duyệt và nội dung được duyệt. Không hạ gate ảnh của Place để nhét mọi POI rộng vào. Adapter có thể dựng Place/PlaceView từ profile hợp lệ, giữ hợp đồng cũ; POI rộng dùng read model khác.

Provenance ảnh giữ source page/original URL, Commons title/pageId/revision nếu biết, local file/hash/kích thước, author/credit, licenseExact + licenseUrl, ngày chụp raw + nguồn ngày, ngày upload, tọa độ + nguồn tọa độ, retrievedAt; venueMatch/evidenceRefs, approval pending/approved/rejected, reviewer/reviewedAt, usageRole cover/interior/detail và edits. Đọc metadata snapshot không được nâng thành đã kiểm EXIF/live. Không lấy ngày upload làm ngày chụp.

DR-026 giữ WoodStock/Le Café ngoài Discover tới khi xác minh; không dùng ảnh cũ chứng minh còn hoạt động. Là Việt có ghép địa lý lịch sử tốt nhưng địa chỉ xung đột và chuỗi CC0 cần review; ảnh Tùng mới LIKELY. Phiên này không duyệt ảnh nào. Attribution OSM và giấy phép từng ảnh là hai nguồn khác nhau; giữ thông tin theo VERIFY-MATCHES, chưa tái thẩm định điều khoản live trong phiên này (**UNVERIFIED**).

Rating Wander tương lai là concern riêng có quyền chấm/kiểm duyệt/riêng tư; không tạo aggregate/bảng rating lúc này. Chưa có đánh giá dùng unknown/null, không số 0, không dùng verdict biên tập hay số ảnh làm rating. Không nhập Google rating.

### 2.3. Lưu ở đâu: ba phương án để PO chọn

ADR-010 hiện là JSON chỉ đọc, fail-fast khi sai; định nghĩa mô hình mới không tự cấp quyền chuyển catalog sang DB.

| Phương án | Cách làm | Lợi ích | Chi phí/đánh đổi, điều học được |
|---|---|---|---|
| A. Giữ JSON mở rộng | Thêm kho PlaceRecord rộng và profile cùng id qua adapter classpath; catalog cũ vẫn đọc được | Gần ADR-010 nhất; review diff rõ, không migration; phù hợp lát đầu chưa quản trị | JSON lớn/provenance khó review, nạp lúc khởi động, cập nhật cần phát hành; học schema validation, mapping và port/adapter trước khi học JPA. Cần PO duyệt schema JSON và nhập dữ liệu. |
| B. DB catalog mới | Bảng place_record, external_identity, field_assertion, discover_profile/photo_evidence; JSON cũ chuyển có đối chiếu | Unique/index, lọc địa lý và sửa từng record tốt hơn; nền cho quản trị | Flyway, mapping, kiểm truy vấn/N+1, workflow cập nhật và migration khó hơn; thay quyết định catalog chỉ đọc. Học JPA/CQRS giống dạng nghiệp vụ enterprise PO luyện ở FPT. |
| C. Lai | DB giữ record/evidence rộng; JSON tiếp tục giữ nội dung biên tập/profile; ghép bằng slug | Giữ quy trình biên tập, mở rộng tìm quán bằng DB | Hai nguồn có thể lệch id/phiên bản; cần ownership từng trường, validator liên kết, không dual-write cùng trường. Học ghép read model và nhất quán giữa nguồn, nhưng vận hành phức tạp nhất. |

**Khuyến nghị, không phải quyết định:** A cho lát đầu có giới hạn và chưa admin; đặt port/read model để có thể chuyển B khi có nhu cầu cập nhật thường xuyên hoặc số đo buộc đổi. C chỉ khi cần giữ biên tập trong repo trong lúc POI đã cần DB. 817 đối tượng tự nó không chứng minh cần PostGIS/index không gian hay đủ hiệu năng JSON; latency/bộ nhớ còn **UNVERIFIED**, phải đo trước chọn ngưỡng. Khi dùng B, khóa UUID/slug tuân DB-3, không FK sang planning theo DB-4; một giao dịch sửa một aggregate theo DOM-4.

Liên hệ FPT ở đây là bài học theo stack PO đã nêu: tách domain/entity/DTO, query projection thay nạp aggregate, Flyway expand/contract, truy nguồn dữ liệu. Quy trình và hệ thống cụ thể tại FPT **UNVERIFIED**; đây không phải mô tả nội bộ công ty.

## 3. Read model và API cộng thêm cho FE

Tất cả tên endpoint/trường mới dưới đây là **đề xuất**, chưa tồn tại. Giữ nguyên PlaceView, PhotoView, DestinationDetail.places và `/schedule`; không đổi duration chuỗi, không thêm category bắt buộc, không đưa POI thiếu ảnh vào danh sách Discover cũ.

| Hợp đồng thêm | Dữ liệu/cách dùng |
|---|---|
| `GET /api/catalog/places` | Lọc destinationId, bbox hoặc near/radius, foodKind, cursor/limit có trần. Trả `PlaceCandidateView`: id, name, category, foodKind, lat/lon, address nullable, mealServices/known flag, durationMin nullable, openingHours raw/timezone/parseStatus, operatingStatus, verificationSummary, discoverAvailable, approvedPhoto nullable, attribution. Không trả toàn bộ evidence trong danh sách. |
| `GET /api/catalog/places/{id}` | Chi tiết rộng + provenance tóm tắt theo trường, các xung đột và checkedAt; có thể trả liên kết hồ sơ Discover nếu đủ gate. Không buộc hình dạng PlaceView. |
| `POST /api/trips/{id}/meal-suggestions` | Tính preview không ghi: ngày/khung mong muốn, bounds, mốc giờ, nhu cầu, snapshot/version lịch và snapshot ứng viên có nguồn. Trả slots, alternatives, reasons, warnings, assumptions, unscheduled, algorithmVersion và catalogVersion. Kiểm quyền xem chuyến; không log nội dung chuyến. |
| `POST /api/trips/{id}/meal-plan-applications` | Sau PO duyệt: xác nhận preview, kiểm phiên bản/quyền và dữ liệu hiện hành; thêm mục + vị trí/giờ trong **một** giao dịch Trip. Có mã chống áp dụng lặp; trả id kết quả rồi query view theo CQRS. Undo đảo cả mục vừa tạo lẫn lịch bị đổi với kiểm phiên bản. |

FE giữ thêm bản đồ id → PlaceCandidateView cho POI rộng thay vì ép qua `cat.dest.places`; resolve tọa độ/tên dùng hai lớp cùng id. Trường dữ kiện mở rộng không bắt buộc với client cũ; FE mới chịu được server chưa có capability/404 endpoint mới và giữ xếp ngày cũ. Ảnh null có placeholder, không ảnh đại diện giả của quán khác. Raw giờ không được đổi thành chip “Đang mở” khi chưa đánh giá.

Preview cần `slotKey` ổn định theo ngày + loại khung + thứ tự, placeId nullable, start/end dự kiến hoặc null, durationMin/assumptions, travelEstimate, alternatives và lý do không chèn được. Không đánh dấu bữa đã lưu bằng so tên/title; cơ chế lưu nguồn suggestion/slotKey và idempotency là schema Tầng A. `/schedule` hiện chỉ gán mục có sẵn, không đủ để thêm quán rồi xếp nguyên tử; không ghép hai HTTP request và gọi đó là transaction.

Route công khai/quyền truy cập mới cần test theo SecurityConfig hiện hành khi triển khai; tài liệu này không đổi permissions. Quyền Organizer áp dụng lệnh xác nhận. Tài nguyên chuyến của người không có quyền trả lỗi theo APP-4; 409 khi phiên bản lịch thay đổi, không ghi đè chỉnh tay.

## 4. Thuật toán gợi ý và chèn khung

### 4.1. Đầu vào và phân biệt dữ kiện/giả định

Mỗi ngày có date (có thể tạm), timezone địa điểm, start/end nếu người dùng biết, điểm đầu/cuối hoặc hub; items gồm thứ tự, giờ, durationMin, booking, placeId, tọa độ, bữa/nghỉ đã có. Nhận nhu cầu breakfast/lunch/dinner/coffee/rest, cửa sổ mong muốn, thời lượng, nhịp độ và ngưỡng đi lệch. Lịch người dùng đã có giờ/đặt chỗ xem là mốc cố định trong preview; cờ khóa nếu cần lưu mới phải duyệt schema. Không tự dùng budgetK như mức giá quán khi không có giá quán.

Đầu vào thiếu giờ không bị biến thành 08:00–22:00. Có thể đề xuất nháp cửa sổ sáng/trưa/tối và duration theo nhịp độ, nhưng ghi rõ giả định và cho người dùng chấp nhận/chỉnh. Các con số default phải ở constants khi code và được review; tài liệu này không chốt giờ bữa hay số phút như dữ kiện thực tế.

### 4.2. Sinh ứng viên, chấm điểm và chọn

1. Tạo khung nhu cầu theo từng ngày, tránh trùng với bữa/nghỉ sẵn có. Mục `food` không rõ là bữa hay cà phê tạo cảnh báo để người dùng xác nhận, không suy ra chỉ từ category.
2. Tìm khoảng trống giữa hai mốc cố định; chọn điểm A trước và B sau khung, hoặc đầu/cuối ngày khi đã biết. Không có tọa độ thì không tuyên bố “quán gần”; trả khung tự do hoặc yêu cầu chọn khu.
3. Lọc quán đủ tên/vị trí và đúng nhu cầu có bằng chứng; quán không rõ phục vụ bữa chính chỉ là phương án chưa xác minh, không tự điền bữa chính. Cơ sở xác nhận đóng vĩnh viễn không vào gợi ý mới. Thiếu ảnh/giờ không bị loại. Tín hiệu đóng cửa chưa xác nhận tạo cảnh báo/hold review riêng, không tự nâng operatingStatus.
4. Với mỗi quán p, tính đi lệch và khả năng chèn, loại phương án vượt mốc cứng trước khi xếp hạng. Dùng ước tính liên điểm, không `away` từ hub.

Hàm điểm minh họa, **chưa hiệu chỉnh/chưa phải default đã chốt**:

```text
detour(p) = max(0, t(A,p) + t(p,B) - t(A,B))
score(p) = wMeal * mealFit + wTime * timeFit + wHours * hoursFit
         + wPhoto * approvedPhoto + wKnown * knownPopularity
         - wDetour * normalizedDetour - wRepeat * repeatPenalty
```

`mealFit` phản ánh dịch vụ đúng bữa từ evidence; `timeFit` phản ánh cửa sổ mong muốn/bestSlots, không đồng nhất “trưa” với đã xác nhận có cơm trưa. `hoursFit` dương khi đủ bằng chứng mở suốt khoảng ghé, âm khi có giờ đóng, trung tính khi unknown. `approvedPhoto` chỉ là ưu tiên phụ, không thắng nhu cầu bữa hay ngân sách thời gian. Không có độ nổi tiếng đáng tin trong mã/mẫu đã đọc: hiện `knownPopularity=0` kèm known=false cho mọi quán, không lấy Google rating, verdict hoặc số ảnh thay thế. Nếu sau này thêm tín hiệu nổi tiếng phải ghi nguồn, ý nghĩa và duyệt việc nhập; chưa dùng rating Wander tương lai.

Mọi thành phần chuẩn hóa để phút đi lệch không vô tình lấn hết tín hiệu khác. Trọng số, bán kính và ngưỡng là tham số có phiên bản; chưa có benchmark chất lượng, ghi **UNVERIFIED**. Hòa điểm sắp theo detour tăng rồi slug để preview ổn định. Trả lý do cụ thể “ít đi lệch, phù hợp cà phê; chưa xác minh giờ”, không trình điểm như xác suất quán tốt.

### 4.3. Quy tắc giữ lịch khả thi

Để chèn p giữa A và B, phải thỏa `end(A) + t(A,p) + visit(p) + t(p,B) + buffer <= start(B)` và giờ bắt đầu p nằm trong cửa sổ bữa. Cuối ngày thay B bằng mốc kết thúc ngày/điểm về nếu có. Tính bằng phút chưa làm tròn để hiển thị; kiểm cả thời gian quay về và mọi khung vừa chèn. Không tự dịch booking, kéo dài cuối ngày, rút ngắn mục người dùng hay đẩy mục sang ngày khác.

Nếu thiếu end(A), start(B), duration hoặc bounds cần thiết, trạng thái là **chưa kiểm được thời gian**: chỉ preview tương đối, không cam kết không vượt giờ. Người dùng có thể xác nhận các giả định rồi tính lại. Nếu không đủ khoảng trống, giữ nhu cầu ở `unscheduled`, nêu số phút thiếu khi tính được, cho bỏ/chọn khung khác. Khung ăn/nghỉ tự do cũng chiếm thời lượng, không được chèn bằng 0 phút để lách giới hạn.

Tính theo từng ngày, giữ ngày đã chọn của mục. Không chia ngày bằng số mục cho bài toán thời gian mới. Qua nửa đêm phải dùng datetime/ngày thật; không tự lấn sang ngày kế. Ngày tạm không đủ để xác nhận giờ theo thứ/ngày lễ, đánh giá giờ là unknown.

“Đổi quán cùng khu” giữ slotKey, ngày và nhu cầu; dùng tập ứng viên quanh đoạn A–B với trần đi lệch/bán kính đã cấu hình, không chỉ cùng nhãn phường. Mỗi lần đổi phải kiểm lại di chuyển + thời lượng + các mốc sau. Không có quán gần thì giữ khung tự do hợp lệ hoặc unscheduled; chỉ mở rộng tìm sau lựa chọn của người dùng. Tránh lặp cùng placeId xuyên nhiều ngày như ưu tiên mềm, cho chọn lại nếu muốn; không tự loại mọi chi nhánh cùng thương hiệu.

### 4.4. Logic ở backend hay FE?

| Phương án | Đánh đổi |
|---|---|
| Mở rộng tiện ích FE cạnh planDays | Nhanh thử preview từ catalog, tận dụng Undo; nhưng dễ lệch quy tắc giữa thiết bị và server, parser/nguồn rộng làm bundle lớn hơn; không thể tin FE để kiểm lịch lúc ghi. |
| Domain service thuần Java trong planning | Một nơi giữ quy tắc khả thi, deterministic với Clock/input snapshot, test không Spring; cần port và luồng đọc dữ liệu rộng, chưa có sẵn trong applySchedule. |

**Khuyến nghị cần PO duyệt ranh giới:** dịch vụ miền planning xử lý khung/khả thi/điểm, nhận VO snapshot chỉ gồm dữ kiện cần thiết. Application chuẩn bị đầu vào và query projection, không chứa luật chấm điểm; infrastructure xử lý nguồn ngoài/parser. Catalog sở hữu dữ kiện/biên tập, identity tiếp tục sở hữu danh tính. Planning domain không import catalog domain/entity/PlaceView.

Để giữ ARC-3/ADR-010 ngay lát đầu, FE ghép kết quả catalog và gửi snapshot tối thiểu vào preview; backend coi đó là dữ liệu đề xuất, kiểm định dạng/giới hạn, không coi là bằng chứng xác minh hay cập nhật catalog. Nếu muốn backend tự lấy catalog đáng tin, cần PO duyệt cơ chế cầu nối qua port/composition rõ ràng và kiểm ArchUnit, không lén import module khác. Trạng thái “đã xác minh” chỉ do catalog cấp; phương án FE cung cấp snapshot chưa bảo đảm độ mới, phải hiện assumption/source version. Không dùng snapshot khách gửi để quyết định quyền.

Giữ planDays cho việc xếp ngày đang có; không thay nghĩa hàm cũ hay tự di chuyển mọi mục khi thêm tính năng. Preview FE là giao diện cho engine mới; server xác nhận lại bất biến Trip, phiên bản và tính khả thi trước lưu. Khi chỉ có snapshot FE, cam kết thời gian vẫn là theo dữ liệu/ước tính đó, không phải xác nhận quán đang hoạt động.

### 4.5. Các ca kiểm thử bắt buộc khi triển khai

| Ca khó | Kết quả cần đạt |
|---|---|
| Ngày không có giờ/bounds; mục thiếu duration | Preview tương đối + assumptions; không báo “đảm bảo vừa ngày”, không tự ghi giờ đoán. |
| Không có quán gần; điểm tự do không tọa độ | Khung tự do nếu đủ thời gian, nếu không thì unscheduled; không chọn quán xa rồi đẩy giờ kết thúc. |
| Quán thiếu raw/sai cú pháp; 86% mẫu thiếu giờ | Unknown, vẫn có thể gợi ý; không đổi thành mở cửa. |
| Bữa 12:00–13:00, quán đóng giữa ca 12:30 | Không đánh giá open cho cả khoảng; hạ ưu tiên/cảnh báo theo parser, không chỉ xét lúc đến. |
| Mốc booking ngay sau bữa; vừa sát biên/thiếu một phút | Tính cả đi lại + buffer; vừa biên mới nhận, thiếu thì không chèn. |
| Nhiều ngày, có bữa sẵn và quán lặp | Không chèn trùng slot, không dời mục qua ngày; ưu tiên thay quán theo từng ngày, cho phép chọn lại. |
| Qua đêm, ngày lễ, timezone máy khác, ngày tạm | Xét datetime địa điểm hoặc unknown; không dùng giờ máy khách để kết luận. |
| Đổi sang quán cùng khu nhưng đi vòng hơn | Tính lại toàn bộ khoảng chịu ảnh hưởng; từ chối nếu vượt mốc. |
| Hai node Tùng; Là Việt hai địa chỉ; ảnh pending | Không tự merge; hiển thị xung đột, không lấy ảnh pending cho Discover. |
| Preview cũ, gửi xác nhận hai lần, lỗi giữa thêm/xếp, Undo | 409 khi xung đột; retry không nhân đôi; rollback toàn bộ; Undo phục hồi nguyên trạng trong quyền/phiên bản phù hợp. |
| Không còn mục chưa xếp nhưng muốn thêm bữa | Luồng preview mới vẫn dùng được; không phụ thuộc AutoPlanSheet hiện trả null khi unassigned rỗng. |

## 5. Giờ mở cửa: tối thiểu trước, parser sau

**Phương án tối thiểu không dependency:** giữ raw không mất mát; parseStatus missing khi thiếu, not_evaluated khi có raw; kết quả tại thời điểm ghé luôn unknown. Hiện “Chưa xác minh giờ mở cửa”, cho xem raw như thông tin nguồn, không gọi đây là đã hỗ trợ chuẩn OSM. Có thể nhận xác minh thủ công riêng với evidence/ngày kiểm, không giả rằng raw tự parse được. Không viết vài regex rồi suy ra lịch đầy đủ; kể cả `24/7` cũng không chứng minh cơ sở còn hoạt động.

**Phương án parser thư viện — Tầng A:** khảo sát adapter, runtime Java/JS phù hợp nơi đặt engine, giấy phép, bảo trì, bundle/runtime và hỗ trợ lịch Việt Nam/timezone. VERIFY-MATCHES §2.6 đã nêu opening_hours.js như ứng viên, không phải thư viện được chọn. Phiên này không kiểm tài liệu live hoặc khả năng Java tích hợp nên tương thích/phiên bản/giấy phép hiện hành **UNVERIFIED**; không thêm JS runtime vào backend để “dùng tạm”.

Sau khi được duyệt, port parser trả open/closed/unknown cho **toàn khoảng** dự kiến, kèm parseStatus parsed/unsupported/invalid và lý do. Thiếu dữ liệu, lịch ngày lễ chưa biết, rule không hỗ trợ hoặc dữ liệu quá cũ theo policy thì unknown. Raw/nguồn giữ nguyên kể cả khi parser lỗi. Test nhiều ca, nghỉ trưa, qua nửa đêm, ngày đặc biệt, raw rỗng/sai, timezone và dữ liệu cũ trước khi bật hoursFit khác trung tính. Đóng theo giờ là ưu tiên mềm có cảnh báo; xác nhận đóng vĩnh viễn là điều kiện ngừng gợi ý mới. Lịch cũ giữ lại mục và cảnh báo, không tự xóa.

## 6. Lộ trình lát nhỏ và tiêu chí nghiệm thu

“Làm ngay” dưới đây là việc độc lập không cần quyết định sản phẩm mới; **không phải cấp quyền sửa ngoài tệp này trong phiên hiện tại**. Không có task nào ở bảng được tuyên bố đã triển khai.

### 6.1. Làm ngay không cần quyết định

| Lát | Việc nhỏ | Tiêu chí nghiệm thu |
|---|---|---|
| N1 | Review thiết kế, lập ma trận ca biên/đầu vào từ snapshot | Phân biệt known/unknown, dữ kiện/giả định, ảnh/danh tính/hoạt động; không lấy rating. Tệp này cung cấp bản nháp review. |
| N2 | Nghiên cứu xác minh đúng các hồ sơ đang thiếu | Có bằng chứng live và ngày đọc, WoodStock hoạt động, Le Café địa chỉ riêng, Tùng duplicate chưa merge khi thiếu chứng cứ; mạng thất bại ghi UNVERIFIED, không nhập chính. |
| N3 | Chuẩn bị fixture tổng hợp và bảng kết quả kỳ vọng sau khi giao quyền tệp riêng | Có ngày không giờ, quán thiếu ảnh/giờ/tọa độ, conflict, nhiều ngày; không chứa nội dung nguồn chưa được phép nhập. |
| N4 | Đo nguồn JSON hiện có trước chọn DB | Ghi command/máy, kích thước/latency/bộ nhớ thật, không lấy 817 làm benchmark; không đổi dependency. |

### 6.2. Tầng A cần PO duyệt trước phần phụ thuộc

| Lát | Phụ thuộc quyết định | Tiêu chí nghiệm thu khi được duyệt và giao triển khai |
|---|---|---|
| A1 | PlaceRecord/Profile, assertion/alias, chọn A/B/C lưu trữ | ADR/schema chi tiết được duyệt; giữ slug/API; validator đầy đủ; nếu DB có Flyway mới + mapping + kiểm schema, không sửa migration cũ. |
| A2 | Ranh giới engine/cầu nối module, read model/API mới | Domain test ca §4.5; ArchUnit không import chéo; query projection không nạp aggregate; API chỉ thêm, client cũ vẫn chạy. |
| A3 | Nhập POI và provenance ảnh | Batch có nguồn/phiên bản/attribution, dry-run dedupe và gate ảnh; nhập idempotent, báo record bị loại, có cách quay lại batch; không tự nhập mẫu khảo sát. |
| A4 | Schema nguồn slot/idempotency, lệnh xác nhận/Undo | Một giao dịch Trip; quyền/404, version/409, retry không trùng và rollback/Undo có IT; không lưu nửa chừng bằng chuỗi gọi FE. |
| A5 | Parser nếu muốn thêm dependency | PO duyệt thư viện/runtime sau khảo sát; kiểm đủ ca §5; luôn fallback unknown. Có thể hoãn, không chặn lát raw + unknown. |
| A6 | Rating Wander sau này | Thiết kế quyền chấm, riêng tư, kiểm duyệt, “đã đi”, rating/count/unknown được duyệt riêng; không chặn lát OSM. |

Sau mỗi lát mã mới chỉ chạy kiểm tra tương ứng: domain thuần cho luật, ArchUnit cho ranh giới, IT cho hợp đồng/giao dịch/quyền, e2e cho preview/đổi/Undo; lưu kết quả mới theo quy tắc dự án khi được cấp ownership log. Phiên chỉ tài liệu này không chạy app/DB để tránh nhầm “thiết kế xong” với “tính năng đã hoạt động”.

## 7. Quyết định cho PO

**Các dòng là phương án + khuyến nghị, không phải quyết định.** Không hỏi lại hướng PlaceRecord chung, hai lớp OSM/Discover, raw + unknown hay rating Wander để sau đã được DR-025/026 duyệt. Bảng chỉ bao phủ phần thiết kế này, không thay danh sách toàn dự án.

| Cần PO duyệt | Phương án | Khuyến nghị và đánh đổi |
|---|---|---|
| Lưu trữ/schema chi tiết | A JSON mở rộng; B DB catalog mới; C lai | **A cho lát đầu**, giảm thay đổi ADR-010; B khi cần cập nhật/đo tải; C chỉ khi lợi ích hai workflow vượt chi phí đồng bộ. Chi tiết VO, assertion, alias vẫn cần duyệt. |
| Ranh giới tính gợi ý | FE cạnh planDays; domain service planning | **Planning domain service**, FE preview; học invariants/test thuần và tránh hai bộ luật. Cần chốt port và snapshot/cầu nối không import chéo, chưa thêm module. |
| Nguồn vào engine backend | FE gửi snapshot giới hạn; backend composition/port đọc catalog | **Snapshot cho thử preview đầu**, ghi nguồn/giả định; nếu cần độ mới/xác minh từ server thì duyệt cầu nối cụ thể trước code. Không coi snapshot khách gửi là dữ kiện đã xác minh. |
| Lưu bữa và Undo | Nhiều lệnh add/schedule; một lệnh Trip nguyên tử có slot identity | **Một lệnh**, thêm metadata/idempotency sau duyệt schema; nhiều công thiết kế hơn nhưng tránh lịch nửa chừng và chèn trùng. |
| Giờ mở cửa | Giữ raw + unknown; khảo sát/thêm parser | **Giữ hướng DR-026**, parser là quyết định dependency sau; gợi ý vẫn chạy khi 86,41% mẫu thiếu giờ. |
| Nhập dữ liệu/duyệt ảnh | Dry-run chờ gate; nhập mẫu thẳng vào kho chính | **Dry-run và review từng batch**, giữ WoodStock/Le Café ngoài Discover như DR-026; chưa cấp quyền nhập qua tài liệu này. |
| Rating và nổi tiếng | Hoãn; thiết kế tín hiệu có nguồn/rating Wander ngay | **Hoãn rating**, popularity trung tính khi thiếu; cơ chế rating/privacy/moderation là Tầng A riêng. Không có phương án lấy Google rating trong lát này. |

## 8. Kiểm chứng của phiên tài liệu

Skill đã dùng: `tools/codex-skills/wander-debug/SKILL.md`. Đã đọc CLAUDE.md và quy tắc planning-safety, decision-materiality, design-first, backend/frontend để đối chiếu; không delegate. Graph MCP không có tool trong danh sách đã khám phá (**NOT_AVAILABLE**), dùng tìm kiếm hẹp và đọc source. Không có công cụ Skill/agent của Claude được gọi; tuân phạm vi worker và lệnh không delegate.

Nhật ký kiểm tra tóm tắt nằm ngay trong tệp sở hữu này; không tạo `.logs/` vì quyền ghi độc quyền chỉ gồm một tệp. Kiểm Node qua PowerShell (`@'…'@ | node`) đã chạy exit 0: đủ 8 mục, 12 liên kết nội bộ tồn tại, không ký tự lỗi UTF-8; đọc lại pois.json xác nhận 111/817 = 13,59% và số lượng/giờ của cả bốn loại khớp bảng §1.2. `git diff --check -- docs/architecture/place-record-design.md` exit 0 nhưng tệp còn untracked nên chưa đủ kiểm nội dung mới; kiểm khoảng trắng trực tiếp bằng Node được dùng bổ sung. `git status --short` xác nhận tệp mới; workspace có thay đổi đồng thời của người khác, không sửa/hoàn nguyên chúng.

Các test trong VERIFY-MATCHES là bằng chứng lịch sử, không được tính là đã chạy lại ở đây. Gradle/IT/e2e/parser và xác minh live nguồn: **NOT_RUN** trong phiên thiết kế; không thay đổi mã/DB nên không tuyên bố các tính năng đề xuất đã pass.
