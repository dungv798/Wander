# Việc cần PO quyết (Tầng A) — gom từ DG-1, đêm 25/10/2026

> Nguồn: phản biện độc lập `wander-product-analyst`, `wander-skeptic-qa` (hai vòng), `wander-security-reviewer` trên prototype, cộng các điểm em tự phát hiện khi đối chiếu với backend thật. **Không có mục nào ở đây đã được quyết**: prototype đang làm theo quyết định ĐÃ DUYỆT (DR-001…DR-009); chỗ nào khác với đề xuất bên dưới thì được nêu rõ. Mỗi câu: phương án → khuyến nghị (không phải quyết định). ★ = chặn việc làm backend sau DG-1. Tầng B (em đã tự chọn mặc định) nằm ở `docs/implementation/decisions.md` §2, không lặp lại ở đây.

## ★ A. Đổi schema / thay nghĩa quy tắc đã có trong plan

| # | Câu hỏi | Phương án | Khuyến nghị | Chặn gì |
|---|---|---|---|---|
| A1 ✅ **ĐÃ QUYẾT (b), DR-011, 25/10/2026** | **R12 khi đổi ngày chuyến làm mục nằm ngoài khoảng.** Plan R12: không cho đổi. Prototype: mục về "Chưa có ngày" + Hoàn tác (hợp DR-006). Backend hiện chặn (`DATES_ORPHAN_ITEMS`) và `restore` ném `DAY_OUT_OF_RANGE`; `items.day_date NOT NULL` | (a) giữ R12, chặn tới khi người dùng chuyển/xóa vĩnh viễn các mục lệch; (b) cho phép, mục (kể cả đã xóa) tự về "Chưa có ngày", sửa `Trip` và `restore`; (c) mục đã xóa giữ ngày cũ, chỉ chặn khi khôi phục | **(b)**: UX đã dựng, khớp DR-006; cần DR để sửa chữ R12 | migration `day_date` nullable, domain, API, test |
| A2 ✅ **ĐÃ QUYẾT (b) giữ đến khi xóa tay, DR-011, 25/10/2026** (PO không theo khuyến nghị (a)) | **Thời hạn giữ "Đã xóa gần đây".** Plan R7/D19: giữ đến khi xóa vĩnh viễn, không tự hết hạn. DR-008 Q-e: 30 ngày (cấu hình được) | (a) 30 ngày rồi tự xóa (prototype); (b) giữ đến khi xóa tay như R7/D19 | **(a)** kèm DR sửa chữ plan; chốt OQ-1 (dữ liệu chuyến mất quyền, bản sao lưu RDS) trước RG-5 | job xóa định kỳ, `expiresAt`, thông báo cho người dùng |
| A3 | **"Dự kiến N ngày"**: lưu cờ ngày tạm thế nào; thứ trong tuần của ngày tạm; khi chuyển từ tạm sang chốt | (a) cột `dates_tentative`, thứ vẫn tính từ ngày đi, nhãn "chưa chắc" (prototype); (b) chuyến không có ngày thật tới khi chốt (đổi R5) | **(a)** | cột + API |

## ★ B. Bảo mật / xác thực (Q16 đã duyệt, các chỗ sau là kẽ hở hoặc mâu thuẫn mà phản biện chỉ ra)

