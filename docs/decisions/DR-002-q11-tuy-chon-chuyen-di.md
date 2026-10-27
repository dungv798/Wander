# DR-002 — Tùy chọn khi tạo chuyến (Q11)

- **Trạng thái:** `APPROVED` — PO chọn "Muốn làm tùy chọn chuyến đi tối thiểu" (hướng) rồi chọn "C: ngân sách + kiểu chuyến + nhịp" (gói) ngày 24/10/2026, sau phiên `/wander-council q11` (product-analyst + skeptic-qa, 1 vòng; hội đồng khuyến nghị gói A, PO chọn C).
- **Liên quan:** Q11 (plan §7.3, §15.1), P6, §15.6 mục 2; D16–D19, R2/D18; plan §7.2 (không gợi ý/nhắc tự động).
- **P13:** vẫn `DEFAULTED` chưa xác nhận (không thuộc quyết định này).

## Quyết định
Lát 1a có **ba tùy chọn chuyến đi, đều tùy chọn khi tạo chuyến** (để trống = chưa đặt):
1. **Ngân sách dự kiến** — có hành vi thật: hiển thị cạnh "Tổng phải trả thêm" (R2) và chênh lệch **chỉ tính trên R2**.
   - Ghi rõ "chưa gồm N mục chưa biết giá"; không bao giờ coi mục chưa biết (trống) là 0 (D18); mục "đã bao gồm" không trừ vào ngân sách.
   - Trống = chưa đặt (không hiện chênh lệch); 0 = đã đặt bằng 0 (hiện "vượt" nếu tổng > 0).
   - Số nguyên không âm, đơn vị nghìn đồng, tối đa như D17 (1.000.000.000 nghìn đồng). Vượt ngân sách **chỉ hiển thị thông tin, không chặn** thêm mục.
2. **Kiểu chuyến** (chọn nhiều) — **nhãn hiển thị**, không có hành vi gợi ý.
3. **Nhịp chuyến** (thoải mái / vừa / dày, chọn một) — **nhãn hiển thị**, không có hành vi gợi ý.

**Không làm: "số người"** (plan chưa nói chi phí mục là mỗi người hay cả nhóm, nên không thể chia tổng; không thêm quy tắc tiền mới ngoài D17/D18). Quyết lại khi plan làm rõ.

## Mặc định Tier B (đã ghi `decisions.md` §2; đảo ngược được)
- Kiểu chuyến lưu dạng **tập đóng**: Nghỉ dưỡng, Khám phá, Ẩm thực, Biển, Núi, Thành phố, Gia đình, Bạn bè; chọn **tối đa 5**, không trùng, thứ tự lưu ổn định. (Danh sách và giới hạn là copy/mặc định của implementation, PO có thể đổi.)
- Nhịp: ba giá trị đúng như plan; chọn một hoặc để trống.
- Sửa được sau khi tạo; đi theo chuyến khi xóa mềm. Đồng thời: hai lần sửa **chồng nhau** trên cùng chuyến thì lần sau nhận `409 CONCURRENT_MODIFICATION` (khóa lạc quan `@Version` của `Trip`); hai lần lưu **nối tiếp** thì lần sau thắng (không có lịch sử chỉnh sửa, D19). Để hạn chế ghi đè, form sửa chuyến chỉ gửi trường đã đổi và máy chủ giữ nguyên trường không nêu.
- Hiển thị: ngân sách ở trang chi tiết chuyến cạnh tổng; kiểu/nhịp là nhãn ở đầu chuyến và trên danh sách chuyến. **Chưa làm lọc theo kiểu chuyến** (không nằm trong gói; thêm sau nếu PO muốn).

## Thực hiện
Xong 24/10/2026 qua `/wander-feature`: migration `V3__trip_options.sql` (`budget_k`, `styles` CSV, `pace`), `TripOptions`/`TripStyle`/`TripPace`, API (`budget`, `styles`, `pace` khi tạo/sửa chuyến; `budgetK`, `budgetFormatted`, `styles[]`, `pace` trong chuyến; khối `budget` trong chi tiết chuyến), UI (form tạo/sửa chuyến, khối ngân sách), `TripOptionsApiIT`, `TripOptionsTest`, e2e. Chưa làm lọc theo kiểu chuyến.

## Hệ quả (việc cho `/wander-feature`)
- Migration `V<n>` mới (không sửa V1): thêm cột vào `trips` (ngân sách nullable; kiểu chuyến lưu trong một cột; nhịp nullable). Domain `Trip`, command tạo/sửa chuyến, query, API (`web/src/api.ts` và mã lỗi), UI `Trips.tsx` / `TripView.tsx`.
- Test cần có: domain (ngân sách null/0/âm/vượt tối đa; chênh lệch với mục chưa biết, "đã bao gồm", đã xóa mềm — xóa rồi khôi phục thì chênh lệch đổi theo), `*IT` (tạo/sửa có và không có tùy chọn, 409 khi sửa đồng thời, foreign trip ⇒ 404), e2e (ngân sách trống so với 0, dòng "chưa gồm N mục chưa biết giá").
- Hai trường nhãn (kiểu, nhịp) là "dữ liệu nằm đó" theo đúng cảnh báo của plan §7.3: đã được PO chấp nhận. Gỡ cột đã có dữ liệu sau này tốn hơn thêm cột.

## Đã gác lại
- Thành viên 1b có thấy/sửa tùy chọn không; ai thấy ngân sách (Q6–Q9).
- Lát 2/3 có dùng nhịp/kiểu làm đầu vào gợi ý không (Q10).
- Lọc danh sách chuyến theo kiểu chuyến.
