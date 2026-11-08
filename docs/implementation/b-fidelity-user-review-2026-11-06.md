# Rà trải nghiệm và đưa app về demo B — 06/11/2026

## Chuẩn đối chiếu

Prototype gốc `docs/design/liquid-review-2026-11-05/panorama.html`, `APPROVED-LOOK.md`, `harmony-review/` và `people-data.mjs`. Không sửa demo để làm nó giống app. Phản hồi lần này yêu cầu ảnh thật trên ghim, thay cho sticker trong demo; đây là thay đổi có chủ ý duy nhất của ngôn ngữ map.

## Những điểm khiến trải nghiệm trước chưa đạt

1. **Vào Hà Giang thấy danh mục thắng cảnh trước, thiếu lý do để muốn đi.** Demo có đi chợ, một bữa sáng, bản làng và khoảng dừng. Implementation đã bỏ mất bốn thẻ này, chỉ để ảnh đời sống trong gallery cuối trang. Đã khôi phục đúng bốn trải nghiệm từ demo vào catalog, đưa lên đầu và cho chọn/lưu vào chuyến thật.
2. **Món ăn khó tìm và ngôn ngữ lọc khác B.** Đã dùng thứ tự Tất cả → Món ăn → Văn hóa → Thiên nhiên → Trekking; chợ được tìm thấy trong Văn hóa, trekking trong Thiên nhiên và mục riêng. Bộ lọc dùng chung cho danh sách, map và quẹt. Có lối cẩm nang ngay đầu điểm đến để xem món ăn/mùa/chuẩn bị.
3. **Quẹt giống một màn chức năng cũ được đổi nền.** Đã dựng lại theo B: header gọn, thẻ ảnh dọc với câu chuyện trên ảnh, dải Chi tiết phía dưới, hướng quẹt, Bỏ qua/Chọn và lối vào Đã chọn. Bộ lọc vẫn có trong menu ở tiêu đề, không chiếm thêm một hàng mặc định. Map tập trung vào thẻ đang xem với zoom vùng.
4. **Các màn lặp lưới ảnh và mất lựa chọn sau lưu.** Đã đổi Đã chọn thành danh sách ảnh nhỏ như B, đưa CTA tạo chuyến lên đầu; cả tạo nhanh và trình từng bước giữ bộ sưu tập sau khi lưu.
5. **Form dư khoảng trắng, viền đậm, nhãn/hint thay đổi tên truy cập của ô.** Form dùng chiều cao nội dung, có giới hạn theo bàn phím, footer Hủy/Tiếp tục chung. Đã gỡ CSS cũ ghi đè font/viền; ô nhập, checkbox, trạng thái chọn cùng hệ. Nhãn điều khiển tách khỏi hint/lỗi; lỗi ngân sách nằm cạnh ô và có `aria-invalid`.
6. **Ảnh đối chiếu không phát hiện tràn bên trong panel.** Rà thủ công thấy lưới `dbody` lấy min-content của hàng lọc làm cả danh sách tràn. Đã đặt cột `minmax(0, 1fr)` và kiểm cả `scrollWidth/clientWidth` của panel trong lượt trải nghiệm mới.

## Bản đồ

