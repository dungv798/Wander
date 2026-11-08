# Đối chiếu B với app thật — 06/11/2026

> **Có lượt sửa tiếp sau phản hồi mới:** xem [Rà trải nghiệm và đưa app về B](b-fidelity-user-review-2026-11-06.md). Bốn trải nghiệm/ảnh Hà Giang đã khôi phục, ghim chuyển sang ảnh thật theo yêu cầu mới, Đã chọn đã giữ bộ sưu tập sau khi lưu. Những dòng khác biệt bên dưới là trạng thái ở lượt đối chiếu trước, không phủ định thay đổi mới.

## Đính chính

Lượt chuyển UI đầu tiên **chưa áp dụng đầy đủ bản B**. Kiểm thử chức năng xanh không chứng minh giao diện, điểm vào và cách nối màn đã giống thiết kế. Phản hồi của PO về nút, viền và flow là đúng. Không dùng báo cáo cũ để gọi phần thẩm mỹ đã được duyệt.

Tham chiếu: `docs/design/liquid-review-2026-11-05/APPROVED-LOOK.md`, `HARMONY-RESULT.md`, ảnh `harmony-review/`, và `panorama-feature-audit.md`. Không chỉnh prototype B để làm nó giống implementation.

## Sai lệch đã sửa trong lượt này

| Điểm | Trước lượt rà | Implementation hiện tại |
|---|---|---|
| Khám phá | Chọn điểm đến xong, Home biến thành trang riêng của nơi đó | Home luôn là toàn cảnh Việt Nam; lựa chọn điểm đến vẫn được nhớ |
| Tìm kiếm | Nằm trong vùng cuộn của bảng; kết quả đẩy thẳng vào quẹt | Thanh tìm nổi trên map; chọn kết quả mở điểm đến để chọn map/danh sách/quẹt |
| Chủ đề | Không có bộ lọc Home của B | Món ăn/Văn hóa/Thiên nhiên/Trekking dùng category thật, lọc cả thẻ và ghim; truyền sang điểm đến và quẹt |
| Desktop | Navbar ngang, bảng trái che vào vị trí rail khi đổi bố cục | Rail dọc, thanh tìm độc lập, bảng nổi trái; lịch dùng cùng vị trí với Khám phá |
| Mobile | Banner điểm đến và nhiều hàng nút đẩy trải nghiệm xuống quá sâu | Đầu trang điểm đến gọn; CTA quẹt/khay; lọc ngang, thẻ trải nghiệm xuất hiện sớm; giữ dock |
| Quẹt | Sân khấu ảnh tối của UI cũ | Thẻ nổi trên bản đồ hiển thị; nút chọn/bỏ qua, undo, phím tắt, đổi ảnh, chi tiết và hết thẻ được giữ |
| Chi tiết | Hộp hẹp cả desktop; cách mở khác nhau theo màn | Một modal chung; desktop rộng hai cột, mobile ảnh dọc cạnh facts; giữ ảnh gốc, nguồn, nội dung, map và đánh giá |
| Chọn cho chuyến | Chỉ chọn vào khay rồi phải tự tìm đường sang tạo chuyến | Nút trực tiếp trong Chi tiết: tạo mới / thêm chuyến cùng điểm đến / để sau; form có focus riêng |
| Sau lưu | Có mục chưa xếp nhưng mở Tổng quan | Có địa điểm vừa thêm thì mở Chưa xếp; chuyến trống vẫn mở Tổng quan |
| Lịch ngày | Ngày/Giờ là hai pill rời, nhiều hành động đứng trước nội dung | Ngày/Giờ gắn chân thẻ; thứ tự cạnh tên ngày; thêm nhiều nơi nằm sau danh sách |
| Chưa xếp | Render chip của tất cả ngày trên từng thẻ | Hai ngày nhanh và picker Ngày khác; gợi ý và chọn nhiều chung hàng |
| Chia sẻ | Nút Chia sẻ lịch đi thẳng sang export | Chọn cách: mời/cộng tác hoặc gửi ảnh lịch trình; phân biệt quyền truy cập với ảnh tĩnh |
| Thành viên | Thiếu lối từ Người đi cùng sang các việc nhóm của B | Thêm lối sang checklist và đề nghị; vẫn dùng quyền và API thực |
| Điều khiển | Viền mực + pseudo rim, có nút nhận border outset của browser; tag đọc bị cao như nút | Một chủ sở hữu vật liệu B; nút chính viền sáng, phụ viền nhẹ; reset border browser; tag đọc tách khỏi vùng chạm 44 px |
| Map | Màu pha từ token cũ, raster relief tối, ghim ảnh khác bộ icon | Màu đất/biển lấy từ B, bỏ raster tô bóng; sticker category cùng bộ danh sách/chi tiết; tuyến vẫn có số thứ tự |

