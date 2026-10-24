**Báo cáo skeptic: D15 / Q16 / G7**

**1. Scope**
Xem xét D15 (không tài khoản đầy đủ, mở thiết bị khác, khôi phục an toàn) cùng các mục liên quan: G7, D19/R7/A-8, A-0, §9.2, §12, §13.1. Tôi không đề xuất cơ chế xác thực nào.

**2. Source evidence**
`docs/wander-master-plan.md`:
- §14.1 D8, D14, D15, D19
- §14.3 G7
- §15.1 Q16 (8 câu hỏi thiết kế), §15.1 Q17, §15.4 Q6/Q7
- §7.4 R7, R8, R13
- §8 A2 và §8.5
- §9.1 A-0, A-8; §9.2
- §12
- §13.1 (đã đọc các dòng 537–547)

**3. Findings**
- Tôi **không thấy CONTRADICTION** nào giữa D15 và D8/D14/D19. D14 loại "tài khoản đầy đủ" khỏi 1a và D15 nói "khớp với D8", nên hai quyết định tương thích. Tôi chỉ thấy các phụ thuộc ẩn và rủi ro sau.
- **`INFERENCE` — ràng buộc nội tại của D15.**
  - D15 đòi "không tài khoản đầy đủ", nhưng cũng đòi "chứng minh quyền" và "khôi phục".
  - Khôi phục cần một bằng chứng thứ hai ngoài thiết bị. Plan chưa nói bằng chứng đó là gì (Q16 câu 1).
  - Nếu bằng chứng này là email hay số điện thoại thì nó gần như là một tài khoản, và ranh giới D14 mờ đi. Plan chưa định nghĩa "tài khoản đầy đủ", nên đây là chỗ mơ hồ cần user làm rõ.
- **`UNVERIFIED` — G7 khả thi?**
  - G7 là giả định, bằng chứng kiểm chứng duy nhất là "bản thiết kế được duyệt".
  - Plan chưa có tiêu chí "an toàn" đo được. A-0 chỉ có một diễn giải 🔶 ("người không có bằng chứng không giành được quyền"). Vì vậy G7 chưa thể đúng hay sai.
  - Bằng chứng còn thiếu: mô hình mối đe dọa; chấp nhận được khả năng mất quyền vĩnh viễn hay không (Q16 câu 2); thời hạn phiên (câu 4); phạm vi lộ link (câu 5).
- **`OPEN` — mất thiết bị giữa chuyến.**
  - Kịch bản: chủ chuyến mất điện thoại ở Đà Nẵng ngày 3 và chưa kịp thiết lập khôi phục. Chuyến 29/08–06/09 vẫn trong thời gian đi.
  - Plan §8 nêu "mất thiết bị" là edge case nhưng chỉ ghi ❓ Q16.
  - Plan không nêu thời gian khôi phục tối đa chấp nhận được. Nếu khôi phục chậm hoặc cần người đi cùng, nó phụ thuộc 1b (Q6 "Organizer rời đi thì sao"), trong khi §9.2 nói 1a không phụ thuộc 1b.
- **`OPEN` — hai thiết bị cùng lúc.** 1a nói một người dùng, nhưng A2 cho phép mở thiết bị khác. Cùng một chủ chuyến sửa trên 2 máy: Q8 (sửa đồng thời) chỉ thuộc 1b. Với D19 không có lịch sử chỉnh sửa, hai máy của chính chủ có thể ghi đè nhau mà không có cách lấy lại. Đây là khoảng trống của 1a.
- **`INFERENCE` — D19 xóa vĩnh viễn và mất quyền.**
  - Plan không nói ai được xóa vĩnh viễn (Q17c). Nếu kẻ chiếm quyền hoặc phiên cũ của thiết bị bị mất xóa vĩnh viễn, thì không có lịch sử chỉnh sửa và không có cách phục hồi.
  - "Xóa vĩnh viễn" cũng có thể là cách duy nhất để người dùng đạt "có xóa vĩnh viễn" của §12 (rủi ro riêng tư). Khi mất mọi cách khôi phục, dữ liệu server không xóa được. Plan chưa nói dữ liệu mồ côi sẽ ra sao.
  - Q17(b) (xóa mềm cả chuyến) chưa chốt. Xóa mềm một chuyến thì việc khôi phục cũng phải qua xác thực.
- **`INFERENCE` — Hoàn tác sau khi thiết bị đổi.** "Giữ đến khi xóa vĩnh viễn" không tự hết hạn (R7). Dữ liệu đã xóa nằm trên server vô thời hạn, và thuộc phạm vi lộ khi link hoặc mã bị lộ (Q16 câu 5). §12 đã ghi rủi ro này (Trung bình–Cao).
- **`INFERENCE` — ước tính §13.1.**
  - Tổng cộng khớp (1a 105–221; 1b 41–145), không có lỗi số học.
  - Nhóm 3 của 1a là 15–40 giờ, nhưng nhóm 1 cũng gồm cả thiết kế xác thực nên có thể đếm trùng hoặc thiếu. Nhóm 7 (kiểm thử xác thực/khôi phục) chỉ 14–28 giờ cho cả quy tắc tiền, xác thực và Replay.
  - Chính plan ghi "độ tin cậy thấp" và "Cao (cơ chế chưa chốt)". Con số chưa phản ánh được khối lượng cho đến khi Q16 chốt. Nó không lấy được các tình huống phụ như phiên hết hạn, giới hạn tần suất, chuyển giao quyền.

**4. Options**
Không đề xuất cơ chế. Hướng không vi phạm planning-safety: Q16 cần một tài liệu tình huống (mất thiết bị, mất mã, bị chiếm quyền) do user duyệt, đúng như plan đã ghi.

**5. Risks**
- Cao: mất quyền chủ chuyến giữa chuyến, không có đường khôi phục (Q16 câu 2).
- Cao: bị chiếm quyền, rồi xóa vĩnh viễn không phục hồi được (D19 và Q17c).
- Trung bình: ghi đè giữa 2 thiết bị của chính chủ.
- Trung bình: dữ liệu đã xóa còn trên server vô thời hạn.

**6. Unknowns**
- "Tài khoản đầy đủ" nghĩa là gì ở D14/D15.
- Mục tiêu bảo mật cụ thể (kẻ tấn công nào cần chống).
- Chấp nhận mất vĩnh viễn hay không.
- Trần thời gian khôi phục.
- Hành vi khi lộ link.

**7. Recommendation (Khuyến nghị, không phải quyết định)**
Khi viết tài liệu thiết kế Q16, phải có các kịch bản trên cùng tiêu chí chấp nhận đo được cho "an toàn". Cần làm rõ trước: xóa vĩnh viễn trong 1a là của ai (Q17c) và 2 thiết bị của chính chủ có được sửa cùng lúc không. Ước tính §13.1 nên tính lại sau Q16.

**8. Confidence**
Medium: đã đối chiếu các phần đã đọc; tôi không đọc toàn bộ §8.5 và §12 nên có thể sót chi tiết.

**9. Questions for the user**
1. Người dùng có chấp nhận email hoặc số điện thoại làm bằng chứng khôi phục mà không coi đó là "tài khoản đầy đủ" không?
2. Nếu mất mọi cách khôi phục, chuyến có được coi là mất vĩnh viễn không?
3. Ai được xóa vĩnh viễn trong 1a (Q17c), và có cần xác thực lại trước khi xóa không?

Không có gì đã bị thay đổi. Những mục cần user duyệt: Q16, Q17c, định nghĩa "tài khoản đầy đủ".
