# Danh sách việc pha FE (kế hoạch: `plan-fe.md`)

Quy ước: mỗi lát có tiêu chí và cách kiểm; một lát chưa xong thì không sang lát sau.

## Cụm A — nền
- [x] **FE-0 Khung dự án.** (xong 26/10/2026) Cấu trúc `app/ features/ shared/ styles/`, `shared/const/*.const.ts`, `tokens.css`, router hash, lint (G3), script `typecheck/lint/test/build`. *Tiêu chí:* `npm run build` xanh; lint chặn thiếu TSDoc, số ma thuật, hex ngoài token; ranh giới thư mục bị ép. *Kiểm:* các lệnh ở trên, đọc từ log.
- [x] **FE-1 Lớp miền + kho API giả.** (xong: Money, DateRange, RecoveryCode, kho Catalog giả, PersistentStore, ApiError, useResource; còn lại cho FE-5…7: kho chuyến đi, errorMessages) `Money`, `DateRange`, `RecoveryCode`, `TripRepository`/`CatalogRepository` (+ `Local*`), `ApiError` + `errorMessages.const.ts`, `useResource`. *Tiêu chí:* test `node --test` cho D17/D18 (rỗng/0/đã bao gồm), định dạng ₫, khoảng ngày ≤ 366, chuẩn hóa mã.
- [x] **FE-2 Thành phần dùng chung.** (xong phần cần cho khám phá: Icon, Button, IconButton, Chip, EmptyState, ScreenSkeleton, SectionHead, Sheet, ScreenHost, Art; còn Field, Toast, Segmented khi làm chuyến đi) `Button, IconButton, Chip, Field, Sheet, Toast, PhotoCard, Segmented, EmptyState, Skeleton`, icon. *Tiêu chí:* vùng chạm 44 px, focus nhìn thấy, `aria-*`; xem ở một trang mẫu.

## Cụm B — khám phá (lõi sản phẩm)
- [x] **FE-3a Trang chủ + tìm điểm đến.** (xong, chưa có khối Lịch mẫu: cần tạo chuyến, FE-8) *Tiêu chí:* ảnh chụp khớp prototype (390/1280).
- [x] **FE-3b Cẩm nang điểm đến + bộ thẻ quẹt toàn màn + Đã chọn + chi tiết địa điểm.** (xong) *Tiêu chí:* quẹt/nút/phím, Hoàn tác thẻ cuối, hết thẻ, ảnh lỗi.
- [x] **FE-4 Bản đồ địa hình** (`TerrainMap` sang TS), dùng ở trang chủ/điểm đến/Đã chọn/chuyến.

## Cụm C — chuyến đi
- [x] **FE-5** (xong 26/10/2026, chi tiết FE-5a–d và nợ rà soát ở dưới) tạo chuyến (theo bước) + xem chuyến theo ngày + mục + chi phí + tờ kéo 3 nấc.
- [x] **FE-6** (xong 27/10/2026; rà soát 1 vòng, đã sửa) xóa mềm, Hoàn tác, "Đã xóa gần đây", khôi phục/xóa vĩnh viễn.
- [x] **FE-7** (xong 27/10/2026; rà soát 1 vòng, đã sửa; máy chủ giả, chưa có backend) danh tính, mã khôi phục (nhập lại 2/6 nhóm), thiết bị, khôi phục (số khớp).

## Cụm D — hoàn thiện
- [x] **FE-8** (xong 27/10/2026) giới thiệu lần đầu + Lịch mẫu (3 bản nháp có nhãn, chờ PO duyệt từng lịch). **FE-9** (xong 27/10/2026) Hôm nay, Cài đặt, lỗi theo mã, hết phiên, xem trước lưu/gửi lịch trình (chưa tạo tệp).
- [~] **FE-10** nối backend thật: **10a xong 27/10/2026** (catalog + lịch mẫu qua API thật, e2e 51/51); còn 10b chuyến/mục, 10c danh tính, 10d dọn kho giả + viết lại e2e gốc. (`Http*Repository`), viết lại e2e (`Http*Repository`), viết lại e2e. *Sau khi backend lát tương ứng xong.*

## Checkpoint
- [x] Sau FE-0…FE-2: build + lint + test xanh.
- [x] Sau FE-3…FE-4: khám phá chạy đủ, ảnh chụp so với prototype (xong); `wander-code-reviewer` đã dispatch, kết quả ghi bên dưới.

## Việc backend phát sinh từ pha FE
- [ ] `CatalogViews.ReferenceView`: thêm `lat`, `lon` (additive).
- [ ] Catalog công khai không cần phiên + giới hạn tốc độ (DR-008 Q-a, backend lát 1): màn Khám phá của người mới chưa có danh tính phải đọc được; `CatalogController` hiện cần phiên.

