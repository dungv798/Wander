# Roameo — rà soát 50 ảnh chụp màn hình (iPhone, 24/10/2026)

> Nguồn: `docs/UI-sample/` (50 ảnh PO chụp trên iPhone, 14:58–15:07 ngày 24/10/2026, tài khoản dùng thử). Đây là **quan sát trực tiếp**, thay cho phần suy luận từ văn bản ở `roameo-analysis.md`.
> Quy ước: "#n" là thứ tự ảnh theo dấu thời gian trong tên tệp. `UNVERIFIED` = ảnh không đủ để khẳng định. Chỉ ghi điều nhìn thấy; phần suy luận ghi rõ là suy luận.
> Không sao chép thương hiệu, minh họa hay nội dung của Roameo; chỉ học cơ chế.

## 1. Bản đồ luồng (tái dựng từ ảnh)

```
Mở app (#1) → Onboarding 11 màn (#2–#4, #11–#15) → Dùng thử miễn phí 7 ngày (#16–#17) → Đăng nhập (#18)
   → Home: bản đồ thế giới + bảng danh mục/Collections/Trending (#19–#22)
        ├─ Passport: quả cầu 3D, "Roameo explorer" (#23)
        ├─ Trips: Your Trips | Trip Ideas (311 lịch trình mẫu) (#24–#25)
        └─ Nút "+": Create Trip / Create Collection / Add Spots (#26)

Create Trip (#27–#32): Where → When → Who's going → Interests → Budget → Next
   → Trip: tổng quan (#33–#35) → "Swipe to Discover" (#36–#37) → Finish
   → ngày vẫn TRỐNG (#38) → "Generate itinerary" → 7 ngày, 33 mục (#39–#42)
   → sửa: Reorder (#43), Add activities (#44) → chia sẻ (#45–#49) → Trip Settings (#50)

Nhập từ mạng xã hội (#5–#10): Instagram Reel → Share → "Send to Roameo" → xử lý → 15 địa điểm → Save
```

## 2. Quan sát chi tiết theo màn hình

### 2.1 Onboarding và bán hàng (#1–#4, #11–#18)
- **#1** Mở đầu: "Plan less. Travel more.", ảnh thẻ xếp chồng có **dấu chấm nhiều ảnh** ở đầu thẻ, nhãn "37 Roameo Saves", minh họa 3D bóng kính (máy bay, ống nhòm, la bàn). Nút cam "Get started" / "Log in".
- **#2, #13** Bằng chứng xã hội: "500K+ trips planned", "2M+ spots saved", điểm 4,8, lời khen có tên. #13 xin đánh giá 5 sao ("Built by a small team"), "93% of users say they'll never plan trips the old way again". Con số **lệch với website** (website: "2.000+ chuyến"). Cả hai đều tự công bố.
- **#3** "What brings you to Roameo?": 4 lựa chọn, **mục đầu "Save the spots I find on social media"** được chọn sẵn; còn lại: lịch cá nhân hóa, gom địa điểm từ mọi app, **"Swipe to discover spots I'll love" xếp cuối** → quẹt không phải điểm bán hàng chính của họ.
- **#4, #11** Điểm bán số một: biến Reels/TikTok đã lưu thành lịch trình; nguồn: Instagram, TikTok, Google Maps.
- **#12** Khảo sát "How did you hear about Roameo?" (bạn bè, TikTok, Instagram, Facebook, Threads, công cụ tìm kiếm). Đo kênh thu hút.
- **#14** Biểu đồ động lực "Scattered spots → Organized trip".
- **#15** Xem trước giao diện chính: bản đồ + Collections + Trending + thanh dưới (Home / Footprints / Trips + nút "+"). Nhãn **PRO** trên màn.
- **#16–#17** "Try Roameo free — 7 days on us". Lịch trình thử: Hôm nay mở khóa toàn bộ (có "unlimited imports"); Ngày 5 nhắc; **Ngày 7 tính tiền 1.199.000₫ ngày 31/10/2026** (giá niêm yết theo nội tệ, **1.199.000₫/năm**), "No commitment · Cancel anytime", có nút đóng (X) ở góc.
- **#18** Đăng nhập **sau** màn bán hàng: Google, Apple, email; "Have a promo code?".
- *Suy luận:* thứ tự là xây dựng cam kết (khảo sát, bằng chứng xã hội) → dùng thử → đăng nhập. Hơn 11 màn trước khi vào app.

