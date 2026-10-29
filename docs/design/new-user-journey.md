# Đi từ lần mở đầu tiên đến một chuyến đi dùng được

Khảo sát ngày 29/10/2026, tiếng Việt, Chrome headless, khung **390×844**, giao diện sáng. Đây là **nghiên cứu và đề xuất**, không phải quyết định sản phẩm hay xác nhận sẵn sàng phát hành. Không sửa mã sản phẩm.

## 1. Đọc kết quả thế nào

“Có chuyến” và “có lịch dùng được” là hai mốc khác nhau. Lượt đo sạch tạo chuyến Hà Giang, 31/10–02/11, có hai địa điểm nhưng cả hai còn **chưa có ngày**. Sau “Xếp giúp tôi → Áp dụng gợi ý”, chúng mới được phân vào ngày. Giá trị thu hút hiện nằm ở ảnh và thao tác chọn; cơ hội lớn nhất nằm ở việc đưa người dùng từ cảm hứng sang lịch có thể mang đi.

- **VERIFIED UI:** thao tác thật trong trình duyệt, ảnh và DOM tại [`.logs/journey/`](../../.logs/journey/). [journey.json](../../.logs/journey/journey.json) lưu thứ tự, chữ, kích thước, vị trí nút, trạng thái ảnh, các yêu cầu API và lỗi harness.
- **API giả:** catalog đọc bằng `readCatalog()` từ `backend/src/main/resources/catalog`; danh tính/chuyến/checklist/lời mời là fixture trong bộ nhớ. Không kết luận backend lưu bền, xác thực hay phân quyền đúng.
- **Bản đồ nền giả:** có marker và khung tương tác, không có bằng chứng địa hình, đường thật, dẫn đường hay chất lượng tuyến. Mảng `away` trong helper mẫu bị làm rỗng; dấu “—” về khoảng cách trong chi tiết **không được tính là lỗi dữ liệu sản phẩm**.
- Đã chụp mỗi chặng/trạng thái được kiểm tra; **chỉ xem 12 ảnh**: `01`, `04`, `06`, `09`, `16`, `21`, `25`, `45`, `47`, `51`, `60`, `63`. Các ảnh còn lại chỉ đọc DOM. Không suy ra chất lượng hình ảnh của ảnh chưa xem.
- Repo có công việc khác đang chạy: nguồn trang chủ được đọc cuối lượt đã thêm `DestinationRail`, khác ảnh trang chủ đầu lượt. Số thao tác dưới đây thuộc **snapshot đã capture**, cần đo lại sau khi các job ghép xong. Không gán bốn mục được loại trừ vào phát hiện: viền đen section, Trips thiếu Back, ô tìm kiếm trắng, trạng thái chưa chọn điểm đến/“Điểm đến khác”.

### Giới hạn và sai số cần biết

Harness ban đầu thiếu `/api/identity`, mã giả sai định dạng, shape thùng rác sai, thiếu preferences/events-seen. Những thông báo lỗi ở ảnh `18`, `19`, `63` và lần Undo `39` **không chứng minh lỗi sản phẩm**. Đã sửa fixture từng phần để tiếp tục việc độc lập; `fixtureNotes`, `unknown`, `errors` trong JSON giữ dấu vết. Lượt đo sạch bắt đầu lại onboarding trước `21`.

Khôi phục mục/Undo đã được bấm nhưng chưa xác nhận đáng tin cậy: có lần rơi vào ErrorBoundary; khi đóng phiên, output Vite có `Error: CurrentDestinationProvider` ở `useCurrentDestination`/`Shell` trong lúc các tệp app/provider đang thay đổi. Chưa xác định quan hệ nhân quả với thao tác Undo hay HMR; **UNVERIFIED**, không đưa vào bảng lỗi. Mời/join thật trên hai thiết bị, phê duyệt đề nghị xóa, thời hạn/mã dùng một lần, thu hồi phiên, mất mạng thật, tải ảnh chậm, tương phản WCAG và screen reader: **UNVERIFIED**. Không dùng số đo checkbox 22 px để kết luận vùng chạm nhỏ: cần đo cả nhãn.

## 2. Bản đồ hành trình và cảm xúc

Các câu trong cột cảm xúc là diễn giải của người khảo sát đóng vai người mới, **không phải phỏng vấn người dùng**. Tên ảnh bên dưới cùng nằm trong `.logs/journey/`.

