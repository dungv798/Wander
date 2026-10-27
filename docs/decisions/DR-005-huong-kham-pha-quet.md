# DR-005 — Hướng sản phẩm: khám phá địa danh bằng quẹt (deck-first)

- **Trạng thái:** `APPROVED` — PO trả lời ngày 24/10/2026, sau khi xem prototype quẹt và 50 ảnh Roameo: "Deck-first, trước hết thì cứ lấy api địa điểm cho chắc, … [AI xếp lịch] t nghĩ là nên làm sau".
- **Liên quan:** D2, D7, D8, D14 (plan §14.1), Q10, Q15 (plan §15), Q16; `docs/ux/roameo-analysis.md`, `docs/ux/roameo-ui-review.md`, `docs/ux/content-research-plan.md`.
- **Plan:** master plan v0.4 **không đổi** (vẫn ghi swipe ở Lát 2, gợi ý/địa điểm ở Lát 3). DR này là nguồn quyết định; nếu mâu thuẫn với plan, hỏi PO, không tự sửa plan.

## Quyết định
1. **Deck-first.** Luồng lõi: người dùng **tìm một điểm đến** (ví dụ "Hà Giang") → ra **bộ thẻ ứng viên**, mỗi thẻ là **một địa điểm cụ thể**, nhiều ảnh (chạm để sang ảnh kế, như story) → **quẹt phải chọn / trái bỏ qua** → quẹt hết thì các nơi đã chọn vào **giỏ** (trip mặc định của điểm đến đó) → hỏi có **lưu vào lịch trình** không (đặt tên, hoặc lưu bản khác "Hà Giang - 2", "Hà Giang - 3"…) → **chia sẻ cho nhóm**; nhóm có thể **chọn thêm** địa điểm chưa chọn hoặc **yêu cầu xóa** địa điểm không muốn. (Khác Roameo: Roameo tạo chuyến trước rồi mới quẹt.)
2. **Nguồn địa điểm: dùng API địa điểm trước** để có dữ liệu và ảnh đủ tốt ngay. **Cổng admin để biên tập địa danh làm sau** (PO vẫn muốn có; không bỏ).
3. **AI xếp lịch ("Generate itinerary") làm sau.** Quẹt chỉ chọn; xếp địa điểm vào ngày là thao tác tay (lõi Lát 1a đã có).
4. **Giai đoạn học tập, chưa thương mại hóa** (PO nói 24/10/2026): không làm thuê bao, khuyến mãi liên kết, hay onboarding bán hàng. Mức "nới quy định" cụ thể vẫn chờ PO xác nhận bảng ở `roameo-analysis.md` §7.

## Chưa quyết (đã tách thành câu hỏi riêng)
- Nhà cung cấp API địa điểm cụ thể, chi phí và khóa API (Tầng A kỹ thuật → sẽ thành ADR).
- Lưu giỏ vào lịch trình khi chưa có ngày; địa điểm "chưa xếp ngày" trong Trip (Tầng A sản phẩm: đổi nghĩa lược đồ).
- Thành viên nhóm "chọn thêm" là thêm trực tiếp hay đề xuất để chủ duyệt.
- Thứ tự Lát 2/3 và sự va chạm với D8/D14 (plan).

## Hệ quả
- Cần đặc tả sản phẩm v1 (`docs/ux/product-spec-v1.md`, bản nháp) trước khi thiết kế giao diện hay viết code.
- Mọi dữ liệu địa điểm đi qua một **cổng (port) trong domain**, để đổi nhà cung cấp hoặc chuyển sang kho tự biên tập sau này mà không đổi nghiệp vụ.
- Prototype quẹt (artifact) vẫn là bản thử cảm giác; không đưa vào codebase.