### 2.2 Nhập từ mạng xã hội (#5–#10) — được hướng dẫn bằng "coach mark"
- **#5–#7** Trên Instagram Reel "15 Places to visit in KYOTO": nhắc "Tap Share" → "Tap 'Share to…'" → bảng chia sẻ iOS có **Roameo** ("Send to Roameo"). Đây là **iOS Share Extension**.
- **#8** Màn xử lý "Matching them on the map" 86%, hoạt ảnh biểu tượng 3D.
- **#9** "Import Spots": hai tab `Post | Spots · 15`, "We found 15 spots! Review matches before saving." Mỗi dòng: ảnh, **tên chuẩn, địa chỉ đầy đủ kèm mã bưu chính**, ô chọn. Nút **"Save to collection"** và **"Save"**.
- **#10** "Saved! 15 saved" kèm pháo giấy và thông báo đẩy "Imported 15 spots from Instagram".
- *Suy luận:* hệ thống rút danh sách địa điểm từ nội dung video/bài rồi **khớp với cơ sở dữ liệu địa điểm** (địa chỉ, ảnh, điểm đánh giá). Đây là phần kỹ thuật nặng nhất của họ.
- *Quan sát phụ:* sau khi nhập 15 địa điểm, ô "Recents" ở #19 vẫn là **0** (`UNVERIFIED` vì chưa rõ nhập vào đâu).

