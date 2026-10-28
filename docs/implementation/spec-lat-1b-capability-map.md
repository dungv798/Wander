# Lát 1b — Bản đồ khả năng (Phase 0, chờ PO duyệt) — 28/10/2026

> Trạng thái: **BẢN ĐỒ ĐÃ DUYỆT 28/10/2026 (DR-021)**; H1–H4 đã trả lời (xem `docs/decisions/DR-021-po-tra-loi-28-10-lat-1b.md`). Mô-đun `proposals` giữ mã nhưng chỉ còn **đề nghị xóa** (H2). Đặc tả mô-đun đầu: `SPEC-membership.md` (chờ duyệt).
> (Trạng thái cũ: ~~DỰ THẢO, chưa duyệt.~~) Theo `spec-driven-development`, đặc tả chi tiết từng mô-đun chỉ viết SAU khi PO duyệt bản đồ này. Chưa có dòng mã nào của 1b.
> Nguồn đã duyệt: `docs/decisions/DR-018` (Q6–Q9, Q12), kế hoạch gốc §14–§15 (R9–R11, D8, D10, D19), luồng F9–F11 ở `docs/ux/user-flows.md`. Mọi chỗ 🔶/❓ bên dưới KHÔNG phải quyết định.

## 1. Đã được PO duyệt (làm nền, không hỏi lại)
| Mã | Nội dung |
|---|---|
| Q6 | Hai vai: **Organizer** và **Thành viên** (không "chỉ xem") |
| Q7 | Liên kết mời: chỉ Organizer tạo, thu hồi được, hết hạn 7 ngày, bật lại = liên kết mới |
| Q8 | Sửa đồng thời: khóa lạc quan; người sau nhận 409 + "Tải bản mới nhất" (đã có ở lát 1a: `@Version` + `OPTIMISTIC_FORCE_INCREMENT`) |
| Q9 | Không dùng "chốt" ở 1a/1b; đề xuất bị từ chối thì người đề xuất thấy "Đã từ chối" (không lý do) |
| Q12 | Checklist chuẩn bị đi cùng 1b; tick riêng từng người; ai cũng thấy tiến độ chung; chỉ Organizer tạo hạng mục |
| D8 | Vào chuyến bằng liên kết + **tên hiển thị** |
| D10 / R9 | Hoàn thành việc cần làm tính **theo từng thành viên** (đã có bảng `item_completions(item_id, person_id)` từ lát 1a) |
| D19 | Xóa mềm + Hoàn tác; **quyền xóa/khôi phục trong chia sẻ xác định ở 1b** |
| R10 | Thành viên đề xuất, Organizer chấp nhận/từ chối; đề xuất chưa nằm trên lịch cho tới khi được chấp nhận |

## 2. Giả định tôi đang dùng (sửa ngay nếu sai)
1. Người được mời là **thành viên của chuyến**, không phải chủ của chuyến; chủ hiện tại của chuyến (`owner_identity_id`) trở thành Organizer duy nhất lúc đầu.
2. Thành viên có một **phiên** (token Bearer như chủ) để quay lại chuyến; mức bảo đảm của phiên đó là câu hỏi mở H1.
3. Mọi API chuyến đang hỏi "bạn có phải chủ không" (INV-6, 404 nếu không) sẽ đổi thành "bạn là thành viên với vai gì"; người ngoài vẫn thấy 404.
4. Không có tài khoản đầy đủ, không email/số điện thoại (D15/D20).
5. Chưa chia sẻ **công khai chỉ-đọc** (xuất bản lịch trình thuộc lát sau, không phải 1b).
6. Giao diện dựa trên prototype F9–F11 đã chụp ảnh ở DG-2, chỉnh theo câu trả lời bên dưới.

## 3. Bản đồ khả năng (mô-đun, hướng phụ thuộc, thứ tự làm)
| Mã mô-đun | Trách nhiệm | Phụ thuộc |
|---|---|---|
| `membership` | Thành viên, vai Organizer/Thành viên, liên kết mời (tạo, thu hồi, hết hạn 7 ngày, tên hiển thị), phiên của thành viên, rời chuyến/gỡ thành viên | `identity` (đã có) |
| `access` | Chính sách quyền theo vai áp lên MỌI API chuyến/mục hiện có (xem, sửa, xóa mềm, khôi phục, xóa chuyến); người ngoài vẫn 404 | `membership` |
| `completion` | Tick việc cần làm theo từng thành viên, tiến độ chung "Xong 1/2 người" | `access` |
| `proposals` | Đề xuất của thành viên (thêm mục / đề nghị xóa — tùy H2), hàng chờ duyệt, chấp nhận/từ chối, trạng thái "Đã từ chối" cho người đề xuất | `access` |
| `checklist` | Nhóm + hạng mục chuẩn bị (chỉ Organizer tạo), tick riêng từng người, tiến độ chung | `access`, `completion` |
| `collab-ui` | Màn F9 (mời), F10 (đề xuất/duyệt), F11 (tiến độ), huy hiệu "vừa thêm", làm mới khi người khác sửa | tất cả các mô-đun trên |

