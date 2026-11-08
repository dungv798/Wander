# Điểm tiếp tục thực tế — 06/11/2026

## Nhiệm vụ và quyền

PO muốn chuyển UI React thật theo prototype palette B/harmony, giữ toàn bộ tính năng, animation/icon/button thống nhất. Claude Code viết web, Codex review + tuyển ảnh/dữ liệu. PO approve mọi việc thường, chỉ hỏi rủi ro thật. Tối đa 2 vòng phản biện; đang **vòng 1**, chưa dùng vòng 2. Không deploy/commit/push, đổi schema/dependency/API hoặc master plan. Không mở worker song song đè cùng file.

PO đã mở rộng: ảnh có hồn, chất lượng như bộ Pexels Hà Giang cho các nơi khác và toàn Việt Nam; thêm địa điểm trekking. Chi tiết: `nationwide-visual-data-2026-11-06.md`.

**Chỉ đạo mới nhất:** PO yêu cầu Claude xong phần hiện tại thì Codex nhận lại toàn bộ code/review/test, không cần Claude nữa. Cho worker `ui-review1-resume` bàn giao phần đang làm; **không gọi thêm lượt Claude, không mở review2 qua Claude**. Sau khi worker chốt, Codex được phép tự sửa web để hoàn tất. Hai vòng phản biện tối đa vẫn là trần, không phải bắt buộc dùng hết.

## Sai sót điều phối đã nói rõ với PO

Lịch 23:55 ngày 05/11 **CHƯA từng được tạo**. Không báo đã hẹn thành công. Lượt đầu Claude xong 22:50 05/11, không tự có lượt mới vào 23:55. PO đã được nhận lỗi ngày 06/11. Sau đó worker UI vòng 1 và backend bị dừng nhưng file status còn running; nguyên nhân "Interrupted" ở app chưa xác định. Không đổ cho PO hoặc kết nối khi chưa có bằng chứng.

Đã chuyển sang `tools/claude-handoff/launch-worker.ps1` dùng Start-Process Hidden; runner lưu PID và heartbeat 15s; `progress.mjs` phân biệt live/UNVERIFIED/stopped-with-stale-status. Luôn kiểm process/heartbeat, không chỉ đọc running/ready. Không có công cụ native tạo automation trong phiên này.

## Claude

- Lượt đầu `.logs/claude-handoff/implementation.md`: chỉ shell/map/token, thiếu detail/lịch/share/member và skill. Không coi đạt.
- Review 1: `ui-rollout-review-1-2026-11-06.md`, job `review1-job.json`, log `ui-review1.print.jsonl`. Đã gọi 4 Skill, viết lại Home/Dest/PlaceSheet, đang Trip khi tiến trình dừng. Session `10c31cac-22d3-4389-a7a0-438d72ec059b`.
- **Worker hiện tại:** job `.logs/claude-handoff/review1-resume-job.json`, id `ui-review1-resume`, model Sonnet, resume đúng session trên. Brief `ui-review1-resume-2026-11-06.md` có chỉ đạo trekking + dữ liệu đầy đủ. Launcher PID 2548, worker PID 3908 tại 02:15 UTC, phải kiểm còn sống trước khi dùng thông tin này.
- Đọc tiến độ: `node tools/claude-handoff/progress.mjs ui-review1-resume`.
- Kết quả dự kiến `.logs/claude-handoff/review1-result.md`. Chưa có, chưa được xem là xong.
- Owned của Claude: web/src, web/e2e, web/scripts và log bàn giao. Codex không sửa app trong lúc Claude làm. Có vài file obsolete Claude xóa bằng rm bị deny; không cần nới quyền xóa toàn hệ thống.

## Backend và kiểm thử

Docker Desktop đã bật (29.9.2). E2e lần đầu FAIL do Docker tắt, chưa chạy test. Backend preview dùng DB riêng **wander_e2e**, không DB dev. Phiên đầu đã mất process nên ready cũ không đáng tin. Đã khởi động lại bằng launcher lúc 02:15 UTC; đọc `.logs/claude-handoff/backend-ready.json` VÀ health thật. Parent launcher PID15808 lúc tạo, cần kiểm lại.

`backend-preview.ps1` build jar, tạo lại đúng DB test, chạy Java Hidden, cập nhật ready; dừng bằng tạo `.logs/claude-handoff/stop-backend-preview`. Không chạy e2e/dev.ps1 khác trong khi backend này giữ 8787. Khi chốt code/data: dừng preview đúng process, full e2e độc quyền + backend tests cần thiết, đọc log/JUnit thật; kiểm main screens/mobile/desktop/reduced-motion. Chuẩn bị review 2 dựa trên code + ảnh + tests cụ thể, không mở vòng 3.

## Dữ liệu — số liệu đã sửa

