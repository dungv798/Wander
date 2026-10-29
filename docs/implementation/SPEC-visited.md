# SPEC-visited — Đã ghé cho mục địa điểm (30/10/2026)

## 1. Căn cứ và kết luận bước 2

PO giao trong phiên 30/10: “Có, thêm Đã ghé cho địa điểm”, tiếp nối DR-029
(bản DR-029 hiện trong repo ghi duyệt widget Hôm nay ngày 29/10, chưa ghi câu bổ sung này).
Đã đọc CLAUDE.md, quy tắc backend/frontend/planning-safety/decision-materiality,
backend-conventions (ARC, CON, DOC), frontend-standards, SPEC-membership, DR-021/022,
Trip/Item/TripCircle, handler/query/controller, mapper/repository/entity, migration V1–V15
liên quan planning; TripTest, MembershipApiIT, AccessMatrixIT, PlanningApiIT,
DeletionRequestApiIT và luồng FE trips/collab/shared API.
SPEC-membership còn ghi dự thảo/chưa có mã: mô tả hiện trạng dưới đây căn cứ mã thực tế.

**LÀM:** không cần migration Flyway, không đổi aggregate, không phá hợp đồng API.
Mở rộng tập mục được nhận `PUT /api/trips/{tripId}/items/{itemId}/done {done:boolean}`;
giữ nguyên request/response và hành vi task cũ. Không thêm endpoint/dependency.

## 2. Khảo sát completion và membership hiện có

- V1 tạo `item_completions(item_id, person_id, done_at)`, khóa chính
  `(item_id, person_id)`; FK `item_id → items.id ON DELETE CASCADE`.
  `person_id` là **identity UUID**, không phải member UUID, không FK sang identity.
  Không CHECK theo loại mục, vì vậy địa điểm dùng cùng bảng được ngay.
- `Item.completions` là `Map<UUID, Instant>` trong aggregate Trip.
  `Trip.setTaskDone` đang chặn loại khác task bằng `NOT_A_TASK` (400, field `type`);
  mục đã xóa → `ITEM_DELETED` (409); done thiếu/null/sai kiểu → `MALFORMED` (400);
  mã mục không có/khác chuyến → `NOT_FOUND` (404).
- JPA ItemEntity ánh xạ tập completion, TripMapper đọc và JpaTripRepository.copyItem
  ghi đồng bộ; các truy vấn DONE_ITEM_IDS/COMPLETIONS_OF_TRIP không lọc loại task.
  `PlanningQueries` trả `done` theo người gọi, `doneBy` đổi identity sang member UUID
  và chỉ giữ thành viên hiện tại. Đã có hạ tầng tiến độ chung, không lộ identity UUID.
- V13 quản lý `trip_members`, V14 là đề nghị xóa; V15 checklist chuẩn bị có
  `checklist_completions` riêng. **Không dùng bảng checklist cho địa điểm.**
- Handler nạp chuyến qua `findAccessible`, kiểm `requireMember`, lấy người tích từ
  principal; mọi thành viên và Organizer tích/bỏ tích **phần mình**, kể cả mục do
  người khác thêm. Không cần quyền sửa mục H3 để tích, không được tích hộ.
  Người ngoài/người đã bị gỡ/chuyến đã xóa → 404. Organizer không có quyền tích hộ.

## 3. Phạm vi và mặc định triển khai

- Mục địa điểm là mục có `placeId != null`, loại khác `rest`/`task`, đúng cách FE
  phân biệt địa điểm từ kho với mục tự do. Task vẫn dùng “Đã xong”; nghỉ và mục tự do
  không có liên kết địa điểm vẫn giữ `NOT_A_TASK`. Không suy ra đã ghé theo giờ,
  ngày, vị trí, đặt chỗ hay catalog có tải được không.
- Đếm **mục**, không gộp `placeId`: cùng nơi xuất hiện hai ngày là hai lượt riêng.
  Hôm nay hiển thị `n/m nơi đã ghé` từ mục ngày đang xem, với nhãn “Của bạn”.
  Kết thúc hiển thị tỷ lệ thật trên mọi mục địa điểm còn hiện của chuyến (kể cả
  chưa có ngày); không có mục thì nói rõ, 0/m vẫn là dữ liệu thật.
- Mỗi thẻ kế tiếp/dòng địa điểm có nút “Đã ghé”, trạng thái `aria-pressed`, bỏ tích
  được; nhiều thành viên thì hiện số người đã ghé từ `doneBy/memberCount` hiện có.
  Gửi lệnh qua actions/gateway cũ, chờ máy chủ và đọc lại chuyến; khóa nút đang gửi,
  lỗi qua cơ chế report hiện có, không tự sửa số liệu trong bộ nhớ.
