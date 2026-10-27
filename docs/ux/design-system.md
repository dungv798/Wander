# Hệ thiết kế Wander

> T2 của DG-1 (25/10/2026). Nguồn sự thật của giá trị: `docs/ux/prototype/tokens.css`; thành phần chạy được: `prototype/components.css` + `components.html`; kiểm tự động: `node docs/ux/tools/contrast.mjs` (61 cặp × sáng/tối = 122 phép tính, gồm chữ ≥ 4,5:1 và viền/biểu tượng/đồ họa ≥ 3:1, và kiểm hai khối tối giống hệt nhau) và `node docs/ux/tools/flows.mjs` (luồng T2: vùng chạm ≥ 44 px, khoảng cách ≥ 8 px, tên truy cập có thật, chữ ≥ 12 px, không cuộn ngang, font nạp được, hover/focus, giảm chuyển động, phím mũi tên của tab, giao diện tối). Mã web thật (`web/src/discover/discover.css`) phải chuyển sang đúng các token này sau DG-1.
> Cơ sở: hướng hình ảnh PO đã duyệt (sáng, rực rỡ, ảnh thật, màu theo loại và theo ngày, kiểu Roameo về cơ chế, không sao chép thương hiệu), checklist `ui-ux-pro-max` (đã gọi; công cụ tra cứu chạy qua `uv run --python 3.12`), báo cáo agent UI (danh mục thành phần, khoảng trống token).
> Giá trị ở đây là **Tầng B mặc định** (đảo ngược được), đã ghi vào `docs/implementation/decisions.md`.

## 1. Nguyên tắc
1. **Ảnh thật là nhân vật chính.** Thẻ ảnh phủ kín, chữ trắng luôn trên lớp tối dưới ảnh (`--scrim`).
2. **Màu có việc để làm, và chỉ có MỘT bộ.** Cam = hành động chính và nhấn; trời xanh = thông tin và "chờ duyệt"; mực = chữ; xanh lá/đỏ = chọn/xóa. Loại địa điểm và ngày không còn màu riêng (xem mục 2). Mỗi màn dùng tối đa ba sắc ngoài ảnh.
3. **Mọi cử chỉ có nút tương đương** (quẹt = nút Bỏ qua/Chọn; quẹt hàng = menu ⋯).
4. **Không bịa dữ kiện.** Không số sao, giá, giờ mở cửa không nguồn. Khoảng cách và thời gian đi luôn ghi "ước tính". Nội dung biên tập ghi "bản nháp" cho tới khi PO duyệt.
5. **Điện thoại trước, máy tính có bố cục riêng** (mục 8). Giao diện sáng mặc định, tối theo hệ thống; hai bản được kiểm riêng.

## 2. Màu (tên theo vai trò; MỘT nguồn duy nhất: `docs/ux/prototype/tokens.css`)
> **Làm lại 26/10/2026 theo PO ("một bộ màu nhận diện thương hiệu, tái sử dụng toàn hệ thống; ưu tiên sáng, nền tối để sau").** Trước đó có HAI bộ token song song (`tokens.css` cho thư viện thành phần, khối `:root` riêng trong `app/app.css` cho app) với 6 màu loại + 7 màu ngày + màu tím "chờ duyệt", nên một màn thường có 6–8 sắc. Nay: **`tokens.css` là nguồn duy nhất**; `app.css` không còn định nghĩa màu; tên cũ của app là alias ở cuối `:root` của `tokens.css` (gỡ khi web thật dùng token chuẩn).

