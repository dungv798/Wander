# Scope — Q16 thiết kế xác thực và khôi phục quyền chủ chuyến

## Mục tiêu của run
Phân tích các phương án thiết kế cho Q16 (OPEN) và viết một bản **thiết kế nháp** để người dùng duyệt. Không chọn cơ chế, không viết mã, không sửa master plan.

## Đã đọc (`docs/wander-master-plan.md`, v0.3)
- §15.1 (Q16, 8 câu hỏi thiết kế), §15.6 (blocker), mục lục tiêu đề toàn plan.
- Kết quả Grep cho Q16 / D15 / A-0 / khôi phục: §0, §6.1, §6.2, §7.1, §7.4 (R7, R13, R14), §8 (A2, ngoại lệ), §9.1 (A-0, A-8), §9.2, §9.3 (B-2), §12, §13.1, §14.1 (D8, D15), §14.3 (G7), §15.0.

## ID và trạng thái
| ID | Token | Ghi chú |
|---|---|---|
| D15 | APPROVED | Danh tính ẩn danh + lưu server + mở thiết bị khác + phải thiết kế xác thực/khôi phục an toàn; cơ chế chưa chốt |
| D8 | APPROVED | Người đi cùng vào bằng tên hiển thị qua link, chưa cần tài khoản đầy đủ; chi tiết bảo mật OPEN (Q6, Q7, Q16) |
| D14 | APPROVED | 1a không phụ thuộc tài khoản đầy đủ/hệ thống thành viên |
| D19 | APPROVED | Xóa mềm, không lịch sử chỉnh sửa; xóa vĩnh viễn liên quan Q17 |
| Q16 | OPEN | 8 câu hỏi thiết kế; plan "không đề xuất cơ chế" |
| Q7, Q6 | OPEN | Link lộ/thu hồi; quyền; liên quan câu (5), (8) của Q16 |
| Q17 | OPEN | Xóa vĩnh viễn, xóa mềm chuyến (chạm dữ liệu khi mất quyền) |
| A-0 | APPROVED (cơ chế OPEN) | Tiêu chí "người không có bằng chứng không giành được quyền" là INFERENCE (🔶) |
| G7 | UNVERIFIED | Giả định có thể thiết kế an toàn mà không cần tài khoản đầy đủ |
| R13 | APPROVED (cơ chế OPEN) | Danh tính chủ chuyến |

## Trong phạm vi
Trả lời 8 câu hỏi của Q16 dưới dạng phương án + đánh đổi; tình huống mất thiết bị / mất mã / bị chiếm quyền; ảnh hưởng tới 1b chỉ ở mức ràng buộc (câu 8).

## Ngoài phạm vi
Chọn công nghệ/stack, schema DB, UI, cài đặt auth, quyền chi tiết 1b (Q6–Q9, Q12), Q11, Q17/Q18 (chỉ ghi điểm giao nhau).

## Mục OPEN/PROPOSED chạm vào target
Q16 (chính), Q7, Q6, Q17; INFERENCE ở A-0; G7 UNVERIFIED. Blocker §15.6 mục 1: bản thiết kế phải được người dùng duyệt — run này **không** thể đóng blocker đó.
