# DR-007 — Đánh giá bằng nhãn biên tập, "Xếp giúp tôi" là gợi ý, giờ hoạt động mỗi ngày

- **Trạng thái:** `APPROVED` — PO trả lời ngày 25/10/2026 sau khi xem prototype bản 5: "'Đánh giá' hiển thị bằng nhãn biên tập, Khuyến nghị: chỉ là nút gợi ý, người dùng chấp nhận hoặc bỏ. Giờ hoạt động mỗi ngày cần thêm cột mới trong cơ sở dữ liệu -? ok,".
- **Liên quan:** DR-005 (mục 3 hoãn "AI xếp lịch"), DR-006, ADR-009, D16, `docs/ux/product-spec-v1.md`, `docs/implementation/decisions.md` §2.

## Quyết định
1. **"Đánh giá" địa điểm = nhãn biên tập**, không có số sao: "Nên ghé" / "Đáng đi" / "Chỉ ghé nếu tiện" kèm một câu lý do, ghi rõ là ý kiến biên tập của Wander. Không hiển thị số sao khi chưa có nguồn dữ liệu thật. Dòng "sao" trong `product-spec-v1.md` §2 coi như bỏ (nhất quán ADR-009: "Không có điểm sao của người dùng").
2. **"Xếp giúp tôi" (nhóm địa điểm theo khoảng cách) chỉ là nút gợi ý:** hiện bản xem trước, người dùng chấp nhận hoặc bỏ, và hoàn tác được sau khi áp dụng. Không tự áp dụng. Đây là phép tính khoảng cách xác định, **không phải AI xếp lịch**; "AI xếp lịch" vẫn hoãn theo DR-005.
3. **Giờ hoạt động mỗi ngày** (giống "Active hours" của Roameo): PO đồng ý hướng thêm cột mới trong cơ sở dữ liệu. Câu trả lời có dấu "-?" nên **cần xác nhận lại một lần khi bắt đầu làm**; đây là thay đổi lược đồ (migration mới, không sửa V1–V3), đi qua `/wander-feature` như một story riêng.

## Chưa quyết (vẫn OPEN)
- Công tắc "chưa chắc ngày" so với R5 (chuyến luôn có ngày đi/về): PO chưa trả lời. Prototype chưa làm công tắc này.

## Hệ quả khi thực hiện
- Nhãn biên tập là dữ liệu biên tập theo địa điểm (cùng tệp biên tập của ADR-009): trường nhãn + lý do + ngày cập nhật. Nội dung thật phải do PO hoặc nguồn kiểm chứng được duyệt; bản trong prototype là bản nháp.
- "Xếp giúp tôi": chạy trên tọa độ địa điểm, đường chim bay, ghi rõ "ước tính". Mục thiếu tọa độ không được hứa là "gần nhau". Mục đang chờ duyệt xóa không được xếp.
