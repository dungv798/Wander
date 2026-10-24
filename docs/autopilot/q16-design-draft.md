# Q16 — Bản thiết kế xác thực và khôi phục quyền chủ chuyến

> **DRAFT – PROPOSED, chờ bạn duyệt.** Nguồn: `docs/wander-master-plan.md` v0.3 (đã đọc nguyên văn D8, D14, D15, D19, G7, Q6, Q7, Q16, Q17, §7.1, R13, §15.0–15.6) và run `docs/autopilot/runs/20261023-1301-q16-thiet-ke-xac-thuc-va/` (báo cáo agent giữ nguyên).
> **Trạng thái:** đã ghi nhận nguyên tắc A và 6 quyết định của chủ dự án (mục 0.1). Q16 vẫn `OPEN`, G7 vẫn `UNVERIFIED`, blocker §15.6 mục 1 chưa đóng cho đến khi bạn duyệt bản thiết kế này. Không chọn công nghệ, không có mã. Phần ghi vào plan: xem `docs/autopilot/plan-patch-q16.md`.

## 0. Nguyên tắc và quyết định của chủ dự án
**Nguyên tắc A (chủ dự án xác nhận, 23/10/2026):** không khôi phục quyền chủ chuyến nếu người yêu cầu không chứng minh được quyền sở hữu bằng bằng chứng được hệ thống chấp nhận; chấp nhận khả năng mất quyền truy cập vĩnh viễn khi mất mọi bằng chứng hợp lệ. Mã khôi phục hợp lệ là đủ làm bằng chứng; **không** thêm yếu tố khôi phục thứ hai bắt buộc.
- Token: nguyên tắc A và QĐ-1…QĐ-6 là **xác nhận của chủ dự án trong hội thoại**. Plan v0.3 chưa chứa chúng (xem `plan-patch-q16.md` để ghi vào §14.1). Theo quy ước repo, chỉ ✅ trong plan là `APPROVED`.
- Hệ quả `INFERENCE`: (a) không có "hỗ trợ khôi phục thủ công" dựa trên lời khai; (b) tên chuyến, điểm đến, ngày đi, nội dung lịch **không** là bằng chứng; (c) email/số điện thoại **không mặc định** đủ mạnh; (d) hệ thống chỉ xác nhận được **người đang giữ bằng chứng**, không xác nhận được người đó là chủ thật.

### 0.1 Quyết định đã xác nhận
| Nhãn | Nội dung đã chốt |
|---|---|
| QĐ-1 | Hướng bằng chứng cho 1a: **A+C** (mã khôi phục tự lưu + thiết bị tin cậy duyệt thiết bị mới). **Phương án B (kênh liên hệ) không triển khai trong 1a** |
| QĐ-2 | **Một danh tính chủ có thể sở hữu nhiều chuyến. Mỗi danh tính có một mã khôi phục, dùng chung cho mọi chuyến của danh tính đó** |
| QĐ-3 | Mã khôi phục **dùng một lần**. Tái tạo mã cần **phiên chủ còn hiệu lực**. Khôi phục **không tự động thu hồi mọi phiên khác** |
| QĐ-4 | Yêu cầu **xác thực lại bằng bằng chứng được chấp nhận** trước: xóa vĩnh viễn **cả chuyến**, **tái tạo mã**, **chuyển giao chủ**. Không mở rộng sang xóa mềm hay xóa từng mục. Áp dụng **nếu** thao tác tồn tại (Q17, câu 7 còn `OPEN`) |
| QĐ-5 | Hiển thị mã **một lần** khi tạo danh tính; cho phép **bỏ qua** nhưng phải cảnh báo rõ rằng mất mọi bằng chứng hợp lệ có thể dẫn đến mất quyền vĩnh viễn |
| QĐ-6 | **Luồng khôi phục KP-C:** khôi phục phải thiết lập và **xác nhận mã thay thế** mới hoàn tất; **không được bỏ qua**; **mã cũ còn hiệu lực cho đến khi mã thay thế được xác nhận và ghi bền** |

Nhãn "KP-C" là phương án C trong phân tích xung đột QĐ-3/QĐ-4 (khôi phục bắt buộc thiết lập bằng chứng mới), **khác** với "C" trong "A+C" (thiết bị tin cậy).

