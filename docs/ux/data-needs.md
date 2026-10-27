# Ánh xạ thiết kế → dữ liệu và API (DG-1 mục 6)

> Viết 25/10/2026 tối từ: prototype `docs/ux/prototype/app/app.js` (hành vi), backend thật `backend/src/main/java/com/wander/**` và `backend/src/main/resources/db/migration/V1–V3` (đã đọc), `docs/decisions/DR-001…DR-009`. Đây là **danh sách thay đổi backend làm SAU khi PO duyệt DG-1** (cổng `.claude/rules/design-first.md`): chưa làm gì ở backend. Nhãn: **Đủ** (backend đã có, khớp) · **Thiếu** (cần thêm) · **Lệch** (có nhưng khác prototype/quyết định; nêu cần sửa bên nào) · **T-A** (cần PO quyết) · **T-B** (mặc định tự chọn, ghi `decisions.md` khi làm). Mọi số dòng/hành vi chưa đọc trong nguồn ghi `UNVERIFIED`.

## 1. Bảng ánh xạ theo màn

> **Phạm vi:** các dòng ghi "(1b)" hoặc "BẢN THỬ 1b" và dòng quản trị KHÔNG thuộc danh sách backend Lát 1a; các dòng còn lại thuộc 1a trừ khi ghi khác.

