# Kiểm kê màn hình (DG-1)

> Viết dần theo từng việc trong `docs/implementation/todo.md`. Prototype: `docs/ux/prototype/index.html` (app), `admin.html` (quản trị) và `components.html` (thư viện thành phần); ảnh: `docs/ux/screenshots/INDEX.md`. Mọi thứ `UNVERIFIED` trên thiết bị thật (RG-7).
> **Nguồn app (DR-009, 25/10/2026):** bản v4 đã duyệt (artifact "Wander Khám Phá") chuyển sang `prototype/app/{app.js,app.css}`, dữ liệu địa điểm đọc từ kho biên tập thật qua `adapt.js`, bố cục thích ứng ở `adaptive.css`. Lai: minh họa v4 + nút phẳng + bóng nhẹ. Trang quản trị: `app/admin.{js,css}` dùng chung token của app.

## Khung thích ứng

| Cỡ màn | Điều hướng | Chi tiết địa điểm | Lưới "Đã chọn" |
|---|---|---|---|
| < 768 (điện thoại) | thanh tab nổi 3 mục | tờ dưới (`aria-modal`, bẫy focus, Esc đóng, trả focus) | 2 cột |
| 768–1279 | thanh bên 96 px (biểu tượng + nhãn một dòng) | hộp thoại giữa ≤ 560 | 3 cột |
| ≥ 1280 | thanh bên 264 px + logo | **ngăn kéo phải 440 px không che nội dung** (nội dung co lại, `aria-modal=false`) | 4 cột (3 khi ngăn kéo mở) |

Ba mục điều hướng: Khám phá · Đã chọn (số đã chọn) · Chuyến đi (số đề nghị chờ duyệt, màu vàng). Trang chuyến đi ≥ 1280: bản đồ trái, danh sách phải (hai cột). Trang quản trị: thanh trên cùng + đường dẫn; ≥ 1100 px biểu mẫu địa điểm chia hai cột (form trái, xem trước và bảng kiểm dính phải); dưới 768 px danh sách thành thẻ xếp dọc.

## Trạng thái dùng chung (áp cho mọi màn, trừ khi ô bảng ghi khác)

| Trạng thái | Cách có | Cách thử | Ghi chú |
|---|---|---|---|
| Đang tải | khung xương, `aria-busy` | `?state=loading` | chỉ màn đọc kho biên tập (Khám phá, cẩm nang, bộ thẻ); dữ liệu của người dùng nằm trong máy nên không có độ trễ trong prototype |
| Lỗi tải | `role=alert` + "Thử lại" | `?state=error`, hoặc JSON hỏng | không trắng trang |
| Ngoại tuyến | thanh trên cùng `role=status` | `?state=offline` | hành vi thật khi mất mạng giữa chừng ở backend: **UNVERIFIED** (chưa có backend nối với prototype) |
| Ảnh lỗi | nền màu thay ảnh, chữ vẫn đọc được, không vỡ bố cục | chặn ảnh trong trình duyệt (F01) | bộ lắng nghe `error` + quét ảnh đã hỏng lúc khởi động |
| Xung đột phiên bản (409, ADR-003) | tờ "Chuyến đi đã thay đổi" chỉ có "Tải lại" | nút "Giả lập: thiết bị khác vừa sửa" | không ghi đè ngầm; hợp nhất để sau |
| Hết phiên quản trị | màn đăng nhập `role=alert`, chữ đang gõ giữ tạm | nút "Giả lập: hết phiên" | chỉ trang quản trị |
| Người dùng thường hết phiên | **chưa có** | | danh tính ẩn danh: TTL/idle timeout của phiên còn ở "Đã gác lại" (open-decisions) |

## Màn hình trong prototype (mỗi dòng: mục đích và dữ liệu · hành động · trạng thái riêng · ảnh)