## Kết quả rà soát `wander-code-reviewer` (26/10/2026, vòng 1) và việc còn lại
Đã sửa trong phiên (có test): 6 MAJOR (thư viện ảnh nhảy về ảnh đầu khi render lại; nội dung tờ chi tiết không reset khi đổi địa điểm; ghim "rơi" lại khi đổi ngữ cảnh; dữ liệu localStorage hỏng làm trắng trang → `sanitize` + `ErrorBoundary` + đồng bộ giữa tab; bẫy focus thiếu `summary`; hợp đồng `coverPlaceId` không có ở backend → dùng `coverUrl`), cùng các MINOR #7–#19, #21 (phần lớn), #22 (id mặc định), #23–#26, #28, #30–#31.
**Nợ còn lại (chưa làm, không chặn khám phá):**
- [ ] #27 plugin Vite: so sánh đường dẫn cần `path.sep`, bắt `decodeURIComponent` lỗi (chỉ dev).
- [ ] #29 a11y còn lại: lưới tháng chỉ phân biệt bằng màu (cần chữ/`aria`), nút nguồn ảnh thiếu `aria-expanded`/`role=status` cho nhãn, focus rơi về `body` sau thẻ cuối, vùng `aria-live` báo đã chọn/bỏ qua, thanh điều hướng dùng `<button>` thay `<a href>`.
- [ ] #22 `HOME_PLACES` gắn chặt id địa điểm Hà Giang: khi có điểm đến thứ hai phải lấy từ dữ liệu (ảnh bìa, quạt ảnh, tường ảnh).
- [ ] #32 `useCountUp` đếm lại từ 0 khi đổi mục tiêu; #33–#38 (mã chết `searchDestinations`/`SOON_NAMES`/`ABOUT_MIN_LENGTH`, lọc ở `HomeScreen` không dùng kho, `key` trùng, `useRoute` trả đối tượng mới, `matchMedia` mỗi lần đọc).
- [ ] Test còn thiếu: mapper so sánh "golden" với số liệu Java (`away`, `categoryName`, `layout`), `useResource` (hủy, đua), vòng đời `TerrainMap` (StrictMode, đổi `dest`), `geo.test` so số chính xác với `TravelEstimate`.
- [ ] Chưa thử cảm ứng thật, màn 320 px, chữ 200%, Safari/Firefox.

## Kết quả rà soát FE-5 (`wander-code-reviewer`, 26/10/2026, vòng 1) và việc còn lại
Đã sửa (có test): 5 MAJOR (tổng tiền vượt trần 1 mục làm sập màn → định dạng bằng `formatVnd`; Hoàn tác ghi đè thao tác xen giữa → `useUndoable` chỉ khôi phục khi chuyến chưa đổi, ngược lại báo; thứ tự trong ngày thủng lỗ → `normalize` đánh số lại 0..n-1 sau mọi thao tác như backend `Trip.renumber`; camera bản đồ bay lại mỗi lần chuyến đổi → khóa `fit` theo tập mã; `crypto.randomUUID` chỉ có ở ngữ cảnh an toàn → dự phòng `getRandomValues`) và các MINOR #6, #7, #9–#12, #14–#19, #23–#26, #30 (chọn lại đúng ngày không đổi; ngày ngoài khoảng/mã trùng khi nạp; tên trim; tên duy nhất ≤ 120 ký tự và khi đổi tên; kiểm độ dài ở hàm miền; xác nhận mất mục theo tập mã; tab a11y theo WAI-ARIA; nút lên/xuống không mất focus; đọc lại thông báo trùng chuỗi; nhãn nút việc cần làm cố định; radiogroup; bộ nghe `storage` chỉ khi có người đăng ký; mã chết).
**Nợ còn lại (không chặn):**
- [ ] #13 quẹt phải trong chế độ "thêm vào chuyến" chưa hoàn tác được (xếp cùng hoàn tác xóa ở FE-6).
- [ ] #8 dữ liệu hỏng bị bỏ im lặng khi nạp; lỗi ghi localStorage (đầy/riêng tư) chưa báo người dùng: cần bản sao `*.bad` và cảnh báo.
- [ ] #20 trả focus sau khi đóng tờ chi tiết rồi mở tờ sửa (cần e2e focus); #21 `BottomSheet.destroy` không dọn biến CSS khi đổi giữa tờ kéo và ngăn kéo; #22 nút Hoàn tác khó tới bằng bàn phím (đặt sớm trong DOM, tạm dừng hẹn giờ khi di chuột/mất focus cửa sổ).
- [ ] #27 ngân sách 0 hoặc làm tròn lên 100%; #28 `div/h3/p` trong `button` (dùng `article` + nút phủ); #29 cờ `done` giữ khi đổi loại (khớp backend, chỉ ghi chú).
- [ ] Test còn thiếu: `TripsProvider` (Hoàn tác xen kẽ), vòng đời `useBottomSheet`, e2e focus sau khi đóng tờ.
- [ ] Màn "Chuyến đi" chưa có khối "Trước khi đi" (cẩm nang rút gọn), "Hôm nay", xuất, thành viên (xếp FE-8/9/1b).

