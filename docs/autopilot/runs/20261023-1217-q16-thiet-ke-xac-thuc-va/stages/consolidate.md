# Consolidate — Q16 thiết kế xác thực và khôi phục quyền chủ chuyến

Nguồn: `docs/wander-master-plan.md` v0.3 (§15.1, §14.1, §14.3, §7.4, §9.1, §9.2, §12, §13.1); ba báo cáo vòng 1 trong `agents/`; `stages/reconcile.md`. Vòng 2 bỏ qua (không có bất đồng material).

## 1. Đã duyệt, giữ nguyên (`APPROVED`)
- **D15:** danh tính ẩn danh + lưu dữ liệu phía server ở Lát 1a; chuyến mở được trên thiết bị khác; phải thiết kế xác thực và khôi phục quyền chủ chuyến an toàn. Cơ chế cụ thể chưa chốt.
- **D8:** Member vào bằng tên hiển thị qua link, chưa yêu cầu tài khoản đầy đủ. **D14:** 1a không phụ thuộc tài khoản đầy đủ/link mời/chia sẻ. **D12:** làm 1a trước.
- **D19:** xóa mềm, giữ đến khi xóa vĩnh viễn, không lịch sử chỉnh sửa; quyền trong chia sẻ xác định ở 1b.
- **R13:** danh tính/lưu trữ chủ chuyến (✅ D15; cơ chế ❓ Q16).

## 2. Còn mở (`OPEN`), không quyết ở đây
Q16 (8 câu hỏi, §15.1), Q17 (xóa vĩnh viễn: ai/xác nhận/xóa chuyến), Q6, Q7 (1b, chạm câu 8 và câu 5), Q8 (sửa đồng thời), Q15 (mạng yếu). `PROPOSED` liên quan: P5. `UNVERIFIED`: G7. Q16 là blocker số 1 trước spec 1a (§15.6); Q11, P13 và P2/P5 cũng chặn spec nhưng ngoài phạm vi run này.

## 3. Đồng thuận (vẫn là phân tích, không phải quyết định)
1. Mọi bằng chứng quyền chủ chuyến ở chế độ ẩn danh đều có tính "ai nắm bí mật là dùng được" (bearer) vì không có định danh tự nhiên (email, điện thoại). `INFERENCE` từ D15 (security).
2. Đánh đổi trung tâm: khôi phục dễ ⇒ bề mặt chiếm quyền lớn; khôi phục khó ⇒ nguy cơ mất chuyến. `OPEN` (câu 2).
3. D19 + chuyến mồ côi ⇒ dữ liệu (kể cả mục đã xóa mềm) có thể nằm vô thời hạn trên server mà không ai xóa được; đụng rủi ro riêng tư trong §12 (Trung bình–Cao). `INFERENCE`.
4. Bí mật quyền chủ nên tách khỏi link mời của 1b (Q7). `PROPOSED`.
5. Replay (§10.5 tiêu chí 5) chỉ kiểm đường thuận; "an toàn" chưa có tiêu chí đo. `INFERENCE`.

## 4. Bất đồng / nhấn mạnh khác nhau, giữ nguyên
- Kênh ngoài (email): security và architect đều thấy có thể va tinh thần D8/D14, nhưng plan không định nghĩa "tài khoản đầy đủ". Không agent nào có đủ căn cứ để quyết; user quyết. `OPEN`.
- Chuyển giao quyền: architect xem "không chuyển giao ở 1a" là ít việc nhất; security cảnh báo rủi ro bị ép/chuyển bằng phiên bị đánh cắp nếu có; skeptic buộc nó vào câu 2. Chưa có đề xuất chung. `OPEN`.
- Không có `CONTRADICTION` được xác nhận. A-0 chứa hai yêu cầu căng nhau khi mất mọi bằng chứng ("không có bằng chứng thì không giành được quyền" và "có cách khôi phục") nhưng không loại trừ nhau về lời văn: ghi là mơ hồ (`INFERENCE`).

## 5. Khoảng trống bằng chứng (`UNVERIFIED`)
- G7: chưa có gì chứng minh làm "an toàn" được mà không cần tài khoản đầy đủ; cột kiểm chứng của G7 là "bản thiết kế được duyệt", tức chưa có tiêu chí đo.
- Mô hình đe dọa thực tế (ai là kẻ tấn công, quy mô người dùng).
- Cách báo cho chủ cũ khi quyền được khôi phục ở thiết bị khác (danh tính ẩn danh có thể không có kênh).
- Khôi phục giữa chuyến khi mạng yếu (Q15 hoãn).
- Giờ riêng cho từng phương án (plan chỉ có khoảng 15–40 giờ ở §13.1 nhóm 3).
- Hai thiết bị cùng lúc của một chủ ở 1a: Q8 chỉ gán 1b, plan chưa nêu (`INFERENCE` từ skeptic).

