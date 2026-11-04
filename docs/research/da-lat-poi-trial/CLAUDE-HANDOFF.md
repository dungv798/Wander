# Bàn giao cho Claude — dữ liệu ăn/uống và ảnh Wander

Ngày: 29/10/2026. Workspace: `D:\Wander`.

## Yêu cầu và quyền PO đã cho

PO muốn dữ liệu nhà hàng/quán cà phê cho Wander, ưu tiên ảnh đúng quán, chất lượng và bắt mắt; đã yêu cầu chạy thử nguồn miễn phí. PO cho phép tự động các việc an toàn, chỉ hỏi với việc rủi ro/Tầng A. Không xin lại quyền đọc, nghiên cứu, tạo bản thử, tải mẫu hợp lệ hoặc kiểm tra trong phạm vi đã giao. Không sửa skill/agent Claude. Không tự suy diễn quyền triển khai production, đổi schema, mua dịch vụ hay lấy dữ liệu trái điều khoản.

## Đã làm và có bằng chứng

1. Đã nghiên cứu Google Places: giá phụ thuộc SKU/field mask; trả tiền API không cấp quyền lưu toàn response thành catalog lâu dài. `place_id` được lưu lâu dài; lat/lon Places có ngoại lệ cache tối đa 30 ngày. Không mặc định mọi trường đều được cache 30 ngày. Scraping rating/reviews để ghép vào DB riêng không loại bỏ hạn chế của Google. Đây là kết quả nghiên cứu, không phải quyết định chọn provider cho Wander. Khi triển khai phải đọc lại điều khoản/giá hiện hành.
2. Đã đọc pipeline `tools/catalog/build-catalog.mjs`: hiện chạy theo seed, dựa Wikipedia/Wikidata và OSM dự phòng; không phải crawler lấy toàn bộ quán theo vùng. Nó có điều kiện ảnh bắt buộc, nên có thể loại POI không có ảnh. **Không sửa pipeline này trong bản thử.**
3. Đã chạy một truy vấn OSM/Overpass theo bbox `11.88,108.36,12.02,108.53`, lấy **817 đối tượng ăn/uống**: 399 restaurant, 331 cafe, 54 fast_food, 28 bar, 1 pub, 4 ice_cream. Có tên 631, có ít nhất một tag địa chỉ 275, giờ mở cửa 111, điện thoại 115, website/contact:website 27. Không có tag ảnh hoặc Wikidata ID trong các đối tượng trả về.
4. Đã tìm ảnh Commons theo danh mục quán và truy vấn tên mẫu. Sau bộ lọc metadata còn **116 ảnh ứng viên**, tải **18 ảnh mẫu**. Bộ lọc ảnh gốc rộng ≥1.400 px, cao ≥800 px, có tác giả và giấy phép mở phù hợp. Không phải 116 quán và không phải tất cả 116 ảnh đã được xem/duyệt.
5. Đã xem bảng ảnh, mở riêng sáu ảnh để đánh giá; tuyển đề xuất **4 ảnh của 3 quán**: WoodStock Coffee (2), Le Café de la Poste (1), Là Việt Coffee (1). Giữ tên tác giả, giấy phép, link nguồn và metadata. Không chỉnh sửa ảnh, không sinh ảnh AI, không có rating giả.
6. Đã tạo HTML xem ảnh, screenshot và JSON dữ liệu. Đã chạy Edge headless: **18 ảnh, 0 ảnh lỗi**, bốn ảnh tuyển và các bất biến dữ liệu PASS. Bằng chứng đọc được tại `.logs/da-lat-poi-trial/verification.json`; đây không phải kiểm tra ứng dụng/backend.

## Chưa làm / chưa xác minh

