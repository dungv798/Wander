# Mở rộng dữ liệu thị giác theo chuẩn Hà Giang

PO 06/11: "hôm qua lúc t bảo m research về hà giang thì m đã làm đúng, tìm ảnh rất chất lượng, t muốn m làm tương tự với các nơi khác, thêm vô khắp việt nam luôn thì tuyệt". Đây là mở rộng nhiệm vụ tuyển ảnh/nội dung hiện tại; không thay công việc Claude đang hoàn thiện UI, không mở thêm vòng phản biện hoặc thay stack/schema/API.

Chuẩn tuyển: ảnh có chủ thể và khoảnh khắc rõ (con người giữa hoạt động, món ăn đang làm/được thưởng thức, chợ, văn hóa, nghề thủ công, trải nghiệm trên hành trình); bố cục, ánh sáng và màu đủ tốt để tạo hứng thú như bộ Hà Giang đã dùng trong prototype. Phong cảnh là một phần trong bộ, không dùng toàn cảnh trống cho mọi chủ đề. Không nhồi số, gán nhầm nơi hoặc ghép ảnh quán khác. Giữ credit/license/source từng ảnh, nguồn và độ chắc chắn của từng POI; không tạo rating/trend giả.

## Triển khai trong phạm vi đã được phép

1. Hoàn thiện bộ ảnh cho 12 điểm đến hiện có từ kho research đã lưu và nguồn ảnh miễn phí có quyền sử dụng. Đối chiếu bộ Pexels Hà Giang trong prototype để giữ chuẩn thị giác; ảnh dùng trong app phải có metadata/trang nguồn và giấy phép rõ.
2. Mở rộng đợt đầu thêm 8 điểm đến đại diện vùng còn thiếu: Sa Pa, Cao Bằng, Ninh Bình, Hạ Long, Phong Nha, Buôn Ma Thuột, Phú Quốc, Cần Thơ. Chỉ đưa vào app khi đã có địa điểm neo, tọa độ và ảnh đúng nơi; địa điểm tham khảo chưa đạt được giữ trong research. Không tuyên bố đã phủ mọi điểm du lịch Việt Nam.
3. Đưa ảnh vào catalog/bank thật; dùng format và hạ tầng sẵn có. Unsplash giữ hotlink + báo lượt dùng, Commons giữ giấy phép riêng, Pexels chỉ dùng những ảnh được tuyển cụ thể sau khi đọc trang ảnh/giấy phép. Không tự tạo API key, scrape mạng xã hội hoặc mua nguồn trả phí.
4. Kiểm kê cả hai tập hiện có: 136 điểm Discover và 1.434 POI phụ trợ. Không nhập lại 628 POI Đà Lạt đã có. 85 khoảnh khắc hiện tại là mốc trước đợt mở rộng tiếp, không đồng nhất với số địa điểm.
5. Codex sở hữu tuyển dữ liệu, Claude sở hữu mã web. Chốt dữ liệu trước lần build/kiểm Java cuối để API và ảnh chụp đọc cùng phiên bản catalog. Chỉ đếm những gì thực sự có trong tài nguyên/API; công khai những nơi/chủ đề chưa có ảnh đạt chuẩn.

Kiểm kê mốc: [catalog-inventory-2026-11-06.md](../research/catalog-inventory-2026-11-06.md). Brief UI/review vẫn là `ui-rollout-2026-11-05.md` và `ui-rollout-review-1-2026-11-06.md`.

## Bổ sung trekking (PO 06/11)

PO yêu cầu thêm địa điểm trekking. Dùng category `leo` hiện có và nội dung thực dụng (độ khó, thời lượng/tuyến, mùa khi có nguồn, điểm xuất phát và yêu cầu guide/đăng ký khi được xác nhận). Phân biệt đỉnh tham chiếu với đầu tuyến và cung GPX; không suy ra đường trekking từ đường chim bay hoặc hiển thị thời gian xe máy tới đỉnh như một tuyến đi được. Không đánh đồng cáp treo với trekking. Ưu tiên nguồn cơ quan du lịch/VQG/đơn vị quản lý tuyến, không tự nhận tuyến đang mở hay giấy phép hiện hành khi chưa có bằng chứng.

Ứng viên đầu: Fansipan (hình thức trekking tách rõ cáp treo), Lảo Thẩn, tuyến rừng Bidoup – Núi Bà, các cung trong VQG Phong Nha và Núi Chúa khi đủ dữ kiện. Tà Năng – Phan Dũng cần hồ sơ tuyến riêng; không gán điểm giữa rừng thành điểm xuất phát chỉ để lên bản đồ. Trekking sẽ có lối tìm riêng trong UI, giữ bộ icon và filter nhất quán.