## 6. Tùy chọn cho các mục OPEN (phân tích, nhãn `PROPOSED`, không chọn)

### 6.1 Họ cơ chế cho câu 1, 3, 4 (bằng chứng, thiết bị khác, phiên)
| Họ | Ưu | Nhược / rủi ro | Phụ thuộc quyết định của user |
|---|---|---|---|
| A. Bí mật/mã khôi phục do người dùng giữ | Thuần ẩn danh, khớp D8/D14; phần server nhỏ; dễ kiểm thử bất biến | Mất mã ⇒ mất chuyến; lộ mã (ảnh chụp màn hình, ghi chú đồng bộ đám mây) ⇒ mất quyền; cần chống dò | Chấp nhận "mất mã = mất quyền" |
| B. Xác minh qua kênh ngoài (định danh liên lạc) | Khôi phục tốt, chi phí người dùng thấp | Thu dữ liệu cá nhân; phụ thuộc dịch vụ gửi tin và chống lạm dụng; chiếm hộp thư = chiếm chuyến; gần "tài khoản" nên có thể va D8/D14; nguy cơ vượt 15–40 giờ | Kênh liên lạc có còn "ẩn danh" theo D8/D14 không |
| C. Ghép nối thiết bị đã tin cậy | Không cần thông tin cá nhân; an toàn khi còn thiết bị cũ | Mất thiết bị cũ thì vẫn cần đường khác; kiểm thử hai thiết bị khó hơn | Thường kết hợp với A hoặc B |
| D. Kết hợp | Giảm mất trắng | Đường yếu nhất quyết định độ an toàn; thêm bề mặt tấn công | Mọi đường phải mạnh ngang nhau hoặc đường yếu chỉ cấp quyền hạn chế |

### 6.2 Câu 2: khi mất mọi cách khôi phục
| Lựa chọn | Hệ quả |
|---|---|
| (a) Chấp nhận mất chuyến vĩnh viễn | Đơn giản, an toàn trước chiếm quyền; mất dữ liệu người dùng; cần chính sách cho chuyến mồ côi |
| (b) Có đường cứu hộ cuối | Giảm mất trắng; tăng bề mặt chiếm quyền; có thể cần định danh liên lạc (họ B) |

### 6.3 Câu 4, 6, 7, 8
- Phiên (câu 4): dài gia hạn khi dùng ít phiền nhưng thiết bị mất dùng được lâu; có hạn an toàn hơn nhưng bị đăng xuất giữa chuyến khi mạng yếu. Cả hai cần thu hồi thiết bị.
- Lạm dụng (câu 6): giới hạn tần suất, phản hồi không phân biệt "sai" và "không tồn tại", định danh không đoán được; ngưỡng cụ thể `UNVERIFIED` (không có số liệu).
- Chuyển giao (câu 7): không chuyển giao ở 1a (ít việc, Q6 thuộc 1b) so với chuyển giao tường minh bằng mã dùng một lần (thêm trạng thái/kiểm thử, chạm Q6).
- Member (câu 8): dùng cùng cơ chế với chủ hay riêng; phụ thuộc Q6, Q7. Thiết kế 1a nên chừa chỗ mà không xây thành phần 1b (D14, §9.2). Hai Member trùng tên hiển thị không nên bị hợp nhất tự động (`INFERENCE`).

### 6.4 Thứ tự quyết định gợi ý (`PROPOSED`, từ skeptic)
Mô hình đe dọa → câu (1)(3)(2) → (4)(6)(5) → (7) cùng Q17(c) → (8) cùng Q6/Q7 khi mở 1b.

## 7. Rủi ro xếp theo mức độ (kịch bản cụ thể)
| # | Mức | Kịch bản | Hệ quả |
|---|---|---|---|
| 1 | Cao (§12) | Lan mất điện thoại duy nhất giữa chuyến Hà Giang, không có mã/kênh khôi phục. | Mất quyền chủ vĩnh viễn nếu chọn (a); dữ liệu vẫn nằm trên server. |
| 2 | Cao (§12) | Mã khôi phục bị chụp màn hình rồi đồng bộ lên đám mây chung; kẻ có mã mở từ thiết bị lạ. | Chiếm quyền, lộ lịch di chuyển và chi phí, khóa chủ thật. |
| 3 | Cao nếu không tách | Link mời 1b bị gửi vào nhóm chat; nếu link cũng là bằng chứng quyền chủ thì người nhận trở thành chủ. | Leo thang từ Member lên chủ. |
| 4 | Trung bình–Cao (§12) | Chủ mất quyền; chuyến và mục đã xóa mềm giữ vô thời hạn (D19). | Dữ liệu cá nhân tồn tại không ai xóa được. |
| 5 | Trung bình | Liệt kê/dò mã hoặc ID chuyến, spam tạo chuyến. | Chiếm quyền hoặc tốn tài nguyên; ngưỡng `UNVERIFIED`. |
| 6 | Trung bình | Một chủ mở chuyến trên hai thiết bị, sửa cùng một mục (không có lịch sử chỉnh sửa, D19). | Ghi đè mất dữ liệu ở 1a, ngoài phạm vi Q8 hiện ghi. `INFERENCE` |
| 7 | Trung bình | Phiên trên điện thoại bị trộm dùng để chuyển giao quyền. | Mất quyền vĩnh viễn nếu chuyển giao chỉ cần phiên. |