### 0.2 Mặc định `PROPOSED` (chi tiết đảo ngược được, nhất quán với QĐ-1…QĐ-6; chờ duyệt cùng bản thiết kế)
| Nhãn | Nội dung | Ghi chú |
|---|---|---|
| MĐ-1 | **Xác thực lại** (OQ-4): bằng chứng là phê duyệt từ **thiết bị tin cậy khác**, hoặc **mã khôi phục** hiện hành (bị tiêu thụ, thao tác kèm phát hành và xác nhận mã thay thế). Mỗi bằng chứng dùng cho **một thao tác**; không có cửa sổ "vừa xác thực", kể cả ngay sau khôi phục | Không chọn cửa sổ vì QĐ-6 đã đảm bảo chủ luôn có mã mới |
| MĐ-2 | **Phát hành mã lần đầu** cho danh tính đã bỏ qua lúc tạo (QĐ-5): chỉ cần phiên hợp lệ, kèm cảnh báo. Không có gì để xác thực lại | Rủi ro: ai chiếm phiên khi danh tính chưa có mã có thể phát hành mã của riêng họ |
| MĐ-3 | Yêu cầu mã thay thế (QĐ-6) áp dụng cho **khôi phục bằng mã**. Thêm thiết bị qua phê duyệt từ thiết bị tin cậy là "mở trên thiết bị khác" (D15), không tiêu thụ mã, không cần mã thay thế | |
| MĐ-4 | "Xác nhận" mã thay thế = **người dùng nhập lại mã thay thế** | Giao diện cụ thể: spec |
| MĐ-5 | Nhiều lần thử khôi phục cùng một mã được phép đồng thời, **không giữ chỗ**; commit đầu tiên thắng | Giữ chỗ cho phép kẻ có mã chặn chủ thật |
| MĐ-6 | Lần thử lặp lại cùng mã nhận diện là idempotent; lần thử chờ có thời hạn (giá trị: spec); mã thay thế chưa xác nhận **không bao giờ hợp lệ**; bắt đầu lại thì mã thay thế cũ chưa kích hoạt vô hiệu | |
| MĐ-7 | **Phiên chờ** (trước commit) không truy cập dữ liệu và không thao tác chủ | |
| MĐ-8 | Mã **tự chứa thông tin tìm ra danh tính** (không thêm mã định danh phải lưu riêng); giới hạn tần suất theo nguồn/toàn cục, không khóa theo từng danh tính (tránh khóa chủ thật); mã đủ ngẫu nhiên để không đoán được trên toàn bộ danh tính | Con số cụ thể: spec |

### 0.3 Đối chiếu với plan `APPROVED`
Không có mâu thuẫn với D8, D14, D15, D19. QĐ-4 nhắc xóa vĩnh viễn cả chuyến, trong khi plan mới duyệt xóa mềm và giữ đến khi xóa vĩnh viễn (D19); xóa cả chuyến và ai xóa vĩnh viễn là Q17 `OPEN`, nên QĐ-4 có điều kiện. QĐ-2 khớp §7.1 (Danh tính ẩn danh là thực thể riêng, tách khỏi Trip).

## 1. Ràng buộc đã duyệt từ plan (`APPROVED`, tóm tắt, không phải trích nguyên văn)
- **D15:** danh tính ẩn danh + lưu phía server ở 1a; mở được trên thiết bị khác; phải thiết kế xác thực và khôi phục quyền chủ chuyến an toàn.
- **D8:** Member vào bằng tên hiển thị qua link, chưa yêu cầu tài khoản đầy đủ ngay từ đầu. **D14:** 1a không phụ thuộc tài khoản đầy đủ.
- **D19:** xóa mềm, giữ đến khi xóa vĩnh viễn, không có lịch sử chỉnh sửa; quyền trong chia sẻ do 1b xác định.
- Còn `OPEN`: Q16, Q17 (a–d), Q6, Q7, Q8; G7 `UNVERIFIED`.

## 2. Phân biệt các khái niệm
| Khái niệm | Nghĩa trong tài liệu này | Không phải |
|---|---|---|
| Danh tính | Đại diện nội bộ ẩn danh của chủ; **sở hữu nhiều chuyến và có một mã khôi phục** (QĐ-2); không chứa tên thật | Tài khoản đầy đủ (D14); tên hiển thị |
| Bằng chứng quyền sở hữu | Thứ chủ trình ra để hệ thống chấp nhận họ là chủ. Trong 1a: mã khôi phục hoặc phê duyệt từ thiết bị tin cậy (QĐ-1) | Thông tin chuyến đi; lời khai; kênh liên hệ |
| Đăng nhập (thiết lập phiên) | Trình bằng chứng trên một thiết bị để mở phiên. Có thể không có màn hình "đăng nhập" riêng | Khôi phục |
| Phiên | Trạng thái "thiết bị này đang đại diện chủ", có thời hạn và **thu hồi được**; tách khỏi quyền sở hữu | Quyền sở hữu |
| Authorization | Kiểm tra tại **thời điểm thao tác**: phiên còn hiệu lực + vai trò được phép (Q6) | Xác thực |
| Xác thực lại | Trình bằng chứng được chấp nhận **ngay trước** một thao tác nhạy cảm, dù phiên còn hiệu lực (QĐ-4, MĐ-1) | Đăng nhập |
| Khôi phục | Lập phiên mới trên thiết bị mới bằng **mã khôi phục** khi không còn cách khác; hoàn tất chỉ sau khi mã thay thế được xác nhận (QĐ-6) | Đặt lại do bên thứ ba, hỗ trợ thủ công |
| Lần thử khôi phục | Một nỗ lực khôi phục có mã nhận diện, ở trạng thái chờ cho đến khi commit hoặc hết hạn | |
| Mã thay thế | Mã mới được phát hành trong khôi phục hoặc tái tạo; chỉ hợp lệ sau khi được xác nhận và commit | Mã đang hiệu lực |
| Quan hệ sở hữu | Dữ liệu "chuyến X thuộc danh tính Y", có thể đổi; không gắn cứng vào khóa chính (đề xuất của architect, `PROPOSED`) | |

