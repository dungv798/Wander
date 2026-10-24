# Báo cáo kiến trúc khái niệm: Q16 (xác thực và khôi phục quyền chủ chuyến)

## 1. Scope
Q16 là OPEN. Báo cáo này chỉ phân tích khái niệm các câu 1, 3, 4, 7 và 8, cùng đường chuyển 1a→1b. Không chọn cơ chế, stack, schema hay UI.

## 2. Source evidence
Tất cả nằm trong `docs/wander-master-plan.md`:
- §15.1 (Q16), §15.0 (Q1→D15)
- §14.1 (D8, D12, D14, D15, D19), §14.3 (G7)
- §7.1, R13–R16 trong §7.4, §8.1 A2, A-0 trong §9.1, §9.2, §13.1 nhóm 3, §16 mục 10, §6.2
- Ngoài danh sách bạn nêu, tôi đọc thêm §6.1, §14.2 (P5, P11) và §15.4 (Q6, Q7).

Không trích số dòng.

## 3. Findings
- `APPROVED` (D15): có danh tính ẩn danh, lưu phía server và mở được trên thiết bị khác. Phải có thiết kế xác thực và khôi phục an toàn. D8 và D14 loại tài khoản đầy đủ khỏi 1a.
- `OPEN`: cơ chế (Q16), cùng 8 câu hỏi thiết kế của nó.
- `INFERENCE` (A-0): "người không có bằng chứng không giành được quyền" là diễn giải của chữ "an toàn". Cần bạn xác nhận.
- `UNVERIFIED` (G7): chưa có gì chứng minh được "an toàn mà không cần tài khoản đầy đủ". Phương án 2 có thể mâu thuẫn với D8/D14, tùy cách bạn định nghĩa "tài khoản đầy đủ".
- `INFERENCE`: nhóm 3 (15–40h, bất định Cao) tăng chủ yếu vì khôi phục và nhiều thiết bị (§13.1). Ba phương án dưới đây khác nhau nhiều về chi phí này, nhưng tôi không có số giờ riêng cho từng phương án (`UNVERIFIED`).
- `INFERENCE`: R13 và §7.1 ghi "danh tính Member ở 1b" và Q16 câu 8. Vì vậy Q16 chạm cả 1b, dù thiết kế thuộc 1a.

## 4. Options (PROPOSED, chỉ phân tích)
**Phương án 1: bí mật cầm giữ (bearer secret) và mã khôi phục lưu bởi người dùng.**
- Ý tưởng: thiết bị giữ một bí mật làm bằng chứng. Thiết bị mới nhập mã hoặc link bí mật để mở chuyến.
- Ưu: thuần ẩn danh, khớp D8/D14. Phần server nhỏ. Dễ kiểm thử bằng bất biến.
- Nhược:
  - Mất hết mã nghĩa là mất chuyến vĩnh viễn (câu 2).
  - Lộ mã nghĩa là mất quyền (câu 5).
  - Người dùng phải tự giữ mã.
- Phụ thuộc: chấp nhận "mất mã = mất quyền" (cần bạn duyệt), và phải có giới hạn tần suất nếu mã đoán được (câu 6).

**Phương án 2: xác minh qua kênh ngoài (một định danh liên lạc được xác minh).**
- Ý tưởng: khôi phục bằng việc chứng minh sở hữu một kênh liên lạc.
- Ưu: khôi phục tốt nhất, chi phí người dùng thấp.
- Nhược:
  - Thêm phụ thuộc dịch vụ gửi tin, chống lạm dụng, lưu dữ liệu cá nhân (xem `planning-safety` về quyền riêng tư).
  - Gần với "tài khoản" nên có thể va D8/D14 (`OPEN`).
  - Ước tính 15–40h có nguy cơ vượt (`UNVERIFIED`).
- Phụ thuộc: bạn quyết một định danh liên lạc có còn là "ẩn danh" không.

**Phương án 3: ghép nối từ thiết bị đã tin cậy (thiết bị cũ duyệt thiết bị mới).**
- Ưu: không cần thông tin cá nhân. An toàn khi có thiết bị cũ.
- Nhược: mất thiết bị cũ thì vẫn cần đường khôi phục khác. Nên nó thường kết hợp với phương án 1 hoặc 2 chứ ít khi đứng một mình. Kiểm thử luồng hai thiết bị khó hơn.

