> Nguồn: subagent **stand-in** (general-purpose) thay cho `wander-software-architect`; `source: emulated`, danh tính agent UNVERIFIED. Nội dung dưới đây là báo cáo nguyên văn.

**Báo cáo wander-software-architect: Q16 (xác thực và khôi phục quyền chủ chuyến, 1a)**

**1. Scope**
So sánh mức khái niệm, không gắn công nghệ, các cách chủ chuyến chứng minh và khôi phục quyền trên thiết bị mới. Chỉ phân tích. Không chọn cơ chế.

**2. Source evidence**
`docs/wander-master-plan.md`: §14.1 D8, D15, D19; §15.1 Q16 (8 câu hỏi thiết kế); §7.1 (Danh tính ẩn danh, Member); §7.4 R7, R13; §9.1 A-0, A-8; §9.2 (hàng "Thiết kế xác thực và khôi phục"); §14.3 G7; §15.4 Q6, Q7. Không trích số dòng.

**3. Findings**
- D15, D8, D19: `APPROVED`. Cơ chế cụ thể (R13, Q16): `OPEN`. Plan ghi rõ "không đề xuất cơ chế". Các phương án dưới đây là phân tích của tôi, không phải ý kiến của plan.
- A-0 yêu cầu có cách khôi phục "theo thiết kế được duyệt". "Người không có bằng chứng không giành được quyền" là diễn giải, `INFERENCE`.
- G7 (thiết kế an toàn mà không cần tài khoản đầy đủ khả thi): `UNVERIFIED`.
- Q6, Q7: `OPEN`. Mọi nối sang 1b chỉ là hệ quả dự kiến.
- Q16(2), (4), (7), (8) cần trả lời bằng bất kỳ phương án nào.

**4. Options (đều `PROPOSED`)**

**A. Bí mật do chủ giữ (mã khôi phục).** Khi tạo chuyến, người dùng nhận một mã dài, khó đoán, chỉ hiện một lần.
- Lưu ở đâu: server chỉ giữ dạng kiểm chứng của mã (không giữ mã gốc). Thiết bị giữ phiên.
- Chủ phải giữ: mã (ghi lại hoặc lưu trong trình quản lý mật khẩu).
- Lỗi: mất mã và mất mọi thiết bị đang đăng nhập thì mất quyền vĩnh viễn. Lộ mã thì kẻ lạ chiếm chuyến.
- Khóa vào mô hình 1a: tách Principal / Credential / Phiên. Cần thao tác xoay hoặc thu hồi mã.
- Sang 1b: Member có thể dùng cùng mô hình (tên hiển thị + mã riêng) và không cần liên hệ ngoài, nên khớp D8. Link mời (Q7) là loại bí mật khác và phải không cấp quyền chủ.
- Khả năng đảo ngược: trung bình. Thêm cách khôi phục sau được, nhưng mã đã phát hành thì phải xoay.
- Phụ thuộc: Q16(2), (5), (7).

**B. Kênh liên hệ đã xác minh.** Chủ gắn tùy chọn một kênh liên hệ. Khôi phục bằng cách chứng minh kiểm soát kênh đó.
- Lưu ở đâu: server giữ kênh liên hệ (dữ liệu cá nhân) và ánh xạ chuyến.
- Chủ phải giữ: quyền kiểm soát kênh.
- Lỗi: mất hoặc bị chiếm kênh thì bị chiếm chuyến. Người bỏ qua bước gắn kênh thì không có đường khôi phục.
- Khóa vào mô hình: thêm dữ liệu cá nhân và hạ tầng gửi tin. Tiến gần "tài khoản", cần kiểm tra với D8.
- Sang 1b: Member không bắt buộc có kênh nên phải có nhánh thứ hai cho Member (Q16(8)).
- Khả năng đảo ngược: thấp. Đã thu dữ liệu cá nhân thì khó rút.
- Phụ thuộc: ranh giới "không tài khoản đầy đủ" (D8), Q16(6).

**C. Ghép thiết bị (thiết bị đã tin duyệt thiết bị mới bằng mã ngắn, dùng một lần).** Chỉ là phần bổ sung, không đứng một mình.
- Giải quyết "mở trên thiết bị khác" (Q16(3)) khi còn thiết bị cũ.
- Mất hết thiết bị thì cần A hoặc B.
- Sang 1b: dùng lại được cho Member.
- Khả năng đảo ngược: cao.

**5. Risks**
- Cao: người cài đặt tự chọn cơ chế khi code (plan §15.1 đã nêu). Kịch bản: chủ mất điện thoại, mở chuyến từ laptop mới nhưng chưa có đường khôi phục nào được duyệt.
- Cao (A): người dùng không lưu mã, đổi điện thoại và mất toàn bộ lịch trình.
- Trung bình (B): dữ liệu cá nhân phát sinh ngoài tinh thần D8.
- Trung bình: Member 1b khác chủ về cách khôi phục, tạo hai hệ thống song song.

**6. Unknowns**
Mức rủi ro bị chiếm quyền mà người dùng chấp nhận (G7 `UNVERIFIED`). Thời hạn phiên. Chuyển giao quyền chủ. Tần suất mất thiết bị thực tế (chưa có bằng chứng).

**7. Khuyến nghị (không phải quyết định)**
Tách khái niệm danh tính, bằng chứng và phiên trong thiết kế. Việc này không phụ thuộc phương án nào và giữ đường lui cho 1b. Không nên khóa bất kỳ phương án nào trước khi người dùng trả lời Q16(2).

Invariants cho test (`PROPOSED`):
1. Không có bằng chứng hợp lệ thì không đọc, ghi hoặc xóa được với tư cách chủ.
2. Server không lưu bí mật khôi phục dạng đọc được.
3. Khôi phục xong, thiết bị mới thấy đủ dữ liệu: mục, thứ tự, mục đã xóa mềm, tổng giữ nguyên (A-0, A-8, R2).
4. Sau xoay hoặc thu hồi, bằng chứng cũ không dùng được.
5. Thử sai nhiều lần thì bị giới hạn tần suất (Q16(6)).
6. Một chuyến có đúng một chủ tại mọi thời điểm.
7. Chủ chuyến A không truy cập được chuyến B.
8. Trường hợp mất mọi cách khôi phục có kết quả xác định, không tự cấp quyền.
9. (1b) Link mời bị lộ không bao giờ cấp quyền chủ.

**8. Confidence**
Medium. Plan đủ để nêu ràng buộc, nhưng ngưỡng rủi ro và giả định G7 chưa được kiểm chứng.

**9. Questions for the user**
1. Nếu mất mọi cách khôi phục, chấp nhận mất chuyến vĩnh viễn (hướng A), hay cần đường khôi phục có người khác xác nhận? (Q16(2))
2. Thu một kênh liên hệ tùy chọn có vi phạm tinh thần "không tài khoản đầy đủ" (D8) không? (quyết định B có khả thi hay không)
3. Quyền chủ có cần chuyển giao được không? (Q16(7))
4. Member 1b có phải tự khôi phục khi đổi thiết bị không? (Q16(8), liên hệ Q6, Q7)

Nothing was changed. Cần bạn duyệt: lựa chọn phương án (A/B/C hoặc kết hợp) và câu trả lời Q16(2), (4), (7), (8).
