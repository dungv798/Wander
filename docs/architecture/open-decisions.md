# Hàng đợi quyết định kiến trúc (Architecture Decision Queue)

> Đây là nơi ghi các quyết định **kỹ thuật** có ảnh hưởng lớn cần Product Owner (PO) trả lời.
> Quy tắc phân loại: `.claude/rules/decision-materiality.md`. Quyết định sản phẩm (Q-, P-) vẫn nằm trong master plan.
> Mỗi mục: trạng thái, khi nào cần quyết, phương án, khuyến nghị (**không phải quyết định**). Khi PO trả lời ⇒ viết ADR và đổi trạng thái.

| ID | Câu hỏi | Ảnh hưởng | Cần quyết trước | Trạng thái |
|---|---|---|---|---|
| AD-1 | Xác thực: giữ bộ lọc tự viết hay dùng Spring Security (và có dùng Keycloak như FPT không)? Bearer token hay cookie HttpOnly? | Cao — bảo mật, gắn với Q16/RG-1/RG-6 | Khi PO duyệt thiết kế Q16 | `OPEN` |
| AD-2 | Chạy backend trên AWS bằng gì: App Runner, ECS Fargate (+ALB) hay Elastic Beanstalk? DB: RDS PostgreSQL hay Aurora Serverless v2? | Cao — chi phí, độ phức tạp vận hành | Trước lần triển khai đầu (RG-5) | `OPEN` |
| AD-3 | Hạ tầng dạng mã: AWS CDK (TypeScript) hay Terraform? | Trung bình | Cùng AD-2 | `OPEN` |
| AD-4 | Giao diện: giữ React + Vite SPA, hay chuyển Next.js? Thêm TanStack Query cho gọi API? | Cao — khó đảo ngược | Trước khi làm thêm màn hình lớn | `OPEN` (đang giữ React + Vite) |
| AD-5 | Domain event + outbox (+ SQS) cho Lát 1b (đề xuất, đồng bộ nhiều người)? | Cao cho 1b | Khi bắt đầu 1b (Q6–Q8) | `OPEN` |
| AD-6 | Giới hạn tần suất dùng chung khi chạy >1 bản (Redis/ElastiCache, hoặc AWS WAF rate rule)? | Trung bình | Cùng AD-2 | `OPEN` |
| AD-7 | Hợp đồng API: viết OpenAPI và sinh client TypeScript (springdoc / openapi-generator)? | Trung bình — giảm lệch FE/BE | Trước khi đổi API | `OPEN` |
| AD-8 | Kiểm tra ranh giới module: giữ ArchUnit hay thêm Spring Modulith? | Thấp | Bất cứ lúc nào | `OPEN` (đang dùng ArchUnit) |
| AD-9 | Ánh xạ entity ↔ domain: viết tay (hiện tại) hay MapStruct (như FPT)? | Thấp | Bất cứ lúc nào | `OPEN` (viết tay) |
| AD-10 | Xóa server TypeScript cũ (`legacy/ts-server/`) sau khi xác nhận backend Java ngang bằng? | Thấp | Sau khi PO xem kết quả verify | `OPEN` |
| AD-11 | Giữ Java 21 + Spring Boot 4.1, hay dùng Java 17 + Spring Boot 3.5 cho giống FPT (3.5 đã hết hỗ trợ OSS)? | Trung bình | Sớm, trước khi viết nhiều code | `APPROVED` → [ADR-004](adr/ADR-004-java21-spring-boot-4.md) (PO, 24/10/2026: Java 21 + Boot 4.1) |

## Chi tiết và khuyến nghị (không phải quyết định)

### AD-1 — Cơ chế xác thực
- **A. Giữ bộ lọc tự viết** (hiện tại): ít phụ thuộc; khớp chính xác thiết kế Q16 nháp. Nhược: tự lo mọi chi tiết bảo mật.
- **B. Spring Security, token phiên tự quản lý**: chuẩn ngành, có sẵn CSRF/CORS/header; học được cách cấu hình `SecurityFilterChain`. Nhược: thêm khái niệm; vẫn phải tự viết luồng mã khôi phục.
- **C. Keycloak (OIDC) như FPT**: học được IAM thật. Nhược: D21 không có email/điện thoại, luồng danh tính ẩn danh + mã khôi phục không khớp mô hình người dùng của Keycloak; phải chạy thêm một dịch vụ.
- Khuyến nghị: **B** khi chốt Q16 (giữ mô hình danh tính ẩn danh, đổi phần khung sang Spring Security). C chỉ hợp lý nếu PO muốn luyện Keycloak, chấp nhận lệch sản phẩm.

### AD-2/AD-3 — AWS
- Xem `docs/architecture/aws-deployment.md` (phương án, sơ đồ, chi phí ước lượng là `UNVERIFIED`).
- Khuyến nghị để học sát công việc: **ECS Fargate + ALB + RDS PostgreSQL + Secrets Manager + S3/CloudFront**, hạ tầng bằng **CDK TypeScript**. Rẻ/đơn giản nhất: App Runner.

### AD-4 — Giao diện
- Giữ React + Vite: đã chạy, e2e xanh, SPA tĩnh đặt lên S3/CloudFront dễ. Next.js chỉ đáng khi cần SEO/SSR (trang chia sẻ công khai ở Lát 3).
- Khuyến nghị: giữ React + Vite; cân nhắc TanStack Query khi màn hình nhiều trạng thái tải.
