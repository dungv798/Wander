# Điểm sao và mức độ nổi tiếng cho catalog Wander

Ngày nghiên cứu: **28/10/2026**, múi giờ Asia/Saigon. Đây là nghiên cứu và đề xuất, **không phải quyết định đã được PO duyệt**. Không tạo tài khoản, khóa API, giao dịch, thay đổi backend hay dữ liệu catalog.

## 1. Khuyến nghị trước khi đi vào chi tiết

**Hiện tại nên giữ ảnh có giấy phép mở, thêm liên kết “Xem đánh giá trên Google Maps”, và thử tín hiệu “Được quan tâm trên Wikipedia”.** Nếu PO thật sự cần điểm đánh giá ngay trong Wander, lựa chọn đầu tiên để thử là **Google Places API (New), chỉ gọi khi mở chi tiết, chỉ lưu `place_id`**. Với ứng dụng nhỏ, tiền gọi có thể bằng 0 trong hạn mức; trở ngại chính là thanh toán, điều khoản và cách hiển thị, không phải con số 107.

Không tìm thấy bằng chứng đủ để khẳng định có một bộ dữ liệu sao du khách **mở, miễn phí, cập nhật và được phép đóng gói lại vào JSON** bao phủ cả 107 nơi. Chưa thực hiện đo độ phủ của bất kỳ API cần khóa nào. Không nên lấp trường thiếu bằng sao tự suy ra.

| Hạng đề xuất cho Wander hiện tại | Hướng | Chi phí dự kiến | Độ khó tương đối* | Điều kiện/rủi ro chính |
|---|---|---|---|---|
| **1** | Liên kết Google Maps; có thể thêm liên kết trang Tripadvisor đã đối chiếu | 0 phí API | Thấp | Không có sao trong Wander; phải đối chiếu đúng địa điểm |
| **2** | Pageviews Wikipedia + số Wikipedia sitelinks | 0 phí dữ liệu/API công khai; tốn công biên tập | Thấp–vừa | Là sự quan tâm, không phải hài lòng; chưa đo được phân phối do mạng |
| **3; hạng 1 nếu bắt buộc có sao trong app** | Google Details runtime, không lấy review/ảnh ở vòng đầu | 0 đến vài USD/tháng theo lượt mở; ví dụ ở §5 | Vừa | PO duyệt billing; không lưu sao; attribution; không ghép với bản đồ khác Google |
| **4** | Người dùng Wander tự chấm | 0 phí mua dữ liệu; có vận hành DB/moderation | Cao | Cold start; cần quyết định sản phẩm, quyền sử dụng nội dung và dữ liệu cá nhân |
| **5** | Tripadvisor Content API/Terra | Chưa xác nhận gói có thể đăng ký hiện nay | Vừa–cao | Tài liệu công khai về gói cũ còn tồn tại; tình trạng chuyển dịch vụ UNVERIFIED |
| **6** | Foursquare Premium | Bảng giá: 18,75 USD/1.000 call ở bậc đầu | Vừa–cao | Quyền cache chưa đọc được đầy đủ; điểm 0–10; độ phủ chưa đo |
| Không chọn để giải bài toán sao | Yelp, affiliate, OpenTripMap, Overture, Geoapify, TomTom, HERE, dataset tải lại | Xem §4 | Tùy nguồn | Không khớp loại dữ liệu hoặc chưa đủ bằng chứng quyền sử dụng/độ phủ |

\*Độ khó là **ước lượng kỹ thuật**, không phải cam kết số ngày. Thấp = liên kết/biên tập; vừa = adapter HTTP, API/view, fallback và kiểm tra giấy phép; cao = dữ liệu người dùng, ghi DB và vận hành.

## 2. “Nhiều web lấy bình thường, có policy gì đâu?”

Cần tách hai mệnh đề. Có website đang hiển thị ảnh/đánh giá của bên khác là điều có thể quan sát. **Từ giao diện đó không thể suy ra họ không có policy, có giấy phép gì, hay có tuân thủ không.** Họ có thể dùng API, widget được cấp phép, affiliate, ảnh tự chụp, nội dung mở hoặc cũng có thể đang vi phạm. Không có bằng chứng để kết luận thay họ.

Bằng chứng trực tiếp bác bỏ suy luận “không có policy”: Google Maps Platform §3.2.3 cấm scraping và hạn chế cache [G1]; Tripadvisor có trang cấm lưu trừ Location ID [T1]; Foursquare có hợp đồng PAYG yêu cầu ghi công và dẫn tới hạn chế cache [F1]. Đọc dữ liệu công khai không đồng nghĩa được phép sao chép, lưu, tái phân phối.

**App học tập/chưa thu tiền không tự động được miễn hợp đồng hay bản quyền.** Điều khoản Google áp dụng cả với cá nhân chấp nhận sử dụng [G1]. Một ngoại lệ nghiên cứu cụ thể của luật, nếu có, phải đáp ứng đủ điều kiện; không thể lấy nhãn “dự án học tập” để thay cho việc xác minh.

## 3. Năm loại tín hiệu thường bị gọi chung là “sao”

| Tín hiệu | Ý nghĩa | Ví dụ và lỗi cần tránh |
|---|---|---|
| Điểm đánh giá từ người dùng | Mức hài lòng của tập người đã chấm | Google `rating` và `userRatingCount`; luôn hiện nguồn và số lượt |
| Điểm tổng hợp riêng của nhà cung cấp | Công thức có thể trộn bình chọn, hành vi và tín hiệu khác | Foursquare `rating` 0–10 không phải mặc nhiên cùng thang với Google |
| Hạng cơ sở | Chuẩn phân hạng khách sạn/cơ sở | OSM `stars=5` không có nghĩa khách du lịch chấm 5/5 [O1] |
| Độ quan tâm/phổ biến | Có nhiều người đọc, nhiều bài ngôn ngữ hoặc lượt ghé | Pageviews; không chứng minh đáng đi, an toàn hay chất lượng |
| Độ tin cậy dữ liệu | Tin rằng bản ghi tồn tại/đầy đủ | Overture `confidence`; Foursquare `veracity_rating` không phải chất lượng trải nghiệm [V1, F2] |

Không dùng biểu tượng năm sao cho pageviews, sitelinks hoặc `confidence`. Không cộng điểm từ nhiều nền tảng thành “sao Wander” nếu chưa có nghĩa sản phẩm và quyền tạo dữ liệu dẫn xuất.

## 4. So sánh nguồn và quyền dùng dữ liệu