| # | Câu hỏi | Phương án | Khuyến nghị | Nguồn |
|---|---|---|---|---|
| B1 ✅ **ĐÃ QUYẾT (b), DR-011, 25/10/2026** | **Xóa vĩnh viễn TỪNG MỤC có phải xác thực lại không?** DR-008 Q-e (PO duyệt) nói có; QĐ-4/INV-14/NEG-15 và D25 gốc nói xác thực lại chỉ cho xóa cả chuyến, tạo lại mã, chuyển giao, "không mở rộng sang xóa từng mục". Hệ quả của Q-e: mỗi lần xóa vĩnh viễn một mục đốt một mã (MĐ-1) hoặc cần một lần duyệt thiết bị; dọn 5 mục = xoay mã 5 lần, người dùng sẽ chép mã cẩu thả hoặc bỏ qua | (a) giữ Q-e như prototype; (b) chỉ yêu cầu cho thao tác cả chuyến/tạo mã/chuyển giao (D25 gốc), xóa từng mục chỉ cần phiên chủ; (c) giữ nhưng có "cửa sổ xác thực lại" vài phút (phải sửa MĐ-1/INV-14) | **(b)** cho 1a (cả security-reviewer lẫn product-analyst khuyến nghị); (a) chỉ nếu muốn an toàn tuyệt đối và chấp nhận ma sát | security B1; product-analyst #3 |
| B2 ★ | **Mã đầu tiên của danh tính đã bỏ qua mã (MĐ-2) + Thu hồi không cần xác thực lại (5.5).** Kịch bản: người cầm máy bị trộm còn phiên tự phát hành mã rồi dùng chính mã đó làm bằng chứng xác thực lại; hoặc thu hồi máy của chủ rồi phát hành mã đầu tiên → chủ mất quyền vĩnh viễn | (a) mã phát hành sau khi đã bỏ qua không dùng làm bằng chứng xác thực lại trong N giờ (Tầng B: N); (b) thu hồi thiết bị cũng cần xác thực lại; (c) giữ nguyên, chấp nhận rủi ro | **(a)** | security M1, M2 |
| B3 | **Độ dài mã và cách "xác nhận bằng nhập lại" (MĐ-4).** Backend: 30 ký hiệu Crockford ≈ 150 bit, 6 nhóm × 5. Nhập lại cả 30 ký tự trên điện thoại là gánh nặng, dễ khiến người dùng bỏ qua. Đồng thời băm SHA-256 không muối chỉ an toàn nếu mã đủ ngẫu nhiên và DB không lộ | (a) giữ nhập lại toàn bộ; (b) nhập lại 2 trong 6 nhóm do hệ thống chọn ngẫu nhiên (vẫn chứng minh đã lưu); (c) cho dán; thêm HMAC có khóa (pepper) trong Secrets Manager | (b) hoặc (c) về UX (PROPOSED, chưa đo với người dùng thật); HMAC pepper trước RG-2 | security M7; backend `Secrets.java` |
| B4 | **Màn duyệt thiết bị mới có hiện khu vực ước tính không?** Prototype hiện "Hà Nội (đoán theo mạng, có thể sai)" để người dùng nhận ra thiết bị lạ. Khu vực suy từ IP là dữ liệu cá nhân nhẹ (§12) | (a) có, chỉ ở màn duyệt, không lưu lâu; (b) không, chỉ tên thiết bị + thời điểm | (a) nếu PO chấp nhận; nếu không thì bỏ dòng này | security M3 |
| B5 | **Thông báo ngoài ứng dụng (email/push) khi có khôi phục hoặc thêm thiết bị.** QĐ-1 không thu email/số điện thoại. Prototype chỉ có nhật ký hoạt động + chấm trong ứng dụng, thiết bị khác thấy khi mở app | (a) chỉ trong ứng dụng (Tầng B); (b) có kênh ngoài (đổi QĐ-1) | **(a)** cho 1a | security M4 |
| B6 | **Sau khôi phục bằng mã, có nên đề nghị thu hồi thiết bị cũ ngay không?** QĐ-3: không tự thu hồi. Rủi ro: kẻ có mã khôi phục xong, máy cũ im lặng | (a) giữ QĐ-3 + banner nổi bật + nhật ký (prototype); (b) hỏi "Máy nào còn là của bạn?" ngay bước cuối | **(a)** + (b) như bước tùy chọn có thể bỏ qua | skeptic UX #1, security M4 |
| B7 | **Giới hạn tần suất khôi phục (MĐ-8)**: kẻ làm cạn hạn mức toàn cục chặn được mọi người; sau load balancer địa chỉ client sai thì mọi người dùng chung "nguồn" (`X-Forwarded-For` đang bị bỏ qua, AD-6) | tách hạn mức theo nguồn và trần toàn cục; luôn có đường thay thế (thiết bị cũ duyệt) khi mã bị khóa; không hiện "còn N lần thử" (prototype đã bỏ) | như bên | security M6 |

