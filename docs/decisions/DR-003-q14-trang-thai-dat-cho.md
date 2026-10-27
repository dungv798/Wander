# DR-003 — Trạng thái đặt chỗ vào Lát 1a (Q14, A-14)

- **Trạng thái:** `APPROVED` — PO chọn "Thêm trạng thái đặt chỗ vào 1a trước replay" ngày 24/10/2026 (khuyến nghị của hội đồng là chưa làm; PO chọn khác).
- **Liên quan:** Q14, A-14 (plan §9, trước đây Should 🔶), P8, replay RG-4 (§10.5), cột "TRẠNG THÁI" ở plan §8/§10.

## Quyết định
Trạng thái đặt chỗ (A-14) **thuộc Lát 1a** và phải có **trước khi chạy replay**. Replay sẽ đo trạng thái này thay vì ghi nhận là thiếu sót đã biết.

## Mặc định Tier B (đảo ngược được, PO có thể đổi bằng DR mới)
Plan ghi A-14 "số trạng thái và tên gọi theo Q14" nên chi tiết chưa chốt. Mặc định dựa trên bằng chứng từ file thật (plan §2: 2 mục "Đã đặt", 62 mục "Chờ xác nhận"): **hai trạng thái, "Chờ xác nhận" (mặc định cho mục mới) và "Đã đặt"**, đổi tay từng mục, không lịch sử chỉnh sửa (D19), áp dụng cho loại mục có đặt chỗ. Ghi `DEFAULTED` ở `docs/implementation/decisions.md` §2.

## Thực hiện
Xong 24/10/2026 qua `/wander-feature`: migration `V2__booking_status.sql` (cột `booking_status`, backfill `pending` cho loại có đặt chỗ, CHECK), `BookingStatus`, API (`booking`, `bookingLabel`), UI (nút đổi trạng thái ở từng mục), `BookingStatusApiIT`, `TripTest`, e2e. Quy tắc chi tiết ghi ở `docs/implementation/decisions.md` §2 (dòng Q14 / A-14).

## Hệ quả
- Thêm story A-14: cột trạng thái ở `items` (migration mới), command/query, API (cập nhật `web/src/api.ts` và test `*IT` + e2e), UI.
- Replay (RG-4) có thể đo cột TRẠNG THÁI; phạm vi 1a lớn hơn. Việc làm qua `/wander-feature A-14`.
- Phần còn lại của Q14 (trạng thái có được cập nhật trong chuyến thật không) vẫn do PO trả lời khi chuẩn bị replay.