### 2.3 Màn Home (#19–#22) — lấy bản đồ làm trung tâm
- Bản đồ "World ▾", ô tìm kiếm, avatar, ghim danh mục (đền, lá, dĩa, nốt nhạc). Nhãn bản đồ **theo ngôn ngữ máy** (#23 hiện "CHÂU ÂU, CHÂU PHI") và có logo ở góc dưới trái → **gần như chắc chắn dùng Apple Maps (MapKit)**, nhưng đây là suy luận từ ảnh.
- Biểu tượng tia sét + số "6" + dấu "!" đỏ ở góc phải (#19): **`UNVERIFIED`** (có thể là hạn mức/ tín dụng nhập).
- Bảng kéo lên: chip danh mục **Saved · Food · Culture · Nature · Shopping · Entertainment · Wellness**; "Your Collections" (Recents + "New collection"); "Trending in this area".
- **#20** Ảnh thu nhỏ **chưa tải** (ô trống), #21 đã tải: ảnh có nhưng tốc độ tải là điểm đau (khớp ghi chú phiên bản "tải ảnh nhanh hơn").
- **#21–#22** "Food in this area": thẻ gồm ảnh, tên, loại (Kaiseki Restaurant, Cocktail Bar…), điểm sao (4,4; 4,7…), khu vực. Nội dung trộn **Kyoto, Bangkok, Hong Kong, Bali** → kho địa điểm toàn cầu, không phải danh sách biên tập theo vùng.
- Thanh điều hướng dạng viên thuốc nổi: **Home / Passport / Trips** + nút tròn "+" bên phải.

### 2.4 Passport và Trip Ideas (#23–#25)
- **#23 Passport:** quả cầu 3D, "Dung Vo · Roameo explorer", "You've been to…" (theo dõi nước đã đến). Hướng "hộ chiếu du lịch" cá nhân.
- **#24 Trips (trống):** hai tab **Your Trips | Trip Ideas**, tìm kiếm, Filters, Sort; trạng thái rỗng "Plan your next trip" + "Create a Trip".
- **#25 Trip Ideas:** "**311 itineraries**" mẫu; thẻ có nhãn nhóm (**Friends / Solo**), số ngày, tên, nơi, số lưu và số thích. Có nhãn "Recommended for you". **Ảnh bìa bị dùng lại** (nhiều thẻ cùng ảnh Tokyo Tower) → nội dung mỏng, `suy luận`: lịch mẫu do hệ thống/cộng đồng, chất lượng chưa đều.
- **#26 Nút "+":** Create Trip ("Plan your perfect itinerary"), Create Collection ("Group your saved spots"), **Add Spots ("Import or search for spots")**.

### 2.5 Tạo chuyến (#27–#32) — **chuyến đi trước, quẹt sau**
1. **Where?** Ô tìm kiếm, chip vùng (All Regions, Asia, Europe, North America…), "Popular destinations": **Da Lat, Hanoi, Bangkok, Ho Chi Minh City, Da Nang, Nha Trang, Hue, Kuala Lumpur**. Điểm đến là **thành phố**, danh sách sắp theo vùng người dùng (Việt Nam đứng đầu; `suy luận` theo vị trí/ngôn ngữ).
2. **When?** Lịch tháng, công tắc **"Flexible days"** (Anytime), ngày quá khứ bị mờ; **"Active hours" 9:00 AM–10:00 PM** (giờ hoạt động mỗi ngày). Mặc định chọn **7 ngày (24–30/10)**.
3. **Who's going?** Solo / Family / Romantic / Friends / Business.
4. **Interests:** Culture & History, Nature, Shopping, Food & drinks, Entertainment, Wellness.
5. **Budget:** Budget US$30–60, Value US$60–100, Standard US$100–150, Premium US$180–260, Luxury US$260–400 (`UNVERIFIED`: không ghi "mỗi ngày / mỗi người", nhưng khung giá theo ngày là hợp lý).
- Mỗi mục là một thẻ gập; "Next" ở cuối. Các lựa chọn này là **đầu vào cho gợi ý và tạo lịch bằng AI** (`suy luận`, vì lịch tạo ra mang đúng chủ đề "Culture & History" rồi đổi tên "Cultural and Nature").

### 2.5b Trang chuyến đi (#33–#35)
- Bản đồ ở trên, **bảng kéo** ở dưới; tiêu đề chuyến, ảnh bìa, **hàng avatar thành viên + nút "+"** (mời người), tab ngang **Overview, Day 1…Day 7**.
- Thẻ **"Swipe to Discover"**: "Swipe through spots and like your favourites to shape your itinerary", đóng được.
- "**Before you go**": điều kiện điển hình **19–26 °C, 6,7 mm/ngày, 11h43 ánh sáng**, "No national holidays on these dates".
- "**Trip Stats**" (biểu đồ vòng theo loại, tổng số địa điểm), "**Memo**" (tự viết "Solo trip for 1 person. Interests: …"), "**Checklist**" (gợi ý eSIM), "**Discounts**": **Airalo 20% off eSIM, Holafly 5% off eSIM** (liên kết khuyến mãi, `suy luận`: nguồn doanh thu).
- "**Saved**": trạng thái rỗng minh họa Instagram, TikTok, Google Maps → mục nhập từ mạng xã hội.
- Nút nổi: **"Generate itinerary"** (hình tia sáng), **"Edit"**, "+".

### 2.6 Cơ chế quẹt (#36–#37) — phần PO quan tâm nhất
- Màn "**Swipe to select**", nút đóng (X), nút **"✓ Finish"**; sau lần quẹt đầu hiện thêm **nút hoàn tác** (mũi tên quay lại, #37).
- **Thẻ ảnh toàn khung**, phía trên có **thanh phân đoạn nhiều ảnh** (#37: 5 đoạn, đoạn đầu sáng) → **thẻ có nhiều ảnh, kiểu "story"** — trả lời câu hỏi mở của PO: **có**.
- Dưới thẻ: **tên, 5 sao + điểm (4,4 / 4,5), loại (Entertainment / Plaza)**, nút "**View details**" (kéo lên xem hồ sơ), **biểu tượng đánh dấu (bookmark)** ở góc trên phải.
- Quẹt trái hiện **dấu X đỏ 3D khổng lồ** (#36), thẻ phía sau lộ ra bên phải. Không thấy điểm "Match %" trên thẻ (website có nhắc) — `UNVERIFIED`.
- **Sau khi quẹt xong, các ngày vẫn trống** (#38: "No activities planned for this day"). Quẹt chỉ đưa địa điểm vào "đã chọn/Saved"; **việc xếp thành lịch là một bước khác**.

### 2.7 Tạo lịch trình bằng AI (#38–#44)
- Bấm "**Generate itinerary**" → **7 ngày, 33 địa điểm** (#39 "Total 33"), tên chuyến đổi thành "Dalat Cultural and Nature Discovery".
- Bản đồ tổng quan: tuyến theo ngày có màu, nhãn **"DAY 5 · 11 km"**.
- **Ngày (#40–#42):** khung giờ ngày ("09:00 – 19:00"), mỗi hoạt động có **giờ, loại (CULTURE & HISTORY, GOLF COURSE, NATURE, FOOD & DRINKS…), tên, mô tả một câu do AI viết, ảnh nhỏ**, giữa các điểm hiện **thời gian đi bộ và đi xe** ("48 min", "~12 min"). Bản đồ có ghim đánh số và đường đi.
- Nút "Generate itinerary" đổi thành **"Optimize"** sau khi đã có lịch.
- **Reorder (#43):** chế độ sắp xếp có ô chọn bên trái và **tay kéo** bên phải, nút Done, "+ Add".
- **Add activities (#44):** tìm "all spots", **chọn ngày** ("Day 5 · Oct 28"), hai tab **For you | Saved**, "Recommended in Da Lat — Based on your trip", chọn nhiều bằng vòng tròn, nút "Add activities".
- **Lỗi/ hạn chế quan sát được (khách quan):**
  - Một số **ảnh trống** hoặc tải chậm (#41).
  - **Memo nói "A 3-day exploration" trong khi chuyến 7 ngày** (#45, #50).
  - Một số điểm lạ cho khách du lịch (sân golf, bảo tàng nhà tù thanh niên, "Bến đò cây thông cô đơn").
  - **Ảnh bìa bị lật ngược** (#50).
  - Hai tiêu đề chuyến khác nhau trước/sau khi tạo.
  → AI tạo lịch **nhanh nhưng chất lượng chưa chắc**.

### 2.8 Chia sẻ (#45–#50)
- Hộp thoại **"Share this trip? Anyone who has the link will be able to open this trip. You can make it private again in Trip Settings."** → chia sẻ = **liên kết công khai cho người có link**, không phải mời thành viên.
- Bảng "**Share Your Trip**": **Share as Image** (cho stories/bài đăng), **Export PDF** (lịch in được), WhatsApp, **Calendar**, Share, Copy link.
- **Share as Image (#47–#49):** ảnh dài nhiều trang, thương hiệu Roameo, tên chuyến, người tạo, "7 days · 33 activities", **dòng thời gian theo ngày có giờ, tên, địa chỉ đầy đủ tiếng Việt, ảnh nhỏ**; chân trang có **liên kết `https://www.roameoai.com/trip/<mã>`** → mỗi chuyến có **trang web công khai** theo mã.
- **Trip Settings (#50):** ảnh bìa, tiêu đề (đếm 35/100), mô tả, ngày bắt đầu/kết thúc, "**Who can see this trip**" (phần hiển thị). Thành viên: avatar + "+" (cách mời chưa thấy, `UNVERIFIED`).

## 3. Những điều ảnh cho phép khẳng định

| Điều | Mức chắc | Ghi chú |
|---|---|---|
| Thẻ có nhiều ảnh theo kiểu story | Chắc (#37) | Thanh phân đoạn trên thẻ |
| Quẹt chỉ chọn địa điểm, **không tự xếp lịch** | Chắc (#38 → #39) | Lịch do bước "Generate itinerary" |
| Trip trước, quẹt sau (quẹt nằm **trong** một chuyến) | Chắc (#33, #36) | Có điểm đến + ngày + nhóm + sở thích + ngân sách trước khi quẹt |
| Chia sẻ = link công khai + xuất ảnh/PDF/lịch | Chắc (#45–#49) | Chưa thấy quyền "đề xuất xóa / chủ duyệt" |
| Bỏ phiếu nhóm kiểu "Group Verdict" | **Không thấy** | Có thể ở phần nhóm khác; `UNVERIFIED` |
| Giỏ hàng theo phiên | **Không thấy** | Gần nhất: "Saved"/Collections |
| Dùng Apple Maps | Suy luận mạnh | Nhãn theo ngôn ngữ máy, logo góc dưới |
| Nội dung từ kho địa điểm toàn cầu | Suy luận mạnh | Ảnh, địa chỉ, sao, mã bưu chính, mã Plus-code; không nêu nguồn |
| Doanh thu | Chắc | Thuê bao 1.199.000₫/năm sau 7 ngày + liên kết khuyến mãi eSIM |
| Hệ thiết kế | Chắc | Cam gradient trên nền xanh trời, bóng kính 3D, nút viên thuốc, bảng kéo trên bản đồ, thanh dưới nổi |

## 4. So sánh với tầm nhìn của PO

| Bước PO mô tả | Roameo (quan sát) | Khoảng cách / quyết định cho Wander |
|---|---|---|
| Tìm điểm đến → ứng viên | Tạo chuyến chọn **thành phố**, sau đó quẹt trong chuyến | PO muốn **deck-first**: tìm → quẹt → mới thành lịch. Khác thứ tự (Roameo: trip-first) |
| Mỗi ứng viên = **một địa điểm**, nhiều ảnh, chạm sang ảnh sau | Đúng: địa điểm cụ thể, nhiều ảnh dạng story, "View details" | **Khớp.** Cần quyết xung đột cử chỉ: chạm cạnh = đổi ảnh, kéo = quyết định |
| Quẹt hết → vào trip mặc định theo điểm đến, như giỏ hàng | Không có; quẹt xong phải bấm Finish rồi **Generate itinerary** | Ý "giỏ" của PO **đơn giản và tốt hơn** cho dữ liệu thủ công; cần quy tắc cho nhiều giỏ cùng điểm đến |
| Hỏi có lưu vào lịch trình không; đặt tên / "Hà Giang - 2" | Tên do AI đặt, sửa ở Trip Settings; không thấy "- 2" | Đặc thù của PO, tự thiết kế |
| Chia sẻ nhóm; nhóm thêm / **yêu cầu xóa** | Link công khai; avatar + "+" mời người; không thấy quy trình yêu cầu xóa | Của PO là **chủ duyệt đề xuất**, gần B-series của plan |
| Cổng admin cấu hình địa danh | Không thấy; nội dung dường như lấy từ kho ngoài | **Khác biệt chiến lược**: nội dung do PO biên tập |

## 5. Những điều đáng học cho Wander (cơ chế, không phải thương hiệu)

1. **Một kho "Place" giàu dữ liệu quyết định cảm giác ứng dụng:** ảnh nhiều, đánh giá, loại, địa chỉ chuẩn. Thiếu ảnh/ tải chậm là lỗi nhìn thấy ngay (#20, #41).
2. **Thẻ story nhiều ảnh** là cơ chế đã được thị trường chấp nhận; đừng để chạm đổi ảnh xung đột với quẹt.
3. **Tách "chọn" và "xếp lịch":** quẹt không tự tạo lịch; có bước riêng và có chỗ chỉnh tay (Reorder, Add activities). Wander đã có sẵn lõi xếp lịch thủ công (Lát 1a), chỉ cần nối từ danh sách đã chọn vào các ngày.
4. **Bảng kéo trên bản đồ** làm màn trung tâm; xem tuyến theo ngày có màu và khoảng cách.
5. **Xuất ảnh/PDF/lịch/liên kết** là các điểm thoát nhẹ để lan truyền; ảnh chia sẻ có thương hiệu và liên kết quay về.
6. **Tùy chọn khi tạo chuyến là đầu vào của gợi ý** (nhóm, sở thích, ngân sách, giờ hoạt động), không phải nhãn trang trí. So với Q11 của Wander (ngân sách có hành vi; kiểu/nhịp chỉ là nhãn), đây là lập luận để **cho kiểu/nhịp một hành vi** (lọc thẻ quẹt theo kiểu chuyến) thay vì chỉ lưu nhãn.
7. **Onboarding dài và bán hàng sớm** là chiến lược thương mại; Wander (học tập, không thu tiền) không cần.

## 6. Rủi ro và điểm yếu của Roameo (để tránh)

- Nội dung AI không nhất quán (memo "3 ngày" cho chuyến 7 ngày; địa điểm lạ; tên đổi giữa chừng).
- Số liệu tự công bố lệch nhau (500K+ chuyến trong app vs 2.000+ trên website).
- Ảnh trống/chậm và ảnh bìa lật ngược; ảnh bìa lặp lại ở Trip Ideas.
- Thu thập dữ liệu rộng (vị trí chính xác, ảnh, định danh thiết bị) theo nhãn quyền riêng tư; mâu thuẫn với D20–D26.
- Phụ thuộc nhà cung cấp nội dung/bản đồ không công bố → khó kiểm soát giấy phép và chất lượng.

## 7. Câu hỏi còn lại cho PO (xem tóm tắt trong phản hồi)

1. **Deck-first (như PO mô tả) hay trip-first (như Roameo)?** Đề xuất: giữ deck-first nhưng cho phép "gắn vào chuyến có sẵn".
2. **Nội dung địa điểm:** biên tập tay vài chục nơi cho một điểm đến để thử (dùng cổng admin hoặc tệp dữ liệu), hay tích hợp API địa điểm?
3. **Có muốn "Generate itinerary" (AI xếp lịch) không?** Roameo coi đây là lõi; với Wander có thể làm sau, và là cơ hội học (gọi mô hình AI).
4. **Bản đồ:** Apple Maps chỉ có trên iOS gốc; web cần lựa chọn khác (Tier A khi đến lúc).
