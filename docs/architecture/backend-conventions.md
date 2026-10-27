# Quy ước backend Wander (v1)

- **Trạng thái:** `APPROVED` — PO chọn "A. Duyệt cả bộ (Recommended)" ngày 27/10/2026 sau khi xem trang kế hoạch `Wander Backend Blueprint` (câu Q0). Khuyến nghị của agent trùng lựa chọn của PO.
- **Phạm vi:** `backend/**`. Bổ sung cho `.claude/rules/backend.md` (bản rút gọn nạp tự động), ADR-003 (tầng, CQRS), ADR-008 (MapStruct), ADR-011/012/013.
- **60 quy tắc.** Cột "Thi hành": **có** = đã có trong repo; **mới (đề xuất)** = đã duyệt nhưng chưa làm xong (xem "Tiến độ thi hành"); **review** = người/agent canh khi duyệt PR. Mục tiêu là đẩy dần "review" sang máy.
- Ngoại lệ cho luật ArchUnit: ghi kèm lý do (`FreezingArchRule` cho nợ cũ), **không nới luật**.
- Nguồn lập luận và sơ đồ: trang kế hoạch (Artifact) và các ADR ở trên. Con số ngưỡng trong kế hoạch là ví dụ, `UNVERIFIED` tới khi có số đo.

## Cách phân loại thay đổi
Tầng A (hỏi PO), B (quyết và ghi `decisions.md` §2), C (làm luôn): `.claude/rules/decision-materiality.md`. Phá vỡ hợp đồng API `web/src/api.ts` luôn là Tầng A.

### Kiến trúc và phụ thuộc

| ID | Quy tắc | Thi hành |
|---|---|---|
| ARC-1 | Hướng phụ thuộc: `api → application → domain ← infrastructure`. | có · ArchUnit |
| ARC-2 | `domain` chỉ phụ thuộc `java.*`, `shared.kernel` và domain cùng module. | có · ArchUnit |
| ARC-3 | Module không import module khác; giao tiếp bằng id, sự kiện hoặc port rõ ràng. | có · ArchUnit (cần thêm module mới vào danh sách) |
| ARC-4 | `@Transactional` chỉ ở `application`. | mới · ArchUnit |
| ARC-5 | Chỉ dùng constructor injection; cấm `@Autowired` trên field. | mới · ArchUnit (`NO_CLASSES_SHOULD_USE_FIELD_INJECTION`) |
| ARC-6 | Không vòng phụ thuộc giữa các package con của một module. | mới · ArchUnit slices |
| ARC-7 | Controller không phụ thuộc `*Repository`, `*Entity` hay `jakarta.persistence`. | mới · ArchUnit |
| ARC-8 | Lớp `*Entity` chỉ nằm ở `infrastructure`; entity không thoát khỏi tầng này. | mới · ArchUnit |
| ARC-9 | `shared.kernel` nhỏ và không có nghiệp vụ; thêm vào đó cần lý do ghi trong PR. | review |

### Domain

| ID | Quy tắc | Thi hành |
|---|---|---|
| DOM-1 | Aggregate root giữ mọi bất biến; thay đổi đối tượng con chỉ qua root. | review + test domain |
| DOM-2 | Value object bất biến (record), tự kiểm tra trong constructor/factory. | review + test domain |
| DOM-3 | Tham chiếu aggregate khác chỉ bằng id. | review |
| DOM-4 | Một giao dịch sửa một aggregate; cần nhiều aggregate thì dùng sự kiện, nhất quán sau cùng. | review |
| DOM-5 | Domain ném `WanderException(kind, code, field)`, không biết HTTP. | có · ArchUnit |
| DOM-6 | Thời gian lấy từ `Clock` được inject, không gọi `Instant.now()` trong domain. | mới · ArchUnit |
| DOM-7 | Sự kiện miền: tên thì quá khứ, chỉ mang id và dữ liệu tối thiểu, không mang entity. | review |

### Application

| ID | Quy tắc | Thi hành |
|---|---|---|
| APP-1 | Một use case = một record lệnh/truy vấn + một phương thức handler = một giao dịch. | review |
| APP-2 | Lệnh trả id; truy vấn trả record phẳng. | review |
| APP-3 | Gói `query` không nạp aggregate, không dùng `*Repository`. | có · ArchUnit |
| APP-4 | Kiểm tra quyền sở hữu trong handler/query; tài nguyên của người khác ⇒ 404 như không tồn tại. | có · *IT |
| APP-5 | Handler không chứa quy tắc nghiệp vụ: gọi vào domain. | review |

### Hạ tầng và dữ liệu