## 3. Câu hỏi thiết kế Q16 và vị trí hiện tại
| # | Câu hỏi (§15.1) | Trạng thái |
|---|---|---|
| 1 | Bằng chứng nào chứng minh quyền chủ | QĐ-1: mã khôi phục hoặc phê duyệt từ thiết bị tin cậy. Xác thực lại: MĐ-1 `PROPOSED` (OQ-4) |
| 2 | Mất mọi cách khôi phục | Mất quyền vĩnh viễn (nguyên tắc A, QĐ-5). Dữ liệu còn trên server: OQ-1 `OPEN`, **hoãn** |
| 3 | Mở trên thiết bị khác | QĐ-1: thiết bị tin cậy duyệt (5.1), hoặc khôi phục bằng mã (5.8) |
| 4 | Thời hạn phiên | `OPEN`, **hoãn** sang spec; yêu cầu đã có: thu hồi được |
| 5 | Lộ link/mã | Mã lộ ⇒ lộ và chiếm được **mọi chuyến** của danh tính (QĐ-2); bằng chứng chủ tách khỏi link mời/xem (`PROPOSED`); chi tiết link: Q7, **hoãn** |
| 6 | Chống lạm dụng | MĐ-8 `PROPOSED`; con số **hoãn** sang spec |
| 7 | Chuyển giao | `OPEN`, **hoãn**: mặc định không thuộc 1a vì phụ thuộc Q6. Nếu có, QĐ-4 áp dụng |
| 8 | Member quay lại ở 1b | `OPEN`, **hoãn** sang 1b (Q6, Q7); hệ quả `INFERENCE` ở mục 6 |

## 4. Phân tích phương án A/B/C (tất cả `PROPOSED`; chủ dự án đã chọn A+C cho 1a, QĐ-1)
Phương án lấy từ `stages/consolidate.md` §5 của run. Nhãn A/B/C ở đây là **phương án bằng chứng**, không phải ID của plan. **B không triển khai trong 1a**; cột B giữ lại làm lý do loại.
| | A. Mã bí mật + mã khôi phục tự lưu | B. Kênh liên hệ đã xác minh | C. Thiết bị tin cậy duyệt thiết bị mới |
|---|---|---|---|
| Bằng chứng | Sở hữu mã | Kiểm soát một kênh (email/SĐT hoặc khác) | Có phiên trên thiết bị đã được tin cậy |
| Hợp nguyên tắc A | Có: mất mã = mất quyền | Chỉ nếu "kênh đã xác minh" được định nghĩa là bằng chứng chấp nhận; không mặc định đủ mạnh | Có: mất hết thiết bị = mất quyền, trừ khi kèm A |
| Rủi ro chiếm quyền | Ai có mã là chủ; mã lộ/chụp trộm thì mất quyền ngay | Kênh bị chiếm (SIM, hộp thư) = chiếm chuyến | Thiết bị bị trộm còn phiên; chỉ thu hồi được từ thiết bị khác |
| Trải nghiệm | Phải tự lưu mã | Dễ nhớ, quen thuộc | Cần cầm sẵn thiết bị cũ khi thêm máy mới |
| Dữ liệu cá nhân | Không thu | Thu dữ liệu liên lạc (§12) | Không thu |
| Đảo ngược | Trung bình | Khó | Dễ |
| Va D14/D8 | Không thấy | **Chưa kết luận** (skeptic vs architect/security); không ảnh hưởng 1a vì B bị loại | Không thấy |
| Điểm yếu lớn nhất | Lưu mã | Chiếm kênh | Một thiết bị duy nhất không thu hồi từ xa được |