**Vòng đời phiên (câu 4)** (PROPOSED, chỉ so sánh hai hướng):
- Phiên dài, gia hạn khi dùng: ít phiền, nhưng thiết bị bị mất vẫn dùng được lâu.
- Phiên có hạn, phải xác thực lại: an toàn hơn, nhưng tăng thao tác người dùng.
- Cả hai cần đường thu hồi một thiết bị.

**Chuyển giao quyền (câu 7):**
- Không chuyển giao trong 1a: ít việc nhất, và Q6 ("Organizer rời đi thì sao") thuộc 1b.
- Chuyển giao tường minh bằng mã dùng một lần: thêm trạng thái và kiểm thử, và chạm Q6.

## 5. Risks
- **Cao:** nếu bỏ qua, người cài đặt tự chọn cơ chế khi code, rất khó sửa (§15.1, §16 mục 10).
- **Cao:** gắn quyền chủ chuyến vào "thiết bị" thay vì "chủ thể" thì 1b phải làm lại. Ví dụ: Lan đổi điện thoại, quyền gắn với thiết bị cũ nên chuyến bị kẹt.
- **Trung bình:** vô tình kéo link mời, vai trò hay Member vào 1a, vi phạm §9.2/D14.
- **Trung bình:** bí mật nằm trong link (kiểu mở bằng link) có thể lộ qua lịch sử trình duyệt hoặc tin nhắn (câu 5).

## 6. Unknowns
- Mức "an toàn" nào là đủ: trước hết là mô hình đe dọa.
- Có chấp nhận mất chuyến vĩnh viễn không.
- Có lưu dữ liệu liên lạc không.
- Số giờ thực của từng phương án.

## 7. Khuyến nghị (không phải quyết định)
**Đường chuyển 1a→1b** (`INFERENCE`; không phải thiết kế):
- 1a nên chừa: tách "chủ thể" (principal) khỏi "bằng chứng đăng nhập"; Trip tham chiếu chủ thể sở hữu, không tham chiếu thiết bị; Completion theo cặp (việc × chủ thể), khớp P5 đang PROPOSED.
- 1a không nên xây: Member, tên hiển thị, link mời, vai trò, vùng Ý tưởng.
- Q7 và Q8: nếu 1b muốn Member quay lại dùng cùng cơ chế với chủ chuyến thì thiết kế Q16 nên tổng quát hơn một chút. Đây là quyết định sản phẩm.

**Bạn cần duyệt (sản phẩm):**
- Mô hình đe dọa và mức chấp nhận mất chuyến (câu 2)
- Có thêm định danh liên lạc không (phương án 2)
- Mức an toàn của A-0
- Thời hạn phiên
- Chuyển giao quyền trong 1a
- Cách Member quay lại ở 1b

**Có thể hoãn tới khi chọn công nghệ** (chi tiết kỹ thuật): cách sinh và lưu bí mật, thuật toán băm, lưu phiên, cách giới hạn tần suất, định dạng mã.

**Bất biến cho kiểm thử** (`PROPOSED`):
- Không có bằng chứng thì không giành được quyền.
- Bằng chứng bị thu hồi thì không còn hiệu lực.
- Mở trên thiết bị khác thấy đủ dữ liệu (kể cả thứ tự thủ công).
- Phiên hết hạn thì bị từ chối.
- Nhiều lần thử sai thì bị giới hạn.
- Dữ liệu không lộ khi dò đoán.

## 8. Confidence
Medium. Plan rõ về ràng buộc nhưng không có mô hình đe dọa hay số liệu cho từng phương án.

## 9. Questions for the user
1. Mất mọi cách khôi phục thì chấp nhận mất chuyến vĩnh viễn, hay yêu cầu có đường cứu?
2. Một định danh liên lạc đã xác minh có vi phạm "không tài khoản đầy đủ" (D8/D14) không?
3. Phiên nên có hạn hay kéo dài?
4. 1a có cần chuyển giao quyền không?
5. Member ở 1b có dùng cùng cơ chế với chủ chuyến không?

Chưa có gì được thay đổi; không file nào bị sửa.