Thứ tự đề xuất: `membership` → `access` → `completion` → `proposals` → `checklist` → `collab-ui` (mỗi mô-đun là một lát dọc có backend + API + test, giao diện nối ngay sau từng mô-đun khi có thể, `collab-ui` là phần còn lại).

Mỗi mô-đun sẽ có `SPEC-<mã>.md` riêng sau khi bản đồ được duyệt. Ranh giới hợp đồng giữa mô-đun nằm ở đặc tả của mô-đun cung cấp (`access` định nghĩa cổng "vai của người này trong chuyến này" mà các mô-đun khác gọi).

## 4. Câu hỏi mở (Tầng A, cần PO trước khi viết đặc tả)
| Mã | Câu hỏi | Vì sao quan trọng | Phương án / khuyến nghị (không phải quyết định) |
|---|---|---|---|
| H1 | Thành viên có **danh tính ẩn danh đầy đủ** (có thể có mã khôi phục, nhiều thiết bị như chủ) hay chỉ **phiên khách** gắn với một chuyến? | Quyết định schema `identity`, bề mặt tấn công (RG-2/RG-7) và việc mất máy thì mất chỗ trong chuyến | A (khuyến nghị): thành viên dùng **cùng loại danh tính ẩn danh** (tái dùng toàn bộ cơ chế đã làm; một người có thể ở nhiều chuyến). B: phiên khách theo chuyến, mất máy là mất chỗ, Organizer mời lại |
| H2 | **Thành viên thêm mục thế nào?** Kế hoạch gốc R10: thành viên *đề xuất*, Organizer *chấp nhận* (mục chưa nằm trên lịch). Prototype F9–F11 đã chụp: thành viên **thêm trực tiếp**, chỉ **đề nghị xóa** mới chờ duyệt | Hai mô hình khác nhau hẳn về dữ liệu và giao diện; hiện tài liệu mâu thuẫn nhau | A (khuyến nghị): theo kế hoạch gốc, mọi **thêm** cũng phải qua đề xuất (khớp R10 và Q9); B: theo prototype (thêm trực tiếp, đề nghị xóa chờ duyệt); C: thêm trực tiếp vào "Chưa có ngày", xếp ngày/xóa phải qua Organizer |
| H3 | **Quyền xóa/khôi phục** của thành viên (D19 giao cho 1b): thành viên được xóa mềm mục do chính mình thêm không? Khôi phục mục của người khác? Xem "Đã xóa gần đây"? | D19 yêu cầu xác định rõ ở 1b | Khuyến nghị: thành viên xóa mềm + khôi phục **mục do mình thêm**; mọi xóa mục của người khác là đề nghị chờ Organizer; "Đã xóa gần đây" mọi thành viên xem được |
| H4 | **Nhiều Organizer / chuyển quyền** và **xóa chuyến**: chỉ một Organizer (chủ hiện tại) hay cho thăng thành viên lên Organizer? Ai xóa chuyến? | D25 yêu cầu xác thực lại trước khi chuyển quyền; ảnh hưởng mô hình sở hữu | Khuyến nghị 1b: **một Organizer = chủ chuyến**, không chuyển quyền, chỉ Organizer xóa chuyến; chuyển quyền để lát sau |
| H5 | Giới hạn: số thành viên tối đa mỗi chuyến, số liên kết mời đang bật cùng lúc, độ dài tên hiển thị | Cần số liệu cho hằng số và hạn mức | Tầng B nếu PO không ý kiến: tối đa 10 thành viên, 1 liên kết đang bật, tên ≤ 40 ký tự, chống trùng tên trong chuyến bằng hậu tố |

## 5. Việc kế tiếp sau khi PO duyệt bản đồ + trả lời H1–H5
1. Viết `SPEC-membership.md` (đầy đủ 6 mục của skill: mục tiêu, lệnh, cấu trúc, phong cách mã, chiến lược test, ranh giới) và dừng chờ duyệt.
2. `planning-and-task-breakdown` → cập nhật `docs/implementation/plan.md`, `todo.md`.
3. Làm từng mô-đun bằng `/wander-feature` (TDD, review bằng agent).
4. Cổng phát hành không đổi: **không phát hành cho người dùng thật khi RG-2/RG-5/RG-6/RG-7 còn mở**; chia sẻ làm tăng bề mặt tấn công nên cần `wander-security-reviewer` rà thiết kế `membership`/`access` trước khi viết mã.