**Điểm yếu của A+C đã biết:** chiếm được một trong hai bằng chứng là đủ (mã lộ, hoặc thiết bị bị trộm còn phiên). Xác thực lại (QĐ-4) chặn **phiên bị chiếm** làm thao tác nhạy cảm, nhưng **không chặn kẻ có mã**, vì mã là bằng chứng hợp lệ (nguyên tắc A). Rủi ro này được chấp nhận khi chọn QĐ-1, giảm bằng thu hồi phiên thủ công và giới hạn tần suất.

## 5. Luồng (mô tả hành vi, không UI, không công nghệ)
**5.1 Thành công — mở trên thiết bị khác:** (i) Chủ có phiên trên máy cũ → máy cũ duyệt máy mới → phiên mới (MĐ-3: không tiêu thụ mã). (ii) Chủ khôi phục bằng mã (5.8). Chuyến mở với đủ dữ liệu (D15). Phiên mới hiện trong danh sách phiên.
**5.2 Từ chối khôi phục:** mã sai, hết hạn, đã tiêu thụ, mã thay thế chưa kích hoạt, hoặc chỉ có thông tin chuyến → từ chối; phản hồi giống nhau dù danh tính có tồn tại hay không; đếm tần suất (MĐ-8); không có lối "hỏi người hỗ trợ" thay thế.
**5.3 Mất thiết bị:** nếu còn thiết bị tin cậy khác → từ thiết bị đó chủ thu hồi phiên của thiết bị mất. Nếu mất thiết bị duy nhất và chủ còn mã → khôi phục (5.8). Theo QĐ-3, khôi phục **không tự động thu hồi mọi phiên khác**: phiên của thiết bị mất còn hiệu lực cho đến khi chủ thu hồi rõ ràng; sau khôi phục chủ được dẫn tới danh sách phiên (`PROPOSED`). Rủi ro còn lại: kẻ giữ thiết bị mất có phiên trong khoảng đó.
**5.4 Mất mọi phương thức khôi phục:** theo nguyên tắc A, quyền chủ **mất vĩnh viễn** (mất mã và không còn thiết bị tin cậy nào); không có đường vòng. Cảnh báo ở thời điểm hiển thị mã (QĐ-5). Dữ liệu chuyến còn trên server: OQ-1 `OPEN`.
**5.5 Thu hồi phiên:** chủ thu hồi một hoặc nhiều phiên khác bằng thao tác rõ ràng (không thuộc QĐ-4, không cần xác thực lại). Sau thu hồi, mọi thao tác được bảo vệ từ phiên đó bị từ chối (INV-2).
**5.6 Chuyển giao chủ (`OPEN`, câu 7):** nếu tồn tại: cần xác thực lại (QĐ-4, MĐ-1); bằng chứng chuyển giao dùng một lần, giới hạn thời gian; quan hệ sở hữu đổi trong một bước; phiên chủ cũ bị thu hồi; không có trạng thái hai chủ hoặc không chủ. Vì mã thuộc danh tính (QĐ-2), chuyển giao theo từng chuyến hay cả danh tính: `OPEN`. Vai trò chủ cũ: Q6.
**5.7 Xóa vĩnh viễn:**
- **Cả chuyến** (nếu thao tác tồn tại, Q17b `OPEN`): cần phiên chủ còn hiệu lực **và** xác thực lại (QĐ-4, INV-14). Sau đó không khôi phục được.
- **Từng mục và xóa mềm:** QĐ-4 không áp dụng. Ai xóa vĩnh viễn từng mục, có xác nhận không: Q17c `OPEN`, hoãn.
- `INFERENCE`: kẻ chiếm phiên có thể xóa vĩnh viễn từng mục (Q17c chưa chốt) nhưng không xóa được cả chuyến nếu thiếu bằng chứng thứ hai. Kẻ có mã thì có.
**5.8 Vòng đời mã khôi phục (QĐ-2, QĐ-3, QĐ-5, QĐ-6 là đầu vào; cơ chế chi tiết `PROPOSED`):**
- *Phạm vi:* một mã cho mỗi danh tính, dùng cho mọi chuyến hiện có và sau này. Tạo chuyến thêm **không** phát hành hay đổi mã. Hệ quả: mã lộ ⇒ lộ và chiếm mọi chuyến, kể cả mục xóa mềm (D19); mất mã (và không còn thiết bị tin cậy) ⇒ mất mọi chuyến.
- *Số lượng:* tại mọi thời điểm một danh tính có **tối đa một** mã hợp lệ.
- *Phát hành lần đầu:* khi tạo danh tính, hiển thị **một lần**; hệ thống chỉ giữ dữ liệu đủ để xác minh, không giữ bản đọc được. Bỏ qua được (QĐ-5): danh tính khi đó chưa có mã (khôi phục bằng mã không thể); phát hành sau: MĐ-2.
- *Khôi phục bằng mã (KP-C):*
  1. Chủ nhập mã trên thiết bị mới → hệ thống kiểm tra hợp lệ → tạo **lần thử khôi phục** ở trạng thái chờ (mã nhận diện do thiết bị sinh). Mã cũ **chưa bị tiêu thụ**. Phiên chờ không truy cập dữ liệu (MĐ-7).
  2. Hệ thống phát hành **mã thay thế** (chưa hợp lệ), hiển thị một lần. **Không được bỏ qua** (QĐ-6).
  3. Chủ **xác nhận** (nhập lại mã thay thế, MĐ-4).
  4. **Commit nguyên tử**, ghi bền trước khi báo thành công: mã cũ vẫn hợp lệ? → vô hiệu mã cũ → kích hoạt mã thay thế → kích hoạt phiên mới. Cả ba cùng thành công hoặc không có gì thay đổi.