- Chưa nhập catalog/DB chính, chưa đổi schema, API, UI, seed, master plan hoặc bản ghi quyết định sản phẩm. Chưa deploy, mua API, scrape Google, commit hay push trong phần khảo sát này.
- 817 là số đối tượng OSM **chưa khử trùng** và chỉ trong bbox khảo sát; không phải số quán duy nhất hay độ phủ toàn Đà Lạt.
- Chưa xác minh thực địa quán còn mở, tên/địa chỉ/giờ/số điện thoại còn đúng. Polygon dùng center, không phải tọa độ cửa vào.
- Chưa có cơ chế production ghép ảnh ↔ POI, dedupe, cập nhật định kỳ, duyệt ảnh hoặc quản lý provenance trong DB.
- WoodStock: OSM có node tên `Wood stock` (`node/5980607285`); chưa xác minh là cùng cơ sở trong ảnh. Ảnh mang năm 2022 trong tên tệp.
- Là Việt: Commons ghi `La Viet Coffee, Thành phố Đà Lạt, Vietnam`; OSM có `La Viet Coffee` (`node/4601279191`). Ghép tên/mô tả là ứng viên, chưa xác minh hiện trạng. Ảnh đẹp về ánh sáng/màu nhưng chỉ là đồ uống có giày làm đạo cụ, không cho thấy không gian quán.
- Le Café de la Poste: có ảnh riêng theo quán; chưa tìm được đối tượng OSM khớp, không tự gán tọa độ.
- Café Tùng/Tùng Coffee: có hai node gần nhau; chưa gộp. Ảnh đã xem không ưu tiên vì tối hoặc mặt tiền nhiều xe.
- Chưa review hết 116 ảnh, chưa chứng minh Commons cung cấp đủ ảnh đẹp/mới cho phần lớn nhà hàng/cà phê. Kết quả tìm kiếm nhầm Hong Kong đã bị loại; vẫn cần kiểm đúng nơi cho mọi ảnh định nhập.
- Chưa thử provider ảnh trả phí hoặc pipeline Openverse/ảnh chủ quán. Ảnh trên website chủ quán không mặc định được phép tải và tái sử dụng.
- Cache là snapshot: chạy script mặc định dùng lại cache, không được gọi là dữ liệu live mới mỗi lần.

## Những gì còn cần PO chốt khi chuẩn bị đưa vào sản phẩm

Các mục dưới đây chưa có quyết định trong cuộc trao đổi này; không đánh dấu APPROVED. **Không cần chờ để làm tiếp việc xác minh dữ liệu an toàn.**

| Mục cần chốt | Phương án / khuyến nghị (chưa phải quyết định) |
|---|---|
| Cách đưa POI thiếu ảnh vào trải nghiệm | Khuyến nghị hai lớp: POI OSM rộng cho tìm kiếm/định vị; Discover chỉ dùng địa điểm có ảnh đã tuyển. Phương án khác: chỉ nhập địa điểm có đủ ảnh, chấp nhận ít quán hơn. |
| Rating Google có bắt buộc không | Khuyến nghị chưa buộc vào catalog ở giai đoạn thử; giữ trạng thái chưa có đánh giá hoặc rating riêng khi có dữ liệu thật. Nếu bắt buộc rating Google, cần quyết định tích hợp, chi phí, điều kiện lưu và tương thích bản đồ trước; không tự thêm scraper. |
| Phạm vi nhập sau bản thử và chất lượng ảnh chấp nhận | Khuyến nghị xác minh nhóm ba quán hiện có trước; PO xem ảnh rồi chốt tiêu chí dùng ảnh cũ/ảnh dọc/ảnh chỉ có món. Chưa được coi bốn ảnh tuyển là PO đã duyệt. |

Nếu triển khai đòi schema/provenance mới, dependency, dịch vụ trả phí, đổi cơ chế bản đồ hoặc API breaking: đưa phương án cụ thể cho PO ở bước đó. Chưa có thiết kế/schema mới nào được phê duyệt bởi bản khảo sát này. Bảng này chỉ bao phủ phần dữ liệu/ảnh vừa làm, không thay danh sách quyết định mở của toàn dự án.

## Đọc ở đâu — theo thứ tự, không nạp cả repo

