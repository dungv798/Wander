# Đối chiếu cấu trúc thẻ và chi tiết địa điểm

Ngày 30/10/2026. Phạm vi PO giao theo DR-029/030; căn cứ `roameo-spec.md` §6 và `.logs/home-v3/review.md`. Không thêm review cộng đồng, số sao, booking hay thay hành vi chọn địa điểm. Các đường dẫn được giao sạch khi bắt đầu; sửa đổi của job khác được giữ nguyên.

## Mẫu và bằng chứng 390×844

Đã xem trực tiếp [R31](crops/R31-full.png), [R34](crops/R34-full.png), [R03](crops/R03-full.png). R31 có tên ở đầu sheet, thông tin loại/địa chỉ, gallery ảnh dọc ngang hàng, thẻ takeaway và action kính đáy. R34 là vị trí cuộn sâu: thẻ thông tin, hàng icon/chữ, tags và action vẫn còn ở đáy. R03 là sheet khám phá trên bản đồ, chip bộ lọc và thẻ collection; **không phải mẫu deck quẹt toàn màn**. R05 chỉ dùng ghi nhận tile/chip từ đặc tả §6, không tuyên bố đã xem trực tiếp.

Wander thực hiện hướng PO giao: tên trên ảnh, gallery từng ảnh có n/m và giữ deck quẹt. Đây là thích nghi cấu trúc, không phải pixel parity với R31.

| Màn / địa điểm | Trước 390×844 | Sau 390×844 |
|---|---|---|
| Deck | [Ảnh](../../.logs/ux-cards/before/deck.png) | [Ảnh](../../.logs/ux-cards/after/deck.png) |
| Cột cờ Lũng Cú | [Ảnh](../../.logs/ux-cards/before/place-1.png) | [Ảnh](../../.logs/ux-cards/after/place-1.png) |
| Đèo Mã Pì Lèng | [Ảnh](../../.logs/ux-cards/before/place-2.png) | [Ảnh](../../.logs/ux-cards/after/place-2.png) |
| Sông Nho Quế | [Ảnh](../../.logs/ux-cards/before/place-3.png) | [Ảnh](../../.logs/ux-cards/after/place-3.png) |

![Board trước: deck và ba địa điểm](../../.logs/ux-cards/before/board.png)

![Board sau: deck và ba địa điểm](../../.logs/ux-cards/after/board.png)

Script tái lập: `.logs/ux-cards/capture.mjs before|after`. API giả từ `tools/look/capture-fixtures.mjs`, catalog/ảnh local thật, không seed DB, không dùng tile mạng để kết luận chất lượng bản đồ. Ba địa điểm có 3/4/4 ảnh. Fixture không có `away`, nên hiện hai chip và dấu chưa biết ở khoảng cách; không bịa km. Nhánh khoảng cách thật hiện chip thứ ba khi có dữ liệu.

Giới hạn đã tuân thủ: xem tổng cộng 5 ảnh bằng công cụ (ba mẫu + hai board). Board sau được xem trước lần sửa specificity chữ và rút nhãn Chọn; bản cuối đã chụp lại, đo DOM, không mở thêm ảnh vượt giới hạn.

## Bảng khác biệt và chỉnh sửa

| Tiêu chí | Khác biệt thật trước sửa | Kết quả / token |
|---|---|---|
| Vị trí tên | Tên dưới gallery, khu vực ở dòng riêng; R31 tên ở đầu sheet | Tên/loại/khu vực trên ảnh theo yêu cầu PO; tên 28px `--fs-2xl`, line-height `--lh-tight`, scrim chỉ từ đáy, không phủ tối đầu ảnh |
| Chip thông tin | Loại ở góc gallery; thời lượng và mùa lặp trong sáu ô lớn | Hai chip thời lượng/mùa trên ảnh, thêm km khi biết; dùng `Chip`, gap `--s-2` |
| Gallery | n/m đã có cho nhiều ảnh; ảnh dọc có dải đen do contain | Giữ hook/nút/phím/kéo, cùng bề rộng từng ảnh; n/m cả trường hợp một ảnh; cover để chữ nằm trên ảnh, có cắt ảnh dọc |
| Mật độ | Sáu ô thông tin cao; mô tả sau mẹo/bản đồ, rất sâu | Bốn hàng icon/chữ theo lưới hai cột; bỏ lặp buổi/mùa; mô tả giới hạn ba dòng và nút xem thêm |
| Thứ tự khối | Gallery → tên → biên tập → sáu ô → nổi bật → giờ/mùa → map → mẹo → mô tả → nguồn | Hero → biên tập → mô tả → thông tin nhanh → nổi bật → Giờ/Mùa/Đường đi/Mẹo thu gọn → nguồn thu gọn |
| Khoảng cách | PP gap12/padding16 đang có; riêng các ô nhanh vẫn cao | Giữ `--s-4`=16 padding sheet, `--s-3`=12 gap/thẻ, `--s-2`=8 hàng/icon; không thêm màu hex |
| Hành động | Thanh sticky trong vùng cuộn; mở OSM nằm sâu trong thân | Thanh kính ngoài vùng cuộn, giữ CTA của slot/Chọn/Bỏ qua; đưa liên kết OSM xuống đáy, nhãn ngắn Mở bản đồ; không tạo hành vi Thêm vào chuyến mới |
| Deck | Style appearance ghi đè tên xuống21px; nhãn Xem đã chọn dài | Tên36px `--fs-3xl`; 2–3 chip ngắn; nút Đã chọn · n, giữ accessible name cũ cho bàn phím/E2E |