- *Lỗi giữa chừng:*
  - **Trước commit** (đóng ứng dụng, mất mạng, lỗi ở bước 1–3): trạng thái danh tính không đổi; mã cũ vẫn dùng được; mã thay thế chưa xác nhận không bao giờ hợp lệ (INV-16); lần thử chờ hết hạn. Chủ bắt đầu lại; mã thay thế lần trước đã hiển thị nhưng chưa kích hoạt bị vô hiệu, và giao diện phải nói rõ điều này (spec).
  - **Sau commit nhưng mất phản hồi:** gửi lại cùng lần thử trả về kết quả đã commit, không tạo thêm gì (INV-12). Chủ đã xác nhận mã thay thế **trước** commit nên luôn giữ một mã hợp lệ, kể cả khi thiết bị mất dữ liệu cục bộ. Đây là điểm cải thiện so với việc tiêu thụ mã khi tạo phiên.
  - **Commit thất bại vì mã cũ đã bị tiêu thụ bởi lần thử khác:** lần thử này thất bại; mã thay thế của nó không bao giờ hợp lệ.
- *Đồng thời (MĐ-5):* nhiều lần thử cùng mã cùng tồn tại ở trạng thái chờ; commit đầu thắng. Rủi ro: kẻ có mã commit trước thì chủ thật mất đường khôi phục bằng mã (nguyên tắc A). Khi đó mã đang hiệu lực là mã của kẻ đó; chủ chỉ còn phiên hiện có và thiết bị tin cậy (nếu có) để thu hồi phiên của kẻ đó và xác thực lại bằng thiết bị tin cậy.
- *"Dùng một lần"* nghĩa là **một lần khôi phục thành công**; trình mã trong lúc chờ không tiêu thụ nó (diễn giải của QĐ-6 cùng QĐ-3; không mâu thuẫn).
- *Sau commit:* không phiên nào bị thu hồi tự động (QĐ-3); phiên mới hiện trong danh sách; chủ có mã thay thế vừa xác nhận để dùng về sau.
- *Tái tạo mã (QĐ-3, QĐ-4):* cần phiên hợp lệ **và** xác thực lại; dùng cùng cơ chế bước 2–4; mã cũ chỉ vô hiệu tại commit. Nếu dùng mã cũ làm bằng chứng xác thực lại thì việc trình mã cũ và xác nhận mã mới là **một** lần commit.
**5.9 Xác thực lại (QĐ-4, MĐ-1 `PROPOSED`, OQ-4):** áp dụng cho xóa vĩnh viễn cả chuyến, tái tạo mã, chuyển giao chủ.
- Bằng chứng: (a) phê duyệt từ **thiết bị tin cậy khác** (không tiêu thụ gì); hoặc (b) **mã khôi phục** hiện hành, bị tiêu thụ và thao tác kèm phát hành và xác nhận mã thay thế (5.8 bước 2–4) trước khi thực hiện thao tác nhạy cảm.
- Mỗi bằng chứng dùng cho **một thao tác**; không có cửa sổ "vừa xác thực", kể cả ngay sau khôi phục. Hệ quả: chủ một thiết bị vừa khôi phục xong mà muốn xóa cả chuyến phải dùng mã mới xác nhận rồi thiết lập mã thay thế khác.
- Danh tính chưa có mã và chỉ một thiết bị: không có bằng chứng xác thực lại, nên các thao tác nhạy cảm bị chặn cho đến khi có mã (MĐ-2) hoặc thiết bị tin cậy thứ hai. Chấp nhận, kèm cảnh báo ở QĐ-5.
- Không áp dụng cho xóa mềm, xóa từng mục, thu hồi phiên.

