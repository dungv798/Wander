# legacy/ts-server — server TypeScript cũ (chỉ để tham chiếu)

Bản cài đặt Lát 1a đầu tiên (Node + SQLite, ADR-001), đã được thay bằng backend Java theo
[ADR-002](../docs/architecture/adr/ADR-002-java-spring-stack.md). Giữ lại vì:

- là **bản tham chiếu hợp đồng API** `/api/*` (tên trường, mã lỗi) mà giao diện `web/` dựa vào;
- các test cũ (`legacy/ts-server/test`) là nguồn của test Java tương ứng (`PlanningApiIT`, `RecoveryApiIT`).

Không phát triển thêm ở đây. Xóa khi PO xác nhận backend Java ngang bằng (AD-10 trong `docs/architecture/open-decisions.md`).
Chạy lại test cũ nếu cần so sánh: `npm run test:legacy` (Node ≥ 24).
