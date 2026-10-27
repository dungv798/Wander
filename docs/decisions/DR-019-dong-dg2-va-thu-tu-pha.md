# DR-019 — Đóng cổng DG-2, thứ tự pha, Q10, Q15 (PO, 26/10/2026)

- **Trạng thái:** `APPROVED` — PO trả lời bằng `AskUserQuestion` 26/10/2026. Bổ sung `DR-018`.

| Mục | PO chọn | Hệ quả |
|---|---|---|
| **Đóng DG-2** | **Đóng**, danh sách còn mở ở DR-018 §5 | Thiết kế v6 + bộ màu Nắng vàng (DR-013, DR-017) được duyệt làm chuẩn cho pha FE. Hoãn có chủ đích (không chặn FE): nền tối, minh họa 3D thật, trang chủ màn rộng chuốt thêm, thử cảm ứng thật, Taste và product-analyst cho v6. Quy tắc `design-first.md` vẫn áp dụng khi thiết kế đổi lớn (mở lại cổng) |
| **Thứ tự pha** | 1a hoàn chỉnh → pha admin/F4 → 1b → N-4 → N-2b → N-1 → N-3 | Bắt đầu bằng **pha FE** (`web/` dựng từ prototype + chuẩn FE, API giả trước), rồi backend 1a |
| **Q10** thứ tự Lát 2/3 | Giữ thứ tự plan, quyết sau khi 1b chạy | |
| **Q15** mạng yếu | Xem được chuyến đã mở gần nhất khi mất mạng; sửa phải có mạng | Cache đọc phía máy (service worker), thử lại khi có mạng, không đồng bộ sửa ngoại tuyến (hợp Q8) |

Còn mở sau DR-019: câu Tầng A riêng của N-1/N-3/N-4 khi tới lượt (xem DR-018 §5 mục 2); HMAC pepper/RG-2/RG-5/RG-6/RG-7 và rủi ro B2 trước khi phát hành thật.