1. **File này**: trạng thái và giới hạn bàn giao.
2. `docs/research/da-lat-poi-trial/REPORT.md`: phương pháp, số liệu, giới hạn và link nguồn.
3. `docs/research/da-lat-poi-trial/index.html` hoặc `preview.jpg`: xem ảnh thực tế; JSON không thay đánh giá thị giác.
4. `docs/research/da-lat-poi-trial/curation.json`: lý do chọn/bỏ, các ghép vị trí còn nghi vấn.
5. `docs/research/da-lat-poi-trial/shortlist.json`: bốn ảnh đề xuất + metadata + OSM candidates; mọi liên kết candidate vẫn chưa xác minh.
6. Chỉ khi cần số liệu/chi tiết: `coverage.json`, `pois.json` (817 đối tượng, tags gốc), `photo-candidates.json` (116 ảnh, credit/license).
7. Chỉ khi cần mở rộng/chỉnh thử nghiệm: `tools/catalog/probe-dalat-pois.mjs`, `tools/catalog/render-dalat-trial.mjs`. Pipeline catalog hiện có là file khác: `tools/catalog/build-catalog.mjs`.

Tất cả artifact ở `docs/research/da-lat-poi-trial/`; ảnh mẫu ở `photos/`. Cache, ảnh mẫu cũ không dùng và log xác minh ở `.logs/da-lat-poi-trial/`. Không xóa cache/ảnh đang có chỉ để làm lại báo cáo.

## Bước tiếp theo Claude có thể tự làm

1. Đọc brief này và `curation.json`; tiếp tục **xác minh tên + địa chỉ + tọa độ** của ba quán, đối chiếu nguồn độc lập có quyền sử dụng. Không ghép chỉ vì tên giống nhau.
2. Phân biệt quán duy nhất với node trùng, giữ lý do ghép và những chỗ chưa chắc chắn. Kiểm tra thời điểm ảnh/hiện trạng; không tự gán năm chụp nếu metadata không có.
3. Cập nhật kết quả trong artifact khảo sát riêng; giữ `PROPOSED`/`UNVERIFIED` đúng nghĩa. Không tự đưa vào catalog chính. Đưa PO xem mẫu cụ thể trước khi hỏi quyết định sản phẩm.
4. Không cần chạy lại truy vấn/ảnh đã cache hay toàn bộ test app để đọc báo cáo. Chỉ verify lại khi đổi script/dữ liệu hoặc có nghi vấn liên quan.

## Phối hợp Codex qua MCP

MCP `wander-codex` và bộ skill riêng đã được thiết lập ở các lượt trước; đọc hướng dẫn **hiện tại** tại `tools/codex-mcp/CLAUDE-PROMPT.md`, rồi `GUIDELINES.md` nếu cần. Phiên khảo sát này không thay skill/agent `.claude/**`. Bộ Codex ở `tools/codex-skills/`.

Lưu ý: hướng dẫn MCP trong workspace hiện đã có nội dung mới hơn bản kiểm tra đầu (ví dụ concurrency/model/effort); không lấy giới hạn hay kết quả test cũ làm bằng chứng cho mã hiện tại. Dùng schema tool/config đang thực sự nạp, giữ ownership và tài nguyên test rõ ràng. Không cần chạy lại smoke test tốn quota chỉ để đọc bàn giao.

Giao Codex một gói có ích (ví dụ xác minh ba ghép địa điểm), để worker tự đọc nguồn và trả bằng chứng ngắn. Claude giữ điều phối/nghiệm thu; không đồng thời review lại toàn bộ cùng phạm vi nếu không có lý do. Việc nhỏ Claude tự làm; chỉ xem log thô khi lỗi. Quyền tự động PO đã cho vẫn áp dụng; chỉ hỏi cho việc rủi ro/Tầng A.

## Nguồn Google để kiểm lại nếu chọn tích hợp

- Giá: https://developers.google.com/maps/billing-and-pricing/pricing
- Field/SKU: https://developers.google.com/maps/documentation/places/web-service/place-details
- Chính sách lưu/attribution: https://developers.google.com/maps/documentation/places/web-service/policies
- Điều khoản: https://cloud.google.com/maps-platform/terms
- Ngoại lệ cache và bản đồ: https://cloud.google.com/maps-platform/terms/maps-service-terms

Không coi hướng nghiên cứu là kết luận pháp lý áp dụng cho mọi nguồn/khách hàng; xác định đúng điều khoản hiện hành và phạm vi tích hợp cụ thể trước khi triển khai.
