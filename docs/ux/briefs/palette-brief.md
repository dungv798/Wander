# Brief: bộ màu hệ thống mới cho Wander (DG-2, B1)

> Brief tự đủ, ghi lại theo `design-first.md`. Giao cho 3 agent UI (mỗi agent một hướng). Người đọc brief không biết gì về cuộc trò chuyện trước.

## Bối cảnh
Wander là app lập kế hoạch du lịch tiếng Việt (web, điện thoại 390 px là chính). Khám phá điểm đến bằng quẹt ảnh thật, gom thành chuyến, xếp theo ngày, chi phí, mời nhóm. Người dùng thấy giao diện hiện tại "trầm": nền **kem ấm `#fff8f0`**, thẻ be `#f6ece0`, chữ xanh đậm `#12233d`, bản tối xanh navy; màu loại địa điểm và màu ngày đậm, ngả trầm. PO muốn **tươi sáng, tươi mới, sặc sỡ, vàng hoặc xanh nhạt, không trầm**, "như Roameo" (một app du lịch). **Chỉ lấy gu, không sao chép** (không logo, minh họa, chữ của họ).

## Phát hiện từ đo ảnh tham chiếu (50 ảnh, đã đo màu thật)
- Nút chính: gradient ngang hình viên thuốc `#fe661a → #f44b06` (cam rực). **Gần như trùng cam hiện tại của Wander** (`--brand #f4511e`), nên **đừng bỏ cam nếu không có lý do**; khác biệt nằm ở nền và thẻ.
- Nền: **trắng + gradient xanh trời nhạt** (`#b5d7f0 → #e6f4fd`; tờ dưới `#daf2fc`; thẻ chia sẻ `#cae2fc`), không phải kem.
- Thẻ pastel nhiều màu trên nền sáng: đào `#ffe9d4`/`#fee4cd`, xanh lá `#d1f3da`, lam nhạt, tím nhạt.
- Nhãn từng ngày trên bản đồ: vàng `#fcd280`, tím `#ca82e9`, lục `#b0e0c5`, lam `#a7ccf5`, ngọc `#74e2d5` (ước lượng, có thể lẫn nền bản đồ), chữ trắng/đậm trên đó.
- Bề mặt "kính" mờ ở tờ dưới và thanh điều hướng nổi.
Dữ liệu từ DB của `ui-ux-pro-max` (`colors.csv` dòng 38, "Travel/Tourism Agency"): xanh trời `#0EA5E9` + cam phiêu lưu `#EA580C`, nền `#F0F9FF`, chữ `#0C4A6E`. Dùng như điểm tham chiếu, không bắt buộc.

## Ba hướng (mỗi agent nhận đúng một)
1. **`troi-xanh-cam`** — Trời xanh + cam: nền trắng/xanh trời nhạt, nút cam rực, thẻ pastel nhiều màu. Sát ảnh tham chiếu nhất.
2. **`nang-vang`** — Nắng vàng: vàng/hổ phách ấm làm chủ đạo (nền sáng ngả vàng nắng rực rỡ chứ không phải be/kem trầm), xanh nhạt làm màu phụ; nút vẫn phải đạt tương phản.
3. **`lai`** — Lai: nền xanh trời nhạt, vàng làm nhấn/huy hiệu, cam cho nút chính.