Đo bản cuối trong `after/capture.json`: ba sheet rộng388px trong viewport390, không tràn ngang; gallery224→288px (`--gallery-height` + `--s-8`); tên ở y238,64 bên trong ảnh, cao35px. Thanh action y763..843, cao80px gồm đệm; deck có font36px, dòng45px. Các số này là DOM Chromium ở cấu hình fixture, không phải đo trên thiết bị thật.

## Hành vi và E2E

Không sửa `Sheet`, `PlaceSheetProvider`, `useGallery`, `useDeck`, hooks gesture hay history. Giữ nhãn dialog, `.gallery`, `.gcount`, `.rate`, nút Ảnh trước/sau, accessible name Xem đã chọn (n), Chọn nơi này; không cần đổi E2E discover. Esc/trả focus, đổi ảnh mượt, shared element, reduced-motion, hoàn tác giữ implementation cũ; **chưa xác nhận E2E runtime** vì yêu cầu cấm chạy.

Thêm `web/e2e/visited.e2e.test.ts`, seed thật theo mẫu `seed.ts`/bộ Hôm nay: ngày từ mẫu, ba địa điểm có giờ, một Task, một Rest; hai danh tính và join bằng invite. Assertion gồm: điểm kế tiếp chuyển, 0/3→1/3→0/3, Task không tăng tiến độ, Rest/Task không có Đã ghé, thành viên khác vẫn0/3 (UI và GET API), màn kết thúc lần lượt1/3 và0/3. Không skip âm thầm nếu seed thành viên lỗi. **NOT_RUN**, không khẳng định backend hay các assertion đã đạt.

## Kiểm thật và giới hạn

Đã dừng sau ba vòng kiểm, không sửa tệp ngoài quyền sở hữu.

| Lệnh | Kết quả đã đọc / log |
|---|---|
| `npm --prefix web run typecheck` | FAIL vòng3: `shared/map/geoRouteLayer.ts:20` TS2352 ngoài phạm vi; `.logs/ux-cards/typecheck-round3.log` |
| `cd web; node node_modules/eslint/bin/eslint.js .` | PASS exit0 toàn web ở lần kiểm cuối; `eslint-final.log` |
| `cd web; node node_modules/stylelint/bin/stylelint.mjs "src/**/*.css"` | PASS exit0; `stylelint-final.log` |
| `npm --prefix web test` | PASS 276/276; `test-final.log` |
| `npm --prefix web run build` | FAIL vòng3 cùng lỗi map trước khi Vite chạy; `build-round3.log`; gzip JS đầu bản mới **NOT_RUN**, không dùng số dist cũ |
| `node .logs/ux-cards/capture.mjs before` / `after` | PASS exit0; `before.log`, `after-final.log`, JSON mỗi thư mục; 0 pageerror trong capture |
| E2E visited/discover và toàn bộ E2E | NOT_RUN theo chỉ định |

Các lỗi typecheck/build thay đổi trong lúc job Trips/map đang sửa đồng thời; log từng vòng giữ riêng. Eslint vòng1 lỗi TripsScreen, vòng2 đã đạt. Các kết quả là trạng thái tại thời điểm chạy, không chứng nhận sửa đổi tiếp theo của job khác.

Còn lệch: gallery một ảnh lớn thay vì dải ảnh dọc R31; sheet rộng gần trọn màn thay inset8px; vẫn là deck trên ảnh thay nền map/collection R03; dùng icon/bảng màu Wander; chưa đo tương phản mọi ảnh, font lớn, Safari/Firefox, drawer desktop hoặc GPU thật. Không thêm community/rating giả để bắt chước mẫu.

Công cụ đã dùng: skill `tools/codex-skills/wander-implement/SKILL.md`, PowerShell, apply_patch, playwright-core/Chromium, công cụ xem ảnh. Graph MCP không có tool khả dụng; không delegate, không chạy E2E, không commit/push/deploy. Không phát sinh quyết định Tầng A mới trong gói này.