- Ghim địa điểm và điểm đến lấy ảnh thật từ catalog. Cụm dùng ảnh đại diện của một ghim bên trong và badge số lượng, không còn các vòng tròn số rỗng làm hình ảnh chính.
- Kho hiện còn **14 POI chưa có ảnh đúng nơi** (8 ở Hà Giang). Những điểm này vẫn có ghim/tên để mở chi tiết, chưa có thumbnail ảnh; không lấy ảnh Mã Pì Lèng gán cho Du Già. Vì vậy chưa thể nói 100% ghim đã có ảnh thật. Cần tiếp tục tuyển và xác minh ảnh cho đúng POI.
- Thêm nhãn Quần đảo Hoàng Sa, Quần đảo Trường Sa và mở khung nhìn cả nước về phía đông. Đây là **điểm đặt nhãn vùng**, không phải dữ liệu ranh giới hoặc POI du lịch. Lớp nhãn có trong mọi map dùng style chung; không bị phụ thuộc vào số điểm đến trong catalog.
- Nguồn tham khảo tên và cách thể hiện theo phía Việt Nam: [Cổng thông tin Bộ Ngoại giao](https://mofa.gov.vn/tin-chi-tiet/chi-tiet/viet-nam-co-day-du-bang-chung-khang-dinh-chu-quyen-cua-minh-doi-voi-hai-quan-dao-hoang-sa-va-truong-sa-10.html). Tọa độ trong code chỉ để đặt chữ gần vùng quần đảo, không được trình bày là ranh giới đã kiểm chứng.

## Ảnh Hà Giang từ demo

`tools/catalog/restore-demo-experiences.mjs` đọc trực tiếp `people-data.mjs`, sao chép ảnh đã tuyển và giữ tác giả/giấy phép/link nguồn. Bốn tệp Pexels: `29843930`, `16020286`, `30592067`, `37970026`; bản catalog có tiền tố `demo-people-`. SHA-256 của cả bốn bản sao trùng tệp demo. Không tải hoặc chọn ảnh thay thế cho các ảnh demo này. Bìa Hà Giang dùng lại Mã Pì Lèng như B; catalog Hà Giang có 26 thẻ.

Ảnh đời sống là ảnh minh họa vùng. Thẻ có nhãn “Mốc khu vực”; Chi tiết giữ lưu ý chưa xác minh đúng phiên chợ/quán/hoạt động. Không biến ảnh làng thành ảnh xác nhận của quán ăn. Các trải nghiệm vẫn cần người dùng chọn quán, kiểm ngày chợ, xác nhận cách tham gia trước chuyến đi.

## Kiểm chứng trong lượt này

- Unit cuối: `.logs/b-fidelity-unit-final.log` — **410/410 PASS**. Nhóm 16 kiểm tra map bên dưới là tập con, không cộng thêm vào 410.
- Lint/build cuối: `.logs/b-fidelity-lint-final.status`, `.logs/b-fidelity-build-final.status` — **PASS**. Build còn cảnh báo kích thước chunk MapLibre; không phải lỗi biên dịch.
- Browser E2E tuần tự: `.logs/b-fidelity-e2e-serial.log` — **96/104 PASS, 8 FAIL**. Không gọi đây là một lượt xanh. Các ca hỏng được sửa/kiểm lại riêng trong `.logs/b-fidelity-recheck.log`; dùng DB review `wander_e2e`, không reset DB.
- Ảnh hai kích thước: `.logs/claude-handoff/screens/b-fidelity-final/`; **42 màn/kích thước được chụp, 0 vấn đề** trong `.logs/b-fidelity-screens-verified.log`. Có thêm màn Món ăn và cẩm nang. Sau sửa vị trí nút, đã chụp lại 21 cảnh desktop và thẻ quẹt mobile (`b-fidelity-screens-desktop-verified.log`, `b-fidelity-screens-deck-verified.log`), đều 0 vấn đề. Sau sửa camera, chụp lại 18 cảnh map chính ở cả hai kích thước trong `b-fidelity-screens-camera-final.log`, **0 vấn đề**. Các ảnh được thay trong cùng thư mục, không trộn với thư mục ảnh r1.
- Đối chiếu B/app: `docs/design/liquid-review-2026-11-05/app-b-compare.html`, dựng lại từ thư mục ảnh trên: **18 màn × 2 kích thước**, giữ ảnh B gốc. Kiểm HTTP trả 200 cho trang và đủ **72 ảnh**, không có link ảnh hỏng.
- Đi trọn flow trên app build: `tools/review-b-user-journey.mjs`, kết quả/ảnh `.logs/b-fidelity-user-journey/`. Script dùng API chỉ để tạo danh tính thử; việc chọn nơi, tạo chuyến, xếp ngày và mở chia sẻ đi qua UI.

Lượt trải nghiệm production đã **PASS đủ 9 bước ở 390 px và 1440 px**, giữ 3 lựa chọn sau lưu, kiểm dữ liệu máy chủ và không có lỗi JavaScript/tràn ngang trong các panel. Ảnh ở lượt nhanh ghi cả trạng thái đang tải; lượt chụp cuối phải chờ giải mã ảnh và map sẵn sàng, không lấy khung đang tải làm ảnh giao diện hoàn thiện.

Lượt cuối sau sửa camera, cover và vị trí nút: `.logs/b-fidelity-user-journey-final.log` và `.logs/b-fidelity-user-journey/result.json` — **PASS 9/9 bước ở cả hai kích thước**. Có kiểm thêm nút tạo chuyến không che zoom và nguồn ảnh thẻ quẹt nằm ở góc phải. Đây là chuỗi thao tác UI với backend thật, không phải ảnh tĩnh của prototype.

Sau sửa padding tuyệt đối, `.logs/b-fidelity-camera-regression.log` — **5/5 PASS**: CSP/ảnh ghim production; ảnh/cụm/zoom/chạm ghim; thu/mở sheet mobile vẫn một canvas; chạm tuyến và gallery ở mobile/desktop; thêm điểm từ bộ quẹt sau khi bỏ qua một thẻ và kiểm map theo đúng thẻ mới. Lượt trải nghiệm cuối có thêm kiểm tra zoom xuyên suốt chuỗi mở quẹt nhanh để không bỏ sót camera đứng ở toàn quốc.

Lượt E2E/chụp chạy song song gặp timeout tải trang và đã dừng; không coi là kết quả xanh. Lượt tuần tự đã phát hiện lỗi thật của production: `MapLibre.loadImage` dùng fetch cho ảnh Unsplash trong khi CSP chỉ cho nhà cung cấp đó ở `img-src`. Sửa theo đường Image + CORS ẩn danh, **không mở rộng connect-src**; cần kiểm lại CSP và có thumbnail ngoài được đăng ký thật, không chỉ xóa cảnh báo hoặc giảm assertion.

Đường tải ảnh đã được tích hợp vào `MapLayers`. URL ảnh Unsplash dùng cho ghim được yêu cầu ở 96×96 thay vì 1000–1200 px; URL ảnh lớn trong thẻ/Chi tiết và tham số ghi nguồn `ixid` được giữ. Nhóm unit map sau sửa: `.logs/b-fidelity-map-unit-final.log` — **16/16 PASS**. Kiểm tra production `.logs/b-fidelity-production-final.log`: **1/1 PASS**, không có vi phạm CSP, có thumbnail ngoài được đăng ký thật. Không sửa header CSP hay nới assertion lỗi bảo mật.

Kiểm tra map cũ đòi mọi ghim đều có ảnh vì trước đây dùng sticker chung. Đã đổi để kiểm đủ các ghim nhìn thấy **mà catalog thật có ảnh**, không tính POI chưa có ảnh thành ảnh bị hỏng; vẫn kiểm cụm, zoom, chạm ghim và gallery. Test Alt+← trước đây phụ thuộc câu “Đã xem”; nay kiểm thẻ/số còn lại không đổi và kiểm thêm hoàn tác trong lúc thẻ đang bay. Đây là cập nhật hợp đồng theo B, không bỏ kiểm tra hành vi.

Các lỗi còn lại của lượt 104 ca: tên bộ lọc/selector của layout cũ, ID điểm đầu tiên đã đổi sau khi khôi phục trải nghiệm, một lỗi mạng `ERR_NETWORK_CHANGED`, và một lỗi HMR do mình sửa mã trong khi đang chạy test (`useToast` mất context). Lượt kiểm lại mở server mới với source cố định; không bỏ assertion lỗi JavaScript. Lần kiểm lại đầu tiên còn gọi production trước khi backend khởi động xong nên bị connection refused; phải chạy lại riêng sau trạng thái ready.

Kết quả kiểm lại: `.logs/b-fidelity-recheck.log` có **11 ca chức năng PASS**, 1 ca production bị gọi trước ready. Ca production chạy lại trong `.logs/b-fidelity-production-ux-final.log` đã **PASS**, gồm CSP và ảnh ngoài thực sự được đưa lên map. Nhóm UX chạy sạch cuối `.logs/b-fidelity-ux-verified.log` **5/5 PASS**, không còn cảnh báo React key. Cảnh báo trước đó do fixture test đưa ảnh bìa/khoảnh khắc dạng JSON thô vào DTO; đã sửa bộ chuyển fixture và kiểm URL ảnh của đủ 20 điểm đến. Lượt lỗi fixture trung gian được giữ trong log, không tính là app chạy thành công.

## Lỗi bổ sung chỉ thấy khi xem ảnh đã tải đủ

- Hàng Đã chọn kế thừa `aspect-ratio` và gradient của tile ảnh cũ: có mảng tối và khoảng trắng lớn dù flow vẫn chạy. Đã bỏ cả hai riêng cho hàng danh sách.
- Home mobile lấy sai phần map bị sheet che khi tính camera: phía bắc Việt Nam nằm sát mép dưới. Đã khớp inset với vị trí sheet thực tế; ảnh cuối thấy Việt Nam và hai nhãn quần đảo ở phần map trên sheet.
- `coverPhoto` độc lập ghi đè `coverPlaceId`: chỉ đổi ID chưa đủ để đưa ảnh Mã Pì Lèng từ B về Home. Công cụ khôi phục nay cập nhật cả ảnh/credit bìa; API thật trả `/catalog/photos/deo-ma-pi-leng-1.jpg`.
- Map bộ quẹt từng tự tính thẻ đầu từ quyết định chung, nên chế độ thêm vào chuyến có thể đứng ở điểm đã bỏ qua. Bộ quẹt nay phát đúng ID thẻ đang xem cho map; đổi ảnh trong cùng thẻ không làm camera bay lại.
- Nav desktop có nút tạo chuyến nổi như B; mobile giữ bốn hành động trong dock. Chia sẻ, thành viên, checklist, đề nghị, chi phí và xếp ngày vẫn còn trong app.
- Nút tạo chuyến nổi từng che cụm zoom ở desktop: đã đưa zoom lên trên và căn chung trục; kiểm hình học trong lượt trải nghiệm cuối. CSS glass cũ ghi đè nguồn ảnh thành `position: relative` cũng đã được bỏ để nút trở về góc phải của thẻ.
- Lượt thao tác nhanh phát hiện lỗi camera thật, không chỉ một khung đang chuyển động: Home về minZoom dùng `easeTo` có padding, rồi các lần `fitBounds` sau cộng padding mới vào padding đã giữ. Khung không đủ chỗ nên camera đứng ở toàn quốc dù ghim đã đổi sang Hà Giang. Đã đối chiếu implementation MapLibre 6.16 (`src/ui/camera.ts`): dùng **`absolutePadding: true`** trong cả phép tính và áp dụng fit, gồm fallback cả nước. Giữ map vùng khi bộ quẹt chưa phát ID đầu tiên, tránh yêu cầu fit với danh sách rỗng. Lượt trải nghiệm nay đợi đúng một ghim của thẻ đang xem, zoom vùng và không di chuyển; theo dõi chuỗi zoom để bắt lại lỗi nhảy toàn quốc, không chấp nhận screenshot chỉ có thẻ đúng mà map sai.

## Những cải thiện sản phẩm tiếp theo có giá trị

- Đặt trải nghiệm người thật ở đầu mỗi điểm đến theo cùng chuẩn Hà Giang, nhưng chỉ cho thêm vào lịch khi có mốc và thông tin hoạt động đủ rõ. Ảnh đẹp chỉ là điểm vào, không thay dữ liệu quyết định.
- Tăng ảnh món ăn thật và liên kết quán đã xác minh; phân biệt “muốn thử món này” với “đã chọn quán này”. Không tự gán một nhà hàng để lấp chỗ trống.
- Giữ khoảng đi đường, thời lượng và giá chưa biết dễ nhận ra trong lịch. Gợi ý xếp lịch phải mở xem trước trước khi thay lịch của người dùng.
- Hoàn thành riêng API link chỉ xem/sao chép chuyến, PDF/Calendar và nguồn review. Đây vẫn là phần thiếu; lượt làm lại giao diện không được tính là đã triển khai chúng.

Không deploy, không commit/push, không sửa master plan. Công cụ: `ui-ux-pro-max` (hướng dẫn local), `wander-verify` (đọc log thật), Playwright và ảnh chạy từ React/backend thật; không gọi Claude hay agent khác.