## 6. Tác động lên 1a / 1b
- **1a:** chủ chuyến duy nhất; có danh tính, mã khôi phục, thiết bị tin cậy, phiên, khôi phục KP-C, thu hồi, xác thực lại. Không phụ thuộc 1b: A và C không cần người đi cùng. Phương án nào cần Member để khôi phục chủ sẽ làm 1a phụ thuộc 1b (skeptic, §9.2), nên không dùng.
- **1b `INFERENCE`:** theo nguyên tắc A, Member mất bằng chứng của mình không được xác nhận là cùng một người; "quay lại" có thể phải là vào lại như Member mới. Mạo danh qua tên hiển thị (D8) là rủi ro nếu không có bằng chứng riêng. Mã của danh tính chủ **không** dùng cho Member. Chi tiết `OPEN` (Q6, Q7, Q16 câu 8).
- Mô hình khái niệm "danh tính + bằng chứng + phiên + quan hệ sở hữu là dữ liệu" giúp đổi cơ chế sau mà không làm lại (architect, `PROPOSED`).

## 7. Invariant (cần kiểm thử, `PROPOSED`)
| ID | Invariant |
|---|---|
| INV-1 | Không có bằng chứng hợp lệ thì không có phiên chủ và không thao tác quyền chủ |
| INV-2 | Phiên đã thu hồi không còn quyền thực hiện bất kỳ thao tác được bảo vệ nào. Quyền được kiểm tra phía server **tại thời điểm thao tác được ghi nhận**, không chỉ lúc phiên được cấp; thao tác chưa hoàn tất khi lệnh thu hồi có hiệu lực (kể cả thao tác không đảo ngược) phải kiểm tra lại trước khi ghi. Giới hạn: dữ liệu đã tải về thiết bị bị mất không thu hồi được |
| INV-3 | Member không nâng quyền lên Organizer bằng link, tên hiển thị hay phiên của mình (1b) |
| INV-4 | Link mời/xem không cấp quyền chủ |
| INV-5 | Thông tin chuyến (tên, điểm đến, ngày, nội dung) không bao giờ đủ làm bằng chứng |
| INV-6 | Phản hồi từ chối không tiết lộ danh tính/chuyến có tồn tại |
| INV-7 | Mã đã bị vô hiệu (khi commit khôi phục hoặc tái tạo) không dùng lại được; hai commit đồng thời trên cùng một mã thì đúng một thắng. Bằng chứng chuyển giao hết hạn/đã dùng cũng vậy |
| INV-8 | Chuyển giao: chủ cũ mất quyền, phiên cũ bị thu hồi, không có trạng thái hai chủ hoặc không chủ |
| INV-9 | Xóa vĩnh viễn cả chuyến cần phiên chủ hợp lệ **và** xác thực lại (INV-14); sau đó không khôi phục được. Xóa vĩnh viễn từng mục: theo Q17c `OPEN` |
| INV-10 | Khôi phục bằng mã không thu hồi phiên nào như tác dụng phụ (QĐ-3); phiên hiện có của chủ vẫn hoạt động. Thu hồi chỉ bằng thao tác rõ ràng của chủ |
| INV-11 | Commit khôi phục là nguyên tử: vô hiệu mã cũ, kích hoạt mã thay thế và kích hoạt phiên mới cùng xảy ra hoặc không có gì xảy ra; không có trạng thái "mã cũ đã mất mà mã thay thế chưa hợp lệ" hay "hai mã cùng hợp lệ" |
| INV-12 | Lần thử lặp lại cùng mã nhận diện là idempotent: sau commit trả về kết quả đã commit, không tạo thêm phiên hay mã; trước commit không đổi trạng thái |
| INV-13 | Mọi thao tác phát hành mã thay thế (khôi phục, tái tạo, xác thực lại bằng mã): mã cũ chỉ vô hiệu tại commit; tại mọi thời điểm một danh tính có tối đa một mã hợp lệ; lỗi giữa chừng không làm danh tính mất mã vốn có |
| INV-14 | Xóa vĩnh viễn cả chuyến, tái tạo mã và chuyển giao chủ bị từ chối nếu không có xác thực lại hợp lệ cho **chính thao tác đó**, dù phiên còn hiệu lực. Xóa mềm và xóa từng mục **không** bị ràng buộc này (QĐ-4) |
| INV-15 | Phiên chờ (trước commit) không truy cập dữ liệu và không thao tác chủ |
| INV-16 | Mã thay thế chưa xác nhận và chưa commit không bao giờ được chấp nhận làm bằng chứng |
| INV-17 | Một mã cho mỗi danh tính: tạo chuyến thêm không phát hành hay đổi mã; mã khôi phục danh tính không dùng được cho Member |

