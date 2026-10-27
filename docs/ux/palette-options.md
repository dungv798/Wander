# Ba bộ màu đề xuất (DG-2, B1–B2) — chờ PO chọn

> Brief: `docs/ux/briefs/palette-brief.md`. Tệp màu: `docs/ux/palettes/{troi-xanh-cam,nang-vang,lai}.css`. Ảnh thật 390 và 1280 px × sáng/tối × 10 màn × 4 bộ (gồm "hiện tại"): `docs/ux/screenshots/palette/` (mở **`compare.html`** để so cạnh nhau). Tạo lại: `node docs/ux/tools/palette-shots.mjs`.

## Đọc từ lần chạy (không từ báo cáo của agent)
`node docs/ux/tools/contrast.mjs --css=docs/ux/palettes/<bộ>.css --pairs=docs/ux/tools/contrast-pairs-palette.json`: cả 3 bộ **100 phép tính (50 cặp × sáng/tối), 0 lỗi, 0 bỏ qua**. `palette-shots.mjs`: 160 ảnh, 0 lỗi console. Chưa chạy `a11y-scan` trên bản đổi màu (việc của B3).

## Ba bộ
| | Trời xanh + cam | Nắng vàng | Lai |
|---|---|---|---|
| Nền sáng | `#f4faff`, trời `#b5d7f0 → #e6f4fd` (đo từ ảnh tham chiếu) | `#fff3c4` vàng nắng, trời `#bfe3fa → #ffec9e` | `#eef7fe`, trời `#b5d7f0 → #e6f4fd` |
| Nút chính | cam `#d93a0b` (như hiện tại) | hổ phách `#ff9d0a`, chữ mực tối | cam `#d93a0b` |
| "Chờ duyệt" | lilac `#efe9ff` | lavender `#ece3ff` | cam mơ `#ffe6c2` |
| Bản tối | navy `#0d2038` | navy ấm `#15223d` | navy `#0c2140` |

## Nhận xét thẳng sau khi xem ảnh
1. **Trời xanh + cam và Lai gần như giống nhau** trên màn thật (khác chủ yếu ở màu nhãn "đề nghị"). Coi như **một hướng**; Lai không cho thêm lựa chọn có ý nghĩa.
2. **Cả hai thay đổi rất nhẹ so với hiện tại** (chủ yếu nền kem → xanh trời nhạt). Cam nút gần như trùng cam hiện tại, vì ảnh đo cho thấy Roameo cũng dùng cam đó. Anh **không nên kỳ vọng** thấy "sặc sỡ" từ việc chỉ đổi token.
3. **Nắng vàng khác hẳn** (nền vàng nắng, nút hổ phách), đúng chữ "vàng" của anh, nhưng: mặt nền vàng phẳng nhìn hơi "mật ong"; bản tối có dải chuyển từ navy sang **nâu ô-liu ở giữa trời** (xem `nang-vang/app-explore--390-toi.png`), chưa đẹp; mất cam nên xa ảnh tham chiếu nhất.
4. **Bản đồ trong chuyến vẫn xanh lá/xanh dương cũ** ở cả ba bộ (vẽ cứng trong `app.js`). Màu ghim/tuyến đã đọc từ token, nên đổi theo bộ màu.
5. **Cái làm ảnh tham chiếu "tươi" không nằm ở token:** thẻ pastel nhiều màu (đào, xanh lá, lam, tím) ở đầu từng khối, nút gradient viên thuốc, nền kính mờ, biểu tượng 3D. App hiện có thẻ **trắng phẳng** và nút **phẳng** (PO chọn ở DR-009). Muốn "sặc sỡ" thật phải đổi **cách dùng màu trên thành phần**, không chỉ đổi giá trị token.
6. Thỏa hiệp bắt buộc để đạt AA: vàng sáng không thể là huy hiệu hay màu ngày trên thẻ trắng (cần ≥ 3:1), nên huy hiệu ẩm thực thành hổ phách đậm (`#c47c00`–`#cf7a00`) và nhãn ngày đậm hơn mẫu pastel.

## Vòng sửa theo lựa chọn của PO (25/10/2026): "Nắng vàng, sửa tiếp" + "thử gradient nhẹ" cho nút
Tệp `docs/ux/palettes/nang-vang-2.css`; kiểm: `contrast.mjs --pairs=docs/ux/tools/contrast-pairs-palette-2.json` → **104 phép tính (52 cặp × sáng/tối), 0 lỗi, 0 bỏ qua** (đọc từ lần chạy). Thay đổi so với `nang-vang`:
- Nền sáng bơ nhạt `#fff8d8` (bớt "mật ong"); trời `#8fd3fb → #ffe872` (xanh sang vàng chanh).
- **Bản tối bỏ dải nâu ô-liu**, trời navy → chàm `#1f4a7a → #2c3a73`.
- **Nút chính gradient ngang** hổ phách `#ffb01f` → cam `#ff6a00`, chữ mực tối `#2a1700` (9,40:1 và 5,99:1); các chấm/chip dùng `--cta` vẫn phẳng.
- Màu thương hiệu chữ (logo) cam đậm `#b84c00` thay vì nâu `#a85600`.
Ảnh: `docs/ux/screenshots/palette/nang-vang-2/` (đã xem 390 sáng + tối của Khám phá, Ngày, và 1280 của Chuyến đi). `compare.html` hiện so 3 bộ: hien-tai, troi-xanh-cam, nang-vang-2.
**Còn lại, nói thẳng:** nền sau của bản đồ trong chuyến vẫn xanh lá/xanh dương cũ (vẽ cứng); bản đồ ở 1280 để trống phía dưới (có từ trước, không phải do màu); chưa chạy `a11y-scan`, Taste và `flows.mjs` trên bản đổi màu (việc của B3 sau khi PO xác nhận).

## Việc cần PO quyết (Tầng A, hỏi bằng lựa chọn)
Chọn: (a) dùng bộ nhẹ (Trời xanh + cam) và chấp nhận thay đổi tinh tế; (b) Nắng vàng, sửa tiếp bản tối; (c) **vòng 2 táo bạo hơn**: thêm thẻ pastel nhiều màu, nút gradient, nền kính (đổi cách dùng màu trên thành phần, chạm DR-009 "nút phẳng" nên cần PO đồng ý rõ).
