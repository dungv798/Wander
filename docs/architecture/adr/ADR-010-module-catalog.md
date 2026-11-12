# ADR-010 — Module `catalog`: kho địa điểm biên tập, chỉ đọc

> **English title:** The read-only catalog module
> **Summary (EN):** A third module owns destinations, places, photos and guides as classpath JSON, loaded and validated at startup (a missing photo or invalid data stops the application). planning never imports catalog; photos are public under /catalog/photos/**; travel time and distance are labelled estimates.

- **Trạng thái:** `APPROVED` — PO chọn "Module mới `catalog` (Recommended)" ngày 25/10/2026 khi được hỏi cổng `PlaceCatalog` của ADR-009 đặt ở đâu.
- **Liên quan:** ADR-002/003 (Clean Architecture, module), ADR-009 (nguồn dữ liệu miễn phí, qua cổng `PlaceCatalog`), AD-8 (ArchUnit hay Spring Modulith, "xem lại khi có module thứ ba"), DR-005, DR-007.

## Quyết định
1. Thêm **module thứ ba `catalog`** cạnh `identity` và `planning`, cùng bốn tầng `domain / application / infrastructure / api`.
2. `catalog` **chỉ đọc**: điểm đến, địa điểm, ảnh, cẩm nang biên tập. Nguồn là tệp JSON và ảnh trong repo (`backend/src/main/resources/catalog/`), nạp lúc khởi động và kiểm tra ngay (thiếu ảnh hay dữ liệu sai thì ứng dụng không khởi động). Chưa có bảng cơ sở dữ liệu, chưa có migration.
3. **Cổng domain `PlaceCatalog`** là ranh giới với nguồn dữ liệu. Adapter đầu tiên đọc tệp trong classpath; adapter Google hay cổng admin thêm sau mà không đổi nghiệp vụ (ADR-009).
4. **`planning` không import `catalog`** (và ngược lại). `planning` chỉ giữ mã địa điểm (`placeId`) khi sau này nối mục chuyến đi với địa điểm; việc ghép hai bên làm ở tầng API/ứng dụng hoặc ở giao diện. ArchUnit thêm luật tương ứng.
5. **AD-8:** giữ ArchUnit khi có module thứ ba (ba module vẫn kiểm được bằng luật đơn giản). Xem lại khi có module thứ tư hoặc khi luật vượt khả năng đọc.
6. **Ảnh** phục vụ công khai dưới `/catalog/photos/**` từ classpath (thẻ `<img>` không gửi được Bearer). Đây là nội dung công khai theo giấy phép mở, không phải dữ liệu người dùng; không nằm dưới `/api/**` nên không đổi danh sách route công khai của API. Mô tả và tên điểm đến vẫn đi qua `/api/catalog/**` cần phiên hợp lệ.
7. **Ước tính khoảng cách và thời gian đi** tính ở domain (`TravelEstimate`): đường chim bay × 1,5 ÷ 25 km/h, luôn ghi là ước tính. Mốc tham chiếu (ví dụ TP Hà Giang) nằm trong dữ liệu điểm đến, kèm cờ `approximate` khi tọa độ chưa kiểm chứng.

## Hệ quả
- Nội dung biên tập thật phải do PO hoặc nguồn kiểm chứng được duyệt; dữ liệu khởi đầu là bản nháp có gắn nhãn.
- Mỗi ảnh có tác giả, giấy phép, liên kết gốc; kiểm tra tự động bắt buộc đủ ba trường.
- Thêm điểm đến = thêm một tệp JSON và ảnh, không cần migration.
