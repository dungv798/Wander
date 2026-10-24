# Reconcile — Q16, sau vòng 1 (3 báo cáo stand-in, `source: emulated`)

`cite-check` trên 3 báo cáo: một lỗi thật (skeptic viết số mục §16 bằng dạng có dấu chấm, một mục không tồn tại; ý là mục số 10 của §16). Đã sửa có ghi chú trong file và trong `checkpoint.json` (amendments). Các số dòng skeptic trích đã đối chiếu với kế hoạch: dòng 179 (§7.1 "Danh tính ẩn danh") đúng; "Khớp với D8" nằm trong ghi chú D15 đúng; R16 thuộc 1b đúng; câu A-0 trích có đúng một lần trong kế hoạch. Dòng 142 (hàng Lát 0): tôi chỉ đọc được phần đầu hàng, trạng thái 🔶 của phần Q16 là `UNVERIFIED`.

## 1. Đồng thuận (độc lập, nhưng đồng thuận không phải là đúng)
- D15, D8, D19 `APPROVED`; cơ chế cụ thể (Q16, R13) `OPEN`; Q6, Q7 `OPEN`. Cả ba không chọn cơ chế.
- Mệnh đề A-0 "Người không có bằng chứng quyền không giành được quyền chủ chuyến" là `INFERENCE`; G7 là `UNVERIFIED`.
- Đánh đổi trung tâm: **mất quyền vĩnh viễn** (không có đường khôi phục) so với **bị chiếm quyền** (đường khôi phục yếu). Kênh liên hệ để khôi phục chạm ranh giới "không tài khoản đầy đủ" (D8/D14), ranh giới này chưa được định nghĩa (`UNVERIFIED`).
- Link/mã mời của 1b không được tự cấp quyền chủ chuyến: security (M2) và architect (invariant 9) cùng nêu, skeptic hỏi "link" của 1a là gì (S5). Đây là khoảng trống định nghĩa, chưa phải quyết định.

## 2. Bất đồng và khoảng trống
| # | Bên A | Bên B | Loại | Cách xử lý |
|---|---|---|---|---|
| G1 | architect: Q16(2), (4), (7), (8) "cần trả lời bằng bất kỳ phương án nào" | skeptic: (7), (8) "có thể đóng muộn nếu thiết kế 1a không loại trừ"; (8) thuộc 1b | diễn giải; **trọng yếu** (đổi những gì bạn phải trả lời trước khi duyệt thiết kế) | **Vòng 2**: architect + skeptic |
| G2 | skeptic F4: gọi `CONTRADICTION` giữa §15.1 (blocker: Q16, Q11) và §15.6 (thêm "xác nhận P13") | orchestrator: §15.1 là bảng *câu hỏi* mở, §15.6 là danh sách *blocker* gồm cả việc xác nhận một đề xuất; chưa thấy hai câu loại trừ nhau. Khớp với registry (`.claude/rules/wander-product-context.md`) | phân loại; **trọng yếu vừa** (nhãn CONTRADICTION là nhãn nặng) | **Vòng 2**: skeptic phải trích nguyên văn hai câu mâu thuẫn hoặc rút nhãn. Tạm ghi `INFERENCE` |
| G3 | security: §12 "`APPROVED` làm rủi ro" | bằng chứng: bảng §12 không có cột trạng thái, không có ✅ | sự kiện | **Bằng chứng giải quyết, không cần vòng 2**: bác nhãn `APPROVED`; giữ mức rủi ro như `PROPOSED` (mức do kế hoạch ghi, chưa được bạn duyệt) |
| G4 | skeptic F2: nếu "bằng chứng" là mã mang quyền thì mệnh đề A-0 trống nghĩa | architect: invariant 1 "không có bằng chứng hợp lệ thì không đọc/ghi/xóa với tư cách chủ" dưới phương án A (mã khôi phục) | diễn giải; **trọng yếu** (đổi việc "an toàn" nghĩa là gì khi bạn duyệt) | **Vòng 2**: architect trả lời invariant 1 có nội dung gì dưới phương án A |
| G5 | Tên phương án A–E (security) và A–C (architect) | | chỉ là ký hiệu | Không phải bất đồng; hai bộ nhãn độc lập, sẽ không gộp |

## 3. Khoảng trống bằng chứng (`UNVERIFIED`)
Định nghĩa "an toàn" và mô hình đe dọa; ranh giới "tài khoản đầy đủ"; "link/mã" của 1a là gì khi link mời thuộc 1b; dữ liệu cá nhân thực tế được thu; sửa đồng thời của cùng một chủ chuyến trên hai thiết bị ở 1a (R16 gán cho 1b); mức chấp nhận mất quyền vĩnh viễn; vòng đời bản sao lưu.

## 4. Quyết định về vòng 2
Có mục trọng yếu (G1, G2, G4) → **chạy vòng 2**, tối đa một vòng, chỉ `wander-software-architect` và `wander-skeptic-qa`; `wander-security-reviewer` không tham gia (G3 đã được bằng chứng giải quyết). Không có vòng 3.
