# Wander — Kế hoạch tổng thể

> **Phiên bản:** v0.4 (bản nháp, đã cập nhật theo quyết định Q1–Q5 và hướng thiết kế Q16) · **Cập nhật:** 23/10/2026
> **Trạng thái:** đang ở giai đoạn planning. Chưa chọn công nghệ, chưa có code, **chưa có spec chính thức cho Lát 1a**.
> **Nguồn chính:** file `KeHoachDuLich_HaGiang_TaXua_v10.xlsx` (chuyến thật của bạn) và các cuộc trao đổi Phase 1–5, bản review trước implementation.

**Ký hiệu (v0.3):** ✅ **Đã duyệt** (quyết định chính thức) · 📎 **Dữ kiện** (từ file hoặc lời bạn, không phải quyết định) · 🔶 **Đề xuất chưa duyệt** (gồm cả hệ quả suy ra từ một quyết định, chờ bạn xác nhận) · 🔁 **Đề xuất cũ đã bị quyết định thay thế** (toàn bộ hoặc một phần) · 🧪 **Giả định / cần kiểm chứng** · ❓ **Câu hỏi mở**

> **Quy tắc đọc:** chỉ ✅ mới là quyết định. 🔶 và ❓ **không phải quyết định**, kể cả khi đã kèm phương án mặc định. Gặp 🔶 hoặc ❓ khi viết spec hoặc code thì dừng lại và hỏi. **Những chi tiết chưa được chốt không được suy diễn:** cơ chế xác thực cụ thể, thiết kế giao diện, cấu trúc cơ sở dữ liệu và phân quyền chi tiết ở Lát 1b.

---

## 0. Cách dùng tài liệu này

- Đây là tài liệu sống. Mọi quyết định ghi ở **§14**, câu hỏi mở ở **§15**. Sửa tại chỗ rồi tăng số phiên bản.
- Khi làm việc với Claude Code, chỉ đưa mục liên quan (ví dụ §7 và §9.1 cho Lát 1a), không dán cả file mỗi lần.
- Mỗi lát sẽ có một spec riêng ngắn (`docs/slices/lat-1a.md`…) rút từ §9. **Spec Lát 1a chưa được tạo**; các blocker còn lại nằm ở §15.
- Thứ cần bạn đối chiếu với thực tế: **§10 (Replay test)**.

**Thay đổi từ v0.3 sang v0.4 (hướng thiết kế Q16):**
1. Ghi 7 quyết định mới (**D20–D26**) ở §14.1: nguyên tắc khôi phục, hướng bằng chứng, phạm vi mã, vòng đời mã, luồng khôi phục, xác thực lại, hiển thị mã.
2. **Q16 vẫn ❓ và G7 vẫn 🧪.** Bản thiết kế chi tiết (`docs/autopilot/q16-design-draft.md`) chưa được duyệt; blocker §15.6 mục 1 chưa đóng.

**Thay đổi từ v0.2 sang v0.3 (đối chiếu quyết định Q1–Q5):**
1. Ghi 5 quyết định mới (**D15–D19**) ở §14.1; Q1–Q5 chuyển sang "đã giải quyết" ở §15.0.
2. **Lát 1a nay gồm danh tính ẩn danh, lưu dữ liệu phía server, mở trên thiết bị khác và thiết kế xác thực/khôi phục quyền chủ chuyến** (D15). Vì vậy 1a **lớn hơn** so với v0.2 (§13).
3. **Thứ tự mục thủ công** thay cho sắp xếp theo giờ (D16); chi phí theo D17–D18; xóa mềm, Hoàn tác và khu vực "Đã xóa gần đây" theo D19; **không có lịch sử chỉnh sửa**.
4. Các đề xuất cũ bị quyết định thay thế được đánh dấu **🔁** (§14.2, §15.0).
5. Thêm câu hỏi mới **Q16–Q18** cho những chi tiết chưa chốt, thay vì suy diễn (§15).

**Thay đổi từ v0.1 sang v0.2:** tách Lát 1 thành 1a/1b, thêm nhánh prototype swipe, tách ký hiệu ✅/📎/🔶/🧪/❓, viết lại mô hình, quy tắc, tiêu chí, Replay test và ước tính.

---

## 1. Mục tiêu

| # | Mục tiêu | Trạng thái | Ghi chú |
|---|---|---|---|
| 1 | **Làm vì thích**, ưu tiên số một | ✅ | Quyết định phạm vi theo cái bạn thấy hứng thú và dùng được thật |
| 2 | Nâng kỹ năng làm sản phẩm và phần mềm | ✅ | Mỗi lát nên dạy được một thứ rõ ràng |
| 3 | Kiếm tiền: **để sau** | ✅ | Chỉ giữ đường mở, không ép (xem §11.4) |
| 4 | Dùng Claude Code hiệu quả, không phức tạp, không tốn token vô ích | ✅ | Xem §16 |

**Nguồn lực (✅ D5, D6):** khoảng **15–25 giờ mỗi tuần** là khả năng hiện tại, **không phải cam kết hay deadline**. Tết 2027 chỉ là mốc tham khảo.

**Tiêu chí thành công (🔶 đề xuất, chờ duyệt):**
1. Mỗi lát tạo ra thứ **dùng được thật** trong một chuyến đi thật.
2. **Replay test** (§10) cho Lát 1a đạt theo cách đo ở §10.5. Phần chia sẻ không tính ở đây mà thuộc Lát 1b.
3. Khi giờ thực tế của một lát vượt **cận trên** của khoảng ước tính của lát đó thì dừng lại xem lại phạm vi (thay cho "2× ước tính" ở v0.1, vốn không có mốc cơ sở rõ ràng).

---

## 2. Bằng chứng từ chuyến thật

### 2.1 Dữ kiện

| Mục | Giá trị |
|---|---|
| 📎 Chuyến | Quy Nhơn → Hà Nội → Hà Giang → Tà Xùa → Hà Nội → Quy Nhơn |
| 📎 Thời gian | 29/08 – 06/09/2026 · tiêu đề file ghi "8 ngày 7 đêm" (9 ngày lịch, 9 khối ngày; xem R5 ở §7.4) |
| 📎 Số người | **2 người** (file ghi "1 người" nhưng thực tế đi 2; bungalow Tà Xùa là phòng 2 người) |
| 📎 Cấu trúc file | 3 sheet: Lịch trình (64 mục, Ngày 0–8), Chi phí & Thống kê, Checklist (27 hạng mục, 5 nhóm) |
| 📎 Phân loại mục | Ăn uống 20 (31%) · Tham quan + Vui chơi 16 (25%) · Hậu cần (di chuyển 10, lưu trú 6, thuê xe 4, tour 2) 22 (34%) · Mua sắm 4 · Dự phòng 2 |
| 📎 Trạng thái | 2 mục "Đã đặt", 62 mục "Chờ xác nhận" |
| 📎 Mục "bao gồm trong tour/combo" | 10 mục có ghi chú "bao gồm": 9 mục chi phí ghi "—" (nằm trong một khoản gói riêng) và 1 mục (dòng 33) vẫn có chi phí 150K |
| 📎 Giờ ước chừng | 3 mục ghi giờ dạng "~06:00", "~18:00" |
| 📎 Ô nhiều phương án | Ít nhất 6 ô ghi sẵn lựa chọn trong cùng ô (bún chả / phở; bún bò / chả cá Lã Vọng; Lô Lô Chải / Thèn Pả…) |

### 2.2 Vì sao có 10 phiên bản (📎 theo lời bạn)

Phần lớn các lần sửa là để:
1. **Lên lịch nghỉ giữa chuyến.**
2. **Thêm quán ăn.**
3. **Thêm các khung giờ để đi đặt xe máy**, dạng ghi chú kiểm tra (check note) để khỏi quên.

### 2.3 Điều file cho thấy

- **Địa điểm chỉ là một phần của lịch trình.** Một Wander chỉ có "địa điểm" sẽ bỏ sót khoảng 3/4 nội dung thật.
- **"Nghỉ" và "việc cần làm" là loại mục chính thức**, không phải ghi chú phụ. Đây là thứ bạn sửa nhiều nhất.
- **Lựa chọn nằm ngay trong ô.** Người dùng đã tự mã hóa nhiều phương án vào một khung giờ, chính là chỗ vote hoặc swipe có nghĩa.
- **Bảng tính hay tự làm lệch.** Tổng ở sheet lịch trình (12.130K) khác sheet chi phí (13.047K). Có giá trị nằm ở cột I ngoài vùng cộng (2.617K, 1.000K, 600K). Hai dòng cuối bảng (84–85) có tiền nhưng không có tên hoạt động. Nhãn thứ "T6 29/08" khớp lịch 2025, trong khi 29/08/2026 là Thứ 7. → Wander phải **tự tính** thứ và tổng.
- **Chuyến có nhiều chặng** (Hà Nội → Hà Giang → Hà Nội "buffer" → Tà Xùa → Hà Nội), mỗi ngày có tiêu đề riêng.
- **Số ngày:** file có 9 ngày lịch (29/08–06/09) và 9 khối Ngày 0–8, nhưng tiêu đề ghi "8 ngày 7 đêm". 🧪 Có thể người lập đếm từ Ngày 1 (30/08–06/09 là 8 ngày, 7 đêm) và coi Ngày 0 là ngày di chuyển trước; chưa được xác nhận (❓ Q13).

### 2.4 Giới hạn của bằng chứng

- Đây là **một chuyến, do chính chủ sản phẩm làm**. Nó cho biết cách bạn lập kế hoạch, **không chứng minh** người khác cần công cụ này.
- Nhóm 2 người **chưa cho thấy** nhu cầu vote, chia sẻ hay quyết toán của nhóm từ 3 người trở lên 🧪.
- 62/64 mục vẫn "Chờ xác nhận". Chưa rõ trạng thái này có được cập nhật trong chuyến thật hay không ❓.

---

## 3. Vấn đề và người dùng

**Công việc cần làm (🔶):** *"Đưa chuyến đi từ ý tưởng đến một lịch trình có thể làm theo, có chỗ nghỉ, có nhắc việc, và để người đi cùng cùng xem và góp ý."*

| Vai trò | Mô tả | Mức bằng chứng |
|---|---|---|
| **Organizer** | Người lập lịch, đặt chỗ, theo dõi việc cần làm (chính là bạn) | 📎 có bằng chứng từ chuyến thật |
| **Companion** | Người đi cùng: xem lịch, góp ý, chọn giữa các phương án | 🔶 chưa phỏng vấn |
| **Nhóm ≥ 3** | Nhiều người, cần quyết định chung | 🧪 chưa có dữ liệu |

**Thuật ngữ dùng trong tài liệu (🔶 P11, để thống nhất cách gọi, không phải quyết định về quyền):**
- **Organizer** = chủ chuyến. **Member** = người vào chuyến bằng link với tên hiển thị (✅ D8); "Companion" là cách gọi trong phân tích, dùng như Member.
- **Viewer** (chỉ xem): ❓ chưa quyết có vai trò riêng không (Q6).

---

## 4. Định vị và cạnh tranh (🔶, chưa kết luận)

Đã tìm kiếm ngày 23/10/2026. **Một phần nguồn là trang marketing của đối thủ**, nên chỉ dùng để biết họ nói gì về mình (xem Phụ lục B).

- Các app lập lịch trình quốc tế đã có sẵn cộng tác nhóm và bản miễn phí khá rộng (ví dụ Wanderlog, Stippl). → **"Một luồng tích hợp" không đủ khác biệt.**
- Chia tiền nhóm là ngách đông, nhiều lựa chọn miễn phí, có cả app tiếng Việt. → Không nên coi là điểm bán.
- Chưa tìm thấy app lập lịch nhóm tiếng Việt, **nhưng chưa chứng minh là không có** 🧪 (cần kiểm tra trực tiếp App Store và Google Play Việt Nam).

