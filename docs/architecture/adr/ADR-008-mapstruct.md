# ADR-008 — Dùng MapStruct cho ánh xạ entity ↔ domain (AD-9)

- **Trạng thái:** `APPROVED` — PO chọn "Thêm MapStruct (AD-9)" ngày 24/10/2026 trong phiên `/wander-council` về các quyết định kỹ thuật còn lại, để học (quen thuộc ở FPT). Hội đồng khuyến nghị giữ ánh xạ tay; PO chọn khác với khuyến nghị.
- **Thực hiện:** xong 24/10/2026 qua `/wander-feature` (`TripMapper`, `IdentityMapper`, `unmappedTargetPolicy = ERROR`; `verify` PASS, 117/117 test backend + 6/6 e2e). Phiên bản `mapstruct` 1.6.3.
- **Giới hạn của lợi ích "biên dịch đỏ":** `unmappedTargetPolicy = ERROR` bắt cột entity chưa được ghi (chiều domain → entity) và tham số constructor domain chưa được dựng (chiều entity → domain). Chiều ghi của `Trip`/`Item` dùng `expression` (domain có accessor `name()` chứ không phải `getName()`), nên một trường domain mà không có cột tương ứng thì không bị bắt — giống mã viết tay.
- **Phát hiện khi làm:** MapStruct nhầm các hàm chuyển trạng thái của record domain có một tham số trả về chính kiểu đó (`withState`, `approve`) là "fluent setter"; phải `@Mapping(target = "...", ignore = true)` ở chiều entity → domain. Chiều domain → entity của `Trip`/`Item` (lớp có accessor dạng `name()` chứ không phải `getName()`) dùng `expression`.

## Quyết định
Thay các hàm ánh xạ viết tay giữa entity JPA và domain bằng **MapStruct** (annotation processor, sinh mã lúc biên dịch) trong tầng `infrastructure` của từng module. Domain và application **không** biết MapStruct.

## Dữ kiện tại thời điểm quyết định
- Hiện khoảng 7 hàm map tay: 5 trong `JpaIdentityStore`, 2 trong `JpaTripRepository`; `JpaTripReadModel` dùng JPQL constructor expression (không phải ánh xạ entity↔domain). Số liệu từ architect, chưa kiểm lại từng hàm.
- Lợi ích thực tế ở quy mô này nhỏ (hội đồng không tìm thấy ca ánh xạ sai). Giá trị chính là học và giống FPT.

## Ràng buộc khi thực hiện
- Aggregate `Trip` có hành vi và bất biến; value object kiểm tra trong constructor. MapStruct phải dựng domain qua constructor/factory hiện có (không bypass bất biến, không dùng setter ẩn). Nếu một ánh xạ cần logic, giữ viết tay.
- `domain` vẫn là Java thuần: không import MapStruct; chỉ `infrastructure` dùng. `ArchitectureTest` phải xanh.
- Thêm vào Gradle: `org.mapstruct:mapstruct` và `mapstruct-processor` (annotationProcessor). Phiên bản: chọn bản ổn định tương thích Java 21/Boot 4.1 tại thời điểm làm (Tier B, ghi vào `decisions.md`); không chốt số ở đây.
- Thứ tự an toàn: giữ nguyên toàn bộ test, đổi từng adapter một, chạy `/wander-verify` sau mỗi bước (≤ 3 vòng sửa theo quy tắc).
- Lưu ý đã gặp: Hibernate flush INSERT trước UPDATE (`JpaIdentityStore.invalidateRecoveryCode`); MapStruct không được làm đổi thứ tự lưu hay `@Version`/`OPTIMISTIC_FORCE_INCREMENT` ở `Trip`.

## Phương án đã cân nhắc
| Phương án | Kết quả |
|---|---|
| Giữ ánh xạ tay | Khuyến nghị của hội đồng (ít phụ thuộc, mapping tay là bài học Clean Architecture). PO không chọn |
| MapStruct | **Chọn** |

## Hệ quả
- Thêm annotation processor vào build (dependency mới đã được PO duyệt tại đây). Giảm boilerplate; code sinh nằm trong `build/`.
- Có thể đảo ngược: chép lại code sinh thành hàm tay (ước lượng dưới 1 ngày ở quy mô này).
