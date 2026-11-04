# Xác minh ghép ảnh và dữ liệu ăn/uống phục vụ lịch Wander

Ngày thực hiện: **29/10/2026**, múi giờ Asia/Ho_Chi_Minh. Đây là nghiên cứu và đề xuất, không phải phê duyệt nhập dữ liệu. Chỉ tạo tệp này; không đổi artifact cũ, catalog, DB, pipeline, dependency hay quyết định sản phẩm.

## Phần 1 — Ghép ảnh với cơ sở kinh doanh

### Phạm vi bằng chứng và cách đọc kết luận

Đã đọc CLAUDE-HANDOFF.md, REPORT.md, curation.json, shortlist.json, coverage.json; đọc pois.json để thống kê và hai node Tùng; chỉ tra metadata ảnh Tùng cần thiết trong photo-candidates.json. Đã xem preview.jpg và đúng bốn ảnh riêng: candidate-0f8cbcfd85fc.jpg, candidate-f65b424a5d75.jpg, candidate-d0ba26dd376b.jpg, candidate-16b0f6996166.jpg. Không mở thêm ảnh Tùng.

**Giới hạn quan trọng:** mở trực tiếp bốn trang tệp Commons, hai trang Tùng, các trang node OSM đều thất bại qua công cụ web (inaccessible/cache miss). Node `fetch` tới Commons API cũng trả `fetch failed`. Vì vậy mô tả, categories, ngày, tác giả và giấy phép bên dưới là **metadata trang nguồn đã lưu trong snapshot**, được đọc lại ngày 29/10/2026; không tuyên bố đã đọc được trang tệp live hay EXIF gốc. Danh mục tổng [Cafés in Da Lat](https://commons.wikimedia.org/wiki/Category:Caf%C3%A9s_in_Da_Lat) đọc được, nhưng không thay thế từng trang tệp. Phần xác minh live Commons/OSM/Wikidata còn thiếu, cần bổ sung trước khi duyệt ảnh sản phẩm.

Snapshot OSM: `pois.json`, lấy 2026-10-29T02:34:26.802Z, dữ liệu OSM tới 2026-10-29T02:23:30Z. Bằng chứng OSM và Commons độc lập về nguồn; hai bản đọc từ cùng Commons, hoặc danh mục và tệp cùng Commons, **không** tính thành hai nguồn. Trang giới thiệu chỉ dùng đối chiếu danh tính/địa chỉ, không tải ảnh, sao chép nội dung hay thu thập rating.

- **CONFIRMED:** ít nhất hai nguồn độc lập cùng tên và địa chỉ hoặc tọa độ; xác nhận danh tính lịch sử không đồng nghĩa hiện còn mở.
- **LIKELY:** bằng chứng nhất quán nhưng cầu nối ảnh → đúng cơ sở/chi nhánh chưa đủ.
- **UNVERIFIED:** thiếu địa chỉ/tọa độ hay mâu thuẫn chưa giải quyết.
- **REJECTED:** có bằng chứng đối nghịch đủ để bác ghép. Không dùng trạng thái này chỉ vì thiếu dữ liệu.

### 1. WoodStock Coffee — LIKELY cho hai ảnh → node/5980607285

Nguồn tệp: [nội thất (10)](https://commons.wikimedia.org/wiki/File:%C4%90%C3%A0_L%E1%BA%A1t_th6n2022_(WoodStock_Coffee,_n%E1%BB%99i_th%E1%BA%A5t_g%E1%BB%97)_(10).jpg) và [nội thất (7)](https://commons.wikimedia.org/wiki/File:%C4%90%C3%A0_L%E1%BA%A1t_th6n2022_(WoodStock_Coffee,_n%E1%BB%99i_th%E1%BA%A5t_g%E1%BB%97)_(7).jpg). Thử truy cập 29/10/2026 thất bại; metadata snapshot đã đọc cùng ngày:

| Thuộc tính | Ảnh (10) | Ảnh (7) |
|---|---|---|
| Mô tả | WoodStock Coffee | WoodStock Coffee |
| Ngày `DateTimeOriginal`, nguồn commons-desc-page | 2022-06-24 12:50:18 | 2022-06-24 12:46:21 |
| Tác giả / credit | Phương Huy / Own work | Phương Huy / Own work |
| Giấy phép đúng nhãn | CC BY-SA 4.0 | CC BY-SA 4.0 |
| URL giấy phép | https://creativecommons.org/licenses/by-sa/4.0 | https://creativecommons.org/licenses/by-sa/4.0 |
| Categories | Self-published work; Decorative and applied arts of Vietnam; WoodStock Coffee | Cùng ba categories |
| GPS trong snapshot / EXIF gốc | Không có / chưa đọc được | Không có / chưa đọc được |

Ngày chụp ở đây dựa trường metadata, **không suy ra từ tên tệp**; thời điểm upload khác ngày chụp. Hai ảnh cho thấy cùng kiểu không gian gỗ, cửa vòm, đồ trang trí cờ; ảnh (10) nhiều chiều sâu nhưng dọc và sáng gắt, ảnh (7) có vai người sát mép. Không nhìn thấy địa chỉ đủ để khóa cơ sở.

[OSM node/5980607285](https://www.openstreetmap.org/node/5980607285): `name=Wood stock`, `addr:housenumber=80`, `addr:street=Bùi Thị Xuân`, tọa độ **11.9466549,108.4405846**. Snapshot không có opening_hours, website hay wikidata. [Bài VnExpress ngày 30/08/2019](https://vnexpress.net/top-5-quan-ca-phe-khong-the-bo-qua-o-da-lat-3975396.html), đọc kết quả web 29/10/2026, đối chiếu Woodstock tại 80 Bùi Thị Xuân. Hai nguồn này xác nhận khá chắc danh tính quán ở địa chỉ đó; Commons chỉ ghi tên nên ghép **ảnh cụ thể** vẫn LIKELY. Khoảng cách Commons–OSM: **N/A**, thiếu tọa độ ảnh; nguồn địa chỉ không cung cấp cặp tọa độ để tính mét. Không geocode ngầm rồi báo như tọa độ nguồn.

Trang giới thiệu ứng viên của quán [facebook.com/woodstockdalat](https://www.facebook.com/woodstockdalat/) chỉ trả màn hình chặn khi đọc 29/10/2026; chưa kiểm tra được tên/địa chỉ trực tiếp từ chủ quán. Tìm Wikidata theo tên chưa nhận diện được QID đáng tin, API không truy cập được; **không kết luận không có thực thể**.

Rủi ro hiện trạng **cao**: ảnh từ 2022, nguồn địa chỉ từ 2019. Kết quả tìm kiếm [Wanderlog](https://wanderlog.com/vi/place/details/530709/woodstock-coffee-%C4%91%C3%A0-l%E1%BA%A1t) ngày 29/10/2026 có nhãn đóng cửa vĩnh viễn. Đây chỉ là **tín hiệu cần kiểm tra**, không phải bằng chứng chủ quán hoặc quyết định đóng cửa; không thu nhận rating/review từ trang này. Chưa đủ bằng chứng đổi tên. Khuyến nghị giữ ảnh ứng viên lịch sử, tạm không gợi ý đến quán cho tới khi xác nhận hoạt động.

### 2. Le Café de la Poste — UNVERIFIED cho ghép vào POI hiện tại

[Trang ảnh 04](https://commons.wikimedia.org/wiki/File:Le_Caf%C3%A9_de_la_Poste_04.jpg), thử đọc 29/10/2026 thất bại. Snapshot ghi mô tả `Le Café de la Poste, Da Lat`; categories `Taken with Canon PowerShot A570 IS`, `Self-published work`, `Le Café de la Poste`; tác giả **Diane Selwyn**, credit **Own work**, giấy phép **CC BY-SA 3.0**, https://creativecommons.org/licenses/by-sa/3.0. `DateTimeOriginal=2011-07-17` từ trang mô tả; `DateTime=2011-10-02 13:11:40` không dùng thay ngày chụp. Không có GPS trong snapshot; chưa đọc EXIF gốc để khẳng định có/không có GPS thực sự.

Ảnh ngang sáng, kiến trúc vàng, ô đỏ và cây xanh; có giá trị thị giác nhưng ảnh 2011 không chứng minh mặt bằng hiện tại. Không có đối tượng tên khớp trong snapshot OSM; không tự lấy tọa độ khách sạn làm tọa độ quán. Các trường name/addr/opening_hours/website/wikidata của **node quán** đều chưa đối chiếu được vì chưa nhận diện node.

[Cổng du lịch Đà Lạt: Du Parc](https://dalat.vn/vi/dalatduparc), đọc kết quả 29/10/2026, gắn tên quán với Du Parc tại **7 Trần Phú**; [trang đường Trần Phú của tỉnh](https://lamdong.gov.vn/sites/duongpho/tpdalat/SitePages/tran-phu.aspx), đọc cùng ngày, xác nhận tên nhà hàng trên đường này nhưng không đủ khóa số nhà riêng. Không đồng nhất 7 Trần Phú (khách sạn), 12 Trần Phú (Palace) và cửa vào quán. Thử các tên miền `https://dalatduparc.vn/` và `https://dalatduparc.com/` không truy cập được, chưa xác nhận đó là trang chủ hiện hành; chưa đọc được trang giới thiệu do quán/đơn vị vận hành công bố. Tìm Wikidata chưa ra QID đúng cơ sở; không tự dùng QID khách sạn.

Khoảng cách giữa các nguồn: **N/A**, chưa có hai cặp tọa độ. Danh tính ảnh theo Commons là hợp lý, nhưng **ghép cơ sở hiện tại UNVERIFIED** do thiếu địa chỉ riêng/tọa độ độc lập. Rủi ro đổi đơn vị vận hành, đổi tên hoặc đóng cửa cao vì ảnh 15 năm tuổi; chưa có xác nhận hiện trạng. Không có cơ sở để REJECTED, cũng không đủ để CONFIRMED.

### 3. Là Việt Coffee — CONFIRMED về ghép địa lý lịch sử, địa chỉ hiện hành còn xung đột

[Morning Break (Unsplash)](https://commons.wikimedia.org/wiki/File:Morning_Break_(Unsplash).jpg), thử đọc 29/10/2026 thất bại. Snapshot mô tả `La Viet Coffee, Thành phố Đà Lạt, Vietnam`; `DateTimeOriginal=2017-03-02` từ trang mô tả; tác giả **Bino Storyteller curiousbino**; nguồn gốc [Unsplash HvrB-BMq2wY](https://unsplash.com/photos/HvrB-BMq2wY), có [bản lưu 29/04/2017](https://web.archive.org/web/20170429021531/https%3A//unsplash.com/photos/HvrB-BMq2wY). Không đọc được bản lưu trong phiên này nên chưa tái xác minh chuỗi cấp quyền gốc.

Giấy phép snapshot đúng nhãn **CC0**, UsageTerms **Creative Commons Zero, Public Domain Dedication**, URL http://creativecommons.org/publicdomain/zero/1.0/deed.en. Không suy ra rằng mọi ảnh Unsplash hiện nay đều CC0. Ngày `DateTime=2017-08-16 12:23:14` không phải ngày chụp. GPS metadata trang nguồn **11.956849,108.435165**, WGS-84; chưa xác minh đó là EXIF nhúng hay vị trí do người đăng gán.

Categories snapshot: CC-Zero; Newspapers of Vietnam; Images uploaded by Fæ; Red shoes; Images from Unsplash; Glass coffee cups; Files with coordinates missing SDC location of creation; Cups of espresso; Newspapers in art. Các category đồ vật không xác nhận cơ sở.

[OSM node/4601279191](https://www.openstreetmap.org/node/4601279191): tên **La Viet Coffee**, **11.9569186,108.435107**, địa chỉ **198 Nguyễn Công Trứ**, cuisine `american;coffee_shop;vietnamese`; không có opening_hours, website, wikidata trong snapshot. Khoảng cách GPS Commons–OSM **9,985 m ≈ 10,0 m** theo haversine, R=6.371.000 m. Hai nguồn độc lập cùng tên và vị trí đủ điều kiện CONFIRMED cho **ghép lịch sử** theo snapshot, chưa phải xác nhận metadata live.

[Trang giới thiệu chính thức Là Việt](https://laviet.coffee/en/from-out-place/), đọc được 29/10/2026, ghi chi nhánh **200 Nguyễn Công Trứ**; [cổng du lịch Đà Lạt](https://dalat.vn/iv/lavietcoffeedl), đọc kết quả cùng ngày, cũng ghi 200. Hai nguồn đồng thuận địa chỉ hiện hành; OSM 198 là mâu thuẫn cần giữ trong provenance, không tự sửa node hoặc xóa giá trị gốc. Trang chính thức không cung cấp cặp tọa độ trong phần đã đọc nên khoảng cách website–OSM **N/A**, không đổi số nhà thành mét. Tìm Wikidata chưa nhận diện QID; API bị chặn, để null.

Ảnh cho thấy đồ uống, báo và giày đỏ, không có nhận diện mặt tiền: chỉ đề xuất ảnh chi tiết sau khi duyệt provenance, không dùng làm bằng chứng không gian. Trang chủ có chi nhánh hiện hành làm giảm rủi ro đóng cửa, nhưng chưa kiểm chứng thực địa; có nhiều chi nhánh nên không gộp theo thương hiệu. Chưa đủ bằng chứng gọi sai số nhà là chuyển địa điểm hay đổi tên.

### 4. Café Tùng — đề xuất node chuẩn, chưa tự gộp hai node

| Node OSM, đọc snapshot 29/10/2026 | Tên | Địa chỉ | Tọa độ | opening_hours / website / wikidata |
|---|---|---|---|---|
| [4070796725](https://www.openstreetmap.org/node/4070796725) | Cafe Tùng | 6 Khu Hòa Bình, Da Lat; province Lam Dong; subdistrict 1 | 11.9442999,108.4358347 | Đều thiếu |
| [6152520385](https://www.openstreetmap.org/node/6152520385) | Tùng Coffee | Khu Hòa Bình, không có số nhà | 11.943865,108.4358513 | Đều thiếu |

Hai node cách **48,392 m ≈ 48,4 m**; gần nhau không chứng minh trùng cơ sở. Đề xuất chọn **node/4070796725** làm neo nội bộ cho `ca-phe-tung-da-lat`: có số nhà khớp [trang giới thiệu Cà phê Tùng trên cổng du lịch tỉnh](https://visitlamdong.vn/vi/caphetungdl), đọc kết quả 29/10/2026, ghi số 6 Khu Hòa Bình. [Bài Thanh Niên 23/10/2026](https://thanhnien.vn/da-lat-khong-thieu-quan-ca-phe-dep-sao-ca-phe-tung-van-dong-khach-185261023104929051.htm), đọc kết quả 29/10/2026, độc lập xác nhận số 6 và hoạt động gần đây. **CONFIRMED cho danh tính node 4070796725 theo tên + địa chỉ**; nghi vấn node 6152520385 là duplicate: **LIKELY**, chưa xác nhận. Không sửa/xóa/gộp OSM, không tuyên bố node thứ hai sai.

Metadata [Cafe Tung, khu Hoa Binh, Da Lat](https://commons.wikimedia.org/wiki/File:Cafe_Tung,_khu_Hoa_Binh,_Da_Lat.jpg), đọc từ photo-candidates.json ngày 29/10/2026: mô tả đúng tên tệp; categories `Taken with Canon PowerShot A570 IS`, `Self-published work`, `Café Tùng`; tác giả **Diane Selwyn**, credit **Own work**, **CC BY-SA 3.0**, https://creativecommons.org/licenses/by-sa/3.0; `DateTimeOriginal=2011-11-17`. Snapshot không có GPS; EXIF gốc chưa đọc; trang live không truy cập được. Ghép ảnh này với node chuẩn chỉ **LIKELY**, khoảng cách ảnh–node **N/A**. Không mở ảnh riêng vì đã dùng đủ hạn mức bốn ảnh; không xác minh ảnh `Cafe Tùng 3` từ tên tệp hoặc suy ra năm chụp.

Trang giới thiệu tỉnh có giờ không đồng nhất ngay trong trang (phần đầu 07:00, ghi chú 07:30); chỉ dùng tên/địa chỉ, không nhập giờ. Chưa tìm được trang do chủ quán vận hành hoặc QID đáng tin. Rủi ro đóng cửa thấp hơn WoodStock nhờ bài gần đây, nhưng vẫn chưa xác minh thực địa; không dùng ảnh cũ để kết luận hiện trạng. Cần đối chiếu biển số nhà/vị trí cửa vào và lịch sử hai node trước khi gắn alias trùng.

## Phần 2 — Dữ liệu thống nhất cho gợi ý ăn, cà phê và nghỉ

### 2.1. Luồng thật và khoảng trống hiện tại

Đã đọc mã thật, không suy luận từ nhãn nút:

1. `web/src/features/trips/components/OverviewTab.tsx` mở overlay `plan`; `TripSheets.tsx::AutoPlanSheet` gọi `planDays(trip, coordOf(cat), hubPoint(cat.dest))`, cho xem trước rồi áp dụng qua Undo.
2. `model/planDays.ts` chỉ lấy `unassignedItems`, chọn điểm gần nhất tiếp theo theo **chim bay**, bắt đầu từ hub, đẩy mục thiếu tọa độ xuống cuối; chia ngày theo **số mục**, không theo thời lượng. Số mục đã có trong ngày dùng làm tải ban đầu. Không xếp lại toàn bộ lịch và không tự thêm quán hay Rest.
3. `tripView.ts::coordOf` chỉ tra `DestinationDetail.places`; POI rộng chưa thuộc kho này sẽ không có tọa độ trong thuật toán hiện tại. `hubPoint` chỉ kiểm mốc đầu tiên. Comment FE nói backend chưa có tọa độ ReferenceView đã cũ: `backend/.../catalog/application/view/CatalogViews.java` hiện có `lat/lon` cho reference; phải tin hợp đồng thật.
4. `hooks/tripsActions.ts::applyPlan` chỉ gửi assignments của mục đang chưa có ngày, ngày hợp lệ; `HttpTripsGateway` gọi `/api/trips/{id}/schedule`. Không có lệnh chèn khung ăn/nghỉ trong thao tác này.
5. Backend `planning/api/controller/TripController.java::applySchedule` → `application/command/PlanningCommandHandler.java::applySchedule` kiểm quyền Organizer, đọc assignments/khoảng ngày rồi `Trip.assignDays`. Domain kiểm mục tồn tại/chưa xóa, không trùng, ngày trong chuyến trước khi áp dụng. Backend lưu lịch, **không phải máy đề xuất quán**, không dùng rating/giờ mở cửa ở đường đi này.

`PlaceView` tại `web/src/features/discover/model/Catalog.types.ts` và backend `catalog/application/view/CatalogViews.java` có category, bestSlots, duration dạng **chuỗi hiển thị**, lat/lon nullable, away theo mốc, photos. Category chỉ có canh/van/**am**/leo/luu/cho; bestSlots chỉ sang/trua/chieu/toi. Không có subtype cafe/restaurant, khung bữa ăn, opening_hours hay provenance từng trường. `away` là khoảng cách/thời gian ước tính từ mốc, **không phải** ma trận di chuyển giữa hai quán. `shared/lib/geo.ts` dùng hệ số đường núi 1,5 và tốc độ 25 km/h giả định cho travelEstimate; planDays hiện chỉ dùng airKm.

`Place` domain hiện bắt buộc ít nhất một ảnh cùng nhiều trường biên tập (hook, verdictReason, slotReason...). Không thể nhét mọi POI OSM thiếu ảnh vào aggregate này mà giữ nguyên ý nghĩa. Photo hiện giữ file/author/license/sourceUrl, chưa đủ provenance. Đây là lý do cần lớp POI rộng và projection Discover riêng sau thiết kế Tầng A, không sửa builder để bỏ gate ảnh.

### 2.2. Đầu vào cần giữ thống nhất

| Nhóm | Đang dùng | Cần cho bước ăn/cà phê/nghỉ theo DR-025 |
|---|---|---|
| Chuyến và lịch | Ngày đầu/cuối, items id/placeId/day/position, tải mục đã xếp | Ngày thật + timezone, giờ bắt đầu/kết thúc ngày, điểm xuất phát/kết thúc, khóa lịch người dùng, mục đã có giờ/booking; giữ quyền Organizer và Undo |
| Địa lý | lat/lon của catalog và hub | Tọa độ cùng chuẩn WGS-84 từ POI rộng lẫn Discover, độ chính xác/cửa vào hay center; tìm quán gần vị trí trước/sau khung ăn, đổi cùng khu; thời gian di chuyển có nhãn ước tính |
| Loại và nhu cầu | Không dùng category để xếp | category=am + subtype riêng; breakfast/lunch/dinner/coffee, nghỉ không bắt buộc gắn quán; cuisine/diet tùy có dữ liệu, không đoán cafe phục vụ bữa chính |
| Thời gian | Không dùng duration/bestSlots | durationMin số + độ tin cậy; bestSlots để ưu tiên mềm; khung ăn/cà phê/nghỉ và thời lượng tùy nhịp độ, tránh chồng giờ và lịch quá tải |
| Khả dụng | Chưa có | opening_hours gốc + timezone + trạng thái parser + ngày kiểm tra; trạng thái hoạt động tách biệt; thiếu giờ vẫn có thể gợi ý nhưng báo chưa xác minh |
| Ưu tiên | Tham số pace/interests/styles/budgetK chưa được planDays dùng | Sở thích, ngân sách biết/chưa biết, độ lệch đường đi, tránh lặp quán, mức xác minh; giải thích vì sao gợi ý và cho thay quán/bỏ khung |
| Tin cậy | Chưa có ở thuật toán | Provenance, xung đột, độ mới, nhận diện chi nhánh; ảnh không phải điều kiện tìm/gợi ý. Rating Wander tương lai tách riêng, không bắt buộc để xếp |

DR-025 đã duyệt **OSM làm ngay + hai lớp + rating người dùng Wander sau + liên kết Xem trên Google Maps**. Không mở lại câu hỏi dùng rating Google; không thu rating Google/TripAdvisor và không tạo rating giả. Không dùng verdict biên tập làm điểm người dùng. Liên kết ngoài chỉ là điều hướng, không cấp quyền nhập dữ liệu từ Google.

### 2.3. Độ phủ thật tính bằng Node trên pois.json

Mẫu 817 đối tượng chưa dedupe, bbox 11.88,108.36,12.02,108.53; không phải độ phủ mọi quán Đà Lạt. `addr` = ít nhất một tag `addr:*` không rỗng, **không** đồng nghĩa đủ số nhà + đường. `phone` gộp phone/contact:phone; website gộp website/contact:website; name chỉ tag name. Không bù dữ liệu từ tên, brand hay nguồn ngoài.

| Loại (N) | name | addr:* | opening_hours | phone | website | cuisine |
|---|---|---|---|---|---|---|
| restaurant (399) | 316 (79,20%) | 141 (35,34%) | 53 (13,28%) | 61 (15,29%) | 10 (2,51%) | 113 (28,32%) |
| cafe (331) | 256 (77,34%) | 112 (33,84%) | 47 (14,20%) | 48 (14,50%) | 14 (4,23%) | 91 (27,49%) |
| fast_food (54) | 38 (70,37%) | 12 (22,22%) | 5 (9,26%) | 2 (3,70%) | 1 (1,85%) | 14 (25,93%) |
| bar (28) | 20 (71,43%) | 9 (32,14%) | 6 (21,43%) | 3 (10,71%) | 2 (7,14%) | 3 (10,71%) |

Bốn loại = 812 đối tượng; 5 còn lại là pub (1) và ice_cream (4). Toàn mẫu có giờ **111/817 = 13,59%** theo coverage.json; không khái quát thành mọi loại đều 14%.

Lệnh đã chạy, exit 0; đoạn này chạy lại từ repo root không ghi tệp:

```powershell
@'
const {pois}=require('./docs/research/da-lat-poi-trial/pois.json');
const fields={
 name:t=>!!t.name,
 addr:t=>Object.keys(t).some(k=>k.startsWith('addr:')&&t[k]),
 opening_hours:t=>!!t.opening_hours,
 phone:t=>!!(t.phone||t['contact:phone']),
 website:t=>!!(t.website||t['contact:website']),
 cuisine:t=>!!t.cuisine
};
for(const c of ['restaurant','cafe','fast_food','bar']){
 const a=pois.filter(x=>x.category===c);
 console.log(c,a.length,Object.entries(fields).map(([k,f])=>{
  const n=a.filter(x=>f(x.tags)).length;
  return `${k}=${n}/${a.length} (${(100*n/a.length).toFixed(2)}%)`;
 }).join('; '));
}
'@ | node
```

### 2.4. Một mô hình chuẩn đề xuất: PlaceRecord có bằng chứng từng trường

**PROPOSED, chưa đổi schema/DB/API.** Một danh tính địa điểm thống nhất cho cả hai lớp, không tạo hai bản quán riêng biệt. `PlaceRecord` chứa dữ kiện, `DiscoverProfile` tùy chọn là phần biên tập của cùng id. Projection PlaceView chỉ dùng khi đủ nội dung được duyệt; lớp tìm/gợi ý đọc dữ kiện POI, không cần Photo hay verdict giả.

| Nhóm trường | Giá trị/nguồn | Tin cậy và cách chiếu sang hợp đồng hiện tại |
|---|---|---|
| Định danh | `id` slug nội bộ ổn định; `osmRefs:[{type,id}]`; `wikidataQid:null/Q...`; aliases, destinationId | Slug theo giới hạn Place hiện có, không đổi theo tên mới; QID tùy có, phải đúng cơ sở chứ không phải thương hiệu/khách sạn |
| Danh tính/địa chỉ | name, alternateNames; address cấu trúc + displayAddress; phone, website | OSM là dữ kiện nguồn cộng đồng; đối chiếu chủ quán tăng tin cậy nhưng giữ giá trị xung đột. Không ghi đè 198 bằng 200 mà mất nguồn |
| Phân loại | `category=am`; `foodKind=restaurant/cafe/fast_food/bar/pub/ice_cream`; cuisine[], dietary với trạng thái unknown | Giữ category hợp đồng PlaceView, subtype cho planner; không tạo mã category mới ở bước đầu; cafe không mặc định có cơm/bữa chính |
| Vị trí | lat/lon nullable theo cặp, coordinateKind point/center/entrance, accuracyMeters nullable | Từ OSM hoặc nguồn được phép; kiểm phạm vi và cùng cơ sở. Chiếu lat/lon; away tính riêng theo mốc và gắn approximate, không nhập như dữ kiện quán |
| Khả dụng | operatingStatus unknown/active/temporarily_closed/closed; `openingHours:{raw,timezone,parseStatus,checkedAt}` | Thiếu tag không nghĩa mở cửa, có tag không nghĩa quán còn hoạt động. Timezone IANA Asia/Ho_Chi_Minh, không dựa timezone máy khách |
| Phục vụ và thời gian | mealServices[] có evidence hoặc unknown; durationMin nullable, durationRangeMin tùy có; bestSlots[] + slotReason | Phút cho tính toán; PlaceView.duration là định dạng hiển thị. bestSlots sang/trua/chieu/toi không đồng nhất breakfast/lunch/dinner. Default biên tập phải gắn nhãn ước tính |
| Hồ sơ Discover tùy chọn | area, hook, summary, highlights, tips, bestMonths, bestLabel, difficulty, verdict/reasons, slotReason | Chỉ biên tập khi có căn cứ; không tự sinh nhãn must/worth để vượt validate. Đạt yêu cầu Place domain rồi mới chiếu PlaceView |
| Bằng chứng từng trường | `assertions:[{field,value,sourceKind,sourceUrl,sourceObjectId,sourceVersion,sourceTimestamp,retrievedAt,license,confidence,status,reason}]`; selectedAssertionId | Confidence high/medium/low theo lý do, không phải xác suất giả; status unverified/corroborated/conflicted/rejected; reviewer/verifiedAt tùy có. Có thể mạnh về tọa độ nhưng yếu về giờ |
| Kết luận ghép | matchStatus CONFIRMED/LIKELY/UNVERIFIED/REJECTED; evidenceRefs[], distanceMeters nullable, checkedAt, reviewReason | Tách khỏi operatingStatus và photoApproval; không một cờ verified chung che mất xung đột |
| Provenance từng ảnh | commonsTitle/pageId/revision nếu biết; sourcePageUrl, originalUrl, localFile/hash, dimensions, author/credit, licenseExact/licenseUrl, captureDateRaw + dateSource, uploadedAt, coords + coordSource, retrievedAt, venueMatch/evidenceRefs, reviewer/reviewedAt, approval, usageRole, edits[] | approval pending/approved/rejected; usageRole cover/interior/detail. Chiếu url/author/license/sourceUrl sang PhotoView; giữ licenseUrl/chuỗi gốc ở kho bằng chứng. Không lấy ngày upload làm ngày chụp, không tái cấp phép ảnh |
| Đánh giá tương lai | Chưa có dữ liệu thì null, sau này Wander rating + count | Thiết kế quyền riêng tư/kiểm duyệt/đã đi là Tầng A riêng. Không dùng 0 làm chưa được chấm; không lấy Google rating vào record |

Nguồn OSM giữ attribution **© OpenStreetMap contributors**, giấy phép [ODbL](https://www.openstreetmap.org/copyright); Commons giữ giấy phép **từng ảnh**, không áp giấy phép dữ liệu cho ảnh. Trang chủ chỉ hỗ trợ đối chiếu tên/địa chỉ trong nghiên cứu này, không coi ảnh trang chủ là tài sản được phép dùng.

**Hai lớp hoạt động:** Search/gợi ý dùng PlaceRecord có tên/vị trí đủ dùng, hiển thị thiếu ảnh bình thường, không bỏ quán chỉ vì không có ảnh. Discover yêu cầu ảnh approved **và** match đã duyệt, đủ nội dung biên tập; ảnh đẹp đơn thuần không đủ. Phải thêm đường tra tọa độ từ lớp rộng vào planner sau thiết kế, thay vì ép mọi POI thành PlaceView. Giữ id chung khi địa điểm được nâng vào Discover để tránh nhân đôi trong chuyến.

### 2.5. Khóa và dedupe

1. Khóa OSM là **type + id**, không chỉ số (node/way/relation có thể cùng số). Một PlaceRecord có thể trỏ nhiều đối tượng OSM sau review. QID có namespace riêng; không bắt buộc có QID vì mẫu hiện không có tag này.
2. Slug nội bộ bất biến; alias lưu tên cũ và các nguồn đã gộp. Node đổi thành polygon không tạo quán thứ hai nếu đã chứng minh cùng cơ sở; đóng cửa/mở quán khác tại cùng địa chỉ không tự kế thừa danh tính/ảnh.
3. Tạo ứng viên bằng tên chuẩn hóa Unicode, chữ hoa/thường và biến thể dấu để **tìm**, cộng tọa độ, số nhà/đường, website/phone. Không bỏ dấu/loại từ “coffee” rồi coi là đủ để merge. Ngưỡng khoảng cách chỉ là cổng tìm ứng viên, phải hiệu chỉnh trên mẫu gán nhãn trước khi chốt hằng số.
4. Chỉ auto-link khi cùng nguồn type/id đã biết; tên gần + khoảng cách gần chỉ vào hàng chờ. QID giống nhau vẫn kiểm tra cấp thực thể/chi nhánh; phone chung của chuỗi cũng không đủ. Khác số nhà, dấu hiệu nhiều chi nhánh hay hoạt động thay đổi → giữ riêng/conflicted.
5. Node Tùng 6152520385 lưu duplicateCandidateOf=4070796725 ở hồ sơ nghiên cứu đề xuất, chưa alias chính thức. Nếu xác nhận trùng, giữ mọi source ref và quyết định merge có thể truy ngược, không xóa nguồn. Ảnh phải gắn với cơ sở/chi nhánh sau merge review, không tự lan sang toàn thương hiệu.

### 2.6. Dùng opening_hours như ràng buộc mềm

Giữ raw không mất mát; chỉ 111/817 có tag nên không lọc bỏ mọi quán thiếu giờ. Trạng thái đánh giá là open/closed/unknown tại **ngày giờ dự kiến** trong timezone địa điểm; unknown cho thiếu dữ liệu, lỗi parse, lịch ngày lễ chưa hỗ trợ hoặc dữ liệu cũ chưa chắc. Kiểm cả khoảng dự kiến ở quán, không chỉ giờ tới, kể cả qua nửa đêm và giờ nghỉ giữa ca.

Có bằng chứng giờ phù hợp thì tăng ưu tiên; có dấu hiệu đóng giờ đó thì hạ ưu tiên, cảnh báo và đề xuất quán khác, vẫn cho người dùng chọn. Thiếu giờ ghi “Chưa xác minh giờ mở cửa”; không tự sinh 07:00–22:00. Cơ sở đã xác nhận đóng vĩnh viễn phải ngừng đưa vào đề xuất chuyến mới; không nhầm operatingStatus với đóng theo giờ.

Đề xuất đánh giá [opening_hours.js](https://github.com/opening-hours/opening_hours.js/blob/main/README.md), đọc tài liệu 29/10/2026: có xử lý chuỗi OSM phức tạp, nhiều ca, qua nửa đêm và quy tắc ngày lễ. **Thêm dependency là Tầng A**, chưa cài; Java backend không tự nhiên dùng được thư viện JS. Phải chốt nơi tính toán, kiểm kích thước bundle/runtime, hỗ trợ ngày lễ Việt Nam/timezone, giấy phép và tương thích trước khi chọn. Không tự viết parser regex nửa vời để gọi là đã hỗ trợ OSM. Nếu chưa duyệt dependency: vẫn làm gợi ý ăn/nghỉ với raw giờ + unknown, chưa cam kết kiểm giờ tự động.

### 2.7. Việc nhỏ theo thứ tự và tiêu chí nghiệm thu

| Thứ tự | Việc | Nghiệm thu | Quyền/trạng thái |
|---|---|---|---|
| 1 | Hồ sơ nghiên cứu ghép nguồn và thống kê trong tệp này | Có nguồn, ngày đọc, phân biệt live/snapshot, tỷ lệ theo loại, khoảng cách tính được và N/A có lý do | Làm ngay; đã làm, xác minh live còn thiếu như §1 |
| 2 | Hoàn tất xác minh bốn hồ sơ | Đọc được trang tệp Commons/EXIF và OSM hiện hành; tìm Wikidata trực tiếp; WoodStock có bằng chứng hoạt động; Le Café có địa chỉ/cửa vào độc lập; Tùng có căn cứ trước merge | Nghiên cứu làm ngay khi truy cập được; chưa đạt, không nhờ Claude thu tệp thay worker |
| 3 | Chuẩn bị fixture/thiết kế thuần cho khung ăn/cà phê/nghỉ từ snapshot | Fixture có POI thiếu ảnh/giờ, lệch địa chỉ, duplicate, thiếu tọa độ; kiểm không biến unknown thành mở cửa; không dùng rating | Bước an toàn tiếp theo trong job được giao quyền riêng; phiên này chỉ sở hữu báo cáo |
| 4 | Đề xuất planner mở rộng, chưa nối DB | Có thời lượng phút, khung ăn/nghỉ, tọa độ lớp rộng, lịch đã khóa; không chèn trùng bữa/nghỉ; đổi quán cùng khu; thiếu giờ vẫn có gợi ý; không có quán hợp lệ thì giữ khung nghỉ/ăn tự do | Hướng sản phẩm đã duyệt DR-025; các default cụ thể trình review, chưa sửa mã trong job này |
| 5 | Chốt PlaceRecord + DiscoverProfile, nguồn từng trường và nguồn ảnh | PO duyệt ý nghĩa schema, ranh giới catalog/planning, read-model POI rộng, id ổn định và merge; mới viết migration/API additive phù hợp | **Cần PO duyệt Tầng A** trước triển khai schema/DB; không mặc định hợp đồng PlaceView đủ cho POI rộng |
| 6 | Chọn adapter giờ mở cửa | Nếu chọn dependency: PO duyệt; test raw thiếu/sai, 24/7, nhiều ca, qua đêm, ngày lễ/unknown, timezone khác máy; FE/backend cùng cách hiểu | **Cần PO duyệt dependency/nơi tính**; có thể hoãn parser và vẫn làm gợi ý mềm |
| 7 | Nối luồng đề xuất → xem trước → lưu/Undo | Cùng placeId cho tìm kiếm/Discover/lịch; food/rest đúng loại; thao tác lặp không chèn trùng; không ghi nửa chừng khi thêm mục rồi schedule lỗi; server kiểm quyền và ngày | Sau schema/API được chốt; kiểm transaction/idempotency thay vì giả định applyPlan hiện có đã chèn được mục mới |
| 8 | Rating người dùng Wander | Thiết kế quyền chấm, riêng tư, kiểm duyệt, “đã đi”, count/unknown; không trộn verdict với rating | **Tầng A để sau**, không chặn dữ liệu OSM/gợi ý ăn/nghỉ |

### 2.8. Nhật ký kiểm tra gọn

Không tạo log riêng vì ownership chỉ cho phép **một tệp mới này**; nhật ký dưới đây tóm tắt kết quả thực của công cụ phiên này, không lấy `.logs/da-lat-poi-trial/verification.json` cũ làm test mới.

- `node` thống kê tags trên pois.json (§2.3): **exit 0**, bốn mẫu 399/331/54/28, kết quả đúng bảng. Đây là kiểm dữ liệu snapshot, không đo độ đúng thực địa.
- Đã trích và chạy lại nguyên đoạn Node nhúng tại §2.3: kết quả trùng bảng. Kiểm cấu trúc ban đầu vấp mã hóa tiếng Việt khi truyền qua PowerShell pipe; kiểm lại bằng marker ASCII **exit 0**. Đối chiếu SHA-256 **12 đầu vào** (7 tệp tài liệu/JSON, preview và 4 ảnh đã mở) với baseline trước khi viết: **PASS, không đổi**.
- `node` tính haversine, R=6.371.000 m: **exit 0**, Là Việt 9.985138091086888 m, Tùng 48.392380508763075 m. Lần một có lỗi ngoặc trong lệnh tính; đã sửa và chạy lại, chỉ dùng kết quả exit 0.
- `node --test web/src/features/trips/model/planDays.test.ts`: **exit 0, 2 pass / 0 fail**, kiểm luồng xếp cũ và mục thiếu tọa độ. Không chứng minh tính năng ăn/nghỉ đã có; không chạy e2e/Gradle/DB vì không đổi app.
- Web: đọc được trang chính thức Là Việt và cổng danh mục Commons; kết quả tìm kiếm đối chiếu tên/địa chỉ từ cổng du lịch và báo. Trực tiếp Commons file/OSM/Wikidata/website Du Parc: **FAILED/UNVERIFIED**, không đổi thành “không tồn tại”. Node thử Commons API kết thúc tiến trình exit 0 do bắt exception, nhưng **bốn request đều fetch failed**, không tính là PASS mạng.
- Công cụ graph MCP: **NOT_AVAILABLE** trong danh sách tools đã khám phá; dùng tìm kiếm hẹp rồi đọc source thật. Thư viện opening_hours: **NOT_RUN**, chỉ đọc tài liệu; chưa cài dependency.
- Công cụ đã dùng: skill `tools/codex-skills/wander-debug/SKILL.md`, exec_command/Node, view_image (preview + 4 ảnh), web.run, apply_patch. Không delegate, không commit/push/deploy.

## Quyết định cho PO

Các dòng sau là **phương án + khuyến nghị, không phải quyết định**. Chỉ bao phủ nghiên cứu này và các mục còn mở của DR-025, không thay danh sách quyết định toàn dự án. OSM làm ngay, mô hình hai lớp và hướng rating Wander đã được DR-025 duyệt, không hỏi lại.

| Mục | Phương án | Khuyến nghị và đánh đổi |
|---|---|---|
| Schema/DB và provenance (Tầng A) | A: PlaceRecord chung + DiscoverProfile tùy chọn, assertion từng trường. B: bảng POI rời, liên kết catalog bằng mapping riêng | **A**, id thống nhất giúp tìm/gợi ý/lịch không lệch quán; thêm công quản lý evidence và migration. Cần duyệt thiết kế chi tiết trước code; học cách tách dữ kiện nguồn và read model biên tập |
| Parser opening_hours (Tầng A) | A: tạm giữ raw + unknown. B: thêm thư viện qua adapter sau đánh giá runtime | Làm **A trước**, đánh giá B sau; gợi ý không bị chặn bởi 86,41% thiếu giờ. B giảm lỗi parse nhưng có chi phí dependency và đồng bộ FE/Java; chưa chọn thư viện/nơi chạy |
| Duyệt ảnh trong nhóm khảo sát | A: chưa đưa nhóm vào Discover tới khi hoàn tất nguồn live/hiện trạng. B: cho duyệt ảnh lịch sử riêng có nhãn tuổi ảnh | **A cho WoodStock và Le Café**; Là Việt chỉ ảnh chi tiết sau review chuỗi CC0. Chất lượng thị giác không thay xác minh đúng quán; chưa ảnh nào được coi là PO duyệt |
| Rating Wander tương lai (Tầng A) | A: để sau, chưa có đánh giá. B: thiết kế quyền chấm/“đã đi”/kiểm duyệt ngay | **A** trong lát gợi ý OSM; giữ null và count khi có thật. Hướng người dùng Wander chấm đã duyệt, cơ chế cụ thể còn mở |
| Google Places về sau (Tầng A nếu đề xuất triển khai) | A: tiếp tục chỉ liên kết Xem trên Google Maps theo DR-025. B: tích hợp API chính thức nếu có nhu cầu được PO duyệt | **A** ở hiện tại; không có nhu cầu rating Google để chặn planner, không scraper, không phí dịch vụ mới |