**Giả thuyết khác biệt có thể thử (🧪):**
1. **Nhịp chuyến:** nghỉ, việc cần làm và nhắc việc là loại mục hạng nhất, không chỉ danh sách địa điểm.
2. **Chọn trong một khung giờ:** ứng viên + swipe/vote cho từng khung.
3. **Giao diện và nội dung tiếng Việt**, sát chuyến đi nội địa.

---

## 5. Nguyên tắc sản phẩm

> **Trạng thái:** các nguyên tắc dưới đây là 🔶 đề xuất, chưa được duyệt riêng. Chúng là la bàn khi viết spec, không phải quyết định.

1. Lịch trình gồm **mục**, không chỉ địa điểm. Địa điểm là thông tin tùy chọn gắn vào mục.
2. **Nhập nhanh trước, chính xác sau.** Gõ tên tự do được; thông tin địa điểm đến sau.
3. **Giá trị tính ra thì tự tính** (thứ, tổng chi phí, số việc chưa xong), không nhập tay.
4. **Lựa chọn là thứ hạng nhất**, không chỉ chốt một phương án.
5. **Người đi cùng không bị cản trở** khi xem và góp ý.
6. Làm thủ công hoặc dựa trên quy tắc trước, **AI không bắt buộc**.
7. Mỗi tính năng phải truy ngược về một hành vi trong chuyến thật hoặc một giả thuyết được ghi rõ.

---

## 6. Phạm vi và các lát

### 6.1 Lộ trình (✅ D12)

Làm **Lát 1a trước**. Chia sẻ và cộng tác thuộc **Lát 1b**. **Prototype swipe là một nhánh kiểm chứng riêng**, không phải một lát và không làm thay đổi roadmap chính thức (✅ D7).

| Lát | Mục tiêu | Xong khi | Trạng thái |
|---|---|---|---|
| **0** | Phân tích file, nói chuyện với người đi cùng, dry replay trên giấy (🔶 P1), **thiết kế xác thực và khôi phục quyền chủ chuyến (Q16)** | Có danh sách thiếu sót đầu tiên (§10.4) và bản thiết kế xác thực được bạn duyệt | 🔶 |
| **1a** | **Lõi lập kế hoạch cá nhân (một người dùng):** danh tính ẩn danh, dữ liệu lưu phía server, mở được trên thiết bị khác, xác thực và khôi phục quyền chủ chuyến an toàn (D15) · tạo chuyến, ngày và thứ tự tính · thêm, sửa, xóa mềm, Hoàn tác, khôi phục mục · nội dung tự do, loại mục · giờ và thời lượng tùy chọn, thứ tự thủ công (D16) · chi phí (D17, D18) · Nghỉ thêm thủ công và Việc cần làm · xem lịch và tổng phải trả thêm | Replay test (§10) trên chuyến Hà Giang – Tà Xùa thật đạt theo §10.5, gồm mở được trên thiết bị khác, **không cần chia sẻ** | ✅ |
| **1b** | **Chia sẻ và cộng tác cơ bản:** vào chuyến bằng link và tên hiển thị, xem và đề xuất mục, Organizer chấp nhận hoặc từ chối, checklist hoàn thành theo từng thành viên, các trường hợp quyền và chỉnh sửa cần thiết. **Quyền trong chia sẻ, kể cả xóa và khôi phục, xác định ở đây (D19)** | Người đi cùng vào bằng link, xem lịch và đề xuất; Organizer duyệt (chi tiết chờ §15) | ✅ phạm vi dự kiến, chi tiết ❓ |
| **Nhánh: prototype swipe** | Kiểm chứng trải nghiệm xem nhiều phương án cho một khung giờ và chọn hoặc bỏ qua | Có kết quả quan sát theo §11.3 | ✅ làm sớm; **không** cam kết triển khai |
| **2** | Ứng viên cho một khung giờ + swipe/vote + chốt | Một nhóm chọn xong ít nhất 3 khung giờ bằng app | 🔶 vị trí có thể đổi sau prototype (❓ Q10) |
| **3** | Gợi ý địa điểm khi gõ | Gõ tên thấy gợi ý đủ dùng cho điểm đến chuyến thật | 🔶 (thứ tự với Lát 2 ❓ Q10) |
| **4+** | Sổ chi tiêu, xuất bản lịch trình, nội dung, chế độ trong chuyến | Chọn theo thứ bạn thích và nhu cầu thật | 🔶 |

**Lưu ý thuật ngữ:** "chia sẻ" ở **1b** là cho người đi cùng *vào chuyến để cộng tác*. "Xuất bản và sao chép lịch trình cho người khác" là việc khác và nằm ở nhóm hoãn.

### 6.2 Lát 1a không phụ thuộc vào (✅ D14, D15)

Tài khoản đầy đủ hoặc hệ thống thành viên · link mời và chia sẻ · vote backend · gợi ý địa điểm từ API · AI · quản lý chi tiêu nhóm · các tính năng đã hoãn.

**Lưu ý:** theo D15, 1a **có** danh tính ẩn danh và lưu dữ liệu phía server. Đây là một **phần của 1a**, không phải phần của 1b. Kết quả kiểm tra độc lập ở **§9.2**.

### 6.3 Phân loại (MoSCoW)

| Nhóm | Lát 1a | Lát 1b |
|---|---|---|
| **Must** (✅ thuộc phạm vi đã duyệt) | Danh tính ẩn danh + lưu phía server + mở trên thiết bị khác + xác thực/khôi phục quyền chủ chuyến · tạo chuyến · ngày và thứ tự tính · thêm, sửa mục · **giờ và thời lượng tùy chọn, thứ tự thủ công** · nội dung tự do + loại · chi phí (nhập nghìn đồng, hiển thị VND đầy đủ, ba nghĩa trống/0/đã bao gồm) · **xóa mềm, Hoàn tác, Đã xóa gần đây, xóa vĩnh viễn** · Nghỉ (thủ công) và Việc cần làm · xem lịch · xem tổng phải trả thêm · Replay test | Vào chuyến bằng link và tên hiển thị · xem và đề xuất mục · Organizer chấp nhận/từ chối · hoàn thành checklist theo từng thành viên · quyền (gồm xóa, khôi phục) và chỉnh sửa cần thiết |
| **Should** (🔶) | Tổng theo ngày và theo loại · trạng thái đặt chỗ · cờ giờ ước chừng · danh sách việc chưa xong theo ngày | Checklist chuẩn bị theo nhóm (🔶 P8: đề xuất đi cùng 1b, chưa duyệt; chưa xếp lát chính thức ❓ Q12) |
| **Could** (🔶) | Gợi ý nhắc nghỉ tự động · nhắc theo giờ | |
| **Hoãn** | Tài khoản đầy đủ · vote backend · gợi ý địa điểm từ API · AI · chi tiêu nhóm · xuất bản lịch trình · nội dung khám phá toàn cục · chế độ trong chuyến · tài khoản creator · đặt phòng · xem khi mạng yếu (❓) | |
| **Đã quyết là không có** (✅ D19) | **Lịch sử chỉnh sửa** | |

> Phân loại Should/Could là 🔶 vì chỉ phần Must nằm trong phạm vi bạn đã duyệt.

---

## 7. Mô hình khái niệm (không gắn công nghệ)

### 7.1 Thực thể

| Thực thể | Trường chính | Lát | Trạng thái |
|---|---|---|---|
| **Trip** | tên · điểm đến (chữ tự do) · ngày đi/về · chủ chuyến | 1a | ✅ phạm vi; "số người" và tùy chọn chuyến chưa quyết (❓ Q11) |
| **Danh tính ẩn danh** (chủ chuyến) | không cần tài khoản đầy đủ · dữ liệu lưu phía server · mở được trên thiết bị khác · có cách xác thực và khôi phục quyền chủ chuyến | 1a | ✅ D15, D20–D26 (hướng) · ❓ thiết kế chi tiết chờ duyệt (Q16) |
| **Day** | gắn với **một ngày lịch cụ thể** · tiêu đề tùy chọn (ví dụ "Hà Nội buffer") · thứ tính từ ngày | 1a | ✅ |
| **Item** | **ngày** (mỗi mục thuộc đúng một ngày được chọn) · **vị trí trong ngày** (do người dùng sắp xếp thủ công) · giờ (tùy chọn) · thời lượng (tùy chọn) · tiêu đề · **loại** · ghi chú · **chi phí** (trống = chưa biết; số nguyên ≥ 0 nghìn đồng; 0 = đã biết bằng 0) · **cờ "đã bao gồm"** + giá tham khảo (tùy chọn) · trạng thái xóa mềm · *(Should)* trạng thái đặt chỗ, cờ giờ ước chừng · *(1b)* người tạo · *(Lát 3)* địa điểm | 1a | ✅ phạm vi (D16–D19); chi tiết nhỏ ❓ Q17, Q18 |
| **Completion** (hoàn thành việc cần làm) | (việc × thành viên) → đã xong hay chưa | 1a: một chủ chuyến · 1b: từng thành viên | ✅ nguyên tắc theo thành viên (D10); cách lưu 🔶 P5 |
| **Member** | tên hiển thị · vai trò | 1b | ✅ tên hiển thị qua link (D8); vai trò và quyền ❓ Q6; danh tính khi quay lại ❓ Q16 |
| **Invite link** | liên kết vào chuyến | 1b | ❓ Q7 (thu hồi, hết hạn) |
| **Proposal / Ý tưởng** | mục do thành viên đề xuất, chưa nằm trên lịch · người đề xuất · trạng thái (chờ duyệt / chấp nhận / từ chối) | 1b | 🔶 khái niệm; **không tồn tại ở 1a** |
| **Checklist chuẩn bị** | nhóm + hạng mục + hoàn thành theo thành viên | chưa xếp lát | 🔶 P8, ❓ Q12 |
| **Slot / Candidate** | một Item chưa chọn kèm 2–6 ứng viên | Lát 2 | 🔶 |
| **Vote** | thành viên × ứng viên → thích / không | Lát 2 | 🔶 |

> Đây là mô hình khái niệm. **Không** nêu cấu trúc cơ sở dữ liệu; cách lưu là việc của giai đoạn thiết kế sau.

### 7.2 Loại mục

`Tham quan` · `Ăn uống` · `Di chuyển` · `Lưu trú` · `Thuê xe` · `Mua sắm` · `Tour/Combo` · **`Nghỉ`** · **`Việc cần làm`**

- **Nghỉ** và **Việc cần làm** là loại mục được hỗ trợ ở Lát 1a (✅ D13). Chúng xuất phát từ các lần sửa của bạn ở 10 phiên bản (📎 §2.2).
- 7 loại còn lại 📎 rút từ cột "Phân loại" của file thật. Ánh xạ: "Vui chơi" → Tham quan · "Dự phòng" → Nghỉ hoặc Việc cần làm.
- **Rest:** thêm **thủ công** (✅ D16). **Task:** có ô tích hoàn thành, trạng thái theo từng thành viên (✅ D10); ở 1a chỉ có một chủ chuyến. Không gồm gợi ý hoặc nhắc tự động (🔶 P13, còn hiệu lực cho phần Task và "tạo nhanh"; cần bạn xác nhận khớp với "phạm vi đã thống nhất").

### 7.3 Tùy chọn khi tạo chuyến (❓ Q11)

Ý tưởng ở v0.1: **kiểu chuyến** (chọn nhiều), **nhịp chuyến** (thoải mái / vừa / dày), **ngân sách dự kiến**. Chưa quyết các tùy chọn này dùng để làm gì. **Không nằm trong Must của Lát 1a** (🔶 P6). Nếu được lưu mà chưa có hành vi nào dùng chúng thì chỉ là dữ liệu nằm đó.

### 7.4 Quy tắc nghiệp vụ