## 8. Bản ghi quyết định
| ID | Token | Nội dung | Thứ bị khóa | Đảo ngược được không | Việc cần user |
|---|---|---|---|---|---|
| D15 | `APPROVED` | Giữ nguyên | — | — | — |
| Q16 | `OPEN` | Cơ chế xác thực/khôi phục (8 câu) | Spec 1a; mô hình Trip/danh tính; ước tính nhóm 3 | Trước khi code thì rẻ; sau khi dữ liệu đã tạo thì khó đổi | Duyệt thiết kế, quyết các câu ở mục 9 |
| A-0 (diễn giải "an toàn") | `INFERENCE` | "Người không có bằng chứng quyền không giành được quyền" | Tiêu chí nghiệm thu A-0 | Có | Xác nhận hoặc sửa diễn giải |
| G7 | `UNVERIFIED` | Có thể an toàn mà không cần tài khoản đầy đủ | Tính khả thi của D15 | — | Cung cấp tiêu chí "an toàn" |
| Q17 (c) | `OPEN` | Xóa vĩnh viễn: ai, xác nhận | Chính sách chuyến mồ côi | Có | Quyết cùng Q16 câu 2 |
| Q6, Q7 | `OPEN` | Quyền và link mời 1b | Câu 5, 8 | — | Quyết khi mở 1b |
| **DRAFT-1** | `PROPOSED` | Xem mục 9 | — | Có (chỉ là tài liệu) | Duyệt hoặc sửa |

## 9. DRAFT-1 (`PROPOSED`, khuyến nghị, không phải quyết định)
Về Q16, khuyến nghị **không chọn cơ chế ở bước này**. Thay vào đó, duyệt một bản **thiết kế ngắn** (đúng đề xuất §15.1) trong đó user trả lời các câu hỏi sản phẩm trước, rồi mới chọn họ cơ chế. Bản nháp có trong `deliverables/q16-design-brief.md`. Nội dung đề xuất gồm:
1. User trả lời: (i) chấp nhận mất chuyến khi mất mọi cách khôi phục hay cần đường cuối; (ii) định danh liên lạc có được phép không; (iii) giữ chuyến mồ côi/mục đã xóa bao lâu; (iv) chuyển giao quyền thuộc 1a hay 1b; (v) hai thiết bị cùng lúc ở 1a; (vi) phiên có hạn hay dài; (vii) Member dùng cùng cơ chế hay riêng.
2. Nguyên tắc thiết kế đề nghị duyệt: tách chủ thể khỏi bằng chứng đăng nhập (Trip không gắn với thiết bị); bí mật quyền chủ tách khỏi link mời 1b; mọi đường khôi phục mạnh ngang nhau; có giới hạn tần suất và phản hồi không lộ thông tin; có thu hồi phiên/thiết bị; chính sách lưu giữ chuyến mồ côi; tiêu chí âm tính cho "an toàn" ngoài §10.5.
3. Sau khi duyệt thì chọn họ cơ chế ở 6.1 và cập nhật G7.

Lý do: quyết định (i)–(ii) quyết định gần như toàn bộ lựa chọn họ cơ chế, và chỉ user quyết được. Hệ quả nếu không làm: người cài đặt (kể cả Claude Code) tự chọn cơ chế khi code (§15.1, §16 mục 10).

## 10. Câu hỏi cho user
1. Mất mọi cách khôi phục: chấp nhận mất chuyến vĩnh viễn, hay cần đường cuối?
2. Định danh liên lạc đã xác minh có được coi là "tài khoản đầy đủ" theo D8/D14 không?
3. Chuyến mồ côi và mục đã xóa mềm giữ bao lâu, ai xóa vĩnh viễn (Q17c)?
4. Chuyển giao quyền ở 1a hay 1b?
5. Hai thiết bị cùng lúc của một chủ có thuộc 1a không (chạm Q8)?
6. Phiên có hạn hay dài, có thu hồi thiết bị không?
7. Member 1b có dùng cùng cơ chế với chủ chuyến không?

Cần user duyệt: bản thiết kế Q16 và trả lời trên; diễn giải "an toàn" ở A-0; tiêu chí âm tính. Không thay đổi nào được thực hiện trong master plan.
