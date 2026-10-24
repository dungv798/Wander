## 1. Scope
Q16 câu (1), (3), (4), (7), (8) ở mức khái niệm, không gắn stack. Câu (2), (5), (6) chỉ nhắc khi liên quan. Mọi phương án dưới đây là PROPOSED; tôi không chọn phương án nào.

## 2. Source evidence
Tất cả nằm trong `docs/wander-master-plan.md`:
- §15.1 Q16: tài liệu "không đề xuất cơ chế", 8 câu hỏi thiết kế.
- §14.1 D15, D8, D14. D19 chỉ liên quan gián tiếp qua dữ liệu đã xóa còn nằm trên server.
- §7.1 và R13.
- §8 A2 và mục edge case (mất thiết bị; Member quay lại).
- §9.1 A-0, §9.2, §9.3 B-2.
- §13.1 (hàng 3: rủi ro Cao, cơ chế chưa chốt).
- §14.3 G7.
- Không đọc số dòng cụ thể của các mục này, ngoài những dòng đã xem trong Grep và Read.

## 3. Findings
- APPROVED: D15 (ẩn danh, lưu server, mở trên thiết bị khác, thiết kế xác thực/khôi phục an toàn) và D8 (Member vào bằng tên hiển thị qua link, chưa cần tài khoản đầy đủ). D14 loại "tài khoản đầy đủ" khỏi 1a.
- OPEN: cơ chế (Q16), quyền Member (Q6), link bị lộ/thu hồi (Q7).
- INFERENCE: A-0 diễn giải "an toàn" là "người không có bằng chứng quyền không giành được quyền chủ chuyến".
- UNVERIFIED: G7, tức là có thể an toàn mà không cần tài khoản đầy đủ. Mọi phương án phụ thuộc giả định này.
- Khái niệm cần có dù chọn gì: một "bằng chứng quyền" gắn với Trip, một phiên có hạn, và một danh tính cho Member tách khỏi bằng chứng của Organizer.

## 4. Options
**Câu (1) và (3): chứng minh quyền chủ chuyến trên thiết bị mới**
- **A. Bí mật giữ bởi chủ (bearer secret).** Chủ cầm một mã hoặc link bí mật; ai có mã là có quyền.
  - Lợi: không cần kênh ngoài, đơn giản, dễ kiểm thử.
  - Chi phí: mất mã thì mất quyền (liên quan câu 2); lộ mã thì bị chiếm quyền.
  - Bị khóa: mô hình "ai giữ mã là chủ".
  - Đảo ngược: trung bình. Đổi sang B cần thao tác "nâng cấp" cho chuyến đang có.
- **B. Gắn kênh liên hệ đã xác minh.** Khôi phục bằng chứng minh quyền kiểm soát một kênh (ví dụ email hoặc số điện thoại).
  - Lợi: khôi phục được khi mất thiết bị.
  - Chi phí: có thu dữ liệu cá nhân (rủi ro riêng tư §12); cần chống lạm dụng (câu 6); gần với "tài khoản" nên có thể va D14/D8 tùy cách hiểu, cần user xác nhận.
  - Bị khóa: có một loại định danh thật trong dữ liệu.
  - Đảo ngược: khó, vì đã thu dữ liệu.
- **C. Thiết bị tin cậy.** Thiết bị đã đăng nhập duyệt thiết bị mới (quét mã hoặc nhập mã ngắn hạn).
  - Lợi: không thu dữ liệu cá nhân.
  - Chi phí: mất hết thiết bị thì mất quyền, trừ khi có mã dự phòng (có thể kết hợp A).
  - Đảo ngược: dễ.

**Câu (4): thời hạn phiên**
- **P-a.** Phiên dài, không tự hết hạn, thu hồi thủ công. Tiện cho chuyến đi nhiều tuần. Nhưng thiết bị bị mất vẫn dùng được, nên cần thao tác thu hồi.
- **P-b.** Phiên có hạn kèm gia hạn khi dùng (sliding). Giảm rủi ro thiết bị bị mất; có thể làm phiền người dùng giữa chuyến.
- Cả hai đều dễ đổi sau, miễn là phiên là một thực thể riêng có thể thu hồi và không gắn cứng vào quyền sở hữu.