| ID | Quy tắc | Lát | Trạng thái |
|---|---|---|---|
| R1 | Ngày của chuyến và **thứ trong tuần được tạo tự động** từ khoảng ngày | 1a | ✅ |
| R2 | **Tổng phải trả thêm** hiển thị được, luôn tính ra từ các mục, không nhập tay. Cộng các chi phí số của mục; **không** cộng khoản đã bao gồm (kể cả giá tham khảo) và mục chưa biết (trống) | 1a | ✅ không cộng khoản đã bao gồm (D18) · 🔶 mục đã xóa không tính; "không nhập tay" |
| R3 | **Nhập chi phí: số nguyên không âm, đơn vị nghìn đồng. Hiển thị VND đầy đủ. Cho phép để trống. Chặn giá trị âm và định dạng sai** | 1a | ✅ (D9, D17) · 🔶 hệ quả: số thập phân coi là định dạng sai nên không cần quy tắc làm tròn · ❓ ký hiệu, dấu phân cách, giá trị tối đa (Q18) |
| R4 | **Ba nghĩa chi phí: trống = chưa biết · 0 = đã biết bằng 0 · khoản đã bao gồm có checkbox riêng và giá tham khảo tùy chọn, không cộng vào tổng phải trả thêm.** Chưa có mô hình Package | 1a | ✅ (D18) · ❓ tương tác giữa checkbox và ô chi phí chính (Q18) |
| R5 | **Số ngày của chuyến = số ngày lịch từ ngày đi đến ngày về, gồm hai đầu** (chuyến này là 9). Nhãn "Ngày N" và cụm "N ngày M đêm" là mô tả của người dùng, không dùng làm dữ liệu | 1a | 🔶 (❓ Q13) |
| R6 | **Giờ và thời lượng tùy chọn. Thứ tự mục do người dùng sắp xếp thủ công. Mỗi hoạt động thuộc ngày được chọn. Rest được thêm thủ công** | 1a | ✅ (D16) · 🔶 hệ quả: đổi giờ không tự sắp xếp lại · ❓ thứ tự mâu thuẫn với giờ, giờ + thời lượng vượt nửa đêm, cờ ước chừng (Q18) |
| R7 | **Xóa là xóa mềm. Có Hoàn tác. Mục xóa nằm ở khu vực "Đã xóa gần đây" và giữ đến khi xóa vĩnh viễn** (không tự hết hạn). Quyền xóa và khôi phục trong chuyến chia sẻ xác định ở 1b | 1a (quyền: 1b) | ✅ (D19) · 🔶 mục đã xóa rời lịch và rời tổng; có hành động xóa vĩnh viễn · ❓ phạm vi Hoàn tác, xóa mềm cho chuyến, ai xóa vĩnh viễn (Q17) |
| R8 | **Không có lịch sử chỉnh sửa** | 1a, 1b | ✅ (D19) · ❓ có hoàn tác thao tác sửa hay không (Q17) |
| R9 | **Hoàn thành việc cần làm tính theo từng thành viên**, không có trạng thái chung cho cả nhóm. Ở 1a chỉ có một chủ chuyến. Phạm vi áp dụng, ai thấy tick của ai, ai tạo hạng mục | 1a, 1b | ✅ nguyên tắc (D10) · ❓ chi tiết (Q12) |
| R10 | **Đề xuất và duyệt:** thành viên đề xuất; Organizer chấp nhận hoặc từ chối. Đề xuất chưa nằm trên lịch cho đến khi được chấp nhận. Ngày/giờ khi chấp nhận do ai chọn | 1b | ✅ luồng chấp nhận/từ chối · 🔶 "chưa nằm trên lịch" · ❓ chi tiết |
| R11 | **"Chốt":** ở 1a và 1b **không dùng từ "chốt" và không có khóa lịch** (v0.1 dùng "lịch đã chốt" nhưng không có trạng thái hay hành động nào tương ứng). "Chốt" chỉ dùng cho Lát 2 (chọn ứng viên thắng). Vòng đời mục đầy đủ và ý nghĩa rộng hơn của "chốt" | 1b, 2 | 🔶 · ❓ Q9 |
| R12 | **Đổi ngày chuyến:** nếu khoảng ngày mới làm một số mục nằm ngoài khoảng, **không cho đổi** cho đến khi các mục đó được chuyển hoặc xóa | 1a | 🔶 P2 |
| R13 | **Danh tính và lưu trữ của chủ chuyến:** danh tính ẩn danh, dữ liệu lưu phía server, mở được trên thiết bị khác; **phải có thiết kế xác thực và khôi phục quyền chủ chuyến an toàn**. Danh tính của Member ở 1b | 1a (Member: 1b) | ✅ (D15, D20–D26) · ❓ thiết kế chi tiết chờ duyệt (Q16) |
| R14 | **Quyền** xem, sửa, đề xuất, xóa, khôi phục của từng vai trò. Chỉ biết: thành viên **xem và đề xuất**, Organizer **duyệt** | 1b | ❓ Q6 |
| R15 | **Link mời:** thu hồi, hết hạn, ai tạo | 1b | ❓ Q7 |
| R16 | **Sửa đồng thời** (lưu ý: không có lịch sử chỉnh sửa, R8) | 1b | ❓ Q8 |

**Lý do R11 và R12:** R11 loại bỏ một khái niệm không có trong phạm vi đã duyệt. R12 giúp **Lát 1a không phải xây vùng "Ý tưởng"** chỉ để chứa mục mồ côi; vùng đó thuộc 1b (🔶 P2).

---

## 8. Luồng chính

### 8.1 Lát 1a (một người dùng)

**A. Lập lịch cá nhân:** mở Wander lần đầu và bắt đầu mà không cần tài khoản đầy đủ (danh tính ẩn danh, ✅ D15) → tạo chuyến (tên, điểm đến, ngày đi/về) → các ngày được sinh sẵn kèm thứ → thêm mục vào ngày được chọn (nội dung tự do, loại, giờ và thời lượng nếu có, chi phí) → sắp xếp thứ tự mục thủ công → xem lịch và **tổng phải trả thêm**.

**A2. Mở chuyến trên thiết bị khác** (✅ D15): chủ chuyến mở lại chuyến và thấy đủ dữ liệu. Cách chứng minh quyền chủ chuyến và khôi phục khi mất thiết bị: ❓ Q16.

**B. Sửa nhanh** (việc bạn sửa nhiều nhất ở 10 phiên bản, 📎):
- Thêm **khoảng Nghỉ thủ công** vào vị trí bạn chọn trong ngày (✅ D16).
- Thêm **quán ăn** vào một khung giờ. Khi chưa chọn được quán, ở 1a chỉ có cách ghi tiêu đề hoặc ghi chú dạng "bún chả / phở" như file hiện tại, vì ứng viên thuộc Lát 2 (🔶).
- Thêm **việc cần làm** gắn một giờ (ví dụ "14:00 đi thuê xe máy") và tích khi xong.
- Ghi chi phí: để trống nếu chưa biết, nhập 0 nếu biết là không mất tiền, tick "đã bao gồm" nếu nằm trong gói (✅ D18).

**C. Xóa, Hoàn tác và khôi phục** (✅ D19): xóa một mục → có thể **Hoàn tác** → mục nằm ở khu vực **Đã xóa gần đây** → khôi phục lại hoặc **xóa vĩnh viễn**. Giao diện cụ thể chưa chốt (không suy diễn).

**D. Replay test:** nhập lại chuyến thật, mở lại trên thiết bị khác, và ghi lại thiếu sót (§10).

### 8.2 Lát 1b (dự kiến, chi tiết ❓)

**E. Vào bằng link:** nhận link → mở → đặt tên hiển thị → xem lịch theo ngày.
**F. Đề xuất:** thành viên gửi một mục đề xuất.
**G. Duyệt:** Organizer chấp nhận (mục lên lịch) hoặc từ chối.
**H. Hoàn thành việc:** mỗi thành viên tích việc của mình, trạng thái riêng.

### 8.3 Nhánh prototype swipe (không lưu thật)

**I.** Xem các phương án cho một khung giờ → chọn hoặc bỏ qua từng phương án → xem kết quả mô phỏng. Chi tiết ở §11.3.

### 8.4 Lát 2 và sau (🔶)

**J. Chọn phương án (Lát 2):** Organizer thêm 2–6 ứng viên vào một khung giờ → thành viên swipe → xem kết quả → Organizer chốt.
**K. Trong chuyến (🧪):** mở lịch hôm nay → thấy mục kế tiếp và việc chưa xong → tích hoàn thành.

### 8.5 Ngoại lệ cần xử lý

- **1a:** chuyến chưa có mục · đổi ngày làm mục nằm ngoài khoảng (R12) · xóa nhầm (đã có Hoàn tác và Đã xóa gần đây, R7) · **nhập tiền âm hoặc sai định dạng: bị chặn** (R3) · mục qua nửa đêm: thuộc ngày được chọn (R6) · **mất thiết bị hoặc mất quyền chủ chuyến** (❓ Q16) · thứ tự thủ công không khớp với giờ (❓ Q18).
- **1b:** hai người sửa cùng lúc (❓ Q8) · link bị lộ hoặc thu hồi (❓ Q7) · ai được xóa, khôi phục và xóa vĩnh viễn trong chuyến chia sẻ (❓ Q6; D19) · thành viên rời đi hoặc quay lại bằng thiết bị khác (❓ Q6, Q16) · đề xuất bị từ chối: người đề xuất có thấy không (❓).
- **Chung:** mạng yếu khi xem lịch (hỏi lại ở §15 Q15).

---

## 9. Yêu cầu chi tiết (Lát 1a, Lát 1b, Lát 2)

> **Cách đọc:** cột "Trạng thái" cho biết story thuộc phạm vi ✅ đã duyệt hay 🔶 đề xuất. Tiêu chí nghiệm thu viết ở mức quan sát được; ngưỡng số là 🔶 để bạn chỉnh trước khi chạy thử. **Đây chưa phải spec chính thức của Lát 1a.**

### 9.1 Lát 1a

