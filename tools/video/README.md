# Quay hành trình Wander

Công cụ dùng Chrome cài sẵn + `playwright-core`/Vite đã có trong repo. Không thêm dependency, không gọi backend/DB, không chứa bí mật thật.

```powershell
where.exe ffmpeg
node tools/video/record-journey.mjs
# Máy có mạng: mở tile OpenFreeMap thật (API vẫn là fixture cục bộ)
node tools/video/record-journey.mjs --live
# Chỉ khi binary ffmpeg của Playwright đã có: lưu thêm raw recordVideo trong .logs/ux-video
node tools/video/record-journey.mjs --live --record-video
node tools/video/capture-hero.mjs
node tools/video/check-video-contrast.mjs
node tools/video/check-initial-js.mjs
```

Chạy từ root. `--record-video` dùng `recordVideo` với kích thước 390×844; Playwright đòi binary ffmpeg riêng ngay khi tạo page. Máy thực hiện không có cả ffmpeg trong PATH lẫn binary Playwright, vì vậy không thể xác minh nhánh này và không cài thêm binary. Bản phát hành hiện dùng Chrome CDP screencast JPEG → canvas MediaRecorder VP8 (1,1 Mbps, tối đa 25 fps), vẫn là pixel của app thật được điều khiển bằng Playwright. Viewport 390×844, deviceScaleFactor 1,5; video 390×844 để giảm dung lượng. Context có prewarm các route; chỉ thu đoạn hành trình sau prewarm, tránh màn trắng setup. Raw native recording, nếu bật, chứa cả setup; không dùng raw đó trực tiếp làm hero.

Đầu ra: `web/public/video/journey.webm`, `journey-poster.jpg`. Nhật ký `record.json` lưu mốc thao tác thực, số frame, dung lượng và pageerror. `frames.json` lưu thời lượng media đo bằng Chrome và độ sáng quét mỗi 0,25 giây. Thời gian thực có thể lệch kịch bản theo tốc độ máy; các bước chờ DOM thay vì dùng màn dựng giả. Con trỏ CSS và logo kết là lớp dựng quảng cáo duy nhất. Seed lịch trình là dữ liệu minh họa, không chứng minh thao tác vuốt tự động tạo lịch.

## Kịch bản hiện có và giới hạn

- 0–1,5 giây: bản đồ phẳng và 5 ghim ảnh thật của chuyến seed. **Chưa có hiệu ứng 5 ghim nổi lần lượt** vì ghim native nằm trong canvas chung.
- Khoảng 1,5–3 giây: chạm canvas thật → thẻ xem trước thật.
- Khoảng 3–4,5 giây: bộ thẻ thật, kéo chuột sang phải → chọn/thẻ bay; poster lấy từ bộ thẻ trước lúc kéo.
- Khoảng 4,5–6,5 giây: chuyển Ngày 1, có các điểm và tuyến native. **Tuyến tĩnh**: lần quay chuyển động gốc phát hiện `NativeRoute.ts:60` ném TypeError khi timestamp rAF đầu thấp hơn thời điểm bắt đầu. Tệp đó ngoài quyền sở hữu nên không sửa. Script bật reduced-motion trước khi chuyển tab; cần Claude sửa lỗi native rồi bỏ dòng `emulateMedia` này để quay tuyến vẽ dần.
- Cuối clip: nút Lưu hoặc gửi lịch trình → ảnh PNG thật → chữ Wander. PNG có thể hiện ngắn trên máy chậm; xem các mốc trong record.json trước khi duyệt quảng cáo. Không quay tính năng Mời bạn vì chọn nhánh xuất ảnh đã có.

Offline là nền tối giản, không thay đường hay tạo bản đồ địa lý giả. `--live` cho phép mạng để dùng style/tile thật; chưa kiểm nhánh này. Không đưa giá, sao, lượt xem, ngân sách hay thời lượng bịa vào fixture; các trường đó để null.

## Hero và kiểm tra

Chỉ tải mã video sau window load + requestIdleCallback; sau đó IntersectionObserver kiểm hero nằm trong viewport. Chỉ gắn video khi width ≥360px, không reduced-motion, không saveData. Trình duyệt thiếu requestIdleCallback giữ ảnh. Theo dõi thay đổi media query/connection; tạm dừng khi tab ẩn và giữ lựa chọn dừng của người xem. Video lỗi/tải chậm vẫn có ảnh hero cũ phía dưới. Nút dừng/phát có vùng chạm 44px và aria-label tiếng Việt. Copy video để trong model/heroVideo.const.ts vì shared/const nằm ngoài phạm vi được giao.

