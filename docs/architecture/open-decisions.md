# Hàng đợi quyết định kiến trúc (Architecture Decision Queue)

> Đây là nơi ghi các quyết định **kỹ thuật** có ảnh hưởng lớn cần Product Owner (PO) trả lời.
> Quy tắc phân loại: `.claude/rules/decision-materiality.md`. Quyết định sản phẩm (Q-, P-) vẫn nằm trong master plan.
> Mỗi mục: trạng thái, khi nào cần quyết, phương án, khuyến nghị (**không phải quyết định**). Khi PO trả lời ⇒ viết ADR và đổi trạng thái.

| ID | Câu hỏi | Ảnh hưởng | Cần quyết trước | Trạng thái |
|---|---|---|---|---|
| AD-1 | Xác thực: giữ bộ lọc tự viết hay dùng Spring Security (và có dùng Keycloak như FPT không)? Bearer token hay cookie HttpOnly? | Cao — bảo mật, gắn với Q16/RG-1/RG-6 | Xong cho 1a | `APPROVED` → [ADR-005](adr/ADR-005-spring-security-bearer.md) (PO, 24/10/2026: Spring Security + Bearer, làm sau khi Q16 duyệt; bí mật phiên = Bearer + `localStorage` cho 1a). RG-6 vẫn mở, xem lại ở RG-1 trước phát hành thật |
| AD-2 | Chạy backend trên AWS bằng gì: App Runner, ECS Fargate (+ALB) hay Elastic Beanstalk? DB: RDS PostgreSQL hay Aurora Serverless v2? | Cao — chi phí, độ phức tạp vận hành | Xong | `APPROVED` → [ADR-006](adr/ADR-006-aws-fargate-cdk.md) (PO, 24/10/2026: ECS Fargate + ALB + RDS single-AZ, CloudFront cùng origin). Chưa tạo tài nguyên nào |
| AD-3 | Hạ tầng dạng mã: AWS CDK (TypeScript) hay Terraform? | Trung bình | Xong | `APPROVED` → [ADR-006](adr/ADR-006-aws-fargate-cdk.md) (PO, 24/10/2026: CDK TypeScript) |
| AD-4 | Giao diện: giữ React + Vite SPA, hay chuyển Next.js? Thêm TanStack Query cho gọi API? | Cao — khó đảo ngược | Xem lại khi thêm màn hình lớn hoặc 1b cần đồng bộ | `DEFAULTED` 24/10/2026 (hội đồng, PO không phản đối): giữ React + Vite SPA (khớp ADR-006: S3 tĩnh); không Next.js (chỉ đáng ở Lát 3); không thêm TanStack Query |
| AD-5 | Domain event + outbox (+ SQS) cho Lát 1b (đề xuất, đồng bộ nhiều người)? | Cao cho 1b | Khi bắt đầu 1b (Q6–Q8) | `APPROVED` một phần → [ADR-011](adr/ADR-011-spring-modulith-va-outbox.md) (PO, 27/10/2026): nền outbox = sổ sự kiện của Spring Modulith, thêm khi tạo module thứ tư; sự kiện cụ thể chờ 1b (Q6–Q8). SQS chỉ khi tách tiến trình |
| AD-6 | Giới hạn tần suất dùng chung khi chạy >1 bản (Redis/ElastiCache, hoặc AWS WAF rate rule)? | Trung bình | Khi chạy >1 task, hoặc WAF trước phát hành thật | `APPROVED` một phần → [ADR-006](adr/ADR-006-aws-fargate-cdk.md) (PO, 24/10/2026: in-memory, 1 task, sửa cách lấy IP). Redis/WAF: hoãn |
| AD-7 | Hợp đồng API: viết OpenAPI và sinh client TypeScript (springdoc / openapi-generator)? | Trung bình — giảm lệch FE/BE | Khi 1b làm API tăng mạnh hoặc có client thứ hai | `DEFAULTED` 24/10/2026 (hội đồng, PO chọn không thêm): giữ hợp đồng viết tay ở `web/src/api.ts` |
| AD-8 | Kiểm tra ranh giới module: giữ ArchUnit hay thêm Spring Modulith? | Thấp | Xem lại khi có module thứ tư | `DEFAULTED` 24/10/2026 (hội đồng, PO chọn không thêm): giữ ArchUnit. Module thứ ba `catalog` ra đời 25/10/2026 ([ADR-010](adr/ADR-010-module-catalog.md)); ba module vẫn kiểm được bằng luật ArchUnit đơn giản nên giữ nguyên |
| AD-13 | Kho địa điểm biên tập đặt ở module riêng hay trong `planning`? | Trung bình | Xong | `APPROVED` → [ADR-010](adr/ADR-010-module-catalog.md) (PO, 25/10/2026: module mới `catalog`, chỉ đọc) |
| AD-9 | Ánh xạ entity ↔ domain: viết tay (hiện tại) hay MapStruct (như FPT)? | Thấp | Xong | `APPROVED` → [ADR-008](adr/ADR-008-mapstruct.md) (PO, 24/10/2026: dùng MapStruct để học; hội đồng khuyến nghị giữ tay). Đã thực hiện 24/10/2026 (`verify` PASS) |
| AD-10 | Xóa server TypeScript cũ (`legacy/ts-server/`) sau khi xác nhận backend Java ngang bằng? | Thấp | Xong | `APPROVED` → [ADR-007](adr/ADR-007-remove-legacy-ts-server.md) (PO, 24/10/2026: xóa hẳn). Đã thực hiện 24/10/2026; `verify` PASS |
| AD-12 | Nguồn dữ liệu địa điểm cho bộ thẻ quẹt (API trả phí hay kho tự biên tập)? | Cao — chi phí, giấy phép, chất lượng thẻ | Xong | `APPROVED` → [ADR-009](adr/ADR-009-nguon-dia-diem-mien-phi.md) (PO, 24/10/2026: miễn phí, biên tập theo điểm đến sau cổng `PlaceCatalog`; Google thêm sau) |
| AD-14 | Bản đồ sản phẩm thật: giữ bản đồ địa hình riêng của Wander, hay MapLibre (+ OpenFreeMap hoặc PMTiles tự lưu trên S3), hay Mapbox/Google? | Trung bình đến cao — dependency, chi phí, tương tác | Trước khi cần xoay/nghiêng, theo dõi vị trí hoặc nhiều điểm đến | `APPROVED` (a) → [DR-017](../decisions/DR-017-giu-bo-mau-hien-tai-va-ban-do-rieng.md) (PO, 26/10/2026: giữ bản đồ riêng tới hết Lát 1a); nghiên cứu ở [map-options.md](map-options.md) |
| AD-15 | Spring Modulith + nền sự kiện (outbox) khi nào? (gộp AD-5 và xem lại AD-8) | Trung bình, cho 1b | Khi tạo module thứ tư (pha admin) | `APPROVED` → [ADR-011](adr/ADR-011-spring-modulith-va-outbox.md) (PO, 27/10/2026: thêm khi tạo module thứ tư; ArchUnit giữ luật tầng) |
| AD-16 | Chiến lược cache | Thấp–trung bình | Xong (hướng) | `APPROVED` → [ADR-012](adr/ADR-012-chien-luoc-cache.md) (PO, 27/10/2026: chính sách + HTTP cache trước; Caffeine khi có ứng viên; không cache phiên; Valkey khi > 1 task) |
| AD-17 | Công cụ trace: starter OpenTelemetry hay Java agent + ADOT? | Trung bình | Khi dựng quan sát trên AWS (T-14) | `OPEN` (hoãn có chủ đích; log JSON + metrics nền làm trước ở Tầng B) |
| AD-18 | Cổng chất lượng và CI | Trung bình | Xong (hướng) | `APPROVED` → [ADR-013](adr/ADR-013-cong-chat-luong-trong-gradle.md) (PO, 27/10/2026: cổng là tác vụ Gradle; CI viết sẵn chưa bật; không CD tới AWS). Repo chưa có remote: nơi đẩy mã là quyết định riêng của PO |
| AD-19 | Khung tích hợp ngoài, Resilience4j và hàng đợi việc (bảng job `SKIP LOCKED` hay SQS) | Trung bình–cao | Khi tới N-4/N-1/N-3 (T-16, T-18) | `OPEN` (hoãn có chủ đích theo thứ tự pha DR-019) |
| AD-11 | Giữ Java 21 + Spring Boot 4.1, hay dùng Java 17 + Spring Boot 3.5 cho giống FPT (3.5 đã hết hỗ trợ OSS)? | Trung bình | Sớm, trước khi viết nhiều code | `APPROVED` → [ADR-004](adr/ADR-004-java21-spring-boot-4.md) (PO, 24/10/2026: Java 21 + Boot 4.1) |

