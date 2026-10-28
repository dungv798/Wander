# SPEC-membership — Lát 1b, mô-đun 1/6 (DỰ THẢO, chờ PO duyệt) — 28/10/2026

> Mô-đun: `membership` (xem `spec-lat-1b-capability-map.md`, đã duyệt; quyết định nền ở `docs/decisions/DR-021`). Chưa có mã. Theo skill, sau khi PO duyệt đặc tả này mới lập kế hoạch/tác vụ và viết mã.

## Giả định (sửa ngay nếu sai)
1. `membership` nằm trong module **planning** (dữ liệu thuộc chuyến), tham chiếu `identity_id` (UUID từ `AuthenticatedPrincipal`) mà không import mô-đun `identity` (ArchUnit ARC giữ nguyên).
2. Người được mời tạo danh tính ẩn danh bằng `POST /api/identity` ĐÃ CÓ (H1), rồi dùng liên kết để vào chuyến; không cần thay đổi `identity`.
3. Chủ chuyến hiện có là **Organizer** của chuyến đó; dữ liệu cũ được di chuyển bằng migration (mọi chuyến hiện có có đúng một dòng thành viên Organizer).
4. Mô-đun này CHƯA đổi quyền của các API chuyến/mục hiện có (đó là `access`): sau `membership`, thành viên đã vào chuyến nhưng CHƯA xem được lịch cho tới khi `access` xong. Hai mô-đun được phát hành cùng nhau (không bật tính năng mời cho người dùng khi `access` chưa xong).
5. Liên kết mời có dạng `…/#/join/<mã>`; mã 256 bit ngẫu nhiên, máy chủ chỉ giữ **băm** (HMAC với pepper như mã khôi phục).

## 1. Mục tiêu
Organizer mời người đi cùng bằng một **liên kết** (Q7: chỉ Organizer tạo, thu hồi được, hết hạn 7 ngày, bật lại = liên kết mới). Người nhận mở liên kết, đặt **tên hiển thị** (D8), trở thành **Thành viên** của chuyến (Q6: hai vai Organizer/Thành viên). Organizer xem và gỡ thành viên; thành viên có thể rời chuyến.
Thành công = một người lạ, chỉ với liên kết còn hạn và tên hiển thị, vào được chuyến với vai Thành viên; không ai khác vào được; Organizer kiểm soát được liên kết và danh sách thành viên.

## 2. Hành vi và API (hợp đồng)
| Hành vi | API | Ai | Kết quả / lỗi |
|---|---|---|---|
| Tạo liên kết mời | `POST /api/trips/{id}/invites` | Organizer | 201 `{invite:{id, url, expiresAt}}` — **mã chỉ hiện đúng một lần**; tạo mới tự thu hồi liên kết đang bật (chỉ 1 liên kết bật, H5) |
| Xem trạng thái liên kết | `GET /api/trips/{id}/invites` | Organizer | `{invite:{id, createdAt, expiresAt, active}}` hoặc `{invite:null}`; KHÔNG trả lại mã |
| Thu hồi liên kết | `DELETE /api/trips/{id}/invites/active` | Organizer | 204; thu hồi lần hai ⇒ 404 |
| Xem trước liên kết | `POST /api/invites/preview` `{code}` | công khai (hạn mức) | `{trip:{name, memberCount}}`; mã sai/hết hạn/thu hồi/chuyến đã xóa ⇒ **một lỗi chung** `INVALID_INVITE` (không lộ loại) |
| Vào chuyến | `POST /api/invites/join` `{code, displayName}` | người có phiên | 201 `{member}`; đã là thành viên ⇒ 200 trả lại thành viên (idempotent); đầy 10 người ⇒ 409 `TRIP_FULL`; tên sai dạng ⇒ 400 |
| Danh sách thành viên | `GET /api/trips/{id}/members` | mọi thành viên | `{members:[{id, displayName, role, joinedAt, self}]}`; người ngoài 404 |
| Gỡ thành viên | `DELETE /api/trips/{id}/members/{memberId}` | Organizer | 204; không gỡ được chính Organizer |
| Rời chuyến | `DELETE /api/trips/{id}/members/me` | Thành viên | 204; Organizer không rời được (phải xóa chuyến) ⇒ 409 `ORGANIZER_CANNOT_LEAVE` |
| Đổi tên hiển thị | `PATCH /api/trips/{id}/members/me` `{displayName}` | thành viên | 200 |

**Quy tắc bất biến:** (a) mỗi chuyến đúng một Organizer; (b) tên hiển thị duy nhất trong chuyến (trùng thì thêm hậu tố ` - 2` như tên chuyến, DR-006); (c) tối đa 10 thành viên kể cả Organizer; (d) liên kết hết hạn sau 7 ngày kể từ lúc tạo; (e) chuyến đã xóa mềm không nhận thành viên mới và xem trước liên kết báo `INVALID_INVITE`; (f) người đã bị gỡ vào lại được bằng một liên kết MỚI (không giữ lịch sử).