Tất cả liên kết nguồn ở §10 có ngày đọc/thử đọc **28/10/2026**. **ĐÃ ĐỌC** nghĩa là đọc được nội dung trang chính thức; không có nghĩa đã ký hợp đồng hoặc đã gọi API. **UNVERIFIED** áp dụng cho đúng thuộc tính chưa đọc/xác nhận được, không tự động phủ nhận các dữ kiện còn lại của nguồn.

### 4.1. API có điểm đánh giá hoặc nội dung người dùng

| Nguồn | Có sao thật phù hợp không? | Lưu sao / ảnh / review bao lâu? | Hiển thị thương hiệu | Miễn phí/quota/giá và phù hợp app cá nhân |
|---|---|---|---|---|
| **Google Places API New** [G1–G6] | Có điểm và số lượt; độ phủ 107 nơi **UNVERIFIED** | Không được đưa sao/review/ảnh vào kho JSON hay cache riêng khi không có ngoại lệ rõ ràng. Place ID lưu vô hạn; tọa độ API tối đa 30 ngày theo điều khoản riêng, **không phải sao**. Photo name cũng không được cache | Google Maps attribution; nguồn thứ ba/tác giả theo phản hồi. Có thể hiển thị không kèm bản đồ, nhưng không dùng Places content cùng bản đồ không phải Google | `rating`, `userRatingCount` ở Details Enterprise: 1.000 call/tháng miễn phí, sau đó 20 USD/1.000 ở bậc đầu. Reviews ở Enterprise + Atmosphere: 25 USD/1.000 sau 1.000 miễn phí; ảnh là SKU riêng. Cá nhân có thể dùng nếu đáp ứng onboarding/billing/điều khoản; không có miễn trừ học tập |
| **Tripadvisor Content API** [T1–T4] | Có rating, review, ảnh; hiển thị bằng bubble của Tripadvisor | Tài liệu cache **ĐÃ ĐỌC**: chỉ `location_id` được lưu vô hạn; mọi thuộc tính khác không được cache/store/index | Logo gần nội dung; dùng bubble được cung cấp, không tự thay icon sao; ranking ghi tháng/năm | Trang marketing vẫn ghi 5.000 call miễn phí/tháng, cần thẻ và đặt daily budget. **UNVERIFIED**: còn cấp mới gói đó ngày hôm nay, giá vượt hạn mức và đường chuyển Terra. Không lấy trang còn truy cập được làm bằng chứng API hoạt động |
| **Foursquare Places mới** [F1–F5] | `rating` 0–10, dựa trên nhiều tín hiệu; `popularity` là foot traffic. Các trường này thuộc Premium; không phải mọi nơi có rating | Hợp đồng §2.1 dẫn Usage Guidelines theo account. Trang Guidelines mở được nhưng không trả nội dung retention: **UNVERIFIED** thời hạn lưu sao/ảnh/tips và các ngoại lệ ID của API hiện tại. Không áp dụng mốc 24 giờ của bài cũ/Personalization API | **ĐÃ ĐỌC**: “Powered by Foursquare” tại màn có dữ liệu; một số calculated scores không được hiển thị bên ngoài, phải xác nhận trường định dùng có thuộc diện đó không | Pro 500 call miễn phí, sau đó 15 USD/1.000; **Premium 18,75 USD/1.000 từ bậc đầu**, không đánh đồng 500 call Pro với sao miễn phí. 107 Details Premium ≈ **2,00625 USD** trước thuế, chưa tính match/search. App cá nhân vẫn phải tuân thủ hợp đồng |
| **Yelp Places API, thường được gọi Fusion** [Y1–Y2] | Có rating doanh nghiệp; độ phủ điểm du lịch Việt Nam **UNVERIFIED** | FAQ cho phép cache Places content **tối đa 24 giờ**, Business ID vô hạn. Bao gồm nội dung được cấp qua API, không phải quyền lấy ảnh/review ngoài API; không suy ra quyền mirror vĩnh viễn | FAQ dẫn Display Requirements; trang chi tiết bị 403: **UNVERIFIED** bộ yêu cầu logo/link/icon hiện hành | Trial 5.000 call/30 ngày chỉ để đánh giá, không cho commercial deployment; paid plan mặc định 30.000 call/tháng, tối đa 5.000/ngày; giá USD **UNVERIFIED**. Không phải free tier dùng lâu dài; không chọn khi chưa chứng minh phủ VN |

**Hai điểm cần kiểm tra lại khi onboarding:** Foursquare trang giá có đoạn quảng bá cuối trang nói 10.000 call Pro trong khi bảng giá và thông báo hiệu lực 01/06/2026 ghi 500. Dùng 500 để dự toán thận trọng; xác nhận account thực tế. Tripadvisor có dấu hiệu chuyển sang Terra từ nguồn thứ cấp, nhưng không đọc được thông báo chính thức xác nhận sunset; **không khẳng định Content API đã chết hoặc vẫn đăng ký được**. Đây là lý do không ưu tiên hai nguồn này trước Google.

### 4.2. Affiliate: quyền đưa người dùng đi đặt dịch vụ không phải quyền xây kho sao

| Nguồn | Điều đã đọc được | Cache sao/ảnh/review, branding và giá | Áp dụng Wander |
|---|---|---|---|
| **Booking.com Demand API** [B1] | Cần Managed Affiliate Partner, ký hợp đồng, Account Manager cấp Partner Centre; có luồng content và redirect | **UNVERIFIED** thời hạn cache từng loại nội dung, quyền hiển thị review/ảnh độc lập, logo, quota/giá cho hợp đồng mới. Không lấy quy định API legacy để kết luận cho 3.x | Độ khó cao do xét duyệt/hợp đồng. Sao hạng khách sạn, guest review score và review sản phẩm attraction là các khái niệm riêng; không gán sao khách sạn lên di tích |
| **Agoda** [B2–B3] | Có Affiliate API; API đối tác cần credentials/account manager; sandbox rồi certification trước live | Trang có chức năng pre-cache **rates**, không chứng minh được cache **reviews**. **UNVERIFIED** TTL sao/ảnh/review, attribution, quota/giá và điều kiện nhận app cá nhân | Không thích hợp để bổ sung 107 điểm tham quan chung; không tạo tài khoản hoặc booking thử |
| **Klook** [B4–B5] | Affiliate portal nêu API, data feed, white label; tài liệu integration có bước xác thực đối tác | **UNVERIFIED** quyền cache/TTL sao, ảnh, review, branding và phí/quota theo thỏa thuận; tham gia affiliate không tự cấp quyền crawl website | Review có thể chấm tour/vé/nhà vận hành chứ không phải bản thân địa điểm. Chỉ xem xét khi Wander muốn bán/giới thiệu sản phẩm có mã Klook và được duyệt |