| Chặng / bằng chứng | Mình đang cần gì ở đây? | Điều đã làm và kết quả | Wow hiện có → còn thiếu |
|---|---|---|---|
| Mở lần đầu, `01–03` | “Cho mình thấy vì sao muốn dùng app này.” | Đi qua ba cảnh onboarding; có Tiếp, Bỏ qua, Quay lại; CTA đầu 342×50 px. Danh tính chưa bị hỏi ngay. | Ảnh ruộng bậc thang, minh họa quẹt và lịch mẫu rất dễ hiểu → cảnh mẫu chưa nối thành chuyến của chính mình. |
| Trang chủ → điểm đến, `04–06` | “Mình chọn nơi nào và bắt đầu ở đâu?” | Tìm điểm đến → Hà Giang → bộ thẻ. Ảnh hero và category dẫn vào khám phá. | Ảnh lớn, thẻ theo sở thích, icon có màu → cần giữ cảm giác này khi chuyển sang form, tránh đột ngột thành công việc nhập liệu. |
| Quẹt / ảnh / lọc / chi tiết, `07–14` | “Nơi này có đáng đi? Chọn nhầm có sửa được?” | Chạm phải đổi `cot-co-lung-cu-1.jpg` sang `-2.jpg`, trái trở về `-1.jpg`; chọn, bỏ qua, Undo trong deck; kéo con trỏ sang phải chọn thẻ; lọc Văn hóa rồi trả Tất cả. Mở chi tiết có gallery, nhãn biên tập, mùa, mẹo. | Ảnh toàn màn và nút Chọn 72×72 px; có đường thay thế cử chỉ → thao tác đổi ảnh còn phải tự khám phá. Chuột/pointer đã thử; cảm ứng thiết bị thật chưa thử. |
| Đã chọn → Lưu, `15–17`, `21–25` | “Hai nơi mình thích sẽ thành lịch thế nào?” | Mở form dài, xác nhận, tạo danh tính, xem mã giả, nhập hai nhóm, xác nhận, Xong. Chuyến tạo được; hai điểm còn chưa gán ngày. | Không cần email/số điện thoại; giải thích quyền sở hữu → kết thúc chưa có màn chúc mừng kèm bước “xếp ngày” rõ và liên tục. |
| Tạo từng bước, `55–61` | “App có thể chỉ mình từng chút không?” | Chạy đủ Đi đâu → Khi nào → Ai đi → Sở thích → Ngân sách → Xem lại → Tạo. Kiểm UI chuyển bước; kết quả dữ liệu chuyến thứ hai không dùng để đánh giá do fixture dùng chung items. | Tiến độ 6 bước rõ → phải đi qua ba bước tùy chọn, khác hẳn form lưu địa điểm. |
| Tổng quan → ngày → mục / chi phí, `25–37` | “Ngày nào đi đâu, cần trả bao nhiêu?” | Xếp giúp tôi có preview và nói rõ đường chim bay; áp dụng; tab Ngày 1; mở rộng sheet; thêm mục ăn trưa giả 120 nghìn; UI hiện 120.000 ₫; chuyển mục lên đầu. | Có gợi ý thật ở FE, sửa tay được, nút sắp xếp 44 px → thiếu tổng kết mức hoàn thiện và gợi ý ăn/nghỉ dựa trên lịch. |
| Bản đồ, Hôm nay, `25`, `28–29`, `44–45` | “Ra đường rồi, một chạm làm được gì?” | Sheet nửa/mở rộng; marker có tên theo ngày. Hôm nay thật báo còn 2 ngày; bộ giả lập dev ngày 31/10 hiển thị lịch cùng link bản đồ. | Có màn dùng khi đi đường, không cần đọc cả chuyến → thiếu ảnh/việc kế tiếp và lối thoát khỏi vòng Back. Nền bản đồ thật chưa kiểm. |
| Xóa / Undo / thùng rác, `38–42` | “Mình xóa nhầm có lấy lại được không?” | Xóa làm mục biến mất, có toast Hoàn tác; thùng rác hiện tên, giải thích giữ tới xóa vĩnh viễn và nút Khôi phục. | Ngôn ngữ khôi phục rõ → kết quả Undo/restore chưa xác minh; không bấm xóa vĩnh viễn. |
| Mời / checklist / đề nghị, `46–50`, `70–72` | “Bạn mình vào đâu, cần chuẩn bị gì?” | Tạo link giả; không gửi ai. Thêm “Áo gió” rồi tích xong. Đổi fixture sang thành viên, mở địa điểm người khác thêm, gửi đề nghị xóa có lý do, nhận toast. | Có checklist từng người, quyền hành động theo vai → thuật ngữ Organizer còn lạ; công cụ nhóm nằm rất sâu trong tổng quan. Join/duyệt thật chưa kiểm. |
| Xuất lịch, `51` | “Mình muốn mang lịch đẹp này cho bạn xem.” | Có ba tab Ảnh/PDF/Lịch, preview theo ngày; tạo tệp disabled. | Có bản nháp cấu trúc → điểm kết thúc chia sẻ chưa có thành phẩm tải được. |
| Cài đặt / bảo mật / khôi phục, `62–69` | “Mất máy rồi lịch của mình còn không?” | Đọc trạng thái mã, thiết bị, hoạt động. Bỏ token giả để mô phỏng mất phiên; nhập sai báo lỗi; nhập mã fixture, nhận mã thay thế, xác nhận hai nhóm, trở về danh sách chuyến. | Không cần tài khoản truyền thống; nói rõ không thể xem lại mã → chỉ chứng minh UI, không chứng minh an toàn cơ chế. |

