# DR-008 — Duyệt đặc tả thiết kế (DG-1) và các câu hỏi mở

- **Trạng thái:** `APPROVED` — PO duyệt `docs/ux/design-spec.md` ngày 25/10/2026 ("Duyệt, làm tiếp") và chọn các phương án dưới đây bằng AskUserQuestion.
- **Liên quan:** `.claude/rules/design-first.md`, DR-005, DR-006, DR-007, `docs/ux/design-spec.md`.

## Quyết định (PO)
1. **Phạm vi DG-1:** tất cả, gồm nhóm và quản trị, mức thiết kế đầy đủ.
2. **Người mới:** khám phá trước; danh tính ẩn danh và mã khôi phục được tạo khi lưu lần đầu (D26 giữ nguyên: hiện một lần, cho bỏ qua có cảnh báo).
3. **Máy tính:** thiết kế thích ứng thật (không chỉ cột giữa); điểm ngắt mặc định 1280 / 768 px (Tầng B, ghi ở `design-system.md`).
4. **Q-a (xem kho khi chưa có danh tính):** mở riêng `GET /api/catalog/**` công khai, có giới hạn tốc độ theo IP; `/api/trips` và phần còn lại vẫn cần phiên. *Thay đổi backend sẽ làm sau DG-1, cần test route công khai và rà an ninh.*
5. **Q-b ("chưa chắc ngày"):** giữ R5. Thiết kế ô "Dự kiến N ngày" tạo khoảng ngày tạm, có cờ "chưa chắc".
6. **Q-c (quyền xóa của thành viên):** xóa trực tiếp mục do chính mình thêm; mục của người khác thì gửi đề nghị để người tạo duyệt.
7. **Q-d (đăng nhập quản trị):** chưa chốt; thiết kế màn khung, chọn cơ chế khi làm backend admin (Tầng A, sẽ hỏi lại có phương án).
8. **Q-e ("Đã xóa gần đây"):** giữ 30 ngày (giá trị cấu hình được); xóa vĩnh viễn cần xác thực lại (D25). OQ-1 vẫn mở trước khi phát hành thật.

## Hệ quả
- Đặc tả chuyển sang Phase 2 (kế hoạch) và Phase 3 (việc) bằng `planning-and-task-breakdown`.
- `data-needs.md` phải ghi các thay đổi backend hệ quả: catalog công khai (mục 4), khoảng ngày tạm có cờ (mục 5), `addedBy` và quyền xóa theo người thêm (mục 6), thời hạn giữ 30 ngày (mục 8), mục chưa có ngày (DR-006).
