# Đặc tả sản phẩm v1 (bản nháp): khám phá địa danh bằng quẹt

> Trạng thái: **bản nháp để PO duyệt**, chưa phải quyết định (24/10/2026). Nền: [DR-005](../decisions/DR-005-huong-kham-pha-quet.md).
> Phạm vi: luồng "tìm điểm đến → quẹt → giỏ → lưu thành lịch trình → chia sẻ nhóm". Không gồm AI xếp lịch, nhập từ mạng xã hội, đặt chỗ, cổng admin (làm sau).
> Quy ước: **[Đ]** = đã quyết (DR-005); **[Đ?]** = đề xuất, cần PO; **[Hỏi]** = câu hỏi mở.

## 1. Luồng lõi

```
Tìm điểm đến ──► Bộ thẻ ứng viên ──► Quẹt (chọn / bỏ qua / hoàn tác)
                                          │ hết thẻ hoặc bấm "Xong"
                                          ▼
                                   Giỏ "Hà Giang" (các nơi đã chọn)
                                          │ "Lưu vào lịch trình?"
                       ┌──────────────────┼───────────────────────┐
                       ▼                  ▼                       ▼
               Tạo lịch trình mới   Thêm vào lịch trình    Để trong giỏ
               (tên "Hà Giang",     có sẵn                 (chưa lưu)
               trùng ⇒ "- 2", "- 3")
                       │
                       ▼
            Lịch trình (Lát 1a: ngày, mục, chi phí, đặt chỗ, ngân sách)
                       │ chia sẻ
                       ▼
        Nhóm xem; chọn thêm địa điểm chưa chọn; yêu cầu xóa địa điểm
```

## 2. Khái niệm

| Tên | Nghĩa | Ghi chú |
|---|---|---|
| **Điểm đến** (Destination) | Vùng/thành phố người dùng tìm ("Hà Giang") | [Đ] tìm theo tên; có tâm bản đồ và định danh từ nhà cung cấp |
| **Địa điểm** (Place) | Một nơi cụ thể trong điểm đến (đèo, quán, homestay, thác…) | [Đ] mỗi thẻ là một địa điểm. Dữ liệu (tên, ảnh, sao, loại, địa chỉ) lấy từ API địa điểm qua cổng domain |
| **Thẻ** (Card) | Hiển thị một địa điểm để quyết định | Nhiều ảnh dạng story; sao, loại, khu vực; kéo lên xem chi tiết |
| **Phiên quẹt** | Chuỗi thẻ của một điểm đến cho một người | Nhớ đã quẹt nơi nào để quay lại không lặp lại |
| **Giỏ** | Các nơi đã chọn trong một phiên quẹt, chưa lưu vào lịch trình | [Đ] giống giỏ hàng; mỗi (người dùng, điểm đến) một giỏ đang mở |
| **Lịch trình** (Trip) | Thực thể đã có ở Lát 1a | [Đ?] nhận địa điểm từ giỏ |
| **Thành viên** | Người cùng xem/sửa một lịch trình | Lát 1b; Organizer và Member (plan §3) |

## 3. Quy tắc (đề xuất)

**Tìm và bộ thẻ**
- Tìm điểm đến có gợi ý khi gõ; chọn một kết quả. Bộ thẻ gồm các địa điểm nổi bật trong điểm đến, phân trang. **[Đ?]** lọc nhanh theo nhóm (Tham quan, Ăn uống, Cà phê, Lưu trú) bằng chip; mặc định "Tham quan".
- Mỗi thẻ có ≥ 1 ảnh; địa điểm không có ảnh thì **không** vào bộ thẻ (tránh thẻ trống).
- Không lặp địa điểm đã chọn hoặc bỏ qua trong cùng giỏ; "Làm lại" xóa các lựa chọn bỏ qua của phiên.

**Cử chỉ**
- Kéo phải = Chọn; kéo trái = Bỏ qua; ngưỡng kéo và vận tốc như prototype. Chạm **nửa phải/ trái của thẻ** = ảnh kế/ trước; chạm giữa hoặc kéo lên = chi tiết. Có nút bấm tương đương (truy cập được bằng bàn phím và trình đọc màn hình).
- **Hoàn tác** thẻ vừa quẹt (liên hệ D19: xóa mềm và Hoàn tác).

**Giỏ và lưu**
- Giỏ liệt kê các nơi đã chọn, bỏ chọn được. Giỏ **chưa lưu** vẫn còn khi quay lại.
- "Lưu vào lịch trình": (a) tạo mới, (b) thêm vào lịch trình có sẵn của cùng điểm đến hoặc bất kỳ, (c) để trong giỏ.
- **Đặt tên [Đ]:** mặc định là tên điểm đến; nếu người dùng đã có lịch trình cùng tên thì thêm hậu tố " - 2", " - 3"… (số nhỏ nhất chưa dùng). Người dùng sửa tên được.
- Địa điểm trong lịch trình lưu **định danh nhà cung cấp** và các trường do Wander sở hữu (ngày, giờ, chi phí, ghi chú, đặt chỗ); **không** lưu nội dung do nhà cung cấp trả về nếu điều khoản cấm (xem mục 5).