## 8. Tình huống kiểm thử âm
- NEG-1: dùng tên chuyến + điểm đến + ngày đi để khôi phục → từ chối (INV-5).
- NEG-2: phiên đã thu hồi gửi lại yêu cầu sửa/xóa, gồm yêu cầu gửi trước lúc thu hồi nhưng chưa ghi → từ chối (INV-2).
- NEG-3: Member gọi thao tác duyệt/xóa vĩnh viễn/chuyển giao → từ chối nếu thuộc quyền Organizer; chi tiết quyền chờ Q6 (INV-3).
- NEG-4: dùng link mời để thực hiện thao tác chủ → từ chối (INV-4).
- NEG-5: thử mã sai nhiều lần, thử mã tương tự → giới hạn tần suất, phản hồi không phân biệt (INV-6).
- NEG-6: dùng lại mã đã bị vô hiệu sau khôi phục hoặc tái tạo; dùng lại bằng chứng chuyển giao đã dùng/hết hạn → từ chối (INV-7).
- NEG-7: chuyển giao rồi chủ cũ thao tác bằng phiên cũ → từ chối (INV-8).
- NEG-8: thiết bị bị trộm còn phiên cố xóa vĩnh viễn **cả chuyến** → từ chối nếu không xác thực lại (INV-14). Xóa vĩnh viễn từng mục từ phiên đó: kết quả mong đợi chưa xác định vì Q17c `OPEN`.
- NEG-9 (`OPEN`): hai thiết bị của chủ sửa cùng một mục cùng lúc; kết quả mong đợi chưa xác định vì chưa quyết xử lý ở 1a.
- NEG-10: hai lần thử khôi phục đồng thời cùng một mã → đúng một commit thành công; mã thay thế của lần thua không bao giờ hợp lệ (INV-7, INV-16).
- NEG-11: mất phản hồi sau commit → gửi lại cùng lần thử trả về kết quả đã commit; chủ vẫn dùng được mã thay thế đã xác nhận (INV-12).
- NEG-12: phiên chiếm được cố tái tạo mã, chuyển giao hoặc xóa vĩnh viễn cả chuyến mà không xác thực lại → từ chối (INV-14).
- NEG-13: đóng ứng dụng hoặc mất mạng giữa bước 1–3 của khôi phục → mã cũ vẫn dùng được, mã thay thế chưa xác nhận không dùng được (INV-11, INV-16).
- NEG-14: sau khôi phục bằng mã, phiên hiện có của chủ vẫn hoạt động và thấy phiên mới trong danh sách (INV-10).
- NEG-15: xóa mềm và xóa từng mục thành công với phiên hợp lệ mà không xác thực lại (INV-14, không mở rộng QĐ-4).
- NEG-16: phiên chờ cố đọc dữ liệu hoặc thao tác chủ trước commit → từ chối (INV-15).
- NEG-17: trình mã thay thế chưa commit làm bằng chứng → từ chối (INV-16).
- NEG-18: tạo thêm chuyến → mã khôi phục không đổi, không hiện mã mới; dùng mã danh tính làm Member → từ chối (INV-17).
- NEG-19 (ghi nhận hành vi mong đợi theo MĐ-2): danh tính chưa có mã, phiên hợp lệ phát hành mã lần đầu được phép; test phải ghi lại hành vi và rủi ro đã nêu, không coi là lỗi.
- NEG-20: sau khôi phục, chủ một thiết bị xóa cả chuyến → phải dùng mã mới xác nhận và thiết lập mã thay thế khác; không thể dùng phiên vừa lập thay bằng chứng (INV-14, MĐ-1).

