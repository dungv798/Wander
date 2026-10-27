# User flow (DG-1)

> Nguồn: `docs/ux/design-spec.md` §8 (F1–F14, đã duyệt, DR-008), DR-001…DR-009; prototype `docs/ux/prototype/` (app v4 chuyển, DR-009). Cột "Prototype": **Có (F0x)** = chạy được và có luồng kiểm tự động `docs/ux/tools/flow-defs/F0x`; **Một phần**; **Chưa**. Mã màn: `screens.md`. Mọi thứ `UNVERIFIED` trên người dùng thật (RG-7).
> Quy ước: chữ hiển thị là tiếng Việt thường ngày. Khoảng cách luôn "ước tính". Tiền hiển thị đầy đủ VND (D17). Mọi thao tác chỉ-cử-chỉ có nút tương đương. Phần nhóm (F9–F11) là **thiết kế cho Lát 1b**, không tính vào backend 1a (product-analyst 25/10).

## Tóm tắt phủ

| Luồng | Prototype | Ghi chú |
|---|---|---|
| F15 Giới thiệu lần đầu (DR-012 Q2) | **Có (F15)** | 3 thẻ có thanh tiến độ, bỏ qua được, hiện một lần; mở lại từ Cài đặt/Giới thiệu (S21, chưa dựng) |
| F16 Tạo chuyến theo bước (khung, DR-012 Q8) | **Có (F16)** | 6 bước; "Ai đi" là kiểu chuyến đi; không quyết A3 |
| F17 Hôm nay (khung, DR-012 Q1) | **Có (F17)** | giả lập ngày; chưa tới / đã qua / chưa chắc ngày; bản đồ ngoài |
| F18 Cài đặt, hết phiên hai nhánh, lỗi theo mã | **Có (F18)** | TTL phiên chưa chốt |
| F19 Xuất: xem trước Ảnh/PDF/Lịch | **Có (F19)** | chưa tạo tệp |
| F20 Quản trị: bản nháp điểm đến, chọn tệp ảnh | **Có (F20)** | chưa tải lên máy chủ; Q-d chưa chốt |
| F21 Gỡ thành viên (1b) | **Có (F21)** | hệ quả là đề xuất |
| F1 Khám phá và quẹt chọn | **Có (F00, F01)** | tìm không ra, ảnh lỗi, hết thẻ, "Về dữ liệu" |
| F2 Danh tính khi lưu lần đầu | **Có (F02)** | |
| F3 Tạo và sửa chuyến | **Có (F03)** | gồm "Dự kiến N ngày", ngày biên 1/366, cảnh báo cắt ngày |
| F4 Xếp vào ngày | **Có (F04)** | 1 chạm mỗi nơi; Xếp giúp tôi 2 chạm + Hoàn tác |
| F5 Mục tự do, Nghỉ, Việc cần làm, sắp xếp | **Có (F05)** | 9 loại mục theo `ItemType` |
| F6 Chi phí | **Có (F05)** | tổng theo ngày/loại, chưa biết giá, ngân sách và phần vượt |
| F7 Xóa, Hoàn tác, Đã xóa gần đây | **Có (F07)** | giữ đến khi xóa tay; xóa vĩnh viễn từng mục chỉ cần xác nhận (DR-011) |
| F8 Thiết bị khác và khôi phục | **Có (F08)** | bằng mã (KP-C) và bằng thiết bị cũ duyệt |
| F9 Mời người đi cùng | **Có (F09), bản thử 1b** | vào bằng liên kết + tên hiển thị, liên kết đã tắt |
| F10 Thêm địa điểm, đề nghị xóa, duyệt | **Có (F03, F09), bản thử 1b** | đề nghị kèm lý do, người tạo duyệt bằng quẹt |
| F11 Tiến độ việc cần làm theo người | **Có (F09), bản thử 1b** | mỗi người tự tích; chip "Xong 1/2 người" |
| F12 Quản trị nội dung | **Có (F12), mức khung** | `admin.html`; đăng nhập chưa chốt (Q-d) |
| F13 Chia sẻ/xuất | Một phần | sao chép liên kết; Ảnh/PDF/Lịch chỉ là khung, nói thật là chưa làm |
| F14 Trạng thái toàn cục | **Có (F14, F01, F12)** | tải, lỗi, ngoại tuyến, JSON hỏng, ảnh lỗi, xung đột phiên bản (409), hết phiên quản trị; chưa: hết phiên người dùng thường (danh tính không có phiên hết hạn trong prototype), lỗi máy chủ theo mã |