**Chia sẻ nhóm (Lát 1b)**
- Chủ lịch trình mời thành viên bằng liên kết; thành viên đặt tên hiển thị (plan D8/D14, không tài khoản đầy đủ).
- Thành viên **xem** toàn bộ, **mở bộ thẻ của điểm đến** để **chọn thêm** địa điểm chưa có trong lịch trình, và **yêu cầu xóa** một địa điểm. **Chủ duyệt/từ chối** yêu cầu xóa [Đ theo mô tả của PO]. **[Hỏi]** thêm địa điểm thì **tự vào** hay **chờ chủ duyệt**?
- Mọi thay đổi của thành viên hiện cho cả nhóm; không có lịch sử chỉnh sửa (D19).

## 4. Mô hình dữ liệu (phác thảo, chưa chốt)

```
destination(id, provider, provider_place_id, name, center_lat?, center_lng?)       -- chỉ lưu định danh và tên hiển thị người dùng chọn
place_ref(id, provider, provider_place_id, destination_id)                        -- tham chiếu, KHÔNG lưu nội dung nhà cung cấp
swipe_session(id, identity_id, destination_id, created_at)
swipe(session_id, place_ref_id, decision[like|skip], decided_at)                  -- lịch sử quẹt (để không lặp, để hoàn tác)
basket_item(session_id, place_ref_id, added_at)                                   -- hoặc suy ra từ swipe(like) chưa lưu
trip_item.place_ref_id (nullable)                                                  -- liên kết mục lịch trình với địa điểm
```
- Đổi lược đồ thật cần migration và quyết định Tầng A; phác thảo này chỉ để bàn.

## 5. Dữ liệu địa điểm qua cổng domain (bắt buộc theo DR-005)

- Cổng `PlaceCatalog` (domain) với `searchDestinations(text)`, `candidates(destination, filters, page)`, `details(placeRef)`, `photos(placeRef)`. Adapter ở `infrastructure` gọi nhà cung cấp; có thể đổi sang kho tự biên tập (cổng admin) mà không đổi nghiệp vụ.
- Khóa API là **bí mật**: biến môi trường, không đưa vào repo (`.env` đã ignore); đặt **hạn mức/ngân sách** tại nhà cung cấp.
- Điều khoản nhà cung cấp (lưu trữ, hiển thị, ghi công) quyết định có được lưu nội dung hay không; xem so sánh ở ADR sắp tới.

## 6. Màn hình (danh mục, chưa thiết kế)

1. Tìm điểm đến (ô tìm, điểm đến gần đây/ nổi bật).
2. Bộ thẻ quẹt (thẻ nhiều ảnh, nút Chọn/Bỏ qua/Hoàn tác/Chi tiết, tiến độ).
3. Chi tiết địa điểm (bảng kéo lên).
4. Giỏ (danh sách, bỏ chọn, "Lưu vào lịch trình").
5. Hộp thoại lưu (tạo mới/ thêm vào có sẵn/ để trong giỏ; ô tên).
6. Lịch trình (Lát 1a hiện có, thêm khu "địa điểm đã chọn chưa xếp ngày" nếu PO duyệt).
7. Chia sẻ và thành viên (Lát 1b).

## 7. Cắt lát đề xuất (có thể đảo thứ tự)

| Lát | Nội dung | Phụ thuộc |
|---|---|---|
| **K0** | Quyết định nhà cung cấp API + khóa + hạn mức; cổng `PlaceCatalog` + adapter; thử gọi tìm điểm đến và ứng viên với dữ liệu thật | ADR nhà cung cấp |
| **K1** | Bộ thẻ quẹt (giao diện thật) + phiên quẹt + hoàn tác + giỏ | K0 |
| **K2** | Lưu giỏ vào lịch trình (tạo mới/ thêm vào, đặt tên "- n") | K1, quyết định ngày/ "chưa xếp" |
| **K3** | Chia sẻ và thành viên: chọn thêm, yêu cầu xóa, chủ duyệt | K2, Lát 1b (Q6–Q9) |
| **K4** (sau) | Cổng admin, kho tự biên tập thay/ bổ sung API | K0 |
| **K5** (sau) | AI xếp lịch; nhập từ mạng xã hội | — |

## 8. Câu hỏi mở (Tầng A)

- **O-1 Nguồn dữ liệu địa điểm và chi phí:** PO đã nói **không có tiền, không muốn tốn chi phí** (24/10/2026). Đang so các hướng không tốn phí (xem phản hồi và ADR sắp tới). Thử nghiệm nhỏ cho thấy dữ liệu mở thưa với vùng sâu như Hà Giang (Wikivoyage 5 mục; OSM 12/40 điểm có tên, 0 có ảnh) nên cần **biên tập tay + công cụ nạp dữ liệu**; điều này kéo K4 (admin/ kho tự biên tập) lên sớm.
- ~~O-2, O-3~~ **Đã quyết (DR-006):** hỏi khoảng ngày lúc lưu; các nơi đã chọn vào vùng "Chưa xếp ngày" của lịch trình.
- ~~O-4~~ **Đã quyết (DR-006):** thành viên thêm địa điểm thì tự vào; xóa thì chờ chủ duyệt.
- **O-5 Thứ tự Lát 2/3, D8, D14, Q10:** DR-005 đảo ưu tiên (khám phá lên trước); cần ghi nhận chính thức.
