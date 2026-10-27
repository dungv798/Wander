# DR-014 — Đề nghị đóng giai đoạn thiết kế DG-2 (DỰ THẢO, CHƯA DUYỆT)

> **Trạng thái: DRAFT. KHÔNG có hiệu lực** cho tới khi PO ghi `APPROVED — <ngày> — <lời của PO>` ở cuối tệp này (hoặc trả lời trong phiên). Em không tự đóng DG-2. Backend vẫn **chưa làm** theo lời PO ("chưa làm task BE, hoàn thiện design trước").
> Bối cảnh: `DR-012` (phạm vi DG-2), `DR-013` (bộ màu Nắng vàng). Gói xem: `docs/ux/PO-REVIEW-DG2.md`.

## 1. Cái em đề nghị PO xác nhận một lần (Tầng A: phạm vi)
Rà soát độc lập (`wander-product-analyst`) chỉ ra các màn **dựng thêm ngoài DR-012** (DR-012 chỉ duyệt Hôm nay, onboarding 3 thẻ, tạo chuyến nhiều bước + tuyến theo ngày). Mặc định tạm thời của em: **giữ làm khung có nhãn "BẢN THỬ", không cam kết backend**, trừ khi PO cắt.
| Cụm | Màn | Mặc định em đề xuất | Khuyến nghị của agent rà (không phải quyết định) |
|---|---|---|---|
| Không cần backend mới | S19 hết phiên, S20 lỗi theo mã, S21 cài đặt | giữ | giữ |
| Cần backend/Tầng A khi làm thật | S18 xuất (tạo tệp), A4 tải ảnh, A5 tạo điểm đến | giữ khung | **cắt khỏi tiêu chí hoàn tất DG-2** (Q-d, lưu trữ tệp) |
| Phụ thuộc 1b | G8 gỡ thành viên (đã giới hạn: chỉ người tạo thấy) | giữ khung | **để 1b** |

## 2. Câu hỏi Tầng A cần PO chọn (chi tiết ở `docs/ux/po-questions.md`, mục F)
1. **F1** Phiên của danh tính ẩn danh có được hết hạn khi chưa có mã khôi phục hoặc thiết bị tin cậy không? (a) phiên trượt, không hết hạn (khuyến nghị) · (b) bắt buộc lưu mã trước khi phiên có thể hết hạn · (c) cho hết hạn, chấp nhận mất, cảnh báo lúc bỏ qua mã.
2. **F2** "Ai đi" và "Sở thích" trong tạo chuyến: (a) chỉ là bước làm quen, không lưu (khuyến nghị tới khi quyết) · (b) thuộc tính chuyến mới (đổi schema) · (c) gộp vào `styles`.
3. **F3** Ai được gỡ thành viên: (a) chỉ người tạo (khuyến nghị) · (b) thành viên gửi đề nghị. (Thuộc 1b.)
4. **N-1…N-4** (ảnh tham chiếu): nhập từ MXH/Google Maps, Passport/Trip Ideas/Bộ sưu tập, "AI tạo lịch/Tối ưu", thời tiết: mặc định chưa dựng; PO muốn thì hỏi riêng.
5. **C** Ảnh bìa tải lên, mô tả chuyến, "ai được xem": mặc định không dựng.
6. Còn mở từ trước: A3 ("Dự kiến N ngày"), B2/B3/B4/E1, Q-d, Q6–Q9, Q12, OQ-1.

## 3. Điều DR này KHÔNG làm
Không sửa `docs/wander-master-plan.md`; không cho phép làm backend; không duyệt Q-d, Q6–Q9, Q12, A3; không cho ra mắt người dùng thật (RG-2, RG-5, RG-6, RG-7 mở).

## 4. Anh chọn một trong
- [ ] Duyệt đóng DG-2 với các mặc định ở mục 1, các câu ở mục 2 còn mở (backend làm theo `data-needs.md` §2, lát nào chờ câu nào thì dừng đúng chỗ).
- [ ] Chưa đóng: cần sửa thêm (ghi rõ).
