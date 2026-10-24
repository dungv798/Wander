# Consolidate — Q16 thiết kế xác thực và khôi phục quyền chủ chuyến

## 1. Phạm vi và nguồn
Kế hoạch `docs/wander-master-plan.md` v0.3. Đã đọc §15.1, §15.6 và các mục khớp Grep (xem `stages/scope.md`). Agent đã dùng: security-reviewer, software-architect, skeptic-qa (1 vòng song song, vòng 2 bị skip). Không dùng product-analyst vì ranh giới 1a/1b không bị tranh chấp (`stages/route.md`).

## 2. Đồng thuận (agreement ≠ correctness)
- D15, D8, D14, D19 `APPROVED`; cơ chế Q16 `OPEN`; Q6, Q7, Q17 `OPEN`.
- Tiêu chí A-0 "người không có bằng chứng không giành được quyền" là `INFERENCE`; G7 `UNVERIFIED`.
- Kênh liên hệ (email/số điện thoại) giúp khôi phục nhưng thu dữ liệu cá nhân (§12) và làm mờ ranh giới "tài khoản đầy đủ" (D14/D15).
- Câu hỏi chung cho người dùng: chấp nhận mất chuyến khi mất mọi cách khôi phục (Q16 câu 2) hay không.

## 3. Bất đồng được giữ nguyên
- Kênh liên hệ có vi phạm D8/D14 không: skeptic `INFERENCE` — không phải `CONTRADICTION`, chỉ mơ hồ vì plan chưa định nghĩa "tài khoản đầy đủ"; architect/security: "có thể va" D14/D8. Không bên nào có bằng chứng để phán. Giải quyết bằng định nghĩa của người dùng. Vòng 2: không chạy.
- Lưu ý nguồn: architect cảnh báo mô hình "chủ là người dùng ngầm định duy nhất" qua §15.0. Cụm đó nằm ở cột đề xuất cũ của hàng Q1 (🔁, đã bị D15 thay thế), không phải quyết định. Rủi ro làm lại ở 1b vẫn là `INFERENCE` của architect.

## 4. Khoảng trống bằng chứng
- `UNVERIFIED`: G7; thời hạn phiên phù hợp; mô hình đe dọa; quy định pháp lý về dữ liệu cá nhân; ước tính §13.1 cho xác thực/khôi phục.
- `cite-check`: 6 file (scope, route, 3 báo cáo, reconcile) không bị đánh dấu. Số dòng trong báo cáo security do agent tự ghi, tôi chưa kiểm lại.

## 5. Phương án và đánh đổi (tất cả `PROPOSED`; Q16 vẫn `OPEN`)
Tổng hợp từ architect (A/B/C) và security (X/Y); mức khái niệm, không gắn công nghệ.

**Câu 1, 3, 2 — bằng chứng quyền, mở thiết bị khác, mất mọi cách khôi phục**
| Phương án | Ưu | Nhược / rủi ro | Khóa | Đảo ngược |
|---|---|---|---|---|
| A. Mã/link bí mật do chủ giữ (kèm mã khôi phục tự lưu) | Không thu dữ liệu cá nhân; đơn giản, dễ test | Mất mã + mất thiết bị = mất chuyến; ai có mã là chủ | Mô hình "ai giữ mã là chủ" | Trung bình |
| B. Kênh liên hệ đã xác minh | Khôi phục được khi mất thiết bị | Thu dữ liệu cá nhân; kênh bị chiếm (SIM, hộp thư) thành đường chiếm quyền; có thể va D14/D8 tùy định nghĩa | Có định danh thật trong dữ liệu | Khó |
| C. Thiết bị tin cậy duyệt thiết bị mới | Không thu dữ liệu cá nhân | Mất hết thiết bị = mất quyền trừ khi có mã dự phòng | Phụ thuộc thiết bị đã đăng nhập | Dễ |
| Lai (ví dụ A+B hoặc C+A) | Ít mất dữ liệu hơn | Bề mặt tấn công lớn hơn | Tùy thành phần | Tùy thành phần |

**Câu 4 — phiên:** dài, thu hồi thủ công (tiện, nhưng máy mất vẫn dùng được) hoặc có hạn, gia hạn khi dùng (an toàn hơn, có thể gây phiền giữa chuyến). Cả hai dễ đổi sau nếu phiên là thực thể riêng, thu hồi được (architect, `PROPOSED`).
**Câu 7 — chuyển giao:** không chuyển giao ở 1a (đơn giản, thêm sau phải migrate) hoặc chuyển giao tường minh bằng mã dùng một lần (tốn trạng thái, mở đường 1b). Cần Q6.
**Câu 8 — Member ở 1b:** bằng chứng riêng cho từng Member, Organizer chỉ là một vai trò (migration thấp) hoặc tên hiển thị gắn link chung (đơn giản, không phân biệt người, không thu hồi từng người). Cần Q6, Q7.
**Câu 5, 6 — lộ link/mã, lạm dụng:** security đề xuất (`PROPOSED`) tách bằng chứng quyền chủ khỏi link mời/xem, mã đủ ngẫu nhiên, giới hạn tần suất, thu hồi link có hiệu lực ngay (Q7), hủy phiên cũ sau khôi phục.

