# DR-001 — Thiết kế xác thực và khôi phục quyền chủ chuyến (Q16)

- **Trạng thái:** `APPROVED` — PO chọn "Duyệt nguyên bản nháp" ngày 24/10/2026 (phiên `/wander-council`, câu hỏi Q16; khuyến nghị của product-analyst là duyệt kèm xem MĐ-1/OQ-4, PO chọn duyệt nguyên bản).
- **Liên quan:** D15, D20–D26; QĐ-1…QĐ-6 và MĐ-1…MĐ-8 trong `docs/autopilot/q16-design-draft.md`; gate RG-1; ADR-005.
- **Plan:** master plan v0.4 **không đổi** (vẫn ghi Q16 ❓). DR này là nguồn quyết định cho đến khi PO tự áp dụng `docs/autopilot/plan-patch-q16.md` hoặc bảo sửa plan.

## Quyết định
Bản thiết kế `docs/autopilot/q16-design-draft.md` được duyệt nguyên văn, gồm:
- **QĐ-1…QĐ-6** (PO đã xác nhận trước đó, nay nằm trong bản duyệt): bằng chứng 1a = mã khôi phục tự giữ + thiết bị tin cậy duyệt thiết bị mới; không email/điện thoại; một danh tính nhiều chuyến một mã; mã dùng một lần, tái tạo cần phiên hợp lệ, khôi phục không tự thu hồi phiên khác; xác thực lại trước xóa vĩnh viễn cả chuyến/tái tạo mã/chuyển giao (nếu thao tác tồn tại); hiện mã một lần, cho phép bỏ qua kèm cảnh báo; khôi phục chỉ xong khi mã thay thế được xác nhận.
- **MĐ-1…MĐ-8** (trước đây `PROPOSED`): xác thực lại bằng thiết bị tin cậy khác hoặc mã khôi phục, một bằng chứng cho một thao tác, không có cửa sổ "vừa xác thực" (MĐ-1); phát hành mã lần đầu chỉ cần phiên hợp lệ kèm cảnh báo (MĐ-2); mã thay thế chỉ cho khôi phục bằng mã (MĐ-3); xác nhận = nhập lại mã (MĐ-4); nhiều lần thử đồng thời không giữ chỗ, commit đầu thắng (MĐ-5); lần thử lặp lại idempotent, mã thay thế chưa xác nhận không bao giờ hợp lệ (MĐ-6); phiên chờ chưa truy cập dữ liệu (MĐ-7); mã tự chứa thông tin tìm danh tính, giới hạn tần suất theo nguồn/toàn cục, không khóa theo danh tính (MĐ-8).
- Các chi tiết đảo ngược được; sửa sau bằng một DR mới.

## Còn hoãn (không chặn việc duyệt, theo mục 9 của bản nháp)
TTL/idle timeout của phiên (Q16 câu 4, Tier B ở spec), con số giới hạn tần suất và thời hạn lần thử chờ, chuyển giao quyền chủ (mặc định không thuộc 1a), Member (Q6, Q7), OQ-1 (giữ dữ liệu chuyến mất quyền; quyết trước RG-5), OQ-2 (câu chữ cảnh báo), độ dài/entropy mã khôi phục (băm SHA-256 không muối chỉ an toàn nếu mã đủ ngẫu nhiên; gác lại ở `open-decisions.md`).

## Hệ quả
- **RG-1 đóng về mặt thiết kế.** Không có nghĩa là được phát hành: **G7 vẫn `UNVERIFIED` (RG-2)**, cần mô hình đe dọa, tiêu chí "an toàn" đo được, test INV/NEG có kết quả và kiểm tra với người dùng thật; RG-5, RG-6, RG-7 vẫn mở.
- **ADR-005 (Spring Security + Bearer) được phép thực hiện** qua `/wander-feature`.
- Code hiện có (RecoveryService, DeviceLinkService…) đã được viết theo bản nháp; cần đối chiếu INV-1…INV-17 và NEG-1…NEG-20 với test (việc của `/wander-review`/`/wander-feature`, chưa làm).
- Việc cần PO: áp `docs/autopilot/plan-patch-q16.md` vào plan nếu muốn plan phản ánh quyết định này (plan không bị sửa bởi agent).