Không coi “API miễn phí cho affiliate” là đã được xác minh cho ba nhà cung cấp này. Chi phí hợp đồng và quyền dùng nội dung phải được đọc trước khi chọn, dù phí trực tiếp có thể bằng 0.

### 4.3. POI mở, nhà cung cấp bản đồ và dataset

| Nguồn | Có giải được sao du khách? | Cache / ghi công | Chi phí và mức phù hợp |
|---|---|---|---|
| **OpenTripMap** [P1–P3] | Trang chủ có filter popularity; product có tham số `rate`. Công thức, thang đo và nguồn rating **UNVERIFIED**; không gọi đó là sao người dùng | Product chính thức `.org` nêu ODbL, được prefetch/index/store/cache và dùng trên mọi bản đồ; không nêu TTL. Phải giữ nghĩa vụ ODbL và giấy phép từng ảnh/đoạn văn. Bản tiếng Anh của terms tự ghi không có giá trị pháp lý; bản Nga đọc được nhưng chưa rà soát pháp lý đầy đủ | Giá/quota hiện hành **UNVERIFIED**; không dùng con số 5.000/ngày hay “phi thương mại” từ bài cũ. `.io` bị chuyển trang đỗ nhưng `.com` và docs `.org` còn đọc được; trạng thái API/đăng ký chưa kiểm. Độ khó vừa; không ưu tiên để lấy sao |
| **Overture Maps Places** [V1–V3] | Không thấy trường sao du khách trong guide/schema được xem. `confidence` là độ tin cậy sự tồn tại, không phải popularity | Places hiện mô tả CDLA Permissive 2.0, Apache 2.0 và nguồn CC0; **không áp mặc định ODbL của theme khác**. Có thể lưu/batch theo giấy phép; giữ license/NOTICE và attribution nguồn tương ứng. Không có quyền lấy ảnh từ URL web chỉ vì URL nằm trong dataset | Dữ liệu mở không phí license; máy tải/xử lý/băng thông có thể tốn tiền. Hợp app cá nhân để đối chiếu POI, không giải sao. ETL và matching vừa–cao so với 107 nơi |
| **Geoapify Places** [A1–A3] | Dựa OSM; không có bằng chứng đủ về điểm review du khách phủ catalog | Docs **ĐÃ ĐỌC**: cache/store kết quả không giới hạn; không đồng nghĩa ảnh ngoài API cũng được tải. Terms yêu cầu OSM attribution; gói Free thêm Geoapify attribution | Free 3.000 credit/ngày, 5 req/s, không thẻ; gói API 10 là 59 USD/tháng. Commercial cũng có thể dùng Free trong giới hạn. 107 nơi nhỏ nhưng không có lý do đổi nguồn chỉ để tìm sao; adapter độ khó vừa |
| **TomTom Places Search mới** [M1–M3] | Trang Details đã đọc và tìm `rating` không thấy; **chưa xác minh** có gói rich content nào cung cấp sao/ảnh/review ở VN | Trang terms chỉ trả khung trang: **UNVERIFIED** TTL cache sao/ảnh/review, quyền lưu JSON và yêu cầu attribution. Không lấy policy cache SDK navigation làm policy Search API | Trang giá hiện ghi Details **5.000/tháng** miễn phí, Discover 5.000, Suggest 10.000; không cần thẻ. Giá trả tiền **UNVERIFIED** vì estimator không có đơn giá đọc được. Không dùng con số cũ 2.500 non-tile/ngày. Vừa; chưa chứng minh giải sao |
| **HERE Geocoding & Search** [H1–H3] | Browse trả POI, chỉ ID và position là bắt buộc; chưa chứng minh có rating du khách/ảnh/review cho 107 nơi | Trang terms bị 403. Search snippet của trang chính thức nói cache ngoài platform tối đa 30 ngày với ngoại lệ, và hạn chế nhân một request cho nhiều end user. **UNVERIFIED** toàn bộ điều khoản áp dụng, attribution và phạm vi ngoại lệ; không xem snippet là giấy phép cache | Snippet pricing restrictions nói Limited 1.000 request/ngày, Discover/Search 5 RPS, nhưng mở trực tiếp bị 403: **UNVERIFIED** gói còn đăng ký được, giá/quota đầy đủ. Không chọn theo bài báo ghi 250.000/tháng. Vừa; chưa chứng minh giải sao |
| **Wikidata** [W1–W2] | Dùng số sitelinks Wikipedia để đo độ hiện diện nhiều ngôn ngữ. Không có tập sao du khách đồng nhất được xác minh cho catalog | Structured data CC0, lưu vô hạn và không bắt buộc attribution; nên ghi nguồn/thời điểm để kiểm tra. Văn bản trang thảo luận và ảnh liên kết có license khác | 0 phí dữ liệu; SPARQL/public API có giới hạn tài nguyên, batch nhỏ và cache snapshot. Hợp JSON hiện tại; thấp–vừa |
| **OSM tags/Overpass** [O1–O2] | `stars` là phân hạng cơ sở, không lấy từ nền tảng ý kiến chủ quan; tag `rating` lẻ tẻ không thành cơ sở sao chuẩn. Độ phủ catalog chưa đo | ODbL: lưu được; phải attribution, xem nghĩa vụ share-alike khi phát hành database phái sinh. Không tự động biến mã nguồn app thành ODbL; liên kết ảnh không cấp bản quyền ảnh | 0 phí dữ liệu; Overpass công cộng không phải SLA miễn phí vô hạn. Hợp nguồn POI hiện tại, không thêm sao giả |
| **Kaggle / dataset công khai** [D1–D3] | Chưa tìm được bộ sao 107 attractions có provenance và quyền tái phân phối được xác minh. Tìm được dữ liệu review khách sạn VN trên Mendeley nhưng chưa đọc được license toàn bộ | **UNVERIFIED** cache/ảnh/review/thương hiệu theo từng dataset. Nhãn CC0/CC BY do người upload chọn không tự chứng minh họ sở hữu quyền cấp lại review Google/Tripadvisor. Phải truy ngược nguồn và phạm vi cấp phép | Tải miễn phí không đồng nghĩa hợp pháp để nhúng sản phẩm. Trang Kaggle docs/terms trả nội dung rỗng; không khẳng định điều khoản chi tiết. Matching, tuổi dữ liệu và quyền sử dụng làm độ khó cao; không khuyến nghị |

