# Phân tích sản phẩm Roameo và đối chiếu với tầm nhìn Wander

> Trạng thái: **nghiên cứu, chưa phải quyết định** (24/10/2026). Master plan v0.4 không đổi.
> Mục đích: hiểu Roameo đủ rõ để PO chốt sản phẩm Wander trước khi thiết kế và viết code.
> Nguyên tắc: chỉ ghi điều có nguồn; điều không tra được ghi `UNVERIFIED`. Không sao chép thương hiệu, giao diện hay nội dung của Roameo.

## 0. Độ tin cậy của nguồn

| Nguồn | Đọc được gì | Hạn chế |
|---|---|---|
| Trang chủ [roameoai.com](https://www.roameoai.com/) | Mô tả tính năng của hãng | Quảng bá; số "5.0" và "2.000+ chuyến" không nêu cách đo |
| [App Store](https://apps.apple.com/us/app/roameo-ai-trip-planner/id6748898199) (đọc 24/10/2026) | Mô tả, **lịch sử phiên bản**, giá mua trong app, 4 đánh giá, nhãn quyền riêng tư | Nhãn quyền riêng tư do nhà phát triển tự khai; chỉ 25 lượt đánh giá |
| [Chính sách riêng tư](https://www.roameoai.com/privacy) và [điều khoản](https://www.roameoai.com/terms) | Nhà cung cấp bên thứ ba được nêu tên | Không nói nguồn dữ liệu địa điểm hay ảnh |
| [Product Hunt](https://www.producthunt.com/p/roameo) | Lời của người làm: "như ứng dụng hẹn hò nhưng cho quán bar và nơi ẩn" | Không có bình luận người dùng |
| [PhocusWire](https://www.phocuswire.com/interviews/startups/startup-stage-roameo-targets-group-travel-planning-swipe-match-interface), Google Play, AppBrain, trang phân tích thị trường | **Không đọc được nội dung** (lỗi 403 hoặc bị cắt) | Chỉ có đoạn trích từ kết quả tìm kiếm; các nhận định lấy từ đó ghi rõ là "đoạn trích" |

**Cập nhật 24/10/2026:** PO đã dùng thử Roameo trên iPhone và chụp 50 ảnh (`docs/UI-sample/`). Phần **quan sát màn hình thật** nằm ở [`roameo-ui-review.md`](roameo-ui-review.md) và **thay thế** các điểm `UNVERIFIED` bên dưới: thẻ **có nhiều ảnh dạng story**; quẹt **không tự xếp lịch** (phải bấm "Generate itinerary"); **trip-first** (chọn điểm đến, ngày, nhóm, sở thích, ngân sách rồi mới quẹt); chia sẻ là **liên kết công khai** + ảnh/PDF/lịch; không thấy "Group Verdict" hay giỏ hàng theo phiên; giá thuê bao hiển thị 1.199.000₫/năm sau 7 ngày dùng thử. Các mục dưới đây viết trước khi có ảnh nên đọc kèm tệp đó.

## 1. Roameo là gì

Ứng dụng lập kế hoạch du lịch nhóm: mỗi người **quẹt Thích / Không** trên các địa điểm đã chọn lọc, hệ thống gom các "match" của nhóm rồi tạo **lịch trình theo ngày, tối ưu tuyến**, kèm liên kết đặt chỗ. Nhà phát triển: Silvertree Ventures Limited (đăng ký tại Hồng Kông, theo cửa hàng ứng dụng). Miễn phí kèm mua trong app (freemium).

Tính năng (theo trang chủ và lịch sử phiên bản):

| Nhóm | Nội dung | Nguồn |
|---|---|---|
| Khám phá | Thẻ địa điểm có **điểm "Match" phần trăm**, thẻ loại (Culture, Romance, Ocean), mức giá $–$$$; "AI học phong cách của bạn" | Trang chủ |
| Tìm điểm đến | **Tìm thành phố → bản đồ bay tới điểm đến** (1.5.x); trang chủ **lấy bản đồ làm trung tâm** (1.4.x) | App Store |
| Nhập cảm hứng | Nhập từ Instagram, TikTok, Xiaohongshu; nhập từ ảnh chụp màn hình/bài đăng (1.4.x) | App Store, trang chủ |
| Bản đồ | Địa điểm đã lưu hiện trên bản đồ, lọc theo loại, điểm đánh giá, khoảng cách | Trang chủ |
| Nhóm | Mời bạn quẹt và xếp hạng cùng nhau; lập kế hoạch theo thời gian thực; **"Group Verdict"** (hiển thị phiếu từng người) (1.5.x) | App Store |
| Lịch trình | AI tạo lịch theo ngày; **tab theo ngày, kéo-thả để xếp** (1.5.x); so sánh tuyến đi bộ/xe đạp/lái xe/phương tiện công cộng (1.5.x); xem trước lịch trình | App Store |
| Bộ sưu tập | Collections (1.4.x); sắp xếp bộ sưu tập (1.6.3) | App Store |
| Chia sẻ | Chia sẻ lịch trình dưới dạng ảnh hoặc PDF (1.5.x) | App Store |
| Đặt chỗ | Liên kết Klook, Trip.com, Agoda; "không phụ phí ẩn"; "đặt tự động" ghi **Coming soon** | App Store, trang chủ |
| Hồ sơ du lịch cá nhân | **Trip Pass** (hộ chiếu/ghi nhớ các nước đã đến), "Footprints" bản đồ nơi đã đi, **nhập chuyến đã đi từ ảnh** (1.5.x–1.6.x) | App Store |
| Đánh giá | Chi tiết địa điểm có **đánh giá của du khách** (1.6.3) | App Store |

## 2. Lịch sử phiên bản = họ ưu tiên gì

Đọc từ ghi chú phiên bản (suy luận, không phải lời của hãng):

1. **1.4.x:** Collections, hệ **tín dụng "Trip Pass"**, làm lại giao diện "kính 3D", nhập ảnh chụp màn hình/bài đăng, trang chủ bản đồ. → Sớm đầu tư **nhập nội dung từ mạng xã hội** và **kiếm tiền**.
2. **1.5.x:** tìm thành phố, điểm Match, so sánh tuyến, Footprints, tab ngày, Group Verdict, chia sẻ ảnh/PDF. → Mở rộng từ "quẹt" sang **lịch trình và nhóm**.
3. **1.6.0–1.6.1:** tinh chỉnh onboarding, thẻ quẹt, xem trước lịch, **tải ảnh nhanh hơn, hoạt ảnh mượt hơn**. → Ảnh chậm và quẹt không mượt từng là điểm đau.
4. **1.6.2–1.6.3:** theo dõi các nước đã đến, đánh giá của du khách. → Hướng thành **"hộ chiếu du lịch" cá nhân**, không chỉ công cụ lập kế hoạch nhóm.

## 3. Mô hình kinh doanh và công nghệ (suy ra)

- **Freemium.** Mua trong app niêm yết (App Store): gói tháng 9,99 USD, quý 17,99 USD, năm 29,99–39,99 USD (liệt kê nhiều mức giá khác nhau cho cùng tên), "Trip Pass" 4,99 USD. Một đoạn trích khác nêu gói năm 59,99 USD. → Giá thay đổi hoặc thử nghiệm; **không kết luận chắc**.
- Một đoạn trích từ trang phân tích thị trường nêu "ma sát kỹ thuật và **chặn tính năng bằng thanh toán gắt**" có thể đẩy người dùng sang công cụ miễn phí. Chưa đọc được nguyên bài (`UNVERIFIED`).
- **Bên thứ ba được nêu tên:** Supabase (hạ tầng dữ liệu), AppsFlyer (đo lường quảng cáo), RevenueCat (quản lý đăng ký). AI không nêu nhà cung cấp.
- **Nguồn dữ liệu địa điểm và ảnh: không công bố** (cả chính sách, điều khoản lẫn trang chủ). Chỉ có câu miễn trừ "đề xuất dựa trên dữ liệu sẵn có, có thể không phản ánh tình trạng hiện tại".
- Ngôn ngữ giao diện: Anh, Ả Rập, Pháp, Đức, Hindi, Bồ Đào Nha, Trung (giản/phồn), Tây Ban Nha. **Không có tiếng Việt.** Nền tảng: iOS (iOS 17+), Android có.
- Dữ liệu thu thập (tự khai): vị trí chính xác và gần đúng, tên/email, ảnh/video của người dùng, định danh thiết bị, dữ liệu sử dụng; dùng để "theo dõi" và quảng cáo bên thứ ba. → Hướng dữ liệu khác hẳn tiêu chí riêng tư của Wander (D20–D26: ẩn danh).

## 4. Đánh giá của người dùng

Số liệu đánh giá **thay đổi theo thời điểm và nguồn**: App Store 4,5/5 (25 lượt) lúc đọc, 3,8/5 (10 lượt) ở lần tra trước; Google Play 4,3/5 (2.024 lượt) theo AppBrain, 4,2/5 (1.310 lượt) theo trang phân tích khác. Cỡ mẫu nhỏ.

- **Khen:** giúp nhóm 8 người chốt lịch Hồng Kông; gợi ý nhà hàng/hoạt động chưa biết; "gamified" dễ dùng; hợp nhu cầu nhóm có sở thích khác nhau.
- **Chê:** một đánh giá Google Play nói "quẹt không làm gì" (nhà phát triển trả lời đã sửa); đoạn trích phân tích nêu ma sát kỹ thuật và paywall.
- **Tín hiệu:** giá trị nằm ở bước **nhóm chốt nhanh**, rủi ro nằm ở **độ mượt khi quẹt**, **ảnh tải chậm**, và **việc khóa tính năng**.

## 5. Tầm nhìn của PO (24/10/2026) và đối chiếu

Luồng PO mô tả:

1. Người dùng **tìm một điểm đến** (ví dụ "Hà Giang") → ra **danh sách ứng viên**, mỗi ứng viên là **một địa điểm**.
2. Thẻ có **nhiều ảnh, chạm để sang ảnh tiếp theo** (như Tinder) và có "hồ sơ" của thẻ.
3. Quẹt phải xong hết danh sách → các nơi đã chọn vào **trip mặc định của điểm đến đó trong phiên**, giống **giỏ hàng**.
4. Hệ thống hỏi **có lưu vào lịch trình không**; được **đặt tên hoặc lưu vào bản khác** ("Hà Giang - 2", "Hà Giang - 3"...).
5. **Chia sẻ lịch trình cho nhóm**; nhóm có thể **chọn thêm** các địa điểm chưa được chọn hoặc **yêu cầu xóa** địa điểm không muốn.
6. **Cổng admin** để cấu hình địa danh và những gì hiển thị trên hệ thống.
7. Không thương mại hóa ngay; làm vì thích và để học.

| Bước của PO | Roameo (theo nguồn) | Khác biệt / điểm cần quyết |
|---|---|---|
| 1. Tìm điểm đến → ứng viên | Tìm thành phố, bản đồ bay tới; thẻ mẫu theo thành phố | Tương tự. Cần quyết: ứng viên là **địa điểm trong điểm đến** (quán, đèo, homestay?) hay **cả điểm đến** |
| 2. Nhiều ảnh trên thẻ | Có cải thiện tải ảnh, thẻ quẹt (1.6.x); **nhiều ảnh mỗi thẻ: chưa xác nhận** (`UNVERIFIED`) | Điểm PO muốn làm rõ; nội dung ảnh là nút thắt (nguồn, bản quyền, dung lượng) |
| 3. Giỏ hàng theo điểm đến/phiên | Có "bộ sưu tập" và lịch trình; **mô hình "giỏ theo phiên" không thấy** | Khái niệm của PO khá riêng: giỏ **tự tạo** từ quẹt rồi mới **chốt thành lịch trình** |
| 4. Lưu/đặt tên/"Hà Giang - 2" | Không có mô tả tương ứng | Cần quy tắc đặt tên mặc định, trùng tên, và "lưu vào lịch trình có sẵn hay tạo mới" |
| 5. Nhóm thêm / đề xuất xóa | Nhóm cùng quẹt và bỏ phiếu ("Group Verdict") | Của PO là **chủ lịch trình duyệt** (yêu cầu xóa → chủ chấp nhận), gần Q6/Q9/B-series của plan (đề xuất/duyệt) hơn là bỏ phiếu ngang hàng |
| 6. Cổng admin | Không thấy; nguồn dữ liệu không công bố | PO muốn **nội dung do mình biên tập** thay vì tự động. Khác biệt chiến lược |
| Ngoài tầm nhìn PO | AI lịch trình tối ưu tuyến, liên kết đặt chỗ, nhập mạng xã hội, bản đồ, hộ chiếu du lịch, chia sẻ PDF | Để sau; chỉ chọn thứ nào PO thấy hay |

**Cơ hội khác Roameo (giả thuyết):** tiếng Việt và địa danh Việt Nam; nội dung biên tập có chiều sâu thay vì tự động; không theo dõi người dùng; lịch trình gắn với lõi lập kế hoạch cá nhân đã có (Lát 1a).

## 6. Hệ quả cho mô hình Wander (đề xuất, chưa duyệt)

Khái niệm mới cần có ngoài Lát 1a:

- **Điểm đến** (Destination, ví dụ Hà Giang) → nhiều **địa điểm** (Place) → nhiều **ảnh** (Photo, kèm nguồn và giấy phép) + hồ sơ (tags, mùa, chi phí, hoạt động, lưu ý).
- **Phiên quẹt** (SwipeSession): người dùng + điểm đến + các lựa chọn → **giỏ** (chuyến nháp tự tạo).
- **Chốt giỏ** → tạo **Trip** thật (đã có) với các mục từ địa điểm đã chọn; quy tắc đặt tên "Hà Giang - n".
- **Chia sẻ** (Lát 1b): thêm địa điểm từ kho vào chuyến, **đề xuất xóa → chủ duyệt** (ánh xạ vào cơ chế đề xuất/duyệt của plan).
- **Cổng admin**: biên tập Điểm đến/Địa điểm/Ảnh, nháp → xuất bản, nguồn và giấy phép, thứ tự hiển thị.

Va chạm với plan hiện có cần PO quyết: D14 (gõ tự do là chính, gợi ý ở Lát 3), Q10 (thứ tự Lát 2/3), Q15 (nguồn dữ liệu địa điểm), Q6/Q9 (quyền và vòng đời mục), Q16 (xác thực: admin là bề mặt thứ hai).

## 7. Nới lỏng quy định trong giai đoạn học (đề xuất để PO xác nhận)

PO nói chưa thương mại hóa nên có thể nới policy khi phát triển. Mình chưa đổi quy tắc nào. Đề xuất ranh giới, chờ PO xác nhận bằng một DR:

| Nới (giai đoạn học cá nhân) | Giữ nguyên |
|---|---|
| Nội dung/ảnh dùng cho **máy cá nhân** có thể lấy từ nhiều nguồn để thử cảm giác, **với điều kiện** ghi nguồn và không xuất bản ra ngoài | Không đưa dữ liệu hay ảnh chưa rõ giấy phép lên bản chạy công khai hoặc chia sẻ cho người ngoài |
| Hỏi PO ít hơn cho quyết định khám phá/prototype (Tier A thành Tier B khi chỉ ảnh hưởng nhánh thử) | Hỏi PO trước khi tạo tài nguyên đám mây, tạo bí mật, hay đổi bảo mật |
| Cổng phát hành RG chỉ áp dụng khi có người dùng thật | Không bao giờ cho người dùng thật dùng khi RG-1/2/5/6/7 còn mở |
| Cho phép dữ liệu mẫu/AI soạn nháp trong prototype | Không ghi dữ liệu mẫu hay AI-soạn thành "sự thật" trong hồ sơ nếu chưa có nguồn |
| | Master plan chỉ sửa khi PO nói; không lộ bí mật; không viết lại lịch sử git |

## 8. Việc tiếp theo cho phần phân tích Roameo

1. **PO dùng thử Roameo khoảng 30 phút** (iPhone/Android) và ghi lại: onboarding hỏi gì; thẻ có nhiều ảnh không và chạm làm gì; cách tìm điểm đến; "match" tính ra sao; mời bạn vào nhóm thế nào; hết bộ thẻ thì đi đâu; phần nào bị khóa sau paywall. Mình cung cấp danh mục kiểm (checklist) và nhận ảnh chụp màn hình để phân tích.
2. Mình tra thêm: bài PhocusWire (nếu đọc được), đánh giá chi tiết trên App Store/Google Play, các ứng dụng cùng loại ở thị trường châu Á và Việt Nam.
3. Sau đó viết **đặc tả sản phẩm v1** (luồng, màn hình, mô hình dữ liệu, phạm vi lát) để PO duyệt, rồi mới thiết kế giao diện.