| Màn / hành vi (prototype) | Dữ liệu cần | Backend hiện có | Trạng thái |
|---|---|---|---|
| S1–S4 Khám phá, cẩm nang, thẻ, chi tiết địa điểm | điểm đến (tên, ảnh bìa, tagline), địa điểm (loại, khu vực, mô tả ngắn, tháng đẹp, thời lượng, độ khó, điểm nổi bật, nhãn biên tập + lý do, buổi nên đi + lý do, mẹo, tọa độ, ảnh + tác giả + giấy phép + nguồn), cẩm nang (các khối) | `GET /api/catalog/destinations`, `/{id}` (module `catalog`, đọc từ `ha-giang.json`) | **Đủ** về dữ liệu. **Lệch**: route đang cần phiên; DR-008 Q-a: mở công khai + giới hạn tốc độ theo IP (cần test route công khai + rà an ninh) → **T-A đã duyệt, chưa làm** |
| S1 tìm điểm đến, "Sắp ra mắt" | danh sách điểm đến khác | chỉ có Hà Giang | **Thiếu** nội dung (không phải mã); T-B |
| S3 quẹt chọn, Đã chọn (S5) | lựa chọn lưu trên thiết bị, chưa có danh tính | không cần backend | **Đủ** (client). Khi có danh tính, "Đã chọn" chỉ nằm ở thiết bị; T-B |
| S6–S7 Tạo chuyến | tên (≤ 120), điểm đến, ngày đi/về (≤ 366 ngày), kiểu chuyến (≤ 5 mã), nhịp, ngân sách (0..1.000.000.000 nghìn, trống = chưa đặt) | `POST /api/trips`, `PATCH`, cột V3 `budget_k/styles/pace` | **Đủ** |
| "Dự kiến N ngày" (DR-008 Q-b) | cờ ngày tạm trên chuyến | không có | **Thiếu**: cột `dates_tentative boolean` + API + hiển thị "chưa chắc"; **T-A** nếu đổi nghĩa R1/R5 (thứ trong tuần của ngày tạm) |
| Tên chuyến trùng → hậu tố " - 2" (DR-006) | quy tắc đặt tên | không thấy ở server (`UNVERIFIED` ở client `web/`) | **Thiếu/chưa rõ**: nên là quy tắc server (T-B) |
| Sửa ngày chuyến, mục bị cắt về "Chưa có ngày" + Hoàn tác | mục có thể không thuộc ngày nào | `items.day_date NOT NULL`; `Trip.update` KHÔNG cho đổi nếu còn mục (kể cả đã xóa mềm) ngoài khoảng mới (R12) | **Lệch lớn**, **T-A**: (a) giữ R12 chặn đổi; (b) đưa mục ra "Chưa xếp ngày" kèm cảnh báo (prototype, hợp DR-006) — cần migration `day_date` nullable + đổi quy tắc domain + test |
| Mục "Chưa có ngày" (DR-006) | `day_date` null; cách tính tổng/“chưa biết giá” cho mục chưa xếp | không có | **Thiếu** (cùng migration trên); **T-A đã duyệt hướng ở DR-006**, Tầng A về schema |
| Địa điểm trong chuyến gắn với kho (ảnh, khoảng cách ước tính, bản đồ, “Xếp giúp tôi”) | `place_id` (nullable) trỏ địa điểm trong kho; `type` suy ra từ loại địa điểm khi thêm | `items` chỉ có `type`, `title`, không có liên kết kho | **Thiếu**: cột `place_id`, truy vấn chi tiết trả kèm tên/ảnh/tọa độ (hoặc client ghép từ kho); ánh xạ loại kho → `ItemType` (cảnh/văn hóa/leo → Tham quan, ẩm thực → Ăn uống, lưu trú → Lưu trú, chợ → Mua sắm, T-B) |
| Xếp tay một chạm / chọn nhiều / “Xếp giúp tôi” + Hoàn tác | gán ngày + thứ tự hàng loạt, nguyên tử | `PATCH items/{id}` từng mục; `POST days/{day}/reorder` (`orderedIds`) | **Lệch**: cần endpoint gán hàng loạt (một lần ghi, một phiên bản, trả `409` khi xung đột ADR-003) và cách Hoàn tác (gửi lại trạng thái cũ cùng phiên bản) — T-B. Khoảng cách/gợi ý tính ở client từ tọa độ kho (đường chim bay × 1,5 ÷ 25 km/h, luôn “ước tính”) |
| Mục tự do / Nghỉ / Việc cần làm | `type` (9 loại), `title` ≤ 200, giờ, thời lượng 0..10080, ghi chú ≤ 2000 | `POST items`, `PATCH`; CHECK schema V1 | **Đủ** |
| Chi phí (nghìn đồng; trống/0/đã bao gồm + tham khảo) | `cost_k`, `included`, `reference_k` (CHECK: tham khảo chỉ khi đã bao gồm), `countedK` | V1 + `CostInfo` | **Đủ** (khớp D17/D18, R2–R4). Prototype giữ `cost` khi tick "đã bao gồm" đúng như `CostInfo` |
| Tổng theo ngày/loại, ngân sách và phần vượt, “chưa biết giá” | `Totals.byDay/byType`, `Budget{extra, unknownCount, over, gap}` | `TripDetail.totals`, `budget` | **Đủ**. Prototype tự tính lại ở client; sản phẩm thật dùng số của server |
| Đặt chỗ 2 trạng thái | `booking_status` null/pending/booked (Nghỉ, Việc cần làm: null) | V2, `BookingStatus` | **Đủ** (khớp DR-003). Prototype chỉ hiện chip “Đã đặt”, đếm “Đã đặt x/y mục có đặt chỗ” — số đếm tính ở client (T-B) |
| Việc cần làm: đánh dấu xong theo từng người | `item_completions(item_id, person_id)` | `PUT items/{id}/done` | **Đủ** (người = danh tính; 1b sẽ có thành viên) |
| Sắp xếp thủ công | `position` theo ngày | `POST days/{day}/reorder` | **Đủ** |
| Xóa mềm, “Đã xóa gần đây”, khôi phục | `deleted_at`, danh sách, `trashCount`, restore | `DELETE items/{id}`, `POST …/restore`, `GET /trash`, `trashCount` | **Đủ** cơ bản. **Thiếu**: khôi phục mục có ngày cũ không còn → về "Chưa có ngày" (A1 = (b), DR-011; cần `day_date` nullable). **Không** cần job 30 ngày / `expiresAt` (A2 = (b), DR-011) |
| Xóa vĩnh viễn từng mục (DR-011 B1: **không** xác thực lại) | chỉ phiên chủ chuyến | `DELETE …/permanent`; `STEP_UP_OPERATIONS = {"regenerate_code"}` | **Đủ**: không thêm `purge_item` vào step-up. Có thể thêm `delete_trip` khi làm xóa cả chuyến (DR-004) |
| Xác thực lại bằng thiết bị tin cậy khác | yêu cầu → mã duyệt `XXXX-XXXX` → duyệt → tiêu thụ | `POST /step-up/requests`, `/step-up/approve`, bảng `step_up_requests` | **Đủ** về luồng. **Lệch**: prototype hiện 6 chữ số; backend dùng mã ngắn Crockford `XXXX-XXXX` (9 ký tự). Đã căn prototype theo backend (xem §4) |
| Xác thực lại bằng mã khôi phục (dùng hết mã + phát hành + xác nhận mã thay thế) | `recovery-code/begin` + `confirm` | `POST /recovery-code/begin|confirm`, bảng `code_replacements` | **Đủ** (hai pha, mã cũ chỉ vô hiệu khi commit) |
| Tạo danh tính + mã hiện một lần, bỏ qua được | `POST /identity` với `skipRecoveryCode` | có | **Đủ** |
| Phát hành mã sau khi đã bỏ qua (MĐ-2) | `recovery-code/begin` khi chưa có mã | cần xác nhận hành vi khi `hasCode=false` (`UNVERIFIED`) | Cần test/đối chiếu khi làm |
| Trạng thái mã (đã có/chưa) | `GET /recovery-code` → `{hasCode, createdAt}` | có | **Đủ** |
| Danh sách thiết bị/phiên + thu hồi | tên thiết bị, lần hoạt động cuối, “thiết bị này”, thu hồi | `GET /sessions` trả `{id, createdAt, lastSeenAt, current}`; `DELETE /sessions/{id}` | **Lệch**: không có **tên thiết bị**. Cần cột `device_label` do thiết bị tự khai lúc ghép/khôi phục (T-B) và hiển thị nguồn gốc (quan trọng để người dùng nhận ra thiết bị lạ, xem §3) |
| Ghép thiết bị: máy mới hiện mã, thiết bị cũ nhập | `device_links` (`pairing_code varchar(9)`, TTL, trạng thái) | `POST /device-links`, `GET /device-links/{id}`, `POST /device-links/approve` | **Đủ** (TTL: backend quyết; prototype ghi 5 phút, `UNVERIFIED` khớp) |
| Khôi phục trên máy mới (KP-C), lần thử hết hạn | `recovery/start`, `recovery/complete`, `recovery_attempts` (`expires_at`) | có | **Đủ**. Prototype dùng TTL 15 phút (mặc định giả); giá trị thật do spec |
| Giới hạn thử | theo nguồn (IP) hoặc phiên | `limits.identity/recovery/approval` | **Đủ** về cơ chế; con số chờ spec (MĐ-8). Prototype khóa ô nhập sau 5 lần sai: chỉ minh họa |
| Mã khôi phục hiển thị | 30 ký hiệu Crockford, 6 nhóm × 5, ví dụ `7K2QF-…` (≈150 bit) | `Secrets.newRecoveryCode()` | **Lệch (đã căn)**: prototype trước đó dùng 12 ký tự. UX nhập lại 30 ký tự là gánh nặng: xem câu hỏi PO §3 |
| Chia sẻ, thành viên, đề nghị xóa, duyệt, “vừa thêm” (F9–F11) | thành viên, `added_by`, yêu cầu xóa, trạng thái duyệt | không có (Lát 1b) | **Thiếu**, ngoài 1a; Q6–Q9, Q12 còn mở. Prototype chỉ là thiết kế “bản thử 1b” |
| Quản trị nội dung (F12) | CRUD điểm đến/địa điểm/ảnh/cẩm nang/nhãn, kiểm “thẻ đủ chuẩn” (7 luật chặn + 1 cảnh báo, xem `user-flows.md` F12), trạng thái bản nháp/đã xuất bản, gỡ xuất bản, tải ảnh lên kèm ghi công | chỉ đọc từ tệp JSON (`catalog/*.json`) | **Thiếu** hoàn toàn: cần bảng catalog trong DB (hoặc bucket S3 cho ảnh), trạng thái xuất bản, kiểm luật ở máy chủ (không tin trình duyệt); đăng nhập quản trị Q-d **T-A chưa chốt** |
| Chia sẻ/xuất (F13) | liên kết xem, ảnh/PDF/lịch | không có | **Thiếu**, ngoài 1a |
| Trạng thái toàn cục (tải/lỗi/ngoại tuyến/hết phiên/ảnh lỗi) | mã lỗi API chuẩn, 401 khi hết phiên | `WanderException` + mã lỗi trong `*IT` (`UNVERIFIED` đầy đủ) | Cần bảng mã lỗi → thông báo tiếng Việt (T-B) |