## 5. Google runtime: tính đúng chi phí thay vì “107 nơi chắc đắt”

Giả sử đã đối chiếu đúng `place_id`, dùng tài khoản thanh toán ngoài EEA, gọi Details chỉ lấy `id,rating,userRatingCount,googleMapsUri,attributions`, không lấy review/ảnh. `rating` làm request thuộc **Enterprise**, không phải Essentials hay Pro [G3]. Tài liệu billing xác nhận phải bật billing cho project, xác thực bằng API key/OAuth và tính phí theo SKU cao nhất trong field mask [G8].

Công thức minh họa ở bậc đầu theo [G4]: `USD/tháng = max(0, số call Details Enterprise − 1.000) × 20 / 1.000`. Đây là phép tính từ bảng giá, chưa gồm thuế, tỷ giá, SKU khác, các project dùng chung billing hay chi phí hosting.

| Mô hình sử dụng trong một tháng | Call Details | Phí minh họa |
|---|---:|---:|
| Mỗi nơi được mở chi tiết 1 lần | 107 | 0 USD |
| Tổng 1.000 lượt mở chi tiết | 1.000 | 0 USD |
| Mỗi nơi mở 10 lần | 1.070 | 1,40 USD |
| Mỗi nơi được mở mỗi ngày, tháng 30 ngày | 3.210 | 44,20 USD |
| Tổng 10.000 lượt mở chi tiết | 10.000 | 180 USD |

Hàng 3.210 là **lượt xem thật giả định**, không đề xuất cron tải lại hàng ngày để lưu sao. Không cache rồi dùng lại cho 30 ngày. Con số 107 giới hạn số đối tượng nhưng **không giới hạn số lần gọi**. Không fetch sao của toàn bộ thẻ lúc mở trang chủ.

Chi phí ánh xạ lần đầu tách khỏi Details: Text Search IDs Only có free usage unlimited theo bảng hiện tại [G4]; chỉ yêu cầu field được phép trong SKU đó, thêm field khác có thể nâng SKU. Vẫn cần billing/quota. Kết quả mơ hồ phải đối chiếu tên, vị trí và địa chỉ trực tiếp, chỉ giữ ID; không lưu payload tìm kiếm. “Unlimited free” không nghĩa unlimited QPS. **Chưa chạy onboarding hoặc 107 lượt match**, nên chất lượng/chi phí match thực tế UNVERIFIED.

Luồng đề xuất: người dùng mở chi tiết → query ứng dụng lấy bản ghi catalog → adapter server gọi Google → trả khối rating có nguồn riêng → giao diện hiện rating/count/attribution/link. Khi timeout, 429, quota hết, không có rating hoặc chưa ghép ID: ẩn khối điểm và giữ liên kết ngoài. `null` không biến thành 0 sao.

Không persist response vào JSON, DB, Redis, access log/APM body, analytics payload, localStorage hoặc service-worker cache; cấu hình response không lưu cache. Giữ dữ liệu đủ cho lần hiển thị hiện tại, không tái sử dụng như kho độc lập. API key chỉ ở server qua cơ chế secret đã được duyệt, giới hạn API và caller. Cần kiểm soát quota/rate limit thực tế; budget alert là cảnh báo, không nên coi là hard cap. Trước khi triển khai phải kiểm tra quota console có phù hợp mức chi PO chấp nhận.

Điểm rất quan trọng với Wander dùng nguồn OSM: **lấy tọa độ từ OSM trong catalog không tự biến trang chi tiết thành “dùng Google cùng bản đồ khác”; nhưng nếu màn có OSM/Mapbox map và Google rating cùng ngữ cảnh thì cần rà §14.2**. Cách dễ rà nhất là khối rating trên trang chi tiết không có bản đồ khác Google; không gắn rating Google lên marker OSM [G2]. Không chọn vị trí UI cuối cùng trong nghiên cứu này.

## 6. Hai hướng 0 phí và hướng sao của Wander

### 6.1. Liên kết sâu

Google Maps URLs không cần API key [G7]. Có thể tạo URL từ **tên/tọa độ đã có quyền sử dụng**:

```text
https://www.google.com/maps/search/?api=1&query=<ten-va-dia-diem-da-url-encode>
https://www.google.com/maps/search/?api=1&query=<ten-da-url-encode>&query_place_id=<id-da-doi-chieu>
```

Người dùng bấm “Xem đánh giá trên Google Maps”; Wander không chép số sao, ảnh review hay screenshot. Link search không có ID có thể trỏ nhầm nơi; kiểm tra tay 107 link là công việc hữu hạn. Tripadvisor có thể dùng URL trang listing đã kiểm tra bằng liên kết văn bản thông thường; **chưa xác minh API/deep-link scheme đặc thù hay quyền dùng logo**. Không bịa mã listing.

Chi phí API bằng 0; không cache nội dung đánh giá nên không có TTL sao trong Wander. Rủi ro còn lại: link hỏng, đổi listing, app ngoài và người dùng rời luồng. Độ khó thấp, không cần module mới hay DB. Quyền nhúng sao không phát sinh chỉ vì đã đặt link.

### 6.2. Độ quan tâm từ Wikipedia/Wikidata

**Pageviews** dùng Analytics API công khai. Chính sách nêu dữ liệu CC0, yêu cầu User-Agent và khuyến nghị chờ một request xong mới gửi request tiếp theo [W3–W5]. Có thể lưu snapshot lâu dài, không có TTL hợp đồng như Google; việc cập nhật hàng tháng là lựa chọn độ tươi, không phải hạn pháp lý. Ghi nguồn và kỳ thống kê dù CC0 không buộc attribution.

Gợi ý UI: “Lượt xem bài Wikipedia tiếng Việt — tháng 09/2026”, tooltip nói đây là quan tâm trực tuyến, không phải đánh giá du khách. Bắt đầu từ số lượt thô; chỉ thêm nhãn “được quan tâm” sau khi kiểm tra phân phối. Không đổi về 1–5 sao. Có thể dùng `log1p(views)`/percentile để xếp tương đối **nội bộ tập catalog**, nhưng đó là đề xuất thuật toán, chưa được PO duyệt và không tạo so sánh tuyệt đối toàn Việt Nam.