**Bốn họ màu thương hiệu + hai màu trạng thái (không thêm họ thứ bảy):**
| Họ | Token | Sáng | Dùng cho |
|---|---|---|---|
| **Nắng/bơ** (nền ấm) | `--bg` `--surface` `--surface-2` `--line` `--scene` | #fff8d8 / #fff / #fff2c2 / #f0dc8a | nền trang, thẻ, nền phụ dịu, đường kẻ; `--scene` = trời vàng → bơ (màn quẹt và MỌI tờ phủ) |
| **Hổ phách/cam** (hành động, nhấn) | `--cta-1` `--cta-g1` `--cta-2` `--on-cta` · `--brand` `--brand-2` `--brand-ink` `--brand-soft` · `--sun` | #ff8a00 / #ffb01f / #ff6a00 / #2a1700 · #d9680a / #b84c00 / #7d3d00 / #ffe68a · #ffc400 | nút chính (gradient hổ phách → cam), huy hiệu đếm, **MỌI loại địa điểm** (đồng giá trị), tháng đẹp, nhãn "Nên ghé" |
| **Trời xanh** (thông tin) | `--sky` `--sky-soft` `--sky-1` `--sky-2` · `--warn-*` | #0b58b8 / #d9eefc / #8fd3fb / #ffe872 | liên kết, bầu trời minh họa, **"chờ duyệt" (thay màu tím)** |
| **Mực** (chữ) | `--ink` `--muted` `--border-ctrl` `--ink-fixed` | #14213a / #45506a / #6b7a90 / #12233d | chữ chính, chữ phụ, viền ô nhập (≥ 3:1) |
| Trạng thái | `--like` `--skip` (+ `--on-like` `--on-skip`) | #0b7a47 / #c62828 | CHỈ nghĩa "đã chọn/đã xong" và "xóa/lỗi" |
| Phủ ảnh | `--scrim` `--on-photo` `--chip-photo` `--glass` `--backdrop` `--photo-bg` | | lớp tối dưới ảnh, chữ trên ảnh, chip trên ảnh; `--backdrop` là tấm mờ nâu ấm 34% (không đen) |

- **Loại địa điểm** (`--cat-*`, 6 token cùng một giá trị cam đậm/nhạt): phân biệt bằng **biểu tượng + chữ**, không bằng màu. Lý do: PO thấy một màn có quá nhiều màu. Giữ tên 6 token để thêm loại mới không phải đổi mã.
- **Ngày** (`--day-1…7`): xoay vòng cam → trời → mực; số ngày luôn ghi bằng chữ, màu chỉ là điểm nhấn.
- **Quy tắc đếm màu:** mỗi màn tối đa ba sắc ngoài ảnh (thường: cam + trời + mực trên nền bơ); xanh lá/đỏ chỉ khi có trạng thái.
- **Bản đồ** (`mapSvg`, `miniMap`) vẽ bằng bơ/nắng + nước xanh trời + ghim cam, không còn xanh lá/tím/hồng theo loại.
- **Nền tối:** khung `:root[data-theme="dark"]` còn đó (hai khối @media và thuộc tính phải giống hệt, `contrast.mjs` kiểm), **chưa tinh chỉnh**, làm sau cùng (PO 26/10/2026).
- Cặp chữ/nền: `node docs/ux/tools/contrast.mjs` (thư viện) và `node docs/ux/tools/contrast.mjs --css=docs/ux/prototype/tokens.css --pairs=docs/ux/tools/contrast-pairs-app.json` (app). Chữ trắng trên `--brand-2` #b84c00 đạt 5,9:1; không dùng `--brand` #d9680a làm nền chữ nhỏ.

## 3. Chữ
Tiêu đề **Baloo 2** (600–800), nội dung **Be Vietnam Pro** (400–700), đều tự lưu (`/fonts`, subset latin + vietnamese, OFL; CSP không cho font ngoài).
| Vai trò | Cỡ | Ghi chú |
|---|---|---|
| `t-hero` | 42 | chỉ logo/tagline |
| `t-h1` | 36 | tên trang, tên chuyến |
| `t-h2` | 22 | đầu mục |
| `t-h3` | 18 | tên địa điểm trong danh sách |
| nội dung | 16 | cao dòng 1,55 |
| `t-note` | 14 | chữ phụ, ghi chú "ước tính" |
| `t-label` | 12 | tối thiểu của dự án; không dùng chữ nhỏ hơn 12 |
Cao dòng tiêu đề **1,25** (đủ cho dấu Ệ, Ầ); `text-wrap: balance` cho tiêu đề; tiền dùng `.money` (số tabular) và đặt "₫" sau số, không ngắt dòng giữa số và ₫. Không dùng chữ hoa kèm giãn chữ cho cụm tiếng Việt dài (nhãn `t-label` ngắn thì được). Tiền luôn đầy đủ (1.500.000 ₫, D17).