## 2. Thứ tự làm backend đề xuất sau DG-1 (từng lát dọc, mỗi lát qua `/wander-feature`)

> **Cổng chờ quyết định Tầng A** (`docs/ux/po-questions.md`): **A1, A2, B1 đã quyết ở `DR-011` (25/10/2026)** nên lát 1–5 đều mở được (lát 2–3 theo A1 = (b); lát 4 theo A2/B1 = (b)); lát 6 vẫn chờ **A3**; B2/B3 chờ trước RG-2; E1 chờ khi sửa ghép thiết bị. Phần nhóm và quản trị (mục 7) không thuộc 1a. Quy tắc nhóm xuất hiện trong luồng 1a (mục chờ duyệt xóa không bị "Xếp giúp tôi" xếp; nút duyệt chỉ người tạo thấy) chỉ có hiệu lực khi 1b có dữ liệu đề nghị xóa: ở 1a chuyến một người nên không phát sinh.
1. **Catalog công khai + giới hạn tốc độ** (DR-008 Q-a): route, test, rà an ninh. Nhỏ, độc lập.
2. **Mục chưa có ngày + liên kết kho + R12 mới** (một migration, đổi domain `Item/Trip`, API, test): mở khóa 70% prototype. Phụ thuộc quyết định T-A về R12 và schema.
3. **Gán ngày hàng loạt + Hoàn tác** (một lệnh nguyên tử) và quy tắc đặt tên chuyến.
4. **Thùng rác giữ đến khi xóa tay** (DR-011 A2/B1: không job, không `expiresAt`, không step-up cho xóa từng mục): chủ yếu kiểm lại và bổ sung test cho API hiện có.
5. **Tên thiết bị** cho phiên + màn Bảo mật/khôi phục (API đã có phần lớn).
6. **Cờ “chưa chắc ngày”.**
7. (1b) thành viên, đề nghị xóa, chia sẻ. (Sau) quản trị, xuất.

