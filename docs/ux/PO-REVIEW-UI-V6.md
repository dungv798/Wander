# Gói duyệt giao diện v6 (PO 26/10/2026, lần 2)

> Quyết định ghi ở `docs/decisions/DR-016-ui-v6-phan-hoi-lan-2.md`. Nghiên cứu: `docs/ux/research-ui-2026-10-26.md`, bản đồ: `docs/architecture/map-options.md`. Em **không** đóng DG-2, không commit, không đụng backend và `web/`.

## 1. Xem trước hết: so bộ màu bằng ảnh (2 phút)
Mở thẳng tệp **`docs/ux/screenshots/palette/compare.html`** (không cần máy chủ). 11 màn × 4 bộ × (điện thoại 390 px, máy tính 1280 px):
- **hien-tai**: Nắng vàng cũ đặt vào bố cục mới (để anh thấy "già" nằm ở màu hay ở bố cục).
- **bien-som** "Biển sớm": nền trắng ánh trời, xanh da trời, nút san hô-cam. Gần Roameo nhất.
- **nhiet-doi** "Nhiệt đới": xanh ngọc làm thương hiệu, nút san hô-hồng.
- **hoang-hon** "Hoàng hôn": tím violet, nút gradient hồng sang cam.
Cả ba đạt AA (`node docs/ux/tools/check-palette.mjs <tên>`). Đổi bộ màu chỉ là đổi một tệp token nên chọn xong em áp ngay.

## 2. Xem bản chạy thật (5 phút)
`node docs/ux/tools/serve.mjs` rồi mở (DevTools → thiết bị 390 px; thử bộ màu khác bằng cách dán nội dung `docs/ux/palettes/<tên>.css` vào Styles hoặc nhờ em áp):
- Giới thiệu: http://127.0.0.1:4177/?fresh=1 (cảnh 2 và 3 tự chạy ~9 giây).
- Trang chủ: http://127.0.0.1:4177/?fresh=1&intro=0 → cuộn: "Bạn đang mê gì?", **Lịch mẫu** (bấm "Dùng lịch này"), "Hà Giang trên bản đồ" → **Mở rộng** (kéo, chụm, chạm cụm số).
- Hà Giang → **Bắt đầu quẹt** (quẹt thật hoặc bấm nút; thử máy tính 1280 px).
- Chuyến đi mẫu (tab Chuyến đi): **kéo thanh nắm** để đổi 3 nấc; bấm Ngày 1/2/3 để thấy camera bay và tuyến vẽ dần.

## 3. Đã làm theo lời anh
| Lời anh | Việc |
|---|---|
| Màu già, thiếu sức sống | 3 hướng màu tươi + nền sinh động (đốm sáng trôi), nút gradient bóng kính, ô biểu tượng bóng kính; so bằng ảnh |
| Bố cục chưa bắt mắt, thiếu animation, hook, template | Làm lại trang chủ (mặt trời, mây, máy bay, quạt ảnh sống, ghim nổi, dải tên nơi, "Bạn đang mê gì?", **Lịch mẫu**, bản đồ), trang Hà Giang (số đếm lên, bản đồ, xem trước), giới thiệu 3 cảnh tự chạy; hook đổi luân phiên; tiêu đề hiện từng chữ; pháo giấy khi tạo chuyến; chuyển màn mượt (Chrome) |
| Quẹt: ảnh làm nền, nút/chữ đè lên | Thẻ **toàn màn** (điện thoại), nền mờ + thẻ dọc lớn (máy tính), dấu ✓/✕ bóng kính, nút nổi, thẻ sau lớn dần khi kéo |
| Chọn ngày quá nhiều màu | **Một màu nhấn** cho mọi ngày; chip "Ngày n" trung tính; tab ngày là viên thuốc; bản đồ làm mờ ngày khác |
| Map đơn điệu, nghiên cứu kỹ | Bản đồ địa hình **thật** (độ cao + đường sông OpenStreetMap), tô theo màu thương hiệu; ghim ảnh, tuyến vẽ dần có km, gộp cụm, camera bay; nghiên cứu phương án sản phẩm (AD-14) |