## Phủ tính năng, không đồng nghĩa mọi flow của prototype đã có backend

| Nhóm trong bảng phạm vi B | Đường vào app / trạng thái |
|---|---|
| Khám phá, tìm kiếm, chủ đề, cẩm nang | Home → điểm đến → lọc/cẩm nang; dữ liệu catalog thật |
| Quẹt, nút tương đương, undo, đổi ảnh, hết thẻ | Điểm đến → Quẹt khám phá |
| Chi tiết, thời lượng, mùa, mức độ, highlights, mẹo, nguồn | Thẻ/ghim/quẹt/lịch → cùng Chi tiết |
| Khay, tạo mới, thêm chuyến có sẵn, để sau | Đã chọn → lưu; hoặc Chi tiết → Chọn cho chuyến |
| Tạo theo bước, ai đi, sở thích, phong cách, nhịp, ngân sách | Form nhanh → Tùy chọn thêm / Tạo từng bước; giữ dữ liệu có sẵn |
| Chưa chắc ngày, sửa ngày/số ngày, cắt ngày giữ mục | Form / sửa chuyến; luồng giữ mục và xác nhận cũ được giữ |
| Lịch mẫu | Điểm đến → lịch tham khảo → xem trước / dùng khung |
| Gợi ý xếp, xem trước, chỉnh, áp dụng, undo | Tổng quan/Chưa xếp → Xếp N nơi; không thay lịch trước khi áp dụng |
| Tổng quan, ngày, thứ tự, map đánh số | Bốn chế độ và tầng chọn ngày riêng |
| Mục tự do, 9 loại, nghỉ, việc, giờ/thời lượng/ghi chú | Lịch → thêm/sửa mục; không gán giá cho nghỉ/việc |
| Bữa ăn, nghỉ, POI gần lịch | Cuối ngày → Thêm ăn uống/nghỉ; giữ nguồn POI và API đã có |
| Giá trống/0/bao gồm/tham khảo, đặt chỗ, ngân sách | Trình sửa mục và Chi phí; không đổi hợp đồng tiền |
| Xóa, undo, thùng rác, khôi phục, xóa vĩnh viễn | Trình sửa / quản lý chuyến; quyền thật ở máy chủ |
| Hôm nay, chuẩn bị, chỉ đường | Tiện ích chuyến; checklist từ Tổng quan hoặc Người đi cùng |
| Bìa, mô tả, sửa chuyến | Nút sửa / quản lý; không bỏ công cụ chọn bìa |
| Onboarding, settings, identity, recovery, thiết bị | Giữ các tuyến thật; profile desktop dẫn vào Settings |
| Mời nhóm, thành viên, quyền, gỡ/rời | Chia sẻ → Mời; hoặc bìa → Người đi cùng |
| Đề nghị/duyệt | Người đi cùng / Tổng quan → Đề nghị xóa; đúng phạm vi API hiện có |
| Checklist từng người | Người đi cùng → Chuẩn bị; mỗi người tự tích, giữ tiến độ nhóm |
| Xuất | PNG thật; **PDF và Calendar vẫn chưa triển khai** |
| Import MXH/Google, Passport, AI, thời tiết | Backlog đã ghi trước đây; không thêm nút giả vào nav |
| Con người, văn hóa, trend/cộng đồng | Ảnh/moments biên tập được giữ; **chưa có feed cộng đồng/trend thật** |
| Đánh giá Google | Link nguồn trong Chi tiết; **chưa có API/preview review nhúng** |
| Rỗng/lỗi/offline/xung đột/quyền/trợ năng | Giữ hạ tầng và UI trạng thái; kiểm lại qua browser tests |

## Những điểm còn khác B cần nói thẳng

