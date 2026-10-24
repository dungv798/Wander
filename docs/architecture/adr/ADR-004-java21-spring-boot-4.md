# ADR-004 — Java 21 + Spring Boot 4.1 (AD-11)

- **Trạng thái:** `APPROVED` — PO chọn phương án A ngày 24/10/2026 ("A. Java 21 + Boot 4.1").
- **Bổ sung cho:** ADR-002 (dòng "Phiên bản" chuyển từ `DEFAULTED` sang `APPROVED`).

## Quyết định
Backend dùng **Java 21 (LTS)** và **Spring Boot 4.1.x** (Spring Framework 7, Hibernate 7, Jackson 3). Nâng lên Spring Boot 4.2 khi bản GA ra (dự kiến 11/2026) là thay đổi Tầng B (ghi vào `docs/implementation/decisions.md`), trừ khi có breaking change ảnh hưởng kiến trúc.

## Dữ kiện tại thời điểm quyết định (tra ngày 24/10/2026)
| Phiên bản | Hỗ trợ OSS đến | Ghi chú |
|---|---|---|
| Spring Boot 3.5 | 30/06/2026 (đã hết) | Không còn bản vá bảo mật OSS |
| Spring Boot 4.0 | 31/12/2026 | |
| Spring Boot 4.1 | 31/07/2027 | Java 17–26 |
| Spring Boot 4.2 | 31/12/2027 (dự kiến) | GA dự kiến 11/2026 |
| Temurin 17 / 21 / 25 | ít nhất 10/2027 / 12/2029 / 09/2031 | |

## Phương án đã cân nhắc
| Phương án | Vì sao không chọn |
|---|---|
| B. Java 17 + Boot 3.5 (giống FPT) | Boot 3.5 đã hết vá bảo mật OSS; phải viết lại phần Jackson 3 → 2 và lên lại sau này |
| C. Java 25 + Boot 4.1 | Mới nhất nhưng ít tài liệu; chưa cần |
| D. Java 17 + Boot 4.1 | Chỉ giống FPT về cú pháp; mất cơ hội học Java 21 |

## Hệ quả
- Được dùng tính năng Java 21 (record pattern, pattern matching trong `switch`, sequenced collections, virtual threads) khi chúng làm code rõ hơn. Bật virtual threads (`spring.threads.virtual.enabled`) là quyết định Tầng B, cần đo trước khi bật.
- Kiến thức Boot 4 (Jackson 3 `tools.jackson`, starter tách module, Spring Framework 7) là phần chênh lệch so với dự án FPT, đáng ghi chú khi gặp.

Nguồn: issoh.co.jp (bảng phiên bản Spring Boot, tra 13/10/2026), herodevs.com (Boot 3.5 EOL), adoptium.net/support (Temurin).