**Số ngôn ngữ và Wikidata sitelinks**: đếm sitelinks thuộc Wikipedia, không cộng Commons/Wikivoyage rồi gọi đó là số ngôn ngữ. Đây là chỉ báo mức hiện diện bách khoa tương đối bền, ít bị tin tức ngắn hạn hơn, nhưng ưu ái di sản lâu đời và cộng đồng biên tập đông. Một nơi có nhiều sitelinks vẫn có thể khó đi hoặc trải nghiệm kém.

Rủi ro chung: bài trùng tên, bài huyện thay cho điểm du lịch, redirect, thay tên, bài tổng quát phủ nhiều địa điểm, khác ngôn ngữ, bot chưa lọc hết, mùa vụ và tin tức đột biến. `agent=user` giảm ảnh hưởng bot theo định nghĩa API, không chứng minh mọi lượt là du khách/người thật duy nhất. Chưa có/không gọi được dữ liệu là **unknown**, không phải ít nổi tiếng.

Quy trình phù hợp: script offline trong khâu biên tập → dữ liệu snapshot kèm project/title/period/source/fetchedAt → người biên tập rà và duyệt → adapter JSON nạp snapshot đã duyệt. **Không gọi Wikipedia/Google trong constructor tải catalog**, vì ADR-010 yêu cầu khởi động ổn định từ tài nguyên local. Cần duyệt thay đổi schema trước khi thêm field JSON; adapter bật `FAIL_ON_UNKNOWN_PROPERTIES`.

### 6.3. Sao do người dùng Wander chấm

Đây là sao thật có thể tạo hợp pháp từ đầu nếu người chấm có quyền đối với nội dung họ gửi và điều khoản Wander cấp quyền lưu/hiển thị phù hợp. Không trả phí bên thứ ba, không có branding/TTL nhà cung cấp; TTL, xóa dữ liệu và quyền tác giả do thiết kế Wander và luật áp dụng quyết định, **chưa được quyết định**.

Cold start: ban đầu “Chưa có đánh giá”; không seed 4,8 từ suy đoán hoặc copy Google. Khi có dữ liệu hiện “X/5 từ N đánh giá trên Wander”, không gọi là đã xác minh chuyến đi nếu chưa có cơ chế đó. Chống một người chấm nhiều lần, spam, sửa/xóa, nội dung vi phạm và Sybil của định danh ẩn danh là phần công việc thật.

Catalog hiện chỉ đọc. Đề xuất một use case/port ghi đánh giá và kho ghi riêng, đọc aggregate ghép vào read model; **không sửa JSON trong runtime**. Ranh giới module, migration, quyền chấm/xóa và retention đều là Tầng A; không tự chọn module mới trong nghiên cứu này. Độ khó cao nhất trong các hướng hợp lý nhưng học được CQRS, uniqueness, moderation và consistency.

## 7. Rủi ro cào dữ liệu: điều khoản, luật và suy luận

| Lớp rủi ro | Bằng chứng và giới hạn | Kết luận áp dụng |
|---|---|---|
| **Điều khoản dịch vụ** | Google §3.2.3(a) cấm scrape/export nội dung để dùng ngoài dịch vụ; §3.2.3(b) hạn chế cache [G1]. Tripadvisor cache policy và Foursquare PAYG có nghĩa vụ riêng [T1, F1] | Đây là nội dung hợp đồng đã đọc, không phải suy đoán. Tuy nhiên hợp đồng API không tự chứng minh mọi người truy cập web đã chấp nhận cùng một hợp đồng; cần xét điều khoản web/cách chấp thuận riêng |
| **Bản quyền ảnh, văn bản và tuyển chọn dữ liệu** | Luật SHTT bản 2005 trên WIPO Điều 22(2) bảo hộ tuyển chọn/sắp xếp sáng tạo; không tự mở rộng quyền đó sang mọi dữ kiện. WIPO liệt kê sửa đổi 2022 và 2025, nhưng không tải được toàn văn sửa đổi [L1–L3] | Nguyên tắc phân biệt dữ kiện/tác phẩm có cơ sở. **UNVERIFIED** kết luận pháp lý cập nhật đầy đủ tới 2026 cho việc Wander crawl. Không dùng bản luật cũ để khẳng định app học tập được miễn hoặc chắc chắn vi phạm |
| **Quyền cơ sở dữ liệu EU** | Directive 96/9/EC là nguồn cần kiểm Art. 3/7/9; các URL chính thức bị challenge, chưa đọc trực tiếp đầy đủ [L4] | **UNVERIFIED** trong phiên về nội dung điều luật. Cần rà quyền extraction/re-utilisation, phần đáng kể và lấy lặp lại có hệ thống trước khi dùng nguồn thuộc phạm vi đó; không khẳng định EU mặc nhiên áp dụng cho PO ở VN |
| **Hợp đồng dù dữ liệu không có quyền DB riêng** | Vụ Ryanair v PR Aviation C-30/14 được chỉ mục chính thức, nhưng toàn văn bị challenge [L5] | **UNVERIFIED** phân tích án; không dùng làm bảo đảm “scraping hợp pháp”. Xem đây là mục cần luật sư đọc nếu muốn dựa vào scraping |
| **Cạnh tranh không lành mạnh VN** | Search của CSDL Bộ Tư pháp trích định nghĩa Luật 23/2018/QH14, nhưng mở toàn văn lỗi 502 [L6] | **UNVERIFIED** đối chiếu Điều 45 và điều kiện áp dụng. Không suy diễn “cứ scrape là phạm luật cạnh tranh”; cần xét chủ thể, hành vi, mục đích và thiệt hại |
| **Bị chặn, khóa API, yêu cầu gỡ** | Google có điều khoản suspension; API công khai Wikimedia cũng nêu có thể chặn client gây hại [G1, W3] | Khả năng chặn có nguồn. **Suy luận kỹ thuật:** scraper dựa DOM dễ hỏng, gặp CAPTCHA/403/429, làm tăng chi phí sửa; chưa đo tần suất của các nhà cung cấp |
| **Nguy cơ kiện thực tế với 107 nơi** | Không có dữ liệu xác suất kiện/phạt cho Wander | **UNVERIFIED**; quy mô nhỏ có thể giảm mức gây chú ý nhưng không biến thành quyền sử dụng. Không nêu tỷ lệ hoặc mức phạt giả định |

