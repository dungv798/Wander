# ADR-011 — Thêm Spring Modulith và nền sự kiện (outbox) khi tạo module thứ tư (AD-15, gộp AD-5 và AD-8)

> **English title:** Spring Modulith and an event outbox when the fourth module exists
> **Summary (EN):** Keep ArchUnit for layer rules; add Spring Modulith (module verification and the event publication registry) when a fourth module appears. Domain events are at-least-once and consumers must be idempotent.

- **Trạng thái:** `APPROVED` — PO chọn "B. Thêm khi tạo module thứ tư (Recommended)" ngày 27/10/2026, sau khi xem trang kế hoạch `Wander Backend Blueprint` (mục AD-15). Khuyến nghị của agent trùng lựa chọn của PO.
- **Phạm vi:** quyết định hướng. **Chưa thêm dependency nào**; việc thêm xảy ra trong PR tạo module thứ tư (dự kiến `content`, pha admin, theo thứ tự pha ở `DR-019`).
- **Cập nhật:** AD-8 (`DEFAULTED`: giữ ArchUnit, xem lại khi có module thứ tư) được xem lại tại đây; AD-5 (domain event + outbox, `OPEN`) được trả lời một phần (nền tảng chọn, chưa có sự kiện nào).

## Quyết định
| Mục | Chọn |
|---|---|
| Khi nào | Trong PR tạo module thứ tư. Trước đó vẫn chỉ ArchUnit |
| Cái gì | Spring Modulith: kiểm tra cấu trúc module (`ApplicationModules.verify()`), test module cô lập (`@ApplicationModuleTest`), tài liệu module sinh tự động, **sổ đăng ký xuất bản sự kiện JDBC** làm outbox |
| ArchUnit | **Giữ** cho luật tầng (`api → application → domain ← infrastructure`, domain thuần, query không nạp aggregate). Modulith lo ranh giới module và sự kiện |
| Ngoài tiến trình | Chỉ đẩy sự kiện ra SQS khi tách tiến trình (worker, service riêng); chưa có nhu cầu |

## Ràng buộc khi thực hiện
- Xác nhận phiên bản Spring Modulith tương thích Spring Boot 4.1 (Context7 liệt kê 2.1.0; một nguồn tìm kiếm nói dòng 2.1 chuyển sang Boot 4.1): `UNVERIFIED` cho tới khi thêm dependency và chạy test.
- Sổ đăng ký JDBC của Modulith 2.0 đổi mô hình trạng thái: tạo bảng bằng migration Flyway mới (không sửa migration đã chạy), theo schema ở tài liệu tham khảo của đúng phiên bản.
- Sự kiện miền chỉ mang id và dữ liệu tối thiểu, tên ở thì quá khứ (`ItemAdded`); consumer phải idempotent (giao ít nhất một lần). Đã ghi thành DOM-7 và OPS-5 ở `docs/architecture/backend-conventions.md`.
- `domain` vẫn là Java thuần: không import Modulith. Phát sự kiện ở tầng `application` (`ApplicationEventPublisher`).
- Mọi bảng của sổ đăng ký thuộc hạ tầng chung, không thuộc module nghiệp vụ nào; không thêm khóa ngoại chéo module (ADR-003 §1).

## Phương án đã cân nhắc
| Phương án | Kết quả |
|---|---|
| A. Tự viết outbox với `@TransactionalEventListener` | Không chọn: học cơ chế sâu nhưng phải tự lo retry, thứ tự, dọn dẹp |
| **B. Modulith khi tạo module thứ tư** | **Chọn** |
| C. Thêm Modulith ngay (3 module) | Không chọn: chưa có sự kiện nào, trùng việc với ArchUnit |
| D. Bus/mediator hoặc broker ngay | Không chọn: thừa cho một tiến trình |

## Hệ quả
- Dependency mới (đã được PO duyệt tại đây) xuất hiện cùng module thứ tư.
- Đảo ngược: vừa phải (gỡ annotation, giữ bảng sổ đăng ký hoặc chuyển thành outbox tự viết).
- Học: mẫu outbox, bài toán ghi kép, test module cô lập.

## Implementation (12/11/2026, portfolio upgrade)

The condition of this ADR is met (four business modules: `catalog`, `identity`, `planning`, `rating`), so the decision was carried out. Details and the reasoning for the chosen first use are in [`events.md`](events.md).

- **Dependencies:** Spring Modulith 2.1.2 (`spring-modulith-starter-core`, `spring-modulith-starter-jdbc`; tests: `spring-modulith-starter-test`, `spring-modulith-docs`). **Compatibility with Spring Boot 4.1.2 is now verified** by running the full backend build and tests. The constraint above that said `UNVERIFIED` is closed.
- **Schema:** table `event_publication` (the v2 schema shipped in `spring-modulith-events-jdbc` 2.1.2) is created by Flyway `V21`; `spring.modulith.events.jdbc.schema-initialization.enabled=false`, completion mode `update` (completed rows stay, status `COMPLETED`).
- **First use:** the identity security-event log. Services publish `SecurityEventOccurred` (a plain record in `identity.domain.model`) inside their transaction; `SecurityEventRecorder` (`@ApplicationModuleListener`) appends it to `identity_events` after commit, idempotently by event id (`V20`, unique `event_id`, `ON CONFLICT DO NOTHING`).
- **Module rules:** `shared` is declared an OPEN module (`shared/package-info.java`); `ModulesTest` runs `ApplicationModules.verify()`, asserts that business modules depend only on `shared`, and regenerates the module diagrams in [`modules/`](modules/). ArchUnit stays for the layer rules.
- **Honest finding:** the modules had no synchronous calls to each other and there is no cross-module cascade (for example identity deletion) in the product today, so there was no cross-module call to turn into an event. The first use is therefore an in-module decoupling, chosen because it shortens pessimistic-lock time in the recovery and pairing flows and isolates a failing log write from the user action. The mechanism is what a second module would subscribe to.