| ID | Câu chuyện | Tiêu chí nghiệm thu | Mức | Trạng thái |
|---|---|---|---|---|
| **A-0** | Là chủ chuyến, tôi dùng Wander mà không cần tài khoản đầy đủ và mở lại chuyến trên thiết bị khác | Dữ liệu chuyến được lưu phía server; mở chuyến trên thiết bị khác thấy đủ dữ liệu; có cách khôi phục quyền chủ chuyến theo thiết kế đã được duyệt (cơ chế ❓ Q16). ✅ (D20) Người không có bằng chứng được hệ thống chấp nhận không giành được quyền chủ chuyến | Must | ✅ D15 (cơ chế ❓) |
| **A-1** | Tôi tạo chuyến với tên, điểm đến (chữ tự do), ngày đi và ngày về | Thiếu ngày đi hoặc ngày về thì không tạo được; ngày về không trước ngày đi | Must | ✅ |
| **A-2** | Tôi thấy các ngày được tạo sẵn kèm thứ trong tuần | Mỗi ngày lịch trong khoảng có một ngày; thứ tính từ ngày (R1); số ngày theo R5 | Must | ✅ (R5 🔶) |
| **A-3** | Tôi thêm mục bằng nội dung tự do vào ngày được chọn | Có tiêu đề, ngày; giờ, thời lượng, ghi chú, chi phí không bắt buộc; mục thuộc đúng ngày đã chọn. **Đo số thao tác:** đếm số lần chạm/nhấp và lần xác nhận gõ từ màn hình ngày đến khi mục hiện trong lịch, trên 10 mục mẫu của file thật; ngưỡng 🔶 ≤ 3 | Must | ✅ (ngưỡng 🔶) |
| **A-4** | Tôi chọn loại cho mục | Có đủ 9 loại ở §7.2; đổi loại được | Must | ✅ |
| **A-5** | Tôi nhập giờ và thời lượng (tùy chọn) và **sắp xếp thứ tự mục thủ công** trong ngày | Giờ và thời lượng có thể để trống; thứ tự trong ngày do tôi xác định và giữ nguyên khi mở lại và trên thiết bị khác; 🔶 đổi giờ không tự sắp xếp lại. Chi tiết nhỏ theo Q18 | Must | ✅ D16 |
| **A-6** | Tôi nhập chi phí và xem **tổng phải trả thêm** | Nhập số nguyên ≥ 0 theo nghìn đồng; hiển thị VND đầy đủ; để trống được; âm và định dạng sai bị chặn (R3). Trống = chưa biết, 0 = đã biết bằng 0, "đã bao gồm" có checkbox và giá tham khảo tùy chọn; tổng không cộng khoản đã bao gồm và mục trống (R2, R4) | Must | ✅ D17, D18 (chi tiết ❓ Q18) |
| **A-7** | Tôi sửa mục | Sửa được mọi trường; chuyển sang ngày khác được | Must | ✅ |
| **A-8** | Tôi xóa mục, Hoàn tác, xem "Đã xóa gần đây", khôi phục và xóa vĩnh viễn | Xóa là xóa mềm; có Hoàn tác; mục đã xóa nằm ở khu vực "Đã xóa gần đây", **giữ đến khi xóa vĩnh viễn**; mục khôi phục trở lại ngày cũ; 🔶 mục đã xóa không nằm trên lịch và không tính vào tổng; **không có lịch sử chỉnh sửa**. Giao diện cụ thể và phạm vi Hoàn tác theo Q17; quyền trong chia sẻ xác định ở 1b | Must | ✅ D19 (chi tiết ❓) |
| **A-9** | Tôi thêm khoảng **Nghỉ** thủ công | Tạo được mục loại Nghỉ vào ngày và vị trí do tôi chọn; **không có gợi ý tự động**; khác biệt rõ với mục thường (cách hiển thị: giao diện chưa chốt) | Must | ✅ D13, D16 |
| **A-10** | Tôi tạo **Việc cần làm** và tích khi xong | Mục có ô tích của chủ chuyến (hoàn thành tính theo từng thành viên, D10); giờ tùy chọn; tích xong thể hiện rõ | Must | ✅ (P13 🔶) |
| **A-11** | Tôi xem lịch theo ngày | Thấy ngày, thứ, các mục theo **thứ tự thủ công** đã sắp, loại phân biệt được | Must | ✅ |
| **A-12** | Tôi nhập lại chuyến thật để kiểm tra | Theo §10, gồm mở lại trên thiết bị khác; kết quả đo theo §10.5 | Must | ✅ |
| A-13 | Tôi xem tổng theo ngày và theo loại | Khớp tổng cả chuyến; cùng quy tắc loại trừ như R2 | Should | 🔶 |
| A-14 | Tôi đặt trạng thái đặt chỗ cho mục | Số trạng thái và tên gọi theo Q14 | Should | 🔶 |
| A-15 | Tôi đánh dấu giờ là "ước chừng" | Cờ hiển thị cạnh giờ; chưa được quyết định (Q18) | Should | 🔶 |
| A-16 | Tôi xem danh sách việc cần làm chưa xong theo ngày | Danh sách khớp ô tích | Should | 🔶 |
| A-17 | Tôi nhận gợi ý nhắc nghỉ tự động | *(chưa viết)*. Rest thêm thủ công đã duyệt (D16); phần tự động vẫn là đề xuất | Could | 🔶 P7 |
| A-18 | Nhắc theo giờ | *(chưa viết)* | Could | 🔶 |

> **Đã bỏ khỏi 1a so với v0.2:** lịch sử thay đổi (✅ D19 quyết định không có). "Hoàn tác thao tác sửa" tách ra thành câu hỏi (Q17).

### 9.2 Kiểm tra độc lập: Lát 1a có phụ thuộc 1b hoặc lát sau không?

| Thành phần | Phụ thuộc 1a? | Ghi chú |
|---|---|---|
| Tài khoản đầy đủ, hệ thống thành viên, link mời, chia sẻ | **Không** | Không có story nào ở §9.1 cần đến |
| Vote, ứng viên | **Không** | Quán chưa chọn được ghi tạm bằng văn bản (§8.1 B) |
| Gợi ý địa điểm từ API, AI, chi tiêu nhóm | **Không** | |
| Vùng "Ý tưởng" | **Không**, nhờ R12 | 🔶 P2 |
| Hoàn thành theo thành viên | **Không**, nhưng cần lưu ý | 1a chỉ có một chủ chuyến; cách lưu theo cặp (việc × người) 🔶 P5 để 1b không phải đổi mô hình |
| Xóa mềm, Hoàn tác, Đã xóa gần đây | **Không** | Quyền trong chia sẻ xác định ở 1b (D19), không cần ở 1a |
| **Danh tính ẩn danh, lưu phía server, mở trên thiết bị khác** | **Thuộc về 1a** (✅ D15) | Là một phần của 1a, không phụ thuộc 1b. 1b dựa trên nền này để cho người đi cùng vào bằng link (cách nối ❓ Q16, Q7) |
| **Thiết kế xác thực và khôi phục quyền chủ chuyến** | **Thuộc về 1a** | Thiết kế cần được bạn duyệt trước spec (❓ Q16). Cơ chế cụ thể chưa chốt |

**Kết luận:** Lát 1a **không phụ thuộc 1b hoặc lát sau**. Điều kiện cũ (Q1) đã được quyết (D15). Điều kiện mới: **thiết kế xác thực và khôi phục (Q16) phải xong và được duyệt trước khi viết spec 1a.**

**Lưu ý:** theo D15 và D19, Lát 1a **lớn hơn** bản v0.2 (xem §13).

### 9.3 Lát 1b (dự kiến, không tự thêm chi tiết quyền chưa duyệt)

| ID | Câu chuyện (dự kiến) | Tiêu chí nghiệm thu ở mức quan sát | Chi tiết chờ quyết định |
|---|---|---|---|
| B-1 | Organizer tạo link để người đi cùng vào chuyến | Mở link là vào được chuyến mà **không cần tài khoản đầy đủ** | Thu hồi, hết hạn, ai tạo link (Q7) |
| B-2 | Người vào đặt tên hiển thị | Organizer thấy danh sách người đã vào | Danh tính thành viên (Q7, Q16) |
| B-3 | Thành viên xem lịch theo ngày | Thấy lịch theo ngày | Quyền xem từng phần (Q6) |
| B-4 | Thành viên đề xuất mục | Đề xuất tới được Organizer; chưa lên lịch | Quyền đề xuất, nội dung đề xuất (Q6) |
| B-5 | Organizer chấp nhận hoặc từ chối | Chấp nhận thì mục lên lịch; từ chối thì ghi nhận trạng thái | Ngày/giờ khi chấp nhận; người đề xuất có thấy kết quả không (Q9) |
| B-6 | Mỗi thành viên có trạng thái hoàn thành riêng | Tích của người này không đổi trạng thái của người khác | Phạm vi áp dụng, ai thấy tick của ai (Q12) |
| B-7 | Các trường hợp quyền và chỉnh sửa cần thiết | *(chưa có tiêu chí)* | Quyền xóa, khôi phục và xóa vĩnh viễn trong chia sẻ (D19 giao cho 1b) (Q6), sửa đồng thời (Q8), thu hồi link (Q7) |

### 9.4 Lát 2 và Lát 3 (giữ nguyên từ v0.1, 🔶)

> Thứ tự và vị trí có thể đổi sau prototype swipe (❓ Q10). Quy tắc vote chi tiết (bỏ qua, hiện kết quả khi nào, ẩn danh hay không, thêm hoặc xóa ứng viên sau khi vote đã bắt đầu, mở lại sau chốt) **chưa quyết**.

| ID | Câu chuyện | Tiêu chí nghiệm thu |
|---|---|---|
| **L2-1** | Tôi biến một khung giờ thành "chưa chọn" kèm 2–6 ứng viên | Thêm ứng viên bằng cách gõ tên; ghi chú và chi phí tùy chọn |
| **L2-2** | Thành viên swipe qua từng ứng viên | Mỗi người một phiếu cho mỗi ứng viên; đổi được cho tới khi chốt; có thể xem kết quả tổng |
| **L2-3** | Organizer chốt phương án | Ứng viên thắng thành mục thường; các ứng viên còn lại được lưu lại; nếu hòa thì Organizer quyết |
| **L2-4** | Tôi xem ai đã/chưa chọn | Hiện danh sách người đã tham gia chọn |

**Lát 3 (khung):** gợi ý địa điểm khi gõ; thông tin địa điểm gắn vào mục; phân biệt thông tin đã xác minh với chưa xác minh; **luôn có đường lui** về gõ tự do. Nguồn dữ liệu địa điểm là quyết định lớn về chi phí và chất lượng, cần quyết ở giai đoạn chọn công nghệ ❓.

---

## 10. Replay test — dùng chuyến thật để tìm chỗ thiếu

**Mục đích:** chính chuyến Hà Giang – Tà Xùa là bài kiểm tra (✅ D4). Phạm vi ở đây là **Lát 1a**. Phần người đi cùng xem link thuộc **Lát 1b** (§10.6).

### 10.1 Cách chạy

1. **(🔶 P1) Dry replay trước khi build:** ánh xạ 64 mục vào mô hình ở §7 trên giấy hoặc bảng tính, ghi dòng nào không biểu diễn được. Ưu tiên:
   - Dòng **16→18** (Ngày 0 → Ngày 1), **40→42** (Ngày 3 → Ngày 4) và **43** (Ngày 4): kiểm tra mỗi mục **thuộc đúng ngày như trong file** (D16).
   - 3 mục giờ "~".
   - 32 ô chi phí "—" (9 ô có ghi chú "bao gồm", 23 ô khác) và **dòng 33** (ghi "Bao gồm tour" nhưng có chi phí 150K): ánh xạ theo D17–D18 (xem §10.2).
   - 6 ô nhiều phương án (dòng 11, 14, 32, 46, 57, 65).
2. Sau khi Lát 1a chạy: nhập lại 64 mục và 9 khối ngày **bằng tay** (chưa cần tính năng nhập file), **giữ đúng thứ tự dòng của file** trong mỗi ngày.
3. Với mỗi dòng, gán một kết quả A/B/C/D theo §10.5 và ghi vào nhật ký (§10.4) nếu không phải A.
4. So tổng phải trả thêm của Wander với hai tổng trong file (§10.5).
5. **Mở lại chuyến trên thiết bị khác** và kiểm tra thấy đủ dữ liệu (D15).
6. Đo thời gian nhập, và số thao tác khi tạo một mục Nghỉ hoặc Việc cần làm.

### 10.2 Ánh xạ từ file thật sang Wander

| Trong file | Trong Wander | Ghi chú |
|---|---|---|
| NGÀY, THỨ/NGÀY | Day (thứ do Wander tính) | 9 khối ngày tương ứng 9 ngày lịch. **Nhãn thứ khác file là khác biệt đã biết**, không tính là lỗi (🧪, xem §10.5) |
| Banner ngày ("NGÀY 4 · HÀ NỘI BUFFER") | Tiêu đề Day | Cũng cho thấy chuyến có nhiều chặng |
| GIỜ | Giờ (tùy chọn) và thời lượng (tùy chọn) | Mục không giờ vẫn nhập được. 3 mục "~giờ": cờ ước chừng chỉ là Should (A-15, chưa quyết) |
| Thứ tự dòng trong mỗi ngày | **Thứ tự thủ công** | Giữ đúng thứ tự file. Mục qua nửa đêm thuộc ngày như file (D16) |
| HOẠT ĐỘNG | Tiêu đề + loại | Emoji thay bằng biểu tượng theo loại |
| GHI CHÚ | Ghi chú | |
| CHI PHÍ (K) | Chi phí (nhập nghìn đồng, hiển thị VND đầy đủ) | Mọi giá trị số trong file (32 ô ở lịch trình, 11 ô ở sheet chi phí) là số nguyên không âm, **hợp lệ theo D17** và không cần quy đổi đơn vị (📎 đã kiểm tra). **Ô "—" không tự động ánh xạ** (xem dưới) |
| TRẠNG THÁI | Trạng thái đặt chỗ | Chỉ có nếu A-14 (Should) được làm; nếu không, ghi nhận như thiếu sót đã biết (❓ Q14) |
| Sheet Chi phí | Tổng tính ra | Dòng gói (vé máy bay, tour, combo) nhập như mục Tour/Combo riêng, **không liên kết** với mục bên trong (chưa có Package) |
| Sheet Checklist (27 hạng mục) | Ngoài phạm vi 1a | Chưa xếp lát (❓ Q12) |