## 4. Khoảng cách, hình, độ nổi, tầng
Khoảng cách `--s-1…--s-8` = 4, 8, 12, 16, 24, 32, 48, 64 (thang 4 px cho khoảng cách; kích thước của chính thành phần như 32, 36, 44, 56, 68, 72 là kích thước, không phải khoảng cách). Bán kính `--r-sm 12`, `--r-md 18`, `--r-lg 24`, `--r-xl 30`, `--r-pill`. Bóng `--sh-1` (nút, chip nổi), `--sh-2` (thẻ, tờ phủ). Tầng: `--z-raised 2`, `--z-sticky 10`, `--z-nav 20`, `--z-sheet 30`, `--z-popover 40`, `--z-dialog 50`, `--z-toast 60`. Lề trang `--gutter` = max(16 px, vùng an toàn). Vùng chờ cho thanh tab nổi `--tabbar-h` 112 px.

## 5. Chuyển động
Chọn theo quãng đường và ngữ cảnh (không một thời lượng cho mọi thứ): `--dur-press 90ms` (nhấn), `--dur-fast 140ms` (đổi màu, bật/tắt), `--dur-med 240ms` (mở tờ phủ, lật thẻ), `--dur-slow 360ms` (thẻ bay đi). Easing `--ease-out` khi vào, `--ease-in` khi ra. Ưu tiên animate `transform` và `opacity`; đổi màu nền/viền cho trạng thái nhỏ (hover, bật/tắt) là cho phép; không animate chiều rộng/cao. `--ease-in` dành cho hiệu ứng thoát (dùng khi dựng toast/tờ phủ ở T3). Khung xương: shimmer 1,4 s. **Giảm chuyển động:** một luật chung đặt thời lượng ≈ 0 và tắt shimmer; thông tin không phụ thuộc chuyển động. Thẻ bay đi khi quẹt bỏ qua nếu giảm chuyển động (thẻ biến mất ngay).

## 6. Biểu tượng
**Tabler Icons** (MIT), outline, lưới 24, nét 2, một họ duy nhất. Cỡ `--icon-s 16` (trong dòng chữ), `--icon-m 20` (mặc định), `--icon-l 26` (nav), `--icon-xl 30` (nút tròn). Biểu tượng trang trí `aria-hidden`; nút chỉ-biểu-tượng bắt buộc `aria-label`. Không dùng emoji làm biểu tượng cấu trúc.
Gán nghĩa: loại — cảnh quan `trees`, văn hóa `columns`, ẩm thực `tools-kitchen-2`, leo núi `mountain`, lưu trú `bed`, chợ `building-store`; khoảng cách `route`; xe máy `motorbike`; thời lượng `clock`; mùa `calendar-event`; buổi `sunrise`/`sun`/`sunset-2`/`moon-stars`; nhãn gợi ý `rosette-discount-check`; chờ duyệt `clock`; chia sẻ `share-2`; xóa `trash`; hoàn tác `arrow-back-up`; điều hướng `compass`/`bookmarks`/`calendar-event`; nguồn ảnh `info-circle`. (Danh sách đầy đủ: `prototype/icons.js`.)