### Khám phá (F1) — `index.html`
| Mã | Màn | Mục đích và dữ liệu | Hành động | Rỗng / lỗi riêng | Ảnh |
|---|---|---|---|---|---|
| S1 | Khám phá | gợi hứng: bầu trời, máy bay, 3 thẻ ảnh xòe, la bàn; ô tìm; "Đang chọn dở"; thẻ điểm đến; "Nổi bật"; "Sắp ra mắt". Dữ liệu: kho thật | tìm điểm đến, mở cẩm nang, mở chi tiết, "Đã có chuyến đi? Mở trên máy này" (người mới) | tìm không ra: "Chưa có điểm đến nào khớp «…»" + Xóa tìm kiếm; minh họa thu nhỏ khi đang tìm | `app-explore`, `app-search-empty`, `app-img-fail` |
| S2 | Cẩm nang điểm đến | ảnh bìa, mùa, mang gì, ăn gì, thiên nhiên, dịch vụ, di chuyển (từ `guide` của kho) | Bắt đầu quẹt, Tạo chuyến đi, mở/đóng khối | | `app-dest` |
| S3 | Bộ thẻ quẹt | thẻ ảnh nhiều ảnh, lọc loại | quẹt hoặc nút Bỏ qua/Chọn/Hoàn tác/Chi tiết; phím mũi tên | hết thẻ: "Hết thẻ rồi" + Xem đã chọn + Hoàn tác thẻ cuối; lọc hết thẻ: gợi chọn loại khác | `app-deck` |
| S4 | Chi tiết địa điểm | thư viện ảnh + ghi công, khoảng cách ước tính, bản đồ nhỏ, nhãn biên tập, buổi nên đi, mẹo, "Về dữ liệu" (Wikimedia, CC) | Chọn nơi này, Chọn ngày (khi đã trong chuyến), Giờ/chi phí/đặt chỗ | | `app-info` |
| S5 | Đã chọn | lưới nơi đã quẹt phải | bỏ chọn, Lưu thành chuyến đi | chưa chọn gì: "Chưa chọn nơi nào" + nút quay lại bộ thẻ | `app-picked` |

### Giới thiệu lần đầu (F15) — `index.html?fresh=1`
| Mã | Màn | Mục đích và dữ liệu | Hành động | Rỗng / lỗi riêng | Ảnh |
|---|---|---|---|---|---|
| S14 | Giới thiệu 3 thẻ (Quẹt nơi mê · Gom thành chuyến đi · Của bạn, không cần email) | thanh tiến độ `role=progressbar` (Bước n trên 3), ảnh thật từ kho (thẻ 1), 3 ngày mẫu (thẻ 2), khóa + 3 chip (thẻ 3); **nội dung là bản nháp có nhãn**; không số liệu/đánh giá/trả phí | Tiếp, Quay lại (từ thẻ 2), Bỏ qua, Bắt đầu khám phá (thẻ cuối); focus chuyển về tiêu đề mới; hiện một lần (nhớ `onboarded`); `?fresh=1&intro=0` bỏ qua | không có dữ liệu thì thẻ 1 dùng ảnh nền màu (như Khám phá); thanh tab và thanh bên ẩn | `app-onb-1`, `app-onb-2`, `app-onb-3` |

### Chuyến đi (F3–F7)
| Mã | Màn | Mục đích và dữ liệu | Hành động | Rỗng / lỗi riêng | Ảnh |
|---|---|---|---|---|---|
| S6 | Danh sách chuyến đi | thẻ chuyến (ảnh, ngày, số mục, thành viên, đề nghị chờ) | mở chuyến, tạo mới, vào Bảo mật | "Chưa có chuyến đi" | `app-trips` |
| S7 | Chuyến đi (Tổng quan, Ngày n) | bản đồ, thống kê, **hộp Chi phí** (tổng phải trả thêm, chưa biết giá, ngân sách), mục chưa có ngày + chip ngày một chạm, danh sách theo ngày, "Đã xóa gần đây (n)" | Xếp giúp tôi, thêm mục, sắp xếp thủ công, tích việc, quẹt xóa/chọn ngày, sửa chuyến, chia sẻ | ngày trống: khung gạch đứt có lối thêm; mọi mục đã có ngày: lời mời đi cùng | `app-trip`, `app-day`, `app-day2`, `app-costbox`, `app-sorting`, `app-plan` |
| S7a | Tờ tạo/sửa chuyến | tên (≤ 120), ngày đi/về (≤ 366 ngày) hoặc "Dự kiến N ngày", ngân sách (≤ 1.000.000 nghìn) | lưu, hủy | lỗi từng ô cạnh ô; đổi ngày làm mục lệch → cảnh báo tính lại và đưa về "Chưa có ngày" (**xung đột R12, Tầng A**) | `app-create`, `app-create-tent`, `app-edit-error`, `app-addday` |
| S7b | Thêm/sửa mục | 9 loại (`ItemType`): tên ≤ 200, ngày, giờ, thời lượng ≤ 10080 phút, ghi chú ≤ 2000, chi phí, "Đã bao gồm" + giá tham khảo, đặt chỗ Chờ xác nhận/Đã đặt | lưu, xóa/đề nghị xóa | đổi sang Nghỉ/Việc cần làm khi đang có giá → cảnh báo, bấm Lưu lần nữa mới xóa giá | `app-add-item`, `app-item-edit`, `app-item-edit-place` |
| S8 | Đã xóa gần đây | mục đã xóa (giữ đến khi xóa tay, DR-011), người xóa, xóa lúc nào | Khôi phục (về đúng vị trí cũ), Xóa vĩnh viễn (người tạo; hộp xác nhận, không xác thực lại) | rỗng: "Chưa có mục nào bị xóa" + Về chuyến đi | `app-trash` |

