# ADR-002 — Stack Java/Spring, Clean Architecture, DDD, CQRS, PostgreSQL, AWS; giao diện TypeScript

- **Trạng thái:** `APPROVED` — Product Owner chọn ngày 24/10/2026 (trong phiên làm việc với Claude).
- **Thay thế:** ADR-001 (TypeScript trên Node + SQLite, do agent tự chọn ngày 23/10/2026 mà không hỏi PO) → `SUPERSEDED`.
- **Lý do của PO:** dự án làm vì thích và để **học**; muốn dùng đúng stack đang làm ở FPT để luyện tay và mang kinh nghiệm về công việc.

## 1. Những gì PO đã chọn (APPROVED)

| Hạng mục | Lựa chọn của PO |
|---|---|
| Ngôn ngữ backend | Java |
| Kiến trúc | Clean Architecture + DDD + CQRS |
| Tổ chức hệ thống | **Modular monolith** (một ứng dụng, chia module theo bounded context; tách service sau nếu cần) |
| Cơ sở dữ liệu | PostgreSQL |
| Truy cập dữ liệu | **JPA + Hibernate** (cả phía ghi và phía đọc) |
| Đám mây | AWS |
| Giao diện | TypeScript |

## 2. Mặc định do Claude điền để chạy được (DEFAULTED — PO có thể đổi, xem `docs/architecture/open-decisions.md`)

| Hạng mục | Mặc định | Vì sao | Đảo ngược |
|---|---|---|---|
| Phiên bản | Java 21 (LTS), Spring Boot 4.1.2, Hibernate 7.4, Gradle 9.8 (Kotlin DSL) | **`APPROVED` qua ADR-004 (AD-11, 24/10/2026)** | Dễ (đổi số phiên bản) |
| Build | Gradle (giống CV) | | Trung bình |
| Migration | Flyway (`backend/src/main/resources/db/migration`) | Schema có phiên bản, Hibernate chỉ `validate` | Trung bình |
| Test | JUnit 5 + AssertJ, **Testcontainers** (PostgreSQL thật trong Docker), **ArchUnit** (luật kiến trúc thành test) | Test gần môi trường thật; kiến trúc được kiểm tra tự động | Dễ |
| Bảo mật | Bộ lọc phiên tự viết (giữ đúng hợp đồng cũ); **chưa** dùng Spring Security/Keycloak | Thiết kế xác thực Q16 vẫn `OPEN` (RG-1); chọn framework bảo mật là quyết định riêng (AD-1) | Trung bình |
| Giao diện | Giữ React 19 + Vite + TypeScript hiện có | Đã là TypeScript; đổi framework là quyết định riêng (AD-4) | Khó |
| AWS | Chỉ "sẵn sàng cho AWS": cấu hình qua biến môi trường, Dockerfile, health check. **Chưa tạo tài nguyên nào** | RG-1, RG-5: chưa được phát hành; chọn dịch vụ AWS là quyết định riêng (AD-2, AD-3) | — |

## 3. Hệ quả

- Server TypeScript cũ chuyển vào `legacy/ts-server/` làm **bản tham chiếu hợp đồng API**; đã xóa theo [ADR-007](ADR-007-remove-legacy-ts-server.md) (AD-10, 24/10/2026) — bản cũ xem bằng `git show b6bd606:legacy/ts-server/<file>`.
- Hợp đồng HTTP `/api/*` giữ nguyên từng trường và mã lỗi, nên giao diện và 4 kịch bản e2e dùng lại không sửa.
- Các agent không còn được nói "chưa chọn stack". Mọi lựa chọn công nghệ **ngoài** bảng trên (thêm thư viện runtime, dịch vụ AWS, framework bảo mật, đổi kiến trúc) là quyết định **Tầng A** — phải hỏi PO (`.claude/rules/decision-materiality.md`).

## 4. Phương án đã cân nhắc

| Phương án | Vì sao không chọn |
|---|---|
| Giữ TypeScript/Node + SQLite (ADR-001) | Không đúng mục tiêu học của PO; SQLite không phải thứ dùng ở công việc |
| Microservices + BFF (giống dự án FPT) | Một người làm, 2 bounded context nhỏ: chi phí vận hành (nhiều deploy, gọi mạng, nhất quán phân tán) lớn hơn lợi ích. Modular monolith giữ ranh giới rõ để tách sau |
| JPA phía ghi + MyBatis phía đọc | PO chọn JPA + Hibernate cho cả hai; phía đọc vẫn tách bằng JPQL projection (xem ADR-003) |