## 6. Rủi ro chính (theo mức độ, theo kịch bản)
1. **Cao** — Chủ chuyến mất điện thoại giữa chuyến (ví dụ ngày 3 ở Đà Nẵng), chưa thiết lập khôi phục → mất lịch trình đang dùng (Q16 câu 2).
2. **Cao** — Kẻ chiếm quyền (mã lộ, kênh khôi phục bị chiếm hoặc máy bị trộm còn phiên) lấy chuyến, rồi xóa vĩnh viễn; không có lịch sử chỉnh sửa (D19) nên không phục hồi (Q17c `OPEN`).
3. **Trung bình–Cao** — Mục đã xóa mềm giữ vô thời hạn (R7) nằm trong phạm vi lộ khi link/mã lộ (§12).
4. **Trung bình** — Hai thiết bị của chính chủ ghi đè nhau ở 1a (không có lịch sử chỉnh sửa; Q8 chỉ ở 1b) — chỉ skeptic nêu.
5. **Trung bình** — Liệt kê/đoán mã chuyến, DoS khóa chủ thật nếu giới hạn tần suất làm kém.
6. **Trung bình** — 1b: Member mạo danh bằng tên hiển thị (D8) khi quay lại thiết bị khác.
7. **Trung bình** — Ước tính §13.1 (nhóm 3: 15–40 giờ; nhóm 7: 14–28 giờ) có thể thiếu khối lượng cho phiên, giới hạn tần suất, chuyển giao (`UNVERIFIED`, chính plan ghi độ tin cậy thấp).

## 7. Cần bạn phê duyệt
| ID | Câu hỏi | Khóa gì | Đảo ngược | Khuyến nghị (không phải quyết định) |
|---|---|---|---|---|
| Q16 | Chọn cơ chế bằng chứng quyền + khôi phục (A/B/C/lai), phiên, chuyển giao, mô hình Member | Mô hình danh tính toàn bộ 1a, nền của 1b | Từ trung bình đến khó (B khó nhất) | Xem DRAFT-1 |
| Q16-ngưỡng | "Tài khoản đầy đủ" ở D14/D15 nghĩa là gì; kênh liên hệ có tính là tài khoản không | Cho phép hay loại phương án B | Dễ (là định nghĩa) | Làm rõ trước khi chọn |
| Q16-2 | Mất mọi cách khôi phục có chấp nhận mất chuyến không | Có cần đường dự phòng và rủi ro đi kèm | Trung bình | Người dùng quyết |
| Q17c | Ai được xóa vĩnh viễn ở 1a, có cần xác thực lại không | Hậu quả khi bị chiếm quyền | Trung bình | Chốt khi review spec (plan §15.6) |
| 1a-2dev | Hai thiết bị của chủ có sửa cùng lúc được không ở 1a | Phạm vi 1a | Dễ | Người dùng quyết |
| G7 | Xác nhận hoặc bác bỏ giả định thiết kế an toàn không cần tài khoản đầy đủ | Toàn bộ hướng Q16 | — | Kiểm chứng qua bản thiết kế được duyệt |

**DRAFT-1 (`PROPOSED`, khuyến nghị, không phải quyết định):** trước khi chọn A/B/C, viết tài liệu thiết kế ngắn (mất thiết bị, mất mã, bị chiếm quyền) theo §15.1, dựa trên mô hình khái niệm "danh tính + bằng chứng quyền + phiên thu hồi được + quan hệ sở hữu là dữ liệu" để các lựa chọn A/B/C, phiên và chuyển giao đều thay thế được sau (architect). Đi kèm các yêu cầu phi chức năng của security. Phương án cụ thể do bạn chọn sau khi trả lời các câu hỏi ở trên. Invariant cần kiểm thử: không có bằng chứng thì không thao tác quyền chủ; phiên đã thu hồi thì không dùng được nữa; chuyển giao làm chủ cũ mất quyền; Member không nâng lên Organizer; bằng chứng hết hạn bị từ chối.

## 8. Ranh giới
Không có file, kế hoạch hay quyết định nào bị thay đổi ngoài `docs/autopilot/`. Chỉ bạn mới có thể phê duyệt. Run này không đóng blocker §15.6 mục 1 (Q16 cần bạn duyệt).

Token note: 3 agent, 1 vòng.