| ID | Quy tắc | Thi hành |
|---|---|---|
| DB-1 | Mọi thay đổi schema qua Flyway `V<n>__mo_ta.sql`; không sửa file đã chạy. | có · checksum Flyway |
| DB-2 | Migration tương thích ngược (expand/contract, 4 bước). | review + checklist PR |
| DB-3 | Bảng và cột `snake_case`; thời gian `timestamptz` tên `_at`; id `uuid` (bảng mới dùng v7). | review |
| DB-4 | Không khóa ngoại giữa bảng khác module. | mới · test quét schema |
| DB-5 | Cột khóa ngoại và cột lọc thường xuyên có index; truy vấn mới kèm kết quả `EXPLAIN` trong PR. | review |
| DB-6 | `ddl-auto: validate`, `open-in-view: false`. | có · cấu hình + test khởi động |
| DB-7 | Không `FetchType.EAGER`; N+1 xử lý bằng fetch join/batch; đường nóng có test đếm truy vấn. | mới · ArchUnit + *IT |
| DB-8 | Ánh xạ entity↔domain bằng MapStruct và chỉ ở `infrastructure`. | có · ArchUnit (ADR-008) |

### API

| ID | Quy tắc | Thi hành |
|---|---|---|
| API-1 | URL dùng danh từ số nhiều lồng theo quyền sở hữu; hành động hiếm gặp mới dùng sub-resource. | review |
| API-2 | Giữ hợp đồng `web/src/api.ts`; thay đổi chỉ cộng thêm; phá vỡ là Tầng A. | e2e + review |
| API-3 | Lỗi luôn là `ApiError`; mã lỗi ổn định `SCREAMING_SNAKE`; message cho người dùng bằng tiếng Việt. | có · *IT |
| API-4 | `ErrorKind` → HTTP chỉ ánh xạ ở `ApiExceptionHandler`. | có · cấu trúc code |
| API-5 | POST tạo tài nguyên chấp nhận `Idempotency-Key`. | mới · *IT |
| API-6 | Danh sách có thể lớn dùng cursor keyset, có kích thước trang tối đa. | mới · *IT |
| API-7 | Endpoint mới dùng record request + Bean Validation; quy tắc định dạng nghiệp vụ vẫn qua `RawInput`. | review |
| API-8 | Controller mỏng: rate limit → lệnh → truy vấn → view. | review |

### Bảo mật

| ID | Quy tắc | Thi hành |
|---|---|---|
| SEC-1 | Mặc định từ chối; endpoint công khai liệt kê rõ trong `SecurityConfig`. | có · SecurityIT |
| SEC-2 | Không log token, mã khôi phục, IP thô, nội dung chuyến. | mới · test bắt log |
| SEC-3 | Bí mật chỉ đến từ biến môi trường/Secrets Manager; không commit. | mới · gitleaks |
| SEC-4 | Mọi đầu vào có giới hạn kích thước/độ dài. | có · *IT (64 KB) |
| SEC-5 | Mọi HTTP client ra ngoài có timeout và danh sách host cho phép (chống SSRF). | review + test |
| SEC-6 | Hành động nhạy cảm cần xác thực lại theo D25. | có · RecoveryApiIT |

### Vận hành và quan sát

| ID | Quy tắc | Thi hành |
|---|---|---|
| OPS-1 | Log JSON có `traceId`. ERROR = cần người xem; WARN = bất thường đã tự xử lý. | mới · cấu hình |
| OPS-2 | Mỗi use case đo được (`http.server.requests` + metric nghiệp vụ chính). | review |
| OPS-3 | Cấu hình 12-factor qua env; mặc định an toàn cho máy cá nhân. | có · application.yml |
| OPS-4 | Liveness không phụ thuộc DB; readiness có. | có · probes |
| OPS-5 | Job nền idempotent và có khóa phân tán khi chạy > 1 task. | review |

### Kiểm thử

| ID | Quy tắc | Thi hành |
|---|---|---|
| QA-1 | Domain được test thuần, không Spring, viết trước (TDD). | có · cấu trúc test |
| QA-2 | Mỗi endpoint có `*IT` dương, âm và "tài nguyên người khác ⇒ 404". | review |
| QA-3 | Test có `@DisplayName` tiếng Việt; lớp tên `*Test` hoặc `*IT`. | có · thói quen |
| QA-4 | Không `Thread.sleep` trong test, không `@Disabled` không lý do. | mới · ArchUnit/CI |
| QA-5 | Lỗi → viết test tái hiện trước khi sửa. | review |

### Quy trình git

| ID | Quy tắc | Thi hành |
|---|---|---|
| GIT-1 | Nhánh ngắn, PR nhỏ; commit theo Conventional Commits (`feat`, `fix`, `chore`...). | review |
| GIT-2 | Gộp khi `./gradlew check` xanh và PR trả lời checklist (migration, API, bảo mật, log). | mới · CI + mẫu PR |
| GIT-3 | Quyết định Tầng A có ADR; Tầng B có dòng trong `decisions.md`. | review |