**Ô chi phí "—" trong file (📎):** có **32 ô**, mang nhiều nghĩa:
- **9 ô** có ghi chú "bao gồm" → ứng viên để tick "đã bao gồm" (D18).
- **23 ô khác** → **bạn quyết từng dòng** là *trống* (chưa biết) hay *0* (đã biết bằng 0). Ví dụ dòng 19 ghi "không mất phí" (có thể là 0); dòng 54 và 55 ghi "miễn phí" nhưng thuộc combo (có thể là "đã bao gồm").
- **Dòng 33** ghi "Bao gồm tour" nhưng có chi phí 150K: trường hợp biên cho việc tick "đã bao gồm" kèm chi phí (❓ Q18).

### 10.3 Thiếu sót dự đoán (🧪 để bạn xác nhận hoặc bác bỏ)

1. **Giờ ước chừng** ("~06:00").
2. **Liên kết gói–mục:** đã có checkbox "đã bao gồm" (D18), nhưng chi phí gói là một mục Tour/Combo riêng, không liên kết với các mục bên trong (chưa có Package).
3. **Tiền cọc hoàn lại** (cọc xe máy 2.000K): không phải chi phí thật.
4. **Dữ liệu liên hệ** (số điện thoại, link Facebook) gắn với đặt chỗ.
5. **Mục lặp** (thuê xe máy 3 lần).
6. **Đổi giờ cả khối** (dồn lịch khi thay đổi).
7. **Chặng** (Hà Nội → Hà Giang → Hà Nội → Tà Xùa).
8. **Xem lịch khi mạng yếu** ở vùng núi (file ghi ATM và điện yếu; chưa có dữ kiện về mạng ❓).
9. **Cập nhật trạng thái trong chuyến** khi đang đi.

> Các thiếu sót này là **kỳ vọng**, không tự động là thất bại. Cách phân biệt nằm ở §10.5.

### 10.4 Nhật ký thiếu sót (điền khi chạy)

| # | Dòng/mục trong file | Vấn đề | Mức độ (chặn / phiền / nhỏ) | Quyết định |
|---|---|---|---|---|
| 1 | | | | |

### 10.5 Cách đo kết quả và tiêu chí đạt (🔶 đề xuất, chỉnh trước khi chạy)

**Phân loại từng dòng:**

| Mức | Nghĩa |
|---|---|
| **A** | Nhập đủ các trường quan trọng, không phải lách |
| **B** | Nhập đủ nhưng phải **lách** (ví dụ nhét thông tin vào ghi chú) |
| **C** | **Mất** ít nhất một trường quan trọng |
| **D** | **Không biết đặt vào đâu** |

**Trường quan trọng** = ngày, tiêu đề, loại, giờ (nếu có), chi phí (nếu có), ghi chú. Trạng thái đặt chỗ, dữ liệu liên hệ và liên kết gói–mục **không** nằm trong danh sách này; mất chúng được ghi vào gap log như thiếu sót đã biết (§10.3).

**Tiêu chí đạt:**
1. **≥ 90%** số dòng ở mức A hoặc B.
2. **Không dòng nào mất ngày, tiêu đề hoặc chi phí số** (C trên ba trường này bằng 0).
3. **Tổng phải trả thêm:** so Wander với hai tổng trong file (**12.130K** ở sheet lịch trình và **13.047K** ở sheet chi phí), quy về cùng đơn vị (12.130K tương ứng 12.130.000 VND). Mọi chênh lệch phải **giải thích được từng dòng** (cột I ngoài vùng cộng, dòng 84–85, ô "—" ánh xạ thế nào, khoản "đã bao gồm" không cộng). **Chênh lệch không giải thích được = 0.**
4. **Thứ tự mục trong mỗi ngày giống file** (vì thứ tự thủ công, D16).
5. **Mở lại chuyến trên thiết bị khác thấy đủ dữ liệu** (D15).
6. Tạo một mục Nghỉ hoặc Việc cần làm trong **≤ 3 thao tác** (định nghĩa thao tác ở A-3).

**Nếu không đạt:** không tự động dừng. Kết quả đưa vào gap log, rồi bạn quyết định xem lại phạm vi.

**Khác biệt đã biết, không tính là lỗi (🧪, cần bạn xác nhận ngày thật, ❓ Q13):**
- Wander hiển thị thứ theo lịch thật; 29/08/2026 là Thứ 7 trong khi file ghi "T6" (📎). **Không sửa file.**
- File ghi "8 ngày 7 đêm" nhưng có 9 ngày lịch và 9 khối ngày (📎).

### 10.6 Replay cho Lát 1b (khi 1b xong)

Người đi cùng vào bằng link, xem lịch và gửi một đề xuất. Đo: làm được **không cần ai nhắc hoặc giải thích** hay không (🔶 thử với ít nhất 2 người), thời gian, và chỗ nhầm.

---

## 11. Kiểm chứng

### 11.1 Phỏng vấn chính bạn về chuyến thật (Lát 0)

1. Trong 10 phiên bản, phiên bản nào thay đổi lớn nhất, và vì sao?
2. Trong chuyến, bạn mở file lúc nào, ở đâu, bằng thiết bị nào? Có lúc nào không mở được hoặc khó đọc?
3. Người đi cùng xem lịch bằng cách nào? Họ có góp ý hay sửa không?
4. Có mục nào quên dù đã ghi? Mục nào bạn đổi ngay trong chuyến?
5. Khoảng nghỉ giữa chuyến được tính thế nào, và có lúc nào lịch quá dày không?

### 11.2 Nói chuyện với người đi cùng (3–5 câu)

Họ biết lịch bằng cách nào? Họ có muốn chọn giữa các phương án không, hay chỉ làm theo? Có lúc nào họ muốn đổi mà không biết nói với ai?

### 11.3 Prototype swipe (nhánh kiểm chứng sớm, ✅ D7)

> **Trạng thái:** làm sớm là **quyết định đã duyệt**. **Không** có nghĩa là đã quyết định triển khai hệ thống vote, đưa vào Lát 1a, hay thay đổi roadmap chính thức. Mọi phần còn lại dưới đây là 🔶 đề xuất.

**Mục tiêu:**
1. Thử cách xem nhiều phương án cho cùng một khung thời gian.
2. Thử thao tác chọn hoặc bỏ qua một phương án.
3. Xem trải nghiệm này có thực sự hữu ích với nhóm nhỏ không.

**Cách thử đơn giản nhất (🔶 P10), hai vòng:**
- **Vòng 1, bình chọn thủ công (vài giờ):** lấy 2–3 khung giờ có nhiều phương án trong file, ví dụ dòng 11 (bún chả / phở), dòng 14 (bún bò / chả cá Lã Vọng), dòng 32 (Lô Lô Chải / Thèn Pả). Gửi cho **3–5 người** trong group chat dưới dạng một câu hỏi kèm vài phương án. Quan sát có ai phản hồi không, mất bao lâu, ý kiến có lệch nhau không.
- **Vòng 2, prototype tương tác, độ chi tiết thấp:** một chuỗi thẻ cho **một** khung giờ, dữ liệu cố định, thao tác chọn hoặc bỏ qua, màn hình kết quả mô phỏng. **Không lưu thật, không tài khoản, không đồng bộ, không vote backend.** Công cụ chưa chọn (không chọn stack); có thể làm trên giấy hoặc bản mô phỏng bấm. Nếu cần code tạm, tách khỏi codebase chính và bỏ sau khi thử.

**Người thử:** người đi cùng và 3–5 người khác; có một nhóm từ 3 người trở lên nếu được.

**Quan sát (hành vi, không phải ý kiến "có thích không"):**
- Họ hoàn thành việc chọn không, và mất bao lâu?
- Họ hiểu "chọn" và "bỏ qua" không cần giải thích không?
- Với 2–4 phương án, chọn bằng thẻ nhanh hơn hay chậm hơn so với danh sách có nút hoặc bình chọn trong chat?
- Kết quả có giúp tới quyết định, hay vẫn phải hỏi lại trong chat?
- Có ai muốn dùng lại cho chuyến thật không (nói và làm)?

**Điều cần thấy trước khi quyết định đưa vào roadmap chính thức (🔶 ngưỡng đề xuất, bạn chốt **trước** khi chạy):**
- Đa số người thử (ví dụ ≥ 3/5) hoàn thành mà không cần giải thích.
- Ít nhất một khung giờ đi đến quyết định mà không cần hỏi lại trong chat.
- Ít nhất một người có hành động cho thấy muốn dùng cho chuyến thật.

**Kết quả → bước tiếp theo (chỉ là thông tin cho quyết định của bạn, ❓ Q10):**

| Tín hiệu | Gợi ý |
|---|---|
| Rõ ràng | Đưa Q10 ra quyết định: có kéo Lát 2 lên hay đổi thứ tự Lát 2/3 không |
| Lẫn lộn | Thử lại với nhóm từ 3 người hoặc so với danh sách có nút |
| Yếu | Giữ nguyên roadmap; cân nhắc giản lược hoặc bỏ swipe |

**Thời điểm (🔶):** song song hoặc ngay sau Lát 0, **không chặn Lát 1a**. Ước tính giờ ở §13.

**Bảng ghi kết quả (điền khi chạy):**

| Người thử | Hoàn thành? | Thời gian | Chỗ nhầm | Muốn dùng lại? |
|---|---|---|---|---|
| | | | | |

### 11.4 Tín hiệu để bắt đầu nghĩ chuyện kiếm tiền (🔶)

1. Có nhóm không phải bạn thân **tự dùng lại** cho chuyến khác.
2. Có người **xin một tính năng cụ thể**.
3. Có người hỏi khi nào mở cho người ngoài.

Chưa thấy tín hiệu nào thì cứ tiếp tục làm vì thích, không cần ép.

### 11.5 Chuyến kế tiếp (tham khảo)

Chọn **một chuyến thật có từ 3 người trở lên** làm bài thử cho phần nhóm (Lát 1b hoặc prototype swipe). Nhóm 2 người không đủ để kiểm chứng vote và join. **Tết 2027** (khoảng đầu tháng 2/2027, còn khoảng 15 tuần tính từ 23/10/2026) chỉ là **mốc tham khảo** (✅ D6), không phải deadline; nếu không kịp thì dùng chuyến khác.

---

## 12. Rủi ro

