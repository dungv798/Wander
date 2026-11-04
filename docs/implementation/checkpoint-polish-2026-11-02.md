# Checkpoint: hoàn thiện Wander sau trải nghiệm thật (02/11/2026)

Nguồn: prompt PO 02/11/2026; PO đã trả lời một lượt (U1, S1 bỏ ngưỡng cứng, dữ liệu 12 nơi ưu tiên 4 nơi yếu, X2 có chỉnh).
Không commit/push/deploy; không sửa master plan; không thêm dependency/schema/API.

## Phạm vi đã chốt
- U1 Home làm lại + tìm hai phạm vi (Điểm đến / Địa điểm tại <thành phố>); chưa chọn thành phố thì hướng dẫn, không mặc định Đà Lạt; catalog sẵn có.
- S1 xếp lịch theo cụm, không ngưỡng cứng 2 nơi/ngày; không ép chia đủ ngày; preview cho ngày trống; Undo; không gọi là tối ưu.
- Dữ liệu: cả 12 nơi, ưu tiên Tà Xùa/Hội An/Vĩnh Hy/Hà Giang; nguồn mở có ghi công; UNVERIFIED; tách biên tập khỏi POI tham khảo.
- X2: xuất ảnh hai kiểu (Tóm tắt / Theo từng ngày) bằng canvas hiện có; "Thêm ăn/nghỉ" ở mọi ngày; lịch mẫu 4 nơi ưu tiên, nhãn "Lịch trình tham khảo", độ dài/điểm xuất phát tùy nơi, không bịa giờ.