### Thời gian tới giá trị đầu tiên: đếm thao tác, không bịa giây

Nhánh đo sạch dùng hai nút Chọn, nhận mã ngay, giữ ngày mặc định. `firstValue.actions` lưu từng hành động.

| Mốc | Chạm tích lũy | Nhập liệu / thao tác ngoài số chạm |
|---|---:|---|
| Xong onboarding | 3 | Không |
| Chọn điểm đến, chọn hai nơi | 7 | Không |
| Mở Đã chọn, mở Lưu, Xác nhận | 10 | Có cuộn form để đến CTA |
| Hoàn tất nhận mã, tạo chuyến có khoảng ngày | **14** | **2 lần nhập nhóm mã**; chưa tính thao tác chép/lưu mã ra ngoài |
| Hai điểm đã gán vào ngày | **16** | Thêm Xếp giúp tôi, Áp dụng gợi ý |

Không gọi đây là “14 chạm tối thiểu”: chưa khảo sát mọi nhánh. Ngày mặc định chưa chứng minh người dùng chủ động chọn ngày. Cũng chưa thể gọi lịch là “đủ để khởi hành”: giá, giờ, ăn/nghỉ còn cần bổ sung. Không báo thời gian giây vì có thời gian điều khiển harness và đọc tài liệu giữa các bước.

## 3. Phát hiện có thể hành động

P0 = không thể đạt giá trị cốt lõi/mất dữ liệu đã chứng minh; P1 = cản trở đáng kể hoặc gây hiểu sai; P2 = tăng ma sát/chất lượng thị giác. **Không có P0 đã xác minh.** S/M/L là ước lượng tương đối cho một người hiểu code, không phải cam kết. Tầng A là thay đổi ý nghĩa/quyền/cơ chế, không đồng nghĩa mọi quyết định ưu tiên phải xin duyệt kỹ thuật.

Đường dẫn thành phần bên dưới bắt đầu từ `web/src/features/` nếu không ghi khác.

