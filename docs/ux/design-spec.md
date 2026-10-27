# Đặc tả thiết kế UI/UX và user flow (DG-1)

> Trạng thái: **bản nháp chờ PO duyệt** (25/10/2026). Làm theo kỹ năng `spec-driven-development`: Phase 0 (bản đồ khả năng) → Phase 1 (đặc tả này) → dừng chờ duyệt → Phase 2 (kế hoạch) → Phase 3 (việc) → Phase 4 (thiết kế và dựng prototype). Quy định cổng: `.claude/rules/design-first.md`.
> Quyết định PO 25/10/2026 (AskUserQuestion): (1) phạm vi **tất cả, gồm nhóm và quản trị**, mức thiết kế đầy đủ; (2) **khám phá trước, tạo danh tính ẩn danh khi lưu lần đầu**; (3) **thiết kế thích ứng thật cho máy tính** (không chỉ cột giữa).
> Nền: DR-001, DR-005, DR-006, DR-007, ADR-009, ADR-010, `product-spec-v1.md`, prototype bản 5 (artifact), `roameo-ui-review.md`.

## Phase 0 — Bản đồ khả năng

| Mã | Trách nhiệm | Phụ thuộc |
|---|---|---|
| `foundation` | Hệ thiết kế (token sáng/tối, chữ, biểu tượng, thành phần), khung điều hướng thích ứng điện thoại và máy tính, trạng thái rỗng/lỗi/đang tải/ngoại tuyến, thuật ngữ, giọng văn | — |
| `discover` | Khám phá, cẩm nang điểm đến, bộ thẻ quẹt, chi tiết địa điểm, Đã chọn (đã có prototype bản 5, cần hoàn thiện cho máy tính và trạng thái) | foundation |
| `identity-ux` | Người mới (khám phá trước, danh tính khi lưu lần đầu), mã khôi phục hiện một lần, khôi phục trên thiết bị khác, ghép/duyệt thiết bị, bảo mật và đăng xuất | foundation |
| `trip` | Tạo/sửa chuyến, xếp địa điểm vào ngày, mục (giờ, chi phí, đặt chỗ, Nghỉ, Việc cần làm), tổng tiền và ngân sách, xóa/Hoàn tác/Đã xóa gần đây, sắp xếp | foundation, discover, identity-ux |
| `group` | Mời bằng liên kết và tên hiển thị, thành viên, thêm trực tiếp, đề nghị xóa và duyệt bằng quẹt, tiến độ hoàn thành theo người | trip |
| `admin` | Cổng quản trị nội dung (điểm đến, địa điểm, ảnh và ghi công, cẩm nang, nhãn biên tập, kiểm tra chất lượng thẻ) cho màn hình rộng | foundation |

Thứ tự thiết kế: `foundation` → `trip` (khoảng trống lớn nhất) → `identity-ux` → `group` → `discover` (hoàn thiện) → `admin`. Mỗi lát có vòng làm → chụp thật → phản biện → sửa.

## Phase 1 — Đặc tả

### 1. Mục tiêu
Một app lập kế hoạch du lịch tiếng Việt mà **người chưa từng đến một nơi vẫn muốn đi**: khám phá bằng quẹt (ảnh thật, nhãn biên tập, cách bao xa, nên đi lúc nào), gom thành chuyến đi, xếp theo ngày với chi phí rõ ràng, và đi cùng nhóm. Người dùng chính: một người lập kế hoạch cho nhóm bạn/gia đình, dùng điện thoại là chính. PO là người tạo nội dung (quản trị). **Thành công** = một người lạ mở app, trong dưới 5 phút chọn được địa điểm, lưu thành chuyến, xếp ngày, mời bạn, mà không cần hướng dẫn.

### 2. Giả định đang dùng (sửa ngay nếu sai)
1. Web app (React + TypeScript, Vite) là sản phẩm duy nhất; không làm app native.
2. Thiết kế điện thoại 390 px là chính; máy tính 1280 px có bố cục riêng (hai/ba cột, bảng bên) cho mọi màn, cổng quản trị chỉ tối ưu cho màn rộng.
3. Chỉ tiếng Việt; tiền hiển thị đầy đủ VND (D17); ngày dd/mm/yyyy.
4. Hướng hình ảnh đã duyệt: sáng, rực rỡ, ảnh thật phủ thẻ, màu theo loại địa điểm và theo ngày, biểu tượng Tabler, chữ Baloo 2 + Be Vietnam Pro, minh họa tự vẽ; không sao chép thương hiệu Roameo.
5. Dữ liệu thật chỉ là kho biên tập (ADR-009); mọi con số hiển thị phải là "ước tính" có nhãn; không có điểm sao.
6. Quyền nhóm theo DR-006: thành viên thêm trực tiếp; xóa phải chờ người tạo duyệt (quẹt phải giữ, quẹt trái xóa).
7. Q6 (mời bằng liên kết + tên hiển thị) dùng làm **đề xuất thiết kế**, chưa phải quyết định sản phẩm (Q6–Q9, Q12 còn mở).
8. Cổng quản trị chỉ PO dùng; cơ chế đăng nhập quản trị là Tầng A, thiết kế màn hình nhưng không chốt cơ chế.