## F1. Người mới khám phá và quẹt chọn (không cần danh tính)
- **Bước:** S1 Khám phá → thẻ điểm đến → S2 cẩm nang → "Bắt đầu quẹt" → S3. Quẹt phải/nút **Chọn**; quẹt trái/**Bỏ qua**; **Hoàn tác** thẻ cuối; **Chi tiết** mở S4; chạm cạnh thẻ đổi ảnh; lọc theo loại; "Xem đã chọn (n)" → S5.
- **Biên:** hết thẻ → "Hết thẻ rồi"; lọc không còn thẻ → báo và gợi chọn loại khác; phím mũi tên và nút tương đương; ảnh có nguồn qua ⓘ; ô tìm không khớp → "Chưa có điểm đến nào khớp".
- **Lưu:** trạng thái chọn nằm trên thiết bị. Chỉ khi bấm "Lưu thành chuyến đi" lần đầu mới sang F2 (lazy identity).

## F2. Lưu lần đầu → tạo danh tính → mã khôi phục (D26, QĐ-5)
- **Bước:** "Lưu thành chuyến đi" khi chưa có danh tính → tờ giải thích bằng chữ thường ngày (danh tính ẩn danh, không email/số điện thoại, mã chỉ hiện một lần, không ai khôi phục giúp) → "Tạo danh tính và nhận mã" → mã hiện MỘT lần (6 nhóm × 5 ký hiệu) + Sao chép → "Tôi đã lưu mã" → nhập lại để xác nhận → vào chuyến đi.
- **Để sau (PO 26/10/2026):** ở tờ đầu, "Để sau, lưu chuyến đi luôn" lưu ngay (danh tính ẩn danh chưa có mã) và đi tiếp vào chuyến; cảnh báo chỉ MỘT dòng nhẹ dưới nút ("Chưa có mã khôi phục thì mất máy là mất chuyến đi…") và một thông báo sau khi lưu. Ở bước hiện mã, "Để sau" cũng một chạm, không hộp xác nhận. Trang Bảo mật nhắc "chưa có mã" và cho tạo sau (MĐ-2). Khôi phục KHÔNG có nút này (QĐ-6).
- **Biên đã kiểm (F02):** Esc đóng tờ đầu thì không tạo gì; đóng giữa chừng không tạo danh tính nửa vời; sao chép thất bại → báo rõ, hướng dẫn chép tay; mã không nằm trong URL, tiêu đề hay trang sau khi xong.
- **Chưa kiểm:** mất mạng giữa chừng (cần thiết kế lỗi mạng ở bước phát hành).

## F3. Tạo và sửa chuyến
- **Tạo:** S5/S6 → tờ: **Tạo mới / Thêm vào chuyến có sẵn / Để lại**; tên (≤ 120, tự gợi ý không trùng), ngày đi/về (≤ 366 ngày), hoặc **"Chưa chắc ngày, chỉ dự kiến"** + số ngày (1–366; chuyến vẫn có ngày, gắn nhãn "chưa chắc"), phong cách (≤ 5), nhịp, ngân sách (0..1.000.000.000 nghìn). Dưới ô ngày luôn ghi lại "T7, 31/10/2026".
- **Sửa:** ngày, tên; "Dời cả lịch theo ngày mới" khi số ngày không đổi; ngày bị cắt → cảnh báo theo số mục, chuyển về "Chưa có ngày" (**Tầng A: R12**), Hoàn tác được; "Đã chốt ngày" bỏ nhãn "chưa chắc".
- **Kiểm (F03):** ngày về trước ngày đi, ngân sách âm/thập phân, 367 ngày bị từ chối; không tràn ngang ở 390.

## F4. Xếp địa điểm vào ngày
- Tổng quan: "N mục chưa có ngày" → **Xếp giúp tôi** (xem trước, Áp dụng, Hoàn tác; chỉ là đề nghị, DR-007), hoặc chip ngày một chạm, hoặc "Thêm từ mục chưa có ngày" chọn nhiều. Tab Ngày n: danh sách theo thứ tự, bản đồ đánh số, khoảng cách "ước tính".
- Mục đang chờ duyệt xóa không bị xếp. Chỉ người tạo thấy nút Xếp giúp tôi. Đo (F04): 1 chạm mỗi nơi; 2 chạm với Xếp giúp tôi.

## F5. Mục tự do, Nghỉ, Việc cần làm; sắp xếp thủ công (D13, D16)
- "Thêm mục" → Địa điểm từ kho / Mục tự do / Nghỉ / Việc cần làm. Tên (≤ 200), loại (9 loại), ngày, giờ và thời lượng (0–10080 phút) tùy chọn, ghi chú (≤ 2000).
- Nghỉ và Việc cần làm: không giá, không đặt chỗ. Việc cần làm có nút "đã xong" theo người.
- **Sắp xếp** bằng nút Lên/Xuống (tương đương kéo thả), thứ tự lưu qua tải lại, thông báo vị trí cho trình đọc màn hình.

## F6. Chi phí và đặt chỗ (D17, D18, DR-003)
- Nhập nghìn đồng, xem trước "= 120.000 ₫"; trống = chưa biết, 0 = biết là 0; "Đã bao gồm" có ô riêng + giá tham khảo tùy chọn, không cộng vào "tổng phải trả thêm". Đặt chỗ: **Chờ xác nhận** (mặc định) hoặc **Đã đặt**.
- Tổng quan: tổng phải trả thêm, "Chưa tính n mục chưa biết giá", "n mục đã bao gồm", tổng theo loại (thứ tự `ItemType`), "Đã đặt x/y mục có đặt chỗ", ngân sách còn lại hoặc **vượt** (có biểu tượng, không chỉ màu). Tổng từng ngày ở đầu mỗi tab.

## F7. Xóa → Hoàn tác → Đã xóa gần đây → khôi phục / xóa vĩnh viễn
- Xóa (người tạo, hoặc thành viên với mục của chính mình) → toast **Hoàn tác** → mục vào "Đã xóa gần đây", **giữ đến khi xóa vĩnh viễn, không tự hết hạn** (DR-011 A2, thay "30 ngày" của DR-008 Q-e).
- **Khôi phục:** về đúng ngày nếu còn, không thì "Chưa có ngày" và nói rõ lý do; Hoàn tác được.
- **Xóa vĩnh viễn từng mục:** chỉ người tạo; chỉ cần hộp xác nhận, **không xác thực lại** (DR-011 B1, đúng D25 gốc). Xác thực lại (thiết bị tin cậy khác, hoặc mã khôi phục: dùng hết mã → mã mới → nhập lại; mỗi bằng chứng một thao tác; sai 5 lần khóa tạm) chỉ dành cho xóa cả chuyến, tạo mã mới, chuyển giao; kiểm ở F08.

## F8. Thiết bị khác, khôi phục, Bảo mật (QĐ-1…QĐ-6, MĐ-1…MĐ-8)
- **Bảo mật** (từ trang Chuyến đi): trạng thái mã (không bao giờ hiện lại mã), danh sách thiết bị tin cậy + Thu hồi (không cần xác thực lại, không hoàn tác), Thêm thiết bị mới bằng mã ghép `XXXX-XXXX`, Tạo mã mới (cần xác thực lại).
- **Tạo mã mới:** xác thực lại bằng thiết bị (rồi phát hành + nhập lại) hoặc bằng mã (trình mã cũ và xác nhận mã mới là MỘT lần commit).
- **Máy mới:** "Đã có chuyến đi? Mở trên máy này" → **Mã khôi phục** (mã dùng một lần; mã sai/đã dùng/hết hạn cùng một thông báo chung; sai 5 lần khóa; nhập đúng thì nhận mã thay thế, KHÔNG được bỏ qua, nhập lại để xác nhận; hủy giữa chừng không đổi gì; lần thử quá hạn thì bắt đầu lại) hoặc **Thiết bị cũ duyệt** (mã ghép, không dùng hết mã).
- Sau khôi phục: các thiết bị cũ KHÔNG bị thu hồi (QĐ-3); banner nhắc kiểm tra danh sách thiết bị.

## F9. Mời người đi cùng (thiết kế 1b)
- **Người tạo:** nút chia sẻ → tờ có liên kết, sao chép, tắt chia sẻ; thêm khối "Lưu hoặc gửi lịch trình" (Ảnh, PDF, Thêm vào lịch: khung, chưa làm).
- **Người được mời** (mở liên kết): tờ nêu tên chuyến, người tạo, ngày, số mục; **bốn điều được làm** (xem lịch/bản đồ, thêm địa điểm, tự tích việc của mình, xóa mục người khác bằng đề nghị); ô **Tên hiển thị** (bắt buộc, ≤ 40, không phân biệt hoa thường với tên đã có, gọn khoảng trắng); "Không cần tài khoản". Vào chuyến → thành viên.
- **Liên kết đã tắt:** màn lỗi `role=alert`, nói rõ người tạo đã tắt và nhờ họ gửi liên kết mới.
- Công tắc "Xem với tư cách" và các nút "Giả lập" chỉ để thử. Quyền chi tiết còn mở (Q6–Q9, Q12): xem `po-questions.md` C2–C3.

## F10. Thành viên thêm, đề nghị xóa, người tạo duyệt (thiết kế 1b)
- Thành viên thêm bằng quẹt (nhãn "… vừa thêm"). Xóa mục do **chính mình thêm**: xóa trực tiếp; mục của người khác: **gửi đề nghị để người tạo chuyến duyệt** (DR-008 Q-c, DR-006). Người tạo duyệt bằng quẹt hoặc nút Giữ lại/Xóa; mục chờ duyệt có khung riêng. T10–T11.

## F11. Tiến độ việc cần làm theo từng người (thiết kế 1b)
- Việc cần làm có chip "Xong n/m người" khi chuyến có nhiều người. Mở việc → danh sách từng người "Đã xong/Chưa xong" + câu "Mỗi người tự tích phần của mình, không tích hộ ai". `item_completions` ở backend đã là theo người.

## F12. Quản trị nội dung (BẢN THỬ mức khung; Q-d chưa chốt, **Tầng A**)
- **Vào:** màn đăng nhập là khung: ô và nút thật bị khóa, nói rõ cơ chế chưa chốt; lối "Vào bản thử" gắn nhãn. Trang `admin.html` tách khỏi ứng dụng, không có lối từ ứng dụng.
- **Điểm đến:** Hà Giang (dữ liệu thật, 9 địa điểm) + 6 điểm "sắp ra mắt" chưa có dữ liệu. Gỡ/xuất bản điểm đến có xác nhận, nói rõ chuyến đã lưu của người dùng không bị ảnh hưởng.
- **Địa điểm:** danh sách (ảnh, loại, khu vực, nhãn, trạng thái Đã xuất bản/Bản nháp/Có thay đổi chưa xuất bản, đủ chuẩn); form theo đúng trường của kho (`name, category, area, hook, bestMonths, duration, difficulty, highlights, verdict+lý do, bestSlots+lý do, tips, photos(tác giả, giấy phép, nguồn)`), mô tả Wikipedia chỉ đọc (CC BY-SA); xem trước thẻ; bảng kiểm cập nhật khi gõ.
- **Kiểm "thẻ đủ chuẩn":** 7 luật chặn (có ảnh; ảnh đủ ghi công; giới thiệu 20–140 ký tự; tọa độ trong Việt Nam; ≥ 1 mẹo; nhãn có lý do; có tháng đẹp) + 1 cảnh báo không chặn (nội dung chưa được người kiểm chứng, ADR-009). Còn lỗi chặn thì Xuất bản không mở hộp xác nhận mà nói rõ còn bao nhiêu lỗi.
- **An toàn thao tác:** lỗi từng ô chỉ hiện sau khi bấm Lưu; rời form chưa lưu có hộp hỏi; hết phiên khi đang sửa → chữ đang gõ được giữ tạm và nói rõ; xóa bản nháp địa điểm mới nói rõ "xóa hẳn".
- **Chưa làm (nói thật trong UI):** tạo điểm đến mới, tải ảnh lên, xuất bản có duyệt hai người.

## F13. Chia sẻ/xuất — Một phần (sao chép liên kết). Chế độ xem đọc, ảnh/PDF/lịch: T11.

## F14. Trạng thái toàn cục
- **Có (F14):** đang tải (khung xương, `aria-busy`), lỗi dữ liệu (`role=alert`, Thử lại), ngoại tuyến (`role=status`), JSON hỏng → trạng thái lỗi.
- **Có thêm (F01, F14, F12):** ảnh lỗi (nền màu, không vỡ bố cục), xung đột phiên bản (409, ADR-003: tờ "Chuyến đi đã thay đổi" chỉ có "Tải lại"), rỗng của Khám phá/Đã chọn/Chuyến đi/Đã xóa gần đây, hết phiên quản trị.
- **Chưa:** hết phiên của người dùng thường (TTL phiên còn ở "Đã gác lại"), lỗi máy chủ theo mã (cần bảng mã lỗi → thông báo, xem `data-needs.md`).

## Việc cần PO (Tầng A) tính tới lúc này
Xem `docs/ux/po-questions.md` (R12, thời hạn giữ thùng rác, xác thực lại cho xóa từng mục, độ dài mã, Q-d, Q6–Q9/Q12, OQ-1, phạm vi 1b trong prototype).