## Chi tiết và khuyến nghị (không phải quyết định)

### AD-1 — Cơ chế xác thực
> **Kết quả hội đồng 24/10/2026** (3 agent · 1 vòng · 3 lượt): PO chọn B (Spring Security + Bearer) → [ADR-005](adr/ADR-005-spring-security-bearer.md). Keycloak không khớp D21. Nơi lưu phiên còn `OPEN` đến AD-2 (cookie HttpOnly chỉ đáng khi giao diện và API cùng site; kéo theo CSRF/SameSite/CORS). Ghi chú gốc bên dưới là phân tích trước hội đồng.
- **A. Giữ bộ lọc tự viết** (hiện tại): ít phụ thuộc; khớp chính xác thiết kế Q16 nháp. Nhược: tự lo mọi chi tiết bảo mật.
- **B. Spring Security, token phiên tự quản lý**: chuẩn ngành, có sẵn CSRF/CORS/header; học được cách cấu hình `SecurityFilterChain`. Nhược: thêm khái niệm; vẫn phải tự viết luồng mã khôi phục.
- **C. Keycloak (OIDC) như FPT**: học được IAM thật. Nhược: D21 không có email/điện thoại, luồng danh tính ẩn danh + mã khôi phục không khớp mô hình người dùng của Keycloak; phải chạy thêm một dịch vụ.
- Khuyến nghị: **B** khi chốt Q16 (giữ mô hình danh tính ẩn danh, đổi phần khung sang Spring Security). C chỉ hợp lý nếu PO muốn luyện Keycloak, chấp nhận lệch sản phẩm.

