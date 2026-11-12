# ADR-003 — Cách áp dụng Clean Architecture, DDD và CQRS trong backend

> **English title:** How Clean Architecture, DDD and CQRS are applied in the backend
> **Summary (EN):** A modular monolith. Each module has domain / application / infrastructure / api layers; aggregates own their invariants; one transaction per use case; commands return ids and queries return flat read models without loading aggregates. Modules never import each other (only the shared kernel); ArchUnit enforces the layering.

- **Trạng thái:** `APPROVED` — PO duyệt ngày 24/10/2026 ("Duyệt, sửa 3 chỗ chữ trước") sau phiên `/wander-council` về các quyết định kỹ thuật còn lại; 3 chỗ chữ đã sửa ở §1, §3, §5. Claude thiết kế để hiện thực ADR-002. Đang chạy trong code.
- **Việc kèm theo (Tier B, chưa làm):** thêm test `*IT` hai request song song cùng một chuyến, một request nhận `409 CONCURRENT_MODIFICATION` (§4 hiện có cơ chế trong code nhưng chưa thấy test bao phủ).
- **Phạm vi:** `backend/src/main/java/com/wander/**`.

## 1. Module = bounded context

| Module | Trách nhiệm | Dữ liệu |
|---|---|---|
| `identity` | Danh tính ẩn danh, phiên, mã khôi phục, ghép thiết bị, xác thực lại (D15, D20–D26; **RG-1 chưa duyệt**) | `identities`, `sessions`, `recovery_codes`, `recovery_attempts`, `code_replacements`, `device_links`, `step_up_requests` |
| `planning` | Chuyến, ngày, mục, chi phí, xóa mềm/khôi phục, việc cần làm (A-1…A-16) | `trips`, `items`, `item_completions` |
| `shared` | `kernel` (lỗi, Patch, thời gian, id, principal) và `web` (lỗi HTTP, đọc JSON, giới hạn tần suất, header) | — |

Hai module **không gọi nhau**. `planning` chỉ biết `identityId` của chủ qua `AuthenticatedPrincipal` (shared.kernel). Bảng `trips` không có khóa ngoại sang `identities` — đây là chủ đích để tách thành service riêng được.

**Một cơ sở dữ liệu, một schema chung, không khóa ngoại chéo module.** Khóa ngoại chỉ được dùng giữa các bảng *cùng module* (ví dụ các bảng của `identity` trỏ về `identities`). Module này không có khóa ngoại sang bảng của module kia; tham chiếu chéo chỉ là id thuần (như `owner_identity_id`). Hệ quả: tách service sau này (hoặc sang 1b) không phải gỡ ràng buộc dữ liệu, nhưng toàn vẹn chéo module do ứng dụng bảo đảm, không do DB.

## 2. Tầng trong mỗi module (Clean Architecture)

```
api ─────────► application ─────────► domain ◄───────── infrastructure
(controller,    (use case: command      (aggregate, value    (JPA entity, Spring Data,
 filter)         handler, query,         object, quy tắc,     adapter cài đặt port)
                 parser nhập liệu)       port/interface)
```

- **domain**: Java thuần. Không Spring, JPA, Jackson. Ví dụ `Trip` (aggregate root) giữ bất biến thứ tự trong ngày, R12, xóa mềm/khôi phục.
- **application**: điều phối một giao dịch (`@Transactional`), không chứa quy tắc nghiệp vụ. Được dùng `@Service`, `@Transactional` của Spring (thỏa hiệp thực dụng, ghi rõ).
- **infrastructure**: cài đặt port của domain/application bằng JPA. Entity JPA (`TripEntity`) **tách** khỏi domain (`Trip`) → tốn công ánh xạ, đổi lại domain test được không cần DB.
- **api**: controller mỏng; giới hạn tần suất; trả read model.

Luật này được **thực thi** bởi `backend/src/test/java/com/wander/ArchitectureTest.java` (ArchUnit): vi phạm ⇒ build đỏ.

## 3. CQRS ở mức "cùng cơ sở dữ liệu"

> **Phạm vi:** CQRS (tách `command`/`query`/`input`) chỉ áp dụng cho module `planning`. Module `identity` dùng các service (`IdentityService`, `RecoveryService`, `DeviceLinkService`) trong `application`, chưa tách lệnh/truy vấn. Luật ArchUnit `queriesDoNotLoadAggregates` chỉ phủ gói `..application.query..`, nên `identity` **không** bị ràng buộc bởi luật đó. Tách `identity` theo CQRS là việc tùy chọn sau, không bắt buộc.

- **Lệnh** (`PlanningCommands` → `PlanningCommandHandler`): nạp aggregate qua `TripRepository`, gọi hành vi domain, lưu. Trả về **id**, không trả dữ liệu hiển thị.
- **Truy vấn** (`PlanningQueries` + `TripReadModel`): JPQL constructor expression trả record phẳng, không nạp aggregate, không dirty-checking.
- Controller: gọi lệnh rồi gọi truy vấn để trả kết quả (giữ hợp đồng API cũ).
- **Không** dùng event sourcing, không tách DB đọc/ghi, không bus/mediator: chưa có nhu cầu. Khi Lát 1b cần đồng bộ nhiều người (Q8), cân nhắc domain event + outbox (AD-5).

## 4. Nhất quán và đồng thời

| Chỗ | Cơ chế | Vì sao |
|---|---|---|
| Aggregate `Trip` | Khóa lạc quan `@Version` + `OPTIMISTIC_FORCE_INCREMENT` mỗi lần lưu | Hai lệnh đồng thời trên cùng chuyến ⇒ lệnh sau nhận 409 `CONCURRENT_MODIFICATION` thay vì ghi đè âm thầm |
| Mã khôi phục | `SELECT … FOR UPDATE` + chỉ mục duy nhất một phần "một mã hợp lệ/danh tính" | INV-7, INV-13: hai lần thử cùng mã ⇒ đúng một commit |
| Thứ tự flush Hibernate | `saveAndFlush` khi vô hiệu mã cũ trước khi chèn mã mới | Hibernate chạy INSERT trước UPDATE khi flush ⇒ sẽ vi phạm chỉ mục duy nhất |

## 5. Phương án đã cân nhắc

| Phương án | Ưu | Nhược | Kết luận |
|---|---|---|---|
| Dùng entity JPA làm domain | Ít code | Domain dính framework, khó test thuần, lazy-loading rò vào nghiệp vụ | Không chọn (đi ngược mục tiêu học Clean Architecture) |
| Package-by-layer toàn hệ thống (`controller/`, `service/`…) như nhiều dự án | Quen thuộc | Ranh giới module mờ, khó tách service | Không chọn |
| Spring Modulith thay ArchUnit | Kiểm tra module + tài liệu tự sinh | Thêm phụ thuộc, khái niệm mới | Giữ ArchUnit (AD-8, mặc định 24/10/2026; xem lại khi có module thứ ba) |
| Mediator/CommandBus | Tách controller khỏi handler | Gián tiếp hơn, chưa cần | Không chọn lúc này |

## 6. Hệ quả cần PO biết

- Thêm tính năng = thêm vào đúng tầng theo công thức ở `docs/architecture/README.md` §5.
- Đổi cách tổ chức này (ví dụ sang microservices) là quyết định **Tầng A**.