`capture-hero.mjs` là công cụ ảnh/probe cục bộ, không chạy suite e2e. Nó lưu hai ảnh 390×844, quét frame sáng/tối và kiểm dừng/phát, handler visibility, đổi reduced-motion, saveData, màn hẹp. Chỉ xem hai ảnh đã chụp. `web/e2e/herovideo.e2e.test.ts` đã viết nhưng **KHÔNG CHẠY** theo yêu cầu.

`check-video-contrast.mjs` chuyển thể phép quét pixel từ `tools/look/check-home-contrast.mjs`, đổi nguồn thành hai frame cực trị của clip và chuyển output vào vùng được phép. Quét hình chữ nhật văn bản (Range) cho nút, ẩn nét chữ/icon trước khi đo để không nhầm chính glyph/border là nền; thêm CTA, nút điểm đến và nút video. Không sửa công cụ gốc. `check-initial-js.mjs` giữ nguyên thuật toán `tools/look/check-initial-js.mjs`, chỉ đổi đường dẫn nhật ký vào `.logs/ux-video/`.

Ngân sách JS **chưa đạt** sau ba vòng: 170,60 KB gzip, gồm import tĩnh và modulepreload, so với giới hạn 170 KB. Build vẫn thành công. Không tuyên bố đạt LCP; chưa đo Lighthouse/LCP trên mạng giả lập.

Typecheck cuối bị TS2352 tại `web/src/features/trips/hooks/coverActions.test.ts:16` (tệp của công việc đồng thời ngoài phạm vi sở hữu); typecheck trước đó và ba build đã qua trước khi lỗi này xuất hiện. Giữ nguyên tệp đó để orchestrator xử lý. ESLint toàn web và stylelint cuối có exit 0.

## Nguồn ảnh / ghi công

Dữ liệu: `backend/src/main/resources/catalog/da-lat.json`; ảnh gốc nằm tại `backend/src/main/resources/catalog/photos/`. Không đổi backend và không tải ảnh ngoài. Clip dùng các địa điểm đầu catalog cho ghim/lịch, bộ thẻ hiển thị catalog thật. Danh sách ghi công đầy đủ cho ảnh Đà Lạt (bao gồm poster và các ảnh có thể hiện khi tái quay) bên dưới; tên tác giả, giấy phép và URL nguồn giữ nguyên catalog. Các màn app vẫn hiển thị cơ chế ghi công hiện có.