## C. Phạm vi và nhóm

| # | Câu hỏi | Khuyến nghị |
|---|---|---|
| C1 | **Ai duyệt đề nghị xóa của thành viên?** DR-006 §2/DR-008 Q-c: người tạo chuyến. (`user-flows.md` bản đầu của em ghi nhầm "người thêm mục"; đã sửa.) | giữ **người tạo chuyến**; không chặn 1a |
| C2 ★ | **Phần nhóm trong prototype (vai Thành viên "Bình", đề nghị xóa, quẹt duyệt, chia sẻ) có tính vào backend 1a không?** Plan §3/§6: nhóm thuộc 1b; Q6–Q9, Q12 còn mở | giữ làm thiết kế, gắn nhãn "BẢN THỬ 1b" (đã làm), **loại khỏi danh sách backend 1a** |
| C3 | Q6–Q9, Q12 (quyền thành viên, liên kết mời, v.v.) | cần trước khi làm 1b; prototype dùng đề xuất |
| C4 | **Q-d: đăng nhập quản trị** (F12) | hỏi bằng lựa chọn khi tới bước backend admin; prototype chỉ có màn khung |
| C5 | **Phiên bản/xung đột (409, ADR-003)**: người dùng nhiều thiết bị sửa cùng chuyến. Prototype có màn "Chuyến đi đã thay đổi" chỉ có "Tải lại" (không hợp nhất) | giữ "Tải lại"; hợp nhất là việc lớn, để sau |

## E. Bổ sung sau phản biện T16 vòng 1 (đêm 25/10/2026)

| # | Câu hỏi | Phương án | Khuyến nghị | Nguồn |
|---|---|---|---|---|
| E1 | **Số khớp (number matching) khi ghép thiết bị và khi duyệt xác thực lại**: hai máy cùng hiện một số, người duyệt phải chọn đúng số. Chống "mệt vì bị hỏi duyệt" khi kẻ giữ phiên bị trộm gửi yêu cầu liên tục. Mã ghép hiện chỉ 40 bit + TTL 5 phút | (a) thêm số khớp + hạn mức yêu cầu duyệt + thao tác nêu rõ trên máy duyệt; (b) giữ như prototype (mã ghép + màn duyệt nêu thiết bị/thời điểm) | **(a)** (đổi cơ chế bảo mật của DR-001: Tầng A) | security-reviewer |
| E2 | **Định danh thành viên bằng `memberId`** (không bằng tên) và **chính sách khi tắt liên kết mời**: thành viên đã vào còn phiên không? ai thấy "Đã xóa gần đây"? có màn gỡ thành viên? token mời ≥ 128 bit, có hạn, thu hồi, mỗi lần bật là token mới | gắn vào Q6/Q7 khi mở 1b; prototype đã làm "bật lại = liên kết mới" và đổi tên toàn app | quyết cùng Q6–Q9, Q12 | security-reviewer, skeptic M5 (người tạo đang mang tên cố định "Bạn") |
| E3 | **Cổng quản trị: tách tác giả và người xuất bản**, nhật ký kiểm toán, CSP, CSRF, tải ảnh (kiểu tệp, kích thước, bỏ EXIF) | chọn cùng Q-d | Q-d phải trả lời kèm các yêu cầu tối thiểu này | security-reviewer §3 |
| E4 | **Hợp đồng dữ liệu admin → app** trước khi nối: tên trường khác nhau (`sourceUrl`/`source`, `author`/`artist`), `href` ở app dựng chưa qua kiểm `http(s)` (đã chặn ở luật xuất bản admin của bản thử) | Tầng B khi làm backend admin; ghi vào `data-needs.md` | | security-reviewer |
| E5 | **Khu vực suy từ IP trên màn duyệt thiết bị**: nếu giữ (B4) thì không lưu IP thô, chỉ giữ khu vực trong yêu cầu chờ rồi xóa; dịch vụ tra IP bên thứ ba là phụ thuộc mới (Tầng A) hoặc dùng header địa lý của CloudFront | cùng B4 | | security-reviewer §4 |