- **Link chỉ xem và tạo bản sao chuyến:** demo có mô phỏng local, app chưa có API chia sẻ bản xem chỉ đọc. Mời vào nhóm và gửi PNG không được tính thay cho hai flow này. Chưa triển khai trong lượt chỉnh UI này.
- **Chọn một “khoảnh khắc” thành trải nghiệm:** demo ghép một số nội dung cảm hứng vào các thẻ chọn được. App dùng POI thật và gallery moments; chưa chuyển toàn bộ moments thành hoạt động có thể thêm trực tiếp vào lịch. Ảnh không khí không đủ để tự suy ra tọa độ/giá/thời lượng.
- **Khay sau khi lưu:** app vẫn gỡ những nơi vừa lưu khỏi khay tạm theo logic cũ; B có giữ bộ sưu tập. Đây còn là sai khác hành vi, không được gọi đã port nguyên vẹn.
- PDF/Calendar, preview Google và feed cộng đồng chưa có ở implementation; không bị xóa khỏi phạm vi tương lai.
- Map đã cùng palette/sticker, nhưng chưa có công tắc soft relief và hoạt cảnh cụm giống hoàn toàn prototype. Ảnh/cỡ chữ/metadata thật làm một số màn khác mẫu; chưa có duyệt thẩm mỹ mới của PO.

## Bằng chứng kiểm tra

Lượt cuối cần đọc riêng log `b-parity-*`; không cộng kết quả lần chạy cũ hoặc lần bị HMR làm mất giá trị vào lượt cuối. Browser E2E dùng backend thật trên DB `wander_e2e` đang phục vụ review, không reset DB. Không gọi là một lượt `tools/dev.ps1 verify` đầy đủ.

- Lint toàn bộ và build cuối **PASS**: `.logs/b-parity-lint-final.log`, `.logs/b-parity-build-final.log`; không tính cảnh báo chunk MapLibre lớn là lỗi biên dịch. Bản sửa camera cuối có lint riêng `.logs/b-parity-map-lint.log`.
- Unit sau đổi scene: `.logs/b-parity-unit.log`: **402 PASS, 0 FAIL**.
- Lượt E2E toàn bộ `.logs/b-parity-e2e-final.log`: **100/105 PASS, 5 FAIL**. Không ghi lại thành một lượt toàn bộ xanh. Các lỗi được sửa rồi kiểm lại trong `.logs/b-parity-recheck.log`: **47/48 PASS**; lỗi còn lại là nhãn select gồm cả nội dung option, đã sửa `aria-labelledby` ở `Field`.
- Nhóm kiểm tra sau sửa nhãn select: `.logs/b-parity-final-controls.log`: **9/9 PASS**, gồm thêm trực tiếp một nơi vào chuyến, map/tuyến ở 390/1440 px, chủ đề truyền sang quẹt, focus lồng nhau và viền điều khiển. Các lượt có ca trùng nhau, không cộng số PASS thành một tổng giả.
- Rà ảnh phát hiện riêng lỗi camera ở `un`/`cost`: `Number(tab)` trả `NaN`, dẫn đến danh sách fit rỗng. Map hiện chỉ lấy chỉ số ngày ở chế độ Lịch; các chế độ khác fit toàn chuyến. Regression thật `.logs/b-parity-map-regression.log`: **1/1 PASS**, chạy cả 390/1440 px, kiểm tra Unassigned có ghim rồi thao tác tuyến ngày → thẻ nổi → chi tiết. Chụp lại cả Unassigned/Cost/Day ở hai kích thước: `.logs/b-parity-screens-map-final.log`.
- Ảnh cuối: `.logs/claude-handoff/screens/b-parity-review-final/`. Lượt đủ 36 ảnh có **0 vấn đề** (`b-parity-screens-final.log`); 22 ảnh chụp lại sau tinh chỉnh vật liệu cũng **0 vấn đề** (`b-parity-screens-touchup.log`); 6 ảnh sau sửa camera cũng **0 vấn đề** (`b-parity-screens-map-final.log`). Harness hiện chờ map của chuyến sẵn sàng như map Khám phá.
- Bản so sánh dùng ảnh B nguyên gốc và ảnh app thật, không dựng lại hình tham chiếu: `http://127.0.0.1:5190/app-b-compare.html` sau khi build artifact.

Chưa deploy, không commit/push, không đổi master plan. Máy chủ review đã được mở lại bằng `-PreserveData` khi hết hạn, không reset những chuyến đang dùng để review.