## Tiến độ
- [x] Làm tròn thời gian đường đi: tổng = cộng các chặng đã làm tròn (`geo.ts` roundTravelMinutes/formatTravelMinutes/sumRoundedMinutes, `tripMath.roadMinutes`, DayTab). Test xanh: geo.test, tripMath.test.
- [x] Copy Cài đặt (bốn cảnh giới thiệu; xóa chuyến đã có).
- [x] Xếp lịch S1: planDays.ts gom cụm (20 km chim bay), sức chứa 360 phút/ngày, ngày trống được báo, preview đổi ngày từng nơi; parseVisitMinutes đọc thời lượng catalog; test planDays/visitMinutes xanh
- [x] Ăn/nghỉ: nút "Thêm ăn uống / nghỉ" ở MỌI ngày (DayTab MealAddRow); nhắc chỉ 1 gợi ý nhẹ cuối timeline, có lý do, bỏ qua được
- [x] Thẻ chi phí gọn (CostBox) + CostDetailSheet (Theo ngày/Theo loại) + CostAddSheet (khoản mới chọn loại / nhập giá cho mục có sẵn); costView.ts có test
- [x] Tổng quan dashboard: UnassignedCard (3 preview, Xếp N nơi), PrepareCard, ManageMenu gập; OverviewSheets
- [x] Thêm nhiều nơi: checkbox tự vẽ dùng chung (.checkrow), ô tìm gọn, dòng "Đã chọn N nơi"; ảnh 320/390/430 đã chụp (.logs/polish/after/addmany--*.png), CHƯA thử tên rất dài
- [x] Chi tiết địa điểm: thực dụng trước, biên tập/đánh giá/ghi công cuối, đánh giá gập (2 lời bình); CHƯA chụp ảnh trước/sau
- [x] Quán gần: 5 quán, chọn mốc, tách cà phê, liên kết OSM, poiRank.ts có test; e2e mealsuggest xanh; CHƯA chụp ảnh
- [x] Map: đang tải, hết giờ 15 s, thiếu WebGL, lỗi → lý do + thử lại + OSM; kiểm bằng chặn mạng (abort/hang). Máy này tải bản đồ bình thường 3 s nên nguyên nhân bên bạn là môi trường (UNVERIFIED). CHƯA làm: chọn dòng → highlight ghim, tap card → highlight ghim ở màn chọn điểm đến
- [x] Home lần đầu (NationalHome: tiêu đề một lần, tìm, dải 168px, lưới 2 cột) + tìm hai phạm vi (#/destinations/places, catalog sẵn có, không đổi API); mood bỏ khối nền tối
- [x] Xuất ảnh: Tóm tắt / Theo từng ngày, chiều cao theo nội dung (1350–1920), cân trang (pageFit.ts), bỏ dòng "Chưa đặt giờ · Chưa biết giá"; e2e export xanh, preview == tệp tải (SHA-256); đã mở summary.png, days.png
- [~] Dữ liệu: dựng lại Hội An 5→7; Vĩnh Hy (5<6) và Tà Xùa (2) giữ bản cũ. Còn thiếu vì bộ dựng chỉ nhận nơi có bài Wikipedia kèm tọa độ và ảnh giấy phép mở. CHƯA làm: Hà Giang cụm, ăn/cà phê/nghỉ, lịch mẫu 4 nơi (chờ dữ liệu đủ tin cậy)
- [x] Regression e2e (xem Bằng chứng)

## Bằng chứng kiểm tra
- web npm test: 364 pass / 0 fail (đọc lúc xong xuất ảnh); eslint trips/discover/settings/shared: sạch; stylelint: sạch
- e2e export.e2e.test.ts: pass (backend jar 8787 + Vite). Ảnh: .logs/polish/after/*.png, .logs/polish/export/*.png
- web npm test 369 pass/0 fail; npm run build OK (maplibre chunk 298 kB gzip như cũ).
- e2e đầy đủ lượt 2: 89/97 pass; sau sửa test + mã: collab+trips 26/26, destinations/discover/ux-polish pass (lượt 3: 42/45, 3 lỗi đã sửa ở lượt 4). Còn đỏ, KHÔNG do đợt này: backend-production (jar chạy không có WANDER_WEB_DIR → 404) và fe9 "Cài đặt" (tìm tiêu đề onboarding "Có một nơi đang đợi bạn" đã bị gỡ khỏi src bởi bản onboarding chưa commit của bạn).
- Chưa chạy: backend gradle test (không đổi backend), Safari/cảm ứng thật/GPU.

## Cập nhật 03/11/2026 (sau DR-033)
- [x] T-A tách CSDL e2e: tools/dev.ps1 (Reset-E2eDb, WANDER_DB_URL → wander_e2e), guard web/e2e/backend.ts. dev.ps1 e2e: 96/97 pass (RESULT FAIL chỉ vì fe9 Cài đặt tìm tiêu đề onboarding đã bị gỡ); số dòng CSDL dev trước/sau GIỐNG HỆT (.logs/polish/dev-db-counts-*.txt), CSDL wander_e2e nhận dữ liệu thử. Bằng chứng dữ liệu thử lẫn trong dev: .logs/polish/dev-db-fixture-evidence.txt (không xóa).
- [~] D-A OSM: tools/catalog/probe-osm-candidates.mjs; ứng viên ở docs/research/osm-candidates (Hội An 90, Vĩnh Hy 22, Hà Giang 157; Tà Xùa probe lỗi, thử lại). CHẶN: backend Place.java:62 bắt buộc >=1 ảnh (PLACE_NEEDS_PHOTO) nên cần đổi luật miền + placeholder FE trước khi nhập nơi không ảnh; chưa làm.
- [ ] L-A lịch mẫu 4 nơi: chờ bước dữ liệu trên.

## Cập nhật 03/11/2026 (ảnh thật, DR-033 lượt 3)
- [x] Backend cho photos rỗng (Place.java); bìa điểm đến vẫn cần ảnh; catalog + ArchitectureTest xanh trên dữ liệu thật.
- [x] FE placeholder theo loại (thẻ quẹt, chi tiết, hàng/ghim dùng ô trung tính); thẻ quẹt xếp nơi có ảnh trước; ảnh chụp .logs/polish/photos/*.png.
- [x] Tách dựng địa điểm khỏi ảnh (build-catalog.mjs) + pipeline ảnh tools/catalog/photo-pipeline.mjs (candidates/sheet/apply). Đã bỏ tự gắn ảnh geo.
- [x] Độ phủ sau đợt này (đọc từ API thật): Hội An 13 nơi/12 có ảnh/36 ảnh (thiếu Nhà cổ Phùng Hưng: ứng viên toàn là ảnh nơi khác); Vĩnh Hy 8/8/18; Tà Xùa 4/3/9 (thiếu Thác Dải Yếm: Commons không có ứng viên đạt chuẩn); Hà Giang 9/9, 30 ảnh sau khi thêm 3 ảnh Cao nguyên đá; 8 điểm đến còn lại không đổi.
- Chưa làm: nhập thêm nơi OSM cho Hà Giang (cụm, 157 ứng viên) và Tà Xùa; lịch mẫu 4 nơi (L-A); lưu điểm crop/vai trò cover trong schema; ăn uống/cà phê/nghỉ cho 4 nơi; ảnh trước/sau gallery trên Home và ảnh xuất.

## Cập nhật cuối 03/11/2026 (DR-033 lượt 4: hoàn thiện trong một phiên)
- [x] Nhập nơi OSM: Hà Giang +13, Tà Xùa +1 (`import-osm-places.mjs`); Hội An dựng lại 16/18 (`osmAliases` trong seed); vị trí OSM_UNVERIFIED ghi ở docs/research/osm-additions.
- [x] Tuyển ảnh bằng contact sheet nhìn mắt (photo-pipeline.mjs); loại ảnh sai nơi và ảnh nhạy cảm (hộ chiếu/thẻ ngân hàng lẫn trong kết quả theo tọa độ).
- [x] Lịch trình tham khảo (trạng thái mới reference): Hội An 3, Vĩnh Hy 2, Tà Xùa 2, Hà Giang 4 (1 mới). Không dùng nơi vị trí chưa chắc.
- [x] POI ăn/cà phê/nghỉ OSM: Hội An (472 quán ăn, 208 cà phê...), Hà Giang quanh Đồng Văn (32/11/3/1), Tà Xùa 5 cà phê, Vĩnh Hy 1 cà phê (nguồn OSM mỏng thật). Backend nới: tâm POI trùng MỘT mốc tham chiếu.
- Độ phủ cuối (từ catalog): Hội An 16 nơi/15 có ảnh/40 ảnh (thiếu Nhà cổ Phùng Hưng); Vĩnh Hy 8/8/18; Tà Xùa 5/3/9 (thiếu Thác Dải Yếm, Cây cô đơn); Hà Giang 22/14/37 (thiếu 8 nơi OSM: Commons không có ảnh đúng nơi).
- Kiểm tra: backend-test đầy đủ PASS (dev.ps1, 120 s); web npm test 370/370; e2e qua dev.ps1 xem .logs/polish-final-e2e2.out.
