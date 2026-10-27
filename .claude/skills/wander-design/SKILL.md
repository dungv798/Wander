---
name: wander-design
description: Điều phối giai đoạn thiết kế UI/UX và user flow của Wander theo cổng DG-1 (`.claude/rules/design-first.md`). Gọi khi PO nói "làm thiết kế", "thiết kế màn", "user flow", hoặc khi bắt đầu một lát thiết kế mới. Bắt buộc gọi các kỹ năng theo từng giai đoạn và ghi "Công cụ đã dùng".
---

# wander-design

Mục tiêu: hoàn tất thiết kế (DG-1) trước khi làm backend mới. Đọc `.claude/rules/design-first.md` và `docs/ux/design-spec.md` trước.

## Vòng cho mỗi lát thiết kế (mô-đun trong bản đồ khả năng)
1. **Xác định lát** từ `docs/ux/design-spec.md` §Phase 0 và `docs/implementation/todo.md`. Chưa có spec được PO duyệt → gọi `spec-driven-development`, viết spec, **dừng chờ duyệt**.
2. **Kế hoạch:** đã duyệt spec → gọi `planning-and-task-breakdown` (ghi `docs/implementation/plan.md`, `todo.md`); mỗi việc có tiêu chí chấp nhận và cách kiểm.
3. **Thiết kế:** gọi `ui-ux-pro-max` (đọc `references/quick-reference.md`; tra `data/*.csv` bằng Grep nếu chưa có Python) để lấy danh sách kiểm truy cập, chạm, responsive, điều hướng, kiểu chữ, biểu đồ. Với màn/luồng lớn, giao brief chi tiết cho agent UX và agent UI (general-purpose) và **ghi lại brief**. Viết/ sửa `docs/ux/user-flows.md`, `screens.md`, `design-system.md`.
4. **Dựng** vào `docs/ux/prototype/`. **Chụp ảnh thật** bằng playwright (390 và 1280 px, sáng và tối, các trạng thái rỗng/lỗi/tải), **xem từng ảnh**. Thử luồng bấm thật. Tính tương phản bằng script.
5. **Phản biện:** `wander-skeptic-qa` + `wander-product-analyst` (≤ 2 vòng, ≤ 6 lượt, brief tự đủ, không đưa ý kiến của mình).
6. **Sửa** theo phát hiện; lỗi chạy → `systematic-debugging` (đọc lỗi thật trước khi đoán). Lặp 4–6 tối đa 3 lần rồi báo cáo phần còn lại.
7. **Báo cáo** (tiếng Việt, ngắn): đã làm gì, ảnh/artifact để PO xem, Tầng A đang chờ (đặt lên đầu), **"Công cụ đã dùng"** (kỹ năng và agent thật sự đã gọi), file đã đổi.

## Không bao giờ
Làm migration/API/domain mới khi DG-1 còn mở · báo "xong" khi chưa xem ảnh chụp thật · bịa số sao/giá/giờ mở cửa · bỏ qua kỹ năng bắt buộc mà không nói · commit khi PO chưa yêu cầu.