### Danh tính và thiết bị (F2, F8)
| Mã | Màn | Mục đích và dữ liệu | Hành động | Rỗng / lỗi riêng | Ảnh |
|---|---|---|---|---|---|
| S9 | Giới thiệu danh tính khi lưu lần đầu | giải thích ẩn danh, mã một lần, MỘT dòng cảnh báo nhẹ | Tạo danh tính và nhận mã, Để sau (lưu luôn, đi tiếp) | | `app-id-intro` |
| S10 | Mã khôi phục (hiện một lần) | 30 ký hiệu, 3 nhóm mỗi hàng; Esc/chạm nền bị khóa, mờ khi tab ẩn | Sao chép (thất bại thì hướng dẫn chép tay), Tôi đã lưu mã, Bỏ qua, Hủy | nhập lại sai: "chưa khớp"; bỏ qua có cảnh báo mất quyền vĩnh viễn | `app-id-code`, `app-id-skip`, `app-newcode` |
| S11 | Bảo mật | trạng thái mã (không bao giờ hiện lại), thiết bị tin cậy, Hoạt động gần đây, Thêm thiết bị bằng mã `XXXX-XXXX` | Thu hồi, Tạo mã mới, ghép thiết bị | chưa có mã: nhắc tạo; chấm "có hoạt động mới" | `app-security`, `app-security-nocode`, `app-revoke`, `app-pair-confirm` |
| S12 | Xác thực lại | bằng thiết bị tin cậy hoặc mã khôi phục | duyệt, nhập mã | thông báo chung khi sai (không đếm lần còn lại); khóa theo thiết bị sau 5 lần | `app-reauth`, `app-reauth-code` |
| S13 | Mở trên máy này | Mã khôi phục hoặc Thiết bị cũ duyệt, rồi mã thay thế | nhập, xác nhận | sai/đã dùng/hết hạn: một thông báo chung; hết hạn lần thử: bắt đầu lại | `app-recover`, `app-recover-device`, `app-recover-newcode` |

### Màn thêm ở DG-2 (khung, DR-012): tạo chuyến theo bước, tuyến theo ngày, Hôm nay
| Mã | Màn | Mục đích và dữ liệu | Hành động | Rỗng / lỗi riêng | Ảnh |
|---|---|---|---|---|---|
| S15 | Tạo chuyến theo bước | 6 bước: Đi đâu (Hà Giang thật, "Sắp ra mắt" các nơi chưa có dữ liệu) · Khi nào (ngày đi/về hoặc "Dự kiến N ngày") · Ai đi (kiểu chuyến đi; **chưa phải danh sách thành viên**) · Sở thích (loại địa điểm) · Ngân sách (nghìn đồng) · Xem lại + tên; nhãn "BẢN THỬ · khung, chưa chốt dữ liệu" | Tiếp, Quay lại (giữ dữ liệu), Hủy, Tạo chuyến đi | lỗi ngay tại bước (ngày, số ngày dự kiến, ngân sách, tên rỗng); người mới đi qua F2 | `app-wz-1`…`app-wz-6` |
| S16 | Tuyến theo ngày (Tổng quan) | chip "Ngày n · ~x km" (ước tính, theo tọa độ điểm của kho); "chưa có tuyến" khi thiếu tọa độ; trong Ngày n đã có đường nối + ước tính từng đoạn | bấm chip sang đúng ngày | mục tự do không có tọa độ nên không tính (nói rõ) | `app-dayroutes`, `app-day` |
| S17 | Hôm nay | ngày hiện tại của chuyến: thống kê, mục theo giờ, việc cần làm tích được, tổng chi đã biết giá, "Mở bản đồ" ra app ngoài | tích xong, mở bản đồ ngoài, xem cả chuyến, **giả lập ngày** (bản thử) | chưa tới ngày đi · đã kết thúc · chuyến chưa chắc ngày · hôm nay chưa có mục | `app-today-before`, `app-today-day1`, `app-today-after` |

