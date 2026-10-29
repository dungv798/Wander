# DR-029 — Top 5 UX và hiệu ứng chọn từ báo cáo hành trình người dùng mới (PO, 29/10/2026)

- **Trạng thái:** `APPROVED` theo `AskUserQuestion` 29/10/2026. Căn cứ: `docs/design/new-user-journey.md` (Codex đóng vai người dùng mới, 73 ảnh, 12 phát hiện, chưa có P0; các nhận định tác động vẫn là giả thuyết sản phẩm).
- **Liên quan:** DR-024/025/026/027/028.

| Nhóm | PO chọn |
|---|---|
| Top 5 UX | **J01–J03** gọn hóa lưu chuyến, CTA luôn thấy; **J04/J09/J10** chi phí chưa biết không hiện như 0 ₫, "Chưa đặt giờ", Việt hóa Organizer; **J05/J06/J08** thoát vòng Hôm nay↔chuyến, toast không đè CTA, lối tắt Chuẩn bị/Mời bạn; **J07** xuất ảnh lịch tải được thật |
| Hiệu ứng | Chuyển ảnh thẻ→chi tiết mượt (ý 6); ảnh hiện êm, nhấn co nhẹ, tờ kéo có gợi ý (ý 7, 8); hoàn thiện "Hôm nay" thành widget đáng mở lại (ý 5); gợi ý "Thêm bữa trưa/chừa khoảng nghỉ" (ý 9) |

## Ràng buộc
- Chi phí: giữ D17/D18 (trống = chưa biết, 0 = biết bằng không, "đã bao gồm" không cộng vào tổng).
- Gợi ý ăn/nghỉ: làm bản nhắc nhẹ mở editor có sẵn; gợi ý quán cụ thể chờ PO duyệt `docs/architecture/place-record-design.md` (Tầng A).
- Xuất ảnh: không thêm dependency (canvas); ghi công ảnh giữ nguyên; không bịa số liệu trong ảnh.
- Ngoài ý định PO lần này: PO nói "có bị gì đâu" về việc lỡ đưa ảnh mẫu vào lịch sử git; giữ nguyên, không viết lại lịch sử.
