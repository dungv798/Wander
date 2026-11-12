# ADR-005 — Khung xác thực: Spring Security + token phiên Bearer (AD-1, phần 1)

> **English title:** Authentication framework: Spring Security with opaque bearer session tokens
> **Summary (EN):** Spring Security provides the filter chain; session tokens stay self-managed: random bearer tokens stored as SHA-256 hashes and checked on every request, so revocation is immediate (no JWT, no Keycloak). Anonymous identity, recovery codes and trusted-device approval remain custom domain logic.

- **Trạng thái:** `APPROVED` — PO chọn "Chốt B: Spring Security + Bearer" ngày 24/10/2026, sau phiên `/wander-council AD-1` (security-reviewer, software-architect, skeptic-qa; 1 vòng).
- **Phạm vi:** **khung xác thực** và (bổ sung 24/10/2026) **nơi lưu bí mật phiên cho Lát 1a** = Bearer + `localStorage`, xem mục "Nơi lưu bí mật phiên".
- **Bổ sung cho:** ADR-002 (dòng "Bảo mật": "chưa dùng Spring Security/Keycloak" nay được thay bằng quyết định này).

## Quyết định
Thay `SessionAuthenticationFilter` tự viết bằng **Spring Security** (`spring-boot-starter-security`, `SecurityFilterChain`), giữ nguyên **mô hình token phiên tự quản lý**:
- Token ngẫu nhiên, lưu băm SHA-256 trong DB, gửi bằng `Authorization: Bearer`; phiên kiểm tra ở **mọi** request nên thu hồi có hiệu lực ngay (không dùng JWT tự chứa).
- Danh tính vẫn ẩn danh; mã khôi phục, thiết bị tin cậy, xác thực lại (D20–D26) vẫn tự viết trong `RecoveryService`/`DeviceLinkService`. Spring Security chỉ thay phần khung.
- **Không dùng Keycloak** (cả ba agent nhận định không khớp D21 và thêm dịch vụ phải vận hành; PO không chọn).

## Thời điểm
**Đã thực hiện 24/10/2026** (sau khi Q16 được duyệt, [DR-001](../../decisions/DR-001-q16-xac-thuc-khoi-phuc.md)) qua `/wander-feature ADR-005`: `SecurityConfig` (`SecurityFilterChain`, `AuthenticationFilter`, danh sách route công khai một nguồn), `SessionAuthenticationProvider`, `JsonAuthenticationEntryPoint`, `BearerSessionToken`; `CurrentPrincipal` đọc từ SecurityContext. `verify` PASS: 90/90 test backend + 4/4 e2e (kết quả trong `docs/implementation/decisions.md` §6). Chưa có người dùng thật nên không cần di trú phiên.

## Ràng buộc khi thực hiện
- `SecurityFilterChain` đặt ở `identity.api` hoặc `shared.web`; `domain` và `application` không import Spring Security (ArchUnit); không dùng `@PreAuthorize` trong `application`. Không phá ADR-003.
- Giữ hợp đồng API hiện tại: 401 trả JSON `UNAUTHENTICATED` (cần `AuthenticationEntryPoint` tùy biến), tài nguyên của người khác vẫn `404` chứ không `403`.
- 401 và mọi phản hồi `/api/*` vẫn phải có `Cache-Control: no-store`; giao diện vẫn có CSP hiện tại (kiểm tra thứ tự với `ResponseHeadersFilter`, tránh header mặc định của Security ghi đè).
- Với Bearer không cookie, CSRF có thể tắt hợp lệ; phải ghi rõ lý do trong cấu hình và test lại nếu sau này chuyển sang cookie.
- Route công khai khai báo ở một nơi (thay danh sách regex trong filter), kèm test "mọi `/api/*` khác bị chặn" và test biến thể đường dẫn (`;`, `//`, encoding).
- Chạy lại toàn bộ `*IT` (đặc biệt `RecoveryApiIT`, `PlanningApiIT`, `StaticWebIT`, nơi có nhiều assert 401/403/404).
- Test thêm: thu hồi phiên có hiệu lực ở request kế tiếp (hai thiết bị), 401 JSON, hai tab.

## Phương án đã cân nhắc
| Phương án | Kết quả |
|---|---|
| A. Giữ filter tự viết | Không chọn lúc này. Ưu: 0 thay đổi, 83 test giữ nguyên. Nhược: tự lo header/CORS/danh sách route; ít giống FPT. Hội đồng khuyến nghị hoãn; PO chọn B |
| B. Spring Security + Bearer | **Chọn** |
| C. Keycloak (OIDC) | Không chọn: lệch D21, vẫn phải tự viết recovery, thêm dịch vụ; đảo ngược khó |

## Hệ quả
- Thêm một dependency runtime (đã được PO duyệt tại đây). Học `SecurityFilterChain`, `AuthenticationFilter`/`AuthenticationEntryPoint`, giống kỹ năng ở FPT. Mở đường cho phân quyền thành viên ở 1b.
- Chi phí ước lượng 1–2 ngày (`UNVERIFIED`, từ software-architect).
- Lợi ích bảo mật trực tiếp với Bearer là nhỏ (security-reviewer, skeptic-qa): giá trị chính là chuẩn hóa và giảm mã tự chế.

## Nơi lưu bí mật phiên (AD-1 phần 2) — đã chốt cho Lát 1a
- **24/10/2026, PO chọn "Chốt Bearer + localStorage cho 1a"** (sau khi ADR-006 cho UI và API cùng origin). Thực hiện ADR-005 với Bearer; `web/src/api.ts` giữ `localStorage`. Cookie HttpOnly không làm ở 1a.
- RG-6 **vẫn mở**: XSS đọc được token là rủi ro đã chấp nhận cho 1a, xem lại khi duyệt Q16/RG-1 trước phát hành thật. Nếu sau này chuyển cookie (CSRF, SameSite, HSTS; cùng origin nên không cần CORS credentials), đó là một ADR mới sửa `api.ts`, filter và e2e.
- Tier B làm kèm: kiểm tra/thêm HSTS (chưa thấy trong `ResponseHeadersFilter`; có thể đặt ở CloudFront).

## Còn mở (không thuộc ADR này)
- TTL tuyệt đối / idle timeout của phiên: thuộc spec Q16 (câu 4); chưa thấy trong code (`UNVERIFIED`).