## 7. Thành phần (đã có trong `components.html`)
Trạng thái bắt buộc cho mọi thành phần tương tác: mặc định, hover (chỉ nơi có chuột), focus-visible, pressed, disabled (dùng `disabled`/`aria-disabled`), lỗi, đang tải. Vùng chạm ≥ 44 px (hình nhỏ hơn thì mở rộng vùng chạm).
| Thành phần | Biến thể | Ghi chú truy cập và dùng |
|---|---|---|
| Nút (`.btn`) | primary, secondary, danger, sun; big 52; loading | Loading: `aria-busy`, giữ độ rộng; chỉ có biểu tượng thì có `aria-label` |
| Nút tròn (`.round-btn`, `.icon-btn`) | like, skip, small | Thay cho cử chỉ quẹt; luôn có nhãn |
| Chip (`.chip`) | loại (nhạt/đặc), sun, warn, photo | Chip tĩnh; chip bấm được là `.filter-chip` (≥ 44) |
| Chip ngày (`.day-chip`) | theo `data-day` | Chữ trắng trên màu ngày (≥ 4,5:1) |
| Thẻ ảnh (`.photo-card`) | L khám phá, M, S | Lớp tối dưới ảnh; cả thẻ là một liên kết/nút có tên; ảnh lỗi dùng nền màu loại + biểu tượng |
| Hàng mục (`.row-card`) | địa điểm, tự do, chờ duyệt (vàng + biểu tượng + chữ) | Cử chỉ quẹt có menu ⋯ tương đương; số thứ tự theo màu ngày |
| Ô nhập (`.field`, `.input`, `.input-suffix`) | chữ, số tiền (xem trước "= 150.000 ₫"), ngày, lỗi | Nhãn luôn hiện; lỗi gần ô với `aria-invalid`/`aria-describedby`; xác thực khi rời ô |
| Công tắc, hộp chọn, phân đoạn | | `role=switch`; hộp chọn nằm trong hàng ≥ 44; phân đoạn dùng `aria-pressed` |
| Tab ngày (`.day-tabs`) | màu theo ngày | `tablist/tab`, `aria-selected`, phím mũi tên |
| Thanh tab nổi / thanh bên | 3 mục | `<nav>`, `aria-current`; huy hiệu số có nhãn |
| Toast Hoàn tác (`.toast`) | thành công, lỗi | `role=status` (lỗi: `alert`); không tự tắt khi đang focus/hover; nút ≥ 44 |
| Khung chờ (`.banner`), khung xương, trạng thái rỗng, thanh tiến độ, avatar | | rỗng = biểu tượng + tiêu đề + đúng một nút hành động; `progressbar` có `aria-valuenow/min/max` |
| Tờ phủ (`.sheet`) | tờ dưới, hộp xác nhận | `role=dialog aria-modal`, khóa focus, Esc, trả focus; xác thực lại dùng `alertdialog` |
Đã dựng sau T2 (xem mục 10a): danh sách và biểu mẫu quản trị, chọn ngày một chạm, xếp giúp tôi, khối mã khôi phục, thẻ quẹt. **Chưa dựng:** bộ chọn tải ảnh lên (quản trị), chế độ chỉ-đọc cho người xem liên kết (quyền 1b còn mở).

## 8. Bố cục thích ứng (DR-008: thiết kế thật cho máy tính)
| Khoảng | Khung | Điều hướng | Tờ phủ | Lưới thẻ |
|---|---|---|---|---|
| < 768 (điện thoại, chuẩn 390) | một cột | thanh tab nổi 3 mục | tờ dưới | 2 cột |
| 768–1279 | hai vùng (nội dung + bảng/sơ đồ) | thanh bên thu gọn 96 | hộp thoại giữa, rộng ≤ 440 | 3 cột |
| ≥ 1280 | ba vùng: thanh bên 264 / nội dung / bảng phải 360–440 | thanh bên có nhãn | bảng phải (không modal); xác nhận và xác thực lại vẫn là hộp thoại | 3–4 cột; hàng cuộn ngang thêm nút ‹ › |
Nguyên tắc: một bộ thành phần, bố cục đổi theo khoảng; hover chỉ là lớp bổ sung. Thẻ quẹt tối đa ≈ 420 × 640 căn giữa. Cổng quản trị chỉ tối ưu ≥ 1280 (dưới đó hiện dạng thẻ xếp chồng). Điểm ngắt viết thẳng số trong `@media` (biến CSS không dùng được ở đó).