| Mã | Màn, bằng chứng và mô tả cụ thể | Mức / tác động | Đề xuất cụ thể | Công / cần PO, Tầng A? |
|---|---|---|---|---|
| J01 | Lưu từ Đã chọn, `16`: CTA Xác nhận tại **y=911**, ngoài khung 844; có 8 chip phong cách, 3 chip nhịp trước khi lưu. `trips/components/CreateTripSheet.tsx`, `TripFields.tsx`. | P1 / tiện lợi | Thu gọn tùy chọn; giữ ngày/tên và CTA cố định ở đáy sheet, bàn phím không che CTA; hiện rõ số nơi sẽ lưu. | M / không A nếu giữ nguyên dữ liệu và quy tắc |
| J02 | `16` so `55–60`: cùng tạo chuyến nhưng lưu nơi dùng form, “Tạo từng bước” là nhánh khác và không mang nhóm nơi đang chọn. `CreateTripSheet.tsx`, `TripWizard.tsx`. | P1 / tiện lợi, tính năng | Cho “Lưu các nơi này, tạo từng bước”; dùng cùng draft và summary, giữ nơi đã chọn khi Back. Không buộc đi lại từ Trips. | M / PO xác nhận luồng; A nếu đổi cách lưu các nơi/ngày, không tự quyết |
| J03 | `16`, `56`: 31/10–02/11 điền sẵn, lượt này không nhập ngày vẫn có chuyến được xem là có ngày. `TripWizard.tsx`/`initialDraft`, `TripFields.tsx`. | P1 / tiện lợi | Ghi “Gợi ý cuối tuần tới” ngay cạnh khoảng ngày; summary yêu cầu người dùng nhìn thấy khoảng ngày trước xác nhận. Giữ nguyên cơ chế ngày đã duyệt. | S / không A cho copy; đổi nghĩa mặc định/chưa chắc ngày là A |
| J04 | `25`, `41`: Chi phí nổi bật **0 ₫**, chú thích nhỏ hơn nói chưa tính 2 mục chưa biết giá. `trips/components/CostBox.tsx`; `45` dùng “Đã biết 0 ₫” rõ hơn. | P1 / tiện lợi | Khi tất cả chưa biết giá, tiêu đề tiền thành “Chưa có chi phí đã nhập”; khi có giá, hiện “Đã biết 120.000 ₫ · 2 mục chưa biết”. Không biến unknown thành 0. | S / không A, giữ D17/D18 |
| J05 | `25`: toast “Đã lưu…” nằm ngay trên vùng nút Xếp giúp tôi; DOM nút y=683. Mới thành công đã phải đợi mới đọc hành động kế tiếp. `trips/components/TripScreen.tsx`, `OverviewTab.tsx`; `web/src/shared/ui/Toast.tsx`. | P2 / tiện lợi, thị giác | Đặt toast ngoài vùng CTA; sau lưu mở sheet đủ cao để NextStep trọn vẹn, ưu tiên xếp ngày trước thống kê. | S–M / không A |
| J06 | `44`, `52`, `53`: Hôm nay → Xem cả chuyến → Quay lại quay về Hôm nay; lặp lại cùng kết quả. `trips/components/TodayScreen.tsx` dùng `navigate`, `TripScreen.tsx` dùng `goBack`. Khác vấn đề Trips thiếu Back đã loại trừ. | P1 / tiện lợi | Quy định lối về danh sách chuyến rõ; dùng replace cho chuyển ngữ cảnh Hôm nay/cả chuyến hoặc thêm CTA về danh sách, tránh tạo vòng lịch sử. | S / không A |
| J07 | `51`: biểu tượng chia sẻ dẫn tới màn xuất; Ảnh/PDF/Lịch đều có vẻ chọn được nhưng nút **Tạo tệp (chưa làm)** disabled. `trips/components/ExportScreen.tsx`. | P1 / tính năng, thị giác | Ưu tiên một định dạng ảnh dọc hoàn chỉnh có cover, ngày, số thứ tự, chi phí đã biết; tải được trước khi mở rộng PDF/Lịch. Trong lúc chờ, báo phạm vi preview ngay đầu màn. | M / PO ưu tiên; không đổi cơ chế chia sẻ/quyền. Link công khai là A riêng |
| J08 | `25`: ô checklist đầu ở y=1988, Người đi cùng y=2210, Đề nghị xóa y=2272 trong sheet mặc định. Có khả năng không được khám phá dù đã có tính năng. `trips/components/OverviewTab.tsx`, `ChecklistSection.tsx`, `PeopleSheet.tsx`. | P2 / tiện lợi, tính năng | Đưa shortcut “Chuẩn bị 0/1”, “Mời bạn” gần đầu; phần chi tiết vẫn ở dưới, đi bằng anchor/focus đúng vùng. | S–M / không A |
| J09 | `45`: mục chưa nhập giờ hiện **Cả ngày**; dữ liệu thời gian thực tế là null. `trips/components/TodayScreen.tsx`/`TodayItem`. | P2 / tiện lợi | Dùng “Chưa đặt giờ”; chỉ gọi “Cả ngày” nếu có lựa chọn mang nghĩa đó. Không tự gán giờ cho người dùng. | S / copy không A; thêm loại thời gian mới là A |
| J10 | `47`: vai chủ chuyến hiện **Organizer**, cạnh hai chữ “Bạn”. `trips/components/PeopleSheet.tsx`, copy trong `collab/model/collab.copy.ts`. | P2 / tiện lợi | Việt hóa “Người tổ chức”, chỉ một nhãn “Bạn”; có câu ngắn “Bạn quản lý lịch và lời mời”. Giữ nguyên role API. | S / không A |
| J11 | `06–09`: ảnh đổi bằng chạm trái/phải, có các vạch tiến độ nhưng không có hướng dẫn hiển thị trên thẻ. Runtime đổi ảnh đã PASS. `discover/components/deck/SwipeCard.tsx`, `discover/hooks/useSwipeDrag.ts`. | P2 / tiện lợi | Một lần đầu hiện gợi ý “Chạm hai bên để xem ảnh · vuốt để chọn/bỏ”; tự biến mất, không chặn nút. Gallery detail đã có nút nên không mô tả là thiếu toàn bộ điều hướng ảnh. | S / không A |
| J12 | `16`: cả khối form vàng, nhiều nhãn/chip gạch chân và bóng nổi cùng lúc; summary `60` trung tính, dễ phân cấp hơn. `trips/components/CreateTripSheet.tsx`/`PickedModes`, `TripFields.tsx`. | P2 / thị giác | Dùng nền trung tính cho form, chỉ radio/chip đang chọn mang màu nhấn, bỏ gạch chân ở nhãn không phải link; giữ màu thương hiệu đã duyệt. So trước/sau cùng viewport. | S / PO xem mẫu trước nếu chạm look đã duyệt; không tự thay nhận diện |

