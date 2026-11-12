# DR-039 — Hạn phiên cho danh tính chưa có mã, phạm vi "người quen" và việc hoàn thiện RG-2/5/6 (12/11/2026)

**Trạng thái:** APPROVED (PO trả lời trực tiếp bằng `AskUserQuestion`, 12/11/2026). Nguồn: báo cáo rà an ninh của `wander-security-reviewer` cùng ngày (RG-2, RG-5, RG-6; độ tin cậy trung bình-thấp, chưa đọc thân test). Master plan không đổi.

## Quyết định
| Mã | Câu hỏi | Lựa chọn của PO | Hệ quả |
|---|---|---|---|
| SES-1 | Danh tính bỏ qua mã khôi phục mà chỉ có một máy sẽ mất chuyến vĩnh viễn khi phiên bị ép hết hạn ở 90 ngày | **Chỉ trượt khi chưa có mã** | Danh tính ĐÃ có mã: hạn trượt 14 ngày + trần tuyệt đối 90 ngày như DR-035 Q-a. Danh tính CHƯA có mã: chỉ hạn trượt 14 ngày, dùng đều thì không bao giờ tự mất (khớp DR-018 F1). Đã làm trong `IdentityModel.Session.isActive`; trần tuyệt đối chỉ truy vấn mã khi đã quá 90 ngày. Sửa hai dòng lỗi thời ở `decisions.md` (nói "không cài hết hạn"). Đổi một phần DR-035 Q-a. |
| RG5-1 | Số hop proxy cho giới hạn tốc độ | **Đo rồi đặt N** (thay Q-d "giữ 0" của DR-035 viết cho CloudFront/ALB) | **Hoãn**: PO định dùng AWS để học (nếu chuyển, hạ tầng là CloudFront→ALB, 2 hop theo ADR-006, nên đo Render là công cốc). Đo khi PO chốt nơi chạy. Cho tới lúc đó giữ 0 (an toàn, chung một thùng). |
| RG2-1 | Rủi ro B2 và F1, phạm vi phát hành | **Ghi DR + mô hình đe dọa** | B2 (kẻ cầm máy đang mở phiên phát mã đầu tiên khi danh tính chưa có mã) và F1 (phiên bị chiếm tự ghép máy rồi tự duyệt đổi mã) là **chấp nhận có điều kiện: chỉ người quen**. RG-2 vẫn MỞ cho "người lạ". Mô hình đe dọa 1 trang: `docs/security/threat-model-1a.md`. |
| RG-2/5/6 | Hướng chung | "Kiểm tra và làm hoàn thiện" (DR-038) | Danh sách việc ở mô hình đe dọa §6; RG-6 giữ cơ chế Bearer + `localStorage` (AD-1 chưa đổi). |

## Hỏi về AWS (PO, 12/11/2026): "tôi tính apply AWS để học, có đổi gì không?"
Không mâu thuẫn: DR-037 STR-1 cho phép AWS khi PO làm để học và đặt trần thời gian. Hệ quả: AD-17, AD-19, ADR-011, ADR-006 trở nên có ích để luyện; RG-5 đo sau khi chốt nơi chạy; keep-warm chỉ cần khi còn ở Render. Điều kiện còn thiếu (Tầng A): trần giờ và trần tiền do PO đặt, kiểu hạ tầng, và PO duyệt rõ trước khi tạo bất kỳ tài nguyên đám mây nào (`planning-safety.md` mục 5).

## Còn chờ PO
- Chốt nơi chạy (Render tiếp hay AWS để học) và trần giờ/tiền nếu AWS.
- Duyệt mô hình đe dọa (`docs/security/threat-model-1a.md`).
