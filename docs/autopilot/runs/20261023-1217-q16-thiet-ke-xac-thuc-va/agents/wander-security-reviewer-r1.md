**Báo cáo bảo mật Q16 (vòng 1, độc lập)**

**1. Scope**
Mô hình mối đe dọa cho 8 câu hỏi của Q16 (`OPEN`). Đây là phân tích đánh đổi theo họ cơ chế khái niệm, không chọn cơ chế. Không chọn stack. Không sửa file nào.

**2. Source evidence**
`docs/wander-master-plan.md`:
- §15.1 Q16: 8 câu hỏi, và "tài liệu này không đề xuất cơ chế".
- D15, D8, D14, D19 (§14.1) và G7 (§14.3).
- §7.1 (dòng "Danh tính ẩn danh" và "Member").
- R7, R13–R16 (§7.4).
- A2 (§8.1), edge case (§8.5), A-0 (§9.1), §9.2.
- §12: hai dòng rủi ro, một về Q16 (Cao) và một về riêng tư (Trung bình–Cao).
- Registry: `.claude/rules/wander-product-context.md`.

Tôi không dùng số dòng nào ngoài các số tôi đã đọc.

**3. Findings**
- `APPROVED` D15: danh tính ẩn danh, lưu server, mở trên thiết bị khác, và phải thiết kế xác thực/khôi phục "an toàn".
- `OPEN` Q16: cơ chế chưa chốt.
- `UNVERIFIED` G7: chưa có bằng chứng rằng có thể làm "an toàn" mà không cần tài khoản đầy đủ.
- `INFERENCE` từ A-0: "người không có bằng chứng quyền không giành được quyền" là diễn giải của plan, chưa phải quyết định.
- Tài sản:
  - Dữ liệu chuyến, gồm địa điểm, chi phí và lịch di chuyển, vốn là thông tin nhạy cảm (biết khi nào nhà vắng).
  - Quyền sở hữu.
  - Mục đã xóa mềm còn giữ.
  - Tên hiển thị của Member.
- Biên tin cậy: thiết bị ↔ server ↔ kênh ngoài (email, tin nhắn, ghi chú của người dùng).
- `PROPOSED` Hệ quả D15: danh tính ẩn danh nghĩa là không có bằng chứng danh tính tự nhiên nào (email, số điện thoại). Vì vậy mọi phương án khôi phục đều là "bí mật" mà ai nắm được cũng dùng được (bearer). Đây là gốc của rủi ro takeover.

**Họ cơ chế (chỉ phân tích)**

| Họ | Mối đe dọa chính | Kịch bản | Giảm thiểu (PROPOSED) |
|---|---|---|---|
| A. Bí mật giữ ở thiết bị | Mất trắng (câu 2). Bí mật mất cùng thiết bị. | Lan đổi điện thoại, quên sao lưu, chuyến Hà Giang mất quyền chủ. | Tối thiểu một đường khôi phục độc lập với thiết bị; cảnh báo rõ khi thiếu. |
| B. Mã khôi phục do người dùng giữ | Lộ mã (câu 5). Mã chụp màn hình bị đồng bộ lên đám mây hoặc để trong ghi chú chung. | Kẻ có mã vào từ thiết bị lạ và giành quyền. Ngược lại, người dùng làm mất mã thì không khôi phục được. | Đủ entropy; chỉ hiện một lần; cho đổi mã hoặc thu hồi; giới hạn thử (câu 6); báo cho các thiết bị đã đăng nhập. |
| C. Liên kết gửi qua kênh ngoài (email) | Chiếm hộp thư hoặc chuyển tiếp link thì chiếm chuyến. Link nằm trong lịch sử, log, hoặc bị preview bởi ứng dụng chat. Ngoài ra thu email là thêm dữ liệu cá nhân và có thể mâu thuẫn tinh thần "không tài khoản đầy đủ" (D8/D14). | Kẻ nhắm vào email bị lộ thì vào được chuyến mà không cần thiết bị. | Link dùng một lần, ngắn hạn; xác nhận trên thiết bị đã khởi tạo; thông báo mọi khôi phục; độ trễ trước khi hiệu lực. |
| D. Kết hợp | Đường yếu nhất quyết định độ an toàn. Thêm đường khôi phục là thêm bề mặt tấn công. | Kẻ chọn đường dễ nhất (ví dụ link email) để vượt qua mã mạnh. | Mọi đường phải mạnh ngang nhau, hoặc đường yếu hơn chỉ cấp quyền hạn chế. |

Mọi họ đều cần trả lời `UNVERIFIED`: ai thông báo cho chủ cũ khi quyền bị khôi phục trên thiết bị khác. Với danh tính ẩn danh, kênh thông báo có thể không tồn tại.