## 9. Truy cập (danh sách kiểm; công cụ ghi rõ mục tự động)
- Tương phản chữ ≥ 4,5:1 và biểu tượng/viền điều khiển/đồ họa ≥ 3:1 ở **cả sáng và tối** (tự động: `contrast.mjs`; có cặp cho viền ô nhập, track công tắc, vòng focus, màu ngày/loại trên thẻ, hover nút chính, chữ trên ảnh qua lớp tối).
- **Miễn trừ có chủ ý (ghi rõ để khỏi hiểu nhầm):** điều khiển không hoạt động (disabled, WCAG 1.4.3); `--line` là đường kẻ trang trí; phân đoạn (`.segmented`) là một điều khiển ghép nên các nút nằm liền nhau; mẫu `.is-pressed` thu 98% theo thiết kế.
- **Không tự kiểm được (xem bằng ảnh chụp/tay):** chữ trên ảnh thật ngoài trường hợp xấu nhất, vòng focus trên mọi nền ảnh, kích thước chữ 200%, trình đọc màn hình thật, thiết bị thật (RG-7).
- Vùng chạm ≥ 44 × 44 px và khoảng cách ≥ 8 px giữa các vùng (tự động: luồng T2).
- Mọi điều khiển có tên truy cập (tự động: luồng T2); thứ tự Tab theo thứ tự nhìn; focus luôn nhìn thấy (vòng xanh `--focus`; trên ảnh dùng vòng đôi trắng + ink).
- Mọi thao tác chỉ-cử-chỉ có nút tương đương (kiểm thủ công theo luồng).
- Giảm chuyển động tôn trọng (kiểm bằng ảnh/luồng với `prefers-reduced-motion`).
- Không cuộn ngang ở 390 px (tự động); chữ tối thiểu 12 px; chữ có thể phóng 200% không mất nội dung (kiểm thủ công).
- Màu không là tín hiệu duy nhất; lỗi nằm gần ô và có biểu tượng + chữ.
- Ngày ở ô ngày gốc hiển thị theo ngôn ngữ hệ điều hành của người dùng (thiết bị tiếng Việt cho dd/mm/yyyy); nơi cần chắc chắn hiển thị bản chữ "31/10/2026" bên cạnh.

## 10. Giọng văn và thuật ngữ
Tiếng Việt tự nhiên của app du lịch; câu ngắn; nút nói đúng việc ("Chọn nơi này", "Lưu", "Hoàn tác"); lỗi nói rõ sai gì và sửa thế nào, không xin lỗi chung chung. Không dùng nguyên chữ Anh (Wishlist, Itinerary, Booking, Undo).
| Dùng | Thay cho | Ghi chú |
|---|---|---|
| Đã chọn | Giỏ | địa điểm đã quẹt phải, chưa lưu |
| Chuyến đi | Lịch trình (đối tượng đã lưu) | "lịch trình" chỉ dùng cho nội dung theo ngày |
| Người tạo / Thành viên | Chủ / Member | |
| Chưa có ngày | Chưa xếp | mục đã vào chuyến nhưng chưa thuộc ngày |
| Đề nghị xóa, Giữ, Xóa | Yêu cầu xóa, Duyệt | màn duyệt có chữ dưới nút |
| Chi phí · Chưa biết giá (rỗng) · 0 ₫ (biết là 0) · Đã bao gồm · Giá tham khảo · Ước tính · Tổng phải trả thêm | | D17, D18 |
| Ngân sách · Còn lại · Vượt ngân sách · Chưa đặt ngân sách | | Q11 |
| Đặt chỗ · Chờ xác nhận / Đã đặt | | A-14, DR-003 (2 trạng thái; mặc định "Chờ xác nhận") |
| Hoàn tác · Đã xóa gần đây · Khôi phục · Xóa vĩnh viễn · Xác nhận lại là bạn | | D19, D25 |
| Mã khôi phục · Dùng mã khôi phục · "Tôi đã lưu mã" · "Để sau" | | D20–D26 |
| Mã ghép thiết bị · Thiết bị tin cậy · Duyệt thiết bị · Đăng xuất thiết bị này | | |
| Liên kết mời · Sao chép liên kết · Đã sao chép · Tên hiển thị · Tham gia chuyến đi | | Q6 đề xuất |
| Nguồn ảnh (nút ⓘ) · Về dữ liệu | Nguồn và ghi công | vẫn hiển thị đủ tác giả, giấy phép, liên kết |
| Xếp giúp tôi (gợi ý) · Wander gợi ý (nhãn biên tập) | AI xếp lịch | không gọi là AI (DR-005, DR-007) |