## Ràng buộc cứng
1. **Chỉ đổi màu.** Giữ cấu trúc token (tên biến), bố cục, bóng, gradient, huy hiệu tròn, chữ Baloo 2 + Be Vietnam Pro. Đây là look đã duyệt (DR-009).
2. **Truy cập WCAG AA:** chữ thường ≥ 4,5:1, chữ lớn/đồ họa/viền ≥ 3:1, cả sáng lẫn tối. **Vàng và xanh nhạt là nền, huy hiệu, vạch — KHÔNG làm màu chữ trên nền sáng**; chữ trên nền vàng/xanh nhạt dùng mực tối. Không chữ trắng trên vàng. Màu không là tín hiệu duy nhất (luôn kèm biểu tượng/nhãn).
3. **Bản tối** thiết kế cùng lúc (giảm bão hòa/nâng sáng, không đảo ngược), nền tối không quá đen/nâu; vẫn tươi.
4. Nút chính **cố định ở cả sáng và tối** (như hiện tại: `--cta`, `--on-cta`), chữ trên nút ≥ 4,5:1.
5. Màu "chờ duyệt" (`--warn-*`) phải **tách hẳn** khỏi vàng nhấn thương hiệu (không để người dùng nhầm "chờ duyệt" với "nhấn").
6. Không bịa thương hiệu, số liệu; không dùng logo/minh họa Roameo.

## Việc cần làm
Ghi **một tệp** `docs/ux/palettes/<id>.css` (`<id>` là mã hướng ở trên), **không sửa tệp nào khác**. Cấu trúc tệp giống hệt phần đầu của `docs/ux/prototype/app/app.css` (dòng 5–41): đọc nó trước. Cụ thể, tệp phải có đúng các khối sau, vì script kiểm tương phản đọc chúng:
1. `:root { … }` (sáng) với **mọi token** hiện có: `--cta --cta-hover --on-cta --sky-1 --sky-2 --bg --surface --surface-2 --ink --muted --line --brand --brand-2 --brand-ink --brand-soft --sun --sky --sky-soft --like --skip --warn-bg --warn-line --warn-ink --glass --scrim --shadow --shadow-float --d1…--d7` (giữ `--font-*`), **cộng token mới**: `--on-d` (màu chữ trên nhãn ngày, một giá trị dùng cho cả 7 ngày, ≥ 4,5:1 trên từng `--d1…--d7`), và cho mỗi loại `canh van am leo luu cho`: `--cat-X-b` (màu huy hiệu), `--cat-X-t` (nền nhạt), `--cat-X-i` (chữ/biểu tượng trên nền nhạt), `--cat-X-on` (biểu tượng trong huy hiệu).
2. Dưới đó `.cat-canh { --cb: var(--cat-canh-b); --ct: var(--cat-canh-t); --ci: var(--cat-canh-i); --con: var(--cat-canh-on); }` và tương tự cho 5 loại còn lại (giữ bản chất: mỗi loại một màu + một biểu tượng).
3. `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { …token tối… } }` và `:root[data-theme="dark"] { …token tối… }` — **hai khối tối phải giống hệt nhau từng token** (script sẽ lỗi nếu lệch). Chỉ ghi token cần đổi ở bản tối (các token khác kế thừa từ `:root`). Bản tối phải định nghĩa lại các `--cat-X-t`, `--cat-X-i`, `--cat-X-b`, `--cat-X-on`, `--d*`, `--on-d` nếu cần để đạt tương phản.
Kiểm: `node docs/ux/tools/contrast.mjs --css=docs/ux/palettes/<id>.css --pairs=docs/ux/tools/contrast-pairs-palette.json` phải thoát mã 0 (50 cặp × sáng/tối, 0 lỗi, 0 bỏ qua). **Lặp tối đa 5 lần** cho tới khi đạt; nếu không đạt, báo cặp nào và vì sao.
Đừng chạy máy chủ, đừng chụp ảnh (việc của bước sau). Không đọc/ghi ngoài `docs/ux/palettes/<id>.css`.

## Báo cáo trả về (≤ 250 từ, tiếng Việt)
Bảng 10–12 token chính (sáng/tối) kèm mã; một câu lý do cho mỗi lựa chọn lớn; kết quả `contrast.mjs` (dòng tổng); nơi bạn phải **thỏa hiệp** giữa "tươi" và tương phản; điều bạn nghĩ PO sẽ thích/không thích ở hướng này. Không bịa kết quả: dán dòng tổng của script.