### Mã và đặt tên

| ID | Quy tắc | Thi hành |
|---|---|---|
| NAM-1 | Định danh bằng tiếng Anh; Javadoc, comment và message người dùng bằng tiếng Việt (đúng như code hiện có). | review |
| NAM-2 | Hậu tố: `*Controller`, `*Commands`/`*CommandHandler`, `*Queries`, `*Entity`, `*JpaRepository`, `Jpa*` (adapter), `*Mapper`. | mới · ArchUnit |
| NAM-3 | Không dùng `Optional` làm tham số hay field; không trả `null` thay cho tập rỗng. | review |
| NAM-4 | Định dạng mã tự động (Spotless) và chạy trong `check`. | mới · Gradle |

## Tiến độ thi hành (cập nhật khi làm)
Xem phần cuối tài liệu này; không sửa quy tắc ở trên để phản ánh tiến độ.

## Quy ước mã bắt buộc (PO, 27/10/2026)

PO yêu cầu: tên theo nghĩa và một mẫu cho toàn source; gom hàm dùng nhiều; comment trên mọi method; tránh phức tạp; không hardcode chuỗi/số mà đưa vào tệp hằng số, chia hằng số của chức năng với hằng số hệ thống và nền chung. Cụ thể hóa thành các quy tắc sau (thi hành bằng Checkstyle trong `./gradlew check`, cấu hình ở `backend/config/checkstyle/`).

| ID | Quy tắc | Thi hành |
|---|---|---|
| CON-1 | Hằng số chia **3 tầng**. (1) **NỀN** `shared.kernel.CommonConstants`: giá trị chung không mang nghĩa nghiệp vụ. (2) **HỆ THỐNG**: `shared.kernel.SystemConstants`, `ErrorCodes`, `ErrorMessages`, `ConfigConstants`, `shared.web.HttpConstants`: giá trị định hình hành vi cả ứng dụng. (3) **CHỨC NĂNG**: tệp `<ChứcNăng>Constants` (kèm `*Messages`, `*ErrorCodes`, `*Fields` khi cần) đặt cạnh chức năng/module dùng nó; module khác không import. Dùng tầng thấp nhất đủ dùng. | review + ArchUnit (module độc lập) |
| CON-2 | Không chuỗi ma thuật: mã lỗi, lời báo, khóa JSON, đường dẫn, tên header, regex, khóa cấu hình, JPQL đều nằm trong `*Constants`, `*ErrorCodes`, `*Messages`, `*Fields`. Ngoại lệ: chuỗi rỗng; chú thích khai báo `@SuppressWarnings`, `@Table`, `@Column`, `@JoinColumn`, `@Entity`; giá trị trong khai báo hằng `enum`; mã test | Checkstyle `IllegalTokenText` |
| CON-3 | Không số ma thuật (ngoài -1, 0, 1, 2): giới hạn, thời lượng, kích thước, hệ số nằm trong `*Constants` | Checkstyle `MagicNumber` |
| CON-4 | Mỗi hằng có Javadoc một dòng (nghĩa + đơn vị). Lời báo có tham số dùng `String.formatted` với `%s`/`%d` và ghi tham số trong Javadoc | review |
| DOC-1 | Mọi method (kể cả private) có Javadoc ngay trên tên (trên các annotation): một câu tiếng Việt nói LÀM GÌ + điều tên không nói (đơn vị, trường hợp biên, ném lỗi gì). Ngoại lệ: `@Override` | Checkstyle `MissingJavadocMethod` |
| NAM-5 | Tên nói đúng nghĩa, theo một mẫu: lớp = danh từ theo vai trò (`TripCommandHandler`); method = động từ + đối tượng (`handleConcurrentModification`, `toPlaceView`); boolean `is/has/can`; chuyển đổi `toXxx`; kiểm tra `requireXxx` (ném lỗi) hoặc `isXxx` (trả boolean). Cấm tên lớp mơ hồ kết thúc bằng Helper, Util, Utils, Utility, Manager, Misc, Stuff, Base, Common, Data, Info, Thing. Không đặt tham số một chữ cái (trừ biến của `catch` và lambda ngắn) | Checkstyle `TypeName`; review |
| DRY-1 | Logic hoặc giá trị dùng từ 2 nơi: gom về một chỗ, trong module (`<Module>Validation`, hàm private) hoặc `shared.kernel` nếu nhiều module cần (`Texts`, `ImmutableLists`, `CodedValue`). Trước khi viết hàm tiện ích, tìm trong `shared.kernel` | review |
| SIM-1 | Tránh phức tạp: method ≤ 40 dòng, ≤ 6 tham số, độ phức tạp vòng ≤ 10, lồng if/for ≤ 2 tầng, biểu thức luận lý ≤ 4 toán tử, tệp ≤ 400 dòng. Vượt thì tách method nhỏ có tên nói nghĩa | Checkstyle |

