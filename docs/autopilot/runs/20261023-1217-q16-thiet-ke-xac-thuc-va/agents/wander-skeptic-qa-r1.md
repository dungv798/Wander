## 1. Scope
Phản biện Q16 (OPEN). Tôi không chọn cơ chế. Đã đọc §14.1 (D8, D14, D15), §14.3 (G7), §7.4 (R7, R13), §8.1 A2, §8.5, §9.1 (A-0, A-8, A-12), §9.2, §10.1 bước 5, §10.5, §12, §15.1 (Q16), §15.6. Registry khớp với plan. Một mục được brief của orchestrator nhắc nhầm không tồn tại trong plan (UNVERIFIED), nên bỏ qua.

## 2. Source evidence
- Plan v0.3: §15.1 Q16, D15, D8, D14, G7, R13, A-0, §12, §10.5 tiêu chí 5 (cùng nội dung ở §10.1 bước 5).
- Đã Read trực tiếp các mục này, nhưng không dùng số dòng.

## 3. Findings
**F1. `UNVERIFIED`: G7 tự kiểm chứng bằng chính việc duyệt.**
- Cột kiểm chứng của G7 ghi "Bản thiết kế được duyệt (Q16)". Duyệt một tài liệu chưa chứng minh được tính "an toàn".
- Không có tiêu chí "an toàn" nào có thể đo. Chưa có mô hình đe dọa (kẻ tấn công nào, tài sản nào).

**F2. `INFERENCE` mơ hồ, chưa phải `CONTRADICTION`: câu của A-0.**
- Câu A-0: "Người không có bằng chứng quyền không giành được quyền chủ chuyến" đi kèm "có cách khôi phục quyền chủ chuyến".
- Hai yêu cầu căng nhau khi người dùng mất toàn bộ bằng chứng (đúng câu (2) của Q16). Nếu cho khôi phục thì ai đó giành quyền không còn bằng chứng gốc. Nếu không cho thì "khôi phục" chỉ còn là một phần.
- Plan chưa nói "bằng chứng" có thể là gì, kể cả bằng chứng thay thế.

**F3. Khớp với D8, D14, D15, R13; không có CONTRADICTION.**
- D8 và D14 loại tài khoản đầy đủ. D15 nói "Khớp với D8".
- D14 loại "link mời và chia sẻ" khỏi 1a. Nếu thiết kế Q16 dùng link hoặc mã truy cập (§12 và Q16(5) đã nhắc), cần phân biệt rõ với link mời của 1b. `UNVERIFIED`: plan chưa phân biệt (xem §9.2: "cách nối ❓ Q16, Q7").

**F4. `INFERENCE`: xung đột tiềm ẩn D19 với Q16(2).**
- D19 giữ mục đã xóa "đến khi xóa vĩnh viễn", không tự hết hạn.
- Nếu chủ mất mọi cách khôi phục, dữ liệu (kể cả mục đã xóa) tồn tại mãi trên server mà không ai xóa được. Điều này đụng rủi ro riêng tư ở §12 (Trung bình–Cao). Q17(c) "ai xóa vĩnh viễn" vì thế phụ thuộc Q16.

**F5. `INFERENCE`: nhiều thiết bị ngay ở 1a.**
- Q8 (sửa đồng thời) chỉ gán cho 1b, nhưng D15 cho một chủ mở trên 2 thiết bị. Không có lịch sử chỉnh sửa (D19) nên ghi đè mất dữ liệu.
- Plan chưa nêu tình huống này ở 1a.

## 4. Tình huống cụ thể (kết quả theo plan)
- **Mất điện thoại duy nhất:** plan chỉ nói "có cách khôi phục" (A-0). Cách và hậu quả khi không có là Q16(1)(2). Chưa xác định được.
- **Xóa dữ liệu trình duyệt:** tương tự mất thiết bị. Plan chưa nói định danh ẩn danh có sống sót hay không.
- **Máy bạn bè:** phiên hiệu lực bao lâu, có "đăng xuất" từ xa không (Q16(4)). Chưa quyết.
- **Lộ link qua ảnh chụp màn hình:** Q16(5) hỏi, §12 coi là rủi ro. Chưa có thu hồi ở 1a (Q7 chỉ cho link mời 1b). `UNVERIFIED`.
- **Mạng yếu ở vùng núi:** Q15 hoãn "xem lịch khi mạng yếu". D15 dữ liệu ở server nên mở trên máy mới cần mạng. Nếu khôi phục cần kênh bên ngoài, khả năng không thực hiện được giữa chuyến chưa được xét. `UNVERIFIED`.
- **Xóa vĩnh viễn rồi khôi phục quyền:** quyền khôi phục không hoàn lại dữ liệu đã xóa vĩnh viễn. Q17 chưa có "Hoàn tác sau xóa vĩnh viễn" (đề xuất mặc định chưa có).

## 5. Phụ thuộc giữa các câu của Q16
- (1)(3) → (4) → (6): bằng chứng quyết thời hạn phiên và giới hạn tần suất.
- (2) ↔ (7): mất mọi cách thì chuyển giao có thay thế không.
- (5) ↔ Q7 (thu hồi).
- (2) ↔ Q17(b)(c) (xóa chuyến, xóa vĩnh viễn).
- (8) ↔ Q6, Q7 (1b); B-2 đã ghi phụ thuộc Q7, Q16.
- Thứ tự hợp lý (không phải quyết định): mô hình đe dọa → (1)(3)(2) → (4)(6)(5) → (7) + Q17(c) → (8) cùng Q6/Q7 khi mở 1b, miễn là thiết kế 1a không chặn (8).

## 6. Replay (§10.5) chạm Q16
- Chỉ tiêu chí 5 ("thấy đủ dữ liệu trên thiết bị khác") và A-12. Đó là kiểm tra đường thuận của chính chủ.
- Không kiểm chứng "an toàn": không có test người lạ không vào được, mất thiết bị, phiên hết hạn hay lộ link. Chỉ đủ cho D15 phần "mở được", chưa đủ cho phần "an toàn".

## 7. Khuyến nghị (không phải quyết định)
Viết tài liệu thiết kế Q16 kèm mô hình đe dọa và bộ tiêu chí âm tính riêng (ngoài §10.5). Nêu rõ "bằng chứng" thay thế và hậu quả khi mất hết, trước khi spec 1a.

## 8. Confidence
Medium. Đã đọc đủ mục liên quan, nhưng không đọc toàn plan.

## 9. Questions for the user
1. Mất mọi cách khôi phục thì chấp nhận mất chuyến hay cần đường cứu hộ?
2. Dữ liệu "mồ côi" có cần cơ chế xóa không (D19 so với riêng tư)?
3. Hai thiết bị của một chủ ở 1a có nằm trong phạm vi đồng thời không?

Không có gì bị thay đổi. Những mục cần bạn duyệt: tài liệu thiết kế Q16 và các câu hỏi trên.
