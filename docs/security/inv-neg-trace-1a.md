# Bảng truy vết INV/NEG → test (Lát 1a) — 12/11/2026

Nguồn định nghĩa: `docs/autopilot/q16-design-draft.md` mục INV (dòng 127–143) và NEG (dòng 146–165). Cột "Test" lấy từ tên `@DisplayName` và chú thích trong mã test đã đọc ngày 12/11/2026. **Đây là truy vết theo tên test, chưa phải bằng chứng rằng mỗi test chặt đủ**; kết quả chạy: 387 test, 0 lỗi (`.logs/backend-test-1112d.txt`, JUnit XML ở `backend/build/test-results/test`).

| Mã | Tình trạng | Test (lớp: tên rút gọn) |
|---|---|---|
| INV-1 | Có | `PlanningApiIT`: yêu cầu không có phiên hợp lệ bị từ chối; `SecurityIT` (kiểm kê route, theo báo cáo rà) |
| INV-2 | Một nửa | `PlanningApiIT`/`RecoveryApiIT`: phiên đã thu hồi mất quyền ở yêu cầu kế tiếp. **Thiếu:** yêu cầu gửi *trước* lúc thu hồi nhưng chưa ghi (kiểm quyền lại ngay lúc ghi) |
| INV-3, INV-4 | N/A 1a | Thuộc Lát 1b (member/link mời) |
| INV-5 | Có (mới 12/11) | `RecoveryApiIT`: INV-5/NEG-1 tên chuyến, điểm đến, ngày đi bị từ chối như mã sai |
| INV-6 | Có | `RecoveryApiIT`: mã sai/không tồn tại/đã dùng cùng HTTP 400 `INVALID_CODE`; mọi lý do từ chối cho cùng phản hồi |
| INV-7 | Có | `RecoveryApiIT`: mã cũ không dùng lại được; hai lần thử cùng mã chỉ một commit; `RecoveryConcurrencyIT` (race thật) |
| INV-8, INV-9 | N/A 1a | Chuyển giao chủ và xóa vĩnh viễn cả chuyến chưa có (Q17b OPEN) |
| INV-10 | Có | `RecoveryApiIT`: khôi phục mở dữ liệu trên máy mới, phiên cũ không bị thu hồi |
| INV-11 | Một phần | Nguyên tử của commit khôi phục: kiểm qua `RecoveryConcurrencyIT` và các test hai pha; chưa có test riêng bơm lỗi giữa commit (UNVERIFIED) |
| INV-12 | Có | `RecoveryApiIT`: gửi lại sau commit là idempotent |
| INV-13 | Có | `RecoveryApiIT`: tái tạo mã hai pha, mã cũ chỉ vô hiệu khi mã mới xác nhận; có ràng buộc mức DB |
| INV-14 | Có | `RecoveryApiIT`: tái tạo mã bị từ chối nếu không xác thực lại; step-up dùng một lần (`SecurityIT`/`PairingMatchApiIT`, theo báo cáo rà) |
| INV-15 | Có | `RecoveryApiIT`: phiên đang chờ không truy cập được gì |
| INV-16 | Có | `RecoveryApiIT`: mã thay thế chưa xác nhận không được chấp nhận |
| INV-17 | Có | `RecoveryApiIT`: tạo thêm chuyến không đổi mã; bỏ qua mã khi tạo danh tính |
| NEG-1 | Có (mới 12/11) | (= INV-5) |
| NEG-2 | Một nửa | (= INV-2) |
| NEG-3, NEG-4 | N/A 1a | 1b |
| NEG-5 | Có (chưa đọc thân) | `RateLimitIT`, `IdentityApprovalRateLimitIT`, `ApprovalQuotaIT`, `LinkPollRateLimitIT`, `ApiWriteLimitIT`; phản hồi không phân biệt theo INV-6 |
| NEG-6 | Có | `RecoveryApiIT`: dùng lại mã đã vô hiệu; bắt đầu tái tạo lại thì mã chờ trước bị vô hiệu |
| NEG-7, NEG-8, NEG-9 | N/A / OPEN | Chuyển giao, xóa cả chuyến chưa có; NEG-9 (hai thiết bị sửa cùng mục) chưa quyết |
| NEG-10 | Có | `RecoveryApiIT` + `RecoveryConcurrencyIT` |
| NEG-11 | Có | `RecoveryApiIT`: idempotent sau commit |
| NEG-12 | Có | `RecoveryApiIT`: phiên chiếm được tái tạo mã không xác thực lại bị từ chối |
| NEG-13 | Có | `RecoveryApiIT`: không hoàn tất nếu không xác nhận đúng mã thay thế; thất bại không mất mã cũ |
| NEG-14 | Có | `RecoveryApiIT` (KP-C): sau khôi phục có 2 phiên, đúng 1 là hiện tại. *Báo cáo rà trước đó ghi nhầm là thiếu* |
| NEG-15 | Có | `TripSoftDeleteApiIT`: xóa mềm cả chuyến bằng phiên thường thành công (204), không cần xác thực lại; xóa mục: `PlanningApiIT` (UNVERIFIED tên test) |
| NEG-16 | Có | `RecoveryApiIT`: phiên chờ bị từ chối |
| NEG-17 | Có | `RecoveryApiIT` |
| NEG-18 | Một phần | Nửa "mã không đổi khi tạo chuyến" có (INV-17); nửa "mã danh tính không dùng được cho Member" thuộc 1b |
| NEG-19 | Có | `RecoveryApiIT` (MĐ-2): ghi lại hành vi phát hành mã lần đầu bằng phiên hợp lệ (rủi ro B2 đã chấp nhận, DR-039) |
| NEG-20 | N/A 1a | Cần xóa cả chuyến (chưa có) |

**Còn thiếu:** INV-2/NEG-2 nửa sau (yêu cầu gửi trước lúc thu hồi nhưng ghi sau): cần dựng yêu cầu chậm giữa kiểm quyền và ghi, khó hơn; INV-11 test bơm lỗi giữa commit.
**Khác với báo cáo rà ngày 12/11:** NEG-14 đã có test; NEG-20 và INV-8/9 là N/A ở 1a (chưa có xóa cả chuyến) chứ không phải thiếu.
