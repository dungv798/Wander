# Q16 — Bản thiết kế ngắn: xác thực và khôi phục quyền chủ chuyến

> **DRAFT – PROPOSED, chưa được duyệt.** Đây là bản nháp để user duyệt trước spec Lát 1a (§15.1, §15.6). Không phải quyết định, không chọn cơ chế, không chọn stack, không có schema hay giao diện. Q16 vẫn `OPEN`. Nguồn: `docs/wander-master-plan.md` v0.3 và `stages/consolidate.md` của run này.

## 1. Đã duyệt làm nền (`APPROVED`)
D15 (danh tính ẩn danh, lưu server, mở trên thiết bị khác, thiết kế an toàn), D8, D14, D12, D19. R13 ghi cơ chế còn ❓ Q16.

## 2. Mục tiêu và ngoài phạm vi
- Mục tiêu: chủ chuyến chứng minh quyền trên thiết bị mới, và khôi phục khi mất thiết bị, mà không cần tài khoản đầy đủ (D8, D14). Kiểm chứng G7 (`UNVERIFIED`).
- Ngoài phạm vi: Member, link mời, vai trò (1b: Q6, Q7); chọn công nghệ; giao diện.

## 3. Mô hình đe dọa tối thiểu (cần user xác nhận, `UNVERIFIED`)
- Tài sản: dữ liệu chuyến (địa điểm, chi phí, lịch đi vắng), quyền sở hữu, mục đã xóa mềm (D19).
- Kẻ tấn công cần xét: người nhặt/trộm thiết bị; người nhìn thấy mã/link qua ảnh chụp hoặc tin nhắn; người dò đoán mã hoặc ID; người chiếm kênh khôi phục (nếu có kênh ngoài).
- Chưa có dữ kiện về quy mô và đối tượng dùng; user cho biết mức đe dọa thực tế.

## 4. Câu hỏi sản phẩm user cần trả lời (điền vào cột trống)
| # | Câu hỏi | Liên hệ Q16 | Trả lời của user |
|---|---|---|---|
| 1 | Mất mọi cách khôi phục: chấp nhận mất chuyến vĩnh viễn, hay cần đường cuối? | câu 2 | |
| 2 | Định danh liên lạc đã xác minh (email…) có được phép không, hay coi là "tài khoản đầy đủ" theo D8/D14? | câu 1, 3 | |
| 3 | Chuyến mồ côi và mục đã xóa mềm giữ bao lâu; ai xóa vĩnh viễn? | câu 5; Q17(c) | |
| 4 | Chuyển giao quyền chủ chuyến: thuộc 1a hay để 1b? | câu 7 | |
| 5 | Hai thiết bị cùng lúc của một chủ có thuộc phạm vi 1a không? | D15; chạm Q8 | |
| 6 | Phiên hiệu lực bao lâu; có thu hồi thiết bị không? | câu 4 | |
| 7 | Member 1b dùng cùng cơ chế với chủ hay riêng? | câu 8; Q6, Q7 | |
| 8 | Xác nhận hay sửa diễn giải "người không có bằng chứng không giành được quyền" ở A-0 (`INFERENCE`) | A-0 | |

## 5. Họ cơ chế để cân nhắc sau khi trả lời mục 4 (`PROPOSED`, chưa chọn)
| Họ | Ưu | Nhược chính |
|---|---|---|
| A. Mã/bí mật do người dùng giữ | Thuần ẩn danh; phần server nhỏ | Mất mã mất chuyến; lộ mã mất quyền |
| B. Xác minh qua kênh ngoài | Khôi phục tốt | Thu dữ liệu cá nhân; chiếm kênh = chiếm chuyến; gần "tài khoản" |
| C. Ghép nối từ thiết bị đã tin cậy | Không cần dữ liệu cá nhân | Mất thiết bị cũ vẫn cần đường khác |
| D. Kết hợp | Giảm mất trắng | Đường yếu nhất quyết định độ an toàn |

Ước tính giờ riêng cho từng họ: `UNVERIFIED` (plan chỉ có 15–40 giờ ở §13.1 nhóm 3).

## 6. Nguyên tắc thiết kế đề nghị duyệt (`PROPOSED`)
1. Tách chủ thể sở hữu khỏi bằng chứng đăng nhập; Trip không gắn với một thiết bị cụ thể.
2. Bí mật quyền chủ tách khỏi link mời 1b: lộ link mời không dẫn tới quyền chủ.
3. Mọi đường khôi phục mạnh ngang nhau, hoặc đường yếu chỉ cấp quyền hạn chế.
4. Giới hạn tần suất; phản hồi không phân biệt "sai" với "không tồn tại"; định danh không đoán được. Ngưỡng cụ thể `UNVERIFIED`.
5. Có thu hồi phiên/thiết bị nếu user chọn phiên có hạn; chuyển giao quyền (nếu có ở 1a) cần bằng chứng mạnh hơn phiên.
6. Chính sách lưu giữ cho chuyến mồ côi và mục đã xóa, thống nhất với Q17(c).
7. 1a chừa chỗ cho Member nhưng không xây thành phần 1b (D14, §9.2).

## 7. Tiêu chí kiểm tra "an toàn" (`PROPOSED`, ngoài §10.5)
Chỉ để user chỉnh; không phải test đã chạy.
- Không có bằng chứng thì không giành được quyền.
- Bằng chứng bị thu hồi thì không còn hiệu lực.
- Phiên hết hạn thì bị từ chối.
- Nhiều lần thử sai thì bị giới hạn.
- Dò đoán không làm lộ chuyến nào có tồn tại.
- Mở trên thiết bị khác thấy đủ dữ liệu, gồm thứ tự thủ công (§10.5 tiêu chí 5).

## 8. Thứ tự quyết định gợi ý (`PROPOSED`)
Mô hình đe dọa → câu 1, 2 → họ cơ chế → phiên, lạm dụng → chuyển giao và Q17(c) → Member (cùng Q6, Q7 khi mở 1b).

## 9. Sau khi duyệt
Cập nhật G7 và Q16 trong master plan là việc của user; run này không sửa plan. Spec Lát 1a vẫn còn các blocker khác: Q11, P13, P2/P5 (§15.6).