### AD-2/AD-3 — AWS
- Xem `docs/architecture/aws-deployment.md` (phương án, sơ đồ, chi phí ước lượng là `UNVERIFIED`).
- Khuyến nghị để học sát công việc: **ECS Fargate + ALB + RDS PostgreSQL + Secrets Manager + S3/CloudFront**, hạ tầng bằng **CDK TypeScript**. ~~Rẻ/đơn giản nhất: App Runner~~ — App Runner không nhận khách hàng mới từ 30/04/2026 (tra 24/10/2026). **Kết quả hội đồng 24/10/2026:** PO chọn đúng hướng khuyến nghị này → [ADR-006](adr/ADR-006-aws-fargate-cdk.md); CloudFront cùng origin mở khóa quyết định nơi lưu phiên (AD-1 phần 2, vẫn `OPEN`).

### AD-4 — Giao diện
- Giữ React + Vite: đã chạy, e2e xanh, SPA tĩnh đặt lên S3/CloudFront dễ. Next.js chỉ đáng khi cần SEO/SSR (trang chia sẻ công khai ở Lát 3).
- Khuyến nghị: giữ React + Vite; cân nhắc TanStack Query khi màn hình nhiều trạng thái tải.

## Đã gác lại

> Câu hỏi nảy sinh giữa một phiên `/wander-council` hay `/wander-feature` nhưng nằm ngoài phạm vi phiên đó. Ghi lại để không bị quên và không bị đuổi theo giữa chừng. Khi đến lúc, chuyển thành một dòng AD-x ở bảng trên hoặc một câu hỏi sản phẩm.