**Câu (7): chuyển giao quyền**
- **T1.** Không chuyển giao ở 1a, quyền gắn một danh tính. Đơn giản, test ít; nhưng sau này thêm chuyển giao phải migrate.
- **T2.** Chuyển giao tường minh (chủ hiện tại phát hành mã chuyển giao dùng một lần, đổi chủ và thu hồi phiên cũ). Tốn thêm trạng thái và test, nhưng mở đường cho 1b. Cần Q6 để biết vai trò sau chuyển giao.
- Nếu mô hình dữ liệu tách "Trip" khỏi "danh tính chủ" (quan hệ sở hữu là dữ liệu chứ không phải khóa chính), thì T1 chuyển sang T2 sau này tốn ít.

**Câu (8): Member ở 1b nối vào danh tính**
- **M1.** Member nhận một bằng chứng riêng khi vào link (cùng loại như chủ nhưng quyền thấp hơn); quay lại thiết bị khác bằng cách nhập lại link hoặc mã riêng. Không phải làm lại nếu mô hình danh tính ở 1a đã là "danh tính ẩn danh + bằng chứng", với Organizer chỉ là một vai trò. Chi phí migration 1a→1b thấp.
- **M2.** Member là tên hiển thị gắn với link chung, không có danh tính riêng. Đơn giản, nhưng không phân biệt được người, không thu hồi từng người, và không làm được checklist riêng từng người (P5) ổn định. Nếu 1a đã chốt "chủ là người dùng ngầm định duy nhất" (Q1), cần làm lại ở 1b.

## 5. Risks
- Cao: không có bằng chứng quyền thì ai biết link có thể chiếm chuyến. Kịch bản: người cầm điện thoại cũ của chủ mở lại chuyến, nếu phiên không hết hạn và không thu hồi được.
- Cao: chọn mô hình "chủ là người dùng ngầm định duy nhất" ở 1a rồi sang 1b phải làm lại danh tính (plan §15.0 có ghi cách hiểu này, chưa duyệt).
- Trung bình–Cao: thu dữ liệu cá nhân ở B (§12).

## 6. Unknowns
- G7 chưa kiểm chứng.
- Q16(2): mất mọi cách khôi phục thì chấp nhận mất chuyến hay không.
- Q7: link xem/sửa có thể dùng làm bằng chứng quyền không.
- Q6: quyền Member.
- Không có số liệu nào để so sánh chi phí; ước tính 15–40 giờ ở §13.1 là UNVERIFIED.

## 7. Khuyến nghị (không phải quyết định)
Nếu user muốn giảm rủi ro làm lại: thiết kế mô hình khái niệm "danh tính + bằng chứng + phiên có thể thu hồi + quan hệ sở hữu là dữ liệu", để A/B/C, P-a/P-b, T1/T2 đều thay được sau. Điểm này không phụ thuộc cơ chế nào được chọn.
Invariant nên test:
- Không có bằng chứng thì không thao tác quyền chủ.
- Phiên bị thu hồi thì không dùng được nữa.
- Chuyển giao thì chủ cũ mất quyền.
- Member không nâng quyền lên Organizer.
- Bằng chứng hết hạn bị từ chối.
- Mất thiết bị không làm lộ dữ liệu cho người khác.

## 8. Confidence
Medium: các phương án mang tính khái niệm và dựa trên plan; không có dữ liệu thực nghiệm.

## 9. Questions for the user
1. Chấp nhận "mất mọi cách khôi phục thì mất quyền chuyến" (Q16-2), hay bắt buộc có kênh khôi phục?
2. Thu email hoặc số điện thoại có bị xem là trái D8/D14 không?
3. Chuyển giao chủ chuyến có cần ở 1a không?
4. Member 1b cần phân biệt từng người (checklist riêng P5) hay chỉ cần tên hiển thị?

Không có gì đã bị thay đổi. Mục cần user duyệt: Q16 (toàn bộ), cùng xác nhận G7.