## 10a. Thành phần của app v4 chuyển và trang quản trị (đêm 25/10/2026)
Các thành phần dưới đây nằm ở `prototype/app/adaptive.css` (app) và `prototype/app/admin.css` (quản trị), dùng chung token của `app.css`; bản mẫu sống là các màn trong `docs/ux/screenshots/INDEX.md`.

| Thành phần | Dùng ở | Quy tắc |
|---|---|---|
| `.mchip` (chip thông tin: giờ, tiền, "Đã bao gồm", "Đã đặt", "Xong n/m người") | dòng mục, chi tiết | chữ ≥ 12,5 px; tiền dùng số cùng độ rộng; "Chưa biết giá" viền đứt, không màu nền (không giống 0 ₫) |
| `.codebox` (mã khôi phục) | hiện mã một lần | 3 nhóm mỗi hàng, không ngắt giữa nhóm; mờ khi tab bị ẩn; không bao giờ nằm trong URL/tiêu đề |
| `.protobox` + nhãn "BẢN THỬ" | mọi nút giả lập, phần nhóm 1b, quản trị | nền vàng nhạt, luôn nói thật việc gì là giả; gỡ khi làm thật |
| `.infobox` / `.warnbox` | banner hoạt động mới, cảnh báo, lỗi | `role=status` cho thông tin, `role=alert` cho lỗi; lỗi nằm cạnh ô gây lỗi |
| `.who` (ai đã xong) | việc cần làm | tên + "Đã xong/Chưa xong" bằng chữ, không chỉ màu |
| `.empty` + `.ib` | mọi trạng thái rỗng | biểu tượng tròn + tiêu đề + một câu + một nút đi tiếp |
| `img.imgfail` | mọi ảnh | ảnh lỗi → nền màu `--surface-2`→`--line`, ảnh trong suốt 1×1 thay biểu tượng vỡ của trình duyệt |
| `.badge` (ok / bad / warn / draft) | quản trị | chữ + biểu tượng, không chỉ màu; cặp màu riêng cho sáng/tối |
| `.alist` / `.arow` | quản trị | dưới 768 px xếp dọc dạng thẻ; từ 768 px lưới 4–5 cột |
| `.tabs` (`role=tablist`) | quản trị | mũi tên trái/phải đổi tab, chỉ tab đang chọn có `tabindex=0` |
| `.aform` + `.aside` | biểu mẫu địa điểm | từ 1100 px hai cột, cột phải dính (xem trước + bảng kiểm); bảng kiểm cập nhật khi gõ |

Giọng văn bổ sung: "Tên hiển thị" (người vào bằng liên kết), "Liên kết mời", "Bản nháp / Đã xuất bản / Có thay đổi chưa xuất bản" (quản trị), "Hết thời gian lưu" (thùng rác), "Chặn" và "Cảnh báo" (bảng kiểm chất lượng).

## 11. Tiếp theo
T3: khung điều hướng thích ứng và trạng thái toàn cục; các thành phần "chưa dựng" ở mục 7 làm cùng lát cần chúng. Khi chuyển sang mã web thật: thay `web/src/discover/discover.css` bằng token và thành phần ở đây (một nguồn), sửa các điểm agent UI đã nêu (vùng chạm < 44, màu ngoài token, thiếu focus ring ở ô tìm, thiếu bản tối cho `--day-*`/`cat-*` trong tokens → đã bổ sung và kiểm).