**Danh sách miễn theo bậc thang** (`backend/config/checkstyle/suppressions.xml`): mã MỚI phải đạt ngay; module cũ chưa di chuyển được miễn tạm và bị gỡ khỏi danh sách khi sạch. Không thêm module/tệp mới vào danh sách miễn.

## Tiến độ thi hành (cập nhật 27/10/2026; số liệu đọc từ log trong `.logs/`)
- **T-2 ArchUnit:** thêm ARC-4…8, DOM-6, NAM-2; `ArchitectureTest` 15/15 PASSED (`.logs/arch-rules-27-10-run2.log`). QA-4 (cấm `Thread.sleep`, mã chính lẫn test) **đã thêm** 27/10/2026; `ConcurrencyIT` nay chờ bằng Awaitility.
- **Checkstyle:** cổng `checkstyleMain` nằm trong `./gradlew check`. Baseline đo trước khi di chuyển: **1.056 vi phạm** (719 chuỗi, 273 thiếu Javadoc, 50 số, 14 phức tạp/đặt tên) (`.logs/checkstyle-baseline.log`).
- **Đã sạch (0 vi phạm Checkstyle, đọc từ report):** toàn bộ `backend/src/main` — `shared`, `catalog`, `identity`, `planning`, `WanderApplication`. Danh sách miễn chỉ còn tệp hằng số và lớp khởi động.
- **Test (27/10/2026, JUnit XML):** 139 test / 19 lớp, 0 lỗi, gồm test tích hợp `*IT` với PostgreSQL thật (Docker bật) — `.logs/backend-test-27-10-planning.log`. Mốc trước khi sửa `identity`/`planning`: cũng 139/139 (`.logs/backend-test-27-10.log`).

### Ngoại lệ đã áp dụng cho CON-2 / DOC-1 (Tầng B, PO có thể thu hẹp)
- **Chuỗi trong chú thích khai báo ánh xạ:** `@SuppressWarnings`; JPA `@Table`, `@Column`, `@JoinColumn`, `@Entity`, `@CollectionTable`, `@OneToMany`, `@ManyToOne`; Spring Data `@Param` (nhãn buộc với `:x` trong JPQL); MapStruct `@Mapper`, `@Mapping` (ADR-008). Câu JPQL của `@Query` thì **vẫn** phải ở hằng số (`IdentityQueryConstants`, `PlanningQueryConstants`).
- **Giá trị trong khai báo hằng `enum`** (mã ngắn và nhãn): chính enum là nơi định nghĩa.
- **Getter/setter thuần của entity JPA** (`getX`/`setX` khớp trường) được miễn Javadoc (`allowMissingPropertyJavadoc`). Mọi method khác, kể cả accessor kiểu `id()` của record/lớp domain, vẫn bắt buộc.
- **Bộ dựng (constructor, record)** không tính vào giới hạn 6 tham số của SIM-1.
- **Mẫu đã thống nhất khi di chuyển:** tên tệp chứa JPQL phải kết thúc bằng `Constants` (ví dụ `IdentityQueryConstants`); hằng dùng ở nhiều tầng của một module đặt ở `domain` (ví dụ `PlanningConstants`, `PlanningErrorCodes`, `PlanningMessages`, `PlanningFields`); mã lỗi và lời báo dùng chung toàn hệ thống ở `shared.kernel` (`ErrorCodes`, `ErrorMessages`).

### Cổng chất lượng (ADR-013), 27/10/2026
- **Đã có trong `./gradlew check`:** test + ArchUnit (18 luật, gồm QA-4), Checkstyle mã chính (thêm hygiene: xuống dòng cuối tệp, không tab, không khoảng trắng thừa, thứ tự import, import thừa), ngưỡng JaCoCo (`jacocoTestCoverageVerification`).
- **Ngoài Gradle, chạy bằng `toolsquality.ps1 <gate|secrets|deps|all>`:** gitleaks (quét bí mật, đã che giá trị) và Trivy (lỗ hổng HIGH/CRITICAL trong jar). Cần Docker; Trivy cần mạng để tải CSDL lỗ hổng.
- **Workflow CI viết sẵn, chưa bật:** `docs/ci/backend-ci.workflow.yml` (không nằm trong `.github`).
- **Chưa làm / lệch so với ADR-013:** không dùng Spotless (xem ADR-013 phần "Ghi chú thực hiện"); chưa khóa phiên bản phụ thuộc (dependency locking); Checkstyle chưa kiểm mã test; chưa cài hook `pre-push`.
