# ADR-007 — Xóa `legacy/ts-server/` (AD-10)

- **Trạng thái:** `APPROVED` — PO chọn "Xóa hẳn" ngày 24/10/2026 sau phiên `/wander-council AD-10` (không gọi agent: câu hỏi nhỏ, dữ kiện đọc trực tiếp).
- **Thực hiện:** 24/10/2026, theo yêu cầu "làm luôn việc dọn legacy" của PO (ngoài phiên hội đồng). Kết quả `verify` 24/10 12:45: PASS (`.logs/verify.log`) — doctor, tools-check, backend-test, e2e 4/4 đều PASS.

## Quyết định
Xóa thư mục `legacy/` (19 file: `legacy/README.md` và `legacy/ts-server/**`). Server TypeScript cũ (ADR-001, superseded bởi ADR-002) không còn được giữ làm tham chiếu hợp đồng API.

## Dữ kiện tại thời điểm quyết định (đọc 24/10/2026)
- 19 file đã commit ở `b6bd606`, chưa sửa: khôi phục được bằng `git`.
- Java: 83/83 test xanh (`verify` PASS 24/10 08:24). Hợp đồng API còn nằm trong `web/src/api.ts` và các test `PlanningApiIT`, `RecoveryApiIT`.
- Số ca test: legacy 78 (`test()/it()`), Java 73 `@Test` (83 ca kể cả tham số hóa). **Parity từng ca chưa chứng minh (`UNVERIFIED`)**; PO chấp nhận rủi ro này.
- Phần recovery của bản cũ sẽ lạc hậu khi Q16 đổi thiết kế.

## Việc phải làm khi thực hiện
1. Xóa `legacy/`.
2. `e2e/browser.test.ts` (dòng 20–22): gỡ đường dự phòng import `../legacy/ts-server/src/api/*`; e2e chỉ chạy với backend Java (`WANDER_BASE_URL`).
3. `package.json`: gỡ `test:legacy`, `typecheck:legacy`, `start:legacy` (và phụ thuộc chỉ dùng cho legacy, nếu có).
4. Sửa tham chiếu trong `CLAUDE.md`, `docs/architecture/README.md`, `docs/architecture/adr/ADR-002-java-spring-stack.md` (ghi chú), `docs/implementation/decisions.md` (dòng cấu trúc §1), `.claude/rules/wander-product-context.md`, `.claude/skills/wander-kit/SKILL.md`.
5. Chạy `/wander-verify verify` (tests Java + e2e) và đọc kết quả từ `.logs`.

## Phương án đã cân nhắc
| Phương án | Kết quả |
|---|---|
| Xóa hẳn | **Chọn** |
| Giữ đến khi Q16 duyệt | Không chọn: phần recovery sẽ lạc hậu, tiếp tục có code chết và đường dự phòng e2e |
| Giữ để đọc, gỡ khỏi e2e và npm | Không chọn |

## Hệ quả
- Mất bản tham chiếu chạy được; muốn xem lại dùng `git show b6bd606:legacy/ts-server/...`.
- Bớt một cây mã, một đường dự phòng e2e và ba script npm phải duy trì.