## 3. Mô hình dữ liệu (migration V13+, không sửa migration cũ)
- `trip_members(id uuid pk, trip_id fk, identity_id uuid, role varchar CHECK in ('organizer','member'), display_name varchar(40), joined_at, UNIQUE(trip_id, identity_id), UNIQUE(trip_id, lower(display_name)), UNIQUE partial (trip_id) WHERE role='organizer')`.
- `trip_invites(id uuid pk, trip_id fk, code_hash varchar, created_by uuid, created_at, expires_at, revoked_at null, UNIQUE partial (trip_id) WHERE revoked_at IS NULL)` — ràng buộc một liên kết đang bật ở mức CSDL.
- Migration dữ liệu: mỗi chuyến hiện có được thêm một dòng `trip_members` vai `organizer` cho `owner_identity_id` (tên hiển thị mặc định "Organizer").
- Aggregate: `Trip` giữ danh sách thành viên và liên kết (bất biến (a)–(f) nằm trong domain); `ownerId` hiện có tiếp tục là Organizer.

## 4. Cấu trúc mã
```
backend/src/main/java/com/wander/planning/
  domain/model/        TripMember, TripInvite (+ Trip: thêm/bớt thành viên, tạo/thu hồi liên kết)
  domain/port/         MembershipRepository (hoặc mở rộng TripRepository), InviteCodeHasher
  application/command/ MembershipCommandHandler (+ MembershipCommands records)
  application/query/   MembershipQueries (+ MemberRow)
  api/controller/      MembershipController, InviteController (công khai preview)
  infrastructure/      JPA entity/mapper/adapter + HmacInviteCodeHasher (tái dùng pepper)
backend/src/main/resources/db/migration/V13__trip_members_invites.sql
web/src/features/membership/  (giao diện F9: mời, danh sách, thu hồi; màn /#/join) — tách thành lát giao diện sau backend
```

## 5. Phong cách mã (theo `docs/architecture/backend-conventions.md`)
Mọi method có Javadoc tiếng Việt; không chuỗi/số ma thuật (hằng ở `MembershipConstants/Messages/ErrorCodes/Fields`); lỗi là `WanderException(kind, code, field)`, mã lỗi mới: `INVALID_INVITE`, `TRIP_FULL`, `ORGANIZER_CANNOT_LEAVE`, `INVALID_DISPLAY_NAME`. Tên hiển thị dùng lại quy tắc tên thiết bị (NFC, cấm ký tự điều khiển, ≤ 40 điểm mã).

## 6. Chiến lược test
- Domain (không Spring): bất biến (a)–(f), hết hạn, đầy 10, tên trùng, không rời/gỡ Organizer.
- `*IT` (Testcontainers): đủ luồng tạo → xem trước → vào → danh sách → gỡ/rời; **mọi thứ của người ngoài ⇒ 404**; mã sai/hết hạn/thu hồi cùng một lỗi chung; tạo hai liên kết đồng thời chỉ một đang bật; vào đồng thời khi còn 1 chỗ chỉ một người thắng; rò rỉ: phản hồi không bao giờ chứa mã/băm ngoài lần tạo.
- Bảo mật: hạn mức cho `preview`/`join` (theo IP và theo phiên); `wander-security-reviewer` rà thiết kế TRƯỚC khi viết mã.
- ArchUnit, Checkstyle, JaCoCo như hiện nay. e2e web thêm khi có giao diện.

## 7. Ranh giới
- **Luôn:** băm mã mời, một lỗi chung cho mã không hợp lệ, kiểm quyền Organizer trong domain/handler (không tin FE), cập nhật `docs/ux/error-codes.md`.
- **Hỏi trước:** thêm phụ thuộc mới, đổi migration đã áp dụng, đổi số tối đa thành viên/hạn liên kết, bất kỳ chia sẻ công khai chỉ-đọc.
- **Không bao giờ:** lưu mã mời dạng đọc được, cho thành viên tạo liên kết (Q7), chuyển quyền Organizer ở 1b (H4), sửa kế hoạch gốc.

## 8. Tiêu chí thành công
1. Người lạ có liên kết còn hạn + tên hợp lệ vào được và thấy mình ở danh sách thành viên với vai Thành viên.
2. Liên kết hết hạn/thu hồi/chuyến đã xóa/mã bịa ⇒ cùng một lỗi `INVALID_INVITE`, không phân biệt được loại.
3. Không thể có 11 thành viên, hai Organizer, hai liên kết đang bật hay hai tên trùng, kể cả khi gọi đồng thời (kiểm ở CSDL).
4. Organizer gỡ được thành viên; thành viên rời được; Organizer không rời được.
5. Người ngoài (không phải thành viên) nhận 404 trên mọi API của mô-đun; thành viên không tạo/thu hồi liên kết, không gỡ ai.
6. `gradlew check` xanh (ArchUnit, Checkstyle, JaCoCo), migration trên dữ liệu có sẵn không mất chuyến nào.

## 9. Câu hỏi mở cho PO (chặn việc lập kế hoạch)
- M1 (Tầng A): Organizer có **thấy ai đang giữ liên kết** hay chỉ thấy số thành viên? Khuyến nghị: chỉ danh sách thành viên đã vào, không theo dõi lượt xem.
- M2 (Tầng A): Thành viên bị gỡ có được **thông báo** lần sau mở chuyến ("Bạn không còn trong chuyến") hay chuyến biến mất im lặng (404)? Khuyến nghị: thông báo rõ một lần.
- M3 (Tầng B, mặc định nếu không ý kiến): liên kết dài/URL dùng `#/join/<mã>`; "Tên hiển thị" của Organizer lấy từ tên thiết bị lúc đầu, sửa được.