**Ghi chú phân loại của product-analyst:** B5 (thông báo trong ứng dụng), B6 (đã đề xuất làm bước tùy chọn), B7 (con số), C1 (đã chốt DR-006/Q-c), C5 (giữ "Tải lại") thực ra là **Tầng B**, đã làm theo mặc định ở prototype; chỉ giữ lại ở trên để anh đổi nếu muốn.

**Thứ tự chặn backend (đề xuất):** ~~A1 → A2 → B1~~ (đã quyết, `DR-011`) → A3 → B2/B3 (trước RG-2) → E1 → phần còn lại. DG-1 đã đóng (`DR-010`).

## D. Việc em đã tự quyết (Tầng B), nêu để anh biết có thể đổi
Định dạng mã/ghép theo backend; tên hiển thị chuẩn hóa NFC, bỏ ký tự điều khiển/độ rộng 0, so khớp bỏ dấu và chặn tên dành riêng (Bạn, Người tạo, Tôi); mỗi lần bật liên kết mời là liên kết mới; cờ "hoạt động mới" chỉ tắt khi đã xem màn Bảo mật; nhật ký giữ 50 sự kiện; luật quản trị chặn xuất bản khi thiếu loại/khu vực và khi URL nguồn không phải http(s); không xuất bản điểm đến khi còn địa điểm lỗi chặn; 9 loại mục; 2 trạng thái đặt chỗ; giới hạn 366 ngày, 1.000.000.000 nghìn, tên 200, ghi chú 2000, thời lượng ≤ 10080 phút; thùng rác theo từng chuyến; chỉ người tạo xóa vĩnh viễn; khóa ô nhập sau 5 lần sai theo thiết bị; Hoàn tác 10 giây (dừng khi focus); Hoàn tác cũ bị bỏ khi có thay đổi mới; cảnh báo khi đổi loại mục làm mất giá; khóa Esc/chạm nền ở bước hiện mã; làm mờ mã khi tab bị ẩn; nhật ký hoạt động trong ứng dụng. Chi tiết và lý do: `docs/implementation/decisions.md` §2.

## F. Từ vòng thiết kế DG-2 (25/10/2026; rà soát `wander-product-analyst` ×2, `wander-skeptic-qa` ×1)
| # | Câu hỏi | Phương án | Khuyến nghị (không phải quyết định) | Nguồn |
|---|---|---|---|---|
| F1 ★ | **Phiên của danh tính ẩn danh có hết hạn khi chưa có mã khôi phục hoặc thiết bị tin cậy không?** Màn S19 nhánh B hiện đang nói "không khôi phục được", dễ biến TTL thành mất dữ liệu vĩnh viễn (D20 chỉ chấp nhận mất khi mất thiết bị mà không có bằng chứng) | (a) phiên trượt, không hết hạn · (b) bắt buộc lưu mã trước khi phiên có thể hết hạn · (c) cho hết hạn, chấp nhận mất, cảnh báo lúc bỏ qua mã | **(a)** cho 1a | skeptic M1 |
| F2 | **"Ai đi" và "Sở thích" ở tạo chuyến lưu thế nào?** Hiện lưu ở `kind`, `interests` (tách khỏi `styles`) trong prototype | (a) chỉ là bước làm quen, không lưu · (b) thuộc tính chuyến mới (đổi schema, Tầng A) · (c) gộp vào `styles` | **(a)** tới khi quyết | product-analyst |
| F3 | **Ai được gỡ thành viên?** (1b) | (a) chỉ người tạo (prototype đã giới hạn) · (b) thành viên gửi đề nghị | **(a)**, gác tới khi mở 1b | skeptic M4 |
| F4 | **Cụm màn dựng thêm ngoài DR-012** (S18 xuất, A4 tải ảnh, A5 tạo điểm đến, G8 gỡ thành viên, S19–S21) | (a) giữ làm khung, không cam kết · (b) cắt khỏi tiêu chí hoàn tất DG-2 | giữ S19–S21; cắt S18/A4/A5; G8 để 1b | product-analyst |
| N-1…N-4 | Nhập từ MXH/Google Maps; Passport/Trip Ideas/Bộ sưu tập; "AI tạo lịch/Tối ưu"; thời tiết | mặc định chưa dựng | hỏi riêng khi PO muốn | `journey-map.md` §4 |
| C | Ảnh bìa tải lên, mô tả chuyến, "ai được xem" | mặc định không dựng | | `journey-map.md` §4 |