Một con số “4,6” riêng lẻ không giống một bức ảnh hay toàn bộ bài review về đối tượng quyền tác giả; nhưng chép hàng loạt số sao vẫn có thể vướng hợp đồng/cơ sở dữ liệu. **Ghi nguồn không thay thế giấy phép**; hotlink ảnh không tự loại bỏ nghĩa vụ bản quyền. Giải pháp rẻ là chọn quyền rõ ràng, không cần lập luận tất cả dữ liệu internet đều cấm dùng.

Với Commons, kiểm tra **từng file**: tác giả, license, link gốc, điều kiện attribution/share-alike nếu sửa; không áp một license chung cho mọi ảnh [C1]. Có ảnh trên Wikipedia không có nghĩa ảnh đó đều thuộc public domain. Những quyền khác như hình ảnh cá nhân/thương hiệu có thể vẫn tồn tại; chưa audit lại 107 bộ ảnh trong nhiệm vụ này.

## 8. Prototype không tốn tiền đã chuẩn bị và chạy

Tệp: [`prototype-pageviews.mjs`](prototype-pageviews.mjs), dùng Node sẵn có, không dependency mới. Chỉ đọc các JSON trực tiếp trong `backend/src/main/resources/catalog/`, chỉ ghi `docs/research/.logs/`. Không lấy ảnh/review, không token.

```powershell
node docs/research/prototype-pageviews.mjs --dry-run
node docs/research/prototype-pageviews.mjs --month=202609
```

Cửa sổ là tháng hoàn chỉnh 09/2026; project `vi.wikipedia.org`, access `all-access`, agent `user`, granularity `monthly`. URL encode tiêu đề; request tuần tự, timeout 15 giây, nghỉ 200 ms giữa request. Dừng khi gặp 403/429 hoặc 3 lỗi mạng/server liên tiếp. Có thể đặt `WANDER_RESEARCH_USER_AGENT` chứa contact thật của người vận hành theo [W3], không cần đặt API key.

| Kiểm tra thực tế | Kết quả |
|---|---|
| Node sẵn có | `v24.17.0` |
| Dry run | Thành công, exit 0; **12 JSON, 107 places, 107 có title, 107 title khác nhau** |
| Network run | Tool báo exit 1; log ghi **3 NETWORK_ERROR/EACCES, 104 NOT_RUN, 0 thành công**. Mã script đặt nonzero khi không có mẫu; không coi đây là HTTP từ Wikimedia |
| Phân phối min/median/p75/max | **UNVERIFIED**: tất cả null do không thu được mẫu; không công bố histogram hay ranking giả |
| Syntax/integrity | Kết quả lệnh cuối phiên ở `.logs/research-checks.json` |

Log có cấu trúc: [dry run](.logs/pageviews-dry-run.json), [network](.logs/pageviews-network.json). Đây là **log nghiên cứu**, không phải test backend. Dừng sớm đúng giới hạn, không thử vượt sandbox hay đổi permissions. Web tool đọc được tài liệu nhưng không có quyền đọc trực tiếp JSON local rồi chạy batch mạng thay Node; không gọi 107 URL thủ công để né hạn chế.

Khi có môi trường mạng được phép, chạy lại lệnh để thu phân phối; trước khi dùng làm tính năng phải canonicalize redirect, kiểm tra title↔địa điểm, ghi 404 là missing, kiểm tra đủ kỳ tháng và biên tập outlier. Script hiện chỉ là khảo sát; **chưa tự resolve redirect hoặc xác minh danh tính bài**. Không ghi output vào catalog sản phẩm tự động.

## 9. Câu hỏi Tầng A dành cho PO, chưa phải yêu cầu phê duyệt để hoàn tất nghiên cứu

1. **Cần biết chất lượng hay độ quan tâm?** A: liên kết ngoài + pageviews gắn nhãn rõ (**khuyến nghị hiện tại**, chi phí 0, dễ đảo ngược); B: sao Google runtime (dữ liệu đánh giá thật nhưng có hợp đồng/billing); C: chỉ nhãn biên tập (ít tích hợp nhưng phụ thuộc biên tập). Học được: metric phải gắn đúng ý nghĩa nghiệp vụ, không vì có field `rating` mà dùng.
2. **Nếu chọn Google, chấp nhận billing và mức chi nào?** A: chưa bật billing, chỉ links (**khuyến nghị đến khi PO chọn**); B: thử một nhóm nhỏ với quota/rate limit sau khi duyệt mức chi; C: bật toàn catalog sau pilot. Học được: quota, budget alert và actual request volume là ba thứ khác nhau. Chưa thiết lập dịch vụ hay tài khoản nào.
3. **Có muốn thu đánh giá Wander ở giai đoạn này?** A: hoãn cold start (**khuyến nghị**); B: chỉ cho người dùng đã có chuyến đi chấm; C: mọi định danh đều chấm được. B/C cần chốt ý nghĩa “đã đi”, quyền sửa/xóa, retention, cấp quyền nội dung và ranh giới module trước migration.
4. **Nếu chọn popularity, duyệt schema/UX nào?** A: số lượt theo tháng và source, không sao (**khuyến nghị**); B: nhãn percentile trong catalog sau khi đo phân phối; C: xếp toàn bộ thẻ theo chỉ số. C làm thay đổi thứ tự sản phẩm; chưa được duyệt. Có thể thử offline ngay mà chưa thay schema/API.

Đề xuất cho Claude: giữ ADR-009/010 nguyên trạng; báo PO rằng “Google runtime cho vài trăm lượt/tháng có thể không tốn tiền” là phương án có nguồn, không tự tạo tài khoản. Không nâng nghiên cứu này thành ADR APPROVED.

## 10. Sổ nguồn và mức kiểm chứng

**Mọi mục dưới đây được đọc/thử đọc ngày 28/10/2026.** Liên kết trực tiếp là nguồn để PO mở lại; giá/terms có thể thay đổi. “Trích chỉ mục” không tương đương đọc toàn văn. Không dùng nguồn thứ cấp làm giấy phép.

