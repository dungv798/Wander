**1. Scope**
Phân tích mối đe dọa mức thiết kế cho 8 câu hỏi của Q16 (D15). Không chọn cơ chế, không giả định công nghệ. Bài này chỉ phân tích, không phải thiết kế.

**2. Source evidence**
Các mục đã đọc trong `docs/wander-master-plan.md`:
- §15.1 Q16 (dòng 687), Q7 (709), Q17 (694), Q6 (708).
- §14.1 D8 (614), D15 (621), D19 (625).
- R7 (214), R13 (220), R14 (221).
- §8.5 (265–266).
- A-0 (279), A-8 (287).
- §9.2 (311–314).
- §12 (511–512).
- G7 (661).

Các số dòng trên đã được đọc trong phiên này. Tôi không đọc thêm phần nào ngoài các mục được giao.

**3. Findings**
- D15 `APPROVED` (cơ chế `OPEN`, Q16). D8 `APPROVED`. D19 `APPROVED`. Q6, Q7, Q16, Q17 đều `OPEN`.
- Tiêu chí A-0 "người không có bằng chứng không giành được quyền" là `INFERENCE`.
- G7 (có thể thiết kế an toàn mà không cần tài khoản đầy đủ) là `UNVERIFIED`.
- Plan nói rõ rằng D15 chưa chốt cơ chế nào, và Q7 nêu hệ quả: link lộ thì ai có link cũng vào được đến khi thu hồi.
- Bằng chứng chưa thiết lập được tính "an toàn" cho bất kỳ cơ chế nào. Hiện chưa có thiết kế nào để đánh giá.

**4. Options** (khái niệm, cả hai đều `PROPOSED`, không chọn)

*Hướng X: bí mật giữ ở thiết bị, kèm mã khôi phục do người dùng tự lưu.*
- Bảo vệ: không có kênh bên thứ ba để chiếm quyền. Mã khôi phục dài, ngẫu nhiên, chỉ hiện một lần.
- Rủi ro: mất thiết bị cộng mất mã thì mất vĩnh viễn (câu 2). Ai chụp được mã là chiếm được chuyến. Người dùng thường lưu mã ở nơi kém an toàn.

*Hướng Y: gắn một kênh liên hệ để khôi phục, ví dụ email hoặc số điện thoại.*
- Bảo vệ: giảm nguy cơ mất vĩnh viễn.
- Rủi ro: kênh liên hệ trở thành đường chiếm quyền (SIM bị chiếm, hộp thư bị chiếm). Cần thu dữ liệu liên lạc, trái với mục "chỉ thu cần thiết" ở §12. Kênh này cũng làm "ẩn danh" yếu đi, tức mâu thuẫn tiềm năng với D15/G7 cần làm rõ.

*Hướng lai (X + Y)* có cả hai mặt: ít mất dữ liệu hơn nhưng bề mặt tấn công lớn hơn. Nếu có thêm hướng, cần xét riêng.