Không kết luận người dùng thật sẽ bỏ cuộc, tương phản không đạt hay animation giật: chưa có thử người dùng, phép đo màu hoặc trace chuyển động để chứng minh.

## 4. Mười ý tưởng tạo ấn tượng, xếp theo tác động/công sức

Tác động là **giả thuyết sản phẩm**, cần đo lại. “Theo mẫu” chỉ dẫn tới quan sát trong [`roameo-spec.md`](roameo-spec.md), không tuyên bố đã chạy app mẫu; ảnh tĩnh không chứng minh animation/haptic/âm thanh. Không bổ sung số sao, giá hoặc thời tiết bịa để làm đẹp.

| Hạng | Ý tưởng gắn với chặng đã thấy | Phiên bản cụ thể và lý do đáng làm | Nguồn / tác động / công / A |
|---:|---|---|---|
| 1 | **Lưu hai nơi thành lịch bằng một đoạn flow gọn**, J01/J02 | Cover gồm hai ảnh đã chọn, ngày, CTA “Tạo lịch”; tuỳ chọn xếp gợi ý có preview và sửa tay. Kết thúc đưa thẳng tới hai card theo ngày, không chỉ toast. | Thực tế `15–27`; tham khảo summary/lịch R17, không sao chép thuật toán mẫu. Cao / M / A nếu đổi thời điểm tự gán ngày |
| 2 | **Ăn mừng vừa đủ khi lịch thành hình**, J05 | Hai thumbnail bay về tab ngày tương ứng sau Áp dụng; hiện “2 nơi đã có ngày · bạn chỉnh được”; nút mở Ngày 1 nằm ngoài toast. Reduced-motion chỉ đổi trạng thái tức thời. | Thực tế `25–28`; chuyển động là đề xuất, không suy từ ảnh mẫu. Cao / S–M / không A |
| 3 | **Một ảnh lịch đẹp tải được**, J07 | Xuất ảnh dọc có hero catalog, ba ngày, tên nơi, khoảng giờ nếu đã nhập; phần giá ghi độ đầy đủ; preview chính là file tải, không nút giả. Giữ ghi công ảnh. | Thực tế `51`; roameo-spec §2 cũng ghi thiếu export nhưng bộ mẫu không chứng minh flow xuất. Cao / M / không A nếu xuất cục bộ, quyền không đổi |
| 4 | **Tổng quan đưa bước kế tiếp lên trước số liệu**, J04/J08 | Ba trạng thái có minh họa từ ảnh thật: chưa chọn → khám phá; đã chọn chưa xếp → preview xếp ngày; đã xếp → giờ/chi phí/chuẩn bị. Không xây empty state mới đè cái đang có. | Thực tế `20`, `25`, `41`; bố cục card gợi R17. Cao / S–M / không A |
| 5 | **Tiện ích Hôm nay đáng muốn mở lại**, J06/J09 | Card ảnh điểm kế tiếp, “Chưa đặt giờ” đúng nghĩa, CTA bản đồ và checklist còn thiếu; khi chưa đến ngày đi, dùng đếm ngược + chuẩn bị. Xử lý Back cùng lượt. | Thực tế `44–45`; không có bằng chứng widget Hôm nay tương đương trong UI-sample-2. Cao / M / không A cho in-app; widget OS là phạm vi A riêng |
| 6 | **Chuyển tiếp ảnh thẻ → chi tiết**, J11 | Dùng đúng ảnh đang xem làm phần mở đầu gallery; thu phóng cùng thumbnail thay vì thay cảnh đột ngột. Giữ số ảnh, focus và nút Đóng; tắt chuyển động khi người dùng yêu cầu. | Thực tế `07–09`; R31 gợi bố cục sheet/gallery, **không chứng minh shared-element của mẫu**. Vừa–cao / M / không A nếu không thêm dependency |
| 7 | **Sheet có lời mời kéo rõ**, J05/J08 | Đã có sheet nhiều nấc (`28–30`), nên thêm nhãn thoáng “Kéo lên xem lịch”, nhớ nấc khi đổi tab, CTA không che item. Kiểm 3 vị trí đóng/mở, không làm lại toàn bộ. | Thực tế `25`, `29`; bản đồ + sheet R11/R17 trong roameo-spec. Vừa–cao / S–M / không A |
| 8 | **Cảm giác chạm tinh tế, ảnh hiện êm**, J11 | Giữ hiệu ứng bay thẻ hiện có; thêm nhấn co nhẹ đồng nhất cho nút chọn, dấu tick ngắn; placeholder giữ tỉ lệ ảnh và fade sau decode. Khung xương tải **đã có** ở DestinationGate; thử làm nó cùng hình học thẻ thay vì tuyên bố thiếu. Âm thanh chỉ xem xét tùy chọn tắt mặc định, không tự phát. | `06–14`, thử delay `73–74`, nguồn `useSwipeDrag.ts`, `deck.css`; không có bằng chứng motion trong mẫu. Vừa / S–M / không A trong stack hiện tại |
| 9 | **Gợi ý ăn/nghỉ đúng khoảng trống**, lịch `27–34` | Sau xếp có ngày ít điểm và chưa có giờ/ăn/nghỉ: đề xuất “Thêm bữa trưa”/“Chừa khoảng nghỉ”, nhấn mở editor có sẵn với ngày được chọn. Chỉ nhắc, không tự chốt giờ/quán/giá; giải thích lịch hiện chưa tính thời gian đường thật. | Thực tế Add tự do/Nghỉ; R27 gợi thao tác chọn thêm theo ngày, không chứng minh meal AI. Cao / M / A nếu thay chính sách gợi ý hay thêm dữ liệu ngoài |
| 10 | **Nhập một link thành mục có nguồn, có bước xem lại** | Chặng `30–34` hiện phải tự gõ quán/chỗ ở; cho dán URL và tên, preview nguồn trước lưu, phát hiện trùng đơn giản. Giai đoạn đầu không dùng AI/OCR, không gọi server fetch tùy ý. | Thực tế nhập tự do; mẫu R18–R25, roameo-spec §2. Cao / M–L / **A: trường dữ liệu, xác thực URL, SSRF nếu fetch server** |

