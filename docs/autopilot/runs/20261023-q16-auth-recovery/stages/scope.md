# Scope — Q16: thiết kế xác thực và khôi phục quyền chủ chuyến (D15)

Kế hoạch: `docs/wander-master-plan.md` v0.3 (hash khớp registry, preflight PASS). Chỉ đọc các mục dưới đây (bản đồ mục: `.claude/rules/wander-product-context.md`).

## Mục đã đọc và trạng thái
| Mục | Nội dung liên quan | Token |
|---|---|---|
| §14.1 D15 | Danh tính ẩn danh + lưu phía server; mở trên thiết bị khác; phải *thiết kế* xác thực và khôi phục quyền chủ chuyến an toàn; cơ chế chưa chốt | APPROVED (cơ chế: OPEN) |
| §14.1 D8 | Người đi cùng vào bằng tên hiển thị qua link, chưa cần tài khoản đầy đủ | APPROVED (chi tiết bảo mật: OPEN) |
| §14.1 D19 | Xóa mềm giữ đến khi xóa vĩnh viễn, không có lịch sử chỉnh sửa; quyền ở 1b | APPROVED (phạm vi: OPEN, Q17) |
| §15.1 Q16 | Tám câu hỏi thiết kế (bằng chứng quyền chủ chuyến trên thiết bị mới; mất mọi cách khôi phục; mở trên thiết bị khác; hiệu lực phiên; lộ link/mã; chống lạm dụng; chuyển giao quyền; Member quay lại ở 1b). Tài liệu "không đề xuất cơ chế" | OPEN |
| §7.4 R13, §9.1 A-0 | Yêu cầu phải có thiết kế xác thực/khôi phục an toàn; A-0 tiêu chí "người không có bằng chứng quyền không giành được quyền chủ chuyến" | R13: APPROVED (D15), cơ chế OPEN · A-0 tiêu chí diễn giải: PROPOSED/INFERENCE |
| §14.3 G7 | Giả định có thể thiết kế cơ chế an toàn mà không cần tài khoản đầy đủ | UNVERIFIED |
| §12 | Rủi ro Q16 "Cao"; rủi ro riêng tư dữ liệu server + xóa mềm "Trung bình–Cao" | PROPOSED (rủi ro) |
| §9.2, §8.5, §3 | Q16 thuộc 1a; 1b dựa trên nền này (Q7, Q16); ngoại lệ "mất thiết bị hoặc mất quyền chủ chuyến"; thuật ngữ Organizer/Member/Viewer | §9.2 kết luận 🔶/✅ lẫn; P11 PROPOSED; Viewer OPEN (Q6) |
| §15.4 Q6, Q7 | Quyền và link mời ở 1b; Q7 hệ quả "link bị lộ thì ai có link vào được đến khi thu hồi" | OPEN |
| §15.6, §16 mục 10 | Q16 là blocker 1 trước spec 1a; không để Claude Code tự chọn cơ chế | — |

## Trong phạm vi / ngoài phạm vi
- **Trong:** so sánh phương án *ở mức khái niệm* cho 8 câu hỏi của Q16; kịch bản mất thiết bị / mất mã / chiếm quyền; ảnh hưởng đến 1a (A-0, A-8) và điểm nối với 1b (Q7, Q6).
- **Ngoài:** chọn hoặc cài đặt cơ chế; chọn công nghệ; thiết kế giao diện; cấu trúc CSDL; quyền chi tiết 1b (Q6–Q9, Q12); Q11, Q17, Q18 (chỉ nhắc khi chạm).

## Điều chặn mà run này không được tự quyết
Q16 (và việc bạn duyệt bản thiết kế) vẫn OPEN. Run chỉ phân tích và khuyến nghị; không đổi trạng thái nào.