| Rủi ro | Mức | Cách giảm |
|---|---|---|
| Mở rộng phạm vi liên tục vì "làm vì thích" | Cao | Mỗi lát có dòng "xong khi…"; ý mới vào danh sách chờ, không chen ngang |
| **Cơ chế xác thực và khôi phục quyền chủ chuyến chưa được thiết kế (Q16): mất quyền hoặc bị chiếm quyền** | **Cao** | Hoàn tất thiết kế an toàn và được bạn duyệt trước spec 1a; không để cài đặt tự chọn cơ chế |
| **Dữ liệu lưu phía server (D15), mục đã xóa giữ đến khi xóa vĩnh viễn (D19): rủi ro riêng tư, lộ link hoặc mã truy cập** | Trung bình–Cao | Chỉ thu cần thiết; có xóa vĩnh viễn; đưa vào thiết kế Q16 |
| **Lát 1a lớn hơn v0.2 do danh tính, server và xác thực** | Trung bình | Ước tính lại ở §13; theo dõi giờ thực tế theo từng nhóm việc |
| **Prototype swipe bị hiểu thành cam kết triển khai vote** | Trung bình | D7 ghi rõ không phải cam kết; prototype tách khỏi codebase chính; kết quả chỉ là đầu vào cho Q10 |
| Swipe không thêm giá trị với nhóm nhỏ | Trung bình | Prototype (§11.3); thử với nhóm từ 3 người |
| **Hoàn thành theo thành viên làm 1b phức tạp hơn dự kiến** | Trung bình | Giữ khái niệm theo cặp (việc × người) từ 1a (🔶 P5); chốt phạm vi ở Q12 |
| **Không có lịch sử chỉnh sửa (D19), nên sửa nhầm khi nhiều người ở 1b khó khôi phục** | Trung bình | Chốt Q6 và Q8 trước spec 1b; quyền xác định ở 1b |
| Thứ tự thủ công không khớp với giờ | Thấp | Q18 |
| Nguồn dữ liệu địa điểm tốn chi phí hoặc kém chất lượng | Trung bình | Để Lát 3; luôn có đường lui gõ tự do |
| **15–25 giờ/tuần là khả năng, không phải cam kết; throughput thực tế có thể thấp hơn** | Trung bình | Ghi giờ thực tế của Lát 1a để hiệu chỉnh §13; không dùng khoảng này làm cam kết |
| Bằng chứng chỉ từ một chuyến của chính bạn | Cao | Phỏng vấn bên ngoài; chuyến kế từ 3 người |
| Dữ liệu liên hệ và vị trí (quyền riêng tư) | Trung bình | Chỉ thu cần thiết, cho phép xóa; làm đúng từ đầu |
| Xem lịch khi mạng yếu | Chưa rõ 🧪 | Hỏi ở §11.1; quyết định sau Replay test |
| **Tài liệu bị đọc như đã duyệt khi còn 🔶 hoặc ❓** | Trung bình | Quy tắc đọc ở đầu file và §16 mục 7 |
| Chưa có đường kiếm tiền | Chấp nhận | Hoãn có chủ đích (✅ D1); giữ nhật ký người dùng |

> **Đã đóng so với v0.2:** rủi ro "1a chọn nơi lưu dữ liệu hoặc danh tính khiến phải làm lại khi sang 1b" nay được giảm nhờ ✅ D15; phần còn lại nằm ở cơ chế xác thực (Q16).

---

## 13. Ước tính và lộ trình

> **Đây là phán đoán, không phải số đo; độ tin cậy thấp.** Chưa chọn công nghệ nên chưa thể ước tính chính xác. **15–25 giờ/tuần là khả năng hiện tại, không phải cam kết** (✅ D5). **Cập nhật v0.3:** ước tính được điều chỉnh vì phạm vi 1a đổi (D15–D19).

### 13.1 Theo nhóm việc (giờ)

| Nhóm việc | Lát 1a | Lát 1b | Độ bất định | Phụ thuộc |
|---|---|---|---|---|
| 1. Chốt quyết định, mô hình, wireframe, **thiết kế xác thực/khôi phục** | 15–30 | 5–15 | Trung bình | Q16, Q11, Q17, Q18 |
| 2. Nền móng (khởi tạo, **lưu trữ phía server, triển khai**) | 15–35 | 0–10 | **Cao** (stack chưa chọn) | D15 |
| 3. **Danh tính ẩn danh, xác thực, khôi phục, mở trên thiết bị khác** (1a) · link, tên hiển thị, quyền (1b) | 15–40 | 10–30 | **Cao** (cơ chế chưa chốt) | Q16 · Q6, Q7 |
| 4. Lõi lập kế hoạch (chuyến, ngày, mục, loại, giờ, **thứ tự thủ công**, chi phí, Nghỉ, Việc cần làm) | 30–50 | — | Trung bình | Q18 |
| 5. **Xóa mềm, Hoàn tác, Đã xóa gần đây, xóa vĩnh viễn** | 8–20 | 2–10 (quyền) | Trung bình–Cao | Q17 · Q6 |
| 6. Đề xuất/duyệt, đồng thời, hoàn thành theo thành viên | — | 15–55 | **Cao** | Q8, Q9, Q12 |
| 7. Kiểm thử (quy tắc tiền, xác thực/khôi phục, Replay test) | 14–28 | 5–10 | Trung bình | Tất cả |
| 8. Hoàn thiện giao diện (trạng thái rỗng, lỗi, tiếng Việt, khu vực Đã xóa) | 8–18 | 4–15 | Trung bình | |
| **Tổng** | **105–221** | **41–145** | | |

**So với v0.2:**

| | v0.2 | v0.3 |
|---|---|---|
| Lát 1a | 72–145 | **105–221** |
| Lát 1b | 51–160 | **41–145** |
| 1a + 1b | 123–305 | **146–366** |

**Cách đọc:**
- 1a tăng chủ yếu vì D15 đưa **lưu phía server, danh tính ẩn danh và xác thực/khôi phục** vào 1a. V0.2 ngầm giả định cách đơn giản hơn (chưa có khôi phục và mở nhiều thiết bị). Một phần việc này vốn nằm ở 1b nên 1b giảm.
- D19 thêm Hoàn tác và khu vực Đã xóa gần đây nhưng bỏ lịch sử chỉnh sửa; D16 làm rõ quy tắc thời gian (thứ tự thủ công thay cho sắp xếp theo giờ), nên nhóm 4 bớt bất định.
- Biến động lớn nhất vẫn ở nhóm **2, 3, 6**, phụ thuộc vào cơ chế xác thực chưa chốt và công nghệ chưa chọn.
- **Chưa tính:** Lát 0, thời gian chờ chuyến thật để thử, học công cụ mới, đọc và sửa code do AI sinh.
- Nên ước tính lại sau khi chốt Q16–Q18 và sau khi chọn công nghệ.

### 13.2 Các hạng mục khác (giờ)

| Hạng mục | Giờ | Ghi chú |
|---|---|---|
| Lát 0 | 10–20 | Chưa tính thiết kế xác thực (đã tính ở nhóm 1 của 1a) |
| Prototype swipe, vòng 1 (bình chọn thủ công) | 2–6 | |
| Prototype swipe, vòng 2 (tương tác, độ chi tiết thấp) | 10–30 | ❓ rất bất định, phụ thuộc cách làm |
| Lát 2 | 60–120 | Giữ từ v0.1, chưa ước tính lại |
| Lát 3 | 40–100 | Giữ từ v0.1, chưa ước tính lại |
| Sổ chi tiêu (nếu làm) | 80–140 | Giữ từ v0.1, chưa ước tính lại |

### 13.3 Quy đổi sang thời gian lịch (khả năng 15–25 giờ/tuần)

Cận thấp = giờ thấp ÷ 25; cận cao = giờ cao ÷ 15.

| Mốc | Giờ | Tuần lịch (15–25 giờ/tuần) |
|---|---|---|
| Lát 0 | 10–20 | khoảng 0,4–1,3 |
| **Lát 1a** | 105–221 | **khoảng 4–15** |
| **Lát 1b** | 41–145 | **khoảng 2–10** |
| Lát 1a + 1b | 146–366 | khoảng 6–24 |
| Lát 0 + 1a + 1b | 156–386 | khoảng 6–26 |

Giả định dùng đủ số giờ mỗi tuần. Thực tế thường thấp hơn; hiệu chỉnh bằng giờ thực tế của Lát 1a.

### 13.4 Mốc Tết (tham khảo, ✅ D6)

Từ 23/10/2026 đến đầu tháng 2/2027 còn khoảng 15 tuần, tương đương khoảng 225–375 giờ ở mức 15–25 giờ/tuần. Lát 0 + 1a + 1b là 156–386 giờ: ở 25 giờ/tuần gần như nằm gọn (chỉ cận trên vượt chút); ở 15 giờ/tuần chỉ kịp nếu ước tính rơi vào khoảng thấp. **Đây không phải deadline.**

### 13.5 Điều kiện dừng và xem lại (🔶 P9)

- Giờ thực tế của một lát vượt **cận trên** của khoảng ước tính của lát đó.
- Replay test không đạt tiêu chí §10.5 (không tự dừng; bạn quyết định).
- Bạn không còn hứng thú. Dừng sau Lát 1a vẫn là một kết quả tốt vì đã có công cụ lập kế hoạch cá nhân dùng được trên nhiều thiết bị.

---

## 14. Nhật ký quyết định

### 14.1 ✅ Đã duyệt (quyết định chính thức)

| # | Quyết định | Ghi chú |
|---|---|---|
| D1 | Làm vì thích, phát triển kỹ năng; kiếm tiền để sau | Mục tiêu sản phẩm không đổi |
| D2 | Phần hứng thú nhất: gõ địa điểm, lựa chọn trong chuyến + swipe, chia sẻ lịch trình cho nhóm tham gia | |
| D3 | Đang ở giai đoạn planning: chưa chọn công nghệ, chưa viết code, chưa dùng AI | |
| D4 | Dùng chuyến thật Hà Giang – Tà Xùa làm Replay test (§10) | |
| D5 | Thời gian có thể dành: khoảng **15–25 giờ/tuần**; đây là khả năng hiện tại, **không phải cam kết hay deadline** | |
| D6 | **Tết 2027 chỉ là mốc tham khảo**, không phải deadline | |
| D7 | **Làm prototype trải nghiệm swipe sớm** để kiểm chứng ý tưởng | **Không** đồng nghĩa với triển khai vote ở Lát 1a hoặc thay đổi roadmap chính thức |
| D8 | Người đi cùng tham gia bằng **tên hiển thị qua link**, chưa yêu cầu tài khoản đầy đủ ngay từ đầu | Chi tiết bảo mật và quyền truy cập ❓ (Q6, Q7, Q16) |
| D9 | **Đơn vị nhập tiền: nghìn đồng VND** | Chi tiết nhập và hiển thị: D17 |
| D10 | **Hoàn thành checklist tính riêng cho từng thành viên**, không dùng một trạng thái chung | Phạm vi áp dụng và quyền xem ❓ (Q12) |
| D11 | **Xóa mềm và hỗ trợ khôi phục** | Chi tiết: D19 |
| D12 | **Làm Lát 1a trước**; chia sẻ và cộng tác thuộc Lát 1b | |
| D13 | **Nghỉ** và **Việc cần làm** là loại mục được hỗ trợ ở Lát 1a "theo phạm vi đã thống nhất" | Phạm vi chi tiết: 🔶 P13 (một phần đã quyết ở D16) |
| D14 | Lát 1a không phụ thuộc: tài khoản đầy đủ hoặc hệ thống thành viên, link mời và chia sẻ, vote backend, gợi ý địa điểm từ API, AI, chi tiêu nhóm, các tính năng đã hoãn | Hệ quả: "gõ địa điểm" ở 1a là nội dung tự do. **Lưu ý:** 1a có danh tính ẩn danh phía server theo D15 |
| **D15** | **Danh tính ẩn danh + lưu dữ liệu phía server** ở Lát 1a; chuyến **mở được trên thiết bị khác**; phải **thiết kế xác thực và khôi phục quyền chủ chuyến an toàn** | Cơ chế xác thực cụ thể **chưa chốt** (❓ Q16). Khớp với D8 (không tài khoản đầy đủ) |
| **D16** | **Giờ và thời lượng tùy chọn; thứ tự mục thủ công; hoạt động thuộc ngày được chọn; Rest được thêm thủ công** | Chi tiết nhỏ ❓ Q18 |
| **D17** | Chi phí nhập **số nguyên không âm theo nghìn đồng**; **hiển thị VND đầy đủ**; **cho phép trống**; **chặn** giá trị âm và định dạng sai | Chi tiết nhỏ ❓ Q18 |
| **D18** | **Trống = chưa biết; 0 = chi phí đã biết bằng 0;** khoản **đã bao gồm** có **checkbox riêng và giá tham khảo tùy chọn**, **không cộng vào tổng phải trả thêm** | Tương tác giữa checkbox và ô chi phí chính ❓ Q18 |
| **D19** | **Xóa mềm và Hoàn tác; khu vực "Đã xóa gần đây"; giữ đến khi xóa vĩnh viễn; không có lịch sử chỉnh sửa; quyền trong chia sẻ xác định ở Lát 1b** | Phạm vi Hoàn tác, xóa mềm cho chuyến, xóa vĩnh viễn ❓ Q17. Không suy diễn giao diện |
| **D20** | **Nguyên tắc khôi phục:** không khôi phục quyền chủ chuyến nếu người yêu cầu không chứng minh được quyền sở hữu bằng bằng chứng được hệ thống chấp nhận; chấp nhận khả năng mất quyền truy cập vĩnh viễn khi mất mọi bằng chứng hợp lệ. Mã khôi phục hợp lệ là đủ làm bằng chứng; không thêm yếu tố khôi phục thứ hai bắt buộc | Chi tiết thiết kế: `docs/autopilot/q16-design-draft.md` (chờ duyệt) |
| **D21** | **Hướng bằng chứng ở Lát 1a:** mã khôi phục tự lưu + thiết bị tin cậy duyệt thiết bị mới. **Không** triển khai kênh liên hệ (email, số điện thoại) ở 1a | Mở rộng D15; không đổi D8, D14 |
| **D22** | **Một danh tính chủ có thể sở hữu nhiều chuyến; mỗi danh tính có một mã khôi phục dùng chung cho mọi chuyến của danh tính đó** | |
| **D23** | **Mã khôi phục dùng một lần. Tái tạo mã cần phiên chủ còn hiệu lực. Khôi phục không tự động thu hồi mọi phiên khác** | |
| **D24** | **Khôi phục phải thiết lập và xác nhận mã thay thế mới hoàn tất; không được bỏ qua. Mã cũ còn hiệu lực cho đến khi mã thay thế được xác nhận và ghi bền** | |
| **D25** | **Xác thực lại bằng bằng chứng được chấp nhận** trước khi xóa vĩnh viễn cả chuyến, tái tạo mã hoặc chuyển giao chủ. Không áp dụng cho xóa mềm hay xóa từng mục | Áp dụng nếu thao tác tồn tại (❓ Q17, Q16 câu 7). Loại bằng chứng xác thực lại: 🔶 trong bản thiết kế |
| **D26** | **Hiển thị mã khôi phục một lần khi tạo danh tính; cho phép bỏ qua nhưng phải cảnh báo rõ rằng mất mọi bằng chứng hợp lệ có thể dẫn đến mất quyền vĩnh viễn** | Câu chữ và giao diện: chưa chốt |

