> Nguồn: subagent **stand-in** (general-purpose) thay cho `wander-security-reviewer`; `source: emulated`, danh tính agent UNVERIFIED. Nội dung dưới đây là báo cáo nguyên văn.

**1. Scope**
Mô hình đe dọa cho 8 câu hỏi thiết kế của Q16 (chủ chuyến 1a, D15) và các hệ quả sang 1b. Chỉ phân tích thiết kế, không chọn cơ chế, không nói cơ chế nào "an toàn".

**2. Source evidence**
`docs/wander-master-plan.md`: §14.1 (D8, D15, D19), §15.1 (Q16), §7.4 (R7, R13), §9.1 (A-0, A-8), §9.2, §8.5, §12, §14.3 (G7), §15.4 (Q6, Q7). Không dùng số dòng.

**3. Findings**
- D15, D8, D19: `APPROVED`. Cơ chế xác thực cụ thể: `OPEN` (Q16). Q6, Q7: `OPEN`.
- A-0 "Người không có bằng chứng quyền không giành được quyền chủ chuyến": `INFERENCE` (🔶), chưa là tiêu chí nghiệm thu đã duyệt.
- G7 (thiết kế an toàn mà không cần tài khoản đầy đủ): `UNVERIFIED`.
- R7/D19: mục xóa giữ "không tự hết hạn" đến khi xóa vĩnh viễn: `APPROVED`. Ai xóa vĩnh viễn: `OPEN` (Q17, Q6).
- §12 xếp rủi ro mất hoặc bị chiếm quyền là Cao, rủi ro lộ link/mã là Trung bình–Cao: `APPROVED` làm rủi ro, chưa có biện pháp.
- Tài sản: dữ liệu chuyến, quyền sở hữu, mục đã xóa còn lưu, dữ liệu liên hệ (nếu thu). Plan chưa liệt kê dữ liệu cá nhân thu thập: `UNVERIFIED`.

**4. Options (chỉ phân tích, không chọn)**
- A. Bí mật chỉ nằm trên thiết bị: không khôi phục được, mất máy là mất chuyến.
- B. Mã khôi phục hiện một lần: ai có mã là chiếm được quyền (mã là bearer).
- C. Kênh ngoài (email/SĐT): khôi phục được, nhưng kênh bị chiếm thì mất quyền, phải thu dữ liệu liên hệ, và có thể gần "tài khoản đầy đủ" (`INFERENCE`, cần user đánh giá theo D8).
- D. Liên kết từ thiết bị đã đăng nhập: an toàn hơn khi còn máy cũ, vô dụng khi mất máy.
- E. Chấp nhận "mất hết là mất": rủi ro mất dữ liệu thay cho rủi ro bị chiếm.
Mọi lựa chọn đều đánh đổi mất quyền với bị chiếm quyền.

**5. Risks (kịch bản, mức độ)**
1. Chiếm quyền khi khôi phục (Cao): kẻ đọc được ảnh chụp màn hình/ghi chú chứa mã (hoặc kiểm soát kênh khôi phục) nhập trên máy lạ, thành chủ chuyến, xóa vĩnh viễn dữ liệu.
2. Mất hết (Cao): người dùng đổi điện thoại, máy cũ đã reset, không còn mã, nên mất chuyến sắp đi.
3. Lộ link/mã (Cao): link chuyển tiếp qua nhóm chat; nếu link mở chuyến cũng cấp quyền chủ, người nhận sửa/xóa được (5).
4. Phiên (Trung bình): máy dùng chung hoặc bị mất còn phiên mãi mãi thì kẻ nhặt được máy giữ quyền.
5. Đoán mã/lạm dụng (Trung bình–Cao): mã ngắn hoặc dễ đoán, không giới hạn tần suất thì bị dò hàng loạt, hoặc spam tạo danh tính ẩn danh làm đầy lưu trữ.
6. Chuyển giao (Trung bình): chuyển nhầm cho người sai, không thể hoàn lại; Organizer rời đi thì chuyến mồ côi (Q6).
7. Member quay lại máy mới (1b, Trung bình): chỉ có tên hiển thị thì ai khai trùng tên có thể mạo danh, hoặc Member mất tick/đề xuất của mình.
8. Mục đã xóa (Trung bình–Cao): chủ chuyến tưởng đã xóa thông tin nhạy cảm (đặt phòng, SĐT) nhưng nó nằm vô hạn trên server; lộ link thì lộ cả phần này.

**6. Unknowns**
Plan chưa nêu: dữ liệu cá nhân thực tế thu thập, vòng đời bản sao lưu, ai có quyền với dữ liệu phía vận hành, trường hợp thiết bị dùng chung. Nếu không có bằng chứng, `UNVERIFIED`.

**7. Khuyến nghị (không phải quyết định)** — yêu cầu `PROPOSED`:
- M1: Mọi cơ chế phải nêu rõ đường chiếm quyền và đường mất quyền trước khi duyệt.
- M2: Quyền chủ chuyến tách biệt với link xem/mời; link không tự cấp quyền chủ.
- M3: Hành động rủi ro (khôi phục, chuyển giao, xóa vĩnh viễn) cần xác nhận lại và thông báo cho thiết bị đang có quyền.
- M4: Phiên có thời hạn, thu hồi được, xem danh sách thiết bị.
- M5: Giới hạn tần suất theo danh tính/IP, mã đủ entropy, lỗi không lộ đúng/sai, giới hạn tạo danh tính.
- M6: Chuyển giao cần bên nhận chấp nhận, có thể hủy trong một khoảng chờ.
- M7: Thông báo rõ cho người dùng kết quả "mất hết" ngay khi tạo chuyến.
- M8: Nêu rõ mục đã xóa nằm trong phạm vi quyền nào; xem xét hành động xóa vĩnh viễn cả chuyến (liên quan Q17).
- M9: Thu dữ liệu tối thiểu (§12).

**8. Confidence**
Medium: đủ bằng chứng về trạng thái và rủi ro, nhưng plan chưa có chi tiết dữ liệu thu thập và mô hình vận hành.

**9. Questions for the user**
1. Chấp nhận kết quả "mất hết là mất chuyến", hay ưu tiên khôi phục dù có kênh liên hệ?
2. Có coi việc thu email/SĐT là gần "tài khoản đầy đủ" (D8) không?
3. Link mở chuyến có được cấp quyền chủ không?
4. Mục đã xóa có nên hết hạn dù R7 nói không tự hết hạn (Q17)?

Không có gì bị thay đổi; các mục trên cần user duyệt.