Ghi chú kỹ thuật cho chuyển sang React: biểu tượng prototype là `<i data-i>` hydrate bởi `icons.js` (toàn cục `WI`); trong React dùng component `Icon` đã có ở `web/src/discover/Icon.tsx`. Ảnh dùng đường dẫn tuyệt đối `/catalog/photos/…` (máy chủ gốc). `.sidenav` đặt `--sidenav-w: 264px`; dạng thu gọn 72 px và các `@media` điểm ngắt làm ở T3.

## 13. Vòng điều chỉnh UX theo PO (25/10/2026): chuyển động, điều hướng, màu, bố cục
Nguồn mã: `prototype/app/web.css` (nạp sau `app.css`, `adaptive.css`). Kiểm: luồng `F23`, `F15`, `F02`, `F14`.
- **Điều hướng:** ≥ 768 px là **navbar trên cùng** cao 68 px (thương hiệu trái; Khám phá, Đã chọn, Chuyến đi; Cài đặt + Bảo mật phải), không còn thanh bên. Điện thoại giữ thanh tab nổi ở dưới. Onboarding và hết phiên ẩn navbar. (Lý do: PO muốn navbar ở trên; `adaptive-navigation` của ui-ux-pro-max khuyên thanh bên ≥ 1024, nhưng PO quyết định: ghi lại vì lệch khuyến nghị.)
- **Chuyển động (token):** `--m-fast` 140 ms (phản hồi bấm), `--m-med` 280 ms (tờ phủ, thẻ, toast), `--m-slow` 520 ms (vào màn, hiện dần). Easing: `--ease-out` khi vào, `--ease-spring` cho tờ phủ/toast. Chỉ animate `transform` và `opacity`. Vào màn: khối con hiện dần so le 50–60 ms (`#screen.enter`); danh sách mục `popIn`; hiện dần khi cuộn (`.rv` + IntersectionObserver); bấm: co 0,96; nút chính có vệt sáng khi rê chuột; hero điện thoại (máy bay, mây, thẻ xòe, la bàn) có chuyển động nhẹ; hero web chuyển 3 ảnh mờ dần + zoom chậm (Ken Burns); onboarding chuyển ảnh mờ dần + minh họa quẹt. **`prefers-reduced-motion: reduce`** đưa mọi thời lượng về ~0 và hero đứng yên ở ảnh đầu.
- **Màu ở Tổng quan chuyến đi:** màu bão hòa chỉ dành cho **dữ liệu** (loại địa điểm, màu ngày) và **một nút chính gradient** mỗi màn. Ô thống kê và chip là trung tính (nền thẻ, chấm màu nhỏ cho loại); nút phụ ("Xếp giúp tôi") nền `--brand-soft`; "Xem đề nghị" nền thẻ có chấm lavender. Đo bằng F23: ≤ 4 nền bão hòa khác nhau ở Tổng quan.
- **Bố cục chuyến đi ≥ 1280:** cột phải cố định 520 px (không co theo nội dung), bản đồ cao hết khung và vẽ theo cỡ thật; vùng cuộn là `.sheetbody`, giữ nguyên vị trí cuộn khi chọn ngày/sửa mục.
- **Thẻ quẹt ≥ 768:** tỉ lệ dọc (cao/rộng ≥ 1,3), rộng tối đa theo chiều cao khung.
- **Onboarding:** ảnh thật toàn khung của kho, lời mời đi (không liệt kê tính năng), câu mô tả lấy từ dữ liệu biên tập (bản nháp có nhãn).
- **Mã khôi phục:** "Để sau (chuyến đi vẫn được lưu)" khác "Hủy, chưa lưu chuyến đi"; sau khi nhập lại đúng có bước **Đã lưu mã** (xem lại, sao chép, tải .txt, in) rồi bấm Xong. Mã có hiệu lực ngay khi nhập lại đúng. Wander vẫn không giữ bản đọc được (DR-001).