**5. Risks** (kịch bản mức thiết kế)
1. **Chiếm quyền khi khôi phục (câu 1) — Cao.** Kẻ lạ biết kênh khôi phục hoặc có mã bị lộ, nhập mã trên thiết bị mới rồi thành chủ chuyến. Chủ cũ mất quyền mà có thể không được báo.
2. **Mất mọi cách khôi phục (câu 2) — Cao.** Chủ chuyến đổi điện thoại, mất mã, kết quả là mất cả lịch trình. Còn một rủi ro khác: nếu để "hỗ trợ khôi phục thủ công" thì người hỗ trợ chứng minh quyền bằng gì? Kẻ giả mạo có thể lợi dụng chỗ này.
3. **Lộ link hoặc mã (câu 5, Q7) — Trung bình–Cao.** Link chia sẻ trong nhóm chat bị chuyển tiếp. Người ngoài xem toàn bộ lịch (ngày đi, điểm đến, chi phí), đến khi chủ thu hồi. Trước khi thu hồi thì không phát hiện được. Cần tách rõ link vào chuyến (1b) với bằng chứng quyền chủ chuyến, không để link mời cấp quyền Organizer.
4. **Phiên (câu 4) — Trung bình.** Phiên không hết hạn trên máy chung hoặc máy bị trộm cho kẻ cầm máy quyền chủ vĩnh viễn. Phiên quá ngắn thì người dùng bị khóa ngoài. Chưa thể xác định thời hạn thích hợp từ bằng chứng hiện có (`UNVERIFIED`).
5. **Đoán và liệt kê (câu 6) — Trung bình.** Mã/ID chuyến ngắn hoặc tuần tự cho phép đoán. Thử mã khôi phục hàng loạt vào một chuyến. Cần giới hạn tần suất, phản hồi không lộ chuyến nào tồn tại, và không để một tài khoản gây khóa chủ thật (tấn công từ chối dịch vụ).
6. **Chuyển giao quyền (câu 7) — Trung bình.** Nếu có chuyển giao: kẻ có phiên trên máy bị trộm chuyển chủ cho mình. Nếu không có: Organizer rời đi (Q6) khiến chuyến mồ côi.
7. **Member quay lại trên thiết bị khác (câu 8, 1b) — Trung bình.** Người khác dùng lại tên hiển thị của Member để mạo danh, vì D8 chỉ yêu cầu tên hiển thị. Không có bằng chứng danh tính thì "quay lại" không phân biệt được người thật với kẻ mạo.
8. **Dữ liệu xóa mềm (D19, R7) — Trung bình–Cao.** Mục đã xóa (có thể chứa ghi chú, chi phí, thông tin đặt chỗ) giữ vô thời hạn, không tự hết hạn. Một khi chuyến bị chiếm hoặc link lộ, kẻ tấn công thấy cả mục "đã xóa" mà chủ tưởng đã biến mất. Quyền thấy/khôi phục/xóa vĩnh viễn của Member chưa xác định (Q6, Q17). Người dùng có thể tin rằng "xóa" là xóa thật.

**6. Unknowns**
- Mô hình đe dọa thực tế (ai muốn chiếm chuyến du lịch cá nhân?) và mức nhạy cảm dữ liệu chưa được lượng hóa.
- Quy mô người dùng, hạ tầng và nơi lưu trữ không xác định (chưa chọn stack).
- Chưa biết người dùng có chịu lưu mã khôi phục hay cung cấp liên hệ không.
- Quy định pháp lý về dữ liệu cá nhân và thời gian giữ: `UNVERIFIED`, nằm ngoài phạm vi.

**7. Khuyến nghị (không phải quyết định)**
Các yêu cầu sau là `PROPOSED`, để bạn xem xét:
- Tài liệu thiết kế Q16 nên trả lời đủ 8 câu và mô tả từng kịch bản trên.
- Bằng chứng quyền chủ chuyến tách khỏi link mời và khỏi mã xem chuyến.
- Mã/ID đủ ngẫu nhiên, không tuần tự.
- Mọi kênh khôi phục phải có giới hạn tần suất và chống đoán.
- Thông báo cho chủ cũ khi khôi phục (nếu còn kênh).
- Khóa/hủy phiên của thiết bị cũ sau khôi phục.
- Thời hạn phiên và cách thu hồi phiên phải được nêu rõ.
- Hành động xóa vĩnh viễn thật sự xóa phía server, và có cách xóa cả chuyến (Q17).
- Thu hồi link phải có hiệu lực ngay (Q7).
- Thu thập dữ liệu liên lạc ở mức tối thiểu.
- Nêu rõ tại thiết kế: mất mọi cách khôi phục thì kết quả là gì và người dùng được cảnh báo ra sao.

**8. Confidence**
Medium: kịch bản dựa trên văn bản plan và phân tích chung, nhưng chưa có cơ chế cụ thể hay dữ liệu thực tế để đối chiếu.

**9. Questions for the user**
- Chấp nhận "mất hết cách khôi phục = mất chuyến" hay phải có đường khôi phục dự phòng (kèm rủi ro chiếm quyền)?
- Có chấp nhận thu một kênh liên hệ cho chủ chuyến không (ảnh hưởng ý nghĩa "ẩn danh" của D15)?
- Quyền chủ chuyến có chuyển giao được không, và Organizer rời đi thì sao (Q6, Q16 câu 7)?
- Mục đã xóa mềm có nên tự hết hạn, trái với "không tự hết hạn" của R7/D19?

Không có gì bị thay đổi. Các mục cần bạn duyệt: bản thiết kế Q16, Q7, Q6, Q17.
