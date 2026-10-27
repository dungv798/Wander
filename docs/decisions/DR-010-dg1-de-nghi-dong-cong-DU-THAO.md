# DR-010 — Đóng cổng DG-1 (APPROVED 25/10/2026)

> **Trạng thái: APPROVED — 25/10/2026.** PO chọn "Duyệt đóng DG-1" trong phiên làm việc (kèm quyết định A1/A2/B1 ở `DR-011`). Cổng DG-1 **ĐÃ ĐÓNG**; backend mới được làm theo `docs/ux/data-needs.md` §2, lát nào chờ câu Tầng A nào thì dừng đúng chỗ. (Tên tệp giữ "DU-THAO" để không gãy liên kết cũ.)

## 1. Tám mục đóng DG-1: tình trạng theo bằng chứng (đêm 25/10/2026)
| # | Mục | Tình trạng | Bằng chứng |
|---|---|---|---|
| 1 | User flow F1–F14 | Có | `docs/ux/user-flows.md` |
| 2 | Kiểm kê màn hình (mục đích, dữ liệu, hành động, rỗng/lỗi/tải/ngoại tuyến) | Có | `docs/ux/screens.md` |
| 3 | Hệ thiết kế | Có | `docs/ux/design-system.md` (+ mục 10a) |
| 4 | Prototype bấm được, ảnh 390 sáng/tối cho từng màn | Có (ảnh), ghi chú ở `docs/ux/PO-REVIEW.md` | `docs/ux/screenshots/INDEX.md`; 12 luồng tự động đạt |
| 5 | Truy cập (tương phản, vùng chạm 44 px, tên, nhãn) | Đạt theo công cụ; **chưa kiểm** trình đọc màn hình, thiết bị thật, chữ 200% | `a11y-scan --strict`, `contrast.mjs` |
| 6 | Ánh xạ thiết kế → dữ liệu/API | Có | `docs/ux/data-needs.md` |
| 7 | Phản biện độc lập không còn BLOCKER/MAJOR | Vòng 1 (3 tác tử) + vòng 2 (skeptic): đã sửa mọi MAJOR Tầng B; **các điểm Tầng A nằm ở mục 2** | báo cáo trong phiên, tóm tắt ở `PO-REVIEW.md` |
| 8 | PO duyệt bằng văn bản | **Chờ anh** | tệp này |

## 2. Việc anh cần quyết (Tầng A) trước/khi mở backend
Chi tiết, phương án và khuyến nghị: `docs/ux/po-questions.md`. Chặn backend theo thứ tự: **A1** (R12), **A2** (30 ngày), **B1** (xác thực lại xóa từng mục), **A3** ("Dự kiến N ngày"); trước RG-2: **B2**, **B3**; sau đó **E1** và còn lại. Phạm vi: **C2** (nhóm = bản thử 1b, ngoài danh sách backend 1a). Quản trị: **Q-d** chưa quyết.

## 3. Anh chọn một trong
- [x] Duyệt đóng DG-1 với các câu Tầng A còn mở ở mục 2 (backend làm theo thứ tự `data-needs.md` §2, lát nào chờ câu nào thì dừng đúng chỗ đó). **Đã chọn 25/10/2026.** A1, A2, B1 đã quyết ở `DR-011`; còn mở: A3, B2, B3, B4, E1, Q-d, Q6–Q9, Q12.
- [ ] Chưa đóng: cần sửa thêm (ghi rõ).

## 4. Điều DR này KHÔNG làm
Không sửa `docs/wander-master-plan.md` (A1/A2 cần DR riêng nếu anh chọn đổi chữ R12/R7/D19); không duyệt Q-d, Q6–Q9, Q12; không cho phép ra mắt người dùng thật (RG-2, RG-5, RG-6, RG-7 vẫn mở).