### Màn thêm ở DG-2, phần 2 (khung): xuất, hết phiên, lỗi theo mã, cài đặt
| Mã | Màn | Mục đích và dữ liệu | Hành động | Rỗng / lỗi riêng | Ảnh |
|---|---|---|---|---|---|
| S18 | Lưu hoặc gửi lịch trình (xem trước) | 3 kiểu: Ảnh (thẻ theo ngày, màu ngày kèm chữ "Ngày n"), PDF (bảng ngày/giờ/mục/chi phí, tổng chỉ cộng mục đã biết giá), Lịch (sự kiện, mục không giờ là cả ngày, múi giờ thiết bị); dữ liệu chuyến thật | chọn kiểu; nút "Tạo tệp (chưa làm)" bị tắt, có lời giải thích | nói thẳng **chưa tạo tệp**; liên kết chỉ-đọc thuộc 1b (Q6–Q9 mở) | `app-export-anh`, `app-export-pdf`, `app-export-lich` |
| S19 | Hết phiên (hai nhánh) | giữ chữ đang gõ; nhánh A (đã có mã/thiết bị tin cậy) → Mở trên máy này; nhánh B (đã bỏ qua mã, không còn thiết bị tin cậy) → nói thẳng không khôi phục được (D20, D26), Về Khám phá | chuyển nhánh (bản thử), Mở trên máy này, Về Khám phá | **không nêu thời hạn phiên** (Tầng A chưa chốt) | `app-expired-a`, `app-expired-b` |
| S20 | Lỗi theo mã | hộp `role=alert`: tiêu đề, lời tiếng Việt, mã lỗi nhỏ; bảng đầy đủ ở `error-codes.md`; đã dựng 5 mã (RATE_LIMITED, NOT_FOUND, INTERNAL, STEP_UP_REQUIRED, BODY_TOO_LARGE) | Thử lại / Mở Bảo mật / Về Chuyến đi / Đóng | không đếm "còn N lần" | `app-error-code` |
| S21 | Cài đặt và giới thiệu | tên thiết bị (đổi được), **Giao diện (Sáng mặc định / Tối / Theo hệ thống, nhớ lựa chọn, quản trị theo cùng lựa chọn; `F22`)**, Bảo mật, Về Wander (ghi công nguồn dữ liệu), Quyền riêng tư (**bản nháp, chưa phải chính sách pháp lý**), "Chuyến đi tạo nhầm" (DR-004), Xem lại giới thiệu, khu Giả lập (hết phiên, lỗi theo mã) | lưu tên, xem lại giới thiệu, giả lập | chưa có danh tính: nói rõ | `app-settings` |
| A4 | Chọn tệp ảnh (quản trị) | ô chọn tệp JPG/PNG/WebP ≤ 5 MB kiểm ngay ở trình duyệt; nói rõ bỏ EXIF khi tải lên; **chưa tải lên máy chủ**; ghi công vẫn bắt buộc để xuất bản | chọn tệp | sai kiểu / quá lớn: lỗi cạnh ô | `app-admin-upload` |
| A5 | Tạo bản nháp điểm đến (quản trị) | bản nháp từ danh sách "sắp ra mắt" hoặc tên gõ tay (kiểm rỗng, dài, trùng); Xuất bản bị khóa (chưa có địa điểm, cẩm nang, ảnh có ghi công); lưu ở máy này | Tạo bản nháp, Bỏ bản nháp | lỗi tên cạnh ô | `app-admin-newdest` |
| G8 | Gỡ thành viên (1b) | danh sách "Người đi cùng (n)" trong tờ mời; hộp xác nhận nêu hệ quả (**đề xuất, chưa là quyết định**) | Gỡ, Hủy, Hoàn tác | chưa có ai: nói rõ | `app-members`, `app-member-remove` |

