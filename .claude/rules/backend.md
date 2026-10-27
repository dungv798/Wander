---
paths:
  - backend/**
---
# Backend conventions (Java 21, Spring Boot 4.1 — ADR-002/003/004)

**Layers per module** (`identity`, `planning`; enforced by `ArchitectureTest`):
- `domain` — (thư mục con `model/ vocabulary/ rule/ constant/ port/`, ARC-10) pure Java (no Spring/JPA/Jackson). Aggregates own invariants; value objects validate in their constructor; ports (`*Repository`, `*Store`) are interfaces here. Errors: `WanderException(kind, code, field)`, never HTTP.
- `application` — one transaction per use case (`@Transactional`), no business rules. Commands (`*Commands` records → `*CommandHandler`) return ids; queries (`*Queries` + a read-model port) return flat records and never load aggregates. Raw JSON input is parsed here (`RawInput`) so D17 format rules stay explicit.
- `infrastructure` — JPA entities separate from domain; adapters implement ports and map both ways.
- `api` — thin controllers: rate limit → command → query → `Map.of("key", view)`. Field names and error codes must match `web/src/api.ts`.
- `identity` and `planning` never import each other; share only `shared.kernel`.

**Quy ước đầy đủ (APPROVED 27/10/2026): `docs/architecture/backend-conventions.md` (60 quy tắc + "Quy ước mã bắt buộc"). Tóm tắt bắt buộc cho mã mới và mã được sửa:**
- Tên theo nghĩa, một mẫu (NAM-5): lớp = vai trò, method = động từ + đối tượng; cấm lớp tên Helper/Util/Manager/Base/Common/Data/Info.
- Mọi method (kể cả private) có Javadoc tiếng Việt ngay trên tên (DOC-1). Method ≤ 40 dòng, ≤ 6 tham số, độ phức tạp ≤ 10 (SIM-1).
- Không chuỗi/số ma thuật (CON-2/3). Hằng số 3 tầng (CON-1): nền `shared.kernel.CommonConstants`; hệ thống `SystemConstants`/`ErrorCodes`/`ErrorMessages`/`ConfigConstants`/`HttpConstants`; chức năng `<ChứcNăng>Constants|Messages|ErrorCodes|Fields` cạnh nơi dùng.
- Logic dùng từ 2 nơi gom về một chỗ (DRY-1); tìm trong `shared.kernel` (`Texts`, `ImmutableLists`, `CodedValue`) trước khi viết mới.
- Cổng: `./gradlew checkstyleMain` (trong `check`). Toàn bộ `backend/src/main` đã sạch (27/10/2026); `backend/config/checkstyle/suppressions.xml` chỉ miễn tệp hằng số và lớp khởi động, không thêm gì vào đó.
- Ngoại lệ chuỗi (CON-2): chuỗi rỗng, chú thích ánh xạ (`@Table/@Column/@Param/@Mapping`...), giá trị trong `enum`; câu JPQL của `@Query` vẫn phải ở hằng số (`*Constants`). Getter/setter thuần của entity miễn Javadoc.

**Recipe for a change:** domain + domain test → new Flyway `V<n>__*.sql` (never edit an applied migration) → entity + adapter mapping → command/query → endpoint → `*IT` test (positive + negative, foreign resource ⇒ 404) → e2e if UI changes.

**JPA pitfalls already met here:** Hibernate flushes INSERT before UPDATE (flush the update first when a partial unique index is involved — see `JpaIdentityStore.invalidateRecoveryCode`); keep `@Version` + `OPTIMISTIC_FORCE_INCREMENT` on `Trip`; avoid N+1 with fetch joins / `default_batch_fetch_size`; `open-in-view` is off — map inside the transaction.

**Jackson 3**: packages `tools.jackson.*` (annotations stay `com.fasterxml.jackson.annotation`).

**Run tests** (Windows): `powershell -NoProfile -ExecutionPolicy Bypass -File tools/dev.ps1 backend-test` (≈ 7 min, needs Docker) — or `/wander-verify`. Summary: `node tools/wander-status.mjs --tests`.