## 9. Câu hỏi còn `OPEN` và phần hoãn
- **Q16 (toàn bộ):** `OPEN` cho đến khi bạn duyệt bản thiết kế. **G7:** `UNVERIFIED`.
- **OQ-3 (phạm vi mã): đã quyết bởi QĐ-2** (một mã cho mỗi danh tính). Hệ quả đã ghi ở 5.8 và INV-17; không còn mục mở về phạm vi.
- **OQ-4 (xác thực lại):** `OPEN`, có mặc định MĐ-1 `PROPOSED`; được duyệt cùng bản thiết kế.
- **MĐ-2…MĐ-8:** `PROPOSED`, chi tiết đảo ngược được; được duyệt cùng bản thiết kế hoặc sửa theo ý bạn.
- **Hoãn sang spec/1b (không chặn đóng Q16 nếu bạn chấp nhận):** câu 4 thời hạn phiên; câu 6 con số giới hạn tần suất, thời hạn lần thử chờ, cách giao diện nói về mã thay thế bị vô hiệu; câu 7 chuyển giao (mặc định không thuộc 1a); câu 8 Member (Q6, Q7); câu 5 chi tiết link (Q7).
- **Q17b/Q17c:** xóa chuyến cả, ai xóa vĩnh viễn từng mục; có thể chốt khi review spec (§15.6 mục 4).
- **Hai thiết bị cùng có phiên ở 1a:** hệ quả `INFERENCE` của "mở trên thiết bị khác"; cách xử lý ghi đè (kiểu Q8) chưa quyết, hoãn sang spec 1a.
- **OQ-1:** dữ liệu của chuyến đã mất quyền vĩnh viễn (giữ, xóa sau thời hạn, khác). Hoãn nhưng cần quyết trước khi ra mắt (riêng tư §12, D19).
- **OQ-2:** QĐ-5 đã trả lời phần chính. Còn lại: câu chữ cảnh báo, việc nhắc lại về sau; hoãn sang giao diện/spec.
- Định nghĩa "tài khoản đầy đủ" (D14/D15): hoãn, chỉ cần nếu phương án B được xét lại.

## 10. Giả định, bất đồng, rủi ro còn tồn tại
- **Giả định:** (1) nguyên tắc A và QĐ-1…QĐ-6 đúng như bạn nêu; áp dụng cho chủ chuyến, chưa suy ra cho Member; (2) có thể thiết kế an toàn không cần tài khoản đầy đủ (G7, `UNVERIFIED`); (3) "đăng nhập" không bắt buộc có màn hình riêng; (4) nền tảng (web hay app, Q7) chưa biết nên tần suất mất phiên/mất mã không đánh giá được; (5) "không tự động thu hồi mọi phiên khác" được hiểu là khôi phục không thu hồi phiên nào như tác dụng phụ (xem INV-10; nếu bạn muốn nghĩa khác, đó là thay đổi đối với INV-10 và NEG-14).
- **Bất đồng giữ nguyên:** kênh liên hệ có va D8/D14 không (skeptic vs architect/security, `stages/reconcile.md` mục 1); không còn ảnh hưởng 1a vì B bị loại.
- **Rủi ro còn lại:** mã lộ = chiếm quyền **mọi chuyến** của danh tính, kể cả khi đã vượt QĐ-4; thiết bị bị trộm còn phiên đến khi chủ thu hồi (QĐ-3); kẻ có mã commit khôi phục trước chủ thật (MĐ-5); danh tính chưa có mã bị phát hành mã bởi kẻ chiếm phiên (MĐ-2); chủ một thiết bị chưa có mã không thực hiện được thao tác nhạy cảm; mất mọi bằng chứng = mất vĩnh viễn (chấp nhận theo nguyên tắc A); xóa vĩnh viễn từng mục bởi kẻ chiếm phiên (Q17c); dữ liệu mồ côi trên server (OQ-1); ghi đè giữa hai thiết bị (D19: không có lịch sử chỉnh sửa); ước tính §13.1 `UNVERIFIED`.
- **Giới hạn:** không có mô hình đe dọa thực, không có số đo; bản này không kiểm chứng G7 và chưa có test nào được chạy.

## 11. Việc còn lại để duyệt
1. Duyệt bản thiết kế này (kể cả MĐ-1…MĐ-8) hoặc nêu chỗ sửa. Chưa duyệt thì blocker §15.6 mục 1 vẫn mở.
2. Ghi nguyên tắc A và QĐ-1…QĐ-6 vào plan theo `docs/autopilot/plan-patch-q16.md` (plan đang bị chặn sửa bởi quy tắc deny, nên bạn cần áp dụng thủ công) rồi cập nhật hash trong registry.
3. Chấp nhận các mục hoãn ở mục 9, hoặc yêu cầu chốt sớm mục nào.

## 12. G7 — điều kiện xác minh (tách khỏi điều kiện đóng Q16)
Đóng Q16 không làm G7 được xác minh. G7 ("có thể thiết kế an toàn mà không cần tài khoản đầy đủ") chỉ chuyển khỏi `UNVERIFIED` khi có: tiêu chí "an toàn" đo được (A-0 mới có diễn giải); mô hình đe dọa ngắn được duyệt; bản thiết kế Q16 được duyệt; INV-1…INV-17 và NEG-1…NEG-20 chuyển thành test có kết quả pass (chưa có mã nên chưa có kết quả); kiểm tra với người dùng thật xem họ có giữ được mã không; và chính bạn tuyên bố G7 đã xác minh.

**Ranh giới:** không sửa master plan, không sửa báo cáo agent, không mã. Q16 không được đánh dấu CLOSED. Các mặc định MĐ-1…MĐ-8 là `PROPOSED`.
