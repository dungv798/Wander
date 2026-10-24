# Scope — Q16 thiết kế xác thực và khôi phục quyền chủ chuyến

Nguồn: `docs/wander-master-plan.md` v0.3 (hash khớp registry, preflight PASS).

## Mục đã đọc
§1 (đầu), §3, §6.1–§6.3, §7.1, §7.4 (R13, R14–R16), §8.1 A2 và §8.5, §9.1 (A-0), §9.2, §9.3, §12, §13.1 (nhóm 3), §14.1–§14.3, §15.0, §15.1, §15.6, §16 (mục 10). Không đọc §4, §10–§11 chi tiết, Phụ lục.

## ID liên quan và trạng thái
| ID | Nội dung | Token |
|---|---|---|
| D15 | Danh tính ẩn danh + lưu server + mở trên thiết bị khác + phải thiết kế xác thực/khôi phục an toàn | `APPROVED` (cơ chế không chọn) |
| D8 | Member vào bằng tên hiển thị qua link, chưa yêu cầu tài khoản đầy đủ | `APPROVED` (chi tiết bảo mật OPEN: Q6, Q7, Q16) |
| D14 | 1a không phụ thuộc tài khoản đầy đủ/link mời/chia sẻ | `APPROVED` |
| D12 | Làm 1a trước, 1b sau | `APPROVED` |
| D19 | Xóa vĩnh viễn, giữ dữ liệu đến khi xóa vĩnh viễn (liên quan riêng tư) | `APPROVED` (Q17 OPEN) |
| R13 | Danh tính/lưu trữ chủ chuyến | `APPROVED` D15; cơ chế `OPEN` Q16 |
| A-0 | Story danh tính, mở thiết bị khác | `APPROVED` D15; "người không có bằng chứng không giành được quyền" là `INFERENCE` (🔶 diễn giải của "an toàn") |
| Q16 | 8 câu hỏi thiết kế (1–8); plan không đề xuất cơ chế | `OPEN` |
| G7 | Có thể thiết kế cơ chế an toàn mà không cần tài khoản đầy đủ | `UNVERIFIED` |
| Q7, Q6 | Link mời, quyền 1b (Q16 câu 8 chạm tới) | `OPEN` |
| Q17 | Xóa vĩnh viễn: ai, xác nhận, xóa chuyến | `OPEN` (chạm câu 5, 7) |
| §12 | Rủi ro Q16 (Cao); riêng tư dữ liệu server (Trung bình–Cao) | rủi ro đã ghi |
| §15.6 | Q16 là blocker số 1 trước spec 1a; thiết kế cần user duyệt | |
| Q11, P13, P2, P5 | blocker khác của spec 1a, ngoài phạm vi Q16 | `OPEN`/`PROPOSED` |

## Trong phạm vi
- Phân tích 8 câu hỏi thiết kế của Q16 (§15.1), các tình huống: mất thiết bị, mất mã, bị chiếm quyền, lộ link/mã, lạm dụng.
- So sánh các hướng thiết kế ở mức khái niệm (không chọn), nêu đánh đổi, kèm khuyến nghị `PROPOSED` ở dạng DRAFT.
- Soạn bản thiết kế ngắn (design brief) để user duyệt, đúng như §15.1 yêu cầu ("tài liệu thiết kế ngắn").

## Ngoài phạm vi
- Chọn cơ chế cuối cùng, stack, schema DB, UI, cài đặt auth.
- Q11, P13, P2, P5, Q17/Q18 (chỉ ghi điểm chạm), chi tiết quyền 1b (Q6–Q9, Q12).
- Sửa master plan.

## OPEN/PROPOSED chạm vào target
Q16 (chính), Q7 (link mời 1b, câu 8), Q6 (quyền 1b), Q17 (xóa vĩnh viễn/xóa chuyến, câu 5, 7), G7 (`UNVERIFIED`), P5 (cặp việc × người, chỉ liên quan gián tiếp).

## Lưu ý đọc
Plan nói rõ "tài liệu này không đề xuất cơ chế" (Q16) — mọi cơ chế cụ thể nêu ra trong run này là `PROPOSED` phân tích, không phải trích từ plan.