## 2b. Nhu cầu dữ liệu từ các màn khung DG-2 (DR-012). **Khung ≠ cam kết backend**; mỗi thay đổi schema/API cần PO duyệt (Tầng A)
| Màn | Cần gì | Có ở backend? | Ghi chú |
|---|---|---|---|
| Tạo chuyến theo bước | kiểu chuyến đi ("ai đi"), sở thích (loại địa điểm), ngày linh hoạt | **Chưa** | thuộc tính chuyến mới; "ai đi" chưa phải thành viên (Q6–Q9); "ngày linh hoạt" không quyết A3 |
| Tuyến theo ngày | tọa độ điểm của kho | **Có** (kho biên tập) | mục tự do không có tọa độ: không vẽ |
| Hôm nay | ngày của chuyến + ngày hiện tại | **Có** (ngày chuyến) | "hôm nay" theo múi giờ thiết bị (Tầng B); liên kết ra app bản đồ ngoài |
| Hết phiên | thời hạn phiên, hành vi hết phiên | **Chưa** | TTL chưa chốt (Tầng A) |
| Lỗi theo mã | bảng mã → lời | **Có** (mã) | `error-codes.md`; ánh xạ HTTP status `UNVERIFIED` |
| Cài đặt | đổi tên thiết bị | **Một phần** (tên thiết bị trong phiên: lát 5) | |
| Xuất | dữ liệu chuyến; tạo ảnh/PDF/.ics | **Chưa** tạo tệp | liên kết chỉ-đọc thuộc 1b |
| Quản trị: tải ảnh, tạo điểm đến | lưu trữ tệp, bảng catalog ghi được, đăng nhập quản trị | **Chưa** | Q-d, bỏ EXIF, kiểm kiểu/dung lượng ở máy chủ |
| Gỡ thành viên | quyền chủ chuyến gỡ thành viên, hệ quả lên mục/đề nghị | **Chưa** | Q6–Q9 |

## 3. Việc cần PO quyết (Tầng A) trước hoặc ngay khi làm backend
Chi tiết, phương án và khuyến nghị: `docs/ux/po-questions.md`.
- ~~R12 khi đổi ngày~~, ~~thời hạn giữ “Đã xóa gần đây”~~, ~~xác thực lại cho xóa vĩnh viễn từng mục~~: **ĐÃ QUYẾT ở `DR-011` (25/10/2026)**: A1 = (b) về “Chưa có ngày”; A2 = (b) giữ đến khi xóa tay; B1 = (b) không xác thực lại từng mục.
- **A3** (“Dự kiến N ngày”, cờ ngày tạm), **B2/B3/B4/E1** (an ninh), vẫn chờ PO.
- **Độ dài mã khôi phục** (30 ký tự ≈ 150 bit trong backend) so với việc nhập lại khi xác nhận (MĐ-4).
- **Q-d** đăng nhập quản trị; **Q6–Q9, Q12** nhóm; **OQ-1** giữ dữ liệu chuyến mất quyền.

## 4. Chỗ prototype đã căn theo backend (không cần PO)
Mã khôi phục (30 ký hiệu, nhóm 5, bảng chữ Crockford, chuẩn hóa O→0, I/L→1), mã ghép/duyệt `XXXX-XXXX`, 9 loại mục theo `ItemType`, hai trạng thái đặt chỗ, giới hạn 366 ngày, 1.000.000.000 nghìn, tiêu đề 200, ghi chú 2000, thời lượng 0–10080 phút, chi phí giữ cả khi “đã bao gồm”, giá tham khảo chỉ khi tick.