| Mã | URL chính thức / tài liệu gốc | Đọc được gì / giới hạn |
|---|---|---|
| G1 | [Google Maps Platform Terms](https://cloud.google.com/maps-platform/terms) | ĐÃ ĐỌC: §3.2.3, attribution, suspension; hợp đồng không riêng cho doanh nghiệp |
| G2 | [Service Specific Terms](https://cloud.google.com/maps-platform/terms/maps-service-terms) | ĐÃ ĐỌC: A.3 ID caching, §14.1–14.3 Places, ngoại lệ tọa độ 30 ngày |
| G3 | [Places fields New](https://developers.google.com/maps/documentation/places/web-service/data-fields) | ĐÃ ĐỌC: SKU của rating/count/reviews |
| G4 | [Google global pricing](https://developers.google.com/maps/billing-and-pricing/pricing) | ĐÃ ĐỌC: free cap, Details Enterprise/Atmosphere/Photos, IDs Only |
| G5 | [Places policies](https://developers.google.com/maps/documentation/places/web-service/policies) | ĐÃ ĐỌC: cache, place ID, Google Maps attribution, tác giả, Terms/Privacy công khai |
| G6 | [Place Photos New](https://developers.google.com/maps/documentation/places/web-service/place-photos) | ĐÃ ĐỌC: không cache photo name, authorAttributions |
| G7 | [Maps URLs](https://developers.google.com/maps/documentation/urls/get-started) | ĐÃ ĐỌC: không key, api=1, query/place ID |
| G8 | [Places usage and billing](https://developers.google.com/maps/documentation/places/web-service/usage-and-billing) | ĐÃ ĐỌC: bật billing, highest SKU, quota theo method/project. Không dùng đoạn credit 200 USD đã hết hạn 28/02/2025 để dự toán năm 2026 |
| T1 | [Tripadvisor caching](https://tripadvisor-content-api.readme.io/reference/caching-policy) | ĐÃ ĐỌC: Location ID duy nhất được cache |
| T2 | [Tripadvisor display](https://tripadvisor-content-api.readme.io/reference/display-requirements) | ĐÃ ĐỌC: logo/bubble/ranking |
| T3 | [Content API marketing/FAQ](https://www.tripadvisor.com/business/solutions/hotels/content-api) | ĐÃ ĐỌC: quảng bá 5.000 call/tháng, thẻ và daily budget; không xác nhận onboarding live |
| T4 | [Developers](https://www.tripadvisor.com/developers), [Terra](https://terra.tripadvisor.com/) | UNVERIFIED: developers chỉ trả một dòng, Terra không truy cập được |
| F1 | [Foursquare PAYG license](https://foursquare.com/legal/terms/apilicenseagreement/) | ĐÃ ĐỌC: §2.1 cache theo account, §2.2 branding, §2.3 calculated scores |
| F2 | [Response fields](https://docs.foursquare.com/fsq-developers-places/reference/response-fields) | ĐÃ ĐỌC: Premium rating/popularity/veracity_rating |
| F3 | [Foursquare pricing](https://foursquare.com/pricing/) | ĐÃ ĐỌC: Pro/Premium; có copy cuối trang mâu thuẫn bảng |
| F4 | [Upcoming changes](https://docs.foursquare.com/developer/reference/upcoming-changes) | ĐÃ ĐỌC: V3 deprecation, mức Pro hiệu lực 01/06/2026 |
| F5 | [Usage Guidelines hiện tại](https://docs.foursquare.com/fsq-developers-places/reference/usage-guidelines) | UNVERIFIED retention: đọc được tiêu đề/navigation nhưng không có nội dung chính |
| Y1 | [Yelp FAQ](https://docs.developer.yelp.com/docs/places-faq) | ĐÃ ĐỌC: trial, paid quota, cache 24h, ID; review chỉ excerpt |
| Y2 | [Yelp display requirements](https://www.yelp.com/developers/display_requirements) | UNVERIFIED: 403 |
| B1 | [Booking prerequisites](https://developers.booking.com/demand/docs/getting-started/prerequisites) | ĐÃ ĐỌC: Managed Affiliate, hợp đồng, Account Manager |
| B2 | [Agoda environment](https://developer.agoda.com/demand/docs/environment-setup) | ĐÃ ĐỌC: credentials, sandbox/certification |
| B3 | [Agoda CDS API](https://partners.agoda.com/DeveloperPortal/APIDoc/CDSAPI) | Chỉ mục chính thức nói pre-cache rates; UNVERIFIED rights cho review |
| B4 | [Klook Affiliate](https://affiliate.klook.com/) | Chỉ mục chính thức nêu công cụ API/feed; terms chi tiết UNVERIFIED |
| B5 | [Klook integration](https://klook.gitbook.io/openapi/getting-started/integration-process) | Chỉ mục tài liệu integration; hợp đồng sử dụng nội dung UNVERIFIED |
| P1 | [OpenTripMap product](https://dev.opentripmap.org/product) | ĐÃ ĐỌC: ODbL, lưu/cache được; không có giá/quota đọc được |
| P2 | [OpenTripMap map](https://opentripmap.com/en/) | ĐÃ ĐỌC: nguồn mở, popularity filter và link docs .org |
| P3 | [English summary](https://dev.opentripmap.org/legal/short-offer), [Russian offer](https://dev.opentripmap.org/ru/legal/offer) | ĐÃ ĐỌC summary và offer; summary tự nói không có giá trị pháp lý; áp dụng chi tiết UNVERIFIED |
| V1 | [Overture Places guide](https://docs.overturemaps.org/guides/places/) | ĐÃ ĐỌC: licenses, trường dữ liệu, confidence chỉ existence |
| V2 | [Overture attribution](https://docs.overturemaps.org/attribution/) | ĐÃ ĐỌC: theo theme/nguồn, Places không mặc định ODbL |
| V3 | [Foursquare OS Places NOTICE](https://opensource.foursquare.com/places-notice-txt/) | Chỉ mục chính thức yêu cầu giữ NOTICE; cần đọc file license/NOTICE của release thực dùng |
| A1 | [Geoapify pricing](https://www.geoapify.com/pricing/) | ĐÃ ĐỌC: 3.000 credit, 5 RPS, commercial Free và ghi công |
| A2 | [Geoapify terms](https://www.geoapify.com/terms-and-conditions/) | ĐÃ ĐỌC: attribution, hạn mức, không bypass |
| A3 | [Geoapify Places docs](https://apidocs.geoapify.com/docs/places/) | ĐÃ ĐỌC: OSM, cache/store no limits |
| M1 | [TomTom pricing](https://docs.tomtom.com/pricing) | ĐÃ ĐỌC: free theo tháng cho Places Search mới |
| M2 | [TomTom Details](https://docs.tomtom.com/places-search-api/documentation/places-search/details) | ĐÃ ĐỌC trang, tìm rating không thấy; không chứng minh mọi gói đều không có sao |
| M3 | [TomTom terms](https://docs.tomtom.com/legal/terms-and-conditions) | UNVERIFIED: chỉ navigation/footer |
| H1 | [HERE pricing restrictions](https://www.here.com/get-started/pricing/limited-plan-restrictions) | Trích chỉ mục 1.000/ngày; mở 403, gói hiện hành UNVERIFIED |
| H2 | [HERE Platform Terms](https://legal.here.com/us-en/terms/here-platform-terms) | Trích chỉ mục j/k/l/m về cache; mở 403, toàn văn áp dụng UNVERIFIED |
| H3 | [HERE Browse](https://docs.here.com/geocoding-and-search/reference/get_browse) | ĐÃ ĐỌC mô tả, ID/position; quyền rich content UNVERIFIED |
| W1 | [Wikidata Licensing](https://www.wikidata.org/wiki/Wikidata:Licensing) | ĐÃ ĐỌC: structured data CC0, namespace khác khác license |
| W2 | [Sitelinks](https://www.wikidata.org/wiki/Help:Sitelink) | Tài liệu gốc về sitelinks; cần lọc Wikipedia sites khi đếm |
| W3 | [Analytics access policy](https://doc.wikimedia.org/generated-data-platform/aqs/analytics-api/documentation/access-policy.html) | ĐÃ ĐỌC: CC0, User-Agent, request tuần tự, có thể chặn |
| W4 | [Getting started](https://doc.wikimedia.org/generated-data-platform/aqs/analytics-api/documentation/getting-started.html) | ĐÃ ĐỌC: public endpoint/JSON |
| W5 | [Pageviews reference](https://doc.wikimedia.org/generated-data-platform/aqs/analytics-api/reference/page-views.html) | ĐÃ ĐỌC trang tài liệu; batch thật bị mạng local chặn |
| O1 | [OSM stars](https://wiki.openstreetmap.org/wiki/Key:stars) | ĐÃ ĐỌC: classification, loại subjective platforms |
| O2 | [OSM copyright](https://www.openstreetmap.org/copyright) | ĐÃ ĐỌC: ODbL và attribution |
| C1 | [Commons reuse](https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia) | ĐÃ ĐỌC: giấy phép từng file và nghĩa vụ người tái sử dụng |
| D1 | [Kaggle docs](https://www.kaggle.com/docs/datasets), [terms](https://www.kaggle.com/terms) | UNVERIFIED toàn văn: kết quả không trả nội dung |
| D2 | [CX Vietnamese hotel online reviews](https://data.mendeley.com/datasets/dp8s59xnb7/1) | Chỉ mục nói lấy Tripadvisor hotels; mở timeout; license/quyền phân phối UNVERIFIED |
| D3 | [Connected but not delighted](https://data.mendeley.com/datasets/93j4s5fr96/1) | Chỉ mục có dataset khách sạn VN; chưa xác minh provenance/license; không phải giải pháp attractions |
| L1 | [Luật SHTT 50/2005 trên WIPO](https://www.wipo.int/wipolex/en/legislation/details/12011) | ĐÃ ĐỌC Điều 22 bản gốc và danh sách sửa đổi; không coi bản gốc là luật hợp nhất hiện hành |
| L2 | [Sửa đổi 07/2022](https://www.wipo.int/wipolex/en/legislation/details/21740) | Đọc metadata; PDF lỗi cache miss, nội dung sửa đổi UNVERIFIED |
| L3 | [Sửa đổi 131/2025](https://www.wipo.int/wipolex/en/legislation/details/23828) | Đọc metadata; PDF lỗi cache miss, nội dung sửa đổi UNVERIFIED |
| L4 | [Directive 96/9/EC](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:31996L0009) | UNVERIFIED toàn văn: anti-bot challenge cả HTML/PDF |
| L5 | [C-30/14 judgment](https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=CELEX:62014CJ0030) | UNVERIFIED toàn văn: anti-bot challenge |
| L6 | [Luật Cạnh tranh, CSDL Bộ Tư pháp](https://vbpl.moj.gov.vn/bogiaoducdaotao/Pages/vbpq-toanvan.aspx?ItemID=133401) | Chỉ mục có trích luật; mở 502, đối chiếu hiện hành UNVERIFIED |

### Bổ sung Mapbox Search, tránh bỏ sót nhà cung cấp được yêu cầu

**Mapbox Search Box**: docs [Search Box API](https://docs.mapbox.com/api/search/search-box/) **ĐÃ ĐỌC 28/10/2026**, restrictions nói kết quả chỉ dùng tạm; lưu position data cần liên hệ sales. Không suy rộng quyền Permanent Geocoding sang POI Search Box. Không tìm được trường sao du khách chuẩn trong tài liệu đã xem; quyền ảnh/review và phạm vi VN **UNVERIFIED**.

[Bảng giá Mapbox](https://www.mapbox.com/pricing), đọc **28/10/2026**, phân biệt Sessions và Requests, introductory preview với standard: standard session có 2.500 miễn phí/tháng rồi 11,50 USD/1.000 ở bậc đầu; `/category` và `/reverse` standard có 25.000 request miễn phí rồi 1,70 USD/1.000. Không dùng nhầm giá temporary geocoding 100.000 miễn phí cho Search Box. Attribution/branding chi tiết áp dụng trường hợp Wander **UNVERIFIED**, phải đọc hợp đồng/display guidance trước khi triển khai. Độ khó vừa; app cá nhân vẫn chịu điều khoản, không có lý do chọn chỉ để lấy sao.

## 11. Phạm vi thay đổi và kiểm chứng

Đã đọc `CLAUDE.md`, kỹ năng `tools/codex-skills/wander-debug/SKILL.md`, quy tắc planning-safety/decision-materiality/backend, ADR-009/010 và nguồn `PlaceCatalog`, `Place`, `ClasspathPlaceCatalog`. Công cụ graph không có trong danh sách tool khả dụng; đọc trực tiếp các file đã biết đường dẫn từ ADR. Không chỉnh sửa bất kỳ file nào ngoài `docs/research/`; giữ nguyên các thay đổi có sẵn của phiên khác.

Công cụ đã dùng: **wander-debug** (quy trình kiểm chứng), shell PowerShell/Node, web search/open/find; không delegate. Không chạy test Java/FE vì không sửa mã sản phẩm; các check nghiên cứu có kết quả thật trong `.logs/`. Log đặt dưới owned path `docs/research/.logs/` để tuân thủ quyền sở hữu hẹp hơn quy ước `.logs/` ở root. Chưa phê duyệt các lựa chọn Tầng A ở §9; nghiên cứu không bị chặn bởi việc chưa chọn hướng triển khai.