**Đối chiếu với nhật ký v0.1:** D1–D4 giữ nguyên. D7 cũ (thêm Nghỉ, Việc cần làm) → ✅ D13. D8 cũ (gõ tự do trước, gợi ý Lát 3) → phần gõ tự do ở 1a là ✅ D14, phần gợi ý ở Lát 3 vẫn 🔶. D9 cũ (thành viên có cần tài khoản) → hướng đã trả lời ở ✅ D8, bảo mật vẫn ❓. D10 cũ (nguồn dữ liệu địa điểm) → ❓ Q15. D5 và D6 cũ (thứ tự lát, swipe trên ứng viên) → 🔶 P14, P15.

### 14.2 🔶 Đề xuất chưa duyệt (và 🔁 đề xuất đã bị thay thế)

| # | Đề xuất | Trạng thái | Lý do | Hệ quả nếu không làm |
|---|---|---|---|---|
| P1 | **Dry replay** 64 mục trên giấy hoặc bảng tính trước khi build 1a (§10.1) | 🔶 | Phát hiện sớm dòng không biểu diễn được | Thiếu sót chỉ lộ sau khi đã build |
| P2 | "Ý tưởng/đề xuất" chỉ tồn tại ở 1b; 1a **không** có vùng Ý tưởng; đổi ngày làm mục nằm ngoài khoảng thì chặn cho đến khi xử lý (R12) | 🔶 | Giữ 1a độc lập với 1b | Phải thêm vùng Ý tưởng vào 1a, hoặc mục mồ côi gây lỗi |
| P3 | Phân biệt **chưa biết / 0 / đã gồm**; tổng chỉ cộng giá trị số đã nhập (R4) | 🔁 **Đã thay thế bởi ✅ D18 và D17** (D18 thêm giá tham khảo) | | |
| P4 | **Số ngày = ngày lịch gồm hai đầu**; nhãn "Ngày N" và "N ngày M đêm" chỉ là mô tả (R5) | 🔶 | Khớp 9 khối ngày với 9 ngày lịch | Lệch ở biên khi hiển thị và dịch ngày |
| P5 | Lưu hoàn thành theo cặp **(việc × người)**; 1a có một chủ chuyến | 🔶 | Tránh đổi mô hình khi sang 1b | Phải đổi cách lưu và di chuyển dữ liệu ở 1b |
| P6 | Tùy chọn chuyến và "số người" **không thuộc Must 1a**; chỉ lưu hoặc hoãn | 🔶 | Chưa có hành vi nào dùng chúng | Mất giờ cho dữ liệu không dùng; nhưng cần Q11 vì liên quan hứng thú của bạn |
| P7 | Gợi ý nhắc nghỉ tự động → **Could** | 🔁 một phần: **Rest thêm thủ công đã duyệt (D16)**; phần tự động vẫn 🔶 | Cần dữ liệu thời gian và quy tắc chưa có | Khó viết quy tắc đúng |
| P8 | Trạng thái đặt chỗ, tổng theo ngày/loại, cờ giờ ước chừng → **Should**; checklist chuẩn bị theo nhóm đi cùng **1b** | 🔶 | Không nằm trong phạm vi 1a đã duyệt | Phạm vi 1a nở ra; Replay mất trường "trạng thái" |
| P9 | Ngưỡng xem lại = **vượt cận trên** của khoảng ước tính của lát | 🔶 | Thay "2× ước tính" vốn thiếu mốc cơ sở | Ngưỡng dừng không dùng được |
| P10 | Cách thử prototype swipe hai vòng và ngưỡng quan sát (§11.3) | 🔶 | Rẻ, độc lập backend | Dễ xây trước khi biết có hữu ích không |
| P11 | Thuật ngữ: **Organizer** = chủ chuyến; **Member** = người vào bằng link với tên hiển thị (gọi "Companion" trong phân tích); Viewer ❓ | 🔶 | Tránh ba cách gọi khác nhau | Mơ hồ khi viết quyền |
| P12 | **"Chốt"** không dùng ở 1a/1b và không có khóa lịch; chỉ dùng cho Lát 2 (R11) | 🔶 | Loại một khái niệm không có trạng thái tương ứng | Quy tắc quyền tham chiếu trạng thái không tồn tại |
| P13 | Phạm vi Rest/Task ở 1a: **loại mục + tạo nhanh + ô tích** (Task); không tự động | 🔁 một phần: **Rest thủ công đã duyệt (D16)**; phần Task và "tạo nhanh" vẫn 🔶 | Khớp 10 phiên bản sửa của bạn, ít phức tạp | Nếu "phạm vi đã thống nhất" rộng hơn thì thiếu |
| P14 | Swipe **trên ứng viên trong một khung giờ**, không phải dòng khám phá toàn cục (cũ D6) | 🔶 | Không cần nội dung có sẵn | Cần nguồn nội dung lớn |
| P15 | Thứ tự sau 1a/1b: Lát 2 → Lát 3 (cũ D5) | 🔶 | | Xem Q10 |

> Các đề xuất mặc định cũ cho Q1–Q5 ở §15 (v0.2) cũng đã bị thay thế bởi D15–D19; xem bảng đối chiếu ở **§15.0**.

### 14.3 🧪 Giả định

| # | Giả định | Cách kiểm chứng |
|---|---|---|
| G1 | Người đi cùng sẽ mở và dùng link | Replay 1b (§10.6) |
| G2 | Swipe hữu ích với nhóm nhỏ | Prototype (§11.3) |
| G3 | Khả năng 15–25 giờ/tuần duy trì được | Ghi giờ thực tế của 1a |
| G4 | Chuyến đã diễn ra ngày 29/08–06/09/2026; nhãn thứ trong file chưa khớp lịch 2026 | Bạn xác nhận (Q13) |
| G5 | "8 ngày 7 đêm" là cách đếm từ Ngày 1 (30/08–06/09) và Ngày 0 là ngày di chuyển trước | Bạn xác nhận (Q13) |
| G6 | "Checklist theo thành viên" áp dụng cho cả Việc cần làm trong lịch lẫn checklist chuẩn bị (diễn giải của tài liệu này) | Bạn xác nhận (Q12) |
| G7 | Có thể thiết kế cơ chế xác thực và khôi phục quyền chủ chuyến **an toàn** mà không cần tài khoản đầy đủ | Bản thiết kế được duyệt (Q16) |

### 14.4 ❓ Câu hỏi mở

Xem **§15**.

---

## 15. Câu hỏi mở (xếp theo mức ảnh hưởng)

Mỗi dòng có thể kèm **🔶 đề xuất chưa duyệt**. Đề xuất không phải quyết định. **Chi tiết chưa chốt không được suy diễn.**

### 15.0 Đã giải quyết: Q1–Q5

| # | Quyết định | Còn lại chưa chốt | 🔁 Đề xuất cũ bị thay thế |
|---|---|---|---|
| **Q1** | ✅ **D15:** danh tính ẩn danh + lưu phía server; mở trên thiết bị khác; thiết kế xác thực và khôi phục quyền chủ chuyến an toàn | Cơ chế xác thực cụ thể (**Q16**) | "Chủ chuyến là một người dùng ngầm định duy nhất; cách định danh quyết cùng công nghệ" |
| **Q2** | ✅ **D16:** giờ và thời lượng tùy chọn; thứ tự thủ công; hoạt động thuộc ngày được chọn; Rest thêm thủ công | Chi tiết nhỏ (**Q18**) | Một phần: "giờ tùy chọn", "ghi ở ngày bắt đầu" và "thứ tự thủ công" được duyệt; **cờ ước chừng chưa quyết**; "mục không giờ nằm đầu ngày" **không còn áp dụng** (thứ tự thủ công) |
| **Q3** | ✅ **D17:** số nguyên không âm theo nghìn đồng; hiển thị VND đầy đủ; cho phép trống; chặn âm và định dạng sai | Chi tiết nhỏ (**Q18**) | Một phần: nhận số không âm, chặn âm/sai, trống được duyệt; **"làm tròn phần lẻ" bị bỏ** (số nguyên nên không có phần lẻ) |
| **Q4** | ✅ **D18:** trống = chưa biết; 0 = biết bằng 0; "đã bao gồm" có checkbox riêng và giá tham khảo tùy chọn, không cộng vào tổng | Tương tác checkbox và ô chi phí (**Q18**) | Phần lớn được duyệt (cờ "đã bao gồm", gói là mục riêng không liên kết); bổ sung **giá tham khảo** |
| **Q5** | ✅ **D19:** xóa mềm và Hoàn tác; Đã xóa gần đây; giữ đến khi xóa vĩnh viễn; không có lịch sử chỉnh sửa; quyền ở 1b | Phạm vi Hoàn tác, xóa mềm cho chuyến, xóa vĩnh viễn (**Q17**); quyền (**Q6**) | Một phần: danh sách "Đã xóa" được duyệt; "giữ đến khi xóa chuyến" **đổi thành** "giữ đến khi xóa vĩnh viễn"; **thêm Hoàn tác** |

### 15.1 Chặn spec Lát 1a