### 3. Lệnh (cách tạo và kiểm tra sản phẩm thiết kế)
```
Prototype nguồn:   docs/ux/prototype/index.html (một tệp, mở bằng trình duyệt)
Chụp ảnh thật:     node docs/ux/tools/shots.mjs          (390 và 1280 px, sáng và tối, mọi màn; sẽ viết ở Phase 4)
Thử luồng bấm:     node docs/ux/tools/flows.mjs          (playwright bấm thật theo từng luồng; sẽ viết ở Phase 4)
Kiểm tương phản:   node docs/ux/tools/contrast.mjs       (đọc token, tính tỉ lệ WCAG; sẽ viết ở Phase 4)
Mã web thật:       powershell -ExecutionPolicy Bypass -File tools\dev.ps1 verify
```

### 4. Cấu trúc thư mục
```
docs/ux/design-spec.md        đặc tả này
docs/ux/user-flows.md         mọi luồng: bước, nhánh lỗi, điểm quyết định
docs/ux/screens.md            kiểm kê màn hình và trạng thái
docs/ux/design-system.md      token, thành phần, biểu tượng, chuyển động, giọng văn, thuật ngữ
docs/ux/data-needs.md         ánh xạ màn hình → dữ liệu/API, thay đổi backend sẽ làm sau DG-1
docs/ux/prototype/            prototype bấm được (HTML) + dữ liệu mẫu
docs/ux/screenshots/          ảnh chụp thật theo màn, kích thước, giao diện sáng/tối
docs/ux/tools/                script chụp, thử luồng, kiểm tương phản
```

### 5. Phong cách (mẫu ngắn)
```css
/* token đặt tên theo vai trò, không theo màu; mọi màu đi qua token, có bản tối */
--brand: #f4511e;  --on-brand: #fff;  --surface: #fff;  --ink: #12233d;
--cat-canh: #0b7a55; --cat-van: #5b35b8; --cat-am: #ffb020; --cat-leo: #1b5fc4;   /* màu loại + biểu tượng */
--day-1: #f4511e; --day-2: #6d3fd1; --day-3: #1b5fc4;                              /* màu theo ngày */
--warn-bg: #fff0b8;                                                                /* chỉ dành cho "chờ duyệt" */
```
Quy ước: tiêu đề Baloo 2, nội dung Be Vietnam Pro ≥ 16 px; vùng chạm ≥ 44 px; mỗi thao tác cử chỉ có nút tương đương; màu không là tín hiệu duy nhất; chữ Việt tự nhiên (Người tạo, Đã chọn, Chuyến đi, Chưa có ngày, Đề nghị xóa).

### 6. Chiến lược kiểm thử thiết kế
- **Ảnh chụp thật** cho từng màn × {390, 1280} × {sáng, tối} × {có dữ liệu, rỗng, lỗi, đang tải}; xem bằng mắt, không báo "xong" khi chưa xem.
- **Luồng bấm thật** bằng playwright cho mọi luồng (F1–F14), kiểm không lỗi console.
- **Truy cập:** tương phản ≥ 4,5:1 (tính bằng script), vùng chạm ≥ 44 px, thứ tự Tab, focus nhìn thấy, `prefers-reduced-motion`, nhãn cho nút chỉ có biểu tượng. Dùng danh sách kiểm của `ui-ux-pro-max`.
- **Phản biện độc lập:** `wander-skeptic-qa` và `wander-product-analyst` mỗi lát (≤ 2 vòng, ≤ 6 lượt).
- Mã web thật (sau DG-1) đi qua `/wander-verify` và e2e.

### 7. Ranh giới
- **Luôn:** gọi kỹ năng bắt buộc theo `design-first.md` và ghi "Công cụ đã dùng"; xem ảnh chụp thật trước khi báo xong; gắn nhãn "bản nháp/ước tính" cho nội dung chưa kiểm chứng; hỏi PO bằng lựa chọn khi là Tầng A rồi làm tiếp ngay.
- **Hỏi trước:** thay đổi nghĩa sản phẩm (quyền nhóm, xóa vĩnh viễn, giữ dữ liệu), cơ chế đăng nhập quản trị, thư viện giao diện/framework mới, bất kỳ thay đổi backend.
- **Không bao giờ:** làm tính năng backend mới trước khi DG-1 đóng; hiển thị số sao, giá, giờ mở cửa không có nguồn; sao chép logo, minh họa, chữ của Roameo; thay đổi bản kế hoạch chủ (`docs/wander-master-plan.md`); commit khi PO chưa yêu cầu.