Việc Tầng B em đã tự làm theo mặc định (ghi ở `decisions.md` §4): "hôm nay" theo múi giờ thiết bị; xem trước PDF/Lịch chỉ cộng mục đã biết giá; chuyến chưa chắc ngày không có "Hôm nay" và không tạo lịch; ngày giả lập lưu theo từng chuyến; so trùng tên điểm đến không phân biệt dấu.

## G. Từ phản hồi của PO 26/10/2026 (`decisions/DR-015-phan-hoi-thiet-ke-26-10.md`)
| # | Câu hỏi | Phương án | Khuyến nghị (không phải quyết định) | Nguồn |
|---|---|---|---|---|
| G1 ★ | **Đánh giá của người đi / điểm sao ở trang chi tiết địa điểm** (PO: "sẽ tốt hơn nếu có phần đánh giá") | (a) chỉ nhận định biên tập "Wander gợi ý" như hiện nay · (b) đánh giá của thành viên Wander sau Lát 1b (mô hình dữ liệu mới, kiểm duyệt, chống giả mạo) · (c) nhúng điểm từ nguồn ngoài (giấy phép, chi phí, phụ thuộc bên thứ ba) | **(a)** tới khi có cộng đồng; luật dự án cấm bịa số sao | PO 26/10, `design-system.md` §1.4 |
| G2 | **Bước "Bạn mê gì?" trong onboarding** để sắp thẻ phù hợp ngay từ đầu (tăng giữ chân) | (a) chưa làm, đợi F2 · (b) làm chỉ ở máy này, không lưu lên tài khoản/chuyến | **(a)**: chạm F2 (sở thích có lưu hay không) | PO 26/10, F2 |
| G3 | **Công cụ ép chuẩn FE** (eslint-plugin-jsdoc, stylelint, boundaries, size-limit…): thêm devDependency | (a) duyệt bộ ở `frontend-standards.md` §9 khi bắt đầu pha FE · (b) chỉ rà bằng agent | **(a)** | PO 26/10, Tầng A (dependency) |
| G4 | **Cách hiểu "ACID" ở FE** (§6 chuẩn FE) và có viết lại `web/` hiện tại theo chuẩn ngay không | (a) bản dịch ở §6 + đợi dựng lại từ prototype · (b) viết lại `web/` ngay | **(a)**: `web/` sẽ bị thay khi dựng từ prototype đã duyệt | PO 26/10 |

Việc Tầng B em đã tự làm (ghi ở `implementation/decisions.md` §4): thẻ quẹt tách ảnh/thông tin; hero bìa 250 px lấy nét theo `FOCAL`; 3 cảnh onboarding với lịch mẫu 2×2 nơi có thật, không nêu giờ/giá; nhãn "chờ duyệt" dùng họ trời xanh; tấm mờ sau tờ phủ nâu ấm 34% + blur 6 px; "Để sau" ở tờ lưu chuyến lưu luôn (danh tính chưa có mã) kèm một dòng nhắc.

## H. Đã được PO trả lời ngày 26/10/2026 → xem `docs/decisions/DR-018-po-tra-loi-hang-loat-26-10.md`
Đã quyết: A3, B2 (giữ nguyên, chấp nhận rủi ro), B3, B4/E5, E1, F1, F2/G2, F3, F4 (không cắt, làm ở các pha sau), G1, G3, G4, G5, N-1…N-4, N-2 (vào 1a), Q-d, Q6, Q7, Q8, Q9, Q12, Q13. Bảng ở trên giữ làm lịch sử, KHÔNG còn là việc chờ. Còn mở: xem DR-018 §5.
Cập nhật cùng ngày (DR-019): Q10, Q15, thứ tự pha và đóng DG-2 cũng đã được quyết.