## Kết quả rà soát FE-6/FE-7/bộ thẻ (`wander-code-reviewer`, 27/10/2026, vòng 1) và việc còn lại
Đã sửa (có test): MAJOR-1 dời lịch không dời "Đã xóa gần đây" → `editTrip` dời cả thùng rác; MAJOR-2 khóa "sai 5 lần" chỉ nằm trong bộ nhớ → khóa bền `wander.web.locks.v1` (tải lại/đổi chế độ không mở khóa, tự mở sau 15 phút, mỗi nơi đếm riêng); MAJOR-3 tự vào máy trong effect không idempotent và không kiểm hạn → chốt `useRef`, `joinHere` idempotent, duyệt quá hạn không tự vào. MINOR: `createIdentity` không còn ghi đè danh tính đang có (máy mất phiên mà máy chủ còn danh tính thì dẫn tới "Mở trên máy này"); trùng `placeId` khi khôi phục bị chặn (báo rõ); thùng rác đầy thì KHÔNG xóa thêm thay vì tự xóa vĩnh viễn mục cũ; `Device.at` cập nhật khi mở Bảo mật; biểu ngữ "vừa khôi phục" chỉ hiện một lần; chế độ "thiết bị khác duyệt" chỉ có khi phát triển; focus chuyển về tiêu đề khi đổi bước phát mã và ở màn Hết thẻ; nền mờ của bộ thẻ tắt trên điện thoại.
**Nợ còn lại (không chặn):**
- [ ] `PairingRequest` chưa có `requestId`: yêu cầu mới ghi đè yêu cầu đang chờ, và `answerPairing` áp vào "yêu cầu hiện tại" chứ không phải yêu cầu đang hiện; hạn mức 3/10 phút tính chung. **Hợp đồng API thật phải có id yêu cầu** (việc backend).
- [ ] Mã ghép (8 ký hiệu) nằm dạng đọc được trong localStorage của máy chủ giả (mã khôi phục thì chỉ có băm): chấp nhận ở bản thử, bản thật phải băm/để ở máy chủ.
- [ ] Nút Hoàn tác của thông báo nổi (z cao) nằm ngoài bẫy Tab của tờ phủ: người dùng bàn phím chưa hoàn tác được khi đang mở tờ. Cần gắn Hoàn tác vào trong tờ hoặc cho thông báo vào vòng Tab.
- [ ] Khôi phục nhiều mục cùng vị trí theo thứ tự xóa (không phải ngược lại) có thể đảo thứ tự ban đầu (khôi phục ngược thứ tự xóa thì đúng).
- [ ] Ảnh kế tiếp của thẻ trước chỉ tải khi cần (đổi ảnh có thể chớp nền); bộ lọc dùng `26px+60px` cứng nên chữ phóng to 200% có thể đè (chưa thử).
- [ ] Đo độ mượt quẹt thẻ **trên máy thật** (`scripts/swipe-perf.mjs` mới đo trình duyệt không đầu: 0 khung > 24 ms).
- [ ] Test còn thiếu: bẫy focus/bàn phím của các tờ danh tính; mờ mã khi tab ẩn; bản `vite build` không có "BẢN THỬ"; chuyển qua lại còn thẻ ↔ hết thẻ; ngăn kéo ≥ 1280 kèm bộ thẻ.
- [ ] "Chữ đang gõ được giữ tạm" khi hết phiên (S19) **chưa làm**: hiện chỉ nói trong lời nhắc nếu có; cần bản nháp biểu mẫu ở FE-10.
- [ ] Chế độ tối (tùy chọn Sáng/Tối/Theo hệ thống ở Cài đặt, F22) **chưa làm** theo lựa chọn của PO 27/10/2026 (giữ chỉ sáng); bộ màu tối vẫn nằm trong `tokens.css`, bật bằng `data-theme="dark"`.
- [ ] Màn Hôm nay chưa có "tích xong" cho mục không phải việc cần làm (đúng đặc tả: chỉ việc cần làm tích được); liên kết "Mở bản đồ" dùng Google Maps (liên kết ngoài, người dùng chủ động bấm); đổi nhà cung cấp là quyết định sau.