- Next stop bỏ qua nghỉ/mục không tích được; danh sách vẫn giữ các mục đó.

## 4. Vòng đời và quyền xóa (giữ DR-021/022)

- Xóa mềm không xóa completion; mục rời items đang hiện nên không vào tỷ lệ.
  Tích hoặc bỏ tích mục đã xóa bị chặn 409. Undo/restore giữ dấu tích và thứ tự cũ.
- Xóa vĩnh viễn cascade completion; không còn dữ liệu để tính.
- Đề nghị xóa đang chờ không đổi dấu tích, vẫn tích được. Chấp thuận hoặc Organizer
  xóa thẳng → xóa mềm; xóa thẳng tự đóng đề nghị thành approved (DR-022).
- Đổi ngày/gán ngày/đổi khoảng ngày chỉ chuyển mục; completion theo item UUID giữ
  nguyên, tỷ lệ ngày cũ/mới tính lại. Ra ngoài khoảng → chưa có ngày, vẫn giữ dấu.
- Gỡ/rời chuyến chặn đọc/ghi mới; `doneBy` loại người không còn là thành viên.
  Không thay chính sách lưu dấu theo identity hiện có (vào lại cùng identity có
  thể thấy dấu cũ). Đổi loại/liên kết mục giữ dữ liệu completion như cơ chế cũ;
  nghỉ/mục tự do không được hiển thị thành một nơi đã ghé.

## 5. Kiểm chứng và bài học

Viết trước test domain/API: tích riêng, bỏ tích, lặp nơi khác item, mọi loại địa điểm,
task hồi quy; input sai, loại không hỗ trợ, mục xóa, người lạ/khác chuyến/thành viên
bị gỡ, xóa/khôi phục/purge, đổi ngày và đề nghị xóa. Backend **NOT_RUN** theo giới
hạn sandbox; không khẳng định đã quan sát test đỏ/xanh hoặc biên dịch thành công.
Claude chạy `powershell -ExecutionPolicy Bypass -File tools/dev.ps1 backend-test`,
đọc log và kiểm cả ArchUnit/Checkstyle trước tích hợp.

FE: test todayState trước sửa để quan sát đỏ; kiểm đếm theo mục, trạng thái cá nhân,
0/m, bỏ tích, ngày/trash, nghỉ/task, cùng địa điểm nhiều lần. Sau đó chạy typecheck,
eslint, stylelint, `npm --prefix web test`, build; tối đa ba vòng, không e2e.
Log ở `.logs/ux-visited/`. Công cụ graph không có trong phiên; kiểm trực tiếp mã.

Bài học: khóa completion theo (item, identity) đã tách trạng thái từng người khỏi
loại mục từ đầu; thay quy tắc domain đủ mở khả năng mới, không cần bảng visited.
Không dùng số địa điểm catalog duy nhất thay số mục lịch, và không dùng tiến độ
chung thay trạng thái của người đang xem.

## 6. Kết quả thực hiện trong sandbox

- Đã mở điều kiện domain nhận địa điểm, giữ endpoint/request/response, quyền và
  persistence cũ. Thêm 3 test TripTest và 4 test VisitedApiIT trước mã backend.
  Backend compile/test/ArchUnit/Checkstyle: **NOT_RUN**, không chạy Gradle/Docker.
- FE đã có nút Đã ghé/bỏ tích trên thẻ kế tiếp và danh sách, khóa khi chờ, tiến độ
  từng người và nhóm, tỷ lệ cá nhân theo ngày và khi kết thúc (gồm cả 0/m).
- TDD FE: `fe-red.log` ghi 7 test, 4 qua/3 lỗi trước sửa; `fe-targeted.log` ghi
  7/7 qua sau sửa. Bổ sung thêm hai ca tỷ lệ/loại mục, toàn bộ `npm --prefix web test`
  qua **267/267**, trong đó todayState **9/9** (`test-1.log`).
- Hai vòng xác minh: typecheck, `npm --prefix web run lint` (eslint + stylelint),
  build đều exit 0; bản cuối ở `typecheck-2.log`, `lint-2.log`, `build-2.log`.
  Build cảnh báo chunk lớn, không lỗi. Tất cả log trong `.logs/ux-visited/`.
- E2E **NOT_RUN** theo chỉ định. Không commit/push/deploy, không sửa migration,
  quyết định chung, master plan hoặc các chỉnh sửa có sẵn ngoài phạm vi.
- Công cụ đã dùng: skill `wander-implement`, `exec_command`, `apply_patch`,
  kiểm tra mã/diff và Node/npm. Không có graph MCP khả dụng, không ủy quyền.