### 8. Phạm vi luồng (chi tiết sẽ viết ở `user-flows.md` sau khi anh duyệt đặc tả)
| Mã | Luồng | Mô-đun |
|---|---|---|
| F1 | Người mới mở app → khám phá không cần danh tính → quẹt chọn | discover |
| F2 | Lưu lần đầu → tạo danh tính → mã khôi phục hiện một lần (xác nhận hoặc bỏ qua có cảnh báo) → vào chuyến đi | identity-ux, trip |
| F3 | Tạo chuyến (tên, ngày đi/về, phong cách, nhịp, ngân sách tùy chọn) từ Đã chọn hoặc từ đầu | trip |
| F4 | Xếp địa điểm vào ngày: một chạm, xếp giúp tôi (gợi ý), chọn nhiều, đổi ngày chuyến | trip |
| F5 | Thêm/sửa mục tự do (giờ, thời lượng, ghi chú, chi phí, đã bao gồm, đặt chỗ, Nghỉ, Việc cần làm) và sắp xếp thủ công | trip |
| F6 | Chi phí: tổng theo ngày/loại, "chưa biết giá", ngân sách và phần vượt | trip |
| F7 | Xóa → Hoàn tác → Đã xóa gần đây → khôi phục hoặc xóa vĩnh viễn (xác thực lại) | trip, identity-ux |
| F8 | Mở trên thiết bị khác: khôi phục bằng mã; thiết bị tin cậy duyệt thiết bị mới; thu hồi phiên | identity-ux |
| F9 | Mời người đi cùng bằng liên kết; người được mời vào bằng tên hiển thị | group |
| F10 | Thành viên thêm địa điểm (quẹt thêm) và gửi đề nghị xóa; người tạo duyệt bằng quẹt | group |
| F11 | Tiến độ hoàn thành việc cần làm theo từng người | group |
| F12 | Quản trị: thêm/sửa điểm đến, địa điểm, ảnh và ghi công, cẩm nang, nhãn biên tập; kiểm tra thẻ đủ chuẩn trước khi xuất bản | admin |
| F13 | Chia sẻ/xuất: xem chuyến ở dạng đọc, sao chép liên kết, ảnh/PDF/lịch (mức thiết kế) | trip, group |
| F14 | Trạng thái toàn cục: hết phiên, mất mạng, ảnh lỗi, dữ liệu rỗng, lỗi máy chủ | foundation |

### 9. Tiêu chí thành công (khớp 8 mục DG-1 trong `design-first.md`)
1. `user-flows.md` có đủ F1–F14, mỗi luồng: điều kiện đầu, các bước, nhánh lỗi, kết thúc; PO duyệt.
2. `screens.md` liệt kê mọi màn, mỗi màn đủ: mục đích, dữ liệu, hành động, rỗng, lỗi, đang tải, ngoại tuyến; có bố cục điện thoại và máy tính.
3. `design-system.md` đủ token sáng/tối, thành phần, biểu tượng, chuyển động, giọng văn, bảng thuật ngữ; script kiểm tương phản đạt.
4. Prototype bấm được phủ 100% F1–F14; ảnh chụp thật của từng màn đã được xem; script luồng bấm đạt, không lỗi console.
5. Danh sách kiểm truy cập đạt như mục 6.
6. `data-needs.md` chỉ rõ trường/API còn thiếu ở backend (ví dụ: xem kho không cần phiên cho khách chưa có danh tính, mục chưa có ngày, nhóm, quản trị) và thứ tự làm sau DG-1.
7. Phản biện độc lập không còn BLOCKER/MAJOR.
8. PO duyệt bằng văn bản (DR mới).

### 10. Câu hỏi mở (cần PO; mỗi câu có mặc định đề xuất, chưa phải quyết định)
| # | Câu hỏi | Mặc định đề xuất | Tầng |
|---|---|---|---|
| Q-a | Khách chưa có danh tính xem kho địa điểm: API catalog phải cho truy cập không phiên (đổi quy tắc "mọi /api cần phiên") | Mở riêng `GET /api/catalog/**` công khai, có giới hạn tốc độ; `planning` vẫn cần phiên. Cần xem xét an ninh khi làm backend | A (an ninh) |
| Q-b | "Chưa chắc ngày": cho tạo chuyến không ngày (vướng R5) | Chưa làm: giữ R5, thiết kế ô "Dự kiến N ngày" tạo ngày tạm có cờ "chưa chắc" | A |
| Q-c | Người được mời có xóa được địa điểm do chính họ thêm không | Có (xóa trực tiếp mục mình thêm), mục của người khác thì gửi đề nghị | A (Q9) |
| Q-d | Đăng nhập cổng quản trị | Chưa chốt; thiết kế màn đăng nhập mức khung, chọn cơ chế khi làm backend admin | A (an ninh) |
| Q-e | Giữ "Đã xóa gần đây" bao lâu và xóa vĩnh viễn thế nào | ~~Mặc định 30 ngày, xóa vĩnh viễn cần xác thực lại~~ → **thay bởi DR-011 (25/10/2026):** giữ đến khi xóa tay (D19), xóa từng mục chỉ cần xác nhận (D25 gốc); OQ-1 vẫn mở | A (dữ liệu) |
| Q-f | Điểm ngắt máy tính | 1280 px = ba vùng (danh sách, chi tiết, sơ đồ); 768–1279 px = hai vùng; dưới 768 = một cột | B |