## 4. Số liệu kiểm (đọc từ log, `.logs/`)
| Kiểm | Kết quả (đọc từ log) |
|---|---|
| Luồng thử `flows.mjs` (`.logs/flows-final6.log`) | **22/22 đạt** (thêm F24 cho v6: bản đồ, tờ kéo bằng bàn phím, thẻ toàn màn, lịch mẫu, một màu cho mọi ngày) |
| Quét truy cập `a11y-scan.mjs --strict` (`.logs/a11y-final6.log`) | 320 trang: tương phản 0, thiếu tên 0, id trùng 0, h1 sai 0; **16 vùng chạm < 44 px** (thanh nắm tờ kéo 28 px) → đã sửa, quét lại 36 trang liên quan: **0 phát hiện**; chưa chạy lại đủ 320 trang sau sửa này |
| Tương phản token | `contrast.mjs` thư viện 122 và app 106: 0 lỗi; `check-palette.mjs` cho cả 3 bộ mới: 0 lỗi |
| Ảnh chụp | `shots.mjs` 540 ảnh, 0 lỗi console; `palette-shots.mjs` 88 ảnh so sánh, 0 lỗi |
| Phản biện độc lập | `wander-skeptic-qa` ×1 cho v6 (5 MAJOR đã sửa: đổi cỡ, lỗi tải, tờ kéo, phím, pháo giấy; cùng các MINOR chính). Chưa chạy `wander-product-analyst` và Taste cho vòng v6 |
| Dữ liệu bản đồ | dựng thật từ AWS Terrain Tiles (144 ô) + Overpass: 622 đường, 178 sông, 9 địa danh; `shade.webp` ~2 MB |

## 5. Còn yếu (nói thẳng)
- **Nền tối chưa chỉnh** (PO: để sau): chỉ giữ khung và sửa các lỗi tương phản rõ.
- Vuốt tờ kéo và quẹt thẻ **chưa thử trên cảm ứng thật** (chỉ trình duyệt giả lập); View Transitions chỉ chạy ở trình duyệt hỗ trợ (Chrome/Edge).
- Ảnh nền bản đồ ~2 MB cho một điểm đến; tuyến là cung đường chim bay chứ chưa theo đường thật; chưa có tìm kiếm địa điểm trên bản đồ.
- Vật thể "3D" là SVG gradient tự vẽ, chưa phải minh họa 3D thật như Roameo; muốn thật cần họa sĩ hoặc Lottie/Rive (Tầng A: dependency/tài sản).
- Lịch mẫu là bản nháp của em (3 lịch, nơi có thật, không giờ/giá); chưa có người biên tập.
- Màn rộng (≥ 768) của trang chủ vẫn dùng hero ảnh cũ, chưa chuốt như điện thoại (anh ưu tiên mobile).
- Chưa chụp 320 px, chữ 200%, ảnh lỗi cho các thẻ mới; chưa phản biện độc lập cho vòng v6 (xem mục công cụ).

## 6. Anh cần chọn (Tầng A)
> **Đã trả lời 26/10/2026 (DR-017): bộ màu = giữ hiện tại; AD-14 = (a).** Các mục còn lại đã trả lời cùng ngày: xem DR-018.
1. **Bộ màu**: bien-som / nhiet-doi / hoang-hon / giữ hien-tai. Khuyến nghị: bien-som hoặc nhiet-doi (không phải quyết định).
2. **AD-14 Bản đồ sản phẩm thật** (`map-options.md`).
3. **N-2 Lịch mẫu** có vào phạm vi không.
4. Còn mở: G1, G2, G3, G4, G5, F1–F4, A3, B2–B4, E1, Q-d, Q6–Q9, Q12.