## 5. Top 5 nên làm trước và tiêu chí nghiệm thu

Các ngưỡng dưới đây là **mục tiêu đề xuất**, chưa phải số đo đã đạt. Nên tối ưu luồng có giá trị, rồi mới thêm trang trí. Kiểm lại với fixture sửa hoàn chỉnh và một vòng backend thật sau đó.

1. **Gọn hóa lưu chuyến, giữ địa điểm qua flow từng bước (J01/J02/J03).** 390×844 luôn thấy CTA trước khi cuộn khi chưa mở bàn phím; thông tin tùy chọn thu gọn; Back không làm mất hai nơi và ngày. Trên nhánh nhận mã đầy đủ như baseline, số chạm tới chuyến có ngày **không vượt 14**, tới nơi được gán ngày **không vượt 16**; ghi riêng nhập mã/chép mã, không bỏ bảo vệ đã duyệt để đạt chỉ tiêu. Nếu PO muốn tự xếp ngay, duyệt nghĩa hành động trước.
2. **Thoát vòng Hôm nay ↔ chuyến (J06).** Từ danh sách mở chuyến → Hôm nay → Xem cả chuyến → hành động về danh sách: tối đa 2 chạm; thử lặp 3 vòng và mở trực tiếp URL, đều có lối về danh sách rõ; không sửa lịch sử Git hay dùng đổi backend.
3. **Không trình bày chưa biết giá như chuyến miễn phí (J04).** Ba fixture: tất cả null → không có số 0 nổi bật như tổng chắc chắn; một mục 0 + một null → “đã biết 0 ₫, 1 chưa biết”; một mục 120 + một null → 120.000 ₫ cùng số mục thiếu. Included vẫn không cộng tổng. Xem thống nhất ở tổng quan, tab ngày và Hôm nay.
4. **Làm xong một định dạng xuất ảnh (J07).** Nút tạo tệp thực sự tải file PNG; tên chuyến, ngày, đủ hai địa điểm, ghi chú chưa biết giá và ghi công không bị cắt. Màn preview khớp file; nội dung dài và tên tiếng Việt không tràn ở 390 px. Chưa xuất PDF/Lịch thì nêu giới hạn trước khi chọn tab.
5. **Hiện hành động tiếp theo ngay sau thành công (J05/J08).** Ngay sau lưu, nút xếp ngày và số nơi nhìn thấy trọn vẹn, toast không đè CTA trong 100% trạng thái có toast; “Mời bạn” và “Chuẩn bị” đến được bằng tối đa 1 chạm từ đầu Tổng quan. Đo bounding box giao nhau ở 390×844 với sheet thấp/nửa/cao; mọi nút mới ít nhất 44×44 px.