| # | Câu hỏi | Ảnh hưởng | 🔶 Đề xuất chưa duyệt, lý do và hệ quả |
|---|---|---|---|
| **Q16** | **Thiết kế xác thực và khôi phục quyền chủ chuyến** (D15). Cơ chế cụ thể **chưa chốt**; tài liệu này **không** đề xuất cơ chế. Các câu hỏi thiết kế cần trả lời: (1) bằng chứng nào chứng minh quyền chủ chuyến trên thiết bị mới; (2) điều gì xảy ra khi mất mọi cách khôi phục; (3) cách mở chuyến trên thiết bị khác; (4) phiên hiệu lực bao lâu; (5) ai truy cập được dữ liệu nếu lộ link hoặc mã; (6) chống lạm dụng và giới hạn tần suất; (7) quyền chủ chuyến có chuyển giao được không; (8) Member ở 1b quay lại trên thiết bị khác thế nào | Thực thể Trip/Danh tính, bảo mật, quyền sở hữu, 1b | Hướng đã chọn ở D20–D26. Đã có bản nháp **tài liệu thiết kế** (`docs/autopilot/q16-design-draft.md`: các tình huống mất thiết bị, mất mã, bị chiếm quyền); **còn chờ bạn duyệt** trước spec 1a. *Hệ quả nếu bỏ qua:* người cài đặt (kể cả Claude Code) tự chọn cơ chế khi code, khó sửa về sau |
| **Q11** | **Tùy chọn khi tạo chuyến** (kiểu chuyến, nhịp, ngân sách, số người): lưu để làm gì, có thuộc 1a không? | Phạm vi 1a; liên quan sở thích "option chọn về chuyến đi" của bạn | P6: không thuộc Must; hoặc bạn nói rõ chúng cần đem lại hành vi gì |

### 15.2 Nên chốt khi viết spec 1a (chi tiết còn lại của quyết định Q2–Q5)

| # | Câu hỏi | 🔶 Đề xuất |
|---|---|---|
| **Q17** | **Phần còn lại của Q5:** (a) Hoàn tác chỉ áp dụng cho thao tác xóa hay cả thao tác sửa; (b) xóa mềm áp dụng cho mục (gồm Nghỉ, Việc cần làm) nhưng **cả chuyến thì sao**; (c) hành động **xóa vĩnh viễn**: ai, có xác nhận không, có xóa nhiều mục một lúc không; (d) giao diện cụ thể | Chưa có đề xuất mặc định về giao diện (không suy diễn). *(a):* nếu Hoàn tác chỉ cho thao tác xóa thì khớp với "không có lịch sử chỉnh sửa"; cần bạn xác nhận |
| **Q18** | **Chi tiết còn lại của Q2–Q4:** (a) thứ tự thủ công mâu thuẫn với giờ: cho phép hay cảnh báo; (b) giờ + thời lượng vượt nửa đêm: hiển thị và ràng buộc thế nào; (c) có làm cờ "giờ ước chừng" (A-15) không; (d) xác nhận số thập phân bị coi là định dạng sai; giá trị tối đa; (e) ký hiệu và dấu phân cách khi hiển thị VND; (f) khi tick "đã bao gồm", ô chi phí chính có bị khóa hoặc xóa không, có thể vừa có chi phí vừa tick không (ví dụ dòng 33), giá tham khảo hiển thị ra sao | Chưa có đề xuất mặc định; đây là chi tiết có thể chốt khi review spec |

### 15.3 Cần trước khi chạy Replay (không chặn spec 1a)

| # | Câu hỏi | 🔶 Đề xuất |
|---|---|---|
| **Q13** | **Ngày thật và cách đếm:** xác nhận 29/08–06/09/2026; nhãn "T6/T7" trong file khớp lịch 2025 chứ không khớp 2026; "8 ngày 7 đêm" có phải đếm từ Ngày 1 không | Không sửa file; Replay ghi nhận khác biệt (§10.5) |
| **Q14** | **"Chờ xác nhận" (62/64 mục):** nghĩa là gì, có được cập nhật trong chuyến thật không; có đưa trạng thái đặt chỗ vào Must 1a không | P8: Should |

### 15.4 Cần trước khi viết spec Lát 1b

| # | Câu hỏi | 🔶 Đề xuất chưa duyệt, lý do và hệ quả |
|---|---|---|
| **Q6** | **Quyền** xem, sửa, đề xuất, xóa, khôi phục, **xóa vĩnh viễn** của từng vai trò (D19 giao cho 1b); có vai trò Viewer riêng không; ai tạo việc cần làm; Organizer rời đi thì sao | Chỉ biết: thành viên xem và đề xuất; Organizer duyệt. *Chưa có đề xuất mặc định:* ảnh hưởng quyền và bảo mật, cần bạn quyết |
| **Q7** | **Link mời:** một hay nhiều link; **thu hồi**; **hết hạn**; ai tạo; mở trong trình duyệt hay phải cài app | Organizer thu hồi được, không tự hết hạn. *Hệ quả:* link bị lộ thì ai có link vào được đến khi thu hồi |
| **Q8** | **Sửa đồng thời** (không có lịch sử chỉnh sửa, D19, nên chỉ dựa vào cảnh báo để tránh ghi đè) | Ghi đè theo mục, cảnh báo khi sửa trên bản cũ, mở lại để thấy thay đổi, chưa đồng bộ tức thì. *Hệ quả:* có thể mất sửa nếu cảnh báo bị bỏ qua và không khôi phục được |
| **Q9** | **Vòng đời mục và ý nghĩa của "chốt"**; người đề xuất có thấy đề xuất bị từ chối không; ngày/giờ khi chấp nhận do ai chọn | P12 |
| **Q12** | **Hoàn thành theo thành viên:** áp dụng cho Việc cần làm trong lịch, cho checklist chuẩn bị (27 hạng mục, 5 nhóm), hay cả hai; ai thấy tick của ai; ai tạo hạng mục; checklist chuẩn bị thuộc lát nào | P8: đi cùng 1b |

### 15.5 Sau prototype hoặc về sau

| # | Câu hỏi | Ghi chú |
|---|---|---|
| **Q10** | **Có đổi thứ tự Lát 2/Lát 3** (hoặc kéo Lát 2 lên) sau khi thử prototype swipe không | Quyết sau kết quả §11.3 |
| **Q15** | Nguồn dữ liệu địa điểm; xem lịch khi mạng yếu | Hoãn |

### 15.6 Blocker còn lại trước khi viết spec Lát 1a

1. **Q16** — thiết kế xác thực và khôi phục quyền chủ chuyến (bản thiết kế cần được bạn duyệt).
2. **Q11** — tùy chọn khi tạo chuyến thuộc 1a hay không.
3. Cần bạn xác nhận **P13** (phạm vi Task và "tạo nhanh") và nên xem xét **P2, P5**, vì chúng quyết định 1a có độc lập với 1b hay không.
4. **Q17 và Q18** là chi tiết, có thể chốt trong lúc review spec; không chặn việc bắt đầu viết.

---

## 16. Làm việc với Claude Code

1. Mỗi lát một file spec ngắn trong `docs/slices/` (`lat-1a.md`, `lat-1b.md`…), rút từ §9. **Spec Lát 1a chưa được tạo.** Không đưa cả file này cho mỗi tác vụ.
2. **Giao việc nhỏ**: một câu chuyện (ví dụ A-3) mỗi lần, không "làm cả Lát 1a".
3. **Kế hoạch trước, code sau**: yêu cầu Claude Code đề xuất cách làm và chờ bạn duyệt.
4. Quy tắc nghiệp vụ (§7.4) **bạn tự viết thành kiểm tra** trước, rồi nhờ Claude Code viết phần cài đặt. Bạn vừa học vừa kiểm soát tính đúng. Quy tắc tiền (R2–R4) và xóa mềm (R7) là ứng viên đầu tiên.
5. Yêu cầu giải thích đoạn bạn chưa hiểu, nếu mục tiêu của bạn là học.
6. Cuối mỗi lát: cập nhật §14, ghi lại thiếu sót ở §10.4, ghi số giờ thực tế để hiệu chỉnh §13.
7. **Quy tắc ký hiệu:** Claude Code chỉ coi ✅ là quyết định. Gặp 🔶 hoặc ❓ thì **dừng và hỏi**, không tự chọn phương án.
8. **Prototype swipe** (§11.3) làm tách biệt, không trộn vào codebase chính; không dùng kết quả prototype như một quyết định roadmap.
9. **Lát 1a không được phụ thuộc** vào thành phần của 1b hoặc các lát sau (§9.2).
10. **Không để Claude Code tự chọn** cơ chế xác thực và khôi phục (Q16), thiết kế giao diện, cấu trúc cơ sở dữ liệu hoặc phân quyền chi tiết ở 1b. Các việc này cần được bạn duyệt trước khi triển khai.
11. Chưa cài công cụ, plugin hay skill nào; việc đó quyết khi bắt đầu implementation.

---

## Phụ lục A — Số liệu phân tích file

- Mục lịch trình: **64** · khối ngày: **9** (Ngày 0–8) · checklist: **27** hạng mục / 5 nhóm.
- Phân loại: Ăn uống 20 · Tham quan 15 · Di chuyển 10 · Lưu trú 6 · Thuê xe 4 · Mua sắm 4 · Tour 2 · Dự phòng 2 · Vui chơi 1.
- Trạng thái: Đã đặt 2 · Chờ xác nhận 62.
- Tổng chi phí: sheet lịch trình **12.130K** · sheet chi phí **13.047K** · chênh **917K**.
- Giá trị ngoài vùng cộng (cột I): 2.617K · 1.000K · 600K.
- Giờ dạng ước chừng "~": 3 mục · ô giờ lỗi định dạng: 1 mục.
- Dòng không có tên hoạt động nhưng có dữ liệu: 2 (dòng 84, 85).
- Số ngày lịch của chuyến: **9** (29/08–06/09, gồm hai đầu) · khối ngày: **9** (Ngày 0–8) · cụm "8 ngày 7 đêm" ghi trong tiêu đề file (📎 ghi nhận, **không sửa**).
- 29/08/2026 là **Thứ 7** theo lịch; file ghi "T6" (📎 nhãn khớp lịch 2025).
- Sáu ô ghi sẵn nhiều phương án: dòng 11, 14, 32, 46, 57, 65.
- Dòng cần thử mô hình thời gian (qua nửa đêm): 16→18 (xuất phát 22:00, đến 04:00 hôm sau), 40→42 (xe về Hà Nội qua đêm), 43 (khách sạn "book từ 22h hôm trước" nhưng gắn giờ 06:30).
- Ô chi phí "—": **32 ô**. Trong đó 9 ô có ghi chú "bao gồm"; 23 ô còn lại (dòng 19 ghi "không mất phí"; dòng 54 và 55 ghi "miễn phí" thuộc combo). Dòng 33 ghi "Bao gồm tour" nhưng có chi phí 150K.
- Mọi giá trị chi phí số trong file (32 ô ở sheet lịch trình, 11 ô ở sheet chi phí) là **số nguyên không âm** (nghìn đồng); không có số thập phân hay số âm.

## Phụ lục B — Nguồn tham khảo (đã tìm 23/10/2026)

> Một phần là trang so sánh của chính đối thủ, nên chỉ dùng để biết họ nói gì về mình. Giá và gói có thể đã thay đổi.

- Wanderlog (App Store Mỹ): https://apps.apple.com/us/app/wanderlog/id1476732439
- So sánh Stippl và Wanderlog (marketing của Stippl): https://www.stippl.io/blog/stippl-vs-wanderlog
- So sánh Pilot và Wanderlog (marketing của Pilot): https://www.pilotplans.com/compare/wanderlog-alternative-feature-comparison
- Giá Splitwise 2026: https://getfinny.app/blog/splitwise-pricing-2026
- Đánh giá Splitwise và Tricount: https://localsinsider.com/?p=27826
- Du lịch nội địa Việt Nam (bối cảnh, không phải bằng chứng nhu cầu cho Wander): https://www.intellinews.com/tourism-sector-booming-in-vietnam-391518
- Báo cáo Vietnam Report về tần suất và chi tiêu du lịch: https://news.tuoitre.vn/print/vietnam-tourism-may-hit-record-in-2025-as-travelers-increase-spending-report-10325120213463935.htm