## Việc backend phát sinh thêm từ FE-6…FE-9
- Xóa mềm mục: `Trip.trash` (`deletedAt`, ngày/vị trí cũ), khôi phục về đúng chỗ như `Trip.restore`, trần thùng rác (FE chặn xóa thêm khi đầy, không tự xóa mục cũ); API chặn khôi phục trùng địa điểm.
- Danh tính: ghép thiết bị với số khớp 2 chữ số + hạn mức 3 yêu cầu/10 phút/yêu cầu có `requestId`; khóa nhập sai theo thiết bị; HMAC có khóa cho mã khôi phục (RG-2); tên thiết bị đổi được; `lastSeenAt` của thiết bị; khu vực ước tính chỉ ở màn duyệt (header CloudFront, không lưu).
- Lịch mẫu: `GET /api/catalog/templates?dest=` (đọc `catalog/templates/<điểm đến>.json`, trạng thái `draft|approved`; ngày không có nơi mới hợp lệ); admin duyệt từng lịch.
- Lỗi theo mã: bảng mã ở `docs/ux/error-codes.md` đã có ở `shared/api/errorMessages.const.ts`; `UNAUTHENTICATED` phải đưa người dùng tới màn Hết phiên.

## Kết quả rà soát FE-8/FE-9 (`wander-code-reviewer`, 27/10/2026, vòng 1)
Đã sửa: nút tích của Hôm nay nằm trong dòng của nó; xem trước lưu/gửi **không xuất ngày giả** của chuyến chưa chắc ngày (nhãn "Ngày n", không sự kiện lịch, có cảnh báo); xác thực lại bằng thiết bị khác luôn có lựa chọn (chỉ nút giả lập là của dev); bảng mã lỗi dùng `Map` (tên như `constructor` không làm hộp lỗi trống) + nhóm "Dữ liệu chưa hợp lệ" cho các mã 4xx; giới thiệu không đẩy lịch sử và luôn có "Bỏ qua" khi kho lỗi; `recordFailure` không gia hạn khi đang khóa; bảng PDF có `caption` và vùng cuộn focus được; màn Hết phiên/Hôm nay-chưa-có-chuyến có `h1`; thẻ lịch mẫu bỏ `aria-label` đè nội dung; hằng số lịch mẫu chuyển sang `*.const.ts`. **Lỗi thật tìm ra khi chạy e2e:** bấm "Lưu" ngay sau khi quẹt (trong 300 ms) làm mất lượt chọn vì quyết định chạy sau hoạt họa → `flushFling` chạy quyết định đang chờ khi bộ thẻ bị gỡ.
**Còn lại / chờ PO:**
- [x] ~~Nhánh B của Hết phiên là ngõ cụt~~ → PO chọn cho bắt đầu danh tính mới sau cảnh báo (DR-020); đã làm + e2e. **OQ-1** (giữ dữ liệu cũ ở backend) vẫn mở.
- [ ] Bản xuất (Ảnh/PDF/Lịch) và Hôm nay xếp mục theo giờ (mục có giờ trước), khác thứ tự thủ công ở tab Ngày; PO chốt cho bản xuất thật.
- [ ] `aria-describedby` từ nút bị tắt (khi khóa) tới hộp cảnh báo ở ba nơi; "Mở trên máy này" ở Khám phá còn hiện khi đã có danh tính; `PlanScene` đánh số ghim theo mảng đã lọc tọa độ; `vite.config.ts` dùng `startsWith` không dấu phân cách (chỉ dev).
- [ ] Chuỗi "BẢN THỬ/GIẢ LẬP" vẫn nằm trong gói JS dù không hiển thị (kiểm bằng `e2e/prod-build.e2e.test.ts`: bản dựng không có `.protobox`).

## Rà soát giao diện 27/10/2026 (PO chọn làm trước khi sang backend)
- [x] Taste: các FAIL còn lại đều là lựa chọn có chủ ý đã được PO duyệt (xem `decisions.md`, mục "Taste, reflow 320 px và phóng 200%").
- [x] Reflow 320 px và phóng 200%: đã sửa tràn ngang ở hàng mục, trang điểm đến, nút giới thiệu; `scripts/reflow.mjs` chạy lại được.
- [ ] Còn lại: chữ theo `rem` để phóng-chỉ-chữ có tác dụng (hiện px); bản đồ ở 320 px (kịch bản chụp chờ ghim); đo trên máy thật (cảm ứng, Safari/Firefox); xem lại thẻ `dcard` ở 320 px bằng mắt (lệch ≤ 4 px do ảnh phóng nhẹ).