| Ngày | Câu hỏi | Nảy sinh từ | Tầng |
|---|---|---|---|
| 24/10/2026 | TTL tuyệt đối và idle timeout của phiên: có không, bao lâu? (chưa thấy trong code, `UNVERIFIED`) | `/wander-council AD-1` | Sản phẩm/bảo mật → spec Q16 câu 4 |
| 24/10/2026 | OQ-1: thời hạn giữ dữ liệu chuyến mất quyền vĩnh viễn và bản sao lưu RDS (cần quyết trước ra mắt thật) | `/wander-council AD-2` | Sản phẩm/dữ liệu → Tier A |
| 24/10/2026 | Độ dài/entropy mã khôi phục (băm SHA-256 không muối: chỉ an toàn nếu mã đủ ngẫu nhiên) | `/wander-council AD-2` | Bảo mật → Q16 |
| 24/10/2026 | `ResponseHeadersFilter` đã có HSTS chưa (`UNVERIFIED`); giá ALB/NAT/Fargate/WAF `ap-southeast-1` (`UNVERIFIED`, tra Pricing Calculator trước khi tạo tài nguyên) | `/wander-council AD-2` | Tier B/C |
| 25/10/2026 | R12: đổi ngày chuyến làm mục nằm ngoài khoảng (plan chặn; prototype cho về "Chưa có ngày"; `items.day_date NOT NULL`) | DG-1 skeptic B1 → `docs/ux/po-questions.md` A1 | Sản phẩm/schema → Tier A, chặn backend |
| 25/10/2026 | "Đã xóa gần đây" 30 ngày (DR-008 Q-e) so với R7/D19 "giữ đến khi xóa vĩnh viễn" | DG-1 product-analyst → po-questions A2 | Sản phẩm/dữ liệu → Tier A (liên quan OQ-1) |
| 25/10/2026 | Xác thực lại khi xóa vĩnh viễn từng mục (DR-008 Q-e) so với QĐ-4/INV-14/D25 (chỉ cả chuyến, tạo lại mã, chuyển giao); mỗi lần đốt một mã | DG-1 security B1 → po-questions B1 | Bảo mật → Tier A, chặn backend |
| 25/10/2026 | Mã đầu tiên sau khi bỏ qua (MĐ-2) dùng làm bằng chứng xác thực lại; Thu hồi thiết bị không cần xác thực lại → kẻ cầm máy có phiên chiếm quyền vĩnh viễn | DG-1 security M1/M2 → po-questions B2 | Bảo mật → Tier A, sửa DR-001 |
| 25/10/2026 | Nhập lại 30 ký tự khi xác nhận mã (MĐ-4) quá nặng trên điện thoại; HMAC có khóa (pepper) cho băm mã | DG-1 security M7 → po-questions B3 | Bảo mật/UX → Tier A |
| 25/10/2026 | Khu vực ước tính (từ IP) trên màn duyệt thiết bị; thông báo ngoài ứng dụng; thu hồi thiết bị cũ sau khôi phục; hạn mức khôi phục toàn cục/theo nguồn | DG-1 security M3–M6 → po-questions B4–B7 | Bảo mật/dữ liệu cá nhân → Tier A |
| 25/10/2026 | Phạm vi "nhóm" trong prototype (BẢN THỬ 1b) có vào danh sách backend 1a không; Q6–Q9, Q12; Q-d (đăng nhập quản trị) | DG-1 product-analyst → po-questions C2–C4 | Sản phẩm → Tier A |

## Cập nhật 26/10/2026
PO đã quyết Q-d (Spring Security + tài khoản admin nội bộ) và các câu bảo mật/phạm vi ở [DR-018](../decisions/DR-018-po-tra-loi-hang-loat-26-10.md). Câu AD mới cần hỏi khi tới lượt: nhà cung cấp AI + chi phí (N-3), nguồn nhập MXH/Maps (N-1), nguồn thời tiết (N-4).