**Theo 8 câu hỏi**
1. Bằng chứng quyền: bất kỳ bí mật nào cũng có tính bearer (xem trên). `OPEN`.
2. Mất mọi cách khôi phục: kết quả có thể là mất vĩnh viễn hoặc chuyến mồ côi trên server (rủi ro riêng tư vì dữ liệu còn đó). Đánh đổi trực tiếp: dễ khôi phục thì dễ bị chiếm; khó khôi phục thì dễ mất trắng. Cần xác định hậu quả chấp nhận được và có nên có phương án cuối cùng (ví dụ xóa hẳn chuyến mồ côi sau thời hạn). `OPEN`.
3. Mở trên thiết bị khác: cùng bề mặt tấn công với khôi phục; nên coi thêm thiết bị là một dạng khôi phục có rủi ro thấp hơn nếu thiết bị cũ còn.
4. Thời hạn phiên: dài thì kẻ trộm thiết bị có quyền lâu; ngắn thì người dùng bị đăng xuất giữa chuyến khi mạng yếu. Cần có thu hồi phiên từ xa. `OPEN`.
5. Lộ link/mã: phạm vi thiệt hại gồm toàn bộ chuyến cộng mục đã xóa mềm. Cần tách link mời (1b) khỏi bí mật quyền chủ, tức là lộ link mời không được dẫn tới quyền chủ chuyến.
6. Lạm dụng: dò đoán mã; spam tạo chuyến; gửi email hàng loạt nếu có họ C; liệt kê ID chuyến. Cần giới hạn tần suất theo nguồn và theo chuyến, phản hồi không phân biệt "sai" với "không tồn tại", và định danh không đoán được. Chưa có số liệu nên không nêu ngưỡng. `UNVERIFIED`.
7. Chuyển giao quyền: rủi ro là chuyển nhầm hoặc bị ép chuyển. Kẻ có phiên bị đánh cắp có thể chuyển quyền vĩnh viễn, nên cần xác nhận lại bằng bằng chứng mạnh hơn phiên. `OPEN`.
8. Member quay lại (1b): xem mục 4 dưới đây.

**Riêng tư (D19)**
- `APPROVED` D19: mục đã xóa giữ đến khi xóa vĩnh viễn, không tự hết hạn. `OPEN` Q17: ai xóa vĩnh viễn.
- Kịch bản: Minh xóa nhầm một mục ghi chú nhạy cảm, tưởng đã mất. Người có quyền truy cập vào chuyến sau này, kể cả sau khi chuyển giao hoặc khôi phục, vẫn thấy mục đó trong "Đã xóa gần đây". Nếu Member 1b thấy được mục đã xóa thì có rò rỉ về nội dung. `INFERENCE`
- Chuyến mồ côi (mất quyền) giữ dữ liệu vô thời hạn: cần chính sách lưu giữ. `OPEN`

**4. Điểm chạm với Member (câu 8) mà 1a phải chừa chỗ**
- Tách "danh tính người dùng" khỏi "vai trò trong chuyến" ngay từ 1a, để thêm vai trò Member không phải đổi mô hình. `PROPOSED`
- Thực thể danh tính phải có khả năng có nhiều thiết bị/phiên cho một danh tính. `PROPOSED`
- Member không có bằng chứng ngoài tên hiển thị, nên "quay lại thiết bị khác" chỉ có thể dựa vào một bí mật riêng của họ. Hai người trùng tên hiển thị không được hợp nhất tự động, vì kẻ khác có thể mạo danh Member cũ. `INFERENCE`
- Thu hồi link (Q7) không được làm mất danh tính của Member đã vào. `OPEN`

**5. Risks**
- Chiếm quyền chủ chuyến khi khôi phục: **Cao**, hậu quả là lộ toàn bộ dữ liệu và khóa chủ thật (khớp §12).
- Mất trắng quyền chủ: **Cao** về hậu quả, không ước lượng được khả năng. `UNVERIFIED`
- Lộ link/mã leo thang từ quyền Member lên quyền chủ: **Cao** nếu không tách.
- Lạm dụng/dò đoán: **Trung bình**.
- Giữ mục đã xóa và chuyến mồ côi: **Trung bình**.
- Phiên của thiết bị bị trộm: **Trung bình**.

**6. Unknowns**
- Có thu email hoặc dữ liệu liên hệ nào không (ảnh hưởng nghĩa vụ quyền riêng tư).
- Quy mô người dùng và mô hình đe dọa thực tế (cá nhân, bạn bè).
- Có thể làm "an toàn" mà không cần tài khoản đầy đủ hay không (G7).
- Cách thông báo cho chủ cũ khi khôi phục.

**7. Khuyến nghị (không phải quyết định)**
Các yêu cầu sau là PROPOSED để bạn xem xét:
1. Tài liệu thiết kế Q16 phải nêu rõ hậu quả mất trắng mà bạn chấp nhận.
2. Bí mật quyền chủ tách khỏi link mời 1b.
3. Mọi đường khôi phục có độ mạnh ngang nhau.
4. Giới hạn tần suất, và phản hồi không lộ thông tin.
5. Có thu hồi phiên/thiết bị và chuyển giao cần xác nhận mạnh hơn.
6. Chính sách lưu giữ cho chuyến mồ côi và mục đã xóa.
7. Định danh Member tách khỏi tên hiển thị.

**8. Confidence**
Medium: dựa trên plan đã đọc; không có dữ liệu về stack hay người dùng.

**9. Questions for the user**
1. Mất mọi cách khôi phục thì chấp nhận mất vĩnh viễn chuyến, hay cần đường cuối?
2. Có chấp nhận thu email (hoặc kênh ngoài) không, dù D8/D14 tránh tài khoản đầy đủ?
3. Chuyến mồ côi và mục đã xóa mềm giữ bao lâu thì xóa hẳn (liên quan Q17)?
4. Chủ chuyến có cần chuyển giao quyền ở 1a không, hay để đến 1b?

Nothing was changed. Cần user duyệt: thiết kế Q16 và các câu trả lời ở mục 9.
