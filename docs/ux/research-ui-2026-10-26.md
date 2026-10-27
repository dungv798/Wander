# Nghiên cứu giao diện (26/10/2026): màu, chuyển động, bản đồ, giữ chân

> Phục vụ phản hồi của PO: "màu sắc quá già và thiếu sức sống … bố cục chưa bắt mắt, thiếu animation … nghiên cứu kĩ bản đồ". Đây là tóm tắt **điều đã tra và đã áp dụng**, không phải cam kết sản phẩm. Số liệu từ blog/hãng có thể thiên lệch: `UNVERIFIED`.

## 1. Nguồn đã tra
- **50 ảnh Roameo** của PO (`docs/UI-sample/`), xem lại các màn mở đầu, Home, quẹt, lịch theo ngày.
- Web: xu hướng màu và gradient 2026 (Envato "Mobile App Color Scheme Trends 2026", Updivision "UI Color Trends 2026", Kreativa "Gradient Design Trends 2026"), thiết kế app du lịch 2026 (Boldare, JPLoft, G&Co), onboarding 2026 (Scholar Journal), bản đồ (OpenFreeMap, Protomaps, MapLibre, MapTiler), vật lý thẻ quẹt và View Transitions (motion.dev).
- Kỹ năng `ui-ux-pro-max`: danh sách kiểm truy cập, chạm, chuyển động.

## 2. Điều rút ra và đã áp dụng
| Phát hiện | Nguồn | Áp dụng ở prototype |
|---|---|---|
| Roameo "tươi" vì **nền trắng/xanh trời + vật thể bóng kính + nút gradient + ảnh lớn**, không phải vì nhiều màu; mỗi màn chỉ 1 màu nhấn (cam), tuyến mỗi ngày **một màu** (tím) kèm số thứ tự | ảnh Roameo #1, #19, #36, #41 | Bộ màu mới nền trời sáng; ngày chỉ một màu nhấn; ghim đánh số; vật thể bóng kính (`art.js`): máy bay, la bàn, mặt trời, ghim |
| Bản đồ là **trung tâm** Home và chuyến đi; danh sách là tờ kéo ba nấc trên bản đồ | Roameo #19, #41 | Màn chuyến đi: bản đồ cả màn + `BottomSheet` ba nấc; bản đồ ở trang chủ, trang điểm đến, "Đã chọn", chi tiết, giới thiệu |
| Thẻ quẹt gần **toàn màn**, ảnh làm nền, dấu ✓/✕ 3D lớn, tên + điểm + "xem chi tiết" nổi dưới | Roameo #36–37 | Bộ thẻ toàn màn; nền mờ theo ảnh ở máy tính; dấu bóng kính; nút nổi đè lên ảnh |
| Xu hướng 2026: gradient là "ánh sáng nền" mềm, màu hơi bớt bão hòa, nền ấm hoặc trắng ngà; nhưng PO muốn **sặc sỡ** | các bài xu hướng; lời PO 25–26/10 | Ba hướng màu tươi (Biển sớm, Nhiệt đới, Hoàng hôn) + đốm sáng nền trôi chậm; PO chọn bằng ảnh so sánh |
| Onboarding tốt: **trì hoãn đăng ký**, cho thấy giá trị ngay, câu mời cảm xúc | Scholar Journal, G&Co | 3 cảnh tự chạy cho thấy quẹt và lịch hình thành; "Để sau" lưu luôn; hook đổi luân phiên ở trang chủ |
| Tuyến theo ngày: nên **đánh số, gom theo ngày, bật/tắt lớp** thay vì mỗi ngày một màu; không chỉ dựa vào màu | Bloom trip planner mockup, shadcn trip block, tài liệu MapsIndoors | Ngày = một màu + số; ngày khác mờ; nhãn "Ngày n" ghi bằng chữ |
| Thẻ quẹt cần **vật lý** (xoay theo độ lệch, ngưỡng vận tốc) và chuyển cảnh có **ảnh dùng chung** | motion.dev (animateView), thẻ Flutter/React | Ngưỡng vận tốc có sẵn; thẻ phía sau lớn dần theo `--p`; View Transitions cho thẻ bìa → đầu trang |
| Bản đồ nguồn mở miễn phí + tile tự lưu rẻ; Mapbox/Google tính theo lượt | OpenFreeMap, Protomaps, woosmap | `docs/architecture/map-options.md` (AD-14) |

## 3. Kho chuyển động đã thêm (tôn trọng giảm chuyển động)
Tiêu đề hiện từng chữ · ba "sự thật" nổi lên · máy bay lướt · la bàn lắc · thẻ giữa trang chủ đổi ảnh và nảy dấu thích · ghim nổi · dải tên nơi chạy ngang · số đếm lên · ghim rơi lần lượt · tuyến vẽ dần + chấm sáng · tờ kéo lò xo · pháo giấy khi tạo chuyến · nút chính có vệt sáng quét · đốm sáng nền trôi · thị sai mặt trời/quạt ảnh khi cuộn · chuyển màn mượt · bộ bài/hand mẫu ở giới thiệu.

## 4. Chưa làm / để ngỏ
- Điểm sao và đánh giá người đi (G1), bước "Bạn mê gì?" (G2), tuyến theo đường thật (cần định tuyến), nền tối (để sau), 3D thật (Lottie/Rive) thay vật thể SVG.