## 6. Kiểm tra và bàn giao

- Công cụ đã dùng: skill [`wander-debug`](../../tools/codex-skills/wander-debug/SKILL.md) đã đọc và áp dụng; PowerShell, Node, `playwright-core`, Chrome, Vite, route interception, `view_image` (12 ảnh). Không delegate. Các công cụ Skill của Claude, code-review-graph, Taste và agent chuyên gia không có/không gọi trong phiên; không nhận là đã phản biện chuyên gia độc lập.
- Lệnh chạy: `node .logs/journey/serve.mjs` mở Vite và Chrome; các đoạn `action.js` được gửi bằng `powershell -File .logs/journey/run.ps1`. Log tổng hợp thật: `journey.json`; `node .logs/journey/checks.mjs` **PASS 10 kiểm tra bằng chứng, 73 ảnh đúng 390×844**, kết quả trong `checks.json`. Harness là công cụ khám phá tương tác, **không phải suite E2E tái lập hoàn chỉnh**; `action.js` chỉ giữ đoạn cuối, chuỗi hành trình nằm trong JSON và ảnh. Các fixture căn bản đã sửa trong `serve.mjs` sau lượt capture; không tuyên bố đã chạy lại toàn hành trình với phiên bản harness cuối.
- PASS UI: đổi ảnh trái/phải; chọn/bỏ/Undo trong deck; filter/chi tiết; lưu có mã + ngày; preview/áp dụng xếp ngày; thêm giá 120 nghìn; đổi thứ tự; mở thùng rác; tạo link thử; thêm/tích checklist; gửi đề nghị dưới vai thành viên; wizard 6 bước; khôi phục UI bằng mã mới; delay catalog có skeleton, 503 có lỗi và Thử lại tải được Hồ Hoàn Kiếm.
- NOT_RUN: build/lint/unit/E2E backend, do không đổi mã sản phẩm; Docker/backend/mạng ngoài theo giới hạn sandbox. UNVERIFIED: Undo/restore mục, join/duyệt giữa hai máy, quyền và lưu bền, đo tương phản, hiệu năng và điện thoại cảm ứng thật.
- Cần PO quyết định trong phạm vi đề xuất này: có tự xếp ngày lúc lưu không (khuyến nghị preview và xác nhận trước); có thêm import URL không (khuyến nghị lưu nguồn thủ công trước fetch/AI); có mở rộng widget hệ điều hành/link công khai không (khuyến nghị hoãn, hoàn thiện in-app/export cục bộ trước). Chưa thực hiện hay nâng thành APPROVED. Các hạng A khác toàn dự án không được audit lại trong nhiệm vụ này.