### Nhóm — BẢN THỬ 1b, ngoài danh sách backend 1a (`po-questions.md` C2)
| Mã | Màn | Mục đích và dữ liệu | Hành động | Rỗng / lỗi riêng | Ảnh |
|---|---|---|---|---|---|
| G1 | Mời người đi cùng | liên kết, bật/tắt; khối "Lưu hoặc gửi lịch trình" | sao chép, tắt, Ảnh/PDF/Lịch (khung) | nút chưa làm nói thật là chưa làm | `app-share`, `app-share-on` |
| G2 | Vào chuyến bằng liên kết | tên chuyến, người tạo, 4 điều được làm, Tên hiển thị | Vào chuyến, Để sau | tên rỗng/trùng: lỗi cạnh ô | `app-join` |
| G3 | Liên kết đã tắt | giải thích và việc cần làm tiếp | Đã hiểu | `role=alert` | `app-join-off` |
| G4 | Đề nghị xóa | lý do (không bắt buộc, ≤ 200) | Gửi đề nghị, Thôi | | `app-request`, `app-member` |
| G5 | Duyệt đề nghị xóa | thẻ quẹt: phải giữ, trái xóa; ai, khi nào, lý do | quẹt hoặc nút Giữ lại/Đồng ý xóa | hết đề nghị: tờ tự đóng | `app-review` |
| G6 | Tiến độ việc cần làm | chip "Xong n/m người"; danh sách từng người | tích phần của mình | chuyến một người: không hiện | `app-task-who` |
| G7 | Chuyến đã thay đổi (409) | giải thích không ghi đè | Tải lại | | `app-conflict` |

### Quản trị nội dung — BẢN THỬ mức khung (`admin.html`; Q-d chưa chốt)
| Mã | Màn | Mục đích và dữ liệu | Hành động | Rỗng / lỗi riêng | Ảnh |
|---|---|---|---|---|---|
| A0 | Đăng nhập (khung) | nói thật cơ chế chưa chốt; ô và nút thật bị khóa | Vào bản thử | hết phiên: `role=alert`, nói chữ đang gõ được giữ tạm | `app-admin-login`, `app-admin-expired` |
| A1 | Điểm đến | Hà Giang (thật) + 6 "sắp ra mắt" | Mở, Tạo dữ liệu (khung) | | `app-admin-dests` |
| A2 | Chi tiết điểm đến | tab Địa điểm / Cẩm nang / Chất lượng; xuất bản/gỡ điểm đến | thêm địa điểm, sửa, gỡ xuất bản (có xác nhận) | tab Chất lượng rỗng: "Mọi địa điểm đều đủ chuẩn" | `app-admin-dest`, `app-admin-guide`, `app-admin-quality` |
| A3 | Biểu mẫu địa điểm | trường theo kho thật; xem trước thẻ; bảng kiểm khi gõ | Lưu bản nháp, Xuất bản (chặn khi còn lỗi), Gỡ xuất bản, Bỏ thay đổi | lỗi từng ô sau khi bấm Lưu; rời form chưa lưu có hộp hỏi | `app-admin-place`, `app-admin-place-new` |

## Chưa có / chỉ nêu
Hết phiên người dùng thường; tải ảnh lên; tạo điểm đến mới; xuất Ảnh/PDF/Lịch; liên kết chỉ-đọc (quyền Q6–Q9 còn mở); kiểm tra bằng trình đọc màn hình và thiết bị thật (RG-7).

## Bằng chứng (đọc từ lần chạy cuối, đêm 25/10/2026)
- `node docs/ux/tools/flows.mjs`: **12/12 luồng đạt** (F00, F01, F02, F03, F04, F05, F07, F08, F09, F12, F14, T2).
- `contrast.mjs`: thư viện 122 phép tính, 0 lỗi; app (`--css=docs/ux/prototype/app/app.css --pairs=docs/ux/tools/contrast-pairs-app.json`) 30 phép tính, 0 lỗi. Màu trang quản trị (huy hiệu, cảnh báo) được đo bằng `a11y-scan` trên trang thật, chưa nằm trong tệp cặp.
- `a11y-scan.mjs --strict`: 220 trang (mọi màn `app-*` × 390/768/1280 × sáng/tối), 0 phát hiện, thoát 0 (trang không quét được cũng tính là thất bại).
- Taste `inspect.mjs --app`: app 5 FAIL có chủ ý (DR-009) và 4 WARN bảo vệ; trang đăng nhập quản trị 0 FAIL, 2 WARN bảo vệ (khoảng trống của thẻ đăng nhập đặt giữa màn có chủ ý; màu mạnh là nhãn "BẢN THỬ" cố ý). Các trang quản trị khác (cần thao tác mới tới) chưa qua Taste, chỉ qua `a11y-scan` và ảnh chụp.
- `shots.mjs`: xem `docs/ux/screenshots/INDEX.md` (số ảnh, lỗi console).
- **Chưa kiểm:** trình đọc màn hình, thiết bị thật, chữ phóng 200% (RG-7); trình duyệt khác Chrome/Edge; mạng chậm thật.