Mốc trước mở rộng mới: **136 điểm Discover** (không phải146), **1.434 POI phụ trợ** trong catalog/poi (Đà Lạt628, Hà Giang47, Hội An753, Tà Xùa5, Vĩnh Hy1), **85 moments** =50cũ+35mới,272 ảnh POI. Không nói 817 OSM Đà Lạt vẫn toàn bộ ở thử nghiệm: 817raw→631có tên→628đã nhập POI. Kho ảnh450 ID Unsplash/470 ID Openverse chưa khử trùng chéo. Báo cáo `../research/catalog-inventory-2026-11-06.md`.

Đợt35mới+9bìa+2ảnh chi tiết đã áp dụng, bảo toàn dữ liệu cũ. Công thức `../research/photo-candidates/curation-2026-11-05.json`, gallery/audit `../research/photo-candidates/curated-2026-11-05/`, report `../research/photo-curation-2026-11-05.md`. HCM ảnh20 có trẻ em đã bị loại ở duyệt lớn, thay33 quầy đồ uống (đã xác nhận metadata đúng TP.HCM), không bỏ ảnh baseline. 10POI còn thiếu ảnh chuẩn, không lấp bằng ảnh sai nơi/nhỏ.

**Mở rộng đang chạy:** `node tools/catalog/curation-wave.mjs nationwide`, log `.logs/photo-wave/nationwide-results.json`. Seeds mới `_national.mjs` + sa-pa/cao-bang/ninh-binh/ha-long/phong-nha/buon-ma-thuot/phu-quoc/can-tho. 7/8 đã có kết quả lúc 02:12, cần đọc kết quả mới. Mỗi nơi3–4điểm dự kiến; builder chỉ nhận cái tìm được; Lảo Thẩn chưa resolve và Cần Thơ chỉ có1/3. Dữ liệu mới và ảnh auto chưa được Codex duyệt bằng mắt, chưa claim toàn quốc hoàn tất. `monthLabel([])` trong build-catalog đã thêm nhãn trung thực "Xem thời tiết trước khi đi" để không bịa mùa cho nơi mới.

Lưu ý audit curation/inventory đang viết cho12tệp cũ: phải cập nhật để kiểm thêm8tệp mới (chỉ khi tên mới được phép, và bảo toàn tất cả12baseline), không tạo snapshot trước giả cho dữ liệu mới. Giữ nguyên catalog/poi1434; không nhập lặp.

## Chuẩn ảnh và research tiếp

PO nhấn mạnh chất lượng giống Hà Giang, không nhồi số ảnh. Pexels nguyên mẫu ở `docs/design/liquid-review-2026-11-05/assets/people/`, `prepare-people.mjs`. Đã mở và đọc Pexels License và Terms hiện hành (20/10/2026): ảnh cụ thể có trang Free download được dùng trong app, không bán bộ ảnh riêng/giả endorsement. API chưa có key nên không gọi API; chỉ tuyển các ảnh cụ thể đã đọc trang nguồn, download first-party có license, credit đầy đủ. Không crawler mạng xã hội hoặc tự tạo key. Local files đã được Photo schema hỗ trợ nên không cần thêm external host/CSP.

Ứng viên Pexels đã đọc trang/metadata (CHƯA tải/duyệt/nhập):
- HaGiang37970026 DuongNguyen, chợ6000×4000;16020286 PavithraSelvam người bán rau3648×5472 (cần xem có cận mặt quá không).
- HoiAn29374692 VõVănTiến quầystreetfood3042×4724;2010701 PragyanBezbaruah nướngstreetfood5184×3456;3024593 YuliaRozanova nướngxiên (chưa đủ metadata).
- SaPa235925 Pixabay ruộng/người7360×4783;36074826 HaneulTrac SunPlaza buổi tối4282×5710.
- NinhBinh28949259 ViettAnh đi thuyền3047×2286;28706862/28706867 chưa đọc được tác giả, không nhập khi thiếu credit.
Trang nguồn theo slug có thể tìm qua web; CDN ảnh thường `https://images.pexels.com/photos/<id>/pexels-photo-<id>.jpeg?...`, phải kiểm ảnh thật, tác giả/license/trang nguồn trước khi nhập. Không có ảnh Pexels mới nào đã được áp dụng vào catalog thật tới checkpoint này.

Trekking: dùng categoryleo có sẵn, không đánh đồng cáp treo/trek; không biểu diễn mốc đỉnh thành trailhead/GPX hoặc thời gian xe máy lên đỉnh. Nguồn đã đọc: TITC dantoc.vietnamtourism.gov.vn/nhung-cung-duong-leo-nui-khong-the-bo-qua-o-mien-bac/; vietnamtourism.gov.vn/post/66931(Bidoup26/02/2026); csdl.vietnamtourism.gov.vn/dest/?item=655(TàNăng50km nhưng không có đủ đầu tuyến hiện hành). LảoThẩn/Fansipan cần guide/đăng ký xác nhận, không bịa mở tuyến/giấy phép. Hiking UI đã được giao vào briefresume.