- Hồ Xuân Hương / ho-xuan-huong-1.jpg: Diane Selwyn; Public domain; https://commons.wikimedia.org/wiki/File:Xuan_Huong_Lake_08.jpg
- Hồ Xuân Hương / ho-xuan-huong-2.jpg: Trần Huy Phương; CC BY-SA 3.0; https://commons.wikimedia.org/wiki/File:Ho_Xuan_Huong_-_Huy_Phuong_1.jpg
- Quảng trường Lâm Viên / quang-truong-lam-vien-1.jpg: EA; CC BY-SA 4.0; https://commons.wikimedia.org/wiki/File:L%C3%A2m_Vi%C3%AAn_%C4%90%C3%A0_L%E1%BA%A1t.JPG
- Quảng trường Lâm Viên / quang-truong-lam-vien-2.jpg: Damian Vo; CC BY-SA 2.0; https://commons.wikimedia.org/wiki/File:L%C3%A2m_Vi%C3%AAn_square_(August_7,_2018)_(29079784067).jpg
- Chợ Đà Lạt / cho-da-lat-1.jpg: Roy Kim; CC BY 2.0; https://commons.wikimedia.org/wiki/File:Dalat_market,_Vietnam.jpg
- Chợ Đà Lạt / cho-da-lat-2.jpg: DHN; CC BY-SA 3.0; https://commons.wikimedia.org/wiki/File:Ch%E1%BB%A3_%C4%90%C3%A0_L%E1%BA%A1t_to%C3%A0n_c%E1%BA%A3nh.jpg
- Nhà thờ Con Gà / nha-tho-con-ga-1.jpg: qiv; CC BY-SA 2.5; https://commons.wikimedia.org/wiki/File:Cathedral_of_Da_Lat_(1).jpg
- Nhà thờ Con Gà / nha-tho-con-ga-2.jpg: qiv; CC BY-SA 2.5; https://commons.wikimedia.org/wiki/File:Cathedral_of_Da_Lat_(2).jpg
- Nhà thờ Con Gà / nha-tho-con-ga-3.jpg: Diane Selwyn ( talk ); Public domain; https://commons.wikimedia.org/wiki/File:Cathedral_of_Da_Lat_05.JPG
- Ga Đà Lạt / ga-da-lat-1.jpg: Diane Selwyn; CC BY-SA 3.0; https://commons.wikimedia.org/wiki/File:Da_Lat_train_station_37.jpg
- Ngôi nhà quái dị (Crazy House) / biet-thu-hang-nga-1.jpg: Tom Ravenscroft; CC BY 1.0; https://commons.wikimedia.org/wiki/File:Hang_Nga_guesthouse_02.jpg
- Ngôi nhà quái dị (Crazy House) / biet-thu-hang-nga-2.jpg: Diane Selwyn; CC BY-SA 3.0; https://commons.wikimedia.org/wiki/File:Crazy_House_-_loi_vao.JPG
- Ngôi nhà quái dị (Crazy House) / biet-thu-hang-nga-3.jpg: Michael Karavanov; CC BY-SA 3.0; https://commons.wikimedia.org/wiki/File:Crazy_House_in_Da_Lat_-_panoramio.jpg
- Thác Prenn / thac-prenn-1.jpg: Prenn; CC BY-SA 4.0; https://commons.wikimedia.org/wiki/File:Th%C3%A1c_Prenn,_062015.jpg
- Thác Prenn / thac-prenn-2.jpg: Bùi Thụy Đào Nguyên; CC BY-SA 3.0; https://commons.wikimedia.org/wiki/File:Th%C3%A1c_prenn.jpg
- Thác Datanla / thac-datanla-1.jpg: thalling55; CC BY 2.0; https://commons.wikimedia.org/wiki/File:Th%C3%A1c_Datanla.jpg
- Thác Datanla / thac-datanla-2.jpg: Du Tran; CC BY 2.0; https://commons.wikimedia.org/wiki/File:Datanla_Waterfall_1.jpg
- Thiền viện Trúc Lâm / thien-vien-truc-lam-1.jpg: The original uploader was Liftold at Vietnamese Wikipedia .; CC BY-SA 3.0; https://commons.wikimedia.org/wiki/File:Zen_Monastery_Truc_Lam_Da_Lat.JPG
- Thiền viện Trúc Lâm / thien-vien-truc-lam-2.jpg: Nguyễn Thanh Quang 05:43, 20 April 2007 (UTC); CC BY-SA 3.0; https://commons.wikimedia.org/wiki/File:ThienVienTrucLamDaLat_main_hall.JPG
- Thiền viện Trúc Lâm / thien-vien-truc-lam-3.jpg: Nguyễn Thanh Quang 05:47, 20 April 2007 (UTC); CC BY-SA 3.0; https://commons.wikimedia.org/wiki/File:ThienVienTrucLamDaLat_main_building.JPG
- Hồ Tuyền Lâm / ho-tuyen-lam-1.jpg: Diane Selwyn; Public domain; https://commons.wikimedia.org/wiki/File:Tuyen_Lam_Lake_01.jpg
- Chùa Linh Phước / linh-phuoc-1.jpg: Diane Selwyn; Public domain; https://commons.wikimedia.org/wiki/File:Linh_Phuoc_Pagoda_01.jpg
- Chùa Linh Phước / linh-phuoc-2.jpg: calflier001; CC BY-SA 2.0; https://commons.wikimedia.org/wiki/File:BUDDIST_TEMPLE_TRAIMAT_VIETNAM_JAN_2012_(6818228324).jpg
- Chùa Linh Phước / linh-phuoc-3.jpg: calflier001; CC BY-SA 2.0; https://commons.wikimedia.org/wiki/File:BUDDIST_TEMPLE_TRAIMAT_VIETNAM_JAN_2012_(6818230776).jpg
- Núi Lang Biang / lang-biang-1.jpg: Liftold ( thảo luận ); CC BY-SA 3.0; https://commons.wikimedia.org/wiki/File:%C4%90%E1%BB%89nh_Langbiang.JPG
- Núi Lang Biang / lang-biang-2.jpg: Liangu; CC BY-SA 3.0; https://commons.wikimedia.org/wiki/File:Lang_biang_au_mois_d%27ao%C3%BBt.jpg
- Núi Lang Biang / lang-biang-3.jpg: Tilamdong; Public domain; https://commons.wikimedia.org/wiki/File:Langbiang_Mountain.JPG
- Thung lũng Tình Yêu / thung-lung-tinh-yeu-1.jpg: Thienlt1993; CC BY-SA 4.0; https://commons.wikimedia.org/wiki/File:TLTY2.jpg
- Thung lũng Tình Yêu / thung-lung-tinh-yeu-2.jpg: Ho Tuan KIet; CC BY-SA 3.0; https://commons.wikimedia.org/wiki/File:Thung_L%C5%A9ng_T%C3%ACnh_Y%C3%AAu.JPG
- Thác Pongour / thac-pongour-1.jpg: Original uploader was Tú My at vi.wikipedia; CC BY-SA 3.0; https://commons.wikimedia.org/wiki/File:ThacPongour.jpg
- Thác Pongour / thac-pongour-2.jpg: Arian Zwegers; CC BY 2.0; https://commons.wikimedia.org/wiki/File:Pongour_Falls_(6226122698).jpg
